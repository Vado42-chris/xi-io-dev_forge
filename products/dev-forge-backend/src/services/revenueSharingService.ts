/**
 * Revenue Sharing Service
 * 
 * Automated revenue sharing for extension developers and marketplace participants.
 */

import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const pool = getPool();

export interface RevenueShare {
  id: string;
  extensionId: string;
  developerId: string;
  transactionId: string;
  amount: number; // Total transaction amount in cents
  platformFee: number; // Platform fee percentage (e.g., 30 = 30%)
  developerShare: number; // Developer share in cents
  platformShare: number; // Platform share in cents
  status: 'pending' | 'processed' | 'paid' | 'failed';
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  processedAt?: Date;
  paidAt?: Date;
}

export interface RevenueShareConfig {
  extensionId: string;
  developerId: string;
  platformFeePercentage: number; // Default 30%
  minimumPayout: number; // Minimum amount before payout (in cents)
}

export interface PayoutSummary {
  developerId: string;
  totalEarnings: number;
  platformFees: number;
  netEarnings: number;
  pendingPayout: number;
  paidOut: number;
  period: {
    start: Date;
    end: Date;
  };
}

export const revenueSharingService = {
  /**
   * Calculate revenue share for a transaction
   */
  calculateRevenueShare(
    amount: number,
    platformFeePercentage: number = 30
  ): { developerShare: number; platformShare: number; platformFee: number } {
    const platformFee = Math.round(amount * (platformFeePercentage / 100));
    const developerShare = amount - platformFee;
    const platformShare = platformFee;

    return {
      developerShare,
      platformShare,
      platformFee: platformFeePercentage,
    };
  },

  /**
   * Record revenue share
   */
  async recordRevenueShare(
    extensionId: string,
    developerId: string,
    transactionId: string,
    amount: number,
    platformFeePercentage: number = 30,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RevenueShare> {
    const id = uuidv4();
    const { developerShare, platformShare, platformFee } = this.calculateRevenueShare(amount, platformFeePercentage);

    try {
      const result = await pool.query(
        `INSERT INTO revenue_shares 
         (id, extension_id, developer_id, transaction_id, amount, platform_fee, developer_share, platform_share, status, period_start, period_end, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
        [id, extensionId, developerId, transactionId, amount, platformFee, developerShare, platformShare, 'pending', periodStart, periodEnd]
      );

      const revenueShare = this.mapRowToRevenueShare(result.rows[0]);
      logger.info(`Revenue share recorded: ${id} for extension ${extensionId}`);

      return revenueShare;
    } catch (error: any) {
      logger.error('Error recording revenue share:', error);
      throw new Error(`Failed to record revenue share: ${error.message}`);
    }
  },

  /**
   * Get revenue shares for developer
   */
  async getDeveloperRevenueShares(
    developerId: string,
    status?: RevenueShare['status'],
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueShare[]> {
    let query = `SELECT * FROM revenue_shares WHERE developer_id = $1`;
    const params: any[] = [developerId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND period_start >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND period_end <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC`;

    try {
      const result = await pool.query(query, params);
      return result.rows.map(row => this.mapRowToRevenueShare(row));
    } catch (error: any) {
      logger.error(`Error getting revenue shares for developer ${developerId}:`, error);
      throw new Error(`Failed to get revenue shares: ${error.message}`);
    }
  },

  /**
   * Get payout summary for developer
   */
  async getPayoutSummary(
    developerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PayoutSummary> {
    try {
      const result = await pool.query(
        `SELECT 
          SUM(amount) as total_earnings,
          SUM(platform_share) as platform_fees,
          SUM(developer_share) as net_earnings,
          SUM(CASE WHEN status = 'pending' THEN developer_share ELSE 0 END) as pending_payout,
          SUM(CASE WHEN status = 'paid' THEN developer_share ELSE 0 END) as paid_out
         FROM revenue_shares
         WHERE developer_id = $1 AND period_start >= $2 AND period_end <= $3`,
        [developerId, startDate, endDate]
      );

      const row = result.rows[0];

      return {
        developerId,
        totalEarnings: parseInt(row.total_earnings || '0'),
        platformFees: parseInt(row.platform_fees || '0'),
        netEarnings: parseInt(row.net_earnings || '0'),
        pendingPayout: parseInt(row.pending_payout || '0'),
        paidOut: parseInt(row.paid_out || '0'),
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error: any) {
      logger.error(`Error getting payout summary for developer ${developerId}:`, error);
      throw new Error(`Failed to get payout summary: ${error.message}`);
    }
  },

  /**
   * Mark revenue share as processed
   */
  async markAsProcessed(revenueShareId: string): Promise<RevenueShare> {
    try {
      const result = await pool.query(
        `UPDATE revenue_shares 
         SET status = 'processed', processed_at = NOW() 
         WHERE id = $1 RETURNING *`,
        [revenueShareId]
      );

      if (result.rows.length === 0) {
        throw new Error('Revenue share not found');
      }

      logger.info(`Revenue share marked as processed: ${revenueShareId}`);
      return this.mapRowToRevenueShare(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error marking revenue share as processed:`, error);
      throw new Error(`Failed to mark as processed: ${error.message}`);
    }
  },

  /**
   * Mark revenue share as paid
   */
  async markAsPaid(revenueShareId: string): Promise<RevenueShare> {
    try {
      const result = await pool.query(
        `UPDATE revenue_shares 
         SET status = 'paid', paid_at = NOW() 
         WHERE id = $1 RETURNING *`,
        [revenueShareId]
      );

      if (result.rows.length === 0) {
        throw new Error('Revenue share not found');
      }

      logger.info(`Revenue share marked as paid: ${revenueShareId}`);
      return this.mapRowToRevenueShare(result.rows[0]);
    } catch (error: any) {
      logger.error(`Error marking revenue share as paid:`, error);
      throw new Error(`Failed to mark as paid: ${error.message}`);
    }
  },

  /**
   * Map database row to RevenueShare
   */
  private mapRowToRevenueShare(row: any): RevenueShare {
    return {
      id: row.id,
      extensionId: row.extension_id,
      developerId: row.developer_id,
      transactionId: row.transaction_id,
      amount: row.amount,
      platformFee: row.platform_fee,
      developerShare: row.developer_share,
      platformShare: row.platform_share,
      status: row.status,
      periodStart: new Date(row.period_start),
      periodEnd: new Date(row.period_end),
      createdAt: new Date(row.created_at),
      processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
      paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
    };
  },
};

