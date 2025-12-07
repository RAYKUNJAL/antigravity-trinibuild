import { supabase } from './supabaseClient';

export const analyticsService = {
    logPageView: async (path: string) => {
        try {
            const { error } = await supabase.from('page_views').insert({
                path,
                timestamp: new Date().toISOString()
            });
            if (error) console.error('Error logging page view:', error);
        } catch (e) {
            console.error('Analytics error:', e);
        }
    },

    getPageViews: async (period: 'today' | 'week' | 'month' = 'today') => {
        // Simple count query - for production this should use aggregation views
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .gte('timestamp', today.toISOString());

        return count || 0;
    },

    getTrafficSources: async () => {
        // NOTE: Since we don't track referrer yet in DB, we'll return a placeholder or 
        // need to add referrer tracking. For Commercial Ready, we should track it.
        // Returning a static list for now until schema update for referrer
        return [
            { source: 'Direct', visits: 0, percentage: 0, trend: 'stable' }
        ];
    },

    getTopPages: async () => {
        // This requires aggregation which is hard with basic Supabase client side 
        // without RPC. We will return empty or fetch raw and map (expensive).
        // For now, let's fetch recently viewed unique paths
        const { data } = await supabase
            .from('page_views')
            .select('path')
            .limit(100);

        // Client side aggregation (temporary solution for " Commercial Ready" without SQL functions)
        const counts: Record<string, number> = {};
        data?.forEach((row: any) => {
            counts[row.path] = (counts[row.path] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([page, views]) => ({ page, views, time: '0m 0s' }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
    }
};
