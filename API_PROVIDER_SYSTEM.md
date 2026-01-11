# 🔗 API Provider System - Custom API Integration

**Date:** January 10, 2025  
**Status:** 📋 **IMPLEMENTATION PLAN**  
**Hashtag:** `#dev-forge`, `#api-providers`, `#cursor`, `#custom-apis`

---

## 🎯 REQUIREMENTS

### **User Requirements:**
1. ✅ Support Cursor API integration
2. ✅ Support OpenAI-compatible APIs
3. ✅ Support Anthropic API
4. ✅ Support custom API endpoints
5. ✅ Secure API key management
6. ✅ API provider switching
7. ✅ Rate limiting
8. ✅ Retry logic

---

## 🔍 API PROVIDER ARCHITECTURE

### **Base API Provider Interface:**
```typescript
interface ApiProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'cursor' | 'custom';
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  enabled: boolean;
  
  // Configuration
  timeout?: number;
  rateLimit?: RateLimit;
  retry?: RetryConfig;
  
  // Methods
  generate(prompt: string, options: GenerateOptions): Promise<string>;
  stream?(prompt: string, options: GenerateOptions): AsyncGenerator<string>;
  getModels(): Promise<Model[]>;
  
  // Lifecycle
  initialize(): Promise<void>;
  validate(): Promise<boolean>;
  getHealth(): Promise<HealthStatus>;
}
```

### **Rate Limit Configuration:**
```typescript
interface RateLimit {
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  tokensPerMinute?: number;
}
```

### **Retry Configuration:**
```typescript
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
}
```

---

## 🔗 CURSOR API INTEGRATION

### **Cursor API Research:**
- **Base URL:** `https://api.cursor.sh` (assumed)
- **Authentication:** API key in headers
- **Endpoints:** (Need to research actual Cursor API)
  - `/v1/chat/completions` (assumed)
  - `/v1/models` (assumed)
  - `/v1/workspace/context` (assumed)

### **CursorApiProvider Implementation:**
```typescript
import axios, { AxiosInstance } from 'axios';
import { ApiProvider, GenerateOptions, Model } from '../types';

export class CursorApiProvider implements ApiProvider {
  id: string = 'cursor';
  name: string = 'Cursor API';
  type: 'cursor' = 'cursor';
  baseUrl: string;
  apiKey?: string;
  headers: Record<string, string> = {};
  enabled: boolean = true;
  
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;

  constructor(config: CursorApiConfig) {
    this.baseUrl = config.baseUrl || 'https://api.cursor.sh';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.rateLimit = config.rateLimit;
    this.retry = config.retry || {
      maxRetries: 3,
      retryDelay: 1000,
      retryableStatusCodes: [429, 500, 502, 503, 504]
    };

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...this.headers
      }
    });

    this.rateLimiter = new RateLimiter(this.rateLimit);
    this.retryHandler = new RetryHandler(this.retry);
  }

  async initialize(): Promise<void> {
    // Validate API key
    await this.validate();
    
    // Test connection
    const health = await this.getHealth();
    if (!health.isHealthy) {
      throw new Error(`Cursor API not available: ${health.message}`);
    }
  }

  async validate(): Promise<boolean> {
    try {
      const response = await this.client.get('/v1/models');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getModels(): Promise<Model[]> {
    try {
      const response = await this.client.get('/v1/models');
      return response.data.data.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'cursor',
        enabled: true
      }));
    } catch (error) {
      throw new Error(`Failed to get Cursor models: ${error}`);
    }
  }

  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit();

    // Make request with retry
    const response = await this.retryHandler.execute(async () => {
      return await this.client.post('/v1/chat/completions', {
        model: options.model || 'default',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: false
      });
    });

    return response.data.choices[0].message.content;
  }

  async *stream(prompt: string, options: GenerateOptions): AsyncGenerator<string> {
    // Check rate limit
    await this.rateLimiter.checkLimit();

    const response = await this.client.post('/v1/chat/completions', {
      model: options.model || 'default',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true
    }, {
      responseType: 'stream'
    });

    for await (const chunk of this.parseStream(response.data)) {
      yield chunk;
    }
  }

  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return {
        isHealthy: response.status === 200,
        message: 'OK'
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Cursor-specific methods
    async getContext(workspaceId: string): Promise<Context> {
      const response = await this.client.get(`/v1/workspace/${workspaceId}/context`);
      return response.data;
    }

    async getCompletions(workspaceId: string): Promise<Completion[]> {
      const response = await this.client.get(`/v1/workspace/${workspaceId}/completions`);
      return response.data;
    }

    private async *parseStream(stream: any): AsyncGenerator<string> {
      // Parse SSE stream
      // Implementation depends on Cursor API format
    }
}
```

---

## 🔧 OPENAI-COMPATIBLE PROVIDER

### **OpenAIProvider Implementation:**
```typescript
export class OpenAIProvider implements ApiProvider {
  id: string = 'openai';
  name: string = 'OpenAI API';
  type: 'openai' = 'openai';
  baseUrl: string = 'https://api.openai.com/v1';
  
  // Standard OpenAI API implementation
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const response = await this.client.post('/chat/completions', {
      model: options.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    });
    
    return response.data.choices[0].message.content;
  }
}
```

---

## 🔧 ANTHROPIC PROVIDER

### **AnthropicProvider Implementation:**
```typescript
export class AnthropicProvider implements ApiProvider {
  id: string = 'anthropic';
  name: string = 'Anthropic API';
  type: 'anthropic' = 'anthropic';
  baseUrl: string = 'https://api.anthropic.com/v1';
  
  // Anthropic API implementation
  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    const response = await this.client.post('/messages', {
      model: options.model || 'claude-3-opus-20240229',
      max_tokens: options.maxTokens || 1024,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.data.content[0].text;
  }
}
```

---

## 🔧 CUSTOM API PROVIDER

### **CustomApiProvider Implementation:**
```typescript
export class CustomApiProvider implements ApiProvider {
  id: string;
  name: string;
  type: 'custom' = 'custom';
  baseUrl: string;
  apiKey?: string;
  headers: Record<string, string> = {};
  
  // Custom endpoint configuration
  endpoints: {
    generate: string;
    stream?: string;
    models?: string;
  };
  
  // Request/response transformers
  requestTransformer?: (request: any) => any;
  responseTransformer?: (response: any) => string;

  async generate(prompt: string, options: GenerateOptions): Promise<string> {
    let requestBody = {
      prompt,
      ...options
    };

    // Apply request transformer if provided
    if (this.requestTransformer) {
      requestBody = this.requestTransformer(requestBody);
    }

    const response = await this.client.post(this.endpoints.generate, requestBody);
    
    // Apply response transformer if provided
    if (this.responseTransformer) {
      return this.responseTransformer(response.data);
    }

    // Default: assume OpenAI-compatible format
    return response.data.choices?.[0]?.message?.content || 
           response.data.content || 
           response.data.text ||
           JSON.stringify(response.data);
  }
}
```

---

## 📋 API PROVIDER REGISTRY

### **ApiProviderRegistry Implementation:**
```typescript
export class ApiProviderRegistry {
  private providers: Map<string, ApiProvider> = new Map();
  private configManager: ConfigurationManager;

  constructor(configManager: ConfigurationManager) {
    this.configManager = configManager;
  }

  async initialize(): Promise<void> {
    // Load providers from configuration
    const config = this.configManager.getApiProviderConfigs();
    
    for (const providerConfig of config) {
      await this.registerProvider(providerConfig);
    }
  }

  async registerProvider(config: ApiProviderConfig): Promise<void> {
    let provider: ApiProvider;

    switch (config.type) {
      case 'cursor':
        provider = new CursorApiProvider(config);
        break;
      case 'openai':
        provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        provider = new AnthropicProvider(config);
        break;
      case 'custom':
        provider = new CustomApiProvider(config);
        break;
      default:
        throw new Error(`Unknown API provider type: ${config.type}`);
    }

    await provider.initialize();
    this.providers.set(provider.id, provider);
  }

  async unregisterProvider(id: string): Promise<void> {
    const provider = this.providers.get(id);
    if (provider) {
      // Cleanup if needed
      this.providers.delete(id);
    }
  }

  getProvider(id: string): ApiProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): ApiProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): ApiProvider[] {
    return this.getAllProviders().filter(p => p.enabled);
  }

  getProvidersByType(type: string): ApiProvider[] {
    return this.getAllProviders().filter(p => p.type === type);
  }
}
```

---

## 🔐 API KEY MANAGEMENT

### **SecretStorage Integration:**
```typescript
import * as vscode from 'vscode';

export class ApiKeyManager {
  private secretStorage: vscode.SecretStorage;
  private config: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
    this.config = vscode.workspace.getConfiguration('devForge');
  }

  async storeApiKey(providerId: string, apiKey: string): Promise<void> {
    // Store in VS Code SecretStorage
    await this.secretStorage.store(`devForge.${providerId}.apiKey`, apiKey);
  }

  async getApiKey(providerId: string): Promise<string | undefined> {
    // Try SecretStorage first
    let apiKey = await this.secretStorage.get(`devForge.${providerId}.apiKey`);
    
    // Fallback to config (for env var references)
    if (!apiKey) {
      const configKey = this.config.get<string>(`apiProviders.providers.${providerId}.apiKey`);
      if (configKey?.startsWith('${env:')) {
        const envVar = configKey.match(/\${env:([^}]+)}/)?.[1];
        apiKey = process.env[envVar || ''];
      }
    }
    
    return apiKey;
  }

  async deleteApiKey(providerId: string): Promise<void> {
    await this.secretStorage.delete(`devForge.${providerId}.apiKey`);
  }
}
```

---

## 🚦 RATE LIMITING

### **RateLimiter Implementation:**
```typescript
export class RateLimiter {
  private limits: RateLimit;
  private requests: Map<string, number[]> = new Map();

  constructor(limits?: RateLimit) {
    this.limits = limits || {};
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const key = 'default';

    // Get request history
    const history = this.requests.get(key) || [];
    
    // Clean old requests
    const recentHistory = history.filter(timestamp => now - timestamp < 60000);
    
    // Check per-minute limit
    if (this.limits.requestsPerMinute && recentHistory.length >= this.limits.requestsPerMinute) {
      const oldest = Math.min(...recentHistory);
      const waitTime = 60000 - (now - oldest);
      await this.wait(waitTime);
    }
    
    // Update history
    recentHistory.push(now);
    this.requests.set(key, recentHistory);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🔄 RETRY HANDLING

### **RetryHandler Implementation:**
```typescript
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        const statusCode = error.response?.status;
        if (statusCode && !this.config.retryableStatusCodes.includes(statusCode)) {
          throw error; // Not retryable
        }
        
        // Wait before retry
        if (attempt < this.config.maxRetries) {
          await this.wait(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError || new Error('Retry failed');
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Base API Provider** 🔴
- [ ] Create `ApiProvider` interface
- [ ] Create `ApiProviderRegistry`
- [ ] Implement API key management
- [ ] Implement rate limiting
- [ ] Implement retry handling

### **Phase 2: Cursor API** 🔴
- [ ] Research Cursor API endpoints
- [ ] Create `CursorApiProvider`
- [ ] Implement Cursor-specific methods
- [ ] Add Cursor settings
- [ ] Test Cursor integration

### **Phase 3: Standard Providers** 🔴
- [ ] Create `OpenAIProvider`
- [ ] Create `AnthropicProvider`
- [ ] Create `CustomApiProvider`
- [ ] Test each provider

### **Phase 4: Integration** 🔴
- [ ] Integrate with `modelManager`
- [ ] Integrate with `parallelExecution`
- [ ] Add provider selection UI
- [ ] Add API key management UI

### **Phase 5: Advanced Features** 🔴
- [ ] Provider health monitoring
- [ ] Automatic failover
- [ ] Provider load balancing
- [ ] Usage analytics

---

## 🔍 CURSOR API RESEARCH NEEDED

### **What We Need to Discover:**
1. **Actual API Endpoints:**
   - Chat completions endpoint
   - Models list endpoint
   - Workspace context endpoint
   - Authentication method

2. **API Format:**
   - Request format
   - Response format
   - Streaming format
   - Error format

3. **Rate Limits:**
   - Requests per minute
   - Tokens per minute
   - Rate limit headers

4. **Authentication:**
   - API key format
   - Header name
   - Token expiration

---

**🎸 API provider system designed. Ready to implement! 🎸**

