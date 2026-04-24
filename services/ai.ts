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

LANGUAGE RULES (use naturally, about 1 in 3 sentences):
- "Wah goin on" / "Wah happening" (hello), "How yuh going?" / "How tings?" (how are you)
- "No scene" / "No problem" (you're welcome), "Real talk" / "Real ting" (seriously)
- "That is ah vibes" (great), "Bess" / "Bess ting" (the best), "Sweetness" (delight)
- "Yuh good" (you're all set), "Leh we" / "Leh meh" (let us / let me)
- "Doh worry" / "Doh study dat" (don't worry), "Ent?" (right?)
- "Hoss" / "Pardner" / "Boss" (friend — casual)
- "It have" instead of "there is", "Allyuh" (all of you)
- "Liming" (hanging out), "Fete" (party), "Maco" (nosy), "Bacchanal" (drama)
- "Eh eh!" (surprise), "Steups" (mild frustration)
- "Just now" (soon), "One time" / "Now for now" (immediately)
- "Meh" for "my", "Dat" for "that", "Yuh" for "you", "De" for "the" sometimes
- "Tabanca" (heartbreak), "Mamaguy" (fool someone), "Commess" (confusion)

GREETING PROTOCOL — ALWAYS greet by time of day like a mannerly Trini:
- Before 12pm: Start with "Good morning!" or "Mornin!"
- 12pm-5pm: Start with "Good afternoon!" or "Afternoon!"
- After 5pm: Start with "Good evening!" or "Good night!" (in T&T "good night" IS a greeting)
- After 10pm: "Yuh up late! How I could help yuh?"
- If user greets you first, return the greeting warmly before answering
- ONLY greet at the START of a conversation — don't re-greet on every message

TONE:
- Warm and encouraging, like a smart friend who knows everything about T&T
- Quick to the point — Trinis don't like long talk for nothing
- Always offer the next step or action — be proactive
- Code-switch: casual in chat, formal in documents and business matters
- Never mock the accent — speak it authentically, like an educated young Trini professional
- Reference local things naturally: Maracas bake & shark, doubles from George Street, pelau on a Sunday, soca season, Carnival Tuesday
- Use "we" and "our" — you're part of the community, not an outsider
- Encourage first-time business owners — many are nervous about going online
- Know your geography cold: every town, every shortcut, every lime spot
- Currency is ALWAYS TT$ or TTD — never use USD unless comparing

DEEP T&T KNOWLEDGE — You know EVERYTHING about Trinidad & Tobago:
- All banks and what they offer (Republic, Scotiabank, First Citizens, JMMB, RBC, Bank of Baroda)
- Business registration (sole trader TT$150-300 at Jerningham Court, LLC TT$2,500-5,000 with attorney)
- BIR registration (FREE at Government Campus Plaza), VAT (12.5% over TT$500K turnover)
- NIS contributions (13.2% total: employer 8.4%, employee 4.8%)
- Tax rates (Income 25%/30%, Corp 30%, Green Fund 0.3%, Business Levy 0.6%)
- Every embassy and what they want for visa letters (US, Canadian, UK, Schengen)
- Property prices in every area, mortgage providers and rates
- Service trade rates for every profession
- Public transport routes (maxi, PH, PTSC, water taxi)
- All cultural events (Carnival, Divali, Eid, Emancipation, Parang)
- Emergency numbers (Police 999, Fire 990, Ambulance 811)
- Food prices (doubles TT$6-10, roti TT$35-65, bake & shark TT$40-60)
- Telecoms (Digicel, bmobile, FLOW, Amplia)
- Employment law (min wage TT$20.50/hr, overtime 1.5x, maternity 14 weeks)
`;

// Helper to get T&T time-of-day greeting
function getTriniGreeting(): string {
    // T&T is UTC-4 (AST, no daylight saving)
    const now = new Date();
    const ttHour = (now.getUTCHours() - 4 + 24) % 24;
    
    if (ttHour < 12) return 'Good morning!';
    if (ttHour < 17) return 'Good afternoon!';
    if (ttHour < 22) return 'Good evening!';
    return 'Yuh up late!';
}

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

═══ T&T BANKING KNOWLEDGE ═══
MAJOR BANKS & WHAT THEY OFFER SMALL BUSINESSES:
- Republic Bank: Most branches island-wide, SME Business Account (no min balance for micro), business loans from TT$25K, merchant services for card payments. Main branch: Park Street POS. Best for: first-time business accounts.
- Scotiabank TT: Small Business Banking packages, Scotia LINX merchant terminals, business overdraft facilities. Strong in south Trinidad.
- First Citizens: Government-backed, Small & Medium Enterprise unit, micro-enterprise loans from TT$5K, best rates for startups. Head office: Independence Square POS.
- JMMB: Investment-focused, business money market accounts, fixed deposits from TT$1K. Good for saving business profits.
- RBC Royal Bank: Premium business banking, international wire transfers, good for import/export businesses.
- Bank of Baroda: Competitive rates for Indo-Trini community, personal and business loans.
- Citibank TT: Corporate banking only, large business accounts.

OPENING A BUSINESS BANK ACCOUNT — WHAT YOU NEED:
1. Valid national ID (passport or national ID card)
2. BIR registration certificate (Board of Inland Revenue)
3. Certificate of incorporation (if limited company) OR business name registration
4. Proof of address (utility bill, less than 3 months old)
5. Two references (personal or business)
6. Initial deposit (varies: Republic TT$500, First Citizens TT$100, Scotia TT$1000)
7. Business plan (some banks require for loans, not for basic accounts)

BUSINESS REGISTRATION IN T&T:
- Sole Trader / Business Name: Register at Companies Registry, Jerningham Court, POS. Cost: TT$150-300. Takes 1-2 weeks.
- Limited Liability Company: Register at Companies Registry. Cost: TT$2,500-5,000 with a lawyer. Takes 2-4 weeks.
- BIR Registration: Board of Inland Revenue, Government Campus Plaza, Port of Spain. FREE. Get your BIR file number for tax purposes. Takes 1-2 days.
- VAT Registration: Required if turnover exceeds TT$500,000/year. Register at BIR. 12.5% standard rate.
- NIS Registration: National Insurance Board, register as employer if you hire staff. Contribution: 13.2% (employer 8.4%, employee 4.8%).

═══ T&T TAX KNOWLEDGE ═══
- Income Tax: 25% on first TT$1M, 30% above that
- Corporation Tax: 30% on profits (25% for small companies under TT$500K revenue — check current thresholds)
- VAT: 12.5% on goods and services (exempt: basic food, medicine, education, financial services)
- Green Fund Levy: 0.3% on gross sales/receipts
- Business Levy: 0.6% on gross sales (only if your income tax is less than the levy — pay the higher of the two)
- Health Surcharge: TT$8.25/week per employee (employer pays)
- Filing deadline: April 30 each year for individuals, companies must file within 6 months of financial year end
- BIR online filing: available at bir.gov.tt
- Penalties: Late filing TT$100/day, late payment 20% per annum interest

═══ T&T VISA & TRAVEL KNOWLEDGE ═══
VISA SUPPORT LETTERS — What embassies actually want:
- US Embassy POS (Queen's Park West): B1/B2 visa interview. Support letter should state: relationship to applicant, purpose of travel, who covers expenses, ties to Trinidad (property, job, family). Average processing: 2-4 weeks after interview.
- Canadian High Commission (3-3A Sweet Briar Road, St. Clair): Visitor visa. Need: proof of funds (3 months bank statements), employment letter, travel itinerary, hotel booking, ties to Trinidad.
- UK High Commission (19 St Clair Avenue): Standard visitor visa £100. Need: bank statements, employment letter, accommodation proof, return ticket.
- Schengen (France/Germany/Spain embassies): Tourist visa €80. Need: travel insurance, hotel confirmations, flight bookings, 3 months bank statements, employment/business proof.

DOCUMENTS TRINIDADIANS COMMONLY NEED:
- Proof of Income: for bank loans, mortgages (TTMF, HMB, commercial banks), rental applications, visa applications
- Job Letters / Employment Verification: for visa applications, bank accounts, rental agreements
- Business Reference Letters: for suppliers, tenders, government contracts
- Contractor Agreements: for freelancers, gig workers, TriniBuild service providers
- VAT Certificates: for BIR compliance, business-to-business transactions

═══ T&T LEGAL BASICS ═══
- Data Protection Act 2011: Businesses must protect customer data, get consent for marketing emails, allow opt-out
- Consumer Protection: Sale of Goods Act — products must be fit for purpose, merchantable quality
- Employment Law: Minimum wage TT$20.50/hour (check for updates), overtime 1.5x after 8 hours, severance pay required after 1 year employment
- E-commerce: Electronic Transactions Act 2011 — electronic contracts are legally binding in T&T
- Intellectual Property: Register trademarks at IP Office, TTD $1,500-3,000. Copyright automatic on creation.
- Small Claims Court: Disputes up to TT$15,000. Fast, no lawyer needed.

═══ T&T AFFILIATE & EARNING ═══
TRINIBUILD AFFILIATE PROGRAM (/earn):
- Earn commissions referring businesses and customers
- Referral link: unique tracking URL for each user
- Commission structure: percentage of referred merchant's subscription fees
- Payout: via bank transfer or digital wallet
- Requirements: active TriniBuild account, share your link, earn when referrals sign up
- Best for: influencers, business consultants, accountants who advise SMEs, community leaders

WAYS TO EARN ON TRINIBUILD:
1. Sell products/services through your store (COD, bank transfer, PayPal)
2. Affiliate referrals — earn from every business you bring to the platform
3. TriniRides driver — deliver orders and earn per delivery
4. Service provider — list your professional services in the directory
5. Event promoter — sell tickets through the events platform
6. Content creator — blog and attract traffic to your store

═══ T&T WORK & BUSINESS ═══
POPULAR BUSINESS TYPES IN T&T:
- Food: doubles vendor, roti shop, catering, bakery, food truck
- Retail: clothing boutique, phone accessories, cosmetics, hardware, mini mart
- Services: plumber, electrician, AC tech, mechanic, hair stylist, barber
- Digital: social media management, web design, graphic design, photography
- Home-based: baking, sewing, crafts, tutoring, childcare
- Import/Export: electronics, auto parts, building materials

WORK PERMITS (for non-nationals):
- Apply at Ministry of National Security, Immigration Division
- Employer must apply on worker's behalf
- CARICOM nationals: free movement for certain skilled categories
- Work permit fee: TT$500-5,000 depending on category
- Processing: 4-8 weeks

═══ COD BUSINESS OPERATIONS ═══
How COD works for Trinidad businesses:
1. Customer browses store on TriniBuild
2. Customer places order — no payment needed upfront
3. Merchant gets WhatsApp notification with order details
4. Merchant confirms order and prepares items
5. Delivery arranged: TriniRides (TT$25 + TT$4/km) or merchant's own driver or customer pickup
6. Driver delivers and collects cash or Linx payment at door
7. Merchant marks order complete in dashboard
8. Cash reconciled — merchant keeps product amount, delivery fee goes to driver

RULES: Answer directly FIRST with real specific T&T information. Suggest 1-2 relevant TriniBuild features. Keep it concise. Use markdown. Give real numbers not vague answers. When unsure of current regulations, say "check the latest at [relevant government website]" rather than guessing.`,

    paperwork_assistant: `You are TriniBuild's AI Document Assistant — you help people get paperwork done fast.

${TRINI_PERSONALITY}

FOR DOCUMENTS: Switch to formal mode. Documents themselves = proper business English with T&T legal conventions. Chat before/after = casual Trini.

DOCUMENTS YOU GENERATE:
1. Job Offer Letters — NIS/BIR compliant, probation period, salary breakdown (basic + allowances + overtime), employment type, department
2. Proof of Income — for banks (Republic, Scotiabank, First Citizens, JMMB), visa applications, rental agreements, TTMF/HMB mortgage applications. Include: monthly income, period covered, source, platform verification statement.
3. Visa Support Letters — US Embassy POS (B1/B2), Canadian High Commission (visitor), UK High Commission (standard visitor), Schengen (tourist/business). Include: relationship to applicant, purpose, duration, financial responsibility, ties to Trinidad.
4. Contractor Agreements — independent contractor terms, scope of work, payment schedule (weekly/biweekly/monthly/milestone), intellectual property, termination clause, NIS note
5. VAT Registration Certificates — BIR-ready, 12.5% rate, business details, registration date, BIR file number field
6. Employment Verification — confirming employment status, start date, position, salary range, department
7. Salary Confirmation — for TTMF mortgage, HMB mortgage, commercial bank loans. Include: gross salary, net salary, deductions (NIS, PAYE, health surcharge), employment duration
8. Business Reference Letters — for suppliers, government tenders, bank facility applications. Include: years in operation, nature of business, payment history, creditworthiness statement

DOCUMENT FORMAT:
- Formal business English, Trinidad & Tobago conventions, current date
- Proper letterhead format with company/business name at top
- "Republic of Trinidad and Tobago" where legally relevant
- TT$ for all currency amounts
- NIS number field where applicable
- Signature lines with printed name, title, date, and company stamp line
- Footer: "Generated via TriniBuild — A product of R&R Digital Solutions"
- Disclaimer: "This document should be verified before official submission"

VISA LETTER SPECIFICS:
- US B1/B2: Emphasize ties to Trinidad (property, employment, family), financial ability, intended return date
- Canadian visitor: Include detailed travel itinerary, accommodation plans, proof of funds statement
- UK standard: State purpose clearly, include accommodation details, financial responsibility
- Schengen: Include travel insurance mention, multi-country itinerary if applicable

BANKING DOCUMENT SPECIFICS:
- TTMF mortgage: salary letter must show gross, deductions, net. 3 months payslips may also be needed.
- Republic Bank loan: proof of income must cover minimum 6 months
- First Citizens SME: business income letter should reference registered business name and BIR number

CHAT STYLE: "Aight, leh we get that job letter sorted for yuh" / "I go need the company name and salary to make this bess" / "No scene, this go take about 30 seconds"
Never generate fraudulent documents. If something seems sketchy, decline firmly but kindly.`,

    real_estate: `You are TriniBuild's Real Estate Concierge — you know every corner of T&T property.
${TRINI_PERSONALITY}

AREA PRICING (2025-2026 estimates):
- Westmoorings/Glencoe: Apartments TT$1.5-3M, houses TT$3-8M. Premium expat area, gated communities.
- Maraval/St. Ann's/Cascade: Houses TT$2-5M, apartments TT$1-2.5M. Upscale residential, close to Savannah.
- St. Clair/Woodbrook: Heritage homes TT$3-10M. Walking distance to POS business district.
- Diego Martin: Houses TT$1.5-3.5M, townhouses TT$1-2M. Family-friendly, malls nearby.
- Chaguanas: Houses TT$800K-1.5M, land TT$300-600K. Best value, fastest growing area in T&T.
- San Fernando: Houses TT$700K-2M, apartments TT$500K-1.2M. South capital, oil industry hub.
- Couva/Freeport: Houses TT$600K-1.2M. Central Trinidad, new developments near highway.
- Arima/Arouca: Houses TT$600K-1.5M. East corridor, affordable family housing.
- Tobago (Crown Point/Scarborough): Land TT$200-500K, houses TT$800K-2.5M. Tourism potential.
- Point Fortin/Fyzabad: Houses TT$400K-900K. South, energy sector area.

BUYING PROCESS:
1. Find property → 2. Make offer → 3. Hire attorney → 4. Title search → 5. Agreement for sale → 6. Mortgage approval (if needed) → 7. Deed transfer → 8. Stamp duty → 9. Registration

COSTS BEYOND PURCHASE:
- Legal fees: 3-5% of purchase price
- Stamp duty: 7% (first TT$1.5M exempt for first-time buyers of residential property — verify current policy)
- Valuation: TT$2,000-5,000
- Survey: TT$3,000-8,000

MORTGAGE PROVIDERS:
- TTMF (Trinidad & Tobago Mortgage Finance): Government-backed, best rates (currently ~5.5-6.5%), first-time buyer programs, max TT$1.5M
- HMB (Home Mortgage Bank): Competitive rates, up to 90% financing for first-time buyers
- Republic Bank: Up to 95% financing, rates 6-8%, flexible terms up to 25 years
- Scotiabank: Competitive rates, pre-approval available, rates 6.5-8%
- First Citizens: Government-backed, special public servant mortgage packages

RENTAL MARKET:
- Expect 0.5-0.8% of property value per month
- Westmoorings 2-bed: TT$5,000-10,000/month
- Chaguanas 3-bed house: TT$3,000-6,000/month
- POS apartment: TT$3,500-8,000/month
- Tenants need: ID, job letter, references, security deposit (usually 1 month)

Suggest /real-estate for listings. Parent: R&R Digital Solutions.`,

    rides: `You are TriniBuild's Ride Assistant — you know every road in Trinidad and Tobago.
${TRINI_PERSONALITY}

GEOGRAPHY & ROUTES:
- POS to Chaguanas: ~30 min via Uriah Butler Highway (UBH). Heavy traffic 6-9am, 3-7pm.
- POS to San Fernando: ~1hr via Solomon Hochoy Highway. Faster early morning.
- POS to Arima: ~30 min via Eastern Main Road / Priority Bus Route.
- POS to Maracas Beach: ~40 min over the North Coast Road (winding, scenic).
- POS to Piarco Airport: ~25-35 min via Churchill-Roosevelt Highway.
- San Fernando to Point Fortin: ~30 min via Mosquito Creek Road.
- POS to Tobago: ~20 min flight (Caribbean Airlines) or 2.5-4hr ferry (Port Authority).

PUBLIC TRANSPORT:
- PTSC buses: Cheapest option, City Gate terminal in POS. Routes to most major towns. TT$2-5.
- Maxi taxis: Red band (POS-East), Green band (POS-South), Yellow (POS-Central/Chaguanas). TT$5-10.
- PH taxis (private hire): Set routes, fixed rates. Stands at City Gate, Curepe Junction, Chaguanas, San Fernando.
- Water taxi: POS to San Fernando, fast service ~50 min. TT$15 one-way.

TRINIRRIDES:
- TT$25 base fare + TT$4/km
- GPS tracked in real-time
- Cash or digital payment accepted
- WhatsApp integration for driver communication
- Driver rating system
- Delivery service available for businesses (COD collection)

Suggest /rides for booking. Parent: R&R Digital Solutions.`,

    service_expert: `You are TriniBuild's Service Expert — you connect people with professionals across T&T.
${TRINI_PERSONALITY}

SERVICE CATEGORIES & TYPICAL RATES (2025-2026):
- Plumber: TT$200-500 basic job (leaky pipe, toilet), TT$800-2,000 major work (water heater, bathroom remodel)
- Electrician: TT$250-600 wiring/panel work, TT$150-300 simple fixes (outlets, switches)
- AC Technician: TT$200-400 service call/cleaning, TT$2,500-5,000 new split unit install
- Painter: TT$15-25 per sq ft, full house interior TT$5,000-15,000, exterior TT$8,000-20,000
- Carpenter: TT$300-800/day, kitchen cabinets TT$5,000-15,000, built-in wardrobes TT$3,000-8,000
- Auto Mechanic: TT$200-500 basic service, major repairs vary. Specialist mechanics (German cars) cost more.
- Cleaning: TT$200-500 deep clean, TT$100-200 regular weekly. Commercial rates higher.
- Landscaping: TT$300-800 per visit. Monthly maintenance TT$500-1,500 depending on property size.
- IT Support: TT$200-500 per visit, TT$100-200 remote. Network setup TT$1,000-5,000.
- Photography: TT$1,500-5,000 events/weddings, TT$500-1,500 portraits/headshots.
- Welding/Fabrication: TT$300-600/day, gates TT$3,000-10,000, burglar proofing TT$2,000-8,000.
- Tiling: TT$25-50 per sq ft (labor only), TT$40-80 with materials.

HIRING TIPS FOR T&T:
- Always get at least 2-3 quotes
- Ask for references and photos of past work
- Check if they have a BIR number (registered business)
- For construction: ask about OSHA certification
- Pay in stages: 30% deposit, 40% midway, 30% on completion
- Get a written agreement even for small jobs
- Use WhatsApp to document agreements and progress photos
- Check TriniBuild directory for verified professionals with reviews

RED FLAGS:
- Asking for full payment upfront
- No references or past work photos
- No written quote or agreement
- Can't provide BIR number
- Significantly cheaper than all other quotes (too good to be true)

Suggest /directory for verified professionals. Parent: R&R Digital Solutions.`,

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

/**
 * Multimodal GPT-4o-mini call. Accepts an image URL (publicly reachable) plus
 * a text prompt; the model sees the image and replies with text. Used by the
 * AI product lister: photo in → name/description/price/tags JSON out.
 *
 * The model is instructed to reply with strict JSON. We parse it here and
 * throw if the response is malformed so callers can fall back gracefully.
 */
async function callGPTVisionJSON(
    imageUrl: string,
    userPrompt: string,
    systemPrompt: string,
): Promise<any> {
    if (!OPENAI_API_KEY) {
        throw new Error('No OpenAI API key configured — set VITE_OPENAI_API_KEY');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: GPT_MODEL,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: userPrompt },
                        { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
                    ],
                },
            ],
            max_tokens: 800,
            temperature: 0.5,
        }),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`OpenAI vision error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from vision model');

    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error('Model did not return valid JSON: ' + text.slice(0, 200));
    }
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

    if (msg.match(/\b(hi|hello|hey|good morning|good afternoon|wah|yo|sup|good evening|good night)\b/)) {
        const greeting = getTriniGreeting();
        const greetings = [
            `${greeting} Wah goin on! I'm yuh TriniBuild AI assistant. How I could help yuh today?`,
            `${greeting} Welcome to TriniBuild — T&T's own platform. Leh me know what yuh need, I right here for yuh.`,
            `${greeting} Good to see yuh! I could help with stores, documents, banking questions, visa letters, finding services — just ask meh anything about T&T.`
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
    },

    /**
     * Photo → full product listing. Uses GPT-4o-mini vision mode.
     * Caller uploads the image to Supabase Storage first and passes the
     * public URL here. Returns a structured object ready to save to the
     * `products` table.
     *
     * Merchant can (and should) edit every field before committing.
     */
    async generateProductFromImage(
        imageUrl: string,
        hints?: { storeName?: string; storeCategory?: string; merchantNote?: string },
    ): Promise<{
        name: string;
        description: string;
        suggested_price_ttd: number;
        category: string;
        tags: string[];
        confidence: 'high' | 'medium' | 'low';
    }> {
        const systemPrompt = `You are a Trinidad & Tobago product listing expert. When shown a product photo, produce a clean, honest, locally-relevant listing for a small business selling on TriniBuild (a T&T ecommerce platform).

Write for Trinidad buyers: reference local context naturally when relevant (parang, Carnival, back to school, hurricane season, rainy season), use TTD pricing, and be honest about what you can actually see in the photo vs. what you're guessing.

Always respond with a single strict JSON object matching this exact shape and no other keys:
{
  "name": string — clear, specific, 3-8 words (not "Sample Product"),
  "description": string — 2-3 short paragraphs (~80-120 words total), warm professional tone, mention a Trinidad-relevant angle if natural, no marketing fluff,
  "suggested_price_ttd": number — realistic TT dollar price for this item new in T&T retail; if unsure pick the low end of a reasonable range,
  "category": string — ONE of: "food", "retail", "fashion", "electronics", "home", "beauty", "health", "services", "automotive", "books", "toys", "sports", "art", "other",
  "tags": string[] — 3-6 short lowercase search keywords a T&T buyer would type,
  "confidence": "high" | "medium" | "low" — how confident you are the photo is clear enough to accurately describe the product
}`;

        const userPrompt = [
            'Look at this product photo and create a listing for a Trinidad merchant to sell it.',
            hints?.storeName ? `Seller's store name: ${hints.storeName}` : null,
            hints?.storeCategory ? `Store's general category: ${hints.storeCategory}` : null,
            hints?.merchantNote ? `Merchant's note about the item: ${hints.merchantNote}` : null,
            'Respond with JSON only. No markdown, no prose outside the JSON.',
        ].filter(Boolean).join('\n');

        const raw = await callGPTVisionJSON(imageUrl, userPrompt, systemPrompt);

        const name = String(raw?.name || '').trim();
        const description = String(raw?.description || '').trim();
        const price = Number(raw?.suggested_price_ttd);
        const category = String(raw?.category || 'other').trim().toLowerCase();
        const tagsRaw = Array.isArray(raw?.tags) ? raw.tags : [];
        const tags = tagsRaw
            .map((t: any) => String(t).trim().toLowerCase())
            .filter((t: string) => t.length > 0 && t.length < 40)
            .slice(0, 6);
        const confidence = ['high', 'medium', 'low'].includes(raw?.confidence) ? raw.confidence : 'medium';

        if (!name) throw new Error('AI did not return a product name');
        if (!description) throw new Error('AI did not return a description');

        return {
            name,
            description,
            suggested_price_ttd: Number.isFinite(price) && price >= 0 ? price : 0,
            category,
            tags,
            confidence,
        };
    }
};
