import React, { useState, useEffect } from 'react'
import { useDocument, useHandle } from '@automerge/automerge-repo-react-hooks'
import { isValidAutomergeUrl } from '@automerge/automerge-repo'
import { repo, mutators, generateDocId } from '../lib/store.js'

import Board from './board/board'
import Inspector from './inspector/inspector'
import Network from './network'
import Documents from './documents'
import Changes from "./changes.jsx"

const cleanAutomergeId = (id) => {
  if (!id) return "";
  let clean = id.replace(/^#/, "");
  if (clean.includes("automerge:")) {
    const parts = clean.split("automerge:");
    clean = "automerge:" + parts[parts.length - 1];
  }
  return clean.trim();
};

export default function App() {
  const [docId, setDocId] = useState(() => {
    const hashId = cleanAutomergeId(window.location.hash);
    if (hashId && isValidAutomergeUrl(hashId)) return hashId;
    const savedId = localStorage.getItem('trellis-last-board');
    if (savedId && isValidAutomergeUrl(savedId)) return savedId;
    const newId = generateDocId();
    window.location.hash = newId; 
    return newId;
  });

  const [selectedCardId, setSelectedCardId] = useState(null);
  const validatedId = cleanAutomergeId(docId);

  const [doc, changeDoc] = useDocument(validatedId);
  const handle = useHandle(validatedId); 

  useEffect(() => {
    if (isValidAutomergeUrl(docId)) {
      window.location.hash = docId;
      localStorage.setItem('trellis-last-board', docId); 
    }
  }, [docId]);

  useEffect(() => {
    if (doc && !doc.lists) {
      changeDoc((d) => mutators.initializeDocument(d));
    }
  }, [doc, changeDoc]);

  if (!doc || !handle) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666' }}>
        <h2>Connecting to Peer Network...</h2>
        <p>Fetching document handle for {validatedId.substring(0, 15)}...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Board 
        key={validatedId} 
        doc={doc} 
        changeDoc={changeDoc} 
        handle={handle} 
        // --- THIS WAS MISSING ---
        highlightOptions={{ cardId: selectedCardId }} 
        onCardClick={setSelectedCardId} 
      />
      
      <Inspector 
        doc={doc} 
        changeDoc={changeDoc} 
        highlightOptions={{ cardId: selectedCardId }} 
      />

      <div className="Sidebar">
        <Network />
        <Documents openDocument={(id) => {
          setDocId(cleanAutomergeId(id));
          setSelectedCardId(null);
        }} />
        <Changes doc={doc} />
      </div>
    </div>
  );
}