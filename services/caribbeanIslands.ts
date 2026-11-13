/**
 * Caribbean island and territory list for map defaults and address-lookup bias.
 *
 * This is not a service-area list. Do not use it in copy that claims Juvay,
 * tracking, or any vertical is available on an island.
 */
import data from '../data/caribbeanIslands.json';

export type LatLng = { lat: number; lng: number };

export type CaribbeanIsland = {
  id: string;
  name: string;
  iso: string | null;
  center: LatLng;
  defaultZoom: number;
  currency: string | null;
};

export const CARIBBEAN_OVERVIEW: CaribbeanIsland = data.overview as CaribbeanIsland;
export const CARIBBEAN_ISLANDS: CaribbeanIsland[] = data.islands as CaribbeanIsland[];

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function islandById(id: string): CaribbeanIsland | null {
  const key = String(id || '').trim().toLowerCase();
  return CARIBBEAN_ISLANDS.find((i) => i.id === key) || null;
}

export function islandByIso(iso: string): CaribbeanIsland | null {
  const key = String(iso || '').trim().toUpperCase();
  if (!key) return null;
  return CARIBBEAN_ISLANDS.find((i) => i.iso === key) || null;
}

/** Closest island center to a point. Used only for map framing and geocode bias. */
export function nearestIsland(point: LatLng | null | undefined): CaribbeanIsland {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return CARIBBEAN_OVERVIEW;
  }
  let best = CARIBBEAN_ISLANDS[0];
  let bestKm = Infinity;
  for (const island of CARIBBEAN_ISLANDS) {
    const km = haversineKm(point, island.center);
    if (km < bestKm) {
      bestKm = km;
      best = island;
    }
  }
  return best || CARIBBEAN_OVERVIEW;
}

/** Google / geocoder location bias around an island or a known point. */
export function geocodeBiasFor(
  pointOrIsland?: LatLng | CaribbeanIsland | string | null,
): { center: LatLng; radiusMeters: number; iso?: string } {
  if (typeof pointOrIsland === 'string') {
    const found = islandById(pointOrIsland) || islandByIso(pointOrIsland) || CARIBBEAN_OVERVIEW;
    return { center: found.center, radiusMeters: biasRadius(found), iso: found.iso || undefined };
  }
  if (pointOrIsland && 'center' in pointOrIsland && 'defaultZoom' in pointOrIsland) {
    const island = pointOrIsland as CaribbeanIsland;
    return { center: island.center, radiusMeters: biasRadius(island), iso: island.iso || undefined };
  }
  const point = pointOrIsland as LatLng | null | undefined;
  if (point && Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
    const island = nearestIsland(point);
    return { center: point, radiusMeters: biasRadius(island), iso: island.iso || undefined };
  }
  return { center: CARIBBEAN_OVERVIEW.center, radiusMeters: 2_000_000 };
}

function biasRadius(island: CaribbeanIsland): number {
  if (!island.iso) return 2_000_000;
  if (island.defaultZoom <= 7) return 400_000;
  if (island.defaultZoom <= 9) return 160_000;
  if (island.defaultZoom <= 11) return 80_000;
  return 40_000;
}

export function mapViewFor(point?: LatLng | null): { center: LatLng; zoom: number } {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) {
    return { center: CARIBBEAN_OVERVIEW.center, zoom: CARIBBEAN_OVERVIEW.defaultZoom };
  }
  const island = nearestIsland(point);
  return { center: point, zoom: Math.max(island.defaultZoom, 12) };
}
