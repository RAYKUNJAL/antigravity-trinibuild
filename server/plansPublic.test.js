/**
 * /api/plans must list only Free and Premium, matching PRICING-FINAL /
 * services/juvayPlans.ts. Stale DB rows and retired features stay out.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  CANONICAL_PLANS,
  listedPublicPlans,
  normalizeSellerPlan,
  JUVAY_FEE_BPS_FREE,
  JUVAY_FEE_BPS_PREMIUM,
  FEE_CAP_CENTS,
  PREMIUM_PRICE_HEADLINE,
  PREMIUM_INTRO_PRICE_TTD,
  PREMIUM_THEN_PRICE_TTD,
  BANNED_PLAN_FEATURES,
} = require('./plansPublic');

assert.strictEqual(CANONICAL_PLANS.length, 2);
assert.deepStrictEqual(CANONICAL_PLANS.map((p) => p.slug), ['free', 'premium']);
assert.ok(!CANONICAL_PLANS.some((p) => /pro|starter|business/i.test(p.slug) && p.slug !== 'premium'));

const free = CANONICAL_PLANS[0];
assert.strictEqual(free.name, 'Free');
assert.strictEqual(Number(free.price_ttd), 0);
assert.strictEqual(free.juvay_fee_bps, 450);
assert.strictEqual(JUVAY_FEE_BPS_FREE, 450);
assert.strictEqual(free.fee_cap_cents, 2500);
assert.strictEqual(FEE_CAP_CENTS, 2500);
assert.ok(free.features.includes('Wam online checkout at 4.5% fee (capped TT$25/order)'));
assert.ok(free.features.includes('0% on cash/COD'));

const premium = CANONICAL_PLANS[1];
assert.strictEqual(premium.name, 'Premium');
assert.strictEqual(Number(premium.intro_price_ttd), PREMIUM_INTRO_PRICE_TTD);
assert.strictEqual(Number(premium.then_price_ttd), PREMIUM_THEN_PRICE_TTD);
assert.strictEqual(Number(premium.price_ttd), 79);
assert.strictEqual(premium.juvay_fee_bps, 250);
assert.strictEqual(JUVAY_FEE_BPS_PREMIUM, 250);
assert.strictEqual(premium.fee_cap_cents, 2500);
assert.strictEqual(premium.price_headline, PREMIUM_PRICE_HEADLINE);
assert.ok(PREMIUM_PRICE_HEADLINE.includes('TT$49') && PREMIUM_PRICE_HEADLINE.includes('TT$79'));
assert.ok(premium.features.some((f) => /2\.5%/.test(f)));

for (const plan of CANONICAL_PLANS) {
  const blob = JSON.stringify(plan.features);
  for (const re of BANNED_PLAN_FEATURES) {
    assert.ok(!re.test(blob), `${plan.slug} must not list ${re}`);
  }
  assert.ok(!/TT\$199|TT\$399|TT\$99|TT\$329/.test(JSON.stringify(plan)));
}

// Stale plan_tiers (live leftover Free/Pro 199/Premium 399 + retired features)
// must not appear in the public list.
const staleRows = [
  { slug: 'free', name: 'Free for Life', price_ttd: 0, juvay_fee_bps: 0, features: ['Unlimited listings'] },
  {
    slug: 'pro',
    name: 'Pro',
    price_ttd: 199,
    juvay_fee_bps: 300,
    features: ['Custom domain', 'API access'],
  },
  {
    slug: 'premium',
    name: 'Premium',
    price_ttd: 399,
    juvay_fee_bps: 300,
    features: ['Everything in Pro', '10 stores', 'Custom domain', 'API access', 'White-label option'],
  },
];
const listed = listedPublicPlans(staleRows);
assert.strictEqual(listed.length, 2);
assert.deepStrictEqual(listed.map((p) => p.slug), ['free', 'premium']);
assert.ok(!listed.some((p) => p.slug === 'pro' || Number(p.price_ttd) === 199 || Number(p.price_ttd) === 399));
assert.strictEqual(listed[0].juvay_fee_bps, 450);
assert.strictEqual(listed[1].juvay_fee_bps, 250);
assert.strictEqual(listed[1].fee_cap_cents, 2500);
const listedBlob = JSON.stringify(listed);
assert.ok(!/Custom domain|API access|White-label|TT\$199|TT\$399/.test(listedBlob));
assert.ok(listed[1].price_headline.includes('TT$49') && listed[1].price_headline.includes('TT$79'));

// Legacy slugs map internally to Premium, but are not listed.
assert.strictEqual(normalizeSellerPlan('pro'), 'premium');
assert.strictEqual(normalizeSellerPlan('starter'), 'premium');
assert.strictEqual(normalizeSellerPlan('business'), 'premium');
assert.strictEqual(normalizeSellerPlan('premium'), 'premium');
assert.strictEqual(normalizeSellerPlan('free'), 'free');

// Route in server/index.js must use listedPublicPlans, not raw plan_tiers.
const indexSrc = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
assert.ok(indexSrc.includes("require('./plansPublic')"), 'server/index.js must load plansPublic');
assert.ok(/listedPublicPlans\(/.test(indexSrc), 'GET /api/plans must call listedPublicPlans');
assert.ok(
  !/app\.get\('\/api\/plans'[\s\S]{0,200}res\.json\(rows\)/.test(indexSrc),
  'GET /api/plans must not return raw plan_tiers rows',
);

// Seller-benefit honesty: no invented earnings or free-driver program.
const root = path.join(__dirname, '..');
const pages = ['pages/CROSignupFlow.tsx', 'pages/CROSignupFlowFixed.tsx', 'pages/SmartOnboarding.tsx'];
for (const p of pages) {
  const src = fs.readFileSync(path.join(root, p), 'utf8');
  assert.ok(!/Earn TT\$10K\+\/month/.test(src), `${p} must not promise Earn TT$10K+/month`);
  assert.ok(!/Get free delivery drivers/i.test(src), `${p} must not promise free delivery drivers`);
  assert.ok(!/Get delivery drivers/i.test(src), `${p} must not promise delivery drivers`);
  assert.ok(!/TT\$500\+\/week/.test(src), `${p} must not invent weekly driver earnings`);
}

console.log('plansPublic.test.js: PASS');
