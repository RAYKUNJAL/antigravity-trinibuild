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

export const TrustSafety: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'flagged' | 'fraud' | 'scores'>('flagged');

    const flaggedItems: FlaggedItem[] = [
        { id: '1', type: 'listing', title: 'Suspicious rental listing', reason: 'Price too low', severity: 'high', status: 'pending', reportedAt: '2024-12-05' },
        { id: '2', type: 'user', title: 'Multiple accounts detected', reason: 'Same phone on 3 accounts', severity: 'critical', status: 'pending', reportedAt: '2024-12-05' },
        { id: '3', type: 'message', title: 'Phishing attempt', reason: 'External suspicious link', severity: 'high', status: 'pending', reportedAt: '2024-12-05' },
    ];

    const stats = { pending: 5, critical: 2, resolved: 12 };

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

            {activeTab === 'flagged' && (
                <div className="space-y-3">
                    {flaggedItems.map(item => (
                        <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 border-l-4 ${item.severity === 'critical' ? 'border-l-red-500' : item.severity === 'high' ? 'border-l-orange-500' : 'border-l-yellow-500'
                            }`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.reason}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs ${item.severity === 'critical' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'
                                    }`}>{item.severity.toUpperCase()}</span>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">Approve</button>
                                <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">Remove</button>
                                <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm">Dismiss</button>
                            </div>
                        </div>
                    ))}
                </div>
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
