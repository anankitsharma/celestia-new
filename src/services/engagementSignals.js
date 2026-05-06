import { loadString, saveString, loadObject, saveObject, StorageKeys } from './storage';
import { JournalRepository } from './database/rep_journal';

// Lightweight engagement-signal helpers. Used by event-based pushes and the
// weekly journal-pattern detector. No backend — all local.

const LAST_ACTIVE_KEY = 'celestia_last_active_at';
const PENDING_PUSHES_KEY = 'celestia_pending_event_pushes'; // [{ id, type, scheduledAt }]

// ── Active-timestamp tracking ──────────────────────────────────

export async function markActive() {
  try { await saveString(LAST_ACTIVE_KEY, String(Date.now())); } catch {}
}

export async function getLastActiveAt() {
  try {
    const v = await loadString(LAST_ACTIVE_KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

// ── Pending event-push tracking ────────────────────────────────
// We track scheduled event-pushes by id so the next-app-open lifecycle
// can cancel them when the user returned before the push fires.

export async function recordPendingPush(notifId, meta = {}) {
  try {
    const list = (await loadObject(PENDING_PUSHES_KEY)) || [];
    list.push({ id: notifId, scheduledAt: Date.now(), ...meta });
    // Keep last 50 to prevent unbounded growth
    await saveObject(PENDING_PUSHES_KEY, list.slice(-50));
  } catch {}
}

export async function listPendingPushes() {
  try { return (await loadObject(PENDING_PUSHES_KEY)) || []; } catch { return []; }
}

export async function clearPendingPushOfType(type) {
  try {
    const list = (await loadObject(PENDING_PUSHES_KEY)) || [];
    const remaining = list.filter(p => p.type !== type);
    await saveObject(PENDING_PUSHES_KEY, remaining);
    return list.filter(p => p.type === type).map(p => p.id);
  } catch { return []; }
}

// ── Journal theme detection ────────────────────────────────────
// Counts theme keywords across recent entries. Used by P2.3d weekly push.

const THEME_KEYWORDS = {
  love: ['love', 'partner', 'boyfriend', 'girlfriend', 'wife', 'husband', 'crush', 'date', 'dating', 'relationship'],
  work: ['work', 'job', 'boss', 'meeting', 'project', 'career', 'office', 'colleague', 'deadline'],
  family: ['family', 'mom', 'mother', 'dad', 'father', 'sister', 'brother', 'parent', 'sibling'],
  body: ['body', 'sleep', 'tired', 'energy', 'sick', 'workout', 'exercise', 'food', 'eating'],
  money: ['money', 'finance', 'bill', 'paycheck', 'rent', 'spending', 'save', 'savings', 'budget'],
  growth: ['growth', 'change', 'learn', 'lesson', 'realized', 'noticed', 'pattern', 'understand'],
  anxiety: ['anxious', 'anxiety', 'worry', 'worried', 'overwhelmed', 'stress', 'panic', 'nervous'],
};

/**
 * Returns the dominant journal theme over the last `days` days, IF any
 * theme appears in 2 or more entries. Returns null otherwise.
 *
 * @param {string} profileId
 * @param {number} days  default 7
 * @returns {Promise<{ theme, count, totalEntries } | null>}
 */
export async function getDominantJournalTheme(profileId, days = 7) {
  if (!profileId) return null;
  let entries;
  try {
    entries = await JournalRepository.getAllEntries(profileId, 30);
  } catch { return null; }
  if (!entries || entries.length === 0) return null;

  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days); cutoff.setHours(0, 0, 0, 0);
  const recent = entries.filter(e => {
    const d = new Date((e.date || '') + 'T00:00:00');
    return !isNaN(d.getTime()) && d >= cutoff;
  });
  if (recent.length === 0) return null;

  const counts = {};
  for (const entry of recent) {
    const text = ((entry.content || '') + '').toLowerCase();
    if (!text) continue;
    for (const [theme, words] of Object.entries(THEME_KEYWORDS)) {
      if (words.some(w => new RegExp(`\\b${w}\\b`).test(text))) {
        counts[theme] = (counts[theme] || 0) + 1;
      }
    }
  }

  const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
  if (!top || top[1] < 2) return null;

  return { theme: top[0], count: top[1], totalEntries: recent.length };
}
