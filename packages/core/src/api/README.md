# Dev Forge API Client

Complete API client for Dev Forge backend services.

## Installation

```bash
npm install @dev-forge/core
```

## Quick Start

### Basic Usage

```typescript
import { ApiServices } from '@dev-forge/core';

// Initialize API services
const api = new ApiServices({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
});

// Initialize with existing token (optional)
api.initialize(localStorage.getItem('token'));

// Use services
const authResponse = await api.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

if (authResponse.success && authResponse.data) {
  // Store token
  localStorage.setItem('token', authResponse.data.token);
}
```

### Authentication

```typescript
// Register
const registerResponse = await api.auth.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Login
const loginResponse = await api.auth.login({
  email: 'user@example.com',
  password: 'password123',
});

// Check authentication
if (api.auth.isAuthenticated()) {
  console.log('User is authenticated');
}

// Logout
api.auth.logout();
```

### Payments

```typescript
// Create checkout session
const checkoutResponse = await api.payments.createCheckoutSession({
  productId: 'prod_123',
  productName: 'Dev Forge Pro',
  amount: 9999, // $99.99 in cents
  currency: 'usd',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
});

if (checkoutResponse.success && checkoutResponse.data) {
  // Redirect to checkout URL
  window.location.href = checkoutResponse.data.url;
}
```

### Licenses

```typescript
// Validate license
const validationResponse = await api.licenses.validateLicense('DF-ABC123XYZ');

if (validationResponse.success && validationResponse.data?.valid) {
  console.log('License is valid');
}

// Get user licenses
const licensesResponse = await api.licenses.getUserLicenses();

// Renew license
const renewResponse = await api.licenses.renewLicense('license-id', 365);
```

### Extensions

```typescript
// Get all extensions
const extensionsResponse = await api.extensions.getExtensions({
  status: 'approved',
  category: 'productivity',
  limit: 10,
  offset: 0,
});

// Get extension by ID
const extensionResponse = await api.extensions.getExtension('ext-123');

// Submit review
const reviewResponse = await api.extensions.submitReview('ext-123', {
  rating: 5,
  comment: 'Great extension!',
});
```

### Support

```typescript
// Create support ticket
const ticketResponse = await api.support.createTicket({
  subject: 'Need help with installation',
  description: 'I am having trouble installing the extension.',
  priority: 'medium',
});

// Add message to ticket
const messageResponse = await api.support.addMessage('ticket-id', {
  message: 'I tried restarting the app but it did not help.',
});

// Get knowledge base articles
const articlesResponse = await api.support.getKnowledgeBaseArticles({
  status: 'published',
  category: 'installation',
  search: 'troubleshooting',
});
```

## WebSocket Client

### Real-time Updates

```typescript
import { WebSocketClient } from '@dev-forge/core';

const ws = new WebSocketClient('ws://localhost:3001');

// Connect
await ws.connect(token);

// Subscribe to events
const unsubscribe = ws.on('notification', (event) => {
  console.log('Notification:', event.data);
});

// Send message
ws.send('ping', { timestamp: Date.now() });

// Disconnect
ws.disconnect();
```

## Error Handling

All API methods return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

Example:

```typescript
const response = await api.auth.login(credentials);

if (response.success && response.data) {
  // Handle success
  console.log('Logged in:', response.data.user);
} else if (response.error) {
  // Handle error
  console.error('Login failed:', response.error.message);
}
```

## Retry Logic

The API client automatically retries failed requests:
- Network errors (no response)
- 5xx server errors
- Configurable retry count and delay
- Exponential backoff

## TypeScript Support

Full TypeScript support with type definitions for all services and responses.

