# ⚙️ VS Code Settings Schema - Dev Forge

**Date:** January 10, 2025  
**Status:** 📋 **SETTINGS DESIGN**  
**Hashtag:** `#dev-forge`, `#settings`, `#configuration`, `#vs-code`

---

## 🎯 SETTINGS ARCHITECTURE

### **VS Code Configuration System:**
- **Settings File:** `package.json` → `contributes.configuration`
- **User Settings:** `settings.json` (user/workspace)
- **Default Values:** Defined in schema
- **Type Safety:** TypeScript types from schema

---

## 📋 COMPLETE SETTINGS SCHEMA

```json
{
  "contributes": {
    "configuration": {
      "title": "Dev Forge",
      "properties": {
        // ============================================
        // MODEL CONFIGURATION
        // ============================================
        "devForge.models.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Dev Forge model system"
        },
        "devForge.models.defaultProvider": {
          "type": "string",
          "enum": ["ollama", "gguf", "api", "plugin"],
          "default": "ollama",
          "description": "Default model provider"
        },
        "devForge.models.autoDiscover": {
          "type": "boolean",
          "default": true,
          "description": "Automatically discover models"
        },
        
        // Ollama Configuration
        "devForge.models.ollama.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Ollama provider"
        },
        "devForge.models.ollama.baseUrl": {
          "type": "string",
          "default": "http://localhost:11434",
          "description": "Ollama API base URL"
        },
        "devForge.models.ollama.timeout": {
          "type": "number",
          "default": 30000,
          "description": "Ollama request timeout (ms)"
        },
        "devForge.models.ollama.models": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "enabled": { "type": "boolean", "default": true },
              "priority": { "type": "number", "default": 0 }
            }
          },
          "default": [],
          "description": "Ollama model configurations"
        },
        
        // GGUF Configuration
        "devForge.models.gguf.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable GGUF provider (direct file loading)"
        },
        "devForge.models.gguf.modelsDirectory": {
          "type": "string",
          "default": "~/.dev-forge/models/gguf",
          "description": "Directory containing GGUF model files"
        },
        "devForge.models.gguf.autoDiscover": {
          "type": "boolean",
          "default": true,
          "description": "Automatically discover GGUF files"
        },
        "devForge.models.gguf.maxMemory": {
          "type": "number",
          "default": 4096,
          "description": "Maximum memory for GGUF models (MB)"
        },
        "devForge.models.gguf.models": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "path": { "type": "string" },
              "quantization": { "type": "string" },
              "contextSize": { "type": "number", "default": 4096 },
              "enabled": { "type": "boolean", "default": true }
            }
          },
          "default": [],
          "description": "GGUF model configurations"
        },
        "devForge.models.gguf.llamaCppPath": {
          "type": "string",
          "default": "",
          "description": "Path to llama.cpp executable (optional, uses node-llama-cpp if empty)"
        },
        
        // ============================================
        // API PROVIDER CONFIGURATION
        // ============================================
        "devForge.apiProviders.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable custom API providers"
        },
        "devForge.apiProviders.providers": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "type": {
                "type": "string",
                "enum": ["openai", "anthropic", "cursor", "custom"]
              },
              "baseUrl": { "type": "string" },
              "apiKey": {
                "type": "string",
                "description": "API key (stored securely, use ${env:VAR_NAME} for env vars)"
              },
              "headers": {
                "type": "object",
                "description": "Custom headers"
              },
              "enabled": { "type": "boolean", "default": true },
              "timeout": { "type": "number", "default": 30000 },
              "rateLimit": {
                "type": "object",
                "properties": {
                  "requestsPerMinute": { "type": "number" },
                  "requestsPerHour": { "type": "number" }
                }
              }
            }
          },
          "default": [],
          "description": "Custom API provider configurations"
        },
        
        // Cursor API Specific
        "devForge.apiProviders.cursor.enabled": {
          "type": "boolean",
          "default": false,
          "description": "Enable Cursor API integration"
        },
        "devForge.apiProviders.cursor.apiKey": {
          "type": "string",
          "description": "Cursor API key (stored securely)"
        },
        "devForge.apiProviders.cursor.baseUrl": {
          "type": "string",
          "default": "https://api.cursor.sh",
          "description": "Cursor API base URL"
        },
        "devForge.apiProviders.cursor.workspaceId": {
          "type": "string",
          "description": "Cursor workspace ID"
        },
        
        // ============================================
        // PARALLEL EXECUTION CONFIGURATION
        // ============================================
        "devForge.parallelExecution.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable parallel model execution"
        },
        "devForge.parallelExecution.maxConcurrent": {
          "type": "number",
          "default": 11,
          "minimum": 1,
          "maximum": 50,
          "description": "Maximum concurrent model executions"
        },
        "devForge.parallelExecution.timeout": {
          "type": "number",
          "default": 30000,
          "minimum": 1000,
          "description": "Default timeout for parallel execution (ms)"
        },
        "devForge.parallelExecution.defaultModels": {
          "type": "array",
          "items": { "type": "string" },
          "default": [],
          "description": "Default models for parallel execution"
        },
        "devForge.parallelExecution.strategy": {
          "type": "string",
          "enum": ["all", "selected", "smart"],
          "default": "smart",
          "description": "Model selection strategy for parallel execution"
        },
        
        // ============================================
        // AGGREGATION CONFIGURATION
        // ============================================
        "devForge.aggregation.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable response aggregation"
        },
        "devForge.aggregation.qualityThreshold": {
          "type": "number",
          "default": 0.6,
          "minimum": 0,
          "maximum": 1,
          "description": "Quality threshold for filtering responses"
        },
        "devForge.aggregation.consensusMethod": {
          "type": "string",
          "enum": ["weighted", "voting", "best"],
          "default": "weighted",
          "description": "Consensus generation method"
        },
        "devForge.aggregation.topN": {
          "type": "number",
          "default": 5,
          "minimum": 1,
          "description": "Number of top responses to consider"
        },
        
        // ============================================
        // PLUGIN SYSTEM CONFIGURATION
        // ============================================
        "devForge.plugins.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable plugin system"
        },
        "devForge.plugins.pluginDirectory": {
          "type": "string",
          "default": "~/.dev-forge/plugins",
          "description": "Directory for user plugins"
        },
        "devForge.plugins.autoLoad": {
          "type": "boolean",
          "default": true,
          "description": "Automatically load plugins on startup"
        },
        "devForge.plugins.sandboxed": {
          "type": "boolean",
          "default": true,
          "description": "Run plugins in sandboxed environment"
        },
        "devForge.plugins.plugins": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "path": { "type": "string" },
              "enabled": { "type": "boolean", "default": true },
              "permissions": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "default": [],
          "description": "Plugin configurations"
        },
        
        // ============================================
        // FIRE TEAMS CONFIGURATION
        // ============================================
        "devForge.fireTeams.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Fire Teams system"
        },
        "devForge.fireTeams.maxTeams": {
          "type": "number",
          "default": 10,
          "description": "Maximum number of fire teams"
        },
        "devForge.fireTeams.maxAgentsPerTeam": {
          "type": "number",
          "default": 5,
          "description": "Maximum agents per fire team"
        },
        
        // ============================================
        // HR SYSTEM CONFIGURATION
        // ============================================
        "devForge.hr.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable HR system"
        },
        "devForge.hr.maxAgents": {
          "type": "number",
          "default": 50,
          "description": "Maximum number of agents"
        },
        "devForge.hr.autoAssign": {
          "type": "boolean",
          "default": false,
          "description": "Automatically assign agents to tasks"
        },
        
        // ============================================
        // SPRINT SYSTEM CONFIGURATION
        // ============================================
        "devForge.sprints.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable sprint system"
        },
        "devForge.sprints.sprintDuration": {
          "type": "number",
          "default": 7,
          "description": "Sprint duration in days"
        },
        "devForge.sprints.autoStart": {
          "type": "boolean",
          "default": false,
          "description": "Automatically start new sprints"
        },
        
        // ============================================
        // WARGAMING CONFIGURATION
        // ============================================
        "devForge.wargaming.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable wargaming system"
        },
        "devForge.wargaming.scenarioDirectory": {
          "type": "string",
          "default": "~/.dev-forge/wargaming/scenarios",
          "description": "Directory for wargaming scenarios"
        },
        
        // ============================================
        // REAPERSPACE CONFIGURATION
        // ============================================
        "devForge.reaperspace.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable Reaperspace system"
        },
        "devForge.reaperspace.monitoringInterval": {
          "type": "number",
          "default": 5000,
          "description": "Monitoring interval (ms)"
        },
        
        // ============================================
        // BLOCKCHAIN CONFIGURATION
        // ============================================
        "devForge.blockchain.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable blockchain system"
        },
        "devForge.blockchain.chainDirectory": {
          "type": "string",
          "default": "~/.dev-forge/blockchain",
          "description": "Blockchain data directory"
        },
        
        // ============================================
        // MARKETPLACE CONFIGURATION
        // ============================================
        "devForge.marketplace.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable marketplace"
        },
        "devForge.marketplace.marketplaceUrl": {
          "type": "string",
          "default": "https://marketplace.dev-forge.com",
          "description": "Marketplace API URL"
        },
        
        // ============================================
        // PERSONA SYSTEM CONFIGURATION
        // ============================================
        "devForge.personas.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable persona system"
        },
        "devForge.personas.personaDirectory": {
          "type": "string",
          "default": "~/.dev-forge/personas",
          "description": "Directory for persona dotfiles"
        },
        "devForge.personas.antiGhosting": {
          "type": "boolean",
          "default": true,
          "description": "Enable anti-ghosting (persona dotfile system)"
        },
        "devForge.personas.betweenTheLines": {
          "type": "boolean",
          "default": true,
          "description": "Enable 'between the lines' schema filtering"
        },
        
        // ============================================
        // IMAGE/VIDEO GENERATION CONFIGURATION
        // ============================================
        "devForge.imageGeneration.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable image generation"
        },
        "devForge.imageGeneration.defaultStyle": {
          "type": "string",
          "default": "35mm-noir-editorial",
          "description": "Default image generation style"
        },
        "devForge.imageGeneration.defaultSize": {
          "type": "string",
          "enum": ["1K", "2K", "4K"],
          "default": "1K",
          "description": "Default image size"
        },
        "devForge.videoGeneration.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable video generation"
        },
        
        // ============================================
        // PERFORMANCE CONFIGURATION
        // ============================================
        "devForge.performance.cacheEnabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable response caching"
        },
        "devForge.performance.cacheSize": {
          "type": "number",
          "default": 100,
          "description": "Cache size (number of responses)"
        },
        "devForge.performance.maxMemory": {
          "type": "number",
          "default": 8192,
          "description": "Maximum memory usage (MB)"
        },
        
        // ============================================
        // UI CONFIGURATION
        // ============================================
        "devForge.ui.theme": {
          "type": "string",
          "enum": ["xibalba-dark", "xibalba-light", "custom"],
          "default": "xibalba-dark",
          "description": "UI theme"
        },
        "devForge.ui.showModelStatus": {
          "type": "boolean",
          "default": true,
          "description": "Show model status in status bar"
        },
        "devForge.ui.showAgentCount": {
          "type": "boolean",
          "default": true,
          "description": "Show agent count in status bar"
        },
        "devForge.ui.autoRefresh": {
          "type": "boolean",
          "default": true,
          "description": "Auto-refresh UI components"
        },
        "devForge.ui.refreshInterval": {
          "type": "number",
          "default": 5000,
          "description": "UI refresh interval (ms)"
        },
        
        // ============================================
        // LOGGING CONFIGURATION
        // ============================================
        "devForge.logging.level": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info",
          "description": "Logging level"
        },
        "devForge.logging.logFile": {
          "type": "string",
          "default": "~/.dev-forge/logs/dev-forge.log",
          "description": "Log file path"
        },
        "devForge.logging.maxLogSize": {
          "type": "number",
          "default": 10,
          "description": "Maximum log file size (MB)"
        },
        
        // ============================================
        // SECURITY CONFIGURATION
        // ============================================
        "devForge.security.apiKeyStorage": {
          "type": "string",
          "enum": ["secretStorage", "keychain", "env"],
          "default": "secretStorage",
          "description": "API key storage method"
        },
        "devForge.security.pluginSandboxing": {
          "type": "boolean",
          "default": true,
          "description": "Enable plugin sandboxing"
        },
        "devForge.security.modelValidation": {
          "type": "boolean",
          "default": true,
          "description": "Validate model files before loading"
        }
      }
    }
  }
}
```

---

## 🔧 SETTINGS ACCESS PATTERNS

### **Reading Settings:**
```typescript
import * as vscode from 'vscode';

// Get configuration
const config = vscode.workspace.getConfiguration('devForge');

// Read specific setting
const ollamaEnabled = config.get<boolean>('models.ollama.enabled', true);
const baseUrl = config.get<string>('models.ollama.baseUrl', 'http://localhost:11434');

// Read nested setting
const models = config.get<any[]>('models.ollama.models', []);
```

### **Updating Settings:**
```typescript
// Update setting
await config.update('models.ollama.enabled', false, vscode.ConfigurationTarget.Global);

// Update nested setting
await config.update('models.ollama.baseUrl', 'http://localhost:11435', vscode.ConfigurationTarget.Workspace);
```

### **Listening to Changes:**
```typescript
// Listen for configuration changes
vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('devForge')) {
    // Reload configuration
    reloadConfiguration();
  }
});
```

---

## 🔐 SECURE API KEY STORAGE

### **Using VS Code SecretStorage:**
```typescript
import * as vscode from 'vscode';

class SecretManager {
  private secretStorage: vscode.SecretStorage;

  constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
  }

  async storeApiKey(providerId: string, apiKey: string): Promise<void> {
    await this.secretStorage.store(`${providerId}.apiKey`, apiKey);
  }

  async getApiKey(providerId: string): Promise<string | undefined> {
    return await this.secretStorage.get(`${providerId}.apiKey`);
  }

  async deleteApiKey(providerId: string): Promise<void> {
    await this.secretStorage.delete(`${providerId}.apiKey`);
  }
}
```

---

## 📊 SETTINGS UI COMPONENTS NEEDED

### **1. Settings View (Webview)**
- Model provider configuration
- GGUF model browser
- API provider management
- Plugin management
- System configuration

### **2. Settings Commands**
- `devForge.settings.open` - Open settings view
- `devForge.settings.addModel` - Add model
- `devForge.settings.addApiProvider` - Add API provider
- `devForge.settings.managePlugins` - Manage plugins

### **3. Settings Validation**
- Validate model paths
- Validate API endpoints
- Validate plugin permissions
- Validate configuration consistency

---

**🎸 Complete settings schema designed. Ready for implementation! 🎸**

