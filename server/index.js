/**
 * TriniBuild Self-Hosted API Server
 * Replaces Supabase: Auth (JWT) + Database (pg) + Storage (local disk)
 * Runs on :3001 behind Nginx
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '5mb' }));

// ─── File uploads (replaces Supabase Storage) ───────────────
const UPLOAD_DIR = '/var/www/trinibuild/uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_DIR, req.uploadFolder || 'general');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${path.extname(file.originalname)}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Auth middleware ─────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

const sign = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES (replaces Supabase Auth)
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, full_name, phone, ref } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING id, email, full_name, role`,
      [email.toLowerCase(), hash, full_name, phone]
    );
    const user = rows[0];

    // Track referral if ref code provided
    if (ref) {
      const { rows: aff } = await pool.query(`SELECT id FROM affiliate_profiles WHERE referral_code = $1`, [ref]);
      if (aff[0]) {
        await pool.query(
          `INSERT INTO affiliate_referrals (referrer_id, referred_user_id, referred_email, referral_code, status) VALUES ($1,$2,$3,$4,'signed_up')`,
          [aff[0].id, user.id, email, ref]
        );
        await pool.query(`UPDATE affiliate_profiles SET total_referrals = total_referrals + 1 WHERE id = $1`, [aff[0].id]);
      }
    }

    res.json({ user, token: sign(user) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email?.toLowerCase()]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, token: sign(user) });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const { rows } = await pool.query(`SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1`, [req.user.id]);
  res.json({ user: rows[0] });
});

// ═══════════════════════════════════════════════════════════
// STORES
// ═══════════════════════════════════════════════════════════
app.get('/api/stores/mine', auth, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM stores WHERE owner_id = $1`, [req.user.id]);
  res.json(rows);
});

app.post('/api/stores', auth, async (req, res) => {
  const { name, description, category, phone, whatsapp, address } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + crypto.randomBytes(2).toString('hex');
  const { rows } = await pool.query(
    `INSERT INTO stores (owner_id, name, slug, description, category, phone, whatsapp, address) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.user.id, name, slug, description, category, phone, whatsapp, address]
  );
  res.json(rows[0]);
});

app.get('/api/stores/:slug', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM stores WHERE slug = $1 AND status = 'active'`, [req.params.slug]);
  if (!rows[0]) return res.status(404).json({ error: 'Store not found' });
  const { rows: products } = await pool.query(`SELECT * FROM products WHERE store_id = $1 AND status = 'active'`, [rows[0].id]);
  res.json({ store: rows[0], products });
});

// ═══════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════
app.post('/api/products', auth, async (req, res) => {
  const { store_id, name, description, category, price, stock, condition, images } = req.body;
  // Verify ownership + plan limits
  const { rows: store } = await pool.query(`SELECT * FROM stores WHERE id = $1 AND owner_id = $2`, [store_id, req.user.id]);
  if (!store[0]) return res.status(403).json({ error: 'Not your store' });

  const { rows: plan } = await pool.query(
    `SELECT pt.max_products FROM user_plan_subscriptions ups JOIN plan_tiers pt ON pt.slug = ups.plan_slug WHERE ups.user_id = $1`,
    [req.user.id]
  );
  const { rows: count } = await pool.query(`SELECT COUNT(*) FROM products WHERE store_id = $1`, [store_id]);
  if (parseInt(count[0].count) >= (plan[0]?.max_products ?? 10)) {
    return res.status(402).json({ error: 'Product limit reached. Upgrade to Pro for unlimited products.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO products (store_id, name, description, category, price, stock, condition, images) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [store_id, name, description, category, price, stock || 0, condition || 'new', JSON.stringify(images || [])]
  );
  res.json(rows[0]);
});

// ═══════════════════════════════════════════════════════════
// SYSTEM 1: COD ORDERS
// ═══════════════════════════════════════════════════════════
const genOrderRef = () => {
  const d = new Date();
  return `TB${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 5)}`;
};

app.post('/api/cod/orders', async (req, res) => {
  const { store_id, customer_name, customer_phone, customer_email, customer_address, delivery_area, items, delivery_fee, payment_method, notes } = req.body;
  const subtotal = (items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const vat = Math.round(subtotal * 0.125 * 100) / 100;
  const fee = delivery_fee ?? 25;
  const total = subtotal + vat + fee;
  const { rows } = await pool.query(
    `INSERT INTO cod_orders (store_id, order_ref, customer_name, customer_phone, customer_email, customer_address, delivery_area, items, subtotal, delivery_fee, vat_amount, total_amount, payment_method, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [store_id, genOrderRef(), customer_name, customer_phone, customer_email, customer_address, delivery_area, JSON.stringify(items), subtotal, fee, vat, total, payment_method || 'cod', notes]
  );
  res.json(rows[0]);
});

app.get('/api/cod/orders', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT co.* FROM cod_orders co JOIN stores s ON s.id = co.store_id WHERE s.owner_id = $1 ORDER BY co.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

app.patch('/api/cod/orders/:id/status', auth, async (req, res) => {
  const { status, payment_status, driver_name, driver_phone, note } = req.body;
  const sets = ['order_status = $2'];
  const vals = [req.params.id, status];
  let i = 3;
  if (payment_status) { sets.push(`payment_status = $${i++}`); vals.push(payment_status); }
  if (driver_name) { sets.push(`driver_name = $${i++}`); vals.push(driver_name); }
  if (driver_phone) { sets.push(`driver_phone = $${i++}`); vals.push(driver_phone); }
  if (status === 'delivered') sets.push(`delivered_at = now()`);
  if (status === 'cancelled') { sets.push(`cancelled_at = now()`); if (note) { sets.push(`cancellation_reason = $${i++}`); vals.push(note); } }

  const { rows } = await pool.query(
    `UPDATE cod_orders SET ${sets.join(', ')} WHERE id = $1 AND store_id IN (SELECT id FROM stores WHERE owner_id = '${req.user.id}') RETURNING *`,
    vals
  );
  res.json(rows[0]);
});

app.get('/api/cod/track/:ref', async (req, res) => {
  const { rows } = await pool.query(`SELECT order_ref, order_status, items, total_amount, created_at, delivered_at FROM cod_orders WHERE order_ref = $1`, [req.params.ref]);
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
  res.json(rows[0]);
});

// ═══════════════════════════════════════════════════════════
// SYSTEM 2: AFFILIATE
// ═══════════════════════════════════════════════════════════
app.get('/api/affiliate/profile', auth, async (req, res) => {
  let { rows } = await pool.query(`SELECT * FROM affiliate_profiles WHERE user_id = $1`, [req.user.id]);
  if (!rows[0]) {
    const code = (req.user.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) + crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 3));
    ({ rows } = await pool.query(
      `INSERT INTO affiliate_profiles (user_id, referral_code) VALUES ($1,$2) RETURNING *`,
      [req.user.id, code]
    ));
  }
  res.json(rows[0]);
});

app.get('/api/affiliate/referrals', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ar.* FROM affiliate_referrals ar JOIN affiliate_profiles ap ON ap.id = ar.referrer_id WHERE ap.user_id = $1 ORDER BY ar.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

app.post('/api/affiliate/payout', auth, async (req, res) => {
  const { amount_ttd, method, bank_details } = req.body;
  if (amount_ttd < 50) return res.status(400).json({ error: 'Minimum payout is TT$50' });
  const { rows: prof } = await pool.query(`SELECT * FROM affiliate_profiles WHERE user_id = $1`, [req.user.id]);
  if (!prof[0] || prof[0].pending_payout_ttd < amount_ttd) return res.status(400).json({ error: 'Insufficient balance' });

  const { rows } = await pool.query(
    `INSERT INTO affiliate_payout_requests (affiliate_id, amount_ttd, method, bank_details) VALUES ($1,$2,$3,$4) RETURNING *`,
    [prof[0].id, amount_ttd, method, JSON.stringify(bank_details || {})]
  );
  await pool.query(`UPDATE affiliate_profiles SET pending_payout_ttd = pending_payout_ttd - $1 WHERE id = $2`, [amount_ttd, prof[0].id]);
  res.json(rows[0]);
});

app.get('/api/affiliate/leaderboard', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT referral_code, tier, paid_referrals, total_earned_ttd FROM affiliate_profiles WHERE status = 'active' ORDER BY total_earned_ttd DESC LIMIT 10`
  );
  res.json(rows);
});

// ═══════════════════════════════════════════════════════════
// SYSTEM 3: AI DOCUMENTS (OpenAI key now SERVER-SIDE — more secure)
// ═══════════════════════════════════════════════════════════
app.post('/api/documents/generate', auth, async (req, res) => {
  const { document_type, fields, system_prompt, is_free, price_ttd } = req.body;
  try {
    const today = new Date().toLocaleDateString('en-TT', { day: 'numeric', month: 'long', year: 'numeric' });
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: `Generate the document using these details:\nDate: ${today}\n${Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nGenerate the complete, print-ready document.` },
        ],
      }),
    });
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI generation failed');

    const { rows } = await pool.query(
      `INSERT INTO document_orders (user_id, document_type, fields, generated_content, status, is_free, price_ttd, paid) VALUES ($1,$2,$3,$4,'complete',$5,$6,$5) RETURNING id`,
      [req.user.id, document_type, JSON.stringify(fields), content, is_free, price_ttd || 0]
    );
    res.json({ content, order_id: rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/documents/mine', auth, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM document_orders WHERE user_id = $1 ORDER BY created_at DESC`, [req.user.id]);
  res.json(rows);
});

// ═══════════════════════════════════════════════════════════
// SYSTEM 4: SUBSCRIPTIONS + BANK PAY
// ═══════════════════════════════════════════════════════════
app.get('/api/plans', async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM plan_tiers ORDER BY price_ttd`);
  res.json(rows);
});

app.get('/api/subscription', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ups.*, pt.name, pt.price_ttd, pt.max_products, pt.ai_documents, pt.features
     FROM user_plan_subscriptions ups JOIN plan_tiers pt ON pt.slug = ups.plan_slug WHERE ups.user_id = $1`,
    [req.user.id]
  );
  res.json(rows[0] || null);
});

app.post('/api/subscription/bank-pay', auth, async (req, res) => {
  const { plan_slug, months, bank_name, branch, account_number } = req.body;
  const { rows: plan } = await pool.query(`SELECT * FROM plan_tiers WHERE slug = $1`, [plan_slug]);
  if (!plan[0]) return res.status(404).json({ error: 'Plan not found' });

  const amount = plan[0].price_ttd * (months || 1);
  const ref = `TB-${plan_slug.toUpperCase().slice(0, 3)}-${req.user.id.replace(/-/g, '').slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const start = new Date();
  const end = new Date(start); end.setMonth(end.getMonth() + (months || 1));

  const { rows } = await pool.query(
    `INSERT INTO bank_subscription_payments (user_id, plan_slug, amount_ttd, bank_name, branch, account_number, reference_code, months_paid, period_start, period_end)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.user.id, plan_slug, amount, bank_name, branch, account_number, ref, months || 1, start, end]
  );
  res.json(rows[0]);
});

app.post('/api/subscription/bank-pay/proof', auth, (req, res, next) => { req.uploadFolder = 'bank-proofs'; next(); }, upload.single('proof'), async (req, res) => {
  const { reference_code } = req.body;
  const proof_url = `/uploads/bank-proofs/${req.file.filename}`;
  await pool.query(
    `UPDATE bank_subscription_payments SET status = 'submitted', proof_url = $1, updated_at = now() WHERE reference_code = $2 AND user_id = $3`,
    [proof_url, reference_code, req.user.id]
  );
  res.json({ success: true, proof_url });
});

// Admin: verify a bank payment
app.post('/api/admin/bank-pay/:id/verify', auth, adminOnly, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE bank_subscription_payments SET status = 'verified', verified_at = now() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  const p = rows[0];
  if (p) {
    await pool.query(
      `INSERT INTO user_plan_subscriptions (user_id, plan_slug, source, bank_payment_id, status, expires_at)
       VALUES ($1,$2,'bank_pay',$3,'active',$4)
       ON CONFLICT (user_id) DO UPDATE SET plan_slug = $2, source = 'bank_pay', bank_payment_id = $3, status = 'active', expires_at = $4`,
      [p.user_id, p.plan_slug, p.id, p.period_end]
    );
  }
  res.json(p);
});

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.listen(PORT, () => console.log(`🇹🇹 TriniBuild API running on :${PORT}`));
