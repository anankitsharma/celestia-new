// Web-compatible Chat Repository using localStorage
import { loadObject, saveObject, StorageKeys } from '../storage';

const genId = () => `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const ChatRepository = {
  createSession: async (title, partnerId) => {
    const sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    const session = {
      id: genId(),
      title: title || 'New Chat',
      partnerId: partnerId || null,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
    sessions.unshift(session);
    await saveObject(StorageKeys.CHAT_SESSIONS, sessions);
    return session;
  },

  addMessage: async (sessionId, role, text) => {
    const messages = (await loadObject(StorageKeys.CHAT_MESSAGES)) || {};
    if (!messages[sessionId]) messages[sessionId] = [];
    const msg = { id: genId(), role, text, timestamp: Date.now() };
    messages[sessionId].push(msg);
    await saveObject(StorageKeys.CHAT_MESSAGES, messages);
    // Update session lastUpdated
    const sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    const s = sessions.find((s) => s.id === sessionId);
    if (s) { s.lastUpdated = Date.now(); await saveObject(StorageKeys.CHAT_SESSIONS, sessions); }
    return msg;
  },

  getMessages: async (sessionId) => {
    const messages = (await loadObject(StorageKeys.CHAT_MESSAGES)) || {};
    return messages[sessionId] || [];
  },

  getSessions: async (limit = 20, offset = 0) => {
    const sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated).slice(offset, offset + limit);
  },

  getLatestSessionForPartner: async (partnerId) => {
    const sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    return sessions.find((s) => s.partnerId === partnerId) || null;
  },

  updateSessionTitle: async (sessionId, newTitle) => {
    const sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    const s = sessions.find((s) => s.id === sessionId);
    if (s) { s.title = newTitle; await saveObject(StorageKeys.CHAT_SESSIONS, sessions); }
  },

  deleteSession: async (sessionId) => {
    let sessions = (await loadObject(StorageKeys.CHAT_SESSIONS)) || [];
    sessions = sessions.filter((s) => s.id !== sessionId);
    await saveObject(StorageKeys.CHAT_SESSIONS, sessions);
    const messages = (await loadObject(StorageKeys.CHAT_MESSAGES)) || {};
    delete messages[sessionId];
    await saveObject(StorageKeys.CHAT_MESSAGES, messages);
  },

  getUserMessageCountForDay: async (timestamp) => {
    const messages = (await loadObject(StorageKeys.CHAT_MESSAGES)) || {};
    const dayStart = new Date(timestamp).setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 86400000;
    let count = 0;
    Object.values(messages).forEach((arr) => {
      arr.forEach((m) => {
        if (m.role === 'user' && m.timestamp >= dayStart && m.timestamp < dayEnd) count++;
      });
    });
    return count;
  },
};
