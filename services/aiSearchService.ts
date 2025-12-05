/**
 * TriniBuild AI Search Engine Service
 * Key: island_search
 * 
 * The core AI-powered search that understands natural language queries
 * and returns multi-vertical results across jobs, real estate, events,
 * rideshare, marketplace, and more.
 */

import { supabase } from '../lib/supabase';
import { aiService } from './ai';
import { TRINIDAD_LOCATIONS, TrinidadLocation } from '../data/trinidadLocations';

// ============================================
// TYPES
// ============================================

export type SearchVertical =
    | 'jobs'
    | 'real_estate'
    | 'events'
    | 'rideshare'
    | 'marketplace'
    | 'stores'
    | 'blog'
    | 'services'
    | 'how_to';

export interface SearchIntent {
    query: string;
    verticals: SearchVertical[];
    location?: {
        name: string;
        slug: string;
        coordinates?: { lat: number; lng: number };
    };
    filters: {
        price_min?: number;
        price_max?: number;
        bedrooms?: number;
        date_from?: string;
        date_to?: string;
        category?: string;
        subcategory?: string;
    };
    keywords: string[];
    is_question: boolean;
    trini_slang_detected: string[];
}

export interface SearchResultItem {
    id: string;
    type: SearchVertical;
    title: string;
    subtitle: string;
    description: string;
    image?: string;
    price?: number;
    price_label?: string;
    location?: string;
    distance_km?: number;
    trust_score?: number;
    rating?: number;
    url: string;
    relevance_score: number;
    metadata: Record<string, unknown>;
}

export interface SearchResultBlock {
    vertical: SearchVertical;
    label: string;
    icon: string;
    results: SearchResultItem[];
    total_count: number;
    see_more_url: string;
}

export interface SearchResponse {
    query: string;
    intent: SearchIntent;
    blocks: SearchResultBlock[];
    suggestions: string[];
    did_you_mean?: string;
    how_to_answer?: string;
    total_results: number;
    search_time_ms: number;
}

// ============================================
// TRINI SLANG DICTIONARY
// ============================================

const TRINI_SLANG_MAP: Record<string, string[]> = {
    // Jobs & Work
    'wuk': ['work', 'job'],
    'gyul': ['girl', 'woman'],
    'fellas': ['fellows', 'men', 'guys'],
    'lime': ['hang out', 'social event', 'party'],
    'fete': ['party', 'event', 'celebration'],
    'maxi': ['maxi taxi', 'public transport', 'shared ride'],
    'PH': ['private hire', 'taxi'],
    'drop': ['taxi ride', 'ride', 'transport'],
    'reach': ['arrive', 'get to', 'go to'],
    'check': ['look at', 'find', 'visit'],
    'real': ['really', 'very', 'genuine'],
    'bess': ['best', 'great', 'excellent'],
    'sweet': ['good', 'nice', 'great'],
    'dotish': ['stupid', 'foolish'],
    'bacchanal': ['drama', 'commotion', 'trouble'],
    'bazodee': ['confused', 'dazed', 'love-struck'],
    'ting': ['thing', 'item', 'something'],
    'place': ['home', 'house', 'apartment'],
    'zess': ['gossip', 'drama', 'excitement'],
    'steups': ['frustration', 'annoyance'],
    'anytime': ['soon', 'eventually'],
    'just now': ['soon', 'in a bit', 'later'],
    'now for now': ['immediately', 'right now'],
    'small ting': ['easy', 'no problem', 'simple'],

    // Locations
    'd islands': ['Trinidad and Tobago', 'TT'],
    'town': ['Port of Spain', 'city'],
    'sando': ['San Fernando', 'south'],
    'chag': ['Chaguanas', 'central'],
    'toco': ['Toco'],

    // Housing
    'flat': ['apartment'],
    'bottom house': ['ground floor', 'downstairs unit'],
    'upstairs': ['upper floor', 'second floor'],

    // Money
    'ah bill': ['a thousand dollars', '$1000'],
    'ah grand': ['a thousand dollars', '$1000'],
    'lil change': ['small amount', 'cheap'],
    'real money': ['expensive', 'high price'],
};

// ============================================
// SEARCH INTENT PARSER
// ============================================

/**
 * Parse a natural language search query into structured intent
 */
export const parseSearchIntent = async (query: string): Promise<SearchIntent> => {
    const normalizedQuery = query.toLowerCase().trim();

    // Detect Trini slang
    const detectedSlang: string[] = [];
    let processedQuery = normalizedQuery;

    for (const [slang, meanings] of Object.entries(TRINI_SLANG_MAP)) {
        if (normalizedQuery.includes(slang)) {
            detectedSlang.push(slang);
            // Replace with first standard meaning for processing
            processedQuery = processedQuery.replace(new RegExp(slang, 'gi'), meanings[0]);
        }
    }

    // Detect verticals from keywords
    const verticals: SearchVertical[] = [];
    const verticalKeywords: Record<SearchVertical, string[]> = {
        jobs: ['job', 'jobs', 'work', 'employment', 'hiring', 'vacancy', 'career', 'gig', 'freelance', 'part-time', 'full-time'],
        real_estate: ['rent', 'rental', 'rentals', 'apartment', 'house', 'property', 'room', 'bedroom', 'bed', 'flat', 'condo', 'land', 'buy', 'sell', 'lease'],
        events: ['event', 'events', 'ticket', 'tickets', 'concert', 'show', 'fete', 'party', 'festival', 'carnival', 'weekend', 'tonight', 'this week'],
        rideshare: ['taxi', 'ride', 'driver', 'drop', 'maxi', 'transport', 'from', 'to', 'airport', 'piarco'],
        marketplace: ['buy', 'sell', 'product', 'for sale', 'used', 'new', 'phone', 'car', 'furniture', 'electronics'],
        stores: ['store', 'shop', 'business', 'vendor', 'seller', 'merchant'],
        services: ['service', 'repair', 'fix', 'plumber', 'electrician', 'mechanic', 'painter', 'cleaner', 'barber', 'salon', 'makeup'],
        blog: ['article', 'blog', 'read', 'learn', 'how to', 'guide', 'tips'],
        how_to: ['how', 'what', 'where', 'when', 'why', 'can i', 'do i', 'help']
    };

    for (const [vertical, keywords] of Object.entries(verticalKeywords)) {
        if (keywords.some(kw => processedQuery.includes(kw))) {
            verticals.push(vertical as SearchVertical);
        }
    }

    // Default to multi-vertical search if no specific vertical detected
    if (verticals.length === 0) {
        verticals.push('jobs', 'marketplace', 'services', 'real_estate');
    }

    // Detect location
    let location: SearchIntent['location'] | undefined;
    for (const loc of TRINIDAD_LOCATIONS) {
        const locLower = loc.name.toLowerCase();
        if (processedQuery.includes(locLower)) {
            location = {
                name: loc.name,
                slug: loc.slug,
                coordinates: loc.coordinates
            };
            break;
        }
        // Check alternative names
        if (loc.alternative_names?.some(alt => processedQuery.includes(alt.toLowerCase()))) {
            location = {
                name: loc.name,
                slug: loc.slug,
                coordinates: loc.coordinates
            };
            break;
        }
    }

    // Extract price filters
    const priceMatch = processedQuery.match(/(?:under|below|less than|max|up to)\s*\$?(\d+)/i);
    const priceMin = processedQuery.match(/(?:above|over|more than|min|at least)\s*\$?(\d+)/i);

    // Extract bedroom count
    const bedroomMatch = processedQuery.match(/(\d+)\s*(?:bed(?:room)?s?|br)/i);

    // Check if it's a question
    const isQuestion = /^(how|what|where|when|why|can|do|is|are|should|would|could)\b/i.test(normalizedQuery) ||
        normalizedQuery.includes('?');

    // Extract keywords (remove common words)
    const stopWords = ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'i', 'me', 'my'];
    const keywords = processedQuery
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));

    return {
        query: normalizedQuery,
        verticals,
        location,
        filters: {
            price_max: priceMatch ? parseInt(priceMatch[1]) : undefined,
            price_min: priceMin ? parseInt(priceMin[1]) : undefined,
            bedrooms: bedroomMatch ? parseInt(bedroomMatch[1]) : undefined
        },
        keywords,
        is_question: isQuestion,
        trini_slang_detected: detectedSlang
    };
};

// ============================================
// DATABASE SEARCH FUNCTIONS
// ============================================

/**
 * Search jobs table
 */
const searchJobs = async (intent: SearchIntent, limit = 5): Promise<SearchResultItem[]> => {
    let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(limit);

    // Apply location filter
    if (intent.location) {
        query = query.or(`location.ilike.%${intent.location.name}%,parish.ilike.%${intent.location.name}%`);
    }

    // Apply price/salary filter
    if (intent.filters.price_max) {
        query = query.lte('salary_max', intent.filters.price_max);
    }

    // Apply keyword search
    if (intent.keywords.length > 0) {
        const keywordFilter = intent.keywords.map(kw => `title.ilike.%${kw}%`).join(',');
        query = query.or(keywordFilter);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((job: any) => ({
        id: job.id,
        type: 'jobs' as SearchVertical,
        title: job.title,
        subtitle: job.company_name || 'Company',
        description: job.description?.substring(0, 150) + '...',
        price: job.salary_max,
        price_label: job.salary_max ? `$${job.salary_max.toLocaleString()}/month` : 'Negotiable',
        location: job.location,
        trust_score: job.trust_score || 70,
        url: `/jobs/${job.id}`,
        relevance_score: calculateRelevance(job.title + ' ' + job.description, intent.keywords),
        metadata: { job_type: job.job_type, category: job.category }
    }));
};

/**
 * Search real estate listings
 */
const searchRealEstate = async (intent: SearchIntent, limit = 5): Promise<SearchResultItem[]> => {
    let query = supabase
        .from('real_estate_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (intent.location) {
        query = query.or(`location.ilike.%${intent.location.name}%,area.ilike.%${intent.location.name}%`);
    }

    if (intent.filters.price_max) {
        query = query.lte('price', intent.filters.price_max);
    }

    if (intent.filters.bedrooms) {
        query = query.eq('bedrooms', intent.filters.bedrooms);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((listing: any) => ({
        id: listing.id,
        type: 'real_estate' as SearchVertical,
        title: listing.title,
        subtitle: `${listing.bedrooms} bed • ${listing.bathrooms} bath • ${listing.property_type}`,
        description: listing.description?.substring(0, 150) + '...',
        image: listing.images?.[0],
        price: listing.price,
        price_label: `$${listing.price?.toLocaleString()}/mo`,
        location: listing.location,
        trust_score: listing.trust_score || 65,
        url: `/real-estate/${listing.id}`,
        relevance_score: calculateRelevance(listing.title + ' ' + listing.description, intent.keywords),
        metadata: { property_type: listing.property_type, listing_type: listing.listing_type }
    }));
};

/**
 * Search events/tickets
 */
const searchEvents = async (intent: SearchIntent, limit = 5): Promise<SearchResultItem[]> => {
    let query = supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(limit);

    if (intent.location) {
        query = query.ilike('venue', `%${intent.location.name}%`);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((event: any) => ({
        id: event.id,
        type: 'events' as SearchVertical,
        title: event.title,
        subtitle: new Date(event.event_date).toLocaleDateString('en-TT', { weekday: 'long', month: 'short', day: 'numeric' }),
        description: event.description?.substring(0, 150) + '...',
        image: event.image_url,
        price: event.ticket_price,
        price_label: event.ticket_price ? `$${event.ticket_price} per ticket` : 'Free Entry',
        location: event.venue,
        url: `/events/${event.id}`,
        relevance_score: calculateRelevance(event.title + ' ' + event.description, intent.keywords),
        metadata: { event_date: event.event_date, category: event.category }
    }));
};

/**
 * Search marketplace/stores
 */
const searchMarketplace = async (intent: SearchIntent, limit = 5): Promise<SearchResultItem[]> => {
    // Search storefronts
    let query = supabase
        .from('storefronts')
        .select('*, user_profiles!inner(*)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (intent.keywords.length > 0) {
        const keywordFilter = intent.keywords.map(kw => `name.ilike.%${kw}%`).join(',');
        query = query.or(keywordFilter);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((store: any) => ({
        id: store.id,
        type: 'stores' as SearchVertical,
        title: store.name,
        subtitle: store.tagline || 'TriniBuild Store',
        description: store.description?.substring(0, 150) + '...',
        image: store.logo_url,
        location: store.user_profiles?.location,
        trust_score: store.user_profiles?.trust_score || 60,
        rating: store.average_rating,
        url: `/store/${store.slug}`,
        relevance_score: calculateRelevance(store.name + ' ' + store.description, intent.keywords),
        metadata: { category: store.category }
    }));
};

/**
 * Search blog articles
 */
const searchBlogs = async (intent: SearchIntent, limit = 5): Promise<SearchResultItem[]> => {
    let query = supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

    if (intent.location) {
        query = query.ilike('location_name', `%${intent.location.name}%`);
    }

    if (intent.keywords.length > 0) {
        const keywordFilter = intent.keywords.map(kw => `seo_title.ilike.%${kw}%`).join(',');
        query = query.or(keywordFilter);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((blog: any) => ({
        id: blog.id,
        type: 'blog' as SearchVertical,
        title: blog.h1,
        subtitle: `${blog.reading_time_minutes} min read • ${blog.vertical_label}`,
        description: blog.excerpt || blog.meta_description,
        image: blog.featured_image,
        location: blog.location_name,
        url: `/blog/location/${blog.url_slug}`,
        relevance_score: calculateRelevance(blog.seo_title + ' ' + blog.meta_description, intent.keywords),
        metadata: { vertical: blog.vertical_key, word_count: blog.word_count }
    }));
};

// ============================================
// HOW-TO ANSWER GENERATOR
// ============================================

/**
 * Generate AI answer for "how to" questions
 */
const generateHowToAnswer = async (query: string): Promise<string> => {
    const prompt = `You are a helpful assistant for TriniBuild, a platform in Trinidad & Tobago.
  
User Question: "${query}"

Provide a helpful, concise answer (2-3 sentences max) that:
1. Directly answers their question
2. Mentions how TriniBuild can help if relevant
3. Uses friendly Caribbean tone

Answer:`;

    try {
        const response = await aiService.generateText(prompt, 'You are a TriniBuild assistant.');
        return response;
    } catch {
        return '';
    }
};

// ============================================
// RELEVANCE SCORING
// ============================================

const calculateRelevance = (text: string, keywords: string[]): number => {
    if (!text || keywords.length === 0) return 50;

    const lowerText = text.toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
            matches++;
        }
    }

    return Math.min(100, 50 + (matches / keywords.length) * 50);
};

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Execute a search across all relevant verticals
 */
export const performSearch = async (
    query: string,
    options: {
        limit_per_vertical?: number;
        verticals?: SearchVertical[];
        user_location?: { lat: number; lng: number };
    } = {}
): Promise<SearchResponse> => {
    const startTime = Date.now();
    const { limit_per_vertical = 5, verticals: forceVerticals } = options;

    // Parse user intent
    const intent = await parseSearchIntent(query);

    // Override verticals if specified
    const searchVerticals = forceVerticals || intent.verticals;

    // Execute parallel searches
    const searchPromises: Promise<{ vertical: SearchVertical; results: SearchResultItem[] }>[] = [];

    if (searchVerticals.includes('jobs')) {
        searchPromises.push(
            searchJobs(intent, limit_per_vertical).then(results => ({ vertical: 'jobs', results }))
        );
    }

    if (searchVerticals.includes('real_estate')) {
        searchPromises.push(
            searchRealEstate(intent, limit_per_vertical).then(results => ({ vertical: 'real_estate', results }))
        );
    }

    if (searchVerticals.includes('events')) {
        searchPromises.push(
            searchEvents(intent, limit_per_vertical).then(results => ({ vertical: 'events', results }))
        );
    }

    if (searchVerticals.includes('stores') || searchVerticals.includes('marketplace')) {
        searchPromises.push(
            searchMarketplace(intent, limit_per_vertical).then(results => ({ vertical: 'stores', results }))
        );
    }

    if (searchVerticals.includes('blog')) {
        searchPromises.push(
            searchBlogs(intent, limit_per_vertical).then(results => ({ vertical: 'blog', results }))
        );
    }

    // Get how-to answer if it's a question
    let howToAnswer: string | undefined;
    if (intent.is_question) {
        howToAnswer = await generateHowToAnswer(query);
    }

    // Wait for all searches
    const searchResults = await Promise.all(searchPromises);

    // Format into blocks
    const verticalLabels: Record<SearchVertical, { label: string; icon: string; see_more: string }> = {
        jobs: { label: 'Jobs & Gigs', icon: 'briefcase', see_more: '/jobs' },
        real_estate: { label: 'Real Estate', icon: 'home', see_more: '/real-estate' },
        events: { label: 'Events & Tickets', icon: 'ticket', see_more: '/tickets' },
        rideshare: { label: 'Rides', icon: 'car', see_more: '/rides' },
        marketplace: { label: 'Marketplace', icon: 'shopping-bag', see_more: '/marketplace' },
        stores: { label: 'Stores', icon: 'store', see_more: '/marketplace' },
        services: { label: 'Services', icon: 'wrench', see_more: '/services' },
        blog: { label: 'Articles', icon: 'book-open', see_more: '/blog' },
        how_to: { label: 'Help', icon: 'help-circle', see_more: '/help' }
    };

    const blocks: SearchResultBlock[] = searchResults
        .filter(r => r.results.length > 0)
        .map(r => ({
            vertical: r.vertical,
            label: verticalLabels[r.vertical].label,
            icon: verticalLabels[r.vertical].icon,
            results: r.results.sort((a, b) => b.relevance_score - a.relevance_score),
            total_count: r.results.length,
            see_more_url: verticalLabels[r.vertical].see_more + (intent.location ? `?location=${intent.location.slug}` : '')
        }));

    // Generate search suggestions
    const suggestions = generateSuggestions(intent);

    // Calculate total results
    const totalResults = blocks.reduce((sum, b) => sum + b.total_count, 0);

    return {
        query,
        intent,
        blocks,
        suggestions,
        how_to_answer: howToAnswer,
        total_results: totalResults,
        search_time_ms: Date.now() - startTime
    };
};

/**
 * Generate related search suggestions
 */
const generateSuggestions = (intent: SearchIntent): string[] => {
    const suggestions: string[] = [];

    if (intent.location) {
        suggestions.push(`events in ${intent.location.name}`);
        suggestions.push(`jobs in ${intent.location.name}`);
        suggestions.push(`rentals in ${intent.location.name}`);
    }

    if (intent.verticals.includes('jobs')) {
        suggestions.push('work from home jobs Trinidad');
        suggestions.push('part-time jobs near me');
    }

    if (intent.verticals.includes('real_estate')) {
        suggestions.push('cheap rentals Trinidad');
        suggestions.push('apartments for rent');
    }

    return suggestions.slice(0, 5);
};

// ============================================
// QUICK SEARCH (for autocomplete)
// ============================================

export const quickSearch = async (query: string, limit = 8): Promise<{
    locations: string[];
    categories: string[];
    recent: string[];
}> => {
    const normalizedQuery = query.toLowerCase().trim();

    // Match locations
    const matchingLocations = TRINIDAD_LOCATIONS
        .filter(loc => loc.name.toLowerCase().includes(normalizedQuery))
        .slice(0, 3)
        .map(loc => loc.name);

    // Common category suggestions
    const categories = [
        'Jobs', 'Rentals', 'Events', 'Rides', 'Stores', 'Services'
    ].filter(c => c.toLowerCase().includes(normalizedQuery));

    // Recent/popular searches (would come from analytics)
    const recent = [
        'jobs in Port of Spain',
        'apartments for rent in San Fernando',
        'events this weekend',
        'taxi to airport'
    ].filter(r => r.toLowerCase().includes(normalizedQuery));

    return {
        locations: matchingLocations,
        categories: categories.slice(0, 3),
        recent: recent.slice(0, 3)
    };
};

// ============================================
// EXPORTS
// ============================================

export default {
    performSearch,
    parseSearchIntent,
    quickSearch
};
