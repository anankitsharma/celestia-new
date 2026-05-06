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

/**
 * Restore a recently-broken streak by consuming a freeze. Sets the streak
 * back to (previousStreak + 1) since today's check-in still counts as a day,
 * decrements freezes, updates check-in date.
 *
 * Returns { ok: bool, newStreak?: number, freezesRemaining?: number }.
 */
export async function restoreBrokenStreak(profileId, previousStreak) {
  if (!profileId || !previousStreak || previousStreak < 1) return { ok: false };
  const current = await StreakRepository.getStreak(profileId);
  if (!current || current.streak_freezes_remaining <= 0) return { ok: false };

  const todayStr = new Date().toISOString().split('T')[0];
  const restored = previousStreak + 1; // include today
  const newLongest = Math.max(current.longest_streak || 0, restored);

  await StreakRepository.upsertStreak(profileId, {
    current_streak: restored,
    longest_streak: newLongest,
    last_check_in: todayStr,
    streak_freezes_remaining: Math.max(0, (current.streak_freezes_remaining || 0) - 1),
    total_check_ins: current.total_check_ins || 0,
  });

  return {
    ok: true,
    newStreak: restored,
    freezesRemaining: Math.max(0, (current.streak_freezes_remaining || 0) - 1),
  };
}

// Typographic glyphs for streak escalation. These are Unicode characters,
// not platform emoji — they render in the brand fonts (Playfair / DM Sans)
// rather than in iOS/Android emoji style. Brand-consistency fix per
// plan/competitive-audit/04-gaps-and-opportunities.md Gap 3.
export function getStreakEmoji(streak) {
  if (streak >= 100) return '◇';   // Diamond outline — legendary, unbreakable
  if (streak >= 30) return '✶';    // Six-pointed star — radiant, full lunar cycle
  if (streak >= 14) return '⌁';    // Lightning — cosmic momentum
  if (streak >= 7) return '★';     // Filled star — one week burning bright
  if (streak >= 3) return '✦';     // Asterism — lighting up
  return '◌';                      // Dotted circle — beginning of the journey
}

// Milestone messages — voice per plan/competitive-audit/voice-guide-pushes.md.
// No exclamation marks. No "cosmic" filler. Specific, observational, literary.
// Each message names what the milestone reveals about the user, not the app.
export function getMilestoneMessage(milestone) {
  const messages = {
    3: 'Three days. The first sign you mean it.',
    7: 'A week. Most people don\'t make it past four days.',
    14: 'Two weeks. You\'re on the other side of the trial-vs-real line.',
    30: 'Thirty days. One full lunar cycle of you.',
    50: 'Fifty days. Almost no one is still here.',
    100: 'A hundred. The streak crosses into rare.',
    365: 'A year. You came back every day for a year.',
  };
  return messages[milestone] || `${milestone} days. Quiet record.`;
}
