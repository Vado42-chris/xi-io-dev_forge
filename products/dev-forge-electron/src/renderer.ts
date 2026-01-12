/**
 * Dev Forge Electron - Renderer Process
 * 
 * UI logic for the Electron application.
 * Integrates Monaco Editor and Dev Forge features.
 */

import { initializeMonacoEditor, setEditor } from './monaco-setup';
import { FileExplorer } from './file-explorer';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Renderer] Dev Forge starting...');

  // Initialize app
  await initializeApp();

  // Initialize Monaco Editor
  await initializeEditor();

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

  } catch (error) {
    console.error('[Renderer] Initialization error:', error);
    updateStatus('Error initializing Dev Forge');
  }
}

/**
 * Load configuration
 */
async function loadConfiguration(): Promise<void> {
  try {
    // Load user preferences
    const theme = await window.electronAPI.getConfig('ui.theme') || 'xibalba-dark';
    console.log(`[Renderer] Theme: ${theme}`);

    // Apply theme
    document.body.setAttribute('data-theme', theme);

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

  // Create editor container
  const editorArea = document.querySelector('.editor-area');
  if (editorArea) {
    editorArea.innerHTML = `
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

    console.log('[Renderer] Monaco Editor initialized');

    // Add editor event listeners
    if (editor && typeof editor.onDidChangeModelContent === 'function') {
      editor.onDidChangeModelContent(() => {
        // Handle content changes
        updateStatus('Modified');
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
  } catch (error) {
    console.error('[Renderer] File Explorer initialization error:', error);
  }
}

/**
 * Update status bar
 */
function updateStatus(message: string): void {
  const statusBar = document.querySelector('.status-bar');
  if (statusBar) {
    statusBar.textContent = message;
  }
}
