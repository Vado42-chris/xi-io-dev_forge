/**
 * Health Check Utility
 * 
 * System health monitoring and status reporting.
 */

import { query } from '../config/database';
import { logger } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    api: {
      status: 'up' | 'down';
    };
  };
  version: string;
  uptime: number;
}

let startTime = Date.now();

/**
 * Perform health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: {
        status: 'down',
      },
      api: {
        status: 'up',
      },
    },
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  // Check database
  try {
    const dbStart = Date.now();
    await query('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;
    healthStatus.services.database = {
      status: 'up',
      responseTime: dbResponseTime,
    };
  } catch (error: any) {
    logger.error('Database health check failed:', error);
    healthStatus.services.database.status = 'down';
    healthStatus.status = 'unhealthy';
  }

  // Determine overall status
  if (healthStatus.services.database.status === 'down') {
    healthStatus.status = 'unhealthy';
  } else if (healthStatus.services.database.responseTime && healthStatus.services.database.responseTime > 1000) {
    healthStatus.status = 'degraded';
  }

  return healthStatus;
}

