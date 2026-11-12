/**
 * Phase 1 store-core routes: countries, OTP stubs, quote/orders, COD controls, ledger, fulfill.
 * Mounted from index.js. Fail-closed when tables missing (additive migration).
 * Fee quotes: server/juvayFees.js is the source of truth (approved 4.5%/2.5% cap TT$25).
 */
const crypto = require('crypto');
const { listCountries } = require('./wamCountries');
const {
  feeBpsForPlan,
  defaultCodHandlingFeeCents,
  listingRateLimitPerHour,
  juvayFeeCents,
  quoteOrder,
  quoteAllRails,
  publicRateCard,
  feeConfig,
  adsEnabled,
  normalizeRail,
  paymentMethodForRail,
  paymentRailColumn,
  isOnlineWamRail,
  wamAvailableAt,
  summarizeSellerLedger,
  isRefundEvent,
  WAM_RATE_LABEL,
} = require('./juvayFees');
const { normalizeOrderLineItems, lineSubtotalCents } = require('./productModifiers');

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function isUndefinedCol(e) {
  return e && (e.code === '42703' || e.code === '42P01');
}

async function resolveStorePlan(pool, storeId) {
  const { rows: stores } = await pool.query(`SELECT * FROM stores WHERE id = $1`, [storeId]);
  if (!stores[0]) return { store: null, planSlug: 'free', planHandling: defaultCodHandlingFeeCents(), storeHandling: null };
  const ownerId = stores[0].owner_id;
  let planSlug = 'free';
  let planHandling = defaultCodHandlingFeeCents();
  try {
    const { rows: planRows } = await pool.query(
      `SELECT pt.slug, pt.juvay_fee_bps, pt.cod_handling_fee_cents
       FROM user_plan_subscriptions ups JOIN plan_tiers pt ON pt.slug = ups.plan_slug WHERE ups.user_id = $1`,
      [ownerId]
    );
    if (planRows[0]?.slug) planSlug = planRows[0].slug;
    if (planRows[0]?.cod_handling_fee_cents != null) planHandling = planRows[0].cod_handling_fee_cents;
  } catch (_) { /* subscriptions table optional */ }
  return {
    store: stores[0],
    planSlug,
    planHandling,
    storeHandling: stores[0].cod_handling_fee_cents,
  };
}

function handlingForStore(info) {
  return info.storeHandling != null ? info.storeHandling : info.planHandling;
}

function quotePayload(q, extras) {
  return {
    rail: q.rail,
    payment_method: q.payment_method,
    payment_rail: q.payment_rail,
    plan_slug: q.plan_slug,
    currency: q.currency || 'TTD',
    subtotal_cents: q.subtotal_cents,
    delivery_fee_cents: q.delivery_fee_cents,
    buyer_card_fee_cents: q.buyer_card_fee_cents,
    cod_handling_fee_cents: q.cod_handling_fee_cents,
    handling_fee_cents: q.handling_fee_cents,
    total_buyer_pays_cents: q.total_buyer_pays_cents,
    total_cents: q.total_cents,
    face_cents: q.face_cents,
    wam_fee_cents: q.wam_fee_cents,
    wam_fee_seller_cents: q.wam_fee_seller_cents,
    wam_pct_fee_cents: q.wam_pct_fee_cents,
    wam_flat_fee_cents: q.wam_flat_fee_cents,
    wam_flat_payer: q.wam_flat_payer,
    juvay_fee_cents: q.juvay_fee_cents,
    juvay_fee_bps: q.juvay_fee_bps,
    juvay_fee_cap_cents: q.juvay_fee_cap_cents,
    juvay_fee_cap_applied: q.juvay_fee_cap_applied,
    seller_net_cents: q.seller_net_cents,
    wam_rate_label: q.wam_rate_label || WAM_RATE_LABEL,
    settlement: q.settlement,
    nudge: q.nudge,
    lowest_fee: q.lowest_fee,
    zero_commission: q.zero_commission,
    ...(extras || {}),
  };
}

async function insertLedger(client, row) {
  const cols = `store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata, available_at`;
  const sql = `INSERT INTO order_ledger_entries (${cols})
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (idempotency_key) DO NOTHING`;
  const args = [
    row.store_id, row.order_id || null, row.wam_payment_id || null,
    row.entry_type, row.amount_cents, row.direction,
    row.idempotency_key, JSON.stringify(row.metadata || {}),
    row.available_at || null,
  ];
  try {
    await client.query(sql, args);
  } catch (e) {
    if (e.code === '42703') {
      // available_at not migrated yet
      await client.query(
        `INSERT INTO order_ledger_entries (store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        args.slice(0, 8)
      );
    } else if (e.code === '23514' && String(row.entry_type).startsWith('refund_')) {
      // refund types not in check constraint yet — record as adjustment
      const adjusted = { ...row, entry_type: 'adjustment', metadata: { ...(row.metadata || {}), refund_type: row.entry_type } };
      try {
        await client.query(sql, [
          adjusted.store_id, adjusted.order_id || null, adjusted.wam_payment_id || null,
          adjusted.entry_type, adjusted.amount_cents, adjusted.direction,
          adjusted.idempotency_key, JSON.stringify(adjusted.metadata),
          adjusted.available_at || null,
        ]);
      } catch (e2) {
        if (e2.code !== '42703') throw e2;
        await client.query(
          `INSERT INTO order_ledger_entries (store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [
            adjusted.store_id, adjusted.order_id || null, adjusted.wam_payment_id || null,
            adjusted.entry_type, adjusted.amount_cents, adjusted.direction,
            adjusted.idempotency_key, JSON.stringify(adjusted.metadata),
          ]
        );
      }
    } else {
      throw e;
    }
  }
}

function mountStoreCoreRoutes(app, { pool, auth, isWamConfigured }) {
  app.get('/api/wam/countries', (_req, res) => {
    res.json(listCountries({ includeBlocked: false }));
  });

  app.get('/api/themes', (_req, res) => {
    res.json({
      themes: [
        { id: 'food', name: 'Food', layout_family: 'menu' },
        { id: 'fashion', name: 'Fashion', layout_family: 'editorial' },
        { id: 'services', name: 'Services', layout_family: 'services' },
        { id: 'general', name: 'General', layout_family: 'dense_grid' },
        { id: 'beauty', name: 'Beauty', layout_family: 'editorial' },
        { id: 'home', name: 'Home', layout_family: 'dense_grid' },
        { id: 'electronics', name: 'Electronics', layout_family: 'dense_grid' },
        { id: 'auto', name: 'Auto', layout_family: 'dense_grid' },
        { id: 'doubles', name: 'Doubles vendor', layout_family: 'menu', gallery_category: 'street_food' },
        { id: 'street_food', name: 'Street food vendor', layout_family: 'menu', gallery_category: 'street_food' },
      ],
    });
  });

  // OTP — when OTP_PROVIDER=none or unset, return code in response for pickup/dev (never invent SMS send success)
  app.post('/api/otp/send', async (req, res) => {
    const phone = String(req.body?.phone || '').trim();
    const purpose = String(req.body?.purpose || 'buyer_order');
    if (!phone || phone.length < 7) return res.status(400).json({ error: 'Phone required' });
    const allowed = new Set(['signup', 'buyer_order', 'delivery', 'store_publish']);
    if (!allowed.has(purpose)) return res.status(400).json({ error: 'Invalid purpose' });
    const code = genOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    try {
      await pool.query(
        `INSERT INTO phone_otp_challenges (phone, purpose, code_hash, expires_at, store_id, order_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [phone, purpose, hashOtp(code), expires.toISOString(), req.body?.store_id || null, req.body?.order_id || null]
      );
    } catch (e) {
      if (e.code === '42P01') {
        return res.status(503).json({ error: 'OTP tables not migrated yet. Apply deploy/schema-store-core-p1.sql' });
      }
      return res.status(500).json({ error: e.message });
    }
    const provider = (process.env.OTP_PROVIDER || 'none').toLowerCase();
    if (provider === 'none') {
      return res.json({
        ok: true,
        delivery: 'dev_display',
        expires_in: 600,
        // Dev/local only — production must set OTP_PROVIDER and never return the code
        code,
        note: 'OTP_PROVIDER is none — code returned for local verify. Do not use this mode in production.',
      });
    }
    // Provider hooks not wired yet — fail closed rather than pretend SMS sent
    return res.status(503).json({
      error: 'SMS OTP provider is not wired yet. Set OTP_PROVIDER=none for local codes, or wait for provider integration.',
    });
  });

  app.post('/api/otp/verify', async (req, res) => {
    const phone = String(req.body?.phone || '').trim();
    const purpose = String(req.body?.purpose || 'buyer_order');
    const code = String(req.body?.code || '').trim();
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });
    try {
      const { rows } = await pool.query(
        `SELECT * FROM phone_otp_challenges
         WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > now()
         ORDER BY created_at DESC LIMIT 1`,
        [phone, purpose]
      );
      const row = rows[0];
      if (!row) return res.status(400).json({ error: 'No active code', verified: false });
      if (row.attempts >= 5) return res.status(429).json({ error: 'Too many attempts', verified: false });
      await pool.query(`UPDATE phone_otp_challenges SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
      if (row.code_hash !== hashOtp(code)) return res.status(400).json({ error: 'Invalid code', verified: false });
      await pool.query(`UPDATE phone_otp_challenges SET consumed_at = now() WHERE id = $1`, [row.id]);
      return res.json({ verified: true });
    } catch (e) {
      if (e.code === '42P01') return res.status(503).json({ error: 'OTP tables not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });


  app.get('/api/fees', (_req, res) => {
    res.json(publicRateCard());
  });

  // Promoted listings stub — feature-flagged off. No sell UI.
  app.get('/api/ads/status', (_req, res) => {
    res.json({
      enabled: adsEnabled(),
      ads_optional: true,
      note: adsEnabled()
        ? 'Promoted listings flag is on; sell UI is not shipped in this cut.'
        : 'Promoted listings are not for sale. ADS_ENABLED=false.',
    });
  });


  app.post('/api/orders/quote', async (req, res) => {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    let subtotalCents = Math.trunc(Number(body.subtotal_cents) || 0);
    if (items.length) {
      subtotalCents = lineSubtotalCents(normalizeOrderLineItems(items));
    }
    if (subtotalCents < 0) return res.status(400).json({ error: 'Subtotal must be >= 0' });
    const deliveryFeeCents = Math.max(0, Math.round(Number(body.delivery_fee_cents != null
      ? body.delivery_fee_cents
      : (Number(body.delivery_fee) || 0) * 100)) || 0);
    let planSlug = body.plan_slug || 'free';
    let handling = defaultCodHandlingFeeCents();
    let storeId = body.store_id || null;
    try {
      if (storeId) {
        const info = await resolveStorePlan(pool, storeId);
        if (!info.store) return res.status(404).json({ error: 'Store not found' });
        planSlug = info.planSlug;
        handling = handlingForStore(info);
      }
      const all = quoteAllRails({
        subtotalCents,
        deliveryFeeCents,
        planSlug,
        codHandlingFeeCents: handling,
      });
      const singleRail = normalizeRail(body.rail || body.payment_rail || body.payment_method);
      res.json({
        ...all,
        quotes: Object.fromEntries(Object.entries(all.quotes).map(([k, v]) => [k, quotePayload(v)])),
        selected: singleRail ? quotePayload(all.quotes[singleRail]) : undefined,
        wam_configured: isWamConfigured(),
        wam_rate_label: WAM_RATE_LABEL,
        note: isWamConfigured()
          ? 'Quote only. A charge does not fulfill the order.'
          : 'Online Wam pay is not configured on this host. Use cash pickup or cash on delivery.',
      });
    } catch (e) {
      if (e.code === '42P01') {
        // Stores table missing — still return a plan-default quote
        const all = quoteAllRails({ subtotalCents, deliveryFeeCents, planSlug, codHandlingFeeCents: handling });
        return res.json({
          ...all,
          quotes: Object.fromEntries(Object.entries(all.quotes).map(([k, v]) => [k, quotePayload(v)])),
          wam_configured: isWamConfigured(),
          wam_rate_label: WAM_RATE_LABEL,
          note: 'Store tables not migrated; quote uses plan defaults.',
        });
      }
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/orders/:id/quote', async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM store_orders WHERE id = $1`, [req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      const snap = o.quote_snapshot && typeof o.quote_snapshot === 'object' ? o.quote_snapshot : {};
      const rail = snap.rail || (o.payment_rail
        ? (o.payment_rail === 'card' ? 'wam_card' : 'wam_wallet')
        : (o.payment_method === 'wam' ? 'wam_wallet' : o.payment_method));
      let computed = null;
      try {
        computed = quoteOrder({
          subtotalCents: o.subtotal_cents,
          deliveryFeeCents: o.delivery_fee_cents,
          planSlug: snap.planSlug || snap.plan_slug || 'free',
          rail,
          codHandlingFeeCents: o.handling_fee_cents,
        });
      } catch (_) { computed = null; }
      const q = computed || snap;
      res.json({
        order_id: o.id,
        ...quotePayload({
          rail: q.rail || rail,
          payment_method: o.payment_method,
          payment_rail: o.payment_rail || q.payment_rail || null,
          plan_slug: q.plan_slug || snap.planSlug,
          currency: o.currency || 'TTD',
          subtotal_cents: o.subtotal_cents,
          delivery_fee_cents: o.delivery_fee_cents,
          buyer_card_fee_cents: o.buyer_card_fee_cents ?? q.buyer_card_fee_cents ?? snap.buyer_card_fee_cents ?? 0,
          cod_handling_fee_cents: o.handling_fee_cents,
          handling_fee_cents: o.handling_fee_cents,
          total_buyer_pays_cents: o.total_cents,
          total_cents: o.total_cents,
          face_cents: snap.face_cents ?? q.face_cents,
          wam_fee_cents: o.wam_fee_cents ?? q.wam_fee_cents ?? 0,
          wam_fee_seller_cents: o.wam_fee_seller_cents ?? q.wam_fee_seller_cents ?? 0,
          wam_pct_fee_cents: q.wam_pct_fee_cents,
          wam_flat_fee_cents: q.wam_flat_fee_cents,
          wam_flat_payer: q.wam_flat_payer,
          juvay_fee_cents: o.juvay_fee_cents,
          juvay_fee_bps: q.juvay_fee_bps ?? snap.bps ?? 0,
          juvay_fee_cap_cents: q.juvay_fee_cap_cents,
          juvay_fee_cap_applied: q.juvay_fee_cap_applied,
          seller_net_cents: o.seller_net_cents ?? q.seller_net_cents,
          wam_rate_label: WAM_RATE_LABEL,
          settlement: q.settlement,
          nudge: q.nudge,
          lowest_fee: q.lowest_fee,
          zero_commission: q.zero_commission,
        }),
        quote_snapshot: snap,
      });
    } catch (e) {
      if (e.code === '42P01') return res.status(503).json({ error: 'store_orders not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders', async (req, res) => {
    const body = req.body || {};
    const storeId = body.store_id;
    const items = Array.isArray(body.items) ? body.items : [];
    const rawMethod = body.payment_method || 'cod';
    const rawRail = body.payment_rail || body.rail || rawMethod;
    const rail = normalizeRail(rawRail) || (rawMethod === 'wam' ? 'wam_wallet' : (rawMethod === 'cash_pickup' ? 'cash_pickup' : 'cod'));
    const paymentMethod = paymentMethodForRail(rail);
    const fulfillment = body.fulfillment || (paymentMethod === 'cash_pickup' || rail === 'cash_pickup' ? 'pickup' : 'delivery');
    if (!storeId) return res.status(400).json({ error: 'store_id required' });
    if (!items.length) return res.status(400).json({ error: 'items required' });
    if (!['wam', 'cod', 'cash_pickup'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'payment_method must be wam, cod, or cash_pickup' });
    }
    const buyerName = String(body.customer_name || '').trim();
    const buyerPhone = String(body.customer_phone || '').trim();
    if (!buyerName || !buyerPhone) return res.status(400).json({ error: 'customer_name and customer_phone required' });

    const normalizedItems = normalizeOrderLineItems(items);
    const subtotalCents = lineSubtotalCents(normalizedItems);
    if (subtotalCents <= 0) return res.status(400).json({ error: 'Subtotal must be positive' });

    const deliveryFee = Math.round(Number(body.delivery_fee_cents != null
      ? body.delivery_fee_cents
      : (Number(body.delivery_fee) || 0) * 100)) || (fulfillment === 'delivery' && paymentMethod !== 'cash_pickup' ? 2500 : 0);

    try {
      const info = await resolveStorePlan(pool, storeId);
      if (!info.store) return res.status(404).json({ error: 'Store not found' });
      const q = quoteOrder({
        subtotalCents,
        deliveryFeeCents: deliveryFee,
        planSlug: info.planSlug,
        rail,
        codHandlingFeeCents: handlingForStore(info),
      });

      if (paymentMethod === 'wam' && !isWamConfigured()) {
        return res.status(503).json({ error: 'Paid checkout is not available. Use cash pickup or cash on delivery.' });
      }

      const orderRef = `JV${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const snapshot = quotePayload(q, {
        planSlug: info.planSlug,
        bps: q.juvay_fee_bps,
        face_cents: q.face_cents,
        wam_configured: isWamConfigured(),
      });

      const status = paymentMethod === 'wam' ? 'awaiting_payment' : 'pending';
      const payStatus = 'pending';

      const insertFull = `
        INSERT INTO store_orders (
          store_id, order_ref, buyer_name, buyer_phone, buyer_email, buyer_address,
          fulfillment, payment_method, payment_rail, subtotal_cents, delivery_fee_cents,
          handling_fee_cents, buyer_card_fee_cents, juvay_fee_cents, wam_fee_cents,
          wam_fee_seller_cents, seller_net_cents, total_cents, status, payment_status,
          items, quote_snapshot
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22
        ) RETURNING *`;
      const insertLegacy = `
        INSERT INTO store_orders (
          store_id, order_ref, buyer_name, buyer_phone, buyer_email, buyer_address,
          fulfillment, payment_method, subtotal_cents, delivery_fee_cents, handling_fee_cents,
          juvay_fee_cents, wam_fee_cents, total_cents, status, payment_status, items, quote_snapshot
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`;

      const fullArgs = [
        storeId, orderRef, buyerName, buyerPhone, body.customer_email || null, body.customer_address || null,
        fulfillment, paymentMethod, q.payment_rail, subtotalCents, deliveryFee,
        q.handling_fee_cents, q.buyer_card_fee_cents, q.juvay_fee_cents, q.wam_fee_cents,
        q.wam_fee_seller_cents, q.seller_net_cents, q.total_buyer_pays_cents, status, payStatus,
        JSON.stringify(normalizedItems), JSON.stringify(snapshot),
      ];
      const legacyArgs = [
        storeId, orderRef, buyerName, buyerPhone, body.customer_email || null, body.customer_address || null,
        fulfillment, paymentMethod, subtotalCents, deliveryFee, q.handling_fee_cents,
        q.juvay_fee_cents, q.wam_fee_seller_cents, q.total_buyer_pays_cents, status, payStatus,
        JSON.stringify(normalizedItems), JSON.stringify(snapshot),
      ];

      let rows;
      try {
        ({ rows } = await pool.query(insertFull, fullArgs));
      } catch (e) {
        if (e.code !== '42703') throw e;
        ({ rows } = await pool.query(insertLegacy, legacyArgs));
      }
      res.status(201).json({
        order: rows[0],
        quote: snapshot,
        fulfill: false,
        note: paymentMethod === 'wam'
          ? 'Order recorded as awaiting payment. A charge does not fulfill the order.'
          : undefined,
      });
    } catch (e) {
      if (e.code === '42P01') return res.status(503).json({ error: 'store_orders not migrated yet. Apply deploy/schema-store-core-p1.sql' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cod/orders/:id/confirm-dispatch', auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `UPDATE cod_orders SET dispatch_confirmed_at = now(), dispatch_confirmed_by = $2, order_status = CASE
           WHEN order_status = 'pending' THEN 'confirmed' ELSE order_status END
         WHERE id = $1 AND store_id IN (SELECT id FROM stores WHERE owner_id = $2)
         RETURNING *`,
        [req.params.id, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      res.json(rows[0]);
    } catch (e) {
      if (e.code === '42703') return res.status(503).json({ error: 'COD control columns not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cod/orders/:id/delivery-otp/send', auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT co.* FROM cod_orders co JOIN stores s ON s.id = co.store_id WHERE co.id = $1 AND s.owner_id = $2`,
        [req.params.id, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      if (!rows[0].dispatch_confirmed_at) {
        return res.status(400).json({ error: 'Confirm dispatch before sending delivery OTP' });
      }
      const code = genOtp();
      await pool.query(`UPDATE cod_orders SET delivery_otp_hash = $2 WHERE id = $1`, [req.params.id, hashOtp(code)]);
      const provider = (process.env.OTP_PROVIDER || 'none').toLowerCase();
      if (provider === 'none') {
        return res.json({ ok: true, delivery: 'dev_display', code, note: 'OTP_PROVIDER=none — code for local verify only' });
      }
      return res.status(503).json({ error: 'SMS OTP provider is not wired yet' });
    } catch (e) {
      if (e.code === '42703') return res.status(503).json({ error: 'COD control columns not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cod/orders/:id/delivery-otp/verify', auth, async (req, res) => {
    const code = String(req.body?.code || '').trim();
    if (!code) return res.status(400).json({ error: 'code required' });
    try {
      const { rows } = await pool.query(
        `SELECT co.* FROM cod_orders co JOIN stores s ON s.id = co.store_id WHERE co.id = $1 AND s.owner_id = $2`,
        [req.params.id, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      if (!rows[0].delivery_otp_hash || rows[0].delivery_otp_hash !== hashOtp(code)) {
        return res.status(400).json({ verified: false, error: 'Invalid code' });
      }
      const { rows: updated } = await pool.query(
        `UPDATE cod_orders SET delivery_otp_verified_at = now(), order_status = 'delivered', payment_status = 'collected', delivered_at = now()
         WHERE id = $1 RETURNING *`,
        [req.params.id]
      );
      res.json({ verified: true, order: updated[0] });
    } catch (e) {
      if (e.code === '42703') return res.status(503).json({ error: 'COD control columns not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/cod/orders/:id/refuse', auth, async (req, res) => {
    const reason = String(req.body?.reason || 'refused').trim().slice(0, 400);
    try {
      const { rows } = await pool.query(
        `UPDATE cod_orders SET refused_at = now(), refusal_reason = $3, order_status = 'returned', cancelled_at = now(), cancellation_reason = $3
         WHERE id = $1 AND store_id IN (SELECT id FROM stores WHERE owner_id = $2)
         RETURNING *`,
        [req.params.id, req.user.id, reason]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      res.json(rows[0]);
    } catch (e) {
      if (e.code === '42703') return res.status(503).json({ error: 'COD control columns not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });


  app.get('/api/seller/ledger', auth, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT le.* FROM order_ledger_entries le
         JOIN stores s ON s.id = le.store_id
         WHERE s.owner_id = $1
         ORDER BY le.created_at DESC LIMIT 200`,
        [req.user.id]
      );
      const sums = summarizeSellerLedger(rows);
      res.json({
        entries: rows,
        available_net_cents: sums.available_net_cents,
        pending_net_cents: sums.pending_net_cents,
        settlement_note: 'Juvay never holds funds beyond Wam settlement. Wallet is instant. Card is T+2 (' + WAM_RATE_LABEL + ').',
      });
    } catch (e) {
      if (e.code === '42P01') return res.json({ entries: [], available_net_cents: 0, pending_net_cents: 0, note: 'Ledger table not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/payouts', auth, async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT id, name, slug, wam_handle FROM stores WHERE owner_id = $1`,
        [req.user.id]
      );
      let entries = [];
      try {
        const { rows } = await pool.query(
          `SELECT le.* FROM order_ledger_entries le
           JOIN stores s ON s.id = le.store_id WHERE s.owner_id = $1`,
          [req.user.id]
        );
        entries = rows;
      } catch (_) { /* table may not exist */ }
      const sums = summarizeSellerLedger(entries);
      const feeLines = entries.filter((e) => e.entry_type === 'juvay_fee' || e.entry_type === 'wam_fee'
        || e.entry_type === 'refund_juvay_fee' || e.entry_type === 'refund_wam_fee');
      res.json({
        stores,
        available_net_cents: sums.available_net_cents,
        pending_net_cents: sums.pending_net_cents,
        fee_lines: feeLines,
        wam_configured: isWamConfigured(),
        settlement_note: 'Juvay never holds funds beyond Wam settlement. Wallet is instant. Card is T+2 (' + WAM_RATE_LABEL + ').',
        wam_rate_label: WAM_RATE_LABEL,
        note: isWamConfigured()
          ? 'Ledger totals reflect recorded fulfill events. Live payout settlement depends on Wam. This is not proof that pay→fulfill works.'
          : 'Wam is not configured on this host — online payouts unavailable.',
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/seller/payouts/wam-handle', auth, async (req, res) => {
    const handle = String(req.body?.handle || req.body?.wam_handle || '').trim();
    const storeId = req.body?.store_id;
    if (!handle) return res.status(400).json({ error: 'Wam handle required' });
    if (!isWamConfigured()) {
      return res.status(503).json({ error: 'Wam is not configured on this host' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE stores SET wam_handle = $1 WHERE id = $2 AND owner_id = $3 RETURNING id, slug, wam_handle`,
        [handle, storeId, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Store not found' });
      res.json(rows[0]);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });


  app.post('/api/orders/:id/refund', auth, async (req, res) => {
    const reason = String(req.body?.reason || 'refund').trim().slice(0, 400);
    try {
      const { rows } = await pool.query(
        `SELECT so.* FROM store_orders so
         JOIN stores s ON s.id = so.store_id
         WHERE so.id = $1 AND s.owner_id = $2`,
        [req.params.id, req.user.id]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const order = rows[0];
      if (order.status === 'refunded' || order.payment_status === 'refunded') {
        return res.json({ ok: true, duplicate: true, order, note: 'Already refunded on the Juvay ledger.' });
      }
      const result = await refundWamPayment(pool, {
        orderId: order.id,
        storeId: order.store_id,
        reason,
        actorUserId: req.user.id,
      });
      res.json({
        ok: true,
        duplicate: !!result.duplicate,
        order: result.order,
        reversed: result.reversed,
        note: 'Records a refund on the Juvay ledger only. A Wam refund must be initiated separately and is not claimed complete by this endpoint.',
      });
    } catch (e) {
      if (e.code === '42P01' || e.code === '42703') {
        return res.status(503).json({ error: 'Store-core or fee-system migration required for refunds', detail: e.message });
      }
      return res.status(500).json({ error: e.message });
    }
  });


  return { listingRateLimitPerHour, feeBpsForPlan, juvayFeeCents, quoteOrder };
}

function railFromOrder(order, pay) {
  const snap = order?.quote_snapshot && typeof order.quote_snapshot === 'object' ? order.quote_snapshot : {};
  if (snap.rail) return snap.rail;
  const col = order?.payment_rail || pay?.payment_rail;
  if (col === 'card') return 'wam_card';
  if (col === 'wallet') return 'wam_wallet';
  if (order?.payment_method === 'wam') return 'wam_wallet';
  return null;
}

function feesFromOrder(order, face, pay) {
  const snap = order?.quote_snapshot && typeof order.quote_snapshot === 'object' ? order.quote_snapshot : {};
  const rail = railFromOrder(order, pay);
  let juvayFee = order?.juvay_fee_cents;
  if (juvayFee == null) juvayFee = pay?.juvay_fee_cents;
  let wamSeller = order?.wam_fee_seller_cents;
  if (wamSeller == null) wamSeller = pay?.wam_fee_seller_cents;
  if (wamSeller == null && snap.wam_fee_seller_cents != null) wamSeller = snap.wam_fee_seller_cents;
  if ((juvayFee == null || wamSeller == null) && rail && isOnlineWamRail(rail)) {
    const recomputed = quoteOrder({
      subtotalCents: order?.subtotal_cents ?? snap.subtotal_cents ?? face,
      deliveryFeeCents: order?.delivery_fee_cents ?? snap.delivery_fee_cents ?? 0,
      planSlug: snap.planSlug || snap.plan_slug || 'free',
      rail,
      codHandlingFeeCents: 0,
    });
    if (juvayFee == null) juvayFee = recomputed.juvay_fee_cents;
    if (wamSeller == null) wamSeller = recomputed.wam_fee_seller_cents;
  }
  if (juvayFee == null) juvayFee = juvayFeeCents(face, feeBpsForPlan('free'));
  if (wamSeller == null) wamSeller = 0; // do not invent a Wam cut on legacy orders
  const merchantNet = Math.max(0, face - juvayFee - wamSeller);
  return { juvayFee, wamSeller, merchantNet, rail, snap };
}

/**
 * Fulfill once: mark payment fulfilled, update order, write ledger lines
 * (sale_gross, juvay_fee, wam_fee, merchant_net). Fees are only booked here.
 * Returns { fulfill, duplicate, paymentId }
 */
async function fulfillWamPayment(pool, {
  eventId, amountCents, faceCents, purpose, metadata, paymentId, orderId,
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (eventId) {
      const existing = await client.query(
        `SELECT * FROM wam_payments WHERE wam_event_id = $1 FOR UPDATE`,
        [eventId]
      );
      if (existing.rows[0]) {
        const row = existing.rows[0];
        await client.query('COMMIT');
        return {
          fulfill: row.status === 'fulfilled',
          duplicate: true,
          paymentId: row.id,
          orderId: row.order_id || null,
        };
      }
    }

    let pay = null;
    if (paymentId) {
      const r = await client.query(`SELECT * FROM wam_payments WHERE id = $1 FOR UPDATE`, [paymentId]);
      pay = r.rows[0];
    }
    if (!pay && orderId) {
      const r = await client.query(
        `SELECT * FROM wam_payments WHERE order_id = $1 AND status IN ('pending','recorded','captured') ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [orderId]
      );
      pay = r.rows[0];
    }

    const face = Number.isFinite(faceCents) ? faceCents : (pay?.face_cents || amountCents || 0);
    const amount = Number.isFinite(amountCents) ? amountCents : face;
    let oid = orderId || pay?.order_id || null;
    let storeId = pay?.store_id || null;
    let order = null;

    if (oid) {
      const o = await client.query(`SELECT * FROM store_orders WHERE id = $1 FOR UPDATE`, [oid]);
      if (o.rows[0]) {
        order = o.rows[0];
        storeId = storeId || order.store_id;
        await client.query(
          `UPDATE store_orders SET status = 'paid', payment_status = 'captured', updated_at = now() WHERE id = $1`,
          [oid]
        );
      }
    }

    const { juvayFee, wamSeller, merchantNet, rail } = feesFromOrder(order, face, pay);
    const fulfilledAt = new Date();
    const availableAt = wamAvailableAt(rail || 'wam_wallet', fulfilledAt);

    let paymentRow;
    const metaJson = JSON.stringify(metadata || {});
    if (pay) {
      let u;
      try {
        u = await client.query(
          `UPDATE wam_payments SET
             status = 'fulfilled', wam_event_id = COALESCE($2, wam_event_id),
             amount_cents = $3, face_cents = $4, juvay_fee_cents = $5, merchant_net_cents = $6,
             wam_fee_cents = $9, wam_fee_seller_cents = $9, payment_rail = COALESCE($10, payment_rail),
             available_at = $11,
             order_id = COALESCE($7, order_id), fulfilled_at = now(), updated_at = now(),
             metadata = COALESCE(metadata, '{}'::jsonb) || $8::jsonb
           WHERE id = $1 AND status <> 'fulfilled'
           RETURNING *`,
          [pay.id, eventId || null, amount, face, juvayFee, merchantNet, oid, metaJson,
           wamSeller, paymentRailColumn(rail), availableAt.toISOString()]
        );
      } catch (e) {
        if (e.code !== '42703') throw e;
        u = await client.query(
          `UPDATE wam_payments SET
             status = 'fulfilled', wam_event_id = COALESCE($2, wam_event_id),
             amount_cents = $3, face_cents = $4, juvay_fee_cents = $5, merchant_net_cents = $6,
             order_id = COALESCE($7, order_id), fulfilled_at = now(), updated_at = now(),
             metadata = COALESCE(metadata, '{}'::jsonb) || $8::jsonb
           WHERE id = $1 AND status <> 'fulfilled'
           RETURNING *`,
          [pay.id, eventId || null, amount, face, juvayFee, merchantNet, oid, metaJson]
        );
      }
      paymentRow = u.rows[0];
      if (!paymentRow) {
        await client.query('COMMIT');
        return { fulfill: true, duplicate: true, paymentId: pay.id, orderId: oid };
      }
    } else {
      try {
        const ins = await client.query(
          `INSERT INTO wam_payments (purpose, amount_cents, face_cents, wam_event_id, status, metadata, order_id, store_id, juvay_fee_cents, merchant_net_cents, wam_fee_cents, wam_fee_seller_cents, payment_rail, available_at, fulfilled_at)
           VALUES ($1,$2,$3,$4,'fulfilled',$5,$6,$7,$8,$9,$10,$10,$11,$12,now()) RETURNING *`,
          [purpose || 'webhook', amount, face, eventId, metaJson, oid, storeId, juvayFee, merchantNet, wamSeller, paymentRailColumn(rail), availableAt.toISOString()]
        );
        paymentRow = ins.rows[0];
      } catch (e) {
        if (e.code !== '42703') throw e;
        const ins = await client.query(
          `INSERT INTO wam_payments (purpose, amount_cents, face_cents, wam_event_id, status, metadata, order_id, store_id, juvay_fee_cents, merchant_net_cents, fulfilled_at)
           VALUES ($1,$2,$3,$4,'fulfilled',$5,$6,$7,$8,$9,now()) RETURNING *`,
          [purpose || 'webhook', amount, face, eventId, metaJson, oid, storeId, juvayFee, merchantNet]
        );
        paymentRow = ins.rows[0];
      }
    }

    if (storeId && paymentRow) {
      const avail = availableAt.toISOString();
      const meta = { eventId, rail, wam_rate_label: WAM_RATE_LABEL };
      await insertLedger(client, {
        store_id: storeId, order_id: oid, wam_payment_id: paymentRow.id,
        entry_type: 'sale_gross', amount_cents: face, direction: 'credit',
        idempotency_key: `ledger:${paymentRow.id}:sale_gross`, metadata: meta, available_at: avail,
      });
      await insertLedger(client, {
        store_id: storeId, order_id: oid, wam_payment_id: paymentRow.id,
        entry_type: 'juvay_fee', amount_cents: juvayFee, direction: 'debit',
        idempotency_key: `ledger:${paymentRow.id}:juvay_fee`, metadata: meta, available_at: avail,
      });
      await insertLedger(client, {
        store_id: storeId, order_id: oid, wam_payment_id: paymentRow.id,
        entry_type: 'wam_fee', amount_cents: wamSeller, direction: 'debit',
        idempotency_key: `ledger:${paymentRow.id}:wam_fee`,
        metadata: { ...meta, label: WAM_RATE_LABEL }, available_at: avail,
      });
      await insertLedger(client, {
        store_id: storeId, order_id: oid, wam_payment_id: paymentRow.id,
        entry_type: 'merchant_net', amount_cents: merchantNet, direction: 'credit',
        idempotency_key: `ledger:${paymentRow.id}:merchant_net`, metadata: meta, available_at: avail,
      });
    }

    await client.query('COMMIT');
    return { fulfill: true, duplicate: false, paymentId: paymentRow.id, orderId: oid };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Reverse ledger on refund. Only touches Juvay books — does not claim a Wam refund completed.
 */
async function refundWamPayment(pool, { eventId, paymentId, orderId, storeId, reason, actorUserId, metadata }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let pay = null;
    if (paymentId) {
      const r = await client.query(`SELECT * FROM wam_payments WHERE id = $1 FOR UPDATE`, [paymentId]);
      pay = r.rows[0];
    }
    if (!pay && orderId) {
      const r = await client.query(
        `SELECT * FROM wam_payments WHERE order_id = $1 AND status = 'fulfilled' ORDER BY fulfilled_at DESC LIMIT 1 FOR UPDATE`,
        [orderId]
      );
      pay = r.rows[0];
    }

    let order = null;
    const oid = orderId || pay?.order_id || null;
    if (oid) {
      const o = await client.query(`SELECT * FROM store_orders WHERE id = $1 FOR UPDATE`, [oid]);
      order = o.rows[0] || null;
    }
    const sid = storeId || order?.store_id || pay?.store_id;
    if (!sid) {
      await client.query('ROLLBACK');
      const err = new Error('No store on this refund');
      throw err;
    }

    if (order && (order.status === 'refunded' || order.payment_status === 'refunded')) {
      await client.query('COMMIT');
      return { duplicate: true, order, reversed: [] };
    }

    // Fees are only reversed if they were booked (fulfilled-once). Cash orders have 0 commission.
    const face = Number(pay?.face_cents ?? order?.quote_snapshot?.face_cents ?? (order ? (order.subtotal_cents + order.delivery_fee_cents) : 0));
    const { juvayFee, wamSeller, merchantNet, rail } = feesFromOrder(order, face, pay);
    const availableAt = pay?.available_at || (order && rail ? wamAvailableAt(rail, order.updated_at || new Date()) : new Date());
    const idBase = pay?.id || oid || eventId || 'manual';
    const meta = { eventId, reason, actorUserId, rail, refund: true, ...(metadata || {}) };
    const reversed = [];

    const lines = [
      { type: 'refund_sale_gross', amount: face, direction: 'debit', key: 'sale_gross' },
      { type: 'refund_juvay_fee', amount: juvayFee, direction: 'credit', key: 'juvay_fee' },
      { type: 'refund_wam_fee', amount: wamSeller, direction: 'credit', key: 'wam_fee' },
      { type: 'refund_merchant_net', amount: merchantNet, direction: 'debit', key: 'merchant_net' },
    ];
    for (const line of lines) {
      await insertLedger(client, {
        store_id: sid, order_id: oid, wam_payment_id: pay?.id || null,
        entry_type: line.type, amount_cents: line.amount, direction: line.direction,
        idempotency_key: `ledger:${idBase}:refund:${line.key}`,
        metadata: meta, available_at: availableAt instanceof Date ? availableAt.toISOString() : availableAt,
      });
      reversed.push(line);
    }

    if (order) {
      try {
        const { rows } = await client.query(
          `UPDATE store_orders SET status = 'refunded', payment_status = 'refunded', refunded_at = now(), refund_reason = $2, updated_at = now()
           WHERE id = $1 RETURNING *`,
          [oid, reason || null]
        );
        order = rows[0] || order;
      } catch (e) {
        if (e.code !== '42703') throw e;
        const { rows } = await client.query(
          `UPDATE store_orders SET status = 'refunded', payment_status = 'refunded', updated_at = now() WHERE id = $1 RETURNING *`,
          [oid]
        );
        order = rows[0] || order;
      }
    }
    if (pay) {
      try {
        await client.query(
          `UPDATE wam_payments SET refunded_at = now(), updated_at = now(), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb WHERE id = $1`,
          [pay.id, JSON.stringify({ refund: true, reason, eventId })]
        );
      } catch (e) {
        if (e.code !== '42703') throw e;
        await client.query(
          `UPDATE wam_payments SET updated_at = now(), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb WHERE id = $1`,
          [pay.id, JSON.stringify({ refund: true, reason, eventId })]
        );
      }
    }

    await client.query('COMMIT');
    return { duplicate: false, order, reversed, paymentId: pay?.id || null };
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { mountStoreCoreRoutes, fulfillWamPayment, refundWamPayment, hashOtp, isRefundEvent };
