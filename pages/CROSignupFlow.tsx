import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Sparkles, Zap, Check, ArrowRight, Mail, Phone, User, MapPin,
    Shield, Award, TrendingUp, Clock, Star, MessageCircle, ChevronRight,
    Gift, DollarSign, Users, Package, Heart, Target
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface SignupData {
    fullName: string;
    email: string;
    phone: string;
    userType: string;
    businessName?: string;
    referralCode?: string;
}

export const CROSignupFlow: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<SignupData>({
        fullName: '',
        email: '',
        phone: '',
        userType: searchParams.get('type') || '',
        referralCode: searchParams.get('ref') || ''
    });
    const [aiSuggestions, setAiSuggestions] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showBenefits, setShowBenefits] = useState(true);

    // CRO: Track time on page for urgency
    const [timeOnPage, setTimeOnPage] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTimeOnPage(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // CRO: Exit intent detection
    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && step === 1) {
                // Show exit intent offer
                setShowBenefits(true);
            }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [step]);

    // AI: Smart field validation with helpful messages
    const validateField = (field: string, value: string): string => {
        const validations: Record<string, (val: string) => string> = {
            fullName: (val) => {
                if (!val) return 'We need your name to personalize your experience';
                if (val.length < 2) return 'Please enter your full name';
                if (!/^[a-zA-Z\s]+$/.test(val)) return 'Name should only contain letters';
                return '';
            },
            email: (val) => {
                if (!val) return 'Email helps us keep you updated on orders';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email (e.g., name@example.com)';
                return '';
            },
            phone: (val) => {
                if (!val) return 'Phone number for WhatsApp notifications';
                const cleaned = val.replace(/\D/g, '');
                if (cleaned.length < 7) return 'Trinidad number should be 7 digits (868-XXX-XXXX)';
                return '';
            }
        };

        return validations[field]?.(value) || '';
    };

    // AI: Auto-format phone number
    const formatPhone = (value: string): string => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
        return `868-${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
    };

    // AI: Smart suggestions based on input
    const handleInputChange = (field: string, value: string) => {
        let processedValue = value;

        // Auto-format phone
        if (field === 'phone') {
            processedValue = formatPhone(value);
        }

        // Auto-capitalize name
        if (field === 'fullName') {
            processedValue = value.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }

        // AI suggestions
        if (field === 'email' && value.includes('@')) {
            const domain = value.split('@')[1];
            if (domain && !domain.includes('.')) {
                setAiSuggestions(prev => ({
                    ...prev,
                    email: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
                }));
            }
        }
    };

    // CRO: Validate step before proceeding
    const validateStep = (): boolean => {
        const newErrors: any = {};

        if (step === 1 && !formData.userType) {
            newErrors.userType = 'Please select what you want to do';
        }

        if (step === 2) {
            const nameError = validateField('fullName', formData.fullName);
            const emailError = validateField('email', formData.email);
            const phoneError = validateField('phone', formData.phone);

            if (nameError) newErrors.fullName = nameError;
            if (emailError) newErrors.email = emailError;
            if (phoneError) newErrors.phone = phoneError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setIsSubmitting(true);

        try {
            // Create account
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: Math.random().toString(36).slice(-10) + 'Aa1!', // Secure random password
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        user_type: formData.userType,
                        referral_code: formData.referralCode
                    }
                }
            });

            if (authError) throw authError;

            // Track conversion
            if (typeof (window as any).gtag === 'function') {
                (window as any).gtag('event', 'sign_up', {
                    method: formData.userType,
                    user_type: formData.userType
                });
            }

            // Redirect based on user type
            const redirects: Record<string, string> = {
                seller: '/store/builder?welcome=true',
                driver: '/driver/onboarding',
                customer: '/marketplace?new=true',
                promoter: '/promoter/dashboard?setup=true'
            };

            navigate(redirects[formData.userType] || '/');
        } catch (error: any) {
            setErrors({ submit: error.message || 'Something went wrong. Please try again.' });
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
            gradient: 'from-blue-500 to-blue-600',
            benefits: ['Accept online orders 24/7', 'Get free delivery drivers', 'Earn TT$10K+/month'],
            popular: true,
            cta: 'Start Selling Free'
        },
        {
            id: 'driver',
            title: 'Earn as Driver',
            subtitle: 'Deliver & make money',
            icon: '🚗',
            gradient: 'from-green-500 to-green-600',
            benefits: ['Flexible schedule', 'Daily payouts', 'Earn TT$500+/week'],
            cta: 'Start Driving'
        },
        {
            id: 'customer',
            title: 'Shop Local',
            subtitle: 'Support Trinidad businesses',
            icon: '🛍️',
            gradient: 'from-purple-500 to-purple-600',
            benefits: ['Shop from home', 'Fast delivery', 'Pay on delivery'],
            cta: 'Start Shopping'
        },
        {
            id: 'promoter',
            title: 'Sell Tickets',
            subtitle: 'Manage your events',
            icon: '🎫',
            gradient: 'from-pink-500 to-pink-600',
            benefits: ['Sell tickets online', 'Track sales live', 'QR code scanning'],
            cta: 'Start Selling Tickets'
        }
    ];

    const selectedType = userTypeOptions.find(t => t.id === formData.userType);

    return (
        <>
            <Helmet>
                <title>Join TriniBuild - Start in 60 Seconds | Trinidad & Tobago</title>
                <meta name="description" content="Join 10,000+ Trinidad & Tobago users. Start selling, driving, or shopping in under 60 seconds. No credit card required." />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
                {/* Header with Trust Signals */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-trini-red to-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">T</span>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">TriniBuild</h1>
                                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span>4.9/5 from 10K+ users</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center space-x-6 text-sm">
                                <div className="flex items-center text-green-600">
                                    <Shield className="h-4 w-4 mr-1" />
                                    <span className="font-medium">Secure</span>
                                </div>
                                <div className="flex items-center text-blue-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span className="font-medium">60 Seconds</span>
                                </div>
                                <div className="flex items-center text-purple-600">
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    <span className="font-medium">AI-Powered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Main Form - 3 columns */}
                        <div className="lg:col-span-3">
                            {/* Progress Indicator */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-600">
                                        Step {step} of 3
                                    </span>
                                    <span className="text-sm font-bold text-trini-red">
                                        {Math.round((step / 3) * 100)}% Complete
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    {[1, 2, 3].map((s) => (
                                        <div
                                            key={s}
                                            className={`h-2 flex-1 rounded-full transition-all ${s <= step ? 'bg-trini-red' : 'bg-gray-200'
                                                }`}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 1: User Type Selection */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                                            What You Want to Do?
                                        </h2>
                                        <p className="text-lg text-gray-600">
                                            Choose one to get started. You can always add more later!
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userTypeOptions.map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, userType: type.id }));
                                                    setErrors(prev => ({ ...prev, userType: '' }));
                                                }}
                                                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${formData.userType === type.id
                                                    ? 'border-trini-red bg-red-50 shadow-lg scale-105'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                                    } ${type.popular ? 'ring-2 ring-blue-200' : ''}`}
                                            >
                                                {type.popular && (
                                                    <div className="absolute -top-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                        MOST POPULAR
                                                    </div>
                                                )}

                                                <div className={`w-14 h-14 bg-gradient-to-br ${type.gradient} rounded-xl flex items-center justify-center text-3xl mb-4`}>
                                                    {type.icon}
                                                </div>

                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{type.title}</h3>
                                                <p className="text-sm text-gray-600 mb-4">{type.subtitle}</p>

                                                <ul className="space-y-2 mb-4">
                                                    {type.benefits.map((benefit, idx) => (
                                                        <li key={idx} className="flex items-start text-sm text-gray-700">
                                                            <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                                                            {benefit}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {formData.userType === type.id && (
                                                    <div className="flex items-center text-trini-red font-bold text-sm">
                                                        <Check className="h-5 w-5 mr-2" />
                                                        Selected
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {errors.userType && (
                                        <p className="text-red-600 text-sm flex items-center">
                                            <span className="mr-2">⚠️</span>
                                            {errors.userType}
                                        </p>
                                    )}

                                    <button
                                        onClick={handleNext}
                                        disabled={!formData.userType}
                                        className="w-full bg-gradient-to-r from-trini-red to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        Continue
                                        <ArrowRight className="h-5 w-5 ml-2" />
                                    </button>
                                </div>
                            )}

                            {/* Step 2: Personal Information */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                                            Almost There! Just Need a Few Details
                                        </h2>
                                        <p className="text-lg text-gray-600">
                                            We'll use this to personalize your experience and keep you updated
                                        </p>
                                    </div>

                                    {/* AI-Powered Form Fields */}
                                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 space-y-5">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                                    placeholder="e.g., John Smith"
                                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all ${errors.fullName
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 focus:border-trini-red'
                                                        } focus:ring-2 focus:ring-red-200`}
                                                />
                                            </div>
                                            {errors.fullName && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <span className="mr-1">💡</span>
                                                    {errors.fullName}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    placeholder="your@email.com"
                                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all ${errors.email
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 focus:border-trini-red'
                                                        } focus:ring-2 focus:ring-red-200`}
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <span className="mr-1">💡</span>
                                                    {errors.email}
                                                </p>
                                            )}
                                            {aiSuggestions.email && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {aiSuggestions.email.map((domain: string) => (
                                                        <button
                                                            key={domain}
                                                            onClick={() => {
                                                                const username = formData.email.split('@')[0];
                                                                handleInputChange('email', `${username}@${domain}`);
                                                                setAiSuggestions(prev => ({ ...prev, email: null }));
                                                            }}
                                                            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                                                        >
                                                            @{domain}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-2">
                                                Phone Number (WhatsApp)
                                            </label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    placeholder="868-XXX-XXXX"
                                                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all ${errors.phone
                                                        ? 'border-red-300 focus:border-red-500'
                                                        : 'border-gray-300 focus:border-trini-red'
                                                        } focus:ring-2 focus:ring-red-200`}
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                                    <span className="mr-1">💡</span>
                                                    {errors.phone}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500 flex items-center">
                                                <MessageCircle className="h-3 w-3 mr-1" />
                                                We'll send order updates via WhatsApp
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="bg-gradient-to-r from-trini-red to-red-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition-all flex items-center"
                                        >
                                            Continue
                                            <ArrowRight className="h-5 w-5 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Check className="h-10 w-10 text-white" />
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                                            You're All Set, {formData.fullName.split(' ')[0]}!
                                        </h2>
                                        <p className="text-lg text-gray-600 mb-8">
                                            Ready to {selectedType?.title.toLowerCase()}? Let's go!
                                        </p>
                                    </div>

                                    {/* Summary */}
                                    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                                        <h3 className="font-bold text-gray-900 mb-4">Your Details:</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Account Type:</span>
                                                <span className="font-bold text-gray-900">{selectedType?.title}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Name:</span>
                                                <span className="font-medium text-gray-900">{formData.fullName}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Email:</span>
                                                <span className="font-medium text-gray-900">{formData.email}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Phone:</span>
                                                <span className="font-medium text-gray-900">{formData.phone}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {errors.submit && (
                                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
                                            {errors.submit}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setStep(2)}
                                            className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    {selectedType?.cta || 'Get Started'}
                                                    <ArrowRight className="h-5 w-5 ml-2" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Benefits Sidebar - 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Social Proof */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-100">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                                    Join 10,000+ Trinidad Users
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white"></div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-700">
                                            <strong>127 people</strong> signed up today
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                        ))}
                                        <span className="text-sm text-gray-700">
                                            <strong>4.9/5</strong> from 2,450 reviews
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4">What You Get:</h3>
                                <ul className="space-y-3">
                                    {[
                                        { icon: <Zap className="h-5 w-5 text-yellow-500" />, text: 'Setup in 60 seconds' },
                                        { icon: <Shield className="h-5 w-5 text-green-500" />, text: 'Secure & encrypted' },
                                        { icon: <Gift className="h-5 w-5 text-pink-500" />, text: 'Free 14-day trial' },
                                        { icon: <MessageCircle className="h-5 w-5 text-blue-500" />, text: 'WhatsApp support' },
                                        { icon: <DollarSign className="h-5 w-5 text-green-600" />, text: 'No credit card needed' }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-center space-x-3">
                                            {item.icon}
                                            <span className="text-gray-700">{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Testimonial */}
                            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-100">
                                <div className="flex mb-3">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-700 italic mb-4">
                                    "I set up my store in less than 5 minutes and got my first order the same day! TriniBuild is amazing!"
                                </p>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
                                    <div>
                                        <div className="font-bold text-gray-900">Sarah Mohammed</div>
                                        <div className="text-sm text-gray-600">Sweet Treats Bakery, POS</div>
                                    </div>
                                </div>
                            </div>

                            {/* Security Badge */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
                                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-700">
                                    <strong>Your data is safe.</strong> We use bank-level encryption.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
