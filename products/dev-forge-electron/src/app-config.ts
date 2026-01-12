/**
 * App Configuration
 * 
 * Centralized configuration management for Dev Forge.
 * Uses Xibalba Framework patterns.
 */

export interface AppConfig {
  theme: 'xibalba-dark' | 'xibalba-light' | 'custom';
  fontSize: number;
  fontFamily: string;
  autoSave: boolean;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export class AppConfigManager {
  private config: AppConfig;
  private configKey = 'app.config';

  constructor() {
    // Default configuration
    this.config = {
      theme: 'xibalba-dark',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
      autoSave: true,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
    };
  }

  /**
   * Load configuration from storage
   */
  async load(): Promise<void> {
    try {
      const saved = await window.electronAPI.getConfig(this.configKey);
      if (saved) {
        this.config = { ...this.config, ...saved };
      }
    } catch (error) {
      console.error('[AppConfig] Error loading config:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  async save(): Promise<void> {
    try {
      await window.electronAPI.setConfig(this.configKey, this.config);
    } catch (error) {
      console.error('[AppConfig] Error saving config:', error);
    }
  }

  /**
   * Get configuration
   */
  get(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async update(updates: Partial<AppConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    await this.save();
  }

  /**
   * Get theme
   */
  getTheme(): string {
    return this.config.theme;
  }

  /**
   * Set theme
   */
  async setTheme(theme: AppConfig['theme']): Promise<void> {
    await this.update({ theme });
    this.applyTheme();
  }

  /**
   * Apply theme to document
   */
  private applyTheme(): void {
    document.body.setAttribute('data-theme', this.config.theme);
  }

  /**
   * Reset to defaults
   */
  async reset(): Promise<void> {
    this.config = {
      theme: 'xibalba-dark',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
      autoSave: true,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
    };
    await this.save();
    this.applyTheme();
  }
}

