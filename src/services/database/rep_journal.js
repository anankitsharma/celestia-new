import { getDB } from './client';

const TABLE = 'journal_entries';

export const JournalRepository = {
  async getEntry(profileId, date) {
    const db = await getDB();
    return db.getFirstAsync(
      `SELECT * FROM ${TABLE} WHERE profile_id = ? AND date = ?;`,
      [profileId, date]
    );
  },

  async saveEntry(profileId, date, content, prompt, cosmicSnapshot = null, tags = null) {
    const db = await getDB();
    const existing = await this.getEntry(profileId, date);
    const now = Date.now();
    const snapshotStr = cosmicSnapshot ? JSON.stringify(cosmicSnapshot) : null;
    const tagsStr = tags ? JSON.stringify(tags) : null;

    if (existing) {
      await db.runAsync(
        `UPDATE ${TABLE} SET content = ?, prompt = ?, cosmic_snapshot = COALESCE(?, cosmic_snapshot), tags = COALESCE(?, tags) WHERE id = ?;`,
        [content, prompt || '', snapshotStr, tagsStr, existing.id]
      );
      return existing.id;
    }

    const id = `j_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      `INSERT INTO ${TABLE} (id, profile_id, date, content, prompt, cosmic_snapshot, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [id, profileId, date, content, prompt || '', snapshotStr, tagsStr, now]
    );
    return id;
  },

  async getAllEntries(profileId, limit = 100) {
    const db = await getDB();
    return db.getAllAsync(
      `SELECT * FROM ${TABLE} WHERE profile_id = ? ORDER BY date DESC LIMIT ?;`,
      [profileId, limit]
    );
  },

  async getEntriesForMonth(profileId, year, month) {
    const db = await getDB();
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    return db.getAllAsync(
      `SELECT * FROM ${TABLE} WHERE profile_id = ? AND date LIKE ? ORDER BY date ASC;`,
      [profileId, `${prefix}%`]
    );
  },

  async getEntryCount(profileId) {
    const db = await getDB();
    const row = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM ${TABLE} WHERE profile_id = ?;`,
      [profileId]
    );
    return row?.count || 0;
  },

  async getStreak(profileId) {
    const db = await getDB();
    const entries = await db.getAllAsync(
      `SELECT date FROM ${TABLE} WHERE profile_id = ? ORDER BY date DESC LIMIT 60;`,
      [profileId]
    );
    if (!entries.length) return 0;

    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today.toISOString().split('T')[0] + 'T12:00:00');

    for (let i = 0; i < 60; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (entries.find(e => e.date === dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    return streak;
  },
};
