/**
 * Distribution Routes Tests
 */

import request from 'supertest';
import express from 'express';
import distributionRoutes from '../../routes/distribution';
import { generateToken } from '../../middleware/auth';

const app = express();
app.use(express.json());
app.use('/api/distribution', distributionRoutes);

describe('Distribution Routes', () => {
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

  describe('POST /api/distribution/versions', () => {
    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/distribution/versions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          version: '1.0.0',
        })
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should validate semantic version', async () => {
      const response = await request(app)
        .post('/api/distribution/versions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: 'invalid',
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/distribution/versions/latest', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/distribution/versions/latest')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/distribution/versions/compare', () => {
    it('should compare two versions', async () => {
      const response = await request(app)
        .post('/api/distribution/versions/compare')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          version1: '1.2.3',
          version2: '1.2.4',
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toBe('less');
    });
  });

  describe('POST /api/distribution/updates/check', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/distribution/updates/check')
        .send({
          currentVersion: '1.0.0',
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

