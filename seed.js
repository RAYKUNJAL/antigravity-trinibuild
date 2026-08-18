// seed.js — load source-backed businesses, trade rules, HS candidates
'use strict';
const store = require('./src/store');

function seed() {
  store.reset();
  const src = store.addSource({ name: 'Caribbean Export directory sample', url: 'https://carib-export.com/', tier: 3, owner: 'Caribbean Export Development Agency', terms: 'permitted-public-directory' });
  const rows = [
    ['Blue Mountain Coffee Traders', 'Jamaica', 'Kingston', 'food_beverage', 'https://example.com/bmct', 'Spanish Town Rd, Kingston, Jamaica'],
    ['Grenada Craft Chocolate Co', 'Grenada', 'St. George', 'food_beverage', 'https://example.com/gccc', 'St George, Grenada'],
    ['Trinidadian Nutmeg Oils Ltd', 'Trinidad & Tobago', 'Port of Spain', 'beauty_wellness', 'https://example.com/tnol', 'Port of Spain, Trinidad'],
    ['St. Lucian Sea Moss Exporters', 'Saint Lucia', 'Castries', 'agriculture', 'https://example.com/slsm', 'Castries, Saint Lucia'],
    ['Barbados Hot Sauce Factory', 'Barbados', 'Bridgetown', 'food_beverage', 'https://example.com/bhsf', 'Bridgetown, Barbados'],
    ['Guyana Pepper & Pepper Sauce Co', 'Guyana', 'Georgetown', 'food_beverage', 'https://example.com/gppsc', 'Georgetown, Guyana'],
    ['DR Artisan Cigars', 'Dominican Republic', 'Santiago', 'agriculture', 'https://example.com/drac', 'Santiago, Dominican Republic'],
  ];
  for (const [name, country, city, category, website, address] of rows) {
    store.addBusiness({ source_id: src.id, name, country, city, category, website, address, source_url: src.url });
  }
  // Trade rules + HS candidates (decision-support, sourced)
  store.addTradeRule({ jurisdiction: 'CARICOM', product_scope: ['food_beverage','agriculture'], title: 'Rules of origin — CARICOM origin may qualify for preferential tariff', rule_type: 'origin', value: 'originating goods may qualify', source_url: 'https://caricom.org/', source_tier: 1 });
  store.addHsCandidate({ hs: '1806', description: 'Chocolate and other food preparations containing cocoa', jurisdiction: 'world', confidence: 0.8, source_url: 'https://asycuda.org/' });
  store.addHsCandidate({ hs: '0901', description: 'Coffee, roasted or unroasted', jurisdiction: 'world', confidence: 0.8 });
  console.log('Seeded source:', src.name, '| businesses:', store.listBusinesses().length);
}
if (require.main === module) seed();
module.exports = { seed };
