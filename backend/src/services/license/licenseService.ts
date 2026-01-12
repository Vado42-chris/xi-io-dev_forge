/**
 * License Service
 * 
 * Handles license management, validation, and tier upgrades.
 */

import { LicenseModel, CreateLicenseData } from '../../database/models/licenseModel';
import { UserModel } from '../../database/models/userModel';

export interface LicenseInfo {
  id: string;
  license_key: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  expires_at?: Date;
  purchased_at: Date;
}

export interface ValidateLicenseResult {
  valid: boolean;
  license?: LicenseInfo;
  error?: string;
}

export interface CreateLicenseResult {
  success: boolean;
  license?: LicenseInfo;
  error?: string;
}

export class LicenseService {
  private licenseModel: LicenseModel;
  private userModel: UserModel;

  constructor() {
    this.licenseModel = new LicenseModel();
    this.userModel = new UserModel();
  }

  /**
   * Create a new license for a user
   */
  async createLicense(userId: string, tier: 'free' | 'pro' | 'enterprise', expiresAt?: Date): Promise<CreateLicenseResult> {
    try {
      // Verify user exists
      const user = await this.userModel.findById(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Create license
      const licenseId = await this.licenseModel.create({
        user_id: userId,
        tier,
        expires_at: expiresAt,
      });

      // Get created license
      const license = await this.licenseModel.findByKey(
        (await this.licenseModel.findByUserId(userId))?.license_key || ''
      );

      if (!license) {
        return {
          success: false,
          error: 'Failed to retrieve created license'
        };
      }

      return {
        success: true,
        license: {
          id: license.id,
          license_key: license.license_key,
          tier: license.tier,
          status: license.status,
          expires_at: license.expires_at,
          purchased_at: license.purchased_at,
        }
      };
    } catch (error: any) {
      console.error('[LicenseService] Error creating license:', error);
      return {
        success: false,
        error: error.message || 'Failed to create license'
      };
    }
  }

  /**
   * Get user's active license
   */
  async getUserLicense(userId: string): Promise<LicenseInfo | null> {
    try {
      const license = await this.licenseModel.findByUserId(userId);
      if (!license) {
        return null;
      }

      return {
        id: license.id,
        license_key: license.license_key,
        tier: license.tier,
        status: license.status,
        expires_at: license.expires_at,
        purchased_at: license.purchased_at,
      };
    } catch (error) {
      console.error('[LicenseService] Error getting user license:', error);
      return null;
    }
  }

  /**
   * Validate a license key
   */
  async validateLicense(licenseKey: string): Promise<ValidateLicenseResult> {
    try {
      const isValid = await this.licenseModel.isValid(licenseKey);
      if (!isValid) {
        return {
          valid: false,
          error: 'License is invalid, expired, or revoked'
        };
      }

      const license = await this.licenseModel.findByKey(licenseKey);
      if (!license) {
        return {
          valid: false,
          error: 'License not found'
        };
      }

      return {
        valid: true,
        license: {
          id: license.id,
          license_key: license.license_key,
          tier: license.tier,
          status: license.status,
          expires_at: license.expires_at,
          purchased_at: license.purchased_at,
        }
      };
    } catch (error: any) {
      console.error('[LicenseService] Error validating license:', error);
      return {
        valid: false,
        error: error.message || 'License validation failed'
      };
    }
  }

  /**
   * Upgrade user license tier
   */
  async upgradeLicense(userId: string, newTier: 'pro' | 'enterprise', expiresAt?: Date): Promise<CreateLicenseResult> {
    try {
      // Get current license
      const currentLicense = await this.licenseModel.findByUserId(userId);
      
      // Revoke old license if exists
      if (currentLicense && currentLicense.status === 'active') {
        await this.licenseModel.updateStatus(currentLicense.id, 'revoked');
      }

      // Create new license with upgraded tier
      return await this.createLicense(userId, newTier, expiresAt);
    } catch (error: any) {
      console.error('[LicenseService] Error upgrading license:', error);
      return {
        success: false,
        error: error.message || 'License upgrade failed'
      };
    }
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseKey: string): Promise<boolean> {
    try {
      const license = await this.licenseModel.findByKey(licenseKey);
      if (!license) {
        return false;
      }

      await this.licenseModel.updateStatus(license.id, 'revoked');
      return true;
    } catch (error) {
      console.error('[LicenseService] Error revoking license:', error);
      return false;
    }
  }
}

