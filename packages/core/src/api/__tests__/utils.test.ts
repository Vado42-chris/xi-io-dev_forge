/**
 * Utilities Tests
 * 
 * Tests for utility functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RequestCache } from '../utils/requestCache';
import { RateLimiter } from '../utils/rateLimiter';
import { Logger, LogLevel } from '../utils/logger';
import { MetricsCollector } from '../utils/metrics';
import {
  sanitizeInput,
  isValidEmail,
  isStrongPassword,
  isValidUrl,
  escapeHtml,
} from '../utils/security';

describe('RequestCache', () => {
  let cache: RequestCache;

  beforeEach(() => {
    cache = new RequestCache();
  });

  it('should cache and retrieve data', () => {
    cache.set('test-key', { data: 'test' });
    const result = cache.get('test-key');
    expect(result).toEqual({ data: 'test' });
  });

  it('should expire cached data', async () => {
    cache.set('test-key', { data: 'test' }, 100); // 100ms TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    const result = cache.get('test-key');
    expect(result).toBeNull();
  });

  it('should generate cache keys correctly', () => {
    const key = RequestCache.generateKey('GET', '/test', { id: 1 });
    expect(key).toContain('GET');
    expect(key).toContain('/test');
  });
});

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  it('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(limiter.isAllowed('test-key', 10)).toBe(true);
    }
  });

  it('should block requests over limit', () => {
    for (let i = 0; i < 10; i++) {
      limiter.isAllowed('test-key', 10);
    }
    expect(limiter.isAllowed('test-key', 10)).toBe(false);
  });

  it('should reset after window', async () => {
    limiter.isAllowed('test-key', 1, 100); // 1 request per 100ms
    expect(limiter.isAllowed('test-key', 1, 100)).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(limiter.isAllowed('test-key', 1, 100)).toBe(true);
  });
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
  });

  it('should log messages', () => {
    logger.info('Test message');
    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should respect log level', () => {
    logger.setLevel(LogLevel.ERROR);
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
    
    const logs = logger.getLogs(LogLevel.ERROR);
    expect(logs.length).toBe(1);
  });
});

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector();
  });

  it('should record metrics', () => {
    metrics.record({
      url: '/test',
      method: 'GET',
      duration: 100,
      success: true,
    });

    const stats = metrics.getStats();
    expect(stats.total).toBe(1);
    expect(stats.successful).toBe(1);
  });

  it('should calculate statistics', () => {
    metrics.record({ url: '/test1', method: 'GET', duration: 100, success: true });
    metrics.record({ url: '/test2', method: 'GET', duration: 200, success: true });
    metrics.record({ url: '/test3', method: 'GET', duration: 50, success: false });

    const stats = metrics.getStats();
    expect(stats.total).toBe(3);
    expect(stats.successful).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.averageDuration).toBe(116.67);
  });
});

describe('Security Utilities', () => {
  it('should sanitize input', () => {
    const input = '<script>alert("xss")</script>Hello';
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
  });

  it('should validate email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  it('should validate password strength', () => {
    const weak = isStrongPassword('weak');
    expect(weak.valid).toBe(false);

    const strong = isStrongPassword('StrongP@ssw0rd');
    expect(strong.valid).toBe(true);
  });

  it('should validate URL', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('should escape HTML', () => {
    const escaped = escapeHtml('<script>alert("xss")</script>');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;');
  });
});

