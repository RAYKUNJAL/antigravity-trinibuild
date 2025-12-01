
import React from 'react';
import { ArrowRight, ShieldCheck, Zap, DollarSign, Server, Lock, X, Check, Users, TrendingUp, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export const TicketsLanding: React.FC = () => {
   return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-trini-red selection:text-white">
         <SEO
            title="TriniBuild E-Tick - AI Powered Event Ticketing"
            description="The Caribbean's first AI-powered ticketing platform. Zero crashes, instant payouts, and dynamic QR security. Lock in your 6% rate today."
            keywords="event ticketing trinidad, carnival tickets, party tickets trinidad, event management software, trinibuild tickets"
         />
         {/* SECTION 1: THE HOOK (Above the Fold) */}
         <div className="relative h-screen max-h-[900px] flex items-center justify-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
               <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black z-10"></div>
               <img
                  src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop"
                  alt="Concert Crowd"
                  className="w-full h-full object-cover opacity-50"
               />
            </div>

            <div className="relative z-20 max-w-5xl mx-auto px-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="inline-flex items-center gap-2 border border-purple-500/50 bg-purple-500/10 px-4 py-1.5 rounded-full text-purple-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <Brain className="h-3 w-3" />
                  The Caribbean's First AI-Powered Platform
               </div>

               <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                  Did their site crash again? <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-trini-red to-orange-600">We stay online.</span>
               </h1>

               <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Stop losing sales to "Server Overload" screens. TriniBuild E-Tick uses <strong>advanced AI infrastructure</strong> to handle 100,000+ users instantly.
                  <strong> Zero crashes. Instant payouts.</strong>
               </p>

               <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                     to="/tickets/onboarding"
                     className="w-full sm:w-auto bg-trini-red text-white px-8 py-4 rounded-full font-extrabold text-lg hover:bg-red-600 hover:scale-105 transition-all shadow-[0_0_40px_rgba(206,17,38,0.4)] flex items-center justify-center"
                  >
                     Switch & Lock 6% Rate <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                     to="/tickets"
                     className="w-full sm:w-auto bg-transparent border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all"
                  >
                     View Demo Event
                  </Link>
               </div>
               <p className="mt-6 text-xs text-gray-500 uppercase font-bold tracking-widest">
                  Trusted by 50+ Promoters • 24/7 Local Support
               </p>
            </div>
         </div>

         {/* SECTION 2: THE PAIN (Comparison) */}
         <div className="py-24 bg-gray-900 border-y border-gray-800">
            <div className="max-w-6xl mx-auto px-4">
               <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Promoters Are Leaving The Others.</h2>
                  <p className="text-gray-400">The industry standard isn't good enough anymore.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  {/* The Old Way */}
                  <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-8 opacity-70 hover:opacity-100 transition-opacity">
                     <h3 className="text-red-500 font-bold text-xl mb-6 flex items-center uppercase tracking-wide">
                        <X className="h-6 w-6 mr-2" /> The "Other" Platforms
                     </h3>
                     <ul className="space-y-6">
                        <li className="flex items-start text-gray-400">
                           <div className="bg-red-900/20 p-1 rounded mr-3 mt-1"><X className="h-4 w-4 text-red-500" /></div>
                           <div>
                              <strong className="block text-white">Site Crashes on Launch</strong>
                              Users get frustrated, refresh the page, and give up. You lose momentum.
                           </div>
                        </li>
                        <li className="flex items-start text-gray-400">
                           <div className="bg-red-900/20 p-1 rounded mr-3 mt-1"><X className="h-4 w-4 text-red-500" /></div>
                           <div>
                              <strong className="block text-white">"Weekly" Payouts</strong>
                              They hold your money for weeks. You need cash to pay vendors <em>now</em>.
                           </div>
                        </li>
                        <li className="flex items-start text-gray-400">
                           <div className="bg-red-900/20 p-1 rounded mr-3 mt-1"><X className="h-4 w-4 text-red-500" /></div>
                           <div>
                              <strong className="block text-white">Static QR Codes</strong>
                              Screenshots get shared. One ticket enters 5 people. You lose revenue.
                           </div>
                        </li>
                     </ul>
                  </div>

                  {/* The TriniBuild Way */}
                  <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl transform hover:-translate-y-2 transition-transform duration-300">
                     <div className="absolute top-0 right-0 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                        SUPERIOR TECH
                     </div>
                     <h3 className="text-green-400 font-bold text-xl mb-6 flex items-center uppercase tracking-wide">
                        <Check className="h-6 w-6 mr-2" /> The TriniBuild E-Tick
                     </h3>
                     <ul className="space-y-6">
                        <li className="flex items-start text-gray-300">
                           <div className="bg-green-500/20 p-1 rounded mr-3 mt-1"><Server className="h-4 w-4 text-green-400" /></div>
                           <div>
                              <strong className="block text-white">Google Cloud Scaling</strong>
                              Auto-scales to handle 100k users in seconds. We never go down.
                           </div>
                        </li>
                        <li className="flex items-start text-gray-300">
                           <div className="bg-green-500/20 p-1 rounded mr-3 mt-1"><DollarSign className="h-4 w-4 text-green-400" /></div>
                           <div>
                              <strong className="block text-white">Daily Instant Payouts</strong>
                              Request your funds anytime. Wired to Republic/Scotia/FCB same-day.
                           </div>
                        </li>
                        <li className="flex items-start text-gray-300">
                           <div className="bg-green-500/20 p-1 rounded mr-3 mt-1"><Lock className="h-4 w-4 text-green-400" /></div>
                           <div>
                              <strong className="block text-white">Dynamic AI Security</strong>
                              QR codes rotate every 60s. Device fingerprinting stops scalper bots.
                           </div>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
         </div>

         {/* SECTION 3: FEATURES GRID */}
         <div className="py-24 bg-black">
            <div className="max-w-7xl mx-auto px-4">
               <div className="text-center max-w-3xl mx-auto mb-20">
                  <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Infusing AI into <br /><span className="text-trini-red">Caribbean Culture.</span></h2>
                  <p className="text-gray-400 text-lg">
                     We engineered AI specifically for our unique event landscape. From massive Carnivals to intimate workshops, our tech adapts to your vibe, all year round.
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-trini-red transition-colors group">
                     <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-trini-red transition-colors">
                        <Zap className="h-8 w-8 text-white" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-white">Offline-First Scanning</h3>
                     <p className="text-gray-400 leading-relaxed">
                        Internet bad in Chaguaramas? No problem. Our scanners sync locally so the line keeps moving even without data.
                     </p>
                  </div>
                  <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-trini-red transition-colors group">
                     <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-trini-red transition-colors">
                        <Users className="h-8 w-8 text-white" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-white">Committee Links</h3>
                     <p className="text-gray-400 leading-relaxed">
                        Ditch the physical ticket books. Give committee members unique links and track their sales automatically.
                     </p>
                  </div>
                  <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 hover:border-trini-red transition-colors group">
                     <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-trini-red transition-colors">
                        <TrendingUp className="h-8 w-8 text-white" />
                     </div>
                     <h3 className="text-xl font-bold mb-3 text-white">Predictive Analytics</h3>
                     <p className="text-gray-400 leading-relaxed">
                        Our AI predicts Male/Female ratios and peak entry times, helping you staff your gates and bars perfectly.
                     </p>
                  </div>
               </div>
            </div>
         </div>

         {/* SECTION 4: SOCIAL PROOF / TRUST */}
         <div className="py-20 border-t border-gray-900 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-5xl mx-auto px-4 text-center">
               <h2 className="text-2xl font-bold text-gray-500 mb-10 uppercase tracking-widest">Secure Payments Supported By</h2>
               <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Mock Logos for Trust */}
                  <div className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="h-8 w-8" /> VISA Secure</div>
                  <div className="flex items-center gap-2 text-xl font-bold"><Lock className="h-8 w-8" /> MasterCard ID</div>
                  <div className="flex items-center gap-2 text-xl font-bold"><DollarSign className="h-8 w-8" /> WiPay</div>
                  <div className="flex items-center gap-2 text-xl font-bold"><Server className="h-8 w-8" /> PayPal</div>
               </div>
            </div>
         </div>

         {/* SECTION 5: FINAL CTA (The Offer) */}
         <div className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-trini-red/10"></div>
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
               <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                  Stop paying 10% fees.
               </h2>
               <p className="text-xl text-gray-300 mb-10">
                  Join the TriniBuild Founder's Club today. Lock in a <strong>6% fee rate</strong> for 1 year. <br />
                  Not just for Carnival—use it for every event you host.
               </p>
               <Link
                  to="/tickets/onboarding"
                  className="inline-flex items-center bg-white text-black px-12 py-5 rounded-full font-extrabold text-xl hover:bg-gray-200 transition-all transform hover:scale-105 shadow-2xl"
               >
                  Lock My 6% Rate <ArrowRight className="ml-3 h-6 w-6" />
               </Link>
               <p className="mt-6 text-sm text-gray-500">
                  No setup fees. Cancel anytime.
               </p>
            </div>
         </div>

      </div>
   );
};
