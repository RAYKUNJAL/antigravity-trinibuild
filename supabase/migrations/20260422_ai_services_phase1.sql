-- ════════════════════════════════════════════════════════════════════════════
-- TriniBuild AI & Agent System - Database Migrations
-- Phase 1: AI Services, Backup, Memory, and Agent Infrastructure
-- Created: 2026-04-22
-- ════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: ai_generated_listings
-- Purpose: Store AI-generated product descriptions
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_generated_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  seo_title VARCHAR(60),
  seo_description VARCHAR(160),
  call_to_action TEXT,
  variation_type VARCHAR(50) DEFAULT 'original', -- 'original', 'variation_1', etc
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  model_used VARCHAR(50) DEFAULT 'gpt-4o-mini',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_listings_store ON ai_generated_listings(store_id);
CREATE INDEX idx_ai_listings_published ON ai_generated_listings(is_published);
CREATE INDEX idx_ai_listings_created ON ai_generated_listings(created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: ai_blog_posts
-- Purpose: Store AI-generated blog posts
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  sections JSONB DEFAULT '{}'::JSONB, -- Array of { heading, content, keywords }
  seo_metadata JSONB DEFAULT '{}'::JSONB, -- { metaDescription, keywords, ogTitle, ogDescription, ogImage }
  social_cards JSONB DEFAULT '{}'::JSONB, -- { twitter, facebook, linkedin }
  word_count INTEGER,
  read_time INTEGER, -- estimated reading time in minutes
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'scheduled'
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_store ON ai_blog_posts(store_id);
CREATE INDEX idx_blog_status ON ai_blog_posts(status);
CREATE INDEX idx_blog_published ON ai_blog_posts(published_at DESC);
CREATE INDEX idx_blog_slug ON ai_blog_posts(slug);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: seo_metadata
-- Purpose: Store SEO metadata for pages
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seo_metadata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL UNIQUE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  title VARCHAR(60) NOT NULL,
  description VARCHAR(160) NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  robots VARCHAR(50) DEFAULT 'index,follow',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_seo_store ON seo_metadata(store_id);
CREATE INDEX idx_seo_url ON seo_metadata(page_url);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: backup_history
-- Purpose: Track system backups and restoration points
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backup_history (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(50) NOT NULL, -- 'daily', 'manual', 'pre-migration'
  size BIGINT NOT NULL, -- Size in bytes
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'verified'
  tables TEXT[] DEFAULT ARRAY[]::TEXT[],
  retention_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backup_timestamp ON backup_history(timestamp DESC);
CREATE INDEX idx_backup_status ON backup_history(status);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: backup_configurations
-- Purpose: Store backup system configuration
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS backup_configurations (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL, -- { enabled, schedule, retentionDays, autoVerify, notifyOnFailure }
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: agent_memory
-- Purpose: Persistent memory for AI agents
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_memory (
  agent_id VARCHAR(255) PRIMARY KEY,
  agent_type VARCHAR(100) NOT NULL,
  state JSONB DEFAULT '{}'::JSONB, -- Agent's internal state
  decisions JSONB DEFAULT '[]'::JSONB, -- Array of decision history
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'idle', -- 'active', 'idle', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_type ON agent_memory(agent_type);
CREATE INDEX idx_agent_status ON agent_memory(status);
CREATE INDEX idx_agent_updated ON agent_memory(last_updated DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: build_logs
-- Purpose: Track build activities and system events
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS build_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  agent VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_build_session ON build_logs(session_id);
CREATE INDEX idx_build_agent ON build_logs(agent);
CREATE INDEX idx_build_level ON build_logs(level);
CREATE INDEX idx_build_timestamp ON build_logs(timestamp DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: system_memory
-- Purpose: Key-value store for system-wide memory
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_memory (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_memory_expires ON system_memory(expires);

-- ────────────────────────────────────────────────────────────────────────────
-- TABLE: memory_snapshots
-- Purpose: Point-in-time snapshots of system memory for recovery
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memory_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label VARCHAR(255) NOT NULL UNIQUE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data JSONB NOT NULL, -- Full snapshot of agents + system memory
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshot_timestamp ON memory_snapshots(timestamp DESC);
CREATE INDEX idx_snapshot_label ON memory_snapshots(label);

-- ────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY POLICIES
-- ────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE ai_generated_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Policies for ai_generated_listings
CREATE POLICY "Users can view their store listings"
  ON ai_generated_listings FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert listings to their stores"
  ON ai_generated_listings FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can update their store listings"
  ON ai_generated_listings FOR UPDATE
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Policies for ai_blog_posts (same structure)
CREATE POLICY "Users can view their blog posts"
  ON ai_blog_posts FOR SELECT
  USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can insert blog posts"
  ON ai_blog_posts FOR INSERT
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- VIEWS & FUNCTIONS
-- ────────────────────────────────────────────────────────────────────────────

-- View: AI Generation Statistics
CREATE OR REPLACE VIEW v_ai_stats AS
SELECT
  s.id as store_id,
  s.name as store_name,
  COUNT(DISTINCT l.id) as total_listings_generated,
  COUNT(DISTINCT CASE WHEN l.is_published THEN l.id END) as listings_published,
  COUNT(DISTINCT b.id) as blog_posts_generated,
  COUNT(DISTINCT CASE WHEN b.status = 'published' THEN b.id END) as blog_posts_published,
  MAX(l.created_at) as last_listing_generated,
  MAX(b.created_at) as last_blog_posted
FROM stores s
LEFT JOIN ai_generated_listings l ON s.id = l.store_id
LEFT JOIN ai_blog_posts b ON s.id = b.store_id
GROUP BY s.id, s.name;

-- Function: Clean expired system memory
CREATE OR REPLACE FUNCTION clean_expired_memory()
RETURNS void AS $$
BEGIN
  DELETE FROM system_memory
  WHERE expires IS NOT NULL AND expires < NOW();
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────────────────────────────
-- GRANTS & PERMISSIONS
-- ────────────────────────────────────────────────────────────────────────────

-- Authenticated users can select from new tables (RLS handles row-level control)
GRANT SELECT, INSERT, UPDATE ON ai_generated_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON seo_metadata TO authenticated;
GRANT SELECT ON backup_history TO authenticated;
GRANT SELECT ON agent_memory TO authenticated;
GRANT SELECT ON build_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON system_memory TO authenticated;
GRANT SELECT ON memory_snapshots TO authenticated;

-- Service role (for backups and admin) has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ════════════════════════════════════════════════════════════════════════════
-- END MIGRATIONS
-- ════════════════════════════════════════════════════════════════════════════
