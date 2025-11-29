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
    status: 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
    price: number;
    created_at: string;
}

export const ridesService = {
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

    // SIMULATION: This would normally be handled by a backend worker or the driver's app
    async simulateDriverMatch(rideId: string) {
        // Wait 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Assign a "fake" driver (or the current user if testing)
        // For now, we just update the status to 'accepted'
        const { error } = await supabase
            .from('rides')
            .update({
                status: 'accepted',
                // In a real app, this would be a real driver's ID
                // driver_id: '...' 
            })
            .eq('id', rideId);

        if (error) console.error("Simulation error:", error);

        return { status: 'accepted', driver: { name: 'David R.', car: 'White Nissan Tiida', plate: 'PDE 4521', rating: 4.9 } };
    }
};
