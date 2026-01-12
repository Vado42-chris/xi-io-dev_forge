/**
 * Multi-Model Executor
 * 
 * Executes prompts across multiple AI models simultaneously.
 */

import { ModelManager, ModelInfo } from '../model-manager';
import { ollamaService, OllamaGenerateRequest } from './ollama-service';

export interface MultiModelRequest {
  prompt: string;
  modelIds: string[];
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

export interface MultiModelResponse {
  modelId: string;
  modelName: string;
  response: string;
  duration: number;
  error?: string;
}

export interface MultiModelResult {
  request: MultiModelRequest;
  responses: MultiModelResponse[];
  totalDuration: number;
  successCount: number;
  errorCount: number;
}

export class MultiModelExecutor {
  private modelManager: ModelManager;

  constructor(modelManager: ModelManager) {
    this.modelManager = modelManager;
  }

  /**
   * Execute prompt across multiple models
   */
  async execute(request: MultiModelRequest): Promise<MultiModelResult> {
    const startTime = Date.now();
    const selectedModels = this.modelManager.getSelectedModels();
    
    // Filter to only requested models that are available
    const modelsToUse = selectedModels.filter(m => 
      request.modelIds.includes(m.id) && m.status === 'available'
    );

    if (modelsToUse.length === 0) {
      throw new Error('No available models selected');
    }

    // Execute in parallel
    const promises = modelsToUse.map(model => this.executeOnModel(model, request));
    const responses = await Promise.allSettled(promises);

    // Process results
    const results: MultiModelResponse[] = [];
    let successCount = 0;
    let errorCount = 0;

    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        successCount++;
      } else {
        const model = modelsToUse[index];
        results.push({
          modelId: model.id,
          modelName: model.name,
          response: '',
          duration: 0,
          error: result.reason?.message || 'Unknown error',
        });
        errorCount++;
      }
    });

    const totalDuration = Date.now() - startTime;

    return {
      request,
      responses: results,
      totalDuration,
      successCount,
      errorCount,
    };
  }

  /**
   * Execute prompt on a single model
   */
  private async executeOnModel(
    model: ModelInfo,
    request: MultiModelRequest
  ): Promise<MultiModelResponse> {
    const startTime = Date.now();

    try {
      if (model.type === 'ollama') {
        // Extract model name from model info (e.g., "llama2" from "Llama 2")
        const modelName = model.name.toLowerCase().replace(/\s+/g, '');
        
        const ollamaRequest: OllamaGenerateRequest = {
          model: modelName,
          prompt: request.prompt,
          options: {
            temperature: request.options?.temperature,
            top_p: request.options?.top_p,
            num_predict: request.options?.max_tokens,
          },
        };

        const response = await ollamaService.generate(ollamaRequest);
        const duration = Date.now() - startTime;

        return {
          modelId: model.id,
          modelName: model.name,
          response: response.response,
          duration,
        };
      } else {
        throw new Error(`Unsupported model type: ${model.type}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      return {
        modelId: model.id,
        modelName: model.name,
        response: '',
        duration,
        error: error.message || 'Unknown error',
      };
    }
  }

  /**
   * Execute with streaming (returns first available response)
   */
  async *executeStream(request: MultiModelRequest): AsyncGenerator<MultiModelResponse, void, unknown> {
    const selectedModels = this.modelManager.getSelectedModels();
    const modelsToUse = selectedModels.filter(m => 
      request.modelIds.includes(m.id) && m.status === 'available'
    );

    if (modelsToUse.length === 0) {
      throw new Error('No available models selected');
    }

    // Execute on first available model with streaming
    const firstModel = modelsToUse[0];
    if (firstModel.type === 'ollama') {
      const modelName = firstModel.name.toLowerCase().replace(/\s+/g, '');
      const ollamaRequest: OllamaGenerateRequest = {
        model: modelName,
        prompt: request.prompt,
        options: request.options,
      };

      let fullResponse = '';
      const startTime = Date.now();

      for await (const chunk of ollamaService.generateStream(ollamaRequest)) {
        fullResponse += chunk;
        yield {
          modelId: firstModel.id,
          modelName: firstModel.name,
          response: fullResponse,
          duration: Date.now() - startTime,
        };
      }
    } else {
      throw new Error(`Streaming not supported for model type: ${firstModel.type}`);
    }
  }
}

