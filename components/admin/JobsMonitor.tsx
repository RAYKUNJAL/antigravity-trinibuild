import React from 'react';
import { Briefcase, TrendingUp, Users, DollarSign, AlertCircle, Clock } from 'lucide-react';

export const JobsMonitor: React.FC = () => {
    const stats = {
        activeJobs: 234,
        newToday: 18,
        applications: 567,
        avgSalary: 8500,
        expiringSoon: 12,
        highDemand: 45
    };

    const topRoles = [
        { role: 'Software Developer', listings: 34, applications: 156 },
        { role: 'Customer Service', listings: 28, applications: 89 },
        { role: 'Driver', listings: 23, applications: 67 },
        { role: 'Sales Representative', listings: 19, applications: 45 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="h-7 w-7 text-blue-500" />
                    Jobs Monitor
                </h1>
                <p className="text-gray-500">Track job listings and application metrics</p>
            </div>

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
                                <p className="text-xs text-gray-500">{role.applications} applications</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
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
