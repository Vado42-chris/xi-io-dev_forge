/**
 * Plugin Type Definitions
 * 
 * Framework-agnostic plugin system types.
 */

import { ModelProvider } from '../types';
import { ApiProvider } from '../api/types';

/**
 * Plugin Permissions
 */
export interface PluginPermissions {
  model?: string[];      // Allowed model IDs or ['*'] for all
  api?: string[];        // Allowed API provider IDs or ['*'] for all
  command?: string[];    // Allowed command IDs or ['*'] for all
  fileSystem?: string[]; // Allowed file paths (glob patterns)
  network?: boolean;     // Network access permission
}

/**
 * Plugin Manifest
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  permissions: PluginPermissions;
  entryPoint: string;
  dependencies?: Record<string, string>;
}

/**
 * Plugin Configuration
 */
export interface PluginConfig {
  enabled: boolean;
  permissions?: Partial<PluginPermissions>;
}

/**
 * Plugin Context
 */
export interface PluginContext {
  pluginId: string;
  pluginPath: string;
  api: DevForgePluginAPI;
  config: PluginConfig;
}

/**
 * Command Definition
 */
export interface Command {
  id: string;
  title: string;
  handler: (...args: any[]) => Promise<any> | any;
}

/**
 * Webview Configuration (framework-agnostic)
 */
export interface WebviewConfig {
  id: string;
  title: string;
  html?: string;
  onMessage?: (message: any) => void;
}

/**
 * Tree View Configuration (framework-agnostic)
 */
export interface TreeViewConfig {
  id: string;
  dataProvider: any; // Framework-specific data provider
}

/**
 * Webview Interface (framework-agnostic)
 */
export interface Webview {
  id: string;
  postMessage(message: any): void;
  onMessage(callback: (message: any) => void): void;
  dispose(): void;
}

/**
 * Tree View Interface (framework-agnostic)
 */
export interface TreeView {
  id: string;
  refresh(): void;
  dispose(): void;
}

/**
 * Dev Forge Plugin API
 * 
 * Framework-agnostic API exposed to plugins.
 */
export interface DevForgePluginAPI {
  // Model Management
  models: {
    registerProvider(provider: ModelProvider): void;
    getProvider(id: string): ModelProvider | undefined;
    getAllProviders(): ModelProvider[];
    execute(modelId: string, prompt: string): Promise<string>;
  };
  
  // API Management
  apis: {
    registerProvider(provider: ApiProvider): void;
    getProvider(id: string): ApiProvider | undefined;
    getAllProviders(): ApiProvider[];
  };
  
  // Commands
  commands: {
    register(command: Command): void;
    execute(commandId: string, ...args: any[]): Promise<any>;
  };
  
  // UI (framework-agnostic)
  ui: {
    createWebview(config: WebviewConfig): Webview;
    createTreeView(config: TreeViewConfig): TreeView;
  };
  
  // Configuration
  config: {
    get<T>(key: string): T | undefined;
    update(key: string, value: any): Promise<void>;
  };
  
  // Events
  events: {
    on(event: string, handler: Function): void;
    emit(event: string, data: any): void;
  };
  
  // Logging
  logger: {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  };
}

/**
 * Dev Forge Plugin
 */
export interface DevForgePlugin {
  id: string;
  name: string;
  version: string;
  api: DevForgePluginAPI;
  activate(context: PluginContext): Promise<void>;
  deactivate?(): Promise<void>;
}

/**
 * Plugin Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
