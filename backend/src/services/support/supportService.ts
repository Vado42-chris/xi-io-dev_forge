/**
 * Support Service
 * 
 * Handles support ticket operations.
 */

import { SupportTicketModel, CreateTicketData } from '../../database/models/supportTicketModel';
import { SupportMessageModel, CreateMessageData } from '../../database/models/supportMessageModel';

export interface TicketInfo {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
}

export interface MessageInfo {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_internal: boolean;
  created_at: Date;
}

export interface CreateTicketResult {
  success: boolean;
  ticket?: TicketInfo;
  error?: string;
}

export class SupportService {
  private ticketModel: SupportTicketModel;
  private messageModel: SupportMessageModel;

  constructor() {
    this.ticketModel = new SupportTicketModel();
    this.messageModel = new SupportMessageModel();
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketData): Promise<CreateTicketResult> {
    try {
      const ticketId = await this.ticketModel.create(data);
      const ticket = await this.ticketModel.findById(ticketId);

      if (!ticket) {
        return {
          success: false,
          error: 'Failed to retrieve created ticket'
        };
      }

      return {
        success: true,
        ticket: this.mapToInfo(ticket)
      };
    } catch (error: any) {
      console.error('[SupportService] Error creating ticket:', error);
      return {
        success: false,
        error: error.message || 'Failed to create ticket'
      };
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: string): Promise<TicketInfo | null> {
    try {
      const ticket = await this.ticketModel.findById(id);
      return ticket ? this.mapToInfo(ticket) : null;
    } catch (error) {
      console.error('[SupportService] Error getting ticket:', error);
      return null;
    }
  }

  /**
   * Get tickets by user
   */
  async getTicketsByUser(userId: string): Promise<TicketInfo[]> {
    try {
      const tickets = await this.ticketModel.findByUserId(userId);
      return tickets.map(ticket => this.mapToInfo(ticket));
    } catch (error) {
      console.error('[SupportService] Error getting tickets by user:', error);
      return [];
    }
  }

  /**
   * Get tickets by status
   */
  async getTicketsByStatus(status: 'open' | 'in_progress' | 'resolved' | 'closed', limit: number = 50, offset: number = 0): Promise<TicketInfo[]> {
    try {
      const tickets = await this.ticketModel.findByStatus(status, limit, offset);
      return tickets.map(ticket => this.mapToInfo(ticket));
    } catch (error) {
      console.error('[SupportService] Error getting tickets by status:', error);
      return [];
    }
  }

  /**
   * Update ticket status
   */
  async updateTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Promise<boolean> {
    try {
      await this.ticketModel.updateStatus(ticketId, status);
      return true;
    } catch (error) {
      console.error('[SupportService] Error updating ticket status:', error);
      return false;
    }
  }

  /**
   * Assign ticket
   */
  async assignTicket(ticketId: string, assignedTo: string): Promise<boolean> {
    try {
      await this.ticketModel.assignTicket(ticketId, assignedTo);
      await this.ticketModel.updateStatus(ticketId, 'in_progress');
      return true;
    } catch (error) {
      console.error('[SupportService] Error assigning ticket:', error);
      return false;
    }
  }

  /**
   * Add message to ticket
   */
  async addMessage(data: CreateMessageData): Promise<string | null> {
    try {
      const messageId = await this.messageModel.create(data);
      return messageId;
    } catch (error) {
      console.error('[SupportService] Error adding message:', error);
      return null;
    }
  }

  /**
   * Get messages for ticket
   */
  async getTicketMessages(ticketId: string): Promise<MessageInfo[]> {
    try {
      const messages = await this.messageModel.findByTicketId(ticketId);
      return messages.map(msg => ({
        id: msg.id,
        ticket_id: msg.ticket_id,
        user_id: msg.user_id,
        message: msg.message,
        is_internal: msg.is_internal,
        created_at: msg.created_at,
      }));
    } catch (error) {
      console.error('[SupportService] Error getting messages:', error);
      return [];
    }
  }

  /**
   * Map SupportTicketRow to TicketInfo
   */
  private mapToInfo(ticket: any): TicketInfo {
    return {
      id: ticket.id,
      user_id: ticket.user_id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at,
    };
  }
}

