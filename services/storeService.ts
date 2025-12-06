import { supabase } from './supabaseClient';
import { Store, Product, ProductVariant, Collection, Order, OrderItem } from '../types';

export type { Store } from '../types';

export const storeService = {
    // --- STORE MANAGEMENT ---

    // Get a store by its ID (public or private)
    getStoreById: async (id: string): Promise<Store | null> => {
        const { data, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*),
                logo:logos(*),
                theme:themes(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching store:', error);
            return null;
        }
        return data as Store;
    },

    // Get a store by its slug (public storefront)
    getStoreBySlug: async (slug: string): Promise<Store | null> => {
        const { data, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*),
                logo:logos(*),
                theme:themes(*)
            `)
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Error fetching store by slug:', error);
            return null;
        }
        return data as Store;
    },

    // Get the current user's store (dashboard)
    getMyStore: async (): Promise<Store | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*),
                logo:logos(*),
                theme:themes(*)
            `)
            .eq('owner_id', user.id)
            .single();

        if (error) return null;
        return data as Store;
    },

    // Create a new store
    createStore: async (storeData: Partial<Store>): Promise<Store | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Auto-generate slug from name if not provided
        const slug = storeData.slug || storeData.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

        const { data, error } = await supabase
            .from('stores')
            .insert({
                owner_id: user.id,
                name: storeData.name,
                slug: slug,
                description: storeData.description,
                location: storeData.location,
                whatsapp: storeData.whatsapp,
                category: storeData.category || 'General',
                status: 'active' // Default to active for MVP
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating store:', error);
            throw error;
        }
        return data as Store;
    },

    // Update store settings
    updateStore: async (storeId: string, updates: Partial<Store>): Promise<Store | null> => {
        const { data, error } = await supabase
            .from('stores')
            .update(updates)
            .eq('id', storeId)
            .select()
            .single();

        if (error) {
            console.error('Error updating store:', error);
            throw error;
        }
        return data as Store;
    },

    // --- PRODUCT MANAGEMENT ---

    getProducts: async (storeId: string): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .eq('store_id', storeId);

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return data as Product[];
    },

    getProductById: async (productId: string): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .select('*, variants:product_variants(*)')
            .eq('id', productId)
            .single();

        if (error) return null;
        return data as Product;
    },

    addProduct: async (storeId: string, productData: Partial<Product>): Promise<Product | null> => {
        const slug = productData.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

        const { data, error } = await supabase
            .from('products')
            .insert({
                store_id: storeId,
                name: productData.name,
                slug: slug,
                description: productData.description,
                base_price: productData.base_price,
                image_url: productData.image_url,
                category: productData.category,
                status: productData.status || 'active',
                stock: productData.stock || 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding product:', error);
            throw error;
        }
        return data as Product;
    },

    updateProduct: async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', productId)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            throw error;
        }
        return data as Product;
    },

    deleteProduct: async (productId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) return false;
        return true;
    },

    // --- ORDER MANAGEMENT ---

    createOrder: async (orderData: Partial<Order>, items: Partial<OrderItem>[]): Promise<Order | null> => {
        // 1. Create Order Record
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (orderError || !order) {
            console.error('Error creating order:', orderError);
            throw orderError;
        }

        // 2. Create Order Items
        const itemsWithOrderId = items.map(item => ({
            ...item,
            order_id: order.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);

        if (itemsError) {
            console.error('Error creating order items:', itemsError);
            // Ideally rollback order here, but for MVP we log it
        }

        return order as Order;
    },

    getStoreOrders: async (storeId: string): Promise<Order[]> => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                items:order_items(*)
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        return data as Order[];
    }
};
