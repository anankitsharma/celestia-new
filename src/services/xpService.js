import { XPRepository } from './database/rep_xp';
import { XP_ACTIONS, getLevelInfo, getStreakMultiplier } from '../constants/levels';
import { StreakRepository } from './database/rep_streaks';
import { loadObject, saveObject } from './storage';
import { captureEvent, EVENTS } from './analytics';

const FIRST_ACTION_KEY = 'celestia_first_actions_today';

// Track first-of-day actions for bonus XP
async function isFirstActionToday(action) {
  const todayStr = new Date().toISOString().split('T')[0];
  const data = await loadObject(FIRST_ACTION_KEY) || { date: '', actions: {} };
  if (data.date !== todayStr) {
    // New day — reset
    const fresh = { date: todayStr, actions: { [action]: true } };
    await saveObject(FIRST_ACTION_KEY, fresh);
    return true;
  }
  if (!data.actions[action]) {
    data.actions[action] = true;
    await saveObject(FIRST_ACTION_KEY, data);
    return true;
  }
  return false;
}

export async function awardXP(profileId, action) {
  const baseAmount = XP_ACTIONS[action];
  if (!baseAmount || !profileId) return null;

  // Get streak for multiplier
  let multiplier = 1;
  try {
    const streak = await StreakRepository.getStreak(profileId);
    if (streak) {
      multiplier = getStreakMultiplier(streak.current_streak);
    }
  } catch (e) {}

  // First-action-of-day bonus (2x) for journal, chat, deep_dive
  let firstActionBonus = false;
  const bonusActions = ['journal_entry', 'chat_message', 'deep_dive'];
  if (bonusActions.includes(action)) {
    firstActionBonus = await isFirstActionToday(action);
  }

  const amount = Math.round(baseAmount * multiplier * (firstActionBonus ? 2 : 1));

  const result = await XPRepository.awardXP(profileId, amount, action);
  const levelInfo = getLevelInfo(result.total_xp);
  const prevLevelInfo = getLevelInfo(result.total_xp - amount);
  const leveledUp = levelInfo.current.level > prevLevelInfo.current.level;

  if (leveledUp) {
    captureEvent(EVENTS.LEVEL_UP, {
      from_level: prevLevelInfo.current.level,
      to_level: levelInfo.current.level,
      to_tier_name: levelInfo.current.name || null,
      total_xp: result.total_xp,
      action,
    });
  }

  return {
    ...result,
    amount,
    baseAmount,
    multiplier,
    firstActionBonus,
    action,
    levelInfo,
    leveledUp,
    newLevel: leveledUp ? levelInfo.current : null,
  };
}

export async function getXPStatus(profileId) {
  if (!profileId) return null;
  const data = await XPRepository.getXP(profileId);
  if (!data) return { total_xp: 0, level: 1, levelInfo: getLevelInfo(0) };
  return { ...data, levelInfo: getLevelInfo(data.total_xp) };
}
