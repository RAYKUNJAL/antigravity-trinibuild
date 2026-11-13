/**
 * Browser Google Maps JS API loader.
 * Key name is VITE_GOOGLE_MAPS_API_KEY only — same as Juvay .env.example
 * ("For Ride Tracking"). Pattern follows Fresh Catch's google-map.tsx:
 * hasValidApiKey rejects empty and redacted "AIzaSy...xxx" placeholders;
 * a single shared script promise; loader errors surface to the caller
 * so the map can fall back to OSM and never show
 * "For development purposes only".
 */

export function hasValidApiKey(key: string | undefined): boolean {
  return Boolean(key && key.trim().length > 10 && !key.includes('...'));
}

export function browserMapsKey(): string {
  const raw = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY;
  return hasValidApiKey(raw) ? String(raw).trim() : '';
}

type GoogleMapsNamespace = {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMapHandle;
  Marker: new (opts: Record<string, unknown>) => GoogleMarkerHandle;
  LatLng?: new (lat: number, lng: number) => unknown;
};

export type GoogleMapHandle = {
  setCenter: (c: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
  getDiv: () => HTMLElement;
};

export type GoogleMarkerHandle = {
  setMap: (m: GoogleMapHandle | null) => void;
  setPosition: (c: { lat: number; lng: number }) => void;
  setTitle?: (t: string) => void;
};

declare global {
  interface Window {
    google?: { maps: GoogleMapsNamespace };
    gm_authFailure?: () => void;
  }
}

let mapsPromise: Promise<GoogleMapsNamespace> | null = null;

export function loadGoogleMapsApi(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window not available'));
  }
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }
  if (mapsPromise) return mapsPromise;
  const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
  mapsPromise = new Promise((resolve, reject) => {
    const prior = document.querySelector('script[data-juvay-gmaps]') as HTMLScriptElement | null;
    const fail = (msg: string) => {
      mapsPromise = null;
      reject(new Error(msg));
    };
    // Official auth-failure hook. Also catches billing / restriction failures
    // that would otherwise paint the "For development purposes only" watermark.
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      try { previous?.(); } catch { /* ignore */ }
      fail('Google Maps authentication failed');
    };
    const onLoad = () => {
      const maps = window.google?.maps;
      if (maps?.Map) resolve(maps);
      else fail('Google Maps failed to initialise');
    };
    if (prior) {
      prior.addEventListener('load', onLoad);
      prior.addEventListener('error', () => fail('Failed to load Google Maps script'));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.dataset.juvayGmaps = '1';
    script.onload = onLoad;
    script.onerror = () => fail('Failed to load Google Maps script');
    document.head.appendChild(script);
  });
  return mapsPromise;
}

export function hasDevWatermark(container: HTMLElement | null): boolean {
  if (!container) return false;
  const text = `${container.innerText || ''} ${container.textContent || ''}`;
  if (/for development purposes only/i.test(text)) return true;
  const imgs = container.querySelectorAll('img, div, span');
  for (const el of Array.from(imgs)) {
    const t = `${(el as HTMLElement).innerText || ''} ${(el as HTMLElement).getAttribute('alt') || ''} ${(el as HTMLElement).getAttribute('title') || ''}`;
    if (/for development purposes only/i.test(t)) return true;
  }
  return false;
}
