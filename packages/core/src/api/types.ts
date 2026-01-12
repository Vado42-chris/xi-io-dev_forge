/**
 * API Provider Type Definitions
 * 
 * Defines interfaces for API providers, requests, and responses.
 */

import { GenerateRequest, GenerateResponse, GenerateOptions, StreamChunk, HealthStatus } from '../types';

/**
 * API Provider Types
 */
export type ApiProviderType = 'openai' | 'anthropic' | 'cursor' | 'custom';

/**
 * Generate Options (re-exported from core types for API providers)
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
 * Health Status (re-exported from core types for API providers)
 */
export interface HealthStatus {
  isHealthy: boolean;
  message: string;
  lastChecked?: Date;
  details?: Record<string, any>;
}

/**
 * Rate Limit Configuration
 */
export interface RateLimit {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}

/**
 * API Provider Configuration
 */
export interface ApiProviderConfig {
  id: string;
  name: string;
  type: ApiProviderType;
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  timeout?: number;
  rateLimit?: RateLimit;
  retry?: RetryConfig;
  // Cursor-specific
  workspaceId?: string;
  // Custom endpoint configuration
  endpoints?: {
    generate?: string;
    stream?: string;
    models?: string;
  };
  // Request/response transformers
  requestTransformer?: (request: any) => any;
  responseTransformer?: (response: any) => string;
}

/**
 * API Provider Interface
 * 
 * All API providers must implement this interface.
 */
export interface ApiProvider {
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
  type: ApiProviderType;

  /**
   * Whether provider is enabled
   */
  enabled: boolean;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Generate a response
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Stream a response (optional)
   */
  stream?(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;

  /**
   * Get available models
   */
  getModels(): Promise<any[]>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;

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

/**
 * API Request
 */
export interface ApiRequest {
  prompt: string;
  model?: string;
  options?: GenerateOptions;
}

/**
 * API Response
 */
export interface ApiResponse {
  response: string;
  model?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

