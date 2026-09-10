import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  acceptRideOffer,
  agreeRideOffer,
  applyToDrive,
  counterRideOffer,
  fetchDriveMe,
  fetchDriverOffers,
  fetchRideTrip,
  readImageAsDataUrl,
  setDriverPin,
  startRideTrip,
  tapCashReceived,
  trackRideTrip,
} from '../services/ridesApi';

const JOB_OPTIONS = [
  { id: 'rideshare', label: 'Rideshare' },
  { id: 'courier', label: 'Courier' },
  { id: 'delivery', label: 'Delivery' },
] as const;

const field = 'mt-1 w-full min-h-[44px] border border-white/15 bg-white/5 text-white rounded-xl px-3 placeholder:text-white/40';

/**
 * /drive — apply + desk. Pin = online signal. No /api/drive/online.
 */
export const DriveApply: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [wamHandle, setWamHandle] = useState('');
  const [affiliateRef, setAffiliateRef] = useState('');
  const [island, setIsland] = useState('Trinidad');
  const [jobTypes, setJobTypes] = useState<string[]>(['rideshare']);
  const [schoolRunRequested, setSchoolRunRequested] = useState(false);
  const [pinLat, setPinLat] = useState('');
  const [pinLng, setPinLng] = useState('');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [driver, setDriver] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [counterTtd, setCounterTtd] = useState('');
  const [startPin, setStartPin] = useState('');
  const [tripGpsLat, setTripGpsLat] = useState('');
  const [tripGpsLng, setTripGpsLng] = useState('');
  const [activeTripId, setActiveTripId] = useState('');
  const [tripStatus, setTripStatus] = useState<any>(null);

  const onPhoto = async (fieldName: string, file?: File) => {
    if (!file) return;
    try {
      setPhotos((prev) => ({ ...prev, [fieldName]: await readImageAsDataUrl(file) }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const loadDesk = async (p = phone) => {
    if (!p) return;
    const me = await fetchDriveMe(p);
    setDriver(me.driver);
    const inbox = await fetchDriverOffers(p).catch(() => ({ offers: [] }));
    setOffers(inbox.offers || []);
    const booked = (inbox.offers || []).find((o: any) => o.tripId);
    if (booked?.tripId) {
      setActiveTripId(booked.tripId);
      const trip = await fetchRideTrip(booked.tripId).catch(() => null);
      setTripStatus(trip?.trip || null);
    } else {
      setActiveTripId('');
      setTripStatus(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await applyToDrive({
        name,
        phone,
        plate,
        wamHandle,
        affiliateRef,
        island,
        jobTypes,
        schoolRunRequested,
        permitPhoto: photos.permitPhoto,
        insurancePhoto: photos.insurancePhoto,
        platePhoto: photos.platePhoto,
        facePhoto: photos.facePhoto,
      });
      setDriver(data.driver);
      await loadDesk(phone);
    } catch (err: any) {
      setError(err.message || 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-white/10 bg-[#111] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400 mb-2">Drive</p>
          <h1 className="text-3xl font-black mb-2">Apply once. Take three jobs.</h1>
          <p className="text-sm text-white/60 mb-5">
            We will not show cars that are not you. Listed only after a person approves. Pin is the online signal — POST /api/drive/pin. There is no /api/drive/online.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm">
              Island
              <select value={island} onChange={(e) => setIsland(e.target.value)} className={field}>
                <option className="text-black">Trinidad</option>
                <option className="text-black">Tobago</option>
              </select>
            </label>
            <fieldset className="text-sm">
              <legend className="mb-2 font-bold">Jobs — multi-select</legend>
              <div className="grid grid-cols-3 gap-2">
                {JOB_OPTIONS.map((job) => (
                  <label key={job.id} className={`min-h-[44px] rounded-xl border px-2 flex items-center justify-center gap-2 ${jobTypes.includes(job.id) ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/15'}`}>
                    <input
                      type="checkbox"
                      checked={jobTypes.includes(job.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setJobTypes((prev) => (prev.includes(job.id) ? prev : [...prev, job.id]));
                          return;
                        }
                        setJobTypes((prev) => prev.filter((id) => id !== job.id));
                        if (job.id === 'rideshare') setSchoolRunRequested(false);
                      }}
                    />
                    {job.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={`w-full ${field}`} />
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone 868…" className={`w-full ${field}`} />
            <input required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Plate" className={`w-full ${field}`} />
            <label className="block text-xs text-white/50">Permit photo<input required type="file" accept="image/*" onChange={(e) => onPhoto('permitPhoto', e.target.files?.[0])} className="mt-1 w-full" /></label>
            <label className="block text-xs text-white/50">Insurance photo<input required type="file" accept="image/*" onChange={(e) => onPhoto('insurancePhoto', e.target.files?.[0])} className="mt-1 w-full" /></label>
            <label className="block text-xs text-white/50">Plate photo<input required type="file" accept="image/*" onChange={(e) => onPhoto('platePhoto', e.target.files?.[0])} className="mt-1 w-full" /></label>
            <label className="block text-xs text-white/50">Face photo<input required type="file" accept="image/*" onChange={(e) => onPhoto('facePhoto', e.target.files?.[0])} className="mt-1 w-full" /></label>
            <input value={wamHandle} onChange={(e) => setWamHandle(e.target.value)} placeholder="Wam handle (wam.com, not WhatsApp)" className={`w-full ${field}`} />
            <input value={affiliateRef} onChange={(e) => setAffiliateRef(e.target.value)} placeholder="Affiliate ref (optional)" className={`w-full ${field}`} />
            <label className="flex items-start gap-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={schoolRunRequested}
                onChange={(e) => {
                  const on = e.target.checked;
                  setSchoolRunRequested(on);
                  if (on && !jobTypes.includes('rideshare')) setJobTypes((prev) => ['rideshare', ...prev]);
                }}
                className="mt-1"
              />
              School-run under rideshare — parent-booked only. A person must flag it.
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button type="submit" disabled={busy || jobTypes.length === 0} className="w-full min-h-[48px] rounded-xl bg-yellow-400 text-black font-black disabled:opacity-40">
              {busy ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111] p-6 space-y-4">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="text-xl font-black">Driver desk</h2>
              <p className="text-xs text-white/50">GET /api/drive/me · GET /api/drive/offers · POST /api/drive/pin</p>
            </div>
            <button type="button" onClick={() => loadDesk()} className="text-sm underline text-yellow-400">Refresh</button>
          </div>

          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try { await loadDesk(); } catch (err: any) { setError(err.message); }
            }}
          >
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone on application" className={`flex-1 ${field}`} />
            <button type="submit" className="min-h-[44px] px-4 rounded-xl border border-yellow-400 text-yellow-400 font-bold">Load desk</button>
          </form>

          {!driver ? (
            <p className="text-sm text-white/50">Apply or load the phone on your application. Empty stays empty. No demo drivers.</p>
          ) : (
            <div className="rounded-2xl border border-white/10 p-4 text-sm space-y-1">
              <p className="font-black">{driver.name} · {driver.plate}</p>
              <p>Listed: {driver.listed ? 'yes' : 'no'} · Approved: {driver.approved ? 'yes' : 'no'}</p>
              <p>goOnlineBlocked: {driver.goOnlineBlocked ? 'yes' : 'no'}</p>
              {driver.goOnlineReason ? <p className="text-yellow-400">{driver.goOnlineReason}</p> : <p className="text-yellow-400">Listed. Drop a pin to appear on radar.</p>}
              <p>Jobs: {(driver.jobTypes || []).join(', ')}</p>
              <p>School-run: {driver.schoolRunApproved ? 'flagged' : driver.schoolRunRequested ? 'requested' : 'no'}</p>
              <p>subscription priceCents: {driver.subscriptionPriceCents == null ? 'null' : driver.subscriptionPriceCents}</p>
              <p>Pin: {driver.pinLat != null ? `${driver.pinLat}, ${driver.pinLng}` : 'none'}</p>
              <Link to="/drive/pay" className="inline-block text-yellow-400 underline">Subscription (Wam.com)</Link>
            </div>
          )}

          {driver?.listed ? (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await setDriverPin({ phone, pinLat, pinLng });
                  await loadDesk();
                } catch (err: any) {
                  setError(err.message);
                }
              }}
            >
              <p className="text-sm font-bold">Go online — real Trinidad or Tobago pin</p>
              <p className="text-xs text-white/40">This is POST /api/drive/pin. Not a fake online toggle.</p>
              <input value={pinLat} onChange={(e) => setPinLat(e.target.value)} placeholder="Latitude" className={`w-full ${field}`} />
              <input value={pinLng} onChange={(e) => setPinLng(e.target.value)} placeholder="Longitude" className={`w-full ${field}`} />
              <button type="submit" className="w-full min-h-[44px] rounded-xl bg-yellow-400 text-black font-black">Save pin / go online</button>
            </form>
          ) : null}

          <div>
            <h3 className="font-black mb-2">Offers</h3>
            {offers.length === 0 ? <p className="text-sm text-white/40">No offers yet.</p> : null}
            {offers.map((offer) => (
              <div key={offer.id} className="border border-white/10 rounded-2xl p-3 mb-3 text-sm space-y-2">
                <p className="font-bold">{offer.serviceType || 'rideshare'} · {offer.pickup} → {offer.drop}</p>
                <p>TT${offer.offerTtd}{offer.counterTtd ? ` · counter TT$${offer.counterTtd}` : ''} · {offer.pay} · {offer.status}</p>
                {offer.status === 'offered' || offer.status === 'countered' ? (
                  <>
                    <button type="button" onClick={async () => { await acceptRideOffer(offer.id, phone); loadDesk(); }} className="w-full min-h-[44px] rounded-xl bg-yellow-400 text-black font-black">Accept</button>
                    <div className="flex gap-2">
                      <input value={counterTtd} onChange={(e) => setCounterTtd(e.target.value)} placeholder="Counter TTD" className={`flex-1 ${field}`} />
                      <button type="button" onClick={async () => { await counterRideOffer(offer.id, phone, counterTtd); setCounterTtd(''); loadDesk(); }} className="min-h-[44px] px-3 rounded-xl border border-white/20">Counter</button>
                    </div>
                    <button type="button" onClick={async () => { await agreeRideOffer(offer.id, { role: 'driver', driverPhone: phone }); loadDesk(); }} className="w-full min-h-[44px] rounded-xl border border-yellow-400 text-yellow-400">Agree</button>
                  </>
                ) : null}
                {offer.tripId ? (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/40">accept → startPin → tripGps → both-tap cash</p>
                    {tripStatus ? (
                      <p className="text-xs text-white/50">started {tripStatus.started ? 'yes' : 'no'} · cash-paid {tripStatus.cashPaid ? 'yes' : 'no'} · cash-received {tripStatus.cashReceived ? 'yes' : 'no'}</p>
                    ) : null}
                    <Link to={`/rides/trip/${offer.tripId}`} className="underline text-yellow-400">Open trip</Link>
                    <input value={startPin} onChange={(e) => setStartPin(e.target.value)} placeholder="startPin → POST /start" className={`w-full ${field}`} />
                    <button
                      type="button"
                      onClick={async () => { await startRideTrip(offer.tripId, phone, startPin); loadDesk(); }}
                      className="w-full min-h-[44px] rounded-xl bg-yellow-400 text-black font-black"
                    >
                      startPin
                    </button>
                    <input value={tripGpsLat} onChange={(e) => setTripGpsLat(e.target.value)} placeholder="tripGps lat → POST /track" className={`w-full ${field}`} />
                    <input value={tripGpsLng} onChange={(e) => setTripGpsLng(e.target.value)} placeholder="tripGps lng" className={`w-full ${field}`} />
                    <button
                      type="button"
                      onClick={async () => { await trackRideTrip(offer.tripId, { driverPhone: phone, lat: tripGpsLat, lng: tripGpsLng }); loadDesk(); }}
                      className="w-full min-h-[44px] rounded-xl border border-white/20"
                    >
                      tripGps
                    </button>
                    <button
                      type="button"
                      onClick={async () => { await tapCashReceived(offer.tripId, phone); loadDesk(); }}
                      className="w-full min-h-[44px] rounded-xl border border-white/20"
                    >
                      cash-received
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {activeTripId ? <p className="text-xs text-white/40">Active trip {activeTripId}</p> : null}
        </section>
      </div>
    </div>
  );
};
