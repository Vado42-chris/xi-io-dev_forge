/**
 * Persona Panel Component
 * 
 * UI component for managing AI personas.
 */

import { PersonaSystem, Persona, PersonaConfig } from '../systems/persona-system';
import { modelManager } from '../model-manager';

export class PersonaPanel {
  private container: HTMLElement;
  private personaSystem: PersonaSystem;
  private unsubscribe: (() => void) | null = null;

  constructor(containerId: string, personaSystem: PersonaSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.personaSystem = personaSystem;
  }

  /**
   * Render the persona panel
   */
  render(): void {
    this.container.innerHTML = `
      <div class="persona-panel">
        <div class="persona-panel-header">
          <h3>PERSONAS</h3>
          <button id="create-persona" class="icon-button" title="Create Persona">➕</button>
        </div>
        <div class="persona-panel-content">
          <div id="personas-list" class="personas-list">
            <!-- Personas will be rendered here -->
          </div>
        </div>
        <div class="persona-panel-footer">
          <button id="manage-personas" class="btn-secondary btn-small">Manage</button>
        </div>
      </div>
    `;

    // Set up event listeners
    this.setupEventListeners();

    // Subscribe to status changes
    this.unsubscribe = this.personaSystem.onStatusChange((personas) => {
      this.renderPersonas(personas);
    });

    // Initial render
    this.renderPersonas(this.personaSystem.getAllPersonas());
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Create persona button
    const createBtn = this.container.querySelector('#create-persona');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.showCreatePersonaDialog();
      });
    }

    // Manage personas button
    const manageBtn = this.container.querySelector('#manage-personas');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        this.showManageDialog();
      });
    }
  }

  /**
   * Render personas list
   */
  private renderPersonas(personas: Persona[]): void {
    const listContainer = this.container.querySelector('#personas-list');
    if (!listContainer) return;

    if (personas.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">No personas configured</div>';
      return;
    }

    listContainer.innerHTML = personas.map(persona => this.renderPersonaCard(persona)).join('');
    
    // Set up persona card event listeners
    personas.forEach(persona => {
      const card = this.container.querySelector(`[data-persona-id="${persona.id}"]`);
      if (card) {
        // Enable/disable toggle
        const enableToggle = card.querySelector('.persona-enable-toggle');
        if (enableToggle) {
          enableToggle.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.personaSystem.updatePersona(persona.id, { enabled: target.checked });
          });
        }

        // Activate button
        const activateBtn = card.querySelector('.persona-activate');
        if (activateBtn) {
          activateBtn.addEventListener('click', () => {
            this.showActivateDialog(persona.id);
          });
        }
      }
    });
  }

  /**
   * Render persona card
   */
  private renderPersonaCard(persona: Persona): string {
    const statusClass = persona.enabled ? 'enabled' : 'disabled';
    const statusIcon = persona.enabled ? '🟢' : '⚪';

    return `
      <div class="persona-card ${statusClass}" data-persona-id="${persona.id}">
        <div class="persona-card-header">
          <div class="persona-info">
            <span class="persona-name">${persona.name}</span>
            <span class="persona-status ${statusClass}">${statusIcon}</span>
          </div>
        </div>
        <div class="persona-card-body">
          <p class="persona-description">${persona.description}</p>
          <div class="persona-schema-info">
            <span>Mode: ${persona.schema.filterMode}</span>
            <span>Context: ${persona.schema.contextWindow} chars</span>
          </div>
        </div>
        <div class="persona-card-footer">
          <label class="persona-enable-label">
            <input type="checkbox" class="persona-enable-toggle" ${persona.enabled ? 'checked' : ''}>
            <span>Enabled</span>
          </label>
          <button class="persona-activate btn-secondary btn-small">Activate</button>
        </div>
      </div>
    `;
  }

  /**
   * Show create persona dialog
   */
  private showCreatePersonaDialog(): void {
    // TODO: Implement create persona dialog
    alert('Create persona dialog - coming soon');
  }

  /**
   * Show manage personas dialog
   */
  private showManageDialog(): void {
    // TODO: Implement manage dialog
    alert('Manage personas dialog - coming soon');
  }

  /**
   * Show activate persona dialog
   */
  private showActivateDialog(personaId: string): void {
    const models = modelManager.getEnabledModels();
    if (models.length === 0) {
      alert('No models available');
      return;
    }

    // Simple activation - use first available model
    const firstModel = models[0];
    const config: PersonaConfig = {
      personaId,
      modelId: firstModel.id,
    };

    this.personaSystem.activatePersona(config);
    alert(`Persona activated for ${firstModel.name}`);
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

