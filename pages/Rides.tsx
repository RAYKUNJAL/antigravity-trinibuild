import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '../services/supabaseClient';
import { ridesService, Ride } from '../services/ridesService';
import { MapPin, Navigation, Car, CreditCard, Clock, Star, Phone, Shield, User, Briefcase } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
const DriverIcon = L.divIcon({
  html: `<div class="bg-trini-black text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4 0.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
  className: 'custom-driver-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const PassengerIcon = L.divIcon({
  html: `<div class="bg-trini-teal text-white p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  className: 'custom-passenger-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

// Trinidad Coordinates
const TRINIDAD_CENTER = [10.6918, -61.2225];

export const Rides: React.FC = () => {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [user, setUser] = useState<any>(null);

  // Driver Mode State
  const [isDriverMode, setIsDriverMode] = useState(false);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [driverActiveJob, setDriverActiveJob] = useState<Ride | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Realtime subscription for Passenger
  useEffect(() => {
    if (activeRide && !isDriverMode) {
      const subscription = ridesService.subscribeToRide(activeRide.id, (updatedRide) => {
        setActiveRide(updatedRide);
      });
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeRide?.id, isDriverMode]);

  // Driver Mode Logic
  useEffect(() => {
    if (isDriverMode) {
      loadAvailableRides();

      // Subscribe to new rides
      const newRideSub = ridesService.subscribeToNewRides((newRide) => {
        setAvailableRides(prev => [newRide, ...prev]);
      });

      return () => {
        supabase.removeChannel(newRideSub);
      };
    }
  }, [isDriverMode]);

  // Realtime subscription for Driver Active Job
  useEffect(() => {
    if (driverActiveJob && isDriverMode) {
      const subscription = ridesService.subscribeToRide(driverActiveJob.id, (updatedRide) => {
        setDriverActiveJob(updatedRide);
      });
      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [driverActiveJob?.id, isDriverMode]);

  const loadAvailableRides = async () => {
    try {
      const rides = await ridesService.getAvailableRides();
      setAvailableRides(rides);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to request a ride');
      return;
    }
    setLoading(true);

    const estimatedPrice = Math.floor(Math.random() * (100 - 30 + 1) + 30);
    setPrice(estimatedPrice);

    try {
      const rideData = {
        passenger_id: user.id,
        pickup_location: pickup,
        dropoff_location: dropoff,
        pickup_lat: 10.65 + (Math.random() * 0.05),
        pickup_lng: -61.50 + (Math.random() * 0.05),
        dropoff_lat: 10.60 + (Math.random() * 0.05),
        dropoff_lng: -61.40 + (Math.random() * 0.05),
        price: estimatedPrice,
        status: 'searching' as const
      };

      const newRide = await ridesService.requestRide(rideData);
      setActiveRide(newRide);
    } catch (error) {
      console.error('Error requesting ride:', error);
      alert('Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    if (confirm('Are you sure you want to cancel?')) {
      try {
        await ridesService.cancelRide(activeRide.id);
        setActiveRide(null);
        setPrice(null);
      } catch (error) {
        console.error('Error cancelling ride:', error);
      }
    }
  };

  // Driver Actions
  const handleAcceptRide = async (ride: Ride) => {
    if (!user) return alert('Please login as a driver');
    try {
      // Mock Driver Details
      const acceptedRide = await ridesService.acceptRide(
        ride.id,
        user.id,
        user.user_metadata.full_name || 'Trini Driver',
        'Toyota Corolla',
        'PDB 1234'
      );
      setDriverActiveJob(acceptedRide);
      // Remove from available list
      setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
    } catch (error) {
      console.error('Error accepting ride:', error);
      alert('Failed to accept ride');
    }
  };

  const handleUpdateStatus = async (status: 'arrived' | 'in_progress' | 'completed') => {
    if (!driverActiveJob) return;
    try {
      const updatedRide = await ridesService.updateRideStatus(driverActiveJob.id, status);
      setDriverActiveJob(updatedRide);
      if (status === 'completed') {
        alert(`Ride Completed! You earned $${driverActiveJob.price}`);
        setDriverActiveJob(null);
        loadAvailableRides();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Map Section */}
      <div className="w-full md:w-2/3 h-[50vh] md:h-screen relative z-0">
        <MapContainer center={TRINIDAD_CENTER as L.LatLngExpression} zoom={11} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Passenger View Markers */}
          {!isDriverMode && activeRide && (
            <>
              <Marker position={[activeRide.pickup_lat, activeRide.pickup_lng]} icon={PassengerIcon}>
                <Popup>Pickup: {activeRide.pickup_location}</Popup>
              </Marker>
              <Marker position={[activeRide.dropoff_lat, activeRide.dropoff_lng]}>
                <Popup>Dropoff: {activeRide.dropoff_location}</Popup>
              </Marker>
              {activeRide.driver_lat && activeRide.driver_lng && (
                <Marker position={[activeRide.driver_lat, activeRide.driver_lng]} icon={DriverIcon}>
                  <Popup>Driver: {activeRide.driver_name}</Popup>
                </Marker>
              )}
            </>
          )}

          {/* Driver View Markers */}
          {isDriverMode && (
            <>
              {/* Show all available pickups */}
              {!driverActiveJob && availableRides.map(ride => (
                <Marker key={ride.id} position={[ride.pickup_lat, ride.pickup_lng]} icon={PassengerIcon} eventHandlers={{ click: () => handleAcceptRide(ride) }}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">{ride.pickup_location}</p>
                      <p className="text-green-600 font-bold">${ride.price}</p>
                      <button onClick={() => handleAcceptRide(ride)} className="mt-2 bg-trini-black text-white px-3 py-1 rounded text-xs">Accept</button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Show Active Job Route */}
              {driverActiveJob && (
                <>
                  <Marker position={[driverActiveJob.pickup_lat, driverActiveJob.pickup_lng]} icon={PassengerIcon}>
                    <Popup>Pickup: {driverActiveJob.pickup_location}</Popup>
                  </Marker>
                  <Marker position={[driverActiveJob.dropoff_lat, driverActiveJob.dropoff_lng]}>
                    <Popup>Dropoff: {driverActiveJob.dropoff_location}</Popup>
                  </Marker>
                </>
              )}
            </>
          )}
        </MapContainer>

        {/* Mode Toggle */}
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
          <span className={`text-sm font-bold ${!isDriverMode ? 'text-trini-teal' : 'text-gray-400'}`}>Passenger</span>
          <button
            onClick={() => setIsDriverMode(!isDriverMode)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${isDriverMode ? 'bg-trini-black' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDriverMode ? 'translate-x-6' : ''}`}></div>
          </button>
          <span className={`text-sm font-bold ${isDriverMode ? 'text-trini-black' : 'text-gray-400'}`}>Driver</span>
        </div>
      </div>

      {/* Sidebar / Controls */}
      <div className="w-full md:w-1/3 bg-white p-6 shadow-xl z-10 flex flex-col h-[50vh] md:h-screen overflow-y-auto">
        <h1 className="text-3xl font-extrabold text-trini-black mb-2">Trini<span className="text-trini-teal">Rides</span></h1>

        {isDriverMode ? (
          // DRIVER MODE UI
          <div className="flex-grow flex flex-col">
            <div className="bg-trini-black text-white p-4 rounded-xl mb-6 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold">Status</p>
                <p className="font-bold text-lg flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span> Online
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase font-bold">Today's Earnings</p>
                <p className="font-bold text-xl text-trini-teal">$145.00</p>
              </div>
            </div>

            {driverActiveJob ? (
              <div className="bg-white border-2 border-trini-teal rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-trini-teal" /> Current Job
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold">PICKUP</p>
                      <p className="font-medium">{driverActiveJob.pickup_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 font-bold">DROPOFF</p>
                      <p className="font-medium">{driverActiveJob.dropoff_location}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-bold text-lg">${driverActiveJob.price}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-bold text-lg">5.2 km</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {driverActiveJob.status === 'accepted' && (
                    <button onClick={() => handleUpdateStatus('arrived')} className="w-full bg-trini-teal text-white py-3 rounded-xl font-bold hover:bg-teal-600">
                      Arrived at Pickup
                    </button>
                  )}
                  {driverActiveJob.status === 'arrived' && (
                    <button onClick={() => handleUpdateStatus('in_progress')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">
                      Start Trip
                    </button>
                  )}
                  {driverActiveJob.status === 'in_progress' && (
                    <button onClick={() => handleUpdateStatus('completed')} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                      Complete Trip
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Available Requests ({availableRides.length})</h3>
                {availableRides.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No rides available right now.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableRides.map(ride => (
                      <div key={ride.id} className="bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-lg">${ride.price}</p>
                            <p className="text-xs text-gray-500">Cash Payment</p>
                          </div>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">4.5 km</span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm truncate"><span className="text-green-600 font-bold">FROM:</span> {ride.pickup_location}</p>
                          <p className="text-sm truncate"><span className="text-red-600 font-bold">TO:</span> {ride.dropoff_location}</p>
                        </div>
                        <button
                          onClick={() => handleAcceptRide(ride)}
                          className="w-full bg-trini-black text-white py-2 rounded-lg font-bold hover:bg-gray-800"
                        >
                          Accept Ride
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // PASSENGER MODE UI (Existing)
          <>
            <p className="text-gray-500 mb-8">Fast, safe, and reliable rides across T&T.</p>

            {!activeRide ? (
              <form onSubmit={handleRequestRide} className="space-y-6 flex-grow">
                <div className="space-y-4">
                  <div className="relative">
                    <MapPin className="absolute top-3.5 left-3 h-5 w-5 text-green-600" />
                    <input
                      type="text"
                      placeholder="Pickup Location"
                      required
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-teal outline-none transition-all"
                      value={pickup}
                      onChange={e => setPickup(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute top-3.5 left-3 h-5 w-5 text-red-600" />
                    <input
                      type="text"
                      placeholder="Dropoff Destination"
                      required
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-trini-teal outline-none transition-all"
                      value={dropoff}
                      onChange={e => setDropoff(e.target.value)}
                    />
                  </div>
                </div>

                {/* Vehicle Types */}
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" className="p-3 border-2 border-trini-teal bg-teal-50 rounded-xl flex flex-col items-center gap-2">
                    <Car className="h-6 w-6 text-trini-teal" />
                    <span className="text-xs font-bold">Standard</span>
                  </button>
                  <button type="button" className="p-3 border border-gray-200 rounded-xl flex flex-col items-center gap-2 opacity-50">
                    <Car className="h-6 w-6 text-gray-600" />
                    <span className="text-xs font-bold">Premium</span>
                  </button>
                  <button type="button" className="p-3 border border-gray-200 rounded-xl flex flex-col items-center gap-2 opacity-50">
                    <Car className="h-6 w-6 text-gray-600" />
                    <span className="text-xs font-bold">XL</span>
                  </button>
                </div>

                {/* Payment Method */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Cash</span>
                  </div>
                  <button type="button" className="text-trini-teal font-bold text-sm">Change</button>
                </div>

                <div className="mt-auto pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-trini-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition-transform transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Calculating...' : 'Request Ride'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-grow flex flex-col">
                {/* Ride Active State */}
                <div className="bg-teal-50 border border-trini-teal rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Ride Requested</h3>
                      <p className="text-gray-600 text-sm">Est. arrival: 5 mins</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-trini-teal">${activeRide.price}</p>
                      <p className="text-xs text-gray-500">Cash Payment</p>
                    </div>
                  </div>

                  <div className="space-y-4 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-gray-300 border-l border-dashed"></div>

                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                        <p className="font-medium text-gray-900">{activeRide.pickup_location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 z-10">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Dropoff</p>
                        <p className="font-medium text-gray-900">{activeRide.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {activeRide.status !== 'searching' && activeRide.driver_name ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <Car className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900">{activeRide.driver_name}</h4>
                      <p className="text-sm text-gray-500">{activeRide.driver_car} • {activeRide.driver_plate}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-sm">{activeRide.driver_rating || '5.0'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-center animate-pulse">
                    <p className="text-yellow-800 font-bold">Finding a driver nearby...</p>
                  </div>
                )}

                <div className="mt-auto space-y-3">
                  {activeRide.status !== 'searching' && (
                    <button className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" /> Call Driver
                    </button>
                  )}
                  <button
                    onClick={handleCancelRide}
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 border border-red-100"
                  >
                    Cancel Ride
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
