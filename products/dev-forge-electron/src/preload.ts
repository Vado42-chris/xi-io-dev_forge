/**
 * Dev Forge Electron - Preload Script
 * 
 * Bridge between main process and renderer process.
 * Exposes safe APIs to the renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose protected methods that allow the renderer process
 * to use the ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPath: (pathName: string) => ipcRenderer.invoke('app:getPath', pathName),
  getUserData: () => ipcRenderer.invoke('app:getUserData'),

  // File system (safe operations)
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('fs:writeFile', path, data),
  readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),

  // Configuration
  getConfig: (key: string) => ipcRenderer.invoke('config:get', key),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),

  // Events
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPath: (pathName: string) => Promise<string>;
      getUserData: () => Promise<string>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, data: string) => Promise<void>;
      readDir: (path: string) => Promise<string[]>;
      getConfig: (key: string) => Promise<any>;
      setConfig: (key: string, value: any) => Promise<void>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      off: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

