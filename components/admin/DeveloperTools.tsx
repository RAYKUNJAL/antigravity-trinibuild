import React, { useState, useEffect } from 'react';
import { Terminal, Play, Database, Server, RefreshCw } from 'lucide-react';
import { siteGuardian } from '../../services/siteGuardianService';
import { supabase } from '../../services/supabaseClient';

export const DeveloperTools: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState<string>('Ready for commands...');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        // Fetch recent logs from automations + alerts combined
        const { data: autoLogs } = await supabase.from('automation_logs').select('*').limit(10).order('executed_at', { ascending: false });
        const { data: alerts } = await supabase.from('site_alerts').select('*').limit(10).order('created_at', { ascending: false });

        const combined = [
            ...(autoLogs || []).map(l => ({ time: l.executed_at, level: 'INFO', msg: `Automation: ${l.automation_name} - ${l.status}` })),
            ...(alerts || []).map(a => ({ time: a.created_at, level: a.severity.toUpperCase(), msg: `Alert: ${a.title}` }))
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        setLogs(combined);
    };

    const runHealthCheck = async () => {
        setLoading(true);
        setOutput('Running system diagnostics...');
        try {
            const results = await siteGuardian.runHealthChecks();
            setOutput(JSON.stringify(results, null, 2));
            fetchLogs(); // Refresh logs as health check might gen alerts
        } catch (error) {
            setOutput('Error running diagnostics: ' + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Terminal className="h-7 w-7 text-gray-700 dark:text-gray-300" />
                    Developer Console
                </h1>
                <p className="text-gray-500">System diagnostics and maintenance tools</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={runHealthCheck} disabled={loading} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-all text-left group">
                    <ActivityIcon icon={<Play />} color="blue" />
                    <h3 className="font-bold mt-2">Run Diagnostics</h3>
                    <p className="text-xs text-gray-500 mt-1">Execute full system health check</p>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all text-left group">
                    <ActivityIcon icon={<Database />} color="purple" />
                    <h3 className="font-bold mt-2">Vacuum Database</h3>
                    <p className="text-xs text-gray-500 mt-1">Optimize DB performance</p>
                </button>
                <button className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-all text-left group">
                    <ActivityIcon icon={<Server />} color="green" />
                    <h3 className="font-bold mt-2">Clear Cache</h3>
                    <p className="text-xs text-gray-500 mt-1">Flush system caches (Redis)</p>
                </button>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm h-96 overflow-y-auto border border-gray-700">
                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                    <span className="text-gray-400">System Output</span>
                    <button onClick={fetchLogs} title="Refresh Logs" className="text-gray-500 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
                </div>

                {loading && <div className="text-yellow-500 mb-2">Executing command...</div>}

                <div className="space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-gray-500 whitespace-nowrap">{new Date(log.time).toLocaleTimeString()}</span>
                            <span className={`${log.level === 'INFO' ? 'text-blue-400' : 'text-red-400'} w-16`}>{log.level}</span>
                            <span className="text-gray-300">{log.msg}</span>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-600">No logs available.</div>}
                    <div className="mt-4 pt-4 border-t border-gray-800 text-green-400">
                        {output !== 'Ready for commands...' && output.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActivityIcon: React.FC<{ icon: React.ReactNode; color: string }> = ({ icon, color }) => (
    <div className={`p-2 rounded-lg bg-${color}-500/10 text-${color}-500 w-fit group-hover:bg-${color}-500 group-hover:text-white transition-colors`}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-5 w-5" }) : icon}
    </div>
);

export default DeveloperTools;
