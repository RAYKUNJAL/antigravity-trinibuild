// WiPay Payment Integration Service for Trinidad & Tobago
// https://wipayfinancial.com/

export interface WiPayPayment {
    amount: number;
    currency: 'TTD';
    orderNumber: string;
    description: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}

export interface WiPayResponse {
    success: boolean;
    transactionId?: string;
    url?: string; // Redirect URL for payment
    error?: string;
}

class WiPayService {
    private apiKey: string;
    private merchantId: string;
    private sandbox: boolean;

    constructor() {
        this.apiKey = import.meta.env.VITE_WIPAY_API_KEY || '';
        this.merchantId = import.meta.env.VITE_WIPAY_MERCHANT_ID || '';
        this.sandbox = import.meta.env.VITE_WIPAY_SANDBOX === 'true';
    }

    private getApiUrl(): string {
        return this.sandbox
            ? 'https://sandbox.wipayfinancial.com/v1'
            : 'https://tt.wipayfinancial.com/v1';
    }

    // Create a payment
    async createPayment(payment: WiPayPayment): Promise<WiPayResponse> {
        try {
            // In sandbox/development mode, return mock success
            if (!this.apiKey || this.sandbox) {
                console.log('[WiPay Mock] Payment created:', payment);
                return {
                    success: true,
                    transactionId: `MOCK_${Date.now()}`,
                    url: `/payment/success?tx=${Date.now()}`
                };
            }

            const response = await fetch(`${this.getApiUrl()}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    merchant_id: this.merchantId,
                    amount: payment.amount.toFixed(2),
                    currency: payment.currency,
                    order_number: payment.orderNumber,
                    description: payment.description,
                    customer: {
                        name: payment.customerName,
                        email: payment.customerEmail,
                        phone: payment.customerPhone
                    },
                    return_url: `${window.location.origin}/payment/success`,
                    cancel_url: `${window.location.origin}/payment/cancelled`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Payment creation failed');
            }

            return {
                success: true,
                transactionId: data.transaction_id,
                url: data.redirect_url
            };
        } catch (error) {
            console.error('WiPay payment error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Payment failed'
            };
        }
    }

    // Verify payment status
    async verifyPayment(transactionId: string): Promise<{ status: string; paid: boolean }> {
        try {
            // Mock verification in development
            if (!this.apiKey || this.sandbox) {
                console.log('[WiPay Mock] Verifying transaction:', transactionId);
                return { status: 'approved', paid: true };
            }

            const response = await fetch(`${this.getApiUrl()}/payments/${transactionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const data = await response.json();

            return {
                status: data.status,
                paid: data.status === 'approved'
            };
        } catch (error) {
            console.error('WiPay verification error:', error);
            return { status: 'failed', paid: false };
        }
    }

    // Process refund
    async refund(transactionId: string, amount?: number): Promise<WiPayResponse> {
        try {
            if (!this.apiKey || this.sandbox) {
                console.log('[WiPay Mock] Refund:', { transactionId, amount });
                return {
                    success: true,
                    transactionId: `REFUND_${Date.now()}`
                };
            }

            const response = await fetch(`${this.getApiUrl()}/refunds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    amount: amount?.toFixed(2)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Refund failed');
            }

            return {
                success: true,
                transactionId: data.refund_id
            };
        } catch (error) {
            console.error('WiPay refund error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Refund failed'
            };
        }
    }

    // Initialize payment widget (for embedded checkout)
    initializeWidget(containerId: string, payment: WiPayPayment, onSuccess: (txId: string) => void, onError: (error: string) => void) {
        if (!this.apiKey || this.sandbox) {
            // Mock widget for development
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
          <div style="padding: 20px; border: 2px solid #10b981; border-radius: 8px; background: #f0fdf4; text-align: center;">
            <h3 style="color: #065f46; margin-bottom: 10px;">WiPay Payment (Development Mode)</h3>
            <p style="color: #374151; margin-bottom: 15px;">Amount: TTD $${payment.amount.toFixed(2)}</p>
            <button 
              onclick="this.disabled=true; this.textContent='Processing...'; setTimeout(() => window.wiPaySuccess('${payment.orderNumber}'), 1000);" 
              style="background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;"
            >
              Pay with WiPay (Mock)
            </button>
          </div>
        `;

                // Expose success callback globally
                (window as any).wiPaySuccess = (orderId: string) => {
                    onSuccess(`MOCK_TX_${Date.now()}`);
                };
            }
            return;
        }

        // Real WiPay widget implementation
        const script = document.createElement('script');
        script.src = `${this.getApiUrl()}/widget.js`;
        script.onload = () => {
            // Initialize WiPay widget (actual implementation would go here)
            console.log('WiPay widget loaded');
        };
        document.body.appendChild(script);
    }
}

// Export singleton instance
export const wiPayService = new WiPayService();
