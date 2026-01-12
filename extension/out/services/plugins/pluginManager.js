"use strict";
/**
 * Plugin Manager
 *
 * Manages plugin lifecycle, discovery, loading, and execution.
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
exports.PluginManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pluginDiscovery_1 = require("./pluginDiscovery");
const pluginSandbox_1 = require("./pluginSandbox");
const permissionValidator_1 = require("./permissionValidator");
const pluginAPI_1 = require("./pluginAPI");
class PluginManager {
    constructor(context, modelProviderRegistry, apiProviderRegistry) {
        this.plugins = new Map();
        this.context = context;
        this.modelProviderRegistry = modelProviderRegistry;
        this.apiProviderRegistry = apiProviderRegistry;
        this.sandbox = new pluginSandbox_1.PluginSandbox();
        this.discovery = new pluginDiscovery_1.PluginDiscovery();
        this.validator = new permissionValidator_1.PermissionValidator();
        // Get plugin directory from config
        const config = vscode.workspace.getConfiguration('devForge');
        this.pluginDirectory = this.expandPath(config.get('plugins.pluginDirectory', '~/.dev-forge/plugins') || '~/.dev-forge/plugins');
    }
    /**
     * Expand ~ to home directory
     */
    expandPath(filePath) {
        if (filePath.startsWith('~')) {
            const homeDir = process.env.HOME || process.env.USERPROFILE || '';
            return path.join(homeDir, filePath.slice(1));
        }
        return filePath;
    }
    /**
     * Initialize plugin manager
     */
    async initialize() {
        // Ensure plugin directory exists
        if (!fs.existsSync(this.pluginDirectory)) {
            await fs.promises.mkdir(this.pluginDirectory, { recursive: true });
        }
        // Discover plugins
        const discoveredPlugins = await this.discovery.discoverPlugins(this.pluginDirectory);
        // Load enabled plugins
        const config = vscode.workspace.getConfiguration('devForge');
        const autoLoad = config.get('plugins.autoLoad', true);
        if (autoLoad) {
            for (const manifest of discoveredPlugins) {
                const pluginConfig = this.getPluginConfig(manifest.id);
                if (pluginConfig.enabled) {
                    try {
                        await this.loadPlugin(manifest, pluginConfig);
                    }
                    catch (error) {
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
    getPluginConfig(pluginId) {
        const config = vscode.workspace.getConfiguration('devForge');
        const plugins = config.get('plugins.plugins', []);
        const pluginConfig = plugins.find((p) => p.id === pluginId);
        return {
            id: pluginId,
            enabled: pluginConfig?.enabled !== false,
            permissions: pluginConfig?.permissions
        };
    }
    /**
     * Load a plugin
     */
    async loadPlugin(manifest, pluginConfig) {
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
    async unloadPlugin(id) {
        const plugin = this.plugins.get(id);
        if (!plugin) {
            return;
        }
        // Deactivate plugin
        if (plugin.deactivate) {
            try {
                await plugin.deactivate();
            }
            catch (error) {
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
    async validatePlugin(manifest) {
        const errors = [];
        const warnings = [];
        // Validate manifest structure
        if (!manifest.id)
            errors.push('Missing id');
        if (!manifest.name)
            errors.push('Missing name');
        if (!manifest.version)
            errors.push('Missing version');
        if (!manifest.apiVersion)
            errors.push('Missing apiVersion');
        if (!manifest.main)
            errors.push('Missing main');
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
    createPluginContext(plugin, pluginPath, pluginConfig) {
        const permissionValidator = new permissionValidator_1.PermissionValidator();
        const pluginAPI = new pluginAPI_1.PluginAPI(vscode, permissionValidator, this.modelProviderRegistry, this.apiProviderRegistry, pluginConfig.permissions || {});
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
    getPlugin(id) {
        return this.plugins.get(id);
    }
    /**
     * Get all plugins
     */
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get enabled plugins
     */
    getEnabledPlugins() {
        return this.getAllPlugins().filter(p => {
            const config = this.getPluginConfig(p.id);
            return config.enabled;
        });
    }
    /**
     * Dispose all plugins
     */
    async dispose() {
        for (const plugin of this.getAllPlugins()) {
            await this.unloadPlugin(plugin.id);
        }
        this.plugins.clear();
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=pluginManager.js.map