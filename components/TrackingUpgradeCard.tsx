import React from 'react';
import { Link } from 'react-router-dom';
import {
  premiumCheckoutClosedCopy,
  premiumPriceCopy,
  trackingExtraVehicleCopy,
  TRACKING_INCLUDED_VEHICLES,
} from '../services/juvayPlans';

/**
 * Honest locked-state card for free shops.
 * Headline is the official product line. Prices are read from juvayPlans.ts
 * (the one TTD price table) — never hard-coded here.
 */
export const TrackingUpgradeCard: React.FC<{
  message?: string | null;
  planNames?: string[];
  extraVehiclePriceTtd?: number | null;
  includedVehicles?: number;
}> = ({ message, includedVehicles }) => {
  const included = includedVehicles ?? TRACKING_INCLUDED_VEHICLES;
  const headline = (message && message.trim()) || 'Live tracking comes with Juvay Premium';
  const priceLine = premiumPriceCopy();
  const extraLine = trackingExtraVehicleCopy();

  return (
    <div className="rounded-2xl border border-yellow-400/40 bg-[#111] p-5 space-y-3 text-white">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Live tracking</p>
      <h2 className="text-xl font-black">{headline.endsWith('.') ? headline : `${headline}.`}</h2>
      <p className="text-sm text-white/70">
        Premium is {priceLine}. It includes live tracking for {included} vehicle.
        Extra tracked vehicles are {extraLine}.
        Customers do not pay to open a tracking link.
      </p>
      <p className="text-sm text-white/50">
        {premiumCheckoutClosedCopy()}
      </p>
      <Link
        to="/pricing"
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-yellow-400 px-4 font-black text-black"
      >
        See plans
      </Link>
    </div>
  );
};
