/**
 * TriniBuild AI Location Map Layer
 * Key: island_map
 * 
 * Interactive location-aware map system for Trinidad & Tobago
 * with AI-powered location detection, routing, and discovery.
 */

import { supabase } from './supabaseClient';
import { TRINIDAD_LOCATIONS, TrinidadLocation } from '../data/trinidadLocations';

// ============================================
// TYPES
// ============================================

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export type MarkerType =
    | 'job'
    | 'property'
    | 'event'
    | 'store'
    | 'service'
    | 'ride_pickup'
    | 'ride_dropoff'
    | 'user';

export interface MapMarker {
    id: string;
    type: MarkerType;
    position: Coordinates;
    title: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    url?: string;
    data?: Record<string, unknown>;
}

export interface MapCluster {
    id: string;
    position: Coordinates;
    count: number;
    markers: MapMarker[];
    type?: MarkerType;
}

export interface LocationSearchResult {
    location: TrinidadLocation;
    distance_km?: number;
    listings_count: number;
    jobs_count: number;
    properties_count: number;
}

export interface RouteInfo {
    origin: Coordinates;
    destination: Coordinates;
    distance_km: number;
    duration_minutes: number;
    route_points: Coordinates[];
    fare_estimate?: number;
}

export interface GeoArea {
    slug: string;
    name: string;
    type: 'region' | 'city' | 'town' | 'village';
    center: Coordinates;
    bounds: MapBounds;
    population?: number;
    parent_region?: string;
}

// ============================================
// TRINIDAD & TOBAGO MAP DATA
// ============================================

// Center of Trinidad
const TT_CENTER: Coordinates = { lat: 10.4971, lng: -61.3152 };

// Map bounds for Trinidad & Tobago
const TT_BOUNDS: MapBounds = {
    north: 11.3500,  // Tobago north
    south: 10.0333,  // Trinidad south point
    east: -60.5000,  // Tobago east
    west: -61.9333   // Trinidad west
};

// Major regions with coordinates
const TT_REGIONS: GeoArea[] = [
    { slug: 'port-of-spain', name: 'Port of Spain', type: 'city', center: { lat: 10.6596, lng: -61.5086 }, bounds: { north: 10.70, south: 10.63, east: -61.48, west: -61.56 }, population: 37000 },
    { slug: 'san-fernando', name: 'San Fernando', type: 'city', center: { lat: 10.2799, lng: -61.4681 }, bounds: { north: 10.30, south: 10.25, east: -61.44, west: -61.50 }, population: 50000 },
    { slug: 'chaguanas', name: 'Chaguanas', type: 'city', center: { lat: 10.5167, lng: -61.4000 }, bounds: { north: 10.55, south: 10.48, east: -61.36, west: -61.44 }, population: 84000 },
    { slug: 'arima', name: 'Arima', type: 'city', center: { lat: 10.6333, lng: -61.2833 }, bounds: { north: 10.66, south: 10.60, east: -61.25, west: -61.32 }, population: 35000 },
    { slug: 'scarborough', name: 'Scarborough', type: 'city', center: { lat: 11.1811, lng: -60.7356 }, bounds: { north: 11.21, south: 11.15, east: -60.70, west: -60.78 }, population: 17500 },
    { slug: 'diego-martin', name: 'Diego Martin', type: 'town', center: { lat: 10.7050, lng: -61.5750 }, bounds: { north: 10.73, south: 10.68, east: -61.54, west: -61.61 }, population: 105000 },
    { slug: 'tunapuna', name: 'Tunapuna', type: 'town', center: { lat: 10.6428, lng: -61.3868 }, bounds: { north: 10.67, south: 10.62, east: -61.36, west: -61.42 }, population: 17800 },
    { slug: 'marabella', name: 'Marabella', type: 'town', center: { lat: 10.3044, lng: -61.4467 }, bounds: { north: 10.33, south: 10.28, east: -61.42, west: -61.48 }, population: 26700 },
    { slug: 'couva', name: 'Couva', type: 'town', center: { lat: 10.4167, lng: -61.4667 }, bounds: { north: 10.44, south: 10.39, east: -61.44, west: -61.50 }, population: 30000 },
    { slug: 'san-juan', name: 'San Juan', type: 'town', center: { lat: 10.6886, lng: -61.4508 }, bounds: { north: 10.72, south: 10.66, east: -61.42, west: -61.49 }, population: 52000 },
    { slug: 'point-fortin', name: 'Point Fortin', type: 'town', center: { lat: 10.1797, lng: -61.6797 }, bounds: { north: 10.21, south: 10.15, east: -61.65, west: -61.71 }, population: 20000 },
    { slug: 'sangre-grande', name: 'Sangre Grande', type: 'town', center: { lat: 10.5869, lng: -61.1300 }, bounds: { north: 10.62, south: 10.55, east: -61.10, west: -61.16 }, population: 16000 },
    { slug: 'penal', name: 'Penal', type: 'town', center: { lat: 10.1597, lng: -61.4706 }, bounds: { north: 10.19, south: 10.13, east: -61.44, west: -61.50 }, population: 15000 },
    { slug: 'siparia', name: 'Siparia', type: 'town', center: { lat: 10.1408, lng: -61.5039 }, bounds: { north: 10.17, south: 10.11, east: -61.47, west: -61.54 }, population: 10000 }
];

// ============================================
// MAP SERVICE
// ============================================

class IslandMapService {
    /**
     * Get center of T&T
     */
    getCenter(): Coordinates {
        return TT_CENTER;
    }

    /**
     * Get T&T bounds
     */
    getBounds(): MapBounds {
        return TT_BOUNDS;
    }

    /**
     * Get all regions
     */
    getRegions(): GeoArea[] {
        return TT_REGIONS;
    }

    /**
     * Get region by slug
     */
    getRegion(slug: string): GeoArea | undefined {
        return TT_REGIONS.find(r => r.slug === slug);
    }

    /**
     * Get nearest location to coordinates
     */
    getNearestLocation(coords: Coordinates): TrinidadLocation | null {
        let nearest: TrinidadLocation | null = null;
        let minDistance = Infinity;

        for (const location of TRINIDAD_LOCATIONS) {
            // Use approximate coordinates based on known data
            const locCoords = this.getLocationCoordinates(location.slug);
            if (locCoords) {
                const distance = this.calculateDistance(coords, locCoords);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = location;
                }
            }
        }

        return nearest;
    }

    /**
     * Get coordinates for a location slug
     */
    getLocationCoordinates(slug: string): Coordinates | null {
        const region = TT_REGIONS.find(r => r.slug === slug);
        if (region) return region.center;

        // Fallback to location data
        const location = TRINIDAD_LOCATIONS.find(l => l.slug === slug);
        if (location) {
            // Approximate based on region
            const parent = TT_REGIONS.find(r =>
                location.name.toLowerCase().includes(r.name.toLowerCase())
            );
            if (parent) return parent.center;
        }

        return null;
    }

    /**
     * Calculate distance between two points (km)
     */
    calculateDistance(from: Coordinates, to: Coordinates): number {
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(to.lat - from.lat);
        const dLng = this.toRad(to.lng - from.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(from.lat)) * Math.cos(this.toRad(to.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * Math.PI / 180;
    }

    /**
     * Estimate route between two points
     */
    estimateRoute(from: Coordinates, to: Coordinates): RouteInfo {
        const distance = this.calculateDistance(from, to);

        // Estimate duration (average 30 km/h in T&T traffic)
        const durationMinutes = Math.ceil(distance / 30 * 60);

        // Simple straight-line route for now
        const routePoints = [from, to];

        // Estimate fare (base TTD 15 + TTD 3/km)
        const fareEstimate = Math.ceil(15 + distance * 3);

        return {
            origin: from,
            destination: to,
            distance_km: Math.round(distance * 10) / 10,
            duration_minutes: durationMinutes,
            route_points: routePoints,
            fare_estimate: fareEstimate
        };
    }

    /**
     * Check if coordinates are within T&T
     */
    isInTT(coords: Coordinates): boolean {
        return (
            coords.lat >= TT_BOUNDS.south &&
            coords.lat <= TT_BOUNDS.north &&
            coords.lng >= TT_BOUNDS.west &&
            coords.lng <= TT_BOUNDS.east
        );
    }

    /**
     * Check if coordinates are in Trinidad (vs Tobago)
     */
    isInTrinidad(coords: Coordinates): boolean {
        // Tobago is roughly north of 11.0 lat
        return coords.lat < 11.0;
    }

    /**
     * Get markers for listings in a region
     */
    async getMarkersForRegion(
        regionSlug: string,
        types: MarkerType[] = ['property', 'job', 'event', 'store']
    ): Promise<MapMarker[]> {
        const markers: MapMarker[] = [];
        const region = this.getRegion(regionSlug);
        if (!region) return markers;

        // Get properties
        if (types.includes('property')) {
            const { data: properties } = await supabase
                .from('real_estate_listings')
                .select('id, title, location, price')
                .ilike('location', `%${region.name}%`)
                .eq('status', 'active')
                .limit(50);

            if (properties) {
                for (const p of properties) {
                    markers.push({
                        id: p.id,
                        type: 'property',
                        position: this.jitterPosition(region.center),
                        title: p.title,
                        subtitle: `$${p.price?.toLocaleString()}/mo`,
                        icon: 'home',
                        color: '#F97316',
                        url: `/real-estate/${p.id}`
                    });
                }
            }
        }

        // Get jobs
        if (types.includes('job')) {
            const { data: jobs } = await supabase
                .from('jobs')
                .select('id, title, company_name, location')
                .ilike('location', `%${region.name}%`)
                .eq('status', 'open')
                .limit(50);

            if (jobs) {
                for (const j of jobs) {
                    markers.push({
                        id: j.id,
                        type: 'job',
                        position: this.jitterPosition(region.center),
                        title: j.title,
                        subtitle: j.company_name,
                        icon: 'briefcase',
                        color: '#3B82F6',
                        url: `/jobs/${j.id}`
                    });
                }
            }
        }

        // Get events
        if (types.includes('event')) {
            const { data: events } = await supabase
                .from('events')
                .select('id, title, venue, event_date')
                .ilike('venue', `%${region.name}%`)
                .gte('event_date', new Date().toISOString())
                .limit(50);

            if (events) {
                for (const e of events) {
                    markers.push({
                        id: e.id,
                        type: 'event',
                        position: this.jitterPosition(region.center),
                        title: e.title,
                        subtitle: new Date(e.event_date).toLocaleDateString(),
                        icon: 'ticket',
                        color: '#8B5CF6',
                        url: `/tickets/${e.id}`
                    });
                }
            }
        }

        return markers;
    }

    /**
     * Add slight random offset to avoid marker overlap
     */
    private jitterPosition(coords: Coordinates): Coordinates {
        const jitter = 0.005; // ~500m
        return {
            lat: coords.lat + (Math.random() - 0.5) * jitter,
            lng: coords.lng + (Math.random() - 0.5) * jitter
        };
    }

    /**
     * Cluster markers
     */
    clusterMarkers(markers: MapMarker[], zoomLevel: number): (MapMarker | MapCluster)[] {
        if (zoomLevel > 12 || markers.length < 10) {
            return markers;
        }

        const clusterRadius = 0.05 * Math.pow(2, 12 - zoomLevel);
        const clusters: MapCluster[] = [];
        const processed = new Set<string>();

        for (const marker of markers) {
            if (processed.has(marker.id)) continue;

            const nearby = markers.filter(m =>
                !processed.has(m.id) &&
                this.calculateDistance(marker.position, m.position) < clusterRadius * 111
            );

            if (nearby.length >= 3) {
                for (const m of nearby) processed.add(m.id);

                clusters.push({
                    id: `cluster_${marker.id}`,
                    position: this.getCentroid(nearby.map(m => m.position)),
                    count: nearby.length,
                    markers: nearby,
                    type: this.getMostCommonType(nearby)
                });
            } else {
                processed.add(marker.id);
                clusters.push(marker as any);
            }
        }

        return clusters;
    }

    private getCentroid(positions: Coordinates[]): Coordinates {
        const sum = positions.reduce(
            (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
            { lat: 0, lng: 0 }
        );
        return { lat: sum.lat / positions.length, lng: sum.lng / positions.length };
    }

    private getMostCommonType(markers: MapMarker[]): MarkerType {
        const counts = new Map<MarkerType, number>();
        for (const m of markers) {
            counts.set(m.type, (counts.get(m.type) || 0) + 1);
        }
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'property';
    }

    /**
     * Get user's current location
     */
    async getCurrentLocation(): Promise<Coordinates | null> {
        if (!navigator.geolocation) return null;

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 5000 }
            );
        });
    }

    /**
     * Search locations by query
     */
    searchLocations(query: string): LocationSearchResult[] {
        const q = query.toLowerCase();

        return TRINIDAD_LOCATIONS
            .filter(loc =>
                loc.name.toLowerCase().includes(q) ||
                loc.slug.includes(q)
            )
            .slice(0, 10)
            .map(location => ({
                location,
                listings_count: 0, // Would fetch from DB
                jobs_count: 0,
                properties_count: 0
            }));
    }

    /**
     * Get popular areas with activity counts
     */
    async getPopularAreas(limit = 10): Promise<{ region: GeoArea; activity_count: number }[]> {
        // In production, would aggregate from actual data
        return TT_REGIONS
            .slice(0, limit)
            .map(region => ({
                region,
                activity_count: Math.floor(Math.random() * 100) + 10
            }))
            .sort((a, b) => b.activity_count - a.activity_count);
    }
}

// ============================================
// SINGLETON & EXPORTS
// ============================================

export const islandMapService = new IslandMapService();

export const TT_MAP_CONFIG = {
    center: TT_CENTER,
    bounds: TT_BOUNDS,
    defaultZoom: 10,
    maxZoom: 18,
    minZoom: 8
};

export default islandMapService;
