import { getDB } from './client';
import { isForeignKeyError } from './sqliteHelpers';

export const ForecastRepository = {
    getForecast: async (key) => {
        const db = await getDB();
        const now = Date.now();
        const row = await db.getFirstAsync(`SELECT content, expires_at FROM forecasts WHERE id = ?;`, [key]);
        if (!row) return null;
        if (row.expires_at && now > row.expires_at) {
            console.log(`[SQLite] Cache Expired for ${key}`);
            await db.runAsync(`DELETE FROM forecasts WHERE id = ?;`, [key]);
            return null;
        }
        console.log(`[SQLite] Cache Hit for ${key}`);
        return JSON.parse(row.content);
    },

    saveForecast: async (key, profileId, type, dateLabel, content, expiresAt) => {
        const db = await getDB();
        try {
            await db.runAsync(
                `INSERT OR REPLACE INTO forecasts (id, profile_id, type, date_label, content, created_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [key, profileId, type, dateLabel, JSON.stringify(content), Date.now(), expiresAt]
            );
            console.log(`[SQLite] Saved forecast: ${key}`);
        } catch (e) {
            // V1.2 — Swallow FK errors. Same rationale as ReportRepository.saveReport:
            // a Gemini call resolved after the referenced profile was deleted (e.g.
            // user removed a partner from Connections mid-call). The AI result has
            // already been returned to the caller; dropping the cache write is fine.
            if (isForeignKeyError(e)) {
                console.warn(`[SQLite] saveForecast FK skipped (profile ${profileId} deleted): ${key}`);
                return;
            }
            throw e;
        }
    },

    pruneExpired: async () => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM forecasts WHERE expires_at < ?;`, [Date.now()]);
    },

    deleteByType: async (type, useLike = false) => {
        const db = await getDB();
        const op = useLike ? 'LIKE' : '=';
        await db.execAsync('PRAGMA foreign_keys = OFF;');
        try {
            await db.runAsync(`DELETE FROM forecasts WHERE type ${op} ?;`, [type]);
        } finally {
            await db.execAsync('PRAGMA foreign_keys = ON;');
        }
    },

    clearAll: async () => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM forecasts;`);
    },

    getRecentForecasts: async (profileId, limit = 3) => {
        const db = await getDB();
        return await db.getAllAsync(
            'SELECT * FROM forecasts WHERE id LIKE ? ORDER BY created_at DESC LIMIT ?',
            [`${profileId}_%`, limit]
        );
    },
};
