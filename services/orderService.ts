import { supabase } from './supabaseClient';

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
    name?: string; // Optional for display
}

export interface CreateOrderData {
    storeId: string; // Added storeId
    items: OrderItem[];
    shippingAddress: {
        street: string;
        city: string;
        phone: string;
        name?: string;
    };
    paymentMethod: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'CREDIT_CARD';
    deliveryOption: 'standard' | 'express' | 'pickup';
    deliverySlot?: string;
    holdUntil?: string;
    notes?: string;
}

export interface OrderResponse {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt?: string;
    customerName?: string;
    items?: any[];
    shippingAddress?: any;
    deliveryOption?: string;
    paymentMethod?: string;
    storeId?: string;
}

export const orderService = {
    createOrder: async (orderData: CreateOrderData): Promise<OrderResponse> => {
        const { data: { user } } = await supabase.auth.getUser();

        // Update user profile phone if missing
        if (user && orderData.shippingAddress.phone) {
            try {
                const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
                if (profile && !profile.phone) {
                    await supabase.from('profiles').update({ phone: orderData.shippingAddress.phone }).eq('id', user.id);
                }
            } catch (e) {
                console.warn("Failed to update profile phone", e);
            }
        }

        // Calculate total
        const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Generate a random order number for now
        const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

        const { data, error } = await supabase
            .from('orders')
            .insert({
                customer_id: user?.id, // Can be null for guest checkout if we allowed it, but RLS might block
                store_id: orderData.storeId,
                total: total,
                status: 'PENDING',
                items: orderData.items,
                delivery_address: JSON.stringify(orderData.shippingAddress),
                // We might want to store other fields in a metadata column or separate columns if schema allows
                // For now, mapping what we have to the schema
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating order:', error);
            throw error;
        }

        return mapOrderFromDb(data, orderNumber, orderData);
    },

    getMyOrders: async (): Promise<OrderResponse[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching my orders:', error);
            return [];
        }

        return data.map(o => mapOrderFromDb(o));
    },

    getVendorOrders: async (): Promise<OrderResponse[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // First get stores owned by user
        const { data: stores } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_id', user.id);

        if (!stores || stores.length === 0) return [];

        const storeIds = stores.map(s => s.id);

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('store_id', storeIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching vendor orders:', error);
            return [];
        }

        return data.map(o => mapOrderFromDb(o));
    },

    updateOrderStatus: async (orderId: string, status: string): Promise<OrderResponse> => {
        const { data, error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            throw error;
        }

        return mapOrderFromDb(data);
    },

    getOrderById: async (id: string): Promise<OrderResponse> => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            throw error;
        }

        return mapOrderFromDb(data);
    }
};

const mapOrderFromDb = (dbOrder: any, orderNumber?: string, originalData?: any): OrderResponse => {
    let address = dbOrder.delivery_address;
    if (typeof address === 'string') {
        try {
            address = JSON.parse(address);
        } catch (e) { }
    }

    return {
        id: dbOrder.id,
        orderNumber: orderNumber || dbOrder.id.substring(0, 8).toUpperCase(), // Fallback if not stored
        total: dbOrder.total,
        status: dbOrder.status,
        createdAt: dbOrder.created_at,
        customerName: address?.name || 'Customer', // Extract from address if possible
        items: dbOrder.items,
        shippingAddress: address,
        storeId: dbOrder.store_id
    };
};
