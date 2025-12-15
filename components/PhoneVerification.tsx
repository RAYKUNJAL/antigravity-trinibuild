import React, { useState } from 'react';
import { Phone, MessageCircle, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { phoneVerificationService, PhoneVerificationResult } from '../services/phoneVerificationService';

interface PhoneVerificationProps {
    onVerified: (phone: string) => void;
    initialPhone?: string;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
    onVerified,
    initialPhone = '',
}) => {
    const [phone, setPhone] = useState(initialPhone);
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [method, setMethod] = useState<'sms' | 'whatsapp'>('whatsapp');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PhoneVerificationResult | null>(null);
    const [countdown, setCountdown] = useState(0);

    const formatPhoneDisplay = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 7) {
            setPhone(value);
        }
    };

    const handleSendCode = async () => {
        setLoading(true);
        setResult(null);

        try {
            const fullPhone = `+1-868-${formatPhoneDisplay(phone)}`;

            // Check if phone is already registered
            const isRegistered = await phoneVerificationService.isPhoneRegistered(fullPhone);
            if (isRegistered) {
                setResult({
                    success: false,
                    message: 'This phone number is already registered. Please login instead.',
                });
                setLoading(false);
                return;
            }

            let verificationResult: PhoneVerificationResult;

            if (method === 'whatsapp') {
                verificationResult = await phoneVerificationService.sendWhatsAppVerification(fullPhone);
            } else {
                verificationResult = await phoneVerificationService.sendSMSVerification(fullPhone);
            }

            setResult(verificationResult);

            if (verificationResult.success) {
                setStep('otp');
                startCountdown();
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || 'Failed to send verification code',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        setLoading(true);
        setResult(null);

        try {
            const fullPhone = `+1-868-${formatPhoneDisplay(phone)}`;
            const verificationResult = await phoneVerificationService.verifyOTP(fullPhone, otpCode);

            setResult(verificationResult);

            if (verificationResult.success) {
                setTimeout(() => {
                    onVerified(fullPhone);
                }, 1000);
            }
        } catch (error: any) {
            setResult({
                success: false,
                message: error.message || 'Verification failed',
            });
        } finally {
            setLoading(false);
        }
    };

    const startCountdown = () => {
        setCountdown(60);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResend = () => {
        setOtpCode('');
        handleSendCode();
    };

    return (
        <div className="space-y-6">
            {step === 'phone' ? (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600 font-medium">+1-868-</span>
                            <input
                                type="tel"
                                value={formatPhoneDisplay(phone)}
                                onChange={handlePhoneChange}
                                placeholder="XXX-XXXX"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent text-lg"
                                maxLength={8}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            We'll send you a verification code
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Verification Method:</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMethod('whatsapp')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${method === 'whatsapp'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <MessageCircle className="h-5 w-5" />
                                <span className="font-medium">WhatsApp</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('sms')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${method === 'sms'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <Phone className="h-5 w-5" />
                                <span className="font-medium">SMS</span>
                            </button>
                        </div>
                    </div>

                    {result && !result.success && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{result.message}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSendCode}
                        disabled={loading || phone.length < 7}
                        className="w-full bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 animate-spin" />
                                Sending Code...
                            </>
                        ) : (
                            <>
                                Send Verification Code
                                {method === 'whatsapp' ? (
                                    <MessageCircle className="h-5 w-5" />
                                ) : (
                                    <Phone className="h-5 w-5" />
                                )}
                            </>
                        )}
                    </button>
                </>
            ) : (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Verification Code
                        </label>
                        <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent text-center text-2xl font-bold tracking-widest"
                            maxLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Code sent to +1-868-{formatPhoneDisplay(phone)}
                        </p>
                    </div>

                    {result && (
                        <div
                            className={`rounded-lg p-4 ${result.success
                                    ? 'bg-green-50 border-2 border-green-200'
                                    : 'bg-red-50 border-2 border-red-200'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <p
                                    className={`text-sm font-medium ${result.success ? 'text-green-700' : 'text-red-700'
                                        }`}
                                >
                                    {result.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otpCode.length !== 6}
                        className="w-full bg-trini-red text-white py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="h-5 w-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                Verify Code
                                <CheckCircle className="h-5 w-5" />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        {countdown > 0 ? (
                            <p className="text-sm text-gray-500">
                                Resend code in {countdown} seconds
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                className="text-sm text-trini-red font-medium hover:underline"
                            >
                                Didn't receive code? Resend
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setStep('phone');
                            setOtpCode('');
                            setResult(null);
                        }}
                        className="w-full text-gray-600 hover:text-gray-900 font-medium"
                    >
                        Change Phone Number
                    </button>
                </>
            )}
        </div>
    );
};
