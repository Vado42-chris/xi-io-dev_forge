/**
 * Payment Service
 * 
 * Service for payment processing and checkout.
 */

import { ApiClient, ApiResponse } from './apiClient';

export interface CheckoutSessionParams {
  productId: string;
  productName: string;
  amount: number; // in cents
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface Payment {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export class PaymentService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Create checkout session
   */
  async createCheckoutSession(params: CheckoutSessionParams): Promise<ApiResponse<CheckoutSessionResponse>> {
    return this.apiClient.post<CheckoutSessionResponse>('/api/payments/create-checkout-session', params);
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<ApiResponse<Payment>> {
    return this.apiClient.get<Payment>(`/api/payments/${paymentId}`);
  }

  /**
   * Get user payments
   */
  async getUserPayments(): Promise<ApiResponse<Payment[]>> {
    return this.apiClient.get<Payment[]>('/api/payments');
  }
}

