/**
 * Support Service
 * 
 * Handles support ticket operations.
 */

import { apiService } from './api';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  message: string;
  created_at: string;
  user_id?: string;
  agent_id?: string;
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
}

export class SupportService {
  /**
   * Get user's tickets
   */
  async getTickets(): Promise<TicketsResponse> {
    const response = await apiService.getClient().get<TicketsResponse>('/support/tickets');
    return response.data;
  }

  /**
   * Get ticket by ID
   */
  async getTicket(id: string): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }> {
    const response = await apiService.getClient().get<{ ticket: SupportTicket; messages: SupportMessage[] }>(
      `/support/tickets/${id}`
    );
    return response.data;
  }

  /**
   * Create ticket
   */
  async createTicket(data: { subject: string; description: string; priority?: string }): Promise<SupportTicket> {
    const response = await apiService.getClient().post<{ ticket: SupportTicket }>('/support/tickets', data);
    return response.data.ticket;
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, message: string): Promise<SupportMessage> {
    const response = await apiService.getClient().post<{ message: SupportMessage }>(
      `/support/tickets/${ticketId}/messages`,
      { message }
    );
    return response.data.message;
  }
}

export const supportService = new SupportService();

