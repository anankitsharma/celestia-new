// Web-compatible Journal Repository using localStorage
import { loadObject, saveObject } from '../storage';

const JOURNAL_KEY = 'celestia_journal_entries';

export const JournalRepository = {
  saveEntry: async (profileId, date, content, prompt = null, cosmicSnapshot = null, tags = null) => {
    const entries = (await loadObject(JOURNAL_KEY)) || {};
    entries[`${profileId}_${date}`] = {
      profileId, date, content, prompt, cosmicSnapshot, tags,
      createdAt: Date.now(),
    };
    await saveObject(JOURNAL_KEY, entries);
  },

  getEntry: async (profileId, date) => {
    const entries = (await loadObject(JOURNAL_KEY)) || {};
    return entries[`${profileId}_${date}`] || null;
  },

  getEntryCount: async (profileId) => {
    const entries = (await loadObject(JOURNAL_KEY)) || {};
    return Object.values(entries).filter(e => e.profileId === profileId).length;
  },

  getRecentEntries: async (profileId, limit = 10) => {
    const entries = (await loadObject(JOURNAL_KEY)) || {};
    return Object.values(entries)
      .filter(e => e.profileId === profileId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  deleteEntry: async (profileId, date) => {
    const entries = (await loadObject(JOURNAL_KEY)) || {};
    delete entries[`${profileId}_${date}`];
    await saveObject(JOURNAL_KEY, entries);
  },
};
