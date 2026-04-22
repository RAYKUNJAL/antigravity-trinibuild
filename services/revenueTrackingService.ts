/**
 * TRINIBUILD REVENUE & FEE TRACKING SYSTEM
 * 
 * Tracks all monetary flows:
 * - Merchant order values
 * - TriniBuild platform fees (5% base)
 * - COD delivery fees (TriniRides integration)
 * - Payment processing fees
 * - Merchant payouts
 * - Tax obligations (VAT, levies)
 */

import { supabase } from './supabaseClient';

export interface OrderRevenue {
  orderId: string;
  storeId: string;
  merchantId: string;
  orderTotal: number;
  trinibuildFee: number;      // 5% platform fee
  deliveryFee: number;        // TriniRides fee
  paymentFee: number;         // Payment processor fee
  merchantEarnings: number;   // What merchant gets
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export interface MerchantRevenue {
  storeId: string;
  merchantId: string;
  period: string;           // YYYY-MM
  totalOrderValue: number;
  orderCount: number;
  trinibuildFees: number;   // 5% of all orders
  deliveryFees: number;     // TriniRides
  paymentFees: number;      // CC/bank processing
  merchantEarnings: number; // Take-home
  VAT: number;              // 12.5% on earnings
  greenFundLevy: number;    // 0.3%
  businessLevy: number;     // 0.2%
  taxPayable: number;       // VAT + levies
  status: 'pending' | 'completed';
}

export interface TrinibuildRevenue {
  period: string;
  platformFees: number;     // 5% from all orders
  deliveryCommission: number; // Cut from TriniRides
  paymentProcessing: number; // Stripe/PayPal fees
  subscriptionRevenue: number; // Pro plans
  totalRevenue: number;
  operatingCosts: number;
  netProfit: number;
}

// ============================================================================
// FEE STRUCTURE
// ============================================================================

export const FEE_STRUCTURE = {
  PLATFORM_FEE: 0.05,           // 5% of order total
  COD_DELIVERY_BASE: 25,         // TT$25 base (TriniRides)
  COD_DELIVERY_PER_KM: 4,        // TT$4 per km
  STRIPE_FEE_PERCENTAGE: 0.029,  // 2.9%
  STRIPE_FEE_FIXED: 10,          // TT$10 per transaction
  PAYPAL_FEE_PERCENTAGE: 0.049,  // 4.9%
  PAYPAL_FEE_FIXED: 20,          // TT$20 per transaction
  BANK_TRANSFER_FEE: 50,         // TT$50 (one-time for daily batches)
  
  // Tax rates (Trinidad)
  VAT_RATE: 0.125,               // 12.5%
  GREEN_FUND_LEVY: 0.003,        // 0.3%
  BUSINESS_LEVY: 0.002,          // 0.2%
};

// ============================================================================
// REVENUE TRACKING FUNCTIONS
// ============================================================================

/**
 * Record order revenue and split
 */
export const recordOrderRevenue = async (
  orderId: string,
  storeId: string,
  merchantId: string,
  orderTotal: number,
  paymentMethod: 'cod' | 'card' | 'paypal' | 'bank_transfer',
  deliveryDistance?: number
): Promise<OrderRevenue> => {
  // Calculate fees
  const trinibuildFee = Math.round(orderTotal * FEE_STRUCTURE.PLATFORM_FEE);
  
  // Delivery fee (COD only)
  let deliveryFee = 0;
  if (paymentMethod === 'cod' && deliveryDistance) {
    deliveryFee = FEE_STRUCTURE.COD_DELIVERY_BASE + 
                  (deliveryDistance * FEE_STRUCTURE.COD_DELIVERY_PER_KM);
  }
  
  // Payment processor fee
  let paymentFee = 0;
  switch (paymentMethod) {
    case 'card':
      paymentFee = Math.round(
        (orderTotal * FEE_STRUCTURE.STRIPE_FEE_PERCENTAGE) + 
        FEE_STRUCTURE.STRIPE_FEE_FIXED
      );
      break;
    case 'paypal':
      paymentFee = Math.round(
        (orderTotal * FEE_STRUCTURE.PAYPAL_FEE_PERCENTAGE) + 
        FEE_STRUCTURE.PAYPAL_FEE_FIXED
      );
      break;
    case 'bank_transfer':
      // Batch fee applied once daily
      paymentFee = 0; // Calculated separately
      break;
  }
  
  // Merchant earnings
  const merchantEarnings = orderTotal - trinibuildFee - deliveryFee - paymentFee;
  
  // Record in database
  const { data, error } = await supabase
    .from('order_revenue')
    .insert({
      order_id: orderId,
      store_id: storeId,
      merchant_id: merchantId,
      order_total: orderTotal,
      trinibuild_fee: trinibuildFee,
      delivery_fee: deliveryFee,
      payment_fee: paymentFee,
      merchant_earnings: merchantEarnings,
      currency: 'TTD',
      payment_method: paymentMethod,
      status: 'completed',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    orderId,
    storeId,
    merchantId,
    orderTotal,
    trinibuildFee,
    deliveryFee,
    paymentFee,
    merchantEarnings,
    currency: 'TTD',
    paymentMethod,
    status: 'completed',
    createdAt: new Date().toISOString()
  };
};

/**
 * Calculate monthly merchant revenue & taxes
 */
export const calculateMerchantMonthlyRevenue = async (
  storeId: string,
  period: string // YYYY-MM
): Promise<MerchantRevenue> => {
  // Query all orders for this merchant in the period
  const { data: orders, error } = await supabase
    .from('order_revenue')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .like('created_at', `${period}%`);
  
  if (error) throw error;
  
  // Aggregate
  const totalOrderValue = orders.reduce((sum, o) => sum + o.order_total, 0);
  const trinibuildFees = orders.reduce((sum, o) => sum + o.trinibuild_fee, 0);
  const deliveryFees = orders.reduce((sum, o) => sum + o.delivery_fee, 0);
  const paymentFees = orders.reduce((sum, o) => sum + o.payment_fee, 0);
  const merchantEarnings = orders.reduce((sum, o) => sum + o.merchant_earnings, 0);
  
  // Calculate taxes on merchant earnings
  const VAT = Math.round(merchantEarnings * FEE_STRUCTURE.VAT_RATE);
  const greenFundLevy = Math.round(merchantEarnings * FEE_STRUCTURE.GREEN_FUND_LEVY);
  const businessLevy = Math.round(merchantEarnings * FEE_STRUCTURE.BUSINESS_LEVY);
  const taxPayable = VAT + greenFundLevy + businessLevy;
  
  // Get merchant ID from store
  const { data: store } = await supabase
    .from('stores')
    .select('user_id')
    .eq('id', storeId)
    .single();
  
  const result: MerchantRevenue = {
    storeId,
    merchantId: store?.user_id || '',
    period,
    totalOrderValue,
    orderCount: orders.length,
    trinibuildFees,
    deliveryFees,
    paymentFees,
    merchantEarnings,
    VAT,
    greenFundLevy,
    businessLevy,
    taxPayable,
    status: 'completed'
  };
  
  // Store in database
  await supabase
    .from('merchant_monthly_revenue')
    .upsert({
      store_id: storeId,
      period,
      ...result
    });
  
  return result;
};

/**
 * Calculate TriniBuild's monthly revenue
 */
export const calculateTrinibuildMonthlyRevenue = async (
  period: string // YYYY-MM
): Promise<TrinibuildRevenue> => {
  // Query all order revenue for the period
  const { data: allOrders, error } = await supabase
    .from('order_revenue')
    .select('*')
    .eq('status', 'completed')
    .like('created_at', `${period}%`);
  
  if (error) throw error;
  
  // TriniBuild's portion
  const platformFees = allOrders.reduce((sum, o) => sum + o.trinibuild_fee, 0);
  const deliveryCommission = Math.round(
    allOrders.reduce((sum, o) => sum + o.delivery_fee, 0) * 0.20 // 20% cut from TriniRides
  );
  const paymentProcessingFees = allOrders.reduce((sum, o) => sum + o.payment_fee, 0);
  
  // Subscription revenue (Pro plans)
  const { data: subscriptions } = await supabase
    .from('store_subscriptions')
    .select('plan_price')
    .eq('status', 'active')
    .like('period', `${period}%`);
  
  const subscriptionRevenue = (subscriptions || []).reduce(
    (sum, s) => sum + s.plan_price,
    0
  );
  
  const totalRevenue = platformFees + deliveryCommission + 
                       paymentProcessingFees + subscriptionRevenue;
  
  // Operating costs (estimated)
  const operatingCosts = Math.round(totalRevenue * 0.40); // 40% cost ratio
  const netProfit = totalRevenue - operatingCosts;
  
  const result: TrinibuildRevenue = {
    period,
    platformFees,
    deliveryCommission,
    paymentProcessing: paymentProcessingFees,
    subscriptionRevenue,
    totalRevenue,
    operatingCosts,
    netProfit
  };
  
  // Store in database
  await supabase
    .from('trinibuild_monthly_revenue')
    .upsert({
      period,
      ...result
    });
  
  return result;
};

/**
 * Get merchant dashboard revenue summary
 */
export const getMerchantRevenueSummary = async (
  storeId: string,
  period?: string
): Promise<{
  current: MerchantRevenue;
  ytd: {
    totalOrderValue: number;
    merchantEarnings: number;
    orderCount: number;
  };
}> => {
  const currentPeriod = period || new Date().toISOString().slice(0, 7);
  
  // Current month
  const current = await calculateMerchantMonthlyRevenue(storeId, currentPeriod);
  
  // YTD (January to current month)
  const year = currentPeriod.slice(0, 4);
  const { data: ytdData } = await supabase
    .from('order_revenue')
    .select('order_total, merchant_earnings')
    .eq('store_id', storeId)
    .eq('status', 'completed')
    .like('created_at', `${year}%`);
  
  const ytd = {
    totalOrderValue: ytdData?.reduce((sum, o) => sum + o.order_total, 0) || 0,
    merchantEarnings: ytdData?.reduce((sum, o) => sum + o.merchant_earnings, 0) || 0,
    orderCount: ytdData?.length || 0
  };
  
  return { current, ytd };
};

/**
 * Process merchant payout (after taxes)
 */
export const processMerchantPayout = async (
  storeId: string,
  period: string,
  bankAccount: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  }
): Promise<{
  status: 'pending' | 'processing' | 'completed';
  amount: number;  // After taxes
  payoutDate: string;
}> => {
  // Get merchant revenue
  const revenue = await calculateMerchantMonthlyRevenue(storeId, period);
  
  // Payout amount = Earnings - Taxes
  const payoutAmount = revenue.merchantEarnings - revenue.taxPayable;
  
  // Record payout
  const { data, error } = await supabase
    .from('merchant_payouts')
    .insert({
      store_id: storeId,
      period,
      gross_earnings: revenue.merchantEarnings,
      tax_amount: revenue.taxPayable,
      payout_amount: payoutAmount,
      bank_account: bankAccount,
      status: 'pending',
      requested_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    status: 'pending',
    amount: payoutAmount,
    payoutDate: new Date().toISOString()
  };
};

/**
 * Export financial data for reporting (CSV)
 */
export const exportMerchantFinancials = async (
  storeId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<string> => {
  const { data: orders } = await supabase
    .from('order_revenue')
    .select('*')
    .eq('store_id', storeId)
    .eq('status', 'completed');
  
  if (format === 'json') {
    return JSON.stringify(orders, null, 2);
  }
  
  // CSV format
  const headers = [
    'Order ID',
    'Date',
    'Order Total (TTD)',
    'TriniBuild Fee (TTD)',
    'Delivery Fee (TTD)',
    'Payment Fee (TTD)',
    'Merchant Earnings (TTD)',
    'Payment Method'
  ].join(',');
  
  const rows = (orders || []).map(o =>
    [
      o.order_id,
      new Date(o.created_at).toLocaleDateString(),
      o.order_total,
      o.trinibuild_fee,
      o.delivery_fee,
      o.payment_fee,
      o.merchant_earnings,
      o.payment_method
    ].join(',')
  );
  
  return [headers, ...rows].join('\n');
};

export default {
  recordOrderRevenue,
  calculateMerchantMonthlyRevenue,
  calculateTrinibuildMonthlyRevenue,
  getMerchantRevenueSummary,
  processMerchantPayout,
  exportMerchantFinancials,
  FEE_STRUCTURE
};
