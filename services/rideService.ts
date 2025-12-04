import { supabase } from './supabaseClient';

export interface DriverLocation {
    driver_id: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    timestamp: string;
}

export interface RideRequest {
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    pickup_address: string;
    dropoff_address: string;
    passenger_count: number;
    vehicle_type?: 'standard' | 'premium' | 'xl';
    scheduled_time?: string;
}

export interface Ride {
    id: string;
    user_id: string;
    driver_id?: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    pickup_address: string;
    dropoff_address: string;
    status: 'pending' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    fare?: number;
    distance?: number;
    duration?: number;
    created_at: string;
    updated_at: string;
}

class RideService {
    /**
     * Update driver's real-time location
     */
    async updateDriverLocation(location: DriverLocation) {
        try {
            const { data, error } = await supabase
                .from('driver_locations')
                .upsert({
                    driver_id: location.driver_id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    heading: location.heading,
                    speed: location.speed,
                    accuracy: location.accuracy,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'driver_id'
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Update driver location error:', error);
            throw error;
        }
    }

    /**
     * Get nearby available drivers
     */
    async getNearbyDrivers(lat: number, lng: number, radiusKm: number = 5) {
        try {
            // Use PostGIS extension for geospatial queries
            const { data, error } = await supabase.rpc('get_nearby_drivers', {
                user_lat: lat,
                user_lng: lng,
                radius_km: radiusKm
            });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Get nearby drivers error:', error);
            throw error;
        }
    }

    /**
     * Create a new ride request
     */
    async createRide(rideRequest: RideRequest) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const { data, error } = await supabase
                .from('rides')
                .insert([{
                    user_id: session.user.id,
                    pickup_lat: rideRequest.pickup_lat,
                    pickup_lng: rideRequest.pickup_lng,
                    dropoff_lat: rideRequest.dropoff_lat,
                    dropoff_lng: rideRequest.dropoff_lng,
                    pickup_address: rideRequest.pickup_address,
                    dropoff_address: rideRequest.dropoff_address,
                    passenger_count: rideRequest.passenger_count,
                    vehicle_type: rideRequest.vehicle_type || 'standard',
                    status: 'pending',
                    scheduled_time: rideRequest.scheduled_time,
                }])
                .select()
                .single();

            if (error) throw error;

            // Trigger driver matching
            await this.matchDriver(data.id);

            return data;
        } catch (error: any) {
            console.error('Create ride error:', error);
            throw error;
        }
    }

    /**
     * Match a driver to a ride request
     */
    async matchDriver(rideId: string) {
        try {
            // Get ride details
            const { data: ride, error: rideError } = await supabase
                .from('rides')
                .select('*')
                .eq('id', rideId)
                .single();

            if (rideError) throw rideError;

            // Find nearby available drivers
            const drivers = await this.getNearbyDrivers(ride.pickup_lat, ride.pickup_lng);

            if (drivers.length === 0) {
                throw new Error('No drivers available in your area');
            }

            // Notify the closest driver (in a real app, you'd use push notifications)
            const closestDriver = drivers[0];

            // Update ride with matched driver
            const { data, error } = await supabase
                .from('rides')
                .update({
                    driver_id: closestDriver.driver_id,
                    status: 'matched',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', rideId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Match driver error:', error);
            throw error;
        }
    }

    /**
     * Update ride status
     */
    async updateRideStatus(rideId: string, status: Ride['status']) {
        try {
            const { data, error } = await supabase
                .from('rides')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', rideId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Update ride status error:', error);
            throw error;
        }
    }

    /**
     * Calculate fare estimate
     */
    async calculateFare(distance: number, duration: number, vehicleType: string = 'standard') {
        const baseFare = 5.00; // Base fare in TTD
        const perKmRate = vehicleType === 'premium' ? 12.00 : vehicleType === 'xl' ? 15.00 : 8.00;
        const perMinRate = 2.00;

        const fare = baseFare + (distance * perKmRate) + (duration * perMinRate);
        return Math.round(fare * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Get active rides for a user
     */
    async getUserRides(userId: string) {
        try {
            const { data, error } = await supabase
                .from('rides')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Get user rides error:', error);
            throw error;
        }
    }

    /**
     * Get active rides for a driver
     */
    async getDriverRides(driverId: string) {
        try {
            const { data, error } = await supabase
                .from('rides')
                .select('*')
                .eq('driver_id', driverId)
                .in('status', ['matched', 'accepted', 'in_progress'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Get driver rides error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time driver location updates
     */
    subscribeToDriverLocation(driverId: string, callback: (location: DriverLocation) => void) {
        return supabase
            .channel(`driver-location:${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'driver_locations',
                    filter: `driver_id=eq.${driverId}`,
                },
                (payload) => {
                    callback(payload.new as DriverLocation);
                }
            )
            .subscribe();
    }

    /**
     * Subscribe to ride status updates
     */
    subscribeToRideUpdates(rideId: string, callback: (ride: Ride) => void) {
        return supabase
            .channel(`ride:${rideId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'rides',
                    filter: `id=eq.${rideId}`,
                },
                (payload) => {
                    callback(payload.new as Ride);
                }
            )
            .subscribe();
    }
}

export const rideService = new RideService();
