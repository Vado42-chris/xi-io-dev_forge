"use strict";
/**
 * Cursor API Provider
 *
 * Implementation for Cursor API integration.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CursorApiProvider = void 0;
const baseApiProvider_1 = require("./baseApiProvider");
class CursorApiProvider extends baseApiProvider_1.BaseApiProvider {
    constructor(config) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://api.cursor.sh',
            type: 'cursor'
        });
        this.workspaceId = config.workspaceId;
    }
    /**
     * Make generate request to Cursor API
     */
    async makeGenerateRequest(prompt, options) {
        const endpoint = this.config.endpoints?.generate || '/v1/chat/completions';
        const requestBody = {
            model: options?.model || 'default',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
            stream: false
        };
        // Apply request transformer if provided
        const body = this.config.requestTransformer
            ? this.config.requestTransformer(requestBody)
            : requestBody;
        const response = await this.client.post(endpoint, body);
        // Apply response transformer if provided
        if (this.config.responseTransformer) {
            return this.config.responseTransformer(response.data);
        }
        // Default: assume OpenAI-compatible format
        return response.data.choices?.[0]?.message?.content ||
            response.data.content ||
            response.data.text ||
            JSON.stringify(response.data);
    }
    /**
     * Make stream request to Cursor API
     */
    async *makeStreamRequest(prompt, options) {
        const endpoint = this.config.endpoints?.stream || '/v1/chat/completions';
        const requestBody = {
            model: options?.model || 'default',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
            stream: true
        };
        const response = await this.client.post(endpoint, requestBody, {
            responseType: 'stream'
        });
        // Parse SSE stream
        for await (const chunk of this.parseStream(response.data)) {
            yield chunk;
        }
    }
    /**
     * Get workspace context (Cursor-specific)
     */
    async getContext(workspaceId) {
        const id = workspaceId || this.workspaceId;
        if (!id) {
            throw new Error('Workspace ID required');
        }
        const response = await this.client.get(`/v1/workspace/${id}/context`);
        return response.data;
    }
    /**
     * Get completions (Cursor-specific)
     */
    async getCompletions(workspaceId) {
        const id = workspaceId || this.workspaceId;
        if (!id) {
            throw new Error('Workspace ID required');
        }
        const response = await this.client.get(`/v1/workspace/${id}/completions`);
        return response.data;
    }
    /**
     * Parse SSE stream
     */
    async *parseStream(stream) {
        const decoder = new TextDecoder();
        let buffer = '';
        for await (const chunk of stream) {
            buffer += decoder.decode(chunk, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content ||
                            json.content ||
                            json.text ||
                            '';
                        if (content) {
                            yield content;
                        }
                    }
                    catch (error) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }
}
exports.CursorApiProvider = CursorApiProvider;
//# sourceMappingURL=cursorApiProvider.js.map