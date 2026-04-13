import { app, BrowserWindow, ipcMain, Menu, clipboard } from 'electron';
import path from 'path';
import mdns from 'multicast-dns';
import { WebSocketServer } from 'ws';
import fs from 'fs';

console.log("🟢 1. ELECTRON IS AWAKE!");

const importDynamic = new Function('modulePath', 'return import(modulePath)');
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// --- 1. SINGLE INSTANCE LOCK ---
// const isPrimary = app.requestSingleInstanceLock();
// if (!isPrimary) {
//   console.log("🔴 2. APP LOCK IS TAKEN BY A GHOST PROCESS! QUITTING...");
//   app.quit();
//   process.exit(0); // Force kill
// }
const isPrimary = true; // TEMPORARILY DISABLING SINGLE INSTANCE LOCK FOR TESTING
console.log("🟢 2. GOT INSTANCE LOCK.");

const mdnsInstance = mdns();
const PORT = 3030;
const SAVE_DIRECTORY = app.getPath('userData');

let mainWindow;

async function createWindow() {
  console.log("🟢 3. CREATING WINDOW...");
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'), 
        nodeIntegration: true,
        contextIsolation: false, 
      }
    });

    const template = [
      {
        label: 'Document',
        submenu: [
          { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { if (mainWindow) mainWindow.webContents.send("new") } },
          { label: 'Open from Clipboard', accelerator: 'CmdOrCtrl+O', click: () => { if (mainWindow) mainWindow.webContents.send("openFromClipboard", clipboard.readText()) } },
          { label: 'Share to Clipboard', accelerator: 'CmdOrCtrl+H', click: () => { if (mainWindow) mainWindow.webContents.send("shareToClipboard") } },
          { label: 'Fork', accelerator: 'CmdOrCtrl+Y', click: () => { if (mainWindow) mainWindow.webContents.send("forkDocument") } },
          { type: "separator" }
        ]
      }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    if (isDev) {
      console.log("🟢 4. LOADING VITE URL...");
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      console.log("🟢 4. LOADING LOCAL FILE...");
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    if (isPrimary) {
      console.log("🟢 5. STARTING WEBSOCKET SERVER...");
      const wss = new WebSocketServer({ port: PORT });
      
      wss.on('error', (err) => {
        console.error("🔴 WEBSOCKET ERROR (PORT PROBABLY IN USE):", err);
      });

      console.log("🟢 6. IMPORTING AUTOMERGE...");
      const { Repo } = await importDynamic('@automerge/automerge-repo');
      const { NodeWSServerAdapter } = await importDynamic('@automerge/automerge-repo-network-websocket');

      console.log("🟢 7. INITIALIZING REPO...");
      const relayRepo = new Repo({
        network: [new NodeWSServerAdapter(wss)],
        isServer: true,
        sharePolicy: async () => true,
      });

      const announce = () => {
        mdnsInstance.respond({
          answers: [{ name: 'trellis-sync.local', type: 'SRV', data: { port: PORT, target: '127.0.0.1' } }]
        });
      };
      setInterval(announce, 5000);
      announce();
      console.log("🟢 8. APP FULLY LOADED AND READY!");
    }
  } catch (err) {
    console.error("🔴 CATASTROPHIC ERROR IN CREATEWINDOW:", err);
  }
}

// IPC Handlers
ipcMain.on('shareToClipboardResult', (e, docId) => clipboard.writeText(docId));
ipcMain.handle('save-file', async (e, name, data) => { await fs.promises.writeFile(path.join(SAVE_DIRECTORY, name), data); return true; });
ipcMain.handle('read-file', async (e, name) => { const p = path.join(SAVE_DIRECTORY, name); if (fs.existsSync(p)) return await fs.promises.readFile(p, 'utf-8'); });

app.whenReady().then(createWindow).catch(err => console.error("🔴 WHENREADY ERROR:", err));
app.on('window-all-closed', () => { app.quit(); process.exit(0); });