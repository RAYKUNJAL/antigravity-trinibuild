import React, { useMemo } from 'react';
import { Banknote, Clock, Heart, MapPin, Search, Share2, Shield, ShoppingCart, Sparkles, Star, Truck } from 'lucide-react';
import type { Product, Store } from '../../types';
import type { StoreTemplateSelection } from '../../services/storeTemplateRegistry';

interface StorefrontTemplateRendererProps {
  store: Store;
  products: Product[];
  template: StoreTemplateSelection;
  cartCount: number;
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
  onOpenShare: () => void;
}

const templateStyles = {
  professional: {
    shell: 'bg-slate-50 text-slate-950',
    hero: 'bg-slate-950 text-white',
    accent: 'text-slate-950',
    button: 'bg-slate-950 hover:bg-slate-800 text-white',
    chip: 'bg-white/10 text-white border-white/20',
    card: 'rounded-lg border border-slate-200 bg-white',
  },
  fashion: {
    shell: 'bg-stone-50 text-stone-950',
    hero: 'bg-[#171412] text-white',
    accent: 'text-[#9f1239]',
    button: 'bg-[#9f1239] hover:bg-[#881337] text-white',
    chip: 'bg-white/10 text-white border-white/20',
    card: 'rounded-sm border border-stone-200 bg-white',
  },
  restaurant: {
    shell: 'bg-amber-50 text-stone-950',
    hero: 'bg-[#2a1306] text-amber-50',
    accent: 'text-orange-700',
    button: 'bg-orange-700 hover:bg-orange-800 text-white',
    chip: 'bg-amber-100/10 text-amber-50 border-amber-200/20',
    card: 'rounded-lg border border-amber-200 bg-white',
  },
  beauty: {
    shell: 'bg-rose-50 text-stone-950',
    hero: 'bg-[#2b1321] text-white',
    accent: 'text-rose-700',
    button: 'bg-rose-700 hover:bg-rose-800 text-white',
    chip: 'bg-white/10 text-white border-white/20',
    card: 'rounded-lg border border-rose-100 bg-white',
  },
  ecommerce: {
    shell: 'bg-zinc-50 text-zinc-950',
    hero: 'bg-zinc-950 text-white',
    accent: 'text-blue-700',
    button: 'bg-blue-700 hover:bg-blue-800 text-white',
    chip: 'bg-white/10 text-white border-white/20',
    card: 'rounded-lg border border-zinc-200 bg-white',
  },
} as const;

const money = (value: number) => `TT$${value.toFixed(2)}`;

const TRUST_ITEMS = [
  { label: 'Secure checkout', icon: Shield },
  { label: 'Fast local delivery', icon: Truck },
  { label: 'Cash on delivery', icon: Banknote },
  { label: 'WhatsApp ready', icon: Clock },
];

export const StorefrontTemplateRenderer: React.FC<StorefrontTemplateRendererProps> = ({
  store,
  products,
  template,
  cartCount,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onAddToCart,
  onOpenCart,
  onOpenShare,
}) => {
  const style = templateStyles[template.customerTemplateKey] || templateStyles.professional;
  const primaryColor = store.color_scheme?.primary;

  const categories = useMemo(() => {
    const unique = new Set(products.map(product => product.category).filter(Boolean) as string[]);
    return ['all', ...Array.from(unique)];
  }, [products]);

  const topProducts = products.slice(0, 3);

  return (
    <div
      className={`min-h-screen ${style.shell}`}
      style={primaryColor ? ({ '--store-primary': primaryColor } as React.CSSProperties) : undefined}
    >
      <div className={`${style.hero}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-11 w-11 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center font-black">
                  {store.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-black truncate">{store.name}</h1>
                <p className="text-xs opacity-70 truncate">{template.name} · {template.islandUseCase}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onOpenShare} className="p-2 rounded-full hover:bg-white/10" aria-label="Share store">
                <Share2 className="h-5 w-5" />
              </button>
              <button onClick={onOpenCart} className="relative p-2 rounded-full hover:bg-white/10" aria-label="Open cart">
                <ShoppingCart className="h-6 w-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center py-12 lg:py-16">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold ${style.chip}`}>
                <Sparkles className="h-3.5 w-3.5" />
                Built for Trinidad & Tobago
              </div>
              <h2 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight max-w-3xl">
                {store.tagline || store.description || `Shop ${store.name} online`}
              </h2>
              <p className="mt-5 text-base sm:text-lg opacity-80 max-w-2xl">
                Cash on delivery, pickup, and local support. Browse live products from this verified TriniBuild store.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href="#products" className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-black ${style.button}`}>
                  Shop products
                </a>
                <button onClick={onOpenShare} className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-black bg-white/10 hover:bg-white/15 text-white border border-white/15">
                  Share store
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(topProducts.length ? topProducts : [null, null, null]).map((product, index) => (
                <div key={product?.id || index} className="bg-white/10 border border-white/10 rounded-lg p-3 backdrop-blur">
                  <div className="aspect-square rounded-md bg-white/10 overflow-hidden flex items-center justify-center">
                    {product?.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-8 w-8 opacity-50" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-bold truncate">{product?.name || 'Product preview'}</p>
                  <p className="text-xs opacity-70">{product ? money(product.price) : 'TT$0.00'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TRUST_ITEMS.map(({ label, icon: Icon }) => (
            <div key={label} className={`${style.card} p-4 text-center shadow-sm`}>
              <Icon className={`h-6 w-6 mx-auto mb-2 ${style.accent}`} />
              <p className="text-xs sm:text-sm font-black">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-3xl font-black">Shop {store.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{products.length} live products · {template.category}</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search products"
              className="w-full pl-9 pr-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border ${
                selectedCategory === category ? `${style.button} border-transparent` : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <div className={`${style.card} p-12 text-center`}>
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-black">Products coming soon</h4>
            <p className="text-gray-500 mt-2">This seller is still setting up their storefront.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${template.customerTemplateKey === 'fashion' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
            {products.map(product => (
              <article key={product.id} className={`${style.card} overflow-hidden shadow-sm hover:shadow-xl transition-shadow group`}>
                <div className={`${template.customerTemplateKey === 'fashion' ? 'aspect-[4/5]' : 'aspect-square'} bg-gray-100 overflow-hidden`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <ShoppingCart className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-black text-sm sm:text-base line-clamp-2">{product.name}</h4>
                    <button className="text-gray-300 hover:text-red-500" aria-label="Save product">
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-yellow-500">
                    {[...Array(5)].map((_, index) => <Star key={index} className="h-3 w-3 fill-current" />)}
                    <span className="text-[11px] text-gray-500 ml-1">Verified</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className={`text-lg font-black ${style.accent}`}>{money(product.price)}</p>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <p className="text-xs text-gray-400 line-through">{money(product.compare_at_price)}</p>
                      )}
                    </div>
                    <button onClick={() => onAddToCart(product)} className={`px-3 py-2 rounded-lg text-xs font-black ${style.button}`}>
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className={`${style.card} mt-10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
          <div className="flex items-start gap-3">
            <MapPin className={`h-5 w-5 mt-1 ${style.accent}`} />
            <div>
              <h4 className="font-black">Local business, island-ready checkout</h4>
              <p className="text-sm text-gray-600">{store.location || 'Trinidad & Tobago'} · COD, pickup, delivery, and WhatsApp support.</p>
            </div>
          </div>
          <button onClick={onOpenCart} className={`px-5 py-3 rounded-lg font-black ${style.button}`}>
            View cart
          </button>
        </div>
      </main>
    </div>
  );
};

export default StorefrontTemplateRenderer;
