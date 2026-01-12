"use strict";
/**
 * Plugin API
 *
 * API surface exposed to plugins.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginAPI = void 0;
class PluginAPI {
    constructor(vscodeAPI, permissionValidator, modelProviderRegistry, apiProviderRegistry, permissions) {
        this.registeredCommands = new Map();
        this.webviews = new Map();
        this.treeViews = new Map();
        this.eventHandlers = new Map();
        /**
         * Model Management API
         */
        this.models = {
            registerProvider: (provider) => {
                if (!this.permissionValidator.validate(this.permissions, 'model', provider.id)) {
                    throw new Error(`Permission denied: Cannot register model provider ${provider.id}`);
                }
                this.modelProviderRegistry.registerProvider(provider);
            },
            getProvider: (id) => {
                return this.modelProviderRegistry.getProvider(id);
            },
            getAllProviders: () => {
                return this.modelProviderRegistry.getAllProviders();
            },
            execute: async (modelId, prompt) => {
                if (!this.permissionValidator.validate(this.permissions, 'model', modelId)) {
                    throw new Error(`Permission denied: Cannot access model ${modelId}`);
                }
                const response = await this.modelProviderRegistry.generate(modelId, {
                    prompt,
                    modelId
                });
                return response.response;
            }
        };
        /**
         * API Management API
         */
        this.apis = {
            registerProvider: (provider) => {
                if (!this.permissionValidator.validate(this.permissions, 'api', provider.id)) {
                    throw new Error(`Permission denied: Cannot register API provider ${provider.id}`);
                }
                // Note: ApiProviderRegistry registration would go here
                // For now, we'll log it
                console.log(`[PluginAPI] Registering API provider: ${provider.id}`);
            },
            getProvider: (id) => {
                return this.apiProviderRegistry.getProvider(id);
            },
            getAllProviders: () => {
                return this.apiProviderRegistry.getAllProviders();
            }
        };
        /**
         * Commands API
         */
        this.commands = {
            register: (command) => {
                if (!this.permissionValidator.validate(this.permissions, 'command', command.id)) {
                    throw new Error(`Permission denied: Cannot register command ${command.id}`);
                }
                this.registeredCommands.set(command.id, command);
                // Register with VS Code
                this.vscodeAPI.commands.registerCommand(command.id, command.handler);
            },
            execute: async (commandId, ...args) => {
                const command = this.registeredCommands.get(commandId);
                if (!command) {
                    throw new Error(`Command not found: ${commandId}`);
                }
                return await command.handler(...args);
            }
        };
        /**
         * UI API
         */
        this.ui = {
            createWebview: (config) => {
                const panel = this.vscodeAPI.window.createWebviewPanel(config.id, config.title, this.vscodeAPI.ViewColumn.One, {
                    enableScripts: true
                });
                if (config.html) {
                    panel.webview.html = config.html;
                }
                this.webviews.set(config.id, panel);
                return panel;
            },
            createTreeView: (config) => {
                const treeView = this.vscodeAPI.window.createTreeView(config.id, {
                    treeDataProvider: config.dataProvider
                });
                this.treeViews.set(config.id, treeView);
                return treeView;
            }
        };
        /**
         * Configuration API
         */
        this.config = {
            get: (key) => {
                const config = this.vscodeAPI.workspace.getConfiguration('devForge');
                return config.get(key);
            },
            update: async (key, value) => {
                const config = this.vscodeAPI.workspace.getConfiguration('devForge');
                await config.update(key, value, this.vscodeAPI.ConfigurationTarget.Global);
            }
        };
        /**
         * Events API
         */
        this.events = {
            on: (event, handler) => {
                if (!this.eventHandlers.has(event)) {
                    this.eventHandlers.set(event, []);
                }
                this.eventHandlers.get(event).push(handler);
            },
            emit: (event, data) => {
                const handlers = this.eventHandlers.get(event);
                if (handlers) {
                    handlers.forEach(handler => {
                        try {
                            handler(data);
                        }
                        catch (error) {
                            console.error(`[PluginAPI] Error in event handler for ${event}:`, error);
                        }
                    });
                }
            }
        };
        /**
         * Logging API
         */
        this.logger = {
            debug: (message) => {
                console.debug(`[Plugin] ${message}`);
            },
            info: (message) => {
                console.info(`[Plugin] ${message}`);
            },
            warn: (message) => {
                console.warn(`[Plugin] ${message}`);
            },
            error: (message) => {
                console.error(`[Plugin] ${message}`);
            }
        };
        this.vscodeAPI = vscodeAPI;
        this.permissionValidator = permissionValidator;
        this.modelProviderRegistry = modelProviderRegistry;
        this.apiProviderRegistry = apiProviderRegistry;
        this.permissions = permissions;
    }
}
exports.PluginAPI = PluginAPI;
//# sourceMappingURL=pluginAPI.js.map