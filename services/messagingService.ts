import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
    id: string;
    customer_id: string;
    store_id: string;
    order_id?: string;
    product_id?: string;
    status: 'open' | 'closed' | 'archived';
    last_message_at: string;
    last_message_preview?: string;
    customer_unread_count: number;
    store_unread_count: number;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: 'customer' | 'store';
    message: string;
    attachments: string[];
    read: boolean;
    read_at?: string;
    created_at: string;
}

export const messagingService = {
    // ============================================
    // CONVERSATIONS
    // ============================================

    async getOrCreateConversation(
        customerId: string,
        storeId: string,
        orderId?: string,
        productId?: string
    ): Promise<Conversation> {
        // Try to find existing conversation
        let query = supabase
            .from('conversations')
            .select('*')
            .eq('customer_id', customerId)
            .eq('store_id', storeId)
            .eq('status', 'open');

        if (orderId) {
            query = query.eq('order_id', orderId);
        }
        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data: existing } = await query.single();

        if (existing) {
            return existing as Conversation;
        }

        // Create new conversation
        const { data, error } = await supabase
            .from('conversations')
            .insert({
                customer_id: customerId,
                store_id: storeId,
                order_id: orderId,
                product_id: productId,
                status: 'open'
            })
            .select()
            .single();

        if (error) throw error;
        return data as Conversation;
    },

    async getConversations(userId: string, userType: 'customer' | 'store'): Promise<Conversation[]> {
        const column = userType === 'customer' ? 'customer_id' : 'store_id';

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                store:stores(id, name, logo_url),
                customer:profiles!customer_id(id, full_name, avatar_url)
            `)
            .eq(column, userId)
            .neq('status', 'archived')
            .order('last_message_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    },

    async getConversation(conversationId: string): Promise<Conversation | null> {
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                *,
                store:stores(id, name, logo_url),
                customer:profiles!customer_id(id, full_name, avatar_url)
            `)
            .eq('id', conversationId)
            .single();

        if (error) return null;
        return data as any;
    },

    async closeConversation(conversationId: string): Promise<void> {
        const { error } = await supabase
            .from('conversations')
            .update({ status: 'closed' })
            .eq('id', conversationId);

        if (error) throw error;
    },

    async archiveConversation(conversationId: string): Promise<void> {
        const { error } = await supabase
            .from('conversations')
            .update({ status: 'archived' })
            .eq('id', conversationId);

        if (error) throw error;
    },

    async markConversationAsRead(conversationId: string, userType: 'customer' | 'store'): Promise<void> {
        const column = userType === 'customer' ? 'customer_unread_count' : 'store_unread_count';

        const { error } = await supabase
            .from('conversations')
            .update({ [column]: 0 })
            .eq('id', conversationId);

        if (error) throw error;

        // Mark all messages as read
        const { error: msgError } = await supabase
            .from('messages')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('conversation_id', conversationId)
            .eq('read', false);

        if (msgError) throw msgError;
    },

    // ============================================
    // MESSAGES
    // ============================================

    async sendMessage(
        conversationId: string,
        senderId: string,
        senderType: 'customer' | 'store',
        message: string,
        attachments: string[] = []
    ): Promise<Message> {
        // Insert message
        const { data: newMessage, error: msgError } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                sender_type: senderType,
                message,
                attachments
            })
            .select()
            .single();

        if (msgError) throw msgError;

        // Update conversation
        const unreadColumn = senderType === 'customer' ? 'store_unread_count' : 'customer_unread_count';

        const { error: convError } = await supabase
            .from('conversations')
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: message.substring(0, 100),
                [unreadColumn]: supabase.rpc('increment', { x: 1 })
            })
            .eq('id', conversationId);

        if (convError) throw convError;

        return newMessage as Message;
    },

    async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!sender_id(id, full_name, avatar_url)
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data as any[];
    },

    async markMessageAsRead(messageId: string): Promise<void> {
        const { error } = await supabase
            .from('messages')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', messageId);

        if (error) throw error;
    },

    async uploadAttachment(file: File, conversationId: string): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    // ============================================
    // REALTIME SUBSCRIPTIONS
    // ============================================

    subscribeToConversation(
        conversationId: string,
        onMessage: (message: Message) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel(`conversation:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    onMessage(payload.new as Message);
                }
            )
            .subscribe();

        return channel;
    },

    subscribeToConversations(
        userId: string,
        userType: 'customer' | 'store',
        onUpdate: (conversation: Conversation) => void
    ): RealtimeChannel {
        const column = userType === 'customer' ? 'customer_id' : 'store_id';

        const channel = supabase
            .channel(`conversations:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `${column}=eq.${userId}`
                },
                (payload) => {
                    onUpdate(payload.new as Conversation);
                }
            )
            .subscribe();

        return channel;
    },

    unsubscribe(channel: RealtimeChannel): void {
        supabase.removeChannel(channel);
    },

    // ============================================
    // QUICK REPLIES & TEMPLATES
    // ============================================

    getQuickReplies(storeId: string): string[] {
        // These could be stored in database per store
        return [
            "Thanks for your message! I'll get back to you shortly.",
            "Your order is being prepared and will ship soon.",
            "Yes, this item is in stock!",
            "What size are you looking for?",
            "We offer free delivery on orders over TT$200.",
            "You can pay via Cash on Delivery, WiPay, or Bank Transfer.",
            "Our store is open Monday-Saturday, 9am-6pm."
        ];
    },

    // ============================================
    // AUTOMATED MESSAGES
    // ============================================

    async sendWelcomeMessage(conversationId: string, storeId: string, storeName: string): Promise<void> {
        // Get store info
        const { data: store } = await supabase
            .from('stores')
            .select('name, whatsapp')
            .eq('id', storeId)
            .single();

        if (!store) return;

        const welcomeMessage = `👋 Welcome to ${store.name}!\n\nHow can we help you today?\n\n💬 You can also reach us on WhatsApp: ${store.whatsapp}`;

        await this.sendMessage(
            conversationId,
            storeId,
            'store',
            welcomeMessage
        );
    },

    async sendOrderConfirmationMessage(
        conversationId: string,
        storeId: string,
        orderId: string,
        orderTotal: number
    ): Promise<void> {
        const message = `✅ Order Confirmed!\n\nOrder #${orderId}\nTotal: TT$${orderTotal.toFixed(2)}\n\nWe'll notify you when your order ships. Feel free to ask any questions!`;

        await this.sendMessage(
            conversationId,
            storeId,
            'store',
            message
        );
    },

    async sendShippingUpdateMessage(
        conversationId: string,
        storeId: string,
        orderId: string,
        trackingNumber: string
    ): Promise<void> {
        const message = `📦 Your order has shipped!\n\nOrder #${orderId}\nTracking: ${trackingNumber}\n\nExpected delivery: 1-3 business days`;

        await this.sendMessage(
            conversationId,
            storeId,
            'store',
            message
        );
    },

    // ============================================
    // ANALYTICS
    // ============================================

    async getConversationStats(storeId: string): Promise<{
        total: number;
        open: number;
        closed: number;
        avgResponseTime: number;
        unreadCount: number;
    }> {
        const { data: conversations } = await supabase
            .from('conversations')
            .select('status, store_unread_count')
            .eq('store_id', storeId);

        if (!conversations) {
            return {
                total: 0,
                open: 0,
                closed: 0,
                avgResponseTime: 0,
                unreadCount: 0
            };
        }

        return {
            total: conversations.length,
            open: conversations.filter(c => c.status === 'open').length,
            closed: conversations.filter(c => c.status === 'closed').length,
            avgResponseTime: 0, // Would need to calculate from message timestamps
            unreadCount: conversations.reduce((sum, c) => sum + c.store_unread_count, 0)
        };
    }
};
