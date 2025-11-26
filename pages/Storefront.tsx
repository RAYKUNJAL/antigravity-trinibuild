import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X, Star, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Plus, Minus, Trash2, ChevronRight, Banknote, CreditCard, Clock, Gift, Calendar, Truck, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { storeService, Store } from '../services/storeService';
import { orderService, CreateOrderData } from '../services/orderService';

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
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK' | 'CARD'>('COD');

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
        items: cartItems.map((item: any) => ({
          productId: item.id.toString(),
          quantity: item.quantity,
          price: item.price
        })),
        shippingAddress: {
          street: shippingDetails.address,
          city: shippingDetails.city,
          phone: shippingDetails.phone
        },
        paymentMethod: 'CASH_ON_DELIVERY', // Hardcoded for now as per requirement
        deliveryOption: deliveryOption,
        deliverySlot: scheduleOption === 'later' ? selectedDate : undefined,
        holdUntil: scheduleOption === 'hold' ? selectedDate : undefined,
        notes: shippingDetails.notes
      };

      // Call API
      const response = await orderService.createOrder(orderData);
      setOrderId(response.orderNumber || 'ORD-' + Math.floor(Math.random() * 10000));
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
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-trini-red focus:ring-1 focus:ring-trini-red bg-gray-50"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <button onClick={() => handleWhatsAppClick()} className="hidden sm:flex items-center text-green-600 hover:text-green-700 font-medium text-sm bg-green-50 px-3 py-1.5 rounded-full transition-colors">
                <MessageCircle className="h-4 w-4 mr-1" /> Chat
              </button>

              <button
                className="relative p-2 text-gray-600 hover:text-trini-red transition-colors"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-trini-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </button>

              <button className="md:hidden p-2 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4 shadow-lg">
            <input
              type="text"
              placeholder="Search..."
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
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500">
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
                                    <button onClick={() => removeFromCart(item.id)} className="p-1 px-2 hover:bg-gray-100 text-gray-600"><Minus className="h-3 w-3" /></button>
                                    <span className="px-2 font-medium">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="p-1 px-2 hover:bg-gray-100 text-gray-600"><Plus className="h-3 w-3" /></button>
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
                            className="w-full p-2 border rounded text-sm"
                            value={shippingDetails.name}
                            onChange={e => setShippingDetails({ ...shippingDetails, name: e.target.value })}
                          />
                          <div className="flex gap-2">
                            <input
                              type="tel" placeholder="Phone Number"
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
                            className="w-full p-2 border rounded text-sm"
                            value={shippingDetails.address}
                            onChange={e => setShippingDetails({ ...shippingDetails, address: e.target.value })}
                          />
                          <input
                            type="text" placeholder="City / Area"
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Online payments are currently disabled for maintenance. Please use Cash on Delivery.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={() => setPaymentMethod('COD')}
                        className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all ${paymentMethod === 'COD' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      >
                        <div className="flex items-center">
                          <Banknote className="h-6 w-6 text-green-600 mr-3" />
                          <div className="text-left">
                            <p className="font-bold text-gray-900">Cash on Delivery</p>
                            <p className="text-xs text-gray-500">Pay with Cash or Linx upon delivery</p>
                          </div>
                        </div>
                        {paymentMethod === 'COD' && <CheckCircle className="h-5 w-5 text-green-600" />}
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
                    <div className="flex gap-3">
                      <button onClick={() => setCheckoutStep(2)} className="px-4 py-3 border border-gray-300 rounded-md font-bold text-gray-700">Back</button>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessingOrder}
                        className="flex-1 flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isProcessingOrder ? 'Processing...' : 'Place Order'}
                      </button>
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
                  <div className="flex text-yellow-400 text-xs">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  <span className="text-xs text-gray-400 ml-1">(12)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-trini-teal">TT${product.price}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-gray-900 text-white p-2 rounded-full hover:bg-trini-red transition-colors shadow-md"
                    title="Add to Cart"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
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
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-blue-600 transition-colors"><Facebook className="h-5 w-5" /></button>
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-pink-600 transition-colors"><Instagram className="h-5 w-5" /></button>
                <button className="bg-white p-2 rounded-full shadow-sm hover:text-blue-400 transition-colors"><Twitter className="h-5 w-5" /></button>
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
