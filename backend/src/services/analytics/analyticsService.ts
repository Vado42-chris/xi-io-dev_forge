/**
 * Analytics Service
 * 
 * Handles analytics event tracking and reporting.
 */

import { AnalyticsModel, CreateEventData } from '../../database/models/analyticsModel';

export interface EventInfo {
  id: string;
  user_id?: string;
  event_type: string;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AnalyticsReport {
  total_events: number;
  event_types: Array<{ event_type: string; count: number }>;
  date_range?: {
    start: Date;
    end: Date;
  };
}

export class AnalyticsService {
  private analyticsModel: AnalyticsModel;

  constructor() {
    this.analyticsModel = new AnalyticsModel();
  }

  /**
   * Track an event
   */
  async trackEvent(data: CreateEventData): Promise<string | null> {
    try {
      const eventId = await this.analyticsModel.create(data);
      return eventId;
    } catch (error) {
      console.error('[AnalyticsService] Error tracking event:', error);
      return null;
    }
  }

  /**
   * Get events by user
   */
  async getEventsByUser(userId: string, limit: number = 100, offset: number = 0): Promise<EventInfo[]> {
    try {
      const events = await this.analyticsModel.findByUserId(userId, limit, offset);
      return events.map(event => this.mapToInfo(event));
    } catch (error) {
      console.error('[AnalyticsService] Error getting events by user:', error);
      return [];
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType: string, limit: number = 100, offset: number = 0): Promise<EventInfo[]> {
    try {
      const events = await this.analyticsModel.findByType(eventType, limit, offset);
      return events.map(event => this.mapToInfo(event));
    } catch (error) {
      console.error('[AnalyticsService] Error getting events by type:', error);
      return [];
    }
  }

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startDate: Date, endDate: Date, limit: number = 1000): Promise<EventInfo[]> {
    try {
      const events = await this.analyticsModel.findByDateRange(startDate, endDate, limit);
      return events.map(event => this.mapToInfo(event));
    } catch (error) {
      console.error('[AnalyticsService] Error getting events by date range:', error);
      return [];
    }
  }

  /**
   * Get analytics report
   */
  async getAnalyticsReport(startDate?: Date, endDate?: Date): Promise<AnalyticsReport> {
    try {
      const topEventTypes = await this.analyticsModel.getTopEventTypes(10, startDate, endDate);
      
      // Calculate total events
      let totalEvents = 0;
      for (const eventType of topEventTypes) {
        totalEvents += eventType.count;
      }

      return {
        total_events: totalEvents,
        event_types: topEventTypes,
        date_range: startDate && endDate ? { start: startDate, end: endDate } : undefined,
      };
    } catch (error) {
      console.error('[AnalyticsService] Error getting analytics report:', error);
      return {
        total_events: 0,
        event_types: [],
      };
    }
  }

  /**
   * Get event count by type
   */
  async getEventCount(eventType: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      return await this.analyticsModel.getEventCountByType(eventType, startDate, endDate);
    } catch (error) {
      console.error('[AnalyticsService] Error getting event count:', error);
      return 0;
    }
  }

  /**
   * Map AnalyticsEventRow to EventInfo
   */
  private mapToInfo(event: any): EventInfo {
    return {
      id: event.id,
      user_id: event.user_id,
      event_type: event.event_type,
      event_data: event.event_data,
      ip_address: event.ip_address,
      user_agent: event.user_agent,
      created_at: event.created_at,
    };
  }
}

