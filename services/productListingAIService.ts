/**
 * ProductListingAIService - AI-powered product description generation
 * Powers TriniBuild's AI product listing feature
 * 
 * Features:
 * - Generate multiple product descriptions from basic info
 * - SEO-optimized listings
 * - Trinidad & Tobago pricing currency
 * - Save directly to database
 * - Error handling & retry logic
 */

import { supabase } from './supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductListingInput {
  title: string;
  category: string;
  features: string[];
  condition?: 'new' | 'like-new' | 'used' | 'refurbished';
  price?: number;
  targetAudience?: string;
  style?: 'persuasive' | 'neutral' | 'descriptive' | 'urgent' | 'luxury';
  storeId: string;
}

export interface GeneratedListing {
  title: string;
  description: string;
  keywords: string[];
  seoTitle?: string;
  seoDescription?: string;
  callToAction?: string;
}

export interface ListingVariations {
  original: GeneratedListing;
  variations: GeneratedListing[];
  metadata: {
    generatedAt: string;
    model: string;
    tokensUsed: number;
    costEstimate: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_ORG_ID = import.meta.env.VITE_OPENAI_ORG_ID || '';
const MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter specializing in Trinidad & Tobago markets.

YOUR ROLE:
- Generate compelling product descriptions for small businesses
- Optimize for search engines (SEO)
- Use Trinidad & Tobago pricing currency (TT$)
- Write in natural, authentic voice (not overly salesy)
- Include relevant keywords naturally
- Always use TT$ for currency references

STYLE GUIDELINES:
- Persuasive: Focus on benefits, create urgency, highlight value
- Neutral: Factual, informative, straightforward
- Descriptive: Rich details, paint a picture, sensory language
- Urgent: Limited stock, time-sensitive, exclusive feel
- Luxury: Premium quality, sophisticated, aspirational

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "title": "optimized product title",
  "description": "compelling product description (150-250 words)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "seoTitle": "SEO-optimized title (50-60 chars)",
  "seoDescription": "SEO meta description (150-160 chars)",
  "callToAction": "action-oriented CTA"
}

RULES:
- NO markdown formatting in JSON
- NO product links or external URLs
- All prices in TT$ (example: "from just TT$250")
- Keep descriptions concise but compelling
- Include 3-4 keywords naturally in description
- Never make false claims about the product
- Always mention quality/value proposition`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class ProductListingAIService {
  /**
   * Check if OpenAI API key is configured
   */
  static isConfigured(): boolean {
    return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');
  }

  /**
   * Get configuration status for UI display
   */
  static getStatus() {
    return {
      configured: this.isConfigured(),
      model: MODEL,
      maxRetries: MAX_RETRIES,
      error: !this.isConfigured() ? 'OpenAI API key not configured' : null
    };
  }

  /**
   * Generate product listing descriptions with multiple variations
   */
  static async generateListings(input: ProductListingInput): Promise<ListingVariations> {
    if (!this.isConfigured()) {
      throw new Error(
        'OpenAI API not configured. Add VITE_OPENAI_API_KEY to environment variables.'
      );
    }

    const startTime = Date.now();
    const variations: GeneratedListing[] = [];

    // Generate original + 4 variations
    const styles: ('persuasive' | 'neutral' | 'descriptive' | 'urgent' | 'luxury')[] = [
      'persuasive',
      'descriptive',
      'urgent',
      'luxury'
    ];

    const promises = styles.map(style =>
      this.generateSingleListing(input, style)
        .catch(err => {
          console.error(`Failed to generate ${style} variation:`, err);
          return null;
        })
    );

    const results = await Promise.all(promises);
    const validResults = results.filter((r): r is GeneratedListing => r !== null);

    // Also generate the default style
    const original = await this.generateSingleListing(
      input,
      input.style || 'persuasive'
    );

    const tokensEstimate = (original.description.length / 4) * validResults.length * 1.5;
    const costPerMTok = 0.0004; // gpt-4o-mini output cost approximately
    const costEstimate = (tokensEstimate / 1_000_000) * costPerMTok;

    return {
      original,
      variations: validResults,
      metadata: {
        generatedAt: new Date().toISOString(),
        model: MODEL,
        tokensUsed: Math.ceil(tokensEstimate),
        costEstimate: Math.round(costEstimate * 1_000_000) / 1_000_000
      }
    };
  }

  /**
   * Generate a single listing with retries
   */
  private static async generateSingleListing(
    input: ProductListingInput,
    style: string
  ): Promise<GeneratedListing> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this._callOpenAI(input, style);
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error('Failed to generate listing after retries');
  }

  /**
   * Call OpenAI API with error handling
   */
  private static async _callOpenAI(
    input: ProductListingInput,
    style: string
  ): Promise<GeneratedListing> {
    const userPrompt = this._buildPrompt(input, style);

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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' } // Ensure JSON response
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    try {
      return JSON.parse(content) as GeneratedListing;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
  }

  /**
   * Build the user prompt for OpenAI
   */
  private static _buildPrompt(input: ProductListingInput, style: string): string {
    return `Generate a ${style} product listing for this item:

PRODUCT DETAILS:
- Title: ${input.title}
- Category: ${input.category}
- Condition: ${input.condition || 'new'}
- Price: ${input.price ? `TT$${input.price}` : 'price not specified'}
- Target Audience: ${input.targetAudience || 'general'}

KEY FEATURES:
${input.features.map(f => `• ${f}`).join('\n')}

STYLE: ${style}

Generate ONLY valid JSON response with no markdown or extra text.`;
  }

  /**
   * Save generated listings to database
   */
  static async saveListings(
    storeId: string,
    productName: string,
    variations: ListingVariations
  ): Promise<{
    success: boolean;
    savedIds?: string[];
    error?: string;
  }> {
    try {
      const allListings = [variations.original, ...variations.variations];
      const records = allListings.map((listing, idx) => ({
        store_id: storeId,
        product_name: productName,
        title: listing.title,
        description: listing.description,
        keywords: listing.keywords,
        seo_title: listing.seoTitle,
        seo_description: listing.seoDescription,
        call_to_action: listing.callToAction,
        variation_type: idx === 0 ? 'original' : `variation_${idx}`,
        generated_at: variations.metadata.generatedAt,
        model_used: variations.metadata.model,
        is_published: false
      }));

      const { data, error } = await supabase
        .from('ai_generated_listings')
        .insert(records)
        .select('id');

      if (error) {
        return {
          success: false,
          error: `Database error: ${error.message}`
        };
      }

      return {
        success: true,
        savedIds: data?.map(r => r.id) || []
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unknown error saving listings'
      };
    }
  }

  /**
   * Get previously generated listings for a store
   */
  static async getListings(storeId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_generated_listings')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_published', false)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Publish a listing (make it live on store)
   */
  static async publishListing(listingId: string) {
    try {
      const { error } = await supabase
        .from('ai_generated_listings')
        .update({ is_published: true, published_at: new Date().toISOString() })
        .eq('id', listingId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a generated listing
   */
  static async deleteListing(listingId: string) {
    try {
      const { error } = await supabase
        .from('ai_generated_listings')
        .delete()
        .eq('id', listingId)
        .eq('is_published', false); // Only delete unpublished

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get usage statistics
   */
  static async getUsageStats(storeId: string) {
    try {
      const { data: listings, error: listError } = await supabase
        .from('ai_generated_listings')
        .select('id, generated_at, is_published')
        .eq('store_id', storeId);

      if (listError) throw listError;

      const published = listings?.filter(l => l.is_published).length || 0;
      const total = listings?.length || 0;

      return {
        success: true,
        stats: {
          totalGenerated: total,
          totalPublished: published,
          successRate: total > 0 ? ((published / total) * 100).toFixed(1) : '0'
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export default ProductListingAIService;
