/**
 * Wargaming System
 * 
 * Manages scenario analysis, simulation, and strategic planning.
 * Part of the VectorForge Framework - enables decision analysis.
 */

export interface Scenario {
  id: string;
  name: string;
  description: string;
  participants: Participant[];
  rules: Rule[];
  objectives: Objective[];
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  constraints: string[];
  resources: Resource[];
}

export interface Resource {
  type: string;
  amount: number;
  unit: string;
}

export interface Rule {
  id: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
}

export interface Objective {
  id: string;
  description: string;
  type: 'primary' | 'secondary' | 'tertiary';
  successCriteria: string;
  measurable: boolean;
}

export interface WargameResult {
  scenarioId: string;
  executionId: string;
  startTime: Date;
  endTime: Date;
  outcomes: Outcome[];
  metrics: WargameMetrics;
  analysis: Analysis;
}

export interface Outcome {
  objectiveId: string;
  achieved: boolean;
  score: number;
  details: string;
  evidence: string[];
}

export interface WargameMetrics {
  duration: number; // milliseconds
  participantsActive: number;
  rulesTriggered: number;
  objectivesAchieved: number;
  objectivesTotal: number;
  successRate: number; // percentage
}

export interface Analysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: Risk[];
  recommendations: Recommendation[];
  lessonsLearned: string[];
}

export interface Risk {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  impact: string;
  mitigation: string;
}

export interface Recommendation {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  action: string;
  expectedOutcome: string;
}

export class WargamingSystem {
  private scenarios: Map<string, Scenario> = new Map();
  private results: Map<string, WargameResult> = new Map();
  private statusCallbacks: Set<(scenarios: Scenario[]) => void> = new Set();

  constructor() {
    // Initialize with example scenarios if needed
  }

  /**
   * Create a new scenario
   */
  createScenario(scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Scenario {
    const newScenario: Scenario = {
      ...scenario,
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scenarios.set(newScenario.id, newScenario);
    this.notifyStatusChange();
    return newScenario;
  }

  /**
   * Get all scenarios
   */
  getAllScenarios(): Scenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenario by ID
   */
  getScenario(id: string): Scenario | undefined {
    return this.scenarios.get(id);
  }

  /**
   * Update scenario
   */
  updateScenario(id: string, updates: Partial<Scenario>): void {
    const scenario = this.scenarios.get(id);
    if (scenario) {
      Object.assign(scenario, updates, { updatedAt: new Date() });
      this.notifyStatusChange();
    }
  }

  /**
   * Delete scenario
   */
  deleteScenario(id: string): void {
    this.scenarios.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Execute a scenario (run wargame)
   */
  async executeScenario(scenarioId: string): Promise<WargameResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    if (scenario.status !== 'active' && scenario.status !== 'draft') {
      throw new Error(`Scenario ${scenarioId} is not executable (status: ${scenario.status})`);
    }

    const startTime = new Date();
    const executionId = `execution-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Update scenario status
    this.updateScenario(scenarioId, { status: 'active', executedAt: startTime });

    // Simulate wargame execution
    const outcomes = await this.simulateExecution(scenario);
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Calculate metrics
    const metrics = this.calculateMetrics(scenario, outcomes, duration);

    // Generate analysis
    const analysis = this.generateAnalysis(scenario, outcomes, metrics);

    // Create result
    const result: WargameResult = {
      scenarioId,
      executionId,
      startTime,
      endTime,
      outcomes,
      metrics,
      analysis,
    };

    this.results.set(executionId, result);
    this.updateScenario(scenarioId, { status: 'completed' });

    return result;
  }

  /**
   * Simulate scenario execution
   */
  private async simulateExecution(scenario: Scenario): Promise<Outcome[]> {
    // Simulate outcomes for each objective
    const outcomes: Outcome[] = scenario.objectives.map(objective => {
      // Simple simulation - in real implementation, this would be more complex
      const achieved = Math.random() > 0.3; // 70% success rate for demo
      const score = achieved ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 40);

      return {
        objectiveId: objective.id,
        achieved,
        score,
        details: achieved 
          ? `Objective "${objective.description}" was successfully achieved.`
          : `Objective "${objective.description}" was not fully achieved.`,
        evidence: achieved 
          ? [`Evidence 1: Success indicator`, `Evidence 2: Positive metric`]
          : [`Evidence 1: Gap identified`, `Evidence 2: Improvement needed`],
      };
    });

    // Simulate delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));

    return outcomes;
  }

  /**
   * Calculate metrics
   */
  private calculateMetrics(
    scenario: Scenario,
    outcomes: Outcome[],
    duration: number
  ): WargameMetrics {
    const objectivesAchieved = outcomes.filter(o => o.achieved).length;
    const objectivesTotal = outcomes.length;
    const successRate = objectivesTotal > 0 ? (objectivesAchieved / objectivesTotal) * 100 : 0;

    return {
      duration,
      participantsActive: scenario.participants.length,
      rulesTriggered: scenario.rules.length,
      objectivesAchieved,
      objectivesTotal,
      successRate,
    };
  }

  /**
   * Generate analysis
   */
  private generateAnalysis(
    scenario: Scenario,
    outcomes: Outcome[],
    metrics: WargameMetrics
  ): Analysis {
    const achieved = outcomes.filter(o => o.achieved);
    const failed = outcomes.filter(o => !o.achieved);

    const summary = `Wargame execution completed with ${metrics.successRate.toFixed(1)}% success rate. ` +
      `${achieved.length} objectives achieved, ${failed.length} objectives not met.`;

    const strengths = achieved.map(o => {
      const objective = scenario.objectives.find(obj => obj.id === o.objectiveId);
      return objective ? `Successfully achieved: ${objective.description}` : '';
    }).filter(s => s);

    const weaknesses = failed.map(o => {
      const objective = scenario.objectives.find(obj => obj.id === o.objectiveId);
      return objective ? `Failed to achieve: ${objective.description}` : '';
    }).filter(s => s);

    const risks: Risk[] = failed.map((o, index) => {
      const objective = scenario.objectives.find(obj => obj.id === o.objectiveId);
      return {
        id: `risk-${index}`,
        description: `Risk associated with ${objective?.description || 'unknown objective'}`,
        severity: o.score < 30 ? 'critical' : o.score < 50 ? 'high' : 'medium',
        probability: 0.5 + (Math.random() * 0.3),
        impact: 'Could affect overall scenario success',
        mitigation: 'Review and adjust approach',
      };
    });

    const recommendations: Recommendation[] = failed.map((o, index) => {
      const objective = scenario.objectives.find(obj => obj.id === o.objectiveId);
      return {
        id: `rec-${index}`,
        description: `Recommendation for ${objective?.description || 'unknown objective'}`,
        priority: o.score < 30 ? 'high' : 'medium',
        action: 'Review objective requirements and adjust strategy',
        expectedOutcome: 'Improved success rate in future executions',
      };
    });

    const lessonsLearned = [
      `Success rate: ${metrics.successRate.toFixed(1)}%`,
      `${achieved.length} objectives achieved successfully`,
      `${failed.length} objectives need attention`,
      'Consider reviewing rules and participant capabilities',
    ];

    return {
      summary,
      strengths,
      weaknesses,
      risks,
      recommendations,
      lessonsLearned,
    };
  }

  /**
   * Get result by execution ID
   */
  getResult(executionId: string): WargameResult | undefined {
    return this.results.get(executionId);
  }

  /**
   * Get all results for a scenario
   */
  getScenarioResults(scenarioId: string): WargameResult[] {
    return Array.from(this.results.values()).filter(r => r.scenarioId === scenarioId);
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (scenarios: Scenario[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const scenarios = this.getAllScenarios();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(scenarios);
      } catch (error) {
        console.error('[WargamingSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const wargamingSystem = new WargamingSystem();

