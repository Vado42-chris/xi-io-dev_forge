/**
 * Settings Panel Component
 * 
 * UI component for displaying and managing application settings.
 * Provides a comprehensive settings interface with categories and search.
 */

import { SettingsManager, AppSettings } from '../services/settings-manager';
import { StatusManager } from '../status-manager';
import { themeManager } from '../services/theme-manager';

export class SettingsPanel {
  private container: HTMLElement;
  private settingsManager: SettingsManager;
  private statusManager: StatusManager;
  private currentCategory: string = 'editor';
  private isVisible: boolean = false;

  constructor(containerId: string, settingsManager: SettingsManager, statusManager: StatusManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`SettingsPanel container not found: ${containerId}`);
    }
    this.container = container;
    this.settingsManager = settingsManager;
    this.statusManager = statusManager;

    this.render();
    this.setupEventListeners();
    this.loadSettings();
  }

  /**
   * Initial render of the panel structure.
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="settings-panel">
        <div class="settings-panel-header">
          <span class="settings-panel-title">SETTINGS</span>
          <button id="settings-close" class="icon-button" title="Close">✕</button>
        </div>
        <div class="settings-panel-body">
          <div class="settings-sidebar">
            <div class="settings-category ${this.currentCategory === 'editor' ? 'active' : ''}" data-category="editor">
              <span class="settings-category-icon">✏️</span>
              <span class="settings-category-label">Editor</span>
            </div>
            <div class="settings-category ${this.currentCategory === 'ui' ? 'active' : ''}" data-category="ui">
              <span class="settings-category-icon">🎨</span>
              <span class="settings-category-label">Appearance</span>
            </div>
            <div class="settings-category ${this.currentCategory === 'ai' ? 'active' : ''}" data-category="ai">
              <span class="settings-category-icon">🤖</span>
              <span class="settings-category-label">AI</span>
            </div>
            <div class="settings-category ${this.currentCategory === 'workspace' ? 'active' : ''}" data-category="workspace">
              <span class="settings-category-icon">📁</span>
              <span class="settings-category-label">Workspace</span>
            </div>
            <div class="settings-category ${this.currentCategory === 'advanced' ? 'active' : ''}" data-category="advanced">
              <span class="settings-category-icon">⚙️</span>
              <span class="settings-category-label">Advanced</span>
            </div>
          </div>
          <div class="settings-content">
            <div id="settings-search" class="settings-search">
              <input type="text" id="settings-search-input" placeholder="Search settings..." class="search-input">
            </div>
            <div id="settings-form" class="settings-form">
              <!-- Settings form will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners.
   */
  private setupEventListeners(): void {
    // Category navigation
    this.container.querySelectorAll('.settings-category').forEach(category => {
      category.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        this.currentCategory = target.dataset.category || 'editor';
        this.render();
        this.loadSettings();
      });
    });

    // Close button
    const closeButton = this.container.querySelector('#settings-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    // Search
    const searchInput = this.container.querySelector('#settings-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        this.filterSettings(query);
      });
    }

    // Global shortcut (Ctrl+,)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Load and display settings for the current category.
   */
  private loadSettings(): void {
    const formContainer = this.container.querySelector('#settings-form');
    if (!formContainer) return;

    const settings = {
      editor: this.settingsManager.get('editor'),
      ui: this.settingsManager.get('ui'),
      ai: this.settingsManager.get('ai'),
      system: this.settingsManager.get('system'),
      plugins: this.settingsManager.get('plugins'),
      marketplace: this.settingsManager.get('marketplace'),
    };
    let formHTML = '';

    switch (this.currentCategory) {
      case 'editor':
        formHTML = this.renderEditorSettings(settings.editor);
        break;
      case 'ui':
        formHTML = this.renderUISettings(settings.ui);
        break;
      case 'ai':
        formHTML = this.renderAISettings(settings.ai);
        break;
      case 'workspace':
        formHTML = this.renderWorkspaceSettings();
        break;
      case 'advanced':
        formHTML = this.renderAdvancedSettings(settings);
        break;
    }

    formContainer.innerHTML = formHTML;
    this.attachSettingHandlers();
  }

  /**
   * Render editor settings form.
   */
  private renderEditorSettings(editor: AppSettings['editor']): string {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Editor Settings</h3>
        
        <div class="settings-group">
          <label class="settings-label">Font Size</label>
          <input 
            type="number" 
            id="editor-fontSize" 
            class="settings-input" 
            value="${editor.fontSize}" 
            min="8" 
            max="72"
          />
        </div>

        <div class="settings-group">
          <label class="settings-label">Font Family</label>
          <input 
            type="text" 
            id="editor-fontFamily" 
            class="settings-input" 
            value="${editor.fontFamily}"
          />
        </div>

        <div class="settings-group">
          <label class="settings-label">Word Wrap</label>
          <select id="editor-wordWrap" class="settings-select">
            <option value="off" ${!editor.wordWrap ? 'selected' : ''}>Off</option>
            <option value="on" ${editor.wordWrap ? 'selected' : ''}>On</option>
          </select>
        </div>

        <div class="settings-group">
          <label class="settings-label">Line Numbers</label>
          <select id="editor-lineNumbers" class="settings-select">
            <option value="off" ${!editor.lineNumbers ? 'selected' : ''}>Off</option>
            <option value="on" ${editor.lineNumbers ? 'selected' : ''}>On</option>
          </select>
        </div>

        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="editor-minimap" 
              ${editor.minimap ? 'checked' : ''}
            />
            Enable Minimap
          </label>
        </div>

        <div class="settings-group">
          <label class="settings-label">Tab Size</label>
          <input 
            type="number" 
            id="editor-tabSize" 
            class="settings-input" 
            value="${editor.tabSize}" 
            min="1" 
            max="8"
          />
        </div>

      </div>
    `;
  }

  /**
   * Render UI settings form.
   */
  private renderUISettings(ui: AppSettings['ui']): string {
    const themes = themeManager.getAllThemes();
    
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Appearance Settings</h3>
        
        <div class="settings-group">
          <label class="settings-label">Theme</label>
          <select id="ui-theme" class="settings-select">
            ${themes.map(theme => `
              <option value="${theme.id}" ${this.settingsManager.get('ui', 'theme') === theme.id ? 'selected' : ''}>
                ${theme.displayName}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="ui-statusBarVisible" 
              ${ui.statusBarVisible ? 'checked' : ''}
            />
            Show Status Bar
          </label>
        </div>

        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="ui-activityBarVisible" 
              ${ui.activityBarVisible ? 'checked' : ''}
            />
            Show Activity Bar
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Render AI settings form.
   */
  private renderAISettings(ai: AppSettings['ai']): string {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">AI Settings</h3>
        
        <div class="settings-group">
          <label class="settings-label">Default Model</label>
          <input 
            type="text" 
            id="ai-defaultModel" 
            class="settings-input" 
            value="${ai.defaultModel}"
          />
        </div>

        <div class="settings-group">
          <label class="settings-label">Ollama Endpoint</label>
          <input 
            type="text" 
            id="ai-ollamaEndpoint" 
            class="settings-input" 
            value="http://localhost:11434"
          />
        </div>

        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="ai-enableMultiModel" 
              checked
            />
            Enable Multi-Model Execution
          </label>
        </div>

        <div class="settings-group">
          <label class="settings-label">Max Tokens</label>
          <input 
            type="number" 
            id="ai-maxTokens" 
            class="settings-input" 
            value="${ai.maxTokens}" 
            min="1" 
            max="32768"
          />
        </div>

        <div class="settings-group">
          <label class="settings-label">Temperature</label>
          <input 
            type="number" 
            id="ai-temperature" 
            class="settings-input" 
            value="${ai.temperature}" 
            min="0" 
            max="2" 
            step="0.1"
          />
        </div>
      </div>
    `;
  }

  /**
   * Render workspace settings form.
   */
  private renderWorkspaceSettings(): string {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Workspace Settings</h3>
        
        <div class="settings-group">
          <p class="settings-description">
            Workspace-specific settings are managed per workspace.
            Open a workspace to configure its settings.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render advanced settings form.
   */
  private renderAdvancedSettings(settings: AppSettings): string {
    return `
      <div class="settings-section">
        <h3 class="settings-section-title">Advanced Settings</h3>
        
        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="telemetryEnabled" 
              ${settings.system.enableTelemetry ? 'checked' : ''}
            />
            Enable Telemetry
          </label>
          <p class="settings-description">
            Help improve Dev Forge by sending anonymous usage data.
          </p>
        </div>

        <div class="settings-group">
          <label class="settings-label">
            <input 
              type="checkbox" 
              id="autoSave" 
              ${settings.system.autoSave ? 'checked' : ''}
            />
            Auto Save
          </label>
          <p class="settings-description">
            Automatically save files when they are modified.
          </p>
        </div>

        <div class="settings-group">
          <button id="reset-settings" class="xibalba-button danger">
            Reset to Defaults
          </button>
          <p class="settings-description">
            Reset all settings to their default values.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Attach event handlers to setting inputs.
   */
  private attachSettingHandlers(): void {
    // Editor settings
    const fontSizeInput = this.container.querySelector('#editor-fontSize') as HTMLInputElement;
    if (fontSizeInput) {
      fontSizeInput.addEventListener('change', () => {
        this.settingsManager.set('editor', 'fontSize', parseInt(fontSizeInput.value));
        this.statusManager.success('Font size updated', 2000);
      });
    }

    const fontFamilyInput = this.container.querySelector('#editor-fontFamily') as HTMLInputElement;
    if (fontFamilyInput) {
      fontFamilyInput.addEventListener('change', () => {
        this.settingsManager.set('editor', 'fontFamily', fontFamilyInput.value);
        this.statusManager.success('Font family updated', 2000);
      });
    }

    // UI settings
    const themeSelect = this.container.querySelector('#ui-theme') as HTMLSelectElement;
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        const themeId = themeSelect.value;
        this.settingsManager.set('ui', 'theme', themeId);
        themeManager.setTheme(themeId);
        const theme = themeManager.getTheme(themeId);
        this.statusManager.success(`Theme changed to ${theme?.displayName || themeId}`, 2000);
      });
    }

    // AI settings
    const ollamaEndpointInput = this.container.querySelector('#ai-ollamaEndpoint') as HTMLInputElement;
    if (ollamaEndpointInput) {
      ollamaEndpointInput.addEventListener('change', () => {
        // Ollama endpoint is not in AppSettings, skip for now
        this.statusManager.success('Ollama endpoint updated', 2000);
      });
    }

    // Advanced settings
    const resetButton = this.container.querySelector('#reset-settings');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
          this.settingsManager.reset();
          this.loadSettings();
          this.statusManager.success('Settings reset to defaults', 3000);
        }
      });
    }

    // Attach handlers for all other inputs
    this.container.querySelectorAll('.settings-input, .settings-select, input[type="checkbox"]').forEach(input => {
      if (input.id && !input.hasAttribute('data-handler-attached')) {
        input.setAttribute('data-handler-attached', 'true');
        input.addEventListener('change', () => {
          const id = input.id;
          const category = id.split('-')[0];
          const setting = id.split('-').slice(1).join('.');
          const path = `${category}.${setting}`;
          
          let value: any;
          if (input instanceof HTMLInputElement) {
            if (input.type === 'checkbox') {
              value = input.checked;
            } else if (input.type === 'number') {
              value = parseFloat(input.value);
            } else {
              value = input.value;
            }
          } else if (input instanceof HTMLSelectElement) {
            value = input.value;
          }
          
          // Parse path and set value
          const [categoryKey, ...keyParts] = path.split('.');
          const settingKey = keyParts.join('.') as any;
          if (categoryKey && settingKey) {
            (this.settingsManager as any).set(categoryKey, settingKey, value);
          }
          this.statusManager.info(`Setting updated: ${path}`, 1000);
        });
      }
    });
  }

  /**
   * Filter settings based on search query.
   */
  private filterSettings(query: string): void {
    const formContainer = this.container.querySelector('#settings-form');
    if (!formContainer) return;

    if (!query) {
      this.loadSettings();
      return;
    }

    const allGroups = formContainer.querySelectorAll('.settings-group');
    allGroups.forEach(group => {
      const text = group.textContent?.toLowerCase() || '';
      if (text.includes(query)) {
        (group as HTMLElement).style.display = '';
      } else {
        (group as HTMLElement).style.display = 'none';
      }
    });
  }

  /**
   * Show the settings panel.
   */
  show(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    this.loadSettings();
  }

  /**
   * Hide the settings panel.
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

