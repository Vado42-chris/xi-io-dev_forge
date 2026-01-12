/**
 * API Client
 * 
 * Centralized API client for Dev Forge backend services.
 * Used by both Electron app and marketing website.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { RequestCache } from './utils/requestCache';
import { RateLimiter } from './utils/rateLimiter';
import { Logger, LogLevel } from './utils/logger';
import { MetricsCollector } from './utils/metrics';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;
  private token: string | null = null;
  private cache: RequestCache;
  private rateLimiter: RateLimiter;
  private logger: Logger;
  private metrics: MetricsCollector;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize cache, rate limiter, logger, and metrics
    this.cache = new RequestCache();
    this.rateLimiter = new RateLimiter();
    this.logger = new Logger(
      process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
    );
    this.metrics = new MetricsCollector();

    // Clean up expired cache entries periodically
    setInterval(() => {
      this.cache.clearExpired();
    }, 60 * 1000); // Every minute

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and retries
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        // Handle 401 - Unauthorized
        if (error.response?.status === 401) {
          this.clearToken();
          // Could trigger re-login flow here
        }

        // Retry logic for network errors or 5xx errors
        if (
          (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
          config &&
          (!config._retry || (config._retryCount || 0) < (this.config.retries || 3))
        ) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));

          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig & { useCache?: boolean; cacheTTL?: number }): Promise<ApiResponse<T>> {
    const useCache = config?.useCache !== false; // Default to true
    const cacheKey = RequestCache.generateKey('GET', url, config?.params);

    // Check cache first
    if (useCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== null) {
        return { success: true, data: cached };
      }
    }

    // Check rate limit
    if (!this.rateLimiter.isAllowed('api-requests')) {
      return {
        success: false,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    }

    const startTime = Date.now();
    
    try {
      this.logger.debug(`GET ${url}`, config?.params);
      
      const response = await this.client.get<ApiResponse<T>>(url, config);
      const duration = Date.now() - startTime;
      const formatted = this.formatResponse(response);

      // Record metrics
      this.metrics.record({
        url,
        method: 'GET',
        duration,
        statusCode: response.status,
        success: formatted.success,
      });

      // Cache successful responses
      if (useCache && formatted.success && formatted.data) {
        this.cache.set(cacheKey, formatted.data, config?.cacheTTL);
      }

      this.logger.debug(`GET ${url} completed`, { duration, success: formatted.success });
      return formatted;
    } catch (error) {
      const duration = Date.now() - startTime;
      const formatted = this.formatError(error);

      // Record metrics
      this.metrics.record({
        url,
        method: 'GET',
        duration,
        statusCode: (error as AxiosError).response?.status,
        success: false,
        error: formatted.error?.message,
      });

      this.logger.error(`GET ${url} failed`, { duration, error: formatted.error });
      return formatted;
    }
  }

  /**
   * Make POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Make PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Make PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return this.formatResponse(response);
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return this.formatResponse(response);
    } catch (error) {
      return this.formatError(error);
    }
  }

  /**
   * Format successful response
   */
  private formatResponse<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
    // If backend already returns ApiResponse format, use it
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return response.data;
    }

    // Otherwise, wrap the data
    return {
      success: true,
      data: response.data as T,
    };
  }

  /**
   * Format error response
   */
  private formatError(error: any): ApiResponse {
    if (error.response) {
      // Server responded with error
      const response = error.response.data;
      return {
        success: false,
        error: {
          message: response?.message || response?.error?.message || 'An error occurred',
          code: response?.code || response?.error?.code || String(error.response.status),
          details: response?.error?.details || response?.details,
        },
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: {
          message: 'Network error - no response from server',
          code: 'NETWORK_ERROR',
        },
      };
    } else {
      // Error setting up request
      return {
        success: false,
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get metrics statistics
   */
  getMetricsStats() {
    return this.metrics.getStats();
  }

  /**
   * Get logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get metrics collector
   */
  getMetrics(): MetricsCollector {
    return this.metrics;
  }
}

