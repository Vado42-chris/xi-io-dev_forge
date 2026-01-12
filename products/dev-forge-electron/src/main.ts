/**
 * Dev Forge Electron - Main Process
 * 
 * Entry point for the Electron application.
 * Handles window creation, app lifecycle, and system integration.
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

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
    icon: path.join(__dirname, '../assets/icon.png'), // Will create later
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
  if (process.env.NODE_ENV === 'development') {
    // Development: Load from dev server or local HTML
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
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

ipcMain.handle('app:getPath', (_, pathName: string) => {
  return app.getPath(pathName as any);
});

ipcMain.handle('app:getUserData', () => {
  return app.getPath('userData');
});

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    // Open in external browser instead
    require('electron').shell.openExternal(navigationUrl);
  });
});

