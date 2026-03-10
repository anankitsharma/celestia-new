import { getDB } from './client';

const TABLE = 'user_streaks';

export const StreakRepository = {
  async getStreak(profileId) {
    const db = await getDB();
    return db.getFirstAsync(`SELECT * FROM ${TABLE} WHERE id = ?;`, [profileId]);
  },

  async recordCheckIn(profileId) {
    const db = await getDB();
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = await this.getStreak(profileId);

    if (!existing) {
      await db.runAsync(
        `INSERT INTO ${TABLE} (id, current_streak, longest_streak, last_check_in, streak_freezes_remaining, total_check_ins, last_comeback_bonus, created_at)
         VALUES (?, 1, 1, ?, 1, 1, 0, ?);`,
        [profileId, todayStr, now]
      );
      return { current_streak: 1, longest_streak: 1, last_check_in: todayStr, total_check_ins: 1, streak_freezes_remaining: 1, isNew: true, milestoneHit: null };
    }

    // Already checked in today
    if (existing.last_check_in === todayStr) {
      return { ...existing, isNew: false, milestoneHit: null };
    }

    const lastDate = new Date(existing.last_check_in + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    let newStreak = existing.current_streak;
    let freezesLeft = existing.streak_freezes_remaining;
    let streakBroken = false;

    if (diffDays === 1) {
      // Consecutive day
      newStreak += 1;
    } else if (diffDays === 2 && freezesLeft > 0) {
      // Missed 1 day but have a freeze
      newStreak += 1;
      freezesLeft -= 1;
    } else {
      // Streak broken
      newStreak = 1;
      streakBroken = true;
    }

    // Reset freeze weekly (every 7 streak days)
    if (newStreak > 0 && newStreak % 7 === 0 && freezesLeft < 1) {
      freezesLeft = 1;
    }

    const newLongest = Math.max(existing.longest_streak, newStreak);
    const newTotal = existing.total_check_ins + 1;

    await db.runAsync(
      `UPDATE ${TABLE} SET current_streak = ?, longest_streak = ?, last_check_in = ?, streak_freezes_remaining = ?, total_check_ins = ? WHERE id = ?;`,
      [newStreak, newLongest, todayStr, freezesLeft, newTotal, profileId]
    );

    // Check milestones
    const MILESTONES = [3, 7, 14, 30, 50, 100, 365];
    const milestoneHit = MILESTONES.find(m => newStreak === m) || null;

    return {
      current_streak: newStreak,
      longest_streak: newLongest,
      last_check_in: todayStr,
      total_check_ins: newTotal,
      streak_freezes_remaining: freezesLeft,
      streakBroken,
      isNew: true,
      milestoneHit,
      daysAbsent: diffDays,
    };
  },

  async upsertStreak(profileId, data) {
    const db = await getDB();
    const existing = await this.getStreak(profileId);
    if (existing) {
      await db.runAsync(
        `UPDATE ${TABLE} SET current_streak = ?, longest_streak = ?, last_check_in = ?, streak_freezes_remaining = ?, total_check_ins = ? WHERE id = ?;`,
        [data.current_streak, data.longest_streak, data.last_check_in, data.streak_freezes_remaining || 1, data.total_check_ins || 0, profileId]
      );
    } else {
      await db.runAsync(
        `INSERT INTO ${TABLE} (id, current_streak, longest_streak, last_check_in, streak_freezes_remaining, total_check_ins, last_comeback_bonus, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?);`,
        [profileId, data.current_streak, data.longest_streak, data.last_check_in, data.streak_freezes_remaining || 1, data.total_check_ins || 0, Date.now()]
      );
    }
  },

  async useFreeze(profileId) {
    const db = await getDB();
    const streak = await this.getStreak(profileId);
    if (!streak || streak.streak_freezes_remaining <= 0) return false;
    await db.runAsync(
      `UPDATE ${TABLE} SET streak_freezes_remaining = streak_freezes_remaining - 1 WHERE id = ?;`,
      [profileId]
    );
    return true;
  },
};
