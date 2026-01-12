/**
 * Sprint Panel Component
 * 
 * UI component for managing sprints and tasks.
 */

import { SprintSystem, Sprint, Task, SprintMetrics } from '../systems/sprint-system';

export class SprintPanel {
  private container: HTMLElement;
  private sprintSystem: SprintSystem;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, sprintSystem: SprintSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.sprintSystem = sprintSystem;
  }

  /**
   * Render the sprint panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="sprint-panel">
        <div class="sprint-panel-header">
          <h3>SPRINTS</h3>
          <button id="create-sprint" class="icon-button" title="Create Sprint">➕</button>
        </div>
        <div class="sprint-panel-content">
          <div id="active-sprint" class="active-sprint-section">
            <!-- Active sprint will be rendered here -->
          </div>
          <div id="sprints-list" class="sprints-list">
            <!-- Sprints will be rendered here -->
          </div>
        </div>
        <div class="sprint-panel-footer">
          <button id="manage-sprints" class="btn-secondary btn-small">Manage</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.sprintSystem.onStatusChange((sprints) => {
      this.renderSprints(sprints);
    });

    // Initial render
    this.renderSprints(this.sprintSystem.getAllSprints());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Create sprint button
    const createBtn = this.container.querySelector('#create-sprint');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showCreateSprintDialog();
      });
    }

    // Manage sprints button
    const manageBtn = this.container.querySelector('#manage-sprints');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.showManageDialog();
      });
    }
  }

  /**
   * Render sprints
   */
  private renderSprints(sprints: Sprint[]): void {
    const activeSprint = this.sprintSystem.getActiveSprint();
    const activeSprintContainer = this.container.querySelector('#active-sprint');
    const sprintsListContainer = this.container.querySelector('#sprints-list');

    // Render active sprint
    if (activeSprintContainer) {
      if (activeSprint) {
        const metrics = this.sprintSystem.getSprintMetrics(activeSprint.id);
        activeSprintContainer.innerHTML = this.renderActiveSprint(activeSprint, metrics);
        this.setupActiveSprintListeners(activeSprint.id);
      } else {
        activeSprintContainer.innerHTML = '<div class="empty-state">No active sprint</div>';
      }
    }

    // Render sprints list
    if (sprintsListContainer) {
      if (sprints.length === 0) {
        sprintsListContainer.innerHTML = '<div class="empty-state">No sprints configured</div>';
        return;
      }

      sprintsListContainer.innerHTML = sprints
        .filter(s => s.id !== activeSprint?.id)
        .map(sprint => this.renderSprintCard(sprint))
        .join('');
    }
  }

  /**
   * Render active sprint
   */
  private renderActiveSprint(sprint: Sprint, metrics: SprintMetrics): string {
    const daysRemaining = Math.ceil(
      (new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
      <div class="active-sprint-card">
        <div class="active-sprint-header">
          <h4>${sprint.name}</h4>
          <span class="sprint-status active">ACTIVE</span>
        </div>
        <div class="active-sprint-body">
          <p class="sprint-description">${sprint.description}</p>
          <div class="sprint-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${metrics.completionPercentage}%"></div>
            </div>
            <span class="progress-text">${Math.round(metrics.completionPercentage)}% Complete</span>
          </div>
          <div class="sprint-stats">
            <div class="stat">
              <span class="stat-label">Tasks</span>
              <span class="stat-value">${metrics.completedTasks}/${metrics.totalTasks}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Days Left</span>
              <span class="stat-value">${daysRemaining}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Hours</span>
              <span class="stat-value">${metrics.actualHours}/${metrics.estimatedHours}</span>
            </div>
          </div>
        </div>
        <div class="active-sprint-footer">
          <button class="view-sprint-details btn-primary btn-small" data-sprint-id="${sprint.id}">View Details</button>
        </div>
      </div>
    `;
  }

  /**
   * Render sprint card
   */
  private renderSprintCard(sprint: Sprint): string {
    const statusClass = sprint.status;
    const statusLabel = sprint.status.toUpperCase();

    return `
      <div class="sprint-card ${statusClass}" data-sprint-id="${sprint.id}">
        <div class="sprint-card-header">
          <span class="sprint-name">${sprint.name}</span>
          <span class="sprint-status ${statusClass}">${statusLabel}</span>
        </div>
        <div class="sprint-card-body">
          <p class="sprint-description">${sprint.description}</p>
          <div class="sprint-dates">
            <span>${new Date(sprint.startDate).toLocaleDateString()} - ${new Date(sprint.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="sprint-card-footer">
          ${sprint.status === 'planned' ? `<button class="start-sprint btn-primary btn-small" data-sprint-id="${sprint.id}">Start</button>` : ''}
          ${sprint.status === 'active' ? `<button class="complete-sprint btn-primary btn-small" data-sprint-id="${sprint.id}">Complete</button>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Set up active sprint listeners
   */
  private setupActiveSprintListeners(sprintId: string): void {
    const viewDetailsBtn = this.container.querySelector(`.view-sprint-details[data-sprint-id="${sprintId}"]`);
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', () => {
        this.showSprintDetails(sprintId);
      });
    }
  }

  /**
   * Show create sprint dialog
   */
  private showCreateSprintDialog(): void {
    // TODO: Implement create sprint dialog
    alert('Create sprint dialog - coming soon');
  }

  /**
   * Show manage dialog
   */
  private showManageDialog(): void {
    // TODO: Implement manage dialog
    alert('Manage sprints dialog - coming soon');
  }

  /**
   * Show sprint details
   */
  private showSprintDetails(sprintId: string): void {
    // TODO: Implement sprint details view
    alert(`Sprint details for ${sprintId} - coming soon`);
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

