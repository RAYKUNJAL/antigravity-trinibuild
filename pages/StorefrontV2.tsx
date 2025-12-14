import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShoppingCart, Search, Heart, Share2, Star, TrendingUp, Shield, Truck, Clock, Phone, Mail, MapPin, ChevronRight, X, Plus, Minus, Check, CreditCard, Smartphone, Banknote, Building2, Zap } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { storeService } from '../services/storeService';
import { supabase } from '../services/supabaseClient';
import { paymentService, PaymentMethod } from '../services/paymentService';
import type { Store, Product } from '../types';

// Lazy load heavy components
const GooglePayButton = lazy(() => import('@google-pay/button-react'));

export const StorefrontV2: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    // State
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<Array<Product & { quantity: number }>>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Checkout state
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>('cart');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [shippingInfo, setShippingInfo] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        notes: ''
    });
    const [processing, setProcessing] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Discount State
    const [promoCode, setPromoCode] = useState('');
    const [activeDiscount, setActiveDiscount] = useState<{ code: string; amount: number; type: string } | null>(null);
    const [discountError, setDiscountError] = useState('');

    // Load store data
    useEffect(() => {
        const loadStore = async () => {
            if (!slug) return;

            setLoading(true);
            try {
                const storeData = await storeService.getStoreBySlug(slug);
                if (storeData) {
                    setStore(storeData);
                    setProducts(storeData.products || []);
                }
            } catch (error) {
                console.error('Failed to load store:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStore();
    }, [slug]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
            return matchesSearch && matchesCategory && p.status === 'active';
        });
    }, [products, searchQuery, selectedCategory]);

    // Cart calculations
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    const cartCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    // Cart actions
    const addToCart = (product: Product) => {
        // Commercial Grade: Inventory Check
        const currentInCart = cart.find(item => item.id === product.id)?.quantity || 0;
        if (product.stock !== undefined && currentInCart + 1 > product.stock) {
            alert(`Sorry, only ${product.stock} items available!`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.quantity + delta;

                    // Commercial Grade: Inventory Check
                    const product = products.find(p => p.id === productId);
                    if (delta > 0 && product?.stock !== undefined && newQty > product.stock) {
                        alert(`Only ${product.stock} items available`);
                        return item;
                    }

                    return newQty > 0 ? { ...item, quantity: newQty } : item;
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const handleApplyPromo = async () => {
        setDiscountError('');
        if (!store?.id || !promoCode) return;

        const result = await storeService.validateDiscount(store.id, promoCode, cartTotal);

        if (result.valid && result.discount !== undefined) {
            setActiveDiscount({ code: promoCode, amount: result.discount, type: result.type || 'fixed' });
        } else {
            setDiscountError(result.error || 'Invalid code');
            setActiveDiscount(null);
        }
    };

    // Calculate Final Total
    const finalTotal = useMemo(() => {
        const discount = activeDiscount ? activeDiscount.amount : 0;
        return Math.max(0, cartTotal - discount);
    }, [cartTotal, activeDiscount]);

    // Checkout flow
    const handleCheckout = async () => {
        if (checkoutStep === 'cart') {
            setCheckoutStep('shipping');
            return;
        }

        if (checkoutStep === 'shipping') {
            // Validate shipping info
            if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
                alert('Please fill in all required fields');
                return;
            }
            setCheckoutStep('payment');
            return;
        }

        if (checkoutStep === 'payment') {
            setProcessing(true);
            try {
                // 1. Create Persistent Order
                const order = await storeService.createOrder({
                    store_id: store?.id,
                    // Use a placeholder UUID for guests if no auth (assuming DB allows or we handle auth later)
                    customer_id: '00000000-0000-0000-0000-000000000000',
                    total: finalTotal,
                    status: 'pending',
                    delivery_address: JSON.stringify(shippingInfo),
                }, cart.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                })));

                if (!order) throw new Error("Failed to create order record");
                const newOrderId = order.id;
                setOrderId(newOrderId);

                const paymentConfig = {
                    method: paymentMethod,
                    amount: cartTotal,
                    currency: store?.settings?.currency || 'TTD',
                    orderId: newOrderId,
                    customerInfo: {
                        name: shippingInfo.name,
                        email: shippingInfo.email,
                        phone: shippingInfo.phone
                    }
                };

                let result;
                switch (paymentMethod) {
                    case 'wipay':
                        result = await paymentService.processWiPayPayment(paymentConfig);
                        if (result.redirectUrl) {
                            window.location.href = result.redirectUrl;
                            return;
                        }
                        break;
                    case 'cod':
                    case 'cash':
                        result = await paymentService.processCashPayment(paymentConfig);
                        break;
                    default:
                        result = { success: false, error: 'Payment method not supported' };
                }

                if (result.success) {
                    setOrderId(newOrderId);
                    setCheckoutStep('success');
                    setCart([]);
                } else {
                    alert(result.error || 'Payment failed');
                }
            } catch (error) {
                console.error('Checkout error:', error);
                alert('Checkout failed. Please try again.');
            } finally {
                setProcessing(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-trini-red"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Store Not Found</h1>
                <button
                    onClick={() => navigate('/directory')}
                    className="bg-trini-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                    Browse All Stores
                </button>
            </div>
        );
    }

    return (
        <>
            {/* SEO Optimization */}
            <Helmet>
                <title>{store.name} - Shop Online in Trinidad & Tobago | TriniBuild</title>
                <meta name="description" content={store.description || `Shop at ${store.name} - Fast delivery across Trinidad & Tobago. Cash on delivery available.`} />
                <meta name="keywords" content={`${store.name}, Trinidad shopping, online store, ${store.category}, TriniBuild`} />

                {/* Open Graph */}
                <meta property="og:title" content={`${store.name} - TriniBuild`} />
                <meta property="og:description" content={store.description || ''} />
                <meta property="og:image" content={store.logo_url || store.banner_url || ''} />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${store.name} - TriniBuild`} />
                <meta name="twitter:description" content={store.description || ''} />

                {/* Structured Data for SEO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Store",
                        "name": store.name,
                        "description": store.description,
                        "image": store.logo_url,
                        "address": {
                            "@type": "PostalAddress",
                            "addressCountry": "TT",
                            "addressLocality": store.location
                        },
                        "telephone": store.whatsapp,
                        "priceRange": "$$"
                    })}
                </script>
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Top Announcement Bar - CRO Element */}
                <div className="bg-gradient-to-r from-trini-red to-red-600 text-white text-center py-2 px-4 text-sm font-bold">
                    <Truck className="inline h-4 w-4 mr-2" />
                    FREE DELIVERY on orders over TT$200 | Cash on Delivery Available
                </div>

                {/* Header */}
                <header className="sticky top-0 z-50 bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            {/* Logo */}
                            <div className="flex items-center space-x-3">
                                {store.logo_url && (
                                    <img
                                        src={store.logo_url}
                                        alt={store.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                        loading="lazy"
                                    />
                                )}
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900">{store.name}</h1>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                        4.8 (120 reviews)
                                    </div>
                                </div>
                            </div>

                            {/* Search Bar - Desktop */}
                            <div className="hidden md:flex flex-1 max-w-lg mx-8">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Cart Button */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2 text-gray-700 hover:text-trini-red transition-colors"
                            >
                                <ShoppingCart className="h-6 w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-trini-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Mobile Search */}
                        <div className="md:hidden pb-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-trini-red focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Banner */}
                {store.banner_url && (
                    <div className="relative h-64 md:h-80 bg-gray-900">
                        <img
                            src={store.banner_url}
                            alt={store.name}
                            className="w-full h-full object-cover opacity-70"
                            loading="eager"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-t from-black/60 to-transparent">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-lg">
                                {store.name}
                            </h2>
                            <p className="text-lg text-gray-200 max-w-2xl mb-6">
                                {store.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-white">
                                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                    <Shield className="h-4 w-4 mr-1" />
                                    Verified Seller
                                </div>
                                <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                    <Truck className="h-4 w-4 mr-1" />
                                    Fast Delivery
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Trust Badges - CRO Element */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-900">Secure Checkout</p>
                            <p className="text-xs text-gray-500">SSL Encrypted</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-900">Fast Delivery</p>
                            <p className="text-xs text-gray-500">1-3 Days</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <Banknote className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                            <p className="text-xs text-gray-500">Pay When You Get It</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                            <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-900">24/7 Support</p>
                            <p className="text-xs text-gray-500">WhatsApp Ready</p>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Featured Products</h3>
                        <p className="text-gray-600 mb-6">Showing {filteredProducts.length} products</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="group bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200"
                            >
                                {/* Product Image */}
                                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                    <img
                                        src={product.image_url || 'https://via.placeholder.com/400'}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                                            SALE
                                        </div>
                                    )}
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="absolute bottom-2 right-2 bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-trini-red hover:text-white"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    <h4 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm">
                                        {product.name}
                                    </h4>
                                    <div className="flex items-center mb-2">
                                        <div className="flex text-yellow-400 text-xs">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-3 w-3 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500 ml-1">(24)</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-bold text-trini-red">
                                                TT${product.price.toFixed(2)}
                                            </p>
                                            {product.compare_at_price && (
                                                <p className="text-xs text-gray-500 line-through">
                                                    TT${product.compare_at_price.toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-trini-red transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No products found</p>
                        </div>
                    )}
                </main>

                {/* Cart Sidebar */}
                {isCartOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
                        <div className="absolute inset-y-0 right-0 max-w-full flex">
                            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full">
                                {/* Cart Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {checkoutStep === 'cart' && 'Shopping Cart'}
                                        {checkoutStep === 'shipping' && 'Shipping Details'}
                                        {checkoutStep === 'payment' && 'Payment Method'}
                                        {checkoutStep === 'success' && 'Order Confirmed!'}
                                    </h2>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Cart Content */}
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    {checkoutStep === 'cart' && (
                                        <>
                                            {cart.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center">
                                                    <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                                                    <p className="text-gray-500">Your cart is empty</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {cart.map((item) => (
                                                        <div key={item.id} className="flex gap-4 pb-4 border-b">
                                                            <img
                                                                src={item.image_url || 'https://via.placeholder.com/80'}
                                                                alt={item.name}
                                                                className="w-20 h-20 object-cover rounded-lg"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-bold text-sm text-gray-900 mb-1">
                                                                    {item.name}
                                                                </h4>
                                                                <p className="text-trini-red font-bold">
                                                                    TT${item.price.toFixed(2)}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, -1)}
                                                                        className="p-1 border rounded hover:bg-gray-100"
                                                                    >
                                                                        <Minus className="h-3 w-3" />
                                                                    </button>
                                                                    <span className="font-bold text-sm">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, 1)}
                                                                        className="p-1 border rounded hover:bg-gray-100"
                                                                    >
                                                                        <Plus className="h-3 w-3" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => removeFromCart(item.id)}
                                                                        className="ml-auto text-red-600 text-xs hover:underline"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {checkoutStep === 'shipping' && (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                placeholder="Full Name *"
                                                value={shippingInfo.name}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, name: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Phone Number *"
                                                value={shippingInfo.phone}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                            />
                                            <input
                                                type="email"
                                                placeholder="Email (optional)"
                                                value={shippingInfo.email}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Street Address *"
                                                value={shippingInfo.address}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                            />
                                            <input
                                                type="text"
                                                placeholder="City / Area"
                                                value={shippingInfo.city}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                            />
                                            <textarea
                                                placeholder="Delivery Notes (optional)"
                                                value={shippingInfo.notes}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, notes: e.target.value })}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-trini-red"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {checkoutStep === 'payment' && (
                                        <div className="space-y-4">
                                            {/* Payment Methods */}
                                            <button
                                                onClick={() => setPaymentMethod('cod')}
                                                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <Banknote className="h-6 w-6 text-green-600 mr-3" />
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900">Cash on Delivery</p>
                                                        <p className="text-xs text-gray-500">Pay when you receive</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'cod' && <Check className="h-5 w-5 text-green-600" />}
                                            </button>

                                            <button
                                                onClick={() => setPaymentMethod('wipay')}
                                                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'wipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900">WiPay</p>
                                                        <p className="text-xs text-gray-500">Credit/Debit Card & Linx</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'wipay' && <Check className="h-5 w-5 text-blue-600" />}
                                            </button>

                                            <Suspense fallback={<div>Loading Google Pay...</div>}>
                                                <button
                                                    onClick={() => setPaymentMethod('google_pay')}
                                                    className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'google_pay' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <Smartphone className="h-6 w-6 text-purple-600 mr-3" />
                                                        <div className="text-left">
                                                            <p className="font-bold text-gray-900">Google Pay</p>
                                                            <p className="text-xs text-gray-500">Fast & Secure</p>
                                                        </div>
                                                    </div>
                                                    {paymentMethod === 'google_pay' && <Check className="h-5 w-5 text-purple-600" />}
                                                </button>
                                            </Suspense>

                                            <button
                                                onClick={() => setPaymentMethod('bank_transfer')}
                                                className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'bank_transfer' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <Building2 className="h-6 w-6 text-orange-600 mr-3" />
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900">Bank Transfer</p>
                                                        <p className="text-xs text-gray-500">Republic, Scotia, FCB</p>
                                                    </div>
                                                </div>
                                                {paymentMethod === 'bank_transfer' && <Check className="h-5 w-5 text-orange-600" />}
                                            </button>
                                        </div>
                                    )}

                                    {checkoutStep === 'success' && (
                                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                                <Check className="h-10 w-10 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900">Order Placed!</h3>
                                            <p className="text-gray-600">Order #{orderId}</p>
                                            <p className="text-sm text-gray-500 max-w-xs">
                                                We'll send you a confirmation via WhatsApp shortly.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setIsCartOpen(false);
                                                    setCheckoutStep('cart');
                                                }}
                                                className="bg-trini-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors"
                                            >
                                                Continue Shopping
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Cart Footer */}
                                {checkoutStep !== 'success' && cart.length > 0 && (
                                    <div className="border-t px-6 py-4 bg-gray-50">
                                        {/* Promo Code Input */}
                                        {checkoutStep === 'cart' && (
                                            <div className="mb-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Promo Code"
                                                        value={promoCode}
                                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                        className="flex-1 border rounded-lg px-3 py-2 text-sm uppercase"
                                                    />
                                                    <button
                                                        onClick={handleApplyPromo}
                                                        className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
                                                    >Apply</button>
                                                </div>
                                                {discountError && <p className="text-red-500 text-xs mt-1">{discountError}</p>}
                                                {activeDiscount && <p className="text-green-600 text-xs mt-1">Code applied: -${activeDiscount.amount.toFixed(2)}</p>}
                                            </div>
                                        )}

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-gray-600 text-sm">
                                                <span>Subtotal:</span>
                                                <span>TT${cartTotal.toFixed(2)}</span>
                                            </div>
                                            {activeDiscount && (
                                                <div className="flex justify-between text-green-600 text-sm">
                                                    <span>Discount ({activeDiscount.code}):</span>
                                                    <span>-TT${activeDiscount.amount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                                <span>Total:</span>
                                                <span className="text-trini-red">TT${finalTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {checkoutStep !== 'cart' && (
                                                <button
                                                    onClick={() => {
                                                        if (checkoutStep === 'shipping') setCheckoutStep('cart');
                                                        if (checkoutStep === 'payment') setCheckoutStep('shipping');
                                                    }}
                                                    className="px-6 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                                                >
                                                    Back
                                                </button>
                                            )}
                                            <button
                                                onClick={handleCheckout}
                                                disabled={processing}
                                                className="flex-1 bg-trini-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                            >
                                                {processing ? (
                                                    'Processing...'
                                                ) : (
                                                    <>
                                                        {checkoutStep === 'cart' && 'Checkout'}
                                                        {checkoutStep === 'shipping' && 'Continue to Payment'}
                                                        {checkoutStep === 'payment' && 'Place Order'}
                                                        <ChevronRight className="ml-2 h-5 w-5" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Cart Button - Mobile */}
                {cartCount > 0 && !isCartOpen && (
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-4 right-4 md:hidden bg-trini-red text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all z-40 flex items-center space-x-2"
                    >
                        <ShoppingCart className="h-6 w-6" />
                        <span className="font-bold">{cartCount}</span>
                        <span className="text-sm">TT${cartTotal.toFixed(2)}</span>
                    </button>
                )}
            </div>
        </>
    );
};
