/**
 * Financial Routes
 * 
 * API routes for financial services (revenue sharing, payouts, tax, reporting).
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { revenueSharingService } from '../services/revenueSharingService';
import { payoutAutomationService } from '../services/payoutAutomationService';
import { taxReportingService } from '../services/taxReportingService';
import { financialReportingService } from '../services/financialReportingService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const recordRevenueShareSchema = z.object({
  extensionId: z.string().uuid('Invalid extension ID'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  amount: z.number().positive('Amount must be positive').int('Amount must be in cents'),
  platformFeePercentage: z.number().min(0).max(100).optional().default(30),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

const generateTaxReportSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  quarter: z.number().int().min(1).max(4).optional(),
});

const generateFinancialReportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

/**
 * @route GET /api/financial/revenue-shares
 * @desc Get developer's revenue shares
 * @access Private (Authenticated Developer)
 */
router.get('/revenue-shares', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const revenueShares = await revenueSharingService.getDeveloperRevenueShares(
      req.user!.id,
      status as any,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.status(200).json(revenueShares);
  } catch (error: any) {
    logger.error('Error getting revenue shares:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve revenue shares' });
  }
});

/**
 * @route GET /api/financial/payout-summary
 * @desc Get developer's payout summary
 * @access Private (Authenticated Developer)
 */
router.get('/payout-summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const summary = await revenueSharingService.getPayoutSummary(
      req.user!.id,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(summary);
  } catch (error: any) {
    logger.error('Error getting payout summary:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve payout summary' });
  }
});

/**
 * @route POST /api/financial/revenue-shares
 * @desc Record revenue share (Admin/System only)
 * @access Private (Admin)
 */
router.post('/revenue-shares', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = recordRevenueShareSchema.parse(req.body);
    
    const revenueShare = await revenueSharingService.recordRevenueShare(
      validatedBody.extensionId,
      req.body.developerId || req.user!.id,
      validatedBody.transactionId,
      validatedBody.amount,
      validatedBody.platformFeePercentage,
      new Date(validatedBody.periodStart),
      new Date(validatedBody.periodEnd)
    );

    res.status(201).json(revenueShare);
  } catch (error: any) {
    logger.error('Error recording revenue share:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to record revenue share' });
  }
});

/**
 * @route POST /api/financial/payouts/process
 * @desc Process automatic payouts (Admin/System only)
 * @access Private (Admin)
 */
router.post('/payouts/process', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const schedule = req.body.schedule || {
      frequency: 'monthly',
      dayOfMonth: 1,
      minimumAmount: 10000,
    };

    const payouts = await payoutAutomationService.processAutomaticPayouts(schedule);

    res.status(200).json({
      message: 'Payouts processed successfully',
      count: payouts.length,
      payouts,
    });
  } catch (error: any) {
    logger.error('Error processing payouts:', error);
    res.status(500).json({ message: error.message || 'Failed to process payouts' });
  }
});

/**
 * @route GET /api/financial/tax-report
 * @desc Get tax report for developer
 * @access Private (Authenticated Developer)
 */
router.get('/tax-report', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { year, quarter } = req.query;

    if (!year) {
      return res.status(400).json({ message: 'year is required' });
    }

    const report = await taxReportingService.generateTaxReport(
      req.user!.id,
      parseInt(year as string),
      quarter ? parseInt(quarter as string) : undefined
    );

    res.status(200).json(report);
  } catch (error: any) {
    logger.error('Error generating tax report:', error);
    res.status(500).json({ message: error.message || 'Failed to generate tax report' });
  }
});

/**
 * @route POST /api/financial/tax-form
 * @desc Generate tax form for developer
 * @access Private (Authenticated Developer)
 */
router.post('/tax-form', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { year, formType } = z.object({
      year: z.number().int().min(2020).max(2100),
      formType: z.enum(['1099-NEC', '1099-MISC', 'W-9', 'W-8BEN']).optional().default('1099-NEC'),
    }).parse(req.body);

    const form = await taxReportingService.generateTaxForm(
      req.user!.id,
      year,
      formType
    );

    res.status(200).json(form);
  } catch (error: any) {
    logger.error('Error generating tax form:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to generate tax form' });
  }
});

/**
 * @route GET /api/financial/report
 * @desc Get financial report (Admin only)
 * @access Private (Admin)
 */
router.get('/report', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const report = await financialReportingService.generateFinancialReport(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(report);
  } catch (error: any) {
    logger.error('Error generating financial report:', error);
    res.status(500).json({ message: error.message || 'Failed to generate financial report' });
  }
});

/**
 * @route GET /api/financial/developer-summary
 * @desc Get developer financial summary (Admin or Self)
 * @access Private (Authenticated User)
 */
router.get('/developer-summary/:developerId?', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const developerId = req.params.developerId || req.user!.id;
    
    // Only admin can view other developers' summaries
    if (req.user!.role !== 'admin' && req.user!.id !== developerId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own summary' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const summary = await financialReportingService.generateDeveloperSummary(
      developerId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.status(200).json(summary);
  } catch (error: any) {
    logger.error('Error getting developer summary:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve developer summary' });
  }
});

/**
 * @route GET /api/financial/revenue-trends
 * @desc Get revenue trends (Admin only)
 * @access Private (Admin)
 */
router.get('/revenue-trends', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, granularity } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const trends = await financialReportingService.getRevenueTrends(
      new Date(startDate as string),
      new Date(endDate as string),
      (granularity as 'daily' | 'weekly' | 'monthly') || 'monthly'
    );

    res.status(200).json(trends);
  } catch (error: any) {
    logger.error('Error getting revenue trends:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve revenue trends' });
  }
});

export default router;

