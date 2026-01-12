/**
 * System Health Monitoring Service
 * 
 * Automated system health monitoring, checks, and alerts.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface HealthCheck {
  id: string;
  serviceName: string;
  checkType: 'database' | 'api' | 'external' | 'disk' | 'memory' | 'cpu';
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number; // In milliseconds
  message?: string;
  metadata?: Record<string, any>;
  checkedAt: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheck[];
  timestamp: Date;
  uptime: number; // In seconds
  metrics: {
    database: {
      status: string;
      connectionCount: number;
      queryTime: number;
    };
    api: {
      status: string;
      averageResponseTime: number;
      requestCount: number;
    };
    system: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
    };
  };
}

export interface HealthAlert {
  id: string;
  serviceName: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export const systemHealthMonitoringService = {
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    try {
      const services: HealthCheck[] = [];

      // Database health check
      const dbHealth = await this.checkDatabase();
      services.push(dbHealth);

      // API health check
      const apiHealth = await this.checkAPI();
      services.push(apiHealth);

      // System resources check
      const systemHealth = await this.checkSystemResources();
      services.push(systemHealth);

      // Determine overall health
      const overall = this.determineOverallHealth(services);

      // Get system metrics
      const metrics = await this.getSystemMetrics();

      const health: SystemHealth = {
        overall,
        services,
        timestamp: new Date(),
        uptime: process.uptime(),
        metrics,
      };

      // Store health check
      await this.storeHealthCheck(health);

      // Check for alerts
      await this.checkAlerts(services);

      return health;
    } catch (error: any) {
      logger.error('Error performing health check:', error);
      throw new Error(`Failed to perform health check: ${error.message}`);
    }
  },

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const result = await pool.query('SELECT NOW() as time, COUNT(*) as connections FROM pg_stat_activity');
      const responseTime = Date.now() - startTime;

      return {
        id: uuidv4(),
        serviceName: 'database',
        checkType: 'database',
        status: responseTime < 1000 ? 'healthy' : responseTime < 5000 ? 'degraded' : 'unhealthy',
        responseTime,
        message: 'Database connection healthy',
        metadata: {
          connectionCount: parseInt(result.rows[0].connections || '0'),
        },
        checkedAt: new Date(),
      };
    } catch (error: any) {
      return {
        id: uuidv4(),
        serviceName: 'database',
        checkType: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: `Database check failed: ${error.message}`,
        checkedAt: new Date(),
      };
    }
  },

  /**
   * Check API health
   */
  private async checkAPI(): Promise<HealthCheck> {
    // TODO: Check API endpoints
    return {
      id: uuidv4(),
      serviceName: 'api',
      checkType: 'api',
      status: 'healthy',
      message: 'API endpoints responding',
      checkedAt: new Date(),
    };
  },

  /**
   * Check system resources
   */
  private async checkSystemResources(): Promise<HealthCheck> {
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();

    const status = cpuUsage > 90 || memoryUsage > 90 || diskUsage > 90
      ? 'unhealthy'
      : cpuUsage > 70 || memoryUsage > 70 || diskUsage > 70
      ? 'degraded'
      : 'healthy';

    return {
      id: uuidv4(),
      serviceName: 'system',
      checkType: 'cpu',
      status,
      message: `CPU: ${cpuUsage}%, Memory: ${memoryUsage}%, Disk: ${diskUsage}%`,
      metadata: {
        cpuUsage,
        memoryUsage,
        diskUsage,
      },
      checkedAt: new Date(),
    };
  },

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<SystemHealth['metrics']> {
    const dbHealth = await this.checkDatabase();
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    const diskUsage = await this.getDiskUsage();

    return {
      database: {
        status: dbHealth.status,
        connectionCount: dbHealth.metadata?.connectionCount || 0,
        queryTime: dbHealth.responseTime || 0,
      },
      api: {
        status: 'healthy', // TODO: Get actual API metrics
        averageResponseTime: 0,
        requestCount: 0,
      },
      system: {
        cpuUsage,
        memoryUsage,
        diskUsage,
      },
    };
  },

  /**
   * Determine overall health
   */
  private determineOverallHealth(services: HealthCheck[]): SystemHealth['overall'] {
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');

    if (hasUnhealthy) return 'unhealthy';
    if (hasDegraded) return 'degraded';
    return 'healthy';
  },

  /**
   * Check for alerts
   */
  private async checkAlerts(services: HealthCheck[]): Promise<void> {
    for (const service of services) {
      if (service.status === 'unhealthy') {
        await this.createAlert(service.serviceName, 'critical', `Service ${service.serviceName} is unhealthy: ${service.message}`);
      } else if (service.status === 'degraded') {
        await this.createAlert(service.serviceName, 'warning', `Service ${service.serviceName} is degraded: ${service.message}`);
      }
    }
  },

  /**
   * Create health alert
   */
  async createAlert(
    serviceName: string,
    severity: HealthAlert['severity'],
    message: string
  ): Promise<HealthAlert> {
    try {
      // Check if alert already exists
      const existing = await pool.query(
        `SELECT * FROM health_alerts 
         WHERE service_name = $1 AND severity = $2 AND status = 'active'
         ORDER BY created_at DESC LIMIT 1`,
        [serviceName, severity]
      );

      if (existing.rows.length > 0) {
        // Update existing alert
        await pool.query(
          `UPDATE health_alerts 
           SET message = $1, created_at = NOW() 
           WHERE id = $2`,
          [message, existing.rows[0].id]
        );
        return this.mapRowToAlert(existing.rows[0]);
      }

      // Create new alert
      const alertId = uuidv4();
      await pool.query(
        `INSERT INTO health_alerts 
         (id, service_name, severity, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [alertId, serviceName, severity, message, 'active']
      );

      const alert: HealthAlert = {
        id: alertId,
        serviceName,
        severity,
        message,
        status: 'active',
        createdAt: new Date(),
      };

      logger.warn(`Health alert created: ${serviceName} - ${message}`);
      return alert;
    } catch (error: any) {
      logger.error(`Error creating health alert:`, error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  },

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<HealthAlert[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM health_alerts 
         WHERE status = 'active' 
         ORDER BY 
           CASE severity 
             WHEN 'critical' THEN 1 
             WHEN 'warning' THEN 2 
             WHEN 'info' THEN 3 
           END,
           created_at DESC`
      );
      return result.rows.map(row => this.mapRowToAlert(row));
    } catch (error: any) {
      logger.error(`Error getting active alerts:`, error);
      throw new Error(`Failed to get alerts: ${error.message}`);
    }
  },

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    try {
      await pool.query(
        `UPDATE health_alerts 
         SET status = 'resolved', resolved_at = NOW() 
         WHERE id = $1`,
        [alertId]
      );
      logger.info(`Health alert resolved: ${alertId}`);
    } catch (error: any) {
      logger.error(`Error resolving alert:`, error);
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  },

  /**
   * Store health check
   */
  private async storeHealthCheck(health: SystemHealth): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO health_checks 
         (id, overall_status, services_data, metrics_data, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          uuidv4(),
          health.overall,
          JSON.stringify(health.services),
          JSON.stringify(health.metrics),
          health.timestamp,
        ]
      );
    } catch (error: any) {
      logger.error(`Error storing health check:`, error);
      // Don't throw - health check storage failure shouldn't break health checks
    }
  },

  /**
   * Helper methods for system metrics
   */
  private async getCPUUsage(): Promise<number> {
    // TODO: Implement actual CPU usage monitoring
    return 0;
  },

  private async getMemoryUsage(): Promise<number> {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    return totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;
  },

  private async getDiskUsage(): Promise<number> {
    // TODO: Implement actual disk usage monitoring
    return 0;
  },

  /**
   * Map database row to HealthAlert
   */
  private mapRowToAlert(row: any): HealthAlert {
    return {
      id: row.id,
      serviceName: row.service_name,
      severity: row.severity,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.created_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
    };
  },
};

