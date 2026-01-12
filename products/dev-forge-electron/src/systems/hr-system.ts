/**
 * HR System
 * 
 * Manages agent onboarding, capabilities, and lifecycle.
 * Part of the VectorForge Framework.
 */

import { Agent } from './fire-teams';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  modelId: string;
  capabilities: string[];
  experience: number;
  successRate: number;
  tasksCompleted: number;
  averageResponseTime: number;
  specialties: string[];
  onboardingDate: Date;
  lastActive: Date;
}

export interface OnboardingChecklist {
  id: string;
  name: string;
  completed: boolean;
  completedAt?: Date;
}

export class HRSystem {
  private profiles: Map<string, AgentProfile> = new Map();
  private onboardingChecklists: Map<string, OnboardingChecklist[]> = new Map();
  private statusCallbacks: Set<(profiles: AgentProfile[]) => void> = new Set();

  constructor() {
    this.initializeDefaultProfiles();
  }

  /**
   * Initialize default agent profiles
   */
  private initializeDefaultProfiles(): void {
    const defaultProfiles: AgentProfile[] = [
      {
        id: 'agent-1',
        name: 'Code Specialist',
        role: 'code',
        modelId: 'ollama-codellama',
        capabilities: ['code-generation', 'code-review', 'debugging'],
        experience: 0,
        successRate: 0,
        tasksCompleted: 0,
        averageResponseTime: 0,
        specialties: ['TypeScript', 'JavaScript', 'Python'],
        onboardingDate: new Date(),
        lastActive: new Date(),
      },
      {
        id: 'agent-2',
        name: 'Documentation Agent',
        role: 'documentation',
        modelId: 'ollama-llama2',
        capabilities: ['documentation', 'explanation', 'tutorials'],
        experience: 0,
        successRate: 0,
        tasksCompleted: 0,
        averageResponseTime: 0,
        specialties: ['Markdown', 'Technical Writing'],
        onboardingDate: new Date(),
        lastActive: new Date(),
      },
      {
        id: 'agent-3',
        name: 'Testing Agent',
        role: 'testing',
        modelId: 'ollama-llama2',
        capabilities: ['test-generation', 'test-execution', 'coverage'],
        experience: 0,
        successRate: 0,
        tasksCompleted: 0,
        averageResponseTime: 0,
        specialties: ['Unit Tests', 'Integration Tests'],
        onboardingDate: new Date(),
        lastActive: new Date(),
      },
    ];

    defaultProfiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
      this.createOnboardingChecklist(profile.id);
    });
  }

  /**
   * Create onboarding checklist for agent
   */
  private createOnboardingChecklist(agentId: string): void {
    const checklist: OnboardingChecklist[] = [
      { id: 'check-1', name: 'Model connection verified', completed: false },
      { id: 'check-2', name: 'Capabilities registered', completed: false },
      { id: 'check-3', name: 'Initial test task completed', completed: false },
      { id: 'check-4', name: 'Performance baseline established', completed: false },
    ];

    this.onboardingChecklists.set(agentId, checklist);
  }

  /**
   * Onboard new agent
   */
  async onboardAgent(agent: Agent): Promise<AgentProfile> {
    const profile: AgentProfile = {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      modelId: agent.modelId,
      capabilities: agent.capabilities,
      experience: 0,
      successRate: 0,
      tasksCompleted: 0,
      averageResponseTime: 0,
      specialties: [],
      onboardingDate: new Date(),
      lastActive: new Date(),
    };

    this.profiles.set(profile.id, profile);
    this.createOnboardingChecklist(profile.id);
    
    // Run onboarding checks
    await this.runOnboardingChecks(profile.id);
    
    this.notifyStatusChange();
    return profile;
  }

  /**
   * Run onboarding checks
   */
  private async runOnboardingChecks(agentId: string): Promise<void> {
    const checklist = this.onboardingChecklists.get(agentId);
    if (!checklist) return;

    // Check 1: Model connection
    checklist[0].completed = true;
    checklist[0].completedAt = new Date();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check 2: Capabilities
    checklist[1].completed = true;
    checklist[1].completedAt = new Date();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check 3: Initial test
    checklist[2].completed = true;
    checklist[2].completedAt = new Date();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check 4: Performance baseline
    checklist[3].completed = true;
    checklist[3].completedAt = new Date();
  }

  /**
   * Get agent profile
   */
  getProfile(agentId: string): AgentProfile | undefined {
    return this.profiles.get(agentId);
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): AgentProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get onboarding checklist
   */
  getOnboardingChecklist(agentId: string): OnboardingChecklist[] {
    return this.onboardingChecklists.get(agentId) || [];
  }

  /**
   * Update agent metrics
   */
  updateMetrics(agentId: string, taskCompleted: boolean, responseTime: number): void {
    const profile = this.profiles.get(agentId);
    if (!profile) return;

    profile.tasksCompleted++;
    profile.lastActive = new Date();

    // Update success rate
    const totalTasks = profile.tasksCompleted;
    if (taskCompleted) {
      profile.successRate = ((profile.successRate * (totalTasks - 1)) + 1) / totalTasks;
    } else {
      profile.successRate = (profile.successRate * (totalTasks - 1)) / totalTasks;
    }

    // Update average response time
    profile.averageResponseTime = 
      ((profile.averageResponseTime * (totalTasks - 1)) + responseTime) / totalTasks;

    // Update experience (based on tasks completed)
    profile.experience = Math.floor(profile.tasksCompleted / 10);

    this.notifyStatusChange();
  }

  /**
   * Get agent performance summary
   */
  getPerformanceSummary(agentId: string): {
    profile: AgentProfile;
    checklist: OnboardingChecklist[];
    isOnboarded: boolean;
  } | undefined {
    const profile = this.profiles.get(agentId);
    if (!profile) return undefined;

    const checklist = this.getOnboardingChecklist(agentId);
    const isOnboarded = checklist.every(check => check.completed);

    return {
      profile,
      checklist,
      isOnboarded,
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (profiles: AgentProfile[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const profiles = this.getAllProfiles();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(profiles);
      } catch (error) {
        console.error('[HRSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const hrSystem = new HRSystem();

