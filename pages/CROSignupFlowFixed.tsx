/**
 * FIXED: CROSignupFlow.tsx - Streamlined 2-Step Signup
 * OAuth integration + Phone verification
 * Trinidad-optimized, mobile-first
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Sparkles, Check, ArrowRight, Mail, Phone, User,
    Shield, Clock, MessageCircle, Chrome, Facebook
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface SignupData {
    fullName: string;
    phone: string;
    userType: string;
    referralCode?: string;
}

export const CROSignupFlow: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState<'select' | 'verify'>('select');
    const [formData, setFormData] = useState<SignupData>({
        fullName: '',
        phone: '',
        userType: searchParams.get('type') || '',
        referralCode: searchParams.get('ref') || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // OAuth Handlers
    const handleGoogleSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/signup?step=complete&type=${formData.userType}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google signup failed');
        }
    };

    const handleFacebookSignup = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'facebook',
                options: {
                    redirectTo: `${window.location.origin}/signup?step=complete&type=${formData.userType}`
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Facebook signup failed');
        }
    };

    // Phone verification
    const sendVerificationCode = async () => {
        if (!formData.phone || !formData.fullName) {
            setError('Please fill in your name and phone number');
            return;
        }

        setIsSubmitting(true);
        try {
            // Send SMS verification via Twilio/Supabase
            const { error } = await supabase.auth.signInWithOtp({
                phone: `+868${formData.phone.replace(/\D/g, '')}`,
                options: {
                    data: {
                        full_name: formData.fullName,
                        user_type: formData.userType,
                        referral_code: formData.referralCode
                    }
                }
            });

            if (error) throw error;
            setStep('verify');
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const verifyAndComplete = async () => {
        if (!verificationCode) {
            setError('Please enter the 6-digit code');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: `+868${formData.phone.replace(/\D/g, '')}`,
                token: verificationCode,
                type: 'sms'
            });

            if (error) throw error;

            // Redirect based on user type
            const redirects: Record<string, string> = {
                seller: '/store/builder?welcome=true',
                driver: '/driver/onboarding',
                customer: '/?new=true',
                promoter: '/promoter/dashboard?setup=true'
            };

            navigate(redirects[formData.userType] || '/');
        } catch (err: any) {
            setError(err.message || 'Invalid verification code');
        } finally {
            setIsSubmitting(false);
        }
    };

    const userTypeOptions = [
        {
            id: 'seller',
            title: 'Start Selling',
            subtitle: 'Open your online store',
            icon: '🏪',
            color: '#0066CC',
            benefits: ['Free forever', 'Delivery included', '1,000+ stores']
        },
        {
            id: 'driver',
            title: 'Earn as Driver',
            subtitle: 'Deliver & make money',
            icon: '🚗',
            color: '#10b981',
            benefits: ['Flexible hours', 'Daily payouts', 'TT$500+/week']
        },
        {
            id: 'customer',
            title: 'Shop Local',
            subtitle: 'Support Trinidad businesses',
            icon: '🛍️',
            color: '#E61E2B',
            benefits: ['Free delivery', 'Cash on delivery', '500+ stores']
        }
    ];

    return (
        <>
            <Helmet>
                <title>Join TriniBuild - 30 Seconds | Trinidad & Tobago</title>
                <meta name="description" content="Join 10,000+ Trinis. Start selling or shopping in 30 seconds." />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black" style={{ color: '#E61E2B' }}>
                            TriniBuild
                        </h1>
                        <p className="text-gray-600 mt-2">Join in 30 seconds</p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-xl">
                        <AnimatePresence mode="wait">
                            {step === 'select' && (
                                <motion.div
                                    key="select"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-black text-gray-900 mb-6">
                                        What brings you here?
                                    </h2>

                                    {/* User Type Selection */}
                                    <div className="space-y-3 mb-6">
                                        {userTypeOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setFormData({ ...formData, userType: option.id })}
                                                className="w-full text-left p-4 rounded-xl border-2 transition-all"
                                                style={{
                                                    borderColor: formData.userType === option.id ? option.color : '#e5e7eb',
                                                    background: formData.userType === option.id ? `${option.color}10` : 'white'
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{option.icon}</span>
                                                    <div className="flex-1">
                                                        <p className="font-black text-gray-900">{option.title}</p>
                                                        <p className="text-sm text-gray-500">{option.subtitle}</p>
                                                    </div>
                                                    {formData.userType === option.id && (
                                                        <Check size={20} style={{ color: option.color }} />
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {formData.userType && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                        >
                                            {/* OAuth Buttons */}
                                            <div className="space-y-3 mb-4">
                                                <button
                                                    onClick={handleGoogleSignup}
                                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                                                >
                                                    <Chrome size={20} />
                                                    Continue with Google
                                                </button>
                                                <button
                                                    onClick={handleFacebookSignup}
                                                    className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                                                >
                                                    <Facebook size={20} />
                                                    Continue with Facebook
                                                </button>
                                            </div>

                                            <div className="relative my-4">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-gray-200"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="px-2 bg-white text-gray-500">or use phone</span>
                                                </div>
                                            </div>

                                            {/* Phone Signup */}
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Your name"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="868-XXX-XXXX"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none"
                                                />
                                                <button
                                                    onClick={sendVerificationCode}
                                                    disabled={isSubmitting || !formData.fullName || !formData.phone}
                                                    className="w-full py-3 rounded-xl font-black text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                                    style={{ background: '#E61E2B' }}
                                                >
                                                    {isSubmitting ? 'Sending...' : 'Continue'} <ArrowRight size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                            {error}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 'verify' && (
                                <motion.div
                                    key="verify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-black text-gray-900 mb-2">
                                        Check your phone
                                    </h2>
                                    <p className="text-gray-600 mb-6">
                                        We sent a 6-digit code to {formData.phone}
                                    </p>

                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:outline-none text-center text-2xl tracking-widest font-black mb-4"
                                        maxLength={6}
                                    />

                                    <button
                                        onClick={verifyAndComplete}
                                        disabled={isSubmitting || verificationCode.length !== 6}
                                        className="w-full py-3 rounded-xl font-black text-white transition-all disabled:opacity-50 mb-3"
                                        style={{ background: '#E61E2B' }}
                                    >
                                        {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                                    </button>

                                    <button
                                        onClick={() => setStep('select')}
                                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Use different number
                                    </button>

                                    {error && (
                                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                            {error}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Trust Signals */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Shield size={14} />
                            <span>Secure</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>30 seconds</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Check size={14} />
                            <span>10,000+ users</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
};
