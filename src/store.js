// src/store.js — JSON-file-backed store with provenance, audit, plans, trade lifecycle
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const domain = require('./domain');
const pg = require('./pg');
const D = domain;

const ROOT = path.resolve(__dirname, '..');
const DB_FILE = process.env.DB_FILE || path.join(ROOT, 'data', 'db.json');

function blank() {
  return {
    users: [], organizations: [], memberships: [], subscriptions: [],
    businesses: [], representatives: [], products: [], rfqs: [], quotes: [], orders: [],
    payments: [], landed_cost_scenarios: [], trade_rules: [], hs_candidates: [],
    activity: [], sources: [],
    documents: [], messages: [], reviews: [], saved_searches: [], watchlists: [],
    org_members: [], approvals: [], notifications: [], audit_log: [],
  };
}
let db = (() => {
  let d;
  try { d = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE,'utf8')) : blank(); } catch { d = blank(); }
  const b = blank();
  for (const k of Object.keys(b)) { if (!Array.isArray(d[k])) d[k] = b[k]; }
  return d;
})();
let _t;
function persist() {
  clearTimeout(_t);
  _t = setTimeout(()=>{
    try { fs.mkdirSync(path.dirname(DB_FILE),{recursive:true}); fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); } catch(e){}
    pg.flushAll(db).catch(err=>console.error('pg flush error:', err && err.message));
  }, 40);
}
async function initPg(){
  await pg.migrate();
  const has = await pg.count('businesses');
  if (has > 0){
    const fresh = blank();
    await pg.hydrate(fresh);
    Object.keys(db).forEach(k=>{ db[k]=[]; });
    Object.assign(db, fresh);
    console.log('pg hydrate: businesses =', db.businesses.length, 'sources =', db.sources.length);
  } else {
    await pg.flushAll(db);
    console.log('pg seeded from db.json: businesses =', db.businesses.length);
  }
}
const nowIso = () => new Date().toISOString();
function log(action, actor, target, detail) {
  db.activity.unshift({ id: D.id('evt'), action, actor: actor||'system', target: target||null, detail: detail||{}, at: nowIso() });
  if (db.activity.length > 5000) db.activity = db.activity.slice(0, 5000); persist();
}

// ---- Users / organizations / memberships ----
function createUser({ email, name, password_hash, role='owner', org_name, island='tt', currency, buyer_external, buyer_destination, consents }) {
  const norm = String(email||'').trim().toLowerCase();
  if (db.users.some(u=>u.email===norm)) throw new Error('A user with that email already exists');
  const u = { id: D.id('usr'), email: norm, name, password_hash, role, island: island||'tt', currency: currency||'TTD',
    buyer_external: !!buyer_external, buyer_destination: buyer_destination||null, consents: consents||null, created_at: nowIso() };
  db.users.push(u);
  // org (default one per user for MVP)
  const org = { id: D.id('org'), name: org_name || name + "'s Company", island: island||'tt', currency: currency||'TTD', created_at: nowIso() };
  db.organizations.push(org);
  db.memberships.push({ id: D.id('mem'), user_id: u.id, org_id: org.id, role: 'owner', created_at: nowIso() });
  // auto free plan
  db.subscriptions.push({ id: D.id('sub'), user_id: u.id, org_id: org.id, plan_slug: 'free', status: 'active', source: 'free', started_at: nowIso(), expires_at: null });
  log('user_created', u.id, org.id, { email: norm }); persist();
  return { id: u.id, email: norm, name, role, island: u.island, currency: u.currency, org_id: org.id, org_name: org.name };
}
function getUserByEmail(email) { const e=String(email||'').trim().toLowerCase(); return db.users.find(u=>u.email===e)||null; }
function getUserById(id) { return db.users.find(u=>u.id===id)||null; }
function setPasswordHash(id, hash) { const u=getUserById(id); if(u){ u.password_hash=hash; persist(); } }
function listOrgUsers(orgId) { return db.memberships.filter(m=>m.org_id===orgId).map(m=>{ const u=getUserById(m.user_id); return u?{id:u.id,email:u.email,name:u.name,role:m.role}:null; }).filter(Boolean); }

// ---- Subscriptions / plans ----
function getSubscription(orgId) { return db.subscriptions.find(s=>s.org_id===orgId && s.status==='active') || db.subscriptions.find(s=>s.org_id===orgId) || null; }
function setPlan(orgId, planSlug, source='admin', {paypal_subscription_id, months=1}={}) {
  const plan = domain.planBySlug(planSlug);
  let sub = db.subscriptions.find(s=>s.org_id===orgId);
  const started = nowIso();
  let expires = null;
  if (plan.cycle !== 'forever') { const d=new Date(); d.setMonth(d.getMonth()+months); expires=d.toISOString(); }
  const rec = { id: sub?sub.id:D.id('sub'), user_id: (sub&&sub.user_id)||null, org_id: orgId, plan_slug: plan.slug, status:'active', source, paypal_subscription_id: paypal_subscription_id||null, started_at: started, expires_at: expires };
  if (sub) Object.assign(sub, rec); else db.subscriptions.push(rec);
  log('plan_changed', null, orgId, { plan: plan.slug, source }); persist();
  return rec;
}
function planAccess(orgId) { return domain.planBySlug(getSubscription(orgId)?.plan_slug || 'free'); }

// ---- Sources ----
function addSource({ name, url, tier, owner, terms }) {
  const s = { id: D.id('src'), name, url, tier: Number(tier)||6, owner, terms: terms||'reviewed', active: true, added_at: nowIso() };
  db.sources.push(s); persist(); return s;
}

// ---- Businesses ----
function addBusiness({ source_id, name, legal_name, country, city, category, website, address, source_url, phone, email }) {
  const b = {
    id: D.id('biz'), state: D.PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE, name, legal_name: legal_name||name,
    country, city, category, website, address, phone: phone||null, email: email||null,
    verification: D.blankVerification(),
    provenance: { name: D.provenance(source_id, source_url, nowIso()), country: D.provenance(source_id, source_url, nowIso()), category: D.provenance(source_id, source_url, nowIso()) },
    claimed_by: null, claimed_at: null, owner_org_id: null, created_at: nowIso(), updated_at: nowIso(),
  };
  db.businesses.push(b); log('business_discovered', null, b.id, { name }); persist(); return b;
}
function getBusiness(id) { return db.businesses.find(b=>b.id===id)||null; }
function publicBusiness(b) {
  const s=b.state;
  const pub={ id:b.id,name:b.name,country:b.country,city:b.city,category:b.category,website:(b.website&&!/example.(com|org)/i.test(b.website))?b.website:null,address:b.address,phone:b.phone||null,email:b.email||null,
    state:s,label:D.PUBLIC_LABEL[s]||s,
    verified_dimensions:Object.fromEntries(Object.entries(b.verification).filter(([,v])=>v.status==='verified').map(([k])=>[k,true])),
    provenance:b.provenance, can_publish_products:D.canPublishProducts(s), can_receive_rfq:D.canReceiveRfq(s), completeness_score: b.completeness_score||null };
  if (D.isUnclaimed(s)) pub.disclaimer=D.UNCLAIMED_DISCLAIMER;
  return pub;
}
function listBusinesses(){ return db.businesses.map(publicBusiness); }
function searchBusinesses({ q, category, country, city, limit } = {}){
  const term=(q||'').toLowerCase().trim();
  const cityT=(city||'').toLowerCase().trim();
  let out = db.businesses.map(publicBusiness).filter(b=>{
    if (category && b.category!==category) return false;
    if (country && b.country!==country) return false;
    if (cityT && !(b.city||'').toLowerCase().includes(cityT)) return false;
    if (term){ const hay=[b.name,b.country,b.city||'',b.category].join(' ').toLowerCase(); if(!hay.includes(term)) return false; }
    return true;
  });
  if (limit && out.length>limit) out = out.slice(0, limit);
  return out;
}
function businessesForOrg(orgId){ return db.businesses.filter(b=>b.owner_org_id===orgId); }

function claimBusiness(bizId, repId, orgId) {
  const b=getBusiness(bizId); if(!b) return {ok:false,error:'not_found'};
  if(!D.isUnclaimed(b.state)) return {ok:false,error:'already_claimed'};
  b.state=D.PROFILE_STATES.CLAIM_PENDING; b.claimed_by=repId; b.owner_org_id=orgId; b.claimed_at=nowIso();
  log('claim_submitted', repId, b.id, {name:b.name}); persist(); return {ok:true,business:publicBusiness(b)};
}
function approveClaim(bizId){ const b=getBusiness(bizId); if(!b||b.state!==D.PROFILE_STATES.CLAIM_PENDING) return {ok:false,error:'invalid_state'}; b.state=D.PROFILE_STATES.CLAIMED; log('claim_approved',null,b.id,{name:b.name}); persist(); return {ok:true,business:publicBusiness(b)}; }
function submitEvidence(bizId, repId, dimension, note){
  const b=getBusiness(bizId); if(!b||(b.state!==D.PROFILE_STATES.CLAIMED && b.state!==D.PROFILE_STATES.CLAIM_PENDING)) return {ok:false,error:'must_be_claimed'};
  if(!D.VERIFICATION_DIMENSIONS.includes(dimension)) return {ok:false,error:'bad_dimension'};
  b.verification[dimension]={status:'pending_review',checked_at:nowIso(),note:note||'',submitted_by:repId};
  log('evidence_submitted',repId,b.id,{dimension}); persist(); return {ok:true,business:publicBusiness(b)};
}
function approveEvidence(bizId, dimension){
  const b=getBusiness(bizId); if(!b) return {ok:false,error:'not_found'};
  if(!D.VERIFICATION_DIMENSIONS.includes(dimension)) return {ok:false,error:'bad_dimension'};
  b.verification[dimension]={status:'verified',checked_at:nowIso()};
  const v=D.VERIFICATION_DIMENSIONS.filter(d=>b.verification[d].status==='verified');
  if(v.includes('legal_identity')&&v.includes('representative_authority')&&b.state===D.PROFILE_STATES.CLAIMED) b.state=D.PROFILE_STATES.IDENTITY_VERIFIED;
  if(b.state===D.PROFILE_STATES.IDENTITY_VERIFIED&&(v.includes('export_capacity')||v.includes('certification'))) b.state=D.PROFILE_STATES.TRADE_VERIFIED;
  log('evidence_approved',null,b.id,{dimension,state:b.state}); persist(); return {ok:true,business:publicBusiness(b)};
}

// ---- Products ----
function addProduct(bizId, orgId, repId, data){
  const b=getBusiness(bizId); if(!b) return {ok:false,error:'not_found'};
  if(b.owner_org_id!==orgId) return {ok:false,error:'not_owner'};
  if(!D.canPublishProducts(b.state)) return {ok:false,error:'requires_verification'};
  const p={ id:D.id('prod'), business_id:bizId, org_id:orgId, title:data.title, description:data.description||'',
    category:data.category||b.category, hs_candidate:data.hs_candidate||null, moq:Number(data.moq)||1,
    lead_time:data.lead_time||null, price_usd:Number(data.price_usd)||0, currency:data.currency||'USD',
    origin_country:b.country, published_by:repId, created_at:nowIso() };
  db.products.push(p); log('product_published',repId,b.id,{product:p.title}); persist(); return {ok:true,product:p};
}
function listProducts(bizId, orgId){ return db.products.filter(p=>(!bizId||p.business_id===bizId)&&(!orgId||p.org_id===orgId)); }

// ---- RFQs ----
function createRfq({ buyer_user_id, buyer_org_id, product, quantity, destination_country, deadline, notes, category }) {
  const rfq={ id:D.id('rfq'), buyer_user_id, buyer_org_id, product, quantity:Number(quantity)||1,
    destination_country, deadline, notes:notes||'', category:category||null, status:'open', created_at:nowIso() };
  db.rfqs.push(rfq); log('rfq_created',buyer_user_id,rfq.id,{product}); persist(); return rfq;
}
function listRfqs({status, orgId}={}){ return db.rfqs.filter(r=>!status||r.status===status); }
function getRfq(id){ return db.rfqs.find(r=>r.id===id)||null; }

// ---- Quotes ----
function submitQuote(rfqId, supplierOrgId, bizId, { price_usd, currency, incoterm, lead_time, moq, validity_days, notes }) {
  const rfq=getRfq(rfqId); if(!rfq) return {ok:false,error:'rfq_not_found'};
  const b=getBusiness(bizId); if(!b||b.owner_org_id!==supplierOrgId) return {ok:false,error:'not_supplier'};
  const plan=domain.planBySlug(getSubscription(supplierOrgId)?.plan_slug||'free');
  if(!plan.can_quote) return {ok:false,error:'plan_requires_upgrade',plan:plan.slug};
  const q={ id:D.id('qte'), rfq_id:rfqId, supplier_org_id:supplierOrgId, business_id:bizId, price_usd:Number(price_usd)||0,
    currency:currency||'USD', incoterm:incoterm||'EXW', lead_time, moq:Number(moq)||1, validity_days:Number(validity_days)||30,
    notes:notes||'', status:'submitted', version:1, parent_quote_id:null, negotiation_thread:[],
    payment_terms:null, packing_notes:null, attachments:[], fx_rate:null, landed_cost_estimate:null, created_at:nowIso() };
  db.quotes.push(q); log('quote_submitted',supplierOrgId,rfqId,{price:q.price_usd}); persist(); return {ok:true,quote:q};
}
function listQuotesForRfq(rfqId){ return db.quotes.filter(q=>q.rfq_id===rfqId); }

// ---- Orders ----
function createOrder({ buyer_org_id, supplier_org_id, rfq_id, quote_id, product, quantity, price_usd, currency, incoterm, terms }) {
  const now=nowIso();
  const order={ id:D.id('ord'), buyer_org_id, supplier_org_id, rfq_id, quote_id, product, quantity:Number(quantity)||1,
    price_usd:Number(price_usd)||0, currency:currency||'USD', incoterm:incoterm||'EXW',
    status:quote_id?'po_issued':'rfq_received',
    status_history:[{status:quote_id?'po_issued':'rfq_received', at:now, by:null}],
    po_number:'PO-'+new Date().getFullYear()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase(),
    deposit_amount:Number(terms?terms.deposit_amount:0)||0, payment_terms:(terms?terms.payment_terms:null),
    fx_rate:(terms?terms.fx_rate:null), shipping:{carrier:null,tracking:null,etd:null,eta:null},
    terms:terms||{}, milestones:[], documents:[], created_at:now };
  db.orders.push(order); log('order_created',buyer_org_id,order.id,{product,qty:order.quantity}); persist(); return order;
}
function getOrder(id){ return db.orders.find(o=>o.id===id)||null; }
function listOrders(orgId){ return db.orders.filter(o=>o.buyer_org_id===orgId||o.supplier_org_id===orgId); }
function addMilestone(orderId, label, dueAt){ const o=getOrder(orderId); if(!o) return {ok:false,error:'not_found'}; o.milestones.push({id:D.id('ms'),label,due_at:dueAt||null,status:'pending',at:nowIso()}); log('milestone_added',null,orderId,{label}); persist(); return {ok:true,order:o}; }
function addOrderDocument(orderId, kind, note){ const o=getOrder(orderId); if(!o) return {ok:false,error:'not_found'}; o.documents.push({id:D.id('doc'),kind,note:note||'',at:nowIso()}); log('document_added',null,orderId,{kind}); persist(); return {ok:true,order:o}; }

// ---- Payments ----
function createPaymentIntent({ order_id, buyer_org_id, amount, currency, method, provider, metadata, wam_payment_id, wam_checkout_url, wam_status }) {
  const pi={ id:D.id('pay'), order_id, buyer_org_id, amount:Number(amount)||0, currency:currency||'USD', method, provider:provider||null,
    status:'CREATED', metadata:metadata||{}, created_at:nowIso(), captured_at:null,
    wam_payment_id: wam_payment_id||null, wam_checkout_url: wam_checkout_url||null, wam_status: wam_status||null };
  db.payments.push(pi); log('payment_created',buyer_org_id,order_id,{amount:pi.amount,method}); persist(); return pi;
}
function markPayment(id, status, providerData){ const p=db.payments.find(x=>x.id===id); if(!p) return {ok:false,error:'not_found'}; p.status=status; if(providerData) p.provider_data=providerData; if(status==='PAID'||status==='RELEASED') p.captured_at=nowIso(); log('payment_status',null,id,{status}); persist(); return {ok:true,payment:p}; }

function markPaymentByWamRef(wamPaymentId, status, wamStatus) {
  const p = db.payments.find(x => x.wam_payment_id === wamPaymentId);
  if (!p) return { ok:false, error:'not_found' };
  p.status = status; if (wamStatus) p.wam_status = wamStatus;
  if (status === 'PAID' || status === 'RELEASED') p.captured_at = nowIso();
  log('payment_wam_status', null, p.order_id, { wam_payment_id: wamPaymentId, status });
  persist(); return { ok:true, payment:p };
}

function listPayments(orgId){ return db.payments.filter(p=>!orgId||p.buyer_org_id===orgId); }

// ---- Landed cost scenarios ----
function saveLandedCost(orgId, spec, result){ const r={ id:D.id('lc'), org_id:orgId, input:spec, result, created_at:nowIso() }; db.landed_cost_scenarios.push(r); persist(); return r; }
function listLandedCosts(orgId){ return db.landed_cost_scenarios.filter(r=>!orgId||r.org_id===orgId); }

// ---- Trade rules / HS ----
function addTradeRule({ jurisdiction, product_scope, title, rule_type, value, source_url, source_tier, effective_from }) {
  const r={ id:D.id('rule'), jurisdiction, product_scope:product_scope||[], title, rule_type, value, source_url, source_tier:Number(source_tier)||3, effective_from:effective_from||null, effective_to:null, created_at:nowIso() };
  db.trade_rules.push(r); persist(); return r;
}
function addHsCandidate({ hs, description, jurisdiction, confidence, source_url }) {
  const c={ id:D.id('hs'), hs, description, jurisdiction:jurisdiction||null, confidence:Number(confidence)||0.5, source_url:source_url||null, created_at:nowIso() };
  db.hs_candidates.push(c); persist(); return c;
}
function tradeRulesFor(jurisdiction, category){ return db.trade_rules.filter(r=>(!jurisdiction||r.jurisdiction===jurisdiction)&&(!category||r.product_scope.includes(category))); }

// ---- Activity ----
function listActivity(limit){ return db.activity.slice(0,Number(limit)||50); }


// ---- Documents ----
function addDocument({ order_id, rfq_id, org_id, uploaded_by, kind, file_name, mime, size, url_or_path, notes }) {
  const d={ id:D.id('doc'), order_id:order_id||null, rfq_id:rfq_id||null, org_id, uploaded_by:uploaded_by||null,
    kind:kind||'other', file_name:file_name||null, mime:mime||null, size:Number(size)||0, url_or_path:url_or_path||null,
    notes:notes||'', created_at:nowIso() };
  db.documents.push(d); log('document_added',uploaded_by,order_id||rfq_id||null,{kind:d.kind}); persist(); return d;
}
function listDocuments({ orgId, orderId }={}){ return db.documents.filter(d=>orgId?d.org_id===orgId:true).filter(d=>orderId?d.order_id===orderId:true); }
function getDocument(id){ return db.documents.find(d=>d.id===id)||null; }

// ---- Messages ----
function sendMessage({ thread_id, sender_id, recipient_id, org_id, order_id, rfq_id, body, attachment_ids }) {
  const m={ id:D.id('msg'), thread_id, sender_id, recipient_id:recipient_id||null, org_id:org_id||null,
    order_id:order_id||null, rfq_id:rfq_id||null, body:body||'', attachment_ids:attachment_ids||[],
    created_at:nowIso(), read_at:null };
  db.messages.push(m); persist(); return m;
}
function messagesForThread(thread_id){ return db.messages.filter(m=>m.thread_id===thread_id).sort((x,y)=>x.created_at<y.created_at?-1:1); }
function markMessageRead(id, userId){ const m=db.messages.find(x=>x.id===id); if(m){ if(m.sender_id!==userId){ if(!m.read_at){ m.read_at=nowIso(); persist(); } } } return m; }

// ---- Reviews / trust ----
function addReview({ order_id, reviewer_org_id, reviewee_org_id, rating, comment }) {
  if(db.reviews.some(r=>r.order_id===order_id ? r.reviewer_org_id===reviewer_org_id : false)) return {ok:false,error:'already_reviewed'};
  const r={ id:D.id('rev'), order_id, reviewer_org_id, reviewee_org_id, rating:Math.min(5,Math.max(1,Number(rating)||5)), comment:comment||'', created_at:nowIso() };
  db.reviews.push(r); log('review_submitted',reviewer_org_id,order_id,{rating:r.rating}); persist(); return {ok:true,review:r};
}
function reviewsForOrg(orgId){ return db.reviews.filter(r=>r.reviewee_org_id===orgId||r.reviewer_org_id===orgId); }
function reviewStats(orgId){ const rs=db.reviews.filter(r=>r.reviewee_org_id===orgId); const avg=rs.length?rs.reduce((a,r)=>a+r.rating,0)/rs.length:0; return {count:rs.length,average:Number(avg.toFixed(1))}; }

// ---- Saved searches and watchlists ----
function addSavedSearch(orgId, name, filters){ const s={ id:D.id('sav'), org_id:orgId, name:name||'Saved search', filters:filters||{}, created_at:nowIso() }; db.saved_searches.push(s); persist(); return s; }
function listSavedSearches(orgId){ return db.saved_searches.filter(s=>s.org_id===orgId); }
function removeSavedSearch(id, orgId){ const i=db.saved_searches.findIndex(s=>s.id===id ? s.org_id===orgId : false); if(i<0) return {ok:false,error:'not_found'}; db.saved_searches.splice(i,1); persist(); return {ok:true}; }
function addWatchlist(orgId, businessId){ if(db.watchlists.some(w=>w.org_id===orgId ? w.business_id===businessId : false)) return {ok:false,error:'already_watching'}; const w={ id:D.id('wtc'), org_id:orgId, business_id:businessId, created_at:nowIso() }; db.watchlists.push(w); persist(); return {ok:true,watchlist:w}; }
function removeWatchlist(orgId, businessId){ const i=db.watchlists.findIndex(w=>w.org_id===orgId ? w.business_id===businessId : false); if(i<0) return {ok:false,error:'not_found'}; db.watchlists.splice(i,1); persist(); return {ok:true}; }
function listWatchlists(orgId){ return db.watchlists.filter(w=>w.org_id===orgId); }

// ---- Org members and approvals ----
function addOrgMember(orgId, userId, role){ if(!D.ROLES.includes(role)) return {ok:false,error:'bad_role'}; if(db.org_members.some(m=>m.org_id===orgId ? m.user_id===userId : false)) return {ok:false,error:'already_member'}; const m={ id:D.id('om'), org_id:orgId, user_id:userId, role, created_at:nowIso() }; db.org_members.push(m); persist(); return {ok:true,member:m}; }
function listOrgMembers(orgId){ return db.org_members.filter(m=>m.org_id===orgId); }
function requestApproval({ org_id, kind, ref_id, requested_by, approver_role, note }){ const a={ id:D.id('app'), org_id, kind, ref_id, requested_by, approver_role:approver_role||'admin', status:'pending', decided_by:null, decided_at:null, note:note||'', created_at:nowIso() }; db.approvals.push(a); log('approval_requested',requested_by,ref_id,{kind}); persist(); return a; }
function listApprovals(orgId, { status }={}){ return db.approvals.filter(a=>a.org_id===orgId ? (!status||a.status===status) : false); }
function decideApproval(id, orgId, decision, decidedBy, note){ const a=db.approvals.find(x=>x.id===id ? x.org_id===orgId : false); if(!a) return {ok:false,error:'not_found'}; if(a.status!=='pending') return {ok:false,error:'already_decided'}; a.status=decision==='approved'?'approved':'rejected'; a.decided_by=decidedBy; a.decided_at=nowIso(); if(note) a.note=note; log('approval_'+a.status,decidedBy,a.ref_id,{kind:a.kind}); persist(); return {ok:true,approval:a}; }

// ---- Notifications ----
function notify(userId, kind, title, body, link){ const n={ id:D.id('ntf'), user_id:userId, kind:kind||'info', title, body:body||'', link:link||null, read_at:null, created_at:nowIso() }; db.notifications.push(n); if(db.notifications.length>500) db.notifications=db.notifications.slice(-500); persist(); return n; }
function listNotifications(userId, { unread }={}){ return db.notifications.filter(n=>n.user_id===userId ? (!unread||!n.read_at) : false).sort((x,y)=>x.created_at<y.created_at?1:-1); }
function markNotificationsRead(userId){ let n=0; for(const x of db.notifications){ if(x.user_id===userId){ if(!x.read_at){ x.read_at=nowIso(); n++; } } } if(n) persist(); return n; }

// ---- Audit log ----
function audit(actorUserId, action, entity, entityId, detail, ip){ db.audit_log.push({ id:D.id('aud'), actor_user_id:actorUserId||null, actor_org_id:null, action, entity:entity||null, entity_id:entityId||null, detail:detail||{}, ip:ip||null, created_at:nowIso() }); if(db.audit_log.length>5000) db.audit_log=db.audit_log.slice(-5000); }
function listAudit({ limit, action }={}){ let out=db.audit_log; if(action) out=out.filter(a=>a.action===action); return out.slice(0,Number(limit)||100); }

// ---- Order lifecycle ----
function updateOrderStatus(orderId, status, by){ const o=getOrder(orderId); if(!o) return {ok:false,error:'not_found'}; if(!D.ORDER_STATUSES.includes(status)) return {ok:false,error:'bad_status'}; o.status=status; o.status_history=o.status_history||[]; o.status_history.push({status,at:nowIso(),by:by||null}); log('order_status',by,orderId,{status}); persist(); return {ok:true,order:o}; }
function getOrderStatusHistory(orderId){ const o=getOrder(orderId); return o?(o.status_history||[]):[]; }

// ---- Quote lifecycle ----
function createCounterOffer(parentQuoteId, supplierOrgId, changes, by){
  const parent=db.quotes.find(q=>q.id===parentQuoteId); if(!parent) return {ok:false,error:'quote_not_found'};
  if(parent.supplier_org_id!==supplierOrgId) return {ok:false,error:'not_supplier'};
  parent.status='countered'; parent.negotiation_thread=parent.negotiation_thread||[];
  parent.negotiation_thread.push({by:by||null,at:nowIso(),message:changes.message||'Counteroffer submitted',counter_offer:{price_usd:changes.price_usd,moq:changes.moq,lead_time:changes.lead_time,incoterm:changes.incoterm}});
  const q={ id:D.id('qte'), rfq_id:parent.rfq_id, supplier_org_id:parent.supplier_org_id, business_id:parent.business_id,
    price_usd:Number(changes.price_usd)||parent.price_usd, currency:changes.currency||parent.currency||'USD', incoterm:changes.incoterm||parent.incoterm||'EXW',
    lead_time:changes.lead_time||parent.lead_time, moq:Number(changes.moq)||parent.moq||1, validity_days:parent.validity_days||30,
    notes:changes.notes||parent.notes||'', status:'submitted', version:(parent.version||1)+1, parent_quote_id:parent.id,
    negotiation_thread:[], payment_terms:changes.payment_terms||parent.payment_terms||null, packing_notes:null, attachments:[], fx_rate:null, landed_cost_estimate:null, created_at:nowIso() };
  db.quotes.push(q); log('counteroffer_submitted',supplierOrgId,parent.rfq_id,{version:q.version}); persist(); return {ok:true,quote:q};
}
function acceptQuote(quoteId, buyerOrgId){ const q=db.quotes.find(x=>x.id===quoteId); if(!q) return {ok:false,error:'quote_not_found'}; q.status='accepted'; persist(); return {ok:true,quote:q}; }

// ---- Storefront ----
function updateStorefront(businessId, orgId, patch){
  const b=getBusiness(businessId); if(!b) return {ok:false,error:'not_found'};
  if(b.owner_org_id!==orgId) return {ok:false,error:'not_owner'};
  const f=['description','moq','lead_time_days','production_capacity','payment_terms','sample_policy','spec_sheet','response_time_minutes'];
  for(const k of f){ if(patch[k]!==undefined) b[k]=k.endsWith('_minutes')?(Number(patch[k])||null):(patch[k]===''?null:patch[k]); }
  for(const k of ['certifications','export_markets','incoterms_offered','pack_sizes']){ if(patch[k]!==undefined) b[k]=Array.isArray(patch[k])?patch[k]:String(patch[k]||'').split(',').map(x=>x.trim()).filter(Boolean); }
  b.completeness_score=D.computeCompletenessScore(b, listProducts(businessId).length);
  b.last_activity_at=nowIso(); persist(); return {ok:true,business:publicBusiness(b)};
}

// ---- Reset for tests ----
function reset(){ db=blank(); persist(); }

module.exports = {
  createUser, getUserByEmail, getUserById, setPasswordHash, listOrgUsers,
  getSubscription, setPlan, planAccess, addSource,
  addBusiness, getBusiness, publicBusiness, listBusinesses, searchBusinesses, businessesForOrg,
  claimBusiness, approveClaim, submitEvidence, approveEvidence,
  addProduct, listProducts, createRfq, listRfqs, getRfq, submitQuote, listQuotesForRfq,
  createOrder, getOrder, listOrders, addMilestone, addOrderDocument, updateOrderStatus, getOrderStatusHistory,
  createCounterOffer, acceptQuote, updateStorefront,
  addDocument, listDocuments, getDocument, sendMessage, messagesForThread, markMessageRead,
  addReview, reviewsForOrg, reviewStats, addSavedSearch, listSavedSearches, removeSavedSearch,
  addWatchlist, removeWatchlist, listWatchlists, addOrgMember, listOrgMembers,
  requestApproval, listApprovals, decideApproval, notify, listNotifications, markNotificationsRead,
  audit, listAudit,
  createPaymentIntent, markPayment, markPaymentByWamRef, listPayments, saveLandedCost, listLandedCosts,
  addTradeRule, addHsCandidate, tradeRulesFor, listActivity, reset,
  _db: ()=>db, id: D.id, initPg,
};
