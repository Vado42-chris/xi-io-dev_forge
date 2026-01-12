/**
 * Model Panel Component
 * 
 * UI component for managing AI models in the Electron app.
 */

import { ModelManager, ModelInfo } from '../model-manager';

export class ModelPanel {
  private container: HTMLElement;
  private modelManager: ModelManager;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, modelManager: ModelManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.modelManager = modelManager;
  }

  /**
   * Render the model panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="model-panel">
        <div class="model-panel-header">
          <h3>AI MODELS</h3>
          <button id="refresh-models" class="icon-button" title="Refresh models">🔄</button>
        </div>
        <div class="model-panel-content">
          <div id="models-list" class="models-list">
            <!-- Models will be rendered here -->
          </div>
        </div>
        <div class="model-panel-footer">
          <button id="add-model" class="btn-secondary btn-small">Add Model</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to model changes
    this.unsubscribe = this.modelManager.onStatusChange((models) => {
      this.renderModels(models);
    });

    // Initial render
    this.renderModels(this.modelManager.getAllModels());

    // Check model availability
    this.modelManager.checkAllModels();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Refresh models button
    const refreshBtn = this.container.querySelector('#refresh-models');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.modelManager.checkAllModels();
      });
    }

    // Add model button
    const addBtn = this.container.querySelector('#add-model');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showAddModelDialog();
      });
    }
  }

  /**
   * Render models list
   */
  private renderModels(models: ModelInfo[]): void {
    const listContainer = this.container.querySelector('#models-list');
    if (!listContainer) return;

    if (models.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No models configured</div>';
      return;
    }

    listContainer.innerHTML = models.map(model => this.renderModelCard(model)).join('');
    
    // Set up model card event listeners
    models.forEach(model => {
      const card = this.container.querySelector(`[data-model-id="${model.id}"]`);
      if (card) {
        // Toggle selection
        const toggle = card.querySelector('.model-toggle');
        if (toggle) {
          toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.modelManager.toggleModelSelection(model.id);
          });
        }

        // Enable/disable toggle
        const enableToggle = card.querySelector('.model-enable-toggle');
        if (enableToggle) {
          enableToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.modelManager.setModelEnabled(model.id, target.checked);
          });
        }
      }
    });
  }

  /**
   * Render individual model card
   */
  private renderModelCard(model: ModelInfo): string {
    const isSelected = this.modelManager.getSelectedModels().some(m => m.id === model.id);
    const statusClass = `status-${model.status}`;
    const statusIcon = this.getStatusIcon(model.status);
    const typeBadge = this.getTypeBadge(model.type);

    return `
      <div class="model-card ${isSelected ? 'selected' : ''}" data-model-id="${model.id}">
        <div class="model-card-header">
          <div class="model-info">
            <span class="model-name">${model.name}</span>
            <span class="model-type">${typeBadge}</span>
          </div>
          <div class="model-status ${statusClass}">
            ${statusIcon}
          </div>
        </div>
        <div class="model-card-body">
          <div class="model-controls">
            <label class="model-enable-label">
              <input type="checkbox" class="model-enable-toggle" ${model.enabled ? 'checked' : ''}>
              <span>Enabled</span>
            </label>
            <button class="model-toggle btn-secondary btn-small ${isSelected ? 'active' : ''}">
              ${isSelected ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: ModelInfo['status']): string {
    switch (status) {
      case 'available':
        return '🟢';
      case 'unavailable':
        return '🔴';
      case 'loading':
        return '🟡';
      default:
        return '⚪';
    }
  }

  /**
   * Get type badge
   */
  private getTypeBadge(type: ModelInfo['type']): string {
    const badges: Record<ModelInfo['type'], string> = {
      ollama: 'Ollama',
      gguf: 'GGUF',
      remote: 'Remote',
      cherry: 'Cherry',
    };
    return badges[type] || type;
  }

  /**
   * Show add model dialog
   */
  private showAddModelDialog(): void {
    // TODO: Implement add model dialog
    alert('Add model dialog - coming soon');
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

