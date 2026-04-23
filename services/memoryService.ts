/**
 * MemoryService - Persistent state and memory management for agents
 * Provides durable storage for agent state, build logs, and system memory
 * 
 * Features:
 * - Agent state persistence
 * - Build log management
 * - Decision history tracking
 * - Recovery procedures
 * - Memory snapshots
 */

import { supabase } from './supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentMemory {
  agentId: string;
  agentType: string;
  state: Record<string, any>;
  decisions: Decision[];
  lastUpdated: string;
  lastActive: string;
  status: 'active' | 'idle' | 'error';
}

export interface Decision {
  timestamp: string;
  context: string;
  action: string;
  reasoning: string;
  result?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface BuildLogEntry {
  sessionId: string;
  timestamp: string;
  agent: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  metadata?: Record<string, any>;
}

export interface SystemMemory {
  key: string;
  value: any;
  expires?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class MemoryService {
  private static SESSION_ID = this._generateSessionId();

  /**
   * Initialize memory system
   */
  static async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify memory system is accessible by checking if we can access agent_memory table
      // This avoids querying information_schema which requires special permissions
      const { error } = await supabase
        .from('agent_memory')
        .select('agent_id', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        console.warn('Memory system may not be fully initialized:', error.message);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get current session ID
   */
  static getSessionId(): string {
    return this.SESSION_ID;
  }

  /**
   * Save agent memory/state
   */
  static async saveAgentMemory(memory: AgentMemory): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('agent_memory')
        .upsert({
          agent_id: memory.agentId,
          agent_type: memory.agentType,
          state: memory.state,
          decisions: memory.decisions,
          last_updated: new Date().toISOString(),
          last_active: memory.lastActive,
          status: memory.status
        }, {
          onConflict: 'agent_id'
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get agent memory/state
   */
  static async getAgentMemory(agentId: string): Promise<{
    success: boolean;
    memory?: AgentMemory;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // 404 is ok
      return { success: true, memory: data as AgentMemory | undefined };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Record a decision made by an agent
   */
  static async recordDecision(
    agentId: string,
    decision: Omit<Decision, 'timestamp'>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existing, error: getError } = await supabase
        .from('agent_memory')
        .select('decisions')
        .eq('agent_id', agentId)
        .single();

      if (getError && getError.code !== 'PGRST116') throw getError;

      const decisions = existing?.decisions || [];
      const newDecision: Decision = {
        ...decision,
        timestamp: new Date().toISOString()
      };

      decisions.push(newDecision);

      // Keep last 100 decisions
      const trimmedDecisions = decisions.slice(-100);

      const { error: updateError } = await supabase
        .from('agent_memory')
        .update({
          decisions: trimmedDecisions,
          last_updated: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (updateError) throw updateError;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Log build activity
   */
  static async logBuildActivity(
    agent: string,
    message: string,
    level: 'info' | 'warning' | 'error' | 'success' = 'info',
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('build_logs')
        .insert({
          session_id: this.SESSION_ID,
          timestamp: new Date().toISOString(),
          agent,
          level,
          message,
          metadata: metadata || {}
        });

      if (error) {
        // If table doesn't exist, just log to console
        console.log(`[${agent}] ${message}`);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Build log error:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get build log for current session
   */
  static async getBuildLog(limit: number = 100): Promise<{
    success: boolean;
    logs?: BuildLogEntry[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('session_id', this.SESSION_ID)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: true, logs: [] }; // Table might not exist
      }

      return { success: true, logs: data as BuildLogEntry[] };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get build statistics for session
   */
  static async getSessionStats(): Promise<{
    success: boolean;
    stats?: {
      sessionId: string;
      startTime: string;
      activeAgents: number;
      totalDecisions: number;
      successCount: number;
      errorCount: number;
      duration: string;
    };
    error?: string;
  }> {
    try {
      const { data: logs, error } = await supabase
        .from('build_logs')
        .select('*')
        .eq('session_id', this.SESSION_ID);

      if (error || !logs) {
        return { success: true, stats: undefined };
      }

      const startTime = logs.length > 0 ? logs[logs.length - 1].timestamp : new Date().toISOString();
      const endTime = logs[0]?.timestamp || new Date().toISOString();
      const duration = this._calculateDuration(startTime, endTime);

      const agents = new Set(logs.map(l => l.agent));
      const successCount = logs.filter(l => l.level === 'success').length;
      const errorCount = logs.filter(l => l.level === 'error').length;

      const { data: decisions, error: decisionError } = await supabase
        .from('agent_memory')
        .select('decisions');

      const totalDecisions = decisions?.reduce((sum, d) => sum + (d.decisions?.length || 0), 0) || 0;

      return {
        success: true,
        stats: {
          sessionId: this.SESSION_ID,
          startTime,
          activeAgents: agents.size,
          totalDecisions,
          successCount,
          errorCount,
          duration
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Store system-wide memory (key-value)
   */
  static async setMemory(
    key: string,
    value: any,
    expiresIn?: number // milliseconds
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const expires = expiresIn
        ? new Date(Date.now() + expiresIn).toISOString()
        : null;

      const { error } = await supabase
        .from('system_memory')
        .upsert({
          key,
          value,
          expires,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Retrieve system memory
   */
  static async getMemory(key: string): Promise<{
    success: boolean;
    value?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('system_memory')
        .select('*')
        .eq('key', key)
        .single();

      if (error && error.code === 'PGRST116') {
        return { success: true, value: undefined };
      }

      if (error) throw error;

      // Check if expired
      if (data?.expires && new Date(data.expires) < new Date()) {
        await supabase.from('system_memory').delete().eq('key', key);
        return { success: true, value: undefined };
      }

      return { success: true, value: data?.value };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete memory
   */
  static async deleteMemory(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('system_memory')
        .delete()
        .eq('key', key);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a memory snapshot for recovery
   */
  static async createSnapshot(label: string): Promise<{
    success: boolean;
    snapshotId?: string;
    error?: string;
  }> {
    try {
      const { data: agentMemories } = await supabase
        .from('agent_memory')
        .select('*');

      const { data: systemMemories } = await supabase
        .from('system_memory')
        .select('*');

      const snapshot = {
        label,
        timestamp: new Date().toISOString(),
        agents: agentMemories || [],
        systemMemory: systemMemories || []
      };

      const { error } = await supabase
        .from('memory_snapshots')
        .insert({
          label,
          timestamp: snapshot.timestamp,
          data: snapshot
        });

      if (error) throw error;
      return { success: true, snapshotId: label };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Restore from memory snapshot
   */
  static async restoreSnapshot(snapshotId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('memory_snapshots')
        .select('data')
        .eq('label', snapshotId)
        .single();

      if (error) throw error;

      const snapshot = data?.data;
      if (!snapshot) throw new Error('Snapshot data not found');

      // Restore agent memories
      if (snapshot.agents && Array.isArray(snapshot.agents)) {
        for (const agent of snapshot.agents) {
          await supabase.from('agent_memory').upsert(agent);
        }
      }

      // Restore system memories
      if (snapshot.systemMemory && Array.isArray(snapshot.systemMemory)) {
        for (const mem of snapshot.systemMemory) {
          await supabase.from('system_memory').upsert(mem);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private static _generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static _calculateDuration(start: string, end: string): string {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffMs = Math.abs(endTime - startTime);

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }
}

export default MemoryService;
