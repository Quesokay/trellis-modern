import React from 'react'

export default function Changes({ doc }) {
  const activities = doc?.activities || []

  return (
    <div className="Changes">
      <div className="Sidebar-header">
        {/* Make sure you actually have this SVG in your assets folder, or remove the img tag */}
        <img src="src/assets/images/delta.svg" className="Sidebar-icon" alt="" />
        CHANGES
      </div>
      
      {activities.length === 0 ? (
        <div style={{ color: '#777', fontStyle: 'italic', fontSize: '12px' }}>
          History view coming soon...
        </div>
      ) : (
        <ul>
          {activities.map((activity, index) => (
            <li key={activity.id}>
              {/* These divs create the timeline dots and lines */}
              <div className="changeNode"></div>
              {index !== activities.length - 1 && <div className="changeEdge"></div>}
              
              <span style={{ fontWeight: '700', color: '#172b4d' }}>{activity.author}</span>
              {' '}
              <span style={{ color: '#5e6c84' }}>{activity.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}