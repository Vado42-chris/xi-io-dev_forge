# 👋 Developer Onboarding Guide

**Date:** January 10, 2025  
**Status:** 📋 **ONBOARDING DOCUMENT**  
**Hashtag:** `#onboarding`, `#developer-guide`, `#sdk`

---

## 🎯 WELCOME

Welcome to the Dev Forge SDK! This guide will help you understand the architecture, set up your development environment, and start contributing.

---

## 📚 TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Common Tasks](#common-tasks)
6. [Code Style](#code-style)
7. [Testing](#testing)
8. [Contributing](#contributing)

---

## 🏛️ ARCHITECTURE OVERVIEW

### **Three-Layer Architecture**

```
┌─────────────────────────────────────┐
│   Product Layer                      │
│   (dev-forge, vectorforge, etc.)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Adapter Layer                     │
│   (@dev-forge/vscode, /react)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Core SDK Layer                     │
│   (@dev-forge/core)                 │
└─────────────────────────────────────┘
```

### **Key Principles**

1. **Separation of Concerns**
   - Core SDK: Framework-agnostic logic
   - Adapters: Product-specific integrations
   - Products: User-facing applications

2. **Extensibility**
   - Plugin system for custom functionality
   - Provider system for new model/API sources
   - Configuration system for customization

3. **Type Safety**
   - Full TypeScript support
   - Exported types for all APIs
   - Compile-time error checking

---

## 🛠️ DEVELOPMENT SETUP

### **Prerequisites**

- Node.js 18+ and npm
- TypeScript 5.3+
- Git
- VS Code (recommended)

### **Initial Setup**

```bash
# Clone repository
git clone <repository-url>
cd dev_forge

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### **Development Workflow**

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Run specific package
cd packages/core
npm run build

# Run extension in VS Code
# Press F5 in VS Code to launch Extension Development Host
```

---

## 📁 PROJECT STRUCTURE

```
dev_forge/
├── packages/
│   ├── core/              # Core SDK
│   │   ├── src/
│   │   │   ├── providers/ # Model providers
│   │   │   ├── api/       # API providers
│   │   │   ├── plugins/   # Plugin system
│   │   │   └── types/     # TypeScript types
│   │   └── package.json
│   │
│   └── vscode/            # VS Code adapter
│       ├── src/
│       │   ├── adapters/  # SDK adapters
│       │   └── ui/        # UI components
│       └── package.json
│
├── products/
│   └── dev-forge/        # Dev Forge extension
│       ├── extension/
│       └── package.json
│
├── docs/                 # Documentation
├── examples/             # Example projects
└── package.json          # Root workspace
```

---

## 🧠 CORE CONCEPTS

### **1. Model Providers**

Model providers abstract different AI model sources:

```typescript
import { ModelProvider, ModelMetadata } from '@dev-forge/core';

class MyModelProvider implements ModelProvider {
  id = 'my-provider';
  name = 'My Provider';
  type = 'api';
  
  async initialize() { /* ... */ }
  async listModels(): Promise<ModelMetadata[]> { /* ... */ }
  async generate(request: GenerateRequest): Promise<GenerateResponse> { /* ... */ }
}
```

### **2. API Providers**

API providers handle external API integrations:

```typescript
import { ApiProvider } from '@dev-forge/core';

class MyApiProvider implements ApiProvider {
  id = 'my-api';
  name = 'My API';
  type = 'custom';
  
  async generate(request: GenerateRequest): Promise<GenerateResponse> { /* ... */ }
}
```

### **3. Plugins**

Plugins extend functionality:

```typescript
import { DevForgePlugin } from '@dev-forge/core';

const myPlugin: DevForgePlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  activate: async (context) => {
    // Plugin activation logic
  }
};
```

### **4. Configuration**

Unified configuration system:

```typescript
import { loadConfig } from '@dev-forge/core';

const config = await loadConfig({
  sources: ['file', 'env'],
  product: 'dev-forge'
});
```

---

## 🎯 COMMON TASKS

### **Creating a New Model Provider**

1. Create provider class implementing `ModelProvider`
2. Register with `ModelProviderRegistry`
3. Add configuration options
4. Write tests
5. Document usage

**Example:**
```typescript
// packages/core/src/providers/myProvider.ts
export class MyProvider implements ModelProvider {
  // Implementation
}

// Register in extension
await modelProviderRegistry.registerProvider(new MyProvider());
```

### **Creating a New Plugin**

1. Create plugin manifest (`plugin.json`)
2. Implement plugin interface
3. Define permissions
4. Test in sandbox
5. Document API usage

**Example:**
```json
// plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "permissions": ["model", "api"]
}
```

### **Adding VS Code Settings**

1. Add to `package.json` `contributes.configuration`
2. Update TypeScript types
3. Add validation
4. Document in README

**Example:**
```json
{
  "contributes": {
    "configuration": {
      "properties": {
        "devForge.mySetting": {
          "type": "string",
          "default": "value",
          "description": "My setting"
        }
      }
    }
  }
}
```

---

## 💅 CODE STYLE

### **TypeScript**

- Use strict mode
- Prefer interfaces over types for public APIs
- Export types for all public APIs
- Use async/await over promises
- Document all public methods

### **Naming Conventions**

- Classes: PascalCase (`ModelProvider`)
- Functions: camelCase (`generateResponse`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- Files: kebab-case (`model-provider.ts`)

### **Documentation**

- JSDoc comments for all public APIs
- Examples in documentation
- Type annotations for clarity

**Example:**
```typescript
/**
 * Generates a response from a model
 * @param request - The generation request
 * @returns Promise resolving to the generation response
 * @example
 * const response = await provider.generate({
 *   prompt: "Hello",
 *   modelId: "model-1"
 * });
 */
async generate(request: GenerateRequest): Promise<GenerateResponse> {
  // Implementation
}
```

---

## 🧪 TESTING

### **Test Structure**

```
src/
├── providers/
│   ├── myProvider.ts
│   └── __tests__/
│       └── myProvider.test.ts
```

### **Writing Tests**

```typescript
import { describe, it, expect } from 'vitest';
import { MyProvider } from '../myProvider';

describe('MyProvider', () => {
  it('should initialize correctly', async () => {
    const provider = new MyProvider();
    await provider.initialize();
    expect(provider.isAvailable()).resolves.toBe(true);
  });
});
```

### **Running Tests**

```bash
# Run all tests
npm test

# Run specific test file
npm test myProvider.test.ts

# Watch mode
npm test -- --watch
```

---

## 🤝 CONTRIBUTING

### **Workflow**

1. Create feature branch (`git checkout -b feature/my-feature`)
2. Make changes
3. Write tests
4. Update documentation
5. Commit (`git commit -m "Add my feature"`)
6. Push (`git push origin feature/my-feature`)
7. Create pull request

### **Pull Request Checklist**

- [ ] Code follows style guide
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Examples updated (if applicable)

### **Code Review**

- All PRs require review
- Address feedback promptly
- Keep PRs focused and small
- Update documentation as needed

---

## 📖 RESOURCES

### **Documentation**

- [SDK Architecture](./SDK_ARCHITECTURE.md)
- [API Reference](./docs/api-reference/)
- [Examples](./examples/)

### **External Resources**

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## ❓ FAQ

### **Q: How do I add a new product?**

A: Create a new directory in `products/`, use the appropriate adapter (`@dev-forge/vscode` or `@dev-forge/react`), and import from `@dev-forge/core`.

### **Q: Can I use the SDK outside of VS Code?**

A: Yes! The core SDK is framework-agnostic. Use the appropriate adapter or create your own.

### **Q: How do I contribute a plugin?**

A: Create a plugin following the plugin template, test it thoroughly, and submit a PR with documentation.

---

## 🎸 GETTING HELP

- **Documentation:** Check the docs folder
- **Examples:** See the examples folder
- **Issues:** Open a GitHub issue
- **Discussions:** Join the team discussion

---

**Welcome to the team! The SDK abides. Let's forge the future together! 🎸**

