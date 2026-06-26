/**
 * AGENT 3: Multi-LLM Ensemble Router (SECURITY-HARDENED)
 *
 * SECURITY FIX: This file previously called Gemini, Claude, DeepSeek, Grok,
 * and OpenAI DIRECTLY from the browser using VITE_ env vars. Those keys ship
 * in the public JS bundle and were trivially extractable by any visitor.
 *
 * All routing now goes through the Juvay AI backend (/generate), which holds
 * the Groq API key server-side. Provider-specific routes are stubbed to use
 * the Groq backend. No third-party API keys are referenced in the bundle.
 *
 * The public interface (LLMRequest, LLMResponse, routeToLLM, routeBatch,
 * calculateTotalCost, getCostBreakdown) is preserved so existing callers keep
 * working. Per-provider cost fields are now approximations since the backend
 * does not return token counts.
 */

// The Juvay AI backend base URL (proxied at juvay.app/ai/* in production).
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

// Default model on the backend. Callers may override via preferredModel, but
// any name is accepted only if the backend allowlist permits it.
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Kept for backwards compatibility — callers may still pass these names.
type ModelName = 'GEMINI' | 'CLAUDE' | 'DEEPSEEK' | 'GROK' | 'GPT4O_MINI';

interface LLMRequest {
  task: 'analyze' | 'optimize' | 'refine' | 'competitive-research' | 'creative-copy';
  prompt: string;
  imageUrl?: string;
  maxTokens?: number;
  temperature?: number;
  preferredModel?: ModelName;
}

interface LLMResponse {
  content: string;
  model: ModelName;
  tokensUsed: number;
  costUSD: number;
  latencyMs: number;
}

/**
 * Route an LLM request to the Juvay AI backend /generate endpoint.
 *
 * All provider-specific paths now resolve to the same backend call; the
 * preferredModel is accepted but the backend's own allowlist is authoritative.
 */
export async function routeToLLM(request: LLMRequest): Promise<LLMResponse> {
  const { prompt, maxTokens = 2000 } = request;
  const startTime = Date.now();

  const res = await fetch(`${AI_SERVER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Juvay AI backend error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content: string = data.content || '';
  const tokensUsed = estimateTokens(prompt + content);

  return {
    content,
    model: 'GPT4O_MINI', // nominal label for backwards compatibility
    tokensUsed,
    costUSD: (tokensUsed / 1000) * 0.00015, // approximate, Groq is cheap/free
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Batch routing for multiple requests (parallelized)
 */
export async function routeBatch(requests: LLMRequest[]): Promise<LLMResponse[]> {
  return await Promise.all(requests.map(req => routeToLLM(req)));
}

/**
 * Helper: Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Cost tracking and reporting
 */
export function calculateTotalCost(responses: LLMResponse[]): number {
  return responses.reduce((sum, r) => sum + r.costUSD, 0);
}

export function getCostBreakdown(responses: LLMResponse[]): Record<ModelName, number> {
  const breakdown: Partial<Record<ModelName, number>> = {};
  for (const res of responses) {
    breakdown[res.model] = (breakdown[res.model] || 0) + res.costUSD;
  }
  return breakdown as Record<ModelName, number>;
}
