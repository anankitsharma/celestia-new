import { getDB } from './client';

// Helper: check if a column exists on a table
const hasColumn = async (db, table, column) => {
    const rows = await db.getAllAsync(`PRAGMA table_info(${table});`);
    return rows.some(r => r.name === column);
};

// Add column only if it doesn't already exist
const addColumnIfMissing = async (db, table, column, definition) => {
    if (!(await hasColumn(db, table, column))) {
        await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
        console.log(`[SQLite] Added column ${table}.${column}`);
    }
};

export const initSchema = async () => {
    const db = await getDB();
    try {
        // ── Core tables ─────────────────────────────
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                gender TEXT,
                birth_date TEXT NOT NULL,
                birth_time TEXT NOT NULL,
                lat REAL,
                lng REAL,
                location_name TEXT,
                is_time_unknown INTEGER DEFAULT 0,
                created_at INTEGER
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS charts (
                id TEXT PRIMARY KEY,
                planets JSON NOT NULL,
                aspects JSON NOT NULL,
                houses JSON NOT NULL,
                elements JSON,
                modalities JSON,
                calculated_at INTEGER,
                FOREIGN KEY(id) REFERENCES profiles(id) ON DELETE CASCADE
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                type TEXT NOT NULL,
                subtype TEXT,
                content JSON NOT NULL,
                created_at INTEGER,
                FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS forecasts (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                type TEXT NOT NULL,
                date_label TEXT NOT NULL,
                content JSON NOT NULL,
                created_at INTEGER,
                expires_at INTEGER,
                FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE
            );
        `);

        await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_reports_profile_id ON reports(profile_id);
            CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
            CREATE INDEX IF NOT EXISTS idx_forecasts_profile_id ON forecasts(profile_id);
            CREATE INDEX IF NOT EXISTS idx_forecasts_type ON forecasts(type);
            CREATE INDEX IF NOT EXISTS idx_forecasts_expires_at ON forecasts(expires_at);

            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                partner_id TEXT,
                created_at INTEGER,
                last_updated INTEGER,
                FOREIGN KEY(partner_id) REFERENCES profiles(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at INTEGER,
                FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_updated ON chat_sessions(last_updated);
            CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
        `);

        // ── Engagement tables ──────────────────────
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_streaks (
                id TEXT PRIMARY KEY,
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                last_check_in TEXT,
                streak_freezes_remaining INTEGER DEFAULT 1,
                total_check_ins INTEGER DEFAULT 0,
                last_comeback_bonus INTEGER DEFAULT 0,
                created_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS achievements (
                id TEXT PRIMARY KEY,
                badge_id TEXT NOT NULL,
                unlocked_at INTEGER,
                seen INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS user_xp (
                id TEXT PRIMARY KEY,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                last_action TEXT,
                last_action_at INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_achievements_badge_id ON achievements(badge_id);

            CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                profile_id TEXT NOT NULL,
                date TEXT NOT NULL,
                content TEXT NOT NULL,
                prompt TEXT,
                created_at INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_journal_profile_date ON journal_entries(profile_id, date);
        `);

        // ── Migrations for existing databases ───────
        await addColumnIfMissing(db, 'profiles', 'is_time_unknown', 'INTEGER DEFAULT 0');
        await addColumnIfMissing(db, 'charts', 'elements', 'JSON');
        await addColumnIfMissing(db, 'charts', 'modalities', 'JSON');

        console.log('[SQLite] Schema initialized successfully.');
    } catch (e) {
        console.error('[SQLite] Schema initialization failed:', e);
        throw e;
    }
};
