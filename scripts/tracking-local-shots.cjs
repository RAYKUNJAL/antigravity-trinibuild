/**
 * Local-only: seed a file store, serve the tracking API, screenshot driver
 * and customer pages. Not for production. Clearly labeled "Local test".
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  createTracking,
  createFileStore,
} = require('../server/deliveryTracking');

const ROOT = path.join(__dirname, '..');
const STORE = path.join('/tmp', 'juvay-tracking-local.json');
const SHOTS = process.env.SHOTS_DIR || '/workspace/juvay-tracking-shots';
const API_PORT = Number(process.env.TRACKING_SHOT_API_PORT || 3001);
const WEB_PORT = Number(process.env.TRACKING_SHOT_WEB_PORT || 5173);
const JWT = 'local-driver-token';
const DRIVER = { id: 'driver-1' };
const SELLER = { id: 'seller-1' };
const PAID = { planTier: 'premium', trackingExtraVehicles: 10 };

function writeEmpty() {
  fs.writeFileSync(STORE, JSON.stringify({ routes: [], stops: [], locations: [], events: [] }));
}

async function seed() {
  writeEmpty();
  const store = createFileStore(STORE);
  let t = Date.now() - 5 * 60 * 1000;
  const staleApi = createTracking({
    store,
    env: { TRACKING_REQUIRE_PAID: 'false' },
    now: () => t,
    alerter: { emit() {} },
  });
  const stale = await staleApi.createRoute(SELLER, {
    kind: 'route',
    driverUserId: DRIVER.id,
    providerLabel: 'Provider',
    stops: [
      { orderRef: 'local-stale', label: 'Local test stop', lat: 13.113, lng: -59.599 },
    ],
  }, PAID);
  await staleApi.startRoute(stale.route.id, DRIVER);
  await staleApi.reportLocation(stale.route.id, DRIVER, { lat: 13.114, lng: -59.6 });

  t = Date.now();
  const liveApi = createTracking({
    store,
    env: { TRACKING_REQUIRE_PAID: 'false' },
    now: () => t,
    alerter: { emit() {} },
  });
  const live = await liveApi.createRoute(SELLER, {
    kind: 'route',
    driverUserId: DRIVER.id,
    providerLabel: 'Provider',
    stops: [
      { orderRef: 'local-live', label: 'Local test drop-off', lat: 13.12, lng: -59.61 },
    ],
  }, PAID);
  await liveApi.startRoute(live.route.id, DRIVER);
  await liveApi.reportLocation(live.route.id, DRIVER, { lat: 13.119, lng: -59.608 });

  const planned = await liveApi.createRoute(SELLER, {
    kind: 'delivery',
    driverUserId: DRIVER.id,
    providerLabel: 'Provider',
    stops: [
      { role: 'pickup', label: 'Pickup (local)', lat: 13.10, lng: -59.62 },
      { role: 'dropoff', label: 'Drop-off (local)', lat: 13.13, lng: -59.60 },
    ],
  }, PAID);

  const quiet = await liveApi.createRoute(SELLER, {
    kind: 'visit',
    driverUserId: DRIVER.id,
    providerLabel: 'Provider',
    stops: [{ role: 'visit', label: 'Visit address (local)', lat: 13.11, lng: -59.59 }],
  }, PAID);
  await liveApi.startRoute(quiet.route.id, DRIVER);

  return {
    staleToken: stale.route.stops[0].shareToken,
    staleRouteId: stale.route.id,
    liveToken: live.route.stops[0].shareToken,
    liveRouteId: live.route.id,
    plannedRouteId: planned.route.id,
    quietToken: quiet.route.stops[0].shareToken,
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function startApi() {
  const store = createFileStore(STORE);
  const tracking = createTracking({
    store,
    env: { TRACKING_REQUIRE_PAID: 'false' },
    alerter: { emit() {} },
  });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const auth = req.headers.authorization || '';
    const user = auth.includes(JWT) ? DRIVER : (auth.startsWith('Bearer ') ? SELLER : null);
    const send = (code, obj) => {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = code;
      res.end(JSON.stringify(obj));
    };
    const serveStatic = () => {
      const dist = path.join(ROOT, 'dist');
      let rel = url.pathname === '/' ? '/index.html' : url.pathname;
      rel = path.normalize(rel).replace(/^(\.\.[/\\])+/, '');
      let file = path.join(dist, rel);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        file = path.join(dist, 'index.html');
      }
      const ext = path.extname(file).toLowerCase();
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon' };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    };
    if (!url.pathname.startsWith('/api/')) {
      return serveStatic();
    }
    try {
      if (req.method === 'GET' && url.pathname === '/api/tracking/status') {
        return send(200, await tracking.statusFor(user, url.searchParams.get('storeId')));
      }
      const routeGet = url.pathname.match(/^\/api\/routes\/([^/]+)$/);
      if (req.method === 'GET' && routeGet) {
        const result = await tracking.getRoute(routeGet[1], user);
        return send(result.error ? result.status || 400 : 200, result.error ? { error: result.error } : result);
      }
      const start = url.pathname.match(/^\/api\/routes\/([^/]+)\/start$/);
      if (req.method === 'POST' && start) {
        const result = await tracking.startRoute(start[1], user);
        return send(result.error ? result.status || 400 : 200, result);
      }
      const loc = url.pathname.match(/^\/api\/routes\/([^/]+)\/location$/);
      if (req.method === 'POST' && loc) {
        const body = await readBody(req);
        const result = await tracking.reportLocation(loc[1], user, body);
        return send(result.error ? result.status || 400 : 200, result);
      }
      const end = url.pathname.match(/^\/api\/routes\/([^/]+)\/end$/);
      if (req.method === 'POST' && end) {
        const result = await tracking.endRoute(end[1], user);
        return send(result.error ? result.status || 400 : 200, result);
      }
      const delivered = url.pathname.match(/^\/api\/routes\/([^/]+)\/stops\/([^/]+)\/delivered$/);
      if (req.method === 'POST' && delivered) {
        const result = await tracking.markDelivered(delivered[1], delivered[2], user);
        return send(result.error ? result.status || 400 : 200, result);
      }
      const track = url.pathname.match(/^\/api\/track\/([^/]+)$/);
      if (req.method === 'GET' && track) {
        const result = await tracking.trackByToken(decodeURIComponent(track[1]));
        return send(result.error ? result.status || 400 : 200, result);
      }
      send(404, { error: 'Not found', path: url.pathname });
    } catch (err) {
      console.error(err);
      send(500, { error: 'Tracking request failed' });
    }
  });
  return new Promise((resolve) => server.listen(WEB_PORT, '127.0.0.1', () => resolve(server)));
}

function waitHttp(url, timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(true); });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('timeout waiting for ' + url));
        else setTimeout(tryOnce, 400);
      });
    };
    tryOnce();
  });
}

async function shots(ids) {
  const puppeteer = require('puppeteer');
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1440, height: 900 },
  });
  const origin = `http://127.0.0.1:${WEB_PORT}`;
  const pages = [
    { name: 'driver-planned', path: `/driver/route/${ids.plannedRouteId}`, auth: true },
    { name: 'driver-active', path: `/driver/route/${ids.liveRouteId}`, auth: true },
    { name: 'customer-not-sharing', path: `/track/${ids.quietToken}`, auth: false },
    { name: 'customer-live', path: `/track/${ids.liveToken}`, auth: false },
    { name: 'customer-stale', path: `/track/${ids.staleToken}`, auth: false },
  ];
  const widths = [390, 1440];
  for (const pageSpec of pages) {
    for (const width of widths) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1 });
      if (pageSpec.auth) {
        await page.evaluateOnNewDocument((tok) => {
          localStorage.setItem('tb_token', tok);
        }, JWT);
      }
      await page.goto(origin + pageSpec.path, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 2500)); // OSM tiles
      const dest = path.join(SHOTS, `${pageSpec.name}-${width}.png`);
      await page.screenshot({ path: dest, fullPage: true });
      console.log('wrote', dest);
      await page.close();
    }
  }
  await browser.close();
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  const ids = await seed();
  fs.writeFileSync(path.join(SHOTS, 'local-ids.json'), JSON.stringify({ ...ids, note: 'LOCAL TEST only — not live' }, null, 2));
  console.log('seeded', ids);
  const api = await startApi();
  console.log('local app+api on', WEB_PORT);
  try {
    await waitHttp(`http://127.0.0.1:${WEB_PORT}/`);
    await shots(ids);
  } finally {
    api.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
