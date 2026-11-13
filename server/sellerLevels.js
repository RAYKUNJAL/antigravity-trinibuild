/**
 * Seller growth levels. Earned from real order and review data, never bought.
 * The Verified badge (Wam verified) stays free and is a Pro / Market Leader
 * requirement, not a paid unlock.
 *
 * Rising: 10 completed orders, refuse rate < 20%, rating 4.0+ only if >= 3 reviews.
 * Pro: Wam verified, 25 completed orders, confirm-dispatch >= 80% (skipped if
 *      no dispatch-eligible COD orders), 4.0+ from >= 5 reviews (rating skipped
 *      if fewer than 5 reviews).
 * Market Leader: 100 completed orders in 90 days OR TT$15,000 online (Wam) GMV
 *      in 90 days; Wam verified; 4.5+ from >= 20 reviews (skipped if fewer);
 *      refuse rate < 10%.
 *
 * A rating gate is skipped (not failed) when there are fewer reviews than the
 * minimum. A 0-review shop is not given a 5.0 or a 0.0.
 */
'use strict';

const LEVELS = ['starter', 'rising', 'pro', 'market_leader'];

const LABELS = {
  starter: 'Starter',
  rising: 'Rising',
  pro: 'Pro',
  market_leader: 'Market Leader',
};

const CRITERIA = {
  rising: {
    completedOrders: 10,
    maxRefuseRate: 0.20,
    minRating: 4.0,
    minReviewsForRating: 3,
  },
  pro: {
    wamVerified: true,
    completedOrders: 25,
    minConfirmDispatchRate: 0.80,
    minRating: 4.0,
    minReviewsForRating: 5,
  },
  market_leader: {
    wamVerified: true,
    completedOrders90d: 100,
    onlineGmv90dCents: 1_500_000, // TT$15,000
    minRating: 4.5,
    minReviewsForRating: 20,
    maxRefuseRate: 0.10,
  },
};

const COMPLETED_STATUSES = new Set(['delivered']);
const REFUSED_STATUSES = new Set(['refused']);
const EXCLUDED_FROM_DECIDED = new Set(['pending', 'awaiting_payment', 'cancelled', 'refunded']);

function emptyStats() {
  return {
    completedOrders: 0,
    completedOrders90d: 0,
    refusedOrders: 0,
    decidedOrders: 0,
    confirmDispatchEligible: 0,
    confirmDispatchDone: 0,
    onlineGmv90dCents: 0,
    wamVerified: false,
    reviewCount: 0,
    ratingAverage: null,
  };
}

function asInt(n) {
  const v = Math.trunc(Number(n) || 0);
  return v < 0 ? 0 : v;
}

function asMoney(n) {
  const v = Math.trunc(Number(n) || 0);
  return v < 0 ? 0 : v;
}

function normalizeStats(raw) {
  const s = { ...emptyStats(), ...(raw || {}) };
  s.completedOrders = asInt(s.completedOrders);
  s.completedOrders90d = asInt(s.completedOrders90d);
  s.refusedOrders = asInt(s.refusedOrders);
  s.decidedOrders = asInt(s.decidedOrders);
  s.confirmDispatchEligible = asInt(s.confirmDispatchEligible);
  s.confirmDispatchDone = asInt(s.confirmDispatchDone);
  s.onlineGmv90dCents = asMoney(s.onlineGmv90dCents);
  s.wamVerified = s.wamVerified === true;
  s.reviewCount = asInt(s.reviewCount);
  const avg = s.ratingAverage;
  if (avg == null || !Number.isFinite(Number(avg)) || s.reviewCount <= 0) {
    s.ratingAverage = null;
  } else {
    s.ratingAverage = Math.round(Number(avg) * 100) / 100;
  }
  if (s.decidedOrders < s.completedOrders + s.refusedOrders) {
    s.decidedOrders = s.completedOrders + s.refusedOrders;
  }
  return s;
}

/** Refuse rate among decided orders. 0 decided → 0 (does not fail a max-rate gate). */
function refuseRate(stats) {
  const s = normalizeStats(stats);
  if (s.decidedOrders <= 0) return 0;
  return s.refusedOrders / s.decidedOrders;
}

/**
 * Rating gate. When reviewCount < minReviews, the gate is skipped (met=true, applicable=false).
 * Never invents a rating.
 */
function ratingMeets(stats, minRating, minReviews) {
  const s = normalizeStats(stats);
  if (s.reviewCount < minReviews) {
    return { applicable: false, met: true, reason: 'skipped_insufficient_reviews' };
  }
  if (s.ratingAverage == null) {
    return { applicable: true, met: false, reason: 'no_average' };
  }
  const met = s.ratingAverage + 1e-9 >= minRating;
  return { applicable: true, met, reason: met ? 'ok' : 'below_min' };
}

function confirmDispatchRate(stats) {
  const s = normalizeStats(stats);
  if (s.confirmDispatchEligible <= 0) return null;
  return s.confirmDispatchDone / s.confirmDispatchEligible;
}

function risingReasons(stats) {
  const s = normalizeStats(stats);
  const c = CRITERIA.rising;
  const reasons = [];
  const ordersMet = s.completedOrders >= c.completedOrders;
  if (!ordersMet) {
    reasons.push(`Need ${c.completedOrders} completed orders (have ${s.completedOrders}).`);
  }
  const rr = refuseRate(s);
  const refuseMet = rr < c.maxRefuseRate;
  if (!refuseMet) {
    reasons.push(`Refuse rate must be under ${Math.round(c.maxRefuseRate * 100)}% (is ${Math.round(rr * 1000) / 10}%).`);
  }
  const rating = ratingMeets(s, c.minRating, c.minReviewsForRating);
  if (!rating.met) {
    reasons.push(`Rating must be ${c.minRating.toFixed(1)}+ from at least ${c.minReviewsForRating} reviews (is ${s.ratingAverage} from ${s.reviewCount}).`);
  }
  return { met: ordersMet && refuseMet && rating.met, reasons, rating };
}

function proReasons(stats) {
  const s = normalizeStats(stats);
  const c = CRITERIA.pro;
  const reasons = [];
  if (!s.wamVerified) reasons.push('Wam verified is required for Pro. The Verified badge stays free.');
  if (s.completedOrders < c.completedOrders) {
    reasons.push(`Need ${c.completedOrders} completed orders (have ${s.completedOrders}).`);
  }
  const cdr = confirmDispatchRate(s);
  const dispatchMet = cdr == null || cdr + 1e-9 >= c.minConfirmDispatchRate;
  if (!dispatchMet) {
    reasons.push(`Confirm-dispatch must be at least ${Math.round(c.minConfirmDispatchRate * 100)}% (is ${Math.round((cdr || 0) * 1000) / 10}%).`);
  }
  const rating = ratingMeets(s, c.minRating, c.minReviewsForRating);
  if (!rating.met) {
    reasons.push(`Rating must be ${c.minRating.toFixed(1)}+ from at least ${c.minReviewsForRating} reviews (is ${s.ratingAverage} from ${s.reviewCount}).`);
  }
  return {
    met: s.wamVerified && s.completedOrders >= c.completedOrders && dispatchMet && rating.met,
    reasons,
    rating,
    dispatchSkipped: cdr == null,
  };
}

function marketLeaderReasons(stats) {
  const s = normalizeStats(stats);
  const c = CRITERIA.market_leader;
  const reasons = [];
  if (!s.wamVerified) reasons.push('Wam verified is required for Market Leader.');
  const volumeMet = s.completedOrders90d >= c.completedOrders90d
    || s.onlineGmv90dCents >= c.onlineGmv90dCents;
  if (!volumeMet) {
    reasons.push(
      `Need 100 completed orders in 90 days (have ${s.completedOrders90d}) or TT$15,000 online GMV in 90 days (have TT$${(s.onlineGmv90dCents / 100).toFixed(2)}).`,
    );
  }
  const rating = ratingMeets(s, c.minRating, c.minReviewsForRating);
  if (!rating.met) {
    reasons.push(`Rating must be ${c.minRating.toFixed(1)}+ from at least ${c.minReviewsForRating} reviews (is ${s.ratingAverage} from ${s.reviewCount}).`);
  }
  const rr = refuseRate(s);
  const refuseMet = rr < c.maxRefuseRate;
  if (!refuseMet) {
    reasons.push(`Refuse rate must be under ${Math.round(c.maxRefuseRate * 100)}% (is ${Math.round(rr * 1000) / 10}%).`);
  }
  return { met: s.wamVerified && volumeMet && rating.met && refuseMet, reasons, rating };
}

function computeLevel(rawStats) {
  const stats = normalizeStats(rawStats);
  const rising = risingReasons(stats);
  const pro = proReasons(stats);
  const leader = marketLeaderReasons(stats);

  let level = 'starter';
  if (leader.met) level = 'market_leader';
  else if (pro.met) level = 'pro';
  else if (rising.met) level = 'rising';

  const next = level === 'market_leader' ? null
    : level === 'pro' ? 'market_leader'
    : level === 'rising' ? 'pro'
    : 'rising';

  const nextGate = next === 'rising' ? rising
    : next === 'pro' ? pro
    : next === 'market_leader' ? leader
    : { met: true, reasons: [] };

  const tenthOrderPrompt = tenthOrderPromptFor(stats, level);

  return {
    level,
    label: LABELS[level],
    stats,
    refuse_rate: refuseRate(stats),
    confirm_dispatch_rate: confirmDispatchRate(stats),
    gates: { rising, pro, market_leader: leader },
    next,
    next_label: next ? LABELS[next] : null,
    next_reasons: nextGate.reasons || [],
    tenth_order_prompt: tenthOrderPrompt,
    verified_badge_free: true,
    earned_not_bought: true,
  };
}

function tenthOrderPromptFor(stats, level) {
  const s = normalizeStats(stats);
  if (s.completedOrders === 9 && level === 'starter') {
    const refuseOk = refuseRate(s) < CRITERIA.rising.maxRefuseRate;
    const rating = ratingMeets(s, CRITERIA.rising.minRating, CRITERIA.rising.minReviewsForRating);
    if (refuseOk && rating.met) {
      return 'One more completed order unlocks Rising. You earn the level — you do not buy it.';
    }
    if (!refuseOk) {
      return 'You are one completed order from 10, but Rising also needs a refuse rate under 20%.';
    }
    return 'You are one completed order from 10. Rising also needs a 4.0+ rating once you have at least 3 reviews.';
  }
  if (s.completedOrders >= 10 && (level === 'rising' || level === 'pro' || level === 'market_leader')) {
    if (s.completedOrders === 10 && level === 'rising') {
      return 'You unlocked Rising. The badge is earned from completed orders, not a paid upgrade.';
    }
  }
  return null;
}

function isCompletedOrder(row) {
  if (!row) return false;
  const status = String(row.status || '').toLowerCase();
  const pay = String(row.payment_status || '').toLowerCase();
  if (COMPLETED_STATUSES.has(status)) return true;
  if (pay === 'collected' && !['cancelled', 'refused', 'refunded', 'pending', 'awaiting_payment'].includes(status)) {
    return true;
  }
  return false;
}

function isRefusedOrder(row) {
  return REFUSED_STATUSES.has(String((row && row.status) || '').toLowerCase());
}

function isDecidedOrder(row) {
  const status = String((row && row.status) || '').toLowerCase();
  if (EXCLUDED_FROM_DECIDED.has(status)) return false;
  return isCompletedOrder(row) || isRefusedOrder(row) || ['confirmed', 'preparing', 'out_for_delivery', 'paid', 'awaiting_dispatch_confirm'].includes(status);
}

function isDispatchEligible(row) {
  if (!row) return false;
  const method = String(row.payment_method || '').toLowerCase();
  if (method !== 'cod') return false;
  const status = String(row.status || '').toLowerCase();
  if (['cancelled', 'pending', 'awaiting_payment', 'refunded', 'refused'].includes(status)) return false;
  return true;
}

function isDispatchDone(row) {
  return isDispatchEligible(row) && !!row.dispatch_confirmed_at;
}

function isOnlineWamOrder(row) {
  const method = String((row && row.payment_method) || '').toLowerCase();
  const rail = String((row && row.payment_rail) || (row && row.rail) || '').toLowerCase();
  return method === 'wam' || rail === 'wallet' || rail === 'card' || rail === 'wam_wallet' || rail === 'wam_card';
}

function withinDays(iso, days, now) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  const n = (now || new Date()).getTime();
  return t >= n - days * 24 * 60 * 60 * 1000 && t <= n;
}

function statsFromRows(input) {
  const now = input.now || new Date();
  const orders = Array.isArray(input.orders) ? input.orders : [];
  const reviews = Array.isArray(input.reviews) ? input.reviews : [];
  let completed = 0;
  let completed90 = 0;
  let refused = 0;
  let decided = 0;
  let eligible = 0;
  let done = 0;
  let gmv90 = 0;
  for (const o of orders) {
    if (isDecidedOrder(o)) decided += 1;
    if (isRefusedOrder(o)) refused += 1;
    if (isCompletedOrder(o)) {
      completed += 1;
      if (withinDays(o.delivered_at || o.updated_at || o.created_at, 90, now)) {
        completed90 += 1;
        if (isOnlineWamOrder(o)) {
          const cents = o.subtotal_cents != null
            ? asMoney(o.subtotal_cents)
            : Math.round(Number(o.subtotal || o.total || 0) * 100) || 0;
          gmv90 += cents;
        }
      }
    }
    if (isDispatchEligible(o)) eligible += 1;
    if (isDispatchDone(o)) done += 1;
  }
  // Reviews must already be filtered to published reviews on completed orders.
  const published = reviews.filter((r) => r && r.published !== false && Number(r.rating) >= 1);
  const reviewCount = published.length;
  let ratingAverage = null;
  if (reviewCount > 0) {
    const sum = published.reduce((acc, r) => acc + Number(r.rating), 0);
    ratingAverage = Math.round((sum / reviewCount) * 100) / 100;
  }
  return normalizeStats({
    completedOrders: completed,
    completedOrders90d: completed90,
    refusedOrders: refused,
    decidedOrders: decided,
    confirmDispatchEligible: eligible,
    confirmDispatchDone: done,
    onlineGmv90dCents: gmv90,
    wamVerified: input.wamVerified === true,
    reviewCount,
    ratingAverage,
  });
}

module.exports = {
  LEVELS,
  LABELS,
  CRITERIA,
  emptyStats,
  normalizeStats,
  refuseRate,
  ratingMeets,
  confirmDispatchRate,
  computeLevel,
  tenthOrderPromptFor,
  isCompletedOrder,
  isRefusedOrder,
  isDecidedOrder,
  isDispatchEligible,
  isDispatchDone,
  isOnlineWamOrder,
  statsFromRows,
};
