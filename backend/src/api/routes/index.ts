/**
 * API Routes
 * 
 * Main router for Dev Forge backend API.
 */

import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// Health check (already in main app, but can be here too)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dev-forge-backend',
    version: '0.1.0'
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    message: 'Dev Forge Backend API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users (coming soon)',
      licenses: '/api/licenses (coming soon)',
      extensions: '/api/extensions (coming soon)',
      support: '/api/support (coming soon)',
    }
  });
});

// Auth routes
router.use('/auth', authRoutes);

export default router;

