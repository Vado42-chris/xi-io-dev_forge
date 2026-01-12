/**
 * System Health Monitoring Service Tests
 */

import { systemHealthMonitoringService } from '../../services/systemHealthMonitoringService';

describe('SystemHealthMonitoringService', () => {
  describe('performHealthCheck', () => {
    it('should perform comprehensive health check', async () => {
      const health = await systemHealthMonitoringService.performHealthCheck();

      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('metrics');
      expect(health.overall).toMatch(/healthy|degraded|unhealthy/);
      expect(Array.isArray(health.services)).toBe(true);
    });
  });

  describe('createAlert', () => {
    it('should create health alert', async () => {
      const alert = await systemHealthMonitoringService.createAlert(
        'test-service',
        'warning',
        'Test alert message'
      );

      expect(alert).toHaveProperty('id');
      expect(alert.serviceName).toBe('test-service');
      expect(alert.severity).toBe('warning');
      expect(alert.status).toBe('active');
    });
  });
});

