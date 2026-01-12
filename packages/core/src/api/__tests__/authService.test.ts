/**
 * Auth Service Tests
 * 
 * Tests for authentication service.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../authService';
import { ApiClient } from '../apiClient';

describe('AuthService', () => {
  let authService: AuthService;
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      post: vi.fn(),
      setToken: vi.fn(),
      clearToken: vi.fn(),
      getToken: vi.fn(),
    };

    authService = new AuthService(mockApiClient as any);
  });

  describe('Login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', role: 'user' },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const response = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.success).toBe(true);
      expect(mockApiClient.setToken).toHaveBeenCalledWith('test-token');
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Invalid credentials' },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const response = await authService.login({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(response.success).toBe(false);
      expect(mockApiClient.setToken).not.toHaveBeenCalled();
    });
  });

  describe('Register', () => {
    it('should register successfully and store token', async () => {
      const mockResponse = {
        success: true,
        data: {
          token: 'test-token',
          user: { id: '1', email: 'test@example.com', role: 'user' },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const response = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(response.success).toBe(true);
      expect(mockApiClient.setToken).toHaveBeenCalledWith('test-token');
    });
  });

  describe('Logout', () => {
    it('should clear token on logout', () => {
      authService.logout();
      expect(mockApiClient.clearToken).toHaveBeenCalled();
    });
  });

  describe('Authentication Status', () => {
    it('should return true when token exists', () => {
      mockApiClient.getToken.mockReturnValue('test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      mockApiClient.getToken.mockReturnValue(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});

