/**
 * One TTD price table for Juvay. Free / Starter / Business.
 * Live /pricing lock: Starter TT$99 / Business TT$329. Do not invent a USD menu.
 * Free listings: unlimited. Monetise via disclosed Juvay fee on successful Wam online sales.
 * Paid CTAs stay hidden until Wam is configured.
 */
/** -1 means unlimited */
export const FREE_LISTING_LIMIT = -1;

/** Written affiliate lock: 10% of the paid subscription (not 20%, not SweetHand take). */
export const AFFILIATE_SUBSCRIPTION_CUT = 0.10;

/** Basis points on successful Wam online face amount (display defaults; server is source of truth). */
export const JUVAY_FEE_BPS_FREE = 450;
export const JUVAY_FEE_BPS_PREMIUM = 300;

export const JUVAY_PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceTtd: 0,
    period: 'forever',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_FREE,
    features: [
      'Unlimited product listings',
      'juvay.app store slug',
      'Cash at pickup',
      'Cash on delivery (buyer handling fee)',
      'Wam online pay when configured (platform fee on successful sales)',
    ],
    paid: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceTtd: 99,
    period: '/month',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_PREMIUM,
    features: [
      'Unlimited listings',
      'Lower Juvay fee on Wam online sales',
      'Everything in Free',
      'AI product drafts (review before publish)',
    ],
    paid: true,
  },
  {
    id: 'business',
    name: 'Business',
    priceTtd: 329,
    period: '/month',
    listings: 'unlimited' as const,
    juvayFeeBps: JUVAY_FEE_BPS_PREMIUM,
    features: [
      'Everything in Starter',
      'Custom branding',
      'Priority support',
    ],
    paid: true,
  },
] as const;

export function formatPlanPrice(priceTtd: number): string {
  return priceTtd === 0 ? 'TT$0' : `TT$${priceTtd}`;
}

export function formatFeePercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}
