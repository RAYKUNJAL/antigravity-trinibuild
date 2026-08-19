// src/pg.js — PostgreSQL persistence layer for the Caribbean AI Trade Network.
// Migrates the app off the JSON-file store onto a self-hosted Postgres.
// Strategy: the in-memory store is the working copy; it is hydrated from Postgres at
// startup and every mutation is flushed to Postgres (upsert-all) on a debounce.
// Synchronous store API is preserved so server.js / ui.js are untouched.
'use strict';
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5432/caribbean_trade';
const pool = new Pool({ connectionString: DATABASE_URL, max: 10, idleTimeoutMillis: 30000 });

// dbKey (in-memory) -> { table, columns }  (columns match the JSON entity fields)
// NOTE: in-memory `orders` maps to the new `trade_orders` table.
const TABLES = {
  users:              { table:'users',              columns:['id','email','name','password_hash','role','island','currency','buyer_external','buyer_destination','consents','created_at'] },
  organizations:      { table:'organizations',      columns:['id','name','island','currency','created_at'] },
  memberships:        { table:'memberships',        columns:['id','user_id','org_id','role','created_at'] },
  subscriptions:      { table:'subscriptions',      columns:['id','user_id','org_id','plan_slug','status','source','started_at','expires_at'] },
  businesses:         { table:'businesses',         columns:['id','state','name','legal_name','country','city','category','website','address','phone','email','verification','provenance','claimed_by','claimed_at','owner_org_id','created_at','updated_at'] },
  representatives:    { table:'representatives',    columns:['id','org_id','user_id','business_id','role','created_at'] },
  products:           { table:'products',           columns:['id','business_id','org_id','title','description','category','hs_candidate','moq','lead_time','price_usd','currency','origin_country','published_by','created_at'] },
  rfqs:               { table:'rfqs',               columns:['id','buyer_user_id','buyer_org_id','product','quantity','destination_country','deadline','notes','category','status','created_at'] },
  quotes:             { table:'quotes',             columns:['id','rfq_id','supplier_org_id','business_id','price_usd','currency','incoterm','lead_time','moq','validity_days','notes','status','created_at','version','parent_quote_id','negotiation_thread','payment_terms','attachments','landed_cost_estimate'] },
  orders:             { table:'trade_orders',       columns:['id','order_number','buyer_id','seller_id','buyer_org_id','supplier_org_id','rfq_id','quote_id','product','quantity','price_usd','currency','incoterm','status','origin_country','destination_country','has_caricom_coo','terms','milestones','documents','status_history','po_number','deposit_amount','payment_terms','fx_rate','shipping','base_goods_total_usd','freight_charge_usd','insurance_charge_usd','cif_value_usd','import_duty_usd','customs_service_charge_usd','environmental_levy_usd','vat_gct_usd','port_handling_usd','final_landed_total_usd','duty_rate_applied','vat_rate_applied','created_at'] },
  payments:           { table:'payments',           columns:['id','order_id','buyer_org_id','amount','currency','method','provider','status','metadata','provider_data','created_at','captured_at','wam_payment_id','wam_checkout_url','wam_status'] },
  landed_cost_scenarios:{ table:'landed_cost_scenarios', columns:['id','org_id','input','result','created_at'] },
  trade_rules:        { table:'trade_rules',        columns:['id','jurisdiction','product_scope','title','rule_type','value','source_url','source_tier','effective_from'] },
  hs_candidates:      { table:'hs_candidates',      columns:['id','hs','description','jurisdiction','confidence','source_url'] },
  activity:           { table:'activity',           columns:['id','action','actor','target','detail','at'] },
  sources:            { table:'sources',            columns:['id','name','url','tier','owner','terms','active','added_at'] },
};
const JSON_COLS = new Set(['verification','provenance','metadata','provider_data','detail','input','result','product_scope','terms','milestones','documents','status_history','negotiation_thread','attachments','shipping','landed_cost_estimate']);
const NUMERIC_COLS = new Set(['price_usd','amount','moq','quantity','confidence','deposit_amount','fx_rate','base_goods_total_usd','freight_charge_usd','insurance_charge_usd','cif_value_usd','import_duty_usd','customs_service_charge_usd','environmental_levy_usd','vat_gct_usd','port_handling_usd','final_landed_total_usd','duty_rate_applied','vat_rate_applied']);

function cleanVal(v, col){
  if (v === undefined || v === null) return null;
  if (JSON_COLS.has(col)){
    // node-pg serializes JS ARRAYS to Postgres array literals (invalid JSON for jsonb),
    // so always pass explicit JSON text for jsonb columns.
    if (typeof v === 'string') return v;         // assume already JSON text
    return JSON.stringify(v);                    // object/array -> JSON text
  }
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function hydrate(db){
  for (const key of Object.keys(TABLES)){
    const { table, columns } = TABLES[key];
    const r = await pool.query(`SELECT ${columns.join(',')} FROM ${table}`);
    db[key] = r.rows.map(row => {
      const o = {};
      for (const c of columns){
        let v = row[c];
        if (v instanceof Date) v = v.toISOString();
        else if (NUMERIC_COLS.has(c) && v !== null) v = Number(v);
        else if (v !== null && typeof v === 'object' && !Array.isArray(v)) v = v; // jsonb already object
        o[c] = v;
      }
      return o;
    });
  }
}

async function flushAll(db){
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const key of Object.keys(TABLES)){
      const { table, columns } = TABLES[key];
      const rows = db[key] || [];
      const colList = columns.join(',');
      const conflict = table === 'trade_orders' ? 'id' : 'id';
      const update = columns.filter(c=>c!==conflict).map(c=>`${c}=EXCLUDED.${c}`).join(',');
      for (const row of rows){
        const vals = columns.map(c => cleanVal(row[c], c));
        const placeholders = columns.map((_,i)=>`$${i+1}`).join(',');
        await client.query(
          `INSERT INTO ${table} (${colList}) VALUES (${placeholders})
           ON CONFLICT (${conflict}) DO UPDATE SET ${update}`,
          vals
        );
      }
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Ensure schema is applied.
async function migrate(){
  const fs = require('node:fs'); const path = require('node:path');
  const sql = fs.readFileSync(path.join(__dirname,'..','db','schema.sql'),'utf8');
  await pool.query(sql);
}

async function ping(){ const r=await pool.query('SELECT 1'); return r.rows[0]; }
async function count(table){ const r=await pool.query(`SELECT count(*)::int AS n FROM ${table}`); return r.rows[0].n; }

// ---- Roadmap: Escrow & Settlement (direct, Postgres-native) ----
async function createEscrow({ order_id, buyer_id, seller_id, amount_total_usd, platform_fee_usd, seller_net_payout_usd, inbound_rail, payment_currency, fx_rate, checkout_url, expires_at }){
  const r = await pool.query(
    `INSERT INTO trade_escrows (order_id,buyer_id,seller_id,status,amount_total_usd,platform_fee_usd,seller_net_payout_usd,inbound_rail,payment_currency,fx_rate,checkout_url,expires_at)
     VALUES ($1,$2,$3,'AWAITING_PAYMENT',$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [order_id,buyer_id,seller_id,amount_total_usd,platform_fee_usd,seller_net_payout_usd,inbound_rail,payment_currency||'USD',fx_rate||1,checkout_url,expires_at]
  );
  return r.rows[0];
}
async function getEscrow(id){ const r=await pool.query('SELECT * FROM trade_escrows WHERE id=$1',[id]); return r.rows[0]||null; }
async function getEscrowByOrder(orderId){ const r=await pool.query('SELECT * FROM trade_escrows WHERE order_id=$1',[orderId]); return r.rows[0]||null; }
async function transitionEscrow(id, newStatus, { actor_id, actor_role='SYSTEM', notes, metadata, tx_ref, rail, funded_at, released_at } = {}){
  const cur = await getEscrow(id); if (!cur) return { ok:false, error:'not_found' };
  const prev = cur.status;
  const sets = ['status=$2']; const params=[id,newStatus];
  if (tx_ref){ params.push(tx_ref); sets.push(`inbound_tx_ref=$${params.length}`); }
  if (rail){ params.push(rail); sets.push(`inbound_rail=$${params.length}`); }
  if (funded_at){ params.push(funded_at); sets.push(`funded_at=$${params.length}`); }
  if (released_at){ params.push(released_at); sets.push(`released_at=$${params.length}`); }
  params.push(actor_id||null, actor_role, notes||null, metadata||{});
  sets.push(`$${params.length-3}=$`); // placeholder fix below
  // simpler: rebuild
  const up = await pool.query(`UPDATE trade_escrows SET status=$1, inbound_tx_ref=COALESCE($2,inbound_tx_ref), funded_at=COALESCE($3,funded_at), released_at=COALESCE($4,released_at) WHERE id=$5 RETURNING *`,
    [newStatus, tx_ref||null, funded_at||null, released_at||null, id]);
  const escrow = up.rows[0];
  await pool.query(`INSERT INTO escrow_events (escrow_id,previous_status,new_status,actor_id,actor_role,notes,event_metadata) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, prev, newStatus, actor_id||null, actor_role, notes||null, metadata||{}]);
  return { ok:true, escrow };
}
async function escrowEvents(id){ const r=await pool.query('SELECT * FROM escrow_events WHERE escrow_id=$1 ORDER BY created_at DESC',[id]); return r.rows; }

// ---- Roadmap: Landed Cost (direct) ----
async function countryProfile(iso){ const r=await pool.query('SELECT * FROM country_trade_profiles WHERE iso_code=$1',[iso]); return r.rows[0]||null; }
async function upsertCountryProfile(p){
  const r=await pool.query(`INSERT INTO country_trade_profiles (iso_code,name,default_currency,vat_gct_rate,customs_service_charge,environmental_levy,is_caricom_member)
    VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (iso_code) DO UPDATE SET name=EXCLUDED.name,vat_gct_rate=EXCLUDED.vat_gct_rate,customs_service_charge=EXCLUDED.customs_service_charge,environmental_levy=EXCLUDED.environmental_levy,is_caricom_member=EXCLUDED.is_caricom_member RETURNING *`,
    [p.iso_code,p.name,p.default_currency||'USD',p.vat_gct_rate||0,p.customs_service_charge||0,p.environmental_levy||0,p.is_caricom_member!==false]);
  return r.rows[0];
}
async function tariffByHs(hs){ const r=await pool.query('SELECT * FROM tariff_schedules WHERE hs_code=$1',[hs]); return r.rows[0]||null; }
async function upsertTariff(p){
  const r=await pool.query(`INSERT INTO tariff_schedules (hs_code,description,standard_cet_rate,caricom_duty_rate,is_sps_required) VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (hs_code) DO UPDATE SET description=EXCLUDED.description,standard_cet_rate=EXCLUDED.standard_cet_rate,caricom_duty_rate=EXCLUDED.caricom_duty_rate,is_sps_required=EXCLUDED.is_sps_required RETURNING *`,
    [p.hs_code,p.description,p.standard_cet_rate||0,p.caricom_duty_rate||0,!!p.is_sps_required]);
  return r.rows[0];
}
async function freightQuote(origin,dest,mode){ const r=await pool.query('SELECT * FROM freight_routes WHERE origin_country=$1 AND destination_country=$2 ORDER BY est_transit_days LIMIT 1',[origin,dest]); return r.rows[0]||null; }
async function upsertFreight(p){
  const r=await pool.query(`INSERT INTO freight_routes (origin_country,destination_country,carrier_name,transit_mode,base_fee_usd,per_cbm_usd,per_kg_usd,est_transit_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [p.origin_country,p.destination_country,p.carrier_name,p.transit_mode||'MARITIME_LCL',p.base_fee_usd||0,p.per_cbm_usd||0,p.per_kg_usd||0,p.est_transit_days||0]);
  return r.rows[0];
}
async function listCountryProfiles(){ const r=await pool.query('SELECT * FROM country_trade_profiles ORDER BY name'); return r.rows; }
async function listTariffs(){ const r=await pool.query('SELECT * FROM tariff_schedules ORDER BY hs_code'); return r.rows; }
async function listFreight(){ const r=await pool.query('SELECT * FROM freight_routes'); return r.rows; }


// ---- Roadmap: Trade orders (Postgres-native) ----
async function createTradeOrder(o){
  const r = await pool.query(
    `INSERT INTO trade_orders
      (id,order_number,buyer_org_id,supplier_org_id,product,quantity,price_usd,currency,incoterm,status,origin_country,destination_country,has_caricom_coo,terms,
       base_goods_total_usd,freight_charge_usd,insurance_charge_usd,cif_value_usd,import_duty_usd,customs_service_charge_usd,environmental_levy_usd,vat_gct_usd,port_handling_usd,final_landed_total_usd,duty_rate_applied,vat_rate_applied)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'created',$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING *`,
    [o.id, o.order_number, o.buyer_org_id||null, o.supplier_org_id||null, o.product||'Trade order', o.quantity||1, o.price_usd||0,
     o.currency||'USD', o.incoterm||'CIF', o.origin_country, o.destination_country, o.has_caricom_coo!==false, o.terms||{},
     o.base_goods_total_usd||0, o.freight_charge_usd||0, o.insurance_charge_usd||0, o.cif_value_usd||0, o.import_duty_usd||0,
     o.customs_service_charge_usd||0, o.environmental_levy_usd||0, o.vat_gct_usd||0, o.port_handling_usd||0, o.final_landed_total_usd||0,
     o.duty_rate_applied||0, o.vat_rate_applied||0]
  );
  return r.rows[0];
}
async function getTradeOrder(id){ const r=await pool.query('SELECT * FROM trade_orders WHERE id=$1',[id]); return r.rows[0]||null; }
async function listTradeOrders(){ const r=await pool.query('SELECT * FROM trade_orders ORDER BY created_at DESC'); return r.rows; }


// ---- Roadmap: Advertising platform ----
async function createAd(a){
  const r = await pool.query(
    `INSERT INTO ads (org_id,business_id,advertiser,title,body,image_url,target_url,placement,budget_usd,status,starts_at,ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11) RETURNING *`,
    [a.org_id||null,a.business_id||null,a.advertiser||null,a.title,a.body||null,a.image_url||null,a.target_url||null,
     a.placement||'directory',a.budget_usd||0,a.starts_at||null,a.ends_at||null]
  );
  return r.rows[0];
}
async function listActiveAds(placement){
  const r = await pool.query(
    `SELECT * FROM ads WHERE status='active' AND ($1::text IS NULL OR placement=$1::text OR placement='both')
     ORDER BY created_at DESC LIMIT 12`, [placement||null]);
  return r.rows;
}
async function listAds(){ const r=await pool.query('SELECT * FROM ads ORDER BY created_at DESC'); return r.rows; }
async function getAd(id){ const r=await pool.query('SELECT * FROM ads WHERE id=$1',[id]); return r.rows[0]||null; }
async function setAdStatus(id, status){ const r=await pool.query('UPDATE ads SET status=$2 WHERE id=$1 RETURNING *',[id,status]); return r.rows[0]||null; }
async function recordAdEvent(adId, type){
  await pool.query('INSERT INTO ad_events (ad_id,type) VALUES ($1,$2)',[adId,type]);
  const col = type==='click' ? 'clicks' : 'impressions';
  await pool.query(`UPDATE ads SET ${col} = ${col} + 1 WHERE id=$1`,[adId]);
  return true;
}
async function adStats(){ const r=await pool.query("SELECT count(*)::int AS total, COALESCE(sum(impressions),0)::int AS impressions, COALESCE(sum(clicks),0)::int AS clicks FROM ads"); return r.rows[0]; }


// ---- AI Operations Team: agent run log ----
async function createAgentRun(agent, input){ const r=await pool.query('INSERT INTO agent_runs (agent,status,input,started_at) VALUES ($1,$2,$3,now()) RETURNING *',[agent,'running',input||{}]); return r.rows[0]; }
async function finishAgentRun(id,status,output){ const r=await pool.query('UPDATE agent_runs SET status=$2, output=$3, finished_at=now() WHERE id=$1 RETURNING *',[id,status,output||{}]); return r.rows[0]; }
async function listAgentRuns(limit){ const r=await pool.query('SELECT * FROM agent_runs ORDER BY started_at DESC LIMIT $1',[limit||50]); return r.rows; }
async function lastAgentRun(agent){ const r=await pool.query('SELECT * FROM agent_runs WHERE agent=$1 ORDER BY started_at DESC LIMIT 1',[agent]); return r.rows[0]||null; }

module.exports = {
  pool, DATABASE_URL, TABLES, hydrate, flushAll, migrate, ping, count,
  createEscrow, getEscrow, getEscrowByOrder, transitionEscrow, escrowEvents,
  countryProfile, upsertCountryProfile, tariffByHs, upsertTariff, freightQuote, upsertFreight,
  listCountryProfiles, listTariffs, listFreight,
  createTradeOrder, getTradeOrder, listTradeOrders,
  createAd, listActiveAds, listAds, getAd, setAdStatus, recordAdEvent, adStats,
  createAgentRun, finishAgentRun, listAgentRuns, lastAgentRun,
};
