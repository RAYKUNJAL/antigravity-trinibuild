/**
 * Bring-my-store-over import + photo-listing quota.
 * Fail-closed: SSRF-guarded URL fetch, prices only when found in source
 * or typed by the seller, drafts only. Do not restore socialImportService mocks.
 */
'use strict';

const dns = require('dns').promises;
const net = require('net');
const { URL } = require('url');
const { buildOnboardVision } = require('./onboardVision');

const FREE_PHOTO_LISTINGS = 5;
const MAX_HTML_BYTES = 1_500_000;
const MAX_CSV_BYTES = 1_000_000;
const MAX_JSON_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_IMPORT_ITEMS = 50;
const ALLOWED_PORTS = new Set([80, 443]);

const COMING_WITH_PREMIUM =
  'Bring my store over is coming with Premium. Premium checkout is not open yet (PREMIUM_CHECKOUT_ENABLED=false).';
const PHOTO_QUOTA_LOCKED =
  'You have used your 5 free photo listings. Unlimited photo listings are coming with Premium.';
const NO_PRICE = 'Price was not found in the source. Type the TT$ price before you publish.';

function isImportPremiumRequired(env) {
  const e = env || process.env;
  const v = String(e.IMPORT_REQUIRE_PREMIUM == null ? 'true' : e.IMPORT_REQUIRE_PREMIUM)
    .trim()
    .toLowerCase();
  return !(v === 'false' || v === '0' || v === 'off' || v === 'no');
}

function isPremiumStore(store) {
  const tier = String(store?.plan_tier || store?.plan || 'free').trim().toLowerCase();
  return tier === 'premium';
}

function importGate(store, env) {
  if (!isImportPremiumRequired(env)) return { allowed: true, require_premium: false };
  if (isPremiumStore(store)) return { allowed: true, require_premium: true };
  return {
    allowed: false,
    require_premium: true,
    locked: true,
    coming_with_premium: true,
    message: COMING_WITH_PREMIUM,
  };
}

function photoQuotaState(store, usedRaw) {
  const used = Math.max(0, Number(usedRaw) || 0);
  if (isPremiumStore(store)) {
    return { used, cap: null, remaining: null, unlimited: true, locked: false };
  }
  const remaining = Math.max(0, FREE_PHOTO_LISTINGS - used);
  return {
    used,
    cap: FREE_PHOTO_LISTINGS,
    remaining,
    unlimited: false,
    locked: remaining <= 0,
    message: remaining <= 0 ? PHOTO_QUOTA_LOCKED : undefined,
  };
}

function statusPayload(store, env) {
  const used = store ? store.photo_listings_used : 0;
  const quota = photoQuotaState(store || { plan_tier: 'free' }, used);
  const gate = importGate(store || { plan_tier: 'free' }, env);
  return {
    free_photo_listings: FREE_PHOTO_LISTINGS,
    import_require_premium: isImportPremiumRequired(env),
    premium: isPremiumStore(store),
    import: gate,
    photo_quota: quota,
    message: gate.allowed
      ? 'URL, CSV and bulk photos land as drafts you review and confirm. Prices appear only when found in the source or typed by you.'
      : gate.message,
  };
}

// ─── SSRF guard ──────────────────────────────────────────────

function isPrivateIpv4(ip) {
  const p = ip.split('.').map((n) => Number(n));
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  if (p[0] === 0 || p[0] === 10 || p[0] === 127) return true;
  if (p[0] === 169 && p[1] === 254) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;
  if (p[0] === 192 && p[1] === 0 && (p[2] === 0 || p[2] === 2)) return true;
  if (p[0] === 198 && (p[1] === 18 || p[1] === 19 || (p[1] === 51 && p[2] === 100))) return true;
  if (p[0] === 203 && p[1] === 0 && p[2] === 113) return true;
  if (p[0] >= 224) return true;
  return false;
}

function extractIpv4FromV6(ip) {
  const lower = String(ip || '').toLowerCase();
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return mapped[1];
  const dotted = lower.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (dotted) {
    const a = parseInt(dotted[1], 16);
    const b = parseInt(dotted[2], 16);
    return `${(a >> 8) & 255}.${a & 255}.${(b >> 8) & 255}.${b & 255}`;
  }
  return null;
}

function isPrivateIp(ip) {
  const raw = String(ip || '').trim().replace(/^\[|\]$/g, '');
  if (!raw) return true;
  const v4 = net.isIP(raw) === 4 ? raw : extractIpv4FromV6(raw);
  if (v4) return isPrivateIpv4(v4);
  if (net.isIP(raw) === 6) {
    const n = raw.toLowerCase();
    if (n === '::' || n === '::1') return true;
    if (n.startsWith('fc') || n.startsWith('fd') || n.startsWith('fe80') || n.startsWith('ff')) return true;
    return false;
  }
  return true;
}

function normalizeHostname(host) {
  return String(host || '')
    .trim()
    .toLowerCase()
    .replace(/^\[([0-9a-f:%.]+)\]$/i, '$1')
    .replace(/\.$/, '');
}

function assertSafeUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw || '').trim());
  } catch {
    return { error: 'Enter a public http or https store URL.', status: 400 };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'Only http and https URLs can be imported.', status: 400 };
  }
  if (parsed.username || parsed.password) {
    return { error: 'URLs with a username or password are not allowed.', status: 400 };
  }
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  if (!ALLOWED_PORTS.has(port)) {
    return { error: 'Only ports 80 and 443 are allowed.', status: 400 };
  }
  const host = normalizeHostname(parsed.hostname);
  if (!host) return { error: 'Enter a public http or https store URL.', status: 400 };
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan') ||
    host === 'metadata.google.internal'
  ) {
    return { error: 'That address is not a public store URL.', status: 400 };
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    return { error: 'That address is not a public store URL.', status: 400 };
  }
  return { url: parsed };
}

async function resolvePublicHost(hostname, lookupFn) {
  const host = normalizeHostname(hostname);
  if (net.isIP(host)) {
    if (isPrivateIp(host)) return { error: 'That address is not a public store URL.', status: 400 };
    return { addresses: [host] };
  }
  const lookup = lookupFn || ((name, opts) => dns.lookup(name, opts));
  let records;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    return { error: 'Could not look up that host.', status: 400 };
  }
  const list = Array.isArray(records) ? records : records ? [records] : [];
  const addresses = list.map((r) => (typeof r === 'string' ? r : r.address)).filter(Boolean);
  if (addresses.length === 0) return { error: 'Could not look up that host.', status: 400 };
  if (addresses.some((ip) => isPrivateIp(ip))) {
    return { error: 'That address is not a public store URL.', status: 400 };
  }
  return { addresses };
}

async function assertPublicUrl(raw, lookupFn) {
  const checked = assertSafeUrl(raw);
  if (checked.error) return checked;
  const resolved = await resolvePublicHost(checked.url.hostname, lookupFn);
  if (resolved.error) return resolved;
  return { url: checked.url, addresses: resolved.addresses };
}

async function readLimited(res, maxBytes) {
  const len = Number(res.headers?.get?.('content-length') || 0);
  if (len && len > maxBytes) {
    return { error: 'That page is too large to import.', status: 400 };
  }
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) return { error: 'That page is too large to import.', status: 400 };
    return { text: buf.toString('utf8') };
  }
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      try { reader.cancel(); } catch { /* ignore */ }
      return { error: 'That page is too large to import.', status: 400 };
    }
    chunks.push(Buffer.from(value));
  }
  return { text: Buffer.concat(chunks).toString('utf8') };
}

async function fetchPublicText(rawUrl, opts = {}) {
  const fetchFn = opts.fetchFn || fetch;
  const lookupFn = opts.lookupFn;
  const timeout = opts.timeoutMs || FETCH_TIMEOUT_MS;
  const maxBytes = opts.maxBytes || MAX_HTML_BYTES;
  const accept = opts.accept || 'text/html,application/json,application/ld+json,text/plain;q=0.5';
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const checked = await assertPublicUrl(current, lookupFn);
    if (checked.error) return checked;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    let res;
    try {
      res = await fetchFn(checked.url.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: ac.signal,
        headers: {
          'User-Agent': 'JuvayStoreImport/1.0',
          Accept: accept,
        },
      });
    } catch (err) {
      const aborted = err && (err.name === 'AbortError' || /aborted/i.test(String(err.message || '')));
      return { error: aborted ? 'The store page timed out.' : 'Could not fetch that store page.', status: 400 };
    } finally {
      clearTimeout(timer);
    }
    const loc = res.headers?.get?.('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      current = new URL(loc, checked.url).toString();
      continue;
    }
    if (!res.ok) {
      return { error: `The store page returned ${res.status}.`, status: 400 };
    }
    const body = await readLimited(res, maxBytes);
    if (body.error) return body;
    return { url: checked.url.toString(), text: body.text, contentType: res.headers?.get?.('content-type') || '' };
  }
  return { error: 'Too many redirects.', status: 400 };
}

// ─── Parsers ─────────────────────────────────────────────────

function parseFoundPrice(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }
  const text = String(raw).trim();
  if (!text) return null;
  const cleaned = text.replace(/,/g, '').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function decodeHtml(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(tag, name) {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = String(tag || '').match(re);
  return m ? decodeHtml(m[1]) : '';
}

function collectJsonLd(html) {
  const blocks = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = String(m[1] || '').trim();
    if (!raw) continue;
    try {
      blocks.push(JSON.parse(raw));
    } catch {
      // ignore invalid JSON-LD
    }
  }
  return blocks;
}

function walkJsonLd(node, acc) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((n) => walkJsonLd(n, acc));
    return;
  }
  if (typeof node !== 'object') return;
  if (node['@graph']) walkJsonLd(node['@graph'], acc);
  const types = []
    .concat(node['@type'] || [])
    .map((t) => String(t).toLowerCase());
  if (types.includes('product') || types.includes('http://schema.org/product') || types.includes('https://schema.org/product')) {
    acc.push(node);
  }
  if (node.itemListElement) walkJsonLd(node.itemListElement, acc);
  if (node.item) walkJsonLd(node.item, acc);
}

function jsonLdImage(node) {
  const img = node.image || node.images;
  if (!img) return '';
  if (typeof img === 'string') return img.trim();
  if (Array.isArray(img)) {
    const first = img[0];
    if (!first) return '';
    if (typeof first === 'string') return first.trim();
    return String(first.url || first.contentUrl || '').trim();
  }
  return String(img.url || img.contentUrl || '').trim();
}

function jsonLdPrice(node) {
  const offers = node.offers || node.offer;
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  for (const offer of list) {
    const found = parseFoundPrice(offer.price ?? offer.lowPrice ?? offer.highPrice);
    if (found != null) return found;
  }
  return parseFoundPrice(node.price);
}

function productFromJsonLd(node) {
  const name = decodeHtml(node.name || node.title || '').slice(0, 200);
  if (!name) return null;
  const price = jsonLdPrice(node);
  return {
    name,
    description: decodeHtml(node.description || '').slice(0, 2000),
    price,
    price_found: price != null,
    image_url: jsonLdImage(node).slice(0, 500),
    category: decodeHtml(node.category || node.brand?.name || '').slice(0, 80),
    source: 'json-ld',
  };
}

function parseOpenGraph(html) {
  const metas = {};
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const prop = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase();
    if (!prop) continue;
    const content = attr(tag, 'content');
    if (!content) continue;
    metas[prop] = content;
  }
  const name = (metas['og:title'] || metas['twitter:title'] || '').slice(0, 200);
  const price = parseFoundPrice(
    metas['product:price:amount'] || metas['og:price:amount'] || metas['twitter:data1'],
  );
  if (!name && !metas['og:image']) return null;
  if (!name) return null;
  return {
    name,
    description: (metas['og:description'] || metas['description'] || '').slice(0, 2000),
    price,
    price_found: price != null,
    image_url: (metas['og:image'] || metas['twitter:image'] || '').slice(0, 500),
    category: (metas['product:category'] || '').slice(0, 80),
    source: 'opengraph',
  };
}

function looksLikeShopify(html, pageUrl) {
  const text = String(html || '');
  if (/cdn\.shopify\.com|Shopify\.theme|Shopify\.shop/i.test(text)) return true;
  try {
    const u = new URL(pageUrl);
    if (u.hostname.endsWith('.myshopify.com')) return true;
  } catch {
    // ignore
  }
  return false;
}

function parseShopifyProductsJson(text) {
  let data;
  try {
    data = JSON.parse(String(text || ''));
  } catch {
    return { error: 'The products list was not valid JSON.', status: 400 };
  }
  const list = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
  const items = [];
  for (const p of list) {
    if (items.length >= MAX_IMPORT_ITEMS) break;
    const name = decodeHtml(p.title || p.name || '').slice(0, 200);
    if (!name) continue;
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const firstPrice = variants
      .map((v) => parseFoundPrice(v.price ?? v.price_amount))
      .find((n) => n != null);
    const images = Array.isArray(p.images) ? p.images : [];
    const image = String(p.image?.src || images[0]?.src || p.image_url || '').slice(0, 500);
    items.push({
      name,
      description: decodeHtml(p.body_html || p.description || '').slice(0, 2000),
      price: firstPrice == null ? null : firstPrice,
      price_found: firstPrice != null,
      image_url: image,
      category: decodeHtml(p.product_type || p.productType || p.vendor || '').slice(0, 80),
      source: 'shopify',
    });
  }
  return { items };
}

function parseStoreHtml(html, pageUrl) {
  const products = [];
  const seen = new Set();
  const push = (item) => {
    if (!item || !item.name) return;
    const key = item.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    products.push({
      name: item.name,
      description: item.description || '',
      price: item.price_found ? item.price : null,
      price_found: !!item.price_found && item.price != null,
      image_url: item.image_url || '',
      category: item.category || '',
      source: item.source || 'html',
    });
  };
  const ld = [];
  collectJsonLd(html).forEach((block) => walkJsonLd(block, ld));
  ld.forEach((node) => push(productFromJsonLd(node)));
  if (products.length === 0) {
    const og = parseOpenGraph(html);
    if (og) push(og);
  }
  return {
    items: products.slice(0, MAX_IMPORT_ITEMS),
    shopifyHint: looksLikeShopify(html, pageUrl),
  };
}

function parseCsv(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '');
  if (Buffer.byteLength(raw, 'utf8') > MAX_CSV_BYTES) {
    return { error: 'The CSV is too large.', status: 400 };
  }
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (rows.length < 2) return { error: 'CSV needs a header row and at least one product.', status: 400 };
  const header = rows[0].map((h) => String(h || '').trim().toLowerCase().replace(/\s+/g, '_'));
  const idx = (aliases) => header.findIndex((h) => aliases.includes(h));
  const nameI = idx(['name', 'title', 'product', 'product_name']);
  if (nameI < 0) return { error: 'CSV must include a name column.', status: 400 };
  const descI = idx(['description', 'desc', 'body', 'details']);
  const priceI = idx(['price', 'price_ttd', 'ttd', 'amount']);
  const imageI = idx(['image_url', 'image', 'photo', 'photo_url', 'img']);
  const catI = idx(['category', 'type', 'collection']);
  const items = [];
  for (const r of rows.slice(1)) {
    if (items.length >= MAX_IMPORT_ITEMS) break;
    const name = String(r[nameI] || '').trim().slice(0, 200);
    if (!name) continue;
    const price = priceI >= 0 ? parseFoundPrice(r[priceI]) : null;
    items.push({
      name,
      description: descI >= 0 ? String(r[descI] || '').trim().slice(0, 2000) : '',
      price,
      price_found: price != null,
      image_url: imageI >= 0 ? String(r[imageI] || '').trim().slice(0, 500) : '',
      category: catI >= 0 ? String(r[catI] || '').trim().slice(0, 80) : '',
      source: 'csv',
    });
  }
  if (items.length === 0) return { error: 'No products found in the CSV.', status: 400 };
  return { items };
}

function shopifyProductsUrl(pageUrl) {
  try {
    const u = new URL(pageUrl);
    if (u.pathname.replace(/\/$/, '') === '/products.json') return u.toString();
    return `${u.origin}/products.json`;
  } catch {
    return '';
  }
}

function sanitizeImportedImageUrl(raw) {
  const checked = assertSafeUrl(raw);
  if (checked.error) return '';
  return checked.url.toString().slice(0, 500);
}

function normalizeImportedItems(items) {
  const out = [];
  const seen = new Set();
  for (const raw of items || []) {
    if (out.length >= MAX_IMPORT_ITEMS) break;
    const name = String(raw?.name || '').trim().slice(0, 200);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const price = raw?.price_found ? parseFoundPrice(raw.price) : null;
    out.push({
      name,
      description: String(raw?.description || '').trim().slice(0, 2000),
      price,
      price_found: price != null,
      image_url: sanitizeImportedImageUrl(raw?.image_url || raw?.image || ''),
      category: String(raw?.category || '').trim().slice(0, 80),
      source: String(raw?.source || 'import').slice(0, 40),
    });
  }
  return out;
}

async function importFromUrl(rawUrl, opts = {}) {
  const page = await fetchPublicText(rawUrl, opts);
  if (page.error) return page;
  let items = [];
  let sourceKind = 'html';
  const ct = String(page.contentType || '');
  if (/json/i.test(ct) || /\/products\.json(?:$|\?)/i.test(page.url)) {
    const parsed = parseShopifyProductsJson(page.text);
    if (parsed.error) return parsed;
    items = parsed.items;
    sourceKind = 'shopify';
  } else {
    const parsed = parseStoreHtml(page.text, page.url);
    items = parsed.items;
    if ((parsed.shopifyHint || items.length === 0) && shopifyProductsUrl(page.url) !== page.url) {
      const jsonUrl = shopifyProductsUrl(page.url);
      if (jsonUrl) {
        const jsonPage = await fetchPublicText(jsonUrl, { ...opts, maxBytes: MAX_JSON_BYTES, accept: 'application/json' });
        if (!jsonPage.error) {
          const shop = parseShopifyProductsJson(jsonPage.text);
          if (!shop.error && shop.items.length) {
            items = shop.items;
            sourceKind = 'shopify';
          }
        }
      }
    }
  }
  const normalized = normalizeImportedItems(items);
  if (normalized.length === 0) {
    return { error: 'No products were found on that page. Try a product or catalog URL, or upload a CSV.', status: 400 };
  }
  return { items: normalized, source_url: page.url, source_kind: sourceKind };
}

async function importFromCsvText(text) {
  const parsed = parseCsv(text);
  if (parsed.error) return parsed;
  const items = normalizeImportedItems(parsed.items);
  if (items.length === 0) return { error: 'No products found in the CSV.', status: 400 };
  return { items, source_kind: 'csv' };
}

function visionDraftToItem(result, fallbackName) {
  const name = String(result?.draft?.name || '').trim().slice(0, 200);
  if (!result?.agentWrote || !name) return null;
  return {
    name,
    description: String(result.draft.description || '').trim().slice(0, 2000),
    price: null,
    price_found: false,
    image_url: '',
    image_data: fallbackName || '',
    category: '',
    source: 'photo',
    tags: Array.isArray(result.draft.tags) ? result.draft.tags : [],
    warning: result.warning,
  };
}

module.exports = {
  FREE_PHOTO_LISTINGS,
  MAX_IMPORT_ITEMS,
  MAX_HTML_BYTES,
  FETCH_TIMEOUT_MS,
  COMING_WITH_PREMIUM,
  PHOTO_QUOTA_LOCKED,
  NO_PRICE,
  isImportPremiumRequired,
  isPremiumStore,
  importGate,
  photoQuotaState,
  statusPayload,
  isPrivateIp,
  assertSafeUrl,
  resolvePublicHost,
  assertPublicUrl,
  fetchPublicText,
  parseFoundPrice,
  parseStoreHtml,
  parseShopifyProductsJson,
  parseCsv,
  parseOpenGraph,
  importFromUrl,
  importFromCsvText,
  normalizeImportedItems,
  sanitizeImportedImageUrl,
  shopifyProductsUrl,
  visionDraftToItem,
  buildOnboardVision,
};
