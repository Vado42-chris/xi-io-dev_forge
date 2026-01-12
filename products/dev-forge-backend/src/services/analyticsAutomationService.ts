/**
 * Analytics Automation Service
 * 
 * Automated analytics collection, tracking, and aggregation.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  properties: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AnalyticsMetric {
  id: string;
  metricName: string;
  metricValue: number;
  metricType: 'counter' | 'gauge' | 'histogram' | 'summary';
  tags: Record<string, string>;
  timestamp: Date;
}

export interface AnalyticsAggregation {
  metricName: string;
  period: {
    start: Date;
    end: Date;
  };
  value: number;
  count: number;
  average?: number;
  min?: number;
  max?: number;
  percentiles?: Record<number, number>;
}

export const analyticsAutomationService = {
  /**
   * Track an analytics event
   */
  async trackEvent(
    eventType: string,
    properties: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): Promise<AnalyticsEvent> {
    try {
      const event: AnalyticsEvent = {
        id: uuidv4(),
        eventType,
        userId,
        sessionId,
        properties,
        timestamp: new Date(),
      };

      await pool.query(
        `INSERT INTO analytics_events (id, event_type, user_id, session_id, properties, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [event.id, eventType, userId || null, sessionId || null, JSON.stringify(properties), event.timestamp]
      );

      logger.info(`Analytics event tracked: ${eventType}`, { eventId: event.id });
      return event;
    } catch (error: any) {
      logger.error(`Error tracking analytics event:`, error);
      throw new Error(`Failed to track event: ${error.message}`);
    }
  },

  /**
   * Record a metric
   */
  async recordMetric(
    metricName: string,
    metricValue: number,
    metricType: AnalyticsMetric['metricType'] = 'gauge',
    tags: Record<string, string> = {}
  ): Promise<AnalyticsMetric> {
    try {
      const metric: AnalyticsMetric = {
        id: uuidv4(),
        metricName,
        metricValue,
        metricType,
        tags,
        timestamp: new Date(),
      };

      await pool.query(
        `INSERT INTO analytics_metrics (id, metric_name, metric_value, metric_type, tags, timestamp, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [metric.id, metricName, metricValue, metricType, JSON.stringify(tags), metric.timestamp]
      );

      logger.debug(`Metric recorded: ${metricName} = ${metricValue}`);
      return metric;
    } catch (error: any) {
      logger.error(`Error recording metric:`, error);
      throw new Error(`Failed to record metric: ${error.message}`);
    }
  },

  /**
   * Get event count for a specific event type
   */
  async getEventCount(
    eventType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as count FROM analytics_events WHERE event_type = $1`;
      const params: any[] = [eventType];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }

      const result = await pool.query(query, params);
      return parseInt(result.rows[0].count || '0');
    } catch (error: any) {
      logger.error(`Error getting event count:`, error);
      throw new Error(`Failed to get event count: ${error.message}`);
    }
  },

  /**
   * Get events by type
   */
  async getEventsByType(
    eventType: string,
    limit: number = 100,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    try {
      let query = `SELECT * FROM analytics_events WHERE event_type = $1`;
      const params: any[] = [eventType];
      let paramIndex = 2;

      if (startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(endDate);
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows.map(this.mapRowToEvent);
    } catch (error: any) {
      logger.error(`Error getting events by type:`, error);
      throw new Error(`Failed to get events: ${error.message}`);
    }
  },

  /**
   * Aggregate metrics for a period
   */
  async aggregateMetrics(
    metricName: string,
    startDate: Date,
    endDate: Date,
    aggregationType: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
  ): Promise<AnalyticsAggregation> {
    try {
      let aggregationFunction: string;
      switch (aggregationType) {
        case 'sum':
          aggregationFunction = 'SUM(metric_value)';
          break;
        case 'avg':
          aggregationFunction = 'AVG(metric_value)';
          break;
        case 'min':
          aggregationFunction = 'MIN(metric_value)';
          break;
        case 'max':
          aggregationFunction = 'MAX(metric_value)';
          break;
        case 'count':
          aggregationFunction = 'COUNT(*)';
          break;
        default:
          aggregationFunction = 'SUM(metric_value)';
      }

      const result = await pool.query(
        `SELECT 
          ${aggregationFunction} as value,
          COUNT(*) as count,
          AVG(metric_value) as average,
          MIN(metric_value) as min,
          MAX(metric_value) as max
         FROM analytics_metrics
         WHERE metric_name = $1 AND timestamp >= $2 AND timestamp <= $3`,
        [metricName, startDate, endDate]
      );

      const row = result.rows[0];

      return {
        metricName,
        period: {
          start: startDate,
          end: endDate,
        },
        value: parseFloat(row.value || '0'),
        count: parseInt(row.count || '0'),
        average: row.average ? parseFloat(row.average) : undefined,
        min: row.min ? parseFloat(row.min) : undefined,
        max: row.max ? parseFloat(row.max) : undefined,
      };
    } catch (error: any) {
      logger.error(`Error aggregating metrics:`, error);
      throw new Error(`Failed to aggregate metrics: ${error.message}`);
    }
  },

  /**
   * Get user activity metrics
   */
  async getUserActivityMetrics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number;
    uniqueEventTypes: number;
    sessions: number;
    mostActiveDay: string;
  }> {
    try {
      const result = await pool.query(
        `SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT event_type) as unique_event_types,
          COUNT(DISTINCT session_id) as sessions,
          DATE(timestamp) as day,
          COUNT(*) as day_count
         FROM analytics_events
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
         GROUP BY DATE(timestamp)
         ORDER BY day_count DESC
         LIMIT 1`,
        [userId, startDate, endDate]
      );

      const summary = await pool.query(
        `SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT event_type) as unique_event_types,
          COUNT(DISTINCT session_id) as sessions
         FROM analytics_events
         WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
        [userId, startDate, endDate]
      );

      const summaryRow = summary.rows[0];
      const mostActiveDay = result.rows.length > 0 ? result.rows[0].day : null;

      return {
        totalEvents: parseInt(summaryRow.total_events || '0'),
        uniqueEventTypes: parseInt(summaryRow.unique_event_types || '0'),
        sessions: parseInt(summaryRow.sessions || '0'),
        mostActiveDay: mostActiveDay || '',
      };
    } catch (error: any) {
      logger.error(`Error getting user activity metrics:`, error);
      throw new Error(`Failed to get user activity metrics: ${error.message}`);
    }
  },

  /**
   * Map database row to AnalyticsEvent
   */
  private mapRowToEvent(row: any): AnalyticsEvent {
    return {
      id: row.id,
      eventType: row.event_type,
      userId: row.user_id,
      sessionId: row.session_id,
      properties: typeof row.properties === 'string' ? JSON.parse(row.properties) : row.properties,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
    };
  },
};

