"use strict";
/**
 * API Provider Manager Webview
 *
 * UI for managing API providers (Cursor, OpenAI, Anthropic, custom).
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
exports.ApiProviderManagerPanel = void 0;
const vscode = __importStar(require("vscode"));
class ApiProviderManagerPanel {
    constructor(panel, extensionUri, apiProviderRegistry, apiKeyManager) {
        this._disposables = [];
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.apiProviderRegistry = apiProviderRegistry;
        this.apiKeyManager = apiKeyManager;
        this._update();
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'addProvider':
                    await this._addProvider(message.config);
                    return;
                case 'removeProvider':
                    await this._removeProvider(message.id);
                    return;
                case 'configureProvider':
                    await this._configureProvider(message.id, message.config);
                    return;
                case 'testProvider':
                    await this._testProvider(message.id);
                    return;
                case 'setApiKey':
                    await this._setApiKey(message.id, message.apiKey);
                    return;
            }
        }, null, this._disposables);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    static createOrShow(extensionUri, apiProviderRegistry, apiKeyManager) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (ApiProviderManagerPanel.currentPanel) {
            ApiProviderManagerPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('devForgeApiProviderManager', 'Dev Forge - API Provider Manager', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
        });
        ApiProviderManagerPanel.currentPanel = new ApiProviderManagerPanel(panel, extensionUri, apiProviderRegistry, apiKeyManager);
    }
    async _update() {
        const providers = this.apiProviderRegistry.getAllProviders();
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, providers);
    }
    async _addProvider(config) {
        try {
            await this.apiProviderRegistry.registerProvider(config, config.apiKey);
            vscode.window.showInformationMessage(`API provider added: ${config.name}`);
            await this._update();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to add provider: ${error.message}`);
        }
    }
    async _removeProvider(id) {
        try {
            await this.apiProviderRegistry.unregisterProvider(id);
            vscode.window.showInformationMessage(`API provider removed: ${id}`);
            await this._update();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to remove provider: ${error.message}`);
        }
    }
    async _configureProvider(id, config) {
        // TODO: Implement provider configuration
        vscode.window.showInformationMessage(`Configuring provider: ${id}`);
    }
    async _testProvider(id) {
        try {
            const isHealthy = await this.apiProviderRegistry.checkHealth(id);
            if (isHealthy) {
                vscode.window.showInformationMessage(`Provider ${id} is healthy`);
            }
            else {
                vscode.window.showWarningMessage(`Provider ${id} is not healthy`);
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to test provider: ${error.message}`);
        }
    }
    async _setApiKey(id, apiKey) {
        try {
            await this.apiKeyManager.storeApiKey(id, apiKey);
            vscode.window.showInformationMessage(`API key stored for ${id}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to store API key: ${error.message}`);
        }
    }
    _getHtmlForWebview(webview, providers) {
        const providersHtml = providers.map(provider => `
      <div class="provider-card" data-provider-id="${provider.id}">
        <div class="provider-header">
          <h3>${provider.name}</h3>
          <span class="type-badge type-${provider.type}">${provider.type}</span>
        </div>
        <div class="provider-info">
          <div class="info-item">
            <span class="label">Base URL:</span>
            <span class="value">${provider.baseUrl || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="label">Status:</span>
            <span class="value status-${provider.enabled ? 'enabled' : 'disabled'}">
              ${provider.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        <div class="provider-actions">
          <button class="btn-test" data-action="test" data-provider-id="${provider.id}">Test</button>
          <button class="btn-configure" data-action="configure" data-provider-id="${provider.id}">Configure</button>
          <button class="btn-remove" data-action="remove" data-provider-id="${provider.id}">Remove</button>
        </div>
      </div>
    `).join('');
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Forge - API Provider Manager</title>
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
    .add-provider-form {
      background: #252526;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 12px;
    }
    label {
      display: block;
      margin-bottom: 4px;
      color: #cccccc;
    }
    input, select {
      width: 100%;
      padding: 8px;
      background: #1e1e1e;
      border: 1px solid #3e3e42;
      color: #cccccc;
      border-radius: 4px;
    }
    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .provider-card {
      background: #252526;
      border: 1px solid #3e3e42;
      border-radius: 8px;
      padding: 16px;
    }
    .provider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .type-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .type-cursor { background: #4a9eff; }
    .type-openai { background: #50c878; }
    .type-anthropic { background: #ff6b6b; }
    .type-custom { background: #ffa500; }
    .status-enabled { color: #50c878; }
    .status-disabled { color: #d32f2f; }
    .provider-actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
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
    .btn-remove {
      background: #d32f2f;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>API Provider Manager</h1>
  </div>
  <div class="add-provider-form">
    <h3>Add API Provider</h3>
    <div class="form-group">
      <label>Type</label>
      <select id="providerType">
        <option value="cursor">Cursor</option>
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    <div class="form-group">
      <label>Name</label>
      <input type="text" id="providerName" placeholder="Provider name">
    </div>
    <div class="form-group">
      <label>Base URL</label>
      <input type="text" id="providerBaseUrl" placeholder="https://api.example.com">
    </div>
    <div class="form-group">
      <label>API Key</label>
      <input type="password" id="providerApiKey" placeholder="Enter API key">
    </div>
    <button onclick="addProvider()">Add Provider</button>
  </div>
  <div class="providers-grid" id="providersGrid">
    ${providersHtml || '<p>No API providers configured.</p>'}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    
    function addProvider() {
      const config = {
        id: document.getElementById('providerName').value.toLowerCase().replace(/\s+/g, '-'),
        name: document.getElementById('providerName').value,
        type: document.getElementById('providerType').value,
        baseUrl: document.getElementById('providerBaseUrl').value,
        apiKey: document.getElementById('providerApiKey').value,
        enabled: true
      };
      vscode.postMessage({ command: 'addProvider', config });
    }
    
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        const providerId = e.target.getAttribute('data-provider-id');
        vscode.postMessage({ command: action + 'Provider', id: providerId });
      });
    });
  </script>
</body>
</html>`;
    }
    dispose() {
        ApiProviderManagerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.ApiProviderManagerPanel = ApiProviderManagerPanel;
//# sourceMappingURL=apiProviderManager.js.map