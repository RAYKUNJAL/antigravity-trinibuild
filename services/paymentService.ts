import { supabase } from './supabaseClient';

export type PaymentMethod = 'paypal' | 'cod' | 'wipay' | 'ttbank';

export interface PaymentMethodConfig {
    id: PaymentMethod;
    name: string;
    description: string;
    available: boolean;
    comingSoon: boolean;
    icon: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
    {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay securely with PayPal',
        available: true,
        comingSoon: false,
        icon: '💳',
    },
    {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay with cash when you receive your order',
        available: true,
        comingSoon: false,
        icon: '💵',
    },
    {
        id: 'wipay',
        name: 'WiPay',
        description: 'Trinidad & Tobago local payment gateway',
        available: false,
        comingSoon: true,
        icon: '🇹🇹',
    },
    {
        id: 'ttbank',
        name: 'Trinidad Bank Transfer',
        description: 'Direct bank transfer from local Trinidad banks',
        available: false,
        comingSoon: true,
        icon: '🏦',
    },
];

interface CreatePayPalOrderParams {
    amount: number;
    currency?: string;
    description: string;
    orderId: string;
    returnUrl: string;
    cancelUrl: string;
}

interface CreateCODOrderParams {
    amount: number;
    currency?: string;
    description: string;
    orderId: string;
    deliveryAddress: any;
    customerPhone: string;
}

class PaymentService {
    /**
     * Get available payment methods
     */
    getAvailablePaymentMethods(): PaymentMethodConfig[] {
        return PAYMENT_METHODS.filter(method => method.available);
    }

    /**
     * Get all payment methods (including coming soon)
     */
    getAllPaymentMethods(): PaymentMethodConfig[] {
        return PAYMENT_METHODS;
    }

    /**
     * Create PayPal order
     */
    async createPayPalOrder(params: CreatePayPalOrderParams) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            // Call backend to create PayPal order
            const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amount: params.amount,
                    currency: params.currency || 'TTD',
                    description: params.description,
                    order_id: params.orderId,
                    return_url: params.returnUrl,
                    cancel_url: params.cancelUrl,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create PayPal order');
            }

            const data = await response.json();

            // Record payment intent in database
            await this.recordPayment({
                payment_intent_id: data.paypalOrderId,
                user_id: session.user.id,
                order_id: params.orderId,
                amount: params.amount,
                currency: params.currency || 'TTD',
                status: 'pending',
                payment_method: 'paypal',
                metadata: { paypalOrderId: data.paypalOrderId },
            });

            return {
                paypalOrderId: data.paypalOrderId,
                approvalUrl: data.approvalUrl,
            };
        } catch (error: any) {
            console.error('PayPal order creation error:', error);
            throw error;
        }
    }

    /**
     * Capture PayPal payment
     */
    async capturePayPalPayment(paypalOrderId: string) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ paypalOrderId }),
            });

            if (!response.ok) {
                throw new Error('Failed to capture PayPal payment');
            }

            const data = await response.json();

            // Update payment status
            await supabase
                .from('payments')
                .update({ status: 'succeeded' })
                .eq('payment_intent_id', paypalOrderId);

            return data;
        } catch (error: any) {
            console.error('PayPal capture error:', error);
            throw error;
        }
    }

    /**
     * Create Cash on Delivery order
     */
    async createCODOrder(params: CreateCODOrderParams) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            // Generate COD reference number
            const codReference = `COD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Record payment in database
            const payment = await this.recordPayment({
                payment_intent_id: codReference,
                user_id: session.user.id,
                order_id: params.orderId,
                amount: params.amount,
                currency: params.currency || 'TTD',
                status: 'pending',
                payment_method: 'cod',
                metadata: {
                    deliveryAddress: params.deliveryAddress,
                    customerPhone: params.customerPhone,
                    codReference,
                },
            });

            return {
                codReference,
                payment,
                message: 'Order placed successfully. Pay with cash on delivery.',
            };
        } catch (error: any) {
            console.error('COD order creation error:', error);
            throw error;
        }
    }

    /**
     * Confirm COD payment (called by driver/delivery person)
     */
    async confirmCODPayment(codReference: string, confirmedBy: string) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update({
                    status: 'succeeded',
                    metadata: supabase.rpc('jsonb_set', {
                        target: 'metadata',
                        path: '{confirmedBy,confirmedAt}',
                        new_value: JSON.stringify({
                            confirmedBy,
                            confirmedAt: new Date().toISOString(),
                        }),
                    }),
                })
                .eq('payment_intent_id', codReference)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('COD confirmation error:', error);
            throw error;
        }
    }

    /**
     * WiPay integration (Coming Soon)
     */
    async createWiPayOrder(params: any) {
        throw new Error('WiPay integration coming soon! Stay tuned for Trinidad & Tobago local payment support.');
    }

    /**
     * Trinidad Bank Transfer (Coming Soon)
     */
    async createBankTransferOrder(params: any) {
        throw new Error('Trinidad Bank Transfer coming soon! We\'re working on integrating local banks for seamless payments.');
    }

    /**
     * Record payment in database
     */
    private async recordPayment(paymentData: {
        payment_intent_id: string;
        user_id: string;
        order_id?: string;
        amount: number;
        currency: string;
        status: string;
        payment_method: string;
        metadata?: any;
    }) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert([paymentData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Payment recording error:', error);
            throw error;
        }
    }

    /**
     * Get payment by ID
     */
    async getPayment(paymentIntentId: string) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('payment_intent_id', paymentIntentId)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Get payment error:', error);
            throw error;
        }
    }

    /**
     * Get payment history for a user
     */
    async getPaymentHistory(userId: string) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Payment history error:', error);
            throw error;
        }
    }

    /**
     * Update payment status
     */
    async updatePaymentStatus(paymentIntentId: string, status: string) {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update({ status })
                .eq('payment_intent_id', paymentIntentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Update payment status error:', error);
            throw error;
        }
    }
}

export const paymentService = new PaymentService();
