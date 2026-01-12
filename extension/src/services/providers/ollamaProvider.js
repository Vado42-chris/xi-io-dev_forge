"use strict";
/**
 * Ollama Provider
 *
 * Model provider implementation for Ollama API.
 * Refactored from ollamaService.ts to implement ModelProvider interface.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class OllamaProvider {
    constructor(config) {
        this.id = 'ollama';
        this.name = 'Ollama';
        this.type = 'ollama';
        this.enabled = true;
        this.baseUrl = config?.baseUrl || 'http://localhost:11434';
        this.timeout = config?.timeout || 30000;
        this.defaultOptions = config?.defaultOptions || {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 2048,
            repeat_penalty: 1.1
        };
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Initialize the provider
     */
    async initialize() {
        // Check if Ollama is available
        const health = await this.getHealth();
        if (!health.isHealthy) {
            throw new Error(`Ollama provider not available: ${health.message}`);
        }
    }
    /**
     * List available models
     */
    async listModels() {
        try {
            const response = await this.client.get('/api/tags');
            const models = response.data.models || [];
            return models.map(model => ({
                id: model.name,
                name: model.name,
                provider: 'ollama',
                enabled: true,
                description: `Ollama model: ${model.name}`,
                parameters: {
                    size: model.size,
                    digest: model.digest,
                    modified_at: model.modified_at
                }
            }));
        }
        catch (error) {
            throw new Error(`Failed to list Ollama models: ${error.message}`);
        }
    }
    /**
     * Get a specific model
     */
    async getModel(id) {
        try {
            const models = await this.listModels();
            return models.find(m => m.id === id) || null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Check if model is available
     */
    async isModelAvailable(id) {
        const model = await this.getModel(id);
        return model !== null;
    }
    /**
     * Generate a response
     */
    async generate(request) {
        try {
            const modelId = request.modelId || (await this.listModels())[0]?.id;
            if (!modelId) {
                throw new Error('No model available');
            }
            const ollamaRequest = {
                model: modelId,
                prompt: request.prompt,
                stream: false,
                options: {
                    ...this.defaultOptions,
                    ...this.convertOptions(request.options)
                }
            };
            const response = await this.client.post('/api/generate', ollamaRequest);
            return {
                response: response.data.response,
                model: modelId,
                provider: 'ollama',
                success: true,
                metadata: {
                    tokensUsed: response.data.eval_count,
                    duration: response.data.total_duration
                }
            };
        }
        catch (error) {
            return {
                response: '',
                model: request.modelId || 'unknown',
                provider: 'ollama',
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
    /**
     * Stream a response
     */
    async *stream(request) {
        try {
            const modelId = request.modelId || (await this.listModels())[0]?.id;
            if (!modelId) {
                throw new Error('No model available');
            }
            const ollamaRequest = {
                model: modelId,
                prompt: request.prompt,
                stream: true,
                options: {
                    ...this.defaultOptions,
                    ...this.convertOptions(request.options)
                }
            };
            const response = await this.client.post('/api/generate', ollamaRequest, {
                responseType: 'stream'
            });
            for await (const chunk of this.parseStream(response.data)) {
                yield {
                    text: chunk.response || '',
                    done: chunk.done || false,
                    model: modelId,
                    provider: 'ollama'
                };
            }
        }
        catch (error) {
            yield {
                text: '',
                done: true,
                model: request.modelId || 'unknown',
                provider: 'ollama'
            };
        }
    }
    /**
     * Check provider health
     */
    async getHealth() {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 });
            return {
                isHealthy: response.status === 200,
                message: 'Ollama is available',
                lastChecked: new Date()
            };
        }
        catch (error) {
            return {
                isHealthy: false,
                message: error.message || 'Ollama is not available',
                lastChecked: new Date()
            };
        }
    }
    /**
     * Check if provider is available
     */
    async isAvailable() {
        const health = await this.getHealth();
        return health.isHealthy;
    }
    /**
     * Convert GenerateOptions to Ollama options
     */
    convertOptions(options) {
        if (!options)
            return {};
        return {
            temperature: options.temperature,
            top_p: options.topP,
            top_k: options.topK,
            num_predict: options.maxTokens,
            seed: options.seed
        };
    }
    /**
     * Parse stream response
     */
    async *parseStream(stream) {
        const decoder = new TextDecoder();
        let buffer = '';
        for await (const chunk of stream) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        yield data;
                    }
                    catch (error) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        // Process remaining buffer
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                yield data;
            }
            catch (error) {
                // Skip invalid JSON
            }
        }
    }
    /**
     * Dispose resources
     */
    async dispose() {
        // Cleanup if needed
    }
}
exports.OllamaProvider = OllamaProvider;
//# sourceMappingURL=ollamaProvider.js.map