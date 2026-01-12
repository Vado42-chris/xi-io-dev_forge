/**
 * Extension Routes
 * 
 * Extension marketplace endpoints.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { extensionService } from '../services/extensionService';
import { extensionReviewService } from '../services/extensionReviewService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const submitExtensionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(5000),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  category: z.enum(['extension', 'theme', 'plugin', 'template']),
  price: z.number().nonnegative(),
  currency: z.string().default('usd'),
  metadata: z.record(z.any()).optional(),
});

const submitReviewSchema = z.object({
  extensionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

/**
 * POST /api/extensions
 * Submit a new extension
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = submitExtensionSchema.parse(req.body);
    const extension = await extensionService.submitExtension(req.user.id, validated);

    res.status(201).json({ extension });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Submit extension error:', error);
    res.status(500).json({ error: 'Failed to submit extension' });
  }
});

/**
 * GET /api/extensions
 * Search extensions
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const params = {
      query: req.query.q as string | undefined,
      category: req.query.category as any,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: req.query.sortBy as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await extensionService.searchExtensions(params);

    res.json(result);
  } catch (error: any) {
    logger.error('Search extensions error:', error);
    res.status(500).json({ error: 'Failed to search extensions' });
  }
});

/**
 * GET /api/extensions/:id
 * Get extension by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const extension = await extensionService.getExtensionById(req.params.id);

    // Increment download count (for analytics)
    extensionService.incrementDownloadCount(req.params.id).catch(err => {
      logger.warn('Failed to increment download count:', err);
    });

    res.json({ extension });
  } catch (error: any) {
    if (error.message === 'Extension not found') {
      return res.status(404).json({ error: 'Extension not found' });
    }
    logger.error('Get extension error:', error);
    res.status(500).json({ error: 'Failed to get extension' });
  }
});

/**
 * GET /api/extensions/author/:authorId
 * Get extensions by author
 */
router.get('/author/:authorId', async (req: Request, res: Response) => {
  try {
    const extensions = await extensionService.getExtensionsByAuthor(req.params.authorId);
    res.json({ extensions });
  } catch (error: any) {
    logger.error('Get extensions by author error:', error);
    res.status(500).json({ error: 'Failed to get extensions' });
  }
});

/**
 * POST /api/extensions/:id/approve
 * Approve an extension (admin only)
 */
router.post('/:id/approve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const extension = await extensionService.approveExtension(req.params.id);
    res.json({ extension });
  } catch (error: any) {
    logger.error('Approve extension error:', error);
    res.status(500).json({ error: 'Failed to approve extension' });
  }
});

/**
 * POST /api/extensions/:id/reject
 * Reject an extension (admin only)
 */
router.post('/:id/reject', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const extension = await extensionService.rejectExtension(req.params.id, reason);
    res.json({ extension });
  } catch (error: any) {
    logger.error('Reject extension error:', error);
    res.status(500).json({ error: 'Failed to reject extension' });
  }
});

/**
 * POST /api/extensions/:id/suspend
 * Suspend an extension (admin only)
 */
router.post('/:id/suspend', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const extension = await extensionService.suspendExtension(req.params.id, reason);
    res.json({ extension });
  } catch (error: any) {
    logger.error('Suspend extension error:', error);
    res.status(500).json({ error: 'Failed to suspend extension' });
  }
});

/**
 * POST /api/extensions/:id/reviews
 * Submit a review
 */
router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = submitReviewSchema.parse({
      extensionId: req.params.id,
      ...req.body,
    });

    const review = await extensionReviewService.submitReview(req.user.id, validated);

    res.status(201).json({ review });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * GET /api/extensions/:id/reviews
 * Get reviews for an extension
 */
router.get('/:id/reviews', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await extensionReviewService.getExtensionReviews(req.params.id, limit, offset);

    res.json(result);
  } catch (error: any) {
    logger.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

/**
 * DELETE /api/extensions/:id/reviews/:reviewId
 * Delete a review
 */
router.delete('/:id/reviews/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await extensionReviewService.deleteReview(req.params.reviewId, req.user.id);

    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Review not found') {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (error.message === 'Not authorized to delete this review') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    logger.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;

