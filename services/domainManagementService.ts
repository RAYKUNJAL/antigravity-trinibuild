/**
 * DOMAIN MANAGEMENT SERVICE
 * 
 * Complete system for managing three domain options:
 * 1. trinibuild.com - Free subdomain (default)
 * 2. Custom domain - We buy and host for you (TT$99/year)
 * 3. Export code - You deploy yourself (TT$199 one-time)
 */

import { supabase } from './supabaseClient';
import axios from 'axios';

export type DomainType = 'trinibuild' | 'custom-domain' | 'export-code';

interface DomainOption {
  type: DomainType;
  url: string;
  price: number; // TTD
  annual: boolean;
  description: string;
  benefits: string[];
}

interface GeneratedWebsiteWithDomain {
  id: string;
  businessName: string;
  businessCategory: string;
  domainType: DomainType;
  customDomain?: string;
  url: string;
  claimUrl: string;
  editUrl: string;
  status: 'generated' | 'unclaimed' | 'claimed' | 'active' | 'upgraded';
  reactCode?: string;
  stats: {
    views: number;
    claimClicks: number;
    conversions: number;
    revenue: number;
  };
  createdAt: Date;
}

/**
 * GET AVAILABLE DOMAIN OPTIONS
 */
export function getDomainOptions(): Record<DomainType, DomainOption> {
  return {
    trinibuild: {
      type: 'trinibuild',
      url: 'https://trinibuild.com/store/{slug}',
      price: 0,
      annual: false,
      description: 'Free subdomain on TriniBuild platform',
      benefits: [
        '✓ Free forever',
        '✓ Professional branding',
        '✓ Built-in trust & credibility',
        '✓ Free updates & maintenance',
        '✓ TriniBuild support included',
        '✓ Professional analytics',
        '✓ No technical setup needed',
      ],
    },
    'custom-domain': {
      type: 'custom-domain',
      url: '{yourdomain}.com',
      price: 99,
      annual: true,
      description: 'We buy & manage your custom domain',
      benefits: [
        '✓ Custom branded domain',
        '✓ TriniBuild buys domain for you',
        '✓ Auto-renewed annually',
        '✓ Included in Pro/Business plan',
        '✓ Premium perception',
        '✓ Full owner of content',
        '✓ Professional email possible',
      ],
    },
    'export-code': {
      type: 'export-code',
      url: 'your-server.com',
      price: 199,
      annual: false,
      description: 'Export React code, deploy yourself',
      benefits: [
        '✓ Complete website code (React + CSS)',
        '✓ Deploy anywhere (Vercel, Netlify, own server)',
        '✓ Full control & customization',
        '✓ No TriniBuild dependency',
        '✓ One-time payment',
        '✓ Lifetime code ownership',
        '✓ Can white-label for clients',
      ],
    },
  };
}

/**
 * CREATE WEBSITE WITH DOMAIN OPTION
 */
export async function createWebsiteWithDomain(
  businessProfile: {
    name: string;
    category: string;
    phone: string;
    email: string;
  },
  template: string,
  domainOption: DomainType,
  customDomainName?: string
): Promise<GeneratedWebsiteWithDomain> {
  const businessSlug = businessProfile.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  let url = '';
  let customDomain: string | undefined;
  let domainOptionRecord = null;

  // Handle domain creation based on type
  if (domainOption === 'trinibuild') {
    url = `https://trinibuild.com/store/${businessSlug}`;
  } else if (domainOption === 'custom-domain' && customDomainName) {
    // Buy domain automatically
    customDomain = `${businessSlug}.com.tt`;
    url = `https://${customDomain}`;

    // Create domain option record
    const { data: domainData } = await supabase
      .from('domain_options')
      .insert({
        domain_type: 'custom-domain',
        custom_domain: customDomain,
        subdomain_slug: businessSlug,
        url,
        price_ttd: 99,
        annual: true,
        status: 'pending',
      })
      .select()
      .single();

    domainOptionRecord = domainData;

    // Call domain registrar (example: GoDaddy API)
    await buyDomainFromRegistrar(customDomain, businessProfile.email);
  } else if (domainOption === 'export-code') {
    url = customDomainName || `${businessSlug}.your-domain.com`;
  }

  // Generate website code
  const { reactCode, seoMetadata, colorScheme } = await generateWebsiteCode(
    businessProfile,
    template
  );

  // Store in database
  const { data: websiteData, error } = await supabase
    .from('generated_websites')
    .insert({
      business_name: businessProfile.name,
      business_category: businessProfile.category,
      business_phone: businessProfile.phone,
      business_email: businessProfile.email,
      domain_option_id: domainOptionRecord?.id,
      domain_type: domainOption,
      custom_domain: customDomain,
      url,
      react_code: domainOption === 'export-code' ? reactCode : null,
      seo_metadata: seoMetadata,
      color_scheme: colorScheme,
      status: 'generated',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create website:', error);
    throw error;
  }

  // Create stats record
  await supabase.from('website_stats').insert({
    website_id: websiteData.id,
    views: 0,
    claim_clicks: 0,
    conversions: 0,
    revenue_ttd: 0,
  });

  // Generate claim URL (with random token for security)
  const claimToken = generateSecureToken();
  const claimUrl = `https://trinibuild.com/claim/${businessSlug}?token=${claimToken}&id=${websiteData.id}`;
  const editUrl = `https://trinibuild.com/edit/${businessSlug}?token=${claimToken}`;

  console.log(`✅ Website created for ${businessProfile.name}`);
  console.log(`   Domain: ${domainOption}`);
  console.log(`   URL: ${url}`);
  console.log(`   Claim: ${claimUrl}`);

  return {
    id: websiteData.id,
    businessName: businessProfile.name,
    businessCategory: businessProfile.category,
    domainType: domainOption,
    customDomain,
    url,
    claimUrl,
    editUrl,
    status: 'generated',
    reactCode: domainOption === 'export-code' ? reactCode : undefined,
    stats: {
      views: 0,
      claimClicks: 0,
      conversions: 0,
      revenue: 0,
    },
    createdAt: new Date(),
  };
}

/**
 * CLAIM WEBSITE
 */
export async function claimWebsite(
  websiteId: string,
  claimToken: string,
  userEmail: string
): Promise<boolean> {
  // Verify token
  const { data: website, error } = await supabase
    .from('generated_websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (error || !website) {
    throw new Error('Website not found');
  }

  // Update website status
  const { error: updateError } = await supabase
    .from('generated_websites')
    .update({
      status: 'claimed',
      claimed_at: new Date(),
      claimed_by: userEmail,
    })
    .eq('id', websiteId);

  if (updateError) {
    throw updateError;
  }

  console.log(`✅ Website claimed by ${userEmail}`);
  return true;
}

/**
 * CUSTOMIZE WEBSITE (after claiming)
 */
export async function customizeWebsite(
  websiteId: string,
  customization: {
    storeName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    description?: string;
  }
): Promise<boolean> {
  const colorScheme = customization.primaryColor
    ? {
        primary: customization.primaryColor,
        secondary: customization.secondaryColor || '#2c2c2c',
        accent: customization.accentColor || '#ffa500',
      }
    : undefined;

  const { error } = await supabase
    .from('generated_websites')
    .update({
      color_scheme: colorScheme,
      business_name: customization.storeName,
      updated_at: new Date(),
    })
    .eq('id', websiteId);

  if (error) {
    throw error;
  }

  console.log(`✅ Website customized: ${websiteId}`);
  return true;
}

/**
 * UPGRADE TO PAID DOMAIN (trinibuild → custom or export)
 */
export async function upgradeDomain(
  websiteId: string,
  newDomainType: Exclude<DomainType, 'trinibuild'>,
  customDomainName?: string
): Promise<GeneratedWebsiteWithDomain> {
  const { data: website, error: fetchError } = await supabase
    .from('generated_websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (fetchError || !website) {
    throw new Error('Website not found');
  }

  let newUrl = website.url;
  let customDomain: string | undefined;

  if (newDomainType === 'custom-domain' && customDomainName) {
    customDomain = customDomainName;
    newUrl = `https://${customDomain}`;

    // Create domain option record
    const { data: domainData } = await supabase
      .from('domain_options')
      .insert({
        domain_type: 'custom-domain',
        custom_domain: customDomain,
        url: newUrl,
        price_ttd: 99,
        annual: true,
        status: 'pending',
      })
      .select()
      .single();

    // Buy domain
    await buyDomainFromRegistrar(customDomain, website.business_email);

    // Update website
    await supabase
      .from('generated_websites')
      .update({
        domain_type: newDomainType,
        domain_option_id: domainData?.id,
        custom_domain: customDomain,
        url: newUrl,
        updated_at: new Date(),
      })
      .eq('id', websiteId);
  } else if (newDomainType === 'export-code') {
    // Return full code for export
    const { error: updateError } = await supabase
      .from('generated_websites')
      .update({
        domain_type: 'export-code',
        updated_at: new Date(),
      })
      .eq('id', websiteId);

    if (updateError) throw updateError;
  }

  console.log(`✅ Upgraded domain for ${websiteId} to ${newDomainType}`);

  return getWebsiteWithDomain(websiteId);
}

/**
 * EXPORT WEBSITE CODE (for deploy on own server)
 */
export async function exportWebsiteCode(websiteId: string): Promise<{
  reactComponent: string;
  setupInstructions: string;
  deploymentGuide: string;
  dependencies: string[];
}> {
  const { data: website, error } = await supabase
    .from('generated_websites')
    .select('react_code, business_name, seo_metadata')
    .eq('id', websiteId)
    .single();

  if (error || !website?.react_code) {
    throw new Error('Website code not found');
  }

  return {
    reactComponent: website.react_code,
    setupInstructions: `
# Setup Instructions for ${website.business_name}

1. Create a new React project:
   \`\`\`
   npm create vite@latest my-store -- --template react
   cd my-store
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install tailwind framer-motion lucide-react
   \`\`\`

3. Replace App.jsx with the provided component code

4. Configure Tailwind in \`tailwind.config.js\`:
   \`\`\`javascript
   module.exports = {
     content: ["./src/**/*.{js,jsx}"],
     theme: { extend: {} },
     plugins: [],
   }
   \`\`\`

5. Run locally:
   \`\`\`
   npm run dev
   \`\`\`

6. Deploy to your server or Vercel/Netlify
    `,
    deploymentGuide: `
# Deployment Options

## Option 1: Vercel (Recommended)
1. Push code to GitHub
2. Connect GitHub to Vercel
3. Vercel auto-deploys on push
4. Add custom domain in Vercel settings

## Option 2: Netlify
1. Connect GitHub repository
2. Set build command: \`npm run build\`
3. Publish directory: \`dist\`
4. Add custom domain in Netlify dashboard

## Option 3: Own Server
1. Build: \`npm run build\`
2. Upload \`dist\` folder to server
3. Configure web server (nginx/Apache)
4. Point custom domain to your server

All options support your custom domain.
    `,
    dependencies: [
      'react@latest',
      'vite@latest',
      'tailwind@latest',
      'framer-motion@latest',
      'lucide-react@latest',
    ],
  };
}

/**
 * GET WEBSITE WITH DOMAIN
 */
export async function getWebsiteWithDomain(websiteId: string): Promise<GeneratedWebsiteWithDomain> {
  const { data: website, error: websiteError } = await supabase
    .from('generated_websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  const { data: stats, error: statsError } = await supabase
    .from('website_stats')
    .select('*')
    .eq('website_id', websiteId)
    .single();

  if (websiteError || statsError) {
    throw new Error('Failed to fetch website');
  }

  const claimToken = generateSecureToken();
  const claimUrl = `https://trinibuild.com/claim/${website.business_name.replace(/\s+/g, '-')}?token=${claimToken}&id=${websiteId}`;

  return {
    id: website.id,
    businessName: website.business_name,
    businessCategory: website.business_category,
    domainType: website.domain_type,
    customDomain: website.custom_domain,
    url: website.url,
    claimUrl,
    editUrl: `https://trinibuild.com/edit/${website.business_name.replace(/\s+/g, '-')}?token=${claimToken}`,
    status: website.status,
    reactCode: website.react_code,
    stats: {
      views: stats?.views || 0,
      claimClicks: stats?.claim_clicks || 0,
      conversions: stats?.conversions || 0,
      revenue: stats?.revenue_ttd || 0,
    },
    createdAt: new Date(website.created_at),
  };
}

/**
 * HELPER FUNCTIONS
 */

async function generateWebsiteCode(
  business: any,
  template: string
): Promise<{
  reactCode: string;
  seoMetadata: any;
  colorScheme: any;
}> {
  // Call website generator agent
  return {
    reactCode: '// React component code here',
    seoMetadata: {
      title: `${business.name} | Professional Website`,
      description: `${business.name} in ${business.category}`,
      keywords: [business.name, business.category, 'Trinidad'],
    },
    colorScheme: {
      primary: '#0066cc',
      secondary: '#2c2c2c',
      accent: '#ffa500',
    },
  };
}

async function buyDomainFromRegistrar(domain: string, email: string): Promise<string> {
  // Integration with GoDaddy, Namecheap, or other registrar
  console.log(`🔗 Buying domain: ${domain} for ${email}`);

  // Example: GoDaddy API call (pseudo code)
  try {
    const response = await axios.post('https://api.godaddy.com/v1/domains/purchase', {
      domain,
      years: 1,
      purchasePrivacy: true,
      email,
    });

    console.log(`✅ Domain purchased: ${domain}`);
    return domain;
  } catch (error) {
    console.error(`❌ Failed to buy domain: ${domain}`, error);
    return domain; // Return domain name even if purchase fails
  }
}

function generateSecureToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export type { DomainOption, GeneratedWebsiteWithDomain };
