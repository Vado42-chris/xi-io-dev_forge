"use strict";
/**
 * Configuration Manager
 *
 * Manages VS Code settings for Dev Forge extension.
 * Provides type-safe access to configuration values.
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
exports.ConfigurationManager = void 0;
const vscode = __importStar(require("vscode"));
class ConfigurationManager {
    constructor(context) {
        this.disposables = [];
        this.context = context;
        this.config = vscode.workspace.getConfiguration('devForge');
    }
    /**
     * Initialize configuration manager
     */
    async initialize() {
        // Validate configuration
        await this.validateConfiguration();
        // Listen for configuration changes
        const changeListener = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('devForge')) {
                this.config = vscode.workspace.getConfiguration('devForge');
                this.onConfigurationChanged();
            }
        });
        this.disposables.push(changeListener);
    }
    /**
     * Get a configuration setting
     */
    getSetting(key, defaultValue) {
        const value = this.config.get(key, defaultValue);
        return value;
    }
    /**
     * Update a configuration setting
     */
    async updateSetting(key, value, target) {
        const targetConfig = target || vscode.ConfigurationTarget.Global;
        await this.config.update(key, value, targetConfig);
        this.config = vscode.workspace.getConfiguration('devForge');
    }
    /**
     * Get nested configuration (e.g., 'models.ollama.enabled')
     */
    getNestedSetting(key, defaultValue) {
        const keys = key.split('.');
        let current = this.config;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            }
            else {
                return defaultValue;
            }
        }
        return current !== undefined ? current : defaultValue;
    }
    /**
     * Update nested configuration
     */
    async updateNestedSetting(key, value, target) {
        await this.updateSetting(key, value, target);
    }
    /**
     * Get all configuration
     */
    getAllSettings() {
        return this.config;
    }
    /**
     * Validate configuration
     */
    async validateConfiguration() {
        // Validate required settings
        const modelsEnabled = this.getSetting('models.enabled', true);
        if (modelsEnabled) {
            const defaultProvider = this.getSetting('models.defaultProvider', 'ollama');
            const validProviders = ['ollama', 'gguf', 'api', 'plugin'];
            if (!validProviders.includes(defaultProvider)) {
                vscode.window.showWarningMessage(`Invalid default provider: ${defaultProvider}. Using 'ollama' instead.`);
                await this.updateSetting('models.defaultProvider', 'ollama');
            }
        }
        // Validate parallel execution settings
        const parallelEnabled = this.getSetting('parallelExecution.enabled', true);
        if (parallelEnabled) {
            const maxConcurrent = this.getSetting('parallelExecution.maxConcurrent', 11);
            if (maxConcurrent < 1 || maxConcurrent > 50) {
                vscode.window.showWarningMessage(`Invalid maxConcurrent: ${maxConcurrent}. Using default: 11.`);
                await this.updateSetting('parallelExecution.maxConcurrent', 11);
            }
        }
        // Validate aggregation settings
        const aggregationEnabled = this.getSetting('aggregation.enabled', true);
        if (aggregationEnabled) {
            const qualityThreshold = this.getSetting('aggregation.qualityThreshold', 0.6);
            if (qualityThreshold < 0 || qualityThreshold > 1) {
                vscode.window.showWarningMessage(`Invalid qualityThreshold: ${qualityThreshold}. Using default: 0.6.`);
                await this.updateSetting('aggregation.qualityThreshold', 0.6);
            }
        }
    }
    /**
     * Handle configuration changes
     */
    onConfigurationChanged() {
        // Notify listeners (to be implemented)
        console.log('Dev Forge configuration changed');
    }
    /**
     * Reload configuration
     */
    reload() {
        this.config = vscode.workspace.getConfiguration('devForge');
        this.validateConfiguration();
    }
    /**
     * Dispose resources
     */
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=configurationManager.js.map