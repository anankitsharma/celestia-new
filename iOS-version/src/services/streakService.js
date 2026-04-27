import { StreakRepository } from './database/rep_streaks';

export async function recordDailyCheckIn(profileId) {
  if (!profileId) return null;
  return StreakRepository.recordCheckIn(profileId);
}

export async function getStreakData(profileId) {
  if (!profileId) return null;
  const data = await StreakRepository.getStreak(profileId);
  if (!data) return { current_streak: 0, longest_streak: 0, total_check_ins: 0, streak_freezes_remaining: 1 };
  return data;
}

export async function useStreakFreeze(profileId) {
  return StreakRepository.useFreeze(profileId);
}

// V1: streak emojis neutralized — moon/cosmic-coded defaults replaced with
// relational fire/sparkle/diamond ramp. Visible on Today hero streak pill.
export function getStreakEmoji(streak) {
  if (streak >= 100) return '💎';  // Diamond — legendary
  if (streak >= 30) return '✨';   // Sparkles — month milestone
  if (streak >= 14) return '⚡';   // Bolt — momentum
  if (streak >= 7) return '🔥';    // Fire — one week, on fire
  if (streak >= 3) return '⭐';    // Star — lighting up
  return '✦';                       // Sparkle — beginning
}

export function getMilestoneMessage(milestone) {
  const messages = {
    3: 'Day Three — three days strong',
    7: 'Day Seven — a full week of consistency',
    14: 'Two weeks — that\'s real consistency',
    30: 'Month One — thirty days. Steady.',
    50: 'Fifty days. Steady streak.',
    100: 'Hundred Days — a milestone',
    365: 'A full year. Remarkable.',
  };
  return messages[milestone] || `${milestone} day streak!`;
}
