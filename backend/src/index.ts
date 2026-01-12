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
import { getDatabase } from './database/connection';
import apiRoutes from './api/routes';

// Load environment variables
dotenv.config();

// Initialize database connection
const db = getDatabase();
db.connect().catch(err => {
  console.error('[Backend] Database connection error:', err);
  process.exit(1);
});

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

// Health check endpoint (root level)
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'dev-forge-backend',
    version: '0.1.0'
  });
});

// API routes
app.use('/api', apiRoutes);

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
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: {
      message: 'Not found',
      status: 404
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Backend] SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Backend] SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`[Backend] Dev Forge Backend API running on port ${PORT}`);
  console.log(`[Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Backend] Database: ${db.getType()}`);
  console.log(`[Backend] Health check: http://localhost:${PORT}/health`);
});

export default app;

