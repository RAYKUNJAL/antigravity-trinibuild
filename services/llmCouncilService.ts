import { supabase } from './supabaseClient';

export interface LLMCouncilConfig {
    id?: string;
    api_key: string;
    api_base_url: string;
    enabled_models: string[];
    default_temperature: number;
    max_tokens: number;
    enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface LLMConversation {
    id: string;
    user_id: string;
    query: string;
    models_used: string[];
    consensus_reached: boolean;
    final_response: string;
    total_cost: number;
    duration_ms: number;
    created_at: string;
}

export interface LLMUsageStats {
    total_queries: number;
    total_cost: number;
    average_cost_per_query: number;
    most_used_model: string;
    consensus_rate: number;
    average_duration_ms: number;
}

export const llmCouncilService = {
    // Configuration Management
    async getConfig(): Promise<LLMCouncilConfig | null> {
        const { data, error } = await supabase
            .from('llm_council_config')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching LLM Council config:', error);
            return null;
        }
        return data;
    },

    async updateConfig(config: Partial<LLMCouncilConfig>): Promise<boolean> {
        const { error } = await supabase
            .from('llm_council_config')
            .upsert({
                ...config,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error updating LLM Council config:', error);
            return false;
        }
        return true;
    },

    // Conversation Logs
    async getConversations(limit: number = 50): Promise<LLMConversation[]> {
        const { data, error } = await supabase
            .from('llm_council_conversations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching conversations:', error);
            return [];
        }
        return data || [];
    },

    async getConversationById(id: string): Promise<LLMConversation | null> {
        const { data, error } = await supabase
            .from('llm_council_conversations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching conversation:', error);
            return null;
        }
        return data;
    },

    // Usage Statistics
    async getUsageStats(days: number = 30): Promise<LLMUsageStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
            .from('llm_council_conversations')
            .select('*')
            .gte('created_at', startDate.toISOString());

        if (error) {
            console.error('Error fetching usage stats:', error);
            return {
                total_queries: 0,
                total_cost: 0,
                average_cost_per_query: 0,
                most_used_model: 'N/A',
                consensus_rate: 0,
                average_duration_ms: 0
            };
        }

        const conversations = data || [];
        const total_queries = conversations.length;
        const total_cost = conversations.reduce((sum, conv) => sum + (conv.total_cost || 0), 0);
        const consensus_count = conversations.filter(conv => conv.consensus_reached).length;
        const total_duration = conversations.reduce((sum, conv) => sum + (conv.duration_ms || 0), 0);

        // Count model usage
        const modelCounts: Record<string, number> = {};
        conversations.forEach(conv => {
            (conv.models_used || []).forEach(model => {
                modelCounts[model] = (modelCounts[model] || 0) + 1;
            });
        });
        const most_used_model = Object.keys(modelCounts).length > 0
            ? Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0][0]
            : 'N/A';

        return {
            total_queries,
            total_cost,
            average_cost_per_query: total_queries > 0 ? total_cost / total_queries : 0,
            most_used_model,
            consensus_rate: total_queries > 0 ? (consensus_count / total_queries) * 100 : 0,
            average_duration_ms: total_queries > 0 ? total_duration / total_queries : 0
        };
    },

    // API Health Check
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const config = await this.getConfig();
            if (!config || !config.api_base_url) {
                return { success: false, message: 'No configuration found' };
            }

            const response = await fetch(`${config.api_base_url}/health`);
            if (response.ok) {
                return { success: true, message: 'Connection successful' };
            } else {
                return { success: false, message: `HTTP ${response.status}` };
            }
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    },

    // Delete conversation
    async deleteConversation(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('llm_council_conversations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }
        return true;
    },

    // Clear old conversations
    async clearOldConversations(daysOld: number = 90): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const { data, error } = await supabase
            .from('llm_council_conversations')
            .delete()
            .lt('created_at', cutoffDate.toISOString())
            .select('id');

        if (error) {
            console.error('Error clearing old conversations:', error);
            return 0;
        }
        return data?.length || 0;
    }
};

// Available LLM models
export const AVAILABLE_MODELS = [
    'openai/gpt-4-turbo',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-opus',
    'anthropic/claude-3-sonnet',
    'google/gemini-pro',
    'meta-llama/llama-3-70b',
    'mistralai/mistral-large'
];
