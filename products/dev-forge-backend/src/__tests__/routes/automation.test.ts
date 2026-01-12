/**
 * Automation Routes Tests
 */

import request from 'supertest';
import express from 'express';
import automationRoutes from '../../routes/automation';
import { generateToken } from '../../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/automation', automationRoutes);

describe('Automation Routes', () => {
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

  describe('GET /api/automation/health', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/automation/health')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should return system health', async () => {
      const response = await request(app)
        .get('/api/automation/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('POST /api/automation/performance/metrics', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/automation/performance/metrics')
        .send({
          metricName: 'test.metric',
          metricValue: 100,
          metricType: 'response_time',
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/automation/performance/metrics')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/automation/security/scan', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/automation/security/scan')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          scanType: 'vulnerability',
          target: 'test',
        })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

