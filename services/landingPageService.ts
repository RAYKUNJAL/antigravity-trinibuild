/**
 * TriniBuild AI Micro Landing Page Generator
 * Key: keyword_landing_engine
 * 
 * Auto-generates SEO-optimized landing pages for high-opportunity keywords.
 */

import { supabase } from './supabaseClient';
import { aiService } from './ai';
import { TRINIDAD_LOCATIONS, TrinidadLocation } from '../data/trinidadLocations';

// ============================================
// TYPES
// ============================================

export type LandingPageVertical =
    | 'jobs'
    | 'real_estate'
    | 'services'
    | 'events'
    | 'marketplace'
    | 'rideshare';

export interface LandingPageTemplate {
    id: string;
    vertical: LandingPageVertical;
    location_slug: string;
    location_name: string;
    keyword: string;
    url_slug: string;

    // SEO
    title: string;
    meta_description: string;
    h1: string;

    // Content sections
    intro_paragraph: string;
    benefits_section: string[];
    faq_section: { question: string; answer: string }[];
    local_context: string;
    cta_text: string;

    // Schema data
    schema_type: string;
    schema_data: Record<string, unknown>;

    // Status
    status: 'draft' | 'published' | 'archived';
    auto_generated: boolean;
    views: number;
    conversions: number;

    created_at: string;
    updated_at: string;
    published_at?: string;
}

export interface LandingPageGenerationRequest {
    keyword: string;
    vertical: LandingPageVertical;
    location?: string;
    targetAudience?: string;
}

// ============================================
// VERTICAL TEMPLATES
// ============================================

const VERTICAL_TEMPLATES: Record<LandingPageVertical, {
    titleTemplate: string;
    h1Template: string;
    metaTemplate: string;
    benefits: string[];
    ctaTemplate: string;
    schemaType: string;
}> = {
    jobs: {
        titleTemplate: '{keyword} in {location} | Find Jobs on TriniBuild',
        h1Template: 'Find {keyword} Jobs in {location}',
        metaTemplate: 'Looking for {keyword} jobs in {location}? Browse {count}+ verified job listings on TriniBuild. Apply today and start your career in Trinidad & Tobago.',
        benefits: [
            'Verified employers only',
            'Apply directly through the platform',
            'Get instant notifications for new openings',
            'Free resume builder included'
        ],
        ctaTemplate: 'Browse {keyword} Jobs Now',
        schemaType: 'JobPosting'
    },
    real_estate: {
        titleTemplate: '{keyword} in {location} | Rentals & Properties | TriniBuild',
        h1Template: '{keyword} for Rent in {location}',
        metaTemplate: 'Find the best {keyword} in {location}, Trinidad. Browse verified listings with photos, prices, and direct landlord contact. No agent fees.',
        benefits: [
            'Direct landlord contact - no middlemen',
            'Verified properties with real photos',
            'Secure deposit payments',
            'Virtual tours available'
        ],
        ctaTemplate: 'View {keyword} Listings',
        schemaType: 'RealEstateListing'
    },
    services: {
        titleTemplate: '{keyword} in {location} | Trusted Professionals | TriniBuild',
        h1Template: 'Best {keyword} in {location}',
        metaTemplate: 'Need a {keyword} in {location}? Find verified, reviewed professionals on TriniBuild. Compare prices, read reviews, and book instantly.',
        benefits: [
            'ID-verified professionals',
            'Read real customer reviews',
            'Compare quotes from multiple providers',
            'Secure payment protection'
        ],
        ctaTemplate: 'Find a {keyword}',
        schemaType: 'LocalBusiness'
    },
    events: {
        titleTemplate: '{keyword} in {location} | Buy Tickets | TriniBuild',
        h1Template: '{keyword} Events in {location}',
        metaTemplate: 'Get tickets for {keyword} in {location}. Secure, verified tickets with QR codes. No scalper prices. Buy now on TriniBuild.',
        benefits: [
            'Guaranteed authentic tickets',
            'Instant digital delivery',
            'No scalper markups',
            'Easy refund policy'
        ],
        ctaTemplate: 'Get Tickets Now',
        schemaType: 'Event'
    },
    marketplace: {
        titleTemplate: '{keyword} for Sale in {location} | TriniBuild Marketplace',
        h1Template: 'Buy {keyword} in {location}',
        metaTemplate: 'Shop for {keyword} in {location}. New and used items from verified sellers. Safe transactions and local pickup available.',
        benefits: [
            'Verified sellers with trust scores',
            'Secure payment options',
            'Local pickup or delivery',
            'Buyer protection included'
        ],
        ctaTemplate: 'Shop {keyword}',
        schemaType: 'Product'
    },
    rideshare: {
        titleTemplate: '{keyword} | QuickRides Trinidad | TriniBuild',
        h1Template: '{keyword} Rides in Trinidad',
        metaTemplate: 'Book {keyword} with TriniBuild QuickRides. Trusted drivers, fixed prices, and real-time GPS tracking. Available 24/7 across Trinidad.',
        benefits: [
            'Fixed prices - no surge pricing',
            'Verified, background-checked drivers',
            'Real-time GPS tracking',
            '24/7 availability'
        ],
        ctaTemplate: 'Book Your Ride',
        schemaType: 'TaxiService'
    }
};

// ============================================
// FAQ TEMPLATES
// ============================================

const FAQ_TEMPLATES: Record<LandingPageVertical, string[]> = {
    jobs: [
        'How do I apply for {keyword} jobs in {location}?',
        'What salary can I expect for {keyword} positions in Trinidad?',
        'Are the {keyword} jobs on TriniBuild verified?',
        'How long does the application process take?',
        'Can I set up job alerts for {keyword} in {location}?'
    ],
    real_estate: [
        'What is the average rent for {keyword} in {location}?',
        'How do I contact landlords directly on TriniBuild?',
        'Is a deposit required for {keyword} rentals?',
        'Can I schedule a property viewing online?',
        'Are the {keyword} listings verified?'
    ],
    services: [
        'How do I find a trusted {keyword} in {location}?',
        'What is the average cost for {keyword} services?',
        'Are the {keyword} providers on TriniBuild verified?',
        'Can I read reviews before booking?',
        'What if I\'m not satisfied with the service?'
    ],
    events: [
        'Where can I buy tickets for {keyword} in {location}?',
        'Are the {keyword} tickets guaranteed authentic?',
        'Can I get a refund if the event is cancelled?',
        'How will I receive my tickets?',
        'Are there group discounts for {keyword} events?'
    ],
    marketplace: [
        'Is it safe to buy {keyword} on TriniBuild?',
        'How do I contact sellers for {keyword}?',
        'What payment methods are accepted?',
        'Can I return {keyword} if it\'s not as described?',
        'How do I know the seller is trustworthy?'
    ],
    rideshare: [
        'How much does a {keyword} ride cost?',
        'Are TriniBuild drivers verified?',
        'Can I book a {keyword} ride in advance?',
        'What areas in Trinidad do you cover?',
        'How do I pay for my ride?'
    ]
};

// ============================================
// LANDING PAGE GENERATOR
// ============================================

/**
 * Generate a landing page for a keyword
 */
export const generateLandingPage = async (
    request: LandingPageGenerationRequest
): Promise<LandingPageTemplate> => {
    const { keyword, vertical, location, targetAudience } = request;

    // Get location data
    const locationData = location
        ? TRINIDAD_LOCATIONS.find(l =>
            l.name.toLowerCase() === location.toLowerCase() ||
            l.slug === location.toLowerCase()
        )
        : TRINIDAD_LOCATIONS[0]; // Default to Port of Spain

    const locationName = locationData?.name || location || 'Trinidad';
    const locationSlug = locationData?.slug || location?.toLowerCase().replace(/\s+/g, '-') || 'trinidad';

    // Get template
    const template = VERTICAL_TEMPLATES[vertical];

    // Generate URL slug
    const urlSlug = `${vertical}/${locationSlug}/${keyword.toLowerCase().replace(/\s+/g, '-')}`;

    // Generate base content
    const title = template.titleTemplate
        .replace('{keyword}', capitalizeWords(keyword))
        .replace('{location}', locationName);

    const h1 = template.h1Template
        .replace('{keyword}', capitalizeWords(keyword))
        .replace('{location}', locationName);

    const metaDescription = template.metaTemplate
        .replace(/{keyword}/g, keyword)
        .replace(/{location}/g, locationName)
        .replace('{count}', '50');

    const ctaText = template.ctaTemplate.replace('{keyword}', capitalizeWords(keyword));

    // Generate AI content
    const [introParagraph, localContext, faqAnswers] = await Promise.all([
        generateIntroParagraph(keyword, vertical, locationName, targetAudience),
        generateLocalContext(locationName, vertical),
        generateFaqAnswers(keyword, vertical, locationName)
    ]);

    // Build FAQ section
    const faqSection = FAQ_TEMPLATES[vertical].map((question, i) => ({
        question: question.replace(/{keyword}/g, keyword).replace(/{location}/g, locationName),
        answer: faqAnswers[i] || `Contact us for more information about ${keyword} in ${locationName}.`
    }));

    // Build schema data
    const schemaData = generateSchemaData(template.schemaType, {
        keyword,
        location: locationName,
        vertical
    });

    // Create landing page object
    const landingPage: LandingPageTemplate = {
        id: `lp_${Date.now()}`,
        vertical,
        location_slug: locationSlug,
        location_name: locationName,
        keyword,
        url_slug: urlSlug,
        title,
        meta_description: metaDescription,
        h1,
        intro_paragraph: introParagraph,
        benefits_section: template.benefits,
        faq_section: faqSection,
        local_context: localContext,
        cta_text: ctaText,
        schema_type: template.schemaType,
        schema_data: schemaData,
        status: 'draft',
        auto_generated: true,
        views: 0,
        conversions: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    return landingPage;
};

/**
 * Generate intro paragraph using AI
 */
const generateIntroParagraph = async (
    keyword: string,
    vertical: LandingPageVertical,
    location: string,
    targetAudience?: string
): Promise<string> => {
    const prompt = `Write a compelling 2-3 sentence intro paragraph for a landing page about "${keyword}" in ${location}, Trinidad. 
Target audience: ${targetAudience || 'people in Trinidad looking for ' + keyword}.
Category: ${vertical}.
Be concise, engaging, and include local context. Mention TriniBuild as the platform.`;

    try {
        const response = await aiService.generateText(prompt,
            'You are an SEO copywriter for Trinidad & Tobago.'
        );
        return response.trim();
    } catch {
        return `Looking for ${keyword} in ${location}? TriniBuild connects you with the best options across Trinidad & Tobago. Browse verified listings and find exactly what you need.`;
    }
};

/**
 * Generate local context section
 */
const generateLocalContext = async (
    location: string,
    vertical: LandingPageVertical
): Promise<string> => {
    const prompt = `Write 2-3 sentences about ${location}, Trinidad that would be relevant to someone looking for ${vertical} there. Include local landmarks, neighborhoods, or characteristics that make it unique. Be helpful and informative.`;

    try {
        const response = await aiService.generateText(prompt,
            'You are a local T&T expert.'
        );
        return response.trim();
    } catch {
        return `${location} is a vibrant area in Trinidad with a strong local community. TriniBuild has extensive coverage in this area.`;
    }
};

/**
 * Generate FAQ answers using AI
 */
const generateFaqAnswers = async (
    keyword: string,
    vertical: LandingPageVertical,
    location: string
): Promise<string[]> => {
    const questions = FAQ_TEMPLATES[vertical].map(q =>
        q.replace(/{keyword}/g, keyword).replace(/{location}/g, location)
    );

    const prompt = `Answer these FAQs concisely (1-2 sentences each) for a TriniBuild landing page:

${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Context: TriniBuild is Trinidad's leading digital platform for jobs, rentals, services, and more. Be helpful and specific to T&T.`;

    try {
        const response = await aiService.generateText(prompt,
            'You are a TriniBuild customer service expert.'
        );

        // Parse responses
        const lines = response.split('\n').filter(line => line.trim());
        return lines.map(line => line.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
    } catch {
        return questions.map(() => 'Please contact our support team for detailed information.');
    }
};

/**
 * Generate schema.org data
 */
const generateSchemaData = (
    schemaType: string,
    data: { keyword: string; location: string; vertical: string }
): Record<string, unknown> => {
    const baseSchema = {
        '@context': 'https://schema.org',
        '@type': schemaType,
        'name': data.keyword,
        'areaServed': {
            '@type': 'City',
            'name': data.location,
            'containedInPlace': {
                '@type': 'Country',
                'name': 'Trinidad and Tobago'
            }
        },
        'provider': {
            '@type': 'Organization',
            'name': 'TriniBuild',
            'url': 'https://trinibuild.com'
        }
    };

    return baseSchema;
};

// ============================================
// BATCH GENERATION
// ============================================

/**
 * Generate landing pages for top keywords
 */
export const generateBatchLandingPages = async (
    keywords: { keyword: string; vertical: LandingPageVertical }[],
    locations: string[] = ['Port of Spain', 'San Fernando', 'Chaguanas']
): Promise<LandingPageTemplate[]> => {
    const pages: LandingPageTemplate[] = [];

    for (const { keyword, vertical } of keywords) {
        for (const location of locations) {
            try {
                const page = await generateLandingPage({ keyword, vertical, location });
                pages.push(page);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error generating page for ${keyword} in ${location}:`, error);
            }
        }
    }

    return pages;
};

/**
 * Save landing page to database
 */
export const saveLandingPage = async (
    page: LandingPageTemplate
): Promise<{ success: boolean; id?: string; error?: string }> => {
    const { data, error } = await supabase
        .from('landing_pages')
        .upsert({
            ...page,
            updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
};

/**
 * Get landing page by URL slug
 */
export const getLandingPageBySlug = async (
    slug: string
): Promise<LandingPageTemplate | null> => {
    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('url_slug', slug)
        .eq('status', 'published')
        .single();

    if (error || !data) return null;
    return data as LandingPageTemplate;
};

/**
 * Get landing pages by vertical
 */
export const getLandingPagesByVertical = async (
    vertical: LandingPageVertical,
    limit = 20
): Promise<LandingPageTemplate[]> => {
    const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('vertical', vertical)
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit);

    if (error || !data) return [];
    return data as LandingPageTemplate[];
};

/**
 * Track landing page view
 */
export const trackLandingPageView = async (pageId: string): Promise<void> => {
    await supabase.rpc('increment_landing_page_views', { page_id: pageId });
};

/**
 * Track landing page conversion
 */
export const trackLandingPageConversion = async (pageId: string): Promise<void> => {
    await supabase.rpc('increment_landing_page_conversions', { page_id: pageId });
};

// ============================================
// UTILITIES
// ============================================

const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
};

// ============================================
// EXPORTS
// ============================================

export default {
    generateLandingPage,
    generateBatchLandingPages,
    saveLandingPage,
    getLandingPageBySlug,
    getLandingPagesByVertical,
    trackLandingPageView,
    trackLandingPageConversion
};
