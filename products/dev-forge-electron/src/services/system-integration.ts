/**
 * System Integration Service
 * 
 * Integrates all Dev Forge systems together.
 * Coordinates ModelManager, FireTeams, HR, Plugins, and MultiModelExecutor.
 */

import { ModelManager } from '../model-manager';
import { FireTeamsSystem } from '../systems/fire-teams';
import { hrSystem } from '../systems/hr-system';
import { MultiModelExecutor } from './multi-model-executor';

export class SystemIntegration {
  private modelManager: ModelManager;
  private fireTeamsSystem: FireTeamsSystem;
  private multiModelExecutor: MultiModelExecutor;
  private initialized: boolean = false;

  constructor(
    modelManager: ModelManager,
    fireTeamsSystem: FireTeamsSystem,
    multiModelExecutor: MultiModelExecutor
  ) {
    this.modelManager = modelManager;
    this.fireTeamsSystem = fireTeamsSystem;
    this.multiModelExecutor = multiModelExecutor;
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[SystemIntegration] Already initialized');
      return;
    }

    try {
      // 1. Check model availability
      console.log('[SystemIntegration] Checking model availability...');
      await this.modelManager.checkAllModels();

      // 2. Onboard default agents
      console.log('[SystemIntegration] Onboarding default agents...');
      const agents = this.fireTeamsSystem.getAllAgents();
      for (const agent of agents) {
        await hrSystem.onboardAgent(agent);
      }

      // 3. Set up model selection for agents
      console.log('[SystemIntegration] Setting up agent-model connections...');
      this.setupAgentModelConnections();

      // 4. Initialize Fire Teams with available models
      console.log('[SystemIntegration] Initializing Fire Teams...');
      this.initializeFireTeams();

      this.initialized = true;
      console.log('[SystemIntegration] All systems integrated successfully');
    } catch (error) {
      console.error('[SystemIntegration] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Set up connections between agents and models
   */
  private setupAgentModelConnections(): void {
    const agents = this.fireTeamsSystem.getAllAgents();
    const models = this.modelManager.getAllModels();

    agents.forEach(agent => {
      // Find matching model for agent
      const model = models.find(m => 
        m.id === agent.modelId || 
        m.name.toLowerCase().includes(agent.role.toLowerCase())
      );

      if (model && model.status === 'available') {
        // Select model for agent
        this.modelManager.selectModel(model.id);
        console.log(`[SystemIntegration] Connected agent ${agent.name} to model ${model.name}`);
      }
    });
  }

  /**
   * Initialize Fire Teams with default configuration
   */
  private initializeFireTeams(): void {
    const agents = this.fireTeamsSystem.getAllAgents();
    
    if (agents.length > 0) {
      // Create a default Fire Team with all available agents
      const availableAgents = agents.filter(a => {
        const model = this.modelManager.getAllModels().find(m => m.id === a.modelId);
        return model && model.status === 'available';
      });

      if (availableAgents.length > 0) {
        const team = this.fireTeamsSystem.createTeam(
          'Default Team',
          availableAgents.map(a => a.id)
        );
        console.log(`[SystemIntegration] Created default Fire Team with ${availableAgents.length} agents`);
      }
    }
  }

  /**
   * Execute task with Fire Team
   */
  async executeWithFireTeam(teamId: string, prompt: string): Promise<any> {
    const team = this.fireTeamsSystem.getTeam(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    // Get model IDs from team agents
    const modelIds = team.agents
      .map(agent => agent.modelId)
      .filter((id): id is string => id !== undefined);

    if (modelIds.length === 0) {
      throw new Error('No models available for team');
    }

    // Execute with multi-model executor
    const result = await this.multiModelExecutor.execute({
      prompt,
      modelIds,
    });

    // Update agent metrics
    result.responses.forEach((response: any) => {
      const agent = team.agents.find(a => a.modelId === response.modelId);
      if (agent) {
        hrSystem.updateMetrics(
          agent.id,
          !response.error,
          response.duration
        );
      }
    });

    return result;
  }

  /**
   * Get system health status
   */
  getSystemHealth(): {
    models: { total: number; available: number };
    agents: { total: number; available: number };
    teams: { total: number; active: number };
    initialized: boolean;
  } {
    const models = this.modelManager.getAllModels();
    const agents = this.fireTeamsSystem.getAllAgents();
    const teams = this.fireTeamsSystem.getAllTeams();

    return {
      models: {
        total: models.length,
        available: models.filter(m => m.status === 'available').length,
      },
      agents: {
        total: agents.length,
        available: agents.filter(a => a.status === 'idle').length,
      },
      teams: {
        total: teams.length,
        active: teams.filter(t => t.status === 'active').length,
      },
      initialized: this.initialized,
    };
  }
}

