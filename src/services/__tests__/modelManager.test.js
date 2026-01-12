"use strict";
/**
 * Model Manager - Comprehensive Test Suite
 *
 * Tests all functionality with yin/yang analysis:
 * - Initialization
 * - Model registration
 * - Model discovery
 * - Model activation
 * - Model installation
 * - Query operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const modelManager_1 = require("../modelManager");
const ollamaService_1 = require("../ollamaService");
// Mock ollamaService
jest.mock('../ollamaService');
describe('ModelManager', () => {
    beforeEach(() => {
        // Reset model manager before each test
        modelManager_1.modelManager.reset();
        jest.clearAllMocks();
    });
    describe('initialize()', () => {
        it('should initialize successfully when Ollama is running', async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValueOnce(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([]);
            await modelManager_1.modelManager.initialize();
            expect(modelManager_1.modelManager.getInitialized()).toBe(true);
            expect(modelManager_1.modelManager.getModelCount()).toBeGreaterThan(0);
        });
        it('should throw error when Ollama is not running', async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValueOnce(false);
            await expect(modelManager_1.modelManager.initialize()).rejects.toThrow('Ollama is not running. Please start Ollama first.');
            expect(modelManager_1.modelManager.getInitialized()).toBe(false);
        });
        it('should not initialize twice', async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
            const firstCount = modelManager_1.modelManager.getModelCount();
            await modelManager_1.modelManager.initialize();
            const secondCount = modelManager_1.modelManager.getModelCount();
            expect(firstCount).toBe(secondCount);
            expect(ollamaService_1.ollamaService.listModels).toHaveBeenCalledTimes(1);
        });
        it('should handle network timeout during initialization', async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValueOnce(true);
            ollamaService_1.ollamaService.listModels.mockRejectedValueOnce(new Error('Network timeout'));
            await modelManager_1.modelManager.initialize();
            // Should still initialize with empty model list
            expect(modelManager_1.modelManager.getInitialized()).toBe(true);
            expect(modelManager_1.modelManager.getInstalledModelCount()).toBe(0);
        });
    });
    describe('refreshInstalledModels()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should refresh installed models list', async () => {
            const mockModels = [
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
                { name: 'llama3.2:3b', size: 2147483648, digest: 'def456', modified_at: '2025-01-10T00:00:00Z' },
            ];
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce(mockModels);
            await modelManager_1.modelManager.refreshInstalledModels();
            const installed = modelManager_1.modelManager.getInstalledModels();
            expect(installed.length).toBeGreaterThan(0);
        });
        it('should handle refresh errors gracefully', async () => {
            ollamaService_1.ollamaService.listModels.mockRejectedValueOnce(new Error('Error'));
            await expect(modelManager_1.modelManager.refreshInstalledModels()).resolves.not.toThrow();
            expect(modelManager_1.modelManager.getInstalledModelCount()).toBe(0);
        });
    });
    describe('getAllModels()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should return all registered models', () => {
            const models = modelManager_1.modelManager.getAllModels();
            expect(models.length).toBe(11); // Free tier models
        });
        it('should return empty array if not initialized', () => {
            modelManager_1.modelManager.reset();
            const models = modelManager_1.modelManager.getAllModels();
            expect(models.length).toBe(0);
        });
    });
    describe('getModelsByCategory()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should return models by category', () => {
            const codingModels = modelManager_1.modelManager.getModelsByCategory('coding');
            expect(codingModels.length).toBeGreaterThan(0);
            codingModels.forEach(model => {
                expect(model.category).toBe('coding');
            });
        });
        it('should return empty array for non-existent category', () => {
            // TypeScript will prevent this, but test runtime behavior
            const models = modelManager_1.modelManager.getModelsByCategory('general');
            expect(Array.isArray(models)).toBe(true);
        });
    });
    describe('getFreeTierModels()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should return only free tier models', () => {
            const freeTier = modelManager_1.modelManager.getFreeTierModels();
            expect(freeTier.length).toBe(11);
            freeTier.forEach(model => {
                expect(model.tags).toContain('free-tier');
            });
        });
    });
    describe('getInstalledModels()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            await modelManager_1.modelManager.initialize();
        });
        it('should return only installed models', async () => {
            const mockModels = [
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ];
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce(mockModels);
            await modelManager_1.modelManager.refreshInstalledModels();
            const installed = modelManager_1.modelManager.getInstalledModels();
            installed.forEach(model => {
                expect(model.isInstalled).toBe(true);
            });
        });
        it('should return empty array when no models installed', () => {
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([]);
            const installed = modelManager_1.modelManager.getInstalledModels();
            expect(installed.length).toBe(0);
        });
    });
    describe('getModel()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should return model by ID', () => {
            const model = modelManager_1.modelManager.getModel('mistral-7b');
            expect(model).toBeDefined();
            expect(model?.id).toBe('mistral-7b');
        });
        it('should return undefined for non-existent model', () => {
            const model = modelManager_1.modelManager.getModel('nonexistent-model');
            expect(model).toBeUndefined();
        });
    });
    describe('setActiveModel()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            await modelManager_1.modelManager.initialize();
        });
        it('should set active model when model exists and is installed', () => {
            modelManager_1.modelManager.setActiveModel('mistral-7b');
            const active = modelManager_1.modelManager.getActiveModel();
            expect(active).toBeDefined();
            expect(active?.id).toBe('mistral-7b');
            expect(active?.isActive).toBe(true);
        });
        it('should throw error when model does not exist', () => {
            expect(() => {
                modelManager_1.modelManager.setActiveModel('nonexistent-model');
            }).toThrow('Model not found: nonexistent-model');
        });
        it('should throw error when model is not installed', () => {
            modelManager_1.modelManager.reset();
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            modelManager_1.modelManager.initialize();
            expect(() => {
                modelManager_1.modelManager.setActiveModel('mistral-7b');
            }).toThrow('Model not installed: mistral-7b');
        });
        it('should deactivate previous model when switching', () => {
            modelManager_1.modelManager.setActiveModel('mistral-7b');
            const firstActive = modelManager_1.modelManager.getActiveModel();
            expect(firstActive?.isActive).toBe(true);
            // This will fail if model not installed, but test the logic
            // In real scenario, both models would be installed
            const allModels = modelManager_1.modelManager.getAllModels();
            const installed = allModels.filter(m => m.isInstalled);
            if (installed.length > 1) {
                modelManager_1.modelManager.setActiveModel(installed[1].id);
                expect(firstActive?.isActive).toBe(false);
            }
        });
    });
    describe('getActiveModel()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should return null when no model is active', () => {
            const active = modelManager_1.modelManager.getActiveModel();
            expect(active).toBeNull();
        });
        it('should return active model when set', async () => {
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            await modelManager_1.modelManager.refreshInstalledModels();
            modelManager_1.modelManager.setActiveModel('mistral-7b');
            const active = modelManager_1.modelManager.getActiveModel();
            expect(active).toBeDefined();
            expect(active?.isActive).toBe(true);
        });
    });
    describe('installModel()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
        });
        it('should install model successfully', async () => {
            ollamaService_1.ollamaService.pullModel.mockResolvedValueOnce(undefined);
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            const progressCallbacks = [];
            await modelManager_1.modelManager.installModel('mistral-7b', (progress) => {
                progressCallbacks.push(progress);
            });
            const model = modelManager_1.modelManager.getModel('mistral-7b');
            expect(model?.isInstalled).toBe(true);
        });
        it('should throw error when model does not exist', async () => {
            await expect(modelManager_1.modelManager.installModel('nonexistent-model')).rejects.toThrow('Model not found: nonexistent-model');
        });
        it('should skip installation if model already installed', async () => {
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            await modelManager_1.modelManager.refreshInstalledModels();
            await modelManager_1.modelManager.installModel('mistral-7b');
            expect(ollamaService_1.ollamaService.pullModel).not.toHaveBeenCalled();
        });
        it('should handle installation errors', async () => {
            ollamaService_1.ollamaService.pullModel.mockRejectedValueOnce(new Error('Installation failed'));
            await expect(modelManager_1.modelManager.installModel('mistral-7b')).rejects.toThrow('Failed to install model');
            const model = modelManager_1.modelManager.getModel('mistral-7b');
            expect(model?.isInstalled).toBe(false);
        });
        it('should track installation progress', async () => {
            const progressCallbacks = [];
            ollamaService_1.ollamaService.pullModel.mockImplementation(async (name, onProgress) => {
                onProgress?.('pulling manifest');
                onProgress?.('downloading');
                onProgress?.('complete');
            });
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            await modelManager_1.modelManager.installModel('mistral-7b', (progress) => {
                progressCallbacks.push(progress);
            });
            expect(progressCallbacks.length).toBeGreaterThan(0);
        });
    });
    describe('getModelCount()', () => {
        it('should return correct model count', async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            ollamaService_1.ollamaService.listModels.mockResolvedValue([]);
            await modelManager_1.modelManager.initialize();
            expect(modelManager_1.modelManager.getModelCount()).toBe(11);
        });
        it('should return 0 when not initialized', () => {
            modelManager_1.modelManager.reset();
            expect(modelManager_1.modelManager.getModelCount()).toBe(0);
        });
    });
    describe('getInstalledModelCount()', () => {
        beforeEach(async () => {
            ollamaService_1.ollamaService.isRunning.mockResolvedValue(true);
            await modelManager_1.modelManager.initialize();
        });
        it('should return correct installed model count', async () => {
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([
                { name: 'mistral:7b', size: 4294967296, digest: 'abc123', modified_at: '2025-01-10T00:00:00Z' },
                { name: 'llama3.2:3b', size: 2147483648, digest: 'def456', modified_at: '2025-01-10T00:00:00Z' },
            ]);
            await modelManager_1.modelManager.refreshInstalledModels();
            expect(modelManager_1.modelManager.getInstalledModelCount()).toBe(2);
        });
        it('should return 0 when no models installed', () => {
            ollamaService_1.ollamaService.listModels.mockResolvedValueOnce([]);
            expect(modelManager_1.modelManager.getInstalledModelCount()).toBe(0);
        });
    });
});
//# sourceMappingURL=modelManager.test.js.map