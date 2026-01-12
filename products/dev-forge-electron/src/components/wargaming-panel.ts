/**
 * Wargaming Panel Component
 * 
 * UI component for managing wargaming scenarios.
 */

import { WargamingSystem, Scenario, WargameResult } from '../systems/wargaming-system';

export class WargamingPanel {
  private container: HTMLElement;
  private wargamingSystem: WargamingSystem;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, wargamingSystem: WargamingSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.wargamingSystem = wargamingSystem;
  }

  /**
   * Render the wargaming panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="wargaming-panel">
        <div class="wargaming-panel-header">
          <h3>WARGAMING</h3>
          <button id="create-scenario" class="icon-button" title="Create Scenario">➕</button>
        </div>
        <div class="wargaming-panel-content">
          <div id="scenarios-list" class="scenarios-list">
            <!-- Scenarios will be rendered here -->
          </div>
        </div>
        <div class="wargaming-panel-footer">
          <button id="manage-scenarios" class="btn-secondary btn-small">Manage</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.wargamingSystem.onStatusChange((scenarios) => {
      this.renderScenarios(scenarios);
    });

    // Initial render
    this.renderScenarios(this.wargamingSystem.getAllScenarios());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Create scenario button
    const createBtn = this.container.querySelector('#create-scenario');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showCreateScenarioDialog();
      });
    }

    // Manage scenarios button
    const manageBtn = this.container.querySelector('#manage-scenarios');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.showManageDialog();
      });
    }
  }

  /**
   * Render scenarios
   */
  private renderScenarios(scenarios: Scenario[]): void {
    const listContainer = this.container.querySelector('#scenarios-list');
    if (!listContainer) return;

    if (scenarios.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No scenarios configured</div>';
      return;
    }

    listContainer.innerHTML = scenarios.map(scenario => this.renderScenarioCard(scenario)).join('');
    
    // Set up scenario card event listeners
    scenarios.forEach(scenario => {
      const card = this.container.querySelector(`[data-scenario-id="${scenario.id}"]`);
      if (card) {
        // Execute button
        const executeBtn = card.querySelector('.execute-scenario');
        if (executeBtn) {
          executeBtn.addEventListener('click', () => {
            this.executeScenario(scenario.id);
          });
        }

        // View details button
        const viewBtn = card.querySelector('.view-scenario-details');
        if (viewBtn) {
          viewBtn.addEventListener('click', () => {
            this.showScenarioDetails(scenario.id);
          });
        }
      }
    });
  }

  /**
   * Render scenario card
   */
  private renderScenarioCard(scenario: Scenario): string {
    const statusClass = scenario.status;
    const statusLabel = scenario.status.toUpperCase();
    const objectivesCount = scenario.objectives.length;
    const participantsCount = scenario.participants.length;

    return `
      <div class="scenario-card ${statusClass}" data-scenario-id="${scenario.id}">
        <div class="scenario-card-header">
          <span class="scenario-name">${scenario.name}</span>
          <span class="scenario-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="scenario-card-body">
          <p class="scenario-description">${scenario.description}</p>
          <div class="scenario-stats">
            <div class="stat">
              <span class="stat-label">Objectives</span>
              <span class="stat-value">${objectivesCount}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Participants</span>
              <span class="stat-value">${participantsCount}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Rules</span>
              <span class="stat-value">${scenario.rules.length}</span>
            </div>
          </div>
        </div>
        <div class="scenario-card-footer">
          ${scenario.status === 'draft' || scenario.status === 'active' ? 
            `<button class="execute-scenario btn-primary btn-small" data-scenario-id="${scenario.id}">Execute</button>` : 
            ''
          }
          <button class="view-scenario-details btn-secondary btn-small" data-scenario-id="${scenario.id}">View</button>
        </div>
      </div>
    `;
  }

  /**
   * Execute scenario
   */
  private async executeScenario(scenarioId: string): Promise<void> {
    try {
      const result = await this.wargamingSystem.executeScenario(scenarioId);
      this.showExecutionResult(result);
    } catch (error: any) {
      alert(`Error executing scenario: ${error.message}`);
    }
  }

  /**
   * Show execution result
   */
  private showExecutionResult(result: WargameResult): void {
    const summary = `
      Execution ID: ${result.executionId}
      Duration: ${(result.metrics.duration / 1000).toFixed(2)}s
      Success Rate: ${result.metrics.successRate.toFixed(1)}%
      Objectives Achieved: ${result.metrics.objectivesAchieved}/${result.metrics.objectivesTotal}
      
      Summary: ${result.analysis.summary}
    `;
    alert(summary);
    // TODO: Show detailed result in a modal or panel
  }

  /**
   * Show create scenario dialog
   */
  private showCreateScenarioDialog(): void {
    // TODO: Implement create scenario dialog
    alert('Create scenario dialog - coming soon');
  }

  /**
   * Show manage dialog
   */
  private showManageDialog(): void {
    // TODO: Implement manage dialog
    alert('Manage scenarios dialog - coming soon');
  }

  /**
   * Show scenario details
   */
  private showScenarioDetails(scenarioId: string): void {
    // TODO: Implement scenario details view
    alert(`Scenario details for ${scenarioId} - coming soon`);
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

