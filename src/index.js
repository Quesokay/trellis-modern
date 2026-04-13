/* eslint-env node */
import { app, BrowserWindow, Menu, ipcMain, clipboard } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

let mainWindow;

// Determine the save directory (matching the original app's logic)
const SAVE_DIRECTORY = process.env.SAVE_DIR || path.join(app.getPath('documents'), "Trellis");
if (!fs.existsSync(SAVE_DIRECTORY)) {
  fs.mkdirSync(SAVE_DIRECTORY, { recursive: true });
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    title: "-",
    webPreferences: {
      // Modern security constraints
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // THE FIX: Check if we are in development or production
  if (process.env.VITE_DEV_SERVER_URL) {
    // If dev server is running, load from localhost
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    // In production (the executable), load the bundled HTML file
    // Note: Use path.join to point to the 'dist/index.html' relative to this file
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Recreate the original Menubar template
  const template = [
    {
      label: 'Document',
      submenu: [
        {
          label: 'New', accelerator: 'CmdOrCtrl+N', click: () => {
            mainWindow.webContents.send("new")
          }
        },
        {
          label: 'Open from Clipboard', accelerator: 'CmdOrCtrl+O', click: () => {
            mainWindow.webContents.send("openFromClipboard", clipboard.readText())
          }
        },
        {
          label: 'Share to Clipboard', accelerator: 'CmdOrCtrl+H', click: () => {
            mainWindow.webContents.send("shareToClipboard")
          }
        },
        {
          label: 'Fork', accelerator: 'CmdOrCtrl+Y', click: () => {
            mainWindow.webContents.send("forkDocument")
          }
        },
        { type: "separator" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
      ]
    },
    {
      label: "Dev",
      submenu: [
        {
          label: "Refresh", accelerator: 'CmdOrCtrl+R', click: (item, focusedWindow) => {
            focusedWindow?.webContents.reload()
          }
        },
        {
          label: "Open Inspector", accelerator: 'CmdOrCtrl+Option+I', click: (item, focusedWindow) => {
            focusedWindow?.webContents.toggleDevTools()
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [{ role: 'about' }, { role: 'quit' }]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the app via Vite in dev, or local index.html in production
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// --- IPC HANDLERS FOR FILE SYSTEM AND CLIPBOARD ---

ipcMain.on('shareToClipboardResult', (event, docId) => {
  clipboard.writeText(docId);
});

ipcMain.handle('save-file', async (event, fileName, data) => {
  const savePath = path.join(SAVE_DIRECTORY, fileName);
  await fs.promises.writeFile(savePath, data);
  return true;
});

ipcMain.handle('read-file', async (event, fileName) => {
  const savePath = path.join(SAVE_DIRECTORY, fileName);
  if (fs.existsSync(savePath)) {
    return await fs.promises.readFile(savePath, 'utf-8');
  }
  return null;
});

ipcMain.handle('file-exists', (event, fileName) => {
  const savePath = path.join(SAVE_DIRECTORY, fileName);
  return fs.existsSync(savePath);
});

// App Lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});