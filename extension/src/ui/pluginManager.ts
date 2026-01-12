/**
 * Plugin Manager Webview
 * 
 * UI for managing plugins (install, enable, disable, configure).
 */

import * as vscode from 'vscode';
import { PluginManager } from '../../../src/services/plugins/pluginManager';

export class PluginManagerPanel {
  private static currentPanel: PluginManagerPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private pluginManager: PluginManager;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, pluginManager: PluginManager) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.pluginManager = pluginManager;

    this._update();

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'refresh':
            await this._refresh();
            return;
          case 'enable':
            await this._enablePlugin(message.id);
            return;
          case 'disable':
            await this._disablePlugin(message.id);
            return;
          case 'unload':
            await this._unloadPlugin(message.id);
            return;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, pluginManager: PluginManager) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (PluginManagerPanel.currentPanel) {
      PluginManagerPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'devForgePluginManager',
      'Dev Forge - Plugin Manager',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    PluginManagerPanel.currentPanel = new PluginManagerPanel(panel, extensionUri, pluginManager);
  }

  private async _update() {
    const plugins = this.pluginManager.getAllPlugins();
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview, plugins);
  }

  private async _refresh() {
    // TODO: Refresh plugin list
    await this._update();
  }

  private async _enablePlugin(id: string) {
    // TODO: Enable plugin
    vscode.window.showInformationMessage(`Enabling plugin: ${id}`);
  }

  private async _disablePlugin(id: string) {
    // TODO: Disable plugin
    vscode.window.showInformationMessage(`Disabling plugin: ${id}`);
  }

  private async _unloadPlugin(id: string) {
    try {
      await this.pluginManager.unloadPlugin(id);
      vscode.window.showInformationMessage(`Plugin unloaded: ${id}`);
      await this._update();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to unload plugin: ${error.message}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview, plugins: any[]): string {
    const pluginsHtml = plugins.map(plugin => `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-header">
          <h3>${plugin.name}</h3>
          <span class="version">v${plugin.version}</span>
        </div>
        <p class="plugin-description">${plugin.description || 'No description'}</p>
        <div class="plugin-info">
          <div class="info-item">
            <span class="label">Author:</span>
            <span class="value">${plugin.author || 'Unknown'}</span>
          </div>
          <div class="info-item">
            <span class="label">API Version:</span>
            <span class="value">${plugin.apiVersion}</span>
          </div>
        </div>
        <div class="plugin-actions">
          <button class="btn-enable" data-action="enable" data-plugin-id="${plugin.id}">Enable</button>
          <button class="btn-disable" data-action="disable" data-plugin-id="${plugin.id}">Disable</button>
          <button class="btn-unload" data-action="unload" data-plugin-id="${plugin.id}">Unload</button>
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Forge - Plugin Manager</title>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #1e1e1e;
      color: #cccccc;
      padding: 20px;
      margin: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .plugins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .plugin-card {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
    }
    .plugin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .plugin-header h3 {
      margin: 0;
      color: #ffffff;
    }
    .version {
      background: #3e3e42;
      color: #cccccc;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .plugin-description {
      color: #999999;
      font-size: 14px;
      margin-bottom: 12px;
    }
    .plugin-info {
      margin-bottom: 12px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .plugin-actions {
      display: flex;
      gap: 8px;
    }
    button {
      background: #007acc;
      color: white;
      border: none;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      flex: 1;
    }
    .btn-disable, .btn-unload {
      background: #d32f2f;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Plugin Manager</h1>
    <button onclick="refresh()">Refresh</button>
  </div>
  <div class="plugins-grid" id="pluginsGrid">
    ${pluginsHtml || '<p>No plugins installed.</p>'}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    function refresh() {
      vscode.postMessage({ command: 'refresh' });
    }
    
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const pluginId = e.target.getAttribute('data-plugin-id');
        vscode.postMessage({ command: action, id: pluginId });
      });
    });
  </script>
</body>
</html>`;
  }

  public dispose() {
    PluginManagerPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

