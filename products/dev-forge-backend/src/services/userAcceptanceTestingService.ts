/**
 * User Acceptance Testing Service
 * 
 * Manages user acceptance testing scenarios and criteria.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface UATScenario {
  id: string;
  name: string;
  description: string;
  category: 'functional' | 'performance' | 'security' | 'usability' | 'integration';
  steps: UATStep[];
  acceptanceCriteria: AcceptanceCriterion[];
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'blocked';
  assignedTo?: string;
  testedBy?: string;
  testedAt?: Date;
  notes?: string;
}

export interface UATStep {
  stepNumber: number;
  description: string;
  expectedResult: string;
  actualResult?: string;
  status: 'pending' | 'passed' | 'failed';
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  status: 'pending' | 'met' | 'not-met';
  notes?: string;
}

export interface UATTestPlan {
  id: string;
  name: string;
  description: string;
  scenarios: UATScenario[];
  status: 'draft' | 'active' | 'completed';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export const userAcceptanceTestingService = {
  /**
   * Create UAT test plan
   */
  async createTestPlan(
    name: string,
    description: string,
    scenarios: Omit<UATScenario, 'id' | 'status'>[],
    createdBy: string
  ): Promise<UATTestPlan> {
    try {
      const planId = uuidv4();
      const scenarioIds = scenarios.map(() => uuidv4());

      // Create scenarios with IDs
      const scenariosWithIds = scenarios.map((scenario, index) => ({
        ...scenario,
        id: scenarioIds[index],
        status: 'pending' as const,
      }));

      await pool.query(
        `INSERT INTO uat_test_plans 
         (id, name, description, scenarios, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          planId,
          name,
          description,
          JSON.stringify(scenariosWithIds),
          'draft',
          createdBy,
        ]
      );

      const plan: UATTestPlan = {
        id: planId,
        name,
        description,
        scenarios: scenariosWithIds,
        status: 'draft',
        createdBy,
        createdAt: new Date(),
      };

      logger.info(`UAT test plan created: ${name}`, { planId, scenarios: scenarios.length });
      return plan;
    } catch (error: any) {
      logger.error(`Error creating UAT test plan:`, error);
      throw new Error(`Failed to create test plan: ${error.message}`);
    }
  },

  /**
   * Execute UAT scenario
   */
  async executeScenario(
    planId: string,
    scenarioId: string,
    testedBy: string,
    actualResults: Record<number, string>,
    notes?: string
  ): Promise<UATScenario> {
    try {
      // Get test plan
      const plan = await this.getTestPlan(planId);
      if (!plan) {
        throw new Error('Test plan not found');
      }

      // Find scenario
      const scenario = plan.scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Update steps with actual results
      const updatedSteps = scenario.steps.map(step => {
        const actualResult = actualResults[step.stepNumber];
        return {
          ...step,
          actualResult,
          status: actualResult ? 'passed' : 'failed',
        };
      });

      // Check acceptance criteria
      const allStepsPassed = updatedSteps.every(step => step.status === 'passed');
      const criteriaMet = scenario.acceptanceCriteria.map(criterion => ({
        ...criterion,
        status: allStepsPassed ? 'met' : 'not-met',
      }));

      // Determine scenario status
      const status = allStepsPassed ? 'passed' : 'failed';

      // Update scenario
      const updatedScenario: UATScenario = {
        ...scenario,
        steps: updatedSteps,
        acceptanceCriteria: criteriaMet,
        status,
        testedBy,
        testedAt: new Date(),
        notes,
      };

      // Update test plan
      const updatedScenarios = plan.scenarios.map(s =>
        s.id === scenarioId ? updatedScenario : s
      );

      const allScenariosComplete = updatedScenarios.every(s => 
        s.status === 'passed' || s.status === 'failed'
      );

      await pool.query(
        `UPDATE uat_test_plans 
         SET scenarios = $1, status = $2, completed_at = $3
         WHERE id = $4`,
        [
          JSON.stringify(updatedScenarios),
          allScenariosComplete ? 'completed' : 'active',
          allScenariosComplete ? new Date() : null,
          planId,
        ]
      );

      logger.info(`UAT scenario executed: ${scenario.name}`, { status, testedBy });
      return updatedScenario;
    } catch (error: any) {
      logger.error(`Error executing UAT scenario:`, error);
      throw new Error(`Failed to execute scenario: ${error.message}`);
    }
  },

  /**
   * Get test plan
   */
  async getTestPlan(planId: string): Promise<UATTestPlan | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM uat_test_plans WHERE id = $1`,
        [planId]
      );

      if (result.rows.length > 0) {
        return this.mapRowToTestPlan(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting test plan:`, error);
      throw new Error(`Failed to get test plan: ${error.message}`);
    }
  },

  /**
   * Get all test plans
   */
  async getAllTestPlans(): Promise<UATTestPlan[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM uat_test_plans ORDER BY created_at DESC`
      );
      return result.rows.map(row => this.mapRowToTestPlan(row));
    } catch (error: any) {
      logger.error(`Error getting test plans:`, error);
      throw new Error(`Failed to get test plans: ${error.message}`);
    }
  },

  /**
   * Create default test scenarios
   */
  async createDefaultScenarios(): Promise<UATScenario[]> {
    const scenarios: Omit<UATScenario, 'id' | 'status'>[] = [
      {
        name: 'User Registration and Login',
        description: 'Test user registration and login flow',
        category: 'functional',
        steps: [
          {
            stepNumber: 1,
            description: 'Navigate to registration page',
            expectedResult: 'Registration form is displayed',
            status: 'pending',
          },
          {
            stepNumber: 2,
            description: 'Fill in registration form',
            expectedResult: 'Form accepts valid input',
            status: 'pending',
          },
          {
            stepNumber: 3,
            description: 'Submit registration',
            expectedResult: 'User account is created and confirmation is shown',
            status: 'pending',
          },
          {
            stepNumber: 4,
            description: 'Login with new credentials',
            expectedResult: 'User is successfully logged in',
            status: 'pending',
          },
        ],
        acceptanceCriteria: [
          {
            id: uuidv4(),
            description: 'User can register with valid email and password',
            status: 'pending',
          },
          {
            id: uuidv4(),
            description: 'User can login with registered credentials',
            status: 'pending',
          },
        ],
      },
      {
        name: 'Extension Marketplace Browse and Install',
        description: 'Test browsing and installing extensions',
        category: 'functional',
        steps: [
          {
            stepNumber: 1,
            description: 'Browse extension marketplace',
            expectedResult: 'List of extensions is displayed',
            status: 'pending',
          },
          {
            stepNumber: 2,
            description: 'View extension details',
            expectedResult: 'Extension details page is displayed',
            status: 'pending',
          },
          {
            stepNumber: 3,
            description: 'Install extension',
            expectedResult: 'Extension is installed successfully',
            status: 'pending',
          },
        ],
        acceptanceCriteria: [
          {
            id: uuidv4(),
            description: 'User can browse available extensions',
            status: 'pending',
          },
          {
            id: uuidv4(),
            description: 'User can install extensions',
            status: 'pending',
          },
        ],
      },
      {
        name: 'Support Ticket Creation',
        description: 'Test creating and managing support tickets',
        category: 'functional',
        steps: [
          {
            stepNumber: 1,
            description: 'Navigate to support page',
            expectedResult: 'Support page is displayed',
            status: 'pending',
          },
          {
            stepNumber: 2,
            description: 'Create new support ticket',
            expectedResult: 'Ticket creation form is displayed',
            status: 'pending',
          },
          {
            stepNumber: 3,
            description: 'Submit ticket',
            expectedResult: 'Ticket is created and confirmation is shown',
            status: 'pending',
          },
        ],
        acceptanceCriteria: [
          {
            id: uuidv4(),
            description: 'User can create support tickets',
            status: 'pending',
          },
        ],
      },
    ];

    return scenarios.map(scenario => ({
      ...scenario,
      id: uuidv4(),
      status: 'pending' as const,
    }));
  },

  /**
   * Map database row to UATTestPlan
   */
  private mapRowToTestPlan(row: any): UATTestPlan {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      scenarios: typeof row.scenarios === 'string' ? JSON.parse(row.scenarios) : row.scenarios,
      status: row.status,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    };
  },
};

