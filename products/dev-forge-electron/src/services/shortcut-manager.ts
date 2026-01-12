/**
 * Shortcut Manager
 * 
 * Manages keyboard shortcuts and hotkeys for Dev Forge.
 * Provides centralized shortcut registration and handling.
 */

export interface Shortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void | Promise<void>;
  description: string;
  category?: string;
}

export class ShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    // No-op constructor, initialization happens in `initialize`
  }

  /**
   * Initialize the shortcut manager with default shortcuts.
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[ShortcutManager] Already initialized.');
      return;
    }

    this.registerDefaultShortcuts();
    this.setupGlobalListener();
    this.isInitialized = true;
    console.log('[ShortcutManager] Initialized with default shortcuts.');
  }

  /**
   * Register default shortcuts.
   */
  private registerDefaultShortcuts(): void {
    // File operations
    this.register({
      id: 'file.new',
      key: 'N',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:new-file'));
        console.log('[ShortcutManager] New file');
      },
      description: 'New File',
      category: 'File'
    });

    this.register({
      id: 'file.open',
      key: 'O',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:open-file'));
        console.log('[ShortcutManager] Open file');
      },
      description: 'Open File',
      category: 'File'
    });

    this.register({
      id: 'file.save',
      key: 'S',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:save-file'));
        console.log('[ShortcutManager] Save file');
      },
      description: 'Save File',
      category: 'File'
    });

    // Editor operations
    this.register({
      id: 'editor.find',
      key: 'F',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:find'));
        console.log('[ShortcutManager] Find');
      },
      description: 'Find',
      category: 'Editor'
    });

    this.register({
      id: 'editor.replace',
      key: 'H',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:replace'));
        console.log('[ShortcutManager] Replace');
      },
      description: 'Replace',
      category: 'Editor'
    });

    // Command palette
    this.register({
      id: 'command.palette',
      key: 'P',
      ctrl: true,
      shift: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:command-palette'));
        console.log('[ShortcutManager] Command palette');
      },
      description: 'Command Palette',
      category: 'General'
    });

    // Quick AI prompt
    this.register({
      id: 'ai.quick',
      key: 'K',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:quick-ai'));
        console.log('[ShortcutManager] Quick AI prompt');
      },
      description: 'Quick AI Prompt',
      category: 'AI'
    });

    // Settings
    this.register({
      id: 'settings.open',
      key: ',',
      ctrl: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:open-settings'));
        console.log('[ShortcutManager] Open settings');
      },
      description: 'Open Settings',
      category: 'Settings'
    });

    // Theme toggle
    this.register({
      id: 'theme.toggle',
      key: 'T',
      ctrl: true,
      shift: true,
      handler: () => {
        document.dispatchEvent(new CustomEvent('devforge:toggle-theme'));
        console.log('[ShortcutManager] Toggle theme');
      },
      description: 'Toggle Theme',
      category: 'Settings'
    });
  }

  /**
   * Register a new shortcut.
   */
  register(shortcut: Shortcut): void {
    if (this.shortcuts.has(shortcut.id)) {
      console.warn(`[ShortcutManager] Shortcut ${shortcut.id} already registered. Overwriting.`);
    }
    this.shortcuts.set(shortcut.id, shortcut);
  }

  /**
   * Unregister a shortcut.
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * Get a shortcut by ID.
   */
  getShortcut(id: string): Shortcut | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Get all shortcuts.
   */
  getAllShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category.
   */
  getShortcutsByCategory(category: string): Shortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  /**
   * Set up global keyboard listener.
   */
  private setupGlobalListener(): void {
    document.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow some shortcuts even in inputs (like Ctrl+S to save)
        const allowedInInput = ['file.save', 'file.new', 'file.open', 'command.palette'];
        const shortcut = this.findMatchingShortcut(e);
        if (shortcut && !allowedInInput.includes(shortcut.id)) {
          return;
        }
      }

      const shortcut = this.findMatchingShortcut(e);
      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();
        shortcut.handler();
      }
    });
  }

  /**
   * Find a shortcut matching the keyboard event.
   */
  private findMatchingShortcut(e: KeyboardEvent): Shortcut | undefined {
    const key = e.key.toUpperCase();
    
    for (const shortcut of this.shortcuts.values()) {
      const shortcutKey = shortcut.key.toUpperCase();
      
      // Check modifiers
      const ctrlMatch = (shortcut.ctrl === undefined || shortcut.ctrl === false) ? !e.ctrlKey : e.ctrlKey;
      const shiftMatch = (shortcut.shift === undefined || shortcut.shift === false) ? !e.shiftKey : e.shiftKey;
      const altMatch = (shortcut.alt === undefined || shortcut.alt === false) ? !e.altKey : e.altKey;
      const metaMatch = (shortcut.meta === undefined || shortcut.meta === false) ? !e.metaKey : e.metaKey;
      
      // Check key
      const keyMatch = shortcutKey === key;
      
      if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
        return shortcut;
      }
    }
    
    return undefined;
  }

  /**
   * Get shortcut string representation (e.g., "Ctrl+S").
   */
  getShortcutString(id: string): string {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return '';

    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    parts.push(shortcut.key);

    return parts.join('+');
  }
}

export const shortcutManager = new ShortcutManager();

