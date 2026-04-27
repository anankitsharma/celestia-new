import { getDB } from './client';

const TABLE = 'achievements';

export const AchievementRepository = {
  async getAll() {
    const db = await getDB();
    return db.getAllAsync(`SELECT * FROM ${TABLE} ORDER BY unlocked_at DESC;`);
  },

  async getById(badgeId) {
    const db = await getDB();
    return db.getFirstAsync(`SELECT * FROM ${TABLE} WHERE badge_id = ?;`, [badgeId]);
  },

  async unlock(badgeId) {
    const db = await getDB();
    const existing = await this.getById(badgeId);
    if (existing) return null; // Already unlocked

    const id = `ach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db.runAsync(
      `INSERT INTO ${TABLE} (id, badge_id, unlocked_at, seen) VALUES (?, ?, ?, 0);`,
      [id, badgeId, Date.now()]
    );
    return { id, badge_id: badgeId, unlocked_at: Date.now(), seen: 0 };
  },

  async markSeen(badgeId) {
    const db = await getDB();
    await db.runAsync(`UPDATE ${TABLE} SET seen = 1 WHERE badge_id = ?;`, [badgeId]);
  },

  async getUnseen() {
    const db = await getDB();
    return db.getAllAsync(`SELECT * FROM ${TABLE} WHERE seen = 0 ORDER BY unlocked_at DESC;`);
  },

  async getCount() {
    const db = await getDB();
    const row = await db.getFirstAsync(`SELECT COUNT(*) as count FROM ${TABLE};`);
    return row?.count || 0;
  },
};
