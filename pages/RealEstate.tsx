import React, { useState, useEffect } from 'react';
import { Home, MapPin, Search, Filter, Bed, Bath, Square, DollarSign, Heart, Calculator, Phone, User, X, Check, Star, Building, ShieldCheck, Camera, Share2, ArrowRight, Map as MapIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { RealEstateListing, realEstateService } from '../services/realEstateService';
import { ChatWidget } from '../components/ChatWidget';
import { AdSpot } from '../components/AdSpot';

export const RealEstate: React.FC = () => {
   const [type, setType] = useState<'rent' | 'buy'>('rent');
   const [priceRange, setPriceRange] = useState(5000);
   const [selectedProperty, setSelectedProperty] = useState<RealEstateListing | null>(null);
   const [showPricingModal, setShowPricingModal] = useState(false);
   const [leadForm, setLeadForm] = useState({ name: '', phone: '', message: '' });
   const [properties, setProperties] = useState<RealEstateListing[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
   const [showFilters, setShowFilters] = useState(false);

   useEffect(() => {
      const fetchProperties = async () => {
         setIsLoading(true);
         try {
            const data = await realEstateService.getListings();
            setProperties(data);
         } catch (error) {
            console.error("Failed to load properties", error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchProperties();
   }, []);

   const handleSendLead = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Inquiry Sent! The agent will contact you shortly.");
      setLeadForm({ name: '', phone: '', message: '' });
   };

   const filteredProperties = properties.filter(p => p.type === type && p.price <= (type === 'rent' ? priceRange : priceRange * 1000));

   return (
      <div className="min-h-screen bg-gray-50 font-sans">

         {/* Premium Hero Section */}
         <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 parallax-bg bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop')]">
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
            </div>

            <div className="relative z-10 max-w-5xl w-full px-4 text-center animate-in zoom-in duration-700">
               <span className="inline-block py-1 px-3 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                  TriniBuild Living
               </span>
               <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                  Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Sanctuary</span>
               </h1>
               <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
                  Discover the finest homes, apartments, and commercial spaces across Trinidad & Tobago.
               </p>

               {/* Search Box */}
               <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2">
                  <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0">
                     <button
                        onClick={() => setType('rent')}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${type === 'rent' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        Rent
                     </button>
                     <button
                        onClick={() => setType('buy')}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all ${type === 'buy' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                     >
                        Buy
                     </button>
                  </div>
                  <div className="flex-grow relative">
                     <Search className="absolute left-4 top-3.5 text-gray-400 h-5 w-5" />
                     <input
                        type="text"
                        placeholder="City, Neighborhood, or Address..."
                        className="w-full pl-12 pr-4 py-3.5 bg-transparent outline-none text-gray-900 placeholder-gray-500 font-medium"
                     />
                  </div>
                  <button className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center">
                     Search
                  </button>
               </div>
            </div>
         </div>

         {/* Main Content */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            {/* Ad Spot */}
            <AdSpot page="real_estate" slot="top" className="mb-8" />

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 sticky top-20 z-30 bg-gray-50/90 backdrop-blur py-4">
               <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                     {type === 'rent' ? 'Rentals' : 'For Sale'}
                     <span className="text-gray-400 font-normal text-lg ml-2">({filteredProperties.length})</span>
                  </h2>
                  <button
                     onClick={() => setShowFilters(!showFilters)}
                     className="md:hidden flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold shadow-sm"
                  >
                     <Filter className="h-4 w-4 mr-2" /> Filters
                  </button>
               </div>

               <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                  <button
                     onClick={() => setViewMode('grid')}
                     className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     <Square className="h-5 w-5" />
                  </button>
                  <button
                     onClick={() => setViewMode('map')}
                     className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                     <MapIcon className="h-5 w-5" />
                  </button>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

               {/* Filters Sidebar (Desktop: Always visible, Mobile: Toggle) */}
               <div className={`w-full lg:w-72 flex-shrink-0 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>

                  {/* Landlord CTA */}
                  <div className="bg-gradient-to-br from-green-900 to-emerald-800 rounded-2xl p-6 text-white text-center shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all"></div>
                     <h3 className="font-bold text-lg mb-2 relative z-10">List Your Property</h3>
                     <p className="text-sm text-green-100 mb-4 relative z-10">Reach thousands of potential tenants instantly.</p>
                     <button onClick={() => setShowPricingModal(true)} className="w-full bg-white text-green-900 font-bold py-3 rounded-xl hover:bg-green-50 transition-colors shadow-lg relative z-10">
                        Post a Listing
                     </button>
                  </div>

                  {/* Filter Panel */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-40">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900">Filters</h3>
                        <button onClick={() => { setPriceRange(5000); setType('rent'); }} className="text-xs text-green-600 font-bold hover:underline">Reset</button>
                     </div>

                     <div className="space-y-8">
                        <div>
                           <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                              <span>Max Price</span>
                              <span className="text-green-600 font-bold">
                                 ${type === 'rent' ? priceRange.toLocaleString() : (priceRange * 1000).toLocaleString()}
                              </span>
                           </div>
                           <input
                              type="range"
                              min="1000"
                              max={type === 'rent' ? 20000 : 5000}
                              step="100"
                              value={priceRange}
                              onChange={(e) => setPriceRange(Number(e.target.value))}
                              className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-green-600"
                           />
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-900 mb-3">Property Type</label>
                           <div className="space-y-3">
                              {['House', 'Apartment', 'Condo', 'Land', 'Commercial'].map(t => (
                                 <label key={t} className="flex items-center cursor-pointer group">
                                    <div className="relative flex items-center">
                                       <input type="checkbox" className="peer h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all" />
                                    </div>
                                    <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{t}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        <div>
                           <label className="block text-sm font-bold text-gray-900 mb-3">Bedrooms</label>
                           <div className="grid grid-cols-4 gap-2">
                              {['Any', '1+', '2+', '3+'].map(b => (
                                 <button key={b} className={`py-2 border rounded-lg text-sm font-medium transition-all ${b === 'Any' ? 'bg-green-50 border-green-200 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                    {b}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Mortgage Calculator Widget */}
                  {type === 'buy' && (
                     <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center mb-4">
                           <Calculator className="h-5 w-5 mr-2 text-blue-300" />
                           <h3 className="font-bold">Mortgage Estimator</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                           <div className="flex justify-between">
                              <span className="text-blue-200">Price</span>
                              <span className="font-medium">$1.5M</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-blue-200">Down (10%)</span>
                              <span className="font-medium">$150k</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-blue-200">Rate</span>
                              <span className="font-medium">5.5%</span>
                           </div>
                           <div className="border-t border-blue-700 pt-3 mt-3 flex justify-between items-center">
                              <span className="text-blue-200">Monthly</span>
                              <span className="text-xl font-bold text-green-400">$7,665</span>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Listings Grid */}
               <div className="flex-grow">
                  {isLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                           <div key={i} className="bg-white rounded-xl h-96 animate-pulse"></div>
                        ))}
                     </div>
                  ) : viewMode === 'map' ? (
                     <div className="bg-gray-200 rounded-2xl h-[600px] flex items-center justify-center relative overflow-hidden border border-gray-300">
                        <div className="absolute inset-0 bg-[url('https://mt1.google.com/vt/lyrs=m&x=1325&y=3143&z=13')] bg-cover opacity-50 grayscale"></div>
                        <div className="bg-white p-6 rounded-xl shadow-xl z-10 text-center max-w-sm mx-4">
                           <MapIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                           <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map View</h3>
                           <p className="text-gray-500 mb-6">Explore properties visually across Trinidad & Tobago.</p>
                           <button onClick={() => setViewMode('grid')} className="bg-gray-900 text-white px-6 py-2 rounded-full font-bold text-sm">
                              Switch to List View
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredProperties.map(property => (
                           <div
                              key={property.id}
                              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                              onClick={() => setSelectedProperty(property)}
                           >
                              <div className="h-64 relative overflow-hidden">
                                 <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                 <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-red-500 transition-all z-10">
                                    <Heart className="h-5 w-5" />
                                 </button>

                                 <div className="absolute bottom-4 left-4 flex gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm ${property.type === 'rent' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                                       {property.type === 'rent' ? 'For Rent' : 'For Sale'}
                                    </span>
                                    {property.isFeatured && (
                                       <span className="bg-yellow-400 text-black px-3 py-1 rounded-lg text-xs font-bold flex items-center shadow-sm">
                                          <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                                       </span>
                                    )}
                                    {/* Sample Listing Label */}
                                    <span className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow-sm border border-white/20">
                                       Sample Listing
                                    </span>
                                 </div>
                              </div>

                              <div className="p-6 flex-grow flex flex-col">
                                 <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-green-700 transition-colors line-clamp-2">{property.title}</h3>
                                 </div>

                                 <div className="flex items-baseline mb-4">
                                    <span className="text-2xl font-extrabold text-gray-900">
                                       ${property.price.toLocaleString()}
                                    </span>
                                    {property.type === 'rent' && <span className="text-sm text-gray-500 ml-1 font-medium">/mo</span>}
                                 </div>

                                 <div className="flex items-center text-gray-500 text-sm mb-6">
                                    <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0 text-gray-400" />
                                    <span className="truncate">{property.location}</span>
                                 </div>

                                 <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                                    <div className="flex gap-4 text-sm font-medium text-gray-600">
                                       <span className="flex items-center"><Bed className="h-4 w-4 mr-1.5 text-gray-400" /> {property.beds}</span>
                                       <span className="flex items-center"><Bath className="h-4 w-4 mr-1.5 text-gray-400" /> {property.baths}</span>
                                       <span className="flex items-center"><Square className="h-4 w-4 mr-1.5 text-gray-400" /> {property.sqft}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Property Detail Modal */}
         {selectedProperty && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedProperty(null)}></div>
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden relative z-10 flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                  <button
                     onClick={() => setSelectedProperty(null)}
                     className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 p-2 rounded-full text-white z-20 transition-colors backdrop-blur-md"
                  >
                     <X className="h-6 w-6" />
                  </button>

                  {/* Image Side (Mobile Top / Desktop Left) */}
                  <div className="w-full md:w-3/5 h-64 md:h-auto bg-gray-900 relative group">
                     <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>

                     <div className="absolute bottom-8 left-8 right-8 text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">{selectedProperty.title}</h2>
                        <p className="text-lg opacity-90 flex items-center">
                           <MapPin className="h-5 w-5 mr-2" /> {selectedProperty.location}
                        </p>
                     </div>

                     <div className="absolute top-8 left-8 flex gap-2">
                        <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center transition-colors border border-white/10">
                           <Camera className="h-4 w-4 mr-2" /> View Photos
                        </button>
                        <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center transition-colors border border-white/10">
                           <MapIcon className="h-4 w-4 mr-2" /> Map
                        </button>
                     </div>
                  </div>

                  {/* Details Side */}
                  <div className="w-full md:w-2/5 overflow-y-auto bg-white flex flex-col">
                     <div className="p-8 flex-grow">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-1">{selectedProperty.type === 'rent' ? 'Monthly Rent' : 'Listing Price'}</p>
                              <div className="flex items-baseline">
                                 <span className="text-4xl font-extrabold text-gray-900">${selectedProperty.price.toLocaleString()}</span>
                                 {selectedProperty.type === 'rent' && <span className="text-lg text-gray-500 ml-1">/mo</span>}
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="p-3 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Heart className="h-5 w-5" /></button>
                              <button className="p-3 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"><Share2 className="h-5 w-5" /></button>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                           <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                              <Bed className="h-6 w-6 mx-auto mb-2 text-green-600" />
                              <span className="block font-bold text-gray-900 text-lg">{selectedProperty.beds}</span>
                              <span className="text-xs text-gray-500 uppercase font-bold">Beds</span>
                           </div>
                           <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                              <Bath className="h-6 w-6 mx-auto mb-2 text-green-600" />
                              <span className="block font-bold text-gray-900 text-lg">{selectedProperty.baths}</span>
                              <span className="text-xs text-gray-500 uppercase font-bold">Baths</span>
                           </div>
                           <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                              <Square className="h-6 w-6 mx-auto mb-2 text-green-600" />
                              <span className="block font-bold text-gray-900 text-lg">{selectedProperty.sqft}</span>
                              <span className="text-xs text-gray-500 uppercase font-bold">Sq Ft</span>
                           </div>
                        </div>

                        <div className="mb-8">
                           <h3 className="font-bold text-gray-900 mb-3 text-lg">Description</h3>
                           <p className="text-gray-600 leading-relaxed">{selectedProperty.description}</p>
                        </div>

                        <div className="mb-8">
                           <h3 className="font-bold text-gray-900 mb-4 text-lg">Amenities</h3>
                           <div className="grid grid-cols-2 gap-3">
                              {selectedProperty.amenities.map(amenity => (
                                 <div key={amenity} className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" /> {amenity}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Agent / Lead Gen Footer */}
                     <div className="bg-gray-50 p-8 border-t border-gray-200">
                        <div className="flex items-center mb-6">
                           <div className="relative">
                              <img src={selectedProperty.agent.photo} className="w-14 h-14 rounded-full mr-4 object-cover border-2 border-white shadow-md" alt="Agent" />
                              {selectedProperty.agent.isPremium && (
                                 <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                                    <ShieldCheck className="h-3 w-3" />
                                 </div>
                              )}
                           </div>
                           <div>
                              <p className="font-bold text-gray-900 text-lg">{selectedProperty.agent.name}</p>
                              <p className="text-sm text-gray-500">Listing Agent</p>
                           </div>
                        </div>

                        <form onSubmit={handleSendLead} className="space-y-3">
                           <div className="grid grid-cols-2 gap-3">
                              <input
                                 type="text" required
                                 placeholder="Name"
                                 value={leadForm.name}
                                 onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                                 className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                              />
                              <input
                                 type="tel" required
                                 placeholder="Phone"
                                 value={leadForm.phone}
                                 onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                                 className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                              />
                           </div>
                           <textarea
                              rows={2}
                              placeholder="I'm interested in this property..."
                              value={leadForm.message}
                              onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none resize-none"
                           ></textarea>
                           <button className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                              Schedule Viewing
                           </button>
                        </form>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Pricing / Post Listing Modal */}
         {showPricingModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden relative">
                  <button
                     onClick={() => setShowPricingModal(false)}
                     className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                  >
                     <X className="h-6 w-6" />
                  </button>

                  <div className="bg-green-900 text-white p-8 text-center">
                     <h2 className="text-3xl font-bold mb-2">List Your Property</h2>
                     <p className="text-green-100">Reach thousands of tenants and buyers in Trinidad & Tobago daily.</p>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                     {/* Free Tier */}
                     <div className="border border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                        <h3 className="text-xl font-bold text-gray-900">Owner Basic</h3>
                        <div className="my-4 text-3xl font-extrabold">Free</div>
                        <p className="text-xs text-gray-500 mb-6">Perfect for single property owners.</p>
                        <ul className="space-y-3 text-sm text-gray-600 text-left mb-8">
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 1 Active Listing</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 3 Photos Max</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Standard Support</li>
                        </ul>
                        <button onClick={() => { alert('Redirecting to basic listing form...'); setShowPricingModal(false); }} className="w-full py-3 rounded-lg border-2 border-green-600 text-green-700 font-bold hover:bg-green-50">
                           Start Free
                        </button>
                     </div>

                     {/* Pro Agent - The Upsell */}
                     <div className="border-2 border-green-500 rounded-xl p-6 text-center relative transform scale-105 shadow-xl bg-white">
                        <div className="absolute top-0 inset-x-0 bg-green-500 text-white text-xs font-bold py-1 uppercase tracking-wide">Best Value</div>
                        <h3 className="text-xl font-bold text-gray-900 mt-2">Agent Pro</h3>
                        <div className="my-4 text-3xl font-extrabold">TT$499<span className="text-sm font-normal text-gray-500">/mo</span></div>
                        <p className="text-xs text-gray-500 mb-6">For serious real estate agents.</p>
                        <ul className="space-y-3 text-sm text-gray-600 text-left mb-8">
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> 10 Active Listings</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Unlimited Photos</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> <strong>Verified Badge</strong></li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Lead Dashboard</li>
                        </ul>
                        <button onClick={() => { alert('Redirecting to payment...'); setShowPricingModal(false); }} className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg">
                           Go Pro
                        </button>
                     </div>

                     {/* Agency Elite */}
                     <div className="border border-gray-200 rounded-xl p-6 text-center hover:border-gray-400 transition-colors bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-900">Agency Elite</h3>
                        <div className="my-4 text-3xl font-extrabold">TT$999<span className="text-sm font-normal text-gray-500">/mo</span></div>
                        <p className="text-xs text-gray-500 mb-6">Dominate the market.</p>
                        <ul className="space-y-3 text-sm text-gray-600 text-left mb-8">
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> <strong>Unlimited</strong> Listings</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Homepage Feature</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> CRM Integration</li>
                           <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" /> Priority Support</li>
                        </ul>
                        <button onClick={() => { alert('Contacting sales...'); setShowPricingModal(false); }} className="w-full py-3 rounded-lg bg-gray-800 text-white font-bold hover:bg-gray-900">
                           Contact Sales
                        </button>
                     </div>
                  </div>

                  <div className="bg-blue-50 p-6 border-t border-blue-100 text-center">
                     <p className="text-sm text-blue-800 font-medium">
                        <span className="font-bold">Partner Program:</span> Earn 2% commission on every property sale you refer!
                        <a href="/affiliate" className="underline ml-1 hover:text-blue-900">Join the Network</a>
                     </p>
                  </div>
               </div>
            </div>
         )}

         {/* AI Assistant Widget */}
         <ChatWidget mode="real_estate" />
      </div>
   );
};
