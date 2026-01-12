"use strict";
/**
 * Plugin Sandbox
 *
 * Provides sandboxed execution environment for plugins.
 * Uses process isolation for security.
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
exports.PluginSandbox = void 0;
const path = __importStar(require("path"));
class PluginSandbox {
    constructor() {
        this.processes = new Map();
    }
    /**
     * Load plugin in sandboxed process
     */
    async loadPlugin(pluginPath, config) {
        // For now, we'll load plugins in the same process
        // In production, we'd fork a separate process for true isolation
        // This is a simplified implementation
        try {
            // Load plugin module
            const pluginModule = await this.loadPluginModule(pluginPath);
            // Create plugin instance
            const plugin = pluginModule.default || pluginModule;
            if (!plugin || typeof plugin !== 'object') {
                throw new Error('Plugin module must export a plugin object');
            }
            return plugin;
        }
        catch (error) {
            throw new Error(`Failed to load plugin: ${error.message}`);
        }
    }
    /**
     * Load plugin module
     */
    async loadPluginModule(pluginPath) {
        // For now, use dynamic import
        // In production, we'd use process isolation
        const mainFile = path.join(pluginPath, 'index.js');
        try {
            const module = await Promise.resolve(`${mainFile}`).then(s => __importStar(require(s)));
            return module;
        }
        catch (error) {
            throw new Error(`Failed to load plugin module: ${error.message}`);
        }
    }
    /**
     * Unload plugin
     */
    async unloadPlugin(pluginId) {
        const process = this.processes.get(pluginId);
        if (process) {
            process.kill();
            this.processes.delete(pluginId);
        }
    }
    /**
     * Execute plugin method in sandbox
     */
    async executeInSandbox(pluginId, method, ...args) {
        // For now, execute directly
        // In production, we'd use IPC to communicate with sandboxed process
        throw new Error('Sandbox execution not yet implemented');
    }
}
exports.PluginSandbox = PluginSandbox;
//# sourceMappingURL=pluginSandbox.js.map