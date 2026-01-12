/**
 * Dev Forge Electron - Renderer Process
 * 
 * UI logic for the Electron application.
 * Integrates Monaco Editor and Dev Forge features.
 */

import { initializeMonacoEditor, setEditor, openFileInEditor } from './monaco-setup';
import { FileExplorer } from './file-explorer';
import { applyBranding, removeMicrosoftBranding } from './branding';
import { StatusManager } from './status-manager';
import { AppConfigManager } from './app-config';
import { ModelPanel } from './components/model-panel';
import { PluginPanel } from './components/plugin-panel';
import { FireTeamsPanel } from './components/fire-teams-panel';
import { MultiagentView } from './components/multiagent-view';
import { PromptPanel } from './components/prompt-panel';
import { modelManager } from './model-manager';
import { fireTeamsSystem } from './systems/fire-teams';
import { MultiModelExecutor } from './services/multi-model-executor';
import { SystemIntegration } from './services/system-integration';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Renderer] Dev Forge starting...');

  // Initialize status manager
  initializeStatusManager();

  // Apply branding
  applyBranding();
  removeMicrosoftBranding();

  // Initialize app
  await initializeApp();

  // Initialize Monaco Editor
  await initializeEditor();

  // Set up file opening handler
  setupFileOpening();

  // Update status
  updateStatus('Dev Forge Ready');
});

/**
 * Initialize application
 */
async function initializeApp(): Promise<void> {
  try {
    // Get app version
    const version = await window.electronAPI.getVersion();
    console.log(`[Renderer] Dev Forge v${version}`);

    // Get user data path
    const userDataPath = await window.electronAPI.getUserData();
    console.log(`[Renderer] User data path: ${userDataPath}`);

    // Load configuration
    await loadConfiguration();

    // Initialize UI
    initializeUI();

    // Initialize File Explorer
    await initializeFileExplorer();

    // Initialize Model Panel
    await initializeModelPanel();

    // Initialize Plugin Panel
    await initializePluginPanel();

    // Initialize Fire Teams Panel
    await initializeFireTeamsPanel();

    // Initialize Multi-Model Executor
    initializeMultiModelExecutor();

    // Initialize System Integration
    await initializeSystemIntegration();

    // Initialize Multiagent View
    await initializeMultiagentView();

    // Initialize Prompt Panel
    await initializePromptPanel();

    // Set up sidebar tabs
    setupSidebarTabs();

    // Set up editor tabs
    setupEditorTabs();

  } catch (error) {
    console.error('[Renderer] Initialization error:', error);
    updateStatus('Error initializing Dev Forge');
  }
}

/**
 * Initialize app configuration
 */
async function initializeAppConfig(): Promise<void> {
  appConfig = new AppConfigManager();
  await appConfig.load();
  console.log('[Renderer] App configuration loaded');
}

/**
 * Load configuration
 */
async function loadConfiguration(): Promise<void> {
  try {
    // Initialize app config
    await initializeAppConfig();
    
    // Apply theme from config
    if (appConfig) {
      const theme = appConfig.getTheme();
      document.body.setAttribute('data-theme', theme);
      console.log(`[Renderer] Theme: ${theme}`);
    }

  } catch (error) {
    console.error('[Renderer] Configuration load error:', error);
  }
}

/**
 * Initialize UI
 */
function initializeUI(): void {
  // Remove loading state
  const loadingElement = document.querySelector('.loading');
  if (loadingElement) {
    loadingElement.remove();
  }

    // Create editor container in editor panel
    const editorPanel = document.getElementById('editor-panel');
    if (editorPanel) {
      editorPanel.innerHTML = `
        <div id="monaco-editor-container" style="width: 100%; height: 100%;"></div>
      `;
    }
}

/**
 * Initialize Monaco Editor
 */
async function initializeEditor(): Promise<void> {
  try {
    // Wait for Monaco to be loaded
    while (typeof window.monaco === 'undefined') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Initialize Monaco Editor
    const editor = await initializeMonacoEditor('monaco-editor-container');
    setEditor(editor);
    
    // Store globally for file opening
    (window as any).__devForgeEditor = editor;

    console.log('[Renderer] Monaco Editor initialized');
    updateStatus('Monaco Editor ready', 2000);

    // Add editor event listeners
    if (editor && typeof editor.onDidChangeModelContent === 'function') {
      editor.onDidChangeModelContent(() => {
        // Handle content changes
        updateStatus('Modified', 2000);
      });
    }

  } catch (error) {
    console.error('[Renderer] Editor initialization error:', error);
    updateStatus('Error initializing editor');
  }
}

/**
 * Initialize File Explorer
 */
async function initializeFileExplorer(): Promise<void> {
  try {
    // Get user's home directory or current working directory
    const homePath = await window.electronAPI.getPath('home');
    const explorer = new FileExplorer('file-explorer-container', homePath);
    console.log('[Renderer] File Explorer initialized');
    updateStatus('File Explorer ready', 2000);
  } catch (error) {
    console.error('[Renderer] File Explorer initialization error:', error);
    updateStatus('File Explorer error', 5000);
  }
}

/**
 * Set up file opening handler
 */
function setupFileOpening(): void {
  window.addEventListener('file:open', async (event: any) => {
    const { path, content } = event.detail;
    const editor = getEditor();
    
    if (editor) {
      await openFileInEditor(editor, path, content);
      const fileName = path.split('/').pop() || path;
      updateStatus(`Opened: ${fileName}`, 3000);
    } else {
      updateStatus('Editor not ready', 3000);
    }
  });
}

/**
 * Get editor instance
 */
function getEditor(): any {
  // Import getEditor from monaco-setup
  // For now, we'll store it globally
  return (window as any).__devForgeEditor;
}

// Status manager instance
let statusManager: StatusManager | null = null;

// App config manager instance
let appConfig: AppConfigManager | null = null;

// Multi-model executor instance
let multiModelExecutor: MultiModelExecutor | null = null;

// System integration instance
let systemIntegration: SystemIntegration | null = null;

/**
 * Initialize status manager
 */
function initializeStatusManager(): void {
  statusManager = new StatusManager();
}

/**
 * Initialize Model Panel
 */
async function initializeModelPanel(): Promise<void> {
  try {
    const modelPanel = new ModelPanel('model-panel-container', modelManager);
    modelPanel.render();
    console.log('[Renderer] Model Panel initialized');
    updateStatus('Model Panel ready', 2000);
  } catch (error) {
    console.error('[Renderer] Model Panel initialization error:', error);
    updateStatus('Model Panel error', 5000);
  }
}

/**
 * Initialize Plugin Panel
 */
async function initializePluginPanel(): Promise<void> {
  try {
    const pluginPanel = new PluginPanel('plugin-panel-container');
    pluginPanel.render();
    console.log('[Renderer] Plugin Panel initialized');
    updateStatus('Plugin Panel ready', 2000);
  } catch (error) {
    console.error('[Renderer] Plugin Panel initialization error:', error);
    updateStatus('Plugin Panel error', 5000);
  }
}

/**
 * Initialize Fire Teams Panel
 */
async function initializeFireTeamsPanel(): Promise<void> {
  try {
    const fireTeamsPanel = new FireTeamsPanel('fire-teams-panel-container', fireTeamsSystem);
    fireTeamsPanel.render();
    console.log('[Renderer] Fire Teams Panel initialized');
    updateStatus('Fire Teams Panel ready', 2000);
  } catch (error) {
    console.error('[Renderer] Fire Teams Panel initialization error:', error);
    updateStatus('Fire Teams Panel error', 5000);
  }
}

/**
 * Initialize System Integration
 */
async function initializeSystemIntegration(): Promise<void> {
  try {
    if (!multiModelExecutor) {
      console.warn('[Renderer] Multi-Model Executor not initialized yet');
      return;
    }

    systemIntegration = new SystemIntegration(
      modelManager,
      fireTeamsSystem,
      multiModelExecutor
    );
    
    await systemIntegration.initialize();
    console.log('[Renderer] System Integration initialized');
    updateStatus('All systems integrated', 2000);
  } catch (error) {
    console.error('[Renderer] System Integration initialization error:', error);
    updateStatus('System integration error', 5000);
  }
}

/**
 * Initialize Multiagent View
 */
async function initializeMultiagentView(): Promise<void> {
  try {
    if (!multiModelExecutor) {
      console.warn('[Renderer] Multi-Model Executor not initialized yet');
      return;
    }

    const multiagentView = new MultiagentView(
      'multiagent-view-container',
      fireTeamsSystem,
      multiModelExecutor
    );
    multiagentView.render();
    console.log('[Renderer] Multiagent View initialized');
    updateStatus('Multiagent View ready', 2000);
  } catch (error) {
    console.error('[Renderer] Multiagent View initialization error:', error);
    updateStatus('Multiagent View error', 5000);
  }
}

/**
 * Initialize Multi-Model Executor
 */
function initializeMultiModelExecutor(): void {
  multiModelExecutor = new MultiModelExecutor(modelManager);
  console.log('[Renderer] Multi-Model Executor initialized');
}

/**
 * Initialize Prompt Panel
 */
async function initializePromptPanel(): Promise<void> {
  try {
    if (!multiModelExecutor) {
      console.warn('[Renderer] Multi-Model Executor not initialized yet');
      return;
    }

    const promptPanel = new PromptPanel('prompt-panel-container', multiModelExecutor);
    promptPanel.render();
    console.log('[Renderer] Prompt Panel initialized');
    
    // Make prompt panel accessible globally for keyboard shortcuts
    (window as any).__promptPanel = promptPanel;
    
    updateStatus('Prompt Panel ready (Ctrl+K)', 2000);
  } catch (error) {
    console.error('[Renderer] Prompt Panel initialization error:', error);
    updateStatus('Prompt Panel error', 5000);
  }
}

/**
 * Set up editor tabs
 */
function setupEditorTabs(): void {
  const tabs = document.querySelectorAll('.editor-tab');
  const panels = document.querySelectorAll('.editor-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update tab states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update panel states
      panels.forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(`${targetTab}-panel`) || 
                         document.getElementById(`${targetTab}-view-container`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/**
 * Set up sidebar tabs
 */
function setupSidebarTabs(): void {
  const tabs = document.querySelectorAll('.sidebar-tab');
  const panels = document.querySelectorAll('.sidebar-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update tab states
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update panel states
      panels.forEach(p => p.classList.remove('active'));
      const targetPanel = document.getElementById(`${targetTab}-panel-container`) || 
                         document.querySelector(`[data-panel="${targetTab}"]`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/**
 * Update status bar
 */
function updateStatus(message: string, duration?: number): void {
  if (statusManager) {
    statusManager.update(message, duration);
  } else {
    // Fallback
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      statusBar.textContent = message;
    }
  }
}
