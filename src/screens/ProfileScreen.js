import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { loadObject, saveObject, StorageKeys } from '../services/storage';
import { invalidatePersonaCache } from '../services/geminiService';
import { useTheme } from '../contexts/ThemeContext';
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
import { generateNotificationContent, buildNotificationData } from '../services/notificationContentEngine';
import { ForecastRepository } from '../services/database/rep_forecasts';
import { ReportRepository } from '../services/database/rep_reports';
import * as Notifications from 'expo-notifications';
import { getCosmicSeason, getMoonDataForDate, getActiveCosmicWindows, calculateCosmicEnergy } from '../services/astrologyService';
import { shareReferralLink, getReferralStats, getOrCreateReferralCode } from '../services/referralService';
import { useAuth } from '../contexts/AuthContext';
import { useRevenueCat } from '../contexts/RevenueCatContext';

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
  const { customerInfo, isPro, debugOverridePro, setDebugOverridePro } = useRevenueCat();
  const { preference: themePref, setThemePreference } = useTheme();
  const [settings, setSettings] = useState({ voice: 'Poetic', depth: 'Intermediate' });
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showDepthPicker, setShowDepthPicker] = useState(false);
  const [showAppearancePicker, setShowAppearancePicker] = useState(false);
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
    // Invalidate cached persona so next AI call picks up new settings
    invalidatePersonaCache();
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

  const APPEARANCE_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };
  const SETTINGS_LIST = [
    { icon: '🔔', bg: '#F0EAF8', label: 'Notifications', val: notifSummary, onPress: () => navigation.navigate('NotificationSettings') },
    { icon: '✨', bg: '#FFF2E4', label: 'Reading Voice', val: settings.voice, onPress: () => setShowVoicePicker(true) },
    { icon: '📊', bg: '#EAF0F8', label: 'Depth Level', val: settings.depth, onPress: () => setShowDepthPicker(true) },
    { icon: '🌗', bg: '#F0EEF4', label: 'Appearance', isToggle: true },
    { icon: '🌐', bg: '#F0F8F0', label: 'Time Zone', val: 'Auto', onPress: () => Alert.alert('Time Zone', 'Timezone is automatically detected from your device settings.') },
  ];

  const SETTINGS2_LIST = [
    { icon: '🔒', bg: '#F8F0F0', label: 'Privacy', onPress: handlePrivacy },
    { icon: '❓', bg: '#FFF8E8', label: 'Help & Support', onPress: handleHelp },
  ];

  const { colors, isDark } = useTheme();

  // Dynamic card style — applied to all white cards in this screen
  const cardStyle = { backgroundColor: colors.card, borderColor: colors.border };
  const cardAltStyle = { backgroundColor: colors.cardAlt, borderColor: colors.border };
  const textStyle = { color: colors.text };
  const headingStyle = { color: colors.heading };
  const subStyle = { color: colors.textSecondary };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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

        {/* Connect Account nudge */}
        {!user && (
          <TouchableOpacity
            style={styles.connectBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Auth')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.connectTitle}>Connect your account</Text>
              <Text style={styles.connectSub}>Back up your chart · access on any device</Text>
            </View>
            <Text style={styles.connectArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.body}>
          {/* Compact Streak/Level Strip */}
          {(streakInfo || xpInfo) && (
            <TouchableOpacity style={[styles.journeyStrip, cardStyle]} activeOpacity={0.7} onPress={() => navigation.navigate('Journey')}>
              {streakInfo && streakInfo.current_streak > 0 && (
                <View style={styles.journeyStripItem}>
                  <Text style={{ fontSize: 14 }}>{getStreakEmoji(streakInfo.current_streak)}</Text>
                  <Text style={[styles.journeyStripNum, headingStyle]}>{streakInfo.current_streak}</Text>
                  <Text style={[styles.journeyStripLbl, subStyle]}>Streak</Text>
                </View>
              )}
              {xpInfo?.levelInfo && (
                <View style={[styles.journeyStripItem, { borderLeftWidth: 1, borderLeftColor: colors.divider }]}>
                  <Text style={{ fontSize: 14 }}>✦</Text>
                  <Text style={[styles.journeyStripNum, headingStyle]}>{xpInfo.total_xp || 0}</Text>
                  <Text style={[styles.journeyStripLbl, subStyle]}>{xpInfo.levelInfo.current?.name || 'XP'}</Text>
                </View>
              )}
              {badges.length > 0 && (
                <View style={[styles.journeyStripItem, { borderLeftWidth: 1, borderLeftColor: colors.divider }]}>
                  <Text style={{ fontSize: 14 }}>🏅</Text>
                  <Text style={[styles.journeyStripNum, headingStyle]}>{badges.filter(b => b.unlocked).length}/{badges.length}</Text>
                  <Text style={[styles.journeyStripLbl, subStyle]}>Chapters</Text>
                </View>
              )}
              <Text style={{ fontSize: 16, color: colors.textMuted, marginLeft: 'auto' }}>›</Text>
            </TouchableOpacity>
          )}

          {/* Share Identity — single tap shares her Big 3 */}
          <TouchableOpacity
            style={[styles.journeyStrip, cardStyle, { justifyContent: 'center', gap: 8, paddingVertical: 12 }]}
            activeOpacity={0.7}
            onPress={() => {
              haptic.medium();
              shareCosmicID(`My Celestial Identity\n\n${astroMain}\n${astroChips.join(' · ')}\n\n— Generated with Celestia`);
            }}>
            <Text style={{ fontSize: 14 }}>📸</Text>
            <Text style={[{ fontSize: 13, fontFamily: FONTS.sansMedium }, headingStyle]}>Share My Cosmic ID</Text>
            <Text style={[{ fontSize: 12 }, subStyle]}>↗</Text>
          </TouchableOpacity>

          {/* Settings */}
          <Text style={[styles.secLbl, subStyle]}>PREFERENCES</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {SETTINGS_LIST.map((s, i) => {
              // Appearance row: inline 3-way toggle instead of modal
              if (s.isToggle) {
                return (
                  <View key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.prowIcon, { backgroundColor: isDark ? 'rgba(155,142,196,0.12)' : s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                    <Text style={[styles.prowLabel, textStyle, { marginRight: 'auto' }]}>{s.label}</Text>
                    <View style={[styles.appearanceToggle, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                      {[
                        { key: 'light', icon: '☀️' },
                        { key: 'system', icon: '⚙️' },
                        { key: 'dark', icon: '🌙' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.key}
                          style={[
                            styles.appearanceOpt,
                            themePref === opt.key && { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => { setThemePreference(opt.key); haptic.selection(); }}>
                          <Text style={{ fontSize: 14 }}>{opt.icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
              return (
                <TouchableOpacity key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7} onPress={s.onPress}>
                  <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                  <Text style={[styles.prowLabel, textStyle]}>{s.label}</Text>
                  {s.val ? <Text style={[styles.prowVal, subStyle]}>{s.val}</Text> : null}
                  <Text style={styles.prowArr}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subscription */}
          <Text style={[styles.secLbl, subStyle]}>SUBSCRIPTION</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {(() => {
              const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
              if (isPro && entitlement) {
                const purchaseDate = entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null;
                // Check activeSubscriptions from RevenueCat customerInfo for the actual active product
                const activeSubs = customerInfo?.activeSubscriptions || [];
                const activeProduct = activeSubs.length > 0 ? activeSubs[activeSubs.length - 1].toLowerCase() : '';
                const productId = (entitlement.productIdentifier || '').toLowerCase();
                const subId = activeProduct || productId;
                const expirationDate = entitlement.expirationDate ? new Date(entitlement.expirationDate) : null;
                // Determine plan from subscription period: if expiration is >35 days from purchase, it's yearly
                let planLabel = '';
                if (subId.includes('year') || subId.includes('annual')) {
                  planLabel = 'Yearly';
                } else if (subId.includes('month')) {
                  planLabel = 'Monthly';
                } else if (subId.includes('life') || subId.includes('forever')) {
                  planLabel = 'Lifetime';
                } else if (purchaseDate && expirationDate) {
                  const diffDays = (expirationDate - purchaseDate) / (1000 * 60 * 60 * 24);
                  planLabel = diffDays > 35 ? 'Yearly' : 'Monthly';
                }
                return (
                  <View style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]}>
                    <View style={[styles.prowIcon, { backgroundColor: '#FFF8E1' }]}><Text style={{ fontSize: 16 }}>{'⭐'}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prowLabel, textStyle]}>Celestia Pro{planLabel ? ` (${planLabel})` : ''}</Text>
                      {purchaseDate && (
                        <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Purchased {purchaseDate.toLocaleDateString()}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '700' }}>Active</Text>
                  </View>
                );
              }
              return (
                <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]} activeOpacity={0.7}
                  onPress={() => navigation.navigate('Paywall', { source: 'profile_upgrade' })}>
                  <View style={[styles.prowIcon, { backgroundColor: '#FFF8E1' }]}><Text style={{ fontSize: 16 }}>{'🔒'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prowLabel, textStyle]}>Free Plan</Text>
                    <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Go deeper with Pro</Text>
                  </View>
                  <Text style={styles.prowArr}>›</Text>
                </TouchableOpacity>
              );
            })()}
          </View>

          {/* Account */}
          <Text style={[styles.secLbl, subStyle]}>ACCOUNT</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {user ? (
              <>
                <View style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 1 }]}>
                  <View style={[styles.prowIcon, { backgroundColor: '#E8F5E9' }]}><Text style={{ fontSize: 16 }}>{'✓'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prowLabel, textStyle]}>Signed In</Text>
                    <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }} numberOfLines={1}>{user.email}</Text>
                  </View>
                </View>
                <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 1 }]} activeOpacity={0.7}
                  onPress={() => Alert.alert('Sign Out', 'Your data is saved locally and will sync again when you sign back in.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: authSignOut },
                  ])}>
                  <View style={[styles.prowIcon, { backgroundColor: '#F0F0F0' }]}><Text style={{ fontSize: 16 }}>{'↪'}</Text></View>
                  <Text style={[styles.prowLabel, textStyle]}>Sign Out</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]} activeOpacity={0.7}
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
              <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]} activeOpacity={0.7}
                onPress={() => navigation.navigate('Auth')}>
                <View style={[styles.prowIcon, { backgroundColor: '#F0EAF8' }]}><Text style={{ fontSize: 16 }}>{'☁'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prowLabel, textStyle]}>Sign In / Create Account</Text>
                  <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Sync your data across devices</Text>
                </View>
                <Text style={styles.prowArr}>{'›'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.secLbl, subStyle]}>GENERAL</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {SETTINGS2_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS2_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7} onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={[styles.prowLabel, textStyle]}>{s.label}</Text>
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
                {/* Pro Mode Toggle — simple big button */}
                <TouchableOpacity
                  style={[styles.devRow, { marginBottom: 4 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDebugOverridePro(isPro ? false : true);
                    haptic.medium();
                    Alert.alert(isPro ? 'Switched to FREE mode' : 'Switched to PRO mode', 'All screens will reflect the change immediately.');
                  }}>
                  <View style={[styles.devIcon, { backgroundColor: isPro ? 'rgba(76,175,80,0.2)' : 'rgba(232,80,80,0.15)' }]}>
                    <Text style={{ fontSize: 16 }}>{isPro ? '⭐' : '🔒'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.devLabel, textStyle]}>
                      {isPro ? 'PRO Mode Active' : 'FREE Mode Active'}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                      Tap to switch to {isPro ? 'FREE' : 'PRO'}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isPro ? 'rgba(76,175,80,0.2)' : 'rgba(200,168,75,0.12)', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: isPro ? 'rgba(76,175,80,0.3)' : 'rgba(200,168,75,0.2)' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONTS.sansSemiBold, color: isPro ? '#4CAF50' : T.gold }}>
                      {isPro ? 'Switch to FREE' : 'Enable PRO'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Clear ALL Report + PDF Cache */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    haptic.medium();
                    try {
                      const profileId = userProfile?.id || 'default';
                      // 1. Clear SQLite report cache (both full_report and deep_pdf)
                      await ReportRepository.deleteReportsForProfile(profileId);
                      // 2. Clear SQLite deep report cache by wiping all report types
                      const { getDB } = require('../services/database/client');
                      const db = await getDB();
                      await db.runAsync('DELETE FROM reports;');
                      // 3. Clear PDF files from file system cache
                      try {
                        const { File, Paths } = require('expo-file-system/next');
                        const cacheDir = new File(Paths.cache);
                        if (cacheDir.exists) {
                          const files = cacheDir.list ? cacheDir.list() : [];
                          for (const f of files) {
                            if (f.includes('celestia') && f.endsWith('.pdf')) {
                              try { new File(Paths.cache, f).delete(); } catch (e) {}
                            }
                          }
                        }
                      } catch (e) {}
                      Alert.alert('All Caches Cleared', 'Report content + PDF files wiped. Everything will regenerate fresh.');
                    } catch (e) {
                      Alert.alert('Error', e.message || 'Failed to clear caches');
                    }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🗑</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Clear All Report + PDF Cache</Text>
                  <Text style={[styles.prowArr, { color: 'rgba(200,168,75,0.5)' }]}>›</Text>
                </TouchableOpacity>

                {/* Show Onboarding */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={() => navigation.navigate('OnboardingFlow')}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>✦</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Show Onboarding</Text>
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
                      const now = new Date();
                      const profileId = userProfile?.id || 'default';
                      const today = now.toISOString().split('T')[0];
                      const key = `${profileId}_today_${today}`;
                      const forecast = await ForecastRepository.getForecast(key);
                      const streak = await getStreakData(profileId);
                      const moonData = getMoonDataForDate(now);
                      const cosmicWindows = userProfile?.chart ? getActiveCosmicWindows(userProfile.chart, now) : [];
                      const energyData = userProfile?.chart ? calculateCosmicEnergy(userProfile.chart, now, 'today', userProfile?.birthDate ? new Date(userProfile.birthDate) : undefined) : null;
                      const data = buildNotificationData(userProfile, forecast, moonData, energyData, cosmicWindows, streak);
                      const categories = ['COSMIC_MORNING', 'EVENING_REFLECTION', 'TRANSIT_ALERT', 'STREAK_GUARDIAN', 'WEEKLY_DIGEST'];
                      let sent = false;
                      for (const cat of categories) {
                        const content = generateNotificationContent(cat, data, []);
                        if (content) {
                          await Notifications.scheduleNotificationAsync({
                            content: {
                              title: content.title,
                              body: content.body,
                              data: { category: cat },
                            },
                            trigger: { type: 'timeInterval', seconds: 2, repeats: false },
                          });
                          Alert.alert('Sent', `[${cat}] "${content.title}" in 2 seconds`);
                          sent = true;
                          break;
                        }
                      }
                      if (!sent) {
                        Alert.alert('No Data', 'No notification content available. Open Today tab first to generate forecast data.');
                      }
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔔</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Send Real Notification (2s)</Text>
                </TouchableOpacity>

                {/* Schedule All Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      const profileId = userProfile?.id || 'default';
                      const today = new Date().toISOString().split('T')[0];
                      const key = `${profileId}_today_${today}`;
                      const now = new Date();
                      const forecast = await ForecastRepository.getForecast(key);
                      const streak = await getStreakData(profileId);
                      const moonData = getMoonDataForDate(now);
                      const cosmicWindows = userProfile?.chart ? getActiveCosmicWindows(userProfile.chart, now) : [];
                      const energyData = userProfile?.chart ? calculateCosmicEnergy(userProfile.chart, now, 'today', userProfile?.birthDate ? new Date(userProfile.birthDate) : undefined) : null;
                      await scheduleAllNotifications(userProfile, forecast, streak, moonData, energyData, cosmicWindows);
                      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                      Alert.alert('Done', `${scheduled.length} notifications scheduled with full cosmic data`);
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>📬</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Schedule All Notifications</Text>
                </TouchableOpacity>

                {/* Cancel All Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    await cancelAllNotifications();
                    Alert.alert('Done', 'All scheduled notifications cancelled');
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🚫</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Cancel All Notifications</Text>
                </TouchableOpacity>

                {/* Show Scheduled Notifications */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
                    if (scheduled.length === 0) {
                      Alert.alert('No Notifications', 'No notifications are currently scheduled.');
                      return;
                    }
                    const lines = scheduled.map((n, i) => {
                      const t = n.trigger;
                      let when = '';
                      if (t?.type === 'date' && t?.date) {
                        when = new Date(t.date).toLocaleString();
                      } else if (t?.type === 'daily') {
                        when = `Daily at ${String(t.hour || 0).padStart(2, '0')}:${String(t.minute || 0).padStart(2, '0')}`;
                      } else if (t?.dateComponents) {
                        const dc = t.dateComponents;
                        when = `${dc.hour || 0}:${String(dc.minute || 0).padStart(2, '0')}`;
                      } else if (t?.value) {
                        when = new Date(t.value).toLocaleString();
                      } else {
                        when = JSON.stringify(t);
                      }
                      const cat = n.content.data?.category || '';
                      return `${i + 1}. [${cat}] ${n.content.title || 'No title'}\n   ${when}\n   ${(n.content.body || '').slice(0, 80)}`;
                    });
                    Alert.alert(
                      `${scheduled.length} Scheduled Notifications`,
                      lines.join('\n\n')
                    );
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>📋</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Show Scheduled Notifications</Text>
                </TouchableOpacity>

                {/* Show Notification Permission */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const perm = await Notifications.getPermissionsAsync();
                    Alert.alert('Permission Status', JSON.stringify(perm.status, null, 2));
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔐</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Notification Permission</Text>
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
                  <Text style={[styles.devLabel, textStyle]}>Load Today's Forecast Data</Text>
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
                  <Text style={[styles.devLabel, textStyle]}>Clear Cache & Reload Today</Text>
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
                        trigger: { type: 'timeInterval', seconds: 2, repeats: false },
                      });
                      Alert.alert('Sent', `Excerpt notification in 2s:\n\n${forecast.notificationExcerpt.title}\n${forecast.notificationExcerpt.body}`);
                    } catch (e) { Alert.alert('Error', e.message); }
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>✉️</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Send Navigator Excerpt Notif</Text>
                </TouchableOpacity>

                {/* Test Deep Link to Transits */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('Main', { screen: 'Today', params: { scrollToSection: 'transits' } });
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>🔗</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Deep Link → Today Transits</Text>
                </TouchableOpacity>

                {/* Notification Settings Dump */}
                <TouchableOpacity style={styles.devRow} activeOpacity={0.7}
                  onPress={async () => {
                    const ns = await getNotificationSettings();
                    Alert.alert('Notification Settings', JSON.stringify(ns, null, 2));
                  }}>
                  <View style={styles.devIcon}><Text style={{ fontSize: 14, color: T.gold }}>⚙️</Text></View>
                  <Text style={[styles.devLabel, textStyle]}>Dump Notification Settings</Text>
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
                    <Text style={[styles.devLabel, textStyle]}>Show Raw JSON</Text>
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
          <View style={[styles.pickerCard, cardStyle]}>
            <Text style={[styles.pickerTitle, headingStyle]}>Reading Voice</Text>
            <Text style={[styles.pickerSub, subStyle]}>Choose how Celestia speaks to you</Text>
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
          <View style={[styles.pickerCard, cardStyle]}>
            <Text style={[styles.pickerTitle, headingStyle]}>Depth Level</Text>
            <Text style={[styles.pickerSub, subStyle]}>Adjust the complexity of your readings</Text>
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

      {/* Appearance picker replaced with inline 3-way toggle in settings row */}
    </View>
  );
}

const styles = StyleSheet.create({
  connectBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.navy, marginHorizontal: 18, marginTop: 14, marginBottom: 2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)' },
  connectTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.cream, marginBottom: 2 },
  connectSub: { fontSize: 11, color: 'rgba(250,248,242,0.5)', fontFamily: FONTS.sansLight },
  connectArrow: { fontSize: 18, color: T.gold, marginLeft: 8 },
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
  pstat: { flex: 1, borderRadius: 15, padding: 15, borderWidth: 1 },
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
  appearanceToggle: { flexDirection: 'row', borderRadius: 12, padding: 3, borderWidth: 1, gap: 2 },
  appearanceOpt: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  journeyStrip: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  journeyStripItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 8 },
  journeyStripNum: { fontFamily: FONTS.serif, fontSize: 18 },
  journeyStripLbl: { fontSize: 9, letterSpacing: 0.5 },
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
  devLabel: { fontSize: 14, flex: 1, fontFamily: FONTS.sansMedium },
  debugBlock: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(200,168,75,0.1)' },
  debugKey: { fontSize: 10, letterSpacing: 1.5, color: T.gold, fontFamily: FONTS.sansSemiBold, marginBottom: 4, textTransform: 'uppercase' },
  debugVal: { fontSize: 12, color: T.ink, lineHeight: 18, marginBottom: 2 },
});
