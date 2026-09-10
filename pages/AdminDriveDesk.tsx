import React, { useEffect, useState } from 'react';
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
  jobTypes?: string[];
  approved?: boolean;
  listed?: boolean;
  schoolRunApproved?: boolean;
  schoolRunRequested?: boolean;
  goOnlineBlocked?: boolean;
  pinLat?: number | null;
  pinLng?: number | null;
  island?: string;
};

/**
 * /admin/drive SPA only. Bearer via ridesApi. JSON never SPA HTML.
 */
export const AdminDriveDesk: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);

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

  const listedPins = applications.filter((row) => row.listed === true);

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400 mb-2">Operator</p>
          <h1 className="text-3xl font-black">Drive queue</h1>
          <p className="text-sm text-white/50">Approve → list. Flag school-run. Confirm sub only when priceCents is set. No demo drivers.</p>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="rounded-3xl border border-white/10 bg-[#111] p-4">
          <p className="text-xs text-white/40 mb-3">Listed pins only. No ghost cars.</p>
          {listedPins.some((row) => Number.isFinite(Number(row.pinLat)) && Number.isFinite(Number(row.pinLng))) ? (
            <IslandRideMap island="Trinidad" pins={listedPins} height="240px" dark />
          ) : (
            <p className="text-sm text-white/50">No listed pins on this origin.</p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-white/50">Loading applications…</p>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#111] p-10 text-center">
            <h2 className="text-xl font-black mb-2">No applications</h2>
            <p className="text-white/50">Juvay does not invent drivers.</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-[#111] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/50">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Jobs</th>
                  <th className="py-3 px-4">Approved</th>
                  <th className="py-3 px-4">Listed</th>
                  <th className="py-3 px-4">School-run</th>
                  <th className="py-3 px-4">Online pin</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="py-3 px-4 font-bold">{row.name}</td>
                    <td className="py-3 px-4">{row.phone}</td>
                    <td className="py-3 px-4">{(row.jobTypes || []).join(', ') || 'rideshare'}</td>
                    <td className="py-3 px-4">{row.approved ? 'yes' : 'no'}</td>
                    <td className="py-3 px-4">{row.listed ? 'yes' : 'no'}</td>
                    <td className="py-3 px-4">{row.schoolRunApproved ? 'yes' : row.schoolRunRequested ? 'requested' : 'no'}</td>
                    <td className="py-3 px-4">{row.listed && row.pinLat != null ? `${row.pinLat}, ${row.pinLng}` : '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <button type="button" disabled={busyId === row.id || row.approved === true} onClick={() => act(row.id, adminApproveDrive)} className="min-h-[40px] px-3 rounded-lg bg-yellow-400 text-black font-black disabled:opacity-40">
                          Approve → list
                        </button>
                        <button type="button" disabled={busyId === row.id} onClick={() => act(row.id, adminSubscribeDrive)} className="min-h-[40px] px-3 rounded-lg border border-white/20 font-semibold disabled:opacity-40">
                          Confirm subscription
                        </button>
                        <button type="button" disabled={busyId === row.id || row.schoolRunApproved === true} onClick={() => act(row.id, adminSchoolRunDrive)} className="min-h-[40px] px-3 rounded-lg border border-white/20 font-semibold disabled:opacity-40">
                          Flag school-run
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
