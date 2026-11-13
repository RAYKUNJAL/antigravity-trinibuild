/**
 * Same-origin live-tracking client. Customer track is free and unauthenticated.
 * Seller create is paid (Premium / configured tiers, or a tracking add-on).
 * Never sends or stores a server maps key.
 */
import { getToken } from './selfHostedApi';

export type JobKind = 'route' | 'delivery' | 'visit';
export type JobStatus = 'planned' | 'active' | 'ended';
export type StopStatus = 'pending' | 'next' | 'delivered';
export type LocationState = 'live' | 'last_seen' | 'not_sharing' | 'ended' | 'delivered';

export type LocationView = {
  state: LocationState;
  pin: { lat: number; lng: number } | null;
  message?: string;
  lastSeenAgoMinutes?: number;
  lastSeenAt?: number;
  ageMs?: number;
  hiddenBecauseStale?: boolean;
};

export type EtaView = {
  etaMinutes: number;
  distanceKm?: number | null;
  etaSource: 'google_routes' | 'approx';
  etaLabel: 'approx' | null;
  assumedSpeedKmh?: number;
  roadFactor?: number;
  note?: string;
} | null;

export type TrackStop = {
  id: string;
  sequence: number;
  role: string;
  status: StopStatus;
  label?: string | null;
};

export type OperatorStop = TrackStop & {
  orderRef?: string | null;
  shareToken: string;
  trackPath: string;
  lat?: number | null;
  lng?: number | null;
  deliveredAt?: number | null;
};

export type OperatorRoute = {
  id: string;
  kind: JobKind;
  status: JobStatus;
  sellerUserId?: string | null;
  storeId?: string | null;
  driverUserId: string;
  providerLabel: string;
  startedAt?: number | null;
  endedAt?: number | null;
  stops: OperatorStop[];
};

export type TrackView = {
  kind: JobKind;
  status: JobStatus;
  providerLabel: string;
  stop: TrackStop;
  location: LocationView;
  stopsAway: number | null;
  isNext: boolean;
  eta: EtaView;
  events: Array<{ event: string; at: number; sent: boolean; channel: string | null; note: string }>;
};

export type TrackingStatus = {
  requirePaid: boolean;
  allowed: boolean;
  locked: boolean;
  upgrade: boolean;
  message: string | null;
  planNames: string[];
  reason: string | null;
  includedVehicles?: number;
  extraVehicles?: number;
  maxVehicles?: number;
  usedVehicles?: number;
  extraVehiclePriceTtd?: number | null;
  premiumIntroPriceTtd?: number | null;
  premiumThenPriceTtd?: number | null;
  premiumIntroMonths?: number | null;
  customerTrackFree: boolean;
};

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && (data.error || data.message)) || `Request failed (${res.status})`) as Error & {
      status?: number;
      locked?: boolean;
      planNames?: string[];
      payload?: unknown;
    };
    err.status = res.status;
    err.locked = !!(data && data.locked);
    err.planNames = data && data.planNames;
    err.payload = data;
    throw err;
  }
  return data;
}

export function fetchTrackingStatus(storeId?: string): Promise<TrackingStatus> {
  const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
  return fetch(`/api/tracking/status${q}`, { headers: authHeaders() }).then(parse);
}

export function createTrackingRoute(body: Record<string, unknown>): Promise<{ route: OperatorRoute }> {
  return fetch('/api/routes', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(parse);
}

export function fetchRoute(id: string): Promise<{ route: OperatorRoute; location: LocationView }> {
  return fetch(`/api/routes/${encodeURIComponent(id)}`, { headers: authHeaders() }).then(parse);
}

export function startRoute(id: string): Promise<{ route: OperatorRoute; started?: boolean }> {
  return fetch(`/api/routes/${encodeURIComponent(id)}/start`, { method: 'POST', headers: authHeaders(), body: '{}' }).then(parse);
}

export function postRouteLocation(
  id: string,
  body: { lat: number; lng: number; accuracy?: number; heading?: number; speed?: number },
): Promise<{ accepted: boolean; location: LocationView }> {
  return fetch(`/api/routes/${encodeURIComponent(id)}/location`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).then(parse);
}

export function markStopDelivered(routeId: string, stopId: string): Promise<{ route: OperatorRoute }> {
  return fetch(`/api/routes/${encodeURIComponent(routeId)}/stops/${encodeURIComponent(stopId)}/delivered`, {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  }).then(parse);
}

export function endRoute(id: string): Promise<{ route: OperatorRoute; ended?: boolean }> {
  return fetch(`/api/routes/${encodeURIComponent(id)}/end`, { method: 'POST', headers: authHeaders(), body: '{}' }).then(parse);
}

export function fetchTrack(token: string): Promise<TrackView> {
  return fetch(`/api/track/${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } }).then(parse);
}
