/**
 * PaperclipAgentOrchestrator - Master orchestration system for TriniBuild AI agents
 * Coordinates 40+ specialized agents across platform oversight, store building, and other apps
 * 
 * Architecture:
 * Master Orchestrator (this file)
 * ├── Platform Oversight Team (3 agents)
 * ├── Store Builder Team (6 agents)
 * ├── [5 other app teams]
 * └── Dynamic agent spawning
 * 
 * Each agent has:
 * - Persistent memory
 * - Decision history
 * - Error recovery
 * - Cross-agent communication
 */

import { MemoryService, AgentMemory, Decision } from './memoryService';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & ENUMS
// ═══════════════════════════════════════════════════════════════════════════

export enum AgentTeam {
  MASTER = 'master-orchestrator',
  PLATFORM_OVERSIGHT = 'platform-oversight',
  STORE_BUILDER = 'store-builder',
  MARKETPLACE = 'marketplace',
  RIDESHARE = 'rideshare',
  REALESTATE = 'realestate',
  JOBS = 'jobs',
  EVENTS = 'events'
}

export enum AgentRole {
  // Master
  ORCHESTRATOR = 'master-orchestrator',

  // Platform Oversight
  SECURITY_GUARDIAN = 'security-guardian',
  PERFORMANCE_MONITOR = 'performance-monitor',
  QA_LEAD = 'qa-lead',

  // Store Builder
  PRODUCT_AGENT = 'product-agent',
  DEV_AGENT = 'dev-agent',
  QA_AGENT = 'qa-agent',
  DEVOPS_AGENT = 'devops-agent',
  CONTENT_AGENT = 'content-agent',
  SUPPORT_AGENT = 'support-agent',

  // Other teams
  MARKETPLACE_AGENT = 'marketplace-agent',
  RIDESHARE_AGENT = 'rideshare-agent',
  REALESTATE_AGENT = 'realestate-agent',
  JOBS_AGENT = 'jobs-agent',
  EVENTS_AGENT = 'events-agent'
}

export interface Agent {
  id: string;
  role: AgentRole;
  team: AgentTeam;
  status: 'active' | 'idle' | 'error' | 'standby';
  capabilities: string[];
  memory: AgentMemory;
  lastActivity: string;
  errorCount: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  action: string;
  context: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface OrchestrationConfig {
  maxConcurrentAgents: number;
  taskTimeout: number; // ms
  autoRecovery: boolean;
  loggingEnabled: boolean;
  metricsCollection: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_DEFINITIONS: Record<AgentRole, { team: AgentTeam; capabilities: string[] }> = {
  // Master
  [AgentRole.ORCHESTRATOR]: {
    team: AgentTeam.MASTER,
    capabilities: [
      'coordinate-agents',
      'allocate-resources',
      'health-monitoring',
      'escalation',
      'decision-making'
    ]
  },

  // Platform Oversight
  [AgentRole.SECURITY_GUARDIAN]: {
    team: AgentTeam.PLATFORM_OVERSIGHT,
    capabilities: [
      'security-scanning',
      'threat-detection',
      'access-control',
      'data-protection',
      'compliance-checking'
    ]
  },
  [AgentRole.PERFORMANCE_MONITOR]: {
    team: AgentTeam.PLATFORM_OVERSIGHT,
    capabilities: [
      'performance-metrics',
      'bottleneck-detection',
      'optimization-recommendations',
      'uptime-monitoring',
      'load-analysis'
    ]
  },
  [AgentRole.QA_LEAD]: {
    team: AgentTeam.PLATFORM_OVERSIGHT,
    capabilities: [
      'test-orchestration',
      'quality-assurance',
      'bug-triage',
      'release-validation',
      'user-acceptance-testing'
    ]
  },

  // Store Builder
  [AgentRole.PRODUCT_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'product-generation',
      'ai-descriptions',
      'seo-optimization',
      'category-management',
      'inventory-tracking'
    ]
  },
  [AgentRole.DEV_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'code-generation',
      'customization',
      'api-integration',
      'debugging',
      'feature-development'
    ]
  },
  [AgentRole.QA_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'test-writing',
      'bug-detection',
      'regression-testing',
      'performance-testing',
      'user-testing-coordination'
    ]
  },
  [AgentRole.DEVOPS_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'deployment',
      'infrastructure-management',
      'monitoring',
      'scaling',
      'disaster-recovery'
    ]
  },
  [AgentRole.CONTENT_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'blog-generation',
      'social-media-content',
      'email-campaigns',
      'marketing-copy',
      'brand-consistency'
    ]
  },
  [AgentRole.SUPPORT_AGENT]: {
    team: AgentTeam.STORE_BUILDER,
    capabilities: [
      'customer-support',
      'documentation',
      'onboarding',
      'training-content',
      'troubleshooting'
    ]
  },

  // Other teams (simplified for now)
  [AgentRole.MARKETPLACE_AGENT]: {
    team: AgentTeam.MARKETPLACE,
    capabilities: ['listing-management', 'seller-support', 'buyer-protection']
  },
  [AgentRole.RIDESHARE_AGENT]: {
    team: AgentTeam.RIDESHARE,
    capabilities: ['ride-routing', 'driver-management', 'safety-monitoring']
  },
  [AgentRole.REALESTATE_AGENT]: {
    team: AgentTeam.REALESTATE,
    capabilities: ['property-listings', 'valuation', 'buyer-matching']
  },
  [AgentRole.JOBS_AGENT]: {
    team: AgentTeam.JOBS,
    capabilities: ['job-posting', 'candidate-matching', 'application-management']
  },
  [AgentRole.EVENTS_AGENT]: {
    team: AgentTeam.EVENTS,
    capabilities: ['event-management', 'ticketing', 'attendee-coordination']
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class PaperclipAgentOrchestrator {
  private static agents: Map<string, Agent> = new Map();
  private static tasks: Map<string, AgentTask> = new Map();
  private static config: OrchestrationConfig = {
    maxConcurrentAgents: 40,
    taskTimeout: 300000, // 5 minutes
    autoRecovery: true,
    loggingEnabled: true,
    metricsCollection: true
  };

  /**
   * Initialize the orchestrator and spawn all core agents
   */
  static async initialize(config?: Partial<OrchestrationConfig>): Promise<{
    success: boolean;
    agentCount: number;
    error?: string;
  }> {
    try {
      if (config) {
        this.config = { ...this.config, ...config };
      }

      await MemoryService.initialize();

      // Spawn core agents
      const coreAgents = [
        AgentRole.ORCHESTRATOR,
        AgentRole.SECURITY_GUARDIAN,
        AgentRole.PERFORMANCE_MONITOR,
        AgentRole.QA_LEAD,
        AgentRole.PRODUCT_AGENT,
        AgentRole.DEV_AGENT,
        AgentRole.QA_AGENT,
        AgentRole.DEVOPS_AGENT,
        AgentRole.CONTENT_AGENT,
        AgentRole.SUPPORT_AGENT
      ];

      for (const role of coreAgents) {
        await this.spawnAgent(role);
      }

      await MemoryService.logBuildActivity(
        'orchestrator',
        `🚀 PaperclipAgentOrchestrator initialized with ${coreAgents.length} core agents`,
        'success'
      );

      return {
        success: true,
        agentCount: this.agents.size
      };
    } catch (err: any) {
      return { success: false, agentCount: 0, error: err.message };
    }
  }

  /**
   * Spawn a new agent
   */
  static async spawnAgent(role: AgentRole): Promise<{
    success: boolean;
    agentId?: string;
    error?: string;
  }> {
    try {
      const definition = AGENT_DEFINITIONS[role];
      if (!definition) {
        throw new Error(`Unknown agent role: ${role}`);
      }

      const agentId = `${role}-${Date.now()}`;
      const agent: Agent = {
        id: agentId,
        role,
        team: definition.team,
        status: 'standby',
        capabilities: definition.capabilities,
        memory: {
          agentId,
          agentType: role,
          state: {},
          decisions: [],
          lastUpdated: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          status: 'idle'
        },
        lastActivity: new Date().toISOString(),
        errorCount: 0
      };

      this.agents.set(agentId, agent);

      // Save to persistent memory
      await MemoryService.saveAgentMemory(agent.memory);

      await MemoryService.logBuildActivity(
        'orchestrator',
        `✅ Spawned ${role} agent (${agentId})`,
        'info'
      );

      return { success: true, agentId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Assign a task to an agent
   */
  static async assignTask(agentId: string, action: string, context: Record<string, any>): Promise<{
    success: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const task: AgentTask = {
        id: taskId,
        agentId,
        action,
        context,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      this.tasks.set(taskId, task);

      // Update agent status
      agent.status = 'active';
      agent.lastActivity = new Date().toISOString();

      await MemoryService.logBuildActivity(
        agent.role,
        `📋 Assigned task: ${action}`,
        'info',
        { taskId, context }
      );

      return { success: true, taskId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Complete a task
   */
  static async completeTask(taskId: string, result?: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      task.status = 'completed';
      task.result = result;
      task.completedAt = new Date().toISOString();

      const agent = this.agents.get(task.agentId);
      if (agent) {
        agent.status = 'idle';

        // Record decision
        const decision: Omit<Decision, 'timestamp'> = {
          context: task.action,
          action: task.action,
          reasoning: `Completed ${task.action}`,
          result: JSON.stringify(result || {}),
          status: 'success'
        };

        await MemoryService.recordDecision(agent.id, decision);
      }

      await MemoryService.logBuildActivity(
        agent?.role || 'unknown',
        `✅ Completed: ${task.action}`,
        'success'
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Handle task failure
   */
  static async failTask(taskId: string, error: string): Promise<{
    success: boolean;
    willRetry: boolean;
    error?: string;
  }> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      task.status = 'failed';
      task.error = error;
      task.completedAt = new Date().toISOString();

      const agent = this.agents.get(task.agentId);
      if (agent) {
        agent.errorCount++;
        agent.status = agent.errorCount > 3 ? 'error' : 'idle';

        // Record failed decision
        const decision: Omit<Decision, 'timestamp'> = {
          context: task.action,
          action: task.action,
          reasoning: `Failed ${task.action}: ${error}`,
          status: 'failed'
        };

        await MemoryService.recordDecision(agent.id, decision);
      }

      const willRetry = this.config.autoRecovery && (agent?.errorCount || 0) <= 3;

      await MemoryService.logBuildActivity(
        agent?.role || 'unknown',
        `❌ Failed: ${task.action} - ${error}${willRetry ? ' (will retry)' : ''}`,
        'error'
      );

      return { success: true, willRetry };
    } catch (err: any) {
      return { success: false, willRetry: false, error: err.message };
    }
  }

  /**
   * Get all agents
   */
  static getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by team
   */
  static getTeamAgents(team: AgentTeam): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.team === team);
  }

  /**
   * Get agent by ID
   */
  static getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get orchestrator status
   */
  static getStatus(): {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    errorAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    teams: Record<AgentTeam, number>;
  } {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());

    const teams: Record<AgentTeam, number> = {} as any;
    for (const team of Object.values(AgentTeam)) {
      teams[team] = agents.filter(a => a.team === team).length;
    }

    return {
      totalAgents: agents.length,
      activeAgents: agents.filter(a => a.status === 'active').length,
      idleAgents: agents.filter(a => a.status === 'idle').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      teams
    };
  }

  /**
   * Get task by ID
   */
  static getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get agent tasks
   */
  static getAgentTasks(agentId: string): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => t.agentId === agentId);
  }

  /**
   * Create a system backup via orchestrator
   */
  static async backupSystem(): Promise<{ success: boolean; backupId?: string; error?: string }> {
    try {
      const devopsAgents = Array.from(this.agents.values()).filter(
        a => a.role === AgentRole.DEVOPS_AGENT
      );

      if (devopsAgents.length === 0) {
        throw new Error('No DevOps agents available');
      }

      const devopsAgent = devopsAgents[0];
      const result = await this.assignTask(devopsAgent.id, 'backup-system', {});

      return { success: result.success, backupId: result.taskId };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Request health check across all agents
   */
  static async healthCheck(): Promise<{
    success: boolean;
    healthyAgents: number;
    unhealthyAgents: number;
    issues: string[];
  }> {
    const agents = Array.from(this.agents.values());
    const issues: string[] = [];

    let unhealthyCount = 0;

    for (const agent of agents) {
      if (agent.status === 'error') {
        unhealthyCount++;
        issues.push(`${agent.role} is in error state (${agent.errorCount} errors)`);
      }

      if (agent.errorCount > 5) {
        issues.push(`${agent.role} has accumulated too many errors`);
      }
    }

    return {
      success: true,
      healthyAgents: agents.length - unhealthyCount,
      unhealthyAgents: unhealthyCount,
      issues
    };
  }
}

export default PaperclipAgentOrchestrator;
