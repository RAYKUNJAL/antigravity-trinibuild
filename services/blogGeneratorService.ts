/**
 * BlogGeneratorService - AI-powered blog content generation
 * Creates SEO-optimized blog posts for TriniBuild merchants
 * 
 * Features:
 * - Multi-section blog generation
 * - SEO keyword optimization
 * - Automatic scheduling
 * - Social media card generation
 * - Analytics tracking
 */

import { supabase } from './supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface BlogPostRequest {
  title: string;
  topic: string;
  targetKeywords: string[];
  audience?: string;
  tone?: 'professional' | 'friendly' | 'authoritative' | 'casual';
  length?: 'short' | 'medium' | 'long'; // 500, 1000, 1500 words
  storeId: string;
  schedule?: {
    publishDate?: string;
    autoPublish?: boolean;
  };
}

export interface BlogSection {
  heading: string;
  content: string;
  keywords?: string[];
}

export interface GeneratedBlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  sections: BlogSection[];
  seoMetadata: {
    metaDescription: string;
    keywords: string[];
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
    canonicalUrl?: string;
  };
  socialCards: {
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  metadata: {
    generatedAt: string;
    estimatedReadTime: number;
    wordCount: number;
    model: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID || '';
const MODEL = 'gpt-4o-mini';

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

const BASE_SYSTEM_PROMPT = `You are an expert blog writer specializing in Trinidad & Tobago markets.

YOUR ROLE:
- Write engaging, informative blog posts
- Optimize naturally for SEO keywords
- Use authentic Trinidad & Tobago voice and references
- Include practical, actionable advice
- Create shareable, social-media-friendly content

TONE GUIDELINES:
- Professional: Authoritative, well-researched, formal
- Friendly: Warm, conversational, approachable
- Authoritative: Expert knowledge, confident, trustworthy
- Casual: Relaxed, humor where appropriate, personal

OUTPUT:
Return ONLY valid JSON - NO markdown, NO code blocks, NO extra text.`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class BlogGeneratorService {
  /**
   * Check if OpenAI is configured
   */
  static isConfigured(): boolean {
    return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');
  }

  /**
   * Generate a complete blog post
   */
  static async generateBlogPost(request: BlogPostRequest): Promise<GeneratedBlogPost> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API not configured. Add VITE_OPENAI_API_KEY to environment.');
    }

    const wordCount = this._getWordCountTarget(request.length || 'medium');
    const sectionCount = this._getSectionCount(request.length || 'medium');

    // Generate main content
    const contentPrompt = this._buildContentPrompt(request, wordCount);
    const content = await this._callOpenAI(contentPrompt);

    // Generate sections
    const sectionsPrompt = this._buildSectionsPrompt(request, sectionCount);
    const sectionsData = await this._callOpenAI(sectionsPrompt);

    // Generate SEO metadata
    const seoPrompt = this._buildSEOPrompt(request, content);
    const seoData = await this._callOpenAI(seoPrompt);

    // Generate social cards
    const socialPrompt = this._buildSocialPrompt(request);
    const socialData = await this._callOpenAI(socialPrompt);

    const slug = this._generateSlug(request.title);
    const readTime = Math.ceil(content.length / 200); // ~200 words per minute reading speed

    return {
      title: request.title,
      slug,
      excerpt: content.substring(0, 160),
      content,
      sections: this._parseSections(sectionsData),
      seoMetadata: {
        metaDescription: seoData.metaDescription || content.substring(0, 155),
        keywords: request.targetKeywords,
        ogTitle: seoData.ogTitle || request.title,
        ogDescription: seoData.ogDescription || content.substring(0, 155),
        ogImage: seoData.ogImage,
        canonicalUrl: seoData.canonicalUrl
      },
      socialCards: {
        twitter: socialData.twitter || request.title,
        facebook: socialData.facebook || request.title,
        linkedin: socialData.linkedin || request.title
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        estimatedReadTime: readTime,
        wordCount: content.length / 5, // rough estimate
        model: MODEL
      }
    };
  }

  /**
   * Save blog post to database
   */
  static async saveBlogPost(
    storeId: string,
    post: GeneratedBlogPost,
    options?: { autoPublish?: boolean; publishDate?: string }
  ) {
    try {
      const { data, error } = await supabase
        .from('ai_blog_posts')
        .insert({
          store_id: storeId,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          sections: post.sections,
          seo_metadata: post.seoMetadata,
          social_cards: post.socialCards,
          word_count: post.metadata.wordCount,
          read_time: post.metadata.estimatedReadTime,
          generated_at: post.metadata.generatedAt,
          is_published: options?.autoPublish || false,
          published_at: options?.publishDate || null,
          status: options?.autoPublish ? 'published' : 'draft'
        })
        .select('id');

      if (error) throw error;

      return {
        success: true,
        id: data?.[0]?.id,
        post
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Schedule blog post for publishing
   */
  static async scheduleBlogPost(
    postId: string,
    publishDate: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_blog_posts')
        .update({
          published_at: publishDate,
          status: 'scheduled'
        })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Publish blog post immediately
   */
  static async publishBlogPost(postId: string) {
    try {
      const { error } = await supabase
        .from('ai_blog_posts')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          status: 'published'
        })
        .eq('id', postId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get blog posts for a store
   */
  static async getBlogPosts(storeId: string, status?: 'draft' | 'published' | 'scheduled') {
    try {
      let query = supabase
        .from('ai_blog_posts')
        .select('*')
        .eq('store_id', storeId)
        .order('generated_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, posts: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete blog post
   */
  static async deleteBlogPost(postId: string) {
    try {
      const { error } = await supabase
        .from('ai_blog_posts')
        .delete()
        .eq('id', postId)
        .neq('status', 'published'); // Don't delete published posts

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get blog analytics
   */
  static async getBlogAnalytics(storeId: string) {
    try {
      const { data: posts, error } = await supabase
        .from('ai_blog_posts')
        .select('id, title, status, published_at, word_count')
        .eq('store_id', storeId);

      if (error) throw error;

      const published = posts?.filter(p => p.status === 'published').length || 0;
      const totalWords = posts?.reduce((sum, p) => sum + (p.word_count || 0), 0) || 0;

      return {
        success: true,
        analytics: {
          totalPosts: posts?.length || 0,
          publishedPosts: published,
          totalWords,
          averageWordCount: posts && posts.length > 0 ? Math.round(totalWords / posts.length) : 0
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private static async _callOpenAI(prompt: string): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        ...(OPENAI_ORG_ID && { 'OpenAI-Organization': OPENAI_ORG_ID })
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: BASE_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`OpenAI error: ${err?.error?.message || 'Unknown'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error('No response from OpenAI');

    try {
      return JSON.parse(content);
    } catch {
      console.error('Parse error:', content);
      throw new Error('Invalid JSON response');
    }
  }

  private static _buildContentPrompt(request: BlogPostRequest, wordCount: number): string {
    return `Write a blog post about: "${request.topic}"

Target keywords to include naturally: ${request.targetKeywords.join(', ')}
Tone: ${request.tone || 'professional'}
Target audience: ${request.audience || 'Trinidad & Tobago businesses'}
Word count target: ~${wordCount} words

Include practical, actionable tips.
Reference Trinidad & Tobago context where relevant.

Return JSON with:
{
  "content": "full blog post content"
}`;
  }

  private static _buildSectionsPrompt(request: BlogPostRequest, sectionCount: number): string {
    return `Create ${sectionCount} blog sections for: "${request.topic}"

Keywords: ${request.targetKeywords.join(', ')}

Return JSON with:
{
  "sections": [
    {
      "heading": "section heading",
      "content": "section content (100-300 words)",
      "keywords": ["keyword1", "keyword2"]
    }
  ]
}`;
  }

  private static _buildSEOPrompt(request: BlogPostRequest, content: string): string {
    return `Create SEO metadata for this blog post:
Title: ${request.title}
Keywords: ${request.targetKeywords.join(', ')}
Content preview: ${content.substring(0, 300)}...

Return JSON with:
{
  "metaDescription": "155-160 character meta description",
  "ogTitle": "SEO-optimized title",
  "ogDescription": "Social media description"
}`;
  }

  private static _buildSocialPrompt(request: BlogPostRequest): string {
    return `Create social media copy for: "${request.title}"

Return JSON with:
{
  "twitter": "thread-ready Twitter copy",
  "facebook": "Facebook post copy",
  "linkedin": "LinkedIn post copy"
}`;
  }

  private static _generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private static _getWordCountTarget(length: string): number {
    switch (length) {
      case 'short':
        return 500;
      case 'long':
        return 1500;
      default:
        return 1000;
    }
  }

  private static _getSectionCount(length: string): number {
    switch (length) {
      case 'short':
        return 3;
      case 'long':
        return 6;
      default:
        return 4;
    }
  }

  private static _parseSections(data: any): BlogSection[] {
    if (!data.sections || !Array.isArray(data.sections)) {
      return [];
    }
    return data.sections.map((s: any) => ({
      heading: s.heading || '',
      content: s.content || '',
      keywords: s.keywords || []
    }));
  }
}

export default BlogGeneratorService;
