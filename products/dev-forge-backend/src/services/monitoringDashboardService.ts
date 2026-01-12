/**
 * Monitoring Dashboard Service
 * 
 * Provides data for monitoring dashboards and real-time metrics.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { systemHealthMonitoringService } from './systemHealthMonitoringService';
import { performanceOptimizationService } from './performanceOptimizationService';
import { securityAutomationService } from './securityAutomationService';

const pool = getPool();

export interface DashboardMetrics {
  timestamp: Date;
  systemHealth: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime?: number;
    }>;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    cacheHitRate: number;
  };
  security: {
    activeAlerts: number;
    criticalFindings: number;
    lastScanDate?: Date;
  };
  business: {
    totalUsers: number;
    activeUsers: number;
    totalExtensions: number;
    totalRevenue: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  notificationChannels: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export const monitoringDashboardService = {
  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get system health
      const health = await systemHealthMonitoringService.performHealthCheck();

      // Get performance metrics (last hour)
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // 1 hour ago
      const performanceMetrics = await performanceOptimizationService.getAverageMetrics(
        'response_time',
        startDate,
        endDate
      );

      // Get security alerts
      const securityFindings = await securityAutomationService.getSecurityFindings('critical', 10);
      const activeAlerts = await this.getActiveAlerts();

      // Get business metrics
      const businessMetrics = await this.getBusinessMetrics();

      const metrics: DashboardMetrics = {
        timestamp: new Date(),
        systemHealth: {
          overall: health.overall,
          services: health.services.map(service => ({
            name: service.name,
            status: service.status,
            responseTime: service.responseTime,
          })),
        },
        performance: {
          averageResponseTime: performanceMetrics.average,
          p95ResponseTime: performanceMetrics.average * 1.5, // Approximation
          p99ResponseTime: performanceMetrics.average * 2, // Approximation
          throughput: 0, // TODO: Calculate from metrics
          errorRate: 0, // TODO: Calculate from metrics
          cacheHitRate: 0, // TODO: Calculate from metrics
        },
        security: {
          activeAlerts: activeAlerts.length,
          criticalFindings: securityFindings.length,
          lastScanDate: new Date(), // TODO: Get from security service
        },
        business: businessMetrics,
      };

      return metrics;
    } catch (error: any) {
      logger.error('Error getting dashboard metrics:', error);
      throw new Error(`Failed to get dashboard metrics: ${error.message}`);
    }
  },

  /**
   * Get business metrics
   */
  private async getBusinessMetrics(): Promise<DashboardMetrics['business']> {
    try {
      // Get total users
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(usersResult.rows[0].count || '0');

      // Get active users (last 30 days)
      const activeUsersResult = await pool.query(
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM user_sessions 
         WHERE last_activity >= NOW() - INTERVAL '30 days'`
      );
      const activeUsers = parseInt(activeUsersResult.rows[0]?.count || '0');

      // Get total extensions
      const extensionsResult = await pool.query('SELECT COUNT(*) as count FROM extensions WHERE status = $1', ['approved']);
      const totalExtensions = parseInt(extensionsResult.rows[0].count || '0');

      // Get total revenue
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM revenue_shares 
         WHERE status = $1`,
        ['paid']
      );
      const totalRevenue = parseFloat(revenueResult.rows[0]?.total || '0');

      return {
        totalUsers,
        activeUsers,
        totalExtensions,
        totalRevenue,
      };
    } catch (error: any) {
      logger.error('Error getting business metrics:', error);
      // Return defaults on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalExtensions: 0,
        totalRevenue: 0,
      };
    }
  },

  /**
   * Create alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await pool.query(
        `INSERT INTO alert_rules 
         (id, name, metric, threshold, operator, severity, enabled, notification_channels, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          ruleId,
          rule.name,
          rule.metric,
          rule.threshold,
          rule.operator,
          rule.severity,
          rule.enabled,
          JSON.stringify(rule.notificationChannels),
        ]
      );

      const createdRule: AlertRule = {
        id: ruleId,
        ...rule,
      };

      logger.info(`Alert rule created: ${rule.name}`, { ruleId });
      return createdRule;
    } catch (error: any) {
      logger.error('Error creating alert rule:', error);
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }
  },

  /**
   * Get alert rules
   */
  async getAlertRules(enabled?: boolean): Promise<AlertRule[]> {
    try {
      let query = 'SELECT * FROM alert_rules';
      const params: any[] = [];

      if (enabled !== undefined) {
        query += ' WHERE enabled = $1';
        params.push(enabled);
      }

      query += ' ORDER BY created_at DESC';

      const result = await pool.query(query, params);
      return result.rows.map(this.mapRowToAlertRule);
    } catch (error: any) {
      logger.error('Error getting alert rules:', error);
      throw new Error(`Failed to get alert rules: ${error.message}`);
    }
  },

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM alerts 
         WHERE status = 'active' 
         ORDER BY triggered_at DESC`
      );
      return result.rows.map(this.mapRowToAlert);
    } catch (error: any) {
      logger.error('Error getting active alerts:', error);
      throw new Error(`Failed to get active alerts: ${error.message}`);
    }
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    try {
      await pool.query(
        `UPDATE alerts 
         SET status = 'acknowledged', acknowledged_at = NOW(), acknowledged_by = $1
         WHERE id = $2`,
        [userId, alertId]
      );

      const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
      if (result.rows.length === 0) {
        throw new Error('Alert not found');
      }

      logger.info(`Alert acknowledged: ${alertId}`, { userId });
      return this.mapRowToAlert(result.rows[0]);
    } catch (error: any) {
      logger.error('Error acknowledging alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }
  },

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, userId: string): Promise<Alert> {
    try {
      await pool.query(
        `UPDATE alerts 
         SET status = 'resolved', resolved_at = NOW(), resolved_by = $1
         WHERE id = $2`,
        [userId, alertId]
      );

      const result = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
      if (result.rows.length === 0) {
        throw new Error('Alert not found');
      }

      logger.info(`Alert resolved: ${alertId}`, { userId });
      return this.mapRowToAlert(result.rows[0]);
    } catch (error: any) {
      logger.error('Error resolving alert:', error);
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  },

  /**
   * Check alert rules and trigger alerts
   */
  async checkAlertRules(): Promise<void> {
    try {
      const rules = await this.getAlertRules(true);
      const metrics = await this.getDashboardMetrics();

      for (const rule of rules) {
        const metricValue = this.getMetricValue(metrics, rule.metric);
        const shouldTrigger = this.evaluateRule(metricValue, rule);

        if (shouldTrigger) {
          // Check if alert already exists
          const existingAlert = await pool.query(
            `SELECT * FROM alerts 
             WHERE rule_id = $1 AND status = 'active'`,
            [rule.id]
          );

          if (existingAlert.rows.length === 0) {
            // Create new alert
            await this.createAlert(rule, metricValue);
          }
        }
      }
    } catch (error: any) {
      logger.error('Error checking alert rules:', error);
      throw new Error(`Failed to check alert rules: ${error.message}`);
    }
  },

  /**
   * Get metric value from dashboard metrics
   */
  private getMetricValue(metrics: DashboardMetrics, metric: string): number {
    const metricMap: Record<string, number> = {
      'system.health.overall': metrics.systemHealth.overall === 'healthy' ? 1 : 0,
      'performance.response_time': metrics.performance.averageResponseTime,
      'performance.error_rate': metrics.performance.errorRate,
      'security.active_alerts': metrics.security.activeAlerts,
      'security.critical_findings': metrics.security.criticalFindings,
    };

    return metricMap[metric] || 0;
  },

  /**
   * Evaluate alert rule
   */
  private evaluateRule(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  },

  /**
   * Create alert
   */
  private async createAlert(rule: AlertRule, value: number): Promise<void> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await pool.query(
        `INSERT INTO alerts 
         (id, rule_id, rule_name, severity, message, metric, value, threshold, status, triggered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          alertId,
          rule.id,
          rule.name,
          rule.severity,
          `${rule.name}: ${value} ${rule.operator} ${rule.threshold}`,
          rule.metric,
          value,
          rule.threshold,
          'active',
        ]
      );

      logger.warn(`Alert triggered: ${rule.name}`, { alertId, value, threshold: rule.threshold });
    } catch (error: any) {
      logger.error('Error creating alert:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  },

  /**
   * Map database row to AlertRule
   */
  private mapRowToAlertRule(row: any): AlertRule {
    return {
      id: row.id,
      name: row.name,
      metric: row.metric,
      threshold: row.threshold,
      operator: row.operator,
      severity: row.severity,
      enabled: row.enabled,
      notificationChannels: typeof row.notification_channels === 'string'
        ? JSON.parse(row.notification_channels)
        : row.notification_channels,
    };
  },

  /**
   * Map database row to Alert
   */
  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      ruleId: row.rule_id,
      ruleName: row.rule_name,
      severity: row.severity,
      message: row.message,
      metric: row.metric,
      value: row.value,
      threshold: row.threshold,
      status: row.status,
      triggeredAt: new Date(row.triggered_at),
      acknowledgedAt: row.acknowledged_at ? new Date(row.acknowledged_at) : undefined,
      acknowledgedBy: row.acknowledged_by,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      resolvedBy: row.resolved_by,
    };
  },
};

