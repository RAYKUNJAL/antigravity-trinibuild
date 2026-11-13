/**
 * One TTD price table for Juvay. Free / Premium.
 * Approved lock: Premium TT$49/month for the first 3 months, then TT$79/month.
 * 2.5% Juvay fee on successful online Wam sales, capped at TT$25.
 * Free listings: unlimited. 0% on cash. Paid checkout stays behind
 * PREMIUM_CHECKOUT_ENABLED=false. Do not invent a USD menu (no 6.78 pattern in code).
 */
/** -1 means unlimited */
export const FREE_LISTING_LIMIT = -1;

/** Written affiliate lock: 10% of the paid subscription (not 20%, not SweetHand take). */
export const AFFILIATE_SUBSCRIPTION_CUT = 0.10;

/** Basis points on successful Wam online face amount (display defaults; server is source of truth). */
export const JUVAY_FEE_BPS_FREE = 450;
export const JUVAY_FEE_BPS_PREMIUM = 250;

export const PREMIUM_INTRO_PRICE_TTD = 49;
export const PREMIUM_INTRO_MONTHS = 3;
export const PREMIUM_THEN_PRICE_TTD = 79;

export const JUVAY_PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceTtd: 0,
    introPriceTtd: 0,
    introMonths: 0,
    thenPriceTtd: 0,
    period: 'forever',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_FREE,
    features: [
      'Unlimited product listings',
      'juvay.app store slug',
      'Cash at pickup',
      'Cash on delivery (buyer handling fee)',
      'Wam online pay when configured (4.5% Juvay fee on successful sales, capped at TT$25)',
    ],
    paid: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceTtd: PREMIUM_INTRO_PRICE_TTD,
    introPriceTtd: PREMIUM_INTRO_PRICE_TTD,
    introMonths: PREMIUM_INTRO_MONTHS,
    thenPriceTtd: PREMIUM_THEN_PRICE_TTD,
    period: '/month',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_PREMIUM,
    features: [
      'Unlimited listings (same as Free)',
      'Lower 2.5% Juvay fee on successful online Wam sales, capped at TT$25',
      '0% Juvay commission on cash pickup and cash on delivery',
      'Everything in Free',
    ],
    paid: true,
  },
] as const;

export type JuvayPlan = (typeof JUVAY_PLANS)[number];

export function formatPlanPrice(priceTtd: number): string {
  return priceTtd === 0 ? 'TT$0' : `TT$${priceTtd}`;
}

export function formatFeePercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function premiumPriceCopy(): string {
  return `TT$${PREMIUM_INTRO_PRICE_TTD}/month for the first ${PREMIUM_INTRO_MONTHS} months, then TT$${PREMIUM_THEN_PRICE_TTD}/month`;
}

/** Premium includes this many live-tracked vehicles. Extra vehicles are an add-on. */
export const TRACKING_INCLUDED_VEHICLES = 1;
/** TTD per extra tracked vehicle, per month. Canonical price — do not hard-code elsewhere. */
export const TRACKING_EXTRA_VEHICLE_PRICE_TTD = 49;

export function trackingExtraVehicleCopy(): string {
  return `${formatPlanPrice(TRACKING_EXTRA_VEHICLE_PRICE_TTD)}/vehicle/month`;
}

export function trackingPremiumOfferCopy(): string {
  return `Live tracking comes with Juvay Premium (${premiumPriceCopy()}). Premium includes live tracking for ${TRACKING_INCLUDED_VEHICLES} vehicle. Extra tracked vehicles are ${trackingExtraVehicleCopy()}.`;
}

export function affiliateCutCopy(): string {
  const intro = (PREMIUM_INTRO_PRICE_TTD * AFFILIATE_SUBSCRIPTION_CUT).toFixed(2);
  const then = (PREMIUM_THEN_PRICE_TTD * AFFILIATE_SUBSCRIPTION_CUT).toFixed(2);
  return `10% of Premium when that plan is actually billed (TT$${intro}/month during the intro, then TT$${then}/month). Free referrals pay TT$0. Premium checkout is not open yet.`;
}
