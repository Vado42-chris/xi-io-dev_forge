/**
 * Model Provider Registry
 * 
 * Manages registration and retrieval of model providers.
 */

import { ModelProvider, ModelMetadata, GenerateRequest, GenerateResponse, ModelProviderType } from '../types';

export class ModelProviderRegistry {
  private providers: Map<string, ModelProvider> = new Map();
  private providersByType: Map<ModelProviderType, ModelProvider[]> = new Map();

  /**
   * Register a model provider
   */
  async registerProvider(provider: ModelProvider): Promise<void> {
    // Initialize provider
    await provider.initialize();

    // Register by ID
    this.providers.set(provider.id, provider);

    // Register by type
    if (!this.providersByType.has(provider.type)) {
      this.providersByType.set(provider.type, []);
    }
    this.providersByType.get(provider.type)!.push(provider);

    console.log(`Registered model provider: ${provider.name} (${provider.type})`);
  }

  /**
   * Unregister a model provider
   */
  async unregisterProvider(id: string): Promise<void> {
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
  getProvider(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all providers
   */
  getAllProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): ModelProvider[] {
    return this.getAllProviders().filter(p => p.enabled);
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: ModelProviderType): ModelProvider[] {
    return this.providersByType.get(type) || [];
  }

  /**
   * Get default provider
   */
  getDefaultProvider(type?: ModelProviderType): ModelProvider | undefined {
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
  async listAllModels(): Promise<ModelMetadata[]> {
    const allModels: ModelMetadata[] = [];

    for (const provider of this.getEnabledProviders()) {
      try {
        const models = await provider.listModels();
        allModels.push(...models);
      } catch (error) {
        console.error(`Failed to list models from ${provider.name}:`, error);
      }
    }

    return allModels;
  }

  /**
   * Get a model from any provider
   */
  async getModel(id: string): Promise<ModelMetadata | null> {
    for (const provider of this.getEnabledProviders()) {
      try {
        const model = await provider.getModel(id);
        if (model) {
          return model;
        }
      } catch (error) {
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Generate using a specific provider
   */
  async generate(providerId: string, request: GenerateRequest): Promise<GenerateResponse> {
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
  async generateWithDefault(request: GenerateRequest, type?: ModelProviderType): Promise<GenerateResponse> {
    const provider = this.getDefaultProvider(type);
    if (!provider) {
      throw new Error('No provider available');
    }

    return await provider.generate(request);
  }

  /**
   * Check provider health
   */
  async checkProviderHealth(id: string): Promise<boolean> {
    const provider = this.getProvider(id);
    if (!provider) {
      return false;
    }

    try {
      const health = await provider.getHealth();
      return health.isHealthy;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check all providers health
   */
  async checkAllProvidersHealth(): Promise<Map<string, boolean>> {
    const healthMap = new Map<string, boolean>();

    for (const provider of this.getAllProviders()) {
      try {
        const health = await provider.getHealth();
        healthMap.set(provider.id, health.isHealthy);
      } catch (error) {
        healthMap.set(provider.id, false);
      }
    }

    return healthMap;
  }

  /**
   * Dispose all providers
   */
  async dispose(): Promise<void> {
    for (const provider of this.getAllProviders()) {
      if (provider.dispose) {
        try {
          await provider.dispose();
        } catch (error) {
          console.error(`Error disposing provider ${provider.id}:`, error);
        }
      }
    }

    this.providers.clear();
    this.providersByType.clear();
  }
}

