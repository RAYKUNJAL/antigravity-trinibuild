import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agreeRideOffer, createRideOffer, fetchListedRides } from '../services/ridesApi';

/**
 * Rides stay empty unless live listed drivers are on this origin.
 * Do not invent drivers, fares, or a live booking button.
 */
export const Rides: React.FC = () => {
  const [unavailable, setUnavailable] = useState(true);
  const [listed, setListed] = useState<Array<{ id: string; name: string; plate: string; phone: string; wamHandle?: string }>>([]);
  const [selected, setSelected] = useState<string>('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [offerTtd, setOfferTtd] = useState('');
  const [pay, setPay] = useState<'cash' | 'wam'>('cash');
  const [riderPhone, setRiderPhone] = useState('');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    fetchListedRides()
      .then((data) => {
        if (data.listedCount > 0 && Array.isArray(data.listed) && data.listed.length > 0) {
          setUnavailable(false);
          setListed(data.listed);
        } else {
          setUnavailable(true);
          setListed([]);
        }
      })
      .catch(() => {
        setUnavailable(true);
        setListed([]);
      });
  }, []);

  const selectedDriver = listed.find((d) => d.id === selected);

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await createRideOffer({
        driverId: selected,
        pickup,
        drop,
        offerTtd,
        pay,
        riderPhone,
      });
      setOffer(data.offer);
    } catch (err: any) {
      setError(err.message || 'Offer failed');
    }
  };

  if (unavailable) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-3">Rides</h1>
          <p className="text-gray-600 mb-2">Rides are unavailable on this origin.</p>
          <p className="text-sm text-gray-500">
            No drivers are listed. Juvay does not invent a fare or a live booking button.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Rides</h1>
        <p className="text-sm text-gray-500 mb-6">
          These are the people listed on this origin. No radar. No ghost cars. Offer a fare — Juvay does not quote one. Book only after both agree.
        </p>
        <ul className="space-y-3 mb-6">
          {listed.map((driver) => (
            <li key={driver.id}>
              <button
                type="button"
                onClick={() => setSelected(driver.id)}
                className={`w-full text-left border rounded-xl p-4 min-h-[44px] ${selected === driver.id ? 'border-stone-900' : 'border-gray-200'}`}
              >
                <div className="font-semibold text-gray-900">{driver.name}</div>
                <div className="text-sm text-gray-600">Plate {driver.plate}</div>
                <div className="text-sm text-gray-600">{driver.phone}</div>
                {driver.phone ? (
                  <a href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`} className="text-sm underline" onClick={(e) => e.stopPropagation()}>
                    WhatsApp this listed driver
                  </a>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        {selectedDriver ? (
          <form onSubmit={submitOffer} className="space-y-3 border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">Offer, don&apos;t quote. Cash is default. Wam is wam.com, not WhatsApp.</p>
            <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Drop" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} placeholder="Your TTD offer — empty until you type it" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input required value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Your phone" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <label className="flex items-center gap-2 min-h-[44px]">
              <input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} />
              Cash
            </label>
            <label className="flex items-center gap-2 min-h-[44px]">
              <input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} disabled={!selectedDriver.wamHandle} />
              Wam (only if this driver typed a handle)
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button type="submit" className="w-full min-h-[44px] rounded-xl bg-stone-900 text-white font-semibold">Send offer</button>
          </form>
        ) : null}

        {offer ? (
          <div className="mt-4 text-sm text-gray-700 space-y-2">
            <p>Offer {offer.id} · {offer.status}. Not booked until both agree.</p>
            <button
              type="button"
              onClick={async () => {
                const data = await agreeRideOffer(offer.id, { role: 'rider', riderPhone });
                setOffer(data.offer);
                if (data.trip) window.location.href = `/rides/trip/${data.trip.id}`;
              }}
              className="w-full min-h-[44px] rounded-xl border border-gray-900"
            >
              I agree to this amount
            </button>
            {offer.tripId ? <Link to={`/rides/trip/${offer.tripId}`} className="underline">Open trip</Link> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
