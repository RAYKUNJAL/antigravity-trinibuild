// src/services/ai-team.js — Agentic AI operations team for the admin section.
// Each agent runs a deterministic collector over real platform data (store + Postgres),
// producing concrete, useful operational output. Goose AI is wired as the optional
// generative/agentic layer (enable via AI_TEAM_USE_GOOSE=1 once a provider has credits).
'use strict';
const { execFile } = require('node:child_process');
const pg = require('../pg');
const store = require('../store');

const GOOSE = process.env.GOOSE_BIN || (process.platform === 'win32' ? 'C:\\Users\\Banjo\\.local\\bin\\goose.EXE' : 'goose');
const USE_GOOSE = process.env.AI_TEAM_USE_GOOSE === '1';

function runGoose(prompt, system, timeout=90000){
  return new Promise(resolve=>{
    if(!USE_GOOSE) return resolve(null);
    execFile(GOOSE, ['run','-t',prompt,'--system',system||'You are a Caribbean trade operations analyst. Be concise and factual.'], { timeout }, (err, stdout, stderr)=>{
      if(err) return resolve(null);
      resolve((stdout||'').slice(0,4000));
    });
  });
}

const AGENTS = [
  { name:'supplier_outreach', icon:'campaign', role:'Supplier Acquisition',
    description:'Finds unclaimed businesses by market and generates personalized claim/outreach leads so suppliers turn public data into owned profiles.', run: runSupplierOutreach },
  { name:'rfq_triage', icon:'support_agent', role:'Demand Matching',
    description:'Matches open sourcing requests (RFQs) to the most relevant suppliers by category, country and verification, and ranks them.', run: runRfqTriage },
  { name:'directory_quality', icon:'database', role:'Data Quality',
    description:'Scans the directory for thin or non-trade-ready records and flags them so the market stays credible for buyers.', run: runDirectoryQuality },
  { name:'claim_verifier', icon:'verified_user', role:'Trust & Verification',
    description:'Reviews pending business claims and applies automatic identity checks to stage them for approval.', run: runClaimVerifier },
  { name:'content_moderator', icon:'shield', role:'Moderation',
    description:'Screens RFQs and ad copy for prohibited, spammy or misleading content per the Acceptable Use Policy.', run: runContentModerator },
  { name:'ads_performance', icon:'insights', role:'Revenue Optimizer',
    description:'Aggregates advertising impressions/clicks and recommends budget and placement moves.', run: runAdsPerformance },
  { name:'daily_ops', icon:'today', role:'Daily Operations',
    description:'Builds a daily operational brief: new accounts, RFQs, quotes, claims, orders, escrows and ad activity.', run: runDailyOps },
];

async function runSupplierOutreach(){
  const businesses = store.listBusinesses();
  const unclaimed = businesses.filter(b=>String(b.state||'').startsWith('UNCLAIMED'));
  const byCountry = {};
  for (const b of unclaimed) byCountry[b.country] = (byCountry[b.country]||0)+1;
  const top = Object.entries(byCountry).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const sample = unclaimed.filter(b=>b.name && b.name.length>3).slice(0,6).map(b=>({
    name:b.name, country:b.country, category:b.category,
    message:`Hi ${b.name}, we have a free trade profile for you on Caribbean Trade Network (${b.country}, ${b.category||'business'}). Claim it in ~3 minutes to add products, receive RFQs from verified buyers, and control your business information — no subscription needed to start.`,
  }));
  const result = { total_unclaimed: unclaimed.length, markets: top, sample_outreach: sample };
  const narr = await runGoose(`Summarize this supplier-acquisition data in 2-3 sentences and recommend which 3 markets to prioritize: ${JSON.stringify({total:unclaimed.length,top})}`);
  if (narr) result.analysis = narr;
  return result;
}

async function runRfqTriage(){
  const rfqs = store.listRfqs();
  const businesses = store.listBusinesses();
  const results = rfqs.slice(0,10).map(rfq=>{
    const cat = rfq.category || (String(rfq.product||'').toLowerCase().includes('chocolat')||String(rfq.product||'').toLowerCase().includes('food')||String(rfq.product||'').toLowerCase().includes('coffee') ? 'food_beverage' : null);
    const dest = rfq.destination_country || '';
    const matches = businesses
      .filter(b=> (cat ? b.category===cat : true) && (!dest || b.country===dest))
      .sort((a,b)=> (String(b.state).startsWith('CLAIMED')||String(b.state).startsWith('TRADE')) - (String(a.state).startsWith('CLAIMED')||String(a.state).startsWith('TRADE')))
      .slice(0,5).map(b=>({name:b.name,country:b.country,state:b.state}));
    return { rfq: rfq.product, qty: rfq.quantity, destination: dest, matches };
  });
  return { open_rfqs: rfqs.length, matches: results };
}

async function runDirectoryQuality(){
  const businesses = store.listBusinesses();
  const thin = businesses.filter(b=> !b.website && !b.phone && !b.email && !b.address);
  const localNoise = businesses.filter(b=> ['beauty_wellness','construction','transport_logistics'].includes(b.category) && !b.website && !b.phone);
  return { total: businesses.length, thin_records: thin.length, local_noise_flags: localNoise.length,
    recommendation: thin.length ? 'Consider hiding the thinnest records behind a "Trade-ready" default and surfacing them only via the "Include public/unclaimed" toggle.' : 'Directory is healthy.' };
}

async function runClaimVerifier(){
  const db = store._db();
  const pending = db.businesses.filter(b=>b.state==='CLAIM_PENDING');
  const checks = pending.slice(0,10).map(b=>({ name:b.name, claimed_by:b.claimed_by,
    auto_checks:{ has_owner: !!b.claimed_by, has_website: !!b.website, has_phone: !!b.phone, has_email: !!b.email },
    recommendation: (b.website||b.phone||b.email) ? 'Stage for human review (evidence available)' : 'Request identity evidence before approval' }));
  return { pending_claims: pending.length, staged: checks };
}

async function runContentModerator(){
  const db = store._db();
  const flagged = [];
  const BAD = /\b(viagra|casino|bitcoin|lottery|free money|sex|porn)\b/i;
  for (const r of (db.rfqs||[])) if (BAD.test(r.product||'') || BAD.test(r.notes||'')) flagged.push({type:'rfq', id:r.id, text:r.product});
  for (const a of await pg.listAds()) if (BAD.test(a.title||'') || BAD.test(a.body||'')) flagged.push({type:'ad', id:a.id, text:a.title});
  return { scanned_rfqs: (db.rfqs||[]).length, scanned_ads: (await pg.listAds()).length, flagged };
}

async function runAdsPerformance(){
  const stats = await pg.adStats();
  const ads = await pg.listAds();
  const best = ads.slice().sort((a,b)=>(b.clicks||0)-(a.clicks||0)).slice(0,5).map(a=>({title:a.title,placement:a.placement,impressions:a.impressions,clicks:a.clicks}));
  return { stats, best_ads: best, recommendation: stats.total ? 'Shift budget toward the highest-click placements; pause zero-impression campaigns.' : 'No active campaigns yet — publish at least one test campaign.' };
}

async function runDailyOps(){
  const db = store._db();
  const [ads, escrows] = await Promise.all([pg.adStats(), pg.pool.query('SELECT status,count(*)::int FROM trade_escrows GROUP BY status')]);
  return {
    date: new Date().toISOString().slice(0,10),
    accounts: (db.users||[]).length,
    businesses: (db.businesses||[]).length,
    open_rfqs: (db.rfqs||[]).filter(r=>r.status==='open').length,
    quotes: (db.quotes||[]).length,
    orders: (db.orders||[]).length,
    pending_claims: (db.businesses||[]).filter(b=>b.state==='CLAIM_PENDING').length,
    ad_impressions: ads.impressions, ad_clicks: ads.clicks,
    escrow_states: (escrows.rows||[]),
  };
}

async function run(name){
  const agent = AGENTS.find(a=>a.name===name);
  if(!agent) return { ok:false, error:'unknown_agent' };
  const runRow = await pg.createAgentRun(name, { role: agent.role });
  try {
    const output = await agent.run();
    await pg.finishAgentRun(runRow.id, 'done', output);
    return { ok:true, agent:name, status:'done', output };
  } catch(e){
    await pg.finishAgentRun(runRow.id, 'error', { error: String(e&&e.message||e) });
    return { ok:false, agent:name, status:'error', error: String(e&&e.message||e) };
  }
}

module.exports = { AGENTS, run, runGoose };
