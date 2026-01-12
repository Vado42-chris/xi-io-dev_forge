/**
 * Plugin Manager
 * 
 * Manages plugin lifecycle, discovery, loading, and execution.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DevForgePlugin, PluginContext, PluginConfig, PluginManifest, ValidationResult } from './types';
import { PluginDiscovery } from './pluginDiscovery';
import { PluginSandbox } from './pluginSandbox';
import { PermissionValidator } from './permissionValidator';
import { PluginAPI } from './pluginAPI';
import { ModelProviderRegistry } from '../providers/modelProviderRegistry';
import { ApiProviderRegistry } from '../api/apiProviderRegistry';

/**
 * Configuration Interface for PluginManager
 */
export interface PluginManagerConfig {
  pluginDirectory: string;
  autoLoad?: boolean;
}

export class PluginManager {
  private plugins: Map<string, DevForgePlugin> = new Map();
  private sandbox: PluginSandbox;
  private discovery: PluginDiscovery;
  private validator: PermissionValidator;
  private modelProviderRegistry: ModelProviderRegistry;
  private apiProviderRegistry: ApiProviderRegistry;
  private pluginDirectory: string;
  private config: PluginManagerConfig;

  constructor(
    config: PluginManagerConfig,
    modelProviderRegistry: ModelProviderRegistry,
    apiProviderRegistry: ApiProviderRegistry
  ) {
    this.config = config;
    this.modelProviderRegistry = modelProviderRegistry;
    this.apiProviderRegistry = apiProviderRegistry;
    this.sandbox = new PluginSandbox();
    this.discovery = new PluginDiscovery();
    this.validator = new PermissionValidator();
    
    // Get plugin directory from config
    this.pluginDirectory = this.expandPath(
      config.pluginDirectory || '~/.dev-forge/plugins'
    );
  }

  /**
   * Expand ~ to home directory
   */
  private expandPath(filePath: string): string {
    if (filePath.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      return path.join(homeDir, filePath.slice(1));
    }
    return filePath;
  }

  /**
   * Initialize plugin manager
   */
  async initialize(): Promise<void> {
    // Ensure plugin directory exists
    if (!fs.existsSync(this.pluginDirectory)) {
      await fs.promises.mkdir(this.pluginDirectory, { recursive: true });
    }

    // Discover plugins
    const discoveredPlugins = await this.discovery.discoverPlugins(this.pluginDirectory);
    
    // Load enabled plugins
    const config = vscode.workspace.getConfiguration('devForge');
    const autoLoad = config.get<boolean>('plugins.autoLoad', true);
    
    if (autoLoad) {
      for (const manifest of discoveredPlugins) {
        const pluginConfig = this.getPluginConfig(manifest.id);
        if (pluginConfig.enabled) {
          try {
            await this.loadPlugin(manifest, pluginConfig);
          } catch (error: any) {
            console.error(`[PluginManager] Failed to load plugin ${manifest.id}:`, error.message);
          }
        }
      }
    }

    console.log(`[PluginManager] Initialized with ${this.plugins.size} plugins`);
  }

  /**
   * Get plugin configuration
   */
  private getPluginConfig(pluginId: string): PluginConfig {
    const config = vscode.workspace.getConfiguration('devForge');
    const plugins = config.get<any[]>('plugins.plugins', []);
    const pluginConfig = plugins.find((p: any) => p.id === pluginId);
    
    return {
      id: pluginId,
      enabled: pluginConfig?.enabled !== false,
      permissions: pluginConfig?.permissions
    };
  }

  /**
   * Load a plugin
   */
  async loadPlugin(manifest: PluginManifest, pluginConfig: PluginConfig): Promise<void> {
    // Validate plugin
    const validation = await this.validatePlugin(manifest);
    if (!validation.isValid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }

    // Get plugin path
    const pluginPath = path.join(this.pluginDirectory, manifest.id);

    // Load plugin in sandbox
    const plugin = await this.sandbox.loadPlugin(pluginPath, pluginConfig);

    // Create plugin context
    const pluginContext = this.createPluginContext(plugin, pluginPath, pluginConfig);

    // Activate plugin
    await plugin.activate(pluginContext);
    
    this.plugins.set(manifest.id, plugin);
    console.log(`[PluginManager] Loaded plugin: ${manifest.name} (${manifest.id})`);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      return;
    }

    // Deactivate plugin
    if (plugin.deactivate) {
      try {
        await plugin.deactivate();
      } catch (error: any) {
        console.error(`[PluginManager] Error deactivating plugin ${id}:`, error.message);
      }
    }

    // Unload from sandbox
    await this.sandbox.unloadPlugin(id);
    
    this.plugins.delete(id);
    console.log(`[PluginManager] Unloaded plugin: ${id}`);
  }

  /**
   * Validate plugin
   */
  async validatePlugin(manifest: PluginManifest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate manifest structure
    if (!manifest.id) errors.push('Missing id');
    if (!manifest.name) errors.push('Missing name');
    if (!manifest.version) errors.push('Missing version');
    if (!manifest.apiVersion) errors.push('Missing apiVersion');
    if (!manifest.main) errors.push('Missing main');

    // Validate API version compatibility
    const currentApiVersion = '1.0.0';
    if (manifest.apiVersion !== currentApiVersion) {
      warnings.push(`API version mismatch: plugin uses ${manifest.apiVersion}, current is ${currentApiVersion}`);
    }

    // Validate plugin file exists
    const pluginPath = path.join(this.pluginDirectory, manifest.id);
    const mainFile = path.join(pluginPath, manifest.main);
    if (!fs.existsSync(mainFile)) {
      errors.push(`Plugin main file not found: ${mainFile}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create plugin context
   */
  private createPluginContext(
    plugin: DevForgePlugin,
    pluginPath: string,
    pluginConfig: PluginConfig
  ): PluginContext {
    const permissionValidator = new PermissionValidator();
    const pluginAPI = new PluginAPI(
      vscode,
      permissionValidator,
      this.modelProviderRegistry,
      this.apiProviderRegistry,
      pluginConfig.permissions || {}
    );

    return {
      vscode,
      devForge: pluginAPI,
      pluginPath,
      pluginConfig
    };
  }

  /**
   * Get plugin by ID
   */
  getPlugin(id: string): DevForgePlugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all plugins
   */
  getAllPlugins(): DevForgePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): DevForgePlugin[] {
    return this.getAllPlugins().filter(p => {
      const config = this.getPluginConfig(p.id);
      return config.enabled;
    });
  }

  /**
   * Dispose all plugins
   */
  async dispose(): Promise<void> {
    for (const plugin of this.getAllPlugins()) {
      await this.unloadPlugin(plugin.id);
    }
    this.plugins.clear();
  }
}

