# Production Guide

**Complete guide for using Dev Forge API Client in production.**

---

## 🚀 Getting Started

### Installation

```bash
npm install @dev-forge/core
```

### Basic Setup

```typescript
import { ApiServices } from '@dev-forge/core';

const api = new ApiServices({
  baseURL: process.env.API_URL || 'https://api.dev-forge.com',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Initialize with token from secure storage
const token = await getTokenFromSecureStorage();
api.initialize(token);
```

---

## 🔒 Security Best Practices

### 1. Token Storage

**Electron App:**
```typescript
import { ipcRenderer } from 'electron';

// Store token securely
await ipcRenderer.invoke('store-token', token);

// Retrieve token
const token = await ipcRenderer.invoke('get-token');
```

**Web App:**
```typescript
// Use httpOnly cookies (preferred) or secure localStorage
// Never store tokens in plain localStorage in production
```

### 2. Input Validation

```typescript
import { sanitizeInput, isValidEmail, isStrongPassword } from '@dev-forge/core';

// Sanitize user input
const sanitized = sanitizeInput(userInput);

// Validate email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Validate password
const passwordCheck = isStrongPassword(password);
if (!passwordCheck.valid) {
  console.error('Password errors:', passwordCheck.errors);
}
```

### 3. Error Handling

```typescript
try {
  const response = await api.auth.login(credentials);
  if (!response.success) {
    // Handle error
    console.error('Login failed:', response.error?.message);
  }
} catch (error) {
  // Handle unexpected errors
  errorReporter.report(error, { context: 'login' });
}
```

---

## ⚡ Performance Optimization

### 1. Request Caching

```typescript
// Enable caching for GET requests
const response = await api.client.get('/extensions', {
  useCache: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
});
```

### 2. Rate Limiting

The client automatically handles rate limiting. Monitor rate limit status:

```typescript
const remaining = api.client.getRateLimiter().getRemaining('api-requests');
if (remaining === 0) {
  // Show user-friendly message
  showMessage('Rate limit reached. Please try again later.');
}
```

### 3. Metrics Monitoring

```typescript
// Get performance metrics
const stats = api.client.getMetricsStats();
console.log('API Stats:', {
  totalRequests: stats.total,
  successRate: `${stats.successRate.toFixed(2)}%`,
  averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
});

// Get specific metrics
const metrics = api.client.getMetrics().getMetrics({
  method: 'GET',
  success: true,
  startTime: Date.now() - 3600000, // Last hour
});
```

---

## 📊 Logging

### Configure Logging

```typescript
const logger = api.client.getLogger();

// Set log level
logger.setLevel(LogLevel.INFO); // DEBUG, INFO, WARN, ERROR, NONE

// Log messages
logger.info('User logged in', { userId: user.id });
logger.error('API request failed', { error, url });

// Export logs for debugging
const logs = logger.exportLogs();
```

---

## 🔍 Error Reporting

### Setup Error Reporting

```typescript
import { ErrorReporter } from '@dev-forge/core';

const errorReporter = new ErrorReporter();

// Set handler (e.g., send to error tracking service)
errorReporter.setHandler((report) => {
  // Send to Sentry, LogRocket, etc.
  sendToErrorTrackingService(report);
});

// Report errors
try {
  await api.auth.login(credentials);
} catch (error) {
  errorReporter.report(error, {
    userId: currentUser?.id,
    action: 'login',
  });
}
```

---

## 🎯 Feature Flags

### Use Feature Flags

```typescript
import { FeatureFlags } from '@dev-forge/core';

const flags = new FeatureFlags();
flags.loadFromEnv('FEATURE_');

if (flags.isEnabled('new_checkout_flow')) {
  // Use new checkout flow
} else {
  // Use old checkout flow
}
```

---

## 📈 Monitoring

### Health Checks

```typescript
// Regular health checks
setInterval(async () => {
  const health = await api.client.healthCheck();
  if (!health.success || health.data?.status !== 'healthy') {
    // Alert monitoring system
    alertMonitoringSystem('API health check failed');
  }
}, 60000); // Every minute
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@dev-forge/core';

const perf = new PerformanceMonitor();

perf.mark('api-request-start');
const response = await api.extensions.getExtensions();
perf.measureAndLog('api-request'); // Logs: [Performance] api-request: 123.45ms
```

---

## 🧪 Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { ApiServices } from '@dev-forge/core';

describe('API Services', () => {
  it('should initialize correctly', () => {
    const api = new ApiServices({
      baseURL: 'http://localhost:3001',
    });
    expect(api).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// Set INTEGRATION_TEST=true to run integration tests
const api = new ApiServices({
  baseURL: process.env.API_URL || 'http://localhost:3001',
});

// Test with real backend
const response = await api.auth.login({
  email: 'test@example.com',
  password: 'password123',
});
expect(response.success).toBe(true);
```

---

## 🚨 Production Checklist

- [ ] API URL configured correctly
- [ ] Token storage secure (httpOnly cookies or Electron secure storage)
- [ ] Error reporting configured
- [ ] Logging level set appropriately
- [ ] Rate limiting monitored
- [ ] Health checks implemented
- [ ] Metrics collection enabled
- [ ] Caching strategy defined
- [ ] Input validation in place
- [ ] Error handling comprehensive
- [ ] Feature flags configured
- [ ] Performance monitoring active

---

## 📚 Additional Resources

- [API Documentation](./README.md)
- [Integration Examples](./examples/)
- [Security Best Practices](#-security-best-practices)
- [Performance Optimization](#-performance-optimization)

---

**#this-is-the-way #so-say-we-all #hallbergstrong**

