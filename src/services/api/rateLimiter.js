"use strict";
/**
 * Rate Limiter
 *
 * Implements rate limiting for API providers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
class RateLimiter {
    constructor(limits) {
        this.requests = new Map();
        this.limits = limits || {};
    }
    /**
     * Check if request is within rate limit
     */
    async checkLimit(key = 'default') {
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
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Reset rate limit for a key
     */
    reset(key = 'default') {
        this.requests.delete(key);
    }
    /**
     * Reset all rate limits
     */
    resetAll() {
        this.requests.clear();
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rateLimiter.js.map