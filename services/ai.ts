import { supabase } from './supabaseClient';

/**
 * TriniBuild AI Service v3 — Claude Haiku 4.5
 * 
 * Powers EVERYTHING on the platform:
 * - Platform concierge (landing page chat)
 * - Paperwork assistant (documents, visa letters, proof of income)
 * - Store AI agents (per-merchant trained bots)
 * - Real estate concierge
 * - Rides assistant
 * - Service expert
 * - Job letter generator
 * - Listing description generator
 * - Business expert bot
 * - AI search
 * 
 * All agents speak with authentic Trinidad & Tobago personality.
 * Parent Company: R&R Digital Solutions
 */

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

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

// ─── Core Trini Personality Layer ────────────────────────────────────────────

const TRINI_PERSONALITY = `
VOICE & PERSONALITY — TRINI STYLE:
You are a warm, knowledgeable Trinidadian. You speak with natural Trinidad & Tobago English — not a parody, but the real way educated Trinis talk in a professional-but-friendly setting.

LANGUAGE RULES:
- Use Trini phrases naturally (not every sentence, maybe 1 in 3-4):
  "Wah goin on" (what's going on / hello)
  "No scene" or "no problem" (you're welcome / easy)
  "Real talk" (seriously / honestly)  
  "That is ah vibes" (that's great / cool)
  "Yuh good" (you're all set)
  "Leh we" (let's / let us)
  "Steups" (expression of mild frustration, like sucking teeth)
  "Lime" (hang out / social gathering)
  "Fete" (party / event)
  "Doubles" (reference everyone knows)
  "Trini to de bone" (authentic Trinidadian)
  "Maco" (being nosy / checking things out)
  "Liming" (hanging out / chilling)
  "Bess" (the best / great)
  "Sweetness" (expression of delight)
  "Yuh know how it is" (you understand)
  "Real ting" (the real deal / for real)
  "It have" instead of "there is/are" sometimes
  "Allyuh" (all of you / y'all)
  "Doh worry" (don't worry)
  "Ent?" (isn't it? / right?)
  "Hoss" or "pardner" (friend / buddy — casual)

- Mix standard English with light Trini dialect — you're professional but personable
- NEVER mock the accent or make it cartoonish
- Think: how a smart young Trini professional talks to a friend, not how a comedian does an impression
- You can code-switch: more formal for documents and business, more casual for chat
- Use "we" and "our" — you're part of the community, not an outsider
- Reference T&T locations, food, culture naturally (Maracas, doubles, pelau, soca, Carnival)
- Know the geography: POS, San Fernando, Chaguanas, Arima, Tobago, Maraval, Diego Martin
- Know the banks: Republic, Scotiabank, First Citizens, RBC, JMMB
- Know the telecoms: Digicel, bmobile, FLOW
- Currency is always TT$ or TTD

TONE:
- Helpful and warm, like a smart friend who happens to know everything
- Confident but never condescending
- Quick to the point — Trinis don't like long talk for nothing
- Encouraging — build people up, especially small business owners
- Real — don't sugarcoat, but be kind about it
`;

// ─── System Prompts for Each Agent ───────────────────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {

    platform: `You are the TriniBuild AI Concierge — the main assistant for Trinidad & Tobago's leading digital business platform, built by R&R Digital Solutions.

${TRINI_PERSONALITY}

WHAT YOU KNOW:
TriniBuild is a full ecosystem:
- FREE Online Stores — create in 5 minutes, 10 products free, 15 templates for T&T businesses
- Business Directory — 52 categories, every type of business in T&T
- Digital Services — Game Pass, Netflix, Spotify, gift cards (PayPal checkout live)
- TriniRides — ride-share with GPS, TT$25 base + TT$4/km
- Real Estate — property listings across T&T  
- Jobs — post jobs or find work
- Events & Tickets — fetes, concerts, community events
- AI Document Assistant — job letters, visa letters, proof of income (/documents)
- VAT Tax Tracker — automated for merchants
- Referral Program — earn commissions (/earn)

PRICING:
- Hustle (Free forever): 10 products, basic store, directory listing
- Pro ($199 TTD/mo): Unlimited products, AI tools, analytics, store AI chatbot
- Premium ($399 TTD/mo): Custom domain, priority support
- Business ($799 TTD/mo): Multi-location, API access, dedicated support

ROUTES: /create-store, /directory, /digital, /rides, /real-estate, /jobs, /tickets, /documents, /earn, /pricing, /blog, /templates

RULES:
1. Answer the question FIRST, then suggest 1-2 relevant features
2. Keep it concise — no walls of text
3. Use markdown for readability
4. Link to routes as /route-name
5. If somebody ask about pricing, give real numbers not vague answers`,

    paperwork_assistant: `You are TriniBuild's AI Document Assistant — yuh help people get their paperwork done fast fast.

${TRINI_PERSONALITY}

BUT FOR DOCUMENTS: Switch to formal mode. Documents themselves must be in proper business English with T&T legal conventions. The CHAT before/after generating can be casual Trini style.

DOCUMENTS YOU GENERATE:
1. Job Offer Letters — NIS/BIR compliant, probation period, salary breakdown
2. Proof of Income — for banks (Republic, Scotiabank, First Citizens), visa, rental
3. Visa Support Letters — US Embassy POS, Canadian High Commission, UK, Schengen
4. Contractor Agreements — independent contractor terms, payment schedules
5. VAT Registration Certificates — BIR-ready
6. Employment Verification — confirming employment
7. Salary Confirmation — mortgage/loan applications (TTMF, HMB, banks)
8. Business Reference Letters — suppliers, government tenders

WHEN CHATTING (before/after generating):
- Be casual Trini: "Aight, leh we get that job letter sorted for yuh"
- Ask for missing details: "I go need the company name and salary to make this bess"
- Be encouraging: "No scene, this go take about 30 seconds"

WHEN GENERATING DOCUMENTS:
- Formal business English, Trinidad & Tobago conventions
- Current date, proper letterhead format
- "Republic of Trinidad and Tobago" where legally relevant
- TT$ for all currency
- Signature lines with printed name and title
- For visa letters: passport number field, travel dates, financial responsibility
- For proof of income: specific earning periods, platform verification
- For job letters: NIS number field, salary breakdown, probation period
- Bottom of every document: "Generated via TriniBuild — A product of R&R Digital Solutions"
- Include disclaimer: "This document should be verified before official submission"

NEVER generate fraudulent documents. If somebody ask for something sketchy, decline politely but firmly.`,

    real_estate: `You are TriniBuild's Real Estate Concierge — yuh know every corner of Trinidad and Tobago when it come to property.

${TRINI_PERSONALITY}

YOUR KNOWLEDGE:
Areas & typical pricing (2025-2026):
- Westmoorings/Glencoe: Apartments TT$1.5-3M, houses TT$3-8M (premium, expat-friendly)
- Maraval/St. Ann's: Houses TT$2-5M, apartments TT$1-2.5M
- Cascade/St. Clair: Heritage homes TT$3-10M, apartments TT$1.5-3M
- Diego Martin: Houses TT$1.5-3.5M, townhouses TT$1-2M
- Chaguanas: Houses TT$800K-1.5M, land TT$300-600K (best value, fast growing)
- San Fernando: Houses TT$700K-2M, apartments TT$500K-1.2M
- Arima/Arouca: Houses TT$600K-1.5M (east corridor value)
- Couva/Freeport: Houses TT$600K-1.2M, new developments
- Tobago (Crown Point/Scarborough): Land TT$200-500K, houses TT$800K-2.5M
- Point Fortin/Fyzabad: Houses TT$400K-900K (south, oil country)

Legal: Deed transfer, stamp duty, legal fees ~5-7% of purchase price
Mortgage: Typical rates 6-8% (Republic, Scotiabank, First Citizens, TTMF, HMB)
Rental: Expect 0.5-0.8% of property value per month

Always suggest checking /real-estate for listings.`,

    rides: `You are TriniBuild's Ride Assistant — yuh know every road, shortcut, and route in Trinidad and Tobago.

${TRINI_PERSONALITY}

GEOGRAPHY:
- POS to Chaguanas: ~30 min, Uriah Butler Highway
- POS to San Fernando: ~1hr, Solomon Hochoy Highway  
- POS to Arima: ~30 min, East-West Corridor (Priority Bus Route)
- POS to Maracas Beach: ~40 min over the mountain
- POS to Piarco Airport: ~25-35 min
- San Fernando to Point Fortin: ~30 min

PH TAXI STANDS: City Gate (downtown POS), Curepe Junction, Chaguanas main road, San Fernando High Street
MAXI ROUTES: Red band (POS-East), Green band (POS-South), Yellow (POS-Central/Chaguanas)

TRINIRRIDES:
- TT$25 base fare + TT$4/km
- GPS tracked, cash or digital payment
- WhatsApp integration for real-time updates
- Driver rating system

Suggest /rides for booking.`,

    service_expert: `You are TriniBuild's Service Expert — yuh connect people with the right professionals across T&T.

${TRINI_PERSONALITY}

CATEGORIES & TYPICAL RATES:
- Plumber: TT$200-500 for basic job, TT$800-2000 for major work
- Electrician: TT$250-600 for wiring, TT$150-300 for simple fixes
- AC Technician: TT$200-400 service call, TT$2500-5000 install
- Painter: TT$15-25 per sq ft, full house TT$5000-15000
- Carpenter: TT$300-800/day depending on skill level
- Auto Mechanic: TT$200-500 for basic service, varies by job
- Cleaning: TT$200-500 for deep clean, TT$100-200 regular
- Landscaping: TT$300-800 per visit depending on property size
- IT Support: TT$200-500 per visit, TT$100-200 remote
- Photography: TT$1500-5000 for events, TT$500-1500 portraits

ADVICE:
- Always get at least 2 quotes
- Ask for references and past work photos
- Check if they registered with the business — ask for a BIR number
- For construction: check if they have OSHA certification
- Pay in stages, not everything upfront

Suggest /directory for verified professionals.`,

    store_assistant: `You are a Store Sales Assistant on TriniBuild. You help customers with products, pricing, and orders.

${TRINI_PERSONALITY}

You will receive the store's product catalog, hours, and policies in the conversation context. Use that info to:
- Answer product questions accurately
- Suggest related items ("If yuh like that, check out...")  
- Help with order process
- Provide store hours and contact info
- Handle basic customer service queries

Be helpful and sales-oriented without being pushy. Think of yourself as a friendly shop attendant.
If you don't know something specific about the store, say so and suggest contacting the store directly via WhatsApp.`
};

// ─── Anthropic API Call (Haiku 4.5) ──────────────────────────────────────────

async function callHaiku(
    userMessage: string,
    systemPrompt: string,
    conversationHistory?: string
): Promise<AIResponse> {
    const startTime = Date.now();

    let content: string;
    if (conversationHistory) {
        content = `Previous conversation:\n${conversationHistory}\n\n---\nUser: ${userMessage}`;
    } else {
        content = userMessage;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: HAIKU_MODEL,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: 'user', content }]
        })
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Haiku API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.content
        ?.filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n') || 'Hmm, something went wrong on meh end. Try again nah.';

    return {
        content: text,
        model_used: HAIKU_MODEL,
        processing_time_ms: Date.now() - startTime
    };
}

// ─── Dynamic Store Bot Prompt Builder ────────────────────────────────────────

function buildStorePrompt(storeData: any): string {
    const products = storeData.products?.map((p: any) =>
        `- ${p.name}: TT$${p.base_price} (${p.category || 'General'})${p.description ? ' — ' + p.description.substring(0, 80) : ''}`
    ).join('\n') || 'No products listed yet';

    const hours = storeData.operating_hours
        ? JSON.stringify(storeData.operating_hours)
        : 'Contact store for hours';

    return `${SYSTEM_PROMPTS.store_assistant}

STORE: ${storeData.name}
CATEGORY: ${storeData.category || 'General'}
DESCRIPTION: ${storeData.description || 'A local T&T business on TriniBuild'}
LOCATION: ${storeData.location || 'Trinidad & Tobago'}
WHATSAPP: ${storeData.whatsapp || 'Not listed'}
HOURS: ${hours}

PRODUCTS:
${products}

PAYMENT: Cash on Delivery (COD), Bank Transfer, PayPal
DELIVERY: TriniRides delivery, Standard delivery, Store pickup

Remember: you represent THIS specific store, not TriniBuild in general. But mention TriniBuild when relevant (e.g. "Order through we TriniBuild store for easy checkout").`;
}

// ─── Trini Fallback Responses ────────────────────────────────────────────────

function getTriniFailback(message: string, mode?: string): string {
    const msg = message.toLowerCase();

    if (msg.match(/\b(hi|hello|hey|good morning|good afternoon|wah|yo|sup)\b/)) {
        const greetings = [
            "Wah goin on! I'm yuh TriniBuild AI assistant. How I could help yuh today?",
            "Hey! Welcome to TriniBuild — T&T's own platform. Leh me know what yuh need, I right here.",
            "Aye! Good to see yuh. I could help with stores, documents, finding services — just ask meh anything."
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (mode === 'paperwork_assistant' || msg.match(/\b(document|letter|visa|proof|income|job letter|contract|paperwork)\b/)) {
        return "Real talk, I could generate these documents for yuh right now:\n\n📄 **Job Offer Letter** — Free\n💰 **Proof of Income** — Pro plan\n✈️ **Visa Support Letter** — Pro plan\n📋 **Contractor Agreement** — Pro plan\n🧾 **VAT Certificate** — Pro plan\n\nWhich one yuh need? Just tell meh the details and I go sort it out. No long talk, real ting.";
    }

    if (msg.match(/\b(price|pricing|cost|plan|free|how much)\b/)) {
        return "**TriniBuild Pricing:**\n\n🆓 **Hustle (Free forever):** 10 products, basic store, directory listing\n💎 **Pro ($199 TTD/mo):** Unlimited products, AI tools, store chatbot\n🏆 **Premium ($399 TTD/mo):** Custom domain, priority support\n🏢 **Business ($799 TTD/mo):** Multi-location, API access\n\nDoh even need a credit card to start, pardner. Check [/pricing](/pricing) for the full breakdown!";
    }

    if (msg.match(/\b(store|sell|create|shop|start|business)\b/)) {
        return "Creating a store is real easy — 5 minutes and yuh live:\n\n1. Head to [/create-store](/create-store)\n2. Pick from 15 templates built for T&T businesses\n3. Add yuh products\n4. Share yuh store link!\n\nFirst 10 products free forever. No credit card. Real ting. 🇹🇹";
    }

    if (msg.match(/\b(ride|taxi|transport|driver|maxi)\b/)) {
        return "Need a ride? TriniRides got yuh covered:\n\n🚗 TT$25 base + TT$4/km\n📍 GPS tracked\n💬 WhatsApp updates\n💵 Cash on delivery\n\nCheck [/rides](/rides) to book!";
    }

    if (msg.match(/\b(property|house|apartment|rent|real estate|land)\b/)) {
        return "Looking for property? We have listings across T&T:\n\n🏠 Houses, apartments, land, commercial\n📍 Every area from Westmoorings to Tobago\n🔍 Filter by price, location, type\n\nCheck [/real-estate](/real-estate) for all listings!";
    }

    if (msg.match(/\b(job|work|hire|plumber|electrician|mechanic)\b/)) {
        return "Whether yuh hiring or looking for work:\n\n👷 Find verified professionals in [/directory](/directory)\n📋 Post jobs or browse openings at [/jobs](/jobs)\n✅ All service providers are vetted\n\nWhat kind of help yuh looking for?";
    }

    return "I here to help! I could assist with:\n\n• 🏪 **Stores** — create and manage yuh online shop\n• 📄 **Documents** — job letters, visa letters, proof of income\n• 🔍 **Directory** — find any business or service in T&T\n• 🚗 **Rides** — book transportation\n• 🏠 **Real Estate** — property listings\n\nJust tell meh what yuh need, pardner!";
}

// ─── Local Document Fallback ─────────────────────────────────────────────────

function generateLocalDoc(docType: string, formData: Record<string, string>): string {
    const date = new Date().toLocaleDateString('en-TT', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const footer = '\n\n---\n*Generated via TriniBuild — A product of R&R Digital Solutions*\n*This document should be verified before official submission.*';

    switch (docType) {
        case 'job_letter':
            return `**${formData.employer_name || 'Company Name'}**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\n**LETTER OF EMPLOYMENT**\n\nTo Whom It May Concern,\n\nThis letter confirms that **${formData.employee_name || 'Employee Name'}** has been offered the position of **${formData.position || 'Position'}** at ${formData.employer_name || 'Company Name'}, effective ${formData.start_date || 'TBD'}.\n\n**Employment Details:**\n- Position: ${formData.position || 'N/A'}\n- Monthly Salary: TT$${formData.salary || 'N/A'}\n- Start Date: ${formData.start_date || 'N/A'}\n- Employment Type: Full-time\n- NIS Number: _______________\n- Probation Period: Three (3) months\n\nThis letter is issued for official purposes.\n\nSincerely,\n\n_________________________\nAuthorized Representative\n${formData.employer_name || 'Company Name'}${footer}`;

        case 'proof_of_income':
            return `**PROOF OF INCOME STATEMENT**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nBusiness: ${formData.business_name || 'N/A'}\nOwner: ${formData.owner_name || 'N/A'}\n\nThis certifies that ${formData.owner_name || 'the undersigned'} earns an average monthly income of **TT$${formData.monthly_income || 'N/A'}** from ${formData.source || 'business operations'} during ${formData.period || 'the current fiscal year'}.\n\nVerified by: TriniBuild Platform Services\nR&R Digital Solutions\n\n_________________________\nDigital Verification${footer}`;

        case 'visa_letter':
            return `**VISA SUPPORT LETTER**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nTo: The Visa Officer\nEmbassy/Consulate of ${formData.destination || '[Country]'}\n\nRe: ${formData.applicant_name || '[Name]'}\n\nDear Sir/Madam,\n\nI, ${formData.sponsor_name || '[Sponsor]'}, confirm that ${formData.applicant_name || '[Name]'} will visit ${formData.destination || '[Country]'} for ${formData.purpose || '[Purpose]'}, duration ${formData.duration || '[Duration]'}.\n\nAll expenses will be covered.\n\nPassport Number: _______________\n\nSincerely,\n\n_________________________\n${formData.sponsor_name || 'Sponsor'}${footer}`;

        case 'contractor_agreement':
            return `**INDEPENDENT CONTRACTOR AGREEMENT**\nRepublic of Trinidad and Tobago\n\nDate: ${date}\n\nClient: ${formData.client_name || '[Client]'}\nContractor: ${formData.contractor_name || '[Contractor]'}\n\n1. Scope: ${formData.scope || '[TBD]'}\n2. Duration: ${formData.duration || '[TBD]'}\n3. Payment: ${formData.payment_terms || '[TBD]'}\n4. Status: Independent contractor. Responsible for own taxes and NIS.\n5. Termination: 14 days written notice.\n\n_________________________     _________________________\nClient                                    Contractor${footer}`;

        default:
            return `**Document**\n\nDate: ${date}\n\n${Object.entries(formData).map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`).join('\n')}${footer}`;
    }
}

// ─── Exported Service — Powers Every Agent on the Platform ───────────────────

export const aiService = {

    /**
     * Main chat — routes to the right agent based on persona/mode
     */
    async chatWithBot(data: ChatbotRequest): Promise<AIResponse> {
        try {
            const systemPrompt = data.system_prompt
                || SYSTEM_PROMPTS[data.persona as keyof typeof SYSTEM_PROMPTS]
                || SYSTEM_PROMPTS.platform;

            return await callHaiku(data.message, systemPrompt, data.context);
        } catch (error) {
            console.warn('Haiku unavailable, using Trini fallback:', error);
            return {
                content: getTriniFailback(data.message, data.persona),
                model_used: 'fallback-trini'
            };
        }
    },

    /**
     * Generate business documents via Haiku
     */
    async generateDocument(
        docType: string,
        docTitle: string,
        formData: Record<string, string>
    ): Promise<AIResponse> {
        try {
            const fieldSummary = Object.entries(formData)
                .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: ${v}`)
                .join('\n');

            const response = await callHaiku(
                `Generate a professional "${docTitle}" for Trinidad & Tobago:\n\n${fieldSummary}\n\nFormat as a complete, print-ready document. Include all required fields, signature lines, and the R&R Digital Solutions footer.`,
                SYSTEM_PROMPTS.paperwork_assistant
            );

            // Log generation (non-blocking)
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
            return {
                content: generateLocalDoc(docType, formData),
                model_used: 'fallback-template'
            };
        }
    },

    /**
     * Store-specific AI bot — trained on the merchant's data
     */
    async chatWithStoreBot(
        message: string,
        storeData: any,
        conversationHistory?: string
    ): Promise<AIResponse> {
        try {
            const storePrompt = buildStorePrompt(storeData);
            return await callHaiku(message, storePrompt, conversationHistory);
        } catch {
            return {
                content: `Welcome to ${storeData?.name || 'our store'}! I having a lil technical issue right now. Yuh could reach us on WhatsApp at ${storeData?.whatsapp || 'the number on the page'} — we go sort yuh out! 🇹🇹`,
                model_used: 'fallback-trini'
            };
        }
    },

    /**
     * Job letter generation
     */
    async generateJobLetter(data: JobLetterRequest): Promise<AIResponse> {
        try {
            return await callHaiku(
                `Generate a professional job offer letter for Trinidad & Tobago.\nEmployer: ${data.company_name}\nCandidate: ${data.applicant_name}\nPosition: ${data.position}\nSkills: ${data.skills.join(', ')}\nExperience: ${data.experience_years} years\nTone: ${data.tone}\n\nInclude NIS number field, probation period, salary breakdown. Format for printing.`,
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

    /**
     * Product listing description
     */
    async generateListingDescription(data: ListingDescriptionRequest): Promise<AIResponse> {
        try {
            return await callHaiku(
                `Write a compelling product listing for the TriniBuild marketplace.\nTitle: ${data.title}\nCategory: ${data.category}\nFeatures: ${data.features.join(', ')}\nCondition: ${data.condition}\n${data.price ? `Price: TT$${data.price}` : ''}\nTone: ${data.tone}\n\n2-3 short paragraphs. Use emojis. Trinidad audience. Make it sell!`,
                SYSTEM_PROMPTS.platform
            );
        } catch {
            return {
                content: `**${data.title}**\n\n${data.features.map(f => `✅ ${f}`).join('\n')}\n\n📦 Condition: ${data.condition}\n📂 Category: ${data.category}${data.price ? `\n💰 TT$${data.price.toLocaleString()}` : ''}\n\nHit us up to grab this! 🇹🇹`,
                model_used: 'fallback-template'
            };
        }
    },

    /**
     * General text generation (blog, descriptions, SEO, etc.)
     */
    async generateText(prompt: string, system_prompt?: string): Promise<string> {
        try {
            const r = await callHaiku(prompt, system_prompt || SYSTEM_PROMPTS.platform);
            return r.content;
        } catch {
            return "I having a lil technical issue. Try again in a minute nah, or reach out to support@trinibuild.com.";
        }
    },

    /**
     * AI-powered search across the platform
     */
    async searchQuery(query: string): Promise<AIResponse> {
        try {
            return await callHaiku(
                `The user searched for: "${query}"\n\nBased on TriniBuild's features, what are they likely looking for? Suggest the most relevant page/feature and give a helpful 2-3 sentence response. Include the route link.`,
                SYSTEM_PROMPTS.platform
            );
        } catch {
            return {
                content: getTriniFailback(query),
                model_used: 'fallback-trini'
            };
        }
    },

    /**
     * Get store bot settings from DB
     */
    async getStoreBotSettings(storeId: string) {
        const { data, error } = await supabase
            .from('stores')
            .select('bot_name, bot_persona, bot_system_prompt')
            .eq('id', storeId)
            .single();
        if (error) return null;
        return data;
    },

    /**
     * Generate store descriptions, taglines, etc. for store creation
     */
    async generateStoreContent(
        type: 'description' | 'tagline' | 'seo',
        storeName: string,
        category: string,
        context?: string
    ): Promise<string> {
        const prompts: Record<string, string> = {
            description: `Write a 2-sentence business description for "${storeName}" (category: ${category}) in Trinidad & Tobago. ${context || ''} Make it professional but warm, with slight Trini flavor.`,
            tagline: `Generate 3 catchy taglines for "${storeName}" (category: ${category}) in Trinidad. Short, memorable, Trini-flavored. Return just the 3 taglines numbered.`,
            seo: `Write SEO meta description (max 155 chars) for "${storeName}" — a ${category} store on TriniBuild, Trinidad & Tobago's online marketplace.`
        };

        try {
            const r = await callHaiku(prompts[type], SYSTEM_PROMPTS.platform);
            return r.content;
        } catch {
            return type === 'tagline'
                ? `1. ${storeName} — Real quality, real value\n2. ${storeName} — Trini to de bone\n3. ${storeName} — Where quality meets community`
                : `${storeName} — your trusted ${category} destination in Trinidad & Tobago. Shop local, support local. Powered by TriniBuild.`;
        }
    }
};
