/**
 * Extension Service
 * 
 * Handles extension marketplace operations.
 */

import { apiService } from './api';

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  download_url: string;
  icon_url: string | null;
  category: string;
  tags: string[];
  downloads_count: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  developer_id: string;
}

export interface ExtensionsResponse {
  extensions: Extension[];
  total: number;
}

export class ExtensionService {
  /**
   * Get all extensions
   */
  async getExtensions(params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExtensionsResponse> {
    const response = await apiService.getClient().get<ExtensionsResponse>('/extensions', {
      params,
    });
    return response.data;
  }

  /**
   * Get extension by ID
   */
  async getExtension(id: string): Promise<Extension> {
    const response = await apiService.getClient().get<Extension>(`/extensions/${id}`);
    return response.data;
  }

  /**
   * Install extension
   */
  async installExtension(id: string): Promise<void> {
    await apiService.getClient().post(`/extensions/${id}/install`);
  }

  /**
   * Uninstall extension
   */
  async uninstallExtension(id: string): Promise<void> {
    await apiService.getClient().post(`/extensions/${id}/uninstall`);
  }
}

export const extensionService = new ExtensionService();

