"use strict";
/**
 * Plugin Discovery
 *
 * Discovers and loads plugins from the plugin directory.
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
exports.PluginDiscovery = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PluginDiscovery {
    /**
     * Discover plugins in directory
     */
    async discoverPlugins(directory) {
        const plugins = [];
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
        }
        catch (error) {
            console.error(`[PluginDiscovery] Error discovering plugins: ${error.message}`);
        }
        return plugins;
    }
    /**
     * Load plugin manifest
     */
    async loadPluginManifest(pluginPath) {
        const manifestPath = path.join(pluginPath, 'plugin.json');
        try {
            if (!fs.existsSync(manifestPath)) {
                console.warn(`[PluginDiscovery] No plugin.json found in: ${pluginPath}`);
                return null;
            }
            const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            // Validate manifest
            const validation = this.validateManifest(manifest);
            if (!validation.isValid) {
                console.error(`[PluginDiscovery] Invalid manifest in ${pluginPath}:`, validation.errors);
                return null;
            }
            return manifest;
        }
        catch (error) {
            console.error(`[PluginDiscovery] Error loading manifest from ${pluginPath}:`, error.message);
            return null;
        }
    }
    /**
     * Validate plugin manifest
     */
    validateManifest(manifest) {
        const errors = [];
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
    async loadPluginModule(pluginPath, mainFile) {
        const modulePath = path.join(pluginPath, mainFile);
        try {
            // Check if file exists
            if (!fs.existsSync(modulePath)) {
                throw new Error(`Plugin main file not found: ${modulePath}`);
            }
            // Dynamic import (ESM)
            const module = await Promise.resolve(`${modulePath}`).then(s => __importStar(require(s)));
            return module.default || module;
        }
        catch (error) {
            throw new Error(`Failed to load plugin module: ${error.message}`);
        }
    }
}
exports.PluginDiscovery = PluginDiscovery;
//# sourceMappingURL=pluginDiscovery.js.map