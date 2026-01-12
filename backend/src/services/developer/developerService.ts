/**
 * Developer Service
 * 
 * Handles developer application management.
 */

import { DeveloperApplicationModel, CreateApplicationData } from '../../database/models/developerApplicationModel';

export interface ApplicationInfo {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_data: Record<string, any>;
  reviewed_by?: string;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateApplicationResult {
  success: boolean;
  application?: ApplicationInfo;
  error?: string;
}

export class DeveloperService {
  private applicationModel: DeveloperApplicationModel;

  constructor() {
    this.applicationModel = new DeveloperApplicationModel();
  }

  /**
   * Create a developer application
   */
  async createApplication(data: CreateApplicationData): Promise<CreateApplicationResult> {
    try {
      // Check if user already has an application
      const existing = await this.applicationModel.findByUserId(data.user_id);
      if (existing && existing.status === 'pending') {
        return {
          success: false,
          error: 'You already have a pending application'
        };
      }

      if (existing && existing.status === 'approved') {
        return {
          success: false,
          error: 'You are already an approved developer'
        };
      }

      // Create application
      const applicationId = await this.applicationModel.create(data);
      const application = await this.applicationModel.findById(applicationId);

      if (!application) {
        return {
          success: false,
          error: 'Failed to retrieve created application'
        };
      }

      return {
        success: true,
        application: this.mapToInfo(application)
      };
    } catch (error: any) {
      console.error('[DeveloperService] Error creating application:', error);
      return {
        success: false,
        error: error.message || 'Failed to create application'
      };
    }
  }

  /**
   * Get application by ID
   */
  async getApplicationById(id: string): Promise<ApplicationInfo | null> {
    try {
      const application = await this.applicationModel.findById(id);
      return application ? this.mapToInfo(application) : null;
    } catch (error) {
      console.error('[DeveloperService] Error getting application:', error);
      return null;
    }
  }

  /**
   * Get application by user ID
   */
  async getApplicationByUserId(userId: string): Promise<ApplicationInfo | null> {
    try {
      const application = await this.applicationModel.findByUserId(userId);
      return application ? this.mapToInfo(application) : null;
    } catch (error) {
      console.error('[DeveloperService] Error getting application by user:', error);
      return null;
    }
  }

  /**
   * Get applications by status
   */
  async getApplicationsByStatus(status: 'pending' | 'approved' | 'rejected', limit: number = 50, offset: number = 0): Promise<ApplicationInfo[]> {
    try {
      const applications = await this.applicationModel.findByStatus(status, limit, offset);
      return applications.map(app => this.mapToInfo(app));
    } catch (error) {
      console.error('[DeveloperService] Error getting applications by status:', error);
      return [];
    }
  }

  /**
   * Approve application (admin only)
   */
  async approveApplication(applicationId: string, reviewedBy: string): Promise<boolean> {
    try {
      await this.applicationModel.updateStatus(applicationId, 'approved', reviewedBy);
      return true;
    } catch (error) {
      console.error('[DeveloperService] Error approving application:', error);
      return false;
    }
  }

  /**
   * Reject application (admin only)
   */
  async rejectApplication(applicationId: string, reviewedBy: string): Promise<boolean> {
    try {
      await this.applicationModel.updateStatus(applicationId, 'rejected', reviewedBy);
      return true;
    } catch (error) {
      console.error('[DeveloperService] Error rejecting application:', error);
      return false;
    }
  }

  /**
   * Check if user is approved developer
   */
  async isApprovedDeveloper(userId: string): Promise<boolean> {
    try {
      const application = await this.applicationModel.findByUserId(userId);
      return application?.status === 'approved';
    } catch (error) {
      console.error('[DeveloperService] Error checking developer status:', error);
      return false;
    }
  }

  /**
   * Map DeveloperApplicationRow to ApplicationInfo
   */
  private mapToInfo(application: any): ApplicationInfo {
    return {
      id: application.id,
      user_id: application.user_id,
      status: application.status,
      application_data: application.application_data,
      reviewed_by: application.reviewed_by,
      reviewed_at: application.reviewed_at,
      created_at: application.created_at,
      updated_at: application.updated_at,
    };
  }
}

