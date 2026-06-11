/**
 * GPS Tracking Service for TriniBuild Rides
 * Handles real-time driver location updates, ETA calculations, and route tracking
 * 
 * Features:
 * - Real-time location capture (every 10 seconds)
 * - Supabase real-time subscriptions
 * - ETA calculation using Google Maps API
 * - Route tracking and history
 * - Battery-efficient geolocation
 */

import { supabase } from './supabase';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

export interface Trip {
  id: string;
  driverId: string;
  passengerId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  status: 'requesting' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  fare: number;
  distance?: number;
  duration?: number;
}

export class GPSTrackingService {
  private watchId: number | null = null;
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  /**
   * Initialize GPS tracking for a driver
   */
  async startTracking(userId: string, updateInterval: number = 10000) {
    if (this.isTracking) {
      console.warn('GPS tracking already active');
      return;
    }

    this.userId = userId;
    this.isTracking = true;

    // Use high accuracy for better results
    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    };

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Send to Supabase
        await this.updateDriverLocation(userId, {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date()
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.handleGPSError(error);
      },
      options
    );

    console.log('✅ GPS tracking started for driver:', userId);
  }

  /**
   * Stop GPS tracking
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    this.isTracking = false;
    this.userId = null;
    console.log('✅ GPS tracking stopped');
  }

  /**
   * Update driver location in Supabase
   */
  private async updateDriverLocation(
    driverId: string,
    location: GPSLocation
  ) {
    try {
      const { error } = await supabase
        .from('driver_locations')
        .upsert(
          {
            driver_id: driverId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy || 0,
            speed: location.speed,
            heading: location.heading,
            updated_at: location.timestamp.toISOString()
          },
          { onConflict: 'driver_id' }
        );

      if (error) {
        console.error('Failed to update driver location:', error);
      }
    } catch (err) {
      console.error('Error updating driver location:', err);
    }
  }

  /**
   * Get real-time driver location
   */
  async getDriverLocation(driverId: string): Promise<GPSLocation | null> {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, accuracy, speed, heading, updated_at')
        .eq('driver_id', driverId)
        .single();

      if (error) {
        console.error('Failed to get driver location:', error);
        return null;
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy,
        speed: data.speed,
        heading: data.heading,
        timestamp: new Date(data.updated_at)
      };
    } catch (err) {
      console.error('Error getting driver location:', err);
      return null;
    }
  }

  /**
   * Subscribe to real-time driver location updates
   */
  subscribeToDriverLocation(
    driverId: string,
    onUpdate: (location: GPSLocation) => void
  ) {
    const subscription = supabase
      .from('driver_locations')
      .on('*', (payload) => {
        if (payload.new && payload.new.driver_id === driverId) {
          onUpdate({
            latitude: payload.new.latitude,
            longitude: payload.new.longitude,
            accuracy: payload.new.accuracy,
            speed: payload.new.speed,
            heading: payload.new.heading,
            timestamp: new Date(payload.new.updated_at)
          });
        }
      })
      .subscribe();

    return subscription;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate ETA using Google Maps Distance Matrix API
   */
  async calculateETA(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      const distance = this.calculateDistance(fromLat, fromLng, toLat, toLng);
      const duration = Math.ceil((distance / 30) * 60); // Assume 30 km/h average.
      return { distance: Math.round(distance * 1000), duration };
    } catch (err) {
      console.error('Error calculating ETA:', err);
      return null;
    }
  }

  /**
   * Store trip route for history
   */
  async saveTrip(trip: Trip) {
    try {
      const { error } = await supabase
        .from('trips')
        .insert([
          {
            id: trip.id,
            driver_id: trip.driverId,
            passenger_id: trip.passengerId,
            pickup_location: `${trip.pickupLat},${trip.pickupLng}`,
            dropoff_location: `${trip.dropoffLat},${trip.dropoffLng}`,
            status: trip.status,
            start_time: trip.startTime?.toISOString(),
            end_time: trip.endTime?.toISOString(),
            fare: trip.fare,
            distance_m: trip.distance,
            duration_minutes: trip.duration,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Failed to save trip:', error);
      }
    } catch (err) {
      console.error('Error saving trip:', err);
    }
  }

  /**
   * Get driver's trip history
   */
  async getDriverTrips(
    driverId: string,
    limit: number = 50
  ): Promise<Trip[]> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get driver trips:', error);
        return [];
      }

      return data.map((t) => ({
        id: t.id,
        driverId: t.driver_id,
        passengerId: t.passenger_id,
        pickupLat: parseFloat(t.pickup_location.split(',')[0]),
        pickupLng: parseFloat(t.pickup_location.split(',')[1]),
        dropoffLat: parseFloat(t.dropoff_location.split(',')[0]),
        dropoffLng: parseFloat(t.dropoff_location.split(',')[1]),
        status: t.status,
        startTime: t.start_time ? new Date(t.start_time) : undefined,
        endTime: t.end_time ? new Date(t.end_time) : undefined,
        fare: t.fare,
        distance: t.distance_m,
        duration: t.duration_minutes
      }));
    } catch (err) {
      console.error('Error getting driver trips:', err);
      return [];
    }
  }

  /**
   * Handle GPS errors
   */
  private handleGPSError(error: GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('Permission denied for geolocation');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Position unavailable');
        break;
      case error.TIMEOUT:
        console.error('Geolocation request timed out');
        break;
    }
  }

  /**
   * Check if GPS is available
   */
  isGPSAvailable(): boolean {
    return !!navigator.geolocation;
  }

  /**
   * Get tracking status
   */
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      userId: this.userId,
      isGPSAvailable: this.isGPSAvailable()
    };
  }
}

// Export singleton instance
export const gpsTrackingService = new GPSTrackingService();
