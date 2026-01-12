/**
 * Retry Handler
 * 
 * Implements retry logic for API requests.
 */

import { RetryConfig } from './types';

export class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  /**
   * Execute a function with retry logic
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        const statusCode = error.response?.status || error.statusCode;
        if (statusCode && !this.config.retryableStatusCodes.includes(statusCode)) {
          throw error; // Not retryable
        }
        
        // Check if we've exhausted retries
        if (attempt >= this.config.maxRetries) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        const delay = this.config.retryDelay * Math.pow(2, attempt);
        await this.wait(delay);
      }
    }
    
    throw lastError || new Error('Retry failed');
  }

  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

