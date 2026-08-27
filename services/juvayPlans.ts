/**
 * One TTD price table for Juvay. Free / Starter / Business.
 * Free listing lock = 5. Paid CTAs stay hidden until Wam is configured.
 */
export const FREE_LISTING_LIMIT = 5;

export const JUVAY_PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceTtd: 0,
    period: 'forever',
    listings: FREE_LISTING_LIMIT,
    features: [
      '5 product listings',
      'juvay.app store slug',
      'Cash at pickup',
      'Cash on delivery',
    ],
    paid: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    priceTtd: 199,
    period: '/month',
    listings: 'unlimited' as const,
    features: [
      'Unlimited listings',
      'Everything in Free',
      'AI product drafts (review before publish)',
    ],
    paid: true,
  },
  {
    id: 'business',
    name: 'Business',
    priceTtd: 399,
    period: '/month',
    listings: 'unlimited' as const,
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
