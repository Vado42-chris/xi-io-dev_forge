/**
 * Support Service
 * 
 * Handles support ticket creation, assignment, status tracking, and resolution.
 */

import { query } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface SupportTicket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'other';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean; // Internal notes visible only to support staff
  createdAt: Date;
}

export interface TicketCreationParams {
  userId: string;
  title: string;
  description: string;
  priority?: SupportTicket['priority'];
  category?: SupportTicket['category'];
  metadata?: Record<string, any>;
}

export interface TicketSearchParams {
  userId?: string;
  status?: SupportTicket['status'];
  priority?: SupportTicket['priority'];
  category?: SupportTicket['category'];
  assignedTo?: string;
  limit?: number;
  offset?: number;
}

export class SupportService {
  /**
   * Create a new support ticket
   */
  async createTicket(params: TicketCreationParams): Promise<SupportTicket> {
    try {
      const ticketId = uuidv4();

      await query(
        `INSERT INTO support_tickets (id, user_id, title, description, status, priority, category, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          ticketId,
          params.userId,
          params.title,
          params.description,
          'open',
          params.priority || 'medium',
          params.category || 'other',
          params.metadata ? JSON.stringify(params.metadata) : null,
        ]
      );

      logger.info('Support ticket created:', { ticketId, userId: params.userId });

      return await this.getTicketById(ticketId);
    } catch (error: any) {
      logger.error('Ticket creation failed:', error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: string): Promise<SupportTicket> {
    try {
      const result = await query(
        `SELECT id, user_id, title, description, status, priority, category, assigned_to, created_at, updated_at, resolved_at, closed_at, metadata
         FROM support_tickets
         WHERE id = $1`,
        [ticketId]
      );

      if (result.rows.length === 0) {
        throw new Error('Ticket not found');
      }

      return this.mapRowToTicket(result.rows[0]);
    } catch (error: any) {
      logger.error('Get ticket failed:', error);
      throw error;
    }
  }

  /**
   * Search tickets
   */
  async searchTickets(params: TicketSearchParams): Promise<{ tickets: SupportTicket[]; total: number }> {
    try {
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.userId) {
        conditions.push(`user_id = $${paramIndex}`);
        values.push(params.userId);
        paramIndex++;
      }

      if (params.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(params.status);
        paramIndex++;
      }

      if (params.priority) {
        conditions.push(`priority = $${paramIndex}`);
        values.push(params.priority);
        paramIndex++;
      }

      if (params.category) {
        conditions.push(`category = $${paramIndex}`);
        values.push(params.category);
        paramIndex++;
      }

      if (params.assignedTo) {
        conditions.push(`assigned_to = $${paramIndex}`);
        values.push(params.assignedTo);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as total FROM support_tickets ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].total);

      // Get tickets
      const result = await query(
        `SELECT id, user_id, title, description, status, priority, category, assigned_to, created_at, updated_at, resolved_at, closed_at, metadata
         FROM support_tickets
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      const tickets = result.rows.map(row => this.mapRowToTicket(row));

      return { tickets, total };
    } catch (error: any) {
      logger.error('Search tickets failed:', error);
      throw error;
    }
  }

  /**
   * Assign ticket to support staff
   */
  async assignTicket(ticketId: string, assignedTo: string): Promise<SupportTicket> {
    try {
      await query(
        `UPDATE support_tickets 
         SET assigned_to = $1, status = 'assigned', updated_at = NOW()
         WHERE id = $2`,
        [assignedTo, ticketId]
      );

      logger.info('Ticket assigned:', { ticketId, assignedTo });

      return await this.getTicketById(ticketId);
    } catch (error: any) {
      logger.error('Ticket assignment failed:', error);
      throw error;
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(
    ticketId: string,
    status: SupportTicket['status']
  ): Promise<SupportTicket> {
    try {
      const updates: string[] = [`status = $1`, `updated_at = NOW()`];
      const values: any[] = [status];

      if (status === 'resolved') {
        updates.push(`resolved_at = NOW()`);
      } else if (status === 'closed') {
        updates.push(`closed_at = NOW()`);
      }

      await query(
        `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = $${updates.length + 1}`,
        [...values, ticketId]
      );

      logger.info('Ticket status updated:', { ticketId, status });

      return await this.getTicketById(ticketId);
    } catch (error: any) {
      logger.error('Update ticket status failed:', error);
      throw error;
    }
  }

  /**
   * Add message to ticket
   */
  async addMessage(
    ticketId: string,
    userId: string,
    message: string,
    isInternal: boolean = false
  ): Promise<TicketMessage> {
    try {
      const messageId = uuidv4();

      await query(
        `INSERT INTO support_messages (id, ticket_id, user_id, message, is_internal, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [messageId, ticketId, userId, message, isInternal]
      );

      // Update ticket updated_at
      await query(
        `UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`,
        [ticketId]
      );

      logger.info('Message added to ticket:', { messageId, ticketId });

      return await this.getMessageById(messageId);
    } catch (error: any) {
      logger.error('Add message failed:', error);
      throw error;
    }
  }

  /**
   * Get messages for a ticket
   */
  async getTicketMessages(
    ticketId: string,
    includeInternal: boolean = false
  ): Promise<TicketMessage[]> {
    try {
      let queryText = `
        SELECT id, ticket_id, user_id, message, is_internal, created_at
        FROM support_messages
        WHERE ticket_id = $1
      `;

      const values: any[] = [ticketId];

      if (!includeInternal) {
        queryText += ` AND is_internal = false`;
      }

      queryText += ` ORDER BY created_at ASC`;

      const result = await query(queryText, values);

      return result.rows.map(row => this.mapRowToMessage(row));
    } catch (error: any) {
      logger.error('Get ticket messages failed:', error);
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<TicketMessage> {
    try {
      const result = await query(
        `SELECT id, ticket_id, user_id, message, is_internal, created_at
         FROM support_messages
         WHERE id = $1`,
        [messageId]
      );

      if (result.rows.length === 0) {
        throw new Error('Message not found');
      }

      return this.mapRowToMessage(result.rows[0]);
    } catch (error: any) {
      logger.error('Get message failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to SupportTicket object
   */
  private mapRowToTicket(row: any): SupportTicket {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      category: row.category,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      closedAt: row.closed_at ? new Date(row.closed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  /**
   * Map database row to TicketMessage object
   */
  private mapRowToMessage(row: any): TicketMessage {
    return {
      id: row.id,
      ticketId: row.ticket_id,
      userId: row.user_id,
      message: row.message,
      isInternal: row.is_internal,
      createdAt: row.created_at,
    };
  }
}

export const supportService = new SupportService();

