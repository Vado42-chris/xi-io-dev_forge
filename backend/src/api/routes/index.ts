/**
 * API Routes
 * 
 * Main router for Dev Forge backend API.
 */

import { Router } from 'express';
import authRoutes from './auth';
import licenseRoutes from './licenses';
import extensionRoutes from './extensions';
import supportRoutes from './support';
import analyticsRoutes from './analytics';

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
      licenses: '/api/licenses',
      extensions: '/api/extensions',
      support: '/api/support',
      analytics: '/api/analytics',
      users: '/api/users (coming soon)',
    }
  });
});

// Auth routes
router.use('/auth', authRoutes);

// License routes
router.use('/licenses', licenseRoutes);

// Extension routes
router.use('/extensions', extensionRoutes);

// Support routes
router.use('/support', supportRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

export default router;

