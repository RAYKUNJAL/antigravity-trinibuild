/**
 * TriniBuild Keyword Traffic Engine Service
 * Key: kw_engine
 * 
 * Real-time keyword tracking and analytics engine to monitor
 * searches, trends, gaps, and ranking opportunities across T&T.
 */

import { supabase } from './supabaseClient';
import { aiService } from './ai';

// ============================================
// TYPES
// ============================================

export type SearchSource =
    | 'search_bar'
    | 'ai_search'
    | 'category_click'
    | 'location_filter'
    | 'blog_search'
    | 'store_search'
    | 'job_search'
    | 'property_search'
    | 'rideshare_route'
    | 'event_search'
    | 'service_search';

export interface KeywordSearch {
    id: string;
    keyword_text: string;
    keyword_normalized: string;
    search_source: SearchSource;
    user_id?: string;
    session_id?: string;
    detected_location?: string;
    location_slug?: string;
    results_count: number;
    clicked_result_id?: string;
    clicked_result_type?: string;
    bounced: boolean;
    converted: boolean;
    created_at: string;
}

export interface KeywordMetrics {
    keyword_normalized: string;
    date: string;
    search_volume: number;
    unique_users: number;
    total_clicks: number;
    ctr: number;
    bounce_rate: number;
    conversions: number;
    conversion_rate: number;
    zero_result_searches: number;
    opportunity_score: number;
    is_rising: boolean;
    is_falling: boolean;
    location_breakdown: Record<string, number>;
}

export interface KeywordGap {
    id: string;
    keyword_normalized: string;
    gap_type: string;
    search_volume_30d: number;
    current_results_count: number;
    gap_severity: 'low' | 'medium' | 'high' | 'critical';
    recommended_action: string;
    suggested_vertical?: string;
    suggested_location?: string;
    suggested_blog_title?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'ignored';
}

export interface KeywordSuggestion {
    id: string;
    keyword: string;
    suggestion_type: string;
    estimated_volume: number;
    difficulty_score: number;
    opportunity_score: number;
    content_recommendation?: string;
    suggested_title?: string;
    target_vertical?: string;
    target_location?: string;
    status: 'pending' | 'approved' | 'rejected' | 'implemented';
}

export interface KeywordAlert {
    id: string;
    alert_type: string;
    keyword: string;
    location?: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    status: 'new' | 'viewed' | 'actioned' | 'dismissed';
    created_at: string;
}

export interface TopKeyword {
    keyword: string;
    total_volume: number;
    avg_ctr: number;
    avg_conversion_rate: number;
    opportunity_score: number;
    trend: 'rising' | 'falling' | 'stable';
}

export interface LocationHeatmap {
    location_slug: string;
    location_name: string;
    top_keywords: { keyword: string; volume: number }[];
    rising_keywords: { keyword: string; growth_percent: number }[];
    total_searches: number;
}

export interface KeywordDashboardData {
    topKeywords: TopKeyword[];
    risingKeywords: TopKeyword[];
    keywordGaps: KeywordGap[];
    locationHeatmaps: LocationHeatmap[];
    alerts: KeywordAlert[];
    summary: {
        totalSearches: number;
        uniqueKeywords: number;
        avgCTR: number;
        avgConversionRate: number;
        zeroResultRate: number;
        topLocation: string;
    };
}

// ============================================
// SESSION MANAGEMENT
// ============================================

let currentSessionId: string | null = null;

const getSessionId = (): string => {
    if (currentSessionId) return currentSessionId;

    // Try to get from sessionStorage
    if (typeof window !== 'undefined') {
        currentSessionId = sessionStorage.getItem('tb_search_session');
        if (!currentSessionId) {
            currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('tb_search_session', currentSessionId);
        }
    } else {
        currentSessionId = `session_${Date.now()}`;
    }

    return currentSessionId;
};

// ============================================
// TRACKING FUNCTIONS
// ============================================

/**
 * Log a keyword search
 */
export const logKeywordSearch = async (
    keyword: string,
    source: SearchSource,
    options: {
        userId?: string;
        location?: string;
        locationSlug?: string;
        resultsCount?: number;
        resultVerticals?: string[];
    } = {}
): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .from('keyword_searches')
            .insert({
                keyword_text: keyword,
                keyword_normalized: keyword.toLowerCase().trim(),
                search_source: source,
                user_id: options.userId,
                session_id: getSessionId(),
                detected_location: options.location,
                location_slug: options.locationSlug,
                results_count: options.resultsCount || 0,
                result_vertical: options.resultVerticals,
                bounced: true // Will be updated if user clicks
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error logging search:', error);
            return null;
        }

        return data.id;
    } catch (err) {
        console.error('Error logging search:', err);
        return null;
    }
};

/**
 * Log a click on a search result
 */
export const logSearchClick = async (
    searchId: string,
    resultId: string,
    resultType: string,
    timeToClickSeconds?: number
): Promise<void> => {
    try {
        await supabase
            .from('keyword_searches')
            .update({
                clicked_result_id: resultId,
                clicked_result_type: resultType,
                time_to_click_seconds: timeToClickSeconds,
                bounced: false
            })
            .eq('id', searchId);
    } catch (err) {
        console.error('Error logging click:', err);
    }
};

/**
 * Log a conversion from a search
 */
export const logSearchConversion = async (
    searchId: string,
    conversionType: string
): Promise<void> => {
    try {
        await supabase
            .from('keyword_searches')
            .update({
                converted: true,
                conversion_type: conversionType,
                pages_viewed_after: 1
            })
            .eq('id', searchId);
    } catch (err) {
        console.error('Error logging conversion:', err);
    }
};

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

/**
 * Get top keywords for a period
 */
export const getTopKeywords = async (
    days = 7,
    limit = 20,
    location?: string
): Promise<TopKeyword[]> => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = supabase
            .from('keyword_metrics')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('search_volume', { ascending: false });

        const { data, error } = await query;

        if (error || !data) return [];

        // Aggregate by keyword
        const keywordMap = new Map<string, {
            volume: number;
            ctr: number[];
            conversion: number[];
            rising: boolean;
            falling: boolean;
        }>();

        for (const row of data) {
            const existing = keywordMap.get(row.keyword_normalized) || {
                volume: 0, ctr: [], conversion: [], rising: false, falling: false
            };
            existing.volume += row.search_volume;
            existing.ctr.push(row.ctr);
            existing.conversion.push(row.conversion_rate);
            existing.rising = existing.rising || row.is_rising;
            existing.falling = existing.falling || row.is_falling;
            keywordMap.set(row.keyword_normalized, existing);
        }

        // Convert to array and sort
        const results: TopKeyword[] = Array.from(keywordMap.entries())
            .map(([keyword, stats]) => ({
                keyword,
                total_volume: stats.volume,
                avg_ctr: stats.ctr.reduce((a, b) => a + b, 0) / stats.ctr.length,
                avg_conversion_rate: stats.conversion.reduce((a, b) => a + b, 0) / stats.conversion.length,
                opportunity_score: calculateOpportunityScore(stats.volume, stats.ctr[0] || 0),
                trend: stats.rising ? 'rising' as const : stats.falling ? 'falling' as const : 'stable' as const
            }))
            .sort((a, b) => b.total_volume - a.total_volume)
            .slice(0, limit);

        return results;
    } catch (err) {
        console.error('Error getting top keywords:', err);
        return [];
    }
};

/**
 * Get rising keywords
 */
export const getRisingKeywords = async (limit = 10): Promise<TopKeyword[]> => {
    try {
        const { data, error } = await supabase
            .from('keyword_metrics')
            .select('*')
            .eq('is_rising', true)
            .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('volume_change_percent', { ascending: false })
            .limit(limit);

        if (error || !data) return [];

        return data.map(row => ({
            keyword: row.keyword_normalized,
            total_volume: row.search_volume,
            avg_ctr: row.ctr,
            avg_conversion_rate: row.conversion_rate,
            opportunity_score: row.opportunity_score,
            trend: 'rising' as const
        }));
    } catch (err) {
        console.error('Error getting rising keywords:', err);
        return [];
    }
};

/**
 * Get keyword gaps
 */
export const getKeywordGaps = async (
    status: 'open' | 'all' = 'open',
    limit = 20
): Promise<KeywordGap[]> => {
    try {
        let query = supabase
            .from('keyword_gaps')
            .select('*')
            .order('search_volume_30d', { ascending: false })
            .limit(limit);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data as KeywordGap[];
    } catch (err) {
        console.error('Error getting keyword gaps:', err);
        return [];
    }
};

/**
 * Get location heatmaps
 */
export const getLocationHeatmaps = async (
    days = 7
): Promise<LocationHeatmap[]> => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('location_keyword_heatmap')
            .select('*')
            .gte('date', startDate.toISOString().split('T')[0])
            .order('total_searches', { ascending: false });

        if (error || !data) return [];

        // Aggregate by location
        const locationMap = new Map<string, LocationHeatmap>();

        for (const row of data) {
            const existing = locationMap.get(row.location_slug) || {
                location_slug: row.location_slug,
                location_name: row.location_name,
                top_keywords: [],
                rising_keywords: [],
                total_searches: 0
            };

            existing.total_searches += row.total_searches;
            existing.top_keywords = row.top_keywords || [];
            existing.rising_keywords = row.rising_keywords || [];

            locationMap.set(row.location_slug, existing);
        }

        return Array.from(locationMap.values());
    } catch (err) {
        console.error('Error getting location heatmaps:', err);
        return [];
    }
};

/**
 * Get keyword alerts
 */
export const getKeywordAlerts = async (
    status: 'new' | 'all' = 'new',
    limit = 20
): Promise<KeywordAlert[]> => {
    try {
        let query = supabase
            .from('keyword_alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data as KeywordAlert[];
    } catch (err) {
        console.error('Error getting alerts:', err);
        return [];
    }
};

/**
 * Mark alert as viewed
 */
export const markAlertViewed = async (alertId: string): Promise<void> => {
    await supabase
        .from('keyword_alerts')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', alertId);
};

/**
 * Get keyword suggestions
 */
export const getKeywordSuggestions = async (
    status: 'pending' | 'all' = 'pending',
    limit = 20
): Promise<KeywordSuggestion[]> => {
    try {
        let query = supabase
            .from('keyword_suggestions')
            .select('*')
            .order('opportunity_score', { ascending: false })
            .limit(limit);

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error || !data) return [];

        return data as KeywordSuggestion[];
    } catch (err) {
        console.error('Error getting suggestions:', err);
        return [];
    }
};

/**
 * Get full dashboard data
 */
export const getKeywordDashboardData = async (): Promise<KeywordDashboardData> => {
    const [
        topKeywords,
        risingKeywords,
        keywordGaps,
        locationHeatmaps,
        alerts
    ] = await Promise.all([
        getTopKeywords(7, 20),
        getRisingKeywords(10),
        getKeywordGaps('open', 10),
        getLocationHeatmaps(7),
        getKeywordAlerts('new', 10)
    ]);

    // Calculate summary
    const totalVolume = topKeywords.reduce((sum, k) => sum + k.total_volume, 0);
    const avgCTR = topKeywords.length > 0
        ? topKeywords.reduce((sum, k) => sum + k.avg_ctr, 0) / topKeywords.length
        : 0;
    const avgConversion = topKeywords.length > 0
        ? topKeywords.reduce((sum, k) => sum + k.avg_conversion_rate, 0) / topKeywords.length
        : 0;

    const topLocation = locationHeatmaps.length > 0
        ? locationHeatmaps[0].location_name
        : 'Port of Spain';

    return {
        topKeywords,
        risingKeywords,
        keywordGaps,
        locationHeatmaps,
        alerts,
        summary: {
            totalSearches: totalVolume,
            uniqueKeywords: topKeywords.length,
            avgCTR: avgCTR * 100,
            avgConversionRate: avgConversion * 100,
            zeroResultRate: 0, // Would calculate from actual data
            topLocation
        }
    };
};

// ============================================
// AI-POWERED FUNCTIONS
// ============================================

/**
 * Generate AI keyword suggestions based on trends
 */
export const generateKeywordSuggestions = async (): Promise<KeywordSuggestion[]> => {
    const prompt = `You are an SEO expert for TriniBuild, a platform in Trinidad & Tobago.

Based on these trending search categories in T&T, suggest 5 high-opportunity keywords:
- Jobs and employment
- Real estate and rentals
- Events and tickets
- Transportation and rideshare
- Local services and merchants

For each keyword, provide:
1. The keyword phrase
2. Type: blog_topic, landing_page, or product_listing
3. Estimated monthly search volume (100-10000)
4. Difficulty score (1-100, lower is easier)
5. A suggested title for content
6. Target location in T&T (if applicable)

Format as JSON array:
[{"keyword": "...", "type": "...", "volume": 500, "difficulty": 30, "title": "...", "location": "..."}]`;

    try {
        const response = await aiService.generateText(prompt,
            'You are an AI keyword research assistant for Trinidad & Tobago.'
        );

        // Parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];

        const suggestions = JSON.parse(jsonMatch[0]) as Array<{
            keyword: string;
            type: string;
            volume: number;
            difficulty: number;
            title: string;
            location?: string;
        }>;

        // Save to database
        const toInsert = suggestions.map(s => ({
            keyword: s.keyword,
            suggestion_type: s.type,
            estimated_volume: s.volume,
            difficulty_score: s.difficulty,
            opportunity_score: calculateOpportunityScore(s.volume, 0.05),
            suggested_title: s.title,
            target_location: s.location,
            status: 'pending' as const
        }));

        const { data } = await supabase
            .from('keyword_suggestions')
            .insert(toInsert)
            .select();

        return (data || []) as KeywordSuggestion[];
    } catch (err) {
        console.error('Error generating suggestions:', err);
        return [];
    }
};

/**
 * Generate blog topic suggestions based on keyword gaps
 */
export const generateBlogTopicsFromGaps = async (
    gaps: KeywordGap[]
): Promise<string[]> => {
    if (gaps.length === 0) return [];

    const keywords = gaps.map(g => g.keyword_normalized).join(', ');

    const prompt = `You are a content strategist for TriniBuild in Trinidad & Tobago.

These keywords have high search volume but no content on the platform:
${keywords}

Suggest 5 blog article titles that would rank for these keywords.
Include the location (Trinidad or Tobago) where relevant.
Make titles SEO-friendly and clickable.

Return only the titles, one per line.`;

    try {
        const response = await aiService.generateText(prompt,
            'You are a T&T content strategist.'
        );

        return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    } catch (err) {
        console.error('Error generating blog topics:', err);
        return [];
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate opportunity score for a keyword
 */
const calculateOpportunityScore = (
    volume: number,
    ctr: number,
    competition = 0.5
): number => {
    // Higher volume = higher opportunity
    const volumeScore = Math.min(volume / 100, 50); // Max 50 points from volume

    // Higher CTR = higher opportunity
    const ctrScore = ctr * 30; // Max 30 points from CTR

    // Lower competition = higher opportunity
    const competitionScore = (1 - competition) * 20; // Max 20 points from low competition

    return Math.min(100, Math.round(volumeScore + ctrScore + competitionScore));
};

/**
 * Normalize a keyword for consistent tracking
 */
export const normalizeKeyword = (keyword: string): string => {
    return keyword
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s-]/g, '');
};

/**
 * Extract location from keyword
 */
export const extractLocationFromKeyword = (keyword: string): string | null => {
    const locations = [
        'port of spain', 'san fernando', 'chaguanas', 'arima', 'point fortin',
        'scarborough', 'diego martin', 'tunapuna', 'marabella', 'couva',
        'sangre grande', 'princes town', 'siparia', 'penal', 'rio claro',
        'mayaro', 'toco', 'tobago', 'trinidad'
    ];

    const lowerKeyword = keyword.toLowerCase();

    for (const location of locations) {
        if (lowerKeyword.includes(location)) {
            return location;
        }
    }

    return null;
};

// ============================================
// EXPORTS
// ============================================

export default {
    logKeywordSearch,
    logSearchClick,
    logSearchConversion,
    getTopKeywords,
    getRisingKeywords,
    getKeywordGaps,
    getLocationHeatmaps,
    getKeywordAlerts,
    getKeywordSuggestions,
    getKeywordDashboardData,
    generateKeywordSuggestions,
    generateBlogTopicsFromGaps,
    normalizeKeyword,
    extractLocationFromKeyword
};
