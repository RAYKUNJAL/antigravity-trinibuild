import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { Banknote } from 'lucide-react';

interface PaymentCheckoutProps {
    orderId: string;
    amount: number;
    currency?: string;
    description: string;
    deliveryAddress?: any;
    customerPhone?: string;
    onSuccess: (paymentData: any) => void;
    onError: (error: Error) => void;
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
    orderId,
    amount,
    currency = 'TTD',
    description,
    deliveryAddress,
    customerPhone,
    onSuccess,
    onError,
}) => {
    const [processing, setProcessing] = useState(false);

    const handleCODPayment = async () => {
        try {
            setProcessing(true);
            const result = await paymentService.processCashPayment({
                method: 'cod',
                amount,
                currency,
                orderId,
                customerInfo: {
                    name: '',
                    phone: customerPhone || '',
                },
            });
            if (!result.success) {
                onError(new Error(result.error || 'Cash order failed'));
                return;
            }
            onSuccess(result);
        } catch (error: any) {
            onError(error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Payment</h3>
            <p className="text-sm text-gray-600">
                Live rails are cash on delivery and pickup. PayPal, WiPay, Google Pay, and bank transfer are not on this site.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                        ${amount.toFixed(2)} {currency}
                    </span>
                </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                <Banknote className="h-6 w-6 text-green-700 flex-shrink-0" />
                <p className="text-sm text-green-800">
                    Pay cash when you receive or collect the order. A charge does not fulfill the order.
                </p>
            </div>
            <button
                onClick={handleCODPayment}
                disabled={processing}
                className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
                {processing ? 'Recording…' : 'Confirm cash order'}
            </button>
        </div>
    );
};
