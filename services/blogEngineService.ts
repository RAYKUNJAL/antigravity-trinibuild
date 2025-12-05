/**
 * TriniBuild Location Blog Engine Service
 * 
 * AI-powered blog generation for SEO-optimized, location-specific content
 * targeting all cities, towns, and villages in Trinidad & Tobago.
 */

import { aiService } from "./ai";
import { TrinidadLocation, TRINIDAD_LOCATIONS, getLocationBySlug } from "../data/trinidadLocations";
import {
    TriniBuildFeature,
    BlogVertical,
    TRINIBUILD_FEATURES,
    BLOG_VERTICALS,
    SEO_RULES,
    CTA_TEMPLATES,
    getVerticalByKey,
    getFeaturesForVertical
} from "../data/trinibuildFeatures";

// ============================================
// TYPES
// ============================================

export interface BlogSEOPlan {
    seo_title: string;
    meta_description: string;
    url_slug: string;
    primary_keyword: string;
    secondary_keywords: string[];
    outline_headings: OutlineHeading[];
    cta_positions: CTAPosition[];
}

export interface OutlineHeading {
    level: 'h2' | 'h3';
    text: string;
    notes?: string;
}

export interface CTAPosition {
    position: 'intro' | 'mid' | 'end';
    type: 'soft' | 'primary' | 'secondary';
    suggested_text?: string;
}

export interface BlogDraft {
    h1: string;
    body_markdown: string;
    body_html: string;
    headings_used: string[];
}

export interface GeneratedBlog {
    // Location Info
    location_name: string;
    location_slug: string;
    region: string;
    island: 'Trinidad' | 'Tobago';

    // Vertical Info
    vertical_key: string;
    vertical_label: string;

    // SEO Fields
    seo_title: string;
    meta_description: string;
    url_slug: string;
    primary_keyword: string;
    secondary_keywords: string[];

    // Content
    h1: string;
    headings: string[];
    body_markdown: string;
    body_html: string;

    // CTAs & Links
    cta_blocks: {
        position: 'intro' | 'mid' | 'end';
        text: string;
    }[];
    internal_links_used: {
        anchor_text: string;
        url: string;
        feature_key: string;
    }[];

    // Metadata
    word_count: number;
    reading_time_minutes: number;
    generated_at: string;
    tone_variant: 'default' | 'more_trini';

    // Schema.org
    schema_org: object;
    open_graph: object;
    twitter_card: object;
}

export interface BlogGenerationOptions {
    location: TrinidadLocation;
    vertical_key: string;
    word_count_target?: number;
    tone_variant?: 'default' | 'more_trini';
    include_hypothetical_story?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const parseAiJson = (text: string) => {
    try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error("No JSON found");
        return JSON.parse(text.substring(start, end + 1));
    } catch (e) {
        console.error("JSON Parse Error:", e, "\nRaw text:", text);
        throw new Error("AI returned invalid JSON format");
    }
};

const replaceTemplateVars = (template: string, vars: Record<string, string>): string => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
};

const countWords = (text: string): number => {
    return text.split(/\s+/).filter(w => w.length > 0).length;
};

const estimateReadingTime = (wordCount: number): number => {
    return Math.ceil(wordCount / 200); // Average 200 words per minute
};

const markdownToHtml = (markdown: string): string => {
    // Basic markdown to HTML conversion
    let html = markdown
        // Headers
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
        // Bold and italic
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-trini-red hover:underline">$1</a>')
        // Lists
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>(\n)?)+/g, (match) => `<ul class="list-disc pl-6 my-4">${match}</ul>`)
        // Paragraphs
        .replace(/^(?!<[h|u|l|p])(.*?)$/gm, (match) => match.trim() ? `<p class="mb-4">${match}</p>` : '')
        // Line breaks
        .replace(/\n\n+/g, '\n');

    return html;
};

// ============================================
// STEP 1: GENERATE SEO PLAN
// ============================================

export const generateSEOPlan = async (
    location: TrinidadLocation,
    vertical: BlogVertical
): Promise<BlogSEOPlan> => {

    const features = getFeaturesForVertical(vertical.key);
    const featureSummaries = features.map(f => `${f.label}: ${f.summary}`).join('\n');

    const systemPrompt = `You are an SEO strategist for TriniBuild, a platform in Trinidad & Tobago that gives people free webpages and tools for marketplace stores, jobs, real estate, tickets and rideshare.

Your task is to create an SEO content plan for a location-specific blog article.`;

    const prompt = `Create an SEO plan for a blog post about "${vertical.label}" in ${location.name}, Trinidad & Tobago.

**Location Details:**
- Name: ${location.name}
- Region: ${location.region_or_municipality}
- Island: ${location.island}
${location.isMajorCity ? '- This is a major city.' : ''}
${location.isCapital ? '- This is the capital city.' : ''}

**Vertical:** ${vertical.label} (key: ${vertical.key})

**TriniBuild Features to Highlight:**
${featureSummaries}

**Example Topic Templates:**
${vertical.topic_templates.map(t => replaceTemplateVars(t, { location_name: location.name })).join('\n')}

**Your Task:**
1. Create an SEO title (max ${SEO_RULES.title_length_max} chars) focused on "${vertical.label} in ${location.name}".
2. Write a meta description (${SEO_RULES.meta_description_length_min}-${SEO_RULES.meta_description_length_max} chars) for Trinidad & Tobago users.
3. Generate URL slug using pattern: ${vertical.key}-in-${location.slug}
4. Choose one primary keyword and 3-5 secondary keywords.
5. Create a detailed outline (H2, H3 headings) showing:
   - Problem/pain point intro
   - How life is now in ${location.name} (local challenges)
   - How TriniBuild solves it
   - Step-by-step guide
   - Optional local story
   - Conclusion with benefits
6. Suggest 3-4 CTA positions (intro/mid/end).

Return ONLY valid JSON:
{
  "seo_title": "string (max 65 chars)",
  "meta_description": "string (120-160 chars)",
  "url_slug": "string",
  "primary_keyword": "string",
  "secondary_keywords": ["string", "string", "string"],
  "outline_headings": [
    {"level": "h2", "text": "string", "notes": "optional context"}
  ],
  "cta_positions": [
    {"position": "intro|mid|end", "type": "soft|primary|secondary", "suggested_text": "optional"}
  ]
}`;

    try {
        const response = await aiService.generateText(prompt, systemPrompt);
        return parseAiJson(response);
    } catch (error) {
        console.error("SEO Plan Generation Error:", error);
        // Return fallback plan
        return {
            seo_title: `${vertical.label} in ${location.name} | TriniBuild`,
            meta_description: `Find the best ${vertical.label.toLowerCase()} opportunities in ${location.name}, Trinidad & Tobago. TriniBuild helps you connect with local ${vertical.label.toLowerCase()}.`,
            url_slug: `${vertical.key}-in-${location.slug}`,
            primary_keyword: `${vertical.label.toLowerCase()} in ${location.name}`,
            secondary_keywords: [
                `TriniBuild ${location.name}`,
                `${location.name} ${vertical.key}`,
                `online ${vertical.label.toLowerCase()} ${location.name}`
            ],
            outline_headings: [
                { level: 'h2', text: `The Challenge: Finding ${vertical.label} in ${location.name}` },
                { level: 'h2', text: `How TriniBuild Solves This Problem` },
                { level: 'h2', text: `Getting Started with TriniBuild in ${location.name}` },
                { level: 'h2', text: `Success Stories from ${location.name}` },
                { level: 'h2', text: `Take Action Today` }
            ],
            cta_positions: [
                { position: 'intro', type: 'soft' },
                { position: 'mid', type: 'primary' },
                { position: 'end', type: 'primary' }
            ]
        };
    }
};

// ============================================
// STEP 2: GENERATE DRAFT CONTENT
// ============================================

export const generateDraftContent = async (
    location: TrinidadLocation,
    vertical: BlogVertical,
    seoPlan: BlogSEOPlan,
    options: Partial<BlogGenerationOptions> = {}
): Promise<BlogDraft> => {

    const features = getFeaturesForVertical(vertical.key);
    const wordTarget = options.word_count_target || 1200;
    const toneVariant = options.tone_variant || 'default';

    const systemPrompt = `You are a content writer for TriniBuild, the leading digital platform in Trinidad & Tobago. Write engaging, SEO-optimized blog posts that resonate with local readers.

**Writing Style:**
- Tone: Friendly, practical, locally-aware, empowering
- ${toneVariant === 'more_trini' ?
            "Use Trini phrases throughout: 'doh worry', 'build yuh own ting', 'real talk', 'small ting', 'we go sort dat out'" :
            "Use light Trini phrasing in intro and outro only when appropriate"
        }
- Keep main body clear and professional for broad readability
- Always tie challenges back to local realities: banking issues, credit card gaps, lack of online tools
- Explain digital concepts simply—many readers are new to online business`;

    const prompt = `Write a full blog article (approximately ${wordTarget} words) for readers in ${location.name}, Trinidad & Tobago.

**SEO Plan:**
${JSON.stringify(seoPlan, null, 2)}

**Location:** ${location.name} (${location.region_or_municipality}, ${location.island})
**Vertical:** ${vertical.label}

**TriniBuild Features to Mention:**
${features.map(f => `- ${f.label}: ${f.summary}`).join('\n')}

**Article Structure (Follow this):**
1. **Intro** (2-3 paragraphs): Name the location, state the core pain point, introduce TriniBuild as the solution. Add [CTA:soft_intro] marker.

2. **H2: The Local Challenge** (3-4 paragraphs): Describe specific challenges people face in ${location.name} regarding ${vertical.label.toLowerCase()}. Mention:
   - Traditional ways that don't work well
   - Banking/credit card limitations
   - Lack of digital tools
   - Distance from opportunities

3. **H2: How TriniBuild Solves This** (4-5 paragraphs): Feature-focused section explaining the solution. Add [CTA:primary] marker after this section.

4. **H2: Step-by-Step Guide** (numbered steps): How to get started on TriniBuild for ${vertical.label.toLowerCase()} in ${location.name}. Add [CTA:secondary] marker.

${options.include_hypothetical_story !== false ? `
5. **H2: A ${location.name} Success Story** (2-3 paragraphs): Brief hypothetical example of a local person/business benefiting from TriniBuild.
` : ''}

6. **Conclusion** (2 paragraphs): Recap benefits, emphasize it's free, strong final [CTA:final] marker.

**Internal Link Markers:**
Use these patterns for internal links: [LINK:feature_key:"anchor text"]
Available features: ${features.map(f => f.key).join(', ')}

**Return ONLY valid JSON:**
{
  "h1": "Article headline (can be same or variation of SEO title)",
  "body_markdown": "Full article in markdown format with CTA and LINK markers",
  "headings_used": ["H2: heading1", "H2: heading2", "H3: subheading1"]
}`;

    try {
        const response = await aiService.generateText(prompt, systemPrompt);
        return parseAiJson(response);
    } catch (error) {
        console.error("Draft Generation Error:", error);
        throw new Error(`Failed to generate draft content: ${error}`);
    }
};

// ============================================
// STEP 3: POLISH & FINALIZE
// ============================================

export const polishAndFinalize = async (
    location: TrinidadLocation,
    vertical: BlogVertical,
    seoPlan: BlogSEOPlan,
    draft: BlogDraft
): Promise<GeneratedBlog> => {

    const features = getFeaturesForVertical(vertical.key);

    // Process CTA markers
    let content = draft.body_markdown;
    const ctaBlocks: GeneratedBlog['cta_blocks'] = [];

    // Replace CTA markers
    const ctaReplacements: Record<string, { position: 'intro' | 'mid' | 'end', template: string }> = {
        '[CTA:soft_intro]': {
            position: 'intro',
            template: CTA_TEMPLATES.intro[Math.floor(Math.random() * CTA_TEMPLATES.intro.length)]
        },
        '[CTA:primary]': {
            position: 'mid',
            template: CTA_TEMPLATES.mid[0]
        },
        '[CTA:secondary]': {
            position: 'mid',
            template: CTA_TEMPLATES.mid[1]
        },
        '[CTA:final]': {
            position: 'end',
            template: CTA_TEMPLATES.end[Math.floor(Math.random() * CTA_TEMPLATES.end.length)]
        }
    };

    for (const [marker, config] of Object.entries(ctaReplacements)) {
        if (content.includes(marker)) {
            const ctaText = replaceTemplateVars(config.template, {
                location_name: location.name,
                vertical_label: vertical.label
            });
            ctaBlocks.push({ position: config.position, text: ctaText });
            content = content.replace(marker, `\n\n**${ctaText}** [Sign up free →](/signup)\n\n`);
        }
    }

    // Process internal link markers
    const internalLinksUsed: GeneratedBlog['internal_links_used'] = [];
    const linkRegex = /\[LINK:(\w+):"([^"]+)"\]/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        const featureKey = match[1];
        const anchorText = match[2];
        const feature = features.find(f => f.key === featureKey) || TRINIBUILD_FEATURES.find(f => f.key === featureKey);

        if (feature) {
            internalLinksUsed.push({
                anchor_text: anchorText,
                url: feature.internal_url,
                feature_key: featureKey
            });
            content = content.replace(match[0], `[${anchorText}](${feature.internal_url})`);
        }
    }

    // Ensure minimum required internal links
    if (internalLinksUsed.length < 2) {
        // Add default feature link
        const freePageFeature = TRINIBUILD_FEATURES.find(f => f.key === 'free_webpages')!;
        if (!internalLinksUsed.find(l => l.feature_key === 'free_webpages')) {
            internalLinksUsed.push({
                anchor_text: 'create your free TriniBuild page',
                url: freePageFeature.internal_url,
                feature_key: 'free_webpages'
            });
        }
    }

    // Convert to HTML
    const bodyHtml = markdownToHtml(content);
    const wordCount = countWords(content);

    // Generate Schema.org structured data
    const schemaOrg = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": seoPlan.seo_title,
        "description": seoPlan.meta_description,
        "author": {
            "@type": "Organization",
            "name": "TriniBuild"
        },
        "publisher": {
            "@type": "Organization",
            "name": "TriniBuild",
            "logo": {
                "@type": "ImageObject",
                "url": "https://trinibuild.com/logo.png"
            }
        },
        "datePublished": new Date().toISOString(),
        "dateModified": new Date().toISOString(),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://trinibuild.com/blog/${seoPlan.url_slug}`
        },
        "keywords": [seoPlan.primary_keyword, ...seoPlan.secondary_keywords].join(', '),
        "about": {
            "@type": "Place",
            "name": location.name,
            "containedIn": {
                "@type": "Country",
                "name": "Trinidad and Tobago"
            }
        }
    };

    // Generate Open Graph tags
    const openGraph = {
        "og:type": "article",
        "og:title": seoPlan.seo_title,
        "og:description": seoPlan.meta_description,
        "og:url": `https://trinibuild.com/blog/${seoPlan.url_slug}`,
        "og:site_name": "TriniBuild",
        "og:locale": "en_TT",
        "article:published_time": new Date().toISOString(),
        "article:author": "TriniBuild",
        "article:section": vertical.label,
        "article:tag": seoPlan.primary_keyword
    };

    // Generate Twitter Card tags
    const twitterCard = {
        "twitter:card": "summary_large_image",
        "twitter:site": "@TriniBuild",
        "twitter:title": seoPlan.seo_title,
        "twitter:description": seoPlan.meta_description
    };

    return {
        // Location Info
        location_name: location.name,
        location_slug: location.slug,
        region: location.region_or_municipality,
        island: location.island,

        // Vertical Info
        vertical_key: vertical.key,
        vertical_label: vertical.label,

        // SEO Fields
        seo_title: seoPlan.seo_title,
        meta_description: seoPlan.meta_description,
        url_slug: seoPlan.url_slug,
        primary_keyword: seoPlan.primary_keyword,
        secondary_keywords: seoPlan.secondary_keywords,

        // Content
        h1: draft.h1,
        headings: draft.headings_used,
        body_markdown: content,
        body_html: bodyHtml,

        // CTAs & Links
        cta_blocks: ctaBlocks,
        internal_links_used: internalLinksUsed,

        // Metadata
        word_count: wordCount,
        reading_time_minutes: estimateReadingTime(wordCount),
        generated_at: new Date().toISOString(),
        tone_variant: 'default',

        // SEO Metadata
        schema_org: schemaOrg,
        open_graph: openGraph,
        twitter_card: twitterCard
    };
};

// ============================================
// MAIN BLOG GENERATION FUNCTION
// ============================================

export const generateLocationBlog = async (
    options: BlogGenerationOptions
): Promise<GeneratedBlog> => {
    const { location, vertical_key, word_count_target, tone_variant, include_hypothetical_story } = options;

    const vertical = getVerticalByKey(vertical_key);
    if (!vertical) {
        throw new Error(`Unknown vertical: ${vertical_key}`);
    }

    console.log(`🚀 Generating blog for ${location.name} - ${vertical.label}...`);

    // Step 1: Generate SEO Plan
    console.log('📋 Step 1: Generating SEO plan...');
    const seoPlan = await generateSEOPlan(location, vertical);

    // Step 2: Generate Draft Content
    console.log('✍️ Step 2: Generating draft content...');
    const draft = await generateDraftContent(location, vertical, seoPlan, {
        word_count_target,
        tone_variant,
        include_hypothetical_story
    });

    // Step 3: Polish and Finalize
    console.log('✨ Step 3: Polishing and finalizing...');
    const finalBlog = await polishAndFinalize(location, vertical, seoPlan, draft);

    console.log(`✅ Blog generated: ${finalBlog.word_count} words, ${finalBlog.reading_time_minutes} min read`);

    return finalBlog;
};

// ============================================
// BATCH GENERATION
// ============================================

export interface BatchGenerationProgress {
    total: number;
    completed: number;
    current_location: string;
    current_vertical: string;
    errors: { location: string; vertical: string; error: string }[];
}

export const generateBlogsForLocation = async (
    locationSlug: string,
    verticals: string[] = ['jobs', 'stores', 'tickets', 'real_estate', 'rideshare'],
    onProgress?: (progress: BatchGenerationProgress) => void
): Promise<GeneratedBlog[]> => {

    const location = getLocationBySlug(locationSlug);
    if (!location) {
        throw new Error(`Location not found: ${locationSlug}`);
    }

    const results: GeneratedBlog[] = [];
    const errors: BatchGenerationProgress['errors'] = [];

    for (let i = 0; i < verticals.length; i++) {
        const vertical_key = verticals[i];

        onProgress?.({
            total: verticals.length,
            completed: i,
            current_location: location.name,
            current_vertical: vertical_key,
            errors
        });

        try {
            const blog = await generateLocationBlog({
                location,
                vertical_key
            });
            results.push(blog);
        } catch (error) {
            console.error(`Error generating ${vertical_key} blog for ${location.name}:`, error);
            errors.push({
                location: location.name,
                vertical: vertical_key,
                error: String(error)
            });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    onProgress?.({
        total: verticals.length,
        completed: verticals.length,
        current_location: location.name,
        current_vertical: 'Complete',
        errors
    });

    return results;
};

export const generateBlogsForRegion = async (
    region: string,
    vertical_key: string,
    onProgress?: (progress: BatchGenerationProgress) => void
): Promise<GeneratedBlog[]> => {

    const locations = TRINIDAD_LOCATIONS.filter(l => l.region_or_municipality === region);

    const results: GeneratedBlog[] = [];
    const errors: BatchGenerationProgress['errors'] = [];

    for (let i = 0; i < locations.length; i++) {
        const location = locations[i];

        onProgress?.({
            total: locations.length,
            completed: i,
            current_location: location.name,
            current_vertical: vertical_key,
            errors
        });

        try {
            const blog = await generateLocationBlog({
                location,
                vertical_key
            });
            results.push(blog);
        } catch (error) {
            errors.push({
                location: location.name,
                vertical: vertical_key,
                error: String(error)
            });
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
};

// ============================================
// UTILITY EXPORTS
// ============================================

export {
    TRINIDAD_LOCATIONS,
    TRINIBUILD_FEATURES,
    BLOG_VERTICALS,
    getLocationBySlug,
    getVerticalByKey
};
