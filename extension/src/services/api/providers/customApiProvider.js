"use strict";
/**
 * Custom API Provider
 *
 * Generic implementation for custom API endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomApiProvider = void 0;
const baseApiProvider_1 = require("./baseApiProvider");
class CustomApiProvider extends baseApiProvider_1.BaseApiProvider {
    constructor(config) {
        super({
            ...config,
            type: 'custom'
        });
    }
    /**
     * Make generate request to custom API
     */
    async makeGenerateRequest(prompt, options) {
        const endpoint = this.config.endpoints?.generate || '/generate';
        let requestBody = {
            prompt,
            ...options
        };
        // Apply request transformer if provided
        if (this.config.requestTransformer) {
            requestBody = this.config.requestTransformer(requestBody);
        }
        const response = await this.client.post(endpoint, requestBody);
        // Apply response transformer if provided
        if (this.config.responseTransformer) {
            return this.config.responseTransformer(response.data);
        }
        // Default: try common response formats
        return response.data.choices?.[0]?.message?.content ||
            response.data.content ||
            response.data.text ||
            response.data.response ||
            JSON.stringify(response.data);
    }
    /**
     * Make stream request to custom API
     */
    async *makeStreamRequest(prompt, options) {
        const endpoint = this.config.endpoints?.stream || '/stream';
        let requestBody = {
            prompt,
            ...options,
            stream: true
        };
        // Apply request transformer if provided
        if (this.config.requestTransformer) {
            requestBody = this.config.requestTransformer(requestBody);
        }
        const response = await this.client.post(endpoint, requestBody, {
            responseType: 'stream'
        });
        // Parse stream (SSE or JSON lines)
        for await (const chunk of this.parseStream(response.data)) {
            yield chunk;
        }
    }
    /**
     * Parse stream (supports SSE and JSON lines)
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
                    // Try SSE format
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            return;
                        }
                        try {
                            const json = JSON.parse(data);
                            const content = json.content || json.text || json.delta?.content || '';
                            if (content) {
                                yield content;
                            }
                        }
                        catch (error) {
                            // Skip invalid JSON
                        }
                    }
                    else {
                        // Try JSON lines format
                        try {
                            const json = JSON.parse(line);
                            const content = json.content || json.text || json.delta?.content || '';
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
}
exports.CustomApiProvider = CustomApiProvider;
//# sourceMappingURL=customApiProvider.js.map