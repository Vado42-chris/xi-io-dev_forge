/**
 * API Module
 * 
 * Centralized API services for Dev Forge.
 */

export { ApiClient, ApiClientConfig, ApiResponse } from './apiClient';
export { AuthService, LoginCredentials, RegisterData, AuthResponse } from './authService';
export { PaymentService, CheckoutSessionParams, CheckoutSessionResponse, Payment } from './paymentService';
export { LicenseService, License, CreateLicenseParams, ValidateLicenseResponse } from './licenseService';
export { ExtensionService, Extension, CreateExtensionParams, ExtensionReview, CreateReviewParams } from './extensionService';
export { SupportService, SupportTicket, SupportMessage, CreateTicketParams, KnowledgeBaseArticle } from './supportService';

/**
 * Create API services instance
 */
import { ApiClient } from './apiClient';
import { AuthService } from './authService';
import { PaymentService } from './paymentService';
import { LicenseService } from './licenseService';
import { ExtensionService } from './extensionService';
import { SupportService } from './supportService';

export interface ApiServicesConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiServices {
  public client: ApiClient;
  public auth: AuthService;
  public payments: PaymentService;
  public licenses: LicenseService;
  public extensions: ExtensionService;
  public support: SupportService;

  constructor(config: ApiServicesConfig) {
    this.client = new ApiClient(config);
    this.auth = new AuthService(this.client);
    this.payments = new PaymentService(this.client);
    this.licenses = new LicenseService(this.client);
    this.extensions = new ExtensionService(this.client);
    this.support = new SupportService(this.client);
  }

  /**
   * Initialize with token from storage
   */
  initialize(token?: string): void {
    if (token) {
      this.client.setToken(token);
    }
  }
}

