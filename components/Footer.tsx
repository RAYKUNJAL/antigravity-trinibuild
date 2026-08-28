import React from 'react';
import { Facebook, Twitter, Instagram, Mail, MapPin, Youtube, Lock, ShieldCheck, Truck, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_URL = "/juvay-logo.png";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-950 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8 lg:gap-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="bg-white/90 p-2 rounded-lg inline-block mb-4">
              <img src={LOGO_URL} alt="Juvay" className="h-10 w-auto"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-2xl text-trini-black">Juvay</span>'; }} />
            </div>
            <p className="text-gray-400 text-sm mb-4 max-w-xs leading-relaxed">
              Trinidad & Tobago's complete digital business platform. Stores, marketplace, rides, jobs, digital services, and AI tools — all in one place. For we, by we.
            </p>
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" /> Port of Spain, Trinidad & Tobago
            </div>
            <div className="flex items-center text-gray-500 text-sm mb-4">
              <Mail className="h-4 w-4 mr-2 flex-shrink-0" /> support@juvay.app
            </div>
            <div className="flex gap-3">
              <a href="https://facebook.com/juvayapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook size={18} className="text-gray-400" />
              </a>
              <a href="https://instagram.com/juvayapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram size={18} className="text-gray-400" />
              </a>
              <a href="https://twitter.com/juvayapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter size={18} className="text-gray-400" />
              </a>
              <a href="https://youtube.com/@juvayapp" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors" aria-label="YouTube">
                <Youtube size={18} className="text-gray-400" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Platform</h3>
            <ul className="space-y-2.5">
              <li><Link to="/directory" className="text-sm text-gray-400 hover:text-white transition-colors">Business Directory</Link></li>
              <li><Link to="/classifieds" className="text-sm text-gray-400 hover:text-white transition-colors">Marketplace</Link></li>
              <li><Link to="/create-store" className="text-sm text-gray-400 hover:text-white transition-colors">Create Free Store</Link></li>
              <li><Link to="/templates" className="text-sm text-gray-400 hover:text-white transition-colors">Store Templates</Link></li>
              <li><Link to="/jobs" className="text-sm text-gray-400 hover:text-white transition-colors">Jobs Board</Link></li>
              <li><Link to="/real-estate" className="text-sm text-gray-400 hover:text-white transition-colors">Real Estate</Link></li>
            </ul>
          </div>

          {/* Solutions — CRO landing pages for cold traffic / SEO entry points.
              Links to /services/* (the CRO landings), separate from /directory, /jobs, etc.
              which are the actual product UIs. Both audiences are served. */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Solutions</h3>
            <ul className="space-y-2.5">
              <li><Link to="/services/stores" className="text-sm text-gray-400 hover:text-white transition-colors">For Online Stores</Link></li>
              <li><Link to="/services/food" className="text-sm text-gray-400 hover:text-white transition-colors">For Restaurants</Link></li>
              <li><Link to="/services/marketplace" className="text-sm text-gray-400 hover:text-white transition-colors">For Marketplaces</Link></li>
              <li><Link to="/services/jobs" className="text-sm text-gray-400 hover:text-white transition-colors">For Job Seekers</Link></li>
              <li><Link to="/services/living" className="text-sm text-gray-400 hover:text-white transition-colors">For Real Estate</Link></li>
              <li><Link to="/carib-ads" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">Advertise with Juvay <span className="text-[9px] bg-trini-red text-white px-1 rounded-full font-bold">NEW</span></Link></li>
            </ul>
          </div>

          {/* Digital Services */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Digital</h3>
            <ul className="space-y-2.5">
              <li><Link to="/documents" className="text-sm text-gray-400 hover:text-white transition-colors">AI Document Assistant</Link></li>
              <li><Link to="/products/ai-add" className="text-sm text-gray-400 hover:text-white transition-colors">AI Product Lister</Link></li>
              <li><Link to="/tax-dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">VAT Tax Tracker</Link></li>
              <li><Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Plans (TTD)</Link></li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Business</h3>
            <ul className="space-y-2.5">
              <li><Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/loyalty" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1">Rewards & Loyalty <span className="text-[9px] bg-trini-red text-white px-1 rounded-full font-bold">EARN</span></Link></li>
              <li><Link to="/earn" className="text-sm text-gray-400 hover:text-white transition-colors">Earn With Us</Link></li>
              <li><Link to="/affiliate" className="text-sm text-gray-400 hover:text-white transition-colors">Affiliate Program</Link></li>
              <li><Link to="/blog" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              {/* No public Admin link. /admin is a login wall for strangers. */}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Legal</h3>
            <ul className="space-y-2.5">
              <li><a href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/refund" className="text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
              <li><a href="/legal/merchant-agreement" className="text-sm text-gray-400 hover:text-white transition-colors">Merchant Agreement</a></li>
              <li><Link to="/legal/all" className="text-sm text-gray-400 hover:text-white transition-colors">All Legal Documents</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Trust Badges — truthful only (HTTPS via Caddy, Supabase encrypted, COD supported) */}
      <div className="border-t border-white/5 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-gray-300">
            <span className="flex items-center gap-1.5 text-xs font-medium" title="Site is served over HTTPS with SSL via Caddy">
              <Lock className="h-4 w-4 text-green-400" /> SSL Secured
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium" title="HTTPS/TLS encryption in transit">
              <ShieldCheck className="h-4 w-4 text-green-400" /> 256-bit Encryption
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium" title="Cash on delivery is supported at checkout">
              <Truck className="h-4 w-4 text-green-400" /> Cash on Delivery
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium" title="Data is stored on Supabase (encrypted at rest)">
              <Shield className="h-4 w-4 text-green-400" /> Powered by Supabase
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
              <span>&copy; {new Date().getFullYear()} Juvay — A product of R&R Digital Solutions. All rights reserved.</span>
              <span className="hidden md:inline">•</span>
              <span>Trinidad & Tobago</span>
              <span className="hidden md:inline">•</span>
              <span>For We, By We 🇹🇹</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/sitemap.xml" className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Sitemap</a>
              <span className="text-xs text-gray-400">v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
