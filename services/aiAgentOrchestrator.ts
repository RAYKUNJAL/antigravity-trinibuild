/**
 * AI AGENT ORCHESTRATOR
 * 
 * Master orchestrator that runs the complete pipeline:
 * 1. Business Scraper finds businesses
 * 2. Website Generator creates websites
 * 3. Outbound Agent Team pitches them
 * 4. Tracking monitors performance
 */

import {
  findBusinessesInTrinidad,
  enrichBusinessProfile,
  prepareForWebsiteGeneration,
} from "./businessScraperAgent";
import { generateCompleteWebsite, deployGeneratedWebsite } from "./websiteGeneratorAgent";
import { createOutboundCampaign, executeCampaign } from "./outboundAgentTeam";
import type { BusinessProfile } from "./businessScraperAgent";
import type { GeneratedWebsite } from "./websiteGeneratorAgent";
import type { OutboundCampaign } from "./outboundAgentTeam";

interface PipelineJob {
  id: string;
  status: "queued" | "scraping" | "generating" | "pitching" | "complete" | "failed";
  businessCategory: string;
  startTime: Date;
  endTime?: Date;
  results: {
    scrapedBusinesses: BusinessProfile[];
    generatedWebsites: GeneratedWebsite[];
    campaigns: OutboundCampaign[];
    metrics: PipelineMetrics;
  };
}

interface PipelineMetrics {
  businessesScraped: number;
  websitesGenerated: number;
  campaignsLaunched: number;
  estimatedConversions: number;
  estimatedRevenue: number; // In TTD
  timeElapsed: number; // In seconds
}

/**
 * RUN COMPLETE PIPELINE
 */
export async function runCompletePipeline(
  businessCategory: string,
  area: string = "Trinidad and Tobago",
  businessLimit: number = 10
): Promise<PipelineJob> {
  const jobId = generateJobId();
  const startTime = new Date();

  console.log("\n" + "╔" + "═".repeat(78) + "╗");
  console.log("║" + " ".repeat(78) + "║");
  console.log("║" + "  🚀 TRINIBUILD AI AGENT ORCHESTRATOR - COMPLETE PIPELINE".padEnd(78) + "║");
  console.log("║" + "  Job ID: " + jobId.padEnd(69) + "║");
  console.log("║" + "  Category: " + businessCategory.padEnd(67) + "║");
  console.log("║" + "  Starting at: " + startTime.toISOString().padEnd(64) + "║");
  console.log("║" + " ".repeat(78) + "║");
  console.log("╚" + "═".repeat(78) + "╝\n");

  const job: PipelineJob = {
    id: jobId,
    status: "queued",
    businessCategory,
    startTime,
    results: {
      scrapedBusinesses: [],
      generatedWebsites: [],
      campaigns: [],
      metrics: {
        businessesScraped: 0,
        websitesGenerated: 0,
        campaignsLaunched: 0,
        estimatedConversions: 0,
        estimatedRevenue: 0,
        timeElapsed: 0,
      },
    },
  };

  try {
    // PHASE 1: SCRAPING
    console.log("📍 PHASE 1: Business Scraping");
    console.log("─".repeat(80));

    job.status = "scraping";

    let businesses = await findBusinessesInTrinidad(
      businessCategory,
      area,
      businessLimit
    );
    console.log(`✅ Found ${businesses.length} businesses\n`);

    // Enrich first 3 (to save API calls in demo)
    const enrichedBusinesses = await Promise.all(
      businesses.slice(0, 3).map((b) => enrichBusinessProfile(b))
    );
    console.log(`✅ Enriched ${enrichedBusinesses.length} business profiles\n`);

    job.results.scrapedBusinesses = enrichedBusinesses;
    job.results.metrics.businessesScraped = enrichedBusinesses.length;

    // PHASE 2: WEBSITE GENERATION
    console.log("📍 PHASE 2: Website Generation");
    console.log("─".repeat(80));

    job.status = "generating";

    const generatedWebsites: GeneratedWebsite[] = [];

    for (const business of enrichedBusinesses) {
      try {
        const websiteBrief = await prepareForWebsiteGeneration(business);
        const website = await generateCompleteWebsite(
          business,
          websiteBrief.template
        );

        // Deploy website
        const deployment = await deployGeneratedWebsite(website);
        website.integrations = {
          ...website.integrations,
          // Add deployment URLs
        } as any;

        generatedWebsites.push(website);
        console.log(`✅ Generated & deployed: ${business.name}`);
      } catch (error) {
        console.error(`❌ Failed to generate website for ${business.name}:`, error);
      }
    }

    console.log(`\n✅ Generated ${generatedWebsites.length} websites\n`);
    job.results.generatedWebsites = generatedWebsites;
    job.results.metrics.websitesGenerated = generatedWebsites.length;

    // PHASE 3: OUTBOUND CAMPAIGNS
    console.log("📍 PHASE 3: Creating Outbound Campaigns");
    console.log("─".repeat(80));

    job.status = "pitching";

    const campaigns: OutboundCampaign[] = [];

    for (let i = 0; i < enrichedBusinesses.length; i++) {
      try {
        const business = enrichedBusinesses[i];
        const website = generatedWebsites[i];

        const campaign = await createOutboundCampaign(business, website);
        campaigns.push(campaign);

        // Execute campaign (send emails, WhatsApp, etc)
        const execution = await executeCampaign(campaign);
        console.log(`✅ Campaign created for ${business.name}`);
        console.log(`   Expected conversion: ${(campaign.expectedConversion * 100).toFixed(0)}%`);
      } catch (error) {
        console.error(`❌ Failed to create campaign:`, error);
      }
    }

    console.log(`\n✅ Created ${campaigns.length} outbound campaigns\n`);
    job.results.campaigns = campaigns;
    job.results.metrics.campaignsLaunched = campaigns.length;

    // CALCULATE METRICS
    job.results.metrics.estimatedConversions = Math.round(
      campaigns.reduce((sum, c) => sum + (c.emailSequence.length * c.expectedConversion), 0)
    );

    // Revenue calculation (assuming 25% become Pro subscribers at TT$199/mo)
    job.results.metrics.estimatedRevenue = Math.round(
      job.results.metrics.estimatedConversions *
        0.25 *
        199 *
        12 // First year annual value
    );

    job.status = "complete";
    job.endTime = new Date();
    job.results.metrics.timeElapsed = Math.round(
      (job.endTime.getTime() - startTime.getTime()) / 1000
    );

    // PRINT FINAL SUMMARY
    printPipelineSummary(job);

    return job;
  } catch (error) {
    job.status = "failed";
    job.endTime = new Date();
    console.error("\n❌ Pipeline failed:", error);
    throw error;
  }
}

/**
 * PRINT SUMMARY
 */
function printPipelineSummary(job: PipelineJob) {
  const m = job.results.metrics;

  console.log("\n" + "╔" + "═".repeat(78) + "╗");
  console.log("║" + " ".repeat(78) + "║");
  console.log(
    "║" +
      "  ✅ PIPELINE COMPLETE - SUMMARY".padEnd(78) +
      "║"
  );
  console.log("║" + " ".repeat(78) + "║");
  console.log(
    "║" +
      `  Businesses Scraped: ${m.businessesScraped}`.padEnd(78) +
      "║"
  );
  console.log(
    "║" +
      `  Websites Generated: ${m.websitesGenerated}`.padEnd(78) +
      "║"
  );
  console.log(
    "║" +
      `  Campaigns Launched: ${m.campaignsLaunched}`.padEnd(78) +
      "║"
  );
  console.log(
    "║" +
      `  Estimated Conversions: ${m.estimatedConversions} businesses`.padEnd(78) +
      "║"
  );
  console.log(
    "║" +
      `  Estimated Annual Revenue: TT$${m.estimatedRevenue.toLocaleString()}`.padEnd(78) +
      "║"
  );
  console.log(
    "║" +
      `  Time Elapsed: ${m.timeElapsed} seconds`.padEnd(78) +
      "║"
  );
  console.log("║" + " ".repeat(78) + "║");
  console.log("╚" + "═".repeat(78) + "╝\n");
}

/**
 * MONITOR: Track ongoing campaigns
 */
export async function monitorCampaigns(jobId: string) {
  // In production, this would:
  // 1. Track email opens/clicks
  // 2. Track WhatsApp reads/responses
  // 3. Track website visits & claims
  // 4. Calculate ROI
  // 5. Adjust strategy based on performance

  return {
    jobId,
    activeCampaigns: 3,
    emailsSent: 9,
    emailsOpened: 3,
    openRate: 0.33,
    websitesVisited: 2,
    claimsClaimed: 1,
    conversionRate: 0.33,
    roi: 450, // TT$450 per TT$100 spent
  };
}

/**
 * SCALE: Run pipeline multiple times for different categories
 */
export async function scalePipeline(
  categories: string[],
  businessLimitPerCategory: number = 5
) {
  console.log("\n" + "═".repeat(80));
  console.log(
    "🚀 SCALING PIPELINE ACROSS " +
      categories.length +
      " CATEGORIES"
  );
  console.log("═".repeat(80) + "\n");

  const jobs: PipelineJob[] = [];

  for (const category of categories) {
    try {
      const job = await runCompletePipeline(category, "Trinidad and Tobago", businessLimitPerCategory);
      jobs.push(job);

      // Delay between categories to avoid rate limiting
      console.log("⏳ Waiting 5 seconds before next category...\n");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error(`Failed to process category ${category}:`, error);
    }
  }

  // Calculate aggregate metrics
  const totalMetrics = {
    totalBusinessesScraped: jobs.reduce((sum, j) => sum + j.results.metrics.businessesScraped, 0),
    totalWebsitesGenerated: jobs.reduce((sum, j) => sum + j.results.metrics.websitesGenerated, 0),
    totalCampaignsLaunched: jobs.reduce((sum, j) => sum + j.results.metrics.campaignsLaunched, 0),
    estimatedTotalConversions: jobs.reduce(
      (sum, j) => sum + j.results.metrics.estimatedConversions,
      0
    ),
    estimatedTotalRevenue: jobs.reduce((sum, j) => sum + j.results.metrics.estimatedRevenue, 0),
  };

  console.log("\n" + "═".repeat(80));
  console.log("📊 AGGREGATE RESULTS ACROSS ALL CATEGORIES");
  console.log("═".repeat(80));
  console.log(`Total Businesses Scraped: ${totalMetrics.totalBusinessesScraped}`);
  console.log(`Total Websites Generated: ${totalMetrics.totalWebsitesGenerated}`);
  console.log(`Total Campaigns Launched: ${totalMetrics.totalCampaignsLaunched}`);
  console.log(
    `Estimated Total Conversions: ${totalMetrics.estimatedTotalConversions}`
  );
  console.log(
    `Estimated Annual Revenue: TT$${totalMetrics.estimatedTotalRevenue.toLocaleString()}`
  );
  console.log("═".repeat(80) + "\n");

  return { jobs, totalMetrics };
}

/**
 * Helper: Generate unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * MAIN: Example usage
 */
async function main() {
  try {
    // Run pipeline for multiple business categories
    const categories = [
      "hair salons",
      "restaurants",
      "clothing boutiques",
      "home services",
      "beauty spas",
    ];

    const results = await scalePipeline(categories, 3);

    console.log("\n🎉 ORCHESTRATOR COMPLETE!");
    console.log(`Generated websites for ${results.totalMetrics.totalWebsitesGenerated} businesses`);
    console.log(
      `Estimated annual revenue: TT$${results.totalMetrics.estimatedTotalRevenue.toLocaleString()}`
    );
  } catch (error) {
    console.error("Orchestrator failed:", error);
  }
}

// Uncomment to run
// main().catch(console.error);

export { runCompletePipeline, scalePipeline, monitorCampaigns };
export type { PipelineJob, PipelineMetrics };
