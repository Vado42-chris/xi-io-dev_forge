/**
 * Extension Service
 * 
 * Service for extension marketplace operations.
 */

import { ApiClient, ApiResponse } from './apiClient';

export interface Extension {
  id: string;
  name: string;
  description: string;
  publisherId: string;
  version: string;
  category: string;
  tags: string[];
  price: number; // in cents
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  downloadUrl: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface CreateExtensionParams {
  name: string;
  description: string;
  version: string;
  category: string;
  tags?: string[];
  price: number;
  downloadUrl: string;
  imageUrl?: string;
}

export interface ExtensionReview {
  id: string;
  extensionId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewParams {
  rating: number;
  comment?: string;
}

export interface ExtensionListParams {
  status?: 'pending' | 'approved' | 'rejected' | 'disabled' | 'all';
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class ExtensionService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Get all extensions
   */
  async getExtensions(params?: ExtensionListParams): Promise<ApiResponse<Extension[]>> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.apiClient.get<Extension[]>(`/api/extensions${query ? `?${query}` : ''}`);
  }

  /**
   * Get extension by ID
   */
  async getExtension(id: string): Promise<ApiResponse<Extension>> {
    return this.apiClient.get<Extension>(`/api/extensions/${id}`);
  }

  /**
   * Create extension (Publisher/Admin only)
   */
  async createExtension(params: CreateExtensionParams): Promise<ApiResponse<Extension>> {
    return this.apiClient.post<Extension>('/api/extensions', params);
  }

  /**
   * Update extension
   */
  async updateExtension(id: string, updates: Partial<CreateExtensionParams>): Promise<ApiResponse<Extension>> {
    return this.apiClient.put<Extension>(`/api/extensions/${id}`, updates);
  }

  /**
   * Delete extension (Admin only)
   */
  async deleteExtension(id: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/api/extensions/${id}`);
  }

  /**
   * Submit review for extension
   */
  async submitReview(extensionId: string, params: CreateReviewParams): Promise<ApiResponse<ExtensionReview>> {
    return this.apiClient.post<ExtensionReview>(`/api/extensions/${extensionId}/reviews`, params);
  }

  /**
   * Get reviews for extension
   */
  async getReviews(extensionId: string, limit?: number, offset?: number): Promise<ApiResponse<ExtensionReview[]>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', limit.toString());
    if (offset) queryParams.set('offset', offset.toString());

    const query = queryParams.toString();
    return this.apiClient.get<ExtensionReview[]>(`/api/extensions/${extensionId}/reviews${query ? `?${query}` : ''}`);
  }

  /**
   * Update review
   */
  async updateReview(extensionId: string, reviewId: string, params: CreateReviewParams): Promise<ApiResponse<ExtensionReview>> {
    return this.apiClient.put<ExtensionReview>(`/api/extensions/${extensionId}/reviews/${reviewId}`, params);
  }

  /**
   * Delete review
   */
  async deleteReview(extensionId: string, reviewId: string): Promise<ApiResponse<void>> {
    return this.apiClient.delete<void>(`/api/extensions/${extensionId}/reviews/${reviewId}`);
  }
}

