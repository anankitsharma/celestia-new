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
