/**
 * Dev Forge Extension - Entry Point
 * 
 * Multiagent coding engine with extensible model providers,
 * GGUF support, and custom API integration.
 */

import * as vscode from 'vscode';
import { ConfigurationManager } from './services/configurationManager';
import { ModelSelectorPanel } from './ui/modelSelector';
import { GGUFBrowserPanel } from './ui/ggufBrowser';
import { ApiProviderManagerPanel } from './ui/apiProviderManager';
import { PluginManagerPanel } from './ui/pluginManager';
import { ModelsTreeDataProvider, PluginsTreeDataProvider } from './ui/treeViews';
import { StatusBarManager } from './ui/statusBar';

// Import services (using path alias)
import { ModelProviderRegistry } from '@services/providers/modelProviderRegistry';
import { OllamaProvider } from '@services/providers/ollamaProvider';
import { GGUFProvider } from '@services/providers/ggufProvider';
import { ApiProviderRegistry } from '@services/api/apiProviderRegistry';
import { ApiKeyManager } from '@services/api/apiKeyManager';
import { PluginManager } from '@services/plugins/pluginManager';

let configManager: ConfigurationManager | undefined;
let statusBarManager: StatusBarManager | undefined;
let modelProviderRegistry: ModelProviderRegistry | undefined;
let apiProviderRegistry: ApiProviderRegistry | undefined;
let apiKeyManager: ApiKeyManager | undefined;
let pluginManager: PluginManager | undefined;
let modelsTreeProvider: ModelsTreeDataProvider | undefined;
let pluginsTreeProvider: PluginsTreeDataProvider | undefined;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Dev Forge extension is now active!');

  // Initialize configuration manager
  configManager = new ConfigurationManager(context);
  await configManager.initialize();

  // Initialize API key manager
  apiKeyManager = new ApiKeyManager(context.secrets);

  // Initialize provider registries
  modelProviderRegistry = new ModelProviderRegistry();
  apiProviderRegistry = new ApiProviderRegistry(apiKeyManager);

  // Initialize and register providers based on settings
  await initializeProviders();

  // Initialize plugin manager
  // Note: PluginManager constructor needs ExtensionContext, but we'll create a minimal one
  // For now, we'll pass the context and let PluginManager handle it
  pluginManager = new PluginManager(
    context,
    modelProviderRegistry,
    apiProviderRegistry
  );

  // Initialize tree views
  modelsTreeProvider = new ModelsTreeDataProvider(modelProviderRegistry);
  pluginsTreeProvider = new PluginsTreeDataProvider(pluginManager);

  // Register tree views
  context.subscriptions.push(
    vscode.window.createTreeView('devForgeModels', {
      treeDataProvider: modelsTreeProvider
    }),
    vscode.window.createTreeView('devForgePlugins', {
      treeDataProvider: pluginsTreeProvider
    })
  );

  // Initialize status bar
  statusBarManager = new StatusBarManager();
  updateStatusBar();

  // Register commands
  registerCommands(context);

  // Listen for configuration changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('devForge')) {
      configManager?.reload();
      updateStatusBar();
      modelsTreeProvider?.refresh();
      pluginsTreeProvider?.refresh();
      vscode.window.showInformationMessage('Dev Forge configuration updated');
    }
  });

  // Show welcome message
  const enabled = configManager.getSetting<boolean>('models.enabled', true);
  if (enabled) {
    vscode.window.showInformationMessage('Dev Forge: Model system enabled');
  }
}

/**
 * Initialize model and API providers based on settings
 */
async function initializeProviders(): Promise<void> {
  if (!configManager || !modelProviderRegistry || !apiProviderRegistry) {
    return;
  }

  // Initialize Ollama provider if enabled
  const ollamaEnabled = configManager.getSetting<boolean>('models.ollama.enabled', true);
  if (ollamaEnabled) {
    const ollamaBaseUrl = configManager.getSetting<string>('models.ollama.baseUrl', 'http://localhost:11434');
    const ollamaProvider = new OllamaProvider({ baseUrl: ollamaBaseUrl });
    await modelProviderRegistry.registerProvider(ollamaProvider);
  }

  // Initialize GGUF provider if enabled
  const ggufEnabled = configManager.getSetting<boolean>('models.gguf.enabled', false);
  if (ggufEnabled) {
    const ggufDirectory = configManager.getSetting<string>('models.gguf.modelsDirectory', '~/.dev-forge/models/gguf');
    const maxMemory = configManager.getSetting<number>('models.gguf.maxMemory', 4096);
    const ggufProvider = new GGUFProvider({
      modelsDirectory: ggufDirectory.replace(/^~/, process.env.HOME || ''),
      maxMemory
    });
    await modelProviderRegistry.registerProvider(ggufProvider);
  }

  // Load plugins if enabled
  const pluginsEnabled = configManager.getSetting<boolean>('plugins.enabled', true);
  const autoLoad = configManager.getSetting<boolean>('plugins.autoLoad', true);
  if (pluginsEnabled && autoLoad && pluginManager) {
    await pluginManager.discoverPlugins();
    await pluginManager.loadAllPlugins();
  }
}

/**
 * Update status bar with current state
 */
function updateStatusBar(): void {
  if (!statusBarManager || !modelProviderRegistry || !apiProviderRegistry || !pluginManager) {
    return;
  }

  // Update model status
  const models = modelProviderRegistry.listAllModels();
  if (models.length > 0) {
    const firstModel = models[0];
    statusBarManager.updateModelStatus(firstModel.name, firstModel.provider);
  }

  // Update provider status
  const providers = apiProviderRegistry.getAllProviders();
  statusBarManager.updateProviderStatus(providers.length);

  // Update plugin status
  const plugins = pluginManager.getAllPlugins();
  statusBarManager.updatePluginStatus(plugins.length);
}

/**
 * Extension deactivation
 */
export async function deactivate(): Promise<void> {
  configManager?.dispose();
  configManager = undefined;
  statusBarManager?.dispose();
  statusBarManager = undefined;
  // ModelProviderRegistry doesn't have dispose, but providers do
  if (modelProviderRegistry) {
    const providers = modelProviderRegistry.getAllProviders();
    for (const provider of providers) {
      if (provider.dispose) {
        await provider.dispose();
      }
    }
  }
  modelProviderRegistry = undefined;
  apiProviderRegistry = undefined;
  apiKeyManager = undefined;
  pluginManager = undefined;
  modelsTreeProvider = undefined;
  pluginsTreeProvider = undefined;
}

/**
 * Register extension commands
 */
function registerCommands(context: vscode.ExtensionContext): void {
  // Settings command
  const settingsCommand = vscode.commands.registerCommand('devForge.settings.open', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:xibalba.dev-forge');
  });

  // Model commands
  const selectModelCommand = vscode.commands.registerCommand('devForge.models.select', async () => {
    if (modelProviderRegistry) {
      ModelSelectorPanel.createOrShow(context.extensionUri, modelProviderRegistry);
    } else {
      vscode.window.showErrorMessage('Model provider registry not initialized');
    }
  });

  const loadModelCommand = vscode.commands.registerCommand('devForge.models.load', async () => {
    // TODO: Implement model loading
    vscode.window.showInformationMessage('Model loading (coming soon)');
  });

  const unloadModelCommand = vscode.commands.registerCommand('devForge.models.unload', async () => {
    // TODO: Implement model unloading
    vscode.window.showInformationMessage('Model unloading (coming soon)');
  });

  // GGUF commands
  const scanGGUFCommand = vscode.commands.registerCommand('devForge.gguf.scan', async () => {
    if (modelProviderRegistry) {
      const ggufProvider = modelProviderRegistry.getProvider('gguf') as GGUFProvider;
      if (ggufProvider) {
        GGUFBrowserPanel.createOrShow(context.extensionUri, ggufProvider);
      } else {
        vscode.window.showWarningMessage('GGUF provider not enabled. Enable it in settings first.');
      }
    } else {
      vscode.window.showErrorMessage('Model provider registry not initialized');
    }
  });

  // API provider commands
  const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
    if (apiProviderRegistry && apiKeyManager) {
      ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
    } else {
      vscode.window.showErrorMessage('API provider registry not initialized');
    }
  });

  const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
    if (apiProviderRegistry && apiKeyManager) {
      ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
    } else {
      vscode.window.showErrorMessage('API provider registry not initialized');
    }
  });

  // Plugin commands
  const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
    if (pluginManager) {
      PluginManagerPanel.createOrShow(context.extensionUri, pluginManager);
    } else {
      vscode.window.showErrorMessage('Plugin manager not initialized');
    }
  });

  const installPluginCommand = vscode.commands.registerCommand('devForge.plugins.install', async () => {
    // TODO: Implement plugin installation
    vscode.window.showInformationMessage('Plugin installation (coming soon)');
  });

  // Execution commands
  const parallelExecuteCommand = vscode.commands.registerCommand('devForge.execute.parallel', async () => {
    // TODO: Implement parallel execution
    vscode.window.showInformationMessage('Parallel execution (coming soon)');
  });

  const selectedExecuteCommand = vscode.commands.registerCommand('devForge.execute.selected', async () => {
    // TODO: Implement selected execution
    vscode.window.showInformationMessage('Selected execution (coming soon)');
  });

  // Chat command
  const openChatCommand = vscode.commands.registerCommand('devForge.chat.open', async () => {
    // TODO: Implement chat interface
    vscode.window.showInformationMessage('Chat interface (coming soon)');
  });

  // Add all commands to context
  context.subscriptions.push(
    settingsCommand,
    selectModelCommand,
    loadModelCommand,
    unloadModelCommand,
    scanGGUFCommand,
    addApiProviderCommand,
    configureApiProviderCommand,
    managePluginsCommand,
    installPluginCommand,
    parallelExecuteCommand,
    selectedExecuteCommand,
    openChatCommand
  );
}

