import { supabase } from './supabaseClient';

export interface Ride {
    id: string;
    passenger_id: string;
    driver_id?: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    driver_lat?: number;
    driver_lng?: number;
    status: 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
    price: number;
    created_at: string;
    driver_name?: string;
    driver_car?: string;
    driver_plate?: string;
    driver_rating?: number;
}

export interface LocationUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    timestamp?: number;
}

export const ridesService = {
    // Request a new ride
    async requestRide(pickup: string, dropoff: string, price: number, coords?: { pickup?: [number, number], dropoff?: [number, number] }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('rides')
            .insert({
                passenger_id: user.id,
                pickup_location: pickup,
                dropoff_location: dropoff,
                price,
                pickup_lat: coords?.pickup?.[0],
                pickup_lng: coords?.pickup?.[1],
                dropoff_lat: coords?.dropoff?.[0],
                dropoff_lng: coords?.dropoff?.[1],
                status: 'searching'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get ride details
    async getRide(rideId: string) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('id', rideId)
            .single();

        if (error) throw error;
        return data;
    },

    // Update ride status
    async updateRideStatus(rideId: string, status: Ride['status']) {
        const { error } = await supabase
            .from('rides')
            .update({ status })
            .eq('id', rideId);

        if (error) throw error;
    },

    // Cancel a ride
    async cancelRide(rideId: string) {
        const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled' })
            .eq('id', rideId);

        if (error) throw error;
    },

    // Update driver's real-time location
    async updateDriverLocation(rideId: string, location: LocationUpdate) {
        const { error } = await supabase
            .from('rides')
            .update({
                driver_lat: location.latitude,
                driver_lng: location.longitude
            })
            .eq('id', rideId);

        if (error) {
            console.error('Failed to update driver location:', error);
            throw error;
        }
    },

    // Subscribe to real-time ride updates
    subscribeToRide(rideId: string, callback: (ride: Ride) => void) {
        const subscription = supabase
            .channel(`ride:${rideId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rides',
                    filter: `id=eq.${rideId}`
                },
                (payload) => {
                    callback(payload.new as Ride);
                }
            )
            .subscribe();

        return subscription;
    },

    // Unsubscribe from ride updates
    async unsubscribeFromRide(subscription: any) {
        await supabase.removeChannel(subscription);
    },

    // Start continuous location tracking (for drivers)
    startLocationTracking(rideId: string, onLocationUpdate?: (location: LocationUpdate) => void) {
        let watchId: number | null = null;

        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    const location: LocationUpdate = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        speed: position.coords.speed || undefined,
                        heading: position.coords.heading || undefined,
                        timestamp: position.timestamp
                    };

                    // Update in database
                    try {
                        await this.updateDriverLocation(rideId, location);
                        if (onLocationUpdate) {
                            onLocationUpdate(location);
                        }
                    } catch (error) {
                        console.error('Location update failed:', error);
                    }
                },
                (error) => {
                    console.error('Geolocation error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }

        return {
            stop: () => {
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                }
            }
        };
    },

    // Calculate estimated time and distance (using Haversine formula)
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.round(distance * 100) / 100; // Round to 2 decimals
    },

    // Estimate arrival time (very simplified - assumes 40 km/h average speed in Trinidad)
    estimateArrival(distanceKm: number): number {
        const avgSpeedKmh = 40; // Average speed in Trinidad
        const timeHours = distanceKm / avgSpeedKmh;
        return Math.ceil(timeHours * 60); // Return minutes, rounded up
    },

    // Get all rides for a passenger
    async getPassengerRides() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('passenger_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Failed to fetch rides:', error);
            return [];
        }
        return data;
    },

    // Get all rides for a driver
    async getDriverRides() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Failed to fetch rides:', error);
            return [];
        }
        return data;
    },

    // SIMULATION: Driver matching (would be replaced with real matching algorithm)
    async simulateDriverMatch(rideId: string) {
        // Wait 3 seconds to simulate matching
        await new Promise(resolve => setTimeout(resolve, 3000));

        const mockDriver = {
            name: 'David R.',
            car: 'White Nissan Tiida',
            plate: 'PDE 4521',
            rating: 4.9
        };

        // Update ride with driver info
        const { error } = await supabase
            .from('rides')
            .update({
                status: 'accepted',
                driver_name: mockDriver.name,
                driver_car: mockDriver.car,
                driver_plate: mockDriver.plate,
                driver_rating: mockDriver.rating
                // In production: driver_id: actualDriverId
            })
            .eq('id', rideId);

        if (error) console.error("Simulation error:", error);

        return { status: 'accepted', driver: mockDriver };
    }
};

