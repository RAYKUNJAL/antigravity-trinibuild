import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../services/supabaseClient';
import { Activity, MapPin, TrendingUp, Calendar } from 'lucide-react';

interface EventRow {
  id: string;
  event_type: string;
  event_category: string | null;
  properties: Record<string, any> | null;
  island: string | null;
  page_url: string | null;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
}

interface DailyCount {
  date: string;
  label: string;
  count: number;
}

export const EventsAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [topEventTypes, setTopEventTypes] = useState<{ type: string; count: number }[]>([]);
  const [topIslands, setTopIslands] = useState<{ island: string; count: number }[]>([]);
  const [dailyData, setDailyData] = useState<DailyCount[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
        const startWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();

        const [todayQ, weekQ, monthQ, recentQ] = await Promise.all([
          supabase.from('platform_events').select('id', { count: 'exact', head: true }).gte('created_at', startToday),
          supabase.from('platform_events').select('id', { count: 'exact', head: true }).gte('created_at', startWeek),
          supabase.from('platform_events').select('id', { count: 'exact', head: true }).gte('created_at', startMonth),
          supabase.from('platform_events').select('id, event_type, event_category, properties, island, page_url, created_at, user_id, session_id').order('created_at', { ascending: false }).limit(20),
        ]);

        if (cancelled) return;

        if (todayQ.error) throw todayQ.error;
        if (weekQ.error) throw weekQ.error;
        if (monthQ.error) throw monthQ.error;
        if (recentQ.error) throw recentQ.error;

        setTodayCount(todayQ.count ?? 0);
        setWeekCount(weekQ.count ?? 0);
        setMonthCount(monthQ.count ?? 0);
        setRecentEvents((recentQ.data ?? []) as unknown as EventRow[]);

        // Top event types — fetch last 1000 rows and aggregate client-side
        // (Supabase doesn't support GROUP BY directly via the JS client)
        const { data: aggRows, error: aggErr } = await supabase
          .from('platform_events')
          .select('event_type, island, created_at')
          .gte('created_at', startWeek)
          .order('created_at', { ascending: false })
          .limit(2000);

        if (aggErr) throw aggErr;
        if (!cancelled && aggRows) {
          const typeMap = new Map<string, number>();
          const islandMap = new Map<string, number>();
          const dayMap = new Map<string, number>();

          // Build last 7 days labels
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            dayMap.set(key, 0);
          }

          for (const r of aggRows) {
            const t = (r as any).event_type || 'unknown';
            typeMap.set(t, (typeMap.get(t) ?? 0) + 1);
            const isl = (r as any).island || 'unknown';
            islandMap.set(isl, (islandMap.get(isl) ?? 0) + 1);
            const ca = (r as any).created_at;
            if (ca) {
              const d = new Date(ca);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
            }
          }

          setTopEventTypes(
            Array.from(typeMap.entries())
              .map(([type, count]) => ({ type, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          );
          setTopIslands(
            Array.from(islandMap.entries())
              .map(([island, count]) => ({ island, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          );

          const daily: DailyCount[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            daily.push({ date: key, label, count: dayMap.get(key) ?? 0 });
          }
          setDailyData(daily);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load event analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const maxTypeCount = useMemo(() => Math.max(1, ...topEventTypes.map(t => t.count)), [topEventTypes]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-24 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-semibold">⚠️ {error}</p>
          <p className="text-sm text-gray-500 mt-2">Make sure the platform_events table exists and RLS allows reads.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Analytics</h1>
          <p className="text-sm text-gray-500">Platform-wide event tracking — data foundation for the ad network</p>
        </div>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Events Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{todayCount.toLocaleString()}</p>
            </div>
            <Calendar className="h-8 w-8 text-indigo-100" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{weekCount.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-100" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{monthCount.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-100" />
          </div>
        </div>
      </div>

      {/* Daily chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Events — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb', fontSize: '13px' }}
              labelStyle={{ fontWeight: 600 }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Events" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top event types + islands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" /> Top 5 Event Types
          </h2>
          {topEventTypes.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No events yet</p>
          ) : (
            <div className="space-y-3">
              {topEventTypes.map((t, i) => (
                <div key={t.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      <span className="inline-block w-6 text-gray-400">#{i + 1}</span>
                      {t.type}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{t.count.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(t.count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" /> Top 5 Islands
          </h2>
          {topIslands.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No events yet</p>
          ) : (
            <div className="space-y-3">
              {topIslands.map((isl, i) => {
                const maxC = Math.max(1, ...topIslands.map(x => x.count));
                return (
                  <div key={isl.island}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">
                        <span className="inline-block w-6 text-gray-400">#{i + 1}</span>
                        {isl.island}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{isl.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${(isl.count / maxC) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent events table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Events</h2>
          <p className="text-xs text-gray-500">Last 20 events recorded</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Island</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Page</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No events recorded yet
                  </td>
                </tr>
              ) : (
                recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{ev.event_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{ev.event_category || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{ev.island || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{ev.page_url || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {ev.user_id ? `${ev.user_id.slice(0, 8)}…` : <span className="text-gray-400">guest</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventsAnalytics;
