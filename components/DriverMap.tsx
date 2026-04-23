import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigation, MapPin, Clock, AlertCircle, User, Star } from 'lucide-react';
import { gpsTrackingService, GPSLocation } from '../services/gpsTrackingService';

interface DriverMapProps {
  tripId: string;
  driverId: string;
  passengerLat: number;
  passengerLng: number;
  destinationLat: number;
  destinationLng: number;
  driverName?: string;
  driverRating?: number;
  driverPhoto?: string;
  vehicleInfo?: string;
}

export const DriverMap: React.FC<DriverMapProps> = ({
  tripId,
  driverId,
  passengerLat,
  passengerLng,
  destinationLat,
  destinationLng,
  driverName = 'Driver',
  driverRating = 4.8,
  driverPhoto,
  vehicleInfo = 'Vehicle'
}) => {
  const [driverLocation, setDriverLocation] = useState<GPSLocation | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time driver location
  useEffect(() => {
    const subscription = gpsTrackingService.subscribeToDriverLocation(
      driverId,
      (location) => {
        setDriverLocation(location);
        setLoading(false);

        // Calculate distance
        const dist = gpsTrackingService.calculateDistance(
          location.latitude,
          location.longitude,
          passengerLat,
          passengerLng
        );
        setDistance(Math.round(dist * 1000)); // Convert to meters
      }
    );

    // Calculate ETA
    const calculateETA = async () => {
      const result = await gpsTrackingService.calculateETA(
        driverId === driverId ? driverLocation?.latitude || passengerLat : passengerLat,
        driverId === driverId ? driverLocation?.longitude || passengerLng : passengerLng,
        passengerLat,
        passengerLng
      );

      if (result) {
        setEta(result.duration);
      }
    };

    if (driverLocation) {
      calculateETA();
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [driverId, passengerLat, passengerLng, driverLocation]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-trini-red rounded-full mb-4">
            <Navigation className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-gray-600 font-semibold">Finding your driver...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!driverLocation) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Waiting for driver location...</p>
      </div>
    );
  }

  // Calculate bearing from driver to passenger
  const bearing = Math.atan2(
    passengerLng - driverLocation.longitude,
    passengerLat - driverLocation.latitude
  );
  const degrees = (bearing * 180) / Math.PI;

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0">
        {/* This would be replaced with actual map library (Leaflet, Google Maps, etc.) */}
        <div
          className="w-full h-full bg-gradient-to-b from-blue-600 to-blue-400 flex items-center justify-center text-white"
          style={{
            backgroundImage: `linear-gradient(45deg, rgba(37, 99, 235, 0.1) 25%, transparent 25%, transparent 75%, rgba(37, 99, 235, 0.1) 75%, rgba(37, 99, 235, 0.1)), 
                            linear-gradient(45deg, rgba(37, 99, 235, 0.1) 25%, transparent 25%, transparent 75%, rgba(37, 99, 235, 0.1) 75%, rgba(37, 99, 235, 0.1))`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }}
        >
          {/* Driver Marker */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-8 h-8 bg-trini-red rounded-full shadow-lg"
            style={{
              top: `${50 + (driverLocation.latitude - passengerLat) * 100}%`,
              left: `${50 + (driverLocation.longitude - passengerLng) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="absolute inset-0 rounded-full border-2 border-white opacity-75"
              style={{
                transform: `rotate(${degrees}deg)`,
                animation: 'spin 4s linear infinite'
              }}
            />
            <Navigation className="w-4 h-4 text-white absolute top-2 left-2" />
          </motion.div>

          {/* Passenger Marker */}
          <motion.div
            className="absolute w-8 h-8 bg-blue-500 rounded-full shadow-lg border-2 border-white"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <MapPin className="w-4 h-4 text-white absolute top-2 left-2" />
          </motion.div>

          {/* Destination Marker */}
          <motion.div
            className="absolute w-8 h-8 bg-green-500 rounded-full shadow-lg border-2 border-white"
            style={{
              top: `${50 + (destinationLat - passengerLat) * 100}%`,
              left: `${50 + (destinationLng - passengerLng) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <MapPin className="w-4 h-4 text-white absolute top-2 left-2" />
          </motion.div>
        </div>
      </div>

      {/* Driver Info Card - Top */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 bg-white shadow-lg z-10"
      >
        <div className="p-4 max-w-md mx-auto flex items-center gap-4">
          {driverPhoto ? (
            <img
              src={driverPhoto}
              alt={driverName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-trini-red rounded-full flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-gray-900">{driverName}</h3>
            <p className="text-sm text-gray-600">{vehicleInfo}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">
                {driverRating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* ETA Display */}
          {eta !== null && (
            <div className="bg-trini-red text-white rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-lg">{eta} min</span>
              </div>
              <p className="text-xs opacity-90">ETA</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Status Bar - Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-0 left-0 right-0 bg-white shadow-lg z-10"
      >
        <div className="p-4 max-w-md mx-auto">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Driver arriving</span>
              {distance && (
                <span>
                  {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`} away
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: distance ? Math.min((distance / 5000) * 100, 100) + '%' : '0%' }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-trini-red"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Call Driver
            </button>
            <button className="flex-1 bg-gray-100 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Share Location
            </button>
            <button className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-20 right-4 bg-black text-white text-xs p-3 rounded opacity-70 max-w-xs z-20">
          <p>Driver: {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}</p>
          <p>Accuracy: {driverLocation.accuracy}m</p>
          {driverLocation.speed !== undefined && <p>Speed: {driverLocation.speed?.toFixed(1)} m/s</p>}
        </div>
      )}
    </div>
  );
};

export default DriverMap;
