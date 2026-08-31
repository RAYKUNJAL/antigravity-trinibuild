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
  pinLat?: number | null;
  pinLng?: number | null;
  island?: string;
};

/**
 * /admin/drive — KYC queue. Empty stays empty. No seeded drivers.
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
      setError(err.message || 'Could not load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Rides admin</h1>
        <p className="text-gray-600 mb-6">
          Approve KYC. Confirm a subscription only when a price exists. Flag school-run. Radar shows listed pins only.
        </p>

        {error ? <p className="text-sm text-red-700 mb-4">{error}</p> : null}

        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8">
          <p className="text-sm text-gray-500 mb-3">Listed pins only. No ghost cars.</p>
          {listedPins.some((row) => Number.isFinite(Number(row.pinLat)) && Number.isFinite(Number(row.pinLng))) ? (
            <IslandRideMap island="Trinidad" pins={listedPins} height="240px" />
          ) : (
            <p className="text-sm text-gray-600">No listed pins on this origin.</p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading applications…</p>
        ) : applications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No applications</h2>
            <p className="text-gray-600">Juvay does not invent drivers.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 px-4 font-bold text-gray-900">Name</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Phone</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Services</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Approved</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Listed</th>
                  <th className="py-3 px-4 font-bold text-gray-900">School-run</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Pin</th>
                  <th className="py-3 px-4 font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-semibold text-gray-900">{row.name}</td>
                    <td className="py-3 px-4 text-gray-700">{row.phone}</td>
                    <td className="py-3 px-4 text-gray-700">{(row.jobTypes || []).join(', ') || 'rideshare'}</td>
                    <td className="py-3 px-4">{row.approved ? 'yes' : 'no'}</td>
                    <td className="py-3 px-4">{row.listed ? 'yes' : 'no'}</td>
                    <td className="py-3 px-4">{row.schoolRunApproved ? 'yes' : row.schoolRunRequested ? 'requested' : 'no'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {row.listed && row.pinLat != null && row.pinLng != null
                        ? `${row.pinLat}, ${row.pinLng}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2 min-w-[160px]">
                        <button
                          type="button"
                          disabled={busyId === row.id || row.approved === true}
                          onClick={() => act(row.id, adminApproveDrive)}
                          className="min-h-[40px] px-3 rounded-lg bg-stone-900 text-white font-semibold disabled:opacity-40"
                        >
                          Approve KYC
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => act(row.id, adminSubscribeDrive)}
                          className="min-h-[40px] px-3 rounded-lg border border-gray-900 font-semibold disabled:opacity-40"
                        >
                          Confirm subscription
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id || row.schoolRunApproved === true}
                          onClick={() => act(row.id, adminSchoolRunDrive)}
                          className="min-h-[40px] px-3 rounded-lg border border-gray-900 font-semibold disabled:opacity-40"
                        >
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
