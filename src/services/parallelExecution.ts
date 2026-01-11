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
    const startTime = Date.now();

    // Get models to execute on
    const models = this.getModelsToExecute(request.modelIds);
    
    if (models.length === 0) {
      throw new Error('No models available for execution');
    }

    console.log(`[ParallelExecution] Executing on ${models.length} models`);

    // Execute on all models simultaneously
    const promises = models.map(model => 
      this.executeOnModel(model, request, onProgress)
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
    request: ParallelExecutionRequest,
    onProgress?: (completed: number, total: number, result?: ModelResult) => void
  ): Promise<ModelResult> {
    const startTime = Date.now();

    try {
      const ollamaRequest: OllamaRequest = {
        model: model.name,
        prompt: request.prompt,
        options: request.options,
      };

      // Execute with timeout
      const response = await Promise.race([
        ollamaService.generate(ollamaRequest),
        this.createTimeout(request.timeout || this.defaultTimeout),
      ]) as OllamaResponse;

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
    const startTime = Date.now();

    // Get models to execute on
    const models = this.getModelsToExecute(request.modelIds);
    
    if (models.length === 0) {
      throw new Error('No models available for execution');
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
    let fullResponse = '';

    try {
      const ollamaRequest: OllamaRequest = {
        model: model.name,
        prompt: request.prompt,
        options: request.options,
      };

      // Execute with streaming
      await ollamaService.generateStream(ollamaRequest, (chunk) => {
        fullResponse += chunk;
        onChunk(model.id, chunk);
      });

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

export const parallelExecutionService = new ParallelExecutionService();

