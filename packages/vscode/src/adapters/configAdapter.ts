/**
 * VS Code Config Adapter
 * 
 * Adapts VS Code WorkspaceConfiguration to core SDK ConfigAdapter interface.
 */

import * as vscode from 'vscode';
import { ConfigAdapter } from '@dev-forge/core';

export class VSCodeConfigAdapter implements ConfigAdapter {
  private config: vscode.WorkspaceConfiguration;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  get<T>(key: string): T | undefined {
    return this.config.get<T>(key);
  }

  async update(key: string, value: any): Promise<void> {
    await this.config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}

