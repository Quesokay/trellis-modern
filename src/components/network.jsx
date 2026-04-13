import React, { useEffect, useState } from 'react';
import { useRepo } from '@automerge/automerge-repo-react-hooks';
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

export default function Network() {
  const repo = useRepo();
  const [peers, setPeers] = useState([]);
  const [introducerUrl, setIntroducerUrl] = useState('localhost:5001');
  const [isBonjourActive, setIsBonjourActive] = useState(true);

  useEffect(() => {
    if (!repo || !repo.networkSubsystem) return;

    const updatePeers = () => {
      // Get detailed peer info if available
      setPeers(Array.from(repo.networkSubsystem.peers || []));
    };

    repo.networkSubsystem.on('peer', updatePeers);
    repo.networkSubsystem.on('peer-disconnected', updatePeers);
    updatePeers();

    return () => {
      repo.networkSubsystem.off('peer', updatePeers);
      repo.networkSubsystem.off('peer-disconnected', updatePeers);
    };
  }, [repo]);

  const handleManualConnect = () => {
    console.log("🔵 1. Button clicked! Raw input:", introducerUrl);
    if (!introducerUrl) {
      console.log("🔴 Cancelled: Input was empty.");
      return;
    }

    const url = introducerUrl.startsWith('ws') ? introducerUrl : `ws://${introducerUrl}`;
    console.log("🔵 2. Formatted URL:", url);

    try {
      if (!repo || !repo.networkSubsystem) {
        console.error("🔴 CRITICAL: Repo or NetworkSubsystem is undefined!");
        return;
      }
      
      console.log("🔵 3. Repo found. Adding adapter...");
      const adapter = new BrowserWebSocketClientAdapter(url);
      repo.networkSubsystem.addNetworkAdapter(adapter);
      
      console.log("🟢 4. Adapter added successfully!");
      alert(`Connecting to Introducer: ${url}`);
      
    } catch (err) {
      console.error("🔴 CRASH during manual connect:", err);
    }
  };

  return (
    <div className="Network-Panel" style={{ padding: '10px', fontSize: '13px', color: '#333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           Network 🌐
        </h3>
        {/* Global Toggle Mockup */}
        <div className="toggle-switch active"></div>
      </div>

      {/* 1. Introducer Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div className="status-dot online"></div>
        <span style={{ width: '80px', fontWeight: '500' }}>Introducer</span>
        <input 
          value={introducerUrl}
          onChange={(e) => setIntroducerUrl(e.target.value)}
          style={{ flex: 1, padding: '2px 5px', border: '1px solid #ccc', borderRadius: '2px' }} 
        />
        <button 
          onClick={handleManualConnect}
          style={{ padding: '2px 8px', cursor: 'pointer', background: '#fff', border: '1px solid #ccc', borderRadius: '3px' }}
        >
          Connect
        </button>
      </div>

      {/* 2. Bonjour Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className={`status-dot ${isBonjourActive ? 'online' : 'offline'}`}></div>
        <span style={{ width: '80px', fontWeight: '500' }}>Bonjour</span>
        <span style={{ flex: 1, color: '#666' }}>Trellis-Node-01</span>
        <input 
          type="checkbox" 
          checked={isBonjourActive} 
          onChange={(e) => setIsBonjourActive(e.target.checked)} 
        />
      </div>

      {/* 3. Peer List Headers */}
      <div style={{ display: 'flex', color: '#999', fontSize: '11px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
        <span style={{ flex: 2 }}>Peer</span>
        <span style={{ flex: 1 }}>ID</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Sent</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Recv</span>
      </div>

      {/* 4. Active Peers */}
      <div className="PeerList">
        {peers.length === 0 ? (
          <div style={{ padding: '10px 0', color: '#ccc', fontStyle: 'italic' }}>No peers found...</div>
        ) : (
          peers.map(peerId => (
            <div key={peerId} style={{ display: 'flex', alignItems: 'center', padding: '5px 0', fontSize: '12px' }}>
              <div className="status-dot online" style={{ marginRight: '10px' }}></div>
              <span style={{ flex: 2, fontWeight: '500' }}>Node-{peerId.substring(0, 4)}</span>
              <span style={{ flex: 1, color: '#666' }}>{peerId.substring(0, 4)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>--</span>
              <span style={{ flex: 1, textAlign: 'right' }}>--</span>
            </div>
          ))
        )}
      </div>

      <style>{`
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.online { background: #7ed321; box-shadow: 0 0 4px #7ed321; }
        .status-dot.offline { background: #bbb; }
        .Network-Panel input:focus { outline: none; border-color: #3F88C5; }
      `}</style>
    </div>
  );
}