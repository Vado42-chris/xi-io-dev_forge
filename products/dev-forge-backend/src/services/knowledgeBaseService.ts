/**
 * Knowledge Base Service
 * 
 * Handles knowledge base articles for support.
 */

import { query } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  views: number;
  helpful: number;
  notHelpful: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface ArticleSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  limit?: number;
  offset?: number;
}

export class KnowledgeBaseService {
  /**
   * Create a new article
   */
  async createArticle(
    authorId: string,
    title: string,
    content: string,
    category: string,
    tags: string[] = [],
    published: boolean = false
  ): Promise<KnowledgeBaseArticle> {
    try {
      const articleId = uuidv4();

      await query(
        `INSERT INTO knowledge_base (id, title, content, category, tags, author_id, published, created_at, updated_at, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8)`,
        [
          articleId,
          title,
          content,
          category,
          JSON.stringify(tags),
          authorId,
          published,
          published ? new Date() : null,
        ]
      );

      logger.info('Knowledge base article created:', { articleId, authorId, title });

      return await this.getArticleById(articleId);
    } catch (error: any) {
      logger.error('Article creation failed:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   */
  async getArticleById(articleId: string): Promise<KnowledgeBaseArticle> {
    try {
      const result = await query(
        `SELECT id, title, content, category, tags, author_id, views, helpful, not_helpful, published, created_at, updated_at, published_at
         FROM knowledge_base
         WHERE id = $1`,
        [articleId]
      );

      if (result.rows.length === 0) {
        throw new Error('Article not found');
      }

      // Increment views
      await query(
        `UPDATE knowledge_base SET views = views + 1 WHERE id = $1`,
        [articleId]
      );

      return this.mapRowToArticle(result.rows[0]);
    } catch (error: any) {
      logger.error('Get article failed:', error);
      throw error;
    }
  }

  /**
   * Search articles
   */
  async searchArticles(params: ArticleSearchParams): Promise<{ articles: KnowledgeBaseArticle[]; total: number }> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.published !== undefined) {
        conditions.push(`published = $${paramIndex}`);
        values.push(params.published);
        paramIndex++;
      } else {
        // Default to published only for public searches
        conditions.push(`published = true`);
      }

      if (params.query) {
        conditions.push(`(title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
        values.push(`%${params.query}%`);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`category = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.tags && params.tags.length > 0) {
        conditions.push(`tags @> $${paramIndex}`);
        values.push(JSON.stringify(params.tags));
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM knowledge_base ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].total);

      // Get articles
      const result = await query(
        `SELECT id, title, content, category, tags, author_id, views, helpful, not_helpful, published, created_at, updated_at, published_at
         FROM knowledge_base
         ${whereClause}
         ORDER BY views DESC, created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      const articles = result.rows.map(row => this.mapRowToArticle(row));

      return { articles, total };
    } catch (error: any) {
      logger.error('Search articles failed:', error);
      throw error;
    }
  }

  /**
   * Update article helpfulness
   */
  async markHelpful(articleId: string, helpful: boolean): Promise<void> {
    try {
      if (helpful) {
        await query(
          `UPDATE knowledge_base SET helpful = helpful + 1 WHERE id = $1`,
          [articleId]
        );
      } else {
        await query(
          `UPDATE knowledge_base SET not_helpful = not_helpful + 1 WHERE id = $1`,
          [articleId]
        );
      }

      logger.debug('Article helpfulness updated:', { articleId, helpful });
    } catch (error: any) {
      logger.error('Mark helpful failed:', error);
      throw error;
    }
  }

  /**
   * Update article
   */
  async updateArticle(
    articleId: string,
    updates: Partial<Pick<KnowledgeBaseArticle, 'title' | 'content' | 'category' | 'tags' | 'published'>>
  ): Promise<KnowledgeBaseArticle> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        values.push(updates.title);
        paramIndex++;
      }

      if (updates.content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        values.push(updates.content);
        paramIndex++;
      }

      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramIndex}`);
        values.push(updates.category);
        paramIndex++;
      }

      if (updates.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        values.push(JSON.stringify(updates.tags));
        paramIndex++;
      }

      if (updates.published !== undefined) {
        updateFields.push(`published = $${paramIndex}`);
        values.push(updates.published);
        paramIndex++;
        if (updates.published) {
          updateFields.push(`published_at = NOW()`);
        }
      }

      updateFields.push(`updated_at = NOW()`);

      await query(
        `UPDATE knowledge_base SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        [...values, articleId]
      );

      logger.info('Article updated:', { articleId });

      return await this.getArticleById(articleId);
    } catch (error: any) {
      logger.error('Update article failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to KnowledgeBaseArticle object
   */
  private mapRowToArticle(row: any): KnowledgeBaseArticle {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      authorId: row.author_id,
      views: parseInt(row.views || 0),
      helpful: parseInt(row.helpful || 0),
      notHelpful: parseInt(row.not_helpful || 0),
      published: row.published,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at ? new Date(row.published_at) : undefined,
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();

