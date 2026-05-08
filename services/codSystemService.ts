/**
 * codSystemService.ts — Full Cash-on-Delivery System
 * Live Supabase integration, commission calc, WhatsApp notifications
 * Handles: COD, Bank Transfer, WiPay — with 5% platform commission
 */

import { supabase } from './supabaseClient';

export interface CODItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface CreateCODOrderInput {
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  delivery_area?: string;
  items: CODItem[];
  delivery_fee?: number;
  payment_method?: 'cod' | 'bank_transfer' | 'wipay';
  notes?: string;
}

export interface CODOrderFull {
  id: string;
  order_ref: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  delivery_area?: string;
  items: CODItem[];
  subtotal: number;
  delivery_fee: number;
  vat_amount: number;
  total_amount: number;
  payment_method: string;
  order_status: string;
  payment_status: string;
  driver_name?: string;
  driver_phone?: string;
  cod_commission_amount: number;
  merchant_payout: number;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

const VAT_RATE = 0.125;
const PLATFORM_COMMISSION = 0.05;

function generateOrderRef(): string {
  const date = new Date();
  const prefix = `TB${date.getFullYear().toString().slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${random}`;
}

export const codSystemService = {
  async createOrder(input: CreateCODOrderInput): Promise<CODOrderFull> {
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const delivery_fee = input.delivery_fee ?? 25;
    const vat_amount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total_amount = subtotal + delivery_fee + vat_amount;
    const commission = Math.round(total_amount * PLATFORM_COMMISSION * 100) / 100;
    const order_ref = generateOrderRef();

    const { data, error } = await supabase
      .from('cod_orders')
      .insert({
        store_id: input.store_id,
        order_ref,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email,
        customer_address: input.customer_address,
        delivery_area: input.delivery_area,
        delivery_address: input.customer_address, // legacy column
        items: input.items,
        subtotal,
        delivery_fee,
        vat_amount,
        amount: total_amount, // legacy column
        total_amount,
        payment_method: input.payment_method || 'cod',
        order_status: 'pending',
        payment_status: 'pending',
        cod_commission_rate: PLATFORM_COMMISSION,
        cod_commission_amount: commission,
        merchant_payout: total_amount - commission,
        notes: input.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStoreOrders(store_id: string): Promise<CODOrderFull[]> {
    const { data, error } = await supabase
      .from('cod_orders')
      .select('*')
      .eq('store_id', store_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateOrderStatus(
    order_id: string,
    order_status: string,
    extras?: { payment_status?: string; driver_name?: string; driver_phone?: string; note?: string }
  ): Promise<void> {
    const update: Record<string, unknown> = { order_status };
    if (extras?.payment_status) update.payment_status = extras.payment_status;
    if (extras?.driver_name) update.driver_name = extras.driver_name;
    if (extras?.driver_phone) update.driver_phone = extras.driver_phone;
    if (order_status === 'delivered') update.delivered_at = new Date().toISOString();
    if (order_status === 'cancelled') {
      update.cancelled_at = new Date().toISOString();
      if (extras?.note) update.cancellation_reason = extras.note;
    }

    const { error } = await supabase
      .from('cod_orders')
      .update(update)
      .eq('id', order_id);

    if (error) throw error;

    // Log to history
    await supabase.from('cod_status_history').insert({
      cod_order_id: order_id,
      new_status: order_status,
      changed_by: 'merchant',
      note: extras?.note,
    });
  },

  async getOrderByRef(order_ref: string): Promise<CODOrderFull | null> {
    const { data } = await supabase
      .from('cod_orders')
      .select('*')
      .eq('order_ref', order_ref)
      .single();
    return data;
  },

  buildWhatsAppMessage(order: CODOrderFull, merchant_name: string): string {
    const itemsList = (order.items || [])
      .map((i: CODItem) => `• ${i.name} x${i.quantity} = TT$${(i.price * i.quantity).toFixed(2)}`)
      .join('\n');

    return encodeURIComponent(
      `🛍️ NEW ORDER — ${merchant_name}\n` +
      `Order: ${order.order_ref}\n` +
      `───────────────\n` +
      `${itemsList}\n` +
      `───────────────\n` +
      `Subtotal: TT$${order.subtotal?.toFixed(2)}\n` +
      `Delivery: TT$${order.delivery_fee?.toFixed(2)}\n` +
      `VAT: TT$${order.vat_amount?.toFixed(2)}\n` +
      `*TOTAL: TT$${order.total_amount?.toFixed(2)}*\n` +
      `───────────────\n` +
      `Customer: ${order.customer_name}\n` +
      `Phone: ${order.customer_phone}\n` +
      `Address: ${order.customer_address}\n` +
      `Payment: Cash on Delivery\n` +
      `───────────────\n` +
      `Reply CONFIRM to accept or CANCEL to decline.`
    );
  },

  getStatusSteps(): { key: string; label: string; icon: string; color: string }[] {
    return [
      { key: 'pending', label: 'Order Placed', icon: '📋', color: '#6B7280' },
      { key: 'confirmed', label: 'Confirmed', icon: '✅', color: '#059669' },
      { key: 'preparing', label: 'Preparing', icon: '📦', color: '#D97706' },
      { key: 'picked_up', label: 'Picked Up', icon: '🚗', color: '#2563EB' },
      { key: 'out_for_delivery', label: 'On the Way', icon: '🛵', color: '#7C3AED' },
      { key: 'delivered', label: 'Delivered', icon: '🎉', color: '#16A34A' },
    ];
  },

  async getDashboardStats(store_id: string) {
    const { data } = await supabase
      .from('cod_orders')
      .select('order_status, total_amount, cod_commission_amount, merchant_payout, created_at')
      .eq('store_id', store_id);

    if (!data) return { total: 0, pending: 0, delivered: 0, grossRevenue: 0, netRevenue: 0, platformFees: 0 };

    const today = new Date().toDateString();
    return {
      total: data.length,
      pending: data.filter(o => ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.order_status)).length,
      delivered: data.filter(o => o.order_status === 'delivered').length,
      todayOrders: data.filter(o => new Date(o.created_at).toDateString() === today).length,
      grossRevenue: data.reduce((s, o) => s + (o.total_amount || 0), 0),
      netRevenue: data.reduce((s, o) => s + (o.merchant_payout || 0), 0),
      platformFees: data.reduce((s, o) => s + (o.cod_commission_amount || 0), 0),
    };
  }
};
