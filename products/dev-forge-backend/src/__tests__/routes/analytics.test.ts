/**
 * Analytics Routes Tests
 */

import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../routes/analytics';
import { generateToken } from '../../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/analytics', analyticsRoutes);

describe('Analytics Routes', () => {
  const adminToken = generateToken({
    id: 'admin-id',
    email: 'admin@example.com',
    role: 'admin',
  });

  const userToken = generateToken({
    id: 'user-id',
    email: 'user@example.com',
    role: 'user',
  });

  describe('POST /api/analytics/events', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/analytics/events')
        .send({
          eventType: 'test.event',
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should track an event', async () => {
      const response = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          eventType: 'test.event',
          properties: { key: 'value' },
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.eventType).toBe('test.event');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/analytics/events')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${userToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should require startDate and endDate', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/analytics/metrics/register', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/analytics/metrics/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'test.metric',
          type: 'gauge',
          description: 'Test metric',
        })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

