/**
 * Command Palette Panel Component
 * 
 * UI component for displaying and interacting with the command palette.
 * Provides quick access to all registered commands via keyboard shortcuts.
 */

import { CommandPalette, Command } from '../services/command-palette';
import { StatusManager } from '../status-manager';

export class CommandPalettePanel {
  private container: HTMLElement;
  private commandPalette: CommandPalette;
  private statusManager: StatusManager;
  private isVisible: boolean = false;
  private currentQuery: string = '';
  private selectedIndex: number = 0;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, commandPalette: CommandPalette, statusManager: StatusManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`CommandPalettePanel container not found: ${containerId}`);
    }
    this.container = container;
    this.commandPalette = commandPalette;
    this.statusManager = statusManager;

    this.render();
    this.setupEventListeners();
    this.subscribeToCommands();
    this.hide(); // Start hidden
  }

  /**
   * Initial render of the panel structure.
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="command-palette-overlay"></div>
      <div class="command-palette-container">
        <div class="command-palette-header">
          <input 
            type="text" 
            id="command-palette-input" 
            class="command-palette-input" 
            placeholder="Type a command name or search..."
            autocomplete="off"
          />
        </div>
        <div id="command-palette-results" class="command-palette-results">
          <!-- Commands will be rendered here -->
        </div>
        <div class="command-palette-footer">
          <span class="command-palette-hint">↑↓ to navigate, Enter to execute, Esc to close</span>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners for keyboard and input handling.
   */
  private setupEventListeners(): void {
    const input = this.container.querySelector('#command-palette-input') as HTMLInputElement;
    if (!input) return;

    // Input search
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.currentQuery = target.value;
      this.selectedIndex = 0;
      this.renderResults();
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.getFilteredCommands().length - 1);
          this.renderResults();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(0, this.selectedIndex - 1);
          this.renderResults();
          break;
        case 'Enter':
          e.preventDefault();
          this.executeSelected();
          break;
        case 'Escape':
          e.preventDefault();
          this.hide();
          break;
      }
    });

    // Click outside to close
    const overlay = this.container.querySelector('.command-palette-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.hide());
    }

    // Global shortcut listener (Ctrl+Shift+P)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Subscribe to command palette updates.
   */
  private subscribeToCommands(): void {
    this.unsubscribe = this.commandPalette.subscribe(() => {
      this.renderResults();
    });
  }

  /**
   * Get filtered commands based on current query.
   */
  private getFilteredCommands(): Command[] {
    if (!this.currentQuery) {
      return this.commandPalette.getAllCommands();
    }
    return this.commandPalette.searchCommands(this.currentQuery);
  }

  /**
   * Render command results.
   */
  private renderResults(): void {
    const resultsContainer = this.container.querySelector('#command-palette-results');
    if (!resultsContainer) return;

    const commands = this.getFilteredCommands();

    if (commands.length === 0) {
      resultsContainer.innerHTML = '<div class="command-palette-empty">No commands found.</div>';
      return;
    }

    resultsContainer.innerHTML = commands.map((command, index) => `
      <div 
        class="command-palette-item ${index === this.selectedIndex ? 'selected' : ''}" 
        data-command-id="${command.id}"
      >
        <div class="command-palette-item-content">
          <span class="command-palette-item-label">${this.highlightMatch(command.label, this.currentQuery)}</span>
          <span class="command-palette-item-description">${command.description}</span>
        </div>
        ${command.category ? `<span class="command-palette-item-category">${command.category}</span>` : ''}
      </div>
    `).join('');

    // Scroll selected item into view
    const selectedItem = resultsContainer.querySelector('.command-palette-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Highlight matching text in command label.
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Execute the selected command.
   */
  private async executeSelected(): Promise<void> {
    const commands = this.getFilteredCommands();
    if (commands.length === 0) return;

    const selectedCommand = commands[this.selectedIndex];
    if (!selectedCommand) return;

    try {
      await this.commandPalette.executeCommand(selectedCommand.id);
      this.statusManager.update(`Executed: ${selectedCommand.label}`, 'success', 2000);
      this.hide();
    } catch (error: any) {
      console.error('[CommandPalettePanel] Error executing command:', error);
      this.statusManager.update(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Show the command palette.
   */
  show(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    const input = this.container.querySelector('#command-palette-input') as HTMLInputElement;
    if (input) {
      input.focus();
      input.value = '';
      this.currentQuery = '';
      this.selectedIndex = 0;
      this.renderResults();
    }
  }

  /**
   * Hide the command palette.
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

  /**
   * Dispose of the component.
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

