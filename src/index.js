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

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (isPrimary) {
    const wss = new WebSocketServer({ port: PORT });
    
    // 🚨 LOAD AUTOMERGE DYNAMICALLY HERE 🚨
    const { Repo } = await importDynamic('@automerge/automerge-repo');
    const { NodeWSServerAdapter } = await importDynamic('@automerge/automerge-repo-network-websocket');

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
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); process.exit(0); });