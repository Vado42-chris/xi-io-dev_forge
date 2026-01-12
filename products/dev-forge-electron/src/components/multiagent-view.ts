/**
 * Multiagent View Component
 * 
 * UI component for viewing and interacting with multiple AI agents.
 * Shows agent status, tasks, and results in real-time.
 */

import { FireTeamsSystem, Agent, Task } from '../systems/fire-teams';
import { hrSystem } from '../systems/hr-system';
import { MultiModelExecutor } from '../services/multi-model-executor';

export class MultiagentView {
  private container: HTMLElement;
  private fireTeamsSystem: FireTeamsSystem;
  private multiModelExecutor: MultiModelExecutor;
  private unsubscribe: (() => void) | null = null;
  private promptInput: HTMLTextAreaElement | null = null;
  private selectedModelIds: Set<string> = new Set();

  constructor(
    containerId: string,
    fireTeamsSystem: FireTeamsSystem,
    multiModelExecutor: MultiModelExecutor
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.fireTeamsSystem = fireTeamsSystem;
    this.multiModelExecutor = multiModelExecutor;
  }

  /**
   * Render the multiagent view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="multiagent-view">
        <div class="multiagent-view-header">
          <h2>Multiagent View</h2>
          <div class="view-controls">
            <button id="refresh-agents" class="icon-button" title="Refresh">🔄</button>
          </div>
        </div>
        
        <div class="multiagent-view-content">
          <div class="prompt-section">
            <label for="multiagent-prompt">Enter prompt for multiple agents:</label>
            <textarea 
              id="multiagent-prompt" 
              class="prompt-input" 
              placeholder="Enter your prompt here... Multiple agents will process this simultaneously."
              rows="4"
            ></textarea>
            <div class="model-selection">
              <label>Select models:</label>
              <div id="model-checkboxes" class="model-checkboxes">
                <!-- Model checkboxes will be rendered here -->
              </div>
            </div>
            <button id="execute-prompt" class="btn-primary">Execute with Selected Models</button>
          </div>

          <div class="agents-section">
            <h3>Active Agents</h3>
            <div id="agents-grid" class="agents-grid">
              <!-- Agents will be rendered here -->
            </div>
          </div>

          <div class="results-section">
            <h3>Results</h3>
            <div id="results-container" class="results-container">
              <!-- Results will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.fireTeamsSystem.onStatusChange(() => {
      this.renderAgents();
    });

    // Initial render
    this.renderAgents();
    this.renderModelCheckboxes();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Prompt input
    this.promptInput = this.container.querySelector('#multiagent-prompt') as HTMLTextAreaElement;

    // Execute button
    const executeBtn = this.container.querySelector('#execute-prompt');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        this.executePrompt();
      });
    }

    // Refresh button
    const refreshBtn = this.container.querySelector('#refresh-agents');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderAgents();
      });
    }
  }

  /**
   * Render model checkboxes
   */
  private renderModelCheckboxes(): void {
    const container = this.container.querySelector('#model-checkboxes');
    if (!container) return;

    // Import ModelManager dynamically
    import('../model-manager').then(({ modelManager }) => {
      const models = modelManager.getEnabledModels();
      
      container.innerHTML = models.map(model => `
        <label class="model-checkbox-label">
          <input 
            type="checkbox" 
            class="model-checkbox" 
            value="${model.id}"
            ${this.selectedModelIds.has(model.id) ? 'checked' : ''}
            ${model.status !== 'available' ? 'disabled' : ''}
          >
          <span>${model.name} ${model.status !== 'available' ? '(unavailable)' : ''}</span>
        </label>
      `).join('');

      // Set up checkbox listeners
      container.querySelectorAll('.model-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          if (target.checked) {
            this.selectedModelIds.add(target.value);
          } else {
            this.selectedModelIds.delete(target.value);
          }
        });
      });
    });

    container.innerHTML = models.map(model => `
      <label class="model-checkbox-label">
        <input 
          type="checkbox" 
          class="model-checkbox" 
          value="${model.id}"
          ${this.selectedModelIds.has(model.id) ? 'checked' : ''}
        >
        <span>${model.name}</span>
      </label>
    `).join('');

    // Set up checkbox listeners
    container.querySelectorAll('.model-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
          this.selectedModelIds.add(target.value);
        } else {
          this.selectedModelIds.delete(target.value);
        }
      });
    });
  }

  /**
   * Render agents grid
   */
  private renderAgents(): void {
    const container = this.container.querySelector('#agents-grid');
    if (!container) return;

    const agents = this.fireTeamsSystem.getAllAgents();
    
    if (agents.length === 0) {
      container.innerHTML = '<div class="empty-state">No agents available</div>';
      return;
    }

    container.innerHTML = agents.map(agent => this.renderAgentCard(agent)).join('');
  }

  /**
   * Render agent card
   */
  private renderAgentCard(agent: Agent): string {
    const statusClass = `status-${agent.status}`;
    const statusIcon = this.getStatusIcon(agent.status);
    const profile = hrSystem.getProfile(agent.id);
    const performance = profile ? hrSystem.getPerformanceSummary(agent.id) : null;

    return `
      <div class="agent-card-large" data-agent-id="${agent.id}">
        <div class="agent-card-header">
          <div class="agent-info">
            <span class="agent-name">${agent.name}</span>
            <span class="agent-role">${agent.role}</span>
          </div>
          <div class="agent-status ${statusClass}">
            ${statusIcon} ${agent.status}
          </div>
        </div>
        <div class="agent-card-body">
          ${agent.currentTask ? `
            <div class="current-task">
              <strong>Current Task:</strong> ${agent.currentTask.title}
              <div class="task-progress">${agent.currentTask.status}</div>
            </div>
          ` : '<div class="no-task">Idle</div>'}
          ${performance ? `
            <div class="agent-metrics">
              <span>Tasks: ${performance.profile.tasksCompleted}</span>
              <span>Success: ${(performance.profile.successRate * 100).toFixed(1)}%</span>
              <span>Experience: ${performance.profile.experience}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Execute prompt with selected models
   */
  private async executePrompt(): Promise<void> {
    if (!this.promptInput || !this.promptInput.value.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (this.selectedModelIds.size === 0) {
      alert('Please select at least one model');
      return;
    }

    const prompt = this.promptInput.value;
    const modelIds = Array.from(this.selectedModelIds);

    // Show loading state
    const resultsContainer = this.container.querySelector('#results-container');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="loading-state">Executing prompt with multiple models...</div>';
    }

    try {
      const result = await this.multiModelExecutor.execute({
        prompt,
        modelIds,
      });

      // Display results
      this.displayResults(result);
    } catch (error: any) {
      if (resultsContainer) {
        resultsContainer.innerHTML = `
          <div class="error-state">
            <strong>Error:</strong> ${error.message}
          </div>
        `;
      }
    }
  }

  /**
   * Display execution results
   */
  private displayResults(result: any): void {
    const container = this.container.querySelector('#results-container');
    if (!container) return;

    const resultsHtml = result.responses.map((response: any) => `
      <div class="result-card">
        <div class="result-header">
          <span class="result-model">${response.modelName}</span>
          <span class="result-duration">${response.duration}ms</span>
        </div>
        <div class="result-content">
          ${response.error ? `
            <div class="result-error">Error: ${response.error}</div>
          ` : `
            <pre class="result-text">${response.response}</pre>
          `}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="results-summary">
        <strong>Total Duration:</strong> ${result.totalDuration}ms | 
        <strong>Success:</strong> ${result.successCount} | 
        <strong>Errors:</strong> ${result.errorCount}
      </div>
      <div class="results-list">
        ${resultsHtml}
      </div>
    `;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'working':
        return '🟢';
      case 'idle':
        return '⚪';
      case 'waiting':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
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

