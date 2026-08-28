import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { fetchRideTrip, startRideTrip, tapCashPaid, tapCashReceived, trackRideTrip } from '../services/ridesApi';

export const RideTrip: React.FC = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [error, setError] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [pin, setPin] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const data = await fetchRideTrip(id, params.get('t') || undefined);
      setTrip(data.trip);
    } catch (e: any) {
      setError(e.message || 'Trip not found');
    }
  };

  useEffect(() => { load(); }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <p className="text-gray-600">Loading trip…</p>
      </div>
    );
  }

  const school = trip.kind === 'school_run';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">{school ? 'School-run trip' : 'Accepted trip'}</h1>
        {school ? <p className="text-gray-700 font-medium">{trip.schoolRunCopy}</p> : null}
        <IslandRideMap island="Trinidad" pins={[]} tripPoint={trip.lastPoint} />
        <p className="text-xs text-gray-500">Live car point only on this accepted trip. Parent share sees the same map. No tracking outside the trip.</p>
        <p className="text-gray-700">{trip.driverName} · {trip.plate}</p>
        {school && trip.childName ? <p className="text-gray-700">Passenger {trip.childName} · {trip.school}</p> : null}
        <p className="text-gray-700">{trip.pickup} → {trip.drop}</p>
        <p className="text-gray-700">Agreed TT${trip.faceTtd} · {trip.pay === 'cash' ? 'Cash (0% take)' : 'Wam face-only, 7.5% pass-through'}</p>
        <p className="text-sm">Started: {trip.started ? 'yes' : 'no — driver must enter the start PIN'}</p>
        {trip.startPin ? <p className="font-mono text-lg">Start PIN {trip.startPin}</p> : null}
        <p className="text-sm text-gray-600">{trip.sosCopy}</p>
        {typeof window !== 'undefined' ? (
          <p className="text-sm">Share trip{school ? ' (always on for the parent)' : ''}: <span className="break-all">{window.location.origin}{trip.sharePath}</span></p>
        ) : null}
        {trip.whatsapp ? (
          <a href={trip.whatsapp} className="inline-block underline font-semibold">WhatsApp this listed driver</a>
        ) : null}
        {trip.wamPayOn ? (
          <p className="text-sm">Pay the driver on <a href={trip.wamPayOn} className="underline" target="_blank" rel="noreferrer">wam.com</a>. Wam is not WhatsApp.{school ? ' Wam is from the parent, never the child.' : ''}</p>
        ) : null}

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <label className="block text-sm">
            Driver phone
            <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <label className="block text-sm">
            Start PIN
            <input value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <button type="button" onClick={async () => { await startRideTrip(trip.id, driverPhone, pin); load(); }} className="w-full min-h-[44px] rounded-xl border border-gray-900">Driver enters PIN to start</button>
          <label className="block text-sm">Trip point latitude</label>
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          <label className="block text-sm">Trip point longitude</label>
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          <button type="button" onClick={async () => { await trackRideTrip(trip.id, { driverPhone, lat, lng }); load(); }} className="w-full min-h-[44px] rounded-xl border border-gray-900">Share trip point</button>
        </div>

        {trip.pay === 'cash' ? (
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <p className="text-sm text-gray-500">{school ? 'Parent pays at pickup. The child never sees cash confirm. No auto debt.' : 'Both taps required. No auto rider debt.'}</p>
            <label className="block text-sm">
              {school ? 'Parent phone' : 'Rider phone'}
              <input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            </label>
            <button type="button" onClick={async () => { await tapCashPaid(trip.id, riderPhone); load(); }} className="w-full min-h-[44px] rounded-xl border border-gray-900">{school ? 'Parent paid cash' : 'I paid cash'}</button>
            <button type="button" onClick={async () => { await tapCashReceived(trip.id, driverPhone); load(); }} className="w-full min-h-[44px] rounded-xl border border-gray-900">I received cash</button>
            <p className="text-sm">Cash paid: {trip.cashPaid ? 'yes' : 'no'} · Cash received: {trip.cashReceived ? 'yes' : 'no'}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
