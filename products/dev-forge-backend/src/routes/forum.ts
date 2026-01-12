/**
 * Forum Routes
 * 
 * API routes for community forum functionality.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { communityForumService } from '../services/communityForumService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
});

const createReplySchema = z.object({
  content: z.string().min(10, 'Reply must be at least 10 characters'),
});

/**
 * @route POST /api/forum/posts
 * @desc Create forum post
 * @access Private (Authenticated User)
 */
router.post('/posts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validatedBody = createPostSchema.parse(req.body);
    
    const post = await communityForumService.createPost(
      req.user!.id,
      validatedBody
    );

    res.status(201).json(post);
  } catch (error: any) {
    logger.error('Error creating forum post:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create forum post' });
  }
});

/**
 * @route GET /api/forum/posts
 * @desc Get forum posts
 * @access Public
 */
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const { category, search, sortBy, limit, offset } = req.query;
    
    const posts = await communityForumService.getPosts(
      category as string,
      search as string,
      (sortBy as 'newest' | 'popular' | 'trending') || 'newest',
      parseInt(limit as string) || 20,
      parseInt(offset as string) || 0
    );

    res.status(200).json(posts);
  } catch (error: any) {
    logger.error('Error getting forum posts:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve forum posts' });
  }
});

/**
 * @route GET /api/forum/posts/:id
 * @desc Get forum post by ID
 * @access Public
 */
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incrementViews = req.query.incrementViews === 'true';
    
    const post = await communityForumService.getPost(id, incrementViews);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (error: any) {
    logger.error(`Error getting forum post ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to retrieve forum post' });
  }
});

/**
 * @route POST /api/forum/posts/:id/replies
 * @desc Create reply to post
 * @access Private (Authenticated User)
 */
router.post('/posts/:id/replies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id: postId } = req.params;
    const validatedBody = createReplySchema.parse(req.body);
    
    const reply = await communityForumService.createReply(
      postId,
      req.user!.id,
      validatedBody
    );

    res.status(201).json(reply);
  } catch (error: any) {
    logger.error('Error creating forum reply:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to create forum reply' });
  }
});

/**
 * @route GET /api/forum/posts/:id/replies
 * @desc Get replies for post
 * @access Public
 */
router.get('/posts/:id/replies', async (req: Request, res: Response) => {
  try {
    const { id: postId } = req.params;
    const { limit, offset } = req.query;
    
    const replies = await communityForumService.getReplies(
      postId,
      parseInt(limit as string) || 50,
      parseInt(offset as string) || 0
    );

    res.status(200).json(replies);
  } catch (error: any) {
    logger.error(`Error getting replies for post ${req.params.id}:`, error);
    res.status(500).json({ message: error.message || 'Failed to retrieve forum replies' });
  }
});

/**
 * @route POST /api/forum/replies/:id/solution
 * @desc Mark reply as solution
 * @access Private (Post Author or Admin)
 */
router.post('/replies/:id/solution', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id: replyId } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: 'postId is required' });
    }

    // TODO: Verify user is post author or admin
    await communityForumService.markAsSolution(replyId, postId);

    res.status(200).json({ message: 'Reply marked as solution' });
  } catch (error: any) {
    logger.error(`Error marking reply as solution:`, error);
    res.status(500).json({ message: error.message || 'Failed to mark reply as solution' });
  }
});

/**
 * @route POST /api/forum/posts/:id/vote
 * @desc Vote on post
 * @access Private (Authenticated User)
 */
router.post('/posts/:id/vote', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id: postId } = req.params;
    const { upvote } = z.object({ upvote: z.boolean() }).parse(req.body);

    await communityForumService.voteOnPost(postId, req.user!.id, upvote);

    res.status(200).json({ message: 'Vote recorded' });
  } catch (error: any) {
    logger.error(`Error voting on post:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to vote on post' });
  }
});

export default router;

