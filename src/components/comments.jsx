import React, { useState } from 'react'
import { mutators } from '../lib/store'
import './comments.css'

export default function Comments({ cardId, doc, changeDoc }) {
  const [newComment, setNewComment] = useState("")

  // Filter comments for just this card and sort oldest to newest
  const cardComments = (doc.comments || [])
    .filter(c => c.cardId === cardId)
    .sort((a, b) => a.timestamp - b.timestamp)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (newComment.trim()) {
      changeDoc(d => mutators.addComment(d, { 
        cardId, 
        text: newComment.trim(),
        // In a real app, this would be the logged-in user's name
        author: "Local User" 
      }))
      setNewComment("")
    }
  }

  return (
    <div className="Comments">
      <h3 className="Comments-header">
        <span className="Comments-icon">💬</span> Comments
      </h3>
      
      <div className="Comments-list">
        {cardComments.length === 0 ? (
          <div className="Comments-empty">No comments yet.</div>
        ) : (
          cardComments.map(comment => (
            <div key={comment.id} className="Comment">
              <div className="Comment-header">
                <span className="Comment-author">{comment.author}</span>
                <span className="Comment-time">
                  {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="Comment-text">{comment.text}</div>
            </div>
          ))
        )}
      </div>

      <form className="Comments-form" onSubmit={handleSubmit}>
        <textarea
          className="Comments-input"
          placeholder="Write a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => {
            // Submit on Enter (allow Shift+Enter for newlines)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <button 
          type="submit" 
          className="Comments-submit"
          disabled={!newComment.trim()}
        >
          Save
        </button>
      </form>
    </div>
  )
}