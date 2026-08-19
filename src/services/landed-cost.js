// src/services/landed-cost.js — Deterministic landed-cost engine over Postgres reference data.
'use strict';
const pg = require('../pg');
const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

async function computeLandedCost(spec){
  const { origin_country, destination_country, incoterm='CIF', has_caricom_coo=true, line_items=[] } = spec || {};
  const dest = await pg.countryProfile(destination_country);
  const origin = await pg.countryProfile(origin_country);

  let base_goods_total = 0, total_weight = 0, total_volume = 0;
  for (const li of line_items || []){
    base_goods_total += (Number(li.unit_price_usd)||0) * (Number(li.quantity)||1);
    total_weight   += Number(li.weight_kg)||0;
    total_volume   += Number(li.volume_cbm)||0;
  }
  base_goods_total = round2(base_goods_total);

  const freight = await pg.freightQuote(origin_country, destination_country);
  let freight_charge = 0;
  if (freight){
    const isAir = (freight.transit_mode||'').toUpperCase().includes('AIR');
    freight_charge = round2(Number(freight.base_fee_usd||0) + (isAir ? Number(freight.per_kg_usd||0)*total_weight : Number(freight.per_cbm_usd||0)*total_volume));
  }

  const insurance_charge = round2(base_goods_total * 0.01); // 1% of goods
  const cif_value = round2(base_goods_total + freight_charge + insurance_charge);

  const tariff = line_items && line_items[0] && line_items[0].hs_code ? await pg.tariffByHs(line_items[0].hs_code) : null;
  const duty_rate = tariff ? Number(has_caricom_coo ? (tariff.caricom_duty_rate||0) : (tariff.standard_cet_rate||0)) : 0;
  const import_duty = round2(cif_value * duty_rate);
  const customs_charge = round2(cif_value * (dest ? Number(dest.customs_service_charge||0) : 0));
  const environmental_levy = round2(cif_value * (dest ? Number(dest.environmental_levy||0) : 0));

  const vat_base = cif_value + import_duty + customs_charge + environmental_levy;
  const vat_rate = dest ? Number(dest.vat_gct_rate) : 0;
  const vat_gct = round2(vat_base * vat_rate);
  const port_handling = 150.00;

  const final_landed_total = round2(cif_value + import_duty + customs_charge + environmental_levy + vat_gct + port_handling);

  return {
    origin_country, destination_country, incoterm, has_caricom_coo,
    base_goods_total_usd: base_goods_total,
    freight_charge_usd: freight_charge,
    insurance_charge_usd: insurance_charge,
    cif_value_usd: cif_value,
    import_duty_usd: import_duty,
    customs_service_charge_usd: customs_charge,
    environmental_levy_usd: environmental_levy,
    vat_gct_usd: vat_gct,
    port_handling_usd: port_handling,
    final_landed_total_usd: final_landed_total,
    duty_rate_applied: duty_rate,
    vat_rate_applied: vat_rate,
    carrier: freight ? freight.carrier_name : null,
    transit_mode: freight ? freight.transit_mode : null,
    est_transit_days: freight ? freight.est_transit_days : null,
    notes: (has_caricom_coo && duty_rate === 0) ? 'Duty-free CSME preferential rate applied via CARICOM COO.' : null,
  };
}
module.exports = { computeLandedCost };
