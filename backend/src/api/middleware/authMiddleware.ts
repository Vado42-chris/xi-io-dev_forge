/**
 * Authentication Middleware
 * 
 * Middleware for protecting routes with JWT authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/auth/authService';
import { getLogger } from '../../utils/logger';

const logger = getLogger();
const authService = new AuthService();

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          message: 'Authentication required',
          status: 401
        }
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const result = authService.verifyToken(token);
    if (!result.valid || !result.userId || !result.email) {
      logger.warn('Invalid authentication token', { token: token.substring(0, 10) + '...' });
      res.status(401).json({
        error: {
          message: result.error || 'Invalid token',
          status: 401
        }
      });
      return;
    }

    // Attach user info to request
    req.userId = result.userId;
    req.userEmail = result.email;

    logger.debug('User authenticated', { userId: result.userId, email: result.email });
    next();
  } catch (error: any) {
    logger.error('Authentication middleware error', { error: error.message });
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const result = authService.verifyToken(token);
      
      if (result.valid && result.userId && result.email) {
        req.userId = result.userId;
        req.userEmail = result.email;
      }
    }
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
}

