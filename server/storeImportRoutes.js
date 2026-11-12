/**
 * Routes for Bring-my-store-over and photo-listing quota.
 * All writes land as product status=draft. Fail closed.
 */
'use strict';

const multer = require('multer');
const {
  importGate,
  photoQuotaState,
  statusPayload,
  importFromUrl,
  importFromCsvText,
  normalizeImportedItems,
  buildOnboardVision,
  FREE_PHOTO_LISTINGS,
  COMING_WITH_PREMIUM,
  PHOTO_QUOTA_LOCKED,
  NO_PRICE,
} = require('./storeImport');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 8 },
});

function csvTextFromReq(req) {
  if (req.file && req.file.buffer) return req.file.buffer.toString('utf8');
  if (typeof req.body?.csv === 'string') return req.body.csv;
  if (typeof req.body?.text === 'string') return req.body.text;
  return '';
}

function visionImageFromFile(file) {
  if (!file || !file.buffer) return '';
  const mime = String(file.mimetype || 'image/jpeg').replace(/[^a-zA-Z0-9/+.-]/g, '') || 'image/jpeg';
  if (!mime.startsWith('image/')) return '';
  return `data:${mime};base64,${file.buffer.toString('base64')}`;
}

async function loadOwnedStore(pool, storeId, userId) {
  if (!storeId) return { error: 'store_id is required', status: 400 };
  const { rows } = await pool.query(
    `SELECT * FROM stores WHERE id = $1 AND owner_id = $2`,
    [storeId, userId],
  );
  if (!rows[0]) return { error: 'Not your store', status: 403 };
  return { store: rows[0] };
}

function draftRow(item, storeId) {
  const price = item.price_found && item.price != null ? item.price : 0;
  const images = item.image_url ? [item.image_url] : item.image_data ? [item.image_data] : [];
  return {
    store_id: storeId,
    name: item.name,
    description: item.description || null,
    category: item.category || null,
    price,
    stock: null,
    images,
    status: 'draft',
    import_source: item.source || 'import',
    price_found: !!item.price_found,
  };
}

async function insertDrafts(pool, storeId, items, sourceKind, sourceUrl) {
  const created = [];
  for (const item of items) {
    const row = draftRow(item, storeId);
    const imgJson = JSON.stringify(row.images);
    let inserted;
    try {
      ({ rows: inserted } = await pool.query(
        `INSERT INTO products (store_id, name, description, category, price, stock, images, status, import_source, price_found)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9) RETURNING *`,
        [storeId, row.name, row.description, row.category, row.price, row.stock, imgJson, row.import_source, row.price_found],
      ));
    } catch (err) {
      if (err.code !== '42703') throw err;
      ({ rows: inserted } = await pool.query(
        `INSERT INTO products (store_id, name, description, category, price, stock, images, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'draft') RETURNING *`,
        [storeId, row.name, row.description, row.category, row.price, row.stock, imgJson],
      ));
    }
    created.push(publicDraft(inserted[0], item));
  }
  try {
    await pool.query(
      `INSERT INTO store_import_batches (store_id, source_kind, source_url, draft_count)
       VALUES ($1,$2,$3,$4)`,
      [storeId, sourceKind, sourceUrl || null, created.length],
    );
  } catch (err) {
    if (err.code !== '42P01' && err.code !== '42703') throw err;
  }
  return created;
}

function publicDraft(row, item) {
  const priceFound = row.price_found != null ? row.price_found : !!item?.price_found;
  return {
    id: row.id,
    store_id: row.store_id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: priceFound ? Number(row.price) : null,
    price_found: !!priceFound,
    image_url: Array.isArray(row.images) ? row.images[0] : (row.images && row.images[0]) || item?.image_url || '',
    status: 'draft',
    import_source: row.import_source || item?.source || null,
    note: priceFound ? undefined : NO_PRICE,
  };
}

function gateDenied(gate) {
  return {
    error: gate.message || COMING_WITH_PREMIUM,
    locked: true,
    coming_with_premium: true,
  };
}

function mountStoreImportRoutes(app, { pool, auth }) {
  app.get('/api/import/status', auth, async (req, res) => {
    try {
      const storeId = req.query.store_id || req.query.storeId;
      const loaded = storeId
        ? await loadOwnedStore(pool, storeId, req.user.id)
        : { store: { plan_tier: 'free', photo_listings_used: 0 } };
      if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
      res.json(statusPayload(loaded.store, process.env));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/import/url', (_req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ error: 'Use POST /api/import/url', allow: 'POST' });
  });
  app.post('/api/import/url', auth, async (req, res) => {
    try {
      const loaded = await loadOwnedStore(pool, req.body?.store_id, req.user.id);
      if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
      const gate = importGate(loaded.store, process.env);
      if (!gate.allowed) return res.status(403).json(gateDenied(gate));
      const url = req.body?.url || req.body?.source_url;
      const preview = req.body?.commit === false || req.body?.preview === true;
      const parsed = await importFromUrl(url);
      if (parsed.error) return res.status(parsed.status || 400).json({ error: parsed.error });
      if (preview) {
        return res.json({
          drafts: parsed.items,
          preview: true,
          source_url: parsed.source_url,
          source_kind: parsed.source_kind,
          note: 'Review these drafts, then confirm to save them. Prices appear only when found in the source.',
        });
      }
      const drafts = await insertDrafts(pool, loaded.store.id, parsed.items, parsed.source_kind, parsed.source_url);
      res.json({ drafts, source_url: parsed.source_url, source_kind: parsed.source_kind });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/import/csv', (_req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ error: 'Use POST /api/import/csv', allow: 'POST' });
  });
  app.post('/api/import/csv', auth, (req, res, next) => {
    const ct = String(req.headers['content-type'] || '');
    if (ct.includes('multipart/form-data')) return upload.single('csv')(req, res, next);
    next();
  }, async (req, res) => {
    try {
      const storeId = req.body?.store_id || req.query.store_id;
      const loaded = await loadOwnedStore(pool, storeId, req.user.id);
      if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
      const gate = importGate(loaded.store, process.env);
      if (!gate.allowed) return res.status(403).json(gateDenied(gate));
      const parsed = await importFromCsvText(csvTextFromReq(req));
      if (parsed.error) return res.status(parsed.status || 400).json({ error: parsed.error });
      const preview = req.body?.commit === 'false' || req.body?.commit === false || req.body?.preview === true || req.body?.preview === 'true';
      if (preview) {
        return res.json({
          drafts: parsed.items,
          preview: true,
          source_kind: 'csv',
          note: 'Review these drafts, then confirm to save them. Prices appear only when present in the CSV.',
        });
      }
      const drafts = await insertDrafts(pool, loaded.store.id, parsed.items, 'csv', null);
      res.json({ drafts, source_kind: 'csv' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/import/commit', (_req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ error: 'Use POST /api/import/commit', allow: 'POST' });
  });
  app.post('/api/import/commit', auth, async (req, res) => {
    try {
      const loaded = await loadOwnedStore(pool, req.body?.store_id, req.user.id);
      if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
      const gate = importGate(loaded.store, process.env);
      if (!gate.allowed) return res.status(403).json(gateDenied(gate));
      const items = normalizeImportedItems(req.body?.items || req.body?.drafts || []);
      if (items.length === 0) return res.status(400).json({ error: 'No products to save as drafts.' });
      const drafts = await insertDrafts(
        pool,
        loaded.store.id,
        items,
        String(req.body?.source_kind || 'import').slice(0, 40),
        req.body?.source_url || null,
      );
      res.json({ drafts, source_kind: req.body?.source_kind || 'import' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/import/photos', (_req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ error: 'Use POST /api/import/photos', allow: 'POST' });
  });
  app.post('/api/import/photos', auth, (req, res, next) => {
    const ct = String(req.headers['content-type'] || '');
    if (ct.includes('multipart/form-data')) return upload.array('photos', 8)(req, res, next);
    next();
  }, async (req, res) => {
    try {
      const storeId = req.body?.store_id;
      const loaded = await loadOwnedStore(pool, storeId, req.user.id);
      if (loaded.error) return res.status(loaded.status).json({ error: loaded.error });
      const quota = photoQuotaState(loaded.store, loaded.store.photo_listings_used);
      const files = Array.isArray(req.files) ? req.files : [];
      const dataUrls = [];
      if (files.length) {
        files.forEach((f) => {
          const url = visionImageFromFile(f);
          if (url) dataUrls.push(url);
        });
      } else if (Array.isArray(req.body?.images)) {
        req.body.images.forEach((img) => {
          if (typeof img === 'string' && img.startsWith('data:image/')) dataUrls.push(img);
        });
      } else if (typeof req.body?.image === 'string' && req.body.image.startsWith('data:image/')) {
        dataUrls.push(req.body.image);
      }
      if (dataUrls.length === 0) {
        return res.status(400).json({ error: 'Add at least one photo to draft a listing.' });
      }
      if (!quota.unlimited && dataUrls.length > quota.remaining) {
        return res.status(403).json({
          error: quota.locked ? PHOTO_QUOTA_LOCKED : `You have ${quota.remaining} of ${FREE_PHOTO_LISTINGS} free photo listings left.`,
          locked: quota.locked,
          coming_with_premium: quota.locked,
          photo_quota: quota,
        });
      }

      const drafts = [];
      const warnings = [];
      let used = Number(loaded.store.photo_listings_used) || 0;
      for (const image of dataUrls) {
        const vision = await buildOnboardVision({
          image,
          templateId: req.body?.templateId,
          storeName: req.body?.storeName || loaded.store.name,
        });
        if (vision.error) {
          warnings.push(vision.error);
          continue;
        }
        if (vision.locked || !vision.agentWrote || !vision.draft?.name) {
          warnings.push(vision.warning || 'Vision did not write this listing. Type the name and TT$ price yourself.');
          continue;
        }
        if (!quota.unlimited) {
          const bumped = await pool.query(
            `UPDATE stores
               SET photo_listings_used = photo_listings_used + 1
             WHERE id = $1 AND owner_id = $2 AND photo_listings_used < $3
             RETURNING photo_listings_used, plan_tier`,
            [loaded.store.id, req.user.id, FREE_PHOTO_LISTINGS],
          );
          if (!bumped.rows[0]) {
            return res.status(403).json({
              error: PHOTO_QUOTA_LOCKED,
              locked: true,
              coming_with_premium: true,
              drafts,
              warnings,
            });
          }
          used = bumped.rows[0].photo_listings_used;
        } else {
          try {
            const bumped = await pool.query(
              `UPDATE stores SET photo_listings_used = photo_listings_used + 1
               WHERE id = $1 AND owner_id = $2
               RETURNING photo_listings_used`,
              [loaded.store.id, req.user.id],
            );
            used = bumped.rows[0]?.photo_listings_used ?? used + 1;
          } catch (err) {
            if (err.code !== '42703') throw err;
          }
        }
        const item = {
          name: vision.draft.name,
          description: vision.draft.description || '',
          price: null,
          price_found: false,
          image_url: '',
          image_data: image,
          category: '',
          source: 'photo',
        };
        const created = await insertDrafts(pool, loaded.store.id, [item], 'photo', null);
        drafts.push(created[0]);
      }

      const nextQuota = photoQuotaState({ ...loaded.store, photo_listings_used: used }, used);
      res.json({
        drafts,
        warnings: warnings.length ? warnings : undefined,
        photo_quota: nextQuota,
        note: drafts.length
          ? 'These listings are drafts. Confirm the name and type the TT$ price before you publish. Vision never sets the price.'
          : undefined,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { mountStoreImportRoutes, publicDraft, insertDrafts };
