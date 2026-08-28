import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IslandRideMap } from '../components/IslandRideMap';
import { addChildProfile, agreeRideOffer, createRideOffer, fetchChildren, fetchListedRides, readImageAsDataUrl } from '../services/ridesApi';

/**
 * Parent-booked school run. Not a teen dating app. Not unattended street hail.
 */
export const SchoolRun: React.FC = () => {
  const [island, setIsland] = useState('Trinidad');
  const [listed, setListed] = useState<any[]>([]);
  const [unavailable, setUnavailable] = useState(true);
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
    fetchListedRides({ island, schoolRun: true }).then((data) => {
      if (data.listedCount > 0) {
        setUnavailable(false);
        setListed(data.listed);
      } else {
        setUnavailable(true);
        setListed([]);
      }
    }).catch(() => { setUnavailable(true); setListed([]); });
  }, [island]);

  const loadKids = async () => {
    const data = await fetchChildren(parentPhone);
    setChildren(data.children || []);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">School run</h1>
        <p className="text-gray-700 font-medium">This is a parent-booked school run, not a teen dating app, not unattended street hail.</p>
        <p className="text-sm text-gray-500">The child is a passenger profile. The kid never pays and never sees cash confirm. Parent pays cash at pickup or Wam from the parent. Share-trip to the parent is always on.</p>
        <label className="block text-sm">
          Island
          <select value={island} onChange={(e) => setIsland(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3">
            <option>Trinidad</option>
            <option>Tobago</option>
          </select>
        </label>
        <IslandRideMap island={island} pins={listed} />

        {unavailable ? (
          <>
            <p className="text-gray-600">Rides are unavailable on this origin.</p>
            <p className="text-sm text-gray-500">No drivers are listed. Juvay does not invent a fare or a live booking button.</p>
          </>
        ) : null}

        <label className="block text-sm">
          Parent phone
          <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className="mt-1 w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
        </label>
        <button type="button" onClick={loadKids} className="min-h-[44px] px-4 border border-gray-900 rounded-xl">Load children</button>
        {children.length === 0 ? <p className="text-sm text-gray-500">No children on this parent. Empty stays empty. We do not invent kids or schools.</p> : (
          <ul className="text-sm space-y-1">
            {children.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setChildId(c.id)} className={`underline ${childId === c.id ? 'font-bold' : ''}`}>{c.name} · {c.school}</button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="space-y-2 border-t border-gray-200 pt-4"
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
          <p className="text-sm font-medium">Add a child profile (typed school only)</p>
          <input required value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Child name" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          <input required value={school} onChange={(e) => setSchool(e.target.value)} placeholder="School — type the real name" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
          <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await readImageAsDataUrl(f)); }} />
          <button type="submit" className="w-full min-h-[44px] rounded-xl border border-gray-900">Save child</button>
        </form>

        {!unavailable && listed.length > 0 ? (
          <form
            className="space-y-2 border-t border-gray-200 pt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              try {
                const data = await createRideOffer({
                  kind: 'school_run',
                  driverId: selected,
                  parentPhone,
                  childId,
                  pickup,
                  drop,
                  offerTtd,
                  pay,
                  startPin,
                });
                setOffer(data.offer);
              } catch (err: any) {
                setError(err.message);
              }
            }}
          >
            <p className="text-sm">Offer a school-run fare. Book only after both agree. Parent sets the start PIN.</p>
            {listed.map((d) => (
              <button type="button" key={d.id} onClick={() => setSelected(d.id)} className={`w-full text-left border rounded-xl p-3 ${selected === d.id ? 'border-stone-900' : 'border-gray-200'}`}>
                {d.name} · {d.plate} · {d.phone}
              </button>
            ))}
            <input required value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input required value={drop} onChange={(e) => setDrop(e.target.value)} placeholder="School drop" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input value={offerTtd} onChange={(e) => setOfferTtd(e.target.value)} placeholder="Your TTD offer — empty until you type it" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <input required value={startPin} onChange={(e) => setStartPin(e.target.value)} placeholder="4-digit start PIN" className="w-full min-h-[44px] border border-gray-300 rounded-xl px-3" />
            <label className="flex gap-2 min-h-[44px] items-center"><input type="radio" checked={pay === 'cash'} onChange={() => setPay('cash')} /> Cash — parent pays at pickup</label>
            <label className="flex gap-2 min-h-[44px] items-center"><input type="radio" checked={pay === 'wam'} onChange={() => setPay('wam')} /> Wam from the parent (wam.com)</label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button type="submit" className="w-full min-h-[44px] rounded-xl bg-stone-900 text-white font-semibold">Send parent offer</button>
          </form>
        ) : null}

        {offer ? (
          <div className="text-sm space-y-2">
            <p>Offer {offer.status}. Share-trip to the parent is always on after both agree.</p>
            <button
              type="button"
              className="w-full min-h-[44px] border border-gray-900 rounded-xl"
              onClick={async () => {
                const data = await agreeRideOffer(offer.id, { role: 'rider', parentPhone });
                setOffer(data.offer);
                if (data.trip) window.location.href = `/rides/trip/${data.trip.id}?t=${encodeURIComponent((data.trip.sharePath || '').split('t=')[1] || '')}`;
              }}
            >
              Parent agrees
            </button>
          </div>
        ) : null}
        <p className="text-sm"><Link to="/rides" className="underline">Back to rides</Link></p>
      </div>
    </div>
  );
};
