import { supabase } from './supabaseClient';

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    rating: number;
    totalReviews: number;
    storeId?: string;
}

export interface Store {
    id: string;
    businessName: string;
    description: string;
    logo: string;
    bannerImage: string;
    whatsapp: string;
    location: string;
    products: Product[];
    rating: number;
    totalReviews: number;
    ownerId?: string;
}

export const storeService = {
    // Get a store by its ID
    getStoreById: async (id: string): Promise<Store | null> => {
        const { data: storeData, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching store:', error);
            return null;
        }

        return mapStoreFromDb(storeData);
    },

    // Get the current user's store
    getMyStore: async (): Promise<Store | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: storeData, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*)
            `)
            .eq('owner_id', user.id)
            .single();

        if (error) {
            // It's okay if no store found, user might be new
            return null;
        }

        return mapStoreFromDb(storeData);
    },

    // Get all stores (for the directory)
    getAllStores: async (): Promise<Store[]> => {
        const { data: stores, error } = await supabase
            .from('stores')
            .select('*')
            .eq('status', 'active');

        if (error) {
            console.error('Error fetching stores:', error);
            return [];
        }

        return stores.map(mapStoreFromDb);
    },

    // Get featured products across the platform
    getFeaturedProducts: async (): Promise<Product[]> => {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('status', 'active')
            .limit(10);

        if (error) {
            console.error('Error fetching featured products:', error);
            return [];
        }

        return products.map(mapProductFromDb);
    },

    // Create a new store
    createStore: async (storeData: Partial<Store>): Promise<Store | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('stores')
            .insert({
                owner_id: user.id,
                name: storeData.businessName,
                description: storeData.description,
                location: storeData.location,
                whatsapp: storeData.whatsapp,
                category: 'General', // Default or pass in
                status: 'active' // Auto-activate for now
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating store:', error);
            return null;
        }

        return mapStoreFromDb(data);
    },

    // Add a product to a store
    addProduct: async (storeId: string, productData: Partial<Product>): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .insert({
                store_id: storeId,
                name: productData.title,
                description: productData.description,
                price: productData.price,
                stock: 100, // Default
                image_url: productData.images?.[0] || '',
                category: productData.category || 'General',
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding product:', error);
            return null;
        }

        return mapProductFromDb(data);
    },

    // Update a product
    updateProduct: async (productId: string, productData: Partial<Product>): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: productData.title,
                description: productData.description,
                price: productData.price,
                image_url: productData.images?.[0],
                category: productData.category,
                status: 'active' // or pass in status
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            return null;
        }

        return mapProductFromDb(data);
    },

    // Delete a product
    deleteProduct: async (productId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            console.error('Error deleting product:', error);
            return false;
        }

        return true;
    }
};

// Helpers to map DB snake_case to App camelCase
const mapStoreFromDb = (dbStore: any): Store => ({
    id: dbStore.id,
    businessName: dbStore.name,
    description: dbStore.description || '',
    logo: dbStore.logo_url || 'https://via.placeholder.com/150',
    bannerImage: dbStore.banner_url || 'https://via.placeholder.com/800x200',
    whatsapp: dbStore.whatsapp || '',
    location: dbStore.location || '',
    products: dbStore.products ? dbStore.products.map(mapProductFromDb) : [],
    rating: 4.5, // Mock for now
    totalReviews: 0,
    ownerId: dbStore.owner_id
});

const mapProductFromDb = (dbProduct: any): Product => ({
    id: dbProduct.id,
    title: dbProduct.name,
    description: dbProduct.description || '',
    price: dbProduct.price,
    images: dbProduct.image_url ? [dbProduct.image_url] : [],
    category: dbProduct.category || 'General',
    rating: 0,
    totalReviews: 0,
    storeId: dbProduct.store_id
});
