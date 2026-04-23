/**
 * Trip Request Service for TriniBuild Rides
 * Handles ride requests, driver matching, pricing, and trip lifecycle
 */

import { supabase } from './supabase';
import { gpsTrackingService } from './gpsTrackingService';

export interface TripRequest {
  id: string;
  passengerId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  rideType: 'economy' | 'comfort' | 'xl';
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  status: 'searching' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  assignedDriverId?: string;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export class TripRequestService {
  /**
   * Create a new trip request
   */
  async requestRide(
    passengerId: string,
    pickupLat: number,
    pickupLng: number,
    pickupAddress: string,
    dropoffLat: number,
    dropoffLng: number,
    dropoffAddress: string,
    rideType: 'economy' | 'comfort' | 'xl' = 'economy'
  ): Promise<TripRequest | null> {
    try {
      // Calculate estimated fare and distance
      const eta = await gpsTrackingService.calculateETA(
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng
      );

      if (!eta) {
        console.error('Could not calculate ETA');
        return null;
      }

      const distance = eta.distance / 1000; // Convert to km
      const estimatedFare = this.calculateFare(distance, rideType);

      const { data, error } = await supabase
        .from('trips')
        .insert([
          {
            driver_id: null, // Will be assigned when driver accepts
            passenger_id: passengerId,
            pickup_location: `${pickupLat},${pickupLng}`,
            dropoff_location: `${dropoffLat},${dropoffLng}`,
            status: 'searching',
            fare: estimatedFare,
            distance_m: eta.distance,
            duration_minutes: eta.duration,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Failed to create trip request:', error);
        return null;
      }

      return {
        id: data.id,
        passengerId: data.passenger_id,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        rideType,
        estimatedFare,
        estimatedDistance: distance,
        estimatedDuration: eta.duration,
        status: 'searching',
        createdAt: new Date(data.created_at)
      };
    } catch (err) {
      console.error('Error requesting ride:', err);
      return null;
    }
  }

  /**
   * Cancel a trip request
   */
  async cancelRide(tripId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'cancelled' })
        .eq('id', tripId);

      if (error) {
        console.error('Failed to cancel ride:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error cancelling ride:', err);
      return false;
    }
  }

  /**
   * Find nearby available drivers
   */
  async findNearbyDrivers(
    pickupLat: number,
    pickupLng: number,
    radiusKm: number = 5
  ): Promise<
    Array<{
      driverId: string;
      latitude: number;
      longitude: number;
      rating: number;
      distanceKm: number;
    }>
  > {
    try {
      // Get all available drivers
      const { data: drivers, error } = await supabase
        .from('driver_locations')
        .select(`
          driver_id,
          latitude,
          longitude,
          driver_stats: driver_stats(avg_rating)
        `)
        .lt(
          'latitude',
          pickupLat + radiusKm / 111
        )
        .gt(
          'latitude',
          pickupLat - radiusKm / 111
        );

      if (error || !drivers) {
        console.error('Failed to get drivers:', error);
        return [];
      }

      // Filter by distance and sort by rating
      const nearbyDrivers = drivers
        .map((driver: any) => {
          const distance = gpsTrackingService.calculateDistance(
            driver.latitude,
            driver.longitude,
            pickupLat,
            pickupLng
          );

          return {
            driverId: driver.driver_id,
            latitude: driver.latitude,
            longitude: driver.longitude,
            rating: driver.driver_stats?.[0]?.avg_rating || 4.5,
            distanceKm: distance
          };
        })
        .filter((driver) => driver.distanceKm <= radiusKm)
        .sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);

      return nearbyDrivers;
    } catch (err) {
      console.error('Error finding drivers:', err);
      return [];
    }
  }

  /**
   * Offer ride to a specific driver
   */
  async offerRideToDriver(
    tripId: string,
    driverId: string
  ): Promise<boolean> {
    try {
      // Create a notification for the driver
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: driverId,
            type: 'ride_request',
            title: 'New Ride Request',
            message: 'A passenger is requesting a ride near you',
            data: { trip_id: tripId },
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Failed to send ride offer:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error offering ride:', err);
      return false;
    }
  }

  /**
   * Driver accepts a ride request
   */
  async acceptRide(tripId: string, driverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('trips')
        .update({
          driver_id: driverId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) {
        console.error('Failed to accept ride:', error);
        return false;
      }

      // Start GPS tracking for driver
      gpsTrackingService.startTracking(driverId);

      return true;
    } catch (err) {
      console.error('Error accepting ride:', err);
      return false;
    }
  }

  /**
   * Complete a trip
   */
  async completeTrip(
    tripId: string,
    passengerRating?: number,
    passengerNotes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status: 'completed',
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (passengerRating !== undefined) {
        updateData.rating_by_passenger = passengerRating;
      }

      if (passengerNotes) {
        updateData.passenger_notes = passengerNotes;
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId);

      if (error) {
        console.error('Failed to complete trip:', error);
        return false;
      }

      // Stop tracking
      gpsTrackingService.stopTracking();

      return true;
    } catch (err) {
      console.error('Error completing trip:', err);
      return false;
    }
  }

  /**
   * Get passenger's active trip
   */
  async getActiveTrip(passengerId: string): Promise<TripRequest | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('passenger_id', passengerId)
        .in('status', ['searching', 'accepted', 'arriving', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const [pickupLat, pickupLng] = data.pickup_location.split(',');
      const [dropoffLat, dropoffLng] = data.dropoff_location.split(',');

      return {
        id: data.id,
        passengerId: data.passenger_id,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress: '',
        dropoffLat: parseFloat(dropoffLat),
        dropoffLng: parseFloat(dropoffLng),
        dropoffAddress: '',
        rideType: 'economy',
        estimatedFare: data.fare,
        estimatedDistance: data.distance_m / 1000,
        estimatedDuration: data.duration_minutes,
        status: data.status,
        assignedDriverId: data.driver_id,
        createdAt: new Date(data.created_at),
        acceptedAt: data.start_time ? new Date(data.start_time) : undefined,
        completedAt: data.end_time ? new Date(data.end_time) : undefined
      };
    } catch (err) {
      console.error('Error getting active trip:', err);
      return null;
    }
  }

  /**
   * Get driver's current trip
   */
  async getDriverActiveTrip(driverId: string): Promise<TripRequest | null> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['accepted', 'arriving', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const [pickupLat, pickupLng] = data.pickup_location.split(',');
      const [dropoffLat, dropoffLng] = data.dropoff_location.split(',');

      return {
        id: data.id,
        passengerId: data.passenger_id,
        pickupLat: parseFloat(pickupLat),
        pickupLng: parseFloat(pickupLng),
        pickupAddress: '',
        dropoffLat: parseFloat(dropoffLat),
        dropoffLng: parseFloat(dropoffLng),
        dropoffAddress: '',
        rideType: 'economy',
        estimatedFare: data.fare,
        estimatedDistance: data.distance_m / 1000,
        estimatedDuration: data.duration_minutes,
        status: data.status,
        assignedDriverId: data.driver_id,
        createdAt: new Date(data.created_at),
        acceptedAt: data.start_time ? new Date(data.start_time) : undefined
      };
    } catch (err) {
      console.error('Error getting driver trip:', err);
      return null;
    }
  }

  /**
   * Calculate fare based on distance and ride type
   */
  private calculateFare(distanceKm: number, rideType: string): number {
    // Trinidad pricing (TTD currency)
    const baseFare = {
      economy: 50, // TT$50 base
      comfort: 75, // TT$75 base
      xl: 100 // TT$100 base
    };

    const perKmRate = {
      economy: 8, // TT$8/km
      comfort: 12, // TT$12/km
      xl: 15 // TT$15/km
    };

    const base = baseFare[rideType as keyof typeof baseFare] || 50;
    const perKm = perKmRate[rideType as keyof typeof perKmRate] || 8;

    return Math.round(base + distanceKm * perKm);
  }

  /**
   * Subscribe to trip updates
   */
  subscribeTripUpdates(
    tripId: string,
    onUpdate: (trip: any) => void
  ) {
    const subscription = supabase
      .from('trips')
      .on('*', (payload) => {
        if (payload.new && payload.new.id === tripId) {
          onUpdate(payload.new);
        }
      })
      .subscribe();

    return subscription;
  }
}

// Export singleton
export const tripRequestService = new TripRequestService();
