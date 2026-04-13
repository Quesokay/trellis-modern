import React, { useState, useEffect } from 'react';
import { isValidAutomergeUrl } from '@automerge/automerge-repo';
import { useDocument } from '@automerge/automerge-repo-react-hooks';
import { generateDocId } from '../lib/store';

function DocumentListItem({ url, currentUrl, onOpen, onDelete }) {
  const [doc] = useDocument(url);
  const displayTitle = (doc && doc.boardTitle && !doc.boardTitle.startsWith("automerge:")) ? doc.boardTitle : "Untitled Board";

  return (
    <div 
      className="DocumentItem"
      onClick={() => onOpen(url)}
      style={{ 
        borderLeft: currentUrl === url ? '4px solid #3F88C5' : '1px solid #ddd',
        backgroundColor: currentUrl === url ? '#f4f5f7' : 'white',
        cursor: 'pointer', padding: '10px', marginBottom: '4px', borderRadius: '0 4px 4px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}
    >
      <div>
        <div className="DocumentItem-title" style={{ fontWeight: 'bold', color: '#333' }}>{displayTitle}</div>
        <div className="DocumentItem-id" style={{ fontSize: '10px', color: '#999' }}>{url.substring(0, 15)}...</div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); if(confirm("Remove this board from list?")) onDelete(url); }}
        style={{ background: 'transparent', border: 'none', color: '#ff5c5c', cursor: 'pointer', fontSize: '14px' }}
      >
        🗑️
      </button>
    </div>
  );
}

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

  const handleCreateNew = () => {
    const newUrl = generateDocId();
    const updated = [...docList, newUrl];
    localStorage.setItem('trellis-docs', JSON.stringify(updated));
    setDocList(updated);
    window.location.hash = newUrl;
    openDocument(newUrl);
  };

  const deleteBoard = (urlToDelete) => {
    const updated = docList.filter(u => u !== urlToDelete);
    localStorage.setItem('trellis-docs', JSON.stringify(updated));
    setDocList(updated);
    if (currentUrl === urlToDelete) {
      if (updated.length > 0) { window.location.hash = updated[0]; openDocument(updated[0]); }
      else { handleCreateNew(); }
    }
  };

  const handleCopyId = () => {
    const activeUrl = window.location.hash.replace(/^#/, '');
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl).then(() => {
      setCopyStatus('✅ Copied!');
      setTimeout(() => setCopyStatus('📋 Copy Current Board ID'), 2000);
    });
  };

  const submitJoin = () => {
    const url = joinInput.trim();
    if (!url || !isValidAutomergeUrl(url)) { setJoinError("Invalid ID"); return; }
    const updated = [...docList.filter(d => d !== url), url];
    localStorage.setItem('trellis-docs', JSON.stringify(updated));
    setDocList(updated);
    setIsJoining(false); setJoinInput('');
    window.location.hash = url; openDocument(url);
  };

  return (
    <div className="Documents">
      <div className="Sidebar-header" style={{ marginBottom: '10px', fontWeight: 'bold' }}>DOCUMENTS</div>
      <button onClick={handleCopyId} style={{ marginBottom: '15px', width: '100%', padding: '6px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>{copyStatus}</button>
      <div className="DocumentList">
        {docList.map(url => (
          <DocumentListItem key={url} url={url} currentUrl={currentUrl} onOpen={(u) => { window.location.hash = u; openDocument(u); }} onDelete={deleteBoard} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
        <button onClick={handleCreateNew} style={{ width: '100%', padding: '8px', cursor: 'pointer', background: '#3F88C5', borderRadius: '4px', color: 'white', fontWeight: 'bold', border: 'none' }}>✨ Create New Board</button>
        {isJoining ? (
          <div style={{ padding: '10px', background: '#f4f5f7', borderRadius: '4px', border: '1px solid #ddd' }}>
            <input autoFocus value={joinInput} onChange={(e) => setJoinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitJoin()} placeholder="automerge:..." style={{ width: '100%', padding: '6px', marginBottom: '8px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={submitJoin} style={{ flex: 1, background: '#3F88C5', color: 'white', border: 'none', padding: '6px', borderRadius: '3px', cursor: 'pointer' }}>Join</button>
              <button onClick={() => setIsJoining(false)} style={{ flex: 1, background: '#ccc', border: 'none', padding: '6px', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsJoining(true)} style={{ width: '100%', padding: '8px', cursor: 'pointer', background: '#f4f5f7', border: '1px dashed #ccc', borderRadius: '4px' }}>+ Join Board</button>
        )}
      </div>
    </div>
  );
}