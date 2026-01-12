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
  private toggleNode(node: FileNode, element: HTMLElement): void {
    // Implementation for expanding/collapsing directories
    // Will be enhanced when we add directory detection
  }

  /**
   * Open file
   */
  private openFile(path: string): void {
    // Emit event or call callback to open file in editor
    console.log('[FileExplorer] Opening file:', path);
    // This will be connected to Monaco Editor
  }
}

