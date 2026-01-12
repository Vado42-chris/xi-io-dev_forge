"use strict";
/**
 * Parallel Execution Service - Comprehensive Test Suite
 *
 * Tests all functionality with yin/yang analysis:
 * - Parallel execution
 * - Streaming execution
 * - Timeout handling
 * - Error handling
 * - Result aggregation
 * - Progress tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
const parallelExecution_1 = require("../parallelExecution");
const modelManager_1 = require("../modelManager");
const ollamaService_1 = require("../ollamaService");
// Mock dependencies
jest.mock('../modelManager');
jest.mock('../ollamaService');
describe('ParallelExecutionService', () => {
    const mockModels = [
        {
            id: 'mistral-7b',
            name: 'mistral:7b',
            displayName: 'Mistral 7B',
            description: 'Test model',
            size: 4 * 1024 * 1024 * 1024,
            sizeFormatted: '4 GB',
            category: 'general',
            tags: ['free-tier'],
            isInstalled: true,
            isActive: false,
        },
        {
            id: 'llama3.2-3b',
            name: 'llama3.2:3b',
            displayName: 'Llama 3.2 3B',
            description: 'Test model',
            size: 2 * 1024 * 1024 * 1024,
            sizeFormatted: '2 GB',
            category: 'general',
            tags: ['free-tier'],
            isInstalled: true,
            isActive: false,
        },
    ];
    beforeEach(() => {
        jest.clearAllMocks();
        modelManager_1.modelManager.getInitialized.mockReturnValue(true);
        modelManager_1.modelManager.getInstalledModels.mockReturnValue(mockModels);
        modelManager_1.modelManager.getModel.mockImplementation((id) => {
            return mockModels.find(m => m.id === id);
        });
    });
    describe('executeParallel()', () => {
        it('should execute on all installed models when no modelIds provided', async () => {
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.totalModels).toBe(2);
            expect(result.results.length).toBe(2);
            expect(ollamaService_1.ollamaService.generate).toHaveBeenCalledTimes(2);
        });
        it('should execute on specified models when modelIds provided', async () => {
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
                modelIds: ['mistral-7b'],
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.totalModels).toBe(1);
            expect(result.results.length).toBe(1);
            expect(ollamaService_1.ollamaService.generate).toHaveBeenCalledTimes(1);
        });
        it('should throw error when no models available', async () => {
            modelManager_1.modelManager.getInstalledModels.mockReturnValue([]);
            const request = {
                prompt: 'Test prompt',
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('No models available for execution');
        });
        it('should throw error when modelManager not initialized', async () => {
            modelManager_1.modelManager.getInitialized.mockReturnValue(false);
            const request = {
                prompt: 'Test prompt',
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('ModelManager is not initialized');
        });
        it('should validate request prompt', async () => {
            const request = {
                prompt: '',
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('Prompt cannot be empty');
        });
        it('should validate request exists', async () => {
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(null)).rejects.toThrow('Request is required');
        });
        it('should handle timeout', async () => {
            ollamaService_1.ollamaService.generate.mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({
                        model: 'mistral:7b',
                        created_at: '2025-01-10T00:00:00Z',
                        response: 'Test response',
                        done: true,
                    }), 2000);
                });
            });
            const request = {
                prompt: 'Test prompt',
                timeout: 100, // Very short timeout
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            // Should have timeout errors
            expect(result.failed).toBeGreaterThan(0);
        });
        it('should track progress', async () => {
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const progressCallbacks = [];
            const request = {
                prompt: 'Test prompt',
            };
            await parallelExecution_1.parallelExecutionService.executeParallel(request, (completed, total) => {
                progressCallbacks.push({ completed, total });
            });
            expect(progressCallbacks.length).toBeGreaterThan(0);
            expect(progressCallbacks[progressCallbacks.length - 1].completed).toBe(2);
            expect(progressCallbacks[progressCallbacks.length - 1].total).toBe(2);
        });
        it('should handle partial failures', async () => {
            ollamaService_1.ollamaService.generate
                .mockResolvedValueOnce({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Success',
                done: true,
            })
                .mockRejectedValueOnce(new Error('Model error'));
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.successful).toBe(1);
            expect(result.failed).toBe(1);
            expect(result.totalModels).toBe(2);
        });
        it('should calculate total time', async () => {
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.totalTime).toBeGreaterThanOrEqual(0);
        });
        it('should select best response', async () => {
            ollamaService_1.ollamaService.generate
                .mockResolvedValueOnce({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Short',
                done: true,
            })
                .mockResolvedValueOnce({
                model: 'llama3.2:3b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'This is a longer and more detailed response that should be selected',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.bestResponse).toBeDefined();
            expect(result.bestResponse?.response.length).toBeGreaterThan('Short'.length);
        });
        it('should generate consensus', async () => {
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            expect(result.consensus).toBeDefined();
            expect(result.consensus?.length).toBeGreaterThan(0);
        });
        it('should filter out non-installed models from modelIds', async () => {
            const nonInstalledModel = {
                ...mockModels[0],
                id: 'non-installed',
                name: 'non-installed:model',
                isInstalled: false,
            };
            modelManager_1.modelManager.getModel.mockImplementation((id) => {
                if (id === 'non-installed')
                    return nonInstalledModel;
                return mockModels.find(m => m.id === id);
            });
            ollamaService_1.ollamaService.generate.mockResolvedValue({
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Test response',
                done: true,
            });
            const request = {
                prompt: 'Test prompt',
                modelIds: ['mistral-7b', 'non-installed'],
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallel(request);
            // Should only execute on installed model
            expect(result.totalModels).toBe(1);
            expect(ollamaService_1.ollamaService.generate).toHaveBeenCalledTimes(1);
        });
        it('should validate timeout value', async () => {
            const request = {
                prompt: 'Test prompt',
                timeout: -1,
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('Timeout must be a non-negative number');
        });
        it('should validate modelIds array', async () => {
            const request = {
                prompt: 'Test prompt',
                modelIds: [],
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('modelIds cannot be empty array');
        });
        it('should validate modelIds elements', async () => {
            const request = {
                prompt: 'Test prompt',
                modelIds: ['valid-id', ''],
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallel(request)).rejects.toThrow('modelIds[1] must be a non-empty string');
        });
    });
    describe('executeParallelStream()', () => {
        it('should stream responses from all models', async () => {
            ollamaService_1.ollamaService.generateStream.mockImplementation(async (request, onChunk) => {
                onChunk('Hello');
                onChunk(' World');
            });
            const chunks = [];
            const request = {
                prompt: 'Test prompt',
            };
            await parallelExecution_1.parallelExecutionService.executeParallelStream(request, (modelId, chunk) => {
                chunks.push({ modelId, chunk });
            });
            expect(chunks.length).toBeGreaterThan(0);
        });
        it('should handle stream errors', async () => {
            ollamaService_1.ollamaService.generateStream.mockRejectedValue(new Error('Stream error'));
            const request = {
                prompt: 'Test prompt',
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallelStream(request, () => { });
            expect(result.failed).toBeGreaterThan(0);
        });
        it('should handle stream timeout', async () => {
            ollamaService_1.ollamaService.generateStream.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 2000));
            });
            const request = {
                prompt: 'Test prompt',
                timeout: 100, // Very short timeout
            };
            const result = await parallelExecution_1.parallelExecutionService.executeParallelStream(request, () => { });
            expect(result.failed).toBeGreaterThan(0);
        });
        it('should call onComplete for each model', async () => {
            ollamaService_1.ollamaService.generateStream.mockImplementation(async (request, onChunk) => {
                onChunk('Response');
            });
            const completed = [];
            const request = {
                prompt: 'Test prompt',
            };
            await parallelExecution_1.parallelExecutionService.executeParallelStream(request, () => { }, (result) => {
                completed.push(result);
            });
            expect(completed.length).toBe(2);
        });
        it('should validate request for streaming', async () => {
            const request = {
                prompt: '',
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallelStream(request, () => { })).rejects.toThrow('Prompt cannot be empty');
        });
        it('should throw error when no models available for streaming', async () => {
            modelManager_1.modelManager.getInstalledModels.mockReturnValue([]);
            const request = {
                prompt: 'Test prompt',
            };
            await expect(parallelExecution_1.parallelExecutionService.executeParallelStream(request, () => { })).rejects.toThrow('No models available for execution');
        });
    });
});
//# sourceMappingURL=parallelExecution.test.js.map