/**
 * Juvay platform fee on successful Wam online sales. Cash pickup has no %.
 * Env overrides: JUVAY_FEE_BPS_FREE, JUVAY_FEE_BPS_PREMIUM, COD_HANDLING_FEE_CENTS_DEFAULT
 */
function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function feeBpsForPlan(planSlug) {
  const premium = new Set(['starter', 'business', 'pro', 'premium']);
  if (premium.has(String(planSlug || '').toLowerCase())) {
    return envInt('JUVAY_FEE_BPS_PREMIUM', 300);
  }
  return envInt('JUVAY_FEE_BPS_FREE', 450);
}

function defaultCodHandlingFeeCents() {
  return envInt('COD_HANDLING_FEE_CENTS_DEFAULT', 1000);
}

function listingRateLimitPerHour() {
  return envInt('LISTING_RATE_LIMIT_PER_HOUR', 40);
}

/** bps of face cents, floored */
function juvayFeeCents(faceCents, bps) {
  const face = Math.max(0, Math.trunc(Number(faceCents) || 0));
  const rate = Math.max(0, Math.trunc(Number(bps) || 0));
  return Math.floor((face * rate) / 10000);
}

module.exports = {
  feeBpsForPlan,
  defaultCodHandlingFeeCents,
  listingRateLimitPerHour,
  juvayFeeCents,
};
