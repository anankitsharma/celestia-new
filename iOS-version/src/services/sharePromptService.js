import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_PROMPT_KEY = 'LAST_SHARE_PROMPT_TIME';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

let shownThisSession = false;

/**
 * Check if an auto-prompted share suggestion can be shown.
 * Manual share buttons (user-initiated) should NOT call this — they always work.
 */
export async function canShowSharePrompt() {
  if (shownThisSession) return false;
  try {
    const last = await AsyncStorage.getItem(LAST_PROMPT_KEY);
    if (last && Date.now() - parseInt(last, 10) < COOLDOWN_MS) return false;
  } catch {}
  return true;
}

/**
 * Record that an auto-prompted share was shown this session.
 */
export async function recordSharePromptShown() {
  shownThisSession = true;
  try {
    await AsyncStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
  } catch {}
}

/**
 * Reset the session flag (call on app restart / fresh mount if needed).
 */
export function resetSessionFlag() {
  shownThisSession = false;
}
