import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { rideService, DriverLocation } from '../services/rideService';
import { Car, Navigation, MapPin, Clock, DollarSign } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface RideTrackerProps {
    rideId: string;
    driverId?: string;
    pickupLocation: { lat: number; lng: number };
    dropoffLocation: { lat: number; lng: number };
}

// Custom map component to handle centering
function MapController({ center }: { center: LatLngExpression }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 14);
    }, [center, map]);
    return null;
}

export const RideTracker: React.FC<RideTrackerProps> = ({
    rideId,
    driverId,
    pickupLocation,
    dropoffLocation,
}) => {
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
    const [eta, setEta] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const subscriptionRef = useRef<any>(null);

    // Custom icons
    const driverIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2">
        <path d="M5 17h14v-5H5v5z"/>
        <path d="M3 17h18v2H3v-2z"/>
        <path d="M6 12V6l4-2 4 2v6"/>
      </svg>
    `),
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });

    const pickupIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#10B981" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    const dropoffIcon = new Icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    `),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    useEffect(() => {
        if (!driverId) return;

        // Subscribe to real-time driver location updates
        subscriptionRef.current = rideService.subscribeToDriverLocation(
            driverId,
            (location) => {
                setDriverLocation(location);
                // Calculate ETA and distance (simplified - in production use Google Maps Directions API)
                const dist = calculateDistance(
                    location.latitude,
                    location.longitude,
                    pickupLocation.lat,
                    pickupLocation.lng
                );
                setDistance(dist);
                setEta(Math.ceil((dist / 40) * 60)); // Assuming 40 km/h average speed
            }
        );

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [driverId, pickupLocation]);

    // Haversine formula for distance calculation
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const toRad = (value: number) => (value * Math.PI) / 180;

    // Route polyline
    const routePoints: LatLngExpression[] = driverLocation
        ? [
            [driverLocation.latitude, driverLocation.longitude],
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng],
        ]
        : [
            [pickupLocation.lat, pickupLocation.lng],
            [dropoffLocation.lat, dropoffLocation.lng],
        ];

    const mapCenter: LatLngExpression = driverLocation
        ? [driverLocation.latitude, driverLocation.longitude]
        : [pickupLocation.lat, pickupLocation.lng];

    return (
        <div className="w-full h-full flex flex-col">
            {/* Status Bar */}
            <div className="bg-white border-b border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <Car className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">Driver En Route</p>
                            <p className="text-xs text-gray-500">Ride ID: {rideId.slice(0, 8)}</p>
                        </div>
                    </div>
                    {eta && (
                        <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                            <Clock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-bold text-green-900">{eta} min</span>
                        </div>
                    )}
                </div>

                {distance && (
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Navigation className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{distance.toFixed(1)} km away</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                <MapContainer
                    center={mapCenter}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={true}
                >
                    <MapController center={mapCenter} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Driver marker */}
                    {driverLocation && (
                        <Marker
                            position={[driverLocation.latitude, driverLocation.longitude]}
                            icon={driverIcon}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold">Your Driver</p>
                                    <p className="text-xs text-gray-500">
                                        Speed: {driverLocation.speed?.toFixed(0) || 0} km/h
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Pickup marker */}
                    <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-green-600">Pickup</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Dropoff marker */}
                    <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={dropoffIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-red-600">Dropoff</p>
                            </div>
                        </Popup>
                    </Marker>

                    {/* Route polyline */}
                    <Polyline positions={routePoints} color="#8B5CF6" weight={4} opacity={0.7} />
                </MapContainer>
            </div>
        </div>
    );
};
