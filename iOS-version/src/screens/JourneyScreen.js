import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData, getStreakEmoji } from '../services/streakService';
import { getXPStatus, awardXP } from '../services/xpService';
import { getAllBadges, trackEvent } from '../services/achievementService';
import { haptic } from '../services/hapticService';
import { useShareCard } from '../components/ShareCard';
import CosmicRarityCard from '../components/CosmicRarityCard';
import { getCosmicArchetype, getComboRarity } from '../services/cosmicIdentityService';
import { getCosmicSeason } from '../services/astrologyService';
import { shareReferralLink, getReferralStats, getOrCreateReferralCode } from '../services/referralService';

export default function JourneyScreen({ navigation }) {
  const { userProfile } = useUserProfile();
  const { colors, isDark } = useTheme();

  const [streakInfo, setStreakInfo] = useState(null);
  const [xpInfo, setXpInfo] = useState(null);
  const [badges, setBadges] = useState([]);
  const [cosmicSeason, setCosmicSeason] = useState(null);
  const [referralCode, setReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState(null);

  const { cardRef: rarityCardRef, captureAndShare: shareRarity } = useShareCard();

  const chart = userProfile?.chart;
  const name = userProfile?.name || 'friend';
  const firstName = name.split(' ')[0];

  useEffect(() => {
    (async () => {
      const profileId = userProfile?.id || 'default';
      try { setStreakInfo(await getStreakData(profileId)); } catch (e) {}
      try { setXpInfo(await getXPStatus(profileId)); } catch (e) {}
      try { setBadges(await getAllBadges(profileId)); } catch (e) {}
      try { setCosmicSeason(getCosmicSeason(chart, new Date())); } catch (e) {}
      try { setReferralCode(await getOrCreateReferralCode(profileId)); } catch (e) {}
      try { setReferralStats(await getReferralStats(profileId)); } catch (e) {}
    })();
  }, []);

  const cardStyle = { backgroundColor: colors.card, borderColor: colors.border };
  const subStyle = { color: colors.textSecondary };
  const headingStyle = { color: colors.heading };
  const textStyle = { color: colors.text };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero — V1.2 Light Liquid Glass: sand signal wash, ink type. */}
        <LinearGradient colors={['#F4ECDD', '#F0E5CF', '#EBDDC0']} locations={[0, 0.5, 1]} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 22, color: T.ink }}>‹</Text>
          </TouchableOpacity>
          <Text style={s.heroTitle}>Your Journey</Text>
          <Text style={s.heroSub}>Every check-in writes a new chapter</Text>

          {/* Quick stats */}
          <View style={s.statsRow}>
            {streakInfo && streakInfo.current_streak > 0 && (
              <View style={s.statPill}>
                <Text style={{ fontSize: 16 }}>{getStreakEmoji(streakInfo.current_streak)}</Text>
                <Text style={s.statNum}>{streakInfo.current_streak}</Text>
                <Text style={s.statLbl}>Streak</Text>
              </View>
            )}
            {xpInfo?.levelInfo && (
              <View style={s.statPill}>
                <Text style={{ fontSize: 16 }}>✦</Text>
                <Text style={s.statNum}>{xpInfo.total_xp || 0}</Text>
                <Text style={s.statLbl}>{xpInfo.levelInfo.current?.name || 'Day One'}</Text>
              </View>
            )}
            {streakInfo && (
              <View style={s.statPill}>
                <Text style={{ fontSize: 16 }}>📖</Text>
                <Text style={s.statNum}>{streakInfo.total_check_ins || 0}</Text>
                <Text style={s.statLbl}>Pages</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={s.body}>

          {/* Current Cosmic Arc */}
          {cosmicSeason && (
            <View style={[s.arcCard, { backgroundColor: isDark ? 'rgba(200,168,75,0.06)' : 'rgba(200,168,75,0.06)', borderColor: isDark ? 'rgba(200,168,75,0.1)' : 'rgba(200,168,75,0.12)' }]}>
              <Text style={[s.sectionLabel, subStyle]}>YOUR CURRENT ARC</Text>
              <Text style={[{ fontSize: 15, fontFamily: FONTS.serif, marginBottom: 6 }, headingStyle]}>{cosmicSeason.description}</Text>
              <View style={{ height: 3, backgroundColor: isDark ? 'rgba(200,168,75,0.1)' : 'rgba(200,168,75,0.12)', borderRadius: 2, marginBottom: 4 }}>
                <View style={{ height: 3, backgroundColor: T.gold, borderRadius: 2, width: `${cosmicSeason.progress}%` }} />
              </View>
              <Text style={[{ fontSize: 10 }, subStyle]}>{cosmicSeason.progress}% through · {cosmicSeason.daysRemaining} days remaining{cosmicSeason.isRetrograde ? ' · Retrograde' : ''}</Text>
            </View>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, subStyle]}>BADGES ({badges.filter(b => b.unlocked).length}/{badges.length})</Text>
              <View style={s.badgeGrid}>
                {badges.map((b) => (
                  <View key={b.id} style={[s.badgeItem, cardStyle, !b.unlocked && { opacity: 0.4 }]}>
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>{b.icon}</Text>
                    <Text style={[{ fontSize: 9, fontFamily: FONTS.sansMedium, textAlign: 'center' }, b.unlocked ? textStyle : subStyle]} numberOfLines={1}>{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* XP Level Roadmap */}
          {xpInfo?.levelInfo && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, subStyle]}>LEVEL ROADMAP</Text>
              <View style={[s.roadmapCard, cardStyle]}>
                {[
                  { level: 2, name: 'Curious', xp: 75, reward: 'Customize your reading voice', icon: '✦' },
                  { level: 3, name: 'Engaged', xp: 300, reward: 'Unlock past & future views', icon: '🌀' },
                  { level: 4, name: 'Active', xp: 1000, reward: 'Deeper relationship reports', icon: '🌌' },
                  { level: 5, name: 'Anchored', xp: 3000, reward: 'Your full profile unlocked', icon: '👑' },
                ].map((m, i) => {
                  const reached = (xpInfo?.levelInfo?.current?.level || 1) >= m.level;
                  return (
                    <View key={i} style={[s.roadmapRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                      <View style={[s.roadmapDot, reached && { backgroundColor: T.gold }]}>
                        <Text style={{ fontSize: reached ? 14 : 10, opacity: reached ? 1 : 0.4 }}>{reached ? m.icon : '🔒'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 13, fontFamily: FONTS.sansMedium }, reached ? headingStyle : subStyle]}>Lvl {m.level} — {m.name} ({m.xp} XP)</Text>
                        <Text style={[{ fontSize: 11, marginTop: 2 }, subStyle]}>{m.reward}</Text>
                      </View>
                      {reached && <Text style={{ fontSize: 11, color: '#4CAF50', fontFamily: FONTS.sansMedium }}>✓</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Devotion Milestones */}
          {streakInfo && (
            <View style={s.section}>
              <Text style={[s.sectionLabel, subStyle]}>DEVOTION MILESTONES</Text>
              <View style={[s.roadmapCard, cardStyle]}>
                {[
                  { day: 3, label: 'Day Three', reward: '1.0x XP multiplier', icon: '⭐' },
                  { day: 7, label: 'Day Seven', reward: '1.5x XP multiplier', icon: '🔥' },
                  { day: 14, label: 'Two Weeks', reward: '2x XP multiplier', icon: '💫' },
                  { day: 30, label: 'Month One', reward: '2.5x XP multiplier', icon: '✨' },
                  { day: 50, label: 'Fifty Days', reward: 'Steady streak', icon: '🌟' },
                  { day: 100, label: 'Hundred Days', reward: 'Legendary status', icon: '💎' },
                ].map((m, i) => {
                  const reached = (streakInfo?.current_streak || 0) >= m.day;
                  return (
                    <View key={i} style={[s.roadmapRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider }]}>
                      <View style={[s.roadmapDot, reached && { backgroundColor: T.gold }]}>
                        <Text style={{ fontSize: reached ? 14 : 10, opacity: reached ? 1 : 0.4 }}>{reached ? m.icon : '🔒'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[{ fontSize: 13, fontFamily: FONTS.sansMedium }, reached ? headingStyle : subStyle]}>Day {m.day} — {m.label}</Text>
                        <Text style={[{ fontSize: 11, marginTop: 2 }, subStyle]}>{m.reward}</Text>
                      </View>
                      {reached && <Text style={{ fontSize: 11, color: '#4CAF50', fontFamily: FONTS.sansMedium }}>✓</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Cosmic Rarity Card */}
          {userProfile?.chart && (() => {
            const arch = getCosmicArchetype(userProfile.chart);
            const rarity = getComboRarity(userProfile.chart);
            if (!arch) return null;
            return (
              <View style={s.section}>
                <Text style={[s.sectionLabel, subStyle]}>YOUR PROFILE RARITY</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={async () => {
                  haptic.medium();
                  await shareRarity(`${arch.name} — ${arch.tagline}\nBig Three: ${rarity?.text || ''} ${rarity?.label || ''}\n\n— Celestia`);
                  trackEvent('share').catch(() => {});
                  awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                }}>
                  <CosmicRarityCard innerRef={rarityCardRef} archetype={arch} comboRarity={rarity} />
                </TouchableOpacity>
                <Text style={[{ fontSize: 11, textAlign: 'center', marginTop: 6, fontStyle: 'italic' }, subStyle]}>Tap card to share</Text>
              </View>
            );
          })()}

          {/* Referral */}
          <View style={s.section}>
            <LinearGradient colors={['#1A1228', '#14101E']} style={s.referralCard}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: T.cream, marginBottom: 4 }}>Invite Friends</Text>
              <Text style={{ fontSize: 12, color: 'rgba(250,248,242,0.5)', marginBottom: 10 }}>You both earn 100 XP when they join</Text>
              {referralStats?.totalReferred > 0 && (
                <Text style={{ fontSize: 11, color: T.gold, marginBottom: 8 }}>{referralStats.totalReferred} friend{referralStats.totalReferred !== 1 ? 's' : ''} invited</Text>
              )}
              <TouchableOpacity
                style={{ backgroundColor: 'rgba(200,168,75,0.2)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 10, alignItems: 'center' }}
                activeOpacity={0.7}
                onPress={async () => {
                  haptic.medium();
                  await shareReferralLink(userProfile?.id || 'default', userProfile?.name);
                }}>
                <Text style={{ fontSize: 13, fontFamily: FONTS.sansMedium, color: T.gold }}>Share Invite Link</Text>
              </TouchableOpacity>
              {referralCode && (
                <Text style={{ fontSize: 10, color: 'rgba(250,248,242,0.3)', textAlign: 'center', marginTop: 8 }}>Your code: {referralCode}</Text>
              )}
            </LinearGradient>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16,
    paddingHorizontal: 22, paddingBottom: 24,
  },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 48), left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 26, color: T.ink, marginBottom: 4, letterSpacing: -0.4 },
  heroSub: { fontSize: 12, color: T.inkDim, marginBottom: 18, fontFamily: FONTS.sans },
  statsRow: { flexDirection: 'row', gap: 10 },
  statPill: { flex: 1, backgroundColor: T.surface, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.hairline },
  statNum: { fontFamily: FONTS.serif, fontSize: 20, color: T.ink },
  statLbl: { fontSize: 9, color: T.inkDim, letterSpacing: 0.5, fontFamily: FONTS.sansMedium },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, marginBottom: 10 },
  arcCard: { borderRadius: 14, padding: 14, marginBottom: 18, borderWidth: 1 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeItem: { width: '22%', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1 },
  roadmapCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  roadmapDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,168,75,0.1)', alignItems: 'center', justifyContent: 'center' },
  referralCard: { borderRadius: 16, padding: 20 },
});
