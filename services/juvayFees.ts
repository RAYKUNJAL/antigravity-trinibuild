/**
 * TypeScript mirror of server/juvayFees.js for checkout and the /fees page.
 * Server (env-backed) is the source of truth — prefer API quotes at checkout.
 * Keep in sync with server/juvayFees.js. Wam figures: "Wam published rate, confirm with Wam".
 */

export const WAM_RATE_LABEL = 'Wam published rate, confirm with Wam';

export type PaymentRail = 'wam_wallet' | 'wam_card' | 'cash_pickup' | 'cod';
export type FlatPayer = 'buyer' | 'seller' | 'split';

export interface FeeConfig {
  juvayFeeBpsFree: number;
  juvayFeeBpsPremium: number;
  juvayFeeCapCents: number;
  wamCardPctBps: number;
  wamCardFlatCents: number;
  wamWalletPctBps: number;
  wamWalletFlatCents: number;
  wamCardFlatPayer: FlatPayer;
  codHandlingFeeCentsDefault: number;
  adsEnabled: boolean;
  wamRateLabel: string;
  noticeDaysBeforeChange: number;
  wamCardSettlement: string;
  wamWalletSettlement: string;
  wamBankPayoutCents: number;
}

export const FEE_DEFAULTS: FeeConfig = {
  juvayFeeBpsFree: 450,
  juvayFeeBpsPremium: 250,
  juvayFeeCapCents: 2500,
  wamCardPctBps: 300,
  wamCardFlatCents: 150,
  wamWalletPctBps: 200,
  wamWalletFlatCents: 0,
  wamCardFlatPayer: 'buyer',
  codHandlingFeeCentsDefault: 1000,
  adsEnabled: false,
  wamRateLabel: WAM_RATE_LABEL,
  noticeDaysBeforeChange: 30,
  wamCardSettlement: 'T+2',
  wamWalletSettlement: 'instant',
  wamBankPayoutCents: 0,
};

const PREMIUM_SLUGS = new Set(['starter', 'business', 'pro', 'premium']);

export function feeConfig(overrides?: Partial<FeeConfig>): FeeConfig {
  return { ...FEE_DEFAULTS, ...overrides };
}

export function isPremiumPlan(planSlug?: string | null): boolean {
  return PREMIUM_SLUGS.has(String(planSlug || '').toLowerCase());
}

export function feeBpsForPlan(planSlug?: string | null, cfg?: FeeConfig): number {
  const c = cfg || feeConfig();
  return isPremiumPlan(planSlug) ? c.juvayFeeBpsPremium : c.juvayFeeBpsFree;
}

export function juvayFeeCents(subtotalCents: number, bps: number, capCents: number = FEE_DEFAULTS.juvayFeeCapCents): number {
  const face = Math.max(0, Math.trunc(Number(subtotalCents) || 0));
  const rate = Math.max(0, Math.trunc(Number(bps) || 0));
  const raw = Math.floor((face * rate) / 10000);
  const cap = Math.max(0, Math.trunc(Number(capCents) || 0));
  return Math.min(raw, cap);
}

function pctFeeCents(amountCents: number, bps: number): number {
  const face = Math.max(0, Math.trunc(Number(amountCents) || 0));
  const rate = Math.max(0, Math.trunc(Number(bps) || 0));
  return Math.floor((face * rate) / 10000);
}

function splitFlat(flatCents: number): { buyer: number; seller: number } {
  const flat = Math.max(0, Math.trunc(Number(flatCents) || 0));
  const buyer = Math.floor(flat / 2);
  return { buyer, seller: flat - buyer };
}

export function formatTtdCents(cents: number): string {
  const n = Math.trunc(Number(cents) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}TT$${whole}.${frac}`;
}

export function formatFeePercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function cardFeeNudge(subtotalCents: number, cfg?: FeeConfig): { wallet: string; add_item: string } | null {
  const c = cfg || feeConfig();
  const sub = Math.max(0, Math.trunc(Number(subtotalCents) || 0));
  if (sub <= 0) return null;
  if (sub < 5000) {
    return {
      wallet: `Pay with Wam wallet to skip the ${formatTtdCents(c.wamCardFlatCents)} card fee`,
      add_item: 'add an item',
    };
  }
  return null;
}

export function normalizeRail(rail?: string | null): PaymentRail | null {
  const r = String(rail || '').trim().toLowerCase();
  if (r === 'wallet' || r === 'wam' || r === 'wam_wallet') return 'wam_wallet';
  if (r === 'card' || r === 'wam_card') return 'wam_card';
  if (r === 'cash' || r === 'cash_pickup' || r === 'pickup') return 'cash_pickup';
  if (r === 'cod' || r === 'cash_on_delivery') return 'cod';
  return null;
}

export function isOnlineWamRail(rail?: string | null): boolean {
  const r = normalizeRail(rail);
  return r === 'wam_wallet' || r === 'wam_card';
}

export function paymentMethodForRail(rail?: string | null): 'wam' | 'cash_pickup' | 'cod' {
  const r = normalizeRail(rail);
  if (r === 'wam_wallet' || r === 'wam_card') return 'wam';
  if (r === 'cash_pickup') return 'cash_pickup';
  return 'cod';
}

export interface FeeQuote {
  rail: PaymentRail;
  payment_method: 'wam' | 'cash_pickup' | 'cod';
  payment_rail: 'wallet' | 'card' | null;
  plan_slug: string;
  currency: 'TTD';
  subtotal_cents: number;
  delivery_fee_cents: number;
  buyer_card_fee_cents: number;
  cod_handling_fee_cents: number;
  handling_fee_cents: number;
  total_buyer_pays_cents: number;
  total_cents: number;
  face_cents: number;
  wam_fee_cents: number;
  wam_fee_seller_cents: number;
  wam_pct_fee_cents: number;
  wam_flat_fee_cents: number;
  wam_flat_payer: FlatPayer | null;
  wam_pct_bps: number;
  juvay_fee_cents: number;
  juvay_fee_bps: number;
  juvay_fee_cap_cents: number;
  juvay_fee_cap_applied: boolean;
  seller_net_cents: number;
  wam_rate_label: string;
  settlement: string;
  nudge: { wallet: string; add_item: string } | null;
  lowest_fee: boolean;
  zero_commission: boolean;
}

export function quoteOrder(input: {
  subtotalCents: number;
  deliveryFeeCents?: number;
  planSlug?: string;
  rail: string;
  codHandlingFeeCents?: number;
  config?: Partial<FeeConfig>;
}): FeeQuote {
  const cfg = feeConfig(input.config);
  const subtotalCents = Math.max(0, Math.trunc(Number(input.subtotalCents) || 0));
  const deliveryFeeCents = Math.max(0, Math.trunc(Number(input.deliveryFeeCents) || 0));
  const rail = normalizeRail(input.rail);
  if (!rail) throw new Error('rail must be wam_wallet, wam_card, cash_pickup, or cod');
  const planSlug = input.planSlug || 'free';
  const bps = feeBpsForPlan(planSlug, cfg);
  const online = isOnlineWamRail(rail);

  const juvayFee = online ? juvayFeeCents(subtotalCents, bps, cfg.juvayFeeCapCents) : 0;
  const juvayUncapped = online ? Math.floor((subtotalCents * bps) / 10000) : 0;
  const capApplied = online && juvayUncapped > cfg.juvayFeeCapCents;

  const wamBase = subtotalCents + deliveryFeeCents;
  let wamPctBps = 0;
  let wamFlatTotal = 0;
  let wamFlatPayer: FlatPayer | null = null;
  let wamPctFee = 0;
  let buyerCardFee = 0;
  let wamFlatSeller = 0;

  if (rail === 'wam_wallet') {
    wamPctBps = cfg.wamWalletPctBps;
    wamFlatTotal = cfg.wamWalletFlatCents;
    wamPctFee = pctFeeCents(wamBase, wamPctBps);
    wamFlatPayer = wamFlatTotal > 0 ? 'seller' : null;
    wamFlatSeller = wamFlatTotal;
  } else if (rail === 'wam_card') {
    wamPctBps = cfg.wamCardPctBps;
    wamFlatTotal = cfg.wamCardFlatCents;
    wamPctFee = pctFeeCents(wamBase, wamPctBps);
    wamFlatPayer = cfg.wamCardFlatPayer;
    if (wamFlatPayer === 'buyer') {
      buyerCardFee = wamFlatTotal;
    } else if (wamFlatPayer === 'seller') {
      wamFlatSeller = wamFlatTotal;
    } else if (wamFlatPayer === 'split') {
      const parts = splitFlat(wamFlatTotal);
      buyerCardFee = parts.buyer;
      wamFlatSeller = parts.seller;
    }
  }

  const wamFeeSeller = online ? wamPctFee + wamFlatSeller : 0;
  const wamFeeTotal = online ? wamPctFee + wamFlatTotal : 0;
  const handling = rail === 'cod'
    ? Math.max(0, Math.trunc(Number(
      input.codHandlingFeeCents != null ? input.codHandlingFeeCents : cfg.codHandlingFeeCentsDefault,
    ) || 0))
    : 0;

  const faceCents = subtotalCents + deliveryFeeCents;
  const buyerPaysCents = faceCents + buyerCardFee + handling;
  const sellerNetCents = faceCents - juvayFee - wamFeeSeller;
  const nudge = rail === 'wam_card' ? cardFeeNudge(subtotalCents, cfg) : null;

  return {
    rail,
    payment_method: paymentMethodForRail(rail),
    payment_rail: rail === 'wam_wallet' ? 'wallet' : rail === 'wam_card' ? 'card' : null,
    plan_slug: planSlug,
    currency: 'TTD',
    subtotal_cents: subtotalCents,
    delivery_fee_cents: deliveryFeeCents,
    buyer_card_fee_cents: buyerCardFee,
    cod_handling_fee_cents: handling,
    handling_fee_cents: handling,
    total_buyer_pays_cents: buyerPaysCents,
    total_cents: buyerPaysCents,
    face_cents: faceCents,
    wam_fee_cents: wamFeeTotal,
    wam_fee_seller_cents: wamFeeSeller,
    wam_pct_fee_cents: online ? wamPctFee : 0,
    wam_flat_fee_cents: online ? wamFlatTotal : 0,
    wam_flat_payer: wamFlatPayer,
    wam_pct_bps: online ? wamPctBps : 0,
    juvay_fee_cents: juvayFee,
    juvay_fee_bps: online ? bps : 0,
    juvay_fee_cap_cents: cfg.juvayFeeCapCents,
    juvay_fee_cap_applied: capApplied,
    seller_net_cents: sellerNetCents,
    wam_rate_label: WAM_RATE_LABEL,
    settlement: rail === 'wam_card' ? cfg.wamCardSettlement
      : rail === 'wam_wallet' ? cfg.wamWalletSettlement
      : 'cash — no Wam hold',
    nudge,
    lowest_fee: rail === 'wam_wallet',
    zero_commission: !online,
  };
}

export function quoteAllRails(input: {
  subtotalCents: number;
  deliveryFeeCents?: number;
  planSlug?: string;
  codHandlingFeeCents?: number;
  config?: Partial<FeeConfig>;
}) {
  const rails: PaymentRail[] = ['wam_wallet', 'wam_card', 'cash_pickup', 'cod'];
  const quotes = {} as Record<PaymentRail, FeeQuote>;
  for (const rail of rails) {
    quotes[rail] = quoteOrder({ ...input, rail });
  }
  return {
    currency: 'TTD' as const,
    subtotal_cents: Math.max(0, Math.trunc(Number(input.subtotalCents) || 0)),
    delivery_fee_cents: Math.max(0, Math.trunc(Number(input.deliveryFeeCents) || 0)),
    plan_slug: input.planSlug || 'free',
    rail_order: rails,
    quotes,
    wam_rate_label: WAM_RATE_LABEL,
    disclosure: publicRateCard(feeConfig(input.config)),
  };
}

export function publicRateCard(cfg?: FeeConfig) {
  const c = cfg || feeConfig();
  return {
    free_store: true,
    unlimited_listings: true,
    cash_commission_bps: 0,
    juvay_fee_bps_free: c.juvayFeeBpsFree,
    juvay_fee_bps_premium: c.juvayFeeBpsPremium,
    juvay_fee_cap_cents: c.juvayFeeCapCents,
    juvay_fee_applies_to: 'successful online Wam sales only (wallet or card), computed on item subtotal, no minimum',
    no_listing_fee: true,
    no_payout_fee: true,
    no_monthly_fee_on_free: true,
    notice_days_before_change: c.noticeDaysBeforeChange,
    ads_optional: true,
    ads_enabled: c.adsEnabled,
    discounts_opt_in_only: true,
    premium_pricing: 'Premium pricing coming soon' as const,
    cod_handling_fee_cents_default: c.codHandlingFeeCentsDefault,
    cod_handling_fee_note: 'proposal — buyer-paid handling fee, not a Juvay commission',
    wam: {
      card_pct_bps: c.wamCardPctBps,
      card_flat_cents: c.wamCardFlatCents,
      wallet_pct_bps: c.wamWalletPctBps,
      wallet_flat_cents: c.wamWalletFlatCents,
      card_flat_payer_default: c.wamCardFlatPayer,
      card_settlement: c.wamCardSettlement,
      wallet_settlement: c.wamWalletSettlement,
      bank_payout_cents: c.wamBankPayoutCents,
      label: WAM_RATE_LABEL,
    },
  };
}
