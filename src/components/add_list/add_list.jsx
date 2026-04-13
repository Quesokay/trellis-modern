import React, { useState } from 'react'
import { mutators } from '../../lib/store'
import './add_list.css'

export default function AddList({ changeDoc }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")

  const onSubmit = (e) => {
    e.preventDefault()
    if (title.trim()) {
      changeDoc(d => mutators.createList(d, { title }))
      setTitle("")
      setIsEditing(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="AddList-placeholder" onClick={() => setIsEditing(true)}>
        + Add another list
      </div>
    )
  }

  return (
    <div className="AddList">
      <form onSubmit={onSubmit}>
        <input
          className="AddList-input"
          placeholder="Enter list title..."
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setIsEditing(false)}
        />
        <div className="AddList-controls">
          <button type="submit" className="AddList-submit">Add List</button>
          <button type="button" className="AddList-cancel" onClick={() => setIsEditing(false)}>
            &times;
          </button>
        </div>
      </form>
    </div>
  )
}