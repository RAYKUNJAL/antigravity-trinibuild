import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Zap, Activity, CheckCircle, XCircle } from 'lucide-react';

export const Automations: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('automation_logs')
                .select('*')
                .order('executed_at', { ascending: false })
                .limit(50);
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-7 w-7 text-yellow-500" />
                    Automations & Workflows
                </h1>
                <p className="text-gray-500">Monitor automated system tasks and triggers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><Activity className="h-4 w-4" /> System Health Auto-Check</h3>
                    <p className="text-sm text-green-500">Active • Every 5 mins</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Ad Campaign Optimizer</h3>
                    <p className="text-sm text-green-500">Active • Daily</p>
                </div>
            </div>

            {loading ? <div className="text-center py-10">Loading logs...</div> : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-medium bg-gray-50 dark:bg-gray-900">
                        Execution History
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm">{log.automation_name}</p>
                                    <p className="text-xs text-gray-400">{new Date(log.executed_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">{log.details}</span>
                                    {log.status === 'success' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No execution logs found yet.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Automations;
