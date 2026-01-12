/**
 * Extension Service
 * 
 * Handles extension marketplace operations: submission, storage, search, ratings, reviews.
 */

import { query } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  authorId: string;
  category: 'extension' | 'theme' | 'plugin' | 'template';
  price: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  downloadCount: number;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metadata?: Record<string, any>;
}

export interface ExtensionSubmission {
  name: string;
  description: string;
  version: string;
  category: Extension['category'];
  price: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface ExtensionSearchParams {
  query?: string;
  category?: Extension['category'];
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'popular' | 'newest' | 'rating' | 'price';
  limit?: number;
  offset?: number;
}

export class ExtensionService {
  /**
   * Submit a new extension
   */
  async submitExtension(
    authorId: string,
    submission: ExtensionSubmission
  ): Promise<Extension> {
    try {
      const extensionId = uuidv4();

      await query(
        `INSERT INTO extensions (id, name, description, version, author_id, category, price, currency, status, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          extensionId,
          submission.name,
          submission.description,
          submission.version,
          authorId,
          submission.category,
          submission.price,
          submission.currency || 'usd',
          'pending',
          submission.metadata ? JSON.stringify(submission.metadata) : null,
        ]
      );

      logger.info('Extension submitted:', { extensionId, authorId, name: submission.name });

      return await this.getExtensionById(extensionId);
    } catch (error: any) {
      logger.error('Extension submission failed:', error);
      throw error;
    }
  }

  /**
   * Get extension by ID
   */
  async getExtensionById(extensionId: string): Promise<Extension> {
    try {
      const result = await query(
        `SELECT e.*, 
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(r.id) as review_count
         FROM extensions e
         LEFT JOIN extension_reviews r ON e.id = r.extension_id
         WHERE e.id = $1
         GROUP BY e.id`,
        [extensionId]
      );

      if (result.rows.length === 0) {
        throw new Error('Extension not found');
      }

      return this.mapRowToExtension(result.rows[0]);
    } catch (error: any) {
      logger.error('Get extension failed:', error);
      throw error;
    }
  }

  /**
   * Search extensions
   */
  async searchExtensions(params: ExtensionSearchParams): Promise<{ extensions: Extension[]; total: number }> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Only show approved extensions
      conditions.push(`e.status = 'approved'`);

      if (params.query) {
        conditions.push(`(e.name ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
        values.push(`%${params.query}%`);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`e.category = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.minRating !== undefined) {
        conditions.push(`COALESCE(AVG(r.rating), 0) >= $${paramIndex}`);
        values.push(params.minRating);
        paramIndex++;
      }

      if (params.minPrice !== undefined) {
        conditions.push(`e.price >= $${paramIndex}`);
        values.push(params.minPrice);
        paramIndex++;
      }

      if (params.maxPrice !== undefined) {
        conditions.push(`e.price <= $${paramIndex}`);
        values.push(params.maxPrice);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Determine sort order
      let orderBy = 'e.created_at DESC';
      if (params.sortBy === 'popular') {
        orderBy = 'e.download_count DESC';
      } else if (params.sortBy === 'rating') {
        orderBy = 'rating DESC';
      } else if (params.sortBy === 'price') {
        orderBy = 'e.price ASC';
      } else if (params.sortBy === 'newest') {
        orderBy = 'e.created_at DESC';
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(DISTINCT e.id) as total
         FROM extensions e
         LEFT JOIN extension_reviews r ON e.id = r.extension_id
         ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].total);

      // Get extensions
      const result = await query(
        `SELECT e.*,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(r.id) as review_count
         FROM extensions e
         LEFT JOIN extension_reviews r ON e.id = r.extension_id
         ${whereClause}
         GROUP BY e.id
         ORDER BY ${orderBy}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      const extensions = result.rows.map(row => this.mapRowToExtension(row));

      return { extensions, total };
    } catch (error: any) {
      logger.error('Search extensions failed:', error);
      throw error;
    }
  }

  /**
   * Get extensions by author
   */
  async getExtensionsByAuthor(authorId: string): Promise<Extension[]> {
    try {
      const result = await query(
        `SELECT e.*,
                COALESCE(AVG(r.rating), 0) as rating,
                COUNT(r.id) as review_count
         FROM extensions e
         LEFT JOIN extension_reviews r ON e.id = r.extension_id
         WHERE e.author_id = $1
         GROUP BY e.id
         ORDER BY e.created_at DESC`,
        [authorId]
      );

      return result.rows.map(row => this.mapRowToExtension(row));
    } catch (error: any) {
      logger.error('Get extensions by author failed:', error);
      throw error;
    }
  }

  /**
   * Approve an extension (admin only)
   */
  async approveExtension(extensionId: string): Promise<Extension> {
    try {
      await query(
        `UPDATE extensions SET status = 'approved', published_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [extensionId]
      );

      logger.info('Extension approved:', { extensionId });

      return await this.getExtensionById(extensionId);
    } catch (error: any) {
      logger.error('Extension approval failed:', error);
      throw error;
    }
  }

  /**
   * Reject an extension (admin only)
   */
  async rejectExtension(extensionId: string, reason?: string): Promise<Extension> {
    try {
      await query(
        `UPDATE extensions SET status = 'rejected', updated_at = NOW()
         WHERE id = $1`,
        [extensionId]
      );

      logger.info('Extension rejected:', { extensionId, reason });

      return await this.getExtensionById(extensionId);
    } catch (error: any) {
      logger.error('Extension rejection failed:', error);
      throw error;
    }
  }

  /**
   * Suspend an extension (admin only)
   */
  async suspendExtension(extensionId: string, reason?: string): Promise<Extension> {
    try {
      await query(
        `UPDATE extensions SET status = 'suspended', updated_at = NOW()
         WHERE id = $1`,
        [extensionId]
      );

      logger.info('Extension suspended:', { extensionId, reason });

      return await this.getExtensionById(extensionId);
    } catch (error: any) {
      logger.error('Extension suspension failed:', error);
      throw error;
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(extensionId: string): Promise<void> {
    try {
      await query(
        `UPDATE extensions SET download_count = download_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [extensionId]
      );

      logger.debug('Download count incremented:', { extensionId });
    } catch (error: any) {
      logger.error('Increment download count failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to Extension object
   */
  private mapRowToExtension(row: any): Extension {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      authorId: row.author_id,
      category: row.category,
      price: parseFloat(row.price),
      currency: row.currency,
      status: row.status,
      downloadCount: parseInt(row.download_count || 0),
      rating: parseFloat(row.rating || 0),
      reviewCount: parseInt(row.review_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}

export const extensionService = new ExtensionService();

