/**
 * Rate Limiter
 * 
 * Client-side rate limiting to prevent API abuse.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private defaultLimit: number = 100; // requests
  private defaultWindow: number = 60 * 1000; // 1 minute

  /**
   * Check if request is allowed
   */
  isAllowed(key: string, limit?: number, window?: number): boolean {
    const entry = this.limits.get(key);
    const now = Date.now();
    const maxRequests = limit || this.defaultLimit;
    const windowMs = window || this.defaultWindow;

    if (!entry || now > entry.resetAt) {
      // Create new window
      this.limits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string, limit?: number): number {
    const entry = this.limits.get(key);
    const maxRequests = limit || this.defaultLimit;

    if (!entry || Date.now() > entry.resetAt) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get reset time
   */
  getResetTime(key: string): number | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }
    return entry.resetAt;
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }
}

