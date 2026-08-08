// =============================================================
// Juvay AI Assistant — the store owner's built-in agent.
// Runs on Groq (llama-3.3-70b, VITE_GROQ_API_KEY). Every capability
// has a local fallback so the builder NEVER breaks without the key.
// =============================================================
import { BuilderSite, BusinessBrief, generateSiteLocal } from './siteBuilderService';

const GROQ_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export const aiAvailable = () => !!GROQ_KEY;

async function groqChat(system: string, user: string, json = false): Promise<string | null> {
    if (!GROQ_KEY) return null;
    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
            body: JSON.stringify({
                model: MODEL, temperature: 0.7, max_tokens: 1200,
                messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
                ...(json ? { response_format: { type: 'json_object' } } : {}),
            }),
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
    } catch { return null; }
}

const CARIBBEAN_SYSTEM = `You are Juvay Assistant, the built-in AI for a Caribbean website builder. You help small business owners (Trinidad, Jamaica, Barbados, and the wider Caribbean) build professional online stores. Key market facts you always respect: most customers pay CASH ON DELIVERY or cash on pickup — never assume card payments; WhatsApp is the main business channel; keep language warm, plain, and confident — professional but with Caribbean warmth, no corporate jargon. Currency is local (TT$, J$, Bds$, EC$).`;

// ---------- 1) Chat: answer store-owner questions ----------
export async function askAssistant(question: string, siteContext?: { name: string; category: string; island: string }): Promise<string> {
    const ctx = siteContext ? `The owner's business: ${siteContext.name}, a ${siteContext.category} business in ${siteContext.island}.` : '';
    const ai = await groqChat(CARIBBEAN_SYSTEM + ' Answer in 2-5 short sentences. Be concrete and actionable.', `${ctx}\n\nQuestion: ${question}`);
    if (ai) return ai;
    // Local fallback: honest + useful
    return "I'm running in offline mode right now, but here's solid guidance: keep your hero headline under 8 words, lead with Cash on Delivery (it's your biggest trust signal in the Caribbean), add your WhatsApp number so customers can order directly, and use real photos of your products — phone photos in good light beat stock images every time.";
}

// ---------- 2) Rewrite any text field, on-brand ----------
export async function improveText(text: string, fieldHint: string, brief: BusinessBrief): Promise<string> {
    const ai = await groqChat(
        CARIBBEAN_SYSTEM + ' Rewrite the given website text to be more compelling and conversion-focused. Return ONLY the rewritten text, no quotes, no commentary. Match the original length roughly.',
        `Business: ${brief.businessName} (${brief.category}, ${brief.island}). Field: ${fieldHint}.\nCurrent text: ${text}`
    );
    return ai?.trim() || text;
}

// ---------- 3) Full-site copy generation (upgrade over local engine) ----------
export async function generateSiteWithAI(brief: BusinessBrief): Promise<BuilderSite> {
    const local = generateSiteLocal(brief);
    const ai = await groqChat(
        CARIBBEAN_SYSTEM + ` Generate website copy as a strict JSON object with keys: headline (max 8 words), tagline (max 10 words, punchy), subheadline (1-2 sentences, mention cash on delivery), about (3-4 sentences, first person plural, warm), features (array of exactly 3 objects with title max 4 words + description max 18 words), faq (array of exactly 3 objects with q and a), cta_headline (max 6 words), cta_sub (1 sentence). JSON only.`,
        `Business: ${brief.businessName}. Category: ${brief.category}. Island: ${brief.island}. Owner says: ${brief.description || 'no description given'}. Vibe: ${brief.vibe}.`,
        true
    );
    if (!ai) return local;
    try {
        const c = JSON.parse(ai);
        const uid = () => Math.random().toString(36).slice(2, 10);
        return {
            ...local,
            ai_generated: true,
            sections: local.sections.map((s) => {
                if (s.type === 'hero') return { ...s, data: { ...s.data, headline: c.headline || s.data.headline, tagline: c.tagline || s.data.tagline, subheadline: c.subheadline || s.data.subheadline } };
                if (s.type === 'about') return { ...s, data: { ...s.data, body: c.about || s.data.body } };
                if (s.type === 'features' && Array.isArray(c.features)) return { ...s, data: { ...s.data, items: c.features.map((f: any) => ({ id: uid(), title: f.title, description: f.description })) } };
                if (s.type === 'faq' && Array.isArray(c.faq)) return { ...s, data: { ...s.data, items: c.faq.map((f: any) => ({ id: uid(), q: f.q, a: f.a })) } };
                if (s.type === 'cta') return { ...s, data: { ...s.data, headline: c.cta_headline || s.data.headline, sub: c.cta_sub || s.data.sub } };
                return s;
            }),
        };
    } catch { return local; }
}

// ---------- 4) Template recommendation ----------
export async function recommendTemplate(brief: BusinessBrief, templateNames: string[]): Promise<{ template: string; reason: string }> {
    const ai = await groqChat(
        CARIBBEAN_SYSTEM + ' Pick the single best template. Reply as JSON: {"template": "<exact name from list>", "reason": "<one sentence why>"}',
        `Business: ${brief.businessName} (${brief.category}, vibe: ${brief.vibe}). Templates: ${templateNames.join(', ')}`,
        true
    );
    if (ai) { try { const r = JSON.parse(ai); if (templateNames.includes(r.template)) return r; } catch { } }
    const map: Record<string, string> = {
        'Food & Restaurant': 'Island Kitchen', 'Fashion & Clothing': 'Runway Noir',
        'Beauty & Wellness': 'Coconut Luxe', 'Electronics': 'Tech Slate', 'Services': 'Trade Pro',
    };
    return { template: map[brief.category] || templateNames[0], reason: 'Matched to your business category.' };
}
