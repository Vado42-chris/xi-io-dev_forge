/**
 * License Service
 * 
 * Service for license management and validation.
 */

import { ApiClient, ApiResponse } from './apiClient';

export interface License {
  id: string;
  userId: string;
  productId: string;
  licenseKey: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked';
  issuedAt: string;
  expiresAt: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseParams {
  productId: string;
  durationDays?: number;
  metadata?: Record<string, any>;
}

export interface ValidateLicenseResponse {
  valid: boolean;
  license?: License;
  message: string;
}

export class LicenseService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Create a new license (Admin only)
   */
  async createLicense(params: CreateLicenseParams): Promise<ApiResponse<License>> {
    return this.apiClient.post<License>('/api/licenses', params);
  }

  /**
   * Get license by ID or key
   */
  async getLicense(identifier: string): Promise<ApiResponse<License>> {
    return this.apiClient.get<License>(`/api/licenses/${identifier}`);
  }

  /**
   * Get user licenses
   */
  async getUserLicenses(userId?: string): Promise<ApiResponse<License[]>> {
    const url = userId ? `/api/licenses/user/${userId}` : '/api/licenses/user/me';
    return this.apiClient.get<License[]>(url);
  }

  /**
   * Validate license key
   */
  async validateLicense(licenseKey: string): Promise<ApiResponse<ValidateLicenseResponse>> {
    return this.apiClient.post<ValidateLicenseResponse>('/api/licenses/validate', { licenseKey });
  }

  /**
   * Renew license
   */
  async renewLicense(licenseId: string, durationDays: number): Promise<ApiResponse<License>> {
    return this.apiClient.post<License>(`/api/licenses/${licenseId}/renew`, { durationDays });
  }
}

