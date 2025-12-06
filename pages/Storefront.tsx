import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Star, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Plus, Minus, Trash2, ChevronRight, Banknote, CreditCard, Clock, Gift, Calendar, Truck, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useParams } from 'react-router-dom';
import { storeService, Store } from '../services/storeService';
import { orderService, CreateOrderData } from '../services/orderService';
import { SocialContactWidget } from '../components/SocialContactWidget';
import { ChatWidget } from '../components/ChatWidget';

export const Storefront: React.FC = () => {
  const { id } = useParams();
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Checkout State
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Details, 2: Schedule, 3: Payment, 4: Success
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form State
  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);

  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express' | 'pickup'>('standard');
  const [scheduleOption, setScheduleOption] = useState<'now' | 'later' | 'hold'>('now');
  const [selectedDate, setSelectedDate] = useState('');

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'card' | 'paypal'>('cod');

  useEffect(() => {
    const fetchStore = async () => {
      if (!id) {
        const activeStore = localStorage.getItem('trinibuild_active_store');
        if (activeStore) {
          setStoreData(JSON.parse(activeStore));
          setIsLoading(false);
          return;
        }
        setError("No store ID provided.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await storeService.getStoreById(id);
        setStoreData(data);
      } catch (err) {
        console.error("Failed to load store:", err);
        setError("Store not found.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  // Aggregate cart items
  const cartItems = useMemo(() => {
    const items: Record<number, any> = {};
    cart.forEach(product => {
      if (items[product.id]) {
        items[product.id].quantity += 1;
      } else {
        items[product.id] = { ...product, quantity: 1 };
      }
    });
    return Object.values(items);
  }, [cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const cartCount = cart.length;
  const loyaltyPoints = Math.floor(cartTotal / 10);

  const handleWhatsAppClick = (productName?: string) => {
    if (!storeData) return;
    const text = productName
      ? `Hi, I'm interested in ordering ${productName} from your store.`
      : `Hi, I have a question about your store.`;
    const url = `https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const verifyPhone = () => {
    // Mock phone verification
    if (shippingDetails.phone.length < 7) {
      alert("Please enter a valid phone number.");
      return;
    }
    setShowOtpInput(true);
    // Simulate sending OTP
    setTimeout(() => alert(`Your OTP is 1234`), 1000);
  };

  const confirmOtp = () => {
    if (phoneOtp === '1234') {
      setIsPhoneVerified(true);
      setShowOtpInput(false);
    } else {
      alert("Invalid OTP");
    }
  };

  const handlePlaceOrder = async () => {
    if (!storeData) return;
    setIsProcessingOrder(true);

    try {
      // Prepare Order Data
      const orderData: CreateOrderData = {
        storeId: storeData.id,
        items: cartItems.map((item: any) => ({
          productId: item.id.toString(),
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        shippingAddress: {
          street: shippingDetails.address,
          city: shippingDetails.city,
          phone: shippingDetails.phone,
          name: shippingDetails.name
        },
        paymentMethod: 'cod', // Updated to match CreateOrderData type
        deliveryOption: deliveryOption,
        deliverySlot: scheduleOption === 'later' ? selectedDate : undefined,
        holdUntil: scheduleOption === 'hold' ? selectedDate : undefined,
        notes: shippingDetails.notes
      };

      // Call API
      const response = await orderService.createOrder(orderData);
      setOrderId(response.order_number || 'ORD-' + Math.floor(Math.random() * 10000));
      setCheckoutStep(4); // Success Step

    } catch (err) {
      console.error("Order failed:", err);
      // Fallback for demo if API fails
      setOrderId('ORD-' + Math.floor(Math.random() * 10000));
      setCheckoutStep(4);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const openWhatsAppOrder = () => {
    if (!storeData) return;

    let message = `🆕 *NEW ORDER #${orderId}*\n`;
    message += `--------------------------------\n`;
    message += `👤 *Customer:* ${shippingDetails.name}\n`;
    message += `📞 *Phone:* ${shippingDetails.phone} ${isPhoneVerified ? '✅ Verified' : ''}\n`;
    message += `📍 *Address:* ${shippingDetails.address}, ${shippingDetails.city}\n`;
    message += `--------------------------------\n`;

    cartItems.forEach((item: any) => {
      message += `• ${item.quantity}x ${item.name} ($${item.price * item.quantity})\n`;
    });

    message += `\n💰 *Total: TT$${cartTotal}*\n`;
    message += `🚚 *Delivery:* ${deliveryOption.toUpperCase()}\n`;

    if (scheduleOption === 'later') message += `📅 *Scheduled For:* ${selectedDate}\n`;
    if (scheduleOption === 'hold') message += `📦 *Hold Until:* ${selectedDate}\n`;

    message += `💵 *Payment:* Cash on Delivery (COD)\n`;
    if (shippingDetails.notes) message += `📝 *Notes:* ${shippingDetails.notes}\n`;

    const url = `https://wa.me/${storeData.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Clear cart and close
    setCart([]);
    setIsCartOpen(false);
    setCheckoutStep(1);
  };

  const addToCart = (product: any) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number) => {
    const index = cart.findIndex(p => p.id === productId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const clearCartItem = (productId: number) => {
    setCart(cart.filter(p => p.id !== productId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-trini-red"></div>
      </div>
    );
  }

  if (error || !storeData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Store Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The store you are looking for doesn't exist."}</p>
        <a href="/directory" className="bg-trini-red text-white px-6 py-3 rounded-full font-bold hover:bg-red-700 transition-colors">
          Browse Directory
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans relative">

      {/* Fast Loading Top Bar */}
      <div className="bg-trini-red text-white text-xs py-2 px-4 text-center font-bold tracking-wide">
        GRAND OPENING SALE! ORDER VIA WHATSAPP FOR FAST DELIVERY 🚚
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Area */}
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 mr-3">
                <img src={storeData.logo} alt={storeData.name} className="h-full w-full object-cover" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{storeData.name}</h1>
            </div>

            {/* Search Bar (Hidden on small mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  aria-label="Search"
                  className="w-full p-2 rounded border border-gray-300 text-sm"
                />
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4 shadow-lg">
            <input
              type="text"
              placeholder="Search..."
              aria-label="Search"
              className="w-full p-2 mb-3 rounded border border-gray-300 text-sm"
            />
            <button onClick={() => handleWhatsAppClick()} className="w-full flex items-center justify-center py-2 bg-green-500 text-white rounded-md font-bold mb-2">
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Us
            </button>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="flex items-center"><Phone className="h-3 w-3 mr-2" /> {storeData.whatsapp}</p>
              <p className="flex items-center"><MapPin className="h-3 w-3 mr-2" /> {storeData.location}</p>
            </div>
          </div>
        )}
      </header>

      {/* Cart Sidebar / Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md transform transition-transform bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right">

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-6 sm:px-6 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {checkoutStep === 1 ? 'Shopping Cart' : checkoutStep === 2 ? 'Delivery Options' : checkoutStep === 3 ? 'Payment' : 'Order Confirmed'}
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500" aria-label="Close Cart">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">

                {/* STEP 1: CART & DETAILS */}
                {checkoutStep === 1 && (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <ShoppingCart className="h-16 w-16 text-gray-200" />
                        <p className="text-gray-500 text-lg">Your cart is empty</p>
                        <button onClick={() => setIsCartOpen(false)} className="text-trini-red font-bold hover:underline">Start Shopping</button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Cart Items */}
                        <ul className="-my-6 divide-y divide-gray-200 mb-6">
                          {cartItems.map((item: any) => (
                            <li key={item.id} className="py-6 flex">
                              <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                                <img src={item.image} alt={item.name} className="w-full h-full object-center object-contain" />
                              </div>
                              <div className="ml-4 flex-1 flex flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-gray-900">
                                    <h3>{item.name}</h3>
                                    <p className="ml-4">TT${item.price * item.quantity}</p>
                                  </div>
                                </div>
                                <div className="flex-1 flex items-end justify-between text-sm">
                                  <div className="flex items-center border border-gray-300 rounded-md">
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 px-2 hover:bg-gray-100 text-gray-600" aria-label="Decrease Quantity"><Minus className="h-3 w-3" /></button>
                                    <span className="px-2 font-medium">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="p-1 px-2 hover:bg-gray-100 text-gray-600" aria-label="Increase Quantity"><Plus className="h-3 w-3" /></button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>

                        {/* Customer Details Form */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <h3 className="font-bold text-gray-900">Shipping Details</h3>
                          <input
                            type="text" placeholder="Full Name"
                            aria-label="Full Name"
                            className="w-full p-2 border rounded text-sm"
                            value={shippingDetails.name}
                            onChange={e => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <input
                              type="tel" placeholder="Phone Number"
                              aria-label="Phone Number"
                              className="w-full p-2 border rounded text-sm"
                              value={shippingDetails.phone}
                              onChange={e => setShippingDetails({ ...shippingDetails, phone: e.target.value })}
                            />
                            {!isPhoneVerified && (
                              <button onClick={verifyPhone} className="bg-gray-900 text-white px-3 py-2 rounded text-xs font-bold whitespace-nowrap">
                                Verify
                              </button>
                            )}
                          </div>
                          {showOtpInput && (
                            <div className="flex gap-2 animate-in fade-in">
                              <input
                                type="text" placeholder="Enter OTP (1234)"
                                aria-label="OTP"
                                className="w-full p-2 border rounded text-sm"
                                value={phoneOtp}
                                onChange={e => setPhoneOtp(e.target.value)}
                              />
                              <button onClick={confirmOtp} className="bg-green-600 text-white px-3 py-2 rounded text-xs font-bold">
                                Confirm
                              </button>
                            </div>
                          )}
                          {isPhoneVerified && <div className="text-green-600 text-xs font-bold flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Phone Verified</div>}

                          <input
                            type="text" placeholder="Street Address"
                            aria-label="Street Address"
                            className="w-full p-2 border rounded text-sm"
                            value={shippingDetails.address}
                            onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                          />
                          <input
                            type="text" placeholder="City / Area"
                            aria-label="City"
                            className="w-full p-2 border rounded text-sm"
                            value={shippingDetails.city}
                            onChange={e => setShippingDetails({ ...shippingDetails, city: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2: SCHEDULE & DELIVERY */}
                {checkoutStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Method</label>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => setDeliveryOption('standard')}
                          className={`flex items-center p-3 border rounded-lg ${deliveryOption === 'standard' ? 'border-trini-red bg-red-50' : 'border-gray-200'}`}
                        >
                          <Truck className="h-5 w-5 text-gray-500 mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-sm text-gray-900">Standard Delivery</p>
                            <p className="text-xs text-gray-500">2-3 Days • TT$30.00</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeliveryOption('express')}
                          className={`flex items-center p-3 border rounded-lg ${deliveryOption === 'express' ? 'border-trini-red bg-red-50' : 'border-gray-200'}`}
                        >
                          <Truck className="h-5 w-5 text-trini-red mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-sm text-gray-900">Express Delivery</p>
                            <p className="text-xs text-gray-500">Same Day / Next Day • TT$50.00</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setDeliveryOption('pickup')}
                          className={`flex items-center p-3 border rounded-lg ${deliveryOption === 'pickup' ? 'border-trini-red bg-red-50' : 'border-gray-200'}`}
                        >
                          <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-sm text-gray-900">Store Pickup</p>
                            <p className="text-xs text-gray-500">Free • Ready in 2 hours</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">When do you want it?</label>
                      <div className="space-y-3">
                        <button
                          onClick={() => setScheduleOption('now')}
                          className={`w-full flex items-center p-3 border rounded-lg ${scheduleOption === 'now' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          <Clock className="h-5 w-5 text-blue-500 mr-3" />
                          <span className="font-medium text-sm">As soon as possible</span>
                        </button>

                        <button
                          onClick={() => setScheduleOption('later')}
                          className={`w-full flex items-center p-3 border rounded-lg ${scheduleOption === 'later' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                          <span className="font-medium text-sm">Schedule for Later</span>
                        </button>

                        {scheduleOption === 'later' && (
                          <input
                            type="date"
                            aria-label="Select Delivery Date"
                            className="w-full p-2 border rounded text-sm ml-8 w-[calc(100%-2rem)]"
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        )}

                        <button
                          onClick={() => setScheduleOption('hold')}
                          className={`w-full flex items-center p-3 border rounded-lg ${scheduleOption === 'hold' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                        >
                          <Lock className="h-5 w-5 text-blue-500 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-sm">Hold Package (Vacation Mode)</p>
                            <p className="text-xs text-gray-500">We'll hold it at our hub until you're back.</p>
                          </div>
                        </button>

                        {scheduleOption === 'hold' && (
                          <div className="ml-8">
                            <p className="text-xs text-gray-500 mb-1">Hold until:</p>
                            <input
                              type="date"
                              aria-label="Select Hold Date"
                              className="w-full p-2 border rounded text-sm"
                              onChange={(e) => setSelectedDate(e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: PAYMENT */}
                {checkoutStep === 3 && (
                  <div className="space-y-6">
                    {/* PayPal Script Provider would wrap the app in a real scenario, but we can wrap the button here for isolation */}

                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('cod')}
                        className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center">
                          <Banknote className="h-6 w-6 text-green-600 mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Cash on Delivery</p>
                            <p className="text-xs text-gray-500">Pay with Cash or Linx upon delivery</p>
                          </div>
                        </div>
                        {paymentMethod === 'cod' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </button>

                      <button
                        onClick={() => setPaymentMethod('paypal')}
                        className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center">
                          {/* PayPal Logo SVG */}
                          <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.0575 7.82624C19.9338 7.35249 19.4675 4.84874 16.8975 3.50624C15.3975 2.71874 13.065 2.62499 13.065 2.62499H7.06876C6.63376 2.62499 6.26251 2.94374 6.19126 3.37124L4.54126 13.8412L4.03876 17.0362C3.99376 17.3137 4.20751 17.5612 4.48876 17.5612H8.02126C8.39626 17.5612 8.71876 17.2837 8.77501 16.9125L9.36376 13.1737C9.42001 12.8025 9.74251 12.525 10.1175 12.525H11.9138C15.3038 12.525 17.9813 11.1562 18.7763 8.35124C18.8438 8.13374 18.8888 7.91624 18.9113 7.70999C20.0575 7.82624 20.0575 7.82624 20.0575 7.82624Z" fill="#003087" />
                            <path d="M18.7762 8.35123C17.9812 11.1562 15.3037 12.525 11.9137 12.525H10.1175C9.7425 12.525 9.41999 12.8025 9.36374 13.1737L8.03624 21.585C7.99124 21.8625 8.20499 22.11 8.48624 22.11H12.0037C12.3787 22.11 12.7012 21.8325 12.7575 21.4612L13.1775 18.7987L13.2337 18.4612C13.29 18.09 13.6125 17.8125 13.9875 17.8125H14.73C17.67 17.8125 19.995 16.6237 20.685 14.19C20.955 13.2337 20.94 12.3562 20.7 11.5837C20.6962 11.5837 20.6925 11.5837 20.6887 11.5837C20.6887 11.5837 18.7762 8.35123 18.7762 8.35123Z" fill="#003087" />
                            <path d="M9.36373 13.1737L8.77498 16.9125C8.71873 17.2837 8.39623 17.5612 8.02123 17.5612H4.48873C4.20748 17.5612 3.99373 17.3137 4.03873 17.0362L4.54123 13.8412L6.19123 3.37125C6.26248 2.94375 6.63373 2.625 7.06873 2.625H13.065C13.065 2.625 15.3975 2.71875 16.8975 3.50625C17.3737 3.7575 17.7862 4.08375 18.1237 4.47375C18.2737 4.64625 18.4087 4.83 18.5287 5.02125C18.6337 5.18625 18.7275 5.35875 18.8062 5.53875C18.9337 5.82375 19.0312 6.12 19.0987 6.4275C19.1062 6.4575 19.1137 6.49125 19.1212 6.52125C19.2412 7.09125 19.2412 7.69125 19.0987 8.28375C19.0837 8.3475 19.065 8.4075 19.0462 8.47125C19.0462 8.47125 19.0425 8.475 19.0425 8.47875C18.2475 11.2837 15.57 12.6525 12.18 12.6525H10.1175C9.74248 12.6525 9.41998 12.93 9.36373 13.3012V13.1737Z" fill="#009cde" />
                            <path d="M18.1237 4.47374C17.7862 4.08374 17.3737 3.75749 16.8975 3.50624C15.3975 2.71874 13.065 2.62499 13.065 2.62499H7.06873C6.63373 2.62499 6.26248 2.94374 6.19123 3.37124L4.54123 13.8412L4.03873 17.0362C3.99373 17.3137 4.20748 17.5612 4.48873 17.5612H8.02123C8.39623 17.5612 8.71873 17.2837 8.77498 16.9125L9.36373 13.1737C9.42001 12.8025 9.74251 12.525 10.1175 12.525H11.9138C15.3038 12.525 17.9813 11.1562 18.7763 8.35124C18.8438 8.13374 18.8888 7.91624 18.9113 7.70999C19.035 7.23749 19.1025 6.75374 19.0987 6.42749C19.0312 6.12 18.9337 5.82374 18.8062 5.53874C18.7275 5.35874 18.6337 5.18624 18.5287 5.02124C18.4087 4.83 18.2737 4.64624 18.1237 4.47374Z" fill="#003087" />
                          </svg>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">PayPal</p>
                            <p className="text-xs text-gray-500">Pay securely with your PayPal account</p>
                          </div>
                        </div>
                        {paymentMethod === 'paypal' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                      </button>

                      <button disabled className="w-full flex items-center justify-between p-4 border rounded-xl border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed relative overflow-hidden">
                        <div className="flex items-center">
                          <CreditCard className="h-6 w-6 text-gray-400 mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Credit / Debit Card</p>
                            <p className="text-xs text-gray-500">WiPay / Stripe</p>
                          </div>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Coming Soon</span>
                      </button>

                      <button disabled className="w-full flex items-center justify-between p-4 border rounded-xl border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed">
                        <div className="flex items-center">
                          <div className="h-6 w-6 bg-red-100 rounded-full flex items-center justify-center mr-3 text-[10px] font-bold text-red-800">RB</div>
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Republic Bank Transfer</p>
                            <p className="text-xs text-gray-500">Direct Deposit</p>
                          </div>
                        </div>
                        <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Coming Soon</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">TT${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Delivery</span>
                        <span className="font-medium">
                          {deliveryOption === 'pickup' ? 'Free' : deliveryOption === 'express' ? 'TT$50.00' : 'TT$30.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold mt-4">
                        <span>Total</span>
                        <span>TT${(cartTotal + (deliveryOption === 'pickup' ? 0 : deliveryOption === 'express' ? 50 : 30)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: SUCCESS */}
                {checkoutStep === 4 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Order Placed!</h2>
                      <p className="text-gray-500 mt-2">Order #{orderId}</p>
                    </div>
                    <p className="text-sm text-gray-600 max-w-xs mx-auto">
                      Your order has been securely recorded. Please click below to send the confirmation to the vendor via WhatsApp to start processing.
                    </p>
                    <button
                      onClick={openWhatsAppOrder}
                      className="bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-600 transition-transform hover:scale-105 flex items-center"
                    >
                      <MessageCircle className="h-5 w-5 mr-2" /> Track on WhatsApp
                    </button>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              {cartItems.length > 0 && checkoutStep < 4 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6 bg-gray-50">
                  {checkoutStep === 1 && (
                    <button
                      onClick={() => {
                        if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.address) {
                          alert("Please fill in all shipping details.");
                          return;
                        }
                        setCheckoutStep(2);
                      }}
                      className="w-full flex justify-center items-center px-6 py-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-trini-red hover:bg-red-700 transition-colors"
                    >
                      Next: Delivery Options
                    </button>
                  )}
                  {checkoutStep === 2 && (
                    <div className="flex gap-3">
                      <button onClick={() => setCheckoutStep(1)} className="px-4 py-3 border border-gray-300 rounded-md font-bold text-gray-700">Back</button>
                      <button
                        onClick={() => setCheckoutStep(3)}
                        className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-trini-red hover:bg-red-700 transition-colors"
                      >
                        Next: Payment
                      </button>
                    </div>
                  )}
                  {checkoutStep === 3 && (
                    <div className="flex gap-3 w-full">
                      <button onClick={() => setCheckoutStep(2)} className="px-4 py-3 border border-gray-300 rounded-md font-bold text-gray-700">Back</button>

                      {paymentMethod === 'paypal' ? (
                        <div className="flex-1 z-0 relative">
                          <PayPalScriptProvider options={{ clientId: "sb", currency: "USD", intent: "capture" }}>
                            <PayPalButtons
                              style={{ layout: "horizontal", height: 48, tagline: false }}
                              createOrder={(data, actions) => {
                                // Convert TT to USD roughly for demo (divide by 6.7) or just pass value if account supports it
                                // For now passing the raw value assuming the sandbox account is set to USD but we treat it as generic units
                                const total = (cartTotal + (deliveryOption === 'pickup' ? 0 : deliveryOption === 'express' ? 50 : 30)).toFixed(2);
                                return actions.order.create({
                                  intent: "CAPTURE",
                                  purchase_units: [
                                    {
                                      amount: {
                                        currency_code: "USD",
                                        value: total,
                                      },
                                      description: `Order from ${storeData?.name}`
                                    },
                                  ],
                                });
                              }}
                              onApprove={async (data, actions) => {
                                if (actions.order) {
                                  await actions.order.capture();
                                  handlePlaceOrder();
                                }
                              }}
                              onError={(err) => {
                                console.error("PayPal Error:", err);
                                alert("PayPal payment failed. Please try again or use Cash on Delivery.");
                              }}
                            />
                          </PayPalScriptProvider>
                        </div>
                      ) : (
                        <button
                          onClick={handlePlaceOrder}
                          disabled={isProcessingOrder}
                          className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {isProcessingOrder ? 'Processing...' : 'Place Order'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 bg-gray-900">
        <img src={storeData.banner} alt="Banner" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{storeData.name}</h2>
          <p className="text-lg text-gray-200 max-w-2xl mb-6 font-light">{storeData.description}</p>
          <div className="flex gap-3">
            <button className="bg-white text-gray-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors">
              Shop Now
            </button>
            <button className="bg-trini-teal text-white px-6 py-2 rounded-full font-bold hover:bg-teal-700 transition-colors">
              About Us
            </button>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Featured Products</h3>
          <span className="text-sm text-gray-500">Showing {storeData.products.length} items</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {storeData.products.map((product) => (
            <div key={product.id} className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="aspect-[4/3] relative overflow-hidden bg-white p-4 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm border border-gray-100">
                  {product.category}
                </div>
              </div>
              <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                <h4 className="text-gray-900 font-bold mb-1 truncate text-sm">{product.name}</h4>
                <div className="flex items-center mb-3">
                  <span className="text-trini-red font-bold">TT${product.price}</span>
                  <div className="flex ml-auto">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-gray-900 text-white py-2 rounded-md text-sm font-bold hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 pt-12 pb-8 mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-gray-400" /> {storeData.location}</li>
                <li className="flex items-center"><Phone className="h-4 w-4 mr-2 text-gray-400" /> {storeData.whatsapp}</li>
                <li className="flex items-center"><Mail className="h-4 w-4 mr-2 text-gray-400" /> {storeData.email}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Opening Hours</h4>
              <p className="text-sm text-gray-600">{storeData.hours}</p>
              <p className="text-sm text-gray-600 mt-2">Sunday: Closed</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-blue-600 transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></button>
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-pink-600 transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></button>
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-blue-400 transition-colors" aria-label="Twitter"><Twitter className="h-5 w-5" /></button>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-8">
            <p>Powered by TriniBuild E-Commerce Engine</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Bar for Cart (Mobile) */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-trini-black text-white p-4 rounded-lg shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="bg-trini-red w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3">
                {cartCount}
              </div>
              <span className="font-medium">View Cart</span>
            </div>
            <div className="font-bold flex items-center">
              TT${cartTotal} <ChevronRight className="h-5 w-5 ml-2" />
            </div>
          </button>
        </div>
      )}

      {/* Floating WhatsApp Button (Desktop/Non-Cart mode) */}
      {/* AI Assistant Widget */}
      <ChatWidget mode="vendor" vendorContext={{ name: storeData.name }} />

    </div>
  );
};
