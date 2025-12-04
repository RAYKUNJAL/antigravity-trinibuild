import { supabase } from './supabaseClient';

interface CreateCheckoutSessionParams {
    priceId?: string;
    amount?: number;
    currency?: string;
    productName: string;
    productDescription?: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
}

interface CreatePaymentIntentParams {
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, string>;
}

class StripeService {
    private apiKey: string;
    private baseUrl = 'https://api.stripe.com/v1';

    constructor() {
        this.apiKey = import.meta.env.VITE_STRIPE_SECRET_KEY || '';
        if (!this.apiKey) {
            console.warn('Stripe API key not configured');
        }
    }

    /**
     * Create a Stripe Checkout Session for one-time payments
     */
    async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            // Call your backend endpoint that creates the Stripe session
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create checkout session');
            }

            const data = await response.json();
            return { sessionId: data.sessionId, url: data.url };
        } catch (error: any) {
            console.error('Stripe checkout session error:', error);
            throw error;
        }
    }

    /**
     * Create a Payment Intent for custom payment flows
     */
    async createPaymentIntent(params: CreatePaymentIntentParams): Promise<{ clientSecret: string; paymentIntentId: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch('/api/stripe/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create payment intent');
            }

            const data = await response.json();
            return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
        } catch (error: any) {
            console.error('Stripe payment intent error:', error);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(paymentIntentId: string): Promise<{ status: string; amount: number }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch(`/api/stripe/verify-payment/${paymentIntentId}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Payment verification error:', error);
            throw error;
        }
    }

    /**
     * Create a customer in Stripe
     */
    async createCustomer(email: string, name?: string): Promise<{ customerId: string }> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch('/api/stripe/create-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ email, name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create customer');
            }

            const data = await response.json();
            return { customerId: data.customerId };
        } catch (error: any) {
            console.error('Customer creation error:', error);
            throw error;
        }
    }

    /**
     * Record payment in database
     */
    async recordPayment(paymentData: {
        payment_intent_id: string;
        amount: number;
        currency: string;
        status: string;
        user_id: string;
        order_id?: string;
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
}

export const stripeService = new StripeService();
