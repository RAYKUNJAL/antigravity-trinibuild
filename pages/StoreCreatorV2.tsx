import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Wand2, Loader2, CheckCircle, MapPin, Store, ArrowRight, Zap,
    LayoutTemplate, ShieldCheck, Smartphone, Monitor, RefreshCw,
    Palette, CreditCard, Camera, Star, Lock, Award, TrendingUp,
    FileSignature, X, Clock, Shield, Brain, Instagram, Facebook,
    Upload, Sparkles, Eye, ChevronLeft, Check, AlertCircle,
    Utensils, ChefHat, Flame, Wine, Shirt, ShoppingBag
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { aiService } from '../services/aiService';
import { socialImportService } from '../services/socialImportService';
import { storeService } from '../services/storeService';
import { themeService } from '../services/themeService';
import storeConfig from '../config/storeBuilderConfig.json';
import { DEMO_DATA } from '../config/demoData';

// Types
interface StoreFormData {
    // Step 0 - Quick Start
    importMethod?: 'social_import' | 'manual';
    socialPlatform?: 'instagram' | 'facebook' | 'tiktok';
    socialUrl?: string;

    // Step 1 - Business Basics
    businessName: string;
    category: string;
    tagline?: string;

    // Step 2 - Design & Branding
    logo?: string;
    logoStyle?: string;
    colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    fontPair: {
        heading: string;
        body: string;
    };
    vibe?: string[];

    // Step 3 - Store Details
    description: string;
    whatsappNumber: string;
    location: {
        street?: string;
        area: string;
        region: string;
        lat?: number;
        lng?: number;
    };
    operatingHours: Record<string, { open: string; close: string } | { closed: true }>;
    deliveryOptions: string[];
    deliveryFee?: number;
    freeDeliveryMinimum?: number;
    paymentMethods: string[];
    galleryImages?: string[];
    socialLinks?: Record<string, string>;

    // Step 4 - Preview & Launch
    termsAccepted: boolean;
    paymentPlan: 'free' | 'pro' | 'enterprise';
    launchOption: 'publish_now' | 'save_draft' | 'schedule';
    whatsappVerified: boolean;
}

export const StoreCreatorV2: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<StoreFormData>>({
        colorScheme: {
            primary: '#DC2626',
            secondary: '#F59E0B',
            accent: '#10B981',
            background: '#FFFFFF',
            text: '#1F2937'
        },
        fontPair: {
            heading: 'Inter',
            body: 'Inter'
        },
        paymentMethods: ['cash'],
        deliveryOptions: ['pickup'],
        operatingHours: {},
        termsAccepted: false,
        paymentPlan: 'free',
        launchOption: 'publish_now',
        whatsappVerified: false
    });

    // Loading States
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [socialImporting, setSocialImporting] = useState(false);
    const [generatingLogo, setGeneratingLogo] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);

    // AI Generated Content
    const [logoVariations, setLogoVariations] = useState<string[]>([]);
    const [colorPalettes, setColorPalettes] = useState<any[]>([]);
    const [taglineSuggestions, setTaglineSuggestions] = useState<string[]>([]);
    const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);

    // Preview State
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');

    // Auto-save
    const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

    // Timer
    const [timeElapsed, setTimeElapsed] = useState(0);

    // Error State
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Check for claim parameters
    useEffect(() => {
        const claimName = searchParams.get('claim_name');
        const claimAddress = searchParams.get('claim_address');

        if (claimName) {
            setFormData(prev => ({
                ...prev,
                businessName: decodeURIComponent(claimName),
                location: {
                    ...prev.location,
                    street: claimAddress ? decodeURIComponent(claimAddress) : '',
                    area: '',
                    region: ''
                }
            }));
        }

        // Check for pending data from auth redirect (priority)
        const pendingData = localStorage.getItem('pending_store_data');
        if (pendingData) {
            try {
                const parsed = JSON.parse(pendingData);
                setFormData(parsed);
                setCurrentStep(4); // Resume at Preview/Launch step
                localStorage.removeItem('pending_store_data');
                return;
            } catch (e) {
                console.error('Failed to load pending data:', e);
            }
        }

        // Load draft from localStorage
        const draft = localStorage.getItem('storeBuilder_draft');
        if (draft && !claimName) {
            try {
                const parsed = JSON.parse(draft);
                setFormData(parsed.formData);
                setCurrentStep(parsed.step || 0);
            } catch (e) {
                console.error('Failed to load draft:', e);
            }
        }
    }, [searchParams]);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-save
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            localStorage.setItem('storeBuilder_draft', JSON.stringify({
                formData,
                step: currentStep,
                timestamp: Date.now()
            }));
            setLastAutoSave(Date.now());
        }, 10000); // Every 10 seconds

        return () => clearInterval(autoSaveInterval);
    }, [formData, currentStep]);

    // Social Import Handler
    const handleSocialImport = async (url: string, platform: string) => {
        setSocialImporting(true);
        setLoadingMessage('Importing from social media...');

        try {
            const result = await socialImportService.importFromUrl(url);

            if (result.success && result.data) {
                setFormData(prev => ({
                    ...prev,
                    businessName: result.data!.businessName || prev.businessName,
                    description: result.data!.description || prev.description,
                    category: result.data!.category || prev.category,
                    galleryImages: result.data!.images || prev.galleryImages,
                    logo: result.data!.profileImage || prev.logo,
                    vibe: result.data!.vibe || prev.vibe,
                    socialLinks: {
                        ...prev.socialLinks,
                        [platform]: url
                    }
                }));

                // Move to next step
                setCurrentStep(1);
            } else {
                setErrors({ socialImport: result.error || 'Failed to import from social media' });
            }
        } catch (error) {
            console.error('Social import error:', error);
            setErrors({ socialImport: 'Failed to import from social media' });
        } finally {
            setSocialImporting(false);
            setLoadingMessage('');
        }
    };

    // Generate Logo with AI
    const handleGenerateLogo = async (style: string) => {
        if (!formData.businessName || !formData.category) return;

        setGeneratingLogo(true);
        setLoadingMessage('Generating logo designs...');

        try {
            const result = await aiService.generateLogo({
                businessName: formData.businessName,
                category: formData.category,
                tagline: formData.tagline
            }, style);

            if (result.success && result.data) {
                setLogoVariations(prev => [...prev, result.data.url]);
                setFormData(prev => ({ ...prev, logo: result.data.url, logoStyle: style }));
            } else {
                setErrors({ logo: result.error || 'Failed to generate logo' });
            }
        } catch (error) {
            console.error('Logo generation error:', error);
            setErrors({ logo: 'Failed to generate logo' });
        } finally {
            setGeneratingLogo(false);
            setLoadingMessage('');
        }
    };

    // Generate Description with AI
    const handleGenerateDescription = async (tone: string = 'professional', length: 'short' | 'medium' | 'long' = 'medium') => {
        if (!formData.businessName || !formData.category) return;

        setGeneratingDescription(true);
        setLoadingMessage('Writing description...');

        try {
            const result = await aiService.generateDescription({
                businessName: formData.businessName,
                category: formData.category,
                tagline: formData.tagline,
                vibe: formData.vibe
            }, { tone, length });

            if (result.success && result.data) {
                setDescriptionSuggestions([result.data.description]);
                setFormData(prev => ({ ...prev, description: result.data.description }));
            } else {
                setErrors({ description: result.error || 'Failed to generate description' });
            }
        } catch (error) {
            console.error('Description generation error:', error);
            setErrors({ description: 'Failed to generate description' });
        } finally {
            setGeneratingDescription(false);
            setLoadingMessage('');
        }
    };

    // Generate Taglines
    const handleGenerateTaglines = async () => {
        if (!formData.businessName || !formData.category) return;

        setLoading(true);
        setLoadingMessage('Creating taglines...');

        try {
            const result = await aiService.generateTaglines({
                businessName: formData.businessName,
                category: formData.category,
                description: formData.description,
                vibe: formData.vibe
            }, 5);

            if (result.success && result.data) {
                setTaglineSuggestions(result.data.taglines);
            }
        } catch (error) {
            console.error('Tagline generation error:', error);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // Generate Color Palettes
    const handleGenerateColorPalettes = async () => {
        if (!formData.businessName || !formData.category) return;

        setLoading(true);
        setLoadingMessage('Creating color palettes...');

        try {
            const result = await aiService.generateColorPalette({
                businessName: formData.businessName,
                category: formData.category,
                vibe: formData.vibe
            }, 5);

            if (result.success && result.data) {
                setColorPalettes(result.data.palettes);
            }
        } catch (error) {
            console.error('Color palette generation error:', error);
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // Validate Step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        switch (step) {
            case 0:
                if (!formData.importMethod) {
                    newErrors.importMethod = 'Please select an import method';
                }
                if (formData.importMethod === 'social_import' && !formData.socialUrl) {
                    newErrors.socialUrl = 'Please enter a social media URL';
                }
                break;

            case 1:
                if (!formData.businessName || formData.businessName.length < 2) {
                    newErrors.businessName = 'Business name is required (min 2 characters)';
                }
                if (!formData.category) {
                    newErrors.category = 'Please select a category';
                }
                break;

            case 2:
                if (!formData.colorScheme) {
                    newErrors.colorScheme = 'Please select a color scheme';
                }
                if (!formData.fontPair) {
                    newErrors.fontPair = 'Please select fonts';
                }
                break;

            case 3:
                if (!formData.description || formData.description.length < 50) {
                    newErrors.description = 'Description is required (min 50 characters)';
                }
                if (!formData.whatsappNumber || !/^1868[0-9]{7}$/.test(formData.whatsappNumber)) {
                    newErrors.whatsappNumber = 'Valid Trinidad WhatsApp number required (1868XXXXXXX)';
                }
                if (!formData.location?.area) {
                    newErrors.location = 'Location area is required';
                }
                if (!formData.location?.region) {
                    newErrors.region = 'Region is required';
                }
                break;

            case 4:
                if (!formData.termsAccepted) {
                    newErrors.terms = 'You must accept the terms and conditions';
                }
                if (!formData.paymentPlan) {
                    newErrors.paymentPlan = 'Please select a payment plan';
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigate to Next Step
    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            window.scrollTo(0, 0);
        }
    };

    // Navigate to Previous Step
    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
        window.scrollTo(0, 0);
    };

    // Launch Store
    const handleLaunchStore = async () => {
        if (!validateStep(4)) return;

        setLoading(true);
        setLoadingMessage('Launching your store...');

        try {
            const { data: { user } = {} } = await supabase.auth.getUser();

            if (!user) {
                // Save data and redirect to auth
                localStorage.setItem('pending_store_data', JSON.stringify(formData));
                navigate('/auth?redirect=/create-store');
                return;
            }

            // Map frontend plan selection to DB plan IDs
            const planMapping: Record<string, string> = {
                'free': 'hustle',
                'pro': 'storefront',
                'enterprise': 'growth'
            };
            const selectedPlanId = planMapping[formData.paymentPlan!] || 'hustle';

            // Create store
            const storeData = {
                name: formData.businessName!,
                description: formData.description!,
                location: `${formData.location!.area}, ${formData.location!.region}`,
                whatsapp: formData.whatsappNumber!,
                category: formData.category!,
                logo_url: formData.logo,

                // V2 New Fields
                tagline: formData.tagline,
                logo_style: formData.logoStyle || 'modern',
                vibe: formData.vibe || [],
                operating_hours: formData.operatingHours || {},
                delivery_options: formData.deliveryOptions || [],
                payment_methods: formData.paymentMethods || [],
                font_pair: formData.fontPair,
                color_scheme: formData.colorScheme,
                social_links: formData.socialLinks || {},

                // Pass the selected plan ID
                plan_id: selectedPlanId,

                // Legacy theme_config
                theme_config: {
                    colors: formData.colorScheme,
                    fonts: formData.fontPair,
                    vibe: formData.vibe,
                    location_details: formData.location
                },

                gallery_images: formData.galleryImages,
                status: (formData.launchOption === 'publish_now' ? 'active' : 'pending') as 'active' | 'pending' | 'suspended'
            };

            const newStore = await storeService.createStore(storeData);

            if (newStore) {
                // Seed Demo Products to populate the store immediately
                try {
                    const demoProducts = DEMO_DATA.products[formData.category || ''] || DEMO_DATA.products['doubles_street'];
                    if (demoProducts && demoProducts.length > 0) {
                        setLoadingMessage('Stocking your shelves with demo products...');
                        await Promise.all(demoProducts.map(p => storeService.addProduct(newStore.id, {
                            name: p.name,
                            description: p.description,
                            base_price: p.price,
                            image_url: p.image,
                            category: 'Featured',
                            stock: 100,
                            status: 'active'
                        })));
                    }
                } catch (seedError) {
                    console.error('Error seeding products:', seedError);
                    // Continue anyway, don't block launch
                }

                // Clear draft
                localStorage.removeItem('storeBuilder_draft');
                localStorage.removeItem('storeBuilder_step');

                // Navigate to success page or dashboard
                navigate(`/store/${newStore.id}?welcome=true`);
            }
        } catch (error) {
            console.error('Store launch error:', error);
            setErrors({ launch: 'Failed to launch store. Please try again.' });
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Render Step Content
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return <Step0QuickStart />;
            case 1:
                return <Step1BusinessBasics />;
            case 2:
                return <Step2DesignBranding />;
            case 3:
                return <Step3StoreDetails />;
            case 4:
                return <Step4PreviewLaunch />;
            default:
                return null;
        }
    };

    // Step 0: Quick Start
    const Step0QuickStart = () => (
        <div className="max-w-4xl mx-auto p-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">Let's Build Your Store</h1>
                <p className="text-xl text-gray-600">Import from social media or start fresh - takes less than 5 minutes</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Social Import Option */}
                <button
                    onClick={() => setFormData(prev => ({ ...prev, importMethod: 'social_import' }))}
                    className={`p-8 rounded-2xl border-2 transition-all ${formData.importMethod === 'social_import'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-center justify-center mb-4">
                        <Instagram className="w-12 h-12 text-pink-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Import from Social Media</h3>
                    <p className="text-gray-600 mb-4">Auto-fill from your Instagram, Facebook, or TikTok</p>
                    <div className="inline-block bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full">
                        ⚡ 30 seconds
                    </div>
                </button>

                {/* Manual Option */}
                <button
                    onClick={() => {
                        setFormData(prev => ({ ...prev, importMethod: 'manual' }));
                        setCurrentStep(1);
                    }}
                    className={`p-8 rounded-2xl border-2 transition-all ${formData.importMethod === 'manual'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                >
                    <div className="flex items-center justify-center mb-4">
                        <Wand2 className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Start Fresh</h3>
                    <p className="text-gray-600 mb-4">Manually enter your business details</p>
                    <div className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                        📝 5 minutes
                    </div>
                </button>
            </div>

            {/* Social Import Form */}
            {formData.importMethod === 'social_import' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 animate-in slide-in-from-top">
                    <h3 className="font-bold mb-4 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                        Paste Your Social Media Link
                    </h3>

                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, socialPlatform: 'instagram' }))}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${formData.socialPlatform === 'instagram'
                                ? 'bg-pink-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Instagram className="w-5 h-5 inline mr-2" />
                            Instagram
                        </button>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, socialPlatform: 'facebook' }))}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${formData.socialPlatform === 'facebook'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Facebook className="w-5 h-5 inline mr-2" />
                            Facebook
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <input
                            type="url"
                            placeholder={`Paste your ${formData.socialPlatform || 'social media'} profile URL...`}
                            value={formData.socialUrl || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, socialUrl: e.target.value }))}
                            className="flex-1 px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            onClick={() => formData.socialUrl && formData.socialPlatform && handleSocialImport(formData.socialUrl, formData.socialPlatform)}
                            disabled={!formData.socialUrl || !formData.socialPlatform || socialImporting}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {socialImporting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Import'
                            )}
                        </button>
                    </div>

                    {errors.socialImport && (
                        <div className="mt-3 text-red-600 text-sm flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {errors.socialImport}
                        </div>
                    )}

                    <p className="text-xs text-blue-700 mt-3">
                        ✨ We'll automatically extract your business name, description, images, and more
                    </p>
                </div>
            )}
        </div>
    );

    // Step 1: Business Basics
    const Step1BusinessBasics = () => (
        <div className="max-w-3xl mx-auto p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Business Basics</h2>
                <p className="text-gray-600">Tell us about your business</p>
            </div>

            {/* Business Name */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Business Name *
                </label>
                <input
                    type="text"
                    value={formData.businessName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="e.g. Aunty May's Roti Shop"
                    className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                />
                {errors.businessName && (
                    <p className="mt-2 text-red-600 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.businessName}
                    </p>
                )}
            </div>

            {/* Category - Will add full category selector here */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Business Category *
                </label>
                <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-red-500 text-base"
                >
                    <option value="">Select a category...</option>
                    <optgroup label="Food & Dining">
                        <option value="doubles_street">🌮 Doubles / Street Food Vendor</option>
                        <option value="roti_shop">🫓 Roti Shop</option>
                        <option value="bbq_jerk">🍖 BBQ / Jerk / Grill</option>
                        <option value="restaurant_fine">🍽️ Restaurant / Fine Dining</option>
                    </optgroup>
                    <optgroup label="Retail & Shopping">
                        <option value="parlour">🏪 Parlour / Mini Mart</option>
                        <option value="clothing">👗 Clothing / Fashion</option>
                        <option value="electronics">📱 Electronics</option>
                    </optgroup>
                    {/* Add more categories */}
                </select>
                {errors.category && (
                    <p className="mt-2 text-red-600 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.category}
                    </p>
                )}
            </div>

            {/* Tagline */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Tagline (Optional)
                    </label>
                    <button
                        onClick={handleGenerateTaglines}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate with AI
                    </button>
                </div>
                <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                    placeholder="e.g. Best Doubles in South Trinidad"
                    maxLength={60}
                    className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                />
                <p className="mt-1 text-sm text-gray-500">{(formData.tagline || '').length}/60 characters</p>

                {/* Tagline Suggestions */}
                {taglineSuggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">AI Suggestions:</p>
                        {taglineSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFormData(prev => ({ ...prev, tagline: suggestion }))}
                                className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handlePrevStep}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-all"
                >
                    <ChevronLeft className="w-5 h-5 inline mr-2" />
                    Back
                </button>
                <button
                    onClick={handleNextStep}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                >
                    Next: Design Your Brand
                    <ArrowRight className="w-5 h-5 inline ml-2" />
                </button>
            </div>
        </div>
    );

    // Step 2: Design & Branding (COMPLETE VERSION)
    const Step2DesignBranding = () => {
        const logoStyles = [
            { id: 'modern', name: 'Modern & Clean', icon: '✨' },
            { id: 'traditional', name: 'Traditional Trini', icon: '🇹🇹' },
            { id: 'playful', name: 'Fun & Playful', icon: '🎨' },
            { id: 'elegant', name: 'Elegant & Premium', icon: '👑' },
            { id: 'bold', name: 'Bold & Vibrant', icon: '⚡' }
        ];

        const colorPalettesPreset = [
            { name: 'Carnival Vibes', primary: '#DC2626', secondary: '#F59E0B', accent: '#10B981', background: '#FFFFFF', text: '#1F2937' },
            { name: 'Ocean Breeze', primary: '#0EA5E9', secondary: '#06B6D4', accent: '#10B981', background: '#F0F9FF', text: '#0C4A6E' },
            { name: 'Sunset Glow', primary: '#F97316', secondary: '#FBBF24', accent: '#EF4444', background: '#FFF7ED', text: '#7C2D12' },
            { name: 'Forest Green', primary: '#059669', secondary: '#10B981', accent: '#34D399', background: '#F0FDF4', text: '#064E3B' },
            { name: 'Elegant Black', primary: '#1F2937', secondary: '#D97706', accent: '#F59E0B', background: '#FFFFFF', text: '#111827' }
        ];

        const fontPairs = [
            { id: 'inter', heading: 'Inter', body: 'Inter', preview: 'Modern & Clean' },
            { id: 'playfair', heading: 'Playfair Display', body: 'Lato', preview: 'Elegant Serif' },
            { id: 'montserrat', heading: 'Montserrat', body: 'Open Sans', preview: 'Bold Impact' },
            { id: 'poppins', heading: 'Poppins', body: 'Nunito', preview: 'Friendly & Casual' },
            { id: 'roboto', heading: 'Roboto', body: 'Roboto', preview: 'Professional' }
        ];

        const vibeOptions = ['Traditional', 'Modern', 'Family Friendly', 'Upscale', 'Casual', 'Fast Service', 'Authentic', 'Innovative', 'Eco-Friendly', 'Local'];

        return (
            <div className="max-w-5xl mx-auto p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Design Your Brand</h2>
                    <p className="text-gray-600">Create a professional look that stands out</p>
                </div>

                {/* Logo Studio */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Logo Studio</h3>
                    <div className="bg-gray-50 border rounded-xl p-6">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            {/* Preview */}
                            <div className="flex-1 w-full flex justify-center">
                                <div
                                    className="w-64 h-64 bg-white shadow-xl rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all duration-300 transform hover:scale-105"
                                    style={{
                                        border: `4px solid ${formData.colorScheme?.primary}`
                                    }}
                                >
                                    {(() => {
                                        const iconName = DEMO_DATA.icons[formData.category || ''] || 'ShoppingBag';
                                        const IconComponent = {
                                            Utensils, ChefHat, Flame, Wine, Shirt, Smartphone, Store, ShoppingBag
                                        }[iconName] || ShoppingBag;

                                        return (
                                            <>
                                                <IconComponent
                                                    size={80}
                                                    className="mb-4"
                                                    style={{ color: formData.colorScheme?.primary }}
                                                />
                                                <h2
                                                    className="text-2xl font-bold break-words w-full"
                                                    style={{
                                                        fontFamily: formData.fontPair?.heading,
                                                        color: formData.colorScheme?.text || '#1F2937'
                                                    }}
                                                >
                                                    {formData.businessName || 'Your Store'}
                                                </h2>
                                                {formData.tagline && (
                                                    <p className="text-sm mt-2 opacity-75" style={{ fontFamily: formData.fontPair?.body }}>
                                                        {formData.tagline}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex-1 w-full space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Icon Style</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['ShoppingBag', 'Store', 'Award', 'Zap', 'Star', 'Shield', 'Heart', 'Smile'].map(icon => (
                                            <button
                                                key={icon}
                                                // MVP: Disabled for now, just informative
                                                className="p-2 border rounded hover:bg-gray-100 flex justify-center disabled:opacity-50"
                                                disabled
                                            >
                                                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">* Icon selected based on category: {formData.category}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        const demoLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.businessName || 'Store')}&background=${formData.colorScheme?.primary.replace('#', '')}&color=fff&size=256&font-size=0.33`;
                                        setFormData(prev => ({ ...prev, logo: demoLogo, logoStyle: 'modern_vector' }));
                                    }}
                                    className={`w-full py-3 rounded-lg font-bold transition-all flex justify-center items-center ${formData.logoStyle === 'modern_vector' ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {formData.logoStyle === 'modern_vector' ? 'Logo Applied!' : 'Use This Professional Design'}
                                </button>

                                <div className="relative">
                                    <span className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-300" />
                                    </span>
                                    <span className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-gray-50 px-2 text-gray-500">Or Upload Custom</span>
                                    </span>
                                </div>

                                <label className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-bold hover:border-gray-400 transition-all flex justify-center items-center cursor-pointer bg-white">
                                    <Upload className="w-5 h-5 mr-2" />
                                    Upload Logo File
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const url = URL.createObjectURL(e.target.files[0]);
                                            setFormData(prev => ({ ...prev, logo: url, logoStyle: 'upload' }));
                                        }
                                    }} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Color Scheme Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Color Scheme</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {colorPalettesPreset.map((palette, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFormData(prev => ({ ...prev, colorScheme: palette }))}
                                className={`p-4 rounded-lg border-2 transition-all ${JSON.stringify(formData.colorScheme) === JSON.stringify(palette)
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex gap-2 mb-2">
                                    <div className="w-8 h-8 rounded" style={{ backgroundColor: palette.primary }}></div>
                                    <div className="w-8 h-8 rounded" style={{ backgroundColor: palette.secondary }}></div>
                                    <div className="w-8 h-8 rounded" style={{ backgroundColor: palette.accent }}></div>
                                </div>
                                <p className="text-sm font-bold text-left">{palette.name}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Font Pair Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Typography</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {fontPairs.map((font, idx) => (
                            <button
                                key={idx}
                                onClick={() => setFormData(prev => ({ ...prev, fontPair: { heading: font.heading, body: font.body } }))}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${formData.fontPair?.heading === font.heading
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <p className="text-lg font-bold mb-1" style={{ fontFamily: font.heading }}>{font.heading}</p>
                                <p className="text-sm text-gray-600" style={{ fontFamily: font.body }}>{font.preview}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Business Vibe Tags */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-4">Business Vibe (Optional)</h3>
                    <p className="text-sm text-gray-600 mb-3">Select tags that describe your business atmosphere</p>
                    <div className="flex flex-wrap gap-2">
                        {vibeOptions.map(vibe => (
                            <button
                                key={vibe}
                                onClick={() => {
                                    const currentVibes = formData.vibe || [];
                                    const newVibes = currentVibes.includes(vibe)
                                        ? currentVibes.filter(v => v !== vibe)
                                        : [...currentVibes, vibe];
                                    setFormData(prev => ({ ...prev, vibe: newVibes }));
                                }}
                                className={`px-4 py-2 rounded-full border-2 transition-all ${formData.vibe?.includes(vibe)
                                    ? 'border-red-500 bg-red-500 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                                    }`}
                            >
                                {vibe}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={handlePrevStep}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 inline mr-2" />
                        Back
                    </button>
                    <button
                        onClick={handleNextStep}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                        Next: Store Details
                        <ArrowRight className="w-5 h-5 inline ml-2" />
                    </button>
                </div>
            </div>
        );
    };

    // Step 3: Store Details (COMPLETE VERSION)
    const Step3StoreDetails = () => {
        const trinidadAreas = [
            'Arima', 'Arouca', 'Barataria', 'Chaguanas', 'Couva', 'Cunupia', 'Diego Martin',
            'El Socorro', 'Fyzabad', 'Gasparillo', 'Marabella', 'Maraval', 'Mon Repos',
            'Morvant', 'Penal', 'Piarco', 'Point Fortin', 'Port of Spain', 'Princes Town',
            'Rio Claro', 'San Fernando', 'San Juan', 'Sangre Grande', 'Siparia', 'St. Joseph',
            'Tacarigua', 'Tunapuna', 'Valsayn', 'Woodbrook'
        ];

        const regions = [
            'Port of Spain', 'San Fernando', 'Arima', 'Chaguanas', 'Point Fortin',
            'Diego Martin', 'San Juan-Laventille', 'Tunapuna-Piarco', 'Couva-Tabaquite-Talparo',
            'Sangre Grande', 'Mayaro-Rio Claro', 'Princes Town', 'Penal-Debe', 'Siparia'
        ];

        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const setOperatingHoursPreset = (preset: string) => {
            let hours: Record<string, any> = {};
            switch (preset) {
                case 'mon-fri':
                    daysOfWeek.forEach(day => {
                        hours[day] = day === 'Saturday' || day === 'Sunday' ? { closed: true } : { open: '09:00', close: '17:00' };
                    });
                    break;
                case 'mon-sat':
                    daysOfWeek.forEach(day => {
                        hours[day] = day === 'Sunday' ? { closed: true } : { open: '08:00', close: '18:00' };
                    });
                    break;
                case '24-7':
                    daysOfWeek.forEach(day => {
                        hours[day] = { open: '00:00', close: '23:59' };
                    });
                    break;
            }
            setFormData(prev => ({ ...prev, operatingHours: hours }));
        };

        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Store Details</h2>
                    <p className="text-gray-600">Help customers find and contact you</p>
                </div>

                {/* Description */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wide">
                            Business Description *
                        </label>
                        <button
                            onClick={() => handleGenerateDescription('professional', 'medium')}
                            disabled={generatingDescription}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                        >
                            <Brain className="w-4 h-4 mr-1" />
                            {generatingDescription ? 'Writing...' : 'Write with AI'}
                        </button>
                    </div>
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tell customers what makes your business special..."
                        rows={5}
                        maxLength={500}
                        className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">{(formData.description || '').length}/500 characters</p>
                    {errors.description && (
                        <p className="mt-2 text-red-600 text-sm flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.description}
                        </p>
                    )}
                </div>

                {/* WhatsApp Number */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        WhatsApp Business Number *
                    </label>
                    <input
                        type="tel"
                        value={formData.whatsappNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                        placeholder="1868-123-4567"
                        maxLength={11}
                        className="w-full border-2 border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                    />
                    {errors.whatsappNumber && (
                        <p className="mt-2 text-red-600 text-sm flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.whatsappNumber}
                        </p>
                    )}
                    <p className="mt-2 text-sm text-gray-600">
                        📱 Enter your Trinidad number (must start with 1868)
                    </p>
                </div>

                {/* Location */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Location *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                            <select
                                value={formData.location?.area || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    location: { ...prev.location, area: e.target.value, region: prev.location?.region || '' }
                                }))}
                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                                title="Select area"
                            >
                                <option value="">Select area...</option>
                                {trinidadAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                            {errors.location && (
                                <p className="mt-1 text-red-600 text-sm">{errors.location}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                            <select
                                value={formData.location?.region || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    location: { ...prev.location, area: prev.location?.area || '', region: e.target.value }
                                }))}
                                className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                                title="Select region"
                            >
                                <option value="">Select region...</option>
                                {regions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            {errors.region && (
                                <p className="mt-1 text-red-600 text-sm">{errors.region}</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address (Optional)</label>
                        <input
                            type="text"
                            value={formData.location?.street || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                location: { ...prev.location, area: prev.location?.area || '', region: prev.location?.region || '', street: e.target.value }
                            }))}
                            placeholder="123 Main Road"
                            className="w-full border-2 border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500"
                        />
                    </div>
                </div>

                {/* Operating Hours */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Operating Hours *</h3>
                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={() => setOperatingHoursPreset('mon-fri')}
                            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 text-sm font-medium transition-all"
                        >
                            Mon-Fri (9am-5pm)
                        </button>
                        <button
                            onClick={() => setOperatingHoursPreset('mon-sat')}
                            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 text-sm font-medium transition-all"
                        >
                            Mon-Sat (8am-6pm)
                        </button>
                        <button
                            onClick={() => setOperatingHoursPreset('24-7')}
                            className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 text-sm font-medium transition-all"
                        >
                            24/7
                        </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        {Object.keys(formData.operatingHours || {}).length > 0
                            ? '✓ Hours configured'
                            : 'Click a preset above or customize below'}
                    </p>
                </div>

                {/* Service Options */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Service Options *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Pickup', 'Delivery', 'Dine In', 'Curbside'].map(option => (
                            <button
                                key={option}
                                onClick={() => {
                                    const optionKey = option.toLowerCase().replace(' ', '_');
                                    const current = formData.deliveryOptions || [];
                                    const newOptions = current.includes(optionKey)
                                        ? current.filter(o => o !== optionKey)
                                        : [...current, optionKey];
                                    setFormData(prev => ({ ...prev, deliveryOptions: newOptions }));
                                }}
                                className={`p-3 rounded-lg border-2 transition-all ${formData.deliveryOptions?.includes(option.toLowerCase().replace(' ', '_'))
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                            >
                                <span className="text-sm font-medium">{option}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Payment Methods *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Cash', 'Linx', 'Bank Transfer', 'Online Payment', 'Mobile Wallet'].map(method => (
                            <button
                                key={method}
                                onClick={() => {
                                    const methodKey = method.toLowerCase().replace(' ', '_');
                                    const current = formData.paymentMethods || [];
                                    const newMethods = current.includes(methodKey)
                                        ? current.filter(m => m !== methodKey)
                                        : [...current, methodKey];
                                    setFormData(prev => ({ ...prev, paymentMethods: newMethods }));
                                }}
                                className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethods?.includes(method.toLowerCase().replace(' ', '_'))
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                    }`}
                            >
                                <span className="text-sm font-medium">{method}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4">
                    <button
                        onClick={handlePrevStep}
                        className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5 inline mr-2" />
                        Back
                    </button>
                    <button
                        onClick={handleNextStep}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
                    >
                        Next: Preview & Launch
                        <ArrowRight className="w-5 h-5 inline ml-2" />
                    </button>
                </div>
            </div>
        );
    };

    // Step 4: Preview & Launch (Expanded with Pricing)
    const Step4PreviewLaunch = () => (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Review & Launch</h2>
                <p className="text-gray-600">Review your store and choose a plan to go live</p>
            </div>

            {/* Preview Section */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Store Preview</h3>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`px-4 py-2 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        >
                            <Monitor className="w-4 h-4 inline mr-2" />
                            Desktop
                        </button>
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`px-4 py-2 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                        >
                            <Smartphone className="w-4 h-4 inline mr-2" />
                            Mobile
                        </button>
                    </div>
                </div>

                <div className="bg-gray-100 p-8 rounded-xl flex justify-center">
                    <div
                        className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'}`}
                    >
                        {/* Header */}
                        <div className="p-8 text-white relative overflow-hidden" style={{ backgroundColor: formData.colorScheme?.primary }}>
                            <div className="relative z-10 text-center">
                                {formData.logo && (
                                    <img src={formData.logo} alt="Logo" className="h-24 w-24 object-contain mx-auto mb-4 bg-white rounded-full p-2 shadow-lg" />
                                )}
                                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: formData.fontPair?.heading }}>{formData.businessName}</h1>
                                {formData.tagline && <p className="text-lg opacity-90">{formData.tagline}</p>}
                            </div>
                        </div>
                        {/* Content */}
                        <div className="p-8">
                            <div className="flex gap-2 mb-6 flex-wrap justify-center">
                                {formData.vibe?.map(v => (
                                    <span key={v} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">{v}</span>
                                ))}
                            </div>
                            <p className="text-gray-700 mb-8 text-center leading-relaxed" style={{ fontFamily: formData.fontPair?.body }}>
                                {formData.description}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-green-500 text-white py-3 rounded-lg font-bold shadow-sm" style={{ backgroundColor: '#25D366' }}>
                                    WhatsApp Us
                                </button>
                                <button className="border-2 border-gray-200 py-3 rounded-lg font-bold" style={{ color: formData.colorScheme?.primary, borderColor: formData.colorScheme?.primary }}>
                                    View Menu
                                </button>
                            </div>

                            {/* Featured Products (Demo) */}
                            <div className="mt-8">
                                <h4 className="text-xl font-bold mb-4 border-b pb-2">Featured Items (Demo)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                    {(DEMO_DATA.products[formData.category || ''] || DEMO_DATA.products['doubles_street']).slice(0, 4).map((product, idx) => (
                                        <div key={idx} className="flex gap-4 p-3 border rounded-lg hover:shadow-md transition-all bg-white">
                                            <img src={product.image} alt={product.name} className="w-20 h-20 object-cover rounded-md" />
                                            <div className="flex-1">
                                                <h5 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h5>
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-1">{product.description}</p>
                                                <p className="text-red-600 font-bold">${product.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Selection */}
            <div className="mb-12">
                <h3 className="text-xl font-bold mb-6">Select a Plan</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Free Plan */}
                    <div
                        onClick={() => setFormData(prev => ({ ...prev, paymentPlan: 'free' }))}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${formData.paymentPlan === 'free' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg">The Hustle</h4>
                                <p className="text-gray-500 text-sm">Start Tonight. Risk Free.</p>
                            </div>
                            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Free</span>
                        </div>
                        <div className="text-3xl font-bold mb-4">$0 <span className="text-sm font-normal text-gray-500">/mo</span></div>
                        <ul className="space-y-3 text-sm text-gray-600 mb-6">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 1 TriniBuild Storefront</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 15 Products Limit</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Basic Analytics</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 5% Transaction Fee</li>
                        </ul>
                    </div>

                    {/* Pro Plan */}
                    <div
                        onClick={() => setFormData(prev => ({ ...prev, paymentPlan: 'pro' }))}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all relative hover:shadow-lg ${formData.paymentPlan === 'pro' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}`}
                    >
                        <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">POPULAR</div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg">Storefront</h4>
                                <p className="text-gray-500 text-sm">Your Brand. Your Rules.</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold mb-4">$100 <span className="text-sm font-normal text-gray-500">/mo</span></div>
                        <ul className="space-y-3 text-sm text-gray-600 mb-6">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Everything in Hustle</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Custom Domain (.com)</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 50 Products</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> 0% Transaction Fees</li>
                        </ul>
                    </div>

                    {/* Enterprise Plan */}
                    <div
                        onClick={() => setFormData(prev => ({ ...prev, paymentPlan: 'enterprise' }))}
                        className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${formData.paymentPlan === 'enterprise' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg">Growth</h4>
                                <p className="text-gray-500 text-sm">Business on Autopilot.</p>
                            </div>
                        </div>
                        <div className="text-3xl font-bold mb-4">$200 <span className="text-sm font-normal text-gray-500">/mo</span></div>
                        <ul className="space-y-3 text-sm text-gray-600 mb-6">
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited Products</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> WhatsApp Automation</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> Advanced Analytics</li>
                            <li className="flex gap-2"><Check className="w-4 h-4 text-green-500" /> AI Marketing Tools</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Terms */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-start cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.termsAccepted}
                        onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                        className="mt-1 mr-3 w-5 h-5 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                        I agree to the <a href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</a> and{' '}
                        <a href="/legal/merchant-agreement" className="text-blue-600 hover:underline">Merchant Agreement</a>.
                        I understand that for paid plans, billing will start immediately after launch.
                    </span>
                </label>
                {errors.terms && (
                    <p className="mt-2 text-red-600 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.terms}
                    </p>
                )}
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    onClick={handlePrevStep}
                    className="px-6 py-4 border-2 border-gray-300 rounded-lg font-bold hover:bg-gray-50 transition-all text-gray-700"
                >
                    <ChevronLeft className="w-5 h-5 inline mr-2" />
                    Back
                </button>
                <button
                    onClick={handleLaunchStore}
                    disabled={loading}
                    className="flex-1 px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                            Launching Your Store...
                        </>
                    ) : (
                        <>
                            Launch My {formData.paymentPlan === 'free' ? 'Free' : 'Pro'} Store 🚀
                        </>
                    )}
                </button>
            </div>
        </div>
    );
    return (
        <>
            <Helmet>
                <title>Create Your Store - TriniBuild Store Builder</title>
                <meta name="description" content="Build your online store in 5 minutes with AI-powered tools. Free for Trinidad & Tobago businesses." />
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Progress Bar */}
                {currentStep < 5 && (
                    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                        <div className="max-w-6xl mx-auto px-4 py-4">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-full">
                                        Step {currentStep + 1} of 5
                                    </span>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Clock className="w-4 h-4 mr-1" />
                                        {formatTime(timeElapsed)}
                                    </div>
                                </div>

                                {lastAutoSave && (
                                    <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Auto-saved
                                    </div>
                                )}
                            </div>

                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                                    style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {(loading || socialImporting || generatingLogo || generatingDescription) && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
                            <Loader2 className="w-16 h-16 text-red-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">
                                {loadingMessage || 'Processing...'}
                            </h3>
                            <p className="text-gray-600">This will only take a moment</p>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="py-8">
                    {renderStepContent()}
                </div>
            </div>
        </>
    );
};
