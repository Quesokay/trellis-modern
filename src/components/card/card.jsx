import React, { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { mutators } from '../../lib/store'
import './card.css'

export default function Card({ card, index, doc, changeDoc, isHighlighted, onCardClick, remoteAwareness, setLocalAwareness }) {
  const [tagInput, setTagInput] = useState('')

  // 1. Calculate Presence
  const peersHere = Object.values(remoteAwareness || {})
    .filter(state => state?.focusedCardId === card.id)
    .map(state => state.name);

  // 2. SEPARATED HANDLERS
  const handleCardClick = () => {
    // ONLY open inspector on click
    if (onCardClick) onCardClick(card.id);
  }

  const handleMouseEnter = () => {
    // ONLY show presence bubble on hover
    if (setLocalAwareness) setLocalAwareness(s => ({ ...s, focusedCardId: card.id }));
  }

  const handleMouseLeave = () => {
    // Clear presence bubble when mouse leaves
    if (setLocalAwareness) setLocalAwareness(s => ({ ...s, focusedCardId: null }));
  }

  // 3. Actions
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
      e.preventDefault(); e.stopPropagation();
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
          // Attach separated handlers here
          onClick={handleCardClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            ...provided.draggableProps.style,
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
            border: peersHere.length > 0 ? '2px solid #36b37e' : (isHighlighted ? '2px solid #3F88C5' : '1px solid #ddd'),
            zIndex: provided.draggableProps.style.zIndex || 1 
          }}
        >
          {/* PEER INDICATORS */}
          <div style={{ position: 'absolute', top: '-10px', right: '5px', display: 'flex', gap: '2px' }}>
            {peersHere.map((name, i) => (
              <div key={i} title={`${name} is here`} style={{ background: '#36b37e', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', border: '2px solid white' }}>
                {name.charAt(0)}
              </div>
            ))}
          </div>

          {!card.archived && (
            <div {...provided.dragHandleProps} style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', cursor: 'grab', color: '#ccc', fontSize: '18px' }}>⠿</div>
          )}

          <div style={{ marginLeft: card.archived ? '0' : '20px' }}>
            <input 
              value={card.title || ""}
              disabled={card.archived}
              placeholder="Card Title"
              onChange={(e) => changeDoc(d => mutators.updateCardTitle(d, card.id, e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
              style={{ width: '100%', background: 'transparent', border: 'none', fontWeight: 'bold', fontSize: '14px', outline: 'none', color: card.archived ? '#888' : '#333', marginBottom: '4px' }}
            />

            {!card.archived && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0' }}>
                  {(card.tags || []).map(tag => (
                    <span key={tag} onClick={(e) => { e.stopPropagation(); changeDoc(d => mutators.removeTag(d, card.id, tag)) }} style={{ background: '#e2e4e6', borderRadius: '3px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}>{tag} &times;</span>
                  ))}
                </div>
                <input 
                  type="text" placeholder="+ Tag" value={tagInput} 
                  onChange={(e) => setTagInput(e.target.value)} 
                  onKeyDown={handleAddTag} 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ width: '100%', fontSize: '11px', border: 'none', background: '#f4f5f7', padding: '4px', borderRadius: '3px', outline: 'none' }} 
                />
              </>
            )}
            
            {/* ACTION BUTTONS */}
            {!card.archived ? (
              <button onClick={handleArchive} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '16px' }}>&times;</button>
            ) : (
              <button onClick={handleRestore} style={{ fontSize: '10px', background: '#e3fcef', border: '1px solid #36b37e', color: '#006644', borderRadius: '3px', marginTop: '4px' }}>Restore</button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}