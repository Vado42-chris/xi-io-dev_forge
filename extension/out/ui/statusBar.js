"use strict";
/**
 * Status Bar Items
 *
 * Status bar indicators for Dev Forge (model status, provider status, etc.)
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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
class StatusBarManager {
    constructor() {
        // Model status
        this.modelStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.modelStatusItem.command = 'devForge.models.select';
        this.modelStatusItem.tooltip = 'Click to select model';
        // Provider status
        this.providerStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        this.providerStatusItem.command = 'devForge.apiProviders.configure';
        this.providerStatusItem.tooltip = 'Click to configure API providers';
        // Plugin status
        this.pluginStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
        this.pluginStatusItem.command = 'devForge.plugins.manage';
        this.pluginStatusItem.tooltip = 'Click to manage plugins';
    }
    /**
     * Update model status
     */
    updateModelStatus(modelName, provider) {
        if (modelName && provider) {
            this.modelStatusItem.text = `$(circuit-board) ${modelName} (${provider})`;
            this.modelStatusItem.show();
        }
        else {
            this.modelStatusItem.hide();
        }
    }
    /**
     * Update provider status
     */
    updateProviderStatus(count) {
        if (count > 0) {
            this.providerStatusItem.text = `$(plug) ${count} API Provider${count > 1 ? 's' : ''}`;
            this.providerStatusItem.show();
        }
        else {
            this.providerStatusItem.hide();
        }
    }
    /**
     * Update plugin status
     */
    updatePluginStatus(count) {
        if (count > 0) {
            this.pluginStatusItem.text = `$(extensions) ${count} Plugin${count > 1 ? 's' : ''}`;
            this.pluginStatusItem.show();
        }
        else {
            this.pluginStatusItem.hide();
        }
    }
    /**
     * Dispose status bar items
     */
    dispose() {
        this.modelStatusItem.dispose();
        this.providerStatusItem.dispose();
        this.pluginStatusItem.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBar.js.map