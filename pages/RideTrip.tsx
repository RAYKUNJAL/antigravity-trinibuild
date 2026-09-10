import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { fetchRideTrip, startRideTrip, tapCashPaid, tapCashReceived, trackRideTrip } from '../services/ridesApi';

const field = 'mt-1 w-full min-h-[44px] border border-white/15 bg-white/5 text-white rounded-xl px-3 placeholder:text-white/40';

export const RideTrip: React.FC = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [trip, setTrip] = useState<any>(null);
  const [error, setError] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
        <p className="text-white/60">{error}</p>
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
        <p className="text-white/60">Loading trip…</p>
      </div>
    );
  }

  const school = trip.kind === 'school_run';

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">Trip</p>
        <h1 className="text-3xl font-black">{school ? 'School-run trip' : `Accepted ${trip.serviceType || 'rideshare'}`}</h1>
        {school ? <p className="text-white/70 font-medium">{trip.schoolRunCopy}</p> : null}
        <IslandRideMap island="Trinidad" pins={[]} tripPoint={trip.lastPoint} dark height="240px" />
        <p className="text-xs text-white/40">tripGps only on this accepted trip. No radar of other cars. Share path: {trip.sharePath}</p>
        <p className="font-bold">{trip.driverName} · {trip.plate}</p>
        {school && trip.childName ? <p>Passenger {trip.childName} · {trip.school}</p> : null}
        <p>{trip.pickup} → {trip.drop}</p>
        <p>Agreed TT${trip.faceTtd} · {trip.pay === 'cash' ? 'Cash (0% take)' : 'Wam face-only, 7.5% pass-through'}</p>
        <ol className="grid grid-cols-4 gap-1 text-[10px] font-bold uppercase tracking-wide">
          <li className="rounded-lg bg-yellow-400 text-black px-1 py-2 text-center">accept</li>
          <li className={`rounded-lg px-1 py-2 text-center ${trip.started ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'}`}>startPin</li>
          <li className={`rounded-lg px-1 py-2 text-center ${trip.lastPoint ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'}`}>tripGps</li>
          <li className={`rounded-lg px-1 py-2 text-center ${trip.cashPaid && trip.cashReceived ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60'}`}>both-tap</li>
        </ol>
        <p className="text-sm">Started: {trip.started ? 'yes' : 'no — driver enters startPin → POST /start'}</p>
        {trip.startPin ? <p className="font-mono text-2xl text-yellow-400">startPin {trip.startPin}</p> : null}
        <p className="text-sm text-white/50">{trip.sosCopy}</p>
        {typeof window !== 'undefined' ? (
          <p className="text-sm break-all">Share: {window.location.origin}{trip.sharePath}</p>
        ) : null}
        {trip.whatsapp ? (
          <a href={trip.whatsapp} className="inline-block underline text-yellow-400 font-semibold">WhatsApp this listed driver</a>
        ) : null}
        {trip.wamPayOn ? (
          <p className="text-sm">Pay the driver on <a href={trip.wamPayOn} className="underline text-yellow-400" target="_blank" rel="noreferrer">wam.com</a>. Wam is not WhatsApp.{school ? ' Wam is from the parent, never the child.' : ''}</p>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/40">Driver — startPin POST /start · tripGps POST /track</p>
          <label className="block text-sm">
            Driver phone
            <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className={field} />
          </label>
          <label className="block text-sm">
            startPin
            <input value={pin} onChange={(e) => setPin(e.target.value)} className={field} />
          </label>
          <button type="button" onClick={async () => { await startRideTrip(trip.id, driverPhone, pin); load(); }} className="w-full min-h-[44px] rounded-xl bg-yellow-400 text-black font-black">
            startPin
          </button>
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="tripGps lat" className={`w-full ${field}`} />
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="tripGps lng" className={`w-full ${field}`} />
          <button type="button" onClick={async () => { await trackRideTrip(trip.id, { driverPhone, lat, lng }); load(); }} className="w-full min-h-[44px] rounded-xl border border-white/20">
            tripGps
          </button>
        </div>

        {trip.pay === 'cash' ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Both-tap cash</p>
            <p className="text-sm text-white/50">{school ? 'Parent pays at pickup. The child never sees cash confirm. Never kid phone.' : 'Both taps required. No auto rider debt.'}</p>
            {school ? (
              <label className="block text-sm">
                Parent phone
                <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={field} />
              </label>
            ) : (
              <label className="block text-sm">
                Rider phone
                <input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} className={field} />
              </label>
            )}
            <button
              type="button"
              onClick={async () => {
                await tapCashPaid(trip.id, school ? parentPhone : riderPhone, school ? 'parent' : 'rider');
                load();
              }}
              className="w-full min-h-[44px] rounded-xl border border-yellow-400 text-yellow-400 font-bold"
            >
              {school ? 'cash-paid (parentPhone)' : 'cash-paid (riderPhone)'}
            </button>
            <button type="button" onClick={async () => { await tapCashReceived(trip.id, driverPhone); load(); }} className="w-full min-h-[44px] rounded-xl border border-white/20">
              cash-received (driverPhone)
            </button>
            <p className="text-sm">Cash paid: {trip.cashPaid ? 'yes' : 'no'} · Cash received: {trip.cashReceived ? 'yes' : 'no'}</p>
          </div>
        ) : null}
        <Link to="/rides" className="block text-center text-sm text-yellow-400 underline">Back to rides</Link>
      </div>
    </div>
  );
};
