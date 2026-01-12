# 🔨 Dev Forge - Multiagent Coding Engine

**A VS Code extension with extensible model providers, GGUF support, and custom API integration.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

---

## 🎯 Overview

Dev Forge is a powerful VS Code extension that provides:

- **🔌 Plugin System:** Extensible architecture for custom plugins
- **🤖 Local GGUF Models:** Direct loading and execution of GGUF model files
- **🌐 Custom API Integration:** Support for Cursor, OpenAI, Anthropic, and custom APIs
- **⚙️ Multi-Model Support:** Ollama, GGUF, API providers, and plugin-based models
- **🛡️ Security:** Permission-based plugin system with sandboxing
- **📦 SDK Architecture:** Framework-agnostic core SDK ready for expansion

---

## 🏗️ Architecture

### **Three-Layer Design**

```
┌─────────────────────────────────────┐
│  Products (VS Code Extension)       │
├─────────────────────────────────────┤
│  Adapters (VS Code Adapter)         │
├─────────────────────────────────────┤
│  Core SDK (Framework-Agnostic)      │
└─────────────────────────────────────┘
```

- **Core SDK** (`packages/core`): Framework-agnostic extensibility system
- **VS Code Adapter** (`packages/vscode`): Bridges Core SDK to VS Code
- **Extension** (`extension`): VS Code extension implementation

---

## 📦 Packages

### **@dev-forge/core**
Framework-agnostic core SDK with:
- Model Provider Registry
- API Provider Registry
- Plugin System
- Permission Management
- Type Definitions

### **@dev-forge/vscode**
VS Code adapter providing:
- Config Adapter (WorkspaceConfiguration → ConfigStorage)
- Secret Storage Adapter (VS Code SecretStorage → SecretStorage)
- UI Adapter (VS Code Webview/TreeView → Framework-agnostic UI)
- Plugin API Adapter

### **dev-forge** (Extension)
VS Code extension with:
- 70+ custom settings
- Model management UI
- Plugin management UI
- API provider management
- GGUF model browser

---

## 🚀 Quick Start

### **Installation**

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dev-forge.git
cd dev-forge

# Install dependencies
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core      # Core SDK
npm run build:vscode    # VS Code adapter
npm run build:extension # Extension
```

### **Development**

```bash
# Watch mode
npm run watch

# Run tests
npm run test

# Lint
npm run lint
```

---

## 🔧 Configuration

### **VS Code Settings**

Dev Forge provides 70+ custom settings organized into categories:

- **Models:** Ollama, GGUF, API, Plugin providers
- **API Providers:** OpenAI, Anthropic, Cursor, Custom
- **Plugins:** Plugin directory, permissions, sandboxing
- **Performance:** Caching, memory limits
- **Security:** API key storage, plugin sandboxing
- **UI:** Theme, status bar, refresh intervals

See `VS_CODE_SETTINGS_SCHEMA.md` for complete settings reference.

---

## 📚 Documentation

- **[SDK Architecture](SDK_ARCHITECTURE.md)** - Core SDK design
- **[Plugin System](PLUGIN_SYSTEM_ARCHITECTURE.md)** - Plugin development guide
- **[GGUF Provider](GGUF_PROVIDER_IMPLEMENTATION.md)** - GGUF model support
- **[API Providers](API_PROVIDER_SYSTEM.md)** - Custom API integration
- **[Developer Onboarding](DEVELOPER_ONBOARDING.md)** - Getting started guide
- **[Requirements Validation](REQUIREMENTS_VALIDATION.md)** - Feature validation
- **[Triple Validation Report](TRIPLE_VALIDATION_REPORT.md)** - Complete validation

---

## 🎯 Features

### **✅ Plugin System**
- Framework-agnostic plugin architecture
- Permission-based security
- Sandboxed execution
- Plugin discovery and loading
- Complete Plugin API

### **✅ GGUF Models**
- Direct file loading with `node-llama-cpp`
- Model discovery and scanning
- Memory management
- Context size detection
- Quantization support

### **✅ Custom APIs**
- Cursor API integration
- OpenAI-compatible APIs
- Anthropic Claude API
- Custom API provider base
- Rate limiting and retry logic
- Secure API key management

### **✅ Model Providers**
- Ollama provider
- GGUF provider
- API-based providers
- Plugin-based providers
- Unified model registry

---

## 🛠️ Development

### **Project Structure**

```
dev-forge/
├── packages/
│   ├── core/          # Core SDK
│   └── vscode/         # VS Code adapter
├── extension/          # VS Code extension
├── products/           # Future products
└── [docs]/            # Documentation
```

### **Build System**

- **TypeScript:** Strict mode enabled
- **Workspaces:** npm workspaces for monorepo
- **Dual Build:** ESM + CommonJS outputs
- **Type Safety:** Full TypeScript coverage

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 👥 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🔗 Links

- **Documentation:** See `/docs` directory
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

## 📊 Status

**Current Version:** 1.0.0  
**Build Status:** ✅ Core SDK and Adapter building successfully  
**Validation:** ✅ All requirements validated from 3 angles

---

**Dev Forge - Where agents code together.** 🎸

---

**Author:** Xibalba Mixed Media Studio  
**License:** MIT
