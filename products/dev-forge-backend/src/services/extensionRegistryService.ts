/**
 * Extension Registry Service
 * 
 * Automated extension submission, review, and approval system.
 */

import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { extensionService } from './extensionService';

const pool = getPool();

export interface ExtensionSubmission {
  id: string;
  developerId: string;
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  price: number;
  packageUrl: string; // URL to extension package file
  manifest: ExtensionManifest;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_revision';
  reviewNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface ExtensionManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  main: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  keywords?: string[];
  repository?: string;
  homepage?: string;
}

export interface ReviewResult {
  passed: boolean;
  score: number; // 0-100
  checks: ReviewCheck[];
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ReviewCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

export const extensionRegistryService = {
  /**
   * Submit extension for review
   */
  async submitExtension(
    developerId: string,
    name: string,
    description: string,
    version: string,
    category: string,
    tags: string[],
    price: number,
    packageUrl: string,
    manifest: ExtensionManifest
  ): Promise<ExtensionSubmission> {
    const id = uuidv4();
    
    try {
      // Validate submission
      await this.validateSubmission(manifest, packageUrl);

      // Create submission record
      const result = await pool.query(
        `INSERT INTO extension_submissions 
         (id, developer_id, name, description, version, category, tags, price, package_url, manifest, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
        [id, developerId, name, description, version, category, tags, price, packageUrl, JSON.stringify(manifest), 'pending']
      );

      const submission = this.mapRowToSubmission(result.rows[0]);
      
      logger.info(`Extension submission created: ${name} by ${developerId}`);

      // Trigger automated review
      await this.triggerAutomatedReview(id);

      return submission;
    } catch (error: any) {
      logger.error('Error submitting extension:', error);
      throw new Error(`Failed to submit extension: ${error.message}`);
    }
  },

  /**
   * Trigger automated review
   */
  async triggerAutomatedReview(submissionId: string): Promise<ReviewResult> {
    try {
      const submission = await this.getSubmission(submissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Update status to under_review
      await pool.query(
        `UPDATE extension_submissions SET status = 'under_review' WHERE id = $1`,
        [submissionId]
      );

      // Run automated checks
      const reviewResult = await this.runAutomatedChecks(submission);

      // Save review result
      await pool.query(
        `UPDATE extension_submissions 
         SET review_result = $1, reviewed_at = NOW() WHERE id = $2`,
        [JSON.stringify(reviewResult), submissionId]
      );

      // Auto-approve if score is high enough
      if (reviewResult.passed && reviewResult.score >= 80) {
        await this.autoApprove(submissionId, reviewResult);
      } else if (reviewResult.passed && reviewResult.score >= 60) {
        // Needs manual review
        await pool.query(
          `UPDATE extension_submissions SET status = 'needs_revision' WHERE id = $1`,
          [submissionId]
        );
      } else {
        // Auto-reject if score is too low
        await this.autoReject(submissionId, reviewResult);
      }

      logger.info(`Automated review completed for submission ${submissionId}: ${reviewResult.passed ? 'PASSED' : 'FAILED'} (Score: ${reviewResult.score})`);

      return reviewResult;
    } catch (error: any) {
      logger.error(`Error in automated review for ${submissionId}:`, error);
      throw new Error(`Automated review failed: ${error.message}`);
    }
  },

  /**
   * Run automated checks
   */
  async runAutomatedChecks(submission: ExtensionSubmission): Promise<ReviewResult> {
    const checks: ReviewCheck[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    let score = 100;

    // Check 1: Manifest validation
    const manifestCheck = await this.checkManifest(submission.manifest);
    checks.push(manifestCheck);
    if (!manifestCheck.passed) {
      errors.push(manifestCheck.message);
      score -= 20;
    }

    // Check 2: Security scan
    const securityCheck = await this.checkSecurity(submission.packageUrl);
    checks.push(securityCheck);
    if (!securityCheck.passed) {
      errors.push(securityCheck.message);
      score -= 30;
    } else if (securityCheck.severity === 'warning') {
      warnings.push(securityCheck.message);
      score -= 10;
    }

    // Check 3: Code quality
    const qualityCheck = await this.checkCodeQuality(submission.packageUrl);
    checks.push(qualityCheck);
    if (!qualityCheck.passed) {
      warnings.push(qualityCheck.message);
      score -= 15;
    } else if (qualityCheck.severity === 'info') {
      suggestions.push(qualityCheck.message);
      score -= 5;
    }

    // Check 4: Package structure
    const structureCheck = await this.checkPackageStructure(submission.packageUrl);
    checks.push(structureCheck);
    if (!structureCheck.passed) {
      errors.push(structureCheck.message);
      score -= 15;
    }

    // Check 5: Dependencies
    const dependenciesCheck = await this.checkDependencies(submission.manifest);
    checks.push(dependenciesCheck);
    if (!dependenciesCheck.passed) {
      warnings.push(dependenciesCheck.message);
      score -= 10;
    }

    // Check 6: Documentation
    const docsCheck = await this.checkDocumentation(submission.packageUrl);
    checks.push(docsCheck);
    if (!docsCheck.passed) {
      warnings.push(docsCheck.message);
      score -= 10;
    }

    const passed = errors.length === 0 && score >= 60;

    return {
      passed,
      score: Math.max(0, score),
      checks,
      errors,
      warnings,
      suggestions,
    };
  },

  /**
   * Check manifest validity
   */
  async checkManifest(manifest: ExtensionManifest): Promise<ReviewCheck> {
    const required = ['name', 'version', 'description', 'author', 'license', 'main'];
    const missing = required.filter(field => !manifest[field as keyof ExtensionManifest]);

    if (missing.length > 0) {
      return {
        name: 'manifest_validation',
        passed: false,
        severity: 'error',
        message: `Missing required manifest fields: ${missing.join(', ')}`,
      };
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      return {
        name: 'manifest_validation',
        passed: false,
        severity: 'error',
        message: 'Invalid version format. Use semantic versioning (e.g., 1.0.0)',
      };
    }

    return {
      name: 'manifest_validation',
      passed: true,
      severity: 'info',
      message: 'Manifest is valid',
    };
  },

  /**
   * Check security
   */
  async checkSecurity(packageUrl: string): Promise<ReviewCheck> {
    // TODO: Implement actual security scanning
    // For now, return a placeholder check
    
    // Check for common security issues:
    // - Malicious code patterns
    // - Vulnerable dependencies
    // - Unsafe file operations
    // - Network access patterns

    return {
      name: 'security_scan',
      passed: true,
      severity: 'info',
      message: 'Security scan passed (placeholder)',
      details: {
        note: 'Full security scanning to be implemented',
      },
    };
  },

  /**
   * Check code quality
   */
  async checkCodeQuality(packageUrl: string): Promise<ReviewCheck> {
    // TODO: Implement code quality checks
    // - Linting
    // - Type checking
    // - Code complexity
    // - Test coverage

    return {
      name: 'code_quality',
      passed: true,
      severity: 'info',
      message: 'Code quality check passed (placeholder)',
    };
  },

  /**
   * Check package structure
   */
  async checkPackageStructure(packageUrl: string): Promise<ReviewCheck> {
    // TODO: Validate package structure
    // - Required files exist
    // - Directory structure is correct
    // - Files are not too large

    return {
      name: 'package_structure',
      passed: true,
      severity: 'info',
      message: 'Package structure is valid (placeholder)',
    };
  },

  /**
   * Check dependencies
   */
  async checkDependencies(manifest: ExtensionManifest): Promise<ReviewCheck> {
    if (!manifest.dependencies || Object.keys(manifest.dependencies).length === 0) {
      return {
        name: 'dependencies',
        passed: true,
        severity: 'info',
        message: 'No dependencies declared',
      };
    }

    // Check for known vulnerable dependencies
    // TODO: Integrate with vulnerability database

    return {
      name: 'dependencies',
      passed: true,
      severity: 'info',
      message: 'Dependencies check passed (placeholder)',
    };
  },

  /**
   * Check documentation
   */
  async checkDocumentation(packageUrl: string): Promise<ReviewCheck> {
    // TODO: Check for README, CHANGELOG, etc.

    return {
      name: 'documentation',
      passed: true,
      severity: 'info',
      message: 'Documentation check passed (placeholder)',
    };
  },

  /**
   * Auto-approve extension
   */
  async autoApprove(submissionId: string, reviewResult: ReviewResult): Promise<void> {
    const submission = await this.getSubmission(submissionId);
    if (!submission) {
      throw new Error('Submission not found');
    }

    // Create extension in marketplace
    await extensionService.createExtension(
      submission.name,
      submission.description,
      submission.developerId,
      submission.version,
      submission.category,
      submission.tags,
      submission.price,
      submission.packageUrl
    );

    // Update submission status
    await pool.query(
      `UPDATE extension_submissions 
       SET status = 'approved', reviewed_at = NOW(), review_notes = $1 WHERE id = $2`,
      [JSON.stringify(reviewResult), submissionId]
    );

    logger.info(`Extension auto-approved: ${submission.name}`);
  },

  /**
   * Auto-reject extension
   */
  async autoReject(submissionId: string, reviewResult: ReviewResult): Promise<void> {
    await pool.query(
      `UPDATE extension_submissions 
       SET status = 'rejected', reviewed_at = NOW(), review_notes = $1 WHERE id = $2`,
      [JSON.stringify(reviewResult), submissionId]
    );

    logger.info(`Extension auto-rejected: ${submissionId}`);
  },

  /**
   * Get submission
   */
  async getSubmission(id: string): Promise<ExtensionSubmission | undefined> {
    const result = await pool.query(`SELECT * FROM extension_submissions WHERE id = $1`, [id]);
    if (result.rows.length > 0) {
      return this.mapRowToSubmission(result.rows[0]);
    }
    return undefined;
  },

  /**
   * Validate submission
   */
  async validateSubmission(manifest: ExtensionManifest, packageUrl: string): Promise<void> {
    // Basic validation
    if (!manifest.name || !manifest.version) {
      throw new Error('Manifest must include name and version');
    }

    // TODO: Validate package URL is accessible
    // TODO: Validate package file exists and is valid
  },

  /**
   * Map database row to ExtensionSubmission
   */
  private mapRowToSubmission(row: any): ExtensionSubmission {
    return {
      id: row.id,
      developerId: row.developer_id,
      name: row.name,
      description: row.description,
      version: row.version,
      category: row.category,
      tags: row.tags,
      price: row.price,
      packageUrl: row.package_url,
      manifest: typeof row.manifest === 'string' ? JSON.parse(row.manifest) : row.manifest,
      status: row.status,
      reviewNotes: row.review_notes,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      reviewedBy: row.reviewed_by,
    };
  },
};

