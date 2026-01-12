/**
 * Anthropic API Provider
 * 
 * Implementation for Anthropic Claude API.
 */

import { BaseApiProvider } from './baseApiProvider';
import { ApiProviderConfig } from '../types';
import type { GenerateOptions } from '../../types';

export class AnthropicProvider extends BaseApiProvider {
  constructor(config: ApiProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.anthropic.com/v1',
      type: 'anthropic'
    });
  }

  /**
   * Make generate request to Anthropic API
   */
  protected async makeGenerateRequest(prompt: string, options?: GenerateOptions): Promise<string> {
    const endpoint = this.config.endpoints?.generate || '/messages';
    
    const requestBody = {
      model: options?.model || 'claude-3-opus-20240229',
      max_tokens: options?.maxTokens || 1024,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature
    };

    const headers: Record<string, string> = {
      'anthropic-version': '2023-06-01'
    };
    
    // Copy default headers
    if (this.client.defaults.headers) {
      const defaultHeaders = this.client.defaults.headers as any;
      if (defaultHeaders.common) {
        Object.assign(headers, defaultHeaders.common);
      }
      Object.keys(defaultHeaders).forEach(key => {
        if (key !== 'common' && typeof defaultHeaders[key] === 'string') {
          headers[key] = defaultHeaders[key];
        }
      });
    }

    const response = await this.client.post(endpoint, requestBody, { headers });
    
    return response.data.content[0].text;
  }

  /**
   * Make stream request to Anthropic API
   */
  protected async *makeStreamRequest(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
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
        'anthropic-version': '2023-06-01',
        ...(this.client.defaults.headers.common || {}),
        ...(this.client.defaults.headers as Record<string, string>)
      } as Record<string, string>
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
          try {
            const json = JSON.parse(data);
            if (json.type === 'content_block_delta') {
              const content = json.delta?.text || '';
              if (content) {
                yield content;
              }
            }
          } catch (error) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

