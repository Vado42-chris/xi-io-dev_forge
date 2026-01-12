/**
 * Distribution Routes
 * 
 * API routes for CDN, version management, updates, and rollbacks.
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { cdnIntegrationService } from '../services/cdnIntegrationService';
import { versionManagementService } from '../services/versionManagementService';
import { updateDistributionService } from '../services/updateDistributionService';
import { rollbackAutomationService } from '../services/rollbackAutomationService';
import { logger } from '../utils/logger';
import { z } from 'zod';
// Note: multer needs to be installed: npm install multer @types/multer
// For now, using a placeholder - file upload will be implemented with actual multer
const router = Router();
// const upload = multer({ dest: 'uploads/' });

// Validation schemas
const createVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+/, 'Invalid semantic version'),
  extensionId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  changelog: z.array(z.object({
    type: z.enum(['added', 'changed', 'deprecated', 'removed', 'fixed', 'security']),
    description: z.string(),
    scope: z.string().optional(),
    breaking: z.boolean().optional(),
  })).optional(),
  releaseNotes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const createUpdatePackageSchema = z.object({
  fromVersion: z.string(),
  toVersion: z.string(),
  extensionId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  isDelta: z.boolean().optional().default(false),
  deltaFromVersion: z.string().optional(),
  releaseNotes: z.string().optional(),
});

const createRollbackPlanSchema = z.object({
  fromVersion: z.string(),
  toVersion: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  extensionId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  rollbackStrategy: z.enum(['immediate', 'gradual', 'scheduled']).optional().default('immediate'),
  scheduledAt: z.string().datetime().optional(),
});

/**
 * @route POST /api/distribution/cdn/upload
 * @desc Upload file to CDN
 * @access Private (Admin)
 */
router.post('/cdn/upload', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Implement file upload with multer
    // For now, expecting file path in request body
    const { filePath, fileName, cacheControl, expiresAt, metadata } = req.body;

    if (!filePath || !fileName) {
      return res.status(400).json({ message: 'filePath and fileName are required' });
    }

    const cdnFile = await cdnIntegrationService.uploadFile(
      filePath,
      fileName,
      {
        cacheControl,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata: metadata ? JSON.parse(metadata) : undefined,
      }
    );

    res.status(201).json(cdnFile);
  } catch (error: any) {
    logger.error('Error uploading file to CDN:', error);
    res.status(500).json({ message: error.message || 'Failed to upload file to CDN' });
  }
});

/**
 * @route GET /api/distribution/cdn/files/:fileId
 * @desc Get CDN file
 * @access Private (Authenticated User)
 */
router.get('/cdn/files/:fileId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const file = await cdnIntegrationService.getFile(fileId);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.status(200).json(file);
  } catch (error: any) {
    logger.error('Error getting CDN file:', error);
    res.status(500).json({ message: error.message || 'Failed to get CDN file' });
  }
});

/**
 * @route DELETE /api/distribution/cdn/files/:fileId
 * @desc Delete file from CDN
 * @access Private (Admin)
 */
router.delete('/cdn/files/:fileId', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    await cdnIntegrationService.deleteFile(fileId);

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting CDN file:', error);
    res.status(500).json({ message: error.message || 'Failed to delete CDN file' });
  }
});

/**
 * @route POST /api/distribution/cdn/files/:fileId/invalidate
 * @desc Invalidate CDN cache
 * @access Private (Admin)
 */
router.post('/cdn/files/:fileId/invalidate', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const { paths } = req.body;

    await cdnIntegrationService.invalidateCache(fileId, paths);

    res.status(200).json({ message: 'Cache invalidated successfully' });
  } catch (error: any) {
    logger.error('Error invalidating CDN cache:', error);
    res.status(500).json({ message: error.message || 'Failed to invalidate cache' });
  }
});

/**
 * @route POST /api/distribution/versions
 * @desc Create a new version
 * @access Private (Admin)
 */
router.post('/versions', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = createVersionSchema.parse(req.body);
    
    const version = await versionManagementService.createVersion(
      validatedBody.version,
      validatedBody.extensionId,
      validatedBody.productId,
      validatedBody.changelog,
      validatedBody.releaseNotes,
      validatedBody.metadata
    );

    res.status(201).json(version);
  } catch (error: any) {
    logger.error('Error creating version:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create version' });
  }
});

/**
 * @route GET /api/distribution/versions
 * @desc Get versions
 * @access Private (Authenticated User)
 */
router.get('/versions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { extensionId, productId, includePrerelease } = req.query;

    const versions = await versionManagementService.getVersions(
      extensionId as string | undefined,
      productId as string | undefined,
      includePrerelease === 'true'
    );

    res.status(200).json(versions);
  } catch (error: any) {
    logger.error('Error getting versions:', error);
    res.status(500).json({ message: error.message || 'Failed to get versions' });
  }
});

/**
 * @route GET /api/distribution/versions/latest
 * @desc Get latest version
 * @access Private (Authenticated User)
 */
router.get('/versions/latest', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { extensionId, productId, includePrerelease } = req.query;

    const version = await versionManagementService.getLatestVersion(
      extensionId as string | undefined,
      productId as string | undefined,
      includePrerelease === 'true'
    );

    if (!version) {
      return res.status(404).json({ message: 'No version found' });
    }

    res.status(200).json(version);
  } catch (error: any) {
    logger.error('Error getting latest version:', error);
    res.status(500).json({ message: error.message || 'Failed to get latest version' });
  }
});

/**
 * @route GET /api/distribution/versions/:versionId
 * @desc Get version by ID
 * @access Private (Authenticated User)
 */
router.get('/versions/:versionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { versionId } = req.params;
    const version = await versionManagementService.getVersion(versionId);

    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    res.status(200).json(version);
  } catch (error: any) {
    logger.error('Error getting version:', error);
    res.status(500).json({ message: error.message || 'Failed to get version' });
  }
});

/**
 * @route POST /api/distribution/versions/compare
 * @desc Compare two versions
 * @access Private (Authenticated User)
 */
router.post('/versions/compare', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { version1, version2 } = z.object({
      version1: z.string(),
      version2: z.string(),
    }).parse(req.body);

    const comparison = versionManagementService.compareVersions(version1, version2);

    res.status(200).json(comparison);
  } catch (error: any) {
    logger.error('Error comparing versions:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to compare versions' });
  }
});

/**
 * @route POST /api/distribution/updates/check
 * @desc Check for available updates
 * @access Private (Authenticated User)
 */
router.post('/updates/check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentVersion, extensionId, productId } = z.object({
      currentVersion: z.string(),
      extensionId: z.string().uuid().optional(),
      productId: z.string().uuid().optional(),
    }).parse(req.body);

    const update = await updateDistributionService.checkForUpdates(
      currentVersion,
      extensionId,
      productId
    );

    res.status(200).json({ update });
  } catch (error: any) {
    logger.error('Error checking for updates:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to check for updates' });
  }
});

/**
 * @route POST /api/distribution/updates/packages
 * @desc Create update package
 * @access Private (Admin)
 */
router.post('/updates/packages', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    // TODO: Implement file upload with multer
    // For now, expecting package path in request body
    const validatedBody = createUpdatePackageSchema.parse(req.body);
    const { packagePath } = req.body;

    if (!packagePath) {
      return res.status(400).json({ message: 'packagePath is required' });
    }

    const updatePackage = await updateDistributionService.createUpdatePackage(
      validatedBody.fromVersion,
      validatedBody.toVersion,
      packagePath,
      validatedBody.extensionId,
      validatedBody.productId,
      validatedBody.isDelta,
      validatedBody.deltaFromVersion,
      validatedBody.releaseNotes
    );

    res.status(201).json(updatePackage);
  } catch (error: any) {
    logger.error('Error creating update package:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create update package' });
  }
});

/**
 * @route POST /api/distribution/rollbacks/plans
 * @desc Create rollback plan
 * @access Private (Admin)
 */
router.post('/rollbacks/plans', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = createRollbackPlanSchema.parse(req.body);
    
    const plan = await rollbackAutomationService.createRollbackPlan(
      validatedBody.fromVersion,
      validatedBody.toVersion,
      validatedBody.reason,
      validatedBody.extensionId,
      validatedBody.productId,
      validatedBody.rollbackStrategy,
      validatedBody.scheduledAt ? new Date(validatedBody.scheduledAt) : undefined,
      req.user!.id
    );

    res.status(201).json(plan);
  } catch (error: any) {
    logger.error('Error creating rollback plan:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create rollback plan' });
  }
});

/**
 * @route POST /api/distribution/rollbacks/plans/:planId/approve
 * @desc Approve rollback plan
 * @access Private (Admin)
 */
router.post('/rollbacks/plans/:planId/approve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = await rollbackAutomationService.approveRollbackPlan(planId, req.user!.id);

    res.status(200).json(plan);
  } catch (error: any) {
    logger.error('Error approving rollback plan:', error);
    res.status(500).json({ message: error.message || 'Failed to approve rollback plan' });
  }
});

/**
 * @route POST /api/distribution/rollbacks/plans/:planId/execute
 * @desc Execute rollback
 * @access Private (Admin)
 */
router.post('/rollbacks/plans/:planId/execute', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const execution = await rollbackAutomationService.executeRollback(planId);

    res.status(200).json(execution);
  } catch (error: any) {
    logger.error('Error executing rollback:', error);
    res.status(500).json({ message: error.message || 'Failed to execute rollback' });
  }
});

export default router;

