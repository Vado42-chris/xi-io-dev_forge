/**
 * Developer Routes
 * 
 * Routes for developer application management.
 */

import { Router } from 'express';
import { DeveloperService } from '../../services/developer/developerService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const developerService = new DeveloperService();

/**
 * POST /api/developers/applications
 * Submit a developer application (requires authentication)
 */
router.post('/applications', authenticate, async (req, res) => {
  try {
    const { application_data } = req.body;
    const userId = req.userId!; // From auth middleware

    if (!application_data) {
      return res.status(400).json({
        error: {
          message: 'Application data is required',
          status: 400
        }
      });
    }

    const result = await developerService.createApplication({
      user_id: userId,
      application_data
    });

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'Failed to create application',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'Developer application submitted successfully',
      application: result.application
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error creating application:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/developers/applications/my
 * Get current user's application (requires authentication)
 */
router.get('/applications/my', authenticate, async (req, res) => {
  try {
    const userId = req.userId!;
    const application = await developerService.getApplicationByUserId(userId);

    if (!application) {
      return res.status(404).json({
        error: {
          message: 'No application found',
          status: 404
        }
      });
    }

    res.json({
      application
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error getting application:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/developers/applications/:id
 * Get application by ID (requires authentication)
 */
router.get('/applications/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const application = await developerService.getApplicationById(id);

    if (!application) {
      return res.status(404).json({
        error: {
          message: 'Application not found',
          status: 404
        }
      });
    }

    // Users can only view their own applications (unless admin - add admin check later)
    if (application.user_id !== userId) {
      return res.status(403).json({
        error: {
          message: 'Access denied',
          status: 403
        }
      });
    }

    res.json({
      application
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error getting application:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/developers/applications/status/:status
 * Get applications by status (requires authentication - admin only later)
 */
router.get('/applications/status/:status', authenticate, async (req, res) => {
  try {
    const { status } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: {
          message: 'Invalid status',
          status: 400
        }
      });
    }

    const applications = await developerService.getApplicationsByStatus(
      status as 'pending' | 'approved' | 'rejected',
      limit,
      offset
    );

    res.json({
      applications,
      count: applications.length,
      status,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error getting applications by status:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/developers/applications/:id/approve
 * Approve application (requires authentication - admin only later)
 */
router.post('/applications/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reviewedBy = req.userId!;

    const approved = await developerService.approveApplication(id, reviewedBy);

    if (!approved) {
      return res.status(404).json({
        error: {
          message: 'Application not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'Application approved successfully'
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error approving application:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/developers/applications/:id/reject
 * Reject application (requires authentication - admin only later)
 */
router.post('/applications/:id/reject', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reviewedBy = req.userId!;

    const rejected = await developerService.rejectApplication(id, reviewedBy);

    if (!rejected) {
      return res.status(404).json({
        error: {
          message: 'Application not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'Application rejected successfully'
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error rejecting application:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/developers/status
 * Check if user is approved developer (requires authentication)
 */
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.userId!;
    const isDeveloper = await developerService.isApprovedDeveloper(userId);

    res.json({
      is_developer: isDeveloper
    });
  } catch (error: any) {
    console.error('[Developer Routes] Error checking developer status:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

