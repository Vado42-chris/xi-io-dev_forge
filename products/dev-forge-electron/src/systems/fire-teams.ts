/**
 * Fire Teams System
 * 
 * Coordinates multiple AI agents working together on tasks.
 * Part of the VectorForge Framework.
 */

export interface Agent {
  id: string;
  name: string;
  role: string;
  modelId: string;
  status: 'idle' | 'working' | 'waiting' | 'error';
  currentTask?: Task;
  capabilities: string[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  dependencies: string[];
  result?: any;
  error?: string;
}

export interface FireTeam {
  id: string;
  name: string;
  agents: Agent[];
  tasks: Task[];
  status: 'idle' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export class FireTeamsSystem {
  private teams: Map<string, FireTeam> = new Map();
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private statusCallbacks: Set<(teams: FireTeam[]) => void> = new Set();

  constructor() {
    this.initializeDefaultAgents();
  }

  /**
   * Initialize default agents
   */
  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'agent-1',
        name: 'Code Specialist',
        role: 'code',
        modelId: 'ollama-codellama',
        status: 'idle',
        capabilities: ['code-generation', 'code-review', 'debugging'],
      },
      {
        id: 'agent-2',
        name: 'Documentation Agent',
        role: 'documentation',
        modelId: 'ollama-llama2',
        status: 'idle',
        capabilities: ['documentation', 'explanation', 'tutorials'],
      },
      {
        id: 'agent-3',
        name: 'Testing Agent',
        role: 'testing',
        modelId: 'ollama-llama2',
        status: 'idle',
        capabilities: ['test-generation', 'test-execution', 'coverage'],
      },
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Create a new Fire Team
   */
  createTeam(name: string, agentIds: string[]): FireTeam {
    const team: FireTeam = {
      id: `team-${Date.now()}`,
      name,
      agents: agentIds
        .map(id => this.agents.get(id))
        .filter((agent): agent is Agent => agent !== undefined),
      tasks: [],
      status: 'idle',
      createdAt: new Date(),
    };

    this.teams.set(team.id, team);
    this.notifyStatusChange();
    return team;
  }

  /**
   * Get all teams
   */
  getAllTeams(): FireTeam[] {
    return Array.from(this.teams.values());
  }

  /**
   * Get team by ID
   */
  getTeam(teamId: string): FireTeam | undefined {
    return this.teams.get(teamId);
  }

  /**
   * Add task to team
   */
  addTask(teamId: string, task: Task): void {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    this.tasks.set(task.id, task);
    team.tasks.push(task);
    this.notifyStatusChange();
  }

  /**
   * Assign task to agent
   */
  assignTask(taskId: string, agentId: string): void {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    task.assignedAgent = agentId;
    task.status = 'assigned';
    agent.currentTask = task;
    agent.status = 'working';
    
    this.notifyStatusChange();
  }

  /**
   * Execute task with agent
   */
  async executeTask(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task || !task.assignedAgent) {
      throw new Error(`Task not assigned: ${taskId}`);
    }

    const agent = this.agents.get(task.assignedAgent);
    if (!agent) {
      throw new Error(`Agent not found: ${task.assignedAgent}`);
    }

    task.status = 'in_progress';
    agent.status = 'working';
    this.notifyStatusChange();

    try {
      // TODO: Integrate with MultiModelExecutor
      // For now, simulate task execution
      const result = await this.simulateTaskExecution(task, agent);
      
      task.result = result;
      task.status = 'completed';
      agent.status = 'idle';
      agent.currentTask = undefined;
      
      this.notifyStatusChange();
      return result;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
      agent.status = 'error';
      agent.currentTask = undefined;
      
      this.notifyStatusChange();
      throw error;
    }
  }

  /**
   * Simulate task execution (placeholder)
   */
  private async simulateTaskExecution(task: Task, agent: Agent): Promise<any> {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      taskId: task.id,
      agentId: agent.id,
      result: `Task "${task.title}" completed by ${agent.name}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): Agent[] {
    return this.getAllAgents().filter(a => a.status === 'idle');
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: Agent['status']): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.notifyStatusChange();
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (teams: FireTeam[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const teams = this.getAllTeams();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(teams);
      } catch (error) {
        console.error('[FireTeamsSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const fireTeamsSystem = new FireTeamsSystem();

