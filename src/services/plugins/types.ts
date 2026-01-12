/**
 * Plugin System Type Definitions
 * 
 * Defines interfaces for plugins, permissions, and plugin API.
 */

import * as vscode from 'vscode';
import { ModelProvider } from '../types';
import { ApiProvider } from '../api/types';

/**
 * Plugin Permissions
 */
export interface PluginPermissions {
  // File System
  readFiles?: string[];        // Allowed file paths (glob patterns)
  writeFiles?: string[];       // Allowed file paths (glob patterns)
  executeFiles?: string[];     // Allowed executable paths
  
  // Network
  networkAccess?: boolean;      // Allow network access
  allowedDomains?: string[];    // Allowed domains
  
  // System
  systemCommands?: boolean;     // Allow system commands
  environmentVariables?: string[]; // Allowed env vars
  
  // Dev Forge
  modelAccess?: string[];       // Allowed model IDs
  apiAccess?: string[];         // Allowed API provider IDs
  commandExecution?: boolean;   // Allow command execution
}

/**
 * Plugin Manifest
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  author?: string;
  description?: string;
  license?: string;
  main: string;
  permissions?: PluginPermissions;
  contributes?: {
    commands?: Array<{
      command: string;
      title: string;
    }>;
    webviews?: Array<{
      id: string;
      title: string;
    }>;
    treeViews?: Array<{
      id: string;
      title: string;
    }>;
  };
}

/**
 * Plugin Context
 */
export interface PluginContext {
  // VS Code API
  vscode: typeof vscode;
  
  // Dev Forge API
  devForge: DevForgePluginAPI;
  
  // Plugin Info
  pluginPath: string;
  pluginConfig: PluginConfig;
}

/**
 * Plugin Configuration
 */
export interface PluginConfig {
  id: string;
  enabled: boolean;
  permissions?: PluginPermissions;
  [key: string]: any;
}

/**
 * Dev Forge Plugin API
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
  
  // UI
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
 * Plugin Interface
 */
export interface DevForgePlugin {
  // Metadata
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  author?: string;
  description?: string;
  license?: string;
  
  // Manifest
  manifest: PluginManifest;
  
  // Lifecycle
  activate(context: PluginContext): Promise<void>;
  deactivate?(): Promise<void>;
  
  // Model Provider Registration
  registerModelProvider?(provider: ModelProvider): void;
  
  // API Provider Registration
  registerApiProvider?(provider: ApiProvider): void;
  
  // Command Registration
  registerCommands?(commands: Command[]): void;
  
  // UI Registration
  registerWebviews?(webviews: WebviewConfig[]): void;
  registerTreeViews?(treeViews: TreeViewConfig[]): void;
  
  // Event Handlers
  onModelExecution?(event: any): void;
  onTaskComplete?(event: any): void;
}

/**
 * Command Interface
 */
export interface Command {
  id: string;
  title: string;
  handler: (...args: any[]) => Promise<any> | any;
}

/**
 * Webview Configuration
 */
export interface WebviewConfig {
  id: string;
  title: string;
  html?: string;
  script?: string;
}

/**
 * Tree View Configuration
 */
export interface TreeViewConfig {
  id: string;
  title: string;
  dataProvider: any;
}

/**
 * Webview Interface
 */
export interface Webview {
  id: string;
  postMessage(message: any): void;
  dispose(): void;
}

/**
 * Tree View Interface
 */
export interface TreeView {
  id: string;
  refresh(): void;
  dispose(): void;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

