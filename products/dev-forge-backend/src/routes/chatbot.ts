/**
 * Chatbot Routes
 * 
 * API routes for AI chatbot functionality.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { aiChatbotService } from '../services/aiChatbotService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
  context: z.record(z.any()).optional(),
});

/**
 * @route POST /api/chatbot/message
 * @desc Send message to chatbot
 * @access Public (or Private if authenticated)
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    const validatedBody = chatMessageSchema.parse(req.body);
    const userId = (req as AuthRequest).user?.id;

    // Generate or use provided session ID
    const sessionId = validatedBody.sessionId || `session-${Date.now()}-${Math.random()}`;

    const response = await aiChatbotService.processMessage(
      sessionId,
      validatedBody.message,
      userId,
      validatedBody.context
    );

    res.status(200).json({
      sessionId,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Error processing chatbot message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    res.status(500).json({ message: error.message || 'Failed to process message' });
  }
});

/**
 * @route GET /api/chatbot/suggestions
 * @desc Get suggested responses/questions
 * @access Public
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const context = req.query.context ? JSON.parse(req.query.context as string) : {};
    const suggestions = aiChatbotService.getSuggestedResponses(context);

    res.status(200).json({ suggestions });
  } catch (error: any) {
    logger.error('Error getting suggestions:', error);
    res.status(500).json({ message: error.message || 'Failed to get suggestions' });
  }
});

/**
 * @route POST /api/chatbot/escalate
 * @desc Escalate chat to human support
 * @access Private (Authenticated User)
 */
router.post('/escalate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, message, context } = req.body;

    // Create support ticket from chatbot escalation
    const { supportService } = require('../services/supportService');
    const ticket = await supportService.createTicket(
      req.user!.id,
      'Chatbot Escalation',
      `Chatbot session: ${sessionId}\n\nUser message: ${message}\n\nContext: ${JSON.stringify(context)}`,
      'medium'
    );

    res.status(201).json({
      message: 'Your conversation has been escalated to our support team',
      ticketId: ticket.id,
    });
  } catch (error: any) {
    logger.error('Error escalating chat:', error);
    res.status(500).json({ message: error.message || 'Failed to escalate chat' });
  }
});

export default router;

