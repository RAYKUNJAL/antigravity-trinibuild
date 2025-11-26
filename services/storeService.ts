import { get } from './apiClient';

export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    rating: number;
    totalReviews: number;
}

export interface Store {
    id: string;
    businessName: string;
    description: string;
    logo: string;
    bannerImage: string;
    whatsapp: string; // Critical for COD/Communication
    location: string; // Critical for COD/Pickup
    products: Product[];
    rating: number;
    totalReviews: number;
}

export const storeService = {
    // Get a store by its ID (or slug if you prefer)
    getStoreById: async (id: string): Promise<Store> => {
        return await get<Store>(`/vendors/${id}`);
    },

    // Get all stores (for the directory)
    getAllStores: async (): Promise<Store[]> => {
        return await get<Store[]>('/vendors');
    },

    // Get featured products across the platform (for landing pages)
    getFeaturedProducts: async (): Promise<Product[]> => {
        return await get<Product[]>('/products/featured');
    }
};
