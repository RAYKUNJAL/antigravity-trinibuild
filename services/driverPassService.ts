// =============================================================
// Driver Pass + COP Service — Caribbean cash-market model
// Proven pattern (Namma Yatri / Rapido / Ola India, 2022-2026):
// zero commission, driver keeps 100% of every fare, pays a small
// flat access pass. Trust-based: 30-day free trial → daily/weekly
// pass paid by WAM, bank deposit + receipt upload, or card later.
// 48-hour grace period before blocking (low-churn strategy).
// Also: Cash-on-Pickup (COP) orders with time-based pickup windows.
// =============================================================
import { supabase } from './supabaseClient';

// ---------- Types ----------
export interface PassPlan {
    slug: string; name: string; price_ttd: number;
    period: 'trial' | 'day' | 'week' | 'month';
    tier: 'basic' | 'pro' | 'fleet'; features: string[]; sort: number;
    services?: JobType[]; free_ride_threshold?: number | null;
}

export interface DriverPass {
    id: string; driver_user_id: string; plan_slug: string;
    status: 'trial' | 'active' | 'grace' | 'expired' | 'blocked';
    trial_ends_at: string | null; period_start: string | null; period_end: string | null;
    grace_until: string | null; rides_completed_this_period: number; island_code: string;
}

export interface IslandConfig {
    code: string; name: string; currency: string; currency_symbol: string;
    ride_base_fare: number; ride_per_km: number; ride_per_min: number; rides_enabled: boolean;
}

const GRACE_HOURS = 48;
const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ---------- Islands ----------
export async function getIslands(): Promise<IslandConfig[]> {
    const { data, error } = await supabase.from('island_config').select('*').eq('rides_enabled', true).order('name');
    if (error) throw error;
    return data as IslandConfig[];
}

// Island-aware fare estimate — replaces the hardcoded TT$5 base fare bug
export async function estimateFare(islandCode: string, distanceKm: number, durationMin: number) {
    const { data } = await supabase.from('island_config').select('*').eq('code', islandCode).single();
    const cfg = (data as IslandConfig) || { ride_base_fare: 25, ride_per_km: 4, ride_per_min: 0.5, currency_symbol: 'TT$', currency: 'TTD' } as IslandConfig;
    const fare = cfg.ride_base_fare + distanceKm * cfg.ride_per_km + durationMin * cfg.ride_per_min;
    return { fare: Math.round(fare * 100) / 100, currency: cfg.currency, symbol: cfg.currency_symbol };
}

// ---------- Driver pass ----------
export async function getPassPlans(): Promise<PassPlan[]> {
    const { data, error } = await supabase.from('driver_pass_plans').select('*').eq('active', true).order('sort');
    if (error) throw error;
    return data as PassPlan[];
}

export async function getMyPass(): Promise<DriverPass | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('driver_pass_subscriptions').select('*').eq('driver_user_id', user.id).maybeSingle();
    return data as DriverPass | null;
}

// New driver → start the 30-day free trial (idempotent)
export async function startFreeTrial(islandCode = 'TT'): Promise<DriverPass> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in first.');
    const existing = await getMyPass();
    if (existing) return existing;
    const trialEnd = new Date(Date.now() + 30 * 86400000).toISOString();
    const { data, error } = await supabase.from('driver_pass_subscriptions')
        .insert({ driver_user_id: user.id, plan_slug: 'trial', status: 'trial', trial_ends_at: trialEnd, island_code: islandCode })
        .select().single();
    if (error) throw error;
    return data as DriverPass;
}

// Live access check with automatic grace handling.
// Returns a rich status object the UI can render honestly.
export async function checkDriverAccess(): Promise<{
    canDrive: boolean;
    state: 'trial' | 'active' | 'grace' | 'expired' | 'none';
    message: string;
    daysLeft?: number;
    graceHoursLeft?: number;
}> {
    const pass = await getMyPass();
    const now = Date.now();
    if (!pass) return { canDrive: false, state: 'none', message: 'Start your free 30-day trial to begin accepting rides.' };

    if (pass.status === 'trial' && pass.trial_ends_at) {
        const ms = new Date(pass.trial_ends_at).getTime() - now;
        if (ms > 0) return { canDrive: true, state: 'trial', message: 'Free trial active — you keep 100% of every fare.', daysLeft: Math.ceil(ms / 86400000) };
    }
    if (pass.period_end && new Date(pass.period_end).getTime() > now) {
        const ms = new Date(pass.period_end).getTime() - now;
        return { canDrive: true, state: 'active', message: 'Pass active — you keep 100% of every fare.', daysLeft: Math.ceil(ms / 86400000) };
    }
    // Grace: 48h after expiry before blocking (proven low-churn tactic)
    const anchor = pass.period_end || pass.trial_ends_at;
    if (anchor) {
        const graceEnd = new Date(anchor).getTime() + GRACE_HOURS * 3600000;
        if (graceEnd > now) {
            const hrs = Math.ceil((graceEnd - now) / 3600000);
            // persist grace state (best-effort)
            supabase.from('driver_pass_subscriptions')
                .update({ status: 'grace', grace_until: new Date(graceEnd).toISOString() })
                .eq('id', pass.id).then(() => { });
            return { canDrive: true, state: 'grace', message: `Your pass expired — you have ${hrs}h grace to renew before rides pause.`, graceHoursLeft: hrs };
        }
    }
    supabase.from('driver_pass_subscriptions').update({ status: 'expired' }).eq('id', pass.id).then(() => { });
    return { canDrive: false, state: 'expired', message: 'Your pass has expired. Renew by WAM or bank deposit to keep driving — you always keep 100% of fares.' };
}

// Reference code: DP-[PLAN]-[USER6]-[TS4] — must go on the WAM note / deposit slip
export function generatePassReference(userId: string, planSlug: string): string {
    const plan = planSlug === 'weekly_pro' ? 'WKP' : planSlug === 'weekly_basic' ? 'WKB' : planSlug === 'daily' ? 'DAY' : planSlug.slice(0, 3).toUpperCase();
    return `DP-${plan}-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

// Step 1: driver picks a plan + method → gets deposit details + reference code
const TTD_TO_USD = 6.8; // PayPal has no TTD support — charge USD equivalent
export const PAYPAL_BUSINESS = 'raykunjal@gmail.com';

export function buildPayPalUrl(referenceCode: string, amountTtd: number, itemLabel: string): string {
    const usd = (amountTtd / TTD_TO_USD).toFixed(2);
    const params = new URLSearchParams({
        cmd: '_xclick', business: PAYPAL_BUSINESS,
        item_name: `${itemLabel} — ${referenceCode}`,
        amount: usd, currency_code: 'USD', no_shipping: '1',
    });
    return `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;
}

export async function requestPassPayment(planSlug: string, method: 'wam' | 'bank' | 'card' | 'credit' | 'paypal', periods = 1) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in first.');
    const { data: plan, error: pe } = await supabase.from('driver_pass_plans').select('*').eq('slug', planSlug).single();
    if (pe || !plan) throw new Error('Plan not found.');
    const reference_code = generatePassReference(user.id, planSlug);
    const amount_ttd = Number(plan.price_ttd) * periods;
    const { data, error } = await supabase.from('driver_pass_payments')
        .insert({ driver_user_id: user.id, plan_slug: planSlug, amount_ttd, method, reference_code, periods_paid: periods, status: 'pending' })
        .select().single();
    if (error) throw error;
    return {
        payment: data,
        paypalUrl: method === 'paypal' ? buildPayPalUrl(reference_code, amount_ttd, plan.name) : undefined,
        instructions: method === 'paypal'
            ? `Pay US$${(amount_ttd / TTD_TO_USD).toFixed(2)} (≈ TT$${amount_ttd.toFixed(2)}) via PayPal — your reference ${reference_code} is in the item name. After paying, upload your PayPal receipt screenshot here.`
            : method === 'wam'
            ? `Send ${amount_ttd.toFixed(2)} TTD via WAM and put ${reference_code} in the payment note. Then upload your WAM screenshot here.`
            : method === 'bank'
                ? `Deposit exactly ${amount_ttd.toFixed(2)} TTD at any branch to the R&R Digital Solutions Ltd account and write ${reference_code} as the narration. Then upload your teller slip here.`
                : `Reference: ${reference_code}`,
    };
}

// Step 2: driver uploads proof (WAM screenshot or bank slip)
export async function submitPassProof(referenceCode: string, proofUrl: string, bankName?: string) {
    const { data, error } = await supabase.from('driver_pass_payments')
        .update({ proof_url: proofUrl, bank_name: bankName || null, status: 'submitted' })
        .eq('reference_code', referenceCode).select().single();
    if (error) throw error;
    return data;
}

// Step 3 (admin, after verifying the slip): activates/extends the pass
export async function activatePassFromPayment(paymentId: string) {
    const { data: pay, error } = await supabase.from('driver_pass_payments')
        .update({ status: 'verified', verified_at: new Date().toISOString() })
        .eq('id', paymentId).select().single();
    if (error || !pay) throw error || new Error('Payment not found');
    const days = pay.plan_slug === 'daily' ? 1 : 7;
    const totalDays = days * (pay.periods_paid || 1);
    const existing = await supabase.from('driver_pass_subscriptions').select('*').eq('driver_user_id', pay.driver_user_id).maybeSingle();
    const baseStart = existing.data?.period_end && new Date(existing.data.period_end) > new Date()
        ? new Date(existing.data.period_end) : new Date();
    const period_end = new Date(baseStart.getTime() + totalDays * 86400000).toISOString();
    const { data: sub, error: se } = await supabase.from('driver_pass_subscriptions')
        .upsert({
            driver_user_id: pay.driver_user_id, plan_slug: pay.plan_slug, status: 'active',
            period_start: baseStart.toISOString(), period_end, grace_until: null,
            rides_completed_this_period: 0, updated_at: new Date().toISOString(),
        }, { onConflict: 'driver_user_id' }).select().single();
    if (se) throw se;
    return sub;
}

export async function getMyPassPayments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('driver_pass_payments').select('*').eq('driver_user_id', user.id).order('created_at', { ascending: false });
    return data || [];
}

// =============================================================
// COP — CASH ON PICKUP with time-based windows
// Customer reserves + picks a pickup time slot; merchant filters
// their queue by window; 4-digit code verifies handover; cash at counter.
// =============================================================
export interface PickupWindow { start: string; end: string; label: string }

// Generate today/tomorrow pickup slots from store hours (default 9–18, 1h slots)
export function generatePickupWindows(daysAhead = 2, openHour = 9, closeHour = 18, slotHours = 1): PickupWindow[] {
    const out: PickupWindow[] = [];
    const now = new Date();
    for (let d = 0; d < daysAhead; d++) {
        const day = new Date(now); day.setDate(now.getDate() + d);
        for (let h = openHour; h + slotHours <= closeHour; h += slotHours) {
            const start = new Date(day); start.setHours(h, 0, 0, 0);
            const end = new Date(day); end.setHours(h + slotHours, 0, 0, 0);
            if (start.getTime() < now.getTime() + 30 * 60000) continue; // 30-min lead time
            const dayLabel = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : start.toLocaleDateString(undefined, { weekday: 'short' });
            out.push({
                start: start.toISOString(), end: end.toISOString(),
                label: `${dayLabel} ${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
            });
        }
    }
    return out;
}

export async function createPickupOrder(input: {
    store_id: string; customer_name: string; customer_phone: string;
    items: { product_id: string; name: string; price: number; quantity: number }[];
    pickup_window_start: string; pickup_window_end: string; island_code?: string;
}) {
    const subtotal = input.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const vat_amount = Math.round(subtotal * 0.125 * 100) / 100;
    const total_amount = subtotal + vat_amount; // no delivery fee on pickup
    const order_ref = `TB${new Date().toISOString().slice(2, 7).replace('-', '')}-${uid()}`;
    const pickup_code = String(Math.floor(1000 + Math.random() * 9000));
    const { data, error } = await supabase.from('cod_orders').insert({
        store_id: input.store_id, order_ref,
        customer_name: input.customer_name, customer_phone: input.customer_phone,
        items: input.items, subtotal, delivery_fee: 0, vat_amount, total_amount,
        fulfillment_type: 'pickup',
        pickup_window_start: input.pickup_window_start, pickup_window_end: input.pickup_window_end,
        pickup_code, island_code: input.island_code || 'TT',
        order_status: 'pending', payment_status: 'pending',
    }).select().single();
    if (error) throw error;
    return data;
}

// Merchant queue with TIME-BASED FILTERS
export async function getPickupOrders(storeId: string, filter: 'now' | 'today' | 'upcoming' | 'overdue' | 'all' = 'today') {
    let q = supabase.from('cod_orders').select('*').eq('store_id', storeId).eq('fulfillment_type', 'pickup')
        .not('order_status', 'in', '(cancelled,returned)').order('pickup_window_start');
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    if (filter === 'now') q = q.lte('pickup_window_start', now.toISOString()).gte('pickup_window_end', now.toISOString()).is('picked_up_at', null);
    if (filter === 'today') q = q.gte('pickup_window_start', startOfDay.toISOString()).lte('pickup_window_start', endOfDay.toISOString());
    if (filter === 'upcoming') q = q.gt('pickup_window_start', now.toISOString());
    if (filter === 'overdue') q = q.lt('pickup_window_end', now.toISOString()).is('picked_up_at', null);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
}

// Counter handover: verify the 4-digit code, mark paid + picked up
export async function completePickup(orderId: string, code: string) {
    const { data: order, error } = await supabase.from('cod_orders').select('id,pickup_code').eq('id', orderId).single();
    if (error || !order) throw error || new Error('Order not found');
    if (String(order.pickup_code) !== String(code).trim()) throw new Error('Pickup code does not match — ask the customer to check their confirmation.');
    const { data, error: ue } = await supabase.from('cod_orders')
        .update({ order_status: 'delivered', payment_status: 'collected', picked_up_at: new Date().toISOString() })
        .eq('id', orderId).select().single();
    if (ue) throw ue;
    return data;
}

// ---------- 3-in-1 service access (rideshare | delivery | courier) ----------
export type JobType = 'rideshare' | 'delivery' | 'courier';

// Which of the 3 services can this driver work right now?
// One pass, tier decides scope: Basic = rides + delivery, Pro/Fleet = + courier.
export async function checkServiceAccess(jobType: JobType): Promise<{ allowed: boolean; reason?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: false, reason: 'Please log in.' };
    const { data, error } = await supabase.rpc('driver_can_accept_job', { p_driver: user.id, p_job_type: jobType });
    if (error) return { allowed: false, reason: error.message };
    if (data === true) return { allowed: true };
    const access = await checkDriverAccess();
    if (!access.canDrive) return { allowed: false, reason: access.message };
    return {
        allowed: false,
        reason: jobType === 'courier'
            ? 'Courier jobs need the Weekly Pro pass (TT$100/wk) — upgrade to unlock packages, airport queue, and scheduled rides.'
            : 'This service is not included in your current pass.',
    };
}

// Courier booking fee (added to the CUSTOMER price at job creation — never
// deducted from the driver). Per-island from island_config.
export async function getCourierBookingFee(islandCode = 'TT'): Promise<{ fee: number; symbol: string }> {
    const { data } = await supabase.from('island_config').select('courier_booking_fee,currency_symbol').eq('code', islandCode).single();
    return { fee: Number(data?.courier_booking_fee ?? 10), symbol: data?.currency_symbol ?? 'TT$' };
}
