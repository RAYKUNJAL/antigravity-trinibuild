import { supabase } from './supabaseClient';

/**
 * codService — aligned with the real `orders` table schema.
 *
 * Real orders columns (verified against information_schema):
 *   id, store_id, customer_id, customer_name, customer_email, customer_phone,
 *   customer_address, items (jsonb), subtotal, delivery_fee, total,
 *   payment_method, payment_status, order_status, driver_id, driver_name,
 *   driver_phone, notes, created_at, updated_at
 *
 * The previous version referenced columns that don't exist — `status`,
 * `shipping_address`, `order_number`, `assigned_at`, `delivered_at`,
 * `cancelled_at`, `cancellation_reason`, `estimated_delivery`, and tried to
 * join `drivers` by id with fields that aren't on that table. Every call
 * failed silently.
 *
 * The status ladder for a COD order is represented in two columns:
 *   - order_status : 'pending' | 'confirmed' | 'assigned' | 'out_for_delivery'
 *                     | 'delivered' | 'cancelled'
 *   - payment_status: 'pending' | 'paid' | 'collected' | 'verified' | 'refunded'
 *
 * For richer timelines we consult `updated_at` on the orders row.  If we ever
 * add an order_status_history table, buildTimeline() is the place to hook in.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type CODStatus =
  | 'pending'
  | 'confirmed'
  | 'assigned'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type CODPaymentStatus =
  | 'pending'
  | 'paid'
  | 'collected'
  | 'verified'
  | 'refunded';

export interface CODOrder {
  id: string;
  order_number: string; // derived from id — no real column
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  order_status: CODStatus;
  payment_status: CODPaymentStatus;
  driver_id?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CODTrackingTimelineEntry {
  status: string;
  timestamp: string;
  note?: string;
}

export interface CODTracking {
  order: CODOrder;
  timeline: CODTrackingTimelineEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const displayOrderNumber = (id: string) =>
  'TRN-' + id.replace(/-/g, '').slice(0, 8).toUpperCase();

const toCODOrder = (row: any): CODOrder => ({
  id: row.id,
  order_number: displayOrderNumber(row.id),
  store_id: row.store_id,
  customer_name: row.customer_name || 'Customer',
  customer_phone: row.customer_phone || '',
  customer_address: row.customer_address || '',
  total_amount: parseFloat(row.total ?? '0') || 0,
  order_status: (row.order_status as CODStatus) || 'pending',
  payment_status: (row.payment_status as CODPaymentStatus) || 'pending',
  driver_id: row.driver_id ?? null,
  driver_name: row.driver_name ?? null,
  driver_phone: row.driver_phone ?? null,
  notes: row.notes ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const STATUS_ORDER: CODStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'out_for_delivery',
  'delivered',
];

const statusReached = (current: CODStatus, target: CODStatus): boolean => {
  if (current === 'cancelled') return target === 'pending' || target === 'cancelled';
  return STATUS_ORDER.indexOf(current) >= STATUS_ORDER.indexOf(target);
};

// ── Service ────────────────────────────────────────────────────────────────

class CODService {
  /** Get COD order + derived delivery timeline. */
  async getOrderTracking(orderId: string): Promise<CODTracking | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('payment_method', 'cod')
      .single();

    if (error || !data) return null;

    const order = toCODOrder(data);
    return { order, timeline: this.buildTimeline(order) };
  }

  /** Update the order_status field. Merchant- or driver-initiated. */
  async updateOrderStatus(
    orderId: string,
    order_status: CODStatus,
    _note?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ order_status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /** Assign a driver to the order and advance order_status to 'assigned'. */
  async assignDriver(
    orderId: string,
    driverId: string,
    driverName?: string,
    driverPhone?: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        driver_id: driverId,
        driver_name: driverName ?? null,
        driver_phone: driverPhone ?? null,
        order_status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  }

  /** Driver marks cash collected + order delivered. */
  async markCashCollected(orderId: string, driverId: string): Promise<void> {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: 'collected',
        order_status: 'delivered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    // Record the cash collection (if the driver_cash_collections table exists
    // and has a matching schema). This is best-effort — don't fail the whole
    // call if the optional ledger insert errors out.
    const { data: order } = await supabase
      .from('orders')
      .select('total, store_id')
      .eq('id', orderId)
      .single();

    if (order) {
      try {
        await supabase.from('driver_cash_collections').insert({
          driver_id: driverId,
          order_id: orderId,
          store_id: order.store_id,
          amount: order.total,
          status: 'collected',
          collected_at: new Date().toISOString(),
        });
      } catch (ledgerErr) {
        console.warn('driver_cash_collections insert failed (non-fatal):', ledgerErr);
      }
    }
  }

  /** Cancel an order. */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    const existingNotes = (
      await supabase.from('orders').select('notes').eq('id', orderId).single()
    ).data?.notes;

    const combinedNotes = [existingNotes, reason ? `Cancelled: ${reason}` : null]
      .filter(Boolean)
      .join(' | ');

    const { error } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        notes: combinedNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
  }

  /** WhatsApp link for order notification. */
  getWhatsAppLink(phone: string, orderId: string, status: string): string {
    const message = encodeURIComponent(
      `Hi! Your TriniBuild order ${displayOrderNumber(orderId)} is now ${status}. ` +
        `Track it: ${window.location.origin}/cod-tracking/${orderId}`,
    );
    const cleanPhone = phone.replace(/[+ ]/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  // ── Derived timeline ────────────────────────────────────────────────────

  private buildTimeline(order: CODOrder): CODTrackingTimelineEntry[] {
    const tl: CODTrackingTimelineEntry[] = [];
    const ts = order.updated_at || order.created_at;

    tl.push({
      status: 'Order Placed',
      timestamp: order.created_at,
      note: 'Your COD order has been received',
    });

    if (order.order_status === 'cancelled') {
      tl.push({
        status: 'Cancelled',
        timestamp: ts,
        note: order.notes || 'Order was cancelled',
      });
      return tl;
    }

    if (statusReached(order.order_status, 'confirmed')) {
      tl.push({ status: 'Order Confirmed', timestamp: ts, note: 'Merchant confirmed your order' });
    }
    if (statusReached(order.order_status, 'assigned')) {
      tl.push({
        status: 'Driver Assigned',
        timestamp: ts,
        note: order.driver_name ? `Driver ${order.driver_name} assigned` : 'Driver assigned',
      });
    }
    if (statusReached(order.order_status, 'out_for_delivery')) {
      tl.push({ status: 'Out for Delivery', timestamp: ts, note: 'Your order is on the way' });
    }
    if (statusReached(order.order_status, 'delivered')) {
      tl.push({ status: 'Delivered', timestamp: ts, note: 'Order delivered & cash collected' });
    }

    return tl;
  }
}

export const codService = new CODService();
export default codService;
