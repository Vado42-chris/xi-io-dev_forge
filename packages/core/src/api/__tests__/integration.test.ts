/**
 * Integration Tests
 * 
 * End-to-end integration tests for API services.
 * These tests require a running backend server.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiServices } from '../index';

// Skip integration tests if INTEGRATION_TEST env var is not set
const shouldRunIntegrationTests = process.env.INTEGRATION_TEST === 'true';

describe.skipIf(!shouldRunIntegrationTests)('API Integration Tests', () => {
  let api: ApiServices;
  let testUserToken: string | null = null;

  beforeAll(() => {
    api = new ApiServices({
      baseURL: process.env.API_URL || 'http://localhost:3001',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const email = `test-${Date.now()}@example.com`;
      const response = await api.auth.register({
        email,
        password: 'testpassword123',
        name: 'Test User',
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.user.email).toBe(email);
      expect(response.data?.token).toBeDefined();

      if (response.data?.token) {
        testUserToken = response.data.token;
        api.initialize(testUserToken);
      }
    });

    it('should login with valid credentials', async () => {
      const email = `test-${Date.now()}@example.com`;
      
      // Register first
      await api.auth.register({
        email,
        password: 'testpassword123',
      });

      // Then login
      const response = await api.auth.login({
        email,
        password: 'testpassword123',
      });

      expect(response.success).toBe(true);
      expect(response.data?.token).toBeDefined();
    });

    it('should fail login with invalid credentials', async () => {
      const response = await api.auth.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('License Management', () => {
    it('should validate a license', async () => {
      const response = await api.licenses.validateLicense('DF-TEST123');

      // Response should be valid (success or failure)
      expect(response).toBeDefined();
      expect(response.success !== undefined).toBe(true);
    });

    it('should get user licenses', async () => {
      if (!testUserToken) {
        // Skip if not authenticated
        return;
      }

      const response = await api.licenses.getUserLicenses();

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Extension Marketplace', () => {
    it('should fetch extensions', async () => {
      const response = await api.extensions.getExtensions({
        status: 'approved',
        limit: 10,
      });

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should get extension by ID', async () => {
      // First get list to find an ID
      const listResponse = await api.extensions.getExtensions({ limit: 1 });
      
      if (listResponse.success && listResponse.data && listResponse.data.length > 0) {
        const extensionId = listResponse.data[0].id;
        const response = await api.extensions.getExtension(extensionId);

        expect(response.success).toBe(true);
        expect(response.data?.id).toBe(extensionId);
      }
    });
  });

  describe('Support System', () => {
    it('should create a support ticket', async () => {
      if (!testUserToken) {
        return;
      }

      const response = await api.support.createTicket({
        subject: 'Test Ticket',
        description: 'This is a test support ticket',
        priority: 'medium',
      });

      expect(response.success).toBe(true);
      expect(response.data?.subject).toBe('Test Ticket');
    });

    it('should fetch knowledge base articles', async () => {
      const response = await api.support.getKnowledgeBaseArticles({
        status: 'published',
        limit: 10,
      });

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Health Check', () => {
    it('should check backend health', async () => {
      const response = await api.client.healthCheck();

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });
  });

  afterAll(() => {
    if (testUserToken) {
      api.auth.logout();
    }
  });
});

