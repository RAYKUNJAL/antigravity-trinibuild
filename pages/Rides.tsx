import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { agreeRideOffer, createRideOffer, fetchListedRides } from '../services/ridesApi';

/**
 * Dedicated Juvay Rides landing. Directory only when people are listed.
 * Do not invent drivers, fares, or a live booking button.
 */
export const Rides: React.FC = () => {
  const [island, setIsland] = useState('Trinidad');
  const [unavailable, setUnavailable] = useState(true);
  const [listed, setListed] = useState<Array<{ id: string; name: string; plate: string; phone: string; wamHandle?: string; pinLat?: number | null; pinLng?: number | null }>>([]);
  const [selected, setSelected] = useState<string>('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [offerTtd, setOfferTtd] = useState('');
  const [pay, setPay] = useState<'cash' | 'wam'>('cash');
  const [riderPhone, setRiderPhone] = useState('');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    fetchListedRides({ island })
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
  }, [island]);

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

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-3xl font-black text-gray-900 mb-3">Juvay Rides</h1>
          <p className="text-gray-700 mb-3">
            Cash island rides on Trinidad and Tobago. You offer a fare. The listed driver accepts or counters. Book only after both agree. Juvay does not quote a fare and does not invent a live booking button.
          </p>
          <p className="text-gray-700 mb-3">
            Cash is the default. Wam is optional on <a href="https://wam.com" className="underline" target="_blank" rel="noreferrer">wam.com</a> — Wam is not WhatsApp. WhatsApp is only wa.me to a listed person.
          </p>
          <p className="text-gray-700 mb-6">
            Parent school-run is a separate parent-booked trip. The child is a passenger. The kid never pays.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/rides/school-run" className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-gray-900 font-semibold">
              Parent school-run
            </Link>
            <Link to="/drive" className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-stone-900 text-white font-semibold">
              Apply as driver
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-black text-gray-900 mb-3">This island</h2>
          <label className="block text-sm mb-3">
            Island
            <select value={island} onChange={(e) => setIsland(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3">
              <option>Trinidad</option>
              <option>Tobago</option>
            </select>
          </label>
          <IslandRideMap island={island} pins={listed} />
          <p className="text-xs text-gray-500 mt-2 mb-4">OSM only. Pins only for listed drivers who typed a real point. No radar. No ghost cars.</p>

          {unavailable ? (
            <div className="text-center pt-2">
              <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Rides are unavailable on this origin.</p>
              <p className="text-sm text-gray-500">
                No drivers are listed. Juvay does not invent a fare or a live booking button.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-6">
                These are the people listed on this island. No radar. No ghost cars. Offer a fare — Juvay does not quote one. Book only after both agree.
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
            </>
          )}
        </section>
      </div>
    </div>
  );
};
