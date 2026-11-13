/**
 * Public /api/plans table. Always Free + Premium only, matching
 * services/juvayPlans.ts and /workspace/juvay-paid/PRICING-FINAL.md.
 * Legacy Pro/Starter/Business slugs may map to Premium internally,
 * but they are never listed as priced plans.
 * Stale plan_tiers rows (TT$199/399, Custom domain, API access,
 * White-label) must not leak into the response.
 */
const PREMIUM_INTRO_PRICE_TTD = 49;
const PREMIUM_INTRO_PERIODS = 3;
const PREMIUM_THEN_PRICE_TTD = 79;
const VEHICLE_ADDON_PRICE_TTD = 49;
const FEE_CAP_CENTS = 2500;
const JUVAY_FEE_BPS_FREE = 450;
const JUVAY_FEE_BPS_PREMIUM = 250;

const LEGACY_PAID_SLUGS = new Set(['pro', 'starter', 'business']);

const PREMIUM_PRICE_HEADLINE =
  'TT$49/month for the first 3 months, then TT$79/month';

const FREE_FEATURES = [
  'Unlimited products',
  '1 store',
  'Wam online checkout at 4.5% fee (capped TT$25/order)',
  '0% on cash/COD',
];

const PREMIUM_FEATURES = [
  'Fee drops to 2.5%',
  'unlimited photo listings',
  '"Bring my store over"',
  'live delivery tracking for 1 vehicle',
];

const BANNED_PLAN_FEATURES = [
  /custom domain/i,
  /api access/i,
  /white-?label/i,
];

const CANONICAL_PLANS = [
  {
    slug: 'free',
    name: 'Free',
    price_ttd: 0,
    intro_price_ttd: 0,
    intro_periods: 0,
    then_price_ttd: 0,
    price_headline: 'TT$0',
    is_free_for_life: true,
    max_products: -1,
    max_stores: 1,
    juvay_fee_bps: JUVAY_FEE_BPS_FREE,
    fee_cap_cents: FEE_CAP_CENTS,
    tracked_vehicles: 0,
    features: [...FREE_FEATURES],
    paid: false,
  },
  {
    slug: 'premium',
    name: 'Premium',
    price_ttd: PREMIUM_THEN_PRICE_TTD,
    intro_price_ttd: PREMIUM_INTRO_PRICE_TTD,
    intro_periods: PREMIUM_INTRO_PERIODS,
    then_price_ttd: PREMIUM_THEN_PRICE_TTD,
    price_headline: PREMIUM_PRICE_HEADLINE,
    is_free_for_life: false,
    max_products: -1,
    max_stores: 1,
    juvay_fee_bps: JUVAY_FEE_BPS_PREMIUM,
    fee_cap_cents: FEE_CAP_CENTS,
    tracked_vehicles: 1,
    features: [...PREMIUM_FEATURES],
    paid: true,
  },
];

const CANONICAL_ADDONS = [
  {
    slug: 'vehicle',
    name: 'Extra tracked vehicle',
    price_ttd: VEHICLE_ADDON_PRICE_TTD,
    period: '/month',
    price_headline: 'TT$49/month each',
    features: ['Add-on to Premium'],
  },
];

function normalizeSellerPlan(id) {
  const slug = String(id || 'free').trim().toLowerCase();
  if (slug === 'premium' || LEGACY_PAID_SLUGS.has(slug)) return 'premium';
  return 'free';
}

function publicPlanRow(row) {
  if (!row) return null;
  return {
    slug: row.slug,
    name: row.name,
    price_ttd: row.price_ttd,
    intro_price_ttd: row.intro_price_ttd,
    intro_periods: row.intro_periods,
    then_price_ttd: row.then_price_ttd,
    price_headline: row.price_headline,
    is_free_for_life: !!row.is_free_for_life,
    features: Array.isArray(row.features) ? [...row.features] : [],
    max_products: row.max_products,
    max_stores: row.max_stores,
    juvay_fee_bps: row.juvay_fee_bps,
    fee_cap_cents: row.fee_cap_cents,
    tracked_vehicles: row.tracked_vehicles,
    paid: !!row.paid,
  };
}

/**
 * Always returns exactly Free then Premium from the canonical table.
 * DB rows are ignored for prices, fees, and features so a stale
 * plan_tiers catalog cannot list Pro or retired SKUs.
 */
function listedPublicPlans(_rows) {
  return CANONICAL_PLANS.map(publicPlanRow);
}

module.exports = {
  CANONICAL_PLANS,
  CANONICAL_ADDONS,
  FREE_FEATURES,
  PREMIUM_FEATURES,
  BANNED_PLAN_FEATURES,
  PREMIUM_PRICE_HEADLINE,
  PREMIUM_INTRO_PRICE_TTD,
  PREMIUM_INTRO_PERIODS,
  PREMIUM_THEN_PRICE_TTD,
  VEHICLE_ADDON_PRICE_TTD,
  FEE_CAP_CENTS,
  JUVAY_FEE_BPS_FREE,
  JUVAY_FEE_BPS_PREMIUM,
  normalizeSellerPlan,
  publicPlanRow,
  listedPublicPlans,
};
