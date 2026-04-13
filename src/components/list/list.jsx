import React from 'react'
import { Droppable } from '@hello-pangea/dnd'
import Card from '../card/card'
import AddCard from "../add_card/add_card.jsx"
import { mutators } from '../../lib/store'
import './list.css'

export default function List({ list, cards, doc, changeDoc, highlightOptions, onCardClick }) {
  
  const handleDeleteList = () => {
    if (window.confirm(`Are you sure you want to delete "${list.title}" and all its cards?`)) {
      changeDoc(d => mutators.deleteList(d, list.id))
    }
  }

  const sortedCards = [...cards].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="List">
      <div className="List-header">
        <h3 className="List-title">{list.title}</h3>
        <button 
          className="List-delete-btn" 
          onClick={handleDeleteList} 
          style={{background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '18px'}}
        >
          &times;
        </button>
      </div>

      <Droppable droppableId={list.id}>
        {(provided) => (
          <div 
            className="List-cards"
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ minHeight: '10px' }}
          >
            {sortedCards.map((card, index) => (
              <Card 
                key={card.id} 
                index={index} 
                card={card} 
                doc={doc}
                changeDoc={changeDoc}
                isHighlighted={highlightOptions?.cardId === card.id}
                onCardClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <AddCard 
        listId={list.id} 
        changeDoc={changeDoc} 
      />
    </div>
  )
}