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

export function getStreakEmoji(streak) {
  if (streak >= 100) return '💎';  // Diamond — legendary, unbreakable
  if (streak >= 30) return '✨';   // Radiant — a full lunar cycle
  if (streak >= 14) return '💫';   // Shooting star — cosmic momentum
  if (streak >= 7) return '🔥';    // Fire — one week, you're on fire
  if (streak >= 3) return '⭐';    // Star — lighting up
  return '🌙';                     // Crescent — beginning of the journey
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
