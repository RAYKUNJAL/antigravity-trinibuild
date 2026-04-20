import { supabase } from './supabaseClient';

export interface CODOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: 'placed' | 'confirmed' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'collected' | 'verified';
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_lat?: number;
  driver_lng?: number;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface CODTracking {
  order: CODOrder;
  timeline: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: number;
    current_location: {
      lat: number;
      lng: number;
    };
  };
}

class CODService {
  /**
   * Get COD order tracking details
   */
  async getOrderTracking(orderId: string): Promise<CODTracking | null> {
    try {
      // Get order details with driver info
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          driver:drivers(
            id,
            driver_name,
            driver_phone,
            driver_rating,
            driver_lat,
            driver_lng
          )
        `)
        .eq('id', orderId)
        .eq('payment_method', 'cod')
        .single();

      if (orderError) throw orderError;
      if (!order) return null;

      // Build timeline from order status history
      const timeline = this.buildTimeline(order);

      return {
        order: {
          id: order.id,
          order_number: order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`,
          customer_name: order.customer_name || order.shipping_address?.name || 'Customer',
          customer_phone: order.customer_phone || order.shipping_address?.phone || '',
          customer_address: this.formatAddress(order.shipping_address),
          total_amount: parseFloat(order.total || 0),
          status: order.status || 'placed',
          payment_status: order.payment_status || 'pending',
          driver_id: order.driver_id,
          driver_name: order.driver?.[0]?.driver_name,
          driver_phone: order.driver?.[0]?.driver_phone,
          driver_lat: order.driver?.[0]?.driver_lat,
          driver_lng: order.driver?.[0]?.driver_lng,
          estimated_delivery: order.estimated_delivery,
          created_at: order.created_at,
          updated_at: order.updated_at,
        },
        timeline,
        driver: order.driver?.[0] ? {
          id: order.driver[0].id,
          name: order.driver[0].driver_name,
          phone: order.driver[0].driver_phone,
          rating: parseFloat(order.driver[0].driver_rating || 0),
          current_location: {
            lat: parseFloat(order.driver[0].driver_lat || 0),
            lng: parseFloat(order.driver[0].driver_lng || 0),
          },
        } : undefined,
      };
    } catch (error) {
      console.error('Error fetching COD order tracking:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: CODOrder['status'],
    note?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // Log status change
      await this.logStatusChange(orderId, status, note);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Assign driver to COD order
   */
  async assignDriver(orderId: string, driverId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await this.logStatusChange(orderId, 'assigned', `Driver assigned`);
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  }

  /**
   * Mark cash as collected
   */
  async markCashCollected(orderId: string, driverId: string): Promise<void> {
    try {
      // Update order payment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'collected',
          status: 'delivered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Get order details for cash collection record
      const { data: order } = await supabase
        .from('orders')
        .select('total, store_id')
        .eq('id', orderId)
        .single();

      if (order) {
        // Create cash collection record
        const { error: collectionError } = await supabase
          .from('driver_cash_collections')
          .insert({
            driver_id: driverId,
            order_id: orderId,
            store_id: order.store_id,
            amount: order.total,
            status: 'collected',
            collected_at: new Date().toISOString(),
          });

        if (collectionError) throw collectionError;
      }

      await this.logStatusChange(orderId, 'delivered', 'Cash collected by driver');
    } catch (error) {
      console.error('Error marking cash collected:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp link for order notification
   */
  getWhatsAppLink(phone: string, orderId: string, status: string): string {
    const message = encodeURIComponent(
      `Hi! Your TriniBuild order ${orderId} is now ${status}. Track it here: ${window.location.origin}/cod-tracking/${orderId}`
    );
    // Remove + and spaces from phone number
    const cleanPhone = phone.replace(/[+ ]/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  /**
   * Build timeline from order data
   */
  private buildTimeline(order: any): Array<{ status: string; timestamp: string; note?: string }> {
    const timeline: Array<{ status: string; timestamp: string; note?: string }> = [];

    timeline.push({
      status: 'Order Placed',
      timestamp: order.created_at,
      note: 'Your COD order has been received',
    });

    if (order.status === 'confirmed' || order.status === 'assigned' || 
        order.status === 'out_for_delivery' || order.status === 'delivered') {
      timeline.push({
        status: 'Order Confirmed',
        timestamp: order.confirmed_at || order.updated_at,
        note: 'Merchant confirmed your order',
      });
    }

    if (order.status === 'assigned' || order.status === 'out_for_delivery' || order.status === 'delivered') {
      timeline.push({
        status: 'Driver Assigned',
        timestamp: order.assigned_at || order.updated_at,
        note: `Driver ${order.driver?.[0]?.driver_name || ''} assigned`,
      });
    }

    if (order.status === 'out_for_delivery' || order.status === 'delivered') {
      timeline.push({
        status: 'Out for Delivery',
        timestamp: order.out_for_delivery_at || order.updated_at,
        note: 'Your order is on the way',
      });
    }

    if (order.status === 'delivered') {
      timeline.push({
        status: 'Delivered',
        timestamp: order.delivered_at || order.updated_at,
        note: 'Order delivered & cash collected',
      });
    }

    if (order.status === 'cancelled') {
      timeline.push({
        status: 'Cancelled',
        timestamp: order.cancelled_at || order.updated_at,
        note: order.cancellation_reason || 'Order was cancelled',
      });
    }

    return timeline;
  }

  /**
   * Format shipping address
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Log status change (internal)
   */
  private async logStatusChange(orderId: string, status: string, note?: string): Promise<void> {
    // This could log to an order_history table if you create one
    console.log(`Order ${orderId} status changed to ${status}`, note);
  }
}

export const codService = new CODService();
