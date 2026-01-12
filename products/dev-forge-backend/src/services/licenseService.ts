/**
 * License Service
 * 
 * Handles license generation, validation, activation, renewal, and revocation.
 */

import { query } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface License {
  id: string;
  userId: string;
  licenseKey: string;
  type: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'revoked' | 'pending';
  createdAt: Date;
  expiresAt?: Date;
  activatedAt?: Date;
  revokedAt?: Date;
  metadata?: Record<string, any>;
}

export interface LicenseCreationParams {
  userId: string;
  type: License['type'];
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export class LicenseService {
  /**
   * Generate a unique license key
   */
  private generateLicenseKey(): string {
    const segments = [
      uuidv4().substring(0, 8).toUpperCase(),
      uuidv4().substring(0, 8).toUpperCase(),
      uuidv4().substring(0, 8).toUpperCase(),
      uuidv4().substring(0, 8).toUpperCase(),
    ];
    return segments.join('-');
  }

  /**
   * Create a new license
   */
  async createLicense(params: LicenseCreationParams): Promise<License> {
    try {
      const licenseKey = this.generateLicenseKey();
      const licenseId = uuidv4();

      await query(
        `INSERT INTO licenses (id, user_id, license_key, type, status, expires_at, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          licenseId,
          params.userId,
          licenseKey,
          params.type,
          'pending',
          params.expiresAt || null,
          params.metadata ? JSON.stringify(params.metadata) : null,
        ]
      );

      logger.info('License created:', { licenseId, userId: params.userId, type: params.type });

      return await this.getLicenseById(licenseId);
    } catch (error: any) {
      logger.error('License creation failed:', error);
      throw error;
    }
  }

  /**
   * Get license by ID
   */
  async getLicenseById(licenseId: string): Promise<License> {
    try {
      const result = await query(
        `SELECT id, user_id, license_key, type, status, created_at, expires_at, activated_at, revoked_at, metadata
         FROM licenses
         WHERE id = $1`,
        [licenseId]
      );

      if (result.rows.length === 0) {
        throw new Error('License not found');
      }

      return this.mapRowToLicense(result.rows[0]);
    } catch (error: any) {
      logger.error('Get license failed:', error);
      throw error;
    }
  }

  /**
   * Get license by key
   */
  async getLicenseByKey(licenseKey: string): Promise<License | null> {
    try {
      const result = await query(
        `SELECT id, user_id, license_key, type, status, created_at, expires_at, activated_at, revoked_at, metadata
         FROM licenses
         WHERE license_key = $1`,
        [licenseKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToLicense(result.rows[0]);
    } catch (error: any) {
      logger.error('Get license by key failed:', error);
      throw error;
    }
  }

  /**
   * Get licenses for a user
   */
  async getUserLicenses(userId: string): Promise<License[]> {
    try {
      const result = await query(
        `SELECT id, user_id, license_key, type, status, created_at, expires_at, activated_at, revoked_at, metadata
         FROM licenses
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map(row => this.mapRowToLicense(row));
    } catch (error: any) {
      logger.error('Get user licenses failed:', error);
      throw error;
    }
  }

  /**
   * Activate a license
   */
  async activateLicense(licenseKey: string, userId?: string): Promise<License> {
    try {
      const license = await this.getLicenseByKey(licenseKey);

      if (!license) {
        throw new Error('License not found');
      }

      if (license.status !== 'pending') {
        throw new Error(`License is not pending (current status: ${license.status})`);
      }

      if (userId && license.userId !== userId) {
        throw new Error('License does not belong to this user');
      }

      // Check if expired
      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        await query(
          `UPDATE licenses SET status = 'expired', updated_at = NOW()
           WHERE id = $1`,
          [license.id]
        );
        throw new Error('License has expired');
      }

      await query(
        `UPDATE licenses SET status = 'active', activated_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [license.id]
      );

      logger.info('License activated:', { licenseId: license.id, licenseKey });

      return await this.getLicenseById(license.id);
    } catch (error: any) {
      logger.error('License activation failed:', error);
      throw error;
    }
  }

  /**
   * Validate a license
   */
  async validateLicense(licenseKey: string): Promise<{ valid: boolean; license?: License; error?: string }> {
    try {
      const license = await this.getLicenseByKey(licenseKey);

      if (!license) {
        return { valid: false, error: 'License not found' };
      }

      if (license.status === 'revoked') {
        return { valid: false, error: 'License has been revoked' };
      }

      if (license.status === 'expired') {
        return { valid: false, error: 'License has expired' };
      }

      if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
        // Auto-expire
        await query(
          `UPDATE licenses SET status = 'expired', updated_at = NOW()
           WHERE id = $1`,
          [license.id]
        );
        return { valid: false, error: 'License has expired' };
      }

      if (license.status !== 'active') {
        return { valid: false, error: `License is not active (status: ${license.status})` };
      }

      return { valid: true, license };
    } catch (error: any) {
      logger.error('License validation failed:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Renew a license
   */
  async renewLicense(licenseId: string, newExpiresAt: Date): Promise<License> {
    try {
      const license = await this.getLicenseById(licenseId);

      if (license.status === 'revoked') {
        throw new Error('Cannot renew a revoked license');
      }

      await query(
        `UPDATE licenses SET expires_at = $1, status = 'active', updated_at = NOW()
         WHERE id = $2`,
        [newExpiresAt, licenseId]
      );

      logger.info('License renewed:', { licenseId, newExpiresAt });

      return await this.getLicenseById(licenseId);
    } catch (error: any) {
      logger.error('License renewal failed:', error);
      throw error;
    }
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseId: string, reason?: string): Promise<License> {
    try {
      await query(
        `UPDATE licenses SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [licenseId]
      );

      logger.info('License revoked:', { licenseId, reason });

      return await this.getLicenseById(licenseId);
    } catch (error: any) {
      logger.error('License revocation failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to License object
   */
  private mapRowToLicense(row: any): License {
    return {
      id: row.id,
      userId: row.user_id,
      licenseKey: row.license_key,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      activatedAt: row.activated_at ? new Date(row.activated_at) : undefined,
      revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}

export const licenseService = new LicenseService();

