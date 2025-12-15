import { aiService } from './aiService';

export interface SocialImportResult {
    success: boolean;
    data?: {
        businessName?: string;
        description?: string;
        category?: string;
        images?: string[];
        profileImage?: string;
        followers?: number;
        vibe?: string[];
        colors?: string[];
        location?: string;
        website?: string;
    };
    error?: string;
    source: 'instagram' | 'facebook' | 'tiktok' | 'twitter';
}

class SocialImportService {
    /**
     * Import business information from social media URL
     */
    async importFromUrl(url: string): Promise<SocialImportResult> {
        try {
            const platform = this.detectPlatform(url);

            if (!platform) {
                return {
                    success: false,
                    error: 'Invalid social media URL. Please use Instagram, Facebook, TikTok, or Twitter.',
                    source: 'instagram'
                };
            }

            // Validate URL format
            if (!this.validateUrl(url, platform)) {
                return {
                    success: false,
                    error: `Invalid ${platform} URL format.`,
                    source: platform
                };
            }

            // Extract username/handle from URL
            const handle = this.extractHandle(url, platform);

            if (!handle) {
                return {
                    success: false,
                    error: 'Could not extract profile handle from URL.',
                    source: platform
                };
            }

            // Attempt to scrape/fetch data
            const scrapedData = await this.scrapeProfile(url, platform, handle);

            if (!scrapedData.success) {
                return {
                    success: false,
                    error: scrapedData.error || 'Failed to import from social media.',
                    source: platform
                };
            }

            // Use AI to enhance and structure the data
            const enhancedData = await this.enhanceWithAI(scrapedData.data!, platform);

            return {
                success: true,
                data: enhancedData,
                source: platform
            };
        } catch (error) {
            console.error('Error importing from social media:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to import from social media.',
                source: 'instagram'
            };
        }
    }

    /**
     * Detect which platform the URL is from
     */
    private detectPlatform(url: string): 'instagram' | 'facebook' | 'tiktok' | 'twitter' | null {
        const urlLower = url.toLowerCase();

        if (urlLower.includes('instagram.com')) return 'instagram';
        if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) return 'facebook';
        if (urlLower.includes('tiktok.com')) return 'tiktok';
        if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';

        return null;
    }

    /**
     * Validate URL format for specific platform
     */
    private validateUrl(url: string, platform: string): boolean {
        const patterns: Record<string, RegExp> = {
            instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/,
            facebook: /^https?:\/\/(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9.]+\/?$/,
            tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._]+\/?$/,
            twitter: /^https?:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+\/?$/
        };

        return patterns[platform]?.test(url) || false;
    }

    /**
     * Extract username/handle from URL
     */
    private extractHandle(url: string, platform: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            switch (platform) {
                case 'instagram':
                case 'facebook':
                case 'twitter':
                    return pathname.split('/').filter(Boolean)[0] || null;
                case 'tiktok':
                    return pathname.replace('@', '').split('/').filter(Boolean)[0] || null;
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }

    /**
     * Scrape profile data from social media
     * In production, this would use official APIs or web scraping
     */
    private async scrapeProfile(
        url: string,
        platform: string,
        handle: string
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // Check if we have API access
            const apiData = await this.tryOfficialAPI(platform, handle);

            if (apiData.success) {
                return apiData;
            }

            // Fallback to web scraping
            const scrapedData = await this.scrapeWebPage(url, platform);

            if (scrapedData.success) {
                return scrapedData;
            }

            // If both fail, return mock data for development
            return this.getMockData(platform, handle);
        } catch (error) {
            console.error('Error scraping profile:', error);
            return {
                success: false,
                error: 'Failed to fetch profile data.'
            };
        }
    }

    /**
     * Try to use official API if available
     */
    private async tryOfficialAPI(
        platform: string,
        handle: string
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        // TODO: Implement official API integrations
        // For now, return failure to fall back to scraping
        return {
            success: false,
            error: 'API not configured'
        };
    }

    /**
     * Scrape data from web page
     */
    private async scrapeWebPage(
        url: string,
        platform: string
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            // In production, this would use a scraping service or proxy
            // For now, we'll use a CORS proxy for basic scraping

            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

            const response = await fetch(proxyUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch page');
            }

            const html = await response.text();

            // Extract data from HTML
            const extractedData = this.extractDataFromHTML(html, platform);

            return {
                success: true,
                data: extractedData
            };
        } catch (error) {
            console.error('Error scraping web page:', error);
            return {
                success: false,
                error: 'Failed to scrape page data'
            };
        }
    }

    /**
     * Extract data from HTML content
     */
    private extractDataFromHTML(html: string, platform: string): any {
        const data: any = {};

        try {
            // Extract Open Graph meta tags
            const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
            const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1];
            const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];

            // Extract JSON-LD data if available
            const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/s);
            if (jsonLdMatch) {
                try {
                    const jsonLd = JSON.parse(jsonLdMatch[1]);
                    data.structuredData = jsonLd;
                } catch { }
            }

            // Platform-specific extraction
            switch (platform) {
                case 'instagram':
                    data.businessName = ogTitle?.replace(/ \(@.+\).*/, '');
                    data.description = ogDescription;
                    data.profileImage = ogImage;

                    // Try to extract follower count
                    const followersMatch = html.match(/(\d+(?:,\d+)*)\s+Followers/i);
                    if (followersMatch) {
                        data.followers = parseInt(followersMatch[1].replace(/,/g, ''));
                    }
                    break;

                case 'facebook':
                    data.businessName = ogTitle;
                    data.description = ogDescription;
                    data.profileImage = ogImage;
                    break;

                case 'tiktok':
                    data.businessName = ogTitle?.replace(/ \(@.+\).*/, '');
                    data.description = ogDescription;
                    data.profileImage = ogImage;
                    break;

                case 'twitter':
                    data.businessName = ogTitle?.replace(/ \(@.+\).*/, '');
                    data.description = ogDescription;
                    data.profileImage = ogImage;
                    break;
            }

            // Extract images from page
            const imageMatches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
            const images = Array.from(imageMatches)
                .map(match => match[1])
                .filter(src => src.startsWith('http') && !src.includes('avatar') && !src.includes('icon'))
                .slice(0, 10);

            data.images = images;

            return data;
        } catch (error) {
            console.error('Error extracting data from HTML:', error);
            return data;
        }
    }

    /**
     * Get mock data for development/testing
     */
    private getMockData(
        platform: string,
        handle: string
    ): { success: boolean; data: any } {
        return {
            success: true,
            data: {
                businessName: `${handle.charAt(0).toUpperCase()}${handle.slice(1)} Business`,
                description: 'A great local business serving Trinidad & Tobago with quality products and services.',
                profileImage: `https://ui-avatars.com/api/?name=${handle}&size=400&background=DC2626&color=fff`,
                followers: Math.floor(Math.random() * 10000) + 500,
                images: [
                    'https://picsum.photos/800/600?random=1',
                    'https://picsum.photos/800/600?random=2',
                    'https://picsum.photos/800/600?random=3'
                ],
                posts: Math.floor(Math.random() * 500) + 50,
                verified: false
            }
        };
    }

    /**
     * Enhance scraped data with AI
     */
    private async enhanceWithAI(rawData: any, platform: string): Promise<any> {
        const enhanced: any = {
            businessName: rawData.businessName || '',
            description: rawData.description || '',
            images: rawData.images || [],
            profileImage: rawData.profileImage || '',
            followers: rawData.followers || 0
        };

        try {
            // Use AI to detect category if we have enough information
            if (enhanced.businessName || enhanced.description) {
                const categoryResult = await aiService.detectCategory(
                    enhanced.businessName,
                    enhanced.description,
                    JSON.stringify(rawData)
                );

                if (categoryResult.success && categoryResult.data) {
                    enhanced.category = categoryResult.data.category;
                    enhanced.categoryConfidence = categoryResult.data.confidence;
                }
            }

            // Extract dominant colors from profile image
            if (enhanced.profileImage) {
                // TODO: Implement color extraction from image
                // For now, use default colors
                enhanced.colors = ['#DC2626', '#F59E0B', '#10B981'];
            }

            // Detect vibe/tags from description
            if (enhanced.description) {
                enhanced.vibe = this.detectVibe(enhanced.description);
            }

            // Clean up description if needed
            if (enhanced.description && enhanced.description.length > 500) {
                enhanced.description = enhanced.description.substring(0, 497) + '...';
            }

            return enhanced;
        } catch (error) {
            console.error('Error enhancing with AI:', error);
            return enhanced;
        }
    }

    /**
     * Detect business vibe from description
     */
    private detectVibe(description: string): string[] {
        const vibes: string[] = [];
        const descLower = description.toLowerCase();

        const vibeKeywords: Record<string, string[]> = {
            traditional: ['traditional', 'authentic', 'classic', 'heritage', 'original'],
            modern: ['modern', 'contemporary', 'innovative', 'new', 'fresh'],
            family_friendly: ['family', 'kids', 'children', 'friendly', 'welcoming'],
            upscale: ['premium', 'luxury', 'upscale', 'fine', 'elegant'],
            casual: ['casual', 'relaxed', 'laid-back', 'easy', 'simple'],
            fast_service: ['fast', 'quick', 'express', 'speedy', 'rapid'],
            authentic: ['authentic', 'genuine', 'real', 'true', 'original'],
            local: ['local', 'trini', 'trinidad', 'caribbean', 'island']
        };

        for (const [vibe, keywords] of Object.entries(vibeKeywords)) {
            if (keywords.some(keyword => descLower.includes(keyword))) {
                vibes.push(vibe);
            }
        }

        return vibes.slice(0, 3); // Return max 3 vibes
    }

    /**
     * Validate imported data
     */
    validateImportedData(data: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.businessName || data.businessName.length < 2) {
            errors.push('Business name is required and must be at least 2 characters');
        }

        if (data.businessName && data.businessName.length > 100) {
            errors.push('Business name must be less than 100 characters');
        }

        if (data.description && data.description.length > 500) {
            errors.push('Description must be less than 500 characters');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

export const socialImportService = new SocialImportService();
