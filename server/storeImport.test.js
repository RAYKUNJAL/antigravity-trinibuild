const assert = require('assert');
const {
  isImportPremiumRequired,
  isPremiumStore,
  importGate,
  photoQuotaState,
  statusPayload,
  isPrivateIp,
  assertSafeUrl,
  assertPublicUrl,
  fetchPublicText,
  parseFoundPrice,
  parseStoreHtml,
  parseShopifyProductsJson,
  parseCsv,
  importFromUrl,
  importFromCsvText,
  normalizeImportedItems,
  COMING_WITH_PREMIUM,
  PHOTO_QUOTA_LOCKED,
  FREE_PHOTO_LISTINGS,
} = require('./storeImport');

// ── env gate ────────────────────────────────────────────────
assert.strictEqual(isImportPremiumRequired({}), true);
assert.strictEqual(isImportPremiumRequired({ IMPORT_REQUIRE_PREMIUM: 'true' }), true);
assert.strictEqual(isImportPremiumRequired({ IMPORT_REQUIRE_PREMIUM: 'TRUE' }), true);
assert.strictEqual(isImportPremiumRequired({ IMPORT_REQUIRE_PREMIUM: 'false' }), false);
assert.strictEqual(isImportPremiumRequired({ IMPORT_REQUIRE_PREMIUM: '0' }), false);
assert.strictEqual(isPremiumStore({ plan_tier: 'free' }), false);
assert.strictEqual(isPremiumStore({ plan_tier: 'premium' }), true);

const locked = importGate({ plan_tier: 'free' }, { IMPORT_REQUIRE_PREMIUM: 'true' });
assert.strictEqual(locked.allowed, false);
assert.strictEqual(locked.coming_with_premium, true);
assert.strictEqual(locked.message, COMING_WITH_PREMIUM);

const openFlag = importGate({ plan_tier: 'free' }, { IMPORT_REQUIRE_PREMIUM: 'false' });
assert.strictEqual(openFlag.allowed, true);

const premiumOk = importGate({ plan_tier: 'premium' }, { IMPORT_REQUIRE_PREMIUM: 'true' });
assert.strictEqual(premiumOk.allowed, true);

const qFree = photoQuotaState({ plan_tier: 'free' }, 0);
assert.strictEqual(qFree.cap, FREE_PHOTO_LISTINGS);
assert.strictEqual(qFree.remaining, 5);
assert.strictEqual(qFree.locked, false);

const qUsed = photoQuotaState({ plan_tier: 'free' }, 5);
assert.strictEqual(qUsed.remaining, 0);
assert.strictEqual(qUsed.locked, true);
assert.strictEqual(qUsed.message, PHOTO_QUOTA_LOCKED);

const qPrem = photoQuotaState({ plan_tier: 'premium' }, 99);
assert.strictEqual(qPrem.unlimited, true);
assert.strictEqual(qPrem.locked, false);

const offer = statusPayload({ plan_tier: 'free', photo_listings_used: 2 }, { IMPORT_REQUIRE_PREMIUM: 'true' });
assert.strictEqual(offer.photo_quota.remaining, 3);
assert.strictEqual(offer.import.coming_with_premium, true);
assert.ok(/coming with Premium/i.test(offer.message));

// ── SSRF guard ──────────────────────────────────────────────
for (const bad of [
  'file:///etc/passwd',
  'ftp://example.com',
  'http://localhost/store',
  'http://localhost.local/store',
  'https://127.0.0.1/',
  'http://10.0.0.4/products.json',
  'http://192.168.1.20/x',
  'http://172.16.5.1/x',
  'http://169.254.169.254/latest/meta-data',
  'http://[::1]/',
  'http://user:pass@example.com/',
  'https://example.com:8443/',
  'http://metadata.google.internal/',
]) {
  const r = assertSafeUrl(bad);
  assert.ok(r.error, `expected reject for ${bad}`);
  assert.strictEqual(r.status, 400);
}

assert.ok(isPrivateIp('127.0.0.1'));
assert.ok(isPrivateIp('10.1.2.3'));
assert.ok(isPrivateIp('192.168.0.1'));
assert.ok(isPrivateIp('169.254.169.254'));
assert.ok(isPrivateIp('::1'));
assert.ok(isPrivateIp('::ffff:127.0.0.1'));
assert.ok(isPrivateIp('fc00::1'));
assert.ok(!isPrivateIp('1.1.1.1'));
assert.ok(!isPrivateIp('8.8.8.8'));

const okUrl = assertSafeUrl('https://Example.COM/products');
assert.ok(okUrl.url);
assert.strictEqual(okUrl.url.hostname, 'example.com');

(async () => {
  const blockedLookup = async () => [{ address: '127.0.0.1', family: 4 }];
  const privateResolved = await assertPublicUrl('https://evil.example/', blockedLookup);
  assert.ok(privateResolved.error);
  assert.match(privateResolved.error, /not a public store URL/i);

  const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];
  const publicOk = await assertPublicUrl('https://example.com/shop', publicLookup);
  assert.ok(publicOk.url);

  // Redirect to a private IP is rejected
  const hops = [];
  const fetchRedirect = async (url, init) => {
    hops.push({ url, redirect: init.redirect });
    if (url === 'https://example.com/go') {
      return {
        status: 302,
        ok: false,
        headers: { get: (n) => (n === 'location' ? 'http://127.0.0.1/secret' : null) },
        body: null,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  const redirected = await fetchPublicText('https://example.com/go', {
    fetchFn: fetchRedirect,
    lookupFn: async (host) => {
      if (host === 'example.com') return [{ address: '93.184.216.34', family: 4 }];
      if (host === '127.0.0.1') return [{ address: '127.0.0.1', family: 4 }];
      return [{ address: '93.184.216.34', family: 4 }];
    },
  });
  assert.ok(redirected.error);
  assert.match(redirected.error, /not a public store URL/i);

  // ── prices only when found ────────────────────────────────
  assert.strictEqual(parseFoundPrice(''), null);
  assert.strictEqual(parseFoundPrice(null), null);
  assert.strictEqual(parseFoundPrice('0'), null);
  assert.strictEqual(parseFoundPrice(-3), null);
  assert.strictEqual(parseFoundPrice('TT$25.00'), 25);
  assert.strictEqual(parseFoundPrice('12.5'), 12.5);

  const htmlLd = `
    <html><head>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@type":"Product","name":"Cocoa tea",
       "description":"Hot cocoa tea.","image":"https://cdn.example.com/tea.jpg",
       "offers":{"@type":"Offer","price":"18","priceCurrency":"TTD"}}
    </script>
    </head></html>`;
  const ld = parseStoreHtml(htmlLd, 'https://example.com/tea');
  assert.strictEqual(ld.items.length, 1);
  assert.strictEqual(ld.items[0].name, 'Cocoa tea');
  assert.strictEqual(ld.items[0].price, 18);
  assert.strictEqual(ld.items[0].price_found, true);
  assert.strictEqual(ld.items[0].source, 'json-ld');

  const htmlNoPrice = `
    <html><head>
    <script type="application/ld+json">
      {"@type":"Product","name":"Bake","description":"Plain bake"}
    </script>
    </head></html>`;
  const noPrice = parseStoreHtml(htmlNoPrice, 'https://example.com/bake');
  assert.strictEqual(noPrice.items[0].name, 'Bake');
  assert.strictEqual(noPrice.items[0].price, null);
  assert.strictEqual(noPrice.items[0].price_found, false);

  const htmlOg = `
    <html><head>
    <meta property="og:title" content="Corn soup" />
    <meta property="og:description" content="Saturday pot." />
    <meta property="og:image" content="https://cdn.example.com/soup.jpg" />
    <meta property="product:price:amount" content="25" />
    </head></html>`;
  const og = parseStoreHtml(htmlOg, 'https://example.com/soup');
  assert.strictEqual(og.items[0].name, 'Corn soup');
  assert.strictEqual(og.items[0].price, 25);
  assert.strictEqual(og.items[0].price_found, true);
  assert.strictEqual(og.items[0].source, 'opengraph');

  const ogNoPrice = parseStoreHtml(
    `<html><head><meta property="og:title" content="Wrap" /></head></html>`,
    'https://example.com/wrap',
  );
  assert.strictEqual(ogNoPrice.items[0].price, null);
  assert.strictEqual(ogNoPrice.items[0].price_found, false);

  const shop = parseShopifyProductsJson(JSON.stringify({
    products: [
      {
        title: 'Pepper sauce',
        body_html: '<p>Homemade pepper.</p>',
        product_type: 'Condiments',
        images: [{ src: 'https://cdn.example.com/pepper.jpg' }],
        variants: [{ price: '15.00' }],
      },
      {
        title: 'Untitled tray',
        body_html: 'No price on this one',
        variants: [{ price: '' }],
      },
    ],
  }));
  assert.strictEqual(shop.items.length, 2);
  assert.strictEqual(shop.items[0].name, 'Pepper sauce');
  assert.strictEqual(shop.items[0].price, 15);
  assert.strictEqual(shop.items[0].price_found, true);
  assert.strictEqual(shop.items[1].name, 'Untitled tray');
  assert.strictEqual(shop.items[1].price, null);
  assert.strictEqual(shop.items[1].price_found, false);

  const csv = parseCsv('name,description,price,image_url,category\nRoti,Beef roti,45,https://cdn.example.com/roti.jpg,Mains\nJuice,Fresh lime,,https://cdn.example.com/lime.jpg,Drinks\n');
  assert.strictEqual(csv.items.length, 2);
  assert.strictEqual(csv.items[0].price, 45);
  assert.strictEqual(csv.items[0].price_found, true);
  assert.strictEqual(csv.items[1].name, 'Juice');
  assert.strictEqual(csv.items[1].price, null);
  assert.strictEqual(csv.items[1].price_found, false);

  const csvQuoted = parseCsv('name,price\n"A, special","12"\n');
  assert.strictEqual(csvQuoted.items[0].name, 'A, special');
  assert.strictEqual(csvQuoted.items[0].price, 12);

  const csvBad = parseCsv('foo,bar\n1,2\n');
  assert.match(csvBad.error, /name column/i);

  const fromCsv = await importFromCsvText('name,price\nChanna,10\n');
  assert.strictEqual(fromCsv.items[0].name, 'Channa');
  assert.strictEqual(fromCsv.source_kind, 'csv');

  // importFromUrl uses injected fetch + public DNS
  const catalogHtml = `
    <html><head>
    <script type="application/ld+json">
      {"@graph":[
        {"@type":"Product","name":"Left wrap","offers":{"price":"10"}},
        {"@type":"Product","name":"Right wrap"}
      ]}
    </script>
    </head></html>`;
  const fromUrl = await importFromUrl('https://stall.example/menu', {
    lookupFn: async () => [{ address: '93.184.216.34', family: 4 }],
    fetchFn: async () => ({
      status: 200,
      ok: true,
      headers: { get: (n) => (n === 'content-type' ? 'text/html' : null) },
      body: null,
      arrayBuffer: async () => Buffer.from(catalogHtml),
    }),
  });
  assert.strictEqual(fromUrl.items.length, 2);
  assert.strictEqual(fromUrl.items[0].price, 10);
  assert.strictEqual(fromUrl.items[1].price, null);
  assert.strictEqual(fromUrl.items[1].price_found, false);
  assert.ok(!fromUrl.items.some((i) => i.price && i.name === 'Right wrap'));

  const normalized = normalizeImportedItems([
    { name: '  ', price: 9, price_found: true },
    { name: 'Ok', price: 0, price_found: true },
    { name: 'Ok', price: 4, price_found: true },
    { name: 'Typed', price: 11, price_found: true },
  ]);
  assert.strictEqual(normalized.length, 2);
  assert.strictEqual(normalized[0].name, 'Ok');
  assert.strictEqual(normalized[0].price, null, 'zero is not a found price');
  assert.strictEqual(normalized[1].price, 11);

  console.log('storeImport.test.js ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
