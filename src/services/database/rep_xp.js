import { getDB } from './client';

const TABLE = 'user_xp';

export const XPRepository = {
  async getXP(profileId) {
    const db = await getDB();
    return db.getFirstAsync(`SELECT * FROM ${TABLE} WHERE id = ?;`, [profileId]);
  },

  async awardXP(profileId, amount, action) {
    const db = await getDB();
    const now = Date.now();
    const existing = await this.getXP(profileId);

    if (!existing) {
      await db.runAsync(
        `INSERT INTO ${TABLE} (id, total_xp, level, last_action, last_action_at) VALUES (?, ?, 1, ?, ?);`,
        [profileId, amount, action, now]
      );
      return { total_xp: amount, level: 1, leveledUp: false };
    }

    const newTotal = existing.total_xp + amount;
    const oldLevel = existing.level;
    const newLevel = calculateLevel(newTotal);

    await db.runAsync(
      `UPDATE ${TABLE} SET total_xp = ?, level = ?, last_action = ?, last_action_at = ? WHERE id = ?;`,
      [newTotal, newLevel, action, now, profileId]
    );

    return { total_xp: newTotal, level: newLevel, leveledUp: newLevel > oldLevel };
  },
  async upsertXP(profileId, data) {
    const db = await getDB();
    const existing = await this.getXP(profileId);
    if (existing) {
      await db.runAsync(
        `UPDATE ${TABLE} SET total_xp = ?, level = ?, last_action = ? WHERE id = ?;`,
        [data.total_xp, data.level || calculateLevel(data.total_xp), data.last_action || '', profileId]
      );
    } else {
      await db.runAsync(
        `INSERT INTO ${TABLE} (id, total_xp, level, last_action, last_action_at) VALUES (?, ?, ?, ?, ?);`,
        [profileId, data.total_xp, data.level || calculateLevel(data.total_xp), data.last_action || '', Date.now()]
      );
    }
  },
};

function calculateLevel(xp) {
  if (xp >= 10000) return 5;
  if (xp >= 2000) return 4;
  if (xp >= 500) return 3;
  if (xp >= 100) return 2;
  return 1;
}
