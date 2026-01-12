/**
 * Dev Forge Backend API
 * 
 * Main entry point for the backend server.
 * Provides authentication, license management, extension marketplace, and support services.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dev-forge-backend',
    version: '0.1.0'
  });
});

// API routes (will be added)
app.get('/api', (req, res) => {
  res.json({
    message: 'Dev Forge Backend API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      api: '/api',
      // More endpoints will be added
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Backend] Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Backend] Dev Forge Backend API running on port ${PORT}`);
  console.log(`[Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Backend] Health check: http://localhost:${PORT}/health`);
});

export default app;

