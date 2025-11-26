import React, { useEffect, useState } from 'react';
import { Search, MapPin, Star, TrendingUp, Briefcase, ShoppingCart, Car, Truck, ArrowRight, Check, ShieldCheck, Globe, Play, ExternalLink, Volume2, VolumeX, Wand2, Zap, ChevronRight, Settings, Wallet, CreditCard, Heart, Home as HomeIcon, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAdConfig, AdConfig } from '../services/adService';
import { AdSpot } from '../components/AdSpot';

export const Home: React.FC = () => {
   const navigate = useNavigate();
   const [adConfig, setAdConfig] = useState<AdConfig>(getAdConfig());
   const [mutedTop, setMutedTop] = useState(true);
   const [mutedMid, setMutedMid] = useState(true);
   const [isListening, setIsListening] = useState(false);

   // Hero Customization State
   const [heroTint, setHeroTint] = useState(0.7);
   const [heroColor, setHeroColor] = useState('#000000');

   // CRO State
   const [heroMode, setHeroMode] = useState<'find' | 'grow'>('grow'); // Default to 'grow' to push the mission
   const [businessNameInput, setBusinessNameInput] = useState('');
   const [recentClaim, setRecentClaim] = useState({ name: "Aunty May's Kitchen", location: "Arima" });

   useEffect(() => {
      setAdConfig(getAdConfig());

      const claims = [
         { name: "Sando Car Parts", location: "San Fernando" },
         { name: "Debbie's Doubles", location: "Curepe" },
         { name: "Tobago Surf Shop", location: "Crown Point" },
         { name: "Dr. PC Fix", location: "Chaguanas" },
         { name: "Trini Woodworks", location: "Sangre Grande" }
      ];
      let i = 0;
      const interval = setInterval(() => {
         setRecentClaim(claims[i]);
         i = (i + 1) % claims.length;
      }, 5000);
      return () => clearInterval(interval);
   }, []);

   const handleVoiceSearch = () => {
      if (!('webkitSpeechRecognition' in window)) {
         alert("Voice search is supported in Chrome/Edge.");
         return;
      }
      setIsListening(true);
      // @ts-ignore
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-TT';

      recognition.onresult = (event: any) => {
         const transcript = event.results[0][0].transcript;
         const searchInput = document.getElementById('main-search') as HTMLInputElement;
         if (searchInput) searchInput.value = transcript;
         setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
   };

   const handleBusinessStart = (e: React.FormEvent) => {
      e.preventDefault();
      if (businessNameInput.trim()) {
         navigate(`/create-store?claim_name=${encodeURIComponent(businessNameInput)}`);
      } else {
         navigate('/create-store');
      }
   };

   return (
      <div className="min-h-screen bg-gray-50 font-sans overflow-x-hidden">

         {/* Parallax Hero Section */}
         <div className="relative h-screen flex items-center justify-center overflow-hidden parallax-bg bg-hero-pattern">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-900/90"></div>

            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto animate-fade-in">
               <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-trini-gold font-bold text-sm tracking-wider uppercase">
                  The #1 Super App in Trinidad & Tobago
               </div>
               <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
                  Build. Shop. <span className="text-transparent bg-clip-text bg-gradient-to-r from-trini-red to-trini-gold">Live.</span>
               </h1>
               <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
                  Your all-in-one digital ecosystem. From local shopping to ride-sharing, professional services to event tickets.
               </p>

               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link to="/directory" className="group relative px-8 py-4 bg-trini-red text-white rounded-full font-bold text-lg shadow-lg hover:bg-red-700 transition-all hover:scale-105 hover:shadow-trini-red/50 overflow-hidden">
                     <span className="relative z-10 flex items-center">
                        Explore Marketplace <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                     </span>
                     <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </Link>
                  <Link to="/auth" className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all hover:scale-105">
                     Join for Free
                  </Link>
               </div>
            </div>

            {/* Floating Elements Animation */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center animate-bounce-slow">
               <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
                  <div className="w-1 h-2 bg-white rounded-full animate-slide-up"></div>
               </div>
            </div>
         </div>

         {/* Top Ad Spot */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-30 mb-12">
            <AdSpot page="home" slot="top" />
         </div>

         {/* Services Grid with Glassmorphism */}
         <section className="relative py-12 z-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                  { title: 'Marketplace', icon: ShoppingCart, color: 'bg-blue-500', link: '/directory', desc: 'Shop local stores & products' },
                  { title: 'Rides', icon: Car, color: 'bg-green-500', link: '/rides', desc: 'Safe & reliable transportation' },
                  { title: 'TriniWorks', icon: Briefcase, color: 'bg-purple-500', link: '/jobs', desc: 'Hire top local professionals' },
                  { title: 'Tickets', icon: Ticket, color: 'bg-pink-500', link: '/tickets', desc: 'Events, parties & shows' },
               ].map((service, idx) => (
                  <Link
                     key={idx}
                     to={service.link}
                     className="group glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl relative overflow-hidden"
                  >
                     <div className={`absolute top-0 right-0 w-32 h-32 ${service.color} opacity-10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500`}></div>
                     <div className={`${service.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                        <service.icon className="h-7 w-7" />
                     </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.title}</h3>
                     <p className="text-gray-500 font-medium">{service.desc}</p>
                     <div className="mt-6 flex items-center text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors">
                        Learn more <ArrowRight className="ml-2 h-4 w-4" />
                     </div>
                  </Link>
               ))}
            </div>
         </section>

         {/* Value Proposition */}
         <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Why TriniBuild?</h2>
                  <p className="text-xl text-gray-500 max-w-2xl mx-auto">We're building the digital infrastructure for the future of Trinidad & Tobago.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                     { title: 'Verified & Secure', icon: ShieldCheck, desc: 'Every vendor and driver is verified. Secure payments via Stripe & Endcash.' },
                     { title: 'Fast Delivery', icon: Zap, desc: 'Island-wide delivery network. Get your items same-day or next-day.' },
                     { title: 'Premium Quality', icon: Star, desc: 'Curated selection of the best local businesses and service providers.' },
                  ].map((item, i) => (
                     <div key={i} className="text-center group">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 text-trini-red mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-gray-100">
                           <item.icon className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Mid Ad Spot */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdSpot page="home" slot="bottom" />
         </div>

         {/* Paperwork Assistant Section */}
         <section className="py-20 bg-indigo-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="md:w-1/2 text-white">
                  <div className="inline-block bg-indigo-800 text-indigo-200 text-xs font-bold px-3 py-1 rounded-full mb-4 border border-indigo-700">
                     NEW: AI DOCUMENT ASSISTANT
                  </div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
                     Paperwork giving you a headache?
                  </h2>
                  <p className="text-xl text-indigo-200 mb-8 leading-relaxed">
                     Get instant help with Job Letters, Proof of Income, and Visa Application requirements. Our AI expert guides you through the red tape so you can get approved faster.
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
                     <Link to="/pricing" className="px-8 py-4 bg-indigo-800 border border-indigo-700 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center">
                        View Document Plans
                     </Link>
                  </div>
               </div>
               <div className="md:w-1/2 flex justify-center">
                  <div className="relative">
                     <div className="absolute -inset-4 bg-indigo-500/30 rounded-full blur-2xl animate-pulse"></div>
                     <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm relative transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                           <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                              <Globe className="h-6 w-6" />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">Visa Application Support</h4>
                              <p className="text-xs text-gray-500">US B1/B2 • Canada • UK</p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">Verified Job Letters</p>
                           </div>
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">Proof of Income Statements</p>
                           </div>
                           <div className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5" />
                              <p className="text-sm text-gray-600">Bank-Ready Financials</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* CTA Section */}
         <section className="py-24 bg-gray-900 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
               <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">Ready to transform your digital experience?</h2>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/auth" className="px-8 py-4 bg-trini-red text-white rounded-full font-bold text-lg shadow-lg hover:bg-red-700 transition-colors">
                     Get Started Now
                  </Link>
                  <Link to="/contact" className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-gray-900 transition-colors">
                     Contact Sales
                  </Link>
               </div>
            </div>
         </section>

      </div>
   );
};

function MessageCircle(props: any) {
   return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></svg>
   )
}
