const assert = require('assert');
const { listCountries, getCountry } = require('./wamCountries');
const { countries } = listCountries();
assert.ok(countries.length >= 28);
assert.strictEqual(getCountry('tt').tier, 'tier1_full');
assert.ok(countries.every((c) => c.tier !== 'blocked'));
assert.strictEqual(getCountry('cu').tier, 'blocked'); // getCountry still finds blocked
console.log('wamCountries.test.js ok');
