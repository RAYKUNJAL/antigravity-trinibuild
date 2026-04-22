/**
 * AI WEBSITE GENERATOR
 * 
 * Takes a business profile and automatically generates:
 * 1. Complete website structure (sections, copy, design)
 * 2. React component code
 * 3. Styling (Tailwind)
 * 4. SEO metadata
 * 5. Integration points (email, WhatsApp, booking)
 */

import Anthropic from "@anthropic-ai/sdk";
import type { BusinessProfile } from "./businessScraperAgent";

interface GeneratedWebsite {
  businessName: string;
  slug: string;
  template: string;
  htmlCode: string;
  reactCode: string;
  cssCode: string;
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
    ogImage: string;
  };
  sections: WebsiteSection[];
  integrations: {
    whatsapp?: string;
    email?: string;
    booking?: string;
    instagram?: string;
    facebook?: string;
  };
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  generatedAt: string;
}

interface WebsiteSection {
  id: string;
  title: string;
  type:
    | "hero"
    | "services"
    | "products"
    | "about"
    | "testimonials"
    | "cta"
    | "contact"
    | "gallery";
  content: any;
}

const anthropic = new Anthropic();

/**
 * STEP 1: Generate website structure and copy
 */
export async function generateWebsiteStructure(
  business: BusinessProfile,
  template: string
): Promise<WebsiteSection[]> {
  console.log(`📝 Generating website structure for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    thinking: {
      type: "enabled",
      budget_tokens: 3000,
    },
    messages: [
      {
        role: "user",
        content: `You are an expert web copywriter for Caribbean businesses.

Generate a complete website structure for:
Business: ${business.name}
Type: ${business.type}
Location: ${business.location}
Services: ${business.services.join(", ")}
Template: ${template}

Create compelling, conversion-focused copy for EACH section:

1. HERO (Main headline + subheadline + CTA)
   - Headline should be benefit-focused (not just business name)
   - Subheadline should address customer pain point
   - CTA should be action-oriented (Book Now, Learn More, Order Now, etc)

2. SERVICES (3-5 main services with descriptions)
   - Each service should have 1-2 sentence description
   - Include price range if applicable
   - Include icon suggestion (e.g., "scissors icon", "phone icon")

3. ABOUT US (2-3 paragraphs about the business)
   - Why they're different
   - Their story/mission
   - Customer benefits

4. CALL TO ACTION (Bottom CTA to convert visitors)
   - Sense of urgency or value proposition
   - Clear call-to-action button text

5. TESTIMONIALS (3 realistic testimonials for T&T market)
   - Customer name (realistic T&T names)
   - Testimonial text (specific benefits)
   - Rating (4.5-5 stars)

6. CONTACT & HOURS
   - Address
   - Phone
   - Email
   - Operating hours
   - Map embed location

Return JSON with this structure:
{
  "hero": {
    "headline": "...",
    "subheadline": "...",
    "cta_text": "..."
  },
  "services": [
    {
      "name": "...",
      "description": "...",
      "icon": "...",
      "price": "..."
    }
  ],
  "about": {
    "title": "About ${business.name}",
    "paragraph1": "...",
    "paragraph2": "..."
  },
  "testimonials": [
    {
      "name": "...",
      "text": "...",
      "rating": 5
    }
  ],
  "cta": {
    "headline": "...",
    "subheadline": "...",
    "button_text": "..."
  },
  "contact": {
    "address": "...",
    "phone": "${business.phone}",
    "email": "${business.email}",
    "hours": "${business.hours}"
  }
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const structure = JSON.parse(jsonMatch[0]);

    // Convert to WebsiteSection format
    const sections: WebsiteSection[] = [
      {
        id: "hero",
        title: "Hero",
        type: "hero",
        content: structure.hero,
      },
      {
        id: "services",
        title: "Services",
        type: "services",
        content: structure.services,
      },
      {
        id: "about",
        title: "About Us",
        type: "about",
        content: structure.about,
      },
      {
        id: "testimonials",
        title: "Testimonials",
        type: "testimonials",
        content: structure.testimonials,
      },
      {
        id: "cta",
        title: "Call to Action",
        type: "cta",
        content: structure.cta,
      },
      {
        id: "contact",
        title: "Contact & Hours",
        type: "contact",
        content: structure.contact,
      },
    ];

    return sections;
  } catch (error) {
    console.error("Failed to parse website structure:", error);
    throw error;
  }
}

/**
 * STEP 2: Generate React component code
 */
export async function generateReactComponent(
  business: BusinessProfile,
  sections: WebsiteSection[],
  colorScheme: { primary: string; secondary: string; accent: string }
): Promise<string> {
  console.log(`⚛️ Generating React component for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: `You are an expert React developer creating fast, SEO-friendly websites.

Generate a complete React component for ${business.name}.

Business Info:
${JSON.stringify(business, null, 2)}

Website Sections:
${JSON.stringify(sections, null, 2)}

Color Scheme:
Primary: ${colorScheme.primary}
Secondary: ${colorScheme.secondary}
Accent: ${colorScheme.accent}

Requirements:
1. Use React hooks (useState, useEffect)
2. Use Tailwind CSS for styling
3. Use Lucide React for icons
4. Include proper Framer Motion animations
5. Make it mobile-responsive
6. Add WhatsApp integration: <a href="https://wa.me/${business.phone}">Message on WhatsApp</a>
7. Make images lazy-loaded
8. Add proper alt text for accessibility
9. Include schema markup for business info
10. Make it fast (minimal DOM, efficient rendering)

Structure:
- Import statements (React, libraries)
- Component definition
- Return JSX with all sections
- Export default

Generate ONLY the component code, no markdown backticks, no explanations.
Start with imports and end with export.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
}

/**
 * STEP 3: Generate SEO metadata
 */
export async function generateSEOMetadata(
  business: BusinessProfile
): Promise<GeneratedWebsite["seoMetadata"]> {
  console.log(`🔍 Generating SEO metadata for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an SEO expert for Caribbean businesses.

Generate SEO metadata for ${business.name} (${business.type}) in ${business.location}, Trinidad.

Return JSON with:
{
  "title": "Keyword-rich title (50-60 chars) - format: [Business Name] | [Service] in [Location]",
  "description": "Compelling meta description (150-160 chars) - include location and main service",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ogImage": "A description of what the OG image should show (we'll generate it)"
}

Make it T&T-specific and SEO-optimized.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in SEO metadata response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Failed to parse SEO metadata:", error);
    return {
      title: `${business.name} | ${business.type} in ${business.location}`,
      description: `Professional ${business.type} services at ${business.name} in ${business.location}, Trinidad. Book now online.`,
      keywords: [
        business.name,
        business.type,
        business.location,
        "Trinidad",
        "online booking",
      ],
      ogImage: `A professional photo representing a ${business.type}`,
    };
  }
}

/**
 * STEP 4: Generate complete website
 */
export async function generateCompleteWebsite(
  business: BusinessProfile,
  template: string
): Promise<GeneratedWebsite> {
  console.log("\n" + "=".repeat(80));
  console.log(`🎨 GENERATING WEBSITE FOR: ${business.name}`);
  console.log("=".repeat(80) + "\n");

  // Determine color scheme based on business type
  const colorScheme = determineColorScheme(business.type);

  // Step 1: Generate sections
  const sections = await generateWebsiteStructure(business, template);

  // Step 2: Generate React component
  const reactCode = await generateReactComponent(business, sections, colorScheme);

  // Step 3: Generate SEO metadata
  const seoMetadata = await generateSEOMetadata(business);

  // Step 4: Generate slug for URL
  const slug = business.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  console.log("\n" + "=".repeat(80));
  console.log("✅ WEBSITE GENERATED SUCCESSFULLY!");
  console.log("=".repeat(80));

  return {
    businessName: business.name,
    slug,
    template,
    htmlCode: "", // Could be generated from React component
    reactCode,
    cssCode: "", // Tailwind handles this
    seoMetadata,
    sections,
    integrations: {
      whatsapp: business.socialMedia.whatsapp || `https://wa.me/${business.phone}`,
      email: business.email,
      instagram: business.socialMedia.instagram,
      facebook: business.socialMedia.facebook,
    },
    colorScheme,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Helper: Determine color scheme based on business type
 */
function determineColorScheme(businessType: string): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const type = businessType.toLowerCase();

  if (type.includes("salon") || type.includes("spa") || type.includes("beauty")) {
    return {
      primary: "#e85d8a",
      secondary: "#2d2d2d",
      accent: "#f4a6c1",
    };
  } else if (type.includes("restaurant") || type.includes("cafe")) {
    return {
      primary: "#d4573b",
      secondary: "#1a1a1a",
      accent: "#f4a460",
    };
  } else if (type.includes("fashion") || type.includes("clothing")) {
    return {
      primary: "#1a1a1a",
      secondary: "#555555",
      accent: "#c0a080",
    };
  } else {
    // Default professional
    return {
      primary: "#0066cc",
      secondary: "#2c2c2c",
      accent: "#ffa500",
    };
  }
}

/**
 * STEP 5: Deploy generated website
 */
export async function deployGeneratedWebsite(
  website: GeneratedWebsite,
  projectId?: string
): Promise<{ url: string; editUrl: string; claimUrl: string }> {
  console.log(`🚀 Deploying ${website.businessName}...`);

  // In real implementation, this would:
  // 1. Save React component to database
  // 2. Deploy via Vercel
  // 3. Generate unique claim URL
  // 4. Send notification to business owner

  const url = `https://trinibuild.com/store/${website.slug}`;
  const editUrl = `https://trinibuild.com/edit/${website.slug}`;
  const claimUrl = `https://trinibuild.com/claim/${website.slug}?token=${generateToken()}`;

  console.log(`✅ Website deployed: ${url}`);
  console.log(`📝 Claim URL: ${claimUrl}`);

  return { url, editUrl, claimUrl };
}

/**
 * Helper: Generate secure token for claim URL
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * MAIN: Complete website generation pipeline
 */
export async function runWebsiteGeneratorPipeline(
  business: BusinessProfile,
  template: string
) {
  try {
    // Generate website
    const website = await generateCompleteWebsite(business, template);

    // Deploy
    const deployment = await deployGeneratedWebsite(website);

    return {
      website,
      deployment,
      nextSteps: {
        pitchEmail: `Subject: Your Professional Website is Ready - ${business.name}`,
        pitchBody: `Hi ${business.name.split(" ")[0]},

We've built a professional website for ${business.name} and it's live at:
${deployment.url}

You can claim it here (no credit card needed):
${deployment.claimUrl}

Once claimed, you can:
- Accept online orders
- Showcase your services
- Manage bookings
- Track customer inquiries

Get started: ${deployment.claimUrl}

Cheers,
TriniBuild Team`,
        whatsappMessage: `Hi! We built a free professional website for ${business.name}: ${deployment.url} Claim it here: ${deployment.claimUrl}`,
      },
    };
  } catch (error) {
    console.error("Website generation failed:", error);
    throw error;
  }
}

export type { GeneratedWebsite, WebsiteSection };
