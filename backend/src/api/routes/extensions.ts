/**
 * Extension Routes
 * 
 * Routes for extension marketplace.
 */

import { Router } from 'express';
import { ExtensionService } from '../../services/extension/extensionService';

const router = Router();
const extensionService = new ExtensionService();

/**
 * GET /api/extensions
 * Get approved extensions (with pagination)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const extensions = await extensionService.getApprovedExtensions(limit, offset);

    res.json({
      extensions,
      count: extensions.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error getting extensions:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/extensions/popular
 * Get popular extensions
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const extensions = await extensionService.getPopularExtensions(limit);

    res.json({
      extensions,
      count: extensions.length
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error getting popular extensions:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/extensions/search
 * Search extensions
 */
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!query) {
      return res.status(400).json({
        error: {
          message: 'Search query is required',
          status: 400
        }
      });
    }

    const extensions = await extensionService.searchExtensions(query, limit, offset);

    res.json({
      extensions,
      count: extensions.length,
      query,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error searching extensions:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/extensions/:id
 * Get extension by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const extension = await extensionService.getExtensionById(id);

    if (!extension) {
      return res.status(404).json({
        error: {
          message: 'Extension not found',
          status: 404
        }
      });
    }

    res.json({ extension });
  } catch (error: any) {
    console.error('[Extension Routes] Error getting extension:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/extensions/slug/:slug
 * Get extension by slug
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const extension = await extensionService.getExtensionBySlug(slug);

    if (!extension) {
      return res.status(404).json({
        error: {
          message: 'Extension not found',
          status: 404
        }
      });
    }

    res.json({ extension });
  } catch (error: any) {
    console.error('[Extension Routes] Error getting extension by slug:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/extensions/author/:authorId
 * Get extensions by author
 */
router.get('/author/:authorId', async (req, res) => {
  try {
    const { authorId } = req.params;
    const extensions = await extensionService.getExtensionsByAuthor(authorId);

    res.json({
      extensions,
      count: extensions.length
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error getting extensions by author:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/extensions
 * Create a new extension (requires authentication - will add middleware later)
 */
router.post('/', async (req, res) => {
  try {
    const { name, slug, description, version, author_id, category, tags, price, is_free } = req.body;

    if (!name || !description || !version || !author_id) {
      return res.status(400).json({
        error: {
          message: 'Name, description, version, and author_id are required',
          status: 400
        }
      });
    }

    const result = await extensionService.createExtension({
      name,
      slug,
      description,
      version,
      author_id,
      category,
      tags,
      price,
      is_free
    });

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'Failed to create extension',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'Extension created successfully (pending approval)',
      extension: result.extension
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error creating extension:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/extensions/:id/download
 * Record extension download
 */
router.post('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    await extensionService.recordDownload(id);

    res.json({
      message: 'Download recorded'
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error recording download:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/extensions/:id/approve
 * Approve extension (admin only - will add auth middleware later)
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const approved = await extensionService.approveExtension(id);

    if (!approved) {
      return res.status(404).json({
        error: {
          message: 'Extension not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'Extension approved successfully'
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error approving extension:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/extensions/:id/reject
 * Reject extension (admin only - will add auth middleware later)
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const rejected = await extensionService.rejectExtension(id);

    if (!rejected) {
      return res.status(404).json({
        error: {
          message: 'Extension not found',
          status: 404
        }
      });
    }

    res.json({
      message: 'Extension rejected successfully'
    });
  } catch (error: any) {
    console.error('[Extension Routes] Error rejecting extension:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

