import React, { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { mutators } from '../../lib/store'
import './card.css'

export default function Card({ card, index, doc, changeDoc, isHighlighted, onCardClick }) {
  const [tagInput, setTagInput] = useState('')

  // Toggle archive instead of permanent delete
  const handleArchive = (e) => {
    e.stopPropagation()
    changeDoc(d => mutators.archiveCard(d, card.id))
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      e.stopPropagation()
      changeDoc(d => mutators.addTag(d, card.id, tagInput.trim()))
      setTagInput('')
    }
  }

  const handleRemoveTag = (e, tag) => {
    e.stopPropagation()
    changeDoc(d => mutators.removeTag(d, card.id, tag))
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided) => (
        <div 
          className={`Card ${isHighlighted ? 'is-highlighted' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onCardClick(card.id)}
          style={{
            ...provided.draggableProps.style,
            position: 'relative',
            paddingBottom: '30px' // Space for the tag input
          }}
        >
          <div className="Card-title" style={{ marginBottom: '8px' }}>{card.title}</div>

          {/* TAGS DISPLAY */}
          <div className="Card-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {(card.tags || []).map(tag => (
              <span 
                key={tag} 
                onClick={(e) => handleRemoveTag(e, tag)}
                style={{
                  background: '#ebecf0',
                  borderRadius: '3px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  color: '#5e6c84',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {tag} <span style={{ fontSize: '10px', opacity: 0.6 }}>&times;</span>
              </span>
            ))}
          </div>

          {/* TAG INPUT */}
          <input 
            type="text"
            placeholder="+ Add tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              fontSize: '11px',
              border: 'none',
              background: '#f4f5f7',
              padding: '4px',
              borderRadius: '3px',
              outline: 'none'
            }}
          />

          {/* ARCHIVE BUTTON */}
          <button 
            className="Card-archive-btn"
            title="Archive Card"
            onClick={handleArchive} 
            style={{ 
              position: 'absolute', 
              top: '5px', 
              right: '5px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#ccc',
              fontSize: '18px'
            }}
          >
            &times;
          </button>
        </div>
      )}
    </Draggable>
  )
}