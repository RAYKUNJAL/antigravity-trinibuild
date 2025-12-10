import { supabase } from './supabaseClient';

// Payment Methods for Trinidad & Tobago
export type PaymentMethod = 'cod' | 'cash' | 'wipay' | 'google_pay' | 'bank_transfer' | 'linx';

export interface PaymentConfig {
    method: PaymentMethod;
    amount: number;
    currency: string;
    orderId: string;
    customerInfo: {
        name: string;
        email?: string;
        phone: string;
    };
}

export interface PaymentResponse {
    success: boolean;
    transactionId?: string;
    redirectUrl?: string;
    error?: string;
}

export const paymentService = {
    // WiPay Integration (Trinidad's #1 Payment Gateway)
    processWiPayPayment: async (config: PaymentConfig): Promise<PaymentResponse> => {
        try {
            // In production, this would call WiPay API
            // For now, we'll simulate the flow
            const isDev = import.meta.env.DEV;

            if (isDev) {
                // Mock response for development
                return {
                    success: true,
                    transactionId: `WIPAY_MOCK_${Date.now()}`,
                    redirectUrl: undefined
                };
            }

            // Production WiPay API call would go here
            const response = await fetch('https://tt.wipayfinancial.com/v1/gateway', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_WIPAY_API_KEY}`
                },
                body: JSON.stringify({
                    account_number: import.meta.env.VITE_WIPAY_MERCHANT_ID,
                    amount: config.amount,
                    currency: config.currency,
                    order_id: config.orderId,
                    return_url: `${window.location.origin}/payment/success`,
                    customer_name: config.customerInfo.name,
                    customer_email: config.customerInfo.email,
                    customer_phone: config.customerInfo.phone
                })
            });

            const data = await response.json();

            return {
                success: data.status === 'success',
                transactionId: data.transaction_id,
                redirectUrl: data.redirect_url
            };
        } catch (error) {
            console.error('WiPay payment error:', error);
            return {
                success: false,
                error: 'Payment processing failed. Please try again.'
            };
        }
    },

    // Google Pay Integration
    processGooglePayPayment: async (config: PaymentConfig, paymentData: any): Promise<PaymentResponse> => {
        try {
            // Google Pay token processing
            const response = await fetch('/api/process-google-pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentData,
                    amount: config.amount,
                    orderId: config.orderId
                })
            });

            const result = await response.json();

            return {
                success: result.success,
                transactionId: result.transactionId
            };
        } catch (error) {
            console.error('Google Pay error:', error);
            return {
                success: false,
                error: 'Google Pay processing failed.'
            };
        }
    },

    // Cash on Delivery / Cash Payment
    processCashPayment: async (config: PaymentConfig): Promise<PaymentResponse> => {
        // Record COD order in database
        const { data, error } = await supabase
            .from('payment_transactions')
            .insert({
                order_id: config.orderId,
                method: config.method,
                amount: config.amount,
                currency: config.currency,
                status: 'pending',
                customer_name: config.customerInfo.name,
                customer_phone: config.customerInfo.phone
            })
            .select()
            .single();

        if (error) {
            return {
                success: false,
                error: 'Failed to record cash payment.'
            };
        }

        return {
            success: true,
            transactionId: data.id
        };
    },

    // Bank Transfer (Republic Bank, Scotiabank, First Citizens, etc.)
    processBankTransfer: async (config: PaymentConfig, bankDetails: {
        bank: string;
        accountNumber: string;
        accountName: string;
    }): Promise<PaymentResponse> => {
        // Generate payment instructions
        const { data, error } = await supabase
            .from('payment_transactions')
            .insert({
                order_id: config.orderId,
                method: 'bank_transfer',
                amount: config.amount,
                currency: config.currency,
                status: 'awaiting_confirmation',
                customer_name: config.customerInfo.name,
                customer_phone: config.customerInfo.phone,
                bank_details: bankDetails
            })
            .select()
            .single();

        if (error) {
            return {
                success: false,
                error: 'Failed to initiate bank transfer.'
            };
        }

        return {
            success: true,
            transactionId: data.id
        };
    },

    // Linx (Trinidad's Debit Card Network)
    processLinxPayment: async (config: PaymentConfig): Promise<PaymentResponse> => {
        try {
            // Linx integration would go through WiPay or direct POS terminal
            return await paymentService.processWiPayPayment(config);
        } catch (error) {
            return {
                success: false,
                error: 'Linx payment failed.'
            };
        }
    },

    // Verify payment status
    verifyPayment: async (transactionId: string): Promise<{ verified: boolean; status: string }> => {
        const { data, error } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (error || !data) {
            return { verified: false, status: 'unknown' };
        }

        return {
            verified: data.status === 'completed',
            status: data.status
        };
    }
};
