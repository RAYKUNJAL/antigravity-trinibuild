// src/domain.js — truth model + business rules (no storage concerns)
'use strict';

// Profile lifecycle states per spec section 2.1
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

// Verification dimensions are separate fields (not one vague score)
const VERIFICATION_DIMENSIONS = Object.freeze([
  'legal_identity', 'representative_authority', 'address', 'tax_status',
  'payment_status', 'certification', 'export_capacity', 'product_evidence', 'performance',
]);

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

function isUnclaimed(state) {
  // A pending claim is reserved — only the claiming representative proceeds; others cannot re-claim.
  return state === PROFILE_STATES.DISCOVERED || state === PROFILE_STATES.UNCLAIMED_PUBLIC_PROFILE;
}

function canPublishProducts(state) {
  return state === PROFILE_STATES.IDENTITY_VERIFIED || state === PROFILE_STATES.TRADE_VERIFIED || state === PROFILE_STATES.TRANSACTION_VERIFIED;
}

function canReceiveRfq(state) {
  return state === PROFILE_STATES.TRADE_VERIFIED || state === PROFILE_STATES.TRANSACTION_VERIFIED;
}

// Provenance: every published field carries a source and last-confirmed timestamp.
function provenance(sourceId, sourceUrl, confirmedAt) {
  return { source_id: sourceId, source_url: sourceUrl, last_confirmed_at: confirmedAt || null };
}

module.exports = {
  PROFILE_STATES, VERIFICATION_DIMENSIONS, PUBLIC_LABEL, UNCLAIMED_DISCLAIMER,
  isUnclaimed, canPublishProducts, canReceiveRfq, provenance,
};
