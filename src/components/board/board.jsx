import React, { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import List from '../list/list.jsx' 
import AddList from '../add_list/add_list.jsx'
import { mutators } from '../../lib/store'
import './board.css'

export default function Board({ doc, changeDoc, highlightOptions, onCardClick }) {
  const [showArchived, setShowArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // OPTION 2: Search state

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
        <div className="Board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <input 
            className="Board-title" 
            value={doc.boardTitle && doc.boardTitle.startsWith("automerge:") ? "" : (doc.boardTitle || "")} 
            placeholder="Untitled Board"
            onChange={(e) => changeDoc(d => mutators.updateBoardTitle(d, e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
            style={{ background: 'transparent', border: 'none', fontSize: '2em', fontWeight: 'bold', outline: 'none', flex: 1 }}
          />
          
          {/* SEARCH & ACTIONS AREA */}
          <div className="Board-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input 
              type="text"
              placeholder="🔍 Filter cards or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid #ddd',
                fontSize: '13px',
                outline: 'none',
                width: '220px',
                background: '#fff'
              }}
            />

            <button 
              onClick={() => setShowArchived(!showArchived)}
              style={{ 
                padding: '6px 12px', fontSize: '12px', borderRadius: '4px', cursor: 'pointer',
                background: showArchived ? '#4C9AFF' : '#f4f5f7', color: showArchived ? 'white' : '#5e6c84',
                border: '1px solid #ddd', fontWeight: 'bold', whiteSpace: 'nowrap'
              }}
            >
              {showArchived ? '📂 Hide Archived' : '📁 Show Archived'}
            </button>
          </div>
        </div>

        <div className="Board-lists">
          {sortedLists.map(list => {
            // UPDATED FILTER: Check List ID, Archive status, AND the Search Query
            const listCards = (doc.cards || []).filter(c => {
              const inList = c.listId === list.id;
              const isVisible = showArchived ? true : !c.archived;
              
              // Search Logic: Check title or tags
              const query = searchQuery.toLowerCase();
              const matchesTitle = c.title.toLowerCase().includes(query);
              const matchesTags = (c.tags || []).some(tag => tag.toLowerCase().includes(query));
              
              return inList && isVisible && (matchesTitle || matchesTags);
            })
              
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