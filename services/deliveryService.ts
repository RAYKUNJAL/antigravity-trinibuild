import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';

export interface DeliveryRequest {
    id: string;
    order_id: string;
    store_id: string;
    driver_id?: string;

    pickup_address: string;
    pickup_lat?: number;
    pickup_lng?: number;
    pickup_phone?: string;
    pickup_instructions?: string;

    delivery_address: string;
    delivery_lat?: number;
    delivery_lng?: number;
    delivery_phone: string;
    delivery_instructions?: string;

    package_description?: string;
    package_value?: number;
    requires_signature: boolean;

    delivery_fee: number;
    driver_earnings?: number;

    status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

    created_at: string;
    assigned_at?: string;
    picked_up_at?: string;
    delivered_at?: string;

    signature_url?: string;
    photo_url?: string;
    delivery_notes?: string;
}

export interface DeliveryOption {
    id: string;
    store_id: string;
    type: 'trinibuild_go' | 'store_delivery' | 'pickup' | 'courier';
    name: string;
    description?: string;
    base_price: number;
    price_per_km: number;
    free_over_amount?: number;
    zones?: Array<{ name: string; price: number }>;
    trinibuild_go_enabled: boolean;
    auto_assign_driver: boolean;
    estimated_delivery_time?: string;
    enabled: boolean;
}

export const deliveryService = {
    // ============================================
    // DELIVERY OPTIONS
    // ============================================

    async getStoreDeliveryOptions(storeId: string): Promise<DeliveryOption[]> {
        const { data, error } = await supabase
            .from('delivery_options')
            .select('*')
            .eq('store_id', storeId)
            .eq('enabled', true)
            .order('base_price', { ascending: true });

        if (error) throw error;
        return data as DeliveryOption[];
    },

    async calculateDeliveryFee(
        deliveryOptionId: string,
        orderTotal: number,
        distance?: number
    ): Promise<number> {
        const { data: option, error } = await supabase
            .from('delivery_options')
            .select('*')
            .eq('id', deliveryOptionId)
            .single();

        if (error || !option) return 0;

        // Free delivery threshold
        if (option.free_over_amount && orderTotal >= option.free_over_amount) {
            return 0;
        }

        // Calculate based on distance
        let fee = option.base_price;
        if (distance && option.price_per_km) {
            fee += distance * option.price_per_km;
        }

        return fee;
    },

    async createDeliveryOption(
        storeId: string,
        optionData: Partial<DeliveryOption>
    ): Promise<DeliveryOption> {
        const { data, error } = await supabase
            .from('delivery_options')
            .insert({
                store_id: storeId,
                ...optionData
            })
            .select()
            .single();

        if (error) throw error;
        return data as DeliveryOption;
    },

    // ============================================
    // TRINIBUILD GO INTEGRATION
    // ============================================

    async createDeliveryRequest(requestData: {
        orderId: string;
        storeId: string;
        pickupAddress: string;
        pickupLat?: number;
        pickupLng?: number;
        pickupPhone?: string;
        pickupInstructions?: string;
        deliveryAddress: string;
        deliveryLat?: number;
        deliveryLng?: number;
        deliveryPhone: string;
        deliveryInstructions?: string;
        packageDescription?: string;
        packageValue?: number;
        requiresSignature?: boolean;
        deliveryFee: number;
    }): Promise<DeliveryRequest> {
        // Calculate driver earnings (70% of delivery fee)
        const driverEarnings = requestData.deliveryFee * 0.7;

        const { data, error } = await supabase
            .from('delivery_requests')
            .insert({
                order_id: requestData.orderId,
                store_id: requestData.storeId,
                pickup_address: requestData.pickupAddress,
                pickup_lat: requestData.pickupLat,
                pickup_lng: requestData.pickupLng,
                pickup_phone: requestData.pickupPhone,
                pickup_instructions: requestData.pickupInstructions,
                delivery_address: requestData.deliveryAddress,
                delivery_lat: requestData.deliveryLat,
                delivery_lng: requestData.deliveryLng,
                delivery_phone: requestData.deliveryPhone,
                delivery_instructions: requestData.deliveryInstructions,
                package_description: requestData.packageDescription,
                package_value: requestData.packageValue,
                requires_signature: requestData.requiresSignature || false,
                delivery_fee: requestData.deliveryFee,
                driver_earnings: driverEarnings,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-assign to nearest available driver
        const deliveryRequest = data as DeliveryRequest;
        await this.autoAssignDriver(deliveryRequest.id);

        return deliveryRequest;
    },

    async autoAssignDriver(deliveryRequestId: string): Promise<void> {
        // Get delivery request
        const { data: request } = await supabase
            .from('delivery_requests')
            .select('*')
            .eq('id', deliveryRequestId)
            .single();

        if (!request || !request.pickup_lat || !request.pickup_lng) return;

        // Find available drivers nearby (within 10km)
        // This uses the haversine formula to calculate distance
        const { data: drivers } = await supabase
            .rpc('find_nearby_drivers', {
                lat: request.pickup_lat,
                lng: request.pickup_lng,
                radius_km: 10
            });

        if (!drivers || drivers.length === 0) {
            // No drivers available, notify store owner
            console.log('No drivers available for delivery request:', deliveryRequestId);
            return;
        }

        // Assign to nearest driver
        const nearestDriver = drivers[0];
        await this.assignDriver(deliveryRequestId, nearestDriver.id);
    },

    async assignDriver(deliveryRequestId: string, driverId: string): Promise<void> {
        const { error } = await supabase
            .from('delivery_requests')
            .update({
                driver_id: driverId,
                status: 'assigned',
                assigned_at: new Date().toISOString()
            })
            .eq('id', deliveryRequestId);

        if (error) throw error;

        // Get driver and request details
        const { data: request } = await supabase
            .from('delivery_requests')
            .select(`
                *,
                driver:profiles!driver_id(id, full_name, avatar_url)
            `)
            .eq('id', deliveryRequestId)
            .single();

        if (!request) return;

        // Notify driver
        await notificationService.createNotification({
            userId: driverId,
            type: 'delivery_assigned',
            title: 'New Delivery Request',
            message: `Pickup from ${request.pickup_address}. Deliver to ${request.delivery_address}. Earn TT$${request.driver_earnings?.toFixed(2)}`,
            linkUrl: `/driver/deliveries/${deliveryRequestId}`,
            linkText: 'View Details'
        }, {
            app: true,
            sms: true
        });

        // Notify customer (get customer from order)
        const { data: order } = await supabase
            .from('orders')
            .select('customer_id')
            .eq('id', request.order_id)
            .single();

        if (order) {
            await notificationService.notifyDeliveryAssigned(
                request.order_id,
                order.customer_id,
                request.driver?.full_name || 'Your driver',
                request.delivery_phone
            );
        }
    },

    async updateDeliveryStatus(
        deliveryRequestId: string,
        status: DeliveryRequest['status'],
        additionalData?: {
            signatureUrl?: string;
            photoUrl?: string;
            deliveryNotes?: string;
        }
    ): Promise<void> {
        const updateData: any = { status };

        // Add timestamps based on status
        if (status === 'picked_up') {
            updateData.picked_up_at = new Date().toISOString();
        } else if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
            if (additionalData) {
                updateData.signature_url = additionalData.signatureUrl;
                updateData.photo_url = additionalData.photoUrl;
                updateData.delivery_notes = additionalData.deliveryNotes;
            }
        }

        const { error } = await supabase
            .from('delivery_requests')
            .update(updateData)
            .eq('id', deliveryRequestId);

        if (error) throw error;

        // Get request details for notifications
        const { data: request } = await supabase
            .from('delivery_requests')
            .select('*')
            .eq('id', deliveryRequestId)
            .single();

        if (!request) return;

        // Get customer from order
        const { data: order } = await supabase
            .from('orders')
            .select('customer_id')
            .eq('id', request.order_id)
            .single();

        if (!order) return;

        // Send notifications based on status
        if (status === 'picked_up') {
            await notificationService.createNotification({
                userId: order.customer_id,
                type: 'delivery_picked_up',
                title: 'Order Picked Up!',
                message: `Your order #${request.order_id} has been picked up and is on the way!`,
                linkUrl: `/orders/${request.order_id}/track`,
                linkText: 'Track Delivery',
                metadata: { phone: request.delivery_phone }
            }, {
                app: true,
                whatsapp: true
            });
        } else if (status === 'delivered') {
            await notificationService.createNotification({
                userId: order.customer_id,
                type: 'delivery_completed',
                title: 'Order Delivered!',
                message: `Your order #${request.order_id} has been delivered. Enjoy!`,
                linkUrl: `/orders/${request.order_id}`,
                linkText: 'View Order',
                metadata: { phone: request.delivery_phone }
            }, {
                app: true,
                whatsapp: true,
                sms: true
            });

            // Update order status
            await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', request.order_id);
        }
    },

    async getDeliveryRequest(deliveryRequestId: string): Promise<DeliveryRequest | null> {
        const { data, error } = await supabase
            .from('delivery_requests')
            .select(`
                *,
                driver:profiles!driver_id(id, full_name, avatar_url, phone),
                store:stores(id, name, logo_url, location)
            `)
            .eq('id', deliveryRequestId)
            .single();

        if (error) return null;
        return data as any;
    },

    async getDriverDeliveries(driverId: string, status?: DeliveryRequest['status']): Promise<DeliveryRequest[]> {
        let query = supabase
            .from('delivery_requests')
            .select(`
                *,
                store:stores(id, name, logo_url, location)
            `)
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as any[];
    },

    async getStoreDeliveries(storeId: string, status?: DeliveryRequest['status']): Promise<DeliveryRequest[]> {
        let query = supabase
            .from('delivery_requests')
            .select(`
                *,
                driver:profiles!driver_id(id, full_name, avatar_url, phone)
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as any[];
    },

    // ============================================
    // TRACKING & LOCATION
    // ============================================

    async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
        // Update driver's current location in profiles table
        const { error } = await supabase
            .from('profiles')
            .update({
                current_lat: lat,
                current_lng: lng,
                last_location_update: new Date().toISOString()
            })
            .eq('id', driverId);

        if (error) throw error;
    },

    async getDriverLocation(driverId: string): Promise<{ lat: number; lng: number } | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('current_lat, current_lng')
            .eq('id', driverId)
            .single();

        if (error || !data || !data.current_lat || !data.current_lng) return null;

        return {
            lat: data.current_lat,
            lng: data.current_lng
        };
    },

    subscribeToDeliveryUpdates(
        deliveryRequestId: string,
        onUpdate: (delivery: DeliveryRequest) => void
    ) {
        return supabase
            .channel(`delivery:${deliveryRequestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'delivery_requests',
                    filter: `id=eq.${deliveryRequestId}`
                },
                (payload) => {
                    onUpdate(payload.new as DeliveryRequest);
                }
            )
            .subscribe();
    },

    // ============================================
    // ANALYTICS
    // ============================================

    async getDeliveryStats(storeId: string): Promise<{
        totalDeliveries: number;
        completedDeliveries: number;
        pendingDeliveries: number;
        avgDeliveryTime: number;
        totalRevenue: number;
    }> {
        const { data: deliveries } = await supabase
            .from('delivery_requests')
            .select('*')
            .eq('store_id', storeId);

        if (!deliveries) {
            return {
                totalDeliveries: 0,
                completedDeliveries: 0,
                pendingDeliveries: 0,
                avgDeliveryTime: 0,
                totalRevenue: 0
            };
        }

        const completed = deliveries.filter(d => d.status === 'delivered');
        const pending = deliveries.filter(d => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(d.status));

        // Calculate average delivery time
        let totalTime = 0;
        let count = 0;
        for (const delivery of completed) {
            if (delivery.created_at && delivery.delivered_at) {
                const created = new Date(delivery.created_at).getTime();
                const delivered = new Date(delivery.delivered_at).getTime();
                totalTime += (delivered - created) / (1000 * 60); // Convert to minutes
                count++;
            }
        }

        return {
            totalDeliveries: deliveries.length,
            completedDeliveries: completed.length,
            pendingDeliveries: pending.length,
            avgDeliveryTime: count > 0 ? totalTime / count : 0,
            totalRevenue: deliveries.reduce((sum, d) => sum + (d.delivery_fee || 0), 0)
        };
    }
};
