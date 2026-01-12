/**
 * Settings Manager
 * 
 * Manages application settings and configuration.
 * Provides centralized settings management with persistence.
 */

export interface AppSettings {
  // Editor settings
  editor: {
    theme: string;
    fontSize: number;
    fontFamily: string;
    wordWrap: boolean;
    lineNumbers: boolean;
    minimap: boolean;
    tabSize: number;
  };

  // AI settings
  ai: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    enableStreaming: boolean;
    autoSaveConversations: boolean;
  };

  // UI settings
  ui: {
    theme: string;
    sidebarWidth: number;
    statusBarVisible: boolean;
    activityBarVisible: boolean;
    panelPosition: 'bottom' | 'right';
  };

  // System settings
  system: {
    autoSave: boolean;
    autoSaveDelay: number;
    enableTelemetry: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };

  // Plugin settings
  plugins: {
    autoLoad: boolean;
    enableSandbox: boolean;
    allowNetworkAccess: boolean;
  };

  // Marketplace settings
  marketplace: {
    autoUpdate: boolean;
    showNotifications: boolean;
    preferredCurrency: string;
  };
}

export interface SettingsChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export class SettingsManager {
  private settings: AppSettings;
  private changeCallbacks: Set<(event: SettingsChangeEvent) => void> = new Set();
  private storageKey: string = 'dev-forge-settings';

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      editor: {
        theme: 'xibalba-dark',
        fontSize: 14,
        fontFamily: 'JetBrains Mono',
        wordWrap: true,
        lineNumbers: true,
        minimap: true,
        tabSize: 2,
      },
      ai: {
        defaultModel: 'ollama-llama2',
        temperature: 0.7,
        maxTokens: 2048,
        enableStreaming: true,
        autoSaveConversations: true,
      },
      ui: {
        theme: 'xibalba-dark',
        sidebarWidth: 256,
        statusBarVisible: true,
        activityBarVisible: true,
        panelPosition: 'bottom',
      },
      system: {
        autoSave: true,
        autoSaveDelay: 1000,
        enableTelemetry: false,
        logLevel: 'info',
      },
      plugins: {
        autoLoad: true,
        enableSandbox: true,
        allowNetworkAccess: false,
      },
      marketplace: {
        autoUpdate: false,
        showNotifications: true,
        preferredCurrency: 'USD',
      },
    };
  }

  /**
   * Get setting value
   */
  get<K extends keyof AppSettings>(category: K): AppSettings[K];
  get<K extends keyof AppSettings, T extends keyof AppSettings[K]>(
    category: K,
    key: T
  ): AppSettings[K][T];
  get<K extends keyof AppSettings, T extends keyof AppSettings[K]>(
    category: K,
    key?: T
  ): AppSettings[K] | AppSettings[K][T] {
    if (key === undefined) {
      return this.settings[category];
    }
    return this.settings[category][key];
  }

  /**
   * Set setting value
   */
  set<K extends keyof AppSettings, T extends keyof AppSettings[K]>(
    category: K,
    key: T,
    value: AppSettings[K][T]
  ): void {
    const oldValue = this.settings[category][key];
    this.settings[category][key] = value;
    this.saveSettings();

    // Notify listeners
    const event: SettingsChangeEvent = {
      key: `${category}.${String(key)}`,
      oldValue,
      newValue: value,
      timestamp: new Date(),
    };

    this.notifyChange(event);
  }

  /**
   * Update multiple settings
   */
  update(updates: Partial<AppSettings>): void {
    Object.keys(updates).forEach(category => {
      const categoryKey = category as keyof AppSettings;
      const categoryUpdates = updates[categoryKey];
      if (categoryUpdates) {
        Object.keys(categoryUpdates).forEach(key => {
          const valueKey = key as keyof AppSettings[typeof categoryKey];
          this.set(categoryKey, valueKey, categoryUpdates[valueKey]);
        });
      }
    });
  }

  /**
   * Reset to default settings
   */
  reset(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
    this.notifyChange({
      key: 'all',
      oldValue: null,
      newValue: this.settings,
      timestamp: new Date(),
    });
  }

  /**
   * Reset specific category
   */
  resetCategory<K extends keyof AppSettings>(category: K): void {
    const defaults = this.getDefaultSettings();
    this.settings[category] = defaults[category];
    this.saveSettings();
    this.notifyChange({
      key: category,
      oldValue: null,
      newValue: this.settings[category],
      timestamp: new Date(),
    });
  }

  /**
   * Load settings from storage
   */
  private loadSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.settings = { ...this.getDefaultSettings(), ...parsed };
        }
      }
    } catch (error) {
      console.error('[SettingsManager] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Save settings to storage
   */
  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error('[SettingsManager] Error saving settings:', error);
    }
  }

  /**
   * Export settings
   */
  export(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings
   */
  import(settingsJson: string): void {
    try {
      const imported = JSON.parse(settingsJson);
      this.settings = { ...this.getDefaultSettings(), ...imported };
      this.saveSettings();
      this.notifyChange({
        key: 'all',
        oldValue: null,
        newValue: this.settings,
        timestamp: new Date(),
      });
    } catch (error) {
      throw new Error(`Invalid settings format: ${error}`);
    }
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (event: SettingsChangeEvent) => void): () => void {
    this.changeCallbacks.add(callback);
    
    return () => {
      this.changeCallbacks.delete(callback);
    };
  }

  /**
   * Notify change listeners
   */
  private notifyChange(event: SettingsChangeEvent): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[SettingsManager] Error in change callback:', error);
      }
    });
  }

  /**
   * Get all settings
   */
  getAll(): AppSettings {
    return { ...this.settings };
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();

