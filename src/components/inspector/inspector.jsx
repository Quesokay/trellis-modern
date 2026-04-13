import React from 'react'
import { mutators } from '../../lib/store'
import Comments from '../comments.jsx' // Make sure this file exists!
import './inspector.css'

export default function Inspector({ doc, changeDoc, highlightOptions }) {
  const cardId = highlightOptions?.cardId
  const selectedCard = doc.cards?.find(c => c.id === cardId)

  if (!selectedCard) {
    return (
      <div className="Inspector is-empty">
        <div className="Inspector-header">INSPECTOR</div>
        <p style={{ padding: '20px', color: '#888' }}>Select a card to view its details</p>
      </div>
    )
  }

  return (
    <div className="Inspector">
      <div className="Inspector-header">CARD INSPECTOR</div>
      
      <div className="Inspector-section">
        <label className="Inspector-label">Title</label>
        <input 
          className="Inspector-title-input"
          value={selectedCard.title}
          onChange={(e) => changeDoc(d => {
            const card = d.cards.find(c => c.id === cardId)
            if (card) card.title = e.target.value
          })}
        />
      </div>

      <div className="Inspector-section">
        <label className="Inspector-label">Description</label>
        <textarea 
          className="Inspector-description-area"
          placeholder="Add a more detailed description..."
          value={selectedCard.description || ""}
          onChange={(e) => changeDoc(d => {
            const card = d.cards.find(c => c.id === cardId)
            if (card) card.description = e.target.value
          })}
        />
      </div>

      <hr className="Inspector-divider" />

      {/* This renders the collaborative comment stream */}
      <Comments cardId={cardId} doc={doc} changeDoc={changeDoc} />
      
      <div className="Inspector-footer">
        <button 
          className="Inspector-delete-card"
          onClick={() => {
            if (window.confirm("Delete this card?")) {
              changeDoc(d => mutators.deleteCard(d, cardId))
            }
          }}
        >
          Delete Card
        </button>
      </div>
    </div>
  )
}