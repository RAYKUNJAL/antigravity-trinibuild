import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceRateLimit, RATE_LIMITS } from './_utils/rateLimit';

const DEFAULT_OPENAI_VISION_MODEL = 'gpt-4o-mini';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

async function callVisionProvider(options: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  imageUrl: string;
  userPrompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: any;
}) {
  const messages: any[] = [];

  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }

  messages.push({
    role: 'user',
    content: [
      { type: 'text', text: options.userPrompt },
      { type: 'image_url', image_url: { url: options.imageUrl, detail: 'high' } },
    ],
  });

  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      max_tokens: options.maxTokens ?? 800,
      temperature: options.temperature ?? 0.2,
      ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Vision provider ${response.status}: ${details}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceRateLimit(req, res, { ...RATE_LIMITS.ai, keyPrefix: 'analyze-image' })) {
    return;
  }

  try {
    const {
      imageUrl,
      prompt,
      system_prompt,
      max_tokens,
      temperature,
      response_format,
    } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const userPrompt = prompt || 'Analyze this product image and provide: 1) Product name/title, 2) Brief description (2-3 sentences), 3) Suggested category. Return as JSON with keys: title, description, category.';
    const localVisionBaseUrl = process.env.LOCAL_VISION_BASE_URL || process.env.LOCAL_LLM_BASE_URL;
    const localVisionModel = process.env.LOCAL_VISION_MODEL;

    if (localVisionBaseUrl && localVisionModel) {
      try {
        const analysis = await callVisionProvider({
          baseUrl: localVisionBaseUrl,
          apiKey: process.env.LOCAL_VISION_API_KEY || process.env.LOCAL_LLM_API_KEY,
          model: localVisionModel,
          imageUrl,
          userPrompt,
          systemPrompt: system_prompt,
          maxTokens: max_tokens,
          temperature,
          responseFormat: response_format,
        });

        return res.status(200).json({
          success: true,
          analysis,
          content: analysis,
          provider: 'local-vision',
          model_used: localVisionModel,
        });
      } catch (error: any) {
        console.warn('Local vision provider unavailable:', error.message);
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'AI vision provider unavailable',
        message: 'Set LOCAL_VISION_BASE_URL + LOCAL_VISION_MODEL or server-side OPENAI_API_KEY.',
      });
    }

    const model = process.env.OPENAI_VISION_MODEL || DEFAULT_OPENAI_VISION_MODEL;
    const analysis = await callVisionProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model,
      imageUrl,
      userPrompt,
      systemPrompt: system_prompt,
      maxTokens: max_tokens,
      temperature,
      responseFormat: response_format,
    });

    return res.status(200).json({
      success: true,
      analysis,
      content: analysis,
      provider: 'openai-fallback',
      model_used: model,
    });

  } catch (error: any) {
    console.error('Error in analyze-image:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
