/**
 * Fire Teams Panel Component
 * 
 * UI component for managing Fire Teams and agents.
 */

import { FireTeamsSystem, FireTeam, Agent, Task } from '../systems/fire-teams';
import { hrSystem } from '../systems/hr-system';

export class FireTeamsPanel {
  private container: HTMLElement;
  private fireTeamsSystem: FireTeamsSystem;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, fireTeamsSystem: FireTeamsSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.fireTeamsSystem = fireTeamsSystem;
  }

  /**
   * Render the Fire Teams panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="fire-teams-panel">
        <div class="fire-teams-panel-header">
          <h3>FIRE TEAMS</h3>
          <button id="create-team" class="icon-button" title="Create Fire Team">➕</button>
        </div>
        <div class="fire-teams-panel-content">
          <div id="teams-list" class="teams-list">
            <!-- Teams will be rendered here -->
          </div>
          <div id="agents-list" class="agents-list">
            <h4>Available Agents</h4>
            <!-- Agents will be rendered here -->
          </div>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.fireTeamsSystem.onStatusChange((teams) => {
      this.renderTeams(teams);
    });

    // Initial render
    this.renderTeams(this.fireTeamsSystem.getAllTeams());
    this.renderAgents(this.fireTeamsSystem.getAllAgents());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Create team button
    const createBtn = this.container.querySelector('#create-team');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showCreateTeamDialog();
      });
    }
  }

  /**
   * Render teams list
   */
  private renderTeams(teams: FireTeam[]): void {
    const listContainer = this.container.querySelector('#teams-list');
    if (!listContainer) return;

    if (teams.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No Fire Teams created</div>';
      return;
    }

    listContainer.innerHTML = teams.map(team => this.renderTeamCard(team)).join('');
  }

  /**
   * Render agents list
   */
  private renderAgents(agents: Agent[]): void {
    const listContainer = this.container.querySelector('#agents-list');
    if (!listContainer) return;

    const agentsHtml = agents.map(agent => this.renderAgentCard(agent)).join('');
    const existingH4 = listContainer.querySelector('h4');
    if (existingH4) {
      existingH4.nextElementSibling?.remove();
    }
    
    const agentsContainer = document.createElement('div');
    agentsContainer.className = 'agents-container';
    agentsContainer.innerHTML = agentsHtml;
    listContainer.appendChild(agentsContainer);
  }

  /**
   * Render team card
   */
  private renderTeamCard(team: FireTeam): string {
    const statusClass = `status-${team.status}`;
    const statusIcon = this.getStatusIcon(team.status);
    const agentsCount = team.agents.length;
    const tasksCount = team.tasks.length;
    const completedTasks = team.tasks.filter(t => t.status === 'completed').length;

    return `
      <div class="team-card" data-team-id="${team.id}">
        <div class="team-card-header">
          <div class="team-info">
            <span class="team-name">${team.name}</span>
            <span class="team-status ${statusClass}">${statusIcon} ${team.status}</span>
          </div>
        </div>
        <div class="team-card-body">
          <div class="team-stats">
            <span>Agents: ${agentsCount}</span>
            <span>Tasks: ${completedTasks}/${tasksCount}</span>
          </div>
          <div class="team-agents">
            ${team.agents.map(a => `<span class="agent-badge">${a.name}</span>`).join('')}
          </div>
        </div>
        <div class="team-card-footer">
          <button class="team-start btn-primary btn-small">Start</button>
          <button class="team-pause btn-secondary btn-small">Pause</button>
          <button class="team-delete btn-secondary btn-small">Delete</button>
        </div>
      </div>
    `;
  }

  /**
   * Render agent card
   */
  private renderAgentCard(agent: Agent): string {
    const statusClass = `status-${agent.status}`;
    const statusIcon = this.getStatusIcon(agent.status);
    const profile = hrSystem.getProfile(agent.id);
    const isOnboarded = profile ? hrSystem.getPerformanceSummary(agent.id)?.isOnboarded : false;

    return `
      <div class="agent-card" data-agent-id="${agent.id}">
        <div class="agent-card-header">
          <span class="agent-name">${agent.name}</span>
          <span class="agent-status ${statusClass}">${statusIcon}</span>
        </div>
        <div class="agent-card-body">
          <p class="agent-role">${agent.role}</p>
          ${isOnboarded ? '<span class="onboarded-badge">✓ Onboarded</span>' : '<span class="onboarding-badge">⏳ Onboarding</span>'}
        </div>
      </div>
    `;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case 'active':
      case 'working':
        return '🟢';
      case 'idle':
        return '⚪';
      case 'paused':
      case 'waiting':
        return '🟡';
      case 'error':
        return '🔴';
      case 'completed':
        return '✅';
      default:
        return '⚪';
    }
  }

  /**
   * Show create team dialog
   */
  private showCreateTeamDialog(): void {
    const name = prompt('Enter Fire Team name:');
    if (name) {
      const availableAgents = this.fireTeamsSystem.getAvailableAgents();
      if (availableAgents.length === 0) {
        alert('No available agents');
        return;
      }

      // For now, create team with first available agent
      const team = this.fireTeamsSystem.createTeam(name, [availableAgents[0].id]);
      this.renderTeams(this.fireTeamsSystem.getAllTeams());
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

