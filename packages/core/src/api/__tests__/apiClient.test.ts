/**
 * API Client Tests
 * 
 * Tests for API client functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../apiClient';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    });

    apiClient = new ApiClient({
      baseURL: 'http://localhost:3001',
    });
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      apiClient.setToken('test-token');
      expect(apiClient.getToken()).toBe('test-token');
    });

    it('should clear token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(apiClient.getToken()).toBeNull();
    });
  });

  describe('GET Requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1', name: 'Test' } },
      };

      const client = mockedAxios.create();
      client.get.mockResolvedValue(mockResponse);

      const response = await apiClient.get('/test');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '1', name: 'Test' });
    });

    it('should handle GET request errors', async () => {
      const client = mockedAxios.create();
      client.get.mockRejectedValue({
        response: {
          data: { message: 'Not found' },
          status: 404,
        },
      });

      const response = await apiClient.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Not found');
    });
  });

  describe('POST Requests', () => {
    it('should make POST request successfully', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '1' } },
      };

      const client = mockedAxios.create();
      client.post.mockResolvedValue(mockResponse);

      const response = await apiClient.post('/test', { name: 'Test' });

      expect(response.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const client = mockedAxios.create();
      client.get.mockRejectedValue({
        request: {},
      });

      const response = await apiClient.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle unknown errors', async () => {
      const client = mockedAxios.create();
      client.get.mockRejectedValue(new Error('Unknown error'));

      const response = await apiClient.get('/test');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const mockResponse = {
        data: { status: 'healthy' },
      };

      const client = mockedAxios.create();
      client.get.mockResolvedValue(mockResponse);

      const response = await apiClient.healthCheck();

      expect(client.get).toHaveBeenCalledWith('/health', undefined);
    });
  });
});

