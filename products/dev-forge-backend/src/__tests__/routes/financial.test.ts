/**
 * Financial Routes Tests
 */

import request from 'supertest';
import express from 'express';
import financialRoutes from '../../routes/financial';
import { generateToken } from '../../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/financial', financialRoutes);

describe('Financial Routes', () => {
  const adminToken = generateToken({
    id: 'admin-id',
    email: 'admin@example.com',
    role: 'admin',
  });

  const developerToken = generateToken({
    id: 'developer-id',
    email: 'developer@example.com',
    role: 'developer',
  });

  describe('GET /api/financial/revenue-shares', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/financial/revenue-shares')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should return revenue shares for authenticated developer', async () => {
      const response = await request(app)
        .get('/api/financial/revenue-shares')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/financial/revenue-shares', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/financial/revenue-shares')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          extensionId: 'extension-id',
          transactionId: 'transaction-id',
          amount: 10000,
        })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/financial/revenue-shares')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/financial/tax-report', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/financial/tax-report')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should require year parameter', async () => {
      const response = await request(app)
        .get('/api/financial/tax-report')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });
});

