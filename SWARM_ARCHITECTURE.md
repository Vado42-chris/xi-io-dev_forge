# 🐝 Dev Forge Swarm Architecture - Ollama + Cherry Studio Integration

**Date:** January 10, 2025  
**Status:** 📋 **SWARM ARCHITECTURE DESIGN**  
**Hashtag:** `#dev-forge`, `#swarm`, `#ollama`, `#cherry-studio`, `#multiagent`

---

## 🎯 THE BIG QUESTION: HOW DO WE BUILD OUR SWARM?

**Answer:** Ollama as the local model server + Cherry Studio models + VectorForge framework = Agent Swarm

---

## 🏗️ SWARM ARCHITECTURE

### **Layer 1: Ollama (Local Model Server)**

**What Ollama Does:**
- Runs LLMs locally on your machine
- Provides REST API for model access
- Manages model loading/unloading
- Handles inference requests
- **Default:** `http://localhost:11434`

**Why Ollama:**
- ✅ Local (privacy, no API costs)
- ✅ Fast (no network latency)
- ✅ Supports many models
- ✅ Easy to integrate
- ✅ Can run multiple models

**Ollama API:**
```typescript
// List models
GET http://localhost:11434/api/tags

// Generate completion
POST http://localhost:11434/api/generate
{
  "model": "llama3",
  "prompt": "Your prompt here",
  "stream": false
}

// Chat completion
POST http://localhost:11434/api/chat
{
  "model": "llama3",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

---

### **Layer 2: Cherry Studio Models (Through Ollama)**

**How Cherry Studio Works:**
- Multi-model selection interface
- Model comparison
- Parallel execution
- Model chaining

**Integration Strategy:**
1. **Pull Cherry Studio models into Ollama:**
   ```bash
   # Install models via Ollama
   ollama pull llama3
   ollama pull mistral
   ollama pull codellama
   ollama pull phi3
   # ... etc for all 11 models
   ```

2. **Use Ollama API to access them:**
   - Each model becomes an agent
   - Agents can be selected/switched
   - Models run through Ollama locally

3. **Cherry Studio UI Pattern:**
   - Model selector (like Cherry Studio)
   - Multi-model selection
   - Parallel execution
   - Model comparison

---

### **Layer 3: Agent Swarm (11 Models = 11 Agents)**

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    DEV FORGE EDITOR                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Agent 1    │  │   Agent 2    │  │   Agent 3    │  │
│  │  (llama3)    │  │  (mistral)   │  │ (codellama)  │  │
│  │              │  │              │  │              │  │
│  │  Status: ✅  │  │  Status: ✅  │  │  Status: ⚠️  │  │
│  │  Task: Code  │  │  Task: Math  │  │  Task: Test  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Agent 4    │  │   Agent 5    │  │   Agent 6    │  │
│  │   (phi3)     │  │   (qwen)     │  │   (gemma)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  ... (11 total agents)                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    OLLAMA SERVER                        │
│              http://localhost:11434                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ llama3   │  │ mistral  │  │codellama │  ... (11)    │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION

### **1. Ollama Service (TypeScript)**

```typescript
// src/services/ollamaService.ts

interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

class OllamaService {
  private baseUrl = 'http://localhost:11434';

  // List all available models
  async listModels(): Promise<OllamaModel[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models || [];
  }

  // Generate completion
  async generate(
    model: string,
    prompt: string,
    options?: {
      stream?: boolean;
      temperature?: number;
      top_p?: number;
    }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        ...options
      })
    });
    const data: OllamaResponse = await response.json();
    return data.response;
  }

  // Chat completion
  async chat(
    model: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: {
      stream?: boolean;
      temperature?: number;
    }
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...options
      })
    });
    const data: OllamaResponse = await response.json();
    return data.response;
  }

  // Check if Ollama is running
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const ollamaService = new OllamaService();
```

---

### **2. Agent Manager (11 Agents)**

```typescript
// src/services/agentManager.ts

interface Agent {
  id: string;
  name: string;
  model: string; // Ollama model name
  role: 'code' | 'math' | 'test' | 'review' | 'document' | 'design' | 'debug' | 'optimize' | 'refactor' | 'plan' | 'execute';
  status: 'idle' | 'working' | 'error' | 'complete';
  currentTask?: Task;
  persona?: PersonaDotfile;
  capabilities: string[];
}

interface Task {
  id: string;
  description: string;
  assignedAgent?: string;
  status: 'pending' | 'in-progress' | 'complete' | 'error';
  result?: string;
}

class AgentManager {
  private agents: Agent[] = [];
  private ollamaService: OllamaService;

  constructor() {
    this.ollamaService = ollamaService;
    this.initializeAgents();
  }

  // Initialize 11 agents with different models
  private async initializeAgents() {
    const agentConfigs = [
      { id: 'agent-1', name: 'CodeGen', model: 'codellama', role: 'code' },
      { id: 'agent-2', name: 'MathSolver', model: 'llama3', role: 'math' },
      { id: 'agent-3', name: 'TestWriter', model: 'mistral', role: 'test' },
      { id: 'agent-4', name: 'CodeReview', model: 'phi3', role: 'review' },
      { id: 'agent-5', name: 'DocGen', model: 'qwen', role: 'document' },
      { id: 'agent-6', name: 'Designer', model: 'gemma', role: 'design' },
      { id: 'agent-7', name: 'Debugger', model: 'deepseek', role: 'debug' },
      { id: 'agent-8', name: 'Optimizer', model: 'yi', role: 'optimize' },
      { id: 'agent-9', name: 'Refactor', model: 'neural', role: 'refactor' },
      { id: 'agent-10', name: 'Planner', model: 'solar', role: 'plan' },
      { id: 'agent-11', name: 'Executor', model: 'starling', role: 'execute' }
    ];

    // Check which models are available in Ollama
    const availableModels = await this.ollamaService.listModels();
    const modelNames = availableModels.map(m => m.name);

    this.agents = agentConfigs
      .filter(config => modelNames.includes(config.model))
      .map(config => ({
        ...config,
        status: 'idle' as const,
        capabilities: this.getCapabilitiesForRole(config.role)
      }));
  }

  // Assign task to agent
  async assignTask(agentId: string, task: Task): Promise<void> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    agent.status = 'working';
    agent.currentTask = task;

    try {
      // Process task through Ollama
      const prompt = this.buildPrompt(task, agent);
      const result = await this.ollamaService.generate(agent.model, prompt);
      
      task.result = result;
      task.status = 'complete';
      agent.status = 'idle';
      agent.currentTask = undefined;
    } catch (error) {
      agent.status = 'error';
      task.status = 'error';
      throw error;
    }
  }

  // Build prompt with persona and "between the lines" schema
  private buildPrompt(task: Task, agent: Agent): string {
    const persona = agent.persona || this.getDefaultPersona(agent.role);
    const schema = this.getBetweenTheLinesSchema(task);
    
    return `${persona.systemInstruction}

Task: ${task.description}

Between the Lines Schema:
${JSON.stringify(schema, null, 2)}

Execute this task according to your role: ${agent.role}`;
  }

  // Get agents by role
  getAgentsByRole(role: Agent['role']): Agent[] {
    return this.agents.filter(a => a.role === role);
  }

  // Get available agents
  getAvailableAgents(): Agent[] {
    return this.agents.filter(a => a.status === 'idle');
  }

  // Get all agents
  getAllAgents(): Agent[] {
    return this.agents;
  }
}

export const agentManager = new AgentManager();
```

---

### **3. Fire Team System (Agent Coordination)**

```typescript
// src/services/fireTeamService.ts

interface FireTeam {
  id: string;
  name: string;
  agents: string[]; // Agent IDs
  task: Task;
  status: 'idle' | 'working' | 'complete' | 'error';
  coordination: 'parallel' | 'sequential' | 'chain';
}

class FireTeamService {
  private fireTeams: FireTeam[] = [];
  private agentManager: AgentManager;

  constructor() {
    this.agentManager = agentManager;
  }

  // Create fire team for complex task
  async createFireTeam(
    name: string,
    task: Task,
    agentRoles: Agent['role'][],
    coordination: FireTeam['coordination'] = 'parallel'
  ): Promise<FireTeam> {
    // Select agents by role
    const agents = agentRoles
      .map(role => this.agentManager.getAgentsByRole(role)[0])
      .filter(Boolean)
      .map(a => a.id);

    const fireTeam: FireTeam = {
      id: `fireteam-${Date.now()}`,
      name,
      agents,
      task,
      status: 'idle',
      coordination
    };

    this.fireTeams.push(fireTeam);
    return fireTeam;
  }

  // Execute fire team task
  async executeFireTeam(fireTeamId: string): Promise<void> {
    const fireTeam = this.fireTeams.find(ft => ft.id === fireTeamId);
    if (!fireTeam) throw new Error(`Fire team ${fireTeamId} not found`);

    fireTeam.status = 'working';

    if (fireTeam.coordination === 'parallel') {
      // All agents work simultaneously
      await Promise.all(
        fireTeam.agents.map(agentId =>
          this.agentManager.assignTask(agentId, fireTeam.task)
        )
      );
    } else if (fireTeam.coordination === 'sequential') {
      // Agents work one after another
      for (const agentId of fireTeam.agents) {
        await this.agentManager.assignTask(agentId, fireTeam.task);
      }
    } else if (fireTeam.coordination === 'chain') {
      // Each agent's output becomes next agent's input
      let previousResult = fireTeam.task.description;
      for (const agentId of fireTeam.agents) {
        const task: Task = {
          ...fireTeam.task,
          description: previousResult
        };
        await this.agentManager.assignTask(agentId, task);
        previousResult = task.result || previousResult;
      }
    }

    fireTeam.status = 'complete';
  }
}

export const fireTeamService = new FireTeamService();
```

---

### **4. HR System (Agent Management)**

```typescript
// src/services/hrService.ts

interface AgentHealth {
  agentId: string;
  status: 'healthy' | 'degraded' | 'error';
  responseTime: number;
  successRate: number;
  lastCheck: Date;
}

class HRService {
  private agentManager: AgentManager;
  private healthChecks: Map<string, AgentHealth> = new Map();

  constructor() {
    this.agentManager = agentManager;
    this.startHealthMonitoring();
  }

  // Monitor agent health
  private async startHealthMonitoring() {
    setInterval(async () => {
      const agents = this.agentManager.getAllAgents();
      for (const agent of agents) {
        await this.checkAgentHealth(agent);
      }
    }, 30000); // Check every 30 seconds
  }

  // Check individual agent health
  private async checkAgentHealth(agent: Agent): Promise<void> {
    const startTime = Date.now();
    try {
      // Send test prompt to agent
      const testPrompt = "Health check";
      await ollamaService.generate(agent.model, testPrompt);
      const responseTime = Date.now() - startTime;

      const health: AgentHealth = {
        agentId: agent.id,
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime,
        successRate: 1.0,
        lastCheck: new Date()
      };

      this.healthChecks.set(agent.id, health);
    } catch (error) {
      const health: AgentHealth = {
        agentId: agent.id,
        status: 'error',
        responseTime: -1,
        successRate: 0.0,
        lastCheck: new Date()
      };
      this.healthChecks.set(agent.id, health);
    }
  }

  // Get agent health
  getAgentHealth(agentId: string): AgentHealth | undefined {
    return this.healthChecks.get(agentId);
  }

  // Get all agent health
  getAllAgentHealth(): AgentHealth[] {
    return Array.from(this.healthChecks.values());
  }

  // Assign agent to task (HR decision)
  async assignAgentToTask(task: Task, preferredRole?: Agent['role']): Promise<string> {
    const availableAgents = this.agentManager.getAvailableAgents();
    
    // Filter by role if specified
    const candidates = preferredRole
      ? availableAgents.filter(a => a.role === preferredRole)
      : availableAgents;

    // Select best agent based on health
    const bestAgent = candidates.reduce((best, current) => {
      const bestHealth = this.getAgentHealth(best.id);
      const currentHealth = this.getAgentHealth(current.id);
      
      if (!bestHealth) return current;
      if (!currentHealth) return best;
      
      // Prefer healthy agents with good response times
      if (currentHealth.status === 'healthy' && bestHealth.status !== 'healthy') {
        return current;
      }
      if (currentHealth.responseTime < bestHealth.responseTime) {
        return current;
      }
      return best;
    }, candidates[0]);

    if (!bestAgent) throw new Error('No available agents');

    await this.agentManager.assignTask(bestAgent.id, task);
    return bestAgent.id;
  }
}

export const hrService = new HRService();
```

---

## 🎨 UI INTEGRATION (Cherry Studio Style)

### **Multi-Model Selector Component**

```typescript
// src/components/multiagent/ModelSelector.tsx

interface ModelSelectorProps {
  models: Agent[];
  selectedModels: string[];
  onSelectionChange: (modelIds: string[]) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  onSelectionChange
}) => {
  return (
    <div className="model-selector">
      <h3>Select Models (Cherry Studio Style)</h3>
      {models.map(model => (
        <div key={model.id} className="model-card">
          <input
            type="checkbox"
            checked={selectedModels.includes(model.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onSelectionChange([...selectedModels, model.id]);
              } else {
                onSelectionChange(selectedModels.filter(id => id !== model.id));
              }
            }}
          />
          <div className="model-info">
            <span className="model-name">{model.name}</span>
            <span className="model-role">{model.role}</span>
            <span className={`model-status ${model.status}`}>
              {model.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🚀 SETUP INSTRUCTIONS

### **1. Install Ollama**
```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com
```

### **2. Pull Models (11 Models)**
```bash
# Pull all models for your 11 agents
ollama pull codellama      # Agent 1: CodeGen
ollama pull llama3         # Agent 2: MathSolver
ollama pull mistral        # Agent 3: TestWriter
ollama pull phi3           # Agent 4: CodeReview
ollama pull qwen           # Agent 5: DocGen
ollama pull gemma          # Agent 6: Designer
ollama pull deepseek       # Agent 7: Debugger
ollama pull yi             # Agent 8: Optimizer
ollama pull neural         # Agent 9: Refactor
ollama pull solar          # Agent 10: Planner
ollama pull starling       # Agent 11: Executor
```

### **3. Verify Ollama is Running**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Should return list of models
```

### **4. Integrate into Dev Forge**
- Copy `ollamaService.ts` → `/dev_forge/src/services/`
- Copy `agentManager.ts` → `/dev_forge/src/services/`
- Copy `fireTeamService.ts` → `/dev_forge/src/services/`
- Copy `hrService.ts` → `/dev_forge/src/services/`
- Create UI components for agent management

---

## 🎯 SWARM WORKFLOW

### **Example: Code Generation Task**

1. **User submits task:** "Generate a React component for user login"

2. **HR System assigns agents:**
   - Agent 1 (CodeGen) → Generate code
   - Agent 4 (CodeReview) → Review code
   - Agent 5 (DocGen) → Generate documentation

3. **Fire Team coordinates:**
   - Parallel execution (all agents work simultaneously)
   - Or chain execution (CodeGen → CodeReview → DocGen)

4. **Results combined:**
   - Code from CodeGen
   - Review comments from CodeReview
   - Documentation from DocGen

5. **User gets complete solution:**
   - Code + Review + Docs

---

## ✅ BENEFITS OF THIS ARCHITECTURE

1. **Local & Private:** All models run locally via Ollama
2. **No API Costs:** No external API calls
3. **Fast:** No network latency
4. **Scalable:** Can add more models/agents easily
5. **Cherry Studio Pattern:** Multi-model selection like Cherry Studio
6. **VectorForge Integration:** Uses your framework (personas, schemas, math)
7. **Swarm Intelligence:** Agents work together via Fire Teams

---

**This is how we build the swarm!** 🐝🎸

