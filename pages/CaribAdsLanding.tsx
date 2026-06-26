import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Megaphone, Sparkles, Target, BarChart3, Check, ArrowRight,
    Facebook, Instagram, Zap, TrendingUp, Shield, Clock
} from 'lucide-react';

export const CaribAdsLanding: React.FC = () => {
    const [billingCycle] = useState<'monthly'>('monthly');

    const features = [
        {
            icon: Sparkles,
            title: 'AI-Written Copy',
            desc: 'Our AI writes scroll-stopping ad copy in Caribbean voice — Trini vibes, professional, or urgent. Every campaign gets 3 variations to test.',
            color: 'from-red-500 to-orange-500',
        },
        {
            icon: Target,
            title: 'Caribbean Targeting',
            desc: 'Hyper-local targeting across Trinidad & Tobago, Jamaica, and Barbados. Reach the right island, the right city, the right customer.',
            color: 'from-orange-500 to-yellow-500',
        },
        {
            icon: BarChart3,
            title: 'Monthly Reports',
            desc: 'Clear, honest reports showing reach, clicks, spend, and ROI. No jargon. No vanity metrics. Just what matters to your business.',
            color: 'from-red-600 to-pink-500',
        },
    ];

    const tiers = [
        {
            name: 'Starter',
            price: 'TT$1,500',
            period: '/mo',
            tagline: 'Perfect for small businesses testing the waters',
            features: [
                'Up to TT$3,000 ad spend managed',
                '2 active campaigns',
                'Facebook & Instagram ads',
                'Monthly performance report',
                'AI-written ad copy',
                'Email support',
            ],
            cta: 'Start with Starter',
            popular: false,
            color: 'border-gray-700',
        },
        {
            name: 'Growth',
            price: 'TT$3,500',
            period: '/mo',
            tagline: 'For growing businesses ready to scale',
            features: [
                'Up to TT$8,000 ad spend managed',
                '5 active campaigns',
                'Facebook & Instagram ads',
                'Weekly performance reports',
                'A/B testing on all creatives',
                'AI-written ad copy + image prompts',
                'Priority support',
            ],
            cta: 'Choose Growth',
            popular: true,
            color: 'border-red-500',
        },
        {
            name: 'Premium',
            price: 'TT$7,500',
            period: '/mo',
            tagline: 'Full-service ad management for serious brands',
            features: [
                'Unlimited ad spend managed',
                'Unlimited campaigns',
                'Facebook & Instagram ads',
                'Daily optimization',
                'Dedicated AI ad agent',
                'Custom creative strategy',
                'WhatsApp priority support',
                'Monthly strategy calls',
            ],
            cta: 'Go Premium',
            popular: false,
            color: 'border-gray-700',
        },
    ];

    return (
        <div className="min-h-screen bg-[#0B0D14] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-500 to-orange-500 opacity-95" />
                <div className="absolute inset-0 bg-[#0B0D14]/30" />

                {/* Decorative blurs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-orange-400/30 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-20 w-96 h-96 bg-red-700/40 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                            <Megaphone className="h-4 w-4 text-white" />
                            <span className="text-sm font-semibold text-white">CaribAds by Juvay</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                            Grow Your Caribbean Business<br />with Smart Ads
                        </h1>

                        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            AI-powered Facebook & Instagram advertising, managed for you. No contract. No setup fees.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/auth"
                                className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link
                                to="/ads-portal"
                                className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
                            >
                                View Dashboard
                            </Link>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-white/80 text-sm">
                            <span className="flex items-center gap-2">
                                <Check className="h-4 w-4" /> No contract
                            </span>
                            <span className="flex items-center gap-2">
                                <Check className="h-4 w-4" /> No setup fees
                            </span>
                            <span className="flex items-center gap-2">
                                <Check className="h-4 w-4" /> Cancel anytime
                            </span>
                            <span className="flex items-center gap-2">
                                <Check className="h-4 w-4" /> AI-powered
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platforms */}
            <section className="bg-[#101320] border-y border-[#1E2235] py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-wrap items-center justify-center gap-12 text-[#A9B0C3]">
                        <div className="flex items-center gap-3">
                            <Facebook className="h-8 w-8 text-[#1877F2]" />
                            <span className="font-semibold text-white">Facebook Ads</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Instagram className="h-8 w-8 text-[#E4405F]" />
                            <span className="font-semibold text-white">Instagram Ads</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap className="h-8 w-8 text-orange-500" />
                            <span className="font-semibold text-white">AI Creative Studio</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-8 w-8 text-green-500" />
                            <span className="font-semibold text-white">Live Analytics</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Everything you need to run winning ads
                        </h2>
                        <p className="text-lg text-[#A9B0C3] max-w-2xl mx-auto">
                            We handle the creative, targeting, and optimization. You focus on running your business.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className="bg-[#101320] rounded-2xl p-8 border border-[#1E2235] hover:border-[#2A2F47] transition-all group"
                            >
                                <div className={`bg-gradient-to-br ${feature.color} p-4 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-[#A9B0C3] leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-20 px-6 bg-[#101320]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            How it works
                        </h2>
                        <p className="text-lg text-[#A9B0C3]">Three simple steps to your first campaign</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Tell us about your business', desc: 'Share your business type, what you\'re promoting, and which island you serve.' },
                            { step: '02', title: 'AI creates your ads', desc: 'Our AI writes 3 ad variations with headlines, copy, and image suggestions — Caribbean flavored.' },
                            { step: '03', title: 'We launch & optimize', desc: 'Ads go live on Facebook & Instagram. We monitor performance and optimize daily.' },
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="text-5xl font-black text-red-600/30 mb-4">{item.step}</div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-[#A9B0C3] leading-relaxed">{item.desc}</p>
                                {idx < 2 && (
                                    <ArrowRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-[#A9B0C3]" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Simple, honest pricing
                        </h2>
                        <p className="text-lg text-[#A9B0C3] max-w-2xl mx-auto">
                            Management fees only. Your ad spend goes directly to Facebook & Instagram.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {tiers.map((tier, idx) => (
                            <div
                                key={idx}
                                className={`relative bg-[#101320] rounded-2xl p-8 border-2 ${tier.color} ${tier.popular ? 'md:scale-105 shadow-2xl shadow-red-500/20' : ''}`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                                    <p className="text-sm text-[#A9B0C3]">{tier.tagline}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">{tier.price}</span>
                                        <span className="text-[#A9B0C3]">{tier.period}</span>
                                    </div>
                                    <p className="text-xs text-[#A9B0C3] mt-2">{billingCycle} management fee</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {tier.features.map((feature, fidx) => (
                                        <li key={fidx} className="flex items-start gap-3">
                                            <div className="bg-green-500/10 p-1 rounded-full mt-0.5">
                                                <Check className="h-3.5 w-3.5 text-green-500" />
                                            </div>
                                            <span className="text-sm text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    to="/auth"
                                    className={`block text-center py-3.5 rounded-full font-bold transition-all ${
                                        tier.popular
                                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white hover:shadow-xl hover:shadow-red-500/30'
                                            : 'bg-white/5 text-white border border-[#1E2235] hover:bg-white/10'
                                    }`}
                                >
                                    {tier.cta}
                                </Link>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-[#A9B0C3] mt-10">
                        All plans include Facebook & Instagram ad management. Ad spend is separate and billed directly by Meta.
                    </p>
                </div>
            </section>

            {/* Why CaribAds */}
            <section className="py-20 px-6 bg-[#101320]">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                                Built for the Caribbean, by the Caribbean
                            </h2>
                            <p className="text-lg text-[#A9B0C3] mb-6 leading-relaxed">
                                We know the Caribbean market. We understand the culture, the slang, the buying habits.
                                Our AI doesn't just write generic ad copy — it writes ads that resonate with Trinis,
                                Jamaicans, and Bajans.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-white">Transparent pricing</h4>
                                        <p className="text-sm text-[#A9B0C3]">No hidden fees. You see exactly where every dollar goes.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="h-6 w-6 text-orange-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-white">Fast turnaround</h4>
                                        <p className="text-sm text-[#A9B0C3]">From signup to live ads in 48 hours.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-white">Results-focused</h4>
                                        <p className="text-sm text-[#A9B0C3]">We optimize for your business goals, not vanity metrics.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-600/10 to-orange-500/10 rounded-3xl p-8 border border-red-500/20">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-4xl font-black text-white">3x</p>
                                    <p className="text-sm text-[#A9B0C3]">Avg. CTR vs industry standard</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">48hr</p>
                                    <p className="text-sm text-[#A9B0C3]">Setup to live campaigns</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">100+</p>
                                    <p className="text-sm text-[#A9B0C3]">Businesses served</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white">TT$0</p>
                                    <p className="text-sm text-[#A9B0C3]">Setup fees, ever</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-red-600 to-orange-500 rounded-3xl p-12">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                            Ready to grow your business?
                        </h2>
                        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                            Join 100+ Caribbean businesses using CaribAds to reach more customers on Facebook & Instagram.
                        </p>
                        <Link
                            to="/auth"
                            className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
                        >
                            Get Started Today
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Honest availability note */}
            <section className="py-8 px-6 bg-[#101320] border-t border-[#1E2235]">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-2">
                        <span className="text-sm text-yellow-400 font-semibold">
                            🇹🇹 Currently serving Trinidad & Tobago. Jamaica and Barbados coming soon.
                        </span>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0B0D14] border-t border-[#1E2235] py-8 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-sm text-[#A9B0C3]">
                        CaribAds by Juvay — A product of R&R Digital Solutions. 🇹🇹 For We, By We.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CaribAdsLanding;
