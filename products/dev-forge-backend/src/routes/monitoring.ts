/**
 * Monitoring Dashboard Routes
 * 
 * API routes for monitoring dashboards and alerts.
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { monitoringDashboardService } from '../services/monitoringDashboardService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAlertRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  metric: z.string().min(1, 'Metric is required'),
  threshold: z.number(),
  operator: z.enum(['gt', 'lt', 'eq']),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  enabled: z.boolean().default(true),
  notificationChannels: z.array(z.string()).default([]),
});

/**
 * @route GET /api/monitoring/dashboard
 * @desc Get dashboard metrics
 * @access Private (Admin)
 */
router.get('/dashboard', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await monitoringDashboardService.getDashboardMetrics();
    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error getting dashboard metrics:', error);
    res.status(500).json({ message: error.message || 'Failed to get dashboard metrics' });
  }
});

/**
 * @route POST /api/monitoring/alert-rules
 * @desc Create alert rule
 * @access Private (Admin)
 */
router.post('/alert-rules', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validated = createAlertRuleSchema.parse(req.body);
    const rule = await monitoringDashboardService.createAlertRule(validated);
    res.status(201).json(rule);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    logger.error('Error creating alert rule:', error);
    res.status(500).json({ message: error.message || 'Failed to create alert rule' });
  }
});

/**
 * @route GET /api/monitoring/alert-rules
 * @desc Get alert rules
 * @access Private (Admin)
 */
router.get('/alert-rules', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.query;
    const rules = await monitoringDashboardService.getAlertRules(
      enabled !== undefined ? enabled === 'true' : undefined
    );
    res.status(200).json(rules);
  } catch (error: any) {
    logger.error('Error getting alert rules:', error);
    res.status(500).json({ message: error.message || 'Failed to get alert rules' });
  }
});

/**
 * @route GET /api/monitoring/alerts
 * @desc Get active alerts
 * @access Private (Admin)
 */
router.get('/alerts', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await monitoringDashboardService.getActiveAlerts();
    res.status(200).json(alerts);
  } catch (error: any) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ message: error.message || 'Failed to get alerts' });
  }
});

/**
 * @route POST /api/monitoring/alerts/:alertId/acknowledge
 * @desc Acknowledge alert
 * @access Private (Admin)
 */
router.post('/alerts/:alertId/acknowledge', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const alert = await monitoringDashboardService.acknowledgeAlert(alertId, req.user!.id);
    res.status(200).json(alert);
  } catch (error: any) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({ message: error.message || 'Failed to acknowledge alert' });
  }
});

/**
 * @route POST /api/monitoring/alerts/:alertId/resolve
 * @desc Resolve alert
 * @access Private (Admin)
 */
router.post('/alerts/:alertId/resolve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    const alert = await monitoringDashboardService.resolveAlert(alertId, req.user!.id);
    res.status(200).json(alert);
  } catch (error: any) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ message: error.message || 'Failed to resolve alert' });
  }
});

/**
 * @route POST /api/monitoring/check-alerts
 * @desc Check alert rules and trigger alerts
 * @access Private (Admin)
 */
router.post('/check-alerts', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await monitoringDashboardService.checkAlertRules();
    res.status(200).json({ message: 'Alert rules checked' });
  } catch (error: any) {
    logger.error('Error checking alert rules:', error);
    res.status(500).json({ message: error.message || 'Failed to check alert rules' });
  }
});

export default router;

