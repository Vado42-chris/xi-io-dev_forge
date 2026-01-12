/**
 * Extension Review Service
 * 
 * Handles extension ratings and reviews.
 */

import { query } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ExtensionReview {
  id: string;
  extensionId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewSubmission {
  extensionId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export class ExtensionReviewService {
  /**
   * Submit a review
   */
  async submitReview(userId: string, submission: ReviewSubmission): Promise<ExtensionReview> {
    try {
      // Check if user already reviewed this extension
      const existing = await query(
        'SELECT id FROM extension_reviews WHERE extension_id = $1 AND user_id = $2',
        [submission.extensionId, userId]
      );

      if (existing.rows.length > 0) {
        // Update existing review
        const reviewId = existing.rows[0].id;
        await query(
          `UPDATE extension_reviews 
           SET rating = $1, title = $2, comment = $3, updated_at = NOW()
           WHERE id = $4`,
          [submission.rating, submission.title || null, submission.comment || null, reviewId]
        );

        logger.info('Review updated:', { reviewId, extensionId: submission.extensionId });
        return await this.getReviewById(reviewId);
      }

      // Create new review
      const reviewId = uuidv4();
      await query(
        `INSERT INTO extension_reviews (id, extension_id, user_id, rating, title, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          reviewId,
          submission.extensionId,
          userId,
          submission.rating,
          submission.title || null,
          submission.comment || null,
        ]
      );

      logger.info('Review submitted:', { reviewId, extensionId: submission.extensionId });

      return await this.getReviewById(reviewId);
    } catch (error: any) {
      logger.error('Review submission failed:', error);
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<ExtensionReview> {
    try {
      const result = await query(
        `SELECT id, extension_id, user_id, rating, title, comment, created_at, updated_at
         FROM extension_reviews
         WHERE id = $1`,
        [reviewId]
      );

      if (result.rows.length === 0) {
        throw new Error('Review not found');
      }

      return this.mapRowToReview(result.rows[0]);
    } catch (error: any) {
      logger.error('Get review failed:', error);
      throw error;
    }
  }

  /**
   * Get reviews for an extension
   */
  async getExtensionReviews(extensionId: string, limit: number = 50, offset: number = 0): Promise<{ reviews: ExtensionReview[]; total: number }> {
    try {
      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) as total FROM extension_reviews WHERE extension_id = $1',
        [extensionId]
      );
      const total = parseInt(countResult.rows[0].total);

      // Get reviews
      const result = await query(
        `SELECT id, extension_id, user_id, rating, title, comment, created_at, updated_at
         FROM extension_reviews
         WHERE extension_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [extensionId, limit, offset]
      );

      const reviews = result.rows.map(row => this.mapRowToReview(row));

      return { reviews, total };
    } catch (error: any) {
      logger.error('Get extension reviews failed:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const result = await query(
        'SELECT user_id FROM extension_reviews WHERE id = $1',
        [reviewId]
      );

      if (result.rows.length === 0) {
        throw new Error('Review not found');
      }

      if (result.rows[0].user_id !== userId) {
        throw new Error('Not authorized to delete this review');
      }

      await query('DELETE FROM extension_reviews WHERE id = $1', [reviewId]);

      logger.info('Review deleted:', { reviewId });
    } catch (error: any) {
      logger.error('Delete review failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to ExtensionReview object
   */
  private mapRowToReview(row: any): ExtensionReview {
    return {
      id: row.id,
      extensionId: row.extension_id,
      userId: row.user_id,
      rating: parseInt(row.rating),
      title: row.title,
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const extensionReviewService = new ExtensionReviewService();

