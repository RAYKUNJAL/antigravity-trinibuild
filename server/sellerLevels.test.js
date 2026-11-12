'use strict';
const assert = require('assert');
const {
  computeLevel,
  refuseRate,
  ratingMeets,
  statsFromRows,
  isCompletedOrder,
  CRITERIA,
  emptyStats,
} = require('./sellerLevels');

function base(overrides) {
  return { ...emptyStats(), ...overrides };
}

// Default: Starter, nothing invented.
{
  const r = computeLevel(base());
  assert.strictEqual(r.level, 'starter');
  assert.strictEqual(r.label, 'Starter');
  assert.strictEqual(r.stats.ratingAverage, null);
  assert.strictEqual(r.stats.reviewCount, 0);
  assert.strictEqual(r.tenth_order_prompt, null);
  assert.strictEqual(r.verified_badge_free, true);
  assert.strictEqual(r.earned_not_bought, true);
  assert.strictEqual(r.next, 'rising');
}

// 10 completed, 0 refused, 0 reviews → Rising (rating skipped).
{
  const r = computeLevel(base({ completedOrders: 10, decidedOrders: 10 }));
  assert.strictEqual(r.level, 'rising');
  assert.strictEqual(r.gates.rising.rating.applicable, false);
  assert.strictEqual(r.tenth_order_prompt, 'You unlocked Rising. The badge is earned from completed orders, not a paid upgrade.');
}

// 10 completed, 3 refused of 13 (23%) → stay Starter.
{
  const r = computeLevel(base({ completedOrders: 10, refusedOrders: 3, decidedOrders: 13 }));
  assert.strictEqual(r.level, 'starter');
  assert.ok(refuseRate(r.stats) > 0.20);
  assert.ok(r.gates.rising.reasons.some((x) => /Refuse rate/.test(x)));
}

// 10 completed, 2 refused of 12 (~16.7%), 3 reviews at 4.0 → Rising.
{
  const r = computeLevel(base({
    completedOrders: 10, refusedOrders: 2, decidedOrders: 12,
    reviewCount: 3, ratingAverage: 4.0,
  }));
  assert.strictEqual(r.level, 'rising');
  assert.strictEqual(r.gates.rising.rating.applicable, true);
  assert.strictEqual(r.gates.rising.rating.met, true);
}

// 10 completed, 3 reviews at 3.9 → stay Starter.
{
  const r = computeLevel(base({
    completedOrders: 10, decidedOrders: 10,
    reviewCount: 3, ratingAverage: 3.9,
  }));
  assert.strictEqual(r.level, 'starter');
}

// 2 reviews at 5.0 and 10 orders → Rising (rating skipped, only 2 reviews).
{
  const r = computeLevel(base({
    completedOrders: 10, decidedOrders: 10,
    reviewCount: 2, ratingAverage: 5.0,
  }));
  assert.strictEqual(r.level, 'rising');
  assert.strictEqual(r.gates.rising.rating.applicable, false);
}

// ratingMeets helper
{
  const skip = ratingMeets(base({ reviewCount: 2, ratingAverage: 5 }), 4, 3);
  assert.deepStrictEqual({ applicable: skip.applicable, met: skip.met }, { applicable: false, met: true });
  const fail = ratingMeets(base({ reviewCount: 3, ratingAverage: 3.99 }), 4, 3);
  assert.strictEqual(fail.met, false);
  const ok = ratingMeets(base({ reviewCount: 3, ratingAverage: 4 }), 4, 3);
  assert.strictEqual(ok.met, true);
  const none = ratingMeets(base({ reviewCount: 0, ratingAverage: null }), 4, 3);
  assert.strictEqual(none.applicable, false);
}

// Pro: 25 orders, Wam verified, 80% dispatch, 5 reviews at 4.0.
{
  const r = computeLevel(base({
    completedOrders: 25, decidedOrders: 25,
    wamVerified: true,
    confirmDispatchEligible: 10, confirmDispatchDone: 8,
    reviewCount: 5, ratingAverage: 4.0,
  }));
  assert.strictEqual(r.level, 'pro');
  assert.strictEqual(r.gates.pro.dispatchSkipped, false);
}

// Pro fails without Wam — Rising if rising criteria met.
{
  const r = computeLevel(base({
    completedOrders: 25, decidedOrders: 25,
    wamVerified: false,
    confirmDispatchEligible: 10, confirmDispatchDone: 10,
    reviewCount: 5, ratingAverage: 4.5,
  }));
  assert.strictEqual(r.level, 'rising');
  assert.ok(r.gates.pro.reasons.some((x) => /Wam verified/.test(x)));
}

// Pro fails at 79% dispatch.
{
  const r = computeLevel(base({
    completedOrders: 25, decidedOrders: 25,
    wamVerified: true,
    confirmDispatchEligible: 100, confirmDispatchDone: 79,
    reviewCount: 5, ratingAverage: 4.5,
  }));
  assert.strictEqual(r.level, 'rising');
}

// Pro: 0 dispatch-eligible COD orders → dispatch skipped, can still be Pro.
{
  const r = computeLevel(base({
    completedOrders: 25, decidedOrders: 25,
    wamVerified: true,
    confirmDispatchEligible: 0, confirmDispatchDone: 0,
    reviewCount: 0, ratingAverage: null,
  }));
  assert.strictEqual(r.level, 'pro');
  assert.strictEqual(r.gates.pro.dispatchSkipped, true);
}

// Market Leader via 100 orders / 90d.
{
  const r = computeLevel(base({
    completedOrders: 100, completedOrders90d: 100, decidedOrders: 100,
    wamVerified: true,
    reviewCount: 20, ratingAverage: 4.5,
    refusedOrders: 0,
  }));
  assert.strictEqual(r.level, 'market_leader');
}

// Market Leader via TT$15k online GMV in 90d, only 50 orders.
{
  const r = computeLevel(base({
    completedOrders: 50, completedOrders90d: 50, decidedOrders: 50,
    onlineGmv90dCents: 1_500_000,
    wamVerified: true,
    reviewCount: 20, ratingAverage: 4.5,
  }));
  assert.strictEqual(r.level, 'market_leader');
}

// TT$14,999.99 is not enough (and only 50 orders).
{
  const r = computeLevel(base({
    completedOrders: 50, completedOrders90d: 50, decidedOrders: 50,
    onlineGmv90dCents: 1_499_999,
    wamVerified: true,
    reviewCount: 20, ratingAverage: 4.5,
  }));
  assert.notStrictEqual(r.level, 'market_leader');
}

// Market Leader fails 11% refuse.
{
  const r = computeLevel(base({
    completedOrders: 100, completedOrders90d: 100,
    refusedOrders: 13, decidedOrders: 113,
    wamVerified: true,
    reviewCount: 20, ratingAverage: 4.8,
  }));
  assert.ok(refuseRate(r.stats) >= 0.10);
  assert.notStrictEqual(r.level, 'market_leader');
}

// Market Leader fails without Wam.
{
  const r = computeLevel(base({
    completedOrders: 100, completedOrders90d: 100, decidedOrders: 100,
    wamVerified: false,
    reviewCount: 20, ratingAverage: 5,
  }));
  assert.notStrictEqual(r.level, 'market_leader');
}

// 9 completed, otherwise Rising-ready → tenth-order prompt.
{
  const r = computeLevel(base({ completedOrders: 9, decidedOrders: 9 }));
  assert.strictEqual(r.level, 'starter');
  assert.ok(/One more completed order unlocks Rising/.test(r.tenth_order_prompt));
}

// 9 completed but high refuse — prompt mentions refuse rate, no false unlock promise.
{
  const r = computeLevel(base({ completedOrders: 9, refusedOrders: 5, decidedOrders: 14 }));
  assert.strictEqual(r.level, 'starter');
  assert.ok(/refuse rate/.test(r.tenth_order_prompt));
  assert.ok(!/unlocks Rising\./.test(r.tenth_order_prompt));
}

// Stats from rows: completed, refused, 90d GMV, reviews only when published.
{
  const now = new Date('2026-11-12T15:00:00-05:00');
  const orders = [
    { status: 'delivered', payment_method: 'wam', payment_rail: 'wallet', subtotal_cents: 800000, created_at: '2026-10-01T12:00:00Z' },
    { status: 'delivered', payment_method: 'cash_pickup', subtotal_cents: 200000, created_at: '2026-10-15T12:00:00Z' },
    { status: 'refused', payment_method: 'cod', created_at: '2026-10-20T12:00:00Z' },
    { status: 'pending', payment_method: 'cod', created_at: '2026-11-01T12:00:00Z' },
    { status: 'preparing', payment_method: 'cod', dispatch_confirmed_at: '2026-11-02T12:00:00Z', created_at: '2026-11-02T10:00:00Z' },
    { status: 'out_for_delivery', payment_method: 'cod', created_at: '2026-11-03T10:00:00Z' },
    { status: 'delivered', payment_status: 'collected', payment_method: 'cash_pickup', created_at: '2026-08-01T12:00:00Z' }, // older than 90d
  ];
  // The last one: Aug 1 to Nov 12 is more than 90 days? Nov 12 - 90 = Aug 14. Aug 1 is outside. Good.
  const reviews = [
    { rating: 5, published: true },
    { rating: 4, published: true },
    { rating: 1, published: false }, // ignored
  ];
  const s = statsFromRows({ orders, reviews, wamVerified: true, now });
  assert.strictEqual(s.completedOrders, 3);
  assert.strictEqual(s.completedOrders90d, 2);
  assert.strictEqual(s.refusedOrders, 1);
  assert.strictEqual(s.onlineGmv90dCents, 800000);
  assert.strictEqual(s.confirmDispatchEligible, 2); // preparing + out_for_delivery (refused is eligible? refused is not in excluded... isDispatchEligible: method cod, status refused is NOT in cancelled/pending/awaiting_payment/refunded. Hmm refused would be eligible.

  // Let me check: refused status - is it dispatch eligible? I said method===cod and not cancelled/pending/awaiting_payment/refunded. Refused would count. That might be wrong. For confirm-dispatch rate, refused orders maybe shouldn't be in the denominator if they were refused before dispatch. This is edge-y. Let me check the test result and maybe tighten the module.

  assert.strictEqual(s.reviewCount, 2);
  assert.strictEqual(s.ratingAverage, 4.5);
  assert.strictEqual(s.wamVerified, true);
}

// isCompletedOrder: collected pickup counts; pending does not.
{
  assert.strictEqual(isCompletedOrder({ status: 'delivered' }), true);
  assert.strictEqual(isCompletedOrder({ status: 'confirmed', payment_status: 'collected' }), true);
  assert.strictEqual(isCompletedOrder({ status: 'pending', payment_status: 'collected' }), false);
  assert.strictEqual(isCompletedOrder({ status: 'refused' }), false);
  assert.strictEqual(isCompletedOrder({ status: 'cancelled' }), false);
}

// Criteria constants match the locked plan.
{
  assert.strictEqual(CRITERIA.rising.completedOrders, 10);
  assert.strictEqual(CRITERIA.rising.maxRefuseRate, 0.20);
  assert.strictEqual(CRITERIA.pro.completedOrders, 25);
  assert.strictEqual(CRITERIA.pro.minConfirmDispatchRate, 0.80);
  assert.strictEqual(CRITERIA.market_leader.completedOrders90d, 100);
  assert.strictEqual(CRITERIA.market_leader.onlineGmv90dCents, 1_500_000);
  assert.strictEqual(CRITERIA.market_leader.minRating, 4.5);
  assert.strictEqual(CRITERIA.market_leader.minReviewsForRating, 20);
  assert.strictEqual(CRITERIA.market_leader.maxRefuseRate, 0.10);
}

console.log('sellerLevels.test.js: all assertions passed');
