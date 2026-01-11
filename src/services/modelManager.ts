/**
 * Model Manager Service
 * 
 * Manages AI models for Dev Forge:
 * - Model discovery
 * - Model loading/unloading
 * - Model health monitoring
 * - Model switching
 * - Model metadata
 */

import { ollamaService, OllamaModel } from './ollamaService';

export interface ModelMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  size: number;
  sizeFormatted: string;
  category: 'coding' | 'general' | 'reasoning' | 'multimodal' | 'embedding';
  tags: string[];
  isInstalled: boolean;
  isActive: boolean;
  performance?: {
    latency?: number;
    accuracy?: number;
    quality?: number;
  };
}

export class ModelManager {
  private models: Map<string, ModelMetadata> = new Map();
  private activeModelId: string | null = null;
  private installedModels: OllamaModel[] = [];

  /**
   * Initialize model manager
   */
  async initialize(): Promise<void> {
    console.log('[ModelManager] Initializing...');
    
    // Check if Ollama is running
    const isRunning = await ollamaService.isRunning();
    if (!isRunning) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }

    // Load installed models
    await this.refreshInstalledModels();

    // Register available models
    this.registerModels();

    console.log(`[ModelManager] Initialized with ${this.models.size} models`);
  }

  /**
   * Refresh list of installed models from Ollama
   */
  async refreshInstalledModels(): Promise<void> {
    try {
      this.installedModels = await ollamaService.listModels();
      console.log(`[ModelManager] Found ${this.installedModels.length} installed models`);
    } catch (error) {
      console.error('[ModelManager] Error refreshing installed models:', error);
      this.installedModels = [];
    }
  }

  /**
   * Register all available models
   */
  private registerModels(): void {
    // Free Tier Models
    this.registerModel({
      id: 'deepseek-r1-7b',
      name: 'deepseek-r1:7b',
      displayName: 'DeepSeek R1 7B',
      description: 'Reasoning and coding model, GPT-4 class',
      size: 4 * 1024 * 1024 * 1024, // 4 GB
      sizeFormatted: '4 GB',
      category: 'reasoning',
      tags: ['coding', 'reasoning', 'free-tier'],
      isInstalled: this.isModelInstalled('deepseek-r1:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'qwen2.5-7b',
      name: 'qwen2.5:7b',
      displayName: 'Qwen 2.5 7B',
      description: 'Multilingual and multimodal model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'general',
      tags: ['multilingual', 'multimodal', 'free-tier'],
      isInstalled: this.isModelInstalled('qwen2.5:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'mistral-7b',
      name: 'mistral:7b',
      displayName: 'Mistral 7B',
      description: 'Efficient general purpose model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'general',
      tags: ['efficient', 'general', 'free-tier'],
      isInstalled: this.isModelInstalled('mistral:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'llama3.2-3b',
      name: 'llama3.2:3b',
      displayName: 'Llama 3.2 3B',
      description: 'Lightweight and efficient model',
      size: 2 * 1024 * 1024 * 1024,
      sizeFormatted: '2 GB',
      category: 'general',
      tags: ['lightweight', 'efficient', 'free-tier'],
      isInstalled: this.isModelInstalled('llama3.2:3b'),
      isActive: false,
    });

    this.registerModel({
      id: 'gemma2-7b',
      name: 'gemma2:7b',
      displayName: 'Gemma 2 7B',
      description: 'Google\'s lightweight model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'general',
      tags: ['google', 'lightweight', 'free-tier'],
      isInstalled: this.isModelInstalled('gemma2:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'codellama-7b',
      name: 'codellama:7b',
      displayName: 'CodeLlama 7B',
      description: 'Specialized coding model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'coding',
      tags: ['coding', 'specialized', 'free-tier'],
      isInstalled: this.isModelInstalled('codellama:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'phi3-3.8b',
      name: 'phi3:3.8b',
      displayName: 'Phi-3 3.8B',
      description: 'Microsoft\'s efficient model',
      size: 2.5 * 1024 * 1024 * 1024,
      sizeFormatted: '2.5 GB',
      category: 'general',
      tags: ['microsoft', 'efficient', 'free-tier'],
      isInstalled: this.isModelInstalled('phi3:3.8b'),
      isActive: false,
    });

    this.registerModel({
      id: 'tinyllama-1.1b',
      name: 'tinyllama:1.1b',
      displayName: 'TinyLlama 1.1B',
      description: 'Ultra-lightweight model',
      size: 0.6 * 1024 * 1024 * 1024,
      sizeFormatted: '0.6 GB',
      category: 'general',
      tags: ['ultra-lightweight', 'free-tier'],
      isInstalled: this.isModelInstalled('tinyllama:1.1b'),
      isActive: false,
    });

    this.registerModel({
      id: 'starcoder-7b',
      name: 'starcoder:7b',
      displayName: 'StarCoder 7B',
      description: 'Code generation model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'coding',
      tags: ['coding', 'generation', 'free-tier'],
      isInstalled: this.isModelInstalled('starcoder:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'neural-chat-7b',
      name: 'neural-chat:7b',
      displayName: 'Neural Chat 7B',
      description: 'Intel\'s chat model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'general',
      tags: ['intel', 'chat', 'free-tier'],
      isInstalled: this.isModelInstalled('neural-chat:7b'),
      isActive: false,
    });

    this.registerModel({
      id: 'llava-7b',
      name: 'llava:7b',
      displayName: 'LLaVA 7B',
      description: 'Vision-language model',
      size: 4 * 1024 * 1024 * 1024,
      sizeFormatted: '4 GB',
      category: 'multimodal',
      tags: ['vision', 'multimodal', 'free-tier'],
      isInstalled: this.isModelInstalled('llava:7b'),
      isActive: false,
    });
  }

  /**
   * Register a model
   */
  private registerModel(metadata: ModelMetadata): void {
    this.models.set(metadata.id, metadata);
  }

  /**
   * Check if a model is installed
   */
  private isModelInstalled(modelName: string): boolean {
    return this.installedModels.some(m => m.name === modelName);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelMetadata[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by category
   */
  getModelsByCategory(category: ModelMetadata['category']): ModelMetadata[] {
    return this.getAllModels().filter(m => m.category === category);
  }

  /**
   * Get free tier models
   */
  getFreeTierModels(): ModelMetadata[] {
    return this.getAllModels().filter(m => m.tags.includes('free-tier'));
  }

  /**
   * Get installed models
   */
  getInstalledModels(): ModelMetadata[] {
    return this.getAllModels().filter(m => m.isInstalled);
  }

  /**
   * Get model by ID
   */
  getModel(id: string): ModelMetadata | undefined {
    return this.models.get(id);
  }

  /**
   * Set active model
   */
  setActiveModel(id: string): void {
    const model = this.models.get(id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }
    if (!model.isInstalled) {
      throw new Error(`Model not installed: ${id}`);
    }

    // Deactivate current model
    if (this.activeModelId) {
      const currentModel = this.models.get(this.activeModelId);
      if (currentModel) {
        currentModel.isActive = false;
      }
    }

    // Activate new model
    this.activeModelId = id;
    model.isActive = true;

    console.log(`[ModelManager] Activated model: ${model.displayName}`);
  }

  /**
   * Get active model
   */
  getActiveModel(): ModelMetadata | null {
    if (!this.activeModelId) {
      return null;
    }
    return this.models.get(this.activeModelId) || null;
  }

  /**
   * Install a model
   */
  async installModel(id: string, onProgress?: (progress: string) => void): Promise<void> {
    const model = this.models.get(id);
    if (!model) {
      throw new Error(`Model not found: ${id}`);
    }

    if (model.isInstalled) {
      console.log(`[ModelManager] Model already installed: ${model.displayName}`);
      return;
    }

    console.log(`[ModelManager] Installing model: ${model.displayName}`);
    await ollamaService.pullModel(model.name, onProgress);

    // Refresh installed models
    await this.refreshInstalledModels();

    // Update model status
    model.isInstalled = this.isModelInstalled(model.name);
    console.log(`[ModelManager] Model installed: ${model.displayName}`);
  }
}

export const modelManager = new ModelManager();

