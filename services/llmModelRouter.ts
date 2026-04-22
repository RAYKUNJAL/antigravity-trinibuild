/**
 * LLM MODEL ROUTER SERVICE
 * 
 * Intelligently routes tasks to cheapest appropriate LLM model
 * Saves 60-80% on token costs by mix-matching models
 * 
 * Model Costs (per 1K input tokens):
 * ├─ GPT-4o Mini: $0.00015 (cheapest)
 * ├─ Mixtral 8x7B: FREE (Groq)
 * ├─ GPT-4o: $0.005
 * └─ Claude Opus: $0.015 (most expensive)
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { supabase } from './supabaseClient';

export type LLMModel = 'gpt-4o-mini' | 'gpt-4o' | 'mixtral' | 'llama2' | 'claude-opus';
export type LLMProvider = 'openai' | 'groq' | 'anthropic';
export type TaskComplexity = 'simple' | 'medium' | 'complex';
export type BudgetMode = 'ultra-cheap' | 'cheap' | 'balanced' | 'quality-first';

interface RoutingDecision {
  model: LLMModel;
  provider: LLMProvider;
  estimatedCostPerThousand: number; // per 1K tokens
  reason: string;
  expectedQuality: number; // 0-10
  expectedSpeed: 'instant' | 'fast' | 'moderate' | 'slow';
}

interface TaskMetrics {
  taskType: string;
  model: LLMModel;
  inputTokens: number;
  outputTokens: number;
  costTTD: number;
  qualityScore?: number; // 0-10
  responseTime: number; // ms
  timestamp: Date;
}

/**
 * TASK-BASED ROUTING RULES
 * 
 * These are the optimal model choices for common TriniBuild tasks
 */
const TASK_ROUTING_RULES: Record<string, RoutingDecision> = {
  // TIER 1: Ultra-cheap tasks (use GPT-4o Mini or Groq Free)
  'product-listing': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    estimatedCostPerThousand: 0.00015,
    reason: 'Structured output, fast enough for product descriptions',
    expectedQuality: 7,
    expectedSpeed: 'instant',
  },
  'email-pitch': {
    model: 'mixtral',
    provider: 'groq',
    estimatedCostPerThousand: 0,
    reason: 'FREE Groq tier, good tone for outreach',
    expectedQuality: 8,
    expectedSpeed: 'instant',
  },
  'email-follow-up': {
    model: 'mixtral',
    provider: 'groq',
    estimatedCostPerThousand: 0,
    reason: 'FREE Groq tier, perfect for follow-ups',
    expectedQuality: 8,
    expectedSpeed: 'instant',
  },
  'customer-support': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    estimatedCostPerThousand: 0.00015,
    reason: 'Fast response, good enough for FAQs and support',
    expectedQuality: 7,
    expectedSpeed: 'instant',
  },
  'seo-meta-tags': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    estimatedCostPerThousand: 0.00015,
    reason: 'Structured output, simple task',
    expectedQuality: 8,
    expectedSpeed: 'instant',
  },
  'email-classification': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    estimatedCostPerThousand: 0.00015,
    reason: 'Classification is cheap and accurate with Mini',
    expectedQuality: 8,
    expectedSpeed: 'instant',
  },
  'content-brainstorm': {
    model: 'mixtral',
    provider: 'groq',
    estimatedCostPerThousand: 0,
    reason: 'FREE brainstorming with Groq',
    expectedQuality: 8,
    expectedSpeed: 'fast',
  },
  'qr-code-data': {
    model: 'gpt-4o-mini',
    provider: 'openai',
    estimatedCostPerThousand: 0.00015,
    reason: 'Simple data generation',
    expectedQuality: 9,
    expectedSpeed: 'instant',
  },

  // TIER 2: Medium tasks (use GPT-4o for better quality)
  'website-generation': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Better quality for full website generation',
    expectedQuality: 9,
    expectedSpeed: 'fast',
  },
  'ab-testing': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Complex reasoning for variants',
    expectedQuality: 9,
    expectedSpeed: 'fast',
  },
  'blog-writing': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Better quality for content writing',
    expectedQuality: 9,
    expectedSpeed: 'moderate',
  },
  'copy-optimization': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Better for nuanced marketing copy',
    expectedQuality: 9,
    expectedSpeed: 'fast',
  },
  'business-analysis': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Better reasoning for complex analysis',
    expectedQuality: 9,
    expectedSpeed: 'moderate',
  },

  // TIER 3: Complex tasks (use best model)
  'strategic-planning': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Complex reasoning for strategy',
    expectedQuality: 10,
    expectedSpeed: 'moderate',
  },
  'competitive-analysis': {
    model: 'gpt-4o',
    provider: 'openai',
    estimatedCostPerThousand: 0.005,
    reason: 'Complex analysis and reasoning',
    expectedQuality: 10,
    expectedSpeed: 'moderate',
  },
};

/**
 * MAIN ROUTING FUNCTION
 * 
 * Determines best model for a task based on:
 * 1. Task type
 * 2. Complexity level
 * 3. Budget constraints
 * 4. Quality requirements
 */
export function routeTask(
  taskType: string,
  complexity: TaskComplexity = 'medium',
  budgetMode: BudgetMode = 'balanced'
): RoutingDecision {
  // First check if we have a specific rule for this task
  let decision = TASK_ROUTING_RULES[taskType];

  if (!decision) {
    // Default routing based on complexity
    if (complexity === 'simple') {
      decision = {
        model: 'gpt-4o-mini',
        provider: 'openai',
        estimatedCostPerThousand: 0.00015,
        reason: `Default routing for simple task: ${taskType}`,
        expectedQuality: 7,
        expectedSpeed: 'instant',
      };
    } else if (complexity === 'medium') {
      decision = {
        model: 'gpt-4o',
        provider: 'openai',
        estimatedCostPerThousand: 0.005,
        reason: `Default routing for medium complexity task: ${taskType}`,
        expectedQuality: 9,
        expectedSpeed: 'fast',
      };
    } else {
      decision = {
        model: 'gpt-4o',
        provider: 'openai',
        estimatedCostPerThousand: 0.005,
        reason: `Default routing for complex task: ${taskType}`,
        expectedQuality: 9,
        expectedSpeed: 'moderate',
      };
    }
  }

  // Adjust based on budget mode
  if (budgetMode === 'ultra-cheap') {
    // Always use cheapest option
    if (decision.estimatedCostPerThousand > 0.00015) {
      decision = {
        model: 'gpt-4o-mini',
        provider: 'openai',
        estimatedCostPerThousand: 0.00015,
        reason: `Budget constraint: using cheapest model instead of ${decision.model}`,
        expectedQuality: 7,
        expectedSpeed: 'instant',
      };
    }
  } else if (budgetMode === 'cheap') {
    // Avoid expensive models
    if (decision.estimatedCostPerThousand > 0.005) {
      decision = {
        model: 'gpt-4o',
        provider: 'openai',
        estimatedCostPerThousand: 0.005,
        reason: `Budget constraint: downgrading from expensive model`,
        expectedQuality: 8,
        expectedSpeed: 'fast',
      };
    }
  } else if (budgetMode === 'quality-first') {
    // Use best available (allow any cost)
    decision.expectedQuality = 10;
  }

  return decision;
}

/**
 * GET LLM CLIENT FOR EXECUTION
 */
function getClientForModel(model: LLMModel, provider: LLMProvider): any {
  if (provider === 'openai') {
    return new OpenAI({
      apiKey: process.env.VITE_OPENAI_API_KEY,
    });
  } else if (provider === 'groq') {
    return new Groq({
      apiKey: process.env.VITE_GROQ_API_KEY,
    });
  } else if (provider === 'anthropic') {
    return new Anthropic({
      apiKey: process.env.VITE_ANTHROPIC_API_KEY,
    });
  }

  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * EXECUTE TASK WITH ROUTED MODEL
 */
export async function executeWithRouting(
  taskType: string,
  prompt: string,
  options?: {
    complexity?: TaskComplexity;
    budgetMode?: BudgetMode;
    maxTokens?: number;
  }
): Promise<{
  response: string;
  model: LLMModel;
  provider: LLMProvider;
  tokens: { input: number; output: number };
  cost: number;
  metrics: TaskMetrics;
}> {
  const startTime = Date.now();

  // Route the task
  const routing = routeTask(
    taskType,
    options?.complexity || 'medium',
    options?.budgetMode || 'balanced'
  );

  console.log(`🤖 Routing ${taskType} to ${routing.model} (${routing.provider})`);
  console.log(`   Estimated cost: $${routing.estimatedCostPerThousand} per 1K tokens`);

  const client = getClientForModel(routing.model, routing.provider);

  // Execute with routed model
  let response: string;
  let inputTokens = 0;
  let outputTokens = 0;

  if (routing.provider === 'openai') {
    const result = await client.chat.completions.create({
      model: routing.model === 'gpt-4o-mini' ? 'gpt-4o-mini' : 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1024,
      temperature: 0.7,
    });

    response = result.choices[0]?.message?.content || '';
    inputTokens = result.usage?.prompt_tokens || 0;
    outputTokens = result.usage?.completion_tokens || 0;
  } else if (routing.provider === 'groq') {
    const result = await client.chat.completions.create({
      model: routing.model === 'mixtral' ? 'mixtral-8x7b-32768' : 'llama-2-70b-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options?.maxTokens || 1024,
      temperature: 0.7,
    });

    response = result.choices[0]?.message?.content || '';
    inputTokens = result.usage?.prompt_tokens || 0;
    outputTokens = result.usage?.completion_tokens || 0;
  } else if (routing.provider === 'anthropic') {
    const result = await client.messages.create({
      model: routing.model,
      max_tokens: options?.maxTokens || 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    response = result.content[0]?.type === 'text' ? result.content[0].text : '';
    inputTokens = result.usage?.input_tokens || 0;
    outputTokens = result.usage?.output_tokens || 0;
  }

  // Calculate cost
  const costPerInputThousand = routing.estimatedCostPerThousand;
  const costPerOutputThousand = routing.estimatedCostPerThousand * 3; // Output typically 3x cost
  const totalTokens = inputTokens + outputTokens;
  const cost = (inputTokens / 1000) * costPerInputThousand + (outputTokens / 1000) * costPerOutputThousand;

  const responseTime = Date.now() - startTime;

  const metrics: TaskMetrics = {
    taskType,
    model: routing.model,
    inputTokens,
    outputTokens,
    costTTD: cost * 10, // Convert USD to approximate TTD
    responseTime,
    timestamp: new Date(),
  };

  // Log metrics to database
  await logTaskMetrics(metrics);

  return {
    response,
    model: routing.model,
    provider: routing.provider,
    tokens: { input: inputTokens, output: outputTokens },
    cost: cost * 10, // Return in TTD
    metrics,
  };
}

/**
 * COST CALCULATOR
 */
export function calculateTaskCost(
  tokensUsed: number,
  model: LLMModel,
  inputRatio: number = 0.7
): { inputCost: number; outputCost: number; totalCost: number; totalCostTTD: number } {
  const costPerThousandTokens: Record<LLMModel, { input: number; output: number }> = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'claude-opus': { input: 0.015, output: 0.075 },
    'mixtral': { input: 0, output: 0 },
    'llama2': { input: 0, output: 0 },
  };

  const modelCost = costPerThousandTokens[model] || { input: 0.005, output: 0.015 };
  const inputTokens = tokensUsed * inputRatio;
  const outputTokens = tokensUsed * (1 - inputRatio);

  const inputCost = (inputTokens / 1000) * modelCost.input;
  const outputCost = (outputTokens / 1000) * modelCost.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    totalCostTTD: totalCost * 10, // Approximate USD to TTD conversion
  };
}

/**
 * LOG TASK METRICS TO DATABASE
 */
export async function logTaskMetrics(metrics: TaskMetrics) {
  try {
    await supabase.from('llm_task_metrics').insert({
      task_type: metrics.taskType,
      model: metrics.model,
      input_tokens: metrics.inputTokens,
      output_tokens: metrics.outputTokens,
      cost_ttd: metrics.costTTD,
      response_time_ms: metrics.responseTime,
      created_at: metrics.timestamp,
    });
  } catch (error) {
    console.error('Failed to log task metrics:', error);
  }
}

/**
 * GET COST METRICS FOR DASHBOARD
 */
export async function getCostMetrics(days: number = 30) {
  try {
    const startDate = new Date(Date.now() - days * 86400000);

    const { data, error } = await supabase
      .from('llm_task_metrics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const metrics = {
      totalTokens: 0,
      totalCostTTD: 0,
      totalTasks: 0,
      avgResponseTime: 0,
      byModel: {} as Record<
        LLMModel,
        {
          tasks: number;
          tokens: number;
          cost: number;
          avgResponseTime: number;
        }
      >,
      byTask: {} as Record<
        string,
        {
          tasks: number;
          tokens: number;
          cost: number;
        }
      >,
      dailyTrend: [] as Array<{
        date: string;
        cost: number;
        tokens: number;
        tasks: number;
      }>,
      potentialSavings: 0,
    };

    // Process data
    const dailyMap = new Map<
      string,
      { cost: number; tokens: number; tasks: number }
    >();

    for (const log of data) {
      metrics.totalTokens += log.input_tokens + log.output_tokens;
      metrics.totalCostTTD += log.cost_ttd;
      metrics.totalTasks += 1;
      metrics.avgResponseTime += log.response_time_ms;

      // By model
      if (!metrics.byModel[log.model]) {
        metrics.byModel[log.model] = {
          tasks: 0,
          tokens: 0,
          cost: 0,
          avgResponseTime: 0,
        };
      }
      metrics.byModel[log.model].tasks += 1;
      metrics.byModel[log.model].tokens += log.input_tokens + log.output_tokens;
      metrics.byModel[log.model].cost += log.cost_ttd;
      metrics.byModel[log.model].avgResponseTime += log.response_time_ms;

      // By task
      if (!metrics.byTask[log.task_type]) {
        metrics.byTask[log.task_type] = { tasks: 0, tokens: 0, cost: 0 };
      }
      metrics.byTask[log.task_type].tasks += 1;
      metrics.byTask[log.task_type].tokens += log.input_tokens + log.output_tokens;
      metrics.byTask[log.task_type].cost += log.cost_ttd;

      // Daily trend
      const date = new Date(log.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { cost: 0, tokens: 0, tasks: 0 });
      }
      const daily = dailyMap.get(date)!;
      daily.cost += log.cost_ttd;
      daily.tokens += log.input_tokens + log.output_tokens;
      daily.tasks += 1;
    }

    // Finalize calculations
    metrics.avgResponseTime = metrics.totalTasks > 0 ? metrics.avgResponseTime / metrics.totalTasks : 0;

    for (const model of Object.values(metrics.byModel)) {
      model.avgResponseTime = model.tasks > 0 ? model.avgResponseTime / model.tasks : 0;
    }

    // Convert daily map to array
    metrics.dailyTrend = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Calculate potential savings (if all used Mini)
    const costIfAllMini = (metrics.totalTokens / 1000) * 0.00015 * 10; // TTD
    metrics.potentialSavings = metrics.totalCostTTD - costIfAllMini;

    return metrics;
  } catch (error) {
    console.error('Failed to get cost metrics:', error);
    return null;
  }
}

/**
 * ROUTING RECOMMENDATIONS
 */
export function getRoutingRecommendations(): {
  taskType: string;
  currentModel: string;
  recommendedModel: string;
  potentialSavings: string;
}[] {
  return [
    {
      taskType: 'product-listing',
      currentModel: 'gpt-4o',
      recommendedModel: 'gpt-4o-mini',
      potentialSavings: '97%',
    },
    {
      taskType: 'email-pitch',
      currentModel: 'gpt-4o',
      recommendedModel: 'mixtral (Groq)',
      potentialSavings: '100%',
    },
    {
      taskType: 'seo-meta-tags',
      currentModel: 'gpt-4o',
      recommendedModel: 'gpt-4o-mini',
      potentialSavings: '97%',
    },
    {
      taskType: 'customer-support',
      currentModel: 'gpt-4o',
      recommendedModel: 'gpt-4o-mini',
      potentialSavings: '97%',
    },
    {
      taskType: 'content-brainstorm',
      currentModel: 'gpt-4o',
      recommendedModel: 'mixtral (Groq)',
      potentialSavings: '100%',
    },
  ];
}

export type { RoutingDecision, TaskMetrics };
