import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { applyToDrive, fetchDriverOffers, acceptRideOffer, counterRideOffer, agreeRideOffer, readImageAsDataUrl } from '../services/ridesApi';

/**
 * /drive apply. KYC only. No map. We will not show cars that are not you.
 */
export const DriveApply: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [wamHandle, setWamHandle] = useState('');
  const [affiliateRef, setAffiliateRef] = useState('');
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [counterTtd, setCounterTtd] = useState('');

  const onPhoto = async (field: string, file?: File) => {
    if (!file) return;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setPhotos((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (e: any) {
      setError(e.message);
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
        permitPhoto: photos.permitPhoto,
        insurancePhoto: photos.insurancePhoto,
        platePhoto: photos.platePhoto,
        facePhoto: photos.facePhoto,
      });
      setResult(data);
      const inbox = await fetchDriverOffers(phone).catch(() => ({ offers: [] }));
      setOffers(inbox.offers || []);
    } catch (err: any) {
      setError(err.message || 'Apply failed');
    } finally {
      setBusy(false);
    }
  };

  const refreshOffers = async () => {
    if (!phone) return;
    const inbox = await fetchDriverOffers(phone);
    setOffers(inbox.offers || []);
    if (inbox.driver) setResult((prev: any) => ({ ...prev, driver: inbox.driver }));
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Apply to drive</h1>
        <p className="text-gray-600 mb-2">We will not show cars that are not you.</p>
        <p className="text-sm text-gray-500 mb-6">
          A person reviews permit, insurance, plate photo, face, and phone. You are not listed until you are approved and the subscription is confirmed. No map on this page.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phone
            <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="868…" className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Plate
            <input required value={plate} onChange={(e) => setPlate(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Permit photo
            <input required type="file" accept="image/*" onChange={(e) => onPhoto('permitPhoto', e.target.files?.[0])} className="mt-1 w-full" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Insurance photo
            <input required type="file" accept="image/*" onChange={(e) => onPhoto('insurancePhoto', e.target.files?.[0])} className="mt-1 w-full" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Plate photo
            <input required type="file" accept="image/*" onChange={(e) => onPhoto('platePhoto', e.target.files?.[0])} className="mt-1 w-full" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Face photo
            <input required type="file" accept="image/*" onChange={(e) => onPhoto('facePhoto', e.target.files?.[0])} className="mt-1 w-full" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Wam handle (optional — wam.com, not WhatsApp)
            <input value={wamHandle} onChange={(e) => setWamHandle(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Affiliate ref (optional — 10% of the subscription, not the trip)
            <input value={affiliateRef} onChange={(e) => setAffiliateRef(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={busy} className="w-full min-h-[44px] rounded-xl bg-stone-900 text-white font-semibold disabled:opacity-40">
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </form>

        {result?.driver ? (
          <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-700 space-y-2">
            <p>Approved: {result.driver.approved ? 'yes' : 'no'}</p>
            <p>Subscription confirmed: {result.driver.subscriptionPaid ? 'yes' : 'no'}</p>
            <p>Listed: {result.driver.listed ? 'yes' : 'no'}</p>
            <p>{result.driver.goOnlineReason || result.goOnline?.reason}</p>
            <Link to="/drive/pay" className="inline-block text-stone-900 font-semibold underline">Subscription status</Link>
          </div>
        ) : null}

        {result?.driver ? (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-900">Offers for this phone</h2>
              <button type="button" onClick={refreshOffers} className="text-sm underline">Refresh</button>
            </div>
            {offers.length === 0 ? <p className="text-sm text-gray-500">No offers yet.</p> : null}
            {offers.map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-xl p-3 mb-3 text-sm space-y-2">
                <p>{offer.pickup} → {offer.drop}</p>
                <p>Offer TT${offer.offerTtd}{offer.counterTtd ? ` · counter TT$${offer.counterTtd}` : ''} · {offer.pay} · {offer.status}</p>
                {offer.status === 'offered' || offer.status === 'countered' ? (
                  <>
                    <button type="button" onClick={async () => { await acceptRideOffer(offer.id, phone); refreshOffers(); }} className="min-h-[44px] px-3 border border-gray-900 rounded-lg">Accept</button>
                    <div className="flex gap-2">
                      <input value={counterTtd} onChange={(e) => setCounterTtd(e.target.value)} placeholder="Counter TTD" className="min-h-[44px] border border-gray-300 rounded-lg px-3 flex-1" />
                      <button type="button" onClick={async () => { await counterRideOffer(offer.id, phone, counterTtd); setCounterTtd(''); refreshOffers(); }} className="min-h-[44px] px-3 border border-gray-900 rounded-lg">Counter</button>
                    </div>
                    <button type="button" onClick={async () => { await agreeRideOffer(offer.id, { role: 'driver', driverPhone: phone }); refreshOffers(); }} className="min-h-[44px] px-3 border border-gray-900 rounded-lg">Agree</button>
                  </>
                ) : null}
                {offer.tripId ? <Link to={`/rides/trip/${offer.tripId}`} className="underline">Open trip</Link> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
