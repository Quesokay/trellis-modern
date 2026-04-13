import React from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' // Make sure extension matches your project
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, highlightOptions, onCardClick }) {
  if (!doc || !doc.lists) return null

  // This is the "brain" that fires when you drop a card
  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    
    // Dropped outside a list
    if (!destination) return

    // Dropped in the exact same spot it started
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    // Update the Automerge CRDT!
    changeDoc(d => {
      mutators.moveCard(d, draggableId, destination.droppableId, destination.index)
    })
  }

  // Ensure lists are ordered if we implement list dragging later
  const sortedLists = [...doc.lists].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    // The DragDropContext acts as the "Provider" the error was asking for
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="Board">
        <div className="Board-header">
          <input 
            className="Board-title" 
            // 1. THE AMNESIA GUARD: Ignore the raw ID if humanize() failed
            value={doc.boardTitle && doc.boardTitle.startsWith("automerge:") ? "" : (doc.boardTitle || "")} 
            placeholder="Untitled Board"
            onChange={(e) => {
              changeDoc(d => {
                mutators.updateBoardTitle(d, e.target.value)
              })
            }}
            // 2. THE ENTER KEY: Drop focus to "Save"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur(); 
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              fontSize: '2em',
              fontWeight: 'bold',
              fontFamily: 'inherit',
              outline: 'none',
              width: '100%',
              textOverflow: 'ellipsis'
            }}
          />
          
        </div>
        <div className="Board-lists">
          {sortedLists.map(list => {
            const listCards = (doc.cards || []).filter(c => c.listId === list.id)
            return (
              <List 
                key={list.id} 
                list={list} 
                cards={listCards} 
                doc={doc} 
                changeDoc={changeDoc}
                highlightOptions={highlightOptions}
                onCardClick={onCardClick}
              />
            )
          })}
          <AddList changeDoc={changeDoc} />
        </div>
      </div>
    </DragDropContext>
  )
}