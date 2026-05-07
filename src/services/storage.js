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
    FREEZE_OFFER_SHOWN: 'celestia_freeze_offer_shown',
    WAKE_TIME_BACKFILL_PROMPTED: 'celestia_wake_time_backfill_prompted',
    FIRST_WEEK_RECAP: 'celestia_first_week_recap', // cached recap object
    SURPRISE_INSIGHT_STATE: 'celestia_surprise_insight_state',
    NPS_LAST_SUBMITTED: 'celestia_nps_last_submitted', // { score: 1-4, at: timestamp }
    AT_RISK_DISMISSED_AT: 'celestia_at_risk_dismissed_at',
    STREAK_RESTORE_OFFER_LAST: 'celestia_streak_restore_offer_last',
    BADGE_RESCUE_LAST_PUSHED: 'celestia_badge_rescue_last_pushed', // { badgeId, at }
    FIRST_REVEAL_STATEMENT: 'celestia_first_reveal_statement',
    NOTIFICATION_REASKED_COUNT: 'celestia_notification_reasked_count',
    MOON_CYCLE_PATTERN: 'celestia_moon_cycle_pattern',
    PRO_FEATURE_NUDGED_AT: 'celestia_pro_feature_nudged_at', // { [featureId]: timestamp }
    PRO_WEEK1_RECAP: 'celestia_pro_week1_recap', // cached recap object
    PRO_WEEK1_RECAP_SHOWN_AT: 'celestia_pro_week1_recap_shown_at',
    D30_REVEAL_CALLBACK_SHOWN: 'celestia_d30_reveal_callback_shown', // bool
    YEAR_IN_REVIEW_SHOWN_AT: 'celestia_year_in_review_shown_at', // ISO date string per renewal cycle
    EXPERIMENTAL_TODAY_V2: 'celestia_experimental_today_v2', // bool — opt-in to the redesigned Today tab (V2 reel)
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
