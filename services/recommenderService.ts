/**
 * TriniBuild AI Recommender System Service
 * Key: for_you_engine
 * 
 * Personalized recommendation engine for discovery across all verticals.
 */

import { supabase } from './supabaseClient';
import { aiService } from './ai';

// ============================================
// TYPES
// ============================================

export type RecommendationType =
    | 'jobs'
    | 'properties'
    | 'events'
    | 'rides'
    | 'stores'
    | 'products'
    | 'services'
    | 'blogs';

export interface RecommendationItem {
    id: string;
    type: RecommendationType;
    title: string;
    subtitle: string;
    description?: string;
    image?: string;
    price?: number;
    price_label?: string;
    location?: string;
    rating?: number;
    trust_score?: number;
    reason: string; // Why this was recommended
    url: string;
    metadata: Record<string, unknown>;
    score: number; // Internal relevance score
}

export interface UserPreferences {
    user_id: string;
    preferred_locations: string[];
    preferred_categories: string[];
    price_range_min?: number;
    price_range_max?: number;
    job_types?: string[];
    property_types?: string[];
    event_types?: string[];
    interests: string[];
}

export interface UserActivity {
    user_id: string;
    searches: { query: string; count: number; last_at: string }[];
    views: { type: string; id: string; count: number; last_at: string }[];
    clicks: { type: string; id: string; timestamp: string }[];
    saves: { type: string; id: string; timestamp: string }[];
    bookings: { type: string; id: string; timestamp: string }[];
}

export interface RecommendationFeed {
    user_id: string;
    items: RecommendationItem[];
    generated_at: string;
    expires_at: string;
}

// ============================================
// USER ACTIVITY TRACKING
// ============================================

/**
 * Track a user view
 */
export const trackView = async (
    userId: string | null,
    itemType: RecommendationType,
    itemId: string,
    sessionId?: string
): Promise<void> => {
    await supabase.from('user_activity').insert({
        user_id: userId,
        session_id: sessionId || getSessionId(),
        activity_type: 'view',
        item_type: itemType,
        item_id: itemId
    });
};

/**
 * Track a user click
 */
export const trackClick = async (
    userId: string | null,
    itemType: RecommendationType,
    itemId: string,
    context?: string
): Promise<void> => {
    await supabase.from('user_activity').insert({
        user_id: userId,
        session_id: getSessionId(),
        activity_type: 'click',
        item_type: itemType,
        item_id: itemId,
        context
    });
};

/**
 * Track a search
 */
export const trackSearch = async (
    userId: string | null,
    query: string,
    resultsCount: number
): Promise<void> => {
    await supabase.from('user_activity').insert({
        user_id: userId,
        session_id: getSessionId(),
        activity_type: 'search',
        search_query: query,
        results_count: resultsCount
    });
};

/**
 * Track a save/bookmark
 */
export const trackSave = async (
    userId: string,
    itemType: RecommendationType,
    itemId: string
): Promise<void> => {
    await supabase.from('user_activity').insert({
        user_id: userId,
        activity_type: 'save',
        item_type: itemType,
        item_id: itemId
    });
};

// ============================================
// USER PREFERENCES
// ============================================

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;
    return data as UserPreferences;
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
    userId: string,
    preferences: Partial<UserPreferences>
): Promise<void> => {
    await supabase
        .from('user_preferences')
        .upsert({
            user_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
        });
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = async (userId: string): Promise<{
    topSearches: string[];
    topCategories: string[];
    topLocations: string[];
    recentViews: { type: string; id: string }[];
}> => {
    // Get recent activity
    const { data: activity } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

    if (!activity) {
        return { topSearches: [], topCategories: [], topLocations: [], recentViews: [] };
    }

    // Aggregate searches
    const searchCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const recentViews: { type: string; id: string }[] = [];

    for (const a of activity) {
        if (a.activity_type === 'search' && a.search_query) {
            searchCounts.set(a.search_query, (searchCounts.get(a.search_query) || 0) + 1);
        }
        if (a.item_type) {
            categoryCounts.set(a.item_type, (categoryCounts.get(a.item_type) || 0) + 1);
        }
        if (a.activity_type === 'view' && recentViews.length < 10) {
            recentViews.push({ type: a.item_type, id: a.item_id });
        }
    }

    return {
        topSearches: Array.from(searchCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([q]) => q),
        topCategories: Array.from(categoryCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([c]) => c),
        topLocations: [], // Would extract from searches/views
        recentViews
    };
};

// ============================================
// RECOMMENDATION GENERATION
// ============================================

/**
 * Get personalized recommendations for a user
 */
export const getRecommendations = async (
    userId: string | null,
    options: {
        types?: RecommendationType[];
        limit?: number;
        location?: string;
    } = {}
): Promise<RecommendationItem[]> => {
    const { types = ['jobs', 'properties', 'events', 'stores'], limit = 20, location } = options;

    let preferences: UserPreferences | null = null;
    let activitySummary: { topSearches: string[]; topCategories: string[] } | null = null;

    if (userId) {
        [preferences, activitySummary] = await Promise.all([
            getUserPreferences(userId),
            getUserActivitySummary(userId)
        ]);
    }

    // Build recommendations from each type
    const allRecommendations: RecommendationItem[] = [];

    if (types.includes('jobs')) {
        const jobs = await getJobRecommendations(preferences, activitySummary, location, limit);
        allRecommendations.push(...jobs);
    }

    if (types.includes('properties')) {
        const properties = await getPropertyRecommendations(preferences, location, limit);
        allRecommendations.push(...properties);
    }

    if (types.includes('events')) {
        const events = await getEventRecommendations(preferences, location, limit);
        allRecommendations.push(...events);
    }

    if (types.includes('stores')) {
        const stores = await getStoreRecommendations(preferences, activitySummary, limit);
        allRecommendations.push(...stores);
    }

    if (types.includes('blogs')) {
        const blogs = await getBlogRecommendations(activitySummary, limit);
        allRecommendations.push(...blogs);
    }

    // Sort by relevance score and diversify
    return diversifyRecommendations(allRecommendations, limit);
};

/**
 * Get job recommendations
 */
const getJobRecommendations = async (
    preferences: UserPreferences | null,
    activity: { topSearches: string[]; topCategories: string[] } | null,
    location?: string,
    limit = 5
): Promise<RecommendationItem[]> => {
    let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Apply location filter
    if (location || preferences?.preferred_locations?.[0]) {
        const loc = location || preferences!.preferred_locations[0];
        query = query.ilike('location', `%${loc}%`);
    }

    // Apply salary filter
    if (preferences?.price_range_max) {
        query = query.lte('salary_max', preferences.price_range_max);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((job: any) => ({
        id: job.id,
        type: 'jobs' as RecommendationType,
        title: job.title,
        subtitle: job.company_name || 'Company',
        description: job.description?.substring(0, 100),
        price: job.salary_max,
        price_label: job.salary_max ? `$${job.salary_max.toLocaleString()}/mo` : 'Negotiable',
        location: job.location,
        url: `/jobs/${job.id}`,
        reason: getJobReason(job, preferences, activity),
        score: calculateJobScore(job, preferences, activity),
        metadata: { job_type: job.job_type, category: job.category }
    }));
};

/**
 * Get property recommendations
 */
const getPropertyRecommendations = async (
    preferences: UserPreferences | null,
    location?: string,
    limit = 5
): Promise<RecommendationItem[]> => {
    let query = supabase
        .from('real_estate_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (location || preferences?.preferred_locations?.[0]) {
        const loc = location || preferences!.preferred_locations[0];
        query = query.ilike('location', `%${loc}%`);
    }

    if (preferences?.price_range_max) {
        query = query.lte('price', preferences.price_range_max);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((prop: any) => ({
        id: prop.id,
        type: 'properties' as RecommendationType,
        title: prop.title,
        subtitle: `${prop.bedrooms} bed • ${prop.bathrooms} bath`,
        description: prop.description?.substring(0, 100),
        image: prop.images?.[0],
        price: prop.price,
        price_label: `$${prop.price?.toLocaleString()}/mo`,
        location: prop.location,
        url: `/real-estate/${prop.id}`,
        reason: 'Matches your location preferences',
        score: 75,
        metadata: { property_type: prop.property_type, bedrooms: prop.bedrooms }
    }));
};

/**
 * Get event recommendations
 */
const getEventRecommendations = async (
    preferences: UserPreferences | null,
    location?: string,
    limit = 5
): Promise<RecommendationItem[]> => {
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(limit);

    if (error || !data) return [];

    return data.map((event: any) => ({
        id: event.id,
        type: 'events' as RecommendationType,
        title: event.title,
        subtitle: new Date(event.event_date).toLocaleDateString('en-TT', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }),
        image: event.image_url,
        price: event.ticket_price,
        price_label: event.ticket_price ? `$${event.ticket_price}` : 'Free',
        location: event.venue,
        url: `/events/${event.id}`,
        reason: 'Upcoming event near you',
        score: 70,
        metadata: { event_date: event.event_date, category: event.category }
    }));
};

/**
 * Get store recommendations
 */
const getStoreRecommendations = async (
    preferences: UserPreferences | null,
    activity: { topCategories: string[] } | null,
    limit = 5
): Promise<RecommendationItem[]> => {
    const { data, error } = await supabase
        .from('storefronts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map((store: any) => ({
        id: store.id,
        type: 'stores' as RecommendationType,
        title: store.name,
        subtitle: store.tagline || 'TriniBuild Store',
        image: store.logo_url,
        rating: store.average_rating,
        url: `/store/${store.slug}`,
        reason: 'Popular local business',
        score: 65,
        metadata: { category: store.category }
    }));
};

/**
 * Get blog recommendations
 */
const getBlogRecommendations = async (
    activity: { topSearches: string[] } | null,
    limit = 5
): Promise<RecommendationItem[]> => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (error || !data) return [];

    return data.map((blog: any) => ({
        id: blog.id,
        type: 'blogs' as RecommendationType,
        title: blog.h1,
        subtitle: `${blog.reading_time_minutes} min read`,
        image: blog.featured_image,
        location: blog.location_name,
        url: `/blog/location/${blog.url_slug}`,
        reason: 'Trending article',
        score: 60,
        metadata: { vertical: blog.vertical_key }
    }));
};

// ============================================
// SCORING FUNCTIONS
// ============================================

const calculateJobScore = (
    job: any,
    preferences: UserPreferences | null,
    activity: { topSearches: string[]; topCategories: string[] } | null
): number => {
    let score = 50;

    // Recency bonus
    const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 1) score += 20;
    else if (daysOld < 7) score += 10;

    // Location match
    if (preferences?.preferred_locations?.some(loc =>
        job.location?.toLowerCase().includes(loc.toLowerCase())
    )) {
        score += 15;
    }

    // Category match
    if (activity?.topCategories?.includes('jobs')) {
        score += 10;
    }

    // Search query match
    if (activity?.topSearches?.some(q =>
        job.title?.toLowerCase().includes(q.toLowerCase()) ||
        job.description?.toLowerCase().includes(q.toLowerCase())
    )) {
        score += 15;
    }

    return Math.min(100, score);
};

const getJobReason = (
    job: any,
    preferences: UserPreferences | null,
    activity: { topSearches: string[]; topCategories: string[] } | null
): string => {
    if (activity?.topSearches?.some(q => job.title?.toLowerCase().includes(q.toLowerCase()))) {
        return 'Based on your searches';
    }
    if (preferences?.preferred_locations?.some(loc =>
        job.location?.toLowerCase().includes(loc.toLowerCase())
    )) {
        return `New job in ${job.location}`;
    }
    const daysOld = (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 1) {
        return 'Posted today';
    }
    return 'Recommended for you';
};

// ============================================
// DIVERSIFICATION
// ============================================

/**
 * Diversify recommendations to avoid showing too many of one type
 */
const diversifyRecommendations = (
    items: RecommendationItem[],
    limit: number
): RecommendationItem[] => {
    // Sort by score first
    const sorted = [...items].sort((a, b) => b.score - a.score);

    // Ensure diversity by type
    const result: RecommendationItem[] = [];
    const typeCounts = new Map<RecommendationType, number>();
    const maxPerType = Math.ceil(limit / 4);

    for (const item of sorted) {
        if (result.length >= limit) break;

        const currentCount = typeCounts.get(item.type) || 0;
        if (currentCount < maxPerType) {
            result.push(item);
            typeCounts.set(item.type, currentCount + 1);
        }
    }

    // Fill remaining slots
    for (const item of sorted) {
        if (result.length >= limit) break;
        if (!result.find(r => r.id === item.id)) {
            result.push(item);
        }
    }

    return result;
};

// ============================================
// FOR YOU FEED
// ============================================

/**
 * Get the "For You" feed for homepage
 */
export const getForYouFeed = async (
    userId: string | null,
    location?: string
): Promise<{
    featured: RecommendationItem[];
    jobs: RecommendationItem[];
    properties: RecommendationItem[];
    events: RecommendationItem[];
    stores: RecommendationItem[];
    blogs: RecommendationItem[];
}> => {
    const [featured, jobs, properties, events, stores, blogs] = await Promise.all([
        getRecommendations(userId, { limit: 6, location }),
        getRecommendations(userId, { types: ['jobs'], limit: 4, location }),
        getRecommendations(userId, { types: ['properties'], limit: 4, location }),
        getRecommendations(userId, { types: ['events'], limit: 4, location }),
        getRecommendations(userId, { types: ['stores'], limit: 4, location }),
        getRecommendations(userId, { types: ['blogs'], limit: 4, location })
    ]);

    return { featured, jobs, properties, events, stores, blogs };
};

// ============================================
// SIMILAR ITEMS
// ============================================

/**
 * Get similar items to a specific item
 */
export const getSimilarItems = async (
    itemType: RecommendationType,
    itemId: string,
    limit = 5
): Promise<RecommendationItem[]> => {
    // For now, just get other items of the same type
    // In production, this would use embeddings or collaborative filtering
    return getRecommendations(null, { types: [itemType], limit });
};

// ============================================
// UTILITIES
// ============================================

let sessionId: string | null = null;

const getSessionId = (): string => {
    if (sessionId) return sessionId;

    if (typeof window !== 'undefined') {
        sessionId = sessionStorage.getItem('tb_rec_session');
        if (!sessionId) {
            sessionId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('tb_rec_session', sessionId);
        }
    } else {
        sessionId = `rec_${Date.now()}`;
    }

    return sessionId;
};

// ============================================
// EXPORTS
// ============================================

export default {
    trackView,
    trackClick,
    trackSearch,
    trackSave,
    getUserPreferences,
    updateUserPreferences,
    getUserActivitySummary,
    getRecommendations,
    getForYouFeed,
    getSimilarItems
};
