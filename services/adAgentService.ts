// services/adAgentService.ts
// AI media buyer agent — simulates what a skilled media buyer does daily.

const AI_SERVER = import.meta.env.VITE_AI_SERVER_URL || 'https://juvay.app/ai';
import { supabase } from './supabaseClient';

export interface AgentAction {
  action: 'increase_budget' | 'decrease_budget' | 'pause_campaign' | 'resume_campaign' | 'alert' | 'no_action';
  reason: string;
  campaign_id: string;
  recommended_change?: number;
  urgency: 'low' | 'medium' | 'high';
}

export const adAgentService = {
  // AI analyzes all campaigns and recommends actions
  async analyzeAllCampaigns(): Promise<AgentAction[]> {
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select('*')
      .eq('status', 'active');

    if (!campaigns?.length) return [];

    const summary = campaigns.map(c =>
      `Campaign "${c.name}": spend=$${c.spent}, budget=$${c.budget}, impressions=${c.impressions}, clicks=${c.clicks}, CTR=${c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0}%`
    ).join('\n');

    const prompt = `You are an expert Caribbean digital marketing manager analyzing Facebook ad campaigns for Juvay (a Caribbean commerce platform targeting Trinidad & Tobago, Jamaica, Barbados).

Campaign Data:
${summary}

For each campaign, recommend ONE action:
- increase_budget: if CTR > 3% and spend < 80% of budget
- decrease_budget: if CTR < 1% and spend > 50% of budget
- pause_campaign: if CTR < 0.5% or budget fully spent with no conversions
- no_action: if performing within normal range

Return JSON array: [{"campaign_id": "...", "action": "...", "reason": "...", "urgency": "low|medium|high"}]`;

    try {
      const r = await fetch(`${AI_SERVER}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'llama-3.3-70b-versatile' })
      });
      const data = await r.json();
      const text = data.content || '';
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']') + 1;
      if (start >= 0 && end > start) {
        const actions = JSON.parse(text.slice(start, end));
        return actions.map((a: any) => ({ ...a, recommended_change: a.action === 'increase_budget' ? 20 : -20 }));
      }
    } catch {
      // AI analysis failed — return empty actions
    }
    return [];
  },

  // Generate a weekly performance report for a client
  async generateClientReport(clientName: string, campaigns: any[]): Promise<string> {
    const totalSpend = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    const prompt = `Write a professional weekly Facebook ads performance report for ${clientName}, a Caribbean business.

Metrics this week:
- Total Spend: $${totalSpend.toFixed(2)} USD
- Total Impressions: ${totalImpressions.toLocaleString()}
- Total Clicks: ${totalClicks.toLocaleString()}
- Average CTR: ${avgCTR}%
- Active Campaigns: ${campaigns.length}

Write a 3-paragraph report:
1. Performance summary (positive, professional tone)
2. What worked well and why
3. Recommendations for next week

Keep it under 200 words. Caribbean-business-friendly tone.`;

    const r = await fetch(`${AI_SERVER}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await r.json();
    return data.content || 'Report generation failed.';
  },

  // Generate T&T-specific campaign strategy
  async generateTTStrategy(businessType: string, goal: string): Promise<string> {
    const prompt = `You are an expert in Caribbean digital marketing, specifically Trinidad & Tobago.

Create a Facebook/Instagram ad strategy for a ${businessType} business with goal: ${goal}

Include:
1. Best audience targeting for T&T (age, interests, behaviors)
2. Best posting times for T&T (UTC-4)
3. Recommended budget allocation (% across campaign objectives)
4. Top 3 creative concepts that resonate with Trinidadians
5. Key cultural hooks to use in copy (Carnival season, cricket, doubles, etc.)

Be specific and actionable. Format with clear sections.`;

    const r = await fetch(`${AI_SERVER}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await r.json();
    return data.content || '';
  }
};
