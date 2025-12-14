import { supabase } from './supabaseClient';

export interface ClassifiedListing {
    id: string;
    user_id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    location: string;
    images: string[];
    contact_info: {
        phone?: string;
        whatsapp?: string;
        email?: string;
    };
    status: 'active' | 'sold' | 'archived';
    promoted: boolean;
    created_at: string;
}

export const classifiedService = {
    // Get all active listings (with optional filters)
    getListings: async (category?: string, searchTerm?: string) => {
        let query = supabase
            .from('classified_listings')
            .select('*')
            .eq('status', 'active')
            .order('promoted', { ascending: false }) // Promoted first
            .order('created_at', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error fetching classifieds:', error);
            return [];
        }
        return data as ClassifiedListing[];
    },

    // Create a new listing
    createListing: async (listing: Partial<ClassifiedListing>, images: File[]) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to post');

        // 1. Upload Images
        const imageUrls: string[] = [];
        for (const file of images) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('classified-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('classified-images')
                .getPublicUrl(filePath);

            imageUrls.push(publicUrl);
        }

        // 2. Insert Listing
        const { data, error } = await supabase
            .from('classified_listings')
            .insert({
                user_id: user.id,
                title: listing.title,
                description: listing.description,
                price: listing.price,
                category: listing.category,
                location: listing.location,
                contact_info: listing.contact_info,
                images: imageUrls,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
