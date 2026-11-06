/**
 * Wam Caribbean countries — same seed as config/wamCountries.json
 */
const path = require('path');
const fs = require('fs');

let cached = null;

function load() {
  if (cached) return cached;
  const p = path.join(__dirname, '..', 'config', 'wamCountries.json');
  cached = JSON.parse(fs.readFileSync(p, 'utf8'));
  return cached;
}

function listCountries({ includeBlocked = false } = {}) {
  const { countries, source, version } = load();
  const rows = includeBlocked ? countries : countries.filter((c) => c.active !== false && c.tier !== 'blocked');
  return {
    version,
    source: source || 'https://wam.money/caribbean',
    countries: rows.slice().sort((a, b) => (a.ads_priority || 100) - (b.ads_priority || 100) || a.name.localeCompare(b.name)),
  };
}

function getCountry(id) {
  return load().countries.find((c) => c.id === id) || null;
}

module.exports = { listCountries, getCountry, load };
