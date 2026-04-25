/**
 * AGENT 6: Competitive Analysis Engine
 * 
 * Market intelligence for optimal pricing and keywords
 * - Price range analysis
 * - Trending keywords
 * - Market demand scoring
 */

import { supabase } from './supabaseClient';
import { routeToLLM } from './llmRouter';

export interface CompetitiveAnalysis {
  product_id?: string;
  category: string;
  comparable_listings: Array<{
    title: string;
    price: number;
    sold_count?: number;
    url?: string;
  }>;
  price_range: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  trending_keywords: Array<{
    keyword: string;
    search_volume: string;
    competition: 'high' | 'medium' | 'low';
  }>;
  market_demand: 'high' | 'medium' | 'low';
  recommended_price_ttd: number;
  recommended_keywords: string[];
  pricing_strategy: 'competitive' | 'premium' | 'budget';
}

/**
 * Analyze market for a product category
 */
export async function analyzeMarket(
  category: string,
  productType: string,
  brand?: string,
): Promise<CompetitiveAnalysis> {
  // Check cache first (7-day TTL)
  const { data: cached } = await supabase
    .from('competitive_analysis')
    .select('*')
    .eq('category', category)
    .gte('expires_at', new Date().toISOString())
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return cached as CompetitiveAnalysis;
  }

  // Fetch comparable listings from TriniBuild database
  const { data: comparables } = await supabase
    .from('products')
    .select('name, price, category')
    .eq('category', category)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  const prices = (comparables || []).map(p => p.price).filter(p => p > 0);
  
  const priceRange = {
    min: Math.min(...prices, 100),
    max: Math.max(...prices, 1000),
    average: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 500,
    median: prices.length > 0 ? prices.sort()[Math.floor(prices.length / 2)] : 500,
  };

  // Use AI to generate keyword recommendations
  const keywordPrompt = `For a ${productType} ${brand ? `by ${brand}` : ''} in the ${category} category in Trinidad & Tobago:

Generate 10-15 trending search keywords that buyers would use.
Include:
- Product type variations
- Local slang/terms
- Use cases
- Feature-based searches

Return JSON:
{
  "keywords": [
    {"keyword": string, "search_volume": "high"|"medium"|"low", "competition": "high"|"medium"|"low"}
  ]
}`;

  const aiResponse = await routeToLLM({
    task: 'competitive-research',
    prompt: keywordPrompt,
    maxTokens: 1000,
  });

  const { keywords } = JSON.parse(aiResponse.content);

  // Determine market demand based on listing count
  const listingCount = comparables?.length || 0;
  const market_demand = listingCount > 15 ? 'high' : listingCount > 5 ? 'medium' : 'low';

  // Determine pricing strategy
  const pricing_strategy = brand && ['Apple', 'Samsung', 'Nike', 'Adidas'].includes(brand)
    ? 'premium'
    : priceRange.average < 500
    ? 'budget'
    : 'competitive';

  // Calculate recommended price
  const recommended_price_ttd = 
    pricing_strategy === 'premium' ? priceRange.average * 1.2 :
    pricing_strategy === 'budget' ? priceRange.average * 0.8 :
    priceRange.average;

  const analysis: CompetitiveAnalysis = {
    category,
    comparable_listings: (comparables || []).map(p => ({
      title: p.name,
      price: p.price,
    })),
    price_range: priceRange,
    trending_keywords: keywords,
    market_demand,
    recommended_price_ttd: Math.round(recommended_price_ttd),
    recommended_keywords: keywords.slice(0, 10).map((k: any) => k.keyword),
    pricing_strategy,
  };

  // Cache the result
  await supabase.from('competitive_analysis').insert({
    category,
    comparable_listings: analysis.comparable_listings,
    price_range: analysis.price_range,
    trending_keywords: analysis.trending_keywords,
    market_demand: analysis.market_demand,
    recommended_price_ttd: analysis.recommended_price_ttd,
    recommended_keywords: analysis.recommended_keywords,
    pricing_strategy: analysis.pricing_strategy,
    analyzed_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return analysis;
}

/**
 * Get price recommendation for a specific product
 */
export async function getPriceRecommendation(
  category: string,
  condition: 'new' | 'used' | 'refurbished' | 'open_box',
  brand?: string,
): Promise<number> {
  const analysis = await analyzeMarket(category, '', brand);
  
  // Apply condition multipliers
  const conditionMultiplier = {
    new: 1.0,
    open_box: 0.85,
    refurbished: 0.75,
    used: 0.60,
  };

  return Math.round(analysis.recommended_price_ttd * conditionMultiplier[condition]);
}
