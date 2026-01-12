/**
 * Business Intelligence Service
 * 
 * Automated business intelligence, KPIs, and insights generation.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { analyticsAutomationService } from './analyticsAutomationService';
import { revenueSharingService } from './revenueSharingService';

const pool = getPool();

export interface KPI {
  name: string;
  value: number;
  target?: number;
  trend: 'up' | 'down' | 'stable';
  change: number; // Percentage change
  period: {
    start: Date;
    end: Date;
  };
}

export interface DashboardData {
  period: {
    start: Date;
    end: Date;
  };
  kpis: KPI[];
  revenue: {
    total: number;
    growth: number;
    breakdown: {
      extensions: number;
      licenses: number;
      subscriptions: number;
    };
  };
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  extensions: {
    total: number;
    active: number;
    new: number;
    downloads: number;
  };
  engagement: {
    averageSessionDuration: number;
    eventsPerUser: number;
    retentionRate: number;
  };
  topExtensions: Array<{
    extensionId: string;
    name: string;
    downloads: number;
    revenue: number;
  }>;
  topDevelopers: Array<{
    developerId: string;
    name: string;
    extensions: number;
    revenue: number;
  }>;
}

export interface Insight {
  id: string;
  type: 'revenue' | 'users' | 'engagement' | 'performance' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  generatedAt: Date;
}

export const businessIntelligenceService = {
  /**
   * Generate dashboard data
   */
  async generateDashboardData(
    startDate: Date,
    endDate: Date
  ): Promise<DashboardData> {
    try {
      logger.info(`Generating dashboard data for period ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Get KPIs
      const kpis = await this.calculateKPIs(startDate, endDate);

      // Get revenue data
      const revenue = await this.calculateRevenueMetrics(startDate, endDate);

      // Get user metrics
      const users = await this.calculateUserMetrics(startDate, endDate);

      // Get extension metrics
      const extensions = await this.calculateExtensionMetrics(startDate, endDate);

      // Get engagement metrics
      const engagement = await this.calculateEngagementMetrics(startDate, endDate);

      // Get top extensions
      const topExtensions = await this.getTopExtensions(10, startDate, endDate);

      // Get top developers
      const topDevelopers = await this.getTopDevelopers(10, startDate, endDate);

      return {
        period: {
          start: startDate,
          end: endDate,
        },
        kpis,
        revenue,
        users,
        extensions,
        engagement,
        topExtensions,
        topDevelopers,
      };
    } catch (error: any) {
      logger.error('Error generating dashboard data:', error);
      throw new Error(`Failed to generate dashboard data: ${error.message}`);
    }
  },

  /**
   * Calculate KPIs
   */
  async calculateKPIs(startDate: Date, endDate: Date): Promise<KPI[]> {
    const kpis: KPI[] = [];

    // Previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodDuration);
    const previousEnd = startDate;

    // Revenue KPI
    const currentRevenue = await this.getTotalRevenue(startDate, endDate);
    const previousRevenue = await this.getTotalRevenue(previousStart, previousEnd);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    kpis.push({
      name: 'Total Revenue',
      value: currentRevenue,
      target: currentRevenue * 1.1, // 10% growth target
      trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'stable',
      change: revenueGrowth,
      period: { start: startDate, end: endDate },
    });

    // Active Users KPI
    const currentUsers = await this.getActiveUsers(startDate, endDate);
    const previousUsers = await this.getActiveUsers(previousStart, previousEnd);
    const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

    kpis.push({
      name: 'Active Users',
      value: currentUsers,
      target: currentUsers * 1.15, // 15% growth target
      trend: userGrowth > 0 ? 'up' : userGrowth < 0 ? 'down' : 'stable',
      change: userGrowth,
      period: { start: startDate, end: endDate },
    });

    // Extension Downloads KPI
    const currentDownloads = await this.getTotalDownloads(startDate, endDate);
    const previousDownloads = await this.getTotalDownloads(previousStart, previousEnd);
    const downloadGrowth = previousDownloads > 0 ? ((currentDownloads - previousDownloads) / previousDownloads) * 100 : 0;

    kpis.push({
      name: 'Extension Downloads',
      value: currentDownloads,
      target: currentDownloads * 1.2, // 20% growth target
      trend: downloadGrowth > 0 ? 'up' : downloadGrowth < 0 ? 'down' : 'stable',
      change: downloadGrowth,
      period: { start: startDate, end: endDate },
    });

    return kpis;
  },

  /**
   * Generate insights
   */
  async generateInsights(
    startDate: Date,
    endDate: Date
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Revenue insights
    const revenueInsights = await this.analyzeRevenue(startDate, endDate);
    insights.push(...revenueInsights);

    // User insights
    const userInsights = await this.analyzeUsers(startDate, endDate);
    insights.push(...userInsights);

    // Engagement insights
    const engagementInsights = await this.analyzeEngagement(startDate, endDate);
    insights.push(...engagementInsights);

    // Performance insights
    const performanceInsights = await this.analyzePerformance(startDate, endDate);
    insights.push(...performanceInsights);

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  },

  /**
   * Calculate revenue metrics
   */
  private async calculateRevenueMetrics(startDate: Date, endDate: Date): Promise<DashboardData['revenue']> {
    const total = await this.getTotalRevenue(startDate, endDate);
    const previousTotal = await this.getTotalRevenue(
      new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
      startDate
    );
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    // TODO: Get breakdown from actual revenue data
    return {
      total,
      growth,
      breakdown: {
        extensions: total * 0.7, // Estimate
        licenses: total * 0.2,
        subscriptions: total * 0.1,
      },
    };
  },

  /**
   * Calculate user metrics
   */
  private async calculateUserMetrics(startDate: Date, endDate: Date): Promise<DashboardData['users']> {
    const total = await this.getTotalUsers();
    const active = await this.getActiveUsers(startDate, endDate);
    const newUsers = await this.getNewUsers(startDate, endDate);
    const previousActive = await this.getActiveUsers(
      new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
      startDate
    );
    const growth = previousActive > 0 ? ((active - previousActive) / previousActive) * 100 : 0;

    return {
      total,
      active,
      new: newUsers,
      growth,
    };
  },

  /**
   * Calculate extension metrics
   */
  private async calculateExtensionMetrics(startDate: Date, endDate: Date): Promise<DashboardData['extensions']> {
    const total = await this.getTotalExtensions();
    const active = await this.getActiveExtensions(startDate, endDate);
    const newExtensions = await this.getNewExtensions(startDate, endDate);
    const downloads = await this.getTotalDownloads(startDate, endDate);

    return {
      total,
      active,
      new: newExtensions,
      downloads,
    };
  },

  /**
   * Calculate engagement metrics
   */
  private async calculateEngagementMetrics(startDate: Date, endDate: Date): Promise<DashboardData['engagement']> {
    // TODO: Calculate from actual analytics data
    return {
      averageSessionDuration: 0,
      eventsPerUser: 0,
      retentionRate: 0,
    };
  },

  /**
   * Get top extensions
   */
  private async getTopExtensions(limit: number, startDate?: Date, endDate?: Date): Promise<DashboardData['topExtensions']> {
    // TODO: Query from actual data
    return [];
  },

  /**
   * Get top developers
   */
  private async getTopDevelopers(limit: number, startDate?: Date, endDate?: Date): Promise<DashboardData['topDevelopers']> {
    // TODO: Query from actual data
    return [];
  },

  /**
   * Helper methods for data retrieval
   */
  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Query from revenue_shares table
    return 0;
  },

  private async getActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
       WHERE timestamp >= $1 AND timestamp <= $2 AND user_id IS NOT NULL`,
      [startDate, endDate]
    );
    return parseInt(result.rows[0].count || '0');
  },

  private async getTotalUsers(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) as count FROM users`);
    return parseInt(result.rows[0].count || '0');
  },

  private async getNewUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    );
    return parseInt(result.rows[0].count || '0');
  },

  private async getTotalExtensions(): Promise<number> {
    const result = await pool.query(`SELECT COUNT(*) as count FROM extensions`);
    return parseInt(result.rows[0].count || '0');
  },

  private async getActiveExtensions(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Define "active" - extensions with downloads in period
    return 0;
  },

  private async getNewExtensions(startDate: Date, endDate: Date): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM extensions WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    );
    return parseInt(result.rows[0].count || '0');
  },

  private async getTotalDownloads(startDate: Date, endDate: Date): Promise<number> {
    return await analyticsAutomationService.getEventCount('extension.downloaded', startDate, endDate);
  },

  /**
   * Analysis methods for insights
   */
  private async analyzeRevenue(startDate: Date, endDate: Date): Promise<Insight[]> {
    const insights: Insight[] = [];
    // TODO: Implement revenue analysis
    return insights;
  },

  private async analyzeUsers(startDate: Date, endDate: Date): Promise<Insight[]> {
    const insights: Insight[] = [];
    // TODO: Implement user analysis
    return insights;
  },

  private async analyzeEngagement(startDate: Date, endDate: Date): Promise<Insight[]> {
    const insights: Insight[] = [];
    // TODO: Implement engagement analysis
    return insights;
  },

  private async analyzePerformance(startDate: Date, endDate: Date): Promise<Insight[]> {
    const insights: Insight[] = [];
    // TODO: Implement performance analysis
    return insights;
  },
};

