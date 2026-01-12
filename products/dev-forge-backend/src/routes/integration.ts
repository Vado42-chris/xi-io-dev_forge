/**
 * Integration Validation Routes
 * 
 * API routes for integration validation and system health.
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { integrationValidationService } from '../services/integrationValidationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @route POST /api/integration/validate
 * @desc Validate all integration points
 * @access Private (Admin)
 */
router.post('/validate', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const report = await integrationValidationService.validateAllIntegrations();
    res.status(200).json(report);
  } catch (error: any) {
    logger.error('Error validating integrations:', error);
    res.status(500).json({ message: error.message || 'Failed to validate integrations' });
  }
});

/**
 * @route GET /api/integration/report
 * @desc Get latest integration validation report
 * @access Private (Admin)
 */
router.get('/report', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const report = await integrationValidationService.getLatestReport();
    
    if (!report) {
      return res.status(404).json({ message: 'No validation report found' });
    }

    res.status(200).json(report);
  } catch (error: any) {
    logger.error('Error getting integration report:', error);
    res.status(500).json({ message: error.message || 'Failed to get integration report' });
  }
});

export default router;

