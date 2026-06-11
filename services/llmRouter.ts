/**
 * Multi-LLM router facade.
 *
 * Browser code must never call model providers directly. This facade preserves
 * the app-facing routing API while sending execution through the server AI
 * gateway, where Qwen/OpenAI-compatible provider credentials live.
 */

const MODELS = {
  LOCAL_QWEN: {
    id: 'local-qwen',
    costPer1kTokens: 0,
    strengths: ['local', 'privacy', 'low-cost'],
  },
  GPT4O_MINI: {
    id: 'server-fallback',
    costPer1kTokens: 0.00015,
    strengths: ['fallback', 'reliability', 'general-purpose'],
  },
} as const;

type ModelName = keyof typeof MODELS;

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

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function callServerAIGateway(request: LLMRequest): Promise<LLMResponse> {
  const startTime = Date.now();
  const prompt = request.imageUrl
    ? `${request.prompt}\n\nImage URL: ${request.imageUrl}`
    : request.prompt;

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      system_prompt: `You are TriniBuild's AI model router. Complete the ${request.task} task accurately, concisely, and with Trinidad & Tobago business context when relevant.`,
      max_tokens: request.maxTokens ?? 2000,
      temperature: request.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`AI gateway error: ${response.status} ${details}`);
  }

  const data = await response.json();
  const content = data.content || '';
  const tokensUsed = estimateTokens(prompt + content);
  const model = data.provider === 'local-qwen' ? 'LOCAL_QWEN' : 'GPT4O_MINI';

  return {
    content,
    model,
    tokensUsed,
    costUSD: model === 'LOCAL_QWEN' ? 0 : (tokensUsed / 1000) * MODELS.GPT4O_MINI.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

export async function routeToLLM(request: LLMRequest): Promise<LLMResponse> {
  return callServerAIGateway(request);
}

export async function routeBatch(requests: LLMRequest[]): Promise<LLMResponse[]> {
  return await Promise.all(requests.map(req => routeToLLM(req)));
}

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
