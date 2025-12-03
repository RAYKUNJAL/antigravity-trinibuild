// TriniBuild Ads Manager - AI Service
// Integrates with Google AI Studio for ad creative generation

const GOOGLE_AI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';
const AI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface ScriptGenerationInput {
    business_description: string;
    offer_details: string;
    tone: 'professional' | 'casual' | 'energetic' | 'friendly';
    target_location: string;
    duration_seconds?: number;
}

export interface CaptionGenerationInput {
    video_context: string;
    business_name: string;
    offer: string;
    target_audience: string;
}

export interface BudgetRecommendationInput {
    objective: string;
    target_locations: string[];
    category: string;
    desired_impressions?: number;
}

// =====================================================
// SCRIPT WRITER
// =====================================================

export const scriptWriter = {
    async generate(input: ScriptGenerationInput): Promise<string[]> {
        const prompt = this.buildPrompt(input);

        try {
            const response = await fetch(
                `${AI_API_BASE}/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }],
                        generationConfig: {
                            temperature: 0.9,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 800,
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`AI API error: ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates[0]?.content?.parts[0]?.text || '';

            // Parse multiple script variations
            return this.parseScriptVariations(text);
        } catch (error) {
            console.error('Script generation failed:', error);
            return this.getFallbackScripts(input);
        }
    },

    buildPrompt(input: ScriptGenerationInput): string {
        const duration = input.duration_seconds || 20;
        return `You are a Caribbean advertising expert specializing in video ad scripts.

Generate 3 compelling ${duration}-second video ad script variations for:

Business: ${input.business_description}
Offer: ${input.offer_details}
Tone: ${input.tone}
Target Location: ${input.target_location} (Caribbean market)
Duration: ${duration} seconds

REQUIREMENTS:
- Use authentic Caribbean English expressions and local flavor
- Create urgency and excitement
- Include a clear call-to-action
- Keep it conversational and engaging
- Each script should be roughly ${Math.floor(duration * 2.5)} words (${duration} seconds at speaking pace)
- Use "Trini" cultural references where appropriate

Format each script clearly as:

SCRIPT 1:
[script text here]

SCRIPT 2:
[script text here]

SCRIPT 3:
[script text here]`;
    },

    parseScriptVariations(text: string): string[] {
        const scripts: string[] = [];
        const regex = /SCRIPT \d+:\s*\n([\s\S]*?)(?=SCRIPT \d+:|$)/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const script = match[1].trim();
            if (script) scripts.push(script);
        }

        return scripts.length > 0 ? scripts : [text.trim()];
    },

    getFallbackScripts(input: ScriptGenerationInput): string[] {
        return [
            `Looking for ${input.offer_details}? ${input.business_description} has exactly what you need! Visit us in ${input.target_location} or check us out on TriniBuild. Limited time offer - don't miss out!`,
            `Aye, ${input.target_location}! ${input.business_description} bringing you ${input.offer_details}. Real quality, real value. Find we on TriniBuild today!`,
            `Ready for ${input.offer_details}? ${input.business_description} got yuh covered! Serving ${input.target_location} with the best. Check TriniBuild now!`
        ];
    }
};

// =====================================================
// CAPTION GENERATOR
// =====================================================

export const captionGenerator = {
    async generate(input: CaptionGenerationInput): Promise<string[]> {
        const prompt = `Generate 3 engaging social media captions for a TriniBuild video ad.

Business: ${input.business_name}
Offer: ${input.offer}
Context: ${input.video_context}
Target: ${input.target_audience}

CARIBBEAN FLAVOR REQUIREMENTS:
- Mix standard English with authentic Trinidadian expressions
- Use relevant emoji (but don't overdo it)
- Include local slang where natural
- Maximum 120 characters per caption
- End with a call-to-action
- Make it shareable and relatable

Provide 3 distinct variations:
1. Professional tone
2. Casual/friendly tone  
3. Energetic/exciting tone`;

        try {
            const response = await fetch(
                `${AI_API_BASE}/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.95,
                            maxOutputTokens: 400
                        }
                    })
                }
            );

            if (!response.ok) throw new Error(`AI API error: ${response.statusText}`);

            const data = await response.json();
            const text = data.candidates[0]?.content?.parts[0]?.text || '';

            return this.parseCaptions(text);
        } catch (error) {
            console.error('Caption generation failed:', error);
            return this.getFallbackCaptions(input);
        }
    },

    parseCaptions(text: string): string[] {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const captions = lines
            .filter(line => !line.match(/^\d+\.|^-|^•|^Caption|^Variation/i))
            .map(line => line.trim())
            .filter(line => line.length > 10 && line.length <= 140);

        return captions.slice(0, 3);
    },

    getFallbackCaptions(input: CaptionGenerationInput): string[] {
        return [
            `${input.business_name} - ${input.offer} 🔥 Check we out on TriniBuild!`,
            `Aye! ${input.offer} at ${input.business_name}. Real deal, real quality 💯`,
            `${input.business_name} bringing heat! 🌴 ${input.offer} - tap to learn more!`
        ];
    }
};

// =====================================================
// BUDGET RECOMMENDER
// =====================================================

export const budgetRecommender = {
    async recommend(input: BudgetRecommendationInput): Promise<{
        daily_budget_ttd: number;
        lifetime_budget_ttd: number;
        estimated_impressions: number;
        estimated_views: number;
        recommended_duration_days: number;
        rationale: string;
    }> {
        const prompt = `You are a Trinidad & Tobago digital advertising budget expert.

Campaign Details:
- Objective: ${input.objective}
- Target Locations: ${input.target_locations.join(', ')}
- Category: ${input.category}
- Desired Impressions: ${input.desired_impressions || 'not specified'}

Based on the TriniBuild platform economics (CPM ~TTD 45, average CTR 2.5%), recommend:
1. Daily budget in TTD
2. Total campaign budget in TTD  
3. Recommended duration in days
4. Expected impressions and views
5. Brief rationale

Respond in JSON format:
{
  "daily_budget_ttd": number,
  "lifetime_budget_ttd": number,
  "estimated_impressions": number,
  "estimated_views": number,
  "recommended_duration_days": number,
  "rationale": "string"
}`;

        try {
            const response = await fetch(
                `${AI_API_BASE}/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 500
                        }
                    })
                }
            );

            if (!response.ok) throw new Error(`AI API error: ${response.statusText}`);

            const data = await response.json();
            const text = data.candidates[0]?.content?.parts[0]?.text || '';

            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('No valid JSON in response');
        } catch (error) {
            console.error('Budget recommendation failed:', error);
            return this.getFallbackRecommendation(input);
        }
    },

    getFallbackRecommendation(input: BudgetRecommendationInput): {
        daily_budget_ttd: number;
        lifetime_budget_ttd: number;
        estimated_impressions: number;
        estimated_views: number;
        recommended_duration_days: number;
        rationale: string;
    } {
        // Simple rule-based fallback
        const baseDaily = input.objective === 'views' ? 150 : 200;
        const locationMultiplier = input.target_locations.length > 2 ? 1.5 : 1.0;
        const daily_budget = Math.round(baseDaily * locationMultiplier);
        const duration = 14;
        const lifetime_budget = daily_budget * duration;
        const estimated_impressions = Math.floor((lifetime_budget / 45) * 1000);
        const estimated_views = Math.floor(estimated_impressions * 0.35);

        return {
            daily_budget_ttd: daily_budget,
            lifetime_budget_ttd: lifetime_budget,
            estimated_impressions,
            estimated_views,
            recommended_duration_days: duration,
            rationale: `Based on your ${input.objective} objective and ${input.target_locations.length} target location(s), we recommend a ${duration}-day campaign with TTD ${daily_budget}/day to maximize reach and engagement in the Trinidad & Tobago market.`
        };
    }
};

// =====================================================
// AI RECOMMENDATIONS TRACKING
// =====================================================

export const aiRecommendationsTracker = {
    async save(
        advertiser_id: string,
        campaign_id: string,
        type: 'script' | 'caption' | 'budget',
        input: any,
        output: any,
        model_used: string
    ) {
        const { supabase } = await import('./supabaseClient');

        const { error } = await supabase
            .from('ai_recommendations')
            .insert([{
                advertiser_id,
                campaign_id,
                type,
                input_payload: input,
                output_payload: output,
                model_used
            }]);

        if (error) {
            console.error('Failed to track AI recommendation:', error);
        }
    },

    async markAccepted(recommendation_id: string) {
        const { supabase } = await import('./supabaseClient');

        const { error } = await supabase
            .from('ai_recommendations')
            .update({ accepted_by_user: true })
            .eq('id', recommendation_id);

        if (error) {
            console.error('Failed to mark recommendation as accepted:', error);
        }
    }
};
