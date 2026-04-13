import React, { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' 
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, highlightOptions, onCardClick }) {
  const [showArchived, setShowArchived] = useState(false);

  if (!doc || !doc.lists) return null

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    changeDoc(d => {
      mutators.moveCard(d, draggableId, destination.droppableId, destination.index)
    })
  }

  const sortedLists = [...doc.lists].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="Board">
        <div className="Board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input 
            className="Board-title" 
            value={doc.boardTitle && doc.boardTitle.startsWith("automerge:") ? "" : (doc.boardTitle || "")} 
            placeholder="Untitled Board"
            onChange={(e) => changeDoc(d => mutators.updateBoardTitle(d, e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            style={{ background: 'transparent', border: 'none', fontSize: '2em', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
          
          <button 
            onClick={() => setShowArchived(!showArchived)}
            style={{ 
              padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer',
              background: showArchived ? '#4C9AFF' : '#f4f5f7', color: showArchived ? 'white' : '#5e6c84',
              border: '1px solid #ddd', fontWeight: 'bold'
            }}
          >
            {showArchived ? '📂 Hide Archived' : '📁 Show Archived'}
          </button>
        </div>
        <div className="Board-lists">
          {sortedLists.map(list => {
            const listCards = (doc.cards || []).filter(c => {
              const inList = c.listId === list.id;
              return showArchived ? inList : (inList && !c.archived);
            })
              
            return (
              <List key={list.id} list={list} cards={listCards} doc={doc} changeDoc={changeDoc} highlightOptions={highlightOptions} onCardClick={onCardClick} />
            )
          })}
          <AddList changeDoc={changeDoc} />
        </div>
      </div>
    </DragDropContext>
  )
}