/**
 * API Key Manager
 * 
 * Manages API keys securely using a storage abstraction.
 * Framework-agnostic implementation.
 */

/**
 * Secret Storage Interface
 * Abstracts storage mechanism (VS Code SecretStorage, Node.js keychain, etc.)
 */
export interface SecretStorage {
  store(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
}

/**
 * Configuration Interface
 * Abstracts configuration access
 */
export interface ConfigStorage {
  get<T>(key: string, defaultValue?: T): T | undefined;
}

// Export interfaces for adapters
export type { SecretStorage, ConfigStorage };

export class ApiKeyManager {
  private secretStorage?: SecretStorage;
  private config?: ConfigStorage;

  constructor(secretStorage?: SecretStorage, config?: ConfigStorage) {
    this.secretStorage = secretStorage;
    this.config = config;
  }

  /**
   * Store API key securely
   */
  async storeApiKey(providerId: string, apiKey: string): Promise<void> {
    if (!this.secretStorage) {
      throw new Error('Secret storage not configured');
    }
    const key = `devForge.${providerId}.apiKey`;
    await this.secretStorage.store(key, apiKey);
  }

  /**
   * Get API key
   */
  async getApiKey(providerId: string): Promise<string | undefined> {
    // Try SecretStorage first
    if (this.secretStorage) {
      const key = `devForge.${providerId}.apiKey`;
      const stored = await this.secretStorage.get(key);
      if (stored) {
        return stored;
      }
    }

    // Fallback to config
    if (this.config) {
      return this.config.get<string>(`apiProviders.${providerId}.apiKey`);
    }

    return undefined;
  }

  /**
   * Delete API key
   */
  async deleteApiKey(providerId: string): Promise<void> {
    if (!this.secretStorage) {
      return;
    }
    const key = `devForge.${providerId}.apiKey`;
    await this.secretStorage.delete(key);
  }

  /**
   * Check if API key exists
   */
  async hasApiKey(providerId: string): Promise<boolean> {
    const key = await this.getApiKey(providerId);
    return key !== undefined && key.length > 0;
  }
}

