/* eslint-env browser */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/app.jsx'
import { RepoContext } from '@automerge/automerge-repo-react-hooks'
import { repo } from './lib/store.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RepoContext.Provider value={repo}>
      <App />
    </RepoContext.Provider>
  </React.StrictMode>
)