import { supabase } from './supabaseClient';

export interface RealEstateListing {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    listing_type: 'sale' | 'rent';
    property_type: 'house' | 'apartment' | 'condo' | 'land' | 'commercial' | 'townhouse';
    status: 'active' | 'pending' | 'sold' | 'rented' | 'off_market';
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lot_size_sqft?: number;
    year_built?: number;
    address: string;
    city: string;
    region: string;
    latitude?: number;
    longitude?: number;
    agent_id?: string;
    agent_info?: any;
    created_at: string;
    images?: { url: string }[];
    features?: { feature_name: string }[];
    is_featured?: boolean;
}

export interface PropertyFilter {
    type?: 'rent' | 'buy';
    minPrice?: number;
    maxPrice?: number;
    beds?: number;
    baths?: number;
    propertyType?: string[];
    city?: string;
}

export const realEstateService = {
    // Fetch listings with filters
    getListings: async (filters: PropertyFilter = {}): Promise<RealEstateListing[]> => {
        let query = supabase
            .from('real_estate_listings')
            .select(`
                *,
                images:property_images(url),
                features:property_features(feature_name)
            `)
            .eq('status', 'active');

        if (filters.type) {
            query = query.eq('listing_type', filters.type === 'buy' ? 'sale' : 'rent');
        }
        if (filters.minPrice) {
            query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('price', filters.maxPrice);
        }
        if (filters.beds) {
            query = query.gte('bedrooms', filters.beds);
        }
        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.propertyType && filters.propertyType.length > 0) {
            query = query.in('property_type', filters.propertyType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching listings:', error);
            return [];
        }

        return data as RealEstateListing[];
    },

    // Get single listing details
    getListingById: async (id: string): Promise<RealEstateListing | null> => {
        const { data, error } = await supabase
            .from('real_estate_listings')
            .select(`
                *,
                images:property_images(url, caption, display_order),
                features:property_features(feature_name)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching listing:', error);
            return null;
        }

        return data as RealEstateListing;
    },

    // Create a new inquiry
    submitInquiry: async (inquiry: { listing_id: string; name: string; phone: string; message: string; email?: string }) => {
        const { error } = await supabase
            .from('property_inquiries')
            .insert([inquiry]);

        if (error) throw error;
        return true;
    },

    // Save property (Favorites)
    toggleFavorite: async (listingId: string, userId: string) => {
        // Check if already saved
        const { data: existing } = await supabase
            .from('saved_homes')
            .select('id')
            .eq('user_id', userId)
            .eq('listing_id', listingId)
            .single();

        if (existing) {
            // Remove
            await supabase.from('saved_homes').delete().eq('id', existing.id);
            return false; // Not saved anymore
        } else {
            // Add
            await supabase.from('saved_homes').insert([{ user_id: userId, listing_id: listingId }]);
            return true; // Saved
        }
    },

    // --- Agent / Owner Methods ---

    // Get listings for a specific user (Agent Dashboard)
    getMyListings: async (userId: string): Promise<RealEstateListing[]> => {
        const { data, error } = await supabase
            .from('real_estate_listings')
            .select(`
                *,
                images:property_images(url),
                inquiries:property_inquiries(count)
            `)
            .eq('agent_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching agent listings:', error);
            return [];
        }
        return data as RealEstateListing[];
    },

    // Create a new listing
    createListing: async (listingData: Partial<RealEstateListing>, images: string[], features: string[]) => {
        // 1. Insert Listing
        const { data: listing, error: listingError } = await supabase
            .from('real_estate_listings')
            .insert([listingData])
            .select()
            .single();

        if (listingError) throw listingError;

        // 2. Insert Images
        if (images.length > 0) {
            const imageInserts = images.map((url, index) => ({
                listing_id: listing.id,
                url: url,
                display_order: index
            }));
            await supabase.from('property_images').insert(imageInserts);
        }

        // 3. Insert Features
        if (features.length > 0) {
            const featureInserts = features.map(name => ({
                listing_id: listing.id,
                feature_name: name
            }));
            await supabase.from('property_features').insert(featureInserts);
        }

        return listing;
    },

    // Update a listing
    updateListing: async (id: string, updates: Partial<RealEstateListing>) => {
        const { error } = await supabase
            .from('real_estate_listings')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Delete a listing
    deleteListing: async (id: string) => {
        const { error } = await supabase
            .from('real_estate_listings')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get leads for an agent
    getAgentLeads: async (userId: string) => {
        // Get all listings for this agent first
        const { data: listings } = await supabase
            .from('real_estate_listings')
            .select('id, title')
            .eq('agent_id', userId);

        if (!listings || listings.length === 0) return [];

        const listingIds = listings.map(l => l.id);

        // Get inquiries for these listings
        const { data: inquiries, error } = await supabase
            .from('property_inquiries')
            .select(`
                *,
                listing:real_estate_listings(title)
            `)
            .in('listing_id', listingIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            return [];
        }

        return inquiries;
    }
};
