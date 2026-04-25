/**
 * AGENT 3: Multi-LLM Ensemble Router
 * 
 * Intelligently routes AI tasks to the best model based on:
 * - Task complexity
 * - Cost constraints
 * - Model strengths
 * - Failover logic
 * 
 * Supported Models:
 * - Gemini 2.5 Flash (fast, cheap, good for simple tasks)
 * - Claude 3.5 Sonnet (reasoning, high-quality descriptions)
 * - DeepSeek R1 (deep analysis, competitive research)
 * - xAI Grok (creative, engaging copy)
 * - GPT-4o-mini (fallback, reliable)
 */

// Model configurations
const MODELS = {
  GEMINI: {
    id: 'gemini-2.0-flash-exp',
    costPer1kTokens: 0.00015, // $0.00015/1k input tokens
    strengths: ['speed', 'cost-efficiency', 'simple-tasks'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  },
  CLAUDE: {
    id: 'claude-3-5-sonnet-20241022',
    costPer1kTokens: 0.003, // $0.003/1k input tokens
    strengths: ['reasoning', 'quality', 'complex-descriptions'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  },
  DEEPSEEK: {
    id: 'deepseek-reasoner',
    costPer1kTokens: 0.00055, // $0.00055/1k input tokens  
    strengths: ['analysis', 'research', 'competitive-intelligence'],
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  },
  GROK: {
    id: 'grok-2',
    costPer1kTokens: 0.002, // $0.002/1k input tokens
    strengths: ['creativity', 'engagement', 'viral-copy'],
    endpoint: 'https://api.x.ai/v1/chat/completions',
    apiKey: import.meta.env.VITE_XAI_API_KEY,
  },
  GPT4O_MINI: {
    id: 'gpt-4o-mini',
    costPer1kTokens: 0.00015, // $0.00015/1k input tokens
    strengths: ['fallback', 'reliability', 'general-purpose'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
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

/**
 * Intelligent model selection based on task type
 */
function selectModel(task: LLMRequest['task'], promptLength: number): ModelName {
  // Simple tasks → fast & cheap
  if (promptLength < 500 && task === 'analyze') {
    return 'GEMINI';
  }

  // Creative copy → Grok
  if (task === 'creative-copy') {
    return 'GROK';
  }

  // Competitive research → DeepSeek
  if (task === 'competitive-research') {
    return 'DEEPSEEK';
  }

  // High-quality descriptions → Claude
  if (task === 'optimize' || task === 'refine') {
    return 'CLAUDE';
  }

  // Default: Gemini (fast & cheap)
  return 'GEMINI';
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string, imageUrl?: string, maxTokens = 2000): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = MODELS.GEMINI;

  if (!model.apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not set');
  }

  const contents: any = [{ role: 'user', parts: [{ text: prompt }] }];
  
  if (imageUrl) {
    contents[0].parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: await fetchImageAsBase64(imageUrl),
      },
    });
  }

  const res = await fetch(`${model.endpoint}?key=${model.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.candidates[0].content.parts[0].text;
  const tokensUsed = data.usageMetadata?.totalTokenCount || estimateTokens(prompt + content);

  return {
    content,
    model: 'GEMINI',
    tokensUsed,
    costUSD: (tokensUsed / 1000) * model.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Call Claude API
 */
async function callClaude(prompt: string, imageUrl?: string, maxTokens = 4096): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = MODELS.CLAUDE;

  if (!model.apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY not set');
  }

  const content: any[] = [{ type: 'text', text: prompt }];
  
  if (imageUrl) {
    content.push({
      type: 'image',
      source: {
        type: 'url',
        url: imageUrl,
      },
    });
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': model.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model.id,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.statusText}`);
  }

  const data = await res.json();
  const responseContent = data.content[0].text;
  const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

  return {
    content: responseContent,
    model: 'CLAUDE',
    tokensUsed,
    costUSD: (tokensUsed / 1000) * model.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(prompt: string, maxTokens = 2000): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = MODELS.DEEPSEEK;

  if (!model.apiKey) {
    throw new Error('VITE_DEEPSEEK_API_KEY not set');
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const tokensUsed = data.usage.total_tokens;

  return {
    content,
    model: 'DEEPSEEK',
    tokensUsed,
    costUSD: (tokensUsed / 1000) * model.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Call Grok API
 */
async function callGrok(prompt: string, maxTokens = 2000): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = MODELS.GROK;

  if (!model.apiKey) {
    throw new Error('VITE_XAI_API_KEY not set');
  }

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.9, // Higher temperature for creativity
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok API error: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const tokensUsed = data.usage.total_tokens;

  return {
    content,
    model: 'GROK',
    tokensUsed,
    costUSD: (tokensUsed / 1000) * model.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Call GPT-4o-mini (fallback)
 */
async function callGPT4oMini(prompt: string, imageUrl?: string, maxTokens = 2000): Promise<LLMResponse> {
  const startTime = Date.now();
  const model = MODELS.GPT4O_MINI;

  if (!model.apiKey) {
    throw new Error('VITE_OPENAI_API_KEY not set');
  }

  const messages: any[] = [
    {
      role: 'user',
      content: imageUrl
        ? [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ]
        : prompt,
    },
  ];

  const res = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    throw new Error(`GPT-4o-mini API error: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content;
  const tokensUsed = data.usage.total_tokens;

  return {
    content,
    model: 'GPT4O_MINI',
    tokensUsed,
    costUSD: (tokensUsed / 1000) * model.costPer1kTokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Main router function - intelligently routes to best model
 */
export async function routeToLLM(request: LLMRequest): Promise<LLMResponse> {
  const { task, prompt, imageUrl, maxTokens = 2000, temperature, preferredModel } = request;

  // Use preferred model if specified
  const selectedModel = preferredModel || selectModel(task, prompt.length);

  console.log(`[LLM Router] Task: ${task}, Selected Model: ${selectedModel}`);

  try {
    // Route to selected model
    switch (selectedModel) {
      case 'GEMINI':
        return await callGemini(prompt, imageUrl, maxTokens);
      case 'CLAUDE':
        return await callClaude(prompt, imageUrl, maxTokens);
      case 'DEEPSEEK':
        if (imageUrl) {
          throw new Error('DeepSeek does not support images, falling back');
        }
        return await callDeepSeek(prompt, maxTokens);
      case 'GROK':
        if (imageUrl) {
          throw new Error('Grok does not support images, falling back');
        }
        return await callGrok(prompt, maxTokens);
      case 'GPT4O_MINI':
        return await callGPT4oMini(prompt, imageUrl, maxTokens);
      default:
        throw new Error(`Unknown model: ${selectedModel}`);
    }
  } catch (error) {
    console.error(`[LLM Router] ${selectedModel} failed:`, error);
    
    // Fallback to GPT-4o-mini if primary fails
    if (selectedModel !== 'GPT4O_MINI') {
      console.log('[LLM Router] Falling back to GPT-4o-mini');
      return await callGPT4oMini(prompt, imageUrl, maxTokens);
    }
    
    throw error;
  }
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
 * Helper: Fetch image as base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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
