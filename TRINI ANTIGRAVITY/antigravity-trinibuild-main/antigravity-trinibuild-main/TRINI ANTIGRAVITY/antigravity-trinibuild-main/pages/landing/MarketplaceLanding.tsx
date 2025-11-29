
import React from 'react';
import { Check, ArrowRight, Play, ShieldCheck, TrendingUp, ShoppingBag, Zap, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketplaceLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* HERO SECTION: Pattern Interrupt */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1472851294608-4155f2118c04?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block py-1 px-3 rounded-full bg-trini-red/20 text-trini-red font-bold text-sm mb-6 border border-trini-red/50 animate-pulse">
              ⚠️ The Banking System Failed You.
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              We Built A <span className="text-trini-red">Free Digital Store</span> For Every Vendor.
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Most vendors can't afford a $5,000 website. So we made it free. Get 10 listings, accept Cash on Delivery, and join the ecosystem today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/create-store" className="bg-trini-red text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-red-900/50 flex items-center justify-center">
                Claim Free Store Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center">
                <Play className="mr-2 h-5 w-5 fill-current" /> Why We Do This
              </button>
            </div>
          </div>
          <div className="flex-1 w-full max-w-lg">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700 group">
               <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10 flex items-center justify-center cursor-pointer">
                  <div className="w-20 h-20 bg-trini-red rounded-full flex items-center justify-center shadow-xl pl-1 transform group-hover:scale-110 transition-transform">
                     <Play className="h-10 w-10 text-white fill-current" />
                  </div>
               </div>
               <img src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=1000&auto=format&fit=crop" alt="Platform Demo" className="w-full h-[400px] object-cover" />
            </div>
            <p className="text-center text-gray-400 text-sm mt-4 font-bold">See how the AI builds your site in 60 seconds.</p>
          </div>
        </div>
      </div>

      {/* AGITATION: The Old Way vs New Way */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why is it so hard to get online in Trinidad?</h2>
            <p className="text-lg text-gray-600">The traditional system is designed to keep you out. TriniBuild is designed to let you in.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* The Old Way */}
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 opacity-70 hover:opacity-100 transition-opacity">
                <h3 className="text-xl font-bold text-gray-500 mb-6 flex items-center uppercase tracking-wide">
                   <XCircle className="h-6 w-6 mr-2" /> The Old Way
                </h3>
                <ul className="space-y-4">
                   <li className="flex items-start text-gray-600">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Cost:</span>
                      TT$ 5,000+ for a basic website.
                   </li>
                   <li className="flex items-start text-gray-600">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Time:</span>
                      Weeks of back-and-forth with developers.
                   </li>
                   <li className="flex items-start text-gray-600">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Payments:</span>
                      Wait months for bank approval to take cards.
                   </li>
                   <li className="flex items-start text-gray-600">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Result:</span>
                      A site nobody visits because you have no traffic.
                   </li>
                </ul>
             </div>

             {/* The TriniBuild Way */}
             <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-trini-red relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-trini-red text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                   THE ECOSYSTEM
                </div>
                <h3 className="text-xl font-bold text-trini-red mb-6 flex items-center uppercase tracking-wide">
                   <Check className="h-6 w-6 mr-2" /> The TriniBuild Way
                </h3>
                <ul className="space-y-4">
                   <li className="flex items-start text-gray-800">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Cost:</span>
                      <span className="bg-green-100 text-green-800 px-2 rounded font-bold">FREE FOREVER</span> (10 Listings).
                   </li>
                   <li className="flex items-start text-gray-800">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Time:</span>
                      60 Seconds with our AI Store Creator.
                   </li>
                   <li className="flex items-start text-gray-800">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Payments:</span>
                      Cash on Delivery (COD) + WhatsApp Checkout instantly.
                   </li>
                   <li className="flex items-start text-gray-800">
                      <span className="font-bold text-gray-900 mr-2 min-w-[80px]">Result:</span>
                      Instant access to our directory traffic.
                   </li>
                </ul>
             </div>
          </div>
        </div>
      </div>

      {/* SOLUTION: The Shift */}
      <div className="py-24 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
               <div>
                  <h2 className="text-4xl font-extrabold text-gray-900 mb-6">
                     Built for Profit. <br/>Built for <span className="text-trini-red underline decoration-4 decoration-yellow-400">Trinidadians.</span>
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                     We don't just give you a website. We give you a traffic engine. By joining TriniBuild, you tap into a network of thousands of local buyers searching for products right now.
                  </p>
                  <ul className="space-y-4">
                     {[
                        "AI-Generated Product Listings (Upload a photo, we write the copy)",
                        "WhatsApp Checkout with Automated Invoicing",
                        "Integrated Delivery Network (TriniBuild Go)",
                        "Cash on Delivery Management System"
                     ].map((item, i) => (
                        <li key={i} className="flex items-center text-gray-800 font-medium">
                           <div className="bg-green-100 p-1 rounded-full mr-3">
                              <Check className="h-4 w-4 text-green-600" />
                           </div>
                           {item}
                        </li>
                     ))}
                  </ul>
                  <div className="mt-10">
                     <Link to="/create-store" className="text-trini-red font-bold text-lg flex items-center hover:underline">
                        Start building for free <ArrowRight className="ml-2 h-5 w-5" />
                     </Link>
                  </div>
               </div>
               <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-trini-red to-yellow-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
                  <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" alt="Dashboard" className="relative rounded-2xl shadow-2xl border border-gray-100" />
               </div>
            </div>
         </div>
      </div>

      {/* PRICING TEASER */}
      <div className="bg-trini-black text-white py-20 text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6">Our Ascension Model</h2>
            <p className="text-gray-400 mb-8 text-lg">
               We are a for-profit brand, but we believe entry should be free. <br/>
               Start with the <strong className="text-white">Community Plan</strong>. Ascend to <strong className="text-white">Growth</strong> only when you have too many sales to handle.
            </p>
            <Link to="/pricing" className="inline-block bg-white text-trini-black font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition-colors">
               View the Ecosystem Plans
            </Link>
         </div>
      </div>

      {/* FINAL CTA */}
      <div className="py-20 text-center bg-gray-50">
         <h2 className="text-3xl font-bold text-gray-900 mb-6">Don't let the banks win.</h2>
         <p className="text-gray-600 mb-8">Claim your spot in the digital economy today.</p>
         <Link to="/create-store" className="inline-block bg-trini-red text-white px-12 py-5 rounded-full font-extrabold text-xl hover:scale-105 transition-transform shadow-2xl">
            Claim Your Free Store Now
         </Link>
         <p className="mt-4 text-xs text-gray-500 font-bold uppercase">No Credit Card Required • 10 Free Listings</p>
      </div>
    </div>
  );
};
