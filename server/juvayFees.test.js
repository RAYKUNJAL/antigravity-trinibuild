const assert = require('assert');
const {
  juvayFeeCents,
  feeBpsForPlan,
  quoteOrder,
  quoteAllRails,
  feeConfig,
  addBusinessDays,
  wamAvailableAt,
  summarizeSellerLedger,
  publicRateCard,
  cardFeeNudge,
  normalizeRail,
  isRefundEvent,
  WAM_RATE_LABEL,
} = require('./juvayFees');

// Isolate from any ambient env so defaults are the approved rates.
const FEE_ENV = [
  'JUVAY_FEE_BPS_FREE', 'JUVAY_FEE_BPS_PREMIUM', 'JUVAY_FEE_CAP_CENTS',
  'WAM_CARD_PCT_BPS', 'WAM_CARD_FLAT_CENTS', 'WAM_WALLET_PCT_BPS', 'WAM_WALLET_FLAT_CENTS',
  'WAM_CARD_FLAT_PAYER', 'COD_HANDLING_FEE_CENTS_DEFAULT', 'ADS_ENABLED',
];
const saved = {};
for (const k of FEE_ENV) {
  saved[k] = process.env[k];
  delete process.env[k];
}

try {
  assert.strictEqual(feeBpsForPlan('free'), 450);
  assert.strictEqual(feeBpsForPlan('starter'), 250);
  assert.strictEqual(feeBpsForPlan('business'), 250);
  assert.strictEqual(feeBpsForPlan('premium'), 250);
  assert.strictEqual(feeBpsForPlan('pro'), 250);
  assert.strictEqual(WAM_RATE_LABEL, 'Wam published rate, confirm with Wam');

  assert.strictEqual(juvayFeeCents(10000, 450), 450);
  assert.strictEqual(juvayFeeCents(10000, 250), 250);
  // Cap: TT$1000 Free would be 4500 uncapped → 2500
  assert.strictEqual(juvayFeeCents(100000, 450), 2500);
  assert.strictEqual(juvayFeeCents(100000, 250), 2500);
  assert.strictEqual(juvayFeeCents(120000, 250), 2500);

  const cases = [
    // amountCents, plan, rail, expected
    { sub: 1200, plan: 'free', rail: 'wam_wallet',
      juvay: 54, wamSeller: 24, wamTotal: 24, buyerCard: 0, handling: 0,
      buyer: 1200, seller: 1122 },
    { sub: 1200, plan: 'free', rail: 'wam_card',
      juvay: 54, wamSeller: 36, wamTotal: 186, buyerCard: 150, handling: 0,
      buyer: 1350, seller: 1110 },
    { sub: 1200, plan: 'starter', rail: 'wam_wallet',
      juvay: 30, wamSeller: 24, wamTotal: 24, buyerCard: 0, handling: 0,
      buyer: 1200, seller: 1146 },
    { sub: 1200, plan: 'starter', rail: 'wam_card',
      juvay: 30, wamSeller: 36, wamTotal: 186, buyerCard: 150, handling: 0,
      buyer: 1350, seller: 1134 },

    { sub: 5000, plan: 'free', rail: 'wam_wallet',
      juvay: 225, wamSeller: 100, wamTotal: 100, buyerCard: 0, handling: 0,
      buyer: 5000, seller: 4675 },
    { sub: 5000, plan: 'free', rail: 'wam_card',
      juvay: 225, wamSeller: 150, wamTotal: 300, buyerCard: 150, handling: 0,
      buyer: 5150, seller: 4625 },
    { sub: 5000, plan: 'premium', rail: 'wam_wallet',
      juvay: 125, wamSeller: 100, wamTotal: 100, buyerCard: 0, handling: 0,
      buyer: 5000, seller: 4775 },
    { sub: 5000, plan: 'premium', rail: 'wam_card',
      juvay: 125, wamSeller: 150, wamTotal: 300, buyerCard: 150, handling: 0,
      buyer: 5150, seller: 4725 },

    { sub: 10000, plan: 'free', rail: 'wam_wallet',
      juvay: 450, wamSeller: 200, wamTotal: 200, buyerCard: 0, handling: 0,
      buyer: 10000, seller: 9350 },
    { sub: 10000, plan: 'free', rail: 'wam_card',
      juvay: 450, wamSeller: 300, wamTotal: 450, buyerCard: 150, handling: 0,
      buyer: 10150, seller: 9250 },
    { sub: 10000, plan: 'business', rail: 'wam_wallet',
      juvay: 250, wamSeller: 200, wamTotal: 200, buyerCard: 0, handling: 0,
      buyer: 10000, seller: 9550 },
    { sub: 10000, plan: 'business', rail: 'wam_card',
      juvay: 250, wamSeller: 300, wamTotal: 450, buyerCard: 150, handling: 0,
      buyer: 10150, seller: 9450 },

    { sub: 30000, plan: 'free', rail: 'wam_wallet',
      juvay: 1350, wamSeller: 600, wamTotal: 600, buyerCard: 0, handling: 0,
      buyer: 30000, seller: 28050 },
    { sub: 30000, plan: 'free', rail: 'wam_card',
      juvay: 1350, wamSeller: 900, wamTotal: 1050, buyerCard: 150, handling: 0,
      buyer: 30150, seller: 27750 },
    { sub: 30000, plan: 'starter', rail: 'wam_wallet',
      juvay: 750, wamSeller: 600, wamTotal: 600, buyerCard: 0, handling: 0,
      buyer: 30000, seller: 28650 },
    { sub: 30000, plan: 'starter', rail: 'wam_card',
      juvay: 750, wamSeller: 900, wamTotal: 1050, buyerCard: 150, handling: 0,
      buyer: 30150, seller: 28350 },

    // Cap hit — TT$1000 Free (uncapped 4500 → 2500)
    { sub: 100000, plan: 'free', rail: 'wam_wallet',
      juvay: 2500, wamSeller: 2000, wamTotal: 2000, buyerCard: 0, handling: 0,
      buyer: 100000, seller: 95500, cap: true },
    { sub: 100000, plan: 'free', rail: 'wam_card',
      juvay: 2500, wamSeller: 3000, wamTotal: 3150, buyerCard: 150, handling: 0,
      buyer: 100150, seller: 94500, cap: true },
    // Premium at TT$1000 is exactly the cap
    { sub: 100000, plan: 'premium', rail: 'wam_wallet',
      juvay: 2500, wamSeller: 2000, wamTotal: 2000, buyerCard: 0, handling: 0,
      buyer: 100000, seller: 95500, cap: false },
  ];

  for (const c of cases) {
    const q = quoteOrder({ subtotalCents: c.sub, planSlug: c.plan, rail: c.rail });
    const tag = `${c.plan} ${c.rail} ${c.sub}`;
    assert.strictEqual(q.juvay_fee_cents, c.juvay, `${tag} juvay`);
    assert.strictEqual(q.wam_fee_seller_cents, c.wamSeller, `${tag} wam seller`);
    assert.strictEqual(q.wam_fee_cents, c.wamTotal, `${tag} wam total`);
    assert.strictEqual(q.buyer_card_fee_cents, c.buyerCard, `${tag} buyer card`);
    assert.strictEqual(q.cod_handling_fee_cents, c.handling, `${tag} handling`);
    assert.strictEqual(q.total_buyer_pays_cents, c.buyer, `${tag} buyer pays`);
    assert.strictEqual(q.seller_net_cents, c.seller, `${tag} seller net`);
    assert.strictEqual(q.wam_rate_label, WAM_RATE_LABEL, `${tag} label`);
    if (c.cap) assert.strictEqual(q.juvay_fee_cap_applied, true, `${tag} cap`);
  }

  // Cash pickup and COD: zero Juvay commission, zero Wam fee
  for (const plan of ['free', 'starter']) {
    for (const rail of ['cash_pickup', 'cod']) {
      const q = quoteOrder({
        subtotalCents: 1200,
        planSlug: plan,
        rail,
        codHandlingFeeCents: 1000,
      });
      const tag = `${plan} ${rail}`;
      assert.strictEqual(q.juvay_fee_cents, 0, `${tag} juvay 0`);
      assert.strictEqual(q.wam_fee_cents, 0, `${tag} wam 0`);
      assert.strictEqual(q.wam_fee_seller_cents, 0, `${tag} wam seller 0`);
      assert.strictEqual(q.juvay_fee_bps, 0, `${tag} bps 0`);
      assert.strictEqual(q.seller_net_cents, 1200, `${tag} seller keeps subtotal`);
      assert.strictEqual(q.zero_commission, true, `${tag} zero commission`);
      if (rail === 'cash_pickup') {
        assert.strictEqual(q.cod_handling_fee_cents, 0);
        assert.strictEqual(q.total_buyer_pays_cents, 1200);
        assert.strictEqual(q.buyer_card_fee_cents, 0);
      } else {
        assert.strictEqual(q.cod_handling_fee_cents, 1000);
        assert.strictEqual(q.total_buyer_pays_cents, 2200);
      }
    }
  }

  // Juvay fee is on item subtotal only — delivery is not in the bps base
  const withDelivery = quoteOrder({
    subtotalCents: 10000,
    deliveryFeeCents: 2500,
    planSlug: 'free',
    rail: 'wam_wallet',
  });
  assert.strictEqual(withDelivery.juvay_fee_cents, 450, 'delivery not in juvay base');
  // Wam % is on subtotal+delivery (amount processed)
  assert.strictEqual(withDelivery.wam_pct_fee_cents, 250, 'wam % on face');
  assert.strictEqual(withDelivery.total_buyer_pays_cents, 12500);
  assert.strictEqual(withDelivery.seller_net_cents, 12500 - 450 - 250);

  // Card flat payer = seller
  const sellerPaysFlat = quoteOrder({
    subtotalCents: 1200,
    planSlug: 'free',
    rail: 'wam_card',
    config: { wamCardFlatPayer: 'seller' },
  });
  assert.strictEqual(sellerPaysFlat.buyer_card_fee_cents, 0);
  assert.strictEqual(sellerPaysFlat.total_buyer_pays_cents, 1200);
  assert.strictEqual(sellerPaysFlat.wam_fee_seller_cents, 36 + 150);
  assert.strictEqual(sellerPaysFlat.seller_net_cents, 1200 - 54 - 186);

  // Split: 75 / 75
  const split = quoteOrder({
    subtotalCents: 1200,
    planSlug: 'free',
    rail: 'wam_card',
    config: { wamCardFlatPayer: 'split' },
  });
  assert.strictEqual(split.buyer_card_fee_cents, 75);
  assert.strictEqual(split.wam_fee_seller_cents, 36 + 75);
  assert.strictEqual(split.total_buyer_pays_cents, 1275);
  assert.strictEqual(split.seller_net_cents, 1200 - 54 - 111);

  // quoteAllRails rail order
  const all = quoteAllRails({ subtotalCents: 1200, planSlug: 'free' });
  assert.deepStrictEqual(all.rail_order, ['wam_wallet', 'wam_card', 'cash_pickup', 'cod']);
  assert.strictEqual(all.quotes.wam_wallet.lowest_fee, true);
  assert.strictEqual(all.quotes.cash_pickup.juvay_fee_cents, 0);
  assert.ok(all.quotes.wam_card.nudge);
  assert.ok(all.quotes.wam_card.nudge.wallet.includes('Wam wallet'));
  assert.strictEqual(all.quotes.wam_card.nudge.add_item, 'add an item');
  // No nudge at TT$50
  const noNudge = cardFeeNudge(5000);
  assert.strictEqual(noNudge, null);
  const yesNudge = cardFeeNudge(1200);
  assert.ok(yesNudge.wallet.includes('TT$1.50'));

  // Env overrides
  process.env.JUVAY_FEE_BPS_PREMIUM = '200';
  process.env.JUVAY_FEE_CAP_CENTS = '1000';
  assert.strictEqual(feeBpsForPlan('starter'), 200);
  assert.strictEqual(juvayFeeCents(100000, 450), 1000);
  delete process.env.JUVAY_FEE_BPS_PREMIUM;
  delete process.env.JUVAY_FEE_CAP_CENTS;
  assert.strictEqual(feeBpsForPlan('starter'), 250);

  // Business days: Friday + 2 = Tuesday
  const friday = new Date('2026-11-13T14:00:00-04:00'); // Friday
  const tue = addBusinessDays(friday, 2);
  assert.strictEqual(tue.getDay(), 2, 'Fri + 2 business days is Tue');
  const walletAvail = wamAvailableAt('wam_wallet', friday);
  assert.strictEqual(walletAvail.getTime(), friday.getTime());
  const cardAvail = wamAvailableAt('wam_card', friday);
  assert.strictEqual(cardAvail.getDay(), 2);

  // Ledger pending vs available
  const now = new Date('2026-11-12T12:00:00Z');
  const summary = summarizeSellerLedger([
    { entry_type: 'merchant_net', direction: 'credit', amount_cents: 1122, available_at: '2026-11-12T11:00:00Z' },
    { entry_type: 'merchant_net', direction: 'credit', amount_cents: 9250, available_at: '2026-11-16T12:00:00Z' },
    { entry_type: 'juvay_fee', direction: 'debit', amount_cents: 54, available_at: '2026-11-12T11:00:00Z' },
    { entry_type: 'refund_merchant_net', direction: 'debit', amount_cents: 200, available_at: '2026-11-12T11:00:00Z' },
  ], now);
  assert.strictEqual(summary.available_net_cents, 1122 - 200);
  assert.strictEqual(summary.pending_net_cents, 9250);

  const card = publicRateCard();
  assert.strictEqual(card.juvay_fee_bps_free, 450);
  assert.strictEqual(card.juvay_fee_bps_premium, 250);
  assert.strictEqual(card.juvay_fee_cap_cents, 2500);
  assert.strictEqual(card.cash_commission_bps, 0);
  assert.strictEqual(card.ads_enabled, false);
  assert.strictEqual(card.premium_pricing, 'Premium pricing coming soon');
  assert.strictEqual(card.wam.label, WAM_RATE_LABEL);
  assert.strictEqual(card.notice_days_before_change, 30);
  assert.strictEqual(card.discounts_opt_in_only, true);
  assert.strictEqual(card.ads_optional, true);

  assert.strictEqual(normalizeRail('wallet'), 'wam_wallet');
  assert.strictEqual(isRefundEvent({ type: 'payment.refunded' }), true);
  assert.strictEqual(isRefundEvent({ status: 'captured' }), false);

  // feeConfig ads default off
  assert.strictEqual(feeConfig().adsEnabled, false);
  assert.strictEqual(feeConfig().wamCardFlatPayer, 'buyer');

  console.log('juvayFees.test.js ok');
} finally {
  for (const k of FEE_ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
}
