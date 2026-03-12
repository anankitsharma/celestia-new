import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Modal, TextInput, Alert, Dimensions, Platform, StatusBar, Animated, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getMoonDataForDate, getTransitPlanets, getActiveCosmicWindows, isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance, getCosmicSeason } from '../services/astrologyService';
import { fetchExtendedForecast, generateMoonRitual, generateMonthlyRecap } from '../services/geminiService';
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
import { getTodayUnlock, markUnlockShown, getUnlockProgress, UNLOCK_NARRATIVES } from '../services/unlockService';
import { calculateSynastryScore, calculateZodiacOnlyScore, ROLE_COLORS } from '../services/astrology/SynastryService';
import { getElementGreeting, getCosmicArchetype } from '../services/cosmicIdentityService';
import { getNextBadgeProgress } from '../services/achievementService';
import { getTodayQuests, completeQuestAction } from '../services/questService';
import { getCosmicWhisper } from '../services/cosmicWhisperService';
import { getNarrativeContext } from '../services/narrativeService';
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

const formatDateHeader = (date = new Date()) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export default function HomeScreen({ navigation, route }) {
  const { userProfile, partnerProfiles, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('today');
  const [moonData, setMoonData] = useState(null);
  const [transitPlanets, setTransitPlanets] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);


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

  const [narrativeCtx, setNarrativeCtx] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mainScrollRef = useRef(null);
  const tabScrollRef = useRef(null);
  const transitsRef = useRef(null);

  const scrollToTransits = useCallback(() => {
    if (transitsRef.current && mainScrollRef.current) {
      transitsRef.current.measureLayout(
        mainScrollRef.current.getInnerViewRef?.() || mainScrollRef.current,
        (x, y) => mainScrollRef.current.scrollTo({ y: y - 80, animated: true }),
        () => {}
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

    // Cosmic season
    try {
      const season = getCosmicSeason(userProfile.chart, today);
      setCosmicSeason(season);
    } catch (e) {}

    // Narrative context for story continuity
    getNarrativeContext(userProfile?.id || 'default', userProfile.chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => {});

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
      }).catch(() => {});
    }

    // Drip-feed unlock check
    getTodayUnlock().then(unlock => setTodayUnlock(unlock)).catch(() => {});

    // Cosmic whisper (variable rate + tiered rarity)
    getCosmicWhisper(userProfile?.chart).then(whisper => {
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
      setTimeout(() => navigation.navigate('TodaysSky'), 500);
      navigation.setParams({ scrollToSection: undefined });
    }
  }, [route?.params]);

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
      const data = await fetchExtendedForecast(userProfile, tab, planetaryData, transitSignificance, narrativeCtx);
      setForecast(data);
      // Schedule notifications with latest forecast (only on today tab)
      if (tab === 'today') {
        scheduleAllNotifications(userProfile, data, streakData, moonData, null, cosmicWindows).catch(() => {});
        const todayStr = dateLabel;
        getCosmicLineForDate(todayStr).then(line => setTodayCosmicLine(line)).catch(() => {});
        refillCosmicLinesIfNeeded(userProfile).then(generated => {
          if (generated) {
            scheduleAllNotifications(userProfile, data, streakData, moonData, null, cosmicWindows).catch(() => {});
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

  const LIFE_AREA_META = {
    love: { icon: '♡', title: 'Love & Relationships', sub: 'Intimacy · Romance · Self-Love', color: '#E85090', gradient: ['#3A0A2A', '#1A0A2E', '#0E0E22'] },
    career: { icon: '◆', title: 'Career & Finances', sub: 'Work · Ambition · Wealth', color: '#5090E8', gradient: ['#0A1A3A', '#0E1628', '#0E0E22'] },
    vitality: { icon: '✦', title: 'Vitality & Wellness', sub: 'Energy · Health · Rhythm', color: '#50C878', gradient: ['#0A2A1A', '#0E1E22', '#0E0E22'] },
    growth: { icon: '◎', title: 'Growth & Inner Work', sub: 'Learning · Wisdom · Transformation', color: '#F59E0B', gradient: ['#2A1A0A', '#1E1610', '#0E0E22'] },
    social: { icon: '✧', title: 'Social & Community', sub: 'Connection · Communication · Influence', color: '#8B5CF6', gradient: ['#1A0A3A', '#140E2E', '#0E0E22'] },
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
  const isEvening = new Date().getHours() >= 18;

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
          {PERIOD_TABS.map((tab) => (
            <TouchableOpacity key={tab.key}
              style={[styles.periodTab, activeTab === tab.key && styles.periodTabOn]}
              onPress={() => {
                haptic.selection(); setActiveTab(tab.key); mainScrollRef.current?.scrollTo({ y: 0, animated: true });
              }} activeOpacity={0.7}>
              <Text style={[styles.periodTabText, activeTab === tab.key && styles.periodTabTextOn]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>

          {/* ── 1. NAVIGATOR BRIEFING CARD (unified) ── */}
          {activeTab === 'today' && forecast?.navigatorHeadline && (
            <View style={styles.dailyCard}>
              {/* Dark gradient header */}
              <LinearGradient
                colors={['#171428', '#14122A', '#0F1220']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.dailyHd}>
                <Text style={styles.dailyDate}>{formatDateHeader()}</Text>
                <Text style={styles.dailyHeadline}>{forecast.navigatorHeadline}</Text>
                {/* Chips row */}
                <View style={styles.tchips}>
                  {forecast.powerCosmic && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>✦ {forecast.powerCosmic}</Text></View>
                  )}
                  <View style={styles.tchip}><Text style={styles.tchipText}>{moonIcon} {moonPhase}</Text></View>
                  {forecast.luckyStats && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>#{forecast.luckyStats.number}</Text></View>
                  )}
                  {forecast.luckyStats?.crystal && (
                    <View style={styles.tchip}><Text style={styles.tchipText}>✧ {forecast.luckyStats.crystal}</Text></View>
                  )}
                </View>
              </LinearGradient>

              {/* White body */}
              <View style={styles.dailyBody}>
                {/* Summary */}
                {forecast.navigatorSummary && (
                  <Text style={[styles.dailyTxt, { marginBottom: 14 }]}>{forecast.navigatorSummary}</Text>
                )}

                {/* Navigate Toward */}
                {forecast.navigateToward && forecast.navigateToward.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.navDoLabel}>NAVIGATE TOWARD</Text>
                    {forecast.navigateToward.map((item, i) => (
                      <View key={i} style={styles.navDoRow}>
                        <Text style={styles.navDoIcon}>→</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.navDoAction}>{item.action}</Text>
                          <Text style={styles.navDoReason}>{item.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Navigate Around */}
                {forecast.navigateAround && forecast.navigateAround.length > 0 && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={styles.navAvoidLabel}>NAVIGATE AROUND</Text>
                    {forecast.navigateAround.map((item, i) => (
                      <View key={i} style={styles.navAvoidRow}>
                        <Text style={styles.navAvoidIcon}>⊘</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.navAvoidAction}>{item.action}</Text>
                          <Text style={styles.navAvoidReason}>{item.reason}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Deep Dive */}
                <TouchableOpacity style={styles.briefingMoreBtn} activeOpacity={0.7}
                  onPress={() => {
                    haptic.light();
                    setShowBriefing(true);
                    completeQuestAction('forecast_read').then(r => {
                      if (r) { setQuestData(prev => prev ? { ...prev, quests: r.quests, allComplete: r.allComplete } : prev); }
                      if (r?.justCompleted) {
                        trackEvent('quest_complete').catch(() => {});
                        awardXP(userProfile?.id || 'default', 'quest_bonus').then(xp => { if (xp) showXPGain(xp.amount); }).catch(() => {});
                      }
                    }).catch(() => {});
                  }}>
                  <Text style={styles.briefingMoreText}>Deep Dive</Text>
                  <Text style={styles.briefingMoreArrow}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {activeTab === 'today' && forecastLoading && !forecast?.navigatorHeadline && (
            <View style={styles.dailyCard}>
              <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.dailyHd, { alignItems: 'center', paddingVertical: 32 }]}>
                <ActivityIndicator size="small" color={T.gold} />
                <Text style={{ fontSize: 11, color: 'rgba(250,248,242,0.35)', marginTop: 10, textAlign: 'center' }}>Reading the stars…</Text>
              </LinearGradient>
            </View>
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
              <View style={styles.dailyBody}>
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
                        <AstroText text={p} style={styles.dailyTxt} />
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
          {activeTab === 'today' && <Text style={styles.sectionLabel}>LIFE AREA NAVIGATOR</Text>}
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
                <TouchableOpacity key={area.key} style={[styles.lifeAreaCard, { borderTopColor: area.color }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    haptic.light();
                    setLifeAreaModal(area.key);
                  }}>
                  <View style={styles.lifeAreaHeader}>
                    <Text style={[styles.lifeAreaIcon, { color: area.color }]}>{area.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lifeAreaTitle}>{area.title}</Text>
                      <Text style={styles.lifeAreaSubtitle}>{area.subtitle}</Text>
                    </View>
                    <View style={[styles.lifeAreaEnergyBadge, { backgroundColor: area.color + '18' }]}>
                      <Text style={[styles.lifeAreaEnergyText, { color: area.color }]}>{data?.energy || 'Steady'}</Text>
                    </View>
                  </View>
                  {data?.planetaryReason && (
                    <Text style={styles.lifeAreaPlanetReason}>{data.planetaryReason}</Text>
                  )}
                  {data?.doItems && data.doItems.length > 0 && (
                    <View style={styles.lifeAreaDoSection}>
                      {data.doItems.slice(0, 2).map((item, i) => (
                        <View key={i} style={styles.lifeAreaDoRow}>
                          <Text style={[styles.lifeAreaDoIcon, { color: area.color }]}>→</Text>
                          <Text style={styles.lifeAreaDoText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {data?.avoidItems && data.avoidItems.length > 0 && !data.avoidItems[0]?.includes?.('Steady skies') && (
                    <View style={styles.lifeAreaAvoidSection}>
                      {data.avoidItems.slice(0, 1).map((item, i) => (
                        <View key={i} style={styles.lifeAreaAvoidRow}>
                          <Text style={styles.lifeAreaAvoidIcon}>⊘</Text>
                          <Text style={styles.lifeAreaAvoidText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {data?.navigatorNote && (
                    <Text style={styles.lifeAreaNote}>"{data.navigatorNote}"</Text>
                  )}
                  <Text style={[styles.lifeAreaCta, { color: area.color }]}>Deep Dive →</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>}


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
                colors={['#0F0C24', '#161038', '#0E1628', '#0C1220']}
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
            <View style={styles.previouslyCard}>
              <Text style={styles.previouslyLabel}>PREVIOUSLY</Text>
              <Text style={styles.previouslyText}>
                {narrativeCtx.yesterday.forecastHeader ? `"${narrativeCtx.yesterday.forecastHeader}"` : ''}
                {narrativeCtx.yesterday.forecastHeader && narrativeCtx.yesterday.journalText ? ' — ' : ''}
                {narrativeCtx.yesterday.journalText ? `you wrote about ${narrativeCtx.yesterday.journalText.substring(0, 60).toLowerCase()}${narrativeCtx.yesterday.journalText.length > 60 ? '...' : ''}` : ''}
                {narrativeCtx.yesterday.journalMood ? ` (mood: ${narrativeCtx.yesterday.journalMood})` : ''}
              </Text>
            </View>
          )}

          {/* ── COSMIC JOURNAL (today only) ── */}
          {activeTab === 'today' && <TouchableOpacity style={styles.journalCard} activeOpacity={0.85}
            onPress={() => navigation.navigate('Journal', { mantra: forecast?.mantra })}>
            <View style={styles.jcardHeader}>
              <Text style={styles.jcardTitle}>YOUR COSMIC JOURNAL</Text>
              <View style={[styles.jcardBadge, journalSaved && { backgroundColor: '#D8F0D0' }]}>
                <Text style={styles.jcardBadgeText}>{journalSaved ? 'Saved' : 'Today'}</Text>
              </View>
            </View>
            <Text style={styles.jcardPrompt}>
              {forecast?.mantra
                ? `"${forecast.mantra}"`
                : '"What is the universe trying to teach you right now?"'}
            </Text>
            <View style={styles.jcardFooter}>
              <Text style={styles.jcardCta}>{journalSaved ? '📖 Read Today\'s Page' : '✍ Write Today\'s Page'}</Text>
              <Text style={styles.jcardArrow}>→</Text>
            </View>
          </TouchableOpacity>}

          {/* ── EVENING REFLECTION (after 6 PM, today only) ── */}
          {activeTab === 'today' && isEvening && (
            <View style={styles.eveningCard}>
              <Text style={styles.eveningLabel}>EVENING REFLECTION</Text>
              <Text style={styles.eveningPrompt}>How did your day match the navigator's reading?</Text>
              <TouchableOpacity style={styles.eveningBtn} activeOpacity={0.7}
                onPress={() => navigation.navigate('Journal', { mantra: forecast?.mantra })}>
                <Text style={styles.eveningBtnText}>Reflect in Journal →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ─── EXTRAS & ENGAGEMENT                      ─── */}
          {/* ═══════════════════════════════════════════════ */}

          {activeTab === 'today' && (todayCosmicLine || todayUnlock || monthlyRecap || questData?.quests || nextBadge || cosmicWhisper) && (
            <View style={{ marginTop: 12, marginBottom: 4, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, paddingHorizontal: 20 }}>YOUR COSMIC STORY</Text>
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
          {activeTab === 'today' && todayUnlock && (
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
                trackEvent('share').catch(() => {});
                awardXP(userProfile?.id || 'default', 'share').catch(() => {});
              }}>
                <Text style={styles.recapShareText}>Share Your Recap ↗</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── DAILY QUESTS ── */}
          {activeTab === 'today' && questData?.quests && (
            <QuestCard
              quests={questData.quests}
              allComplete={questData.allComplete}
              weeklyCount={questData.weeklyCount || 0}
            />
          )}

          {/* ── NEXT BADGE PROGRESS ── */}
          {activeTab === 'today' && nextBadge && (
            <View style={styles.nextBadgeCard}>
              <View style={styles.nextBadgeHeader}>
                <Text style={styles.nextBadgeIcon}>{nextBadge.badge.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextBadgeLabel}>YOUR NEXT CHAPTER</Text>
                  <Text style={styles.nextBadgeName}>{nextBadge.badge.name}</Text>
                </View>
                <Text style={styles.nextBadgeCount}>{nextBadge.current}/{nextBadge.target}</Text>
              </View>
              <View style={styles.nextBadgeBarBg}>
                <View style={[styles.nextBadgeBarFill, { width: `${(nextBadge.progress * 100).toFixed(0)}%` }]} />
              </View>
              <Text style={styles.nextBadgeSub}>{nextBadge.remaining} more to unlock this chapter</Text>
            </View>
          )}

          {/* ── COSMIC WHISPER (Easter egg) — tap to share ── */}
          {activeTab === 'today' && cosmicWhisper && (
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

          {/* ── YOUR CIRCLE ── */}
          {partnerProfiles && partnerProfiles.length > 0 && (
            <TouchableOpacity style={styles.circleWidget} activeOpacity={0.7}
              onPress={() => navigation.navigate('Circle')}>
              <View style={styles.circleWidgetLeft}>
                <Text style={styles.circleWidgetTitle}>YOUR CIRCLE</Text>
                <View style={styles.circleWidgetOrbs}>
                  {partnerProfiles.slice(0, 5).map((p, i) => {
                    const role = p.relationshipType || 'other';
                    const colors = (ROLE_COLORS[role] || ROLE_COLORS.other).bg;
                    let score = null;
                    try {
                      if (p.isZodiacOnly) {
                        const uSun = userProfile?.chart?.planets?.find(pl => pl.name === 'Sun')?.sign;
                        score = calculateZodiacOnlyScore(uSun, p.zodiacSign).harmonyScore;
                      } else if (p.chart && userProfile?.chart) {
                        score = calculateSynastryScore(userProfile.chart, p.chart, role).harmonyScore;
                      }
                    } catch (e) {}
                    return (
                      <View key={p.id} style={[styles.circleWidgetOrb, { marginLeft: i > 0 ? -8 : 0 }]}>
                        <LinearGradient colors={colors} style={styles.circleWidgetOrbInner}>
                          <Text style={styles.circleWidgetOrbText}>{(p.name || '?')[0].toUpperCase()}</Text>
                        </LinearGradient>
                        {score != null && (
                          <View style={styles.circleWidgetOrbScore}>
                            <Text style={{ fontSize: 7, color: T.gold, fontFamily: FONTS.sansSemiBold }}>{score}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {partnerProfiles.length > 5 && (
                    <View style={[styles.circleWidgetOrb, { marginLeft: -8 }]}>
                      <View style={[styles.circleWidgetOrbInner, { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: 'rgba(200,168,75,0.3)' }]}>
                        <Text style={{ fontSize: 10, color: T.gold }}>+{partnerProfiles.length - 5}</Text>
                      </View>
                    </View>
                  )}
                </View>
                <Text style={styles.circleWidgetSub}>
                  {(() => {
                    const counts = {};
                    partnerProfiles.forEach(p => { const r = p.relationshipType || 'other'; counts[r] = (counts[r] || 0) + 1; });
                    const parts = [];
                    if (counts.partner) parts.push(`${counts.partner} partner${counts.partner > 1 ? 's' : ''}`);
                    if (counts.friend) parts.push(`${counts.friend} friend${counts.friend > 1 ? 's' : ''}`);
                    const fam = (counts.parent || 0) + (counts.sibling || 0) + (counts.child || 0);
                    if (fam) parts.push(`${fam} family`);
                    const work = (counts.boss || 0) + (counts.colleague || 0);
                    if (work) parts.push(`${work} work`);
                    if (counts.other) parts.push(`${counts.other} other`);
                    return parts.join(' · ');
                  })()}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: T.stone }}>›</Text>
            </TouchableOpacity>
          )}

          {/* ── QUICK ACTIONS ── */}
          <Text style={styles.sectionLabel}>CONTINUE YOUR STORY</Text>
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
              onPress={() => navigation.navigate('Circle')}>
              <Text style={styles.quickIcon}>♡</Text>
              <Text style={styles.quickLabel}>Your Circle</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROMO ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Reports')}>
            <LinearGradient colors={['#1A1530', '#14112A', '#101320']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
              <Text style={styles.promoLbl}>REPORTS</Text>
              <Text style={styles.promoTitle}>Your Cosmic Deep Dives</Text>
              <Text style={styles.promoSub}>Love, Career, Purpose — chapters written for this moment in your journey</Text>
              <View style={styles.promoCta}><Text style={styles.promoCtaText}>Open Your Reports →</Text></View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* ── DEEP DIVE MODAL ── */}
      <Modal visible={showBriefing} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: T.cream }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          {/* ── Hero: same headline as card for continuity ── */}
          <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.ddHero}>
            <View style={styles.ddHeaderRow}>
              <Text style={styles.ddDate}>{formatDateHeader().toUpperCase()}</Text>
              <TouchableOpacity onPress={() => setShowBriefing(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.ddClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {/* Decorative compass icon */}
            <View style={styles.ddCompassWrap}>
              <View style={styles.ddCompassGlow} />
              <View style={styles.ddCompassRing}>
                <Text style={styles.ddCompassIcon}>✦</Text>
              </View>
            </View>
            <Text style={styles.ddLabel}>YOUR NAVIGATOR BRIEFING</Text>
            <Text style={styles.ddHeadline}>{forecast?.navigatorHeadline}</Text>
            {forecast?.navigatorSummary && (
              <Text style={styles.ddSummary}>{forecast.navigatorSummary}</Text>
            )}
            {/* Glance chips in glass container */}
            <View style={styles.ddChipsGlass}>
              <View style={styles.ddChipItem}><Text style={styles.ddChipText}>{moonIcon} {moonPhase}</Text></View>
              {forecast?.powerCosmic && (
                <View style={styles.ddChipItem}><Text style={styles.ddChipText}>✦ {forecast.powerCosmic}</Text></View>
              )}
              {forecast?.luckyStats && (
                <View style={styles.ddChipItem}><Text style={styles.ddChipText}>#{forecast.luckyStats.number}</Text></View>
              )}
            </View>
          </LinearGradient>

            {/* ── 1. THE READING — full horoscope paragraphs ── */}
            {paragraphs.length > 0 && (
              <View style={styles.ddSection}>
                <Text style={styles.ddSectionLabel}>YOUR READING</Text>
                {paragraphs.map((p, i) => (
                  <View key={i} style={styles.ddParaBlock}>
                    {getParaLabels()[i] && (
                      <Text style={styles.ddParaLabel}>{getParaLabels()[i]}</Text>
                    )}
                    <AstroText text={p} style={styles.ddParaText} />
                  </View>
                ))}
              </View>
            )}

            {/* ── 2. PLANET INFLUENCES — why you feel this way ── */}
            {forecast?.planetInfluences && forecast.planetInfluences.length > 0 && (
              <View style={styles.ddSection}>
                <Text style={styles.ddSectionLabel}>WHAT'S DRIVING TODAY</Text>
                {forecast.planetInfluences.map((inf, i) => (
                  <View key={i} style={styles.ddInfluenceCard}>
                    <Text style={styles.ddInfluenceGlyph}>{inf.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ddInfluenceTag}>{inf.tag}</Text>
                      <Text style={styles.ddInfluenceEffect}>{inf.effect}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── 3. LIFE AREAS — deep per-area breakdown ── */}
            {forecast?.lifeAreas && (
              <View style={styles.ddSection}>
                <Text style={styles.ddSectionLabel}>LIFE AREAS</Text>
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
                    <View key={area.key} style={styles.laCard}>
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
                            <View style={[styles.laChip, { backgroundColor: '#F5F3EE' }]}>
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
                              <Text style={[styles.laDoText, { color: T.stone }]}>{item}</Text>
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
                <Text style={styles.ddSectionLabel}>POWER MOVES</Text>
                <View style={styles.ddActionCard}>
                  {actionItems.map((item, i) => (
                    <View key={i} style={styles.ddActionRow}>
                      <View style={styles.ddActionNum}>
                        <Text style={styles.ddActionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={styles.ddActionText}>{item}</Text>
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
                  <Text style={styles.ddRitualText}>✧ {forecast.dailyRitual}</Text>
                </View>
              </View>
            )}

            {/* ── 6. DAY AT A GLANCE — cosmic stats ── */}
            <View style={styles.ddSection}>
              <Text style={styles.ddSectionLabel}>COSMIC STATS</Text>
              <View style={styles.ddStatsCard}>
                <View style={styles.ddStatRow}>
                  <Text style={styles.ddStatLabel}>Moon</Text>
                  <Text style={styles.ddStatValue}>{moonIcon} {moonPhase} in {moonSign}</Text>
                </View>
                <View style={styles.ddStatDivider} />
                <View style={styles.ddStatRow}>
                  <Text style={styles.ddStatLabel}>Energy</Text>
                  <Text style={styles.ddStatValue}>{forecast?.powerCosmic || 'Balanced'}</Text>
                </View>
                {forecast?.luckyStats && (
                  <>
                    <View style={styles.ddStatDivider} />
                    <View style={styles.ddStatRow}>
                      <Text style={styles.ddStatLabel}>Power Number</Text>
                      <Text style={[styles.ddStatValue, { fontFamily: FONTS.serif, fontSize: 18 }]}>{forecast.luckyStats.number}</Text>
                    </View>
                    <View style={styles.ddStatDivider} />
                    <View style={styles.ddStatRow}>
                      <Text style={styles.ddStatLabel}>Power Color</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {forecast.luckyStats.colorHex && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: forecast.luckyStats.colorHex }} />
                        )}
                        <Text style={styles.ddStatValue}>{forecast.luckyStats.color}</Text>
                      </View>
                    </View>
                    {forecast.luckyStats.crystal && (
                      <>
                        <View style={styles.ddStatDivider} />
                        <View style={styles.ddStatRow}>
                          <Text style={styles.ddStatLabel}>Crystal</Text>
                          <Text style={styles.ddStatValue}>✧ {forecast.luckyStats.crystal}</Text>
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
                  <Text style={styles.ddMantraText}>"{forecast.mantra}"</Text>
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
                    trackEvent('share').catch(() => {});
                    awardXP(userProfile?.id || 'default', 'share').catch(() => {});
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
            <View style={{ flex: 1, backgroundColor: T.cream }}>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
              {/* ── Hero ── */}
              <LinearGradient colors={meta.gradient} style={styles.lamHero}>
                {/* Top bar: date + close */}
                <View style={styles.lamTopBar}>
                  <Text style={styles.lamDateLabel}>{formatDateHeader().toUpperCase()}</Text>
                  <TouchableOpacity onPress={() => setLifeAreaModal(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
                    <View style={styles.lamReadingBox}>
                      <Text style={styles.lamSectionLabel}>YOUR READING</Text>
                      <Text style={styles.lamReadingText}>{areaData?.horoscope || ''}</Text>
                      {relatedHoroscope && relatedHoroscope !== areaData?.horoscope ? (
                        <Text style={[styles.lamReadingText, { marginTop: 10 }]}>{relatedHoroscope}</Text>
                      ) : null}
                    </View>
                  ) : null}

                  {/* ── 3. Vibe (love/career only) ── */}
                  {relatedVibe ? (
                    <View style={[styles.lamVibeBox, { borderLeftColor: meta.color }]}>
                      <Text style={[styles.lamVibeLabel, { color: meta.color }]}>TODAY'S VIBE</Text>
                      <Text style={styles.lamVibeText}>{relatedVibe}</Text>
                    </View>
                  ) : null}

                  {/* ── 4. Navigate Toward ── */}
                  {areaData?.doItems && areaData.doItems.length > 0 ? (
                    <View style={styles.lamDoSection}>
                      <Text style={[styles.lamSectionLabel, { color: meta.color }]}>NAVIGATE TOWARD</Text>
                      {areaData.doItems.map((item, i) => (
                        <View key={i} style={styles.lamDoRow}>
                          <View style={[styles.lamDoDot, { backgroundColor: meta.color }]} />
                          <Text style={styles.lamDoText}>{item}</Text>
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
                          <Text style={styles.lamDoText}>{item}</Text>
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
                          <Text style={[styles.lamDoText, { color: T.stone }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* ── 7. Career extras: Power Source, Wealth Flow, Market Timing ── */}
                  {(careerPower || wealthFlow || marketTiming) ? (
                    <View style={styles.lamCareerExtras}>
                      {careerPower ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>POWER SOURCE</Text>
                          <Text style={styles.lamCareerRowText}>{careerPower}</Text>
                        </View>
                      ) : null}
                      {wealthFlow ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>WEALTH FLOW</Text>
                          <Text style={styles.lamCareerRowText}>{wealthFlow}</Text>
                        </View>
                      ) : null}
                      {marketTiming ? (
                        <View style={styles.lamCareerRow}>
                          <Text style={styles.lamCareerRowLabel}>TIMING</Text>
                          <Text style={styles.lamCareerRowText}>{marketTiming}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {/* ── 8. Timing ── */}
                  {areaData?.timing ? (
                    <View style={styles.lamTimingRow}>
                      <Text style={styles.lamTimingIcon}>◷</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.lamTimingLabel}>BEST WINDOW</Text>
                        <Text style={styles.lamTimingText}>{areaData.timing}</Text>
                      </View>
                    </View>
                  ) : null}

                  {/* ── 9. Today's Practice / Ritual ── */}
                  {areaData?.ritual ? (
                    <View style={[styles.lamRitualBox, { borderLeftColor: meta.color }]}>
                      <Text style={[styles.lamRitualLabel, { color: meta.color }]}>TODAY'S PRACTICE</Text>
                      <Text style={styles.lamRitualText}>{areaData.ritual}</Text>
                    </View>
                  ) : null}

                  {/* ── 10. Affirmation ── */}
                  {areaData?.affirmation ? (
                    <View style={styles.lamAffirmationBox}>
                      <Text style={styles.lamAffirmationText}>"{areaData.affirmation}"</Text>
                    </View>
                  ) : null}

                  {/* ── 11. Navigator Note ── */}
                  {areaData?.navigatorNote ? (
                    <View style={styles.lamNoteBox}>
                      <Text style={styles.lamNoteText}>— {areaData.navigatorNote}</Text>
                    </View>
                  ) : null}

                  {/* ── 12. Ask AI for more ── */}
                  <TouchableOpacity
                    style={[styles.lamAskAI, { backgroundColor: meta.color }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setLifeAreaModal(null);
                      setTimeout(() => {
                        navigation.navigate('AskAI', {
                          initialMessage: `Tell me more about my ${meta.title.toLowerCase()} energy today. What should I know based on my chart and current transits?`
                        });
                      }, 300);
                    }}>
                    <Text style={styles.lamAskAIText}>Go Deeper with AI</Text>
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
            scheduleAllNotifications(userProfile, forecast, streakData, moonData, null, cosmicWindows).catch(() => {});
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

  content: { paddingHorizontal: 20, paddingTop: 14 },

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
  eveningBtn: { backgroundColor: T.warm, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  eveningBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },

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
  lamHero: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 22, paddingBottom: 24, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
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
  lamAskAI: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  lamAskAIText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: '#FFFFFF' },

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
  previouslyCard: { backgroundColor: T.warm, borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 12 },
  previouslyLabel: { fontSize: 9, letterSpacing: 2, color: T.stone, fontFamily: FONTS.sansSemiBold, marginBottom: 6 },
  previouslyText: { fontSize: 14, color: T.ink, fontFamily: FONTS.serifItalic || FONTS.serif, lineHeight: 20 },

  // Navigator Briefing
  // Briefing deep dive button
  briefingMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingVertical: 10, backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)' },
  briefingMoreText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  briefingMoreArrow: { fontSize: 14, color: T.gold, marginLeft: 6 },
  // Deep Dive Modal
  ddHero: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 24, paddingHorizontal: 22, alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
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
});
