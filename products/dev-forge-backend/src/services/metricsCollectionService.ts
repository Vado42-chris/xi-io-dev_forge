/**
 * Metrics Collection Service
 * 
 * Automated metrics collection, storage, and retrieval.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { analyticsAutomationService } from './analyticsAutomationService';

const pool = getPool();

export interface MetricDefinition {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  unit?: string;
  tags: string[];
  enabled: boolean;
  collectionInterval?: number; // In seconds
  retentionPeriod?: number; // In days
}

export interface CollectedMetric {
  metricId: string;
  metricName: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricTimeSeries {
  metricName: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  period: {
    start: Date;
    end: Date;
  };
}

export const metricsCollectionService = {
  /**
   * Register a metric definition
   */
  async registerMetric(definition: Omit<MetricDefinition, 'id'>): Promise<MetricDefinition> {
    try {
      const id = `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await pool.query(
        `INSERT INTO metric_definitions (id, name, type, description, unit, tags, enabled, collection_interval, retention_period, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          id,
          definition.name,
          definition.type,
          definition.description,
          definition.unit || null,
          JSON.stringify(definition.tags),
          definition.enabled,
          definition.collectionInterval || null,
          definition.retentionPeriod || null,
        ]
      );

      logger.info(`Metric definition registered: ${definition.name}`, { metricId: id });
      return { ...definition, id };
    } catch (error: any) {
      logger.error(`Error registering metric definition:`, error);
      throw new Error(`Failed to register metric: ${error.message}`);
    }
  },

  /**
   * Collect a metric value
   */
  async collectMetric(
    metricName: string,
    value: number,
    tags: Record<string, string> = {},
    metadata?: Record<string, any>
  ): Promise<CollectedMetric> {
    try {
      // Get metric definition
      const definition = await this.getMetricDefinition(metricName);
      if (!definition || !definition.enabled) {
        throw new Error(`Metric ${metricName} is not registered or disabled`);
      }

      // Record metric using analytics service
      await analyticsAutomationService.recordMetric(metricName, value, definition.type, tags);

      const collected: CollectedMetric = {
        metricId: definition.id,
        metricName,
        value,
        timestamp: new Date(),
        tags,
        metadata,
      };

      logger.debug(`Metric collected: ${metricName} = ${value}`, { tags });
      return collected;
    } catch (error: any) {
      logger.error(`Error collecting metric:`, error);
      throw new Error(`Failed to collect metric: ${error.message}`);
    }
  },

  /**
   * Get metric time series
   */
  async getMetricTimeSeries(
    metricName: string,
    startDate: Date,
    endDate: Date,
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'hour'
  ): Promise<MetricTimeSeries> {
    try {
      let dateTrunc: string;
      switch (granularity) {
        case 'minute':
          dateTrunc = 'minute';
          break;
        case 'hour':
          dateTrunc = 'hour';
          break;
        case 'day':
          dateTrunc = 'day';
          break;
        case 'week':
          dateTrunc = 'week';
          break;
        case 'month':
          dateTrunc = 'month';
          break;
        default:
          dateTrunc = 'hour';
      }

      const result = await pool.query(
        `SELECT 
          DATE_TRUNC($3, timestamp) as time_bucket,
          AVG(metric_value) as avg_value,
          COUNT(*) as count
         FROM analytics_metrics
         WHERE metric_name = $1 AND timestamp >= $2 AND timestamp <= $4
         GROUP BY time_bucket
         ORDER BY time_bucket ASC`,
        [metricName, startDate, dateTrunc, endDate]
      );

      const dataPoints = result.rows.map(row => ({
        timestamp: new Date(row.time_bucket),
        value: parseFloat(row.avg_value),
      }));

      return {
        metricName,
        dataPoints,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error: any) {
      logger.error(`Error getting metric time series:`, error);
      throw new Error(`Failed to get metric time series: ${error.message}`);
    }
  },

  /**
   * Get all registered metrics
   */
  async getAllMetrics(): Promise<MetricDefinition[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM metric_definitions WHERE enabled = true ORDER BY name ASC`
      );
      return result.rows.map(this.mapRowToMetricDefinition);
    } catch (error: any) {
      logger.error(`Error getting all metrics:`, error);
      throw new Error(`Failed to get metrics: ${error.message}`);
    }
  },

  /**
   * Get metric definition
   */
  async getMetricDefinition(metricName: string): Promise<MetricDefinition | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM metric_definitions WHERE name = $1`,
        [metricName]
      );

      if (result.rows.length > 0) {
        return this.mapRowToMetricDefinition(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting metric definition:`, error);
      throw new Error(`Failed to get metric definition: ${error.message}`);
    }
  },

  /**
   * Enable/disable metric collection
   */
  async toggleMetric(metricName: string, enabled: boolean): Promise<void> {
    try {
      await pool.query(
        `UPDATE metric_definitions SET enabled = $1 WHERE name = $2`,
        [enabled, metricName]
      );
      logger.info(`Metric ${metricName} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error: any) {
      logger.error(`Error toggling metric:`, error);
      throw new Error(`Failed to toggle metric: ${error.message}`);
    }
  },

  /**
   * Clean up old metrics based on retention period
   */
  async cleanupOldMetrics(): Promise<number> {
    try {
      const result = await pool.query(
        `DELETE FROM analytics_metrics
         WHERE timestamp < NOW() - INTERVAL '30 days'
         AND metric_name IN (
           SELECT name FROM metric_definitions 
           WHERE retention_period IS NOT NULL 
           AND timestamp < NOW() - (retention_period || ' days')::INTERVAL
         )`
      );

      const deletedCount = result.rowCount || 0;
      logger.info(`Cleaned up ${deletedCount} old metric records`);
      return deletedCount;
    } catch (error: any) {
      logger.error(`Error cleaning up old metrics:`, error);
      throw new Error(`Failed to cleanup metrics: ${error.message}`);
    }
  },

  /**
   * Map database row to MetricDefinition
   */
  private mapRowToMetricDefinition(row: any): MetricDefinition {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      unit: row.unit,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
      enabled: row.enabled,
      collectionInterval: row.collection_interval,
      retentionPeriod: row.retention_period,
    };
  },
};

