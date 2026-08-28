
// services/adService.ts

export interface AdCampaign {
  id: string;
  clientName: string;
  videoUrl: string;
  targetUrl: string;
  placements: ('home' | 'marketplace' | 'rides' | 'jobs' | 'tickets' | 'real_estate')[];
  isPaidClient: boolean; // "Boost" feature for paid customers
  active: boolean;
  views: number;
  clicks: number;
}

const CAMPAIGNS_KEY = 'trinibuild_ad_campaigns';

const DEMO_CAMPAIGN_IDS = new Set(['c1', 'c2', 'c3']);

const isDemoCampaign = (campaign: AdCampaign): boolean => DEMO_CAMPAIGN_IDS.has(campaign.id);

const readStoredCampaigns = (): AdCampaign[] => {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(CAMPAIGNS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistCampaigns = (campaigns: AdCampaign[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

export const getCampaigns = (): AdCampaign[] => {
  const stored = readStoredCampaigns();
  const honest = stored.filter(campaign => !isDemoCampaign(campaign));
  if (honest.length !== stored.length) {
    persistCampaigns(honest);
  }
  return honest;
};

export const saveCampaign = (campaign: AdCampaign): void => {
  if (isDemoCampaign(campaign)) return;
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  persistCampaigns(campaigns);
};

export const deleteCampaign = (id: string): void => {
  const campaigns = getCampaigns().filter(c => c.id !== id);
  persistCampaigns(campaigns);
};

export const getAdsForPage = (page: string): AdCampaign[] => {
  const campaigns = getCampaigns();

  const relevantAds = campaigns.filter(c =>
    c.active && c.placements.includes(page as any)
  );

  return relevantAds.sort((a, b) => {
    if (a.isPaidClient && !b.isPaidClient) return -1;
    if (!a.isPaidClient && b.isPaidClient) return 1;
    return 0;
  });
};

export const recordImpression = (id: string) => {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  if (campaign) {
    campaign.views += 1;
    saveCampaign(campaign);
  }
};

export const recordClick = (id: string) => {
  const campaigns = getCampaigns();
  const campaign = campaigns.find(c => c.id === id);
  if (campaign) {
    campaign.clicks += 1;
    saveCampaign(campaign);
  }
};

// Legacy support for dashboard stats
export const getTrafficStats = () => {
  const campaigns = getCampaigns();
  const totalViews = campaigns.reduce((sum, c) => sum + c.views, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);

  return {
    totalVisits: totalViews * 1.5, // Mock multiplier
    adImpressions: totalViews,
    videoViews: totalViews,
    ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0,
    sources: [
      { name: 'Organic Search', value: 45 },
      { name: 'Direct', value: 25 },
      { name: 'Social', value: 20 },
      { name: 'Referral', value: 10 },
    ],
    distribution: [
      { section: 'Directory', percentage: 40, revenue: 1200 },
      { section: 'Marketplace', percentage: 35, revenue: 2400 },
      { section: 'Jobs', percentage: 15, revenue: 450 },
      { section: 'Blog', percentage: 10, revenue: 120 },
    ]
  };
};

// Legacy types for compatibility if needed elsewhere
export interface AdConfig {
  topVideo: { url: string; active: boolean; title: string; link: string; };
  midVideo: { url: string; active: boolean; title: string; link: string; };
  adSenseEnabled: boolean;
  featuredDestination: { name: string; url: string; active: boolean; };
}
export const getAdConfig = (): AdConfig => {
  // Return a dummy config to satisfy legacy calls in AdminDashboard until we fully migrate
  return {
    topVideo: { url: '', active: false, title: '', link: '' },
    midVideo: { url: '', active: false, title: '', link: '' },
    adSenseEnabled: true,
    featuredDestination: { name: '', url: '', active: false }
  };
};
export const saveAdConfig = (config: AdConfig) => { };
