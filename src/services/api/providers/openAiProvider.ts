/**
 * OpenAI API Provider
 * 
 * Implementation for OpenAI-compatible APIs.
 */

import { BaseApiProvider } from './baseApiProvider';
import { ApiProviderConfig, GenerateOptions } from '../types';

export class OpenAIProvider extends BaseApiProvider {
  constructor(config: ApiProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      type: 'openai'
    });
  }

  /**
   * Make generate request to OpenAI API
   */
  protected async makeGenerateRequest(prompt: string, options?: GenerateOptions): Promise<string> {
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
  protected async *makeStreamRequest(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
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
  private async *parseStream(stream: any): AsyncGenerator<string> {
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
          } catch (error) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

