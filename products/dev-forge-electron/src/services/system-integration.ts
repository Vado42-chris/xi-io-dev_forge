/**
 * System Integration Service
 * 
 * Integrates all Dev Forge systems together.
 * Coordinates ModelManager, FireTeams, HR, Plugins, MultiModelExecutor,
 * Blockchain, Marketplace, Image Generation, Settings, Logger, Command Palette,
 * Workspace Manager, Search Service, Notification Service, Theme Manager, and Shortcut Manager.
 */

import { ModelManager } from '../model-manager';
import { FireTeamsSystem } from '../systems/fire-teams';
import { hrSystem } from '../systems/hr-system';
import { MultiModelExecutor } from './multi-model-executor';
import { blockchainSystem } from '../systems/blockchain-system';
import { marketplaceSystem } from '../systems/marketplace-system';
import { ImageGenerationService } from './image-generation-service';
import { SettingsManager } from './settings-manager';
import { Logger } from './logger';
import { CommandPalette } from './command-palette';
import { WorkspaceManager } from './workspace-manager';
import { SearchService } from './search-service';
import { NotificationService } from './notification-service';
import { themeManager } from './theme-manager';
import { shortcutManager } from './shortcut-manager';
import { StatusManager } from '../status-manager';

export class SystemIntegration {
  private modelManager: ModelManager;
  private fireTeamsSystem: FireTeamsSystem;
  private multiModelExecutor: MultiModelExecutor;
  private imageGenerationService: ImageGenerationService;
  private settingsManager: SettingsManager;
  private logger: Logger;
  private commandPalette: CommandPalette;
  private workspaceManager: WorkspaceManager;
  private searchService: SearchService;
  private notificationService: NotificationService;
  private statusManager: StatusManager;
  private initialized: boolean = false;

  constructor(
    modelManager: ModelManager,
    fireTeamsSystem: FireTeamsSystem,
    multiModelExecutor: MultiModelExecutor,
    imageGenerationService: ImageGenerationService,
    settingsManager: SettingsManager,
    logger: Logger,
    commandPalette: CommandPalette,
    workspaceManager: WorkspaceManager,
    searchService: SearchService,
    notificationService: NotificationService,
    statusManager: StatusManager
  ) {
    this.modelManager = modelManager;
    this.fireTeamsSystem = fireTeamsSystem;
    this.multiModelExecutor = multiModelExecutor;
    this.imageGenerationService = imageGenerationService;
    this.settingsManager = settingsManager;
    this.logger = logger;
    this.commandPalette = commandPalette;
    this.workspaceManager = workspaceManager;
    this.searchService = searchService;
    this.notificationService = notificationService;
    this.statusManager = statusManager;
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
      this.statusManager.info('Initializing core systems...');
      this.logger.info('Initializing core systems...');

      // 1. Initialize Settings Manager (needed early for other systems)
      // Settings are loaded in constructor, no need to call load()
      this.statusManager.info('Settings Manager ready.');
      this.logger.info('Settings Manager ready.');

      // 2. Initialize Theme Manager and apply theme
      const themeId = this.settingsManager.get<string>('ui.theme', 'xibalba-dark');
      themeManager.setTheme(themeId);
      this.statusManager.info('Theme Manager ready.');
      this.logger.info('Theme Manager ready.');

      // 3. Initialize Shortcut Manager
      shortcutManager.initialize();
      this.statusManager.info('Shortcut Manager ready.');
      this.logger.info('Shortcut Manager ready.');

      // 4. Initialize Command Palette (no explicit init needed)
      this.statusManager.info('Command Palette ready.');
      this.logger.info('Command Palette ready.');

      // 5. Initialize Workspace Manager (no explicit init needed)
      this.statusManager.info('Workspace Manager ready.');
      this.logger.info('Workspace Manager ready.');

      // 6. Initialize Search Service (no explicit init needed)
      this.statusManager.info('Search Service ready.');
      this.logger.info('Search Service ready.');

      // 7. Initialize Notification Service (no explicit init needed)
      this.statusManager.info('Notification Service ready.');
      this.logger.info('Notification Service ready.');

      // 8. Check model availability
      this.statusManager.info('Checking model availability...');
      this.logger.info('Checking model availability...');
      await this.modelManager.checkAllModels();

      // 9. Onboard default agents
      this.statusManager.info('Onboarding default agents...');
      this.logger.info('Onboarding default agents...');
      const agents = this.fireTeamsSystem.getAllAgents();
      for (const agent of agents) {
        await hrSystem.onboardAgent(agent);
      }

      // 10. Set up model selection for agents
      this.statusManager.info('Setting up agent-model connections...');
      this.logger.info('Setting up agent-model connections...');
      this.setupAgentModelConnections();

      // 11. Initialize Fire Teams with available models
      this.statusManager.info('Initializing Fire Teams...');
      this.logger.info('Initializing Fire Teams...');
      this.initializeFireTeams();

      // 12. Blockchain System (no explicit init needed, genesis block created in constructor)
      this.logger.info('Blockchain System ready.');

      // 13. Marketplace System (no explicit init needed, default products created in constructor)
      this.logger.info('Marketplace System ready.');

      // 14. Image Generation Service (depends on ModelManager, already initialized)
      this.logger.info('Image Generation Service ready.');

      // Set up event listeners for cross-system communication
      this.setupEventListeners();

      this.initialized = true;
      this.statusManager.success('All core systems integrated and ready.', 3000);
      this.logger.info('All core systems integrated and ready.');
      console.log('[SystemIntegration] All systems integrated successfully');
    } catch (error: any) {
      console.error('[SystemIntegration] Initialization error:', error);
      this.logger.error(`System integration failed: ${error.message}`, error);
      this.statusManager.error(`System integration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set up event listeners for cross-system communication
   */
  private setupEventListeners(): void {
    // Theme change events
    themeManager.onThemeChange((theme) => {
      this.settingsManager.set('ui.theme', theme.id);
      this.notificationService.info('Theme Changed', `Switched to ${theme.displayName}`);
      this.logger.info(`Theme changed to ${theme.displayName}`);
    });

    // Command palette shortcuts
    document.addEventListener('devforge:command-palette', () => {
      // This would trigger the command palette UI
      this.notificationService.info('Command Palette', 'Opening command palette...');
    });

    // Theme toggle shortcut
    document.addEventListener('devforge:toggle-theme', () => {
      const currentTheme = themeManager.getCurrentTheme();
      const newThemeId = currentTheme.isDark ? 'xibalba-light' : 'xibalba-dark';
      themeManager.setTheme(newThemeId);
    });

    // Model status changes
    this.modelManager.onStatusChange(() => {
      this.statusManager.info('Model status updated.', 1000);
      this.logger.debug('Model status updated.');
    });

    // Agent status changes
    hrSystem.onStatusChange(() => {
      this.statusManager.info('Agent status updated.', 1000);
      this.logger.debug('Agent status updated.');
    });

    // Fire Team status changes
    this.fireTeamsSystem.onStatusChange(() => {
      this.statusManager.info('Fire Team status updated.', 1000);
      this.logger.debug('Fire Team status updated.');
    });
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
    blockchain: { blocks: number; valid: boolean };
    marketplace: { products: number };
    workspaces: { total: number; active: number };
    settings: { loaded: boolean };
    initialized: boolean;
  } {
    const models = this.modelManager.getAllModels();
    const agents = this.fireTeamsSystem.getAllAgents();
    const teams = this.fireTeamsSystem.getAllTeams();
    const blockchainStats = blockchainSystem.getChainStats();
    const marketplace = marketplaceSystem.getAllProducts();
    const workspaces = this.workspaceManager.getAllWorkspaces();
    const currentWorkspace = (this.workspaceManager as any).currentWorkspace;

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
      blockchain: {
        blocks: blockchainStats.length,
        valid: blockchainStats.verified,
      },
      marketplace: {
        products: marketplace.length,
      },
      workspaces: {
        total: workspaces.length,
        active: currentWorkspace ? 1 : 0,
      },
      settings: {
        loaded: true, // Settings are loaded in constructor
      },
      initialized: this.initialized,
    };
  }
}

