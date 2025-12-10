import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    UtensilsCrossed, ChefHat, Cake, Coffee, Pizza, IceCream, Salad, Wine,
    Phone, Mail, MessageCircle, MapPin, Star, Clock, Truck, Shield, Award,
    Check, ArrowRight, Zap, DollarSign, Users, TrendingUp, Package, Calendar
} from 'lucide-react';

export const FoodServicesLanding: React.FC = () => {
    const [formStep, setFormStep] = useState(0);
    const [formData, setFormData] = useState({
        businessType: '',
        hasLocation: '',
        monthlyOrders: '',
        menuSize: '',
        needsDelivery: '',
        fullName: '',
        email: '',
        phone: '',
        whatsapp: ''
    });

    const foodBusinessTypes = [
        { id: 'restaurant', name: 'Restaurant', icon: '🍽️', description: 'Dine-in, takeout, delivery', popular: true },
        { id: 'roti-shop', name: 'Roti Shop', icon: '🫓', description: 'Doubles, roti, buss-up-shut', trini: true },
        { id: 'bakery', name: 'Bakery', icon: '🥐', description: 'Bread, pastries, cakes' },
        { id: 'catering', name: 'Catering', icon: '🎉', description: 'Events, parties, weddings' },
        { id: 'food-truck', name: 'Food Truck', icon: '🚚', description: 'Mobile food service' },
        { id: 'bar', name: 'Bar/Rum Shop', icon: '🍺', description: 'Drinks, limes, food', trini: true },
        { id: 'snackette', name: 'Snackette', icon: '🌭', description: 'Quick bites, fast food', trini: true },
        { id: 'juice-bar', name: 'Juice Bar', icon: '🥤', description: 'Fresh juices, smoothies' },
        { id: 'seafood', name: 'Seafood', icon: '🦞', description: 'Fish, crab, shrimp', trini: true },
        { id: 'sweet-treats', name: 'Sweet Treats', icon: '🍰', description: 'Desserts, ice cream, snow cone' }
    ];

    return (
        <>
            <Helmet>
                <title>Online Ordering for Trinidad & Tobago Food Businesses | TriniBuild</title>
                <meta name="description" content="Accept online orders for your restaurant, roti shop, bakery, or food business in Trinidad & Tobago. COD, WiPay, free delivery with TriniBuild Go." />
                <meta name="keywords" content="online food ordering trinidad, restaurant online ordering, roti shop online, food delivery trinidad, doubles online, trinidad food business" />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        "name": "TriniBuild Food Services Platform",
                        "description": "Online ordering platform for Trinidad & Tobago food businesses",
                        "provider": {
                            "@type": "Organization",
                            "name": "TriniBuild"
                        },
                        "areaServed": {
                            "@type": "Country",
                            "name": "Trinidad and Tobago"
                        }
                    })}
                </script>
            </Helmet>

            <div className="min-h-screen bg-white">
                {/* Hero Section - Trinidad Vibes */}
                <section className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                    }}></div>

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                        <div className="text-center">
                            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-6">
                                <UtensilsCrossed className="h-4 w-4 mr-2" />
                                For Trinidad & Tobago Food Businesses
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                                Take Your Food Business Online
                                <br />
                                <span className="text-yellow-300">Accept Orders 24/7</span>
                            </h1>
                            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
                                Perfect for roti shops, restaurants, bakeries, and all Trinidad food businesses.
                                Accept COD, WiPay, get free delivery drivers. Set up in 5 minutes!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                                <button
                                    onClick={() => document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white text-orange-600 px-8 py-4 rounded-full font-extrabold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105 flex items-center justify-center"
                                >
                                    Start Taking Orders Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </button>
                                <button className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                                    See Demo Menu
                                </button>
                            </div>

                            {/* Trinidad Food Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                    <div className="text-3xl font-bold mb-1">200+</div>
                                    <div className="text-sm text-white/80">Food Businesses</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                    <div className="text-3xl font-bold mb-1">5K+</div>
                                    <div className="text-sm text-white/80">Daily Orders</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                    <div className="text-3xl font-bold mb-1">TT$500K+</div>
                                    <div className="text-sm text-white/80">Monthly Sales</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                    <div className="text-3xl font-bold mb-1">4.9★</div>
                                    <div className="text-sm text-white/80">Avg Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trinidad Food Business Types */}
                <section id="quiz" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                What Kind of Food Business You Running?
                            </h2>
                            <p className="text-xl text-gray-600">
                                We build for ALL Trinidad food businesses - from doubles vendors to fine dining
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {foodBusinessTypes.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData({ ...formData, businessType: type.id })}
                                    className={`relative p-6 border-2 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all text-center ${formData.businessType === type.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                                        } ${type.trini ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}
                                >
                                    {type.trini && (
                                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                                            🇹🇹 TRINI
                                        </div>
                                    )}
                                    {type.popular && (
                                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                            POPULAR
                                        </div>
                                    )}
                                    <div className="text-5xl mb-3">{type.icon}</div>
                                    <div className="font-bold text-gray-900 mb-1">{type.name}</div>
                                    <div className="text-xs text-gray-600">{type.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Trinidad-Specific Features */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Built for Trinidad Food Culture
                            </h2>
                            <p className="text-xl text-gray-600">
                                We understand how Trinis like to order food - we built it just for allyuh!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon="💵"
                                title="Cash on Delivery"
                                description="Most Trinis prefer COD - we make it easy! Customer pays when food arrives. No risk for you or them."
                                highlight={true}
                            />
                            <FeatureCard
                                icon="🚗"
                                title="Free Delivery Drivers"
                                description="Connect to TriniBuild Go drivers across Trinidad & Tobago. Real-time tracking from kitchen to customer."
                            />
                            <FeatureCard
                                icon="💬"
                                title="WhatsApp Orders"
                                description="Customers can order via WhatsApp too! Auto-notifications keep everyone updated."
                            />
                            <FeatureCard
                                icon="📱"
                                title="Mobile-First Menu"
                                description="Beautiful menu that works perfect on phones. Most orders come from mobile in Trinidad!"
                            />
                            <FeatureCard
                                icon="🎉"
                                title="Carnival Specials"
                                description="Set up special menus for Carnival, Diwali, Christmas, Eid - all Trinidad celebrations!"
                            />
                            <FeatureCard
                                icon="⏰"
                                title="Flexible Hours"
                                description="Set different hours for different days. Lunch specials, dinner menu, late night - all customizable."
                            />
                        </div>
                    </div>
                </section>

                {/* Success Stories - Trinidad Food Businesses */}
                <section className="py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Real Trinidad Food Businesses Using TriniBuild
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <TestimonialCard
                                quote="We selling more doubles than ever! People ordering from work, home, everywhere. TriniBuild change the game for we."
                                author="Uncle Ravi"
                                business="Ravi's Doubles, Curepe"
                                increase="+150% orders"
                                rating={5}
                            />
                            <TestimonialCard
                                quote="The COD option is perfect for Trinidad. Customers trust it and we getting paid. Plus the delivery drivers always on time!"
                                author="Michelle Chen"
                                business="Golden Dragon Restaurant, San Fernando"
                                increase="+TT$20K/month"
                                rating={5}
                            />
                            <TestimonialCard
                                quote="I set up my bakery online in 10 minutes! Now people ordering cakes and pastries 24/7. Best decision I ever make."
                                author="Sarah Mohammed"
                                business="Sweet Treats Bakery, Port of Spain"
                                increase="+200% revenue"
                                rating={5}
                            />
                        </div>
                    </div>
                </section>

                {/* Pricing for Food Businesses */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                                Simple Pricing for Food Businesses
                            </h2>
                            <p className="text-xl text-gray-600">
                                No hidden fees. No surprises. Just honest pricing for Trinidad businesses.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            <PricingCard
                                name="Small Shop"
                                price="49"
                                period="month"
                                description="Perfect for roti shops, snackettes, small restaurants"
                                features={[
                                    'Up to 50 menu items',
                                    'Cash on Delivery',
                                    'WhatsApp notifications',
                                    'Basic menu builder',
                                    'Phone support'
                                ]}
                            />
                            <PricingCard
                                name="Restaurant"
                                price="99"
                                period="month"
                                popular={true}
                                description="For restaurants, bakeries, catering businesses"
                                features={[
                                    'Unlimited menu items',
                                    'All payment methods',
                                    'TriniBuild Go delivery',
                                    'Advanced menu builder',
                                    'Promo codes & specials',
                                    'Priority support'
                                ]}
                            />
                            <PricingCard
                                name="Chain/Multiple"
                                price="Custom"
                                period=""
                                description="Multiple locations, franchises, large operations"
                                features={[
                                    'Everything in Restaurant',
                                    'Multiple locations',
                                    'Staff accounts',
                                    'Custom integrations',
                                    'Dedicated support',
                                    'Volume discounts'
                                ]}
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Section - Trinidad Style */}
                <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                            Ready to Start Taking Online Orders?
                        </h2>
                        <p className="text-xl mb-8 text-white/90">
                            Join hundreds of Trinidad food businesses already making money online!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <button className="bg-white text-orange-600 px-12 py-5 rounded-full font-extrabold text-xl hover:bg-gray-100 transition-all shadow-2xl hover:scale-105">
                                Get Started Free
                            </button>
                            <a
                                href="https://wa.me/18685552845"
                                className="bg-green-500 text-white px-12 py-5 rounded-full font-extrabold text-xl hover:bg-green-600 transition-all shadow-2xl hover:scale-105 flex items-center justify-center"
                            >
                                <MessageCircle className="mr-2 h-6 w-6" />
                                WhatsApp We
                            </a>
                        </div>
                        <p className="text-sm text-white/80">
                            Call we: +1 (868) 555-FOOD • Email: food@trinibuild.com
                        </p>
                    </div>
                </section>
            </div>
        </>
    );
};

// Helper Components
const FeatureCard: React.FC<{ icon: string; title: string; description: string; highlight?: boolean }> = ({ icon, title, description, highlight }) => (
    <div className={`p-6 rounded-xl ${highlight ? 'bg-gradient-to-br from-orange-100 to-yellow-100 border-2 border-orange-300' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-700">{description}</p>
    </div>
);

const TestimonialCard: React.FC<{ quote: string; author: string; business: string; increase: string; rating: number }> = ({ quote, author, business, increase, rating }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex mb-4">
            {[...Array(rating)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
        </div>
        <p className="text-gray-700 mb-6 italic">"{quote}"</p>
        <div className="border-t pt-4">
            <div className="font-bold text-gray-900">{author}</div>
            <div className="text-sm text-gray-600">{business}</div>
            <div className="mt-2 inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                {increase}
            </div>
        </div>
    </div>
);

const PricingCard: React.FC<{ name: string; price: string; period: string; description: string; features: string[]; popular?: boolean }> = ({ name, price, period, description, features, popular }) => (
    <div className={`bg-white rounded-2xl shadow-xl border-2 ${popular ? 'border-orange-500 ring-4 ring-orange-200' : 'border-gray-200'} p-8 relative`}>
        {popular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</span>
            </div>
        )}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
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
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}>
            Start Free Trial
        </button>
    </div>
);
