/**
 * Custom API Provider
 * 
 * Generic implementation for custom API endpoints.
 */

import { BaseApiProvider } from './baseApiProvider';
import { ApiProviderConfig, GenerateOptions } from '../types';

export class CustomApiProvider extends BaseApiProvider {
  constructor(config: ApiProviderConfig) {
    super({
      ...config,
      type: 'custom'
    });
  }

  /**
   * Make generate request to custom API
   */
  protected async makeGenerateRequest(prompt: string, options?: GenerateOptions): Promise<string> {
    const endpoint = this.config.endpoints?.generate || '/generate';
    
    let requestBody: any = {
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
  protected async *makeStreamRequest(prompt: string, options?: GenerateOptions): AsyncGenerator<string> {
    const endpoint = this.config.endpoints?.stream || '/stream';
    
    let requestBody: any = {
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
  private async *parseStream(stream: any): AsyncGenerator<string> {
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
            } catch (error) {
              // Skip invalid JSON
            }
          } else {
            // Try JSON lines format
            try {
              const json = JSON.parse(line);
              const content = json.content || json.text || json.delta?.content || '';
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
}

