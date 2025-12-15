import { supabase } from '../services/supabaseClient';

export interface AIGenerationRequest {
    type: 'logo' | 'description' | 'tagline' | 'color_palette' | 'category_detection';
    context: {
        businessName?: string;
        category?: string;
        tagline?: string;
        description?: string;
        vibe?: string[];
        existingColors?: string[];
        socialContent?: string;
    };
    options?: {
        style?: string;
        tone?: string;
        length?: 'short' | 'medium' | 'long';
        count?: number;
    };
}

export interface AIGenerationResponse {
    success: boolean;
    data?: any;
    error?: string;
    usage?: {
        tokens?: number;
        cost?: number;
    };
}

class AIService {
    private apiKey: string | null = null;

    constructor() {
        // Get API key from environment or Supabase settings
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    }

    /**
     * Generate business description using AI
     */
    async generateDescription(context: AIGenerationRequest['context'], options?: AIGenerationRequest['options']): Promise<AIGenerationResponse> {
        try {
            const { businessName, category, tagline, vibe } = context;
            const tone = options?.tone || 'professional';
            const length = options?.length || 'medium';

            const prompt = this.buildDescriptionPrompt(businessName!, category!, tagline, vibe, tone, length);

            // Call OpenAI API
            const response = await this.callOpenAI({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional copywriter specializing in Trinidad & Tobago businesses. Write compelling, SEO-optimized business descriptions that attract local customers.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: length === 'short' ? 150 : length === 'medium' ? 300 : 500
            });

            if (response.success) {
                return {
                    success: true,
                    data: {
                        description: response.data.choices[0].message.content.trim(),
                        variations: [] // Could generate multiple variations
                    },
                    usage: {
                        tokens: response.data.usage.total_tokens,
                        cost: this.calculateCost(response.data.usage.total_tokens, 'gpt-4-turbo')
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error generating description:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate description'
            };
        }
    }

    /**
     * Generate tagline suggestions using AI
     */
    async generateTaglines(context: AIGenerationRequest['context'], count: number = 5): Promise<AIGenerationResponse> {
        try {
            const { businessName, category, description, vibe } = context;

            const prompt = `Generate ${count} catchy, memorable taglines for a Trinidad & Tobago business:
      
Business Name: ${businessName}
Category: ${category}
${description ? `Description: ${description}` : ''}
${vibe && vibe.length > 0 ? `Vibe: ${vibe.join(', ')}` : ''}

Requirements:
- Maximum 60 characters
- Catchy and memorable
- Highlight what makes the business unique
- Use local Trinidad & Tobago flavor when appropriate
- Professional yet engaging

Return only the taglines, one per line, numbered.`;

            const response = await this.callOpenAI({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a creative copywriter specializing in taglines for Trinidad & Tobago businesses.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.9,
                max_tokens: 300
            });

            if (response.success) {
                const content = response.data.choices[0].message.content.trim();
                const taglines = content
                    .split('\n')
                    .filter((line: string) => line.trim())
                    .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());

                return {
                    success: true,
                    data: { taglines },
                    usage: {
                        tokens: response.data.usage.total_tokens,
                        cost: this.calculateCost(response.data.usage.total_tokens, 'gpt-4-turbo')
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error generating taglines:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate taglines'
            };
        }
    }

    /**
     * Generate logo using DALL-E 3
     */
    async generateLogo(context: AIGenerationRequest['context'], style: string = 'modern'): Promise<AIGenerationResponse> {
        try {
            const { businessName, category, tagline } = context;

            const prompt = this.buildLogoPrompt(businessName!, category!, tagline, style);

            const response = await this.callOpenAI({
                model: 'dall-e-3',
                prompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'vivid'
            }, 'image');

            if (response.success) {
                const imageUrl = response.data.data[0].url;

                // Upload to Supabase storage
                const uploadedUrl = await this.uploadGeneratedImage(imageUrl, `logo-${Date.now()}.png`);

                return {
                    success: true,
                    data: {
                        url: uploadedUrl || imageUrl,
                        prompt,
                        style
                    },
                    usage: {
                        cost: 0.04 // DALL-E 3 standard quality cost
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error generating logo:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate logo'
            };
        }
    }

    /**
     * Generate color palette suggestions
     */
    async generateColorPalette(context: AIGenerationRequest['context'], count: number = 5): Promise<AIGenerationResponse> {
        try {
            const { businessName, category, vibe } = context;

            const prompt = `Generate ${count} professional color palettes for a Trinidad & Tobago business:

Business Name: ${businessName}
Category: ${category}
${vibe && vibe.length > 0 ? `Vibe: ${vibe.join(', ')}` : ''}

For each palette, provide:
1. Primary color (main brand color)
2. Secondary color (complementary)
3. Accent color (for CTAs and highlights)
4. Background color
5. Text color

Return as JSON array with this structure:
[
  {
    "name": "Palette Name",
    "colors": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "accent": "#HEX",
      "background": "#HEX",
      "text": "#HEX"
    },
    "description": "Brief description"
  }
]

Ensure good contrast ratios for accessibility (WCAG AA standard).`;

            const response = await this.callOpenAI({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional brand designer specializing in color theory and accessibility.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000,
                response_format: { type: 'json_object' }
            });

            if (response.success) {
                const content = response.data.choices[0].message.content.trim();
                const palettes = JSON.parse(content);

                return {
                    success: true,
                    data: { palettes: palettes.palettes || palettes },
                    usage: {
                        tokens: response.data.usage.total_tokens,
                        cost: this.calculateCost(response.data.usage.total_tokens, 'gpt-4-turbo')
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error generating color palette:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate color palette'
            };
        }
    }

    /**
     * Detect business category from name and description
     */
    async detectCategory(businessName: string, description?: string, socialContent?: string): Promise<AIGenerationResponse> {
        try {
            const prompt = `Analyze this Trinidad & Tobago business and suggest the most appropriate category:

Business Name: ${businessName}
${description ? `Description: ${description}` : ''}
${socialContent ? `Social Media Content: ${socialContent}` : ''}

Available categories:
- Food & Dining: doubles_street, roti_shop, bbq_jerk, restaurant_fine, fast_food, chinese, bakery, cafe_juice, catering, bar_pub, soup_souse
- Retail & Shopping: supermarket, parlour, clothing, electronics, hardware, auto_parts, furniture, cosmetics, pharmacy, puja_store, agro_shop, souvenirs, bookstore
- Skilled Trades: auto_mechanic, electrical, plumbing, ac_refrigeration, masonry, welding, joinery, landscaping, cleaning
- Personal Services: taxi_maxi, hair_spa, barber, tailor, gym, daycare_tutoring
- Professional Services: medical, legal, real_estate, insurance, accounting, graphic_design, consulting
- Events & Entertainment: event_promoter, dj_sound, event_planner, photography, event_venue, carnival_mas
- Agriculture & Production: farmer_crops, poultry_livestock, fisherman, market_vendor, manufacturing
- Other: other

Return JSON with:
{
  "category": "category_value",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "alternatives": ["alternative1", "alternative2"]
}`;

            const response = await this.callOpenAI({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in Trinidad & Tobago business classification.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 300,
                response_format: { type: 'json_object' }
            });

            if (response.success) {
                const content = response.data.choices[0].message.content.trim();
                const result = JSON.parse(content);

                return {
                    success: true,
                    data: result,
                    usage: {
                        tokens: response.data.usage.total_tokens,
                        cost: this.calculateCost(response.data.usage.total_tokens, 'gpt-4-turbo')
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error detecting category:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to detect category'
            };
        }
    }

    /**
     * Improve existing description
     */
    async improveDescription(description: string, improvements: string[] = ['clarity', 'seo', 'engagement']): Promise<AIGenerationResponse> {
        try {
            const prompt = `Improve this business description focusing on: ${improvements.join(', ')}

Original Description:
${description}

Requirements:
- Maintain the core message
- Improve ${improvements.join(', ')}
- Keep it between 50-500 characters
- Make it compelling for Trinidad & Tobago customers
- Include relevant keywords naturally

Return only the improved description.`;

            const response = await this.callOpenAI({
                model: 'gpt-4-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional copywriter specializing in business descriptions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            });

            if (response.success) {
                return {
                    success: true,
                    data: {
                        improved: response.data.choices[0].message.content.trim(),
                        original: description
                    },
                    usage: {
                        tokens: response.data.usage.total_tokens,
                        cost: this.calculateCost(response.data.usage.total_tokens, 'gpt-4-turbo')
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error improving description:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to improve description'
            };
        }
    }

    /**
     * Extract business information from social media URL
     */
    async extractSocialInfo(url: string, platform: 'instagram' | 'facebook' | 'tiktok'): Promise<AIGenerationResponse> {
        try {
            // In production, this would scrape the social media page
            // For now, we'll simulate the extraction

            // TODO: Implement actual scraping or API integration
            // This is a placeholder that returns mock data

            return {
                success: true,
                data: {
                    name: 'Sample Business',
                    description: 'Sample description from social media',
                    category: 'restaurant_fine',
                    images: [],
                    followers: 0,
                    posts: 0
                }
            };
        } catch (error) {
            console.error('Error extracting social info:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to extract social information'
            };
        }
    }

    // Private helper methods

    private buildDescriptionPrompt(
        businessName: string,
        category: string,
        tagline?: string,
        vibe?: string[],
        tone: string = 'professional',
        length: 'short' | 'medium' | 'long' = 'medium'
    ): string {
        const wordCount = length === 'short' ? '50-100' : length === 'medium' ? '100-200' : '200-300';

        return `Write a compelling business description for a Trinidad & Tobago business:

Business Name: ${businessName}
Category: ${category}
${tagline ? `Tagline: ${tagline}` : ''}
${vibe && vibe.length > 0 ? `Vibe: ${vibe.join(', ')}` : ''}

Requirements:
- Tone: ${tone}
- Length: ${wordCount} words
- Highlight what makes the business unique
- Include relevant keywords for SEO
- Appeal to local Trinidad & Tobago customers
- Be engaging and persuasive
- Focus on benefits to customers

Return only the description, no additional commentary.`;
    }

    private buildLogoPrompt(
        businessName: string,
        category: string,
        tagline?: string,
        style: string = 'modern'
    ): string {
        const styleDescriptions: Record<string, string> = {
            modern: 'clean, minimalist, contemporary design with simple geometric shapes',
            traditional: 'classic Trinidad & Tobago aesthetic with cultural elements',
            playful: 'fun, vibrant, energetic with playful elements',
            elegant: 'sophisticated, premium, refined with elegant typography',
            bold: 'strong, vibrant colors, impactful design'
        };

        return `Create a professional logo for "${businessName}", a ${category} business in Trinidad & Tobago. 
${tagline ? `Tagline: "${tagline}". ` : ''}
Style: ${styleDescriptions[style] || styleDescriptions.modern}.
The logo should be simple, memorable, and work well at small sizes.
Use a square format (1:1 ratio).
No text in the logo - icon/symbol only.
Professional quality, suitable for business branding.`;
    }

    private async callOpenAI(params: any, endpoint: 'chat' | 'image' = 'chat'): Promise<AIGenerationResponse> {
        try {
            if (!this.apiKey) {
                // Fallback to mock data for development
                return this.getMockResponse(endpoint, params);
            }

            const url = endpoint === 'chat'
                ? 'https://api.openai.com/v1/chat/completions'
                : 'https://api.openai.com/v1/images/generations';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API request failed');
            }

            const data = await response.json();

            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'API request failed'
            };
        }
    }

    private getMockResponse(endpoint: 'chat' | 'image', params: any): AIGenerationResponse {
        // Mock responses for development/testing
        if (endpoint === 'image') {
            return {
                success: true,
                data: {
                    data: [{
                        url: `https://picsum.photos/1024/1024?random=${Date.now()}`
                    }]
                }
            };
        }

        // Mock chat response
        const mockContent = params.messages[1].content.includes('tagline')
            ? '1. Quality You Can Trust\n2. Serving Trinidad with Pride\n3. Your Local Favorite\n4. Fresh. Fast. Delicious.\n5. Where Tradition Meets Taste'
            : 'Welcome to our business! We pride ourselves on delivering exceptional quality and service to the Trinidad & Tobago community. With years of experience and a commitment to excellence, we are your trusted local choice.';

        return {
            success: true,
            data: {
                choices: [{
                    message: {
                        content: mockContent
                    }
                }],
                usage: {
                    total_tokens: 100
                }
            }
        };
    }

    private async uploadGeneratedImage(imageUrl: string, filename: string): Promise<string | null> {
        try {
            // Download the image
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            // Upload to Supabase storage
            const { data, error } = await supabase.storage
                .from('site-assets')
                .upload(`generated/${filename}`, blob, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading generated image:', error);
                return null;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading generated image:', error);
            return null;
        }
    }

    private calculateCost(tokens: number, model: string): number {
        // Pricing as of 2024 (per 1K tokens)
        const pricing: Record<string, { input: number; output: number }> = {
            'gpt-4-turbo': { input: 0.01, output: 0.03 },
            'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
        };

        const modelPricing = pricing[model] || pricing['gpt-4-turbo'];
        // Simplified calculation (assuming 50/50 input/output)
        return (tokens / 1000) * ((modelPricing.input + modelPricing.output) / 2);
    }
}

export const aiService = new AIService();
