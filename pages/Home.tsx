import React, { useEffect, useState } from 'react';
import { Search, MapPin, Star, TrendingUp, Briefcase, ShoppingCart, Car, Truck, ArrowRight, Check, ShieldCheck, Globe, Play, ExternalLink, Volume2, VolumeX, Wand2, Zap, ChevronRight, Settings, Wallet, CreditCard, Heart, Home as HomeIcon, Ticket, UserCheck, Clock, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdConfig, AdConfig } from '../services/adService';
import { AdSpot } from '../components/AdSpot';

export const Home: React.FC = () => {
   const navigate = useNavigate();
   const [adConfig, setAdConfig] = useState<AdConfig>(getAdConfig());
   const [offset, setOffset] = useState(0);

   // Parallax Effect
   useEffect(() => {
      const handleScroll = () => {
         setOffset(window.pageYOffset);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   // Intent Selector State
   const [intent, setIntent] = useState<string | null>(null);

   const handleIntent = (path: string) => {
      navigate(path);
   };

   return (
      <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">

         {/* Parallax Hero Section */}
         <div className="relative h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image with Parallax */}
            <div
               className="absolute inset-0 z-0"
               style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070&auto=format&fit=crop')", // Tropical/Construction vibe
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transform: `translateY(${offset * 0.5}px)`,
               }}
            ></div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-gray-900/90 z-10"></div>

            <div className="relative z-20 text-center px-4 max-w-5xl mx-auto animate-fade-in">

               {/* Logo */}
               <div className="mb-8 flex justify-center">
                  <img src="/trinibuild-logo.png" alt="TriniBuild Logo" className="h-24 md:h-32 w-auto drop-shadow-2xl" />
               </div>

               {/* NLP Headline - Pain Point: Reliability/Struggle */}
               <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
                  Stop Struggling with <span className="text-trini-red">Unreliable Service.</span><br />
                  <span className="text-trini-gold">Get It Done Right.</span>
               </h1>

               <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                  The only app in T&T that verifies every seller, driver, and worker for your safety.
               </p>

               {/* Intent Selector */}
               <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl max-w-4xl mx-auto shadow-2xl">
                  <p className="text-white font-bold mb-4 uppercase tracking-wider text-sm">What do you need today?</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <button onClick={() => handleIntent('/classifieds')} className="p-4 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 group text-left">
                        <ShoppingCart className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="block font-bold text-gray-900">Buy Something</span>
                        <span className="text-xs text-gray-500">Verified Stores</span>
                     </button>
                     <button onClick={() => handleIntent('/rides')} className="p-4 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 group text-left">
                        <Car className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="block font-bold text-gray-900">Get a Ride</span>
                        <span className="text-xs text-gray-500">Safe & Tracked</span>
                     </button>
                     <button onClick={() => handleIntent('/jobs')} className="p-4 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 group text-left">
                        <Briefcase className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="block font-bold text-gray-900">Hire a Pro</span>
                        <span className="text-xs text-gray-500">Vetted Workers</span>
                     </button>
                     <button onClick={() => handleIntent('/tickets')} className="p-4 bg-white hover:bg-gray-50 rounded-xl transition-all hover:scale-105 group text-left">
                        <Ticket className="h-6 w-6 text-pink-600 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="block font-bold text-gray-900">Buy Tickets</span>
                        <span className="text-xs text-gray-500">No Scalpers</span>
                     </button>
                  </div>
               </div>

               {/* Trust Badges */}
               <div className="mt-8 flex items-center justify-center gap-6 text-white/60 text-sm font-medium">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="h-5 w-5 text-green-400" /> 100% Verified Users
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                     <UserCheck className="h-5 w-5 text-blue-400" /> 5,000+ Active Trinis
                  </div>
                  <div className="flex items-center gap-2">
                     <Star className="h-5 w-5 text-yellow-400" /> 4.9/5 Average Rating
                  </div>
               </div>
            </div>
         </div>

         {/* Top Ad Spot (Preserved) */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30 mb-12">
            <AdSpot page="home" slot="top" />
         </div>

         {/* Bento Grid Services Section */}
         <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-12">
               <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">Everything You Need. One Platform.</h2>
               <p className="text-gray-500 max-w-2xl mx-auto">We've connected the entire island. No more jumping between Facebook, WhatsApp, and random websites.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">

               {/* Marketplace - Large Tile */}
               <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100 cursor-pointer" onClick={() => navigate('/classifieds')}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                  <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Marketplace" />
                  <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                     <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                        <ShoppingCart className="h-6 w-6" />
                     </div>
                     <h3 className="text-3xl font-bold mb-2">Marketplace</h3>
                     <p className="text-gray-200 mb-4">Scared of Scammers? Shop Verified Stores Only.</p>
                     <span className="inline-flex items-center font-bold text-blue-300 group-hover:text-white transition-colors">Start Shopping <ArrowRight className="ml-2 h-4 w-4" /></span>
                  </div>
               </div>

               {/* Jobs - Tall Tile */}
               <div className="md:col-span-1 md:row-span-2 relative group overflow-hidden rounded-3xl bg-gray-900 shadow-xl border border-gray-800 cursor-pointer" onClick={() => navigate('/jobs')}>
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-black/90 z-10"></div>
                  <div className="absolute inset-0 p-6 z-20 flex flex-col justify-end">
                     <div className="bg-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                        <Briefcase className="h-5 w-5 text-white" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2">TriniWorks</h3>
                     <p className="text-gray-400 text-sm mb-4">Can't Find Good Help? Hire Vetted Pros.</p>
                     <div className="space-y-2">
                        <div className="flex items-center text-xs text-gray-300 bg-white/10 p-2 rounded-lg">
                           <Check className="h-3 w-3 text-green-400 mr-2" /> Plumbers
                        </div>
                        <div className="flex items-center text-xs text-gray-300 bg-white/10 p-2 rounded-lg">
                           <Check className="h-3 w-3 text-green-400 mr-2" /> Electricians
                        </div>
                        <div className="flex items-center text-xs text-gray-300 bg-white/10 p-2 rounded-lg">
                           <Check className="h-3 w-3 text-green-400 mr-2" /> Mechanics
                        </div>
                     </div>
                  </div>
               </div>

               {/* Rides - Small Tile */}
               <div className="md:col-span-1 relative group overflow-hidden rounded-3xl bg-green-50 shadow-lg border border-green-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/rides')}>
                  <div className="p-6 h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="bg-green-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                           <Car className="h-5 w-5" />
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">Live</span>
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Rides</h3>
                        <p className="text-sm text-gray-500">Travel Safe. Tracked Rides.</p>
                     </div>
                  </div>
               </div>

               {/* Tickets - Small Tile */}
               <div className="md:col-span-1 relative group overflow-hidden rounded-3xl bg-pink-50 shadow-lg border border-pink-100 cursor-pointer hover:shadow-xl transition-all" onClick={() => navigate('/tickets')}>
                  <div className="p-6 h-full flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="bg-pink-500 w-10 h-10 rounded-lg flex items-center justify-center text-white">
                           <Ticket className="h-5 w-5" />
                        </div>
                        <span className="bg-pink-100 text-pink-800 text-xs font-bold px-2 py-1 rounded-full">Hot</span>
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Events</h3>
                        <p className="text-sm text-gray-500">No Scalpers. Real Tickets.</p>
                     </div>
                  </div>
               </div>

            </div>
         </section>

         {/* Social Proof Ticker */}
         <div className="bg-gray-900 py-4 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee">
               {[
                  "John from Arima just hired a Plumber",
                  "Sarah from POS bought a Honda Civic",
                  "Mike from Chaguanas sold his iPhone",
                  "Lisa from Tobago booked a Ride",
                  "David from San Fernando got a Job Letter",
                  "TriniBuild: 5,000+ Verified Users",
                  "Secure Payments via Endcash",
               ].map((text, i) => (
                  <span key={i} className="text-gray-400 mx-8 font-mono text-sm flex items-center">
                     <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                     {text}
                  </span>
               ))}
            </div>
         </div>

         {/* Value Proposition - Pain Points */}
         <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="text-center group">
                     <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-trini-red mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-red-100">
                        <ShieldCheck className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">Safety First</h3>
                     <p className="text-gray-500 leading-relaxed">We check IDs so you don't have to worry. Every driver and seller is verified.</p>
                  </div>
                  <div className="text-center group">
                     <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100">
                        <Zap className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
                     <p className="text-gray-500 leading-relaxed">Island-wide delivery in 24 hours. Get what you need, when you need it.</p>
                  </div>
                  <div className="text-center group">
                     <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-50 text-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-purple-100">
                        <FileText className="h-10 w-10" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900 mb-3">Less Paperwork</h3>
                     <p className="text-gray-500 leading-relaxed">Our AI handles the boring stuff. Job letters, invoices, and contracts in seconds.</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Mid Ad Spot (Preserved) */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdSpot page="home" slot="bottom" />
         </div>

         {/* AI Paperwork Assistant - Lead Magnet */}
         <section className="py-20 bg-indigo-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="md:w-1/2 text-white">
                  <div className="inline-block bg-indigo-800 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-indigo-700">
                     NEW: AI DOCUMENT ASSISTANT
                  </div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
                     Paperwork Giving You a Migraine?
                  </h2>
                  <p className="text-xl text-indigo-200 mb-8 leading-relaxed">
                     Let AI write your Job Letters, Proof of Income, and Visa Letters in seconds. Stop waiting in lines and get approved faster.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <button
                        onClick={() => {
                           const event = new CustomEvent('open-chat', { detail: { mode: 'paperwork_assistant' } });
                           window.dispatchEvent(event);
                        }}
                        className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg shadow-lg hover:bg-indigo-50 transition-all hover:scale-105 flex items-center justify-center"
                     >
                        Chat with Visa Expert <ArrowRight className="ml-2 h-5 w-5" />
                     </button>
                  </div>
               </div>
               <div className="md:w-1/2 flex justify-center">
                  <div className="relative">
                     <div className="absolute -inset-4 bg-indigo-500/30 rounded-full blur-2xl animate-pulse"></div>
                     <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                              <Wand2 className="h-6 w-6" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">AI Document Generator</h4>
                              <p className="text-xs text-gray-500">Instant • Verified • PDF</p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">US Visa Letters</p>
                           </div>
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">Proof of Income</p>
                           </div>
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">Contractor Agreements</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Final CTA */}
         <section className="py-24 bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
               <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Your Life, Upgraded.</h2>
               <p className="text-xl text-gray-400 mb-10">Join the thousands of Trinis who are saving time and making money with TriniBuild.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth" className="px-8 py-4 bg-trini-red text-white rounded-full font-bold text-lg shadow-lg hover:bg-red-700 transition-colors">
                     Join TriniBuild Today
                  </Link>
               </div>
            </div>
         </section>

      </div>
   );
};
