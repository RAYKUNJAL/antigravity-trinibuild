import React, { useState } from 'react';
import {
    FileText,
    Sparkles,
    BookOpen,
    Image,
    Mail,
    Share2,
    Search,
    PenTool,
    Calendar,
    Play,
    Pause,
    Clock,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Settings
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface AITool {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    status: 'ready' | 'running' | 'disabled';
}

interface ScheduledTask {
    id: string;
    name: string;
    schedule: string;
    lastRun: string;
    nextRun: string;
    status: 'active' | 'paused' | 'error';
    successRate: number;
}

// ============================================
// COMPONENT
// ============================================

export const ContentAICenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tools' | 'scheduled' | 'history'>('tools');

    const aiTools: AITool[] = [
        { id: 'blog_writer', name: 'AI Blog Writer', description: 'Generate SEO-optimized blog posts for any topic or location', icon: <BookOpen className="h-6 w-6" />, status: 'ready' },
        { id: 'listing_optimizer', name: 'Listing Optimizer', description: 'Enhance product and service listings with better copy', icon: <PenTool className="h-6 w-6" />, status: 'ready' },
        { id: 'promo_copywriter', name: 'Promo Copywriter', description: 'Create compelling promotional content and deals', icon: <Sparkles className="h-6 w-6" />, status: 'ready' },
        { id: 'email_generator', name: 'Email Sequence', description: 'Generate automated email marketing sequences', icon: <Mail className="h-6 w-6" />, status: 'ready' },
        { id: 'social_posts', name: 'Social Media Posts', description: 'Create engaging posts for all social platforms', icon: <Share2 className="h-6 w-6" />, status: 'ready' },
        { id: 'landing_builder', name: 'Landing Page Builder', description: 'Generate micro landing pages for keywords', icon: <FileText className="h-6 w-6" />, status: 'ready' },
        { id: 'seo_meta', name: 'SEO Title & Meta', description: 'Generate optimized titles and meta descriptions', icon: <Search className="h-6 w-6" />, status: 'ready' },
        { id: 'image_prompt', name: 'Image Prompt Creator', description: 'Generate prompts for AI image generation', icon: <Image className="h-6 w-6" />, status: 'ready' },
    ];

    const scheduledTasks: ScheduledTask[] = [
        { id: '1', name: 'Daily Blog Posts', schedule: 'Every day at 6:00 AM', lastRun: '2024-12-05 06:00', nextRun: '2024-12-06 06:00', status: 'active', successRate: 98 },
        { id: '2', name: 'Weekly Topic Clusters', schedule: 'Every Monday at 8:00 AM', lastRun: '2024-12-02 08:00', nextRun: '2024-12-09 08:00', status: 'active', successRate: 100 },
        { id: '3', name: 'Hourly Keyword Updates', schedule: 'Every hour', lastRun: '2024-12-05 21:00', nextRun: '2024-12-05 22:00', status: 'active', successRate: 95 },
        { id: '4', name: 'Auto Link Insertion', schedule: 'Every 4 hours', lastRun: '2024-12-05 20:00', nextRun: '2024-12-06 00:00', status: 'paused', successRate: 87 },
        { id: '5', name: 'Content Audit & Fix', schedule: 'Every Sunday at 2:00 AM', lastRun: '2024-12-01 02:00', nextRun: '2024-12-08 02:00', status: 'active', successRate: 92 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="h-7 w-7 text-purple-500" />
                        Content AI Center
                    </h1>
                    <p className="text-gray-500">AI-powered content creation and automation suite</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                    <Settings className="h-5 w-5" />
                    Configure AI
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Posts Generated Today" value="12" color="purple" />
                <StatCard label="Scheduled Tasks" value={scheduledTasks.filter(t => t.status === 'active').length.toString()} color="blue" />
                <StatCard label="Success Rate" value="96%" color="green" />
                <StatCard label="AI Credits Used" value="2,450" color="orange" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['tools', 'scheduled', 'history'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 border-b-2 transition-colors ${activeTab === tab
                                ? 'border-purple-500 text-purple-500'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab === 'tools' ? 'AI Tools' : tab === 'scheduled' ? 'Scheduled Automation' : 'History'}
                    </button>
                ))}
            </div>

            {/* Tools Grid */}
            {activeTab === 'tools' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {aiTools.map(tool => (
                        <div
                            key={tool.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-500/50 transition-all cursor-pointer group"
                        >
                            <div className="p-3 bg-purple-500/10 rounded-xl w-fit mb-3 group-hover:bg-purple-500/20 transition-colors">
                                <div className="text-purple-500">{tool.icon}</div>
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{tool.name}</h3>
                            <p className="text-sm text-gray-500 mb-3">{tool.description}</p>
                            <button className="w-full py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
                                <Play className="h-4 w-4" />
                                Launch
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Scheduled Automation */}
            {activeTab === 'scheduled' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Success</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {scheduledTasks.map(task => (
                                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-purple-500" />
                                            <span className="font-medium text-gray-900 dark:text-white">{task.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{task.schedule}</td>
                                    <td className="px-4 py-4 text-sm text-gray-500">{task.lastRun}</td>
                                    <td className="px-4 py-4 text-sm text-gray-500">{task.nextRun}</td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={task.status} />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-right">
                                        <span className={task.successRate >= 90 ? 'text-green-500' : 'text-yellow-500'}>
                                            {task.successRate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2">
                                            {task.status === 'active' ? (
                                                <button className="p-1.5 text-yellow-500 hover:bg-yellow-500/10 rounded" title="Pause">
                                                    <Pause className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button className="p-1.5 text-green-500 hover:bg-green-500/10 rounded" title="Resume">
                                                    <Play className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded" title="Run Now">
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* History Placeholder */}
            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Content Generation History</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        View all AI-generated content, edits, and automation runs. Track what was created and when.
                    </p>
                </div>
            )}
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const StatusBadge: React.FC<{ status: 'active' | 'paused' | 'error' }> = ({ status }) => {
    const config = {
        active: { bg: 'bg-green-500/10', text: 'text-green-600', icon: <CheckCircle className="h-3 w-3" /> },
        paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: <Pause className="h-3 w-3" /> },
        error: { bg: 'bg-red-500/10', text: 'text-red-600', icon: <AlertCircle className="h-3 w-3" /> }
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config[status].bg} ${config[status].text}`}>
            {config[status].icon}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export default ContentAICenter;
