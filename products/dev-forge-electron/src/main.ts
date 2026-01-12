/**
 * Dev Forge Electron - Main Process
 * 
 * Entry point for the Electron application.
 * Handles window creation, app lifecycle, and system integration.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// IPC handlers for file system
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf-8');
    return data;
  } catch (error: any) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath: string, data: string) => {
  try {
    await fs.promises.writeFile(filePath, data, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(entry => entry.name);
  } catch (error: any) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
});

// IPC handlers for configuration
const configPath = path.join(app.getPath('userData'), 'dev-forge', 'config', 'config.json');
let configCache: Record<string, any> = {};

async function loadConfig(): Promise<void> {
  try {
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, 'utf-8');
      configCache = JSON.parse(data);
    }
  } catch (error) {
    console.error('[Main] Failed to load config:', error);
  }
}

async function saveConfig(): Promise<void> {
  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(configPath, JSON.stringify(configCache, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Main] Failed to save config:', error);
  }
}

ipcMain.handle('config:get', async (_: any, key: string) => {
  await loadConfig();
  return configCache[key];
});

ipcMain.handle('config:set', async (_: any, key: string, value: any) => {
  await loadConfig();
  configCache[key] = value;
  await saveConfig();
});

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Dev Forge',
    // icon: path.join(__dirname, '../assets/icon.png'), // Will create later
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    backgroundColor: '#050505', // Xibalba Framework dark background
    show: false // Don't show until ready
  });

  // Load the application
  const htmlPath = path.join(__dirname, '../index.html');
  if (fs.existsSync(htmlPath)) {
    mainWindow.loadFile(htmlPath);
  } else {
    // Fallback: Create basic HTML
    mainWindow.loadURL('data:text/html;charset=utf-8,<html><body style="background:#050505;color:#fff;padding:20px;font-family:Inter,sans-serif"><h1>Dev Forge</h1><p>Loading...</p></body></html>');
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // Focus on window
    if (mainWindow) {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Initialize application
 */
function initializeApp(): void {
  // Create application data directory
  const appDataPath = path.join(app.getPath('userData'), 'dev-forge');
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }

  // Create plugins directory
  const pluginsPath = path.join(appDataPath, 'plugins');
  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath, { recursive: true });
  }

  // Create config directory
  const configPath = path.join(appDataPath, 'config');
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true });
  }
}

/**
 * App event handlers
 */

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  initializeApp();
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPath', (_: any, pathName: string) => {
  return app.getPath(pathName as any);
});

ipcMain.handle('app:getUserData', () => {
  return app.getPath('userData');
});

// Security: Prevent new window creation
app.on('web-contents-created', (_: any, contents: any) => {
  contents.on('new-window', (event: any, navigationUrl: string) => {
    event.preventDefault();
    // Open in external browser instead
    require('electron').shell.openExternal(navigationUrl);
  });
});

