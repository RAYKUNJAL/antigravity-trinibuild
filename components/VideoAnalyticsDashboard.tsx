import React, { useEffect, useState } from 'react';
import { TrendingUp, Eye, MousePointer, CheckCircle, Clock, PlayCircle, BarChart3 } from 'lucide-react';
import { videoAnalyticsService, VideoPerformance } from '../services/videoAnalyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export const VideoAnalyticsDashboard: React.FC = () => {
    const [videoPerformance, setVideoPerformance] = useState<VideoPerformance[]>([]);
    const [totalStats, setTotalStats] = useState({ views: 0, clicks: 0, completions: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [performance, stats] = await Promise.all([
                videoAnalyticsService.getPerformanceMetrics(),
                videoAnalyticsService.getTotalStats()
            ]);
            setVideoPerformance(performance);
            setTotalStats(stats);
        } catch (error) {
            console.error("Failed to load analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const topVideos = videoPerformance.slice(0, 5);
    const videosByPage = videoPerformance.reduce((acc, video) => {
        const existing = acc.find(item => item.name === video.page);
        if (existing) {
            existing.views += video.total_views || 0;
        } else {
            acc.push({ name: video.page, views: video.total_views || 0 });
        }
        return acc;
    }, [] as { name: string; views: number }[]);

    const avgCompletionRate = videoPerformance.length > 0
        ? videoPerformance.reduce((sum, v) => sum + (v.completion_rate || 0), 0) / videoPerformance.length
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-trini-red"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Video Analytics Dashboard</h2>
                    <p className="text-gray-500 text-sm">Track video performance and engagement across your platform</p>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 flex items-center"
                >
                    <TrendingUp className="h-4 w-4 mr-2" /> Refresh Data
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Views</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalStats.views.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                            <Eye className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Clicks</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalStats.clicks.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                            <MousePointer className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Completions</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalStats.completions.toLocaleString()}</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100 text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Completion Rate</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{avgCompletionRate.toFixed(1)}%</h3>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performing Videos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Top Performing Videos</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topVideos}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="total_views" fill="#ef4444" name="Views" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Views by Page */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4">Views by Page</h3>
                    <div className="h-80 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={videosByPage}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="views"
                                >
                                    {videosByPage.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-900">Video Performance Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Video</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Page</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Views</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Clicks</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Completions</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Completion Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Avg Watch Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {videoPerformance.map((video) => (
                                <tr key={video.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <PlayCircle className="h-5 w-5 text-gray-400 mr-2" />
                                            <div>
                                                <div className="font-bold text-sm text-gray-900">{video.title}</div>
                                                <div className="text-xs text-gray-500">{video.section}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                            {video.page}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{video.total_views || 0}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{video.total_clicks || 0}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{video.total_completions || 0}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                                <div
                                                    className="bg-green-600 h-2 rounded-full"
                                                    style={{ width: `${Math.min(video.completion_rate || 0, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{(video.completion_rate || 0).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            {video.avg_watch_time_seconds ? `${Math.floor(video.avg_watch_time_seconds)}s` : 'N/A'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {videoPerformance.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <PlayCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p>No video analytics data yet. Videos will appear here once they start getting views.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
