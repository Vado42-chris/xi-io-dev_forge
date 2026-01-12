/**
 * Support Routes
 * 
 * Support ticket and knowledge base endpoints.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { supportService } from '../services/supportService';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTicketSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.enum(['technical', 'billing', 'feature-request', 'bug-report', 'other']).optional(),
  metadata: z.record(z.any()).optional(),
});

const addMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});

const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
router.post('/tickets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = createTicketSchema.parse(req.body);
    const ticket = await supportService.createTicket({
      userId: req.user.id,
      ...validated,
    });

    res.status(201).json({ ticket });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

/**
 * GET /api/support/tickets
 * Search support tickets
 */
router.get('/tickets', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const params = {
      userId: req.user.role === 'admin' ? req.query.userId as string : req.user.id,
      status: req.query.status as any,
      priority: req.query.priority as any,
      category: req.query.category as any,
      assignedTo: req.query.assignedTo as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await supportService.searchTickets(params);

    res.json(result);
  } catch (error: any) {
    logger.error('Search tickets error:', error);
    res.status(500).json({ error: 'Failed to search tickets' });
  }
});

/**
 * GET /api/support/tickets/:id
 * Get ticket by ID
 */
router.get('/tickets/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ticket = await supportService.getTicketById(req.params.id);

    // Check if user owns the ticket or is admin/support staff
    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ticket });
  } catch (error: any) {
    if (error.message === 'Ticket not found') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    logger.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

/**
 * POST /api/support/tickets/:id/assign
 * Assign ticket (admin/support only)
 */
router.post('/tickets/:id/assign', authenticate, requireRole('admin', 'support'), async (req: AuthRequest, res: Response) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ error: 'assignedTo required' });
    }

    const ticket = await supportService.assignTicket(req.params.id, assignedTo);

    res.json({ ticket });
  } catch (error: any) {
    logger.error('Assign ticket error:', error);
    res.status(500).json({ error: 'Failed to assign ticket' });
  }
});

/**
 * POST /api/support/tickets/:id/status
 * Update ticket status
 */
router.post('/tickets/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }

    const ticket = await supportService.getTicketById(req.params.id);

    // Check permissions
    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTicket = await supportService.updateTicketStatus(req.params.id, status);

    res.json({ ticket: updatedTicket });
  } catch (error: any) {
    logger.error('Update ticket status error:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

/**
 * POST /api/support/tickets/:id/messages
 * Add message to ticket
 */
router.post('/tickets/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = addMessageSchema.parse(req.body);
    const { message, isInternal } = validated;

    const ticket = await supportService.getTicketById(req.params.id);

    // Check permissions for internal messages
    if (isInternal && req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Only support staff can add internal messages' });
    }

    // Check if user owns the ticket or is admin/support
    if (ticket.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'support') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ticketMessage = await supportService.addMessage(
      req.params.id,
      req.user.id,
      message,
      isInternal || false
    );

    res.status(201).json({ message: ticketMessage });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Add message error:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

/**
 * GET /api/support/tickets/:id/messages
 * Get messages for a ticket
 */
router.get('/tickets/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const ticket = await supportService.getTicketById(req.params.id);

    // Check permissions
    const includeInternal = req.user.role === 'admin' || req.user.role === 'support';
    if (ticket.userId !== req.user.id && !includeInternal) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await supportService.getTicketMessages(req.params.id, includeInternal);

    res.json({ messages });
  } catch (error: any) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /api/support/knowledge-base
 * Create a knowledge base article (admin/support only)
 */
router.post('/knowledge-base', authenticate, requireRole('admin', 'support'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = createArticleSchema.parse(req.body);
    const { title, content, category, tags, published } = validated;

    const article = await knowledgeBaseService.createArticle(
      req.user.id,
      title,
      content,
      category,
      tags || [],
      published || false
    );

    res.status(201).json({ article });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

/**
 * GET /api/support/knowledge-base
 * Search knowledge base articles
 */
router.get('/knowledge-base', async (req: Request, res: Response) => {
  try {
    const params = {
      query: req.query.q as string | undefined,
      category: req.query.category as string | undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      published: req.query.published !== undefined ? req.query.published === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const result = await knowledgeBaseService.searchArticles(params);

    res.json(result);
  } catch (error: any) {
    logger.error('Search articles error:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

/**
 * GET /api/support/knowledge-base/:id
 * Get article by ID
 */
router.get('/knowledge-base/:id', async (req: Request, res: Response) => {
  try {
    const article = await knowledgeBaseService.getArticleById(req.params.id);
    res.json({ article });
  } catch (error: any) {
    if (error.message === 'Article not found') {
      return res.status(404).json({ error: 'Article not found' });
    }
    logger.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
});

/**
 * POST /api/support/knowledge-base/:id/helpful
 * Mark article as helpful or not helpful
 */
router.post('/knowledge-base/:id/helpful', async (req: Request, res: Response) => {
  try {
    const { helpful } = req.body;

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ error: 'helpful must be a boolean' });
    }

    await knowledgeBaseService.markHelpful(req.params.id, helpful);

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Mark helpful error:', error);
    res.status(500).json({ error: 'Failed to mark helpful' });
  }
});

export default router;

