import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Store, ShoppingBag, Package, Truck, Clock, Shield, Star, TrendingUp,
    Phone, Mail, MessageCircle, MapPin, ChevronRight, Check, Zap, Award,
    Users, DollarSign, BarChart3, Globe, Heart, Gift, Tag, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StoreServicesLanding: React.FC = () => {
    const navigate = useNavigate();
    const [formStep, setFormStep] = useState(0);
    const [formData, setFormData] = useState({
        businessName: '',
        businessType: '',
        productsCount: '',
        monthlyRevenue: '',
        hasInventory: '',
        needsDelivery: '',
        fullName: '',
        email: '',
        phone: '',
        whatsapp: ''
    });

    const businessTypes = [
        { id: 'retail', name: 'Retail Store', icon: '🏪', description: 'Clothing, electronics, general retail' },
        { id: 'food', name: 'Food & Beverage', icon: '🍽️', description: 'Restaurants, bakeries, catering' },
        { id: 'beauty', name: 'Beauty & Wellness', icon: '💄', description: 'Salons, spas, cosmetics' },
        { id: 'auto', name: 'Auto Parts', icon: '🚗', description: 'Car parts, accessories, services' },
        { id: 'hardware', name: 'Hardware & Tools', icon: '🔧', description: 'Construction, tools, supplies' },
        { id: 'fashion', name: 'Fashion & Apparel', icon: '👗', description: 'Clothing, shoes, accessories' },
        { id: 'electronics', name: 'Electronics', icon: '💻', description: 'Phones, computers, gadgets' },
        { id: 'home', name: 'Home & Garden', icon: '🏡', description: 'Furniture, decor, plants' },
        { id: 'sports', name: 'Sports & Fitness', icon: '⚽', description: 'Equipment, apparel, supplements' },
        { id: 'other', name: 'Other', icon: '📦', description: 'Custom business type' }
    ];

    const questions = [
        {
            question: "What type of business do you have?",
            field: 'businessType',
            type: 'select',
            options: businessTypes
        },
        {
            question: "How many products do you sell?",
            field: 'productsCount',
            type: 'radio',
            options: [
                { value: '1-50', label: '1-50 products' },
                { value: '51-200', label: '51-200 products' },
                { value: '201-500', label: '201-500 products' },
                { value: '500+', label: '500+ products' }
            ]
        },
        {
            question: "What's your approximate monthly revenue?",
            field: 'monthlyRevenue',
            type: 'radio',
            options: [
                { value: '0-5k', label: 'Under TT$5,000' },
                { value: '5k-20k', label: 'TT$5,000 - TT$20,000' },
                { value: '20k-50k', label: 'TT$20,000 - TT$50,000' },
                { value: '50k+', label: 'Over TT$50,000' }
            ]
        },
        {
            question: "Do you need delivery services?",
            field: 'needsDelivery',
            type: 'radio',
            options: [
                { value: 'yes', label: 'Yes, I need TriniBuild Go delivery' },
                { value: 'own', label: 'I have my own delivery' },
                { value: 'no', label: 'No delivery needed (pickup only)' }
            ]
        }
    ];

    const handleSubmit = async () => {
        // Submit form to create store
        console.log('Store setup data:', formData);
        navigate('/store/builder');
    };

    return (
        <>
            <Helmet>
                <title>Open Your Online Store in Trinidad & Tobago | TriniBuild</title>
                <meta name="description" content="Start selling online in Trinidad & Tobago with TriniBuild. Get your store online in 5 minutes with COD, WiPay, delivery, and more. No technical skills needed!" />
                <meta name="keywords" content="online store trinidad, e-commerce trinidad, sell online trinidad, trinidad online shopping, wipay, cash on delivery trinidad" />

                {/* Open Graph */}
                <meta property="og:title" content="Open Your Online Store in Trinidad & Tobago | TriniBuild" />
                <meta property="og:description" content="Start selling online in 5 minutes. Accept COD, WiPay, get free delivery with TriniBuild Go." />
                <meta property="og:type" content="website" />

                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "TriniBuild Online Store Platform",
                        "description": "E-commerce platform for Trinidad & Tobago businesses",
                        "provider": {
                            "@type": "Organization",
                            "name": "TriniBuild",
                            "url": "https://trinibuild.com"
                        },
                        "areaServed": {
                            "@type": "Country",
                            "name": "Trinidad and Tobago"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "29.00",
                            "priceCurrency": "TTD"
                        }
                    })}
                </script>
            </Helmet>

            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative bg-gradient-to-br from-trini-red via-red-600 to-red-700 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="text-center lg:text-left">
                                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-6">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Setup in 5 Minutes
                                </div>
                                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                                    Start Selling Online in Trinidad & Tobago
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 text-white/90">
                                    Accept COD, WiPay, Google Pay. Get free delivery with TriniBuild Go. No technical skills needed.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <button
                                        onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="bg-white text-trini-red px-8 py-4 rounded-full font-extrabold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 flex items-center justify-center"
                                    >
                                        Get Started Free
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => navigate('/demo')}
                                        className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
                                    >
                                        View Demo Store
                                    </button>
                                </div>

                                {/* Trust Indicators */}
                                <div className="mt-12 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 mr-2" />
                                        No Credit Card Required
                                    </div>
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 mr-2" />
                                        Free 14-Day Trial
                                    </div>
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 mr-2" />
                                        Cancel Anytime
                                    </div>
                                </div>
                            </div>

                            {/* Hero Image/Stats */}
                            <div className="hidden lg:block">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                                    <div className="grid grid-cols-2 gap-6">
                                        <StatBox icon={<Store />} value="500+" label="Active Stores" />
                                        <StatBox icon={<Users />} value="10K+" label="Happy Customers" />
                                        <StatBox icon={<DollarSign />} value="TT$2M+" label="Sales Processed" />
                                        <StatBox icon={<Star />} value="4.9/5" label="Store Rating" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Everything You Need to Sell Online
                            </h2>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Built specifically for Trinidad & Tobago businesses. No hidden fees, no complicated setup.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<ShoppingBag className="h-12 w-12 text-blue-600" />}
                                title="Beautiful Online Store"
                                description="Professional storefront that works on all devices. Customize colors, add your logo, and start selling in minutes."
                            />
                            <FeatureCard
                                icon={<DollarSign className="h-12 w-12 text-green-600" />}
                                title="Accept All Payments"
                                description="Cash on Delivery, WiPay, Google Pay, Bank Transfer. Your customers choose how they want to pay."
                            />
                            <FeatureCard
                                icon={<Truck className="h-12 w-12 text-purple-600" />}
                                title="TriniBuild Go Delivery"
                                description="Integrated delivery network across Trinidad & Tobago. Real-time tracking and proof of delivery."
                            />
                            <FeatureCard
                                icon={<MessageCircle className="h-12 w-12 text-pink-600" />}
                                title="WhatsApp Integration"
                                description="Automatic WhatsApp notifications for orders. Chat with customers directly from your dashboard."
                            />
                            <FeatureCard
                                icon={<BarChart3 className="h-12 w-12 text-orange-600" />}
                                title="Sales Analytics"
                                description="Track your sales, best products, and customer behavior. Make data-driven decisions."
                            />
                            <FeatureCard
                                icon={<Gift className="h-12 w-12 text-red-600" />}
                                title="Marketing Tools"
                                description="Promo codes, flash sales, loyalty points, email campaigns. Everything to grow your sales."
                            />
                        </div>
                    </div>
                </section>

                {/* Interactive Quiz Section */}
                <section id="quiz" className="py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Let's Build Your Perfect Store
                            </h2>
                            <p className="text-xl text-gray-600">
                                Answer a few questions and we'll set everything up for you
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                            {/* Progress Bar */}
                            <div className="bg-gray-100 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">
                                        Step {formStep + 1} of {questions.length + 1}
                                    </span>
                                    <span className="text-sm font-medium text-trini-red">
                                        {Math.round(((formStep + 1) / (questions.length + 1)) * 100)}% Complete
                                    </span>
                                </div>
                                <div className="w-full bg-gray-300 rounded-full h-2">
                                    <div
                                        className="bg-trini-red h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((formStep + 1) / (questions.length + 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="p-8 md:p-12">
                                {formStep < questions.length ? (
                                    <QuizQuestion
                                        question={questions[formStep]}
                                        value={formData[questions[formStep].field as keyof typeof formData]}
                                        onChange={(value) => {
                                            setFormData({ ...formData, [questions[formStep].field]: value });
                                            setTimeout(() => setFormStep(formStep + 1), 300);
                                        }}
                                    />
                                ) : (
                                    <ContactForm
                                        formData={formData}
                                        onChange={setFormData}
                                        onSubmit={handleSubmit}
                                    />
                                )}
                            </div>

                            {/* Navigation */}
                            {formStep > 0 && formStep < questions.length && (
                                <div className="px-8 pb-8">
                                    <button
                                        onClick={() => setFormStep(formStep - 1)}
                                        className="text-gray-600 hover:text-gray-900 font-medium"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Simple, Transparent Pricing
                            </h2>
                            <p className="text-xl text-gray-600">
                                No hidden fees. No surprises. Just honest pricing.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PricingCard
                                name="Starter"
                                price="29"
                                period="month"
                                features={[
                                    'Up to 100 products',
                                    'Cash on Delivery',
                                    'Basic analytics',
                                    'WhatsApp notifications',
                                    'Email support'
                                ]}
                                cta="Start Free Trial"
                            />
                            <PricingCard
                                name="Pro"
                                price="79"
                                period="month"
                                popular={true}
                                features={[
                                    'Unlimited products',
                                    'All payment methods',
                                    'TriniBuild Go delivery',
                                    'Advanced analytics',
                                    'Loyalty program',
                                    'Email marketing',
                                    'Priority support'
                                ]}
                                cta="Start Free Trial"
                            />
                            <PricingCard
                                name="Enterprise"
                                price="Custom"
                                period=""
                                features={[
                                    'Everything in Pro',
                                    'Multiple locations',
                                    'Staff accounts',
                                    'API access',
                                    'White label',
                                    'Dedicated account manager',
                                    '24/7 phone support'
                                ]}
                                cta="Contact Sales"
                            />
                        </div>
                    </div>
                </section>

                {/* Social Proof */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Trusted by Trinidad & Tobago Businesses
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="TriniBuild helped me take my small bakery online. Now I'm getting orders from all over Trinidad!"
                                author="Sarah Mohammed"
                                business="Sweet Treats Bakery, Port of Spain"
                                rating={5}
                            />
                            <TestimonialCard
                                quote="The COD option was a game-changer. My customers love being able to pay when they receive their order."
                                author="Michael Chen"
                                business="Tech Haven Electronics, San Fernando"
                                rating={5}
                            />
                            <TestimonialCard
                                quote="Setup was so easy! I had my store online in less than 10 minutes. The delivery integration is perfect."
                                author="Khadijah Ali"
                                business="Fashion Forward Boutique, Chaguanas"
                                rating={5}
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-gradient-to-r from-trini-red to-red-700 text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                            Ready to Start Selling Online?
                        </h2>
                        <p className="text-xl mb-8 text-white/90">
                            Join hundreds of Trinidad & Tobago businesses already selling on TriniBuild
                        </p>
                        <button
                            onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-trini-red px-12 py-5 rounded-full font-extrabold text-xl hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 inline-flex items-center"
                        >
                            Get Started Free
                            <ArrowRight className="ml-3 h-6 w-6" />
                        </button>
                        <p className="mt-6 text-sm text-white/80">
                            No credit card required • Free 14-day trial • Cancel anytime
                        </p>
                    </div>
                </section>

                {/* Contact Section */}
                <section className="py-20 bg-gray-900 text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-3xl font-bold mb-6">Have Questions?</h3>
                                <p className="text-gray-300 mb-8">
                                    Our Trinidad-based team is here to help you succeed. Contact us anytime!
                                </p>
                                <div className="space-y-4">
                                    <ContactMethod
                                        icon={<Phone className="h-6 w-6" />}
                                        label="Phone"
                                        value="+1 (868) 555-BUILD"
                                        href="tel:+18685552845"
                                    />
                                    <ContactMethod
                                        icon={<MessageCircle className="h-6 w-6" />}
                                        label="WhatsApp"
                                        value="+1 (868) 555-BUILD"
                                        href="https://wa.me/18685552845"
                                    />
                                    <ContactMethod
                                        icon={<Mail className="h-6 w-6" />}
                                        label="Email"
                                        value="stores@trinibuild.com"
                                        href="mailto:stores@trinibuild.com"
                                    />
                                    <ContactMethod
                                        icon={<MapPin className="h-6 w-6" />}
                                        label="Office"
                                        value="Port of Spain, Trinidad & Tobago"
                                        href="#"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-800 p-8 rounded-2xl">
                                <h4 className="text-2xl font-bold mb-6">Quick Contact</h4>
                                <form className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                    <textarea
                                        placeholder="Your Message"
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        className="w-full bg-trini-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

// Helper Components
const StatBox: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({ icon, value, label }) => (
    <div className="text-center">
        <div className="text-white/80 mb-2">{icon}</div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-sm text-white/70">{label}</div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all hover:-translate-y-1">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);

const QuizQuestion: React.FC<{ question: any; value: string; onChange: (value: string) => void }> = ({ question, value, onChange }) => (
    <div className="space-y-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{question.question}</h3>

        {question.type === 'select' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option: any) => (
                    <button
                        key={option.id}
                        onClick={() => onChange(option.id)}
                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-trini-red hover:bg-red-50 transition-all text-left"
                    >
                        <div className="text-4xl mb-3">{option.icon}</div>
                        <div className="font-bold text-gray-900 mb-1">{option.name}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                    </button>
                ))}
            </div>
        )}

        {question.type === 'radio' && (
            <div className="space-y-3">
                {question.options.map((option: any) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all ${value === option.value
                                ? 'border-trini-red bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center">
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${value === option.value ? 'border-trini-red' : 'border-gray-300'
                                }`}>
                                {value === option.value && <div className="w-3 h-3 rounded-full bg-trini-red"></div>}
                            </div>
                            <span className="font-medium text-gray-900">{option.label}</span>
                        </div>
                    </button>
                ))}
            </div>
        )}
    </div>
);

const ContactForm: React.FC<{ formData: any; onChange: (data: any) => void; onSubmit: () => void }> = ({ formData, onChange, onSubmit }) => (
    <div className="space-y-6">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Almost Done! Let's Get You Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
                type="text"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={(e) => onChange({ ...formData, fullName: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
            <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => onChange({ ...formData, email: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
            <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
            <input
                type="tel"
                placeholder="WhatsApp Number"
                value={formData.whatsapp}
                onChange={(e) => onChange({ ...formData, whatsapp: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
        </div>
        <button
            onClick={onSubmit}
            className="w-full bg-trini-red text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center"
        >
            Create My Store
            <ArrowRight className="ml-2 h-5 w-5" />
        </button>
        <p className="text-sm text-gray-500 text-center">
            By clicking "Create My Store", you agree to our Terms of Service and Privacy Policy
        </p>
    </div>
);

const PricingCard: React.FC<{ name: string; price: string; period: string; features: string[]; cta: string; popular?: boolean }> = ({ name, price, period, features, cta, popular }) => (
    <div className={`bg-white rounded-2xl shadow-xl border-2 ${popular ? 'border-trini-red' : 'border-gray-200'} p-8 relative`}>
        {popular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-trini-red text-white px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</span>
            </div>
        )}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <div className="mb-6">
            <span className="text-5xl font-extrabold text-gray-900">TT${price}</span>
            {period && <span className="text-gray-600">/{period}</span>}
        </div>
        <ul className="space-y-3 mb-8">
            {features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                </li>
            ))}
        </ul>
        <button className={`w-full py-3 rounded-lg font-bold transition-colors ${popular
                ? 'bg-trini-red text-white hover:bg-red-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}>
            {cta}
        </button>
    </div>
);

const TestimonialCard: React.FC<{ quote: string; author: string; business: string; rating: number }> = ({ quote, author, business, rating }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex mb-4">
            {[...Array(rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
        </div>
        <p className="text-gray-700 mb-6 italic">"{quote}"</p>
        <div>
            <div className="font-bold text-gray-900">{author}</div>
            <div className="text-sm text-gray-600">{business}</div>
        </div>
    </div>
);

const ContactMethod: React.FC<{ icon: React.ReactNode; label: string; value: string; href: string }> = ({ icon, label, value, href }) => (
    <a href={href} className="flex items-center space-x-4 text-gray-300 hover:text-white transition-colors">
        <div className="bg-gray-800 p-3 rounded-lg">{icon}</div>
        <div>
            <div className="text-sm text-gray-400">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    </a>
);
