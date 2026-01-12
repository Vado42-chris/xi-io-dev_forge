/**
 * Search Panel Component
 * 
 * UI component for file and content search within Dev Forge.
 * Provides search functionality with filtering and result navigation.
 */

import { SearchService, SearchResult } from '../services/search-service';
import { StatusManager } from '../status-manager';

export class SearchPanel {
  private container: HTMLElement;
  private searchService: SearchService;
  private statusManager: StatusManager;
  private isVisible: boolean = false;
  private currentQuery: string = '';
  private currentResults: SearchResult[] = [];
  private selectedIndex: number = 0;

  constructor(containerId: string, searchService: SearchService, statusManager: StatusManager) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`SearchPanel container not found: ${containerId}`);
    }
    this.container = container;
    this.searchService = searchService;
    this.statusManager = statusManager;

    this.render();
    this.setupEventListeners();
  }

  /**
   * Initial render of the panel structure.
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="search-panel">
        <div class="search-panel-header">
          <span class="search-panel-title">SEARCH</span>
          <button id="search-close" class="icon-button" title="Close">✕</button>
        </div>
        <div class="search-panel-body">
          <div class="search-input-container">
            <input 
              type="text" 
              id="search-input" 
              class="search-input" 
              placeholder="Search files and content..."
              autocomplete="off"
            />
            <button id="search-button" class="xibalba-button primary" title="Search">🔍</button>
          </div>
          <div class="search-filters">
            <label class="search-filter-label">
              <input type="checkbox" id="search-files" checked> Files
            </label>
            <label class="search-filter-label">
              <input type="checkbox" id="search-content" checked> Content
            </label>
            <label class="search-filter-label">
              <input type="checkbox" id="search-tags"> Tags
            </label>
          </div>
          <div id="search-results" class="search-results">
            <div class="search-empty">Enter a search query to begin.</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Set up event listeners.
   */
  private setupEventListeners(): void {
    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    const searchButton = this.container.querySelector('#search-button');
    const closeButton = this.container.querySelector('#search-close');

    if (!searchInput || !searchButton || !closeButton) return;

    // Search on button click
    searchButton.addEventListener('click', () => this.performSearch());

    // Search on Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.currentResults.length - 1);
        this.renderResults();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.renderResults();
      }
    });

    // Search as you type (debounced)
    let searchTimeout: NodeJS.Timeout;
    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this.currentQuery = query;
      
      clearTimeout(searchTimeout);
      if (query.length >= 2) {
        searchTimeout = setTimeout(() => this.performSearch(), 500);
      } else {
        this.currentResults = [];
        this.renderResults();
      }
    });

    // Close button
    closeButton.addEventListener('click', () => this.hide());

    // Filter checkboxes
    this.container.querySelectorAll('.search-filter-label input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (this.currentQuery) {
          this.performSearch();
        }
      });
    });

    // Global shortcut (Ctrl+F)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f' && !e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
    });

    // Click on result
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const resultItem = target.closest('.search-result-item');
      if (resultItem) {
        const resultId = resultItem.getAttribute('data-result-id');
        if (resultId) {
          this.openResult(resultId);
        }
      }
    });
  }

  /**
   * Perform search.
   */
  private async performSearch(): Promise<void> {
    if (!this.currentQuery || this.currentQuery.length < 2) {
      this.currentResults = [];
      this.renderResults();
      return;
    }

    this.statusManager.update('Searching...', 'info');
    this.selectedIndex = 0;

    try {
      const filesChecked = (this.container.querySelector('#search-files') as HTMLInputElement)?.checked ?? true;
      const contentChecked = (this.container.querySelector('#search-content') as HTMLInputElement)?.checked ?? true;
      const tagsChecked = (this.container.querySelector('#search-tags') as HTMLInputElement)?.checked ?? false;

      const results = await this.searchService.search(this.currentQuery, {
        tags: tagsChecked ? [this.currentQuery] : undefined
      });

      // Filter results based on checkboxes
      this.currentResults = results.filter(result => {
        if (result.type === 'file' && !filesChecked) return false;
        if (result.type === 'content' && !contentChecked) return false;
        if (result.type === 'content' && result.tags && result.tags.length > 0 && !tagsChecked) return false;
        return true;
      });

      this.renderResults();
      this.statusManager.update(`Found ${this.currentResults.length} results`, 'success', 2000);
    } catch (error: any) {
      console.error('[SearchPanel] Error performing search:', error);
      this.statusManager.update(`Search error: ${error.message}`, 'error');
      this.currentResults = [];
      this.renderResults();
    }
  }

  /**
   * Render search results.
   */
  private renderResults(): void {
    const resultsContainer = this.container.querySelector('#search-results');
    if (!resultsContainer) return;

    if (this.currentResults.length === 0) {
      if (this.currentQuery) {
        resultsContainer.innerHTML = '<div class="search-empty">No results found.</div>';
      } else {
        resultsContainer.innerHTML = '<div class="search-empty">Enter a search query to begin.</div>';
      }
      return;
    }

    resultsContainer.innerHTML = this.currentResults.map((result, index) => {
      const isSelected = index === this.selectedIndex;
      return `
        <div 
          class="search-result-item ${isSelected ? 'selected' : ''}" 
          data-result-id="${result.id}"
        >
          <div class="search-result-header">
            <span class="search-result-icon">${this.getIconForType(result.type)}</span>
            <span class="search-result-name">${this.highlightMatch(result.name, this.currentQuery)}</span>
            <span class="search-result-type">${result.type}</span>
          </div>
          ${result.excerpt ? `
            <div class="search-result-excerpt">${this.highlightMatch(result.excerpt, this.currentQuery)}</div>
          ` : ''}
          <div class="search-result-path">${result.path}</div>
          ${result.tags && result.tags.length > 0 ? `
            <div class="search-result-tags">
              ${result.tags.map(tag => `<span class="search-result-tag">#${tag}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Scroll selected item into view
    const selectedItem = resultsContainer.querySelector('.search-result-item.selected');
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * Highlight matching text.
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Get icon for result type.
   */
  private getIconForType(type: SearchResult['type']): string {
    switch (type) {
      case 'file': return '📄';
      case 'directory': return '📁';
      case 'content': return '🔍';
      default: return '📄';
    }
  }

  /**
   * Open a search result.
   */
  private openResult(resultId: string): void {
    const result = this.currentResults.find(r => r.id === resultId);
    if (!result) return;

    // Dispatch event for other components to handle file opening
    document.dispatchEvent(new CustomEvent('devforge:open-file', {
      detail: { path: result.path, line: this.extractLineNumber(result.excerpt) }
    }));

    this.statusManager.update(`Opening ${result.name}...`, 'info', 2000);
  }

  /**
   * Extract line number from excerpt if available.
   */
  private extractLineNumber(excerpt?: string): number | undefined {
    // This would parse line numbers from excerpts if they're included
    // For now, return undefined
    return undefined;
  }

  /**
   * Show the search panel.
   */
  show(): void {
    this.isVisible = true;
    this.container.classList.remove('hidden');
    const searchInput = this.container.querySelector('#search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  /**
   * Hide the search panel.
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

