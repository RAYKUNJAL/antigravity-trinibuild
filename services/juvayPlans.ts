/**
 * One TTD price table for Juvay. Free / Premium.
 * Source of truth: /workspace/juvay-paid/PRICING-FINAL.md (2026-11-12).
 * Copy strings below are word for word from that file.
 * PREMIUM_CHECKOUT_ENABLED stays false until Wam checkout takes a real payment.
 */
/** -1 means unlimited */
export const FREE_LISTING_LIMIT = -1;

/** Written affiliate lock: 10% of the paid subscription. */
export const AFFILIATE_SUBSCRIPTION_CUT = 0.10;

/** Basis points on successful Wam online face amount (display defaults; server is source of truth). */
export const JUVAY_FEE_BPS_FREE = 450;
export const JUVAY_FEE_BPS_PREMIUM = 250;
export const JUVAY_FEE_CAP_TTD = 25;

export const PREMIUM_INTRO_PRICE_TTD = 49;
export const PREMIUM_INTRO_MONTHS = 3;
export const PREMIUM_THEN_PRICE_TTD = 79;

/** Premium includes live delivery tracking for 1 vehicle. Extra vehicles are a paid add-on. */
export const PREMIUM_INCLUDED_TRACKED_VEHICLES = 1;
export const EXTRA_TRACKED_VEHICLE_PRICE_TTD = 49;

export const LEGACY_PAID_PLAN_IDS = ['pro', 'starter', 'business'] as const;
export type SellerPlanId = 'free' | 'premium';
export type LegacySellerPlanId = (typeof LEGACY_PAID_PLAN_IDS)[number];

/** Word-for-word from PRICING-FINAL.md */
export const PREMIUM_PRICE_COPY =
  'TT$49/month for the first 3 months, then TT$79/month';
export const FREE_INCLUDES_COPY =
  'Unlimited products, 1 store, Wam online checkout at 4.5% fee (capped TT$25/order), 0% on cash/COD';
export const PREMIUM_INCLUDES_COPY =
  'Fee drops to 2.5%, unlimited photo listings, "Bring my store over", live delivery tracking for 1 vehicle';
export const EXTRA_TRACKED_VEHICLE_PRICE_COPY = 'TT$49/month each';
export const EXTRA_TRACKED_VEHICLE_INCLUDES_COPY = 'Add-on to Premium';
export const AFFILIATE_CUT_COPY =
  '10% of Premium (TT$4.90 intro months, TT$7.90 after).';
export const PAID_UPGRADE_UNAVAILABLE_COPY =
  "Until Wam checkout takes a real payment, paid upgrades aren't available yet.";
export const CASH_COD_FEE_COPY = '0% on cash and COD';

export const FREE_INCLUDE_FEATURES = [
  'Unlimited products',
  '1 store',
  'Wam online checkout at 4.5% fee (capped TT$25/order)',
  '0% on cash/COD',
] as const;

export const PREMIUM_INCLUDE_FEATURES = [
  'Fee drops to 2.5%',
  'unlimited photo listings',
  '"Bring my store over"',
  'live delivery tracking for 1 vehicle',
] as const;

export const JUVAY_PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    priceTtd: 0,
    introPriceTtd: 0,
    introMonths: 0,
    thenPriceTtd: 0,
    period: 'forever',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_FREE,
    features: [...FREE_INCLUDE_FEATURES],
    paid: false,
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    priceTtd: PREMIUM_INTRO_PRICE_TTD,
    introPriceTtd: PREMIUM_INTRO_PRICE_TTD,
    introMonths: PREMIUM_INTRO_MONTHS,
    thenPriceTtd: PREMIUM_THEN_PRICE_TTD,
    period: '/month',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_PREMIUM,
    features: [...PREMIUM_INCLUDE_FEATURES],
    paid: true,
  },
] as const;

export const JUVAY_ADD_ONS = [
  {
    id: 'extra_tracked_vehicle' as const,
    name: 'Extra tracked vehicle',
    priceTtd: EXTRA_TRACKED_VEHICLE_PRICE_TTD,
    period: '/month',
    priceCopy: EXTRA_TRACKED_VEHICLE_PRICE_COPY,
    features: [EXTRA_TRACKED_VEHICLE_INCLUDES_COPY],
    paid: true,
  },
] as const;

export type JuvayPlan = (typeof JUVAY_PLANS)[number];

export function normalizeSellerPlan(id: string | null | undefined): SellerPlanId {
  const slug = String(id || 'free').trim().toLowerCase();
  if (slug === 'premium' || (LEGACY_PAID_PLAN_IDS as readonly string[]).includes(slug)) {
    return 'premium';
  }
  return 'free';
}

export function isPaidSellerPlan(id: string | null | undefined): boolean {
  return normalizeSellerPlan(id) === 'premium';
}

/** Recurring TTD used for admin MRR when a store is actually on a paid plan. Uses the then-price, not an assumed conversion. */
export function monthlyPriceTtdForPlan(
  id: string | null | undefined,
  billedMonthlyTtd?: number | null,
): number {
  if (typeof billedMonthlyTtd === 'number' && Number.isFinite(billedMonthlyTtd) && billedMonthlyTtd >= 0) {
    return billedMonthlyTtd;
  }
  return isPaidSellerPlan(id) ? PREMIUM_THEN_PRICE_TTD : 0;
}

export function formatPlanPrice(priceTtd: number): string {
  return priceTtd === 0 ? 'TT$0' : `TT$${priceTtd}`;
}

export function formatFeePercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function premiumPriceCopy(): string {
  return PREMIUM_PRICE_COPY;
}

export function affiliateCutCopy(): string {
  return AFFILIATE_CUT_COPY;
}

export function paidUpgradeAvailabilityCopy(): string {
  return PAID_UPGRADE_UNAVAILABLE_COPY;
}

export function cashCodFeeCopy(): string {
  return CASH_COD_FEE_COPY;
}
