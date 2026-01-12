"use strict";
/**
 * Ollama Service - Wrapper for Ollama API
 *
 * Provides functions for:
 * - Listing available models
 * - Pulling/downloading models
 * - Executing prompts on models
 * - Managing model lifecycle
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaService = void 0;
class OllamaService {
    constructor(baseUrl = 'http://localhost:11434') {
        this.baseUrl = baseUrl;
        this.defaultOptions = {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 2048,
            repeat_penalty: 1.1,
        };
    }
    /**
     * List all available models
     */
    async listModels() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.models || [];
        }
        catch (error) {
            console.error('Error listing models:', error);
            throw new Error('Failed to list models. Is Ollama running?');
        }
    }
    /**
     * Pull/download a model
     */
    async pullModel(modelName, onProgress) {
        // Validate model name
        if (!modelName || typeof modelName !== 'string' || modelName.trim().length === 0) {
            throw new Error('Invalid model name');
        }
        try {
            const response = await fetch(`${this.baseUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: true }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.status) {
                            onProgress?.(data.status);
                        }
                        if (data.done) {
                            return;
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }
        catch (error) {
            console.error('Error pulling model:', error);
            throw new Error(`Failed to pull model: ${modelName}`);
        }
    }
    /**
     * Generate response from a model
     */
    async generate(request) {
        // Validate request
        this.validateRequest(request);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    options: { ...this.defaultOptions, ...request.options },
                }),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const data = await response.json();
            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format');
            }
            return data;
        }
        catch (error) {
            console.error('Error generating response:', error);
            if (error instanceof Error && error.message.includes('HTTP error')) {
                throw error;
            }
            throw new Error(`Failed to generate response from model: ${request.model}`);
        }
    }
    /**
     * Generate response with streaming
     */
    async generateStream(request, onChunk) {
        // Validate request
        this.validateRequest(request);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...request,
                    stream: true,
                    options: { ...this.defaultOptions, ...request.options },
                }),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            if (!response.body) {
                throw new Error('No response body');
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            onChunk(data.response);
                        }
                        if (data.done) {
                            return;
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }
        catch (error) {
            console.error('Error generating stream:', error);
            throw new Error(`Failed to generate stream from model: ${request.model}`);
        }
    }
    /**
     * Check if Ollama is running
     */
    async isRunning() {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        }
        catch {
            return false;
        }
    }
    /**
     * Get model info
     */
    async getModelInfo(modelName) {
        // Validate model name
        if (!modelName || typeof modelName !== 'string' || modelName.trim().length === 0) {
            return null;
        }
        try {
            const models = await this.listModels();
            return models.find(m => m.name === modelName) || null;
        }
        catch {
            return null;
        }
    }
    /**
     * Validate request before sending
     */
    validateRequest(request) {
        if (!request) {
            throw new Error('Request is required');
        }
        if (!request.model || typeof request.model !== 'string' || request.model.trim().length === 0) {
            throw new Error('Model name is required and must be a non-empty string');
        }
        if (!request.prompt || typeof request.prompt !== 'string') {
            throw new Error('Prompt is required and must be a string');
        }
        if (request.prompt.length === 0) {
            throw new Error('Prompt cannot be empty');
        }
        // Warn about very long prompts (but don't block)
        if (request.prompt.length > 100000) {
            console.warn('Very long prompt detected. Consider chunking for better performance.');
        }
        // Validate options if provided
        if (request.options) {
            if (request.options.temperature !== undefined &&
                (request.options.temperature < 0 || request.options.temperature > 2)) {
                throw new Error('Temperature must be between 0 and 2');
            }
            if (request.options.top_p !== undefined &&
                (request.options.top_p < 0 || request.options.top_p > 1)) {
                throw new Error('top_p must be between 0 and 1');
            }
            if (request.options.top_k !== undefined && request.options.top_k < 0) {
                throw new Error('top_k must be non-negative');
            }
            if (request.options.num_predict !== undefined && request.options.num_predict < 0) {
                throw new Error('num_predict must be non-negative');
            }
            if (request.options.repeat_penalty !== undefined && request.options.repeat_penalty < 0) {
                throw new Error('repeat_penalty must be non-negative');
            }
        }
    }
}
exports.ollamaService = new OllamaService();
//# sourceMappingURL=ollamaService.js.map