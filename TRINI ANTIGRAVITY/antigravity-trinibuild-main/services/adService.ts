
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

const DEFAULT_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'c1',
    clientName: 'Massy Motors',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    targetUrl: '/rides',
    placements: ['home', 'rides'],
    isPaidClient: true,
    active: true,
    views: 1250,
    clicks: 45
  },
  {
    id: 'c2',
    clientName: 'Republic Bank',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    targetUrl: '/real-estate',
    placements: ['home', 'real_estate', 'jobs'],
    isPaidClient: true,
    active: true,
    views: 980,
    clicks: 32
  },
  {
    id: 'c3',
    clientName: 'KFC Trinidad',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    targetUrl: '/directory',
    placements: ['marketplace', 'tickets'],
    isPaidClient: false,
    active: true,
    views: 450,
    clicks: 12
  }
];

// Initialize campaigns if empty
if (!localStorage.getItem(CAMPAIGNS_KEY)) {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(DEFAULT_CAMPAIGNS));
}

export const getCampaigns = (): AdCampaign[] => {
  const stored = localStorage.getItem(CAMPAIGNS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CAMPAIGNS;
};

export const saveCampaign = (campaign: AdCampaign): void => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex(c => c.id === campaign.id);
  if (index >= 0) {
    campaigns[index] = campaign;
  } else {
    campaigns.push(campaign);
  }
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

export const deleteCampaign = (id: string): void => {
  const campaigns = getCampaigns().filter(c => c.id !== id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

export const getAdsForPage = (page: string): AdCampaign[] => {
  const campaigns = getCampaigns();

  // Filter by page placement and active status
  const relevantAds = campaigns.filter(c =>
    c.active && c.placements.includes(page as any)
  );

  // Sort: Paid Clients First (Traffic Boost), then random shuffle for fairness among same tier
  // For this demo, we'll just sort by isPaidClient
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
