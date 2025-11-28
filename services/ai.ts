import { supabase } from './supabaseClient';

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

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
    tone: 'persuasive' | 'neutral' | 'descriptive';
}

export interface ChatbotRequest {
    message: string;
    context?: string;
    persona?: string;
    system_prompt?: string;
}

export const aiService = {
    async generateJobLetter(data: JobLetterRequest): Promise<AIResponse> {
        const response = await fetch(`${AI_SERVER_URL}/generate-job-letter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to generate job letter');
        }

        return response.json();
    },

    async generateListingDescription(data: ListingDescriptionRequest): Promise<AIResponse> {
        const response = await fetch(`${AI_SERVER_URL}/generate-listing-description`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to generate listing description');
        }

        return response.json();
    },

    async chatWithBot(data: ChatbotRequest): Promise<AIResponse> {
        const response = await fetch(`${AI_SERVER_URL}/chatbot-reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Failed to get chatbot reply');
        }

        return response.json();
    },

    async getStoreBotSettings(storeId: string) {
        const { data, error } = await supabase
            .from('stores')
            .select('bot_name, bot_persona, bot_system_prompt')
            .eq('id', storeId)
            .single();

        if (error) return null;
        return data;
    }
};
