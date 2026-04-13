import { app, BrowserWindow } from 'electron';
import path from 'path';
import mdns from 'multicast-dns';
import { WebSocketServer } from 'ws';
import os from 'os';

// 🚨 THE ESM BYPASS 🚨
// This hides the dynamic import from Vite's bundler, forcing Node.js 
// to load the Automerge ESM packages natively at runtime.
const importDynamic = new Function('modulePath', 'return import(modulePath)');

const isDev = !!process.env.VITE_DEV_SERVER_URL;

// --- 1. SINGLE INSTANCE LOCK ---
const isPrimary = app.requestSingleInstanceLock();
if (!isPrimary) {
  app.quit();
}

// --- 2. P2P HUB LOGIC ---
const mdnsInstance = mdns();
const PORT = 3030;

// Note: Made this function async to support 'await'
async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: true,
      contextIsolation: false, 
    }
  });

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
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); process.exit(0); });