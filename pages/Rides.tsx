
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Car, Truck, Bike, Clock, CreditCard, Navigation, CheckCircle, Loader2, Star, Shield, Banknote, Crosshair, AlertCircle } from 'lucide-react';
import { ChatWidget } from '../components/ChatWidget';
import { AdSpot } from '../components/AdSpot';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ridesService } from '../services/ridesService';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png', // Placeholder car icon
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png', // Placeholder user icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to update map center
const MapUpdater = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const Rides: React.FC = () => {
  const [bookingState, setBookingState] = useState<'idle' | 'searching' | 'found' | 'arriving' | 'in_progress'>('idle');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [selectedType, setSelectedType] = useState('standard');
  const [paymentType, setPaymentType] = useState<'cash' | 'card'>('cash');

  // Map State
  const [center, setCenter] = useState<[number, number]>([10.652, -61.514]); // Port of Spain
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [rideStats, setRideStats] = useState<{ distance: string, duration: string } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const rideSubscriptionRef = useRef<any>(null);

  const rideTypes = [
    { id: 'standard', name: 'TriniRide', icon: Car, price: 25, time: '5 min', desc: 'Affordable daily rides' },
    { id: 'taxi', name: 'H-Taxi', icon: Shield, price: 35, time: '8 min', desc: 'Registered H-Cars' },
    { id: 'courier', name: 'Courier', icon: Bike, price: 20, time: '10 min', desc: 'Package delivery' },
    { id: 'truck', name: 'Moving', icon: Truck, price: 150, time: '25 min', desc: 'Pickup trucks & vans' },
  ];

  useEffect(() => {
    // Try to get user location on load
    getUserLocation();

    // Cleanup subscription on unmount
    return () => {
      if (rideSubscriptionRef.current) {
        ridesService.unsubscribeFromRide(rideSubscriptionRef.current);
      }
    };
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCenter(pos);
          setUserLocation(pos);
          setPickup("Current Location");
        },
        () => console.log("GPS permission denied")
      );
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;

    setBookingState('searching');

    try {
      const price = rideTypes.find(r => r.id === selectedType)?.price || 25;

      // 1. Create Ride Request in DB
      const ride = await ridesService.requestRide(pickup, dropoff, price, {
        pickup: userLocation || center,
        // dropoff coords would come from geocoding in a real app
      });

      setCurrentRideId(ride.id);

      // 2. Subscribe to real-time updates for this ride
      const subscription = ridesService.subscribeToRide(ride.id, (updatedRide) => {
        console.log('Ride updated:', updatedRide);

        // Update driver location if available
        if (updatedRide.driver_lat && updatedRide.driver_lng) {
          setDriverLocation([updatedRide.driver_lat, updatedRide.driver_lng]);

          // Calculate distance and ETA
          if (userLocation) {
            const distance = ridesService.calculateDistance(
              userLocation[0],
              userLocation[1],
              updatedRide.driver_lat,
              updatedRide.driver_lng
            );
            const eta = ridesService.estimateArrival(distance);
            setRideStats({
              distance: `${distance.toFixed(1)} km`,
              duration: `${eta} mins`
            });
          }
        }

        // Update booking state based on ride status
        if (updatedRide.status === 'accepted' && bookingState === 'searching') {
          setBookingState('found');
        } else if (updatedRide.status === 'arrived') {
          setBookingState('arriving');
        } else if (updatedRide.status === 'in_progress') {
          setBookingState('in_progress');
        }
      });

      rideSubscriptionRef.current = subscription;

      // 3. Simulate Driver Matching (Backend Logic)
      const matchResult = await ridesService.simulateDriverMatch(ride.id);

      if (matchResult.status === 'accepted') {
        // Save Ride to History
        const newRide = {
          id: ride.id,
          pickup,
          dropoff,
          type: rideTypes.find(r => r.id === selectedType)?.name,
          price: price,
          date: new Date().toISOString(),
          status: 'completed'
        };

        const history = JSON.parse(localStorage.getItem('ride_history') || '[]');
        localStorage.setItem('ride_history', JSON.stringify([newRide, ...history].slice(0, 5)));

        // Start real-time driver tracking simulation
        startDriverSimulation(ride.id);
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Please sign in to book a ride.");
      setBookingState('idle');
    }
  };

  const startDriverSimulation = (rideId: string) => {
    // Start driver slightly offset from center
    const pickupPoint = userLocation || center;
    const startLat = pickupPoint[0] - 0.01; // ~1 km away
    const startLng = pickupPoint[1] - 0.01;

    // Set initial driver location
    setDriverLocation([startLat, startLng]);
    ridesService.updateDriverLocation(rideId, {
      latitude: startLat,
      longitude: startLng
    });

    let step = 0;
    const maxSteps = 150;
    const deltaLat = (pickupPoint[0] - startLat) / maxSteps;
    const deltaLng = (pickupPoint[1] - startLng) / maxSteps;

    const interval = setInterval(async () => {
      step++;
      if (step <= maxSteps) {
        const newLat = startLat + (deltaLat * step);
        const newLng = startLng + (deltaLng * step);

        // Update driver location in real-time
        try {
          await ridesService.updateDriverLocation(rideId, {
            latitude: newLat,
            longitude: newLng
          });
        } catch (error) {
          console.error('Failed to update driver location:', error);
        }
      } else {
        clearInterval(interval);
        // Mark driver as arrived
        ridesService.updateRideStatus(rideId, 'arrived');
      }
    }, 100); // Update every 100ms for smooth animation
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
                  <button className="bg-green-100 text-green-700 p-2 rounded-full block hover:bg-green-200" aria-label="Navigate to driver">
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
                  setDriverLocation(null);
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
      <div className="flex-grow bg-gray-200 relative min-h-[300px] lg:min-h-0 z-0">
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapUpdater center={center} />

          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
          )}

          {driverLocation && (
            <Marker position={driverLocation} icon={carIcon}>
              <Popup>Driver</Popup>
            </Marker>
          )}
        </MapContainer>

        {bookingState === 'found' && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg z-[1000] animate-in slide-in-from-top-2">
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
