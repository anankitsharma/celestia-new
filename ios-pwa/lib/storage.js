// localStorage wrapper — replaces AsyncStorage from React Native
// All methods are sync on web but keep async signatures for compatibility

export const StorageKeys = {
  USER_PROFILE: 'celestia_user_profile',
  ONBOARDING_COMPLETED: 'celestia_onboarding_completed',
  SETTINGS: 'celestia_settings',
  REPORTS: 'celestia_reports_cache_v2',
  PARTNER_PROFILES: 'celestia_partner_profiles',
  DAILY_CHAT_USAGE: 'celestia_daily_chat_usage',
  FORECASTS: 'celestia_forecasts',
  CHAT_SESSIONS: 'celestia_chat_sessions',
  CHAT_MESSAGES: 'celestia_chat_messages',
  SESSION_COUNT: 'celestia_session_count',
  FIRST_USE_DATE: 'celestia_first_use_date',
  JOURNAL_ENTRIES: 'celestia_journal_entries',
  STREAKS: 'celestia_streaks',
  XP: 'celestia_xp',
  ACHIEVEMENTS: 'celestia_achievements',
};

function isAvailable() {
  try {
    const t = '__test__';
    localStorage.setItem(t, t);
    localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

export const loadString = async (key) => {
  try {
    if (!isAvailable()) return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const saveString = async (key, value) => {
  try {
    if (isAvailable()) localStorage.setItem(key, value);
  } catch (e) {
    console.error('[Storage]', e);
  }
};

export const loadBoolean = async (key) => {
  try {
    if (!isAvailable()) return false;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
};

export const saveBoolean = async (key, value) => {
  try {
    if (isAvailable()) localStorage.setItem(key, String(value));
  } catch (e) {
    console.error('[Storage]', e);
  }
};

export const loadObject = async (key) => {
  try {
    if (!isAvailable()) return null;
    const json = localStorage.getItem(key);
    if (json) return JSON.parse(json);
  } catch (e) {
    console.error('[Storage] parse error', e);
  }
  return null;
};

export const saveObject = async (key, value) => {
  try {
    if (isAvailable()) localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[Storage]', e);
  }
};

export const remove = async (key) => {
  try {
    if (isAvailable()) localStorage.removeItem(key);
  } catch (e) {
    console.error('[Storage]', e);
  }
};
