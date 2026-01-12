/**
 * API Key Manager
 * 
 * Manages API keys securely using VS Code SecretStorage.
 */

import * as vscode from 'vscode';

export class ApiKeyManager {
  private secretStorage: vscode.SecretStorage;
  private config: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
    this.config = vscode.workspace.getConfiguration('devForge');
  }

  /**
   * Store API key securely
   */
  async storeApiKey(providerId: string, apiKey: string): Promise<void> {
    const key = `devForge.${providerId}.apiKey`;
    await this.secretStorage.store(key, apiKey);
  }

  /**
   * Get API key
   */
  async getApiKey(providerId: string): Promise<string | undefined> {
    // Try SecretStorage first
    const key = `devForge.${providerId}.apiKey`;
    let apiKey = await this.secretStorage.get(key);
    
    // Fallback to config (for env var references)
    if (!apiKey) {
      const configKey = this.config.get<string>(`apiProviders.providers.${providerId}.apiKey`);
      if (configKey?.startsWith('${env:')) {
        const envVar = configKey.match(/\${env:([^}]+)}/)?.[1];
        apiKey = process.env[envVar || ''];
      } else if (configKey) {
        apiKey = configKey;
      }
    }
    
    return apiKey;
  }

  /**
   * Delete API key
   */
  async deleteApiKey(providerId: string): Promise<void> {
    const key = `devForge.${providerId}.apiKey`;
    await this.secretStorage.delete(key);
  }

  /**
   * Check if API key exists
   */
  async hasApiKey(providerId: string): Promise<boolean> {
    const apiKey = await this.getApiKey(providerId);
    return !!apiKey;
  }
}

