/**
 * Extension Registry Routes
 * 
 * API routes for extension submission and review.
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { extensionRegistryService } from '../services/extensionRegistryService';
import { developerOnboardingService } from '../services/developerOnboardingService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const submitExtensionSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in X.Y.Z format'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  price: z.number().min(0, 'Price cannot be negative').int('Price must be an integer (in cents)'),
  packageUrl: z.string().url('Invalid package URL'),
  manifest: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string(),
    author: z.string(),
    license: z.string(),
    main: z.string(),
    dependencies: z.record(z.string()).optional(),
    devDependencies: z.record(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    repository: z.string().optional(),
    homepage: z.string().optional(),
  }),
});

const submitDeveloperApplicationSchema = z.object({
  companyName: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  portfolio: z.string().url('Invalid portfolio URL').optional(),
  githubUsername: z.string().optional(),
  previousWork: z.array(z.string()).optional(),
  taxId: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'paypal', 'bank_transfer']).optional(),
  paymentDetails: z.record(z.any()).optional(),
});

/**
 * @route POST /api/registry/extensions/submit
 * @desc Submit extension for review
 * @access Private (Publisher/Developer)
 */
router.post('/extensions/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is approved developer
    const isApproved = await developerOnboardingService.isApprovedDeveloper(req.user!.id);
    if (!isApproved) {
      return res.status(403).json({ 
        message: 'You must be an approved developer to submit extensions. Please apply first.',
        requiresApplication: true 
      });
    }

    const validatedBody = submitExtensionSchema.parse(req.body);
    
    const submission = await extensionRegistryService.submitExtension(
      req.user!.id,
      validatedBody.name,
      validatedBody.description,
      validatedBody.version,
      validatedBody.category,
      validatedBody.tags,
      validatedBody.price,
      validatedBody.packageUrl,
      validatedBody.manifest
    );

    res.status(201).json(submission);
  } catch (error: any) {
    logger.error('Error submitting extension:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to submit extension' });
  }
});

/**
 * @route GET /api/registry/extensions/submissions/:id
 * @desc Get submission status
 * @access Private (Submission Owner or Admin)
 */
router.get('/extensions/submissions/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await extensionRegistryService.getSubmission(id);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only owner or admin can view
    if (req.user!.role !== 'admin' && req.user!.id !== submission.developerId) {
      return res.status(403).json({ message: 'Forbidden: You do not own this submission' });
    }

    res.status(200).json(submission);
  } catch (error: any) {
    logger.error(`Error getting submission ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to retrieve submission' });
  }
});

/**
 * @route POST /api/registry/developers/apply
 * @desc Submit developer application
 * @access Private (Authenticated User)
 */
router.post('/developers/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user already has an application
    const existing = await developerOnboardingService.getUserApplication(req.user!.id);
    if (existing && existing.status === 'pending') {
      return res.status(400).json({ 
        message: 'You already have a pending application',
        applicationId: existing.id 
      });
    }

    if (existing && existing.status === 'approved') {
      return res.status(400).json({ 
        message: 'You are already an approved developer' 
      });
    }

    const validatedBody = submitDeveloperApplicationSchema.parse(req.body);
    
    const application = await developerOnboardingService.submitApplication(
      req.user!.id,
      validatedBody
    );

    res.status(201).json(application);
  } catch (error: any) {
    logger.error('Error submitting developer application:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to submit application' });
  }
});

/**
 * @route GET /api/registry/developers/application
 * @desc Get user's developer application status
 * @access Private (Authenticated User)
 */
router.get('/developers/application', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const application = await developerOnboardingService.getUserApplication(req.user!.id);
    
    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }

    res.status(200).json(application);
  } catch (error: any) {
    logger.error('Error getting developer application:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve application' });
  }
});

/**
 * @route GET /api/registry/developers/pending
 * @desc Get pending developer applications (Admin only)
 * @access Private (Admin)
 */
router.get('/developers/pending', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset } = req.query;
    const applications = await developerOnboardingService.getPendingApplications(
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    );

    res.status(200).json(applications);
  } catch (error: any) {
    logger.error('Error getting pending applications:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve applications' });
  }
});

/**
 * @route POST /api/registry/developers/:id/approve
 * @desc Approve developer application (Admin only)
 * @access Private (Admin)
 */
router.post('/developers/:id/approve', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    await developerOnboardingService.approveApplication(id, req.user!.id, notes);

    res.status(200).json({ message: 'Application approved successfully' });
  } catch (error: any) {
    logger.error(`Error approving application ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to approve application' });
  }
});

/**
 * @route POST /api/registry/developers/:id/reject
 * @desc Reject developer application (Admin only)
 * @access Private (Admin)
 */
router.post('/developers/:id/reject', authenticate, authorize(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = z.object({ notes: z.string().min(1, 'Rejection notes are required') }).parse(req.body);

    await developerOnboardingService.rejectApplication(id, req.user!.id, notes);

    res.status(200).json({ message: 'Application rejected' });
  } catch (error: any) {
    logger.error(`Error rejecting application ${req.params.id}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to reject application' });
  }
});

export default router;

