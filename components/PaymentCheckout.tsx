import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { paymentService, PAYMENT_METHODS, PaymentMethod } from '../services/paymentService';
import { CreditCard, Banknote, Building2, Clock } from 'lucide-react';

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
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [processing, setProcessing] = useState(false);

    const getPaymentIcon = (method: PaymentMethod) => {
        switch (method) {
            case 'paypal':
                return <CreditCard className="h-6 w-6" />;
            case 'cod':
                return <Banknote className="h-6 w-6" />;
            case 'wipay':
            case 'ttbank':
                return <Building2 className="h-6 w-6" />;
            default:
                return <CreditCard className="h-6 w-6" />;
        }
    };

    const handleCODPayment = async () => {
        try {
            setProcessing(true);
            const result = await paymentService.createCODOrder({
                amount,
                currency,
                description,
                orderId,
                deliveryAddress: deliveryAddress || {},
                customerPhone: customerPhone || '',
            });
            onSuccess(result);
        } catch (error: any) {
            onError(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleComingSoon = (methodName: string) => {
        alert(`${methodName} is coming soon! We're working hard to bring you more payment options for Trinidad & Tobago.`);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Select Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => {
                                if (method.available) {
                                    setSelectedMethod(method.id);
                                } else {
                                    handleComingSoon(method.name);
                                }
                            }}
                            disabled={!method.available}
                            className={`
                relative p-4 rounded-xl border-2 transition-all text-left
                ${selectedMethod === method.id
                                    ? 'border-purple-600 bg-purple-50'
                                    : method.available
                                        ? 'border-gray-200 hover:border-purple-300 bg-white'
                                        : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                                }
              `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                  p-2 rounded-lg
                  ${selectedMethod === method.id
                                        ? 'bg-purple-100 text-purple-600'
                                        : method.available
                                            ? 'bg-gray-100 text-gray-600'
                                            : 'bg-gray-200 text-gray-400'
                                    }
                `}>
                                    {getPaymentIcon(method.id)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-900">{method.name}</p>
                                        {method.comingSoon && (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                                <Clock className="h-3 w-3" />
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                                </div>
                            </div>
                            {selectedMethod === method.id && (
                                <div className="absolute top-2 right-2">
                                    <div className="h-5 w-5 bg-purple-600 rounded-full flex items-center justify-center">
                                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-900">
                        ${amount.toFixed(2)} {currency}
                    </span>
                </div>
            </div>

            {/* PayPal Payment */}
            {selectedMethod === 'paypal' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            <strong>PayPal:</strong> You'll be redirected to PayPal to complete your payment securely.
                        </p>
                    </div>
                    <PayPalScriptProvider
                        options={{
                            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
                            currency: currency,
                        }}
                    >
                        <PayPalButtons
                            style={{ layout: 'vertical', label: 'pay' }}
                            createOrder={async () => {
                                try {
                                    const result = await paymentService.createPayPalOrder({
                                        amount,
                                        currency,
                                        description,
                                        orderId,
                                        returnUrl: `${window.location.origin}/payment/success`,
                                        cancelUrl: `${window.location.origin}/payment/cancel`,
                                    });
                                    return result.paypalOrderId;
                                } catch (error: any) {
                                    onError(error);
                                    throw error;
                                }
                            }}
                            onApprove={async (data) => {
                                try {
                                    setProcessing(true);
                                    const result = await paymentService.capturePayPalPayment(data.orderID);
                                    onSuccess(result);
                                } catch (error: any) {
                                    onError(error);
                                } finally {
                                    setProcessing(false);
                                }
                            }}
                            onError={(err) => {
                                onError(new Error('PayPal payment failed'));
                            }}
                        />
                    </PayPalScriptProvider>
                </div>
            )}

            {/* Cash on Delivery */}
            {selectedMethod === 'cod' && (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-800">
                            <strong>Cash on Delivery:</strong> Pay with cash when you receive your order. Our delivery person will collect the payment.
                        </p>
                    </div>
                    <button
                        onClick={handleCODPayment}
                        disabled={processing}
                        className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            'Confirm Order (Pay on Delivery)'
                        )}
                    </button>
                </div>
            )}

            {/* Coming Soon Methods */}
            {(selectedMethod === 'wipay' || selectedMethod === 'ttbank') && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                        <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Coming Soon!</h4>
                    <p className="text-gray-600 mb-4">
                        We're working hard to bring you {selectedMethod === 'wipay' ? 'WiPay' : 'Trinidad Bank Transfer'} integration.
                        This will make payments even easier for Trinidad & Tobago customers.
                    </p>
                    <p className="text-sm text-gray-500">
                        In the meantime, please use PayPal or Cash on Delivery.
                    </p>
                </div>
            )}

            {/* No Method Selected */}
            {!selectedMethod && (
                <div className="text-center py-8 text-gray-500">
                    <p>Please select a payment method to continue</p>
                </div>
            )}
        </div>
    );
};
