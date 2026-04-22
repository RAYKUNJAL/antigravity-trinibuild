import { supabase } from './supabaseClient';

/**
 * TriniBuild AI Service v4 — GPT-4o mini
 * 
 * Cost: $0.15/MTok input, $0.60/MTok output — ~$0.0004 per chat message
 * That's roughly $12/month for 1,000 messages/day
 * 
 * Powers EVERYTHING:
 * - Platform concierge, paperwork assistant, store bots
 * - Real estate, rides, service expert agents  
 * - Document generation, listing descriptions, job letters
 * - AI search, store content generation
 * 
 * All agents speak with authentic Trinidad & Tobago personality.
 * Parent Company: R&R Digital Solutions
 */

const GPT_MODEL = 'gpt-4o-mini';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIResponse {
    content: string;
    model_used: string;
    processing_time_ms?: number;
}

export interface ChatbotRequest {
    message: string;
    context?: string;
    persona?: string;
    system_prompt?: string;
}

export interface JobLetterRequest {
    applicant_name: string;
    position: string;
    company_name: string;
    skills: string[];
    experience_years: number;
    tone: 'professional' | 'enthusiastic' | 'confident';
}

export interface ListingDescriptionRequest {
    title: string;
    category: string;
    features: string[];
    condition: string;
    price?: number;
    tone: 'persuasive' | 'neutral' | 'descriptive' | 'urgent';
}

// ─── Core Trini Personality ──────────────────────────────────────────────────

const TRINI_PERSONALITY = `
VOICE & PERSONALITY — TRINI STYLE:
You are a warm, knowledgeable Trinidadian. You speak with natural Trinidad & Tobago English — not a parody, but the real way educated Trinis talk in a professional-but-friendly setting.

LANGUAGE RULES (use naturally, maybe 1 in 3-4 sentences):
- "Wah goin on" (hello), "No scene" (no problem), "Real talk" (seriously)
- "That is ah vibes" (cool), "Yuh good" (you're set), "Leh we" (let's)
- "Doh worry" (don't worry), "Ent?" (right?), "Hoss/pardner" (friend)
- "It have" instead of "there is" sometimes, "Allyuh" (all of you)
- "Bess" (the best), "Real ting" (for real), "Sweetness" (delight)
- "Liming" (hanging out), "Fete" (party), "Maco" (nosy/checking out)

TONE:
- Helpful and warm, like a smart friend who knows everything
- Quick to the point — Trinis don't like long talk for nothing  
- Encouraging toward small business owners
- Mix standard English with light dialect — professional but personable
- Reference T&T locations, food, culture naturally
- Know the geography: POS, San Fernando, Chaguanas, Arima, Tobago
- Know the banks: Republic, Scotiabank, First Citizens, JMMB
- Currency is always TT$ or TTD
`;

// ─── System Prompts ──────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {

    platform: `You are the TriniBuild AI Concierge — main assistant for T&T's leading digital business platform by R&R Digital Solutions.

${TRINI_PERSONALITY}

PLATFORM SERVICES:
- FREE Online Stores (10 items free, 15 templates, 5-min setup)
- Business Directory (52 categories across T&T)
- Digital Services (Game Pass, Netflix, Spotify — PayPal checkout)
- TriniRides (ride-share, TT$25 base + TT$4/km, GPS tracked)
- Real Estate listings, Jobs board, Events & Tickets
- AI Document Assistant (/documents) — job letters, visa letters, proof of income
- VAT Tax Tracker, Referral Program (/earn)

PRICING: Hustle (Free) | Pro ($199 TTD/mo) | Premium ($399 TTD/mo) | Business ($799 TTD/mo)
ROUTES: /create-store, /directory, /digital, /rides, /real-estate, /jobs, /tickets, /documents, /earn, /pricing, /blog

RULES: Answer directly FIRST. Suggest 1-2 features. Keep it concise. Use markdown. Give real numbers not vague answers.`,

    paperwork_assistant: `You are TriniBuild's AI Document Assistant — you help people get paperwork done fast.

${TRINI_PERSONALITY}

FOR DOCUMENTS: Switch to formal mode. Documents themselves = proper business English with T&T legal conventions. Chat before/after = casual Trini.

DOCUMENTS YOU GENERATE:
1. Job Offer Letters — NIS/BIR compliant, probation period, salary breakdown
2. Proof of Income — for banks (Republic, Scotiabank, First Citizens), visa, rental
3. Visa Support Letters — US Embassy POS, Canadian High Commission, UK, Schengen
4. Contractor Agreements — independent contractor terms, payment schedules
5. VAT Registration Certificates — BIR-ready
6. Employment Verification, Salary Confirmation, Business Reference Letters

DOCUMENT FORMAT:
- Formal business English, T&T conventions, current date, letterhead style
- "Republic of Trinidad and Tobago" where legally relevant
- TT$ for currency, NIS number fields, signature lines
- Footer: "Generated via TriniBuild — A product of R&R Digital Solutions"
- Disclaimer: "This document should be verified before official submission"

CHAT STYLE: "Aight, leh we get that job letter sorted for yuh" / "I go need the company name and salary to make this bess"
Never generate fraudulent documents.`,

    real_estate: `You are TriniBuild's Real Estate Concierge.
${TRINI_PERSONALITY}
Know: Westmoorings TT$1.5-3M, Chaguanas TT$800K-1.5M, San Fernando TT$700K-2M, Arima TT$600K-1.5M.
Legal fees ~5-7%, mortgage rates 6-8%. Suggest /real-estate.
Parent: R&R Digital Solutions.`,

    rides: `You are TriniBuild's Ride Assistant.
${TRINI_PERSONALITY}
POS-Chaguanas ~30min. POS-San Fernando ~1hr. POS-Maracas ~40min. POS-Piarco ~25min.
Maxi: Red (East), Green (South), Yellow (Central). TriniRides: TT$25 base + TT$4/km.
Suggest /rides. Parent: R&R Digital Solutions.`,

    service_expert: `You are TriniBuild's Service Expert.
${TRINI_PERSONALITY}
Rates: Plumber TT$200-500, Electrician TT$250-600, AC Tech TT$200-400, Painter TT$15-25/sqft, Mechanic TT$200-500.
Tips: Get 2+ quotes, ask for BIR number, pay in stages. Suggest /directory.
Parent: R&R Digital Solutions.`,

    store_assistant: `You are a Store Sales Assistant on TriniBuild.
${TRINI_PERSONALITY}
Use the store's product catalog, hours, and policies from conversation context.
Answer product questions, suggest related items, help with orders.
Be friendly and sales-oriented without being pushy.
If you don't know something, suggest contacting the store via WhatsApp.`
};

// ─── OpenAI API Call (GPT-4o mini) ───────────────────────────────────────────

async function callGPT(
    userMessage: string,
    systemPrompt: string,
    conversationHistory?: string
): Promise<AIResponse> {
    if (!OPENAI_API_KEY) {
        throw new Error('No OpenAI API key configured — set VITE_OPENAI_API_KEY');
    }

    const startTime = Date.now();

    const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: systemPrompt }
    ];

    if (conversationHistory) {
        messages.push({ role: 'user', content: `Previous conversation:\n${conversationHistory}\n\n---\nCurrent message: ${userMessage}` });
    } else {
        messages.push({ role: 'user', content: userMessage });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: GPT_MODEL,
            messages,
            max_tokens: 2000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`OpenAI API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Something went wrong on meh end. Try again nah.';

    return {
        content: text,
        model_used: GPT_MODEL,
        processing_time_ms: Date.now() - startTime
    };
}

// ─── Dynamic Store Bot Prompt Builder ────────────────────────────────────────

function buildStorePrompt(storeData: any): string {
    const products = storeData.products?.map((p: any) =>
        `- ${p.name}: TT$${p.base_price} (${p.category || 'General'})${p.description ? ' — ' + p.description.substring(0, 80) : ''}`
    ).join('\n') || 'No products listed yet';

    return `${SYSTEM_PROMPTS.store_assistant}

STORE: ${storeData.name}
CATEGORY: ${storeData.category || 'General'}
DESCRIPTION: ${storeData.description || 'A local T&T business on TriniBuild'}
LOCATION: ${storeData.location || 'Trinidad & Tobago'}
WHATSAPP: ${storeData.whatsapp || 'Not listed'}

PRODUCTS:
${products}

PAYMENT: Cash on Delivery (COD), Bank Transfer, PayPal
DELIVERY: TriniRides delivery, Standard delivery, Store pickup`;
}

// ─── Trini Fallback Responses ────────────────────────────────────────────────

function getTriniFallback(message: string, mode?: string): string {
    const msg = message.toLowerCase();

    if (msg.match(/\b(hi|hello|hey|good morning|good afternoon|wah|yo|sup)\b/)) {
        const greetings = [
            "Wah goin on! I'm yuh TriniBuild AI assistant. How I could help yuh today?",
            "Hey! Welcome to TriniBuild — T&T's own platform. Leh me know what yuh need.",
            "Aye! Good to see yuh. I could help with stores, documents, finding services — just ask meh."
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (mode === 'paperwork_assistant' || msg.match(/\b(document|letter|visa|proof|income|job letter|contract|paperwork)\b/)) {
        return "I could generate these documents for yuh right now:\n\n📄 **Job Offer Letter** — Free\n💰 **Proof of Income** — Pro plan\n✈️ **Visa Support Letter** — Pro plan\n📋 **Contractor Agreement** — Pro plan\n🧾 **VAT Certificate** — Pro plan\n\nWhich one yuh need? Tell meh the details and I go sort it out. Real ting.";
    }

    if (msg.match(/\b(price|pricing|cost|plan|free|how much)\b/)) {
        return "**TriniBuild Pricing:**\n\n🆓 **Hustle (Free forever):** 10 products, basic store, directory listing\n💎 **Pro ($199 TTD/mo):** Unlimited products, AI tools, store chatbot\n🏆 **Premium ($399 TTD/mo):** Custom domain, priority support\n🏢 **Business ($799 TTD/mo):** Multi-location, API access\n\nDoh even need a credit card to start. Check [/pricing](/pricing) for the full breakdown!";
    }

    if (msg.match(/\b(store|sell|create|shop|start|business|open)\b/)) {
        return "Creating a store is real easy — 5 minutes and yuh live:\n\n1. Head to [/create-store](/create-store)\n2. Pick from 15 templates built for T&T businesses\n3. Add yuh products\n4. Share yuh store link!\n\nFirst 10 products free forever. No credit card needed. 🇹🇹";
    }

    if (msg.match(/\b(cod|cash on delivery|delivery|how.*order|how.*pay|payment)\b/)) {
        return "**How COD works on TriniBuild:**\n\n1. Customer places order on yuh store\n2. You get a WhatsApp notification to confirm\n3. You arrange delivery (TriniRides or yuh own driver)\n4. Driver delivers and collects cash or Linx payment\n5. Order marked complete in yuh dashboard\n\nSimple! No bank account or credit card needed from the customer side. That's how T&T does business. 💪";
    }

    if (msg.match(/\b(ride|taxi|transport|driver|maxi)\b/)) {
        return "TriniRides got yuh covered:\n\n🚗 TT$25 base + TT$4/km\n📍 GPS tracked\n💬 WhatsApp updates\n💵 Cash accepted\n\nCheck [/rides](/rides) to book!";
    }

    if (msg.match(/\b(property|house|apartment|rent|real estate|land)\b/)) {
        return "Looking for property? We have listings across T&T — houses, apartments, land, commercial.\n\nCheck [/real-estate](/real-estate) for all listings!";
    }

    if (msg.match(/\b(job|work|hire|plumber|electrician|mechanic|service)\b/)) {
        return "Whether yuh hiring or looking for work:\n\n👷 Find verified professionals in [/directory](/directory)\n📋 Post jobs or browse openings at [/jobs](/jobs)\n\nWhat kind of help yuh looking for?";
    }

    if (msg.match(/\b(what|who|tell me about|explain).*(trinibuild|platform|website|this)\b/)) {
        return "**TriniBuild** is Trinidad & Tobago's own digital platform. We help local businesses get online and customers find what they need.\n\nWe offer:\n🏪 Free online stores with COD\n📖 Business directory (52 categories)\n🎮 Digital services (Game Pass, Netflix, etc.)\n🚗 Ride-share\n🏠 Real estate\n💼 Jobs board\n📄 AI document generator\n🎫 Events & tickets\n\nBuilt by R&R Digital Solutions, right here in T&T. 🇹🇹\n\nWhat yuh want to know more about?";
    }

    return "I here to help! I could assist with:\n\n• 🏪 **Stores** — create and manage yuh online shop\n• 📄 **Documents** — job letters, visa letters, proof of income\n• 🔍 **Directory** — find any business or service in T&T\n• 🚗 **Rides** — book transportation\n• 🏠 **Real Estate** — property listings\n• 💰 **COD selling** — how cash on delivery works\n\nJust tell meh what yuh need, pardner!";
}

// ─── Local Document Fallback ─────────────────────────────────────────────────

function generateLocalDoc(docType: string, formData: Record<string, string>): string {
    const date = new Date().toLocaleDateString('en-TT', { year: 'numeric', month: 'long', day: 'numeric' });
    const footer = '\n\n---\n*Generated via TriniBuild — A product of R&R Digital Solutions*\n*This document should be verified before official submission.*';

    switch (docType) {
        case 'job_letter':
            return `**${formData.employer_name || 'Company Name'}**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\n**LETTER OF EMPLOYMENT**\n\nTo Whom It May Concern,\n\nThis confirms that **${formData.employee_name || 'Employee Name'}** is offered the position of **${formData.position || 'Position'}** at ${formData.employer_name || 'Company Name'}, effective ${formData.start_date || 'TBD'}.\n\n**Employment Details:**\n- Position: ${formData.position || 'N/A'}\n- Monthly Salary: TT$${formData.salary || 'N/A'}\n- Start Date: ${formData.start_date || 'N/A'}\n- Employment Type: Full-time\n- NIS Number: _______________\n- Probation Period: Three (3) months\n\nSincerely,\n\n_________________________\nAuthorized Representative\n${formData.employer_name || 'Company Name'}${footer}`;

        case 'proof_of_income':
            return `**PROOF OF INCOME STATEMENT**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nBusiness: ${formData.business_name || 'N/A'}\nOwner: ${formData.owner_name || 'N/A'}\n\nThis certifies that ${formData.owner_name || 'the undersigned'} earns an average monthly income of **TT$${formData.monthly_income || 'N/A'}** from ${formData.source || 'business operations'} during ${formData.period || 'the current fiscal year'}.\n\nVerified by: TriniBuild / R&R Digital Solutions\n\n_________________________\nDigital Verification${footer}`;

        case 'visa_letter':
            return `**VISA SUPPORT LETTER**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nTo: The Visa Officer, Embassy of ${formData.destination || '[Country]'}\n\nRe: ${formData.applicant_name || '[Name]'}\n\nI, ${formData.sponsor_name || '[Sponsor]'}, confirm that ${formData.applicant_name || '[Name]'} will visit ${formData.destination || '[Country]'} for ${formData.purpose || '[Purpose]'}, duration ${formData.duration || '[Duration]'}. All expenses will be covered.\n\nPassport Number: _______________\n\n_________________________\n${formData.sponsor_name || 'Sponsor'}${footer}`;

        case 'contractor_agreement':
            return `**INDEPENDENT CONTRACTOR AGREEMENT**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nClient: ${formData.client_name || '[Client]'}\nContractor: ${formData.contractor_name || '[Contractor]'}\n\n1. Scope: ${formData.scope || '[TBD]'}\n2. Duration: ${formData.duration || '[TBD]'}\n3. Payment: ${formData.payment_terms || '[TBD]'}\n4. Status: Independent contractor. Responsible for own taxes and NIS.\n5. Termination: 14 days written notice.\n\n_________________________     _________________________\nClient                                    Contractor${footer}`;

        default:
            return `**Document**\nDate: ${date}\n\n${Object.entries(formData).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}${footer}`;
    }
}

// ─── Exported Service ────────────────────────────────────────────────────────

export const aiService = {

    async chatWithBot(data: ChatbotRequest): Promise<AIResponse> {
        try {
            const systemPrompt = data.system_prompt
                || SYSTEM_PROMPTS[data.persona as keyof typeof SYSTEM_PROMPTS]
                || SYSTEM_PROMPTS.platform;
            return await callGPT(data.message, systemPrompt, data.context);
        } catch (error) {
            console.warn('GPT-4o mini unavailable, using Trini fallback:', error);
            return {
                content: getTriniFallback(data.message, data.persona),
                model_used: 'fallback-trini'
            };
        }
    },

    async generateDocument(docType: string, docTitle: string, formData: Record<string, string>): Promise<AIResponse> {
        try {
            const fieldSummary = Object.entries(formData)
                .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`)
                .join('\n');

            const response = await callGPT(
                `Generate a professional "${docTitle}" for Trinidad & Tobago:\n\n${fieldSummary}\n\nFormat as a complete, print-ready document with letterhead, date, signature lines, and R&R Digital Solutions footer.`,
                SYSTEM_PROMPTS.paperwork_assistant
            );

            const user = await supabase.auth.getUser();
            if (user.data.user) {
                supabase.from('document_generations').insert({
                    document_type: docType,
                    user_id: user.data.user.id,
                    created_at: new Date().toISOString()
                }).then(() => {});
            }

            return response;
        } catch {
            return { content: generateLocalDoc(docType, formData), model_used: 'fallback-template' };
        }
    },

    async chatWithStoreBot(message: string, storeData: any, conversationHistory?: string): Promise<AIResponse> {
        try {
            return await callGPT(message, buildStorePrompt(storeData), conversationHistory);
        } catch {
            return {
                content: `Welcome to ${storeData?.name || 'our store'}! I having a lil technical issue right now. Reach us on WhatsApp at ${storeData?.whatsapp || 'the number on the page'} — we go sort yuh out! 🇹🇹`,
                model_used: 'fallback-trini'
            };
        }
    },

    async generateJobLetter(data: JobLetterRequest): Promise<AIResponse> {
        try {
            return await callGPT(
                `Generate a professional job offer letter for Trinidad & Tobago.\nEmployer: ${data.company_name}\nCandidate: ${data.applicant_name}\nPosition: ${data.position}\nSkills: ${data.skills.join(', ')}\nExperience: ${data.experience_years} years\nTone: ${data.tone}\n\nInclude NIS number field, probation period, salary breakdown. Print-ready format.`,
                SYSTEM_PROMPTS.paperwork_assistant
            );
        } catch {
            return {
                content: generateLocalDoc('job_letter', {
                    employer_name: data.company_name,
                    employee_name: data.applicant_name,
                    position: data.position
                }),
                model_used: 'fallback-template'
            };
        }
    },

    async generateListingDescription(data: ListingDescriptionRequest): Promise<AIResponse> {
        try {
            return await callGPT(
                `Write a compelling product listing for TriniBuild marketplace.\nTitle: ${data.title}\nCategory: ${data.category}\nFeatures: ${data.features.join(', ')}\nCondition: ${data.condition}\n${data.price ? `Price: TT$${data.price}` : ''}\nTone: ${data.tone}\n\n2-3 paragraphs, use emojis, Trinidad audience.`,
                SYSTEM_PROMPTS.platform
            );
        } catch {
            return {
                content: `**${data.title}**\n\n${data.features.map(f => `✅ ${f}`).join('\n')}\n\n📦 Condition: ${data.condition}${data.price ? `\n💰 TT$${data.price.toLocaleString()}` : ''}\n\nHit us up! 🇹🇹`,
                model_used: 'fallback-template'
            };
        }
    },

    async generateText(prompt: string, system_prompt?: string): Promise<string> {
        try {
            const r = await callGPT(prompt, system_prompt || SYSTEM_PROMPTS.platform);
            return r.content;
        } catch {
            return "I having a lil technical issue. Try again in a minute nah, or contact support@trinibuild.com.";
        }
    },

    async searchQuery(query: string): Promise<AIResponse> {
        try {
            return await callGPT(
                `User searched: "${query}". Suggest the most relevant TriniBuild page/feature. 2-3 sentences with route link.`,
                SYSTEM_PROMPTS.platform
            );
        } catch {
            return { content: getTriniFallback(query), model_used: 'fallback-trini' };
        }
    },

    async getStoreBotSettings(storeId: string) {
        const { data, error } = await supabase
            .from('stores')
            .select('bot_name, bot_persona, bot_system_prompt')
            .eq('id', storeId)
            .single();
        if (error) return null;
        return data;
    },

    async generateStoreContent(
        type: 'description' | 'tagline' | 'seo',
        storeName: string,
        category: string,
        context?: string
    ): Promise<string> {
        const prompts: Record<string, string> = {
            description: `Write a 2-sentence business description for "${storeName}" (${category}) in Trinidad. ${context || ''} Professional but warm, slight Trini flavor.`,
            tagline: `Generate 3 catchy taglines for "${storeName}" (${category}) in Trinidad. Short, memorable, Trini-flavored. Just the 3 taglines numbered.`,
            seo: `SEO meta description (max 155 chars) for "${storeName}" — a ${category} store on TriniBuild, Trinidad.`
        };
        try {
            const r = await callGPT(prompts[type], SYSTEM_PROMPTS.platform);
            return r.content;
        } catch {
            return type === 'tagline'
                ? `1. ${storeName} — Real quality, real value\n2. ${storeName} — Trini to de bone\n3. ${storeName} — Where quality meets community`
                : `${storeName} — your ${category} destination in Trinidad & Tobago. Powered by TriniBuild.`;
        }
    }
};
