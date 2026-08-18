// server.js — full commercial B2B trade platform HTTP server (zero deps)
'use strict';
const http = require('node:http');
const domain = require('./src/domain');
const store = require('./src/store');
const auth = require('./src/auth');
const trade = require('./src/services/trade');
const wam = require('./src/services/wam');
const ui = require('./src/ui');
const concierge = require('./src/services/concierge');
const PORT = Number(process.env.PORT || 4000);

function json(res, status, v) { const b = JSON.stringify(v, null, 2); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(b); }
function html(res, status, h) { res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(h); }

function readRawBody(req) { return new Promise(r => { const c=[]; let n=0; req.on('data',x=>{n+=x.length; if(n>1000000) req.destroy(); else c.push(x);}); req.on('end',()=>r(Buffer.concat(c).toString('utf8'))); req.on('error',()=>r('')); }); }
function readBody(req) { return new Promise(r => { const c = []; let n = 0; req.on('data', x => { n += x.length; if (n > 2000000) req.destroy(); else c.push(x); }); req.on('end', () => { const raw = Buffer.concat(c).toString('utf8'); if (!raw.trim()) return r({}); try { r(JSON.parse(raw)); } catch { r({}); } }); req.on('error', () => r({})); }); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function badgeCls(s) { if (s === 'TRADE_VERIFIED' || s === 'TRANSACTION_VERIFIED') return 'trade'; if (s === 'IDENTITY_VERIFIED') return 'verified'; if (s === 'CLAIMED' || s === 'CLAIM_PENDING') return 'claimed'; return 'unclaimed'; }
function page(title, bodyHtml, active) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>' + esc(title) + ' · Caribbean AI Trade Network</title><style>:root{--bg:#0b1220;--surface:#0f172a;--line:#1e293b;--fg:#e8eef7;--muted:#94a3b8;--gold:#fbbf24;--teal:#22d3ee;--green:#22c55e}*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:var(--bg);color:var(--fg);line-height:1.6}.nav{display:flex;gap:18px;align-items:center;padding:14px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:rgba(11,18,32,.92);z-index:10}.nav .brand{font-weight:800;color:var(--teal)}.nav a{color:var(--muted);text-decoration:none;font-size:14px}.nav a:hover{color:var(--fg)}.nav .spacer{flex:1}.btn{border:none;border-radius:999px;padding:10px 18px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}.btn.gold{background:var(--gold);color:#111}.btn.teal{background:var(--teal);color:#05202b}.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--muted)}.wrap{max-width:1100px;margin:0 auto;padding:28px 24px}h1{font-size:30px}h2{font-size:22px;margin-top:28px}.muted{color:var(--muted);font-size:14px}.mono{font-family:monospace;font-size:12px;color:#64748b}.badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-left:8px}.badge.unclaimed{background:#3b82f6;color:#fff}.badge.claimed{background:#64748b;color:#fff}.badge.verified{background:#22c55e;color:#111}.badge.trade{background:#a3e635;color:#111}.card{border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0;background:var(--surface)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}input,select,textarea{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:#0b1220;color:var(--fg);margin:6px 0;font:inherit}label{font-size:13px;color:var(--muted);display:block;margin-top:10px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);font-size:14px}th{color:var(--muted);font-size:12px;text-transform:uppercase}@media(max-width:700px){.nav{flex-wrap:wrap}}</style></head><body><div class="nav"><span class="brand">Caribbean AI Trade Network</span><a href="/">Marketplace</a><a href="/browse">Directory</a><a href="/sourcing">Sourcing</a><a href="/landed-cost">Landed Cost</a><a href="/trade-info">Trade Info</a><a href="/plans">Plans</a><span class="spacer"></span>' + (active ? '<a class="btn teal" href="/logout">' + esc(active) + '</a>' : '<a class="btn ghost" href="/login">Sign in</a><a class="btn gold" href="/signup">Start free</a>') + '</div><div class="wrap">' + bodyHtml + '</div></body></html>';
}

// ---------- UI pages ----------
const marketplace = () => { const b = store.listBusinesses(); return page('Marketplace', '<h1>Find, verify, and trade across the Caribbean</h1><p class="muted">An Alibaba-style B2B network: source-backed supplier profiles, verified sellers, RFQs, landed cost, and safe payment — built for the Caribbean and global buyers.</p><form method="get" action="/search" style="display:flex;gap:10px;margin:18px 0"><input name="q" placeholder="Search suppliers, products, categories, islands…"/><button class="btn gold">Search</button></form><h2>Verified suppliers & products (' + b.length + ' businesses)</h2><div class="grid">' + b.slice(0, 12).map(x => '<div class="card"><div><strong>' + esc(x.name) + '</strong><span class="badge ' + badgeCls(x.state) + '">' + esc(x.label) + '</span></div><div class="muted">' + esc(x.country) + (x.city ? ' · ' + esc(x.city) : '') + ' · ' + esc(x.category || 'uncategorized') + '</div>' + (x.disclaimer ? '<div class="muted" style="font-size:13px;font-style:italic;margin-top:8px">' + esc(x.disclaimer) + '</div>' : '') + '<div class="mono">' + x.id + '</div></div>').join('') + '</div><h2>Global buyers</h2><p class="muted">Diaspora retailers, restaurants, distributors, event buyers and e-commerce merchants can source authentic Caribbean-origin goods with export-grade documentation, FX assumptions and destination-aware payment options.</p><a class="btn teal" href="/signup?role=buyer_external">Register as a global buyer</a>', null); };
const directory = () => page('Business Directory', '<h1>Business directory</h1><div class="grid">' + store.listBusinesses().map(x => '<div class="card"><strong>' + esc(x.name) + '</strong><span class="badge ' + badgeCls(x.state) + '">' + esc(x.label) + '</span><div class="muted">' + esc(x.country) + (x.city ? ' · ' + esc(x.city) : '') + ' · ' + esc(x.category || '') + '</div>' + (x.disclaimer ? '<div class="muted" style="font-size:13px;font-style:italic;margin-top:8px">' + esc(x.disclaimer) + '</div>' : '') + '<div class="mono">' + x.id + '</div></div>').join('') + '</div>', null);
const sourcing = () => page('Sourcing / RFQ', '<h1>Post a sourcing request</h1><p class="muted">Tell us what you need, where it is going, and by when. Verified suppliers respond with quotes.</p><form method="post" action="/api/rfqs" style="max-width:560px"><label>Your name</label><input name="buyer_name" required/><label>Email</label><input name="buyer_email" required/><label>Product / what you need</label><input name="product" required placeholder="e.g. craft chocolate, blue mountain coffee, nutmeg oil…"/><label>Quantity</label><input name="quantity" type="number" min="1"/><label>Destination country</label><input name="destination_country" placeholder="e.g. US, Canada, UK, Barbados"/><label>Deadline</label><input name="deadline" type="date"/><label>Notes</label><textarea name="notes" rows="3"></textarea><button class="btn gold" style="margin-top:12px">Submit sourcing request</button></form><h2>Open requests</h2><table><tr><th>Product</th><th>Qty</th><th>Destination</th><th>Status</th></tr>' + store.listRfqs().map(r => '<tr><td>' + esc(r.product) + '</td><td>' + r.quantity + '</td><td>' + esc(r.destination_country || '-') + '</td><td>' + r.status + '</td></tr>').join('') + '</table>', null);
const landedCost = () => page('Landed Cost Estimator', '<h1>Estimate true delivered cost</h1><p class="muted">Deterministic engine. No hidden arithmetic — every input is shown and adjustable.</p><form method="get" action="/api/landed-cost" style="max-width:560px"><label>Product value (USD)</label><input name="product_value" type="number" value="100"/><label>Origin charges (USD)</label><input name="origin_charges" type="number" value="5"/><label>Freight (USD)</label><input name="freight" type="number" value="20"/><label>Insurance (USD)</label><input name="insurance" type="number" value="5"/><label>Duty (USD)</label><input name="applicable_duty" type="number" value="0"/><label>Taxes & levies (USD)</label><input name="taxes_and_levies" type="number" value="0"/><label>Destination port charges (USD)</label><input name="destination_port_charges" type="number" value="10"/><label>Brokerage (USD)</label><input name="brokerage" type="number" value="15"/><label>Inland delivery (USD)</label><input name="inland_delivery" type="number" value="10"/><button class="btn gold" style="margin-top:12px">Calculate</button></form>', null);
const tradeInfo = () => page('Trade Information', '<h1>Trade requirements & knowledge</h1><p class="muted">Decision-support only. Confirm with the relevant authority before relying on any rule.</p><form method="get" action="/api/trade/requirements" style="max-width:560px"><label>Origin (Caribbean island)</label><input name="origin" placeholder="e.g. Jamaica"/><label>Destination country</label><input name="destination" placeholder="e.g. US"/><label>Category</label><input name="category" placeholder="e.g. food_beverage"/><label>HS code (optional)</label><input name="hs" placeholder="e.g. 1806"/><button class="btn gold" style="margin-top:12px">Check requirements</button></form>', null);
const plans = (active) => page('Plans', '<h1>Simple plans. Free to start.</h1><p class="muted">Free directory + RFQ access for everyone. Paid upgrades unlock selling, quoting and advanced trade tools.</p><div class="grid">' + Object.values(domain.PLANS).map(p => '<div class="card"><h2 style="margin-top:0">' + p.name + '</h2><div style="font-size:28px;font-weight:800">US$' + p.price_usd + '<span class="muted" style="font-size:14px">/' + (p.cycle === 'forever' ? 'forever' : p.cycle) + '</span></div><ul style="padding-left:18px;color:var(--muted)">' + p.features.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul><a class="btn gold" href="/signup?plan=' + p.slug + '">' + (p.price_usd === 0 ? 'Start free' : 'Choose ' + p.name) + '</a></div>').join('') + '</div>', active);
const login = (active) => page('Sign in', '<h1>Sign in</h1><form method="post" action="/api/login" style="max-width:400px"><label>Email</label><input name="email" required/><label>Password</label><input name="password" type="password" required/><button class="btn gold" style="margin-top:12px">Sign in</button></form>', active);
const signup = (active, role) => page('Start free', '<h1>Start free</h1><p class="muted">Free plan includes directory presence and buyer RFQ access. Upgrade anytime.</p><form method="post" action="/api/register" style="max-width:400px"><input type="hidden" name="buyer_external" value="' + (role === 'buyer_external' ? 'true' : '') + '"/><label>Name</label><input name="name" required/><label>Email</label><input name="email" required/><label>Company (optional)</label><input name="org_name"/><label>Password (8+ chars)</label><input name="password" type="password" required/><label>Island / currency</label><select name="island"><option value="tt">Trinidad & Tobago (TTD)</option><option value="jm">Jamaica (JMD)</option><option value="bb">Barbados (BBD)</option><option value="gy">Guyana (GYD)</option><option value="us">United States (USD)</option><option value="ca">Canada (CAD)</option><option value="gb">United Kingdom (GBP)</option></select><label>Role</label><select name="role"><option value="buyer">Buyer</option><option value="supplier">Supplier</option></select><button class="btn gold" style="margin-top:12px">Create free account</button></form>', active);

// ---------- API ----------
async function handle(req, res) {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const q = url.searchParams;

  if (req.method === 'GET' && p === '/') return html(res, 200, ui.marketplace(store.listBusinesses(), store._db().products));
  if (req.method === 'GET' && p === '/browse') return html(res, 200, ui.directory(store.listBusinesses()));
  if (req.method === 'GET' && p === '/sourcing') return html(res, 200, ui.sourcing(store.listRfqs()));
  if (req.method === 'GET' && p === '/landed-cost') return html(res, 200, ui.landedCostPage());
  if (req.method === 'GET' && p === '/trade-info') return html(res, 200, ui.tradeInfoPage());
  if (req.method === 'GET' && p === '/plans') return html(res, 200, ui.plansPage(auth.auth(req)?.name));
  if (req.method === 'GET' && p === '/login') return html(res, 200, ui.loginPage(auth.auth(req)?.name));
  if (req.method === 'GET' && p === '/signup') return html(res, 200, ui.signupPage(auth.auth(req)?.name, q.get('role')));

  if (req.method === 'GET' && p === '/api/health') return json(res, 200, { ok: true, service: 'caribbean-ai-trade-network', businesses: store.listBusinesses().length, rfqs: store.listRfqs().length, users: store._db().users.length });

  if (req.method === 'GET' && p === '/search') {
    const term = q.get('q') || ''; const t = term.toLowerCase();
    const b = store.listBusinesses().filter(x => [x.name, x.country, x.city, x.category].join(' ').toLowerCase().includes(t));
    const pr = store._db().products.filter(x => [x.title, x.description || '', x.origin_country || ''].join(' ').toLowerCase().includes(t));
    return html(res, 200, page('Search: ' + esc(term), '<h1>Results for "' + esc(term) + '"</h1><h2>Businesses (' + b.length + ')</h2><div class="grid">' + (b.map(x => '<div class="card"><strong>' + esc(x.name) + '</strong><span class="badge ' + badgeCls(x.state) + '">' + esc(x.label) + '</span><div class="muted">' + esc(x.country) + '</div></div>').join('') || '<p class="muted">None</p>') + '</div><h2>Products (' + pr.length + ')</h2><div class="grid">' + (pr.map(x => '<div class="card"><strong>' + esc(x.title) + '</strong><div class="muted">US$' + x.price_usd + ' · ' + esc(x.origin_country) + ' · MOQ ' + x.moq + '</div></div>').join('') || '<p class="muted">None</p>') + '</div>', auth.auth(req)?.name));
  }

  if (req.method === 'POST' && p === '/api/register') { const b = await readBody(req); try { const u = await auth.register(b); const s = await auth.login({ email: u.email, password: b.password }); res.setHeader('Set-Cookie', 'catn_session=' + s.token + '; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800'); return json(res, 201, { ok: true, data: u, plan: 'free' }); } catch (e) { return json(res, 400, { ok: false, error: e.message }); } }
  if (req.method === 'POST' && p === '/api/login') { const b = await readBody(req); const s = await auth.login(b); if (!s) return json(res, 401, { ok: false, error: 'Invalid email or password' }); res.setHeader('Set-Cookie', 'catn_session=' + s.token + '; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800'); return json(res, 200, { ok: true, data: s }); }
  if (req.method === 'GET' && p === '/logout') { const s = auth.auth(req); if (s) auth.logout(s.token); res.setHeader('Set-Cookie', 'catn_session=; HttpOnly; Path=/; Max-Age=0'); res.writeHead(302, { Location: '/' }); res.end(); return; }
  if (req.method === 'GET' && p === '/api/me') { const s = auth.auth(req); return json(res, s ? 200 : 401, s ? { ok: true, data: s } : { ok: false, error: 'unauthenticated' }); }

  if (req.method === 'GET' && p === '/api/businesses') return json(res, 200, { ok: true, data: store.listBusinesses() });
  let m = p.match(/^\/api\/businesses\/([^/]+)$/);
  if (req.method === 'GET' && m) { const b = store.getBusiness(m[1]); return b ? json(res, 200, { ok: true, data: store.publicBusiness(b), products: store.listProducts(b.id) }) : json(res, 404, { ok: false, error: 'not_found' }); }

  m = p.match(/^\/api\/businesses\/([^/]+)\/claim$/);
  if (req.method === 'POST' && m) { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const out = store.claimBusiness(m[1], s.user_id, s.org_id); return out.ok ? json(res, 200, { ok: true, data: out.business }) : json(res, 409, { ok: false, error: out.error }); }
  m = p.match(/^\/api\/businesses\/([^/]+)\/evidence$/);
  if (req.method === 'POST' && m) { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const out = store.submitEvidence(m[1], s.user_id, b.dimension, b.note); return out.ok ? json(res, 200, { ok: true, data: out.business }) : json(res, 400, { ok: false, error: out.error }); }
  m = p.match(/^\/api\/admin\/([^/]+)\/approve$/);
  if (req.method === 'POST' && m) { const b = await readBody(req); const out = store.approveEvidence(m[1], b.dimension); return out.ok ? json(res, 200, { ok: true, data: out.business }) : json(res, 400, { ok: false, error: out.error }); }

  m = p.match(/^\/api\/businesses\/([^/]+)\/products$/);
  if (req.method === 'POST' && m) { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const out = store.addProduct(m[1], s.org_id, s.user_id, b); return out.ok ? json(res, 201, { ok: true, data: out.product }) : json(res, 403, { ok: false, error: out.error }); }

  if (req.method === 'POST' && p === '/api/rfqs') { const b = await readBody(req); if (!b.product || !b.buyer_email) return json(res, 400, { ok: false, error: 'product and buyer_email required' }); const s = auth.auth(req); const rfq = store.createRfq({ buyer_user_id: s ? s.user_id : null, buyer_org_id: s ? s.org_id : null, product: b.product, quantity: b.quantity, destination_country: b.destination_country, deadline: b.deadline, notes: b.notes, category: b.category }); return json(res, 201, { ok: true, data: rfq }); }
  if (req.method === 'GET' && p === '/api/rfqs') return json(res, 200, { ok: true, data: store.listRfqs() });

  m = p.match(/^\/api\/rfqs\/([^/]+)\/quotes$/);
  if (req.method === 'POST' && m) { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const out = store.submitQuote(m[1], s.org_id, b.business_id, b); return out.ok ? json(res, 201, { ok: true, data: out.quote }) : json(res, 403, { ok: false, error: out.error }); }
  if (req.method === 'GET' && m) return json(res, 200, { ok: true, data: store.listQuotesForRfq(m[1]) });

  if (req.method === 'POST' && p === '/api/orders') { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const order = store.createOrder({ buyer_org_id: s.org_id, supplier_org_id: b.supplier_org_id, rfq_id: b.rfq_id, quote_id: b.quote_id, product: b.product, quantity: b.quantity, price_usd: b.price_usd, currency: b.currency, incoterm: b.incoterm, terms: b.terms }); return json(res, 201, { ok: true, data: order }); }
  if (req.method === 'GET' && p === '/api/orders') { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); return json(res, 200, { ok: true, data: store.listOrders(s.org_id) }); }

  if (req.method === 'POST' && p === '/api/payments') { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const pi = store.createPaymentIntent({ order_id: b.order_id, buyer_org_id: s.org_id, amount: b.amount, currency: b.currency, method: b.method, provider: b.provider, metadata: b.metadata }); return json(res, 201, { ok: true, data: pi }); }

  // Wam checkout intent — server-authoritative amount in TTD
  if (req.method === 'POST' && p === '/api/payments/wam-checkout') {
    const sess = auth.auth(req); if (!sess) return json(res, 401, { ok: false, error: 'login required' });
    const b = await readBody(req);
    if (!b.order_id) return json(res, 400, { ok: false, error: 'order_id required' });
    const order = store.getOrder(b.order_id);
    if (!order || (order.buyer_org_id !== sess.org_id)) return json(res, 404, { ok: false, error: 'order not found' });
    const priceTtd = Number(b.amount_ttd || order.price_usd || 0); // server amount
    try {
      const intent = await wam.createPaymentIntent({
        amountTtd: priceTtd, orderReference: order.id,
        description: 'Trade order ' + order.id,
        returnUrl: b.return_url || undefined,
      });
      const pi = store.createPaymentIntent({
        order_id: order.id, buyer_org_id: sess.org_id, amount: priceTtd, currency: 'TTD',
        method: 'wam', provider: 'wam', wam_payment_id: intent.paymentId, wam_checkout_url: intent.checkoutUrl, wam_status: 'pending',
      });
      return json(res, 201, { ok: true, data: { payment_id: pi.id, wam_payment_id: intent.paymentId, checkout_url: intent.checkoutUrl, status: 'created' } });
    } catch (e) { return json(res, 502, { ok: false, error: e.message }); }
  }

  // Wam webhook — HMAC-verified; ONLY this confirms payment
  if (req.method === 'POST' && p === '/webhooks/wam') {
    const raw = await readRawBody(req);
    const sig = String(req.headers['x-wam-signature'] || req.headers['x-signature'] || '');
    const ts = String(req.headers['x-wam-timestamp'] || req.headers['x-timestamp'] || '');
    if (!wam.verifyWebhook({ body: raw, signature: sig, timestamp: ts })) {
      return json(res, 400, { ok: false, error: 'invalid_signature' });
    }
    const event = wam.parseEvent(raw);
    const paymentId = event.paymentId || event.data?.paymentId || (event.object && event.object.id);
    const status = wam.eventStatus(event);
    if (paymentId && status === 'PAID') {
      store.markPaymentByWamRef(paymentId, 'PAID', 'completed');
      return json(res, 200, { ok: true, received: true, status: 'PAID' });
    }
    return json(res, 200, { ok: true, received: true, status: status || 'pending' });
  }

  if (req.method === 'GET' && p === '/api/landed-cost') { const spec = { product_value: q.get('product_value'), origin_charges: q.get('origin_charges'), freight: q.get('freight'), insurance: q.get('insurance'), applicable_duty: q.get('applicable_duty'), taxes_and_levies: q.get('taxes_and_levies'), destination_port_charges: q.get('destination_port_charges'), brokerage: q.get('brokerage'), inland_delivery: q.get('inland_delivery') }; return json(res, 200, { ok: true, data: trade.landedCost(spec) }); }
  if (req.method === 'POST' && p === '/api/landed-cost') { const s = auth.auth(req); const b = await readBody(req); const result = trade.landedCost(b); const saved = s ? store.saveLandedCost(s.org_id, b, result) : null; return json(res, 200, { ok: true, data: result, saved: !!saved }); }

  if (req.method === 'GET' && p === '/api/trade/requirements') { return json(res, 200, { ok: true, data: trade.likelyRequirements({ origin: q.get('origin'), destination: q.get('destination'), category: q.get('category'), hs: q.get('hs') }) }); }
  if (req.method === 'GET' && p === '/api/payment-rails') { return json(res, 200, { ok: true, data: trade.availableRails({ payer_territory: q.get('territory') || 'TT', buyer_is_external: q.get('external') === 'true' }) }); }

  if (req.method === 'POST' && p === '/api/concierge') { const b = await readBody(req); const msg = String(b.message || b.question || '').trim(); if (!msg) return json(res, 400, { ok: false, error: 'message required' }); const ctx = { destination: b.destination, origin: b.origin, category: b.category, hs: b.hs, territory: b.territory, buyer_is_external: b.buyer_is_external, product_value: b.product_value, currency: b.currency }; const a = concierge.answerQuestion(msg, ctx); return json(res, 200, { ok: true, data: a }); }

  if (req.method === 'GET' && p === '/api/plans') return json(res, 200, { ok: true, data: Object.values(domain.PLANS) });
  if (req.method === 'POST' && p === '/api/plan/upgrade') { const s = auth.auth(req); if (!s) return json(res, 401, { ok: false, error: 'login required' }); const b = await readBody(req); const plan = domain.planBySlug(b.plan); const sub = store.setPlan(s.org_id, plan.slug, b.source || 'admin', { months: b.months }); return json(res, 200, { ok: true, data: { plan: plan.slug, status: sub.status, expires_at: sub.expires_at } }); }

  if (req.method === 'GET' && p === '/api/admin/activity') return json(res, 200, { ok: true, data: store.listActivity(q.get('limit')) });
  if (req.method === 'GET' && p === '/api/admin/stats') { const d = store._db(); return json(res, 200, { ok: true, data: { users: d.users.length, organizations: d.organizations.length, businesses: d.businesses.length, products: d.products.length, rfqs: d.rfqs.length, quotes: d.quotes.length, orders: d.orders.length, payments: d.payments.length, activity: d.activity.length } }); }

  return json(res, 404, { ok: false, error: 'not_found' });
}

const server = http.createServer((req, res) => { handle(req, res).catch(e => { console.error(e); json(res, 500, { ok: false, error: 'server_error' }); }); });
if (require.main === module) { server.listen(PORT, '0.0.0.0', () => console.log('Caribbean AI Trade Network on http://0.0.0.0:' + PORT)); }
module.exports = { server, handle, page, esc };
