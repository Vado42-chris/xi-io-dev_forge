/**
 * Type definitions for Dev Forge Electron
 */

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
    monaco: any;
  }
}

export {};

