/**
 * License Routes
 * 
 * Routes for license management.
 */

import { Router } from 'express';
import { LicenseService } from '../../services/license/licenseService';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
const licenseService = new LicenseService();

/**
 * GET /api/licenses/user/:userId
 * Get user's active license
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const license = await licenseService.getUserLicense(userId);

    if (!license) {
      return res.status(404).json({
        error: {
          message: 'No active license found for user',
          status: 404
        }
      });
    }

    res.json({
      license
    });
  } catch (error: any) {
    console.error('[License Routes] Error getting user license:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/licenses/validate
 * Validate a license key
 */
router.post('/validate', async (req, res) => {
  try {
    const { license_key } = req.body;

    if (!license_key) {
      return res.status(400).json({
        error: {
          message: 'License key is required',
          status: 400
        }
      });
    }

    const result = await licenseService.validateLicense(license_key);

    if (!result.valid) {
      return res.status(400).json({
        error: {
          message: result.error || 'License is invalid',
          status: 400
        }
      });
    }

    res.json({
      valid: true,
      license: result.license
    });
  } catch (error: any) {
    console.error('[License Routes] Error validating license:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/licenses/create
 * Create a new license (admin only - requires authentication)
 */
router.post('/create', authenticate, async (req, res) => {
  try {
    const { user_id, tier, expires_at } = req.body;

    if (!user_id || !tier) {
      return res.status(400).json({
        error: {
          message: 'User ID and tier are required',
          status: 400
        }
      });
    }

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        error: {
          message: 'Invalid tier. Must be free, pro, or enterprise',
          status: 400
        }
      });
    }

    const result = await licenseService.createLicense(
      user_id,
      tier,
      expires_at ? new Date(expires_at) : undefined
    );

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'Failed to create license',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'License created successfully',
      license: result.license
    });
  } catch (error: any) {
    console.error('[License Routes] Error creating license:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/licenses/upgrade
 * Upgrade user license tier
 */
router.post('/upgrade', async (req, res) => {
  try {
    const { user_id, tier, expires_at } = req.body;

    if (!user_id || !tier) {
      return res.status(400).json({
        error: {
          message: 'User ID and tier are required',
          status: 400
        }
      });
    }

    if (!['pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        error: {
          message: 'Invalid tier for upgrade. Must be pro or enterprise',
          status: 400
        }
      });
    }

    const result = await licenseService.upgradeLicense(
      user_id,
      tier,
      expires_at ? new Date(expires_at) : undefined
    );

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'License upgrade failed',
          status: 400
        }
      });
    }

    res.json({
      message: 'License upgraded successfully',
      license: result.license
    });
  } catch (error: any) {
    console.error('[License Routes] Error upgrading license:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/licenses/revoke
 * Revoke a license (admin only - requires authentication)
 */
router.post('/revoke', authenticate, async (req, res) => {
  try {
    const { license_key } = req.body;

    if (!license_key) {
      return res.status(400).json({
        error: {
          message: 'License key is required',
          status: 400
        }
      });
    }

    const revoked = await licenseService.revokeLicense(license_key);

    if (!revoked) {
      return res.status(404).json({
        error: {
          message: 'License not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'License revoked successfully'
    });
  } catch (error: any) {
    console.error('[License Routes] Error revoking license:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

