-- LLM Council Integration Tables

-- Configuration table for LLM Council settings
CREATE TABLE IF NOT EXISTS llm_council_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_base_url TEXT DEFAULT 'https://llm-council-backend.onrender.com',
    enabled_models TEXT[] DEFAULT ARRAY['openai/gpt-4-turbo', 'anthropic/claude-3-sonnet', 'google/gemini-pro'],
    default_temperature DECIMAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation logs table
CREATE TABLE IF NOT EXISTS llm_council_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    query TEXT NOT NULL,
    models_used TEXT[] NOT NULL,
    consensus_reached BOOLEAN DEFAULT false,
    final_response TEXT,
    individual_responses JSONB,
    total_cost DECIMAL DEFAULT 0.0,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_llm_conversations_user ON llm_council_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_conversations_created ON llm_council_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_conversations_consensus ON llm_council_conversations(consensus_reached);

-- Enable RLS
ALTER TABLE llm_council_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_council_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for llm_council_config
DROP POLICY IF EXISTS "Admins can view config" ON llm_council_config;
CREATE POLICY "Admins can view config" ON llm_council_config
    FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can update config" ON llm_council_config;
CREATE POLICY "Admins can update config" ON llm_council_config
    FOR ALL
    USING (auth.role() = 'authenticated');

-- RLS Policies for llm_council_conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON llm_council_conversations;
CREATE POLICY "Users can view own conversations" ON llm_council_conversations
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert own conversations" ON llm_council_conversations;
CREATE POLICY "Users can insert own conversations" ON llm_council_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete conversations" ON llm_council_conversations;
CREATE POLICY "Admins can delete conversations" ON llm_council_conversations
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Insert default config
INSERT INTO llm_council_config (
    api_key,
    api_base_url,
    enabled_models,
    default_temperature,
    max_tokens,
    enabled
) VALUES (
    'sk-or-v1-placeholder', -- Replace with actual OpenRouter key
    'https://llm-council-backend.onrender.com',
    ARRAY['openai/gpt-4-turbo', 'anthropic/claude-3-sonnet', 'google/gemini-pro'],
    0.7,
    2000,
    true
) ON CONFLICT DO NOTHING;

-- Seed some sample conversations for testing (optional)
INSERT INTO llm_council_conversations (
    user_id,
    query,
    models_used,
    consensus_reached,
    final_response,
    total_cost,
    duration_ms
) VALUES
(
    (SELECT id FROM auth.users LIMIT 1),
    'What are the best marketing strategies for a new online store in Trinidad?',
    ARRAY['gpt-4-turbo', 'claude-3-sonnet', 'gemini-pro'],
    true,
    'Based on consensus from multiple AI models: Focus on social media marketing (Instagram, Facebook), leverage local influencers, offer introductory discounts, and ensure mobile-optimized checkout.',
    0.0023,
    3450
),
(
    (SELECT id FROM auth.users LIMIT 1),
    'How can I optimize my real estate listing for better visibility?',
    ARRAY['gpt-4-turbo', 'claude-3-sonnet'],
    true,
    'Consensus recommendation: Use high-quality photos, write detailed descriptions highlighting unique features, price competitively based on market data, and promote on multiple platforms.',
    0.0015,
    2800
)
ON CONFLICT DO NOTHING;
