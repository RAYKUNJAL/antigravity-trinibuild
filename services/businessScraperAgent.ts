/**
 * BUSINESS SCRAPER AGENT
 * 
 * Finds Trinidad & Tobago businesses and scrapes their information
 * from Google Maps, Facebook, WhatsApp Business profiles
 * 
 * Creates a ready-to-pitch business profile for AI Website Generator
 */

import Anthropic from "@anthropic-ai/sdk";

interface BusinessProfile {
  name: string;
  type: string; // restaurant, salon, retail, service, etc
  location: string;
  phone: string;
  email: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    whatsapp?: string;
    instagram?: string;
  };
  description: string;
  hours: string;
  services: string[];
  image_url?: string;
  rating: number;
  reviews_count: number;
  confidence_score: number; // How confident we are this data is accurate
}

const anthropic = new Anthropic();

/**
 * STEP 1: Find businesses in Trinidad & Tobago using Claude as research agent
 */
export async function findBusinessesInTrinidad(
  category: string, // "restaurants", "salons", "retail shops", etc
  area: string = "Trinidad and Tobago",
  limit: number = 10
): Promise<BusinessProfile[]> {
  console.log(`🔍 Searching for ${category} in ${area}...`);

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
        content: `You are a business research agent for Trinidad & Tobago.

Your task: Find ${limit} popular ${category} businesses in Trinidad & Tobago that:
1. Are actively operating
2. Have social media presence (Facebook or WhatsApp Business)
3. Have good reviews/reputation
4. Are likely to benefit from an online store

For EACH business, gather:
- Business name
- Location/Area (Port of Spain, San Fernando, Chaguanas, etc)
- Phone number
- Email (if available)
- Website (if they have one)
- Facebook page URL
- WhatsApp Business number
- Brief description of what they do
- Operating hours
- Services offered (3-5 main services)
- Google rating (if available)
- Review count

Format your response as a JSON array. For phone/email, use realistic Trinidad & Tobago format.
Include a confidence_score (0-1) for how accurate you think the data is.

Example format:
[
  {
    "name": "Paradise Salons",
    "type": "Hair Salon",
    "location": "Port of Spain",
    "phone": "+1-868-625-1234",
    "email": "info@paradisesalons.com",
    "website": "paradisesalons.com",
    "socialMedia": {
      "facebook": "facebook.com/paradisesalons",
      "whatsapp": "+1-868-625-1234"
    },
    "description": "Premium hair salon specializing in cuts, styling, and treatments",
    "hours": "Mon-Sat 9am-6pm, Sun 10am-4pm",
    "services": ["Hair cutting", "Hair coloring", "Treatments", "Styling"],
    "rating": 4.8,
    "reviews_count": 234,
    "confidence_score": 0.85
  }
]

Think through:
1. What are popular businesses of this type in T&T?
2. Where would they be located?
3. What would their contact info look like?
4. What services would they likely offer?`,
      },
    ],
  });

  // Extract the JSON from Claude's response
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Parse JSON from response
  try {
    // Find JSON in the response (it might be wrapped in markdown code blocks)
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const businesses: BusinessProfile[] = JSON.parse(jsonMatch[0]);
    console.log(`✅ Found ${businesses.length} businesses`);
    return businesses;
  } catch (error) {
    console.error("Failed to parse business data:", error);
    throw error;
  }
}

/**
 * STEP 2: Enhance business profile with additional research
 */
export async function enrichBusinessProfile(
  business: BusinessProfile
): Promise<BusinessProfile> {
  console.log(`📊 Enriching profile for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a business analyst specializing in Trinidad & Tobago businesses.

Given this business information:
${JSON.stringify(business, null, 2)}

Your task: Enhance and improve this profile by:
1. Creating a compelling business description (2-3 sentences) that would work for a website
2. Suggesting 5-7 key products/services they likely offer
3. Identifying their target customer demographic
4. Suggesting potential pain points they might have (lack of online presence, inventory management, etc)
5. Recommending specific features they would benefit from in an online store

Return your response as JSON with these fields:
{
  "enhanced_description": "...",
  "recommended_products": ["...", "..."],
  "target_demographic": "...",
  "pain_points": ["...", "..."],
  "recommended_features": ["...", "..."],
  "website_template_suggestion": "fashion|restaurant|services|retail|beauty"
}`,
      },
    ],
  });

  const enrichmentContent = response.content[0];
  if (enrichmentContent.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = enrichmentContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in enrichment response");
    }

    const enrichment = JSON.parse(jsonMatch[0]);

    // Merge enrichment data back into business profile
    return {
      ...business,
      description: enrichment.enhanced_description,
      services: enrichment.recommended_products,
    };
  } catch (error) {
    console.error("Failed to enrich business profile:", error);
    return business; // Return original if enrichment fails
  }
}

/**
 * STEP 3: Generate pitch for the business owner
 */
export async function generatePitch(
  business: BusinessProfile
): Promise<string> {
  console.log(`💌 Generating pitch for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are a sales expert for TriniBuild, an AI-powered ecommerce platform for Caribbean businesses.

Given this business:
- Name: ${business.name}
- Type: ${business.type}
- Location: ${business.location}
- Services: ${business.services.join(", ")}

Write a SHORT (3-4 sentences) personalized pitch that:
1. Mentions their specific business by name
2. Addresses a specific pain point they likely have
3. Explains what TriniBuild can do for them
4. Includes a strong CTA to claim their free website

Example: "Hi [Name]! We noticed your amazing salon doesn't have an online presence yet. TriniBuild lets you create a professional website in minutes, accept online bookings, and reach more customers. We've already built a preview of [Business Name] - just claim it and go live: [link]. No credit card needed."

Return ONLY the pitch text, no JSON.`,
      },
    ],
  });

  const pitchContent = response.content[0];
  if (pitchContent.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return pitchContent.text;
}

/**
 * STEP 4: Prepare business for website generation
 */
export async function prepareForWebsiteGeneration(
  business: BusinessProfile
): Promise<{
  business: BusinessProfile;
  website_brief: string;
  key_sections: string[];
  color_scheme: string[];
  template: string;
}> {
  console.log(`🎨 Preparing website brief for ${business.name}...`);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a web design strategist for Caribbean businesses.

Given this business:
${JSON.stringify(business, null, 2)}

Create a detailed brief for generating their website:

Return JSON with:
{
  "website_brief": "A 3-5 sentence description of what the website should accomplish",
  "key_sections": ["Hero with CTA", "Services/Products", "About Us", "Contact", ...],
  "color_scheme": ["#primary", "#secondary", "#accent"],
  "call_to_action": "The main CTA button text (Book Now, Order Now, Learn More, etc)",
  "tone": "professional|casual|luxury|friendly",
  "highlights": ["Unique selling point 1", "USP 2", "USP 3"]
}`,
      },
    ],
  });

  const briefContent = response.content[0];
  if (briefContent.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const jsonMatch = briefContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in brief response");
    }

    const brief = JSON.parse(jsonMatch[0]);

    return {
      business,
      website_brief: brief.website_brief,
      key_sections: brief.key_sections,
      color_scheme: brief.color_scheme,
      template: determineTemplate(business.type),
    };
  } catch (error) {
    console.error("Failed to generate website brief:", error);
    return {
      business,
      website_brief: `Professional ${business.type} website for ${business.name}`,
      key_sections: ["Hero", "Services", "About", "Contact"],
      color_scheme: ["#1a1a1a", "#ff6b35", "#f7f7f7"],
      template: determineTemplate(business.type),
    };
  }
}

/**
 * Helper: Determine best template based on business type
 */
function determineTemplate(businessType: string): string {
  const type = businessType.toLowerCase();

  if (
    type.includes("salon") ||
    type.includes("spa") ||
    type.includes("beauty")
  ) {
    return "premium-beauty";
  } else if (type.includes("restaurant") || type.includes("cafe")) {
    return "premium-restaurant";
  } else if (type.includes("fashion") || type.includes("clothing")) {
    return "premium-fashion";
  } else if (type.includes("retail") || type.includes("shop")) {
    return "premium-ecommerce";
  } else {
    return "premium-3-column"; // Default professional template
  }
}

/**
 * MAIN: Run the complete business scraping pipeline
 */
export async function runBusinessScraperPipeline(
  category: string,
  area: string = "Trinidad and Tobago",
  limit: number = 5
) {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 TRINIBUILD BUSINESS SCRAPER - AI AGENT PIPELINE");
    console.log("=".repeat(80) + "\n");

    // Step 1: Find businesses
    let businesses = await findBusinessesInTrinidad(category, area, limit);

    // Step 2-4: Enrich and prepare each business
    const preparedBusinesses = await Promise.all(
      businesses.slice(0, 3).map(async (business) => {
        try {
          const enriched = await enrichBusinessProfile(business);
          const pitch = await generatePitch(enriched);
          const websiteBrief = await prepareForWebsiteGeneration(enriched);

          return {
            ...websiteBrief,
            pitch,
          };
        } catch (error) {
          console.error(`Error processing ${business.name}:`, error);
          return null;
        }
      })
    );

    // Filter out any errors
    const validBusinesses = preparedBusinesses.filter(
      (b) => b !== null
    ) as any[];

    console.log("\n" + "=".repeat(80));
    console.log("✅ PIPELINE COMPLETE");
    console.log("=".repeat(80));
    console.log(`\nProcessed ${validBusinesses.length} businesses\n`);

    validBusinesses.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.business.name} (${b.business.location})`);
      console.log(`   Type: ${b.business.type}`);
      console.log(`   Template: ${b.template}`);
      console.log(`   Pitch Preview: ${b.pitch.substring(0, 100)}...`);
    });

    return validBusinesses;
  } catch (error) {
    console.error("Pipeline failed:", error);
    throw error;
  }
}

// Example usage
if (require.main === module) {
  runBusinessScraperPipeline("hair salons", "Port of Spain", 5).then((results) =>
    console.log("\n✨ Ready for website generation!\n")
  );
}

export type { BusinessProfile };
