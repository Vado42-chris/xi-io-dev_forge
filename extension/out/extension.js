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
let configManager;
/**
 * Extension activation
 */
async function activate(context) {
    console.log('Dev Forge extension is now active!');
    // Initialize configuration manager
    configManager = new configurationManager_1.ConfigurationManager(context);
    await configManager.initialize();
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
        // TODO: Implement model selector
        vscode.window.showInformationMessage('Model selector (coming soon)');
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
        // TODO: Implement GGUF scanning
        vscode.window.showInformationMessage('GGUF scanning (coming soon)');
    });
    // API provider commands
    const addApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.add', async () => {
        // TODO: Implement API provider addition
        vscode.window.showInformationMessage('Add API provider (coming soon)');
    });
    const configureApiProviderCommand = vscode.commands.registerCommand('devForge.apiProviders.configure', async () => {
        // TODO: Implement API provider configuration
        vscode.window.showInformationMessage('Configure API provider (coming soon)');
    });
    // Plugin commands
    const managePluginsCommand = vscode.commands.registerCommand('devForge.plugins.manage', async () => {
        // TODO: Implement plugin management
        vscode.window.showInformationMessage('Plugin management (coming soon)');
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