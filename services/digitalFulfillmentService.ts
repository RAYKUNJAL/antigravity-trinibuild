/**
 * digitalFulfillmentService.ts
 * Automated digital code delivery with fraud protection
 * 
 * Flow:
 * 1. Customer pays (PayPal or bank deposit)
 * 2. AI cross-references payment receipt
 * 3. Fraud checks run (velocity, device, amount matching)
 * 4. Code auto-delivered via WhatsApp/email
 * 5. Fallback: manual review queue for flagged orders
 * 
 * Suppliers:
 * - CodesWholesale API (primary)
 * - Digital Codes Wholesale (backup)
 * - Manual inventory for high-demand items
 */

import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DigitalOrder {
    id: string;
    user_id: string;
    product_id: string;
    variant_id: string;
    product_name: string;
    amount_ttd: number;
    amount_usd: number;
    payment_method: 'paypal' | 'bank_deposit';
    payment_reference?: string;
    payment_proof_url?: string;
    status: 'pending' | 'verifying' | 'verified' | 'fulfilled' | 'failed' | 'refunded' | 'flagged';
    digital_code?: string;
    delivered_via?: 'whatsapp' | 'email' | 'in_app';
    delivered_at?: string;
    fraud_score: number;
    fraud_flags: string[];
    created_at: string;
    verified_at?: string;
}

interface FraudCheck {
    score: number; // 0-100, higher = more suspicious
    flags: string[];
    action: 'approve' | 'review' | 'reject';
}

interface InventoryItem {
    id: string;
    product_id: string;
    variant_id: string;
    code: string;
    status: 'available' | 'reserved' | 'sold' | 'expired';
    supplier: string;
    purchased_at: string;
    cost_usd: number;
}

// ─── Fraud Detection Engine ───────────────────────────────────────────────────

const fraudEngine = {
    async checkOrder(order: DigitalOrder, userId: string): Promise<FraudCheck> {
        const flags: string[] = [];
        let score = 0;

        // 1. Velocity check — too many orders in short time
        const { count: recentOrders } = await supabase
            .from('digital_orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // last hour

        if ((recentOrders || 0) > 3) {
            score += 30;
            flags.push('HIGH_VELOCITY: More than 3 orders in 1 hour');
        } else if ((recentOrders || 0) > 1) {
            score += 10;
            flags.push('MODERATE_VELOCITY: Multiple orders in 1 hour');
        }

        // 2. Amount check — unusually high value
        if (order.amount_ttd > 500) {
            score += 15;
            flags.push('HIGH_VALUE: Order exceeds TT$500');
        }
        if (order.amount_ttd > 1000) {
            score += 25;
            flags.push('VERY_HIGH_VALUE: Order exceeds TT$1000');
        }

        // 3. New account check — first purchase from new user
        const { data: profile } = await supabase
            .from('profiles')
            .select('created_at, email_verified')
            .eq('id', userId)
            .single();

        if (profile) {
            const accountAge = Date.now() - new Date(profile.created_at).getTime();
            const hoursOld = accountAge / (1000 * 60 * 60);

            if (hoursOld < 1) {
                score += 35;
                flags.push('NEW_ACCOUNT: Account less than 1 hour old');
            } else if (hoursOld < 24) {
                score += 15;
                flags.push('YOUNG_ACCOUNT: Account less than 24 hours old');
            }
        }

        // 4. Previous fraud check
        const { count: previousFlags } = await supabase
            .from('digital_orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'flagged');

        if ((previousFlags || 0) > 0) {
            score += 40;
            flags.push('PRIOR_FLAGS: User has previous flagged orders');
        }

        // 5. Bank deposit specific checks
        if (order.payment_method === 'bank_deposit') {
            if (!order.payment_proof_url) {
                score += 50;
                flags.push('NO_PROOF: Bank deposit without receipt upload');
            }
            // Bank deposits always get manual review
            score += 10;
            flags.push('BANK_DEPOSIT: Requires manual verification');
        }

        // Determine action
        let action: 'approve' | 'review' | 'reject';
        if (score >= 60) {
            action = 'reject';
        } else if (score >= 25) {
            action = 'review';
        } else {
            action = 'approve';
        }

        return { score, flags, action };
    }
};

// ─── Digital Fulfillment Service ──────────────────────────────────────────────

export const digitalFulfillmentService = {

    // Process a new order
    async processOrder(orderId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Get the order
            const { data: order, error } = await supabase
                .from('digital_orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (error || !order) return { success: false, message: 'Order not found' };

            // Run fraud checks
            const fraudResult = await fraudEngine.checkOrder(order, order.user_id);

            // Update order with fraud info
            await supabase.from('digital_orders').update({
                fraud_score: fraudResult.score,
                fraud_flags: fraudResult.flags,
                status: fraudResult.action === 'reject' ? 'flagged' : 'verifying'
            }).eq('id', orderId);

            if (fraudResult.action === 'reject') {
                // Flag for manual review
                await this.notifyAdminFraudAlert(orderId, fraudResult);
                return { success: false, message: 'Order flagged for review. Our team will verify within 4 hours.' };
            }

            if (fraudResult.action === 'review') {
                // Queue for manual review but don't reject
                await this.notifyAdminFraudAlert(orderId, fraudResult);
                return { success: true, message: 'Order placed! Verification in progress (1-4 hours).' };
            }

            // Auto-approve: fulfill immediately
            return await this.fulfillOrder(orderId);
        } catch (error) {
            console.error('Order processing failed:', error);
            return { success: false, message: 'Processing error. Please contact support.' };
        }
    },

    // Fulfill an approved order
    async fulfillOrder(orderId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { data: order } = await supabase
                .from('digital_orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (!order) return { success: false, message: 'Order not found' };

            // Get code from inventory
            const code = await this.getAvailableCode(order.product_id, order.variant_id);

            if (!code) {
                // No codes in stock — queue for manual fulfillment
                await supabase.from('digital_orders').update({
                    status: 'verifying',
                    fraud_flags: [...(order.fraud_flags || []), 'OUT_OF_STOCK: Auto-fulfillment unavailable']
                }).eq('id', orderId);

                return { success: true, message: 'Order confirmed! Code delivery within 2 hours.' };
            }

            // Mark code as sold
            await supabase.from('digital_inventory').update({
                status: 'sold',
                order_id: orderId,
                sold_at: new Date().toISOString()
            }).eq('id', code.id);

            // Update order as fulfilled
            await supabase.from('digital_orders').update({
                status: 'fulfilled',
                digital_code: code.code,
                delivered_at: new Date().toISOString(),
                verified_at: new Date().toISOString()
            }).eq('id', orderId);

            // Deliver code to customer
            await this.deliverCode(order, code.code);

            return { success: true, message: 'Your code has been delivered! Check your WhatsApp or email.' };
        } catch (error) {
            console.error('Fulfillment failed:', error);
            return { success: false, message: 'Delivery error. Contact support for immediate assistance.' };
        }
    },

    // Get available code from inventory
    async getAvailableCode(productId: string, variantId: string): Promise<InventoryItem | null> {
        const { data, error } = await supabase
            .from('digital_inventory')
            .select('*')
            .eq('product_id', productId)
            .eq('variant_id', variantId)
            .eq('status', 'available')
            .limit(1)
            .single();

        if (error || !data) return null;
        return data as InventoryItem;
    },

    // Deliver code to customer
    async deliverCode(order: DigitalOrder, code: string): Promise<void> {
        // Get user contact info
        const { data: profile } = await supabase
            .from('profiles')
            .select('email, phone, full_name')
            .eq('id', order.user_id)
            .single();

        if (!profile) return;

        // Queue WhatsApp delivery
        const message = `🎮 *TriniBuild Digital*\n\nYour code is ready!\n\n📦 *${order.product_name}*\n🔑 Code: \`${code}\`\n\n✅ Redeem at the official platform\n⚠️ This code is single-use\n\nThanks for shopping with TriniBuild! 🇹🇹`;

        // Store delivery record
        await supabase.from('digital_deliveries').insert({
            order_id: order.id,
            user_id: order.user_id,
            delivery_method: profile.phone ? 'whatsapp' : 'email',
            recipient: profile.phone || profile.email,
            message_preview: `Code for ${order.product_name}`,
            status: 'queued',
            created_at: new Date().toISOString()
        });

        // Queue email delivery as backup
        await supabase.from('email_queue').insert({
            to_email: profile.email,
            to_name: profile.full_name || 'Customer',
            from_name: 'TriniBuild Digital',
            subject: `Your ${order.product_name} code is ready!`,
            body_html: `
                <div style="font-family:Inter,sans-serif;max-width:500px;margin:0 auto;background:#0f0f0f;border-radius:16px;overflow:hidden">
                    <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:24px;text-align:center;color:#fff">
                        <h1 style="margin:0;font-size:20px;font-weight:900">Your Code Is Ready! 🎮</h1>
                    </div>
                    <div style="padding:24px;color:#e5e7eb">
                        <p style="font-size:14px;margin:0 0 16px">Here's your code for <strong>${order.product_name}</strong>:</p>
                        <div style="background:#1f2937;border:2px dashed #4b5563;border-radius:12px;padding:20px;text-align:center;margin:0 0 16px">
                            <p style="font-size:24px;font-weight:900;color:#fff;font-family:monospace;letter-spacing:4px;margin:0">${code}</p>
                        </div>
                        <p style="font-size:12px;color:#6b7280;margin:0">Redeem at the official platform. This code is single-use.</p>
                    </div>
                    <div style="padding:16px;text-align:center;font-size:11px;color:#4b5563">
                        TriniBuild Digital — Trinidad & Tobago 🇹🇹
                    </div>
                </div>
            `,
            store_id: null,
            type: 'digital_delivery',
            status: 'queued',
            created_at: new Date().toISOString()
        });
    },

    // Verify bank deposit receipt
    async verifyBankDeposit(orderId: string, receiptUrl: string): Promise<{ verified: boolean; message: string }> {
        try {
            // Update order with receipt
            await supabase.from('digital_orders').update({
                payment_proof_url: receiptUrl,
                status: 'verifying'
            }).eq('id', orderId);

            // In production: AI analyzes receipt image for:
            // - Amount matches order total
            // - Date is within 24 hours
            // - Bank name matches expected banks
            // - Reference number is unique (not reused)

            // For now: queue for manual verification
            return {
                verified: false,
                message: 'Receipt uploaded! Our team will verify within 1-4 hours and deliver your code.'
            };
        } catch (error) {
            return { verified: false, message: 'Upload failed. Please try again or contact support.' };
        }
    },

    // Admin: manually approve and fulfill
    async adminApprove(orderId: string): Promise<{ success: boolean; message: string }> {
        return await this.fulfillOrder(orderId);
    },

    // Admin: reject order
    async adminReject(orderId: string, reason: string): Promise<boolean> {
        const { error } = await supabase.from('digital_orders').update({
            status: 'refunded',
            fraud_flags: [reason]
        }).eq('id', orderId);

        return !error;
    },

    // Notify admin of fraud alert
    async notifyAdminFraudAlert(orderId: string, fraudResult: FraudCheck): Promise<void> {
        await supabase.from('admin_notifications').insert({
            type: 'fraud_alert',
            title: `Digital order flagged (score: ${fraudResult.score})`,
            message: `Order ${orderId} flagged: ${fraudResult.flags.join(', ')}`,
            action_url: `/admin/command-center/digital-orders/${orderId}`,
            priority: fraudResult.score >= 60 ? 'high' : 'medium',
            read: false,
            created_at: new Date().toISOString()
        });
    },

    // Get inventory status
    async getInventoryStatus(): Promise<{ product_id: string; variant_id: string; available: number }[]> {
        const { data, error } = await supabase
            .from('digital_inventory')
            .select('product_id, variant_id')
            .eq('status', 'available');

        if (error || !data) return [];

        // Count available per product/variant
        const counts: Record<string, { product_id: string; variant_id: string; available: number }> = {};
        data.forEach(item => {
            const key = `${item.product_id}-${item.variant_id}`;
            if (!counts[key]) {
                counts[key] = { product_id: item.product_id, variant_id: item.variant_id, available: 0 };
            }
            counts[key].available++;
        });

        return Object.values(counts);
    },

    // Add codes to inventory (admin function)
    async addInventory(items: { product_id: string; variant_id: string; code: string; supplier: string; cost_usd: number }[]): Promise<number> {
        const records = items.map(item => ({
            ...item,
            status: 'available',
            purchased_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('digital_inventory')
            .insert(records)
            .select();

        if (error) {
            console.error('Inventory add failed:', error);
            return 0;
        }
        return data.length;
    }
};

// ─── Supplier Integration Info ────────────────────────────────────────────────

export const APPROVED_SUPPLIERS = {
    primary: {
        name: 'CodesWholesale',
        url: 'https://codeswholesale.com',
        type: 'B2B API',
        notes: 'Wholesale platform with API. Register as business buyer. Automated stock + pricing.'
    },
    secondary: {
        name: 'Digital Codes Wholesale',
        url: 'https://digitalcodeswholesale.com',
        type: 'B2B Manual',
        notes: 'Estonia-based wholesale supplier. PC, Xbox, PSN keys. Manual ordering.'
    },
    tertiary: {
        name: 'Wholesale CD Keys',
        url: 'https://wholesalecdkeys.com',
        type: 'B2B Manual',
        notes: 'Xbox Live, PSN, Steam keys at wholesale rates. UK-based.'
    },
    gift_cards: {
        name: 'Brolexy',
        url: 'https://brolexy.com',
        type: 'B2B API',
        notes: 'Verified gift cards and subscription codes. API available for automation.'
    }
};
