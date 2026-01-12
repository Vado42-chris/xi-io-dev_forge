"use strict";
/**
 * Ollama Service - Comprehensive Test Suite
 *
 * Tests all functionality with yin/yang analysis:
 * - Connection handling
 * - Model management
 * - Request/response handling
 * - Streaming
 * - Error handling
 * - Edge cases
 */
Object.defineProperty(exports, "__esModule", { value: true });
const ollamaService_1 = require("../ollamaService");
describe('OllamaService', () => {
    const originalFetch = global.fetch;
    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = jest.fn();
    });
    afterEach(() => {
        global.fetch = originalFetch;
    });
    describe('isRunning()', () => {
        it('should return true when Ollama is running', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: [] }),
            });
            const result = await ollamaService_1.ollamaService.isRunning();
            expect(result).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
        });
        it('should return false when Ollama is not running', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Connection refused'));
            const result = await ollamaService_1.ollamaService.isRunning();
            expect(result).toBe(false);
        });
        it('should return false on HTTP error', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });
            const result = await ollamaService_1.ollamaService.isRunning();
            expect(result).toBe(false);
        });
    });
    describe('listModels()', () => {
        it('should return list of models when available', async () => {
            const mockModels = [
                {
                    name: 'mistral:7b',
                    size: 4294967296,
                    digest: 'abc123',
                    modified_at: '2025-01-10T00:00:00Z',
                },
                {
                    name: 'llama3.2:3b',
                    size: 2147483648,
                    digest: 'def456',
                    modified_at: '2025-01-10T00:00:00Z',
                },
            ];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: mockModels }),
            });
            const result = await ollamaService_1.ollamaService.listModels();
            expect(result).toEqual(mockModels);
            expect(result.length).toBe(2);
        });
        it('should return empty array when no models', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: [] }),
            });
            const result = await ollamaService_1.ollamaService.listModels();
            expect(result).toEqual([]);
        });
        it('should handle missing models property', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            });
            const result = await ollamaService_1.ollamaService.listModels();
            expect(result).toEqual([]);
        });
        it('should throw error when Ollama is not running', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Connection refused'));
            await expect(ollamaService_1.ollamaService.listModels()).rejects.toThrow('Failed to list models. Is Ollama running?');
        });
        it('should handle network timeout', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network timeout'));
            await expect(ollamaService_1.ollamaService.listModels()).rejects.toThrow();
        });
    });
    describe('pullModel()', () => {
        it('should pull model with progress tracking', async () => {
            const progressCallbacks = [];
            // Mock streaming response
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ status: 'pulling manifest' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ status: 'downloading' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ status: 'downloading', completed: 50 }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ status: 'downloading', completed: 100 }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'));
                    controller.close();
                },
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream,
            });
            await ollamaService_1.ollamaService.pullModel('mistral:7b', (progress) => {
                progressCallbacks.push(progress);
            });
            expect(progressCallbacks.length).toBeGreaterThan(0);
            expect(progressCallbacks).toContain('pulling manifest');
        });
        it('should handle pull errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Model not found'));
            await expect(ollamaService_1.ollamaService.pullModel('invalid:model')).rejects.toThrow('Failed to pull model: invalid:model');
        });
        it('should handle empty response body', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: null,
            });
            await expect(ollamaService_1.ollamaService.pullModel('mistral:7b')).rejects.toThrow('No response body');
        });
        it('should handle invalid JSON in stream', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('invalid json\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'));
                    controller.close();
                },
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream,
            });
            // Should not throw, just skip invalid JSON
            await expect(ollamaService_1.ollamaService.pullModel('mistral:7b')).resolves.not.toThrow();
        });
    });
    describe('generate()', () => {
        it('should generate response from model', async () => {
            const mockResponse = {
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'This is a test response',
                done: true,
                total_duration: 1000,
                load_duration: 100,
                prompt_eval_count: 10,
                prompt_eval_duration: 200,
                eval_count: 20,
                eval_duration: 700,
            };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test prompt',
            };
            const result = await ollamaService_1.ollamaService.generate(request);
            expect(result).toEqual(mockResponse);
            expect(result.response).toBe('This is a test response');
        });
        it('should use default options when not provided', async () => {
            const mockResponse = {
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Response',
                done: true,
            };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await ollamaService_1.ollamaService.generate(request);
            const fetchCall = global.fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            expect(requestBody.options).toBeDefined();
            expect(requestBody.options.temperature).toBe(0.7);
            expect(requestBody.options.top_p).toBe(0.9);
        });
        it('should merge custom options with defaults', async () => {
            const mockResponse = {
                model: 'mistral:7b',
                created_at: '2025-01-10T00:00:00Z',
                response: 'Response',
                done: true,
            };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
                options: {
                    temperature: 0.9,
                },
            };
            await ollamaService_1.ollamaService.generate(request);
            const fetchCall = global.fetch.mock.calls[0];
            const requestBody = JSON.parse(fetchCall[1].body);
            expect(requestBody.options.temperature).toBe(0.9); // Custom overrides default
            expect(requestBody.options.top_p).toBe(0.9); // Default preserved
        });
        it('should handle HTTP errors', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            const request = {
                model: 'nonexistent:model',
                prompt: 'Test',
            };
            await expect(ollamaService_1.ollamaService.generate(request)).rejects.toThrow('Failed to generate response from model: nonexistent:model');
        });
        it('should handle network errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await expect(ollamaService_1.ollamaService.generate(request)).rejects.toThrow();
        });
        it('should handle empty response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    model: 'mistral:7b',
                    created_at: '2025-01-10T00:00:00Z',
                    response: '',
                    done: true,
                }),
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            const result = await ollamaService_1.ollamaService.generate(request);
            expect(result.response).toBe('');
        });
    });
    describe('generateStream()', () => {
        it('should stream response chunks', async () => {
            const chunks = [];
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ response: 'Hello' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ response: ' World' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ response: '!' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'));
                    controller.close();
                },
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await ollamaService_1.ollamaService.generateStream(request, (chunk) => {
                chunks.push(chunk);
            });
            expect(chunks).toEqual(['Hello', ' World', '!']);
        });
        it('should handle stream errors', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Stream error'));
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await expect(ollamaService_1.ollamaService.generateStream(request, () => { })).rejects.toThrow('Failed to generate stream from model: mistral:7b');
        });
        it('should handle empty response body in stream', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: null,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await expect(ollamaService_1.ollamaService.generateStream(request, () => { })).rejects.toThrow('No response body');
        });
        it('should handle invalid JSON in stream', async () => {
            const chunks = [];
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('invalid json\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ response: 'Valid' }) + '\n'));
                    controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'));
                    controller.close();
                },
            });
            global.fetch.mockResolvedValueOnce({
                ok: true,
                body: mockStream,
            });
            const request = {
                model: 'mistral:7b',
                prompt: 'Test',
            };
            await ollamaService_1.ollamaService.generateStream(request, (chunk) => {
                chunks.push(chunk);
            });
            // Should only capture valid chunks
            expect(chunks).toEqual(['Valid']);
        });
    });
    describe('getModelInfo()', () => {
        it('should return model info when model exists', async () => {
            const mockModels = [
                {
                    name: 'mistral:7b',
                    size: 4294967296,
                    digest: 'abc123',
                    modified_at: '2025-01-10T00:00:00Z',
                },
            ];
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: mockModels }),
            });
            const result = await ollamaService_1.ollamaService.getModelInfo('mistral:7b');
            expect(result).toEqual(mockModels[0]);
        });
        it('should return null when model does not exist', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ models: [] }),
            });
            const result = await ollamaService_1.ollamaService.getModelInfo('nonexistent:model');
            expect(result).toBeNull();
        });
        it('should return null on error', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Error'));
            const result = await ollamaService_1.ollamaService.getModelInfo('mistral:7b');
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=ollamaService.test.js.map