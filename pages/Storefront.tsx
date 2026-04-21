import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CODCheckout } from '../components/CODCheckout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Search, X, Star, MessageCircle, MapPin,
  Plus, Minus, Trash2, ChevronRight, ChevronLeft, Truck,
  CheckCircle, ArrowLeft, SlidersHorizontal, Heart, Share2,
  Package, Clock, Shield
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { storeService, Store } from '../services/storeService';
import { orderService, CreateOrderData } from '../services/orderService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
}

interface Product {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  stock?: number;
  rating?: number;
  reviews?: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const ProductSkeleton = () => (
  <div className="animate-pulse">
    <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
    <div className="h-4 bg-gray-100 rounded mb-2 w-3/4" />
    <div className="h-4 bg-gray-100 rounded w-1/3" />
  </div>
);

// ─── Nav ──────────────────────────────────────────────────────────────────────
const StorefrontNav: React.FC<{
  store: Store;
  cartCount: number;
  onCartOpen: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  view: 'grid' | 'product';
  onBack: () => void;
}> = ({ store, cartCount, onCartOpen, searchQuery, onSearch, view, onBack }) => (
  <div className="sticky top-0 inset-x-0 z-40">
    {/* Announcement bar */}
    <div
      className="text-white text-xs py-2 px-4 text-center font-semibold tracking-widest"
      style={{ background: '#E61E2B' }}
    >
      🇹🇹 FREE DELIVERY on orders over TT$200 · Pay with Cash, Linx, or Card
    </div>

    {/* Main nav */}
    <header
      className="bg-white border-b"
      style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">

        {/* Left: back / logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {view === 'product' ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {store.logo && (
                <img src={store.logo} alt={store.name} className="h-8 w-8 rounded-full object-cover border border-gray-200" />
              )}
              <span className="font-black text-gray-900 text-lg hidden sm:block" style={{ fontFamily: 'system-ui' }}>
                {store.name}
              </span>
            </div>
          )}
        </div>

        {/* Centre: search */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={e => onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': '#E61E2B' } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Right: cart */}
        <div className="flex items-center gap-3">
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
            >
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          <button
            onClick={onCartOpen}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-white transition-transform active:scale-95"
            style={{ background: '#E61E2B' }}
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  </div>
);

// ─── Refinement Sidebar ───────────────────────────────────────────────────────
const RefinementList: React.FC<{
  categories: string[];
  selected: string;
  onSelect: (c: string) => void;
  sortBy: string;
  onSort: (s: string) => void;
  priceMax: number;
  onPriceMax: (p: number) => void;
}> = ({ categories, selected, onSelect, sortBy, onSort, priceMax, onPriceMax }) => (
  <aside className="w-full lg:w-56 xl:w-64 flex-shrink-0">
    {/* Mobile: horizontal scroll */}
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4">
      {['All', ...categories].map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat === 'All' ? '' : cat)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-all"
          style={
            (cat === 'All' ? selected === '' : selected === cat)
              ? { background: '#E61E2B', color: '#fff', borderColor: '#E61E2B' }
              : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }
          }
        >
          {cat}
        </button>
      ))}
    </div>

    {/* Desktop: sticky sidebar */}
    <div className="hidden lg:block sticky top-24 space-y-6">
      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Categories</h3>
        <ul className="space-y-1">
          {['All', ...categories].map(cat => {
            const active = cat === 'All' ? selected === '' : selected === cat;
            return (
              <li key={cat}>
                <button
                  onClick={() => onSelect(cat === 'All' ? '' : cat)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={active
                    ? { background: '#FEF2F2', color: '#E61E2B', fontWeight: 700 }
                    : { color: '#374151' }
                  }
                >
                  {cat}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Sort by</h3>
        <select
          value={sortBy}
          onChange={e => onSort(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {priceMax > 0 && (
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
            Max Price: TT${priceMax}
          </h3>
          <input
            type="range"
            min={0}
            max={priceMax * 2}
            value={priceMax}
            onChange={e => onPriceMax(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>
      )}
    </div>
  </aside>
);

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard: React.FC<{
  product: Product;
  onAddToCart: (p: Product) => void;
  onClick: (p: Product) => void;
}> = ({ product, onAddToCart, onClick }) => {
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="group cursor-pointer"
      onClick={() => onClick(product)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 mb-3">
        <img
          src={product.image || `https://placehold.co/400x400/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Wishlist */}
        <button
          onClick={e => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-transform active:scale-90"
        >
          <Heart size={14} fill={liked ? '#E61E2B' : 'none'} color={liked ? '#E61E2B' : '#9ca3af'} />
        </button>
        {/* Quick add */}
        <div className="absolute bottom-2 inset-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAdd}
            className="w-full py-2 rounded-lg text-xs font-black text-white transition-all active:scale-95"
            style={{ background: added ? '#16a34a' : '#E61E2B' }}
          >
            {added ? '✓ Added' : '+ Add to Cart'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-0.5">
        {product.category && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{product.category}</p>
        )}
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm font-black" style={{ color: '#E61E2B' }}>TT${product.price.toFixed(2)}</p>
          {product.rating && (
            <span className="flex items-center gap-0.5 text-xs text-gray-500">
              <Star size={10} fill="#FFD700" color="#FFD700" />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Product Detail (openfront 3-column layout) ───────────────────────────────
const ProductDetail: React.FC<{
  product: Product;
  store: Store;
  onAddToCart: (p: Product, qty: number) => void;
  onBack: () => void;
}> = ({ product, store, onAddToCart, onBack }) => {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row lg:items-start gap-8"
    >
      {/* LEFT — product info (desktop sticky) */}
      <div className="hidden lg:flex flex-col lg:sticky lg:top-32 lg:max-w-[280px] w-full gap-6">
        <div>
          {product.category && (
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#E61E2B' }}>
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-black text-gray-900 mt-1 leading-tight">{product.name}</h1>
          {product.rating && (
            <div className="flex items-center gap-1.5 mt-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={13} fill={i <= Math.round(product.rating!) ? '#FFD700' : '#e5e7eb'} color={i <= Math.round(product.rating!) ? '#FFD700' : '#e5e7eb'} />
              ))}
              <span className="text-xs text-gray-500 ml-1">({product.reviews || 0} reviews)</span>
            </div>
          )}
        </div>
        {product.description && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}
        <div className="space-y-2">
          {[
            [Truck, 'Free delivery over TT$200'],
            [Shield, '7-day return policy'],
            [Clock, 'Same-day pickup available'],
          ].map(([Icon, text], i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <Icon size={13} className="text-gray-400 flex-shrink-0" />
              {text as string}
            </div>
          ))}
        </div>
      </div>

      {/* CENTRE — image */}
      <div className="flex-1 min-w-0">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50">
          <img
            src={product.image || `https://placehold.co/800x800/f3f4f6/9ca3af?text=${encodeURIComponent(product.name)}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Mobile info below image */}
        <div className="lg:hidden mt-6 space-y-4">
          {product.category && (
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#E61E2B' }}>
              {product.category}
            </span>
          )}
          <h1 className="text-2xl font-black text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}
        </div>
      </div>

      {/* RIGHT — actions (desktop sticky) */}
      <div className="hidden lg:flex flex-col lg:sticky lg:top-32 lg:max-w-[280px] w-full gap-5">
        <ActionPanel product={product} qty={qty} setQty={setQty} added={added} onAdd={handleAdd} store={store} />
      </div>

      {/* Mobile actions */}
      <div className="lg:hidden w-full">
        <ActionPanel product={product} qty={qty} setQty={setQty} added={added} onAdd={handleAdd} store={store} />
      </div>
    </motion.div>
  );
};

const ActionPanel: React.FC<{
  product: Product;
  qty: number;
  setQty: (q: number) => void;
  added: boolean;
  onAdd: () => void;
  store: Store;
}> = ({ product, qty, setQty, added, onAdd, store }) => (
  <div className="space-y-4">
    <div className="flex items-baseline justify-between">
      <span className="text-3xl font-black" style={{ color: '#E61E2B' }}>
        TT${(product.price * qty).toFixed(2)}
      </span>
      {qty > 1 && (
        <span className="text-sm text-gray-400">TT${product.price.toFixed(2)} each</span>
      )}
    </div>

    {/* Quantity */}
    <div>
      <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 block">Quantity</label>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center font-bold text-lg">{qty}</span>
        <button
          onClick={() => setQty(qty + 1)}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>

    {/* Add to cart */}
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onAdd}
      className="w-full py-3.5 rounded-xl font-black text-white transition-colors"
      style={{ background: added ? '#16a34a' : '#E61E2B' }}
    >
      {added ? '✓ Added to Cart' : 'Add to Cart'}
    </motion.button>

    {/* WhatsApp order */}
    {store.whatsapp && (
      <a
        href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hi, I'd like to order ${qty}x ${product.name} (TT$${(product.price * qty).toFixed(2)}) from ${store.name}`)}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-green-500 text-green-600 font-black text-sm hover:bg-green-50 transition-colors"
      >
        <MessageCircle size={16} /> Order via WhatsApp
      </a>
    )}

    {/* Trust badges */}
    <div className="flex items-center justify-center gap-4 pt-2 border-t border-gray-100">
      {[['🔒','Secure'],['📦','Fast Ship'],['↩️','Easy Return']].map(([e, l]) => (
        <div key={l} className="flex flex-col items-center gap-0.5">
          <span className="text-base">{e}</span>
          <span className="text-xs text-gray-400 font-semibold">{l}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Cart Drawer (openfront slide-out pattern) ────────────────────────────────
const CartDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (id: string | number, qty: number) => void;
  onRemove: (id: string | number) => void;
  onCheckout: () => void;
  store: Store;
}> = ({ isOpen, onClose, items, onUpdateQty, onRemove, onCheckout, store }) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const freeDelivery = subtotal >= 200;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                Your Cart {items.length > 0 && <span className="text-gray-400 font-semibold">({items.length})</span>}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingCart size={48} className="text-gray-200" />
                  <p className="text-gray-500 font-semibold">Your cart is empty</p>
                  <button onClick={onClose} className="text-sm font-black" style={{ color: '#E61E2B' }}>
                    Continue Shopping →
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map(item => (
                    <li key={`${item.id}-${item.variant}`} className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                        <p className="text-sm font-black mt-0.5" style={{ color: '#E61E2B' }}>
                          TT${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdateQty(item.id, Math.max(0, item.quantity - 1))}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            onClick={() => onRemove(item.id)}
                            className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                {!freeDelivery && (
                  <div className="bg-amber-50 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-amber-700 font-semibold">
                      Add TT${(200 - subtotal).toFixed(2)} more for free delivery!
                    </p>
                    <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subtotal / 200) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-black text-lg">TT${subtotal.toFixed(2)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCheckout}
                  className="w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2"
                  style={{ background: '#E61E2B' }}
                >
                  Proceed to Checkout <ChevronRight size={16} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Checkout (stepwise, openfront pattern) ───────────────────────────────────
const CheckoutFlow: React.FC<{
  items: CartItem[];
  store: Store;
  onComplete: (orderId: string) => void;
  onBack: () => void;
}> = ({ items, store, onComplete, onBack }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = subtotal >= 200 ? 0 : 30;
  const total = subtotal + delivery;

  const [form, setForm] = useState({
    name: '', phone: '', address: '', city: '', notes: '',
    payment: 'cod' as 'cod' | 'bank_transfer',
    delivery: 'standard' as 'standard' | 'express' | 'pickup',
  });

  const steps = ['Details', 'Delivery', 'Review'];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const orderData: CreateOrderData = {
        storeId: store.id!,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        customerName: form.name,
        customerPhone: form.phone,
        deliveryAddress: `${form.address}, ${form.city}`,
        notes: form.notes,
        totalAmount: total,
        paymentMethod: form.payment,
        deliveryMethod: form.delivery,
      };
      const order = await orderService.createOrder(orderData);
      onComplete(order.id || 'TRN-' + Date.now());
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={step > i + 1
                  ? { background: '#16a34a', color: '#fff' }
                  : step === i + 1
                  ? { background: '#E61E2B', color: '#fff' }
                  : { background: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-bold ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          {step === 1 && (
            <>
              <h2 className="text-lg font-black">Your Details</h2>
              {[
                ['name', 'Full Name', 'text'],
                ['phone', 'Phone Number (WhatsApp)', 'tel'],
                ['address', 'Delivery Address', 'text'],
                ['city', 'City / Area', 'text'],
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Order Notes (optional)</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"
                  placeholder="Any special instructions?"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-black">Delivery &amp; Payment</h2>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 block">Delivery Method</label>
                <div className="space-y-2">
                  {[
                    ['standard', 'Standard Delivery', '2–4 days · TT$30 (free over $200)', delivery === 0 && form.delivery === 'standard' ? 'FREE' : `TT$30`],
                    ['express', 'Express Delivery', 'Next day · TT$60', 'TT$60'],
                    ['pickup', 'Store Pickup', 'Ready in 2 hours · Free', 'FREE'],
                  ].map(([val, title, sub, price]) => (
                    <label key={val} className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors"
                      style={form.delivery === val ? { borderColor: '#E61E2B', background: '#FEF2F2' } : { borderColor: '#e5e7eb' }}>
                      <input type="radio" name="delivery" value={val} checked={form.delivery === val as any} onChange={() => setForm({ ...form, delivery: val as any })} className="accent-red-600" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{title}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                      <span className="text-sm font-black" style={{ color: '#E61E2B' }}>{price}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 block">Payment Method</label>
                <div className="space-y-2">
                  {[
                    ['cod', 'Cash on Delivery', 'Pay when your order arrives'],
                    ['bank_transfer', 'Bank Transfer / Linx', 'We\'ll send you payment details'],
                  ].map(([val, title, sub]) => (
                    <label key={val} className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors"
                      style={form.payment === val ? { borderColor: '#E61E2B', background: '#FEF2F2' } : { borderColor: '#e5e7eb' }}>
                      <input type="radio" name="payment" value={val} checked={form.payment === val as any} onChange={() => setForm({ ...form, payment: val as any })} className="accent-red-600" />
                      <div>
                        <p className="text-sm font-bold">{title}</p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-black">Review Your Order</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                    <div className="flex-1">
                      <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-black">TT${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Delivering to</span><span className="font-semibold text-right max-w-[180px]">{form.address}, {form.city}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Phone</span><span className="font-semibold">{form.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Payment</span><span className="font-semibold capitalize">{form.payment.replace('_', ' ')}</span></div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : onBack()}
              className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {step === 1 ? '← Back to Store' : '← Back'}
            </button>
            {step < 3 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep((step + 1) as 2 | 3)}
                className="flex-1 py-3 rounded-xl font-black text-white"
                style={{ background: '#E61E2B' }}
              >
                Continue →
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-black text-white disabled:opacity-60"
                style={{ background: submitting ? '#9ca3af' : '#E61E2B' }}
              >
                {submitting ? 'Placing Order…' : 'Place Order'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="bg-gray-50 rounded-2xl p-6 h-fit sticky top-24">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between"><span className="text-gray-600">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span><span className="font-semibold">TT${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className={`font-semibold ${delivery === 0 ? 'text-green-600' : ''}`}>{delivery === 0 ? 'FREE' : `TT$${delivery}`}</span></div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between text-base"><span className="font-black">Total</span><span className="font-black" style={{ color: '#E61E2B' }}>TT${total.toFixed(2)}</span></div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-200 pt-4">
            <Shield size={12} className="flex-shrink-0" />
            Secure order processed by {store.name}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Order Confirmed ──────────────────────────────────────────────────────────
const OrderConfirmed: React.FC<{ orderId: string; store: Store; onContinue: () => void }> = ({ orderId, store, onContinue }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md mx-auto px-4 py-16 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
      <CheckCircle size={40} className="text-green-600" />
    </div>
    <h1 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h1>
    <p className="text-gray-500 mb-1">Order ID: <span className="font-bold text-gray-700">{orderId}</span></p>
    <p className="text-sm text-gray-500 mb-8">
      {store.whatsapp
        ? `${store.name} will contact you on WhatsApp to confirm delivery.`
        : `${store.name} will contact you shortly to confirm your order.`}
    </p>
    {store.whatsapp && (
      <a
        href={`https://wa.me/${store.whatsapp}?text=${encodeURIComponent(`Hi, I just placed order ${orderId}`)}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 border-green-500 text-green-600 font-black mb-3"
      >
        <MessageCircle size={16} /> Chat with {store.name}
      </a>
    )}
    <button
      onClick={onContinue}
      className="w-full py-3.5 rounded-xl font-black text-white"
      style={{ background: '#E61E2B' }}
    >
      Continue Shopping
    </button>
  </motion.div>
);

// ─── Main Storefront ──────────────────────────────────────────────────────────
export const Storefront: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state
  const [view, setView] = useState<'grid' | 'product' | 'checkout' | 'confirmed'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // Refinement state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceMax, setPriceMax] = useState(0);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        if (id) {
          const data = await storeService.getStoreById(id);
          setStore(data);
          const maxP = Math.max(...(data.products || []).map((p: any) => p.price || 0));
          setPriceMax(maxP || 0);
        } else {
          const active = localStorage.getItem('trinibuild_active_store');
          if (active) {
            const data = JSON.parse(active);
            setStore(data);
            const maxP = Math.max(...(data.products || []).map((p: any) => p.price || 0));
            setPriceMax(maxP || 0);
          } else {
            setError('No store found.');
          }
        }
      } catch {
        setError('Store not found.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const products: Product[] = useMemo(() => store?.products || [], [store]);

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category).filter(Boolean))] as string[],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (priceMax > 0) list = list.filter(p => p.price <= priceMax);
    switch (sortBy) {
      case 'price_asc': return [...list].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...list].sort((a, b) => b.price - a.price);
      case 'popular': return [...list].sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      default: return list;
    }
  }, [products, searchQuery, selectedCategory, sortBy, priceMax]);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: qty }];
    });
  }, []);

  const updateQty = useCallback((id: string | number, qty: number) => {
    setCartItems(prev => qty === 0 ? prev.filter(i => i.id !== id) : prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="space-y-4 w-48">
        {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${80 - i * 15}%` }} />)}
      </div>
    </div>
  );

  if (error || !store) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <Package size={48} className="text-gray-200 mb-4" />
      <h2 className="text-xl font-black text-gray-900 mb-2">Store Not Found</h2>
      <p className="text-gray-500 mb-6">{error}</p>
      <button onClick={() => navigate('/directory')} className="px-6 py-3 rounded-xl font-black text-white" style={{ background: '#E61E2B' }}>
        Browse Directory
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <StorefrontNav
        store={store}
        cartCount={cartCount}
        onCartOpen={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        view={view === 'product' ? 'product' : 'grid'}
        onBack={() => { setView('grid'); setSelectedProduct(null); }}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        onCheckout={() => { setCartOpen(false); setView('checkout'); }}
        store={store}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Store hero (grid view only) */}
        {view === 'grid' && (
          <div
            className="rounded-2xl mt-6 mb-8 px-8 py-12 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #E61E2B 100%)` }}
          >
            {store.banner && (
              <img src={store.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            )}
            <div className="relative z-10">
              {store.logo && <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 mb-4" />}
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{store.name}</h1>
              {store.description && <p className="text-white/70 max-w-lg text-sm leading-relaxed mb-4">{store.description}</p>}
              {store.location && (
                <p className="flex items-center gap-1.5 text-white/50 text-xs">
                  <MapPin size={12} /> {store.location}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Product grid view */}
        {view === 'grid' && (
          <div className="flex flex-col lg:flex-row gap-8 pb-16">
            <RefinementList
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              sortBy={sortBy}
              onSort={setSortBy}
              priceMax={priceMax}
              onPriceMax={setPriceMax}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-gray-900">
                  {selectedCategory || 'All Products'}
                  <span className="ml-2 text-sm font-semibold text-gray-400">({filtered.length})</span>
                </h2>
                {/* Mobile sort */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="lg:hidden text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ProductCard
                        product={product}
                        onAddToCart={p => { addToCart(p); setCartOpen(true); }}
                        onClick={p => { setSelectedProduct(p); setView('product'); window.scrollTo(0, 0); }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product detail view */}
        {view === 'product' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            store={store}
            onAddToCart={(p, qty) => { addToCart(p, qty); setCartOpen(true); }}
            onBack={() => { setView('grid'); setSelectedProduct(null); }}
          />
        )}

        {/* Checkout view — full COD system with TriniRides */}
        {view === 'checkout' && (
          <CODCheckout
            items={cartItems}
            store={store}
            onComplete={(orderId, method) => {
              setConfirmedOrderId(orderId);
              setCartItems([]);
              setView('confirmed');
              window.scrollTo(0, 0);
            }}
            onBack={() => setView('grid')}
          />
        )}

        {/* Confirmed view */}
        {view === 'confirmed' && (
          <OrderConfirmed
            orderId={confirmedOrderId}
            store={store}
            onContinue={() => setView('grid')}
          />
        )}
      </main>
    </div>
  );
};
