/**
 * Configuration Manager
 * 
 * Manages VS Code settings for Dev Forge extension.
 * Provides type-safe access to configuration values.
 */

import * as vscode from 'vscode';

export class ConfigurationManager {
  private config: vscode.WorkspaceConfiguration;
  private context: vscode.ExtensionContext;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.config = vscode.workspace.getConfiguration('devForge');
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    // Validate configuration
    await this.validateConfiguration();

    // Listen for configuration changes
    const changeListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('devForge')) {
        this.config = vscode.workspace.getConfiguration('devForge');
        this.onConfigurationChanged();
      }
    });

    this.disposables.push(changeListener);
  }

  /**
   * Get a configuration setting
   */
  getSetting<T>(key: string, defaultValue: T): T {
    const value = this.config.get<T>(key, defaultValue);
    return value;
  }

  /**
   * Update a configuration setting
   */
  async updateSetting<T>(key: string, value: T, target?: vscode.ConfigurationTarget): Promise<void> {
    const targetConfig = target || vscode.ConfigurationTarget.Global;
    await this.config.update(key, value, targetConfig);
    this.config = vscode.workspace.getConfiguration('devForge');
  }

  /**
   * Get nested configuration (e.g., 'models.ollama.enabled')
   */
  getNestedSetting<T>(key: string, defaultValue: T): T {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return defaultValue;
      }
    }

    return current !== undefined ? (current as T) : defaultValue;
  }

  /**
   * Update nested configuration
   */
  async updateNestedSetting<T>(key: string, value: T, target?: vscode.ConfigurationTarget): Promise<void> {
    await this.updateSetting(key, value, target);
  }

  /**
   * Get all configuration
   */
  getAllSettings(): vscode.WorkspaceConfiguration {
    return this.config;
  }

  /**
   * Validate configuration
   */
  private async validateConfiguration(): Promise<void> {
    // Validate required settings
    const modelsEnabled = this.getSetting<boolean>('models.enabled', true);
    if (modelsEnabled) {
      const defaultProvider = this.getSetting<string>('models.defaultProvider', 'ollama');
      const validProviders = ['ollama', 'gguf', 'api', 'plugin'];
      if (!validProviders.includes(defaultProvider)) {
        vscode.window.showWarningMessage(
          `Invalid default provider: ${defaultProvider}. Using 'ollama' instead.`
        );
        await this.updateSetting('models.defaultProvider', 'ollama');
      }
    }

    // Validate parallel execution settings
    const parallelEnabled = this.getSetting<boolean>('parallelExecution.enabled', true);
    if (parallelEnabled) {
      const maxConcurrent = this.getSetting<number>('parallelExecution.maxConcurrent', 11);
      if (maxConcurrent < 1 || maxConcurrent > 50) {
        vscode.window.showWarningMessage(
          `Invalid maxConcurrent: ${maxConcurrent}. Using default: 11.`
        );
        await this.updateSetting('parallelExecution.maxConcurrent', 11);
      }
    }

    // Validate aggregation settings
    const aggregationEnabled = this.getSetting<boolean>('aggregation.enabled', true);
    if (aggregationEnabled) {
      const qualityThreshold = this.getSetting<number>('aggregation.qualityThreshold', 0.6);
      if (qualityThreshold < 0 || qualityThreshold > 1) {
        vscode.window.showWarningMessage(
          `Invalid qualityThreshold: ${qualityThreshold}. Using default: 0.6.`
        );
        await this.updateSetting('aggregation.qualityThreshold', 0.6);
      }
    }
  }

  /**
   * Handle configuration changes
   */
  private onConfigurationChanged(): void {
    // Notify listeners (to be implemented)
    console.log('Dev Forge configuration changed');
  }

  /**
   * Reload configuration
   */
  reload(): void {
    this.config = vscode.workspace.getConfiguration('devForge');
    this.validateConfiguration();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }
}

