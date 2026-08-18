// src/domain.js — truth model, plans, roles, profile lifecycle, provenance
'use strict';
const crypto = require('node:crypto');

// ---- Profile lifecycle (spec 2.1) ----
const PROFILE_STATES = Object.freeze({
  DISCOVERED: 'DISCOVERED',
  UNCLAIMED_PUBLIC_PROFILE: 'UNCLAIMED_PUBLIC_PROFILE',
  CLAIM_PENDING: 'CLAIM_PENDING',
  CLAIMED: 'CLAIMED',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  TRADE_VERIFIED: 'TRADE_VERIFIED',
  TRANSACTION_VERIFIED: 'TRANSACTION_VERIFIED',
  RESTRICTED: 'RESTRICTED',
  SUSPENDED: 'SUSPENDED',
});

const PUBLIC_LABEL = {
  [PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE]: 'Public profile - unclaimed',
  [PROFILE_STATES.CLAIM_PENDING]: 'Claim pending',
  [PROFILE_STATES.CLAIMED]: 'Claimed',
  [PROFILE_STATES.IDENTITY_VERIFIED]: 'Identity verified',
  [PROFILE_STATES.TRADE_VERIFIED]: 'Trade verified',
  [PROFILE_STATES.TRANSACTION_VERIFIED]: 'Transaction verified',
  [PROFILE_STATES.RESTRICTED]: 'Limited or unavailable',
  [PROFILE_STATES.SUSPENDED]: 'Unavailable',
};

const UNCLAIMED_DISCLAIMER =
  'This profile was created from publicly available business information. The business has not yet claimed or verified this profile. Product availability, pricing, certifications, export capability, and fulfillment terms must be confirmed directly.';

const VERIFICATION_DIMENSIONS = Object.freeze([
  'legal_identity', 'representative_authority', 'address', 'tax_status',
  'payment_status', 'certification', 'export_capacity', 'product_evidence', 'performance',
]);

function isUnclaimed(s) { return s === PROFILE_STATES.DISCOVERED || s === PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE; }
function canPublishProducts(s) { return [PROFILE_STATES.IDENTITY_VERIFIED, PROFILE_STATES.TRADE_VERIFIED, PROFILE_STATES.TRANSACTION_VERIFIED].includes(s); }
function canReceiveRfq(s) { return [PROFILE_STATES.TRADE_VERIFIED, PROFILE_STATES.TRANSACTION_VERIFIED].includes(s); }

// ---- Plans (Alibaba-style: free base, paid upgrades) ----
const PLANS = Object.freeze({
  FREE: {
    slug: 'free', name: 'Free', price_usd: 0, cycle: 'forever',
    max_businesses: 1, max_products: 10, can_rfq: true, can_quote: false, can_order: false,
    ai_listings: 5, analytics: 'basic', support: 'community', features: ['Public directory presence','Claim one business','10 product listings','Buyer RFQ access'],
  },
  PRO: {
    slug: 'pro', name: 'Pro', price_usd: 44, cycle: 'monthly',
    max_businesses: 3, max_products: 100, can_rfq: true, can_quote: true, can_order: true,
    ai_listings: 100, analytics: 'advanced', support: 'email', features: ['Up to 3 businesses','100 products','Quote & sell to RFQs','Order management','AI quote assistant','Remove platform branding','Priority marketplace placement'],
  },
  TRADE: {
    slug: 'trade', name: 'Trade', price_usd: 149, cycle: 'monthly',
    max_businesses: -1, max_products: -1, can_rfq: true, can_quote: true, can_order: true,
    ai_listings: -1, analytics: 'enterprise', support: 'priority', features: ['Unlimited businesses','Unlimited products','Multi-currency & FX','Dedicated account manager','API access','Verified trade badge priority','Custom integrations','5 staff accounts'],
  },
});

function planBySlug(slug) { return PLANS[String(slug||'').toUpperCase()] || PLANS.FREE; }

// ---- Roles ----
const ROLES = Object.freeze(['owner','admin','buyer','supplier','finance','viewer','ops']);

// ---- Verification per dimension ----
function blankVerification() {
  return Object.fromEntries(VERIFICATION_DIMENSIONS.map(d => [d, { status: 'unverified', checked_at: null, note: null }]));
}

function provenance(sourceId, sourceUrl, confirmedAt) {
  return { source_id: sourceId, source_url: sourceUrl, last_confirmed_at: confirmedAt || null };
}

// ---- Landing cost inputs (spec 6.4) ----
function landedCost(spec) {
  const n = (x, d=0) => Number.isFinite(Number(x)) ? Number(x) : d;
  const product = n(spec.product_value);
  const origin = n(spec.origin_charges);
  const freight = n(spec.freight);
  const insurance = n(spec.insurance);
  const duty = n(spec.applicable_duty);
  const taxes = n(spec.taxes_and_levies);
  const port = n(spec.destination_port_charges);
  const brokerage = n(spec.brokerage);
  const storage = n(spec.storage_risk_allowance);
  const inland = n(spec.inland_delivery);
  const fx = n(spec.payment_or_fx_cost);
  const total = product+origin+freight+insurance+duty+taxes+port+brokerage+storage+inland+fx;
  return {
    product_value: product, origin_charges: origin, freight, insurance, applicable_duty: duty,
    taxes_and_levies: taxes, destination_port_charges: port, brokerage, storage_risk_allowance: storage,
    inland_delivery: inland, payment_or_fx_cost: fx,
    total, currency: spec.currency || 'USD', fx_rate: spec.fx_rate || null,
    hs_candidate: spec.hs_candidate || null, origin_qualification: spec.origin_qualification || null,
    assumptions: spec.assumptions || [], confidence: spec.confidence ?? 0.5,
  };
}

// ---- Answer contract (spec 5.3) ----
function answer({ text, jurisdiction, destination, product_category, sources=[], confidence=0.5, assumptions=[], risk_class='low', next_best_action=null, escalation_reason=null }) {
  return { response_text: text, jurisdiction: jurisdiction||null, destination: destination||null, product_category: product_category||null,
    sources, source_effective_dates: [], confidence, assumptions, requires_confirmation: confidence < 0.7,
    risk_class: ['low','medium','high','prohibited'].includes(risk_class)?risk_class:'low',
    next_best_action, escalation_reason: escalation_reason||null };
}

module.exports = {
  PROFILE_STATES, PUBLIC_LABEL, UNCLAIMED_DISCLAIMER, VERIFICATION_DIMENSIONS,
  PLANS, planBySlug, ROLES, isUnclaimed, canPublishProducts, canReceiveRfq,
  blankVerification, provenance, landedCost, answer, id: (p)=>p+'-'+crypto.randomUUID(),
};
