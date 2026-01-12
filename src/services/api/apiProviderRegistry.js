"use strict";
/**
 * API Provider Registry
 *
 * Manages registration and retrieval of API providers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiProviderRegistry = void 0;
const cursorApiProvider_1 = require("./providers/cursorApiProvider");
const openAiProvider_1 = require("./providers/openAiProvider");
const anthropicProvider_1 = require("./providers/anthropicProvider");
const customApiProvider_1 = require("./providers/customApiProvider");
class ApiProviderRegistry {
    constructor(apiKeyManager) {
        this.providers = new Map();
        this.providersByType = new Map();
        this.apiKeyManager = apiKeyManager;
    }
    /**
     * Register an API provider
     */
    async registerProvider(config, apiKey) {
        // Get API key
        let key = apiKey;
        if (!key && this.apiKeyManager) {
            key = await this.apiKeyManager.getApiKey(config.id);
        }
        if (!key && config.apiKey) {
            key = config.apiKey;
        }
        // Create provider based on type
        let provider;
        switch (config.type) {
            case 'cursor':
                provider = new cursorApiProvider_1.CursorApiProvider({ ...config, apiKey: key });
                break;
            case 'openai':
                provider = new openAiProvider_1.OpenAIProvider({ ...config, apiKey: key });
                break;
            case 'anthropic':
                provider = new anthropicProvider_1.AnthropicProvider({ ...config, apiKey: key });
                break;
            case 'custom':
                provider = new customApiProvider_1.CustomApiProvider({ ...config, apiKey: key });
                break;
            default:
                throw new Error(`Unknown API provider type: ${config.type}`);
        }
        // Initialize provider
        await provider.initialize();
        // Register by ID
        this.providers.set(provider.id, provider);
        // Register by type
        if (!this.providersByType.has(config.type)) {
            this.providersByType.set(config.type, []);
        }
        this.providersByType.get(config.type).push(provider);
        console.log(`Registered API provider: ${provider.name} (${config.type})`);
    }
    /**
     * Unregister an API provider
     */
    async unregisterProvider(id) {
        const provider = this.providers.get(id);
        if (provider) {
            // Dispose if available
            if (provider.dispose) {
                await provider.dispose();
            }
            // Remove from registry
            this.providers.delete(id);
            // Remove from type map
            const typeProviders = this.providersByType.get(provider.type);
            if (typeProviders) {
                const index = typeProviders.indexOf(provider);
                if (index > -1) {
                    typeProviders.splice(index, 1);
                }
            }
            console.log(`Unregistered API provider: ${id}`);
        }
    }
    /**
     * Get a provider by ID
     */
    getProvider(id) {
        return this.providers.get(id);
    }
    /**
     * Get all providers
     */
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    /**
     * Get enabled providers
     */
    getEnabledProviders() {
        return this.getAllProviders().filter(p => p.enabled);
    }
    /**
     * Get providers by type
     */
    getProvidersByType(type) {
        return this.providersByType.get(type) || [];
    }
    /**
     * Execute a request on a provider
     */
    async execute(providerId, prompt, options) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        if (!provider.enabled) {
            throw new Error(`Provider is disabled: ${providerId}`);
        }
        return await provider.generate(prompt, options);
    }
    /**
     * Stream a request on a provider
     */
    async *stream(providerId, prompt, options) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        if (!provider.enabled) {
            throw new Error(`Provider is disabled: ${providerId}`);
        }
        if (!provider.stream) {
            throw new Error(`Provider does not support streaming: ${providerId}`);
        }
        yield* provider.stream(prompt, options);
    }
    /**
     * Check provider health
     */
    async checkHealth(providerId) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            return false;
        }
        try {
            const health = await provider.getHealth();
            return health.isHealthy;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Check all providers health
     */
    async checkAllProvidersHealth() {
        const healthMap = new Map();
        for (const provider of this.getAllProviders()) {
            try {
                const health = await provider.getHealth();
                healthMap.set(provider.id, health.isHealthy);
            }
            catch (error) {
                healthMap.set(provider.id, false);
            }
        }
        return healthMap;
    }
    /**
     * Dispose all providers
     */
    async dispose() {
        for (const provider of this.getAllProviders()) {
            if (provider.dispose) {
                try {
                    await provider.dispose();
                }
                catch (error) {
                    console.error(`Error disposing provider ${provider.id}:`, error);
                }
            }
        }
        this.providers.clear();
        this.providersByType.clear();
    }
}
exports.ApiProviderRegistry = ApiProviderRegistry;
//# sourceMappingURL=apiProviderRegistry.js.map