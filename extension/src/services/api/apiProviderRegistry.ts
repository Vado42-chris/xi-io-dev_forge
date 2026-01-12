/**
 * API Provider Registry
 * 
 * Manages registration and retrieval of API providers.
 */

import { ApiProvider, ApiProviderConfig, ApiProviderType } from './types';
import { CursorApiProvider } from './providers/cursorApiProvider';
import { OpenAIProvider } from './providers/openAiProvider';
import { AnthropicProvider } from './providers/anthropicProvider';
import { CustomApiProvider } from './providers/customApiProvider';
import { ApiKeyManager } from './apiKeyManager';

export class ApiProviderRegistry {
  private providers: Map<string, ApiProvider> = new Map();
  private providersByType: Map<ApiProviderType, ApiProvider[]> = new Map();
  private apiKeyManager?: ApiKeyManager;

  constructor(apiKeyManager?: ApiKeyManager) {
    this.apiKeyManager = apiKeyManager;
  }

  /**
   * Register an API provider
   */
  async registerProvider(config: ApiProviderConfig, apiKey?: string): Promise<void> {
    // Get API key
    let key = apiKey;
    if (!key && this.apiKeyManager) {
      key = await this.apiKeyManager.getApiKey(config.id);
    }
    if (!key && config.apiKey) {
      key = config.apiKey;
    }

    // Create provider based on type
    let provider: ApiProvider;
    switch (config.type) {
      case 'cursor':
        provider = new CursorApiProvider({ ...config, apiKey: key });
        break;
      case 'openai':
        provider = new OpenAIProvider({ ...config, apiKey: key });
        break;
      case 'anthropic':
        provider = new AnthropicProvider({ ...config, apiKey: key });
        break;
      case 'custom':
        provider = new CustomApiProvider({ ...config, apiKey: key });
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
    this.providersByType.get(config.type)!.push(provider);

    console.log(`Registered API provider: ${provider.name} (${config.type})`);
  }

  /**
   * Unregister an API provider
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

      console.log(`Unregistered API provider: ${id}`);
    }
  }

  /**
   * Get a provider by ID
   */
  getProvider(id: string): ApiProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all providers
   */
  getAllProviders(): ApiProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): ApiProvider[] {
    return this.getAllProviders().filter(p => p.enabled);
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: ApiProviderType): ApiProvider[] {
    return this.providersByType.get(type) || [];
  }

  /**
   * Execute a request on a provider
   */
  async execute(providerId: string, prompt: string, options?: any): Promise<string> {
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
  async *stream(providerId: string, prompt: string, options?: any): AsyncGenerator<string> {
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
  async checkHealth(providerId: string): Promise<boolean> {
    const provider = this.getProvider(providerId);
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

