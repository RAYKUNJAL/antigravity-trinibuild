import React, { useEffect, useMemo, useState } from 'react';
import { Car, Package, ShoppingBag, GraduationCap } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { IslandRideMap } from '../components/IslandRideMap';
import { agreeRideOffer, cancelRideOffer, createRideOffer, fetchListedRides } from '../services/ridesApi';

type ServiceType = 'rideshare' | 'courier' | 'delivery';

const SERVICES: { id: ServiceType; title: string; blurb: string; icon: typeof Car }[] = [
  { id: 'rideshare', title: 'Need a ride', blurb: 'Rideshare', icon: Car },
  { id: 'courier', title: 'Send a package', blurb: 'Courier', icon: Package },
  { id: 'delivery', title: 'Send a delivery', blurb: 'Delivery', icon: ShoppingBag },
];

const field = 'w-full min-h-[44px] rounded-xl px-4 bg-white/5 border border-white/15 text-white placeholder:text-white/40';

/**
 * /rides — dense cash-first rider surface. Listed radar only. No invented fares.
 */
export const Rides: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const initial = (params.get('svc') as ServiceType) || 'rideshare';
  const [island, setIsland] = useState('Trinidad');
  const [serviceType, setServiceType] = useState<ServiceType>(SERVICES.some((s) => s.id === initial) ? initial : 'rideshare');
  const [unavailable, setUnavailable] = useState(true);
  const [listedCount, setListedCount] = useState(0);
  const [listed, setListed] = useState<Array<{ id: string; name: string; plate: string; phone: string; wamHandle?: string; pinLat?: number | null; pinLng?: number | null }>>([]);
  const [line1, setLine1] = useState('Rides are unavailable on this origin.');
  const [line2, setLine2] = useState('No drivers are listed. Juvay does not invent a fare or a live booking button.');
  const [selected, setSelected] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [offerTtd, setOfferTtd] = useState('');
  const [pay, setPay] = useState<'cash' | 'wam'>('cash');
  const [riderPhone, setRiderPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const loadListed = () => {
      fetchListedRides({ island, serviceType })
        .then((data) => {
          if (cancelled) return;
          const empty = data.unavailable === true || !data.listedCount || !Array.isArray(data.listed) || data.listed.length === 0;
          setUnavailable(empty);
          setListedCount(empty ? 0 : data.listedCount);
          setListed(empty ? [] : data.listed);
          if (data.line1) setLine1(data.line1);
          if (data.line2) setLine2(data.line2);
          if (empty) setSelected('');
        })
        .catch(() => {
          if (cancelled) return;
          setUnavailable(true);
          setListedCount(0);
          setListed([]);
        });
    };
    loadListed();
    const timer = window.setInterval(loadListed, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [island, serviceType]);

  const selectedDriver = useMemo(() => listed.find((d) => d.id === selected), [listed, selected]);
  const offerReady = !unavailable && !!selected && Number(offerTtd) > 0;

  const openService = (type: ServiceType) => {
    setServiceType(type);
    setSelected('');
    setOffer(null);
    setError('');
    setPay('cash');
    setParams({ svc: type }, { replace: true });
    requestAnimationFrame(() => document.getElementById('rides-offer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (unavailable) {
      setError(line1);
      return;
    }
    const ttd = Number(offerTtd);
    if (!Number.isFinite(ttd) || ttd <= 0) {
      setError('Offer a real TTD amount. Juvay does not quote a fare.');
      return;
    }
    setBusy(true);
    try {
      const data = await createRideOffer({
        driverId: selected,
        pickup,
        drop,
        riderPhone,
        offerTtd: ttd,
        pay,
        kind: 'ride',
        serviceType,
      });
      setOffer(data.offer);
      if (data.book === true) {
        setError('Unexpected book:true before both agree.');
      }
    } catch (err: any) {
      setError(err.message || 'Offer failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SEO
        title="Juvay Rides — cash-first rideshare, courier, delivery"
        description="Offer a TTD amount to a listed driver in Trinidad & Tobago. Cash default. Wam is wam.com, not WhatsApp."
        keywords="juvay rides, rideshare trinidad, cash rides tobago"
        url="https://juvay.app/rides"
      />

      <div className="relative min-h-[42vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="/trini-business-hero.png" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-8 pt-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400 mb-3">Juvay Rides · cash island</p>
          <h1 className="text-4xl sm:text-6xl font-black leading-none mb-4">
            You offer.<br /><span className="text-yellow-400">They accept.</span>
          </h1>
          <p className="text-white/70 max-w-xl mb-4">
            Pickup, drop, your TTD. Listed drivers only. Cash default. Wam is <a href="https://wam.com" className="underline text-yellow-400" target="_blank" rel="noreferrer">wam.com</a> — not WhatsApp. No quoted fare.
          </p>
          <div className="flex flex-wrap gap-2 mb-6 text-[11px] font-bold uppercase tracking-wide">
            <span className="rounded-full bg-yellow-400 text-black px-3 py-1">cash default</span>
            <span className="rounded-full bg-white/10 px-3 py-1">fail-closed</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{unavailable ? '0 listed' : `${listedCount} listed`}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">no ghost cars</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
            {SERVICES.map((svc) => {
              const Icon = svc.icon;
              const on = serviceType === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => openService(svc.id)}
                  className={`min-h-[72px] rounded-2xl px-2 py-3 text-center border ${on ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-white/5 border-white/15 text-white'}`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <span className="block text-xs sm:text-sm font-black leading-tight">{svc.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div id="rides-offer" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-5 gap-4">
        <section className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Listed-only OSM radar · {island}</span>
            <span>{unavailable ? '0 listed' : `${listedCount} listed`}</span>
          </div>
          <IslandRideMap island={island} pins={listed} height="420px" dark />
          {unavailable ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="font-bold text-yellow-400 mb-1">{line1}</p>
              <p className="text-sm text-white/60">{line2}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {listed.map((driver) => (
                <li key={driver.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(driver.id)}
                    className={`w-full text-left rounded-2xl p-4 min-h-[44px] border ${selected === driver.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-black">{driver.name}</p>
                        <p className="text-xs text-white/50">Plate {driver.plate} · {driver.phone}</p>
                      </div>
                      <p className="text-xs text-white/40">{driver.wamHandle ? 'cash or Wam' : 'cash only'}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#111] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">{SERVICES.find((s) => s.id === serviceType)?.blurb} offer</h2>
            <Link to="/rides/school-run" className="text-xs text-yellow-400 inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> School run
            </Link>
          </div>
          <form onSubmit={submitOffer} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-white/50">
              Island
              <select value={island} onChange={(e) => setIsland(e.target.value)} className={`${field} mt-1`}>
                <option className="text-black">Trinidad</option>
                <option className="text-black">Tobago</option>
              </select>
            </label>
            <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" className={field} />
            <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="Drop" className={field} />
            <input required value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} inputMode="decimal" placeholder="Your TTD offer — we do not quote" className={field} />
            <input required value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Your phone" className={field} />
            <div className="grid grid-cols-2 gap-2">
              <label className={`min-h-[44px] rounded-xl border px-3 flex items-center gap-2 text-sm ${pay === 'cash' ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/15'}`}>
                <input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} />
                Cash default
              </label>
              <label className={`min-h-[44px] rounded-xl border px-3 flex items-center gap-2 text-sm ${pay === 'wam' ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/15'} ${!selectedDriver?.wamHandle ? 'opacity-40' : ''}`}>
                <input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} disabled={!selectedDriver?.wamHandle} />
                Wam.com
              </label>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={busy || !offerReady}
              className="w-full min-h-[48px] rounded-xl bg-yellow-400 text-black font-black disabled:opacity-30"
            >
              {unavailable ? 'Offers disabled — no listed drivers' : busy ? 'Sending…' : 'Send offer'}
            </button>
            <p className="text-[11px] text-white/40">book:false until both agree. No WiPay, PayPal, or Linx.</p>
          </form>

          {offer ? (
            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <p className="font-bold">Offer {offer.status} · TT${offer.counterTtd || offer.offerTtd} · {offer.pay}</p>
              <p className="text-white/50">Book stays false until you and the driver both agree.</p>
              <button
                type="button"
                onClick={async () => {
                  const data = await agreeRideOffer(offer.id, { role: 'rider', riderPhone });
                  setOffer(data.offer);
                  if (data.trip?.id) {
                    const token = String(data.trip.sharePath || '').split('t=')[1] || '';
                    window.location.href = token ? `/rides/trip/${data.trip.id}?t=${encodeURIComponent(token)}` : `/rides/trip/${data.trip.id}`;
                  }
                }}
                className="w-full min-h-[44px] rounded-xl border border-yellow-400 text-yellow-400 font-bold"
              >
                I agree to this amount
              </button>
              <button
                type="button"
                onClick={async () => {
                  const data = await cancelRideOffer(offer.id, { riderPhone });
                  setOffer(data.offer);
                }}
                className="w-full min-h-[44px] rounded-xl border border-white/20 text-white/70"
              >
                Cancel offer
              </button>
              {offer.tripId ? <Link to={`/rides/trip/${offer.tripId}`} className="block text-center underline text-yellow-400">Open trip</Link> : null}
            </div>
          ) : null}

          <Link to="/drive" className="block text-center text-sm text-yellow-400 font-bold">Drive with Juvay</Link>
        </section>
      </div>
    </div>
  );
};
