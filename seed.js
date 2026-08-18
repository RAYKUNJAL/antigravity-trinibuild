// seed.js — load source-backed businesses as UNCLAIMED_PUBLIC_PROFILE
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
  ];
  for (const [name, country, city, category, website, address] of rows) {
    store.addBusiness({ source_id: src.id, name, country, city, category, website, address, source_url: src.url });
  }
  console.log('Seeded source:', src.name, '| businesses:', store.listBusinesses().length);
}

if (require.main === module) seed();
module.exports = { seed };
