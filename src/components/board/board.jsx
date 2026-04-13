import React, { useState, useEffect } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' 
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, handle, highlightOptions, onCardClick }) {
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 1. ROCK-SOLID CUSTOM AWARENESS ENGINE ---
  const [localState, setLocalState] = useState({ 
    name: localStorage.getItem("peerName") || `User-${Math.floor(Math.random() * 1000)}`, 
    focusedCardId: null 
  });
  const [remoteStates, setRemoteStates] = useState({});

  useEffect(() => {
    // Ultimate safety guard: If the app hasn't provided the handle yet, do nothing.
    if (!handle) return; 
    
    // Listen for other peers sending their presence data
    const handleMessage = (event) => {
      // event contains { senderId, message }
      setRemoteStates(prev => ({ ...prev, [event.senderId]: event.message }));
    };
    
    handle.on("ephemeral-message", handleMessage);
    
    // Broadcast our state instantly (e.g., when we click a card)
    handle.broadcast(localState);
    
    // Heartbeat: Keep broadcasting every 2.5s so newly joined peers see us
    const interval = setInterval(() => {
      handle.broadcast(localState);
    }, 2500);

    return () => {
      // Clean up cleanly on unmount
      handle.off("ephemeral-message", handleMessage);
      clearInterval(interval);
    };
  }, [handle, localState]);
  // ---------------------------------------------

  if (!doc || !doc.lists) return null;

  const remotePeers = Object.values(remoteStates).filter(s => s && s.name);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    changeDoc(d => mutators.moveCard(d, draggableId, destination.droppableId, destination.index));
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="Board">
        
        {/* PRESENCE BAR */}
        <div style={{ background: '#f0f2f5', padding: '5px 20px', fontSize: '11px', display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
          <span style={{color: '#36b37e'}}>● You</span>
          {remotePeers.map((p, i) => <span key={i}>● {p.name}</span>)}
        </div>

        <div className="Board-header" style={{ display: 'flex', padding: '20px', gap: '20px', alignItems: 'center' }}>
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
            style={{ padding: '8px 12px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', width: '200px' }}
          />
          <button onClick={() => setShowArchived(!showArchived)} style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>
            {showArchived ? '📂 Hide' : '📁 Show'} Archived
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
                // Our custom state objects are 100% compatible with the List and Card props!
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