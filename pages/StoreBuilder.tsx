import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Store, Package, Palette, Settings, Users, TrendingUp, Mail, Gift, Zap,
    FileText, Layout, Menu, ShoppingBag, Tag, Star, MessageSquare, Truck,
    CreditCard, Bell, BarChart3, Save, Eye, ChevronRight, Plus, Edit2, Trash2,
    Image, Video, Code, Globe, Search, Filter, Calendar, DollarSign, Percent,
    Award, Target, Send, Copy, Check, X, Upload, Download, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

interface BuilderTab {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

export const StoreBuilder: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState('My Store');
    const [saving, setSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    const tabs: BuilderTab[] = [
        {
            id: 'dashboard',
            name: 'Dashboard',
            icon: <BarChart3 className="h-5 w-5" />,
            description: 'Overview & Analytics'
        },
        {
            id: 'products',
            name: 'Products',
            icon: <Package className="h-5 w-5" />,
            description: 'Manage inventory'
        },
        {
            id: 'collections',
            name: 'Collections',
            icon: <Layout className="h-5 w-5" />,
            description: 'Organize products'
        },
        {
            id: 'design',
            name: 'Design',
            icon: <Palette className="h-5 w-5" />,
            description: 'Customize appearance'
        },
        {
            id: 'marketing',
            name: 'Marketing',
            icon: <TrendingUp className="h-5 w-5" />,
            description: 'Promotions & campaigns'
        },
        {
            id: 'loyalty',
            name: 'Loyalty',
            icon: <Award className="h-5 w-5" />,
            description: 'Rewards program'
        },
        {
            id: 'flash-sales',
            name: 'Flash Sales',
            icon: <Zap className="h-5 w-5" />,
            description: 'Limited-time offers'
        },
        {
            id: 'bundles',
            name: 'Bundles',
            icon: <ShoppingBag className="h-5 w-5" />,
            description: 'Product bundles'
        },
        {
            id: 'gift-cards',
            name: 'Gift Cards',
            icon: <Gift className="h-5 w-5" />,
            description: 'Digital gift cards'
        },
        {
            id: 'email',
            name: 'Email',
            icon: <Mail className="h-5 w-5" />,
            description: 'Email marketing'
        },
        {
            id: 'blog',
            name: 'Blog',
            icon: <FileText className="h-5 w-5" />,
            description: 'Content marketing'
        },
        {
            id: 'pages',
            name: 'Pages',
            icon: <FileText className="h-5 w-5" />,
            description: 'Custom pages'
        },
        {
            id: 'navigation',
            name: 'Navigation',
            icon: <Menu className="h-5 w-5" />,
            description: 'Menus & links'
        },
        {
            id: 'delivery',
            name: 'Delivery',
            icon: <Truck className="h-5 w-5" />,
            description: 'Shipping options'
        },
        {
            id: 'payments',
            name: 'Payments',
            icon: <CreditCard className="h-5 w-5" />,
            description: 'Payment methods'
        },
        {
            id: 'customers',
            name: 'Customers',
            icon: <Users className="h-5 w-5" />,
            description: 'Customer management'
        },
        {
            id: 'reviews',
            name: 'Reviews',
            icon: <Star className="h-5 w-5" />,
            description: 'Product reviews'
        },
        {
            id: 'messages',
            name: 'Messages',
            icon: <MessageSquare className="h-5 w-5" />,
            description: 'Customer chat'
        },
        {
            id: 'notifications',
            name: 'Notifications',
            icon: <Bell className="h-5 w-5" />,
            description: 'Alert settings'
        },
        {
            id: 'staff',
            name: 'Staff',
            icon: <Users className="h-5 w-5" />,
            description: 'Team & permissions'
        },
        {
            id: 'analytics',
            name: 'Analytics',
            icon: <BarChart3 className="h-5 w-5" />,
            description: 'Reports & insights'
        },
        {
            id: 'settings',
            name: 'Settings',
            icon: <Settings className="h-5 w-5" />,
            description: 'Store configuration'
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab />;
            case 'products':
                return <ProductsTab />;
            case 'collections':
                return <CollectionsTab />;
            case 'design':
                return <DesignTab />;
            case 'marketing':
                return <MarketingTab />;
            case 'loyalty':
                return <LoyaltyTab />;
            case 'flash-sales':
                return <FlashSalesTab />;
            case 'bundles':
                return <BundlesTab />;
            case 'gift-cards':
                return <GiftCardsTab />;
            case 'email':
                return <EmailTab />;
            case 'blog':
                return <BlogTab />;
            case 'pages':
                return <PagesTab />;
            case 'navigation':
                return <NavigationTab />;
            case 'delivery':
                return <DeliveryTab />;
            case 'payments':
                return <PaymentsTab />;
            case 'customers':
                return <CustomersTab />;
            case 'reviews':
                return <ReviewsTab />;
            case 'messages':
                return <MessagesTab />;
            case 'notifications':
                return <NotificationsTab />;
            case 'staff':
                return <StaffTab />;
            case 'analytics':
                return <AnalyticsTab />;
            case 'settings':
                return <SettingsTab />;
            default:
                return <DashboardTab />;
        }
    };

    return (
        <>
            <Helmet>
                <title>Store Builder - TriniBuild</title>
                <meta name="description" content="Build and manage your online store with TriniBuild's world-class store builder" />
            </Helmet>

            <div className="min-h-screen bg-gray-50 flex">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                    {/* Store Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-gray-900 truncate">{storeName}</h2>
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Preview Store"
                            >
                                <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Store Builder</p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${activeTab === tab.id
                                        ? 'bg-trini-red text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>
                                    {tab.icon}
                                </span>
                                <div className="ml-3 flex-1">
                                    <p className="text-sm font-medium">{tab.name}</p>
                                    <p className={`text-xs ${activeTab === tab.id ? 'text-white/80' : 'text-gray-500'}`}>
                                        {tab.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 space-y-2">
                        <button
                            onClick={() => setSaving(true)}
                            disabled={saving}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => navigate(`/store/${storeId}`)}
                            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Store
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Top Bar */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {tabs.find(t => t.id === activeTab)?.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {tabs.find(t => t.id === activeTab)?.description}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Upload className="h-4 w-4 inline mr-2" />
                                Import
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                <Download className="h-4 w-4 inline mr-2" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================
// TAB COMPONENTS (Placeholders - will build each fully)
// ============================================

const DashboardTab: React.FC = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Sales" value="TT$12,450" change="+12%" icon={<DollarSign />} />
            <StatCard title="Orders" value="156" change="+8%" icon={<ShoppingBag />} />
            <StatCard title="Customers" value="89" change="+15%" icon={<Users />} />
            <StatCard title="Conversion" value="3.2%" change="+0.5%" icon={<TrendingUp />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Recent Orders</h3>
                <p className="text-gray-500 text-sm">No recent orders</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
                <p className="text-gray-500 text-sm">No products yet</p>
            </div>
        </div>
    </div>
);

const ProductsTab: React.FC = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                    />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </button>
            </div>
            <button className="bg-trini-red text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
            </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            No products yet. Click "Add Product" to get started.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

const CollectionsTab: React.FC = () => (
    <QuickSetupCard
        title="Product Collections"
        description="Organize your products into collections for easier browsing"
        icon={<Layout className="h-12 w-12 text-trini-red" />}
        actions={[
            { label: 'Create Collection', primary: true },
            { label: 'View Guide', primary: false }
        ]}
    />
);

const DesignTab: React.FC = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-trini-red" />
                    Theme Colors
                </h3>
                <div className="space-y-4">
                    <ColorPicker label="Primary Color" value="#CE1126" />
                    <ColorPicker label="Secondary Color" value="#000000" />
                    <ColorPicker label="Accent Color" value="#00A651" />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Image className="h-5 w-5 mr-2 text-trini-red" />
                    Store Images
                </h3>
                <div className="space-y-4">
                    <ImageUpload label="Logo" />
                    <ImageUpload label="Banner" />
                    <ImageUpload label="Favicon" />
                </div>
            </div>
        </div>
    </div>
);

const MarketingTab: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
            icon={<Percent className="h-8 w-8 text-blue-600" />}
            title="Promo Codes"
            description="Create discount codes for your customers"
            action="Create Code"
        />
        <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-600" />}
            title="Flash Sales"
            description="Limited-time offers with countdown timers"
            action="Create Sale"
        />
        <FeatureCard
            icon={<Mail className="h-8 w-8 text-green-600" />}
            title="Email Campaigns"
            description="Send newsletters and promotions"
            action="New Campaign"
        />
    </div>
);

const LoyaltyTab: React.FC = () => (
    <QuickSetupCard
        title="Loyalty & Rewards Program"
        description="Reward your customers with points for purchases, reviews, and referrals"
        icon={<Award className="h-12 w-12 text-yellow-500" />}
        actions={[
            { label: 'Setup Loyalty Program', primary: true },
            { label: 'Learn More', primary: false }
        ]}
    />
);

const FlashSalesTab: React.FC = () => (
    <QuickSetupCard
        title="Flash Sales"
        description="Create urgency with limited-time offers and countdown timers"
        icon={<Zap className="h-12 w-12 text-yellow-500" />}
        actions={[
            { label: 'Create Flash Sale', primary: true },
            { label: 'View Examples', primary: false }
        ]}
    />
);

const BundlesTab: React.FC = () => (
    <QuickSetupCard
        title="Product Bundles"
        description="Increase average order value with product bundles and BOGO deals"
        icon={<ShoppingBag className="h-12 w-12 text-purple-600" />}
        actions={[
            { label: 'Create Bundle', primary: true },
            { label: 'Bundle Ideas', primary: false }
        ]}
    />
);

const GiftCardsTab: React.FC = () => (
    <QuickSetupCard
        title="Digital Gift Cards"
        description="Sell gift cards to increase revenue and attract new customers"
        icon={<Gift className="h-12 w-12 text-pink-600" />}
        actions={[
            { label: 'Enable Gift Cards', primary: true },
            { label: 'Settings', primary: false }
        ]}
    />
);

const EmailTab: React.FC = () => (
    <QuickSetupCard
        title="Email Marketing"
        description="Send campaigns, abandoned cart emails, and automated sequences"
        icon={<Mail className="h-12 w-12 text-blue-600" />}
        actions={[
            { label: 'Create Campaign', primary: true },
            { label: 'Templates', primary: false }
        ]}
    />
);

const BlogTab: React.FC = () => (
    <QuickSetupCard
        title="Store Blog"
        description="Share content, guides, and stories to engage customers and improve SEO"
        icon={<FileText className="h-12 w-12 text-indigo-600" />}
        actions={[
            { label: 'Write Post', primary: true },
            { label: 'View Blog', primary: false }
        ]}
    />
);

const PagesTab: React.FC = () => (
    <QuickSetupCard
        title="Custom Pages"
        description="Create custom pages like About Us, FAQ, Terms & Conditions"
        icon={<FileText className="h-12 w-12 text-gray-600" />}
        actions={[
            { label: 'New Page', primary: true },
            { label: 'Page Templates', primary: false }
        ]}
    />
);

const NavigationTab: React.FC = () => (
    <QuickSetupCard
        title="Navigation Menus"
        description="Customize your store's header, footer, and sidebar menus"
        icon={<Menu className="h-12 w-12 text-gray-700" />}
        actions={[
            { label: 'Edit Menus', primary: true },
            { label: 'Menu Guide', primary: false }
        ]}
    />
);

const DeliveryTab: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg text-white">
            <h3 className="text-xl font-bold mb-2">TriniBuild Go Integration</h3>
            <p className="mb-4">Connect your store to our driver network for fast, reliable delivery</p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">
                Enable TriniBuild Go
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
                icon={<Truck className="h-8 w-8 text-green-600" />}
                title="Delivery Zones"
                description="Set up delivery areas and pricing"
                action="Configure Zones"
            />
            <FeatureCard
                icon={<MapPin className="h-8 w-8 text-red-600" />}
                title="Pickup Locations"
                description="Allow customers to collect orders"
                action="Add Locations"
            />
        </div>
    </div>
);

const PaymentsTab: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PaymentMethodCard
            name="Cash on Delivery"
            description="Most popular in Trinidad"
            enabled={true}
            icon="💵"
        />
        <PaymentMethodCard
            name="WiPay"
            description="Credit/Debit/Linx"
            enabled={false}
            icon="💳"
        />
        <PaymentMethodCard
            name="Google Pay"
            description="Fast mobile payments"
            enabled={false}
            icon="📱"
        />
        <PaymentMethodCard
            name="Bank Transfer"
            description="Direct deposit"
            enabled={true}
            icon="🏦"
        />
    </div>
);

const CustomersTab: React.FC = () => (
    <QuickSetupCard
        title="Customer Management"
        description="View and manage your customers, segments, and analytics"
        icon={<Users className="h-12 w-12 text-blue-600" />}
        actions={[
            { label: 'View Customers', primary: true },
            { label: 'Create Segment', primary: false }
        ]}
    />
);

const ReviewsTab: React.FC = () => (
    <QuickSetupCard
        title="Product Reviews"
        description="Manage customer reviews and ratings to build trust"
        icon={<Star className="h-12 w-12 text-yellow-500" />}
        actions={[
            { label: 'Moderate Reviews', primary: true },
            { label: 'Settings', primary: false }
        ]}
    />
);

const MessagesTab: React.FC = () => (
    <QuickSetupCard
        title="Customer Messages"
        description="Chat with customers in real-time and provide support"
        icon={<MessageSquare className="h-12 w-12 text-green-600" />}
        actions={[
            { label: 'Open Inbox', primary: true },
            { label: 'Quick Replies', primary: false }
        ]}
    />
);

const NotificationsTab: React.FC = () => (
    <QuickSetupCard
        title="Notification Settings"
        description="Configure email, SMS, and WhatsApp notifications for customers"
        icon={<Bell className="h-12 w-12 text-purple-600" />}
        actions={[
            { label: 'Configure', primary: true },
            { label: 'Test Notifications', primary: false }
        ]}
    />
);

const StaffTab: React.FC = () => (
    <QuickSetupCard
        title="Staff & Permissions"
        description="Add team members and manage their access levels"
        icon={<Users className="h-12 w-12 text-indigo-600" />}
        actions={[
            { label: 'Invite Staff', primary: true },
            { label: 'Manage Roles', primary: false }
        ]}
    />
);

const AnalyticsTab: React.FC = () => (
    <QuickSetupCard
        title="Analytics & Reports"
        description="Track sales, traffic, conversions, and customer behavior"
        icon={<BarChart3 className="h-12 w-12 text-blue-600" />}
        actions={[
            { label: 'View Dashboard', primary: true },
            { label: 'Export Report', primary: false }
        ]}
    />
);

const SettingsTab: React.FC = () => (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Store Information</h3>
            <div className="space-y-4">
                <InputField label="Store Name" placeholder="My Awesome Store" />
                <InputField label="Store Description" placeholder="Describe your store..." multiline />
                <InputField label="Contact Email" placeholder="store@example.com" type="email" />
                <InputField label="WhatsApp Number" placeholder="1868-XXX-XXXX" type="tel" />
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Store URL</h3>
            <div className="flex items-center space-x-2">
                <span className="text-gray-500">trinibuild.com/store/</span>
                <input
                    type="text"
                    placeholder="your-store"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                />
            </div>
        </div>
    </div>
);

// ============================================
// HELPER COMPONENTS
// ============================================

const StatCard: React.FC<{ title: string; value: string; change: string; icon: React.ReactNode }> = ({ title, value, change, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{title}</span>
            <span className="text-gray-400">{icon}</span>
        </div>
        <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-sm font-medium text-green-600">{change}</span>
        </div>
    </div>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; action: string }> = ({ icon, title, description, action }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="mb-4">{icon}</div>
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            {action}
        </button>
    </div>
);

const QuickSetupCard: React.FC<{ title: string; description: string; icon: React.ReactNode; actions: Array<{ label: string; primary: boolean }> }> = ({ title, description, icon, actions }) => (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto text-center">
        <div className="mb-6 flex justify-center">{icon}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-center space-x-4">
            {actions.map((action, idx) => (
                <button
                    key={idx}
                    className={`px-6 py-3 rounded-lg font-bold transition-colors ${action.primary
                            ? 'bg-trini-red text-white hover:bg-red-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {action.label}
                </button>
            ))}
        </div>
    </div>
);

const ColorPicker: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center space-x-3">
            <input
                type="color"
                value={value}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
            />
            <input
                type="text"
                value={value}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
        </div>
    </div>
);

const ImageUpload: React.FC<{ label: string }> = ({ label }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-trini-red transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
        </div>
    </div>
);

const PaymentMethodCard: React.FC<{ name: string; description: string; enabled: boolean; icon: string }> = ({ name, description, enabled, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start justify-between mb-4">
            <span className="text-4xl">{icon}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={enabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
        </div>
        <h3 className="font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-500">{description}</p>
    </div>
);

const InputField: React.FC<{ label: string; placeholder: string; type?: string; multiline?: boolean }> = ({ label, placeholder, type = 'text', multiline = false }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {multiline ? (
            <textarea
                placeholder={placeholder}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
        ) : (
            <input
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
            />
        )}
    </div>
);
