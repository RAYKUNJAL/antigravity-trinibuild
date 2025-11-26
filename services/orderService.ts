import { post, get } from './apiClient';

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface CreateOrderData {
    items: OrderItem[];
    shippingAddress: {
        street: string;
        city: string;
        phone: string;
    };
    paymentMethod: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'CREDIT_CARD';
    deliveryOption: 'standard' | 'express' | 'pickup';
    deliverySlot?: string; // For scheduled delivery
    holdUntil?: string; // Date string for holding package
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
}

export const orderService = {
    createOrder: async (orderData: CreateOrderData): Promise<OrderResponse> => {
        // In a real app, this would POST to /api/orders
        return await post<OrderResponse>('/orders', orderData);
    },

    getMyOrders: async (): Promise<OrderResponse[]> => {
        return await get<OrderResponse[]>('/orders/my-orders');
    },

    getVendorOrders: async (): Promise<OrderResponse[]> => {
        // In a real app, this would be GET /vendor/orders
        // For now, we can mock or use the same endpoint if the backend handles role-based return
        try {
            return await get<OrderResponse[]>('/vendor/orders');
        } catch (e) {
            console.warn("Failed to fetch vendor orders, returning empty list for demo", e);
            return [];
        }
    },

    updateOrderStatus: async (orderId: string, status: string): Promise<OrderResponse> => {
        return await post<OrderResponse>(`/orders/${orderId}/status`, { status });
    },

    getOrderById: async (id: string): Promise<OrderResponse> => {
        return await get<OrderResponse>(`/orders/${id}`);
    }
};
