/**
 * Error Handler Middleware
 * 
 * Centralized error handling for API routes.
 */

import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // Log error
  logger.error('API Error', {
    status,
    message,
    code: err.code,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Send error response
  res.status(status).json({
    error: {
      message,
      status,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    }
  });
}

/**
 * Create API error
 */
export function createError(message: string, status: number = 500, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

/**
 * Async error wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

