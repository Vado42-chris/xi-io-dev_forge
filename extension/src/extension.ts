/**
 * Dev Forge Extension - Entry Point
 * 
 * Multiagent coding engine with extensible model providers,
 * GGUF support, and custom API integration.
 */

import * as vscode from 'vscode';
import { ConfigurationManager } from './services/configurationManager';

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
    // TODO: Implement model selector
    vscode.window.showInformationMessage('Model selector (coming soon)');
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
    // TODO: Implement GGUF scanning
    vscode.window.showInformationMessage('GGUF scanning (coming soon)');
  });

  // API provider commands
  const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
    // TODO: Implement API provider addition
    vscode.window.showInformationMessage('Add API provider (coming soon)');
  });

  const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
    // TODO: Implement API provider configuration
    vscode.window.showInformationMessage('Configure API provider (coming soon)');
  });

  // Plugin commands
  const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
    // TODO: Implement plugin management
    vscode.window.showInformationMessage('Plugin management (coming soon)');
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

