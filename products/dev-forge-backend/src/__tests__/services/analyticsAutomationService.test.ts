/**
 * Analytics Automation Service Tests
 */

import { analyticsAutomationService } from '../../services/analyticsAutomationService';

describe('AnalyticsAutomationService', () => {
  describe('trackEvent', () => {
    it('should track an event with properties', async () => {
      const event = await analyticsAutomationService.trackEvent(
        'test.event',
        { key: 'value' },
        'user-id',
        'session-id'
      );

      expect(event).toHaveProperty('id');
      expect(event.eventType).toBe('test.event');
      expect(event.properties).toEqual({ key: 'value' });
      expect(event.userId).toBe('user-id');
      expect(event.sessionId).toBe('session-id');
    });

    it('should track an event without user or session', async () => {
      const event = await analyticsAutomationService.trackEvent('test.event');

      expect(event).toHaveProperty('id');
      expect(event.eventType).toBe('test.event');
      expect(event.userId).toBeUndefined();
      expect(event.sessionId).toBeUndefined();
    });
  });

  describe('getEventCount', () => {
    it('should return event count for a type', async () => {
      // First, track some events
      await analyticsAutomationService.trackEvent('test.count');
      await analyticsAutomationService.trackEvent('test.count');
      await analyticsAutomationService.trackEvent('test.count');

      const count = await analyticsAutomationService.getEventCount('test.count');
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });
});

