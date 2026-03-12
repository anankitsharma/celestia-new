import { getDB } from './client';
import * as Crypto from 'expo-crypto';

export const ChatRepository = {
    createSession: async (title, partnerId) => {
        const db = await getDB();
        const id = Crypto.randomUUID();
        const now = Date.now();
        await db.runAsync(
            `INSERT INTO chat_sessions (id, title, partner_id, created_at, last_updated) VALUES (?, ?, ?, ?, ?);`,
            [id, title, partnerId || null, now, now]
        );
        return { id, title, partnerId, createdAt: now, lastUpdated: now };
    },

    addMessage: async (sessionId, role, text) => {
        const db = await getDB();
        const id = Crypto.randomUUID();
        const now = Date.now();
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO chat_messages (id, session_id, role, text, created_at) VALUES (?, ?, ?, ?, ?);`,
                [id, sessionId, role, text, now]
            );
            await db.runAsync(`UPDATE chat_sessions SET last_updated = ? WHERE id = ?;`, [now, sessionId]);
        });
        return { id, role, text, timestamp: now };
    },

    getMessages: async (sessionId) => {
        const db = await getDB();
        const rows = await db.getAllAsync(
            `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC;`,
            [sessionId]
        );
        return rows.map(r => ({ id: r.id, role: r.role, text: r.text, timestamp: r.created_at }));
    },

    getSessions: async (limit = 20, offset = 0) => {
        const db = await getDB();
        const rows = await db.getAllAsync(
            `SELECT * FROM chat_sessions ORDER BY last_updated DESC LIMIT ? OFFSET ?;`,
            [limit, offset]
        );
        return rows.map(r => ({
            id: r.id, title: r.title, partnerId: r.partner_id,
            createdAt: r.created_at, lastUpdated: r.last_updated
        }));
    },

    getLatestSessionForPartner: async (partnerId) => {
        const db = await getDB();
        const row = await db.getFirstAsync(
            `SELECT * FROM chat_sessions WHERE partner_id = ? ORDER BY last_updated DESC LIMIT 1;`,
            [partnerId]
        );
        if (!row) return null;
        return { id: row.id, title: row.title, partnerId: row.partner_id, createdAt: row.created_at, lastUpdated: row.last_updated };
    },

    updateSessionTitle: async (sessionId, newTitle) => {
        const db = await getDB();
        await db.runAsync(`UPDATE chat_sessions SET title = ? WHERE id = ?;`, [newTitle, sessionId]);
    },

    deleteSession: async (sessionId) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM chat_messages WHERE session_id = ?;`, [sessionId]);
        await db.runAsync(`DELETE FROM chat_sessions WHERE id = ?;`, [sessionId]);
    },

    getUserMessageCountForDay: async (timestamp) => {
        const db = await getDB();
        const startOfDay = new Date(timestamp).setHours(0, 0, 0, 0);
        const endOfDay = new Date(timestamp).setHours(23, 59, 59, 999);
        const result = await db.getFirstAsync(
            `SELECT COUNT(*) as count FROM chat_messages WHERE role = 'user' AND created_at >= ? AND created_at <= ?;`,
            [startOfDay, endOfDay]
        );
        return result?.count || 0;
    }
};

