// src/store.js — JSON-file-backed store with provenance and activity log
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const domain = require('./domain');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'db.json');

const initial = () => ({ businesses: [], representatives: [], products: [], rfqs: [], activity: [], sources: [] });

function load() {
  if (fs.existsSync(DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch { return initial(); }
  }
  return initial();
}

let db = load();
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }, 50);
}

function id(prefix) { return prefix + '-' + crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }

function log(action, actor, target, detail) {
  db.activity.unshift({ id: id('evt'), action, actor: actor || 'system', target: target || null, detail: detail || {}, at: nowIso() });
  if (db.activity.length > 2000) db.activity = db.activity.slice(0, 2000);
  persist();
}

// ---- sources ----
function addSource({ name, url, tier, owner, terms }) {
  const s = { id: id('src'), name, url, tier: Number(tier) || 6, owner, terms: terms || 'reviewed', active: true, added_at: nowIso() };
  db.sources.push(s); persist(); return s;
}

// ---- businesses ----
function addBusiness({ source_id, name, legal_name, country, city, category, website, address, source_url }) {
  const b = {
    id: id('biz'),
    state: domain.PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE,
    name, legal_name: legal_name || name,
    country, city, category, website, address,
    verification: Object.fromEntries(domain.VERIFICATION_DIMENSIONS.map(d => [d, { status: 'unverified', checked_at: null }])),
    provenance: {
      name: domain.provenance(source_id, source_url, nowIso()),
      country: domain.provenance(source_id, source_url, nowIso()),
      category: domain.provenance(source_id, source_url, nowIso()),
    },
    claimed_by: null, claimed_at: null,
    created_at: nowIso(), updated_at: nowIso(),
  };
  db.businesses.push(b); log('business_discovered', null, b.id, { name: b.name }); persist();
  return b;
}

function getBusiness(id) { return db.businesses.find(b => b.id === id) || null; }

function publicBusiness(b) {
  const state = b.state;
  const pub = {
    id: b.id, name: b.name, country: b.country, city: b.city, category: b.category,
    website: b.website, address: b.address,
    state, label: domain.PUBLIC_LABEL[state] || state,
    verified_dimensions: Object.fromEntries(Object.entries(b.verification).filter(([,v]) => v.status === 'verified').map(([k])=>[k,true])),
    provenance: b.provenance,
    can_publish_products: domain.canPublishProducts(state),
    can_receive_rfq: domain.canReceiveRfq(state),
  };
  if (domain.isUnclaimed(state)) pub.disclaimer = domain.UNCLAIMED_DISCLAIMER;
  return pub;
}

function listBusinesses() { return db.businesses.map(publicBusiness); }

// ---- claims / representatives ----
function upsertRepresentative({ email, name, role }) {
  let rep = db.representatives.find(r => r.email === email);
  if (!rep) { rep = { id: id('rep'), email, name, role: role || 'owner', created_at: nowIso() }; db.representatives.push(rep); persist(); }
  else { if (name) rep.name = name; persist(); }
  return rep;
}

function claimBusiness(bizId, repId) {
  const b = getBusiness(bizId);
  if (!b) return { ok: false, error: 'not_found' };
  if (!domain.isUnclaimed(b.state)) return { ok: false, error: 'already_claimed' };
  b.state = domain.PROFILE_STATES.CLAIM_PENDING;
  b.claimed_by = repId;
  b.claimed_at = nowIso();
  log('claim_submitted', repId, b.id, { name: b.name });
  persist();
  return { ok: true, business: publicBusiness(b) };
}

function approveClaim(bizId) {
  const b = getBusiness(bizId);
  if (!b || b.state !== domain.PROFILE_STATES.CLAIM_PENDING) return { ok: false, error: 'invalid_state' };
  b.state = domain.PROFILE_STATES.CLAIMED;
  log('claim_approved', null, b.id, { name: b.name });
  persist();
  return { ok: true, business: publicBusiness(b) };
}

function submitEvidence(bizId, repId, dimension, note) {
  const b = getBusiness(bizId);
  if (!b || b.state !== domain.PROFILE_STATES.CLAIMED) return { ok: false, error: 'must_be_claimed' };
  if (!domain.VERIFICATION_DIMENSIONS.includes(dimension)) return { ok: false, error: 'bad_dimension' };
  b.verification[dimension] = { status: 'pending_review', checked_at: nowIso(), note: note || '', submitted_by: repId };
  log('evidence_submitted', repId, b.id, { dimension, note });
  persist();
  return { ok: true, business: publicBusiness(b) };
}

function approveEvidence(bizId, dimension) {
  const b = getBusiness(bizId);
  if (!b) return { ok: false, error: 'not_found' };
  if (!domain.VERIFICATION_DIMENSIONS.includes(dimension)) return { ok: false, error: 'bad_dimension' };
  b.verification[dimension] = { status: 'verified', checked_at: nowIso() };
  // promote state based on verified dimensions
  const verified = domain.VERIFICATION_DIMENSIONS.filter(d => b.verification[d].status === 'verified');
  if (verified.includes('legal_identity') && verified.includes('representative_authority') && b.state === domain.PROFILE_STATES.CLAIMED) {
    b.state = domain.PROFILE_STATES.IDENTITY_VERIFIED;
  }
  if (b.state === domain.PROFILE_STATES.IDENTITY_VERIFIED && (verified.includes('export_capacity') || verified.includes('certification'))) {
    b.state = domain.PROFILE_STATES.TRADE_VERIFIED;
  }
  log('evidence_approved', null, b.id, { dimension, state: b.state });
  persist();
  return { ok: true, business: publicBusiness(b) };
}

// ---- products ----
function addProduct(bizId, repId, { title, description, category, moq, lead_time, price_usd, currency }) {
  const b = getBusiness(bizId);
  if (!b) return { ok: false, error: 'not_found' };
  if (!domain.canPublishProducts(b.state)) return { ok: false, error: 'requires_verification' };
  const p = {
    id: id('prod'), business_id: bizId, title, description, category,
    moq: Number(moq) || 1, lead_time, price_usd: Number(price_usd) || 0, currency: currency || 'USD',
    published_by: repId, created_at: nowIso(),
  };
  db.products.push(p); log('product_published', repId, b.id, { product: p.title }); persist();
  return { ok: true, product: p };
}

function listProducts(bizId) { return db.products.filter(p => !bizId || p.business_id === bizId); }

// ---- RFQs ----
function createRfq({ buyer_name, buyer_email, product, quantity, destination_country, deadline, notes }) {
  const rfq = {
    id: id('rfq'), buyer_name, buyer_email, product, quantity: Number(quantity) || 1,
    destination_country, deadline, notes, status: 'open', created_at: nowIso(),
  };
  db.rfqs.push(rfq); log('rfq_created', buyer_email, null, { product }); persist();
  return rfq;
}

function listRfqs() { return db.rfqs; }

// ---- activity ----
function listActivity(limit) { return db.activity.slice(0, Number(limit) || 50); }

module.exports = {
  addSource, addBusiness, getBusiness, listBusinesses, publicBusiness,
  upsertRepresentative, claimBusiness, approveClaim, submitEvidence, approveEvidence,
  addProduct, listProducts, createRfq, listRfqs, listActivity, reset: () => { db = initial(); persist(); },
};
