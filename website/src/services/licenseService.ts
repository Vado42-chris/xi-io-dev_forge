/**
 * License Service
 * 
 * Handles license management operations.
 */

import { apiService } from './api';

export interface License {
  id: string;
  license_key: string;
  product_id: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'revoked';
  issued_at: string;
  expires_at: string | null;
}

export interface LicenseResponse {
  license: License;
}

export class LicenseService {
  /**
   * Get user's license
   */
  async getLicense(): Promise<License> {
    const response = await apiService.getClient().get<LicenseResponse>('/licenses/me');
    return response.data.license;
  }

  /**
   * Activate license
   */
  async activateLicense(licenseKey: string): Promise<License> {
    const response = await apiService.getClient().post<LicenseResponse>('/licenses/activate', {
      license_key: licenseKey,
    });
    return response.data.license;
  }

  /**
   * Check license status
   */
  async checkLicenseStatus(): Promise<{ valid: boolean; license?: License }> {
    try {
      const license = await this.getLicense();
      return { valid: license.status === 'active', license };
    } catch {
      return { valid: false };
    }
  }
}

export const licenseService = new LicenseService();

