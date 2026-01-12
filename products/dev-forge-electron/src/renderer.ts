/**
 * Dev Forge Electron - Renderer Process
 * 
 * UI logic for the Electron application.
 * This will eventually integrate Monaco Editor and Dev Forge features.
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Renderer] Dev Forge starting...');

  // Initialize app
  await initializeApp();

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

  // Create placeholder editor area
  const editorArea = document.querySelector('.editor-area');
  if (editorArea) {
    editorArea.innerHTML = `
      <div style="padding: 20px; color: #CCCCCC;">
        <h2 style="font-family: 'Antonio', sans-serif; font-weight: 100; margin-bottom: 16px;">
          Dev Forge Editor
        </h2>
        <p style="margin-bottom: 8px;">Monaco Editor will be integrated here.</p>
        <p style="margin-bottom: 8px;">Dev Forge features will be added:</p>
        <ul style="margin-left: 24px; margin-top: 8px;">
          <li>AI Model Management</li>
          <li>Multi-Model Execution</li>
          <li>Fire Teams</li>
          <li>Wargaming Systems</li>
          <li>Plugin System</li>
        </ul>
      </div>
    `;
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

