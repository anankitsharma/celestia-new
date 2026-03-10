import { XPRepository } from './database/rep_xp';
import { XP_ACTIONS, getLevelInfo } from '../constants/levels';

export async function awardXP(profileId, action) {
  const amount = XP_ACTIONS[action];
  if (!amount || !profileId) return null;

  const result = await XPRepository.awardXP(profileId, amount, action);
  return {
    ...result,
    amount,
    action,
    levelInfo: getLevelInfo(result.total_xp),
  };
}

export async function getXPStatus(profileId) {
  if (!profileId) return null;
  const data = await XPRepository.getXP(profileId);
  if (!data) return { total_xp: 0, level: 1, levelInfo: getLevelInfo(0) };
  return { ...data, levelInfo: getLevelInfo(data.total_xp) };
}
