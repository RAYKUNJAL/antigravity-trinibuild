import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceRateLimit, RATE_LIMITS } from '../_utils/rateLimit';

const DEFAULT_LOCAL_MODEL = 'qwen3:8b';
const DEFAULT_LOCAL_BASE_URL = 'http://127.0.0.1:11434/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const jsonHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

async function callOpenAICompatibleProvider(options: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}) {
  const response = await fetch(`${normalizeBaseUrl(options.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`AI provider ${response.status}: ${details}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(jsonHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceRateLimit(req, res, { ...RATE_LIMITS.ai, keyPrefix: 'ai-chat' })) {
    return;
  }

  const startedAt = Date.now();
  const { message, system_prompt, context, persona, max_tokens, temperature } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const systemPrompt = typeof system_prompt === 'string' && system_prompt.trim()
    ? system_prompt
    : `You are TriniBuild AI Concierge. Help users with Trinidad and Tobago commerce, stores, onboarding, documents, rides, jobs, real estate, events, and local business operations. Be concise, practical, and route users to the right TriniBuild feature. Persona: ${persona || 'concierge'}.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: context
        ? `Previous context:\n${context}\n\nCurrent user message:\n${message}`
        : message,
    },
  ];

  const localBaseUrl = process.env.LOCAL_LLM_BASE_URL || DEFAULT_LOCAL_BASE_URL;
  const localModel = process.env.LOCAL_LLM_MODEL || DEFAULT_LOCAL_MODEL;

  try {
    const content = await callOpenAICompatibleProvider({
      baseUrl: localBaseUrl,
      apiKey: process.env.LOCAL_LLM_API_KEY,
      model: localModel,
      messages,
      temperature,
      maxTokens: max_tokens,
    });

    return res.status(200).json({
      content,
      model_used: localModel,
      provider: 'local-qwen',
      processing_time_ms: Date.now() - startedAt,
    });
  } catch (localError: any) {
    console.warn('Local AI provider unavailable:', localError.message);
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: 'AI provider unavailable',
      message: 'Local Qwen is unavailable and OPENAI_API_KEY fallback is not configured.',
    });
  }

  try {
    const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
    const content = await callOpenAICompatibleProvider({
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model,
      messages,
      temperature,
      maxTokens: max_tokens,
    });

    return res.status(200).json({
      content,
      model_used: model,
      provider: 'openai-fallback',
      processing_time_ms: Date.now() - startedAt,
    });
  } catch (error: any) {
    return res.status(502).json({
      error: 'AI provider failed',
      message: error.message,
    });
  }
}
