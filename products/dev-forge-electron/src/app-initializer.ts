/**
 * App Initializer
 * 
 * Initializes all Dev Forge systems and components.
 * Wires everything together and sets up the application.
 */

import { ModelManager } from './model-manager';
import { FireTeamsSystem } from './systems/fire-teams';
import { MultiModelExecutor } from './services/multi-model-executor';
import { SystemIntegration } from './services/system-integration';
import { blockchainSystem } from './systems/blockchain-system';
import { marketplaceSystem } from './systems/marketplace-system';
import { ImageGenerationService } from './services/image-generation-service';
import { SettingsManager } from './services/settings-manager';
import { Logger } from './services/logger';
import { CommandPalette } from './services/command-palette';
import { WorkspaceManager } from './services/workspace-manager';
import { SearchService } from './services/search-service';
import { NotificationService } from './services/notification-service';
import { themeManager } from './services/theme-manager';
import { shortcutManager } from './services/shortcut-manager';
import { StatusManager } from './status-manager';

// UI Components
import { MarketplacePanel } from './components/marketplace-panel';
import { CommandPalettePanel } from './components/command-palette-panel';
import { SettingsPanel } from './components/settings-panel';
import { WorkspacePanel } from './components/workspace-panel';
import { SearchPanel } from './components/search-panel';
import { NotificationCenter } from './components/notification-center';

export class AppInitializer {
  private systemIntegration: SystemIntegration | null = null;
  private statusManager: StatusManager;
  private logger: Logger;
  private isInitialized: boolean = false;

  // Services
  private modelManager: ModelManager;
  private fireTeamsSystem: FireTeamsSystem;
  private multiModelExecutor: MultiModelExecutor;
  private imageGenerationService: ImageGenerationService;
  private settingsManager: SettingsManager;
  private commandPalette: CommandPalette;
  private workspaceManager: WorkspaceManager;
  private searchService: SearchService;
  private notificationService: NotificationService;

  // UI Components
  private marketplacePanel: MarketplacePanel | null = null;
  private commandPalettePanel: CommandPalettePanel | null = null;
  private settingsPanel: SettingsPanel | null = null;
  private workspacePanel: WorkspacePanel | null = null;
  private searchPanel: SearchPanel | null = null;
  private notificationCenter: NotificationCenter | null = null;

  constructor() {
    // Initialize core services first
    this.statusManager = new StatusManager();
    this.logger = new Logger({ level: 'info' });
    this.modelManager = new ModelManager();
    this.fireTeamsSystem = new FireTeamsSystem();
    this.multiModelExecutor = new MultiModelExecutor(this.modelManager);
    this.imageGenerationService = new ImageGenerationService();
    this.settingsManager = new SettingsManager();
    this.commandPalette = new CommandPalette();
    this.workspaceManager = new WorkspaceManager();
    this.searchService = new SearchService();
    this.notificationService = new NotificationService();

    // Initialize system integration
    this.systemIntegration = new SystemIntegration(
      this.modelManager,
      this.fireTeamsSystem,
      this.multiModelExecutor,
      this.imageGenerationService,
      this.settingsManager,
      this.logger,
      this.commandPalette,
      this.workspaceManager,
      this.searchService,
      this.notificationService,
      this.statusManager
    );
  }

  /**
   * Initialize the entire application.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[AppInitializer] Already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Dev Forge...');
      this.statusManager.info('Initializing Dev Forge...');

      // 1. Initialize all systems
      await this.systemIntegration!.initialize();
      this.logger.info('All systems initialized');

      // 2. Initialize UI components
      await this.initializeUIComponents();
      this.logger.info('UI components initialized');

      // 3. Set up global event handlers
      this.setupGlobalEventHandlers();
      this.logger.info('Global event handlers set up');

      // 4. Apply initial theme
      const themeId = this.settingsManager.get('ui', 'theme') || 'xibalba-dark';
      themeManager.setTheme(themeId);
      this.logger.info(`Theme applied: ${themeId}`);

      // 5. Initialize shortcut manager
      shortcutManager.initialize();
      this.logger.info('Shortcut manager initialized');

      this.isInitialized = true;
      this.statusManager.success('Dev Forge ready!', 3000);
      this.logger.info('Dev Forge initialization complete');
      this.notificationService.success('Welcome', 'Dev Forge is ready to use!');

      console.log('[AppInitializer] Dev Forge initialized successfully');
    } catch (error: any) {
      console.error('[AppInitializer] Initialization error:', error);
      this.logger.error(`Initialization failed: ${error.message}`, error);
      this.statusManager.error(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize all UI components.
   */
  private async initializeUIComponents(): Promise<void> {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize Marketplace Panel
      const marketplaceContainer = document.getElementById('marketplace-panel');
      if (marketplaceContainer) {
        this.marketplacePanel = new MarketplacePanel(
          'marketplace-panel',
          marketplaceSystem
        );
        this.logger.info('Marketplace Panel initialized');
      }

      // Initialize Command Palette Panel
      const commandPaletteContainer = document.getElementById('command-palette-panel');
      if (commandPaletteContainer) {
        this.commandPalettePanel = new CommandPalettePanel(
          'command-palette-panel',
          this.commandPalette,
          this.statusManager
        );
        this.logger.info('Command Palette Panel initialized');
      }

      // Initialize Settings Panel
      const settingsContainer = document.getElementById('settings-panel');
      if (settingsContainer) {
        this.settingsPanel = new SettingsPanel(
          'settings-panel',
          this.settingsManager,
          this.statusManager
        );
        this.logger.info('Settings Panel initialized');
      }

      // Initialize Workspace Panel
      const workspaceContainer = document.getElementById('workspace-panel');
      if (workspaceContainer) {
        this.workspacePanel = new WorkspacePanel(
          'workspace-panel',
          this.workspaceManager,
          this.statusManager
        );
        this.logger.info('Workspace Panel initialized');
      }

      // Initialize Search Panel
      const searchContainer = document.getElementById('search-panel');
      if (searchContainer) {
        this.searchPanel = new SearchPanel(
          'search-panel',
          this.searchService,
          this.statusManager
        );
        this.logger.info('Search Panel initialized');
      }

      // Initialize Notification Center
      const notificationContainer = document.getElementById('notification-center');
      if (notificationContainer) {
        this.notificationCenter = new NotificationCenter(
          'notification-center',
          this.notificationService
        );
        this.logger.info('Notification Center initialized');
      }

      this.logger.info('All UI components initialized');
    } catch (error: any) {
      console.error('[AppInitializer] Error initializing UI components:', error);
      this.logger.error(`UI component initialization failed: ${error.message}`, error);
      throw error;
    }
  }

  /**
   * Set up global event handlers for cross-component communication.
   */
  private setupGlobalEventHandlers(): void {
    // Command palette toggle
    document.addEventListener('devforge:command-palette', () => {
      if (this.commandPalettePanel) {
        this.commandPalettePanel.toggle();
      }
    });

    // Settings toggle
    document.addEventListener('devforge:open-settings', () => {
      if (this.settingsPanel) {
        this.settingsPanel.show();
      }
    });

    // Search toggle
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        if (this.searchPanel) {
          this.searchPanel.toggle();
        }
      }
    });

    // Theme toggle
    document.addEventListener('devforge:toggle-theme', () => {
      const currentTheme = themeManager.getCurrentTheme();
      const newThemeId = currentTheme.isDark ? 'xibalba-light' : 'xibalba-dark';
      themeManager.setTheme(newThemeId);
      this.settingsManager.set('ui', 'theme', newThemeId);
      const theme = themeManager.getTheme(newThemeId);
      this.notificationService.info('Theme Changed', `Switched to ${theme?.displayName || newThemeId}`);
    });

    // File opening
    document.addEventListener('devforge:open-file', (e: any) => {
      const { path, line } = e.detail;
      this.logger.info(`Opening file: ${path}${line ? ` at line ${line}` : ''}`);
      this.statusManager.info(`Opening ${path}...`, 2000);
      // This would trigger the editor to open the file
    });

    // Workspace loaded
    document.addEventListener('devforge:workspace-loaded', (e: any) => {
      const { workspaceId } = e.detail;
      this.logger.info(`Workspace loaded: ${workspaceId}`);
      this.notificationService.success('Workspace Loaded', 'Workspace has been loaded successfully');
    });

    // Project opened
    document.addEventListener('devforge:project-opened', (e: any) => {
      const { project } = e.detail;
      this.logger.info(`Project opened: ${project.name}`);
      this.notificationService.info('Project Opened', `Opening project: ${project.name}`);
    });

    this.logger.info('Global event handlers set up');
  }

  /**
   * Get system integration instance.
   */
  getSystemIntegration(): SystemIntegration {
    if (!this.systemIntegration) {
      throw new Error('System integration not initialized');
    }
    return this.systemIntegration;
  }

  /**
   * Get status manager instance.
   */
  getStatusManager(): StatusManager {
    return this.statusManager;
  }

  /**
   * Get logger instance.
   */
  getLogger(): Logger {
    return this.logger;
  }
}

// Export singleton instance
export const appInitializer = new AppInitializer();

