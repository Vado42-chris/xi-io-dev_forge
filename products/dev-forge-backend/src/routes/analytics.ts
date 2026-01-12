/**
 * Analytics Routes
 * 
 * API routes for analytics, BI, metrics, and reporting.
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { analyticsAutomationService } from '../services/analyticsAutomationService';
import { businessIntelligenceService } from '../services/businessIntelligenceService';
import { metricsCollectionService } from '../services/metricsCollectionService';
import { reportingAutomationService } from '../services/reportingAutomationService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const trackEventSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  properties: z.record(z.any()).optional().default({}),
  sessionId: z.string().optional(),
});

const recordMetricSchema = z.object({
  metricName: z.string().min(1, 'Metric name is required'),
  value: z.number(),
  metricType: z.enum(['counter', 'gauge', 'histogram', 'summary']).optional().default('gauge'),
  tags: z.record(z.string()).optional().default({}),
});

const registerMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required'),
  type: z.enum(['counter', 'gauge', 'histogram', 'summary']),
  description: z.string(),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  enabled: z.boolean().optional().default(true),
  collectionInterval: z.number().optional(),
  retentionPeriod: z.number().optional(),
});

const createReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.enum(['financial', 'analytics', 'user', 'extension', 'custom']),
  template: z.string(),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().optional(),
    timezone: z.string().optional(),
  }).optional(),
  recipients: z.array(z.string()).optional().default([]),
  format: z.enum(['pdf', 'csv', 'json', 'html']).optional().default('json'),
  enabled: z.boolean().optional().default(true),
  parameters: z.record(z.any()).optional(),
});

/**
 * @route POST /api/analytics/events
 * @desc Track an analytics event
 * @access Private (Authenticated User)
 */
router.post('/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = trackEventSchema.parse(req.body);
    
    const event = await analyticsAutomationService.trackEvent(
      validatedBody.eventType,
      validatedBody.properties,
      req.user!.id,
      validatedBody.sessionId
    );

    res.status(201).json(event);
  } catch (error: any) {
    logger.error('Error tracking event:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to track event' });
  }
});

/**
 * @route GET /api/analytics/events/:eventType
 * @desc Get events by type
 * @access Private (Authenticated User)
 */
router.get('/events/:eventType', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { eventType } = req.params;
    const { limit, offset, startDate, endDate } = req.query;

    const events = await analyticsAutomationService.getEventsByType(
      eventType,
      limit ? parseInt(limit as string) : 100,
      offset ? parseInt(offset as string) : 0,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json(events);
  } catch (error: any) {
    logger.error('Error getting events:', error);
    res.status(500).json({ message: error.message || 'Failed to get events' });
  }
});

/**
 * @route GET /api/analytics/events/:eventType/count
 * @desc Get event count
 * @access Private (Authenticated User)
 */
router.get('/events/:eventType/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { eventType } = req.params;
    const { startDate, endDate } = req.query;

    const count = await analyticsAutomationService.getEventCount(
      eventType,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json({ eventType, count });
  } catch (error: any) {
    logger.error('Error getting event count:', error);
    res.status(500).json({ message: error.message || 'Failed to get event count' });
  }
});

/**
 * @route POST /api/analytics/metrics
 * @desc Record a metric
 * @access Private (Authenticated User)
 */
router.post('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = recordMetricSchema.parse(req.body);
    
    const metric = await metricsCollectionService.collectMetric(
      validatedBody.metricName,
      validatedBody.value,
      validatedBody.tags,
      { userId: req.user!.id }
    );

    res.status(201).json(metric);
  } catch (error: any) {
    logger.error('Error recording metric:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to record metric' });
  }
});

/**
 * @route POST /api/analytics/metrics/register
 * @desc Register a metric definition
 * @access Private (Admin)
 */
router.post('/metrics/register', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = registerMetricSchema.parse(req.body);
    
    const metric = await metricsCollectionService.registerMetric(validatedBody);

    res.status(201).json(metric);
  } catch (error: any) {
    logger.error('Error registering metric:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to register metric' });
  }
});

/**
 * @route GET /api/analytics/metrics
 * @desc Get all registered metrics
 * @access Private (Authenticated User)
 */
router.get('/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await metricsCollectionService.getAllMetrics();
    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ message: error.message || 'Failed to get metrics' });
  }
});

/**
 * @route GET /api/analytics/metrics/:metricName/timeseries
 * @desc Get metric time series
 * @access Private (Authenticated User)
 */
router.get('/metrics/:metricName/timeseries', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { metricName } = req.params;
    const { startDate, endDate, granularity } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const timeSeries = await metricsCollectionService.getMetricTimeSeries(
      metricName,
      new Date(startDate as string),
      new Date(endDate as string),
      (granularity as 'minute' | 'hour' | 'day' | 'week' | 'month') || 'hour'
    );

    res.status(200).json(timeSeries);
  } catch (error: any) {
    logger.error('Error getting metric time series:', error);
    res.status(500).json({ message: error.message || 'Failed to get metric time series' });
  }
});

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard data
 * @access Private (Admin)
 */
router.get('/dashboard', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const dashboard = await businessIntelligenceService.generateDashboardData(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(dashboard);
  } catch (error: any) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({ message: error.message || 'Failed to get dashboard data' });
  }
});

/**
 * @route GET /api/analytics/insights
 * @desc Get business insights
 * @access Private (Admin)
 */
router.get('/insights', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const insights = await businessIntelligenceService.generateInsights(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(insights);
  } catch (error: any) {
    logger.error('Error getting insights:', error);
    res.status(500).json({ message: error.message || 'Failed to get insights' });
  }
});

/**
 * @route GET /api/analytics/user-activity/:userId
 * @desc Get user activity metrics
 * @access Private (Admin or Self)
 */
router.get('/user-activity/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Only admin can view other users' activity
    if (req.user!.role !== 'admin' && req.user!.id !== userId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own activity' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const metrics = await analyticsAutomationService.getUserActivityMetrics(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error getting user activity:', error);
    res.status(500).json({ message: error.message || 'Failed to get user activity' });
  }
});

/**
 * @route POST /api/analytics/reports
 * @desc Create a report definition
 * @access Private (Admin)
 */
router.post('/reports', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = createReportSchema.parse(req.body);
    
    const report = await reportingAutomationService.createReportDefinition(validatedBody);

    res.status(201).json(report);
  } catch (error: any) {
    logger.error('Error creating report definition:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create report definition' });
  }
});

/**
 * @route GET /api/analytics/reports
 * @desc Get all report definitions
 * @access Private (Admin)
 */
router.get('/reports', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const reports = await reportingAutomationService.getAllReportDefinitions();
    res.status(200).json(reports);
  } catch (error: any) {
    logger.error('Error getting report definitions:', error);
    res.status(500).json({ message: error.message || 'Failed to get report definitions' });
  }
});

/**
 * @route POST /api/analytics/reports/:reportId/generate
 * @desc Generate a report
 * @access Private (Admin)
 */
router.post('/reports/:reportId/generate', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { startDate, endDate, format } = req.body;

    const period = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;

    const report = await reportingAutomationService.generateReport(
      reportId,
      period,
      format
    );

    res.status(200).json(report);
  } catch (error: any) {
    logger.error('Error generating report:', error);
    res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
});

/**
 * @route GET /api/analytics/reports/generated
 * @desc Get generated reports
 * @access Private (Admin)
 */
router.get('/reports/generated', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { reportDefinitionId, limit, offset } = req.query;

    const reports = await reportingAutomationService.getGeneratedReports(
      reportDefinitionId as string | undefined,
      limit ? parseInt(limit as string) : 50,
      offset ? parseInt(offset as string) : 0
    );

    res.status(200).json(reports);
  } catch (error: any) {
    logger.error('Error getting generated reports:', error);
    res.status(500).json({ message: error.message || 'Failed to get generated reports' });
  }
});

/**
 * @route POST /api/analytics/reports/process-scheduled
 * @desc Process scheduled reports (Admin/System only)
 * @access Private (Admin)
 */
router.post('/reports/process-scheduled', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const reports = await reportingAutomationService.processScheduledReports();

    res.status(200).json({
      message: 'Scheduled reports processed',
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    logger.error('Error processing scheduled reports:', error);
    res.status(500).json({ message: error.message || 'Failed to process scheduled reports' });
  }
});

export default router;

