export const LEVELS = [
  { level: 1, name: 'Starling',      threshold: 0,     ringColor: 'rgba(200,168,75,0.3)' },
  { level: 2, name: 'Constellation', threshold: 75,    ringColor: 'rgba(200,168,75,0.5)' },
  { level: 3, name: 'Nebula',        threshold: 300,   ringColor: 'rgba(200,168,75,0.7)' },
  { level: 4, name: 'Galaxy',        threshold: 1000,  ringColor: 'rgba(200,168,75,0.85)' },
  { level: 5, name: 'Cosmos',        threshold: 3000,  ringColor: '#C8A84B' },
];

export const XP_ACTIONS = {
  daily_check_in: 10,
  journal_entry: 20,
  report_read: 15,
  chat_message: 5,
  share: 25,
  deep_dive: 10,
  compatibility_check: 15,
  quest_complete: 15,
  quest_bonus: 30,
  referral_bonus: 100,
  moon_ritual: 20,
};

// Streak-based XP multipliers — reward consistency
export const STREAK_MULTIPLIERS = {
  0: 1,
  7: 1.5,
  14: 2,
  30: 2.5,
};

export function getStreakMultiplier(currentStreak) {
  const thresholds = [30, 14, 7, 0];
  for (const t of thresholds) {
    if (currentStreak >= t) return STREAK_MULTIPLIERS[t];
  }
  return 1;
}

// Level-gated rewards — each level unlocks a concrete feature
export const LEVEL_REWARDS = {
  1: { unlocks: [], label: 'Welcome to the cosmos' },
  2: { unlocks: ['reading_voice'], label: 'Reading Voice customization' },
  3: { unlocks: ['forecast_tabs'], label: 'Yesterday & Tomorrow forecasts' },
  4: { unlocks: ['deep_match'], label: 'Deep Match compatibility reports' },
  5: { unlocks: ['cosmic_id', 'cosmos_frame'], label: 'Cosmic ID Card & exclusive badge frame' },
};

export function isFeatureUnlocked(levelInfo, feature) {
  if (!levelInfo?.current) return false;
  const currentLevel = levelInfo.current.level;
  for (let i = 1; i <= currentLevel; i++) {
    if (LEVEL_REWARDS[i]?.unlocks.includes(feature)) return true;
  }
  return false;
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
