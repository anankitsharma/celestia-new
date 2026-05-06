import { loadObject, saveObject, loadString, StorageKeys } from './storage';
import { generateSurpriseInsight } from './geminiService';

// One-shot surprise insights surfaced on specific days. Variable reward
// (Hook Model): unexpected content beats predictable content. Each user only
// ever sees a given insight once — dedup tracked locally.

// Days post-install on which the surprise can fire (between regular briefings).
// Spaced so the user never expects it.
const TRIGGER_DAYS = [4, 10, 17, 24];

// Roll probability when on a trigger day.
const ROLL_PROBABILITY = 0.30;

const STORE_KEY = StorageKeys.SURPRISE_INSIGHT_STATE; // { lastShownDay, shownIds: [{ id, kicker, insight, shownAt }] }

async function getState() {
  const raw = await loadObject(STORE_KEY).catch(() => null);
  return raw || { lastShownDay: null, shownIds: [] };
}

async function setState(state) {
  await saveObject(STORE_KEY, state);
}

function daysSinceInstallFromIso(firstUseIso) {
  if (!firstUseIso) return 0;
  const start = new Date(firstUseIso + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - start) / 86400000));
}

/**
 * Returns a surprise insight if today is a trigger day and the roll lands.
 * Caches the result so the same insight reappears within the same day if
 * the user reopens. Returns null when no insight should be shown.
 *
 * @param {object} userProfile  user profile with .id and .chart
 * @returns {Promise<{ id, kicker, insight } | null>}
 */
export async function maybeGetSurpriseInsight(userProfile) {
  if (!userProfile?.id || !userProfile?.chart) return null;
  try {
    const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
    const days = daysSinceInstallFromIso(firstUse);
    if (!TRIGGER_DAYS.includes(days)) return null;

    const state = await getState();

    // Already showed today's insight — return it again so it persists across re-mounts
    if (state.lastShownDay === days && state.shownIds.length > 0) {
      const last = state.shownIds[state.shownIds.length - 1];
      if (last?.dayShown === days) return last;
    }

    // Roll. Lose → no insight today. Stash the day so we don't re-roll on every mount.
    if (Math.random() >= ROLL_PROBABILITY) {
      state.lastShownDay = days; // mark day as "rolled" even if it lost
      await setState(state);
      return null;
    }

    // Generate
    const shownKickers = state.shownIds.map(s => s.kicker).filter(Boolean);
    const result = await generateSurpriseInsight(userProfile.chart, {
      daysSinceInstall: days,
      shownInsightIds: shownKickers,
    });
    if (!result?.insight) return null;

    const entry = {
      id: `${days}_${Date.now()}`,
      kicker: result.kicker || 'something to notice',
      insight: result.insight,
      shownAt: Date.now(),
      dayShown: days,
    };
    state.shownIds = [...state.shownIds, entry].slice(-20); // keep last 20
    state.lastShownDay = days;
    await setState(state);
    return entry;
  } catch {
    return null;
  }
}
