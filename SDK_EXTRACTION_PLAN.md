# 📦 SDK Extraction Plan

**Date:** January 10, 2025  
**Status:** 📋 **IMPLEMENTATION PLAN**  
**Hashtag:** `#sdk`, `#extraction`, `#refactoring`

---

## 🎯 GOAL

Extract the current extensibility system into a robust, reusable SDK that can serve as the foundation for all future products.

---

## 📋 EXTRACTION STEPS

### **Step 1: Create Package Structure**

```
dev_forge/
├── packages/
│   ├── core/              # Core SDK
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   ├── api/
│   │   │   ├── plugins/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── vscode/            # VS Code adapter
│   │   ├── src/
│   │   │   ├── adapters/
│   │   │   ├── ui/
│   │   │   └── extension.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── react/             # React adapter (future)
│       ├── src/
│       │   ├── hooks/
│       │   ├── components/
│       │   └── adapters/
│       ├── package.json
│       └── tsconfig.json
│
├── products/
│   ├── dev-forge/         # Current VS Code extension
│   └── vectorforge/       # Future VectorForge UI
│
└── package.json           # Root workspace config
```

---

### **Step 2: Extract Core SDK**

**Files to Move:**
```
src/services/
├── types.ts                    → packages/core/src/types/
├── providers/
│   ├── modelProviderRegistry.ts → packages/core/src/providers/
│   ├── ollamaProvider.ts       → packages/core/src/providers/
│   └── ggufProvider.ts         → packages/core/src/providers/
├── api/
│   ├── types.ts                → packages/core/src/api/
│   ├── apiProviderRegistry.ts  → packages/core/src/api/
│   └── apiKeyManager.ts        → packages/core/src/api/
└── plugins/
    ├── types.ts                → packages/core/src/plugins/
    ├── pluginManager.ts        → packages/core/src/plugins/
    └── pluginAPI.ts             → packages/core/src/plugins/
```

**Create Core Exports:**
```typescript
// packages/core/src/index.ts
export * from './types';
export * from './providers';
export * from './api';
export * from './plugins';
export * from './utils';
```

---

### **Step 3: Create VS Code Adapter**

**Adapter Responsibilities:**
- Connect VS Code API to core SDK
- Provide VS Code-specific UI components
- Handle VS Code configuration
- Manage VS Code extension lifecycle

**Files:**
```
packages/vscode/src/
├── adapters/
│   ├── modelProviderAdapter.ts
│   ├── apiProviderAdapter.ts
│   └── pluginAdapter.ts
├── ui/
│   ├── modelSelector.ts
│   ├── apiProviderManager.ts
│   └── pluginManager.ts
└── extension.ts
```

---

### **Step 4: Update Dev Forge Extension**

**Changes:**
1. Remove core SDK code (now in `packages/core`)
2. Import from `@dev-forge/core` and `@dev-forge/vscode`
3. Use adapters instead of direct SDK access
4. Keep only product-specific code

**Before:**
```typescript
import { ModelProviderRegistry } from './services/providers/modelProviderRegistry';
```

**After:**
```typescript
import { ModelProviderRegistry } from '@dev-forge/core';
import { createVSCodeExtension } from '@dev-forge/vscode';
```

---

### **Step 5: Create Package Configuration**

**Root `package.json`:**
```json
{
  "name": "dev-forge-workspace",
  "private": true,
  "workspaces": [
    "packages/*",
    "products/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

**`packages/core/package.json`:**
```json
{
  "name": "@dev-forge/core",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "dependencies": {
    "axios": "^1.13.2",
    "minimatch": "^5.1.6",
    "node-llama-cpp": "^2.8.16"
  }
}
```

---

### **Step 6: Set Up Build System**

**TypeScript Config:**
```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true
  },
  "include": ["src/**/*"]
}
```

**Build Script:**
```json
{
  "scripts": {
    "build": "tsc && tsc --module commonjs --outDir dist/cjs",
    "watch": "tsc --watch"
  }
}
```

---

### **Step 7: Create Documentation**

**SDK Documentation:**
1. API Reference
2. Getting Started Guide
3. Provider Creation Guide
4. Plugin Development Guide
5. Multi-Product Setup Guide

**Developer Onboarding:**
1. Architecture Overview
2. Development Setup
3. Contribution Guide
4. Code Style Guide
5. Testing Guide

---

## ✅ VALIDATION CHECKLIST

### **Core SDK:**
- [ ] All shared code extracted
- [ ] Zero product-specific dependencies
- [ ] TypeScript types exported
- [ ] Build system working
- [ ] Tests passing

### **VS Code Adapter:**
- [ ] Adapter connects SDK to VS Code
- [ ] All UI components working
- [ ] Extension builds successfully
- [ ] All features functional

### **Documentation:**
- [ ] API reference complete
- [ ] Examples working
- [ ] Developer guides written
- [ ] Architecture documented

### **Multi-Product Ready:**
- [ ] Can be used in multiple products
- [ ] Consistent architecture
- [ ] Easy to extend
- [ ] Well-documented

---

## 🚀 IMPLEMENTATION ORDER

1. **Create package structure** (30 min)
2. **Extract core SDK** (2 hours)
3. **Create VS Code adapter** (1 hour)
4. **Update Dev Forge extension** (1 hour)
5. **Set up build system** (30 min)
6. **Create documentation** (2 hours)
7. **Test & validate** (1 hour)

**Total Estimated Time:** ~8 hours

---

## 📊 SUCCESS METRICS

- ✅ SDK can be imported in new products
- ✅ Dev Forge extension works with SDK
- ✅ Documentation is comprehensive
- ✅ New developers can onboard quickly
- ✅ Architecture supports expansion

---

**🎸 Ready to extract and forge the SDK! 🎸**

