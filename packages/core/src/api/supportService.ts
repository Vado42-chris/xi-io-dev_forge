/**
 * Support Service
 * 
 * Service for support tickets and knowledge base.
 */

import { ApiClient, ApiResponse } from './apiClient';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  createdAt: string;
}

export interface CreateTicketParams {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface UpdateTicketParams {
  subject?: string;
  description?: string;
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string | null;
}

export interface AddMessageParams {
  message: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface TicketListParams {
  status?: 'open' | 'in-progress' | 'resolved' | 'closed' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  limit?: number;
  offset?: number;
}

export class SupportService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Create support ticket
   */
  async createTicket(params: CreateTicketParams): Promise<ApiResponse<SupportTicket>> {
    return this.apiClient.post<SupportTicket>('/api/support/tickets', params);
  }

  /**
   * Get ticket by ID
   */
  async getTicket(id: string, includeMessages: boolean = false): Promise<ApiResponse<SupportTicket>> {
    const query = includeMessages ? '?includeMessages=true' : '';
    return this.apiClient.get<SupportTicket>(`/api/support/tickets/${id}${query}`);
  }

  /**
   * Get all tickets
   */
  async getTickets(params?: TicketListParams): Promise<ApiResponse<SupportTicket[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.priority) queryParams.set('priority', params.priority);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.apiClient.get<SupportTicket[]>(`/api/support/tickets${query ? `?${query}` : ''}`);
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, updates: UpdateTicketParams): Promise<ApiResponse<SupportTicket>> {
    return this.apiClient.put<SupportTicket>(`/api/support/tickets/${id}`, updates);
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: string, params: AddMessageParams): Promise<ApiResponse<SupportMessage>> {
    return this.apiClient.post<SupportMessage>(`/api/support/tickets/${ticketId}/messages`, params);
  }

  /**
   * Get knowledge base articles
   */
  async getKnowledgeBaseArticles(
    status?: 'draft' | 'published' | 'archived' | 'all',
    category?: string,
    search?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<KnowledgeBaseArticle[]>> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);
    if (category) queryParams.set('category', category);
    if (search) queryParams.set('search', search);
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());

    const query = queryParams.toString();
    return this.apiClient.get<KnowledgeBaseArticle[]>(`/api/support/knowledge-base${query ? `?${query}` : ''}`);
  }

  /**
   * Get knowledge base article by ID
   */
  async getKnowledgeBaseArticle(id: string): Promise<ApiResponse<KnowledgeBaseArticle>> {
    return this.apiClient.get<KnowledgeBaseArticle>(`/api/support/knowledge-base/${id}`);
  }
}

