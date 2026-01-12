/**
 * GGUF Provider
 * 
 * Model provider implementation for direct GGUF file loading.
 * Uses node-llama-cpp for inference.
 */

import { ModelProvider, ModelMetadata, GenerateRequest, GenerateResponse, GenerateOptions, HealthStatus, StreamChunk } from '../types';
import * as fs from 'fs';
import * as path from 'path';

// Dynamic import for node-llama-cpp (ESM module)
let getLlama: any;
let LlamaChatSession: any;

export interface GGUFModelInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  quantization: string;
  contextSize: number;
  architecture: string;
  metadata?: {
    author?: string;
    description?: string;
    license?: string;
    created?: string;
  };
}

export interface GGUFModelInstance {
  model: GGUFModelInfo;
  instance: any; // LlamaChatSession
  loadedAt: Date;
  memoryUsage: number;
  isLoaded: boolean;
}

export class GGUFProvider implements ModelProvider {
  id: string = 'gguf';
  name: string = 'GGUF';
  type: 'gguf' = 'gguf';
  enabled: boolean = true;

  private modelsDirectory: string;
  private maxMemory: number;
  private llama: any; // Llama instance from node-llama-cpp
  private instances: Map<string, GGUFModelInstance> = new Map();
  private discoveredModels: Map<string, GGUFModelInfo> = new Map();

  constructor(config?: {
    modelsDirectory?: string;
    maxMemory?: number;
  }) {
    this.modelsDirectory = config?.modelsDirectory || '~/.dev-forge/models/gguf';
    this.maxMemory = config?.maxMemory || 4096; // MB
  }

  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import of node-llama-cpp (ESM module)
      const llamaModule = await import('node-llama-cpp');
      getLlama = llamaModule.getLlama || (llamaModule as any).default?.getLlama;
      LlamaChatSession = llamaModule.LlamaChatSession || (llamaModule as any).default?.LlamaChatSession;

      if (!getLlama) {
        throw new Error('node-llama-cpp not properly installed or API changed');
      }

      // Initialize llama.cpp
      this.llama = await getLlama();

      // Expand ~ to home directory
      this.modelsDirectory = this.expandPath(this.modelsDirectory);

      // Discover models
      await this.discoverModels();

      console.log(`[GGUFProvider] Initialized with ${this.discoveredModels.size} models`);
    } catch (error: any) {
      throw new Error(`Failed to initialize GGUF provider: ${error.message}`);
    }
  }

  /**
   * Expand ~ to home directory
   */
  private expandPath(filePath: string): string {
    if (filePath.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      return path.join(homeDir, filePath.slice(1));
    }
    return filePath;
  }

  /**
   * Discover GGUF models in directory
   */
  async discoverModels(directory?: string): Promise<ModelMetadata[]> {
    const dir = directory || this.modelsDirectory;

    try {
      // Check if directory exists
      if (!fs.existsSync(dir)) {
        console.warn(`[GGUFProvider] Directory does not exist: ${dir}`);
        return [];
      }

      // Read directory
      const files = await fs.promises.readdir(dir);
      const ggufFiles = files.filter(f => f.endsWith('.gguf'));

      const models: ModelMetadata[] = [];

      for (const file of ggufFiles) {
        try {
          const filePath = path.join(dir, file);
          const info = await this.getModelInfo(filePath);
          
          // Store discovered model
          this.discoveredModels.set(info.id, info);

          models.push({
            id: info.id,
            name: info.name,
            provider: 'gguf',
            enabled: true,
            description: `GGUF model: ${info.name} (${info.quantization})`,
            contextSize: info.contextSize,
            parameters: {
              path: info.path,
              size: info.size,
              quantization: info.quantization,
              architecture: info.architecture
            }
          });
        } catch (error) {
          console.error(`[GGUFProvider] Error processing ${file}:`, error);
        }
      }

      return models;
    } catch (error: any) {
      throw new Error(`Failed to discover GGUF models: ${error.message}`);
    }
  }

  /**
   * Get model info from GGUF file
   */
  private async getModelInfo(filePath: string): Promise<GGUFModelInfo> {
    try {
      const stats = await fs.promises.stat(filePath);
      const fileName = path.basename(filePath, '.gguf');
      
      // Extract quantization from filename (common patterns)
      let quantization = 'unknown';
      const qMatch = fileName.match(/q(\d+[km]?)/i);
      if (qMatch) {
        quantization = qMatch[0];
      }

      // Default context size (will be updated when model is loaded)
      let contextSize = 4096;

      return {
        id: fileName,
        name: fileName,
        path: filePath,
        size: stats.size,
        quantization,
        contextSize,
        architecture: 'llama' // Default, will be detected on load
      };
    } catch (error: any) {
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelMetadata[]> {
    // Refresh discovery if needed
    if (this.discoveredModels.size === 0) {
      await this.discoverModels();
    }

    return Array.from(this.discoveredModels.values()).map(info => ({
      id: info.id,
      name: info.name,
      provider: 'gguf',
      enabled: true,
      description: `GGUF model: ${info.name} (${info.quantization})`,
      contextSize: info.contextSize,
      parameters: {
        path: info.path,
        size: info.size,
        quantization: info.quantization
      }
    }));
  }

  /**
   * Get a specific model
   */
  async getModel(id: string): Promise<ModelMetadata | null> {
    const info = this.discoveredModels.get(id);
    if (!info) {
      return null;
    }

    return {
      id: info.id,
      name: info.name,
      provider: 'gguf',
      enabled: true,
      description: `GGUF model: ${info.name}`,
      contextSize: info.contextSize,
      parameters: {
        path: info.path,
        size: info.size,
        quantization: info.quantization
      }
    };
  }

  /**
   * Check if model is available
   */
  async isModelAvailable(id: string): Promise<boolean> {
    const info = this.discoveredModels.get(id);
    if (!info) {
      return false;
    }

    // Check if file exists
    return fs.existsSync(info.path);
  }

  /**
   * Load a GGUF model
   */
  async loadModel(modelId: string): Promise<GGUFModelInstance> {
    const info = this.discoveredModels.get(modelId);
    if (!info) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Check if already loaded
    const existing = this.instances.get(modelId);
    if (existing && existing.isLoaded) {
      return existing;
    }

    // Check memory
    if (!this.canLoadModel(info.size)) {
      throw new Error(`Not enough memory to load model: ${modelId}`);
    }

    try {
      // Load model
      const model = await this.llama.loadModel({ modelPath: info.path });
      const session = new LlamaChatSession({ model: model });

      // Estimate memory usage (rough estimate: model size + context)
      const memoryUsage = Math.ceil((info.size / (1024 * 1024)) + (info.contextSize * 4 / 1024)); // MB

      const instance: GGUFModelInstance = {
        model: info,
        instance: session,
        loadedAt: new Date(),
        memoryUsage,
        isLoaded: true
      };

      this.instances.set(modelId, instance);
      console.log(`[GGUFProvider] Loaded model: ${modelId} (${memoryUsage} MB)`);

      return instance;
    } catch (error: any) {
      throw new Error(`Failed to load model ${modelId}: ${error.message}`);
    }
  }

  /**
   * Unload a model
   */
  async unloadModel(modelId: string): Promise<void> {
    const instance = this.instances.get(modelId);
    if (!instance) {
      return;
    }

    try {
      // Dispose model
      if (instance.instance?.model?.dispose) {
        await instance.instance.model.dispose();
      }
      this.instances.delete(modelId);
      console.log(`[GGUFProvider] Unloaded model: ${modelId}`);
    } catch (error: any) {
      console.error(`[GGUFProvider] Error unloading model ${modelId}:`, error);
    }
  }

  /**
   * Generate a response
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const modelId = request.modelId || Array.from(this.discoveredModels.keys())[0];
      if (!modelId) {
        throw new Error('No model available');
      }

      // Load model if not loaded
      let instance = this.instances.get(modelId);
      if (!instance || !instance.isLoaded) {
        instance = await this.loadModel(modelId);
      }

      // Generate response
      const startTime = Date.now();
      const response = await instance.instance.prompt(request.prompt, {
        temperature: request.options?.temperature,
        topP: request.options?.topP,
        topK: request.options?.topK,
        maxTokens: request.options?.maxTokens
      });
      const duration = Date.now() - startTime;

      return {
        response,
        model: modelId,
        provider: 'gguf',
        success: true,
        metadata: {
          duration,
          tokensUsed: response.length // Rough estimate
        }
      };
    } catch (error: any) {
      return {
        response: '',
        model: request.modelId || 'unknown',
        provider: 'gguf',
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
      const modelId = request.modelId || Array.from(this.discoveredModels.keys())[0];
      if (!modelId) {
        throw new Error('No model available');
      }

      // Load model if not loaded
      let instance = this.instances.get(modelId);
      if (!instance || !instance.isLoaded) {
        instance = await this.loadModel(modelId);
      }

      // Stream response
      // Note: node-llama-cpp streaming API may vary by version
      // Using prompt with callback for streaming
      let fullResponse = '';
      await instance.instance.prompt(request.prompt, {
        temperature: request.options?.temperature,
        topP: request.options?.topP,
        topK: request.options?.topK,
        maxTokens: request.options?.maxTokens
      });

      // For now, yield the full response
      // In production, implement proper streaming based on node-llama-cpp version
      yield {
        text: fullResponse,
        done: true,
        model: modelId,
        provider: 'gguf'
      };
    } catch (error: any) {
      yield {
        text: '',
        done: true,
        model: request.modelId || 'unknown',
        provider: 'gguf'
      };
    }
  }

  /**
   * Check provider health
   */
  async getHealth(): Promise<HealthStatus> {
    try {
      // Check if llama.cpp is available
      if (!this.llama) {
        return {
          isHealthy: false,
          message: 'node-llama-cpp not initialized',
          lastChecked: new Date()
        };
      }

      // Check if models directory exists
      if (!fs.existsSync(this.modelsDirectory)) {
        return {
          isHealthy: false,
          message: `Models directory does not exist: ${this.modelsDirectory}`,
          lastChecked: new Date()
        };
      }

      return {
        isHealthy: true,
        message: `GGUF provider ready (${this.discoveredModels.size} models discovered)`,
        lastChecked: new Date(),
        details: {
          modelsDirectory: this.modelsDirectory,
          loadedModels: this.instances.size,
          availableMemory: this.getAvailableMemory()
        }
      };
    } catch (error: any) {
      return {
        isHealthy: false,
        message: error.message || 'Unknown error',
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
   * Check if we can load a model
   */
  private canLoadModel(modelSize: number): boolean {
    const modelSizeMB = modelSize / (1024 * 1024);
    const availableMemory = this.getAvailableMemory();
    return availableMemory >= modelSizeMB;
  }

  /**
   * Get available memory
   */
  private getAvailableMemory(): number {
    const used = Array.from(this.instances.values())
      .reduce((sum, inst) => sum + inst.memoryUsage, 0);
    return this.maxMemory - used;
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): number {
    return Array.from(this.instances.values())
      .reduce((sum, inst) => sum + inst.memoryUsage, 0);
  }

  /**
   * Dispose resources
   */
  async dispose(): Promise<void> {
    // Unload all models
    for (const modelId of Array.from(this.instances.keys())) {
      await this.unloadModel(modelId);
    }

    this.instances.clear();
    this.discoveredModels.clear();
  }
}

