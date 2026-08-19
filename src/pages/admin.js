'use strict';
// Admin dashboard — platform operations console.
const ui = require('../ui');
const D = require('../domain');

function shell(title, body, tab) {
  const tabs = [['overview', 'Overview'], ['verification', 'Verification'], ['businesses', 'Businesses'], ['orders', 'Orders'], ['users', 'Users & plans'], ['audit', 'Audit log'], ['agents', 'AI operations']]
    .map(t => '<a class="btn ' + (t[0] === tab ? 'btn-primary' : 'btn-glass') + '" href="/admin' + (t[0] === 'overview' ? '' : '/' + t[0]) + '">' + t[1] + '</a>').join('');
  return ui.shell(title, '<section class="section"><div class="section-head" style="margin-bottom:20px"><h1>Admin Console</h1><p>Platform operations — R&amp;R Digital.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px">' + tabs + '</div>' + body + '</section>', null, { isAdmin: true });
}

function overview(store) {
  const db = store._db();
  const byState = {};
  for (const b of db.businesses) byState[b.state] = (byState[b.state] || 0) + 1;
  const orders = db.orders;
  const byStatus = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  const pending = db.businesses.filter(b => b.verification && Object.values(b.verification).some(v => v.status === 'pending_review')).length;
  const kpis = [
    ['Users', db.users.length], ['Organizations', db.organizations.length], ['Businesses', db.businesses.length],
    ['Products', db.products.length], ['RFQs', db.rfqs.length], ['Quotes', db.quotes.length],
    ['Orders', orders.length], ['Payments', db.payments.length], ['Reviews', db.reviews.length],
    ['Pending verification', pending], ['Messages', db.messages.length], ['Audit entries', db.audit_log.length],
  ];
  const kpiHtml = kpis.map(k => '<div class="glass bento-4"><div class="bento-kicker">' + k[0] + '</div><div class="big-num">' + k[1] + '</div></div>').join('');
  const stateRows = Object.entries(byState).map(([s, n]) => '<tr><td>' + ui.esc(s) + '</td><td>' + n + '</td></tr>').join('');
  const orderRows = Object.entries(byStatus).map(([s, n]) => '<tr><td>' + ui.esc(s) + '</td><td>' + n + '</td></tr>').join('');
  const activity = store.listActivity(15).map(a => '<tr><td>' + ui.esc(a.action) + '</td><td>' + ui.esc(a.actor || '-') + '</td><td>' + ui.esc(a.target || '-') + '</td><td>' + ui.esc(a.at) + '</td></tr>').join('');
  const body = '<div class="bento">' + kpiHtml + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:20px">'
    + '<div class="glass" style="padding:20px"><h2 style="font-size:18px">Businesses by state</h2><table><tr><th>State</th><th>Count</th></tr>' + stateRows + '</table></div>'
    + '<div class="glass" style="padding:20px"><h2 style="font-size:18px">Orders by status</h2><table><tr><th>Status</th><th>Count</th></tr>' + orderRows + '</table></div></div>'
    + '<div class="glass" style="padding:20px;margin-top:16px"><h2 style="font-size:18px">Recent activity</h2><div style="overflow-x:auto"><table><tr><th>Action</th><th>Actor</th><th>Target</th><th>At</th></tr>' + (activity || '<tr><td colspan="4">None</td></tr>') + '</table></div></div>';
  return shell('Overview', body, 'overview');
}

function verification(store) {
  const pending = store._db().businesses.filter(b => b.verification && Object.values(b.verification).some(v => v.status === 'pending_review'));
  const rows = pending.map(b => {
    const dims = Object.entries(b.verification || {}).filter(([, v]) => v.status === 'pending_review')
      .map(([d, v]) => '<tr><td>' + ui.esc(d) + '</td><td>' + ui.esc(v.note || '') + '</td><td>' + ui.esc(v.checked_at || '') + '</td><td><form method="post" action="/admin/approve/' + b.id + '" style="display:inline"><input type="hidden" name="dimension" value="' + d + '"/><button class="btn btn-primary" type="submit">Approve</button></form></td></tr>').join('');
    return '<div class="glass" style="padding:18px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><strong>' + ui.esc(b.name) + '</strong>' + ui.stateBadge(b.state) + '</div><div style="overflow-x:auto;margin-top:10px"><table><tr><th>Dimension</th><th>Evidence note</th><th>Submitted</th><th></th></tr>' + dims + '</table></div></div>';
  }).join('') || '<div class="glass" style="padding:24px"><p style="margin:0">No evidence pending review. All caught up!</p></div>';
  return shell('Verification queue', rows, 'verification');
}

function businesses(store) {
  const db = store._db();
  const rows = db.businesses.slice(0, 100).map(b => '<tr><td>' + ui.esc(b.name) + '</td><td>' + ui.esc(b.country) + '</td><td>' + ui.esc(b.category || '-') + '</td><td>' + ui.stateBadge(b.state) + '</td><td>' + (b.owner_org_id ? 'claimed' : 'unclaimed') + '</td>'
    + '<td><form method="post" action="/admin/businesses/' + b.id + '/state" style="display:inline"><select name="state"><option value="RESTRICTED">Restrict</option><option value="SUSPENDED">Suspend</option></select><button class="btn btn-glass" type="submit">Apply</button></form></td></tr>').join('');
  return shell('Businesses', '<div class="glass" style="padding:24px;overflow-x:auto"><p style="color:var(--on-surface-variant);font-size:13px;margin:0 0 10px">Showing first 100 of ' + db.businesses.length + '. Moderation actions are audit-logged.</p><table><tr><th>Name</th><th>Country</th><th>Category</th><th>State</th><th>Claim</th><th></th></tr>' + rows + '</table></div>', 'businesses');
}

function orders(store) {
  const rows = store._db().orders.slice().reverse().slice(0, 100).map(o => '<tr><td>' + ui.esc(o.po_number || o.id) + '</td><td>' + ui.esc(o.product) + '</td><td>' + ui.esc(o.buyer_org_id) + ' → ' + ui.esc(o.supplier_org_id) + '</td><td>' + ui.esc(o.status) + '</td><td>' + ui.esc(o.currency || 'USD') + ' ' + (o.price_usd || 0) + '</td><td>' + ui.esc(o.created_at) + '</td></tr>').join('') || '<tr><td colspan="6">No orders.</td></tr>';
  return shell('Orders', '<div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>PO</th><th>Product</th><th>Buyer → Supplier</th><th>Status</th><th>Value</th><th>Created</th></tr>' + rows + '</table></div>', 'orders');
}

function usersPage(store) {
  const db = store._db();
  const userRows = db.users.map(u => '<tr><td>' + ui.esc(u.name || '') + '</td><td>' + ui.esc(u.email || '') + '</td><td>' + ui.esc(u.role || '-') + '</td><td>' + ui.esc(u.org_id || '-') + '</td></tr>').join('') || '<tr><td colspan="4">No users yet.</td></tr>';
  const orgRows = db.organizations.map(o => {
    const sub = store.getSubscription(o.id);
    return '<tr><td>' + ui.esc(o.name || o.id) + '</td><td>' + ui.esc(sub ? (sub.plan_slug || 'free') : 'free') + '</td>'
      + '<td><form method="post" action="/admin/orgs/' + o.id + '/plan" style="display:inline"><select name="plan"><option value="FREE">Free</option><option value="PRO">Pro</option><option value="TRADE">Trade</option></select><button class="btn btn-glass" type="submit">Set</button></form></td></tr>';
  }).join('') || '<tr><td colspan="3">No orgs yet.</td></tr>';
  return shell('Users & plans', '<div class="glass" style="padding:24px;overflow-x:auto"><h2 style="font-size:18px">Users</h2><table><tr><th>Name</th><th>Email</th><th>Role</th><th>Org</th></tr>' + userRows + '</table><h2 style="font-size:18px;margin-top:24px">Organizations &amp; plans</h2><table><tr><th>Org</th><th>Plan</th><th></th></tr>' + orgRows + '</table></div>', 'users');
}

function auditPage(store) {
  const rows = store.listAudit({ limit: 100 }).map(a => '<tr><td>' + ui.esc(a.action) + '</td><td>' + ui.esc(a.actor_user_id || '-') + '</td><td>' + ui.esc(a.entity || '-') + '</td><td>' + ui.esc(a.entity_id || '-') + '</td><td>' + ui.esc(a.created_at) + '</td></tr>').join('') || '<tr><td colspan="5">No audit entries.</td></tr>';
  return shell('Audit log', '<div class="glass" style="padding:24px;overflow-x:auto"><table><tr><th>Action</th><th>Actor</th><th>Entity</th><th>ID</th><th>At</th></tr>' + rows + '</table></div>', 'audit');
}

function agents(store) {
  const ai = store._db().activity.filter(a => ['concierge_query', 'ai_team', 'rfq_routing', 'quote_assistant'].includes(a.action)).slice(0, 30);
  const rows = ai.map(a => '<tr><td>' + ui.esc(a.action) + '</td><td>' + ui.esc(a.actor || '-') + '</td><td>' + ui.esc(JSON.stringify(a.detail || {}).slice(0, 80)) + '</td><td>' + ui.esc(a.at) + '</td></tr>').join('') || '<tr><td colspan="4">No AI operations logged yet.</td></tr>';
  return shell('AI operations', '<div class="glass" style="padding:24px;overflow-x:auto"><p style="color:var(--on-surface-variant);font-size:13px;margin:0 0 10px">Agent activity: RFQ routing, quote assistant, concierge queries, verification triage.</p><table><tr><th>Action</th><th>Agent</th><th>Detail</th><th>At</th></tr>' + rows + '</table><p style="margin-top:16px"><a class="btn btn-glass" href="/admin/ai-team">Open AI team console</a></p></div>', 'agents');
}

// POST handlers
function approveEvidence(store, businessId, body) { return store.approveEvidence(businessId, body.dimension); }
function setBusinessState(store, businessId, body) {
  const b = store.getBusiness(businessId);
  if (!b) return { error: 'not_found' };
  if (body.state === 'RESTRICTED' || body.state === 'SUSPENDED') b.state = body.state;
  else return { error: 'bad_state' };
  store.audit(null, 'business_moderated', 'business', businessId, { state: body.state });
  return { ok: true };
}
function setOrgPlan(store, orgId, body) { return store.setPlan(orgId, String(body.plan || 'FREE').toUpperCase()); }

module.exports = { overview, verification, businesses, orders, usersPage, auditPage, agents, approveEvidence, setBusinessState, setOrgPlan };
