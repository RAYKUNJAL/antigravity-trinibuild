import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { addChildProfile, agreeRideOffer, createRideOffer, fetchChildren, fetchListedRides, readImageAsDataUrl } from '../services/ridesApi';

const field = 'mt-1 w-full min-h-[44px] border border-white/15 bg-white/5 text-white rounded-xl px-3 placeholder:text-white/40';

/**
 * Parent-booked school run. Empty children stay empty.
 */
export const SchoolRun: React.FC = () => {
  const [island, setIsland] = useState('Trinidad');
  const [listed, setListed] = useState<any[]>([]);
  const [unavailable, setUnavailable] = useState(true);
  const [line1, setLine1] = useState('Rides are unavailable on this origin.');
  const [line2, setLine2] = useState('No drivers are listed. Juvay does not invent a fare or a live booking button.');
  const [parentPhone, setParentPhone] = useState('');
  const [children, setChildren] = useState<any[]>([]);
  const [childName, setChildName] = useState('');
  const [school, setSchool] = useState('');
  const [photo, setPhoto] = useState('');
  const [selected, setSelected] = useState('');
  const [childId, setChildId] = useState('');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [offerTtd, setOfferTtd] = useState('');
  const [startPin, setStartPin] = useState('');
  const [pay, setPay] = useState<'cash' | 'wam'>('cash');
  const [error, setError] = useState('');
  const [offer, setOffer] = useState<any>(null);

  useEffect(() => {
    fetchListedRides({ island, schoolRun: true, serviceType: 'rideshare' }).then((data) => {
      const empty = data.unavailable === true || !data.listedCount || !Array.isArray(data.listed) || data.listed.length === 0;
      setUnavailable(empty);
      setListed(empty ? [] : data.listed);
      if (empty) setSelected('');
      if (data.line1) setLine1(data.line1);
      if (data.line2) setLine2(data.line2);
    }).catch(() => { setUnavailable(true); setListed([]); setSelected(''); });
  }, [island]);

  const loadKids = async () => {
    const data = await fetchChildren(parentPhone);
    setChildren(data.children || []);
  };

  const sendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ttd = Number(offerTtd);
    if (!Number.isFinite(ttd) || ttd <= 0) {
      setError('Offer a real TTD amount. No invented fare.');
      return;
    }
    if (!/^\d{4}$/.test(startPin)) {
      setError('Parent must set a 4-digit start PIN.');
      return;
    }
    try {
      const data = await createRideOffer({
        kind: 'school_run',
        driverId: selected,
        parentPhone,
        childId,
        pickup,
        drop,
        offerTtd: ttd,
        pay,
        startPin,
        serviceType: 'rideshare',
      });
      setOffer(data.offer);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">School run · parent-booked</p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase">
          <span className="rounded-full bg-yellow-400 text-black px-3 py-1">cash default</span>
          <span className="rounded-full bg-white/10 px-3 py-1">empty kids stay empty</span>
          <span className="rounded-full bg-white/10 px-3 py-1">startPin 4 digits</span>
          <span className="rounded-full bg-white/10 px-3 py-1">{unavailable ? '0 listed' : `${listed.length} listed`}</span>
        </div>
        <h1 className="mt-4 text-4xl font-black">Parent books. Kid rides.</h1>
        <p className="mt-2 max-w-2xl text-white/70 font-medium">This is a parent-booked school run, not a teen dating app, not unattended street hail.</p>
        <p className="mt-1 max-w-2xl text-sm text-white/50">The child is a passenger profile. The kid never pays and never sees cash confirm. Parent pays cash at pickup or Wam from the parent on wam.com.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-5">
          <section className="space-y-3 lg:col-span-3">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Listed school-run OSM · {island}</span>
              <span>{unavailable ? '0 listed' : `${listed.length} listed`}</span>
            </div>
            <label className="block text-sm">
              Island
              <select value={island} onChange={(e) => setIsland(e.target.value)} className={field}>
                <option className="text-black">Trinidad</option>
                <option className="text-black">Tobago</option>
              </select>
            </label>
            <IslandRideMap island={island} pins={listed} dark height="320px" />
            {unavailable ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-bold text-yellow-400">{line1}</p>
                <p className="text-sm text-white/50">{line2}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {listed.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(d.id)}
                      className={`w-full rounded-2xl border p-4 text-left min-h-[44px] ${selected === d.id ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <p className="font-black">{d.name}</p>
                      <p className="text-xs text-white/50">{d.plate} · {d.phone}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4 rounded-3xl border border-white/10 bg-[#111] p-5 lg:col-span-2">
            <h2 className="text-lg font-black">Parent desk</h2>
            <label className="block text-sm">
              Parent phone
              <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={field} />
            </label>
            <button type="button" onClick={loadKids} className="min-h-[44px] w-full rounded-xl border border-white/20 font-bold">
              Load children
            </button>
            {children.length === 0 ? (
              <p className="text-sm text-white/50">No children on this parent. Empty stays empty. We do not invent kids or schools.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {children.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setChildId(c.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left ${childId === c.id ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-white/15'}`}
                    >
                      {c.name} · {c.school}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="space-y-2 border-t border-white/10 pt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                try {
                  await addChildProfile({ parentPhone, name: childName, school, photo });
                  setChildName('');
                  setSchool('');
                  loadKids();
                } catch (err: any) {
                  setError(err.message);
                }
              }}
            >
              <p className="text-sm font-bold">Add a child profile (typed school only)</p>
              <input required value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Child name" className={`w-full ${field}`} />
              <input required value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School — type the real name" className={`w-full ${field}`} />
              <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await readImageAsDataUrl(f)); }} />
              <button type="submit" className="w-full min-h-[44px] rounded-xl border border-white/20">Save child</button>
            </form>

            {!unavailable && listed.length > 0 ? (
              <form className="space-y-2 border-t border-white/10 pt-4" onSubmit={sendOffer}>
                <p className="text-sm">Offer a school-run fare. Book only after both agree. Parent sets the 4-digit start PIN.</p>
                <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" className={`w-full ${field}`} />
                <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="School drop" className={`w-full ${field}`} />
                <input value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} placeholder="Your TTD offer — empty until you type it" className={`w-full ${field}`} />
                <input required value={startPin} onChange={(e) => setStartPin(e.target.value)} placeholder="4-digit start PIN" maxLength={4} className={`w-full ${field}`} />
                <label className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-sm ${pay === 'cash' ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/15'}`}>
                  <input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} /> Cash — parent pays at pickup
                </label>
                <label className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-sm ${pay === 'wam' ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/15'}`}>
                  <input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} /> Wam from the parent (wam.com)
                </label>
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <button type="submit" disabled={unavailable || !selected} className="w-full min-h-[48px] rounded-xl bg-yellow-400 text-black font-black disabled:opacity-30">
                  {unavailable ? 'Offers disabled — no listed drivers' : 'Send parent offer'}
                </button>
              </form>
            ) : null}

            {offer ? (
              <div className="space-y-2 border-t border-white/10 pt-4 text-sm">
                <p>Offer {offer.status}. Share-trip to the parent is always on after both agree.</p>
                <button
                  type="button"
                  className="w-full min-h-[44px] rounded-xl border border-yellow-400 font-bold text-yellow-400"
                  onClick={async () => {
                    const data = await agreeRideOffer(offer.id, { role: 'rider', parentPhone });
                    setOffer(data.offer);
                    if (data.trip) {
                      const token = String(data.trip.sharePath || '').split('t=')[1] || '';
                      window.location.href = `/rides/trip/${data.trip.id}?t=${encodeURIComponent(token)}`;
                    }
                  }}
                >
                  Parent agrees
                </button>
              </div>
            ) : null}

            <p className="text-center text-sm">
              <Link to="/rides" className="underline text-yellow-400">Back to rides</Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
