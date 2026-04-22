/**
 * SEOService - Comprehensive SEO management and optimization
 * Handles meta tags, sitemaps, robots.txt, canonical URLs, and SEO metadata
 * 
 * Features:
 * - Dynamic meta tag management
 * - Sitemap generation and management
 * - Robots.txt automation
 * - Canonical URL handling
 * - OG tags for social sharing
 * - Schema.org structured data
 * - Keyword density analysis
 */

import { supabase } from './supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SEOMetadata {
  url: string;
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  canonicalUrl?: string;
  robots?: 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow';
  viewport?: string;
  language?: string;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface RobotsConfig {
  userAgent: string[];
  allow: string[];
  disallow: string[];
  crawlDelay?: number;
  requestRate?: number;
  sitemapUrl?: string;
}

export interface SchemaData {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class SEOService {
  /**
   * Generate complete SEO metadata object
   */
  static generateMetadata(input: {
    url: string;
    title: string;
    description: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
  }): SEOMetadata {
    // Validate and trim lengths (Google limits)
    const title = this._trimToLength(input.title, 60);
    const description = this._trimToLength(input.description, 160);
    const keywords = input.keywords || [];

    return {
      url: input.url,
      title,
      description,
      keywords,
      ogTitle: title,
      ogDescription: description,
      ogImage: input.ogImage,
      twitterCard: 'summary_large_image',
      twitterSite: '@trinibuild',
      canonicalUrl: input.canonicalUrl || input.url,
      robots: 'index,follow',
      viewport: 'width=device-width, initial-scale=1.0',
      language: 'en-TT'
    };
  }

  /**
   * Generate meta tags HTML string
   */
  static generateMetaTags(metadata: SEOMetadata): string {
    const tags: string[] = [];

    tags.push(`<meta charset="UTF-8">`);
    tags.push(`<meta name="viewport" content="${metadata.viewport || 'width=device-width, initial-scale=1.0'}">`);
    tags.push(`<meta http-equiv="X-UA-Compatible" content="ie=edge">`);

    // Standard meta tags
    tags.push(`<meta name="description" content="${this._escapeHTML(metadata.description)}">`);
    tags.push(`<meta name="keywords" content="${metadata.keywords.join(', ')}">`);
    tags.push(`<meta name="language" content="${metadata.language || 'English'}">`);
    tags.push(`<meta name="robots" content="${metadata.robots || 'index,follow'}">`);

    // Open Graph tags (social sharing)
    tags.push(`<meta property="og:type" content="website">`);
    tags.push(`<meta property="og:url" content="${metadata.url}">`);
    tags.push(`<meta property="og:title" content="${this._escapeHTML(metadata.ogTitle || metadata.title)}">`);
    tags.push(`<meta property="og:description" content="${this._escapeHTML(metadata.ogDescription || metadata.description)}">`);
    if (metadata.ogImage) {
      tags.push(`<meta property="og:image" content="${metadata.ogImage}">`);
      tags.push(`<meta property="og:image:width" content="1200">`);
      tags.push(`<meta property="og:image:height" content="630">`);
    }

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${metadata.twitterCard || 'summary_large_image'}">`);
    if (metadata.twitterSite) {
      tags.push(`<meta name="twitter:site" content="${metadata.twitterSite}">`);
    }
    tags.push(`<meta name="twitter:title" content="${this._escapeHTML(metadata.ogTitle || metadata.title)}">`);
    tags.push(`<meta name="twitter:description" content="${this._escapeHTML(metadata.ogDescription || metadata.description)}">`);
    if (metadata.ogImage) {
      tags.push(`<meta name="twitter:image" content="${metadata.ogImage}">`);
    }

    // Canonical URL
    tags.push(`<link rel="canonical" href="${metadata.canonicalUrl || metadata.url}">`);

    // Additional tags
    tags.push(`<meta name="author" content="TriniBuild">`);
    tags.push(`<meta name="theme-color" content="#E61E2B">`);

    return tags.join('\n');
  }

  /**
   * Generate XML sitemap
   */
  static generateSitemap(entries: SitemapEntry[]): string {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ];

    for (const entry of entries) {
      xml.push('  <url>');
      xml.push(`    <loc>${this._escapeXML(entry.url)}</loc>`);
      if (entry.lastmod) {
        xml.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      if (entry.changefreq) {
        xml.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        xml.push(`    <priority>${entry.priority}</priority>`);
      }
      xml.push('  </url>');
    }

    xml.push('</urlset>');
    return xml.join('\n');
  }

  /**
   * Generate robots.txt content
   */
  static generateRobots(config: RobotsConfig): string {
    const lines: string[] = [];

    for (const agent of config.userAgent) {
      lines.push(`User-agent: ${agent}`);

      for (const allow of config.allow) {
        lines.push(`Allow: ${allow}`);
      }

      for (const disallow of config.disallow) {
        lines.push(`Disallow: ${disallow}`);
      }

      if (config.crawlDelay) {
        lines.push(`Crawl-delay: ${config.crawlDelay}`);
      }

      if (config.requestRate) {
        lines.push(`Request-rate: ${config.requestRate}/1m`);
      }

      lines.push('');
    }

    if (config.sitemapUrl) {
      lines.push(`Sitemap: ${config.sitemapUrl}`);
    }

    return lines.join('\n');
  }

  /**
   * Get default robots.txt for TriniBuild
   */
  static getDefaultRobots(): string {
    return this.generateRobots({
      userAgent: ['*'],
      allow: ['/'],
      disallow: [
        '/admin/',
        '/api/',
        '/auth/',
        '/search?',
        '/cart?',
        '/*.json',
        '/*.pdf'
      ],
      crawlDelay: 1,
      requestRate: 30,
      sitemapUrl: 'https://trinibuild.com/sitemap.xml'
    });
  }

  /**
   * Generate schema.org structured data (JSON-LD)
   */
  static generateSchema(type: string, data: any): string {
    const schema: SchemaData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };

    return JSON.stringify(schema, null, 2);
  }

  /**
   * Generate Organization schema
   */
  static generateOrganizationSchema(): string {
    return this.generateSchema('Organization', {
      name: 'TriniBuild',
      url: 'https://trinibuild.com',
      logo: 'https://trinibuild.com/logo.png',
      description: 'Trinidad & Tobago\'s leading e-commerce and business platform',
      sameAs: [
        'https://facebook.com/trinibuild',
        'https://twitter.com/trinibuild',
        'https://instagram.com/trinibuild',
        'https://linkedin.com/company/trinibuild'
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TT',
        addressLocality: 'Port of Spain',
        streetAddress: 'Trinidad & Tobago'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-868-TRINIBUILD',
        contactType: 'Customer Service'
      }
    });
  }

  /**
   * Generate LocalBusiness schema (for stores)
   */
  static generateLocalBusinessSchema(store: {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    hours?: string;
    image?: string;
  }): string {
    return this.generateSchema('LocalBusiness', {
      name: store.name,
      description: store.description,
      image: store.image || 'https://trinibuild.com/default-store.png',
      url: `https://trinibuild.com/store/${store.name.toLowerCase().replace(/\s+/g, '-')}`,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TT',
        addressLocality: store.address || 'Trinidad & Tobago'
      },
      telephone: store.phone,
      openingHoursSpecification: store.hours
    });
  }

  /**
   * Generate Product schema
   */
  static generateProductSchema(product: {
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    image?: string;
    availability?: string;
    rating?: number;
    reviewCount?: number;
  }): string {
    return this.generateSchema('Product', {
      name: product.name,
      description: product.description,
      image: product.image,
      ...(product.price && {
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency || 'TTD',
          availability: `https://schema.org/${product.availability || 'InStock'}`
        }
      }),
      ...(product.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 1
        }
      })
    });
  }

  /**
   * Analyze keyword density in content
   */
  static analyzeKeywordDensity(content: string, keywords: string[]): {
    keyword: string;
    count: number;
    density: number;
    status: 'good' | 'low' | 'high';
  }[] {
    const results = [];
    const contentLower = content.toLowerCase();
    const wordCount = content.split(/\s+/).length;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const matches = contentLower.match(regex) || [];
      const count = matches.length;
      const density = (count / wordCount) * 100;

      // SEO best practice: 1-2% keyword density is optimal
      let status: 'good' | 'low' | 'high' = 'low';
      if (density >= 0.5 && density <= 2.5) status = 'good';
      if (density > 2.5) status = 'high';

      results.push({
        keyword,
        count,
        density: Math.round(density * 100) / 100,
        status
      });
    }

    return results;
  }

  /**
   * Save SEO metadata to database
   */
  static async saveSEOMetadata(
    pageUrl: string,
    storeId: string,
    metadata: SEOMetadata
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('seo_metadata')
        .upsert({
          page_url: pageUrl,
          store_id: storeId,
          title: metadata.title,
          description: metadata.description,
          keywords: metadata.keywords,
          og_title: metadata.ogTitle,
          og_description: metadata.ogDescription,
          og_image: metadata.ogImage,
          canonical_url: metadata.canonicalUrl,
          robots: metadata.robots,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_url'
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get SEO metadata from database
   */
  static async getSEOMetadata(pageUrl: string) {
    try {
      const { data, error } = await supabase
        .from('seo_metadata')
        .select('*')
        .eq('page_url', pageUrl)
        .single();

      if (error) throw error;
      return { success: true, metadata: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate sitemap for store
   */
  static async generateStoreSitemap(storeId: string): Promise<{
    success: boolean;
    sitemap?: string;
    error?: string;
  }> {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, slug, updated_at')
        .eq('store_id', storeId);

      if (error) throw error;

      const entries: SitemapEntry[] = [
        {
          url: `https://trinibuild.com/store/${storeId}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 1.0
        }
      ];

      if (products) {
        for (const product of products) {
          entries.push({
            url: `https://trinibuild.com/store/${storeId}/product/${product.slug || product.id}`,
            lastmod: product.updated_at?.split('T')[0],
            changefreq: 'weekly',
            priority: 0.8
          });
        }
      }

      const sitemap = this.generateSitemap(entries);
      return { success: true, sitemap };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private static _trimToLength(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private static _escapeHTML(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  private static _escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default SEOService;
