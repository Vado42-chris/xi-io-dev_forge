"use strict";
/**
 * Anthropic API Provider
 *
 * Implementation for Anthropic Claude API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const baseApiProvider_1 = require("./baseApiProvider");
class AnthropicProvider extends baseApiProvider_1.BaseApiProvider {
    constructor(config) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://api.anthropic.com/v1',
            type: 'anthropic'
        });
    }
    /**
     * Make generate request to Anthropic API
     */
    async makeGenerateRequest(prompt, options) {
        const endpoint = this.config.endpoints?.generate || '/messages';
        const requestBody = {
            model: options?.model || 'claude-3-opus-20240229',
            max_tokens: options?.maxTokens || 1024,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature
        };
        const response = await this.client.post(endpoint, requestBody, {
            headers: {
                ...this.client.defaults.headers,
                'anthropic-version': '2023-06-01'
            }
        });
        return response.data.content[0].text;
    }
    /**
     * Make stream request to Anthropic API
     */
    async *makeStreamRequest(prompt, options) {
        const endpoint = this.config.endpoints?.stream || '/messages';
        const requestBody = {
            model: options?.model || 'claude-3-opus-20240229',
            max_tokens: options?.maxTokens || 1024,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature,
            stream: true
        };
        const response = await this.client.post(endpoint, requestBody, {
            responseType: 'stream',
            headers: {
                ...this.client.defaults.headers,
                'anthropic-version': '2023-06-01'
            }
        });
        // Parse SSE stream
        for await (const chunk of this.parseStream(response.data)) {
            yield chunk;
        }
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
                    try {
                        const json = JSON.parse(data);
                        if (json.type === 'content_block_delta') {
                            const content = json.delta?.text || '';
                            if (content) {
                                yield content;
                            }
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
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropicProvider.js.map