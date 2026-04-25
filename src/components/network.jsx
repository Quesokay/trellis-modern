import React, { useEffect, useState } from 'react';
import { useRepo } from '@automerge/automerge-repo-react-hooks';
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

export default function Network() {
  const repo = useRepo();
  const [peers, setPeers] = useState([]);
  const [introducerUrl, setIntroducerUrl] = useState('localhost:3030'); 
  const [isBonjourActive, setIsBonjourActive] = useState(true);

  // 1. Maintain the list of active peers
  useEffect(() => {
    if (!repo || !repo.networkSubsystem) return;

    const updatePeers = () => {
      const peerIds = Array.from(repo.networkSubsystem.peers || []);
      const peersData = peerIds.map(peerId => {
        const meta = repo.peerMetadataByPeerId?.[peerId] || {};
        return {
          id: peerId,
          name: meta.name || `Node-${peerId.substring(7, 11)}`,
          color: meta.color || '#7ed321'
        };
      });
      setPeers(peersData);
    };

    repo.networkSubsystem.on('peer', updatePeers);
    repo.networkSubsystem.on('peer-disconnected', updatePeers);
    updatePeers();

    return () => {
      repo.networkSubsystem.off('peer', updatePeers);
      repo.networkSubsystem.off('peer-disconnected', updatePeers);
    };
  }, [repo]);

  // 🚨 2. THE "PUSH" LISTENER: Wait for incoming board invitations
  useEffect(() => {
    if (!repo) return;

    // We use a storage event as a bulletproof signaling layer for local tab-to-tab testing
    const handleStorageInvite = (e) => {
      if (e.key === 'trellis-invite' && e.newValue) {
        const invite = JSON.parse(e.newValue);
        
        // If the invite is meant for US, trigger the prompt
        if (invite.target === repo.peerId) {
          const accept = window.confirm(`📥 INCOMING BOARD!\n\n${invite.sender} has pushed a board to your screen.\n\nDo you want to open it now?`);
          if (accept) {
            window.location.hash = invite.docId;
            window.location.reload(); // Force reload to mount the new document
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageInvite);
    return () => window.removeEventListener('storage', handleStorageInvite);
  }, [repo]);

  // 🚨 3. THE "PUSH" ACTION: Send our current board to a peer
  const handlePushBoard = (peer) => {
    const currentDocId = window.location.hash.replace(/^#/, '');
    const myName = localStorage.getItem('peerName') || 'A coworker';

    if (!currentDocId) {
      alert("You need to be in a valid board to push it!");
      return;
    }

    // Dispatch the invite signal across the local network
    localStorage.setItem('trellis-invite', JSON.stringify({
      target: peer.id,
      docId: currentDocId,
      sender: myName,
      timestamp: Date.now() // Ensures the event fires even if pushing the same board twice
    }));

    // Optional UI feedback
    alert(`🚀 Board successfully pushed to ${peer.name}!`);
  };

  const handleManualConnect = () => {
    if (!introducerUrl) return;
    const url = introducerUrl.startsWith('ws') ? introducerUrl : `ws://${introducerUrl}`;
    try {
      const adapter = new BrowserWebSocketClientAdapter(url);
      repo.networkSubsystem.addNetworkAdapter(adapter);
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
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className={`status-dot ${isBonjourActive ? 'online' : 'offline'}`}></div>
        <span style={{ width: '80px', fontWeight: '500' }}>Bonjour</span>
        <span style={{ flex: 1, color: '#666' }}>Local Mesh</span>
        <input 
          type="checkbox" 
          checked={isBonjourActive} 
          onChange={(e) => setIsBonjourActive(e.target.checked)} 
        />
      </div>

      {/* RE-DESIGNED HEADERS: Swapped Sent/Recv for an Action Column */}
      <div style={{ display: 'flex', color: '#999', fontSize: '11px', borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '5px' }}>
        <span style={{ flex: 2 }}>Available Peers</span>
        <span style={{ flex: 1 }}>ID</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Action</span>
      </div>

      {/* ACTIVE PEERS LIST */}
      <div className="PeerList">
        {peers.length === 0 ? (
          <div style={{ padding: '10px 0', color: '#ccc', fontStyle: 'italic' }}>No peers found...</div>
        ) : (
          peers.map(peer => (
            <div key={peer.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0', fontSize: '12px' }}>
              
              <div className="status-dot" style={{ marginRight: '10px', background: peer.color, boxShadow: `0 0 4px ${peer.color}` }}></div>
              <span style={{ flex: 2, fontWeight: '500' }}>{peer.name}</span>
              <span style={{ flex: 1, color: '#666' }} title={peer.id}>{peer.id.substring(7, 11)}</span>
              
              {/* 🚨 THE NEW PUSH BUTTON */}
              <div style={{ flex: 1, textAlign: 'right' }}>
                <button 
                  onClick={() => handlePushBoard(peer)}
                  style={{ 
                    fontSize: '10px', 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    border: '1px solid #3F88C5', 
                    background: '#eef6fc', 
                    color: '#3F88C5', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  title="Push your current board directly to this user's screen"
                >
                  Push
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      <style>{`
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-dot.online { background: #7ed321; box-shadow: 0 0 4px #7ed321; }
        .status-dot.offline { background: #bbb; }
        .Network-Panel input:focus { outline: none; border-color: #3F88C5; }
        button:hover { filter: brightness(0.95); }
      `}</style>
    </div>
  );
}