/**
 * Single source for Wam Caribbean coverage (wam.money/caribbean).
 * Prefer GET /api/wam/countries at runtime; this module seeds UI when offline.
 */
import raw from '../config/wamCountries.json';

export type WamCountryTier = 'tier1_full' | 'tier2_global' | 'tier3_case' | 'blocked';

export interface WamCountry {
  id: string;
  name: string;
  tier: WamCountryTier;
  currency_code: string | null;
  currency_symbol: string | null;
  phone_prefix: string | null;
  flag: string;
  ads_priority: number;
  active: boolean;
  source?: string;
  source_checked_on?: string;
}

const seeded = (raw as { countries: WamCountry[] }).countries;

export const WAM_COUNTRIES: WamCountry[] = seeded;

export function activeWamCountries(): WamCountry[] {
  return WAM_COUNTRIES.filter((c) => c.active && c.tier !== 'blocked').sort(
    (a, b) => a.ads_priority - b.ads_priority || a.name.localeCompare(b.name)
  );
}

export function tier1Countries(): WamCountry[] {
  return WAM_COUNTRIES.filter((c) => c.tier === 'tier1_full' && c.active);
}

export function getWamCountry(id: string | null | undefined): WamCountry | undefined {
  if (!id) return undefined;
  return WAM_COUNTRIES.find((c) => c.id === id || c.name.toLowerCase() === String(id).toLowerCase());
}

/** Labels for <select> — active markets only */
export function wamCountrySelectOptions(): { value: string; label: string }[] {
  return activeWamCountries().map((c) => ({
    value: c.id,
    label: `${c.flag} ${c.name}`,
  }));
}

/** Island name strings for legacy pickers that still want names */
export function wamCountryNames(): string[] {
  return activeWamCountries().map((c) => c.name);
}

export function adsAvailabilityCopy(): string {
  const t1 = tier1Countries().map((c) => c.name).join(', ');
  const t2count = WAM_COUNTRIES.filter((c) => c.tier === 'tier2_global' && c.active).length;
  return `${t1} has full Wam (local bank payouts). ${t2count} more Caribbean markets are live with global accounts — ads can run where Wam can take money; seller payout rails differ by tier.`;
}
