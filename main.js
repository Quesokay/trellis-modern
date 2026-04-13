import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import mdns from 'multicast-dns';
import { WebSocketServer } from 'ws';
import os from 'os';
import { fileURLToPath } from 'url'; // Required for ESM __dirname
import { Repo } from '@automerge/automerge-repo';
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket';

// --- ESM __dirname SHIM ---
// This makes __dirname work in "type": "module" projects
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      nodeIntegration: true, // Keep as per your current setup
      contextIsolation: false, // Keep as per your current setup
      preload: path.join(__dirname, isDev ? 'src/preload.js' : 'dist-electron/preload.js')
    }
  });

  // --- THE STANDALONE FIX ---
  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In the executable, load the physical file from 'dist/'
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // --- 4. CONDITIONAL P2P HUB ---
  if (isPrimary) {
    const wss = new WebSocketServer({ port: PORT });
    console.log(`\n🚀 P2P Hub started on ws://127.0.0.1:${PORT}`);

    const relayRepo = new Repo({
      network: [new NodeWSServerAdapter(wss)],
      isServer: true,
      sharePolicy: async (peerId) => true,
    });

    relayRepo.networkSubsystem.on('peer', ({ peerId }) => {
      console.log(`\n[HUB] 🟢 Connected to peer: ${peerId}`);
    });

    relayRepo.networkSubsystem.on('message', (msg) => {
      if (msg.documentId && msg.type !== 'error') {
        console.log(`[HUB] 📡 Packet intercepted for doc: ${msg.documentId}`);
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
    console.log(`\n👋 Secondary instance started. Acting as pure client.`);
  }
}

// --- 6. APP LIFECYCLE ---
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  console.log("🛑 Window closed. Terminating process forcefully.");
  app.quit();
  process.exit(0); 
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});