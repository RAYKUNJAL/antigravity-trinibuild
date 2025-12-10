import { supabase } from './supabaseClient';

export interface NotificationPayload {
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
    linkText?: string;
    metadata?: Record<string, any>;
}

export interface EmailPayload {
    to: string;
    toName?: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    templateName?: string;
    templateData?: Record<string, any>;
}

export interface WhatsAppPayload {
    phoneNumber: string;
    message: string;
    templateName?: string;
    templateParams?: Record<string, any>;
    mediaUrl?: string;
}

export interface SMSPayload {
    phoneNumber: string;
    message: string;
}

export const notificationService = {
    // ============================================
    // IN-APP NOTIFICATIONS
    // ============================================

    async createNotification(payload: NotificationPayload, channels: {
        app?: boolean;
        email?: boolean;
        sms?: boolean;
        whatsapp?: boolean;
    } = { app: true }): Promise<void> {
        try {
            // Create in-app notification
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: payload.userId,
                    type: payload.type,
                    title: payload.title,
                    message: payload.message,
                    link_url: payload.linkUrl,
                    link_text: payload.linkText,
                    metadata: payload.metadata || {},
                    sent_via_app: channels.app !== false,
                    sent_via_email: channels.email === true,
                    sent_via_sms: channels.sms === true,
                    sent_via_whatsapp: channels.whatsapp === true
                });

            if (error) throw error;

            // Get user contact info for other channels
            if (channels.email || channels.sms || channels.whatsapp) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', payload.userId)
                    .single();

                if (profile) {
                    // Send email if requested
                    if (channels.email && profile.email) {
                        await this.sendEmail({
                            to: profile.email,
                            toName: profile.full_name || undefined,
                            subject: payload.title,
                            htmlBody: `<h2>${payload.title}</h2><p>${payload.message}</p>`,
                            textBody: `${payload.title}\n\n${payload.message}`
                        });
                    }

                    // Send WhatsApp if requested
                    if (channels.whatsapp) {
                        // Get phone from user metadata or separate phone field
                        const phone = (payload.metadata as any)?.phone;
                        if (phone) {
                            await this.sendWhatsApp({
                                phoneNumber: phone,
                                message: `*${payload.title}*\n\n${payload.message}`
                            });
                        }
                    }

                    // Send SMS if requested
                    if (channels.sms) {
                        const phone = (payload.metadata as any)?.phone;
                        if (phone) {
                            await this.sendSMS({
                                phoneNumber: phone,
                                message: `${payload.title}: ${payload.message}`
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to create notification:', error);
            throw error;
        }
    },

    async markAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId);

        if (error) throw error;
    },

    async getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<any[]> {
        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (unreadOnly) {
            query = query.eq('read', false);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return count || 0;
    },

    // ============================================
    // EMAIL NOTIFICATIONS
    // ============================================

    async sendEmail(payload: EmailPayload): Promise<void> {
        try {
            const { error } = await supabase
                .from('email_queue')
                .insert({
                    to_email: payload.to,
                    to_name: payload.toName,
                    subject: payload.subject,
                    html_body: payload.htmlBody,
                    text_body: payload.textBody,
                    template_name: payload.templateName,
                    template_data: payload.templateData
                });

            if (error) throw error;

            // In production, this would trigger a background job to actually send the email
            // For now, we'll call the email service directly
            await this.processEmailQueue();
        } catch (error) {
            console.error('Failed to queue email:', error);
            throw error;
        }
    },

    async processEmailQueue(): Promise<void> {
        // This would be called by a background worker
        // For MVP, we can use a simple polling mechanism or Supabase Edge Functions

        const { data: emails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .lt('attempts', 3)
            .limit(10);

        if (error || !emails) return;

        for (const email of emails) {
            try {
                // Send via your email provider (SendGrid, Mailgun, etc.)
                await this.sendEmailViaProvider(email);

                // Mark as sent
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', email.id);
            } catch (error: any) {
                // Mark as failed
                await supabase
                    .from('email_queue')
                    .update({
                        status: 'failed',
                        attempts: email.attempts + 1,
                        last_error: error.message
                    })
                    .eq('id', email.id);
            }
        }
    },

    async sendEmailViaProvider(email: any): Promise<void> {
        // Integration with email provider
        // Example: SendGrid, Mailgun, AWS SES

        if (import.meta.env.DEV) {
            console.log('📧 Email (DEV MODE):', {
                to: email.to_email,
                subject: email.subject,
                body: email.html_body
            });
            return;
        }

        // Production email sending
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SENDGRID_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: email.to_email, name: email.to_name }],
                    subject: email.subject
                }],
                from: {
                    email: 'noreply@trinibuild.com',
                    name: 'TriniBuild'
                },
                content: [
                    { type: 'text/plain', value: email.text_body || email.html_body },
                    { type: 'text/html', value: email.html_body }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Email send failed: ${response.statusText}`);
        }
    },

    // ============================================
    // WHATSAPP NOTIFICATIONS
    // ============================================

    async sendWhatsApp(payload: WhatsAppPayload): Promise<void> {
        try {
            const { error } = await supabase
                .from('whatsapp_queue')
                .insert({
                    phone_number: payload.phoneNumber,
                    message: payload.message,
                    template_name: payload.templateName,
                    template_params: payload.templateParams,
                    media_url: payload.mediaUrl
                });

            if (error) throw error;

            // Process immediately in development
            if (import.meta.env.DEV) {
                await this.processWhatsAppQueue();
            }
        } catch (error) {
            console.error('Failed to queue WhatsApp message:', error);
            throw error;
        }
    },

    async processWhatsAppQueue(): Promise<void> {
        const { data: messages, error } = await supabase
            .from('whatsapp_queue')
            .select('*')
            .eq('status', 'pending')
            .lt('attempts', 3)
            .limit(10);

        if (error || !messages) return;

        for (const msg of messages) {
            try {
                await this.sendWhatsAppViaProvider(msg);

                await supabase
                    .from('whatsapp_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', msg.id);
            } catch (error: any) {
                await supabase
                    .from('whatsapp_queue')
                    .update({
                        status: 'failed',
                        attempts: msg.attempts + 1,
                        last_error: error.message
                    })
                    .eq('id', msg.id);
            }
        }
    },

    async sendWhatsAppViaProvider(message: any): Promise<void> {
        if (import.meta.env.DEV) {
            console.log('💬 WhatsApp (DEV MODE):', {
                to: message.phone_number,
                message: message.message
            });
            return;
        }

        // WhatsApp Business API integration
        // Using Twilio WhatsApp API as example
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${import.meta.env.VITE_TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${import.meta.env.VITE_TWILIO_ACCOUNT_SID}:${import.meta.env.VITE_TWILIO_AUTH_TOKEN}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: `whatsapp:${import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER}`,
                To: `whatsapp:${message.phone_number}`,
                Body: message.message
            })
        });

        if (!response.ok) {
            throw new Error(`WhatsApp send failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Update with WhatsApp message ID
        await supabase
            .from('whatsapp_queue')
            .update({ whatsapp_message_id: data.sid })
            .eq('id', message.id);
    },

    // ============================================
    // SMS NOTIFICATIONS
    // ============================================

    async sendSMS(payload: SMSPayload): Promise<void> {
        try {
            const { error } = await supabase
                .from('sms_queue')
                .insert({
                    phone_number: payload.phoneNumber,
                    message: payload.message
                });

            if (error) throw error;

            if (import.meta.env.DEV) {
                await this.processSMSQueue();
            }
        } catch (error) {
            console.error('Failed to queue SMS:', error);
            throw error;
        }
    },

    async processSMSQueue(): Promise<void> {
        const { data: messages, error } = await supabase
            .from('sms_queue')
            .select('*')
            .eq('status', 'pending')
            .lt('attempts', 3)
            .limit(10);

        if (error || !messages) return;

        for (const msg of messages) {
            try {
                await this.sendSMSViaProvider(msg);

                await supabase
                    .from('sms_queue')
                    .update({
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    })
                    .eq('id', msg.id);
            } catch (error: any) {
                await supabase
                    .from('sms_queue')
                    .update({
                        status: 'failed',
                        attempts: msg.attempts + 1,
                        last_error: error.message
                    })
                    .eq('id', msg.id);
            }
        }
    },

    async sendSMSViaProvider(message: any): Promise<void> {
        if (import.meta.env.DEV) {
            console.log('📱 SMS (DEV MODE):', {
                to: message.phone_number,
                message: message.message
            });
            return;
        }

        // Twilio SMS API
        const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${import.meta.env.VITE_TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${import.meta.env.VITE_TWILIO_ACCOUNT_SID}:${import.meta.env.VITE_TWILIO_AUTH_TOKEN}`)}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                From: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
                To: message.phone_number,
                Body: message.message
            })
        });

        if (!response.ok) {
            throw new Error(`SMS send failed: ${response.statusText}`);
        }

        const data = await response.json();

        await supabase
            .from('sms_queue')
            .update({ sms_id: data.sid })
            .eq('id', message.id);
    },

    // ============================================
    // ORDER NOTIFICATIONS (Pre-built templates)
    // ============================================

    async notifyOrderPlaced(orderId: string, customerId: string, customerPhone: string, customerEmail?: string): Promise<void> {
        await this.createNotification({
            userId: customerId,
            type: 'order_placed',
            title: 'Order Confirmed!',
            message: `Your order #${orderId} has been placed successfully. We'll notify you when it ships.`,
            linkUrl: `/orders/${orderId}`,
            linkText: 'View Order',
            metadata: { orderId, phone: customerPhone }
        }, {
            app: true,
            email: !!customerEmail,
            whatsapp: true,
            sms: true
        });
    },

    async notifyOrderShipped(orderId: string, customerId: string, trackingNumber: string, customerPhone: string): Promise<void> {
        await this.createNotification({
            userId: customerId,
            type: 'order_shipped',
            title: 'Order Shipped!',
            message: `Your order #${orderId} is on its way! Tracking: ${trackingNumber}`,
            linkUrl: `/orders/${orderId}/track`,
            linkText: 'Track Order',
            metadata: { orderId, trackingNumber, phone: customerPhone }
        }, {
            app: true,
            whatsapp: true,
            sms: true
        });
    },

    async notifyDeliveryAssigned(orderId: string, customerId: string, driverName: string, customerPhone: string): Promise<void> {
        await this.createNotification({
            userId: customerId,
            type: 'delivery_assigned',
            title: 'Driver Assigned!',
            message: `${driverName} is delivering your order #${orderId}. You can track them in real-time.`,
            linkUrl: `/orders/${orderId}/track`,
            linkText: 'Track Delivery',
            metadata: { orderId, driverName, phone: customerPhone }
        }, {
            app: true,
            whatsapp: true
        });
    },

    async notifyPriceDrop(productId: string, userId: string, productName: string, oldPrice: number, newPrice: number): Promise<void> {
        await this.createNotification({
            userId,
            type: 'price_drop',
            title: 'Price Drop Alert!',
            message: `${productName} is now TT$${newPrice.toFixed(2)} (was TT$${oldPrice.toFixed(2)})`,
            linkUrl: `/products/${productId}`,
            linkText: 'Buy Now'
        }, {
            app: true,
            email: true
        });
    },

    async notifyBackInStock(productId: string, userId: string, productName: string): Promise<void> {
        await this.createNotification({
            userId,
            type: 'back_in_stock',
            title: 'Back in Stock!',
            message: `${productName} is back in stock. Order now before it sells out again!`,
            linkUrl: `/products/${productId}`,
            linkText: 'Shop Now'
        }, {
            app: true,
            email: true
        });
    }
};
