import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TrackingMap, isLocalHost } from '../components/TrackingMap';
import { fetchTrack, type TrackView } from '../services/deliveryTrackingApi';

export const TrackJob: React.FC = () => {
  const { token } = useParams();
  const [view, setView] = useState<TrackView | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    try {
      const data = await fetchTrack(token);
      setView(data);
      setError('');
    } catch (e: unknown) {
      setError((e as Error).message || 'Tracking link not found');
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [token]);

  if (!token) {
    return (
      <Shell>
        <h1 className="text-3xl font-black">Need a tracking link</h1>
        <p className="text-white/60">This page stays empty until you open a private /track/… link from your order. Juvay does not invent a provider or a live pin.</p>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <p className="text-white/70">{error}</p>
      </Shell>
    );
  }

  if (!view) {
    return (
      <Shell>
        <p className="text-white/60">Loading…</p>
      </Shell>
    );
  }

  const loc = view.location;
  const vehicle = loc.state === 'live' && loc.pin
    ? { ...loc.pin, title: view.providerLabel || 'Provider', kind: 'vehicle' as const }
    : null;

  return (
    <Shell>
      {isLocalHost() ? (
        <p className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-200">
          Local test — this is not the live Juvay site.
        </p>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Tracking</p>
      <h1 className="text-3xl font-black">{view.providerLabel || 'Provider'}</h1>
      <p className="text-white/60 text-sm">
        {view.stop.label ? `${view.stop.label} · ` : ''}
        {view.stop.role} · {view.stop.status}
      </p>

      <TrackingMap vehicle={vehicle} stops={[]} height="280px" />

      <StatusBlock view={view} />
    </Shell>
  );
};

function StatusBlock({ view }: { view: TrackView }) {
  const loc = view.location;
  const parts: string[] = [];
  if (loc.state === 'not_sharing') parts.push(loc.message || 'Provider is not sharing location');
  if (loc.state === 'last_seen') parts.push(loc.message || `Last seen ${loc.lastSeenAgoMinutes} min ago`);
  if (loc.state === 'live') parts.push('Location is live.');
  if (loc.state === 'delivered' || loc.state === 'ended') parts.push(loc.message || 'Location is no longer shared.');

  if (loc.state !== 'delivered' && loc.state !== 'ended' && view.stopsAway != null) {
    if (view.isNext || view.stopsAway === 0) parts.push('You are the next stop.');
    else if (view.stopsAway === 1) parts.push('1 stop away.');
    else parts.push(`${view.stopsAway} stops away.`);
  }

  let etaLine: string | null = null;
  if (view.eta && (loc.state === 'live')) {
    const mins = view.eta.etaMinutes;
    if (view.eta.etaSource === 'approx' || view.eta.etaLabel === 'approx') {
      etaLine = `Approx ${mins} min${view.eta.note ? ` · ${view.eta.note}` : `, assuming ${view.eta.assumedSpeedKmh} km/h`}`;
    } else {
      etaLine = `About ${mins} min${view.eta.note ? ` · ${view.eta.note}` : ''}`;
    }
  }

  const latest = view.events[view.events.length - 1];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-2">
      {parts.map((p) => (
        <p key={p} className="text-sm text-white/80">{p}</p>
      ))}
      {etaLine ? <p className="text-sm font-bold text-yellow-400">{etaLine}</p> : null}
      {latest ? (
        <p className="text-xs text-white/40">
          Status: {latest.event.replace(/_/g, ' ')}. {latest.note}
        </p>
      ) : null}
    </div>
  );
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-black text-white px-4 py-10">
    <div className="max-w-lg mx-auto space-y-4">{children}</div>
  </div>
);
