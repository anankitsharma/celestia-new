import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Modal, TextInput, Alert, Dimensions, Platform, StatusBar, Animated, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getMoonDataForDate, calculateCosmicEnergy, getTransitPlanets, getActiveCosmicWindows, isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance, getCosmicSeason } from '../services/astrologyService';
import { fetchExtendedForecast, generateThemeAnalysis, generateMoonRitual, generateMonthlyRecap } from '../services/geminiService';
import { ForecastRepository } from '../services/database/rep_forecasts';
import { loadObject, saveObject, loadString, saveString, loadBoolean, saveBoolean, StorageKeys } from '../services/storage';
import { haptic } from '../services/hapticService';
import { recordDailyCheckIn, getStreakEmoji, getMilestoneMessage } from '../services/streakService';
import { trackEvent } from '../services/achievementService';
import { awardXP, getXPStatus } from '../services/xpService';
import { getLevelInfo } from '../constants/levels';
import WelcomeBackModal from '../components/WelcomeBackModal';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import QuestCard from '../components/QuestCard';
import CosmicTooltip from '../components/CosmicTooltip';
import AstroText from '../components/AstroText';
import { scheduleAllNotifications, hasNotificationPermission, requestNotificationPermission } from '../services/notificationService';
import { refillCosmicLinesIfNeeded, getCosmicLineForDate } from '../services/cosmicLineService';
import { getTodayUnlock, markUnlockShown, getUnlockProgress } from '../services/unlockService';
import { getElementGreeting, getCosmicArchetype } from '../services/cosmicIdentityService';
import { getNextBadgeProgress } from '../services/achievementService';
import { isFeatureUnlocked } from '../constants/levels';
import { getTodayQuests, completeQuestAction } from '../services/questService';
import { getCosmicWhisper } from '../services/cosmicWhisperService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { JournalRepository } from '../services/database/rep_journal';
import DailyShareCard from '../components/DailyShareCard';
import DailyStoryCard from '../components/DailyStoryCard';
import MonthlyRecapCard from '../components/MonthlyRecapCard';
import { useShareCard } from '../components/ShareCard';
import StreakMilestoneModal from '../components/StreakMilestoneModal';
import LevelUpModal from '../components/LevelUpModal';
import MercuryRxCard from '../components/MercuryRxCard';
import LunarEventCard from '../components/LunarEventCard';
import WhisperShareCard from '../components/WhisperShareCard';

const { width: SCREEN_W } = Dimensions.get('window');

const MOON_PHASE_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

const PERIOD_TABS = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const ENERGY_CONFIG = [
  { key: 'Love', icon: '♡', tag: 'LOVE', color: '#E85090', bgColor: 'rgba(232,80,144,0.08)' },
  { key: 'Career', icon: '◆', tag: 'CAREER', color: '#5090E8', bgColor: 'rgba(80,144,232,0.08)' },
  { key: 'Health', icon: '✦', tag: 'VITALITY', color: '#50C878', bgColor: 'rgba(80,200,120,0.08)' },
  { key: 'Mood', icon: '☽', tag: 'MOOD', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.08)' },
  { key: 'Social', icon: '✧', tag: 'SOCIAL', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.08)' },
  { key: 'Creativity', icon: '◎', tag: 'CREATE', color: '#EC4899', bgColor: 'rgba(236,72,153,0.08)' },
  { key: 'Focus', icon: '◇', tag: 'FOCUS', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.08)' },
  { key: 'Luck', icon: '★', tag: 'LUCK', color: '#10B981', bgColor: 'rgba(16,185,129,0.08)' },
];

const ENERGY_LABELS = ['Quiet', 'Low', 'Gentle', 'Moderate', 'Warm', 'Steady', 'Balanced', 'Inspired', 'Elevated', 'Magnetic', 'Peak'];

const PLANET_GLYPHS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

const JOURNAL_KEY = 'celestia_journal_entries';

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
};

const formatDateHeader = (date = new Date()) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const getDateForTab = (tab) => {
  const d = new Date();
  if (tab === 'yesterday') d.setDate(d.getDate() - 1);
  if (tab === 'tomorrow') d.setDate(d.getDate() + 1);
  return d;
};

export default function HomeScreen({ navigation, route }) {
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('today');
  const [moonData, setMoonData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [transitPlanets, setTransitPlanets] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showFullReading, setShowFullReading] = useState(false);

  // Domain modal
  const [domainModal, setDomainModal] = useState(null); // 'Love' | 'Career' | null
  const [domainData, setDomainData] = useState(null);
  const [domainLoading, setDomainLoading] = useState(false);

  // Energy detail modal
  const [energyModal, setEnergyModal] = useState(null); // { tag, icon, color, pct, val, key }
  const [influenceModal, setInfluenceModal] = useState(null); // { tag, glyph, effect }

  // Journal
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalMood, setJournalMood] = useState(null);
  const [journalEnergy, setJournalEnergy] = useState(5);

  // Cosmic windows & retrograde
  const [cosmicWindows, setCosmicWindows] = useState([]);
  const [mercuryRx, setMercuryRx] = useState(false);
  const [cosmicWhisper, setCosmicWhisper] = useState(null);
  const [todayCosmicLine, setTodayCosmicLine] = useState(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Cosmic weather & change detection
  const [cosmicChange, setCosmicChange] = useState(null);
  const [transitSignificance, setTransitSignificance] = useState(0);
  const [tomorrowMoon, setTomorrowMoon] = useState(null);
  const [tomorrowWindows, setTomorrowWindows] = useState([]);

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

  // Celebration modals
  const [streakMilestone, setStreakMilestone] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tabScrollRef = useRef(null);
  const mainScrollRef = useRef(null);
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

    // Cosmic change detection ("What's New Today" banner)
    try {
      const change = getCosmicChangeToday(userProfile.chart);
      setCosmicChange(change);
    } catch (e) { console.error('Cosmic change error:', e); }

    // Transit significance (for Cosmic Download days)
    try {
      const sig = calculateTransitSignificance(userProfile.chart, today);
      setTransitSignificance(sig);
    } catch (e) {}

    // Tomorrow preview data (forward hook)
    try {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      setTomorrowMoon(getMoonDataForDate(tmrw));
      setTomorrowWindows(getActiveCosmicWindows(userProfile.chart, tmrw).slice(0, 2));
    } catch (e) {}

    // Cosmic season
    try {
      const season = getCosmicSeason(userProfile.chart, today);
      setCosmicSeason(season);
    } catch (e) {}

    // Journal count for recap
    JournalRepository.getEntryCount(userProfile?.id || 'default').then(c => setJournalCount(c)).catch(() => {});

    // Monthly recap (1st-3rd of month)
    if (today.getDate() <= 3) {
      const recapKey = `recap_${today.getFullYear()}_${today.getMonth()}`;
      loadObject(recapKey).then(async (cached) => {
        if (cached) {
          setMonthlyRecap(cached);
          return;
        }
        // Generate recap for LAST month
        const chart = userProfile?.chart?.planets;
        const sig = chart ? `Sun: ${chart.find(p=>p.name==='Sun')?.sign}, Moon: ${chart.find(p=>p.name==='Moon')?.sign}, Rising: ${chart.find(p=>p.name==='Ascendant')?.sign}` : '';
        const journalCount = await JournalRepository.getEntryCount(userProfile?.id || 'default').catch(() => 0);
        const recap = await generateMonthlyRecap(sig, {
          daysActive: streakData?.total_check_ins || 0,
          journalEntries: journalCount,
          longestStreak: streakData?.longest_streak || 0,
        });
        if (recap) {
          setMonthlyRecap(recap);
          await saveObject(recapKey, recap);
        }
      }).catch(() => {});
    }

    // Drip-feed unlock check
    getTodayUnlock().then(unlock => setTodayUnlock(unlock)).catch(() => {});

    // Cosmic whisper (variable rate + tiered rarity)
    getCosmicWhisper().then(whisper => {
      if (whisper) {
        setCosmicWhisper(whisper.message);
        setWhisperRarity(whisper.rarity);
      }
    }).catch(() => {});

    // Streak + engagement
    (async () => {
      try {
        const profileId = userProfile.id || 'default';
        // Record check-in
        const streak = await recordDailyCheckIn(profileId);
        setStreakData(streak);

        // Show welcome back if returning after 2+ days
        if (streak?.daysAbsent >= 2 && streak?.isNew) {
          setShowWelcomeBack(true);
        }

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
        getTodayQuests().then(qd => setQuestData(qd)).catch(() => {});

        // Load next badge progress
        getNextBadgeProgress().then(nb => setNextBadge(nb)).catch(() => {});

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

  // Handle incoming navigation params (from notification deep-links)
  useEffect(() => {
    if (route?.params?.openJournal) {
      setShowJournal(true);
      navigation.setParams({ openJournal: undefined });
    }
    if (route?.params?.tab) {
      setActiveTab(route.params.tab);
      navigation.setParams({ tab: undefined });
    }
  }, [route?.params]);

  // Load forecast + energy whenever tab changes
  useEffect(() => {
    if (!userProfile?.chart) return;
    loadTabData(activeTab);
  }, [activeTab, userProfile]);

  const loadTabData = async (tab) => {
    // Energy scores — uses correct date for each tab
    const tabDate = getDateForTab(tab);
    const timeframe = ['yesterday', 'today', 'tomorrow'].includes(tab) ? tab : tab;
    try {
      const energy = calculateCosmicEnergy(userProfile.chart, tabDate, timeframe);
      setEnergyData(energy);
    } catch (e) { console.error('Energy error:', e); }

    // Forecast
    setForecastLoading(true);
    setShowFullReading(false);
    try {
      const dateLabel = tabDate.toISOString().split('T')[0];
      // Compute transits for the actual tab date, not just today
      let tabTransits;
      try { tabTransits = getTransitPlanets(tabDate); } catch { tabTransits = transitPlanets; }
      const planetaryData = {
        dateLabel,
        transits: tabTransits.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
      };
      // Compute transit significance for the tab date
      let tabSignificance = transitSignificance;
      if (tab !== 'today') {
        try { tabSignificance = calculateTransitSignificance(userProfile.chart, tabDate); } catch {}
      }
      const data = await fetchExtendedForecast(userProfile, tab, planetaryData, tabSignificance);
      setForecast(data);
      // Schedule notifications with latest forecast + full astrology data
      if (tab === 'today') {
        scheduleAllNotifications(userProfile, data, streakData, moonData, energyData, cosmicWindows).catch(() => {});
        // Load today's cosmic line for the alert card
        const todayStr = new Date().toISOString().split('T')[0];
        getCosmicLineForDate(todayStr).then(line => setTodayCosmicLine(line)).catch(() => {});
        // Refill AI cosmic lines buffer (fire-and-forget, re-schedules if new lines generated)
        refillCosmicLinesIfNeeded(userProfile).then(generated => {
          if (generated) {
            scheduleAllNotifications(userProfile, data, streakData, moonData, energyData, cosmicWindows).catch(() => {});
            // Also refresh today's line in case it was just generated
            getCosmicLineForDate(todayStr).then(line => setTodayCosmicLine(line)).catch(() => {});
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
        try { setMoonData(getMoonDataForDate(new Date())); } catch {}
        try { setTransitPlanets(getTransitPlanets(new Date())); } catch {}
        try { setCosmicWindows(getActiveCosmicWindows(chart, new Date()).slice(0, 3)); } catch {}
        try { setCosmicChange(getCosmicChangeToday(chart)); } catch {}
        try { setTransitSignificance(calculateTransitSignificance(chart, new Date())); } catch {}
        try { setCosmicSeason(getCosmicSeason(chart, new Date())); } catch {}
      }
      await loadTabData(activeTab);
      getTodayQuests().then(qd => setQuestData(qd)).catch(() => {});
      getNextBadgeProgress().then(nb => setNextBadge(nb)).catch(() => {});
    } catch {} finally {
      setRefreshing(false);
    }
  }, [userProfile, activeTab]);

  const loadJournalEntry = async () => {
    try {
      const entries = await loadObject(JOURNAL_KEY) || {};
      const dateStr = today.toISOString().split('T')[0];
      if (entries[dateStr]) { setJournalText(entries[dateStr]); setJournalSaved(true); }
    } catch (e) {}
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
          trackEvent('quest_complete').catch(() => {});
          awardXP(profileId, 'quest_bonus').then(xpB => { if (xpB) showXPGain(xpB.amount); }).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const openMoonRitual = async () => {
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
      const sig = chart ? `Sun: ${chart.find(p=>p.name==='Sun')?.sign}, Moon: ${chart.find(p=>p.name==='Moon')?.sign}, Rising: ${chart.find(p=>p.name==='Ascendant')?.sign}` : 'Unknown';
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

  const handleShare = async () => {
    haptic.medium();
    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
    try {
      const result = await Share.share({
        message: `${forecast?.header || 'Daily Cosmic Reading'}\n\n${forecast?.mantra ? `"${forecast.mantra}"\n\n` : ''}${forecast?.detailedHoroscope || ''}\n\n${forecast?.viralInsight ? `✦ ${forecast.viralInsight}\n\n` : ''}— Celestia ${sunSign ? `(${sunSign} Sun)` : ''}`,
      });
      if (result.action === Share.sharedAction) {
        const profileId = userProfile?.id || 'default';
        const badges = await trackEvent('share');
        processBadges(badges);
        const xp = await awardXP(profileId, 'share');
        if (xp) showXPGain(xp.amount);
        // Quest completion
        completeQuestAction('shared').then(r => {
          if (r) { setQuestData(prev => prev ? { ...prev, quests: r.quests, allComplete: r.allComplete } : prev); }
          if (r?.justCompleted) {
            trackEvent('quest_complete').catch(() => {});
            awardXP(profileId, 'quest_bonus').then(xpB => { if (xpB) showXPGain(xpB.amount); }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (e) {}
  };

  const openDomainModal = async (theme) => {
    setDomainModal(theme);
    setDomainData(null);
    setDomainLoading(true);
    try {
      const data = await generateThemeAnalysis(userProfile, theme, activeTab);
      setDomainData(data);
    } catch (e) {
      console.error('Domain analysis error:', e);
    } finally {
      setDomainLoading(false);
    }
  };

  if (profileLoading || !userProfile?.chart) {
    return (
      <View style={{ flex: 1, backgroundColor: T.cream, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  const moonPhase = moonData?.phaseName || 'Waning Crescent';
  const moonSign = moonData?.sign || '—';
  const moonIcon = MOON_PHASE_ICONS[moonPhase] || '🌘';
  const isDaily = ['yesterday', 'today', 'tomorrow'].includes(activeTab);

  // Energy display — keys match LIFE_AREAS
  const energyDisplay = ENERGY_CONFIG.map(cfg => {
    const found = energyData?.find(e => e.id === cfg.key);
    const pct = found ? Math.round(found.value) : 50;
    const labelIdx = Math.min(10, Math.floor(pct / 10));
    const isHigh = pct >= 85;
    const isLow = pct <= 35;
    return { ...cfg, pct, val: ENERGY_LABELS[labelIdx], isHigh, isLow };
  });

  // Cosmic weather summary word
  const avgEnergy = energyDisplay.length > 0 ? Math.round(energyDisplay.reduce((s, e) => s + e.pct, 0) / energyDisplay.length) : 50;
  const highCount = energyDisplay.filter(e => e.isHigh).length;
  const lowCount = energyDisplay.filter(e => e.isLow).length;
  const cosmicWeatherWord = highCount >= 4 ? 'Electric' : lowCount >= 4 ? 'Quiet' : highCount >= 2 ? 'Charged' : lowCount >= 2 ? 'Gentle' : avgEnergy >= 70 ? 'Flowing' : avgEnergy <= 40 ? 'Still' : 'Balanced';
  const isCosmicDownload = transitSignificance >= 70;

  const getEnergyDescription = (key, pct) => {
    const descs = {
      Love: pct >= 70 ? 'Venus and the Moon amplify your emotional magnetism right now. Connections deepen easily — lean into vulnerability and authentic expression.'
        : pct >= 40 ? 'Relationship energy is steady. Focus on small, meaningful gestures rather than grand romantic moves. Existing bonds benefit from honest communication.'
        : 'Emotional currents are subdued. This is a reflective phase — use it to understand your own needs before seeking connection with others.',
      Career: pct >= 70 ? 'Saturn and the Sun align in your favor. Professional momentum is strong — take initiative, pitch ideas, and step into leadership roles confidently.'
        : pct >= 40 ? 'Career energy is moderate. Steady progress is possible but avoid forcing outcomes. Focus on refining your work and building relationships with allies.'
        : 'Professional energy is in a quieter phase. Use this time for planning, skill-building, and reassessing your long-term goals rather than pushing for immediate results.',
      Health: pct >= 70 ? 'Mars and the Sun boost your physical vitality. Your body responds well to activity — prioritize movement, fresh air, and nourishing food.'
        : pct >= 40 ? 'Vitality is balanced. Maintain your routines and listen to your body\'s signals. Gentle exercise and consistent sleep patterns will keep you centered.'
        : 'Your physical energy is in a restorative phase. Honor the need for rest, gentle stretching, and extra hydration. Recovery now fuels future strength.',
      Mood: pct >= 70 ? 'The Moon and Neptune heighten your emotional sensitivity in the best way. Feelings flow freely — creative expression and deep conversations come naturally.'
        : pct >= 40 ? 'Emotional energy is steady and grounded. You can process feelings clearly without being overwhelmed. A good day for honest self-reflection.'
        : 'Emotions may feel muted or heavy. This is a phase for gentle self-care — avoid big emotional decisions and give yourself permission to simply rest.',
      Social: pct >= 70 ? 'Venus and Jupiter energize your social sphere. Connections spark easily — reach out, make plans, and say yes to invitations. Your charm is amplified.'
        : pct >= 40 ? 'Social energy is comfortable but not electric. Quality over quantity — focus on deepening existing relationships rather than expanding your circle.'
        : 'Your social battery is low. This is a natural recharge phase — solitude feeds your soul right now. Cancel what drains you without guilt.',
      Creativity: pct >= 70 ? 'Neptune and Venus ignite your creative channels. Ideas arrive fully formed — write, draw, build, or express yourself. Inspiration is everywhere.'
        : pct >= 40 ? 'Creative energy simmers gently. Routine creative practices pay off today — show up even if brilliance doesn\'t strike immediately.'
        : 'The muse is quiet. Rather than forcing output, absorb input — read, listen, observe. You\'re gathering raw material for a future creative surge.',
      Focus: pct >= 70 ? 'Mercury and Saturn sharpen your mental clarity. Complex tasks feel manageable — tackle your hardest work now. Concentration comes effortlessly.'
        : pct >= 40 ? 'Mental energy is adequate for steady work. Break large tasks into smaller pieces and avoid multitasking. Consistency beats intensity today.'
        : 'Mental fog is likely. Your mind needs spaciousness — avoid dense analytical work if possible. Simple tasks, walks, and breathing exercises help clear the static.',
      Luck: pct >= 70 ? 'Jupiter and the Sun align favorably. Synchronicities increase — pay attention to unexpected opportunities, chance meetings, and gut feelings. Fortune favors the bold.'
        : pct >= 40 ? 'Luck is neutral — neither particularly hot nor cold. Make your own fortune through preparation and follow-through rather than waiting for cosmic gifts.'
        : 'This isn\'t a high-luck window. Avoid gambling or risky bets. Focus on what you can control — the cosmic tide will turn in your favor soon.',
    };
    return descs[key] || descs.Health;
  };

  // Planet strip
  const planetStrip = transitPlanets.slice(0, 6).map(p => ({
    glyph: PLANET_GLYPHS[p.name] || '★', name: p.name.toUpperCase(),
    pos: `${p.sign} ${p.degree.toFixed(0)}°${p.isRetrograde ? ' ℞' : ''}`
  }));

  // Split horoscope into paragraphs for structured display
  const horoscopeText = forecast?.detailedHoroscope || '';
  const paragraphs = horoscopeText.split('\n\n').filter(p => p.trim());
  const actionItems = forecast?.actionItems || [];

  // Period-specific labels for paragraphs
  const PARA_LABELS_DAILY = ['COSMIC CLIMATE', 'PERSONAL IMPACT', 'THE CHALLENGE', 'THE GUIDANCE'];
  const PARA_LABELS_WEEKLY = ['THE WEEKLY ARC', 'EARLY WEEK', 'MID-WEEK SHIFT', 'THE WEEKEND'];
  const PARA_LABELS_MONTHLY = ['THE THEME', 'FIRST HALF', 'SECOND HALF', 'POWER DATES'];
  const PARA_LABELS_YEARLY = ['ANNUAL THEME', 'Q1: INITIATION', 'MID-YEAR GROWTH', 'Q4: HARVEST', 'SOUL LESSON'];

  const getParaLabels = () => {
    if (isDaily) return PARA_LABELS_DAILY;
    if (activeTab === 'weekly') return PARA_LABELS_WEEKLY;
    if (activeTab === 'monthly') return PARA_LABELS_MONTHLY;
    if (activeTab === 'yearly') return PARA_LABELS_YEARLY;
    return [];
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView ref={mainScrollRef} showsVerticalScrollIndicator={false} bounces={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.gold} colors={[T.gold]} />}>
        {/* ── HERO ── */}
        <LinearGradient colors={['#0E0E22', '#1A1535', '#0F1628']} locations={[0, 0.5, 1]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.greeting}>
            {getTimeOfDay()}{userProfile?.chart ? ` · ${getElementGreeting(userProfile.chart)}` : ''}
          </Text>
          <View style={styles.nameRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={styles.heroName}>{firstName}</Text>
              {streakData && streakData.current_streak > 0 && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => { haptic.light(); setShowStreakModal(true); }}>
                  <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakAnim }] }]}>
                    <Text style={styles.streakBadgeEmoji}>{getStreakEmoji(streakData.current_streak)}</Text>
                    <Text style={styles.streakBadgeNum}>{streakData.current_streak}</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={[styles.avatar, xpData && { borderWidth: 0 }]} activeOpacity={0.8}
              onPress={() => { haptic.light(); navigation.navigate('Profile'); }}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
              {xpData && (
                <View style={[styles.avatarRing, { borderColor: xpData.levelInfo?.current?.ringColor || 'rgba(200,168,75,0.3)' }]} />
              )}
            </TouchableOpacity>
          </View>

          {/* Moon strip */}
          <View style={styles.moonStrip}>
            <Text style={{ fontSize: 18 }}>{moonIcon}</Text>
            <Text style={styles.moonText}>
              <Text style={{ color: 'rgba(250,248,242,0.82)', fontFamily: FONTS.sansMedium }}>{moonPhase}</Text>
              {moonSign !== '—' ? ` in ${moonSign}` : ''}
              {moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}%` : ''}
            </Text>
            <CosmicTooltip id="moon_phase" size={14} light />
          </View>

          {/* Cosmic archetype chip */}
          {userProfile?.chart && (() => {
            const arch = getCosmicArchetype(userProfile.chart);
            return (
              <View style={styles.archetypeChip}>
                <Text style={styles.archetypeText}>{arch.name} · {arch.rarity}</Text>
              </View>
            );
          })()}
        </LinearGradient>

        {/* ── PERIOD TABS ── */}
        <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabStrip} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
          {PERIOD_TABS.map((tab) => {
            // Gate yesterday/tomorrow behind Level 3 (Nebula)
            const needsUnlock = (tab.key === 'yesterday' || tab.key === 'tomorrow') && !isFeatureUnlocked(xpData, 'forecast_tabs');
            return (
              <TouchableOpacity key={tab.key}
                style={[styles.periodTab, activeTab === tab.key && styles.periodTabOn, needsUnlock && { opacity: 0.4 }]}
                onPress={() => {
                  if (needsUnlock) {
                    Alert.alert('Level 3 Required', 'Reach Nebula level to unlock Yesterday & Tomorrow forecasts. Keep earning Stardust!');
                    return;
                  }
                  haptic.selection(); setActiveTab(tab.key); mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                }} activeOpacity={0.7}>
                <Text style={[styles.periodTabText, activeTab === tab.key && styles.periodTabTextOn]}>
                  {needsUnlock ? `🔒 ${tab.label}` : tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.content}>
          {/* ═══════════════════════════════════════════════ */}
          {/* ─── ASTROLOGY CONTENT (Primary)              ─── */}
          {/* ═══════════════════════════════════════════════ */}

          {/* ── 1. FORECAST HERO CARD (Your Daily Reading) ── */}
          <View style={styles.dailyCard}>
            <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dailyHd}>
              <Text style={styles.dailyDate}>{formatDateHeader(getDateForTab(activeTab))}</Text>
              {forecastLoading ? (
                <View style={{ paddingVertical: 16, gap: 10 }}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, { width: '60%' }]} />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <View style={styles.skeletonChip} />
                    <View style={styles.skeletonChip} />
                    <View style={styles.skeletonChip} />
                  </View>
                  <ActivityIndicator size="small" color={T.gold} style={{ marginTop: 4 }} />
                  <Text style={{ fontSize: 11, color: 'rgba(250,248,242,0.35)', textAlign: 'center' }}>Reading the stars…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.dailyHeadline}>{forecast?.header || 'Your Cosmic Reading'}</Text>
                  {/* Power + Lucky chips */}
                  <View style={styles.tchips}>
                    {forecast?.powerCosmic && (
                      <View style={styles.tchip}><Text style={styles.tchipText}>✦ {forecast.powerCosmic}</Text></View>
                    )}
                    {forecast?.luckyStats && (
                      <View style={styles.tchip}><Text style={styles.tchipText}>#{forecast.luckyStats.number}</Text></View>
                    )}
                    {forecast?.luckyStats?.crystal && (
                      <View style={styles.tchip}><Text style={styles.tchipText}>✧ {forecast.luckyStats.crystal}</Text></View>
                    )}
                    <View style={styles.tchip}><Text style={styles.tchipText}>☽ {moonSign}</Text></View>
                  </View>
                </>
              )}
            </LinearGradient>

            {/* Body */}
            <View style={styles.dailyBody}>
              {forecastLoading && (
                <View style={{ gap: 12, paddingVertical: 8 }}>
                  <View style={[styles.skeletonBodyLine, { width: '90%' }]} />
                  <View style={[styles.skeletonBodyLine, { width: '100%' }]} />
                  <View style={[styles.skeletonBodyLine, { width: '75%' }]} />
                  <View style={[styles.skeletonBodyLine, { width: '85%' }]} />
                </View>
              )}
              {!forecastLoading && forecast && (
                <>
                  {/* Mantra */}
                  {forecast.mantra && (
                    <View style={styles.mantraBox}>
                      <Text style={styles.mantraText}>"{forecast.mantra}"</Text>
                    </View>
                  )}

                  {/* Planet influence tags */}
                  {forecast.planetInfluences && forecast.planetInfluences.length > 0 && (
                    <View style={styles.influenceRow}>
                      {forecast.planetInfluences.map((inf, idx) => (
                        <TouchableOpacity key={idx} style={styles.influencePill} activeOpacity={0.7}
                          onPress={() => { haptic.light(); setInfluenceModal(inf); }}>
                          <Text style={styles.influenceGlyph}>{inf.glyph}</Text>
                          <Text style={styles.influenceTag}>{inf.tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Structured paragraphs */}
                  {!showFullReading ? (
                    <AstroText text={paragraphs[0] || 'The cosmos aligns beautifully today.'} style={styles.dailyTxt} />
                  ) : (
                    <View>
                      {paragraphs.map((p, i) => (
                        <View key={i} style={styles.paraBlock}>
                          {getParaLabels()[i] && (
                            <Text style={styles.paraLabel}>{getParaLabels()[i]}</Text>
                          )}
                          <AstroText text={p} style={styles.dailyTxt} />
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Items (expanded) */}
                  {showFullReading && actionItems.length > 0 && (
                    <View style={styles.actionBox}>
                      <Text style={styles.actionLabel}>POWER MOVES</Text>
                      {actionItems.map((item, i) => (
                        <View key={i} style={styles.actionRow}>
                          <Text style={styles.actionArrow}>→</Text>
                          <Text style={styles.actionItem}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Daily Ritual (expanded) */}
                  {showFullReading && forecast.dailyRitual && (
                    <View style={styles.ritualBox}>
                      <Text style={styles.ritualLabel}>TODAY'S RITUAL</Text>
                      <Text style={styles.ritualText}>✧ {forecast.dailyRitual}</Text>
                    </View>
                  )}

                  {/* Viral Insight (expanded) — tap to share as visual card */}
                  {showFullReading && forecast.viralInsight && (
                    <TouchableOpacity style={styles.viralBox} activeOpacity={0.7}
                      onPress={() => {
                        haptic.medium();
                        const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                        captureAndShare(`✦ ${forecast.viralInsight}\n\n— Celestia (${sunSign} Sun)`);
                        trackEvent('share').catch(() => {});
                        awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                      }}>
                      <Text style={styles.viralText}>✦ {forecast.viralInsight}</Text>
                      <Text style={{ fontSize: 10, color: 'rgba(250,248,242,0.4)', marginTop: 6 }}>Tap to share ↗</Text>
                    </TouchableOpacity>
                  )}

                  {/* Buttons */}
                  <View style={styles.dailyActs}>
                    <TouchableOpacity style={styles.btnOutline} activeOpacity={0.7} onPress={handleShare}>
                      <Text style={styles.btnOutlineText}>Share ↗</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnStory} activeOpacity={0.7} onPress={async () => {
                      haptic.light();
                      const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                      await shareStory(`✦ ${forecast?.viralInsight || forecast?.mantra || ''}\n\n— Celestia (${sunSign} Sun)`);
                      trackEvent('share').catch(() => {});
                      awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                    }}>
                      <Text style={styles.btnStoryText}>Stories</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnFill} activeOpacity={0.85}
                      onPress={() => {
                        setShowFullReading(!showFullReading);
                        if (!showFullReading) {
                          completeQuestAction('forecast_read').then(r => {
                            if (r) { setQuestData(prev => prev ? { ...prev, quests: r.quests, allComplete: r.allComplete } : prev); }
                            if (r?.justCompleted) {
                              trackEvent('quest_complete').catch(() => {});
                              awardXP(userProfile?.id || 'default', 'quest_bonus').then(xp => { if (xp) showXPGain(xp.amount); }).catch(() => {});
                            }
                          }).catch(() => {});
                        }
                      }}>
                      <Text style={styles.btnFillText}>{showFullReading ? 'Show Less ↑' : 'Read Full →'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── 2. MERCURY RETROGRADE BANNER ── */}
          {mercuryRx && (
            <View style={styles.rxBanner}>
              <TouchableOpacity style={styles.rxBannerTap} activeOpacity={0.8}
                onPress={() => navigation.navigate('Sky', { highlightMercuryRx: true })}>
                <Text style={styles.rxIcon}>☿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxTitle}>Mercury Retrograde Active</Text>
                  <Text style={styles.rxSub}>Communication and tech may be disrupted. Tap to see details.</Text>
                </View>
                <Text style={styles.rxArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rxShareBtn} activeOpacity={0.7}
                onPress={async () => {
                  haptic.medium();
                  await shareRxCard();
                  trackEvent('share').catch(() => {});
                  awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                }}>
                <Text style={styles.rxShareText}>Share Survival Kit ↗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 3. WHAT'S NEW TODAY BANNER ── */}
          {cosmicChange && activeTab === 'today' && cosmicChange.type !== 'moon_info' && (
            <TouchableOpacity style={styles.changeBanner} activeOpacity={0.8}
              onPress={() => navigation.navigate('Sky', cosmicChange.type === 'retrograde' ? { highlightMercuryRx: true } : undefined)}>
              <Text style={styles.changeBannerIcon}>{cosmicChange.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.changeBannerTitle}>{cosmicChange.title}</Text>
                <Text style={styles.changeBannerSub}>{cosmicChange.subtitle}</Text>
              </View>
              <Text style={styles.changeBannerArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* ── 4. MOON RITUAL CARD (New Moon / Full Moon only) ── */}
          {moonData && activeTab === 'today' && ['New Moon', 'Full Moon'].includes(moonData.phaseName) && (
            <View>
              <TouchableOpacity style={styles.moonRitualCard} activeOpacity={0.8}
                onPress={openMoonRitual}>
                <LinearGradient
                  colors={moonData.phaseName === 'New Moon' ? ['#0E0E22', '#1A1060'] : ['#2D1B69', '#0E0E22']}
                  style={styles.moonRitualGradient}>
                  <Text style={styles.moonRitualMoon}>{moonData.phaseName === 'New Moon' ? '🌑' : '🌕'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.moonRitualLabel}>{moonData.phaseName === 'New Moon' ? 'NEW MOON RITUAL' : 'FULL MOON RITUAL'}</Text>
                    <Text style={styles.moonRitualTitle}>{moonData.phaseName} in {moonData.sign}</Text>
                    <Text style={styles.moonRitualSub}>
                      {moonData.phaseName === 'New Moon' ? 'Set your intentions for this lunar cycle' : 'Reflect on what has come to light'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, color: T.gold }}>→</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lunarShareBtn} activeOpacity={0.7}
                onPress={async () => {
                  haptic.medium();
                  await shareLunarCard();
                  trackEvent('share').catch(() => {});
                  awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                }}>
                <Text style={styles.lunarShareText}>Share {moonData.phaseName} Card ↗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 5. COSMIC WEATHER STRIP ── */}
          <View style={styles.cwHeader}>
            <Text style={styles.sectionLabel}>COSMIC WEATHER</Text>
            <View style={styles.cwBadge}>
              <View style={[styles.cwBadgeDot, { backgroundColor: highCount >= 3 ? '#10B981' : lowCount >= 3 ? '#F59E0B' : T.gold }]} />
              <Text style={styles.cwBadgeText}>{cosmicWeatherWord}</Text>
            </View>
          </View>
          {isCosmicDownload && (
            <View style={styles.downloadBanner}>
              <Text style={styles.downloadIcon}>★</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.downloadTitle}>COSMIC DOWNLOAD DAY</Text>
                <Text style={styles.downloadSub}>Multiple transits activating your chart — today's reading goes deeper</Text>
              </View>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cwStrip}
            contentContainerStyle={{ paddingRight: 16 }}>
            {energyDisplay.map((e, i) => (
              <TouchableOpacity key={i} style={styles.cwCard} activeOpacity={0.7}
                onPress={() => { haptic.light(); setEnergyModal(e); completeQuestAction('energy_explored').catch(() => {}); }}>
                <View style={[styles.cwRing, { borderColor: e.pct >= 60 ? e.color : 'rgba(0,0,0,0.08)' }]}>
                  <Text style={[styles.cwPct, { color: e.color }]}>{e.pct}</Text>
                </View>
                <Text style={styles.cwTag}>{e.tag}</Text>
                {e.isHigh && <Text style={styles.cwMarker}>★</Text>}
                {e.isLow && <Text style={[styles.cwMarker, { color: '#F59E0B' }]}>↓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── 6. LOVE & CAREER CARDS ── */}
          <View style={styles.domainRow}>
            <TouchableOpacity style={[styles.domainCard, { borderLeftColor: '#E85090' }]}
              activeOpacity={0.7} onPress={() => openDomainModal('Love')}>
              <Text style={styles.domainIcon}>♡</Text>
              <Text style={styles.domainName}>Love & Connection</Text>
              <Text style={styles.domainVibe}>{forecast?.loveVibe || 'Tap to reveal'}</Text>
              <Text style={styles.domainCta}>Deep Dive →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.domainCard, { borderLeftColor: '#5090E8' }]}
              activeOpacity={0.7} onPress={() => openDomainModal('Career')}>
              <Text style={styles.domainIcon}>◆</Text>
              <Text style={styles.domainName}>Career & Ambition</Text>
              <Text style={styles.domainVibe}>{forecast?.careerVibe || 'Tap to reveal'}</Text>
              <Text style={styles.domainCta}>Deep Dive →</Text>
            </TouchableOpacity>
          </View>

          {/* ── 7. SKY NOW STRIP ── */}
          <Text style={styles.sectionLabel}>SKY NOW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pstrip}
            contentContainerStyle={{ paddingRight: 20 }}>
            {planetStrip.map((p, i) => (
              <TouchableOpacity key={i} style={styles.pchip} activeOpacity={0.7}
                onPress={() => navigation.navigate('Sky')}>
                <Text style={styles.pchipGlyph}>{p.glyph}</Text>
                <View>
                  <Text style={styles.pchipName}>{p.name}</Text>
                  <Text style={styles.pchipPos}>{p.pos}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── 8. COSMIC WINDOWS ── */}
          {cosmicWindows.length > 0 && (
            <View style={styles.windowCard}>
              <Text style={styles.windowLabel}>COSMIC WINDOW</Text>
              {cosmicWindows.slice(0, 2).map((w, i) => (
                <View key={i} style={styles.windowRow}>
                  <View style={[styles.windowDot, w.significance === 'exact' && { backgroundColor: '#E2C46A' }]} />
                  <Text style={styles.windowText}>{w.description}</Text>
                  {w.significance === 'exact' && <Text style={styles.windowExact}>EXACT</Text>}
                </View>
              ))}
            </View>
          )}

          {/* ── 9. COSMIC SEASON ── */}
          {cosmicSeason && activeTab === 'today' && (
            <View style={styles.seasonCard}>
              <View style={styles.seasonHeader}>
                <Text style={styles.seasonLabel}>YOUR COSMIC SEASON</Text>
                <Text style={styles.seasonDays}>{cosmicSeason.daysRemaining}d left</Text>
              </View>
              <Text style={styles.seasonTitle}>{cosmicSeason.description}</Text>
              <View style={styles.seasonBarTrack}>
                <View style={[styles.seasonBarFill, { width: `${cosmicSeason.progress}%` }]} />
              </View>
              <View style={styles.seasonFooter}>
                <Text style={styles.seasonFooterText}>
                  {cosmicSeason.isRetrograde ? '℞ Retrograde — revisiting themes' : `Until ~${cosmicSeason.estimatedEndDate}`}
                </Text>
                <Text style={styles.seasonFooterPct}>{cosmicSeason.progress}%</Text>
              </View>
            </View>
          )}

          {/* ── 10. LUCKY STATS ── */}
          {forecast?.luckyStats && (
            <View style={styles.luckyRow}>
              <View style={styles.luckyStat}>
                <Text style={styles.luckyLabel}>NUMBER</Text>
                <Text style={styles.luckyNum}>{forecast.luckyStats.number}</Text>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyStat}>
                <Text style={styles.luckyLabel}>COLOR</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                  {forecast.luckyStats.colorHex && (
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: forecast.luckyStats.colorHex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
                  )}
                  <Text style={styles.luckyVal}>{forecast.luckyStats.color}</Text>
                </View>
              </View>
              <View style={styles.luckyDivider} />
              <View style={styles.luckyStat}>
                <Text style={styles.luckyLabel}>CRYSTAL</Text>
                <Text style={styles.luckyVal}>{forecast.luckyStats.crystal || '—'}</Text>
              </View>
            </View>
          )}

          {/* ── 11. COSMIC JOURNAL ── */}
          {isDaily && (
            <View style={styles.journalCard}>
              <View style={styles.jcardHeader}>
                <Text style={styles.jcardTitle}>COSMIC JOURNAL</Text>
                <View style={[styles.jcardBadge, journalSaved && { backgroundColor: '#D8F0D0' }]}>
                  <Text style={styles.jcardBadgeText}>{journalSaved ? 'Saved' : 'Today'}</Text>
                </View>
              </View>
              <Text style={styles.jcardPrompt}>
                {forecast?.mantra
                  ? `"${forecast.mantra}"`
                  : '"What is the universe trying to teach you right now?"'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.jcardBtn, { flex: 1 }]} activeOpacity={0.7}
                  onPress={() => setShowJournal(true)}>
                  <Text style={styles.jcardBtnText}>{journalSaved ? '📖 View Entry' : '✍ Write Today\'s Entry'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.jcardBtn, { paddingHorizontal: 14 }]} activeOpacity={0.7}
                  onPress={() => navigation.navigate('JournalHistory')}>
                  <Text style={[styles.jcardBtnText, { color: T.gold }]}>All →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── 12. TOMORROW'S PREVIEW (Forward Hook) ── */}
          {activeTab === 'today' && tomorrowMoon && (
            <TouchableOpacity style={styles.tomorrowCard} activeOpacity={0.8}
              onPress={() => { haptic.light(); setActiveTab('tomorrow'); mainScrollRef.current?.scrollTo({ y: 0, animated: true }); }}>
              <View style={styles.tomorrowHeader}>
                <Text style={styles.tomorrowLabel}>TOMORROW</Text>
                <Text style={styles.tomorrowArrow}>→</Text>
              </View>
              <Text style={styles.tomorrowText}>
                Moon in {tomorrowMoon.sign}
                {tomorrowMoon.phaseName === 'Full Moon' || tomorrowMoon.phaseName === 'New Moon'
                  ? ` · ${tomorrowMoon.phaseName}` : ''}
                {tomorrowWindows.length > 0
                  ? ` · ${tomorrowWindows[0].planet || ''} activating your chart` : ''}
              </Text>
              <Text style={styles.tomorrowHook}>
                {tomorrowMoon.phaseName === 'Full Moon' ? 'Emotions peak. We\'ll have a ritual ready.'
                  : tomorrowMoon.phaseName === 'New Moon' ? 'New cycle begins. Set your intention.'
                  : tomorrowWindows.length > 0 ? 'Something is building. Check back in the morning.'
                  : 'Your morning reading will be ready at sunrise.'}
              </Text>
            </TouchableOpacity>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ─── EXTRAS & ENGAGEMENT                      ─── */}
          {/* ═══════════════════════════════════════════════ */}

          {activeTab === 'today' && (todayCosmicLine || todayUnlock || monthlyRecap || questData?.quests || nextBadge || cosmicWhisper) && (
            <View style={{ marginTop: 12, marginBottom: 4, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, paddingHorizontal: 20 }}>YOUR EXTRAS</Text>
            </View>
          )}

          {/* ── TODAY'S COSMIC ALERT ── */}
          {todayCosmicLine && activeTab === 'today' && (
            <View style={styles.cosmicAlertCard}>
              <View style={styles.cosmicAlertDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cosmicAlertTitle}>{todayCosmicLine.title}</Text>
                <Text style={styles.cosmicAlertBody}>{todayCosmicLine.body}</Text>
              </View>
            </View>
          )}

          {/* ── NEW INSIGHT UNLOCKED (drip-feed) ── */}
          {todayUnlock && activeTab === 'today' && (
            <TouchableOpacity style={styles.unlockCard} activeOpacity={0.8}
              onPress={() => {
                markUnlockShown();
                setTodayUnlock(null);
                navigation.navigate('Chart');
              }}>
              <LinearGradient colors={['#1A1060', '#0E0E22']} style={styles.unlockCardGradient}>
                <Text style={styles.unlockCardIcon}>✦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unlockCardLabel}>NEW INSIGHT UNLOCKED</Text>
                  <Text style={styles.unlockCardTitle}>{todayUnlock.planet}</Text>
                  <Text style={styles.unlockCardSub}>Day {todayUnlock.dayNum} — Tap to reveal what your chart says</Text>
                </View>
                <Text style={styles.unlockCardArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── MONTHLY RECAP (1st-3rd of month) ── */}
          {monthlyRecap && activeTab === 'today' && today.getDate() <= 3 && (
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
                trackEvent('share').catch(() => {});
                awardXP(userProfile?.id || 'default', 'share').catch(() => {});
              }}>
                <Text style={styles.recapShareText}>Share Your Recap ↗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── DAILY QUESTS ── */}
          {questData?.quests && activeTab === 'today' && (
            <QuestCard
              quests={questData.quests}
              allComplete={questData.allComplete}
              weeklyCount={questData.weeklyCount || 0}
            />
          )}

          {/* ── NEXT BADGE PROGRESS ── */}
          {nextBadge && activeTab === 'today' && (
            <View style={styles.nextBadgeCard}>
              <View style={styles.nextBadgeHeader}>
                <Text style={styles.nextBadgeIcon}>{nextBadge.badge.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextBadgeLabel}>NEXT ACHIEVEMENT</Text>
                  <Text style={styles.nextBadgeName}>{nextBadge.badge.name}</Text>
                </View>
                <Text style={styles.nextBadgeCount}>{nextBadge.current}/{nextBadge.target}</Text>
              </View>
              <View style={styles.nextBadgeBarBg}>
                <View style={[styles.nextBadgeBarFill, { width: `${(nextBadge.progress * 100).toFixed(0)}%` }]} />
              </View>
              <Text style={styles.nextBadgeSub}>{nextBadge.remaining} {nextBadge.label.toLowerCase()} to go</Text>
            </View>
          )}

          {/* ── COSMIC WHISPER (Easter egg) — tap to share ── */}
          {cosmicWhisper && (
            <TouchableOpacity
              style={[styles.whisperCard, whisperRarity && styles.whisperCardRare]}
              activeOpacity={0.75}
              onPress={async () => {
                haptic.medium();
                await shareWhisperCard(`✧ ${cosmicWhisper}\n\n— A Cosmic Whisper from Celestia${whisperRarity ? ` (${whisperRarity})` : ''}`);
                trackEvent('share').catch(() => {});
                awardXP(userProfile?.id || 'default', 'share').catch(() => {});
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.whisperLabel}>COSMIC WHISPER</Text>
                {whisperRarity && (
                  <View style={styles.whisperRarityBadge}>
                    <Text style={styles.whisperRarityText}>{whisperRarity.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.whisperText}>✧ {cosmicWhisper}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(200,168,75,0.4)', marginTop: 6 }}>Tap to share ↗</Text>
            </TouchableOpacity>
          )}

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionLabel}>EXPLORE</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('Chart')}>
              <Text style={styles.quickIcon}>◎</Text>
              <Text style={styles.quickLabel}>Explore Chart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('AskAI')}>
              <Text style={styles.quickIcon}>☽</Text>
              <Text style={styles.quickLabel}>Ask Celestia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('QuickChart')}>
              <Text style={styles.quickIcon}>★</Text>
              <Text style={styles.quickLabel}>Quick Chart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('Match')}>
              <Text style={styles.quickIcon}>♡</Text>
              <Text style={styles.quickLabel}>Compatibility</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROMO ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Reports')}>
            <LinearGradient colors={['#1A1530', '#14112A', '#101320']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
              <Text style={styles.promoLbl}>REPORTS</Text>
              <Text style={styles.promoTitle}>Deep Chart Analysis</Text>
              <Text style={styles.promoSub}>Love, Career, Purpose — written for your exact chart</Text>
              <View style={styles.promoCta}><Text style={styles.promoCtaText}>Explore Reports →</Text></View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* ── ENERGY DETAIL MODAL ── */}
      <Modal visible={!!energyModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.energyOverlay} activeOpacity={1} onPress={() => setEnergyModal(null)}>
          <View style={styles.energySheet}>
            {energyModal && (
              <>
                <View style={styles.energySheetHeader}>
                  <Text style={[styles.energySheetIcon, { color: energyModal.color }]}>{energyModal.icon}</Text>
                  <Text style={styles.energySheetTitle}>{energyModal.tag}</Text>
                  <TouchableOpacity onPress={() => setEnergyModal(null)}>
                    <Text style={{ fontSize: 16, color: T.stone, padding: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.energySheetBarWrap}>
                  <View style={styles.energySheetBarBg}>
                    <View style={[styles.energySheetBarFill, { width: `${energyModal.pct}%`, backgroundColor: energyModal.color }]} />
                  </View>
                  <Text style={[styles.energySheetLevel, { color: energyModal.color }]}>{energyModal.val}</Text>
                </View>
                <Text style={styles.energySheetPeriod}>
                  {activeTab === 'yesterday' ? "Yesterday's" : activeTab === 'today' ? "Today's" : activeTab === 'tomorrow' ? "Tomorrow's" : activeTab === 'weekly' ? 'This Week\'s' : activeTab === 'monthly' ? 'This Month\'s' : 'This Year\'s'} cosmic energy for {energyModal.tag.toLowerCase()}
                </Text>
                <Text style={styles.energySheetDesc}>
                  {getEnergyDescription(energyModal.key, energyModal.pct)}
                </Text>
                {(energyModal.key === 'Love' || energyModal.key === 'Career') ? (
                  <TouchableOpacity style={[styles.energySheetBtn, { backgroundColor: energyModal.color + '18', borderColor: energyModal.color + '30' }]}
                    activeOpacity={0.7} onPress={() => { setEnergyModal(null); setTimeout(() => openDomainModal(energyModal.key), 300); }}>
                    <Text style={[styles.energySheetBtnText, { color: energyModal.color }]}>Full {energyModal.tag.charAt(0) + energyModal.tag.slice(1).toLowerCase()} Reading →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.energySheetBtn, { backgroundColor: energyModal.color + '18', borderColor: energyModal.color + '30' }]}
                    activeOpacity={0.7} onPress={() => {
                      const key = energyModal.key;
                      setEnergyModal(null);
                      setTimeout(() => {
                        if (key === 'Mood') setShowJournal(true);
                        else if (key === 'Social') navigation.navigate('Match');
                        else if (key === 'Focus' || key === 'Creativity') navigation.navigate('AskAI', { initialMessage: `How can I boost my ${key.toLowerCase()} energy today based on my chart?` });
                        else navigation.navigate('Sky');
                      }, 300);
                    }}>
                    <Text style={[styles.energySheetBtnText, { color: energyModal.color }]}>
                      {energyModal.key === 'Mood' ? 'Reflect in Journal →'
                        : energyModal.key === 'Social' ? 'Check Compatibility →'
                        : energyModal.key === 'Focus' || energyModal.key === 'Creativity' ? 'Ask Celestia →'
                        : 'View Today\'s Sky →'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── PLANET INFLUENCE MODAL ── */}
      <Modal visible={!!influenceModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.energyOverlay} activeOpacity={1} onPress={() => setInfluenceModal(null)}>
          <View style={styles.influenceSheet}>
            {influenceModal && (
              <>
                <View style={styles.influenceSheetHeader}>
                  <Text style={styles.influenceSheetGlyph}>{influenceModal.glyph}</Text>
                  <Text style={styles.influenceSheetTag}>{influenceModal.tag}</Text>
                  <TouchableOpacity onPress={() => setInfluenceModal(null)}>
                    <Text style={{ fontSize: 16, color: T.stone, padding: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.influenceSheetEffect}>{influenceModal.effect}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── DOMAIN DEEP DIVE MODAL ── */}
      <Modal visible={!!domainModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: T.cream }}>
          <LinearGradient
            colors={domainModal === 'Love' ? ['#3A0A2A', '#1A0A2E'] : ['#0A1A3A', '#0E0E22']}
            style={styles.domModalHero}>
            <View style={styles.domModalHeader}>
              <TouchableOpacity onPress={() => setDomainModal(null)}>
                <Text style={{ fontSize: 18, color: 'rgba(250,248,242,0.6)', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.domModalIcon}>{domainModal === 'Love' ? '♡' : '◆'}</Text>
            <Text style={styles.domModalTitle}>
              {domainModal === 'Love' ? 'Love & Connection' : 'Career & Ambition'}
            </Text>
            {domainData?.vibe && <Text style={styles.domModalVibe}>{domainData.vibe}</Text>}
          </LinearGradient>

          {domainLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={T.gold} />
              <Text style={{ fontSize: 13, color: T.stone, marginTop: 12 }}>Consulting the cosmos...</Text>
            </View>
          ) : domainData ? (
            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
              {/* Headline */}
              <Text style={styles.domHeadline}>{domainData.headline}</Text>

              {/* Analysis paragraphs */}
              {domainData.analysis?.split('\n\n').filter(Boolean).map((p, i) => (
                <Text key={i} style={styles.domPara}>{p}</Text>
              ))}

              {/* Action */}
              {domainData.action && (
                <View style={styles.domActionBox}>
                  <Text style={styles.domActionLabel}>YOUR MOVE</Text>
                  <Text style={styles.domActionText}>{domainData.action}</Text>
                </View>
              )}

              {/* Timing */}
              {domainData.timing && (
                <View style={styles.domTimingBox}>
                  <Text style={styles.domTimingLabel}>TIMING</Text>
                  <Text style={styles.domTimingText}>{domainData.timing}</Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* ── OFFSCREEN SHARE CARDS (for capture) ── */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <DailyShareCard
          innerRef={shareCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || ''}
          viralInsight={forecast?.viralInsight}
          mantra={forecast?.mantra}
          date={formatDateHeader(getDateForTab(activeTab))}
        />
        <DailyStoryCard
          innerRef={storyCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || ''}
          viralInsight={forecast?.viralInsight}
          mantra={forecast?.mantra}
          date={formatDateHeader(getDateForTab(activeTab))}
        />
        <MercuryRxCard
          innerRef={rxCardRef}
          sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign}
        />
        <LunarEventCard
          innerRef={lunarCardRef}
          eventType={moonData?.phaseName || 'Full Moon'}
          moonSign={moonData?.sign}
          date={formatDateHeader(getDateForTab(activeTab))}
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

      {/* ── BADGE UNLOCK MODAL ── */}
      <BadgeUnlockModal
        visible={!!pendingBadge}
        badge={pendingBadge}
        onDismiss={() => setPendingBadge(null)}
        levelName={xpData?.current?.name}
        onShare={() => {
          trackEvent('share').catch(() => {});
          awardXP(userProfile?.id || 'default', 'share').catch(() => {});
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
          trackEvent('share').catch(() => {});
          awardXP(userProfile?.id || 'default', 'share').catch(() => {});
        }}
      />

      {/* ── LEVEL UP MODAL ── */}
      <LevelUpModal
        visible={!!levelUpData}
        levelName={levelUpData?.levelName}
        totalXP={levelUpData?.totalXP}
        onDismiss={() => setLevelUpData(null)}
        onShare={() => {
          trackEvent('share').catch(() => {});
          awardXP(userProfile?.id || 'default', 'share').catch(() => {});
        }}
      />

      {/* ── STREAK DETAIL MODAL ── */}
      <Modal visible={showStreakModal} animationType="slide" transparent>
        <TouchableOpacity style={styles.streakOverlay} activeOpacity={1} onPress={() => setShowStreakModal(false)}>
          <View style={styles.streakSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.streakHandle} />
            <View style={styles.streakCardsRow}>
              <View style={styles.streakCard}>
                <Text style={styles.streakCardEmoji}>{getStreakEmoji(streakData?.current_streak || 0)}</Text>
                <Text style={styles.streakCardNum}>{streakData?.current_streak || 0}</Text>
                <Text style={styles.streakCardLbl}>Day Streak</Text>
              </View>
              <View style={styles.streakCard}>
                <Text style={styles.streakCardEmoji}>🏆</Text>
                <Text style={styles.streakCardNum}>{streakData?.longest_streak || 0}</Text>
                <Text style={styles.streakCardLbl}>Longest</Text>
              </View>
              <View style={styles.streakCard}>
                <Text style={styles.streakCardEmoji}>📅</Text>
                <Text style={styles.streakCardNum}>{streakData?.total_check_ins || 0}</Text>
                <Text style={styles.streakCardLbl}>Total Days</Text>
              </View>
            </View>
            {(() => {
              const current = streakData?.current_streak || 0;
              const next = [3, 7, 14, 30, 50, 100, 365].find(v => v > current);
              if (!next) return null;
              return (
                <View style={styles.streakNextBox}>
                  <Text style={styles.streakNextLbl}>Next: {getMilestoneMessage(next)}</Text>
                  <View style={styles.streakNextBarBg}>
                    <View style={[styles.streakNextBarFill, { width: `${(current / next) * 100}%` }]} />
                  </View>
                  <Text style={styles.streakNextDays}>{next - current} days to go</Text>
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
          const granted = await requestNotificationPermission();
          if (granted) {
            scheduleAllNotifications(userProfile, forecast, streakData, moonData, energyData, cosmicWindows).catch(() => {});
          }
        }}
        onDismiss={async () => {
          setShowNotifModal(false);
          await saveBoolean(StorageKeys.NOTIFICATION_ASKED, true);
        }}
      />

      {/* ── JOURNAL MODAL ── */}
      <Modal visible={showJournal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.journalModal}>
          <View style={styles.journalModalHeader}>
            <Text style={styles.journalModalTitle}>Cosmic Journal</Text>
            <TouchableOpacity onPress={() => setShowJournal(false)}>
              <Text style={{ fontSize: 18, color: T.stone, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.journalModalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.journalDateLabel}>{formatDateHeader()}</Text>
            <Text style={styles.journalPromptLabel}>
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
                  <Text style={[styles.moodChipText, journalMood === m.key && { color: T.navy }]}>{m.label}</Text>
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

            <TextInput style={styles.journalInput} multiline placeholder="Let your thoughts flow..."
              placeholderTextColor="#B0A898" value={journalText} onChangeText={setJournalText}
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
        <View style={{ flex: 1, backgroundColor: T.cream }}>
          <View style={styles.journalModalHeader}>
            <Text style={styles.journalModalTitle}>
              {moonData?.phaseName === 'New Moon' ? '🌑 New Moon Ritual' : '🌕 Full Moon Ritual'}
            </Text>
            <TouchableOpacity onPress={() => setShowMoonRitual(false)}>
              <Text style={{ fontSize: 18, color: T.stone, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {moonRitualLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={T.gold} />
              <Text style={{ fontSize: 14, color: T.stone, marginTop: 12 }}>Preparing your ritual...</Text>
            </View>
          ) : moonRitual ? (
            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 24, color: T.navy, marginBottom: 8 }}>{moonRitual.title}</Text>
              <Text style={{ fontSize: 12, color: T.stone, marginBottom: 16 }}>
                {moonData?.phaseName} in {moonData?.sign} · {moonData?.illumination}% illumination
              </Text>
              <Text style={{ fontSize: 15, color: T.ink, lineHeight: 24, marginBottom: 20 }}>{moonRitual.opening}</Text>

              <View style={{ backgroundColor: T.warm, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 12 }}>
                  {moonData?.phaseName === 'New Moon' ? 'INTENTION PROMPTS' : 'REFLECTION PROMPTS'}
                </Text>
                {moonRitual.prompts?.map((p, i) => (
                  <Text key={i} style={{ fontSize: 14, color: T.navy, lineHeight: 22, marginBottom: 8, fontFamily: FONTS.sansMedium }}>
                    {i + 1}. {p}
                  </Text>
                ))}
              </View>

              <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 8 }}>AFFIRMATION</Text>
                <Text style={{ fontFamily: FONTS.serif, fontSize: 17, color: T.navy, lineHeight: 24, fontStyle: 'italic' }}>
                  "{moonRitual.affirmation}"
                </Text>
              </View>

              <View style={{ backgroundColor: '#F0EBF8', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#6B5CA5', marginBottom: 8 }}>CLOSING RITUAL</Text>
                <Text style={{ fontSize: 14, color: '#3D2E6B', lineHeight: 22 }}>{moonRitual.closingRitual}</Text>
              </View>

              <Text style={{ fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 }}>
                {moonData?.phaseName === 'New Moon' ? 'MY INTENTION' : 'MY REFLECTION'}
              </Text>
              <TextInput
                style={[styles.journalInput, { minHeight: 100 }]}
                multiline
                placeholder={moonData?.phaseName === 'New Moon' ? 'I am calling in...' : 'I am releasing...'}
                placeholderTextColor="#B0A898"
                value={ritualIntention}
                onChangeText={setRitualIntention}
                textAlignVertical="top"
                editable={!ritualSaved}
              />
              {ritualSaved ? (
                <View style={[styles.journalSaveBtn, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.journalSaveBtnText, { color: '#2E7D32' }]}>Intention Saved</Text>
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
              <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: T.stone, textAlign: 'center' }}>
                Unable to generate your ritual. Try again later.
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Hero
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 30, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(200,168,75,0.1)', right: -60, top: -60 },
  greeting: { fontSize: 11, letterSpacing: 1.5, color: 'rgba(250,248,242,0.36)', marginBottom: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroName: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(200,168,75,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', position: 'relative' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 20, color: T.gold },
  avatarRing: { position: 'absolute', width: 50, height: 50, borderRadius: 25, borderWidth: 2, top: -3, left: -3 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,168,75,0.15)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  streakBadgeEmoji: { fontSize: 14 },
  streakBadgeNum: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: T.gold },
  moonStrip: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  moonText: { fontSize: 12, color: 'rgba(250,248,242,0.5)', flex: 1 },
  archetypeChip: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  archetypeText: { fontSize: 10, color: 'rgba(200,168,75,0.7)', letterSpacing: 0.5 },

  // Monthly recap
  recapCardWrap: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  recapShareBtn: { alignSelf: 'center', backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', borderRadius: 100, paddingVertical: 8, paddingHorizontal: 20, marginTop: 10 },
  recapShareText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },

  // Period tabs
  tabStrip: { flexGrow: 0, marginBottom: 12, marginTop: 14 },
  periodTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: 'white', borderWidth: 1, borderColor: T.border },
  periodTabOn: { backgroundColor: T.navy, borderColor: T.navy },
  periodTabText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.stone },
  periodTabTextOn: { color: T.cream },

  content: { paddingHorizontal: 20, paddingTop: 0 },

  // Forecast card
  dailyCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 28 },
  dailyHd: { padding: 20, paddingHorizontal: 21, paddingBottom: 17 },
  dailyDate: { fontSize: 10, fontFamily: FONTS.sansMedium, letterSpacing: 2, color: 'rgba(250,248,242,0.35)', marginBottom: 6 },
  dailyHeadline: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, lineHeight: 28, marginBottom: 12 },
  tchips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tchip: { backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.22)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  tchipText: { fontSize: 10, fontFamily: FONTS.sansMedium, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 },
  dailyBody: { backgroundColor: 'white', padding: 17, paddingHorizontal: 21, paddingBottom: 19 },
  mantraBox: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: T.gold },
  mantraText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14.5, color: '#8B6214', lineHeight: 21, fontStyle: 'italic' },
  paraBlock: { marginBottom: 12 },
  paraLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 4 },
  dailyTxt: { fontSize: 13.5, color: T.ink, lineHeight: 22.5, marginBottom: 6 },
  influenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  influencePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(14,14,34,0.06)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(14,14,34,0.08)' },
  influenceGlyph: { fontSize: 13, color: T.gold },
  influenceTag: { fontSize: 10.5, fontFamily: FONTS.sansMedium, color: T.navy },
  ritualBox: { backgroundColor: 'rgba(160,128,224,0.08)', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: '#A080E0' },
  ritualLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: '#A080E0', marginBottom: 6 },
  ritualText: { fontSize: 13, color: T.ink, lineHeight: 20 },
  actionBox: { backgroundColor: T.warm, borderRadius: 14, padding: 14, marginBottom: 12 },
  actionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  actionArrow: { fontSize: 12, color: T.gold, marginTop: 2 },
  actionItem: { fontSize: 13, color: T.ink, lineHeight: 20, flex: 1 },
  viralBox: { backgroundColor: T.navy, borderRadius: 12, padding: 14, marginBottom: 12, alignItems: 'center' },
  viralText: { fontSize: 13, color: T.cream, fontFamily: FONTS.sansMedium, textAlign: 'center', lineHeight: 20 },
  dailyActs: { flexDirection: 'row', gap: 9, marginTop: 4 },
  btnOutline: { flex: 1, height: 40, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: '#6B6050' },
  btnStory: { height: 40, borderWidth: 1.5, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  btnStoryText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },
  btnFill: { flex: 1, height: 40, backgroundColor: T.navy, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFillText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.cream },

  // Energy grid
  // (egrid replaced by cwStrip)
  // Cosmic Weather Strip
  cwHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cwBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)' },
  cwBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  cwBadgeText: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.gold, letterSpacing: 0.5 },
  cwStrip: { marginBottom: 15, flexGrow: 0 },
  cwCard: { alignItems: 'center', marginRight: 14, width: 56, position: 'relative' },
  cwRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', marginBottom: 5 },
  cwPct: { fontSize: 15, fontFamily: FONTS.sansSemiBold },
  cwTag: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: T.stone },
  cwMarker: { position: 'absolute', top: -2, right: 2, fontSize: 10, color: '#10B981' },

  // Cosmic Download banner
  downloadBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 14, padding: 12, marginBottom: 12 },
  downloadIcon: { fontSize: 20, color: T.gold },
  downloadTitle: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 2 },
  downloadSub: { fontSize: 11.5, color: '#8B6A28', lineHeight: 16 },

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

  // Tomorrow preview (forward hook)
  tomorrowCard: { backgroundColor: '#F8F6F0', borderWidth: 1, borderColor: '#EDE6D8', borderRadius: 16, padding: 14, marginBottom: 15 },
  tomorrowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  tomorrowLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone },
  tomorrowArrow: { fontSize: 13, color: T.stone },
  tomorrowText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 4 },
  tomorrowHook: { fontSize: 12, color: T.stone, lineHeight: 17, fontStyle: 'italic' },

  // Domain cards
  domainRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  domainCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 },
  domainIcon: { fontSize: 20, marginBottom: 6 },
  domainName: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 4 },
  domainVibe: { fontSize: 11, color: T.stone, marginBottom: 8, lineHeight: 16 },
  domainCta: { fontSize: 11, color: T.gold, fontFamily: FONTS.sansMedium },

  // Section label
  sectionLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },

  // Planet strip
  pstrip: { marginBottom: 15 },
  pchip: { backgroundColor: 'white', borderRadius: 13, paddingVertical: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: T.border, marginRight: 7 },
  pchipGlyph: { fontSize: 18 },
  pchipName: { fontSize: 9.5, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.7, color: T.stone },
  pchipPos: { fontFamily: FONTS.serif, fontSize: 13.5, color: T.navy },

  // Lucky stats
  luckyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
  luckyStat: { flex: 1, alignItems: 'center' },
  luckyDivider: { width: 1, height: 28, backgroundColor: '#EDE6D8' },
  luckyLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, color: T.stone, marginBottom: 4 },
  luckyNum: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  luckyVal: { fontFamily: FONTS.serif, fontSize: 13, color: T.navy, textAlign: 'center' },

  // Journal
  journalCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, paddingHorizontal: 18, marginBottom: 15, borderWidth: 1, borderColor: T.border },
  jcardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  jcardTitle: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone },
  jcardBadge: { backgroundColor: '#F0E8D6', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  jcardBadgeText: { fontSize: 10, color: '#6B6050' },
  jcardPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.navy, lineHeight: 22, marginBottom: 12, fontStyle: 'italic' },
  jcardBtn: { height: 36, backgroundColor: T.warm, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jcardBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },

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
  domModalHero: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 28, alignItems: 'center' },
  domModalHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10 },
  domModalIcon: { fontSize: 40, color: 'rgba(250,248,242,0.3)', marginBottom: 8 },
  domModalTitle: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, marginBottom: 4 },
  domModalVibe: { fontSize: 13, color: 'rgba(250,248,242,0.5)', fontStyle: 'italic' },
  domHeadline: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 16, lineHeight: 28 },
  domPara: { fontSize: 14, color: T.ink, lineHeight: 23, marginBottom: 14 },
  domActionBox: { backgroundColor: T.warm, borderRadius: 14, padding: 16, marginBottom: 12 },
  domActionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 6 },
  domActionText: { fontSize: 14, color: T.ink, lineHeight: 22 },
  domTimingBox: { backgroundColor: T.navy, borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
  domTimingLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: 'rgba(200,168,75,0.6)', marginBottom: 6 },
  domTimingText: { fontSize: 14, color: T.cream, lineHeight: 22, textAlign: 'center' },

  // Energy detail modal
  energyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  energySheet: { backgroundColor: T.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  energySheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  energySheetIcon: { fontSize: 24 },
  energySheetTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, flex: 1 },
  energySheetBarWrap: { marginBottom: 14 },
  energySheetBarBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 6 },
  energySheetBarFill: { height: '100%', borderRadius: 3 },
  energySheetLevel: { fontSize: 13, fontFamily: FONTS.sansSemiBold },
  energySheetPeriod: { fontSize: 11, color: T.stone, marginBottom: 10 },
  energySheetDesc: { fontSize: 14, color: T.ink, lineHeight: 22, marginBottom: 16 },
  energySheetBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  energySheetBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold },

  // Planet influence modal
  influenceSheet: { backgroundColor: 'white', borderRadius: 20, marginHorizontal: 30, padding: 24, maxWidth: 380, width: '100%', alignSelf: 'center' },
  influenceSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  influenceSheetGlyph: { fontSize: 28, color: T.gold },
  influenceSheetTag: { fontFamily: FONTS.serifMedium, fontSize: 18, color: T.navy, flex: 1 },
  influenceSheetEffect: { fontSize: 14, color: T.ink, lineHeight: 22 },

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
  cosmicAlertCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#0E0E22', borderRadius: 14, padding: 14, marginBottom: 12 },
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
});
