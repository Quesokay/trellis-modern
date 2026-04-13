import React, { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { mutators } from '../../lib/store'
import './card.css'

export default function Card({ card, index, doc, changeDoc, isHighlighted, onCardClick }) {
  const [tagInput, setTagInput] = useState('')

  const handleArchive = (e) => {
    e.stopPropagation()
    changeDoc(d => mutators.archiveCard(d, card.id))
  }

  const handleRestore = (e) => {
    e.stopPropagation()
    changeDoc(d => mutators.restoreCard(d, card.id))
  }

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault(); 
      e.stopPropagation();
      changeDoc(d => mutators.addTag(d, card.id, tagInput.trim()))
      setTagInput('')
    }
  }

  return (
    <Draggable draggableId={card.id} index={index} isDragDisabled={card.archived}>
      {(provided) => (
        <div 
          className={`Card ${isHighlighted ? 'is-highlighted' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onCardClick(card.id)}
          style={{
            ...provided.draggableProps.style,
            // THE FIX: Only set relative positioning if we aren't currently dragging
            position: provided.draggableProps.style.position || 'relative', 
            opacity: card.archived ? 0.6 : 1,
            filter: card.archived ? 'grayscale(80%)' : 'none',
            backgroundColor: card.archived ? '#f4f5f7' : 'white',
            padding: '12px',
            marginBottom: '8px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: isHighlighted ? '2px solid #3F88C5' : '1px solid #ddd',
            // Ensure the card stays on top of everything else while dragging
            zIndex: provided.draggableProps.style.zIndex || 1 
          }}
        >
          {/* DRAG HANDLE - Use this to move the card */}
          {!card.archived && (
            <div 
              {...provided.dragHandleProps}
              style={{
                position: 'absolute',
                left: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'grab',
                color: '#ccc',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                padding: '10px 4px'
              }}
              title="Drag to reorder"
            >
              ⠿
            </div>
          )}

          <div style={{ marginLeft: card.archived ? '0' : '20px' }}>
            {/* EDITABLE CARD TITLE */}
            <input 
              value={card.title || ""}
              disabled={card.archived}
              placeholder="Card Title"
              onChange={(e) => changeDoc(d => mutators.updateCardTitle(d, card.id, e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '14px',
                outline: 'none',
                color: card.archived ? '#888' : '#333',
                marginBottom: '4px'
              }}
            />

            {!card.archived && (
              <>
                {/* TAGS LIST */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {(card.tags || []).map(tag => (
                    <span 
                      key={tag} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        changeDoc(d => mutators.removeTag(d, card.id, tag)) 
                      }} 
                      style={{ 
                        background: '#e2e4e6', borderRadius: '3px', padding: '2px 6px', 
                        fontSize: '11px', color: '#4d4d4d', cursor: 'pointer' 
                      }}
                    >
                      {tag} &times;
                    </span>
                  ))}
                </div>

                {/* TAG INPUT */}
                <input 
                  type="text" 
                  placeholder="+ Add Tag..." 
                  value={tagInput} 
                  onChange={(e) => setTagInput(e.target.value)} 
                  onKeyDown={handleAddTag} 
                  style={{ 
                    width: '100%', fontSize: '11px', border: 'none', 
                    background: '#f4f5f7', padding: '4px 8px', borderRadius: '3px', outline: 'none' 
                  }} 
                />

                <button 
                  onClick={handleArchive} 
                  style={{ 
                    position: 'absolute', top: '8px', right: '8px', background: 'transparent', 
                    border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '16px' 
                  }}
                >
                  &times;
                </button>
              </>
            )}

            {card.archived && (
              <button 
                onClick={handleRestore} 
                style={{ 
                  fontSize: '10px', background: '#e3fcef', 
                  border: '1px solid #36b37e', color: '#006644', borderRadius: '3px', cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Restore Card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}