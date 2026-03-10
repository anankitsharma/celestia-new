import { getDB } from './client';

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
        await db.runAsync(
            `INSERT OR REPLACE INTO reports (id, profile_id, type, subtype, content, created_at)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [id, profileId, type, subtype, JSON.stringify(content), Date.now()]
        );
        console.log(`[SQLite] Saved Report: ${id}`);
    },

    deleteReportsForProfile: async (profileId) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM reports WHERE profile_id = ?;`, [profileId]);
    },

    deleteByType: async (type) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM reports WHERE type = ?;`, [type]);
    }
};
