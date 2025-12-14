
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Camera, MapPin, DollarSign, Tag, Clock, MessageCircle, ChevronRight, TrendingUp, Star, X, Upload, Loader } from 'lucide-react';
import { AdSpot } from '../components/AdSpot';
import { classifiedService, ClassifiedListing } from '../services/classifiedService';
import { supabase } from '../services/supabaseClient';

export const Classifieds: React.FC = () => {
   const [activeCategory, setActiveCategory] = useState('All');
   const [searchTerm, setSearchTerm] = useState('');
   const [listings, setListings] = useState<ClassifiedListing[]>([]);
   const [loading, setLoading] = useState(true);
   const [showPostModal, setShowPostModal] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Post Ad Form State
   const [newAd, setNewAd] = useState({
      title: '',
      price: '',
      category: 'Vehicles',
      location: '',
      description: '',
      phone: '',
      images: [] as File[]
   });

   const categories = ['All', 'Vehicles', 'Electronics', 'Furniture', 'Real Estate', 'Jobs', 'Services', 'Clothing', 'Tools', 'Other'];

   // Fetch Listings
   useEffect(() => {
      loadListings();
   }, [activeCategory, searchTerm]);

   const loadListings = async () => {
      setLoading(true);
      try {
         const data = await classifiedService.getListings(activeCategory, searchTerm);
         setListings(data);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   // Handle Post Ad
   const handlePostAd = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            alert("Please sign in to post an ad.");
            // Navigate to login or show auth modal (omitted for brevity)
            return;
         }

         await classifiedService.createListing({
            title: newAd.title,
            price: parseFloat(newAd.price),
            category: newAd.category,
            location: newAd.location,
            description: newAd.description,
            contact_info: { phone: newAd.phone }
         }, newAd.images);

         alert("Ad posted successfully!");
         setShowPostModal(false);
         setNewAd({ title: '', price: '', category: 'Vehicles', location: '', description: '', phone: '', images: [] });
         loadListings(); // Refresh feed
      } catch (err) {
         alert("Failed to post ad. Please try again.");
         console.error(err);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleContact = (title: string, phone?: string) => {
      if (phone) {
         window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hi, I'm interested in your ad on TriniBuild: ${title}`, '_blank');
      } else {
         alert("No phone number provided.");
      }
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
                        <button onClick={() => setShowPostModal(true)} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-purple-700 flex items-center transition-all hover:scale-105">
                           <Camera className="h-5 w-5 mr-2" /> Post Free Ad
                        </button>
                     </div>
                  </div>

                  {/* Search & Filter */}
                  <div className="mt-8 flex flex-col md:flex-row gap-4">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                        <input
                           type="text"
                           placeholder="What are you looking for?"
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        />
                     </div>
                     <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
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

               <AdSpot page="classifieds" slot="top" className="mb-8" />

               {loading ? (
                  <div className="text-center py-20">
                     <Loader className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                     <p className="text-gray-500">Loading listings...</p>
                  </div>
               ) : listings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                     <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                     <p className="text-gray-500 text-lg">No listings found.</p>
                     <button onClick={() => setShowPostModal(true)} className="mt-4 text-purple-600 font-bold hover:underline">Post the first ad!</button>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {listings.map(item => (
                        <div key={item.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group ${item.promoted ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
                           <div className="h-48 relative bg-gray-100">
                              <img src={item.images[0] || 'https://via.placeholder.com/400?text=No+Image'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              {item.promoted && (
                                 <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center">
                                    <TrendingUp className="h-3 w-3 mr-1" /> Featured
                                 </div>
                              )}
                              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">
                                 {new Date(item.created_at).toLocaleDateString()}
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
                                 onClick={() => handleContact(item.title, item.contact_info?.phone || item.contact_info?.whatsapp)}
                                 className="w-full border border-purple-600 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 flex items-center justify-center text-sm transition-colors"
                              >
                                 <MessageCircle className="h-4 w-4 mr-2" /> Chat Seller
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
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

            {/* Post Ad Modal */}
            {showPostModal && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                     <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-2xl font-bold text-gray-800">Post a New Ad</h2>
                        <button onClick={() => setShowPostModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
                     </div>
                     <form onSubmit={handlePostAd} className="p-6 space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                              <input required type="text" className="w-full border rounded-lg p-3" placeholder="e.g. 2015 Kia Sportage" value={newAd.title} onChange={e => setNewAd({ ...newAd, title: e.target.value })} />
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Price (TTD)</label>
                              <div className="relative">
                                 <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                 <input required type="number" className="w-full border rounded-lg pl-10 p-3" placeholder="0.00" value={newAd.price} onChange={e => setNewAd({ ...newAd, price: e.target.value })} />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                              <select className="w-full border rounded-lg p-3" value={newAd.category} onChange={e => setNewAd({ ...newAd, category: e.target.value })}>
                                 {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                              <input required type="text" className="w-full border rounded-lg p-3" placeholder="e.g. Chaguanas" value={newAd.location} onChange={e => setNewAd({ ...newAd, location: e.target.value })} />
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                           <textarea required rows={4} className="w-full border rounded-lg p-3" placeholder="Describe your item..." value={newAd.description} onChange={e => setNewAd({ ...newAd, description: e.target.value })} />
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Photos</label>
                           <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                              <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setNewAd({ ...newAd, images: Array.from(e.target.files) })} />
                              <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm font-medium">Click to upload photos</p>
                              {newAd.images.length > 0 && <p className="text-green-600 font-bold mt-2">{newAd.images.length} files selected</p>}
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-700 mb-2">Contact Number (WhatsApp)</label>
                           <input required type="tel" className="w-full border rounded-lg p-3" placeholder="e.g. 868-123-4567" value={newAd.phone} onChange={e => setNewAd({ ...newAd, phone: e.target.value })} />
                        </div>

                        <div className="pt-4 border-t">
                           <button disabled={isSubmitting} type="submit" className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center text-lg disabled:opacity-50">
                              {isSubmitting ? (
                                 <>
                                    <Loader className="mr-2 animate-spin" /> Posting...
                                 </>
                              ) : (
                                 <>
                                    Post Ad Now <ChevronRight className="ml-2 h-5 w-5" />
                                 </>
                              )}
                           </button>
                           <p className="text-center text-xs text-gray-500 mt-2">By posting, you agree to our Terms of Service.</p>
                        </div>
                     </form>
                  </div>
               </div>
            )}
         </div>
      </>
   );
};

