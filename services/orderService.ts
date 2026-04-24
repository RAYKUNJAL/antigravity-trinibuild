import { supabase } from './supabaseClient';

/**
 * orderService — aligned with the real `orders` table schema.
 *
 * Real columns on public.orders:
 *   id, store_id, customer_id, customer_name, customer_email, customer_phone,
 *   customer_address, items (jsonb), subtotal, delivery_fee, total,
 *   payment_method, payment_status, order_status, driver_id, driver_name,
 *   driver_phone, notes, created_at, updated_at
 *
 * For INSERTs we go through the `place-order` edge function so that:
 *   - anonymous customers can check out (RLS on the orders table currently
 *     blocks anon direct inserts via PostgREST — edge function uses the
 *     service role key server-side)
 *   - totals are recomputed server-side and cannot be tampered with by the client
 *   - basic validation is centralized
 *
 * For SELECT/UPDATE we hit the table directly because those paths need the
 * caller's identity for RLS (merchant sees their own store's orders, customer
 * sees their own orders).
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  items: OrderItemLine[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: 'cod' | 'card' | 'paypal' | 'bank_transfer' | string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | string;
  order_status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled' | string;
  driver_id?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  /** convenience display identifier (not a real DB column) */
  order_number?: string;
}

export interface OrderItemLine {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  line_total?: number;
}

export interface CreateOrderInput {
  storeId: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  deliveryFee?: number;
  paymentMethod?: 'cod' | 'card' | 'paypal' | 'bank_transfer';
  notes?: string;
}

/**
 * Legacy input shape kept for backward compat with existing callers
 * (CODCheckout.tsx uses shippingAddress + deliveryOption; Storefront.tsx
 * uses customerName + customerPhone + deliveryAddress). The service adapts
 * both to the canonical CreateOrderInput shape.
 */
export interface CreateOrderData {
  storeId: string;
  items: Array<{
    productId: string;
    name?: string;
    quantity: number;
    price: number;
    variantId?: string;
  }>;
  // CODCheckout shape
  shippingAddress?: {
    name?: string;
    phone?: string;
    street?: string;
    city?: string;
    country?: string;
  };
  paymentMethod?: 'cod' | 'card' | 'paypal' | 'bank_transfer';
  deliveryOption?: 'standard' | 'express' | 'pickup';
  email?: string;
  // Storefront shape
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  deliveryMethod?: string;
  // Common
  notes?: string;
}

function adaptLegacyInput(input: CreateOrderInput | CreateOrderData): CreateOrderInput {
  // Already in the canonical shape
  if ((input as CreateOrderInput).customer) {
    return input as CreateOrderInput;
  }

  const legacy = input as CreateOrderData;
  const name =
    legacy.shippingAddress?.name ??
    legacy.customerName ??
    '';
  const phone =
    legacy.shippingAddress?.phone ??
    legacy.customerPhone ??
    undefined;
  const addressParts: string[] = [];
  if (legacy.shippingAddress?.street) addressParts.push(legacy.shippingAddress.street);
  if (legacy.shippingAddress?.city) addressParts.push(legacy.shippingAddress.city);
  const address = legacy.deliveryAddress ?? (addressParts.length ? addressParts.join(', ') : undefined);

  // Map deliveryOption → deliveryFee rough default (CODCheckout has its own logic
  // but this is a safe fallback so orders never arrive with a wild total).
  const deliveryFeeFromOption =
    legacy.deliveryOption === 'express'
      ? 50
      : legacy.deliveryOption === 'standard'
      ? 30
      : 0;

  return {
    storeId: legacy.storeId,
    items: legacy.items.map(i => ({
      productId: i.productId,
      name: i.name ?? 'Item',
      quantity: i.quantity,
      price: i.price,
    })),
    customer: {
      name,
      email: legacy.email,
      phone,
      address,
    },
    deliveryFee: deliveryFeeFromOption,
    paymentMethod: legacy.paymentMethod,
    notes: legacy.notes,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** Short, human-readable display id. Not a DB column — derived from the uuid. */
const displayOrderNumber = (id: string) =>
  'TRN-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();

const decorate = (row: Order): Order => ({
  ...row,
  order_number: row.order_number ?? displayOrderNumber(row.id),
});

// ── Service ────────────────────────────────────────────────────────────────

export const orderService = {
  /**
   * Place a new order. Works for both anonymous and logged-in customers.
   * Accepts either the canonical CreateOrderInput shape or the legacy
   * CreateOrderData shape (for backward compat with existing callers).
   * Delegates to the `place-order` edge function which handles validation,
   * total calculation, and the actual insert with the service role.
   */
  createOrder: async (rawInput: CreateOrderInput | CreateOrderData): Promise<Order> => {
    const input = adaptLegacyInput(rawInput);

    if (!input.storeId) throw new Error('storeId is required');
    if (!input.customer?.name?.trim()) throw new Error('customer name is required');
    if (!input.items?.length) throw new Error('at least one item is required');

    // If there's a current session, forward the JWT so the edge function can
    // associate the order with the customer's user id.
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token ?? SUPABASE_ANON_KEY;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/place-order`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: input.storeId,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        customer_address: input.customer.address,
        items: input.items.map(i => ({
          product_id: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        delivery_fee: input.deliveryFee ?? 0,
        payment_method: input.paymentMethod ?? 'cod',
        notes: input.notes,
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.success) {
      const msg = body?.error || body?.detail || `checkout failed (${res.status})`;
      throw new Error(msg);
    }

    return decorate(body.order as Order);
  },

  /** Orders for the currently logged-in customer (matched by customer_id). */
  getMyOrders: async (): Promise<Order[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getMyOrders error:', error);
      return [];
    }
    return (data ?? []).map(decorate);
  },

  /**
   * All orders for stores owned by the currently logged-in merchant.
   * RLS ensures the merchant only sees their own store's orders.
   */
  getMerchantOrders: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getMerchantOrders error:', error);
      return [];
    }
    return (data ?? []).map(decorate);
  },

  /** Orders for a single store the caller owns. */
  getStoreOrders: async (storeId: string): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getStoreOrders error:', error);
      return [];
    }
    return (data ?? []).map(decorate);
  },

  /** Fetch a single order by id. */
  getOrderById: async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return decorate(data as Order);
  },

  /**
   * Update order status (pending → confirmed → fulfilled etc).
   * RLS only allows the store owner to do this.
   */
  updateOrderStatus: async (
    id: string,
    updates: {
      order_status?: Order['order_status'];
      payment_status?: Order['payment_status'];
      driver_id?: string | null;
      driver_name?: string | null;
      driver_phone?: string | null;
      notes?: string;
    },
  ): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('updateOrderStatus error:', error);
      throw error;
    }
    return decorate(data as Order);
  },

  /**
   * Compatibility shim so existing callers that use `getVendorOrders()` keep
   * working. Prefer getMerchantOrders() in new code.
   */
  getVendorOrders: async (): Promise<Order[]> => {
    return orderService.getMerchantOrders();
  },
};

export default orderService;
