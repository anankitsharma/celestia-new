import * as SQLite from 'expo-sqlite';

let dbInstance = null;
let dbPromise = null;

export const getDB = async () => {
    if (dbInstance) return dbInstance;
    if (!dbPromise) {
        dbPromise = (async () => {
            const db = await SQLite.openDatabaseAsync('celestia_v1.db');
            await db.execAsync('PRAGMA foreign_keys = ON;');
            dbInstance = db;
            return db;
        })();
    }
    return dbPromise;
};

export const closeDB = async () => {
    if (dbInstance) {
        await dbInstance.closeAsync();
        dbInstance = null;
        dbPromise = null;
    }
};
