/**
 * VS Code Plugin Manager Adapter
 * 
 * Creates PluginManager with VS Code configuration.
 */

import * as vscode from 'vscode';
import { PluginManager, PluginManagerConfig, ModelProviderRegistry, ApiProviderRegistry } from '@dev-forge/core';

export function createVSCodePluginManager(
  context: vscode.ExtensionContext,
  modelProviderRegistry: ModelProviderRegistry,
  apiProviderRegistry: ApiProviderRegistry
): PluginManager {
  const config = vscode.workspace.getConfiguration('devForge');
  const pluginDirectory = config.get<string>('plugins.pluginDirectory', '~/.dev-forge/plugins');
  const autoLoad = config.get<boolean>('plugins.autoLoad', true);

  const pluginConfig: PluginManagerConfig = {
    pluginDirectory,
    autoLoad
  };

  return new PluginManager(pluginConfig, modelProviderRegistry, apiProviderRegistry);
}

