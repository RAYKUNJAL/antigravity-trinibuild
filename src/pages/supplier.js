'use strict';
// Supplier workspace — server-rendered pages. All functions return HTML strings.
const ui = require('../ui');
const D = require('../domain');

function guard() {
  return ui.shell('Sign in required', '<section class="section"><div class="glass" style="max-width:480px;margin:0 auto;padding:28px;text-align:center"><h1>Sign in required</h1><p style="color:var(--on-surface-variant)">You need an account to use the supplier workspace.</p><a class="btn btn-primary" href="/signup?role=supplier">Create free account</a> <a class="btn btn-glass" href="/login">Sign in</a></div></section>', '/supplier');
}

function dashboard(store, user) {
  if (!user) return guard();
  const businesses = store.businessesForOrg(user.org_id);
  const products = businesses.reduce((n, b) => n + store.listProducts(b.id).length, 0);
  const rfqs = store.listRfqs({});
  const quotes = store._db().quotes.filter(q => q.supplier_org_id === user.org_id);
  const orders = store.listOrders(user.org_id).filter(o => o.supplier_org_id === user.org_id);
  const cards = businesses.map(b => {
    const score = typeof b.completeness_score === 'number' ? b.completeness_score : 0;
    return '<div class="glass bcard"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><h3 style="margin:0">' + ui.esc(b.name) + '</h3>' + ui.stateBadge(b.state) + '</div>'
      + '<div class="bloc"><span class="ms" style="font-size:16px">place</span>' + ui.esc(b.country) + (b.city ? ' · ' + ui.esc(b.city) : '') + '</div>'
      + '<div class="bloc"><span class="ms" style="font-size:16px">analytics</span>Storefront ' + score + '/100</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn btn-glass" href="/supplier/storefront/' + b.id + '">Storefront</a><a class="btn btn-glass" href="/supplier/products/' + b.id + '">Products</a>'
      + (D.isUnclaimed(b.state) ? '<a class="btn btn-primary" href="/supplier/claim/' + b.id + '">Claim</a>' : '<a class="btn btn-glass" href="/supplier/claim/' + b.id + '">Verification</a>') + '</div></div>';
  }).join('') || '<div class="glass" style="padding:24px"><p style="margin:0 0 12px">You have not claimed any businesses yet. Claim a profile from the directory to start selling.</p><a class="btn btn-primary" href="/browse">Browse the directory</a></div>';
  const body = '<section class="section"><div class="section-head"><h1>Supplier Dashboard</h1><p>Manage your businesses, respond to RFQs, and track orders.</p></div>'
    + '<div class="bento" style="margin-bottom:24px">'
    + '<div class="glass bento-4"><div class="bento-kicker">Businesses</div><div class="big-num">' + businesses.length + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Products</div><div class="big-num">' + products + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Quotes sent</div><div class="big-num">' + quotes.length + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Orders</div><div class="big-num">' + orders.length + '</div></div></div>'
    + '<div class="section-head"><h2>Your businesses</h2></div><div class="dir">' + cards + '</div>'
    + '<div class="section-head" style="margin-top:48px"><h2>Open RFQs in your categories</h2></div><div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Product</th><th>Qty</th><th>Destination</th><th>Deadline</th><th></th></tr>'
    + rfqs.slice(0, 20).map(r => '<tr><td>' + ui.esc(r.product) + '</td><td>' + r.quantity + '</td><td>' + ui.esc(r.destination_country || '-') + '</td><td>' + ui.esc(r.deadline || '-') + '</td><td><a class="btn btn-glass" href="/supplier/rfqs#rfq-' + r.id + '">Quote</a></td></tr>').join('') + '</table></div></section>';
  return ui.shell('Supplier Dashboard', body, '/supplier', user);
}

function claimPage(store, user, businessId) {
  if (!user) return guard();
  const b = store.getBusiness(businessId);
  if (!b) return ui.notFoundPage();
  const dims = D.VERIFICATION_DIMENSIONS.map(d => {
    const v = b.verification && b.verification[d];
    const st = v ? v.status : 'unverified';
    const badge = st === 'verified' ? '<span class="state-badge verified">verified</span>' : (st === 'pending_review' ? '<span class="state-badge claimed">pending</span>' : '<span class="state-badge unclaimed">not verified</span>');
    return '<div class="glass" style="padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><strong>' + ui.esc(d) + '</strong> ' + badge + (v && v.note ? '<p style="margin:4px 0 0;font-size:13px;color:var(--on-surface-variant)">' + ui.esc(v.note) + '</p>' : '') + '</div>'
      + '<form method="post" action="/supplier/claim/' + b.id + '" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="hidden" name="dimension" value="' + d + '"/><input name="note" placeholder="Evidence note…" style="max-width:240px"/><button class="btn btn-glass" type="submit">Submit evidence</button></form></div>';
  }).join('');
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/supplier">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:860px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap"><h1 style="margin:0">' + ui.esc(b.name) + '</h1>' + ui.stateBadge(b.state) + '</div>'
    + '<p style="color:var(--on-surface-variant)">' + ui.esc(b.country) + (b.city ? ' · ' + ui.esc(b.city) : '') + '</p>'
    + (b.disclaimer ? '<p style="font-style:italic;font-size:13px;color:var(--on-surface-variant)">' + ui.esc(b.disclaimer) + '</p>' : '')
    + '<h2 style="margin-top:24px">Verification evidence</h2><p style="color:var(--on-surface-variant);font-size:14px">Submit evidence for each dimension. Verified dimensions unlock product publishing and RFQ responses.</p>'
    + '<div style="display:grid;gap:10px;margin-top:12px">' + dims + '</div></div></section>';
  return ui.shell('Claim · ' + b.name, body, '/supplier', user);
}

function storefrontPage(store, user, businessId) {
  if (!user) return guard();
  const b = store.getBusiness(businessId);
  if (!b) return ui.notFoundPage();
  const incs = ['CIF', 'FOB', 'EXW', 'DDP'].map(i => '<label style="display:inline-flex;gap:4px;margin-right:10px"><input type="checkbox" name="incoterms_offered" value="' + i + '"' + ((b.incoterms_offered || []).includes(i) ? ' checked' : '') + '/>' + i + '</label>').join('');
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/supplier">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:720px"><h1 style="margin:0 0 4px">Storefront · ' + ui.esc(b.name) + '</h1>'
    + '<p style="color:var(--on-surface-variant);margin-bottom:20px">A complete storefront raises your profile score and gets more RFQ responses.</p>'
    + '<form method="post" action="/supplier/storefront/' + b.id + '" style="display:grid;gap:12px">'
    + '<div><label>Description</label><textarea name="description" rows="4">' + ui.esc(b.description || '') + '</textarea></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">'
    + '<div><label>MOQ (units)</label><input name="moq" type="number" value="' + (b.moq || '') + '"/></div>'
    + '<div><label>Lead time (days)</label><input name="lead_time_days" type="number" value="' + (b.lead_time_days || '') + '"/></div>'
    + '<div><label>Production capacity / month</label><input name="production_capacity" value="' + ui.esc(b.production_capacity || '') + '"/></div>'
    + '<div><label>Response time (minutes)</label><input name="response_time_minutes" type="number" value="' + (b.response_time_minutes || '') + '"/></div></div>'
    + '<div><label>Certifications (comma separated)</label><input name="certifications" value="' + ui.esc((b.certifications || []).join(', ')) + '"/></div>'
    + '<div><label>Export markets (comma separated)</label><input name="export_markets" value="' + ui.esc((b.export_markets || []).join(', ')) + '"/></div>'
    + '<div><label>Incoterms offered</label><div>' + incs + '</div></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">'
    + '<div><label>Payment terms</label><select name="payment_terms"><option value="">—</option><option value="advance"' + (b.payment_terms === 'advance' ? ' selected' : '') + '>Advance</option><option value="deposit_balance"' + (b.payment_terms === 'deposit_balance' ? ' selected' : '') + '>Deposit + balance</option><option value="net30"' + (b.payment_terms === 'net30' ? ' selected' : '') + '>Net 30</option><option value="net60"' + (b.payment_terms === 'net60' ? ' selected' : '') + '>Net 60</option><option value="LC"' + (b.payment_terms === 'LC' ? ' selected' : '') + '>Letter of credit</option></select></div>'
    + '<div><label>Sample policy</label><select name="sample_policy"><option value="">—</option><option value="free"' + (b.sample_policy === 'free' ? ' selected' : '') + '>Free samples</option><option value="paid"' + (b.sample_policy === 'paid' ? ' selected' : '') + '>Paid samples</option><option value="not_available"' + (b.sample_policy === 'not_available' ? ' selected' : '') + '>Not available</option></select></div>'
    + '<div><label>Pack sizes (comma separated)</label><input name="pack_sizes" value="' + ui.esc((b.pack_sizes || []).join(', ')) + '"/></div>'
    + '<div><label>Spec sheet (doc ref)</label><input name="spec_sheet" value="' + ui.esc(b.spec_sheet || '') + '"/></div></div>'
    + '<button class="btn btn-primary" type="submit">Save storefront</button></form></div></section>';
  return ui.shell('Storefront · ' + b.name, body, '/supplier', user);
}

function productsPage(store, user, businessId) {
  if (!user) return guard();
  const b = store.getBusiness(businessId);
  if (!b) return ui.notFoundPage();
  const prods = store.listProducts(businessId).map(p => '<div class="glass" style="padding:16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><strong>' + ui.esc(p.title) + '</strong><div class="bloc">US$' + p.price_usd + ' · MOQ ' + p.moq + ' · ' + ui.esc(p.currency) + (p.lead_time ? ' · ' + ui.esc(p.lead_time) : '') + '</div></div></div>').join('') || '<p style="color:var(--on-surface-variant)">No products yet.</p>';
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/supplier">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:720px"><h1 style="margin:0 0 16px">Products · ' + ui.esc(b.name) + '</h1><div style="display:grid;gap:10px;margin-bottom:24px">' + prods + '</div>'
    + '<h2>Add product</h2><form method="post" action="/supplier/products/' + b.id + '" style="display:grid;gap:12px;margin-top:12px">'
    + '<div><label>Title</label><input name="title" required/></div>'
    + '<div><label>Description</label><textarea name="description" rows="3"></textarea></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">'
    + '<div><label>Price (USD)</label><input name="price_usd" type="number" step="0.01" required/></div>'
    + '<div><label>MOQ</label><input name="moq" type="number" value="1"/></div>'
    + '<div><label>Lead time</label><input name="lead_time" placeholder="e.g. 14 days"/></div>'
    + '<div><label>HS code</label><input name="hs_candidate"/></div></div>'
    + '<button class="btn btn-primary" type="submit">Publish product</button></form></div></section>';
  return ui.shell('Products · ' + b.name, body, '/supplier', user);
}

function rfqInbox(store, user) {
  if (!user) return guard();
  const rfqs = store.listRfqs({});
  const rows = rfqs.slice(0, 30).map(r => '<tr id="rfq-' + r.id + '"><td>' + ui.esc(r.product) + '</td><td>' + r.quantity + '</td><td>' + ui.esc(r.destination_country || '-') + '</td><td>' + ui.esc(r.deadline || '-') + '</td><td>' + ui.esc(r.status) + '</td>'
    + '<td><details><summary class="btn btn-glass">Quote</summary><form method="post" action="/supplier/rfqs/' + r.id + '/quote" style="display:grid;gap:8px;padding:12px;min-width:320px">'
    + '<select name="business_id" required style="grid-column:1/-1">' + store.businessesForOrg(user.org_id).map(b => '<option value="' + b.id + '">' + ui.esc(b.name) + '</option>').join('') + '</select>'
    + '<input name="price_usd" type="number" step="0.01" placeholder="Unit price USD" required/>'
    + '<input name="moq" type="number" placeholder="MOQ"/>'
    + '<input name="lead_time" placeholder="Lead time e.g. 14 days"/>'
    + '<select name="incoterm"><option value="EXW">EXW</option><option value="FOB">FOB</option><option value="CIF">CIF</option><option value="DDP">DDP</option></select>'
    + '<input name="validity_days" type="number" placeholder="Validity days (30)"/>'
    + '<textarea name="notes" rows="2" placeholder="Notes"></textarea>'
    + '<button class="btn btn-primary" type="submit">Submit quote</button></form></details></td></tr>').join('');
  const body = '<section class="section"><div class="section-head"><h1>RFQ Inbox</h1><p>Open sourcing requests. Submit quotes to win orders.</p></div>'
    + '<div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Product</th><th>Qty</th><th>Destination</th><th>Deadline</th><th>Status</th><th></th></tr>' + rows + '</table></div></section>';
  return ui.shell('RFQ Inbox', body, '/supplier', user);
}

function quotesOutbox(store, user) {
  if (!user) return guard();
  const quotes = store._db().quotes.filter(q => q.supplier_org_id === user.org_id);
  const rows = quotes.slice(0, 50).map(q => {
    const rfq = store.getRfq(q.rfq_id);
    return '<tr><td>' + ui.esc(rfq ? rfq.product : q.rfq_id) + '</td><td>US$' + q.price_usd + '</td><td>' + ui.esc(q.currency) + '</td><td>' + ui.esc(q.status) + '</td><td>v' + (q.version || 1) + '</td><td>' + ui.esc(q.validity_days || '-') + 'd</td><td>' + ui.esc(q.created_at || '') + '</td></tr>';
  }).join('') || '<tr><td colspan="7">No quotes sent yet.</td></tr>';
  const body = '<section class="section"><div class="section-head"><h1>Quotes Outbox</h1><p>Every quote you have submitted, with negotiation version.</p></div>'
    + '<div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Product</th><th>Price</th><th>Currency</th><th>Status</th><th>Version</th><th>Validity</th><th>Submitted</th></tr>' + rows + '</table></div></section>';
  return ui.shell('Quotes Outbox', body, '/supplier', user);
}

// POST handlers
function saveStorefront(store, user, businessId, body) {
  if (!user) return { error: 'login required' };
  return store.updateStorefront(businessId, user.org_id, body);
}
function saveProduct(store, user, businessId, body) {
  if (!user) return { error: 'login required' };
  return store.addProduct(businessId, user.org_id, user.user_id, body);
}
function saveEvidence(store, user, businessId, body) {
  if (!user) return { error: 'login required' };
  const b = store.getBusiness(businessId);
  if (!b) return { error: 'not_found' };
  if (D.isUnclaimed(b.state)) store.claimBusiness(businessId, user.user_id, user.org_id);
  return store.submitEvidence(businessId, user.user_id, body.dimension, body.note);
}
function submitQuote(store, user, rfqId, body) {
  if (!user) return { error: 'login required' };
  return store.submitQuote(rfqId, user.org_id, body.business_id, {
    price_usd: body.price_usd, currency: body.currency || 'USD', incoterm: body.incoterm || 'EXW',
    lead_time: body.lead_time || null, moq: body.moq || 1, validity_days: body.validity_days || 30, notes: body.notes || ''
  });
}

module.exports = { dashboard, claimPage, storefrontPage, productsPage, rfqInbox, quotesOutbox, saveStorefront, saveProduct, saveEvidence, submitQuote };
