// =============================================================
// AI Website Builder Service — Wix-style full-site builder
// Works for both TriniBuild (T&T) and Juvay (Caribbean-wide).
// AI generation: tries the self-hosted AI server first, falls
// back to a local island-aware generation engine so the builder
// ALWAYS works even if the AI backend is offline.
// =============================================================
import { supabase } from './supabaseClient';

// ---------- Types ----------
export type SectionType =
    | 'hero' | 'about' | 'features' | 'products' | 'gallery'
    | 'testimonials' | 'hours' | 'faq' | 'contact' | 'cta' | 'payments';

export interface SiteSection {
    id: string;
    type: SectionType;
    enabled: boolean;
    data: Record<string, any>;
}

export interface SiteTheme {
    preset: string;
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    headingFont: string;
    bodyFont: string;
    radius: string;
    heroStyle?: 'gradient' | 'split' | 'minimal';
}

export interface BuilderSite {
    id?: string;
    owner_id?: string;
    store_id?: string | null;
    slug?: string | null;
    business_name: string;
    business_category: string;
    island: string;
    theme: SiteTheme;
    sections: SiteSection[];
    seo: { title: string; description: string; keywords: string[] };
    status: 'draft' | 'published';
    ai_generated?: boolean;
    published_at?: string | null;
    updated_at?: string;
}

export interface BusinessBrief {
    businessName: string;
    category: string;
    island: string;
    description: string;
    vibe: 'vibrant' | 'premium' | 'beachy' | 'minimal' | 'classic';
    whatsapp?: string;
    phone?: string;
    address?: string;
    email?: string;
    instagram?: string;
}

// ---------- Theme presets (island-flavored) ----------
export const THEME_PRESETS: Record<string, SiteTheme> = {
    carnival: {
        preset: 'carnival', primary: '#E61E2B', secondary: '#FFD700',
        background: '#0B0B0F', surface: '#16161D', text: '#FFFFFF', muted: '#9CA3AF',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '16px',
    },
    oceanBreeze: {
        preset: 'oceanBreeze', primary: '#0E9AA7', secondary: '#F6CD61',
        background: '#F8FDFE', surface: '#FFFFFF', text: '#0F2E33', muted: '#5B7A80',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '20px',
    },
    sunsetGold: {
        preset: 'sunsetGold', primary: '#F97316', secondary: '#7C2D12',
        background: '#FFFBF5', surface: '#FFFFFF', text: '#27150A', muted: '#8A6A55',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '14px',
    },
    midnightPremium: {
        preset: 'midnightPremium', primary: '#FFD700', secondary: '#E61E2B',
        background: '#050507', surface: '#101014', text: '#F5F5F5', muted: '#8B8B94',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '10px',
    },
    coconutCream: {
        preset: 'coconutCream', primary: '#166534', secondary: '#CA8A04',
        background: '#FDFDF8', surface: '#FFFFFF', text: '#1A2E1D', muted: '#6B7A6E',
        headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '24px',
    },
};

// ---------- COMMERCIAL TEMPLATES (full presets: theme + typography + hero style) ----------
export interface CommercialTemplate {
    name: string; tier: 'free' | 'pro'; category: string; theme: SiteTheme; heroStyle: 'gradient' | 'split' | 'minimal';
}
export const COMMERCIAL_TEMPLATES: CommercialTemplate[] = [
    { name: 'Island Kitchen', tier: 'free', category: 'Food & Restaurant', heroStyle: 'gradient',
      theme: { preset: 'islandKitchen', primary: '#D9432C', secondary: '#F5A524', background: '#141210', surface: '#1E1B17', text: '#FBF7F0', muted: '#A89F92', headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Inter', sans-serif", radius: '18px' } },
    { name: 'Runway Noir', tier: 'free', category: 'Fashion & Clothing', heroStyle: 'minimal',
      theme: { preset: 'runwayNoir', primary: '#111111', secondary: '#C9A96A', background: '#FAFAF8', surface: '#FFFFFF', text: '#111111', muted: '#6E6A63', headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Inter', sans-serif", radius: '2px' } },
    { name: 'Coconut Luxe', tier: 'pro', category: 'Beauty & Wellness', heroStyle: 'split',
      theme: { preset: 'coconutLuxe', primary: '#8C5E3C', secondary: '#D9B896', background: '#FBF6F0', surface: '#FFFFFF', text: '#2E2118', muted: '#8A7563', headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Inter', sans-serif", radius: '26px' } },
    { name: 'Tech Slate', tier: 'free', category: 'Electronics', heroStyle: 'gradient',
      theme: { preset: 'techSlate', primary: '#3B82F6', secondary: '#22D3EE', background: '#0A0F1A', surface: '#111827', text: '#F1F5F9', muted: '#7C8AA0', headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '12px' } },
    { name: 'Trade Pro', tier: 'free', category: 'Services', heroStyle: 'split',
      theme: { preset: 'tradePro', primary: '#166534', secondary: '#EAB308', background: '#FCFDF9', surface: '#FFFFFF', text: '#14201A', muted: '#5F6F66', headingFont: "'Inter', sans-serif", bodyFont: "'Inter', sans-serif", radius: '10px' } },
    { name: 'Carnival Nights', tier: 'pro', category: 'Events', heroStyle: 'gradient',
      theme: { preset: 'carnivalNights', primary: '#E61E2B', secondary: '#FFD700', background: '#0B0508', surface: '#171015', text: '#FFF8F0', muted: '#A08D96', headingFont: "'Playfair Display', Georgia, serif", bodyFont: "'Inter', sans-serif", radius: '16px' } },
];

const VIBE_TO_PRESET: Record<BusinessBrief['vibe'], string> = {
    vibrant: 'carnival', premium: 'midnightPremium', beachy: 'oceanBreeze',
    minimal: 'coconutCream', classic: 'sunsetGold',
};

// ---------- Local AI copy engine (offline fallback) ----------
// Category-aware, island-aware copy so generated sites feel local,
// never lorem-ipsum. This is what guarantees "AI builder" works today.
const CATEGORY_COPY: Record<string, { heroTag: string; heroSub: string; features: [string, string][]; faq: [string, string][] }> = {
    'Food & Restaurant': {
        heroTag: 'Real {island} flavour, made fresh',
        heroSub: 'Order from {name} — authentic dishes, generous portions, and delivery straight to your door. Cash on delivery accepted.',
        features: [
            ['Fresh Daily', 'Everything prepared fresh each morning — no shortcuts.'],
            ['Cash on Delivery', 'Pay when your food arrives. No card needed.'],
            ['WhatsApp Ordering', 'Message us your order and we confirm in minutes.'],
        ],
        faq: [
            ['Do you deliver?', 'Yes — we deliver across the area. Delivery fee depends on distance, and you pay cash on delivery.'],
            ['How do I order?', 'Browse the menu, add to cart, and checkout — or WhatsApp us directly.'],
        ],
    },
    'Fashion & Clothing': {
        heroTag: 'Style made for the islands',
        heroSub: '{name} brings you looks that turn heads — from casual wear to fete-ready fits. Shop online, pay cash on delivery.',
        features: [
            ['New Drops Weekly', 'Fresh styles added every week — follow us so you never miss out.'],
            ['Try Before You Pay', 'Cash on delivery means you pay when it reaches you.'],
            ['Size Help on WhatsApp', 'Not sure of your size? Message us and we will sort you out.'],
        ],
        faq: [
            ['Can I exchange an item?', 'Yes — message us within 48 hours of delivery and we will arrange it.'],
            ['Do you ship island-wide?', 'Yes, we deliver everywhere. Delivery cost shown at checkout.'],
        ],
    },
    'Beauty & Wellness': {
        heroTag: 'Look good. Feel better.',
        heroSub: '{name} — professional beauty and wellness services in {island}. Book online in seconds.',
        features: [
            ['Easy Booking', 'Pick your service and time — confirmation comes by WhatsApp.'],
            ['Professional Products', 'We only use trusted, quality products.'],
            ['Flexible Payment', 'Pay cash at your appointment or in advance.'],
        ],
        faq: [
            ['How do I book?', 'Use the contact section below or WhatsApp us — we reply fast.'],
            ['What if I need to reschedule?', 'No problem — give us 24 hours notice and we will move your slot.'],
        ],
    },
    Services: {
        heroTag: 'Trusted local service, done right',
        heroSub: '{name} — reliable, professional, and right here in {island}. Get a quote today.',
        features: [
            ['Free Quotes', 'Tell us what you need and get a clear price up front.'],
            ['Local & Reliable', 'We show up on time and stand by our work.'],
            ['Pay How You Want', 'Cash, bank transfer, or online — your choice.'],
        ],
        faq: [
            ['How fast can you start?', 'Most jobs can be scheduled within a few days — message us for availability.'],
            ['Do you offer a guarantee?', 'Yes — we stand behind every job we do.'],
        ],
    },
    Electronics: {
        heroTag: 'Tech you can trust',
        heroSub: '{name} — quality electronics with real warranty, delivered anywhere in {island}. Cash on delivery available.',
        features: [
            ['Genuine Products', 'Everything we sell is authentic and tested.'],
            ['Warranty Included', 'Buy with confidence — we back what we sell.'],
            ['COD Available', 'Inspect your item, then pay. Simple.'],
        ],
        faq: [
            ['Is there a warranty?', 'Yes — warranty terms are listed on each product.'],
            ['Can I test before paying?', 'With cash on delivery you can inspect the item on arrival.'],
        ],
    },
};

const DEFAULT_COPY = CATEGORY_COPY['Services'];

const uid = () => Math.random().toString(36).slice(2, 10);

function fill(t: string, brief: BusinessBrief) {
    return t.replaceAll('{name}', brief.businessName).replaceAll('{island}', brief.island);
}

export function generateSiteLocal(brief: BusinessBrief): BuilderSite {
    const copy = CATEGORY_COPY[brief.category] || DEFAULT_COPY;
    const theme = { ...THEME_PRESETS[VIBE_TO_PRESET[brief.vibe]] };

    const sections: SiteSection[] = [
        {
            id: uid(), type: 'hero', enabled: true, data: {
                eyebrow: `🏝️ ${brief.island}`,
                headline: brief.businessName,
                tagline: fill(copy.heroTag, brief),
                subheadline: brief.description?.trim() ? brief.description : fill(copy.heroSub, brief),
                ctaText: 'Shop Now', ctaLink: '#products',
                secondaryCtaText: brief.whatsapp ? 'WhatsApp Us' : 'Contact Us',
                secondaryCtaLink: brief.whatsapp ? `https://wa.me/${brief.whatsapp.replace(/\D/g, '')}` : '#contact',
            },
        },
        {
            id: uid(), type: 'about', enabled: true, data: {
                title: `About ${brief.businessName}`,
                body: brief.description?.trim()
                    ? brief.description
                    : fill(`{name} is a proud {island} business built on quality and trust. We started with one goal — to serve our community with the best, at fair prices, with service that feels like family.`, brief),
            },
        },
        {
            id: uid(), type: 'features', enabled: true, data: {
                title: 'Why Choose Us',
                items: copy.features.map(([t, d]) => ({ id: uid(), title: t, description: fill(d, brief) })),
            },
        },
        {
            id: uid(), type: 'products', enabled: true, data: {
                title: 'Our Products', subtitle: 'Browse and order online — cash on delivery available.', source: 'store',
            },
        },
        {
            id: uid(), type: 'testimonials', enabled: true, data: {
                title: 'What Customers Say',
                items: [
                    { id: uid(), name: 'A happy customer', text: 'Fast delivery and great service — will definitely order again!', stars: 5 },
                    { id: uid(), name: 'Local supporter', text: 'Proud to support a real local business. Quality is top-tier.', stars: 5 },
                ],
                note: 'Replace these with your real reviews as they come in.',
            },
        },
        {
            id: uid(), type: 'hours', enabled: true, data: {
                title: 'Opening Hours',
                rows: [
                    { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
                    { day: 'Saturday', hours: '10:00 AM – 4:00 PM' },
                    { day: 'Sunday', hours: 'Closed' },
                ],
            },
        },
        { id: uid(), type: 'faq', enabled: true, data: { title: 'Common Questions', items: copy.faq.map(([q, a]) => ({ id: uid(), q, a: fill(a, brief) })) } },
        {
            id: uid(), type: 'payments', enabled: true, data: {
                title: 'How You Can Pay',
                subtitle: 'Cash-friendly, always. No card needed.',
                methods: [
                    { id: uid(), icon: '💵', name: 'Cash on Delivery', detail: 'Pay when your order reaches you' },
                    { id: uid(), icon: '🏪', name: 'Cash on Pickup', detail: 'Reserve online, pay at the counter' },
                ],
            },
        },
        {
            id: uid(), type: 'contact', enabled: true, data: {
                title: 'Get In Touch',
                phone: brief.phone || '', whatsapp: brief.whatsapp || '', email: brief.email || '',
                address: brief.address || '', instagram: brief.instagram || '',
            },
        },
        {
            id: uid(), type: 'cta', enabled: true, data: {
                headline: 'Ready to order?',
                sub: 'Browse our products and checkout in under a minute — cash on delivery accepted.',
                ctaText: 'Start Shopping', ctaLink: '#products',
            },
        },
    ];

    return {
        business_name: brief.businessName,
        business_category: brief.category,
        island: brief.island,
        theme,
        sections,
        seo: {
            title: `${brief.businessName} | ${brief.category} in ${brief.island}`,
            description: fill(copy.heroSub, brief).slice(0, 155),
            keywords: [brief.businessName, brief.category, brief.island, 'cash on delivery', 'shop online'],
        },
        status: 'draft',
        ai_generated: true,
    };
}

// ---------- Backend AI (upgrade path) ----------
const AI_SERVER = (import.meta as any).env?.VITE_AI_SERVER_URL || '';

export async function generateSiteAI(brief: BusinessBrief): Promise<BuilderSite> {
    const local = generateSiteLocal(brief);
    if (!AI_SERVER) return local;
    try {
        const res = await fetch(`${AI_SERVER}/generate-site-copy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief }),
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) return local;
        const ai = await res.json();
        // Merge AI copy into the locally-generated structure (structure is ours, words are AI's)
        return {
            ...local,
            sections: local.sections.map((s) => (ai.sections?.[s.type] ? { ...s, data: { ...s.data, ...ai.sections[s.type] } } : s)),
            seo: ai.seo ? { ...local.seo, ...ai.seo } : local.seo,
        };
    } catch {
        return local; // AI backend down → local engine keeps the builder fully functional
    }
}

// Regenerate a single section's copy (used by the ✨ button in the editor)
export async function regenerateSectionCopy(site: BuilderSite, section: SiteSection, brief: BusinessBrief): Promise<SiteSection> {
    if (AI_SERVER) {
        try {
            const res = await fetch(`${AI_SERVER}/generate-site-copy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brief, only: section.type }),
                signal: AbortSignal.timeout(15000),
            });
            if (res.ok) {
                const ai = await res.json();
                if (ai.sections?.[section.type]) return { ...section, data: { ...section.data, ...ai.sections[section.type] } };
            }
        } catch { /* fall through to local */ }
    }
    const fresh = generateSiteLocal(brief).sections.find((s) => s.type === section.type);
    return fresh ? { ...section, data: { ...section.data, ...fresh.data } } : section;
}

// ---------- Persistence ----------
export function slugify(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

export async function listMySites(): Promise<BuilderSite[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from('builder_sites').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as BuilderSite[];
}

export async function saveSite(site: BuilderSite): Promise<BuilderSite> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Please log in to save your site.');
    const payload = {
        owner_id: user.id,
        store_id: site.store_id || null,
        slug: site.slug || null,
        business_name: site.business_name,
        business_category: site.business_category,
        island: site.island,
        theme: site.theme,
        sections: site.sections,
        seo: site.seo,
        status: site.status,
        ai_generated: site.ai_generated ?? false,
        published_at: site.published_at || null,
    };
    if (site.id) {
        const { data, error } = await supabase.from('builder_sites').update(payload).eq('id', site.id).select().single();
        if (error) throw error;
        return data as BuilderSite;
    }
    const { data, error } = await supabase.from('builder_sites').insert(payload).select().single();
    if (error) throw error;
    return data as BuilderSite;
}

export async function publishSite(site: BuilderSite): Promise<BuilderSite> {
    // Plan gate: Free plan = 1 published site; Pro/Premium = unlimited
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: plan } = await supabase.from('user_plan_subscriptions').select('plan_slug').eq('user_id', user.id).maybeSingle();
        const isFree = !plan || plan.plan_slug === 'free';
        if (isFree) {
            const { count } = await supabase.from('builder_sites').select('id', { count: 'exact', head: true })
                .eq('owner_id', user.id).eq('status', 'published').neq('id', site.id || '00000000-0000-0000-0000-000000000000');
            if ((count || 0) >= 1) throw new Error('Free plan includes 1 published website. Upgrade to Pro (TT$199/mo) for unlimited sites + premium templates + unlimited AI.');
        }
    }
    let slug = site.slug || slugify(site.business_name);
    // ensure slug uniqueness (append suffix on collision)
    const { data: clash } = await supabase.from('builder_sites').select('id').eq('slug', slug).neq('id', site.id || '00000000-0000-0000-0000-000000000000').maybeSingle();
    if (clash) slug = `${slug}-${uid().slice(0, 4)}`;
    return saveSite({ ...site, slug, status: 'published', published_at: new Date().toISOString() });
}

export async function getPublishedSite(slug: string): Promise<BuilderSite | null> {
    const { data, error } = await supabase.from('builder_sites').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    if (error) throw error;
    return (data as BuilderSite) || null;
}

export async function getStoreProducts(storeId: string) {
    const { data } = await supabase
        .from('products')
        .select('id,name,price,base_price,image_url,description,stock')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .limit(12);
    // normalize price — DB has both price and base_price columns
    return (data || []).map((p: any) => ({ ...p, displayPrice: Number(p.price ?? p.base_price ?? 0) }));
}

export async function getMyStores() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from('stores').select('id,name,slug').eq('owner_id', user.id).eq('status', 'active');
    return data || [];
}

export const CATEGORIES = Object.keys(CATEGORY_COPY);
export const ISLANDS = [
    'Trinidad & Tobago', 'Jamaica', 'Barbados', 'Guyana', 'St. Lucia', 'Grenada',
    'St. Vincent & the Grenadines', 'Antigua & Barbuda', 'Dominica', 'St. Kitts & Nevis', 'The Bahamas', 'Belize',
];
