import React from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { mutators } from '../../lib/store'
import './card.css'

export default function Card({ card, index, doc, changeDoc, isHighlighted, onCardClick }) {
  
  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm("Delete this card?")) {
      changeDoc(d => mutators.deleteCard(d, card.id))
    }
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
        >
          <div className="Card-title">{card.title}</div>
          <button 
            className="Card-delete-btn"
            onClick={handleDelete} 
            style={{ 
              position: 'absolute', 
              top: '5px', 
              right: '5px', 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#ccc',
              fontSize: '16px'
            }}
          >
            &times;
          </button>
        </div>
      )}
    </Draggable>
  )
}