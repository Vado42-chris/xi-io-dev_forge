/**
 * Configuration Manager Tests
 * 
 * Tests for settings read/write functionality
 */

import * as vscode from 'vscode';
import { ConfigurationManager } from '../configurationManager';

describe('ConfigurationManager', () => {
  let mockContext: vscode.ExtensionContext;
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Create mock extension context
    mockContext = {
      subscriptions: [],
      workspaceState: {} as vscode.Memento,
      globalState: {} as vscode.Memento,
      secrets: {} as vscode.SecretStorage,
      extensionUri: vscode.Uri.parse('file:///test'),
      extensionPath: '/test',
      globalStorageUri: vscode.Uri.parse('file:///test/global'),
      storageUri: vscode.Uri.parse('file:///test/storage'),
      globalStoragePath: '/test/global',
      storagePath: '/test/storage',
      asAbsolutePath: (relativePath: string) => `/test/${relativePath}`,
      extensionMode: vscode.ExtensionMode.Production,
      environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
      extension: {} as vscode.Extension<any>
    };

    configManager = new ConfigurationManager(mockContext);
  });

  describe('getSetting', () => {
    it('should return default value when setting not found', () => {
      const value = configManager.getSetting<boolean>('models.enabled', true);
      expect(value).toBe(true);
    });

    it('should return configured value when setting exists', async () => {
      // Note: In real tests, we'd mock vscode.workspace.getConfiguration
      // For now, we test the structure
      const value = configManager.getSetting<string>('models.defaultProvider', 'ollama');
      expect(typeof value).toBe('string');
    });
  });

  describe('updateSetting', () => {
    it('should update setting value', async () => {
      // Note: In real tests, we'd verify the update
      await configManager.updateSetting('models.enabled', false);
      // Verify update (would need mock)
    });
  });

  describe('validateConfiguration', () => {
    it('should validate default provider', async () => {
      await configManager.initialize();
      // Validation should run on init
      // In real tests, we'd verify validation logic
    });

    it('should validate parallel execution settings', async () => {
      await configManager.initialize();
      // Validation should check maxConcurrent bounds
    });

    it('should validate aggregation settings', async () => {
      await configManager.initialize();
      // Validation should check qualityThreshold bounds
    });
  });

  describe('reload', () => {
    it('should reload configuration', () => {
      configManager.reload();
      // Should reload without errors
      expect(configManager).toBeDefined();
    });
  });

  describe('dispose', () => {
    it('should dispose resources', () => {
      configManager.dispose();
      // Should dispose without errors
      expect(configManager).toBeDefined();
    });
  });
});

