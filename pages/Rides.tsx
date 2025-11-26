
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Car, Truck, Bike, Clock, CreditCard, Navigation, CheckCircle, Loader2, Star, Shield, Banknote, Crosshair, AlertCircle } from 'lucide-react';
import { ChatWidget } from '../components/ChatWidget';
import { AdSpot } from '../components/AdSpot';

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_KEY = 'AIzaSyAbjOn5lpjfYw6Ig3M-KWU1y0JP5z0LbPM';

export const Rides: React.FC = () => {
  const [bookingState, setBookingState] = useState<'idle' | 'searching' | 'found' | 'arriving' | 'in_progress'>('idle');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedType, setSelectedType] = useState('standard');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');

  // Map State
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [rideStats, setRideStats] = useState<{ distance: string, duration: string } | null>(null);

  const rideTypes = [
    { id: 'standard', name: 'TriniRide', icon: Car, price: 25, time: '5 min', desc: 'Affordable daily rides' },
    { id: 'taxi', name: 'H-Taxi', icon: Shield, price: 35, time: '8 min', desc: 'Registered H-Cars' },
    { id: 'courier', name: 'Courier', icon: Bike, price: 20, time: '10 min', desc: 'Package delivery' },
    { id: 'truck', name: 'Moving', icon: Truck, price: 150, time: '25 min', desc: 'Pickup trucks & vans' },
  ];

  // Load Google Maps
  useEffect(() => {
    const loadMap = async () => {
      const apiKey = localStorage.getItem('google_maps_api_key') || GOOGLE_MAPS_KEY || process.env.API_KEY;

      if (!window.google || !window.google.maps) {
        if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) return;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        script.onerror = () => setMapError("Failed to load Google Maps.");
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    loadMap();
  }, []);

  const initMap = () => {
    if (!mapRef.current) return;

    try {
      // Default Center: Port of Spain
      const defaultCenter = { lat: 10.652, lng: -61.514 };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
        ]
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#CE1126", // Trini Red
          strokeWeight: 5
        }
      });

      // Try to get user location
      getUserLocation();

    } catch (e) {
      console.error("Map Init Error", e);
      setMapError("Could not initialize map.");
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current.setCenter(pos);
          mapInstanceRef.current.setZoom(15);
          setPickup("Current Location");

          // Add a pulse marker for user
          new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            },
            title: "You are here"
          });
        },
        () => console.log("GPS permission denied")
      );
    }
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setBookingState('searching');

    // Simulate Route Calculation
    calculateRoute();

    setTimeout(() => {
      setBookingState('found');

      // Save Ride to History
      const newRide = {
        id: `ride-${Date.now()}`,
        pickup,
        dropoff,
        type: rideTypes.find(r => r.id === selectedType)?.name,
        price: rideTypes.find(r => r.id === selectedType)?.price,
        date: new Date().toISOString(),
        status: 'completed' // For demo purposes, we assume it completes
      };

      const history = JSON.parse(localStorage.getItem('ride_history') || '[]');
      localStorage.setItem('ride_history', JSON.stringify([newRide, ...history].slice(0, 5))); // Keep last 5

      startDriverSimulation();
    }, 2500);
  };

  const calculateRoute = () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    const request = {
      origin: pickup === "Current Location" ? mapInstanceRef.current.getCenter() : "Independence Square, Port of Spain",
      destination: "Queen's Park Savannah, Port of Spain",
      travelMode: window.google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        const leg = result.routes[0].legs[0];
        setRideStats({
          distance: leg.distance.text,
          duration: leg.duration.text
        });
      } else {
        console.warn("Directions request failed due to " + status);
        setRideStats({ distance: "4.2 km", duration: "12 mins" });
      }
    });
  };

  const startDriverSimulation = () => {
    if (!window.google || !mapInstanceRef.current) return;

    // Create Driver Marker
    const center = mapInstanceRef.current.getCenter();
    // Start slightly offset
    const startPos = { lat: center.lat() - 0.005, lng: center.lng() - 0.005 };

    driverMarkerRef.current = new window.google.maps.Marker({
      position: startPos,
      map: mapInstanceRef.current,
      icon: {
        path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M19.148,1.443 c-2.063,4.889-4.807,8.729-4.807,8.729g6.276-1.909l0.281-0.085H4.662l0.28,0.085c0,0,4.347,3.839,4.808-8.729H19.148z M5.781,1.443 c-0.387,4.238-1.04,7.567-1.04,7.567H3.08c-0.555-4.213-1.053-7.567-1.053-7.567H5.781z",
        fillColor: "black",
        fillOpacity: 1,
        scale: 0.8,
        strokeWeight: 1,
        rotation: 0,
        anchor: new window.google.maps.Point(10, 25),
      },
      title: "Driver"
    });

    let step = 0;
    const maxSteps = 100;
    const deltaLat = (center.lat() - startPos.lat) / maxSteps;
    const deltaLng = (center.lng() - startPos.lng) / maxSteps;

    const animate = () => {
      if (step < maxSteps) {
        const newPos = {
          lat: startPos.lat + (deltaLat * step),
          lng: startPos.lng + (deltaLng * step)
        };
        driverMarkerRef.current.setPosition(newPos);
        step++;
        requestAnimationFrame(animate);
      } else {
        setBookingState('arriving');
      }
    };
    animate();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Booking Form */}
      <div className="w-full lg:w-[450px] bg-white p-6 lg:p-8 shadow-xl z-10 flex flex-col h-auto lg:h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900">TriniBuild <span className="text-yellow-500">Go</span></h1>
          <p className="text-gray-500 mt-2">Safe rides & fast logistics across T&T.</p>
        </div>

        <AdSpot page="rides" slot="top" className="mb-6" />

        {bookingState === 'found' || bookingState === 'arriving' ? (
          <div className="flex-grow flex flex-col animate-in fade-in slide-in-from-bottom-4">
            <div className={`border rounded-xl p-6 mb-6 text-center transition-colors ${bookingState === 'arriving' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${bookingState === 'arriving' ? 'bg-green-100' : 'bg-blue-100'}`}>
                <CheckCircle className={`h-8 w-8 ${bookingState === 'arriving' ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <h2 className={`text-xl font-bold ${bookingState === 'arriving' ? 'text-green-800' : 'text-blue-800'}`}>
                {bookingState === 'arriving' ? 'Driver has Arrived!' : 'Driver Found!'}
              </h2>
              <p className="text-gray-600">
                {bookingState === 'arriving' ? 'Please meet David at the pickup point.' : 'Your driver is en route.'}
              </p>
              {rideStats && (
                <div className="mt-3 flex justify-center gap-4 text-sm font-bold text-gray-700">
                  <span>{rideStats.distance}</span>
                  <span>•</span>
                  <span>{rideStats.duration}</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="h-14 w-14 bg-gray-200 rounded-full overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=200&auto=format&fit=crop" alt="Driver" className="h-full w-full object-cover" />
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-900">David R.</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" /> 4.9 • White Nissan Tiida
                  </div>
                  <div className="mt-1 bg-gray-100 text-gray-800 text-xs font-mono px-2 py-0.5 rounded w-fit">
                    PDE 4521
                  </div>
                </div>
                <div className="ml-auto">
                  <button className="bg-green-100 text-green-700 p-2 rounded-full block hover:bg-green-200">
                    <Navigation className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Payment Method</span>
              <span className="text-sm font-bold text-gray-900 flex items-center">
                {paymentType === 'cash' ? <Banknote className="h-4 w-4 mr-1 text-green-600" /> : <CreditCard className="h-4 w-4 mr-1 text-blue-600" />}
                {paymentType === 'cash' ? 'Cash' : 'Card'}
              </span>
            </div>

            <div className="mt-auto">
              <button
                onClick={() => {
                  setBookingState('idle');
                  if (driverMarkerRef.current) driverMarkerRef.current.setMap(null);
                  if (directionsRendererRef.current) directionsRendererRef.current.setDirections({ routes: [] });
                }}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-bold hover:bg-gray-200"
              >
                Cancel Ride
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} className="flex-grow flex flex-col">
            <div className="space-y-4 mb-8">
              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 bg-white px-1">Pickup</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-transparent transition-all">
                  <MapPin className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Current Location"
                    className="bg-transparent w-full outline-none text-gray-900 placeholder-gray-400"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                  <button type="button" onClick={getUserLocation} className="text-xs text-gray-400 font-bold hover:text-yellow-500 flex items-center">
                    <Crosshair className="h-3 w-3 mr-1" /> GPS
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 bg-white px-1">Dropoff</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-transparent transition-all">
                  <MapPin className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Where to?"
                    className="bg-transparent w-full outline-none text-gray-900 placeholder-gray-400"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-2 block">Choose Ride</label>
              <div className="space-y-3">
                {rideTypes.map((type) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedType === type.id
                      ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className={`p-2 rounded-full mr-4 ${selectedType === type.id ? 'bg-white text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                      <type.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-gray-900">{type.name}</h3>
                      <p className="text-xs text-gray-500">{type.desc}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">TT${type.price}</div>
                      <div className="text-xs text-gray-500">{type.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPaymentType('cash')}
                    className={`px-3 py-1 rounded-md text-xs font-bold flex items-center transition-all ${paymentType === 'cash' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Banknote className="h-3 w-3 mr-1" /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('card')}
                    className={`px-3 py-1 rounded-md text-xs font-bold flex items-center transition-all ${paymentType === 'card' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <CreditCard className="h-3 w-3 mr-1" /> Card
                  </button>
                </div>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1" /> Now</span>
              </div>
              <button
                type="submit"
                disabled={!pickup || !dropoff || bookingState === 'searching'}
                className="w-full bg-trini-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 disabled:opacity-50 shadow-lg flex items-center justify-center transition-all"
              >
                {bookingState === 'searching' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Finding Driver...
                  </>
                ) : (
                  'Confirm Ride'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Recent Rides (Only show when idle) */}
        {bookingState === 'idle' && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {JSON.parse(localStorage.getItem('ride_history') || '[]').length > 0 ? (
                JSON.parse(localStorage.getItem('ride_history') || '[]').map((ride: any) => (
                  <div key={ride.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate max-w-[150px]">{ride.dropoff}</span>
                    </div>
                    <span className="font-bold text-gray-900">TT${ride.price}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic">No recent rides.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Functional Map */}
      <div className="flex-grow bg-gray-200 relative min-h-[300px] lg:min-h-0">
        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-center p-6">
            <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
            <h3 className="text-lg font-bold text-gray-700">Map Unavailable</h3>
            <p className="text-gray-500 text-sm">{mapError}</p>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full"></div>
        )}

        {!window.google && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm z-10">
            <Loader2 className="h-8 w-8 text-trini-red animate-spin" />
          </div>
        )}

        {bookingState === 'found' && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-10 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="font-bold text-sm text-gray-800">Live Tracking Active</span>
            </div>
          </div>
        )}
      </div>
      <ChatWidget mode="rides" />
    </div >
  );
};
