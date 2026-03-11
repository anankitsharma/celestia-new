import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { awardXP } from './xpService';
import { trackEvent } from './achievementService';
import { buildDeepLink } from './deepLinkService';

const REFERRAL_CODE_KEY = 'celestia_referral_code';
const REFERRAL_STATS_KEY = 'celestia_referral_stats';
const REFERRED_BY_KEY = 'celestia_referred_by';
const WEB_FALLBACK = 'https://apps.apple.com/app/celestia';

const REFERRAL_XP_REWARD = 100; // Both referrer and referee get 100 XP

/**
 * Generate or retrieve the user's personal referral code.
 */
export async function getOrCreateReferralCode(profileId) {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (stored) return stored;

    // Generate from profile ID + random suffix
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    const code = `REF${suffix}`;
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, code);
    return code;
  } catch {
    return 'CELESTIA';
  }
}

/**
 * Share the user's referral link via native share sheet.
 */
export async function shareReferralLink(profileId, userName) {
  const code = await getOrCreateReferralCode(profileId);
  const deepLink = buildDeepLink('referral', code);

  const message = `${userName || 'I'} invited you to Celestia — discover your cosmic blueprint! ✨\n\nWe both get bonus XP when you join.\n\n${WEB_FALLBACK}?ref=${code}`;

  try {
    await Share.share({
      message,
      title: 'Join me on Celestia',
    });
    trackEvent('share');
    awardXP(profileId, 'share');
    return { success: true, code };
  } catch {
    return { success: false, code };
  }
}

/**
 * Record that this user was referred by someone.
 * Called once when the referee first opens the app via referral link.
 */
export async function recordReferral(referralCode, newUserId) {
  try {
    // Check if already referred
    const existing = await AsyncStorage.getItem(REFERRED_BY_KEY);
    if (existing) return { alreadyReferred: true };

    await AsyncStorage.setItem(REFERRED_BY_KEY, referralCode);

    // Award XP to the new user (referee)
    if (newUserId) {
      await awardXP(newUserId, 'referral_bonus');
    }

    // Increment referrer's stats (locally tracked)
    const stats = await getReferralStats();
    stats.totalReferred = (stats.totalReferred || 0) + 1;
    stats.pendingReward = true;
    await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(stats));

    return { success: true, reward: REFERRAL_XP_REWARD };
  } catch {
    return { success: false };
  }
}

/**
 * Claim pending referral reward for the referrer.
 * Called on app open when pendingReward is true.
 */
export async function claimReferralReward(profileId) {
  try {
    const stats = await getReferralStats();
    if (!stats.pendingReward) return null;

    await awardXP(profileId, 'referral_bonus');
    stats.pendingReward = false;
    stats.totalXPEarned = (stats.totalXPEarned || 0) + REFERRAL_XP_REWARD;
    await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(stats));

    return { xp: REFERRAL_XP_REWARD, totalReferred: stats.totalReferred };
  } catch {
    return null;
  }
}

/**
 * Get referral stats for display on ProfileScreen.
 */
export async function getReferralStats() {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_STATS_KEY);
    return stored ? JSON.parse(stored) : { totalReferred: 0, totalXPEarned: 0, pendingReward: false };
  } catch {
    return { totalReferred: 0, totalXPEarned: 0, pendingReward: false };
  }
}

/**
 * Check if user was referred by someone.
 */
export async function getReferredBy() {
  try {
    return await AsyncStorage.getItem(REFERRED_BY_KEY);
  } catch {
    return null;
  }
}
