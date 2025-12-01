import React from 'react';
import { ArrowRight, Home, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export const LivingLanding: React.FC = () => {
   return (
      <div className="min-h-screen bg-white font-sans">
         <SEO
            title="TriniBuild Living - Real Estate Marketplace"
            description="Find your dream home or list your property in Trinidad & Tobago. Verified listings, AI valuations, and direct agent connections."
            keywords="real estate trinidad, houses for sale trinidad, apartments for rent trinidad, trinidad property"
         />
         {/* Hero */}
         <div className="relative h-[85vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gray-900">
               <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-50" alt="Luxury Home" />
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
            </div>
            <div className="relative z-10 text-center px-4 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700">
               <span className="bg-blue-500/20 text-blue-200 border border-blue-500/50 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest mb-8 inline-block backdrop-blur-md">
                  TriniBuild Living
               </span>
               <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                  Stop scrolling through <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Fake Listings.</span>
               </h1>
               <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
                  The Trinidad real estate market is broken. We fixed it. <br />
                  <strong>Verified Agents. Real Prices. AI Valuations.</strong>
               </p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/real-estate" className="bg-blue-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-105 flex items-center justify-center">
                     Find My Dream Home <Search className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/real-estate/sell" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center">
                     List My Property
                  </Link>
               </div>
            </div>
         </div>

         {/* PAIN POINTS: The Old Way */}
         <div className="py-24 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why is buying a home in T&T so stressful?</h2>
                  <p className="text-xl text-gray-600">You deserve better than Facebook Marketplace scams and unresponsive agents.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                     <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mb-6 text-red-600 group-hover:scale-110 transition-transform">
                        <Search className="h-7 w-7" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">The "Ghost" Listings</h3>
                     <p className="text-gray-600">
                        You call about a house, and the agent says "It's sold, but I have another one." It's a bait-and-switch tactic.
                     </p>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                     <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mb-6 text-red-600 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-7 w-7" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Verification</h3>
                     <p className="text-gray-600">
                        Anyone can post a photo of a house. Scammers take deposits for properties they don't even own.
                     </p>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                     <div className="bg-red-50 w-14 h-14 rounded-full flex items-center justify-center mb-6 text-red-600 group-hover:scale-110 transition-transform">
                        <Home className="h-7 w-7" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">Price Guessing Games</h3>
                     <p className="text-gray-600">
                        "Call for Price." Why? So they can size you up and charge what they think you can pay.
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* SOLUTION: The TriniBuild Way */}
         <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="order-2 lg:order-1">
                     <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl opacity-20 blur-2xl"></div>
                        <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop" alt="Modern House" className="relative rounded-2xl shadow-2xl border border-gray-100 w-full" />

                        {/* Floating Badge */}
                        <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce-slow">
                           <div className="bg-green-100 p-2 rounded-full">
                              <ShieldCheck className="h-6 w-6 text-green-600" />
                           </div>
                           <div>
                              <p className="text-xs text-gray-500 font-bold uppercase">Verification Status</p>
                              <p className="text-green-600 font-bold">100% Verified Owner</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="order-1 lg:order-2">
                     <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-2 block">The New Standard</span>
                     <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                        Real Estate, <br />
                        <span className="text-blue-600">Democratized.</span>
                     </h2>
                     <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        We use AI and strict verification to create the only safe marketplace in the Caribbean. If it's on TriniBuild Living, it's real, it's available, and the price is transparent.
                     </p>

                     <ul className="space-y-6">
                        <li className="flex items-start">
                           <div className="bg-blue-100 p-1 rounded-full mr-4 mt-1">
                              <Check className="h-4 w-4 text-blue-600" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">Mandatory ID Verification</h4>
                              <p className="text-sm text-gray-600">Every agent and landlord must verify their identity before posting.</p>
                           </div>
                        </li>
                        <li className="flex items-start">
                           <div className="bg-blue-100 p-1 rounded-full mr-4 mt-1">
                              <Check className="h-4 w-4 text-blue-600" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">AI Price Estimates</h4>
                              <p className="text-sm text-gray-600">Know if you're getting a good deal with our automated valuation model.</p>
                           </div>
                        </li>
                        <li className="flex items-start">
                           <div className="bg-blue-100 p-1 rounded-full mr-4 mt-1">
                              <Check className="h-4 w-4 text-blue-600" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">Direct Chat</h4>
                              <p className="text-sm text-gray-600">Message owners directly. Schedule viewings instantly. No phone tag.</p>
                           </div>
                        </li>
                     </ul>

                     <div className="mt-10">
                        <Link to="/real-estate" className="text-blue-600 font-bold text-lg flex items-center hover:underline group">
                           Explore Verified Listings <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* CTA Section */}
         <div className="bg-gray-900 text-white py-24 text-center">
            <div className="max-w-4xl mx-auto px-4">
               <h2 className="text-4xl font-bold mb-6">Are you a Real Estate Agent?</h2>
               <p className="text-xl text-gray-400 mb-10">
                  Stop paying thousands for ads that don't convert. Join the fastest growing property network in the Caribbean.
               </p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/real-estate/agent-signup" className="bg-white text-gray-900 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
                     Join as an Agent
                  </Link>
                  <Link to="/contact" className="bg-transparent border border-gray-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-colors">
                     Contact Sales
                  </Link>
               </div>
            </div>
         </div>
      </div>
   );
};

// Helper Icon
const Check = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);
