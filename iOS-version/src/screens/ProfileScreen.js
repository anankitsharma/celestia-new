import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SetupRequiredState from '../components/SetupRequiredState';

// V1 legal URLs — replace with hosted URLs before submission.
// (See iOS-version/plan/04-privacy-policy.md and 05-terms-of-service.md.)
const PRIVACY_URL = 'https://celestia.app/privacy';
const TERMS_URL = 'https://celestia.app/terms';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { loadObject, saveObject, loadBoolean, StorageKeys } from '../services/storage';
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
import { loadDemoData } from '../services/database/demoData';
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

const VOICE_OPTIONS = ['Poetic', 'Psychological', 'Direct', 'Reflective'];
const DEPTH_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen({ navigation }) {
  const { userProfile, setUserProfile, reloadProfiles } = useUserProfile();
  const { deleteAccount } = useAuth();
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
  // V1 hybrid: astrology details (chart link + sign chips) hidden by default.
  // User toggles ON via Preferences. Fresh installs (App Review) start OFF.
  const [showAstrology, setShowAstrology] = useState(false);
  // Discovery banner — visible first 3 Profile visits when toggle is OFF.
  // Solves "where's my chart?" without showing astrology by default.
  const [bannerViews, setBannerViews] = useState(99);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // V1.2 — Placeholder profile flag (set by × close button on onboarding).
  // Re-read on focus so banner disappears the moment user fills real details.
  const [isPlaceholderProfile, setIsPlaceholderProfile] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const v = await loadBoolean('celestia_profile_is_placeholder');
        if (mounted) setIsPlaceholderProfile(v);
      })();
      return () => { mounted = false; };
    }, [])
  );

  useEffect(() => {
    (async () => {
      const { loadBoolean, loadObject, saveObject } = await import('../services/storage');
      try { setShowAstrology(await loadBoolean('celestia_show_astrology_v1')); } catch {}
      try {
        const bs = (await loadObject('celestia_profile_banner_v1')) || { views: 0, dismissed: false };
        setBannerViews(bs.views);
        setBannerDismissed(bs.dismissed);
        if (!bs.dismissed && bs.views < 3) {
          await saveObject('celestia_profile_banner_v1', { ...bs, views: bs.views + 1 });
        }
      } catch {}
    })();
  }, []);

  const toggleShowAstrology = async (value) => {
    setShowAstrology(value);
    const { saveBoolean } = await import('../services/storage');
    try { await saveBoolean('celestia_show_astrology_v1', value); } catch {}
  };

  const dismissBanner = async () => {
    setBannerDismissed(true);
    const { saveObject, loadObject } = await import('../services/storage');
    const bs = (await loadObject('celestia_profile_banner_v1')) || { views: 0, dismissed: false };
    try { await saveObject('celestia_profile_banner_v1', { ...bs, dismissed: true }); } catch {}
  };

  const showDiscoveryBanner = !showAstrology && !bannerDismissed && bannerViews < 3;

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
  const name = userProfile?.name || 'friend';
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
      'This will clear your information and return to onboarding. Are you sure?',
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
      'Celestia uses Google Gemini AI to generate personalized pattern readings.\n\nYour information stays on this device. Tap Reset App Data anytime to clear it completely.\n\nQuestions? Email support@celestia.app',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy',
      'Your information stays on this device.\n\nWhen you ask Celestia a question, the message is sent to our AI provider over an encrypted connection to generate a response, then discarded.\n\nNo personal data is sold or shared with third parties. Tap Reset App Data anytime to wipe everything.',
      [{ text: 'OK' }]
    );
  };

  // V1.2 — Find support (Apple 1.4.1 reachable safety resources).
  // A quiet, non-alarming entry point so crisis resources are accessible
  // when needed, without being placed on a welcome screen where they'd
  // frame the user's state negatively. The same hotlines also surface
  // contextually inside the chat when the client-side intercept fires.
  const handleFindSupport = () => {
    Alert.alert(
      'Find support',
      'If you need to talk to someone trained, these are good first calls:\n\n• 988 — call or text (Suicide & Crisis Lifeline, US)\n• Text HOME to 741741 (Crisis Text Line)\n• 1-800-799-7233 (National Domestic Violence Hotline, US)\n\nOutside the US, your local helpline is always a good first call.',
      [{ text: 'Got it' }]
    );
  };

  // V1.2 — Send something to the team (Apple 1.2 — UGC/AI flag mechanism).
  // A second entry point so users who scrolled past a response — or want to
  // share anything else they noticed — can reach the team easily. The email
  // body commits to 24-hour reply, which 1.2 requires.
  const handleReportContent = () => {
    const subject = encodeURIComponent('Something I’d like the Celestia team to see');
    const body = encodeURIComponent(
      'Hi Celestia team,\n\nThere\'s something I\'d love for you to take a look at:\n\n[a few words about what you noticed and where]\n\nThanks for reading — the team replies within 24 hours.\n— Sent from Celestia iOS'
    );
    const url = `mailto:support@celestia.app?subject=${subject}&body=${body}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Email isn\'t set up',
        'You can write to us at support@celestia.app and we\'ll reply within 24 hours.',
        [{ text: 'Got it' }]
      );
    });
  };

  const APPEARANCE_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };
  const SETTINGS_LIST = [
    { icon: '🔔', bg: '#F2EAEE', label: 'Notifications', val: notifSummary, onPress: () => navigation.navigate('NotificationSettings') },
    { icon: '✨', bg: '#FFF2E4', label: 'Reading Voice', val: settings.voice, onPress: () => setShowVoicePicker(true) },
    { icon: '📊', bg: '#EAEDF2', label: 'Depth Level', val: settings.depth, onPress: () => setShowDepthPicker(true) },
    { icon: '🌗', bg: '#F0EEF4', label: 'Appearance', isToggle: true },
    { icon: '🌐', bg: '#F0F8F0', label: 'Time Zone', val: 'Auto', onPress: () => Alert.alert('Time Zone', 'Timezone is automatically detected from your device settings.') },
  ];

  const SETTINGS2_LIST = [
    { icon: '🔒', bg: '#F8F0F0', label: 'Privacy', onPress: handlePrivacy },
    { icon: '❓', bg: '#FFF8E8', label: 'Help & Support', onPress: handleHelp },
    // V1.2 — Apple 1.4.1: reachable safety resources, kept quiet and non-alarming.
    { icon: '🌿', bg: '#EAF2EA', label: 'Find support', onPress: handleFindSupport },
    // V1.2 — Apple 1.2: generative-AI flag mechanism. Warm phrasing, same job.
    { icon: '✉️', bg: '#F4ECE5', label: 'Send something to the team', onPress: handleReportContent },
  ];

  const { colors, isDark } = useTheme();

  // Dynamic card style — applied to all white cards in this screen
  const cardStyle = { backgroundColor: colors.card, borderColor: colors.border };
  const cardAltStyle = { backgroundColor: colors.cardAlt, borderColor: colors.border };
  const textStyle = { color: colors.text };
  const headingStyle = { color: colors.heading };
  const subStyle = { color: colors.textSecondary };

  // V1.2 — Empty state when user skipped onboarding (placeholder profile).
  if (isPlaceholderProfile) {
    return (
      <SetupRequiredState
        subtitle={"Add your birth details to unlock your\nfull profile, chart, and reflections."}
        onAddDetails={() => navigation.navigate('OnboardingFlow', { startAt: 6 })}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero — V1.2: theme-aware. Light: slate-cream wash + ink type.
            Dark: burgundy ramp + cream type. Avatar gradient is clay in both
            modes (it's the brand mark, not a hero treatment). */}
        <LinearGradient
          colors={isDark ? colors.heroGradient : ['#F2EEE5', '#EFEADE', '#EBE5D5']}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.hero}>
          {showAstrology && (
            <View style={styles.heroGlyph} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: isDark ? 'rgba(245,237,227,0.06)' : 'rgba(92,36,52,0.06)' }}>{signGlyph}</Text></View>
          )}
          <TouchableOpacity activeOpacity={0.8}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants">
            <LinearGradient colors={['#7A3A4A', '#5C2434']} style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.heroName, { color: colors.heading }]} accessibilityRole="header">{name}</Text>
          {birthInfo ? <Text style={[styles.heroBirth, { color: colors.textSecondary }]}>{birthInfo}</Text> : null}
          {/* V1 hybrid: sign badges hidden unless user opts in via Preferences */}
          {showAstrology && (
            <View style={styles.signsRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {signBadges.map((s, i) => (
                <View key={i} style={styles.signBadge}><Text style={styles.signBadgeText}>{s}</Text></View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* V1: Connect Account nudge removed — no auth in v1. */}

        <View style={styles.body}>
          {/* V1: Discovery banner — solves "where's my chart?" without showing
              astrology by default. Visible first 3 Profile visits when toggle is OFF. */}
          {showDiscoveryBanner && (
            <View style={{
              backgroundColor: isDark ? 'rgba(200,168,75,0.14)' : 'rgba(200,168,75,0.10)',
              borderRadius: 14, padding: 14, marginBottom: 14,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(200,168,75,0.40)' : 'rgba(200,168,75,0.28)',
              flexDirection: 'row', alignItems: 'center', gap: 12,
            }}>
              {/* Sparkle badge — replaces the bare ✦ text glyph that rendered
                  inconsistently across iOS/iPadOS (sometimes as a colored emoji,
                  sometimes as a thin stroke). SVG path is theme-aware. */}
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isDark ? 'rgba(200,168,75,0.18)' : 'rgba(200,168,75,0.16)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M12 1.5 L13.6 9.4 L21.5 11 L13.6 12.6 L12 20.5 L10.4 12.6 L2.5 11 L10.4 9.4 Z"
                    fill={T.gold}
                  />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 2 }}>
                  Want the deeper layer?
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>
                  Turn on details to unlock your full reading, chart, and Deep Readings reports.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 8, alignSelf: 'flex-start', backgroundColor: T.gold, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, minHeight: 44, minWidth: 44, justifyContent: 'center' }}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Turn on astrology details"
                  onPress={() => { haptic.light(); toggleShowAstrology(true); dismissBanner(); }}>
                  <Text style={{ fontSize: 11, color: T.navy, fontFamily: FONTS.sansSemiBold }}>Turn on</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={dismissBanner} style={{ padding: 4 }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Dismiss banner">
                <Text style={{ fontSize: 14, color: colors.textSecondary }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* V1: Compact Streak/Level/Chapters strip removed for the
              minimal-approval submission. The strip linked to the Journey
              screen which surfaces full gamification state. v1.1 reactivation. */}

          {/* Share Identity — single tap shares her Big 3 */}
          <TouchableOpacity
            style={[styles.journeyStrip, cardStyle, { justifyContent: 'center', gap: 8, paddingVertical: 12 }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Share my profile"
            onPress={() => {
              haptic.medium();
              shareCosmicID(`My Celestia Profile\n\n${astroMain}\n${astroChips.join(' · ')}\n\n— Generated with Celestia`);
            }}>
            <Text style={{ fontSize: 14 }}>📸</Text>
            <Text style={[{ fontSize: 13, fontFamily: FONTS.sansMedium }, headingStyle]}>Share My Profile</Text>
            <Text style={[{ fontSize: 12 }, subStyle]}>↗</Text>
          </TouchableOpacity>

          {/* Settings */}
          <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>PREFERENCES</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {SETTINGS_LIST.map((s, i) => {
              // Appearance row: inline 3-way toggle instead of modal
              if (s.isToggle) {
                return (
                  <View key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.prowIcon, { backgroundColor: isDark ? 'rgba(168,139,160,0.12)' : s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
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
                          accessibilityRole="radio"
                          accessibilityLabel={opt.key === 'light' ? 'Light mode' : opt.key === 'dark' ? 'Dark mode' : 'System mode'}
                          accessibilityState={{ selected: themePref === opt.key }}
                          onPress={() => { setThemePreference(opt.key); haptic.selection(); }}>
                          <Text style={{ fontSize: 14 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{opt.icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
              return (
                <TouchableOpacity key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={s.val ? `${s.label}, ${s.val}` : s.label}
                  onPress={s.onPress}>
                  <View style={[styles.prowIcon, { backgroundColor: s.bg }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                  <Text style={[styles.prowLabel, textStyle]}>{s.label}</Text>
                  {s.val ? <Text style={[styles.prowVal, subStyle]}>{s.val}</Text> : null}
                  <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">›</Text>
                </TouchableOpacity>
              );
            })}
            {/* V1 hybrid: opt-in toggle for astrology details (chart link, sign chips) */}
            <TouchableOpacity
              style={[styles.prow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              accessibilityRole="switch"
              accessibilityLabel="Show astrology details — chart link and sign labels"
              accessibilityState={{ checked: !!showAstrology }}
              onPress={() => toggleShowAstrology(!showAstrology)}>
              <View style={[styles.prowIcon, { backgroundColor: '#F2EAEE' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'◐'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prowLabel, textStyle]}>Show astrology details</Text>
                <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Show chart link and sign labels</Text>
              </View>
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: showAstrology ? T.gold : colors.border,
                padding: 2,
                justifyContent: 'center',
              }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: '#fff',
                  alignSelf: showAstrology ? 'flex-end' : 'flex-start',
                }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* V1: Subscription section removed for App Store first submission. */}

          {/* Deep Readings — gated by astrology toggle (Path A).
              Reports content is full astrology PDFs which is saturated-category
              4.3(b) territory. Default users have no path to Reports. */}
          {showAstrology && (
            <>
              <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>DEEP READINGS</Text>
              <View style={[styles.settingsCard, cardStyle]}>
                <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider, borderBottomWidth: 0 }]} activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Reports and readings — Love Compass, Career and Colleagues, Year of Patterns, and more"
                  onPress={() => navigation.navigate('Reports')}>
                  <View style={[styles.prowIcon, { backgroundColor: '#FFF8E1' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'📜'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prowLabel, textStyle]}>Reports & Readings</Text>
                    <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>Love Compass, Career & Colleagues, Year of Patterns, more</Text>
                  </View>
                  <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{'›'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* PDF §04 Profile sections — only shown when astrology details opt-in is ON.
              Each section deep-links into ChartScreen with an anchor param. */}
          {showAstrology && (
            <>
              <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>YOUR PROFILE</Text>
              <View style={[styles.settingsCard, cardStyle]}>
                {[
                  { id: 'overview', label: 'Personality blueprint', desc: 'Sun, Moon, Rising — the headline of who you are', icon: '◐' },
                  { id: 'love', label: 'Love & connection', desc: 'Venus and Mars — how you love and want to be loved', icon: '♡' },
                  { id: 'communication', label: 'Communication & mind', desc: 'Mercury — how you process and express', icon: '☿' },
                  { id: 'family', label: 'Family & roots', desc: 'Moon and 4th house — where you come from', icon: '🏠' },
                  { id: 'career', label: 'Career & purpose', desc: 'Midheaven and 10th house — your direction', icon: '◆' },
                  { id: 'shadow', label: 'Shadow patterns', desc: 'Pluto, Saturn, 8th and 12th houses — what runs deep', icon: '☾' },
                  { id: 'transits', label: 'Current patterns', desc: 'What\'s activating right now', icon: '↻' },
                  { id: 'year', label: 'Year ahead', desc: 'Themes for the months to come', icon: '↗' },
                ].map((row, i, arr) => (
                  <TouchableOpacity
                    key={row.id}
                    style={[styles.prow, { borderBottomColor: colors.divider, borderBottomWidth: i === arr.length - 1 ? 0 : 1 }]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label} — ${row.desc}`}
                    onPress={() => navigation.navigate('Chart', { section: row.id })}>
                    <View style={[styles.prowIcon, { backgroundColor: '#F2EAEE' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{row.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.prowLabel, textStyle]}>{row.label}</Text>
                      <Text style={{ fontSize: 11, color: T.stone, marginTop: 1 }}>{row.desc}</Text>
                    </View>
                    <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{'›'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Legal — Apple 4.0 / 5.1.1 require functional links */}
          <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>LEGAL</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 1 }]} activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy. Opens in browser."
              onPress={() => Linking.openURL(PRIVACY_URL)}>
              <View style={[styles.prowIcon, { backgroundColor: '#F2EAEE' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'🔒'}</Text></View>
              <Text style={[styles.prowLabel, textStyle]}>Privacy Policy</Text>
              <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 1 }]} activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Terms of Service. Opens in browser."
              onPress={() => Linking.openURL(TERMS_URL)}>
              <View style={[styles.prowIcon, { backgroundColor: '#F2EAEE' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'📄'}</Text></View>
              <Text style={[styles.prowLabel, textStyle]}>Terms of Service</Text>
              <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]} activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel="Email support. Opens mail app."
              onPress={() => Linking.openURL('mailto:support@celestia.app')}>
              <View style={[styles.prowIcon, { backgroundColor: '#F2EAEE' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'✉'}</Text></View>
              <Text style={[styles.prowLabel, textStyle]}>Support</Text>
              <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">›</Text>
            </TouchableOpacity>
          </View>

          {/* V1.2 — Developer-only demo data loader. Gated behind __DEV__ so it
              compiles out of EAS production builds (Apple never sees this). */}
          {__DEV__ && (
            <>
              <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>DEVELOPER</Text>
              <View style={[styles.settingsCard, cardStyle]}>
                <TouchableOpacity
                  style={[styles.prow, { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Fill demo data for screenshots. Replaces existing data with curated fixtures."
                  onPress={() => Alert.alert(
                    'Fill Demo Data',
                    'This will replace your existing data with curated demo content for App Store screenshots:\n\n• 1 user profile (Sasha)\n• 3 Connections (partner, friend, parent)\n• 5 journal entries\n• 1 chat session\n\nThis cannot be undone.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Fill',
                        onPress: async () => {
                          try {
                            const result = await loadDemoData();
                            // V1.2 — Force the UserProfileContext to re-read from
                            // SQLite. Without this, the in-memory userProfile +
                            // partnerProfiles state is stale (still the previous
                            // user) and Splash routes to Main with old data.
                            if (typeof reloadProfiles === 'function') {
                              await reloadProfiles();
                            }
                            Alert.alert(
                              'Demo Data Loaded',
                              `Seeded ${result.connectionCount} connections, ${result.journalCount} journal entries, and 1 chat session.\n\nThe app will reload now.`,
                              [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] }) }]
                            );
                          } catch (e) {
                            Alert.alert('Error', e?.message || 'Demo data load failed. Check the console.');
                          }
                        },
                      },
                    ]
                  )}>
                  <View style={[styles.prowIcon, { backgroundColor: '#F0F4F8' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'✦'}</Text></View>
                  <Text style={[styles.prowLabel, textStyle]}>Fill Demo Data</Text>
                  <Text style={[styles.prowArr, subStyle]}>›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* App Data — Apple 5.1.1(v) requires data deletion */}
          <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>APP DATA</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            <TouchableOpacity style={[styles.prow, { borderBottomColor: colors.divider }, { borderBottomWidth: 0 }]} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Reset app data — erases profile, partners, journal, chats, and all local data. This cannot be undone."
              onPress={() => Alert.alert(
                'Reset App Data',
                'This will erase your profile, partners, journal, chats, and all local data. Your device will return to a fresh-install state.\n\nThis cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset Everything',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteAccount();
                        // Force the React tree to re-read profiles from a now-
                        // empty SQLite. Without this, UserProfileContext's
                        // cached state still holds the old profile until the
                        // next mount, which can briefly leak the old name /
                        // avatar between the wipe and the navigation reset.
                        if (typeof reloadProfiles === 'function') {
                          try { await reloadProfiles(); } catch {}
                        }
                        Alert.alert('App Data Reset', 'All local data has been cleared.', [
                          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] }) },
                        ]);
                      } catch (e) {
                        Alert.alert('Error', e?.message || 'Could not reset data. Please try again.');
                      }
                    },
                  },
                ]
              )}>
              <View style={[styles.prowIcon, { backgroundColor: '#FFF0F0' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{'✕'}</Text></View>
              <Text style={[styles.prowLabel, { color: '#D44' }]}>Reset App Data</Text>
            </TouchableOpacity>
          </View>

          <Text accessibilityRole="header" style={[styles.secLbl, subStyle]}>GENERAL</Text>
          <View style={[styles.settingsCard, cardStyle]}>
            {SETTINGS2_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, { borderBottomColor: colors.divider }, i === SETTINGS2_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={s.label}
                onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={[styles.prowLabel, textStyle]}>{s.label}</Text>
                <Text style={styles.prowArr} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOut} activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Reset profile"
            onPress={handleSignOut}>
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
                          body: forecast.notificationExcerpt.body || forecast.navigatorHeadline || 'Your daily briefing is ready.',
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
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close picker"
          onPress={() => setShowVoicePicker(false)}>
          <View style={[styles.pickerCard, cardStyle]} accessibilityViewIsModal={true}>
            <Text accessibilityRole="header" style={[styles.pickerTitle, headingStyle]}>Reading Voice</Text>
            <Text style={[styles.pickerSub, subStyle]}>Choose how Celestia speaks to you</Text>
            {VOICE_OPTIONS.map((v, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.voice === v && styles.pickerOptionOn]}
                accessibilityRole="radio"
                accessibilityLabel={v}
                accessibilityState={{ selected: settings.voice === v }}
                onPress={() => { updateSetting('voice', v); setShowVoicePicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.voice === v && styles.pickerOptionTextOn]}>{v}</Text>
                {settings.voice === v && <Text style={{ color: T.gold }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Depth Picker Modal */}
      <Modal visible={showDepthPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1}
          accessibilityRole="button"
          accessibilityLabel="Close picker"
          onPress={() => setShowDepthPicker(false)}>
          <View style={[styles.pickerCard, cardStyle]} accessibilityViewIsModal={true}>
            <Text accessibilityRole="header" style={[styles.pickerTitle, headingStyle]}>Depth Level</Text>
            <Text style={[styles.pickerSub, subStyle]}>Adjust the complexity of your readings</Text>
            {DEPTH_OPTIONS.map((d, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.depth === d && styles.pickerOptionOn]}
                accessibilityRole="radio"
                accessibilityLabel={d}
                accessibilityState={{ selected: settings.depth === d }}
                onPress={() => { updateSetting('depth', d); setShowDepthPicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.depth === d && styles.pickerOptionTextOn]}>{d}</Text>
                {settings.depth === d && <Text style={{ color: T.gold }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✓</Text>}
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
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : 64, paddingHorizontal: 22, paddingBottom: 28, position: 'relative', overflow: 'hidden' },
  heroGlyph: { position: 'absolute', right: 8, bottom: -22 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, marginBottom: 13, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream },
  heroName: { fontFamily: FONTS.serif, fontSize: 28, color: T.ink, marginBottom: 4, letterSpacing: -0.4 },
  heroBirth: { fontSize: 11, color: T.inkDim, marginBottom: 9, fontFamily: FONTS.sans, letterSpacing: 0.2 },
  signsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  signBadge: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.hairline, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11 },
  signBadgeText: { fontSize: 11, color: T.inkDim, fontFamily: FONTS.sansMedium },
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
