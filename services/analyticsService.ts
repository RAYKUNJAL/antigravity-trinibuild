import { supabase } from './supabaseClient';

export const analyticsService = {
    logPageView: async (path: string) => {
        try {
            // Get or create session ID
            let sessionId = sessionStorage.getItem('trini_session_id');
            if (!sessionId) {
                sessionId = crypto.randomUUID();
                sessionStorage.setItem('trini_session_id', sessionId);
            }

            const { error } = await supabase.from('page_views').insert({
                path,
                referrer: document.referrer || 'Direct',
                user_agent: navigator.userAgent,
                session_id: sessionId,
                timestamp: new Date().toISOString()
            });
            if (error) console.error('Error logging page view:', error);
        } catch (e) {
            console.error('Analytics error:', e);
        }
    },

    getPageViews: async (period: 'today' | 'week' | 'month' = 'today') => {
        const date = new Date();
        if (period === 'today') date.setHours(0, 0, 0, 0);
        if (period === 'week') date.setDate(date.getDate() - 7);
        if (period === 'month') date.setMonth(date.getMonth() - 1);

        const { count, error } = await supabase
            .from('page_views')
            .select('*', { count: 'exact', head: true })
            .gte('timestamp', date.toISOString());

        return count || 0;
    },

    getTrafficSources: async () => {
        const today = new Date();
        today.setDate(today.getDate() - 30); // Last 30 days

        const { data } = await supabase
            .from('page_views')
            .select('referrer')
            .gte('timestamp', today.toISOString())
            .limit(1000);

        if (!data || data.length === 0) {
            return [{ source: 'Direct', visits: 0, percentage: 0, trend: 'stable' }];
        }

        const counts: Record<string, number> = {};
        let total = 0;

        data.forEach((row: any) => {
            // Clean referrer
            let source = 'Direct';
            if (row.referrer && row.referrer !== '' && !row.referrer.includes(window.location.hostname)) {
                try {
                    const url = new URL(row.referrer);
                    source = url.hostname.replace('www.', '');
                } catch {
                    source = 'External';
                }
            }
            // If empty string or null, it's Direct
            if (!row.referrer || row.referrer === '') source = 'Direct';

            counts[source] = (counts[source] || 0) + 1;
            total++;
        });

        return Object.entries(counts)
            .map(([source, visits]) => ({
                source,
                visits,
                percentage: total > 0 ? Math.round((visits / total) * 100) : 0,
                trend: 'stable' // Placeholder for trend
            }))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);
    },

    getTopPages: async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from('page_views')
            .select('path')
            .gte('timestamp', today.toISOString())
            .limit(1000);

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
