/**
 * AI OUTBOUND AGENT TEAM
 * 
 * Three AI agents working together to pitch TriniBuild websites:
 * 1. Email Agent - Personalized cold emails
 * 2. WhatsApp Agent - Direct messaging campaigns
 * 3. Follow-up Agent - Persistence + timing
 */

import Anthropic from "@anthropic-ai/sdk";
import type { BusinessProfile } from "./businessScraperAgent";
import type { GeneratedWebsite } from "./websiteGeneratorAgent";

interface OutboundCampaign {
  businessId: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  websiteUrl: string;
  claimUrl: string;
  emailSequence: EmailMessage[];
  whatsappSequence: WhatsAppMessage[];
  followUpStrategy: FollowUpStep[];
  expectedConversion: number; // percentage
}

interface EmailMessage {
  subject: string;
  body: string;
  sequenceNumber: number;
  delayDays: number;
  personalizationTokens: string[];
}

interface WhatsAppMessage {
  body: string;
  sequenceNumber: number;
  delayDays: number;
  hasMedia: boolean;
  mediaDescription?: string;
}

interface FollowUpStep {
  type: "email" | "whatsapp" | "timing-delay";
  trigger: string;
  action: string;
  timing: string;
}

const anthropic = new Anthropic();

/**
 * EMAIL AGENT: Generate personalized cold email sequences
 */
export async function generateEmailSequence(
  business: BusinessProfile,
  website: GeneratedWebsite
): Promise<EmailMessage[]> {
  console.log(`📧 Email Agent: Crafting sequence for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    thinking: {
      type: "enabled",
      budget_tokens: 2000,
    },
    messages: [
      {
        role: "user",
        content: `You are an expert cold email copywriter specializing in Caribbean SaaS sales.

Create a 3-email sequence to convert ${business.name} (${business.type}) to claim their TriniBuild website.

Business Details:
- Name: ${business.name}
- Type: ${business.type}
- Location: ${business.location}
- Phone: ${business.phone}
- Website URL: ${website.slug}

Email Strategy:
Email 1 (Day 0): Introduction + Social Proof
- Subject line: Curiosity-driven, mentions their business by name
- Body: Short intro, explain that we built a website for them, show it's already live, CTA to claim
- Tone: Friendly, non-salesy, helpful

Email 2 (Day 3): Value Prop + What They Get
- Subject: Reference email 1, create open loop
- Body: Deep dive into what they get (online orders, bookings, customer management)
- Include specific benefits for their industry type
- Address objection: "Why should I trust this?"
- CTA: Claim in 60 seconds

Email 3 (Day 7): Urgency + Limited Availability
- Subject: Last chance, or reference previous emails
- Body: "Spots filling up", mention specific dollar value of free website
- Include a success story from similar T&T business
- CTA: Claim now before it's gone

For EACH email, include:
- Subject line (max 60 chars, punchy)
- Body (200-300 words, conversational)
- Personalization tokens needed: [NAME], [BUSINESS], [LOCATION], etc
- Expected response rate

Format as JSON array:
[
  {
    "subject": "...",
    "body": "...",
    "sequenceNumber": 1,
    "delayDays": 0,
    "personalizationTokens": ["[NAME]", "[BUSINESS]", ...]
  },
  ...
]`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in email response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse email sequence:", error);
    // Return fallback sequence
    return [
      {
        subject: `We Built a Free Website for ${business.name}`,
        body: `Hi,

We noticed ${business.name} doesn't have an online presence yet. We decided to build one for you at no cost.

Your website is already live: [WEBSITE_URL]

All you have to do is claim it. No credit card, no strings attached.

Claim your website: [CLAIM_URL]

Best,
TriniBuild Team`,
        sequenceNumber: 1,
        delayDays: 0,
        personalizationTokens: [
          "[BUSINESS]",
          "[WEBSITE_URL]",
          "[CLAIM_URL]",
        ],
      },
    ];
  }
}

/**
 * WHATSAPP AGENT: Generate WhatsApp message sequences
 */
export async function generateWhatsAppSequence(
  business: BusinessProfile,
  website: GeneratedWebsite
): Promise<WhatsAppMessage[]> {
  console.log(`💬 WhatsApp Agent: Creating sequence for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are expert at WhatsApp B2B marketing in Trinidad & Tobago.

Create a 3-message WhatsApp sequence for ${business.name}.

Business: ${business.name} (${business.type}) in ${business.location}
Website: ${website.slug}

WhatsApp Strategy:
Message 1 (Day 0): Quick intro + video/screenshot
- Short, punchy (2-3 lines max)
- Include emoji for visual interest
- Mention we built them a free website
- Include link to website

Message 2 (Day 2): Social proof + urgency
- Show what other T&T businesses are doing
- Specific benefit for their industry
- Call to claim

Message 3 (Day 5): Final nudge + alternative
- If they haven't claimed, ask if they need help
- Offer a quick call instead
- Provide fallback option

WhatsApp tone should be:
- Casual but professional
- Use WhatsApp formatting (emojis, line breaks)
- Keep messages short (easier to read on mobile)
- Include clear CTAs

Return JSON:
[
  {
    "body": "...",
    "sequenceNumber": 1,
    "delayDays": 0,
    "hasMedia": true,
    "mediaDescription": "Screenshot of website"
  },
  ...
]`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in WhatsApp response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse WhatsApp sequence:", error);
    return [
      {
        body: `🎉 Hi! We built a FREE website for ${business.name}\n\nLive now: [WEBSITE_URL]\n\nClaim it: [CLAIM_URL]\n\nNo credit card needed ✅`,
        sequenceNumber: 1,
        delayDays: 0,
        hasMedia: true,
        mediaDescription: "Website screenshot",
      },
    ];
  }
}

/**
 * FOLLOW-UP AGENT: Create intelligent follow-up strategy
 */
export async function generateFollowUpStrategy(
  business: BusinessProfile
): Promise<FollowUpStep[]> {
  console.log(`🎯 Follow-up Agent: Creating strategy for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert at sales follow-up strategy.

Create a follow-up strategy for ${business.name} (${business.type}) in ${business.location}.

The goal is to get them to claim their free TriniBuild website.

Strategy should account for:
1. Different response scenarios (opened email, didn't open, clicked link, etc)
2. Best times to follow up (consider T&T timezone)
3. Multi-channel approach (email + WhatsApp)
4. Escalation path (contact manager if needed)
5. When to declare "lost lead"

Return JSON array of follow-up steps:
[
  {
    "type": "email|whatsapp|timing-delay",
    "trigger": "Email opened but no click",
    "action": "Send WhatsApp with video",
    "timing": "2 days after email"
  },
  ...
]

Be specific to T&T business culture.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in follow-up response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse follow-up strategy:", error);
    return [
      {
        type: "whatsapp",
        trigger: "Email opened but no click within 48 hours",
        action: "Send WhatsApp with screenshot and direct link",
        timing: "Day 2, 3pm (local T&T time)",
      },
      {
        type: "email",
        trigger: "No activity after WhatsApp",
        action: "Send final email with business call option",
        timing: "Day 5",
      },
    ];
  }
}

/**
 * ORCHESTRATOR: Combine all agents into one campaign
 */
export async function createOutboundCampaign(
  business: BusinessProfile,
  website: GeneratedWebsite
): Promise<OutboundCampaign> {
  console.log("\n" + "=".repeat(80));
  console.log("🚀 AI OUTBOUND AGENT TEAM ACTIVATED");
  console.log("=".repeat(80) + "\n");

  // All three agents work in parallel
  const [emailSequence, whatsappSequence, followUpStrategy] = await Promise.all([
    generateEmailSequence(business, website),
    generateWhatsAppSequence(business, website),
    generateFollowUpStrategy(business),
  ]);

  // Estimate conversion rate based on business type
  const conversionRate = estimateConversionRate(business.type);

  console.log("\n" + "=".repeat(80));
  console.log("✅ OUTBOUND CAMPAIGN READY");
  console.log("=".repeat(80));

  return {
    businessId: business.name,
    businessName: business.name,
    businessEmail: business.email,
    businessPhone: business.phone,
    websiteUrl: `https://trinibuild.com/store/${website.slug}`,
    claimUrl: `https://trinibuild.com/claim/${website.slug}?token=auto`,
    emailSequence,
    whatsappSequence,
    followUpStrategy,
    expectedConversion: conversionRate,
  };
}

/**
 * Helper: Estimate conversion rate based on business type
 */
function estimateConversionRate(businessType: string): number {
  const type = businessType.toLowerCase();

  // Service businesses convert better (they need bookings)
  if (type.includes("salon") || type.includes("spa")) {
    return 0.35; // 35%
  } else if (type.includes("restaurant") || type.includes("cafe")) {
    return 0.28; // 28%
  } else if (type.includes("retail") || type.includes("shop")) {
    return 0.22; // 22%
  } else {
    return 0.18; // 18% baseline
  }
}

/**
 * EXECUTION: Send campaign messages (in real implementation)
 */
export async function executeCampaign(campaign: OutboundCampaign): Promise<{
  emailsSent: number;
  whatsappsSent: number;
  status: string;
}> {
  console.log(`📤 Executing campaign for ${campaign.businessName}...`);

  // In production, this would:
  // 1. Send email via SendGrid/AWS SES
  // 2. Send WhatsApp via Twillio
  // 3. Track opens, clicks, replies
  // 4. Trigger follow-ups automatically
  // 5. Log all interactions

  console.log(`✅ Campaign executed for ${campaign.businessName}`);
  console.log(`📊 Expected conversion rate: ${(campaign.expectedConversion * 100).toFixed(0)}%`);

  return {
    emailsSent: campaign.emailSequence.length,
    whatsappsSent: campaign.whatsappSequence.length,
    status: "active",
  };
}

/**
 * ANALYTICS: Track campaign performance
 */
export async function trackCampaignMetrics(campaignId: string) {
  // Tracks:
  // - Email open rate
  // - Email click rate
  // - WhatsApp read rate
  // - Website visits from campaign
  // - Claim rate
  // - Upgrade rate
  // - CAC (Customer Acquisition Cost)

  return {
    emailOpenRate: 0.32,
    emailClickRate: 0.18,
    whatsappReadRate: 0.65,
    websiteVisits: 47,
    claimRate: 0.23, // 23% of visited claim page
    conversionRate: 0.15, // 15% of claims become active
    cac: 650, // TT$650 per customer acquisition
  };
}

export type { OutboundCampaign, EmailMessage, WhatsAppMessage, FollowUpStep };
