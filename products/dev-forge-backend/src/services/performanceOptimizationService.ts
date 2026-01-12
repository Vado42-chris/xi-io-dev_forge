/**
 * Performance Optimization Service
 * 
 * Automated performance optimization, caching, and metrics collection.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface PerformanceMetric {
  id: string;
  metricName: string;
  metricValue: number;
  metricType: 'response_time' | 'throughput' | 'error_rate' | 'cache_hit_rate' | 'database_query_time';
  endpoint?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PerformanceOptimization {
  id: string;
  optimizationType: 'caching' | 'query_optimization' | 'index_creation' | 'compression' | 'cdn';
  target: string;
  beforeValue: number;
  afterValue: number;
  improvement: number; // Percentage
  status: 'pending' | 'applied' | 'failed';
  appliedAt?: Date;
  error?: string;
}

export interface CacheStrategy {
  key: string;
  ttl: number; // Time to live in seconds
  tags?: string[];
  invalidationRules?: string[];
}

export interface PerformanceReport {
  id: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    cacheHitRate: number;
  };
  recommendations: Array<{
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
  }>;
  generatedAt: Date;
}

export const performanceOptimizationService = {
  /**
   * Record performance metric
   */
  async recordMetric(
    metricName: string,
    metricValue: number,
    metricType: PerformanceMetric['metricType'],
    endpoint?: string,
    metadata?: Record<string, any>
  ): Promise<PerformanceMetric> {
    try {
      const metric: PerformanceMetric = {
        id: uuidv4(),
        metricName,
        metricValue,
        metricType,
        endpoint,
        timestamp: new Date(),
        metadata,
      };

      await pool.query(
        `INSERT INTO performance_metrics 
         (id, metric_name, metric_value, metric_type, endpoint, metadata, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          metric.id,
          metricName,
          metricValue,
          metricType,
          endpoint || null,
          metadata ? JSON.stringify(metadata) : null,
          metric.timestamp,
        ]
      );

      // Check if optimization is needed
      await this.checkOptimizationNeeded(metric);

      return metric;
    } catch (error: any) {
      logger.error(`Error recording performance metric:`, error);
      throw new Error(`Failed to record metric: ${error.message}`);
    }
  },

  /**
   * Get performance metrics
   */
  async getMetrics(
    metricType?: PerformanceMetric['metricType'],
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<PerformanceMetric[]> {
    try {
      let query = `SELECT * FROM performance_metrics WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (metricType) {
        query += ` AND metric_type = $${paramIndex++}`;
        params.push(metricType);
      }

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++}`;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows.map(this.mapRowToMetric);
    } catch (error: any) {
      logger.error(`Error getting performance metrics:`, error);
      throw new Error(`Failed to get metrics: ${error.message}`);
    }
  },

  /**
   * Get average performance metrics
   */
  async getAverageMetrics(
    metricType: PerformanceMetric['metricType'],
    startDate: Date,
    endDate: Date
  ): Promise<{
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    try {
      const result = await pool.query(
        `SELECT 
          AVG(metric_value) as average,
          MIN(metric_value) as min,
          MAX(metric_value) as max,
          COUNT(*) as count
         FROM performance_metrics
         WHERE metric_type = $1 AND timestamp >= $2 AND timestamp <= $3`,
        [metricType, startDate, endDate]
      );

      const row = result.rows[0];
      return {
        average: parseFloat(row.average || '0'),
        min: parseFloat(row.min || '0'),
        max: parseFloat(row.max || '0'),
        count: parseInt(row.count || '0'),
      };
    } catch (error: any) {
      logger.error(`Error getting average metrics:`, error);
      throw new Error(`Failed to get average metrics: ${error.message}`);
    }
  },

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport> {
    try {
      // Get response time metrics
      const responseTimeMetrics = await this.getAverageMetrics('response_time', startDate, endDate);
      
      // Calculate percentiles (simplified - would need more complex query in production)
      const p95ResponseTime = responseTimeMetrics.average * 1.5; // Approximation
      const p99ResponseTime = responseTimeMetrics.average * 2; // Approximation

      // Get throughput
      const throughputMetrics = await this.getAverageMetrics('throughput', startDate, endDate);

      // Get error rate
      const errorRateMetrics = await this.getAverageMetrics('error_rate', startDate, endDate);

      // Get cache hit rate
      const cacheMetrics = await this.getAverageMetrics('cache_hit_rate', startDate, endDate);

      // Generate recommendations
      const recommendations = await this.generateRecommendations({
        averageResponseTime: responseTimeMetrics.average,
        errorRate: errorRateMetrics.average,
        cacheHitRate: cacheMetrics.average,
      });

      const report: PerformanceReport = {
        id: uuidv4(),
        period: {
          start: startDate,
          end: endDate,
        },
        metrics: {
          averageResponseTime: responseTimeMetrics.average,
          p95ResponseTime,
          p99ResponseTime,
          throughput: throughputMetrics.average,
          errorRate: errorRateMetrics.average,
          cacheHitRate: cacheMetrics.average,
        },
        recommendations,
        generatedAt: new Date(),
      };

      logger.info(`Performance report generated for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
      return report;
    } catch (error: any) {
      logger.error(`Error generating performance report:`, error);
      throw new Error(`Failed to generate performance report: ${error.message}`);
    }
  },

  /**
   * Apply optimization
   */
  async applyOptimization(
    optimizationType: PerformanceOptimization['optimizationType'],
    target: string,
    beforeValue: number,
    afterValue: number
  ): Promise<PerformanceOptimization> {
    try {
      const improvement = beforeValue > 0 ? ((beforeValue - afterValue) / beforeValue) * 100 : 0;
      const optimizationId = uuidv4();

      await pool.query(
        `INSERT INTO performance_optimizations 
         (id, optimization_type, target, before_value, after_value, improvement, status, applied_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          optimizationId,
          optimizationType,
          target,
          beforeValue,
          afterValue,
          improvement,
          'applied',
        ]
      );

      const optimization: PerformanceOptimization = {
        id: optimizationId,
        optimizationType,
        target,
        beforeValue,
        afterValue,
        improvement,
        status: 'applied',
        appliedAt: new Date(),
      };

      logger.info(`Optimization applied: ${optimizationType} on ${target}`, { improvement: `${improvement.toFixed(2)}%` });
      return optimization;
    } catch (error: any) {
      logger.error(`Error applying optimization:`, error);
      throw new Error(`Failed to apply optimization: ${error.message}`);
    }
  },

  /**
   * Optimize database queries
   */
  async optimizeDatabaseQueries(): Promise<PerformanceOptimization[]> {
    const optimizations: PerformanceOptimization[] = [];

    try {
      // Find slow queries
      const slowQueries = await this.findSlowQueries();

      for (const query of slowQueries) {
        // Analyze query and suggest optimizations
        const optimization = await this.analyzeQuery(query);
        if (optimization) {
          optimizations.push(optimization);
        }
      }

      logger.info(`Database query optimization completed: ${optimizations.length} optimizations found`);
      return optimizations;
    } catch (error: any) {
      logger.error(`Error optimizing database queries:`, error);
      throw new Error(`Failed to optimize queries: ${error.message}`);
    }
  },

  /**
   * Get cache strategy
   */
  async getCacheStrategy(key: string): Promise<CacheStrategy | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM cache_strategies WHERE key = $1`,
        [key]
      );

      if (result.rows.length > 0) {
        return this.mapRowToCacheStrategy(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting cache strategy:`, error);
      throw new Error(`Failed to get cache strategy: ${error.message}`);
    }
  },

  /**
   * Set cache strategy
   */
  async setCacheStrategy(strategy: CacheStrategy): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO cache_strategies (key, ttl, tags, invalidation_rules, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (key) DO UPDATE
         SET ttl = $2, tags = $3, invalidation_rules = $4, updated_at = NOW()`,
        [
          strategy.key,
          strategy.ttl,
          strategy.tags ? JSON.stringify(strategy.tags) : null,
          strategy.invalidationRules ? JSON.stringify(strategy.invalidationRules) : null,
        ]
      );

      logger.info(`Cache strategy set: ${strategy.key}`);
    } catch (error: any) {
      logger.error(`Error setting cache strategy:`, error);
      throw new Error(`Failed to set cache strategy: ${error.message}`);
    }
  },

  /**
   * Generate recommendations
   */
  private async generateRecommendations(metrics: {
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }): Promise<PerformanceReport['recommendations']> {
    const recommendations: PerformanceReport['recommendations'] = [];

    // Response time recommendations
    if (metrics.averageResponseTime > 1000) {
      recommendations.push({
        type: 'caching',
        description: 'Implement caching for frequently accessed data',
        impact: 'high',
        effort: 'medium',
      });
    }

    if (metrics.averageResponseTime > 500) {
      recommendations.push({
        type: 'query_optimization',
        description: 'Optimize database queries and add indexes',
        impact: 'high',
        effort: 'medium',
      });
    }

    // Error rate recommendations
    if (metrics.errorRate > 5) {
      recommendations.push({
        type: 'error_handling',
        description: 'Improve error handling and retry logic',
        impact: 'high',
        effort: 'low',
      });
    }

    // Cache hit rate recommendations
    if (metrics.cacheHitRate < 50) {
      recommendations.push({
        type: 'caching',
        description: 'Increase cache TTL and expand cache coverage',
        impact: 'medium',
        effort: 'low',
      });
    }

    return recommendations;
  },

  /**
   * Check if optimization is needed
   */
  private async checkOptimizationNeeded(metric: PerformanceMetric): Promise<void> {
    // Check thresholds
    const thresholds: Record<string, number> = {
      response_time: 1000, // 1 second
      error_rate: 5, // 5%
      database_query_time: 500, // 500ms
    };

    const threshold = thresholds[metric.metricType];
    if (threshold && metric.metricValue > threshold) {
      logger.warn(`Performance threshold exceeded: ${metric.metricName} = ${metric.metricValue} (threshold: ${threshold})`);
      // TODO: Trigger optimization
    }
  },

  /**
   * Find slow queries
   */
  private async findSlowQueries(): Promise<any[]> {
    // TODO: Query pg_stat_statements or similar
    return [];
  },

  /**
   * Analyze query
   */
  private async analyzeQuery(query: any): Promise<PerformanceOptimization | null> {
    // TODO: Analyze query and suggest optimizations
    return null;
  },

  /**
   * Map database row to PerformanceMetric
   */
  private mapRowToMetric(row: any): PerformanceMetric {
    return {
      id: row.id,
      metricName: row.metric_name,
      metricValue: row.metric_value,
      metricType: row.metric_type,
      endpoint: row.endpoint,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    };
  },

  /**
   * Map database row to CacheStrategy
   */
  private mapRowToCacheStrategy(row: any): CacheStrategy {
    return {
      key: row.key,
      ttl: row.ttl,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : undefined,
      invalidationRules: row.invalidation_rules ? (typeof row.invalidation_rules === 'string' ? JSON.parse(row.invalidation_rules) : row.invalidation_rules) : undefined,
    };
  },
};
