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

let configManager: ConfigurationManager | undefined;

/**
 * Extension activation
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Dev Forge extension is now active!');

  // Initialize configuration manager
  configManager = new ConfigurationManager(context);
  await configManager.initialize();

  // Register commands
  registerCommands(context);

  // Listen for configuration changes
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('devForge')) {
      configManager?.reload();
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
 * Extension deactivation
 */
export function deactivate(): void {
  configManager?.dispose();
  configManager = undefined;
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
    // TODO: Get modelProviderRegistry from extension context
    // ModelSelectorPanel.createOrShow(context.extensionUri, modelProviderRegistry);
    vscode.window.showInformationMessage('Model selector (coming soon - needs ModelProviderRegistry)');
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
    // TODO: Get ggufProvider from extension context
    // GGUFBrowserPanel.createOrShow(context.extensionUri, ggufProvider);
    vscode.window.showInformationMessage('GGUF browser (coming soon - needs GGUFProvider)');
  });

  // API provider commands
  const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
    // TODO: Get apiProviderRegistry and apiKeyManager from extension context
    // ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
    vscode.window.showInformationMessage('API provider manager (coming soon - needs ApiProviderRegistry)');
  });

  const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
    // TODO: Get apiProviderRegistry and apiKeyManager from extension context
    // ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
    vscode.window.showInformationMessage('API provider manager (coming soon - needs ApiProviderRegistry)');
  });

  // Plugin commands
  const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
    // TODO: Get pluginManager from extension context
    // PluginManagerPanel.createOrShow(context.extensionUri, pluginManager);
    vscode.window.showInformationMessage('Plugin manager (coming soon - needs PluginManager)');
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

