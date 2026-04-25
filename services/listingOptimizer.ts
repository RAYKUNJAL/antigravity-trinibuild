/**
 * AGENT 4: 3-Phase Optimization Engine
 * 
 * Professional AI listing optimization pipeline:
 * Phase 1: ANALYSIS - Deep product understanding
 * Phase 2: OPTIMIZATION - Generate high-converting content  
 * Phase 3: REFINEMENT - Polish and validate
 * 
 * Uses multi-LLM router for intelligent model selection
 */

import { routeToLLM, type LLMRequest } from './llmRouter';
import { supabase } from './supabaseClient';

export interface OptimizationInput {
  imageUrl: string;
  existingTitle?: string;
  existingDescription?: string;
  hints?: {
    storeName?: string;
    storeCategory?: string;
    merchantNote?: string;
    targetAudience?: string;
  };
}

export interface AnalysisResult {
  productType: string;
  brand?: string;
  model?: string;
  condition: 'new' | 'used' | 'refurbished' | 'open_box';
  features: string[];
  colors: string[];
  materials: string[];
  detectedText: string; // OCR from image
  categoryPath: string; // "Electronics > Mobile Phones > Smartphones"
  estimatedValue: { min: number; max: number };
  confidence: 'high' | 'medium' | 'low';
}

export interface OptimizationResult {
  title: string; // 80-char SEO optimized
  description: string; // 2-3 paragraphs, benefit-focused
  price_ttd: number;
  category: string;
  tags: string[];
  keywords: string[];
  itemSpecifics: {
    brand?: string;
    model?: string;
    condition: string;
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  };
}

export interface RefinementResult extends OptimizationResult {
  warnings: string[];
  complianceChecks: {
    hasProhibitedTerms: boolean;
    hasHealthClaims: boolean;
    isPriceReasonable: boolean;
  };
  qualityScore: number; // 0-100
}

/**
 * PHASE 1: ANALYSIS
 * Deep understanding of the product from image
 */
async function analyzeProduct(input: OptimizationInput): Promise<AnalysisResult> {
  const prompt = `Analyze this product image in detail.

Extract:
1. Product type and category
2. Brand and model (if visible)
3. Condition (new/used/refurbished)
4. Key features
5. Colors and materials
6. Any text visible (labels, barcodes, packaging)
7. Estimated price range in TTD (Trinidad & Tobago dollars)

${input.hints?.merchantNote ? `Merchant note: ${input.hints.merchantNote}` : ''}

Return JSON only:
{
  "productType": string,
  "brand": string | null,
  "model": string | null,
  "condition": "new" | "used" | "refurbished" | "open_box",
  "features": string[],
  "colors": string[],
  "materials": string[],
  "detectedText": string,
  "categoryPath": string,
  "estimatedValue": { "min": number, "max": number },
  "confidence": "high" | "medium" | "low"
}`;

  const response = await routeToLLM({
    task: 'analyze',
    prompt,
    imageUrl: input.imageUrl,
    maxTokens: 1500,
  });

  return JSON.parse(response.content);
}

/**
 * PHASE 2: OPTIMIZATION
 * Generate high-converting title, description, and metadata
 */
async function optimizeListing(
  analysis: AnalysisResult,
  input: OptimizationInput,
): Promise<OptimizationResult> {
  const prompt = `You are a professional e-commerce copywriter for TriniBuild, Trinidad & Tobago's premier marketplace.

PRODUCT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CREATE A HIGH-CONVERTING LISTING:

1. TITLE (max 80 characters, SEO-optimized):
   - Front-load important keywords
   - Format: [Condition] [BRAND] [Product Type] [Model] [Key Feature] [Size/Color]
   - Example: "Samsung Galaxy A54 5G 128GB Black Unlocked — 6.4\\" AMOLED"
   - NO filler words like "WOW", "RARE", "L@@K"

2. DESCRIPTION (2-3 paragraphs, ~100-150 words):
   - Paragraph 1: What it is and why they need it (benefits, not just features)
   - Paragraph 2: Key features and specs
   - Paragraph 3: Why buy from this seller (trust, quality, local)
   - Use natural language, avoid robotic AI phrases like "elevate your experience"
   - Address buyer concerns: Why this? Why now? Why trust?

3. PRICING:
   - Based on condition and market value
   - Conservative estimate (mid-range of estimated value)
   - Consider Trinidad market (lower purchasing power than US/UK)
   - Apply condition multipliers: Used = 60%, Refurbished = 75%, Open Box = 85%

4. TAGS (3-6 high-intent search terms):
   - What would buyers search for?
   - Mix of product type, brand, and use case
   - Example: ["samsung", "smartphone", "5g", "unlocked"]

5. KEYWORDS (10-15 extended search terms):
   - Include variations, synonyms, local slang
   - Example: ["mobile phone", "cell phone", "android", "galaxy", "trini tech"]

${input.hints?.targetAudience ? `Target audience: ${input.hints.targetAudience}` : ''}

Return JSON only:
{
  "title": string,
  "description": string,
  "price_ttd": number,
  "category": string,
  "tags": string[],
  "keywords": string[],
  "itemSpecifics": {
    "brand": string | null,
    "model": string | null,
    "condition": string,
    "size": string | null,
    "color": string | null,
    "material": string | null
  }
}`;

  const response = await routeToLLM({
    task: 'optimize',
    prompt,
    maxTokens: 2000,
  });

  return JSON.parse(response.content);
}

/**
 * PHASE 3: REFINEMENT
 * Quality check, compliance validation, final polish
 */
async function refineListing(
  optimization: OptimizationResult,
  input: OptimizationInput,
): Promise<RefinementResult> {
  const prompt = `You are a quality assurance specialist for TriniBuild marketplace.

REVIEW THIS LISTING:
${JSON.stringify(optimization, null, 2)}

PERFORM QUALITY CHECKS:

1. COMPLIANCE:
   - Check for prohibited terms (no guarantees, no medical claims)
   - Check for health claims requiring approval
   - Verify price is reasonable (not 10x market value, not TT$1)

2. QUALITY:
   - Title is compelling and SEO-optimized
   - Description is benefit-focused, not generic
   - No spelling/grammar errors
   - No robotic AI phrases
   - Tags are relevant

3. WARNINGS:
   - Flag any issues
   - Suggest improvements

Return JSON only:
{
  "title": string,
  "description": string,
  "price_ttd": number,
  "category": string,
  "tags": string[],
  "keywords": string[],
  "itemSpecifics": object,
  "warnings": string[],
  "complianceChecks": {
    "hasProhibitedTerms": boolean,
    "hasHealthClaims": boolean,
    "isPriceReasonable": boolean
  },
  "qualityScore": number
}`;

  const response = await routeToLLM({
    task: 'refine',
    prompt,
    maxTokens: 2000,
  });

  return JSON.parse(response.content);
}

/**
 * MAIN ORCHESTRATOR: Run all 3 phases
 */
export async function optimizeListingFull(
  input: OptimizationInput,
  saveToDatabase = false,
): Promise<RefinementResult> {
  console.log('[Optimizer] Starting 3-phase optimization...');

  // Phase 1: Analysis
  console.log('[Optimizer] Phase 1: Analyzing product...');
  const analysis = await analyzeProduct(input);

  // Phase 2: Optimization
  console.log('[Optimizer] Phase 2: Generating listing...');
  const optimization = await optimizeListing(analysis, input);

  // Phase 3: Refinement
  console.log('[Optimizer] Phase 3: Refining and validating...');
  const refinement = await refineListing(optimization, input);

  // Save to database if requested
  if (saveToDatabase) {
    // This would insert into ai_listing_jobs table
    // For now, just log
    console.log('[Optimizer] Would save to database:', {
      input_images: [input.imageUrl],
      output_listing: refinement,
      confidence_score: analysis.confidence === 'high' ? 0.9 : analysis.confidence === 'medium' ? 0.7 : 0.5,
    });
  }

  console.log('[Optimizer] ✅ Complete! Quality score:', refinement.qualityScore);
  return refinement;
}

/**
 * Batch optimization (process multiple products)
 */
export async function optimizeBatch(
  inputs: OptimizationInput[],
  progressCallback?: (completed: number, total: number) => void,
): Promise<RefinementResult[]> {
  const results: RefinementResult[] = [];
  
  for (let i = 0; i < inputs.length; i++) {
    const result = await optimizeListingFull(inputs[i]);
    results.push(result);
    
    if (progressCallback) {
      progressCallback(i + 1, inputs.length);
    }
  }

  return results;
}
