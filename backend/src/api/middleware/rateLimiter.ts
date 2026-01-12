/**
 * Rate Limiter Middleware
 * 
 * Basic rate limiting for API endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limiter middleware
 */
export function rateLimiter(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = store[key];

    // Clean up old records
    if (record && record.resetTime < now) {
      delete store[key];
    }

    // Check rate limit
    if (record && record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { ip: key, path: req.path });
      res.status(429).json({
        error: {
          message: 'Too many requests',
          status: 429,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        }
      });
      return;
    }

    // Increment or create record
    if (record) {
      record.count++;
    } else {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    next();
  };
}

