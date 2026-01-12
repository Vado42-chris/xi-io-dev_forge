"use strict";
/**
 * Model Manager Service
 *
 * Manages AI models for Dev Forge using the provider system:
 * - Model discovery via providers
 * - Model loading/unloading
 * - Model health monitoring
 * - Model switching
 * - Model metadata
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelManager = exports.ModelManager = void 0;
const modelProviderRegistry_1 = require("./providers/modelProviderRegistry");
class ModelManager {
    constructor(providerRegistry) {
        this.models = new Map();
        this.activeModelId = null;
        this.isInitialized = false;
        this.providerRegistry = providerRegistry || new modelProviderRegistry_1.ModelProviderRegistry();
    }
    /**
     * Initialize model manager
     */
    async initialize() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('[ModelManager] Already initialized, skipping...');
            return;
        }
        console.log('[ModelManager] Initializing...');
        // Initialize provider registry
        // Providers should be registered before calling initialize
        // This allows for lazy initialization
        // Load models from all providers
        await this.refreshModels();
        this.isInitialized = true;
        console.log(`[ModelManager] Initialized with ${this.models.size} models`);
    }
    /**
     * Refresh models from all providers
     */
    async refreshModels() {
        try {
            // Get all models from all providers
            const providerModels = await this.providerRegistry.listAllModels();
            // Convert provider models to ModelMetadata
            for (const providerModel of providerModels) {
                const modelMetadata = this.convertProviderModel(providerModel);
                this.models.set(modelMetadata.id, modelMetadata);
            }
            console.log(`[ModelManager] Refreshed ${this.models.size} models from providers`);
        }
        catch (error) {
            console.error('[ModelManager] Error refreshing models:', error);
        }
    }
    /**
     * Convert provider model metadata to ModelManager metadata
     */
    convertProviderModel(providerModel) {
        // Extract category from tags or description
        let category = 'general';
        if (providerModel.description?.toLowerCase().includes('code') ||
            providerModel.name?.toLowerCase().includes('code')) {
            category = 'coding';
        }
        else if (providerModel.description?.toLowerCase().includes('reason') ||
            providerModel.name?.toLowerCase().includes('reason')) {
            category = 'reasoning';
        }
        else if (providerModel.description?.toLowerCase().includes('vision') ||
            providerModel.name?.toLowerCase().includes('vision')) {
            category = 'multimodal';
        }
        // Extract tags
        const tags = [];
        if (providerModel.description) {
            tags.push(...providerModel.description.split(' ').filter(t => t.length > 2));
        }
        tags.push(providerModel.provider);
        return {
            id: providerModel.id,
            name: providerModel.name,
            displayName: providerModel.name,
            description: providerModel.description || `Model from ${providerModel.provider} provider`,
            size: 0, // Will be updated if available
            sizeFormatted: 'Unknown',
            category,
            tags,
            isInstalled: providerModel.enabled,
            isActive: false,
            provider: providerModel.provider,
            providerType: providerModel.provider
        };
    }
    /**
     * Register a model provider
     */
    async registerProvider(provider) {
        await this.providerRegistry.registerProvider(provider);
        // Refresh models after registering provider
        if (this.isInitialized) {
            await this.refreshModels();
        }
    }
    /**
     * Get all models
     */
    getAllModels() {
        return Array.from(this.models.values());
    }
    /**
     * Get models by category
     */
    getModelsByCategory(category) {
        return this.getAllModels().filter(m => m.category === category);
    }
    /**
     * Get models by provider
     */
    getModelsByProvider(providerType) {
        return this.getAllModels().filter(m => m.providerType === providerType);
    }
    /**
     * Get installed models
     */
    getInstalledModels() {
        return this.getAllModels().filter(m => m.isInstalled);
    }
    /**
     * Get model by ID
     */
    getModel(id) {
        return this.models.get(id);
    }
    /**
     * Set active model
     */
    setActiveModel(id) {
        const model = this.models.get(id);
        if (!model) {
            throw new Error(`Model not found: ${id}`);
        }
        if (!model.isInstalled) {
            throw new Error(`Model not installed: ${id}`);
        }
        // Deactivate current model
        if (this.activeModelId) {
            const currentModel = this.models.get(this.activeModelId);
            if (currentModel) {
                currentModel.isActive = false;
            }
        }
        // Activate new model
        this.activeModelId = id;
        model.isActive = true;
        console.log(`[ModelManager] Activated model: ${model.displayName}`);
    }
    /**
     * Get active model
     */
    getActiveModel() {
        if (!this.activeModelId) {
            return null;
        }
        return this.models.get(this.activeModelId) || null;
    }
    /**
     * Get model count
     */
    getModelCount() {
        return this.models.size;
    }
    /**
     * Get installed model count
     */
    getInstalledModelCount() {
        return this.getInstalledModels().length;
    }
    /**
     * Check if manager is initialized
     */
    getInitialized() {
        return this.isInitialized;
    }
    /**
     * Get provider registry
     */
    getProviderRegistry() {
        return this.providerRegistry;
    }
    /**
     * Generate using a model
     */
    async generate(modelId, prompt, options) {
        const model = this.models.get(modelId);
        if (!model) {
            throw new Error(`Model not found: ${modelId}`);
        }
        if (!model.provider) {
            throw new Error(`Model has no provider: ${modelId}`);
        }
        // Find the provider that owns this model
        const provider = this.providerRegistry.getProvider(model.provider);
        if (!provider) {
            // Try to find by type if provider ID doesn't match
            const providersByType = this.providerRegistry.getProvidersByType(model.provider);
            if (providersByType.length === 0) {
                throw new Error(`No provider found for model: ${modelId}`);
            }
            // Use first provider of this type
            const response = await providersByType[0].generate({
                prompt,
                modelId,
                options
            });
            if (!response.success) {
                throw new Error(response.error || 'Generation failed');
            }
            return response.response;
        }
        const response = await provider.generate({
            prompt,
            modelId,
            options
        });
        if (!response.success) {
            throw new Error(response.error || 'Generation failed');
        }
        return response.response;
    }
    /**
     * Reset manager (for testing)
     */
    reset() {
        this.models.clear();
        this.activeModelId = null;
        this.isInitialized = false;
    }
}
exports.ModelManager = ModelManager;
exports.modelManager = new ModelManager();
//# sourceMappingURL=modelManager.js.map