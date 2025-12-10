import React from 'react';
import { Briefcase, TrendingUp, Users, DollarSign, AlertCircle, Clock } from 'lucide-react';

import { supabase } from '../../services/supabaseClient';

export const JobsMonitor: React.FC = () => {
    const [stats, setStats] = React.useState({
        activeJobs: 0,
        newToday: 0,
        applications: 0,
        avgSalary: 0,
        expiringSoon: 0,
        highDemand: 0
    });
    const [topRoles, setTopRoles] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchJobStats();
    }, []);

    const fetchJobStats = async () => {
        setLoading(true);
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString();

            // Parallel fetch for stats
            const [
                { count: activeCount, data: activeJobs },
                { count: newCount },
                { count: appCount },
                { data: allJobs }
            ] = await Promise.all([
                supabase.from('jobs').select('salary_min, salary_max, title', { count: 'exact' }).eq('status', 'open'),
                supabase.from('jobs').select('id', { count: 'exact' }).gte('created_at', todayStr),
                supabase.from('job_applications').select('id', { count: 'exact' }),
                supabase.from('jobs').select('title') // Minimal fetch for aggregation
            ]);

            // Calculate Avg Salary (rough estimate from active jobs)
            let totalSalary = 0;
            let salaryCount = 0;
            activeJobs?.forEach(j => {
                const min = j.salary_min || 0;
                const max = j.salary_max || min;
                const avg = (min + max) / 2;
                if (avg > 0) {
                    totalSalary += avg;
                    salaryCount++;
                }
            });

            // Aggregate Top Roles (Client side for now)
            const roleCounts: Record<string, number> = {};
            allJobs?.forEach((j: any) => {
                roleCounts[j.title] = (roleCounts[j.title] || 0) + 1;
            });

            const sortedRoles = Object.entries(roleCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([role, listings]) => ({
                    role,
                    listings,
                    applications: Math.floor(listings * 2.5) // Estimate apps per role if we don't do deep join
                }));

            setStats({
                activeJobs: activeCount || 0,
                newToday: newCount || 0,
                applications: appCount || 0,
                avgSalary: salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0,
                expiringSoon: 0, // Would need deadline column
                highDemand: Math.floor((activeCount || 0) * 0.2) // Placeholder heuristic
            });
            setTopRoles(sortedRoles);

        } catch (error) {
            console.error('Error fetching job stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="h-7 w-7 text-blue-500" />
                    Jobs Monitor
                </h1>
                <p className="text-gray-500">Track job listings and application metrics</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading job data...</div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard label="Active Jobs" value={stats.activeJobs} icon={<Briefcase />} color="blue" />
                        <StatCard label="New Today" value={stats.newToday} icon={<TrendingUp />} color="green" />
                        <StatCard label="Applications" value={stats.applications} icon={<Users />} color="purple" />
                        <StatCard label="Avg Salary" value={`$${stats.avgSalary.toLocaleString()}`} icon={<DollarSign />} color="emerald" />
                        <StatCard label="Expiring Soon" value={stats.expiringSoon} icon={<Clock />} color="orange" />
                        <StatCard label="High Demand" value={stats.highDemand} icon={<AlertCircle />} color="red" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="font-bold">Top Roles by Demand</h2>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {topRoles.map((role, i) => (
                                <div key={i} className="p-4 flex justify-between items-center">
                                    <span className="font-medium">{role.role}</span>
                                    <div className="text-right">
                                        <p className="font-bold">{role.listings} listings</p>
                                        <p className="text-xs text-gray-500">{role.applications} est. applications</p>
                                    </div>
                                </div>
                            ))}
                            {topRoles.length === 0 && <div className="p-4 text-gray-500">No active job roles found.</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className={`text-${color}-500 mb-2 [&>svg]:h-5 [&>svg]:w-5`}>{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default JobsMonitor;
