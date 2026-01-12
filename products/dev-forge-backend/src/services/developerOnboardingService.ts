/**
 * Developer Onboarding Service
 * 
 * Automated developer onboarding and verification system.
 */

import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface DeveloperApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  applicationData: DeveloperApplicationData;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface DeveloperApplicationData {
  companyName?: string;
  website?: string;
  description: string;
  portfolio?: string;
  githubUsername?: string;
  previousWork?: string[];
  taxId?: string; // For financial purposes
  paymentMethod?: 'stripe' | 'paypal' | 'bank_transfer';
  paymentDetails?: Record<string, any>;
}

export interface OnboardingChecklist {
  profileComplete: boolean;
  paymentMethodVerified: boolean;
  identityVerified: boolean;
  agreementSigned: boolean;
  taxInfoProvided: boolean;
}

export const developerOnboardingService = {
  /**
   * Submit developer application
   */
  async submitApplication(
    userId: string,
    applicationData: DeveloperApplicationData
  ): Promise<DeveloperApplication> {
    const id = uuidv4();

    try {
      // Validate application
      await this.validateApplication(applicationData);

      // Create application record
      const result = await pool.query(
        `INSERT INTO developer_applications 
         (id, user_id, status, application_data, submitted_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [id, userId, 'pending', JSON.stringify(applicationData)]
      );

      const application = this.mapRowToApplication(result.rows[0]);
      
      logger.info(`Developer application submitted: ${id} by user ${userId}`);

      // Trigger automated review
      await this.triggerAutomatedReview(id);

      return application;
    } catch (error: any) {
      logger.error('Error submitting developer application:', error);
      throw new Error(`Failed to submit application: ${error.message}`);
    }
  },

  /**
   * Trigger automated review
   */
  async triggerAutomatedReview(applicationId: string): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      // Run automated checks
      const checks = await this.runAutomatedChecks(application);

      // Auto-approve if all checks pass
      if (checks.profileComplete && checks.paymentMethodVerified) {
        await this.autoApprove(applicationId);
      } else {
        // Needs manual review
        await pool.query(
          `UPDATE developer_applications SET status = 'pending' WHERE id = $1`,
          [applicationId]
        );
      }
    } catch (error: any) {
      logger.error(`Error in automated review for ${applicationId}:`, error);
      throw new Error(`Automated review failed: ${error.message}`);
    }
  },

  /**
   * Run automated checks
   */
  async runAutomatedChecks(application: DeveloperApplication): Promise<OnboardingChecklist> {
    const data = application.applicationData;

    return {
      profileComplete: !!(data.description && data.description.length > 50),
      paymentMethodVerified: !!(data.paymentMethod && data.paymentDetails),
      identityVerified: false, // Requires manual verification
      agreementSigned: false, // Requires manual signing
      taxInfoProvided: !!(data.taxId || data.companyName),
    };
  },

  /**
   * Auto-approve application
   */
  async autoApprove(applicationId: string): Promise<void> {
    await pool.query(
      `UPDATE developer_applications 
       SET status = 'approved', reviewed_at = NOW() WHERE id = $1`,
      [applicationId]
    );

    // Update user role to 'publisher'
    const application = await this.getApplication(applicationId);
    if (application) {
      await pool.query(
        `UPDATE users SET role = 'publisher' WHERE id = $1`,
        [application.userId]
      );
    }

    logger.info(`Developer application auto-approved: ${applicationId}`);
  },

  /**
   * Manually approve application
   */
  async approveApplication(applicationId: string, reviewerId: string, notes?: string): Promise<void> {
    await pool.query(
      `UPDATE developer_applications 
       SET status = 'approved', reviewed_at = NOW(), reviewed_by = $1, review_notes = $2 
       WHERE id = $3`,
      [reviewerId, notes, applicationId]
    );

    // Update user role
    const application = await this.getApplication(applicationId);
    if (application) {
      await pool.query(
        `UPDATE users SET role = 'publisher' WHERE id = $1`,
        [application.userId]
      );
    }

    logger.info(`Developer application approved: ${applicationId} by ${reviewerId}`);
  },

  /**
   * Reject application
   */
  async rejectApplication(applicationId: string, reviewerId: string, notes: string): Promise<void> {
    await pool.query(
      `UPDATE developer_applications 
       SET status = 'rejected', reviewed_at = NOW(), reviewed_by = $1, review_notes = $2 
       WHERE id = $3`,
      [reviewerId, notes, applicationId]
    );

    logger.info(`Developer application rejected: ${applicationId} by ${reviewerId}`);
  },

  /**
   * Get application
   */
  async getApplication(id: string): Promise<DeveloperApplication | undefined> {
    const result = await pool.query(
      `SELECT * FROM developer_applications WHERE id = $1`,
      [id]
    );
    if (result.rows.length > 0) {
      return this.mapRowToApplication(result.rows[0]);
    }
    return undefined;
  },

  /**
   * Get user's application
   */
  async getUserApplication(userId: string): Promise<DeveloperApplication | undefined> {
    const result = await pool.query(
      `SELECT * FROM developer_applications WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
      [userId]
    );
    if (result.rows.length > 0) {
      return this.mapRowToApplication(result.rows[0]);
    }
    return undefined;
  },

  /**
   * Get all pending applications
   */
  async getPendingApplications(limit: number = 50, offset: number = 0): Promise<DeveloperApplication[]> {
    const result = await pool.query(
      `SELECT * FROM developer_applications 
       WHERE status = 'pending' 
       ORDER BY submitted_at ASC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows.map(row => this.mapRowToApplication(row));
  },

  /**
   * Check if user is approved developer
   */
  async isApprovedDeveloper(userId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    
    if (result.rows.length > 0) {
      const role = result.rows[0].role;
      return role === 'publisher' || role === 'admin';
    }
    
    return false;
  },

  /**
   * Validate application
   */
  async validateApplication(data: DeveloperApplicationData): Promise<void> {
    if (!data.description || data.description.length < 50) {
      throw new Error('Description must be at least 50 characters');
    }

    if (data.website && !this.isValidUrl(data.website)) {
      throw new Error('Invalid website URL');
    }

    if (data.githubUsername && !/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?![.-])){0,38}$/.test(data.githubUsername)) {
      throw new Error('Invalid GitHub username');
    }
  },

  /**
   * Validate URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Map database row to DeveloperApplication
   */
  private mapRowToApplication(row: any): DeveloperApplication {
    return {
      id: row.id,
      userId: row.user_id,
      status: row.status,
      applicationData: typeof row.application_data === 'string' 
        ? JSON.parse(row.application_data) 
        : row.application_data,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
      reviewedBy: row.reviewed_by,
      reviewNotes: row.review_notes,
    };
  },
};

