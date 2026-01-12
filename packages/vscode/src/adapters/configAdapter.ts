/**
 * VS Code Config Adapter
 * 
 * Adapts VS Code WorkspaceConfiguration to core SDK ConfigStorage interface.
 */

import * as vscode from 'vscode';
import { ConfigStorage } from '@dev-forge/core';

export class VSCodeConfigAdapter implements ConfigStorage {
  private config: vscode.WorkspaceConfiguration;

  constructor(config: vscode.WorkspaceConfiguration) {
    this.config = config;
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.config.get<T>(key, defaultValue);
  }
}

