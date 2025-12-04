import { supabase } from './supabaseClient';

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    read_at?: string;
    created_at: string;
}

class NotificationService {
    /**
     * Create a notification
     */
    async createNotification(notification: {
        user_id: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([notification])
                .select()
                .single();

            if (error) throw error;

            // Send push notification if enabled
            await this.sendPushNotification(notification.user_id, {
                title: notification.title,
                body: notification.message,
                data: notification.data,
            });

            return data;
        } catch (error: any) {
            console.error('Create notification error:', error);
            throw error;
        }
    }

    /**
     * Get notifications for current user
     */
    async getMyNotifications(limit = 50) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .eq('read', false);

            if (error) throw error;
            return count || 0;
        } catch (error: any) {
            console.error('Get unread count error:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString(),
                })
                .eq('id', notificationId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Mark as read error:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const { error } = await supabase
                .from('notifications')
                .update({
                    read: true,
                    read_at: new Date().toISOString(),
                })
                .eq('user_id', session.user.id)
                .eq('read', false);

            if (error) throw error;
        } catch (error: any) {
            console.error('Mark all as read error:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string) {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
        } catch (error: any) {
            console.error('Delete notification error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to real-time notifications
     */
    subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    callback(payload.new as Notification);
                }
            )
            .subscribe();
    }

    /**
     * Send push notification (Web Push API)
     */
    private async sendPushNotification(
        userId: string,
        notification: {
            title: string;
            body: string;
            data?: any;
        }
    ) {
        try {
            // Check if push notifications are supported
            if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                return;
            }

            // Check permission
            if (Notification.permission !== 'granted') {
                return;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Show notification
            await registration.showNotification(notification.title, {
                body: notification.body,
                icon: '/logo.png',
                badge: '/badge.png',
                data: notification.data,
                tag: `notification-${Date.now()}`,
                requireInteraction: false,
            });
        } catch (error) {
            console.error('Push notification error:', error);
        }
    }

    /**
     * Request push notification permission
     */
    async requestPermission() {
        try {
            if (!('Notification' in window)) {
                throw new Error('Push notifications not supported');
            }

            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error: any) {
            console.error('Request permission error:', error);
            throw error;
        }
    }

    /**
     * Send email notification (via backend)
     */
    async sendEmailNotification(params: {
        to: string;
        subject: string;
        html: string;
        text?: string;
    }) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch('/api/notifications/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Send email error:', error);
            throw error;
        }
    }

    /**
     * Send SMS notification (via Twilio)
     */
    async sendSMSNotification(params: {
        to: string;
        message: string;
    }) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User must be authenticated');

            const response = await fetch('/api/notifications/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error('Failed to send SMS');
            }

            return await response.json();
        } catch (error: any) {
            console.error('Send SMS error:', error);
            throw error;
        }
    }

    /**
     * Notification templates
     */
    templates = {
        orderConfirmed: (orderNumber: string) => ({
            type: 'order',
            title: 'Order Confirmed',
            message: `Your order #${orderNumber} has been confirmed and is being processed.`,
        }),
        orderShipped: (orderNumber: string, trackingNumber: string) => ({
            type: 'order',
            title: 'Order Shipped',
            message: `Your order #${orderNumber} has been shipped. Tracking: ${trackingNumber}`,
        }),
        rideMatched: (driverName: string, eta: number) => ({
            type: 'ride',
            title: 'Driver Found',
            message: `${driverName} is on the way. ETA: ${eta} minutes`,
        }),
        rideCompleted: (fare: number) => ({
            type: 'ride',
            title: 'Ride Completed',
            message: `Your ride has been completed. Total fare: TTD ${fare.toFixed(2)}`,
        }),
        paymentReceived: (amount: number) => ({
            type: 'payment',
            title: 'Payment Received',
            message: `Payment of TTD ${amount.toFixed(2)} has been received.`,
        }),
        newReview: (rating: number, productName: string) => ({
            type: 'review',
            title: 'New Review',
            message: `You received a ${rating}-star review on ${productName}`,
        }),
    };
}

export const notificationService = new NotificationService();
