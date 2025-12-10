import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, BadgeCheck, ArrowRight, Navigation, Crosshair, Map as MapIcon, AlertCircle, ExternalLink, Star, ChevronDown } from 'lucide-react';
import { findLocalBusinesses } from '../services/geminiService';
import { useNavigate, Link } from 'react-router-dom';
import { PlaceResult } from '../types';
import { storeService } from '../services/storeService';
import { AdSpot } from '../components/AdSpot';

declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
  }
}

const GOOGLE_MAPS_KEY = 'AIzaSyAbjOn5lpjfYw6Ig3M-KWU1y0JP5z0LbPM';

const CATEGORIES = [
  // Food & Drink
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'street_food', label: 'Doubles & Street Food', icon: '🌮' },
  { id: 'roti_shop', label: 'Roti Shops', icon: '🥘' },
  { id: 'bakery', label: 'Bakeries', icon: '🥐' },
  { id: 'bar', label: 'Bars & Liming', icon: '🍻' },
  { id: 'cafe', label: 'Cafes', icon: '☕' },

  // Shopping
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒' },
  { id: 'clothing_store', label: 'Fashion', icon: '👗' },
  { id: 'electronics_store', label: 'Electronics', icon: '📱' },
  { id: 'hardware_store', label: 'Hardware', icon: '🔨' },
  { id: 'furniture_store', label: 'Furniture', icon: '🛋️' },
  { id: 'store', label: 'General Stores', icon: '🛍️' },

  // Services
  { id: 'car_repair', label: 'Mechanic & Auto', icon: '🔧' },
  { id: 'taxi_stand', label: 'Taxi & Transport', icon: '🚕' },
  { id: 'beauty_salon', label: 'Beauty & Spas', icon: '💅' },
  { id: 'plumber', label: 'Plumbing', icon: '🚿' },
  { id: 'electrician', label: 'Electrical', icon: '⚡' },
  { id: 'laundry', label: 'Cleaning & Laundry', icon: '🧺' },

  // Professional
  { id: 'doctor', label: 'Doctors & Medical', icon: '👨‍⚕️' },
  { id: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { id: 'lawyer', label: 'Legal', icon: '⚖️' },
  { id: 'real_estate_agency', label: 'Real Estate', icon: '🏠' },
  { id: 'bank', label: 'Banks', icon: '🏦' },
  { id: 'gym', label: 'Gyms', icon: '💪' },

  // Tourism & Misc
  { id: 'lodging', label: 'Hotels & Guest Houses', icon: '🏨' },
  { id: 'travel_agency', label: 'Travel Agents', icon: '✈️' },
  { id: 'farm', label: 'Agriculture', icon: '🚜' },
  { id: 'carnival', label: 'Carnival & Mas', icon: '🎭' },
  { id: 'night_club', label: 'Night Life', icon: '🎵' },
  { id: 'police', label: 'Police', icon: '👮' },
];

// Comprehensive list of places in Trinidad & Tobago
const LOCATIONS = [
  { id: 'all', label: 'All Trinidad & Tobago', center: { lat: 10.6918, lng: -61.2225 }, zoom: 10 },
  { id: 'arima', label: 'Arima', center: { lat: 10.6333, lng: -61.2833 }, zoom: 14 },
  { id: 'arouca', label: 'Arouca', center: { lat: 10.6333, lng: -61.3333 }, zoom: 14 },
  { id: 'barataria', label: 'Barataria', center: { lat: 10.6500, lng: -61.4833 }, zoom: 14 },
  { id: 'blanchisseuse', label: 'Blanchisseuse', center: { lat: 10.7833, lng: -61.3000 }, zoom: 14 },
  { id: 'california', label: 'California', center: { lat: 10.4167, lng: -61.4833 }, zoom: 14 },
  { id: 'caroni', label: 'Caroni', center: { lat: 10.5833, lng: -61.3833 }, zoom: 14 },
  { id: 'cedros', label: 'Cedros', center: { lat: 10.1000, lng: -61.7667 }, zoom: 13 },
  { id: 'chaguanas', label: 'Chaguanas', center: { lat: 10.5167, lng: -61.4167 }, zoom: 14 },
  { id: 'chaguaramas', label: 'Chaguaramas', center: { lat: 10.6833, lng: -61.6333 }, zoom: 14 },
  { id: 'charlotteville', label: 'Charlotteville (Tobago)', center: { lat: 11.3167, lng: -60.5500 }, zoom: 14 },
  { id: 'claxton_bay', label: 'Claxton Bay', center: { lat: 10.3667, lng: -61.4500 }, zoom: 14 },
  { id: 'couva', label: 'Couva', center: { lat: 10.4167, lng: -61.4500 }, zoom: 14 },
  { id: 'crown_point', label: 'Crown Point (Tobago)', center: { lat: 11.1500, lng: -60.8333 }, zoom: 14 },
  { id: 'curepe', label: 'Curepe', center: { lat: 10.6333, lng: -61.4000 }, zoom: 14 },
  { id: 'debe', label: 'Debe', center: { lat: 10.2000, lng: -61.4500 }, zoom: 14 },
  { id: 'diego_martin', label: 'Diego Martin', center: { lat: 10.7167, lng: -61.5667 }, zoom: 14 },
  { id: 'fyzabad', label: 'Fyzabad', center: { lat: 10.1667, lng: -61.5333 }, zoom: 14 },
  { id: 'gasparillo', label: 'Gasparillo', center: { lat: 10.3167, lng: -61.4333 }, zoom: 14 },
  { id: 'la_brea', label: 'La Brea', center: { lat: 10.2333, lng: -61.6167 }, zoom: 14 },
  { id: 'la_horquetta', label: 'La Horquetta', center: { lat: 10.6167, lng: -61.2833 }, zoom: 14 },
  { id: 'laventille', label: 'Laventille', center: { lat: 10.6500, lng: -61.5000 }, zoom: 14 },
  { id: 'marabella', label: 'Marabella', center: { lat: 10.3000, lng: -61.4500 }, zoom: 14 },
  { id: 'maracas', label: 'Maracas', center: { lat: 10.7500, lng: -61.4333 }, zoom: 14 },
  { id: 'mayaro', label: 'Mayaro', center: { lat: 10.3000, lng: -61.0167 }, zoom: 13 },
  { id: 'morvant', label: 'Morvant', center: { lat: 10.6500, lng: -61.4667 }, zoom: 14 },
  { id: 'mucurapo', label: 'Mucurapo', center: { lat: 10.6667, lng: -61.5333 }, zoom: 14 },
  { id: 'palo_seco', label: 'Palo Seco', center: { lat: 10.0833, lng: -61.5833 }, zoom: 14 },
  { id: 'penal', label: 'Penal', center: { lat: 10.1667, lng: -61.4667 }, zoom: 14 },
  { id: 'petit_valley', label: 'Petit Valley', center: { lat: 10.6833, lng: -61.5500 }, zoom: 14 },
  { id: 'piarco', label: 'Piarco', center: { lat: 10.5833, lng: -61.3333 }, zoom: 14 },
  { id: 'plymouth', label: 'Plymouth (Tobago)', center: { lat: 11.2167, lng: -60.7833 }, zoom: 14 },
  { id: 'point_fortin', label: 'Point Fortin', center: { lat: 10.1833, lng: -61.6667 }, zoom: 14 },
  { id: 'port_of_spain', label: 'Port of Spain', center: { lat: 10.6573, lng: -61.5180 }, zoom: 14 },
  { id: 'princes_town', label: 'Princes Town', center: { lat: 10.2667, lng: -61.3833 }, zoom: 14 },
  { id: 'rio_claro', label: 'Rio Claro', center: { lat: 10.3000, lng: -61.1667 }, zoom: 14 },
  { id: 'roxborough', label: 'Roxborough (Tobago)', center: { lat: 11.2500, lng: -60.5833 }, zoom: 14 },
  { id: 'san_fernando', label: 'San Fernando', center: { lat: 10.2833, lng: -61.4667 }, zoom: 14 },
  { id: 'san_juan', label: 'San Juan', center: { lat: 10.6500, lng: -61.4500 }, zoom: 14 },
  { id: 'sangre_grande', label: 'Sangre Grande', center: { lat: 10.5833, lng: -61.1333 }, zoom: 14 },
  { id: 'santa_cruz', label: 'Santa Cruz', center: { lat: 10.7167, lng: -61.4667 }, zoom: 14 },
  { id: 'scarborough', label: 'Scarborough (Tobago)', center: { lat: 11.1833, lng: -60.7333 }, zoom: 14 },
  { id: 'siparia', label: 'Siparia', center: { lat: 10.1333, lng: -61.5000 }, zoom: 14 },
  { id: 'st_augustine', label: 'St. Augustine', center: { lat: 10.6333, lng: -61.4000 }, zoom: 14 },
  { id: 'st_james', label: 'St. James', center: { lat: 10.6667, lng: -61.5333 }, zoom: 14 },
  { id: 'st_joseph', label: 'St. Joseph', center: { lat: 10.6333, lng: -61.4333 }, zoom: 14 },
  { id: 'toco', label: 'Toco', center: { lat: 10.8333, lng: -60.9500 }, zoom: 13 },
  { id: 'trincity', label: 'Trincity', center: { lat: 10.6333, lng: -61.3500 }, zoom: 14 },
  { id: 'tunapuna', label: 'Tunapuna', center: { lat: 10.6500, lng: -61.3833 }, zoom: 14 },
  { id: 'valencia', label: 'Valencia', center: { lat: 10.6500, lng: -61.2167 }, zoom: 14 },
  { id: 'valsayn', label: 'Valsayn', center: { lat: 10.6333, lng: -61.4167 }, zoom: 14 },
  { id: 'westmoorings', label: 'Westmoorings', center: { lat: 10.6833, lng: -61.5667 }, zoom: 14 },
];

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
  const [mapError, setMapError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const serviceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Load Google Maps Script
  useEffect(() => {
    // Global auth failure handler for Maps JS API
    window.gm_authFailure = () => {
      console.error("Google Maps Authentication Failure");
      setMapError("Invalid Key or Service Not Enabled. Please enable 'Maps JavaScript API' in Google Cloud Console.");
      setLoading(false);
      // Force fallback search if we were loading
      if (loading) {
        searchWithGemini(searchQuery || 'businesses in Trinidad');
      }
    };

    const loadMap = async () => {
      // Check for key in localStorage first, then env, then the hardcoded fallback
      const apiKey = localStorage.getItem('google_maps_api_key') || GOOGLE_MAPS_KEY || process.env.API_KEY;

      if (!apiKey) {
        setMapError("No API Key found. Please go to Settings.");
        return;
      }

      if (!window.google || !window.google.maps) {
        // Check if script is already present to prevent duplicate injection
        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
          // Script loaded but maybe failed previously or is loading
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initMap();
        };
        script.onerror = () => {
          setMapError("Failed to load Google Maps script (Network Error).");
        };
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    loadMap();

    // Load local stores from API
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

    return () => {
      // cleanup
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || mapError) return;

    try {
      // Check if map is already initialized on this ref
      if (mapInstanceRef.current) return;

      const trinidad = { lat: 10.654, lng: -61.502 };

      // Adjust Zoom based on screen width
      const initialZoom = window.innerWidth < 768 ? 9 : 11;
      const initialCenter = window.innerWidth < 768 ? { lat: 10.45, lng: -61.3 } : trinidad;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      serviceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);

      if (searchInputRef.current) {
        // Only init autocomplete if div exists and API loaded
        try {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: 'tt' },
            fields: ['geometry', 'name', 'formatted_address', 'place_id'],
          });

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (!place.geometry || !place.geometry.location) {
              setSearchQuery(place.name);
              performSearch(place.name);
              return;
            }
            setSearchQuery(place.name);

            if (place.place_id) {
              setPlaces([place]);
              updateMapMarkers([place]);
              mapInstanceRef.current.setCenter(place.geometry.location);
              mapInstanceRef.current.setZoom(15);
              fetchAiInsights(place.name, place.geometry.location.lat(), place.geometry.location.lng());
            } else {
              mapInstanceRef.current.setCenter(place.geometry.location);
              mapInstanceRef.current.setZoom(14);
              performSearch(place.name);
            }
          });
        } catch (e) {
          console.warn("Autocomplete init failed", e);
        }
      }

      mapInstanceRef.current.addListener('dragend', () => setShowSearchAreaBtn(true));
      mapInstanceRef.current.addListener('zoom_changed', () => setShowSearchAreaBtn(true));

    } catch (e) {
      console.error("Error initializing map:", e);
      setMapError("Map initialization failed.");
    }
  };

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

    if (mapError || !window.google || !serviceRef.current) {
      searchWithGemini(query, type);
      return;
    }

    try {
      const center = mapInstanceRef.current.getCenter();
      const request: any = {
        location: center,
        radius: 5000,
        query: query ? query : undefined,
        type: type ? type : undefined,
      };

      if (query) {
        request.query = query + ' in Trinidad';
        serviceRef.current.textSearch(request, (results: PlaceResult[], status: any) => {
          handleSearchResults(results, status, query, center.lat(), center.lng());
        });
      } else if (type) {
        // Determine if 'type' is a standard Google Maps type or a custom keyword
        const standardTypes = [
          'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery', 'atm', 'bakery', 'bank', 'bar', 'beauty_salon',
          'bicycle_store', 'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground', 'car_dealer', 'car_rental',
          'car_repair', 'car_wash', 'casino', 'cemetery', 'church', 'city_hall', 'clothing_store', 'convenience_store',
          'courthouse', 'dentist', 'department_store', 'doctor', 'drugstore', 'electrician', 'electronics_store', 'embassy',
          'fire_station', 'florist', 'funeral_home', 'furniture_store', 'gas_station', 'gym', 'hair_care', 'hardware_store',
          'hindu_temple', 'home_goods_store', 'hospital', 'insurance_agency', 'jewelry_store', 'laundry', 'lawyer', 'library',
          'light_rail_station', 'liquor_store', 'local_government_office', 'locksmith', 'lodging', 'meal_delivery',
          'meal_takeaway', 'mosque', 'movie_rental', 'movie_theater', 'moving_company', 'museum', 'night_club', 'painter', 'park',
          'parking', 'pet_store', 'pharmacy', 'physiotherapist', 'plumber', 'police', 'post_office', 'primary_school',
          'real_estate_agency', 'restaurant', 'roofing_contractor', 'rv_park', 'school', 'secondary_school', 'shoe_store',
          'shopping_mall', 'spa', 'stadium', 'storage', 'store', 'subway_station', 'supermarket', 'synagogue', 'taxi_stand',
          'tourist_attraction', 'train_station', 'transit_station', 'travel_agency', 'university', 'veterinary_care', 'zoo'
        ];

        if (standardTypes.includes(type)) {
          // It's a valid type
          request.type = type;
          serviceRef.current.nearbySearch(request, (results: PlaceResult[], status: any) => {
            handleSearchResults(results, status);
          });
        } else {
          // It's a custom keyword (e.g. roti_shop, street_food)
          // Use keyword search instead of type
          request.keyword = type.replace(/_/g, ' ');
          delete request.type;

          serviceRef.current.nearbySearch(request, (results: PlaceResult[], status: any) => {
            handleSearchResults(results, status);
          });
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Search error", e);
      searchWithGemini(query, type);
    }
  };

  const handleSearchResults = (results: PlaceResult[], status: any, query?: string, lat?: number, lng?: number) => {
    let combinedResults: PlaceResult[] = [];

    // Filter local stores based on query
    const matchingLocalStores = localStores.filter(store => {
      if (!query) return true;
      return store.businessName.toLowerCase().includes(query.toLowerCase()) ||
        store.description?.toLowerCase().includes(query.toLowerCase());
    }).map(store => ({
      place_id: store.id,
      name: store.businessName,
      formatted_address: store.address || "Trinidad & Tobago",
      geometry: {
        location: {
        }, // Mock location with slight randomization
        viewport: null
      },
      rating: 5.0,
      user_ratings_total: 1,
      photos: [],
      types: ['store']
    }));

    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      combinedResults = [...matchingLocalStores, ...results];
      setPlaces(combinedResults);
      updateMapMarkers(combinedResults);
      if (query) fetchAiInsights(query, lat, lng);
    } else {
      if (query) {
        // If maps fail, still show local stores + Gemini
        if (matchingLocalStores.length > 0) {
          setPlaces(matchingLocalStores);
        } else {
          searchWithGemini(query);
        }
        return;
      }
      setPlaces(matchingLocalStores);
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
      mapInstanceRef.current.setCenter(location.center);
      mapInstanceRef.current.setZoom(location.zoom);
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
    if (!mapInstanceRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current.setCenter(pos);
          mapInstanceRef.current.setZoom(14);
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

  const updateMapMarkers = (results: PlaceResult[]) => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    results.forEach((place, i) => {
      if (!place.geometry || !place.geometry.location) return;

      const marker = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        position: place.geometry.location,
        title: place.name,
        animation: window.google.maps.Animation.DROP,
        label: {
          text: (i + 1).toString(),
          color: "white",
          fontSize: "10px"
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 220px;">
            <h3 style="font-weight: 700; margin-bottom: 4px; font-size: 14px;">${place.name}</h3>
            <p style="font-size: 12px; color: #555; margin-bottom: 8px;">${place.formatted_address || place.vicinity || ''}</p>
            ${place.rating ? `<div style="display:flex; align-items:center; margin-bottom:8px;"><span style="color:#f59e0b;">★</span> <span style="font-size:12px; font-weight:bold; margin-left:2px;">${place.rating}</span> <span style="font-size:10px; color:#888; margin-left:4px;">(${place.user_ratings_total})</span></div>` : ''}
            <div style="margin-top: 8px;">
               ${place.place_id && place.place_id.startsWith('store-') ?
            `<button id="view-btn-${place.place_id}" style="background-color: #000; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; width: 100%; transition: background 0.2s;">
                    View Store
                 </button>` :
            `<button id="claim-btn-${place.place_id}" style="background-color: #CE1126; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; width: 100%; transition: background 0.2s;">
                    Claim This Business
                 </button>`
          }
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        setTimeout(() => {
          if (place.place_id && place.place_id.startsWith('store-')) {
            const btn = document.getElementById(`view-btn-${place.place_id}`);
            if (btn) {
              btn.onclick = () => navigate(`/store/${place.place_id}`);
            }
          } else {
            const btn = document.getElementById(`claim-btn-${place.place_id}`);
            if (btn) {
              btn.onclick = () => handleClaim(place);
            }
          }
        }, 100);
      });

      markersRef.current.push(marker);
      bounds.extend(place.geometry.location);
    });

    if (!showSearchAreaBtn && results.length > 0) {
      mapInstanceRef.current.fitBounds(bounds);
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

    if (mapError || !mapInstanceRef.current) {
      if (place.url) window.open(place.url, '_blank');
      return;
    }

    if (place.geometry?.location) {
      mapInstanceRef.current.panTo(place.geometry.location);
      mapInstanceRef.current.setZoom(16);
      const marker = markersRef.current.find(m => m.getTitle() === place.name);
      if (marker) {
        window.google.maps.event.trigger(marker, 'click');
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
      <div className="bg-white shadow-md border-b border-gray-200 z-30 flex-shrink-0 relative">
        <div className="max-w-7xl mx-auto w-full px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 mb-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <input
                ref={searchInputRef}
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
            <span>{mapError ? 'via TriniBuild AI' : (activeLocation !== 'all' ? LOCATIONS.find(z => z.id === activeLocation)?.label : 'Trinidad & Tobago')}</span>
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
                        {place.photos && place.photos.length > 0 ? (
                          <img
                            src={place.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100">
                            <MapIcon className="h-8 w-8 mb-1 opacity-50" />
                            <span className="text-[10px]">No Photo</span>
                          </div>
                        )}
                        {mapError && (
                          <div className="absolute top-1 right-1">
                            <div className="bg-blue-500 text-white p-1 rounded-full shadow-sm" title="From TriniBuild AI">
                              <BadgeCheck className="h-3 w-3" />
                            </div>
                          </div>
                        )}
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
                              <span className="text-xs text-gray-400 italic">
                                {mapError ? 'AI Verified' : 'No ratings yet'}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {place.formatted_address || place.vicinity || "Trinidad & Tobago"}
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
                      {mapError
                        ? "Map unavailable due to API Key restriction. You can still search businesses using AI."
                        : "Use the map or search bar to find local businesses, services, and hidden gems."}
                    </p>
                  </div>
                )
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-trini-red animate-spin mb-2" />
                  <p className="text-sm text-gray-500">
                    {mapError ? 'Searching database via TriniBuild AI...' : 'Searching T&T\'s database...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow h-[45vh] lg:h-auto bg-gray-200 relative group">
          {mapError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 p-6 text-center border-l border-gray-200">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Visual Map Unavailable</h3>
              <p className="text-sm mb-4 max-w-md">
                {mapError}
              </p>
              <div className="bg-white px-4 py-3 rounded-md shadow-sm border border-gray-200 text-xs text-gray-600 text-left max-w-sm mx-auto">
                <strong>Likely Cause:</strong> Your API Key is valid for AI Studio but does not have the "Maps JavaScript API" service enabled in Google Cloud Console.
              </div>
              <p className="text-sm text-gray-600 mt-6 font-medium">
                Don't worry! Search works via the "Built-in Backend" (TriniBuild AI).
              </p>
              <Link to="/settings" className="mt-4 inline-block bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
                Update Maps API Key
              </Link>
            </div>
          ) : (
            <>
              <div ref={mapRef} className="w-full h-full min-h-[400px]" />
              {showSearchAreaBtn && !mapError && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <button
                    onClick={searchCurrentArea}
                    className="bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg font-semibold text-sm flex items-center hover:bg-gray-50 transition-transform transform hover:scale-105 animate-in fade-in slide-in-from-top-4"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crosshair className="h-4 w-4 mr-2 text-trini-red" />}
                    Search this area
                  </button>
                </div>
              )}

              {!mapError && (
                <button
                  onClick={handleLocateMe}
                  className="absolute bottom-8 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50 focus:outline-none z-10 text-gray-600"
                  title="Locate Me"
                >
                  <Navigation className="h-6 w-6 transform hover:text-trini-red transition-colors" />
                </button>
              )}
            </>
          )}

          {!window.google && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
              <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};