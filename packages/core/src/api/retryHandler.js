"use strict";
/**
 * Retry Handler
 *
 * Implements retry logic for API requests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryHandler = void 0;
class RetryHandler {
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute a function with retry logic
     */
    async execute(fn) {
        let lastError;
        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
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
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryHandler = RetryHandler;
//# sourceMappingURL=retryHandler.js.map