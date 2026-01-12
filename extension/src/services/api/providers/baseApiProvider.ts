/**
 * Base API Provider
 * 
 * Base implementation for API providers.
 */

import axios, { AxiosInstance } from 'axios';
import { ApiProvider, ApiProviderConfig, GenerateOptions, HealthStatus } from '../types';
import { RateLimiter } from '../rateLimiter';
import { RetryHandler } from '../retryHandler';

export abstract class BaseApiProvider implements ApiProvider {
  id: string;
  name: string;
  type: ApiProviderConfig['type'];
  enabled: boolean;

  protected config: ApiProviderConfig;
  protected client: AxiosInstance;
  protected rateLimiter: RateLimiter;
  protected retryHandler: RetryHandler;

  constructor(config: ApiProviderConfig) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.enabled = config.enabled;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    });

    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.retryHandler = new RetryHandler(
      config.retry || {
        maxRetries: 3,
        retryDelay: 1000,
        retryableStatusCodes: [429, 500, 502, 503, 504]
      }
    );
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    // Set API key in headers if available
    if (this.config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    // Validate provider
    const isValid = await this.validate();
    if (!isValid) {
      throw new Error(`Provider validation failed: ${this.id}`);
    }

    // Check health
    const health = await this.getHealth();
    if (!health.isHealthy) {
      throw new Error(`Provider not healthy: ${health.message}`);
    }
  }

  /**
   * Generate a response
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit(this.id);

    // Make request with retry
    const response = await this.retryHandler.execute(async () => {
      return await this.makeGenerateRequest(prompt, options);
    });

    return response;
  }

  /**
   * Stream a response
   */
  async *stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit(this.id);

    // Make streaming request
    const stream = await this.makeStreamRequest(prompt, options);
    
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    try {
      const endpoint = this.config.endpoints?.models || '/v1/models';
      const response = await this.client.get(endpoint);
      return response.data.data || response.data || [];
    } catch (error: any) {
      throw new Error(`Failed to get models: ${error.message}`);
    }
  }

  /**
   * Validate provider configuration
   */
  async validate(): Promise<boolean> {
    try {
      // Check if base URL is accessible
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      // If /health doesn't exist, try /models
      try {
        await this.getModels();
        return true;
      } catch {
        return false;
      }
    }
  }

  /**
   * Check provider health
   */
  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return {
        isHealthy: response.status === 200,
        message: 'OK',
        lastChecked: new Date()
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        message: error.message || 'Unknown error',
        lastChecked: new Date()
      };
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    const health = await this.getHealth();
    return health.isHealthy;
  }

  /**
   * Make generate request (to be implemented by subclasses)
   */
  protected abstract makeGenerateRequest(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Make stream request (to be implemented by subclasses)
   */
  protected async *makeStreamRequest(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    // Default: fallback to non-streaming
    const response = await this.generate(prompt, options);
    yield response;
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Cleanup if needed
  }
}

