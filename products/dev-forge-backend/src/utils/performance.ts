/**
 * Performance Utilities
 * 
 * Performance monitoring and optimization helpers.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Performance monitoring middleware
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6; // Convert to milliseconds
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
      external: (endMemory.external - startMemory.external) / 1024 / 1024, // MB
    };

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta,
      });
    }

    // Log memory usage for monitoring
    if (memoryDelta.heapUsed > 50) {
      logger.warn('High memory usage detected', {
        method: req.method,
        path: req.path,
        memoryDelta,
      });
    }
  });

  next();
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();

  return {
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
      external: Math.round(memory.external / 1024 / 1024), // MB
      rss: Math.round(memory.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: cpu.user / 1000, // microseconds to milliseconds
      system: cpu.system / 1000,
    },
    uptime: process.uptime(),
  };
}

