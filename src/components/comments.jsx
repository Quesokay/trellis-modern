import React, { useState } from 'react'
import { mutators } from '../lib/store'

export default function Comments({ cardId, doc, changeDoc }) {
  const [newComment, setNewComment] = useState('')

  // Filter comments to only show those for the currently selected card
  const cardComments = (doc.comments || [])
    .filter(c => c.cardId === cardId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Oldest first

  const handleAddComment = (e) => {
    e.preventDefault() // 🚨 CRITICAL: Stops the browser from reloading the page!
    
    if (!newComment.trim()) return

    changeDoc(d => {
      // Signature matches store.js: createComment(doc, cardId, body)
      mutators.createComment(d, cardId, newComment.trim())
    })
    
    setNewComment('') // Clear the input field
  }

  return (
    <div className="Comments-section" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <label className="Inspector-label">Activity & Comments</label>
      
      {/* COMMENT LIST */}
      <div className="Comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
        {cardComments.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No comments yet.</div>
        ) : (
          cardComments.map(comment => (
            <div key={comment.id} style={{ background: '#f4f5f7', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: '#333' }}>{comment.author}</strong>
                <span style={{ color: '#888', fontSize: '10px' }}>
                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ color: '#172b4d' }}>{comment.body}</div>
            </div>
          ))
        )}
      </div>

      {/* SUBMISSION FORM */}
      <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input 
          type="text"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
        />
        <button 
          type="submit" 
          disabled={!newComment.trim()}
          style={{ 
            alignSelf: 'flex-end', padding: '6px 12px', background: newComment.trim() ? '#3F88C5' : '#ccc', 
            color: 'white', border: 'none', borderRadius: '4px', cursor: newComment.trim() ? 'pointer' : 'not-allowed', 
            fontWeight: 'bold', fontSize: '12px' 
          }}
        >
          Save
        </button>
      </form>
    </div>
  )
}