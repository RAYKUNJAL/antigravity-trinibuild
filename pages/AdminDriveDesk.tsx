import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, GraduationCap, RefreshCw, Wallet } from 'lucide-react';
import { IslandRideMap } from '../components/IslandRideMap';
import {
  adminApproveDrive,
  adminSchoolRunDrive,
  adminSubscribeDrive,
  fetchAdminDriveApplications,
} from '../services/ridesApi';

type Application = {
  id: string;
  name: string;
  phone: string;
  plate?: string;
  island?: string;
  jobTypes?: string[];
  approved?: boolean;
  listed?: boolean;
  schoolRunApproved?: boolean;
  schoolRunRequested?: boolean;
  schoolRunListed?: boolean;
  subscriptionPaid?: boolean;
  subscriptionPriceCents?: number | null;
  goOnlineBlocked?: boolean;
  goOnlineReason?: string | null;
  pinLat?: number | null;
  pinLng?: number | null;
};

type Filter = 'all' | 'pending' | 'listed' | 'school';

/**
 * /admin/drive SPA only. Bearer via ridesApi. JSON never SPA HTML.
 * Do not link /admin or /admin/bypass from this desk.
 */
export const AdminDriveDesk: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const data = await fetchAdminDriveApplications();
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      setApplications([]);
      setError(err.message || 'Could not load applications — API must return JSON, not the site shell.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try {
      await fn(id);
      await load();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setBusyId('');
    }
  };

  const pending = applications.filter((a) => a.approved !== true);
  const listedRows = applications.filter((a) => a.listed === true);
  const schoolWait = applications.filter((a) => a.schoolRunRequested && !a.schoolRunApproved);

  const visible = useMemo(() => applications.filter((row) => {
    if (filter === 'pending') return row.approved !== true;
    if (filter === 'listed') return row.listed === true;
    if (filter === 'school') return row.schoolRunRequested === true || row.schoolRunApproved === true;
    return true;
  }), [applications, filter]);

  const listedPins = listedRows.filter(
    (row) => Number.isFinite(Number(row.pinLat)) && Number.isFinite(Number(row.pinLng)),
  );

  const Chip = ({ id, label, count }: { id: Filter; label: string; count: number }) => (
    <button
      type="button"
      onClick={() => setFilter(id)}
      className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
        filter === id ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white'
      }`}
    >
      {label} {count}
    </button>
  );

  return (
    <div className="min-h-screen bg-black pt-24 pb-20 text-white">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400">Operator · /admin/drive</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase italic">Drive queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Approve → list. Confirm subscription only when priceCents is set. Flag school-run.
              This desk is /admin/drive — not /admin, not /admin/bypass. No demo drivers. Radar is listed pins only.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setLoading(true); load(); }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh JSON
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip id="all" label="All" count={applications.length} />
          <Chip id="pending" label="Pending KYC" count={pending.length} />
          <Chip id="listed" label="Listed" count={listedRows.length} />
          <Chip id="school" label="School-run" count={schoolWait.length + applications.filter((a) => a.schoolRunApproved).length} />
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111] p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-white/40">Listed-only OSM · no ghost cars</p>
          {listedPins.length > 0 ? (
            <IslandRideMap island="Trinidad" pins={listedPins} height="240px" dark />
          ) : (
            <p className="text-sm text-white/50">No listed pins on this origin.</p>
          )}
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-white/50">Loading applications…</p>
        ) : visible.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#111] p-10 text-center">
            <h2 className="text-xl font-black">
              {applications.length === 0 ? 'No applications' : 'No rows match this filter'}
            </h2>
            <p className="mt-2 text-white/50">
              {applications.length === 0
                ? 'Empty until someone applies at /drive. Juvay does not invent drivers.'
                : 'Switch chips to see the rest of the JSON queue.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-3 md:hidden">
              {visible.map((row) => (
                <article key={row.id} className="rounded-2xl border border-white/10 bg-[#111] p-4">
                  <p className="text-lg font-black uppercase italic">{row.name}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                    {row.phone} · {row.plate || 'no plate'} · {(row.jobTypes || []).join(', ') || 'rideshare'} · {row.island || 'Trinidad'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Flag on={row.approved} label="approved" />
                    <Flag on={row.listed} label="listed" />
                    <Flag on={row.subscriptionPaid} label="sub" />
                    <Flag on={row.schoolRunApproved} label={row.schoolRunRequested && !row.schoolRunApproved ? 'school wait' : 'school'} />
                  </div>
                  {row.goOnlineReason ? <p className="mt-2 text-xs text-yellow-400">{row.goOnlineReason}</p> : null}
                  <RowActions row={row} busyId={busyId} act={act} />
                </article>
              ))}
            </div>

            <div className="mt-8 hidden overflow-x-auto rounded-3xl border border-white/10 bg-[#111] md:block">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Jobs</th>
                    <th className="px-4 py-3">Flags</th>
                    <th className="px-4 py-3">Pin</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id} className="border-t border-white/5 align-top">
                      <td className="px-4 py-3">
                        <p className="font-bold">{row.name}</p>
                        <p className="text-xs text-white/40">{row.plate || 'no plate'} · {row.island || 'Trinidad'}</p>
                      </td>
                      <td className="px-4 py-3 text-white/70">{row.phone}</td>
                      <td className="px-4 py-3 text-white/70">{(row.jobTypes || []).join(', ') || 'rideshare'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Flag on={row.approved} label="approved" />
                          <Flag on={row.listed} label="listed" />
                          <Flag on={row.subscriptionPaid} label="sub" />
                          <Flag on={row.schoolRunApproved} label={row.schoolRunRequested && !row.schoolRunApproved ? 'school wait' : 'school'} />
                        </div>
                        {row.goOnlineReason ? <p className="mt-2 max-w-xs text-[11px] text-yellow-400">{row.goOnlineReason}</p> : null}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {row.listed && row.pinLat != null ? `${row.pinLat}, ${row.pinLng}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions row={row} busyId={busyId} act={act} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="mt-8 text-center text-xs text-white/30">
          Operators stay on this path. Riders <Link to="/rides" className="text-yellow-400 hover:underline">/rides</Link>
          {' · '}
          drivers <Link to="/drive" className="text-yellow-400 hover:underline">/drive</Link>.
        </p>
      </div>
    </div>
  );
};

const Flag: React.FC<{ on?: boolean; label: string }> = ({ on, label }) => (
  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${on ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/35'}`}>
    {label}
  </span>
);

const RowActions: React.FC<{
  row: Application;
  busyId: string;
  act: (id: string, fn: (id: string) => Promise<unknown>) => Promise<void>;
}> = ({ row, busyId, act }) => {
  const busy = busyId === row.id;
  const priceSet = row.subscriptionPriceCents != null && Number(row.subscriptionPriceCents) > 0;
  return (
    <div className="mt-4 flex flex-col gap-2 md:mt-0 md:min-w-[180px]">
      <button
        type="button"
        disabled={busy || row.approved === true}
        onClick={() => act(row.id, adminApproveDrive)}
        className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg bg-yellow-400 px-3 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-40"
      >
        <CheckCircle2 className="h-3 w-3" /> {busy ? '…' : 'Approve → list'}
      </button>
      <button
        type="button"
        disabled={busy || !priceSet}
        onClick={() => act(row.id, adminSubscribeDrive)}
        className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-white/20 px-3 text-[10px] font-black uppercase tracking-widest text-white/80 disabled:opacity-40"
        title={priceSet ? undefined : 'priceCents is null on this origin'}
      >
        <Wallet className="h-3 w-3" /> Confirm subscription
      </button>
      <button
        type="button"
        disabled={busy || row.schoolRunApproved === true}
        onClick={() => act(row.id, adminSchoolRunDrive)}
        className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-white/20 px-3 text-[10px] font-black uppercase tracking-widest text-white/80 disabled:opacity-40"
      >
        <GraduationCap className="h-3 w-3" /> Flag school-run
      </button>
    </div>
  );
};
