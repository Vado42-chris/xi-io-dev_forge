"use strict";
/**
 * OpenAI API Provider
 *
 * Implementation for OpenAI-compatible APIs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const baseApiProvider_1 = require("./baseApiProvider");
class OpenAIProvider extends baseApiProvider_1.BaseApiProvider {
    constructor(config) {
        super({
            ...config,
            baseUrl: config.baseUrl || 'https://api.openai.com/v1',
            type: 'openai'
        });
    }
    /**
     * Make generate request to OpenAI API
     */
    async makeGenerateRequest(prompt, options) {
        const endpoint = this.config.endpoints?.generate || '/chat/completions';
        const requestBody = {
            model: options?.model || 'gpt-4',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: options?.temperature,
            max_tokens: options?.maxTokens,
            top_p: options?.topP,
            top_k: options?.topK
        };
        const response = await this.client.post(endpoint, requestBody);
        return response.data.choices[0].message.content;
    }
    /**
     * Make stream request to OpenAI API
     */
    async *makeStreamRequest(prompt, options) {
        const endpoint = this.config.endpoints?.stream || '/chat/completions';
        const requestBody = {
            model: options?.model || 'gpt-4',
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
                        const content = json.choices?.[0]?.delta?.content || '';
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
exports.OpenAIProvider = OpenAIProvider;
//# sourceMappingURL=openAiProvider.js.map