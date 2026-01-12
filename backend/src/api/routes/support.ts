/**
 * Support Routes
 * 
 * Routes for support ticket management.
 */

import { Router } from 'express';
import { SupportService } from '../../services/support/supportService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const supportService = new SupportService();

/**
 * POST /api/support/tickets
 * Create a new support ticket (requires authentication)
 */
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    const userId = req.userId!; // From auth middleware

    if (!subject || !description) {
      return res.status(400).json({
        error: {
          message: 'Subject and description are required',
          status: 400
        }
      });
    }

    const result = await supportService.createTicket({
      user_id: userId,
      subject,
      description,
      priority
    });

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'Failed to create ticket',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: result.ticket
    });
  } catch (error: any) {
    console.error('[Support Routes] Error creating ticket:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/support/tickets
 * Get user's support tickets (requires authentication)
 */
router.get('/tickets', authenticate, async (req, res) => {
  try {
    const userId = req.userId!; // From auth middleware
    const tickets = await supportService.getTicketsByUser(userId);

    res.json({
      tickets,
      count: tickets.length
    });
  } catch (error: any) {
    console.error('[Support Routes] Error getting tickets:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/support/tickets/:id
 * Get ticket by ID (requires authentication)
 */
router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const ticket = await supportService.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        error: {
          message: 'Ticket not found',
          status: 404
        }
      });
    }

    // Check if user owns the ticket (or is admin)
    if (ticket.user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied',
          status: 403
        }
      });
    }

    // Get messages
    const messages = await supportService.getTicketMessages(id);

    res.json({
      ticket,
      messages
    });
  } catch (error: any) {
    console.error('[Support Routes] Error getting ticket:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/support/tickets/:id/messages
 * Add message to ticket (requires authentication)
 */
router.post('/tickets/:id/messages', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, is_internal } = req.body;
    const userId = req.userId!;

    if (!message) {
      return res.status(400).json({
        error: {
          message: 'Message is required',
          status: 400
        }
      });
    }

    // Verify ticket exists and user has access
    const ticket = await supportService.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({
        error: {
          message: 'Ticket not found',
          status: 404
        }
      });
    }

    if (ticket.user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied',
          status: 403
        }
      });
    }

    const messageId = await supportService.addMessage({
      ticket_id: id,
      user_id: userId,
      message,
      is_internal: is_internal || false
    });

    if (!messageId) {
      return res.status(400).json({
        error: {
          message: 'Failed to add message',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'Message added successfully',
      messageId
    });
  } catch (error: any) {
    console.error('[Support Routes] Error adding message:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * PATCH /api/support/tickets/:id/status
 * Update ticket status (requires authentication)
 */
router.patch('/tickets/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId!;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        error: {
          message: 'Valid status is required',
          status: 400
        }
      });
    }

    // Verify ticket exists and user has access
    const ticket = await supportService.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({
        error: {
          message: 'Ticket not found',
          status: 404
        }
      });
    }

    if (ticket.user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied',
          status: 403
        }
      });
    }

    const updated = await supportService.updateTicketStatus(id, status);

    if (!updated) {
      return res.status(400).json({
        error: {
          message: 'Failed to update ticket status',
          status: 400
        }
      });
    }

    res.json({
      message: 'Ticket status updated successfully'
    });
  } catch (error: any) {
    console.error('[Support Routes] Error updating ticket status:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

