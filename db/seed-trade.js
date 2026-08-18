// db/seed-trade.js — Seed country_trade_profiles, tariff_schedules, freight_routes.
// Usage: node db/seed-trade.js  (run once against Postgres)
'use strict';
const pg = require('../src/pg');

const COUNTRIES = [
  // iso, name, currency, vat_gct, customs_charge, env_levy, caricom
  ['TT','Trinidad & Tobago','TTD',0.1250,0.0200,0.0000,true],
  ['BB','Barbados','BBD',0.1750,0.0000,0.0000,true],
  ['GY','Guyana','GYD',0.1400,0.0000,0.0000,true],
  ['JM','Jamaica','JMD',0.1500,0.0000,0.0000,true],
  ['BS','The Bahamas','BSD',0.0000,0.0000,0.0000,true],
  ['HT','Haiti','HTG',0.1000,0.0000,0.0000,false],
  ['DO','Dominican Republic','DOP',0.1800,0.0000,0.0000,false],
  ['LC','Saint Lucia','XCD',0.1250,0.0000,0.0000,true],
  ['VC','St Vincent & Grenadines','XCD',0.1500,0.0000,0.0000,true],
  ['GD','Grenada','XCD',0.1500,0.0000,0.0000,true],
  ['DM','Dominica','XCD',0.1500,0.0000,0.0000,true],
  ['KN','St Kitts & Nevis','XCD',0.1700,0.0000,0.0000,true],
  ['AG','Antigua & Barbuda','XCD',0.1500,0.0000,0.0000,true],
  ['SR','Suriname','SRD',0.1000,0.0000,0.0000,false],
  ['CW','Curaçao','ANG',0.0600,0.0000,0.0000,false],
  ['SX','Sint Maarten','ANG',0.0500,0.0000,0.0000,false],
  ['GP','Guadeloupe','EUR',0.2000,0.0000,0.0000,false],
  ['MQ','Martinique','EUR',0.2000,0.0000,0.0000,false],
  ['KY','Cayman Islands','KYD',0.0000,0.0000,0.0000,false],
  ['TC','Turks & Caicos','USD',0.0000,0.0000,0.0000,false],
  ['BM','Bermuda','BMD',0.0000,0.0000,0.0000,false],
  ['PR','Puerto Rico','USD',0.1050,0.0000,0.0000,false],
  ['VG','Virgin Islands (UK)','USD',0.0000,0.0000,0.0000,false],
  ['VI','Virgin Islands (US)','USD',0.0000,0.0000,0.0000,false],
  ['US','United States','USD',0.0000,0.0000,0.0000,false],
  ['CA','Canada','CAD',0.0500,0.0000,0.0000,false],
  ['GB','United Kingdom','GBP',0.2000,0.0000,0.0000,false],
];
const TARIFFS = [
  ['1806.32.00','Chocolate & cocoa preparations',0.2000,0.0000,false],
  ['0901.21.00','Coffee, roasted, not decaffeinated',0.2000,0.0000,false],
  ['0904.21.00','Pepper (dried/crushed)',0.2000,0.0000,false],
  ['0908.11.00','Nutmeg, neither crushed nor ground',0.1500,0.0000,false],
  ['2208.40.00','Rum & tafia',0.4000,0.0000,false],
  ['1704.90.00','Sugar confectionery',0.2500,0.0000,false],
  ['2005.99.00','Prepared vegetables (not frozen)',0.2500,0.0000,false],
  ['1604.14.00','Tuna, prepared/preserved',0.2000,0.0000,false],
  ['1212.21.00','Seaweed (including sea moss)',0.1500,0.0000,false],
  ['3301.29.00','Essential oils (except citrus)',0.1500,0.0000,false],
  ['6309.00.00','Worn clothing',0.2000,0.0000,false],
  ['6912.00.00','Ceramic tableware',0.2000,0.0000,false],
];
const FREIGHT = [
  ['TT','BB','Tropical Shipping','MARITIME_LCL',300.00,100.00,0.40,4],
  ['BB','TT','Tropical Shipping','MARITIME_LCL',300.00,100.00,0.40,4],
  ['TT','GY','Tropical Shipping','MARITIME_LCL',380.00,120.00,0.45,6],
  ['GY','TT','Tropical Shipping','MARITIME_LCL',380.00,120.00,0.45,6],
  ['BB','GY','Tropical Shipping','MARITIME_LCL',360.00,115.00,0.42,5],
  ['GY','BB','Tropical Shipping','MARITIME_LCL',360.00,115.00,0.42,5],
  ['TT','US','CAL Cargo','AIR_CARGO',0.00,0.00,2.80,2],
  ['BB','US','FedEx','AIR_CARGO',0.00,0.00,3.20,2],
  ['TT','JM','Tropical Shipping','MARITIME_LCL',340.00,110.00,0.44,5],
  ['JM','TT','Tropical Shipping','MARITIME_LCL',340.00,110.00,0.44,5],
];
async function main(){
  for (const [iso,name,cur,vat,csc,env,caricom] of COUNTRIES) await pg.upsertCountryProfile({iso_code:iso,name,default_currency:cur,vat_gct_rate:vat,customs_service_charge:csc,environmental_levy:env,is_caricom_member:caricom});
  for (const [hs,desc,std,caricom,sps] of TARIFFS) await pg.upsertTariff({hs_code:hs,description:desc,standard_cet_rate:std,caricom_duty_rate:caricom,is_sps_required:sps});
  for (const [o,d,car,mode,base,cbm,kg,days] of FREIGHT) await pg.upsertFreight({origin_country:o,destination_country:d,carrier_name:car,transit_mode:mode,base_fee_usd:base,per_cbm_usd:cbm,per_kg_usd:kg,est_transit_days:days});
  console.log('seeded', COUNTRIES.length, 'country profiles,', TARIFFS.length, 'tariffs,', FREIGHT.length, 'freight routes');
  process.exit(0);
}
main().catch(e=>{ console.error(e); process.exit(1); });
