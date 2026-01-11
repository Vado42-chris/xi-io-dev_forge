/**
 * Parallel Execution Service
 * 
 * Executes prompts on multiple models simultaneously:
 * - True parallel execution (all models at once)
 * - Progressive results (show as they come in)
 * - Timeout management
 * - Error handling
 * - Result aggregation
 */

import { ollamaService, OllamaRequest, OllamaResponse } from './ollamaService';
import { modelManager, ModelMetadata } from './modelManager';

export interface ParallelExecutionRequest {
  prompt: string;
  modelIds?: string[]; // If not provided, uses all installed models
  timeout?: number; // Timeout in milliseconds (default: 30000)
  options?: OllamaRequest['options'];
}

export interface ModelResult {
  modelId: string;
  modelName: string;
  response: string;
  success: boolean;
  error?: string;
  latency?: number;
  timestamp: Date;
}

export interface ParallelExecutionResult {
  results: ModelResult[];
  totalModels: number;
  successful: number;
  failed: number;
  totalTime: number;
  consensus?: string;
  bestResponse?: ModelResult;
}

export class ParallelExecutionService {
  private defaultTimeout = 30000; // 30 seconds

  /**
   * Execute prompt on multiple models in parallel
   */
  async executeParallel(
    request: ParallelExecutionRequest,
    onProgress?: (completed: number, total: number, result?: ModelResult) => void
  ): Promise<ParallelExecutionResult> {
    // Validate request
    this.validateRequest(request);

    // Check if modelManager is initialized
    if (!modelManager.getInitialized()) {
      throw new Error('ModelManager is not initialized. Call modelManager.initialize() first.');
    }

    const startTime = Date.now();

    // Get models to execute on
    const models = this.getModelsToExecute(request.modelIds);
    
    if (models.length === 0) {
      throw new Error('No models available for execution. Install at least one model first.');
    }

    console.log(`[ParallelExecution] Executing on ${models.length} models`);

    // Execute on all models simultaneously
    let completedCount = 0;
    const promises = models.map((model, index) => 
      this.executeOnModel(model, request).then(result => {
        completedCount++;
        onProgress?.(completedCount, models.length, result);
        return result;
      })
    );

    // Wait for all to complete (or timeout)
    const results = await Promise.allSettled(promises);

    // Process results
    const modelResults: ModelResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          modelId: models[index].id,
          modelName: models[index].displayName,
          response: '',
          success: false,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date(),
        };
      }
    });

    const totalTime = Date.now() - startTime;
    const successful = modelResults.filter(r => r.success).length;
    const failed = modelResults.filter(r => !r.success).length;

    // Find best response
    const bestResponse = this.selectBestResponse(modelResults);

    // Generate consensus
    const consensus = this.generateConsensus(modelResults);

    return {
      results: modelResults,
      totalModels: models.length,
      successful,
      failed,
      totalTime,
      consensus,
      bestResponse,
    };
  }

  /**
   * Get models to execute on
   */
  private getModelsToExecute(modelIds?: string[]): ModelMetadata[] {
    if (modelIds && modelIds.length > 0) {
      return modelIds
        .map(id => modelManager.getModel(id))
        .filter((m): m is ModelMetadata => m !== undefined && m.isInstalled);
    }

    // Use all installed models
    return modelManager.getInstalledModels();
  }

  /**
   * Execute prompt on a single model
   */
  private async executeOnModel(
    model: ModelMetadata,
    request: ParallelExecutionRequest
  ): Promise<ModelResult> {
    const startTime = Date.now();
    const timeout = request.timeout || this.defaultTimeout;

    try {
      const ollamaRequest: OllamaRequest = {
        model: model.name,
        prompt: request.prompt,
        options: request.options,
      };

      // Execute with timeout - use AbortController for proper cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Note: ollamaService.generate doesn't support AbortSignal yet
        // This is a placeholder for future enhancement
        const response = await Promise.race([
          ollamaService.generate(ollamaRequest),
          this.createTimeout(timeout),
        ]) as OllamaResponse;

        clearTimeout(timeoutId);

      const latency = Date.now() - startTime;

      const result: ModelResult = {
        modelId: model.id,
        modelName: model.displayName,
        response: response.response,
        success: true,
        latency,
        timestamp: new Date(),
      };

        return result;
      } catch (raceError) {
        clearTimeout(timeoutId);
        throw raceError;
      }
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: ModelResult = {
        modelId: model.id,
        modelName: model.displayName,
        response: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
        timestamp: new Date(),
      };

      return result;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), ms);
    });
  }

  /**
   * Select best response from results
   */
  private selectBestResponse(results: ModelResult[]): ModelResult | undefined {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
      return undefined;
    }

    // Score responses based on multiple factors
    const scored = successful.map(result => {
      const latencyScore = result.latency && result.latency < 5000 ? 1.0 : 0.5;
      const lengthScore = result.response.length > 50 ? 1.0 : 0.5;
      const modelQuality = this.getModelQuality(result.modelId);
      
      const score = (latencyScore + lengthScore + modelQuality) / 3;
      return { result, score };
    });

    // Return highest scored result
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.result;
  }

  /**
   * Get model quality score (0-1)
   */
  private getModelQuality(modelId: string): number {
    const model = modelManager.getModel(modelId);
    if (!model) return 0.5;

    // Higher quality for larger models (generally)
    if (model.size > 5 * 1024 * 1024 * 1024) return 0.9; // > 5GB
    if (model.size > 3 * 1024 * 1024 * 1024) return 0.8; // > 3GB
    if (model.size > 1 * 1024 * 1024 * 1024) return 0.7; // > 1GB
    return 0.6; // Smaller models
  }

  /**
   * Generate consensus from multiple responses
   */
  private generateConsensus(results: ModelResult[]): string {
    const successful = results.filter(r => r.success && r.response.length > 0);
    if (successful.length === 0) {
      return '';
    }

    if (successful.length === 1) {
      return successful[0].response;
    }

    // Simple consensus: find most common response pattern
    // For now, return the best response
    const best = this.selectBestResponse(results);
    return best?.response || successful[0].response;
  }

  /**
   * Execute with streaming (progressive results)
   */
  async executeParallelStream(
    request: ParallelExecutionRequest,
    onChunk: (modelId: string, chunk: string) => void,
    onComplete?: (result: ModelResult) => void
  ): Promise<ParallelExecutionResult> {
    // Validate request
    this.validateRequest(request);

    // Check if modelManager is initialized
    if (!modelManager.getInitialized()) {
      throw new Error('ModelManager is not initialized. Call modelManager.initialize() first.');
    }

    const startTime = Date.now();

    // Get models to execute on
    const models = this.getModelsToExecute(request.modelIds);
    
    if (models.length === 0) {
      throw new Error('No models available for execution. Install at least one model first.');
    }

    console.log(`[ParallelExecution] Streaming on ${models.length} models`);

    // Execute on all models with streaming
    const promises = models.map(model => 
      this.executeOnModelStream(model, request, onChunk, onComplete)
    );

    // Wait for all to complete
    const results = await Promise.allSettled(promises);

    // Process results
    const modelResults: ModelResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          modelId: models[index].id,
          modelName: models[index].displayName,
          response: '',
          success: false,
          error: result.reason?.message || 'Unknown error',
          timestamp: new Date(),
        };
      }
    });

    const totalTime = Date.now() - startTime;
    const successful = modelResults.filter(r => r.success).length;
    const failed = modelResults.filter(r => !r.success).length;

    // Find best response
    const bestResponse = this.selectBestResponse(modelResults);

    // Generate consensus
    const consensus = this.generateConsensus(modelResults);

    return {
      results: modelResults,
      totalModels: models.length,
      successful,
      failed,
      totalTime,
      consensus,
      bestResponse,
    };
  }

  /**
   * Execute on a single model with streaming
   */
  private async executeOnModelStream(
    model: ModelMetadata,
    request: ParallelExecutionRequest,
    onChunk: (modelId: string, chunk: string) => void,
    onComplete?: (result: ModelResult) => void
  ): Promise<ModelResult> {
    const startTime = Date.now();
    const timeout = request.timeout || this.defaultTimeout;
    let fullResponse = '';

    try {
      const ollamaRequest: OllamaRequest = {
        model: model.name,
        prompt: request.prompt,
        options: request.options,
      };

      // Execute with streaming and timeout
      const streamPromise = new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Stream timeout'));
        }, timeout);

        ollamaService.generateStream(ollamaRequest, (chunk) => {
          fullResponse += chunk;
          onChunk(model.id, chunk);
        })
          .then(() => {
            clearTimeout(timeoutId);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });

      await streamPromise;

      const latency = Date.now() - startTime;

      const result: ModelResult = {
        modelId: model.id,
        modelName: model.displayName,
        response: fullResponse,
        success: true,
        latency,
        timestamp: new Date(),
      };

      onComplete?.(result);
      return result;
    } catch (error) {
      const latency = Date.now() - startTime;

      const result: ModelResult = {
        modelId: model.id,
        modelName: model.displayName,
        response: fullResponse,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
        timestamp: new Date(),
      };

      onComplete?.(result);
      return result;
    }
  }
}

  /**
   * Validate request
   */
  private validateRequest(request: ParallelExecutionRequest): void {
    if (!request) {
      throw new Error('Request is required');
    }

    if (!request.prompt || typeof request.prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (request.prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    // Warn about very long prompts
    if (request.prompt.length > 100000) {
      console.warn('[ParallelExecution] Very long prompt detected. Consider chunking for better performance.');
    }

    // Validate timeout if provided
    if (request.timeout !== undefined) {
      if (typeof request.timeout !== 'number' || request.timeout < 0) {
        throw new Error('Timeout must be a non-negative number');
      }
      if (request.timeout < 1000) {
        console.warn('[ParallelExecution] Timeout is very short (< 1 second). This may cause premature timeouts.');
      }
    }

    // Validate modelIds if provided
    if (request.modelIds !== undefined) {
      if (!Array.isArray(request.modelIds)) {
        throw new Error('modelIds must be an array');
      }
      if (request.modelIds.length === 0) {
        throw new Error('modelIds cannot be empty array. Omit to use all installed models.');
      }
      request.modelIds.forEach((id, index) => {
        if (typeof id !== 'string' || id.trim().length === 0) {
          throw new Error(`modelIds[${index}] must be a non-empty string`);
        }
      });
    }
  }
}

export const parallelExecutionService = new ParallelExecutionService();

