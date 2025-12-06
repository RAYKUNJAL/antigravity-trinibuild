import React from 'react';
import { BarChart3, Download, Calendar, TrendingUp, Users, DollarSign, PieChart, FileText } from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
    const reports = [
        { name: 'Daily Activity Report', description: 'User activity and engagement metrics', icon: <TrendingUp />, lastGenerated: '2024-12-05' },
        { name: 'Revenue Breakdown', description: 'Financial performance by category', icon: <DollarSign />, lastGenerated: '2024-12-05' },
        { name: 'User Lifecycle', description: 'Signup to conversion funnel analysis', icon: <Users />, lastGenerated: '2024-12-04' },
        { name: 'Geo Heatmaps', description: 'Activity distribution by location', icon: <PieChart />, lastGenerated: '2024-12-04' },
        { name: 'Keyword Rankings', description: 'SEO performance and search trends', icon: <BarChart3 />, lastGenerated: '2024-12-05' },
        { name: 'Vendor Performance', description: 'Top vendors and store metrics', icon: <FileText />, lastGenerated: '2024-12-03' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="h-7 w-7 text-indigo-500" />
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500">Generate and download platform reports</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 90 Days</option>
                        <option>This Year</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
                        <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-4">
                            <div className="text-indigo-500 [&>svg]:h-6 [&>svg]:w-6">{report.icon}</div>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{report.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {report.lastGenerated}
                            </span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded text-sm hover:bg-gray-200">View</button>
                                <button className="px-3 py-1.5 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4">Export Options</h2>
                <div className="flex gap-4">
                    <button className="flex-1 py-3 bg-green-500/10 text-green-600 rounded-lg font-medium hover:bg-green-500/20">CSV</button>
                    <button className="flex-1 py-3 bg-red-500/10 text-red-600 rounded-lg font-medium hover:bg-red-500/20">PDF</button>
                    <button className="flex-1 py-3 bg-blue-500/10 text-blue-600 rounded-lg font-medium hover:bg-blue-500/20">JSON</button>
                </div>
            </div>
        </div>
    );
};

export default ReportsAnalytics;
