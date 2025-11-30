import { supabase } from './supabaseClient';

export interface Ride {
    id: string;
    passenger_id: string;
    driver_id?: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    status: 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
    price: number;
    driver_lat?: number;
    driver_lng?: number;
    driver_name?: string;
    driver_car?: string;
    driver_plate?: string;
    driver_rating?: number;
    created_at: string;
    accepted_at?: string;
    started_at?: string;
    completed_at?: string;
}

export const ridesService = {
    async requestRide(ride: Partial<Ride>) {
        const { data, error } = await supabase
            .from('rides')
            .insert(ride)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getRide(rideId: string) {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('id', rideId)
            .single();

        if (error) throw error;
        return data;
    },

    async cancelRide(rideId: string) {
        const { error } = await supabase
            .from('rides')
            .update({ status: 'cancelled' })
            .eq('id', rideId);

        if (error) throw error;
    },

    // Subscribe to ride updates (Realtime)
    subscribeToRide(rideId: string, onUpdate: (ride: Ride) => void) {
        return supabase
            .channel(`ride:${rideId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
                (payload) => onUpdate(payload.new as Ride)
            )
            .subscribe();
    },

    // Driver Methods
    async getAvailableRides() {
        const { data, error } = await supabase
            .from('rides')
            .select('*')
            .eq('status', 'searching')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Ride[];
    },

    async acceptRide(rideId: string, driverId: string, driverName: string, driverCar: string, driverPlate: string) {
        const { data, error } = await supabase
            .from('rides')
            .update({
                status: 'accepted',
                driver_id: driverId,
                driver_name: driverName,
                driver_car: driverCar,
                driver_plate: driverPlate,
                accepted_at: new Date().toISOString()
            })
            .eq('id', rideId)
            .select()
            .single();

        if (error) throw error;
        return data as Ride;
    },

    async updateRideStatus(rideId: string, status: 'arrived' | 'in_progress' | 'completed') {
        const updates: any = { status };
        if (status === 'in_progress') updates.started_at = new Date().toISOString();
        if (status === 'completed') updates.completed_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('rides')
            .update(updates)
            .eq('id', rideId)
            .select()
            .single();

        if (error) throw error;
        return data as Ride;
    },

    // Subscribe to NEW rides (for drivers to see requests come in)
    subscribeToNewRides(onNewRide: (ride: Ride) => void) {
        return supabase
            .channel('public:rides')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.searching' },
                (payload) => onNewRide(payload.new as Ride)
            )
            .subscribe();
    }
};
