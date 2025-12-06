import React from 'react';
import { Server, Database, Cpu, Wifi, HardDrive, RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: string;
    uptime?: string;
    details: string;
}

export const SystemHealth: React.FC = () => {
    const healthChecks: HealthCheck[] = [
        { name: 'Database (Supabase)', status: 'healthy', latency: '12ms', uptime: '99.99%', details: 'PostgreSQL running normally' },
        { name: 'API Server', status: 'healthy', latency: '45ms', uptime: '99.95%', details: 'All endpoints responding' },
        { name: 'Storage (Supabase)', status: 'healthy', latency: '89ms', uptime: '99.98%', details: 'File uploads working' },
        { name: 'AI Services (Groq)', status: 'healthy', latency: '234ms', uptime: '99.9%', details: 'Llama 3.3-70B active' },
        { name: 'Edge Functions', status: 'degraded', latency: '456ms', uptime: '98.5%', details: 'High latency detected' },
        { name: 'CDN', status: 'healthy', latency: '23ms', uptime: '99.99%', details: 'Global distribution active' },
    ];

    const metrics = {
        apiCalls: '1.2M',
        avgLatency: '87ms',
        errorRate: '0.02%',
        activeConnections: 342
    };

    const statusIcon = (status: string) => {
        if (status === 'healthy') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'degraded') return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    const statusBg = (status: string) => {
        if (status === 'healthy') return 'bg-green-500/10 border-green-500/30';
        if (status === 'degraded') return 'bg-yellow-500/10 border-yellow-500/30';
        return 'bg-red-500/10 border-red-500/30';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Server className="h-7 w-7 text-blue-500" />
                        System Health
                    </h1>
                    <p className="text-gray-500">Monitor platform infrastructure and performance</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <RefreshCw className="h-5 w-5" />
                    Refresh All
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <Cpu className="h-5 w-5 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{metrics.apiCalls}</p>
                    <p className="text-xs text-gray-500">API Calls (24h)</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <Wifi className="h-5 w-5 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{metrics.avgLatency}</p>
                    <p className="text-xs text-gray-500">Avg Latency</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">{metrics.errorRate}</p>
                    <p className="text-xs text-gray-500">Error Rate</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <Database className="h-5 w-5 text-purple-500 mb-2" />
                    <p className="text-2xl font-bold">{metrics.activeConnections}</p>
                    <p className="text-xs text-gray-500">Active Connections</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthChecks.map((check, i) => (
                    <div key={i} className={`rounded-xl p-4 border ${statusBg(check.status)}`}>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white">{check.name}</h3>
                            {statusIcon(check.status)}
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{check.details}</p>
                        <div className="flex gap-4 text-xs">
                            {check.latency && <span className="text-gray-500">Latency: <span className="text-gray-900 dark:text-white font-medium">{check.latency}</span></span>}
                            {check.uptime && <span className="text-gray-500">Uptime: <span className="text-gray-900 dark:text-white font-medium">{check.uptime}</span></span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemHealth;
