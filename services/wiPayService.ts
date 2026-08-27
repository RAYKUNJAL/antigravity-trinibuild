/**
 * WiPay is not a live Juvay rail (Ray lock 2026-08-27).
 * Never send Authorization: Bearer undefined. Never fetch a WiPay host.
 */

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
    url?: string;
    error?: string;
}

const DEAD: WiPayResponse = { success: false, error: 'WiPay is not a live rail on Juvay' };

class WiPayService {
    async createPayment(_payment: WiPayPayment): Promise<WiPayResponse> {
        return DEAD;
    }

    async verifyPayment(_transactionId: string): Promise<{ status: string; paid: boolean }> {
        return { status: 'unavailable', paid: false };
    }

    async refund(_transactionId: string, _amount?: number): Promise<WiPayResponse> {
        return DEAD;
    }

    initializeWidget(
        _containerId: string,
        _payment: WiPayPayment,
        _onSuccess: (txId: string) => void,
        onError: (error: string) => void
    ) {
        onError('WiPay is not a live rail on Juvay');
    }
}

export const wiPayService = new WiPayService();
