import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Search, MessageCircle, ArrowRight, Store as StoreIcon, Loader2, Package } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ── Island config ──────────────────────────────────────────────────────────
// Maps island id (as stored in DB) → { flag, name, currencySymbol, currencyCode }
const ISLAND_CONFIG: Record<string, { flag: string; name: string; currencySymbol: string; currencyCode: string }> = {
  tt: { flag: '🇹🇹', name: 'Trinidad & Tobago', currencySymbol: 'TT$', currencyCode: 'TTD' },
  jm: { flag: '🇯🇲', name: 'Jamaica', currencySymbol: 'J$', currencyCode: 'JMD' },
  bb: { flag: '🇧🇧', name: 'Barbados', currencySymbol: 'Bds$', currencyCode: 'BBD' },
  gy: { flag: '🇬🇾', name: 'Guyana', currencySymbol: 'G$', currencyCode: 'GYD' },
  lc: { flag: '🇱🇨', name: 'St. Lucia', currencySymbol: 'EC$', currencyCode: 'XCD' },
  gd: { flag: '🇬🇩', name: 'Grenada', currencySymbol: 'EC$', currencyCode: 'XCD' },
  vc: { flag: '🇻🇨', name: 'St. Vincent', currencySymbol: 'EC$', currencyCode: 'XCD' },
  ag: { flag: '🇦🇬', name: 'Antigua', currencySymbol: 'EC$', currencyCode: 'XCD' },
  other: { flag: '🌴', name: 'Eastern Caribbean', currencySymbol: 'US$', currencyCode: 'USD' },
};

// Pills shown in header — value is the island id to filter by (or 'all')
const ISLAND_PILLS: { label: string; value: string }[] = [
  { label: 'All 🌍', value: 'all' },
  { label: 'T&T 🇹🇹', value: 'tt' },
  { label: 'Jamaica 🇯🇲', value: 'jm' },
  { label: 'Barbados 🇧🇧', value: 'bb' },
  { label: 'Guyana 🇬🇾', value: 'gy' },
  { label: 'Eastern Caribbean 🌴', value: 'ec' }, // special: matches lc/gd/vc/ag/other
];

const CATEGORY_PILLS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: '🍽️ Food', value: 'food' },
  { label: '👗 Fashion', value: 'fashion' },
  { label: '💄 Beauty', value: 'beauty' },
  { label: '🛠️ Services', value: 'services' },
  { label: '📱 Electronics', value: 'electronics' },
  { label: '📦 Other', value: 'other' },
];

const EC_ISLAND_IDS = ['lc', 'gd', 'vc', 'ag', 'other'];

// 6 islands highlighted in bottom section
const FEATURED_ISLANDS: { id: string; name: string; flag: string }[] = [
  { id: 'tt', name: 'Trinidad & Tobago', flag: '🇹🇹' },
  { id: 'jm', name: 'Jamaica', flag: '🇯🇲' },
  { id: 'bb', name: 'Barbados', flag: '🇧🇧' },
  { id: 'gy', name: 'Guyana', flag: '🇬🇾' },
  { id: 'lc', name: 'St. Lucia', flag: '🇱🇨' },
  { id: 'gd', name: 'Grenada', flag: '🇬🇩' },
];

const getIslandConfig = (island: string | null | undefined) =>
  (island && ISLAND_CONFIG[island]) || ISLAND_CONFIG.other;

const getIslandFlag = (island: string | null | undefined) => getIslandConfig(island).flag;
const getCurrencySymbol = (island: string | null | undefined) => getIslandConfig(island).currencySymbol;

// ── Types ───────────────────────────────────────────────────────────────────
interface Store {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  island?: string | null;
  description?: string | null;
  logo_url?: string | null;
  color_scheme?: { primary?: string; secondary?: string } | null;
  whatsapp?: string | null;
  phone?: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  price: number | null;
  images?: Array<{ url?: string; alt?: string }> | null;
  category?: string | null;
  store_id: string;
  stores?: { name: string; slug: string; island?: string | null } | null;
}

interface IslandCount {
  island: string;
  count: number;
}

// ── Skeletons ──────────────────────────────────────────────────────────────
const StoreCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-20 bg-gray-200" />
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded mt-3" />
      <div className="h-3 bg-gray-100 rounded w-5/6 mt-2" />
      <div className="h-9 bg-gray-100 rounded-lg mt-4" />
    </div>
  </div>
);

const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-3 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  </div>
);

// ── Store Card ──────────────────────────────────────────────────────────────
const StoreCard: React.FC<{ store: Store }> = ({ store }) => {
  const primaryColor =
    store.color_scheme?.primary || '#DC2626';
  const flag = getIslandFlag(store.island);
  const initial = (store.name || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Color banner */}
      <div className="h-20 relative" style={{ backgroundColor: primaryColor }}>
        {/* WhatsApp icon top-right if present */}
        {store.whatsapp && (
          <a
            href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:bg-white transition-colors"
            aria-label={`WhatsApp ${store.name}`}
          >
            <MessageCircle size={16} className="text-green-600" />
          </a>
        )}
      </div>

      {/* Logo + content */}
      <div className="px-4 pb-4 -mt-8 flex-1 flex flex-col">
        {/* Logo / avatar */}
        <div className="w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center overflow-hidden bg-white">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) parent.innerHTML = `<span class="text-2xl font-black text-gray-700">${initial}</span>`;
              }}
            />
          ) : (
            <span className="text-2xl font-black text-gray-700">{initial}</span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <h3 className="font-bold text-gray-900 text-base truncate flex-1">{store.name}</h3>
          <span title={getIslandConfig(store.island).name} className="text-lg leading-none">
            {flag}
          </span>
        </div>

        {store.category && (
          <span className="inline-block mt-1 self-start text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
            {store.category}
          </span>
        )}

        {store.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-snug">
            {store.description}
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            to={`/store/${store.slug}`}
            className="flex items-center justify-center gap-1 w-full px-3 py-2 rounded-lg font-bold text-sm text-white transition-colors"
            style={{ backgroundColor: primaryColor }}
          >
            Visit Store <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Product Card ───────────────────────────────────────────────────────────
const ProductCard: React.FC<{ product: ProductRow }> = ({ product }) => {
  const store = product.stores;
  const currency = getCurrencySymbol(store?.island);
  const firstImage = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]?.url
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={product.images?.[0]?.alt || product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={32} />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-sm font-bold text-gray-900 mt-1">
          {currency}
          {Number(product.price ?? 0).toFixed(2)}
        </p>
        {store?.name && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{store.name}</p>
        )}
        <div className="mt-auto pt-2">
          <Link
            to={store?.slug ? `/store/${store.slug}` : '/explore'}
            className="inline-block text-xs font-semibold text-red-600 hover:text-red-700"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Pill ────────────────────────────────────────────────────────────────────
const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
      active
        ? 'bg-white text-gray-900 shadow-sm'
        : 'bg-white/20 text-white hover:bg-white/30'
    }`}
  >
    {children}
  </button>
);

// ── Main Page ───────────────────────────────────────────────────────────────
export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ island?: string }>();

  // Resolve island param (e.g. /explore/jamaica) → island id
  const paramIsland = useMemo(() => {
    if (!params.island) return 'all';
    const v = params.island.toLowerCase();
    const map: Record<string, string> = {
      'tnt': 'tt', 'tt': 'tt', 'trinidad': 'tt', 'tobago': 'tt',
      'jamaica': 'jm', 'jm': 'jm',
      'barbados': 'bb', 'bb': 'bb',
      'guyana': 'gy', 'gy': 'gy',
      'stlucia': 'lc', 'st-lucia': 'lc', 'lucia': 'lc', 'lc': 'lc',
      'grenada': 'gd', 'gd': 'gd',
      'stvincent': 'vc', 'st-vincent': 'vc', 'vincent': 'vc', 'vc': 'vc',
      'antigua': 'ag', 'ag': 'ag',
      'easterncaribbean': 'ec', 'eastern-caribbean': 'ec', 'eastern': 'ec', 'ec': 'ec', 'caribbean': 'ec',
    };
    return map[v] || 'all';
  }, [params.island]);

  const [search, setSearch] = useState('');
  const [islandFilter, setIslandFilter] = useState<string>(paramIsland);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [islandCounts, setIslandCounts] = useState<Record<string, number>>({});

  // sync filter when URL param changes
  useEffect(() => {
    setIslandFilter(paramIsland);
  }, [paramIsland]);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, category, island, description, logo_url, color_scheme, whatsapp, phone')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setStores((data || []) as Store[]);
    } catch (err) {
      console.error('Failed to load stores:', err);
      setStores([]);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Fetch latest products
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images, category, store_id, stores(name, slug, island)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setProducts((data || []) as ProductRow[]);
    } catch (err) {
      console.error('Failed to load products:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch island counts (active stores per island)
  const fetchIslandCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('island')
        .eq('status', 'active');

      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((row: { island?: string | null }) => {
        const key = row.island || 'other';
        counts[key] = (counts[key] || 0) + 1;
      });
      setIslandCounts(counts);
    } catch (err) {
      console.error('Failed to load island counts:', err);
    }
  }, []);

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchIslandCounts();
  }, [fetchStores, fetchProducts, fetchIslandCounts]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      // Island filter
      if (islandFilter !== 'all') {
        if (islandFilter === 'ec') {
          // Eastern Caribbean: lc, gd, vc, ag, other
          if (!EC_ISLAND_IDS.includes(s.island || 'other')) return false;
        } else if ((s.island || 'other') !== islandFilter) {
          return false;
        }
      }
      // Category filter
      if (categoryFilter !== 'all') {
        const cat = (s.category || '').toLowerCase();
        if (cat !== categoryFilter && !cat.includes(categoryFilter)) return false;
      }
      // Search filter
      if (q) {
        const hay = `${s.name} ${s.category || ''} ${s.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stores, search, islandFilter, categoryFilter]);

  const setIslandAndNavigate = (val: string) => {
    setIslandFilter(val);
    // Update URL to reflect filter (without forcing reload)
    if (val === 'all') {
      navigate('/explore', { replace: true });
    } else {
      // Use the raw value as path segment — ExplorePage reads it back via paramIsland
      navigate(`/explore/${val}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-red-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-center">
            Discover Caribbean Businesses
          </h1>
          <p className="mt-3 text-base sm:text-lg text-white/90 text-center max-w-2xl mx-auto">
            Shop local. Support Caribbean entrepreneurs. Get it delivered.
          </p>

          {/* Search */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stores, categories, or products..."
              className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl text-gray-900 bg-white shadow-lg border-0 focus:ring-2 focus:ring-white/50 focus:outline-none text-sm sm:text-base"
            />
          </div>

          {/* Island filter pills */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {ISLAND_PILLS.map((p) => (
              <Pill
                key={p.value}
                active={islandFilter === p.value}
                onClick={() => setIslandAndNavigate(p.value)}
              >
                {p.label}
              </Pill>
            ))}
          </div>

          {/* Category filter pills */}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {CATEGORY_PILLS.map((p) => (
              <button
                key={p.value}
                onClick={() => setCategoryFilter(p.value)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === p.value
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── STORE GRID ─────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {islandFilter === 'all' ? 'All Stores' : `${getIslandConfig(islandFilter).name} Stores`}
            <span className="ml-2 text-sm font-normal text-gray-400">
              {loadingStores ? '…' : `(${filteredStores.length})`}
            </span>
          </h2>
        </div>

        {loadingStores ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4">🌴</div>
            <h3 className="text-lg font-bold text-gray-900">No stores found. Be the first!</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              {search || islandFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your filters, or create your own store in minutes.'
                : 'There are no stores yet. Create your own store in minutes.'}
            </p>
            <Link
              to="/get-started"
              className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 rounded-lg bg-red-600 text-white font-bold text-sm shadow hover:bg-red-700 transition-colors"
            >
              <StoreIcon size={16} /> Create Your Store
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </section>

      {/* ── FEATURED PRODUCTS ──────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Latest Products</h2>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              No products listed yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CARIBBEAN ISLANDS ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-6">
            Shopping Across the Caribbean
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {FEATURED_ISLANDS.map((isl) => {
              const count = islandCounts[isl.id] || 0;
              return (
                <div
                  key={isl.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2">{isl.flag}</div>
                  <p className="font-bold text-gray-900 text-sm">{isl.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {count} {count === 1 ? 'store' : 'stores'}
                  </p>
                  <button
                    onClick={() => setIslandAndNavigate(isl.id)}
                    className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 inline-block"
                  >
                    Browse {isl.name} stores →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExplorePage;
