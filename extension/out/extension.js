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
const statusBar_1 = require("./ui/statusBar");
let configManager;
let statusBarManager;
/**
 * Extension activation
 */
async function activate(context) {
    console.log('Dev Forge extension is now active!');
    // Initialize configuration manager
    configManager = new configurationManager_1.ConfigurationManager(context);
    await configManager.initialize();
    // Initialize status bar
    statusBarManager = new statusBar_1.StatusBarManager();
    statusBarManager.updateModelStatus(null, null);
    statusBarManager.updateProviderStatus(0);
    statusBarManager.updatePluginStatus(0);
    // Register commands
    registerCommands(context);
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('devForge')) {
            configManager?.reload();
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
 * Extension deactivation
 */
function deactivate() {
    configManager?.dispose();
    configManager = undefined;
    statusBarManager?.dispose();
    statusBarManager = undefined;
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
        // TODO: Get modelProviderRegistry from extension context
        // ModelSelectorPanel.createOrShow(context.extensionUri, modelProviderRegistry);
        vscode.window.showInformationMessage('Model selector (coming soon - needs ModelProviderRegistry)');
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
        // TODO: Get ggufProvider from extension context
        // GGUFBrowserPanel.createOrShow(context.extensionUri, ggufProvider);
        vscode.window.showInformationMessage('GGUF browser (coming soon - needs GGUFProvider)');
    });
    // API provider commands
    const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
        // TODO: Get apiProviderRegistry and apiKeyManager from extension context
        // ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
        vscode.window.showInformationMessage('API provider manager (coming soon - needs ApiProviderRegistry)');
    });
    const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
        // TODO: Get apiProviderRegistry and apiKeyManager from extension context
        // ApiProviderManagerPanel.createOrShow(context.extensionUri, apiProviderRegistry, apiKeyManager);
        vscode.window.showInformationMessage('API provider manager (coming soon - needs ApiProviderRegistry)');
    });
    // Plugin commands
    const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
        // TODO: Get pluginManager from extension context
        // PluginManagerPanel.createOrShow(context.extensionUri, pluginManager);
        vscode.window.showInformationMessage('Plugin manager (coming soon - needs PluginManager)');
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