
import React from 'react';
import { ArrowRight, Home, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LivingLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gray-900">
           <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-40" alt="Luxury Home" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
           <span className="bg-blue-500/20 text-blue-200 border border-blue-500/50 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-6 inline-block">TriniBuild Living</span>
           <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Find your place <br/>in <span className="text-blue-400">Paradise.</span>
           </h1>
           <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              The most trusted real estate marketplace in Trinidad & Tobago. Verified listings, AI valuations, and direct agent connections.
           </p>
           <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/real-estate" className="bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center">
                 Browse Listings <Search className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/real-estate" className="bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all flex items-center justify-center">
                 List Property
              </Link>
           </div>
        </div>
      </div>
      
      {/* Features */}
      <div className="py-20 bg-gray-50">
         <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-gray-900">Why TriniBuild Living?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                     <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Verified Agents</h3>
                  <p className="text-gray-500">No more fake listings or scams. We verify every agent.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                     <MapPin className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Map Search</h3>
                  <p className="text-gray-500">Search by neighborhood, street, or radius.</p>
               </div>
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                     <Home className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Smart Alerts</h3>
                  <p className="text-gray-500">Get notified the second a matching property hits the market.</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
