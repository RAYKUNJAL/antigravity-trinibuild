/**
 * TriniBuild AI Social Media Content Engine
 * Key: social_auto_creator
 * 
 * Auto-generates social media content for new listings,
 * events, promotions, and engagement campaigns.
 */

import { aiService } from './ai';
import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'whatsapp';
export type ContentType = 'listing' | 'event' | 'job' | 'property' | 'promo' | 'blog' | 'engagement' | 'brand';

export interface SocialPost {
    id: string;
    platform: SocialPlatform;
    content_type: ContentType;

    // Content
    text: string;
    hashtags: string[];
    emoji_text: string; // Text with emojis

    // Media
    image_prompt?: string;
    video_script?: string;
    carousel_items?: string[];

    // Metadata
    source_id?: string;
    source_type?: string;

    // Scheduling
    scheduled_for?: string;
    posted_at?: string;

    // Status
    status: 'draft' | 'scheduled' | 'posted' | 'failed';

    // Engagement
    impressions?: number;
    engagements?: number;
    clicks?: number;

    created_at: string;
}

export interface SocialCampaign {
    id: string;
    name: string;
    description: string;
    platforms: SocialPlatform[];
    posts: SocialPost[];
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'completed' | 'paused';
}

export interface ContentGenerationRequest {
    type: ContentType;
    platforms: SocialPlatform[];
    data: Record<string, unknown>;
    tone?: 'professional' | 'casual' | 'excited' | 'local';
    includeHashtags?: boolean;
    includeEmojis?: boolean;
}

// ============================================
// PLATFORM CONFIGS
// ============================================

const PLATFORM_CONFIGS: Record<SocialPlatform, {
    maxLength: number;
    hashtagStyle: 'inline' | 'bottom' | 'none';
    emojiLevel: 'high' | 'medium' | 'low';
    mediaType: 'image' | 'video' | 'carousel' | 'all';
}> = {
    facebook: { maxLength: 2000, hashtagStyle: 'bottom', emojiLevel: 'medium', mediaType: 'all' },
    instagram: { maxLength: 2200, hashtagStyle: 'bottom', emojiLevel: 'high', mediaType: 'all' },
    twitter: { maxLength: 280, hashtagStyle: 'inline', emojiLevel: 'medium', mediaType: 'image' },
    linkedin: { maxLength: 3000, hashtagStyle: 'bottom', emojiLevel: 'low', mediaType: 'image' },
    tiktok: { maxLength: 300, hashtagStyle: 'inline', emojiLevel: 'high', mediaType: 'video' },
    whatsapp: { maxLength: 1000, hashtagStyle: 'none', emojiLevel: 'medium', mediaType: 'image' }
};

// ============================================
// HASHTAG LIBRARY (Trinidad & Tobago)
// ============================================

const TT_HASHTAGS: Record<string, string[]> = {
    general: ['#Juvay', '#TrinidadAndTobago', '#TT', '#Trinidad', '#Tobago', '#MadeInTT'],
    jobs: ['#TTJobs', '#TrinidadJobs', '#CareersTT', '#HiringTT', '#WorkInTrinidad'],
    real_estate: ['#TTRealEstate', '#TrinidadRentals', '#PropertyTT', '#TrinidadHomes', '#TobagoProperty'],
    events: ['#TTEvents', '#TrinidadEvents', '#WhatsOnTT', '#TrinidadNightlife', '#LimeTT'],
    marketplace: ['#TTMarketplace', '#BuyTT', '#SellTT', '#TrinidadShopping', '#LocalTT'],
    services: ['#TTServices', '#TrinidadBusiness', '#LocalServices', '#SupportLocalTT'],
    rideshare: ['#QuickRides', '#TTTaxi', '#TrinidadRides', '#RideShareTT']
};

// ============================================
// CONTENT TEMPLATES
// ============================================

const CONTENT_TEMPLATES: Record<ContentType, { short: string; long: string; cta: string }> = {
    listing: {
        short: '🛍️ NEW: {title} - ${price} in {location}',
        long: '🔥 Just Listed!\n\n{title}\n📍 {location}\n💰 ${price}\n\n{description}\n\n{cta}',
        cta: '👉 Shop now on Juvay!'
    },
    event: {
        short: '🎉 {title} - {date} @ {venue}',
        long: '🎊 Don\'t miss this!\n\n{title}\n📅 {date}\n📍 {venue}\n🎫 {price}\n\n{description}\n\n{cta}',
        cta: '🎟️ View on Juvay!'
    },
    job: {
        short: '💼 Hiring: {title} at {company} in {location}',
        long: '🚀 Career Opportunity!\n\n{company} is hiring:\n💼 {title}\n📍 {location}\n💰 {salary}\n\n{requirements}\n\n{cta}',
        cta: '📝 Apply now on Juvay!'
    },
    property: {
        short: '🏠 For Rent: {bedrooms}BR in {location} - ${price}/mo',
        long: '🏡 New Rental Available!\n\n{title}\n📍 {location}\n🛏️ {bedrooms} Bedrooms | 🚿 {bathrooms} Bathrooms\n💰 ${price}/month\n\n{description}\n\n{cta}',
        cta: '🔑 View on Juvay!'
    },
    promo: {
        short: '🎁 {promo_title} - Save {discount}%!',
        long: '💥 SPECIAL OFFER!\n\n{promo_title}\n🏷️ Save {discount}%\n⏰ Valid until {expiry}\n\n{description}\n\n{cta}',
        cta: '🛒 Claim offer on Juvay!'
    },
    blog: {
        short: '📚 New: {title} | Read now',
        long: '📖 New Article!\n\n{title}\n\n{excerpt}\n\n⏱️ {reading_time} min read\n\n{cta}',
        cta: '📲 Read on Juvay!'
    },
    engagement: {
        short: '{question}',
        long: '🗣️ We want to hear from you!\n\n{question}\n\nDrop your answer in the comments! 👇',
        cta: '💬 Join the conversation!'
    },
    brand: {
        short: '{message}',
        long: '{message}\n\n🌴 Juvay - Your Local Digital Marketplace',
        cta: '🔗 juvay.app'
    }
};

// ============================================
// ENGAGEMENT PROMPTS (T&T themed)
// ============================================

const ENGAGEMENT_PROMPTS = [
    'What\'s your favorite spot to lime in Trinidad? 🍹',
    'Doubles or Bake & Shark? Comment your choice! 🤔',
    'Which area has the best roti in T&T? 🫓',
    'What business would you like to see more of in your area? 💼',
    'If you could live anywhere in T&T, where would it be? 🏠',
    'What\'s one thing you love about Trinidad & Tobago? 🇹🇹❤️',
    'Beach or river lime this weekend? 🏖️🌊',
    'What\'s your hustle? Share your business! 💪',
    'Best maxi route in Trinidad? 🚐',
    'Carnival or J\'Ouvert? Which one gets you excited? 🎭'
];

// ============================================
// SOCIAL CONTENT SERVICE
// ============================================

class SocialContentService {
    /**
     * Generate social media content for a listing/item
     */
    async generateContent(request: ContentGenerationRequest): Promise<SocialPost[]> {
        const { type, platforms, data, tone = 'casual', includeHashtags = true, includeEmojis = true } = request;

        const posts: SocialPost[] = [];

        for (const platform of platforms) {
            const config = PLATFORM_CONFIGS[platform];
            const template = CONTENT_TEMPLATES[type];

            // Generate base content
            let text = this.renderTemplate(template.long, data);

            // Adjust length for platform
            if (text.length > config.maxLength) {
                text = this.renderTemplate(template.short, data) + '\n\n' + template.cta;
            }

            // Add emojis based on platform
            if (!includeEmojis || config.emojiLevel === 'low') {
                text = this.removeEmojis(text);
            }

            // Generate hashtags
            let hashtags: string[] = [];
            if (includeHashtags && config.hashtagStyle !== 'none') {
                hashtags = this.getHashtags(type, data);

                if (config.hashtagStyle === 'bottom') {
                    text += '\n\n' + hashtags.join(' ');
                } else {
                    // Inline - add to end of main text
                    const hashtagStr = hashtags.slice(0, 3).join(' ');
                    text = text.replace(/\n\n[^]*$/, '\n\n' + hashtagStr);
                }
            }

            // Ensure within limit
            if (text.length > config.maxLength) {
                text = text.substring(0, config.maxLength - 3) + '...';
            }

            // Generate image prompt for AI image generation
            const imagePrompt = await this.generateImagePrompt(type, data);

            posts.push({
                id: `sp_${Date.now()}_${platform}`,
                platform,
                content_type: type,
                text,
                hashtags,
                emoji_text: text,
                image_prompt: imagePrompt,
                source_id: data.id as string,
                source_type: type,
                status: 'draft',
                created_at: new Date().toISOString()
            });
        }

        return posts;
    }

    /**
     * Generate AI-enhanced social content
     */
    async generateAIContent(
        type: ContentType,
        data: Record<string, unknown>,
        platform: SocialPlatform
    ): Promise<string> {
        const config = PLATFORM_CONFIGS[platform];

        const prompt = `Write a ${platform} post for Juvay (Trinidad & Tobago marketplace).`

Type: ${type}
Data: ${JSON.stringify(data)}
Max length: ${config.maxLength} characters
Emoji level: ${config.emojiLevel}

Write in a friendly Caribbean tone. Include:
- Engaging hook
- Key details
- Call to action
- Relevant emojis

Return only the post text.`;

        try {
            const response = await aiService.generateText(prompt);
            let text = response.trim();

            if (text.length > config.maxLength) {
                text = text.substring(0, config.maxLength - 3) + '...';
            }

            return text;
        } catch {
            // Fall back to template
            return this.renderTemplate(CONTENT_TEMPLATES[type].long, data);
        }
    }

    /**
     * Generate a week's worth of engagement posts
     */
    async generateWeeklyEngagement(): Promise<SocialPost[]> {
        const posts: SocialPost[] = [];
        const platforms: SocialPlatform[] = ['facebook', 'instagram', 'twitter'];

        // Pick 7 random prompts
        const shuffled = [...ENGAGEMENT_PROMPTS].sort(() => Math.random() - 0.5);
        const weeklyPrompts = shuffled.slice(0, 7);

        for (let i = 0; i < 7; i++) {
            const prompt = weeklyPrompts[i];
            const platform = platforms[i % platforms.length];

            const post = await this.generateContent({
                type: 'engagement',
                platforms: [platform],
                data: { question: prompt }
            });

            // Schedule for each day
            const scheduleDate = new Date();
            scheduleDate.setDate(scheduleDate.getDate() + i);
            scheduleDate.setHours(12, 0, 0, 0); // Noon each day

            posts.push({
                ...post[0],
                scheduled_for: scheduleDate.toISOString(),
                status: 'scheduled'
            });
        }

        return posts;
    }

    /**
     * Generate content for new listing
     */
    async generateListingPosts(listing: {
        id: string;
        title: string;
        price: number;
        location: string;
        description?: string;
        type?: string;
    }): Promise<SocialPost[]> {
        return this.generateContent({
            type: 'listing',
            platforms: ['facebook', 'instagram', 'whatsapp'],
            data: {
                ...listing,
                price: listing.price.toLocaleString()
            }
        });
    }

    /**
     * Generate content for new job
     */
    async generateJobPosts(job: {
        id: string;
        title: string;
        company: string;
        location: string;
        salary?: string;
        requirements?: string;
    }): Promise<SocialPost[]> {
        return this.generateContent({
            type: 'job',
            platforms: ['facebook', 'linkedin', 'twitter'],
            data: job
        });
    }

    /**
     * Generate content for event
     */
    async generateEventPosts(event: {
        id: string;
        title: string;
        date: string;
        venue: string;
        price?: string;
        description?: string;
    }): Promise<SocialPost[]> {
        return this.generateContent({
            type: 'event',
            platforms: ['facebook', 'instagram', 'twitter'],
            data: event
        });
    }

    /**
     * Generate content for blog post
     */
    async generateBlogPromotion(blog: {
        id: string;
        title: string;
        excerpt: string;
        reading_time: number;
        url: string;
    }): Promise<SocialPost[]> {
        return this.generateContent({
            type: 'blog',
            platforms: ['facebook', 'twitter', 'linkedin'],
            data: blog
        });
    }

    /**
     * Save posts to database
     */
    async savePosts(posts: SocialPost[]): Promise<void> {
        await supabase.from('social_posts').insert(posts);
    }

    /**
     * Get scheduled posts
     */
    async getScheduledPosts(
        platform?: SocialPlatform,
        limit = 20
    ): Promise<SocialPost[]> {
        let query = supabase
            .from('social_posts')
            .select('*')
            .eq('status', 'scheduled')
            .gte('scheduled_for', new Date().toISOString())
            .order('scheduled_for', { ascending: true })
            .limit(limit);

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data } = await query;
        return (data || []) as SocialPost[];
    }

    /**
     * Update post status
     */
    async updatePostStatus(
        postId: string,
        status: SocialPost['status'],
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await supabase
            .from('social_posts')
            .update({
                status,
                posted_at: status === 'posted' ? new Date().toISOString() : undefined,
                ...metadata
            })
            .eq('id', postId);
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private renderTemplate(template: string, data: Record<string, unknown>): string {
        return template.replace(/{(\w+)}/g, (_, key) => String(data[key] ?? ''));
    }

    private removeEmojis(text: string): string {
        return text.replace(
            /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
            ''
        ).replace(/\s+/g, ' ').trim();
    }

    private getHashtags(type: ContentType, data: Record<string, unknown>): string[] {
        const hashtags = [...TT_HASHTAGS.general];

        // Add type-specific hashtags
        const typeMap: Record<ContentType, string> = {
            listing: 'marketplace',
            event: 'events',
            job: 'jobs',
            property: 'real_estate',
            promo: 'general',
            blog: 'general',
            engagement: 'general',
            brand: 'general'
        };

        const categoryKey = typeMap[type];
        if (TT_HASHTAGS[categoryKey]) {
            hashtags.push(...TT_HASHTAGS[categoryKey]);
        }

        // Add location hashtag if available
        if (data.location) {
            const locationTag = `#${String(data.location).replace(/\s+/g, '')}`;
            hashtags.push(locationTag);
        }

        // Shuffle and limit
        return hashtags.sort(() => Math.random() - 0.5).slice(0, 10);
    }

    private async generateImagePrompt(
        type: ContentType,
        data: Record<string, unknown>
    ): Promise<string> {
        const basePrompts: Record<ContentType, string> = {
            listing: 'Product photography of {title}, professional lighting, clean background, Trinidad Caribbean style',
            event: 'Event poster for {title}, vibrant colors, Trinidad Carnival vibes, exciting atmosphere',
            job: 'Professional office setting in Trinidad, diverse team, modern workplace',
            property: 'Real estate photo of {title} property, tropical Caribbean architecture, sunny day',
            promo: 'Sale banner, vibrant colors, Trinidad flag colors, exciting promotional design',
            blog: 'Blog header image about {title}, professional, informative, Caribbean context',
            engagement: 'Social media engagement post, colorful, Trinidad culture, community vibes',
            brand: 'Juvay brand imagery, Trinidad marketplace, digital platform, modern Caribbean'
        };

        return basePrompts[type].replace(/{(\w+)}/g, (_, key) => String(data[key] ?? type));
    }
}

// ============================================
// SINGLETON & EXPORTS
// ============================================

export const socialContentService = new SocialContentService();

export default socialContentService;
