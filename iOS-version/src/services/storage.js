import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
    USER_PROFILE: 'astra_user_profile',
    ONBOARDING_COMPLETED: 'astra_onboarding_completed',
    SETTINGS: 'astra_settings',
    REPORTS: 'astra_reports_cache_v2',
    PARTNER_PROFILES: 'astra_partner_profiles',
    DAILY_CHAT_USAGE: 'astra_daily_chat_usage',
    ACHIEVEMENT_COUNTERS: 'celestia_achievement_counters',
    NOTIFICATION_SETTINGS: 'celestia_notification_settings',
    NOTIFICATION_HISTORY: 'celestia_notification_history',
    NOTIFICATION_ASKED: 'celestia_notification_asked',
    SESSION_COUNT: 'celestia_session_count',
    AI_NOTIFICATION_LINES: 'celestia_ai_notification_lines',
    UNLOCK_SCHEDULE: 'celestia_unlock_schedule',
    FIRST_USE_DATE: 'celestia_first_use_date',
    MOON_RITUALS: 'celestia_moon_rituals',
};

export const loadString = async (key) => {
    try { return await AsyncStorage.getItem(key); }
    catch (e) { return null; }
};

export const saveString = async (key, value) => {
    try { await AsyncStorage.setItem(key, value); }
    catch (e) { console.error(e); }
};

export const loadBoolean = async (key) => {
    try { const val = await AsyncStorage.getItem(key); return val === 'true'; }
    catch (e) { return false; }
};

export const saveBoolean = async (key, value) => {
    try { await AsyncStorage.setItem(key, String(value)); }
    catch (e) { console.error(e); }
};

export const loadObject = async (key) => {
    try {
        const json = await AsyncStorage.getItem(key);
        if (json) return JSON.parse(json);
    } catch (e) { console.error('Failed to parse storage object', e); }
    return null;
};

export const saveObject = async (key, value) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error(e); }
};

export const remove = async (key) => {
    try { await AsyncStorage.removeItem(key); }
    catch (e) { console.error(e); }
};

// ── App reset (used by Profile → Reset App Data) ──────────────────────
// Wipes the device to a fresh-install state. Required by Apple Guideline
// 5.1.1(v) for non-authed apps.
//
// Mirrors the proven sequence in services/database/demoData.js — without
// the seed step. Order matters:
//   1. Cancel scheduled notifications (live in the OS notification queue;
//      they survive AsyncStorage.clear() AND a SQLite wipe).
//   2. Clear AsyncStorage so any in-flight reader sees an empty slate.
//   3. SQLite wipe under PRAGMA foreign_keys = OFF, using DELETE FROM rather
//      than DROP TABLE so concurrent reads don't see "no such table" mid-
//      reset and so the cached `getDB()` connection's schema info stays
//      valid. Tables are emptied in child-before-parent order.
//   4. Re-init schema so any tables we couldn't reach are recreated.
//   5. Re-enable foreign keys so normal app behavior resumes.
//
// React-tree state (UserProfileContext.userProfile, etc.) is NOT cleared
// here — the caller must invoke reloadProfiles() / setUserProfile(null)
// from inside the React tree after this resolves. Otherwise the user can
// briefly see their old name/avatar between the wipe and the next mount.
const TABLES_TO_WIPE = [
    'chat_messages',
    'chat_sessions',
    'forecasts',
    'reports',
    'journal_entries',
    'charts',
    'profiles',
    'achievements',
    'user_xp',
    'user_streaks',
];

export const resetAllAppData = async () => {
    // 1. Notifications.
    try {
        const { cancelAllNotifications } = await import('./notificationService');
        await cancelAllNotifications();
    } catch (e) {
        console.warn('[reset] cancelAllNotifications failed (non-fatal):', e?.message);
    }

    // 2. AsyncStorage.
    try { await AsyncStorage.clear(); }
    catch (e) { console.warn('[reset] AsyncStorage clear failed:', e?.message); }

    // 3 + 4. SQLite under FK off.
    try {
        const { getDB } = await import('./database/client');
        const { initSchema } = await import('./database/schema');
        const db = await getDB();
        try { await db.runAsync('PRAGMA foreign_keys = OFF;'); } catch {}

        try {
            await db.withTransactionAsync(async () => {
                for (const t of TABLES_TO_WIPE) {
                    try {
                        await db.runAsync(`DELETE FROM ${t};`);
                    } catch (e) {
                        // Table may not exist yet (fresh install before
                        // initSchema ran). Skip and continue — initSchema
                        // below will (re)create it.
                        console.warn(`[reset] DELETE FROM ${t} skipped:`, e?.message);
                    }
                }
            });
        } catch (e) {
            console.warn('[reset] SQLite wipe transaction failed:', e?.message);
        }

        // Recreate any tables that didn't exist; safe no-op if all already present.
        try { await initSchema(); }
        catch (e) { console.warn('[reset] initSchema after wipe failed:', e?.message); }

        // 5. Re-enable foreign keys.
        try { await db.runAsync('PRAGMA foreign_keys = ON;'); } catch {}
    } catch (e) {
        console.warn('[reset] SQLite reset failed:', e?.message);
    }
};
