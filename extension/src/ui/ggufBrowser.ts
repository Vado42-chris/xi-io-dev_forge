/**
 * GGUF Browser Webview
 * 
 * UI for browsing and managing GGUF models.
 */

import * as vscode from 'vscode';
import { GGUFProvider } from '../../src/services/providers/ggufProvider';

export class GGUFBrowserPanel {
  private static currentPanel: GGUFBrowserPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private ggufProvider: GGUFProvider;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, ggufProvider: GGUFProvider) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.ggufProvider = ggufProvider;

    // Set webview content
    this._update();

    // Listen for messages
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'scan':
            await this._scanModels();
            return;
          case 'load':
            await this._loadModel(message.modelId);
            return;
          case 'unload':
            await this._unloadModel(message.modelId);
            return;
          case 'getMemoryUsage':
            await this._getMemoryUsage();
            return;
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, ggufProvider: GGUFProvider) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (GGUFBrowserPanel.currentPanel) {
      GGUFBrowserPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'devForgeGGUFBrowser',
      'Dev Forge - GGUF Browser',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    GGUFBrowserPanel.currentPanel = new GGUFBrowserPanel(panel, extensionUri, ggufProvider);
  }

  private async _update() {
    const models = await this.ggufProvider.listModels();
    const memoryUsage = this.ggufProvider.getMemoryUsage();
    const webview = this._panel.webview;

    this._panel.webview.html = this._getHtmlForWebview(webview, models, memoryUsage);
  }

  private async _scanModels() {
    await this.ggufProvider.discoverModels();
    await this._update();
  }

  private async _loadModel(modelId: string) {
    try {
      await this.ggufProvider.loadModel(modelId);
      vscode.window.showInformationMessage(`GGUF model loaded: ${modelId}`);
      await this._update();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to load model: ${error.message}`);
    }
  }

  private async _unloadModel(modelId: string) {
    try {
      await this.ggufProvider.unloadModel(modelId);
      vscode.window.showInformationMessage(`GGUF model unloaded: ${modelId}`);
      await this._update();
    } catch (error: any) {
      vscode.window.showErrorMessage(`Failed to unload model: ${error.message}`);
    }
  }

  private async _getMemoryUsage() {
    const usage = this.ggufProvider.getMemoryUsage();
    this._panel.webview.postMessage({
      command: 'memoryUsage',
      usage
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview, models: any[], memoryUsage: number): string {
    const modelsHtml = models.map(model => `
      <div class="model-card" data-model-id="${model.id}">
        <div class="model-header">
          <h3>${model.name}</h3>
          <span class="quantization">${model.parameters?.quantization || 'unknown'}</span>
        </div>
        <div class="model-info">
          <div class="info-item">
            <span class="label">Size:</span>
            <span class="value">${this._formatBytes(model.parameters?.size || 0)}</span>
          </div>
          <div class="info-item">
            <span class="label">Context:</span>
            <span class="value">${model.contextSize || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="label">Path:</span>
            <span class="value path">${model.parameters?.path || 'N/A'}</span>
          </div>
        </div>
        <div class="model-actions">
          <button class="btn-load" data-action="load" data-model-id="${model.id}">Load</button>
          <button class="btn-unload" data-action="unload" data-model-id="${model.id}">Unload</button>
        </div>
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Forge - GGUF Browser</title>
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
    .memory-info {
      background: #252526;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .memory-info strong {
      color: #4a9eff;
    }
    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .model-card {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
    }
    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .model-header h3 {
      margin: 0;
      color: #ffffff;
    }
    .quantization {
      background: #7b68ee;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .model-info {
      margin-bottom: 12px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .label {
      color: #999999;
    }
    .value {
      color: #cccccc;
    }
    .value.path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .model-actions {
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
    button:hover {
      background: #005a9e;
    }
    .btn-unload {
      background: #d32f2f;
    }
    .btn-unload:hover {
      background: #b71c1c;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GGUF Model Browser</h1>
    <button onclick="scanModels()">Scan for Models</button>
  </div>
  <div class="memory-info">
    <strong>Memory Usage:</strong> ${this._formatBytes(memoryUsage * 1024 * 1024)} / ${this._formatBytes(4096 * 1024 * 1024)}
  </div>
  <div class="models-grid" id="modelsGrid">
    ${modelsHtml || '<p>No GGUF models found. Click "Scan for Models" to discover models.</p>'}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    function scanModels() {
      vscode.postMessage({ command: 'scan' });
    }
    
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const modelId = e.target.getAttribute('data-model-id');
        vscode.postMessage({ command: action, modelId });
      });
    });
  </script>
</body>
</html>`;
  }

  private _formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  public dispose() {
    GGUFBrowserPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

