/**
 * TriniBuild Blog Automation Service
 * 
 * Handles automated blog generation, scheduling, and social media posting.
 * This service runs in the background to:
 * - Process the generation queue
 * - Publish scheduled blogs
 * - Auto-post to social media
 * - Generate AI images for blogs
 */

import {
    generateLocationBlog,
    TRINIDAD_LOCATIONS,
    BLOG_VERTICALS,
    getLocationBySlug
} from './blogEngineService';
import {
    saveBlog,
    getPendingQueueItems,
    updateQueueItem,
    addToQueue,
    getSchedulerSettings,
    publishScheduledBlogs,
    blogExists,
    createSocialPost,
    updateSocialPost,
    getBlogBySlug,
    StoredBlog
} from './blogDatabaseService';
import { aiService } from './ai';

// ============================================
// TYPES
// ============================================

export interface AutomationStatus {
    isRunning: boolean;
    lastRun: string | null;
    blogsGenerated: number;
    blogsPublished: number;
    errors: string[];
}

export interface GenerationResult {
    success: boolean;
    blogId?: string;
    error?: string;
}

// ============================================
// QUEUE PROCESSING
// ============================================

let isProcessingQueue = false;

/**
 * Process the next batch of items in the generation queue
 */
export const processQueue = async (batchSize = 3): Promise<GenerationResult[]> => {
    if (isProcessingQueue) {
        console.log('Queue processing already in progress');
        return [];
    }

    isProcessingQueue = true;
    const results: GenerationResult[] = [];

    try {
        const queueItems = await getPendingQueueItems(batchSize);

        for (const item of queueItems) {
            console.log(`Processing: ${item.location_name} - ${item.vertical_key}`);

            try {
                const location = getLocationBySlug(item.location_slug);
                if (!location) {
                    throw new Error(`Location not found: ${item.location_slug}`);
                }

                // Check if already exists (prevent duplicates)
                const exists = await blogExists(item.location_slug, item.vertical_key);
                if (exists) {
                    await updateQueueItem(item.id, 'completed');
                    results.push({ success: true, error: 'Already exists, skipped' });
                    continue;
                }

                // Generate the blog
                const blog = await generateLocationBlog({
                    location,
                    vertical_key: item.vertical_key,
                    word_count_target: 1200,
                    tone_variant: 'default',
                    include_hypothetical_story: true
                });

                // Generate featured image (if AI image service available)
                const featuredImage = await generateBlogImage(blog.h1, item.vertical_key);

                // Save to database as draft
                const savedBlog = await saveBlog(blog, {
                    status: 'draft',
                    featured_image: featuredImage
                });

                if (savedBlog) {
                    await updateQueueItem(item.id, 'completed');
                    results.push({ success: true, blogId: savedBlog.id });
                    console.log(`✅ Generated: ${blog.h1}`);
                } else {
                    throw new Error('Failed to save blog to database');
                }

                // Small delay between generations to avoid rate limiting
                await delay(2000);

            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`❌ Error processing ${item.location_name}:`, errorMsg);
                await updateQueueItem(item.id, 'failed', errorMsg);
                results.push({ success: false, error: errorMsg });
            }
        }

    } finally {
        isProcessingQueue = false;
    }

    return results;
};

/**
 * Queue blogs for a specific region
 */
export const queueBlogsForRegion = async (
    region: string,
    verticals = ['jobs', 'stores', 'tickets', 'real_estate', 'rideshare']
): Promise<number> => {
    const locations = TRINIDAD_LOCATIONS.filter(l => l.region_or_municipality === region);

    const items = locations.flatMap(loc =>
        verticals.map(v => ({
            location_slug: loc.slug,
            location_name: loc.name,
            vertical_key: v,
            priority: loc.isMajorCity ? 1 : 3
        }))
    );

    return addToQueue(items);
};

/**
 * Queue blogs for major cities first
 */
export const queueMajorCityBlogs = async (
    verticals = ['jobs', 'stores', 'tickets', 'real_estate', 'rideshare']
): Promise<number> => {
    const majorCities = TRINIDAD_LOCATIONS.filter(l => l.isMajorCity);

    const items = majorCities.flatMap(loc =>
        verticals.map(v => ({
            location_slug: loc.slug,
            location_name: loc.name,
            vertical_key: v,
            priority: 1
        }))
    );

    return addToQueue(items);
};

/**
 * Queue ALL possible blogs (major cities first, then others)
 */
export const queueAllBlogs = async (): Promise<number> => {
    const verticals = BLOG_VERTICALS.filter(v => v.key !== 'combo').map(v => v.key);

    // Sort: major cities first, then by population estimate
    const sortedLocations = [...TRINIDAD_LOCATIONS].sort((a, b) => {
        if (a.isMajorCity && !b.isMajorCity) return -1;
        if (!a.isMajorCity && b.isMajorCity) return 1;
        return (b.population_estimate || 0) - (a.population_estimate || 0);
    });

    const items = sortedLocations.flatMap(loc =>
        verticals.map(v => ({
            location_slug: loc.slug,
            location_name: loc.name,
            vertical_key: v,
            priority: loc.isMajorCity ? 1 : loc.population_estimate && loc.population_estimate > 10000 ? 2 : 3
        }))
    );

    return addToQueue(items);
};

// ============================================
// SCHEDULED PUBLISHING
// ============================================

/**
 * Check and publish any scheduled blogs that are due
 */
export const checkAndPublishScheduled = async (): Promise<number> => {
    console.log('Checking for scheduled blogs to publish...');
    const count = await publishScheduledBlogs();
    if (count > 0) {
        console.log(`✅ Published ${count} scheduled blog(s)`);
    }
    return count;
};

// ============================================
// AI IMAGE GENERATION
// ============================================

/**
 * Generate a featured image for a blog post using AI
 */
export const generateBlogImage = async (
    title: string,
    verticalKey: string
): Promise<string | null> => {
    // Vertical-specific image prompts
    const verticalPrompts: Record<string, string> = {
        jobs: 'professional business people working, office environment, Trinidad and Tobago, Caribbean, modern workplace',
        stores: 'vibrant local market, small business storefront, Caribbean shopping, Trinidad marketplace',
        tickets: 'exciting event, concert crowd, festival atmosphere, Trinidad carnival vibes',
        real_estate: 'beautiful home, tropical property, real estate, Trinidad house, caribbean architecture',
        rideshare: 'rideshare driver, car in Trinidad streets, Caribbean city transportation'
    };

    const basePrompt = verticalPrompts[verticalKey] || 'Trinidad and Tobago landscape, Caribbean business';

    try {
        // For now, return a placeholder image from Unsplash
        // In production, this would call an AI image generation API
        const unsplashImages: Record<string, string> = {
            jobs: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1200',
            stores: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200',
            tickets: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200',
            real_estate: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200',
            rideshare: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200'
        };

        return unsplashImages[verticalKey] || unsplashImages.jobs;

    } catch (error) {
        console.error('Error generating blog image:', error);
        return null;
    }
};

// ============================================
// SOCIAL MEDIA AUTO-POSTING
// ============================================

/**
 * Generate social media post text for a blog
 */
export const generateSocialPostText = async (
    blog: StoredBlog,
    platform: 'facebook' | 'twitter' | 'linkedin'
): Promise<string> => {
    const maxLength = platform === 'twitter' ? 280 : 500;
    const blogUrl = `https://trinibuild.com/blog/${blog.url_slug}`;

    const prompt = `Write a ${platform} post promoting this blog article:
Title: "${blog.h1}"
Location: ${blog.location_name}, Trinidad & Tobago
Topic: ${blog.vertical_label}
Summary: ${blog.excerpt}

Requirements:
- Maximum ${maxLength} characters
- Include the URL: ${blogUrl}
- Use relevant hashtags (2-3 max)
- Make it engaging for Trinidad & Tobago audience
- Include a call to action

Write ONLY the post text, nothing else.`;

    try {
        const response = await aiService.generateText(prompt,
            'You are a social media manager for TriniBuild, a platform in Trinidad & Tobago.'
        );
        return response.substring(0, maxLength);
    } catch {
        // Fallback post
        return `🇹🇹 New article: ${blog.h1}\n\n${blog.excerpt?.substring(0, 100)}...\n\n👉 Read more: ${blogUrl}\n\n#TriniBuild #Trinidad #${blog.vertical_key}`;
    }
};

/**
 * Auto-post a blog to social media platforms
 */
export const autoPostToSocial = async (
    blogId: string,
    platforms: ('facebook' | 'twitter' | 'linkedin')[] = ['facebook', 'twitter']
): Promise<{ platform: string; success: boolean; error?: string }[]> => {
    const blog = await getBlogBySlug(blogId);
    if (!blog) {
        return platforms.map(p => ({ platform: p, success: false, error: 'Blog not found' }));
    }

    const results: { platform: string; success: boolean; error?: string }[] = [];

    for (const platform of platforms) {
        try {
            // Create pending social post record
            const socialPostId = await createSocialPost(blog.id, platform);
            if (!socialPostId) {
                results.push({ platform, success: false, error: 'Failed to create social post record' });
                continue;
            }

            // Generate post text
            const postText = await generateSocialPostText(blog, platform);

            // In production, this would call the actual social media APIs
            // For now, we'll simulate success and store the generated text
            console.log(`[${platform.toUpperCase()}] Would post:`, postText);

            // Update social post as "posted" (simulated)
            await updateSocialPost(
                socialPostId,
                'posted',
                `https://${platform}.com/trinibuild/posts/simulated`,
                `sim_${Date.now()}`
            );

            results.push({ platform, success: true });

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            results.push({ platform, success: false, error: errorMsg });
        }
    }

    return results;
};

// ============================================
// CONTENT REFRESH
// ============================================

/**
 * Check if a blog needs refreshing (older than X days)
 */
export const needsRefresh = (blog: StoredBlog, maxAgeDays = 90): boolean => {
    const lastUpdated = new Date(blog.last_refreshed_at || blog.created_at);
    const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > maxAgeDays;
};

/**
 * Refresh an existing blog with updated content
 */
export const refreshBlog = async (blogId: string): Promise<boolean> => {
    // This would regenerate the blog content while keeping the same URL
    // For now, just return false as this is a complex operation
    console.log(`Would refresh blog: ${blogId}`);
    return false;
};

// ============================================
// AUTOMATION RUNNER
// ============================================

let automationInterval: ReturnType<typeof setInterval> | null = null;
let automationStatus: AutomationStatus = {
    isRunning: false,
    lastRun: null,
    blogsGenerated: 0,
    blogsPublished: 0,
    errors: []
};

/**
 * Start the automation service
 */
export const startAutomation = async (intervalMinutes = 30): Promise<void> => {
    if (automationInterval) {
        console.log('Automation already running');
        return;
    }

    const settings = await getSchedulerSettings();
    if (!settings?.is_enabled) {
        console.log('Automation is disabled in settings');
        return;
    }

    console.log(`🚀 Starting blog automation (every ${intervalMinutes} minutes)`);
    automationStatus.isRunning = true;

    // Run immediately
    await runAutomationCycle();

    // Then run on interval
    automationInterval = setInterval(runAutomationCycle, intervalMinutes * 60 * 1000);
};

/**
 * Stop the automation service
 */
export const stopAutomation = (): void => {
    if (automationInterval) {
        clearInterval(automationInterval);
        automationInterval = null;
        automationStatus.isRunning = false;
        console.log('🛑 Blog automation stopped');
    }
};

/**
 * Run a single automation cycle
 */
const runAutomationCycle = async (): Promise<void> => {
    console.log(`\n📅 Running automation cycle at ${new Date().toISOString()}`);
    automationStatus.lastRun = new Date().toISOString();
    automationStatus.errors = [];

    try {
        // 1. Publish scheduled blogs
        const publishedCount = await checkAndPublishScheduled();
        automationStatus.blogsPublished += publishedCount;

        // 2. Process generation queue
        const settings = await getSchedulerSettings();
        const batchSize = settings?.blogs_per_day || 3;

        const results = await processQueue(Math.min(batchSize, 5));
        const successCount = results.filter(r => r.success).length;
        automationStatus.blogsGenerated += successCount;

        // Track errors
        const errors = results.filter(r => !r.success && r.error).map(r => r.error!);
        automationStatus.errors = errors;

        console.log(`✅ Cycle complete: ${successCount} generated, ${publishedCount} published`);

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Automation cycle error:', errorMsg);
        automationStatus.errors.push(errorMsg);
    }
};

/**
 * Get current automation status
 */
export const getAutomationStatus = (): AutomationStatus => {
    return { ...automationStatus };
};

// ============================================
// UTILITIES
// ============================================

const delay = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get generation coverage statistics
 */
export const getCoverageStats = async (): Promise<{
    totalPossible: number;
    generated: number;
    coverage: number;
    byVertical: Record<string, { generated: number; total: number }>;
    byRegion: Record<string, { generated: number; total: number }>;
}> => {
    const verticals = BLOG_VERTICALS.filter(v => v.key !== 'combo').map(v => v.key);
    const totalPossible = TRINIDAD_LOCATIONS.length * verticals.length;

    // In production, this would query the database
    // For now, return estimates
    return {
        totalPossible,
        generated: 0,
        coverage: 0,
        byVertical: {},
        byRegion: {}
    };
};
