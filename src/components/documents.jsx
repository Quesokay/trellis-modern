import React, { useState, useEffect } from 'react';
import { isValidAutomergeUrl } from '@automerge/automerge-repo';
import { useDocument } from '@automerge/automerge-repo-react-hooks'; // NEW: Hook into the DB
import { generateDocId } from '../lib/store';

// --- NEW: Live Document Item Component ---
// This tiny component connects to the DB independently to fetch its live title!
function DocumentListItem({ url, currentUrl, onOpen }) {
  const [doc] = useDocument(url);
  
  // Guard against amnesia IDs just like we did in the Board UI
  const displayTitle = (doc && doc.boardTitle && !doc.boardTitle.startsWith("automerge:")) 
    ? doc.boardTitle 
    : "Untitled Board";

  return (
    <div 
      className="DocumentItem"
      onClick={() => onOpen(url)}
      style={{ 
        borderLeft: currentUrl === url ? '4px solid #3F88C5' : '1px solid #ddd',
        backgroundColor: currentUrl === url ? '#f4f5f7' : 'white',
        cursor: 'pointer',
        padding: '10px',
        marginBottom: '4px',
        borderRadius: '0 4px 4px 0'
      }}
    >
      <div className="DocumentItem-title" style={{ fontWeight: 'bold', color: '#333' }}>
        {displayTitle}
      </div>
      <div className="DocumentItem-id" style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
        {url.substring(0, 20)}...
      </div>
    </div>
  );
}

// --- MAIN SIDEBAR COMPONENT ---
export default function Documents({ openDocument }) {
  const [docList, setDocList] = useState([]);
  
  const [isJoining, setIsJoining] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copyStatus, setCopyStatus] = useState('📋 Copy Current Board ID');

  const currentUrl = window.location.hash.replace(/^#/, '');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('trellis-docs') || '[]');
    
    if (currentUrl && isValidAutomergeUrl(currentUrl) && !saved.includes(currentUrl)) {
      saved.push(currentUrl);
      localStorage.setItem('trellis-docs', JSON.stringify(saved));
    }
    
    setDocList(saved.filter(isValidAutomergeUrl)); 
  }, [currentUrl]);

  // --- CREATE NEW BOARD ---
  const handleCreateNew = () => {
    const newUrl = generateDocId();
    
    const updated = [...docList, newUrl];
    localStorage.setItem('trellis-docs', JSON.stringify(updated));
    setDocList(updated);
    
    window.location.hash = newUrl;
    openDocument(newUrl);
  };

  // --- BULLETPROOF SYNCHRONOUS COPY ---
  const handleCopyId = () => {
    const activeUrl = window.location.hash.replace(/^#/, '');
    
    if (!activeUrl) {
      alert("No board ID found! Try creating a new board first.");
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = activeUrl;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopyStatus('✅ Copied to Clipboard!');
      } else {
        setCopyStatus('❌ Copy Failed');
      }
    } catch (err) {
      console.error('Copy error:', err);
      setCopyStatus('❌ Copy Error');
    }

    document.body.removeChild(textArea);
    setTimeout(() => setCopyStatus('📋 Copy Current Board ID'), 2500);
  };

  // --- CUSTOM REACT SUBMIT LOGIC ---
  const submitJoin = () => {
    const url = joinInput.trim();
    if (!url) { setIsJoining(false); setJoinError(''); return; }
    if (!isValidAutomergeUrl(url)) { setJoinError("Invalid ID. Must start with 'automerge:'"); return; }

    const updated = [...docList.filter(d => d !== url), url];
    localStorage.setItem('trellis-docs', JSON.stringify(updated));
    setDocList(updated);
    
    setIsJoining(false);
    setJoinInput('');
    setJoinError('');
    
    window.location.hash = url;
    openDocument(url);
  };

  return (
    <div className="Documents">
      <div className="Sidebar-header" style={{ marginBottom: '10px', fontWeight: 'bold' }}>DOCUMENTS</div>
      
      <button 
        onClick={handleCopyId}
        style={{ 
          marginBottom: '15px', 
          width: '100%', 
          padding: '6px', 
          cursor: 'pointer',
          background: copyStatus.includes('✅') ? '#e3fcef' : '#f4f5f7',
          border: copyStatus.includes('✅') ? '1px solid #36b37e' : '1px solid #ccc',
          borderRadius: '4px',
          color: copyStatus.includes('✅') ? '#006644' : '#333',
          fontWeight: 'bold',
          fontSize: '12px',
          transition: 'all 0.2s'
        }}
      >
        {copyStatus}
      </button>

      <div className="DocumentList">
        {/* WE REPLACED THE HARDCODED DIVS WITH OUR NEW COMPONENT */}
        {docList.map(url => (
          <DocumentListItem 
            key={url} 
            url={url} 
            currentUrl={currentUrl} 
            onOpen={(openUrl) => {
              window.location.hash = openUrl;
              openDocument(openUrl);
            }} 
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
        <button 
          onClick={handleCreateNew}
          style={{ 
            width: '100%', padding: '8px', cursor: 'pointer', background: '#3F88C5',
            border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold'
          }}
        >
          ✨ Create New Board
        </button>

        {isJoining ? (
          <div style={{ padding: '10px', background: '#f4f5f7', borderRadius: '4px', border: '1px solid #ddd' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#5e6c84', display: 'block', marginBottom: '4px' }}>
              Paste Board ID:
            </label>
            <input
              autoFocus
              value={joinInput}
              onChange={(e) => { setJoinInput(e.target.value); setJoinError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submitJoin()}
              placeholder="automerge:..."
              style={{ 
                width: '100%', padding: '6px', marginBottom: '8px', boxSizing: 'border-box',
                border: joinError ? '1px solid red' : '1px solid #ccc', borderRadius: '3px'
              }}
            />
            {joinError && ( <div style={{ color: 'red', fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>{joinError}</div> )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submitJoin} style={{ flex: 1, background: '#3F88C5', color: 'white', border: 'none', padding: '6px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Join</button>
              <button onClick={() => { setIsJoining(false); setJoinError(''); setJoinInput(''); }} style={{ flex: 1, background: '#e2e4e6', color: '#333', border: 'none', padding: '6px', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsJoining(true)}
            style={{ 
              width: '100%', padding: '8px', cursor: 'pointer', background: '#f4f5f7',
              border: '1px dashed #ccc', borderRadius: '4px', color: '#5e6c84', fontWeight: 'bold'
            }}
          >
            + Join Board
          </button>
        )}
      </div>
    </div>
  );
}