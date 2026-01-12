"use strict";
/**
 * Model Provider Registry
 *
 * Manages registration and retrieval of model providers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelProviderRegistry = void 0;
class ModelProviderRegistry {
    constructor() {
        this.providers = new Map();
        this.providersByType = new Map();
    }
    /**
     * Register a model provider
     */
    async registerProvider(provider) {
        // Initialize provider
        await provider.initialize();
        // Register by ID
        this.providers.set(provider.id, provider);
        // Register by type
        if (!this.providersByType.has(provider.type)) {
            this.providersByType.set(provider.type, []);
        }
        this.providersByType.get(provider.type).push(provider);
        console.log(`Registered model provider: ${provider.name} (${provider.type})`);
    }
    /**
     * Unregister a model provider
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
            console.log(`Unregistered model provider: ${id}`);
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
     * Get default provider
     */
    getDefaultProvider(type) {
        if (type) {
            const typeProviders = this.getProvidersByType(type);
            return typeProviders.find(p => p.enabled) || typeProviders[0];
        }
        // Return first enabled provider
        return this.getEnabledProviders()[0];
    }
    /**
     * List all available models from all providers
     */
    async listAllModels() {
        const allModels = [];
        for (const provider of this.getEnabledProviders()) {
            try {
                const models = await provider.listModels();
                allModels.push(...models);
            }
            catch (error) {
                console.error(`Failed to list models from ${provider.name}:`, error);
            }
        }
        return allModels;
    }
    /**
     * Get a model from any provider
     */
    async getModel(id) {
        for (const provider of this.getEnabledProviders()) {
            try {
                const model = await provider.getModel(id);
                if (model) {
                    return model;
                }
            }
            catch (error) {
                // Continue to next provider
            }
        }
        return null;
    }
    /**
     * Generate using a specific provider
     */
    async generate(providerId, request) {
        const provider = this.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}`);
        }
        if (!provider.enabled) {
            throw new Error(`Provider is disabled: ${providerId}`);
        }
        return await provider.generate(request);
    }
    /**
     * Generate using default provider
     */
    async generateWithDefault(request, type) {
        const provider = this.getDefaultProvider(type);
        if (!provider) {
            throw new Error('No provider available');
        }
        return await provider.generate(request);
    }
    /**
     * Check provider health
     */
    async checkProviderHealth(id) {
        const provider = this.getProvider(id);
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
exports.ModelProviderRegistry = ModelProviderRegistry;
//# sourceMappingURL=modelProviderRegistry.js.map