/**
 * React Integration Example
 * 
 * Example of how to integrate API client in React/Next.js app.
 */

import { useEffect, useState } from 'react';
import { ApiServices, WebSocketClient } from '../index';

/**
 * React Hook: Use API Services
 */
export function useApiServices() {
  const [api, setApi] = useState<ApiServices | null>(null);
  const [ws, setWs] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize API services
    const apiServices = new ApiServices({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
    });

    // Load token from localStorage
    const token = localStorage.getItem('dev_forge_token');
    if (token) {
      apiServices.initialize(token);
    }

    // Initialize WebSocket
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const wsClient = new WebSocketClient(wsUrl);

    setApi(apiServices);
    setWs(wsClient);

    // Cleanup
    return () => {
      wsClient.disconnect();
    };
  }, []);

  return { api, ws };
}

/**
 * React Hook: Use Authentication
 */
export function useAuth(api: ApiServices | null) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    if (!api) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.login({ email, password });
      
      if (response.success && response.data) {
        localStorage.setItem('dev_forge_token', response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        setError(response.error?.message || 'Login failed');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (api) {
      api.auth.logout();
    }
    localStorage.removeItem('dev_forge_token');
    setUser(null);
  };

  const register = async (email: string, password: string, name?: string) => {
    if (!api) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.register({ email, password, name });
      
      if (response.success && response.data) {
        localStorage.setItem('dev_forge_token', response.data.token);
        setUser(response.data.user);
        return response.data;
      } else {
        setError(response.error?.message || 'Registration failed');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, logout, register };
}

/**
 * React Hook: Use Extensions
 */
export function useExtensions(api: ApiServices | null) {
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExtensions = async (params?: any) => {
    if (!api) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.extensions.getExtensions(params);
      
      if (response.success && response.data) {
        setExtensions(response.data);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to fetch extensions');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch extensions');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [api]);

  return { extensions, loading, error, refetch: fetchExtensions };
}

/**
 * React Hook: Use WebSocket Events
 */
export function useWebSocketEvents(ws: WebSocketClient | null, eventType: string) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!ws) return;

    const handler = (event: any) => {
      setEvents((prev) => [...prev, event]);
    };

    const unsubscribe = ws.on(eventType as any, handler);

    return () => {
      unsubscribe();
    };
  }, [ws, eventType]);

  return events;
}

