import { supabase } from './supabaseClient';

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://127.0.0.1:8000';

console.log('AI Service initialized with URL:', AI_SERVER_URL);

export interface AIResponse {
    content: string;
    model_used: string;
    processing_time_ms?: number;
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

export interface ChatbotRequest {
    message: string;
    context?: string;
    persona?: string;
    system_prompt?: string;
}

// Fallback response system
const fallbackResponses = {
    greetings: [
        "Hi there! I'm here to help you with TriniBuild. What can I assist you with today?",
        "Hello! Welcome to TriniBuild. How can I help you?",
        "Hey! I'm your TriniBuild assistant. What would you like to know?"
    ],
    platform: [
        "TriniBuild is Trinidad & Tobago's complete digital business platform. You can:\n\n✅ **Open a FREE online store** (10 items free forever)\n✅ **List properties** on our Real Estate hub\n✅ **Find or offer services** (plumbers, electricians, etc.)\n✅ **Book rides** with GPS tracking\n✅ **Buy/sell event tickets** (no scalpers!)\n✅ **Post jobs or find work**\n\nNo credit card required to start! What interests you most?",
        "TriniBuild helps local businesses sell online easily. We offer free websites, marketplace listings, and tools built specifically for T&T. Want to know more about any specific feature?"
    ],
    pricing: [
        "**TriniBuild Pricing:**\n\n🆓 **FREE Forever:**\n- Your own website\n- Up to 10 product listings\n- Basic analytics\n- Customer chat support\n\n💎 **Premium ($99 TTD/month):**\n- Unlimited listings\n- Advanced analytics\n- Priority support\n- Custom domain\n- AI-powered tools\n\nNo credit card needed to start! Ready to sign up?",
        "We offer a FREE plan with 10 listings and a lifetime website. Premium plans start at $99 TTD/month for unlimited features. Want to get started?"
    ],
    signup: [
        "Getting started is easy!\n\n1. Click **'Sign Up'** at the top\n2. Choose **'Business'** or **'Personal'**\n3. Enter your email (no credit card needed!)\n4. Set up your profile\n5. Start listing products immediately!\n\nYour first 10 listings are FREE forever. Ready to begin?",
        "Just click the 'Sign Up' button and you'll be selling online in minutes! No credit card required."
    ],
    support: [
        "I'm here to help! You can:\n\n📧 Email: support@trinibuild.com\n📱 WhatsApp: +1 (868) 555-TRINI\n💬 Live chat: Right here!\n📍 Office: Port of Spain, Trinidad\n\nWhat specific issue can I help you with?",
        "Our support team is available 24/7. What do you need help with specifically?"
    ],
    marketplace: [
        "Our Marketplace lets you:\n\n🛍️ **Sell anything** - electronics, cars, furniture, clothing\n✅ **Verified buyers** - all users are verified\n💳 **Secure payments** - via Endcash\n📦 **Easy shipping** - local delivery options\n🆓 **10 FREE listings** - no credit card needed\n\nWhat would you like to sell?",
        "The TriniBuild Marketplace is perfect for buying and selling locally. All users are verified, payments are secure, and your first 10 listings are free!"
    ],
    jobs: [
        "**TriniWorks** helps you:\n\n👷 **Find skilled workers** - plumbers, electricians, mechanics\n📋 **Post job listings** - hire full-time or contractors\n✅ **Verified professionals** - all workers are vetted\n📄 **Generate contracts** - AI-powered agreements\n\nLooking to hire or find work?",
        "Our job platform connects businesses with verified local professionals. You can post jobs or find skilled workers easily!"
    ],
    realestate: [
        "**TriniBuild Real Estate** offers:\n\n🏠 **Property listings** - houses, apartments, land\n🔍 **Advanced search** - filter by location, price, size\n📸 **Photo galleries** - showcase your property\n💼 **Agent tools** - manage multiple listings\n\nAre you looking to buy, sell, or rent?",
        "Our Real Estate hub makes it easy to list and find properties across Trinidad & Tobago. Want to list a property or search for one?"
    ],
    default: [
        "I'm here to help with TriniBuild! I can tell you about:\n\n• **Marketplace** - buying & selling\n• **Pricing** - plans and features\n• **Jobs** - hiring or finding work\n• **Real Estate** - property listings\n• **Getting Started** - how to sign up\n\nWhat would you like to know?",
        "I'm not sure I understand, but I'm here to help! Could you ask about our marketplace, pricing, jobs, real estate, or how to get started?"
    ]
};

function getFallbackResponse(message: string, persona?: string): string {
    const msg = message.toLowerCase();

    // Greetings
    if (msg.match(/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/)) {
        return fallbackResponses.greetings[Math.floor(Math.random() * fallbackResponses.greetings.length)];
    }

    // Platform/About
    if (msg.match(/\b(what is|about|trinibuild|platform|features)\b/)) {
        return fallbackResponses.platform[Math.floor(Math.random() * fallbackResponses.platform.length)];
    }

    // Pricing
    if (msg.match(/\b(price|pricing|cost|how much|fee|free|premium|plan)\b/)) {
        return fallbackResponses.pricing[Math.floor(Math.random() * fallbackResponses.pricing.length)];
    }

    // Signup
    if (msg.match(/\b(sign up|signup|register|join|get started|create account)\b/)) {
        return fallbackResponses.signup[Math.floor(Math.random() * fallbackResponses.signup.length)];
    }

    // Support
    if (msg.match(/\b(help|support|contact|email|phone|reach)\b/)) {
        return fallbackResponses.support[Math.floor(Math.random() * fallbackResponses.support.length)];
    }

    // Marketplace
    if (msg.match(/\b(marketplace|sell|buy|shop|store|listing|product)\b/)) {
        return fallbackResponses.marketplace[Math.floor(Math.random() * fallbackResponses.marketplace.length)];
    }

    // Jobs
    if (msg.match(/\b(job|work|hire|plumber|electrician|contractor|worker)\b/)) {
        return fallbackResponses.jobs[Math.floor(Math.random() * fallbackResponses.jobs.length)];
    }

    // Real Estate
    if (msg.match(/\b(property|house|apartment|rent|real estate|land)\b/)) {
        return fallbackResponses.realestate[Math.floor(Math.random() * fallbackResponses.realestate.length)];
    }

    // Default
    return fallbackResponses.default[Math.floor(Math.random() * fallbackResponses.default.length)];
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
    for (let i = 0; i <= retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (i === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
    }
    throw new Error('Max retries reached');
}

export const aiService = {
    async generateJobLetter(data: JobLetterRequest): Promise<AIResponse> {
        try {
            const response = await fetchWithRetry(`${AI_SERVER_URL}/generate-job-letter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to generate job letter');
            return response.json();
        } catch (error) {
            console.warn('AI server unavailable, using fallback');
            // Fallback job letter template
            const fallbackContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${data.position} position at ${data.company_name}. With ${data.experience_years} years of professional experience and expertise in ${data.skills.join(', ')}, I am confident in my ability to contribute effectively to your team.

Throughout my career, I have developed a strong foundation in the skills necessary for this role. I am eager to bring my dedication and expertise to ${data.company_name} and contribute to your continued success.

I would welcome the opportunity to discuss how my background and skills align with your needs. Thank you for considering my application.

Sincerely,
${data.applicant_name}`;

            return { content: fallbackContent, model_used: 'fallback-template' };
        }
    },

    async generateListingDescription(data: ListingDescriptionRequest): Promise<AIResponse> {
        try {
            const response = await fetchWithRetry(`${AI_SERVER_URL}/generate-listing-description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to generate listing description');
            return response.json();
        } catch (error) {
            console.warn('AI server unavailable, using fallback');
            // Fallback listing description
            const priceText = data.price ? `\n\n💰 **Price: TT$${data.price.toLocaleString()}**` : '';
            const fallbackContent = `**${data.title}**

${data.features.map(f => `✅ ${f}`).join('\n')}

📦 **Condition:** ${data.condition}
📂 **Category:** ${data.category}${priceText}

Contact us today to learn more about this ${data.title}!`;

            return { content: fallbackContent, model_used: 'fallback-template' };
        }
    },

    async chatWithBot(data: ChatbotRequest): Promise<AIResponse> {
        try {
            const response = await fetchWithRetry(`${AI_SERVER_URL}/chatbot-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to get chatbot reply');
            return response.json();
        } catch (error) {
            console.warn('AI server unavailable, using intelligent fallback');
            // Use intelligent fallback based on message content
            const fallbackContent = getFallbackResponse(data.message, data.persona);
            return { content: fallbackContent, model_used: 'fallback-intelligent' };
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

    async generateText(prompt: string, system_prompt?: string, model?: string): Promise<string> {
        try {
            const response = await fetchWithRetry(`${AI_SERVER_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, system_prompt, model }),
            });

            if (!response.ok) throw new Error('Failed to generate text');
            const data = await response.json();
            return data.content;
        } catch (error) {
            console.warn('AI server unavailable, using fallback');
            return "I'm currently experiencing technical difficulties. Please try again later or contact support for immediate assistance.";
        }
    }
};

