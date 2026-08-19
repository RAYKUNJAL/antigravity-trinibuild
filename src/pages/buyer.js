'use strict';
// Buyer workspace — server-rendered pages.
const ui = require('../ui');
const D = require('../domain');

const STATUSES = D.ORDER_STATUSES;

function guard() {
  return ui.shell('Sign in required', '<section class="section"><div class="glass" style="max-width:480px;margin:0 auto;padding:28px;text-align:center"><h1>Sign in required</h1><p style="color:var(--on-surface-variant)">You need an account to use the buyer workspace.</p><a class="btn btn-primary" href="/signup?role=buyer">Create free account</a> <a class="btn btn-glass" href="/login">Sign in</a></div></section>', '/buyer');
}

function bizName(store, id) { const b = store.getBusiness(id); return b ? b.name : 'Business'; }
function orgName(store, id) { const o = store._db().organizations.find(x => x.id === id); return o ? o.name : 'Org'; }

function dashboard(store, user) {
  if (!user) return guard();
  const myRfqs = store.listRfqs({}).filter(r => r.buyer_org_id === user.org_id || r.buyer_user_id === user.user_id);
  const orders = store.listOrders(user.org_id).filter(o => o.buyer_org_id === user.org_id);
  const quotes = store._db().quotes.filter(q => myRfqs.some(r => r.id === q.rfq_id));
  const saved = store.listSavedSearches(user.org_id);
  const wl = store.listWatchlists(user.org_id);
  const body = '<section class="section"><div class="section-head"><h1>Buyer Dashboard</h1><p>Track your sourcing requests, quotes and orders.</p></div>'
    + '<div class="bento" style="margin-bottom:24px">'
    + '<div class="glass bento-4"><div class="bento-kicker">My RFQs</div><div class="big-num">' + myRfqs.length + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Quotes received</div><div class="big-num">' + quotes.length + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Orders</div><div class="big-num">' + orders.length + '</div></div>'
    + '<div class="glass bento-4"><div class="bento-kicker">Watchlist</div><div class="big-num">' + wl.length + '</div></div></div>'
    + '<div style="display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap"><a class="btn btn-primary" href="/sourcing">Post a sourcing request</a><a class="btn btn-glass" href="/browse">Find suppliers</a></div>'
    + '<div class="section-head"><h2>My sourcing requests</h2></div><div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Product</th><th>Qty</th><th>Destination</th><th>Status</th><th></th></tr>'
    + myRfqs.slice(0, 20).map(r => '<tr><td>' + ui.esc(r.product) + '</td><td>' + r.quantity + '</td><td>' + ui.esc(r.destination_country || '-') + '</td><td>' + ui.esc(r.status) + '</td><td><a class="btn btn-glass" href="/buyer/rfqs/' + r.id + '">View quotes</a></td></tr>').join('') || '<tr><td colspan="5">No requests yet.</td></tr></table></div>'
    + '<div class="section-head" style="margin-top:40px"><h2>My orders</h2></div><div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>PO</th><th>Product</th><th>Status</th><th>Total</th><th></th></tr>'
    + orders.slice(0, 20).map(o => '<tr><td>' + ui.esc(o.po_number || '-') + '</td><td>' + ui.esc(o.product) + '</td><td>' + ui.esc(o.status) + '</td><td>' + ui.esc(o.currency || 'USD') + ' ' + o.price_usd + '</td><td><a class="btn btn-glass" href="/buyer/orders/' + o.id + '">Track</a></td></tr>').join('') || '<tr><td colspan="5">No orders yet.</td></tr></table></div>'
    + (saved.length ? '<div class="section-head" style="margin-top:40px"><h2>Saved searches</h2></div><div class="glass" style="padding:24px"><ul style="padding-left:18px">' + saved.map(s => '<li>' + ui.esc(s.name) + ' <span class="mono">' + ui.esc(JSON.stringify(s.filters || {})) + '</span></li>').join('') + '</ul></div>' : '') + '</section>';
  return ui.shell('Buyer Dashboard', body, '/buyer', user);
}

function rfqDetail(store, user, rfqId) {
  if (!user) return guard();
  const rfq = store.getRfq(rfqId);
  if (!rfq) return ui.notFoundPage();
  const quotes = store.listQuotesForRfq(rfqId);
  const rows = quotes.map(q => {
    const b = store.getBusiness(q.business_id);
    const lc = q.landed_cost_estimate ? 'US$' + q.landed_cost_estimate.total : '-';
    return '<tr><td>' + ui.esc(b ? b.name : '—') + (b ? '<br/>' + ui.stateBadge(b.state) : '') + '</td><td>US$' + q.price_usd + '</td><td>' + ui.esc(q.currency || 'USD') + '</td><td>' + (q.moq || '-') + '</td><td>' + ui.esc(q.lead_time || '-') + '</td><td>' + ui.esc(q.incoterm || '-') + '</td><td>' + ui.esc(q.payment_terms || '-') + '</td><td>' + (q.validity_days || '-') + 'd</td><td>v' + (q.version || 1) + ' · ' + ui.esc(q.status) + '</td><td>' + lc + '</td>'
      + '<td><form method="post" action="/buyer/rfqs/' + rfqId + '/quotes/' + q.id + '/accept" style="display:inline"><button class="btn btn-primary" type="submit">Accept → Order</button></form>'
      + '<details style="display:inline-block;margin-left:6px"><summary class="btn btn-glass">Counter</summary><form method="post" action="/buyer/rfqs/' + rfqId + '/quotes/' + q.id + '/counter" style="display:grid;gap:8px;padding:12px;min-width:280px">'
      + '<input name="price_usd" type="number" step="0.01" placeholder="Counter price USD" value="' + q.price_usd + '"/>'
      + '<input name="moq" type="number" placeholder="MOQ" value="' + (q.moq || '') + '"/>'
      + '<input name="lead_time" placeholder="Lead time" value="' + ui.esc(q.lead_time || '') + '"/>'
      + '<select name="incoterm"><option value="EXW">EXW</option><option value="FOB">FOB</option><option value="CIF">CIF</option><option value="DDP">DDP</option></select>'
      + '<textarea name="message" rows="2" placeholder="Message to supplier"></textarea>'
      + '<button class="btn btn-primary" type="submit">Send counteroffer</button></form></details></td></tr>';
  }).join('');
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/buyer">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:1100px"><h1 style="margin:0 0 4px">' + ui.esc(rfq.product) + '</h1>'
    + '<p style="color:var(--on-surface-variant)">Qty ' + rfq.quantity + ' · ' + ui.esc(rfq.destination_country || 'Any destination') + ' · Deadline ' + ui.esc(rfq.deadline || '-') + ' · Status ' + ui.esc(rfq.status) + '</p>'
    + (rfq.notes ? '<p style="color:var(--on-surface-variant);font-size:14px">' + ui.esc(rfq.notes) + '</p>' : '')
    + '<h2 style="margin-top:24px">Quotes (' + quotes.length + ')</h2>'
    + '<div style="overflow-x:auto;margin-top:12px"><table><tr><th>Supplier</th><th>Unit price</th><th>Currency</th><th>MOQ</th><th>Lead time</th><th>Incoterm</th><th>Payment terms</th><th>Validity</th><th>Version/Status</th><th>Est. landed cost</th><th></th></tr>' + rows + '</table></div></div></section>';
  return ui.shell('RFQ · ' + rfq.product, body, '/buyer', user);
}

function statusTracker(status) {
  const i = STATUSES.indexOf(status);
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0">' + STATUSES.map((s, idx) => {
    const cls = idx < i ? 'state-badge verified' : (idx === i ? 'state-badge claimed' : 'state-badge unclaimed');
    return '<span class="' + cls + '" style="padding:5px 10px;font-size:11px">' + s.replace(/_/g, ' ') + '</span>';
  }).join('') + '</div>';
}

function orderDetail(store, user, orderId) {
  if (!user) return guard();
  const o = store.getOrder(orderId);
  if (!o || o.buyer_org_id !== user.org_id) return ui.notFoundPage();
  const history = (o.status_history || []).map(h => '<tr><td>' + ui.esc(h.status) + '</td><td>' + ui.esc(h.at) + '</td><td>' + ui.esc(h.by || '-') + '</td></tr>').join('');
  const actions = [];
  if (o.status === 'shipped') actions.push('<form method="post" action="/buyer/orders/' + o.id + '/status" style="display:inline"><input type="hidden" name="status" value="delivered"/><button class="btn btn-primary" type="submit">Confirm receipt</button></form>');
  if (o.status === 'delivered') {
    actions.push('<form method="post" action="/buyer/orders/' + o.id + '/status" style="display:inline"><input type="hidden" name="status" value="closed"/><button class="btn btn-primary" type="submit">Close order</button></form>');
    actions.push('<details style="display:inline-block;margin-left:6px"><summary class="btn btn-glass">Leave review</summary><form method="post" action="/buyer/reviews" style="display:grid;gap:8px;padding:12px;min-width:280px"><input type="hidden" name="order_id" value="' + o.id + '"/><input type="hidden" name="reviewee_org_id" value="' + o.supplier_org_id + '"/><select name="rating" required><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Bad</option></select><textarea name="comment" rows="2" placeholder="Comment (optional)"></textarea><button class="btn btn-primary" type="submit">Submit review</button></form></details>');
  }
  if (o.status === 'po_issued' || o.status === 'rfq_received') actions.push('<a class="btn btn-glass" href="/buyer/orders/' + o.id + '/messages">Message supplier</a>');
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/buyer">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:860px"><h1 style="margin:0">Order ' + ui.esc(o.po_number || o.id) + '</h1>'
    + '<p style="color:var(--on-surface-variant)">' + ui.esc(o.product) + ' · Qty ' + o.quantity + ' · ' + ui.esc(o.currency || 'USD') + ' ' + o.price_usd + (o.deposit_amount ? ' · Deposit ' + ui.esc(o.currency || 'USD') + ' ' + o.deposit_amount : '') + '</p>'
    + '<p style="color:var(--on-surface-variant);font-size:14px">Supplier: ' + ui.esc(orgName(store, o.supplier_org_id)) + ' · ' + ui.esc(o.incoterm || 'EXW') + (o.fx_rate ? ' · FX ' + o.fx_rate : '') + (o.shipping && o.shipping.tracking ? ' · Tracking ' + ui.esc(o.shipping.tracking) : '') + '</p>'
    + statusTracker(o.status)
    + '<h2>Status history</h2><div class="glass" style="padding:16px;overflow-x:auto"><table><tr><th>Status</th><th>At</th><th>By</th></tr>' + (history || '<tr><td colspan="3">No history yet.</td></tr>') + '</table></div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">' + actions.join('') + '<a class="btn btn-glass" href="/buyer/orders/' + o.id + '/invoice">Invoice</a><a class="btn btn-glass" href="/buyer/orders/' + o.id + '/documents">Documents</a></div></div></section>';
  return ui.shell('Order ' + (o.po_number || o.id), body, '/buyer', user);
}

function invoicePage(store, user, orderId) {
  if (!user) return guard();
  const o = store.getOrder(orderId);
  if (!o || o.buyer_org_id !== user.org_id) return ui.notFoundPage();
  const subtotal = Number(o.price_usd) || 0;
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/buyer/orders/' + o.id + '">← Back to order</a> <button class="btn btn-primary" onclick="window.print()">Print / Save PDF</button></div>'
    + '<div class="glass" style="padding:32px;max-width:760px" id="invoice"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px"><div><h1 style="margin:0 0 4px">Invoice</h1><p style="color:var(--on-surface-variant);margin:0">' + ui.esc(o.po_number || o.id) + '</p></div><div style="text-align:right"><p style="margin:0"><strong>Caribbean Trade Network</strong></p><p style="color:var(--on-surface-variant);margin:0;font-size:13px">trade.juvay.app</p></div></div>'
    + '<table style="margin-top:24px"><tr><th>Description</th><th>Qty</th><th>Unit price</th><th>Total</th></tr><tr><td>' + ui.esc(o.product) + '</td><td>' + o.quantity + '</td><td>' + ui.esc(o.currency || 'USD') + ' ' + (Number(o.price_usd) / Math.max(1, o.quantity)).toFixed(2) + '</td><td>' + ui.esc(o.currency || 'USD') + ' ' + subtotal.toFixed(2) + '</td></tr></table>'
    + '<div style="margin-top:20px;display:flex;justify-content:flex-end"><div style="min-width:240px"><p style="display:flex;justify-content:space-between;margin:4px 0"><span>Subtotal</span><span>' + ui.esc(o.currency || 'USD') + ' ' + subtotal.toFixed(2) + '</span></p><p style="display:flex;justify-content:space-between;margin:4px 0"><span>Deposit paid</span><span>' + ui.esc(o.currency || 'USD') + ' ' + (Number(o.deposit_amount) || 0).toFixed(2) + '</span></p><p style="display:flex;justify-content:space-between;margin:4px 0;font-weight:700;border-top:1px solid var(--outline-variant);padding-top:8px"><span>Balance due</span><span>' + ui.esc(o.currency || 'USD') + ' ' + Math.max(0, subtotal - (Number(o.deposit_amount) || 0)).toFixed(2) + '</span></p></div></div>'
    + '<p style="margin-top:24px;font-size:13px;color:var(--on-surface-variant)">Incoterm: ' + ui.esc(o.incoterm || 'EXW') + ' · Payment terms: ' + ui.esc(o.payment_terms || '—') + (o.fx_rate ? ' · FX rate: ' + o.fx_rate : '') + ' · Issued: ' + ui.esc(o.created_at || '') + '</p></div>'
    + '<style>@media print { body * { visibility: hidden; } #invoice, #invoice * { visibility: visible; } #invoice { position: absolute; left: 0; top: 0; width: 100%; } .nav, footer, .skip-link { display: none !important; } }</style></section>';
  return ui.shell('Invoice ' + (o.po_number || o.id), body, '/buyer', user);
}

function documentsPage(store, user, orderId) {
  if (!user) return guard();
  const docs = orderId ? store.listDocuments({ orderId }) : store.listDocuments({ orgId: user.org_id });
  const rows = docs.map(d => '<tr><td>' + ui.esc(d.kind) + '</td><td>' + ui.esc(d.file_name || d.url_or_path || '-') + '</td><td>' + ui.esc(d.notes || '') + '</td><td>' + ui.esc(d.created_at) + '</td></tr>').join('') || '<tr><td colspan="4">No documents yet.</td></tr>';
  const kinds = ['invoice', 'packing_list', 'certificate_of_origin', 'customs', 'certification', 'spec_sheet', 'buyer_requirement', 'other'].map(k => '<option value="' + k + '">' + k.replace(/_/g, ' ') + '</option>').join('');
  const body = '<section class="section"><div style="margin-bottom:16px">' + (orderId ? '<a class="btn btn-glass" href="/buyer/orders/' + orderId + '">← Back to order</a>' : '<a class="btn btn-glass" href="/buyer">← Dashboard</a>') + '</div>'
    + '<div class="glass" style="padding:28px;max-width:860px"><h1 style="margin:0 0 16px">Document vault</h1>'
    + '<div style="overflow-x:auto"><table><tr><th>Kind</th><th>File</th><th>Notes</th><th>Uploaded</th></tr>' + rows + '</table></div>'
    + '<h2 style="margin-top:24px">Add document</h2><form method="post" action="/buyer/documents/add" style="display:grid;gap:12px;margin-top:12px">'
    + (orderId ? '<input type="hidden" name="order_id" value="' + orderId + '"/>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">'
    + '<div><label>Kind</label><select name="kind">' + kinds + '</select></div>'
    + '<div><label>File name</label><input name="file_name" placeholder="e.g. invoice-01.pdf"/></div>'
    + '<div><label>MIME</label><input name="mime" placeholder="application/pdf"/></div>'
    + '<div><label>Size (bytes)</label><input name="size" type="number" value="0"/></div></div>'
    + '<div><label>Reference / URL</label><input name="url_or_path" placeholder="/uploads/… or https://…"/></div>'
    + '<div><label>Notes</label><input name="notes"/></div>'
    + '<button class="btn btn-primary" type="submit">Add document</button></form></div></section>';
  return ui.shell('Documents', body, '/buyer', user);
}

function messagesPage(store, user, orderId) {
  if (!user) return guard();
  const thread = 'order-' + orderId;
  const msgs = store.messagesForThread(thread);
  const rows = msgs.map(m => {
    const u = store._db().users.find(x => x.id === m.sender_id);
    const mine = m.sender_id === user.user_id;
    return '<div class="kai-msg ' + (mine ? 'user' : 'bot') + '" style="' + (mine ? 'align-self:flex-end' : 'align-self:flex-start') + '"><strong>' + ui.esc(u ? u.name : 'User') + '</strong> · <span style="font-size:12px">' + ui.esc(m.created_at) + '</span><br/>' + ui.esc(m.body) + '</div>';
  }).join('') || '<p style="color:var(--on-surface-variant)">No messages yet. Start the conversation below.</p>';
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/buyer/orders/' + orderId + '">← Back to order</a></div>'
    + '<div class="glass" style="padding:24px;max-width:720px"><h1 style="margin:0 0 16px">Order messages</h1>'
    + '<div style="display:flex;flex-direction:column;gap:10px;background:#f6fafb;border-radius:12px;padding:14px;min-height:200px;max-height:420px;overflow-y:auto">' + rows + '</div>'
    + '<form method="post" action="/buyer/messages/send" style="display:grid;gap:10px;margin-top:14px"><input type="hidden" name="thread_id" value="' + thread + '"/><input type="hidden" name="order_id" value="' + orderId + '"/><textarea name="body" rows="2" placeholder="Message the supplier…" required></textarea><button class="btn btn-primary" type="submit">Send</button></form></div></section>';
  return ui.shell('Messages', body, '/buyer', user);
}

function savedPage(store, user) {
  if (!user) return guard();
  const saved = store.listSavedSearches(user.org_id);
  const wl = store.listWatchlists(user.org_id);
  const wlRows = wl.map(w => '<tr><td>' + ui.esc(bizName(store, w.business_id)) + '</td><td><form method="post" action="/buyer/watchlist/remove" style="display:inline"><input type="hidden" name="business_id" value="' + w.business_id + '"/><button class="btn btn-glass" type="submit">Remove</button></form></td></tr>').join('') || '<tr><td colspan="2">Watchlist empty.</td></tr>';
  const body = '<section class="section"><div style="margin-bottom:16px"><a class="btn btn-glass" href="/buyer">← Dashboard</a></div>'
    + '<div class="glass" style="padding:28px;max-width:720px"><h1 style="margin:0 0 16px">Saved searches</h1>'
    + '<form method="post" action="/buyer/saved/add" style="display:grid;gap:12px;margin-bottom:20px">'
    + '<div><label>Name</label><input name="name" placeholder="e.g. Cocoa suppliers in Jamaica"/></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px">'
    + '<div><label>Category</label><input name="category" placeholder="food_beverage"/></div>'
    + '<div><label>Country</label><input name="country" placeholder="Jamaica"/></div>'
    + '<div><label>Keyword</label><input name="keyword"/></div></div>'
    + '<button class="btn btn-primary" type="submit">Save search</button></form>'
    + '<ul style="padding-left:18px">' + saved.map(s => '<li>' + ui.esc(s.name) + ' <span class="mono">' + ui.esc(JSON.stringify(s.filters || {})) + '</span></li>').join('') + '</ul>'
    + '<h2 style="margin-top:28px">Watchlist</h2><div style="overflow-x:auto;margin-top:8px"><table><tr><th>Business</th><th></th></tr>' + wlRows + '</table></div></div></section>';
  return ui.shell('Saved searches', body, '/buyer', user);
}

// POST handlers
function counterQuote(store, user, rfqId, quoteId, body) {
  if (!user) return { error: 'login required' };
  const q = store._db().quotes.find(x => x.id === quoteId);
  if (!q) return { error: 'quote_not_found' };
  return store.createCounterOffer(quoteId, q.supplier_org_id, body, user.user_id);
}
function acceptQuote(store, user, rfqId, quoteId) {
  if (!user) return { error: 'login required' };
  const q = store._db().quotes.find(x => x.id === quoteId);
  if (!q) return { error: 'quote_not_found' };
  store.acceptQuote(quoteId, user.org_id);
  const b = store.getBusiness(q.business_id);
  const order = store.createOrder({ buyer_org_id: user.org_id, supplier_org_id: q.supplier_org_id, rfq_id: rfqId, quote_id: quoteId, product: (store.getRfq(rfqId) || {}).product || 'Order', quantity: q.moq || 1, price_usd: q.price_usd, currency: q.currency || 'USD', incoterm: q.incoterm || 'EXW', terms: {} });
  store.audit(user.user_id, 'order_created_from_quote', 'order', order.id, { quote_id: quoteId });
  return { redirect: '/buyer/orders/' + order.id };
}
function setOrderStatus(store, user, orderId, status) {
  if (!user) return { error: 'login required' };
  return store.updateOrderStatus(orderId, status, user.user_id);
}
function addReview(store, user, body) {
  if (!user) return { error: 'login required' };
  return store.addReview({ order_id: body.order_id, reviewer_org_id: user.org_id, reviewee_org_id: body.reviewee_org_id, rating: body.rating, comment: body.comment });
}
function addDocument(store, user, body) {
  if (!user) return { error: 'login required' };
  return store.addDocument({ order_id: body.order_id || null, org_id: user.org_id, uploaded_by: user.user_id, kind: body.kind, file_name: body.file_name || null, mime: body.mime || null, size: body.size || 0, url_or_path: body.url_or_path || null, notes: body.notes || '' });
}
function sendMessage(store, user, body) {
  if (!user) return { error: 'login required' };
  const o = store.getOrder(body.order_id);
  const recipient = o ? o.supplier_org_id : null;
  store.sendMessage({ thread_id: body.thread_id || ('order-' + body.order_id), sender_id: user.user_id, recipient_id: recipient, org_id: user.org_id, order_id: body.order_id || null, body: body.body, attachment_ids: [] });
  store.notify(recipient, 'message', 'New message', 'You have a new message on order ' + (o ? (o.po_number || o.id) : body.order_id), '/supplier');
  return { redirect: '/buyer/orders/' + body.order_id + '/messages' };
}
function addSaved(store, user, body) {
  if (!user) return { error: 'login required' };
  const filters = {};
  for (const k of ['category', 'country', 'keyword']) if (body[k]) filters[k] = body[k];
  return store.addSavedSearch(user.org_id, body.name || 'Saved search', filters);
}
function watchlistAdd(store, user, body) {
  if (!user) return { error: 'login required' };
  return store.addWatchlist(user.org_id, body.business_id);
}
function watchlistRemove(store, user, body) {
  if (!user) return { error: 'login required' };
  return store.removeWatchlist(user.org_id, body.business_id);
}

module.exports = { dashboard, rfqDetail, orderDetail, invoicePage, documentsPage, messagesPage, savedPage, counterQuote, acceptQuote, setOrderStatus, addReview, addDocument, sendMessage, addSaved, watchlistAdd, watchlistRemove };
