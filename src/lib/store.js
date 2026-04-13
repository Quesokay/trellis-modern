import { Repo } from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import uuid from './uuid.js'
import seedData from './seed_data.js'

// 1. FORCE X-RAY VISION PERMANENTLY ON
if (typeof window !== 'undefined') {
  window.localStorage.debug = 'automerge-repo:*';
}

const peerName = localStorage.getItem("peerName") || `User-${Math.floor(Math.random() * 1000)}`;

// --- 1. THE HMR SINGLETON SAFETY VALVE ---
let activeRepo;

if (typeof globalThis !== 'undefined' && globalThis.__TRELLIS_REPO__) {
  console.log("♻️ [HMR] Reusing existing Automerge Engine. Disk lock protected.");
  activeRepo = globalThis.__TRELLIS_REPO__;
} else {
  // --- 2. FRESH BOOT SEQUENCE ---
  const myUniqueId = `client-${Math.random().toString(36).substring(2, 9)}`;
  
  const wsAdapter = new BrowserWebSocketClientAdapter("ws://127.0.0.1:3030");
  wsAdapter.on("ready", () => console.log("🔥 ADAPTER: Ready & Listening"));
  wsAdapter.on("error", (err) => console.error("🔥 ADAPTER ERROR:", err));
  wsAdapter.on("peer-candidate", ({ peerId }) => console.log("🔥 ADAPTER: Found peer candidate:", peerId));
  wsAdapter.on("peer-disconnected", ({ peerId }) => console.warn("🔥 ADAPTER: Lost peer:", peerId));

  activeRepo = new Repo({
    peerId: myUniqueId,
    storage: new IndexedDBStorageAdapter("trellis-local-db"),
    network: [ wsAdapter ], 
    sharePolicy: async (peerId) => true,
  });

  if (typeof globalThis !== 'undefined') {
    globalThis.__TRELLIS_REPO__ = activeRepo;
  }
  if (typeof window !== 'undefined') {
    window.TrellisRepo = activeRepo;
  }
}

export const repo = activeRepo;

// 5. Helper Functions
const randRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateDocId = () => {
  return repo.create().url;
};

export const humanize = (docId) => {
  if (!docId) return "New Board";
  let m = docId.match(/^([a-z]+)-([a-z]+)-([0-9]+)/)
  if (!m) return docId;
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${capitalize(m[1])} ${capitalize(m[2])}`
}

const logActivity = (doc, text, author = "Local User") => {
  if (!doc.activities) doc.activities = []
  doc.activities.unshift({
    id: crypto.randomUUID(),
    text,
    author,
    timestamp: Date.now()
  })
  if (doc.activities.length > 50) {
    doc.activities.pop()
  }
}

// 6. Document Mutators
export const mutators = {
  initializeDocument: (doc) => {
    let data = seedData()
    doc.cards = data.cards
    doc.lists = data.lists
    doc.comments = []
    doc.docId = generateDocId()
    doc.boardTitle = humanize(doc.docId)
  },

  updateBoardTitle: (doc, newTitle) => {
    doc.boardTitle = newTitle
  },

  createList: (doc, attributes) => {
    doc.lists.push({ ...attributes, id: uuid() })
  },

  deleteList: (doc, listId) => {
    doc.lists = doc.lists.filter(l => l.id !== listId)
    doc.cards = doc.cards.filter(c => c.listId !== listId)
  },

  createCard: (doc, { listId, title }) => {
    if (!doc.cards) doc.cards = []
    doc.cards.push({
      id: crypto.randomUUID(),
      listId,
      title,
      order: doc.cards.filter(c => c.listId === listId).length,
      archived: false, // NEW
      tags: []        // NEW
    })
    logActivity(doc, `created card "${title}"`)
  },

  // --- NEW CARD MECHANICS ---
  archiveCard: (doc, cardId) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      card.archived = !card.archived;
      logActivity(doc, `${card.archived ? 'archived' : 'restored'} card "${card.title}"`)
    }
  },

  addTag: (doc, cardId, tagText) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) {
      if (!card.tags) card.tags = []
      if (!card.tags.includes(tagText)) card.tags.push(tagText)
    }
  },

  removeTag: (doc, cardId, tagText) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card && card.tags) {
      card.tags = card.tags.filter(t => t !== tagText)
    }
  },

  addComment: (doc, { cardId, text, author = "Anonymous" }) => {
    if (!doc.comments) doc.comments = []
    doc.comments.push({
      id: crypto.randomUUID(),
      cardId,
      text,
      author,
      timestamp: Date.now()
    })
  },

  moveCard: (doc, cardId, destListId, destIndex) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (!card) return
    const destCards = doc.cards
      .filter(c => c.listId === destListId && c.id !== cardId)
      .sort((a, b) => a.order - b.order)

    let newOrder = 0
    if (destCards.length === 0) {
      newOrder = 1000 
    } else if (destIndex === 0) {
      newOrder = destCards[0].order / 2
    } else if (destIndex >= destCards.length) {
      newOrder = destCards[destCards.length - 1].order + 1000
    } else {
      const prevOrder = destCards[destIndex - 1].order
      const nextOrder = destCards[destIndex].order
      newOrder = (prevOrder + nextOrder) / 2
    }

    card.listId = destListId
    card.order = newOrder

    const destList = doc.lists.find(l => l.id === destListId)
    if (destList) {
      logActivity(doc, `moved "${card.title}" to ${destList.title}`)
    }
  },

  updateCardTitle: (doc, cardId, newTitle) => {
    const card = doc.cards.find(c => c.id === cardId)
    if (card) card.title = newTitle
  },

  deleteCard: (doc, cardId) => {
    const cardIndex = doc.cards.findIndex(c => c.id === cardId)
    if (cardIndex !== -1) doc.cards.splice(cardIndex, 1)
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
  }
}