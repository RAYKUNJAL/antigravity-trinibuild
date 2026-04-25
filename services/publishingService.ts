/**
 * AGENT 8: Publishing API Integration
 * 
 * Publish AI-generated listings directly to TriniBuild stores
 * - Create products in stores
 * - Update existing products
 * - Track publication status
 */

import { supabase } from './supabaseClient';
import type { RefinementResult } from './listingOptimizer';

export interface PublishResult {
  success: boolean;
  product_id?: string;
  external_listing_id?: string;
  error?: string;
}

/**
 * Publish an AI-generated listing to a TriniBuild store
 */
export async function publishToTriniBuild(
  listing: RefinementResult,
  sellerAccountId: string,
  imageUrl: string,
): Promise<PublishResult> {
  try {
    // Get seller account details
    const { data: account } = await supabase
      .from('seller_accounts')
      .select('*, stores!inner(*)')
      .eq('id', sellerAccountId)
      .single();

    if (!account || !account.store_id) {
      return { success: false, error: 'Seller account or store not found' };
    }

    // Create product in the store
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        store_id: account.store_id,
        name: listing.title,
        description: listing.description,
        price: listing.price_ttd,
        category: listing.category,
        image_url: imageUrl,
        status: 'active',
        stock: 1, // Default stock
        tags: listing.tags,
        metadata: {
          itemSpecifics: listing.itemSpecifics,
          keywords: listing.keywords,
          aiGenerated: true,
          qualityScore: listing.qualityScore,
        },
      })
      .select()
      .single();

    if (productError) {
      return { success: false, error: productError.message };
    }

    // Record publication
    await supabase.from('listing_publications').insert({
      product_id: product.id,
      seller_account_id: sellerAccountId,
      platform: 'trinibuild',
      external_listing_id: product.id,
      external_url: `https://trinibuild.com/store/${account.stores.slug}/product/${product.id}`,
      status: 'published',
      published_at: new Date().toISOString(),
      api_response: { product },
    });

    return {
      success: true,
      product_id: product.id,
      external_listing_id: product.id,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing product with new AI-generated content
 */
export async function updateProduct(
  productId: string,
  listing: RefinementResult,
): Promise<PublishResult> {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        name: listing.title,
        description: listing.description,
        price: listing.price_ttd,
        category: listing.category,
        tags: listing.tags,
        metadata: {
          itemSpecifics: listing.itemSpecifics,
          keywords: listing.keywords,
          aiGenerated: true,
          qualityScore: listing.qualityScore,
          lastOptimized: new Date().toISOString(),
        },
      })
      .eq('id', productId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, product_id: productId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all publications for a seller account
 */
export async function getPublications(sellerAccountId: string) {
  const { data } = await supabase
    .from('listing_publications')
    .select('*, products(*)')
    .eq('seller_account_id', sellerAccountId)
    .order('published_at', { ascending: false });

  return data || [];
}

/**
 * Batch publish multiple listings
 */
export async function batchPublish(
  listings: Array<{ listing: RefinementResult; imageUrl: string }>,
  sellerAccountId: string,
  progressCallback?: (completed: number, total: number) => void,
): Promise<PublishResult[]> {
  const results: PublishResult[] = [];

  for (let i = 0; i < listings.length; i++) {
    const result = await publishToTriniBuild(
      listings[i].listing,
      sellerAccountId,
      listings[i].imageUrl,
    );
    results.push(result);

    if (progressCallback) {
      progressCallback(i + 1, listings.length);
    }

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
