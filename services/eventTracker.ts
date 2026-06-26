import { supabase } from './supabaseClient';

/**
 * Event Tracking Service
 * Fire-and-forget — never blocks the UI. Errors are silently swallowed.
 * Batches events in memory and flushes every 10s or when queue hits 20 events.
 */

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_BATCH_SIZE = 20;
const SESSION_KEY = 'juvay_session_id';

let currentUserId: string | null = null;
let currentIsland: string | null = null;
let sessionId: string | null = null;

/* ---------- session id (sessionStorage, NOT localStorage) ---------- */
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback RFC4122-ish
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function getSessionId(): string {
    if (sessionId) return sessionId;
    try {
        const existing = sessionStorage.getItem(SESSION_KEY);
        if (existing) {
            sessionId = existing;
            return sessionId;
        }
    } catch {
        /* sessionStorage unavailable — fall through to generation */
    }
    sessionId = generateUUID();
    try {
        sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
        /* ignore */
    }
    return sessionId;
}

/* ---------- simple fingerprint (NOT a real IP) ---------- */
function generateIpHash(): string {
    try {
        const ua = navigator.userAgent || '';
        const ts = String(Date.now());
        const seed = ua + ts;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = (hash << 5) - hash + seed.charCodeAt(i);
            hash |= 0; // force 32-bit
        }
        return 'fp_' + Math.abs(hash).toString(16) + '_' + ts.slice(-6);
    } catch {
        return 'fp_unknown';
    }
}

/* ---------- queue + flush ---------- */
interface QueueRow {
    user_id: string | null;
    session_id: string;
    event_type: string;
    event_category: string;
    properties: Record<string, any>;
    island: string | null;
    page_url: string;
    referrer: string | null;
    user_agent: string;
    ip_hash: string;
}

const queue: QueueRow[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function ensureTimer(): void {
    if (flushTimer) return;
    if (typeof window === 'undefined') return;
    try {
        flushTimer = setInterval(() => {
            void flush();
        }, FLUSH_INTERVAL_MS);
        // Don't keep the process alive for this timer
        if (flushTimer && typeof (flushTimer as any).unref === 'function') {
            (flushTimer as any).unref();
        }
    } catch {
        /* ignore */
    }
}

async function flush(): Promise<void> {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    try {
        const { error } = await supabase.from('platform_events').insert(batch);
        if (error) {
            // Silently swallow — never surface to UI
        }
    } catch {
        /* swallowed */
    }
}

/* ---------- public API ---------- */

export const setUserId = (id: string | null): void => {
    currentUserId = id;
};

export const setIsland = (island: string): void => {
    currentIsland = island;
};

export const track = (
    eventType: string,
    category: string,
    properties?: Record<string, any>
): void => {
    try {
        const row: QueueRow = {
            user_id: currentUserId,
            session_id: getSessionId(),
            event_type: eventType,
            event_category: category,
            properties: { ...(properties || {}), timestamp: Date.now() },
            island: currentIsland,
            page_url: typeof window !== 'undefined' ? window.location.pathname : null as any,
            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
            user_agent:
                typeof navigator !== 'undefined'
                    ? navigator.userAgent.substring(0, 200)
                    : '',
            ip_hash: generateIpHash(),
        };
        queue.push(row);
        ensureTimer();
        if (queue.length >= FLUSH_BATCH_SIZE) {
            void flush();
        }
    } catch {
        /* never let tracking throw */
    }
};

export const trackPageView = (path: string): void => {
    track('page_view', 'navigation', { path });
};

export const trackSearch = (query: string, results: number): void => {
    track('search', 'engagement', { query, results });
};

export const trackProductView = (
    productId: string,
    productName: string,
    price: number,
    storeId: string
): void => {
    track('product_view', 'commerce', { product_id: productId, product_name: productName, price, store_id: storeId });
};

export const trackAddToCart = (
    productId: string,
    productName: string,
    price: number
): void => {
    track('add_to_cart', 'commerce', { product_id: productId, product_name: productName, price });
};

export const trackOrderPlaced = (orderId: string, total: number, method: string): void => {
    track('order_placed', 'commerce', { order_id: orderId, total, method });
};

export const trackStoreView = (storeId: string, storeName: string, island: string): void => {
    track('store_view', 'discovery', { store_id: storeId, store_name: storeName, island });
};

// Flush remaining events when the user navigates away / closes tab
if (typeof window !== 'undefined') {
    try {
        window.addEventListener('beforeunload', () => {
            if (queue.length > 0) {
                void flush();
            }
        });
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && queue.length > 0) {
                void flush();
            }
        });
    } catch {
        /* ignore */
    }
}
