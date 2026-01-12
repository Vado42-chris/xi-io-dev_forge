/**
 * VS Code UI Adapter
 * 
 * Adapts VS Code UI components to core SDK UI interfaces.
 */

import * as vscode from 'vscode';
import { UIAdapter, WebviewConfig, TreeViewConfig, Webview, TreeView } from '@dev-forge/core';

export class VSCodeUIAdapter implements UIAdapter {
  private extensionUri: vscode.Uri;
  private webviews: Map<string, vscode.WebviewPanel> = new Map();
  private treeViews: Map<string, vscode.TreeView<any>> = new Map();

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  createWebview(config: WebviewConfig): Webview {
    const panel = vscode.window.createWebviewPanel(
      config.id,
      config.title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    if (config.html) {
      panel.webview.html = config.html;
    }

    if (config.onMessage) {
      panel.webview.onDidReceiveMessage(config.onMessage);
    }

    this.webviews.set(config.id, panel);

    return {
      id: config.id,
      postMessage: (message: any) => {
        panel.webview.postMessage(message);
      },
      onMessage: (callback: (message: any) => void) => {
        panel.webview.onDidReceiveMessage(callback);
      },
      dispose: () => {
        panel.dispose();
        this.webviews.delete(config.id);
      }
    };
  }

  createTreeView(config: TreeViewConfig): TreeView {
    const treeView = vscode.window.createTreeView(config.id, {
      treeDataProvider: config.dataProvider
    });

    this.treeViews.set(config.id, treeView);

    return {
      id: config.id,
      refresh: () => {
        // Tree view refresh is handled by data provider
        if (config.dataProvider && typeof (config.dataProvider as any).refresh === 'function') {
          (config.dataProvider as any).refresh();
        }
      },
      dispose: () => {
        treeView.dispose();
        this.treeViews.delete(config.id);
      }
    };
  }
}

