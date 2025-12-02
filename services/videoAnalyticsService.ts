import { supabase } from './supabaseClient';

export interface VideoAnalytics {
    id: string;
    video_id: string;
    event_type: 'view' | 'click' | 'engagement' | 'complete';
    page: string;
    section: string;
    user_id?: string;
    session_id?: string;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface VideoPerformance {
    id: string;
    title: string;
    page: string;
    section: string;
    video_url: string;
    total_views: number;
    total_clicks: number;
    total_completions: number;
    completion_rate: number;
    avg_watch_time_seconds: number;
    last_viewed_at: string;
}

export const videoAnalyticsService = {
    async getPerformanceMetrics() {
        const { data, error } = await supabase
            .from('video_performance')
            .select('*')
            .order('total_views', { ascending: false });

        if (error) throw error;
        return data as VideoPerformance[];
    },

    async getPerformanceByPage(page: string) {
        const { data, error } = await supabase
            .from('video_performance')
            .select('*')
            .eq('page', page)
            .order('total_views', { ascending: false });

        if (error) throw error;
        return data as VideoPerformance[];
    },

    async getPerformanceByVideo(videoId: string) {
        const { data, error } = await supabase
            .from('video_performance')
            .select('*')
            .eq('id', videoId)
            .single();

        if (error) throw error;
        return data as VideoPerformance;
    },

    async getAnalyticsEvents(videoId: string, eventType?: string) {
        let query = supabase
            .from('video_analytics')
            .select('*')
            .eq('video_id', videoId)
            .order('created_at', { ascending: false });

        if (eventType) {
            query = query.eq('event_type', eventType);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as VideoAnalytics[];
    },

    async getViewsByDateRange(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('video_analytics')
            .select('*')
            .eq('event_type', 'view')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (error) throw error;
        return data as VideoAnalytics[];
    },

    async getTotalStats() {
        const { data, error } = await supabase
            .from('video_performance')
            .select('total_views, total_clicks, total_completions');

        if (error) throw error;

        const totals = data.reduce((acc, curr) => ({
            views: acc.views + (curr.total_views || 0),
            clicks: acc.clicks + (curr.total_clicks || 0),
            completions: acc.completions + (curr.total_completions || 0)
        }), { views: 0, clicks: 0, completions: 0 });

        return totals;
    }
};
