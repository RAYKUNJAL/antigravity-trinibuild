/**
 * Fresh Catch Juvay link-in — honesty and wiring.
 * The live market host is freshcatch.trinibuild.com (no invented juvay.app subdomain).
 * Copy must not invent depot, listing, or seller counts.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const HOST = 'https://freshcatch.trinibuild.com';
const PATHS = [
  'services/freshCatchLink.ts',
  'pages/landing/FreshCatchLanding.tsx',
  'pages/LandingPageCRO.tsx',
  'components/Navbar.tsx',
  'components/Footer.tsx',
  'components/ServicesShowcase.tsx',
  'App.tsx',
];

const linkSrc = read('services/freshCatchLink.ts');
assert.ok(
  linkSrc.includes(`export const FRESH_CATCH_APP_URL = '${HOST}'`),
  'FRESH_CATCH_APP_URL must be https://freshcatch.trinibuild.com',
);
assert.ok(linkSrc.includes("export const FRESH_CATCH_PATH = '/fresh-catch'"));
const urlAssign = linkSrc.match(/export const FRESH_CATCH_APP_URL = '([^']+)'/);
assert.ok(urlAssign && urlAssign[1] === HOST, 'exported host must be freshcatch.trinibuild.com, not a juvay.app subdomain');

for (const p of ['pages/landing/FreshCatchLanding.tsx', 'pages/LandingPageCRO.tsx', 'App.tsx', 'components/Navbar.tsx', 'components/Footer.tsx', 'components/ServicesShowcase.tsx']) {
  const src = read(p);
  assert.ok(
    src.includes('/fresh-catch') || src.includes('FreshCatchLanding') || src.includes('fresh-catch'),
    `${p} should wire Fresh Catch`,
  );
}

const app = read('App.tsx');
assert.ok(app.includes("path=\"/fresh-catch\"") && app.includes('FreshCatchLanding'), 'App.tsx needs /fresh-catch route');
assert.ok(app.includes("path=\"/services/fresh-catch\""), 'App.tsx needs /services/fresh-catch route');

const catchCopy = read('pages/landing/FreshCatchLanding.tsx') + '\n' + read('services/freshCatchLink.ts');
const home = read('pages/LandingPageCRO.tsx');
const catchSection = home.slice(home.indexOf('id="fresh-catch"'), home.indexOf('<VisionDemo'));
const fakeCount = /(?:\d+\s*\+?\s*(?:depots?|fishermen|fishers|shops)|dozens of (?:depots|fishermen)|hundreds of (?:depots|fishermen))/i;
assert.ok(!fakeCount.test(catchCopy), 'Fresh Catch page must not invent depot counts');
assert.ok(!fakeCount.test(catchSection), 'Home Fresh Catch section must not invent depot counts');
const landing = catchCopy + '\n' + catchSection;
assert.ok(/we do not take PayPal/i.test(landing), 'honest no-PayPal line should be present');
assert.ok(/empty/i.test(landing), 'honest empty-market copy should be present');
assert.ok(landing.includes(HOST), 'landing must deep-link the live Fresh Catch host');
assert.ok(!/pay\s*[→\-]\s*fulfill (?:works|proven|ready)/i.test(landing), 'must not claim pay→fulfill');
assert.ok(/not available yet|when it is set up|when it is set up/i.test(landing), 'Wam availability must stay honest');

const navbar = read('components/Navbar.tsx');
assert.ok(navbar.includes("path: '/fresh-catch'") || navbar.includes('to="/fresh-catch"'), 'Navbar must include Fresh Catch');
const footer = read('components/Footer.tsx');
assert.ok(footer.includes('to="/fresh-catch"') || footer.includes("to='/fresh-catch'"), 'Footer must include Fresh Catch');
const showcase = read('components/ServicesShowcase.tsx');
assert.ok(showcase.includes("slug: 'fresh-catch'") && showcase.includes("path: '/fresh-catch'"));

const sitemap = read('public/sitemap.xml');
assert.ok(sitemap.includes('https://juvay.app/fresh-catch'), 'public sitemap should list /fresh-catch');
const dyn = read('pages/SitemapXml.tsx');
assert.ok(dyn.includes("'fresh-catch'"), 'dynamic sitemap should list fresh-catch');

const nginx = read('deploy/nginx-juvay.conf') + read('deploy/Caddyfile-juvay');
assert.ok(!/freshcatch\.juvay\.app/.test(nginx), 'juvay nginx/caddy should not claim a Fresh Catch vhost we did not configure');

console.log('freshCatchLink.test.js: PASS');
