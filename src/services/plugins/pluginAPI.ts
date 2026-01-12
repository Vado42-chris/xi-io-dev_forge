/**
 * Plugin API
 * 
 * API surface exposed to plugins.
 */

import * as vscode from 'vscode';
import { ModelProvider } from '../types';
import { ApiProvider } from '../api/types';
import { DevForgePluginAPI, Command, WebviewConfig, TreeViewConfig, PluginPermissions } from './types';
import { PermissionValidator } from './permissionValidator';
import { ModelProviderRegistry } from '../providers/modelProviderRegistry';
import { ApiProviderRegistry } from '../api/apiProviderRegistry';

export class PluginAPI implements DevForgePluginAPI {
  private vscodeAPI: typeof vscode;
  private permissionValidator: PermissionValidator;
  private modelProviderRegistry: ModelProviderRegistry;
  private apiProviderRegistry: ApiProviderRegistry;
  private permissions: PluginPermissions;
  private registeredCommands: Map<string, Command> = new Map();
  private webviews: Map<string, any> = new Map();
  private treeViews: Map<string, any> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(
    vscodeAPI: typeof vscode,
    permissionValidator: PermissionValidator,
    modelProviderRegistry: ModelProviderRegistry,
    apiProviderRegistry: ApiProviderRegistry,
    permissions: PluginPermissions
  ) {
    this.vscodeAPI = vscodeAPI;
    this.permissionValidator = permissionValidator;
    this.modelProviderRegistry = modelProviderRegistry;
    this.apiProviderRegistry = apiProviderRegistry;
    this.permissions = permissions;
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
      // Note: ApiProviderRegistry registration would go here
      // For now, we'll log it
      console.log(`[PluginAPI] Registering API provider: ${provider.id}`);
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
      
      // Register with VS Code
      this.vscodeAPI.commands.registerCommand(command.id, command.handler);
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
   * UI API
   */
  ui = {
    createWebview: (config: WebviewConfig) => {
      const panel = this.vscodeAPI.window.createWebviewPanel(
        config.id,
        config.title,
        this.vscodeAPI.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      if (config.html) {
        panel.webview.html = config.html;
      }

      this.webviews.set(config.id, panel);
      return panel;
    },

    createTreeView: (config: TreeViewConfig) => {
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
  config = {
    get: <T>(key: string): T | undefined => {
      const config = this.vscodeAPI.workspace.getConfiguration('devForge');
      return config.get<T>(key);
    },

    update: async (key: string, value: any) => {
      const config = this.vscodeAPI.workspace.getConfiguration('devForge');
      await config.update(key, value, this.vscodeAPI.ConfigurationTarget.Global);
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

