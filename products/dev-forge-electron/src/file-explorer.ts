/**
 * File Explorer Component
 * 
 * File tree component for Dev Forge editor.
 * Uses Xibalba Framework styling.
 */

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  expanded?: boolean;
}

export class FileExplorer {
  private container: HTMLElement;
  private rootPath: string;
  private nodes: Map<string, FileNode> = new Map();

  constructor(containerId: string, rootPath: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = container;
    this.rootPath = rootPath;
    this.render();
  }

  /**
   * Render file explorer
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="file-explorer">
        <div class="file-explorer-header">
          <span class="file-explorer-title">EXPLORER</span>
        </div>
        <div class="file-explorer-content">
          <div class="file-tree">
            <div class="file-tree-loading">Loading...</div>
          </div>
        </div>
      </div>
    `;

    // Load root directory
    this.loadDirectory(this.rootPath);
  }

  /**
   * Load directory
   */
  private async loadDirectory(path: string): Promise<void> {
    try {
      const entries = await window.electronAPI.readDir(path);
      const treeContainer = this.container.querySelector('.file-tree');
      
      if (!treeContainer) return;

      treeContainer.innerHTML = '';

      for (const entry of entries) {
        const entryPath = `${path}/${entry}`;
        const node: FileNode = {
          name: entry,
          path: entryPath,
          type: 'file', // Will determine from file system
          expanded: false
        };

        this.nodes.set(entryPath, node);
        this.renderNode(node, treeContainer as HTMLElement);
      }
    } catch (error) {
      console.error('[FileExplorer] Error loading directory:', error);
      const treeContainer = this.container.querySelector('.file-tree');
      if (treeContainer) {
        treeContainer.innerHTML = '<div class="file-tree-error">Error loading directory</div>';
      }
    }
  }

  /**
   * Render file node
   */
  private renderNode(node: FileNode, container: HTMLElement): void {
    const nodeElement = document.createElement('div');
    nodeElement.className = `file-tree-node file-tree-${node.type}`;
    nodeElement.innerHTML = `
      <span class="file-tree-icon">${node.type === 'directory' ? '📁' : '📄'}</span>
      <span class="file-tree-name">${node.name}</span>
    `;

    // Add click handler
    nodeElement.addEventListener('click', () => {
      if (node.type === 'directory') {
        node.expanded = !node.expanded;
        this.toggleNode(node, nodeElement);
      } else {
        this.openFile(node.path);
      }
    });

    container.appendChild(nodeElement);
  }

  /**
   * Toggle directory node
   */
  private async toggleNode(node: FileNode, element: HTMLElement): Promise<void> {
    if (node.type !== 'directory') return;

    node.expanded = !node.expanded;
    
    // Update icon
    const icon = element.querySelector('.file-tree-icon');
    if (icon) {
      icon.textContent = node.expanded ? '📂' : '📁';
    }

    if (node.expanded) {
      // Load children if not already loaded
      if (!node.children || node.children.length === 0) {
        try {
          const entries = await window.electronAPI.readDir(node.path);
          node.children = entries.map(entry => {
            const entryPath = `${node.path}/${entry}`;
            const isDirectory = !entry.includes('.') || entry.endsWith('/');
            return {
              name: entry,
              path: entryPath,
              type: isDirectory ? 'directory' : 'file' as 'file' | 'directory',
              expanded: false
            };
          });

          // Render children
          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'file-tree-children';
          childrenContainer.style.marginLeft = '16px';
          
          for (const child of node.children) {
            this.renderNode(child, childrenContainer);
            this.nodes.set(child.path, child);
          }

          element.appendChild(childrenContainer);
        } catch (error) {
          console.error('[FileExplorer] Error loading directory:', error);
        }
      } else {
        // Show existing children
        const childrenContainer = element.querySelector('.file-tree-children') as HTMLElement;
        if (childrenContainer) {
          childrenContainer.style.display = 'block';
        }
      }
    } else {
      // Hide children
      const childrenContainer = element.querySelector('.file-tree-children') as HTMLElement;
      if (childrenContainer) {
        childrenContainer.style.display = 'none';
      }
    }
  }

  /**
   * Open file
   */
  private async openFile(path: string): Promise<void> {
    try {
      console.log('[FileExplorer] Opening file:', path);
      
      // Read file content
      const content = await window.electronAPI.readFile(path);
      
      // Emit custom event for editor to handle
      const event = new CustomEvent('file:open', {
        detail: { path, content }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('[FileExplorer] Error opening file:', error);
    }
  }
}

