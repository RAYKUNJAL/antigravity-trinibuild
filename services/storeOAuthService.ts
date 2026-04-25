/**
 * AGENT 5: Store OAuth & Account Linking Service
 * 
 * Connects TriniBuild merchant stores to the AI listing system
 * - Secure token storage
 * - Multi-account management
 * - Token refresh logic
 */

import { supabase } from './supabaseClient';

export interface SellerAccount {
  id: string;
  user_id: string;
  store_id: string;
  platform: 'trinibuild' | 'shopify' | 'woocommerce' | 'custom';
  store_name: string;
  store_url: string;
  is_active: boolean;
  is_verified: boolean;
  account_metadata: Record<string, any>;
}

/**
 * Link a TriniBuild store to the AI listing system
 */
export async function linkTriniBuildStore(
  userId: string,
  storeId: string,
): Promise<{ success: boolean; account?: SellerAccount; error?: string }> {
  try {
    // Get store details
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('owner_id', userId)
      .single();

    if (storeError || !store) {
      return { success: false, error: 'Store not found or access denied' };
    }

    // Check if already linked
    const { data: existing } = await supabase
      .from('seller_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('platform', 'trinibuild')
      .single();

    if (existing) {
      return { success: true, account: existing };
    }

    // Create seller account
    const { data: account, error: insertError } = await supabase
      .from('seller_accounts')
      .insert({
        user_id: userId,
        store_id: storeId,
        platform: 'trinibuild',
        store_name: store.name,
        store_url: `https://trinibuild.com/store/${store.slug}`,
        is_active: true,
        is_verified: true,
        account_metadata: {
          category: store.category,
          plan_tier: store.plan_tier,
        },
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true, account };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Get all linked accounts for a user
 */
export async function getLinkedAccounts(userId: string): Promise<SellerAccount[]> {
  const { data } = await supabase
    .from('seller_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Unlink a store account
 */
export async function unlinkAccount(accountId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('seller_accounts')
    .update({ is_active: false })
    .eq('id', accountId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Get account by ID
 */
export async function getAccount(accountId: string): Promise<SellerAccount | null> {
  const { data } = await supabase
    .from('seller_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  return data;
}
