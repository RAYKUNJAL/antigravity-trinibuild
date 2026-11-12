/**
 * Juvay platform fee + Wam pass-through quote.
 * Juvay fee applies ONLY to successful online Wam sales (wallet or card),
 * computed on item subtotal, capped, no minimum. Zero commission on cash
 * pickup and COD (COD may add a separate buyer-paid handling fee — a proposal).
 * Wam processing is pass-through and is never absorbed by Juvay.
 * Wam figures are the published rate (fetched 2026-11-12); confirm with Wam.
 *
 * Env: JUVAY_FEE_BPS_FREE, JUVAY_FEE_BPS_PREMIUM, JUVAY_FEE_CAP_CENTS,
 *      WAM_CARD_PCT_BPS, WAM_CARD_FLAT_CENTS, WAM_WALLET_PCT_BPS, WAM_WALLET_FLAT_CENTS,
 *      WAM_CARD_FLAT_PAYER (buyer|seller|split), COD_HANDLING_FEE_CENTS_DEFAULT,
 *      ADS_ENABLED, LISTING_RATE_LIMIT_PER_HOUR
 */
const WAM_RATE_LABEL = 'Wam published rate, confirm with Wam';
const PREMIUM_SLUGS = new Set(['starter', 'business', 'pro', 'premium']);
const RAILS = new Set(['wam_wallet', 'wam_card', 'cash_pickup', 'cod']);

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function envEnum(name, allowed, fallback) {
  const v = String(process.env[name] || '').trim().toLowerCase();
  return allowed.includes(v) ? v : fallback;
}

function feeConfig(overrides) {
  const base = {
    juvayFeeBpsFree: envInt('JUVAY_FEE_BPS_FREE', 450),
    juvayFeeBpsPremium: envInt('JUVAY_FEE_BPS_PREMIUM', 250),
    juvayFeeCapCents: envInt('JUVAY_FEE_CAP_CENTS', 2500),
    wamCardPctBps: envInt('WAM_CARD_PCT_BPS', 300),
    wamCardFlatCents: envInt('WAM_CARD_FLAT_CENTS', 150),
    wamWalletPctBps: envInt('WAM_WALLET_PCT_BPS', 200),
    wamWalletFlatCents: envInt('WAM_WALLET_FLAT_CENTS', 0),
    wamCardFlatPayer: envEnum('WAM_CARD_FLAT_PAYER', ['buyer', 'seller', 'split'], 'buyer'),
    codHandlingFeeCentsDefault: envInt('COD_HANDLING_FEE_CENTS_DEFAULT', 1000),
    adsEnabled: String(process.env.ADS_ENABLED || 'false').toLowerCase() === 'true',
    wamRateLabel: WAM_RATE_LABEL,
    noticeDaysBeforeChange: 30,
    wamCardSettlement: 'T+2',
    wamWalletSettlement: 'instant',
    wamBankPayoutCents: 0,
  };
  return overrides ? { ...base, ...overrides } : base;
}

function isPremiumPlan(planSlug) {
  return PREMIUM_SLUGS.has(String(planSlug || '').toLowerCase());
}

function feeBpsForPlan(planSlug, cfg) {
  const c = cfg || feeConfig();
  return isPremiumPlan(planSlug) ? c.juvayFeeBpsPremium : c.juvayFeeBpsFree;
}

function defaultCodHandlingFeeCents(cfg) {
  return (cfg || feeConfig()).codHandlingFeeCentsDefault;
}

function listingRateLimitPerHour() {
  return envInt('LISTING_RATE_LIMIT_PER_HOUR', 40);
}

function adsEnabled(cfg) {
  return !!(cfg || feeConfig()).adsEnabled;
}

/** bps of cents, floored, then capped. Cap defaults to JUVAY_FEE_CAP_CENTS. */
function juvayFeeCents(subtotalCents, bps, capCents) {
  const face = Math.max(0, Math.trunc(Number(subtotalCents) || 0));
  const rate = Math.max(0, Math.trunc(Number(bps) || 0));
  const raw = Math.floor((face * rate) / 10000);
  const cap = capCents == null
    ? envInt('JUVAY_FEE_CAP_CENTS', 2500)
    : Math.max(0, Math.trunc(Number(capCents) || 0));
  return Math.min(raw, cap);
}

function pctFeeCents(amountCents, bps) {
  const face = Math.max(0, Math.trunc(Number(amountCents) || 0));
  const rate = Math.max(0, Math.trunc(Number(bps) || 0));
  return Math.floor((face * rate) / 10000);
}

function splitFlat(flatCents) {
  const flat = Math.max(0, Math.trunc(Number(flatCents) || 0));
  const buyer = Math.floor(flat / 2);
  return { buyer, seller: flat - buyer };
}


function formatTtdCents(cents) {
  const n = Math.trunc(Number(cents) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}TT$${whole}.${frac}`;
}

function cardFeeNudge(subtotalCents, cfg) {
  const c = cfg || feeConfig();
  const sub = Math.max(0, Math.trunc(Number(subtotalCents) || 0));
  if (sub <= 0) return null;
  // Soft nudge on small card orders (under TT$50). No hard minimum.
  if (sub < 5000) {
    return {
      wallet: `Pay with Wam wallet to skip the ${formatTtdCents(c.wamCardFlatCents)} card fee`,
      add_item: 'add an item',
    };
  }
  return null;
}

/**
 * Skip Sat/Sun only. Does not invent public holidays.
 * Card settlement is T+2 (Wam published rate, confirm with Wam).
 */
function addBusinessDays(fromDate, days) {
  const d = new Date(fromDate);
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date');
  const n = Math.max(0, Math.trunc(Number(days) || 0));
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

function wamAvailableAt(rail, fulfilledAt) {
  const from = fulfilledAt ? new Date(fulfilledAt) : new Date();
  if (rail === 'wam_card' || rail === 'card') return addBusinessDays(from, 2);
  return from; // wallet instant; cash has no Wam hold
}

function normalizeRail(rail) {
  const r = String(rail || '').trim().toLowerCase();
  if (r === 'wallet' || r === 'wam' || r === 'wam_wallet') return 'wam_wallet';
  if (r === 'card' || r === 'wam_card') return 'wam_card';
  if (r === 'cash' || r === 'cash_pickup' || r === 'pickup') return 'cash_pickup';
  if (r === 'cod' || r === 'cash_on_delivery') return 'cod';
  return null;
}

function isOnlineWamRail(rail) {
  const r = normalizeRail(rail);
  return r === 'wam_wallet' || r === 'wam_card';
}

function paymentMethodForRail(rail) {
  const r = normalizeRail(rail);
  if (r === 'wam_wallet' || r === 'wam_card') return 'wam';
  if (r === 'cash_pickup') return 'cash_pickup';
  return 'cod';
}

function paymentRailColumn(rail) {
  const r = normalizeRail(rail);
  if (r === 'wam_wallet') return 'wallet';
  if (r === 'wam_card') return 'card';
  return null;
}

/**
 * Transparent per-rail quote.
 * @param {object} input
 * @param {number} input.subtotalCents item subtotal (Juvay fee base)
 * @param {number} [input.deliveryFeeCents]
 * @param {string} [input.planSlug]
 * @param {string} input.rail wam_wallet | wam_card | cash_pickup | cod
 * @param {number} [input.codHandlingFeeCents]
 * @param {object} [input.config] feeConfig overrides
 */
function quoteOrder(input) {
  const cfg = feeConfig(input?.config);
  const subtotalCents = Math.max(0, Math.trunc(Number(input?.subtotalCents) || 0));
  const deliveryFeeCents = Math.max(0, Math.trunc(Number(input?.deliveryFeeCents) || 0));
  const rail = normalizeRail(input?.rail);
  if (!rail) {
    throw new Error('rail must be wam_wallet, wam_card, cash_pickup, or cod');
  }
  const planSlug = input?.planSlug || 'free';
  const bps = feeBpsForPlan(planSlug, cfg);
  const online = isOnlineWamRail(rail);

  const juvayFee = online ? juvayFeeCents(subtotalCents, bps, cfg.juvayFeeCapCents) : 0;
  const juvayUncapped = online
    ? Math.floor((subtotalCents * bps) / 10000)
    : 0;
  const capApplied = online && juvayUncapped > cfg.juvayFeeCapCents;

  // Wam % is pass-through on the amount Wam processes excluding buyer-paid flat
  // (item subtotal + delivery). Label: Wam published rate, confirm with Wam.
  const wamBase = subtotalCents + deliveryFeeCents;
  let wamPctBps = 0;
  let wamFlatTotal = 0;
  let wamFlatPayer = null;
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
      input?.codHandlingFeeCents != null ? input.codHandlingFeeCents : cfg.codHandlingFeeCentsDefault
    ) || 0))
    : 0;

  const faceCents = subtotalCents + deliveryFeeCents;
  const buyerPaysCents = faceCents + buyerCardFee + handling;
  const sellerNetCents = faceCents - juvayFee - wamFeeSeller;

  const nudge = rail === 'wam_card' ? cardFeeNudge(subtotalCents, cfg) : null;

  return {
    rail,
    payment_method: paymentMethodForRail(rail),
    payment_rail: paymentRailColumn(rail),
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

function quoteAllRails(input) {
  const rails = ['wam_wallet', 'wam_card', 'cash_pickup', 'cod'];
  const quotes = {};
  for (const rail of rails) {
    quotes[rail] = quoteOrder({ ...input, rail });
  }
  return {
    currency: 'TTD',
    subtotal_cents: Math.max(0, Math.trunc(Number(input?.subtotalCents) || 0)),
    delivery_fee_cents: Math.max(0, Math.trunc(Number(input?.deliveryFeeCents) || 0)),
    plan_slug: input?.planSlug || 'free',
    rail_order: rails,
    quotes,
    wam_rate_label: WAM_RATE_LABEL,
    disclosure: publicRateCard(feeConfig(input?.config)),
  };
}

function publicRateCard(cfg) {
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
    premium_pricing: 'Premium is TT$49/month for the first 3 months, then TT$79/month. 2.5% Juvay fee on online Wam sales, capped at TT$25. Checkout is not open (PREMIUM_CHECKOUT_ENABLED=false)',
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

/**
 * Seller available vs pending from merchant_net (and refund) lines.
 * Juvay never holds funds beyond Wam settlement (wallet instant, card T+2).
 */
function summarizeSellerLedger(entries, now) {
  const when = now ? new Date(now) : new Date();
  let available = 0;
  let pending = 0;
  const lines = Array.isArray(entries) ? entries : [];
  for (const e of lines) {
    const type = String(e.entry_type || '');
    if (type !== 'merchant_net' && type !== 'refund_merchant_net') continue;
    const signed = e.direction === 'debit' ? -Math.abs(Number(e.amount_cents) || 0) : Math.abs(Number(e.amount_cents) || 0);
    const availAt = e.available_at ? new Date(e.available_at) : (e.created_at ? new Date(e.created_at) : when);
    if (!Number.isNaN(availAt.getTime()) && availAt.getTime() > when.getTime()) {
      pending += signed;
    } else {
      available += signed;
    }
  }
  return {
    available_net_cents: available,
    pending_net_cents: pending,
  };
}

function isRefundEvent(event) {
  if (!event || typeof event !== 'object') return false;
  const t = String(event.type || event.event_type || event.status || event.action || '').toLowerCase();
  return t.includes('refund');
}

module.exports = {
  WAM_RATE_LABEL,
  RAILS,
  envInt,
  feeConfig,
  isPremiumPlan,
  feeBpsForPlan,
  defaultCodHandlingFeeCents,
  listingRateLimitPerHour,
  adsEnabled,
  juvayFeeCents,
  pctFeeCents,
  splitFlat,
  formatTtdCents,
  cardFeeNudge,
  addBusinessDays,
  wamAvailableAt,
  normalizeRail,
  isOnlineWamRail,
  paymentMethodForRail,
  paymentRailColumn,
  quoteOrder,
  quoteAllRails,
  publicRateCard,
  summarizeSellerLedger,
  isRefundEvent,
};
