import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Loader2, BadgeCheck, ArrowRight, Navigation, Crosshair, Map as MapIcon, AlertCircle, ExternalLink, Star, ChevronDown } from 'lucide-react';
import { findLocalBusinesses } from '../services/geminiService';
import { useNavigate, Link } from 'react-router-dom';
import { PlaceResult } from '../types';
import { storeService } from '../services/storeService';
import { AdSpot } from '../components/AdSpot';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Google Maps API removed — app now uses OpenStreetMap/Leaflet for all maps.
// No API key required.

// Fix Leaflet default icon issue
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = [
  // Food & Dining
  { id: 'street_food', label: 'Doubles & Street Food', icon: '🌮', keywords: ['Street Food', 'Doubles'] },
  { id: 'roti_shop', label: 'Roti Shops', icon: '🥘', keywords: ['Roti Shop'] },
  { id: 'bbq', label: 'BBQ / Grill', icon: '🍖', keywords: ['BBQ'] },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️', keywords: ['Restaurant'] },
  { id: 'fast_food', label: 'Fast Food', icon: '🍔', keywords: ['Fast Food'] },
  { id: 'chinese_restaurant', label: 'Chinese', icon: '🥡', keywords: ['Chinese'] },
  { id: 'bakery', label: 'Bakery', icon: '🥐', keywords: ['Bakery'] },
  { id: 'cafe', label: 'Cafe', icon: '☕', keywords: ['Cafe'] },
  { id: 'catering', label: 'Catering', icon: '👩‍🍳', keywords: ['Catering'] },
  { id: 'bar', label: 'Bar & Lounge', icon: '🍻', keywords: ['Bar'] },
  { id: 'souse', label: 'Soup & Souse', icon: '🥣', keywords: ['Souse'] },

  // Retail
  { id: 'supermarket', label: 'Supermarket', icon: '🛒', keywords: ['Supermarket'] },
  { id: 'parlour', label: 'Parlour / Variety', icon: '🏪', keywords: ['Parlour'] },
  { id: 'clothing_store', label: 'Fashion', icon: '👗', keywords: ['Fashion'] },
  { id: 'electronics_store', label: 'Electronics', icon: '📱', keywords: ['Electronics'] },
  { id: 'hardware_store', label: 'Hardware', icon: '🔨', keywords: ['Hardware'] },
  { id: 'auto_parts_store', label: 'Auto Parts', icon: '⚙️', keywords: ['Auto Parts'] },
  { id: 'furniture_store', label: 'Furniture', icon: '🛋️', keywords: ['Furniture'] },
  { id: 'beauty_supply', label: 'Beauty Supply', icon: '💄', keywords: ['Beauty Retail'] },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊', keywords: ['Pharmacy'] },
  { id: 'puja_store', label: 'Puja Store', icon: '🕉️', keywords: ['Puja'] },
  { id: 'agro_shop', label: 'Agro Shop', icon: '🌱', keywords: ['Agro Shop'] },
  { id: 'souvenir_store', label: 'Souvenirs', icon: '🎁', keywords: ['Souvenir'] },
  { id: 'book_store', label: 'Bookstore', icon: '📚', keywords: ['Bookstore'] },

  // Trades
  { id: 'car_repair', label: 'Mechanic', icon: '🔧', keywords: ['Mechanic'] },
  { id: 'electrician', label: 'Electrician', icon: '⚡', keywords: ['Electrician'] },
  { id: 'plumber', label: 'Plumber', icon: '🚰', keywords: ['Plumbing'] },
  { id: 'hvac', label: 'AC Tech', icon: '❄️', keywords: ['AC Tech'] },
  { id: 'general_contractor', label: 'Construction', icon: '👷', keywords: ['Construction', 'Masonry'] },
  { id: 'welder', label: 'Welding', icon: '👨‍🏭', keywords: ['Welding'] },
  { id: 'carpenter', label: 'Woodworking', icon: '🪚', keywords: ['Woodworking'] },
  { id: 'landscaping', label: 'Landscaping', icon: '🌳', keywords: ['Landscaping'] },
  { id: 'cleaning_services', label: 'Cleaning', icon: '🧹', keywords: ['Cleaning'] },

  // Personal Services
  { id: 'taxi_stand', label: 'Taxi / Rides', icon: '🚕', keywords: ['Taxi'] },
  { id: 'beauty_salon', label: 'Beauty / Spa', icon: '💅', keywords: ['Beauty'] },
  { id: 'barber_shop', label: 'Barber', icon: '✂️', keywords: ['Barber'] },
  { id: 'tailor', label: 'Tailoring', icon: '🧵', keywords: ['Tailor'] },
  { id: 'gym', label: 'Fitness', icon: '💪', keywords: ['Fitness'] },
  { id: 'school', label: 'Education / Tutors', icon: '🎓', keywords: ['Tutor'] },

  // Pro Services
  { id: 'doctor', label: 'Medical', icon: '👨‍⚕️', keywords: ['Medical'] },
  { id: 'lawyer', label: 'Legal', icon: '⚖️', keywords: ['Legal'] },
  { id: 'real_estate_agency', label: 'Real Estate', icon: '🏠', keywords: ['Real Estate'] },
  { id: 'insurance_agency', label: 'Insurance', icon: '🛡️', keywords: ['Insurance'] },
  { id: 'accounting', label: 'Accounting', icon: '📊', keywords: ['Accounting'] },
  { id: 'consultant', label: 'Consulting', icon: '💼', keywords: ['Consulting', 'Tech Services'] },

  // Events
  { id: 'event_planner', label: 'Event Planning', icon: '🎉', keywords: ['Event Planning', 'Promoter'] },
  { id: 'photographer', label: 'Photography', icon: '📸', keywords: ['Photography'] },
  { id: 'night_club', label: 'Night Life / DJ', icon: '🎵', keywords: ['DJ', 'Night Life'] },

  // Ag / Other
  { id: 'farm', label: 'Farming', icon: '🚜', keywords: ['Farming', 'Livestock'] },
  { id: 'fishing_store', label: 'Fishing', icon: '🎣', keywords: ['Fishing'] },
  { id: 'manufacturer', label: 'Manufacturing', icon: '🏭', keywords: ['Manufacturing'] }
];

// Comprehensive list of places in Trinidad & Tobago
const LOCATIONS = [
  { id: 'all', label: 'All Trinidad & Tobago', center: [10.6918, -61.2225] as [number, number], zoom: 10 },
  { id: 'arima', label: 'Arima', center: [10.6333, -61.2833] as [number, number], zoom: 14 },
  { id: 'arouca', label: 'Arouca', center: [10.6333, -61.3333] as [number, number], zoom: 14 },
  { id: 'barataria', label: 'Barataria', center: [10.6500, -61.4833] as [number, number], zoom: 14 },
  { id: 'blanchisseuse', label: 'Blanchisseuse', center: [10.7833, -61.3000] as [number, number], zoom: 14 },
  { id: 'california', label: 'California', center: [10.4167, -61.4833] as [number, number], zoom: 14 },
  { id: 'caroni', label: 'Caroni', center: [10.5833, -61.3833] as [number, number], zoom: 14 },
  { id: 'cedros', label: 'Cedros', center: [10.1000, -61.7667] as [number, number], zoom: 13 },
  { id: 'chaguanas', label: 'Chaguanas', center: [10.5167, -61.4167] as [number, number], zoom: 14 },
  { id: 'chaguaramas', label: 'Chaguaramas', center: [10.6833, -61.6333] as [number, number], zoom: 14 },
  { id: 'charlotteville', label: 'Charlotteville (Tobago)', center: [11.3167, -60.5500] as [number, number], zoom: 14 },
  { id: 'claxton_bay', label: 'Claxton Bay', center: [10.3667, -61.4500] as [number, number], zoom: 14 },
  { id: 'couva', label: 'Couva', center: [10.4167, -61.4500] as [number, number], zoom: 14 },
  { id: 'crown_point', label: 'Crown Point (Tobago)', center: [11.1500, -60.8333] as [number, number], zoom: 14 },
  { id: 'curepe', label: 'Curepe', center: [10.6333, -61.4000] as [number, number], zoom: 14 },
  { id: 'debe', label: 'Debe', center: [10.2000, -61.4500] as [number, number], zoom: 14 },
  { id: 'diego_martin', label: 'Diego Martin', center: [10.7167, -61.5667] as [number, number], zoom: 14 },
  { id: 'fyzabad', label: 'Fyzabad', center: [10.1667, -61.5333] as [number, number], zoom: 14 },
  { id: 'gasparillo', label: 'Gasparillo', center: [10.3167, -61.4333] as [number, number], zoom: 14 },
  { id: 'la_brea', label: 'La Brea', center: [10.2333, -61.6167] as [number, number], zoom: 14 },
  { id: 'la_horquetta', label: 'La Horquetta', center: [10.6167, -61.2833] as [number, number], zoom: 14 },
  { id: 'laventille', label: 'Laventille', center: [10.6500, -61.5000] as [number, number], zoom: 14 },
  { id: 'marabella', label: 'Marabella', center: [10.3000, -61.4500] as [number, number], zoom: 14 },
  { id: 'maracas', label: 'Maracas', center: [10.7500, -61.4333] as [number, number], zoom: 14 },
  { id: 'mayaro', label: 'Mayaro', center: [10.3000, -61.0167] as [number, number], zoom: 13 },
  { id: 'morvant', label: 'Morvant', center: [10.6500, -61.4667] as [number, number], zoom: 14 },
  { id: 'mucurapo', label: 'Mucurapo', center: [10.6667, -61.5333] as [number, number], zoom: 14 },
  { id: 'palo_seco', label: 'Palo Seco', center: [10.0833, -61.5833] as [number, number], zoom: 14 },
  { id: 'penal', label: 'Penal', center: [10.1667, -61.4667] as [number, number], zoom: 14 },
  { id: 'petit_valley', label: 'Petit Valley', center: [10.6833, -61.5500] as [number, number], zoom: 14 },
  { id: 'piarco', label: 'Piarco', center: [10.5833, -61.3333] as [number, number], zoom: 14 },
  { id: 'plymouth', label: 'Plymouth (Tobago)', center: [11.2167, -60.7833] as [number, number], zoom: 14 },
  { id: 'point_fortin', label: 'Point Fortin', center: [10.1833, -61.6667] as [number, number], zoom: 14 },
  { id: 'port_of_spain', label: 'Port of Spain', center: [10.6573, -61.5180] as [number, number], zoom: 14 },
  { id: 'princes_town', label: 'Princes Town', center: [10.2667, -61.3833] as [number, number], zoom: 14 },
  { id: 'rio_claro', label: 'Rio Claro', center: [10.3000, -61.1667] as [number, number], zoom: 14 },
  { id: 'roxborough', label: 'Roxborough (Tobago)', center: [11.2500, -60.5833] as [number, number], zoom: 14 },
  { id: 'san_fernando', label: 'San Fernando', center: [10.2833, -61.4667] as [number, number], zoom: 14 },
  { id: 'san_juan', label: 'San Juan', center: [10.6500, -61.4500] as [number, number], zoom: 14 },
  { id: 'sangre_grande', label: 'Sangre Grande', center: [10.5833, -61.1333] as [number, number], zoom: 14 },
  { id: 'santa_cruz', label: 'Santa Cruz', center: [10.7167, -61.4667] as [number, number], zoom: 14 },
  { id: 'scarborough', label: 'Scarborough (Tobago)', center: [11.1833, -60.7333] as [number, number], zoom: 14 },
  { id: 'siparia', label: 'Siparia', center: [10.1333, -61.5000] as [number, number], zoom: 14 },
  { id: 'st_augustine', label: 'St. Augustine', center: [10.6333, -61.4000] as [number, number], zoom: 14 },
  { id: 'st_james', label: 'St. James', center: [10.6667, -61.5333] as [number, number], zoom: 14 },
  { id: 'st_joseph', label: 'St. Joseph', center: [10.6333, -61.4333] as [number, number], zoom: 14 },
  { id: 'toco', label: 'Toco', center: [10.8333, -60.9500] as [number, number], zoom: 13 },
  { id: 'trincity', label: 'Trincity', center: [10.6333, -61.3500] as [number, number], zoom: 14 },
  { id: 'tunapuna', label: 'Tunapuna', center: [10.6500, -61.3833] as [number, number], zoom: 14 },
  { id: 'valencia', label: 'Valencia', center: [10.6500, -61.2167] as [number, number], zoom: 14 },
  { id: 'valsayn', label: 'Valsayn', center: [10.6333, -61.4167] as [number, number], zoom: 14 },
  { id: 'westmoorings', label: 'Westmoorings', center: [10.6833, -61.5667] as [number, number], zoom: 14 },
];

// Helper to extract lat/lng from a PlaceResult's geometry.location (which may be a
// Google LatLng-like object or null)
const extractLatLng = (place: PlaceResult): [number, number] | null => {
  if (!place.geometry?.location) return null;
  const loc = place.geometry.location;
  // Google LatLng objects have lat()/lng() methods; plain objects have .lat/.lng
  if (typeof loc.lat === 'function') return [loc.lat(), loc.lng()];
  if (typeof loc.lat === 'number') return [loc.lat, loc.lng];
  return null;
};

// Component to update map center when location changes
const MapCenterUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const Directory: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [localStores, setLocalStores] = useState<any[]>([]);
  const [aiResponseText, setAiResponseText] = useState('');
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState('all');

  const mapInstanceRef = useRef<any>(null);

  // Load local stores from API
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await storeService.getAllStores();
        setLocalStores(data);
      } catch (err) {
        console.error("Failed to load stores from API:", err);
        // Fallback to local storage if API fails
        const stored = JSON.parse(localStorage.getItem('trinibuild_stores') || '[]');
        setLocalStores(stored);
      }
    };

    fetchStores();
  }, []);

  const fetchAiInsights = async (query: string, lat?: number, lng?: number) => {
    try {
      const { text } = await findLocalBusinesses(query, lat, lng);
      setAiResponseText(text);
    } catch (error) {
      console.error("Gemini error", error);
    }
  };

  const searchWithGemini = async (query: string, category?: string) => {
    const searchTerm = query || category || 'businesses in Trinidad';

    try {
      const { text, chunks } = await findLocalBusinesses(searchTerm);
      setAiResponseText(text);

      const fallbackPlaces: PlaceResult[] = chunks
        .filter(chunk => chunk.maps)
        .map(chunk => ({
          name: chunk.maps.title,
          place_id: chunk.maps.placeId || `gemini-${Date.now()}-${Math.random()}`,
          formatted_address: "Address available via map link",
          url: chunk.maps.uri,
          rating: 0,
          user_ratings_total: 0,
          geometry: { location: null }
        }));

      setPlaces(fallbackPlaces);
    } catch (e) {
      console.error("Gemini search failed", e);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (query: string, type?: string) => {
    setLoading(true);
    setPlaces([]);
    setAiResponseText('');
    setShowSearchAreaBtn(false);

    // Filter local stores based on query OR category
    const matchingLocalStores = localStores.filter(store => {
      // 1. Filter by Category Type
      if (type) {
        const category = CATEGORIES.find(c => c.id === type);
        if (category && category.keywords) {
          const storeCat = (store.category || '').toLowerCase();
          // Check if store category includes any of the keywords
          const matches = category.keywords.some(k => storeCat.includes(k.toLowerCase()));
          if (!matches) return false;
        }
      }

      // 2. Filter by Query
      if (!query) return true;
      return store.businessName.toLowerCase().includes(query.toLowerCase()) ||
        store.description?.toLowerCase().includes(query.toLowerCase());
    }).map(store => ({
      place_id: store.id,
      name: store.businessName,
      formatted_address: store.address || "Trinidad & Tobago",
      geometry: {
        location: {
          lat: store.lat || 10.65,
          lng: store.lng || -61.50
        } as any,
        viewport: null
      },
      rating: 5.0,
      user_ratings_total: 1,
      photos: [],
      types: ['store']
    } as PlaceResult));

    setPlaces(matchingLocalStores);

    if (matchingLocalStores.length > 0) {
      if (query) fetchAiInsights(query);
    } else {
      // No local stores found — fall back to Gemini AI search
      searchWithGemini(query, type);
      return;
    }

    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveCategory(null);
    performSearch(searchQuery);
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');
    performSearch('', catId);
  };

  const handleLocationChange = (locId: string) => {
    setActiveLocation(locId);
    const location = LOCATIONS.find(l => l.id === locId);
    if (location && mapInstanceRef.current) {
      mapInstanceRef.current.setView(location.center, location.zoom);
      // Trigger a fresh search for the area if there's no specific query
      if (!searchQuery && activeCategory) {
        performSearch('', activeCategory);
      } else if (searchQuery) {
        performSearch(searchQuery);
      } else {
        // Just explore the location
        performSearch('local businesses');
      }
    }
  };

  const searchCurrentArea = () => {
    const query = searchQuery || (activeCategory ? '' : 'business');
    performSearch(query, activeCategory || undefined);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(pos, 14);
          }
          performSearch('nearby businesses');
        },
        () => {
          alert("Error: The Geolocation service failed.");
        }
      );
    } else {
      alert("Error: Your browser doesn't support geolocation.");
    }
  };

  const handleClaim = (place: PlaceResult) => {
    const params = new URLSearchParams();
    params.append('claim_name', place.name);
    params.append('claim_source', 'directory_map');
    if (place.formatted_address) params.append('claim_address', place.formatted_address);
    if (place.place_id && !place.place_id.startsWith('gemini-')) params.append('claim_place_id', place.place_id);

    navigate(`/create-store?${params.toString()}`);
  };

  const handleListClick = (place: PlaceResult) => {
    if (place.place_id && place.place_id.startsWith('store-')) {
      navigate(`/store/${place.place_id}`);
      return;
    }

    if (place.url) {
      window.open(place.url, '_blank');
      return;
    }
  };

  // Current map center based on active location
  const currentLocation = LOCATIONS.find(l => l.id === activeLocation) || LOCATIONS[0];

  return (
    <>
      <Helmet>
        <title>Business Directory Trinidad & Tobago | Find Local Shops & Services | TriniBuild</title>
        <meta name="description" content="Find local businesses, restaurants, shops, and services across Trinidad & Tobago. Search by category, location, or use our AI-powered directory to discover hidden gems." />
        <meta name="keywords" content="Trinidad business directory, Tobago local shops, find businesses T&T, restaurants Trinidad, services Port of Spain" />
        <link rel="canonical" href="https://trinibuild.com/#/directory" />
        <meta property="og:title" content="Business Directory Trinidad & Tobago | TriniBuild" />
        <meta property="og:description" content="Discover local businesses across Trinidad & Tobago. AI-powered search for shops, restaurants, and services." />
      </Helmet>
      <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
        <div className="bg-white shadow-md border-b border-gray-200 z-30 flex-shrink-0 relative">
          <div className="max-w-7xl mx-auto w-full px-4 py-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Trinidad for shops, restaurants, services..."
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:border-trini-red focus:ring-1 focus:ring-trini-red transition-all shadow-sm text-base"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Clear</span>
                    ✕
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {/* Location Selector */}
                <div className="relative min-w-[160px] md:min-w-[200px]">
                  <select
                    value={activeLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-trini-red focus:border-trini-red block px-3 py-3 font-medium appearance-none"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-trini-red text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 shadow-md transition-transform active:scale-95 flex items-center justify-center min-w-[100px]"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
                </button>
              </div>
            </form>

            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeCategory === cat.id
                    ? 'bg-trini-black text-white border-trini-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                >
                  <span className="mr-2">{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse lg:flex-row flex-grow overflow-hidden relative">
          <div className="w-full lg:w-[450px] xl:w-[500px] bg-white flex flex-col border-r border-gray-200 z-20 shadow-xl h-[45vh] lg:h-auto relative">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>{places.length} Results Found</span>
              <span>{activeLocation !== 'all' ? LOCATIONS.find(z => z.id === activeLocation)?.label : 'Trinidad & Tobago'}</span>
            </div>

            <div className="flex-grow overflow-y-auto p-4 custom-scrollbar bg-gray-50">
              <AdSpot page="marketplace" slot="top" className="mb-4" />
              {!loading && aiResponseText && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-2 text-blue-800">
                    <BadgeCheck className="h-5 w-5 mr-2 text-blue-600" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">AI Local Insights</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {aiResponseText.split('\n')[0]}
                  </p>
                </div>
              )}

              <div className="space-y-3 pb-8">
                {places.length > 0 ? (
                  places.map((place, idx) => (
                    <div
                      key={place.place_id || idx}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:border-trini-red hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
                      onClick={() => handleListClick(place)}
                    >
                      <div className="flex h-32">
                        <div className="w-32 h-full bg-gray-100 flex-shrink-0 relative">
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100">
                            <MapIcon className="h-8 w-8 mb-1 opacity-50" />
                            <span className="text-[10px]">No Photo</span>
                          </div>
                        </div>

                        <div className="flex-grow p-3 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{place.name}</h3>
                              <span className="bg-gray-800 text-white text-[10px] px-1.5 rounded font-mono">{idx + 1}</span>
                            </div>

                            <div className="flex items-center mt-1 mb-1">
                              {place.rating ? (
                                <>
                                  <div className="flex items-center text-yellow-500">
                                    <span className="font-bold text-sm mr-1 text-gray-900">{place.rating}</span>
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-3 w-3 ${i < Math.round(place.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />
                                      ))}
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400 ml-2">({place.user_ratings_total})</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400 italic">AI Verified</span>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                              {place.formatted_address || "Trinidad & Tobago"}
                            </p>
                          </div>

                          <div className="flex justify-end gap-2">
                            {place.url && (
                              <a
                                href={place.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs font-bold text-gray-500 hover:bg-gray-100 px-2 py-1.5 rounded transition-colors flex items-center"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (place.place_id && place.place_id.startsWith('store-')) {
                                  navigate(`/store/${place.place_id}`);
                                } else {
                                  handleClaim(place);
                                }
                              }}
                              className={`text-xs font-bold px-3 py-1.5 rounded transition-colors flex items-center border ${place.place_id && place.place_id.startsWith('store-')
                                ? 'text-white bg-trini-red border-trini-red hover:bg-red-700'
                                : 'text-trini-red hover:bg-red-50 border-trini-red/20'
                                }`}
                            >
                              {place.place_id && place.place_id.startsWith('store-') ? (
                                <>View Store <ArrowRight className="h-3 w-3 ml-1" /></>
                              ) : (
                                <>Claim This Business <ArrowRight className="h-3 w-3 ml-1" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  !loading && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <MapIcon className="h-10 w-10 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Explore Trinidad & Tobago</h3>
                      <p className="text-gray-500 text-sm mt-2 max-w-xs">
                        Use the map or search bar to find local businesses, services, and hidden gems.
                      </p>
                    </div>
                  )
                )}

                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-trini-red animate-spin mb-2" />
                    <p className="text-sm text-gray-500">
                      Searching T&T's database...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-grow h-[45vh] lg:h-auto bg-gray-200 relative group">
            <MapContainer
              center={currentLocation.center}
              zoom={currentLocation.zoom}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(map) => { mapInstanceRef.current = map; }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterUpdater center={currentLocation.center} zoom={currentLocation.zoom} />

              {places.map((place, idx) => {
                const ll = extractLatLng(place);
                if (!ll) return null;
                return (
                  <Marker key={place.place_id || idx} position={ll}>
                    <Popup>
                      <div style={{ padding: '8px', maxWidth: '200px' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '14px' }}>{place.name}</h3>
                        <p style={{ fontSize: '12px', color: '#555', marginBottom: '4px' }}>{place.formatted_address || ''}</p>
                        {place.rating ? (
                          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>★ {place.rating} ({place.user_ratings_total})</div>
                        ) : null}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            {showSearchAreaBtn && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                <button
                  onClick={searchCurrentArea}
                  className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg font-semibold text-sm flex items-center hover:bg-gray-50 transition-transform transform hover:scale-105"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crosshair className="h-4 w-4 mr-2 text-trini-red" />}
                  Search this area
                </button>
              </div>
            )}

            <button
              onClick={handleLocateMe}
              className="absolute bottom-8 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none z-[1000] text-gray-600"
              title="Locate Me"
            >
              <Navigation className="h-6 w-6 transform hover:text-trini-red transition-colors" />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
