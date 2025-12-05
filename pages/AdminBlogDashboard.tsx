import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    MapPin,
    FileText,
    Send,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Download,
    Copy,
    Eye,
    Code,
    Zap,
    Globe,
    TrendingUp,
    Briefcase,
    Home,
    Car,
    Ticket,
    Store,
    ChevronDown,
    ChevronRight,
    Clock,
    BarChart3,
    Play,
    Pause,
    Settings,
    Calendar,
    List,
    Grid,
    Search,
    Filter,
    Trash2,
    Edit,
    ExternalLink,
    Share2,
    Database,
    Cpu,
    Activity,
    Target,
    Layers,
    PlusCircle
} from 'lucide-react';
import {
    generateLocationBlog,
    GeneratedBlog,
    TRINIDAD_LOCATIONS,
    BLOG_VERTICALS,
    getLocationBySlug
} from '../services/blogEngineService';
import {
    saveBlog,
    getBlogs,
    getBlogStats,
    getQueueStats,
    updateBlogStatus,
    deleteBlog,
    StoredBlog,
    BlogStatus
} from '../services/blogDatabaseService';
import {
    queueAllBlogs,
    queueMajorCityBlogs,
    processQueue,
    startAutomation,
    stopAutomation,
    getAutomationStatus,
    getCoverageStats
} from '../services/blogAutomationService';

// ============================================
// TYPES
// ============================================

type TabType = 'generate' | 'manage' | 'queue' | 'analytics' | 'settings';

const verticalIcons: Record<string, React.ReactNode> = {
    jobs: <Briefcase className="h-4 w-4" />,
    stores: <Store className="h-4 w-4" />,
    tickets: <Ticket className="h-4 w-4" />,
    real_estate: <Home className="h-4 w-4" />,
    rideshare: <Car className="h-4 w-4" />,
    combo: <Globe className="h-4 w-4" />
};

const verticalColors: Record<string, string> = {
    jobs: 'bg-blue-500',
    stores: 'bg-emerald-500',
    tickets: 'bg-purple-500',
    real_estate: 'bg-orange-500',
    rideshare: 'bg-cyan-500',
    combo: 'bg-gray-600'
};

const statusColors: Record<BlogStatus, string> = {
    draft: 'bg-gray-500',
    scheduled: 'bg-yellow-500',
    published: 'bg-green-500',
    archived: 'bg-red-500'
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AdminBlogDashboard: React.FC = () => {
    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('generate');

    // Stats
    const [blogStats, setBlogStats] = useState({
        total_blogs: 0,
        published: 0,
        drafts: 0,
        scheduled: 0,
        total_views: 0,
        locations_covered: 0
    });
    const [queueStats, setQueueStats] = useState({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
    });

    // Generation state
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedVertical, setSelectedVertical] = useState('jobs');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBlog, setGeneratedBlog] = useState<GeneratedBlog | null>(null);

    // Blog management
    const [blogs, setBlogs] = useState<StoredBlog[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Automation
    const [automationStatus, setAutomationStatus] = useState(getAutomationStatus());

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Group locations by region
    const locationsByRegion = TRINIDAD_LOCATIONS.reduce((acc, loc) => {
        if (!acc[loc.region_or_municipality]) {
            acc[loc.region_or_municipality] = [];
        }
        acc[loc.region_or_municipality].push(loc);
        return acc;
    }, {} as Record<string, typeof TRINIDAD_LOCATIONS>);
    const regions = Object.keys(locationsByRegion).sort();

    // Load data on mount
    useEffect(() => {
        loadData();
        const interval = setInterval(() => {
            setAutomationStatus(getAutomationStatus());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [stats, queue, blogList] = await Promise.all([
                getBlogStats(),
                getQueueStats(),
                getBlogs({ limit: 100 })
            ]);
            setBlogStats(stats);
            setQueueStats(queue);
            setBlogs(blogList);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    // Handlers
    const handleGenerate = async () => {
        if (!selectedLocation) {
            setError('Please select a location');
            return;
        }

        const location = getLocationBySlug(selectedLocation);
        if (!location) {
            setError('Invalid location');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedBlog(null);

        try {
            const blog = await generateLocationBlog({
                location,
                vertical_key: selectedVertical,
                word_count_target: 1200,
                tone_variant: 'default',
                include_hypothetical_story: true
            });
            setGeneratedBlog(blog);
            setSuccess('Blog generated successfully!');
        } catch (err) {
            setError(String(err));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!generatedBlog) return;

        const saved = await saveBlog(generatedBlog, { status: 'draft' });
        if (saved) {
            setSuccess('Blog saved as draft!');
            loadData();
        } else {
            setError('Failed to save blog');
        }
    };

    const handlePublish = async () => {
        if (!generatedBlog) return;

        const saved = await saveBlog(generatedBlog, { status: 'published' });
        if (saved) {
            setSuccess('Blog published!');
            loadData();
        } else {
            setError('Failed to publish blog');
        }
    };

    const handleQueueAll = async () => {
        setIsLoading(true);
        const count = await queueAllBlogs();
        setSuccess(`Queued ${count} blogs for generation`);
        loadData();
    };

    const handleQueueMajorCities = async () => {
        setIsLoading(true);
        const count = await queueMajorCityBlogs();
        setSuccess(`Queued ${count} major city blogs`);
        loadData();
    };

    const handleProcessQueue = async () => {
        setIsLoading(true);
        const results = await processQueue(5);
        const successCount = results.filter(r => r.success).length;
        setSuccess(`Processed ${successCount}/${results.length} blogs`);
        loadData();
    };

    const handleToggleAutomation = () => {
        if (automationStatus.isRunning) {
            stopAutomation();
        } else {
            startAutomation(30);
        }
        setAutomationStatus(getAutomationStatus());
    };

    const handleDeleteBlog = async (blogId: string) => {
        if (!confirm('Are you sure you want to delete this blog?')) return;
        const deleted = await deleteBlog(blogId);
        if (deleted) {
            setSuccess('Blog deleted');
            loadData();
        }
    };

    const handleStatusChange = async (blogId: string, newStatus: BlogStatus) => {
        const updated = await updateBlogStatus(blogId, newStatus);
        if (updated) {
            setSuccess(`Status updated to ${newStatus}`);
            loadData();
        }
    };

    // Filter blogs
    const filteredBlogs = blogs.filter(blog => {
        if (statusFilter !== 'all' && blog.status !== statusFilter) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return blog.seo_title.toLowerCase().includes(query) ||
                blog.location_name.toLowerCase().includes(query);
        }
        return true;
    });

    // Clear messages after 5 seconds
    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const totalPossibleBlogs = TRINIDAD_LOCATIONS.length * 5;
    const coveragePercent = ((blogStats.total_blogs / totalPossibleBlogs) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-trini-red via-red-600 to-orange-500 py-6 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Sparkles className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Blog Engine Dashboard</h1>
                                <p className="text-white/80 text-sm">AI-Powered SEO Blog Automation</p>
                            </div>
                        </div>

                        {/* Automation Status */}
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${automationStatus.isRunning ? 'bg-green-500/20' : 'bg-gray-500/20'
                                }`}>
                                <Activity className={`h-4 w-4 ${automationStatus.isRunning ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
                                <span className="text-sm">{automationStatus.isRunning ? 'Running' : 'Stopped'}</span>
                            </div>
                            <button
                                onClick={handleToggleAutomation}
                                className={`p-2 rounded-lg ${automationStatus.isRunning
                                        ? 'bg-red-500/20 hover:bg-red-500/30'
                                        : 'bg-green-500/20 hover:bg-green-500/30'
                                    }`}
                            >
                                {automationStatus.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-6 -mt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <StatCard icon={<FileText />} label="Total Blogs" value={blogStats.total_blogs} color="blue" />
                    <StatCard icon={<CheckCircle />} label="Published" value={blogStats.published} color="green" />
                    <StatCard icon={<Clock />} label="Drafts" value={blogStats.drafts} color="gray" />
                    <StatCard icon={<Calendar />} label="Scheduled" value={blogStats.scheduled} color="yellow" />
                    <StatCard icon={<MapPin />} label="Locations" value={blogStats.locations_covered} color="purple" />
                    <StatCard icon={<Target />} label="Coverage" value={`${coveragePercent}%`} color="red" />
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 mt-8">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { key: 'generate', label: 'Generate', icon: <Sparkles className="h-4 w-4" /> },
                        { key: 'manage', label: 'Manage', icon: <Layers className="h-4 w-4" /> },
                        { key: 'queue', label: 'Queue', icon: <List className="h-4 w-4" /> },
                        { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
                        { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as TabType)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${activeTab === tab.key
                                    ? 'bg-trini-red text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <span className="text-red-300">{error}</span>
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-green-300">{success}</span>
                    </div>
                )}

                {/* Tab Content */}
                <div className="bg-gray-800/50 rounded-2xl p-6 min-h-[500px]">

                    {/* GENERATE TAB */}
                    {activeTab === 'generate' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-trini-red" />
                                    Generate New Blog
                                </h2>

                                {/* Location Select */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Location</label>
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white"
                                    >
                                        <option value="">Choose a location...</option>
                                        {regions.map(region => (
                                            <optgroup key={region} label={region}>
                                                {locationsByRegion[region].map(loc => (
                                                    <option key={loc.slug} value={loc.slug}>
                                                        {loc.name} {loc.isMajorCity ? '★' : ''}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>

                                {/* Vertical Select */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Vertical</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {BLOG_VERTICALS.filter(v => v.key !== 'combo').map(v => (
                                            <button
                                                key={v.key}
                                                onClick={() => setSelectedVertical(v.key)}
                                                className={`p-3 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedVertical === v.key
                                                        ? `${verticalColors[v.key]} text-white`
                                                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                                                    }`}
                                            >
                                                {verticalIcons[v.key]}
                                                <span className="text-xs">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !selectedLocation}
                                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 ${isGenerating || !selectedLocation
                                            ? 'bg-gray-700 text-gray-500'
                                            : 'bg-gradient-to-r from-trini-red to-orange-500 text-white hover:shadow-lg'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <>
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-5 w-5" />
                                            Generate Blog
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Preview */}
                            <div className="bg-gray-900/50 rounded-xl p-6">
                                {generatedBlog ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold">{generatedBlog.h1}</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveDraft}
                                                    className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600"
                                                >
                                                    Save Draft
                                                </button>
                                                <button
                                                    onClick={handlePublish}
                                                    className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-500"
                                                >
                                                    Publish
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 text-sm text-gray-400">
                                            <span>{generatedBlog.word_count} words</span>
                                            <span>{generatedBlog.reading_time_minutes} min read</span>
                                        </div>

                                        <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                                            <div
                                                className="prose prose-invert prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: generatedBlog.body_html }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <FileText className="h-16 w-16 mb-4 opacity-50" />
                                        <p>Select a location and generate a blog</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MANAGE TAB */}
                    {activeTab === 'manage' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Manage Blogs</h2>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as BlogStatus | 'all')}
                                        className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Drafts</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-500" />
                                </div>
                            ) : filteredBlogs.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No blogs found</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredBlogs.map(blog => (
                                        <div
                                            key={blog.id}
                                            className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-900/70"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`p-2 rounded-lg ${verticalColors[blog.vertical_key]}`}>
                                                    {verticalIcons[blog.vertical_key]}
                                                </span>
                                                <div>
                                                    <h4 className="font-medium">{blog.h1}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                                        <span>{blog.location_name}</span>
                                                        <span>•</span>
                                                        <span>{blog.word_count} words</span>
                                                        <span>•</span>
                                                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[blog.status]}`}>
                                                            {blog.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">{blog.view_count} views</span>
                                                <select
                                                    value={blog.status}
                                                    onChange={(e) => handleStatusChange(blog.id, e.target.value as BlogStatus)}
                                                    className="px-2 py-1 bg-gray-700 rounded text-sm"
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="scheduled">Scheduled</option>
                                                    <option value="published">Published</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                                <button
                                                    onClick={() => window.open(`/blog/${blog.url_slug}`, '_blank')}
                                                    className="p-2 hover:bg-gray-700 rounded"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBlog(blog.id)}
                                                    className="p-2 hover:bg-red-500/20 rounded text-red-400"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUEUE TAB */}
                    {activeTab === 'queue' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Generation Queue</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleQueueMajorCities}
                                        className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500"
                                    >
                                        Queue Major Cities
                                    </button>
                                    <button
                                        onClick={handleQueueAll}
                                        className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-500"
                                    >
                                        Queue All ({TRINIDAD_LOCATIONS.length * 5})
                                    </button>
                                    <button
                                        onClick={handleProcessQueue}
                                        className="px-4 py-2 bg-green-600 rounded-lg text-sm hover:bg-green-500 flex items-center gap-2"
                                    >
                                        <Cpu className="h-4 w-4" />
                                        Process Now
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <QueueStatCard label="Pending" value={queueStats.pending} color="yellow" />
                                <QueueStatCard label="Processing" value={queueStats.processing} color="blue" />
                                <QueueStatCard label="Completed" value={queueStats.completed} color="green" />
                                <QueueStatCard label="Failed" value={queueStats.failed} color="red" />
                            </div>

                            <div className="bg-gray-900/50 rounded-xl p-6">
                                <h3 className="font-bold mb-4">Automation Status</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Status</span>
                                        <span className={automationStatus.isRunning ? 'text-green-400' : 'text-gray-500'}>
                                            {automationStatus.isRunning ? 'Running' : 'Stopped'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Last Run</span>
                                        <span>{automationStatus.lastRun || 'Never'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Blogs Generated</span>
                                        <span>{automationStatus.blogsGenerated}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Blogs Published</span>
                                        <span>{automationStatus.blogsPublished}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Analytics</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-900/50 rounded-xl p-6">
                                    <h3 className="font-bold mb-4">Coverage by Vertical</h3>
                                    {BLOG_VERTICALS.filter(v => v.key !== 'combo').map(v => (
                                        <div key={v.key} className="mb-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="flex items-center gap-2">
                                                    {verticalIcons[v.key]}
                                                    {v.label}
                                                </span>
                                                <span>{Math.floor(Math.random() * 100)}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${verticalColors[v.key]}`}
                                                    style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-900/50 rounded-xl p-6">
                                    <h3 className="font-bold mb-4">Top Performing Blogs</h3>
                                    <div className="text-center py-8 text-gray-500">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Analytics data coming soon</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold">Scheduler Settings</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-900/50 rounded-xl p-6 space-y-4">
                                    <h3 className="font-bold">Generation Settings</h3>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Blogs per Day</label>
                                        <input type="number" defaultValue={3} className="w-full px-4 py-2 bg-gray-700 rounded-lg" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Default Word Count</label>
                                        <input type="number" defaultValue={1200} className="w-full px-4 py-2 bg-gray-700 rounded-lg" />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Publish Hour (0-23)</label>
                                        <input type="number" defaultValue={9} min={0} max={23} className="w-full px-4 py-2 bg-gray-700 rounded-lg" />
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 rounded-xl p-6 space-y-4">
                                    <h3 className="font-bold">Social Media Auto-Post</h3>

                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-4 h-4" />
                                        <span>Auto-post to Facebook</span>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-4 h-4" />
                                        <span>Auto-post to Twitter</span>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input type="checkbox" className="w-4 h-4" />
                                        <span>Auto-post to LinkedIn</span>
                                    </label>

                                    <button className="w-full py-2 bg-trini-red rounded-lg mt-4 hover:bg-red-600">
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color: string }> =
    ({ icon, label, value, color }) => (
        <div className="bg-gray-800/80 backdrop-blur rounded-xl p-4 border border-gray-700/50">
            <div className={`text-${color}-400 mb-2`}>{icon}</div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );

const QueueStatCard: React.FC<{ label: string; value: number; color: string }> =
    ({ label, value, color }) => (
        <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-4 text-center`}>
            <div className={`text-3xl font-bold text-${color}-400`}>{value}</div>
            <div className="text-sm text-gray-400">{label}</div>
        </div>
    );

export default AdminBlogDashboard;
