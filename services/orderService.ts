import { supabase } from './supabaseClient';
import { Order, OrderItem } from '../types';

export interface CreateOrderData {
    storeId: string;
    items: {
        productId: string;
        quantity: number;
        price: number;
        name: string;
        variantId?: string;
    }[];
    shippingAddress: {
        street: string;
        city: string;
        phone: string;
        name: string;
        country?: string;
    };
    paymentMethod: 'cod' | 'card' | 'paypal' | 'bank_transfer';
    deliveryOption: 'standard' | 'express' | 'pickup';
    deliverySlot?: string;
    holdUntil?: string;
    notes?: string;
    email?: string;
}

export const orderService = {
    createOrder: async (orderData: CreateOrderData): Promise<Order> => {
        const { data: { user } } = await supabase.auth.getUser();

        // Calculate total
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingFee = orderData.deliveryOption === 'express' ? 50 : orderData.deliveryOption === 'standard' ? 30 : 0;
        const tax = 0; // Calculate if needed
        const total = subtotal + shippingFee + tax;

        const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        // 1. Create Order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                store_id: orderData.storeId,
                customer_user_id: user?.id,
                order_number: orderNumber,
                email: orderData.email || user?.email || 'guest@example.com',
                phone: orderData.shippingAddress.phone,
                status: 'pending',
                payment_method: orderData.paymentMethod,
                subtotal: subtotal,
                shipping_fee: shippingFee,
                tax: tax,
                total: total,
                currency: 'TTD',
                shipping_address: orderData.shippingAddress,
                notes: orderData.notes
            })
            .select()
            .single();

        if (orderError || !order) {
            console.error('Error creating order:', orderError);
            throw orderError;
        }

        // 2. Create Order Items
        const itemsToInsert = orderData.items.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            variant_id: item.variantId,
            title: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // In a real app, we might want to delete the order here
        }

        return order as Order;
    },

    getMyOrders: async (): Promise<Order[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('customer_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching my orders:', error);
            return [];
        }

        return data as Order[];
    },

    getVendorOrders: async (): Promise<Order[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Get stores owned by user
        const { data: stores } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id);

        if (!stores || stores.length === 0) return [];

        const storeIds = stores.map(s => s.id);

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .in('store_id', storeIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching vendor orders:', error);
            return [];
        }

        return data as Order[];
    },

    updateOrderStatus: async (orderId: string, status: string): Promise<Order | null> => {
        const { data, error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            return null;
        }

        return data as Order;
    },

    getOrderById: async (id: string): Promise<Order | null> => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            return null;
        }

        return data as Order;
    }
};
