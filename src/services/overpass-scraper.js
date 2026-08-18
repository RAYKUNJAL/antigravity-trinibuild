// src/services/overpass-scraper.js — Pull public business data from OpenStreetMap/Overpass.
// Free, no API key, ODbL-licensed, source-attributed. Every row starts UNCLAIMED.
// Robust strategy: per-country BBOX + one query per CATEGORY, with retry/backoff and
// multi-mirror fallback (Overpass public instances 504 under load). Category is assigned
// deterministically from the query, not guessed.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(ROOT,'data','sources','countries.json'),'utf8'));
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT,'data','sources','categories.json'),'utf8'));
const BBOXES = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT,'data','sources','country_bboxes.json'),'utf8')); } catch { return {}; } })();
const OUT_DIR = path.join(ROOT,'data','sources','scraped');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const UA = 'caribbean-ai-trade-network/0.1 (+https://github.com/RAYKUNJAL/antigravity-trinibuild; business-directory build)';

function countryByCode(c){ return COUNTRIES.find(x=>x.code===c)||null; }
function bboxOf(code){ const g=BBOXES[code]&&BBOXES[code].geo; return (g&&g.bbox) ? g.bbox : null; }

// bbox = [south,north,west,east] (Nominatim order)
function buildCategoryQuery(bbox, cat){
  const [s,n,w,e] = bbox;
  const parts = cat.osm_tags.map(t=>`node[${t}](${s},${w},${n},${e});`);
  return `[out:json][timeout:90];
(${parts.join('')});
out body center ${cat.limit||250};`;
}

async function overpassPost(q, fetchImpl){
  let lastErr=null;
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchImpl(ep, {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':UA,'Accept':'application/json'},
        body:'data='+encodeURIComponent(q),
        signal: AbortSignal.timeout(50000),
      });
      if (res.ok) return { ok:true, status:res.status, data:await res.json(), error:null };
      lastErr = `overpass_http_${res.status} (${ep})`;
    } catch(e){ lastErr = (e&&e.message)||String(e); }
  }
  return { ok:false, status:null, data:null, error:lastErr };
}

async function scrapeCategory(code, cat, bbox, fetchImpl, retries=3){
  const q = buildCategoryQuery(bbox, cat);
  let delay = 2000;
  for (let i=0;i<retries;i++){
    const r = await overpassPost(q, fetchImpl);
    if (r.ok && r.data && Array.isArray(r.data.elements)) return { ok:true, category:cat.slug, elements:r.data.elements };
    await new Promise(res=>setTimeout(res, delay)); delay = Math.min(delay*2, 12000);
  }
  return { ok:false, category:cat.slug, error:'max_retries' };
}

function toRow(code, country, catSlug, e){
  const tags=e.tags||{};
  const lat=e.lat ?? e.center?.lat; const lon=e.lon ?? e.center?.lon;
  const address=[tags['addr:housenumber']||tags['addr:house_number'],tags['addr:street'],tags['addr:city'],tags['addr:state']].filter(Boolean).join(', ');
  return {
    id:`osm-${code}-${e.id}`,
    state:'UNCLAIMED_PUBLIC_PROFILE',
    name:tags.name, country:code, country_name:country.name,
    category:catSlug, osm_category: tags.shop||tags.craft||tags.amenity||tags.tourism||null,
    address:address||null, city: tags['addr:city']||null, lat, lon,
    phone: tags.phone||tags['contact:phone']||null,
    website: tags.website||tags['contact:website']||null,
    email: tags.email||tags['contact:email']||null,
    source:{ provider:'osm', id:String(e.id), url:`https://www.openstreetmap.org/node/${e.id}`, license:'ODbL', retrieved_at:new Date().toISOString() },
  };
}

async function scrapeCountry(code, { fetchImpl=globalThis.fetch, perCategory=200, log=()=>{} }={}){
  const country = countryByCode(code);
  if(!country) return { code, ok:false, error:'unknown_country' };
  const bbox = bboxOf(code);
  if(!bbox) return { code, ok:false, error:'no_bbox' };
  const rows=[]; const seen=new Set(); const byCategory={};
  let anyOk=false;
  for (const cat of CATEGORIES){
    const cfg = Object.assign({}, cat, { limit: perCategory });
    const r = await scrapeCategory(code, cfg, bbox, fetchImpl);
    if (r.ok){
      anyOk=true; byCategory[cat.slug]=r.elements.length;
      for (const e of r.elements){
        const name=(e.tags||{}).name; if(!name||seen.has(name)) continue; seen.add(name);
        rows.push(toRow(code,country,cat.slug,e));
      }
    } else {
      byCategory[cat.slug]=0;
      log(`  ${code} ${cat.slug}: ${r.error}`);
    }
  }
  return { code, name:country.name, ok:anyOk, count:rows.length, byCategory, businesses:rows };
}

function saveCountry(code, payload){ fs.mkdirSync(OUT_DIR,{recursive:true}); const f=path.join(OUT_DIR, code+'.json'); fs.writeFileSync(f, JSON.stringify(payload,null,2)); return f; }
function listCountries(){ return COUNTRIES; }

module.exports = { listCountries, countryByCode, scrapeCountry, saveCountry, OUT_DIR, scrapeCategory, buildCategoryQuery };
