import { Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase/client';

const INVITE_KEY = 'celestia_invites';
const APP_SCHEME = 'celestia://';
const WEB_FALLBACK = 'https://apps.apple.com/app/celestia'; // Update with real App Store URL

/**
 * Generate a unique invite code.
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create a compatibility invite and share it.
 * Stores the invite locally and optionally in Supabase for cross-device redemption.
 */
export async function createAndShareInvite({ inviterName, inviterId, partnerName, partnerBirthData, score, verdict }) {
  const code = generateCode();
  const invite = {
    code,
    inviter_id: inviterId,
    inviter_name: inviterName,
    partner_name: partnerName,
    partner_birth_data: partnerBirthData,
    cached_score: score,
    cached_verdict: verdict,
    created_at: Date.now(),
    expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
    redeemed: false,
  };

  // Save locally
  try {
    const stored = await AsyncStorage.getItem(INVITE_KEY);
    const invites = stored ? JSON.parse(stored) : [];
    invites.push(invite);
    await AsyncStorage.setItem(INVITE_KEY, JSON.stringify(invites));
  } catch {}

  // Try to save to Supabase for cross-device
  try {
    await supabase.from('invites').insert({
      code: invite.code,
      inviter_id: invite.inviter_id,
      inviter_name: invite.inviter_name,
      partner_name: invite.partner_name,
      cached_score: invite.cached_score,
      cached_verdict: invite.cached_verdict,
      created_at: new Date(invite.created_at).toISOString(),
      expires_at: new Date(invite.expires_at).toISOString(),
    });
  } catch {
    // Supabase optional — local-first
  }

  // Share via native share sheet
  const shareMessage = `${inviterName} wants to see your cosmic compatibility! ✨\n\nYour match score: ${score}% — "${verdict}"\n\nDownload Celestia to see the full analysis:\n${WEB_FALLBACK}?invite=${code}`;

  try {
    await Share.share({
      message: shareMessage,
      title: `Cosmic Match with ${inviterName}`,
    });
    return { success: true, code };
  } catch {
    return { success: false, code };
  }
}

/**
 * Look up an invite code (checks Supabase first, then local).
 */
export async function lookupInvite(code) {
  // Try Supabase
  try {
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('code', code)
      .single();
    if (data && !data.redeemed && new Date(data.expires_at) > new Date()) {
      return data;
    }
  } catch {}

  // Try local
  try {
    const stored = await AsyncStorage.getItem(INVITE_KEY);
    if (stored) {
      const invites = JSON.parse(stored);
      const invite = invites.find(i => i.code === code && !i.redeemed && i.expires_at > Date.now());
      return invite || null;
    }
  } catch {}

  return null;
}

/**
 * Mark an invite as redeemed.
 */
export async function redeemInvite(code, redeemedById) {
  // Update Supabase
  try {
    await supabase
      .from('invites')
      .update({ redeemed: true, redeemed_by: redeemedById })
      .eq('code', code);
  } catch {}

  // Update local
  try {
    const stored = await AsyncStorage.getItem(INVITE_KEY);
    if (stored) {
      const invites = JSON.parse(stored);
      const idx = invites.findIndex(i => i.code === code);
      if (idx !== -1) {
        invites[idx].redeemed = true;
        invites[idx].redeemed_by = redeemedById;
        await AsyncStorage.setItem(INVITE_KEY, JSON.stringify(invites));
      }
    }
  } catch {}
}

/**
 * Get all invites created by this user (for display on profile).
 */
export async function getMyInvites(inviterId) {
  try {
    const stored = await AsyncStorage.getItem(INVITE_KEY);
    if (stored) {
      const invites = JSON.parse(stored);
      return invites.filter(i => i.inviter_id === inviterId);
    }
  } catch {}
  return [];
}
