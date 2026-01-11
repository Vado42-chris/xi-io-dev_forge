# 🔌 Dev Forge Extensibility Architecture

**Date:** January 10, 2025  
**Status:** 📋 **ARCHITECTURE DESIGN**  
**Hashtag:** `#dev-forge`, `#extensibility`, `#plugins`, `#gguf`, `#api-integration`

---

## 🎯 EXTENSIBILITY REQUIREMENTS

### **User Requirements:**
1. ✅ Support local GGUF models (direct file loading)
2. ✅ Support custom API integrations (like Cursor)
3. ✅ Plugin system for extensions
4. ✅ User-configurable model settings
5. ✅ Custom API key management
6. ✅ Model provider switching

---

## 🔍 VS CODE EXTENSIBILITY SYSTEM

### **1. Extension API Architecture**

#### **Extension Points:**
- ✅ **Commands** - Custom commands users can invoke
- ✅ **Configuration** - Settings users can configure
- ✅ **Webviews** - Custom UI panels
- ✅ **Tree Views** - Sidebar tree structures
- ✅ **Status Bar** - Status indicators
- ✅ **Language Features** - LSP providers
- ✅ **File System** - File operations
- ✅ **Terminal** - Terminal integration

#### **Configuration System:**
```typescript
// VS Code Configuration Schema
{
  "devForge.models": {
    "type": "array",
    "default": [],
    "description": "Custom model configurations"
  },
  "devForge.apiProviders": {
    "type": "array",
    "default": [],
    "description": "Custom API provider configurations"
  },
  "devForge.ggufPath": {
    "type": "string",
    "default": "",
    "description": "Path to GGUF models directory"
  }
}
```

---

## 🔌 PLUGIN SYSTEM ARCHITECTURE

### **Plugin Interface:**
```typescript
interface DevForgePlugin {
  id: string;
  name: string;
  version: string;
  apiVersion: string;
  
  // Model Provider
  registerModelProvider?(provider: ModelProvider): void;
  
  // API Provider
  registerApiProvider?(provider: ApiProvider): void;
  
  // Custom Commands
  registerCommands?(commands: Command[]): void;
  
  // Custom UI
  registerWebviews?(webviews: Webview[]): void;
  
  // Lifecycle
  activate?(context: ExtensionContext): void;
  deactivate?(): void;
}
```

### **Plugin Discovery:**
- User plugins in `~/.dev-forge/plugins/`
- Extension marketplace plugins
- Local plugin loading
- Plugin validation & sandboxing

---

## 🧠 GGUF MODEL SUPPORT

### **GGUF Format:**
- **What:** Quantized model format (used by llama.cpp, Ollama)
- **File Extension:** `.gguf`
- **Inference:** Requires llama.cpp or compatible runtime
- **Local Loading:** Direct file access, no API needed

### **GGUF Integration Architecture:**

#### **Option 1: llama.cpp Integration**
```typescript
interface GGUFModelProvider {
  modelPath: string;        // Path to .gguf file
  modelName: string;        // Display name
  modelSize: number;         // File size
  quantization: string;      // q4_0, q8_0, etc.
  contextSize: number;       // Context window
  maxTokens: number;         // Max generation tokens
  
  // Inference
  load(): Promise<void>;
  generate(prompt: string, options: GenerateOptions): Promise<string>;
  unload(): Promise<void>;
  
  // Status
  isLoaded(): boolean;
  getMemoryUsage(): number;
}
```

#### **Option 2: Ollama Integration (Current)**
- ✅ Already supports GGUF (Ollama uses GGUF internally)
- ✅ Users can import GGUF files into Ollama
- ✅ Our `ollamaService` already works with this

#### **Option 3: Direct llama.cpp Binding**
- Use `node-llama-cpp` or similar
- Direct GGUF file loading
- More control, more complexity

### **Recommended Approach:**
**Hybrid - Support Both:**
1. ✅ Ollama (current) - Easy, works out of box
2. 🔨 Direct GGUF loading - For advanced users
3. 🔨 llama.cpp integration - For maximum control

---

## 🔗 CUSTOM API INTEGRATION

### **API Provider Interface:**
```typescript
interface ApiProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'custom' | 'cursor';
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  
  // Methods
  generate(prompt: string, options: GenerateOptions): Promise<string>;
  stream?(prompt: string, options: GenerateOptions): AsyncGenerator<string>;
  
  // Configuration
  validate(): Promise<boolean>;
  getModels(): Promise<Model[]>;
}
```

### **Cursor API Integration:**
```typescript
interface CursorApiProvider extends ApiProvider {
  type: 'cursor';
  workspaceId: string;
  // Cursor-specific methods
  getContext(): Promise<Context>;
  getCompletions(): Promise<Completion[]>;
}
```

### **API Provider Registry:**
```typescript
class ApiProviderRegistry {
  private providers: Map<string, ApiProvider> = new Map();
  
  register(provider: ApiProvider): void;
  unregister(id: string): void;
  get(id: string): ApiProvider | undefined;
  getAll(): ApiProvider[];
  getByType(type: string): ApiProvider[];
}
```

---

## ⚙️ CONFIGURATION SYSTEM

### **VS Code Settings Schema:**

```json
{
  "devForge": {
    "models": {
      "ollama": {
        "enabled": true,
        "baseUrl": "http://localhost:11434",
        "models": [
          {
            "id": "mistral-7b",
            "name": "mistral:7b",
            "enabled": true
          }
        ]
      },
      "gguf": {
        "enabled": true,
        "modelsDirectory": "~/.dev-forge/models/gguf",
        "models": [
          {
            "id": "custom-model",
            "name": "Custom Model",
            "path": "/path/to/model.gguf",
            "quantization": "q4_0",
            "contextSize": 4096,
            "enabled": true
          }
        ]
      },
      "apiProviders": [
        {
          "id": "cursor",
          "name": "Cursor API",
          "type": "cursor",
          "apiKey": "${env:CURSOR_API_KEY}",
          "baseUrl": "https://api.cursor.sh",
          "enabled": true
        },
        {
          "id": "openai-custom",
          "name": "Custom OpenAI",
          "type": "openai",
          "apiKey": "${env:OPENAI_API_KEY}",
          "baseUrl": "https://api.openai.com/v1",
          "enabled": true
        }
      ]
    },
    "parallelExecution": {
      "enabled": true,
      "maxConcurrent": 11,
      "timeout": 30000,
      "defaultModels": ["mistral-7b", "llama3.2-3b"]
    },
    "aggregation": {
      "enabled": true,
      "qualityThreshold": 0.6,
      "consensusMethod": "weighted"
    },
    "plugins": {
      "enabled": true,
      "pluginDirectory": "~/.dev-forge/plugins",
      "autoLoad": true
    }
  }
}
```

---

## 🏗️ ARCHITECTURE COMPONENTS NEEDED

### **1. Model Provider System** 🔴 **NOT STARTED**

```typescript
interface ModelProvider {
  id: string;
  name: string;
  type: 'ollama' | 'gguf' | 'api' | 'plugin';
  
  // Model Management
  listModels(): Promise<Model[]>;
  getModel(id: string): Promise<Model | null>;
  loadModel(id: string): Promise<void>;
  unloadModel(id: string): Promise<void>;
  
  // Execution
  generate(request: GenerateRequest): Promise<GenerateResponse>;
  stream?(request: GenerateRequest): AsyncGenerator<string>;
  
  // Status
  isAvailable(): Promise<boolean>;
  getHealth(): Promise<HealthStatus>;
}
```

**Implementations Needed:**
- ✅ OllamaProvider (exists via ollamaService)
- 🔨 GGUFProvider (direct GGUF loading)
- 🔨 ApiProvider (custom APIs)
- 🔨 PluginModelProvider (plugin-provided models)

### **2. Configuration Manager** 🔴 **NOT STARTED**

```typescript
class ConfigurationManager {
  // VS Code Settings
  getSetting<T>(key: string): T | undefined;
  updateSetting(key: string, value: any): void;
  onDidChangeConfiguration(callback: () => void): Disposable;
  
  // Model Configuration
  getModelConfig(id: string): ModelConfig | undefined;
  updateModelConfig(id: string, config: ModelConfig): void;
  
  // API Provider Configuration
  getApiProviderConfig(id: string): ApiProviderConfig | undefined;
  updateApiProviderConfig(id: string, config: ApiProviderConfig): void;
  
  // Plugin Configuration
  getPluginConfig(id: string): PluginConfig | undefined;
  updatePluginConfig(id: string, config: PluginConfig): void;
}
```

### **3. Plugin Manager** 🔴 **NOT STARTED**

```typescript
class PluginManager {
  // Plugin Discovery
  discoverPlugins(): Promise<Plugin[]>;
  loadPlugin(path: string): Promise<Plugin>;
  unloadPlugin(id: string): Promise<void>;
  
  // Plugin Registry
  registerPlugin(plugin: Plugin): void;
  getPlugin(id: string): Plugin | undefined;
  getAllPlugins(): Plugin[];
  
  // Plugin Lifecycle
  activatePlugin(id: string): Promise<void>;
  deactivatePlugin(id: string): Promise<void>;
  
  // Plugin Validation
  validatePlugin(plugin: Plugin): Promise<ValidationResult>;
}
```

### **4. GGUF Model Manager** 🔴 **NOT STARTED**

```typescript
class GGUFModelManager {
  // Model Discovery
  discoverModels(directory: string): Promise<GGUFModel[]>;
  scanForModels(): Promise<GGUFModel[]>;
  
  // Model Loading
  loadModel(path: string): Promise<GGUFModelInstance>;
  unloadModel(instance: GGUFModelInstance): Promise<void>;
  
  // Model Execution
  generate(instance: GGUFModelInstance, prompt: string): Promise<string>;
  stream(instance: GGUFModelInstance, prompt: string): AsyncGenerator<string>;
  
  // Model Metadata
  getModelInfo(path: string): Promise<GGUFModelInfo>;
  validateModel(path: string): Promise<boolean>;
}
```

### **5. API Provider Manager** 🔴 **NOT STARTED**

```typescript
class ApiProviderManager {
  // Provider Registration
  registerProvider(provider: ApiProvider): void;
  unregisterProvider(id: string): void;
  
  // Provider Discovery
  discoverProviders(): Promise<ApiProvider[]>;
  
  // Provider Execution
  execute(providerId: string, request: ApiRequest): Promise<ApiResponse>;
  stream(providerId: string, request: ApiRequest): AsyncGenerator<string>;
  
  // Provider Health
  checkHealth(providerId: string): Promise<HealthStatus>;
  validateProvider(provider: ApiProvider): Promise<ValidationResult>;
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Configuration System** 🔴
- [ ] Create VS Code settings schema
- [ ] Implement ConfigurationManager
- [ ] Add settings UI
- [ ] Add settings validation
- [ ] Add settings migration

### **Phase 2: Model Provider System** 🔴
- [ ] Create ModelProvider interface
- [ ] Refactor ollamaService to OllamaProvider
- [ ] Create GGUFProvider
- [ ] Create ApiProvider base
- [ ] Create PluginModelProvider
- [ ] Create ModelProviderRegistry

### **Phase 3: GGUF Support** 🔴
- [ ] Research llama.cpp Node.js bindings
- [ ] Create GGUFModelManager
- [ ] Implement GGUF file scanning
- [ ] Implement GGUF model loading
- [ ] Implement GGUF inference
- [ ] Add GGUF settings UI

### **Phase 4: API Integration** 🔴
- [ ] Create ApiProvider interface
- [ ] Implement CursorApiProvider
- [ ] Implement OpenAI-compatible provider
- [ ] Implement Anthropic provider
- [ ] Create custom API provider template
- [ ] Add API key management UI

### **Phase 5: Plugin System** 🔴
- [ ] Create Plugin interface
- [ ] Create PluginManager
- [ ] Implement plugin discovery
- [ ] Implement plugin loading
- [ ] Implement plugin sandboxing
- [ ] Create plugin API
- [ ] Add plugin marketplace (optional)

### **Phase 6: UI Integration** 🔴
- [ ] Model provider selector UI
- [ ] GGUF model browser UI
- [ ] API provider configuration UI
- [ ] Plugin management UI
- [ ] Settings UI
- [ ] API key management UI

---

## 🔧 TECHNICAL REQUIREMENTS

### **Dependencies Needed:**
```json
{
  "dependencies": {
    "@vscode/vscode-api": "^1.0.0",
    "node-llama-cpp": "^2.0.0",  // For GGUF support
    "axios": "^1.6.0",            // For API providers
    "ws": "^8.14.0"               // For streaming
  }
}
```

### **VS Code API Usage:**
- `vscode.workspace.getConfiguration()` - Settings
- `vscode.workspace.onDidChangeConfiguration` - Settings changes
- `vscode.commands.registerCommand()` - Commands
- `vscode.window.createWebviewPanel()` - Custom UI
- `vscode.workspace.fs` - File system
- `vscode.extensions` - Extension management

---

## 🎯 SETTINGS BREAKDOWN

### **Model Settings:**
- Model provider selection
- Model enable/disable
- Model priority/ordering
- Model-specific parameters
- Model health monitoring

### **API Provider Settings:**
- API key management (secure storage)
- Base URL configuration
- Custom headers
- Rate limiting
- Retry logic
- Timeout configuration

### **GGUF Settings:**
- Models directory path
- Auto-discovery
- Model metadata caching
- Memory management
- Context size limits
- Quantization preferences

### **Plugin Settings:**
- Plugin directory
- Auto-load plugins
- Plugin enable/disable
- Plugin permissions
- Plugin sandboxing

### **Execution Settings:**
- Parallel execution limits
- Timeout values
- Quality thresholds
- Consensus methods
- Aggregation strategies

---

## 🔐 SECURITY CONSIDERATIONS

### **API Key Storage:**
- Use VS Code SecretStorage API
- Never store keys in plain text
- Support environment variables
- Support keychain/credential manager

### **Plugin Sandboxing:**
- Validate plugin code
- Limit plugin permissions
- Isolate plugin execution
- Monitor plugin behavior

### **Model Security:**
- Validate model files
- Scan for malicious code
- Limit model access
- Monitor model execution

---

## 📊 PROGRESS TRACKING

### **Completed:** ✅ **0/6 phases (0%)**

### **Not Started:** 🔴 **6/6 phases (100%)**

---

**🎸 Extensibility architecture designed. Ready to implement! 🎸**

