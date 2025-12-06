import React from 'react';
import { Zap, Plus, Play, Pause, Trash2, Settings } from 'lucide-react';

export const Automations: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Automations</h1>
                    <p className="text-gray-500">Configure automated workflows and triggers</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-trini-red text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Plus className="h-5 w-5" />
                    Create Workflow
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Automation Card 1 */}
                <AutomationCard
                    title="New User Welcome"
                    description="Send welcome email sequence when a user registers"
                    active={true}
                    triggers={['User Signup']}
                    actions={['Send Email', 'Add to CRM']}
                />

                {/* Automation Card 2 */}
                <AutomationCard
                    title="Abandoned Cart Recovery"
                    description="Remind users about items left in their cart after 1 hour"
                    active={true}
                    triggers={['Cart Abandoned']}
                    actions={['Wait 1h', 'Send Push Notification']}
                />

                {/* Automation Card 3 */}
                <AutomationCard
                    title="Driver Approval"
                    description="Auto-approve drivers with clean background checks"
                    active={false}
                    triggers={['Document Verified']}
                    actions={['Update Status', 'Notify User']}
                />
            </div>
        </div>
    );
};

const AutomationCard: React.FC<{
    title: string;
    description: string;
    active: boolean;
    triggers: string[];
    actions: string[];
}> = ({ title, description, active, triggers, actions }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg ${active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                <Zap className="h-6 w-6" />
            </div>
            <div className="flex gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Settings className="h-4 w-4" />
                </button>
            </div>
        </div>

        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4 h-10">{description}</p>

        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold uppercase tracking-wider">Triggers:</span>
                <div className="flex gap-1 flex-wrap">
                    {triggers.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100">{t}</span>
                    ))}
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold uppercase tracking-wider">Actions:</span>
                <div className="flex gap-1 flex-wrap">
                    {actions.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">{a}</span>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {active ? 'Active' : 'Paused'}
            </span>
            <span className="text-xs text-gray-400">Last run: 2h ago</span>
        </div>
    </div>
);
