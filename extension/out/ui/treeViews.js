"use strict";
/**
 * Tree Views
 *
 * Tree views for models, agents, and plugins in the sidebar.
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
exports.PluginsTreeDataProvider = exports.ModelsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class ModelsTreeDataProvider {
    constructor(modelProviderRegistry) {
        this.modelProviderRegistry = modelProviderRegistry;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            // Root level: show providers
            const providers = this.modelProviderRegistry.getAllProviders();
            return providers.map(provider => new ModelTreeItem(provider.name, vscode.TreeItemCollapsibleState.Collapsed, provider.id, 'provider'));
        }
        if (element.type === 'provider') {
            // Provider level: show models
            const provider = this.modelProviderRegistry.getProvider(element.id);
            if (provider) {
                const models = await provider.listModels();
                return models.map(model => new ModelTreeItem(model.name, vscode.TreeItemCollapsibleState.None, model.id, 'model', {
                    command: 'devForge.models.select',
                    title: 'Select Model',
                    arguments: [model.id]
                }));
            }
        }
        return [];
    }
}
exports.ModelsTreeDataProvider = ModelsTreeDataProvider;
class ModelTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, id, type, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.id = id;
        this.type = type;
        this.command = command;
        this.iconPath = {
            light: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'),
            dark: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>')
        };
        this.tooltip = `${this.label} (${this.type})`;
        this.contextValue = type;
    }
}
class PluginsTreeDataProvider {
    constructor(pluginManager) {
        this.pluginManager = pluginManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        const plugins = this.pluginManager.getAllPlugins();
        return plugins.map(plugin => new PluginTreeItem(plugin.name, vscode.TreeItemCollapsibleState.None, plugin.id, {
            command: 'devForge.plugins.manage',
            title: 'Manage Plugin',
            arguments: [plugin.id]
        }));
    }
}
exports.PluginsTreeDataProvider = PluginsTreeDataProvider;
class PluginTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, id, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.id = id;
        this.command = command;
        this.iconPath = {
            light: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'),
            dark: vscode.Uri.parse('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>')
        };
        this.tooltip = `${this.label} (plugin)`;
        this.contextValue = 'plugin';
    }
}
//# sourceMappingURL=treeViews.js.map