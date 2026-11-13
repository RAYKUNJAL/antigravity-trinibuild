/**
 * Express mount for shared live-tracking.
 * Auth'd seller/driver writes, public GET /api/track/:token (unguessable).
 * Rate-limited, fail closed, JSON only. Never exposes GOOGLE_MAPS_SERVER_KEY.
 */
'use strict';

const {
  createTracking,
  createFileStore,
  createMemoryStore,
  createPgStore,
  createRateLimiter,
  DEFAULTS,
  trackingPaidGate,
} = require('./deliveryTracking');

function sendResult(res, result, okStatus) {
  if (!result) return res.status(500).json({ error: 'Unexpected empty result' });
  if (result.error) {
    const status = result.status || 400;
    const body = { error: result.error };
    if (result.locked) body.locked = true;
    if (result.upgrade) body.upgrade = true;
    if (result.planNames) body.planNames = result.planNames;
    if (result.message) body.message = result.message;
    if (result.throttled) body.throttled = true;
    if (result.accepted === false) body.accepted = false;
    return res.status(status).json(body);
  }
  return res.status(okStatus || 200).json(result);
}

function actorFrom(req) {
  return req.user ? { id: String(req.user.id), email: req.user.email, role: req.user.role } : null;
}

function clientKey(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

function isUndefinedTable(err) {
  return err && (err.code === '42P01' || /does not exist/i.test(String(err.message || '')));
}

function setupStore(opts) {
  if (opts.tracking) return { tracking: opts.tracking, storeKind: 'injected' };
  if (opts.store) return { tracking: createTracking({ store: opts.store, env: opts.env, pool: opts.pool, fetch: opts.fetch, alerter: opts.alerter }), storeKind: opts.store.kind };
  const filePath = process.env.TRACKING_STORE_PATH;
  if (opts.pool) {
    return {
      tracking: createTracking({ pool: opts.pool, store: createPgStore(opts.pool), env: opts.env, fetch: opts.fetch }),
      storeKind: 'pg',
    };
  }
  if (filePath) {
    const store = createFileStore(filePath);
    return { tracking: createTracking({ store, env: opts.env, fetch: opts.fetch }), storeKind: 'file' };
  }
  return { tracking: createTracking({ store: createMemoryStore(), env: opts.env, fetch: opts.fetch }), storeKind: 'memory' };
}

function mountDeliveryTrackingRoutes(app, opts = {}) {
  const { auth, methodNotAllowed, pool } = opts;
  const { tracking, storeKind } = setupStore({ ...opts, pool });
  const locLimit = createRateLimiter({
    windowMs: DEFAULTS.locationRateWindowMs,
    max: DEFAULTS.locationRateMax,
  });
  const trackLimit = createRateLimiter({
    windowMs: DEFAULTS.trackRateWindowMs,
    max: DEFAULTS.trackRateMax,
  });

  function requireAuth(req, res, next) {
    if (typeof auth === 'function') return auth(req, res, next);
    return res.status(401).json({ error: 'No token' });
  }

  const mna = (allow, usePath) => {
    if (typeof methodNotAllowed === 'function') return methodNotAllowed(allow, usePath);
    return (_req, res) => {
      res.set('Allow', allow);
      res.status(405).json({ error: `Use ${allow} ${usePath}`, allow });
    };
  };

  async function safe(res, fn) {
    try {
      return await fn();
    } catch (err) {
      if (isUndefinedTable(err)) {
        return res.status(503).json({ error: 'Tracking is not set up on this server. Apply deploy/schema-delivery-tracking.sql.' });
      }
      console.error('tracking-route', err);
      return res.status(500).json({ error: 'Tracking request failed' });
    }
  }

  app.get('/api/tracking/status', requireAuth, (req, res) => safe(res, async () => {
    const storeId = req.query.storeId || req.query.store_id;
    const result = await tracking.statusFor(actorFrom(req), storeId);
    return sendResult(res, result);
  }));

  app.get('/api/routes', mna('POST', '/api/routes'));
  app.post('/api/routes', requireAuth, (req, res) => safe(res, async () => {
    const actor = actorFrom(req);
    const body = req.body || {};
    const entitlement = await tracking.entitlementFor(actor, body.storeId || body.store_id);
    // Fail closed: if paid is required and we have no proof, the gate denies.
    const result = await tracking.createRoute(actor, body, entitlement);
    return sendResult(res, result, 201);
  }));

  app.get('/api/routes/:id', requireAuth, (req, res) => safe(res, async () => {
    const result = await tracking.getRoute(req.params.id, actorFrom(req));
    return sendResult(res, result);
  }));

  app.get('/api/routes/:id/start', mna('POST', `/api/routes/${reqParam('id')}/start`));
  app.post('/api/routes/:id/start', requireAuth, (req, res) => safe(res, async () => {
    const result = await tracking.startRoute(req.params.id, actorFrom(req));
    return sendResult(res, result);
  }));

  app.get('/api/routes/:id/location', mna('POST', '/api/routes/:id/location'));
  app.post('/api/routes/:id/location', requireAuth, (req, res) => safe(res, async () => {
    const rl = locLimit(`${actorFrom(req)?.id || clientKey(req)}:${req.params.id}`);
    if (!rl.ok) {
      res.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 1000) / 1000)));
      return res.status(429).json({ error: 'Too many location updates', throttled: true, accepted: false });
    }
    const result = await tracking.reportLocation(req.params.id, actorFrom(req), req.body || {});
    return sendResult(res, result);
  }));

  app.get('/api/routes/:id/stops/:stopId/delivered', mna('POST', '/api/routes/:id/stops/:stopId/delivered'));
  app.post('/api/routes/:id/stops/:stopId/delivered', requireAuth, (req, res) => safe(res, async () => {
    const result = await tracking.markDelivered(req.params.id, req.params.stopId, actorFrom(req));
    return sendResult(res, result);
  }));

  app.get('/api/routes/:id/end', mna('POST', '/api/routes/:id/end'));
  app.post('/api/routes/:id/end', requireAuth, (req, res) => safe(res, async () => {
    const result = await tracking.endRoute(req.params.id, actorFrom(req));
    return sendResult(res, result);
  }));

  // Public, unguessable token. Customer tracking is free.
  app.post('/api/track/:token', mna('GET', '/api/track/:token'));
  app.get('/api/track/:token', (req, res) => safe(res, async () => {
    const rl = trackLimit(`${clientKey(req)}:${req.params.token}`);
    if (!rl.ok) {
      res.set('Retry-After', String(Math.ceil((rl.retryAfterMs || 1000) / 1000)));
      return res.status(429).json({ error: 'Too many tracking requests' });
    }
    const result = await tracking.trackByToken(req.params.token);
    return sendResult(res, result);
  }));

  return { tracking, storeKind };
}

function reqParam(name) {
  return `:${name}`;
}

module.exports = { mountDeliveryTrackingRoutes, sendResult };
