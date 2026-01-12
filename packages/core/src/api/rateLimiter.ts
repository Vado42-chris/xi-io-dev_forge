/**
 * Rate Limiter
 * 
 * Implements rate limiting for API providers.
 */

import { RateLimit } from './types';

export class RateLimiter {
  private limits: RateLimit;
  private requests: Map<string, number[]> = new Map();

  constructor(limits?: RateLimit) {
    this.limits = limits || {};
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(key: string = 'default'): Promise<void> {
    const now = Date.now();
    
    // Get request history
    const history = this.requests.get(key) || [];
    
    // Clean old requests (older than 1 minute)
    const oneMinuteAgo = now - 60000;
    const recentHistory = history.filter(timestamp => timestamp > oneMinuteAgo);
    
    // Check per-minute limit
    if (this.limits.requestsPerMinute && recentHistory.length >= this.limits.requestsPerMinute) {
      const oldest = Math.min(...recentHistory);
      const waitTime = 60000 - (now - oldest);
      if (waitTime > 0) {
        await this.wait(waitTime);
        // Re-check after waiting
        return this.checkLimit(key);
      }
    }
    
    // Check per-hour limit
    if (this.limits.requestsPerHour) {
      const oneHourAgo = now - 3600000;
      const hourHistory = history.filter(timestamp => timestamp > oneHourAgo);
      if (hourHistory.length >= this.limits.requestsPerHour) {
        const oldest = Math.min(...hourHistory);
        const waitTime = 3600000 - (now - oldest);
        if (waitTime > 0) {
          await this.wait(waitTime);
          return this.checkLimit(key);
        }
      }
    }
    
    // Check per-day limit
    if (this.limits.requestsPerDay) {
      const oneDayAgo = now - 86400000;
      const dayHistory = history.filter(timestamp => timestamp > oneDayAgo);
      if (dayHistory.length >= this.limits.requestsPerDay) {
        throw new Error('Daily rate limit exceeded');
      }
    }
    
    // Record this request
    recentHistory.push(now);
    this.requests.set(key, recentHistory);
  }

  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string = 'default'): void {
    this.requests.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }
}

