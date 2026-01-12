/**
 * End-to-End Integration Tests
 * 
 * Tests all systems working together.
 */

import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import { getPool } from '../../config/database';

// Import all routes
import authRoutes from '../../routes/auth';
import paymentRoutes from '../../routes/payments';
import licenseRoutes from '../../routes/licenses';
import extensionRoutes from '../../routes/extensions';
import supportRoutes from '../../routes/support';
import extensionRegistryRoutes from '../../routes/extensionRegistry';
import chatbotRoutes from '../../routes/chatbot';
import forumRoutes from '../../routes/forum';
import financialRoutes from '../../routes/financial';
import analyticsRoutes from '../../routes/analytics';
import distributionRoutes from '../../routes/distribution';
import automationRoutes from '../../routes/automation';

const app = express();
app.use(express.json());

// Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/registry', extensionRegistryRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/automation', automationRoutes);

describe('End-to-End Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let extensionId: string;

  beforeAll(async () => {
    // Create test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
      });

    userId = registerResponse.body.user?.id;
    userToken = registerResponse.body.token;

    // Create admin user
    const adminRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!@#',
        name: 'Admin User',
        role: 'admin',
      });

    adminToken = adminRegisterResponse.body.token;
  });

  describe('Complete User Journey', () => {
    it('should complete full user registration to extension purchase flow', async () => {
      // 1. User registers
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'journey@example.com',
          password: 'Journey123!@#',
          name: 'Journey User',
        })
        .expect(201);

      const journeyToken = registerResponse.body.token;
      expect(journeyToken).toBeDefined();

      // 2. User browses extensions
      const extensionsResponse = await request(app)
        .get('/api/extensions')
        .set('Authorization', `Bearer ${journeyToken}`)
        .expect(200);

      expect(Array.isArray(extensionsResponse.body)).toBe(true);

      // 3. User creates support ticket
      const ticketResponse = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({
          subject: 'Test Question',
          message: 'I have a question about extensions',
          category: 'general',
        })
        .expect(201);

      expect(ticketResponse.body).toHaveProperty('id');

      // 4. User checks for updates
      const updateResponse = await request(app)
        .post('/api/distribution/updates/check')
        .set('Authorization', `Bearer ${journeyToken}`)
        .send({
          currentVersion: '1.0.0',
        })
        .expect(200);

      expect(updateResponse.body).toHaveProperty('update');
    });
  });

  describe('Admin Operations Flow', () => {
    it('should complete admin operations flow', async () => {
      // 1. Admin checks system health
      const healthResponse = await request(app)
        .get('/api/automation/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(healthResponse.body).toHaveProperty('overall');

      // 2. Admin views analytics dashboard
      const dashboardResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        })
        .expect(200);

      expect(dashboardResponse.body).toHaveProperty('kpis');

      // 3. Admin performs security scan
      const scanResponse = await request(app)
        .post('/api/automation/security/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          scanType: 'vulnerability',
          target: 'codebase',
        })
        .expect(200);

      expect(scanResponse.body).toHaveProperty('status');

      // 4. Admin generates financial report
      const reportResponse = await request(app)
        .get('/api/financial/report')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        })
        .expect(200);

      expect(reportResponse.body).toHaveProperty('revenue');
    });
  });

  describe('Extension Marketplace Flow', () => {
    it('should complete extension submission to approval flow', async () => {
      // 1. Developer submits extension
      const submitResponse = await request(app)
        .post('/api/registry/extensions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test Extension',
          description: 'A test extension',
          version: '1.0.0',
          category: 'utility',
        })
        .expect(201);

      extensionId = submitResponse.body.id;
      expect(extensionId).toBeDefined();

      // 2. Admin reviews extension
      const reviewResponse = await request(app)
        .post(`/api/registry/extensions/${extensionId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          notes: 'Looks good',
        })
        .expect(200);

      expect(reviewResponse.body).toHaveProperty('status');

      // 3. Extension appears in marketplace
      const marketplaceResponse = await request(app)
        .get('/api/extensions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const extension = marketplaceResponse.body.find((e: any) => e.id === extensionId);
      expect(extension).toBeDefined();
    });
  });

  describe('Financial Automation Flow', () => {
    it('should complete revenue sharing to payout flow', async () => {
      // 1. Record revenue share
      const revenueResponse = await request(app)
        .post('/api/financial/revenue-shares')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          extensionId: extensionId || 'test-extension-id',
          transactionId: 'test-transaction-123',
          amount: 10000,
          platformFeePercentage: 30,
          periodStart: '2024-01-01T00:00:00Z',
          periodEnd: '2024-01-31T23:59:59Z',
        })
        .expect(201);

      expect(revenueResponse.body).toHaveProperty('id');

      // 2. Developer views revenue shares
      const sharesResponse = await request(app)
        .get('/api/financial/revenue-shares')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(sharesResponse.body)).toBe(true);

      // 3. Process automatic payouts
      const payoutResponse = await request(app)
        .post('/api/financial/payouts/process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schedule: {
            frequency: 'monthly',
            dayOfMonth: 1,
            minimumAmount: 10000,
          },
        })
        .expect(200);

      expect(payoutResponse.body).toHaveProperty('count');
    });
  });

  describe('Analytics Integration Flow', () => {
    it('should track events and generate reports', async () => {
      // 1. Track analytics event
      const eventResponse = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'extension.downloaded',
          properties: {
            extensionId: extensionId || 'test-extension-id',
          },
        })
        .expect(201);

      expect(eventResponse.body).toHaveProperty('id');

      // 2. Record performance metric
      const metricResponse = await request(app)
        .post('/api/automation/performance/metrics')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          metricName: 'api.response_time',
          metricValue: 150,
          metricType: 'response_time',
          endpoint: '/api/extensions',
        })
        .expect(201);

      expect(metricResponse.body).toHaveProperty('id');

      // 3. Generate dashboard data
      const dashboardResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        })
        .expect(200);

      expect(dashboardResponse.body).toHaveProperty('kpis');
    });
  });

  afterAll(async () => {
    // Cleanup test data
    const pool = getPool();
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    if (extensionId) {
      await pool.query('DELETE FROM extensions WHERE id = $1', [extensionId]);
    }
  });
});

