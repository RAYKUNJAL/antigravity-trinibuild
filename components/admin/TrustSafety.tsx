import React, { useState } from 'react';
import { Shield, AlertTriangle, Flag, UserX, Eye, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

interface FlaggedItem {
    id: string;
    type: 'user' | 'listing' | 'message';
    title: string;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'resolved';
    reportedAt: string;
}

import { supabase } from '../../services/supabaseClient';

export const TrustSafety: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'flagged' | 'fraud' | 'scores'>('flagged');
    const [alerts, setAlerts] = useState<any[]>([]);
    const [stats, setStats] = useState({ pending: 0, critical: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('site_alerts')
                .select('*')
                .order('created_at', { ascending: false });

            const pending = data?.filter(a => a.status === 'new' || a.status === 'pending') || [];
            const resolved = data?.filter(a => a.status === 'resolved') || [];
            const critical = pending.filter(a => a.severity === 'critical' || a.severity === 'high');

            setAlerts(pending);
            setStats({
                pending: pending.length,
                critical: critical.length,
                resolved: resolved.length
            });
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'resolve' | 'dismiss') => {
        try {
            await supabase
                .from('site_alerts')
                .update({
                    status: action === 'resolve' ? 'resolved' : 'ignored',
                    resolved_at: new Date().toISOString()
                })
                .eq('id', id);

            // Refresh
            fetchAlerts();
        } catch (error) {
            console.error('Error updating alert:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="h-7 w-7 text-green-500" />
                    Trust & Safety
                </h1>
                <p className="text-gray-500">Platform moderation and fraud prevention</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <Clock className="h-5 w-5 text-yellow-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-500/50">
                    <AlertTriangle className="h-5 w-5 text-red-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.critical}</p>
                    <p className="text-xs text-gray-500">Critical</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{stats.resolved}</p>
                    <p className="text-xs text-gray-500">Resolved Today</p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['flagged', 'fraud', 'scores'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 border-b-2 ${activeTab === tab ? 'border-green-500 text-green-500' : 'border-transparent text-gray-500'}`}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? <div className="text-center py-10">Loading alerts...</div> : (
                activeTab === 'flagged' && (
                    <div className="space-y-3">
                        {alerts.map(item => (
                            <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 ${item.severity === 'critical' ? 'border-l-red-500' : item.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                        <p className="text-sm text-gray-500">{item.message || item.reason}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs ${item.severity === 'critical' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                                        }`}>{item.severity?.toUpperCase() || 'MEDIUM'}</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleAction(item.id, 'resolve')} className="px-3 py-1 bg-green-500 text-white rounded text-sm">Resolve</button>
                                    <button onClick={() => handleAction(item.id, 'dismiss')} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Dismiss</button>
                                </div>
                            </div>
                        ))}
                        {alerts.length === 0 && <div className="text-center py-10 text-gray-500">No pending alerts. Safe travels!</div>}
                    </div>
                )
            )}

            {activeTab !== 'flagged' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{activeTab === 'fraud' ? 'Fraud Detection' : 'Trust Scores'}</h3>
                    <p className="text-gray-500">Coming soon...</p>
                </div>
            )}
        </div>
    );
};

export default TrustSafety;
