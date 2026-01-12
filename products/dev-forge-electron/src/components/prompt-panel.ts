/**
 * Prompt Panel Component
 * 
 * Quick access prompt interface for AI interactions.
 * Can be used from editor context or standalone.
 */

import { MultiModelExecutor } from '../services/multi-model-executor';
import { modelManager } from '../model-manager';

export class PromptPanel {
  private container: HTMLElement;
  private multiModelExecutor: MultiModelExecutor;
  private isVisible: boolean = false;

  constructor(containerId: string, multiModelExecutor: MultiModelExecutor) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.multiModelExecutor = multiModelExecutor;
  }

  /**
   * Render the prompt panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="prompt-panel ${this.isVisible ? 'visible' : ''}">
        <div class="prompt-panel-header">
          <h3>AI Prompt</h3>
          <button id="close-prompt" class="icon-button">✕</button>
        </div>
        <div class="prompt-panel-body">
          <textarea 
            id="prompt-input" 
            class="prompt-input" 
            placeholder="Enter your prompt here..."
            rows="6"
          ></textarea>
          <div class="prompt-options">
            <div class="model-selection-quick">
              <label>Models:</label>
              <div id="quick-model-checkboxes" class="quick-checkboxes"></div>
            </div>
            <div class="prompt-actions">
              <button id="execute-prompt-quick" class="btn-primary">Execute</button>
              <button id="cancel-prompt" class="btn-secondary">Cancel</button>
            </div>
          </div>
          <div id="prompt-results" class="prompt-results"></div>
        </div>
      </div>
    `;

    this.setupEventListeners();
    this.renderModelCheckboxes();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Close button
    const closeBtn = this.container.querySelector('#close-prompt');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Cancel button
    const cancelBtn = this.container.querySelector('#cancel-prompt');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Execute button
    const executeBtn = this.container.querySelector('#execute-prompt-quick');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        this.executePrompt();
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Render model checkboxes
   */
  private renderModelCheckboxes(): void {
    const container = this.container.querySelector('#quick-model-checkboxes');
    if (!container) return;

    const models = modelManager.getEnabledModels();
    
    container.innerHTML = models.map(model => `
      <label class="quick-checkbox-label">
        <input 
          type="checkbox" 
          class="quick-checkbox" 
          value="${model.id}"
          ${model.status === 'available' ? 'checked' : 'disabled'}
        >
        <span>${model.name}</span>
      </label>
    `).join('');
  }

  /**
   * Execute prompt
   */
  private async executePrompt(): Promise<void> {
    const input = this.container.querySelector('#prompt-input') as HTMLTextAreaElement;
    const resultsContainer = this.container.querySelector('#prompt-results');
    
    if (!input || !input.value.trim()) {
      alert('Please enter a prompt');
      return;
    }

    // Get selected models
    const checkboxes = this.container.querySelectorAll('.quick-checkbox:checked');
    const modelIds = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);

    if (modelIds.length === 0) {
      alert('Please select at least one model');
      return;
    }

    // Show loading
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="loading-state">Executing...</div>';
    }

    try {
      const result = await this.multiModelExecutor.execute({
        prompt: input.value,
        modelIds,
      });

      // Display results
      if (resultsContainer) {
        resultsContainer.innerHTML = result.responses.map((r: any) => `
          <div class="result-item">
            <strong>${r.modelName}:</strong>
            <pre>${r.response || r.error}</pre>
          </div>
        `).join('');
      }
    } catch (error: any) {
      if (resultsContainer) {
        resultsContainer.innerHTML = `<div class="error-state">Error: ${error.message}</div>`;
      }
    }
  }

  /**
   * Show panel
   */
  show(): void {
    this.isVisible = true;
    this.container.querySelector('.prompt-panel')?.classList.add('visible');
    const input = this.container.querySelector('#prompt-input') as HTMLTextAreaElement;
    if (input) {
      input.focus();
    }
  }

  /**
   * Hide panel
   */
  hide(): void {
    this.isVisible = false;
    this.container.querySelector('.prompt-panel')?.classList.remove('visible');
  }

  /**
   * Toggle panel
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

