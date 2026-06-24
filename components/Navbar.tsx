import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Settings, ChevronDown, LogOut, Gamepad2, FileText, Store, ShoppingCart, Car, Briefcase, Building2, Ticket, DollarSign, Sparkles, Gift, Mail, Star, Store as StoreIcon, UtensilsCrossed, ShoppingBag, Truck, CalendarDays, Home as HomeIcon, ArrowRight, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { simpleAuthService } from '../services/simpleAuthService';

const LOGO_URL = "/trinibuild-logo.png";

/* ────────────────────────────────────────────────────────────────────────
   DESKTOP DROPDOWN DATA
   ──────────────────────────────────────────────────────────────────────── */

interface DropdownItem {
  name: string;
  path: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const SERVICES_DROPDOWN: DropdownItem[] = [
  { name: 'For Online Stores', path: '/create-store', icon: StoreIcon, description: 'Build your free store in 5 minutes', badge: 'Free', badgeColor: 'bg-green-500' },
  { name: 'For Restaurants', path: '#', icon: UtensilsCrossed, description: 'Menus, reservations, COD orders' },
  { name: 'For Marketplaces', path: '/classifieds', icon: ShoppingBag, description: 'List & sell anything fast' },
  { name: 'For Drivers', path: '/rides', icon: Truck, description: 'Earn delivering across T&T' },
  { name: 'For Job Seekers', path: '/jobs', icon: Briefcase, description: 'Find work or hire pros' },
  { name: 'For Event Hosts', path: '/tickets', icon: CalendarDays, description: 'Fetes, concerts, shows' },
  { name: 'For Real Estate', path: '/real-estate', icon: HomeIcon, description: 'Buy, rent, sell property' },
];

const DIGITAL_DROPDOWN: DropdownItem[] = [
  { name: 'Game Pass & Streaming', path: '/digital', icon: Gamepad2, description: 'PS Plus, Xbox, Netflix', badge: 'New', badgeColor: 'bg-purple-500' },
  { name: 'Gift Cards', path: '/gift-cards', icon: Gift, description: 'Steam, iTunes, Google Play' },
  { name: 'AI Document Assistant', path: '/documents', icon: FileText, description: 'Job letters, visa docs', badge: 'AI', badgeColor: 'bg-indigo-500' },
  { name: 'AI Product Lister', path: '/products/ai-add', icon: Sparkles, description: 'Photo → listing in 10s', badge: 'AI', badgeColor: 'bg-indigo-500' },
  { name: 'VAT Tax Tracker', path: '/tax-dashboard', icon: DollarSign, description: 'BIR-ready tax reports' },
  { name: 'Premium Features', path: '/pricing', icon: Star, description: 'Unlock unlimited power' },
];

/* ────────────────────────────────────────────────────────────────────────
   MOBILE DRAWER — full link list (no hidden links)
   ──────────────────────────────────────────────────────────────────────── */

const MOBILE_LINKS = [
  { name: 'Directory', path: '/directory', icon: Store },
  { name: 'Marketplace', path: '/classifieds', icon: ShoppingCart },
  { name: 'Game Pass & Streaming', path: '/digital', icon: Gamepad2 },
  { name: 'Gift Cards', path: '/gift-cards', icon: Gift },
  { name: 'AI Document Assistant', path: '/documents', icon: FileText },
  { name: 'AI Product Lister', path: '/products/ai-add', icon: Sparkles },
  { name: 'VAT Tax Tracker', path: '/tax-dashboard', icon: DollarSign },
  { name: 'Premium Features', path: '/pricing', icon: Star },
  { name: 'For Online Stores', path: '/create-store', icon: StoreIcon },
  { name: 'For Restaurants', path: '#', icon: UtensilsCrossed },
  { name: 'For Marketplaces', path: '/classifieds', icon: ShoppingBag },
  { name: 'For Drivers', path: '/rides', icon: Truck },
  { name: 'For Job Seekers', path: '/jobs', icon: Briefcase },
  { name: 'For Event Hosts', path: '/tickets', icon: CalendarDays },
  { name: 'For Real Estate', path: '/real-estate', icon: HomeIcon },
  { name: 'Spin & Win', path: '/spin-wheel', icon: Gift },
  { name: 'My Rewards', path: '/loyalty', icon: Star },
  { name: 'Templates', path: '/templates', icon: Star },
  { name: 'Pricing', path: '/pricing', icon: DollarSign },
  { name: 'Blog', path: '/blog', icon: Mail },
  { name: 'Earn', path: '/earn', icon: Gift },
];

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: Facebook, url: 'https://facebook.com' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com' },
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com' },
];

/* ────────────────────────────────────────────────────────────────────────
   DROPDOWN PANEL (hover-based, desktop)
   ──────────────────────────────────────────────────────────────────────── */

const DropdownPanel: React.FC<{ items: DropdownItem[]; onClose: () => void; width?: string }> = ({ items, onClose, width = 'w-80' }) => (
  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 ${width} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50`}>
    <div className="py-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-trini-red/10 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-gray-500 group-hover:text-trini-red" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none ${item.badgeColor}`}>{item.badge}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{item.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────
   NAVBAR
   ──────────────────────────────────────────────────────────────────────── */

export const Navbar: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isHome = location.pathname === '/';

  const handleLogout = async () => {
    await simpleAuthService.logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUserMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const simpleUser = simpleAuthService.getCurrentUser();
    setCurrentUser(simpleUser);
    setIsLoggedIn(!!simpleUser);
    if (simpleUser && (simpleUser.role === 'admin' || simpleUser.role === 'super_admin')) setIsAdmin(true);
  }, [location]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setHoveredMenu(null);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isTransparent = isHome && !scrolled;
  const lc = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
      isTransparent ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:text-trini-red hover:bg-gray-50'
    }`;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isTransparent ? 'bg-transparent text-white pt-3' : 'bg-white/95 backdrop-blur-md text-gray-900 shadow-md py-1'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className={`transition-all p-1 rounded ${isTransparent ? 'bg-white/90 backdrop-blur-sm' : ''}`}>
              <img
                src={LOGO_URL}
                alt="TriniBuild"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML =
                    '<span class="font-bold text-xl text-trini-red">TriniBuild</span>';
                }}
              />
            </div>
          </Link>

          {/* ════════ DESKTOP NAV (md+) — always visible inline, not hamburger ════════ */}
          <div className="hidden md:flex md:items-center md:gap-1">
            <Link to="/directory" className={lc('/directory')}>
              Directory
            </Link>
            <Link to="/classifieds" className={lc('/classifieds')}>
              Market
            </Link>

            {/* Digital — hover dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredMenu('digital')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <button className={`${lc('/digital')} flex items-center gap-1 cursor-pointer`}>
                Digital <span className="text-[10px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full leading-none">NEW</span>
                <ChevronDown size={14} className={`transition-transform ${hoveredMenu === 'digital' ? 'rotate-180' : ''}`} />
              </button>
              {hoveredMenu === 'digital' && <DropdownPanel items={DIGITAL_DROPDOWN} onClose={() => setHoveredMenu(null)} />}
            </div>

            {/* Services — hover dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredMenu('services')}
              onMouseLeave={() => setHoveredMenu(null)}
            >
              <button className={`${lc('')} flex items-center gap-1 cursor-pointer`}>
                Services <ChevronDown size={14} className={`transition-transform ${hoveredMenu === 'services' ? 'rotate-180' : ''}`} />
              </button>
              {hoveredMenu === 'services' && (
                <DropdownPanel items={SERVICES_DROPDOWN} onClose={() => setHoveredMenu(null)} width="w-96" />
              )}
            </div>

            <Link to="/pricing" className={lc('/pricing')}>
              Pricing
            </Link>
            <Link to="/blog" className={lc('/blog')}>
              Blog
            </Link>

            {isAdmin && (
              <Link
                to="/admin/command-center"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isTransparent ? 'bg-purple-500/80 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Settings size={14} /> Admin
              </Link>
            )}

            <div className={`h-6 w-px mx-1 opacity-30 ${isTransparent ? 'bg-white' : 'bg-gray-300'}`} />

            {/* Auth area */}
            {isLoggedIn && currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    isTransparent ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <User size={16} />
                  <ChevronDown size={14} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{currentUser?.name || 'User'}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email || 'No email'}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={16} /> My Profile
                    </Link>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Store size={16} /> My Store
                    </Link>
                    <Link to="/loyalty" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Star size={16} /> My Rewards
                    </Link>
                    <Link to="/spin-wheel" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-trini-red hover:bg-red-50">
                      <Gift size={16} /> Spin to Win
                      <span className="ml-auto text-[9px] bg-trini-red text-white px-1.5 py-0.5 rounded-full font-black">FREE</span>
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={lc('/login')}>
                  Log In
                </Link>
                <Link
                  to="/create-store"
                  className={`ml-1 px-4 py-2 rounded-lg text-sm font-black shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-1 ${
                    isTransparent ? 'bg-white text-gray-900' : 'bg-trini-red text-white hover:bg-red-700'
                  }`}
                >
                  Start Free <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* ════════ MOBILE — hamburger triggers full-screen drawer ════════ */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/profile" className={`p-2 rounded-full ${isTransparent ? 'text-white' : 'text-gray-600'}`}>
              <User size={20} />
            </Link>
            <button
              onClick={() => setDrawerOpen(true)}
              className={`p-2 rounded-lg ${isTransparent ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FULL-SCREEN SLIDE-IN DRAWER (from right)
         ════════════════════════════════════════════════════════════════════ */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 md:hidden ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden flex flex-col ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <img
              src={LOGO_URL}
              alt="TriniBuild"
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-xl text-trini-red">TriniBuild</span>';
              }}
            />
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close menu">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable link list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isAdmin && (
            <Link
              to="/admin/command-center"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 mb-3 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm"
            >
              <Settings size={16} /> Admin Command Center
            </Link>
          )}

          {isLoggedIn && currentUser && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-gray-50">
              <p className="text-sm font-semibold text-gray-900">{currentUser?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{currentUser?.email || 'No email'}</p>
            </div>
          )}

          <div className="space-y-1">
            {MOBILE_LINKS.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    active ? 'bg-red-50 text-trini-red' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-trini-red' : 'text-gray-400'} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth row */}
          <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-2 gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="text-center py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-1"
                >
                  <User size={16} /> Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setDrawerOpen(false);
                  }}
                  className="text-center py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-1"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setDrawerOpen(false)}
                  className="text-center py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setDrawerOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Pinned Start Free CTA + socials */}
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50">
          <Link
            to="/create-store"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-trini-red text-white font-black text-base shadow-lg hover:bg-red-700 transition-colors"
          >
            Start Free <ArrowRight size={18} />
          </Link>
          <div className="flex items-center justify-center gap-4 mt-4">
            {SOCIAL_LINKS.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-trini-red hover:text-white transition-colors"
                  aria-label={s.name}
                >
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
