/**
 * Authentication Routes
 * 
 * Routes for user authentication and registration.
 */

import { Router } from 'express';
import { AuthService } from '../../services/auth/authService';
import { validateBody } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema } from '../validators';

const router = Router();
const authService = new AuthService();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { email, username, password, first_name, last_name } = req.body;

    // Register user
    const result = await authService.register({
      email,
      username,
      password,
      first_name,
      last_name,
    });

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: result.error || 'Registration failed',
          status: 400
        }
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    console.error('[Auth Routes] Registration error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Login user
    const result = await authService.login({ email, password });

    if (!result.success) {
      return res.status(401).json({
        error: {
          message: result.error || 'Login failed',
          status: 401
        }
      });
    }

    res.json({
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error: any) {
    console.error('[Auth Routes] Login error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Token required',
          status: 401
        }
      });
    }

    const result = authService.verifyToken(token);

    if (!result.valid) {
      return res.status(401).json({
        error: {
          message: result.error || 'Invalid token',
          status: 401
        }
      });
    }

    res.json({
      valid: true,
      userId: result.userId,
      email: result.email
    });
  } catch (error: any) {
    console.error('[Auth Routes] Verify error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        status: 500
      }
    });
  }
});

export default router;

