import React from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' 
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, highlightOptions, onCardClick }) {
  if (!doc || !doc.lists) return null

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return

    changeDoc(d => {
      mutators.moveCard(d, draggableId, destination.droppableId, destination.index)
    })
  }

  const sortedLists = [...doc.lists].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="Board">
        <div className="Board-header">
          <input 
            className="Board-title" 
            value={doc.boardTitle && doc.boardTitle.startsWith("automerge:") ? "" : (doc.boardTitle || "")} 
            placeholder="Untitled Board"
            onChange={(e) => {
              changeDoc(d => {
                mutators.updateBoardTitle(d, e.target.value)
              })
            }}
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
            // THE FIX: Only show cards that are NOT archived
            const listCards = (doc.cards || [])
              .filter(c => c.listId === list.id && !c.archived)
              
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