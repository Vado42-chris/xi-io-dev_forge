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

import { ModelProviderRegistry } from './providers/modelProviderRegistry';
import { ModelProvider, ModelMetadata as ProviderModelMetadata } from './types';

// Legacy ModelMetadata for backward compatibility
export interface ModelMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  size: number;
  sizeFormatted: string;
  category: 'coding' | 'general' | 'reasoning' | 'multimodal' | 'embedding';
  tags: string[];
  isInstalled: boolean;
  isActive: boolean;
  performance?: {
    latency?: number;
    accuracy?: number;
    quality?: number;
  };
  // Provider information
  provider?: string;
  providerType?: 'ollama' | 'gguf' | 'api' | 'plugin';
}

export class ModelManager {
  private models: Map<string, ModelMetadata> = new Map();
  private activeModelId: string | null = null;
  private isInitialized: boolean = false;
  private providerRegistry: ModelProviderRegistry;

  constructor(providerRegistry?: ModelProviderRegistry) {
    this.providerRegistry = providerRegistry || new ModelProviderRegistry();
  }

  /**
   * Initialize model manager
   */
  async initialize(): Promise<void> {
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
  async refreshModels(): Promise<void> {
    try {
      // Get all models from all providers
      const providerModels = await this.providerRegistry.listAllModels();

      // Convert provider models to ModelMetadata
      for (const providerModel of providerModels) {
        const modelMetadata = this.convertProviderModel(providerModel);
        this.models.set(modelMetadata.id, modelMetadata);
      }

      console.log(`[ModelManager] Refreshed ${this.models.size} models from providers`);
    } catch (error) {
      console.error('[ModelManager] Error refreshing models:', error);
    }
  }

  /**
   * Convert provider model metadata to ModelManager metadata
   */
  private convertProviderModel(providerModel: ProviderModelMetadata): ModelMetadata {
    // Extract category from tags or description
    let category: ModelMetadata['category'] = 'general';
    if (providerModel.description?.toLowerCase().includes('code') || 
        providerModel.name?.toLowerCase().includes('code')) {
      category = 'coding';
    } else if (providerModel.description?.toLowerCase().includes('reason') ||
               providerModel.name?.toLowerCase().includes('reason')) {
      category = 'reasoning';
    } else if (providerModel.description?.toLowerCase().includes('vision') ||
               providerModel.name?.toLowerCase().includes('vision')) {
      category = 'multimodal';
    }

    // Extract tags
    const tags: string[] = [];
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
      providerType: providerModel.provider as ModelMetadata['providerType']
    };
  }

  /**
   * Register a model provider
   */
  async registerProvider(provider: ModelProvider): Promise<void> {
    await this.providerRegistry.registerProvider(provider);
    // Refresh models after registering provider
    if (this.isInitialized) {
      await this.refreshModels();
    }
  }

  /**
   * Get all models
   */
  getAllModels(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category: ModelMetadata['category']): ModelMetadata[] {
    return this.getAllModels().filter(m => m.category === category);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(providerType: 'ollama' | 'gguf' | 'api' | 'plugin'): ModelMetadata[] {
    return this.getAllModels().filter(m => m.providerType === providerType);
  }

  /**
   * Get installed models
   */
  getInstalledModels(): ModelMetadata[] {
    return this.getAllModels().filter(m => m.isInstalled);
  }

  /**
   * Get model by ID
   */
  getModel(id: string): ModelMetadata | undefined {
    return this.models.get(id);
  }

  /**
   * Set active model
   */
  setActiveModel(id: string): void {
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
  getActiveModel(): ModelMetadata | null {
    if (!this.activeModelId) {
      return null;
    }
    return this.models.get(this.activeModelId) || null;
  }

  /**
   * Get model count
   */
  getModelCount(): number {
    return this.models.size;
  }

  /**
   * Get installed model count
   */
  getInstalledModelCount(): number {
    return this.getInstalledModels().length;
  }

  /**
   * Check if manager is initialized
   */
  getInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get provider registry
   */
  getProviderRegistry(): ModelProviderRegistry {
    return this.providerRegistry;
  }

  /**
   * Generate using a model
   */
  async generate(modelId: string, prompt: string, options?: any): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (!model.provider) {
      throw new Error(`Model has no provider: ${modelId}`);
    }

    const response = await this.providerRegistry.generate(model.provider, {
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
  reset(): void {
    this.models.clear();
    this.activeModelId = null;
    this.isInitialized = false;
  }
}

export const modelManager = new ModelManager();
