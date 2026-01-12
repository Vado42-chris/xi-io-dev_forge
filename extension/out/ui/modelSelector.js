"use strict";
/**
 * Model Selector Webview
 *
 * UI for selecting and managing models from all providers.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSelectorPanel = void 0;
const vscode = __importStar(require("vscode"));
class ModelSelectorPanel {
    constructor(panel, extensionUri, modelProviderRegistry) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.modelProviderRegistry = modelProviderRegistry;
        // Set webview content
        this._update();
        // Listen for messages from webview
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refresh':
                    await this._refreshModels();
                    return;
                case 'selectModel':
                    await this._selectModel(message.modelId);
                    return;
                case 'loadModel':
                    await this._loadModel(message.modelId);
                    return;
                case 'unloadModel':
                    await this._unloadModel(message.modelId);
                    return;
            }
        }, null, this._disposables);
        // Handle panel disposal
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    /**
     * Create or show model selector panel
     */
    static createOrShow(extensionUri, modelProviderRegistry) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // If panel already exists, reveal it
        if (ModelSelectorPanel.currentPanel) {
            ModelSelectorPanel.currentPanel._panel.reveal(column);
            return;
        }
        // Create new panel
        const panel = vscode.window.createWebviewPanel('devForgeModelSelector', 'Dev Forge - Model Selector', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        ModelSelectorPanel.currentPanel = new ModelSelectorPanel(panel, extensionUri, modelProviderRegistry);
    }
    /**
     * Update webview content
     */
    async _update() {
        const models = await this._getAllModels();
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, models);
    }
    /**
     * Get all models from all providers
     */
    async _getAllModels() {
        try {
            return await this.modelProviderRegistry.listAllModels();
        }
        catch (error) {
            console.error('[ModelSelector] Error getting models:', error);
            return [];
        }
    }
    /**
     * Refresh models
     */
    async _refreshModels() {
        await this._update();
        this._panel.webview.postMessage({
            command: 'modelsRefreshed',
            models: await this._getAllModels()
        });
    }
    /**
     * Select a model
     */
    async _selectModel(modelId) {
        // TODO: Implement model selection
        vscode.window.showInformationMessage(`Selected model: ${modelId}`);
    }
    /**
     * Load a model
     */
    async _loadModel(modelId) {
        // TODO: Implement model loading
        vscode.window.showInformationMessage(`Loading model: ${modelId}`);
    }
    /**
     * Unload a model
     */
    async _unloadModel(modelId) {
        // TODO: Implement model unloading
        vscode.window.showInformationMessage(`Unloading model: ${modelId}`);
    }
    /**
     * Get HTML for webview
     */
    _getHtmlForWebview(webview, models) {
        const modelsHtml = models.map(model => `
      <div class="model-card" data-model-id="${model.id}">
        <div class="model-header">
          <h3>${model.name}</h3>
          <span class="provider-badge provider-${model.provider}">${model.provider}</span>
        </div>
        <p class="model-description">${model.description || 'No description'}</p>
        <div class="model-actions">
          <button class="btn-select" data-action="select" data-model-id="${model.id}">Select</button>
          <button class="btn-load" data-action="load" data-model-id="${model.id}">Load</button>
        </div>
      </div>
    `).join('');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Forge - Model Selector</title>
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
    h1 {
      margin: 0;
      color: #ffffff;
    }
    .btn-refresh {
      background: #007acc;
      color: white;
      border: none;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
    }
    .models-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .model-card {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
      transition: border-color 0.2s;
    }
    .model-card:hover {
      border-color: #007acc;
    }
    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .model-header h3 {
      margin: 0;
      color: #ffffff;
    }
    .provider-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .provider-ollama { background: #4a9eff; }
    .provider-gguf { background: #7b68ee; }
    .provider-api { background: #50c878; }
    .provider-plugin { background: #ff6b6b; }
    .model-description {
      color: #999999;
      font-size: 14px;
      margin-bottom: 12px;
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
    }
    button:hover {
      background: #005a9e;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Model Selector</h1>
    <button class="btn-refresh" onclick="refreshModels()">Refresh</button>
  </div>
  <div class="models-grid" id="modelsGrid">
    ${modelsHtml}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    function refreshModels() {
      vscode.postMessage({ command: 'refresh' });
    }
    
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const modelId = e.target.getAttribute('data-model-id');
        vscode.postMessage({ command: action + 'Model', modelId });
      });
    });
    
    // Listen for messages from extension
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'modelsRefreshed') {
        // Update UI with new models
        console.log('Models refreshed:', message.models);
      }
    });
  </script>
</body>
</html>`;
    }
    /**
     * Dispose resources
     */
    dispose() {
        ModelSelectorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.ModelSelectorPanel = ModelSelectorPanel;
//# sourceMappingURL=modelSelector.js.map