# @dev-forge/vscode

VS Code adapter for Dev Forge Core SDK.

## Installation

```bash
npm install @dev-forge/vscode
```

## Usage

```typescript
import { createVSCodeApiKeyManager, createVSCodePluginManager } from '@dev-forge/vscode';

const apiKeyManager = createVSCodeApiKeyManager(context);
const pluginManager = createVSCodePluginManager(context, modelRegistry, apiRegistry);
```

## Documentation

See [SDK Architecture](../../SDK_ARCHITECTURE.md) for full documentation.

