import React from 'react';
import { Code, Key, Webhook, Bug, Database, Settings, GitBranch, Terminal } from 'lucide-react';

export const DeveloperTools: React.FC = () => {
    const tools = [
        { name: 'API Key Management', description: 'Manage API keys and access tokens', icon: <Key className="h-6 w-6" />, color: 'blue' },
        { name: 'Webhook Logs', description: 'View incoming and outgoing webhooks', icon: <Webhook className="h-6 w-6" />, color: 'purple' },
        { name: 'Error Logs', description: 'Track and debug application errors', icon: <Bug className="h-6 w-6" />, color: 'red' },
        { name: 'Database Browser', description: 'Query and explore database tables', icon: <Database className="h-6 w-6" />, color: 'green' },
        { name: 'System Flags', description: 'Toggle feature flags and settings', icon: <Settings className="h-6 w-6" />, color: 'orange' },
        { name: 'Deployments', description: 'View deployment history and status', icon: <GitBranch className="h-6 w-6" />, color: 'cyan' },
        { name: 'AI Model Config', description: 'Configure AI model settings', icon: <Terminal className="h-6 w-6" />, color: 'pink' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Code className="h-7 w-7 text-purple-500" />
                    Developer Tools
                </h1>
                <p className="text-gray-500">Advanced tools for platform development and debugging</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tools.map((tool, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                        <div className={`p-3 bg-${tool.color}-500/10 rounded-xl w-fit mb-4 group-hover:bg-${tool.color}-500/20`}>
                            <div className={`text-${tool.color}-500`}>{tool.icon}</div>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{tool.name}</h3>
                        <p className="text-sm text-gray-500">{tool.description}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Terminal className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-mono text-sm">Console</span>
                </div>
                <div className="font-mono text-sm text-gray-300 space-y-1">
                    <p><span className="text-green-400">$</span> TriniBuild Command Center v2.0</p>
                    <p><span className="text-green-400">$</span> All systems operational</p>
                    <p><span className="text-green-400">$</span> AI Services: Groq Llama 3.3-70B</p>
                    <p><span className="text-green-400">$</span> Database: Supabase PostgreSQL</p>
                    <p className="text-gray-500"># Ready for commands...</p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperTools;
