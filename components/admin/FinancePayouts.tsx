import React, { useState } from 'react';
import { DollarSign, TrendingUp, Download, CreditCard, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';

interface RevenueStream {
    name: string;
    amount: number;
    change: number;
    icon: React.ReactNode;
}

export const FinancePayouts: React.FC = () => {
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

    const streams: RevenueStream[] = [
        { name: 'Subscriptions', amount: 12450, change: 12.5, icon: <CreditCard className="h-5 w-5" /> },
        { name: 'Ad Revenue', amount: 8320, change: 8.2, icon: <TrendingUp className="h-5 w-5" /> },
        { name: 'Marketplace Fees', amount: 6780, change: -3.1, icon: <DollarSign className="h-5 w-5" /> },
        { name: 'Rideshare Fees', amount: 4560, change: 15.7, icon: <DollarSign className="h-5 w-5" /> },
        { name: 'Ticketing Fees', amount: 3890, change: 22.4, icon: <DollarSign className="h-5 w-5" /> },
        { name: 'Job Posting Fees', amount: 2340, change: 5.3, icon: <DollarSign className="h-5 w-5" /> },
    ];

    const totalRevenue = streams.reduce((sum, s) => sum + s.amount, 0);
    const pendingPayouts = 15670;
    const processedToday = 4320;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="h-7 w-7 text-green-500" />
                        Finance & Payouts
                    </h1>
                    <p className="text-gray-500">Revenue streams and payout management</p>
                </div>
                <div className="flex gap-2">
                    {(['today', 'week', 'month', 'year'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${period === p ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                    <p className="text-green-100 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
                    <p className="text-green-100 text-sm mt-2 flex items-center gap-1">
                        <ArrowUpRight className="h-4 w-4" /> +12.5% vs last {period}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 text-sm">Pending Payouts</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${pendingPayouts.toLocaleString()}</p>
                    <p className="text-orange-500 text-sm mt-2">23 requests pending</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 text-sm">Processed Today</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${processedToday.toLocaleString()}</p>
                    <p className="text-green-500 text-sm mt-2">8 payouts completed</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-green-500" />
                        Revenue Streams
                    </h2>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                        <Download className="h-4 w-4" /> Export
                    </button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {streams.map((stream, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">{stream.icon}</div>
                                <span className="font-medium text-gray-900 dark:text-white">{stream.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">${stream.amount.toLocaleString()}</p>
                                <p className={`text-sm flex items-center justify-end gap-1 ${stream.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {stream.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {Math.abs(stream.change)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinancePayouts;
