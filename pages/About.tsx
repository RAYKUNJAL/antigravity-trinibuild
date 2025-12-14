import React from 'react';
import { Building2, Users, Target, Award, Heart, TrendingUp } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <section className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        About TriniBuild
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                        Trinidad & Tobago's Premier Digital Business Platform
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-6">
                            <Target className="h-12 w-12 text-blue-600" />
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                        </div>
                        <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                            TriniBuild is dedicated to empowering Trinidad & Tobago's businesses and entrepreneurs
                            with cutting-edge digital tools. We provide a comprehensive platform that enables anyone
                            to build, grow, and scale their business online—from small vendors to established enterprises.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                        Our Core Values
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Value 1 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
                            <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Community First</h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                We're built by Trinis, for Trinis. Our platform is designed to understand and serve
                                the unique needs of Trinidad & Tobago's business community.
                            </p>
                        </div>

                        {/* Value 2 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
                            <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Innovation</h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                We leverage the latest technology—AI, automation, and smart tools—to give local
                                businesses a competitive edge in the digital marketplace.
                            </p>
                        </div>

                        {/* Value 3 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 hover:shadow-2xl transition-shadow">
                            <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Accessibility</h3>
                            <p className="text-gray-700 dark:text-gray-300">
                                Everyone deserves the tools to succeed online. We make powerful business technology
                                accessible and affordable for all.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* What We Offer */}
            <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                        What We Offer
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Offering 1 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                            <Building2 className="h-12 w-12 text-blue-600 mb-4" />
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                                Complete Business Platform
                            </h3>
                            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Free online store builder with AI assistance</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Classifieds marketplace for buying & selling</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Jobs board connecting employers and talent</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Real estate listings and property search</span>
                                </li>
                            </ul>
                        </div>

                        {/* Offering 2 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                            <Award className="h-12 w-12 text-green-600 mb-4" />
                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                                Smart Business Tools
                            </h3>
                            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>AI-powered content generation and marketing</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Automated social media and advertising</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Analytics and business insights dashboard</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-600 mt-1">✓</span>
                                    <span>Payment processing and order management</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                        Ready to Build Your Business?
                    </h2>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                        Join thousands of Trinidad & Tobago businesses already growing with TriniBuild
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/#/get-started"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
                        >
                            Get Started Free
                        </a>
                        <a
                            href="/#/contact"
                            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
                        >
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};
