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
            <p className="font-bold">Tracking jobs can be created for this shop.</p>
            <p className="text-sm text-white/60">
              Vertical apps (for example a delivery or visit flow) create a job with POST /api/routes
              and send the customer /track/:token. Open /driver/route/:id on the provider’s phone to start sharing.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
