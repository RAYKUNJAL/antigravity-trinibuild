'use strict';

const assert = require('assert');
const {
  createTracking,
  createMemoryStore,
  trackingPaidGate,
  trackingPlanTiers,
  trackingRequirePaid,
  etaApproxFallback,
  serverMapsKey,
  lockedCopy,
  planDisplayNames,
  locationView,
  haversineKm,
  validLatLng,
  isAbsurdJump,
  isValidTimestamp,
  approxEtaForPath,
  remainingPath,
  stopsAway,
  canDrive,
  googleRoutesEta,
  LOCKED_FALLBACK_COPY,
  DEFAULTS,
} = require('./deliveryTracking');


function ok(result, msg) {
  assert.ok(!result.error, msg || result.error);
  return result;
}

async function main() {
// ── paid gate ──────────────────────────────────────────────
assert.deepStrictEqual(trackingPlanTiers({}), ['premium', 'pro', 'starter', 'business']);
assert.deepStrictEqual(trackingPlanTiers({ TRACKING_PLAN_TIERS: 'premium' }), ['premium']);
assert.deepStrictEqual(trackingPlanTiers({ TRACKING_PLAN_TIERS: ' Premium , Pro ' }), ['premium', 'pro']);
assert.strictEqual(trackingRequirePaid({}), true);
assert.strictEqual(trackingRequirePaid({ TRACKING_REQUIRE_PAID: 'false' }), false);
assert.strictEqual(etaApproxFallback({}), false);
assert.strictEqual(etaApproxFallback({ ETA_APPROX_FALLBACK: 'true' }), true);

assert.strictEqual(serverMapsKey({}), '');
assert.strictEqual(serverMapsKey({ GOOGLE_MAPS_SERVER_KEY: 'server-key-value' }), 'server-key-value');
assert.strictEqual(
  serverMapsKey({ VITE_GOOGLE_MAPS_API_KEY: 'AIzaSyBrowserKeyValue' }),
  'AIzaSyBrowserKeyValue',
);
assert.strictEqual(
  serverMapsKey({ GOOGLE_MAPS_SERVER_KEY: 'server-pref', VITE_GOOGLE_MAPS_API_KEY: 'AIzaSyBrowser' }),
  'server-pref',
);
assert.strictEqual(serverMapsKey({ VITE_GOOGLE_MAPS_API_KEY: 'AIzaSy...gbM4' }), '');

assert.strictEqual(lockedCopy([]), LOCKED_FALLBACK_COPY);
assert.strictEqual(lockedCopy(['Premium']), LOCKED_FALLBACK_COPY);
assert.strictEqual(lockedCopy(['Premium', 'Pro']), LOCKED_FALLBACK_COPY);
assert.ok(!lockedCopy(['Premium']).includes('TT$'));
assert.ok(LOCKED_FALLBACK_COPY.includes('Juvay Premium'));
assert.ok(!LOCKED_FALLBACK_COPY.includes('TT$'));

const fromService = planDisplayNames([{ slug: 'premium', name: 'Juvay Premium' }, { slug: 'free', name: 'Free' }], { TRACKING_PLAN_TIERS: 'premium,pro' });
assert.deepStrictEqual(fromService, ['Juvay Premium']);

const freeGate = trackingPaidGate({ planTier: 'free' }, {});
assert.strictEqual(freeGate.allowed, false);
assert.strictEqual(freeGate.locked, true);
assert.strictEqual(freeGate.message, LOCKED_FALLBACK_COPY);

const premiumGate = trackingPaidGate({ planTier: 'premium' }, {});
assert.strictEqual(premiumGate.allowed, true);
assert.strictEqual(premiumGate.reason, 'plan');

const proGate = trackingPaidGate({ planTier: 'pro' }, {});
assert.strictEqual(proGate.allowed, true);

const proOff = trackingPaidGate({ planTier: 'pro' }, { TRACKING_PLAN_TIERS: 'premium' });
assert.strictEqual(proOff.allowed, false);

const addonOnFree = trackingPaidGate({ planTier: 'free', trackingAddon: true, trackingExtraVehicles: 2 }, { TRACKING_PLAN_TIERS: 'premium' });
assert.strictEqual(addonOnFree.allowed, false);

const starterGate = trackingPaidGate({ planTier: 'starter' }, {});
assert.strictEqual(starterGate.allowed, true);
const businessGate = trackingPaidGate({ planTier: 'business' }, {});
assert.strictEqual(businessGate.allowed, true);
assert.strictEqual(trackingPaidGate({ planTier: 'premium' }, {}).maxVehicles, 1);
assert.strictEqual(trackingPaidGate({ planTier: 'premium', trackingExtraVehicles: 2 }, {}).maxVehicles, 3);

const namedGate = trackingPaidGate(
  { planTier: 'free', plans: [{ slug: 'premium', name: 'Juvay Premium' }] },
  { TRACKING_PLAN_TIERS: 'premium,pro' },
);
assert.strictEqual(namedGate.allowed, false);
assert.strictEqual(namedGate.message, LOCKED_FALLBACK_COPY);
assert.ok(!namedGate.message.includes('49'));
assert.ok(!namedGate.message.includes('TT$'));
assert.ok(!namedGate.message.includes('79'));
// Structured price fields are read from juvayPlans.ts, not hard-coded in copy.
const fromPlans = require('./deliveryTracking').loadJuvayPlanPrices();
if (fromPlans.introPriceTtd != null) assert.strictEqual(namedGate.premiumIntroPriceTtd, fromPlans.introPriceTtd);
if (fromPlans.thenPriceTtd != null) assert.strictEqual(namedGate.premiumThenPriceTtd, fromPlans.thenPriceTtd);
if (fromPlans.extraVehiclePriceTtd != null) assert.strictEqual(namedGate.extraVehiclePriceTtd, fromPlans.extraVehiclePriceTtd);

const gateOff = trackingPaidGate({ planTier: 'free' }, { TRACKING_REQUIRE_PAID: 'false' });
assert.strictEqual(gateOff.allowed, true);

// ── staleness ──────────────────────────────────────────────
const now = 1_700_000_000_000;
const routeActive = { status: 'active' };
const live = locationView(routeActive, { lat: 10.6, lng: -61.5, recordedAt: now - 30_000 }, now);
assert.strictEqual(live.state, 'live');
assert.ok(live.pin);
assert.strictEqual(live.pin.lat, 10.6);

const lastSeen = locationView(routeActive, { lat: 10.6, lng: -61.5, recordedAt: now - 3 * 60 * 1000 }, now);
assert.strictEqual(lastSeen.state, 'last_seen');
assert.strictEqual(lastSeen.pin, null);
assert.strictEqual(lastSeen.lastSeenAgoMinutes, 3);
assert.ok(lastSeen.message.includes('3 min'));
assert.strictEqual(lastSeen.hiddenBecauseStale, false);

const staleHidden = locationView(routeActive, { lat: 10.6, lng: -61.5, recordedAt: now - 11 * 60 * 1000 }, now);
assert.strictEqual(staleHidden.state, 'last_seen');
assert.strictEqual(staleHidden.pin, null);
assert.strictEqual(staleHidden.hiddenBecauseStale, true);

const noShare = locationView(routeActive, null, now);
assert.strictEqual(noShare.state, 'not_sharing');
assert.strictEqual(noShare.pin, null);

const ended = locationView({ status: 'ended', endedAt: now }, { lat: 10.6, lng: -61.5, recordedAt: now }, now);
assert.strictEqual(ended.state, 'ended');
assert.strictEqual(ended.pin, null);

const planned = locationView({ status: 'planned' }, { lat: 10.6, lng: -61.5, recordedAt: now }, now);
assert.strictEqual(planned.state, 'not_sharing');

// ── coordinates & jumps ────────────────────────────────────
assert.strictEqual(validLatLng({ lat: 10.6, lng: -61.5 }), true);
assert.strictEqual(validLatLng({ lat: 18.0, lng: -77.0 }), true); // Jamaica — not restricted to T&T
assert.strictEqual(validLatLng({ lat: 91, lng: 0 }), false);
assert.strictEqual(validLatLng({ lat: 0, lng: -200 }), false);
assert.ok(haversineKm({ lat: 10.6, lng: -61.5 }, { lat: 10.7, lng: -61.5 }) > 10);
assert.ok(haversineKm({ lat: 10.6, lng: -61.5 }, { lat: 10.7, lng: -61.5 }) < 15);

assert.strictEqual(isAbsurdJump(
  { lat: 10.6, lng: -61.5, at: now },
  { lat: 10.601, lng: -61.5, at: now + 8000 },
  { maxSpeedKmh: 200 },
), false);
assert.strictEqual(isAbsurdJump(
  { lat: 10.6, lng: -61.5, at: now },
  { lat: 18.0, lng: -77.0, at: now + 8000 },
  { maxSpeedKmh: 200 },
), true);

assert.strictEqual(isValidTimestamp(now, now, DEFAULTS).ok, true);
assert.strictEqual(isValidTimestamp(now + 120_000, now, DEFAULTS).ok, false);
assert.strictEqual(isValidTimestamp(now - 10 * 60 * 1000, now, DEFAULTS).ok, false);

// ── ETA approx ─────────────────────────────────────────────
const eta = approxEtaForPath(
  [{ lat: 10.6, lng: -61.5 }, { lat: 10.7, lng: -61.5 }],
  { assumedSpeedKmh: 30, roadFactor: 1.4 },
);
assert.ok(eta);
assert.strictEqual(eta.etaLabel, 'approx');
assert.strictEqual(eta.etaSource, 'approx');
assert.ok(eta.etaMinutes >= 1);
assert.ok(eta.note.includes('30 km/h'));

// ── helpers: path, stopsAway, canDrive ─────────────────────
const stops = [
  { id: 'a', sequence: 1, status: 'delivered', lat: 10.5, lng: -61.5 },
  { id: 'b', sequence: 2, status: 'next', lat: 10.6, lng: -61.5 },
  { id: 'c', sequence: 3, status: 'pending', lat: 10.7, lng: -61.5 },
];
assert.strictEqual(stopsAway(stops, stops[2]), 1);
assert.strictEqual(stopsAway(stops, stops[1]), 0);
const path = remainingPath({ lat: 10.55, lng: -61.5 }, stops, stops[2]);
assert.strictEqual(path.length, 3); // current + b + c (a delivered)
assert.strictEqual(canDrive({ driverUserId: 'd1', sellerUserId: 's1' }, { id: 'd1' }), true);
assert.strictEqual(canDrive({ driverUserId: 'd1', sellerUserId: 's1' }, { id: 's1' }), true);
assert.strictEqual(canDrive({ driverUserId: 'd1', sellerUserId: 's1' }, { id: 'other' }), false);
assert.strictEqual(canDrive({ driverUserId: 'd1' }, null), false);

// ── integration: create / start / locate / track / end ─────
const BASE_PAID = { planTier: 'premium', plans: [{ slug: 'premium', name: 'Juvay Premium' }] };
const PAID = { ...BASE_PAID, trackingExtraVehicles: 20 };
let t = now;
const api = createTracking({
  store: createMemoryStore(),
  env: { TRACKING_REQUIRE_PAID: 'true' },
  now: () => t,
  alerter: { emit() {} },
  log() {},
});

const seller = { id: 'seller-1' };
const driver = { id: 'driver-1' };
const stranger = { id: 'stranger' };

const locked = await (api.createRoute(seller, { kind: 'route', driverUserId: 'driver-1', stops: [{ label: 'A', lat: 10.5, lng: -61.5 }] }, { planTier: 'free' }));
assert.strictEqual(locked.status, 403);
assert.strictEqual(locked.locked, true);
assert.ok(locked.message.includes('paid Juvay plan') || locked.message.includes('Juvay Premium') || locked.error);

const made = ok(await (api.createRoute(seller, {
  kind: 'route',
  driverUserId: 'driver-1',
  storeId: 'store-1',
  providerLabel: 'Provider',
  stops: [
    { orderRef: 'ord-a', label: 'Stop A', lat: 13.1, lng: -59.6 }, // Barbados, not T&T
    { orderRef: 'ord-b', label: 'Stop B', lat: 13.15, lng: -59.62 },
    { orderRef: 'ord-c', label: 'Stop C', lat: 13.2, lng: -59.64 },
  ],
}, PAID)));
assert.strictEqual(made.route.kind, 'route');
assert.strictEqual(made.route.status, 'planned');
assert.strictEqual(made.route.stops.length, 3);
const tokenA = made.route.stops[0].shareToken;
const tokenB = made.route.stops[1].shareToken;
const tokenC = made.route.stops[2].shareToken;
assert.ok(tokenA.length >= 24);
assert.ok(tokenA !== tokenB);
assert.ok(made.route.stops[0].trackPath.startsWith('/track/'));

const visitBad = await (api.createRoute(seller, { kind: 'visit', driverUserId: 'driver-1', stops: [{ label: 'x' }, { label: 'y' }] }, PAID));
assert.strictEqual(visitBad.status, 400);

const delivery = ok(await (api.createRoute(seller, {
  kind: 'delivery',
  driverUserId: 'driver-1',
  stops: [
    { label: 'Pickup', lat: 18.0, lng: -76.8, role: 'pickup' },
    { label: 'Dropoff', lat: 18.05, lng: -76.79, role: 'dropoff' },
  ],
}, PAID)));
assert.strictEqual(delivery.route.kind, 'delivery');
assert.strictEqual(delivery.route.stops[0].role, 'pickup');
assert.strictEqual(delivery.route.stops[1].role, 'dropoff');

const visit = ok(await (api.createRoute(seller, {
  kind: 'visit',
  driverUserId: 'driver-1',
  stops: [{ label: 'Customer address', lat: 18.47, lng: -66.11 }],
}, PAID)));
assert.strictEqual(visit.route.kind, 'visit');
assert.strictEqual(visit.route.stops[0].role, 'visit');

// Auth: non-driver cannot start, post location, or end
const routeId = made.route.id;
const deniedStart = await (api.startRoute(routeId, stranger));
assert.strictEqual(deniedStart.status, 403);
const started = ok(await (api.startRoute(routeId, driver)));
assert.strictEqual(started.route.status, 'active');
assert.strictEqual(started.route.stops[0].status, 'next');

const deniedLoc = await (api.reportLocation(routeId, stranger, { lat: 13.1, lng: -59.6 }));
assert.strictEqual(deniedLoc.status, 403);

const badRange = await (api.reportLocation(routeId, driver, { lat: 200, lng: 0 }));
assert.strictEqual(badRange.status, 400);

const posted = ok(await (api.reportLocation(routeId, driver, { lat: 13.11, lng: -59.61 })));
assert.strictEqual(posted.accepted, true);
assert.strictEqual(posted.location.state, 'live');
assert.strictEqual(posted.fulfill, false);

t += 1000; // too soon
const throttled = await (api.reportLocation(routeId, driver, { lat: 13.111, lng: -59.611 }));
assert.strictEqual(throttled.status, 429);
assert.strictEqual(throttled.throttled, true);

t += 8000;
const jump = await (api.reportLocation(routeId, driver, { lat: 50, lng: 0 }));
assert.strictEqual(jump.status, 400);

t += 8000;
ok(await (api.reportLocation(routeId, driver, { lat: 13.1105, lng: -59.6102 })));

// Token isolation: A cannot see B's order ref or token; B's view is B's stop only
const viewB = ok(await (api.trackByToken(tokenB)));
assert.strictEqual(viewB.stop.sequence, 2);
assert.ok(!JSON.stringify(viewB).includes(tokenA));
assert.ok(!JSON.stringify(viewB).includes(tokenC));
assert.ok(!JSON.stringify(viewB).includes('ord-a'));
assert.ok(!JSON.stringify(viewB).includes('ord-c'));
assert.strictEqual(viewB.location.state, 'live');
assert.ok(viewB.location.pin);
assert.strictEqual(viewB.stopsAway, 1);
assert.ok(viewB.eta === null || viewB.eta.etaSource === 'approx' || viewB.eta.etaSource === 'google_routes');
if (viewB.eta && viewB.eta.etaSource === 'approx') assert.strictEqual(viewB.eta.etaLabel, 'approx');

const missing = await (api.trackByToken('not-a-real-token-xxxxxxxxxxxx'));
assert.strictEqual(missing.status, 404);

const viewA = ok(await (api.trackByToken(tokenA)));
assert.strictEqual(viewA.isNext, true);

// Stale: advance clock 3 minutes, pin hides, last seen
t += 3 * 60 * 1000;
const staleView = ok(await (api.trackByToken(tokenB)));
assert.strictEqual(staleView.location.state, 'last_seen');
assert.strictEqual(staleView.location.pin, null);
assert.ok(staleView.location.lastSeenAgoMinutes >= 3);

// End route stops exposure
const endedJob = ok(await (api.endRoute(routeId, driver)));
assert.strictEqual(endedJob.route.status, 'ended');
const afterEnd = ok(await (api.trackByToken(tokenB)));
assert.strictEqual(afterEnd.location.state, 'ended');
assert.strictEqual(afterEnd.location.pin, null);
assert.strictEqual(afterEnd.eta, null);
const locAfterEnd = await (api.reportLocation(routeId, driver, { lat: 13.1105, lng: -59.6102 }));
assert.strictEqual(locAfterEnd.status, 400);

// Delivered hides location even if somehow still active — new job
t += 10_000;
const job2 = ok(await (api.createRoute(seller, {
  kind: 'route',
  driverUserId: 'driver-1',
  stops: [
    { orderRef: 'x1', label: 'One', lat: 12.05, lng: -61.75 },
    { orderRef: 'x2', label: 'Two', lat: 12.06, lng: -61.74 },
  ],
}, PAID)));
ok(await (api.startRoute(job2.route.id, driver)));
t += 8000;
ok(await (api.reportLocation(job2.route.id, driver, { lat: 12.051, lng: -61.749 })));
const stop1 = job2.route.stops[0];
ok(await (api.markDelivered(job2.route.id, stop1.id, driver)));
const deliveredView = ok(await (api.trackByToken(stop1.shareToken)));
assert.strictEqual(deliveredView.location.state, 'delivered');
assert.strictEqual(deliveredView.location.pin, null);
const stillPending = ok(await (api.trackByToken(job2.route.stops[1].shareToken)));
assert.ok(stillPending.location.state === 'live' || stillPending.location.state === 'last_seen' || stillPending.location.state === 'not_sharing');
assert.notStrictEqual(stillPending.location.state, 'delivered');


// ── vehicle cap: 1 included + tracking_extra_vehicles ──
const capApi = createTracking({
  store: createMemoryStore(),
  env: { TRACKING_REQUIRE_PAID: 'true' },
  now: () => t + 100000,
  alerter: { emit() {} },
});
const stopOne = [{ label: 'A', lat: 10.5, lng: -61.5 }];
const firstVeh = ok(await (capApi.createRoute(seller, { kind: 'visit', driverUserId: 'driver-1', storeId: 'cap-store', stops: stopOne }, BASE_PAID)));
assert.ok(firstVeh.route.id);
const secondVeh = await (capApi.createRoute(seller, { kind: 'visit', driverUserId: 'driver-2', storeId: 'cap-store', stops: stopOne }, BASE_PAID));
assert.strictEqual(secondVeh.status, 403);
assert.strictEqual(secondVeh.atCap, true);
assert.strictEqual(secondVeh.maxVehicles, 1);
assert.ok(secondVeh.error && /vehicle/i.test(secondVeh.error));
// price in the cap message is read from juvayPlans, not invented here
const prices = require('./deliveryTracking').loadJuvayPlanPrices();
if (prices.extraVehiclePriceTtd != null) {
  assert.ok(String(secondVeh.extraVehiclePriceTtd) === String(prices.extraVehiclePriceTtd));
  assert.ok(secondVeh.error.includes(String(prices.extraVehiclePriceTtd)));
}
const withExtra = ok(await (capApi.createRoute(seller, { kind: 'visit', driverUserId: 'driver-2', storeId: 'cap-store', stops: stopOne }, { ...BASE_PAID, trackingExtraVehicles: 1 })));
assert.ok(withExtra.route.id);
const third = await (capApi.createRoute(seller, { kind: 'visit', driverUserId: 'driver-3', storeId: 'cap-store', stops: stopOne }, { ...BASE_PAID, trackingExtraVehicles: 1 }));
assert.strictEqual(third.status, 403);
assert.strictEqual(third.maxVehicles, 2);

// ── Google Routes: success, cache, error hides ETA, approx fallback ──
async function withRoutes({ fetchImpl, env, fallback }) {
  let clock = now;
  const inst = createTracking({
    store: createMemoryStore(),
    env: {
      TRACKING_REQUIRE_PAID: 'false',
      GOOGLE_MAPS_SERVER_KEY: 'server-test-key',
      ETA_APPROX_FALLBACK: fallback ? 'true' : 'false',
      TRACKING_ETA_CACHE_MS: '60000',
      ...(env || {}),
    },
    now: () => clock,
    fetch: fetchImpl,
    alerter: { emit() {} },
  });
  const job = ok(await (inst.createRoute(seller, {
    kind: 'visit',
    driverUserId: 'driver-1',
    stops: [{ label: 'Visit', lat: 18.4, lng: -64.62 }],
  }, { planTier: 'free' })));
  ok(await (inst.startRoute(job.route.id, driver)));
  clock += 8000;
  ok(await (inst.reportLocation(job.route.id, driver, { lat: 18.41, lng: -64.63 })));
  return { inst, token: job.route.stops[0].shareToken, advance: (ms) => { clock += ms; } };
}

let routesCalls = 0;
const okFetch = async () => {
  routesCalls += 1;
  return {
    ok: true,
    status: 200,
    json: async () => ({ routes: [{ duration: '540s', distanceMeters: 4200 }] }),
  };
};
const g1 = await (withRoutes({ fetchImpl: okFetch, fallback: false }));
const gView = ok(await (g1.inst.trackByToken(g1.token)));
assert.ok(gView.eta);
assert.strictEqual(gView.eta.etaSource, 'google_routes');
assert.strictEqual(gView.eta.etaMinutes, 9);
assert.strictEqual(gView.eta.etaLabel, null);
assert.ok(!JSON.stringify(gView).includes('server-test-key'));
assert.strictEqual(routesCalls, 1);
// throttle: second call within 60s does not re-hit Routes
ok(await (g1.inst.trackByToken(g1.token)));
assert.strictEqual(routesCalls, 1);
g1.advance(61_000);
ok(await (g1.inst.trackByToken(g1.token)));
assert.strictEqual(routesCalls, 2);

const forbiddenFetch = async () => ({ ok: false, status: 403, json: async () => ({ error: 'forbidden' }) });
const hidden = await (withRoutes({ fetchImpl: forbiddenFetch, fallback: false }));
const hiddenView = ok(await (hidden.inst.trackByToken(hidden.token)));
assert.strictEqual(hiddenView.eta, null);

const anyErrFetch = async () => { throw new Error('network'); };
const hidden2 = await (withRoutes({ fetchImpl: anyErrFetch, fallback: false }));
const hidden2View = ok(await (hidden2.inst.trackByToken(hidden2.token)));
assert.strictEqual(hidden2View.eta, null);

const approxOn = await (withRoutes({ fetchImpl: forbiddenFetch, fallback: true }));
const approxView = ok(await (approxOn.inst.trackByToken(approxOn.token)));
assert.ok(approxView.eta);
assert.strictEqual(approxView.eta.etaSource, 'approx');
assert.strictEqual(approxView.eta.etaLabel, 'approx');

// No server key: haversine approx (Routes never configured)
const noKey = createTracking({
  store: createMemoryStore(),
  env: { TRACKING_REQUIRE_PAID: 'false' },
  now: () => now + 50_000,
  alerter: { emit() {} },
});
const nk = ok(await (noKey.createRoute(seller, {
  kind: 'visit', driverUserId: 'driver-1',
  stops: [{ label: 'Visit', lat: 18.4, lng: -64.62 }],
}, {})));
ok(await (noKey.startRoute(nk.route.id, driver)));
ok(await (noKey.reportLocation(nk.route.id, driver, { lat: 18.41, lng: -64.63 })));
const nkView = ok(await (noKey.trackByToken(nk.route.stops[0].shareToken)));
assert.ok(nkView.eta);
assert.strictEqual(nkView.eta.etaSource, 'approx');

// googleRoutesEta unit: 403
const g403 = await (googleRoutesEta({
  origin: { lat: 10, lng: -61 },
  destination: { lat: 10.1, lng: -61 },
  apiKey: 'k',
  fetchImpl: async () => ({ ok: false, status: 403, json: async () => ({}) }),
}));
assert.strictEqual(g403.error, true);
assert.strictEqual(g403.status, 403);

console.log('deliveryTracking tests: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
