/**
 * Model Manager
 * 
 * Manages AI models in the Electron app.
 * Integrates with core SDK's ModelProviderRegistry.
 */

export interface ModelInfo {
  id: string;
  name: string;
  type: 'ollama' | 'gguf' | 'remote' | 'cherry';
  enabled: boolean;
  status: 'available' | 'unavailable' | 'loading';
  endpoint?: string;
  metadata?: {
    contextSize?: number;
    parameters?: string;
    quantization?: string;
  };
}

export class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private selectedModels: Set<string> = new Set();
  private statusCallbacks: Set<(models: ModelInfo[]) => void> = new Set();

  constructor() {
    this.initializeDefaultModels();
  }

  /**
   * Initialize default models
   */
  private initializeDefaultModels(): void {
    // Add default Ollama models
    this.addModel({
      id: 'ollama-llama2',
      name: 'Llama 2',
      type: 'ollama',
      enabled: true,
      status: 'unavailable',
      endpoint: 'http://localhost:11434',
    });

    this.addModel({
      id: 'ollama-mistral',
      name: 'Mistral',
      type: 'ollama',
      enabled: true,
      status: 'unavailable',
      endpoint: 'http://localhost:11434',
    });

    this.addModel({
      id: 'ollama-codellama',
      name: 'CodeLlama',
      type: 'ollama',
      enabled: true,
      status: 'unavailable',
      endpoint: 'http://localhost:11434',
    });
  }

  /**
   * Add a model
   */
  addModel(model: ModelInfo): void {
    this.models.set(model.id, model);
    this.notifyStatusChange();
  }

  /**
   * Remove a model
   */
  removeModel(id: string): void {
    this.models.delete(id);
    this.selectedModels.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Get all models
   */
  getAllModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /**
   * Get enabled models
   */
  getEnabledModels(): ModelInfo[] {
    return this.getAllModels().filter(m => m.enabled);
  }

  /**
   * Get selected models
   */
  getSelectedModels(): ModelInfo[] {
    return Array.from(this.selectedModels)
      .map(id => this.models.get(id))
      .filter((m): m is ModelInfo => m !== undefined);
  }

  /**
   * Select a model
   */
  selectModel(id: string): void {
    this.selectedModels.add(id);
    this.notifyStatusChange();
  }

  /**
   * Deselect a model
   */
  deselectModel(id: string): void {
    this.selectedModels.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Toggle model selection
   */
  toggleModelSelection(id: string): void {
    if (this.selectedModels.has(id)) {
      this.deselectModel(id);
    } else {
      this.selectModel(id);
    }
  }

  /**
   * Enable/disable a model
   */
  setModelEnabled(id: string, enabled: boolean): void {
    const model = this.models.get(id);
    if (model) {
      model.enabled = enabled;
      if (!enabled) {
        this.selectedModels.delete(id);
      }
      this.notifyStatusChange();
    }
  }

  /**
   * Update model status
   */
  updateModelStatus(id: string, status: ModelInfo['status']): void {
    const model = this.models.get(id);
    if (model) {
      model.status = status;
      this.notifyStatusChange();
    }
  }

  /**
   * Check model availability (Ollama)
   */
  async checkOllamaModel(modelId: string): Promise<boolean> {
    const model = this.models.get(modelId);
    if (!model || model.type !== 'ollama') {
      return false;
    }

    try {
      this.updateModelStatus(modelId, 'loading');
      
      const response = await fetch(`${model.endpoint}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama not available');
      }

      const data = await response.json();
      const modelName = model.name.toLowerCase().replace(/\s+/g, '');
      const available = data.models?.some((m: any) => 
        m.name.toLowerCase().includes(modelName)
      ) || false;

      this.updateModelStatus(modelId, available ? 'available' : 'unavailable');
      return available;
    } catch (error) {
      console.error(`[ModelManager] Error checking Ollama model ${modelId}:`, error);
      this.updateModelStatus(modelId, 'unavailable');
      return false;
    }
  }

  /**
   * Check all models
   */
  async checkAllModels(): Promise<void> {
    const ollamaModels = this.getAllModels().filter(m => m.type === 'ollama');
    
    for (const model of ollamaModels) {
      await this.checkOllamaModel(model.id);
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (models: ModelInfo[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const models = this.getAllModels();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(models);
      } catch (error) {
        console.error('[ModelManager] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const modelManager = new ModelManager();

