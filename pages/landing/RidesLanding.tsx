import React, { useEffect, useState } from 'react';
import { Car, Package, ShoppingBag, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { agreeRideOffer, createRideOffer, fetchListedRides } from '../../services/ridesApi';

type ServiceType = 'rideshare' | 'courier' | 'delivery';

const SERVICES: { id: ServiceType; title: string; blurb: string; icon: typeof Car; iconWrap: string; iconColor: string }[] = [
  { id: 'rideshare', title: 'Rideshare', blurb: 'Daily rides across T&T.', icon: Car, iconWrap: 'bg-yellow-100', iconColor: 'text-yellow-700' },
  { id: 'courier', title: 'Courier', blurb: 'Packages across the islands.', icon: Package, iconWrap: 'bg-blue-100', iconColor: 'text-blue-700' },
  { id: 'delivery', title: 'Delivery', blurb: 'Food and goods runs.', icon: ShoppingBag, iconWrap: 'bg-green-100', iconColor: 'text-green-700' },
];

/**
 * Cinematic Juvay Rides product page. Public copy only. Offer is not a live dispatch.
 */
export const RidesLanding: React.FC = () => {
  const [island, setIsland] = useState('Trinidad');
  const [serviceType, setServiceType] = useState<ServiceType>('rideshare');
  const [unavailable, setUnavailable] = useState(true);
  const [listed, setListed] = useState<Array<{ id: string; name: string; plate: string; phone: string; wamHandle?: string; jobTypes?: string[] }>>([]);
  const [selected, setSelected] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [offerTtd, setOfferTtd] = useState('');
  const [pay, setPay] = useState<'cash' | 'wam'>('cash');
  const [riderPhone, setRiderPhone] = useState('');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    fetchListedRides({ island, serviceType })
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
  }, [island, serviceType]);

  const selectedDriver = listed.find((d) => d.id === selected);

  const openOffer = (type: ServiceType) => {
    setServiceType(type);
    setSelected('');
    setOffer(null);
    requestAnimationFrame(() => {
      document.getElementById('rides-offer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await createRideOffer({
        driverId: selected,
        serviceType,
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

  const serviceLabel = SERVICES.find((s) => s.id === serviceType)?.title || 'Rideshare';

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEO
        title="Juvay Rides — Rideshare, Courier, Delivery"
        description="One driver can take rideshare, courier, and delivery jobs in Trinidad & Tobago. Cash default. Wam optional."
        keywords="juvay rides, rideshare trinidad, courier tobago, delivery trinidad"
        url="https://juvay.app/rides"
      />

      <div className="relative bg-trini-black text-white h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <img src="/trini-business-hero.png" className="w-full h-full object-cover" alt="" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-500 mb-4">Juvay Rides</p>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              One driver.<br /><span className="text-yellow-500">Three jobs.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10">
              Rideshare, courier, and delivery. One person can take all three. School run sits under rideshare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/drive" className="bg-yellow-500 text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg flex items-center justify-center">
                Apply as a driver
              </Link>
              <button type="button" onClick={() => openOffer('rideshare')} className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors flex items-center justify-center">
                Need a ride
              </button>
              <button type="button" onClick={() => openOffer('courier')} className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-black transition-colors flex items-center justify-center">
                Send a package
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-gray-100">
              <img src="/templates/heroes/services.jpg" className="w-full h-full object-cover min-h-[220px]" alt="" />
            </div>
            <div className="md:w-1/2 p-10 flex flex-col justify-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">One application. Many jobs.</h2>
              <p className="text-gray-600 mb-6">
                Apply once. Take rideshare, courier, and delivery. Cash to the driver. Wam is optional on{' '}
                <a href="https://wam.com" className="underline" target="_blank" rel="noreferrer">wam.com</a>
                {' '}— not WhatsApp.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center font-bold text-gray-800">
                  <Car className="h-5 w-5 text-yellow-600 mr-3" /> Rideshare, courier, and delivery
                </li>
                <li className="flex items-center font-bold text-gray-800">
                  <GraduationCap className="h-5 w-5 text-blue-600 mr-3" /> School run sits under rideshare
                </li>
                <li className="flex items-center font-bold text-gray-800">
                  <Package className="h-5 w-5 text-green-600 mr-3" /> Cash default · Wam optional
                </li>
              </ul>
              <Link to="/drive" className="text-yellow-600 font-bold text-lg hover:underline">
                Apply as a driver
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Need a ride or a drop?</h2>
          <p className="text-xl text-gray-500 mb-10">
            Pick a service. You offer an amount. The listed driver accepts or counters. Not a live dispatch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {SERVICES.map((svc) => {
              const Icon = svc.icon;
              const active = serviceType === svc.id;
              return (
                <div
                  key={svc.id}
                  className={`p-6 rounded-xl text-center transition-all border ${active ? 'bg-white shadow-xl border-yellow-500' : 'bg-gray-50 hover:bg-white hover:shadow-xl border-gray-100'}`}
                >
                  <button type="button" onClick={() => openOffer(svc.id)} className="w-full">
                    <div className={`${svc.iconWrap} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${svc.iconColor}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{svc.title}</h3>
                    <p className="text-sm text-gray-500">{svc.blurb}</p>
                  </button>
                  {svc.id === 'rideshare' ? (
                    <Link
                      to="/rides/school-run"
                      className="mt-3 inline-block text-sm font-semibold text-yellow-700 underline"
                    >
                      School run
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mb-16">
            School run is a parent-booked rideshare job.{' '}
            <Link to="/rides/school-run" className="font-semibold text-gray-900 underline">Open school run</Link>
          </p>

          <div id="rides-offer" className="bg-gray-50 rounded-3xl p-6 sm:p-10 text-left border border-gray-200">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">{serviceLabel} offer</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">
              {serviceType === 'rideshare' ? 'Need a ride.' : serviceType === 'courier' ? 'Send a package.' : 'Send a delivery.'} Cash default. Wam optional.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-6">
              Island
              <select value={island} onChange={(e) => setIsland(e.target.value)} className="mt-1 w-full min-h-[44px] rounded-full px-4 border border-gray-300 bg-white">
                <option>Trinidad</option>
                <option>Tobago</option>
              </select>
            </label>

            {unavailable ? (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-2">Rides are unavailable on this origin.</p>
                <p className="text-sm text-gray-500">
                  No drivers are listed. Juvay does not invent a fare or a live booking button.
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-3 mb-6">
                  {listed.map((driver) => (
                    <li key={driver.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(driver.id)}
                        className="w-full text-left border rounded-2xl p-4 min-h-[44px] bg-white"
                        style={{ borderColor: selected === driver.id ? '#111' : '#e5e7eb' }}
                      >
                        <div className="font-bold">{driver.name}</div>
                        <div className="text-sm text-gray-500">Plate {driver.plate}</div>
                        <div className="text-sm text-gray-500">{driver.phone}</div>
                      </button>
                    </li>
                  ))}
                </ul>

                {selectedDriver ? (
                  <form onSubmit={submitOffer} className="space-y-3">
                    <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder={serviceType === 'rideshare' ? 'Pickup' : 'Pickup address'} className="w-full min-h-[44px] rounded-full px-4 border border-gray-300 bg-white" />
                    <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder={serviceType === 'rideshare' ? 'Drop' : 'Drop-off'} className="w-full min-h-[44px] rounded-full px-4 border border-gray-300 bg-white" />
                    <input value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} placeholder="Your TTD offer" className="w-full min-h-[44px] rounded-full px-4 border border-gray-300 bg-white" />
                    <input required value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Your phone" className="w-full min-h-[44px] rounded-full px-4 border border-gray-300 bg-white" />
                    <label className="flex items-center gap-2 min-h-[44px] text-sm font-medium">
                      <input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} />
                      Cash
                    </label>
                    <label className="flex items-center gap-2 min-h-[44px] text-sm font-medium">
                      <input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} disabled={!selectedDriver.wamHandle} />
                      Wam (wam.com, only if this driver typed a handle)
                    </label>
                    {error ? <p className="text-sm text-red-700">{error}</p> : null}
                    <button type="submit" className="w-full min-h-[44px] rounded-full font-bold bg-yellow-500 text-black hover:bg-yellow-400">
                      Send {serviceLabel.toLowerCase()} offer
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-gray-500 text-center">Pick a listed driver to send this {serviceLabel.toLowerCase()} offer.</p>
                )}

                {offer ? (
                  <div className="mt-4 text-sm space-y-2 text-center">
                    <p>Offer {offer.id} · {offer.serviceType || serviceType} · {offer.status}.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        const data = await agreeRideOffer(offer.id, { role: 'rider', riderPhone });
                        setOffer(data.offer);
                        if (data.trip) window.location.href = `/rides/trip/${data.trip.id}`;
                      }}
                      className="w-full min-h-[44px] rounded-full border-2 border-trini-black font-bold"
                    >
                      I agree to this amount
                    </button>
                    {offer.tripId ? <Link to={`/rides/trip/${offer.tripId}`} className="underline font-semibold">Open job</Link> : null}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="mt-12">
            <Link to="/drive" className="bg-yellow-500 text-black px-10 py-4 rounded-full font-bold hover:bg-yellow-400 shadow-lg inline-flex">
              Apply as a driver
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
