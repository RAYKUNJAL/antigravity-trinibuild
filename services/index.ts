/**
 * TriniBuild Services Index
 * Central export point for all platform services
 */

// ═══════════════════════════════════════════════════════════════════════════
// Core Services
// ═══════════════════════════════════════════════════════════════════════════

export { default as supabase } from './supabaseClient';
export * from './authService';
export * from './adminService';
export * from './siteGuardianService';

// ═══════════════════════════════════════════════════════════════════════════
// AI & Content Services (NEW)
// ═══════════════════════════════════════════════════════════════════════════

export { default as AIService, type AIResponse, type ChatbotRequest } from './ai';
export { default as ProductListingAIService, type ProductListingInput, type GeneratedListing, type ListingVariations } from './productListingAIService';
export { default as BlogGeneratorService, type BlogPostRequest, type GeneratedBlogPost } from './blogGeneratorService';
export { default as SEOService, type SEOMetadata, type SitemapEntry, type RobotsConfig, type SchemaData } from './seoService';

// ═══════════════════════════════════════════════════════════════════════════
// Infrastructure Services (NEW)
// ═══════════════════════════════════════════════════════════════════════════

export { default as BackupService, type BackupMetadata, type BackupConfig, type RestoreOptions } from './backupService';
export { default as MemoryService, type AgentMemory, type Decision, type BuildLogEntry, type SystemMemory } from './memoryService';

// ═══════════════════════════════════════════════════════════════════════════
// Agent Services (NEW)
// ═══════════════════════════════════════════════════════════════════════════

export { default as PaperclipAgentOrchestrator, AgentTeam, AgentRole, type Agent, type AgentTask, type OrchestrationConfig } from './paperclipAgentOrchestrator';

// ═══════════════════════════════════════════════════════════════════════════
// Existing Services
// ═══════════════════════════════════════════════════════════════════════════

export * from './emailMarketingService';
export * from './llmCouncilService';
export * from './aiService';
export * from './digitalFulfillmentService';

// ═══════════════════════════════════════════════════════════════════════════
// Re-exports for convenience
// ═══════════════════════════════════════════════════════════════════════════

export { SupabaseClient, Session, User } from '@supabase/supabase-js';
