/**
 * DigitalServicesHub.tsx
 * TriniBuild Digital Services — Game Pass, Streaming, Gift Cards, Anime
 * 
 * Features:
 * - Browse digital subscriptions and codes
 * - PayPal payment (live) + Bank deposit (coming soon)
 * - Automated code delivery via WhatsApp/Email
 * - Waitlist signup for bank payment
 * - Anti-fraud verification system
 * - Anime/streaming section
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gamepad2, Tv, Music, Gift, CreditCard, Building2,
    Shield, Clock, Zap, Check, Star, ArrowRight,
    ChevronRight, Lock, Mail, Phone, AlertCircle,
    Sparkles, Crown, X, MessageCircle, Bell
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ─── Product Catalog ──────────────────────────────────────────────────────────

interface DigitalProduct {
    id: string;
    name: string;
    category: 'gaming' | 'streaming' | 'music' | 'gift_cards' | 'anime';
    brand: string;
    description: string;
    variants: ProductVariant[];
    image: string;
    gradient: string;
    popular: boolean;
    comingSoon?: boolean;
}

interface ProductVariant {
    id: string;
    name: string;
    priceTTD: number;
    priceUSD: number;
    duration?: string;
    savings?: string;
}

const DIGITAL_PRODUCTS: DigitalProduct[] = [
    // ─── Gaming ────────────────────────────────────────────────────────
    {
        id: 'ps-plus',
        name: 'PlayStation Plus',
        category: 'gaming',
        brand: 'PlayStation',
        description: 'Play online, get free monthly games, and access the game catalog.',
        image: '🎮',
        gradient: 'from-blue-600 to-blue-800',
        popular: true,
        variants: [
            { id: 'ps-essential-1', name: 'Essential — 1 Month', priceTTD: 89, priceUSD: 9.99, duration: '1 month' },
            { id: 'ps-essential-3', name: 'Essential — 3 Months', priceTTD: 239, priceUSD: 24.99, duration: '3 months', savings: 'Save TT$28' },
            { id: 'ps-essential-12', name: 'Essential — 12 Months', priceTTD: 499, priceUSD: 59.99, duration: '12 months', savings: 'Save TT$169' },
            { id: 'ps-extra-1', name: 'Extra — 1 Month', priceTTD: 149, priceUSD: 14.99, duration: '1 month' },
            { id: 'ps-premium-1', name: 'Premium — 1 Month', priceTTD: 189, priceUSD: 17.99, duration: '1 month' },
        ]
    },
    {
        id: 'xbox-gamepass',
        name: 'Xbox Game Pass',
        category: 'gaming',
        brand: 'Xbox',
        description: 'Hundreds of games, day one releases, EA Play included with Ultimate.',
        image: '🟢',
        gradient: 'from-green-600 to-green-800',
        popular: true,
        variants: [
            { id: 'xgp-core-1', name: 'Core — 1 Month', priceTTD: 79, priceUSD: 9.99, duration: '1 month' },
            { id: 'xgp-standard-1', name: 'Standard — 1 Month', priceTTD: 119, priceUSD: 14.99, duration: '1 month' },
            { id: 'xgp-ultimate-1', name: 'Ultimate — 1 Month', priceTTD: 149, priceUSD: 19.99, duration: '1 month' },
            { id: 'xgp-ultimate-3', name: 'Ultimate — 3 Months', priceTTD: 399, priceUSD: 49.99, duration: '3 months', savings: 'Save TT$48' },
        ]
    },
    {
        id: 'steam-wallet',
        name: 'Steam Wallet',
        category: 'gaming',
        brand: 'Steam',
        description: 'Add funds to your Steam wallet. Buy any game on the store.',
        image: '🎯',
        gradient: 'from-gray-700 to-gray-900',
        popular: true,
        variants: [
            { id: 'steam-5', name: '$5 USD Credit', priceTTD: 49, priceUSD: 5 },
            { id: 'steam-10', name: '$10 USD Credit', priceTTD: 89, priceUSD: 10 },
            { id: 'steam-20', name: '$20 USD Credit', priceTTD: 169, priceUSD: 20 },
            { id: 'steam-50', name: '$50 USD Credit', priceTTD: 399, priceUSD: 50, savings: 'Best value' },
        ]
    },
    {
        id: 'nintendo-online',
        name: 'Nintendo Switch Online',
        category: 'gaming',
        brand: 'Nintendo',
        description: 'Play online, access classic games, cloud saves.',
        image: '🔴',
        gradient: 'from-red-500 to-red-700',
        popular: false,
        variants: [
            { id: 'nso-1', name: 'Individual — 1 Month', priceTTD: 39, priceUSD: 3.99, duration: '1 month' },
            { id: 'nso-12', name: 'Individual — 12 Months', priceTTD: 189, priceUSD: 19.99, duration: '12 months', savings: 'Save TT$279' },
            { id: 'nso-exp-12', name: 'Expansion Pack — 12 Months', priceTTD: 399, priceUSD: 49.99, duration: '12 months' },
        ]
    },
    // ─── Streaming ─────────────────────────────────────────────────────
    {
        id: 'netflix',
        name: 'Netflix',
        category: 'streaming',
        brand: 'Netflix',
        description: 'Movies, TV shows, anime. The world\'s biggest streaming library.',
        image: '🎬',
        gradient: 'from-red-600 to-red-900',
        popular: true,
        variants: [
            { id: 'netflix-std', name: 'Standard — 1 Month Gift Card', priceTTD: 139, priceUSD: 15.49 },
            { id: 'netflix-prem', name: 'Premium — 1 Month Gift Card', priceTTD: 199, priceUSD: 22.99 },
        ]
    },
    {
        id: 'disney-plus',
        name: 'Disney+',
        category: 'streaming',
        brand: 'Disney',
        description: 'Marvel, Star Wars, Pixar, Disney classics.',
        image: '✨',
        gradient: 'from-blue-700 to-indigo-900',
        popular: false,
        variants: [
            { id: 'disney-1', name: 'Standard — 1 Month', priceTTD: 89, priceUSD: 9.99 },
            { id: 'disney-12', name: 'Standard — 12 Months', priceTTD: 799, priceUSD: 99.99, savings: 'Save TT$269' },
        ]
    },
    // ─── Anime ─────────────────────────────────────────────────────────
    {
        id: 'crunchyroll',
        name: 'Crunchyroll',
        category: 'anime',
        brand: 'Crunchyroll',
        description: 'The #1 anime streaming service. One Piece, Naruto, Dragon Ball, and 1,000+ titles.',
        image: '🍥',
        gradient: 'from-orange-500 to-orange-700',
        popular: true,
        variants: [
            { id: 'cr-fan-1', name: 'Fan — 1 Month', priceTTD: 69, priceUSD: 7.99, duration: '1 month' },
            { id: 'cr-mega-1', name: 'Mega Fan — 1 Month', priceTTD: 99, priceUSD: 11.99, duration: '1 month' },
            { id: 'cr-ultimate-1', name: 'Ultimate Fan — 1 Month', priceTTD: 139, priceUSD: 16.99, duration: '1 month' },
        ]
    },
    {
        id: 'funimation',
        name: 'Anime Gift Cards',
        category: 'anime',
        brand: 'Various',
        description: 'Gift cards for anime merch, manga, and collectibles.',
        image: '⚡',
        gradient: 'from-purple-600 to-purple-900',
        popular: false,
        comingSoon: true,
        variants: [
            { id: 'anime-25', name: '$25 Anime Gift Card', priceTTD: 199, priceUSD: 25 },
            { id: 'anime-50', name: '$50 Anime Gift Card', priceTTD: 389, priceUSD: 50 },
        ]
    },
    // ─── Music ─────────────────────────────────────────────────────────
    {
        id: 'spotify',
        name: 'Spotify Premium',
        category: 'music',
        brand: 'Spotify',
        description: 'Ad-free music, offline downloads, high quality audio.',
        image: '🎵',
        gradient: 'from-green-500 to-green-700',
        popular: true,
        variants: [
            { id: 'spotify-1', name: 'Individual — 1 Month', priceTTD: 89, priceUSD: 10.99, duration: '1 month' },
            { id: 'spotify-3', name: 'Individual — 3 Months', priceTTD: 239, priceUSD: 29.99, duration: '3 months', savings: 'Save TT$28' },
        ]
    },
    // ─── Gift Cards ────────────────────────────────────────────────────
    {
        id: 'google-play',
        name: 'Google Play',
        category: 'gift_cards',
        brand: 'Google',
        description: 'Apps, games, movies, books from the Play Store.',
        image: '▶️',
        gradient: 'from-teal-500 to-teal-700',
        popular: false,
        variants: [
            { id: 'gplay-10', name: '$10 Credit', priceTTD: 89, priceUSD: 10 },
            { id: 'gplay-25', name: '$25 Credit', priceTTD: 199, priceUSD: 25 },
            { id: 'gplay-50', name: '$50 Credit', priceTTD: 389, priceUSD: 50 },
        ]
    },
    {
        id: 'apple-itunes',
        name: 'Apple / iTunes',
        category: 'gift_cards',
        brand: 'Apple',
        description: 'App Store, Apple Music, iCloud+, Apple TV+.',
        image: '🍎',
        gradient: 'from-gray-800 to-black',
        popular: false,
        variants: [
            { id: 'apple-10', name: '$10 Credit', priceTTD: 89, priceUSD: 10 },
            { id: 'apple-25', name: '$25 Credit', priceTTD: 199, priceUSD: 25 },
            { id: 'apple-50', name: '$50 Credit', priceTTD: 389, priceUSD: 50 },
            { id: 'apple-100', name: '$100 Credit', priceTTD: 749, priceUSD: 100, savings: 'Best value' },
        ]
    },
];

const CATEGORIES = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
    { id: 'streaming', label: 'Streaming', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Star },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'gift_cards', label: 'Gift Cards', icon: Gift },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const DigitalServicesHub: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'bank'>('paypal');
    const [step, setStep] = useState<'browse' | 'checkout' | 'waitlist'>('browse');
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistPhone, setWaitlistPhone] = useState('');
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
    const [purchasing, setPurchasing] = useState(false);

    const filteredProducts = activeCategory === 'all'
        ? DIGITAL_PRODUCTS
        : DIGITAL_PRODUCTS.filter(p => p.category === activeCategory);

    const handleBuy = (product: DigitalProduct, variant: ProductVariant) => {
        setSelectedProduct(product);
        setSelectedVariant(variant);
        setStep('checkout');
    };

    const handlePayPalCheckout = async () => {
        if (!selectedProduct || !selectedVariant) return;
        setPurchasing(true);

        try {
            // Create order in database
            const { data: { user } } = await supabase.auth.getUser();
            const { data: order } = await supabase.from('digital_orders').insert({
                user_id: user?.id,
                product_id: selectedProduct.id,
                variant_id: selectedVariant.id,
                product_name: `${selectedProduct.name} — ${selectedVariant.name}`,
                amount_ttd: selectedVariant.priceTTD,
                amount_usd: selectedVariant.priceUSD,
                payment_method: 'paypal',
                status: 'pending',
                created_at: new Date().toISOString()
            }).select().single();

            // Redirect to PayPal (integration point)
            // In production: use PayPal SDK to create payment
            window.open(`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=pay@trinibuild.com&item_name=${encodeURIComponent(selectedProduct.name + ' - ' + selectedVariant.name)}&amount=${selectedVariant.priceUSD}&currency_code=USD&return=${window.location.origin}/digital-services?status=success&cancel_return=${window.location.origin}/digital-services?status=cancel`, '_blank');
        } catch (error) {
            console.error('Checkout failed:', error);
        } finally {
            setPurchasing(false);
        }
    };

    const handleWaitlistSignup = async () => {
        if (!waitlistEmail) return;

        try {
            await supabase.from('digital_waitlist').insert({
                email: waitlistEmail,
                phone: waitlistPhone,
                product_interest: selectedProduct?.name || 'General',
                created_at: new Date().toISOString()
            });
            setWaitlistSubmitted(true);
        } catch (error) {
            console.error('Waitlist signup failed:', error);
        }
    };

    return (
        <>
            <Helmet>
                <title>Digital Services — Game Pass, Streaming, Gift Cards | TriniBuild</title>
                <meta name="description" content="Buy PlayStation Plus, Xbox Game Pass, Netflix, Spotify, and more. Pay with PayPal or at any Trinidad bank. No credit card needed." />
            </Helmet>

            <div className="min-h-screen bg-gray-950 text-white">

                {/* Hero */}
                <div className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-gray-950 to-gray-950" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-[120px] rounded-full" />

                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
                                <Gamepad2 size={16} className="text-purple-400" />
                                <span className="text-sm font-bold text-purple-200">TriniBuild Digital</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                                Game Pass.<br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                                    No Credit Card.
                                </span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                                Buy PlayStation Plus, Xbox Game Pass, Netflix, Crunchyroll, Spotify, and more.
                                Pay with PayPal now or at any Trinidad bank soon.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                                <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30">
                                    <Check size={16} className="text-green-400" />
                                    <span className="text-sm text-green-300 font-bold">Instant delivery</span>
                                </div>
                                <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/30">
                                    <Shield size={16} className="text-blue-400" />
                                    <span className="text-sm text-blue-300 font-bold">100% legit codes</span>
                                </div>
                                <div className="flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/30">
                                    <Zap size={16} className="text-purple-400" />
                                    <span className="text-sm text-purple-300 font-bold">PayPal accepted</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="sticky top-16 z-40 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {CATEGORIES.map(cat => {
                                const Icon = cat.icon;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                            activeCategory === cat.id
                                                ? 'bg-white text-gray-900'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'browse' && (
                        <motion.div
                            key="browse"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Product Grid */}
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.map(product => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
                                        >
                                            {/* Product Header */}
                                            <div className={`bg-gradient-to-br ${product.gradient} p-6 relative overflow-hidden`}>
                                                {product.popular && (
                                                    <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full">
                                                        POPULAR
                                                    </span>
                                                )}
                                                {product.comingSoon && (
                                                    <span className="absolute top-4 right-4 bg-white/20 text-white text-xs font-black px-2 py-1 rounded-full">
                                                        COMING SOON
                                                    </span>
                                                )}
                                                <div className="text-5xl mb-3">{product.image}</div>
                                                <h3 className="text-xl font-black text-white">{product.name}</h3>
                                                <p className="text-sm text-white/70 mt-1">{product.brand}</p>
                                            </div>

                                            {/* Product Body */}
                                            <div className="p-6">
                                                <p className="text-sm text-gray-400 mb-4">{product.description}</p>

                                                {/* Variants */}
                                                <div className="space-y-2">
                                                    {product.variants.slice(0, 3).map(variant => (
                                                        <button
                                                            key={variant.id}
                                                            onClick={() => !product.comingSoon && handleBuy(product, variant)}
                                                            disabled={product.comingSoon}
                                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="text-left">
                                                                <p className="text-sm font-bold text-white">{variant.name}</p>
                                                                {variant.savings && (
                                                                    <p className="text-xs text-green-400 font-bold">{variant.savings}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-white">TT${variant.priceTTD}</p>
                                                                <p className="text-xs text-gray-500">${variant.priceUSD} USD</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {product.variants.length > 3 && (
                                                        <button
                                                            onClick={() => { setSelectedProduct(product); setStep('checkout'); setSelectedVariant(product.variants[0]); }}
                                                            className="w-full text-center text-sm text-purple-400 font-bold py-2 hover:text-purple-300"
                                                        >
                                                            See all {product.variants.length} options →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Pros & Cons Section */}
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                                <h2 className="text-3xl font-black text-center mb-12">
                                    Why Buy Through <span className="text-purple-400">TriniBuild Digital</span>?
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                    {/* Pros */}
                                    <div className="bg-green-500/5 rounded-2xl border border-green-500/20 p-8">
                                        <h3 className="text-lg font-black text-green-400 mb-6 flex items-center gap-2">
                                            <Check size={20} /> The Good
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                'No credit card needed — pay at any bank',
                                                'Instant digital delivery via WhatsApp',
                                                '100% legitimate codes from authorized suppliers',
                                                'Trinidad dollar pricing — no conversion confusion',
                                                'Support a local T&T platform',
                                                'Earn TriniBuild loyalty points on every purchase',
                                                'WhatsApp customer support',
                                                'Anime subscriptions most platforms don\'t offer locally',
                                            ].map((text, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-gray-300">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Cons / Honesty */}
                                    <div className="bg-amber-500/5 rounded-2xl border border-amber-500/20 p-8">
                                        <h3 className="text-lg font-black text-amber-400 mb-6 flex items-center gap-2">
                                            <AlertCircle size={20} /> Things to Know
                                        </h3>
                                        <div className="space-y-4">
                                            {[
                                                'Prices include a small service fee (we buy wholesale)',
                                                'Bank payment requires manual verification (1-4 hours)',
                                                'Codes are region-specific — US region codes provided',
                                                'Some subscriptions auto-renew on the platform, not through us',
                                                'Refunds only for non-working codes (verified within 24h)',
                                                'Stock availability depends on our suppliers',
                                                'First purchase requires account verification for fraud prevention',
                                            ].map((text, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-gray-300">{text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Payment Waitlist */}
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-3xl border border-purple-500/20 p-8 md:p-12 text-center">
                                    <Building2 size={48} className="text-purple-400 mx-auto mb-6" />
                                    <h2 className="text-3xl md:text-4xl font-black mb-4">
                                        Bank Payment Coming Soon
                                    </h2>
                                    <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
                                        Soon you'll be able to walk into Republic Bank, Scotiabank, or First Citizens 
                                        and pay for your game pass, Netflix, or Spotify. No credit card. No PayPal.
                                        Just walk in, pay, and get your code.
                                    </p>
                                    {!waitlistSubmitted ? (
                                        <div className="max-w-md mx-auto space-y-3">
                                            <input
                                                type="email"
                                                placeholder="Your email"
                                                value={waitlistEmail}
                                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="WhatsApp number (868-XXX-XXXX)"
                                                value={waitlistPhone}
                                                onChange={(e) => setWaitlistPhone(e.target.value)}
                                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                                            />
                                            <button
                                                onClick={handleWaitlistSignup}
                                                disabled={!waitlistEmail}
                                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-black text-lg disabled:opacity-50 transition-all hover:from-purple-500 hover:to-blue-500"
                                            >
                                                <Bell size={18} className="inline mr-2" />
                                                Notify Me When Bank Payment Goes Live
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 max-w-md mx-auto">
                                            <Check size={32} className="text-green-400 mx-auto mb-3" />
                                            <p className="text-green-300 font-bold">You're on the list!</p>
                                            <p className="text-green-400/70 text-sm mt-1">We'll WhatsApp you when bank payment goes live.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Checkout */}
                    {step === 'checkout' && selectedProduct && (
                        <motion.div
                            key="checkout"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto px-4 py-12"
                        >
                            <button
                                onClick={() => { setStep('browse'); setSelectedProduct(null); setSelectedVariant(null); }}
                                className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1"
                            >
                                ← Back to catalog
                            </button>

                            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                {/* Product Header */}
                                <div className={`bg-gradient-to-br ${selectedProduct.gradient} p-6`}>
                                    <div className="text-4xl mb-2">{selectedProduct.image}</div>
                                    <h2 className="text-2xl font-black">{selectedProduct.name}</h2>
                                    <p className="text-white/70">{selectedProduct.description}</p>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Variant Selection */}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Choose your plan</p>
                                        <div className="space-y-2">
                                            {selectedProduct.variants.map(variant => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                        selectedVariant?.id === variant.id
                                                            ? 'border-purple-500 bg-purple-500/10'
                                                            : 'border-white/10 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="text-left">
                                                        <p className="font-bold text-white">{variant.name}</p>
                                                        {variant.duration && <p className="text-xs text-gray-400">{variant.duration}</p>}
                                                        {variant.savings && <p className="text-xs text-green-400 font-bold">{variant.savings}</p>}
                                                    </div>
                                                    <p className="text-lg font-black text-white">TT${variant.priceTTD}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">Payment method</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentMethod('paypal')}
                                                className={`p-4 rounded-xl border-2 transition-all ${
                                                    paymentMethod === 'paypal'
                                                        ? 'border-blue-500 bg-blue-500/10'
                                                        : 'border-white/10'
                                                }`}
                                            >
                                                <CreditCard size={20} className="text-blue-400 mb-2" />
                                                <p className="font-bold text-white text-sm">PayPal</p>
                                                <p className="text-xs text-green-400">Available now</p>
                                            </button>
                                            <button
                                                onClick={() => { setPaymentMethod('bank'); setStep('waitlist'); }}
                                                className="p-4 rounded-xl border-2 border-white/10 opacity-60"
                                            >
                                                <Building2 size={20} className="text-gray-400 mb-2" />
                                                <p className="font-bold text-gray-400 text-sm">Bank Deposit</p>
                                                <p className="text-xs text-amber-400">Coming soon</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Checkout Button */}
                                    {selectedVariant && (
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handlePayPalCheckout}
                                            disabled={purchasing}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-black text-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:from-blue-500 hover:to-purple-500"
                                        >
                                            {purchasing ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>Pay TT${selectedVariant.priceTTD} with PayPal <ArrowRight size={18} /></>
                                            )}
                                        </motion.button>
                                    )}

                                    {/* Trust Signals */}
                                    <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-4 border-t border-white/5">
                                        <span className="flex items-center gap-1"><Shield size={12} /> Secure</span>
                                        <span className="flex items-center gap-1"><Zap size={12} /> Instant delivery</span>
                                        <span className="flex items-center gap-1"><Check size={12} /> Legit codes</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Waitlist for Bank Payment */}
                    {step === 'waitlist' && (
                        <motion.div
                            key="waitlist"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-lg mx-auto px-4 py-16 text-center"
                        >
                            <Building2 size={48} className="text-purple-400 mx-auto mb-6" />
                            <h2 className="text-2xl font-black mb-4">Bank Payment Coming Soon!</h2>
                            <p className="text-gray-400 mb-8">
                                We're setting up accounts at Republic Bank, Scotiabank, and First Citizens.
                                Sign up to be first to know when it's live.
                            </p>
                            {!waitlistSubmitted ? (
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="Your email"
                                        value={waitlistEmail}
                                        onChange={(e) => setWaitlistEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-400"
                                    />
                                    <button
                                        onClick={handleWaitlistSignup}
                                        className="w-full py-3 bg-purple-600 rounded-xl font-bold"
                                    >
                                        Join Waitlist
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                                    <Check size={32} className="text-green-400 mx-auto mb-3" />
                                    <p className="text-green-300 font-bold">You're on the list!</p>
                                </div>
                            )}
                            <button
                                onClick={() => setStep('browse')}
                                className="mt-6 text-sm text-gray-500 hover:text-white"
                            >
                                ← Back to catalog
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* How It Works */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
                    <h2 className="text-2xl font-black text-center mb-12">How It Works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Choose', desc: 'Pick your game pass, streaming service, or gift card', icon: Gamepad2 },
                            { step: '2', title: 'Pay', desc: 'PayPal now, or bank deposit soon', icon: CreditCard },
                            { step: '3', title: 'Verified', desc: 'AI verifies payment in minutes, fraud-checked', icon: Shield },
                            { step: '4', title: 'Play', desc: 'Get your code instantly via WhatsApp or email', icon: Zap },
                        ].map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <div key={i} className="text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                        <Icon size={24} className="text-purple-400" />
                                    </div>
                                    <div className="text-xs font-black text-purple-400 mb-1">Step {item.step}</div>
                                    <h3 className="text-lg font-black text-white mb-1">{item.title}</h3>
                                    <p className="text-sm text-gray-400">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5 text-center">
                    <p className="text-xs text-gray-600">
                        TriniBuild Digital is a digital goods reseller. All codes are sourced from authorized wholesale distributors.
                        PlayStation, Xbox, Nintendo, Steam, Netflix, Spotify, and Crunchyroll are trademarks of their respective owners.
                        TriniBuild is not affiliated with or endorsed by any of these companies.
                    </p>
                </div>
            </div>
        </>
    );
};
