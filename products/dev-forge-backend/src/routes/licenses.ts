/**
 * License Routes
 * 
 * License management endpoints.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { licenseService } from '../services/licenseService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createLicenseSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['free', 'pro', 'enterprise']),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const activateLicenseSchema = z.object({
  licenseKey: z.string(),
});

const renewLicenseSchema = z.object({
  licenseId: z.string().uuid(),
  newExpiresAt: z.string().datetime(),
});

const revokeLicenseSchema = z.object({
  licenseId: z.string().uuid(),
  reason: z.string().optional(),
});

/**
 * POST /api/licenses
 * Create a new license (admin only)
 */
router.post('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validated = createLicenseSchema.parse(req.body);
    const { userId, type, expiresAt, metadata } = validated;

    const license = await licenseService.createLicense({
      userId,
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata,
    });

    res.status(201).json({ license });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Create license error:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

/**
 * GET /api/licenses
 * Get user's licenses
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const licenses = await licenseService.getUserLicenses(req.user.id);
    res.json({ licenses });
  } catch (error: any) {
    logger.error('Get licenses error:', error);
    res.status(500).json({ error: 'Failed to get licenses' });
  }
});

/**
 * GET /api/licenses/:id
 * Get license by ID
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const license = await licenseService.getLicenseById(req.params.id);

    // Check if user owns the license or is admin
    if (license.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ license });
  } catch (error: any) {
    if (error.message === 'License not found') {
      return res.status(404).json({ error: 'License not found' });
    }
    logger.error('Get license error:', error);
    res.status(500).json({ error: 'Failed to get license' });
  }
});

/**
 * POST /api/licenses/activate
 * Activate a license
 */
router.post('/activate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = activateLicenseSchema.parse(req.body);
    const { licenseKey } = validated;

    const license = await licenseService.activateLicense(licenseKey, req.user.id);

    res.json({ license });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Activate license error:', error);
    res.status(400).json({ error: error.message || 'Failed to activate license' });
  }
});

/**
 * POST /api/licenses/validate
 * Validate a license key
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ error: 'License key required' });
    }

    const result = await licenseService.validateLicense(licenseKey);

    res.json(result);
  } catch (error: any) {
    logger.error('Validate license error:', error);
    res.status(500).json({ error: 'Failed to validate license' });
  }
});

/**
 * POST /api/licenses/:id/renew
 * Renew a license (admin only)
 */
router.post('/:id/renew', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validated = renewLicenseSchema.parse({
      licenseId: req.params.id,
      ...req.body,
    });
    const { licenseId, newExpiresAt } = validated;

    const license = await licenseService.renewLicense(licenseId, new Date(newExpiresAt));

    res.json({ license });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Renew license error:', error);
    res.status(400).json({ error: error.message || 'Failed to renew license' });
  }
});

/**
 * POST /api/licenses/:id/revoke
 * Revoke a license (admin only)
 */
router.post('/:id/revoke', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validated = revokeLicenseSchema.parse({
      licenseId: req.params.id,
      ...req.body,
    });
    const { licenseId, reason } = validated;

    const license = await licenseService.revokeLicense(licenseId, reason);

    res.json({ license });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Revoke license error:', error);
    res.status(500).json({ error: 'Failed to revoke license' });
  }
});

export default router;

