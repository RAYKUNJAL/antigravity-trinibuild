const http = require('http');
const BASE = { host: 'localhost', port: 4103 };
const STAMP = Date.now();
let cookieB = '', cookieS = '';
function req(method, path, body, cookie, extraHeaders) {
  return new Promise((res, rej) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
    if (cookie) headers.Cookie = cookie;
    const r = http.request({ ...BASE, path, method, headers }, x => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => res({ status: x.statusCode, headers: x.headers, body: d }));
    });
    r.on('error', rej); if (data) r.write(data); r.end();
  });
}
(async () => {
  const out = [];
  const t = (n, c) => out.push((c ? 'PASS' : 'FAIL') + ' ' + n);
  // register buyer + supplier
  let r = await req('POST', '/api/register', { name: 'E2E Buyer', email: 'e2e-buyer-' + STAMP + '@test.com', password: 'password123', org_name: 'E2E Buyer Co', island: 'us', role: 'buyer', consent_processing: 'yes', consent_tos: 'yes' });
  t('register buyer 201', r.status === 201);
  cookieB = ((r.headers['set-cookie'] || [])[0] || '').split(';')[0];
  r = await req('POST', '/api/register', { name: 'E2E Supplier', email: 'e2e-supplier-' + STAMP + '@test.com', password: 'password123', org_name: 'E2E Supplier Co', island: 'tt', role: 'supplier', consent_processing: 'yes', consent_tos: 'yes' });
  t('register supplier 201', r.status === 201);
  cookieS = ((r.headers['set-cookie'] || [])[0] || '').split(';')[0];
  // me
  r = await req('GET', '/api/me', null, cookieB);
  const meB = JSON.parse(r.body).data;
  r = await req('GET', '/api/me', null, cookieS);
  const meS = JSON.parse(r.body).data;
  t('buyer session org', !!meB.org_id);
  t('supplier session org', !!meS.org_id);
  r = await req('POST', '/api/plan/upgrade', { plan: 'pro', source: 'e2e' }, cookieS);
  t('supplier upgrade to pro', r.status === 200);
  // workspaces guard
  r = await req('GET', '/buyer', null);
  t('guest /buyer shows login CTA', r.status === 200 && r.body.includes('Sign in required'));
  r = await req('GET', '/buyer', null, cookieB);
  t('buyer dashboard 200', r.status === 200 && r.body.includes('Buyer Dashboard'));
  r = await req('GET', '/supplier', null, cookieS);
  t('supplier dashboard 200', r.status === 200 && r.body.includes('Supplier Dashboard'));
  // claim a business (seed business, unclaimed)
  r = await req('GET', '/api/businesses', null);
  const biz = JSON.parse(r.body).data.find(b => b.state === 'UNCLAIMED_PUBLIC_PROFILE');
  t('found unclaimed business', !!biz);
  r = await req('POST', '/api/businesses/' + biz.id + '/claim', null, cookieS);
  t('claim submitted', r.status === 200 && JSON.parse(r.body).ok === true);
  // storefront via supplier workspace
  r = await req('POST', '/supplier/storefront/' + biz.id, { moq: 50, lead_time_days: 10, certifications: 'HACCP,Organic', export_markets: 'US,UK', payment_terms: 'deposit_balance', sample_policy: 'paid', incoterms_offered: 'CIF,FOB', description: 'Premium Caribbean goods' }, cookieS);
  t('storefront save (302)', r.status === 302);
  // evidence submit
  r = await req('POST', '/supplier/claim/' + biz.id, { dimension: 'legal_identity', note: 'Business registry extract attached' }, cookieS);
  t('evidence submit (302)', r.status === 302);
  // admin login gate
  r = await req('POST', '/api/admin/login', { password: 'not-set' });
  t('admin login gate (401 without pass)', r.status === 401);
  // product publish (state not yet verified -> 302/400/403 acceptable)
  r = await req('POST', '/supplier/products/' + biz.id, { title: 'E2E Cocoa Beans', price_usd: 12.5, moq: 10 }, cookieS);
  t('product route responds', r.status === 302 || r.status === 400 || r.status === 403);
  // buyer posts RFQ
  r = await req('POST', '/api/rfqs', { product: 'Cocoa beans 500kg', buyer_email: 'e2e-buyer-' + STAMP + '@test.com', quantity: 500, destination_country: 'US', deadline: '2026-10-01', category: 'food_beverage' }, cookieB);
  t('rfq created 201', r.status === 201);
  const rfq = JSON.parse(r.body).data;
  // supplier quotes via workspace
  r = await req('POST', '/supplier/rfqs/' + rfq.id + '/quote', { business_id: biz.id, price_usd: 9.9, moq: 100, lead_time: '14 days', incoterm: 'CIF', validity_days: 30 }, cookieS);
  t('quote submitted (302)', r.status === 302);
  // buyer views RFQ detail with quote comparison
  r = await req('GET', '/buyer/rfqs/' + rfq.id, null, cookieB);
  t('buyer RFQ detail with quote row', r.status === 200 && r.body.includes('Cocoa beans') && r.body.includes('9.9'));
  // get quote id
  const quotes = JSON.parse((await req('GET', '/api/rfqs/' + rfq.id + '/quotes', null)).body).data;
  const qid = quotes[0].id;
  t('quote listed via API', !!qid);
  // accept -> order
  r = await req('POST', '/buyer/rfqs/' + rfq.id + '/quotes/' + qid + '/accept', null, cookieB);
  t('accept quote (302 to order)', r.status === 302 && (r.headers.location || '').includes('/buyer/orders/'));
  const orderUrl = r.headers.location;
  r = await req('GET', orderUrl, null, cookieB);
  t('order detail with tracker', r.status === 200 && r.body.includes('Order') && r.body.includes('po_issued'));
  const orderId = orderUrl.split('/').pop();
  // invoice
  r = await req('GET', '/buyer/orders/' + orderId + '/invoice', null, cookieB);
  t('invoice page 200', r.status === 200 && r.body.includes('Invoice') && r.body.includes('Balance due'));
  // advance status + confirm receipt
  r = await req('POST', '/buyer/orders/' + orderId + '/status', { status: 'shipped' }, cookieB);
  t('status->shipped (302)', r.status === 302);
  r = await req('POST', '/buyer/orders/' + orderId + '/status', { status: 'delivered' }, cookieB);
  t('status->delivered (302)', r.status === 302);
  r = await req('GET', orderUrl, null, cookieB);
  t('order shows delivered', r.body.includes('delivered'));
  // review
  r = await req('POST', '/buyer/reviews', { order_id: orderId, reviewee_org_id: meS.org_id, rating: 5, comment: 'Great supplier' }, cookieB);
  t('review submitted (302)', r.status === 302);
  // documents
  r = await req('POST', '/buyer/documents/add', { order_id: orderId, kind: 'invoice', file_name: 'e2e-invoice.pdf', mime: 'application/pdf', size: 2048 }, cookieB);
  t('document added (302)', r.status === 302);
  r = await req('GET', '/buyer/orders/' + orderId + '/documents', null, cookieB);
  t('documents page lists doc', r.body.includes('e2e-invoice.pdf'));
  // messaging
  r = await req('POST', '/buyer/messages/send', { order_id: orderId, thread_id: 'order-' + orderId, body: 'Thanks for the quick reply' }, cookieB);
  t('message sent (302)', r.status === 302);
  r = await req('GET', '/buyer/orders/' + orderId + '/messages', null, cookieB);
  t('messages page shows thread', r.body.includes('Thanks for the quick reply'));
  // saved searches + watchlist
  r = await req('POST', '/buyer/saved/add', { name: 'Cocoa JM', category: 'food_beverage', country: 'Jamaica' }, cookieB);
  t('saved search (302)', r.status === 302);
  r = await req('GET', '/buyer/saved', null, cookieB);
  t('saved page shows search', r.body.includes('Cocoa JM'));
  r = await req('POST', '/buyer/watchlist/add', { business_id: biz.id }, cookieB);
  t('watchlist add (302)', r.status === 302);
  // admin gate
  r = await req('GET', '/admin', null);
  t('admin login page 401', r.status === 401 && r.body.includes('Admin Access'));
  // security: bad origin POST rejected
  r = await req('POST', '/api/rfqs', { product: 'x' }, cookieB, { Origin: 'https://evil.example.com' });
  t('cross-origin POST blocked 403', r.status === 403);
  // rate limit: 6 login attempts -> 429 on 6th
  let last = null;
  for (let i = 0; i < 6; i++) last = await req('POST', '/api/login', { email: 'nobody@x.com', password: 'wrong' });
  t('rate limit 429 on login burst', last.status === 429);
  console.log(out.join('\n'));
  const fails = out.filter(x => x.startsWith('FAIL')).length;
  console.log(fails === 0 ? 'ALL PASS' : fails + ' FAILURES');
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('E2E ERROR', e.message); process.exit(1); });
