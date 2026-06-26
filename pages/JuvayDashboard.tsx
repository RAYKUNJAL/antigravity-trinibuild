import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Store as StoreIcon, Share2, MessageCircle, Crown, Loader2,
  TrendingUp, ShoppingBag, Eye, ArrowRight, Package, Bot, Compass,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { track, trackPageView } from '../services/eventTracker';

// ── Types ───────────────────────────────────────────────────────────────────

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  island: string | null;
  status: string;
}

interface OrderRow {
  id: string;
  order_number: string | null;
  customer_name: string | null;
  total: number | null;
  status: string | null;
  created_at: string;
}

interface TodayStats {
  revenue: number;
  orders: number;
  visitors: number;
}

interface DashboardData {
  store: StoreRow | null;
  productsCount: number;
  todayStats: TodayStats;
  recentOrders: OrderRow[];
  ordersLast7Days: number;
  plan: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const todayIsoRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
};

const sevenDaysAgoIso = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const firstNameFromEmail = (email: string | null | undefined): string => {
  if (!email) return 'there';
  const base = email.split('@')[0];
  return base
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'there';
};

const statusColor = (status: string | null): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('paid') || s.includes('delivered') || s.includes('fulfilled')) return 'bg-green-100 text-green-700';
  if (s.includes('pending')) return 'bg-yellow-100 text-yellow-700';
  if (s.includes('cancel')) return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

// ── Component ───────────────────────────────────────────────────────────────

export const JuvayDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [userName, setUserName] = useState('there');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    trackPageView('/dashboard');
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Name resolution
        let name = '';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          name = profile?.full_name || user.user_metadata?.full_name || '';
        } catch {
          name = user.user_metadata?.full_name || '';
        }
        if (!cancelled) {
          setUserName(name.split(' ')[0] || firstNameFromEmail(user.email));
        }

        // Store
        const { data: storeRows } = await supabase
          .from('stores')
          .select('id, name, slug, category, island, status')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        const store: StoreRow | null = storeRows && storeRows.length > 0 ? storeRows[0] : null;

        if (store) {
          track('dashboard_view', 'merchant', { store_id: store.id });
        }

        // Defaults
        let productsCount = 0;
        let todayStats: TodayStats = { revenue: 0, orders: 0, visitors: 0 };
        let recentOrders: OrderRow[] = [];
        let ordersLast7Days = 0;
        let plan = 'free';

        if (store) {
          // Products count
          const { count: pCount } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id);
          productsCount = pCount ?? 0;

          // Today's orders
          const { start, end } = todayIsoRange();
          const { data: todayOrderRows } = await supabase
            .from('orders')
            .select('id, total, created_at')
            .eq('store_id', store.id)
            .gte('created_at', start)
            .lte('created_at', end);

          const todayOrders = todayOrderRows ?? [];
          const revenue = todayOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
          todayStats = {
            revenue,
            orders: todayOrders.length,
            visitors: 0,
          };

          // Recent orders (last 5)
          const { data: recentRows } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, total, status, created_at')
            .eq('store_id', store.id)
            .order('created_at', { ascending: false })
            .limit(5);
          recentOrders = (recentRows ?? []) as unknown as OrderRow[];

          // Orders in last 7 days (count)
          const { count: orders7 } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .gte('created_at', sevenDaysAgoIso());
          ordersLast7Days = orders7 ?? 0;

          // Visitors from platform_events (today)
          try {
            const { count: vCount } = await supabase
              .from('platform_events')
              .select('id', { count: 'exact', head: true })
              .eq('event_type', 'store_view')
              .gte('created_at', start)
              .lte('created_at', end);
            todayStats.visitors = vCount ?? 0;
          } catch {
            // platform_events may not be accessible — leave 0
          }
        }

        // Plan
        try {
          const { data: sub } = await supabase
            .from('user_plan_subscriptions')
            .select('plan_slug, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .single();
          if (sub?.plan_slug) plan = sub.plan_slug;
        } catch {
          plan = 'free';
        }

        if (!cancelled) {
          setData({
            store,
            productsCount,
            todayStats,
            recentOrders,
            ordersLast7Days,
            plan,
          });
        }
      } catch (err) {
        console.error('JuvayDashboard load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Action card logic ────────────────────────────────────────────────────
  const actionCard = (() => {
    if (!data) return null;
    const { store, productsCount, ordersLast7Days } = data;

    if (productsCount === 0) {
      return {
        title: 'Add your first product',
        subtitle: 'Your store is live but empty. Add a product to start selling.',
        cta: 'Add product',
        icon: Plus,
        onClick: () => navigate('/store-builder'),
      };
    }
    if (productsCount < 5) {
      return {
        title: 'Add more products',
        subtitle: 'Stores with 10+ products get 3x more orders.',
        cta: 'Add product',
        icon: Plus,
        onClick: () => navigate('/store-builder'),
      };
    }
    if (ordersLast7Days === 0) {
      return {
        title: 'Share your store link on WhatsApp',
        subtitle: 'No orders this week. Get the word out!',
        cta: 'Share link',
        icon: Share2,
        onClick: () => shareStore(),
      };
    }
    return {
      title: "You're doing great!",
      subtitle: 'Here\'s your store link to share.',
      cta: 'Share link',
      icon: Share2,
      onClick: () => shareStore(),
    };
  })();

  const shareStore = () => {
    if (!data?.store?.slug) return;
    const url = `https://juvay.app/store/${data.store.slug}`;
    const text = encodeURIComponent(`Check out my store on Juvay: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const copyStoreLink = async () => {
    if (!data?.store?.slug) return;
    try {
      await navigator.clipboard.writeText(`https://juvay.app/store/${data.store.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // no-op
    }
  };

  // ── Loading skeletons ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 max-w-md mx-auto">
        <div className="h-8 w-2/3 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-1/2 bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse mb-4" />
        <div className="h-24 bg-gray-200 rounded-2xl animate-pulse mb-4" />
        <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // ── Empty state: no store ─────────────────────────────────────────────────
  if (!data?.store) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <StoreIcon className="h-16 w-16 text-red-600 mb-4" />
        <h1 className="text-2xl font-extrabold text-gray-900">Welcome to JUVAY</h1>
        <p className="text-gray-500 mt-2 mb-6">You don't have a store yet. Let's build one — it takes 2 minutes.</p>
        <Link
          to="/get-started"
          className="bg-red-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-red-700 transition-all"
        >
          Let's Build Your Store →
        </Link>
      </div>
    );
  }

  const { store, productsCount, todayStats, recentOrders, plan } = data;
  const storeUrl = `juvay.app/store/${store.slug}`;
  const isFree = plan === 'free';

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {greeting()}, {userName} 👋
            </h1>
            <p className="text-sm text-gray-500">{store.name}</p>
          </div>
          <Link
            to={`/store/${store.slug}`}
            className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center whitespace-nowrap"
          >
            View store <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>

        {/* PLAN BADGE */}
        <div className="flex items-center justify-end mt-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isFree ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
            {isFree ? 'FREE PLAN' : plan.toUpperCase()}
          </span>
          {isFree && (
            <Link
              to="/pricing"
              className="ml-2 text-xs font-bold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full hover:bg-yellow-200 flex items-center"
            >
              <Crown className="h-3 w-3 mr-1" /> Upgrade to Pro
            </Link>
          )}
        </div>

        {/* TODAY CARD */}
        <div className="mt-5 bg-gradient-to-br from-red-600 to-orange-500 rounded-2xl p-6 shadow-lg text-white">
          <p className="text-sm font-medium text-white/80">Today</p>
          <p className="text-4xl font-extrabold mt-1">TT${todayStats.revenue.toFixed(2)}</p>
          <p className="text-sm text-white/80 mt-1">revenue today</p>

          <div className="flex gap-6 mt-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-xl font-bold">{todayStats.orders}</p>
                <p className="text-xs text-white/70">orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-xl font-bold">{todayStats.visitors}</p>
                <p className="text-xs text-white/70">visitors</p>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION CARD */}
        {actionCard && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <actionCard.icon className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{actionCard.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{actionCard.subtitle}</p>
                <button
                  onClick={actionCard.onClick}
                  className="mt-3 text-sm font-bold text-red-600 hover:text-red-700 flex items-center"
                >
                  {actionCard.cta} <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RECENT ORDERS */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Recent orders</h2>
            <Link to="/store-builder" className="text-xs font-semibold text-gray-500 hover:text-gray-700">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700">No orders yet</p>
              <p className="text-sm text-gray-500 mt-1">Share your store link to start getting orders.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((o) => (
                <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {o.order_number || `#${o.id.slice(0, 6)}`}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.customer_name || 'Guest'} · {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className="font-bold text-gray-900">TT${Number(o.total ?? 0).toFixed(2)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>
                      {o.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick actions</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="Add Product" onClick={() => navigate('/store-builder')} />
            <QuickAction icon={StoreIcon} label="View Store" onClick={() => navigate(`/store/${store.slug}`)} />
            <QuickAction icon={Share2} label="Share Link" onClick={copyStoreLink} />
            <QuickAction icon={Compass} label="Explore Market" onClick={() => navigate('/explore')} />
            <QuickAction icon={Bot} label="Bot Settings" onClick={() => navigate('/dashboard/bot-settings')} />
          </div>
          {copied && (
            <p className="text-xs text-green-600 text-center mt-2">Store link copied to clipboard!</p>
          )}
        </div>

        {/* Store link footer */}
        <div className="mt-6 bg-gray-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-gray-600 truncate">{storeUrl}</span>
          <button onClick={copyStoreLink} className="text-xs font-semibold text-red-600 hover:text-red-700 whitespace-nowrap ml-2">
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Small subcomponents ──────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl py-3 px-1 hover:bg-gray-50 transition-colors active:scale-[0.97]"
  >
    <Icon className="h-5 w-5 text-red-600 mb-1" />
    <span className="text-[11px] font-semibold text-gray-700 text-center leading-tight">{label}</span>
  </button>
);

export default JuvayDashboard;
