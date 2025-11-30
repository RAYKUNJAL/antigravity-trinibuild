import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Home, MapPin, Search, Filter, Bed, Bath, Square, Heart, List, Map as MapIcon, X, ChevronDown, Check, Share2, Phone, Mail } from 'lucide-react';
import { RealEstateListing, realEstateService } from '../services/realEstateService';
import { ChatWidget } from '../components/ChatWidget';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
   iconUrl: icon,
   shadowUrl: iconShadow,
   iconSize: [25, 41],
   iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to update map center when listings change
const MapUpdater = ({ center }: { center: [number, number] }) => {
   const map = useMap();
   useEffect(() => {
      map.setView(center, map.getZoom());
   }, [center, map]);
   return null;
};

export const RealEstate: React.FC = () => {
   const [viewMode, setViewMode] = useState<'map' | 'list'>('map'); // Mobile toggle
   const [listings, setListings] = useState<RealEstateListing[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedListing, setSelectedListing] = useState<RealEstateListing | null>(null);
   const [filters, setFilters] = useState({
      type: 'buy' as 'buy' | 'rent',
      priceRange: 5000000,
      beds: 0,
      search: ''
   });

   // Mock initial center (Trinidad)
   const defaultCenter: [number, number] = [10.6918, -61.2225];

   useEffect(() => {
      loadListings();
   }, [filters.type, filters.beds]); // Reload when major filters change

   const loadListings = async () => {
      setLoading(true);
      try {
         // In a real app, we'd pass all filters here
         const data = await realEstateService.getListings({
            type: filters.type,
            beds: filters.beds > 0 ? filters.beds : undefined
         });
         setListings(data);
      } catch (error) {
         console.error("Error loading listings", error);
      } finally {
         setLoading(false);
      }
   };

   const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-TT', {
         style: 'currency',
         currency: 'TTD',
         maximumFractionDigits: 0
      }).format(price);
   };

   return (
      <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
         {/* Top Filter Bar */}
         <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm z-20 overflow-x-auto">
            <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-shrink-0">
               <button
                  onClick={() => setFilters({ ...filters, type: 'buy' })}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filters.type === 'buy' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
               >
                  Buy
               </button>
               <button
                  onClick={() => setFilters({ ...filters, type: 'rent' })}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filters.type === 'rent' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
               >
                  Rent
               </button>
            </div>

            <div className="relative flex-grow max-w-md min-w-[200px]">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
               <input
                  type="text"
                  placeholder="City, Neighborhood, ZIP..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm outline-none transition-all"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
               />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
               <select
                  aria-label="Max Price"
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  onChange={(e) => setFilters({ ...filters, priceRange: Number(e.target.value) })}
               >
                  <option value="1000000">Max $1M</option>
                  <option value="2000000">Max $2M</option>
                  <option value="5000000">Max $5M</option>
                  <option value="10000000">Any Price</option>
               </select>

               <select
                  aria-label="Bedrooms"
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                  onChange={(e) => setFilters({ ...filters, beds: Number(e.target.value) })}
               >
                  <option value="0">Any Beds</option>
                  <option value="1">1+ Beds</option>
                  <option value="2">2+ Beds</option>
                  <option value="3">3+ Beds</option>
                  <option value="4">4+ Beds</option>
               </select>
            </div>

            <div className="ml-auto md:hidden flex bg-gray-100 rounded-lg p-1">
               <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`} aria-label="Switch to list view"><List className="h-4 w-4" /></button>
               <button onClick={() => setViewMode('map')} className={`p-2 rounded ${viewMode === 'map' ? 'bg-white shadow' : ''}`} aria-label="Switch to map view"><MapIcon className="h-4 w-4" /></button>
            </div>
         </div>

         {/* Main Split View Content */}
         <div className="flex flex-grow overflow-hidden relative">

            {/* Left Side: Map (Desktop: 60%, Mobile: 100% if viewMode=map) */}
            <div className={`w-full md:w-[60%] lg:w-[65%] h-full relative transition-transform duration-300 ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
               <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapUpdater center={defaultCenter} />

                  {listings.map(listing => (
                     listing.latitude && listing.longitude && (
                        <Marker
                           key={listing.id}
                           position={[listing.latitude, listing.longitude]}
                           eventHandlers={{
                              click: () => setSelectedListing(listing),
                           }}
                        >
                           <Popup>
                              <div className="w-48">
                                 <img src={listing.images?.[0]?.url || 'https://via.placeholder.com/300'} alt={listing.title || 'Property thumbnail'} className="w-full h-24 object-cover rounded-t-lg mb-2" />
                                 <div className="font-bold text-gray-900">{formatPrice(listing.price)}</div>
                                 <div className="text-xs text-gray-600">{listing.beds} bds | {listing.bathrooms} ba | {listing.sqft} sqft</div>
                                 <div className="text-xs truncate">{listing.address}</div>
                              </div>
                           </Popup>
                        </Marker>
                     )
                  ))}
               </MapContainer>

               {/* Floating Map Controls */}
               <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-[400] text-sm font-bold text-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                  <MapIcon className="h-4 w-4" /> Draw Search Area
               </div>
            </div>

            {/* Right Side: List (Desktop: 40%, Mobile: 100% if viewMode=list) */}
            <div className={`w-full md:w-[40%] lg:w-[35%] h-full bg-white border-l border-gray-200 overflow-y-auto ${viewMode === 'map' ? 'hidden md:block' : 'block'}`}>
               <div className="p-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                     {filters.type === 'buy' ? 'Homes For Sale' : 'Rental Properties'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">{listings.length} results in Trinidad & Tobago</p>

                  {loading ? (
                     <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                           <div key={i} className="animate-pulse flex gap-4">
                              <div className="bg-gray-200 w-32 h-24 rounded-lg"></div>
                              <div className="flex-1 py-1">
                                 <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                 <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 gap-6">
                        {listings.map(listing => (
                           <div
                              key={listing.id}
                              className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                              onClick={() => setSelectedListing(listing)}
                              onMouseEnter={() => { /* Highlight pin logic */ }}
                           >
                              <div className="relative h-48 overflow-hidden">
                                 <img
                                    src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
                                    alt={listing.title || 'Property image'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                 />
                                 <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                    {listing.status === 'active' ? (listing.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT') : listing.status}
                                 </div>
                                 <button className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors" aria-label="Add to favorites">
                                    <Heart className="h-5 w-5" />
                                 </button>
                              </div>
                              <div className="p-4">
                                 <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-2xl font-bold text-gray-900">{formatPrice(listing.price)}</h3>
                                 </div>
                                 <div className="flex gap-3 text-sm text-gray-600 mb-2 font-medium">
                                    <span className="flex items-center"><Bed className="h-4 w-4 mr-1" /> {listing.bedrooms}</span>
                                    <span className="flex items-center"><Bath className="h-4 w-4 mr-1" /> {listing.bathrooms}</span>
                                    <span className="flex items-center"><Square className="h-4 w-4 mr-1" /> {listing.sqft} sqft</span>
                                 </div>
                                 <p className="text-sm text-gray-500 truncate">{listing.address}, {listing.city}</p>
                              </div>
                           </div>
                        ))}

                        {listings.length === 0 && (
                           <div className="text-center py-10">
                              <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-900">No homes found</h3>
                              <p className="text-gray-500">Try adjusting your filters or map area.</p>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Detail Modal (Zillow Style Overlay) */}
         {selectedListing && (
            <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedListing(null)}></div>
               <div className="relative w-full md:w-[600px] lg:w-[800px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
                  <button
                     onClick={() => setSelectedListing(null)}
                     className="absolute top-4 left-4 z-10 bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                     aria-label="Close listing details"
                  >
                     <X className="h-6 w-6 text-gray-700" />
                  </button>

                  {/* Hero Image */}
                  <div className="h-[400px] relative">
                     <img
                        src={selectedListing.images?.[0]?.url || 'https://via.placeholder.com/800x600'}
                        alt={selectedListing.title || 'Property hero image'}
                        className="w-full h-full object-cover"
                     />
                     <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                        <h1 className="text-4xl font-bold mb-2">{formatPrice(selectedListing.price)}</h1>
                        <p className="text-lg opacity-90">{selectedListing.address}, {selectedListing.city}</p>
                     </div>
                  </div>

                  <div className="p-6 md:p-8">
                     {/* Key Stats */}
                     <div className="flex justify-between border-b border-gray-100 pb-6 mb-6">
                        <div className="text-center px-4">
                           <div className="text-2xl font-bold text-gray-900">{selectedListing.bedrooms}</div>
                           <div className="text-xs text-gray-500 uppercase font-bold">Beds</div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-100">
                           <div className="text-2xl font-bold text-gray-900">{selectedListing.bathrooms}</div>
                           <div className="text-xs text-gray-500 uppercase font-bold">Baths</div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-100">
                           <div className="text-2xl font-bold text-gray-900">{selectedListing.sqft}</div>
                           <div className="text-xs text-gray-500 uppercase font-bold">Sq Ft</div>
                        </div>
                        <div className="text-center px-4 border-l border-gray-100">
                           <div className="text-2xl font-bold text-gray-900">{selectedListing.status}</div>
                           <div className="text-xs text-gray-500 uppercase font-bold">Status</div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                           <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3">About this home</h3>
                              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                 {selectedListing.description}
                              </p>
                           </div>

                           <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-3">Features</h3>
                              <div className="flex flex-wrap gap-2">
                                 {selectedListing.features?.map((f, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                       {f.feature_name}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Contact Agent Card */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg h-fit sticky top-6">
                           <div className="flex items-center mb-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full mr-3 overflow-hidden">
                                 {/* Placeholder for agent image */}
                                 <img src="https://via.placeholder.com/100" alt="Agent" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                 <div className="font-bold text-gray-900">Listing Agent</div>
                                 <div className="text-xs text-gray-500">TriniBuild Premier</div>
                              </div>
                           </div>
                           <form className="space-y-3">
                              <input type="text" placeholder="Name" className="w-full p-2 border border-gray-300 rounded-lg text-sm" aria-label="Your Name" />
                              <input type="tel" placeholder="Phone" className="w-full p-2 border border-gray-300 rounded-lg text-sm" aria-label="Your Phone Number" />
                              <input type="email" placeholder="Email" className="w-full p-2 border border-gray-300 rounded-lg text-sm" aria-label="Your Email" />
                              <textarea placeholder="I am interested in this property..." rows={3} className="w-full p-2 border border-gray-300 rounded-lg text-sm" aria-label="Message to agent"></textarea>
                              <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                                 Contact Agent
                              </button>
                           </form>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <ChatWidget mode="real_estate" />
      </div>
   );
};
