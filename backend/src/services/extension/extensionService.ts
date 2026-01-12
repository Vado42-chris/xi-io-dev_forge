/**
 * Extension Service
 * 
 * Handles extension marketplace operations.
 */

import { ExtensionModel, CreateExtensionData } from '../../database/models/extensionModel';

export interface ExtensionInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  author_id: string;
  category?: string;
  tags?: string[];
  price: number;
  is_free: boolean;
  download_count: number;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: Date;
  updated_at: Date;
}

export interface CreateExtensionResult {
  success: boolean;
  extension?: ExtensionInfo;
  error?: string;
}

export class ExtensionService {
  private extensionModel: ExtensionModel;

  constructor() {
    this.extensionModel = new ExtensionModel();
  }

  /**
   * Create a new extension
   */
  async createExtension(data: CreateExtensionData): Promise<CreateExtensionResult> {
    try {
      // Check if slug already exists
      const existing = await this.extensionModel.findBySlug(data.slug || '');
      if (existing) {
        return {
          success: false,
          error: 'Extension with this slug already exists'
        };
      }

      // Create extension
      const extensionId = await this.extensionModel.create(data);

      // Get created extension
      const extension = await this.extensionModel.findById(extensionId);
      if (!extension) {
        return {
          success: false,
          error: 'Failed to retrieve created extension'
        };
      }

      return {
        success: true,
        extension: this.mapToInfo(extension)
      };
    } catch (error: any) {
      console.error('[ExtensionService] Error creating extension:', error);
      return {
        success: false,
        error: error.message || 'Failed to create extension'
      };
    }
  }

  /**
   * Get extension by ID
   */
  async getExtensionById(id: string): Promise<ExtensionInfo | null> {
    try {
      const extension = await this.extensionModel.findById(id);
      return extension ? this.mapToInfo(extension) : null;
    } catch (error) {
      console.error('[ExtensionService] Error getting extension:', error);
      return null;
    }
  }

  /**
   * Get extension by slug
   */
  async getExtensionBySlug(slug: string): Promise<ExtensionInfo | null> {
    try {
      const extension = await this.extensionModel.findBySlug(slug);
      return extension ? this.mapToInfo(extension) : null;
    } catch (error) {
      console.error('[ExtensionService] Error getting extension by slug:', error);
      return null;
    }
  }

  /**
   * Get extensions by author
   */
  async getExtensionsByAuthor(authorId: string): Promise<ExtensionInfo[]> {
    try {
      const extensions = await this.extensionModel.findByAuthor(authorId);
      return extensions.map(ext => this.mapToInfo(ext));
    } catch (error) {
      console.error('[ExtensionService] Error getting extensions by author:', error);
      return [];
    }
  }

  /**
   * Get approved extensions
   */
  async getApprovedExtensions(limit: number = 50, offset: number = 0): Promise<ExtensionInfo[]> {
    try {
      const extensions = await this.extensionModel.findByStatus('approved', limit, offset);
      return extensions.map(ext => this.mapToInfo(ext));
    } catch (error) {
      console.error('[ExtensionService] Error getting approved extensions:', error);
      return [];
    }
  }

  /**
   * Get popular extensions
   */
  async getPopularExtensions(limit: number = 20): Promise<ExtensionInfo[]> {
    try {
      const extensions = await this.extensionModel.getPopular(limit);
      return extensions.map(ext => this.mapToInfo(ext));
    } catch (error) {
      console.error('[ExtensionService] Error getting popular extensions:', error);
      return [];
    }
  }

  /**
   * Search extensions
   */
  async searchExtensions(query: string, limit: number = 50, offset: number = 0): Promise<ExtensionInfo[]> {
    try {
      const extensions = await this.extensionModel.search(query, limit, offset);
      return extensions.map(ext => this.mapToInfo(ext));
    } catch (error) {
      console.error('[ExtensionService] Error searching extensions:', error);
      return [];
    }
  }

  /**
   * Approve extension (admin only)
   */
  async approveExtension(extensionId: string): Promise<boolean> {
    try {
      await this.extensionModel.updateStatus(extensionId, 'approved');
      return true;
    } catch (error) {
      console.error('[ExtensionService] Error approving extension:', error);
      return false;
    }
  }

  /**
   * Reject extension (admin only)
   */
  async rejectExtension(extensionId: string): Promise<boolean> {
    try {
      await this.extensionModel.updateStatus(extensionId, 'rejected');
      return true;
    } catch (error) {
      console.error('[ExtensionService] Error rejecting extension:', error);
      return false;
    }
  }

  /**
   * Record extension download
   */
  async recordDownload(extensionId: string): Promise<void> {
    try {
      await this.extensionModel.incrementDownloadCount(extensionId);
    } catch (error) {
      console.error('[ExtensionService] Error recording download:', error);
    }
  }

  /**
   * Map ExtensionRow to ExtensionInfo
   */
  private mapToInfo(extension: any): ExtensionInfo {
    return {
      id: extension.id,
      name: extension.name,
      slug: extension.slug,
      description: extension.description,
      version: extension.version,
      author_id: extension.author_id,
      category: extension.category,
      tags: extension.tags,
      price: extension.price,
      is_free: extension.is_free,
      download_count: extension.download_count,
      rating: extension.rating,
      status: extension.status,
      created_at: extension.created_at,
      updated_at: extension.updated_at,
    };
  }
}

