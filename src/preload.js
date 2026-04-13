const { contextBridge, ipcRenderer } = require('electron')

// We expose these functions to the React window via `window.electronAPI`
contextBridge.exposeInMainWorld('electronAPI', {
  // File System Operations (Replacing direct 'fs' imports)
  saveFile: (fileName, data) => ipcRenderer.invoke('save-file', fileName, data),
  readFile: (fileName) => ipcRenderer.invoke('read-file', fileName),
  fileExists: (fileName) => ipcRenderer.invoke('file-exists', fileName),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),

  // Listeners for Menu actions triggered in the Main Process
  onNewDocument: (callback) => ipcRenderer.on('new', callback),
  onForkDocument: (callback) => ipcRenderer.on('forkDocument', callback),
  onOpenFromClipboard: (callback) => ipcRenderer.on('openFromClipboard', (_event, url) => callback(url)),
  onShareToClipboard: (callback) => ipcRenderer.on('shareToClipboard', callback),

  // Sending data back to the Main Process clipboard
  shareToClipboardResult: (docId) => ipcRenderer.send('shareToClipboardResult', docId)
})