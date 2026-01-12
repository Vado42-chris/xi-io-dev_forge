/**
 * Ollama Provider
 * 
 * Model provider implementation for Ollama API.
 * Refactored from ollamaService.ts to implement ModelProvider interface.
 */

import { ModelProvider, ModelMetadata, GenerateRequest, GenerateResponse, GenerateOptions, HealthStatus, StreamChunk } from '../types';
import axios, { AxiosInstance } from 'axios';

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    repeat_penalty?: number;
    seed?: number;
  };
}

export class OllamaProvider implements ModelProvider {
  id: string = 'ollama';
  name: string = 'Ollama';
  type: 'ollama' = 'ollama';
  enabled: boolean = true;

  private baseUrl: string;
  private client: AxiosInstance;
  private timeout: number;
  private defaultOptions: OllamaRequest['options'];

  constructor(config?: {
    baseUrl?: string;
    timeout?: number;
    defaultOptions?: OllamaRequest['options'];
  }) {
    this.baseUrl = config?.baseUrl || 'http://localhost:11434';
    this.timeout = config?.timeout || 30000;
    this.defaultOptions = config?.defaultOptions || {
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      num_predict: 2048,
      repeat_penalty: 1.1
    };

    this.client = axios.create({
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
  async initialize(): Promise<void> {
    // Check if Ollama is available
    const health = await this.getHealth();
    if (!health.isHealthy) {
      throw new Error(`Ollama provider not available: ${health.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelMetadata[]> {
    try {
      const response = await this.client.get('/api/tags');
      const models: OllamaModel[] = response.data.models || [];

      return models.map(model => ({
        id: model.name,
        name: model.name,
        provider: 'ollama' as const,
        enabled: true,
        description: `Ollama model: ${model.name}`,
        parameters: {
          size: model.size,
          digest: model.digest,
          modified_at: model.modified_at
        }
      }));
    } catch (error: any) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }

  /**
   * Get a specific model
   */
  async getModel(id: string): Promise<ModelMetadata | null> {
    try {
      const models = await this.listModels();
      return models.find(m => m.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if model is available
   */
  async isModelAvailable(id: string): Promise<boolean> {
    const model = await this.getModel(id);
    return model !== null;
  }

  /**
   * Generate a response
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const modelId = request.modelId || (await this.listModels())[0]?.id;
      if (!modelId) {
        throw new Error('No model available');
      }

      const ollamaRequest: OllamaRequest = {
        model: modelId,
        prompt: request.prompt,
        stream: false,
        options: {
          ...this.defaultOptions,
          ...this.convertOptions(request.options)
        }
      };

      const response = await this.client.post<OllamaResponse>('/api/generate', ollamaRequest);

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
    } catch (error: any) {
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
  async *stream(request: GenerateRequest): AsyncGenerator<StreamChunk> {
    try {
      const modelId = request.modelId || (await this.listModels())[0]?.id;
      if (!modelId) {
        throw new Error('No model available');
      }

      const ollamaRequest: OllamaRequest = {
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
    } catch (error: any) {
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
  async getHealth(): Promise<HealthStatus> {
    try {
      const response = await this.client.get('/api/tags', { timeout: 5000 });
      return {
        isHealthy: response.status === 200,
        message: 'Ollama is available',
        lastChecked: new Date()
      };
    } catch (error: any) {
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
  async isAvailable(): Promise<boolean> {
    const health = await this.getHealth();
    return health.isHealthy;
  }

  /**
   * Convert GenerateOptions to Ollama options
   */
  private convertOptions(options?: GenerateOptions): OllamaRequest['options'] {
    if (!options) return {};

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
  private async *parseStream(stream: any): AsyncGenerator<OllamaResponse> {
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
          } catch (error) {
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
      } catch (error) {
        // Skip invalid JSON
      }
    }
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Cleanup if needed
  }
}

