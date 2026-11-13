import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TrackingMap, isLocalHost } from '../components/TrackingMap';
import { TrackingUpgradeCard } from '../components/TrackingUpgradeCard';
import { getToken } from '../services/selfHostedApi';
import {
  endRoute,
  fetchRoute,
  fetchTrackingStatus,
  markStopDelivered,
  postRouteLocation,
  startRoute,
  type LocationView,
  type OperatorRoute,
  type TrackingStatus,
} from '../services/deliveryTrackingApi';

const POST_EVERY_MS = 8000;

export const DriverRoute: React.FC = () => {
  const { id } = useParams();
  const [route, setRoute] = useState<OperatorRoute | null>(null);
  const [location, setLocation] = useState<LocationView | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [consent, setConsent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [wakeOn, setWakeOn] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastPostRef = useRef(0);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);
  const signedIn = typeof window !== 'undefined' && !!getToken();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchRoute(id);
      setRoute(data.route);
      setLocation(data.location);
      setError('');
    } catch (e: unknown) {
      const err = e as Error & { status?: number };
      setError(err.message || 'Job not found');
    }
  }, [id]);

  useEffect(() => {
    if (signedIn) {
      fetchTrackingStatus().then(setStatus).catch(() => setStatus(null));
    }
    load();
  }, [load, signedIn]);

  const stopSharing = useCallback(async () => {
    setSharing(false);
    if (watchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (wakeRef.current) {
      try { await wakeRef.current.release(); } catch { /* ignore */ }
      wakeRef.current = null;
      setWakeOn(false);
    }
  }, []);

  const requestWake = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
      if (nav.wakeLock) {
        wakeRef.current = await nav.wakeLock.request('screen');
        setWakeOn(true);
      }
    } catch {
      setWakeOn(false);
    }
  }, []);

  const beginWatch = useCallback(() => {
    if (!id || !navigator.geolocation) {
      setGeoError('This browser cannot share location.');
      return;
    }
    setGeoError('');
    setSharing(true);
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const t = Date.now();
        if (t - lastPostRef.current < POST_EVERY_MS) return;
        lastPostRef.current = t;
        try {
          const result = await postRouteLocation(id, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          });
          setLocation(result.location);
        } catch (e: unknown) {
          const err = e as Error & { status?: number };
          if (err.status !== 429) setGeoError(err.message || 'Could not send location');
        }
      },
      (err) => setGeoError(err.message || 'Location permission was denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  }, [id]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && sharing) requestWake();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sharing, requestWake]);

  useEffect(() => () => { void stopSharing(); }, [stopSharing]);

  const onStart = async () => {
    if (!id || !consent) return;
    setBusy(true);
    try {
      const data = await startRoute(id);
      setRoute(data.route);
      await requestWake();
      beginWatch();
    } catch (e: unknown) {
      setError((e as Error).message || 'Could not start');
    } finally {
      setBusy(false);
    }
  };

  const onEnd = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await stopSharing();
      const data = await endRoute(id);
      setRoute(data.route);
    } catch (e: unknown) {
      setError((e as Error).message || 'Could not end');
    } finally {
      setBusy(false);
    }
  };

  const onDelivered = async (stopId: string) => {
    if (!id) return;
    setBusy(true);
    try {
      const data = await markStopDelivered(id, stopId);
      setRoute(data.route);
    } catch (e: unknown) {
      setError((e as Error).message || 'Could not update stop');
    } finally {
      setBusy(false);
    }
  };

  if (!id) {
    return (
      <Shell>
        <h1 className="text-3xl font-black">Need a job id</h1>
        <p className="text-white/60">Open /driver/route/:id for a job that already exists. This page does not invent a provider or a route.</p>
      </Shell>
    );
  }

  if (!signedIn) {
    return (
      <Shell>
        <h1 className="text-3xl font-black">Sign in to open driver mode</h1>
        <p className="text-white/60">Only the assigned driver or seller can start sharing location.</p>
        <Link to="/login" className="inline-block text-yellow-400 underline font-bold">Sign in</Link>
      </Shell>
    );
  }

  if (error && !route) {
    return (
      <Shell>
        <p className="text-white/70">{error}</p>
        {status?.locked ? <TrackingUpgradeCard message={status.message} planNames={status.planNames} /> : null}
      </Shell>
    );
  }

  if (!route) {
    return (
      <Shell>
        <p className="text-white/60">Loading job…</p>
      </Shell>
    );
  }

  const active = route.status === 'active';
  const ended = route.status === 'ended';
  const vehicle = location?.state === 'live' && location.pin
    ? { ...location.pin, title: route.providerLabel || 'Provider', kind: 'vehicle' as const }
    : null;
  const stopPins = route.stops
    .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
    .map((s) => ({ lat: s.lat as number, lng: s.lng as number, title: s.label || `Stop ${s.sequence}`, kind: 'stop' as const }));

  return (
    <Shell>
      {isLocalHost() ? (
        <p className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          Local test — this is not the live Juvay site.
        </p>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
        {route.kind === 'visit' ? 'Visit' : route.kind === 'delivery' ? 'Delivery' : 'Route'} · driver mode
      </p>
      <h1 className="text-3xl font-black">{route.providerLabel || 'Provider'}</h1>
      <p className="text-white/60 text-sm">
        Status: {route.status}
        {sharing ? ' · sharing location' : ' · not sharing'}
        {wakeOn ? ' · screen wake lock on' : ''}
      </p>

      {active && sharing ? (
        <div className="rounded-xl border border-yellow-400 bg-yellow-400 text-black px-4 py-3 font-bold">
          Keep this screen open while driving. On iPhone, location sharing stops if the screen locks or you switch apps.
        </div>
      ) : null}

      <TrackingMap vehicle={vehicle} stops={stopPins} height="280px" />

      {location?.state === 'last_seen' && location.message ? (
        <p className="text-sm text-white/60">{location.message}</p>
      ) : null}
      {geoError ? <p className="text-sm text-red-300">{geoError}</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {!ended && route.status === 'planned' ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-3">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I agree to share this phone’s GPS location while this job is active. Sharing stops when I end the job, tap stop sharing, or close this page.
            </span>
          </label>
          <button
            type="button"
            disabled={!consent || busy}
            onClick={onStart}
            className="w-full min-h-[44px] rounded-xl bg-yellow-400 text-black font-black disabled:opacity-40"
          >
            Start {route.kind === 'visit' ? 'visit' : route.kind === 'delivery' ? 'delivery' : 'route'} and share location
          </button>
        </div>
      ) : null}

      {active ? (
        <div className="grid grid-cols-2 gap-2">
          {sharing ? (
            <button type="button" onClick={() => void stopSharing()} className="min-h-[44px] rounded-xl border border-white/20 font-bold">
              Stop sharing
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { void requestWake(); beginWatch(); }}
              className="min-h-[44px] rounded-xl border border-yellow-400 text-yellow-400 font-bold"
            >
              Resume sharing
            </button>
          )}
          <button type="button" disabled={busy} onClick={onEnd} className="min-h-[44px] rounded-xl bg-white text-black font-black">
            End {route.kind === 'visit' ? 'visit' : route.kind === 'delivery' ? 'delivery' : 'route'}
          </button>
        </div>
      ) : null}

      {ended ? <p className="text-white/60">Sharing has stopped. This job has ended.</p> : null}

      <ul className="space-y-2">
        {route.stops.map((s) => (
          <li key={s.id} className="rounded-xl border border-white/10 bg-[#111] p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-sm">{s.role} {s.sequence}{s.label ? ` · ${s.label}` : ''}</p>
              <p className="text-xs text-white/50">{s.status}</p>
            </div>
            {!ended && s.status !== 'delivered' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelivered(s.id)}
                className="min-h-[44px] shrink-0 rounded-xl border border-yellow-400 px-3 text-sm font-bold text-yellow-400"
              >
                Mark delivered
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </Shell>
  );
};

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-black text-white px-4 py-10">
    <div className="max-w-lg mx-auto space-y-4">{children}</div>
  </div>
);
