/**
 * TriniBuild AI Smart Notification System
 * Key: smart_notifier
 * 
 * Enhanced intelligent notification engine with AI personalization,
 * timing optimization, and multi-channel delivery.
 */

import { supabase } from './supabaseClient';
import { aiService } from './ai';

// ============================================
// TYPES
// ============================================

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app' | 'whatsapp';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SmartNotificationType =
    | 'job_match'
    | 'property_alert'
    | 'price_drop'
    | 'new_message'
    | 'order_update'
    | 'booking_reminder'
    | 'review_request'
    | 'trust_update'
    | 'promo_offer'
    | 'event_reminder'
    | 'ride_status'
    | 'system_alert'
    | 'keyword_alert'
    | 'content_suggestion';

export interface SmartNotificationTemplate {
    id: string;
    type: SmartNotificationType;
    title_template: string;
    body_template: string;
    channels: NotificationChannel[];
    priority: NotificationPriority;
    action_url_template?: string;
    icon?: string;
    color?: string;
}

export interface SmartNotification {
    id: string;
    user_id: string;
    type: SmartNotificationType;
    title: string;
    body: string;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    action_url?: string;
    image_url?: string;
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    sent_at?: string;
    read_at?: string;
    clicked: boolean;
    clicked_at?: string;
    metadata: Record<string, unknown>;
    created_at: string;
    expires_at?: string;
}

export interface NotificationPreferences {
    user_id: string;
    push_enabled: boolean;
    email_enabled: boolean;
    sms_enabled: boolean;
    whatsapp_enabled: boolean;
    job_alerts: boolean;
    property_alerts: boolean;
    price_alerts: boolean;
    message_notifications: boolean;
    order_updates: boolean;
    promotional: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// ============================================
// NOTIFICATION TEMPLATES
// ============================================

const SMART_TEMPLATES: Record<SmartNotificationType, SmartNotificationTemplate> = {
    job_match: {
        id: 'job_match',
        type: 'job_match',
        title_template: '🎯 New Job Match: {job_title}',
        body_template: '{company} is hiring for {job_title} in {location}. Salary: {salary}. Apply now!',
        channels: ['push', 'email', 'in_app'],
        priority: 'high',
        action_url_template: '/jobs/{job_id}',
        icon: 'briefcase',
        color: '#3B82F6'
    },
    property_alert: {
        id: 'property_alert',
        type: 'property_alert',
        title_template: '🏠 New Property in {location}',
        body_template: '{property_type} available in {location}. {bedrooms} bed, {bathrooms} bath. ${price}/mo',
        channels: ['push', 'email', 'in_app'],
        priority: 'high',
        action_url_template: '/real-estate/{property_id}',
        icon: 'home',
        color: '#F97316'
    },
    price_drop: {
        id: 'price_drop',
        type: 'price_drop',
        title_template: '💰 Price Dropped on {item_name}',
        body_template: 'Good news! {item_name} dropped from ${old_price} to ${new_price}. Save ${savings}!',
        channels: ['push', 'in_app'],
        priority: 'normal',
        action_url_template: '/marketplace/{item_id}',
        icon: 'tag',
        color: '#10B981'
    },
    new_message: {
        id: 'new_message',
        type: 'new_message',
        title_template: '💬 New message from {sender_name}',
        body_template: '{message_preview}',
        channels: ['push', 'in_app'],
        priority: 'high',
        action_url_template: '/messages/{conversation_id}',
        icon: 'message-circle',
        color: '#8B5CF6'
    },
    order_update: {
        id: 'order_update',
        type: 'order_update',
        title_template: '📦 Order #{order_number} {status}',
        body_template: 'Your order from {store_name} has been {status_detail}.',
        channels: ['push', 'email', 'in_app'],
        priority: 'normal',
        action_url_template: '/orders/{order_id}',
        icon: 'package',
        color: '#06B6D4'
    },
    booking_reminder: {
        id: 'booking_reminder',
        type: 'booking_reminder',
        title_template: '⏰ Reminder: {booking_type} Tomorrow',
        body_template: 'Your {booking_type} is scheduled for {time} at {location}. Don\'t forget!',
        channels: ['push', 'sms', 'in_app'],
        priority: 'high',
        action_url_template: '/bookings/{booking_id}',
        icon: 'calendar',
        color: '#EAB308'
    },
    review_request: {
        id: 'review_request',
        type: 'review_request',
        title_template: '⭐ How was your experience with {provider_name}?',
        body_template: 'Your feedback helps others find great services. Leave a quick review!',
        channels: ['push', 'email', 'in_app'],
        priority: 'low',
        action_url_template: '/review/{transaction_id}',
        icon: 'star',
        color: '#F59E0B'
    },
    trust_update: {
        id: 'trust_update',
        type: 'trust_update',
        title_template: '🛡️ Your Trust Score Updated',
        body_template: 'Your trust score is now {score}. {change_reason}',
        channels: ['in_app'],
        priority: 'low',
        action_url_template: '/profile/trust',
        icon: 'shield',
        color: '#10B981'
    },
    promo_offer: {
        id: 'promo_offer',
        type: 'promo_offer',
        title_template: '🎁 {promo_title}',
        body_template: '{promo_description}. Valid until {expiry_date}.',
        channels: ['push', 'email', 'in_app'],
        priority: 'low',
        action_url_template: '/promo/{promo_code}',
        icon: 'gift',
        color: '#EC4899'
    },
    event_reminder: {
        id: 'event_reminder',
        type: 'event_reminder',
        title_template: '🎉 {event_name} is Coming Up!',
        body_template: 'Your event is on {event_date} at {venue}. Get ready!',
        channels: ['push', 'sms', 'in_app'],
        priority: 'high',
        action_url_template: '/tickets/{ticket_id}',
        icon: 'ticket',
        color: '#8B5CF6'
    },
    ride_status: {
        id: 'ride_status',
        type: 'ride_status',
        title_template: '🚗 {status_title}',
        body_template: '{driver_name} is {status_detail}. {eta}',
        channels: ['push', 'sms', 'in_app'],
        priority: 'urgent',
        action_url_template: '/rides/{ride_id}',
        icon: 'car',
        color: '#06B6D4'
    },
    system_alert: {
        id: 'system_alert',
        type: 'system_alert',
        title_template: '⚠️ {alert_title}',
        body_template: '{alert_message}',
        channels: ['in_app'],
        priority: 'normal',
        icon: 'alert-triangle',
        color: '#F97316'
    },
    keyword_alert: {
        id: 'keyword_alert',
        type: 'keyword_alert',
        title_template: '📈 Trending: {keyword}',
        body_template: 'The keyword "{keyword}" is rising in {location}. {action_suggestion}',
        channels: ['in_app', 'email'],
        priority: 'normal',
        action_url_template: '/admin/keywords?keyword={keyword}',
        icon: 'trending-up',
        color: '#8B5CF6'
    },
    content_suggestion: {
        id: 'content_suggestion',
        type: 'content_suggestion',
        title_template: '💡 Content Idea: {suggestion_title}',
        body_template: 'AI suggests creating content about "{keyword}". Potential volume: {volume}/mo',
        channels: ['in_app', 'email'],
        priority: 'low',
        action_url_template: '/admin/blog-generator?keyword={keyword}',
        icon: 'lightbulb',
        color: '#EAB308'
    }
};

// ============================================
// SMART NOTIFICATION SERVICE
// ============================================

class SmartNotificationService {
    /**
     * Send a smart notification
     */
    async send(
        type: SmartNotificationType,
        userId: string,
        data: Record<string, unknown>,
        options: {
            channels?: NotificationChannel[];
            priority?: NotificationPriority;
            useAI?: boolean;
        } = {}
    ): Promise<SmartNotification> {
        const template = SMART_TEMPLATES[type];
        if (!template) {
            throw new Error(`Unknown notification type: ${type}`);
        }

        // Get user preferences
        const preferences = await this.getUserPreferences(userId);
        const allowedChannels = this.filterChannels(
            options.channels || template.channels,
            preferences,
            type
        );

        // Check quiet hours
        if (this.isQuietHours(preferences) && template.priority !== 'urgent') {
            // Queue for later or send in_app only
            return this.queueForLater(type, userId, data, preferences);
        }

        // Render content
        let title = this.render(template.title_template, data);
        let body = this.render(template.body_template, data);

        // AI enhancement
        if (options.useAI) {
            const enhanced = await this.enhanceWithAI(title, body);
            title = enhanced.title;
            body = enhanced.body;
        }

        const actionUrl = template.action_url_template
            ? this.render(template.action_url_template, data)
            : undefined;

        // Create notification
        const notification: SmartNotification = {
            id: `sn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            type,
            title,
            body,
            priority: options.priority || template.priority,
            channels: allowedChannels,
            action_url: actionUrl,
            status: 'pending',
            clicked: false,
            metadata: data,
            created_at: new Date().toISOString(),
            expires_at: this.getExpiry(type)
        };

        // Save to database
        await supabase.from('smart_notifications').insert(notification);

        // Send through channels
        for (const channel of allowedChannels) {
            await this.sendChannel(channel, notification);
        }

        // Update status
        notification.status = 'sent';
        notification.sent_at = new Date().toISOString();
        await supabase
            .from('smart_notifications')
            .update({ status: 'sent', sent_at: notification.sent_at })
            .eq('id', notification.id);

        return notification;
    }

    /**
     * Broadcast to multiple users
     */
    async broadcast(
        type: SmartNotificationType,
        userIds: string[],
        data: Record<string, unknown>
    ): Promise<number> {
        let sent = 0;
        for (const userId of userIds) {
            try {
                await this.send(type, userId, data);
                sent++;
            } catch {
                // Continue
            }
        }
        return sent;
    }

    /**
     * Get user's notifications
     */
    async getNotifications(
        userId: string,
        options: { limit?: number; unreadOnly?: boolean } = {}
    ): Promise<SmartNotification[]> {
        let query = supabase
            .from('smart_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (options.unreadOnly) {
            query = query.is('read_at', null);
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data } = await query;
        return (data || []) as SmartNotification[];
    }

    /**
     * Mark as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        await supabase
            .from('smart_notifications')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('id', notificationId);
    }

    /**
     * Track click
     */
    async trackClick(notificationId: string): Promise<void> {
        await supabase
            .from('smart_notifications')
            .update({ clicked: true, clicked_at: new Date().toISOString() })
            .eq('id', notificationId);
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string): Promise<number> {
        const { count } = await supabase
            .from('smart_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('read_at', null);

        return count || 0;
    }

    /**
     * Generate AI-enhanced notification
     */
    async generateSmartNotification(
        context: string,
        userId: string
    ): Promise<{ type: SmartNotificationType; data: Record<string, unknown> } | null> {
        const prompt = `Based on this context, determine the best notification to send:
Context: ${context}

Available types: job_match, property_alert, price_drop, event_reminder, promo_offer

Return JSON: {"type": "...", "data": {...}}`;

        try {
            const response = await aiService.generateText(prompt);
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                return JSON.parse(match[0]);
            }
        } catch {
            // Fall back to null
        }
        return null;
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private render(template: string, data: Record<string, unknown>): string {
        return template.replace(/{(\w+)}/g, (_, key) => String(data[key] ?? ''));
    }

    private async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
        const { data } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

        return data as NotificationPreferences | null;
    }

    private filterChannels(
        channels: NotificationChannel[],
        prefs: NotificationPreferences | null,
        type: SmartNotificationType
    ): NotificationChannel[] {
        if (!prefs) return channels;

        return channels.filter(ch => {
            if (ch === 'push' && !prefs.push_enabled) return false;
            if (ch === 'email' && !prefs.email_enabled) return false;
            if (ch === 'sms' && !prefs.sms_enabled) return false;
            if (type === 'job_match' && !prefs.job_alerts) return false;
            if (type === 'property_alert' && !prefs.property_alerts) return false;
            if (type === 'promo_offer' && !prefs.promotional) return false;
            return true;
        });
    }

    private isQuietHours(prefs: NotificationPreferences | null): boolean {
        if (!prefs?.quiet_hours_start || !prefs?.quiet_hours_end) return false;

        const now = new Date();
        const current = now.getHours() * 60 + now.getMinutes();
        const [sh, sm] = prefs.quiet_hours_start.split(':').map(Number);
        const [eh, em] = prefs.quiet_hours_end.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;

        return start < end
            ? current >= start && current < end
            : current >= start || current < end;
    }

    private async queueForLater(
        type: SmartNotificationType,
        userId: string,
        data: Record<string, unknown>,
        prefs: NotificationPreferences
    ): Promise<SmartNotification> {
        // Send as in_app only for now
        return this.send(type, userId, data, { channels: ['in_app'] });
    }

    private async sendChannel(
        channel: NotificationChannel,
        notification: SmartNotification
    ): Promise<void> {
        // In production, integrate with push services, email, SMS, etc.
        console.log(`[${channel}] ${notification.title}`);
    }

    private async enhanceWithAI(title: string, body: string): Promise<{ title: string; body: string }> {
        try {
            const prompt = `Make this notification more engaging for a Trinidad user:
Title: ${title}
Body: ${body}
Keep it short and friendly. Return: Title: [new] Body: [new]`;

            const response = await aiService.generateText(prompt);
            const tMatch = response.match(/Title:\s*(.+)/);
            const bMatch = response.match(/Body:\s*(.+)/);

            if (tMatch && bMatch) {
                return { title: tMatch[1], body: bMatch[1] };
            }
        } catch { }
        return { title, body };
    }

    private getExpiry(type: SmartNotificationType): string {
        const now = new Date();
        if (type === 'ride_status') now.setHours(now.getHours() + 2);
        else if (type === 'event_reminder') now.setDate(now.getDate() + 1);
        else now.setDate(now.getDate() + 30);
        return now.toISOString();
    }
}

// ============================================
// SINGLETON & EXPORTS
// ============================================

export const smartNotifier = new SmartNotificationService();

export const sendJobMatchNotification = (userId: string, job: Record<string, unknown>) =>
    smartNotifier.send('job_match', userId, job);

export const sendPropertyAlert = (userId: string, property: Record<string, unknown>) =>
    smartNotifier.send('property_alert', userId, property);

export const sendRideStatus = (userId: string, ride: Record<string, unknown>) =>
    smartNotifier.send('ride_status', userId, ride, { priority: 'urgent' });

export const sendKeywordAlert = (userId: string, keyword: string, location: string) =>
    smartNotifier.send('keyword_alert', userId, { keyword, location, action_suggestion: 'Consider creating content.' });

export default smartNotifier;
