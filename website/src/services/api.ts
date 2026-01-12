/**
 * API Service
 * 
 * Centralized API client for backend communication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  message: string;
  status: number;
  errors?: any[];
}

export class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const apiError: ApiError = {
            message: (error.response.data as any)?.error?.message || 'An error occurred',
            status: error.response.status,
            errors: (error.response.data as any)?.error?.errors,
          };
          return Promise.reject(apiError);
        }
        return Promise.reject({
          message: 'Network error',
          status: 0,
        } as ApiError);
      }
    );
  }

  /**
   * Get API client instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Set auth token
   */
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Remove auth token
   */
  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

// Singleton instance
export const apiService = new ApiService();

