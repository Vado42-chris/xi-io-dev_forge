/**
 * Authentication Service
 * 
 * Handles user authentication, registration, and JWT token management.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../../database/connection';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  tier: 'free' | 'pro' | 'enterprise';
  email_verified: boolean;
  created_at: Date;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  error?: string;
}

export class AuthService {
  private db = getDatabase();
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user exists
      const existingUser = await this.findUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Check if username exists
      const existingUsername = await this.findUserByUsername(data.username);
      if (existingUsername) {
        return {
          success: false,
          error: 'Username already taken'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const userId = await this.createUser({
        email: data.email,
        username: data.username,
        password_hash: passwordHash,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      // Generate token
      const token = this.generateToken(userId, data.email);

      // Get user (without password)
      const user = await this.getUserById(userId);
      if (!user) {
        return {
          success: false,
          error: 'Failed to create user'
        };
      }

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          tier: user.tier,
          email_verified: user.email_verified,
          created_at: user.created_at,
        }
      };
    } catch (error: any) {
      console.error('[AuthService] Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResult> {
    try {
      // Find user
      const user = await this.findUserByEmail(data.email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(data.password, user.password_hash);
      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login
      await this.updateLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user.id, user.email);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          tier: user.tier,
          email_verified: user.email_verified,
          created_at: user.created_at,
        }
      };
    } catch (error: any) {
      console.error('[AuthService] Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { valid: boolean; userId?: string; email?: string; error?: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; email: string };
      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Invalid token'
      };
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  /**
   * Find user by email
   */
  private async findUserByEmail(email: string): Promise<User | null> {
    // Implementation depends on database type
    // For now, return null (will implement with actual DB queries)
    return null;
  }

  /**
   * Find user by username
   */
  private async findUserByUsername(username: string): Promise<User | null> {
    // Implementation depends on database type
    return null;
  }

  /**
   * Create user
   */
  private async createUser(data: {
    email: string;
    username: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
  }): Promise<string> {
    // Implementation depends on database type
    // For now, return placeholder
    return 'placeholder-user-id';
  }

  /**
   * Get user by ID
   */
  private async getUserById(userId: string): Promise<User | null> {
    // Implementation depends on database type
    return null;
  }

  /**
   * Update last login
   */
  private async updateLastLogin(userId: string): Promise<void> {
    // Implementation depends on database type
  }
}

