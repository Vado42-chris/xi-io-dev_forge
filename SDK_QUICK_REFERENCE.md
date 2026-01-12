# ⚡ SDK Quick Reference

**Date:** January 10, 2025  
**Status:** 📋 **QUICK REFERENCE**  
**Hashtag:** `#sdk`, `#quick-reference`, `#developer`

---

## 🚀 QUICK START

### **Install Core SDK**
```typescript
import { ModelProviderRegistry, OllamaProvider } from '@dev-forge/core';

const registry = new ModelProviderRegistry();
await registry.registerProvider(new OllamaProvider());
```

### **Use in VS Code Extension**
```typescript
import { ModelProviderRegistry } from '@dev-forge/core';
import { createVSCodeExtension } from '@dev-forge/vscode';

const extension = createVSCodeExtension({
  modelProviderRegistry: new ModelProviderRegistry()
});
```

### **Use in React App**
```typescript
import { useModelProvider } from '@dev-forge/react';

function MyComponent() {
  const { models, generate } = useModelProvider();
  // Use models and generate
}
```

---

## 📦 PACKAGE STRUCTURE

```
@dev-forge/core      # Core SDK (framework-agnostic)
@dev-forge/vscode    # VS Code adapter
@dev-forge/react     # React adapter
```

---

## 🔌 CORE INTERFACES

### **ModelProvider**
```typescript
interface ModelProvider {
  id: string;
  name: string;
  type: ModelProviderType;
  enabled: boolean;
  initialize(): Promise<void>;
  listModels(): Promise<ModelMetadata[]>;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  stream?(request: GenerateRequest): AsyncGenerator<StreamChunk>;
}
```

### **ApiProvider**
```typescript
interface ApiProvider {
  id: string;
  name: string;
  type: ApiProviderType;
  generate(request: GenerateRequest): Promise<GenerateResponse>;
}
```

### **DevForgePlugin**
```typescript
interface DevForgePlugin {
  id: string;
  name: string;
  version: string;
  activate(context: PluginContext): Promise<void>;
  deactivate?(): Promise<void>;
}
```

---

## 🎯 COMMON PATTERNS

### **Create Custom Provider**
```typescript
class MyProvider implements ModelProvider {
  id = 'my-provider';
  name = 'My Provider';
  type = 'api';
  enabled = true;
  
  async initialize() { /* ... */ }
  async listModels() { /* ... */ }
  async generate(request) { /* ... */ }
}
```

### **Register Provider**
```typescript
const registry = new ModelProviderRegistry();
await registry.registerProvider(new MyProvider());
```

### **Generate Response**
```typescript
const response = await registry.generate('my-provider', {
  prompt: 'Hello',
  modelId: 'model-1'
});
```

### **Create Plugin**
```typescript
const plugin: DevForgePlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  activate: async (context) => {
    // Plugin logic
  }
};
```

---

## 📚 DOCUMENTATION LINKS

- [SDK Architecture](./SDK_ARCHITECTURE.md) - Full architecture overview
- [Extraction Plan](./SDK_EXTRACTION_PLAN.md) - How to extract SDK
- [Developer Onboarding](./DEVELOPER_ONBOARDING.md) - Complete guide
- [API Reference](./docs/api-reference/) - Detailed API docs

---

## 🎸 QUICK TIPS

- ✅ Always use TypeScript types
- ✅ Follow the three-layer architecture
- ✅ Keep core SDK framework-agnostic
- ✅ Use adapters for product-specific code
- ✅ Document all public APIs

---

**🎸 The SDK abides. Forge ahead! 🎸**

