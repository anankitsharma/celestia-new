import { getDB } from './client';
import { isForeignKeyError } from './sqliteHelpers';

export const ReportRepository = {
    getReport: async (id) => {
        const db = await getDB();
        const row = await db.getFirstAsync(`SELECT content FROM reports WHERE id = ?;`, [id]);
        if (!row) return null;
        console.log(`[SQLite] Report Hit: ${id}`);
        return JSON.parse(row.content);
    },

    saveReport: async (id, profileId, type, content, subtype = null) => {
        const db = await getDB();
        try {
            await db.runAsync(
                `INSERT OR REPLACE INTO reports (id, profile_id, type, subtype, content, created_at)
                 VALUES (?, ?, ?, ?, ?, ?);`,
                [id, profileId, type, subtype, JSON.stringify(content), Date.now()]
            );
            console.log(`[SQLite] Saved Report: ${id}`);
        } catch (e) {
            // V1.2 — Swallow FK errors. They happen when the referenced profile
            // (user or partner) was deleted while a Gemini call was in flight:
            // the AI result has already been returned to the caller, and we'd
            // rather drop the cache write silently than throw and force the
            // caller's withRetry wrapper to return the fallback. Other errors
            // (disk full, schema corruption) still surface.
            if (isForeignKeyError(e)) {
                console.warn(`[SQLite] saveReport FK skipped (profile ${profileId} deleted): ${id}`);
                return;
            }
            throw e;
        }
    },

    deleteReportsForProfile: async (profileId) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM reports WHERE profile_id = ?;`, [profileId]);
    },

    deleteByType: async (type) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM reports WHERE type = ?;`, [type]);
    },

    getReportsForProfile: async (profileId) => {
        const db = await getDB();
        const rows = await db.getAllAsync(
            `SELECT id, type, subtype, created_at FROM reports WHERE profile_id = ? ORDER BY created_at DESC;`,
            [profileId]
        );
        return rows || [];
    }
};
