
import React, { useState, useEffect } from 'react';
import { Menu, X, UserCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Placeholder logo URL
const LOGO_URL = "https://trinibuild.com/wp-content/uploads/2023/05/TriniBuild-Logo.png";

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Directory', path: '/directory' },
    { name: 'Market', path: '/classifieds' },
    { name: 'Go (Rides)', path: '/solutions/rides' }, 
    { name: 'Pay & Deals', path: '/deals' }, 
    { name: 'Jobs', path: '/solutions/jobs' },
    { name: 'Living', path: '/solutions/living' },
    { name: 'E-Tick', path: '/solutions/tickets' }, 
  ];

  const isActive = (path: string) => location.pathname === path;

  const isTransparent = isHome && !scrolled;
  
  const navClasses = `fixed top-0 w-full z-50 transition-all duration-300 ${
    isTransparent 
      ? 'bg-transparent text-white pt-4' 
      : 'bg-white/95 backdrop-blur-md text-gray-900 shadow-md py-2'
  }`;

  const linkClasses = (path: string) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isTransparent
      ? 'text-white/90 hover:text-white hover:bg-white/10'
      : isActive(path)
        ? 'text-trini-red bg-red-50'
        : 'text-gray-700 hover:text-trini-red hover:bg-gray-50'
  }`;

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className={`transition-all duration-300 p-1 rounded ${isTransparent ? 'bg-white/90 backdrop-blur-sm' : ''}`}>
                <img 
                  src={LOGO_URL} 
                  alt="TriniBuild" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-xl text-trini-red">TriniBuild</span>';
                  }}
                />
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={linkClasses(link.path)}
              >
                {link.name}
              </Link>
            ))}
             <Link to="/earn" className={linkClasses('/earn')}>Earn</Link>
             <div className={`h-6 w-px mx-2 opacity-50 ${isTransparent ? 'bg-white' : 'bg-gray-300'}`}></div>
             
             {/* Profile Link */}
             <Link to="/profile" className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${isTransparent ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                <User className="h-4 w-4" /> <span className="hidden lg:inline">My Profile</span>
             </Link>

             <Link to="/create-store" className={`ml-2 px-4 py-2 rounded-md text-sm font-bold shadow-lg transition-transform transform hover:-translate-y-0.5 ${
               isTransparent 
                ? 'bg-white text-trini-black hover:bg-gray-100' 
                : 'bg-trini-black text-white hover:bg-gray-800'
             }`}>
              Start Selling
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${
                isTransparent ? 'text-white hover:bg-white/20' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              }`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-xl absolute top-full w-full border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                   isActive(link.path)
                    ? 'text-trini-red bg-red-50'
                    : 'text-gray-700 hover:text-trini-red hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
             <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-gray-800 bg-gray-50">
               <div className="flex items-center"><User className="h-4 w-4 mr-2" /> My Profile</div>
             </Link>
             <Link to="/earn" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-purple-700 bg-purple-50">
               Start Earning
             </Link>
             <div className="border-t border-gray-100 my-2"></div>
             <Link to="/create-store" onClick={() => setIsOpen(false)} className="block w-full mt-4 bg-trini-black text-white px-4 py-3 rounded-md text-base font-medium text-center">
              Create Store
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
