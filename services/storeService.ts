import { supabase } from './supabaseClient';
import { Store, Product, Order, OrderItem } from '../types';

export type { Store } from '../types';

// Extended types for service layer
interface CreateStoreData extends Partial<Store> {
    theme_config?: Record<string, any>;
    tagline?: string;
    logo_style?: string;
    vibe?: string[];
    operating_hours?: Record<string, any>;
    delivery_options?: string[];
    payment_methods?: string[];
    font_pair?: Record<string, string>;
    color_scheme?: Record<string, string>;
    social_links?: Record<string, string>;
    plan_id?: string;
}

interface CreateProductData {
    name?: string;
    description?: string | null;
    base_price?: number;
    stock?: number;
    category?: string;
    image_url?: string;
    status?: string;
    seo?: any;
}

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

    // Get all active stores (public directory)
    getAllStores: async (): Promise<any[]> => {
        const { data, error } = await supabase
            .from('stores')
            .select(`
                id,
                name,
                slug,
                description,
                location,
                category,
                logo_url,
                owner_id
            `)
            .eq('status', 'active')
            .limit(100);

        if (error) {
            console.error('Error fetching all stores:', error);
            return [];
        }

        // Map to ensure shape matches what's expected by directory
        return data.map(store => ({
            id: 'store-' + store.id,
            businessName: store.name,
            description: store.description,
            address: store.location,
            category: store.category,
            logoUrl: store.logo_url
        }));
    },

    // Validate discount code
    validateDiscount: async (storeId: string, code: string, subtotal: number): Promise<{ valid: boolean; discount?: number; type?: string; error?: string }> => {
        const { data: store, error } = await supabase
            .from('stores')
            .select('settings')
            .eq('id', storeId)
            .single();

        if (error || !store) return { valid: false, error: 'Store not found' };

        const settings = store.settings as any;
        const discounts = settings?.marketing?.discounts || [];

        const discount = discounts.find((d: any) => d.code === code && d.active);

        if (!discount) return { valid: false, error: 'Invalid or inactive code' };

        if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
            return { valid: false, error: 'Code expired' };
        }

        let amount = 0;
        if (discount.type === 'percentage') {
            amount = (subtotal * discount.value) / 100;
        } else {
            amount = discount.value;
        }

        if (amount > subtotal) amount = subtotal;

        return { valid: true, discount: amount, type: discount.type };
    },

    // Create a new store
    createStore: async (storeData: CreateStoreData): Promise<Store | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Auto-generate clean slug from name if not provided
        const slug = storeData.slug || (storeData.name || 'store')
            .toLowerCase()
            .trim()
            .replace(/['']/g, '')           // Remove apostrophes (Ray's → Rays)
            .replace(/[^a-z0-9]+/g, '-')    // Replace non-alphanumeric with hyphens
            .replace(/^-|-$/g, '')           // Trim leading/trailing hyphens
            + '-' + Math.floor(Math.random() * 900 + 100); // 3-digit suffix for uniqueness

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
                status: 'active', // Default to active for MVP
                logo_url: storeData.logo_url,
                theme_config: storeData.theme_config,

                // V2 New Fields
                tagline: storeData.tagline,
                logo_style: storeData.logo_style,
                vibe: storeData.vibe,
                operating_hours: storeData.operating_hours,
                delivery_options: storeData.delivery_options,
                payment_methods: storeData.payment_methods,
                font_pair: storeData.font_pair,
                color_scheme: storeData.color_scheme,
                social_links: storeData.social_links
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating store:', error);
            throw error;
        }

        // Handle Subscription Plan if not default 'hustle'
        // Trigger 'handle_new_store_subscription' creates the initial 'hustle' record
        if (data && storeData.plan_id && storeData.plan_id !== 'hustle') {
            const { error: subError } = await supabase
                .from('store_subscriptions')
                .update({ plan_id: storeData.plan_id }) // Trigger handles stores.plan_tier update
                .eq('store_id', data.id);

            if (subError) {
                console.error('Error updating subscription plan:', subError);
            }
        }

        // AUTO-ADD TO DIRECTORY: Every new store gets listed
        if (data) {
            try {
                await supabase.from('directory_businesses').upsert({
                    name: data.name,
                    slug: data.slug,
                    description: data.description || `${data.name} on TriniBuild`,
                    category: data.category || 'General',
                    address: data.location || '',
                    phone: data.whatsapp || '',
                    website: `https://trinibuild.com/store/${data.slug}`,
                    is_verified: true,
                    is_claimed: true,
                    source: 'trinibuild_store',
                    store_id: data.id,
                    owner_id: user.id,
                    status: 'active',
                    logo_url: data.logo_url,
                    created_at: new Date().toISOString()
                }, { onConflict: 'store_id' });
            } catch (dirError) {
                console.warn('Directory auto-add failed (non-blocking):', dirError);
            }
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

    // Update store theme_config (jsonb) — used by the visual block editor
    updateStoreTheme: async (storeId: string, themeConfig: Record<string, any>): Promise<Store | null> => {
        const { data, error } = await supabase
            .from('stores')
            .update({ theme_config: themeConfig })
            .eq('id', storeId)
            .select()
            .single();

        if (error) {
            console.error('Error updating store theme_config:', error);
            throw error;
        }
        return data as Store;
    },

    // --- PRODUCT MANAGEMENT ---

    getProducts: async (storeId: string): Promise<Product[]> => {
        // NOTE: public.product_variants doesn't exist in this DB, so no join.
        // Frontend Product type has legacy fields (seo, gallery_images,
        // category_ids, variants, specifications) — we default them so
        // components that read them don't crash. Actual storage for these
        // richer fields is a future migration.
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId);

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }
        return (data || []).map(p => ({
            ...p,
            price: p.base_price ?? 0,
            stock: p.stock ?? 0,
            status: p.status || 'active',
            seo: {},
            variants: [],
            gallery_images: Array.isArray(p.images) ? p.images : [],
            category_ids: p.category ? [p.category] : [],
            specifications: {},
        })) as Product[];
    },

    getProductById: async (productId: string): Promise<Product | null> => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) return null;
        return {
            ...data,
            price: data.base_price ?? 0,
            stock: data.stock ?? 0,
            status: data.status || 'active',
            seo: {},
            variants: [],
            gallery_images: Array.isArray(data.images) ? data.images : [],
            category_ids: data.category ? [data.category] : [],
            specifications: {},
        } as Product;
    },

    addProduct: async (storeId: string, productData: CreateProductData): Promise<Product | null> => {
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
        // Real `products` columns only. The Product type has legacy fields
        // (seo, variants, gallery_images, category_ids, specifications) that
        // aren't real columns — sending them would throw "column X does not exist".
        const ALLOWED_COLUMNS = new Set([
            'name', 'slug', 'description', 'status', 'base_price',
            'compare_at_price', 'cost', 'image_url', 'images', 'tags',
            'category', 'stock',
        ]);
        const payload: Record<string, any> = {};
        for (const [k, v] of Object.entries(updates)) {
            if (ALLOWED_COLUMNS.has(k)) payload[k] = v;
        }
        // Map legacy frontend `price` onto `base_price` if that's what was passed
        if ('price' in updates && !('base_price' in payload)) {
            payload.base_price = (updates as any).price;
        }

        const { data, error } = await supabase
            .from('products')
            .update(payload)
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
    },

    // Toggle branding on/off (paid plans only)
    toggleBranding: async (storeId: string, showBranding: boolean): Promise<boolean> => {
        const { error } = await supabase
            .from('stores')
            .update({ show_branding: showBranding })
            .eq('id', storeId);

        if (error) {
            console.error('Error toggling branding:', error);
            return false;
        }
        return true;
    },

    // Get store by short slug (for /s/shortslug routes)
    getStoreByShortSlug: async (shortSlug: string): Promise<Store | null> => {
        const { data, error } = await supabase
            .from('stores')
            .select(`
                *,
                products (*),
                logo:logos(*),
                theme:themes(*)
            `)
            .eq('short_slug', shortSlug)
            .single();

        if (error) {
            console.error('Error fetching store by short slug:', error);
            return null;
        }
        return data as Store;
    }
};
