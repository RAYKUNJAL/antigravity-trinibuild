/**
 * TriniBuild AI Marketplace Concierge Service
 * Key: service_concierge
 * 
 * Multi-agent AI concierge for guiding users to services, jobs, tickets, rentals.
 * Natural language conversation with T&T context awareness.
 */

import { aiService } from './ai';
import { supabase } from './supabaseClient';
import { performSearch, SearchVertical } from './aiSearchService';
import { logKeywordSearch } from './keywordEngineService';

// ============================================
// TYPES
// ============================================

export type ConciergePersona =
    | 'general'
    | 'jobs'
    | 'real_estate'
    | 'services'
    | 'events'
    | 'rideshare'
    | 'marketplace'
    | 'business_expert';

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: {
        intent?: string;
        entities?: Record<string, string>;
        suggestions?: string[];
        quickActions?: QuickAction[];
        results?: ConciergeResult[];
    };
}

export interface QuickAction {
    label: string;
    action: string;
    url?: string;
    data?: Record<string, unknown>;
}

export interface ConciergeResult {
    id: string;
    type: SearchVertical;
    title: string;
    subtitle: string;
    url: string;
    image?: string;
    price?: string;
    location?: string;
}

export interface ConciergeSession {
    id: string;
    userId?: string;
    persona: ConciergePersona;
    messages: ConversationMessage[];
    context: {
        location?: string;
        preferences?: Record<string, unknown>;
        lastSearchQuery?: string;
        lastResults?: ConciergeResult[];
    };
    startedAt: string;
    lastActivityAt: string;
}

export interface ConciergeResponse {
    message: string;
    suggestions?: string[];
    quickActions?: QuickAction[];
    results?: ConciergeResult[];
    shouldShowResults?: boolean;
}

// ============================================
// PERSONA SYSTEM PROMPTS
// ============================================

const PERSONA_PROMPTS: Record<ConciergePersona, string> = {
    general: `You are TriniBuild's AI Concierge - a friendly, helpful assistant for Trinidad & Tobago's leading digital platform.

You help users with:
- Finding jobs and gig work
- Discovering rentals and properties
- Booking events and buying tickets
- Finding local services and professionals
- Shopping in the marketplace
- Understanding TriniBuild features

Speak naturally with a warm Caribbean tone. Use common Trini expressions when appropriate (like "no problem", "doh worry", "real good").

Always be concise but helpful. If you can answer directly, do so. If search results would help, guide the user to what they're looking for.`,

    jobs: `You are TriniBuild's Jobs Concierge specializing in Trinidad & Tobago employment.

You help with:
- Finding job openings matching skills and location
- Resume and cover letter advice (local context)
- Understanding T&T labor laws and contracts
- Gig work and freelance opportunities
- Salary expectations for local market

Be encouraging and practical. Understand T&T job market nuances.`,

    real_estate: `You are TriniBuild's Real Estate Concierge for Trinidad & Tobago properties.

You help with:
- Finding rentals (apartments, houses, rooms)
- Property buying guidance
- Understanding T&T rental market (deposits, agreements)
- Neighborhood information across T&T
- Connecting with landlords and agents

Know about areas like Port of Spain, San Fernando, Chaguanas, Diego Martin, etc.`,

    services: `You are TriniBuild's Services Concierge connecting users with local professionals.

You help find:
- Contractors (plumbers, electricians, AC technicians)
- Home services (cleaning, landscaping, pest control)
- Professional services (lawyers, accountants)
- Personal services (hair, beauty, fitness)
- Auto services (mechanics, detailing)

Match users with verified, trusted providers.`,

    events: `You are TriniBuild's Events Concierge for T&T entertainment.

You help with:
- Carnival events and fete tickets
- Concerts and shows
- Community events and festivals
- Sport events and watch parties
- Cultural celebrations

Know about popular venues, promoters, and T&T event culture.`,

    rideshare: `You are TriniBuild QuickRides Concierge for transportation.

You help with:
- Booking rides around Trinidad & Tobago
- Route planning and estimated costs
- Driver information and ratings
- Airport pickups and drops
- Maxi taxi routes and tips

Understand T&T traffic patterns and local terminology.`,

    marketplace: `You are TriniBuild's Marketplace Concierge for buying and selling.

You help with:
- Finding products and deals
- Selling items effectively
- Price guidance for used goods
- Safe transaction tips
- Store and vendor recommendations`,

    business_expert: `You are TriniBuild's Business Expert - a consultant for T&T entrepreneurs.

You provide guidance on:
- Business registration with Ministry of Legal Affairs
- BIR Number and TAMIS registration
- Opening business bank accounts (Republic, FCB, Scotiabank)
- Visa applications at US, UK, Canada embassies
- Legal document requirements
- Loan and mortgage preparation

Be professional and precise. Cite relevant T&T regulations when helpful.`
};

// ============================================
// INTENT DETECTION
// ============================================

const INTENT_PATTERNS: { pattern: RegExp; intent: string; vertical?: SearchVertical }[] = [
    // Jobs
    { pattern: /\b(job|work|hire|hiring|employment|career|gig|vacancy)\b/i, intent: 'job_search', vertical: 'jobs' },
    { pattern: /\b(resume|cv|cover letter|apply|application)\b/i, intent: 'job_help' },

    // Real Estate
    { pattern: /\b(rent|rental|apartment|house|property|room|flat|lease)\b/i, intent: 'property_search', vertical: 'real_estate' },
    { pattern: /\b(buy|purchase|sale|land|acre|lot)\b/i, intent: 'property_buy', vertical: 'real_estate' },

    // Events
    { pattern: /\b(ticket|event|fete|party|concert|show|carnival)\b/i, intent: 'event_search', vertical: 'events' },

    // Services
    { pattern: /\b(plumber|electrician|mechanic|contractor|technician|cleaner)\b/i, intent: 'service_search', vertical: 'services' },
    { pattern: /\b(fix|repair|install|service|maintenance)\b/i, intent: 'service_search', vertical: 'services' },

    // Rideshare
    { pattern: /\b(ride|taxi|maxi|transport|drop|pickup|airport)\b/i, intent: 'ride_search', vertical: 'rideshare' },

    // Marketplace
    { pattern: /\b(buy|sell|shop|store|product|item|price)\b/i, intent: 'marketplace_search', vertical: 'marketplace' },

    // Business
    { pattern: /\b(bank account|bir number|business registration|visa|loan|mortgage)\b/i, intent: 'business_help' },

    // General
    { pattern: /\b(help|how|what|where|when|who)\b/i, intent: 'question' },
    { pattern: /\b(hi|hello|hey|good morning|good afternoon)\b/i, intent: 'greeting' },
    { pattern: /\b(thanks|thank you|appreciate)\b/i, intent: 'thanks' }
];

const detectIntent = (message: string): { intent: string; vertical?: SearchVertical } => {
    for (const { pattern, intent, vertical } of INTENT_PATTERNS) {
        if (pattern.test(message)) {
            return { intent, vertical };
        }
    }
    return { intent: 'general' };
};

// ============================================
// QUICK RESPONSES
// ============================================

const QUICK_RESPONSES: Record<string, string> = {
    greeting: "Hey there! 👋 I'm your TriniBuild Concierge. How can I help you today? Looking for a job, rental, event tickets, or services?",
    thanks: "No problem at all! 🙌 Let me know if you need anything else.",
    farewell: "Take care! Come back anytime you need help finding something on TriniBuild. 🇹🇹"
};

// ============================================
// CONCIERGE SERVICE
// ============================================

class ConciergeService {
    private sessions: Map<string, ConciergeSession> = new Map();

    /**
     * Start a new concierge session
     */
    startSession(
        sessionId: string,
        persona: ConciergePersona = 'general',
        userId?: string
    ): ConciergeSession {
        const session: ConciergeSession = {
            id: sessionId,
            userId,
            persona,
            messages: [],
            context: {},
            startedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString()
        };

        this.sessions.set(sessionId, session);
        return session;
    }

    /**
     * Get or create session
     */
    getSession(sessionId: string): ConciergeSession | null {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * Send a message to the concierge
     */
    async sendMessage(
        sessionId: string,
        userMessage: string,
        options: {
            persona?: ConciergePersona;
            userId?: string;
            location?: string;
        } = {}
    ): Promise<ConciergeResponse> {
        // Get or create session
        let session = this.getSession(sessionId);
        if (!session) {
            session = this.startSession(sessionId, options.persona || 'general', options.userId);
        }

        // Update context
        if (options.location) {
            session.context.location = options.location;
        }

        // Add user message
        const userMsg: ConversationMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        };
        session.messages.push(userMsg);

        // Detect intent
        const { intent, vertical } = detectIntent(userMessage);

        // Log search for keyword tracking
        if (vertical) {
            await logKeywordSearch(userMessage, 'ai_search', options.userId, sessionId, options.location);
        }

        // Handle quick responses
        if (intent === 'greeting' && session.messages.length <= 2) {
            return this.createResponse(session, QUICK_RESPONSES.greeting, [
                "Find a job in Trinidad",
                "Search for apartments to rent",
                "What events are happening this weekend?",
                "I need a plumber"
            ]);
        }

        if (intent === 'thanks') {
            return this.createResponse(session, QUICK_RESPONSES.thanks);
        }

        // Search-based intents
        if (vertical) {
            return this.handleSearchIntent(session, userMessage, vertical, intent);
        }

        // Business expert queries
        if (intent === 'business_help') {
            return this.handleBusinessQuery(session, userMessage);
        }

        // General AI response
        return this.handleGeneralQuery(session, userMessage);
    }

    /**
     * Handle search-based queries
     */
    private async handleSearchIntent(
        session: ConciergeSession,
        query: string,
        vertical: SearchVertical,
        intent: string
    ): Promise<ConciergeResponse> {
        try {
            // Perform search
            const searchResults = await performSearch(query, {
                verticals: [vertical],
                limit_per_vertical: 5
            });

            // Convert to concierge results
            const results: ConciergeResult[] = searchResults.blocks
                .flatMap(block => block.results)
                .slice(0, 5)
                .map(item => ({
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    subtitle: item.subtitle,
                    url: item.url,
                    image: item.image,
                    price: item.price_label,
                    location: item.location
                }));

            session.context.lastSearchQuery = query;
            session.context.lastResults = results;

            // Generate response message
            let message: string;
            let quickActions: QuickAction[] = [];

            if (results.length > 0) {
                const verticalLabel = this.getVerticalLabel(vertical);
                message = `I found ${results.length} ${verticalLabel}s matching your search! Here are the top results:`;

                quickActions = [
                    { label: 'See all results', action: 'navigate', url: `/search?q=${encodeURIComponent(query)}` },
                    { label: 'Refine search', action: 'prompt', data: { followUp: 'refine' } }
                ];
            } else {
                message = `I couldn't find exact matches for "${query}", but I can help you with some alternatives. What specifically are you looking for?`;
                quickActions = [
                    { label: 'Browse all listings', action: 'navigate', url: `/${vertical}` }
                ];
            }

            return this.createResponse(session, message, undefined, quickActions, results);
        } catch (error) {
            console.error('Search error:', error);
            return this.createResponse(
                session,
                "I'm having trouble searching right now. Could you try rephrasing your request?",
                ["Try a different search", "Browse categories manually"]
            );
        }
    }

    /**
     * Handle business expert queries
     */
    private async handleBusinessQuery(
        session: ConciergeSession,
        query: string
    ): Promise<ConciergeResponse> {
        const systemPrompt = PERSONA_PROMPTS.business_expert;

        try {
            const response = await aiService.generateText(query, systemPrompt);

            const quickActions: QuickAction[] = [
                { label: 'Generate a document', action: 'navigate', url: '/documents' },
                { label: 'Ask another question', action: 'prompt' }
            ];

            return this.createResponse(session, response, undefined, quickActions);
        } catch (error) {
            console.error('AI error:', error);
            return this.createResponse(
                session,
                "I can help with T&T business questions. What specifically do you need to know about business registration, bank accounts, or visas?"
            );
        }
    }

    /**
     * Handle general queries
     */
    private async handleGeneralQuery(
        session: ConciergeSession,
        query: string
    ): Promise<ConciergeResponse> {
        const systemPrompt = PERSONA_PROMPTS[session.persona];

        // Build conversation context
        const recentMessages = session.messages.slice(-6).map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content
        }));

        const contextPrompt = `${systemPrompt}

Recent conversation:
${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Current user location: ${session.context.location || 'Unknown'}

Respond helpfully and concisely.`;

        try {
            const response = await aiService.generateText(query, contextPrompt);

            return this.createResponse(session, response, [
                "Find jobs near me",
                "Search for rentals",
                "What's happening this weekend?",
                "I need a service provider"
            ]);
        } catch (error) {
            console.error('AI error:', error);
            return this.createResponse(
                session,
                "I'm here to help you find jobs, rentals, events, and services in Trinidad & Tobago. What are you looking for?",
                ["Browse jobs", "Search rentals", "Find events", "Get services"]
            );
        }
    }

    /**
     * Create a response and add to session
     */
    private createResponse(
        session: ConciergeSession,
        message: string,
        suggestions?: string[],
        quickActions?: QuickAction[],
        results?: ConciergeResult[]
    ): ConciergeResponse {
        const assistantMsg: ConversationMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: message,
            timestamp: new Date().toISOString(),
            metadata: { suggestions, quickActions, results }
        };

        session.messages.push(assistantMsg);
        session.lastActivityAt = new Date().toISOString();

        return {
            message,
            suggestions,
            quickActions,
            results,
            shouldShowResults: results && results.length > 0
        };
    }

    /**
     * Get vertical label
     */
    private getVerticalLabel(vertical: SearchVertical): string {
        const labels: Record<SearchVertical, string> = {
            jobs: 'job',
            real_estate: 'propert',
            events: 'event',
            rideshare: 'ride',
            stores: 'store',
            marketplace: 'listing',
            services: 'service',
            blog: 'article',
            how_to: 'answer'
        };
        return labels[vertical] || 'result';
    }

    /**
     * Clear session
     */
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    /**
     * Get session history for persistence
     */
    getSessionHistory(sessionId: string): ConversationMessage[] {
        const session = this.getSession(sessionId);
        return session?.messages || [];
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const conciergeService = new ConciergeService();

// ============================================
// EXPORTS
// ============================================

export default conciergeService;
