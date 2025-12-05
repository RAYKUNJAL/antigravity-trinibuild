
import React from 'react';
import { Facebook, Twitter, Instagram, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// Placeholder logo URL - Replace with your actual logo path
const LOGO_URL = "/trinibuild-logo.png";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="bg-white/90 p-3 rounded-lg inline-block mb-4">
              <img
                src={LOGO_URL}
                alt="TriniBuild"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-2xl text-trini-black">Trini<span class="text-trini-red">Build</span></span>';
                }}
              />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Connecting Trinidad & Tobago's businesses with the community. The smartest way to find, buy, and grow locally.
            </p>
            <div className="flex items-center text-gray-500 text-xs">
              <MapPin className="h-3 w-3 mr-1" /> Port of Spain, Trinidad
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Platform</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/directory" className="text-base text-gray-400 hover:text-white">Business Directory</Link></li>
              <li><Link to="/classifieds" className="text-base text-gray-400 hover:text-white">Marketplace</Link></li>
              <li><Link to="/rides" className="text-base text-gray-400 hover:text-white">Rideshare & Delivery</Link></li>
              <li><Link to="/jobs" className="text-base text-gray-400 hover:text-white">Jobs Board</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/blog" className="text-base text-gray-400 hover:text-white">Blog</Link></li>
              <li><Link to="/create-store" className="text-base text-gray-400 hover:text-white">Start Selling</Link></li>
              <li><Link to="/earn" className="text-base text-gray-400 hover:text-white">Partner Program</Link></li>
              <li><Link to="/pricing" className="text-base text-gray-400 hover:text-white">Pricing & Plans</Link></li>
              <li><Link to="/affiliate" className="text-base text-gray-400 hover:text-white">Affiliate Program</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/contact" className="text-base text-gray-400 hover:text-white">Contact Sales</Link></li>
              <li><Link to="/privacy" className="text-base text-gray-400 hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-base text-gray-400 hover:text-white">Terms of Service</Link></li>
              <li className="flex items-center text-gray-400 pt-2">
                <Mail className="h-5 w-5 mr-2" /> support@trinibuild.tt
              </li>
            </ul>
            <div className="flex space-x-6 mt-4">
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Facebook"><Facebook className="h-6 w-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Instagram"><Instagram className="h-6 w-6" /></a>
              <a href="#" className="text-gray-400 hover:text-white" aria-label="Twitter"><Twitter className="h-6 w-6" /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8 text-center flex justify-between items-center">
          <p className="text-base text-gray-400">&copy; 2025 TriniBuild. Built with Google Antigravity. All rights reserved.</p>
          <Link to="/admin" className="text-xs text-gray-700 hover:text-gray-500">Admin</Link>
        </div>
      </div>
    </footer>
  );
};
