import { supabase } from '../../services/supabaseClient';

export interface AIGenerationRequest {
  businessId?: string;
  toolSlug: string;
  promptType: string;
  input: Record<string, any>;
}

export interface AIGenerationResult {
  output: string;
  outputJson?: Record<string, any>;
  error?: string;
}

export async function generateAIContent(request: AIGenerationRequest): Promise<AIGenerationResult> {
  try {
    // Lazy-load Google GenAI to avoid bundler issues
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || '' });
    // 1. Load prompt template
    const { data: template } = await supabase
      .from('ai_prompt_templates')
      .select('system_prompt, user_prompt_template, output_format')
      .eq('tool_slug', request.toolSlug)
      .eq('prompt_type', request.promptType)
      .eq('status', 'active')
      .single();

    if (!template) {
      return { output: '', error: 'No prompt template found for this tool.' };
    }

    // 2. Build user prompt by replacing placeholders
    let userPrompt = template.user_prompt_template || '';
    for (const [key, value] of Object.entries(request.input)) {
      userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // 3. Call Google Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: { systemInstruction: template.system_prompt || undefined },
    });

    const outputText = response.text || '';

    // 4. Parse JSON if output format is json
    let outputJson: Record<string, any> | undefined;
    if (template.output_format === 'json') {
      try {
        const jsonMatch = outputText.match(/\{[\s\S]*\}/);
        if (jsonMatch) outputJson = JSON.parse(jsonMatch[0]);
      } catch {}
    }

    // 5. Save generation to database
    if (request.businessId) {
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('ai_generations').insert({
        business_id: request.businessId,
        tool_slug: request.toolSlug,
        prompt_type: request.promptType,
        input_json: request.input,
        output_text: outputText,
        output_json: outputJson,
        created_by: userData.user?.id,
      });
    }

    return { output: outputText, outputJson };
  } catch (error: any) {
    console.error('AI generation error:', error);
    return { output: '', error: error.message || 'AI generation failed' };
  }
}
