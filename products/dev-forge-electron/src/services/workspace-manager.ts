/**
 * Workspace Manager
 * 
 * Manages workspaces, projects, and file operations.
 * Provides workspace-level organization and management.
 */

export interface Workspace {
  id: string;
  name: string;
  path: string;
  description?: string;
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
  lastOpened?: Date;
}

export interface WorkspaceSettings {
  excludePatterns: string[];
  includePatterns: string[];
  searchExclude: string[];
  watcherExclude: string[];
  filesAssociations: Record<string, string>;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  path: string;
  type: 'folder' | 'file' | 'workspace';
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private projects: Map<string, Project> = new Map();
  private currentWorkspace: Workspace | null = null;
  private statusCallbacks: Set<(workspace: Workspace | null) => void> = new Set();

  constructor() {
    // Initialize with default workspace if needed
  }

  /**
   * Create a new workspace
   */
  createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Workspace {
    const newWorkspace: Workspace = {
      ...workspace,
      id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workspaces.set(newWorkspace.id, newWorkspace);
    return newWorkspace;
  }

  /**
   * Get all workspaces
   */
  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  /**
   * Get workspace by path
   */
  getWorkspaceByPath(path: string): Workspace | undefined {
    return Array.from(this.workspaces.values()).find(w => w.path === path);
  }

  /**
   * Update workspace
   */
  updateWorkspace(id: string, updates: Partial<Workspace>): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      Object.assign(workspace, updates, { updatedAt: new Date() });
    }
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(id: string): void {
    if (this.currentWorkspace?.id === id) {
      this.currentWorkspace = null;
      this.notifyStatusChange();
    }
    this.workspaces.delete(id);
    
    // Remove associated projects
    const projectsToRemove = Array.from(this.projects.values())
      .filter(p => p.workspaceId === id)
      .map(p => p.id);
    projectsToRemove.forEach(projectId => this.projects.delete(projectId));
  }

  /**
   * Open workspace
   */
  openWorkspace(id: string): void {
    const workspace = this.workspaces.get(id);
    if (workspace) {
      this.currentWorkspace = workspace;
      workspace.lastOpened = new Date();
      this.updateWorkspace(id, workspace);
      this.notifyStatusChange();
    }
  }

  /**
   * Close current workspace
   */
  closeWorkspace(): void {
    this.currentWorkspace = null;
    this.notifyStatusChange();
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  /**
   * Add project to workspace
   */
  addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(newProject.id, newProject);
    return newProject;
  }

  /**
   * Get projects for workspace
   */
  getWorkspaceProjects(workspaceId: string): Project[] {
    return Array.from(this.projects.values()).filter(p => p.workspaceId === workspaceId);
  }

  /**
   * Get project by ID
   */
  getProject(id: string): Project | undefined {
    return this.projects.get(id);
  }

  /**
   * Update project
   */
  updateProject(id: string, updates: Partial<Project>): void {
    const project = this.projects.get(id);
    if (project) {
      Object.assign(project, updates, { updatedAt: new Date() });
    }
  }

  /**
   * Delete project
   */
  deleteProject(id: string): void {
    this.projects.delete(id);
  }

  /**
   * Get recent workspaces
   */
  getRecentWorkspaces(limit: number = 5): Workspace[] {
    return this.getAllWorkspaces()
      .filter(w => w.lastOpened)
      .sort((a, b) => {
        const aTime = a.lastOpened?.getTime() || 0;
        const bTime = b.lastOpened?.getTime() || 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  /**
   * Get workspace statistics
   */
  getWorkspaceStats(workspaceId: string): {
    projectCount: number;
    totalSize: number;
    lastActivity: Date | null;
  } {
    const projects = this.getWorkspaceProjects(workspaceId);
    const lastActivity = projects.length > 0
      ? projects.reduce((latest, p) => {
          return p.updatedAt > latest ? p.updatedAt : latest;
        }, projects[0].updatedAt)
      : null;

    return {
      projectCount: projects.length,
      totalSize: 0, // TODO: Calculate actual size
      lastActivity,
    };
  }

  /**
   * Subscribe to workspace changes
   */
  onWorkspaceChange(callback: (workspace: Workspace | null) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(this.currentWorkspace);
      } catch (error) {
        console.error('[WorkspaceManager] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const workspaceManager = new WorkspaceManager();

