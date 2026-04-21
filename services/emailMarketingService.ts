/**
 * emailMarketingService.ts
 * TriniBuild's own Klaviyo-clone email marketing system
 * Built on Listmonk concepts, integrated with Supabase
 * 
 * Features:
 * - Subscriber management with segmentation
 * - Campaign creation and scheduling
 * - Template builder with Trinidad branding
 * - Automated welcome sequences
 * - Open/click tracking
 * - Unsubscribe management (T&T Data Protection Act compliant)
 */

import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subscriber {
    id: string;
    email: string;
    name: string;
    phone?: string;
    status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
    lists: string[];
    tags: string[];
    metadata: Record<string, any>;
    store_id?: string;
    created_at: string;
    last_engaged_at?: string;
}

export interface EmailList {
    id: string;
    name: string;
    description: string;
    type: 'public' | 'private';
    optin: 'single' | 'double';
    subscriber_count: number;
    store_id: string;
    created_at: string;
}

export interface Campaign {
    id: string;
    name: string;
    subject: string;
    from_name: string;
    from_email: string;
    body_html: string;
    body_text?: string;
    lists: string[];
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
    scheduled_at?: string;
    sent_at?: string;
    store_id: string;
    stats: CampaignStats;
}

export interface CampaignStats {
    total_sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    open_rate: number;
    click_rate: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body_html: string;
    category: 'welcome' | 'promotion' | 'newsletter' | 'transactional' | 'abandoned_cart' | 'review_request';
    is_default: boolean;
    store_id?: string;
}

// ─── Pre-built Trinidad Email Templates ───────────────────────────────────────

const TRINIDAD_TEMPLATES: Omit<EmailTemplate, 'id' | 'store_id'>[] = [
    {
        name: 'Welcome to the Family',
        subject: 'Welcome to {{store_name}} — we glad yuh reach! 🇹🇹',
        category: 'welcome',
        is_default: true,
        body_html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#E61E2B,#C41E3A);padding:32px;text-align:center;color:#fff">
    <h1 style="margin:0;font-size:28px;font-weight:900">Welcome to {{store_name}}!</h1>
    <p style="margin:8px 0 0;opacity:0.9;font-size:16px">We glad yuh reach 🎉</p>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px;color:#333;line-height:1.6">
      Hey {{subscriber_name}},<br><br>
      Thanks for joining {{store_name}}! We're a local Trinidad business and we're excited to have you.
    </p>
    <p style="font-size:16px;color:#333;line-height:1.6">
      Here's what you can expect from us:
    </p>
    <ul style="font-size:15px;color:#555;line-height:1.8">
      <li>First access to new products & deals</li>
      <li>Exclusive subscriber-only discounts</li>
      <li>Local delivery updates</li>
    </ul>
    <div style="text-align:center;margin:24px 0">
      <a href="{{store_url}}" style="display:inline-block;background:#E61E2B;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px">
        Shop Now →
      </a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#9ca3af">
    <p>{{store_name}} • Trinidad & Tobago</p>
    <p><a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a> | <a href="https://trinibuild.com/privacy" style="color:#9ca3af">Privacy Policy</a></p>
    <p style="margin-top:8px">Powered by TriniBuild 🇹🇹</p>
  </div>
</div>`
    },
    {
        name: 'Hot Deal Alert',
        subject: '🔥 {{discount}}% OFF — Today Only at {{store_name}}!',
        category: 'promotion',
        is_default: true,
        body_html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
  <div style="background:#000;padding:32px;text-align:center;color:#fff">
    <p style="margin:0;font-size:14px;color:#FFD700;font-weight:700;letter-spacing:2px">LIMITED TIME OFFER</p>
    <h1 style="margin:8px 0;font-size:48px;font-weight:900;color:#FFD700">{{discount}}% OFF</h1>
    <p style="margin:0;font-size:18px;opacity:0.9">Everything at {{store_name}}</p>
  </div>
  <div style="padding:32px;text-align:center">
    <p style="font-size:16px;color:#333;line-height:1.6">
      {{subscriber_name}}, this deal eh go last long!<br>
      Shop now before we sell out. Cash on delivery available 💵
    </p>
    <div style="margin:24px 0">
      <a href="{{store_url}}" style="display:inline-block;background:#E61E2B;color:#fff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;font-size:18px">
        SHOP THE SALE →
      </a>
    </div>
    <p style="font-size:13px;color:#9ca3af">Offer expires at midnight tonight</p>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#9ca3af">
    <a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a> | Powered by TriniBuild 🇹🇹
  </div>
</div>`
    },
    {
        name: 'Order Confirmation',
        subject: '✅ Order #{{order_number}} confirmed — {{store_name}}',
        category: 'transactional',
        is_default: true,
        body_html: `
<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
  <div style="background:#10b981;padding:24px;text-align:center;color:#fff">
    <h1 style="margin:0;font-size:24px;font-weight:900">Order Confirmed ✅</h1>
    <p style="margin:4px 0 0;opacity:0.9">Order #{{order_number}}</p>
  </div>
  <div style="padding:32px">
    <p style="font-size:16px;color:#333">Hi {{subscriber_name}},</p>
    <p style="font-size:16px;color:#333;line-height:1.6">
      Your order from {{store_name}} has been confirmed. We preparing it now!
    </p>
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
      <p style="margin:0;font-size:14px;color:#666"><strong>Payment:</strong> {{payment_method}}</p>
      <p style="margin:8px 0 0;font-size:14px;color:#666"><strong>Delivery:</strong> {{delivery_method}}</p>
      <p style="margin:8px 0 0;font-size:20px;font-weight:900;color:#1f2937"><strong>Total: TT${{total}}</strong></p>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="{{tracking_url}}" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700">
        Track Your Order →
      </a>
    </div>
  </div>
  <div style="background:#f9fafb;padding:16px;text-align:center;font-size:11px;color:#9ca3af">
    {{store_name}} • <a href="{{unsubscribe_url}}" style="color:#9ca3af">Unsubscribe</a> | Powered by TriniBuild 🇹🇹
  </div>
</div>`
    }
];

// ─── Email Marketing Service ──────────────────────────────────────────────────

export const emailMarketingService = {

    // ─── Subscriber Management ─────────────────────────────────────────

    async addSubscriber(storeId: string, email: string, name: string, lists: string[] = ['default']): Promise<Subscriber | null> {
        const { data, error } = await supabase
            .from('email_subscribers')
            .upsert({
                store_id: storeId,
                email: email.toLowerCase().trim(),
                name,
                lists,
                status: 'active',
                created_at: new Date().toISOString()
            }, { onConflict: 'store_id,email' })
            .select()
            .single();

        if (error) {
            console.error('Failed to add subscriber:', error);
            return null;
        }

        // Send welcome email automatically
        await this.sendWelcomeEmail(storeId, data as Subscriber);

        return data as Subscriber;
    },

    async unsubscribe(email: string, storeId?: string): Promise<boolean> {
        const query = supabase
            .from('email_subscribers')
            .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
            .eq('email', email.toLowerCase());

        if (storeId) query.eq('store_id', storeId);

        const { error } = await query;
        return !error;
    },

    async getSubscribers(storeId: string, status?: string): Promise<Subscriber[]> {
        let query = supabase
            .from('email_subscribers')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) return [];
        return data as Subscriber[];
    },

    async getSubscriberCount(storeId: string): Promise<number> {
        const { count, error } = await supabase
            .from('email_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', storeId)
            .eq('status', 'active');

        return count || 0;
    },

    // ─── Campaign Management ───────────────────────────────────────────

    async createCampaign(campaign: Partial<Campaign>): Promise<Campaign | null> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .insert({
                ...campaign,
                status: 'draft',
                stats: { total_sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, open_rate: 0, click_rate: 0 },
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create campaign:', error);
            return null;
        }
        return data as Campaign;
    },

    async getCampaigns(storeId: string): Promise<Campaign[]> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data as Campaign[];
    },

    // ─── Template Management ───────────────────────────────────────────

    getDefaultTemplates(): Omit<EmailTemplate, 'id' | 'store_id'>[] {
        return TRINIDAD_TEMPLATES;
    },

    async getTemplates(storeId: string): Promise<EmailTemplate[]> {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .or(`store_id.eq.${storeId},is_default.eq.true`)
            .order('name');

        if (error) return [];
        return data as EmailTemplate[];
    },

    // ─── Send Functions ────────────────────────────────────────────────

    async sendWelcomeEmail(storeId: string, subscriber: Subscriber): Promise<boolean> {
        try {
            // Get store info
            const { data: store } = await supabase
                .from('stores')
                .select('name, slug, logo_url')
                .eq('id', storeId)
                .single();

            if (!store) return false;

            const template = TRINIDAD_TEMPLATES.find(t => t.category === 'welcome');
            if (!template) return false;

            // Replace template variables
            let html = template.body_html
                .replace(/\{\{store_name\}\}/g, store.name)
                .replace(/\{\{subscriber_name\}\}/g, subscriber.name || 'there')
                .replace(/\{\{store_url\}\}/g, `https://trinibuild.com/store/${store.slug}`)
                .replace(/\{\{unsubscribe_url\}\}/g, `https://trinibuild.com/unsubscribe?email=${subscriber.email}&store=${storeId}`);

            let subject = template.subject
                .replace(/\{\{store_name\}\}/g, store.name);

            // Queue for sending via edge function or SMTP
            await supabase.from('email_queue').insert({
                to_email: subscriber.email,
                to_name: subscriber.name,
                from_name: store.name,
                subject,
                body_html: html,
                store_id: storeId,
                type: 'welcome',
                status: 'queued',
                created_at: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Welcome email failed:', error);
            return false;
        }
    },

    async sendOrderConfirmation(storeId: string, orderData: {
        email: string;
        name: string;
        order_number: string;
        total: number;
        payment_method: string;
        delivery_method: string;
        tracking_url: string;
    }): Promise<boolean> {
        try {
            const { data: store } = await supabase
                .from('stores')
                .select('name, slug')
                .eq('id', storeId)
                .single();

            if (!store) return false;

            const template = TRINIDAD_TEMPLATES.find(t => t.category === 'transactional');
            if (!template) return false;

            let html = template.body_html
                .replace(/\{\{store_name\}\}/g, store.name)
                .replace(/\{\{subscriber_name\}\}/g, orderData.name)
                .replace(/\{\{order_number\}\}/g, orderData.order_number)
                .replace(/\{\{total\}\}/g, orderData.total.toFixed(2))
                .replace(/\{\{payment_method\}\}/g, orderData.payment_method)
                .replace(/\{\{delivery_method\}\}/g, orderData.delivery_method)
                .replace(/\{\{tracking_url\}\}/g, orderData.tracking_url)
                .replace(/\{\{unsubscribe_url\}\}/g, `https://trinibuild.com/unsubscribe?email=${orderData.email}&store=${storeId}`);

            let subject = template.subject
                .replace(/\{\{order_number\}\}/g, orderData.order_number)
                .replace(/\{\{store_name\}\}/g, store.name);

            await supabase.from('email_queue').insert({
                to_email: orderData.email,
                to_name: orderData.name,
                from_name: store.name,
                subject,
                body_html: html,
                store_id: storeId,
                type: 'order_confirmation',
                status: 'queued',
                created_at: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Order confirmation email failed:', error);
            return false;
        }
    },

    // ─── Analytics ──────────────────────────────────────────────────────

    async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('stats')
            .eq('id', campaignId)
            .single();

        if (error) return null;
        return data.stats as CampaignStats;
    },

    async getOverviewStats(storeId: string): Promise<{
        total_subscribers: number;
        active_subscribers: number;
        total_campaigns: number;
        avg_open_rate: number;
        avg_click_rate: number;
    }> {
        const [subscribers, campaigns] = await Promise.all([
            this.getSubscribers(storeId),
            this.getCampaigns(storeId)
        ]);

        const active = subscribers.filter(s => s.status === 'active');
        const sentCampaigns = campaigns.filter(c => c.status === 'sent');
        const avgOpen = sentCampaigns.length > 0
            ? sentCampaigns.reduce((sum, c) => sum + (c.stats?.open_rate || 0), 0) / sentCampaigns.length
            : 0;
        const avgClick = sentCampaigns.length > 0
            ? sentCampaigns.reduce((sum, c) => sum + (c.stats?.click_rate || 0), 0) / sentCampaigns.length
            : 0;

        return {
            total_subscribers: subscribers.length,
            active_subscribers: active.length,
            total_campaigns: campaigns.length,
            avg_open_rate: Math.round(avgOpen * 100) / 100,
            avg_click_rate: Math.round(avgClick * 100) / 100
        };
    }
};
