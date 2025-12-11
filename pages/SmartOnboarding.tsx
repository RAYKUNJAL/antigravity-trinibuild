import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Sparkles, MessageCircle, Zap, Check, ArrowRight, User, Mail, Phone,
    MapPin, Briefcase, Store, ChevronRight, Star, Shield, Award, TrendingUp,
    Clock, DollarSign, Users, Package, Truck, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface OnboardingStep {
    id: string;
    title: string;
    aiPrompt: string;
    fields: string[];
    optional?: boolean;
}

export const SmartOnboarding: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [userType, setUserType] = useState<string>('');
    const [formData, setFormData] = useState<any>({});
    const [aiSuggestions, setAiSuggestions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);

    // AI-powered user type detection
    const userTypes = [
        {
            id: 'seller',
            title: 'I Want to Sell',
            subtitle: 'Start your online store',
            icon: '🏪',
            color: 'from-blue-500 to-blue-600',
            benefits: ['Accept online orders', 'Get delivery drivers', 'Grow your business'],
            popular: true
        },
        {
            id: 'driver',
            title: 'I Want to Drive',
            subtitle: 'Earn money delivering',
            icon: '🚗',
            color: 'from-green-500 to-green-600',
            benefits: ['Flexible hours', 'Daily payouts', 'Be your own boss']
        },
        {
            id: 'customer',
            title: 'I Want to Shop',
            subtitle: 'Buy from local stores',
            icon: '🛍️',
            color: 'from-purple-500 to-purple-600',
            benefits: ['Shop local', 'Fast delivery', 'Pay on delivery']
        },
        {
            id: 'promoter',
            title: 'I Sell Tickets',
            subtitle: 'Manage events & sales',
            icon: '🎫',
            color: 'from-pink-500 to-pink-600',
            benefits: ['Sell tickets online', 'Track sales', 'QR code scanning']
        }
    ];

    // AI-powered onboarding steps based on user type
    const getOnboardingSteps = (type: string): OnboardingStep[] => {
        const steps: Record<string, OnboardingStep[]> = {
            seller: [
                {
                    id: 'business-info',
                    title: 'Let\'s Build Your Dream Store',
                    aiPrompt: 'What kind of business you starting? (e.g., clothing store, roti shop, minimart)',
                    fields: ['businessName', 'businessType', 'description']
                },
                {
                    id: 'contact',
                    title: 'Where Customers Can Find You',
                    aiPrompt: 'Your business contact details',
                    fields: ['phone', 'whatsapp', 'email', 'location']
                },
                {
                    id: 'products',
                    title: 'Stock Up Your Shelves',
                    aiPrompt: 'Tell we what you selling so we can help you list it fast.',
                    fields: ['productCount', 'priceRange', 'hasInventory'],
                    optional: true
                },
                {
                    id: 'delivery',
                    title: 'How You Getting It to Them?',
                    aiPrompt: 'Set up your delivery options (TriniBuild Go, Own Driver, or Pickup)',
                    fields: ['deliveryMethod', 'deliveryZones'],
                    optional: true
                }
            ],
            driver: [
                {
                    id: 'personal-info',
                    title: 'Get Ready to Drive',
                    aiPrompt: 'Basic info to get you on the road and making money.',
                    fields: ['fullName', 'phone', 'email', 'address']
                },
                {
                    id: 'vehicle',
                    title: 'What You Using to Deliver?',
                    aiPrompt: 'Details about your vehicle for verification.',
                    fields: ['vehicleType', 'vehicleMake', 'vehicleYear', 'licensePlate']
                },
                {
                    id: 'availability',
                    title: 'When You Want to Work?',
                    aiPrompt: 'Set your own schedule. Work when you want.',
                    fields: ['workingHours', 'workingDays', 'serviceArea']
                },
                {
                    id: 'documents',
                    title: 'Quick Verification Documents',
                    aiPrompt: 'Upload your license and insurance to get approved fast.',
                    fields: ['driversLicense', 'vehicleInsurance', 'vehicleRegistration']
                }
            ],
            customer: [
                {
                    id: 'profile',
                    title: 'Create Your Free Account',
                    aiPrompt: 'Just your name and contact so we can deliver to you.',
                    fields: ['fullName', 'email', 'phone']
                },
                {
                    id: 'delivery-address',
                    title: 'Where We Dropping Off?',
                    aiPrompt: 'Your main delivery address (Home or Work).',
                    fields: ['address', 'area', 'landmark']
                },
                {
                    id: 'preferences',
                    title: 'What You Looking For?',
                    aiPrompt: 'Tell we your interests so we can show you the best deals.',
                    fields: ['interests', 'favoriteStores'],
                    optional: true
                }
            ],
            promoter: [
                {
                    id: 'promoter-info',
                    title: 'Start Promoting Events',
                    aiPrompt: 'Your promoter profile details.',
                    fields: ['fullName', 'phone', 'email', 'company']
                },
                {
                    id: 'event-details',
                    title: 'What Events You Hosting?',
                    aiPrompt: 'Tell we about your upcoming fetes or events.',
                    fields: ['eventTypes', 'averageAttendance', 'frequency']
                },
                {
                    id: 'payment-info',
                    title: 'Get Paid Fast',
                    aiPrompt: 'Where should we send your ticket sales revenue?',
                    fields: ['bankName', 'accountNumber', 'accountName']
                }
            ]
        };

        return steps[type] || [];
    };

    // AI-powered field suggestions
    const getAISuggestion = async (field: string, context: any) => {
        setAiThinking(true);

        // Simulate AI thinking (in production, this would call Gemini API)
        await new Promise(resolve => setTimeout(resolve, 800));

        const suggestions: Record<string, any> = {
            businessType: {
                options: ['Roti Shop', 'Restaurant', 'Bakery', 'Clothing Store', 'Electronics', 'Grocery', 'Beauty Salon', 'Barbershop'],
                smart: true
            },
            location: {
                options: ['Port of Spain', 'San Fernando', 'Chaguanas', 'Arima', 'Point Fortin', 'Princes Town', 'Tobago'],
                smart: true
            },
            deliveryMethod: {
                options: [
                    { value: 'trinibuild-go', label: 'TriniBuild Go (Recommended)', icon: '🚚', description: 'Free drivers, real-time tracking' },
                    { value: 'own-delivery', label: 'My Own Delivery', icon: '🏍️', description: 'Use your own drivers' },
                    { value: 'pickup-only', label: 'Pickup Only', icon: '🏪', description: 'Customers collect from store' }
                ],
                smart: true
            },
            vehicleType: {
                options: ['Car', 'Van', 'Pickup Truck', 'Motorcycle', 'Maxi Taxi'],
                smart: true
            },
            workingHours: {
                suggestions: ['Full-time (8+ hours)', 'Part-time (4-8 hours)', 'Weekends only', 'Evenings only'],
                smart: true
            },
            interests: {
                options: ['Food & Drinks', 'Fashion', 'Electronics', 'Home & Garden', 'Beauty', 'Sports', 'Books'],
                multi: true
            }
        };

        setAiSuggestions(prev => ({
            ...prev,
            [field]: suggestions[field] || { smart: false }
        }));

        setAiThinking(false);
    };

    // Auto-fill based on AI detection
    const handleSmartInput = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // AI auto-suggestions for related fields
        if (field === 'businessName') {
            // Detect business type from name
            const name = value.toLowerCase();
            if (name.includes('roti') || name.includes('doubles')) {
                setFormData(prev => ({ ...prev, businessType: 'Roti Shop' }));
            } else if (name.includes('bakery') || name.includes('cake')) {
                setFormData(prev => ({ ...prev, businessType: 'Bakery' }));
            } else if (name.includes('restaurant') || name.includes('food')) {
                setFormData(prev => ({ ...prev, businessType: 'Restaurant' }));
            }
        }

        if (field === 'phone') {
            // Auto-format Trinidad phone number
            const cleaned = value.replace(/\D/g, '');
            if (cleaned.length === 7) {
                setFormData(prev => ({ ...prev, phone: `868-${cleaned.slice(0, 3)}-${cleaned.slice(3)}` }));
            }
        }
    };

    const steps = userType ? getOnboardingSteps(userType) : [];
    const currentStepData = steps[currentStep];
    const progress = userType ? ((currentStep + 1) / steps.length) * 100 : 0;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);

        try {
            // Create user account and profile
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: Math.random().toString(36).slice(-8), // Temporary password
                options: {
                    data: {
                        full_name: formData.fullName || formData.businessName,
                        user_type: userType,
                        onboarding_data: formData
                    }
                }
            });

            if (authError) throw authError;

            // Redirect based on user type
            const redirects: Record<string, string> = {
                seller: '/store/builder',
                driver: '/driver/dashboard',
                customer: '/marketplace',
                promoter: '/promoter/dashboard'
            };

            navigate(redirects[userType] || '/');
        } catch (error) {
            console.error('Onboarding error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Get Started - TriniBuild | Smart Onboarding</title>
                <meta name="description" content="Join TriniBuild in minutes with our AI-powered onboarding. Start selling, driving, or shopping in Trinidad & Tobago." />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-trini-red to-red-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">T</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">TriniBuild</h1>
                                    <p className="text-xs text-gray-500">Smart Onboarding</p>
                                </div>
                            </div>
                            {userType && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                    <Sparkles className="h-4 w-4 text-purple-600" />
                                    <span>AI-Powered</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {!userType ? (
                        /* User Type Selection */
                        <div className="space-y-8">
                            <div className="text-center">
                                <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-bold mb-6">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI-Powered Onboarding
                                </div>
                                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                    Welcome to TriniBuild!
                                </h2>
                                <p className="text-xl text-gray-600 mb-8">
                                    Let's get you set up in less than 2 minutes. What you want to do?
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setUserType(type.id)}
                                        className={`relative p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-trini-red hover:shadow-2xl transition-all text-left group ${type.popular ? 'ring-4 ring-blue-200' : ''
                                            }`}
                                    >
                                        {type.popular && (
                                            <div className="absolute -top-3 -right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                                MOST POPULAR
                                            </div>
                                        )}

                                        <div className={`w-16 h-16 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                                            {type.icon}
                                        </div>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{type.title}</h3>
                                        <p className="text-gray-600 mb-4">{type.subtitle}</p>

                                        <ul className="space-y-2">
                                            {type.benefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-center text-sm text-gray-700">
                                                    <Check className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="mt-6 flex items-center text-trini-red font-bold group-hover:translate-x-2 transition-transform">
                                            Get Started
                                            <ArrowRight className="h-5 w-5 ml-2" />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Trust Signals */}
                            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">10K+</div>
                                    <div className="text-sm text-gray-600">Happy Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">4.9★</div>
                                    <div className="text-sm text-gray-600">Average Rating</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">&lt; 2min</div>
                                    <div className="text-sm text-gray-600">Setup Time</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Onboarding Steps */
                        <div className="space-y-8">
                            {/* Progress Bar */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Step {currentStep + 1} of {steps.length}
                                        </h3>
                                        <p className="text-sm text-gray-600">{currentStepData?.title}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-trini-red">{Math.round(progress)}%</div>
                                        <div className="text-xs text-gray-500">Complete</div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-trini-red to-red-600 h-3 rounded-full transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* AI Assistant Message */}
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="font-bold text-gray-900">TriniBuild AI</span>
                                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">SMART</span>
                                        </div>
                                        <p className="text-gray-700">{currentStepData?.aiPrompt}</p>
                                        {aiThinking && (
                                            <div className="mt-3 flex items-center space-x-2 text-sm text-purple-600">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                                                <span>Thinking...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                                <div className="space-y-6">
                                    {currentStepData?.fields.map((field) => (
                                        <SmartField
                                            key={field}
                                            field={field}
                                            value={formData[field]}
                                            onChange={(value) => handleSmartInput(field, value)}
                                            suggestions={aiSuggestions[field]}
                                            onFocus={() => getAISuggestion(field, formData)}
                                        />
                                    ))}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                                    {currentStep > 0 && (
                                        <button
                                            onClick={() => setCurrentStep(currentStep - 1)}
                                            className="px-6 py-3 text-gray-700 font-medium hover:text-gray-900 transition-colors"
                                        >
                                            ← Back
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        disabled={isLoading}
                                        className="ml-auto bg-gradient-to-r from-trini-red to-red-600 text-white px-8 py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                                Setting Up...
                                            </>
                                        ) : currentStep === steps.length - 1 ? (
                                            <>
                                                Complete Setup
                                                <Check className="h-5 w-5 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="h-5 w-5 ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {currentStepData?.optional && (
                                    <p className="text-center text-sm text-gray-500 mt-4">
                                        This step is optional. You can skip it and add details later.
                                    </p>
                                )}
                            </div>

                            {/* Help Section */}
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="flex items-center space-x-3 mb-3">
                                    <MessageCircle className="h-5 w-5 text-gray-600" />
                                    <span className="font-bold text-gray-900">Need Help?</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Our Trinidad-based team is here to help you!
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a href="https://wa.me/18685552845" className="inline-flex items-center text-sm text-green-600 hover:text-green-700 font-medium">
                                        <MessageCircle className="h-4 w-4 mr-1" />
                                        WhatsApp We
                                    </a>
                                    <a href="tel:+18685552845" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call We
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// Smart Field Component with AI Suggestions
const SmartField: React.FC<{
    field: string;
    value: any;
    onChange: (value: any) => void;
    suggestions?: any;
    onFocus: () => void;
}> = ({ field, value, onChange, suggestions, onFocus }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fieldLabels: Record<string, string> = {
        businessName: 'Business Name',
        businessType: 'Type of Business',
        description: 'Tell We About Your Business',
        phone: 'Phone Number',
        whatsapp: 'WhatsApp Number',
        email: 'Email Address',
        location: 'Location',
        fullName: 'Full Name',
        address: 'Address',
        vehicleType: 'Vehicle Type',
        deliveryMethod: 'How You Want to Deliver'
    };

    const fieldPlaceholders: Record<string, string> = {
        businessName: 'e.g., Ravi\'s Doubles, Sweet Treats Bakery',
        phone: '868-XXX-XXXX',
        whatsapp: '868-XXX-XXXX (optional)',
        email: 'your@email.com',
        description: 'Tell customers what makes your business special...'
    };

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-gray-900 mb-2">
                {fieldLabels[field] || field}
            </label>

            {suggestions?.options ? (
                <div className="space-y-2">
                    {suggestions.options.map((option: any, idx: number) => {
                        const optionValue = typeof option === 'string' ? option : option.value;
                        const optionLabel = typeof option === 'string' ? option : option.label;
                        const optionIcon = typeof option === 'object' ? option.icon : null;
                        const optionDesc = typeof option === 'object' ? option.description : null;

                        return (
                            <button
                                key={idx}
                                onClick={() => onChange(optionValue)}
                                className={`w-full p-4 border-2 rounded-xl text-left transition-all ${value === optionValue
                                    ? 'border-trini-red bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <div className="flex items-center">
                                    {optionIcon && <span className="text-2xl mr-3">{optionIcon}</span>}
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">{optionLabel}</div>
                                        {optionDesc && <div className="text-sm text-gray-600">{optionDesc}</div>}
                                    </div>
                                    {value === optionValue && (
                                        <Check className="h-5 w-5 text-trini-red flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : field === 'description' ? (
                <textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                    placeholder={fieldPlaceholders[field]}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-trini-red focus:ring-2 focus:ring-red-200 transition-all"
                />
            ) : (
                <input
                    type={field.includes('email') ? 'email' : field.includes('phone') ? 'tel' : 'text'}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={onFocus}
                    placeholder={fieldPlaceholders[field]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-trini-red focus:ring-2 focus:ring-red-200 transition-all"
                />
            )}

            {suggestions?.smart && (
                <div className="mt-2 flex items-center text-xs text-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-powered suggestions
                </div>
            )}
        </div>
    );
};
