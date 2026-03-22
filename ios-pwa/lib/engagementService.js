// Unified engagement service — streaks, XP, badges for PWA
// Uses localStorage for persistence
import { loadObject, saveObject } from './storage';

const STREAK_KEY = 'celestia_streaks';
const XP_KEY = 'celestia_xp';
const BADGE_KEY = 'celestia_badges';

// ── LEVELS & XP ─────────────────────────────────────
export const LEVELS = [
  { level: 1, name: 'Starling',      threshold: 0,     ringColor: 'rgba(200,168,75,0.3)' },
  { level: 2, name: 'Constellation', threshold: 75,    ringColor: 'rgba(200,168,75,0.5)' },
  { level: 3, name: 'Nebula',        threshold: 300,   ringColor: 'rgba(200,168,75,0.7)' },
  { level: 4, name: 'Galaxy',        threshold: 1000,  ringColor: 'rgba(200,168,75,0.85)' },
  { level: 5, name: 'Cosmos',        threshold: 3000,  ringColor: '#C8A84B' },
];

const XP_ACTIONS = {
  daily_check_in: 10,
  journal_entry: 20,
  report_read: 15,
  chat_message: 5,
  share: 25,
  deep_dive: 10,
  compatibility_check: 15,
  moon_ritual: 20,
};

const STREAK_MULTIPLIERS = { 0: 1, 7: 1.5, 14: 2, 30: 2.5 };

function getStreakMultiplier(streak) {
  for (const t of [30, 14, 7, 0]) {
    if (streak >= t) return STREAK_MULTIPLIERS[t];
  }
  return 1;
}

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].threshold) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? (xp - current.threshold) / (next.threshold - current.threshold)
    : 1;
  return { current, next, progress: Math.min(1, Math.max(0, progress)), xp };
}

// ── STREAKS ─────────────────────────────────────────
export function getStreakEmoji(streak) {
  if (streak >= 100) return '\ud83d\udc8e';
  if (streak >= 30) return '\u2728';
  if (streak >= 14) return '\ud83d\udcab';
  if (streak >= 7) return '\ud83d\udd25';
  if (streak >= 3) return '\u2b50';
  return '\ud83c\udf19';
}

export function getMilestoneMessage(milestone) {
  const messages = {
    3: 'Cosmic Explorer! 3 days strong',
    7: 'Stargazer! A full week with the cosmos',
    14: 'Dedicated! Two weeks of cosmic wisdom',
    30: 'Moon Cycle Master! 30 days!',
    50: 'Half Century! 50 days of cosmic alignment',
    100: 'Celestial Devotee! 100 days!',
    365: 'Cosmic Legend! A full year!',
  };
  return messages[milestone] || `${milestone} day streak!`;
}

export async function getStreakData() {
  const data = await loadObject(STREAK_KEY);
  if (!data) return { current_streak: 0, longest_streak: 0, total_check_ins: 0, last_check_in: null };
  return data;
}

export async function recordCheckIn() {
  const todayStr = new Date().toISOString().split('T')[0];
  let data = await loadObject(STREAK_KEY) || {
    current_streak: 0, longest_streak: 0, total_check_ins: 0, last_check_in: null,
  };

  if (data.last_check_in === todayStr) return data; // Already checked in today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (data.last_check_in === yesterdayStr) {
    data.current_streak += 1;
  } else {
    data.current_streak = 1;
  }

  data.last_check_in = todayStr;
  data.total_check_ins += 1;
  if (data.current_streak > data.longest_streak) data.longest_streak = data.current_streak;

  await saveObject(STREAK_KEY, data);
  return data;
}

// ── XP ──────────────────────────────────────────────
export async function getXPStatus() {
  const data = await loadObject(XP_KEY);
  const xp = data?.total_xp || 0;
  return { total_xp: xp, levelInfo: getLevelInfo(xp) };
}

export async function awardXP(action) {
  const baseAmount = XP_ACTIONS[action];
  if (!baseAmount) return null;

  const streak = await getStreakData();
  const multiplier = getStreakMultiplier(streak.current_streak);
  const amount = Math.round(baseAmount * multiplier);

  const data = await loadObject(XP_KEY) || { total_xp: 0 };
  const prevXP = data.total_xp;
  data.total_xp += amount;
  data.last_action = action;
  data.last_action_at = Date.now();
  await saveObject(XP_KEY, data);

  const levelInfo = getLevelInfo(data.total_xp);
  const prevLevel = getLevelInfo(prevXP);
  const leveledUp = levelInfo.current.level > prevLevel.current.level;

  return {
    total_xp: data.total_xp,
    amount,
    action,
    levelInfo,
    leveledUp,
    newLevel: leveledUp ? levelInfo.current : null,
  };
}

// ── BADGES ──────────────────────────────────────────
const BADGE_CATALOG = [
  { id: 'first_check_in', name: 'First Light', icon: '\ud83c\udf1f', desc: 'First daily check-in', condition: (s) => s.total_check_ins >= 1 },
  { id: 'streak_3', name: 'Rising Star', icon: '\u2b50', desc: '3-day streak', condition: (s) => s.current_streak >= 3 },
  { id: 'streak_7', name: 'Cosmic Fire', icon: '\ud83d\udd25', desc: '7-day streak', condition: (s) => s.current_streak >= 7 },
  { id: 'streak_14', name: 'Stellar', icon: '\ud83d\udcab', desc: '14-day streak', condition: (s) => s.current_streak >= 14 },
  { id: 'streak_30', name: 'Moon Master', icon: '\ud83c\udf15', desc: '30-day streak', condition: (s) => s.current_streak >= 30 },
  { id: 'xp_75', name: 'Constellation', icon: '\u2728', desc: 'Reach Level 2', condition: (_, x) => x >= 75 },
  { id: 'xp_300', name: 'Nebula', icon: '\ud83c\udf0c', desc: 'Reach Level 3', condition: (_, x) => x >= 300 },
  { id: 'xp_1000', name: 'Galaxy', icon: '\ud83c\udf0c', desc: 'Reach Level 4', condition: (_, x) => x >= 1000 },
  { id: 'journal_1', name: 'First Page', icon: '\ud83d\udcd6', desc: 'First journal entry', condition: (_, __, c) => c.journals >= 1 },
  { id: 'journal_7', name: 'Chronicler', icon: '\ud83d\udcdd', desc: '7 journal entries', condition: (_, __, c) => c.journals >= 7 },
  { id: 'chat_1', name: 'First Question', icon: '\ud83d\udcac', desc: 'First AI chat', condition: (_, __, c) => c.chats >= 1 },
  { id: 'report_1', name: 'Deep Dive', icon: '\ud83d\udd2e', desc: 'First report generated', condition: (_, __, c) => c.reports >= 1 },
  { id: 'match_1', name: 'Star-Crossed', icon: '\ud83d\udc95', desc: 'First compatibility check', condition: (_, __, c) => c.matches >= 1 },
];

export async function getUnlockedBadges() {
  return (await loadObject(BADGE_KEY)) || [];
}

export async function checkBadges(counters = {}) {
  const streak = await getStreakData();
  const xpData = await loadObject(XP_KEY);
  const xp = xpData?.total_xp || 0;
  const unlocked = (await loadObject(BADGE_KEY)) || [];
  const newBadges = [];

  for (const badge of BADGE_CATALOG) {
    if (unlocked.includes(badge.id)) continue;
    if (badge.condition(streak, xp, counters)) {
      unlocked.push(badge.id);
      newBadges.push(badge);
    }
  }

  if (newBadges.length > 0) {
    await saveObject(BADGE_KEY, unlocked);
  }

  return newBadges;
}

export function getBadgeCatalog() {
  return BADGE_CATALOG;
}

export async function getEngagementCounters() {
  const counters = await loadObject('celestia_engagement_counters') || { journals: 0, chats: 0, reports: 0, matches: 0, shares: 0 };
  return counters;
}

export async function incrementCounter(type) {
  const counters = await loadObject('celestia_engagement_counters') || { journals: 0, chats: 0, reports: 0, matches: 0, shares: 0 };
  counters[type] = (counters[type] || 0) + 1;
  await saveObject('celestia_engagement_counters', counters);
  return counters;
}
