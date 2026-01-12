/**
 * Electron App Integration Example
 * 
 * Example of how to integrate API client in Electron app.
 */

import { ApiServices, WebSocketClient } from '../index';

/**
 * Initialize API services for Electron app
 */
export function initializeElectronAPI() {
  const api = new ApiServices({
    baseURL: process.env.API_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  });

  // Load token from Electron's secure storage
  const { ipcRenderer } = require('electron');
  
  ipcRenderer.invoke('get-stored-token').then((token: string | null) => {
    if (token) {
      api.initialize(token);
    }
  });

  // Save token when authentication changes
  api.auth.login = new Proxy(api.auth.login, {
    apply: async (target, thisArg, args) => {
      const response = await target.apply(thisArg, args);
      if (response.success && response.data) {
        // Store token securely in Electron
        await ipcRenderer.invoke('store-token', response.data.token);
      }
      return response;
    },
  });

  // Initialize WebSocket for real-time updates
  const wsUrl = process.env.WS_URL || 'ws://localhost:3001';
  const ws = new WebSocketClient(wsUrl);

  // Connect WebSocket when authenticated
  if (api.auth.isAuthenticated()) {
    ws.connect(api.auth.getToken() || undefined);
  }

  // Subscribe to notifications
  ws.on('notification', (event) => {
    // Show notification in Electron
    new Notification('Dev Forge', {
      body: event.data.message,
      icon: 'icon.png',
    });
  });

  // Subscribe to extension updates
  ws.on('extension_update', (event) => {
    // Refresh extension list
    console.log('Extension updated:', event.data);
  });

  return { api, ws };
}

/**
 * Example: Check license on app startup
 */
export async function checkLicenseOnStartup(api: ApiServices) {
  const token = api.auth.getToken();
  if (!token) {
    return { valid: false, reason: 'not_authenticated' };
  }

  // Get user licenses
  const licensesResponse = await api.licenses.getUserLicenses();
  
  if (!licensesResponse.success || !licensesResponse.data) {
    return { valid: false, reason: 'api_error' };
  }

  // Check for active license
  const activeLicense = licensesResponse.data.find(
    (license) => license.status === 'active' && 
    (!license.expiresAt || new Date(license.expiresAt) > new Date())
  );

  if (!activeLicense) {
    return { valid: false, reason: 'no_active_license' };
  }

  return { valid: true, license: activeLicense };
}

/**
 * Example: Sync extensions from marketplace
 */
export async function syncExtensions(api: ApiServices) {
  const extensionsResponse = await api.extensions.getExtensions({
    status: 'approved',
    limit: 100,
  });

  if (extensionsResponse.success && extensionsResponse.data) {
    return extensionsResponse.data;
  }

  return [];
}

