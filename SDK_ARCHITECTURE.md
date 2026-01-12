# 🏗️ Dev Forge SDK Architecture

**Date:** January 10, 2025  
**Status:** 📋 **SDK DESIGN**  
**Hashtag:** `#sdk`, `#architecture`, `#multi-product`

---

## 🎯 SDK VISION

**Create a robust, extensible SDK that:**
- Serves as the foundation for Dev Forge
- Can be expanded into other products (VectorForge, Network App, etc.)
- Provides a clear baseline for future developers
- Maintains consistency across all products
- Enables rapid product development

---

## 🏛️ CORE ARCHITECTURE

### **Layer 1: Core SDK (`@dev-forge/core`)**

**Purpose:** Foundation layer shared across all products

**Components:**
```
core/
├── providers/          # Model & API provider abstractions
├── types/              # Shared TypeScript interfaces
├── utils/              # Common utilities
├── config/             # Configuration management
└── errors/             # Error handling & types
```

**Key Principles:**
- ✅ Zero dependencies on product-specific code
- ✅ Framework-agnostic (works with VS Code, React, Node.js, etc.)
- ✅ Well-documented interfaces
- ✅ Type-safe APIs

---

### **Layer 2: Product Adapters (`@dev-forge/adapters`)**

**Purpose:** Adapters that connect core SDK to specific products

**Adapters:**
```
adapters/
├── vscode/             # VS Code extension adapter
├── react/              # React component adapter
├── node/               # Node.js service adapter
└── cli/                # Command-line interface adapter
```

**Key Principles:**
- ✅ Thin layer - delegates to core SDK
- ✅ Product-specific UI/UX only
- ✅ Reusable across similar products

---

### **Layer 3: Product Implementations**

**Purpose:** Specific product implementations using SDK + Adapters

**Products:**
```
products/
├── dev-forge/          # VS Code extension
├── vectorforge/         # VectorForge UI
├── network-app/         # Network management app
└── future-products/     # Future expansions
```

**Key Principles:**
- ✅ Uses SDK + appropriate adapter
- ✅ Product-specific features only
- ✅ Consistent architecture

---

## 📦 SDK PACKAGE STRUCTURE

### **Package: `@dev-forge/core`**

```typescript
// Core SDK exports
export {
  // Providers
  ModelProvider,
  ModelProviderRegistry,
  ApiProvider,
  ApiProviderRegistry,
  
  // Types
  ModelMetadata,
  GenerateRequest,
  GenerateResponse,
  
  // Utilities
  createModelProvider,
  createApiProvider,
  
  // Configuration
  SDKConfig,
  loadConfig,
  
  // Errors
  SDKError,
  ProviderError,
} from '@dev-forge/core';
```

**Dependencies:**
- Zero runtime dependencies (or minimal)
- TypeScript types only

---

### **Package: `@dev-forge/vscode`**

```typescript
// VS Code adapter exports
export {
  // VS Code-specific providers
  VSCodeModelProvider,
  VSCodeApiProvider,
  
  // VS Code utilities
  createVSCodeExtension,
  registerCommands,
  
  // VS Code types
  VSCodeExtensionContext,
} from '@dev-forge/vscode';
```

**Dependencies:**
- `@dev-forge/core`
- `vscode` (VS Code API)

---

### **Package: `@dev-forge/react`**

```typescript
// React adapter exports
export {
  // React hooks
  useModelProvider,
  useApiProvider,
  useModelGeneration,
  
  // React components
  ModelSelector,
  ApiProviderManager,
  ChatInterface,
  
  // React types
  ModelProviderProps,
} from '@dev-forge/react';
```

**Dependencies:**
- `@dev-forge/core`
- `react`

---

## 🔌 PLUGIN SYSTEM ARCHITECTURE

### **Core Plugin Interface**

```typescript
// @dev-forge/core
export interface DevForgePlugin {
  id: string;
  name: string;
  version: string;
  api: PluginAPI;
  activate(context: PluginContext): Promise<void>;
  deactivate?(): Promise<void>;
}
```

### **Product-Specific Plugin APIs**

```typescript
// @dev-forge/vscode
export interface VSCodePluginAPI extends PluginAPI {
  vscode: {
    commands: typeof vscode.commands;
    window: typeof vscode.window;
    workspace: typeof vscode.workspace;
  };
}

// @dev-forge/react
export interface ReactPluginAPI extends PluginAPI {
  react: {
    createComponent: (config: ComponentConfig) => React.Component;
    useHook: (hook: string) => any;
  };
}
```

---

## 🎨 CONFIGURATION SYSTEM

### **Unified Configuration**

```typescript
// @dev-forge/core
export interface SDKConfig {
  // Core settings
  models: {
    enabled: boolean;
    defaultProvider: 'ollama' | 'gguf' | 'api';
    providers: {
      ollama?: OllamaConfig;
      gguf?: GGUFConfig;
      api?: ApiConfig;
    };
  };
  
  // Product-specific settings (optional)
  product?: {
    [key: string]: any;
  };
}
```

### **Configuration Loading**

```typescript
// Load from various sources
const config = await loadConfig({
  sources: [
    'file',      // config.json
    'env',       // Environment variables
    'product',   // Product-specific config
  ],
  product: 'dev-forge', // Optional product identifier
});
```

---

## 📚 SDK DOCUMENTATION STRUCTURE

```
docs/
├── getting-started/
│   ├── installation.md
│   ├── quick-start.md
│   └── concepts.md
├── api-reference/
│   ├── core/
│   ├── vscode/
│   └── react/
├── guides/
│   ├── creating-providers.md
│   ├── creating-plugins.md
│   └── multi-product-setup.md
├── examples/
│   ├── basic-usage/
│   ├── custom-provider/
│   └── custom-plugin/
└── architecture/
    ├── sdk-design.md
    ├── extension-points.md
    └── best-practices.md
```

---

## 🔄 MIGRATION PATH

### **Phase 1: Extract Core SDK**
1. Move shared code to `packages/core`
2. Create package structure
3. Set up build system
4. Write core documentation

### **Phase 2: Create Adapters**
1. Create `packages/vscode` adapter
2. Create `packages/react` adapter
3. Update Dev Forge to use adapter
4. Test compatibility

### **Phase 3: Product Expansion**
1. Use SDK for VectorForge
2. Use SDK for Network App
3. Document multi-product patterns
4. Create developer onboarding

---

## ✅ SDK REQUIREMENTS

### **For Developers:**
- ✅ Clear API documentation
- ✅ TypeScript types for all APIs
- ✅ Comprehensive examples
- ✅ Migration guides
- ✅ Best practices guide

### **For Products:**
- ✅ Consistent architecture
- ✅ Shared functionality
- ✅ Easy integration
- ✅ Extensible design
- ✅ Performance optimized

### **For Future:**
- ✅ Versioning strategy
- ✅ Breaking change policy
- ✅ Deprecation process
- ✅ Community contribution guide

---

## 🚀 NEXT STEPS

1. **Extract Core SDK** - Move shared code to `packages/core`
2. **Create Adapters** - Build VS Code and React adapters
3. **Documentation** - Write comprehensive SDK docs
4. **Examples** - Create example projects
5. **Testing** - Ensure SDK works across products
6. **Developer Onboarding** - Create guides for new developers

---

**🎸 The SDK abides. Ready to forge the future! 🎸**

