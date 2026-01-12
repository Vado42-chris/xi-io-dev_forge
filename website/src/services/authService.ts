/**
 * Authentication Service
 * 
 * Handles user authentication operations.
 */

import { apiService } from './api';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    tier: 'free' | 'pro' | 'enterprise';
  };
}

export class AuthService {
  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.getClient().post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      apiService.setAuthToken(response.data.token);
    }
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.getClient().post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      apiService.setAuthToken(response.data.token);
    }
    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    apiService.removeAuthToken();
  }

  /**
   * Verify token
   */
  async verifyToken(): Promise<boolean> {
    try {
      const token = apiService.getAuthToken();
      if (!token) {
        return false;
      }
      await apiService.getClient().get('/auth/verify');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiService.getAuthToken() !== null;
  }
}

export const authService = new AuthService();

