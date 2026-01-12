/**
 * Tree Views
 * 
 * Tree views for models, agents, and plugins in the sidebar.
 */

import * as vscode from 'vscode';
import { ModelProviderRegistry } from '../../src/services/providers/modelProviderRegistry';
import { PluginManager } from '../../src/services/plugins/pluginManager';

export class ModelsTreeDataProvider implements vscode.TreeDataProvider<ModelTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModelTreeItem | undefined | null | void> = new vscode.EventEmitter<ModelTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<ModelTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private modelProviderRegistry: ModelProviderRegistry) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ModelTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ModelTreeItem): Promise<ModelTreeItem[]> {
    if (!element) {
      // Root level: show providers
      const providers = this.modelProviderRegistry.getAllProviders();
      return providers.map(provider => new ModelTreeItem(
        provider.name,
        vscode.TreeItemCollapsibleState.Collapsed,
        provider.id,
        'provider'
      ));
    }

    if (element.type === 'provider') {
      // Provider level: show models
      const provider = this.modelProviderRegistry.getProvider(element.id);
      if (provider) {
        const models = await provider.listModels();
        return models.map(model => new ModelTreeItem(
          model.name,
          vscode.TreeItemCollapsibleState.None,
          model.id,
          'model',
          {
            command: 'devForge.models.select',
            title: 'Select Model',
            arguments: [model.id]
          }
        ));
      }
    }

    return [];
  }
}

class ModelTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly id: string,
    public readonly type: 'provider' | 'model',
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} (${this.type})`;
    this.contextValue = type;
  }

  iconPath = {
    light: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'),
    dark: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>')
  };
}

export class PluginsTreeDataProvider implements vscode.TreeDataProvider<PluginTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<PluginTreeItem | undefined | null | void> = new vscode.EventEmitter<PluginTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<PluginTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private pluginManager: PluginManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PluginTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: PluginTreeItem): PluginTreeItem[] {
    const plugins = this.pluginManager.getAllPlugins();
    return plugins.map(plugin => new PluginTreeItem(
      plugin.name,
      vscode.TreeItemCollapsibleState.None,
      plugin.id,
      {
        command: 'devForge.plugins.manage',
        title: 'Manage Plugin',
        arguments: [plugin.id]
      }
    ));
  }
}

class PluginTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly id: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label} (plugin)`;
    this.contextValue = 'plugin';
  }

  iconPath = {
    light: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'),
    dark: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>')
  };
}

