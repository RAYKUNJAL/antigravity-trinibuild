/**
 * Year-end CRO + growth helpers and routes.
 * Reviews only from completed orders. Premium checkout is flag-gated OFF by default.
 * WhatsApp alerts are wa.me deep links only — Juvay does not send WhatsApp.
 * Availability and levels read real data. Missing tables fail closed, not with invented rows.
 */
'use strict';

const { computeLevel, statsFromRows } = require('./sellerLevels');
const { normalizeWhatsappE164 } = require('./storefrontHonesty');

const PREMIUM_OFFER = {
  id: 'premium',
  name: 'Premium',
  intro_price_ttd: 49,
  intro_months: 3,
  then_price_ttd: 79,
  currency: 'TTD',
  period: '/month',
  juvay_fee_bps: 250,
  features: [
    'Lower 2.5% Juvay fee on successful online Wam sales, capped at TT$25',
    'Unlimited listings (same as Free)',
    '0% Juvay commission on cash pickup and cash on delivery',
    'Custom domain option when that rail is offered',
  ],
  note: 'Intro TT$49/month for the first 3 months, then TT$79/month. Prices are the year-end offer, not a live charge. Checkout stays off until PREMIUM_CHECKOUT_ENABLED=true and a real pay path is proven.',
};

function isPremiumCheckoutEnabled(env) {
  const e = env || process.env;
  return String(e.PREMIUM_CHECKOUT_ENABLED || '').trim().toLowerCase() === 'true';
}

function premiumPayload(env) {
  const enabled = isPremiumCheckoutEnabled(env);
  return {
    offer: PREMIUM_OFFER,
    checkout_enabled: enabled,
    buy_button: enabled,
    message: enabled
      ? 'Premium checkout flag is on. A charge does not auto-upgrade a plan until pay→fulfill is proven.'
      : 'Premium checkout is not open yet. PREMIUM_CHECKOUT_ENABLED=false. The 2.5% fee applies once a shop is on Premium.',
  };
}

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function phonesMatch(a, b) {
  const da = digitsOnly(a);
  const db = digitsOnly(b);
  if (!da || !db) return false;
  if (da === db) return true;
  // Last 10 digits (Caribbean / NANP) so +1-868 vs 868 match.
  const ta = da.length > 10 ? da.slice(-10) : da;
  const tb = db.length > 10 ? db.slice(-10) : db;
  return ta.length >= 7 && ta === tb;
}

function maskPhone(raw) {
  const d = digitsOnly(raw);
  if (d.length < 4) return '';
  return '••••' + d.slice(-4);
}

function waMe(e164, text) {
  const n = normalizeWhatsappE164(e164);
  if (!n) return null;
  const base = `https://wa.me/${n.replace('+', '')}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function formatOrderLines(items) {
  const list = Array.isArray(items) ? items : [];
  return list.map((l) => {
    const name = String(l.name || l.item_name || l.title || 'Item').trim() || 'Item';
    const qty = Math.max(1, Math.trunc(Number(l.qty || l.quantity) || 1));
    const mods = l.selected_modifiers || l.selectedModifiers || [];
    const modTxt = Array.isArray(mods) && mods.length
      ? ` (${mods.map((m) => m.optionLabel || m.option_label || m.label).filter(Boolean).join(', ')})`
      : '';
    return `${name} ×${qty}${modTxt}`;
  }).join('; ');
}

function formatTtdCents(cents) {
  const n = Math.trunc(Number(cents) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}TT$${(abs / 100).toFixed(2)}`;
}

function vendorNewOrderWaText(input) {
  const ref = input.order_ref || input.orderRef || '';
  const store = input.store_name || input.storeName || 'your shop';
  const lines = formatOrderLines(input.items);
  const total = input.total_cents != null ? formatTtdCents(input.total_cents) : (input.total || '');
  const fulfill = input.fulfillment === 'pickup' || input.payment_method === 'cash_pickup'
    ? 'Cash pickup'
    : (input.payment_method === 'cod' || input.rail === 'cod' ? 'Cash on delivery' : 'Order');
  const buyer = input.buyer_name || input.buyerName || 'a buyer';
  return `New Juvay order ${ref} for ${store}: ${lines}. ${fulfill}. ${total}. From ${buyer}. Juvay does not send WhatsApp for you — this is a draft for you to send.`;
}

function vendorOrderWaMe(input) {
  return waMe(input.vendor_e164 || input.whatsappE164, vendorNewOrderWaText(input));
}

function customerOrderWaMe(input) {
  const ref = input.order_ref || '';
  const text = `Hi, I placed order ${ref} at ${input.store_name || 'your shop'}. ${formatOrderLines(input.items)}.`;
  return waMe(input.vendor_e164 || input.whatsappE164, text);
}

function customerFollowupWaMe(input) {
  const phone = input.buyer_phone || input.customer_phone;
  // Buyer phone may not be E.164 stored; try normalize, else prefix + if already international.
  let e164 = normalizeWhatsappE164(phone);
  if (!e164 && digitsOnly(phone).length >= 8) {
    const d = digitsOnly(phone);
    e164 = normalizeWhatsappE164(d.startsWith('1') || d.startsWith('868') ? `+${d}` : `+1${d}`);
  }
  const ref = input.order_ref || '';
  const text = `Hi ${input.buyer_name || ''}, this is ${input.store_name || 'the shop'} about Juvay order ${ref}.`.replace(/\s+/g, ' ').trim();
  return waMe(e164, text);
}

const COMPLETED_FOR_REVIEW = new Set(['delivered']);

function orderAllowsReview(order) {
  if (!order) return { ok: false, error: 'Order not found' };
  const status = String(order.status || '').toLowerCase();
  const pay = String(order.payment_status || '').toLowerCase();
  const completed = COMPLETED_FOR_REVIEW.has(status)
    || (pay === 'collected' && !['cancelled', 'refused', 'refunded', 'pending', 'awaiting_payment'].includes(status));
  if (!completed) return { ok: false, error: 'Reviews are only accepted on completed orders.' };
  if (order.review_id) return { ok: false, error: 'This order already has a review.' };
  return { ok: true };
}

function validateReviewInput(body) {
  const rating = Number(body && body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be a whole number from 1 to 5.', status: 400 };
  }
  const text = body && body.body != null ? String(body.body).trim() : '';
  if (text.length > 2000) return { error: 'Review is too long (max 2000 characters).', status: 400 };
  const orderRef = String((body && (body.order_ref || body.orderRef)) || '').trim();
  const phone = String((body && (body.buyer_phone || body.customer_phone || body.phone)) || '').trim();
  if (!orderRef) return { error: 'order_ref is required.', status: 400 };
  if (!phone) return { error: 'buyer_phone is required to confirm this was your order.', status: 400 };
  const productId = (body && (body.product_id || body.productId)) || null;
  return {
    review: {
      rating,
      body: text || null,
      order_ref: orderRef,
      buyer_phone: phone,
      product_id: productId ? String(productId) : null,
    },
  };
}

function publicReviewList(rows) {
  const list = (rows || []).filter((r) => r && r.published !== false);
  const count = list.length;
  let average = null;
  if (count > 0) {
    average = Math.round((list.reduce((s, r) => s + Number(r.rating), 0) / count) * 100) / 100;
  }
  return {
    count,
    average, // null when 0 — never 0.0 or 5.0 invented
    reviews: list.map((r) => ({
      id: r.id,
      rating: Number(r.rating),
      body: r.body || null,
      created_at: r.created_at,
      // no full phone, no fake name
    })),
    empty_copy: count === 0 ? 'No reviews yet' : null,
    show_stars: count > 0,
  };
}

function publicOrderShape(order, extras) {
  if (!order) return null;
  const x = extras || {};
  return {
    id: order.id,
    order_ref: order.order_ref,
    store_id: order.store_id,
    store_name: x.store_name || order.store_name || null,
    store_slug: x.store_slug || order.store_slug || null,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    payment_rail: order.payment_rail || null,
    fulfillment: order.fulfillment,
    items: order.items,
    subtotal_cents: order.subtotal_cents,
    delivery_fee_cents: order.delivery_fee_cents,
    handling_fee_cents: order.handling_fee_cents,
    buyer_card_fee_cents: order.buyer_card_fee_cents,
    total_cents: order.total_cents,
    currency: order.currency || 'TTD',
    created_at: order.created_at,
    buyer_name: order.buyer_name,
    buyer_phone_masked: maskPhone(order.buyer_phone),
    can_review: orderAllowsReview({ ...order, review_id: x.review_id }).ok,
    has_review: !!x.review_id,
    vendor_whatsapp: vendorOrderWaMe({
      vendor_e164: x.whatsapp,
      order_ref: order.order_ref,
      store_name: x.store_name,
      items: order.items,
      total_cents: order.total_cents,
      fulfillment: order.fulfillment,
      payment_method: order.payment_method,
      buyer_name: order.buyer_name,
    }),
    customer_whatsapp: customerOrderWaMe({
      vendor_e164: x.whatsapp,
      order_ref: order.order_ref,
      store_name: x.store_name,
      items: order.items,
    }),
    seller_customer_whatsapp: x.include_seller_wa
      ? customerFollowupWaMe({
        buyer_phone: order.buyer_phone,
        buyer_name: order.buyer_name,
        store_name: x.store_name,
        order_ref: order.order_ref,
      })
      : undefined,
    note: 'A charge does not fulfill the order. WhatsApp links open a draft — Juvay does not send the message.',
    fulfill: false,
  };
}

function firstSaleChecklist(input) {
  const products = Array.isArray(input.products) ? input.products : [];
  const priced = products.filter((p) => p && String(p.name || '').trim() && Number(p.price) > 0);
  const withPhoto = products.some((p) => p && (p.image_url || p.image || (Array.isArray(p.images) && p.images.length)));
  const hero = !!(input.hero_image || input.logo);
  const hasPhoto = withPhoto || hero;
  const hasPrice = priced.length > 0;
  const hasShare = input.shared === true; // only when we know; otherwise the step is offered, not marked done
  const hasQrPrint = input.qr_printed === true;
  const steps = [
    { id: 'photo', label: 'Add a photo', done: hasPhoto, hint: 'A photo of the stall or a real item. No sample pictures.' },
    { id: 'price', label: 'Add a priced item', done: hasPrice, hint: 'Name and a price greater than TT$0.' },
    { id: 'share', label: 'Share your store link', done: hasShare, hint: 'Send the link on WhatsApp. We do not mark this done unless you tell us.' },
    { id: 'qr', label: 'Print your stall QR sign', done: hasQrPrint, hint: 'Free printable sign for your stall.' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return {
    steps,
    done_count: doneCount,
    complete: steps.every((s) => s.id === 'share' || s.id === 'qr' ? s.done : s.done) && hasPhoto && hasPrice,
    next: steps.find((s) => !s.done) || null,
    ready_for_orders: hasPhoto && hasPrice,
  };
}

function tableMissing(e) {
  return e && (e.code === '42P01' || e.code === '42703');
}

function mountCroYearEndRoutes(app, { pool, auth }) {
  app.get('/api/premium', (_req, res) => {
    res.json(premiumPayload());
  });

  app.post('/api/premium/checkout', auth, (_req, res) => {
    if (!isPremiumCheckoutEnabled()) {
      return res.status(403).json({
        error: 'Premium checkout is not open yet.',
        checkout_enabled: false,
        offer: PREMIUM_OFFER,
      });
    }
    return res.status(503).json({
      error: 'Premium checkout flag is on, but a live pay path is not proven. No charge was taken.',
      checkout_enabled: true,
      fulfill: false,
    });
  });

  app.get('/api/seller/level', auth, async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id],
      );
      if (!stores[0]) return res.status(404).json({ error: 'No store yet.' });
      const store = stores[0];
      let orders = [];
      try {
        const r = await pool.query(`SELECT * FROM store_orders WHERE store_id = $1`, [store.id]);
        orders = r.rows;
      } catch (e) {
        if (!tableMissing(e)) throw e;
      }
      let reviews = [];
      try {
        const r = await pool.query(
          `SELECT * FROM store_reviews WHERE store_id = $1 AND published = true`,
          [store.id],
        );
        reviews = r.rows;
      } catch (e) {
        if (!tableMissing(e)) throw e;
      }
      const wamVerified = !!store.wam_verified_at;
      const stats = statsFromRows({ orders, reviews, wamVerified });
      const result = computeLevel(stats);
      res.json({
        store_id: store.id,
        slug: store.slug,
        name: store.name,
        wam_verified: wamVerified,
        verified_badge_free: true,
        ...result,
      });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'Store tables not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/ops', auth, async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id],
      );
      if (!stores[0]) return res.status(404).json({ error: 'No store yet.' });
      const store = stores[0];
      let products = [];
      try {
        const r = await pool.query(
          `SELECT id, name, price, stock, status, images, image_url, sold_out, modifier_groups
           FROM products WHERE store_id = $1 ORDER BY created_at DESC`,
          [store.id],
        );
        products = r.rows;
      } catch (e) {
        if (e.code === '42703') {
          const r = await pool.query(
            `SELECT id, name, price, stock, status, images FROM products WHERE store_id = $1 ORDER BY created_at DESC`,
            [store.id],
          );
          products = r.rows;
        } else if (!tableMissing(e)) throw e;
      }
      const checklist = firstSaleChecklist({
        products,
        hero_image: (store.theme_config && (store.theme_config.hero && store.theme_config.hero.image)) || store.logo_url,
        logo: store.logo_url,
      });
      res.json({
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          whatsapp: store.whatsapp || null,
          sold_out_today: store.sold_out_today === true,
          open_now: typeof store.open_now === 'boolean' ? store.open_now : null,
          prep_minutes: store.prep_minutes != null ? Number(store.prep_minutes) : null,
          wam_handle: store.wam_handle || null,
          wam_verified: !!store.wam_verified_at,
          accepts_pickup: store.accepts_pickup === true,
          accepts_cod: store.accepts_cod === true,
          pickup_address: store.pickup_address || store.address || null,
        },
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          sold_out: p.sold_out === true || Number(p.stock) === 0,
          status: p.status,
          has_photo: !!(p.image_url || (Array.isArray(p.images) && p.images.length)),
        })),
        checklist,
        stall_sign_path: `/store/${store.slug}/sign`,
      });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'Store tables not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/seller/availability', auth, async (req, res) => {
    const body = req.body || {};
    try {
      const { rows: stores } = await pool.query(
        `SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id],
      );
      if (!stores[0]) return res.status(404).json({ error: 'No store yet.' });
      const store = stores[0];
      const sets = [];
      const args = [];
      const push = (col, val) => { args.push(val); sets.push(`${col} = $${args.length}`); };
      if (typeof body.sold_out_today === 'boolean') push('sold_out_today', body.sold_out_today);
      if (typeof body.open_now === 'boolean' || body.open_now === null) push('open_now', body.open_now);
      if (body.prep_minutes !== undefined) {
        if (body.prep_minutes === null || body.prep_minutes === '') push('prep_minutes', null);
        else {
          const n = Math.trunc(Number(body.prep_minutes));
          if (!Number.isFinite(n) || n < 0 || n > 24 * 60) {
            return res.status(400).json({ error: 'prep_minutes must be 0–1440 or empty.' });
          }
          push('prep_minutes', n);
        }
      }
      if (!sets.length) return res.status(400).json({ error: 'No availability fields to update.' });
      args.push(store.id);
      const { rows } = await pool.query(
        `UPDATE stores SET ${sets.join(', ')}, updated_at = now() WHERE id = $${args.length} RETURNING id, slug, sold_out_today, open_now, prep_minutes`,
        args,
      );
      res.json({ store: rows[0] });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'Availability columns not migrated yet. Apply deploy/schema-cro-yearend.sql' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/seller/products/:id/availability', auth, async (req, res) => {
    const body = req.body || {};
    try {
      const { rows: owned } = await pool.query(
        `SELECT p.* FROM products p JOIN stores s ON s.id = p.store_id
         WHERE p.id = $1 AND s.owner_id = $2`,
        [req.params.id, req.user.id],
      );
      if (!owned[0]) return res.status(404).json({ error: 'Product not found.' });
      const soldOut = typeof body.sold_out === 'boolean' ? body.sold_out : undefined;
      if (soldOut == null && body.stock == null) {
        return res.status(400).json({ error: 'sold_out or stock required.' });
      }
      let rows;
      try {
        if (soldOut != null && body.stock != null) {
          ({ rows } = await pool.query(
            `UPDATE products SET sold_out = $2, stock = $3 WHERE id = $1 RETURNING id, name, sold_out, stock, status`,
            [req.params.id, soldOut, Math.trunc(Number(body.stock)) || 0],
          ));
        } else if (soldOut != null) {
          ({ rows } = await pool.query(
            `UPDATE products SET sold_out = $2${soldOut ? ', stock = 0' : ''} WHERE id = $1 RETURNING id, name, sold_out, stock, status`,
            [req.params.id, soldOut],
          ));
        } else {
          ({ rows } = await pool.query(
            `UPDATE products SET stock = $2 WHERE id = $1 RETURNING id, name, stock, status`,
            [req.params.id, Math.trunc(Number(body.stock)) || 0],
          ));
        }
      } catch (e) {
        if (e.code !== '42703') throw e;
        // sold_out column missing — fall back to stock = 0
        const stock = soldOut === true ? 0 : (body.stock != null ? Math.trunc(Number(body.stock)) || 0 : owned[0].stock);
        ({ rows } = await pool.query(
          `UPDATE products SET stock = $2 WHERE id = $1 RETURNING id, name, stock, status`,
          [req.params.id, stock],
        ));
      }
      res.json({ product: rows[0] });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'Products table not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/seller/orders', auth, async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT * FROM stores WHERE owner_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [req.user.id],
      );
      if (!stores[0]) return res.status(404).json({ error: 'No store yet.' });
      const store = stores[0];
      const { rows } = await pool.query(
        `SELECT * FROM store_orders WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [store.id],
      );
      res.json({
        orders: rows.map((o) => publicOrderShape(o, {
          store_name: store.name,
          store_slug: store.slug,
          whatsapp: store.whatsapp,
          include_seller_wa: true,
        })),
        whatsapp_note: 'Tap a WhatsApp link to open a draft to the customer. Juvay does not send WhatsApp. There is no paid sender in this cut.',
      });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'store_orders not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/store-orders/track/:ref', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT so.*, s.name AS store_name, s.slug AS store_slug, s.whatsapp
         FROM store_orders so JOIN stores s ON s.id = so.store_id
         WHERE so.order_ref = $1`,
        [req.params.ref],
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      let reviewId = null;
      try {
        const r = await pool.query(`SELECT id FROM store_reviews WHERE order_id = $1 LIMIT 1`, [o.id]);
        reviewId = r.rows[0] && r.rows[0].id;
      } catch (e) {
        if (!tableMissing(e)) throw e;
      }
      res.json(publicOrderShape(o, {
        store_name: o.store_name,
        store_slug: o.store_slug,
        whatsapp: o.whatsapp,
        review_id: reviewId,
      }));
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'store_orders not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/stores/:slug/reviews', async (req, res) => {
    try {
      const { rows: stores } = await pool.query(
        `SELECT id, slug, name FROM stores WHERE slug = $1`,
        [req.params.slug],
      );
      if (!stores[0]) return res.status(404).json({ error: 'Store not found' });
      const { rows } = await pool.query(
        `SELECT id, rating, body, created_at, published FROM store_reviews
         WHERE store_id = $1 AND published = true
         ORDER BY created_at DESC LIMIT 100`,
        [stores[0].id],
      );
      res.json({ store_id: stores[0].id, slug: stores[0].slug, ...publicReviewList(rows) });
    } catch (e) {
      if (tableMissing(e)) {
        return res.json({
          store_id: null,
          slug: req.params.slug,
          count: 0,
          average: null,
          reviews: [],
          empty_copy: 'No reviews yet',
          show_stars: false,
          note: 'Reviews table not migrated yet.',
        });
      }
      return res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/orders/:ref/reviews', async (req, res) => {
    const checked = validateReviewInput({ ...(req.body || {}), order_ref: (req.body && req.body.order_ref) || req.params.ref });
    if (checked.error) return res.status(checked.status || 400).json({ error: checked.error });
    const input = checked.review;
    try {
      const { rows } = await pool.query(
        `SELECT so.* FROM store_orders so WHERE so.order_ref = $1`,
        [input.order_ref],
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const order = rows[0];
      if (!phonesMatch(order.buyer_phone, input.buyer_phone)) {
        return res.status(403).json({ error: 'Phone does not match this order.' });
      }
      const allowed = orderAllowsReview(order);
      if (!allowed.ok) return res.status(400).json({ error: allowed.error });
      if (input.product_id) {
        const items = Array.isArray(order.items) ? order.items : [];
        const onOrder = items.some((it) => String(it.id || it.product_id) === String(input.product_id));
        if (!onOrder) return res.status(400).json({ error: 'That item was not on this order.' });
      }
      try {
        const ins = await pool.query(
          `INSERT INTO store_reviews (store_id, order_id, product_id, rating, body, buyer_phone_masked, published)
           VALUES ($1,$2,$3,$4,$5,$6,true)
           RETURNING id, rating, body, created_at, published`,
          [order.store_id, order.id, input.product_id, input.rating, input.body, maskPhone(order.buyer_phone)],
        );
        res.status(201).json({ review: ins.rows[0], empty_copy: null, show_stars: true });
      } catch (e) {
        if (e.code === '23505') return res.status(409).json({ error: 'This order already has a review.' });
        throw e;
      }
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'store_reviews not migrated yet. Apply deploy/schema-cro-yearend.sql' });
      return res.status(500).json({ error: e.message });
    }
  });

  // After POST /api/orders (already in storeCore), clients can also ask for the wa.me alert.
  app.get('/api/orders/:ref/whatsapp', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT so.*, s.name AS store_name, s.whatsapp
         FROM store_orders so JOIN stores s ON s.id = so.store_id
         WHERE so.order_ref = $1`,
        [req.params.ref],
      );
      if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
      const o = rows[0];
      res.json({
        vendor: vendorOrderWaMe({
          vendor_e164: o.whatsapp,
          order_ref: o.order_ref,
          store_name: o.store_name,
          items: o.items,
          total_cents: o.total_cents,
          fulfillment: o.fulfillment,
          payment_method: o.payment_method,
          buyer_name: o.buyer_name,
        }),
        customer_to_shop: customerOrderWaMe({
          vendor_e164: o.whatsapp,
          order_ref: o.order_ref,
          store_name: o.store_name,
          items: o.items,
        }),
        note: 'These are wa.me drafts. Juvay does not send WhatsApp. There is no paid sender in this cut.',
      });
    } catch (e) {
      if (tableMissing(e)) return res.status(503).json({ error: 'store_orders not migrated yet.' });
      return res.status(500).json({ error: e.message });
    }
  });
}

module.exports = {
  PREMIUM_OFFER,
  isPremiumCheckoutEnabled,
  premiumPayload,
  phonesMatch,
  maskPhone,
  waMe,
  vendorNewOrderWaText,
  vendorOrderWaMe,
  customerOrderWaMe,
  customerFollowupWaMe,
  orderAllowsReview,
  validateReviewInput,
  publicReviewList,
  publicOrderShape,
  firstSaleChecklist,
  mountCroYearEndRoutes,
};
