"use strict";
/**
 * API Key Manager
 *
 * Manages API keys securely using VS Code SecretStorage.
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
exports.ApiKeyManager = void 0;
const vscode = __importStar(require("vscode"));
class ApiKeyManager {
    constructor(context) {
        this.secretStorage = context.secrets;
        this.config = vscode.workspace.getConfiguration('devForge');
    }
    /**
     * Store API key securely
     */
    async storeApiKey(providerId, apiKey) {
        const key = `devForge.${providerId}.apiKey`;
        await this.secretStorage.store(key, apiKey);
    }
    /**
     * Get API key
     */
    async getApiKey(providerId) {
        // Try SecretStorage first
        const key = `devForge.${providerId}.apiKey`;
        let apiKey = await this.secretStorage.get(key);
        // Fallback to config (for env var references)
        if (!apiKey) {
            const configKey = this.config.get(`apiProviders.providers.${providerId}.apiKey`);
            if (configKey?.startsWith('${env:')) {
                const envVar = configKey.match(/\${env:([^}]+)}/)?.[1];
                apiKey = process.env[envVar || ''];
            }
            else if (configKey) {
                apiKey = configKey;
            }
        }
        return apiKey;
    }
    /**
     * Delete API key
     */
    async deleteApiKey(providerId) {
        const key = `devForge.${providerId}.apiKey`;
        await this.secretStorage.delete(key);
    }
    /**
     * Check if API key exists
     */
    async hasApiKey(providerId) {
        const apiKey = await this.getApiKey(providerId);
        return !!apiKey;
    }
}
exports.ApiKeyManager = ApiKeyManager;
//# sourceMappingURL=apiKeyManager.js.map