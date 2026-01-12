/**
 * Type Definitions for Model Providers
 * 
 * Defines interfaces for model providers, requests, and responses.
 */

/**
 * Model Provider Types
 */
export type ModelProviderType = 'ollama' | 'gguf' | 'api' | 'plugin';

/**
 * Model Metadata
 */
export interface ModelMetadata {
  id: string;
  name: string;
  provider: ModelProviderType;
  enabled: boolean;
  priority?: number;
  description?: string;
  contextSize?: number;
  maxTokens?: number;
  parameters?: Record<string, any>;
}

/**
 * Generate Request
 */
export interface GenerateRequest {
  prompt: string;
  modelId?: string;
  options?: GenerateOptions;
}

/**
 * Generate Options
 */
export interface GenerateOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  seed?: number;
  stop?: string[];
  stream?: boolean;
  [key: string]: any;
}

/**
 * Generate Response
 */
export interface GenerateResponse {
  response: string;
  model: string;
  provider: ModelProviderType;
  success: boolean;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    duration?: number;
    [key: string]: any;
  };
}

/**
 * Stream Chunk
 */
export interface StreamChunk {
  text: string;
  done: boolean;
  model: string;
  provider: ModelProviderType;
}

/**
 * Provider Health Status
 */
export interface HealthStatus {
  isHealthy: boolean;
  message: string;
  lastChecked?: Date;
  details?: Record<string, any>;
}

/**
 * Model Provider Interface
 * 
 * All model providers must implement this interface.
 */
export interface ModelProvider {
  /**
   * Provider identifier
   */
  id: string;

  /**
   * Provider name
   */
  name: string;

  /**
   * Provider type
   */
  type: ModelProviderType;

  /**
   * Whether provider is enabled
   */
  enabled: boolean;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * List available models
   */
  listModels(): Promise<ModelMetadata[]>;

  /**
   * Get a specific model
   */
  getModel(id: string): Promise<ModelMetadata | null>;

  /**
   * Check if model is available
   */
  isModelAvailable(id: string): Promise<boolean>;

  /**
   * Generate a response
   */
  generate(request: GenerateRequest): Promise<GenerateResponse>;

  /**
   * Stream a response (optional)
   */
  stream?(request: GenerateRequest): AsyncGenerator<StreamChunk>;

  /**
   * Check provider health
   */
  getHealth(): Promise<HealthStatus>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Dispose resources
   */
  dispose?(): Promise<void>;
}

