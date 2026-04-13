import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import mdns from 'multicast-dns';
import { WebSocketServer } from 'ws';
import os from 'os';
import { Repo } from '@automerge/automerge-repo';
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket';

// --- 1. THE LOCK BREAKER ---
const isPrimary = app.requestSingleInstanceLock();

if (!isPrimary) {
  const uniqueId = Math.random().toString(36).substring(7);
  const userDataPath = app.getPath('userData');
  app.setPath('userData', path.join(userDataPath, `peer-instance-${uniqueId}`));
  console.log(`\n⚠️ WARNING: Zombie detected! Using temporary blank database: peer-instance-${uniqueId}`);
} else {
  console.log(`\n✅ PRIMARY INSTANCE: Connected to saved local database!`);
}

// --- 2. P2P & DISCOVERY CONFIG ---
const mdnsInstance = mdns();
const PORT = 3030;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

const myIP = getLocalIP();

// --- 3. WINDOW MANAGEMENT ---
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
    }
  });

  // Load your Vite dev server (UI)
  win.loadURL('http://localhost:5173');

  // --- 4. CONDITIONAL P2P HUB (THE FIX) ---
  // Only the PRIMARY window is allowed to start the server!
  if (isPrimary) {
    const wss = new WebSocketServer({ port: PORT });
    console.log(`\n🚀 P2P Hub started on ws://127.0.0.1:${PORT}`);

    const relayRepo = new Repo({
      network: [new NodeWSServerAdapter(wss)],
      isServer: true,
      sharePolicy: async (peerId) => true,
    });

    // --- THE DEEP X-RAY & ACTIVE CACHE HACK ---
    relayRepo.networkSubsystem.on('peer', ({ peerId }) => {
      console.log(`\n[HUB] 🟢 Connected to peer: ${peerId}`);
    });

    relayRepo.networkSubsystem.on('peer-disconnected', ({ peerId }) => {
      console.log(`\n[HUB] 🔴 Disconnected from peer: ${peerId}`);
    });

    // INTERCEPTOR: Actively snatch requested documents into the Hub's memory
    relayRepo.networkSubsystem.on('message', (msg) => {
      if (msg.documentId && msg.type !== 'error') {
        console.log(`[HUB] 📡 Packet intercepted for doc: ${msg.documentId} (Type: ${msg.type})`);
        
        // Force the Hub to actively download and hold the document in memory
        relayRepo.find(msg.documentId); 
      }
    });

    // --- 5. MDNS ANNOUNCEMENT (Primary Only) ---
    const announce = () => {
      mdnsInstance.respond({
        answers: [{
          name: 'trellis-sync.local',
          type: 'SRV',
          data: { port: PORT, target: myIP }
        }]
      });
      mdnsInstance.query({
        questions: [{ name: 'trellis-sync.local', type: 'SRV' }]
      });
    };

    const announcementInterval = setInterval(announce, 5000);
    announce(); 

    mdnsInstance.on('response', (response) => {
      response.answers.forEach(answer => {
        if (answer.name === 'trellis-sync.local' && answer.data.target !== myIP) {
          const peerUrl = `ws://${answer.data.target}:${answer.data.port}`;
          console.log(`✨ Found peer via mDNS: ${peerUrl}`);
          win.webContents.send('peer-discovered', peerUrl);
        }
      });
    });

    win.on('closed', () => {
      clearInterval(announcementInterval);
      wss.close();
    });
  } else {
    // This is Window B! It doesn't start a server.
    console.log(`\n👋 Secondary instance started. Acting as pure client.`);
  }
}

// --- 6. APP LIFECYCLE ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // NUCLEAR QUIT: Destroy the process immediately when the window closes
  console.log("🛑 Window closed. Terminating process forcefully.");
  app.quit();
  process.exit(0); 
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});