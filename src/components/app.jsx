import React, { useState, useEffect } from 'react'
import { useDocument } from '@automerge/automerge-repo-react-hooks'
import { isValidAutomergeUrl } from '@automerge/automerge-repo'
import { repo, mutators, generateDocId } from '../lib/store.js'
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";

// Components
import Board from './board/board'
import Inspector from './inspector/inspector'
import Network from './network'
import Documents from './documents'
import Changes from "./changes.jsx"

// --- 1. HELPER (Must be outside the component) ---
const cleanAutomergeId = (id) => {
  if (!id) return "";
  let clean = id.replace(/^#/, "");
  // If double-prefixed, take only the last valid ID part
  if (clean.includes("automerge:")) {
    const parts = clean.split("automerge:");
    clean = "automerge:" + parts[parts.length - 1];
  }
  return clean.trim();
};

export default function App() {
  // --- 2. THE AMNESIA FIX ---
  const [docId, setDocId] = useState(() => {
    // 1. Check if the URL already has a specific board ID
    const hashId = cleanAutomergeId(window.location.hash);
    if (hashId && isValidAutomergeUrl(hashId)) {
      return hashId;
    }

    // 2. Check if the app remembers the last board we were looking at
    const savedId = localStorage.getItem('trellis-last-board');
    if (savedId && isValidAutomergeUrl(savedId)) {
      window.location.hash = savedId;
      return savedId;
    }

    // 3. Fallback: Completely fresh boot, generate a new board
    const newId = generateDocId();
    window.location.hash = newId; 
    return newId;
  });

  const [selectedCardId, setSelectedCardId] = useState(null);

  // --- 3. THE HOOK (Only declare this ONCE) ---
  const validatedId = cleanAutomergeId(docId);
  const [doc, changeDoc] = useDocument(validatedId);

  // --- 4. EFFECTS ---

  // --- EXPOSE REPO TO WINDOW FOR DEBUGGING ---
  useEffect(() => {
    window.TrellisRepo = repo;
    console.log("🛠️ DevTools: Engine bound to window.TrellisRepo");
  }, []);
  
  // Sync URL hash AND save to LocalStorage if docId changes via Sidebar
  useEffect(() => {
    if (isValidAutomergeUrl(docId)) {
      window.location.hash = docId;
      // Tell the app to remember this exact board for the next cold boot
      localStorage.setItem('trellis-last-board', docId); 
    }
  }, [docId]);

 // Auto-Save & Initialization
  useEffect(() => {
    // Look for 'lists' instead of 'columns' to match store.js!
    if (doc && !doc.lists) {
      changeDoc((d) => {
        // Let store.js handle 100% of the initialization logic
        if (mutators.initializeDocument) {
          mutators.initializeDocument(d);
        } else {
          // Fallback just in case seed_data.js is missing
          d.boardTitle = "Untitled Board";
          d.lists = [];
          d.cards = [];
          d.comments = [];
        }
      });
    }
  }, [doc, changeDoc]);

  // --- 5. RENDER ---
  console.log("Current Doc ID:", validatedId);
  console.log("Document State:", doc);
  if (!doc) return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Loading Trellis...</div>;

  return (
    <div className="App">
      <Board 
        doc={doc} 
        changeDoc={changeDoc} 
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
          const clean = cleanAutomergeId(id);
          setDocId(clean);
          setSelectedCardId(null);
        }} />
        <Changes doc={doc} />
      </div>
    </div>
  );
}