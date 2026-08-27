import { supabase } from './supabaseClient';

// Payment Methods for Trinidad & Tobago
export type PaymentMethod = 'cod' | 'cash' | 'wam';

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
    processWiPayPayment: async (_config: PaymentConfig): Promise<PaymentResponse> => {
        return { success: false, error: 'WiPay is not a live rail on Juvay' };
    },

    // Google Pay Integration
    processGooglePayPayment: async (_config: PaymentConfig, _paymentData: any): Promise<PaymentResponse> => {
        return { success: false, error: 'Google Pay is not a live rail on Juvay' };
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
