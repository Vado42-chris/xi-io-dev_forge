/**
 * Sprint System
 * 
 * Manages development sprints, tasks, and progress tracking.
 * Part of the VectorForge Framework.
 */

export interface Sprint {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  goals: string[];
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  sprintId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string; // Agent ID or user ID
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface SprintMetrics {
  sprintId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  completionPercentage: number;
  estimatedHours: number;
  actualHours: number;
  burndownData: BurndownPoint[];
}

export interface BurndownPoint {
  date: Date;
  remainingTasks: number;
  remainingHours: number;
}

export class SprintSystem {
  private sprints: Map<string, Sprint> = new Map();
  private tasks: Map<string, Task> = new Map();
  private statusCallbacks: Set<(sprints: Sprint[]) => void> = new Set();

  constructor() {
    // Initialize with a default active sprint if needed
  }

  /**
   * Create a new sprint
   */
  createSprint(sprint: Omit<Sprint, 'id' | 'createdAt' | 'updatedAt'>): Sprint {
    const newSprint: Sprint = {
      ...sprint,
      id: `sprint-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sprints.set(newSprint.id, newSprint);
    this.notifyStatusChange();
    return newSprint;
  }

  /**
   * Get all sprints
   */
  getAllSprints(): Sprint[] {
    return Array.from(this.sprints.values());
  }

  /**
   * Get active sprint
   */
  getActiveSprint(): Sprint | undefined {
    return this.getAllSprints().find(s => s.status === 'active');
  }

  /**
   * Get sprint by ID
   */
  getSprint(id: string): Sprint | undefined {
    return this.sprints.get(id);
  }

  /**
   * Update sprint
   */
  updateSprint(id: string, updates: Partial<Sprint>): void {
    const sprint = this.sprints.get(id);
    if (sprint) {
      Object.assign(sprint, updates, { updatedAt: new Date() });
      this.notifyStatusChange();
    }
  }

  /**
   * Start sprint
   */
  startSprint(id: string): void {
    // End any other active sprints
    this.getAllSprints().forEach(s => {
      if (s.status === 'active' && s.id !== id) {
        s.status = 'completed';
        s.updatedAt = new Date();
      }
    });

    this.updateSprint(id, { status: 'active', startDate: new Date() });
  }

  /**
   * Complete sprint
   */
  completeSprint(id: string): void {
    this.updateSprint(id, { status: 'completed' });
  }

  /**
   * Create a task
   */
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tasks.set(newTask.id, newTask);
    this.notifyStatusChange();
    return newTask;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get tasks for sprint
   */
  getSprintTasks(sprintId: string): Task[] {
    return this.getAllTasks().filter(t => t.sprintId === sprintId);
  }

  /**
   * Get task by ID
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  /**
   * Update task
   */
  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates, { updatedAt: new Date() });
      
      // Set completedAt if status changed to done
      if (updates.status === 'done' && !task.completedAt) {
        task.completedAt = new Date();
      }
      
      this.notifyStatusChange();
    }
  }

  /**
   * Delete task
   */
  deleteTask(id: string): void {
    this.tasks.delete(id);
    this.notifyStatusChange();
  }

  /**
   * Get sprint metrics
   */
  getSprintMetrics(sprintId: string): SprintMetrics {
    const sprintTasks = this.getSprintTasks(sprintId);
    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
    const inProgressTasks = sprintTasks.filter(t => t.status === 'in-progress').length;
    const blockedTasks = sprintTasks.filter(t => t.status === 'blocked').length;
    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const estimatedHours = sprintTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const actualHours = sprintTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Generate burndown data
    const burndownData = this.generateBurndownData(sprintId, sprintTasks);

    return {
      sprintId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      completionPercentage,
      estimatedHours,
      actualHours,
      burndownData,
    };
  }

  /**
   * Generate burndown chart data
   */
  private generateBurndownData(sprintId: string, tasks: Task[]): BurndownPoint[] {
    const sprint = this.getSprint(sprintId);
    if (!sprint || sprint.status !== 'active') {
      return [];
    }

    const points: BurndownPoint[] = [];
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();

    // Generate points for each day from start to today (or end date)
    const currentDate = new Date(startDate);
    const endPoint = today < endDate ? today : endDate;

    while (currentDate <= endPoint) {
      // Count tasks that were not done by this date
      const remainingTasks = tasks.filter(task => {
        if (task.completedAt) {
          return new Date(task.completedAt) > currentDate;
        }
        return true;
      }).length;

      // Calculate remaining hours
      const remainingHours = tasks
        .filter(task => {
          if (task.completedAt) {
            return new Date(task.completedAt) > currentDate;
          }
          return true;
        })
        .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

      points.push({
        date: new Date(currentDate),
        remainingTasks,
        remainingHours,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return points;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (sprints: Sprint[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const sprints = this.getAllSprints();
    this.statusCallbacks.forEach(callback => {
      try {
        callback(sprints);
      } catch (error) {
        console.error('[SprintSystem] Error in status callback:', error);
      }
    });
  }
}

// Singleton instance
export const sprintSystem = new SprintSystem();

