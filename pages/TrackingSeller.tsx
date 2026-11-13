import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrackingUpgradeCard } from '../components/TrackingUpgradeCard';
import { getToken } from '../services/selfHostedApi';
import { fetchTrackingStatus, type TrackingStatus } from '../services/deliveryTrackingApi';

/** Seller status for live tracking. No invent-a-job form. */
export const TrackingSeller: React.FC = () => {
  const signedIn = typeof window !== 'undefined' && !!getToken();
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!signedIn) return;
    fetchTrackingStatus()
      .then(setStatus)
      .catch((e: Error) => setError(e.message || 'Could not load status'));
  }, [signedIn]);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Live tracking</p>
        <h1 className="text-3xl font-black">Share a live location with your customer</h1>
        <p className="text-white/70 text-sm">
          A provider shares their phone’s GPS while a job is active. The customer opens a private link
          and sees the vehicle only while the location is actually being shared. Customers do not pay
          to watch. This page does not invent a job, a pin, or an arrival time.
        </p>
        {!signedIn ? (
          <p className="text-sm">
            <Link to="/login" className="text-yellow-400 underline font-bold">Sign in</Link> to see whether tracking is on for your shop.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {status?.locked ? (
          <TrackingUpgradeCard message={status.message} planNames={status.planNames} />
        ) : null}
        {status && !status.locked ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-2">
            {/* Jobs are created by vertical apps via POST /api/routes; this page has no create-job form. */}
            <p className="font-bold">Tracking is set up for this shop.</p>
            <p className="text-sm text-white/60">
              Once tracking is set up for your shop, a live tracking link can be created from an order
              and sent to your customer. The driver opens that job on their phone to start sharing
              their location. This page does not create a job, a pin, or an arrival time.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
