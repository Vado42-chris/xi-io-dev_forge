# @dev-forge/core

Core SDK for Dev Forge - Framework-agnostic extensibility system.

## Installation

```bash
npm install @dev-forge/core
```

## Usage

```typescript
import { ModelProviderRegistry, OllamaProvider } from '@dev-forge/core';

const registry = new ModelProviderRegistry();
await registry.registerProvider(new OllamaProvider());
```

## Features

- ✅ Model Provider System
- ✅ API Provider System
- ✅ Plugin System
- ✅ Type-safe APIs
- ✅ Framework-agnostic

## Documentation

See [SDK Architecture](../../SDK_ARCHITECTURE.md) for full documentation.

