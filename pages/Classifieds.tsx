
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Camera, MapPin, DollarSign, Tag, Clock, MessageCircle, ChevronRight, TrendingUp, Star } from 'lucide-react';
import { AdSpot } from '../components/AdSpot';

export const Classifieds: React.FC = () => {
   const [activeCategory, setActiveCategory] = useState('All');

   const categories = ['All', 'Vehicles', 'Electronics', 'Furniture', 'Real Estate', 'Jobs', 'Services'];

   const items = [
      { id: 1, title: "2018 Toyota Aqua", price: 65000, location: "Chaguanas", category: "Vehicles", image: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=800", posted: "2 hrs ago", promoted: true },
      { id: 2, title: "iPhone 14 Pro Max", price: 6500, location: "Port of Spain", category: "Electronics", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800", posted: "5 hrs ago", promoted: false },
      { id: 3, title: "L-Shape Sofa Set", price: 2500, location: "Arima", category: "Furniture", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800", posted: "1 day ago", promoted: false },
      { id: 4, title: "Gaming PC Full Setup", price: 8000, location: "San Fernando", category: "Electronics", image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800", posted: "3 days ago", promoted: true },
      { id: 5, title: "Honda Civic Rims 17 inch", price: 3000, location: "Curepe", category: "Vehicles", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800", posted: "1 week ago", promoted: false },
   ];

   const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

   const handleContact = (title: string) => {
      alert(`Opening WhatsApp chat for: ${title}`);
   };

   return (
      <>
         <Helmet>
            <title>Buy & Sell Classifieds Trinidad & Tobago | TriniBuild Market</title>
            <meta name="description" content="Buy and sell vehicles, electronics, furniture, and more in Trinidad & Tobago. Free classifieds for locals - post your ad and sell fast!" />
            <meta name="keywords" content="Trinidad classifieds, Tobago buy sell, used cars Trinidad, electronics T&T, furniture Port of Spain, free classifieds" />
            <link rel="canonical" href="https://trinibuild.com/#/classifieds" />
            <meta property="og:title" content="TriniBuild Market - Buy & Sell in Trinidad & Tobago" />
            <meta property="og:description" content="Free online classifieds for Trinidad & Tobago. List your items and reach thousands of local buyers." />
         </Helmet>
         <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 py-8">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                     <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">TriniBuild <span className="text-purple-600">Market</span></h1>
                        <p className="text-gray-500">Buy and sell anything in Trinidad & Tobago.</p>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => alert("Post Ad Wizard")} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-purple-700 flex items-center">
                           <Camera className="h-5 w-5 mr-2" /> Post Free Ad
                        </button>
                     </div>
                  </div>

                  {/* Search & Filter */}
                  <div className="mt-8 flex flex-col md:flex-row gap-4">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input type="text" placeholder="What are you looking for?" className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                     </div>
                     <div className="flex gap-2 overflow-x-auto pb-1">
                        {categories.map(cat => (
                           <button
                              key={cat}
                              onClick={() => setActiveCategory(cat)}
                              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                           >
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Listings */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

               {/* Ad Spot */}
               <AdSpot page="classifieds" slot="top" className="mb-8" />

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredItems.map(item => (
                     <div key={item.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group ${item.promoted ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
                        <div className="h-48 relative">
                           <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           {item.promoted && (
                              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center">
                                 <TrendingUp className="h-3 w-3 mr-1" /> Featured
                              </div>
                           )}
                           <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">
                              {item.posted}
                           </div>
                        </div>
                        <div className="p-4">
                           <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-gray-900 line-clamp-1" title={item.title}>{item.title}</h3>
                           </div>
                           <p className="text-purple-700 font-extrabold text-lg mb-3">TT$ {item.price.toLocaleString()}</p>

                           <div className="flex items-center text-xs text-gray-500 mb-4">
                              <MapPin className="h-3 w-3 mr-1" /> {item.location}
                              <span className="mx-2">•</span>
                              <Tag className="h-3 w-3 mr-1" /> {item.category}
                           </div>

                           <button
                              onClick={() => handleContact(item.title)}
                              className="w-full border border-purple-600 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 flex items-center justify-center text-sm transition-colors"
                           >
                              <MessageCircle className="h-4 w-4 mr-2" /> Chat Seller
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Monetization Strip */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
               <div className="bg-gradient-to-r from-gray-900 to-purple-900 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-xl">
                  <div className="mb-4 md:mb-0">
                     <h3 className="font-bold text-xl mb-1 flex items-center"><Star className="h-5 w-5 text-yellow-400 mr-2 fill-current" /> Sell Faster with Boost</h3>
                     <p className="text-purple-200 text-sm">Get 10x more views on your items.</p>
                  </div>
                  <div className="flex gap-4">
                     <button className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20">Highlight ($5)</button>
                     <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 shadow-lg">Top of Page ($20)</button>
                  </div>
               </div>
            </div>
         </div>
      </>
   );
};
