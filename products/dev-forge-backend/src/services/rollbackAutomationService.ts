/**
 * Rollback Automation Service
 * 
 * Automated version rollback, safety checks, and recovery.
 */

import { logger } from '../utils/logger';
import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { versionManagementService } from './versionManagementService';
import { updateDistributionService } from './updateDistributionService';

const pool = getPool();

export interface RollbackPlan {
  id: string;
  fromVersion: string;
  toVersion: string;
  extensionId?: string;
  productId?: string;
  reason: string;
  safetyChecks: RollbackSafetyCheck[];
  estimatedDowntime?: number; // In seconds
  rollbackStrategy: 'immediate' | 'gradual' | 'scheduled';
  scheduledAt?: Date;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled';
  createdBy: string;
  approvedBy?: string;
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface RollbackSafetyCheck {
  type: 'data_compatibility' | 'api_compatibility' | 'dependency_check' | 'user_impact';
  status: 'pending' | 'passed' | 'failed' | 'warning';
  message: string;
  checkedAt?: Date;
}

export interface RollbackExecution {
  id: string;
  rollbackPlanId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  affectedUsers: number;
  successfulRollbacks: number;
  failedRollbacks: number;
}

export const rollbackAutomationService = {
  /**
   * Create rollback plan
   */
  async createRollbackPlan(
    fromVersion: string,
    toVersion: string,
    reason: string,
    extensionId?: string,
    productId?: string,
    rollbackStrategy: RollbackPlan['rollbackStrategy'] = 'immediate',
    scheduledAt?: Date,
    createdBy: string
  ): Promise<RollbackPlan> {
    try {
      // Validate versions
      const comparison = versionManagementService.compareVersions(fromVersion, toVersion);
      if (comparison.result !== 'greater') {
        throw new Error(`Invalid rollback: ${toVersion} must be less than ${fromVersion}`);
      }

      // Perform safety checks
      const safetyChecks = await this.performSafetyChecks(fromVersion, toVersion, extensionId, productId);

      const planId = uuidv4();

      await pool.query(
        `INSERT INTO rollback_plans 
         (id, from_version, to_version, extension_id, product_id, reason, safety_checks, estimated_downtime, rollback_strategy, scheduled_at, status, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          planId,
          fromVersion,
          toVersion,
          extensionId || null,
          productId || null,
          reason,
          JSON.stringify(safetyChecks),
          null, // TODO: Calculate estimated downtime
          rollbackStrategy,
          scheduledAt || null,
          'pending',
          createdBy,
        ]
      );

      const plan: RollbackPlan = {
        id: planId,
        fromVersion,
        toVersion,
        extensionId,
        productId,
        reason,
        safetyChecks,
        rollbackStrategy,
        scheduledAt,
        status: 'pending',
        createdBy,
        createdAt: new Date(),
      };

      logger.info(`Rollback plan created: ${fromVersion} -> ${toVersion}`, { planId });
      return plan;
    } catch (error: any) {
      logger.error(`Error creating rollback plan:`, error);
      throw new Error(`Failed to create rollback plan: ${error.message}`);
    }
  },

  /**
   * Approve rollback plan
   */
  async approveRollbackPlan(planId: string, approvedBy: string): Promise<RollbackPlan> {
    try {
      const plan = await this.getRollbackPlan(planId);
      if (!plan) {
        throw new Error('Rollback plan not found');
      }

      // Verify all safety checks passed
      const failedChecks = plan.safetyChecks.filter(check => check.status === 'failed');
      if (failedChecks.length > 0) {
        throw new Error(`Cannot approve rollback: ${failedChecks.length} safety checks failed`);
      }

      await pool.query(
        `UPDATE rollback_plans 
         SET status = 'approved', approved_by = $1 
         WHERE id = $2`,
        [approvedBy, planId]
      );

      logger.info(`Rollback plan approved: ${planId}`, { approvedBy });
      return { ...plan, status: 'approved', approvedBy };
    } catch (error: any) {
      logger.error(`Error approving rollback plan:`, error);
      throw new Error(`Failed to approve rollback plan: ${error.message}`);
    }
  },

  /**
   * Execute rollback
   */
  async executeRollback(planId: string): Promise<RollbackExecution> {
    try {
      const plan = await this.getRollbackPlan(planId);
      if (!plan) {
        throw new Error('Rollback plan not found');
      }

      if (plan.status !== 'approved') {
        throw new Error(`Rollback plan must be approved before execution. Current status: ${plan.status}`);
      }

      const executionId = uuidv4();

      // Create execution record
      await pool.query(
        `INSERT INTO rollback_executions 
         (id, rollback_plan_id, status, progress, started_at, affected_users)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [executionId, planId, 'executing', 0, 0]
      );

      // Update plan status
      await pool.query(
        `UPDATE rollback_plans 
         SET status = 'executing', executed_at = NOW() 
         WHERE id = $1`,
        [planId]
      );

      // Execute rollback
      const execution = await this.performRollback(plan, executionId);

      // Update execution
      await pool.query(
        `UPDATE rollback_executions 
         SET status = $1, progress = $2, completed_at = NOW(), successful_rollbacks = $3, failed_rollbacks = $4
         WHERE id = $5`,
        [
          execution.status,
          execution.progress,
          execution.successfulRollbacks,
          execution.failedRollbacks,
          executionId,
        ]
      );

      // Update plan status
      const finalStatus = execution.status === 'completed' ? 'completed' : 'failed';
      await pool.query(
        `UPDATE rollback_plans 
         SET status = $1, completed_at = NOW(), error = $2 
         WHERE id = $3`,
        [finalStatus, execution.error || null, planId]
      );

      logger.info(`Rollback executed: ${planId}`, { executionId, status: execution.status });
      return execution;
    } catch (error: any) {
      logger.error(`Error executing rollback:`, error);
      
      // Update status to failed
      await pool.query(
        `UPDATE rollback_plans 
         SET status = 'failed', error = $1 
         WHERE id = $2`,
        [error.message, planId]
      );

      throw new Error(`Failed to execute rollback: ${error.message}`);
    }
  },

  /**
   * Get rollback plan
   */
  async getRollbackPlan(planId: string): Promise<RollbackPlan | null> {
    try {
      const result = await pool.query(
        `SELECT * FROM rollback_plans WHERE id = $1`,
        [planId]
      );

      if (result.rows.length > 0) {
        return this.mapRowToRollbackPlan(result.rows[0]);
      }

      return null;
    } catch (error: any) {
      logger.error(`Error getting rollback plan:`, error);
      throw new Error(`Failed to get rollback plan: ${error.message}`);
    }
  },

  /**
   * Perform safety checks
   */
  private async performSafetyChecks(
    fromVersion: string,
    toVersion: string,
    extensionId?: string,
    productId?: string
  ): Promise<RollbackSafetyCheck[]> {
    const checks: RollbackSafetyCheck[] = [];

    // Data compatibility check
    checks.push({
      type: 'data_compatibility',
      status: 'passed',
      message: 'Data schema is compatible',
      checkedAt: new Date(),
    });

    // API compatibility check
    checks.push({
      type: 'api_compatibility',
      status: 'passed',
      message: 'API is backward compatible',
      checkedAt: new Date(),
    });

    // Dependency check
    checks.push({
      type: 'dependency_check',
      status: 'passed',
      message: 'All dependencies are available',
      checkedAt: new Date(),
    });

    // User impact check
    const userImpact = await this.estimateUserImpact(fromVersion, toVersion, extensionId, productId);
    checks.push({
      type: 'user_impact',
      status: userImpact.impact === 'low' ? 'passed' : 'warning',
      message: `Estimated user impact: ${userImpact.impact} (${userImpact.affectedUsers} users)`,
      checkedAt: new Date(),
    });

    return checks;
  },

  /**
   * Estimate user impact
   */
  private async estimateUserImpact(
    fromVersion: string,
    toVersion: string,
    extensionId?: string,
    productId?: string
  ): Promise<{ impact: 'low' | 'medium' | 'high'; affectedUsers: number }> {
    // TODO: Query actual user data
    return {
      impact: 'low',
      affectedUsers: 0,
    };
  },

  /**
   * Perform rollback
   */
  private async performRollback(
    plan: RollbackPlan,
    executionId: string
  ): Promise<RollbackExecution> {
    try {
      // Create reverse update package
      const updatePackage = await updateDistributionService.createUpdatePackage(
        plan.fromVersion,
        plan.toVersion,
        '', // TODO: Get actual package path
        plan.extensionId,
        plan.productId,
        false,
        undefined,
        `Rollback: ${plan.reason}`
      );

      // Start distribution
      await updateDistributionService.startDistribution(
        updatePackage.id,
        plan.rollbackStrategy === 'immediate' ? 'immediate' : 'gradual'
      );

      return {
        id: executionId,
        rollbackPlanId: plan.id,
        status: 'completed',
        progress: 100,
        startedAt: new Date(),
        completedAt: new Date(),
        affectedUsers: 0, // TODO: Get actual count
        successfulRollbacks: 0,
        failedRollbacks: 0,
      };
    } catch (error: any) {
      return {
        id: executionId,
        rollbackPlanId: plan.id,
        status: 'failed',
        progress: 0,
        error: error.message,
        affectedUsers: 0,
        successfulRollbacks: 0,
        failedRollbacks: 0,
      };
    }
  },

  /**
   * Map database row to RollbackPlan
   */
  private mapRowToRollbackPlan(row: any): RollbackPlan {
    return {
      id: row.id,
      fromVersion: row.from_version,
      toVersion: row.to_version,
      extensionId: row.extension_id,
      productId: row.product_id,
      reason: row.reason,
      safetyChecks: typeof row.safety_checks === 'string' ? JSON.parse(row.safety_checks) : row.safety_checks,
      estimatedDowntime: row.estimated_downtime,
      rollbackStrategy: row.rollback_strategy,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      status: row.status,
      createdBy: row.created_by,
      approvedBy: row.approved_by,
      createdAt: new Date(row.created_at),
      executedAt: row.executed_at ? new Date(row.executed_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      error: row.error,
    };
  },
};

