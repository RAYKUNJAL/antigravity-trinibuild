/**
 * Phase 1 store-core routes: countries, OTP stubs, quote/orders, COD controls, ledger, fulfill.
 * Mounted from index.js. Fail-closed when tables missing (additive migration).
 */
const crypto = require('crypto');
const { listCountries } = require('./wamCountries');
const { feeBpsForPlan, defaultCodHandlingFeeCents, listingRateLimitPerHour, juvayFeeCents } = require('./juvayFees');

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
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

  app.get('/api/orders/:id/quote', async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM store_orders WHERE id = $1`, [req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      res.json({
        order_id: o.id,
        currency: o.currency,
        subtotal_cents: o.subtotal_cents,
        delivery_fee_cents: o.delivery_fee_cents,
        handling_fee_cents: o.handling_fee_cents,
        juvay_fee_cents: o.juvay_fee_cents,
        wam_fee_cents: o.wam_fee_cents,
        total_cents: o.total_cents,
        payment_method: o.payment_method,
        quote_snapshot: o.quote_snapshot,
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
    const paymentMethod = body.payment_method || 'cod';
    const fulfillment = body.fulfillment || (paymentMethod === 'cash_pickup' ? 'pickup' : 'delivery');
    if (!storeId) return res.status(400).json({ error: 'store_id required' });
    if (!items.length) return res.status(400).json({ error: 'items required' });
    if (!['wam', 'cod', 'cash_pickup'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'payment_method must be wam, cod, or cash_pickup' });
    }
    const buyerName = String(body.customer_name || '').trim();
    const buyerPhone = String(body.customer_phone || '').trim();
    if (!buyerName || !buyerPhone) return res.status(400).json({ error: 'customer_name and customer_phone required' });

    const subtotalCents = items.reduce((s, i) => s + Math.round(Number(i.price) * 100) * Number(i.quantity || 1), 0);
    if (subtotalCents <= 0) return res.status(400).json({ error: 'Subtotal must be positive' });

    let planSlug = 'free';
    let handling = 0;
    let juvayFee = 0;
    const deliveryFee = Math.round(Number(body.delivery_fee || 0) * 100) || (fulfillment === 'delivery' && paymentMethod !== 'cash_pickup' ? 2500 : 0);

    try {
      const { rows: stores } = await pool.query(`SELECT * FROM stores WHERE id = $1`, [storeId]);
      if (!stores[0]) return res.status(404).json({ error: 'Store not found' });
      const ownerId = stores[0].owner_id;
      const { rows: planRows } = await pool.query(
        `SELECT pt.slug, pt.juvay_fee_bps, pt.cod_handling_fee_cents
         FROM user_plan_subscriptions ups JOIN plan_tiers pt ON pt.slug = ups.plan_slug WHERE ups.user_id = $1`,
        [ownerId]
      ).catch(() => ({ rows: [] }));
      planSlug = planRows[0]?.slug || 'free';
      const bps = planRows[0]?.juvay_fee_bps != null ? planRows[0].juvay_fee_bps : feeBpsForPlan(planSlug);
      const planHandling = planRows[0]?.cod_handling_fee_cents != null
        ? planRows[0].cod_handling_fee_cents
        : defaultCodHandlingFeeCents();
      const storeHandling = stores[0].cod_handling_fee_cents;
      handling = paymentMethod === 'cod'
        ? (storeHandling != null ? storeHandling : planHandling)
        : 0;
      juvayFee = paymentMethod === 'wam' ? juvayFeeCents(subtotalCents + deliveryFee, bps) : 0;

      if (paymentMethod === 'wam' && !isWamConfigured()) {
        return res.status(503).json({ error: 'Paid checkout is not available. Use cash pickup or cash on delivery.' });
      }

      const total = subtotalCents + deliveryFee + handling + (paymentMethod === 'wam' ? 0 : 0);
      // Buyer pays subtotal+delivery+handling for COD; for Wam, face is subtotal+delivery and Juvay fee is taken from capture (seller net)
      const faceCents = paymentMethod === 'wam' ? subtotalCents + deliveryFee : subtotalCents + deliveryFee + handling;
      const orderRef = `JV${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const snapshot = {
        planSlug,
        bps: paymentMethod === 'wam' ? bps : 0,
        juvay_fee_cents: juvayFee,
        handling_fee_cents: handling,
        face_cents: faceCents,
        wam_configured: isWamConfigured(),
      };

      const { rows } = await pool.query(
        `INSERT INTO store_orders (
          store_id, order_ref, buyer_name, buyer_phone, buyer_email, buyer_address,
          fulfillment, payment_method, subtotal_cents, delivery_fee_cents, handling_fee_cents,
          juvay_fee_cents, wam_fee_cents, total_cents, status, payment_status, items, quote_snapshot
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,0,$13,$14,$15,$16,$17) RETURNING *`,
        [
          storeId, orderRef, buyerName, buyerPhone, body.customer_email || null, body.customer_address || null,
          fulfillment, paymentMethod, subtotalCents, deliveryFee, handling, juvayFee,
          paymentMethod === 'wam' ? faceCents : faceCents,
          paymentMethod === 'wam' ? 'awaiting_payment' : 'pending',
          paymentMethod === 'wam' ? 'pending' : 'pending',
          JSON.stringify(items), JSON.stringify(snapshot),
        ]
      );
      res.status(201).json({ order: rows[0], quote: snapshot, fulfill: false });
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
         ORDER BY le.created_at DESC LIMIT 100`,
        [req.user.id]
      );
      res.json({ entries: rows });
    } catch (e) {
      if (e.code === '42P01') return res.json({ entries: [], note: 'Ledger table not migrated yet' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/payouts', auth, async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT id, name, slug, wam_handle FROM stores WHERE owner_id = $1`,
        [req.user.id]
      );
      let net = 0;
      try {
        const { rows: sums } = await pool.query(
          `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount_cents ELSE -amount_cents END),0) AS net
           FROM order_ledger_entries le JOIN stores s ON s.id = le.store_id WHERE s.owner_id = $1`,
          [req.user.id]
        );
        net = Number(sums[0]?.net || 0);
      } catch (_) { /* table may not exist */ }
      res.json({
        stores,
        pending_net_cents: net,
        wam_configured: isWamConfigured(),
        note: isWamConfigured()
          ? 'Ledger totals reflect recorded fulfill events. Live payout settlement depends on Wam.'
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

  return { listingRateLimitPerHour, feeBpsForPlan, juvayFeeCents };
}

/**
 * Fulfill once: mark payment fulfilled, update order, write ledger lines.
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
    let juvayFee = pay?.juvay_fee_cents;
    let planBps = feeBpsForPlan('free');

    if (oid) {
      const o = await client.query(`SELECT * FROM store_orders WHERE id = $1 FOR UPDATE`, [oid]);
      if (o.rows[0]) {
        storeId = storeId || o.rows[0].store_id;
        juvayFee = o.rows[0].juvay_fee_cents;
        await client.query(
          `UPDATE store_orders SET status = 'paid', payment_status = 'captured', updated_at = now() WHERE id = $1`,
          [oid]
        );
      }
    }

    if (juvayFee == null) juvayFee = juvayFeeCents(face, planBps);
    const merchantNet = Math.max(0, face - juvayFee);

    let paymentRow;
    if (pay) {
      const u = await client.query(
        `UPDATE wam_payments SET
           status = 'fulfilled', wam_event_id = COALESCE($2, wam_event_id),
           amount_cents = $3, face_cents = $4, juvay_fee_cents = $5, merchant_net_cents = $6,
           order_id = COALESCE($7, order_id), fulfilled_at = now(), updated_at = now(),
           metadata = COALESCE(metadata, '{}'::jsonb) || $8::jsonb
         WHERE id = $1 AND status <> 'fulfilled'
         RETURNING *`,
        [pay.id, eventId || null, amount, face, juvayFee, merchantNet, oid, JSON.stringify(metadata || {})]
      );
      paymentRow = u.rows[0];
      if (!paymentRow) {
        await client.query('COMMIT');
        return { fulfill: true, duplicate: true, paymentId: pay.id, orderId: oid };
      }
    } else {
      const ins = await client.query(
        `INSERT INTO wam_payments (purpose, amount_cents, face_cents, wam_event_id, status, metadata, order_id, store_id, juvay_fee_cents, merchant_net_cents, fulfilled_at)
         VALUES ($1,$2,$3,$4,'fulfilled',$5,$6,$7,$8,$9,now()) RETURNING *`,
        [purpose || 'webhook', amount, face, eventId, JSON.stringify(metadata || {}), oid, storeId, juvayFee, merchantNet]
      );
      paymentRow = ins.rows[0];
    }

    if (storeId && paymentRow) {
      const idemGross = `ledger:${paymentRow.id}:sale_gross`;
      const idemFee = `ledger:${paymentRow.id}:juvay_fee`;
      const idemNet = `ledger:${paymentRow.id}:merchant_net`;
      await client.query(
        `INSERT INTO order_ledger_entries (store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata)
         VALUES ($1,$2,$3,'sale_gross',$4,'credit',$5,$6)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [storeId, oid, paymentRow.id, face, idemGross, JSON.stringify({ eventId })]
      );
      await client.query(
        `INSERT INTO order_ledger_entries (store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata)
         VALUES ($1,$2,$3,'juvay_fee',$4,'debit',$5,$6)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [storeId, oid, paymentRow.id, juvayFee, idemFee, JSON.stringify({ eventId })]
      );
      await client.query(
        `INSERT INTO order_ledger_entries (store_id, order_id, wam_payment_id, entry_type, amount_cents, direction, idempotency_key, metadata)
         VALUES ($1,$2,$3,'merchant_net',$4,'credit',$5,$6)
         ON CONFLICT (idempotency_key) DO NOTHING`,
        [storeId, oid, paymentRow.id, merchantNet, idemNet, JSON.stringify({ eventId })]
      );
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

module.exports = { mountStoreCoreRoutes, fulfillWamPayment, hashOtp };
