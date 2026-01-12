/**
 * Final Automation Routes
 * 
 * API routes for health monitoring, performance optimization, and security automation.
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { systemHealthMonitoringService } from '../services/systemHealthMonitoringService';
import { performanceOptimizationService } from '../services/performanceOptimizationService';
import { securityAutomationService } from '../services/securityAutomationService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const recordMetricSchema = z.object({
  metricName: z.string().min(1, 'Metric name is required'),
  metricValue: z.number(),
  metricType: z.enum(['response_time', 'throughput', 'error_rate', 'cache_hit_rate', 'database_query_time']),
  endpoint: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const performScanSchema = z.object({
  scanType: z.enum(['vulnerability', 'dependency', 'code', 'configuration', 'compliance']),
  target: z.string().min(1, 'Target is required'),
});

/**
 * @route GET /api/automation/health
 * @desc Get system health status
 * @access Private (Admin)
 */
router.get('/health', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const health = await systemHealthMonitoringService.performHealthCheck();
    res.status(200).json(health);
  } catch (error: any) {
    logger.error('Error getting system health:', error);
    res.status(500).json({ message: error.message || 'Failed to get system health' });
  }
});

/**
 * @route GET /api/automation/health/alerts
 * @desc Get active health alerts
 * @access Private (Admin)
 */
router.get('/health/alerts', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const alerts = await systemHealthMonitoringService.getActiveAlerts();
    res.status(200).json(alerts);
  } catch (error: any) {
    logger.error('Error getting health alerts:', error);
    res.status(500).json({ message: error.message || 'Failed to get health alerts' });
  }
});

/**
 * @route POST /api/automation/health/alerts/:alertId/resolve
 * @desc Resolve health alert
 * @access Private (Admin)
 */
router.post('/health/alerts/:alertId/resolve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { alertId } = req.params;
    await systemHealthMonitoringService.resolveAlert(alertId);
    res.status(200).json({ message: 'Alert resolved successfully' });
  } catch (error: any) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ message: error.message || 'Failed to resolve alert' });
  }
});

/**
 * @route POST /api/automation/performance/metrics
 * @desc Record performance metric
 * @access Private (Authenticated User)
 */
router.post('/performance/metrics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = recordMetricSchema.parse(req.body);
    
    const metric = await performanceOptimizationService.recordMetric(
      validatedBody.metricName,
      validatedBody.metricValue,
      validatedBody.metricType,
      validatedBody.endpoint,
      validatedBody.metadata
    );

    res.status(201).json(metric);
  } catch (error: any) {
    logger.error('Error recording performance metric:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to record metric' });
  }
});

/**
 * @route GET /api/automation/performance/metrics
 * @desc Get performance metrics
 * @access Private (Admin)
 */
router.get('/performance/metrics', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { metricType, startDate, endDate, limit } = req.query;

    const metrics = await performanceOptimizationService.getMetrics(
      metricType as any,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      limit ? parseInt(limit as string) : 100
    );

    res.status(200).json(metrics);
  } catch (error: any) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({ message: error.message || 'Failed to get metrics' });
  }
});

/**
 * @route GET /api/automation/performance/metrics/average
 * @desc Get average performance metrics
 * @access Private (Admin)
 */
router.get('/performance/metrics/average', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { metricType, startDate, endDate } = req.query;

    if (!metricType || !startDate || !endDate) {
      return res.status(400).json({ message: 'metricType, startDate, and endDate are required' });
    }

    const averages = await performanceOptimizationService.getAverageMetrics(
      metricType as any,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(averages);
  } catch (error: any) {
    logger.error('Error getting average metrics:', error);
    res.status(500).json({ message: error.message || 'Failed to get average metrics' });
  }
});

/**
 * @route POST /api/automation/performance/optimize/queries
 * @desc Optimize database queries
 * @access Private (Admin)
 */
router.post('/performance/optimize/queries', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const optimizations = await performanceOptimizationService.optimizeDatabaseQueries();
    res.status(200).json({
      message: 'Query optimization completed',
      count: optimizations.length,
      optimizations,
    });
  } catch (error: any) {
    logger.error('Error optimizing queries:', error);
    res.status(500).json({ message: error.message || 'Failed to optimize queries' });
  }
});

/**
 * @route POST /api/automation/security/scan
 * @desc Perform security scan
 * @access Private (Admin)
 */
router.post('/security/scan', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = performScanSchema.parse(req.body);
    
    const scan = await securityAutomationService.performSecurityScan(
      validatedBody.scanType,
      validatedBody.target
    );

    res.status(200).json(scan);
  } catch (error: any) {
    logger.error('Error performing security scan:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to perform security scan' });
  }
});

/**
 * @route POST /api/automation/security/compliance
 * @desc Perform compliance check
 * @access Private (Admin)
 */
router.post('/security/compliance', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { standard } = z.object({
      standard: z.enum(['GDPR', 'HIPAA', 'PCI-DSS', 'SOC2', 'ISO27001']),
    }).parse(req.body);

    const check = await securityAutomationService.performComplianceCheck(standard);

    res.status(200).json(check);
  } catch (error: any) {
    logger.error('Error performing compliance check:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to perform compliance check' });
  }
});

/**
 * @route POST /api/automation/security/audit
 * @desc Perform security audit
 * @access Private (Admin)
 */
router.post('/security/audit', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { auditType, scope } = z.object({
      auditType: z.enum(['full', 'quick', 'targeted']),
      scope: z.array(z.string()),
    }).parse(req.body);

    const audit = await securityAutomationService.performSecurityAudit(
      auditType,
      scope,
      req.user!.id
    );

    res.status(200).json(audit);
  } catch (error: any) {
    logger.error('Error performing security audit:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to perform security audit' });
  }
});

/**
 * @route GET /api/automation/security/findings
 * @desc Get security findings
 * @access Private (Admin)
 */
router.get('/security/findings', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { severity, limit } = req.query;

    const findings = await securityAutomationService.getSecurityFindings(
      severity as any,
      limit ? parseInt(limit as string) : 50
    );

    res.status(200).json(findings);
  } catch (error: any) {
    logger.error('Error getting security findings:', error);
    res.status(500).json({ message: error.message || 'Failed to get security findings' });
  }
});

export default router;

