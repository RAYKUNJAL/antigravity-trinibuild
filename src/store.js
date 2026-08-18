// src/store.js — JSON-file-backed store with provenance, audit, plans, trade lifecycle
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const domain = require('./domain');
const D = domain;

const ROOT = path.resolve(__dirname, '..');
const DB_FILE = process.env.DB_FILE || path.join(ROOT, 'data', 'db.json');

function blank() {
  return {
    users: [], organizations: [], memberships: [], subscriptions: [],
    businesses: [], representatives: [], products: [], rfqs: [], quotes: [], orders: [],
    payments: [], landed_cost_scenarios: [], trade_rules: [], hs_candidates: [],
    activity: [], sources: [],
  };
}
let db = (() => { try { return fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE,'utf8')) : blank(); } catch { return blank(); } })();
let _t;
function persist() { clearTimeout(_t); _t = setTimeout(()=>{ fs.mkdirSync(path.dirname(DB_FILE),{recursive:true}); fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }, 40); }
const nowIso = () => new Date().toISOString();
function log(action, actor, target, detail) {
  db.activity.unshift({ id: D.id('evt'), action, actor: actor||'system', target: target||null, detail: detail||{}, at: nowIso() });
  if (db.activity.length > 5000) db.activity = db.activity.slice(0, 5000); persist();
}

// ---- Users / organizations / memberships ----
function createUser({ email, name, password_hash, role='owner', org_name, island='tt', currency, buyer_external, buyer_destination }) {
  const norm = String(email||'').trim().toLowerCase();
  if (db.users.some(u=>u.email===norm)) throw new Error('A user with that email already exists');
  const u = { id: D.id('usr'), email: norm, name, password_hash, role, island: island||'tt', currency: currency||'TTD',
    buyer_external: !!buyer_external, buyer_destination: buyer_destination||null, created_at: nowIso() };
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
function addBusiness({ source_id, name, legal_name, country, city, category, website, address, source_url }) {
  const b = {
    id: D.id('biz'), state: D.PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE, name, legal_name: legal_name||name,
    country, city, category, website, address,
    verification: D.blankVerification(),
    provenance: { name: D.provenance(source_id, source_url, nowIso()), country: D.provenance(source_id, source_url, nowIso()), category: D.provenance(source_id, source_url, nowIso()) },
    claimed_by: null, claimed_at: null, owner_org_id: null, created_at: nowIso(), updated_at: nowIso(),
  };
  db.businesses.push(b); log('business_discovered', null, b.id, { name }); persist(); return b;
}
function getBusiness(id) { return db.businesses.find(b=>b.id===id)||null; }
function publicBusiness(b) {
  const s=b.state;
  const pub={ id:b.id,name:b.name,country:b.country,city:b.city,category:b.category,website:b.website,address:b.address,
    state:s,label:D.PUBLIC_LABEL[s]||s,
    verified_dimensions:Object.fromEntries(Object.entries(b.verification).filter(([,v])=>v.status==='verified').map(([k])=>[k,true])),
    provenance:b.provenance, can_publish_products:D.canPublishProducts(s), can_receive_rfq:D.canReceiveRfq(s) };
  if (D.isUnclaimed(s)) pub.disclaimer=D.UNCLAIMED_DISCLAIMER;
  return pub;
}
function listBusinesses(){ return db.businesses.map(publicBusiness); }
function businessesForOrg(orgId){ return db.businesses.filter(b=>b.owner_org_id===orgId); }

function claimBusiness(bizId, repId, orgId) {
  const b=getBusiness(bizId); if(!b) return {ok:false,error:'not_found'};
  if(!D.isUnclaimed(b.state)) return {ok:false,error:'already_claimed'};
  b.state=D.PROFILE_STATES.CLAIM_PENDING; b.claimed_by=repId; b.owner_org_id=orgId; b.claimed_at=nowIso();
  log('claim_submitted', repId, b.id, {name:b.name}); persist(); return {ok:true,business:publicBusiness(b)};
}
function approveClaim(bizId){ const b=getBusiness(bizId); if(!b||b.state!==D.PROFILE_STATES.CLAIM_PENDING) return {ok:false,error:'invalid_state'}; b.state=D.PROFILE_STATES.CLAIMED; log('claim_approved',null,b.id,{name:b.name}); persist(); return {ok:true,business:publicBusiness(b)}; }
function submitEvidence(bizId, repId, dimension, note){
  const b=getBusiness(bizId); if(!b||b.state!==D.PROFILE_STATES.CLAIMED) return {ok:false,error:'must_be_claimed'};
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
    notes:notes||'', status:'submitted', created_at:nowIso() };
  db.quotes.push(q); log('quote_submitted',supplierOrgId,rfqId,{price:q.price_usd}); persist(); return {ok:true,quote:q};
}
function listQuotesForRfq(rfqId){ return db.quotes.filter(q=>q.rfq_id===rfqId); }

// ---- Orders ----
function createOrder({ buyer_org_id, supplier_org_id, rfq_id, quote_id, product, quantity, price_usd, currency, incoterm, terms }) {
  const order={ id:D.id('ord'), buyer_org_id, supplier_org_id, rfq_id, quote_id, product, quantity:Number(quantity)||1,
    price_usd:Number(price_usd)||0, currency:currency||'USD', incoterm:incoterm||'EXW', status:'created',
    terms:terms||{}, milestones:[], documents:[], created_at:nowIso() };
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

// ---- Reset for tests ----
function reset(){ db=blank(); persist(); }

module.exports = {
  createUser, getUserByEmail, getUserById, setPasswordHash, listOrgUsers,
  getSubscription, setPlan, planAccess, addSource,
  addBusiness, getBusiness, publicBusiness, listBusinesses, businessesForOrg,
  claimBusiness, approveClaim, submitEvidence, approveEvidence,
  addProduct, listProducts, createRfq, listRfqs, getRfq, submitQuote, listQuotesForRfq,
  createOrder, getOrder, listOrders, addMilestone, addOrderDocument,
  createPaymentIntent, markPayment, markPaymentByWamRef, listPayments, saveLandedCost, listLandedCosts,
  addTradeRule, addHsCandidate, tradeRulesFor, listActivity, reset,
  _db: ()=>db, id: D.id,
};
