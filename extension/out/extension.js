"use strict";
/**
 * Dev Forge Extension - Entry Point
 *
 * Multiagent coding engine with extensible model providers,
 * GGUF support, and custom API integration.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const configurationManager_1 = require("./services/configurationManager");
const modelSelector_1 = require("./ui/modelSelector");
const ggufBrowser_1 = require("./ui/ggufBrowser");
const apiProviderManager_1 = require("./ui/apiProviderManager");
const pluginManager_1 = require("./ui/pluginManager");
const treeViews_1 = require("./ui/treeViews");
const statusBar_1 = require("./ui/statusBar");
// Import services (using relative paths from extension/src to src/services)
// Note: These will be resolved at runtime from the extension's location
const modelProviderRegistry_1 = require("../../../src/services/providers/modelProviderRegistry");
const ollamaProvider_1 = require("../../../src/services/providers/ollamaProvider");
const ggufProvider_1 = require("../../../src/services/providers/ggufProvider");
const apiProviderRegistry_1 = require("../../../src/services/api/apiProviderRegistry");
const apiKeyManager_1 = require("../../../src/services/api/apiKeyManager");
const pluginManager_2 = require("../../../src/services/plugins/pluginManager");
let configManager;
let statusBarManager;
let modelProviderRegistry;
let apiProviderRegistry;
let apiKeyManager;
let pluginManager;
let modelsTreeProvider;
let pluginsTreeProvider;
/**
 * Extension activation
 */
async function activate(context) {
    console.log('Dev Forge extension is now active!');
    // Initialize configuration manager
    configManager = new configurationManager_1.ConfigurationManager(context);
    await configManager.initialize();
    // Initialize API key manager
    apiKeyManager = new apiKeyManager_1.ApiKeyManager(context.secrets);
    // Initialize provider registries
    modelProviderRegistry = new modelProviderRegistry_1.ModelProviderRegistry();
    apiProviderRegistry = new apiProviderRegistry_1.ApiProviderRegistry(apiKeyManager);
    // Initialize and register providers based on settings
    await initializeProviders();
    // Initialize plugin manager
    // Note: PluginManager constructor needs ExtensionContext, but we'll create a minimal one
    // For now, we'll pass the context and let PluginManager handle it
    pluginManager = new pluginManager_2.PluginManager(context, modelProviderRegistry, apiProviderRegistry);
    // Initialize tree views
    modelsTreeProvider = new treeViews_1.ModelsTreeDataProvider(modelProviderRegistry);
    pluginsTreeProvider = new treeViews_1.PluginsTreeDataProvider(pluginManager);
    // Register tree views
    context.subscriptions.push(vscode.window.createTreeView('devForgeModels', {
        treeDataProvider: modelsTreeProvider
    }), vscode.window.createTreeView('devForgePlugins', {
        treeDataProvider: pluginsTreeProvider
    }));
    // Initialize status bar
    statusBarManager = new statusBar_1.StatusBarManager();
    updateStatusBar();
    // Register commands
    registerCommands(context);
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('devForge')) {
            configManager?.reload();
            updateStatusBar();
            modelsTreeProvider?.refresh();
            pluginsTreeProvider?.refresh();
            vscode.window.showInformationMessage('Dev Forge configuration updated');
        }
    });
    // Show welcome message
    const enabled = configManager.getSetting('models.enabled', true);
    if (enabled) {
        vscode.window.showInformationMessage('Dev Forge: Model system enabled');
    }
}
/**
 * Initialize model and API providers based on settings
 */
async function initializeProviders() {
    if (!configManager || !modelProviderRegistry || !apiProviderRegistry) {
        return;
    }
    // Initialize Ollama provider if enabled
    const ollamaEnabled = configManager.getSetting('models.ollama.enabled', true);
    if (ollamaEnabled) {
        const ollamaBaseUrl = configManager.getSetting('models.ollama.baseUrl', 'http://localhost:11434');
        const ollamaProvider = new ollamaProvider_1.OllamaProvider({ baseUrl: ollamaBaseUrl });
        await modelProviderRegistry.registerProvider(ollamaProvider);
    }
    // Initialize GGUF provider if enabled
    const ggufEnabled = configManager.getSetting('models.gguf.enabled', false);
    if (ggufEnabled) {
        const ggufDirectory = configManager.getSetting('models.gguf.modelsDirectory', '~/.dev-forge/models/gguf');
        const maxMemory = configManager.getSetting('models.gguf.maxMemory', 4096);
        const ggufProvider = new ggufProvider_1.GGUFProvider({
            modelsDirectory: ggufDirectory.replace(/^~/, process.env.HOME || ''),
            maxMemory
        });
        await modelProviderRegistry.registerProvider(ggufProvider);
    }
    // Load plugins if enabled
    const pluginsEnabled = configManager.getSetting('plugins.enabled', true);
    const autoLoad = configManager.getSetting('plugins.autoLoad', true);
    if (pluginsEnabled && autoLoad && pluginManager) {
        await pluginManager.discoverPlugins();
        await pluginManager.loadAllPlugins();
    }
}
/**
 * Update status bar with current state
 */
function updateStatusBar() {
    if (!statusBarManager || !modelProviderRegistry || !apiProviderRegistry || !pluginManager) {
        return;
    }
    // Update model status
    const models = modelProviderRegistry.listAllModels();
    if (models.length > 0) {
        const firstModel = models[0];
        statusBarManager.updateModelStatus(firstModel.name, firstModel.provider);
    }
    // Update provider status
    const providers = apiProviderRegistry.getAllProviders();
    statusBarManager.updateProviderStatus(providers.length);
    // Update plugin status
    const plugins = pluginManager.getAllPlugins();
    statusBarManager.updatePluginStatus(plugins.length);
}
/**
 * Extension deactivation
 */
async function deactivate() {
    configManager?.dispose();
    configManager = undefined;
    statusBarManager?.dispose();
    statusBarManager = undefined;
    // ModelProviderRegistry doesn't have dispose, but providers do
    if (modelProviderRegistry) {
        const providers = modelProviderRegistry.getAllProviders();
        for (const provider of providers) {
            if (provider.dispose) {
                await provider.dispose();
            }
        }
    }
    modelProviderRegistry = undefined;
    apiProviderRegistry = undefined;
    apiKeyManager = undefined;
    pluginManager = undefined;
    modelsTreeProvider = undefined;
    pluginsTreeProvider = undefined;
}
/**
 * Register extension commands
 */
function registerCommands(context) {
    // Settings command
    const settingsCommand = vscode.commands.registerCommand('devForge.settings.open', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:xibalba.dev-forge');
    });
    // Model commands
    const selectModelCommand = vscode.commands.registerCommand('devForge.models.select', async () => {
        if (modelProviderRegistry) {
            modelSelector_1.ModelSelectorPanel.createOrShow(context.extensionUri, modelProviderRegistry);
        }
        else {
            vscode.window.showErrorMessage('Model provider registry not initialized');
        }
    });
    const loadModelCommand = vscode.commands.registerCommand('devForge.models.load', async () => {
        // TODO: Implement model loading
        vscode.window.showInformationMessage('Model loading (coming soon)');
    });
    const unloadModelCommand = vscode.commands.registerCommand('devForge.models.unload', async () => {
        // TODO: Implement model unloading
        vscode.window.showInformationMessage('Model unloading (coming soon)');
    });
    // GGUF commands
    const scanGGUFCommand = vscode.commands.registerCommand('devForge.gguf.scan', async () => {
        if (modelProviderRegistry) {
            const ggufProvider = modelProviderRegistry.getProvider('gguf');
            if (ggufProvider) {
                ggufBrowser_1.GGUFBrowserPanel.createOrShow(context.extensionUri, ggufProvider);
            }
            else {
                vscode.window.showWarningMessage('GGUF provider not enabled. Enable it in settings first.');
            }
        }
        else {
            vscode.window.showErrorMessage('Model provider registry not initialized');
        }
    });
    // API provider commands
    const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
        if (apiProviderRegistry && apiKeyManager) {
            apiProviderManager_1.ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
        }
        else {
            vscode.window.showErrorMessage('API provider registry not initialized');
        }
    });
    const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
        if (apiProviderRegistry && apiKeyManager) {
            apiProviderManager_1.ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
        }
        else {
            vscode.window.showErrorMessage('API provider registry not initialized');
        }
    });
    // Plugin commands
    const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
        if (pluginManager) {
            pluginManager_1.PluginManagerPanel.createOrShow(context.extensionUri, pluginManager);
        }
        else {
            vscode.window.showErrorMessage('Plugin manager not initialized');
        }
    });
    const installPluginCommand = vscode.commands.registerCommand('devForge.plugins.install', async () => {
        // TODO: Implement plugin installation
        vscode.window.showInformationMessage('Plugin installation (coming soon)');
    });
    // Execution commands
    const parallelExecuteCommand = vscode.commands.registerCommand('devForge.execute.parallel', async () => {
        // TODO: Implement parallel execution
        vscode.window.showInformationMessage('Parallel execution (coming soon)');
    });
    const selectedExecuteCommand = vscode.commands.registerCommand('devForge.execute.selected', async () => {
        // TODO: Implement selected execution
        vscode.window.showInformationMessage('Selected execution (coming soon)');
    });
    // Chat command
    const openChatCommand = vscode.commands.registerCommand('devForge.chat.open', async () => {
        // TODO: Implement chat interface
        vscode.window.showInformationMessage('Chat interface (coming soon)');
    });
    // Add all commands to context
    context.subscriptions.push(settingsCommand, selectModelCommand, loadModelCommand, unloadModelCommand, scanGGUFCommand, addApiProviderCommand, configureApiProviderCommand, managePluginsCommand, installPluginCommand, parallelExecuteCommand, selectedExecuteCommand, openChatCommand);
}
//# sourceMappingURL=extension.js.map