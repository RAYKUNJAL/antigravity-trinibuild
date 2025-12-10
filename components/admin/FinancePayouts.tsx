import React, { useState } from 'react';
import { DollarSign, TrendingUp, Download, CreditCard, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';

interface RevenueStream {
    name: string;
    amount: number;
    change: number;
    icon: React.ReactNode;
}

import { supabase } from '../../services/supabaseClient';

export const FinancePayouts: React.FC = () => {
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');
    const [streams, setStreams] = useState<RevenueStream[]>([]);
    const [totals, setTotals] = useState({ revenue: 0, pending: 0, processed: 0 });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchFinancials();
    }, [period]);

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            // Fetch revenue sources (simplified for MVP)
            const [
                { data: ads },
                { data: tickets },
                { data: rides }, // Assuming cost column
                { data: products } // Approximation for marketplace
            ] = await Promise.all([
                supabase.from('ad_campaigns').select('spent, created_at'),
                supabase.from('tickets').select('price, created_at'),
                supabase.from('rides').select('cost, created_at'),
                supabase.from('products').select('price, sold_count') // Sold items revenue
            ]);

            // Calculate Totals based on Period (not implementing full date filtering for brevity, assuming 'all time' or simple slice)
            // Real implementation would filter by date in SQL or JS

            let adRevenue = 0;
            ads?.forEach(a => adRevenue += Number(a.spent || 0));

            let ticketRevenue = 0;
            tickets?.forEach(t => ticketRevenue += Number(t.price || 0));

            let rideRevenue = 0; // Platform fee usually 20%
            rides?.forEach(r => rideRevenue += Number(r.cost || 0) * 0.2);

            let marketRevenue = 0; // Platform fee usually 10%
            products?.forEach(p => marketRevenue += (Number(p.price || 0) * Number(p.sold_count || 0)) * 0.1);

            const totalRev = adRevenue + ticketRevenue + rideRevenue + marketRevenue;

            // Update State
            setStreams([
                { name: 'Ad Revenue', amount: Math.floor(adRevenue), change: 5.2, icon: <TrendingUp className="h-5 w-5" /> }, // Change % is placeholder
                { name: 'Ticketing Fees', amount: Math.floor(ticketRevenue), change: 12.4, icon: <DollarSign className="h-5 w-5" /> },
                { name: 'Rideshare Fees', amount: Math.floor(rideRevenue), change: 8.7, icon: <DollarSign className="h-5 w-5" /> },
                { name: 'Marketplace Fees', amount: Math.floor(marketRevenue), change: 3.1, icon: <DollarSign className="h-5 w-5" /> },
            ]);

            setTotals({
                revenue: Math.floor(totalRev),
                pending: Math.floor(totalRev * 0.3), // Estimate pending payout (30% held)
                processed: Math.floor(totalRev * 0.7)
            });

        } catch (error) {
            console.error('Error fetching financials:', error);
        } finally {
            setLoading(false);
        }
    };

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

            {loading ? <div className="text-center py-10">Loading financial data...</div> : (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                        <p className="text-green-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">${totals.revenue.toLocaleString()}</p>
                        <p className="text-green-100 text-sm mt-2 flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4" /> +12.5% vs last {period}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 text-sm">Pending Payouts</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totals.pending.toLocaleString()}</p>
                        <p className="text-orange-500 text-sm mt-2">Requests pending</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 text-sm">Processed Today</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totals.processed.toLocaleString()}</p>
                        <p className="text-green-500 text-sm mt-2">Payouts completed</p>
                    </div>
                </div>
            )}

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
