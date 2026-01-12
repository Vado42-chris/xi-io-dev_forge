/**
 * Plugin Panel Component
 * 
 * UI component for managing plugins in the Electron app.
 */

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  status: 'loaded' | 'unloaded' | 'error';
  author?: string;
  permissions?: string[];
}

export class PluginPanel {
  private container: HTMLElement;
  private plugins: Map<string, PluginInfo> = new Map();
  private statusCallbacks: Set<(plugins: PluginInfo[]) => void> = new Set();

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
  }

  /**
   * Render the plugin panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="plugin-panel">
        <div class="plugin-panel-header">
          <h3>PLUGINS</h3>
          <button id="refresh-plugins" class="icon-button" title="Refresh plugins">🔄</button>
        </div>
        <div class="plugin-panel-content">
          <div id="plugins-list" class="plugins-list">
            <!-- Plugins will be rendered here -->
          </div>
        </div>
        <div class="plugin-panel-footer">
          <button id="install-plugin" class="btn-secondary btn-small">Install Plugin</button>
          <button id="browse-plugins" class="btn-secondary btn-small">Browse Marketplace</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Initial render
    this.renderPlugins(Array.from(this.plugins.values()));

    // Load plugins (will be integrated with core SDK)
    this.loadPlugins();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Refresh plugins button
    const refreshBtn = this.container.querySelector('#refresh-plugins');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadPlugins();
      });
    }

    // Install plugin button
    const installBtn = this.container.querySelector('#install-plugin');
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        this.showInstallPluginDialog();
      });
    }

    // Browse plugins button
    const browseBtn = this.container.querySelector('#browse-plugins');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => {
        this.showMarketplace();
      });
    }
  }

  /**
   * Load plugins
   */
  private async loadPlugins(): Promise<void> {
    try {
      // TODO: Integrate with core SDK PluginManager
      // For now, show placeholder
      const placeholderPlugins: PluginInfo[] = [
        {
          id: 'example-plugin',
          name: 'Example Plugin',
          version: '1.0.0',
          description: 'An example plugin for demonstration',
          enabled: true,
          status: 'loaded',
          author: 'Dev Forge Team',
          permissions: ['read', 'write'],
        },
      ];

      this.plugins.clear();
      placeholderPlugins.forEach(plugin => {
        this.plugins.set(plugin.id, plugin);
      });

      this.renderPlugins(Array.from(this.plugins.values()));
      this.notifyStatusChange();
    } catch (error) {
      console.error('[PluginPanel] Error loading plugins:', error);
    }
  }

  /**
   * Render plugins list
   */
  private renderPlugins(plugins: PluginInfo[]): void {
    const listContainer = this.container.querySelector('#plugins-list');
    if (!listContainer) return;

    if (plugins.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No plugins installed</div>';
      return;
    }

    listContainer.innerHTML = plugins.map(plugin => this.renderPluginCard(plugin)).join('');
    
    // Set up plugin card event listeners
    plugins.forEach(plugin => {
      const card = this.container.querySelector(`[data-plugin-id="${plugin.id}"]`);
      if (card) {
        // Enable/disable toggle
        const enableToggle = card.querySelector('.plugin-enable-toggle');
        if (enableToggle) {
          enableToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.setPluginEnabled(plugin.id, target.checked);
          });
        }

        // Uninstall button
        const uninstallBtn = card.querySelector('.plugin-uninstall');
        if (uninstallBtn) {
          uninstallBtn.addEventListener('click', () => {
            this.uninstallPlugin(plugin.id);
          });
        }

        // Settings button
        const settingsBtn = card.querySelector('.plugin-settings');
        if (settingsBtn) {
          settingsBtn.addEventListener('click', () => {
            this.showPluginSettings(plugin.id);
          });
        }
      }
    });
  }

  /**
   * Render individual plugin card
   */
  private renderPluginCard(plugin: PluginInfo): string {
    const statusClass = `status-${plugin.status}`;
    const statusIcon = this.getStatusIcon(plugin.status);

    return `
      <div class="plugin-card" data-plugin-id="${plugin.id}">
        <div class="plugin-card-header">
          <div class="plugin-info">
            <span class="plugin-name">${plugin.name}</span>
            <span class="plugin-version">v${plugin.version}</span>
          </div>
          <div class="plugin-status ${statusClass}">
            ${statusIcon}
          </div>
        </div>
        <div class="plugin-card-body">
          <p class="plugin-description">${plugin.description}</p>
          ${plugin.author ? `<p class="plugin-author">by ${plugin.author}</p>` : ''}
          ${plugin.permissions && plugin.permissions.length > 0 ? `
            <div class="plugin-permissions">
              <span class="permissions-label">Permissions:</span>
              ${plugin.permissions.map(p => `<span class="permission-badge">${p}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="plugin-card-footer">
          <label class="plugin-enable-label">
            <input type="checkbox" class="plugin-enable-toggle" ${plugin.enabled ? 'checked' : ''}>
            <span>Enabled</span>
          </label>
          <div class="plugin-actions">
            <button class="plugin-settings btn-secondary btn-small">Settings</button>
            <button class="plugin-uninstall btn-secondary btn-small">Uninstall</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: PluginInfo['status']): string {
    switch (status) {
      case 'loaded':
        return '🟢';
      case 'unloaded':
        return '⚪';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Set plugin enabled state
   */
  private setPluginEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      // TODO: Integrate with core SDK to actually enable/disable
      this.renderPlugins(Array.from(this.plugins.values()));
      this.notifyStatusChange();
    }
  }

  /**
   * Uninstall plugin
   */
  private async uninstallPlugin(pluginId: string): Promise<void> {
    if (confirm(`Are you sure you want to uninstall "${this.plugins.get(pluginId)?.name}"?`)) {
      // TODO: Integrate with core SDK to actually uninstall
      this.plugins.delete(pluginId);
      this.renderPlugins(Array.from(this.plugins.values()));
      this.notifyStatusChange();
    }
  }

  /**
   * Show plugin settings
   */
  private showPluginSettings(pluginId: string): void {
    // TODO: Implement plugin settings dialog
    alert(`Settings for plugin: ${this.plugins.get(pluginId)?.name}`);
  }

  /**
   * Show install plugin dialog
   */
  private showInstallPluginDialog(): void {
    // TODO: Implement install plugin dialog
    alert('Install plugin dialog - coming soon');
  }

  /**
   * Show marketplace
   */
  private showMarketplace(): void {
    // TODO: Open marketplace in browser or embedded view
    window.open('https://marketplace.dev-forge.com', '_blank');
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (plugins: PluginInfo[]) => void): () => void {
    this.statusCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(): void {
    const plugins = Array.from(this.plugins.values());
    this.statusCallbacks.forEach(callback => {
      try {
        callback(plugins);
      } catch (error) {
        console.error('[PluginPanel] Error in status callback:', error);
      }
    });
  }
}

