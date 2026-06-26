const AI_SERVER = import.meta.env.VITE_AI_SERVER_URL || 'https://juvay.app/ai';

export const metaAdsService = {
  async getCampaigns() {
    const r = await fetch(`${AI_SERVER}/meta/campaigns`);
    return r.json();
  },
  async createCampaign(data: { name: string; objective: string; daily_budget_cents: number }) {
    const r = await fetch(`${AI_SERVER}/meta/campaigns`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return r.json();
  },
  async getInsights() {
    const r = await fetch(`${AI_SERVER}/meta/insights`);
    return r.json();
  },
  async generateAdCopy(data: { business_type: string; product: string; island: string; objective: string }) {
    const r = await fetch(`${AI_SERVER}/meta/generate-ad-copy`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    });
    return r.json();
  }
};
