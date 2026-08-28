/**
 * Same-origin rides v1. No invented fares. Not pay→fulfill.
 */

async function parse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function fetchListedRides(opts: { island?: string; schoolRun?: boolean; serviceType?: string } = {}) {
  const q = new URLSearchParams();
  if (opts.island) q.set('island', opts.island);
  if (opts.schoolRun) q.set('schoolRun', '1');
  if (opts.serviceType) q.set('serviceType', opts.serviceType);
  const res = await fetch(`/api/rides/listed${q.toString() ? `?${q}` : ''}`, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || data.listedCount === 0 || !Array.isArray(data.listed)) {
    return {
      unavailable: true,
      listedCount: 0,
      listed: [] as Array<{ id: string; name: string; plate: string; phone: string; wamHandle?: string; island?: string; pinLat?: number | null; pinLng?: number | null }>,
      line1: 'Rides are unavailable on this origin.',
      line2: 'No drivers are listed. Juvay does not invent a fare or a live booking button.',
    };
  }
  return data;
}

export function fetchChildren(parentPhone: string) {
  return fetch(`/api/rides/children?parentPhone=${encodeURIComponent(parentPhone)}`, { headers: { Accept: 'application/json' } }).then(parse);
}

export function addChildProfile(body: Record<string, unknown>) {
  return fetch('/api/rides/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function setDriverPin(body: Record<string, unknown>) {
  return fetch('/api/drive/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function startRideTrip(id: string, driverPhone: string, pin: string) {
  return fetch(`/api/rides/trips/${id}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ driverPhone, pin }),
  }).then(parse);
}

export function trackRideTrip(id: string, body: Record<string, unknown>) {
  return fetch(`/api/rides/trips/${id}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function applyToDrive(body: Record<string, unknown>) {
  return fetch('/api/drive/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function fetchDriveMe(phone: string) {
  return fetch(`/api/drive/me?phone=${encodeURIComponent(phone)}`, { headers: { Accept: 'application/json' } }).then(parse);
}

export function fetchDriveSubscription() {
  return fetch('/api/drive/subscription', { headers: { Accept: 'application/json' } }).then(parse);
}

export function startDriveSubWam(phone: string) {
  return fetch('/api/drive/subscription/wam', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ phone }),
  }).then(parse);
}

export function fetchDriverOffers(phone: string) {
  return fetch(`/api/drive/offers?phone=${encodeURIComponent(phone)}`, { headers: { Accept: 'application/json' } }).then(parse);
}

export function createRideOffer(body: Record<string, unknown>) {
  return fetch('/api/rides/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function acceptRideOffer(id: string, driverPhone: string) {
  return fetch(`/api/rides/offers/${id}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ driverPhone }),
  }).then(parse);
}

export function counterRideOffer(id: string, driverPhone: string, counterTtd: string) {
  return fetch(`/api/rides/offers/${id}/counter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ driverPhone, counterTtd }),
  }).then(parse);
}

export function agreeRideOffer(id: string, body: Record<string, unknown>) {
  return fetch(`/api/rides/offers/${id}/agree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }).then(parse);
}

export function fetchRideTrip(id: string, shareToken?: string) {
  const q = shareToken ? `?t=${encodeURIComponent(shareToken)}` : '';
  return fetch(`/api/rides/trips/${id}${q}`, { headers: { Accept: 'application/json' } }).then(parse);
}

export function tapCashPaid(id: string, riderPhone: string) {
  return fetch(`/api/rides/trips/${id}/cash-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ riderPhone }),
  }).then(parse);
}

export function tapCashReceived(id: string, driverPhone: string) {
  return fetch(`/api/rides/trips/${id}/cash-received`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ driverPhone }),
  }).then(parse);
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Photo must be an image'));
      return;
    }
    if (file.size > 2_500_000) {
      reject(new Error('Photo must be under 2.5 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(file);
  });
}
