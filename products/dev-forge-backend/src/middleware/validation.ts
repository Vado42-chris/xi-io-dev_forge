/**
 * Validation Middleware
 * 
 * Request validation using Zod schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendError } from '../utils/responseFormatter';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', error.errors);
      } else {
        sendError(res, 'Validation failed', 400);
      }
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', error.errors);
      } else {
        sendError(res, 'Validation failed', 400);
      }
    }
  };
}

/**
 * Validate request query
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', error.errors);
      } else {
        sendError(res, 'Validation failed', 400);
      }
    }
  };
}

/**
 * Validate request params
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', error.errors);
      } else {
        sendError(res, 'Validation failed', 400);
      }
    }
  };
}

