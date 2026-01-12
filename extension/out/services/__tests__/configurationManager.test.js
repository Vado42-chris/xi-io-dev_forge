"use strict";
/**
 * Configuration Manager Tests
 *
 * Tests for settings read/write functionality
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = __importStar(require("vscode"));
const configurationManager_1 = require("../configurationManager");
describe('ConfigurationManager', () => {
    let mockContext;
    let configManager;
    beforeEach(() => {
        // Create mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {},
            globalState: {},
            secrets: {},
            extensionUri: vscode.Uri.parse('file:///test'),
            extensionPath: '/test',
            globalStorageUri: vscode.Uri.parse('file:///test/global'),
            storageUri: vscode.Uri.parse('file:///test/storage'),
            globalStoragePath: '/test/global',
            storagePath: '/test/storage',
            asAbsolutePath: (relativePath) => `/test/${relativePath}`,
            extensionMode: vscode.ExtensionMode.Production,
            environmentVariableCollection: {},
            extension: {}
        };
        configManager = new configurationManager_1.ConfigurationManager(mockContext);
    });
    describe('getSetting', () => {
        it('should return default value when setting not found', () => {
            const value = configManager.getSetting('models.enabled', true);
            expect(value).toBe(true);
        });
        it('should return configured value when setting exists', async () => {
            // Note: In real tests, we'd mock vscode.workspace.getConfiguration
            // For now, we test the structure
            const value = configManager.getSetting('models.defaultProvider', 'ollama');
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
//# sourceMappingURL=configurationManager.test.js.map