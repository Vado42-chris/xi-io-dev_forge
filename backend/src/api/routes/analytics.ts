/**
 * Analytics Routes
 * 
 * Routes for analytics event tracking and reporting.
 */

import { Router } from 'express';
import { AnalyticsService } from '../../services/analytics/analyticsService';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();
const analyticsService = new AnalyticsService();

/**
 * POST /api/analytics/events
 * Track an analytics event (optional auth - can track anonymous events)
 */
router.post('/events', optionalAuthenticate, async (req, res) => {
  try {
    const { event_type, event_data } = req.body;
    const userId = req.userId; // Optional from optionalAuthenticate
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!event_type) {
      return res.status(400).json({
        error: {
          message: 'Event type is required',
          status: 400
        }
      });
    }

    const eventId = await analyticsService.trackEvent({
      user_id: userId,
      event_type,
      event_data,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (!eventId) {
      return res.status(500).json({
        error: {
          message: 'Failed to track event',
          status: 500
        }
      });
    }

    res.status(201).json({
      message: 'Event tracked successfully',
      eventId
    });
  } catch (error: any) {
    console.error('[Analytics Routes] Error tracking event:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/analytics/events/user/:userId
 * Get events for a user (requires authentication)
 */
router.get('/events/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId!;

    // Users can only view their own events (unless admin - add admin check later)
    if (userId !== requestingUserId) {
      return res.status(403).json({
        error: {
          message: 'Access denied',
          status: 403
        }
      });
    }

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await analyticsService.getEventsByUser(userId, limit, offset);

    res.json({
      events,
      count: events.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Analytics Routes] Error getting user events:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/analytics/events/type/:eventType
 * Get events by type (requires authentication - admin only later)
 */
router.get('/events/type/:eventType', authenticate, async (req, res) => {
  try {
    const { eventType } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const events = await analyticsService.getEventsByType(eventType, limit, offset);

    res.json({
      events,
      count: events.length,
      event_type: eventType,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Analytics Routes] Error getting events by type:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/analytics/report
 * Get analytics report (requires authentication - admin only later)
 */
router.get('/report', authenticate, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const report = await analyticsService.getAnalyticsReport(startDate, endDate);

    res.json({
      report
    });
  } catch (error: any) {
    console.error('[Analytics Routes] Error getting analytics report:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/analytics/count/:eventType
 * Get event count by type (requires authentication)
 */
router.get('/count/:eventType', authenticate, async (req, res) => {
  try {
    const { eventType } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const count = await analyticsService.getEventCount(eventType, startDate, endDate);

    res.json({
      event_type: eventType,
      count,
      date_range: startDate && endDate ? { start: startDate, end: endDate } : undefined
    });
  } catch (error: any) {
    console.error('[Analytics Routes] Error getting event count:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

