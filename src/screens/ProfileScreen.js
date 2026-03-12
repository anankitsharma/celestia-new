import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { loadObject, saveObject, StorageKeys } from '../services/storage';
import { getStreakData, getStreakEmoji } from '../services/streakService';
import { getXPStatus, awardXP } from '../services/xpService';
import { getAllBadges, trackEvent } from '../services/achievementService';
import { BADGE_CATEGORIES } from '../constants/badges';
import { haptic } from '../services/hapticService';
import { useShareCard } from '../components/ShareCard';
import CosmicIDCard from '../components/CosmicIDCard';
import CosmicRarityCard from '../components/CosmicRarityCard';
import { getCosmicArchetype, getComboRarity } from '../services/cosmicIdentityService';
import { getNotificationSettings, scheduleAllNotifications, cancelAllNotifications, requestNotificationPermission, hasNotificationPermission } from '../services/notificationService';
import { ForecastRepository } from '../services/database/rep_forecasts';
import * as Notifications from 'expo-notifications';
import { getCosmicSeason } from '../services/astrologyService';
import { shareReferralLink, getReferralStats, getOrCreateReferralCode } from '../services/referralService';
import { useAuth } from '../contexts/AuthContext';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

const SIGN_RULERS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun',
  Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune'
};

const VOICE_OPTIONS = ['Poetic', 'Psychological', 'Direct', 'Spiritual'];
const DEPTH_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen({ navigation }) {
  const { userProfile, setUserProfile } = useUserProfile();
  const { user, signOut: authSignOut, deleteAccount } = useAuth();
  const [settings, setSettings] = useState({ voice: 'Poetic', depth: 'Intermediate' });
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showDepthPicker, setShowDepthPicker] = useState(false);
  const [streakInfo, setStreakInfo] = useState(null);
  const [xpInfo, setXpInfo] = useState(null);
  const [badges, setBadges] = useState([]);
  const [notifSummary, setNotifSummary] = useState('');
  const [referralStats, setReferralStats] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [cosmicSeason, setCosmicSeason] = useState(null);
  const { cardRef: cosmicCardRef, captureAndShare: shareCosmicID } = useShareCard();
  const { cardRef: rarityCardRef, captureAndShare: shareRarity } = useShareCard();
  const [debugData, setDebugData] = useState(null);
  const [debugExpanded, setDebugExpanded] = useState(false);

  useEffect(() => {
    loadSettings();
    loadEngagementData();
    loadNotifSummary();
  }, []);

  const loadEngagementData = async () => {
    try {
      const profileId = userProfile?.id || 'default';
      const [streak, xp, allBadges, refStats, refCode] = await Promise.all([
        getStreakData(profileId),
        getXPStatus(profileId),
        getAllBadges(),
        getReferralStats(),
        getOrCreateReferralCode(profileId),
      ]);
      setStreakInfo(streak);
      setXpInfo(xp);
      setBadges(allBadges);
      setReferralStats(refStats);
      setReferralCode(refCode);
    } catch (e) { console.error('Engagement load error:', e); }
    try {
      if (userProfile?.chart) {
        setCosmicSeason(getCosmicSeason(userProfile.chart, new Date()));
      }
    } catch (e) {}
  };

  const loadNotifSummary = async () => {
    try {
      const ns = await getNotificationSettings();
      const keys = ['cosmic_morning', 'evening_reflection', 'transit_alerts', 'streak_guardian', 'cosmic_milestones', 'weekly_digest'];
      const enabled = keys.filter(k => ns[k]).length;
      setNotifSummary(`${enabled} of ${keys.length} active`);
    } catch { setNotifSummary(''); }
  };

  const loadSettings = async () => {
    try {
      const saved = await loadObject(StorageKeys.SETTINGS);
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    } catch (e) { console.error('Settings load error:', e); }
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveObject(StorageKeys.SETTINGS, updated);
  };

  const chart = userProfile?.chart;
  const name = userProfile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');

  const signGlyph = sun?.sign ? (ZODIAC_SYMBOLS[sun.sign] || '♓') : '✦';

  const astroChips = useMemo(() => {
    if (!chart) return [];
    const chips = [];
    if (chart.elements) {
      const el = Object.entries(chart.elements).sort(([, a], [, b]) => b - a)[0];
      if (el) chips.push(`${el[0].charAt(0).toUpperCase() + el[0].slice(1)} Dominant`);
    }
    if (chart.modalities) {
      const mod = Object.entries(chart.modalities).sort(([, a], [, b]) => b - a)[0];
      if (mod) chips.push(mod[0].charAt(0).toUpperCase() + mod[0].slice(1));
    }
    if (rising?.sign) {
      const ruler = SIGN_RULERS[rising.sign];
      if (ruler) chips.push(`${ruler} Ruled`);
    }
    return chips;
  }, [chart]);

  const astroMain = [
    sun && `${sun.sign} Sun`,
    moon && `${moon.sign} Moon`,
    rising && `${rising.sign} Rising`
  ].filter(Boolean).join(' · ');

  const signBadges = [
    sun && `${ZODIAC_SYMBOLS[sun.sign] || '☉'} ${sun.sign}`,
    moon && `☽ ${moon.sign}`,
    rising && `↑ ${rising.sign}`
  ].filter(Boolean);

  const birthInfo = userProfile ? [
    userProfile.birthDate && new Date(userProfile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    userProfile.birthTime && !userProfile.isTimeUnknown ? userProfile.birthTime : null,
    userProfile.birthLocation?.name
  ].filter(Boolean).join(' · ') : '';

  const handleSignOut = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear your birth data and return to onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await setUserProfile(null);
            navigation.reset({ index: 0, routes: [{ name: 'OnboardingFlow' }] });
          }
        }
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Celestia uses NASA-backed astronomy-engine for precise calculations and Google Gemini AI for personalized readings.\n\nYour birth chart data is stored locally on your device. If signed in, data syncs securely to the cloud for backup.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy',
      'Birth chart calculations are done locally on your device. AI readings use encrypted connections.\n\nIf you create an account, your data is securely synced to Supabase (encrypted in transit and at rest). You can delete your account and all cloud data at any time from Settings.\n\nNo personal data is sold or shared with third parties.',
      [{ text: 'OK' }]
    );
  };

  const SETTINGS_LIST = [
    { icon: '🔔', bg: '#F0EAF8', label: 'Notifications', val: notifSummary, onPress: () => navigation.navigate('NotificationSettings') },
    { icon: '✨', bg: '#FFF2E4', label: 'Reading Voice', val: settings.voice, onPress: () => setShowVoicePicker(true) },
    { icon: '📊', bg: '#EAF0F8', label: 'Depth Level', val: settings.depth, onPress: () => setShowDepthPicker(true) },
    { icon: '🌐', bg: '#F0F8F0', label: 'Time Zone', val: 'Auto', onPress: () => Alert.alert('Time Zone', 'Timezone is automatically detected from your device settings.') },
  ];

  const SETTINGS2_LIST = [
    { icon: '🔒', bg: '#F8F0F0', label: 'Privacy', onPress: handlePrivacy },
    { icon: '❓', bg: '#FFF8E8', label: 'Help & Support', onPress: handleHelp },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#0E0E22', '#2A1A6E', '#0C2040']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.hero}>
          <View style={styles.heroGlyph}><Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: 'rgba(200,168,75,0.04)' }}>{signGlyph}</Text></View>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.heroName}>{name}</Text>
          {birthInfo ? <Text style={styles.heroBirth}>{birthInfo}</Text> : null}
          <View style={styles.signsRow}>
            {signBadges.map((s, i) => (
              <View key={i} style={styles.signBadge}><Text style={styles.signBadgeText}>{s}</Text></View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats */}
          <View style={styles.pstats}>
            <View style={styles.pstat}>
              <Text style={styles.pstatNum}>{chart?.aspects?.length || 0}</Text>
              <Text style={styles.pstatLbl}>Aspects</Text>
              <View style={styles.pstatTags}>
                <View style={styles.miniTag}><Text style={styles.miniTagText}>Natal Chart</Text></View>
              </View>
            </View>
            <View style={styles.pstat}>
              <Text style={styles.pstatNum}>{chart?.planets?.length || 0}</Text>
              <Text style={styles.pstatLbl}>Placements</Text>
              <View style={styles.pstatTags}>
                <View style={styles.miniTag}><Text style={styles.miniTagText}>Whole Sign</Text></View>
              </View>
            </View>
          </View>

          {/* Streak & XP Row */}
          {(streakInfo || xpInfo) && (
            <View style={styles.engageRow}>
              {streakInfo && streakInfo.current_streak > 0 && (
                <View style={styles.engageCard}>
                  <Text style={styles.engageEmoji}>{getStreakEmoji(streakInfo.current_streak)}</Text>
                  <Text style={styles.engageNum}>{streakInfo.current_streak}</Text>
                  <Text style={styles.engageLbl}>Day Streak</Text>
                  <Text style={{ fontSize: 9, color: '#97907F', marginTop: 2, textAlign: 'center' }}>Your devotion to the cosmic practice</Text>
                </View>
              )}
              {xpInfo?.levelInfo && (
                <View style={styles.engageCard}>
                  <Text style={styles.engageEmoji}>{'✦'}</Text>
                  <Text style={styles.engageNum}>{xpInfo.total_xp || 0}</Text>
                  <Text style={styles.engageLbl}>Chapter: {xpInfo.levelInfo.current.name}</Text>
                  <View style={styles.xpBarBg}>
                    <View style={[styles.xpBarFill, { width: `${(xpInfo.levelInfo.progress * 100).toFixed(0)}%` }]} />
                  </View>
                  {xpInfo.levelInfo.next && (
                    <Text style={{ fontSize: 9, color: T.stone, marginTop: 3 }}>
                      {xpInfo.levelInfo.next.threshold - xpInfo.total_xp} XP to {xpInfo.levelInfo.next.name}
                    </Text>
                  )}
                </View>
              )}
              {streakInfo && (
                <View style={styles.engageCard}>
                  <Text style={styles.engageEmoji}>{'📅'}</Text>
                  <Text style={styles.engageNum}>{streakInfo.total_check_ins || 0}</Text>
                  <Text style={styles.engageLbl}>Pages Written</Text>
                </View>
              )}
            </View>
          )}

          {/* Current Cosmic Arc */}
          {cosmicSeason && (
            <View style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(200,168,75,0.12)' }}>
              <Text style={{ fontSize: 9, letterSpacing: 2, color: '#97907F', fontFamily: FONTS.sansSemiBold, marginBottom: 6 }}>YOUR CURRENT ARC</Text>
              <Text style={{ fontSize: 14, color: '#0E0E22', fontFamily: FONTS.serif, marginBottom: 4 }}>{cosmicSeason.description}</Text>
              <View style={{ height: 3, backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 2, marginBottom: 4 }}>
                <View style={{ height: 3, backgroundColor: '#C8A84B', borderRadius: 2, width: `${cosmicSeason.progress}%` }} />
              </View>
              <Text style={{ fontSize: 10, color: '#97907F' }}>{cosmicSeason.progress}% through · {cosmicSeason.daysRemaining} days remaining{cosmicSeason.isRetrograde ? ' · Retrograde' : ''}</Text>
            </View>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <View style={styles.badgeSection}>
              <Text style={styles.secLbl}>YOUR COSMIC JOURNEY ({badges.filter(b => b.unlocked).length}/{badges.length})</Text>
              <View style={styles.badgeGrid}>
                {badges.map((b) => (
                  <View key={b.id} style={[styles.badgeItem, !b.unlocked && styles.badgeLocked]}>
                    <Text style={[styles.badgeIcon, !b.unlocked && { opacity: 0.2 }]}>{b.icon}</Text>
                    <Text style={[styles.badgeName, !b.unlocked && { color: '#C8C0B0' }]} numberOfLines={1}>{b.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Level Rewards */}
          {xpInfo?.levelInfo && (
            <View style={styles.badgeSection}>
              <Text style={styles.secLbl}>YOUR NEXT CHAPTERS</Text>
              <View style={styles.roadmapCard}>
                {[
                  { level: 2, name: 'Constellation', xp: 75, reward: 'Customize your reading voice', icon: '✦' },
                  { level: 3, name: 'Nebula', xp: 300, reward: 'Unlock past & future chapters', icon: '🌀' },
                  { level: 4, name: 'Galaxy', xp: 1000, reward: 'Deep relationship story reports', icon: '🌌' },
                  { level: 5, name: 'Cosmos', xp: 3000, reward: 'Your full Cosmic Identity revealed', icon: '👑' },
                ].map((m, i) => {
                  const reached = (xpInfo?.levelInfo?.current?.level || 1) >= m.level;
                  return (
                    <View key={i} style={styles.roadmapRow}>
                      <View style={[styles.roadmapDot, reached && styles.roadmapDotActive]}>
                        <Text style={{ fontSize: reached ? 14 : 10, opacity: reached ? 1 : 0.4 }}>{reached ? m.icon : '🔒'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roadmapLabel, reached && { color: T.navy }]}>Lvl {m.level} — {m.name} ({m.xp} XP)</Text>
                        <Text style={styles.roadmapReward}>{m.reward}</Text>
                      </View>
                      {reached && <Text style={{ fontSize: 11, color: '#4CAF50' }}>Unlocked</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Streak Rewards Roadmap */}
          {streakInfo && (
            <View style={styles.badgeSection}>
              <Text style={styles.secLbl}>DEVOTION MILESTONES</Text>
              <View style={styles.roadmapCard}>
                {[
                  { day: 3, label: 'Cosmic Explorer', reward: '1.0x XP multiplier', icon: '⭐' },
                  { day: 7, label: 'Stargazer', reward: '1.5x XP multiplier', icon: '🔥' },
                  { day: 14, label: 'Constellation Keeper', reward: '2x XP multiplier', icon: '💫' },
                  { day: 30, label: 'Moon Cycle Master', reward: '2.5x XP multiplier', icon: '✨' },
                  { day: 50, label: 'Celestial Sage', reward: 'Cosmic endurance', icon: '🌟' },
                  { day: 100, label: 'Cosmic Legend', reward: 'Legendary status', icon: '💎' },
                ].map((m, i) => {
                  const reached = (streakInfo?.current_streak || 0) >= m.day;
                  return (
                    <View key={i} style={styles.roadmapRow}>
                      <View style={[styles.roadmapDot, reached && styles.roadmapDotActive]}>
                        <Text style={{ fontSize: reached ? 14 : 10, opacity: reached ? 1 : 0.4 }}>{reached ? m.icon : '🔒'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roadmapLabel, reached && { color: T.navy }]}>Day {m.day} — {m.label}</Text>
                        <Text style={styles.roadmapReward}>{m.reward}</Text>
                      </View>
                      {reached && <Text style={{ fontSize: 11, color: '#4CAF50' }}>Unlocked</Text>}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Cosmic ID Card */}
          <View style={styles.cosmicIDWrap}>
            <Text style={styles.secLbl}>YOUR COSMIC ID</Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => {
              haptic.medium();
              shareCosmicID(`My Celestial Identity\n\n${astroMain}\n${astroChips.join(' · ')}\n\n— Generated with Celestia`);
            }}>
              <CosmicIDCard
                innerRef={cosmicCardRef}
                name={name}
                sun={sun?.sign}
                moon={moon?.sign}
                rising={rising?.sign}
                chips={astroChips}
                levelName={xpInfo?.levelInfo?.current?.name}
              />
            </TouchableOpacity>
            <Text style={styles.tapToShare}>Tap card to share</Text>
          </View>

          {/* Cosmic Rarity Card */}
          {userProfile?.chart && (() => {
            const arch = getCosmicArchetype(userProfile.chart);
            const rarity = getComboRarity(userProfile.chart);
            if (!arch) return null;
            return (
              <View style={styles.cosmicIDWrap}>
                <Text style={styles.secLbl}>YOUR COSMIC RARITY</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={async () => {
                  haptic.medium();
                  await shareRarity(`${arch.name} — ${arch.tagline}\nBig Three: ${rarity?.text || ''} ${rarity?.label || ''}\n\n— Celestia`);
                  trackEvent('share').catch(() => {});
                  awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                }}>
                  <CosmicRarityCard
                    innerRef={rarityCardRef}
                    archetype={arch}
                    comboRarity={rarity}
                  />
                </TouchableOpacity>
                <Text style={styles.tapToShare}>Tap card to share</Text>
              </View>
            );
          })()}

          {/* Referral */}
          <View style={styles.referralCard}>
            <LinearGradient colors={['#1A1228', '#14101E']} style={styles.referralGrad}>
              <Text style={styles.referralTitle}>Invite Friends</Text>
              <Text style={styles.referralSub}>You both earn 100 XP when they join</Text>
              {referralStats?.totalReferred > 0 && (
                <Text style={styles.referralStat}>{referralStats.totalReferred} friend{referralStats.totalReferred !== 1 ? 's' : ''} invited</Text>
              )}
              <TouchableOpacity
                style={styles.referralBtn}
                activeOpacity={0.7}
                onPress={async () => {
                  haptic.medium();
                  await shareReferralLink(userProfile?.id || 'default', userProfile?.name);
                }}
              >
                <Text style={styles.referralBtnText}>Share Invite Link ✉️</Text>
              </TouchableOpacity>
              {referralCode ? (
                <Text style={styles.referralCode}>Your code: {referralCode}</Text>
              ) : null}
            </LinearGradient>
          </View>

          {/* Settings */}
          <Text style={styles.secLbl}>PREFERENCES</Text>
          <View style={styles.settingsCard}>
            {SETTINGS_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7} onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={styles.prowLabel}>{s.label}</Text>
                {s.val ? <Text style={styles.prowVal}>{s.val}</Text> : null}
                <Text style={styles.prowArr}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account */}
          <Text style={styles.secLbl}>ACCOUNT</Text>
          <View style={styles.settingsCard}>
            {user ? (
              <>
                <View style={[styles.prow, { borderBottomWidth: 1 }]}>
                  <View style={[styles.prowIcon, { backgroundColor: '#E8F5E9' }]}><Text style={{ fontSize: 16 }}>{'✓'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prowLabel}>Signed In</Text>
                    <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.prow, { borderBottomWidth: 1 }]} activeOpacity={0.7}
                  onPress={() => Alert.alert('Sign Out', 'Your data is saved locally and will sync again when you sign back in.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: authSignOut },
                  ])}>
                  <View style={[styles.prowIcon, { backgroundColor: '#F0F0F0' }]}><Text style={{ fontSize: 16 }}>{'↪'}</Text></View>
                  <Text style={styles.prowLabel}>Sign Out</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.prow, { borderBottomWidth: 0 }]} activeOpacity={0.7}
                  onPress={() => Alert.alert(
                    'Delete Account',
                    'This will permanently delete your cloud data (journal entries, streaks, achievements) and sign you out. Your local data on this device will remain.\n\nThis cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete My Account',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deleteAccount();
                            Alert.alert('Account Deleted', 'Your cloud data has been removed and you have been signed out.');
                          } catch (e) {
                            Alert.alert('Error', e?.message || 'Could not delete account. Please try again.');
                          }
                        },
                      },
                    ]
                  )}>
                  <View style={[styles.prowIcon, { backgroundColor: '#FFF0F0' }]}><Text style={{ fontSize: 16 }}>{'✕'}</Text></View>
                  <Text style={[styles.prowLabel, { color: '#D44' }]}>Delete Account</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={[styles.prow, { borderBottomWidth: 0 }]} activeOpacity={0.7}
                onPress={() => navigation.navigate('Auth')}>
                <View style={[styles.prowIcon, { backgroundColor: '#F0EAF8' }]}><Text style={{ fontSize: 16 }}>{'☁'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prowLabel}>Sign In / Create Account</Text>
                  <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Sync your data across devices</Text>
                </View>
                <Text style={styles.prowArr}>{'›'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.secLbl}>GENERAL</Text>
          <View style={styles.settingsCard}>
            {SETTINGS2_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, i === SETTINGS2_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7} onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={styles.prowLabel}>{s.label}</Text>
                <Text style={styles.prowArr}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOut} activeOpacity={0.7} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Reset Profile</Text>
          </TouchableOpacity>

          {/* Dev Tools — hidden in production */}
          {__DEV__ && (
            <>
              <Text style={[styles.secLbl, { marginTop: 8, color: T.gold }]}>DEBUG PANEL</Text>
              <View style={styles.devCard}>
                {/* Show Onboarding */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={() => navigation.navigate('OnboardingFlow')}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>✦</Text></View>
                  <Text style={styles.devLabel}>Show Onboarding</Text>
                  <Text style={[styles.prowArr, { color: 'rgba(200,168,75,0.5)' }]}>›</Text>
                </TouchableOpacity>

                {/* Send Test Notification */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const perm = await hasNotificationPermission();
                      if (!perm) {
                        await requestNotificationPermission();
                      }
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: 'Navigator Update',
                          body: 'This is a test notification from Celestia debug panel.',
                          data: { type: 'debug_test' },
                        },
                        trigger: { seconds: 2 },
                      });
                      Alert.alert('Sent', 'Test notification in 2 seconds');
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔔</Text></View>
                  <Text style={styles.devLabel}>Send Test Notification (2s)</Text>
                </TouchableOpacity>

                {/* Schedule All Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const profileId = userProfile?.id || 'default';
                      const today = new Date().toISOString().split('T')[0];
                      const key = `${profileId}_today_${today}`;
                      const forecast = await ForecastRepository.getForecast(key);
                      const streak = await getStreakData(profileId);
                      await scheduleAllNotifications(userProfile, forecast, streak, null, null, null);
                      Alert.alert('Done', 'All notifications scheduled with current forecast data');
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>📬</Text></View>
                  <Text style={styles.devLabel}>Schedule All Notifications</Text>
                </TouchableOpacity>

                {/* Cancel All Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    await cancelAllNotifications();
                    Alert.alert('Done', 'All scheduled notifications cancelled');
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🚫</Text></View>
                  <Text style={styles.devLabel}>Cancel All Notifications</Text>
                </TouchableOpacity>

                {/* Show Scheduled Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                    Alert.alert(
                      `${scheduled.length} Scheduled`,
                      scheduled.slice(0, 5).map(n =>
                        `${n.content.title || 'No title'}\n${n.content.body?.slice(0, 60) || ''}`
                      ).join('\n\n') + (scheduled.length > 5 ? `\n\n...and ${scheduled.length - 5} more` : '')
                    );
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>📋</Text></View>
                  <Text style={styles.devLabel}>Show Scheduled Notifications</Text>
                </TouchableOpacity>

                {/* Show Notification Permission */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const perm = await Notifications.getPermissionsAsync();
                    Alert.alert('Permission Status', JSON.stringify(perm.status, null, 2));
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔐</Text></View>
                  <Text style={styles.devLabel}>Notification Permission</Text>
                </TouchableOpacity>

                {/* Load & Show Forecast Data */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const profileId = userProfile?.id || 'default';
                      const today = new Date().toISOString().split('T')[0];
                      const key = `${profileId}_today_${today}`;
                      const forecast = await ForecastRepository.getForecast(key);
                      if (!forecast) {
                        Alert.alert('No Forecast', `No cached forecast for key: ${key}\n\nGo to Today tab and load your forecast first.`);
                        return;
                      }
                      setDebugData(forecast);
                      setDebugExpanded(true);
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>📊</Text></View>
                  <Text style={styles.devLabel}>Load Today's Forecast Data</Text>
                </TouchableOpacity>

                {/* Clear Forecast Cache */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={() => {
                    Alert.alert('Clear Cache', 'Delete all cached forecasts and go to Today for fresh data?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear & Reload', style: 'destructive', onPress: async () => {
                        await ForecastRepository.clearAll();
                        navigation.navigate('Main', { screen: 'Today' });
                      }},
                    ]);
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🗑️</Text></View>
                  <Text style={styles.devLabel}>Clear Cache & Reload Today</Text>
                </TouchableOpacity>

                {/* Send Navigator Excerpt Notification */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const profileId = userProfile?.id || 'default';
                      const today = new Date().toISOString().split('T')[0];
                      const key = `${profileId}_today_${today}`;
                      const forecast = await ForecastRepository.getForecast(key);
                      if (!forecast?.notificationExcerpt) {
                        Alert.alert('No Excerpt', 'No notificationExcerpt in today\'s forecast. Load forecast first.');
                        return;
                      }
                      const perm = await hasNotificationPermission();
                      if (!perm) await requestNotificationPermission();
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: forecast.notificationExcerpt.title || 'Navigator Update',
                          body: forecast.notificationExcerpt.body || forecast.navigatorHeadline || 'Your cosmic briefing is ready.',
                          data: { type: 'cosmic_morning', screen: 'Today' },
                        },
                        trigger: { seconds: 2 },
                      });
                      Alert.alert('Sent', `Excerpt notification in 2s:\n\n${forecast.notificationExcerpt.title}\n${forecast.notificationExcerpt.body}`);
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>✉️</Text></View>
                  <Text style={styles.devLabel}>Send Navigator Excerpt Notif</Text>
                </TouchableOpacity>

                {/* Test Deep Link to Transits */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('Main', { screen: 'Today', params: { scrollToSection: 'transits' } });
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔗</Text></View>
                  <Text style={styles.devLabel}>Deep Link → Today Transits</Text>
                </TouchableOpacity>

                {/* Notification Settings Dump */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const ns = await getNotificationSettings();
                    Alert.alert('Notification Settings', JSON.stringify(ns, null, 2));
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>⚙️</Text></View>
                  <Text style={styles.devLabel}>Dump Notification Settings</Text>
                </TouchableOpacity>
              </View>

              {/* Debug Data Viewer */}
              {debugExpanded && debugData && (
                <View style={styles.devCard}>
                  <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                    onPress={() => setDebugExpanded(false)}>
                    <Text style={[styles.devLabel, { color: T.gold }]}>FORECAST DATA (tap to close)</Text>
                  </TouchableOpacity>

                  {/* Navigator Headline */}
                  {debugData.navigatorHeadline && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>navigatorHeadline</Text>
                      <Text style={styles.debugVal}>{debugData.navigatorHeadline}</Text>
                    </View>
                  )}

                  {/* Navigator Summary */}
                  {debugData.navigatorSummary && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>navigatorSummary</Text>
                      <Text style={styles.debugVal}>{debugData.navigatorSummary}</Text>
                    </View>
                  )}

                  {/* Notification Excerpt */}
                  {debugData.notificationExcerpt && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>notificationExcerpt</Text>
                      <Text style={styles.debugVal}>Title: {debugData.notificationExcerpt.title}</Text>
                      <Text style={styles.debugVal}>Body: {debugData.notificationExcerpt.body}</Text>
                      <Text style={styles.debugVal}>Area: {debugData.notificationExcerpt.lifeArea}</Text>
                    </View>
                  )}

                  {/* Navigate Toward */}
                  {debugData.navigateToward && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>navigateToward</Text>
                      {(Array.isArray(debugData.navigateToward) ? debugData.navigateToward : [debugData.navigateToward]).map((item, i) => (
                        <Text key={i} style={styles.debugVal}>+ {item.action || item} → {item.reason || ''}</Text>
                      ))}
                    </View>
                  )}

                  {/* Navigate Around */}
                  {debugData.navigateAround && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>navigateAround</Text>
                      {(Array.isArray(debugData.navigateAround) ? debugData.navigateAround : [debugData.navigateAround]).map((item, i) => (
                        <Text key={i} style={styles.debugVal}>- {item.action || item} → {item.reason || ''}{item.alternative ? ` (alt: ${item.alternative})` : ''}</Text>
                      ))}
                    </View>
                  )}

                  {/* Life Areas */}
                  {debugData.lifeAreas && (
                    <View style={styles.debugBlock}>
                      <Text style={styles.debugKey}>lifeAreas</Text>
                      {Object.entries(debugData.lifeAreas).map(([area, data]) => (
                        <View key={area} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: 'rgba(200,168,75,0.3)' }}>
                          <Text style={[styles.debugVal, { fontFamily: FONTS.sansSemiBold, color: T.gold }]}>{area.toUpperCase()}</Text>
                          <Text style={styles.debugVal}>Energy: {data.energy}</Text>
                          <Text style={styles.debugVal}>Why: {data.planetaryReason}</Text>
                          {data.doItems?.map((d, j) => <Text key={`do${j}`} style={styles.debugVal}>  + {d}</Text>)}
                          {data.avoidItems?.map((a, j) => <Text key={`av${j}`} style={styles.debugVal}>  - {a}</Text>)}
                          <Text style={styles.debugVal}>Note: {data.navigatorNote}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Core forecast fields */}
                  <View style={styles.debugBlock}>
                    <Text style={styles.debugKey}>Core Fields</Text>
                    <Text style={styles.debugVal}>Overall: {debugData.overallTheme || 'n/a'}</Text>
                    <Text style={styles.debugVal}>Mood: {debugData.emotionalWeather || 'n/a'}</Text>
                    <Text style={styles.debugVal}>Lucky #: {debugData.luckyNumber || 'n/a'}</Text>
                    <Text style={styles.debugVal}>Color: {debugData.luckyColor || 'n/a'}</Text>
                    <Text style={styles.debugVal}>Crystal: {debugData.luckyItem || 'n/a'}</Text>
                    <Text style={styles.debugVal}>Energy: {debugData.energyLevel || 'n/a'}/10</Text>
                  </View>

                  {/* Raw JSON dump */}
                  <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                    onPress={() => {
                      const raw = JSON.stringify(debugData, null, 2);
                      Alert.alert('Raw Forecast (truncated)', raw.slice(0, 1500) + (raw.length > 1500 ? '\n...' : ''));
                    }}>
                    <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>{ '{}'}</Text></View>
                    <Text style={styles.devLabel}>Show Raw JSON</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Voice Picker Modal */}
      <Modal visible={showVoicePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowVoicePicker(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Reading Voice</Text>
            <Text style={styles.pickerSub}>Choose how Celestia speaks to you</Text>
            {VOICE_OPTIONS.map((v, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.voice === v && styles.pickerOptionOn]}
                onPress={() => { updateSetting('voice', v); setShowVoicePicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.voice === v && styles.pickerOptionTextOn]}>{v}</Text>
                {settings.voice === v && <Text style={{ color: T.gold }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Depth Picker Modal */}
      <Modal visible={showDepthPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDepthPicker(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Depth Level</Text>
            <Text style={styles.pickerSub}>Adjust the complexity of your readings</Text>
            {DEPTH_OPTIONS.map((d, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.depth === d && styles.pickerOptionOn]}
                onPress={() => { updateSetting('depth', d); setShowDepthPicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.depth === d && styles.pickerOptionTextOn]}>{d}</Text>
                {settings.depth === d && <Text style={{ color: T.gold }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 64, paddingHorizontal: 22, paddingBottom: 25, position: 'relative', overflow: 'hidden' },
  heroGlyph: { position: 'absolute', right: 8, bottom: -22 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 18, marginBottom: 13, borderWidth: 3, borderColor: 'rgba(255,255,255,0.14)' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 30, color: 'white' },
  heroName: { fontFamily: FONTS.serif, fontSize: 28, color: 'white', marginBottom: 4 },
  heroBirth: { fontSize: 11, color: 'rgba(250,248,242,0.4)', marginBottom: 9 },
  signsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  signBadge: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11 },
  signBadgeText: { fontSize: 11, color: 'rgba(250,248,242,0.58)' },
  body: { paddingHorizontal: 19, paddingTop: 18 },
  pstats: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  pstat: { flex: 1, backgroundColor: 'white', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: T.border },
  pstatNum: { fontFamily: FONTS.serif, fontSize: 32, color: T.navy, lineHeight: 32 },
  pstatLbl: { fontSize: 11, color: T.stone, marginTop: 3 },
  pstatTags: { flexDirection: 'row', gap: 5, marginTop: 7, flexWrap: 'wrap' },
  miniTag: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  miniTagText: { fontSize: 10, color: '#6B6050' },
  secLbl: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },
  settingsCard: { backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 18 },
  prow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F0E6' },
  prowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  prowLabel: { fontSize: 14, color: T.navy, flex: 1 },
  prowVal: { fontSize: 13, color: T.stone },
  prowArr: { fontSize: 16, color: '#D0C8B4', marginLeft: 5 },
  signOut: { alignItems: 'center', paddingVertical: 16 },
  signOutText: { fontSize: 14, color: '#D44', fontFamily: FONTS.sansMedium },
  // Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  pickerCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 },
  pickerTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 4 },
  pickerSub: { fontSize: 13, color: T.stone, marginBottom: 16 },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F0E6' },
  pickerOptionOn: { borderBottomColor: 'rgba(200,168,75,0.2)' },
  pickerOptionText: { fontSize: 16, color: T.ink },
  pickerOptionTextOn: { color: T.navy, fontFamily: FONTS.sansSemiBold },
  // Engagement
  engageRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  engageCard: { flex: 1, backgroundColor: 'white', borderRadius: 15, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  engageEmoji: { fontSize: 20, marginBottom: 4 },
  engageNum: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy, lineHeight: 26 },
  engageLbl: { fontSize: 10, color: T.stone, marginTop: 2 },
  xpBarBg: { width: '80%', height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 6, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 2, backgroundColor: T.gold },
  // Badges
  badgeSection: { marginBottom: 18 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeItem: { width: '22%', backgroundColor: 'white', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  badgeLocked: { backgroundColor: '#F8F6F2', borderColor: '#EDE8E0' },
  badgeIcon: { fontSize: 22, marginBottom: 4 },
  badgeName: { fontSize: 9, color: T.navy, textAlign: 'center', fontFamily: FONTS.sansMedium },
  // Streak Rewards Roadmap
  roadmapCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border },
  roadmapRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0E8DA' },
  roadmapDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0E8DA', alignItems: 'center', justifyContent: 'center' },
  roadmapDotActive: { backgroundColor: 'rgba(200,168,75,0.15)' },
  roadmapLabel: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.stone },
  roadmapReward: { fontSize: 11, color: T.stone, marginTop: 1 },
  // Cosmic ID
  cosmicIDWrap: { marginBottom: 18, alignItems: 'center' },
  tapToShare: { fontSize: 11, color: T.stone, marginTop: 8, fontStyle: 'italic' },
  // Referral section
  referralCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 18 },
  referralGrad: { padding: 22, alignItems: 'center' },
  referralTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.gold, marginBottom: 6 },
  referralSub: { fontSize: 13, color: 'rgba(250,248,242,0.6)', marginBottom: 14 },
  referralStat: { fontSize: 12, color: T.gold, marginBottom: 10, fontFamily: FONTS.sansSemiBold },
  referralBtn: { backgroundColor: T.gold, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28 },
  referralBtnText: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: T.navy },
  referralCode: { fontSize: 11, color: 'rgba(250,248,242,0.35)', marginTop: 12, letterSpacing: 1 },
  // Dev section
  devCard: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 17, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)', overflow: 'hidden', marginBottom: 18 },
  devRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  devIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  devLabel: { fontSize: 14, color: T.navy, flex: 1, fontFamily: FONTS.sansMedium },
  debugBlock: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(200,168,75,0.1)' },
  debugKey: { fontSize: 10, letterSpacing: 1.5, color: T.gold, fontFamily: FONTS.sansSemiBold, marginBottom: 4, textTransform: 'uppercase' },
  debugVal: { fontSize: 12, color: T.ink, lineHeight: 18, marginBottom: 2 },
});
