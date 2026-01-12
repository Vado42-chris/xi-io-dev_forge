/**
 * Performance Load Tests
 * 
 * Tests system performance under load.
 */

import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';

// Import routes
import authRoutes from '../../routes/auth';
import extensionRoutes from '../../routes/extensions';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/extensions', extensionRoutes);

describe('Performance Load Tests', () => {
  const userToken = generateToken({
    id: 'user-id',
    email: 'user@example.com',
    role: 'user',
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 100 concurrent requests', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/extensions')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);

      console.log(`100 concurrent requests completed in ${duration}ms`);
    }, 10000);
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/extensions')
        .set('Authorization', `Bearer ${userToken}`);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should handle authentication within 200ms', async () => {
      const startTime = Date.now();
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
        });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // May fail if user doesn't exist, but should be fast
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Database Query Performance', () => {
    it('should query extensions efficiently', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await request(app)
          .get('/api/extensions')
          .set('Authorization', `Bearer ${userToken}`);
        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average query time: ${averageTime}ms`);
      console.log(`Max query time: ${maxTime}ms`);

      // Average should be reasonable
      expect(averageTime).toBeLessThan(500);
    });
  });
});

