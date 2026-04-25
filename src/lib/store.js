import { Repo } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import uuid from './uuid.js';
import seedData from './seed_data.js';

// 1. DEBUG LOGGING
if (typeof window !== 'undefined') {
  window.localStorage.debug = 'automerge-repo:*';
}

const peerName = localStorage.getItem("peerName") || `User-${Math.floor(Math.random() * 1000)}`;
const peerColor = localStorage.getItem("peerColor") || `#${Math.floor(Math.random()*16777215).toString(16)}`;

if (typeof window !== 'undefined') {
  if (!localStorage.getItem("peerName")) localStorage.setItem("peerName", peerName);
  if (!localStorage.getItem("peerColor")) localStorage.setItem("peerColor", peerColor);
}

// 2. THE HMR SINGLETON SAFETY VALVE
// Prevents multiple IndexedDB connections during Vite hot-reloads
let activeRepo;

if (typeof globalThis !== 'undefined' && globalThis.__TRELLIS_REPO__) {
  console.log("♻️ [HMR] Reusing existing Automerge Engine. Disk lock protected.");
  activeRepo = globalThis.__TRELLIS_REPO__;
} else {
  const myUniqueId = `client-${Math.random().toString(36).substring(2, 9)}`;
  const wsAdapter = new BrowserWebSocketClientAdapter("ws://127.0.0.1:3030");

  // 🚨 ADD THIS: The local tab-to-tab network adapter
  const broadcastAdapter = new BroadcastChannelNetworkAdapter();
  
  // Wiretap the adapter for terminal visibility
  wsAdapter.on("ready", () => console.log("🔥 ADAPTER: Ready & Listening"));
  wsAdapter.on("peer-candidate", ({ peerId }) => console.log("🔥 ADAPTER: Found peer:", peerId));

  activeRepo = new Repo({
    peerId: myUniqueId,
    // 🚨 ADDED: Broadcast our name and color to other peers on the network
    peerMetadata: { name: peerName, color: peerColor }, 
    storage: new IndexedDBStorageAdapter("trellis-local-db"),
    // 🚨 UPDATE THIS: Add the broadcastAdapter to the network array
    network: [ wsAdapter, broadcastAdapter ],
    sharePolicy: async (peerId) => true,
  });

  if (typeof globalThis !== 'undefined') globalThis.__TRELLIS_REPO__ = activeRepo;
  if (typeof window !== 'undefined') window.TrellisRepo = activeRepo;
}

export const repo = activeRepo;

// 3. HELPER FUNCTIONS
export const generateDocId = () => repo.create().url;

export const humanize = (docId) => {
  if (!docId) return "New Board";
  let m = docId.match(/^([a-z]+)-([a-z]+)-([0-9]+)/)
  if (!m) return docId;
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(m[1])} ${capitalize(m[2])}`
}

const logActivity = (doc, text, author = peerName) => {
  if (!doc.activities) doc.activities = []
  doc.activities.unshift({
    id: crypto.randomUUID(),
    text,
    author,
    timestamp: Date.now()
  })
  // Keep history manageable (last 50 items)
  if (doc.activities.length > 50) doc.activities.pop()
}

// 4. DOCUMENT MUTATORS (CRDT Logic)
export const mutators = {
  initializeDocument: (doc) => {
    let data = seedData()
    doc.cards = data.cards || []
    doc.lists = data.lists || []
    doc.comments = []
    doc.docId = window.location.hash.replace(/^#/, '') 
    doc.boardTitle = humanize(doc.docId)
    logActivity(doc, "initialized the board")
  },

  updateBoardTitle: (doc, newTitle) => {
    const oldTitle = doc.boardTitle;
    doc.boardTitle = newTitle;
    // Log change only if it's a substantial rename
    if (newTitle !== oldTitle && newTitle.length > 2) {
       logActivity(doc, `renamed board to "${newTitle}"`)
    }
  },

  createList: (doc, attributes) => {
    const newList = { ...attributes, id: uuid() };
    doc.lists.push(newList)
    logActivity(doc, `created list "${attributes.title}"`)
  },

  deleteList: (doc, listId) => {
    const list = doc.lists.find(l => l.id === listId);
    doc.lists = doc.lists.filter(l => l.id !== listId)
    doc.cards = doc.cards.filter(c => c.listId !== listId)
    logActivity(doc, `deleted list "${list?.title || 'Unknown'}"`)
  },

  createCard: (doc, { listId, title }) => {
    if (!doc.cards) doc.cards = []
    const newCard = {
      id: crypto.randomUUID(),
      listId,
      title,
      order: doc.cards.filter(c => c.listId === listId).length,
      archived: false,
      tags: []
    };
    doc.cards.push(newCard)
    logActivity(doc, `created card "${title}"`)
  },

  archiveCard: (doc, cardId) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      card.archived = true;
      logActivity(doc, `archived card "${card.title}"`)
    }
  },

  restoreCard: (doc, cardId) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      card.archived = false;
      logActivity(doc, `restored card "${card.title}"`)
    }
  },

  addTag: (doc, cardId, tagText) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      if (!card.tags) card.tags = []
      if (!card.tags.includes(tagText)) {
        card.tags.push(tagText)
        logActivity(doc, `added tag "${tagText}" to "${card.title}"`)
      }
    }
  },

  removeTag: (doc, cardId, tagText) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card && card.tags) {
      card.tags = card.tags.filter(t => t !== tagText)
      logActivity(doc, `removed tag "${tagText}" from "${card.title}"`)
    }
  },

  moveCard: (doc, cardId, destListId, destIndex) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (!card) return
    const oldList = doc.lists.find(l => l.id === card.listId)
    const newList = doc.lists.find(l => l.id === destListId)
    
    const destCards = doc.cards
      .filter(c => c.listId === destListId && c.id !== cardId)
      .sort((a, b) => a.order - b.order)

    // Fractional Indexing for smooth sorting
    let newOrder = 0
    if (destCards.length === 0) newOrder = 1000 
    else if (destIndex === 0) newOrder = destCards[0].order / 2
    else if (destIndex >= destCards.length) newOrder = destCards[destCards.length - 1].order + 1000
    else newOrder = (destCards[destIndex - 1].order + destCards[destIndex].order) / 2

    card.listId = destListId
    card.order = newOrder

    if (oldList?.id !== newList?.id) {
      logActivity(doc, `moved "${card.title}" from ${oldList?.title} to ${newList?.title}`)
    }
  },

  updateCardTitle: (doc, cardId, newTitle) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      card.title = newTitle;
    }
  },

  deleteCard: (doc, cardId) => {
    const card = doc.cards.find(c => c.id === cardId)
    const cardIndex = doc.cards.findIndex(c => c.id === cardId)
    if (cardIndex !== -1) {
      logActivity(doc, `permanently deleted card "${card?.title}"`)
      doc.cards.splice(cardIndex, 1)
    }
  },

  createComment: (doc, cardId, body) => {
    if (!doc.comments) doc.comments = []
    doc.comments.push({
      id: uuid(),
      cardId: cardId,
      body: body,
      author: peerName,
      createdAt: new Date().toJSON()
    })
    logActivity(doc, `commented on card`)
  }
}