// server.js — minimal HTTP server (vanilla node:http, zero deps)
'use strict';
const http = require('node:http');
const store = require('./src/store');

const PORT = Number(process.env.PORT || 4000);

function sendJson(res, status, value) {
  const body = JSON.stringify(value, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 1_000_000) req.destroy(); else chunks.push(c); });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

const landing = () => `<!DOCTYPE html><html><head><title>Caribbean AI Trade Network</title>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
body{font-family:system-ui,sans-serif;background:#0b1220;color:#e8eef7;margin:0;line-height:1.6}
.wrap{max-width:1000px;margin:0 auto;padding:40px 24px}
h1{color:#22d3ee} .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;margin-left:8px}
.badge.unclaimed{background:#3b82f6;color:#fff}.badge.claimed{background:#64748b;color:#fff}
.badge.verified{background:#22c55e;color:#fff}.badge.trade{background:#a3e635;color:#111}
.biz{border:1px solid #1e293b;border-radius:12px;padding:16px;margin:12px 0;background:#0f172a}
.muted{color:#94a3b8;font-size:14px}.mono{font-family:monospace;font-size:12px;color:#64748b}
a{color:#22d3ee}
</style></head><body><div class="wrap">
<h1>Caribbean AI Trade Network</h1>
<p class="muted">Trustworthy B2B trade infrastructure. Vertical slice live: source-backed discovery → claim → verification → product publish → RFQ.</p>
<h2>Business directory (${store.listBusinesses().length})</h2>
${store.listBusinesses().map(b => `<div class="biz">
  <div><strong>${b.name}</strong><span class="badge ${b.state==='TRADE_VERIFIED'?'trade':b.state==='IDENTITY_VERIFIED'||b.state==='TRANSACTION_VERIFIED'?'verified':b.state==='CLAIMED'?'claimed':'unclaimed'}">${b.label}</span></div>
  <div class="muted">${b.country}${b.city?' · '+b.city:''} · ${b.category||'uncategorized'}</div>
  ${b.disclaimer?`<div class="muted" style="font-size:13px;font-style:italic;margin-top:6px">${b.disclaimer}</div>`:''}
  <div class="mono">${b.id}</div>
</div>`).join('')}
<p><a href="/api/activity">Activity log</a> · <a href="/api/health">Health</a></p>
</div></body></html>`;

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (req.method === 'GET' && p === '/') return sendHtml(res, 200, landing());
  if (req.method === 'GET' && p === '/api/health') return sendJson(res, 200, { ok: true, service: 'caribbean-ai-trade-network', businesses: store.listBusinesses().length, rfqs: store.listRfqs().length });

  // directory + profile
  if (req.method === 'GET' && p === '/api/businesses') return sendJson(res, 200, { ok: true, data: store.listBusinesses() });
  let m = p.match(/^\/api\/businesses\/([^/]+)$/);
  if (req.method === 'GET' && m) {
    const b = store.getBusiness(m[1]);
    return b ? sendJson(res, 200, { ok: true, data: store.publicBusiness(b), products: store.listProducts(b.id) }) : sendJson(res, 404, { ok: false, error: 'not_found' });
  }

  // claim
  m = p.match(/^\/api\/businesses\/([^/]+)\/claim$/);
  if (req.method === 'POST' && m) {
    const body = await readBody(req);
    if (!body.email) return sendJson(res, 400, { ok: false, error: 'email required' });
    const rep = store.upsertRepresentative({ email: body.email, name: body.name, role: body.role });
    const out = store.claimBusiness(m[1], rep.id);
    return out.ok ? sendJson(res, 200, { ok: true, data: out.business }) : sendJson(res, 409, { ok: false, error: out.error });
  }

  // evidence
  m = p.match(/^\/api\/businesses\/([^/]+)\/evidence$/);
  if (req.method === 'POST' && m) {
    const body = await readBody(req);
    const out = store.submitEvidence(m[1], body.representative_id, body.dimension, body.note);
    return out.ok ? sendJson(res, 200, { ok: true, data: out.business }) : sendJson(res, 400, { ok: false, error: out.error });
  }

  // admin approve evidence
  m = p.match(/^\/api\/admin\/([^/]+)\/approve$/);
  if (req.method === 'POST' && m) {
    const body = await readBody(req);
    const out = store.approveEvidence(m[1], body.dimension);
    return out.ok ? sendJson(res, 200, { ok: true, data: out.business }) : sendJson(res, 400, { ok: false, error: out.error });
  }

  // products
  m = p.match(/^\/api\/businesses\/([^/]+)\/products$/);
  if (req.method === 'POST' && m) {
    const body = await readBody(req);
    const out = store.addProduct(m[1], body.representative_id, body);
    return out.ok ? sendJson(res, 201, { ok: true, data: out.product }) : sendJson(res, 403, { ok: false, error: out.error });
  }

  // rfq
  if (req.method === 'POST' && p === '/api/rfqs') {
    const body = await readBody(req);
    if (!body.product || !body.buyer_email) return sendJson(res, 400, { ok: false, error: 'product and buyer_email required' });
    return sendJson(res, 201, { ok: true, data: store.createRfq(body) });
  }
  if (req.method === 'GET' && p === '/api/rfqs') return sendJson(res, 200, { ok: true, data: store.listRfqs() });

  // activity
  if (req.method === 'GET' && p === '/api/activity') return sendJson(res, 200, { ok: true, data: store.listActivity(url.searchParams.get('limit')) });

  return sendJson(res, 404, { ok: false, error: 'not_found' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => { console.error(e); sendJson(res, 500, { ok: false, error: 'server_error' }); });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => console.log(`Caribbean AI Trade Network listening on http://0.0.0.0:${PORT}`));
}
module.exports = { server, handle };
