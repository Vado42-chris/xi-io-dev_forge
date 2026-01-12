/**
 * Monaco Editor Setup
 * 
 * Initializes and configures Monaco Editor for Dev Forge.
 */

// Monaco Editor will be loaded dynamically
// Using any for now until we set up proper module loading
declare const monaco: any;

/**
 * Initialize Monaco Editor
 * Note: Monaco will be loaded via CDN or bundled
 */
export async function initializeMonacoEditor(containerId: string): Promise<any> {
  // Load Monaco Editor dynamically
  if (typeof (window as any).monaco === 'undefined') {
    // Monaco not loaded yet - will load via script tag in HTML
    await new Promise(resolve => {
      const checkMonaco = setInterval(() => {
        if (typeof (window as any).monaco !== 'undefined') {
          clearInterval(checkMonaco);
          resolve(undefined);
        }
      }, 100);
    });
  }

  const monaco = (window as any).monaco;
  // Configure Monaco environment
  (window as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      if (label === 'json') {
        return './node_modules/monaco-editor/esm/vs/language/json/json.worker.js';
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return './node_modules/monaco-editor/esm/vs/language/css/css.worker.js';
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return './node_modules/monaco-editor/esm/vs/language/html/html.worker.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return './node_modules/monaco-editor/esm/vs/language/typescript/ts.worker.js';
      }
      return './node_modules/monaco-editor/esm/vs/editor/editor.worker.js';
    }
  };

  // Get container element
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element not found: ${containerId}`);
  }

  // Create editor with Xibalba Framework theme
  const editor = monaco.editor.create(container, {
    value: '// Dev Forge Editor\n// Welcome to Dev Forge\n\nfunction example() {\n  // Your code here\n}',
    language: 'typescript',
    theme: 'xibalba-dark', // Custom theme
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace", // font-tech
    lineNumbers: 'on',
    minimap: {
      enabled: true
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    // Xibalba Framework: Pattern #209 - Large, readable
    // Pattern #210 - Minimal borders
    // Pattern #156 - Universal access
  });

  // Define Xibalba Framework dark theme
  monaco.editor.defineTheme('xibalba-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#050505', // Xibalba Framework dark background
      'editor.foreground': '#FFFFFF',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264F78',
      'editor.lineHighlightBackground': '#2A2D2E',
      'editorCursor.foreground': '#AEAFAD',
      'editorWhitespace.foreground': '#3B3A32',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.selectionHighlightBackground': '#ADD6FF26',
    }
  });

  // Set theme
  monaco.editor.setTheme('xibalba-dark');

  return editor;
}

/**
 * Get editor instance
 */
let editorInstance: any = null;

export function getEditor(): any {
  return editorInstance;
}

export function setEditor(editor: any): void {
  editorInstance = editor;
}

