# 🧠 GGUF Provider Implementation Plan

**Date:** January 10, 2025  
**Status:** 📋 **IMPLEMENTATION PLAN**  
**Hashtag:** `#dev-forge`, `#gguf`, `#local-models`, `#llama-cpp`

---

## 🎯 REQUIREMENTS

### **User Requirements:**
1. ✅ Load GGUF files directly (not just via Ollama)
2. ✅ Support multiple GGUF models simultaneously
3. ✅ Manage model memory usage
4. ✅ Configure model parameters
5. ✅ Auto-discover GGUF files in directory

---

## 🔍 GGUF FORMAT INVESTIGATION

### **GGUF Format:**
- **What:** Quantized model format (llama.cpp native)
- **File Extension:** `.gguf`
- **Quantization Types:** q4_0, q4_1, q5_0, q5_1, q8_0, f16, f32
- **Metadata:** Embedded in file (context size, architecture, etc.)

### **Inference Options:**

#### **Option 1: node-llama-cpp** ⭐ **RECOMMENDED**
- **Package:** `node-llama-cpp`
- **Language:** TypeScript/Node.js
- **License:** MIT
- **Status:** Active development
- **Features:**
  - Direct GGUF loading
  - Streaming support
  - Memory management
  - Context management
  - TypeScript types

**Installation:**
```bash
npm install node-llama-cpp
```

**Usage:**
```typescript
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const llama = await getLlama();
const model = await llama.loadModel({ modelPath: '/path/to/model.gguf' });
const session = new LlamaChatSession({ model });
const response = await session.prompt('Hello');
```

#### **Option 2: llama.cpp CLI**
- **What:** Command-line interface
- **Language:** C++ (via child_process)
- **Pros:** Most control, best performance
- **Cons:** More complex integration

#### **Option 3: Ollama (Current)**
- **What:** Ollama can import GGUF files
- **Pros:** Already integrated
- **Cons:** Less direct control

---

## 🏗️ GGUF PROVIDER ARCHITECTURE

### **GGUFProvider Interface:**
```typescript
interface GGUFProvider extends ModelProvider {
  type: 'gguf';
  
  // Model Discovery
  discoverModels(directory: string): Promise<GGUFModel[]>;
  scanForModels(): Promise<GGUFModel[]>;
  
  // Model Loading
  loadModel(path: string, options?: LoadOptions): Promise<GGUFModelInstance>;
  unloadModel(instance: GGUFModelInstance): Promise<void>;
  
  // Model Execution
  generate(instance: GGUFModelInstance, prompt: string, options?: GenerateOptions): Promise<string>;
  stream(instance: GGUFModelInstance, prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
  
  // Model Metadata
  getModelInfo(path: string): Promise<GGUFModelInfo>;
  validateModel(path: string): Promise<boolean>;
  
  // Memory Management
  getMemoryUsage(): number;
  getAvailableMemory(): number;
  canLoadModel(size: number): boolean;
}
```

### **GGUFModel Interface:**
```typescript
interface GGUFModel {
  id: string;
  name: string;
  path: string;
  size: number;
  quantization: string;
  contextSize: number;
  architecture: string;
  metadata: {
    author?: string;
    description?: string;
    license?: string;
    created?: string;
  };
}
```

### **GGUFModelInstance Interface:**
```typescript
interface GGUFModelInstance {
  model: GGUFModel;
  instance: any; // node-llama-cpp model instance
  loadedAt: Date;
  memoryUsage: number;
  isLoaded: boolean;
  
  // Execution
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  stream(prompt: string, options?: GenerateOptions): AsyncGenerator<string>;
  
  // Lifecycle
  unload(): Promise<void>;
  reload(): Promise<void>;
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: GGUF Provider Foundation** 🔴
- [ ] Install `node-llama-cpp` package
- [ ] Create `GGUFProvider` class
- [ ] Implement `ModelProvider` interface
- [ ] Add to `ModelProviderRegistry`
- [ ] Create configuration schema

### **Phase 2: Model Discovery** 🔴
- [ ] Implement `discoverModels()` - Scan directory for .gguf files
- [ ] Implement `scanForModels()` - Auto-discovery
- [ ] Parse GGUF metadata
- [ ] Cache model information
- [ ] Validate GGUF files

### **Phase 3: Model Loading** 🔴
- [ ] Implement `loadModel()` - Load GGUF file
- [ ] Implement memory management
- [ ] Implement model instance tracking
- [ ] Handle loading errors
- [ ] Support model unloading

### **Phase 4: Model Execution** 🔴
- [ ] Implement `generate()` - Synchronous generation
- [ ] Implement `stream()` - Streaming generation
- [ ] Support generation options (temperature, top_p, etc.)
- [ ] Handle context management
- [ ] Support context window limits

### **Phase 5: Memory Management** 🔴
- [ ] Track memory usage per model
- [ ] Implement memory limits
- [ ] Auto-unload least recently used models
- [ ] Memory usage monitoring
- [ ] Memory optimization

### **Phase 6: UI Integration** 🔴
- [ ] GGUF model browser UI
- [ ] Model loading/unloading controls
- [ ] Memory usage display
- [ ] Model configuration UI
- [ ] Model health monitoring

---

## 🔧 TECHNICAL IMPLEMENTATION

### **1. GGUF Provider Service:**
```typescript
import { getLlama, LlamaModel, LlamaChatSession } from 'node-llama-cpp';
import * as fs from 'fs';
import * as path from 'path';
import { ModelProvider, Model, GenerateRequest, GenerateResponse } from '../types';

export class GGUFProvider implements ModelProvider {
  private llama: any;
  private models: Map<string, GGUFModel> = new Map();
  private instances: Map<string, GGUFModelInstance> = new Map();
  private modelsDirectory: string;
  private maxMemory: number;

  async initialize(): Promise<void> {
    this.llama = await getLlama();
    this.modelsDirectory = this.getModelsDirectory();
    this.maxMemory = this.getMaxMemory();
    await this.discoverModels();
  }

  async discoverModels(directory?: string): Promise<GGUFModel[]> {
    const dir = directory || this.modelsDirectory;
    const files = await fs.promises.readdir(dir);
    const ggufFiles = files.filter(f => f.endsWith('.gguf'));
    
    const models: GGUFModel[] = [];
    for (const file of ggufFiles) {
      const filePath = path.join(dir, file);
      const info = await this.getModelInfo(filePath);
      models.push(info);
    }
    
    return models;
  }

  async loadModel(modelPath: string, options?: LoadOptions): Promise<GGUFModelInstance> {
    // Check memory
    if (!this.canLoadModel(modelPath)) {
      throw new Error('Not enough memory to load model');
    }

    // Load model
    const model = await this.llama.loadModel({ modelPath });
    const session = new LlamaChatSession({ model });
    
    const instance: GGUFModelInstance = {
      model: await this.getModelInfo(modelPath),
      instance: session,
      loadedAt: new Date(),
      memoryUsage: await this.getModelMemoryUsage(model),
      isLoaded: true,
      generate: async (prompt, options) => {
        return await session.prompt(prompt, options);
      },
      stream: async function* (prompt, options) {
        // Streaming implementation
      },
      unload: async () => {
        await model.dispose();
        this.instances.delete(modelPath);
      },
      reload: async () => {
        await instance.unload();
        return await this.loadModel(modelPath, options);
      }
    };

    this.instances.set(modelPath, instance);
    return instance;
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const instance = this.instances.get(request.modelId);
    if (!instance) {
      throw new Error(`Model not loaded: ${request.modelId}`);
    }

    const response = await instance.generate(request.prompt, request.options);
    return {
      response,
      model: request.modelId,
      success: true
    };
  }

  private async getModelInfo(filePath: string): Promise<GGUFModel> {
    // Parse GGUF metadata
    // Use node-llama-cpp to read model info
    const stats = await fs.promises.stat(filePath);
    // TODO: Parse GGUF metadata from file
    return {
      id: path.basename(filePath, '.gguf'),
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      quantization: 'unknown', // Parse from metadata
      contextSize: 4096, // Parse from metadata
      architecture: 'llama', // Parse from metadata
      metadata: {}
    };
  }

  private canLoadModel(modelPath: string): boolean {
    // Check if we have enough memory
    const modelSize = this.getModelSize(modelPath);
    const availableMemory = this.getAvailableMemory();
    return availableMemory >= modelSize;
  }

  private getAvailableMemory(): number {
    const used = Array.from(this.instances.values())
      .reduce((sum, inst) => sum + inst.memoryUsage, 0);
    return this.maxMemory - used;
  }
}
```

---

## 🔗 INTEGRATION WITH EXISTING SERVICES

### **Integration with modelManager:**
```typescript
// modelManager.ts
async initialize(): Promise<void> {
  // ... existing code ...
  
  // Register GGUF provider
  if (config.get<boolean>('models.gguf.enabled', false)) {
    const ggufProvider = new GGUFProvider();
    await ggufProvider.initialize();
    this.providers.set('gguf', ggufProvider);
  }
}
```

### **Integration with parallelExecution:**
```typescript
// parallelExecution.ts
private getModelsToExecute(modelIds?: string[]): ModelMetadata[] {
  // Include GGUF models
  const ggufModels = modelManager.getModelsByProvider('gguf');
  // ... existing code ...
}
```

---

## 📊 MEMORY MANAGEMENT STRATEGY

### **Memory Limits:**
- **Per Model:** Track memory usage per loaded model
- **Total Limit:** Configurable max memory (default: 8GB)
- **Auto-Unload:** Unload least recently used models when limit reached

### **Memory Optimization:**
- **Lazy Loading:** Load models on demand
- **Model Sharing:** Share model instances when possible
- **Quantization:** Prefer quantized models (q4_0, q8_0)
- **Context Management:** Limit context size per model

---

## 🎯 SETTINGS INTEGRATION

### **GGUF Settings:**
```typescript
// From VS Code settings
const ggufConfig = config.get<any>('models.gguf', {});
const modelsDirectory = ggufConfig.modelsDirectory || '~/.dev-forge/models/gguf';
const maxMemory = ggufConfig.maxMemory || 4096;
const autoDiscover = ggufConfig.autoDiscover !== false;
```

---

## 📋 DEPENDENCIES

### **Required:**
```json
{
  "dependencies": {
    "node-llama-cpp": "^2.0.0"
  }
}
```

### **Optional:**
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0"
  }
}
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests:**
- Model discovery
- Model loading
- Model execution
- Memory management
- Error handling

### **Integration Tests:**
- Integration with modelManager
- Integration with parallelExecution
- Integration with settings

### **Performance Tests:**
- Memory usage
- Loading times
- Generation speed
- Concurrent model handling

---

## 🚀 QUICK START

### **Step 1: Install Dependencies**
```bash
npm install node-llama-cpp
```

### **Step 2: Create GGUF Provider**
```typescript
// src/services/ggufProvider.ts
import { GGUFProvider } from './ggufProvider';

export const ggufProvider = new GGUFProvider();
```

### **Step 3: Initialize**
```typescript
await ggufProvider.initialize();
```

### **Step 4: Load Model**
```typescript
const instance = await ggufProvider.loadModel('/path/to/model.gguf');
const response = await instance.generate('Hello, world!');
```

---

**🎸 GGUF provider architecture designed. Ready to implement! 🎸**

