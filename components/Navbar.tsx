import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User, Settings, ChevronDown, Gamepad2, FileText, Store, ShoppingCart, Car, Briefcase, Building2, Ticket, DollarSign, Sparkles, Gift, Mail, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const LOGO_URL = "/trinibuild-logo.png";

interface DropdownItem { name: string; path: string; icon: React.ElementType; description: string; badge?: string; badgeColor?: string; }
interface NavGroup { label: string; items: DropdownItem[]; }

const SERVICE_GROUPS: NavGroup[] = [
  { label: 'Shop & Sell', items: [
    { name: 'Business Directory', path: '/directory', icon: Store, description: 'Find local businesses' },
    { name: 'Marketplace', path: '/classifieds', icon: ShoppingCart, description: 'Buy & sell anything' },
    { name: 'Create Store', path: '/create-store', icon: Sparkles, description: 'Free online store', badge: 'Free', badgeColor: 'bg-green-500' },
    { name: 'Store Templates', path: '/templates', icon: Star, description: '15+ premium designs' },
  ]},
  { label: 'Digital & Gaming', items: [
    { name: 'Game Pass & Streaming', path: '/digital', icon: Gamepad2, description: 'PS Plus, Xbox, Netflix', badge: 'New', badgeColor: 'bg-purple-500' },
    { name: 'Gift Cards', path: '/gift-cards', icon: Gift, description: 'Steam, iTunes, Google Play' },
  ]},
  { label: 'Services', items: [
    { name: 'Rides & Delivery', path: '/rides', icon: Car, description: 'Book rides across T&T' },
    { name: 'Jobs', path: '/jobs', icon: Briefcase, description: 'Find work or hire pros' },
    { name: 'Real Estate', path: '/real-estate', icon: Building2, description: 'Buy, rent, sell property' },
    { name: 'Events & Tickets', path: '/tickets', icon: Ticket, description: 'Fetes, concerts, shows' },
  ]},
  { label: 'AI Tools', items: [
    { name: 'AI Document Assistant', path: '/documents', icon: FileText, description: 'Job letters, visa docs', badge: 'AI', badgeColor: 'bg-indigo-500' },
    { name: 'AI Product Lister', path: '/products/ai-add', icon: Sparkles, description: 'Photo → listing in 10s' },
    { name: 'VAT Tax Dashboard', path: '/tax-dashboard', icon: DollarSign, description: 'BIR-ready tax reports' },
  ]},
];

const MOBILE_LINKS = [
  { name: 'Directory', path: '/directory', icon: Store },
  { name: 'Marketplace', path: '/classifieds', icon: ShoppingCart },
  { name: 'Digital', path: '/digital', icon: Gamepad2 },
  { name: 'Rides', path: '/rides', icon: Car },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Events', path: '/tickets', icon: Ticket },
  { name: 'Real Estate', path: '/real-estate', icon: Building2 },
  { name: 'AI Docs', path: '/documents', icon: FileText },
  { name: 'AI Lister', path: '/products/ai-add', icon: Sparkles },
  { name: 'Tax Tools', path: '/tax-dashboard', icon: DollarSign },
  { name: 'Gift Cards', path: '/gift-cards', icon: Gift },
  { name: 'Templates', path: '/templates', icon: Star },
  { name: 'Pricing', path: '/pricing', icon: DollarSign },
  { name: 'Blog', path: '/blog', icon: Mail },
  { name: 'Earn', path: '/earn', icon: Gift },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isHome = location.pathname === '/';

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await authService.getCurrentUser();
      setIsLoggedIn(!!user);
      if (user && (user.role === 'admin' || user.role === 'super_admin')) setIsAdmin(true);
    })();
  }, [location]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setServicesOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { setIsOpen(false); setServicesOpen(false); }, [location.pathname]);

  const isTransparent = isHome && !scrolled;
  const lc = (path: string) => `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isTransparent ? 'text-white/90 hover:bg-white/10' : 'text-gray-700 hover:text-trini-red hover:bg-gray-50'}`;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent text-white pt-3' : 'bg-white/95 backdrop-blur-md text-gray-900 shadow-md py-1'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <Link to="/" className="flex-shrink-0">
            <div className={`transition-all p-1 rounded ${isTransparent ? 'bg-white/90 backdrop-blur-sm' : ''}`}>
              <img src={LOGO_URL} alt="TriniBuild" className="h-9 w-auto object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-xl text-trini-red">TriniBuild</span>'; }} />
            </div>
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            <Link to="/directory" className={lc('/directory')}>Directory</Link>
            <Link to="/classifieds" className={lc('/classifieds')}>Market</Link>
            <Link to="/digital" className={`${lc('/digital')} flex items-center gap-1`}>
              Digital <span className="text-[10px] font-black bg-purple-500 text-white px-1.5 py-0.5 rounded-full leading-none">NEW</span>
            </Link>

            {/* Mega Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setServicesOpen(!servicesOpen)} className={`${lc('')} flex items-center gap-1`}>
                Services <ChevronDown size={14} className={`transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[680px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="grid grid-cols-2 gap-0">
                    {SERVICE_GROUPS.map(group => (
                      <div key={group.label} className="p-4 border-b border-r border-gray-50 last:border-r-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{group.label}</p>
                        <div className="space-y-1">
                          {group.items.map(item => {
                            const Icon = item.icon;
                            return (
                              <Link key={item.path} to={item.path} onClick={() => setServicesOpen(false)}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-trini-red/10 flex items-center justify-center flex-shrink-0">
                                  <Icon size={18} className="text-gray-500 group-hover:text-trini-red" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                    {item.badge && <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded-full leading-none ${item.badgeColor}`}>{item.badge}</span>}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-100">
                    <Link to="/pricing" onClick={() => setServicesOpen(false)} className="text-sm font-bold text-trini-red hover:underline">View Pricing →</Link>
                    <Link to="/features" onClick={() => setServicesOpen(false)} className="text-sm font-bold text-gray-600 hover:text-gray-900">All Features</Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/pricing" className={lc('/pricing')}>Pricing</Link>
            <Link to="/blog" className={lc('/blog')}>Blog</Link>

            {isAdmin && (
              <Link to="/admin/command-center" className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${isTransparent ? 'bg-purple-500/80 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                <Settings size={14} /> Admin
              </Link>
            )}

            <div className={`h-6 w-px mx-1 opacity-30 ${isTransparent ? 'bg-white' : 'bg-gray-300'}`} />

            <Link to="/profile" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${isTransparent ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              <User size={16} />
            </Link>
            <Link to="/create-store" className={`ml-1 px-4 py-2 rounded-lg text-sm font-black shadow-lg transition-all hover:-translate-y-0.5 ${isTransparent ? 'bg-white text-gray-900' : 'bg-trini-red text-white hover:bg-red-700'}`}>
              Start Free
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/profile" className={`p-2 rounded-full ${isTransparent ? 'text-white' : 'text-gray-600'}`}><User size={20} /></Link>
            <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-lg ${isTransparent ? 'text-white hover:bg-white/20' : 'text-gray-500 hover:bg-gray-100'}`}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white shadow-2xl absolute top-full w-full border-t border-gray-100 max-h-[85vh] overflow-y-auto">
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Link to="/create-store" onClick={() => setIsOpen(false)} className="bg-trini-red text-white rounded-xl px-4 py-3 font-black text-sm text-center">Create Store</Link>
              <Link to="/digital" onClick={() => setIsOpen(false)} className="bg-purple-600 text-white rounded-xl px-4 py-3 font-black text-sm text-center flex items-center justify-center gap-1">
                <Gamepad2 size={16} /> Digital
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_LINKS.map(link => {
                const Icon = link.icon;
                const active = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-center ${active ? 'bg-red-50 text-trini-red' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <Icon size={20} />
                    <span className="text-[11px] font-bold leading-tight">{link.name}</span>
                  </Link>
                );
              })}
            </div>
            {isAdmin && (
              <Link to="/admin/command-center" onClick={() => setIsOpen(false)} className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm">
                <Settings size={16} /> Admin Command Center
              </Link>
            )}
            <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-2 gap-2">
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-center py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm">Log In</Link>
              <Link to="/signup" onClick={() => setIsOpen(false)} className="text-center py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm">Sign Up</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
