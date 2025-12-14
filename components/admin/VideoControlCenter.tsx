import React, { useState, useEffect } from 'react';
import {
    Video,
    Upload,
    Play,
    Pause,
    Trash2,
    Edit,
    Eye,
    BarChart3,
    DollarSign,
    Target,
    TrendingUp,
    Plus,
    Search,
    Filter,
    Download,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { VideoUpload } from '../VideoUpload';
import { CampaignWizard } from '../ads/CampaignWizard';

// ============================================
// TYPES
// ============================================

interface VideoAd {
    id: string;
    campaign_id: string;
    video_url: string;
    thumbnail_url: string | null;
    duration: number | null;
    title: string;
    description: string | null;
    call_to_action: string | null;
    destination_url: string | null;
    status: 'active' | 'paused' | 'draft' | 'rejected';
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface Campaign {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'draft' | 'ended';
    budget: number;
    spent: number;
    impressions: number;
    clicks: number;
    video_views: number;
    video_completions: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const VideoControlCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'videos' | 'campaigns' | 'analytics' | 'create'>('videos');
    const [videos, setVideos] = useState<VideoAd[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'rejected'>('all');
    const [showWizard, setShowWizard] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<VideoAd | null>(null);

    // Load data
    useEffect(() => {
        loadVideos();
        loadCampaigns();
    }, [filter]);

    const loadVideos = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('video_ads')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter === 'active') {
                query = query.eq('status', 'active');
            } else if (filter === 'pending') {
                query = query.eq('approval_status', 'pending');
            } else if (filter === 'rejected') {
                query = query.eq('approval_status', 'rejected');
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error loading videos:', error);
                setVideos([]);
            } else {
                setVideos(data || []);
            }
        } catch (err) {
            console.error('Failed to load videos:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadCampaigns = async () => {
        try {
            const { data, error } = await supabase
                .from('ad_campaigns')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setCampaigns(data);
            }
        } catch (err) {
            console.error('Failed to load campaigns:', err);
        }
    };

    const handleApproveVideo = async (videoId: string) => {
        const { error } = await supabase
            .from('video_ads')
            .update({ approval_status: 'approved', status: 'active' })
            .eq('id', videoId);

        if (!error) {
            loadVideos();
        }
    };

    const handleRejectVideo = async (videoId: string) => {
        const reason = prompt('Rejection reason:');
        if (!reason) return;

        const { error } = await supabase
            .from('video_ads')
            .update({ approval_status: 'rejected', rejection_reason: reason })
            .eq('id', videoId);

        if (!error) {
            loadVideos();
        }
    };

    const handleDeleteVideo = async (videoId: string) => {
        if (!confirm('Delete this video ad? This cannot be undone.')) return;

        const { error } = await supabase
            .from('video_ads')
            .delete()
            .eq('id', videoId);

        if (!error) {
            loadVideos();
        }
    };

    const stats = {
        totalVideos: videos.length,
        activeVideos: videos.filter(v => v.status === 'active').length,
        pendingApproval: videos.filter(v => v.approval_status === 'pending').length,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalImpressions: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
        totalViews: campaigns.reduce((sum, c) => sum + (c.video_views || 0), 0),
        totalSpent: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Video className="h-7 w-7 text-trini-red" />
                        Video Control Center
                    </h1>
                    <p className="text-gray-500 mt-1">Manage video ads, campaigns, and analytics</p>
                </div>
                <button
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-trini-red text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    New Video Campaign
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <StatCard label="Total Videos" value={stats.totalVideos} icon={<Video className="h-5 w-5" />} color="blue" />
                <StatCard label="Active" value={stats.activeVideos} icon={<Play className="h-5 w-5" />} color="green" />
                <StatCard label="Pending" value={stats.pendingApproval} icon={<Clock className="h-5 w-5" />} color="yellow" />
                <StatCard label="Campaigns" value={stats.activeCampaigns} icon={<Target className="h-5 w-5" />} color="purple" />
                <StatCard label="Impressions" value={stats.totalImpressions.toLocaleString()} icon={<Eye className="h-5 w-5" />} color="cyan" />
                <StatCard label="Views" value={stats.totalViews.toLocaleString()} icon={<Play className="h-5 w-5" />} color="orange" />
                <StatCard label="Spent" value={`$${stats.totalSpent.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} color="red" />
                <StatCard label="CTR" value="2.4%" icon={<TrendingUp className="h-5 w-5" />} color="green" />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                {(['videos', 'campaigns', 'analytics', 'create'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-3 px-1 border-b-2 transition-colors font-medium ${activeTab === tab
                            ? 'border-trini-red text-trini-red'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Videos Tab */}
            {activeTab === 'videos' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search videos..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'active', 'pending', 'rejected'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f
                                        ? 'bg-trini-red text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Videos Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading videos...</p>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Videos Yet</h3>
                            <p className="text-gray-500 mb-6">Create your first video ad campaign to get started</p>
                            <button
                                onClick={() => setShowWizard(true)}
                                className="px-6 py-3 bg-trini-red text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Create Video Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onApprove={handleApproveVideo}
                                    onReject={handleRejectVideo}
                                    onDelete={handleDeleteVideo}
                                    onView={() => setSelectedVideo(video)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Campaign Management</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        View and manage all your video ad campaigns. Track performance, adjust budgets, and optimize targeting.
                    </p>
                    <div className="mt-6 text-sm text-gray-400">
                        {campaigns.length} campaigns total
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Video Analytics</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        Deep dive into video performance metrics. Track views, engagement, completion rates, and ROI.
                    </p>
                </div>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upload New Video Ad</h3>
                    <VideoUpload
                        onUploadComplete={(url) => {
                            console.log('Video uploaded:', url);
                            // Create video ad record
                            // Then open campaign wizard
                        }}
                    />
                </div>
            )}

            {/* Campaign Wizard Modal */}
            {showWizard && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Video Campaign</h2>
                            <button
                                onClick={() => setShowWizard(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title="Close wizard"
                                aria-label="Close campaign wizard"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <CampaignWizard
                                onComplete={(campaign) => {
                                    console.log('Campaign created:', campaign);
                                    setShowWizard(false);
                                    loadCampaigns();
                                    loadVideos();
                                }}
                                onCancel={() => setShowWizard(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Video Preview Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVideo.title}</h2>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title="Close preview"
                                aria-label="Close video preview"
                            >
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <video
                                src={selectedVideo.video_url}
                                controls
                                className="w-full rounded-lg"
                                poster={selectedVideo.thumbnail_url || undefined}
                            />
                            <div className="mt-4 space-y-2">
                                <p className="text-gray-600 dark:text-gray-300">{selectedVideo.description}</p>
                                {selectedVideo.call_to_action && (
                                    <p className="text-sm text-gray-500">CTA: {selectedVideo.call_to_action}</p>
                                )}
                                {selectedVideo.destination_url && (
                                    <p className="text-sm text-gray-500">URL: {selectedVideo.destination_url}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`text-${color}-500 mb-2`}>{icon}</div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const VideoCard: React.FC<{
    video: VideoAd;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete: (id: string) => void;
    onView: () => void;
}> = ({ video, onApprove, onReject, onDelete, onView }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-900">
            {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-600" />
                </div>
            )}
            <div className="absolute top-2 right-2">
                <ApprovalBadge status={video.approval_status} />
            </div>
        </div>

        {/* Content */}
        <div className="p-4">
            <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{video.title}</h4>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{video.description}</p>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onView}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                >
                    <Eye className="h-4 w-4" />
                    View
                </button>
                {video.approval_status === 'pending' && (
                    <>
                        <button
                            onClick={() => onApprove(video.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                        >
                            <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onReject(video.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                        >
                            <XCircle className="h-5 w-5" />
                        </button>
                    </>
                )}
                <button
                    onClick={() => onDelete(video.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </div>
        </div>
    </div>
);

const ApprovalBadge: React.FC<{ status: 'pending' | 'approved' | 'rejected' }> = ({ status }) => {
    const config = {
        pending: { bg: 'bg-yellow-500', text: 'Pending', icon: Clock },
        approved: { bg: 'bg-green-500', text: 'Approved', icon: CheckCircle },
        rejected: { bg: 'bg-red-500', text: 'Rejected', icon: XCircle }
    };

    const { bg, text, icon: Icon } = config[status];

    return (
        <span className={`${bg} text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1`}>
            <Icon className="h-3 w-3" />
            {text}
        </span>
    );
};

export default VideoControlCenter;
