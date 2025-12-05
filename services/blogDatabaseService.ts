/**
 * TriniBuild Blog Database Service
 * 
 * Handles all CRUD operations for the AI blog system including:
 * - Blog storage and retrieval
 * - Publishing workflow
 * - Queue management
 * - Analytics tracking
 * - Sitemap generation
 */

import { supabase } from './supabaseClient';
import { GeneratedBlog } from './blogEngineService';

// ============================================
// TYPES
// ============================================

export type BlogStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface StoredBlog extends GeneratedBlog {
    id: string;
    status: BlogStatus;
    published_at: string | null;
    scheduled_for: string | null;
    view_count: number;
    share_count: number;
    click_through_count: number;
    social_posted: boolean;
    author_id: string | null;
    author_name: string;
    featured_image: string | null;
    excerpt: string | null;
    created_at: string;
    updated_at: string;
    last_refreshed_at: string | null;
}

export interface QueueItem {
    id: string;
    location_slug: string;
    location_name: string;
    vertical_key: string;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message: string | null;
    attempts: number;
    created_at: string;
    scheduled_for: string;
}

export interface BlogAnalytics {
    id: string;
    blog_id: string;
    date: string;
    views: number;
    unique_visitors: number;
    time_on_page_seconds: number;
    bounce_rate: number;
    google_impressions: number;
    google_clicks: number;
    signup_clicks: number;
}

export interface SchedulerSettings {
    id: string;
    is_enabled: boolean;
    blogs_per_day: number;
    preferred_publish_hour: number;
    preferred_timezone: string;
    default_word_count: number;
    default_tone: string;
    include_success_stories: boolean;
    auto_post_facebook: boolean;
    auto_post_twitter: boolean;
    auto_post_linkedin: boolean;
    notify_on_publish: boolean;
    notification_email: string | null;
}

export interface BlogFilters {
    status?: BlogStatus;
    location_slug?: string;
    vertical_key?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

// ============================================
// BLOG CRUD OPERATIONS
// ============================================

/**
 * Save a generated blog to the database
 */
export const saveBlog = async (
    blog: GeneratedBlog,
    options: {
        status?: BlogStatus;
        scheduled_for?: string;
        featured_image?: string;
        author_id?: string;
    } = {}
): Promise<StoredBlog | null> => {
    const { status = 'draft', scheduled_for, featured_image, author_id } = options;

    // Generate excerpt from markdown
    const excerpt = blog.body_markdown
        .replace(/[#*\[\]]/g, '')
        .substring(0, 200)
        .trim() + '...';

    const { data, error } = await supabase
        .from('blogs')
        .upsert({
            location_name: blog.location_name,
            location_slug: blog.location_slug,
            region: blog.region,
            island: blog.island,
            vertical_key: blog.vertical_key,
            vertical_label: blog.vertical_label,
            seo_title: blog.seo_title,
            meta_description: blog.meta_description,
            url_slug: blog.url_slug,
            primary_keyword: blog.primary_keyword,
            secondary_keywords: blog.secondary_keywords,
            h1: blog.h1,
            headings: blog.headings,
            body_markdown: blog.body_markdown,
            body_html: blog.body_html,
            excerpt,
            featured_image,
            cta_blocks: blog.cta_blocks,
            internal_links_used: blog.internal_links_used,
            word_count: blog.word_count,
            reading_time_minutes: blog.reading_time_minutes,
            tone_variant: blog.tone_variant,
            schema_org: blog.schema_org,
            open_graph: blog.open_graph,
            twitter_card: blog.twitter_card,
            status,
            scheduled_for,
            published_at: status === 'published' ? new Date().toISOString() : null,
            author_id,
            author_name: 'TriniBuild AI'
        }, {
            onConflict: 'location_slug,vertical_key'
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving blog:', error);
        return null;
    }

    return data as StoredBlog;
};

/**
 * Get a blog by its URL slug
 */
export const getBlogBySlug = async (urlSlug: string): Promise<StoredBlog | null> => {
    const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('url_slug', urlSlug)
        .single();

    if (error) {
        console.error('Error fetching blog:', error);
        return null;
    }

    return data as StoredBlog;
};

/**
 * Get all blogs with filters
 */
export const getBlogs = async (filters: BlogFilters = {}): Promise<StoredBlog[]> => {
    const { status, location_slug, vertical_key, search, limit = 50, offset = 0 } = filters;

    let query = supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }

    if (location_slug) {
        query = query.eq('location_slug', location_slug);
    }

    if (vertical_key) {
        query = query.eq('vertical_key', vertical_key);
    }

    if (search) {
        query = query.or(`seo_title.ilike.%${search}%,location_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching blogs:', error);
        return [];
    }

    return data as StoredBlog[];
};

/**
 * Get published blogs for public display
 */
export const getPublishedBlogs = async (limit = 20, offset = 0): Promise<StoredBlog[]> => {
    return getBlogs({ status: 'published', limit, offset });
};

/**
 * Update blog status
 */
export const updateBlogStatus = async (
    blogId: string,
    status: BlogStatus,
    scheduled_for?: string
): Promise<boolean> => {
    const updateData: Record<string, unknown> = { status };

    if (status === 'published') {
        updateData.published_at = new Date().toISOString();
    }

    if (status === 'scheduled' && scheduled_for) {
        updateData.scheduled_for = scheduled_for;
    }

    const { error } = await supabase
        .from('blogs')
        .update(updateData)
        .eq('id', blogId);

    return !error;
};

/**
 * Delete a blog
 */
export const deleteBlog = async (blogId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

    return !error;
};

/**
 * Check if a blog already exists for location+vertical
 */
export const blogExists = async (locationSlug: string, verticalKey: string): Promise<boolean> => {
    const { data } = await supabase
        .from('blogs')
        .select('id')
        .eq('location_slug', locationSlug)
        .eq('vertical_key', verticalKey)
        .single();

    return !!data;
};

// ============================================
// QUEUE OPERATIONS
// ============================================

/**
 * Add items to the generation queue
 */
export const addToQueue = async (
    items: { location_slug: string; location_name: string; vertical_key: string; priority?: number }[]
): Promise<number> => {
    const queueItems = items.map(item => ({
        location_slug: item.location_slug,
        location_name: item.location_name,
        vertical_key: item.vertical_key,
        priority: item.priority || 5,
        status: 'pending' as const,
        scheduled_for: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('blog_generation_queue')
        .upsert(queueItems, {
            onConflict: 'location_slug,vertical_key,status',
            ignoreDuplicates: true
        })
        .select();

    if (error) {
        console.error('Error adding to queue:', error);
        return 0;
    }

    return data?.length || 0;
};

/**
 * Get pending queue items
 */
export const getPendingQueueItems = async (limit = 10): Promise<QueueItem[]> => {
    const { data, error } = await supabase
        .from('blog_generation_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .order('scheduled_for', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching queue:', error);
        return [];
    }

    return data as QueueItem[];
};

/**
 * Update queue item status
 */
export const updateQueueItem = async (
    itemId: string,
    status: 'completed' | 'failed',
    errorMessage?: string
): Promise<boolean> => {
    const { error } = await supabase
        .from('blog_generation_queue')
        .update({
            status,
            error_message: errorMessage || null,
            processed_at: new Date().toISOString()
        })
        .eq('id', itemId);

    return !error;
};

/**
 * Get queue statistics
 */
export const getQueueStats = async (): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}> => {
    const { data, error } = await supabase
        .from('blog_generation_queue')
        .select('status');

    if (error || !data) {
        return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }

    return {
        pending: data.filter(d => d.status === 'pending').length,
        processing: data.filter(d => d.status === 'processing').length,
        completed: data.filter(d => d.status === 'completed').length,
        failed: data.filter(d => d.status === 'failed').length
    };
};

// ============================================
// ANALYTICS OPERATIONS
// ============================================

/**
 * Track a blog view
 */
export const trackBlogView = async (blogId: string): Promise<void> => {
    // Call the database function to increment views
    await supabase.rpc('increment_blog_views', { blog_uuid: blogId });
};

/**
 * Get analytics for a blog
 */
export const getBlogAnalytics = async (
    blogId: string,
    days = 30
): Promise<BlogAnalytics[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('blog_analytics')
        .select('*')
        .eq('blog_id', blogId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching analytics:', error);
        return [];
    }

    return data as BlogAnalytics[];
};

/**
 * Get overall blog statistics
 */
export const getBlogStats = async (): Promise<{
    total_blogs: number;
    published: number;
    drafts: number;
    scheduled: number;
    total_views: number;
    locations_covered: number;
}> => {
    const { data: blogs, error } = await supabase
        .from('blogs')
        .select('status, view_count, location_slug');

    if (error || !blogs) {
        return {
            total_blogs: 0,
            published: 0,
            drafts: 0,
            scheduled: 0,
            total_views: 0,
            locations_covered: 0
        };
    }

    const uniqueLocations = new Set(blogs.map(b => b.location_slug));

    return {
        total_blogs: blogs.length,
        published: blogs.filter(b => b.status === 'published').length,
        drafts: blogs.filter(b => b.status === 'draft').length,
        scheduled: blogs.filter(b => b.status === 'scheduled').length,
        total_views: blogs.reduce((sum, b) => sum + (b.view_count || 0), 0),
        locations_covered: uniqueLocations.size
    };
};

// ============================================
// SCHEDULER SETTINGS
// ============================================

/**
 * Get scheduler settings
 */
export const getSchedulerSettings = async (): Promise<SchedulerSettings | null> => {
    const { data, error } = await supabase
        .from('blog_scheduler_settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching settings:', error);
        return null;
    }

    return data as SchedulerSettings;
};

/**
 * Update scheduler settings
 */
export const updateSchedulerSettings = async (
    settings: Partial<SchedulerSettings>
): Promise<boolean> => {
    const { error } = await supabase
        .from('blog_scheduler_settings')
        .update(settings)
        .eq('id', settings.id);

    return !error;
};

// ============================================
// SITEMAP GENERATION
// ============================================

/**
 * Generate XML sitemap for all published blogs
 */
export const generateSitemap = async (): Promise<string> => {
    const blogs = await getPublishedBlogs(1000, 0);

    const baseUrl = 'https://trinibuild.com';

    const urls = blogs.map(blog => `
    <url>
      <loc>${baseUrl}/blog/${blog.url_slug}</loc>
      <lastmod>${new Date(blog.updated_at).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`
    ).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${urls}
</urlset>`;

    // Cache the sitemap
    await supabase
        .from('blog_sitemap_cache')
        .upsert({
            sitemap_xml: sitemap,
            blog_count: blogs.length,
            last_generated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
        });

    return sitemap;
};

/**
 * Get cached sitemap or generate new one
 */
export const getSitemap = async (): Promise<string> => {
    const { data } = await supabase
        .from('blog_sitemap_cache')
        .select('sitemap_xml, expires_at')
        .order('last_generated_at', { ascending: false })
        .limit(1)
        .single();

    if (data && new Date(data.expires_at) > new Date()) {
        return data.sitemap_xml;
    }

    return generateSitemap();
};

// ============================================
// SOCIAL MEDIA
// ============================================

/**
 * Create a social media post record
 */
export const createSocialPost = async (
    blogId: string,
    platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'whatsapp'
): Promise<string | null> => {
    const { data, error } = await supabase
        .from('blog_social_posts')
        .insert({
            blog_id: blogId,
            platform,
            status: 'pending'
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating social post:', error);
        return null;
    }

    return data.id;
};

/**
 * Update social post status
 */
export const updateSocialPost = async (
    postId: string,
    status: 'posted' | 'failed',
    postUrl?: string,
    externalPostId?: string,
    errorMessage?: string
): Promise<boolean> => {
    const { error } = await supabase
        .from('blog_social_posts')
        .update({
            status,
            post_url: postUrl,
            post_id: externalPostId,
            posted_at: status === 'posted' ? new Date().toISOString() : null,
            error_message: errorMessage
        })
        .eq('id', postId);

    return !error;
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Queue all ungenerated location+vertical combinations
 */
export const queueAllMissingBlogs = async (
    locations: { slug: string; name: string; isMajorCity?: boolean }[],
    verticals: string[]
): Promise<number> => {
    const items: { location_slug: string; location_name: string; vertical_key: string; priority: number }[] = [];

    for (const location of locations) {
        for (const vertical of verticals) {
            const exists = await blogExists(location.slug, vertical);
            if (!exists) {
                items.push({
                    location_slug: location.slug,
                    location_name: location.name,
                    vertical_key: vertical,
                    priority: location.isMajorCity ? 1 : 3
                });
            }
        }
    }

    if (items.length === 0) return 0;

    return addToQueue(items);
};

/**
 * Publish all scheduled blogs that are due
 */
export const publishScheduledBlogs = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('publish_scheduled_blogs');

    if (error) {
        console.error('Error publishing scheduled blogs:', error);
        return 0;
    }

    return data || 0;
};
