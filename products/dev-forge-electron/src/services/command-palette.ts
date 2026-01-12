/**
 * Command Palette Service
 * 
 * Manages command palette for quick actions.
 * Provides VS Code-style command palette functionality.
 */

export interface Command {
  id: string;
  label: string;
  category: string;
  description?: string;
  icon?: string;
  handler: () => void | Promise<void>;
  shortcut?: string;
  enabled?: () => boolean;
}

export interface CommandPaletteConfig {
  triggerKey: string; // Default: 'Ctrl+Shift+P' or 'F1'
  showShortcuts: boolean;
}

export class CommandPalette {
  private commands: Map<string, Command> = new Map();
  private categories: Map<string, Command[]> = new Map();
  private config: CommandPaletteConfig;
  private isVisible: boolean = false;
  private searchQuery: string = '';

  constructor(config: Partial<CommandPaletteConfig> = {}) {
    this.config = {
      triggerKey: config.triggerKey || 'Ctrl+Shift+P',
      showShortcuts: config.showShortcuts !== false,
    };

    this.initializeDefaultCommands();
    this.setupKeyboardShortcuts();
  }

  /**
   * Initialize default commands
   */
  private initializeDefaultCommands(): void {
    // File commands
    this.registerCommand({
      id: 'file.new',
      label: 'New File',
      category: 'File',
      description: 'Create a new file',
      shortcut: 'Ctrl+N',
      handler: () => {
        console.log('[CommandPalette] New File');
        // TODO: Implement new file
      },
    });

    this.registerCommand({
      id: 'file.open',
      label: 'Open File',
      category: 'File',
      description: 'Open a file',
      shortcut: 'Ctrl+O',
      handler: () => {
        console.log('[CommandPalette] Open File');
        // TODO: Implement open file
      },
    });

    this.registerCommand({
      id: 'file.save',
      label: 'Save',
      category: 'File',
      description: 'Save current file',
      shortcut: 'Ctrl+S',
      handler: () => {
        console.log('[CommandPalette] Save');
        // TODO: Implement save
      },
    });

    // View commands
    this.registerCommand({
      id: 'view.toggle-sidebar',
      label: 'Toggle Sidebar',
      category: 'View',
      description: 'Show or hide the sidebar',
      shortcut: 'Ctrl+B',
      handler: () => {
        console.log('[CommandPalette] Toggle Sidebar');
        // TODO: Implement toggle sidebar
      },
    });

    // AI commands
    this.registerCommand({
      id: 'ai.quick-prompt',
      label: 'Quick Prompt',
      category: 'AI',
      description: 'Open quick prompt panel',
      shortcut: 'Ctrl+K',
      handler: () => {
        console.log('[CommandPalette] Quick Prompt');
        // TODO: Trigger prompt panel
      },
    });

    // Settings commands
    this.registerCommand({
      id: 'settings.open',
      label: 'Open Settings',
      category: 'Settings',
      description: 'Open settings panel',
      handler: () => {
        console.log('[CommandPalette] Open Settings');
        // TODO: Open settings
      },
    });
  }

  /**
   * Register a command
   */
  registerCommand(command: Command): void {
    this.commands.set(command.id, command);

    // Add to category
    if (!this.categories.has(command.category)) {
      this.categories.set(command.category, []);
    }
    this.categories.get(command.category)!.push(command);
  }

  /**
   * Unregister a command
   */
  unregisterCommand(id: string): void {
    const command = this.commands.get(id);
    if (command) {
      this.commands.delete(id);
      const categoryCommands = this.categories.get(command.category);
      if (categoryCommands) {
        const index = categoryCommands.findIndex(c => c.id === id);
        if (index !== -1) {
          categoryCommands.splice(index, 1);
        }
      }
    }
  }

  /**
   * Get command by ID
   */
  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }

  /**
   * Execute command
   */
  async executeCommand(id: string): Promise<void> {
    const command = this.commands.get(id);
    if (!command) {
      throw new Error(`Command ${id} not found`);
    }

    if (command.enabled && !command.enabled()) {
      throw new Error(`Command ${id} is not enabled`);
    }

    await command.handler();
  }

  /**
   * Search commands
   */
  searchCommands(query: string): Command[] {
    const lowerQuery = query.toLowerCase();
    const results: Command[] = [];

    for (const command of this.commands.values()) {
      const matchesLabel = command.label.toLowerCase().includes(lowerQuery);
      const matchesDescription = command.description?.toLowerCase().includes(lowerQuery);
      const matchesCategory = command.category.toLowerCase().includes(lowerQuery);
      const matchesId = command.id.toLowerCase().includes(lowerQuery);

      if (matchesLabel || matchesDescription || matchesCategory || matchesId) {
        results.push(command);
      }
    }

    // Sort by relevance (label matches first, then category)
    results.sort((a, b) => {
      const aLabelMatch = a.label.toLowerCase().includes(lowerQuery);
      const bLabelMatch = b.label.toLowerCase().includes(lowerQuery);
      if (aLabelMatch && !bLabelMatch) return -1;
      if (!aLabelMatch && bLabelMatch) return 1;
      return a.label.localeCompare(b.label);
    });

    return results;
  }

  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): Command[] {
    return this.categories.get(category) || [];
  }

  /**
   * Get all categories
   */
  getAllCategories(): string[] {
    return Array.from(this.categories.keys()).sort();
  }

  /**
   * Get all commands
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (e) => {
      // Trigger command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.show();
      }

      // Execute commands by shortcut
      const shortcut = this.getShortcutString(e);
      for (const command of this.commands.values()) {
        if (command.shortcut && this.matchesShortcut(shortcut, command.shortcut)) {
          e.preventDefault();
          this.executeCommand(command.id).catch(err => {
            console.error(`[CommandPalette] Error executing ${command.id}:`, err);
          });
        }
      }
    });
  }

  /**
   * Get shortcut string from event
   */
  private getShortcutString(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    parts.push(e.key);
    return parts.join('+');
  }

  /**
   * Check if event matches shortcut
   */
  private matchesShortcut(eventShortcut: string, commandShortcut: string): boolean {
    // Normalize shortcuts for comparison
    const normalize = (s: string) => s.replace(/Meta/g, 'Ctrl').toLowerCase();
    return normalize(eventShortcut) === normalize(commandShortcut);
  }

  /**
   * Show command palette
   */
  show(): void {
    this.isVisible = true;
    this.searchQuery = '';
    // TODO: Show UI
    console.log('[CommandPalette] Show');
  }

  /**
   * Hide command palette
   */
  hide(): void {
    this.isVisible = false;
    this.searchQuery = '';
    // TODO: Hide UI
    console.log('[CommandPalette] Hide');
  }

  /**
   * Toggle command palette
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Check if visible
   */
  getVisible(): boolean {
    return this.isVisible;
  }
}

// Singleton instance
export const commandPalette = new CommandPalette();

