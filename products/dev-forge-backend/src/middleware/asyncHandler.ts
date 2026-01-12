/**
 * Async Handler Middleware
 * 
 * Wraps async route handlers to catch errors automatically.
 */

import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(fn: AsyncFunction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

