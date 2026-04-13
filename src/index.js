import { app, BrowserWindow } from 'electron';
import path from 'path';
import mdns from 'multicast-dns';
import { WebSocketServer } from 'ws';
import os from 'os';
import { fileURLToPath } from 'url';
import { Repo } from '@automerge/automerge-repo';
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// --- 1. SINGLE INSTANCE LOCK ---
const isPrimary = app.requestSingleInstanceLock();
if (!isPrimary) {
  app.quit(); //
}

// --- 2. P2P HUB LOGIC (Preserved from your main.js) ---
const mdnsInstance = mdns();
const PORT = 3030;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // FIX: In production, preload is in the SAME folder as this file (dist-electron)
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: true,
      contextIsolation: false, 
    }
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // FIX: We are in dist-electron/, so go UP one level then into dist/
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (isPrimary) {
    const wss = new WebSocketServer({ port: PORT });
    const relayRepo = new Repo({
      network: [new NodeWSServerAdapter(wss)],
      isServer: true,
      sharePolicy: async () => true,
    });

    // mDNS Discovery logic...
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