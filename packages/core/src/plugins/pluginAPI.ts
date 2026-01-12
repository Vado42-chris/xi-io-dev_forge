/**
 * Plugin API
 * 
 * Framework-agnostic API surface exposed to plugins.
 */

import { ModelProvider } from '../types';
import { ApiProvider } from '../api/types';
import { DevForgePluginAPI, Command, WebviewConfig, TreeViewConfig, PluginPermissions, Webview, TreeView } from './types';
import { PermissionValidator } from './permissionValidator';
import { ModelProviderRegistry } from '../providers/modelProviderRegistry';
import { ApiProviderRegistry } from '../api/apiProviderRegistry';

/**
 * UI Adapter Interface
 * Allows framework-specific UI implementations
 */
export interface UIAdapter {
  createWebview(config: WebviewConfig): Webview;
  createTreeView(config: TreeViewConfig): TreeView;
}

/**
 * Config Adapter Interface
 * Allows framework-specific configuration access
 */
export interface ConfigAdapter {
  get<T>(key: string): T | undefined;
  update(key: string, value: any): Promise<void>;
}

export class PluginAPI implements DevForgePluginAPI {
  private permissionValidator: PermissionValidator;
  private modelProviderRegistry: ModelProviderRegistry;
  private apiProviderRegistry: ApiProviderRegistry;
  private permissions: PluginPermissions;
  private registeredCommands: Map<string, Command> = new Map();
  private webviews: Map<string, Webview> = new Map();
  private treeViews: Map<string, TreeView> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();
  private uiAdapter?: UIAdapter;
  private configAdapter?: ConfigAdapter;

  constructor(
    permissionValidator: PermissionValidator,
    modelProviderRegistry: ModelProviderRegistry,
    apiProviderRegistry: ApiProviderRegistry,
    permissions: PluginPermissions,
    uiAdapter?: UIAdapter,
    configAdapter?: ConfigAdapter
  ) {
    this.permissionValidator = permissionValidator;
    this.modelProviderRegistry = modelProviderRegistry;
    this.apiProviderRegistry = apiProviderRegistry;
    this.permissions = permissions;
    this.uiAdapter = uiAdapter;
    this.configAdapter = configAdapter;
  }

  /**
   * Model Management API
   */
  models = {
    registerProvider: (provider: ModelProvider) => {
      if (!this.permissionValidator.validate(this.permissions, 'model', provider.id)) {
        throw new Error(`Permission denied: Cannot register model provider ${provider.id}`);
      }
      this.modelProviderRegistry.registerProvider(provider);
    },

    getProvider: (id: string) => {
      return this.modelProviderRegistry.getProvider(id);
    },

    getAllProviders: () => {
      return this.modelProviderRegistry.getAllProviders();
    },

    execute: async (modelId: string, prompt: string) => {
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
  apis = {
    registerProvider: (provider: ApiProvider) => {
      if (!this.permissionValidator.validate(this.permissions, 'api', provider.id)) {
        throw new Error(`Permission denied: Cannot register API provider ${provider.id}`);
      }
      this.apiProviderRegistry.registerProvider({ id: provider.id, name: provider.name, type: provider.type, baseUrl: '', enabled: true }, provider.id);
    },

    getProvider: (id: string) => {
      return this.apiProviderRegistry.getProvider(id);
    },

    getAllProviders: () => {
      return this.apiProviderRegistry.getAllProviders();
    }
  };

  /**
   * Commands API
   */
  commands = {
    register: (command: Command) => {
      if (!this.permissionValidator.validate(this.permissions, 'command', command.id)) {
        throw new Error(`Permission denied: Cannot register command ${command.id}`);
      }
      this.registeredCommands.set(command.id, command);
    },

    execute: async (commandId: string, ...args: any[]) => {
      const command = this.registeredCommands.get(commandId);
      if (!command) {
        throw new Error(`Command not found: ${commandId}`);
      }
      return await command.handler(...args);
    }
  };

  /**
   * UI API (framework-agnostic)
   */
  ui = {
    createWebview: (config: WebviewConfig): Webview => {
      if (!this.uiAdapter) {
        throw new Error('UI adapter not configured. Cannot create webview.');
      }
      const webview = this.uiAdapter.createWebview(config);
      this.webviews.set(config.id, webview);
      return webview;
    },

    createTreeView: (config: TreeViewConfig): TreeView => {
      if (!this.uiAdapter) {
        throw new Error('UI adapter not configured. Cannot create tree view.');
      }
      const treeView = this.uiAdapter.createTreeView(config);
      this.treeViews.set(config.id, treeView);
      return treeView;
    }
  };

  /**
   * Configuration API
   */
  config = {
    get: <T>(key: string): T | undefined => {
      if (!this.configAdapter) {
        return undefined;
      }
      return this.configAdapter.get<T>(key);
    },

    update: async (key: string, value: any) => {
      if (!this.configAdapter) {
        throw new Error('Config adapter not configured. Cannot update configuration.');
      }
      await this.configAdapter.update(key, value);
    }
  };

  /**
   * Events API
   */
  events = {
    on: (event: string, handler: Function) => {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)!.push(handler);
    },

    emit: (event: string, data: any) => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`[PluginAPI] Error in event handler for ${event}:`, error);
          }
        });
      }
    }
  };

  /**
   * Logging API
   */
  logger = {
    debug: (message: string) => {
      console.debug(`[Plugin] ${message}`);
    },

    info: (message: string) => {
      console.info(`[Plugin] ${message}`);
    },

    warn: (message: string) => {
      console.warn(`[Plugin] ${message}`);
    },

    error: (message: string) => {
      console.error(`[Plugin] ${message}`);
    }
  };
}
