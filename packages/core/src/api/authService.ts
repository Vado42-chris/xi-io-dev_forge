/**
 * Authentication Service
 * 
 * Service for user authentication and authorization.
 */

import { ApiClient, ApiResponse } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class AuthService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.apiClient.post<AuthResponse>('/api/auth/register', data);
    
    if (response.success && response.data) {
      // Store token
      this.apiClient.setToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.apiClient.post<AuthResponse>('/api/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store token
      this.apiClient.setToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Logout user
   */
  logout(): void {
    this.apiClient.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.apiClient.getToken() !== null;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.apiClient.getToken();
  }
}

