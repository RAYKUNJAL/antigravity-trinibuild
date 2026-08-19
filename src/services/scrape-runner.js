// src/services/scrape-runner.js — CLI runner for the Overpass scraper.
// Usage: node scrape-runner.js CODE[,CODE,...] [perCategoryLimit] [--verbose]
// Example: node scrape-runner.js TT,JM,BB 250 --verbose
// Scrapes each country into data/sources/scraped/<CODE>.json and prints a summary.
'use strict';
const s = require('./overpass-scraper.js');
const fs = require('node:fs');

const [codesArg, limitArg, , verbose] = process.argv.slice(2);
const codes = (codesArg||'').split(',').map(x=>x.trim()).filter(Boolean);
const perCategory = Number(limitArg) || 250;
const log = verbose ? console.log : ()=>{};

(async () => {
  const summary = [];
  let total = 0;
  for (const code of codes){
    process.stdout.write(`scraping ${code} ... `);
    const r = await s.scrapeCountry(code, { perCategory, log });
    if (r.ok && r.count>0){
      const f = s.saveCountry(code, r);
      total += r.count;
      process.stdout.write(`OK count=${r.count} byCat=${JSON.stringify(r.byCategory)}\n`);
      summary.push({code, ok:true, count:r.count, byCategory:r.byCategory, file:f});
    } else {
      process.stdout.write(`FAIL ${r.error}\n`);
      summary.push({code, ok:false, error:r.error, count:0});
    }
  }
  console.log('\n=== SUMMARY ===');
  for (const s2 of summary) console.log(`${s2.code}\t${s2.ok?'ok':'FAIL'}\t${s2.count}\t${s2.error||''}`);
  console.log(`TOTAL\t${summary.filter(x=>x.ok).length}/${codes.length} ok\t${total} businesses`);
})().catch(e=>{ console.error('FATAL', e&&e.stack||e); process.exit(1); });
