/**
 * Workspace Panel Component
 * 
 * UI component for managing workspaces and projects.
 * Provides workspace creation, loading, and project management.
 */

import { WorkspaceManager, Workspace, Project } from '../services/workspace-manager';
import { StatusManager } from '../status-manager';

export class WorkspacePanel {
  private container: HTMLElement;
  private workspaceManager: WorkspaceManager;
  private statusManager: StatusManager;
  private isVisible: boolean = false;

  constructor(containerId: string, workspaceManager: WorkspaceManager, statusManager: StatusManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`WorkspacePanel container not found: ${containerId}`);
    }
    this.container = container;
    this.workspaceManager = workspaceManager;
    this.statusManager = statusManager;

    this.render();
    this.setupEventListeners();
    this.loadWorkspaces();
  }

  /**
   * Initial render of the panel structure.
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="workspace-panel">
        <div class="workspace-panel-header">
          <span class="workspace-panel-title">WORKSPACES</span>
          <button id="workspace-new" class="xibalba-button primary" title="New Workspace">+ New</button>
        </div>
        <div class="workspace-panel-body">
          <div id="workspace-list" class="workspace-list">
            <!-- Workspaces will be rendered here -->
          </div>
          <div id="workspace-empty" class="workspace-empty hidden">
            <p>No workspaces yet. Create your first workspace to get started.</p>
            <button id="workspace-empty-create" class="xibalba-button primary">Create Workspace</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners.
   */
  private setupEventListeners(): void {
    // New workspace button
    const newButton = this.container.querySelector('#workspace-new');
    if (newButton) {
      newButton.addEventListener('click', () => this.showNewWorkspaceDialog());
    }

    // Empty state create button
    const emptyCreateButton = this.container.querySelector('#workspace-empty-create');
    if (emptyCreateButton) {
      emptyCreateButton.addEventListener('click', () => this.showNewWorkspaceDialog());
    }

    // Event delegation for workspace actions
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const workspaceCard = target.closest('.workspace-card');
      if (!workspaceCard) return;

      const workspaceId = workspaceCard.getAttribute('data-workspace-id');
      if (!workspaceId) return;

      if (target.classList.contains('workspace-load-button')) {
        await this.loadWorkspace(workspaceId);
      } else if (target.classList.contains('workspace-delete-button')) {
        await this.deleteWorkspace(workspaceId);
      } else if (target.classList.contains('workspace-add-project-button')) {
        await this.showAddProjectDialog(workspaceId);
      } else if (target.classList.contains('workspace-project-item')) {
        const projectId = target.getAttribute('data-project-id');
        if (projectId) {
          await this.openProject(workspaceId, projectId);
        }
      }
    });
  }

  /**
   * Load and display all workspaces.
   */
  private loadWorkspaces(): void {
    const listContainer = this.container.querySelector('#workspace-list');
    const emptyState = this.container.querySelector('#workspace-empty');
    if (!listContainer || !emptyState) return;

    const workspaces = this.workspaceManager.getAllWorkspaces();
    const activeWorkspace = this.workspaceManager.getActiveWorkspace();

    if (workspaces.length === 0) {
      listContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    listContainer.innerHTML = workspaces.map(workspace => {
      const isActive = activeWorkspace?.id === workspace.id;
      return `
        <div class="workspace-card ${isActive ? 'active' : ''}" data-workspace-id="${workspace.id}">
          <div class="workspace-card-header">
            <div class="workspace-card-title">
              <span class="workspace-icon">📁</span>
              <span class="workspace-name">${workspace.name}</span>
              ${isActive ? '<span class="workspace-active-badge">Active</span>' : ''}
            </div>
            <div class="workspace-card-actions">
              <button class="icon-button workspace-load-button" title="Load Workspace">▶</button>
              <button class="icon-button workspace-delete-button" title="Delete Workspace">🗑</button>
            </div>
          </div>
          <div class="workspace-card-body">
            <div class="workspace-path">${workspace.path}</div>
            <div class="workspace-projects">
              <div class="workspace-projects-header">
                <span class="workspace-projects-title">Projects (${workspace.projects.length})</span>
                <button class="icon-button workspace-add-project-button" title="Add Project">+</button>
              </div>
              <div class="workspace-projects-list">
                ${workspace.projects.length === 0 
                  ? '<div class="workspace-no-projects">No projects yet</div>'
                  : workspace.projects.map(project => `
                    <div class="workspace-project-item" data-project-id="${project.id}">
                      <span class="workspace-project-icon">📄</span>
                      <span class="workspace-project-name">${project.name}</span>
                      <span class="workspace-project-type">${project.type}</span>
                    </div>
                  `).join('')
                }
              </div>
            </div>
            <div class="workspace-meta">
              <span class="workspace-meta-item">Created: ${new Date(workspace.createdAt).toLocaleDateString()}</span>
              <span class="workspace-meta-item">Last opened: ${new Date(workspace.lastOpened).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Show dialog for creating a new workspace.
   */
  private async showNewWorkspaceDialog(): Promise<void> {
    const name = prompt('Enter workspace name:');
    if (!name) return;

    const path = prompt('Enter workspace root path:');
    if (!path) return;

    try {
      await this.workspaceManager.createWorkspace(name, path);
      this.statusManager.update(`Workspace "${name}" created successfully`, 'success', 3000);
      this.loadWorkspaces();
    } catch (error: any) {
      console.error('[WorkspacePanel] Error creating workspace:', error);
      this.statusManager.update(`Error creating workspace: ${error.message}`, 'error');
    }
  }

  /**
   * Load a workspace.
   */
  private async loadWorkspace(workspaceId: string): Promise<void> {
    try {
      await this.workspaceManager.loadWorkspace(workspaceId);
      this.statusManager.update('Workspace loaded successfully', 'success', 3000);
      this.loadWorkspaces();
      
      // Dispatch event for other components
      document.dispatchEvent(new CustomEvent('devforge:workspace-loaded', { 
        detail: { workspaceId } 
      }));
    } catch (error: any) {
      console.error('[WorkspacePanel] Error loading workspace:', error);
      this.statusManager.update(`Error loading workspace: ${error.message}`, 'error');
    }
  }

  /**
   * Delete a workspace.
   */
  private async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaceManager.getAllWorkspaces().find(w => w.id === workspaceId);
    if (!workspace) return;

    if (!confirm(`Are you sure you want to delete workspace "${workspace.name}"?`)) {
      return;
    }

    try {
      // Note: WorkspaceManager doesn't have a delete method yet, so we'll need to add it
      // For now, we'll just show a message
      this.statusManager.update('Workspace deletion not yet implemented', 'warn', 3000);
      // await this.workspaceManager.deleteWorkspace(workspaceId);
      // this.loadWorkspaces();
    } catch (error: any) {
      console.error('[WorkspacePanel] Error deleting workspace:', error);
      this.statusManager.update(`Error deleting workspace: ${error.message}`, 'error');
    }
  }

  /**
   * Show dialog for adding a project to a workspace.
   */
  private async showAddProjectDialog(workspaceId: string): Promise<void> {
    const name = prompt('Enter project name:');
    if (!name) return;

    const path = prompt('Enter project path:');
    if (!path) return;

    const type = prompt('Enter project type (code/design/data/mixed):') as Project['type'] || 'code';

    try {
      await this.workspaceManager.addProjectToActiveWorkspace(name, path, type);
      this.statusManager.update(`Project "${name}" added successfully`, 'success', 3000);
      this.loadWorkspaces();
    } catch (error: any) {
      console.error('[WorkspacePanel] Error adding project:', error);
      this.statusManager.update(`Error adding project: ${error.message}`, 'error');
    }
  }

  /**
   * Open a project.
   */
  private async openProject(workspaceId: string, projectId: string): Promise<void> {
    const workspace = this.workspaceManager.getAllWorkspaces().find(w => w.id === workspaceId);
    if (!workspace) return;

    const project = workspace.projects.find(p => p.id === projectId);
    if (!project) return;

    try {
      // Dispatch event for other components to handle project opening
      document.dispatchEvent(new CustomEvent('devforge:project-opened', {
        detail: { workspaceId, projectId, project }
      }));
      this.statusManager.update(`Opening project "${project.name}"...`, 'info', 2000);
    } catch (error: any) {
      console.error('[WorkspacePanel] Error opening project:', error);
      this.statusManager.update(`Error opening project: ${error.message}`, 'error');
    }
  }

  /**
   * Show the workspace panel.
   */
  show(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.loadWorkspaces();
  }

  /**
   * Hide the workspace panel.
   */
  hide(): void {
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  /**
   * Toggle visibility.
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

