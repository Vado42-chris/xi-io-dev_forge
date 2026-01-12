/**
 * VS Code Plugin API Adapter
 * 
 * Creates PluginAPI with VS Code UI and Config adapters.
 */

import * as vscode from 'vscode';
import { PluginAPI, PermissionValidator, ModelProviderRegistry, ApiProviderRegistry, PluginPermissions, UIAdapter, ConfigAdapter } from '@dev-forge/core';
import { VSCodeUIAdapter } from './uiAdapter';
import { VSCodeConfigAdapter } from './configAdapter';

export function createVSCodePluginAPI(
  context: vscode.ExtensionContext,
  permissionValidator: PermissionValidator,
  modelProviderRegistry: ModelProviderRegistry,
  apiProviderRegistry: ApiProviderRegistry,
  permissions: PluginPermissions
): PluginAPI {
  const uiAdapter: UIAdapter = new VSCodeUIAdapter(context.extensionUri);
  const configAdapter: ConfigAdapter = new VSCodeConfigAdapter(
    vscode.workspace.getConfiguration('devForge')
  );

  return new PluginAPI(
    permissionValidator,
    modelProviderRegistry,
    apiProviderRegistry,
    permissions,
    uiAdapter,
    configAdapter
  );
}

