import React from 'react';
import {
    Store, ShoppingCart, Megaphone, BarChart3, Sparkles, Zap,
    Shield, CreditCard, Smartphone, Globe, MessageSquare, TrendingUp,
    Package, Users, Calendar, MapPin, Briefcase, Home
} from 'lucide-react';

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
        <div className={`${color} rounded-full w-14 h-14 flex items-center justify-center mb-4`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
    </div>
);

export const Features: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Hero Section */}
            <section className="relative py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                        Powerful Features
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                        Everything you need to build, grow, and scale your business in Trinidad & Tobago
                    </p>
                </div>
            </section>

            {/* E-Commerce Features */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                            E-Commerce & Store Builder
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Create your online store in minutes with our powerful tools
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Store className="h-7 w-7 text-blue-600" />}
                            title="Free Store Builder"
                            description="Build a professional online store with our drag-and-drop builder. No coding required!"
                            color="bg-blue-100 dark:bg-blue-900"
                        />
                        <FeatureCard
                            icon={<Sparkles className="h-7 w-7 text-purple-600" />}
                            title="AI-Powered Design"
                            description="Let AI create stunning product descriptions, images, and marketing content for you."
                            color="bg-purple-100 dark:bg-purple-900"
                        />
                        <FeatureCard
                            icon={<ShoppingCart className="h-7 w-7 text-green-600" />}
                            title="Product Management"
                            description="Easily manage inventory, variants, pricing, and product catalogs all in one place."
                            color="bg-green-100 dark:bg-green-900"
                        />
                        <FeatureCard
                            icon={<CreditCard className="h-7 w-7 text-yellow-600" />}
                            title="Payment Processing"
                            description="Accept payments securely with integrated payment gateways and local payment options."
                            color="bg-yellow-100 dark:bg-yellow-900"
                        />
                        <FeatureCard
                            icon={<Package className="h-7 w-7 text-red-600" />}
                            title="Order Management"
                            description="Track orders, manage fulfillment, and keep customers updated automatically."
                            color="bg-red-100 dark:bg-red-900"
                        />
                        <FeatureCard
                            icon={<Smartphone className="h-7 w-7 text-indigo-600" />}
                            title="Mobile Optimized"
                            description="Your store looks perfect on every device—desktop, tablet, and mobile."
                            color="bg-indigo-100 dark:bg-indigo-900"
                        />
                    </div>
                </div>
            </section>

            {/* Marketing Features */}
            <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                            Marketing & Growth Tools
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Reach more customers and grow your business faster
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Megaphone className="h-7 w-7 text-blue-600" />}
                            title="Video Ads Platform"
                            description="Create and run targeted video ad campaigns to reach your ideal customers."
                            color="bg-blue-100 dark:bg-blue-900"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-7 w-7 text-green-600" />}
                            title="SEO Optimization"
                            description="Automatically optimize your content for search engines and get found online."
                            color="bg-green-100 dark:bg-green-900"
                        />
                        <FeatureCard
                            icon={<MessageSquare className="h-7 w-7 text-purple-600" />}
                            title="Social Media Tools"
                            description="Schedule posts, manage campaigns, and engage with customers across platforms."
                            color="bg-purple-100 dark:bg-purple-900"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-7 w-7 text-orange-600" />}
                            title="Analytics Dashboard"
                            description="Track sales, traffic, and customer behavior with detailed insights and reports."
                            color="bg-orange-100 dark:bg-orange-900"
                        />
                        <FeatureCard
                            icon={<Zap className="h-7 w-7 text-yellow-600" />}
                            title="Marketing Automation"
                            description="Automate email campaigns, promotions, and customer communications."
                            color="bg-yellow-100 dark:bg-yellow-900"
                        />
                        <FeatureCard
                            icon={<Users className="h-7 w-7 text-pink-600" />}
                            title="Customer Insights"
                            description="Understand your customers better with AI-powered analytics and segmentation."
                            color="bg-pink-100 dark:bg-pink-900"
                        />
                    </div>
                </div>
            </section>

            {/* Marketplace Features */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                            Marketplace & Community
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Connect with customers across Trinidad & Tobago
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MapPin className="h-7 w-7 text-blue-600" />}
                            title="Business Directory"
                            description="Get discovered by local customers searching for products and services."
                            color="bg-blue-100 dark:bg-blue-900"
                        />
                        <FeatureCard
                            icon={<Package className="h-7 w-7 text-green-600" />}
                            title="Classifieds Marketplace"
                            description="Buy and sell anything—from electronics to vehicles to services."
                            color="bg-green-100 dark:bg-green-900"
                        />
                        <FeatureCard
                            icon={<Briefcase className="h-7 w-7 text-purple-600" />}
                            title="Jobs Board"
                            description="Post job openings or find your next opportunity in T&T's job market."
                            color="bg-purple-100 dark:bg-purple-900"
                        />
                        <FeatureCard
                            icon={<Home className="h-7 w-7 text-red-600" />}
                            title="Real Estate Listings"
                            description="List properties for sale or rent, and help buyers find their dream home."
                            color="bg-red-100 dark:bg-red-900"
                        />
                        <FeatureCard
                            icon={<Calendar className="h-7 w-7 text-yellow-600" />}
                            title="Events Calendar"
                            description="Promote events, sell tickets, and manage attendees all in one place."
                            color="bg-yellow-100 dark:bg-yellow-900"
                        />
                        <FeatureCard
                            icon={<Globe className="h-7 w-7 text-indigo-600" />}
                            title="Local Focus"
                            description="Built specifically for Trinidad & Tobago with local payment and delivery options."
                            color="bg-indigo-100 dark:bg-indigo-900"
                        />
                    </div>
                </div>
            </section>

            {/* Security & Support */}
            <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                            Security & Support
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Your business is safe with us
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Shield className="h-7 w-7 text-blue-600" />}
                            title="Enterprise Security"
                            description="Bank-level encryption and security to protect your business and customer data."
                            color="bg-blue-100 dark:bg-blue-900"
                        />
                        <FeatureCard
                            icon={<MessageSquare className="h-7 w-7 text-green-600" />}
                            title="24/7 Support"
                            description="Get help when you need it with our dedicated support team and knowledge base."
                            color="bg-green-100 dark:bg-green-900"
                        />
                        <FeatureCard
                            icon={<Zap className="h-7 w-7 text-purple-600" />}
                            title="99.9% Uptime"
                            description="Your store stays online with our reliable, high-performance infrastructure."
                            color="bg-purple-100 dark:bg-purple-900"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
                        Ready to Experience These Features?
                    </h2>
                    <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
                        Start building your business today—completely free!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/#/get-started"
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
                        >
                            Get Started Free
                        </a>
                        <a
                            href="/#/pricing"
                            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg hover:shadow-xl transition-shadow"
                        >
                            View Pricing
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};
