/**
 * Plugin Discovery
 * 
 * Discovers and loads plugins from the plugin directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PluginManifest, DevForgePlugin } from './types';

export class PluginDiscovery {
  /**
   * Discover plugins in directory
   */
  async discoverPlugins(directory: string): Promise<PluginManifest[]> {
    const plugins: PluginManifest[] = [];
    
    try {
      // Check if directory exists
      if (!fs.existsSync(directory)) {
        console.warn(`[PluginDiscovery] Directory does not exist: ${directory}`);
        return [];
      }

      // Read directory
      const entries = await fs.promises.readdir(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(directory, entry.name);
          const manifest = await this.loadPluginManifest(pluginPath);
          if (manifest) {
            plugins.push(manifest);
          }
        }
      }
    } catch (error: any) {
      console.error(`[PluginDiscovery] Error discovering plugins: ${error.message}`);
    }

    return plugins;
  }

  /**
   * Load plugin manifest
   */
  private async loadPluginManifest(pluginPath: string): Promise<PluginManifest | null> {
    const manifestPath = path.join(pluginPath, 'plugin.json');
    
    try {
      if (!fs.existsSync(manifestPath)) {
        console.warn(`[PluginDiscovery] No plugin.json found in: ${pluginPath}`);
        return null;
      }

      const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;
      
      // Validate manifest
      const validation = this.validateManifest(manifest);
      if (!validation.isValid) {
        console.error(`[PluginDiscovery] Invalid manifest in ${pluginPath}:`, validation.errors);
        return null;
      }

      return manifest;
    } catch (error: any) {
      console.error(`[PluginDiscovery] Error loading manifest from ${pluginPath}:`, error.message);
      return null;
    }
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.id || typeof manifest.id !== 'string') {
      errors.push('Missing or invalid "id" field');
    }

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Missing or invalid "name" field');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Missing or invalid "version" field');
    }

    if (!manifest.apiVersion || typeof manifest.apiVersion !== 'string') {
      errors.push('Missing or invalid "apiVersion" field');
    }

    if (!manifest.main || typeof manifest.main !== 'string') {
      errors.push('Missing or invalid "main" field');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load plugin module
   */
  async loadPluginModule(pluginPath: string, mainFile: string): Promise<any> {
    const modulePath = path.join(pluginPath, mainFile);
    
    try {
      // Check if file exists
      if (!fs.existsSync(modulePath)) {
        throw new Error(`Plugin main file not found: ${modulePath}`);
      }

      // Dynamic import (ESM)
      const module = await import(modulePath);
      return module.default || module;
    } catch (error: any) {
      throw new Error(`Failed to load plugin module: ${error.message}`);
    }
  }
}

