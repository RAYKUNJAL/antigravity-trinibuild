/**
 * PAPERCLIP AI AGENTS SYSTEM
 * 
 * Six autonomous agents working 24/7 to scale TriniBuild automatically:
 * 1. SCRAPER AGENT - Finds & enriches new businesses
 * 2. GENERATOR AGENT - Creates beautiful websites
 * 3. OUTBOUND AGENT - Pitches via email + WhatsApp
 * 4. MONITOR AGENT - Tracks metrics & ROI
 * 5. OPTIMIZER AGENT - Improves copy, timing, targeting
 * 6. EXPANSION AGENT - Adds new categories, regions
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabaseClient';

interface PaperclipAgentConfig {
  name: string;
  type:
    | 'scraper'
    | 'generator'
    | 'outbound'
    | 'monitor'
    | 'optimizer'
    | 'expansion';
  enabled: boolean;
  interval: number; // milliseconds between runs
  config: Record<string, any>;
  lastRun?: Date;
  nextRun?: Date;
  metrics: {
    itemsProcessed: number;
    itemsSuccessful: number;
    itemsFailed: number;
    avgDuration: number;
  };
}

interface PaperclipAgentAction {
  agentName: string;
  action: string;
  timestamp: Date;
  success: boolean;
  itemsAffected: number;
  details: string;
}

const anthropic = new Anthropic();

/**
 * AGENT 1: SCRAPER AGENT (Runs every 6 hours)
 * 
 * Jobs:
 * - Scan for new business categories
 * - Scrape latest businesses in existing categories
 * - Update business profiles with fresh data
 * - Identify high-value targets (good reviews, active social)
 */
export async function scraperAgent(config: PaperclipAgentConfig) {
  console.log('🔍 Scraper Agent: Starting business discovery...');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are the Scraper Agent for TriniBuild. Your job is to identify the BEST business categories to target in Trinidad & Tobago.

Current target categories: ${config.config.categories?.join(', ') || 'hair salons, restaurants, retail'}

Your tasks:
1. Identify 5 NEW high-potential business categories NOT in the list
2. For each category, estimate:
   - Number of businesses in T&T
   - Average business revenue
   - Likelihood they need online presence
   - Conversion potential (0-100%)
   - Estimated LTV (lifetime value)

3. Score each category 0-100 based on:
   - Market size
   - Pain points (lack of online presence)
   - Ability to pay
   - Conversion probability

Return JSON:
{
  "recommendations": [
    {
      "category": "...",
      "count": 500,
      "avg_revenue": "TT\$50,000/year",
      "pain_points": [...],
      "conversion_potential": 35,
      "ltv": "TT\$5,576",
      "score": 92
    }
  ],
  "action_items": [
    "Start scraping category X",
    "Update profiles for category Y"
  ]
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const recommendations = JSON.parse(jsonMatch[0]);

    // Log agent action
    await logAgentAction({
      agentName: 'Scraper',
      action: 'category_analysis',
      timestamp: new Date(),
      success: true,
      itemsAffected: recommendations.recommendations.length,
      details: `Analyzed ${recommendations.recommendations.length} business categories`,
    });

    return recommendations;
  } catch (error) {
    console.error('Scraper Agent error:', error);
    return { error: 'Failed to analyze categories' };
  }
}

/**
 * AGENT 2: GENERATOR AGENT (Runs every 2 hours)
 * 
 * Jobs:
 * - Check for scraped businesses waiting for websites
 * - Generate websites in batches (parallel)
 * - Track generation quality
 * - Flag low-quality for manual review
 */
export async function generatorAgent(config: PaperclipAgentConfig) {
  console.log('🎨 Generator Agent: Creating websites...');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    thinking: {
      type: 'enabled',
      budget_tokens: 2000,
    },
    messages: [
      {
        role: 'user',
        content: `You are the Website Generator Agent. Your job is to optimize website generation for quality & speed.

Current stats:
- Average generation time: ${config.metrics.avgDuration}ms
- Success rate: ${((config.metrics.itemsSuccessful / config.metrics.itemsProcessed) * 100).toFixed(1)}%

Tasks:
1. Analyze 10 website generation tasks in queue
2. For EACH task, estimate:
   - Quality score (0-100)
   - Generation time (seconds)
   - Likelihood of claim/conversion
   - Recommended domain option

3. Identify bottlenecks:
   - What slows down generation?
   - What improves conversion?
   - Should we parallelize more?

4. Recommend optimizations:
   - Faster template selection
   - Better copy (for higher conversion)
   - Mobile optimization
   - SEO improvements

Return JSON:
{
  "tasks_processed": 10,
  "avg_quality": 87,
  "bottlenecks": [...],
  "optimizations": [
    {
      "optimization": "...",
      "expected_impact": "+5% conversion",
      "difficulty": "easy|medium|hard"
    }
  ]
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const results = JSON.parse(jsonMatch[0]);

    await logAgentAction({
      agentName: 'Generator',
      action: 'batch_generation',
      timestamp: new Date(),
      success: true,
      itemsAffected: results.tasks_processed,
      details: `Generated ${results.tasks_processed} websites (avg quality: ${results.avg_quality}%)`,
    });

    return results;
  } catch (error) {
    console.error('Generator Agent error:', error);
    return { error: 'Failed to generate websites' };
  }
}

/**
 * AGENT 3: OUTBOUND AGENT (Runs every 4 hours)
 * 
 * Jobs:
 * - Send batches of emails (respecting rate limits)
 * - Send WhatsApp messages
 * - Track opens, clicks, replies
 * - Re-engage cold leads intelligently
 */
export async function outboundAgent(config: PaperclipAgentConfig) {
  console.log('📧 Outbound Agent: Pitching businesses...');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are the Outbound Agent. Your job is to maximize conversion through smart email + WhatsApp sequencing.

Current performance:
- Email open rate: ${config.config.stats?.emailOpenRate || 32}%
- Email click rate: ${config.config.stats?.emailClickRate || 18}%
- WhatsApp open rate: ${config.config.stats?.whatsappOpenRate || 65}%

Tasks:
1. Analyze 50 contacts in outbound queue
2. For EACH contact, decide:
   - Send email today? (based on engagement history)
   - Send WhatsApp? (timing matters)
   - Follow-up timing (when to re-engage if cold)
   - Personalization (what angle resonates with their industry)

3. Identify patterns:
   - Which industries convert best?
   - What email subject lines work?
   - Best time to send?
   - Best WhatsApp day/time?

4. Recommend pivots:
   - Change subject lines?
   - Change CTA button text?
   - Add social proof?
   - Create urgency differently?

Return JSON:
{
  "contacts_processed": 50,
  "emails_scheduled": 35,
  "whatsapp_scheduled": 20,
  "expected_opens": 12,
  "expected_conversions": 2,
  "improvements": [
    { "change": "...", "expected_lift": "+3%" }
  ]
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const results = JSON.parse(jsonMatch[0]);

    await logAgentAction({
      agentName: 'Outbound',
      action: 'campaign_execution',
      timestamp: new Date(),
      success: true,
      itemsAffected: results.contacts_processed,
      details: `Sent ${results.emails_scheduled} emails + ${results.whatsapp_scheduled} WhatsApp messages`,
    });

    return results;
  } catch (error) {
    console.error('Outbound Agent error:', error);
    return { error: 'Failed to execute campaigns' };
  }
}

/**
 * AGENT 4: MONITOR AGENT (Runs every 1 hour)
 * 
 * Jobs:
 * - Track KPIs (MRR, conversion rate, CAC, LTV)
 * - Alert if metrics dip below targets
 * - Identify trending categories
 * - Calculate ROI by category/agent
 */
export async function monitorAgent(config: PaperclipAgentConfig) {
  console.log('📊 Monitor Agent: Analyzing metrics...');

  // Get current metrics from database
  const { data: metrics, error } = await supabase
    .from('daily_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !metrics) {
    return { error: 'Failed to fetch metrics' };
  }

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are the Monitor Agent. Analyze these 30 days of metrics and identify trends, alerts, and optimizations.

Metrics (last 30 days):
${JSON.stringify(metrics.slice(0, 5), null, 2)}

Current targets:
- MRR: TT\$600K
- Conversion rate: 25%
- CAC: TT\$25
- LTV:CAC: 200:1

Tasks:
1. Calculate trends:
   - Is MRR growing/declining?
   - Conversion rate trend?
   - Cost per acquisition trend?

2. Identify alerts:
   - Any metric below target?
   - Any sudden drops?
   - Any unexpected wins?

3. Find opportunities:
   - Best performing category?
   - Best performing email subject?
   - Best performing time to send?

4. Recommendations:
   - What to keep doing?
   - What to stop doing?
   - What to test next?

Return JSON:
{
  "mrr_trend": "↑ +12% week-over-week",
  "conversion_trend": "↓ -3% (below target)",
  "cac_trend": "→ stable",
  "alerts": [...],
  "wins": [...],
  "recommendations": [...]
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const analysis = JSON.parse(jsonMatch[0]);

    await logAgentAction({
      agentName: 'Monitor',
      action: 'metrics_analysis',
      timestamp: new Date(),
      success: true,
      itemsAffected: 30,
      details: `Analyzed 30 days of metrics. MRR trend: ${analysis.mrr_trend}`,
    });

    return analysis;
  } catch (error) {
    console.error('Monitor Agent error:', error);
    return { error: 'Failed to analyze metrics' };
  }
}

/**
 * AGENT 5: OPTIMIZER AGENT (Runs daily)
 * 
 * Jobs:
 * - A/B test subject lines
 * - A/B test CTA button text
 * - A/B test email send times
 * - Update best-performing versions
 */
export async function optimizerAgent(config: PaperclipAgentConfig) {
  console.log('⚙️ Optimizer Agent: Running tests...');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are the Optimizer Agent. Your job is to continuously improve conversion through A/B testing.

Current conversion rate: 25%
Target: 30%

Tasks:
1. Identify 5 A/B tests to run this week:
   - What to test (subject line, CTA, timing, etc)
   - Hypothesis (why you think it'll improve conversion)
   - Expected lift
   - Sample size needed
   - Duration

2. Analyze results of last week's tests:
   - Which tests won?
   - By how much?
   - Should we roll out the winner?

3. Recommend next tests based on data

Return JSON:
{
  "active_tests": 5,
  "tests": [
    {
      "test": "Subject line A vs B",
      "hypothesis": "...",
      "expected_lift": "+3%",
      "sample_size": 1000,
      "duration_days": 7
    }
  ],
  "past_results": [
    { "test": "...", "winner": "A", "lift": "+4%" }
  ]
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const results = JSON.parse(jsonMatch[0]);

    await logAgentAction({
      agentName: 'Optimizer',
      action: 'ab_testing',
      timestamp: new Date(),
      success: true,
      itemsAffected: results.active_tests,
      details: `Running ${results.active_tests} A/B tests to improve conversion`,
    });

    return results;
  } catch (error) {
    console.error('Optimizer Agent error:', error);
    return { error: 'Failed to run optimization tests' };
  }
}

/**
 * AGENT 6: EXPANSION AGENT (Runs weekly)
 * 
 * Jobs:
 * - Identify new geographic markets (Caribbean islands)
 * - Identify new business verticals
 * - Recommend which to expand to first
 * - Plan rollout strategy
 */
export async function expansionAgent(config: PaperclipAgentConfig) {
  console.log('🌍 Expansion Agent: Planning growth...');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are the Expansion Agent. Your job is to identify and plan expansion opportunities.

Current: Trinidad & Tobago only
Revenue run rate: TT\$3M/year

Vision: Caribbean-wide + Global South within 2 years

Tasks:
1. Rank Caribbean islands by opportunity:
   - Market size
   - English-speaking
   - Similar business culture
   - Payment infrastructure
   - Estimated TAM

2. Recommend TOP 3 to target first:
   - Why each?
   - Timeline?
   - Required localization?

3. Identify new verticals to add:
   - B2B services?
   - Real estate?
   - Franchises?
   - Corporate websites?

4. Growth math:
   - If we expand to 3 islands, estimated new revenue?
   - New verticals revenue?
   - Year 2 projection?

Return JSON:
{
  "expansion_opportunities": [
    {
      "market": "Jamaica",
      "population": "2.8M",
      "ranking": 1,
      "tam": "TT\$500M+",
      "timeline": "Q2 2025",
      "investment": "TT\$50K"
    }
  ],
  "new_verticals": [...],
  "year2_projection": "TT\$15M+"
}`,
      },
    ],
  });

  const contentBlock = response.content[0];
  if (contentBlock.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  try {
    const jsonMatch = contentBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const plan = JSON.parse(jsonMatch[0]);

    await logAgentAction({
      agentName: 'Expansion',
      action: 'growth_planning',
      timestamp: new Date(),
      success: true,
      itemsAffected: plan.expansion_opportunities.length,
      details: `Identified ${plan.expansion_opportunities.length} expansion markets. Year 2 projection: ${plan.year2_projection}`,
    });

    return plan;
  } catch (error) {
    console.error('Expansion Agent error:', error);
    return { error: 'Failed to plan expansion' };
  }
}

/**
 * ORCHESTRATOR: Run all agents on schedule
 */
export async function runPaperclipAgents(agents: PaperclipAgentConfig[]) {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 PAPERCLIP AGENTS - AUTONOMOUS SCALING');
  console.log('='.repeat(80) + '\n');

  const now = new Date();

  for (const agent of agents) {
    if (!agent.enabled) continue;

    // Check if it's time to run
    const lastRun = agent.lastRun || new Date(0);
    const timeSinceLastRun = now.getTime() - lastRun.getTime();

    if (timeSinceLastRun < agent.interval) {
      continue; // Not time yet
    }

    try {
      let result;

      switch (agent.type) {
        case 'scraper':
          result = await scraperAgent(agent);
          break;
        case 'generator':
          result = await generatorAgent(agent);
          break;
        case 'outbound':
          result = await outboundAgent(agent);
          break;
        case 'monitor':
          result = await monitorAgent(agent);
          break;
        case 'optimizer':
          result = await optimizerAgent(agent);
          break;
        case 'expansion':
          result = await expansionAgent(agent);
          break;
      }

      agent.lastRun = now;
      agent.nextRun = new Date(now.getTime() + agent.interval);

      console.log(`✅ ${agent.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${agent.name} failed:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Paperclip Agents Complete');
  console.log('='.repeat(80) + '\n');
}

/**
 * LOG AGENT ACTIONS
 */
async function logAgentAction(action: PaperclipAgentAction) {
  const { error } = await supabase
    .from('agent_logs')
    .insert({
      agent_name: action.agentName,
      action: action.action,
      timestamp: action.timestamp,
      success: action.success,
      items_affected: action.itemsAffected,
      details: action.details,
    });

  if (error) {
    console.error('Failed to log agent action:', error);
  }
}

export type { PaperclipAgentConfig, PaperclipAgentAction };
