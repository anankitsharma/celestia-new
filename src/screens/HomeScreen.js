import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Modal, TextInput, Alert, Dimensions, Platform, StatusBar, Animated, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getMoonDataForDate, getTransitPlanets, getActiveCosmicWindows, isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance, getCosmicSeason, getUpcomingEclipse } from '../services/astrologyService';
import { fetchExtendedForecast, generateMoonRitual, generateMonthlyRecap, generateFirstWeekRecap, generateMoonCyclePattern, generateProDailyInsight, generateProWeek1Recap } from '../services/geminiService';
import { RevenueCatService } from '../services/revenueCatService';
import { ReportRepository } from '../services/database/rep_reports';
import { useAnalytics, EVENTS, getFeatureFlag } from '../services/analytics';
import { ForecastRepository } from '../services/database/rep_forecasts';
import { loadObject, saveObject, loadString, saveString, loadBoolean, saveBoolean, StorageKeys } from '../services/storage';
import { haptic } from '../services/hapticService';
import { recordDailyCheckIn, getStreakEmoji, getMilestoneMessage, restoreBrokenStreak } from '../services/streakService';
import { trackEvent } from '../services/achievementService';
import { awardXP, getXPStatus } from '../services/xpService';
import { getLevelInfo } from '../constants/levels';
import WelcomeBackModal from '../components/WelcomeBackModal';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import QuestCard from '../components/QuestCard';
import CosmicTooltip from '../components/CosmicTooltip';
import AstroText from '../components/AstroText';
import { scheduleAllNotifications, hasNotificationPermission, requestNotificationPermission, getNotificationSettings, saveNotificationSettings } from '../services/notificationService';
import { refillCosmicLinesIfNeeded, getCosmicLineForDate } from '../services/cosmicLineService';
import { getTodayUnlock, markUnlockShown, getUnlockProgress, UNLOCK_NARRATIVES } from '../services/unlockService';
import { calculateSynastryScore, calculateZodiacOnlyScore, ROLE_COLORS } from '../services/astrology/SynastryService';
import { getElementGreeting, getCosmicArchetype } from '../services/cosmicIdentityService';
import { getNextBadgeProgress } from '../services/achievementService';
import { getTodayQuests, completeQuestAction } from '../services/questService';
import { getCosmicWhisper } from '../services/cosmicWhisperService';
import { getNarrativeContext } from '../services/narrativeService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { JournalRepository } from '../services/database/rep_journal';
import { detectIndecisionPhrase } from '../services/journalAnalysisService';
import { maybeGetSurpriseInsight } from '../services/surpriseInsightService';
import { buildUserProperties } from '../services/analytics';
import { SkeletonBriefingCard } from '../components/Skeleton';
import Button from '../components/Button';
import DailyShareCard from '../components/DailyShareCard';
import DailyStoryCard from '../components/DailyStoryCard';
import MonthlyRecapCard from '../components/MonthlyRecapCard';
import { useShareCard } from '../components/ShareCard';
import StreakMilestoneModal from '../components/StreakMilestoneModal';
import LevelUpModal from '../components/LevelUpModal';
import MercuryRxCard from '../components/MercuryRxCard';
import LunarEventCard from '../components/LunarEventCard';
import WhisperShareCard from '../components/WhisperShareCard';
import { useRevenueCat } from '../contexts/RevenueCatContext';


const { width: SCREEN_W } = Dimensions.get('window');

const MOON_PHASE_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};


const PERIOD_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

const PLANET_GLYPHS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

const JOURNAL_KEY = 'celestia_journal_entries';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
};

// Time modes for adaptive content ordering + tone
const getTimeMode = () => {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return 'morning';   // Action-focused, Navigate Toward first
  if (h >= 10 && h < 17) return 'afternoon'; // Lighter, quick prompts
  if (h >= 17 && h < 23) return 'evening';   // Reflective, journal, Navigate Around emphasis
  return 'latenight';                          // Comfort mode, no upsells, soft tone
};

// Hero gradient adapts to time AND content type. V1.2 Light Liquid Glass:
// LIGHT maps are 3-stop ivory tints over T.surfaceWarm so the hero integrates
// with the cream canvas. DARK maps keep the original warm plum-navy.
const HERO_GRADIENTS_DARK = {
  morning:   ['#5A2840', '#5A2840', '#3A1A28'],           // Warm plum-navy (not cold blue)
  afternoon: ['#5A2840', '#5A2840', '#3A1A28'],           // Same warm base
  evening:   ['#3A1A28', '#5A2840', '#3A1A28'],           // Deeper plum, intimate
  latenight: ['#1F0F18', '#1F0F18', '#0F0710'],           // Softest, muted — comfort
};
const HERO_GRADIENTS_LIGHT = {
  morning:   ['#FBF5EA', '#F7F0E2', '#F4ECDB'],           // Sunrise warmth on ivory
  afternoon: ['#F7F0E2', '#F4ECDB', '#F1E7D2'],           // Midday cream
  evening:   ['#F2E9DA', '#EEE2CD', '#EBDCC1'],           // Dusk amber-cream
  latenight: ['#EFE7D5', '#ECE1C9', '#E8DBBC'],           // Soft sand at night
};

// Content-type gradient tints — subtle undertone shift based on today's energy
const CONTENT_GRADIENTS_DARK = {
  love:       ['#1E1020', '#201228', '#18101E'],           // Rose-plum undertone
  career:     ['#141828', '#161A30', '#121628'],           // Blue-navy (structured)
  energy:     ['#141E18', '#161A20', '#12181A'],           // Green-teal (vitality)
  headsup:    ['#1E1610', '#201818', '#181410'],           // Amber undertone (alert)
  greenlight: ['#101E14', '#142018', '#101A14'],           // Green (go)
  reflection: ['#181020', '#5A2840', '#3A1A28'],           // Deep purple (introspective)
};
const CONTENT_GRADIENTS_LIGHT = {
  love:       ['#FBEFE8', '#F8E8DD', '#F4DFD0'],           // Warm rose
  career:     ['#F1EAD8', '#EDE2C8', '#E9DAB8'],           // Champagne (focus)
  energy:     ['#ECF1E5', '#E4ECDB', '#DCE5CC'],           // Soft moss (vitality)
  headsup:    ['#F5E9D4', '#EFDFBE', '#E8D2A7'],           // Amber (alert)
  greenlight: ['#E5EEDF', '#DCE7D2', '#D2DEC4'],           // Sage green (go)
  reflection: ['#EFE5E7', '#E7DAE0', '#DED1D7'],           // Mauve reflection
};

// Greeting adapts to emotional context by time
const getAdaptiveGreeting = (timeMode, firstName) => {
  switch (timeMode) {
    case 'morning':   return `Good morning`;
    case 'afternoon': return `Good afternoon`;
    case 'evening':   return `Good evening`;
    case 'latenight': return `Hey, ${firstName}`;
    default:          return `Good morning`;
  }
};

const formatDateHeader = (date = new Date()) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Goal-echo motivation map — friendly text from the onboarding step-2 selection.
// Used by the trial-period goal-echo block on Today (commitment-consistency primer).
const MOTIVATION_TEXT = {
  self: 'understand yourself better',
  change: 'navigate something big',
  love: 'find clarity in a relationship',
  curious: 'explore what\'s possible',
};

export default function HomeScreen({ navigation, route }) {
  const { isPro } = useRevenueCat();
  const { colors, isDark } = useTheme();
  const { capture } = useAnalytics();
  const { userProfile, partnerProfiles, isLoading: profileLoading } = useUserProfile();

  const [activeTab, setActiveTab] = useState('today');
  const [moonData, setMoonData] = useState(null);
  const [transitPlanets, setTransitPlanets] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [trialGoalEcho, setTrialGoalEcho] = useState(null);
  const [trialSummary, setTrialSummary] = useState(null);
  const [trialLossWarning, setTrialLossWarning] = useState(null);


  // Domain modal
  const [lifeAreaModal, setLifeAreaModal] = useState(null); // area key: 'love' | 'career' | 'vitality' | 'growth' | 'social' | null

  const [showBriefing, setShowBriefing] = useState(false);

  // Journal
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalMood, setJournalMood] = useState(null);
  const [journalEnergy, setJournalEnergy] = useState(5);

  // Cosmic windows & retrograde
  const [cosmicWindows, setCosmicWindows] = useState([]);
  const [mercuryRx, setMercuryRx] = useState(false);
  const [upcomingEclipse, setUpcomingEclipse] = useState(null);
  const [cosmicWhisper, setCosmicWhisper] = useState(null);
  const [todayCosmicLine, setTodayCosmicLine] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Cosmic weather & change detection
  const [cosmicChange, setCosmicChange] = useState(null);
  const [transitSignificance, setTransitSignificance] = useState(0);

  // Cosmic season
  const [cosmicSeason, setCosmicSeason] = useState(null);

  // Drip-feed unlock
  const [todayUnlock, setTodayUnlock] = useState(null);

  // Monthly recap
  const [monthlyRecap, setMonthlyRecap] = useState(null);
  const [showRecap, setShowRecap] = useState(false);

  // Moon ritual
  const [showMoonRitual, setShowMoonRitual] = useState(false);
  const [moonRitual, setMoonRitual] = useState(null);
  const [moonRitualLoading, setMoonRitualLoading] = useState(false);
  const [ritualIntention, setRitualIntention] = useState('');
  const [ritualSaved, setRitualSaved] = useState(false);

  // Engagement
  const [streakData, setStreakData] = useState(null);
  const [xpData, setXpData] = useState(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showFreezeOffer, setShowFreezeOffer] = useState(false);
  const [showWakeTimeBackfill, setShowWakeTimeBackfill] = useState(false);
  const [firstWeekRecap, setFirstWeekRecap] = useState(null); // { headline, observation, threadForward }
  const [indecisionMatch, setIndecisionMatch] = useState(null); // { phrase, date }
  const [surpriseInsight, setSurpriseInsight] = useState(null); // { kicker, insight, dayShown }
  const [showNpsPrompt, setShowNpsPrompt] = useState(false);
  const [showAtRiskBanner, setShowAtRiskBanner] = useState(false);
  const [streakRestoreOffer, setStreakRestoreOffer] = useState(null); // { previousStreak, freezesRemaining }
  const [proInsight, setProInsight] = useState(null); // { headline, body } — Pro-only daily layer
  const [proWeek1Recap, setProWeek1Recap] = useState(null); // { headline, body, cta, suggestedTab? } — Day 7 of Pro
  const [d30RevealCallback, setD30RevealCallback] = useState(null); // { firstReveal } — month-one emotional callback
  const [pendingBadge, setPendingBadge] = useState(null);
  const streakAnim = useRef(new Animated.Value(1)).current;
  const xpFloatAnim = useRef(new Animated.Value(0)).current;
  const xpFloatOpacity = useRef(new Animated.Value(0)).current;
  const [xpGainText, setXpGainText] = useState('');

  // Retention features
  const [journalCount, setJournalCount] = useState(0);
  const [questData, setQuestData] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [whisperRarity, setWhisperRarity] = useState(null);

  // Evening mood rating
  const [eveningMood, setEveningMood] = useState(null);

  // Celebration modals
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);

  const [narrativeCtx, setNarrativeCtx] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mainScrollRef = useRef(null);
  // tabScrollRef removed — tabs now inside hero
  const transitsRef = useRef(null);

  const scrollToTransits = useCallback(() => {
    if (transitsRef.current && mainScrollRef.current) {
      transitsRef.current.measureLayout(
        mainScrollRef.current.getInnerViewRef?.() || mainScrollRef.current,
        (x, y) => mainScrollRef.current.scrollTo({ y: y - 80, animated: true }),
        () => { }
      );
    }
  }, []);
  const { cardRef: shareCardRef, captureAndShare } = useShareCard();
  const { cardRef: storyCardRef, captureAndShare: shareStory } = useShareCard();
  const { cardRef: recapCardRef, captureAndShare: shareRecap } = useShareCard();
  const { cardRef: rxCardRef, captureAndShare: shareRxCard } = useShareCard();
  const { cardRef: lunarCardRef, captureAndShare: shareLunarCard } = useShareCard();
  const { cardRef: whisperCardRef, captureAndShare: shareWhisperCard } = useShareCard();

  const today = new Date();
  const name = userProfile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  // XP float animation helper
  const showXPGain = useCallback((amount) => {
    setXpGainText(`+${amount} Stardust`);
    xpFloatAnim.setValue(0);
    xpFloatOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(xpFloatAnim, { toValue: -30, duration: 1200, useNativeDriver: true }),
      Animated.timing(xpFloatOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]).start();
  }, []);

  // Process badge unlocks
  const processBadges = useCallback((badges) => {
    if (badges?.length > 0) {
      setPendingBadge(badges[0].badge);
      haptic.success();
    }
  }, []);

  // Load base data on mount
  useEffect(() => {
    if (!userProfile?.chart) return;
    let moon = null;
    try { moon = getMoonDataForDate(today); setMoonData(moon); } catch (e) { console.error(e); }
    try { setTransitPlanets(getTransitPlanets(today)); } catch (e) { console.error(e); }
    loadJournalEntry();

    // Cosmic windows & retrograde
    try {
      const windows = getActiveCosmicWindows(userProfile.chart, today);
      setCosmicWindows(windows.slice(0, 3));
      setMercuryRx(isMercuryRetrograde(today));
    } catch (e) { console.error('Cosmic windows error:', e); }

    // Eclipse detection
    try {
      const eclipse = getUpcomingEclipse(today);
      setUpcomingEclipse(eclipse);
    } catch (e) { }

    // Cosmic change detection ("What's New Today" banner)
    try {
      const change = getCosmicChangeToday(userProfile.chart);
      setCosmicChange(change);
    } catch (e) { console.error('Cosmic change error:', e); }

    // Transit significance (for Cosmic Download days)
    try {
      const sig = calculateTransitSignificance(userProfile.chart, today);
      setTransitSignificance(sig);
    } catch (e) { }

    // Cosmic season
    try {
      const season = getCosmicSeason(userProfile.chart, today);
      setCosmicSeason(season);
    } catch (e) { }

    // Narrative context for story continuity
    getNarrativeContext(userProfile?.id || 'default', userProfile.chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => { });

    // Journal count for recap
    JournalRepository.getEntryCount(userProfile?.id || 'default').then(c => setJournalCount(c)).catch(() => { });

    // Indecision-phrase mining — surfaces a chat-suggestion chip when the
    // user's recent journals contain "should I" / "torn between" / etc.
    detectIndecisionPhrase(userProfile?.id || 'default', 14)
      .then(match => { if (match?.phrase) setIndecisionMatch(match); })
      .catch(() => {});

    // Surprise insight — fires only on trigger days (D4/10/17/24) with a 30%
    // roll. Non-rolling days return null instantly. Variable reward layer.
    maybeGetSurpriseInsight(userProfile)
      .then(ins => { if (ins?.insight) setSurpriseInsight(ins); })
      .catch(() => {});

    // D30 reveal callback — re-surfaces the deeply-specific reveal statement
    // the user saw at onboarding. Closes the loop on the "wow" moment a month
    // later. One-shot per profile. Per Gap 8 in competitive-audit.
    (async () => {
      try {
        const alreadyShown = await loadBoolean(StorageKeys.D30_REVEAL_CALLBACK_SHOWN);
        if (alreadyShown) return;
        const firstReveal = await loadString(StorageKeys.FIRST_REVEAL_STATEMENT);
        if (!firstReveal) return;
        const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
        if (!firstUse) return;
        const start = new Date(firstUse + 'T00:00:00');
        const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
        const days = Math.floor((todayMid - start) / 86400000);
        // Window 30-32 days for tolerance (user might not open exactly on D30)
        if (days >= 30 && days <= 32) {
          setD30RevealCallback({ firstReveal });
        }
      } catch {}
    })();

    // Goal-echo block during trial — anchors today's read to the user's
    // stated motivation from onboarding. Commitment-consistency primer
    // (Cialdini): each return reaffirms "I came here for X."
    //
    // Also drives the D-1 trial summary surface (peak-end rule, Kahneman):
    // the last day of trial is the END moment that anchors memory of
    // the entire trial.
    (async () => {
      try {
        const info = await RevenueCatService.getCustomerInfo();
        const trialLen = RevenueCatService.getTrialLengthDays(info);
        if (trialLen === null) return; // only fires during active trial

        const prefs = await loadObject('celestia_persona_prefs').catch(() => null);
        const motivation = prefs?.motivation;
        if (motivation && MOTIVATION_TEXT[motivation]) {
          setTrialGoalEcho({ motivationText: MOTIVATION_TEXT[motivation], trialLengthDays: trialLen });
        }

        const daysUntilExp = RevenueCatService.getDaysUntilExpiration(info);
        // A/B flag: D-1 trial summary surface present vs absent.
        // PostHog flag `trial_summary_surface_enabled` (boolean).
        // Default true (Sprint 1 ships it on); set to false on control cohort.
        const summarySurfaceEnabled = getFeatureFlag('trial_summary_surface_enabled', true);
        if (daysUntilExp !== null && daysUntilExp <= 1 && summarySurfaceEnabled) {
          const profileId = userProfile?.id || 'default';
          const journalCount = await JournalRepository.getEntryCount(profileId).catch(() => 0);
          const firstReveal = await loadString(StorageKeys.FIRST_REVEAL_STATEMENT).catch(() => null);
          setTrialSummary({ trialLengthDays: trialLen, journalCount, firstReveal });
          try { capture('trial_summary_shown', { trial_length_days: trialLen, days_until_expiration: daysUntilExp, variant: 'enabled' }); } catch {}
        } else if (daysUntilExp !== null && daysUntilExp >= 2 && daysUntilExp <= 3 && trialLen === 7) {
          // D5 of 7-day trial: pair the trial-end push with an in-app
          // loss-frame surface listing 3 specific losses. Loss aversion
          // is ~2x stronger than gain framing (Kahneman).
          setTrialLossWarning({ daysUntilExp });
          try { capture('d5_loss_surface_shown', { trial_length_days: trialLen, days_until_expiration: daysUntilExp }); } catch {}
        }
      } catch {}
    })();

    // Annual renewal year-in-review — Spotify-Wrapped pattern. Triggers
    // when an annual subscriber is within 30 days of auto-renewal AND
    // hasn't seen this cycle's review. One-shot per renewal cycle.
    if (isPro) {
      (async () => {
        try {
          const info = await RevenueCatService.getCustomerInfo();
          const entitlement = info?.entitlements?.active?.['Celestia Pro'];
          if (!entitlement?.expirationDate || entitlement.willRenew === false) return;
          const exp = new Date(entitlement.expirationDate);
          const purchase = entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null;
          if (!purchase || isNaN(purchase.getTime())) return;
          // Annual plan = period > 90 days
          const periodDays = (exp - purchase) / 86400000;
          if (periodDays <= 90) return;
          const daysUntilExp = Math.floor((exp - Date.now()) / 86400000);
          if (daysUntilExp < 0 || daysUntilExp > 30) return;
          // One-shot per renewal cycle — key the storage by expiration ISO date
          const lastShown = await loadString(StorageKeys.YEAR_IN_REVIEW_SHOWN_AT);
          const expISO = exp.toISOString().split('T')[0];
          if (lastShown === expISO) return;
          await saveString(StorageKeys.YEAR_IN_REVIEW_SHOWN_AT, expISO);
          // Slight delay so the briefing card lands first
          setTimeout(() => {
            navigation.navigate('YearInReview');
          }, 1200);
        } catch {}
      })();
    }

    // Pro week-1 recap — at Day 7 of being Pro, generate a tailored recap
    // (engaged-user variant) or feature-discovery nudge (light-user variant).
    if (isPro) {
      (async () => {
        try {
          const shownAtStr = await loadString(StorageKeys.PRO_WEEK1_RECAP_SHOWN_AT);
          if (shownAtStr) return; // one-shot ever per Pro purchase

          const customerInfo = await RevenueCatService.getCustomerInfo();
          const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
          if (!entitlement) return;
          const purchaseDate = entitlement.originalPurchaseDate
            ? new Date(entitlement.originalPurchaseDate)
            : (entitlement.latestPurchaseDate ? new Date(entitlement.latestPurchaseDate) : null);
          if (!purchaseDate || isNaN(purchaseDate.getTime())) return;
          const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
          const purchaseMid = new Date(purchaseDate); purchaseMid.setHours(0, 0, 0, 0);
          const daysSincePro = Math.floor((todayMid - purchaseMid) / 86400000);
          if (daysSincePro < 7 || daysSincePro > 9) return; // 3-day window for tolerance

          // Cached?
          const cached = await loadObject(StorageKeys.PRO_WEEK1_RECAP);
          if (cached?.headline) {
            setProWeek1Recap(cached);
            return;
          }

          // Pull usage stats
          const profileId = userProfile?.id || 'default';
          const reports = await ReportRepository.getReportsForProfile(profileId).catch(() => []);
          const counters = await loadObject(StorageKeys.ACHIEVEMENT_COUNTERS).catch(() => null);
          const usage = {
            weeklyReports: (reports || []).filter(r => r.type === 'weekly').length,
            deepDives: counters?.deep_dives || 0,
            compatibilityChecks: counters?.matches_checked || 0,
            partnersAdded: (partnerProfiles?.length || 0),
            totalProActions: 0,
            suggestedFeature: null,
          };
          usage.totalProActions = usage.weeklyReports + usage.deepDives + usage.compatibilityChecks
            + Math.max(0, usage.partnersAdded - 3);
          // Pick suggested feature for light-user variant
          if (usage.weeklyReports === 0) usage.suggestedFeature = 'a weekly chart read';
          else if (usage.deepDives === 0) usage.suggestedFeature = 'a placement deep-dive';
          else if (usage.compatibilityChecks === 0) usage.suggestedFeature = 'a compatibility read';
          else usage.suggestedFeature = 'unlimited Circle entries';

          const recap = await generateProWeek1Recap(userProfile?.chart, usage).catch(() => null);
          if (recap?.headline) {
            // Attach suggestedTab for light-user CTA navigation
            const tabMap = {
              'a weekly chart read': 'Reports',
              'a placement deep-dive': 'Chart',
              'a compatibility read': 'Circle',
              'unlimited Circle entries': 'Circle',
            };
            recap.suggestedTab = usage.totalProActions <= 1 ? tabMap[usage.suggestedFeature] : null;
            await saveObject(StorageKeys.PRO_WEEK1_RECAP, recap);
            await saveString(StorageKeys.PRO_WEEK1_RECAP_SHOWN_AT, String(Date.now()));
            setProWeek1Recap(recap);
          }
        } catch {}
      })();
    }

    // At-risk intervention — if computed health_score < 40 AND not dismissed
    // in last 7 days, surface a soft self-help callout. Hook Model: prompt at
    // a moment of moderate motivation (the user did open the app — engage them).
    (async () => {
      try {
        const profileId = userProfile?.id || 'default';
        const props = await buildUserProperties(profileId);
        const score = props.health_score;
        if (typeof score === 'number' && score < 40) {
          const dismissedAtStr = await loadString(StorageKeys.AT_RISK_DISMISSED_AT);
          const dismissedAt = dismissedAtStr ? parseInt(dismissedAtStr, 10) : 0;
          const daysSinceDismiss = (Date.now() - dismissedAt) / 86400000;
          if (!dismissedAt || daysSinceDismiss > 7) {
            setShowAtRiskBanner(true);
            capture(EVENTS.AT_RISK_BANNER_SHOWN, { health_score: score, health_band: props.health_band });
          }
        }
      } catch {}
    })();

    // NPS sentiment prompt — every 30 days for active users (streak >= 3).
    // One-tap, low-friction. Feeds the health_score sentiment signal.
    (async () => {
      try {
        const last = await loadObject(StorageKeys.NPS_LAST_SUBMITTED);
        const lastAt = last?.at || 0;
        const daysSince = (Date.now() - lastAt) / 86400000;
        const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
        const installDate = firstUse ? new Date(firstUse + 'T00:00:00') : null;
        const daysSinceInstall = installDate ? Math.floor((Date.now() - installDate.getTime()) / 86400000) : 0;
        // Skip if: shown in last 30 days, OR user is on day 0-2 (too early), OR no streak yet
        if (daysSince > 30 && daysSinceInstall >= 3) {
          // Use a small delay so it doesn't slam down on first paint
          setTimeout(() => setShowNpsPrompt(true), 1200);
        }
      } catch {}
    })();

    // Monthly recap (1st-3rd of month)
    if (today.getDate() <= 3) {
      const recapKey = `recap_${today.getFullYear()}_${today.getMonth()}`;
      loadObject(recapKey).then(async (cached) => {
        if (cached) {
          setMonthlyRecap(cached);
          return;
        }
        // Generate recap for LAST month
        const fullChart = userProfile?.chart || null;
        const journalCount = await JournalRepository.getEntryCount(userProfile?.id || 'default').catch(() => 0);
        const recap = await generateMonthlyRecap(fullChart, {
          daysActive: streakData?.total_check_ins || 0,
          journalEntries: journalCount,
          longestStreak: streakData?.longest_streak || 0,
        });
        if (recap) {
          setMonthlyRecap(recap);
          await saveObject(recapKey, recap);
        }
      }).catch(() => { });
    }

    // Drip-feed unlock check
    getTodayUnlock().then(unlock => setTodayUnlock(unlock)).catch(() => { });

    // Cosmic whisper (variable rate + tiered rarity)
    getCosmicWhisper(userProfile?.chart).then(whisper => {
      if (whisper) {
        setCosmicWhisper(whisper.message);
        setWhisperRarity(whisper.rarity);
      }
    }).catch(() => { });

    // Streak + engagement
    (async () => {
      try {
        const profileId = userProfile.id || 'default';
        // Record check-in
        const streak = await recordDailyCheckIn(profileId);
        setStreakData(streak);

        // Analytics — fire only on new check-in (idempotent for same-day repeats)
        if (streak?.isNew) {
          if (streak.streakBroken) {
            capture(EVENTS.STREAK_BROKEN, {
              previous_streak: streak.previousStreak,
              days_absent: streak.daysAbsent,
              comeback_bonus: streak.comebackBonus,
              source: 'home',
            });
            // Streak restore offer — only if previous streak was meaningful (≥7)
            // AND user has a freeze AND we haven't offered restore in last 7 days
            if (streak.previousStreak >= 7 && streak.streak_freezes_remaining > 0) {
              try {
                const lastOfferStr = await loadString(StorageKeys.STREAK_RESTORE_OFFER_LAST);
                const lastOffer = lastOfferStr ? parseInt(lastOfferStr, 10) : 0;
                const daysSince = (Date.now() - lastOffer) / 86400000;
                if (!lastOffer || daysSince > 7) {
                  setStreakRestoreOffer({
                    previousStreak: streak.previousStreak,
                    freezesRemaining: streak.streak_freezes_remaining,
                  });
                }
              } catch {}
            }
          }
          if (streak.current_streak === 1 && !streak.streakBroken) {
            capture(EVENTS.STREAK_STARTED, { source: 'home' });
          }
          if (streak.freezeUsed) {
            capture(EVENTS.STREAK_FREEZE_USED, {
              days_absent: streak.daysAbsent,
              freezes_remaining: streak.streak_freezes_remaining,
              source: 'home',
            });
          }
          if (streak.milestoneHit) {
            capture(EVENTS.STREAK_MILESTONE_HIT, {
              streak: streak.milestoneHit,
              source: 'home',
            });
          }
        }

        // Show welcome back if returning after 2+ days
        if (streak?.daysAbsent >= 2 && streak?.isNew) {
          setShowWelcomeBack(true);
        }

        // Wake-time backfill — for users who finished onboarding before the
        // wake-time question existed. Detect by: morning settings still at the
        // 7:30am default AND backfill not yet prompted. One-shot inline card.
        try {
          const promptedAlready = await loadBoolean(StorageKeys.WAKE_TIME_BACKFILL_PROMPTED);
          if (!promptedAlready) {
            const onboarded = await loadBoolean(StorageKeys.ONBOARDING_COMPLETED);
            const settings = await getNotificationSettings();
            const usingDefault = settings.morningTime === 7 && settings.morningMinute === 30;
            if (onboarded && usingDefault) {
              setShowWakeTimeBackfill(true);
            }
          }
        } catch {}

        // Proactive D2-D3 freeze offer — pre-load loss aversion BEFORE the
        // user is at risk. Fires once per profile, in the early streak window,
        // when they actually have a freeze available.
        try {
          const alreadyShown = await loadBoolean(StorageKeys.FREEZE_OFFER_SHOWN);
          if (!alreadyShown && streak?.streak_freezes_remaining > 0 && streak?.current_streak >= 1) {
            const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
            if (firstUse) {
              const start = new Date(firstUse + 'T00:00:00');
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const daysSince = Math.floor((today - start) / 86400000);
              if (daysSince >= 1 && daysSince <= 3) {
                setShowFreezeOffer(true);
                capture(EVENTS.STREAK_FREEZE_OFFER_SHOWN, { days_since_install: daysSince, current_streak: streak.current_streak });
              }
            }
          }
        } catch {}

        // Streak animation on new check-in
        if (streak?.isNew && !streak?.streakBroken) {
          haptic.success();
          Animated.sequence([
            Animated.spring(streakAnim, { toValue: 1.3, tension: 80, friction: 4, useNativeDriver: true }),
            Animated.spring(streakAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
          ]).start();

          // Detect streak milestone (3, 7, 14, 30, 50, 100, 365)
          const milestones = [3, 7, 14, 30, 50, 100, 365];
          if (milestones.includes(streak.current_streak)) {
            setStreakMilestone({
              streak: streak.current_streak,
              emoji: getStreakEmoji(streak.current_streak),
              message: getMilestoneMessage(streak.current_streak),
            });

            // Permission re-ask at D7 + D14 + D30 milestones for users who
            // previously declined. Motivation peaks at milestones — the
            // second-best moment (after post-chart) to ask. Capped at 3
            // lifetime re-asks. Each milestone fires at most once per user.
            if (streak.current_streak === 7 || streak.current_streak === 14 || streak.current_streak === 30) {
              try {
                const hasPerm = await hasNotificationPermission();
                if (!hasPerm) {
                  const countStr = await loadString(StorageKeys.NOTIFICATION_REASKED_COUNT);
                  const count = countStr ? parseInt(countStr, 10) : 0;
                  if (count < 3) {
                    await saveString(StorageKeys.NOTIFICATION_REASKED_COUNT, String(count + 1));
                    // Slight delay so milestone modal lands first
                    setTimeout(() => setShowNotifModal(true), 1800);
                  }
                }
              } catch {}
            }
          }

          // D7 first-week recap — generate once, cache forever, show in a
          // separate modal stacked after the streak milestone modal dismisses.
          if (streak.current_streak === 7) {
            try {
              const cached = await loadObject(StorageKeys.FIRST_WEEK_RECAP);
              if (cached?.headline) {
                setFirstWeekRecap(cached);
              } else {
                const journalEntries = await JournalRepository.getEntryCount(profileId).catch(() => 0);
                // Pass the user's first reveal statement for continuity — closes
                // the loop on the onboarding "wow" moment per Gap 8.
                const firstReveal = await loadString(StorageKeys.FIRST_REVEAL_STATEMENT).catch(() => null);
                const stats = {
                  daysActive: 7,
                  journalEntries,
                  chatCount: 0, // best-effort; if we add ChatRepository.getMessageCount later, plumb here
                  partnerCount: partnerProfiles?.length || 0,
                  topTheme: null,
                  firstReveal,
                };
                generateFirstWeekRecap(userProfile?.chart, stats)
                  .then(async (recap) => {
                    if (recap?.headline) {
                      await saveObject(StorageKeys.FIRST_WEEK_RECAP, recap);
                      setFirstWeekRecap(recap);
                    }
                  })
                  .catch(() => {});
              }
            } catch {}
          }

          // D28 Moon Cycle pattern — same shape as the D7 recap. One full
          // lunar cycle of consistency is rare; reward it with earned content.
          if (streak.current_streak === 28) {
            try {
              const cached = await loadObject(StorageKeys.MOON_CYCLE_PATTERN);
              if (cached?.headline) {
                setFirstWeekRecap(cached); // reuse the recap modal — same UI shape
              } else {
                const journalEntries = await JournalRepository.getEntryCount(profileId).catch(() => 0);
                const stats = {
                  daysActive: 28,
                  journalEntries,
                  chatCount: 0,
                  partnerCount: partnerProfiles?.length || 0,
                };
                generateMoonCyclePattern(userProfile?.chart, stats)
                  .then(async (recap) => {
                    if (recap?.headline) {
                      await saveObject(StorageKeys.MOON_CYCLE_PATTERN, recap);
                      setFirstWeekRecap(recap);
                    }
                  })
                  .catch(() => {});
              }
            } catch {}
          }
        }

        // Award XP for daily check-in
        if (streak?.isNew) {
          const xp = await awardXP(profileId, 'daily_check_in');
          setXpData(xp?.levelInfo || null);
          if (xp) showXPGain(xp.amount);
          // Detect level-up
          if (xp?.leveledUp && xp?.newLevel) {
            setLevelUpData({ levelName: xp.newLevel.name, totalXP: xp.levelInfo?.total_xp || 0 });
          }
        } else {
          const xpStatus = await getXPStatus(profileId);
          setXpData(xpStatus?.levelInfo || null);
        }

        // Check streak badges
        if (streak?.isNew) {
          const badges = await trackEvent('streak_update', { current_streak: streak.current_streak });
          processBadges(badges);
        }

        // Check moon phase badge
        if (moon) {
          const moonBadges = await trackEvent('moon_phase', { phaseName: moon.phaseName });
          if (moonBadges?.length > 0 && !pendingBadge) processBadges(moonBadges);
        }

        // Check Mercury retrograde badge
        const mercury = getTransitPlanets(today)?.find(p => p.name === 'Mercury');
        if (mercury?.isRetrograde) {
          const rxBadges = await trackEvent('mercury_retrograde');
          if (rxBadges?.length > 0 && !pendingBadge) processBadges(rxBadges);
        }

        // Load daily quests
        getTodayQuests().then(qd => setQuestData(qd)).catch(() => { });

        // Load next badge progress
        getNextBadgeProgress().then(nb => setNextBadge(nb)).catch(() => { });

        // Session counting + notification soft-ask (after 3rd session)
        const todayKey = today.toISOString().split('T')[0];
        const lastSessionDate = await loadString(StorageKeys.SESSION_COUNT + '_date');
        if (lastSessionDate !== todayKey) {
          const count = parseInt(await loadString(StorageKeys.SESSION_COUNT) || '0', 10) + 1;
          await saveString(StorageKeys.SESSION_COUNT, String(count));
          await saveString(StorageKeys.SESSION_COUNT + '_date', todayKey);

          if (count >= 3) {
            const asked = await loadBoolean(StorageKeys.NOTIFICATION_ASKED);
            const hasPerm = await hasNotificationPermission();
            if (!asked && !hasPerm) {
              setTimeout(() => setShowNotifModal(true), 2000);
            }
          }
        }
      } catch (e) {
        console.error('Engagement init error:', e);
      }
    })();
  }, [userProfile]);

  // Reload journal status when screen regains focus (e.g. returning from JournalScreen)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { loadJournalEntry(); });
    return unsub;
  }, [navigation]);

  // Handle incoming navigation params (from notification deep-links)
  useEffect(() => {
    if (route?.params?.openJournal) {
      navigation.navigate('Journal', { mantra: forecast?.mantra });
      navigation.setParams({ openJournal: undefined });
    }
    if (route?.params?.scrollToSection === 'transits') {
      setTimeout(() => scrollToTransits(), 500);
      navigation.setParams({ scrollToSection: undefined });
    }
    if (route?.params?.highlightLifeArea && forecast?.lifeAreas) {
      const area = route.params.highlightLifeArea;
      const validAreas = ['love', 'career', 'vitality', 'growth', 'social'];
      if (validAreas.includes(area)) {
        setTimeout(() => setLifeAreaModal(area), 600);
      }
      navigation.setParams({ highlightLifeArea: undefined });
    }
  }, [route?.params, forecast]);

  // Load forecast when tab changes
  useEffect(() => {
    if (!userProfile?.chart) return;
    loadTabData(activeTab);
  }, [activeTab, userProfile]);

  const loadTabData = async (tab) => {
    setForecastLoading(true);
    try {
      const dateLabel = today.toISOString().split('T')[0];
      let tabTransits;
      try { tabTransits = getTransitPlanets(today); } catch { tabTransits = transitPlanets; }
      const planetaryData = {
        dateLabel,
        transits: tabTransits.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
      };
      // Briefing-mode rotation — Standard → Pattern → Partner → Archetype.
      // Only daily reads rotate; weekly/monthly/yearly stay 'standard'.
      // Hook Model: defeats finite-variability decay by changing the *format*
      // of the read every 7 days, not just the day's content.
      let briefingMode = 'standard';
      try {
        if (tab === 'today' || tab === 'tomorrow' || tab === 'yesterday') {
          const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
          if (firstUse) {
            const start = new Date(firstUse + 'T00:00:00');
            const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
            const days = Math.max(0, Math.floor((todayMid - start) / 86400000));
            const weeks = Math.floor(days / 7);
            briefingMode = ['standard', 'pattern', 'partner', 'archetype'][weeks % 4];
            // Don't switch to 'partner' mode if user has no Circle entries —
            // would force a relational frame on a relationally-empty user.
            if (briefingMode === 'partner' && (!partnerProfiles || partnerProfiles.length === 0)) {
              briefingMode = 'standard';
            }
          }
        }
      } catch {}
      const data = await fetchExtendedForecast(userProfile, tab, planetaryData, transitSignificance, narrativeCtx, briefingMode);
      setForecast(data);
      if (tab === 'today') {
        capture(EVENTS.DAILY_BRIEFING_VIEWED, { has_navigator: !!data?.navigatorHeadline });
      }

      // Pro daily insight — extra layer for paying users only. Cached per
      // (user × day). Gives a daily moment where the subscription delivers.
      if (tab === 'today' && isPro) {
        try {
          const proCacheKey = `pro_insight_${userProfile?.id || 'default'}_${dateLabel}`;
          const cached = await loadObject(proCacheKey);
          if (cached?.headline) {
            setProInsight(cached);
          } else {
            const transitContext = planetaryData?.transits || '';
            generateProDailyInsight(userProfile?.chart, transitContext, dateLabel)
              .then(async (insight) => {
                if (insight?.headline) {
                  await saveObject(proCacheKey, insight);
                  setProInsight(insight);
                }
              })
              .catch(() => {});
          }
        } catch {}
      } else {
        setProInsight(null);
      }
      // Schedule notifications with latest forecast (only on today tab)
      if (tab === 'today') {
        scheduleAllNotifications(userProfile, data, streakData, moonData, null, cosmicWindows).catch(() => { });
        const todayStr = dateLabel;
        getCosmicLineForDate(todayStr).then(line => setTodayCosmicLine(line)).catch(() => { });
        refillCosmicLinesIfNeeded(userProfile).then(generated => {
          if (generated) {
            scheduleAllNotifications(userProfile, data, streakData, moonData, null, cosmicWindows).catch(() => { });
            getCosmicLineForDate(todayStr).then(line => setTodayCosmicLine(line)).catch(() => { });
          }
        }).catch(e => console.warn('[CosmicLines] Refill failed:', e));
      }
    } catch (e) {
      console.error('Forecast error:', e);
    } finally {
      setForecastLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const chart = userProfile?.chart;
      if (chart) {
        try { setMoonData(getMoonDataForDate(new Date())); } catch { }
        try { setTransitPlanets(getTransitPlanets(new Date())); } catch { }
        try { setCosmicWindows(getActiveCosmicWindows(chart, new Date()).slice(0, 3)); } catch { }
        try { setCosmicChange(getCosmicChangeToday(chart)); } catch { }
        try { setTransitSignificance(calculateTransitSignificance(chart, new Date())); } catch { }
        try { setCosmicSeason(getCosmicSeason(chart, new Date())); } catch { }
      }
      await loadTabData(activeTab);
      getTodayQuests().then(qd => setQuestData(qd)).catch(() => { });
      getNextBadgeProgress().then(nb => setNextBadge(nb)).catch(() => { });
    } catch { } finally {
      setRefreshing(false);
    }
  }, [userProfile, activeTab]);

  const loadJournalEntry = async () => {
    try {
      const entries = await loadObject(JOURNAL_KEY) || {};
      const dateStr = today.toISOString().split('T')[0];
      if (entries[dateStr]) { setJournalText(entries[dateStr]); setJournalSaved(true); }
    } catch (e) { }
    // Load evening mood for today
    try {
      const moods = await loadObject('celestia_evening_moods') || {};
      const dateStr = today.toISOString().split('T')[0];
      if (moods[dateStr]) setEveningMood(moods[dateStr]);
    } catch (e) { }
  };

  const saveEveningMood = async (mood) => {
    setEveningMood(mood);
    haptic.light?.() || haptic.selection?.();
    try {
      const dateStr = today.toISOString().split('T')[0];
      const moods = await loadObject('celestia_evening_moods') || {};
      moods[dateStr] = mood;
      await saveObject('celestia_evening_moods', moods);
    } catch (e) { }
  };

  const saveJournalEntry = async () => {
    if (!journalText.trim()) return;
    haptic.success();
    try {
      const dateStr = today.toISOString().split('T')[0];
      const profileId = userProfile?.id || 'default';

      // Build enriched entry with mood/energy
      const enrichedContent = JSON.stringify({
        text: journalText.trim(),
        mood: journalMood,
        energy: journalEnergy,
      });

      // Save to AsyncStorage (legacy)
      const entries = await loadObject(JOURNAL_KEY) || {};
      entries[dateStr] = journalText.trim();
      await saveObject(JOURNAL_KEY, entries);

      // Save to SQLite with mood/energy in the prompt field as metadata
      const prompt = JSON.stringify({
        mantra: forecast?.mantra || '',
        mood: journalMood,
        energy: journalEnergy,
      });
      await JournalRepository.saveEntry(profileId, dateStr, journalText.trim(), prompt);

      setJournalSaved(true);
      setShowJournal(false);

      // XP for journal
      const xp = await awardXP(profileId, 'journal_entry');
      if (xp) showXPGain(xp.amount);

      // Quest completion
      completeQuestAction('journal_written').then(r => {
        if (r) { setQuestData(prev => prev ? { ...prev, quests: r.quests, allComplete: r.allComplete } : prev); }
        if (r?.justCompleted) {
          trackEvent('quest_complete').catch(() => { });
          awardXP(profileId, 'quest_bonus').then(xpB => { if (xpB) showXPGain(xpB.amount); }).catch(() => { });
        }
      }).catch(() => { });
    } catch (e) { console.error(e); }
  };

  const openMoonRitual = async () => {
    // Moon rituals are free — they build daily habit and emotional connection
    if (!moonData) return;

    const isNewMoon = moonData.phaseName === 'New Moon';
    setShowMoonRitual(true);
    setRitualSaved(false);
    setRitualIntention('');

    // Check if we already have a saved ritual for today
    const rituals = await loadObject(StorageKeys.MOON_RITUALS) || {};
    const todayStr = today.toISOString().split('T')[0];
    if (rituals[todayStr]) {
      setMoonRitual(rituals[todayStr].ritual);
      setRitualIntention(rituals[todayStr].intention || '');
      if (rituals[todayStr].intention) setRitualSaved(true);
      return;
    }

    // Generate new ritual
    setMoonRitualLoading(true);
    try {
      const chart = userProfile?.chart?.planets;
      const sig = chart ? `Sun: ${chart.find(p => p.name === 'Sun')?.sign}, Moon: ${chart.find(p => p.name === 'Moon')?.sign}, Rising: ${chart.find(p => p.name === 'Ascendant')?.sign}` : 'Unknown';
      const ritual = await generateMoonRitual(moonData, sig, isNewMoon);
      if (ritual) {
        setMoonRitual(ritual);
        const r = await loadObject(StorageKeys.MOON_RITUALS) || {};
        r[todayStr] = { ritual, intention: '', createdAt: Date.now() };
        await saveObject(StorageKeys.MOON_RITUALS, r);
      }
    } catch (e) {
      console.error('Moon ritual error:', e);
    } finally {
      setMoonRitualLoading(false);
    }
  };

  const saveMoonIntention = async () => {
    if (!ritualIntention.trim()) return;
    haptic.success();
    const todayStr = today.toISOString().split('T')[0];
    const rituals = await loadObject(StorageKeys.MOON_RITUALS) || {};
    if (rituals[todayStr]) {
      rituals[todayStr].intention = ritualIntention.trim();
    } else {
      rituals[todayStr] = { ritual: moonRitual, intention: ritualIntention.trim(), createdAt: Date.now() };
    }
    await saveObject(StorageKeys.MOON_RITUALS, rituals);
    setRitualSaved(true);

    // XP for moon ritual
    const profileId = userProfile?.id || 'default';
    const xp = await awardXP(profileId, 'moon_ritual');
    if (xp) showXPGain(xp.amount);
  };

  const LIFE_AREA_META = {
    love: { icon: '♡', title: 'Love & Relationships', sub: 'Intimacy · Romance · Self-Love', color: '#E85090', gradient: ['#3A0A2A', '#1A0A2E', '#3A1A28'] },
    career: { icon: '◆', title: 'Career & Finances', sub: 'Work · Ambition · Wealth', color: '#5090E8', gradient: ['#0A1A3A', '#3A1A28', '#3A1A28'] },
    vitality: { icon: '✦', title: 'Vitality & Wellness', sub: 'Energy · Health · Rhythm', color: '#50C878', gradient: ['#0A2A1A', '#0E1E22', '#3A1A28'] },
    growth: { icon: '◎', title: 'Growth & Inner Work', sub: 'Learning · Wisdom · Transformation', color: '#F59E0B', gradient: ['#2A1A0A', '#1E1610', '#3A1A28'] },
    social: { icon: '✧', title: 'Social & Community', sub: 'Connection · Communication · Influence', color: '#8B5CF6', gradient: ['#1A0A3A', '#140E2E', '#3A1A28'] },
  };

  if (profileLoading || !userProfile?.chart) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  const moonPhase = moonData?.phaseName || 'Waning Crescent';
  const moonSign = moonData?.sign || '—';
  const moonIcon = MOON_PHASE_ICONS[moonPhase] || '🌘';
  const isEvening = new Date().getHours() >= 18;
  const timeMode = getTimeMode();

  // Zodiac season detection — show banner when Sun enters new sign (first 3 days)
  const currentZodiacSeason = (() => {
    const sunTransit = transitPlanets.find(p => p.name === 'Sun');
    if (!sunTransit?.sign) return null;
    // Approximate season start dates (when Sun enters each sign)
    const SEASON_STARTS = {
      Aries: [3, 20], Taurus: [4, 19], Gemini: [5, 20], Cancer: [6, 20],
      Leo: [7, 22], Virgo: [8, 22], Libra: [9, 22], Scorpio: [10, 22],
      Sagittarius: [11, 21], Capricorn: [12, 21], Aquarius: [1, 19], Pisces: [2, 18],
    };
    const start = SEASON_STARTS[sunTransit.sign];
    if (!start) return null;
    const seasonStart = new Date(today.getFullYear(), start[0] - 1, start[1]);
    const daysSinceStart = Math.floor((today - seasonStart) / (1000 * 60 * 60 * 24));
    if (daysSinceStart >= 0 && daysSinceStart <= 3) {
      return { sign: sunTransit.sign, daysIn: daysSinceStart };
    }
    return null;
  })();
  const isLateNight = timeMode === 'latenight';

  // Planet strip
  const planetStrip = transitPlanets.slice(0, 6).map(p => ({
    glyph: PLANET_GLYPHS[p.name] || '★', name: p.name.toUpperCase(),
    pos: `${p.sign} ${p.degree.toFixed(0)}°${p.isRetrograde ? ' ℞' : ''}`
  }));

  // Split horoscope into paragraphs for structured display
  const horoscopeText = forecast?.detailedHoroscope || '';
  const paragraphs = horoscopeText.split('\n\n').filter(p => p.trim());
  const actionItems = forecast?.actionItems || [];

  const PARA_LABELS_DAILY = ['COSMIC CLIMATE', 'PERSONAL IMPACT', 'THE CHALLENGE', 'THE GUIDANCE'];
  const PARA_LABELS_WEEKLY = ['THE WEEKLY ARC', 'EARLY WEEK', 'MID-WEEK SHIFT', 'THE WEEKEND'];
  const PARA_LABELS_MONTHLY = ['THE THEME', 'FIRST HALF', 'SECOND HALF', 'POWER DATES'];

  const getParaLabels = () => {
    if (activeTab === 'weekly') return PARA_LABELS_WEEKLY;
    if (activeTab === 'monthly') return PARA_LABELS_MONTHLY;
    return PARA_LABELS_DAILY;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView ref={mainScrollRef} showsVerticalScrollIndicator={false} bounces={true}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.gold} colors={[T.gold]} />}>
        {/* ── HERO — rounded bottom, greeting + moon row + avatar ── */}
        {(() => {
          // Pick gradient: content-type tint if available, else time-based
          let ct = forecast?.contentType;
          if (!ct && forecast?.lifeAreas) {
            const areas = [{ key: 'love', type: 'love' }, { key: 'career', type: 'career' }, { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' }, { key: 'social', type: 'greenlight' }];
            const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
            if (top) ct = top.type;
          }
          const HERO_MAP = isDark ? HERO_GRADIENTS_DARK : HERO_GRADIENTS_LIGHT;
          const CONTENT_MAP = isDark ? CONTENT_GRADIENTS_DARK : CONTENT_GRADIENTS_LIGHT;
          const heroColors = (ct && CONTENT_MAP[ct]) || HERO_MAP[timeMode] || HERO_MAP.morning;
          // Hero text colors invert with mode: cream-on-dark or ink-on-cream.
          const heroFg = isDark ? T.cream : colors.heading;
          const heroFgMuted = isDark ? 'rgba(250,248,242,0.6)' : colors.textSecondary;
          const heroFgSoft = isDark ? 'rgba(250,248,242,0.7)' : colors.textSecondary;
          return (
            <LinearGradient colors={heroColors} locations={[0, 0.5, 1]} style={styles.hero}>
              {/* Row 1: Greeting + Name (left) | Streak pill + Avatar (right) */}
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.greeting, { color: heroFgMuted }]}>{getAdaptiveGreeting(timeMode, firstName)},</Text>
                  <Text style={[styles.heroName, { color: heroFg }]}>{firstName}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {/* Streak pill — elevated during trial (Duolingo pattern: stronger
                      loss-aversion when the streak is the first thing you see).
                      A/B flag: `streak_in_header_during_trial` (boolean, default true).
                      When false, streak stays at default size for trial users too. */}
                  {streakData && streakData.current_streak > 0 && !isLateNight && (() => {
                    const streakProminentFlag = getFeatureFlag('streak_in_header_during_trial', true);
                    const isElevated = trialGoalEcho && streakProminentFlag;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => { haptic.light(); setShowStreakModal(true); }}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                      >
                        <Animated.View style={[
                          styles.streakBadge,
                          !isDark && { backgroundColor: 'rgba(160,120,32,0.14)', borderColor: 'rgba(160,120,32,0.32)' },
                          isElevated && styles.streakBadgeTrial,
                          { transform: [{ scale: streakAnim }] },
                        ]}>
                          <Text style={{ fontSize: isElevated ? 17 : 14 }}>{moonIcon}</Text>
                          <Text style={[
                            styles.streakBadgeNum,
                            !isDark && { color: T.goldText },
                            isElevated && styles.streakBadgeNumTrial,
                          ]}>{streakData.current_streak}</Text>
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })()}
                  {/* Avatar */}
                  <TouchableOpacity
                    style={[
                      styles.avatar,
                      !isDark && { backgroundColor: 'rgba(92,36,52,0.06)', borderColor: 'rgba(92,36,52,0.18)' },
                      xpData && { borderWidth: 0 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => { haptic.light(); navigation.navigate('Profile'); }}>
                    <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
                    {xpData && (
                      <View style={[styles.avatarRing, { borderColor: xpData.levelInfo?.current?.ringColor || 'rgba(200,168,75,0.3)' }]} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Row 2: Moon phase — its own row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
                <Text style={{ fontSize: 18 }}>{moonIcon}</Text>
                <Text style={{ fontSize: 13, color: heroFgSoft, fontFamily: FONTS.sansMedium }}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold }}>{moonPhase}</Text>
                  {moonSign !== '—' ? ` in ` : ''}
                  {moonSign !== '—' && <Text style={{ fontFamily: FONTS.sansSemiBold }}>{moonSign}</Text>}
                  {moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}%` : ''}
                </Text>
                <CosmicTooltip id="moon_phase" size={14} light={isDark} />
              </View>
            </LinearGradient>
          );
        })()}

        {/* ── FLOATING TAB PILL — overlaps hero bottom edge ── */}
        <View style={styles.floatingTabWrap}>
          <View style={[styles.floatingTabBar, { backgroundColor: colors.card, borderColor: isDark ? colors.border : 'rgba(0,0,0,0.06)' }]}>
            {PERIOD_TABS.map((tab) => (
              <TouchableOpacity key={tab.key}
                style={[styles.floatingTab, activeTab === tab.key && styles.floatingTabOn]}
                onPress={() => {
                  haptic.selection(); setActiveTab(tab.key); mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                }} activeOpacity={0.7}>
                <Text style={[styles.floatingTabText, activeTab === tab.key && styles.floatingTabTextOn]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── ZODIAC SEASON BANNER — overlaps hero edge ── */}
        {activeTab === 'today' && currentZodiacSeason && !isLateNight && (() => {
          const SIGN_SEASON = {
            Aries: { glyph: '♈', element: 'Fire', color: '#E85050', emoji: '🔥', vibe: 'Bold energy. New beginnings. Time to initiate.' },
            Taurus: { glyph: '♉', element: 'Earth', color: '#50A868', emoji: '🌿', vibe: 'Grounded energy. Slow down. Savor what you have.' },
            Gemini: { glyph: '♊', element: 'Air', color: '#50A0C8', emoji: '💨', vibe: 'Curious energy. Conversations spark. Stay open.' },
            Cancer: { glyph: '♋', element: 'Water', color: '#7090D0', emoji: '🌊', vibe: 'Emotional energy. Home and roots call. Nurture yourself.' },
            Leo: { glyph: '♌', element: 'Fire', color: '#E8A040', emoji: '☀️', vibe: 'Radiant energy. Express yourself. Be seen.' },
            Virgo: { glyph: '♍', element: 'Earth', color: '#8B9E7E', emoji: '🌾', vibe: 'Refined energy. Details matter. Serve with purpose.' },
            Libra: { glyph: '♎', element: 'Air', color: '#C4918A', emoji: '⚖️', vibe: 'Harmonizing energy. Seek balance in relationships.' },
            Scorpio: { glyph: '♏', element: 'Water', color: '#9B8EC4', emoji: '🦂', vibe: 'Intense energy. Go deep. Transform what no longer serves.' },
            Sagittarius: { glyph: '♐', element: 'Fire', color: '#E87050', emoji: '🏹', vibe: 'Expansive energy. Adventure calls. Trust the journey.' },
            Capricorn: { glyph: '♑', element: 'Earth', color: '#97907F', emoji: '🏔️', vibe: 'Ambitious energy. Build something lasting. Stay disciplined.' },
            Aquarius: { glyph: '♒', element: 'Air', color: '#50C8E8', emoji: '⚡', vibe: 'Innovative energy. Break the mold. Think differently.' },
            Pisces: { glyph: '♓', element: 'Water', color: '#A080E0', emoji: '🌙', vibe: 'Intuitive energy. Dreams speak. Trust what you feel.' },
          };
          const s = SIGN_SEASON[currentZodiacSeason.sign] || { glyph: '☉', element: '?', color: T.gold, emoji: '✦', vibe: 'A new season begins.' };
          const isYourSeason = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign === currentZodiacSeason.sign;
          return (
            <View style={{ marginHorizontal: 20, backgroundColor: isDark ? s.color + '15' : s.color + '10', borderWidth: 1, borderColor: s.color + '25', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: s.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: s.color }}>{s.glyph} {currentZodiacSeason.sign.toUpperCase()} SEASON</Text>
                  {isYourSeason && (
                    <View style={{ backgroundColor: s.color + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 7, fontFamily: FONTS.sansSemiBold, color: s.color, letterSpacing: 0.5 }}>YOUR SIGN</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 14, color: colors.heading, marginBottom: 2 }}>
                  {isYourSeason ? `This is your season, ${firstName}` : `${currentZodiacSeason.sign} Season is here`}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 16 }}>{s.vibe}</Text>
              </View>
            </View>
          );
        })()}

        <View style={styles.content}>

          {/* ── ECLIPSE SEASON BANNER ── */}
          {activeTab === 'today' && upcomingEclipse && (
            <View style={{ backgroundColor: '#5A2840', borderWidth: 1, borderColor: 'rgba(155,142,196,0.2)', borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 24 }}>{upcomingEclipse.type === 'solar' ? '🌑' : '🌕'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: '#9B8EC4', marginBottom: 3 }}>ECLIPSE SEASON</Text>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 14, color: T.cream }}>
                  {upcomingEclipse.daysUntil <= 0
                    ? `${upcomingEclipse.label} — happening now`
                    : upcomingEclipse.daysUntil === 1
                    ? `${upcomingEclipse.label} — tomorrow`
                    : `${upcomingEclipse.label} in ${upcomingEclipse.daysUntil} days`}
                </Text>
                <Text style={{ fontSize: 10.5, color: 'rgba(250,248,242,0.45)', marginTop: 2, lineHeight: 15 }}>
                  Eclipses accelerate change. Avoid starting major new things — let the cosmic dust settle first.
                </Text>
              </View>
            </View>
          )}

          {/* ── D5 LOSS-FRAME WARNING — pairs with the D5 trial-end push.
              Lists 3 specific Pro features the user would lose access to
              after the trial ends. Loss aversion (Kahneman). */}
          {activeTab === 'today' && trialLossWarning && (
            <View style={styles.lossWarningCard}>
              <Text style={styles.lossWarningKicker}>
                {trialLossWarning.daysUntilExp <= 2 ? 'TRIAL ENDS IN 2 DAYS' : 'TRIAL ENDS SOON'}
              </Text>
              <Text style={[styles.lossWarningHeadline, { color: colors.heading }]}>
                What you'd lose access to:
              </Text>
              <View style={styles.lossWarningRow}>
                <Text style={styles.lossWarningGlyph}>✦</Text>
                <Text style={[styles.lossWarningItem, { color: colors.text }]}>
                  Daily Pro insight on Today
                </Text>
              </View>
              <View style={styles.lossWarningRow}>
                <Text style={styles.lossWarningGlyph}>◆</Text>
                <Text style={[styles.lossWarningItem, { color: colors.text }]}>
                  Weekly reports — love, career, lunar, purpose
                </Text>
              </View>
              <View style={styles.lossWarningRow}>
                <Text style={styles.lossWarningGlyph}>♡</Text>
                <Text style={[styles.lossWarningItem, { color: colors.text }]}>
                  Full-depth AI chat (no message cap)
                </Text>
              </View>
              <Text style={[styles.lossWarningFooter, { color: colors.textSecondary }]}>
                Your chart, journals, and Circle stay yours either way.
              </Text>
            </View>
          )}

          {/* ── D-1 TRIAL SUMMARY — peak-end rule (Kahneman). Renders only on the
              final day of the trial. The end-of-trial moment is the END that
              anchors the entire memory of the trial. Frame as celebration of
              what the user built, not as a charge-warning. */}
          {activeTab === 'today' && trialSummary && (
            <View style={styles.trialSummaryCard}>
              <Text style={styles.trialSummaryKicker}>YOUR TRIAL</Text>
              <Text style={[styles.trialSummaryHeadline, { color: colors.heading }]}>
                What {trialSummary.trialLengthDays} days built.
              </Text>
              <View style={styles.trialSummaryStatsRow}>
                <View style={styles.trialSummaryStat}>
                  <Text style={styles.trialSummaryNum}>{streakData?.current_streak || 0}</Text>
                  <Text style={[styles.trialSummaryLabel, { color: colors.textSecondary }]}>
                    day{(streakData?.current_streak || 0) === 1 ? '' : 's'} of check-ins
                  </Text>
                </View>
                <View style={styles.trialSummaryDivider} />
                <View style={styles.trialSummaryStat}>
                  <Text style={styles.trialSummaryNum}>{trialSummary.journalCount}</Text>
                  <Text style={[styles.trialSummaryLabel, { color: colors.textSecondary }]}>
                    journal{trialSummary.journalCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
              {trialSummary.firstReveal && (
                <Text style={[styles.trialSummaryReveal, { color: colors.text }]}>
                  "{trialSummary.firstReveal}"
                </Text>
              )}
            </View>
          )}

          {/* ── 1. NAVIGATOR BRIEFING — standalone dark card ── */}
          {activeTab === 'today' && forecast?.navigatorHeadline && (
            <>
              <LinearGradient
                colors={['#171428', '#14122A', '#0F1220']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.briefingCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={styles.dailyDate}>{formatDateHeader()}</Text>
                  {(() => {
                    const CONTENT_TYPE_META = {
                      love: { icon: '♡', label: 'LOVE DAY', color: '#E85090' },
                      career: { icon: '◆', label: 'CAREER DAY', color: '#5090E8' },
                      energy: { icon: '✦', label: 'ENERGY DAY', color: '#50C878' },
                      headsup: { icon: '⚡', label: 'HEADS UP', color: '#F5A623' },
                      greenlight: { icon: '●', label: 'GREEN LIGHT', color: '#4CAF50' },
                      reflection: { icon: '◎', label: 'REFLECTION', color: '#9B8EC4' },
                    };
                    let ct = forecast.contentType;
                    if (!ct && forecast.lifeAreas) {
                      const areas = [
                        { key: 'love', type: 'love' }, { key: 'career', type: 'career' },
                        { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' },
                        { key: 'social', type: 'greenlight' },
                      ];
                      const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                      if (top) ct = top.type;
                    }
                    const meta = ct ? CONTENT_TYPE_META[ct] : null;
                    if (!meta) return null;
                    return (
                      <View style={{ backgroundColor: meta.color + '20', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: meta.color }} />
                        <Text style={{ fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: meta.color }}>{meta.label}</Text>
                      </View>
                    );
                  })()}
                </View>
                <Text style={styles.briefingHeadline}>{forecast.navigatorHeadline}</Text>
                <View style={styles.tchips}>
                  {forecast.powerCosmic && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>✦ {forecast.powerCosmic}</Text></View>
                  )}
                  <View style={styles.tchip}><Text style={styles.tchipText}>{moonIcon} {moonPhase}</Text></View>
                  {forecast.luckyStats && !isLateNight && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>#{forecast.luckyStats.number}</Text></View>
                  )}
                  {forecast.luckyStats?.crystal && !isLateNight && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>✧ {forecast.luckyStats.crystal}</Text></View>
                  )}
                </View>
              </LinearGradient>

              {/* Summary + nudge + actions flow below on normal bg */}
              {forecast.navigatorSummary && (
                <Text style={[styles.dailyTxt, { marginBottom: 14, color: colors.text }]}>{forecast.navigatorSummary}</Text>
              )}

              {/* Goal-echo (trial only) — commitment-consistency primer.
                  Anchors today's read to the motivation captured at onboarding. */}
              {trialGoalEcho && (
                <View style={styles.goalEchoCard}>
                  <Text style={styles.goalEchoKicker}>YOUR INTENT</Text>
                  <Text style={[styles.goalEchoBody, { color: colors.text }]}>
                    You came here to {trialGoalEcho.motivationText}. Today's read takes you closer.
                  </Text>
                </View>
              )}

              {/* Pro daily insight — extra layer for Pro users only.
                  Visually distinct gold-bordered card sits between the
                  navigator briefing and the action lists. Share-affordance
                  added per CA-B4 — this is the recurring iconic share
                  moment for paid users. */}
              {isPro && proInsight?.headline && (
                <View style={styles.proInsightCard}>
                  <View style={styles.proInsightHeaderRow}>
                    <Text style={styles.proInsightKicker}>✦ PRO INSIGHT</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        haptic.light();
                        capture(EVENTS.SHARE_INITIATED, { source: 'pro_insight' });
                        try {
                          await Share.share({
                            message: `"${proInsight.headline}"\n\n${proInsight.body}\n\n— Celestia ✦`,
                          });
                        } catch {}
                      }}
                      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                      style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 4 }}
                    >
                      <Text style={{ fontSize: 13, color: T.gold }}>↗</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.proInsightHeadline, { color: colors.heading }]}>{proInsight.headline}</Text>
                  <Text style={[styles.proInsightBody, { color: colors.text }]}>{proInsight.body}</Text>
                </View>
              )}

              {forecast.navigateToward && forecast.navigateToward.length > 0 && (
                <View style={[styles.nudgeBox, isDark && { backgroundColor: 'rgba(193,127,89,0.08)', borderColor: 'rgba(193,127,89,0.2)' }]}>
                  <Text style={styles.nudgeLabel}>TODAY'S NUDGE</Text>
                  <Text style={[styles.nudgeText, { color: colors.text }]}>
                    {forecast.navigateToward[0].action}{forecast.navigateToward[0].reason ? ` — ${forecast.navigateToward[0].reason.toLowerCase()}` : ''}
                  </Text>
                </View>
              )}

              {/* ── BENTO ROW — Today's Sky / Streak / Quest ──
                  Asymmetric 3-cell bento that breaks the vertical-stack rhythm.
                  Per plan/senior-design-critique/04-replaceable-patterns.md +
                  plan/android-status.md AND-7. Each cell is theme-aware, glanceable. */}
              <View style={styles.bentoRow}>
                {/* Today's Sky cell — moon sign */}
                <View style={[styles.bentoCell, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>TODAY'S SKY</Text>
                  <Text style={[styles.bentoValue, { color: colors.heading }]}>
                    {moonData?.sign || '—'}
                  </Text>
                  <Text style={[styles.bentoSub, { color: colors.textSecondary }]}>
                    {moonData?.phaseName ? moonData.phaseName.split(' ')[0] : 'Moon'}
                  </Text>
                </View>

                {/* Streak cell — leaning hero per gamification placement audit */}
                <View style={[styles.bentoCell, styles.bentoCellAccent, { borderColor: 'rgba(200,168,75,0.32)' }]}>
                  <Text style={[styles.bentoLabel, { color: T.gold }]}>STREAK</Text>
                  <Text style={[styles.bentoValueAccent]}>
                    {streakData?.current_streak ?? 0}
                  </Text>
                  <Text style={[styles.bentoSub, { color: T.gold, opacity: 0.7 }]}>
                    {streakData?.current_streak === 1 ? 'day' : 'days'}
                  </Text>
                </View>

                {/* Quest cell */}
                <View style={[styles.bentoCell, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                  <Text style={[styles.bentoLabel, { color: colors.textSecondary }]}>QUEST</Text>
                  <Text style={[styles.bentoValueSm, { color: colors.heading }]}>
                    {questData?.[0]?.label || 'No quest'}
                  </Text>
                  <Text style={[styles.bentoSub, { color: colors.textSecondary }]}>
                    {questData?.[0]?.completed ? 'done' : 'today'}
                  </Text>
                </View>
              </View>


              {/* Navigate Toward / Around — order adapts to time of day */}
              {(() => {
                const towardSection = forecast.navigateToward && forecast.navigateToward.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.navDoLabel}>NAVIGATE TOWARD</Text>
                    {forecast.navigateToward.map((item, i) => (
                      <View key={`toward-${i}`} style={styles.navDoRow}>
                        <Text style={styles.navDoIcon}>→</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.navDoAction, { color: colors.text }]}>{item.action}</Text>
                          <Text style={[styles.navDoReason, { color: colors.textSecondary }]}>{item.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
                const aroundSection = forecast.navigateAround && forecast.navigateAround.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.navAvoidLabel}>NAVIGATE AROUND</Text>
                    {forecast.navigateAround.map((item, i) => (
                      <View key={`around-${i}`} style={styles.navAvoidRow}>
                        <Text style={styles.navAvoidIcon}>⊘</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.navAvoidAction, { color: colors.text }]}>{item.action}</Text>
                          <Text style={[styles.navAvoidReason, { color: colors.textSecondary }]}>{item.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                );
                if (timeMode === 'evening' || timeMode === 'latenight') {
                  return <>{aroundSection}{towardSection}</>;
                }
                return <>{towardSection}{aroundSection}</>;
              })()}

              {/* Deep dive CTA */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6, paddingVertical: 12, backgroundColor: isDark ? 'rgba(200,168,75,0.12)' : T.navy, borderRadius: 12 }}
                activeOpacity={0.7}
                onPress={() => {
                  haptic.light();
                  setShowBriefing(true);
                  completeQuestAction('forecast_read').then(r => {
                    if (r) { setQuestData(prev => prev ? { ...prev, quests: r.quests, allComplete: r.allComplete } : prev); }
                    if (r?.justCompleted) {
                      trackEvent('quest_complete').catch(() => { });
                      awardXP(userProfile?.id || 'default', 'quest_bonus').then(xp => { if (xp) showXPGain(xp.amount); }).catch(() => { });
                    }
                  }).catch(() => { });
                }}>
                <Text style={{ fontSize: 14 }}>📖</Text>
                <Text style={{ fontSize: 13, fontFamily: FONTS.sansSemiBold, color: isDark ? T.gold : T.cream }}>Your Full Reading</Text>
                <Text style={{ fontSize: 13, color: isDark ? T.gold : T.cream, opacity: 0.6 }}>→</Text>
              </TouchableOpacity>
            </>
          )}
          {/* Quick actions row below insight card */}
          {/* At-risk intervention — visible only when health_score < 40 and
              not recently dismissed. Self-help save before churn. */}
          {activeTab === 'today' && showAtRiskBanner && (
            <View style={{
              marginBottom: 12,
              padding: 16,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(193,127,89,0.32)',
              backgroundColor: isDark ? 'rgba(193,127,89,0.06)' : 'rgba(193,127,89,0.05)',
            }}>
              <Text style={{ fontSize: 11, letterSpacing: 1.4, fontFamily: FONTS.sansSemiBold, color: '#C17F59', marginBottom: 6 }}>
                CHECKING IN
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 12 }}>
                We noticed you've been quiet. Anything we can help with?
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.gold, alignItems: 'center', backgroundColor: 'rgba(200,168,75,0.08)' }}
                  onPress={async () => {
                    haptic.light();
                    capture(EVENTS.AT_RISK_BANNER_TAPPED, { action: 'talk' });
                    try { await saveString(StorageKeys.AT_RISK_DISMISSED_AT, String(Date.now())); } catch {}
                    setShowAtRiskBanner(false);
                    navigation.navigate('AskAI', {
                      initialMessage: "I haven't been opening the app much lately. Can you help me re-find my footing — what should I focus on right now?"
                    });
                  }}
                >
                  <Text style={{ fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold }}>Talk to Celestia</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                  onPress={async () => {
                    haptic.light();
                    capture(EVENTS.AT_RISK_BANNER_TAPPED, { action: 'dismiss' });
                    try { await saveString(StorageKeys.AT_RISK_DISMISSED_AT, String(Date.now())); } catch {}
                    setShowAtRiskBanner(false);
                  }}
                >
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>I'm fine, thanks</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Surprise insight — only on trigger days (D4/10/17/24) when the
              30% roll lands. One-shot, never repeats. Variable reward. */}
          {activeTab === 'today' && surpriseInsight?.insight && (
            <View
              style={{
                marginBottom: 12,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.35)',
                backgroundColor: isDark ? 'rgba(26,21,53,0.55)' : 'rgba(200,168,75,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ fontSize: 14 }}>✦</Text>
                <Text style={{ fontSize: 10, letterSpacing: 1.6, fontFamily: FONTS.sansSemiBold, color: T.gold, textTransform: 'uppercase' }}>
                  Something I noticed — {surpriseInsight.kicker}
                </Text>
              </View>
              <Text style={{ fontSize: 14, lineHeight: 22, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: colors.text }}>
                {surpriseInsight.insight}
              </Text>
            </View>
          )}

          {/* Indecision-phrase callout — surfaces only when journals show
              the user is sitting with a decision. Investment loads next trigger. */}
          {activeTab === 'today' && indecisionMatch?.phrase && (
            <TouchableOpacity
              style={{
                marginBottom: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(200,168,75,0.28)',
                backgroundColor: isDark ? 'rgba(200,168,75,0.06)' : 'rgba(200,168,75,0.05)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
              activeOpacity={0.7}
              onPress={() => {
                haptic.light();
                const msg = `In my journal I wrote: "${indecisionMatch.phrase}" — help me think this through.`;
                navigation.navigate('AskAI', { initialMessage: msg });
              }}>
              <Text style={{ fontSize: 16 }}>◊</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 3 }}>FROM YOUR JOURNAL</Text>
                <Text style={{ fontSize: 13, lineHeight: 19, color: colors.text, fontStyle: 'italic' }} numberOfLines={2}>
                  "{indecisionMatch.phrase}"
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>Tap to think it through with Celestia →</Text>
              </View>
            </TouchableOpacity>
          )}

          {activeTab === 'today' && forecast?.navigatorHeadline && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: isDark ? 'rgba(200,168,75,0.06)' : 'rgba(200,168,75,0.06)', borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(200,168,75,0.12)' : 'rgba(200,168,75,0.12)' }}
                activeOpacity={0.7}
                onPress={() => {
                  haptic.light();
                  const msg = timeMode === 'latenight'
                    ? `I'm up late thinking about things. Based on today's energy (${forecast?.navigatorHeadline || 'current transits'}), can you help me process what I'm feeling?`
                    : timeMode === 'evening'
                    ? `I'm reflecting on today. The reading said "${forecast?.navigatorHeadline || 'today has been intense'}". How did that play out and what should I take from it?`
                    : `Tell me more about today's energy. "${forecast?.navigatorHeadline || ''}" — what does this mean for me specifically?`;
                  navigation.navigate('AskAI', { initialMessage: msg });
                }}>
                <Text style={{ fontSize: 13 }}>💬</Text>
                <Text style={{ fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold }}>Ask Celestia</Text>
              </TouchableOpacity>
              {!isLateNight && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: isDark ? 'rgba(193,127,89,0.06)' : 'rgba(193,127,89,0.06)', borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(193,127,89,0.12)' : 'rgba(193,127,89,0.12)' }}
                  activeOpacity={0.7}
                  onPress={async () => {
                    haptic.light();
                    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                    await shareStory(`${forecast?.navigatorHeadline || 'My daily insight'} — ${sunSign} Sun ✦ Celestia`);
                    trackEvent('share').catch(() => { });
                    awardXP(userProfile?.id || 'default', 'share').catch(() => { });
                  }}>
                  <Text style={{ fontSize: 13 }}>📸</Text>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.sansMedium, color: '#C17F59' }}>Share</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Skeleton placeholder while the briefing fetches — replaces the
              old ActivityIndicator pattern. Mirrors the briefing card shape
              so there's no layout shift when content arrives. */}
          {activeTab === 'today' && forecastLoading && !forecast?.navigatorHeadline && (
            <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.briefingCard, { paddingVertical: 24 }]}>
              <SkeletonBriefingCard />
              <Text style={{ fontSize: 10, letterSpacing: 1.6, color: 'rgba(250,248,242,0.35)', marginTop: 18, textAlign: 'center', fontFamily: FONTS.sansSemiBold }}>READING THE SKY</Text>
            </LinearGradient>
          )}

          {/* Weekly/Monthly reading card */}
          {activeTab !== 'today' && (
            <View style={styles.dailyCard}>
              <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.dailyHd}>
                <Text style={styles.dailyDate}>
                  {activeTab === 'weekly' ? 'THIS WEEK' : 'THIS MONTH'}
                </Text>
                {forecastLoading ? (
                  <View style={{ paddingVertical: 12, gap: 10 }}>
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, { width: '60%' }]} />
                    <ActivityIndicator size="small" color={T.gold} style={{ marginTop: 4 }} />
                  </View>
                ) : (
                  <Text style={styles.dailyHeadline}>{forecast?.header || (activeTab === 'weekly' ? 'Your Weekly Overview' : 'Your Monthly Overview')}</Text>
                )}
              </LinearGradient>
              <View style={[styles.dailyBody, { backgroundColor: colors.card }]}>
                {forecastLoading ? (
                  <View style={{ gap: 12, paddingVertical: 8 }}>
                    <View style={[styles.skeletonBodyLine, { width: '90%' }]} />
                    <View style={[styles.skeletonBodyLine, { width: '100%' }]} />
                    <View style={[styles.skeletonBodyLine, { width: '75%' }]} />
                  </View>
                ) : forecast ? (
                  <>
                    {forecast.mantra && (
                      <View style={styles.mantraBox}>
                        <Text style={styles.mantraText}>"{forecast.mantra}"</Text>
                      </View>
                    )}
                    {paragraphs.map((p, i) => (
                      <View key={i} style={styles.paraBlock}>
                        {getParaLabels()[i] && (
                          <Text style={styles.paraLabel}>{getParaLabels()[i]}</Text>
                        )}
                        <AstroText text={p} style={[styles.dailyTxt, { color: colors.text }]} />
                      </View>
                    ))}
                    {actionItems.length > 0 && (
                      <View style={styles.actionBox}>
                        <Text style={styles.actionLabel}>KEY MOVES</Text>
                        {actionItems.map((item, i) => (
                          <View key={i} style={styles.actionRow}>
                            <Text style={styles.actionArrow}>→</Text>
                            <Text style={styles.actionItem}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : null}
              </View>
            </View>
          )}

          {/* ── 4. LIFE AREA NAVIGATOR (today only) ── */}
          {activeTab === 'today' && <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>LIFE AREA NAVIGATOR</Text>}
          {activeTab === 'today' &&
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {[
                { key: 'love', icon: '♡', title: 'Love', subtitle: 'Relationships', color: '#E85090' },
                { key: 'career', icon: '◆', title: 'Career', subtitle: 'Work & Money', color: '#5090E8' },
                { key: 'vitality', icon: '✦', title: 'Vitality', subtitle: 'Energy & Rhythm', color: '#50C878' },
                { key: 'growth', icon: '◎', title: 'Growth', subtitle: 'Learning & Wisdom', color: '#F59E0B' },
                { key: 'social', icon: '✧', title: 'Social', subtitle: 'Communication', color: '#8B5CF6' },
              ].map((area) => {
                const data = forecast?.lifeAreas?.[area.key];
                return (
                  <TouchableOpacity key={area.key} style={[styles.lifeAreaCard, { borderTopColor: area.color, backgroundColor: colors.card, borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      haptic.light();
                      setLifeAreaModal(area.key);
                    }}>
                    <View style={styles.lifeAreaHeader}>
                      <Text style={[styles.lifeAreaIcon, { color: area.color }]}>{area.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lifeAreaTitle, { color: colors.text }]}>{area.title}</Text>
                        <Text style={[styles.lifeAreaSubtitle, { color: colors.textSecondary }]}>{area.subtitle}</Text>
                      </View>
                      <View style={[styles.lifeAreaEnergyBadge, { backgroundColor: area.color + '18' }]}>
                        <Text style={[styles.lifeAreaEnergyText, { color: area.color }]}>{data?.energy || 'Steady'}</Text>
                      </View>
                    </View>
                    {data?.planetaryReason && (
                      <Text style={[styles.lifeAreaPlanetReason, { color: colors.textSecondary }]}>{data.planetaryReason}</Text>
                    )}
                    {data?.doItems && data.doItems.length > 0 && (
                      <View style={styles.lifeAreaDoSection}>
                        {data.doItems.slice(0, 2).map((item, i) => (
                          <View key={i} style={styles.lifeAreaDoRow}>
                            <Text style={[styles.lifeAreaDoIcon, { color: area.color }]}>→</Text>
                            <Text style={[styles.lifeAreaDoText, { color: colors.text }]}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {data?.avoidItems && data.avoidItems.length > 0 && !data.avoidItems[0]?.includes?.('Steady skies') && (
                      <View style={styles.lifeAreaAvoidSection}>
                        {data.avoidItems.slice(0, 1).map((item, i) => (
                          <View key={i} style={styles.lifeAreaAvoidRow}>
                            <Text style={styles.lifeAreaAvoidIcon}>⊘</Text>
                            <Text style={[styles.lifeAreaAvoidText, { color: colors.textSecondary }]}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {data?.navigatorNote && (
                      <Text style={[styles.lifeAreaNote, { color: colors.text }]}>"{data.navigatorNote}"</Text>
                    )}
                    <Text style={[styles.lifeAreaCta, { color: area.color }]}>Deep Dive →</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>}

          {/* ── MONDAY WEEKLY REPORT TEASE (free users on Mondays) ── */}
          {activeTab === 'today' && !isPro && today.getDay() === 1 && (
            <TouchableOpacity
              style={{
                marginBottom: 14, borderRadius: 16, overflow: 'hidden',
                borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)',
              }}
              activeOpacity={0.8}
              onPress={() => {
                haptic.medium();
                navigation.navigate('Paywall', { source: 'monday_weekly_tease' });
              }}>
              <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ padding: 18 }}>
                <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 8 }}>YOUR WEEK AHEAD</Text>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: T.cream, marginBottom: 6 }}>Your weekly transit report is ready</Text>
                <Text style={{ fontSize: 12, color: 'rgba(250,248,242,0.45)', lineHeight: 18, marginBottom: 12 }}>See your love, career, and energy forecast for the full week — with specific days to watch and moves to make.</Text>
                {/* Blurred preview effect */}
                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <View style={{ height: 10, width: '80%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 6 }} />
                  <View style={{ height: 10, width: '60%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4, marginBottom: 6 }} />
                  <View style={{ height: 10, width: '70%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                </View>
                <View style={{ alignSelf: 'center', backgroundColor: 'rgba(200,168,75,0.15)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold }}>See Your Week Ahead →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── BIRTHDAY / SOLAR RETURN special card ── */}
          {activeTab === 'today' && (() => {
            if (!userProfile?.birthDate) return false;
            const parts = userProfile.birthDate.split('-');
            const birthMonth = parseInt(parts[1], 10);
            const birthDay = parseInt(parts[2], 10);
            const todayMonth = today.getMonth() + 1;
            const todayDay = today.getDate();
            // Show within 3 days before/after birthday
            const bDate = new Date(today.getFullYear(), birthMonth - 1, birthDay);
            const diff = Math.abs(today - bDate) / (1000 * 60 * 60 * 24);
            return diff <= 3;
          })() && (
            <TouchableOpacity
              style={{
                marginBottom: 14, borderRadius: 16, overflow: 'hidden',
                borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)',
              }}
              activeOpacity={0.8}
              onPress={() => {
                haptic.light();
                navigation.navigate('Reports');
              }}>
              <LinearGradient colors={['#5A2840', '#201540', '#3A1A28']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>✦</Text>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 20, color: T.cream, textAlign: 'center', marginBottom: 4 }}>
                  Happy Solar Return, {firstName} ✦
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 18, marginBottom: 14, maxWidth: 280 }}>
                  Your year resets. See what the stars have planned for your next chapter.
                </Text>
                <View style={{ backgroundColor: 'rgba(200,168,75,0.15)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 20 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold }}>Read Your Year-Ahead Report →</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── TODAY'S SKY — personalized card ── */}
          {activeTab === 'today' && (
            <TouchableOpacity
              style={styles.skyCard}
              activeOpacity={0.85}
              onPress={() => {
                haptic.light();
                navigation.navigate('TodaysSky');
              }}>
              <LinearGradient
                colors={['#0F0C24', '#161038', '#3A1A28', '#0C1220']}
                locations={[0, 0.35, 0.7, 1]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.skyGrad}>

                {/* Decorative glow */}
                <View style={styles.skyGlow} />

                {/* Top row: label + arrow */}
                <View style={styles.skyTopRow}>
                  <Text style={styles.skyLabel}>TODAY'S SKY</Text>
                  <View style={styles.skyArrowCircle}>
                    <Text style={styles.skyArrowText}>→</Text>
                  </View>
                </View>

                {/* Moon headline */}
                <View style={styles.skyMoonRow}>
                  <Text style={styles.skyMoonEmoji}>{moonIcon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.skyMoonPhase}>{moonData?.phaseName || 'Moon'}</Text>
                    <Text style={styles.skyMoonSign}>in {moonData?.sign || '—'}{moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}% illuminated` : ''}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.skyDivider} />

                {/* Personalized energy snapshot */}
                <View style={styles.skySnapGrid}>
                  {/* Cosmic energy */}
                  {forecast?.powerCosmic && (
                    <View style={styles.skySnapItem}>
                      <Text style={styles.skySnapIcon}>✦</Text>
                      <View>
                        <Text style={styles.skySnapLabel}>Cosmic Energy</Text>
                        <Text style={styles.skySnapValue}>{forecast.powerCosmic}</Text>
                      </View>
                    </View>
                  )}
                  {/* Most activated area */}
                  {forecast?.lifeAreas && (() => {
                    const areas = [
                      { key: 'love', icon: '♡', label: 'Love', color: '#E85090' },
                      { key: 'career', icon: '◆', label: 'Career', color: '#5090E8' },
                      { key: 'vitality', icon: '✦', label: 'Vitality', color: '#50C878' },
                      { key: 'growth', icon: '◎', label: 'Growth', color: '#F59E0B' },
                      { key: 'social', icon: '✧', label: 'Social', color: '#8B5CF6' },
                    ];
                    const top = areas
                      .filter(a => forecast.lifeAreas[a.key])
                      .sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                    if (!top) return null;
                    return (
                      <View style={styles.skySnapItem}>
                        <Text style={[styles.skySnapIcon, { color: top.color }]}>{top.icon}</Text>
                        <View>
                          <Text style={styles.skySnapLabel}>Most Active</Text>
                          <Text style={styles.skySnapValue}>{top.label} · {forecast.lifeAreas[top.key].energy}</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Cosmic season bar */}
                {cosmicSeason && (
                  <View style={styles.skySeasonWrap}>
                    <View style={styles.skySeasonInfo}>
                      <Text style={styles.skySeasonText}>{cosmicSeason.description}</Text>
                      <Text style={styles.skySeasonPct}>{cosmicSeason.progress}%</Text>
                    </View>
                    <View style={styles.skySeasonTrack}>
                      <View style={[styles.skySeasonFill, { width: `${cosmicSeason.progress}%` }]} />
                    </View>
                  </View>
                )}

                {/* CTA */}
                <View style={styles.skyCtaRow}>
                  <Text style={styles.skyCta}>Explore your full sky map</Text>
                  <Text style={styles.skyCtaArrow}>→</Text>
                </View>

              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── PREVIOUSLY ON (today only) ── */}
          {activeTab === 'today' && narrativeCtx?.yesterday && (narrativeCtx.yesterday.forecastHeader || narrativeCtx.yesterday.journalText) && (
            <View style={[styles.previouslyCard, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.previouslyLabel, { color: colors.textSecondary }]}>PREVIOUSLY</Text>
              <Text style={[styles.previouslyText, { color: colors.text }]}>
                {narrativeCtx.yesterday.forecastHeader ? `"${narrativeCtx.yesterday.forecastHeader}"` : ''}
                {narrativeCtx.yesterday.forecastHeader && narrativeCtx.yesterday.journalText ? ' — ' : ''}
                {narrativeCtx.yesterday.journalText ? `you wrote about ${narrativeCtx.yesterday.journalText.substring(0, 60).toLowerCase()}${narrativeCtx.yesterday.journalText.length > 60 ? '...' : ''}` : ''}
                {narrativeCtx.yesterday.journalMood ? ` (mood: ${narrativeCtx.yesterday.journalMood})` : ''}
              </Text>
            </View>
          )}

          {/* ── COSMIC JOURNAL (today only) ── */}
          {activeTab === 'today' && <TouchableOpacity style={[styles.journalCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.85}
            onPress={() => navigation.navigate('Journal', { mantra: forecast?.mantra })}>
            <View style={styles.jcardHeader}>
              <Text style={[styles.jcardTitle, { color: colors.textSecondary }]}>YOUR COSMIC JOURNAL</Text>
              <View style={[styles.jcardBadge, { backgroundColor: isDark ? colors.cardAlt : '#F0E8D6' }, journalSaved && { backgroundColor: isDark ? 'rgba(76,175,80,0.15)' : '#D8F0D0' }]}>
                <Text style={styles.jcardBadgeText}>{journalSaved ? 'Saved' : 'Today'}</Text>
              </View>
            </View>
            <Text style={[styles.jcardPrompt, { color: colors.heading }]}>
              {forecast?.mantra
                ? `"${forecast.mantra}"`
                : '"What is the universe trying to teach you right now?"'}
            </Text>
            <View style={[styles.jcardFooter, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.jcardCta, { color: colors.text }]}>{journalSaved ? '📖 Read Today\'s Page' : '✍ Write Today\'s Page'}</Text>
              <Text style={styles.jcardArrow}>→</Text>
            </View>
          </TouchableOpacity>}

          {/* ── EVENING REFLECTION (after 6 PM, today only) ── */}
          {activeTab === 'today' && isEvening && (
            <View style={[styles.eveningCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Text style={styles.eveningLabel}>EVENING REFLECTION</Text>
              <Text style={[styles.eveningPrompt, { color: colors.heading }]}>How did your day match the navigator's reading?</Text>
              <View style={styles.eveningMoodRow}>
                {[
                  { emoji: '😔', label: 'Off', value: 1 },
                  { emoji: '😐', label: 'Meh', value: 2 },
                  { emoji: '🙂', label: 'Okay', value: 3 },
                  { emoji: '😊', label: 'Good', value: 4 },
                  { emoji: '✨', label: 'Spot on', value: 5 },
                ].map(m => (
                  <TouchableOpacity key={m.value} activeOpacity={0.7}
                    style={[styles.eveningMoodBtn, eveningMood === m.value && styles.eveningMoodBtnActive]}
                    onPress={() => saveEveningMood(m.value)}>
                    <Text style={styles.eveningMoodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.eveningMoodLabel, eveningMood === m.value && styles.eveningMoodLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {eveningMood && (
                <Text style={[styles.eveningMoodSaved, { color: colors.textSecondary }]}>
                  {eveningMood >= 4 ? 'The cosmos aligned today.' : eveningMood >= 3 ? 'Noted. Tomorrow brings fresh energy.' : 'Some days are like that. Tomorrow shifts.'}
                </Text>
              )}
              <TouchableOpacity style={[styles.eveningBtn, { backgroundColor: colors.cardAlt }]} activeOpacity={0.7}
                onPress={() => navigation.navigate('Journal', { mantra: forecast?.mantra })}>
                <Text style={[styles.eveningBtnText, { color: colors.text }]}>Reflect in Journal →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SUNDAY WEEK REFLECTION (Sundays only) ── */}
          {activeTab === 'today' && today.getDay() === 0 && (
            <View style={[styles.sundayCard, { backgroundColor: isDark ? 'rgba(155,142,196,0.1)' : '#F3EEF8', borderColor: isDark ? 'rgba(155,142,196,0.2)' : '#E2DAEF' }]}>
              <Text style={styles.sundayLabel}>WEEK IN REVIEW</Text>
              <Text style={[styles.sundayTitle, { color: colors.heading }]}>What did this week teach you?</Text>
              <Text style={[styles.sundaySub, { color: colors.textSecondary }]}>
                {narrativeCtx?.season
                  ? `You're ${narrativeCtx.season.progress}% through your ${narrativeCtx.season.description?.toLowerCase() || 'current cosmic season'}. Take a moment to notice how far you've come.`
                  : 'Sunday is for looking back before moving forward. What patterns showed up this week?'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.sundayBtn, { flex: 1, backgroundColor: colors.cardAlt, borderColor: colors.border }]} activeOpacity={0.7}
                  onPress={() => navigation.navigate('Journal', { mantra: 'What did this week teach me?' })}>
                  <Text style={[styles.sundayBtnText, { color: colors.text }]}>Reflect in Journal →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sundayBtn, { flex: 1, backgroundColor: 'rgba(200,168,75,0.08)', borderColor: 'rgba(200,168,75,0.2)' }]} activeOpacity={0.7}
                  onPress={() => navigation.navigate('AskAI', { initialMessage: "Help me reflect on my week. What patterns should I notice based on what's been happening in my chart?" })}>
                  <Text style={[styles.sundayBtnText, { color: T.gold }]}>Talk to Celestia →</Text>
                </TouchableOpacity>
              </View>
              {/* Next week preview teaser */}
              {!isPro && (
                <TouchableOpacity style={styles.sundayNextWeek} activeOpacity={0.7}
                  onPress={() => navigation.navigate('Paywall', { source: 'sunday_next_week' })}>
                  <Text style={styles.sundayNextWeekText}>See what's coming next week →</Text>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>🔒 Premium</Text>
                </TouchableOpacity>
              )}
              {isPro && (
                <TouchableOpacity style={styles.sundayNextWeek} activeOpacity={0.7}
                  onPress={() => { setActiveTab('weekly'); mainScrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
                  <Text style={[styles.sundayNextWeekText, { color: T.gold }]}>Preview next week's energy →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ─── EXTRAS & ENGAGEMENT                      ─── */}
          {/* ═══════════════════════════════════════════════ */}

          {activeTab === 'today' && (todayCosmicLine || todayUnlock || monthlyRecap || questData?.quests || nextBadge || cosmicWhisper) && (
            <View style={{ marginTop: 12, marginBottom: 4, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }}>
              <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: colors.textSecondary, paddingHorizontal: 20 }}>YOUR COSMIC STORY</Text>
            </View>
          )}

          {/* ── TODAY'S COSMIC ALERT ── */}
          {activeTab === 'today' && todayCosmicLine && (
            <View style={styles.cosmicAlertCard}>
              <View style={styles.cosmicAlertDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cosmicAlertTitle}>{todayCosmicLine.title}</Text>
                <Text style={styles.cosmicAlertBody}>{todayCosmicLine.body}</Text>
              </View>
            </View>
          )}

          {/* ── NEW INSIGHT UNLOCKED (drip-feed) ── */}
          {activeTab === 'today' && todayUnlock && !isLateNight && (
            <TouchableOpacity style={styles.unlockCard} activeOpacity={0.8}
              onPress={() => {
                markUnlockShown();
                setTodayUnlock(null);
                navigation.navigate('Chart');
              }}>
              <LinearGradient colors={['#1A1060', '#3A1A28']} style={styles.unlockCardGradient}>
                <Text style={styles.unlockCardIcon}>✦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockCardLabel}>NEW INSIGHT UNLOCKED</Text>
                  <Text style={styles.unlockCardTitle}>{todayUnlock.planet}</Text>
                  <Text style={styles.unlockCardSub}>Day {todayUnlock.dayNum} — {UNLOCK_NARRATIVES[todayUnlock.planet] || 'A new chapter unfolds'}</Text>
                </View>
                <Text style={styles.unlockCardArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── MONTHLY RECAP (1st-3rd of month) ── */}
          {activeTab === 'today' && monthlyRecap && today.getDate() <= 3 && (
            <View style={styles.recapCardWrap}>
              <MonthlyRecapCard
                innerRef={recapCardRef}
                recap={monthlyRecap}
                month={today.getMonth() === 0 ? 12 : today.getMonth()}
                year={today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()}
                streakDays={streakData?.total_check_ins || 0}
                journalEntries={journalCount}
                sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign}
              />
              <TouchableOpacity style={styles.recapShareBtn} activeOpacity={0.75} onPress={async () => {
                haptic.light();
                const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                await shareRecap(`My cosmic recap for ${today.toLocaleString('default', { month: 'long' })} — ${sunSign} Sun`);
                trackEvent('share').catch(() => { });
                awardXP(userProfile?.id || 'default', 'share').catch(() => { });
              }}>
                <Text style={styles.recapShareText}>Share Your Recap ↗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── DAILY QUESTS ── */}
          {activeTab === 'today' && questData?.quests && !isLateNight && (
            <QuestCard
              quests={questData.quests}
              allComplete={questData.allComplete}
              weeklyCount={questData.weeklyCount || 0}
            />
          )}

          {/* ── NEXT BADGE PROGRESS ── */}
          {activeTab === 'today' && nextBadge && !isLateNight && (
            <View style={[styles.nextBadgeCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(200,168,75,0.15)' : 'rgba(200,168,75,0.2)' }]}>
              <View style={styles.nextBadgeHeader}>
                <Text style={styles.nextBadgeIcon}>{nextBadge.badge.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nextBadgeLabel, { color: colors.textSecondary }]}>YOUR NEXT CHAPTER</Text>
                  <Text style={[styles.nextBadgeName, { color: colors.heading }]}>{nextBadge.badge.name}</Text>
                </View>
                <Text style={styles.nextBadgeCount}>{nextBadge.current}/{nextBadge.target}</Text>
              </View>
              <View style={[styles.nextBadgeBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.nextBadgeBarFill, { width: `${(nextBadge.progress * 100).toFixed(0)}%` }]} />
              </View>
              <Text style={[styles.nextBadgeSub, { color: colors.textSecondary }]}>{nextBadge.remaining} more to unlock this chapter</Text>
            </View>
          )}

          {/* ── COSMIC WHISPER (Easter egg) — tap to share ── */}
          {activeTab === 'today' && cosmicWhisper && (
            <TouchableOpacity
              style={[styles.whisperCard, whisperRarity && styles.whisperCardRare, { backgroundColor: isDark ? 'rgba(200,168,75,0.08)' : 'rgba(200,168,75,0.06)', borderColor: isDark ? 'rgba(200,168,75,0.12)' : 'rgba(200,168,75,0.15)' }]}
              activeOpacity={0.75}
              onPress={async () => {
                haptic.medium();
                await shareWhisperCard(`✧ ${cosmicWhisper}\n\n— A Cosmic Whisper from Celestia${whisperRarity ? ` (${whisperRarity})` : ''}`);
                trackEvent('share').catch(() => { });
                awardXP(userProfile?.id || 'default', 'share').catch(() => { });
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.whisperLabel}>COSMIC WHISPER</Text>
                <Text style={{ fontSize: 9, color: 'rgba(200,168,75,0.4)', fontStyle: 'italic' }}>A rare message from the cosmos</Text>
                {whisperRarity && (
                  <View style={styles.whisperRarityBadge}>
                    <Text style={styles.whisperRarityText}>{whisperRarity.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.whisperText, { color: isDark ? colors.gold : '#8B6A28' }]}>✧ {cosmicWhisper}</Text>
              {!isLateNight && <Text style={{ fontSize: 10, color: 'rgba(200,168,75,0.4)', marginTop: 6 }}>Tap to share ↗</Text>}
            </TouchableOpacity>
          )}

          {/* Circle widget removed — redundant with Circle tab */}

          {/* ── TIME-ADAPTIVE PROMPTS — each time mode gets a different emotional entry point ── */}
          {activeTab === 'today' && timeMode === 'morning' && (
            <TouchableOpacity style={[styles.timePromptCard, { backgroundColor: isDark ? colors.card : 'rgba(200,168,75,0.06)', borderColor: isDark ? colors.border : 'rgba(200,168,75,0.12)' }]} activeOpacity={0.7}
              onPress={() => navigation.navigate('AskAI', { initialMessage: "What should I focus on today?" })}>
              <Text style={styles.timePromptIcon}>☉</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timePromptTitle, { color: colors.text }]}>Start your day with intention</Text>
                <Text style={[styles.timePromptSub, { color: colors.textSecondary }]}>Ask Celestia what to focus on today →</Text>
              </View>
            </TouchableOpacity>
          )}
          {activeTab === 'today' && timeMode === 'afternoon' && (
            <TouchableOpacity style={[styles.timePromptCard, { backgroundColor: isDark ? colors.card : 'rgba(200,168,75,0.06)', borderColor: isDark ? colors.border : 'rgba(200,168,75,0.12)' }]} activeOpacity={0.7}
              onPress={() => navigation.navigate('AskAI')}>
              <Text style={styles.timePromptIcon}>☿</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timePromptTitle, { color: colors.text }]}>Quick check-in</Text>
                <Text style={[styles.timePromptSub, { color: colors.textSecondary }]}>Anything on your mind? →</Text>
              </View>
            </TouchableOpacity>
          )}
          {activeTab === 'today' && timeMode === 'evening' && !isLateNight && (
            <TouchableOpacity style={[styles.timePromptCard, { backgroundColor: isDark ? 'rgba(155,142,196,0.1)' : '#F3EEF8', borderColor: isDark ? 'rgba(155,142,196,0.2)' : '#E2DAEF' }]} activeOpacity={0.7}
              onPress={() => navigation.navigate('AskAI', { initialMessage: "I'm winding down. What should I reflect on from today?" })}>
              <Text style={styles.timePromptIcon}>☾</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.timePromptTitle, { color: colors.text }]}>Evening wind-down</Text>
                <Text style={[styles.timePromptSub, { color: colors.textSecondary }]}>Process your day with Celestia →</Text>
              </View>
            </TouchableOpacity>
          )}
          {activeTab === 'today' && isLateNight && (
            <View>
              <TouchableOpacity style={[styles.timePromptCard, { backgroundColor: isDark ? colors.cardAlt : '#F5F0E8', borderColor: isDark ? colors.border : '#E8E0D0' }]} activeOpacity={0.7}
                onPress={() => navigation.navigate('AskAI', { initialMessage: "I can't sleep and I'm feeling a lot right now. Can you help me make sense of it?" })}>
                <Text style={styles.timePromptIcon}>☽</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timePromptTitle, { color: colors.text }]}>Can't sleep?</Text>
                  <Text style={[styles.timePromptSub, { color: colors.textSecondary }]}>Talk it through with Celestia →</Text>
                </View>
              </TouchableOpacity>
              {/* Extra gentle prompts for late night — emotional safety net */}
              <TouchableOpacity style={[styles.timePromptCard, { backgroundColor: isDark ? colors.cardAlt : '#F0EDE8', borderColor: isDark ? colors.border : '#E5E0D6', marginTop: 0 }]} activeOpacity={0.7}
                onPress={() => navigation.navigate('AskAI', { initialMessage: "Why am I feeling off tonight? What's happening in my chart right now?" })}>
                <Text style={styles.timePromptIcon}>✧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timePromptTitle, { color: colors.text }]}>Feeling off?</Text>
                  <Text style={[styles.timePromptSub, { color: colors.textSecondary }]}>Let's look at what's happening in your chart →</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions removed — redundant with tab bar */}

          {/* ── PROMO (hidden in latenight comfort mode — no selling when she's vulnerable) ── */}
          {timeMode !== 'latenight' && (
            <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Reports')}>
              <LinearGradient colors={['#1A1530', '#14112A', '#101320']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
                <Text style={styles.promoLbl}>REPORTS</Text>
                <Text style={styles.promoTitle}>Your Cosmic Deep Dives</Text>
                <Text style={styles.promoSub}>Love, Career, Purpose — chapters written for this moment in your journey</Text>
                <View style={styles.promoCta}><Text style={styles.promoCtaText}>Open Your Reports →</Text></View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* ── DEEP DIVE MODAL ── */}
      <Modal visible={showBriefing} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            {/* ── Hero: same headline as card for continuity ── */}
            <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.ddHero}>
              <View style={styles.ddHeaderRow}>
                <Text style={styles.ddDate}>{formatDateHeader().toUpperCase()}</Text>
                <TouchableOpacity onPress={() => setShowBriefing(false)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                  <Text style={styles.ddClose}>✕</Text>
                </TouchableOpacity>
              </View>
              {/* Content type icon — contextual, not generic */}
              {(() => {
                const CT_EMOJI = { love: '💕', career: '💼', energy: '🔋', headsup: '⚡', greenlight: '🟢', reflection: '🌙' };
                let ct = forecast?.contentType;
                if (!ct && forecast?.lifeAreas) {
                  const areas = [
                    { key: 'love', type: 'love' }, { key: 'career', type: 'career' },
                    { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' },
                    { key: 'social', type: 'greenlight' },
                  ];
                  const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                  if (top) ct = top.type;
                }
                const emoji = CT_EMOJI[ct] || '✦';
                const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                const sunGlyph = sunSign ? (PLANET_GLYPHS.Sun || '☉') : '';
                const CT_LABELS = { love: 'LOVE DAY', career: 'CAREER DAY', energy: 'ENERGY DAY', headsup: 'HEADS UP', greenlight: 'GREEN LIGHT', reflection: 'REFLECTION' };
                const dayLabel = CT_LABELS[ct] || 'YOUR READING';
                return (
                  <>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</Text>
                    <Text style={styles.ddLabel}>{sunGlyph} {sunSign.toUpperCase()} · {dayLabel}</Text>
                  </>
                );
              })()}
              <Text style={styles.ddHeadline}>{forecast?.navigatorHeadline}</Text>
              {forecast?.navigatorSummary && (
                <Text style={styles.ddSummary}>{forecast.navigatorSummary}</Text>
              )}
              {/* Glance chips — moon + energy only (no lucky number) */}
              <View style={styles.ddChipsGlass}>
                <View style={styles.ddChipItem}><Text style={styles.ddChipText}>{moonIcon} {moonPhase}</Text></View>
                {forecast?.powerCosmic && (
                  <View style={styles.ddChipItem}><Text style={styles.ddChipText}>✦ {forecast.powerCosmic}</Text></View>
                )}
              </View>
            </LinearGradient>

            {/* ── 1. THE READING — full horoscope paragraphs ── */}
            {paragraphs.length > 0 && (
              <View style={styles.ddSection}>
                <Text style={[styles.ddSectionLabel, { color: colors.textSecondary }]}>YOUR READING</Text>
                {paragraphs.map((p, i) => (
                  <View key={i} style={styles.ddParaBlock}>
                    {getParaLabels()[i] && (
                      <Text style={styles.ddParaLabel}>{getParaLabels()[i]}</Text>
                    )}
                    <AstroText text={p} style={[styles.ddParaText, { color: colors.text }]} />
                  </View>
                ))}
              </View>
            )}

            {/* ── 2. PLANET INFLUENCES — why you feel this way ── */}
            {forecast?.planetInfluences && forecast.planetInfluences.length > 0 && (
              <View style={styles.ddSection}>
                <Text style={[styles.ddSectionLabel, { color: colors.textSecondary }]}>WHAT'S DRIVING TODAY</Text>
                {forecast.planetInfluences.map((inf, i) => (
                  <View key={i} style={[styles.ddInfluenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={styles.ddInfluenceGlyph}>{inf.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ddInfluenceTag, { color: colors.heading }]}>{inf.tag}</Text>
                      <Text style={[styles.ddInfluenceEffect, { color: colors.textSecondary }]}>{inf.effect}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── 3. LIFE AREAS — deep per-area breakdown ── */}
            {forecast?.lifeAreas && (
              <View style={styles.ddSection}>
                <Text style={[styles.ddSectionLabel, { color: colors.textSecondary }]}>LIFE AREAS</Text>
                {[
                  { key: 'love', icon: '♡', title: 'Love', sub: 'Relationships & Intimacy', color: '#E85090' },
                  { key: 'career', icon: '◆', title: 'Career', sub: 'Work & Finances', color: '#5090E8' },
                  { key: 'vitality', icon: '✦', title: 'Vitality', sub: 'Energy & Wellness', color: '#50C878' },
                  { key: 'growth', icon: '◎', title: 'Growth', sub: 'Learning & Inner Work', color: '#F59E0B' },
                  { key: 'social', icon: '✧', title: 'Social', sub: 'Community & Connection', color: '#8B5CF6' },
                ].map((area) => {
                  const data = forecast.lifeAreas[area.key];
                  if (!data) return null;
                  const intensityVal = Math.min(10, Math.max(1, data.intensity || 3));
                  return (
                    <View key={area.key} style={[styles.laCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {/* ── Header: icon, title, archetype, energy badge ── */}
                      <View style={[styles.laHeader, { borderLeftColor: area.color }]}>
                        <View style={styles.laHeaderLeft}>
                          <Text style={[styles.laIcon, { color: area.color }]}>{area.icon}</Text>
                          <View>
                            <Text style={styles.laTitle}>{area.title}</Text>
                            <Text style={styles.laSub}>{area.sub}</Text>
                          </View>
                        </View>
                        <View style={[styles.laEnergyBadge, { backgroundColor: area.color + '15' }]}>
                          <Text style={[styles.laEnergyText, { color: area.color }]}>{data.energy || 'Steady'}</Text>
                        </View>
                      </View>

                      {/* ── Intensity meter + archetype + driving planet ── */}
                      <View style={styles.laMeta}>
                        <View style={styles.laIntensityRow}>
                          <Text style={styles.laMetaLabel}>Intensity</Text>
                          <View style={styles.laIntensityTrack}>
                            <View style={[styles.laIntensityFill, { width: `${intensityVal * 10}%`, backgroundColor: area.color }]} />
                          </View>
                          <Text style={[styles.laIntensityNum, { color: area.color }]}>{intensityVal}/10</Text>
                        </View>
                        <View style={styles.laMetaChips}>
                          {data.archetype ? (
                            <View style={[styles.laChip, { backgroundColor: area.color + '12' }]}>
                              <Text style={[styles.laChipText, { color: area.color }]}>{data.archetype}</Text>
                            </View>
                          ) : null}
                          {data.drivingPlanet ? (
                            <View style={[styles.laChip, { backgroundColor: colors.cardAlt }]}>
                              <Text style={styles.laChipTextMuted}>{data.drivingPlanet}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* ── Planetary reason ── */}
                      {data.planetaryReason ? (
                        <Text style={styles.laPlanetReason}>{data.planetaryReason}</Text>
                      ) : null}

                      {/* ── Full horoscope paragraph ── */}
                      {data.horoscope ? (
                        <View style={styles.laHoroscopeBox}>
                          <Text style={styles.laHoroscopeText}>{data.horoscope}</Text>
                        </View>
                      ) : null}

                      {/* ── Navigate Toward ── */}
                      {data.doItems && data.doItems.length > 0 ? (
                        <View style={styles.laDoSection}>
                          <Text style={[styles.laDoLabel, { color: area.color }]}>NAVIGATE TOWARD</Text>
                          {data.doItems.map((item, i) => (
                            <View key={i} style={styles.laDoRow}>
                              <Text style={[styles.laDoArrow, { color: area.color }]}>→</Text>
                              <Text style={styles.laDoText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {/* ── Navigate Around ── */}
                      {data.avoidItems && data.avoidItems.length > 0 && !data.avoidItems[0]?.includes?.('Steady skies') ? (
                        <View style={styles.laAvoidSection}>
                          <Text style={styles.laAvoidLabel}>NAVIGATE AROUND</Text>
                          {data.avoidItems.map((item, i) => (
                            <View key={i} style={styles.laDoRow}>
                              <Text style={styles.laAvoidIcon}>⊘</Text>
                              <Text style={[styles.laDoText, { color: colors.textSecondary }]}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {/* ── Timing ── */}
                      {data.timing ? (
                        <View style={styles.laTimingRow}>
                          <Text style={styles.laTimingIcon}>◷</Text>
                          <Text style={styles.laTimingText}>{data.timing}</Text>
                        </View>
                      ) : null}

                      {/* ── Ritual ── */}
                      {data.ritual ? (
                        <View style={[styles.laRitualBox, { borderLeftColor: area.color }]}>
                          <Text style={[styles.laRitualLabel, { color: area.color }]}>TODAY'S PRACTICE</Text>
                          <Text style={styles.laRitualText}>{data.ritual}</Text>
                        </View>
                      ) : null}

                      {/* ── Affirmation ── */}
                      {data.affirmation ? (
                        <View style={styles.laAffirmationBox}>
                          <Text style={styles.laAffirmationText}>"{data.affirmation}"</Text>
                        </View>
                      ) : null}

                      {/* ── Navigator Note ── */}
                      {data.navigatorNote ? (
                        <Text style={styles.laNavNote}>— {data.navigatorNote}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── 4. POWER MOVES — action items ── */}
            {actionItems.length > 0 && (
              <View style={styles.ddSection}>
                <Text style={[styles.ddSectionLabel, { color: colors.textSecondary }]}>POWER MOVES</Text>
                <View style={[styles.ddActionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {actionItems.map((item, i) => (
                    <View key={i} style={styles.ddActionRow}>
                      <View style={styles.ddActionNum}>
                        <Text style={styles.ddActionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.ddActionText, { color: colors.text }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── 5. TODAY'S RITUAL ── */}
            {forecast?.dailyRitual && (
              <View style={styles.ddSection}>
                <View style={styles.ddRitualCard}>
                  <Text style={styles.ddRitualLabel}>TODAY'S RITUAL</Text>
                  <Text style={[styles.ddRitualText, { color: colors.text }]}>✧ {forecast.dailyRitual}</Text>
                </View>
              </View>
            )}

            {/* ── 6. DAY AT A GLANCE — cosmic stats ── */}
            <View style={styles.ddSection}>
              <Text style={[styles.ddSectionLabel, { color: colors.textSecondary }]}>COSMIC STATS</Text>
              <View style={[styles.ddStatsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.ddStatRow}>
                  <Text style={[styles.ddStatLabel, { color: colors.textSecondary }]}>Moon</Text>
                  <Text style={[styles.ddStatValue, { color: colors.heading }]}>{moonIcon} {moonPhase} in {moonSign}</Text>
                </View>
                <View style={styles.ddStatDivider} />
                <View style={styles.ddStatRow}>
                  <Text style={[styles.ddStatLabel, { color: colors.textSecondary }]}>Energy</Text>
                  <Text style={[styles.ddStatValue, { color: colors.heading }]}>{forecast?.powerCosmic || 'Balanced'}</Text>
                </View>
                {forecast?.luckyStats && (
                  <>
                    <View style={styles.ddStatDivider} />
                    <View style={styles.ddStatRow}>
                      <Text style={[styles.ddStatLabel, { color: colors.textSecondary }]}>Power Number</Text>
                      <Text style={[styles.ddStatValue, { fontFamily: FONTS.serif, fontSize: 18, color: colors.heading }]}>{forecast.luckyStats.number}</Text>
                    </View>
                    <View style={styles.ddStatDivider} />
                    <View style={styles.ddStatRow}>
                      <Text style={[styles.ddStatLabel, { color: colors.textSecondary }]}>Power Color</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {forecast.luckyStats.colorHex && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: forecast.luckyStats.colorHex }} />
                        )}
                        <Text style={[styles.ddStatValue, { color: colors.heading }]}>{forecast.luckyStats.color}</Text>
                      </View>
                    </View>
                    {forecast.luckyStats.crystal && (
                      <>
                        <View style={styles.ddStatDivider} />
                        <View style={styles.ddStatRow}>
                          <Text style={[styles.ddStatLabel, { color: colors.textSecondary }]}>Crystal</Text>
                          <Text style={[styles.ddStatValue, { color: colors.heading }]}>✧ {forecast.luckyStats.crystal}</Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* ── 7. MANTRA — closing anchor ── */}
            {forecast?.mantra && (
              <View style={styles.ddSection}>
                <View style={styles.ddMantraCard}>
                  <Text style={styles.ddMantraLabel}>TODAY'S MANTRA</Text>
                  <Text style={[styles.ddMantraText, { color: colors.heading }]}>"{forecast.mantra}"</Text>
                </View>
              </View>
            )}

            {/* ── 8. SHARE — viral insight ── */}
            {forecast?.viralInsight && (
              <View style={[styles.ddSection, { alignItems: 'center' }]}>
                <TouchableOpacity style={styles.ddShareCard} activeOpacity={0.7}
                  onPress={() => {
                    haptic.medium();
                    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                    Share.share({ message: `✦ ${forecast.viralInsight}\n\n— Celestia (${sunSign} Sun)` });
                    trackEvent('share').catch(() => { });
                    awardXP(userProfile?.id || 'default', 'share').catch(() => { });
                  }}>
                  <Text style={styles.ddShareText}>✦ {forecast.viralInsight}</Text>
                  <Text style={styles.ddShareCta}>Share this insight ↗</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </View>
      </Modal>

      {/* ── DOMAIN DEEP DIVE MODAL ── */}
      {/* ── LIFE AREA DEEP DIVE MODAL ── */}
      <Modal visible={!!lifeAreaModal} animationType="slide" presentationStyle="pageSheet">
        {lifeAreaModal && (() => {
          const meta = LIFE_AREA_META[lifeAreaModal];
          const areaData = forecast?.lifeAreas?.[lifeAreaModal];
          if (!meta) return null;
          const intensityVal = Math.min(10, Math.max(1, areaData?.intensity || 3));
          // Get related top-level data for love/career
          const relatedHoroscope = lifeAreaModal === 'love' ? forecast?.loveHoroscope
            : lifeAreaModal === 'career' ? forecast?.careerHoroscope : null;
          const relatedArchetype = lifeAreaModal === 'love' ? forecast?.loveArchetype
            : lifeAreaModal === 'career' ? forecast?.careerArchetype : null;
          const relatedActions = lifeAreaModal === 'love' ? forecast?.loveActions
            : lifeAreaModal === 'career' ? forecast?.careerActions : null;
          const relatedVibe = lifeAreaModal === 'love' ? forecast?.loveVibe
            : lifeAreaModal === 'career' ? forecast?.careerVibe : null;
          const careerPower = lifeAreaModal === 'career' ? forecast?.careerPowerSource : null;
          const wealthFlow = lifeAreaModal === 'career' ? forecast?.wealthFlow : null;
          const marketTiming = lifeAreaModal === 'career' ? forecast?.marketTiming : null;

          return (
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                {/* ── Hero ── */}
                <LinearGradient colors={meta.gradient} style={styles.lamHero}>
                  {/* Top bar: date + close */}
                  <View style={styles.lamTopBar}>
                    <Text style={styles.lamDateLabel}>{formatDateHeader().toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => setLifeAreaModal(null)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                      <Text style={styles.lamCloseBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Icon with glow ring */}
                  <View style={styles.lamIconWrap}>
                    <View style={[styles.lamIconGlow, { backgroundColor: meta.color + '18', shadowColor: meta.color }]} />
                    <View style={[styles.lamIconRing, { borderColor: meta.color + '35' }]}>
                      <Text style={[styles.lamHeroIcon, { color: meta.color }]}>{meta.icon}</Text>
                    </View>
                  </View>

                  {/* Title + Subtitle */}
                  <Text style={styles.lamHeroTitle}>{meta.title}</Text>
                  <Text style={styles.lamHeroSub}>{meta.sub}</Text>

                  {/* Energy badge + Intensity bar in a glass card */}
                  <View style={styles.lamGlassCard}>
                    <View style={styles.lamGlassRow}>
                      <View style={[styles.lamEnergyPill, { backgroundColor: meta.color + '25' }]}>
                        <Text style={[styles.lamEnergyPillText, { color: meta.color }]}>{areaData?.energy || 'Steady'}</Text>
                      </View>
                      <View style={styles.lamIntensityWrap}>
                        <Text style={styles.lamIntensityLabelLeft}>Intensity</Text>
                        <View style={styles.lamIntensityTrack}>
                          <View style={[styles.lamIntensityFill, { width: `${intensityVal * 10}%`, backgroundColor: meta.color }]} />
                        </View>
                        <Text style={[styles.lamIntensityNum, { color: meta.color }]}>{intensityVal}/10</Text>
                      </View>
                    </View>
                    {/* Archetype + Driving Planet */}
                    <View style={styles.lamGlassChips}>
                      {(areaData?.archetype || relatedArchetype) ? (
                        <View style={[styles.lamHeroChip, { borderColor: meta.color + '30' }]}>
                          <Text style={[styles.lamHeroChipText, { color: meta.color }]}>{areaData?.archetype || relatedArchetype}</Text>
                        </View>
                      ) : null}
                      {areaData?.drivingPlanet ? (
                        <View style={[styles.lamHeroChip, { borderColor: 'rgba(255,255,255,0.15)' }]}>
                          <Text style={styles.lamHeroChipTextLight}>{areaData.drivingPlanet}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </LinearGradient>

                <View style={{ padding: 20 }}>

                  {/* ── 1. Planetary Reason ── */}
                  {areaData?.planetaryReason ? (
                    <Text style={styles.lamPlanetReason}>{areaData.planetaryReason}</Text>
                  ) : null}

                  {/* ── 2. Full Horoscope Reading ── */}
                  {(areaData?.horoscope || relatedHoroscope) ? (
                    <View style={[styles.lamReadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={styles.lamSectionLabel}>YOUR READING</Text>
                      <Text style={[styles.lamReadingText, { color: colors.text }]}>{areaData?.horoscope || ''}</Text>
                      {relatedHoroscope && relatedHoroscope !== areaData?.horoscope ? (
                        <Text style={[styles.lamReadingText, { marginTop: 10, color: colors.text }]}>{relatedHoroscope}</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* ── 3. Vibe (love/career only) ── */}
                  {relatedVibe ? (
                    <View style={[styles.lamVibeBox, { borderLeftColor: meta.color }]}>
                      <Text style={[styles.lamVibeLabel, { color: meta.color }]}>TODAY'S VIBE</Text>
                      <Text style={[styles.lamVibeText, { color: colors.text }]}>{relatedVibe}</Text>
                    </View>
                  ) : null}

                  {/* ── 4. Navigate Toward ── */}
                  {areaData?.doItems && areaData.doItems.length > 0 ? (
                    <View style={styles.lamDoSection}>
                      <Text style={[styles.lamSectionLabel, { color: meta.color }]}>NAVIGATE TOWARD</Text>
                      {areaData.doItems.map((item, i) => (
                        <View key={i} style={styles.lamDoRow}>
                          <View style={[styles.lamDoDot, { backgroundColor: meta.color }]} />
                          <Text style={[styles.lamDoText, { color: colors.text }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* ── 5. Related Actions (love/career extra) ── */}
                  {relatedActions && relatedActions.length > 0 ? (
                    <View style={styles.lamDoSection}>
                      <Text style={[styles.lamSectionLabel, { color: meta.color }]}>POWER ACTIONS</Text>
                      {relatedActions.map((item, i) => (
                        <View key={i} style={styles.lamDoRow}>
                          <Text style={[styles.lamDoArrow, { color: meta.color }]}>→</Text>
                          <Text style={[styles.lamDoText, { color: colors.text }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* ── 6. Navigate Around ── */}
                  {areaData?.avoidItems && areaData.avoidItems.length > 0 && !areaData.avoidItems[0]?.includes?.('Steady skies') ? (
                    <View style={styles.lamAvoidSection}>
                      <Text style={styles.lamAvoidLabel}>NAVIGATE AROUND</Text>
                      {areaData.avoidItems.map((item, i) => (
                        <View key={i} style={styles.lamDoRow}>
                          <Text style={styles.lamAvoidIcon}>⊘</Text>
                          <Text style={[styles.lamDoText, { color: colors.textSecondary }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* ── 7. Career extras: Power Source, Wealth Flow, Market Timing ── */}
                  {(careerPower || wealthFlow || marketTiming) ? (
                    <View style={[styles.lamCareerExtras, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {careerPower ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>POWER SOURCE</Text>
                          <Text style={[styles.lamCareerRowText, { color: colors.text }]}>{careerPower}</Text>
                        </View>
                      ) : null}
                      {wealthFlow ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>WEALTH FLOW</Text>
                          <Text style={[styles.lamCareerRowText, { color: colors.text }]}>{wealthFlow}</Text>
                        </View>
                      ) : null}
                      {marketTiming ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>TIMING</Text>
                          <Text style={[styles.lamCareerRowText, { color: colors.text }]}>{marketTiming}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* ── 8. Timing ── */}
                  {areaData?.timing ? (
                    <View style={[styles.lamTimingRow, { backgroundColor: colors.cardAlt }]}>
                      <Text style={styles.lamTimingIcon}>◷</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lamTimingLabel}>BEST WINDOW</Text>
                        <Text style={[styles.lamTimingText, { color: colors.text }]}>{areaData.timing}</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* ── 9. Today's Practice / Ritual ── */}
                  {areaData?.ritual ? (
                    <View style={[styles.lamRitualBox, { borderLeftColor: meta.color }]}>
                      <Text style={[styles.lamRitualLabel, { color: meta.color }]}>TODAY'S PRACTICE</Text>
                      <Text style={[styles.lamRitualText, { color: colors.text }]}>{areaData.ritual}</Text>
                    </View>
                  ) : null}

                  {/* ── 10. Affirmation ── */}
                  {areaData?.affirmation ? (
                    <View style={[styles.lamAffirmationBox, { backgroundColor: isDark ? colors.card : '#FBF9F3', borderColor: isDark ? colors.border : 'rgba(200,168,75,0.15)' }]}>
                      <Text style={styles.lamAffirmationText}>"{areaData.affirmation}"</Text>
                    </View>
                  ) : null}

                  {/* ── 11. Navigator Note ── */}
                  {areaData?.navigatorNote ? (
                    <View style={styles.lamNoteBox}>
                      <Text style={[styles.lamNoteText, { color: colors.textSecondary }]}>— {areaData.navigatorNote}</Text>
                    </View>
                  ) : null}

                  {/* ── 12. Ask Celestia bridge ── */}
                  <TouchableOpacity
                    style={styles.lamAskCelestiaBridge}
                    activeOpacity={0.7}
                    onPress={() => {
                      const areaMessages = {
                        love: 'Tell me more about my love and relationship energy today. What should I focus on based on my chart and current transits?',
                        career: 'What does my chart say about career opportunities right now? How can I make the most of today\'s energy?',
                        vitality: 'How should I manage my energy and wellness today? What do the transits suggest for my physical and mental rhythm?',
                        growth: 'What growth lessons is the universe showing me right now? How can I best use this energy for inner transformation?',
                        social: 'Tell me about my social and communication energy today. What connections should I nurture based on my chart?',
                      };
                      const msg = areaMessages[lifeAreaModal] || `Tell me more about my ${meta.title.toLowerCase()} energy today.`;
                      setLifeAreaModal(null);
                      setTimeout(() => {
                        navigation.navigate('AskAI', { initialMessage: msg });
                      }, 300);
                    }}>
                    <Text style={styles.lamAskCelestiaText}>Ask Celestia about your {lifeAreaModal} energy today</Text>
                    <Text style={styles.lamAskCelestiaArrow}>{' →'}</Text>
                  </TouchableOpacity>

                </View>
              </ScrollView>
            </View>
          );
        })()}
      </Modal>

      {/* ── OFFSCREEN SHARE CARDS (for capture) ── */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <DailyShareCard
          innerRef={shareCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || ''}
          viralInsight={forecast?.viralInsight}
          mantra={forecast?.mantra}
          date={formatDateHeader()}
        />
        <DailyStoryCard
          innerRef={storyCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || ''}
          viralInsight={forecast?.viralInsight}
          mantra={forecast?.mantra}
          date={formatDateHeader()}
        />
        <MercuryRxCard
          innerRef={rxCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign}
        />
        <LunarEventCard
          innerRef={lunarCardRef}
          eventType={moonData?.phaseName || 'Full Moon'}
          moonSign={moonData?.sign}
          date={formatDateHeader()}
        />
        {cosmicWhisper && (
          <WhisperShareCard
            innerRef={whisperCardRef}
            whisper={cosmicWhisper}
            rarity={whisperRarity}
          />
        )}
      </View>

      {/* ── XP FLOAT ANIMATION ── */}
      {xpGainText ? (
        <Animated.View pointerEvents="none" style={[styles.xpFloat, { opacity: xpFloatOpacity, transform: [{ translateY: xpFloatAnim }] }]}>
          <Text style={styles.xpFloatText}>{xpGainText}</Text>
        </Animated.View>
      ) : null}

      {/* ── WELCOME BACK MODAL ── */}
      <WelcomeBackModal
        visible={showWelcomeBack}
        onDismiss={() => setShowWelcomeBack(false)}
        streakData={streakData}
        moonData={moonData}
      />

      {/* ── WAKE-TIME BACKFILL (existing users who never picked one) ── */}
      <Modal visible={showWakeTimeBackfill} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.freezeIcon}>☀️</Text>
              <Text style={styles.freezeTitle}>When do you usually wake up?</Text>
              <Text style={styles.freezeSub}>
                We'll send your morning briefing right after — so it lands on your routine, not ours.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
                {[
                  { label: '6 AM', value: 6 },
                  { label: '7 AM', value: 7 },
                  { label: '8 AM', value: 8 },
                  { label: '9 AM', value: 9 },
                  { label: 'Later', value: 10 },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.7}
                    onPress={async () => {
                      haptic.light();
                      try {
                        const settings = await getNotificationSettings();
                        await saveNotificationSettings({ ...settings, morningTime: opt.value, morningMinute: 5 });
                        await saveBoolean(StorageKeys.WAKE_TIME_BACKFILL_PROMPTED, true);
                      } catch {}
                      setShowWakeTimeBackfill(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(200,168,75,0.25)',
                      backgroundColor: 'rgba(200,168,75,0.06)',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  try { await saveBoolean(StorageKeys.WAKE_TIME_BACKFILL_PROMPTED, true); } catch {}
                  setShowWakeTimeBackfill(false);
                }}
                style={{ paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(250,248,242,0.45)' }}>Skip — keep 7:30 AM default</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── STREAK RESTORE OFFER ── */}
      <Modal visible={!!streakRestoreOffer} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.freezeIcon}>❅</Text>
              <Text style={styles.freezeTitle}>Restore your {streakRestoreOffer?.previousStreak}-day streak?</Text>
              <Text style={styles.freezeSub}>
                Use one of your freezes to bring it back. Today's check-in counts — you'll be back on day {(streakRestoreOffer?.previousStreak || 0) + 1}.
              </Text>
              <View style={styles.freezeStat}>
                <Text style={styles.freezeStatLabel}>Freezes available</Text>
                <Text style={styles.freezeStatValue}>{streakRestoreOffer?.freezesRemaining}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  haptic.success();
                  const previousStreak = streakRestoreOffer.previousStreak;
                  const profileId = userProfile?.id || 'default';
                  setStreakRestoreOffer(null);
                  try { await saveString(StorageKeys.STREAK_RESTORE_OFFER_LAST, String(Date.now())); } catch {}
                  const result = await restoreBrokenStreak(profileId, previousStreak);
                  if (result.ok) {
                    capture(EVENTS.STREAK_RESTORED, {
                      restored_streak: result.newStreak,
                      previous_streak: previousStreak,
                      freezes_remaining: result.freezesRemaining,
                    });
                    capture(EVENTS.STREAK_FREEZE_USED, {
                      source: 'restore_offer',
                      freezes_remaining: result.freezesRemaining,
                    });
                    // Refresh local streak state
                    setStreakData({
                      current_streak: result.newStreak,
                      streak_freezes_remaining: result.freezesRemaining,
                    });
                    Alert.alert('Streak restored', `You're back on a ${result.newStreak}-day streak.`);
                  }
                }}
              >
                <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.freezeCta}>
                  <Text style={styles.freezeCtaText}>Use freeze + restore</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  try { await saveString(StorageKeys.STREAK_RESTORE_OFFER_LAST, String(Date.now())); } catch {}
                  setStreakRestoreOffer(null);
                }}
                style={{ marginTop: 12, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(250,248,242,0.45)' }}>Start fresh instead</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── NPS / SENTIMENT PROMPT ── */}
      <Modal visible={showNpsPrompt} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.freezeTitle}>How's Celestia treating you?</Text>
              <Text style={styles.freezeSub}>One tap. Helps us know what to build next.</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 18 }}>
                {[
                  { score: 4, emoji: '😍', label: 'Love it' },
                  { score: 3, emoji: '🙂', label: 'Good' },
                  { score: 2, emoji: '😐', label: 'Meh' },
                  { score: 1, emoji: '😞', label: 'Not great' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.score}
                    activeOpacity={0.7}
                    onPress={async () => {
                      haptic.light();
                      try { await saveObject(StorageKeys.NPS_LAST_SUBMITTED, { score: opt.score, at: Date.now() }); } catch {}
                      capture(EVENTS.NPS_SCORE_SUBMITTED, { score: opt.score, label: opt.label });
                      setShowNpsPrompt(false);
                    }}
                    style={{ alignItems: 'center', padding: 8 }}
                  >
                    <Text style={{ fontSize: 30, marginBottom: 4 }}>{opt.emoji}</Text>
                    <Text style={{ fontSize: 10, color: 'rgba(250,248,242,0.55)' }}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={async () => {
                  // Skip — record so we don't re-prompt for 30 days
                  try { await saveObject(StorageKeys.NPS_LAST_SUBMITTED, { score: null, at: Date.now(), skipped: true }); } catch {}
                  setShowNpsPrompt(false);
                }}
                style={{ paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(250,248,242,0.45)' }}>Skip</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── D2 STREAK-FREEZE OFFER ── */}
      <Modal visible={showFreezeOffer} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.freezeIcon}>❅</Text>
              <Text style={styles.freezeTitle}>You have a streak freeze</Text>
              <Text style={styles.freezeSub}>
                Life happens. If you miss a day, your freeze keeps your streak going automatically — no action needed.
              </Text>
              <View style={styles.freezeStat}>
                <Text style={styles.freezeStatLabel}>Available</Text>
                <Text style={styles.freezeStatValue}>1 freeze</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={async () => {
                  haptic.light();
                  setShowFreezeOffer(false);
                  try { await saveBoolean(StorageKeys.FREEZE_OFFER_SHOWN, true); } catch {}
                  capture(EVENTS.STREAK_FREEZE_OFFER_ACKNOWLEDGED);
                }}
              >
                <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.freezeCta}>
                  <Text style={styles.freezeCtaText}>Got it</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── D30 REVEAL CALLBACK ── one-shot, re-surfaces the onboarding wow */}
      <Modal visible={!!d30RevealCallback} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.recapKicker}>ONE MONTH AGO</Text>
              <Text style={styles.recapHeadline}>You read this about yourself:</Text>
              <Text style={[styles.recapBody, { marginTop: 12 }]}>"{d30RevealCallback?.firstReveal}"</Text>
              <View style={styles.recapDivider} />
              <Text style={styles.recapForward}>Still true? It will keep getting truer.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={async () => {
                    haptic.light();
                    try { await saveBoolean(StorageKeys.D30_REVEAL_CALLBACK_SHOWN, true); } catch {}
                    setD30RevealCallback(null);
                  }}
                  style={{ flex: 1 }}
                >
                  <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.freezeCta}>
                    <Text style={styles.freezeCtaText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── PRO WEEK-1 RECAP (Day 7 of being Pro) ── */}
      <Modal visible={!!proWeek1Recap} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.recapKicker}>YOUR FIRST WEEK AS PRO</Text>
              <Text style={styles.recapHeadline}>{proWeek1Recap?.headline}</Text>
              <Text style={styles.recapBody}>{proWeek1Recap?.body}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    haptic.light();
                    const target = proWeek1Recap?.suggestedTab;
                    setProWeek1Recap(null);
                    if (target) {
                      navigation.navigate(target);
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.freezeCta}>
                    <Text style={styles.freezeCtaText}>{proWeek1Recap?.cta || 'Continue'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── D7 FIRST-WEEK RECAP ── */}
      <Modal visible={!!firstWeekRecap} transparent animationType="fade">
        <View style={styles.freezeOverlay}>
          <View style={styles.freezeCard}>
            <LinearGradient colors={['#3A1A28', '#5A2840', '#3A1A28']} style={styles.freezeGradient}>
              <Text style={styles.recapKicker}>YOUR FIRST 7 DAYS</Text>
              <Text style={styles.recapHeadline}>{firstWeekRecap?.headline}</Text>
              <Text style={styles.recapBody}>{firstWeekRecap?.observation}</Text>
              <View style={styles.recapDivider} />
              <Text style={styles.recapForward}>{firstWeekRecap?.threadForward}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 22, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    haptic.light();
                    try {
                      await Share.share({
                        message: `"${firstWeekRecap?.headline}"\n\n${firstWeekRecap?.observation}\n\n— Celestia ✦`,
                      });
                    } catch {}
                    trackEvent('share').catch(() => { });
                    awardXP(userProfile?.id || 'default', 'share').catch(() => { });
                  }}
                  style={{ flex: 1 }}
                >
                  <View style={styles.recapShareBtn}>
                    <Text style={styles.recapShareText}>Share</Text>
                  </View>
                </TouchableOpacity>
                <Button
                  label="Continue"
                  variant="primary"
                  onPress={() => setFirstWeekRecap(null)}
                  style={{ flex: 1 }}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── BADGE UNLOCK MODAL ── */}
      <BadgeUnlockModal
        visible={!!pendingBadge}
        badge={pendingBadge}
        onDismiss={() => setPendingBadge(null)}
        levelName={xpData?.current?.name}
        onShare={() => {
          trackEvent('share').catch(() => { });
          awardXP(userProfile?.id || 'default', 'share').catch(() => { });
        }}
      />

      {/* ── STREAK MILESTONE MODAL ── */}
      <StreakMilestoneModal
        visible={!!streakMilestone}
        streak={streakMilestone?.streak}
        emoji={streakMilestone?.emoji}
        message={streakMilestone?.message}
        onDismiss={() => setStreakMilestone(null)}
        onShare={() => {
          trackEvent('share').catch(() => { });
          awardXP(userProfile?.id || 'default', 'share').catch(() => { });
        }}
      />

      {/* ── LEVEL UP MODAL ── */}
      <LevelUpModal
        visible={!!levelUpData}
        levelName={levelUpData?.levelName}
        totalXP={levelUpData?.totalXP}
        onDismiss={() => setLevelUpData(null)}
        onShare={() => {
          trackEvent('share').catch(() => { });
          awardXP(userProfile?.id || 'default', 'share').catch(() => { });
        }}
      />

      {/* ── STREAK DETAIL MODAL ── */}
      <Modal visible={showStreakModal} animationType="slide" transparent>
        <TouchableOpacity style={styles.streakOverlay} activeOpacity={1} onPress={() => setShowStreakModal(false)}>
          <View style={[styles.streakSheet, { backgroundColor: colors.bg }]} onStartShouldSetResponder={() => true}>
            <View style={styles.streakHandle} />
            <View style={styles.streakCardsRow}>
              <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.streakCardEmoji}>{getStreakEmoji(streakData?.current_streak || 0)}</Text>
                <Text style={[styles.streakCardNum, { color: colors.heading }]}>{streakData?.current_streak || 0}</Text>
                <Text style={[styles.streakCardLbl, { color: colors.textSecondary }]}>Day Streak</Text>
              </View>
              <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.streakCardEmoji}>🏆</Text>
                <Text style={[styles.streakCardNum, { color: colors.heading }]}>{streakData?.longest_streak || 0}</Text>
                <Text style={[styles.streakCardLbl, { color: colors.textSecondary }]}>Longest</Text>
              </View>
              <View style={[styles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.streakCardEmoji}>📅</Text>
                <Text style={[styles.streakCardNum, { color: colors.heading }]}>{streakData?.total_check_ins || 0}</Text>
                <Text style={[styles.streakCardLbl, { color: colors.textSecondary }]}>Total Days</Text>
              </View>
            </View>
            {(() => {
              const current = streakData?.current_streak || 0;
              const next = [3, 7, 14, 30, 50, 100, 365].find(v => v > current);
              if (!next) return null;
              return (
                <View style={[styles.streakNextBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.streakNextLbl, { color: colors.heading }]}>Next: {getMilestoneMessage(next)}</Text>
                  <View style={styles.streakNextBarBg}>
                    <View style={[styles.streakNextBarFill, { width: `${(current / next) * 100}%` }]} />
                  </View>
                  <Text style={[styles.streakNextDays, { color: colors.textSecondary }]}>{next - current} days to go</Text>
                </View>
              );
            })()}
            <TouchableOpacity style={styles.streakDoneBtn} activeOpacity={0.7} onPress={() => setShowStreakModal(false)}>
              <Text style={styles.streakDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── NOTIFICATION PERMISSION MODAL ── */}
      <NotificationPermissionModal
        visible={showNotifModal}
        onEnable={async () => {
          setShowNotifModal(false);
          await saveBoolean(StorageKeys.NOTIFICATION_ASKED, true);
          const granted = await requestNotificationPermission('home_modal');
          if (granted) {
            scheduleAllNotifications(userProfile, forecast, streakData, moonData, null, cosmicWindows).catch(() => { });
          }
        }}
        onDismiss={async () => {
          setShowNotifModal(false);
          await saveBoolean(StorageKeys.NOTIFICATION_ASKED, true);
        }}
      />

      {/* ── JOURNAL MODAL ── */}
      <Modal visible={showJournal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.journalModal, { backgroundColor: colors.bg }]}>
          <View style={[styles.journalModalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.journalModalTitle, { color: colors.heading }]}>Journal</Text>
            <TouchableOpacity onPress={() => setShowJournal(false)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.journalModalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.journalDateLabel, { color: colors.textSecondary }]}>{formatDateHeader()}</Text>
            <Text style={[styles.journalPromptLabel, { color: colors.heading }]}>
              {forecast?.mantra ? `"${forecast.mantra}"` : '"What is the universe trying to teach you?"'}
            </Text>

            {/* Mood selector */}
            <Text style={styles.moodLabel}>HOW ARE YOU FEELING?</Text>
            <View style={styles.moodRow}>
              {[
                { key: 'great', emoji: '😊', label: 'Great' },
                { key: 'good', emoji: '🙂', label: 'Good' },
                { key: 'okay', emoji: '😐', label: 'Okay' },
                { key: 'low', emoji: '😔', label: 'Low' },
                { key: 'anxious', emoji: '😰', label: 'Anxious' },
              ].map(m => (
                <TouchableOpacity key={m.key}
                  style={[styles.moodChip, journalMood === m.key && styles.moodChipActive]}
                  onPress={() => setJournalMood(m.key)}>
                  <Text style={{ fontSize: 20, marginBottom: 2 }}>{m.emoji}</Text>
                  <Text style={[styles.moodChipText, { color: colors.textSecondary }, journalMood === m.key && { color: colors.heading }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Energy level */}
            <Text style={styles.moodLabel}>ENERGY LEVEL</Text>
            <View style={styles.energySlider}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <TouchableOpacity key={n}
                  style={[styles.energyDot, n <= journalEnergy && styles.energyDotActive]}
                  onPress={() => setJournalEnergy(n)}>
                  <View style={[styles.energyDotInner, n <= journalEnergy && { backgroundColor: T.gold }]} />
                </TouchableOpacity>
              ))}
              <Text style={styles.energyNum}>{journalEnergy}/10</Text>
            </View>

            <TextInput style={[styles.journalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} multiline placeholder="Let your thoughts flow..."
              placeholderTextColor={colors.inputPlaceholder} value={journalText} onChangeText={setJournalText}
              textAlignVertical="top" />
            <TouchableOpacity style={[styles.journalSaveBtn, !journalText.trim() && { opacity: 0.5 }]}
              onPress={saveJournalEntry} disabled={!journalText.trim()}>
              <Text style={styles.journalSaveBtnText}>Save Entry</Text>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ── MOON RITUAL MODAL ── */}
      <Modal visible={showMoonRitual} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={[styles.journalModalHeader, { borderBottomColor: colors.divider }]}>
            <View>
              <Text style={[styles.journalModalTitle, { color: colors.heading }]}>
                {moonData?.phaseName === 'New Moon' ? '🌑 New Moon Ritual' : '🌕 Full Moon Ritual'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 }}>
                {moonData?.phaseName === 'New Moon' ? 'Set intentions with tonight\'s lunar energy' : 'Release what no longer serves you under tonight\'s light'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowMoonRitual(false)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {moonRitualLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={T.gold} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>Preparing your ritual...</Text>
            </View>
          ) : moonRitual ? (
            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 24, color: colors.heading, marginBottom: 8 }}>{moonRitual.title}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>
                {moonData?.phaseName} in {moonData?.sign} · {moonData?.illumination}% illumination
              </Text>
              <Text style={{ fontSize: 15, color: colors.text, lineHeight: 24, marginBottom: 20 }}>{moonRitual.opening}</Text>

              <View style={{ backgroundColor: colors.cardAlt, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 12 }}>
                  {moonData?.phaseName === 'New Moon' ? 'INTENTION PROMPTS' : 'REFLECTION PROMPTS'}
                </Text>
                {moonRitual.prompts?.map((p, i) => (
                  <Text key={i} style={{ fontSize: 14, color: colors.heading, lineHeight: 22, marginBottom: 8, fontFamily: FONTS.sansMedium }}>
                    {i + 1}. {p}
                  </Text>
                ))}
              </View>

              <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 8 }}>AFFIRMATION</Text>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 17, color: colors.heading, lineHeight: 24, fontStyle: 'italic' }}>
                  "{moonRitual.affirmation}"
                </Text>
              </View>

              <View style={{ backgroundColor: isDark ? 'rgba(155,142,196,0.1)' : '#F0EBF8', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: isDark ? colors.lavender : '#6B5CA5', marginBottom: 8 }}>CLOSING RITUAL</Text>
                <Text style={{ fontSize: 14, color: isDark ? colors.text : '#3D2E6B', lineHeight: 22 }}>{moonRitual.closingRitual}</Text>
              </View>

              <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: colors.textSecondary, marginBottom: 8 }}>
                {moonData?.phaseName === 'New Moon' ? 'MY INTENTION' : 'MY REFLECTION'}
              </Text>
              <TextInput
                style={[styles.journalInput, { minHeight: 100, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                multiline
                placeholder={moonData?.phaseName === 'New Moon' ? 'I am calling in...' : 'I am releasing...'}
                placeholderTextColor={colors.inputPlaceholder}
                value={ritualIntention}
                onChangeText={setRitualIntention}
                textAlignVertical="top"
                editable={!ritualSaved}
              />
              {ritualSaved ? (
                <View style={[styles.journalSaveBtn, { backgroundColor: isDark ? 'rgba(76,175,80,0.15)' : '#E8F5E9' }]}>
                  <Text style={[styles.journalSaveBtnText, { color: isDark ? colors.success : '#2E7D32' }]}>Intention Saved</Text>
                </View>
              ) : (
                <TouchableOpacity style={[styles.journalSaveBtn, !ritualIntention.trim() && { opacity: 0.5 }]}
                  onPress={saveMoonIntention} disabled={!ritualIntention.trim()}>
                  <Text style={styles.journalSaveBtnText}>
                    {moonData?.phaseName === 'New Moon' ? 'Set Intention' : 'Save Reflection'}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.textSecondary, textAlign: 'center' }}>
                Unable to generate your ritual. Try again later.
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ── VISUAL HIERARCHY — Today tab (CA-B3) ──
// Three tiers of cards, established to defeat "card soup" per the
// competitive audit (plan/competitive-audit/04-gaps-and-opportunities.md
// Gap 4). Use these conventions when adding new cards:
//
// TIER 1 — HERO: navigator briefing card (forecast.navigatorHeadline).
//   - Strongest background (LinearGradient + opacity)
//   - Largest headline (briefingHeadline style)
//   - Top of scroll within Today content
//   - One per session, always.
//
// TIER 2 — FEATURED: the rare, attention-earning cards.
//   - Pro insight (gold accent), surprise insight (gold accent),
//     indecision chip (gold accent, slightly warmer), at-risk banner
//     (terra/warm accent — intentionally NOT gold so it doesn't compete
//     with positive featured cards).
//   - Style template: RADIUS.md, gold-emphasis border, subtle gold bg
//     (or terra equivalent for at-risk).
//   - At most 2 simultaneously visible by design.
//
// TIER 3 — STANDARD: life-area cards, energy scores, sky now, journal,
//   quests, share cards.
//   - Restrained borders (subtle), secondary type weight.
//   - Many can be visible; visual weight low so they don't compete.
//
// When adding a new card: ask "does this earn FEATURED treatment?" By
// default the answer is no — most cards are STANDARD.

const styles = StyleSheet.create({
  // D2 freeze offer modal
  freezeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  freezeCard: { width: '100%', maxWidth: 340, borderRadius: 24, overflow: 'hidden' },
  freezeGradient: { padding: 28, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  freezeIcon: { fontSize: 36, marginBottom: 14 },
  freezeTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, textAlign: 'center', marginBottom: 10, lineHeight: 28 },
  freezeSub: { fontSize: 13, color: 'rgba(250,248,242,0.55)', textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  freezeStat: {
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', marginBottom: 22,
  },
  freezeStatLabel: { fontSize: 12, fontFamily: FONTS.sansMedium, color: 'rgba(250,248,242,0.55)', letterSpacing: 1, textTransform: 'uppercase' },
  freezeStatValue: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.gold },
  freezeCta: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', minWidth: 0 },
  freezeCtaText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy },
  // ── FEATURED-tier card (CA-B3) — shared visual treatment for the cards
  // that should command attention above standard surfaces but below the
  // hero navigator briefing. Used by: Pro insight, surprise insight,
  // indecision chip, at-risk banner. Tokens-driven: RADIUS.md + OPACITY
  // emphasis-border + subtle gold background.
  featuredCard: {
    borderRadius: 14,    // RADIUS.md from src/constants/tokens.js
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.32)',  // GOLD_ALPHA.emphasis
    backgroundColor: 'rgba(200,168,75,0.06)', // GOLD_ALPHA.subtle
    padding: 14,
    marginBottom: 12,
  },
  // Pro daily-insight card (TIER2-D) — extends featuredCard
  proInsightCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.32)',
    backgroundColor: 'rgba(200,168,75,0.06)',
    padding: 14,
    marginBottom: 14,
  },
  proInsightHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  proInsightKicker: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontFamily: FONTS.sansSemiBold,
    color: T.gold,
    textTransform: 'uppercase',
  },
  proInsightHeadline: {
    fontFamily: FONTS.serif,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 6,
  },
  proInsightBody: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
  },
  // D7 first-week recap card
  recapKicker: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.8, color: T.gold, marginBottom: 12, textTransform: 'uppercase' },
  recapHeadline: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, textAlign: 'center', lineHeight: 30, marginBottom: 14 },
  recapBody: { fontSize: 14, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: 'rgba(250,248,242,0.78)', textAlign: 'center', lineHeight: 22 },
  recapDivider: { width: 30, height: 1, backgroundColor: 'rgba(200,168,75,0.35)', marginVertical: 16 },
  recapForward: { fontSize: 13, color: 'rgba(250,248,242,0.55)', textAlign: 'center', lineHeight: 20 },
  recapShareBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)' },
  recapShareText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.gold },
  // Hero
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 46, position: 'relative', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  greeting: { fontSize: 13, color: 'rgba(250,248,242,0.6)', marginBottom: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroName: { fontFamily: FONTS.serif, fontSize: 34, color: T.cream },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', position: 'relative' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 19, color: T.gold },
  avatarRing: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 2, top: -3, left: -3 },
  // Floating tab pill
  floatingTabWrap: { marginTop: -24, paddingHorizontal: 20, marginBottom: 16, zIndex: 10 },
  floatingTabBar: { flexDirection: 'row', borderRadius: 100, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1 },
  floatingTab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 100 },
  floatingTabOn: { backgroundColor: T.navy },
  floatingTabText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.stone },
  floatingTabTextOn: { color: T.cream, fontFamily: FONTS.sansSemiBold },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,168,75,0.15)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  streakBadgeTrial: { backgroundColor: 'rgba(200,168,75,0.24)', borderColor: T.gold, paddingVertical: 7, paddingHorizontal: 14, gap: 6 },
  streakBadgeEmoji: { fontSize: 14 },
  streakBadgeNum: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: T.gold },
  streakBadgeNumTrial: { fontSize: 17, fontFamily: FONTS.sansBold },

  // Monthly recap
  recapCardWrap: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  recapShareBtn: { alignSelf: 'center', backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 20, marginTop: 10 },
  recapShareText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },

  content: { paddingHorizontal: 20, paddingTop: 14 },

  // Briefing card (standalone dark)
  // ── TIER 1 HERO — the navigator briefing card. Hero-tier per the
  // hierarchy doc above. Slightly stronger shadow than other cards to anchor
  // visual weight; padding sits between SPACING.md and lg for breathing room.
  briefingCard: { borderRadius: 20, padding: 24, marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 28 },
  goalEchoCard: { backgroundColor: 'rgba(200, 168, 75, 0.07)', borderLeftWidth: 3, borderLeftColor: T.gold, borderRadius: 12, padding: 16, marginBottom: 16 },
  goalEchoKicker: { fontSize: 9, letterSpacing: 1.6, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 6 },
  goalEchoBody: { fontSize: 14, fontFamily: FONTS.serif, lineHeight: 20 },
  trialSummaryCard: { backgroundColor: 'rgba(200, 168, 75, 0.10)', borderWidth: 1, borderColor: 'rgba(200, 168, 75, 0.32)', borderRadius: 18, padding: 22, marginBottom: 18 },
  trialSummaryKicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 8 },
  trialSummaryHeadline: { fontSize: 24, fontFamily: FONTS.serif, lineHeight: 30, marginBottom: 16 },
  trialSummaryStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 14 },
  trialSummaryStat: { alignItems: 'center', flex: 1 },
  trialSummaryDivider: { width: 1, height: 36, backgroundColor: 'rgba(200,168,75,0.25)' },
  trialSummaryNum: { fontSize: 28, fontFamily: FONTS.serifSemiBold, color: T.gold, marginBottom: 2 },
  trialSummaryLabel: { fontSize: 11, fontFamily: FONTS.sans, textAlign: 'center' },
  trialSummaryReveal: { fontSize: 13, fontFamily: FONTS.serif, fontStyle: 'italic', textAlign: 'center', lineHeight: 18, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(200,168,75,0.18)' },
  lossWarningCard: { backgroundColor: 'rgba(232, 120, 120, 0.06)', borderWidth: 1, borderColor: 'rgba(232, 120, 120, 0.25)', borderRadius: 16, padding: 18, marginBottom: 18 },
  lossWarningKicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: FONTS.sansSemiBold, color: '#E87878', marginBottom: 8 },
  lossWarningHeadline: { fontSize: 17, fontFamily: FONTS.serifSemiBold, marginBottom: 12 },
  lossWarningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  lossWarningGlyph: { fontSize: 14, color: T.gold, width: 18 },
  lossWarningItem: { fontSize: 13, fontFamily: FONTS.sans, flex: 1, lineHeight: 18 },
  lossWarningFooter: { fontSize: 11, fontFamily: FONTS.sans, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  dailyCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 28 },
  dailyHd: { padding: 20, paddingHorizontal: 21, paddingBottom: 17 },
  dailyDate: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(250,248,242,0.4)' },
  // Hero-tier headline — slightly larger than other modal headlines to
  // anchor the eye when the briefing card is on screen.
  briefingHeadline: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream, lineHeight: 38, marginBottom: 16 },
  dailyHeadline: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, lineHeight: 28, marginBottom: 12 },
  tchips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tchip: { backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.22)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  tchipText: { fontSize: 10, fontFamily: FONTS.sansMedium, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 },
  dailyBody: { backgroundColor: 'white', padding: 17, paddingHorizontal: 21, paddingBottom: 19 },
  mantraBox: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: T.gold },
  nudgeBox: { backgroundColor: 'rgba(193,127,89,0.06)', borderWidth: 1, borderColor: 'rgba(193,127,89,0.15)', borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#C17F59' },

  // ── BENTO row (AND-7) — 3-cell asymmetric grid breaking the vertical-stack
  // monotony of Today tab. Streak cell is the hero (gold-accent); other two
  // are restrained. Per plan/senior-design-critique/04-replaceable-patterns.md.
  bentoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  bentoCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 86,
    justifyContent: 'space-between',
  },
  bentoCellAccent: {
    backgroundColor: 'rgba(200,168,75,0.06)', // GOLD_ALPHA.subtle
  },
  bentoLabel: {
    fontSize: 9,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bentoValue: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    lineHeight: 26,
  },
  bentoValueAccent: {
    fontFamily: FONTS.serif,
    fontSize: 32,
    lineHeight: 36,
    color: T.gold,
  },
  bentoValueSm: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  bentoSub: {
    fontSize: 10,
    fontFamily: FONTS.sansMedium,
    marginTop: 2,
  },
  nudgeLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#C17F59', marginBottom: 6 },
  nudgeText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.ink, lineHeight: 22, fontStyle: 'italic' },
  mantraText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14.5, color: '#8B6214', lineHeight: 21, fontStyle: 'italic' },
  paraBlock: { marginBottom: 12 },
  paraLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 4 },
  dailyTxt: { fontSize: 13.5, color: T.ink, lineHeight: 22.5, marginBottom: 6 },
  actionBox: { backgroundColor: T.warm, borderRadius: 14, padding: 14, marginBottom: 12 },
  actionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  actionArrow: { fontSize: 12, color: T.gold, marginTop: 2 },
  actionItem: { fontSize: 13, color: T.ink, lineHeight: 20, flex: 1 },

  // Day at a Glance
  dagCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: T.border },
  dagSectionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 12 },
  dagGrid: { flexDirection: 'row', alignItems: 'center' },
  dagCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dagDivider: { width: 1, height: 32, backgroundColor: '#EDE6D8' },
  dagLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, color: T.stone, marginBottom: 4 },
  dagValue: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, textAlign: 'center' },
  dagSub: { fontSize: 11, color: T.stone, marginTop: 2 },

  // Evening Reflection
  eveningCard: { backgroundColor: '#F8F4EE', borderWidth: 1, borderColor: '#EDE6D8', borderRadius: 16, padding: 16, marginBottom: 15 },
  eveningLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 8 },
  eveningPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.navy, fontStyle: 'italic', lineHeight: 22, marginBottom: 12 },
  eveningMoodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 6 },
  eveningMoodBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'transparent' },
  eveningMoodBtnActive: { backgroundColor: 'rgba(200,168,75,0.14)', borderColor: T.gold },
  eveningMoodEmoji: { fontSize: 20, marginBottom: 2 },
  eveningMoodLabel: { fontSize: 9, fontFamily: FONTS.sansMedium, color: T.stone },
  eveningMoodLabelActive: { color: T.gold },
  eveningMoodSaved: { fontSize: 12, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.stone, textAlign: 'center', marginBottom: 10 },
  eveningBtn: { backgroundColor: T.warm, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  eveningBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },

  // Sunday Reflection
  sundayCard: { backgroundColor: '#F3EEF8', borderWidth: 1, borderColor: '#E2DAEF', borderRadius: 16, padding: 18, marginBottom: 15 },
  sundayLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#9B8EC4', marginBottom: 6 },
  sundayTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, marginBottom: 6 },
  sundaySub: { fontSize: 12.5, color: T.stone, lineHeight: 19 },
  sundayBtn: { backgroundColor: T.warm, borderWidth: 1, borderColor: T.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  sundayBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },
  sundayNextWeek: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  sundayNextWeekText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.stone },

  // What's New Today banner
  changeBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#D8DCFF', borderRadius: 14, padding: 13, marginBottom: 12 },
  changeBannerIcon: { fontSize: 22 },
  changeBannerTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: '#2A2060', marginBottom: 2 },
  changeBannerSub: { fontSize: 11, color: '#5A5090', lineHeight: 16 },
  changeBannerArrow: { fontSize: 14, color: '#8880C0' },

  // Drip-feed unlock card
  unlockCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  unlockCardGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  unlockCardIcon: { fontSize: 28, color: T.gold },
  unlockCardLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 3 },
  unlockCardTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.cream, marginBottom: 2 },
  unlockCardSub: { fontSize: 11, color: 'rgba(250,248,242,0.5)', lineHeight: 16 },
  unlockCardArrow: { fontSize: 18, color: T.gold },

  // Cosmic season
  seasonCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  seasonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  seasonLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone },
  seasonDays: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.gold },
  seasonTitle: { fontFamily: FONTS.serif, fontSize: 16, color: T.navy, marginBottom: 10 },
  seasonBarTrack: { height: 5, backgroundColor: '#EDE6D8', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  seasonBarFill: { height: '100%', backgroundColor: T.gold, borderRadius: 3 },
  seasonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seasonFooterText: { fontSize: 10, color: T.stone },
  seasonFooterPct: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.gold },

  // Moon ritual card
  moonRitualCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  moonRitualGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  moonRitualMoon: { fontSize: 32 },
  moonRitualLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 3 },
  moonRitualTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.cream, marginBottom: 2 },
  moonRitualSub: { fontSize: 11, color: 'rgba(250,248,242,0.5)', lineHeight: 16 },
  lunarShareBtn: { alignSelf: 'center', marginTop: -4, marginBottom: 12, paddingVertical: 6, paddingHorizontal: 16 },
  lunarShareText: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.gold },


  // Section label
  sectionLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },

  // ── Today's Sky card ──
  skyCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden', shadowColor: '#0A0818', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 8 },
  skyGrad: { padding: 20, position: 'relative', overflow: 'hidden' },
  skyGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(100,80,200,0.08)', right: -40, top: -50 },
  skyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  skyLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(200,168,75,0.45)' },
  skyArrowCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)', alignItems: 'center', justifyContent: 'center' },
  skyArrowText: { fontSize: 13, color: T.gold },
  skyMoonRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  skyMoonEmoji: { fontSize: 36 },
  skyMoonPhase: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, lineHeight: 28 },
  skyMoonSign: { fontFamily: FONTS.sans, fontSize: 12, color: 'rgba(250,248,242,0.4)', marginTop: 2 },
  skyDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 14 },
  skySnapGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  skySnapItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  skySnapIcon: { fontSize: 16, color: T.gold },
  skySnapLabel: { fontSize: 9, fontFamily: FONTS.sans, color: 'rgba(250,248,242,0.35)', letterSpacing: 0.5 },
  skySnapValue: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: 'rgba(250,248,242,0.75)', marginTop: 1 },
  skySeasonWrap: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  skySeasonInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  skySeasonText: { fontSize: 11, color: 'rgba(250,248,242,0.5)', fontFamily: FONTS.sans },
  skySeasonPct: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.gold },
  skySeasonTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  skySeasonFill: { height: 3, backgroundColor: T.gold, borderRadius: 2 },
  skyCtaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  skyCta: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  skyCtaArrow: { fontSize: 13, color: T.gold },

  // Planet strip
  pstrip: { marginBottom: 15 },
  pchip: { backgroundColor: 'white', borderRadius: 13, paddingVertical: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: T.border, marginRight: 7 },
  pchipGlyph: { fontSize: 18 },
  pchipName: { fontSize: 9.5, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.7, color: T.stone },
  pchipPos: { fontFamily: FONTS.serif, fontSize: 13.5, color: T.navy },

  // Journal
  journalCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, paddingHorizontal: 18, marginBottom: 15, borderWidth: 1, borderColor: T.border },
  jcardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  jcardTitle: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone },
  jcardBadge: { backgroundColor: '#F0E8D6', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  jcardBadgeText: { fontSize: 10, color: '#6B6050' },
  jcardPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.navy, lineHeight: 22, marginBottom: 12, fontStyle: 'italic' },
  jcardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.warm, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  jcardCta: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.ink },
  jcardArrow: { fontSize: 14, color: T.gold },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 9, marginBottom: 15 },
  quickCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  quickIcon: { fontSize: 20, color: T.gold, marginBottom: 6 },
  quickLabel: { fontSize: 10.5, fontFamily: FONTS.sansMedium, color: T.navy, textAlign: 'center' },

  // Promo
  promo: { borderRadius: 20, padding: 19, paddingHorizontal: 20, marginBottom: 15 },
  promoLbl: { fontSize: 10, letterSpacing: 2, color: 'rgba(200,168,75,0.58)', marginBottom: 5 },
  promoTitle: { fontFamily: FONTS.serif, fontSize: 22, color: 'white', marginBottom: 3 },
  promoSub: { fontSize: 12, color: 'rgba(255,255,255,0.42)', marginBottom: 14 },
  promoCta: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 11, paddingVertical: 8, paddingHorizontal: 15, alignSelf: 'flex-start' },
  promoCtaText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: 'white' },

  // Domain Modal
  // ── Life Area Modal (lam*) ──
  lamHero: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center',  },
  lamTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 },
  lamDateLabel: { fontSize: 10, fontFamily: FONTS.sansMedium, letterSpacing: 2, color: 'rgba(250,248,242,0.3)' },
  lamCloseBtn: { fontSize: 18, color: 'rgba(250,248,242,0.5)', padding: 4 },
  lamIconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 14, width: 80, height: 80 },
  lamIconGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 8 },
  lamIconRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  lamHeroIcon: { fontSize: 30 },
  lamHeroTitle: { fontFamily: FONTS.serif, fontSize: 26, color: T.cream, marginBottom: 4, textAlign: 'center', letterSpacing: 0.3 },
  lamHeroSub: { fontSize: 11, color: 'rgba(250,248,242,0.4)', marginBottom: 18, letterSpacing: 1, fontFamily: FONTS.sans },
  lamGlassCard: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  lamGlassRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  lamEnergyPill: { borderRadius: 10, paddingVertical: 5, paddingHorizontal: 14 },
  lamEnergyPillText: { fontSize: 12, fontFamily: FONTS.sansBold },
  lamIntensityWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  lamIntensityLabelLeft: { fontSize: 10, color: 'rgba(250,248,242,0.35)', fontFamily: FONTS.sans, width: 48 },
  lamIntensityTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  lamIntensityFill: { height: 4, borderRadius: 2 },
  lamIntensityNum: { fontSize: 11, fontFamily: FONTS.sansBold, width: 28, textAlign: 'right' },
  lamGlassChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  lamHeroChip: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 12, borderWidth: 1, backgroundColor: 'transparent' },
  lamHeroChipText: { fontSize: 11, fontFamily: FONTS.sansSemiBold },
  lamHeroChipTextLight: { fontSize: 11, color: 'rgba(250,248,242,0.6)', fontFamily: FONTS.sans },
  lamPlanetReason: { fontFamily: FONTS.sans, fontSize: 13, color: T.stone, lineHeight: 19, marginBottom: 16, fontStyle: 'italic' },
  lamReadingBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  lamSectionLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 1.2, color: T.stone, marginBottom: 10 },
  lamReadingText: { fontFamily: FONTS.sans, fontSize: 14, color: T.ink, lineHeight: 23 },
  lamVibeBox: { borderLeftWidth: 3, paddingLeft: 14, marginBottom: 16, paddingVertical: 4 },
  lamVibeLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 },
  lamVibeText: { fontFamily: FONTS.sans, fontSize: 14, color: T.ink, lineHeight: 22 },
  lamDoSection: { marginBottom: 16 },
  lamDoRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  lamDoDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  lamDoArrow: { fontSize: 14, marginTop: 1 },
  lamDoText: { fontFamily: FONTS.sans, fontSize: 14, color: T.navy, lineHeight: 20, flex: 1 },
  lamAvoidSection: { marginBottom: 16 },
  lamAvoidLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 1.2, color: '#D97706', marginBottom: 10 },
  lamAvoidIcon: { fontSize: 13, color: '#D97706', marginTop: 2 },
  lamCareerExtras: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  lamCareerRow: { marginBottom: 12 },
  lamCareerRowLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.2, color: T.gold, marginBottom: 4 },
  lamCareerRowText: { fontFamily: FONTS.sans, fontSize: 13, color: T.ink, lineHeight: 20 },
  lamTimingRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: '#F8F6F0', borderRadius: 12, padding: 14, marginBottom: 16 },
  lamTimingIcon: { fontSize: 16, color: T.stone, marginTop: 2 },
  lamTimingLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.2, color: T.stone, marginBottom: 3 },
  lamTimingText: { fontFamily: FONTS.sans, fontSize: 13, color: T.ink, lineHeight: 19 },
  lamRitualBox: { borderLeftWidth: 3, paddingLeft: 14, marginBottom: 16, paddingVertical: 6 },
  lamRitualLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.2, marginBottom: 5 },
  lamRitualText: { fontFamily: FONTS.sans, fontSize: 14, color: T.ink, lineHeight: 22 },
  lamAffirmationBox: { backgroundColor: '#FBF9F3', borderRadius: 14, padding: 18, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)' },
  lamAffirmationText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.gold, textAlign: 'center', lineHeight: 24 },
  lamNoteBox: { marginBottom: 20 },
  lamNoteText: { fontFamily: FONTS.sans, fontSize: 13, color: T.stone, fontStyle: 'italic', lineHeight: 20 },
  lamAskCelestiaBridge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 12, paddingVertical: 14, backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)' },
  lamAskCelestiaText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: T.gold },
  lamAskCelestiaArrow: { fontFamily: FONTS.sansMedium, fontSize: 15, color: T.gold },

  // Influence overlay (shared with planet influence modal)

  // Planet influence modal

  // Skeleton loading
  skeletonLine: { height: 14, backgroundColor: 'rgba(250,248,242,0.08)', borderRadius: 7, width: '80%' },
  skeletonChip: { height: 24, width: 70, backgroundColor: 'rgba(250,248,242,0.06)', borderRadius: 12 },
  skeletonBodyLine: { height: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 6, alignSelf: 'flex-start' },

  // Journal modal
  journalModal: { flex: 1, backgroundColor: T.cream },
  journalModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  journalModalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  journalModalBody: { flex: 1, padding: 20 },
  journalDateLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 },
  journalPromptLabel: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.navy, fontStyle: 'italic', lineHeight: 22, marginBottom: 16 },
  journalInput: { backgroundColor: 'white', borderRadius: 16, padding: 16, fontSize: 15, color: T.ink, borderWidth: 1, borderColor: '#EDE6D8', minHeight: 200, lineHeight: 24, fontFamily: FONTS.sansLight },
  journalSaveBtn: { backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  journalSaveBtnText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream },

  // Mood & energy tracking
  moodLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8, marginTop: 16 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  moodChip: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', flex: 1 },
  moodChipActive: { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: T.gold },
  moodChipText: { fontSize: 10, color: T.stone, marginTop: 2 },
  energySlider: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  energyDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  energyDotActive: {},
  energyDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E8E2D8' },
  energyNum: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.gold, marginLeft: 8 },

  // Streak modal
  streakOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  streakSheet: { backgroundColor: T.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
  streakHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8D0C4', alignSelf: 'center', marginBottom: 18 },
  streakCardsRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  streakCard: { flex: 1, backgroundColor: 'white', borderRadius: 15, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  streakCardEmoji: { fontSize: 20, marginBottom: 4 },
  streakCardNum: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy, lineHeight: 26 },
  streakCardLbl: { fontSize: 10, color: T.stone, marginTop: 2 },
  streakNextBox: { backgroundColor: 'white', borderRadius: 15, padding: 14, borderWidth: 1, borderColor: T.border },
  streakNextLbl: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 8 },
  streakNextBarBg: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 6 },
  streakNextBarFill: { height: '100%', borderRadius: 2, backgroundColor: T.gold },
  streakNextDays: { fontSize: 10, color: T.stone },
  streakDoneBtn: { alignSelf: 'center', marginTop: 16, backgroundColor: T.gold, borderRadius: 100, paddingVertical: 10, paddingHorizontal: 32 },
  streakDoneBtnText: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: T.navy },

  // Mercury Rx banner
  rxBanner: { backgroundColor: '#FFF0E0', borderWidth: 1, borderColor: '#F0D8B0', borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  rxBannerTap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13 },
  rxIcon: { fontSize: 22, color: '#D08020' },
  rxTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: '#8A5A10', marginBottom: 2 },
  rxSub: { fontSize: 11, color: '#A07830', lineHeight: 16 },
  rxArrow: { fontSize: 14, color: '#C09030' },
  rxShareBtn: { borderTopWidth: 1, borderTopColor: '#F0D8B0', paddingVertical: 8, alignItems: 'center' },
  rxShareText: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: '#D08020' },

  // Cosmic windows
  // Cosmic alert card (matches notification)
  cosmicAlertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#3A1A28', borderRadius: 14, padding: 14, marginBottom: 12 },
  cosmicAlertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.gold, marginTop: 4 },
  cosmicAlertTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 3 },
  cosmicAlertBody: { fontSize: 12.5, color: 'rgba(250,248,242,0.7)', lineHeight: 18 },

  windowCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  windowLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 8 },
  windowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  windowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(200,168,75,0.4)' },
  windowText: { fontSize: 12.5, color: T.ink, flex: 1, lineHeight: 18 },
  windowExact: { fontSize: 8, fontFamily: FONTS.sansSemiBold, color: T.gold, letterSpacing: 1, backgroundColor: 'rgba(200,168,75,0.1)', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },

  // Next badge progress
  nextBadgeCard: { backgroundColor: 'white', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)' },
  nextBadgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  nextBadgeIcon: { fontSize: 24 },
  nextBadgeLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 1 },
  nextBadgeName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy },
  nextBadgeCount: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  nextBadgeBarBg: { width: '100%', height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 4 },
  nextBadgeBarFill: { height: '100%', borderRadius: 3, backgroundColor: T.gold },
  nextBadgeSub: { fontSize: 11, color: T.stone },

  // Cosmic whisper
  whisperCard: { backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)', borderRadius: 14, padding: 14, marginBottom: 12 },
  whisperCardRare: { backgroundColor: 'rgba(160,80,224,0.06)', borderColor: 'rgba(160,80,224,0.2)' },
  whisperLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: 'rgba(200,168,75,0.6)', marginBottom: 6 },
  whisperRarityBadge: { backgroundColor: 'rgba(160,80,224,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6 },
  whisperRarityText: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: '#8040C0' },
  whisperText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, color: '#8B6A28', lineHeight: 21, fontStyle: 'italic' },

  // XP float
  xpFloat: { position: 'absolute', top: Platform.OS === 'ios' ? 90 : 60, alignSelf: 'center', backgroundColor: 'rgba(200,168,75,0.18)', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 16, zIndex: 999 },
  xpFloatText: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: T.gold },
  previouslyCard: { backgroundColor: T.warm, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 12 },
  previouslyLabel: { fontSize: 9, letterSpacing: 2, color: T.stone, fontFamily: FONTS.sansSemiBold, marginBottom: 6 },
  previouslyText: { fontSize: 14, color: T.ink, fontFamily: FONTS.serifItalic || FONTS.serif, lineHeight: 20 },

  // Navigator Briefing
  // Briefing deep dive button
  briefingMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingVertical: 10, backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)' },
  briefingMoreText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  briefingMoreArrow: { fontSize: 14, color: T.gold, marginLeft: 6 },
  // Deep Dive Modal
  ddHero: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 24, paddingHorizontal: 22, alignItems: 'center' },
  ddHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 },
  ddDate: { fontSize: 10, fontFamily: FONTS.sansMedium, letterSpacing: 2, color: 'rgba(250,248,242,0.3)' },
  ddClose: { fontSize: 18, color: 'rgba(250,248,242,0.5)', padding: 4 },
  ddCompassWrap: { alignItems: 'center', justifyContent: 'center', width: 56, height: 56, marginBottom: 12 },
  ddCompassGlow: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(200,168,75,0.12)', shadowColor: '#C8A84B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 },
  ddCompassRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(200,168,75,0.25)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  ddCompassIcon: { fontSize: 20, color: T.gold },
  ddLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(200,168,75,0.45)', marginBottom: 10 },
  ddHeadline: { fontFamily: FONTS.serif, fontSize: 26, color: T.cream, lineHeight: 33, marginBottom: 8, textAlign: 'center' },
  ddSummary: { fontFamily: FONTS.sans, fontSize: 14, color: 'rgba(250,248,242,0.55)', lineHeight: 21, marginBottom: 14, textAlign: 'center' },
  ddChipsGlass: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  ddChipItem: { paddingHorizontal: 8, paddingVertical: 2 },
  ddChipText: { fontSize: 11, color: 'rgba(250,248,242,0.55)', fontFamily: FONTS.sans },
  ddSection: { paddingHorizontal: 22, marginTop: 20 },
  ddSectionLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 12 },
  ddParaBlock: { marginBottom: 14 },
  ddParaLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 5 },
  ddParaText: { fontSize: 14, color: T.ink, lineHeight: 23 },
  ddInfluenceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ddInfluenceGlyph: { fontSize: 22, color: T.gold, marginTop: 2 },
  ddInfluenceTag: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: T.navy, marginBottom: 2 },
  ddInfluenceEffect: { fontSize: 12, color: T.stone, lineHeight: 17 },
  // ── Life Area deep cards ──
  laCard: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  laHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderLeftWidth: 4 },
  laHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  laIcon: { fontSize: 20 },
  laTitle: { fontFamily: FONTS.sansBold, fontSize: 15, color: T.navy },
  laSub: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone, marginTop: 1 },
  laEnergyBadge: { borderRadius: 10, paddingVertical: 4, paddingHorizontal: 12 },
  laEnergyText: { fontSize: 11, fontFamily: FONTS.sansSemiBold },
  laMeta: { paddingHorizontal: 16, paddingBottom: 10 },
  laIntensityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  laMetaLabel: { fontFamily: FONTS.sans, fontSize: 10, color: T.stone, width: 52 },
  laIntensityTrack: { flex: 1, height: 4, backgroundColor: '#F0EDE6', borderRadius: 2, overflow: 'hidden' },
  laIntensityFill: { height: 4, borderRadius: 2 },
  laIntensityNum: { fontFamily: FONTS.sansSemiBold, fontSize: 11, width: 30, textAlign: 'right' },
  laMetaChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  laChip: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 10 },
  laChipText: { fontSize: 10, fontFamily: FONTS.sansSemiBold },
  laChipTextMuted: { fontSize: 10, fontFamily: FONTS.sans, color: T.stone },
  laPlanetReason: { fontFamily: FONTS.sans, fontSize: 12, color: T.stone, lineHeight: 17, paddingHorizontal: 16, marginBottom: 10 },
  laHoroscopeBox: { backgroundColor: '#FAFAF7', borderRadius: 10, marginHorizontal: 16, marginBottom: 12, padding: 14 },
  laHoroscopeText: { fontFamily: FONTS.sans, fontSize: 13, color: T.navy, lineHeight: 20 },
  laDoSection: { paddingHorizontal: 16, marginBottom: 8 },
  laDoLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  laDoRow: { flexDirection: 'row', gap: 6, marginBottom: 5, alignItems: 'flex-start' },
  laDoArrow: { fontSize: 13, marginTop: 1 },
  laDoText: { fontFamily: FONTS.sans, fontSize: 13, color: T.navy, lineHeight: 18, flex: 1 },
  laAvoidSection: { paddingHorizontal: 16, marginBottom: 8 },
  laAvoidLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, color: '#D97706', letterSpacing: 1, marginBottom: 6 },
  laAvoidIcon: { fontSize: 12, color: '#D97706', marginTop: 1 },
  laTimingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
  laTimingIcon: { fontSize: 13, color: T.stone },
  laTimingText: { fontFamily: FONTS.sans, fontSize: 12, color: T.stone, lineHeight: 17, flex: 1 },
  laRitualBox: { borderLeftWidth: 3, marginHorizontal: 16, marginBottom: 10, paddingLeft: 12, paddingVertical: 8 },
  laRitualLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.2, marginBottom: 4 },
  laRitualText: { fontFamily: FONTS.sans, fontSize: 12, color: T.navy, lineHeight: 18 },
  laAffirmationBox: { backgroundColor: '#FBF9F3', borderRadius: 10, marginHorizontal: 16, marginBottom: 10, padding: 12, alignItems: 'center' },
  laAffirmationText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 13, color: T.gold, textAlign: 'center', lineHeight: 20 },
  laNavNote: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone, fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 14, lineHeight: 16 },
  ddActionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ddActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  ddActionNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  ddActionNumText: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.cream },
  ddActionText: { fontSize: 13, color: T.navy, flex: 1, lineHeight: 18 },
  ddRitualCard: { backgroundColor: 'rgba(160,128,224,0.08)', borderRadius: 16, padding: 18, borderLeftWidth: 3, borderLeftColor: '#A080E0' },
  ddRitualLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#A080E0', marginBottom: 8 },
  ddRitualText: { fontSize: 14, color: T.ink, lineHeight: 21 },
  ddStatsCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ddStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  ddStatLabel: { fontSize: 12, color: T.stone, fontFamily: FONTS.sansMedium },
  ddStatValue: { fontSize: 14, color: T.navy, fontFamily: FONTS.sansMedium },
  ddStatDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
  ddMantraCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)' },
  ddMantraLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 10 },
  ddMantraText: { fontFamily: FONTS.serif, fontSize: 17, color: T.navy, textAlign: 'center', paddingHorizontal: 28, lineHeight: 25 },
  ddShareCard: { backgroundColor: T.navy, borderRadius: 16, padding: 20, alignItems: 'center', width: '100%' },
  ddShareText: { fontSize: 14, color: T.cream, fontFamily: FONTS.sansMedium, textAlign: 'center', lineHeight: 21, marginBottom: 10 },
  ddShareCta: { fontSize: 11, color: 'rgba(200,168,75,0.7)', fontFamily: FONTS.sansMedium },

  // Navigate Toward / Around
  navDoLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#10B981', marginBottom: 10 },
  navDoRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  navDoIcon: { fontSize: 13, color: '#10B981', marginTop: 1, fontWeight: '600' },
  navDoAction: { fontFamily: FONTS.sansMedium, fontSize: 13, color: T.navy, lineHeight: 18 },
  navDoReason: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone, lineHeight: 16, marginTop: 1 },
  navAvoidLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#F59E0B', marginBottom: 10 },
  navAvoidRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  navAvoidIcon: { fontSize: 12, color: '#F59E0B', marginTop: 1 },
  navAvoidAction: { fontFamily: FONTS.sansMedium, fontSize: 13, color: T.navy, lineHeight: 18 },
  navAvoidReason: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone, lineHeight: 16, marginTop: 1 },
  navAvoidAlt: { fontFamily: FONTS.sans, fontSize: 11, color: '#10B981', lineHeight: 16, marginTop: 2, fontStyle: 'italic' },

  // Life Area Navigator Cards
  lifeAreaCard: { width: 260, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 16, borderTopWidth: 3, padding: 16 },
  lifeAreaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  lifeAreaIcon: { fontSize: 20 },
  lifeAreaTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: T.navy },
  lifeAreaSubtitle: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone },
  lifeAreaEnergyBadge: { borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  lifeAreaEnergyText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 },
  lifeAreaPlanetReason: { fontFamily: FONTS.sans, fontSize: 11, color: T.stone, marginBottom: 10, lineHeight: 16, fontStyle: 'italic' },
  lifeAreaDoSection: { marginBottom: 8 },
  lifeAreaDoRow: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' },
  lifeAreaDoIcon: { fontSize: 12, marginTop: 1, fontWeight: '600' },
  lifeAreaDoText: { fontFamily: FONTS.sans, fontSize: 12, color: T.ink, lineHeight: 17, flex: 1 },
  lifeAreaAvoidSection: { marginBottom: 8 },
  lifeAreaAvoidRow: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' },
  lifeAreaAvoidIcon: { fontSize: 11, color: '#F59E0B', marginTop: 1 },
  lifeAreaAvoidText: { fontFamily: FONTS.sans, fontSize: 12, color: T.stone, lineHeight: 17, flex: 1 },
  lifeAreaNote: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 12, color: T.ink, lineHeight: 18, fontStyle: 'italic', marginBottom: 10 },
  lifeAreaCta: { fontFamily: FONTS.sansSemiBold, fontSize: 12, letterSpacing: 0.3 },

  // Circle widget
  circleWidget: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, padding: 14, paddingHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: T.border },
  circleWidgetLeft: { flex: 1 },
  circleWidgetTitle: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 },
  circleWidgetOrbs: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  circleWidgetOrb: { width: 32, height: 32, borderRadius: 16, position: 'relative' },
  circleWidgetOrbInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)' },
  circleWidgetOrbText: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: '#FFFFFF' },
  circleWidgetOrbScore: { position: 'absolute', bottom: -4, right: -2, backgroundColor: T.navy, borderRadius: 6, paddingHorizontal: 3, paddingVertical: 1, minWidth: 16, alignItems: 'center' },
  circleWidgetSub: { fontSize: 11, color: T.stone, fontFamily: FONTS.sans },
  // Time-adaptive prompt
  timePromptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.12)', borderRadius: 14, padding: 14, marginBottom: 14 },
  timePromptIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  timePromptTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 1 },
  timePromptSub: { fontSize: 11, color: T.stone },
});
