import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { ISLAND } from '../services/storeStarters';
import { agreeRideOffer, createRideOffer, fetchListedRides } from '../services/ridesApi';

/**
 * Dedicated Juvay Rides landing. Phone-first. Directory only when people are listed.
 * Do not invent drivers, fares, photos, or a live booking button.
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
    <div style={{ background: ISLAND.sand, color: '#1a1a1a', fontFamily: "'Source Sans 3', system-ui, sans-serif" }} className="min-h-screen pb-28 md:pb-16">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap" />

      <section className="px-4 pt-6 pb-8" style={{ background: '#141414', color: ISLAND.sand }}>
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: ISLAND.mango }}>Trinidad &amp; Tobago</p>
          <h1 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 'clamp(32px, 9vw, 44px)', fontWeight: 400, lineHeight: 1.15, margin: '0 0 12px' }}>
            Juvay Rides
          </h1>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#e6dfd4' }}>
            Cash rides on the islands. Parent school-run when a driver is listed and approved for kids.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/drive" className="inline-flex items-center justify-center min-h-[44px] px-5 font-bold rounded-xl" style={{ background: ISLAND.mango, color: ISLAND.mangoInk }}>
              Apply as a driver
            </Link>
            <Link to="/rides/school-run" className="inline-flex items-center justify-center min-h-[44px] px-5 font-bold rounded-xl border" style={{ borderColor: ISLAND.sand, color: ISLAND.sand }}>
              School run
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 max-w-lg mx-auto">
        <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 24, fontWeight: 400, marginBottom: 16 }}>How it works</h2>
        <ol className="space-y-4">
          <li className="rounded-2xl border p-4" style={{ borderColor: '#e6dfd4', background: '#fff' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ISLAND.teal }}>1 · Rider</div>
            <p className="text-[15px] leading-relaxed">Offer pickup, drop, and a TTD amount. Juvay does not quote a fare.</p>
          </li>
          <li className="rounded-2xl border p-4" style={{ borderColor: '#e6dfd4', background: '#fff' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ISLAND.teal }}>2 · Driver</div>
            <p className="text-[15px] leading-relaxed">A listed person accepts or counters. Book only after both agree.</p>
          </li>
          <li className="rounded-2xl border p-4" style={{ borderColor: '#e6dfd4', background: '#fff' }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: ISLAND.teal }}>3 · Pay</div>
            <p className="text-[15px] leading-relaxed">Pay the driver in cash. Wam is optional on <a href="https://wam.com" className="underline" target="_blank" rel="noreferrer">wam.com</a> — not WhatsApp.</p>
          </li>
        </ol>
      </section>

      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="flex flex-wrap gap-2">
          {['Cash', 'Wam optional', 'No WiPay', 'No invented fare', 'No ghost cars'].map((chip) => (
            <span key={chip} className="min-h-[44px] inline-flex items-center px-3 rounded-full text-sm font-semibold border" style={{ borderColor: '#cfc8bc', background: '#fff' }}>
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#e6dfd4', background: '#fff' }}>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>This island</h2>
          <label className="block text-sm mb-3">
            Island
            <select value={island} onChange={(e) => setIsland(e.target.value)} className="mt-1 w-full min-h-[44px] rounded-xl px-3 border" style={{ borderColor: '#cfc8bc', background: ISLAND.sand }}>
              <option>Trinidad</option>
              <option>Tobago</option>
            </select>
          </label>
          <IslandRideMap island={island} pins={listed} />
          <p className="text-xs mt-2 mb-4" style={{ color: '#6b6256' }}>OSM only. Pins only for listed drivers who typed a real point. No radar.</p>

          {unavailable ? (
            <div className="text-center pt-2">
              <p className="text-gray-600 mb-2">Rides are unavailable on this origin.</p>
              <p className="text-sm text-gray-500">
                No drivers are listed. Juvay does not invent a fare or a live booking button.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm mb-4" style={{ color: '#6b6256' }}>
                These are the people listed on this island. Offer a fare — Juvay does not quote one. Book only after both agree.
              </p>
              <ul className="space-y-3 mb-4">
                {listed.map((driver) => (
                  <li key={driver.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(driver.id)}
                      className="w-full text-left border rounded-xl p-4 min-h-[44px]"
                      style={{ borderColor: selected === driver.id ? '#141414' : '#e6dfd4' }}
                    >
                      <div className="font-semibold">{driver.name}</div>
                      <div className="text-sm" style={{ color: '#6b6256' }}>Plate {driver.plate}</div>
                      <div className="text-sm" style={{ color: '#6b6256' }}>{driver.phone}</div>
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
                <form onSubmit={submitOffer} className="space-y-3 border-t pt-4" style={{ borderColor: '#e6dfd4' }}>
                  <p className="text-sm" style={{ color: '#6b6256' }}>Offer, don&apos;t quote. Cash is default. Wam is wam.com, not WhatsApp.</p>
                  <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" className="w-full min-h-[44px] rounded-xl px-3 border" style={{ borderColor: '#cfc8bc', background: ISLAND.sand }} />
                  <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Drop" className="w-full min-h-[44px] rounded-xl px-3 border" style={{ borderColor: '#cfc8bc', background: ISLAND.sand }} />
                  <input value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} placeholder="Your TTD offer — empty until you type it" className="w-full min-h-[44px] rounded-xl px-3 border" style={{ borderColor: '#cfc8bc', background: ISLAND.sand }} />
                  <input required value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Your phone" className="w-full min-h-[44px] rounded-xl px-3 border" style={{ borderColor: '#cfc8bc', background: ISLAND.sand }} />
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} />
                    Cash
                  </label>
                  <label className="flex items-center gap-2 min-h-[44px]">
                    <input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} disabled={!selectedDriver.wamHandle} />
                    Wam (only if this driver typed a handle)
                  </label>
                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  <button type="submit" className="w-full min-h-[44px] rounded-xl font-bold text-white" style={{ background: '#141414' }}>Send offer</button>
                </form>
              ) : null}

              {offer ? (
                <div className="mt-4 text-sm space-y-2">
                  <p>Offer {offer.id} · {offer.status}. Not booked until both agree.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const data = await agreeRideOffer(offer.id, { role: 'rider', riderPhone });
                      setOffer(data.offer);
                      if (data.trip) window.location.href = `/rides/trip/${data.trip.id}`;
                    }}
                    className="w-full min-h-[44px] rounded-xl border font-semibold"
                    style={{ borderColor: '#141414' }}
                  >
                    I agree to this amount
                  </button>
                  {offer.tripId ? <Link to={`/rides/trip/${offer.tripId}`} className="underline">Open trip</Link> : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="rounded-2xl p-5" style={{ background: '#141414', color: ISLAND.sand }}>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>Apply as a driver</h2>
          <p className="text-[15px] leading-relaxed mb-2">Permit, insurance, plate photo, face, and phone. A person reviews them.</p>
          <p className="text-[15px] leading-relaxed mb-4">We will not show cars that are not you.</p>
          <Link to="/drive" className="inline-flex items-center justify-center w-full min-h-[44px] px-5 font-bold rounded-xl" style={{ background: ISLAND.mango, color: ISLAND.mangoInk }}>
            Apply as a driver
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8 max-w-lg mx-auto">
        <div className="rounded-2xl border p-5" style={{ borderColor: '#e6dfd4', background: '#fff' }}>
          <h2 style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: 22, fontWeight: 400, marginBottom: 8 }}>School run</h2>
          <p className="text-[15px] leading-relaxed mb-2">This is a parent-booked school run, not a teen dating app, not unattended street hail.</p>
          <p className="text-[15px] leading-relaxed mb-4">Parent books. Parent sets a start PIN. Share-trip to the parent is always on. The kid never handles cash.</p>
          <Link to="/rides/school-run" className="inline-flex items-center justify-center w-full min-h-[44px] px-5 font-bold rounded-xl border" style={{ borderColor: '#141414' }}>
            School run
          </Link>
        </div>
      </section>

      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t px-4 py-3 flex gap-2" style={{ background: '#fff', borderColor: '#e6dfd4' }}>
        <Link to="/drive" className="flex-1 inline-flex items-center justify-center min-h-[44px] font-bold rounded-xl" style={{ background: ISLAND.mango, color: ISLAND.mangoInk }}>
          Apply as a driver
        </Link>
        <Link to="/rides/school-run" className="flex-1 inline-flex items-center justify-center min-h-[44px] font-bold rounded-xl border" style={{ borderColor: '#141414' }}>
          School run
        </Link>
      </div>
    </div>
  );
};
