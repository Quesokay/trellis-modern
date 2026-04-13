import React, { useState, useEffect, useRef } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' 
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, handle, highlightOptions, onCardClick }) {
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  // --- MANUAL OFFLINE TOGGLE ---
  const [manualOffline, setManualOffline] = useState(false);

  // --- USER IDENTITY STATE ---
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // --- 1. ROCK-SOLID CUSTOM AWARENESS ENGINE ---
  const [localState, setLocalState] = useState({ 
    name: localStorage.getItem("peerName") || `User-${Math.floor(Math.random() * 1000)}`, 
    focusedCardId: null 
  });
  const [remoteStates, setRemoteStates] = useState({});

  // Engine Part A: Broadcasting & Listening (Now respects the toggle)
  useEffect(() => {
    if (!handle) return; 
    
    const handleMessage = (event) => {
      // Ignore incoming messages if we are pretending to be offline
      if (manualOffline) return; 
      
      setRemoteStates(prev => ({ 
        ...prev, 
        [event.senderId]: { ...event.message, _lastSeen: Date.now() } 
      }));
    };
    
    handle.on("ephemeral-message", handleMessage);
    
    // Only broadcast if we are "Online"
    if (!manualOffline) {
      handle.broadcast(localState);
    }
    
    const interval = setInterval(() => {
      if (!manualOffline) handle.broadcast(localState);
    }, 2500);

    return () => {
      handle.off("ephemeral-message", handleMessage);
      clearInterval(interval);
    };
  }, [handle, localState, manualOffline]); // Added manualOffline to dependencies

  // Engine Part B: The Sweeper
  useEffect(() => {
    // If manually offline, instantly wipe all remote peers from the screen
    if (manualOffline) {
      setRemoteStates({});
      return;
    }

    const sweeper = setInterval(() => {
      const now = Date.now();
      setRemoteStates(prev => {
        let newState = { ...prev };
        let hasChanges = false;
        
        for (let peerId in newState) {
          if (now - newState[peerId]._lastSeen > 8000) {
            delete newState[peerId];
            hasChanges = true;
          }
        }
        return hasChanges ? newState : prev;
      });
    }, 4000); 

    return () => clearInterval(sweeper);
  }, [manualOffline]); // Triggers instantly when toggle changes
  // ---------------------------------------------

  // --- USER IDENTITY HANDLERS ---
  const startEditingName = () => {
    setTempName(localState.name);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    const finalName = tempName.trim() || `User-${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("peerName", finalName);
    setLocalState(prev => ({ ...prev, name: finalName }));
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') handleNameSave();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  // --- PATH A: EXPORT / IMPORT DATA SOVEREIGNTY ---
  const handleExport = () => {
    const pureData = {
      boardTitle: doc.boardTitle,
      lists: doc.lists,
      cards: doc.cards,
      comments: doc.comments
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pureData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${doc.boardTitle || "Trellis-Board"}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!window.confirm("This will overwrite the current board. Are you sure?")) return;
        
        changeDoc(d => {
          d.boardTitle = importedData.boardTitle || "Imported Board";
          d.lists = importedData.lists || [];
          d.cards = importedData.cards || [];
          d.comments = importedData.comments || [];
        });
      } catch (err) {
        alert("Error: Invalid Trellis JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };
  // ---------------------------------------------

  if (!doc || !doc.lists) return null;

  const remotePeers = Object.values(remoteStates).filter(s => s && s.name);
  
  // Calculate display status based on our manual toggle and actual network
  const networkStatusText = manualOffline ? '🛑 Disconnected (Manual)' 
                          : (remotePeers.length > 0 ? '🟢 Online & Syncing' : '🟠 Working Locally (Auto)');
  const networkStatusColor = manualOffline ? '#ff5c5c' 
                           : (remotePeers.length > 0 ? '#36b37e' : '#ff991f');

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    changeDoc(d => mutators.moveCard(d, draggableId, destination.droppableId, destination.index));
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="Board">
        
        {/* INTERACTIVE PRESENCE & NETWORK STATUS BAR */}
        <div style={{ background: '#f0f2f5', padding: '5px 20px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', alignItems: 'center' }}>
          
          {/* Left Side: Users */}
          <div style={{ display: 'flex', gap: '15px' }}>
            {isEditingName ? (
              <input 
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={handleNameKeyDown}
                style={{ fontSize: '11px', padding: '2px 6px', border: '1px solid #4C9AFF', borderRadius: '3px', outline: 'none', width: '100px' }}
              />
            ) : (
              <span 
                onClick={startEditingName} 
                title="Click to change your display name"
                style={{ color: manualOffline ? '#888' : '#36b37e', fontWeight: 'bold', cursor: 'pointer', borderBottom: `1px dashed ${manualOffline ? '#888' : '#36b37e'}` }}
              >
                ● {localState.name} (You)
              </span>
            )}

            {remotePeers.map((p, i) => (
              <span key={i} style={{ color: '#666' }}>● {p.name}</span>
            ))}
          </div>

          {/* Right Side: Network Status & Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontWeight: 'bold', color: networkStatusColor, fontSize: '11px' }}>
              {networkStatusText}
            </div>
            
            {/* THE TOGGLE SWITCH */}
            <button 
              onClick={() => setManualOffline(!manualOffline)}
              style={{
                background: manualOffline ? '#ffebeb' : 'white',
                border: `1px solid ${manualOffline ? '#ff5c5c' : '#ccc'}`,
                color: manualOffline ? '#ff5c5c' : '#333',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {manualOffline ? 'Reconnect' : 'Go Offline'}
            </button>
          </div>
        </div>

        <div className="Board-header" style={{ display: 'flex', padding: '20px', gap: '10px', alignItems: 'center' }}>
          <input 
            className="Board-title" 
            value={doc.boardTitle && doc.boardTitle.startsWith("automerge:") ? "" : (doc.boardTitle || "")} 
            placeholder="Board Title"
            onChange={(e) => changeDoc(d => mutators.updateBoardTitle(d, e.target.value))}
            style={{ background: 'transparent', border: 'none', fontSize: '2em', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
          
          <input 
            type="text" placeholder="🔍 Search cards..." value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', width: '160px' }}
          />
          
          <button onClick={handleExport} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }} title="Download Board Data">
            ⬇️ Export JSON
          </button>
          
          <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', background: 'white' }} title="Upload Board Data">
            ⬆️ Import JSON
          </button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />

          <button onClick={() => setShowArchived(!showArchived)} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>
            {showArchived ? '📂 Hide Archived' : '📁 Show Archived'}
          </button>
        </div>

        <div className="Board-lists">
          {[...doc.lists].sort((a,b) => (a.order||0)-(b.order||0)).map(list => {
            const listCards = (doc.cards || []).filter(c => {
              const inList = c.listId === list.id;
              const isVisible = showArchived ? true : !c.archived;
              const matches = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (c.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
              return inList && isVisible && matches;
            });
            return (
              <List 
                key={list.id} 
                list={list} 
                cards={listCards} 
                doc={doc} 
                changeDoc={changeDoc} 
                highlightOptions={highlightOptions}
                onCardClick={onCardClick}
                remoteAwareness={remoteStates}
                setLocalAwareness={setLocalState}
              />
            )
          })}
          <AddList changeDoc={changeDoc} />
        </div>
      </div>
    </DragDropContext>
  )
}