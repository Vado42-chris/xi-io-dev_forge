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
import { getLogger } from './utils/logger';
import { requestLogger } from './api/middleware/requestLogger';
import { rateLimiter } from './api/middleware/rateLimiter';
import { errorHandler } from './api/middleware/errorHandler';
import apiRoutes from './api/routes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = getLogger();
logger.info('Dev Forge Backend starting...');

// Initialize database connection
const db = getDatabase();
db.connect().then(async () => {
  // Run migrations
  try {
    const { MigrationRunner } = await import('./database/migrations');
    const { migrations } = await import('./database/migrations');
    const runner = new MigrationRunner();
    await runner.runMigrations(migrations);
  } catch (error: any) {
    logger.error('Migration error', { error: error.message });
    // Don't exit on migration error - might be first run
  }
}).catch(err => {
  logger.error('Database connection error', { error: err });
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

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter(60000, 100)); // 100 requests per minute

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

// Error handling middleware (must be last)
app.use(errorHandler);

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
  logger.info('SIGTERM received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info('Dev Forge Backend API started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: db.getType(),
    healthCheck: `http://localhost:${PORT}/health`,
  });
});

export default app;

