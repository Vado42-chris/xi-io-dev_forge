/**
 * Validation Middleware
 * 
 * Request validation using Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { getLogger } from '../../utils/logger';

const logger = getLogger();

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error', { errors: error.errors });
        res.status(400).json({
          error: {
            message: 'Validation failed',
            status: 400,
            errors: error.errors
          }
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Query validation error', { errors: error.errors });
        res.status(400).json({
          error: {
            message: 'Query validation failed',
            status: 400,
            errors: error.errors
          }
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request parameters
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Params validation error', { errors: error.errors });
        res.status(400).json({
          error: {
            message: 'Parameter validation failed',
            status: 400,
            errors: error.errors
          }
        });
        return;
      }
      next(error);
    }
  };
}

