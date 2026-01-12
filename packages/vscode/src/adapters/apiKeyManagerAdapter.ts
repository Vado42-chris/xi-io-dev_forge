/**
 * VS Code API Key Manager Adapter
 * 
 * Creates ApiKeyManager with VS Code SecretStorage and Config.
 */

import * as vscode from 'vscode';
import { ApiKeyManager, SecretStorage, ConfigStorage } from '@dev-forge/core';
import { VSCodeSecretStorageAdapter } from './secretStorageAdapter';
import { VSCodeConfigAdapter } from './configAdapter';

export function createVSCodeApiKeyManager(context: vscode.ExtensionContext): ApiKeyManager {
  const secretStorage: SecretStorage = new VSCodeSecretStorageAdapter(context.secrets);
  const config: ConfigStorage = new VSCodeConfigAdapter(
    vscode.workspace.getConfiguration('devForge')
  );
  
  return new ApiKeyManager(secretStorage, config);
}

