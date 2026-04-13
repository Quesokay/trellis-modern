import React, { useState } from 'react'
import { mutators } from '../../lib/store'
import './add_card.css'

export default function AddCard({ listId, changeDoc }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")

  const onSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) {
      // Use the mutator we defined in our store
      changeDoc(d => mutators.createCard(d, { listId, title }))
      setTitle("")
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e) => {
    // Submit on Enter (without shift), Cancel on Escape
    if (e.key === 'Enter' && !e.shiftKey) {
      onSubmit(e)
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTitle("")
    }
  }

  if (!isEditing) {
    return (
      <div className="AddCard-placeholder" onClick={() => setIsEditing(true)}>
        + Add a card...
      </div>
    )
  }

  return (
    <form className="AddCard" onSubmit={onSubmit}>
      <textarea
        className="AddCard-input"
        placeholder="Enter a title for this card..."
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="AddCard-controls">
        <button type="submit" className="AddCard-submit">Add Card</button>
        <button 
          type="button" 
          className="AddCard-cancel" 
          onClick={() => { setIsEditing(false); setTitle(""); }}
        >
          ×
        </button>
      </div>
    </form>
  )
}