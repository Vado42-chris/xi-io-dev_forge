/**
 * Status Bar Items
 * 
 * Status bar indicators for Dev Forge (model status, provider status, etc.)
 */

import * as vscode from 'vscode';

export class StatusBarManager {
  private modelStatusItem: vscode.StatusBarItem;
  private providerStatusItem: vscode.StatusBarItem;
  private pluginStatusItem: vscode.StatusBarItem;

  constructor() {
    // Model status
    this.modelStatusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.modelStatusItem.command = 'devForge.models.select';
    this.modelStatusItem.tooltip = 'Click to select model';

    // Provider status
    this.providerStatusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.providerStatusItem.command = 'devForge.apiProviders.configure';
    this.providerStatusItem.tooltip = 'Click to configure API providers';

    // Plugin status
    this.pluginStatusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      98
    );
    this.pluginStatusItem.command = 'devForge.plugins.manage';
    this.pluginStatusItem.tooltip = 'Click to manage plugins';
  }

  /**
   * Update model status
   */
  updateModelStatus(modelName: string | null, provider: string | null): void {
    if (modelName && provider) {
      this.modelStatusItem.text = `$(circuit-board) ${modelName} (${provider})`;
      this.modelStatusItem.show();
    } else {
      this.modelStatusItem.hide();
    }
  }

  /**
   * Update provider status
   */
  updateProviderStatus(count: number): void {
    if (count > 0) {
      this.providerStatusItem.text = `$(plug) ${count} API Provider${count > 1 ? 's' : ''}`;
      this.providerStatusItem.show();
    } else {
      this.providerStatusItem.hide();
    }
  }

  /**
   * Update plugin status
   */
  updatePluginStatus(count: number): void {
    if (count > 0) {
      this.pluginStatusItem.text = `$(extensions) ${count} Plugin${count > 1 ? 's' : ''}`;
      this.pluginStatusItem.show();
    } else {
      this.pluginStatusItem.hide();
    }
  }

  /**
   * Dispose status bar items
   */
  dispose(): void {
    this.modelStatusItem.dispose();
    this.providerStatusItem.dispose();
    this.pluginStatusItem.dispose();
  }
}

