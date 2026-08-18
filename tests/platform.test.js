// tests/platform.test.js — commercial platform test suite
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
process.env.DB_FILE = path.join(os.tmpdir(), 'catn-test-' + Date.now() + '.json');

const store = require('../src/store');
const domain = require('../src/domain');
const trade = require('../src/services/trade');
const concierge = require('../src/services/concierge');

function seedOne() {
  store.reset();
  const src = store.addSource({ name: 's', url: 'u', tier: 3, owner: 'o' });
  const biz = store.addBusiness({ source_id: src.id, name: 'Test Exports', country: 'Jamaica', city: 'Kingston', category: 'food_beverage', website: 'https://x', address: 'Kingston' });
  return { src, biz };
}
function makeSupplier() {
  const u = store.createUser({ email: 'sup@x.com', name: 'Supplier', org_name: 'Sup Co' });
  return u; // returns {id, email, org_id,...}
}

test('users get a free plan and an organization on signup', () => {
  store.reset();
  const u = store.createUser({ email: 'ray@x.com', name: 'Ray', org_name: 'R&R' });
  assert.ok(u.org_id);
  const sub = store.getSubscription(u.org_id);
  assert.equal(sub.plan_slug, 'free');
  assert.equal(domain.planBySlug('free').price_usd, 0);
});

test('full vertical slice: discover -> claim -> verify -> product -> RFQ', () => {
  const { biz } = seedOne();
  assert.equal(biz.state, 'UNCLAIMED_PUBLIC_PROFILE');
  assert.ok(store.publicBusiness(biz).disclaimer);
  assert.equal(store.publicBusiness(biz).can_publish_products, false);

  const sup = makeSupplier();
  const claim = store.claimBusiness(biz.id, sup.id, sup.org_id);
  assert.equal(claim.business.state, 'CLAIM_PENDING');
  store.approveClaim(biz.id);
  assert.equal(store.publicBusiness(biz).state, 'CLAIMED');

  store.submitEvidence(biz.id, sup.id, 'legal_identity', 'reg');
  store.submitEvidence(biz.id, sup.id, 'representative_authority', 'auth');
  store.approveEvidence(biz.id, 'legal_identity');
  store.approveEvidence(biz.id, 'representative_authority');
  assert.equal(store.publicBusiness(biz).state, 'IDENTITY_VERIFIED');
  store.submitEvidence(biz.id, sup.id, 'export_capacity', 'cap');
  store.approveEvidence(biz.id, 'export_capacity');
  assert.equal(store.publicBusiness(biz).state, 'TRADE_VERIFIED');

  const prod = store.addProduct(biz.id, sup.org_id, sup.id, { title: 'Premium Coffee', hs_candidate: '0901', price_usd: 25, moq: 10 });
  assert.equal(prod.ok, true);
  assert.equal(store.listProducts(biz.id).length, 1);

  const rfq = store.createRfq({ buyer_email: 'buyer@x.com', product: 'Premium Coffee', quantity: 50, destination_country: 'US' });
  assert.equal(rfq.status, 'open');
  assert.ok(store.listActivity().some(a => a.action === 'product_published'));
});

test('unclaimed business cannot publish products (owner, but unverified)', () => {
  const { biz } = seedOne();
  const sup = makeSupplier();
  store.claimBusiness(biz.id, sup.id, sup.org_id);
  store.approveClaim(biz.id);
  // owner but still CLAIMED -> not verified -> cannot publish
  const out = store.addProduct(biz.id, sup.org_id, sup.id, { title: 'P' });
  assert.equal(out.ok, false);
  assert.equal(out.error, 'requires_verification');
});

test('free plan cannot submit a quote (paid upgrade required)', () => {
  const { biz } = seedOne();
  const sup = makeSupplier();
  store.claimBusiness(biz.id, sup.id, sup.org_id);
  store.approveClaim(biz.id);
  ['legal_identity','representative_authority','export_capacity'].forEach(d => { store.submitEvidence(biz.id, sup.id, d, 'x'); store.approveEvidence(biz.id, d); });
  assert.equal(store.publicBusiness(biz).state, 'TRADE_VERIFIED');
  const rfq = store.createRfq({ buyer_email: 'b@x.com', product: 'Cocoa', quantity: 10 });
  const q = store.submitQuote(rfq.id, sup.org_id, biz.id, { price_usd: 50 });
  assert.equal(q.ok, false);
  assert.equal(q.error, 'plan_requires_upgrade');
});

test('pro plan can quote', () => {
  const { biz } = seedOne();
  const sup = makeSupplier();
  store.setPlan(sup.org_id, 'pro', 'admin');
  // need a verified business to quote; verify it
  store.claimBusiness(biz.id, sup.id, sup.org_id);
  store.approveClaim(biz.id);
  ['legal_identity','representative_authority','export_capacity'].forEach(d => { store.submitEvidence(biz.id, sup.id, d, 'x'); store.approveEvidence(biz.id, d); });
  assert.equal(store.publicBusiness(biz).state, 'TRADE_VERIFIED');
  const rfq = store.createRfq({ buyer_email: 'b@x.com', product: 'Cocoa', quantity: 10 });
  const q = store.submitQuote(rfq.id, sup.org_id, biz.id, { price_usd: 50 });
  assert.equal(q.ok, true);
  assert.equal(q.quote.price_usd, 50);
});

test('order + payment lifecycle', () => {
  store.reset();
  const buyer = store.createUser({ email: 'buyer@x.com', name: 'Buyer', org_name: 'BuyerCo', role: 'buyer' });
  const order = store.createOrder({ buyer_org_id: buyer.org_id, supplier_org_id: 'org-sup', product: 'Cocoa', quantity: 10, price_usd: 100 });
  assert.equal(order.status, 'created');
  const pi = store.createPaymentIntent({ order_id: order.id, buyer_org_id: buyer.org_id, amount: 100, currency: 'USD', method: 'card' });
  assert.equal(pi.status, 'CREATED');
  store.markPayment(pi.id, 'PAID', { ref: 'x' });
  assert.equal(store.listPayments(buyer.org_id).length, 1);
  assert.ok(store.listOrders(buyer.org_id).length >= 1);
});

test('landed cost is deterministic and sums all components', () => {
  const lc = trade.landedCost({ product_value: 100, freight: 20, insurance: 5, brokerage: 15, destination_port_charges: 10 });
  assert.equal(lc.total, 150);
  assert.equal(lc.currency, 'USD');
  assert.ok(lc.assumptions);
});

test('concierge is grounded and never invents shipping schedules', () => {
  const a = concierge.answerQuestion('How long does shipping from Jamaica to US take?', {});
  assert.ok(a.risk_class === 'medium' || a.escalation_reason);
  // it should NOT provide a fabricated transit time
  assert.ok(!/\b\d+\s*(days|weeks)\b/.test(a.response_text) || a.escalation_reason);
});

test('concierge finds suppliers and returns an answer contract', () => {
  const { biz } = seedOne();
  const a = concierge.answerQuestion('Find coffee suppliers in Jamaica', { destination: 'US' });
  assert.ok(a.response_text.length > 0);
  assert.ok(Array.isArray(a.sources));
  assert.ok('confidence' in a);
  assert.ok('requires_confirmation' in a);
});

test('external buyer gets international payment rails', () => {
  const rails = trade.availableRails({ payer_territory: 'US', buyer_is_external: true });
  assert.ok(rails.some(r => r.method === 'card' || r.method === 'paypal' || r.method === 'wire'));
});

test('cannot claim an already-claimed business', () => {
  const { biz } = seedOne();
  const a = store.createUser({ email: 'a@a.com', name: 'A' });
  const b = store.createUser({ email: 'b@b.com', name: 'B' });
  assert.equal(store.claimBusiness(biz.id, a.id, a.org_id).ok, true);
  assert.equal(store.claimBusiness(biz.id, b.id, b.org_id).ok, false);
});
