/**
 * Shared live-tracking for Juvay. Vertical-agnostic.
 * kind: route (many stops) | delivery (pickup → dropoff) | visit (provider to one address).
 * Naming is provider / vehicle — not a van, bakery, or fish truck.
 *
 * Customer GET /api/track/:token is free. Creating a job is a paid seller feature
 * (TRACKING_REQUIRE_PAID, default true): plan slug in TRACKING_PLAN_TIERS
 * (default "premium,pro,starter,business"). Legacy slugs pro/starter/business
 * are treated as Premium. Premium includes 1 live-tracked vehicle; more need
 * stores.tracking_extra_vehicles (add-on). Prices are read from
 * services/juvayPlans.ts — this file does not hard-code TTD amounts.
 * Locked copy: "Live tracking comes with Juvay Premium."
 *
 * Maps / ETA:
 *   Browser key: VITE_GOOGLE_MAPS_API_KEY only (never a new name).
 *   Server Routes key: GOOGLE_MAPS_SERVER_KEY, falling back to
 *   VITE_GOOGLE_MAPS_API_KEY (same key must have Routes API enabled).
 *   The server key is never placed on a client payload.
 *   Google Routes errors hide ETA unless ETA_APPROX_FALLBACK=true (default false).
 *   With no server key, haversine approx is used and labeled "approx".
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KINDS = Object.freeze(['route', 'delivery', 'visit']);
const ROUTE_STATUSES = Object.freeze(['planned', 'active', 'ended']);
const STOP_STATUSES = Object.freeze(['pending', 'next', 'delivered']);
const STOP_ROLES = Object.freeze(['pickup', 'dropoff', 'stop', 'visit']);
const ALERT_EVENTS = Object.freeze(['on_the_way', 'two_stops_away', 'next_stop', 'delivered']);

const LOCKED_FALLBACK_COPY = 'Live tracking comes with Juvay Premium.';
const ALERT_NOTE =
  'No SMS or WhatsApp sender is configured. This event is logged and shown on the tracking page only.';

const DEFAULTS = Object.freeze({
  assumedSpeedKmh: 30,
  roadFactor: 1.4,
  liveMs: 2 * 60 * 1000,
  hideMs: 10 * 60 * 1000,
  purgeDays: 7,
  maxSpeedKmh: 200,
  minIntervalMs: 4000,
  etaCacheMs: 60 * 1000,
  futureSkewMs: 60 * 1000,
  pastSkewMs: 5 * 60 * 1000,
  locationRateMax: 15,
  locationRateWindowMs: 60 * 1000,
  trackRateMax: 60,
  trackRateWindowMs: 60 * 1000,
  routesTimeoutMs: 5000,
});

function envRaw(name, env) {
  const e = env || process.env;
  return e[name];
}

function envFlag(name, defaultTrue, env) {
  const raw = envRaw(name, env);
  if (raw == null || String(raw).trim() === '') return defaultTrue;
  const v = String(raw).trim().toLowerCase();
  if (defaultTrue) return !(v === 'false' || v === '0' || v === 'off' || v === 'no');
  return v === 'true' || v === '1' || v === 'on' || v === 'yes';
}

function envNumber(name, fallback, env) {
  const raw = envRaw(name, env);
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function trackingRequirePaid(env) {
  return envFlag('TRACKING_REQUIRE_PAID', true, env);
}

/** Default: Premium, plus legacy slugs treated as Premium (pro, starter, business). */
function trackingPlanTiers(env) {
  const raw = envRaw('TRACKING_PLAN_TIERS', env);
  const text = raw == null || String(raw).trim() === '' ? 'premium,pro,starter,business' : String(raw);
  return text
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** When Google Routes errors, only use haversine if this is on. Default off. */
function etaApproxFallback(env) {
  return envFlag('ETA_APPROX_FALLBACK', false, env);
}

/**
 * Server-side Routes API key. Prefer GOOGLE_MAPS_SERVER_KEY (IP-restricted).
 * Falls back to VITE_GOOGLE_MAPS_API_KEY — that key must have Routes API
 * enabled. Never return this from a public/track payload.
 */
function serverMapsKey(env) {
  const e = env || process.env;
  const server = String(e.GOOGLE_MAPS_SERVER_KEY || '').trim();
  if (server && !server.includes('...')) return server;
  const shared = String(e.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  if (shared && shared.length > 10 && !shared.includes('...')) return shared;
  return '';
}

function isPaidTier(tier, env) {
  const t = String(tier || '').trim().toLowerCase();
  if (!t) return false;
  return trackingPlanTiers(env).includes(t);
}

function planDisplayNames(plans, env) {
  const allowed = new Set(trackingPlanTiers(env));
  const list = Array.isArray(plans) ? plans : [];
  const names = [];
  const seen = new Set();
  for (const p of list) {
    const slug = String(p.slug || p.id || '').trim().toLowerCase();
    if (allowed.size && slug && !allowed.has(slug)) continue;
    const name = String(p.name || p.displayName || p.display_name || '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    // Never pick a price field as a display name.
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names;
}


/**
 * Read TTD figures from services/juvayPlans.ts so this module never hard-codes them.
 */
let _planPricesCache = null;
function loadJuvayPlanPrices(rootDir) {
  if (_planPricesCache) return _planPricesCache;
  const fsMod = require('fs');
  const pathMod = require('path');
  const candidates = [
    rootDir && pathMod.join(rootDir, 'services', 'juvayPlans.ts'),
    pathMod.join(__dirname, '..', 'services', 'juvayPlans.ts'),
  ].filter(Boolean);
  let text = '';
  for (const f of candidates) {
    try {
      text = fsMod.readFileSync(f, 'utf8');
      break;
    } catch (_) { /* try next */ }
  }
  const num = (name, fallback) => {
    const m = text && text.match(new RegExp('export const ' + name + ' = (\\d+)'));
    return m ? Number(m[1]) : fallback;
  };
  _planPricesCache = {
    introPriceTtd: num('PREMIUM_INTRO_PRICE_TTD', null),
    introMonths: num('PREMIUM_INTRO_MONTHS', null),
    thenPriceTtd: num('PREMIUM_THEN_PRICE_TTD', null),
    includedVehicles: num('TRACKING_INCLUDED_VEHICLES', 1),
    extraVehiclePriceTtd: num('TRACKING_EXTRA_VEHICLE_PRICE_TTD', null),
  };
  return _planPricesCache;
}

function clearPlanPricesCache() {
  _planPricesCache = null;
}

function lockedCopy(_planNames) {
  // Official product copy. Prices belong on the upgrade card, read from juvayPlans.ts.
  return LOCKED_FALLBACK_COPY;
}

function trackingExtraVehicles(entitlement) {
  const n = Number(
    entitlement && (entitlement.trackingExtraVehicles ?? entitlement.tracking_extra_vehicles),
  );
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function vehicleCap(entitlement, prices) {
  const included = (prices && prices.includedVehicles) || 1;
  return included + trackingExtraVehicles(entitlement);
}

function trackingPaidGate(entitlement, env) {
  const requirePaid = trackingRequirePaid(env);
  const names = planDisplayNames(entitlement && entitlement.plans, env);
  const message = lockedCopy(names);
  const prices = (entitlement && entitlement.planPrices) || loadJuvayPlanPrices();
  const maxVehicles = vehicleCap(entitlement, prices);
  const base = { planNames: names, maxVehicles, includedVehicles: (prices && prices.includedVehicles) || 1, extraVehicles: trackingExtraVehicles(entitlement), extraVehiclePriceTtd: prices && prices.extraVehiclePriceTtd, premiumIntroPriceTtd: prices && prices.introPriceTtd, premiumThenPriceTtd: prices && prices.thenPriceTtd, premiumIntroMonths: prices && prices.introMonths };
  if (!requirePaid) {
    return { allowed: true, requirePaid: false, ...base };
  }
  const tier = entitlement && (entitlement.planTier || entitlement.plan_tier || entitlement.planSlug || entitlement.plan_slug);
  if (isPaidTier(tier, env)) {
    return { allowed: true, requirePaid: true, reason: 'plan', planTier: String(tier).toLowerCase(), ...base };
  }
  return {
    allowed: false,
    requirePaid: true,
    locked: true,
    upgrade: true,
    message,
    ...base,
  };
}

function nowMs(clock) {
  if (typeof clock === 'function') return Number(clock());
  if (typeof clock === 'number') return clock;
  return Date.now();
}

function newId() {
  return crypto.randomUUID();
}

function newShareToken() {
  // 24 bytes = 192 bits, 32-char base64url. Always server-issued.
  return crypto.randomBytes(24).toString('base64url');
}

// 16 bytes of entropy is 128 bits and encodes to 22 base64url chars.
const SHARE_TOKEN_MIN_LENGTH = 22;
const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{22,}$/;

function isShareTokenFormat(token) {
  return typeof token === 'string' && SHARE_TOKEN_RE.test(token);
}

const STORE_ACCESS_DENIED = 'You can only use tracking for a shop you own.';

function actorOwnsLookedUpStore(userId, looked) {
  if (!userId || !looked || !looked.store) return false;
  const id = String(userId);
  const store = looked.store;
  const ownerId = store.owner_id || store.ownerId;
  if (ownerId && String(ownerId) === id) return true;
  const members = store.memberIds || store.member_ids || [];
  return members.some((m) => m != null && String(m) === id);
}

async function lookupStoreFromPool(pool, storeId) {
  if (!pool) return { unavailable: true };
  if (!storeId) return { found: false };
  const { rows } = await pool.query(
    'SELECT id, plan_tier, tracking_addon, tracking_extra_vehicles, owner_id FROM stores WHERE id = $1',
    [storeId],
  );
  if (!rows[0]) return { found: false };
  const store = { ...rows[0], memberIds: [] };
  try {
    const staff = await pool.query(
      'SELECT user_id FROM store_staff WHERE store_id = $1',
      [storeId],
    );
    store.memberIds = (staff.rows || []).map((r) => r.user_id).filter((id) => id != null);
  } catch (_) {
    // store_staff is optional; ownership still stands on owner_id.
  }
  return { found: true, store };
}

async function assertStoreAccess(lookup, userId, storeId) {
  if (!storeId) return { ok: true, skipped: true };
  if (!userId) return { ok: false, status: 403, error: STORE_ACCESS_DENIED };
  if (typeof lookup !== 'function') return { ok: true, skipped: true };
  const looked = await lookup(storeId);
  if (!looked || looked.unavailable) return { ok: true, skipped: true };
  if (!looked.found || !actorOwnsLookedUpStore(userId, looked)) {
    return { ok: false, status: 403, error: STORE_ACCESS_DENIED };
  }
  return { ok: true, store: looked.store };
}

function validLatLng(p) {
  if (!p || typeof p !== 'object') return false;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function haversineKm(a, b) {
  if (!validLatLng(a) || !validLatLng(b)) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function isAbsurdJump(prev, next, opts) {
  if (!validLatLng(prev) || !validLatLng(next)) return false;
  const max = (opts && opts.maxSpeedKmh) || DEFAULTS.maxSpeedKmh;
  const dtMs = Number(next.at) - Number(prev.at);
  const km = haversineKm(prev, next);
  if (km == null) return true;
  if (!Number.isFinite(dtMs) || dtMs <= 0) return km > 0.5;
  const hours = dtMs / 3_600_000;
  if (hours <= 0) return km > 0.5;
  return km / hours > max;
}

function isValidTimestamp(recordedAt, now, opts) {
  const at = Number(recordedAt);
  if (!Number.isFinite(at)) return { ok: false, error: 'Invalid timestamp' };
  const future = (opts && opts.futureSkewMs) || DEFAULTS.futureSkewMs;
  const past = (opts && opts.pastSkewMs) || DEFAULTS.pastSkewMs;
  if (at - now > future) return { ok: false, error: 'Timestamp is in the future' };
  if (now - at > past) return { ok: false, error: 'Timestamp is too old' };
  return { ok: true };
}

function etaApproxMinutes(from, to, opts) {
  const speed = (opts && opts.assumedSpeedKmh) || DEFAULTS.assumedSpeedKmh;
  const factor = (opts && opts.roadFactor) || DEFAULTS.roadFactor;
  const km = haversineKm(from, to);
  if (km == null || !(speed > 0)) return null;
  const roadKm = km * factor;
  return { etaMinutes: Math.max(1, Math.round((roadKm / speed) * 60)), distanceKm: roadKm, assumedSpeedKmh: speed, roadFactor: factor };
}

/** Remaining waypoints from current point along pending stops up to (and including) the customer's stop. */
function remainingPath(current, stops, customerStop) {
  if (!customerStop) return [];
  const ordered = (stops || [])
    .filter((s) => s.status !== 'delivered' && s.sequence <= customerStop.sequence)
    .sort((a, b) => a.sequence - b.sequence);
  const points = [];
  if (validLatLng(current)) points.push({ lat: Number(current.lat), lng: Number(current.lng) });
  for (const s of ordered) {
    if (validLatLng(s)) points.push({ lat: Number(s.lat), lng: Number(s.lng) });
  }
  return points;
}

function approxEtaForPath(points, opts) {
  if (!points || points.length < 2) return null;
  let km = 0;
  for (let i = 1; i < points.length; i += 1) {
    const d = haversineKm(points[i - 1], points[i]);
    if (d == null) return null;
    km += d;
  }
  const speed = (opts && opts.assumedSpeedKmh) || DEFAULTS.assumedSpeedKmh;
  const factor = (opts && opts.roadFactor) || DEFAULTS.roadFactor;
  if (!(speed > 0)) return null;
  const roadKm = km * factor;
  return {
    etaMinutes: Math.max(1, Math.round((roadKm / speed) * 60)),
    distanceKm: Math.round(roadKm * 100) / 100,
    assumedSpeedKmh: speed,
    roadFactor: factor,
    etaSource: 'approx',
    etaLabel: 'approx',
    note: `Approx, assuming ${speed} km/h`,
  };
}

function locationView(route, lastFix, now, opts) {
  const liveMs = (opts && opts.liveMs) || DEFAULTS.liveMs;
  const hideMs = (opts && opts.hideMs) || DEFAULTS.hideMs;
  if (!route || route.status === 'ended' || route.endedAt) {
    return { state: 'ended', pin: null, message: 'This job has ended. Location is no longer shared.' };
  }
  if (route.status !== 'active') {
    return { state: 'not_sharing', pin: null, message: 'Provider is not sharing location' };
  }
  if (!lastFix || !validLatLng(lastFix)) {
    return { state: 'not_sharing', pin: null, message: 'Provider is not sharing location' };
  }
  const at = Number(lastFix.recordedAt || lastFix.recorded_at || lastFix.at);
  const age = now - at;
  const pin = { lat: Number(lastFix.lat), lng: Number(lastFix.lng) };
  if (age < liveMs) {
    return { state: 'live', pin, ageMs: age };
  }
  const mins = Math.max(1, Math.round(age / 60000));
  return {
    state: 'last_seen',
    pin: null,
    lastSeenAgoMinutes: mins,
    lastSeenAt: at,
    message: `Last seen ${mins} min ago`,
    hiddenBecauseStale: age >= hideMs,
  };
}

function stopsAway(stops, customerStop) {
  if (!customerStop) return null;
  return (stops || []).filter(
    (s) => s.status !== 'delivered' && s.sequence < customerStop.sequence,
  ).length;
}

function canDrive(route, user) {
  if (!route || !user || !user.id) return false;
  const id = String(user.id);
  return id === String(route.driverUserId) || id === String(route.sellerUserId);
}

function parseDurationSeconds(value) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const m = String(value).match(/^(\d+(?:\.\d+)?)s$/);
  if (m) return Number(m[1]);
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function routesBody(origin, destination, intermediates) {
  const loc = (p) => ({ location: { latLng: { latitude: p.lat, longitude: p.lng } } });
  const body = {
    origin: loc(origin),
    destination: loc(destination),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    languageCode: 'en',
    units: 'METRIC',
  };
  if (intermediates && intermediates.length) body.intermediates = intermediates.map(loc);
  return body;
}

async function googleRoutesEta({ origin, destination, intermediates, apiKey, fetchImpl, timeoutMs }) {
  if (!apiKey) return { error: true, status: 0, reason: 'no_key' };
  if (!validLatLng(origin) || !validLatLng(destination)) return { error: true, status: 0, reason: 'bad_points' };
  const fetchFn = fetchImpl || globalThis.fetch;
  if (typeof fetchFn !== 'function') return { error: true, status: 0, reason: 'no_fetch' };
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, timeoutMs || DEFAULTS.routesTimeoutMs);
  try {
    const res = await fetchFn('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.staticDuration,routes.distanceMeters',
      },
      body: JSON.stringify(routesBody(origin, destination, intermediates)),
      signal: ctrl ? ctrl.signal : undefined,
    });
    if (!res.ok) {
      return { error: true, status: res.status, reason: 'http' };
    }
    const data = await res.json();
    const route = data && data.routes && data.routes[0];
    if (!route) return { error: true, status: 200, reason: 'empty' };
    const seconds = parseDurationSeconds(route.duration);
    if (seconds == null) return { error: true, status: 200, reason: 'no_duration' };
    return {
      error: false,
      etaSource: 'google_routes',
      etaLabel: null,
      etaMinutes: Math.max(1, Math.round(seconds / 60)),
      distanceKm: route.distanceMeters != null ? Math.round((route.distanceMeters / 1000) * 100) / 100 : null,
      durationSeconds: seconds,
      note: 'Based on current traffic',
    };
  } catch (err) {
    return { error: true, status: 0, reason: err && err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  return function check(key) {
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      const retryAfterMs = windowMs - (now - arr[0]);
      return { ok: false, retryAfterMs };
    }
    arr.push(now);
    hits.set(key, arr);
    return { ok: true };
  };
}

function emptyState() {
  return { routes: [], stops: [], locations: [], events: [] };
}

function createMemoryStore(initial) {
  const s = initial || emptyState();
  return {
    kind: 'memory',
    state: s,
    async getRoute(id) {
      return s.routes.find((r) => r.id === id) || null;
    },
    async saveRoute(route) {
      const i = s.routes.findIndex((r) => r.id === route.id);
      if (i >= 0) s.routes[i] = route;
      else s.routes.push(route);
      return route;
    },
    async listStops(routeId) {
      return s.stops.filter((st) => st.routeId === routeId).sort((a, b) => a.sequence - b.sequence);
    },
    async saveStop(stop) {
      const i = s.stops.findIndex((st) => st.id === stop.id);
      if (i >= 0) s.stops[i] = stop;
      else s.stops.push(stop);
      return stop;
    },
    async findStopByToken(token) {
      return s.stops.find((st) => st.shareToken === token) || null;
    },
    async addLocation(row) {
      s.locations.push(row);
      return row;
    },
    async lastLocation(routeId) {
      const rows = s.locations.filter((l) => l.routeId === routeId);
      if (!rows.length) return null;
      return rows.reduce((a, b) => (Number(a.recordedAt) >= Number(b.recordedAt) ? a : b));
    },
    async purgeLocations(before) {
      const keep = s.locations.filter((l) => Number(l.recordedAt) >= before);
      const removed = s.locations.length - keep.length;
      s.locations = keep;
      return removed;
    },
    async addEvent(row) {
      s.events.push(row);
      return row;
    },
    async listEvents(stopId) {
      return s.events.filter((e) => e.stopId === stopId).sort((a, b) => a.at - b.at);
    },
    async countOpenJobs({ sellerUserId, storeId } = {}) {
      return s.routes.filter((r) => {
        if (r.status === 'ended') return false;
        if (sellerUserId && String(r.sellerUserId) === String(sellerUserId)) return true;
        if (storeId && r.storeId && String(r.storeId) === String(storeId)) return true;
        return false;
      }).length;
    },
    async getStore(storeId) {
      // No stores list means this is a test/memory store without a catalog.
      if (!Array.isArray(s.stores)) return { unavailable: true };
      const store = s.stores.find((st) => String(st.id) === String(storeId));
      return store ? { found: true, store } : { found: false };
    },
  };
}

function createFileStore(filePath) {
  function load() {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return emptyState();
    }
  }
  function persist(s) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(s));
  }
  const memory = createMemoryStore(load());
  const wrap = (fn) => async (...args) => {
    const out = await fn(...args);
    persist(memory.state);
    return out;
  };
  return {
    kind: 'file',
    filePath,
    getRoute: memory.getRoute,
    listStops: memory.listStops,
    findStopByToken: memory.findStopByToken,
    lastLocation: memory.lastLocation,
    listEvents: memory.listEvents,
    countOpenJobs: memory.countOpenJobs,
    getStore: memory.getStore,
    saveRoute: wrap(memory.saveRoute),
    saveStop: wrap(memory.saveStop),
    addLocation: wrap(memory.addLocation),
    purgeLocations: wrap(memory.purgeLocations),
    addEvent: wrap(memory.addEvent),
  };
}

function rowRoute(r) {
  return {
    id: r.id,
    kind: r.kind,
    sellerUserId: r.seller_user_id,
    storeId: r.store_id,
    driverUserId: r.driver_user_id,
    providerLabel: r.provider_label,
    status: r.status,
    startedAt: r.started_at ? new Date(r.started_at).getTime() : null,
    endedAt: r.ended_at ? new Date(r.ended_at).getTime() : null,
    metadata: r.metadata || {},
    createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : null,
  };
}

function rowStop(r) {
  return {
    id: r.id,
    routeId: r.route_id,
    sequence: r.sequence,
    role: r.role,
    orderRef: r.order_ref,
    shareToken: r.share_token,
    status: r.status,
    label: r.label,
    lat: r.lat == null ? null : Number(r.lat),
    lng: r.lng == null ? null : Number(r.lng),
    deliveredAt: r.delivered_at ? new Date(r.delivered_at).getTime() : null,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : null,
  };
}

function createPgStore(pool) {
  return {
    kind: 'pg',
    pool,
    async getRoute(id) {
      const { rows } = await pool.query('SELECT * FROM delivery_routes WHERE id = $1', [id]);
      return rows[0] ? rowRoute(rows[0]) : null;
    },
    async saveRoute(route) {
      const { rows } = await pool.query(
        `INSERT INTO delivery_routes
           (id, kind, seller_user_id, store_id, driver_user_id, provider_label, status, started_at, ended_at, metadata, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, to_timestamp($8/1000.0), to_timestamp($9/1000.0), $10::jsonb, now())
         ON CONFLICT (id) DO UPDATE SET
           kind = EXCLUDED.kind,
           seller_user_id = EXCLUDED.seller_user_id,
           store_id = EXCLUDED.store_id,
           driver_user_id = EXCLUDED.driver_user_id,
           provider_label = EXCLUDED.provider_label,
           status = EXCLUDED.status,
           started_at = EXCLUDED.started_at,
           ended_at = EXCLUDED.ended_at,
           metadata = EXCLUDED.metadata,
           updated_at = now()
         RETURNING *`,
        [
          route.id, route.kind, route.sellerUserId || null, route.storeId || null,
          route.driverUserId, route.providerLabel || null, route.status,
          route.startedAt || null, route.endedAt || null, JSON.stringify(route.metadata || {}),
        ],
      );
      return rowRoute(rows[0]);
    },
    async listStops(routeId) {
      const { rows } = await pool.query(
        'SELECT * FROM route_stops WHERE route_id = $1 ORDER BY sequence ASC',
        [routeId],
      );
      return rows.map(rowStop);
    },
    async saveStop(stop) {
      const { rows } = await pool.query(
        `INSERT INTO route_stops
           (id, route_id, sequence, role, order_ref, share_token, status, label, lat, lng, delivered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, to_timestamp($11/1000.0))
         ON CONFLICT (id) DO UPDATE SET
           sequence = EXCLUDED.sequence,
           role = EXCLUDED.role,
           order_ref = EXCLUDED.order_ref,
           status = EXCLUDED.status,
           label = EXCLUDED.label,
           lat = EXCLUDED.lat,
           lng = EXCLUDED.lng,
           delivered_at = EXCLUDED.delivered_at
         RETURNING *`,
        [
          stop.id, stop.routeId, stop.sequence, stop.role, stop.orderRef || null,
          stop.shareToken, stop.status, stop.label || null,
          stop.lat == null ? null : stop.lat, stop.lng == null ? null : stop.lng,
          stop.deliveredAt || null,
        ],
      );
      return rowStop(rows[0]);
    },
    async findStopByToken(token) {
      const { rows } = await pool.query('SELECT * FROM route_stops WHERE share_token = $1', [token]);
      return rows[0] ? rowStop(rows[0]) : null;
    },
    async addLocation(row) {
      const { rows } = await pool.query(
        `INSERT INTO driver_locations (id, route_id, lat, lng, accuracy, heading, speed, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7, to_timestamp($8/1000.0)) RETURNING *`,
        [row.id, row.routeId, row.lat, row.lng, row.accuracy ?? null, row.heading ?? null, row.speed ?? null, row.recordedAt],
      );
      const r = rows[0];
      return {
        id: r.id, routeId: r.route_id, lat: Number(r.lat), lng: Number(r.lng),
        accuracy: r.accuracy, heading: r.heading, speed: r.speed,
        recordedAt: new Date(r.recorded_at).getTime(),
      };
    },
    async lastLocation(routeId) {
      const { rows } = await pool.query(
        'SELECT * FROM driver_locations WHERE route_id = $1 ORDER BY recorded_at DESC LIMIT 1',
        [routeId],
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        id: r.id, routeId: r.route_id, lat: Number(r.lat), lng: Number(r.lng),
        accuracy: r.accuracy, heading: r.heading, speed: r.speed,
        recordedAt: new Date(r.recorded_at).getTime(),
      };
    },
    async purgeLocations(before) {
      const { rowCount } = await pool.query(
        'DELETE FROM driver_locations WHERE recorded_at < to_timestamp($1/1000.0)',
        [before],
      );
      return rowCount || 0;
    },
    async addEvent(row) {
      await pool.query(
        `INSERT INTO tracking_alert_events (id, route_id, stop_id, event, at, sent, channel, note)
         VALUES ($1,$2,$3,$4, to_timestamp($5/1000.0), $6, $7, $8)`,
        [row.id, row.routeId, row.stopId, row.event, row.at, row.sent === true, row.channel || null, row.note || ALERT_NOTE],
      );
      return row;
    },
    async listEvents(stopId) {
      const { rows } = await pool.query(
        'SELECT * FROM tracking_alert_events WHERE stop_id = $1 ORDER BY at ASC',
        [stopId],
      );
      return rows.map((r) => ({
        id: r.id, routeId: r.route_id, stopId: r.stop_id, event: r.event,
        at: new Date(r.at).getTime(), sent: r.sent === true, channel: r.channel, note: r.note,
      }));
    },
    async countOpenJobs({ sellerUserId, storeId } = {}) {
      const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS n FROM delivery_routes
          WHERE status IN ('planned', 'active')
            AND (seller_user_id = $1 OR ($2::text IS NOT NULL AND store_id = $2))`,
        [sellerUserId || null, storeId || null],
      );
      return rows[0] ? rows[0].n : 0;
    },
    async getStore(storeId) {
      return lookupStoreFromPool(pool, storeId);
    },
    pool,
  };
}

async function resolveEntitlement(pool, { userId, storeId }, env, extras = {}) {
  const entitlement = { planTier: 'free', trackingAddon: false, plans: [] };
  let looked = null;
  if (storeId) {
    if (extras.store) looked = { found: true, store: extras.store };
    else if (typeof extras.lookupStore === 'function') looked = await extras.lookupStore(storeId);
    else if (pool) looked = await lookupStoreFromPool(pool, storeId);
    else looked = { unavailable: true };
    // A known store (or a missing store in a real catalog) must belong to the actor.
    if (looked && !looked.unavailable) {
      if (!looked.found || !actorOwnsLookedUpStore(userId, looked)) {
        return { error: STORE_ACCESS_DENIED, status: 403 };
      }
      const row = looked.store;
      entitlement.planTier = row.plan_tier || 'free';
      entitlement.trackingAddon = row.tracking_addon === true;
      entitlement.trackingExtraVehicles = Number(row.tracking_extra_vehicles) || 0;
    }
  }
  if (!pool) return entitlement;
  try {
    const { rows: plans } = await pool.query('SELECT slug, name FROM plan_tiers');
    entitlement.plans = plans || [];
  } catch (_) { /* plan_tiers may be absent */ }
  try {
    if (userId) {
      const { rows } = await pool.query(
        `SELECT pt.slug, pt.name
           FROM user_plan_subscriptions ups
           JOIN plan_tiers pt ON pt.slug = ups.plan_slug
          WHERE ups.user_id = $1`,
        [userId],
      );
      if (rows[0]?.slug) entitlement.planTier = rows[0].slug;
      if (rows.length && !entitlement.plans.length) entitlement.plans = rows;
    }
  } catch (_) {
    // Fail closed at the gate when require-paid is on and we couldn't prove payment.
  }
  return entitlement;
}

function createTracking(opts = {}) {
  const env = opts.env || process.env;
  const store = opts.store || (opts.pool ? createPgStore(opts.pool) : createMemoryStore());
  const clock = opts.now || (() => Date.now());
  const alerter = opts.alerter || {
    emit(event, payload) {
      // Honest no-op: log only. No SMS / WhatsApp sender exists yet.
      if (typeof opts.log === 'function') opts.log('[tracking-alert]', event, payload && payload.stopId);
      else console.log('[tracking-alert]', event, payload && payload.stopId);
    },
  };
  const fetchImpl = opts.fetch || globalThis.fetch;
  const assumedSpeedKmh = opts.assumedSpeedKmh ?? envNumber('TRACKING_ASSUMED_SPEED_KMH', DEFAULTS.assumedSpeedKmh, env);
  const roadFactor = opts.roadFactor ?? envNumber('TRACKING_ROAD_FACTOR', DEFAULTS.roadFactor, env);
  const liveMs = opts.liveMs ?? envNumber('TRACKING_LIVE_SECONDS', DEFAULTS.liveMs / 1000, env) * 1000;
  const hideMs = opts.hideMs ?? envNumber('TRACKING_HIDE_SECONDS', DEFAULTS.hideMs / 1000, env) * 1000;
  const purgeDays = opts.purgeDays ?? envNumber('TRACKING_PURGE_DAYS', DEFAULTS.purgeDays, env);
  const maxSpeedKmh = opts.maxSpeedKmh ?? envNumber('TRACKING_MAX_SPEED_KMH', DEFAULTS.maxSpeedKmh, env);
  const minIntervalMs = opts.minIntervalMs ?? envNumber('TRACKING_LOCATION_MIN_INTERVAL_MS', DEFAULTS.minIntervalMs, env);
  const etaCacheMs = opts.etaCacheMs ?? envNumber('TRACKING_ETA_CACHE_MS', DEFAULTS.etaCacheMs, env);
  const etaCache = opts.etaCache || new Map();

  function cfg() {
    return { assumedSpeedKmh, roadFactor, liveMs, hideMs, maxSpeedKmh, minIntervalMs, etaCacheMs, futureSkewMs: DEFAULTS.futureSkewMs, pastSkewMs: DEFAULTS.pastSkewMs };
  }

  async function emit(event, payload, at) {
    const record = {
      id: newId(),
      event,
      routeId: payload.routeId,
      stopId: payload.stopId,
      at: at || nowMs(clock),
      sent: false,
      channel: null,
      note: ALERT_NOTE,
    };
    try { alerter.emit(event, { ...payload, ...record }); } catch (_) { /* never throw from alerts */ }
    await store.addEvent(record);
    return record;
  }

  function normalizeStops(kind, raw) {
    const list = Array.isArray(raw) ? raw : [];
    if (kind === 'visit' && list.length !== 1) {
      return { error: 'A visit has exactly one address', status: 400 };
    }
    if (!list.length) return { error: 'At least one stop is required', status: 400 };
    const stops = list.map((s, i) => {
      let role = String(s.role || '').trim().toLowerCase();
      if (!STOP_ROLES.includes(role)) {
        if (kind === 'visit') role = 'visit';
        else if (kind === 'delivery') role = i === 0 && list.length > 1 ? 'pickup' : 'dropoff';
        else role = 'stop';
      }
      const seq = s.sequence == null ? i + 1 : Number(s.sequence);
      const lat = s.lat == null || s.lat === '' ? null : Number(s.lat);
      const lng = s.lng == null || s.lng === '' ? null : Number(s.lng);
      if ((lat != null || lng != null) && !validLatLng({ lat, lng })) {
        return { error: 'Stop coordinates are out of range', status: 400 };
      }
      return {
        id: s.id || newId(),
        sequence: seq,
        role,
        orderRef: s.orderRef || s.order_ref || null,
        shareToken: newShareToken(),
        status: 'pending',
        label: s.label || s.address || null,
        lat: lat == null ? null : lat,
        lng: lng == null ? null : lng,
        deliveredAt: null,
        createdAt: nowMs(clock),
      };
    });
    const bad = stops.find((s) => s.error);
    if (bad) return bad;
    return { stops };
  }

  async function lookupStore(storeId) {
    if (typeof opts.lookupStore === 'function') return opts.lookupStore(storeId);
    if (store && typeof store.getStore === 'function') return store.getStore(storeId);
    const pool = opts.pool || (store && store.pool);
    if (pool) return lookupStoreFromPool(pool, storeId);
    return { unavailable: true };
  }

  async function requireStoreAccess(userId, storeId) {
    return assertStoreAccess((id) => lookupStore(id), userId, storeId);
  }

  async function authorizeJobActor(route, user, action) {
    if (!canDrive(route, user)) {
      return { error: `Only the assigned driver or seller can ${action} this job`, status: 403 };
    }
    const isDriver = user && route.driverUserId && String(user.id) === String(route.driverUserId);
    if (isDriver) return { ok: true };
    if (route.storeId) {
      const access = await requireStoreAccess(user && user.id, route.storeId);
      if (!access.ok) return { error: access.error, status: 403 };
    }
    return { ok: true };
  }

  async function createRoute(actor, body, entitlement) {
    const requestedStoreId = (body && (body.storeId || body.store_id)) || null;
    if (requestedStoreId) {
      const access = await requireStoreAccess(actor && actor.id, requestedStoreId);
      if (!access.ok) return { error: access.error, status: 403 };
    }
    const gate = trackingPaidGate(entitlement || {}, env);
    if (!gate.allowed) {
      return { error: gate.message, status: 403, locked: true, upgrade: true, planNames: gate.planNames, message: gate.message, maxVehicles: gate.maxVehicles, extraVehiclePriceTtd: gate.extraVehiclePriceTtd };
    }
    const kind = String((body && body.kind) || 'route').trim().toLowerCase();
    if (!KINDS.includes(kind)) return { error: 'kind must be route, delivery, or visit', status: 400 };
    const driverUserId = (body && (body.driverUserId || body.driver_user_id)) || (actor && actor.id);
    if (!driverUserId) return { error: 'driverUserId is required', status: 400 };
    const prepared = normalizeStops(kind, body && body.stops);
    if (prepared.error) return prepared;
    if (typeof store.countOpenJobs === 'function') {
      const used = await store.countOpenJobs({
        sellerUserId: actor && actor.id,
        storeId: body && (body.storeId || body.store_id),
      });
      const max = gate.maxVehicles;
      if (Number.isFinite(max) && used >= max) {
        const prices = (entitlement && entitlement.planPrices) || loadJuvayPlanPrices();
        const extra = prices && prices.extraVehiclePriceTtd;
        const extraNote = extra != null
          ? ` Extra tracked vehicles are an add-on (price is in the plans table, currently TT$${extra}/vehicle/month).`
          : ' Extra tracked vehicles are an add-on. See plans for the monthly price.';
        return {
          error: `Live tracking for this shop is at its ${max}-vehicle limit.${extraNote}`,
          status: 403,
          atCap: true,
          maxVehicles: max,
          usedVehicles: used,
          extraVehiclePriceTtd: extra,
        };
      }
    }
    const t = nowMs(clock);
    const route = {
      id: newId(),
      kind,
      sellerUserId: (actor && actor.id) || null,
      storeId: (body && (body.storeId || body.store_id)) || null,
      driverUserId: String(driverUserId),
      providerLabel: (body && (body.providerLabel || body.provider_label)) || null,
      status: 'planned',
      startedAt: null,
      endedAt: null,
      metadata: (body && body.metadata) || {},
      createdAt: t,
      updatedAt: t,
    };
    await store.saveRoute(route);
    const stops = [];
    for (const st of prepared.stops) {
      st.routeId = route.id;
      await store.saveStop(st);
      stops.push(st);
    }
    return { route: operatorView(route, stops), gate };
  }

  function operatorView(route, stops) {
    return {
      id: route.id,
      kind: route.kind,
      status: route.status,
      sellerUserId: route.sellerUserId,
      storeId: route.storeId,
      driverUserId: route.driverUserId,
      providerLabel: route.providerLabel || 'Provider',
      startedAt: route.startedAt,
      endedAt: route.endedAt,
      metadata: route.metadata || {},
      stops: (stops || []).map((st) => ({
        id: st.id,
        sequence: st.sequence,
        role: st.role,
        orderRef: st.orderRef,
        shareToken: st.shareToken,
        trackPath: `/track/${st.shareToken}`,
        status: st.status,
        label: st.label,
        lat: st.lat,
        lng: st.lng,
        deliveredAt: st.deliveredAt,
      })),
    };
  }

  async function loadJob(routeId) {
    const route = await store.getRoute(routeId);
    if (!route) return { error: 'Job not found', status: 404 };
    const stops = await store.listStops(routeId);
    const lastFix = await store.lastLocation(routeId);
    return { route, stops, lastFix };
  }

  async function getRoute(routeId, user) {
    const loaded = await loadJob(routeId);
    if (loaded.error) return loaded;
    const authz = await authorizeJobActor(loaded.route, user, 'view');
    if (!authz.ok) return authz;
    const loc = locationView(loaded.route, loaded.lastFix, nowMs(clock), cfg());
    return { route: operatorView(loaded.route, loaded.stops), location: loc };
  }

  async function refreshNextAndAlerts(route, stops, at, { started } = {}) {
    const pending = stops.filter((s) => s.status !== 'delivered').sort((a, b) => a.sequence - b.sequence);
    if (started) {
      for (const s of pending) {
        await emit('on_the_way', { routeId: route.id, stopId: s.id }, at);
      }
    }
    if (pending[0] && pending[0].status !== 'next') {
      pending[0].status = 'next';
      await store.saveStop(pending[0]);
      await emit('next_stop', { routeId: route.id, stopId: pending[0].id }, at);
    }
    const two = pending.find((s) => stopsAway(stops, s) === 2);
    if (two) await emit('two_stops_away', { routeId: route.id, stopId: two.id }, at);
  }

  async function startRoute(routeId, user) {
    const loaded = await loadJob(routeId);
    if (loaded.error) return loaded;
    const { route, stops } = loaded;
    const authz = await authorizeJobActor(route, user, 'start');
    if (!authz.ok) return authz;
    if (route.status === 'ended') return { error: 'This job has ended', status: 400 };
    if (route.status === 'active') return { route: operatorView(route, stops), alreadyActive: true };
    const at = nowMs(clock);
    route.status = 'active';
    route.startedAt = at;
    route.updatedAt = at;
    await store.saveRoute(route);
    await refreshNextAndAlerts(route, stops, at, { started: true });
    const fresh = await store.listStops(route.id);
    return { route: operatorView(route, fresh), started: true };
  }

  async function endRoute(routeId, user) {
    const loaded = await loadJob(routeId);
    if (loaded.error) return loaded;
    const { route, stops } = loaded;
    const authz = await authorizeJobActor(route, user, 'end');
    if (!authz.ok) return authz;
    const at = nowMs(clock);
    route.status = 'ended';
    route.endedAt = at;
    route.updatedAt = at;
    await store.saveRoute(route);
    return { route: operatorView(route, stops), ended: true };
  }

  async function reportLocation(routeId, user, body) {
    const loaded = await loadJob(routeId);
    if (loaded.error) return loaded;
    const { route, lastFix } = loaded;
    const authz = await authorizeJobActor(route, user, 'share a location');
    if (!authz.ok) return authz;
    if (route.status !== 'active') return { error: 'Location is only accepted while the job is active', status: 400 };
    const lat = Number(body && body.lat);
    const lng = Number(body && body.lng);
    if (!validLatLng({ lat, lng })) return { error: 'Latitude and longitude are out of range', status: 400 };
    const t = nowMs(clock);
    const recordedAt = body && body.recordedAt != null ? Number(body.recordedAt) : t;
    const ts = isValidTimestamp(recordedAt, t, cfg());
    if (!ts.ok) return { error: ts.error, status: 400 };
    if (lastFix) {
      if (t - Number(lastFix.recordedAt) < minIntervalMs) {
        return { error: 'Location updates are throttled', status: 429, throttled: true, accepted: false };
      }
      if (isAbsurdJump(
        { lat: lastFix.lat, lng: lastFix.lng, at: lastFix.recordedAt },
        { lat, lng, at: recordedAt },
        cfg(),
      )) {
        return { error: 'Location jump is not plausible', status: 400 };
      }
    }
    const row = {
      id: newId(),
      routeId,
      lat,
      lng,
      accuracy: body && body.accuracy != null ? Number(body.accuracy) : null,
      heading: body && body.heading != null ? Number(body.heading) : null,
      speed: body && body.speed != null ? Number(body.speed) : null,
      recordedAt,
    };
    await store.addLocation(row);
    const cutoff = t - purgeDays * 24 * 60 * 60 * 1000;
    await store.purgeLocations(cutoff);
    const loc = locationView(route, row, t, cfg());
    return { accepted: true, location: loc, fulfill: false };
  }

  async function markDelivered(routeId, stopId, user) {
    const loaded = await loadJob(routeId);
    if (loaded.error) return loaded;
    const { route, stops } = loaded;
    const authz = await authorizeJobActor(route, user, 'mark a stop delivered');
    if (!authz.ok) return authz;
    if (route.status === 'ended') return { error: 'This job has ended', status: 400 };
    const stop = stops.find((s) => s.id === stopId);
    if (!stop) return { error: 'Stop not found', status: 404 };
    if (stop.status === 'delivered') return { route: operatorView(route, stops), alreadyDelivered: true };
    const at = nowMs(clock);
    stop.status = 'delivered';
    stop.deliveredAt = at;
    await store.saveStop(stop);
    await emit('delivered', { routeId: route.id, stopId: stop.id }, at);
    await refreshNextAndAlerts(route, stops, at, { started: false });
    const fresh = await store.listStops(route.id);
    return { route: operatorView(route, fresh), delivered: true };
  }

  async function computeEta(route, stops, customerStop, lastFix, loc, t) {
    if (loc.state !== 'live' || !loc.pin) return null;
    const points = remainingPath(loc.pin, stops, customerStop);
    if (points.length < 2) return null;
    const origin = points[0];
    const destination = points[points.length - 1];
    const intermediates = points.slice(1, -1);
    const key = serverMapsKey(env);
    const approx = () => approxEtaForPath(points, cfg());

    if (!key) return approx();

    const cacheKey = route.id;
    const cached = etaCache.get(cacheKey);
    if (cached && t - cached.at < etaCacheMs) return cached.result;

    const g = await googleRoutesEta({
      origin,
      destination,
      intermediates,
      apiKey: key,
      fetchImpl,
      timeoutMs: DEFAULTS.routesTimeoutMs,
    });
    if (!g.error) {
      const result = {
        etaMinutes: g.etaMinutes,
        distanceKm: g.distanceKm,
        etaSource: 'google_routes',
        etaLabel: null,
        note: g.note,
      };
      etaCache.set(cacheKey, { at: t, result });
      return result;
    }
    // Google Routes failed (403 or any error): hide ETA unless approx fallback is on.
    if (etaApproxFallback(env)) {
      const result = approx();
      etaCache.set(cacheKey, { at: t, result });
      return result;
    }
    const hidden = null;
    etaCache.set(cacheKey, { at: t, result: hidden });
    return hidden;
  }

  async function trackByToken(token) {
    const tok = String(token || '').trim();
    if (!tok) return { error: 'Missing token', status: 400 };
    // Reject short or malformed tokens before any store lookup.
    if (!isShareTokenFormat(tok)) return { error: 'Tracking link not found', status: 404 };
    const stop = await store.findStopByToken(tok);
    if (!stop) return { error: 'Tracking link not found', status: 404 };
    const route = await store.getRoute(stop.routeId);
    if (!route) return { error: 'Tracking link not found', status: 404 };
    const stops = await store.listStops(route.id);
    const lastFix = await store.lastLocation(route.id);
    const t = nowMs(clock);
    const events = await store.listEvents(stop.id);

    const delivered = stop.status === 'delivered';
    const ended = route.status === 'ended';
    // Customer sees a pin only while their stop is still pending (or next) and the job is active.
    let loc;
    if (delivered) {
      loc = { state: 'delivered', pin: null, message: 'This stop was completed. Location is no longer shared.' };
    } else if (ended) {
      loc = { state: 'ended', pin: null, message: 'This job has ended. Location is no longer shared.' };
    } else {
      loc = locationView(route, lastFix, t, cfg());
    }

    const away = delivered || ended ? null : stopsAway(stops, stop);
    const eta = delivered || ended ? null : await computeEta(route, stops, stop, lastFix, loc, t);

    return {
      kind: route.kind,
      status: route.status,
      providerLabel: route.providerLabel || 'Provider',
      stop: {
        id: stop.id,
        sequence: stop.sequence,
        role: stop.role,
        status: stop.status,
        label: stop.label,
        // Intentionally no shareToken echo of other stops, no other order refs, no other addresses.
      },
      location: loc,
      stopsAway: away,
      isNext: stop.status === 'next',
      eta,
      events: events.map((e) => ({
        event: e.event,
        at: e.at,
        sent: false,
        channel: null,
        note: e.note || ALERT_NOTE,
      })),
      // Never expose server maps key, other tokens, or other customers.
    };
  }

  async function entitlementFor(actor, storeId, injected) {
    if (storeId) {
      const access = await requireStoreAccess(actor && actor.id, storeId);
      if (!access.ok) return { error: access.error, status: 403 };
      if (injected) return injected;
      return resolveEntitlement(opts.pool || (store && store.pool), { userId: actor && actor.id, storeId }, env, {
        store: access.store,
        lookupStore,
      });
    }
    if (injected) return injected;
    return resolveEntitlement(opts.pool || (store && store.pool), { userId: actor && actor.id, storeId }, env, {
      lookupStore,
    });
  }

  async function statusFor(actor, storeId, injected) {
    const entitlement = await entitlementFor(actor, storeId, injected);
    if (entitlement && entitlement.error) return entitlement;
    const gate = trackingPaidGate(entitlement, env);
    let usedVehicles = 0;
    if (typeof store.countOpenJobs === 'function' && actor) {
      usedVehicles = await store.countOpenJobs({ sellerUserId: actor.id, storeId });
    }
    return {
      requirePaid: gate.requirePaid,
      allowed: gate.allowed,
      locked: !gate.allowed,
      upgrade: !gate.allowed,
      message: gate.allowed ? null : gate.message,
      planNames: gate.planNames || [],
      reason: gate.reason || null,
      includedVehicles: gate.includedVehicles,
      extraVehicles: gate.extraVehicles,
      maxVehicles: gate.maxVehicles,
      usedVehicles,
      extraVehiclePriceTtd: gate.extraVehiclePriceTtd,
      premiumIntroPriceTtd: gate.premiumIntroPriceTtd,
      premiumThenPriceTtd: gate.premiumThenPriceTtd,
      premiumIntroMonths: gate.premiumIntroMonths,
      // Customer tracking pages stay free.
      customerTrackFree: true,
    };
  }

  return {
    createRoute,
    getRoute,
    startRoute,
    endRoute,
    reportLocation,
    markDelivered,
    trackByToken,
    statusFor,
    entitlementFor,
    store,
    cfg,
  };
}

module.exports = {
  KINDS,
  DEFAULTS,
  LOCKED_FALLBACK_COPY,
  ALERT_NOTE,
  loadJuvayPlanPrices,
  clearPlanPricesCache,
  vehicleCap,
  trackingExtraVehicles,
  ALERT_EVENTS,
  createTracking,
  createMemoryStore,
  createFileStore,
  createPgStore,
  trackingPaidGate,
  trackingPlanTiers,
  trackingRequirePaid,
  etaApproxFallback,
  serverMapsKey,
  lockedCopy,
  planDisplayNames,
  isPaidTier,
  locationView,
  haversineKm,
  validLatLng,
  isAbsurdJump,
  isValidTimestamp,
  etaApproxMinutes,
  approxEtaForPath,
  remainingPath,
  stopsAway,
  canDrive,
  googleRoutesEta,
  resolveEntitlement,
  createRateLimiter,
  parseDurationSeconds,
  newShareToken,
  isShareTokenFormat,
  assertStoreAccess,
  lookupStoreFromPool,
  STORE_ACCESS_DENIED,
  SHARE_TOKEN_MIN_LENGTH,
};
