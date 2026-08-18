// load-scraped.js — Load per-country scraped JSON (data/sources/scraped/*.json) into db.json.
// Usage: node load-scraped.js
// Idempotent by source name + (name,country) dedupe. Extends the DB (does NOT reset).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const store = require('./src/store');

const ROOT = path.resolve(__dirname);
const SCRAPED = path.join(ROOT, 'data', 'sources', 'scraped');

function main(){
  if (!fs.existsSync(SCRAPED)) { console.log('No scraped dir; nothing to load.'); return; }
  const files = fs.readdirSync(SCRAPED).filter(f=>f.endsWith('.json')).sort();
  if (!files.length) { console.log('No scraped files; nothing to load.'); return; }

  // Single OSM source, idempotent by name.
  let src = (store._db().sources||[]).find(x=>x.name==='OpenStreetMap (OSM)');
  if (!src) src = store.addSource({ name:'OpenStreetMap (OSM)', url:'https://www.openstreetmap.org/', tier:2, owner:'OpenStreetMap Foundation', terms:'ODbL — attribution required, share-alike' });

  const existing = new Set(store.listBusinesses().map(b=>`${(b.name||'').toLowerCase()}|${b.country||''}`));
  let added = 0, skipped = 0; const byFile = {};

  for (const f of files){
    const payload = JSON.parse(fs.readFileSync(path.join(SCRAPED,f),'utf8'));
    const rows = payload.businesses || [];
    let n = 0;
    for (const r of rows){
      const name = (r.name||'').trim(); if (!name) continue;
      const country = r.country_name || r.country || '';
      const key = `${name.toLowerCase()}|${country}`;
      if (existing.has(key)) { skipped++; continue; }
      store.addBusiness({
        source_id: src.id, name, legal_name: name,
        country, city: r.city||null, category: r.category||'uncategorized',
        website: r.website||null, address: r.address||null,
        phone: r.phone||null, email: r.email||null,
        source_url: (r.source&&r.source.url)||src.url,
      });
      existing.add(key); added++; n++;
    }
    byFile[f] = n;
  }
  console.log('Source:', src.name, src.id);
  console.log('Per-file added:', JSON.stringify(byFile));
  console.log(`TOTAL added=${added} skipped_dupes=${skipped} | db.businesses=${store.listBusinesses().length}`);
}
if (require.main === module) main();
module.exports = { main };
