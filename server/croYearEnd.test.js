'use strict';
const assert = require('assert');
const {
  isPremiumCheckoutEnabled,
  premiumPayload,
  PREMIUM_OFFER,
  phonesMatch,
  maskPhone,
  vendorOrderWaMe,
  customerOrderWaMe,
  validateReviewInput,
  orderAllowsReview,
  publicReviewList,
  publicOrderShape,
  firstSaleChecklist,
} = require('./croYearEnd');

// Premium flag defaults OFF, even if the string is empty or "false".
{
  assert.strictEqual(isPremiumCheckoutEnabled({}), false);
  assert.strictEqual(isPremiumCheckoutEnabled({ PREMIUM_CHECKOUT_ENABLED: 'false' }), false);
  assert.strictEqual(isPremiumCheckoutEnabled({ PREMIUM_CHECKOUT_ENABLED: '0' }), false);
  assert.strictEqual(isPremiumCheckoutEnabled({ PREMIUM_CHECKOUT_ENABLED: 'TRUE' }), true);
  assert.strictEqual(isPremiumCheckoutEnabled({ PREMIUM_CHECKOUT_ENABLED: 'true' }), true);
  const off = premiumPayload({ PREMIUM_CHECKOUT_ENABLED: 'false' });
  assert.strictEqual(off.checkout_enabled, false);
  assert.strictEqual(off.buy_button, false);
  assert.strictEqual(off.offer.intro_price_ttd, 49);
  assert.strictEqual(off.offer.then_price_ttd, 79);
  assert.strictEqual(off.offer.intro_months, 3);
  assert.strictEqual(off.offer.juvay_fee_bps, 250);
  assert.ok(/not open yet/.test(off.message));
  assert.strictEqual(PREMIUM_OFFER.id, 'premium');
}

// Phone match: +1868 and 868, last-4 mask.
{
  assert.strictEqual(phonesMatch('+1 868 555 1234', '18685551234'), true);
  assert.strictEqual(phonesMatch('8685551234', '5551234'), false); // too short on one side if not equal - 5551234 is 7 digits, last 10 of first is 8685551234. Not equal.
  assert.strictEqual(phonesMatch('+18685551234', '5550000'), false);
  assert.strictEqual(maskPhone('+18685551234'), '••••1234');
  assert.strictEqual(maskPhone('12'), '');
}

// wa.me drafts — only with a real E.164, never invented.
{
  const wa = vendorOrderWaMe({
    vendor_e164: '+18685551234',
    order_ref: 'JVTEST',
    store_name: 'Maya Doubles',
    items: [{ name: 'Doubles', qty: 2, selected_modifiers: [{ optionLabel: 'Slight pepper' }] }],
    total_cents: 4000,
    fulfillment: 'pickup',
    buyer_name: 'Ana',
  });
  assert.ok(wa.startsWith('https://wa.me/18685551234?text='));
  const text = decodeURIComponent(wa.split('text=')[1]);
  assert.ok(/JVTEST/.test(text));
  assert.ok(/Doubles ×2/.test(text));
  assert.ok(/Slight pepper/.test(text));
  assert.ok(/does not send WhatsApp/.test(text));
  assert.strictEqual(vendorOrderWaMe({ vendor_e164: 'not-a-number', order_ref: 'X' }), null);
  const cu = customerOrderWaMe({
    vendor_e164: '+18685551234',
    order_ref: 'JVTEST',
    store_name: 'Maya Doubles',
    items: [{ name: 'Doubles', qty: 1 }],
  });
  assert.ok(cu.includes('wa.me/18685551234'));
}

// Review validation.
{
  const bad = validateReviewInput({ order_ref: 'JV1', buyer_phone: '8685551234', rating: 6 });
  assert.ok(bad.error);
  const missing = validateReviewInput({ rating: 5, buyer_phone: '8685551234' });
  assert.ok(/order_ref/.test(missing.error));
  const noPhone = validateReviewInput({ order_ref: 'JV1', rating: 5 });
  assert.ok(/phone/.test(noPhone.error));
  const half = validateReviewInput({ order_ref: 'JV1', buyer_phone: '868', rating: 4.5 });
  assert.ok(half.error);
  const ok = validateReviewInput({ order_ref: 'JV1', buyer_phone: '8685551234', rating: 5, body: 'Nice' });
  assert.strictEqual(ok.review.rating, 5);
  assert.strictEqual(ok.review.body, 'Nice');
}

// Reviews only on completed orders.
{
  assert.strictEqual(orderAllowsReview({ status: 'pending' }).ok, false);
  assert.strictEqual(orderAllowsReview({ status: 'awaiting_payment' }).ok, false);
  assert.strictEqual(orderAllowsReview({ status: 'delivered' }).ok, true);
  assert.strictEqual(orderAllowsReview({ status: 'confirmed', payment_status: 'collected' }).ok, true);
  assert.strictEqual(orderAllowsReview({ status: 'delivered', review_id: 'r1' }).ok, false);
}

// Public review list: 0 → No reviews yet, average null, no stars. Never 5.0.
{
  const empty = publicReviewList([]);
  assert.strictEqual(empty.count, 0);
  assert.strictEqual(empty.average, null);
  assert.strictEqual(empty.empty_copy, 'No reviews yet');
  assert.strictEqual(empty.show_stars, false);
  const some = publicReviewList([
    { id: 'a', rating: 5, body: 'Good', created_at: '2026-11-01', published: true, buyer_phone: '+18685550000' },
    { id: 'b', rating: 3, body: 'Ok', created_at: '2026-11-02', published: true },
  ]);
  assert.strictEqual(some.count, 2);
  assert.strictEqual(some.average, 4);
  assert.strictEqual(some.show_stars, true);
  assert.ok(!('buyer_phone' in some.reviews[0]));
}

// Public order shape masks phone, never claims fulfill.
{
  const o = publicOrderShape({
    id: 'o1',
    order_ref: 'JV1',
    store_id: 's1',
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'cash_pickup',
    fulfillment: 'pickup',
    items: [{ name: 'Doubles', qty: 1 }],
    total_cents: 1200,
    buyer_name: 'Ana',
    buyer_phone: '+18685551234',
    created_at: '2026-11-12T12:00:00Z',
  }, { store_name: 'Maya', store_slug: 'maya', whatsapp: '+18685550000' });
  assert.strictEqual(o.buyer_phone_masked, '••••1234');
  assert.ok(!('buyer_phone' in o));
  assert.strictEqual(o.fulfill, false);
  assert.strictEqual(o.can_review, false);
  assert.ok(o.customer_whatsapp.includes('wa.me/18685550000'));
}

// First-sale checklist is honest: empty store is not complete.
{
  const empty = firstSaleChecklist({ products: [] });
  assert.strictEqual(empty.ready_for_orders, false);
  assert.strictEqual(empty.steps.find((s) => s.id === 'photo').done, false);
  assert.strictEqual(empty.steps.find((s) => s.id === 'price').done, false);
  assert.strictEqual(empty.steps.find((s) => s.id === 'share').done, false);
  const ready = firstSaleChecklist({
    products: [{ name: 'Doubles', price: 12, image_url: 'https://x/y.jpg' }],
  });
  assert.strictEqual(ready.ready_for_orders, true);
  assert.strictEqual(ready.steps.find((s) => s.id === 'photo').done, true);
  assert.strictEqual(ready.steps.find((s) => s.id === 'price').done, true);
  // Share and QR stay undone unless we know.
  assert.strictEqual(ready.steps.find((s) => s.id === 'share').done, false);
  assert.strictEqual(ready.complete, false);
  const zeroPrice = firstSaleChecklist({ products: [{ name: 'Doubles', price: 0 }] });
  assert.strictEqual(zeroPrice.steps.find((s) => s.id === 'price').done, false);
}

console.log('croYearEnd.test.js: all assertions passed');
