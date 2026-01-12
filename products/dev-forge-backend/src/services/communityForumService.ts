/**
 * Community Forum Service
 * 
 * Community forum management and automation.
 */

import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'published' | 'draft' | 'archived' | 'locked';
  views: number;
  upvotes: number;
  downvotes: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastReplyAt?: Date;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  upvotes: number;
  downvotes: number;
  isSolution: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostParams {
  title: string;
  content: string;
  category: string;
  tags?: string[];
}

export interface CreateReplyParams {
  content: string;
}

export const communityForumService = {
  /**
   * Create forum post
   */
  async createPost(
    authorId: string,
    params: CreatePostParams
  ): Promise<ForumPost> {
    const id = uuidv4();

    try {
      const result = await pool.query(
        `INSERT INTO forum_posts 
         (id, author_id, title, content, category, tags, status, views, upvotes, downvotes, reply_count, is_pinned, is_locked, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()) RETURNING *`,
        [id, authorId, params.title, params.content, params.category, params.tags || [], 'published', 0, 0, 0, 0, false, false]
      );

      const post = this.mapRowToPost(result.rows[0]);
      logger.info(`Forum post created: ${params.title} by ${authorId}`);

      return post;
    } catch (error: any) {
      logger.error('Error creating forum post:', error);
      throw new Error(`Failed to create forum post: ${error.message}`);
    }
  },

  /**
   * Get forum post
   */
  async getPost(id: string, incrementViews: boolean = false): Promise<ForumPost | undefined> {
    try {
      const result = await pool.query(`SELECT * FROM forum_posts WHERE id = $1`, [id]);
      
      if (result.rows.length > 0) {
        if (incrementViews) {
          await pool.query(`UPDATE forum_posts SET views = views + 1 WHERE id = $1`, [id]);
          result.rows[0].views++;
        }
        return this.mapRowToPost(result.rows[0]);
      }
      return undefined;
    } catch (error: any) {
      logger.error(`Error getting forum post ${id}:`, error);
      throw new Error(`Failed to get forum post: ${error.message}`);
    }
  },

  /**
   * Get all forum posts
   */
  async getPosts(
    category?: string,
    search?: string,
    sortBy: 'newest' | 'popular' | 'trending' = 'newest',
    limit: number = 20,
    offset: number = 0
  ): Promise<ForumPost[]> {
    let query = `SELECT * FROM forum_posts WHERE status = 'published'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Sorting
    switch (sortBy) {
      case 'popular':
        query += ` ORDER BY upvotes DESC, reply_count DESC`;
        break;
      case 'trending':
        query += ` ORDER BY (upvotes - downvotes) DESC, last_reply_at DESC NULLS LAST`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY created_at DESC`;
        break;
    }

    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows.map(row => this.mapRowToPost(row));
    } catch (error: any) {
      logger.error('Error getting forum posts:', error);
      throw new Error(`Failed to get forum posts: ${error.message}`);
    }
  },

  /**
   * Create reply to post
   */
  async createReply(
    postId: string,
    authorId: string,
    params: CreateReplyParams
  ): Promise<ForumReply> {
    const id = uuidv4();

    try {
      // Create reply
      const result = await pool.query(
        `INSERT INTO forum_replies 
         (id, post_id, author_id, content, upvotes, downvotes, is_solution, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
        [id, postId, authorId, params.content, 0, 0, false]
      );

      // Update post reply count and last reply time
      await pool.query(
        `UPDATE forum_posts 
         SET reply_count = reply_count + 1, last_reply_at = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [postId]
      );

      const reply = this.mapRowToReply(result.rows[0]);
      logger.info(`Forum reply created: ${id} for post ${postId}`);

      return reply;
    } catch (error: any) {
      logger.error('Error creating forum reply:', error);
      throw new Error(`Failed to create forum reply: ${error.message}`);
    }
  },

  /**
   * Get replies for post
   */
  async getReplies(postId: string, limit: number = 50, offset: number = 0): Promise<ForumReply[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM forum_replies 
         WHERE post_id = $1 
         ORDER BY is_solution DESC, upvotes DESC, created_at ASC 
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
      );
      return result.rows.map(row => this.mapRowToReply(row));
    } catch (error: any) {
      logger.error(`Error getting replies for post ${postId}:`, error);
      throw new Error(`Failed to get forum replies: ${error.message}`);
    }
  },

  /**
   * Mark reply as solution
   */
  async markAsSolution(replyId: string, postId: string): Promise<void> {
    try {
      // Unmark any existing solutions
      await pool.query(
        `UPDATE forum_replies SET is_solution = false WHERE post_id = $1`,
        [postId]
      );

      // Mark this reply as solution
      await pool.query(
        `UPDATE forum_replies SET is_solution = true WHERE id = $1`,
        [replyId]
      );

      logger.info(`Reply ${replyId} marked as solution for post ${postId}`);
    } catch (error: any) {
      logger.error(`Error marking reply as solution:`, error);
      throw new Error(`Failed to mark reply as solution: ${error.message}`);
    }
  },

  /**
   * Vote on post
   */
  async voteOnPost(postId: string, userId: string, upvote: boolean): Promise<void> {
    try {
      // Check if user already voted
      const existing = await pool.query(
        `SELECT * FROM forum_post_votes WHERE post_id = $1 AND user_id = $2`,
        [postId, userId]
      );

      if (existing.rows.length > 0) {
        // Update existing vote
        await pool.query(
          `UPDATE forum_post_votes SET upvote = $1 WHERE post_id = $2 AND user_id = $3`,
          [upvote, postId, userId]
        );
      } else {
        // Create new vote
        await pool.query(
          `INSERT INTO forum_post_votes (post_id, user_id, upvote) VALUES ($1, $2, $3)`,
          [postId, userId, upvote]
        );
      }

      // Update post vote counts
      const voteCounts = await pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE upvote = true) as upvotes,
          COUNT(*) FILTER (WHERE upvote = false) as downvotes
         FROM forum_post_votes WHERE post_id = $1`,
        [postId]
      );

      await pool.query(
        `UPDATE forum_posts SET upvotes = $1, downvotes = $2 WHERE id = $3`,
        [voteCounts.rows[0].upvotes, voteCounts.rows[0].downvotes, postId]
      );
    } catch (error: any) {
      logger.error(`Error voting on post:`, error);
      throw new Error(`Failed to vote on post: ${error.message}`);
    }
  },

  /**
   * Map database row to ForumPost
   */
  private mapRowToPost(row: any): ForumPost {
    return {
      id: row.id,
      authorId: row.author_id,
      title: row.title,
      content: row.content,
      category: row.category,
      tags: row.tags,
      status: row.status,
      views: row.views,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      replyCount: row.reply_count,
      isPinned: row.is_pinned,
      isLocked: row.is_locked,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastReplyAt: row.last_reply_at ? new Date(row.last_reply_at) : undefined,
    };
  },

  /**
   * Map database row to ForumReply
   */
  private mapRowToReply(row: any): ForumReply {
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      content: row.content,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      isSolution: row.is_solution,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  },
};

