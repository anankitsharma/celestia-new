'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

import { getMoonDataForDate, getTransitPlanets, getActiveCosmicWindows, isMercuryRetrograde, getCosmicChangeToday, calculateTransitSignificance, getCosmicSeason, getUpcomingEclipse } from '@/lib/astrologyService';
import { fetchExtendedForecast, generateMoonRitual, generateMonthlyRecap } from '@/lib/geminiService';
import { ForecastRepository } from '@/lib/database/rep_forecasts';
import { loadObject, saveObject, loadString, saveString, loadBoolean, saveBoolean, StorageKeys } from '@/lib/storage';
import { getNarrativeContext } from '@/lib/narrativeService';
import { useTheme } from '@/lib/ThemeContext';
import { JournalRepository } from '@/lib/database/rep_journal';
import { recordCheckIn, getStreakData } from '@/lib/engagementService';

const UNLOCK_NARRATIVES = {};

// colors object is now provided by useTheme() inside the component

const T = {
  navy: '#0E0E22',
  navyMid: '#16163A',
  navyLt: '#1E1E4A',
  gold: '#C8A84B',
  goldLt: '#E2C46A',
  goldDim: 'rgba(200,168,75,0.12)',
  cream: '#FAF8F2',
  warm: '#F3EDE2',
  stone: '#97907F',
  ink: '#2A2418',
  border: '#EAE3D6',
  white: '#FFFFFF',
};

const isDark = true;
const isPro = false;

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

const getTimeMode = () => {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'afternoon';
  if (h >= 17 && h < 23) return 'evening';
  return 'latenight';
};

const HERO_GRADIENTS = {
  morning:   ['#1A1228', '#1E1430', '#16122A'],
  afternoon: ['#1A1228', '#1E1430', '#16122A'],
  evening:   ['#16101E', '#1A1228', '#14102A'],
  latenight: ['#110E1A', '#140F20', '#100D18'],
};

const CONTENT_GRADIENTS = {
  love:       ['#1E1020', '#201228', '#18101E'],
  career:     ['#141828', '#161A30', '#121628'],
  energy:     ['#141E18', '#161A20', '#12181A'],
  headsup:    ['#1E1610', '#201818', '#181410'],
  greenlight: ['#101E14', '#142018', '#101A14'],
  reflection: ['#181020', '#1A1228', '#14101E'],
};

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

// ── Stub components for missing dependencies ──
const CosmicTooltip = ({ id, size, light }) => null;
const AstroText = ({ text, style }) => <span style={style}>{text}</span>;
const QuestCard = ({ quests, allComplete, weeklyCount }) => null;
const MonthlyRecapCard = () => null;

const LIFE_AREA_META = {
  love: { icon: '♡', title: 'Love & Relationships', sub: 'Intimacy · Romance · Self-Love', color: '#E85090', gradient: ['#3A0A2A', '#1A0A2E', '#0E0E22'] },
  career: { icon: '◆', title: 'Career & Finances', sub: 'Work · Ambition · Wealth', color: '#5090E8', gradient: ['#0A1A3A', '#0E1628', '#0E0E22'] },
  vitality: { icon: '✦', title: 'Vitality & Wellness', sub: 'Energy · Health · Rhythm', color: '#50C878', gradient: ['#0A2A1A', '#0E1E22', '#0E0E22'] },
  growth: { icon: '◎', title: 'Growth & Inner Work', sub: 'Learning · Wisdom · Transformation', color: '#F59E0B', gradient: ['#2A1A0A', '#1E1610', '#0E0E22'] },
  social: { icon: '✧', title: 'Social & Community', sub: 'Connection · Communication · Influence', color: '#8B5CF6', gradient: ['#1A0A3A', '#140E2E', '#0E0E22'] },
};

export default function TodayScreen({ onNavigate, userProfile, partnerProfiles, isLoading: profileLoading }) {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('today');
  const [moonData, setMoonData] = useState(null);
  const [transitPlanets, setTransitPlanets] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Domain modal
  const [lifeAreaModal, setLifeAreaModal] = useState(null);
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
  const [pendingBadge, setPendingBadge] = useState(null);
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
  const transitsRef = useRef(null);

  const scrollToTransits = useCallback(() => {
    if (transitsRef.current && mainScrollRef.current) {
      const rect = transitsRef.current.getBoundingClientRect();
      const scrollTop = mainScrollRef.current.scrollTop;
      mainScrollRef.current.scrollTo({ top: scrollTop + rect.top - 80, behavior: 'smooth' });
    }
  }, []);

  const today = new Date();
  const name = userProfile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  // XP float animation helper (CSS-based)
  const showXPGain = useCallback((amount) => {
    setXpGainText(`+${amount} Stardust`);
    setTimeout(() => setXpGainText(''), 1200);
  }, []);

  // Process badge unlocks
  const processBadges = useCallback((badges) => {
    if (badges?.length > 0) {
      setPendingBadge(badges[0].badge);
    }
  }, []);

  // Load base data on mount
  useEffect(() => {
    if (!userProfile?.chart) return;
    let moon = null;
    try { moon = getMoonDataForDate(today); setMoonData(moon); } catch (e) { console.error(e); }
    try { setTransitPlanets(getTransitPlanets(today)); } catch (e) { console.error(e); }
    loadJournalEntry();

    try {
      const windows = getActiveCosmicWindows(userProfile.chart, today);
      setCosmicWindows((windows || []).slice(0, 3));
      setMercuryRx(isMercuryRetrograde(today));
    } catch (e) { console.error('Cosmic windows error:', e); }

    try {
      const eclipse = getUpcomingEclipse(today);
      setUpcomingEclipse(eclipse);
    } catch (e) { }

    try {
      const change = getCosmicChangeToday(userProfile.chart);
      setCosmicChange(change);
    } catch (e) { console.error('Cosmic change error:', e); }

    try {
      const sig = calculateTransitSignificance(userProfile.chart, today);
      setTransitSignificance(sig);
    } catch (e) { }

    try {
      const season = getCosmicSeason(userProfile.chart, today);
      setCosmicSeason(season);
    } catch (e) { }

    getNarrativeContext(userProfile?.id || 'default', userProfile.chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => { });

    JournalRepository.getEntryCount(userProfile?.id || 'default').then(c => setJournalCount(c)).catch(() => { });

    // Monthly recap (1st-3rd of month)
    if (today.getDate() <= 3) {
      const recapKey = `recap_${today.getFullYear()}_${today.getMonth()}`;
      loadObject(recapKey).then(async (cached) => {
        if (cached) {
          setMonthlyRecap(cached);
          return;
        }
        const fullChart = userProfile?.chart || null;
        const jCount = await JournalRepository.getEntryCount(userProfile?.id || 'default').catch(() => 0);
        const recap = await generateMonthlyRecap(fullChart, {
          daysActive: streakData?.total_check_ins || 0,
          journalEntries: jCount,
          longestStreak: streakData?.longest_streak || 0,
        });
        if (recap) {
          setMonthlyRecap(recap);
          await saveObject(recapKey, recap);
        }
      }).catch(() => { });
    }

    // Engagement — streaks + XP
    recordCheckIn().then(s => setStreakData(s)).catch(() => {});
    getStreakData().then(s => setStreakData(s)).catch(() => {});
    (async () => {
      try {
        const { getXPStatus } = await import('@/lib/engagementService');
        const xp = await getXPStatus();
        setXpData(xp);
      } catch {}
    })();
  }, [userProfile]);

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
        transits: (tabTransits || []).map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
      };
      const data = await fetchExtendedForecast(userProfile, tab, planetaryData, transitSignificance, narrativeCtx);
      setForecast(data);
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
    try {
      const moods = await loadObject('celestia_evening_moods') || {};
      const dateStr = today.toISOString().split('T')[0];
      if (moods[dateStr]) setEveningMood(moods[dateStr]);
    } catch (e) { }
  };

  const saveEveningMood = async (mood) => {
    setEveningMood(mood);
    try {
      const dateStr = today.toISOString().split('T')[0];
      const moods = await loadObject('celestia_evening_moods') || {};
      moods[dateStr] = mood;
      await saveObject('celestia_evening_moods', moods);
    } catch (e) { }
  };

  const saveJournalEntry = async () => {
    if (!journalText.trim()) return;
    try {
      const dateStr = today.toISOString().split('T')[0];
      const profileId = userProfile?.id || 'default';
      const entries = await loadObject(JOURNAL_KEY) || {};
      entries[dateStr] = journalText.trim();
      await saveObject(JOURNAL_KEY, entries);
      const prompt = JSON.stringify({
        mantra: forecast?.mantra || '',
        mood: journalMood,
        energy: journalEnergy,
      });
      await JournalRepository.saveEntry(profileId, dateStr, journalText.trim(), prompt);
      setJournalSaved(true);
      setShowJournal(false);
    } catch (e) { console.error(e); }
  };

  const openMoonRitual = async () => {
    if (!moonData) return;
    const isNewMoon = moonData.phaseName === 'New Moon';
    setShowMoonRitual(true);
    setRitualSaved(false);
    setRitualIntention('');

    const rituals = await loadObject(StorageKeys.MOON_RITUALS) || {};
    const todayStr = today.toISOString().split('T')[0];
    if (rituals[todayStr]) {
      setMoonRitual(rituals[todayStr].ritual);
      setRitualIntention(rituals[todayStr].intention || '');
      if (rituals[todayStr].intention) setRitualSaved(true);
      return;
    }

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
    const todayStr = today.toISOString().split('T')[0];
    const rituals = await loadObject(StorageKeys.MOON_RITUALS) || {};
    if (rituals[todayStr]) {
      rituals[todayStr].intention = ritualIntention.trim();
    } else {
      rituals[todayStr] = { ritual: moonRitual, intention: ritualIntention.trim(), createdAt: Date.now() };
    }
    await saveObject(StorageKeys.MOON_RITUALS, rituals);
    setRitualSaved(true);
  };

  // Navigation helper
  const navigate = (screen, params) => {
    if (onNavigate) onNavigate(screen, params);
  };

  if (profileLoading || !userProfile?.chart) {
    return (
      <div style={{ display: 'flex', flex: 1, backgroundColor: 'var(--c-bg)', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ width: 36, height: 36, border: `3px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const moonPhase = moonData?.phaseName || 'Waning Crescent';
  const moonSign = moonData?.sign || '—';
  const moonIcon = MOON_PHASE_ICONS[moonPhase] || '🌘';
  const isEvening = new Date().getHours() >= 18;
  const timeMode = getTimeMode();

  // Zodiac season detection
  const currentZodiacSeason = (() => {
    const sunTransit = transitPlanets.find(p => p.name === 'Sun');
    if (!sunTransit?.sign) return null;
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

  // Split horoscope into paragraphs
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

  // Helper to build linear-gradient CSS from color array
  const linearGradient = (colorsArr, direction = 'to bottom') =>
    `linear-gradient(${direction}, ${colorsArr.join(', ')})`;

  // Hero gradient
  let ct = forecast?.contentType;
  if (!ct && forecast?.lifeAreas) {
    const areas = [{ key: 'love', type: 'love' }, { key: 'career', type: 'career' }, { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' }, { key: 'social', type: 'greenlight' }];
    const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
    if (top) ct = top.type;
  }
  const heroColors = (ct && CONTENT_GRADIENTS[ct]) || HERO_GRADIENTS[timeMode] || HERO_GRADIENTS.morning;

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', minHeight: '100vh', position: 'relative' }}>
      <div
        ref={mainScrollRef}
        className="scroll-container"
        style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 110 }}
      >
        {/* ── HERO — rounded bottom, greeting + moon row + avatar ── */}
        <div style={{
          background: linearGradient(heroColors),
          paddingTop: 70,
          paddingLeft: 22,
          paddingRight: 22,
          paddingBottom: 46,
          position: 'relative',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}>
          {/* Row 1: Greeting + Name (left) | Streak pill + Avatar (right) */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 2, display: 'block' }}>{getAdaptiveGreeting(timeMode, firstName)},</span>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, color: 'var(--c-heading)', margin: 0, fontWeight: 400 }}>{firstName}</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Streak pill */}
              {streakData && streakData.current_streak > 0 && !isLateNight && (
                <button
                  onClick={() => setShowStreakModal(true)}
                  style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)',
                    borderRadius: 100, padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 14 }}>{moonIcon}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: T.gold }}>{streakData.current_streak}</span>
                </button>
              )}
              {/* Avatar */}
              <button
                onClick={() => navigate('Profile')}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: xpData ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  position: 'relative', cursor: 'pointer',
                }}
              >
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: T.gold }}>{firstName[0]?.toUpperCase() || '✦'}</span>
                {xpData && (
                  <div style={{
                    position: 'absolute', width: 50, height: 50, borderRadius: 25,
                    border: `2px solid ${xpData.levelInfo?.current?.ringColor || 'rgba(200,168,75,0.3)'}`,
                    top: -3, left: -3, pointerEvents: 'none',
                  }} />
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Moon phase */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <span style={{ fontSize: 18 }}>{moonIcon}</span>
            <span style={{ fontSize: 13, color: 'rgba(250,248,242,0.7)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              <span style={{ fontWeight: 600 }}>{moonPhase}</span>
              {moonSign !== '—' ? ` in ` : ''}
              {moonSign !== '—' && <span style={{ fontWeight: 600 }}>{moonSign}</span>}
              {moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}%` : ''}
            </span>
            <CosmicTooltip id="moon_phase" size={14} light />
          </div>
        </div>

        {/* ── FLOATING TAB PILL — overlaps hero bottom edge ── */}
        <div style={{ marginTop: -24, paddingLeft: 20, paddingRight: 20, marginBottom: 16, zIndex: 10, position: 'relative' }}>
          <div style={{
            display: 'flex', flexDirection: 'row', borderRadius: 100, padding: 4,
            backgroundColor: 'var(--c-card)',
            border: '1px solid var(--c-border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          }}>
            {PERIOD_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  flex: 1, padding: '11px 0', textAlign: 'center', borderRadius: 100,
                  backgroundColor: activeTab === tab.key ? 'var(--c-bg)' : 'transparent',
                  border: activeTab === tab.key ? '1px solid var(--c-border)' : '1px solid transparent',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <span style={{
                  fontSize: 13,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  color: activeTab === tab.key ? 'var(--c-heading)' : 'var(--c-text-secondary)',
                }}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── ZODIAC SEASON BANNER ── */}
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
            <div style={{ margin: '0 20px', backgroundColor: s.color + '15', border: `1px solid ${s.color}25`, borderRadius: 20, padding: 16, marginBottom: 12, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22 }}>{s.emoji}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: s.color }}>{s.glyph} {currentZodiacSeason.sign.toUpperCase()} SEASON</span>
                  {isYourSeason && (
                    <span style={{ backgroundColor: s.color + '20', borderRadius: 6, padding: '1px 6px', fontSize: 7, fontFamily: 'var(--font-sans)', fontWeight: 600, color: s.color, letterSpacing: 0.5 }}>YOUR SIGN</span>
                  )}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--c-heading)', marginBottom: 2, margin: 0 }}>
                  {isYourSeason ? `This is your season, ${firstName}` : `${currentZodiacSeason.sign} Season is here`}
                </p>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: '16px' }}>{s.vibe}</span>
              </div>
            </div>
          );
        })()}

        <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 14 }}>

          {/* ── ECLIPSE SEASON BANNER ── */}
          {activeTab === 'today' && upcomingEclipse && (
            <div style={{ backgroundColor: '#1A1535', border: '1px solid rgba(155,142,196,0.2)', borderRadius: 14, padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{upcomingEclipse.type === 'solar' ? '🌑' : '🌕'}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: '#9B8EC4', marginBottom: 3, display: 'block' }}>ECLIPSE SEASON</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--c-heading)', margin: 0 }}>
                  {upcomingEclipse.daysUntil <= 0
                    ? `${upcomingEclipse.label} — happening now`
                    : upcomingEclipse.daysUntil === 1
                    ? `${upcomingEclipse.label} — tomorrow`
                    : `${upcomingEclipse.label} in ${upcomingEclipse.daysUntil} days`}
                </p>
                <span style={{ fontSize: 10.5, color: 'rgba(250,248,242,0.45)', marginTop: 2, lineHeight: '15px', display: 'block' }}>
                  Eclipses accelerate change. Avoid starting major new things — let the cosmic dust settle first.
                </span>
              </div>
            </div>
          )}

          {/* ── 1. NAVIGATOR BRIEFING — standalone dark card ── */}
          {activeTab === 'today' && forecast?.navigatorHeadline && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, #171428, #14122A, #0F1220)',
                borderRadius: 20, padding: 22, marginBottom: 16,
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
              }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-muted)' }}>{formatDateHeader()}</span>
                  {(() => {
                    const CONTENT_TYPE_META = {
                      love: { icon: '♡', label: 'LOVE DAY', color: '#E85090' },
                      career: { icon: '◆', label: 'CAREER DAY', color: '#5090E8' },
                      energy: { icon: '✦', label: 'ENERGY DAY', color: '#50C878' },
                      headsup: { icon: '⚡', label: 'HEADS UP', color: '#F5A623' },
                      greenlight: { icon: '●', label: 'GREEN LIGHT', color: '#4CAF50' },
                      reflection: { icon: '◎', label: 'REFLECTION', color: '#9B8EC4' },
                    };
                    let ct2 = forecast.contentType;
                    if (!ct2 && forecast.lifeAreas) {
                      const areas = [
                        { key: 'love', type: 'love' }, { key: 'career', type: 'career' },
                        { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' },
                        { key: 'social', type: 'greenlight' },
                      ];
                      const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                      if (top) ct2 = top.type;
                    }
                    const meta = ct2 ? CONTENT_TYPE_META[ct2] : null;
                    if (!meta) return null;
                    return (
                      <div style={{ backgroundColor: meta.color + '20', borderRadius: 6, padding: '3px 8px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: meta.color }} />
                        <span style={{ fontSize: 8, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: meta.color }}>{meta.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--c-heading)', lineHeight: '36px', margin: 0, marginBottom: 16, fontWeight: 400 }}>{forecast.navigatorHeadline}</h2>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {forecast.powerCosmic && (
                    <span style={{ backgroundColor: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.22)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 }}>✦ {forecast.powerCosmic}</span>
                  )}
                  <span style={{ backgroundColor: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.22)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 }}>{moonIcon} {moonPhase}</span>
                  {forecast.luckyStats && !isLateNight && (
                    <span style={{ backgroundColor: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.22)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 }}>#{forecast.luckyStats.number}</span>
                  )}
                  {forecast.luckyStats?.crystal && !isLateNight && (
                    <span style={{ backgroundColor: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.22)', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(200,168,75,0.9)', letterSpacing: 0.3 }}>✧ {forecast.luckyStats.crystal}</span>
                  )}
                </div>
              </div>

              {/* Summary + nudge + actions */}
              {forecast.navigatorSummary && (
                <p style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: '22.5px', marginBottom: 14 }}>{forecast.navigatorSummary}</p>
              )}

              {forecast.navigateToward && forecast.navigateToward.length > 0 && (
                <div style={{ backgroundColor: 'rgba(193,127,89,0.08)', border: '1px solid rgba(193,127,89,0.2)', borderRadius: 14, padding: 14, marginBottom: 16, borderLeft: '3px solid #C17F59' }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#C17F59', marginBottom: 6, display: 'block' }}>TODAY'S NUDGE</span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-text)', lineHeight: '22px', fontStyle: 'italic', margin: 0 }}>
                    {forecast.navigateToward[0].action}{forecast.navigateToward[0].reason ? ` — ${forecast.navigateToward[0].reason.toLowerCase()}` : ''}
                  </p>
                </div>
              )}

              {/* Navigate Toward / Around — order adapts to time of day */}
              {(() => {
                const towardSection = forecast.navigateToward && forecast.navigateToward.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#10B981', marginBottom: 10, display: 'block' }}>NAVIGATE TOWARD</span>
                    {forecast.navigateToward.map((item, i) => (
                      <div key={`toward-${i}`} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, color: '#10B981', marginTop: 1, fontWeight: 600 }}>→</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--c-text)', lineHeight: '18px', display: 'block' }}>{item.action}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: '16px', marginTop: 1, display: 'block' }}>{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
                const aroundSection = forecast.navigateAround && forecast.navigateAround.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#F59E0B', marginBottom: 10, display: 'block' }}>NAVIGATE AROUND</span>
                    {forecast.navigateAround.map((item, i) => (
                      <div key={`around-${i}`} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, color: '#F59E0B', marginTop: 1 }}>⊘</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--c-text)', lineHeight: '18px', display: 'block' }}>{item.action}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: '16px', marginTop: 1, display: 'block' }}>{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
                if (timeMode === 'evening' || timeMode === 'latenight') {
                  return <>{aroundSection}{towardSection}</>;
                }
                return <>{towardSection}{aroundSection}</>;
              })()}

              {/* Deep dive CTA */}
              <button
                onClick={() => setShowBriefing(true)}
                style={{
                  display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 6, padding: '12px 0', width: '100%',
                  backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 12,
                  border: 'none', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 14 }}>📖</span>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold }}>Your Full Reading</span>
                <span style={{ fontSize: 13, color: T.gold, opacity: 0.6 }}>→</span>
              </button>
            </>
          )}

          {/* Quick actions row */}
          {activeTab === 'today' && forecast?.navigatorHeadline && (
            <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => {
                  const msg = timeMode === 'latenight'
                    ? `I'm up late thinking about things. Based on today's energy (${forecast?.navigatorHeadline || 'current transits'}), can you help me process what I'm feeling?`
                    : timeMode === 'evening'
                    ? `I'm reflecting on today. The reading said "${forecast?.navigatorHeadline || 'today has been intense'}". How did that play out and what should I take from it?`
                    : `Tell me more about today's energy. "${forecast?.navigatorHeadline || ''}" — what does this mean for me specifically?`;
                  navigate('AskAI', { initialMessage: msg });
                }}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 0',
                  backgroundColor: 'rgba(200,168,75,0.06)',
                  borderRadius: 12, border: '1px solid rgba(200,168,75,0.12)', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13 }}>💬</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold }}>Ask Celestia</span>
              </button>
              {!isLateNight && (
                <button
                  onClick={async () => {
                    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                    if (navigator.share) {
                      try {
                        await navigator.share({ text: `${forecast?.navigatorHeadline || 'My daily insight'} — ${sunSign} Sun ✦ Celestia` });
                      } catch {}
                    }
                  }}
                  style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 16px',
                    backgroundColor: 'rgba(193,127,89,0.06)',
                    borderRadius: 12, border: '1px solid rgba(193,127,89,0.12)', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 13 }}>📸</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: '#C17F59' }}>Share</span>
                </button>
              )}
            </div>
          )}

          {/* Loading state */}
          {activeTab === 'today' && forecastLoading && !forecast?.navigatorHeadline && (
            <div style={{
              background: 'linear-gradient(135deg, #171428, #14122A, #0F1220)',
              borderRadius: 20, padding: '32px 22px', marginBottom: 16,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
            }}>
              <div className="spinner" style={{ width: 24, height: 24, border: `2px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, color: 'rgba(250,248,242,0.35)', marginTop: 10, textAlign: 'center' }}>Reading the stars…</span>
            </div>
          )}

          {/* Weekly/Monthly reading card */}
          {activeTab !== 'today' && (
            <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 16, boxShadow: '0 6px 28px rgba(0,0,0,0.1)' }}>
              <div style={{ background: 'linear-gradient(135deg, #171428, #14122A, #0F1220)', padding: '20px 21px 17px' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-muted)', display: 'block' }}>
                  {activeTab === 'weekly' ? 'THIS WEEK' : 'THIS MONTH'}
                </span>
                {forecastLoading ? (
                  <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ height: 14, backgroundColor: 'rgba(250,248,242,0.08)', borderRadius: 7, width: '80%' }} />
                    <div style={{ height: 14, backgroundColor: 'rgba(250,248,242,0.08)', borderRadius: 7, width: '60%' }} />
                  </div>
                ) : (
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', lineHeight: '28px', fontWeight: 400, margin: '8px 0 0' }}>{forecast?.header || (activeTab === 'weekly' ? 'Your Weekly Overview' : 'Your Monthly Overview')}</h2>
                )}
              </div>
              <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', padding: '17px 21px 19px' }}>
                {forecastLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                    <div style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '90%' }} />
                    <div style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '100%' }} />
                    <div style={{ height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, width: '75%' }} />
                  </div>
                ) : forecast ? (
                  <>
                    {forecast.mantra && (
                      <div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, borderLeft: `3px solid ${T.gold}` }}>
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14.5, color: '#8B6214', lineHeight: '21px', fontStyle: 'italic', margin: 0 }}>"{forecast.mantra}"</p>
                      </div>
                    )}
                    {paragraphs.map((p, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        {getParaLabels()[i] && (
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 4, display: 'block' }}>{getParaLabels()[i]}</span>
                        )}
                        <AstroText text={p} style={{ fontSize: 13.5, color: 'var(--c-text)', lineHeight: '22.5px', marginBottom: 6 }} />
                      </div>
                    ))}
                    {actionItems.length > 0 && (
                      <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, display: 'block' }}>KEY MOVES</span>
                        {actionItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: T.gold, marginTop: 2 }}>→</span>
                            <span style={{ fontSize: 13, color: 'var(--c-text)', lineHeight: '20px', flex: 1 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ── 4. LIFE AREA NAVIGATOR (today only) ── */}
          {activeTab === 'today' && <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 9, display: 'block' }}>LIFE AREA NAVIGATOR</span>}
          {activeTab === 'today' && (
            <div style={{ overflowX: 'auto', marginBottom: 16, WebkitOverflowScrolling: 'touch', marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 12, width: 'max-content' }}>
                {[
                  { key: 'love', icon: '♡', title: 'Love', subtitle: 'Relationships', color: '#E85090' },
                  { key: 'career', icon: '◆', title: 'Career', subtitle: 'Work & Money', color: '#5090E8' },
                  { key: 'vitality', icon: '✦', title: 'Vitality', subtitle: 'Energy & Rhythm', color: '#50C878' },
                  { key: 'growth', icon: '◎', title: 'Growth', subtitle: 'Learning & Wisdom', color: '#F59E0B' },
                  { key: 'social', icon: '✧', title: 'Social', subtitle: 'Communication', color: '#8B5CF6' },
                ].map((area) => {
                  const data = forecast?.lifeAreas?.[area.key];
                  return (
                    <button
                      key={area.key}
                      onClick={() => setLifeAreaModal(area.key)}
                      style={{
                        width: 260, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`,
                        borderRadius: 16, borderTop: `3px solid ${area.color}`, padding: 16,
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 20, color: area.color }}>{area.icon}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--c-text)', display: 'block' }}>{area.title}</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)' }}>{area.subtitle}</span>
                        </div>
                        <span style={{ backgroundColor: area.color + '18', borderRadius: 100, padding: '3px 10px', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, color: area.color, letterSpacing: 0.5 }}>
                          {data?.energy || 'Steady'}
                        </span>
                      </div>
                      {data?.planetaryReason && (
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: '16px', fontStyle: 'italic', margin: '0 0 10px' }}>{data.planetaryReason}</p>
                      )}
                      {data?.doItems && data.doItems.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {data.doItems.slice(0, 2).map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 12, color: area.color, marginTop: 1, fontWeight: 600 }}>→</span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-text)', lineHeight: '17px', flex: 1 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.avoidItems && data.avoidItems.length > 0 && !data.avoidItems[0]?.includes?.('Steady skies') && (
                        <div style={{ marginBottom: 8 }}>
                          {data.avoidItems.slice(0, 1).map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 11, color: '#F59E0B', marginTop: 1 }}>⊘</span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: '17px', flex: 1 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {data?.navigatorNote && (
                        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--c-text)', lineHeight: '18px', fontStyle: 'italic', margin: '0 0 10px' }}>"{data.navigatorNote}"</p>
                      )}
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12, color: area.color, letterSpacing: 0.3 }}>Deep Dive →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── MONDAY WEEKLY REPORT TEASE ── */}
          {activeTab === 'today' && !isPro && today.getDay() === 1 && (
            <button
              onClick={() => navigate('Paywall', { source: 'monday_weekly_tease' })}
              style={{ marginBottom: 14, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(200,168,75,0.15)', width: '100%', cursor: 'pointer', textAlign: 'left', padding: 0 }}
            >
              <div style={{ background: 'linear-gradient(135deg, #171428, #14122A, #0F1220)', padding: 18 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 8, display: 'block' }}>YOUR WEEK AHEAD</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-heading)', fontWeight: 400, margin: '0 0 6px' }}>Your weekly transit report is ready</h3>
                <p style={{ fontSize: 12, color: 'rgba(250,248,242,0.45)', lineHeight: '18px', margin: '0 0 12px' }}>See your love, career, and energy forecast for the full week — with specific days to watch and moves to make.</p>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                  <div style={{ height: 10, width: '80%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '60%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 4, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '70%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ backgroundColor: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 100, padding: '8px 20px', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold }}>See Your Week Ahead →</span>
                </div>
              </div>
            </button>
          )}

          {/* ── BIRTHDAY / SOLAR RETURN ── */}
          {activeTab === 'today' && (() => {
            if (!userProfile?.birthDate) return false;
            const parts = userProfile.birthDate.split('-');
            const birthMonth = parseInt(parts[1], 10);
            const birthDay = parseInt(parts[2], 10);
            const bDate = new Date(today.getFullYear(), birthMonth - 1, birthDay);
            const diff = Math.abs(today - bDate) / (1000 * 60 * 60 * 24);
            return diff <= 3;
          })() && (
            <button
              onClick={() => navigate('Reports')}
              style={{ marginBottom: 14, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(200,168,75,0.25)', width: '100%', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ background: 'linear-gradient(135deg, #1A1535, #201540, #14102A)', padding: 20, textAlign: 'center' }}>
                <span style={{ fontSize: 28, marginBottom: 8, display: 'block' }}>✦</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', textAlign: 'center', fontWeight: 400, margin: '0 0 4px' }}>
                  Happy Solar Return, {firstName} ✦
                </h3>
                <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', textAlign: 'center', lineHeight: '18px', maxWidth: 280, margin: '0 auto 14px' }}>
                  Your cosmic year resets. See what the stars have planned for your next chapter.
                </p>
                <span style={{ backgroundColor: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 100, padding: '8px 20px', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold, display: 'inline-block' }}>Read Your Year-Ahead Report →</span>
              </div>
            </button>
          )}

          {/* ── TODAY'S SKY ── */}
          {activeTab === 'today' && (
            <button
              onClick={() => navigate('TodaysSky')}
              style={{
                marginBottom: 16, borderRadius: 20, overflow: 'hidden', width: '100%', padding: 0,
                boxShadow: '0 6px 14px rgba(10,8,24,0.25)', cursor: 'pointer', border: 'none',
              }}
            >
              <div style={{
                background: 'linear-gradient(135deg, #0F0C24 0%, #161038 35%, #0E1628 70%, #0C1220 100%)',
                padding: 20, position: 'relative', overflow: 'hidden', textAlign: 'left',
              }}>
                <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(100,80,200,0.08)', right: -40, top: -50, pointerEvents: 'none' }} />
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'rgba(200,168,75,0.45)' }}>TODAY'S SKY</span>
                  <div style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(200,168,75,0.1)', border: '1px solid rgba(200,168,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, color: T.gold }}>→</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 36 }}>{moonIcon}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', lineHeight: '28px', margin: 0, fontWeight: 400 }}>{moonData?.phaseName || 'Moon'}</h3>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2, display: 'block' }}>in {moonData?.sign || '—'}{moonData?.illumination != null ? ` · ${moonData.illumination.toFixed(0)}% illuminated` : ''}</span>
                  </div>
                </div>
                <div style={{ height: 1, backgroundColor: 'var(--c-card-bg-alpha)', marginBottom: 14 }} />
                <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                  {forecast?.powerCosmic && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--c-card-border-alpha)' }}>
                      <span style={{ fontSize: 16, color: T.gold }}>✦</span>
                      <div>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', color: 'rgba(250,248,242,0.35)', letterSpacing: 0.5, display: 'block' }}>Cosmic Energy</span>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'rgba(250,248,242,0.75)', marginTop: 1, display: 'block' }}>{forecast.powerCosmic}</span>
                      </div>
                    </div>
                  )}
                  {forecast?.lifeAreas && (() => {
                    const areas = [
                      { key: 'love', icon: '♡', label: 'Love', color: '#E85090' },
                      { key: 'career', icon: '◆', label: 'Career', color: '#5090E8' },
                      { key: 'vitality', icon: '✦', label: 'Vitality', color: '#50C878' },
                      { key: 'growth', icon: '◎', label: 'Growth', color: '#F59E0B' },
                      { key: 'social', icon: '✧', label: 'Social', color: '#8B5CF6' },
                    ];
                    const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                    if (!top) return null;
                    return (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: '10px 12px', border: '1px solid var(--c-card-border-alpha)' }}>
                        <span style={{ fontSize: 16, color: top.color }}>{top.icon}</span>
                        <div>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', color: 'rgba(250,248,242,0.35)', letterSpacing: 0.5, display: 'block' }}>Most Active</span>
                          <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'rgba(250,248,242,0.75)', marginTop: 1, display: 'block' }}>{top.label} · {forecast.lifeAreas[top.key].energy}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {cosmicSeason && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 12, marginBottom: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)' }}>{cosmicSeason.description}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold }}>{cosmicSeason.progress}%</span>
                    </div>
                    <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: 3, backgroundColor: T.gold, borderRadius: 2, width: `${cosmicSeason.progress}%` }} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold }}>Explore your full sky map</span>
                  <span style={{ fontSize: 13, color: T.gold }}>→</span>
                </div>
              </div>
            </button>
          )}

          {/* ── PREVIOUSLY ON ── */}
          {activeTab === 'today' && narrativeCtx?.yesterday && (narrativeCtx.yesterday.forecastHeader || narrativeCtx.yesterday.journalText) && (
            <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: 6, display: 'block' }}>PREVIOUSLY</span>
              <p style={{ fontSize: 14, color: 'var(--c-text)', fontFamily: 'var(--font-serif)', lineHeight: '20px', margin: 0 }}>
                {narrativeCtx.yesterday.forecastHeader ? `"${narrativeCtx.yesterday.forecastHeader}"` : ''}
                {narrativeCtx.yesterday.forecastHeader && narrativeCtx.yesterday.journalText ? ' — ' : ''}
                {narrativeCtx.yesterday.journalText ? `you wrote about ${narrativeCtx.yesterday.journalText.substring(0, 60).toLowerCase()}${narrativeCtx.yesterday.journalText.length > 60 ? '...' : ''}` : ''}
                {narrativeCtx.yesterday.journalMood ? ` (mood: ${narrativeCtx.yesterday.journalMood})` : ''}
              </p>
            </div>
          )}

          {/* ── COSMIC JOURNAL ── */}
          {activeTab === 'today' && (
            <button
              onClick={() => navigate('Journal', { mantra: forecast?.mantra })}
              style={{
                backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`,
                borderRadius: 18, padding: '16px 18px', marginBottom: 15,
                width: '100%', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)' }}>YOUR COSMIC JOURNAL</span>
                <span style={{
                  backgroundColor: journalSaved ? 'rgba(76,175,80,0.15)' : 'var(--c-card-bg-alpha)',
                  borderRadius: 100, padding: '3px 10px', fontSize: 10, color: '#6B6050',
                }}>{journalSaved ? 'Saved' : 'Today'}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-heading)', lineHeight: '22px', fontStyle: 'italic', margin: '0 0 12px' }}>
                {forecast?.mantra
                  ? `"${forecast.mantra}"`
                  : '"What is the universe trying to teach you right now?"'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)' }}>{journalSaved ? '📖 Read Today\'s Page' : '✍ Write Today\'s Page'}</span>
                <span style={{ fontSize: 14, color: T.gold }}>→</span>
              </div>
            </button>
          )}

          {/* ── EVENING REFLECTION ── */}
          {activeTab === 'today' && isEvening && (
            <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 16, padding: 16, marginBottom: 15 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 8, display: 'block' }}>EVENING REFLECTION</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-heading)', fontStyle: 'italic', lineHeight: '22px', margin: '0 0 12px' }}>How did your day match the navigator's reading?</p>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 6 }}>
                {[
                  { emoji: '😔', label: 'Off', value: 1 },
                  { emoji: '😐', label: 'Meh', value: 2 },
                  { emoji: '🙂', label: 'Okay', value: 3 },
                  { emoji: '😊', label: 'Good', value: 4 },
                  { emoji: '✨', label: 'Spot on', value: 5 },
                ].map(m => (
                  <button key={m.value}
                    onClick={() => saveEveningMood(m.value)}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', borderRadius: 12,
                      backgroundColor: eveningMood === m.value ? 'rgba(200,168,75,0.14)' : 'rgba(200,168,75,0.06)',
                      border: eveningMood === m.value ? `1px solid ${T.gold}` : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 20, marginBottom: 2 }}>{m.emoji}</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 500, color: eveningMood === m.value ? T.gold : T.stone }}>{m.label}</span>
                  </button>
                ))}
              </div>
              {eveningMood && (
                <p style={{ fontSize: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--c-text-secondary)', textAlign: 'center', margin: '0 0 10px' }}>
                  {eveningMood >= 4 ? 'The cosmos aligned today.' : eveningMood >= 3 ? 'Noted. Tomorrow brings fresh energy.' : 'Some days are like that. Tomorrow shifts.'}
                </p>
              )}
              <button
                onClick={() => navigate('Journal', { mantra: forecast?.mantra })}
                style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: '10px 0', width: '100%', textAlign: 'center', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-text)' }}>Reflect in Journal →</span>
              </button>
            </div>
          )}

          {/* ── SUNDAY WEEK REFLECTION ── */}
          {activeTab === 'today' && today.getDay() === 0 && (
            <div style={{ backgroundColor: 'rgba(155,142,196,0.1)', border: '1px solid rgba(155,142,196,0.2)', borderRadius: 16, padding: 18, marginBottom: 15 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#9B8EC4', marginBottom: 6, display: 'block' }}>WEEK IN REVIEW</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-heading)', fontWeight: 400, margin: '0 0 6px' }}>What did this week teach you?</h3>
              <p style={{ fontSize: 12.5, color: 'var(--c-text-secondary)', lineHeight: '19px', margin: 0 }}>
                {narrativeCtx?.season
                  ? `You're ${narrativeCtx.season.progress}% through your ${narrativeCtx.season.description?.toLowerCase() || 'current cosmic season'}. Take a moment to notice how far you've come.`
                  : 'Sunday is for looking back before moving forward. What patterns showed up this week?'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => navigate('Journal', { mantra: 'What did this week teach me?' })}
                  style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 10, padding: '10px 0', cursor: 'pointer', textAlign: 'center' }}
                >
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-text)' }}>Reflect in Journal →</span>
                </button>
                <button
                  onClick={() => navigate('AskAI', { initialMessage: "Help me reflect on my week. What patterns should I notice based on what's been happening in my chart?" })}
                  style={{ flex: 1, backgroundColor: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: 10, padding: '10px 0', cursor: 'pointer', textAlign: 'center' }}
                >
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold }}>Talk to Celestia →</span>
                </button>
              </div>
              {!isPro && (
                <button
                  onClick={() => navigate('Paywall', { source: 'sunday_next_week' })}
                  style={{ marginTop: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-text-secondary)' }}>See what's coming next week →</span>
                  <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>🔒 Premium</span>
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ─── EXTRAS & ENGAGEMENT                      ─── */}
          {/* ═══════════════════════════════════════════════ */}

          {activeTab === 'today' && (todayCosmicLine || todayUnlock || monthlyRecap || questData?.quests || nextBadge || cosmicWhisper) && (
            <div style={{ marginTop: 12, marginBottom: 4, paddingTop: 14, borderTop: `0.5px solid ${'var(--c-divider)'}` }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)' }}>YOUR COSMIC STORY</span>
            </div>
          )}

          {/* ── TODAY'S COSMIC ALERT ── */}
          {activeTab === 'today' && todayCosmicLine && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'var(--c-bg)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.gold, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold, marginBottom: 3, display: 'block' }}>{todayCosmicLine.title}</span>
                <span style={{ fontSize: 12.5, color: 'rgba(250,248,242,0.7)', lineHeight: '18px' }}>{todayCosmicLine.body}</span>
              </div>
            </div>
          )}

          {/* ── NEW INSIGHT UNLOCKED ── */}
          {activeTab === 'today' && todayUnlock && !isLateNight && (
            <button
              onClick={() => {
                setTodayUnlock(null);
                navigate('Chart');
              }}
              style={{ marginBottom: 12, borderRadius: 16, overflow: 'hidden', width: '100%', padding: 0, border: 'none', cursor: 'pointer' }}
            >
              <div style={{ background: 'linear-gradient(135deg, #1A1060, #0E0E22)', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, textAlign: 'left' }}>
                <span style={{ fontSize: 28, color: T.gold }}>✦</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 3, display: 'block' }}>NEW INSIGHT UNLOCKED</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', marginBottom: 2, display: 'block' }}>{todayUnlock.planet}</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: '16px' }}>Day {todayUnlock.dayNum} — {UNLOCK_NARRATIVES[todayUnlock.planet] || 'A new chapter unfolds'}</span>
                </div>
                <span style={{ fontSize: 18, color: T.gold }}>→</span>
              </div>
            </button>
          )}

          {/* ── MONTHLY RECAP ── */}
          {activeTab === 'today' && monthlyRecap && today.getDate() <= 3 && (
            <div style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden' }}>
              <MonthlyRecapCard
                recap={monthlyRecap}
                month={today.getMonth() === 0 ? 12 : today.getMonth()}
                year={today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()}
                streakDays={streakData?.total_check_ins || 0}
                journalEntries={journalCount}
                sunSign={userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign}
              />
            </div>
          )}

          {/* ── DAILY QUESTS ── */}
          {activeTab === 'today' && questData?.quests && !isLateNight && (
            <QuestCard quests={questData.quests} allComplete={questData.allComplete} weeklyCount={questData.weeklyCount || 0} />
          )}

          {/* ── NEXT BADGE PROGRESS ── */}
          {activeTab === 'today' && nextBadge && !isLateNight && (
            <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid rgba(200,168,75,0.15)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 24 }}>{nextBadge.badge.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 1, display: 'block' }}>YOUR NEXT CHAPTER</span>
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-heading)' }}>{nextBadge.badge.name}</span>
                </div>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold }}>{nextBadge.current}/{nextBadge.target}</span>
              </div>
              <div style={{ width: '100%', height: 5, borderRadius: 3, backgroundColor: 'var(--c-card-bg-alpha)', overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', borderRadius: 3, backgroundColor: T.gold, width: `${(nextBadge.progress * 100).toFixed(0)}%` }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>{nextBadge.remaining} more to unlock this chapter</span>
            </div>
          )}

          {/* ── COSMIC WHISPER ── */}
          {activeTab === 'today' && cosmicWhisper && (
            <button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({ text: `✧ ${cosmicWhisper}\n\n— A Cosmic Whisper from Celestia${whisperRarity ? ` (${whisperRarity})` : ''}` });
                  } catch {}
                }
              }}
              style={{
                backgroundColor: whisperRarity ? 'rgba(160,80,224,0.06)' : 'rgba(200,168,75,0.08)',
                border: `1px solid ${whisperRarity ? 'rgba(160,80,224,0.2)' : 'rgba(200,168,75,0.12)'}`,
                borderRadius: 14, padding: 14, marginBottom: 12, width: '100%', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'rgba(200,168,75,0.6)', marginBottom: 6 }}>COSMIC WHISPER</span>
                <span style={{ fontSize: 9, color: 'rgba(200,168,75,0.4)', fontStyle: 'italic' }}>A rare message from the cosmos</span>
                {whisperRarity && (
                  <span style={{ backgroundColor: 'rgba(160,80,224,0.15)', borderRadius: 6, padding: '2px 6px', fontSize: 8, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1, color: '#8040C0' }}>{whisperRarity.toUpperCase()}</span>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--c-gold)', lineHeight: '21px', fontStyle: 'italic', margin: '6px 0 0' }}>✧ {cosmicWhisper}</p>
              {!isLateNight && <span style={{ fontSize: 10, color: 'rgba(200,168,75,0.4)', marginTop: 6, display: 'block' }}>Tap to share ↗</span>}
            </button>
          )}

          {/* ── TIME-ADAPTIVE PROMPTS ── */}
          {activeTab === 'today' && timeMode === 'morning' && (
            <button
              onClick={() => navigate('AskAI', { initialMessage: "What should I focus on today?" })}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 14, padding: 14, marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>☉</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)', marginBottom: 1, display: 'block' }}>Start your day with intention</span>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>Ask Celestia what to focus on today →</span>
              </div>
            </button>
          )}
          {activeTab === 'today' && timeMode === 'afternoon' && (
            <button
              onClick={() => navigate('AskAI')}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 14, padding: 14, marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>☿</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)', marginBottom: 1, display: 'block' }}>Quick cosmic check-in</span>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>Anything on your mind? →</span>
              </div>
            </button>
          )}
          {activeTab === 'today' && timeMode === 'evening' && !isLateNight && (
            <button
              onClick={() => navigate('AskAI', { initialMessage: "I'm winding down. What should I reflect on from today?" })}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(155,142,196,0.1)', border: '1px solid rgba(155,142,196,0.2)', borderRadius: 14, padding: 14, marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>☾</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)', marginBottom: 1, display: 'block' }}>Evening wind-down</span>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>Process your day with Celestia →</span>
              </div>
            </button>
          )}
          {activeTab === 'today' && isLateNight && (
            <div>
              <button
                onClick={() => navigate('AskAI', { initialMessage: "I can't sleep and I'm feeling a lot right now. Can you help me make sense of it?" })}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 14, padding: 14, marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>☽</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)', marginBottom: 1, display: 'block' }}>Can't sleep?</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>Talk it through with Celestia →</span>
                </div>
              </button>
              <button
                onClick={() => navigate('AskAI', { initialMessage: "Why am I feeling off tonight? What's happening in my chart right now?" })}
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 14, padding: 14, marginBottom: 14, width: '100%', cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>✧</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text)', marginBottom: 1, display: 'block' }}>Feeling off?</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>Let's look at what's happening in your chart →</span>
                </div>
              </button>
            </div>
          )}

          {/* ── PROMO (hidden in latenight) ── */}
          {timeMode !== 'latenight' && (
            <button
              onClick={() => navigate('Reports')}
              style={{ width: '100%', border: 'none', cursor: 'pointer', padding: 0, borderRadius: 20, overflow: 'hidden', marginBottom: 15 }}
            >
              <div style={{ background: 'linear-gradient(135deg, #1A1530, #14112A, #101320)', borderRadius: 20, padding: '19px 20px' }}>
                <span style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(200,168,75,0.58)', marginBottom: 5, display: 'block' }}>REPORTS</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'white', fontWeight: 400, margin: '0 0 3px' }}>Your Cosmic Deep Dives</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', margin: '0 0 14px' }}>Love, Career, Purpose — chapters written for this moment in your journey</p>
                <span style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 11, padding: '8px 15px', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'white', display: 'inline-block' }}>Open Your Reports →</span>
              </div>
            </button>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>

      {/* ── DEEP DIVE MODAL ── */}
      {showBriefing && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--c-bg)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ paddingBottom: 50 }}>
            <div style={{
              background: 'linear-gradient(135deg, #171428, #14122A, #0F1220)',
              paddingTop: 56, paddingBottom: 24, paddingLeft: 22, paddingRight: 22,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: 2, color: 'var(--c-text-muted)' }}>{formatDateHeader().toUpperCase()}</span>
                <button onClick={() => setShowBriefing(false)} style={{ fontSize: 18, color: 'var(--c-text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
              {(() => {
                const CT_EMOJI = { love: '💕', career: '💼', energy: '🔋', headsup: '⚡', greenlight: '🟢', reflection: '🌙' };
                let ct3 = forecast?.contentType;
                if (!ct3 && forecast?.lifeAreas) {
                  const areas = [{ key: 'love', type: 'love' }, { key: 'career', type: 'career' }, { key: 'vitality', type: 'energy' }, { key: 'growth', type: 'reflection' }, { key: 'social', type: 'greenlight' }];
                  const top = areas.filter(a => forecast.lifeAreas[a.key]).sort((a, b) => (forecast.lifeAreas[b.key].intensity || 3) - (forecast.lifeAreas[a.key].intensity || 3))[0];
                  if (top) ct3 = top.type;
                }
                const emoji = CT_EMOJI[ct3] || '✦';
                const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                const CT_LABELS = { love: 'LOVE DAY', career: 'CAREER DAY', energy: 'ENERGY DAY', headsup: 'HEADS UP', greenlight: 'GREEN LIGHT', reflection: 'REFLECTION' };
                const dayLabel = CT_LABELS[ct3] || 'YOUR READING';
                return (
                  <>
                    <span style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'rgba(200,168,75,0.45)', marginBottom: 10 }}>{PLANET_GLYPHS.Sun || '☉'} {sunSign.toUpperCase()} · {dayLabel}</span>
                  </>
                );
              })()}
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--c-heading)', lineHeight: '33px', textAlign: 'center', fontWeight: 400, margin: '0 0 8px' }}>{forecast?.navigatorHeadline}</h2>
              {forecast?.navigatorSummary && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'rgba(250,248,242,0.55)', lineHeight: '21px', textAlign: 'center', margin: '0 0 14px' }}>{forecast.navigatorSummary}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ padding: '2px 8px', fontSize: 11, color: 'rgba(250,248,242,0.55)', fontFamily: 'var(--font-sans)' }}>{moonIcon} {moonPhase}</span>
                {forecast?.powerCosmic && (
                  <span style={{ padding: '2px 8px', fontSize: 11, color: 'rgba(250,248,242,0.55)', fontFamily: 'var(--font-sans)' }}>✦ {forecast.powerCosmic}</span>
                )}
              </div>
            </div>

            {paragraphs.length > 0 && (
              <div style={{ padding: '20px 22px 0' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 12, display: 'block' }}>YOUR READING</span>
                {paragraphs.map((p, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    {getParaLabels()[i] && <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 5, display: 'block' }}>{getParaLabels()[i]}</span>}
                    <AstroText text={p} style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: '23px' }} />
                  </div>
                ))}
              </div>
            )}

            {forecast?.planetInfluences && forecast.planetInfluences.length > 0 && (
              <div style={{ padding: '20px 22px 0' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 12, display: 'block' }}>WHAT'S DRIVING TODAY</span>
                {forecast.planetInfluences.map((inf, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 8, border: `1px solid ${'var(--c-border)'}` }}>
                    <span style={{ fontSize: 22, color: T.gold, marginTop: 2 }}>{inf.glyph}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: 'var(--c-heading)', marginBottom: 2, display: 'block' }}>{inf.tag}</span>
                      <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: '17px' }}>{inf.effect}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {forecast?.lifeAreas && (
              <div style={{ padding: '20px 22px 0' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 12, display: 'block' }}>LIFE AREAS</span>
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
                    <div key={area.key} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 16, marginBottom: 12, overflow: 'hidden', border: `1px solid ${'var(--c-border)'}` }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderLeft: `4px solid ${area.color}` }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <span style={{ fontSize: 20, color: area.color }}>{area.icon}</span>
                          <div>
                            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: 'var(--c-heading)', display: 'block' }}>{area.title}</span>
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 1 }}>{area.sub}</span>
                          </div>
                        </div>
                        <span style={{ borderRadius: 10, padding: '4px 12px', backgroundColor: area.color + '15', fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: area.color }}>{data.energy || 'Steady'}</span>
                      </div>
                      <div style={{ padding: '0 16px 10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--c-text-secondary)', width: 52 }}>Intensity</span>
                          <div style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: 4, borderRadius: 2, width: `${intensityVal * 10}%`, backgroundColor: area.color }} />
                          </div>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 11, color: area.color, width: 30, textAlign: 'right' }}>{intensityVal}/10</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                          {data.archetype && <span style={{ borderRadius: 8, padding: '3px 10px', backgroundColor: area.color + '12', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, color: area.color }}>{data.archetype}</span>}
                          {data.drivingPlanet && <span style={{ borderRadius: 8, padding: '3px 10px', backgroundColor: 'var(--c-card-bg-alpha)', fontSize: 10, fontFamily: 'var(--font-sans)', color: 'var(--c-text-secondary)' }}>{data.drivingPlanet}</span>}
                        </div>
                      </div>
                      {data.planetaryReason && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: '17px', padding: '0 16px', margin: '0 0 10px' }}>{data.planetaryReason}</p>}
                      {data.horoscope && (
                        <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, margin: '0 16px 12px', padding: 14 }}>
                          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-heading)', lineHeight: '20px', margin: 0 }}>{data.horoscope}</p>
                        </div>
                      )}
                      {data.doItems && data.doItems.length > 0 && (
                        <div style={{ padding: '0 16px', marginBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: 1, color: area.color, marginBottom: 6, display: 'block' }}>NAVIGATE TOWARD</span>
                          {data.doItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 13, color: area.color, marginTop: 1 }}>→</span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-heading)', lineHeight: '18px', flex: 1 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {data.avoidItems && data.avoidItems.length > 0 && !data.avoidItems[0]?.includes?.('Steady skies') && (
                        <div style={{ padding: '0 16px', marginBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, color: '#D97706', letterSpacing: 1, marginBottom: 6, display: 'block' }}>NAVIGATE AROUND</span>
                          {data.avoidItems.map((item, i) => (
                            <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 5, alignItems: 'flex-start' }}>
                              <span style={{ fontSize: 12, color: '#D97706', marginTop: 1 }}>⊘</span>
                              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: '18px', flex: 1 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {data.timing && (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, padding: '0 16px', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>◷</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: '17px', flex: 1 }}>{data.timing}</span>
                        </div>
                      )}
                      {data.ritual && (
                        <div style={{ borderLeft: `3px solid ${area.color}`, margin: '0 16px 10px', paddingLeft: 12, paddingTop: 8, paddingBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: area.color, marginBottom: 4, display: 'block' }}>TODAY'S PRACTICE</span>
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--c-heading)', lineHeight: '18px' }}>{data.ritual}</span>
                        </div>
                      )}
                      {data.affirmation && (
                        <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, margin: '0 16px 10px', padding: 12, textAlign: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: T.gold, lineHeight: '20px' }}>"{data.affirmation}"</span>
                        </div>
                      )}
                      {data.navigatorNote && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--c-text-secondary)', fontStyle: 'italic', padding: '0 16px', paddingBottom: 14, lineHeight: '16px', margin: 0 }}>— {data.navigatorNote}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            {actionItems.length > 0 && (
              <div style={{ padding: '20px 22px 0' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 12, display: 'block' }}>POWER MOVES</span>
                <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 16, border: `1px solid ${'var(--c-border)'}` }}>
                  {actionItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-heading)' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--c-text)', flex: 1, lineHeight: '18px' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {forecast?.dailyRitual && (
              <div style={{ padding: '20px 22px 0' }}>
                <div style={{ backgroundColor: 'rgba(160,128,224,0.08)', borderRadius: 16, padding: 18, borderLeft: '3px solid #A080E0' }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#A080E0', marginBottom: 8, display: 'block' }}>TODAY'S RITUAL</span>
                  <span style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: '21px' }}>✧ {forecast.dailyRitual}</span>
                </div>
              </div>
            )}

            <div style={{ padding: '20px 22px 0' }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 12, display: 'block' }}>COSMIC STATS</span>
              <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 16, border: `1px solid ${'var(--c-border)'}` }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Moon</span>
                  <span style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{moonIcon} {moonPhase} in {moonSign}</span>
                </div>
                <div style={{ height: 0.5, backgroundColor: 'var(--c-card-bg-alpha)' }} />
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Energy</span>
                  <span style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{forecast?.powerCosmic || 'Balanced'}</span>
                </div>
                {forecast?.luckyStats && (
                  <>
                    <div style={{ height: 0.5, backgroundColor: 'var(--c-card-bg-alpha)' }} />
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Power Number</span>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-heading)' }}>{forecast.luckyStats.number}</span>
                    </div>
                    <div style={{ height: 0.5, backgroundColor: 'var(--c-card-bg-alpha)' }} />
                    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Power Color</span>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {forecast.luckyStats.colorHex && <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: forecast.luckyStats.colorHex }} />}
                        <span style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>{forecast.luckyStats.color}</span>
                      </div>
                    </div>
                    {forecast.luckyStats.crystal && (
                      <>
                        <div style={{ height: 0.5, backgroundColor: 'var(--c-card-bg-alpha)' }} />
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                          <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Crystal</span>
                          <span style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>✧ {forecast.luckyStats.crystal}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {forecast?.mantra && (
              <div style={{ padding: '20px 22px 0' }}>
                <div style={{ textAlign: 'center', padding: 24, backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 16, border: '1px solid rgba(200,168,75,0.15)' }}>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 10, display: 'block' }}>TODAY'S MANTRA</span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--c-heading)', textAlign: 'center', padding: '0 28px', lineHeight: '25px', margin: 0 }}>"{forecast.mantra}"</p>
                </div>
              </div>
            )}

            {forecast?.viralInsight && (
              <div style={{ padding: '20px 22px 0', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
                    if (navigator.share) {
                      navigator.share({ text: `✦ ${forecast.viralInsight}\n\n— Celestia (${sunSign} Sun)` }).catch(() => {});
                    }
                  }}
                  style={{ backgroundColor: 'var(--c-bg)', borderRadius: 16, padding: 20, textAlign: 'center', width: '100%', border: 'none', cursor: 'pointer' }}
                >
                  <p style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500, textAlign: 'center', lineHeight: '21px', margin: '0 0 10px' }}>✦ {forecast.viralInsight}</p>
                  <span style={{ fontSize: 11, color: 'rgba(200,168,75,0.7)', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>Share this insight ↗</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIFE AREA DEEP DIVE MODAL ── */}
      {lifeAreaModal && (() => {
        const meta = LIFE_AREA_META[lifeAreaModal];
        const areaData = forecast?.lifeAreas?.[lifeAreaModal];
        if (!meta) return null;
        const intensityVal = Math.min(10, Math.max(1, areaData?.intensity || 3));
        const relatedHoroscope = lifeAreaModal === 'love' ? forecast?.loveHoroscope : lifeAreaModal === 'career' ? forecast?.careerHoroscope : null;
        const relatedArchetype = lifeAreaModal === 'love' ? forecast?.loveArchetype : lifeAreaModal === 'career' ? forecast?.careerArchetype : null;
        const relatedActions = lifeAreaModal === 'love' ? forecast?.loveActions : lifeAreaModal === 'career' ? forecast?.careerActions : null;
        const relatedVibe = lifeAreaModal === 'love' ? forecast?.loveVibe : lifeAreaModal === 'career' ? forecast?.careerVibe : null;
        const careerPower = lifeAreaModal === 'career' ? forecast?.careerPowerSource : null;
        const wealthFlow = lifeAreaModal === 'career' ? forecast?.wealthFlow : null;
        const marketTiming = lifeAreaModal === 'career' ? forecast?.marketTiming : null;

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--c-bg)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ paddingBottom: 50 }}>
              <div style={{
                background: linearGradient(meta.gradient),
                paddingTop: 56, paddingLeft: 22, paddingRight: 22, paddingBottom: 24,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, letterSpacing: 2, color: 'var(--c-text-muted)' }}>{formatDateHeader().toUpperCase()}</span>
                  <button onClick={() => setLifeAreaModal(null)} style={{ fontSize: 18, color: 'var(--c-text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
                <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: meta.color + '18', boxShadow: `0 0 24px ${meta.color}60` }} />
                  <div style={{ width: 64, height: 64, borderRadius: 32, border: `1.5px solid ${meta.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--c-card-bg-alpha)' }}>
                    <span style={{ fontSize: 30, color: meta.color }}>{meta.icon}</span>
                  </div>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--c-heading)', textAlign: 'center', letterSpacing: 0.3, fontWeight: 400, margin: '0 0 4px' }}>{meta.title}</h2>
                <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 18, letterSpacing: 1, fontFamily: 'var(--font-sans)' }}>{meta.sub}</span>
                <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 16, padding: '12px 16px', width: '100%', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{ borderRadius: 10, padding: '5px 14px', backgroundColor: meta.color + '25', fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 700, color: meta.color }}>{areaData?.energy || 'Steady'}</span>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 10, color: 'rgba(250,248,242,0.35)', fontFamily: 'var(--font-sans)', width: 48 }}>Intensity</span>
                      <div style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: 4, borderRadius: 2, width: `${intensityVal * 10}%`, backgroundColor: meta.color }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 700, color: meta.color, width: 28, textAlign: 'right' }}>{intensityVal}/10</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {(areaData?.archetype || relatedArchetype) && <span style={{ borderRadius: 10, padding: '4px 12px', border: `1px solid ${meta.color}30`, fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: meta.color }}>{areaData?.archetype || relatedArchetype}</span>}
                    {areaData?.drivingPlanet && <span style={{ borderRadius: 10, padding: '4px 12px', border: '1px solid rgba(255,255,255,0.15)', fontSize: 11, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-sans)' }}>{areaData.drivingPlanet}</span>}
                  </div>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                {areaData?.planetaryReason && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text-secondary)', lineHeight: '19px', fontStyle: 'italic', margin: '0 0 16px' }}>{areaData.planetaryReason}</p>}
                {(areaData?.horoscope || relatedHoroscope) && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${'var(--c-border)'}` }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: 1.2, color: 'var(--c-text-secondary)', marginBottom: 10, display: 'block' }}>YOUR READING</span>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '23px', margin: 0 }}>{areaData?.horoscope || ''}</p>
                    {relatedHoroscope && relatedHoroscope !== areaData?.horoscope && <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '23px', margin: '10px 0 0' }}>{relatedHoroscope}</p>}
                  </div>
                )}
                {relatedVibe && (
                  <div style={{ borderLeft: `3px solid ${meta.color}`, paddingLeft: 14, marginBottom: 16, paddingTop: 4, paddingBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: meta.color, marginBottom: 4, display: 'block' }}>TODAY'S VIBE</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '22px' }}>{relatedVibe}</span>
                  </div>
                )}
                {areaData?.doItems && areaData.doItems.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: 1.2, color: meta.color, marginBottom: 10, display: 'block' }}>NAVIGATE TOWARD</span>
                    {areaData.doItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.color, marginTop: 6 }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '20px', flex: 1 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {relatedActions && relatedActions.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: 1.2, color: meta.color, marginBottom: 10, display: 'block' }}>POWER ACTIONS</span>
                    {relatedActions.map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, color: meta.color, marginTop: 1 }}>→</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '20px', flex: 1 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {areaData?.avoidItems && areaData.avoidItems.length > 0 && !areaData.avoidItems[0]?.includes?.('Steady skies') && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 10, letterSpacing: 1.2, color: '#D97706', marginBottom: 10, display: 'block' }}>NAVIGATE AROUND</span>
                    {areaData.avoidItems.map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, color: '#D97706', marginTop: 2 }}>⊘</span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text-secondary)', lineHeight: '20px', flex: 1 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(careerPower || wealthFlow || marketTiming) && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 16, marginBottom: 16, border: `1px solid ${'var(--c-border)'}` }}>
                    {careerPower && <div style={{ marginBottom: 12 }}><span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: T.gold, marginBottom: 4, display: 'block' }}>POWER SOURCE</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text)', lineHeight: '20px' }}>{careerPower}</span></div>}
                    {wealthFlow && <div style={{ marginBottom: 12 }}><span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: T.gold, marginBottom: 4, display: 'block' }}>WEALTH FLOW</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text)', lineHeight: '20px' }}>{wealthFlow}</span></div>}
                    {marketTiming && <div style={{ marginBottom: 12 }}><span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: T.gold, marginBottom: 4, display: 'block' }}>TIMING</span><span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text)', lineHeight: '20px' }}>{marketTiming}</span></div>}
                  </div>
                )}
                {areaData?.timing && (
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: 16, color: 'var(--c-text-secondary)', marginTop: 2 }}>◷</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: 'var(--c-text-secondary)', marginBottom: 3, display: 'block' }}>BEST WINDOW</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text)', lineHeight: '19px' }}>{areaData.timing}</span>
                    </div>
                  </div>
                )}
                {areaData?.ritual && (
                  <div style={{ borderLeft: `3px solid ${meta.color}`, paddingLeft: 14, marginBottom: 16, paddingTop: 6, paddingBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 9, letterSpacing: 1.2, color: meta.color, marginBottom: 5, display: 'block' }}>TODAY'S PRACTICE</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text)', lineHeight: '22px' }}>{areaData.ritual}</span>
                  </div>
                )}
                {areaData?.affirmation && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 18, marginBottom: 16, textAlign: 'center', border: `1px solid ${'var(--c-border)'}` }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: T.gold, lineHeight: '24px' }}>"{areaData.affirmation}"</span>
                  </div>
                )}
                {areaData?.navigatorNote && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--c-text-secondary)', fontStyle: 'italic', lineHeight: '20px', margin: 0 }}>— {areaData.navigatorNote}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    const areaMessages = {
                      love: 'Tell me more about my love and relationship energy today. What should I focus on based on my chart and current transits?',
                      career: 'What does my chart say about career opportunities right now? How can I make the most of today\'s energy?',
                      vitality: 'How should I manage my energy and wellness today? What do the transits suggest for my physical and mental rhythm?',
                      growth: 'What growth lessons is the universe showing me right now? How can I best use this energy for inner transformation?',
                      social: 'Tell me about my social and communication energy today. What connections should I nurture based on my chart?',
                    };
                    const msg = areaMessages[lifeAreaModal] || `Tell me more about my ${meta.title.toLowerCase()} energy today.`;
                    setLifeAreaModal(null);
                    setTimeout(() => navigate('AskAI', { initialMessage: msg }), 300);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    marginTop: 8, marginBottom: 12, padding: '14px 0', width: '100%',
                    backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 12,
                    border: '1px solid rgba(200,168,75,0.18)', cursor: 'pointer',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14, color: T.gold }}>Ask Celestia about your {lifeAreaModal} energy today</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 15, color: T.gold }}>{' →'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── STREAK DETAIL MODAL ── */}
      {showStreakModal && (
        <div onClick={() => setShowStreakModal(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--c-bg)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40, width: '100%', maxWidth: 500 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'row', gap: 9, marginBottom: 14 }}>
              {[
                { emoji: getStreakEmoji(streakData?.current_streak || 0), num: streakData?.current_streak || 0, lbl: 'Day Streak' },
                { emoji: '🏆', num: streakData?.longest_streak || 0, lbl: 'Longest' },
                { emoji: '📅', num: streakData?.total_check_ins || 0, lbl: 'Total Days' },
              ].map((card, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 15, padding: 12, textAlign: 'center', border: `1px solid ${'var(--c-border)'}` }}>
                  <span style={{ fontSize: 20, marginBottom: 4, display: 'block' }}>{card.emoji}</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--c-heading)', lineHeight: '26px', display: 'block' }}>{card.num}</span>
                  <span style={{ fontSize: 10, color: 'var(--c-text-secondary)', marginTop: 2, display: 'block' }}>{card.lbl}</span>
                </div>
              ))}
            </div>
            {(() => {
              const current = streakData?.current_streak || 0;
              const next = [3, 7, 14, 30, 50, 100, 365].find(v => v > current);
              if (!next) return null;
              return (
                <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 15, padding: 14, border: `1px solid ${'var(--c-border)'}` }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-heading)', marginBottom: 8, display: 'block' }}>Next: {getMilestoneMessage(next)}</span>
                  <div style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: 'var(--c-card-bg-alpha)', overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', borderRadius: 2, backgroundColor: T.gold, width: `${(current / next) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>{next - current} days to go</span>
                </div>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => setShowStreakModal(false)} style={{ backgroundColor: T.gold, borderRadius: 100, padding: '10px 32px', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: T.navy }}>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOURNAL MODAL ── */}
      {showJournal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--c-bg)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: `1px solid ${'var(--c-divider)'}` }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', fontWeight: 400, margin: 0 }}>Cosmic Journal</h2>
            <button onClick={() => setShowJournal(false)} style={{ fontSize: 18, color: 'var(--c-text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 8, display: 'block' }}>{formatDateHeader()}</span>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--c-heading)', fontStyle: 'italic', lineHeight: '22px', margin: '0 0 16px' }}>
              {forecast?.mantra ? `"${forecast.mantra}"` : '"What is the universe trying to teach you?"'}
            </p>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 8, marginTop: 16, display: 'block' }}>HOW ARE YOU FEELING?</span>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {[
                { key: 'great', emoji: '😊', label: 'Great' },
                { key: 'good', emoji: '🙂', label: 'Good' },
                { key: 'okay', emoji: '😐', label: 'Okay' },
                { key: 'low', emoji: '😔', label: 'Low' },
                { key: 'anxious', emoji: '😰', label: 'Anxious' },
              ].map(m => (
                <button key={m.key} onClick={() => setJournalMood(m.key)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8, borderRadius: 12, flex: 1,
                  backgroundColor: journalMood === m.key ? 'rgba(200,168,75,0.1)' : 'transparent',
                  border: journalMood === m.key ? `1px solid ${T.gold}` : '1px solid transparent', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 20, marginBottom: 2 }}>{m.emoji}</span>
                  <span style={{ fontSize: 10, color: journalMood === m.key ? 'var(--c-heading)' : 'var(--c-text-secondary)', marginTop: 2 }}>{m.label}</span>
                </button>
              ))}
            </div>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 8, marginTop: 16, display: 'block' }}>ENERGY LEVEL</span>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button key={n} onClick={() => setJournalEnergy(n)} style={{ width: 24, height: 24, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: n <= journalEnergy ? T.gold : 'rgba(255,255,255,0.1)' }} />
                </button>
              ))}
              <span style={{ fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold, marginLeft: 8 }}>{journalEnergy}/10</span>
            </div>
            <textarea
              style={{
                backgroundColor: 'var(--c-input-bg)', borderRadius: 16, padding: 16, fontSize: 15,
                color: 'var(--c-text)', border: `1px solid ${'var(--c-input-border)'}`, minHeight: 200,
                lineHeight: '24px', fontFamily: 'var(--font-sans)', fontWeight: 300, width: '100%',
                boxSizing: 'border-box', resize: 'vertical',
              }}
              placeholder="Let your thoughts flow..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
            />
            <button onClick={saveJournalEntry} disabled={!journalText.trim()} style={{
              backgroundColor: 'var(--c-bg)', borderRadius: 14, padding: 16, width: '100%', textAlign: 'center', marginTop: 20, border: 'none',
              cursor: journalText.trim() ? 'pointer' : 'default', opacity: journalText.trim() ? 1 : 0.5,
            }}>
              <span style={{ fontSize: 15, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-heading)' }}>Save Entry</span>
            </button>
            <div style={{ height: 30 }} />
          </div>
        </div>
      )}

      {/* ── MOON RITUAL MODAL ── */}
      {showMoonRitual && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--c-bg)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: `1px solid ${'var(--c-divider)'}` }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', fontWeight: 400, margin: 0 }}>
                {moonData?.phaseName === 'New Moon' ? '🌑 New Moon Ritual' : '🌕 Full Moon Ritual'}
              </h2>
              <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', fontStyle: 'italic', marginTop: 2, display: 'block' }}>
                {moonData?.phaseName === 'New Moon' ? 'Set intentions with tonight\'s lunar energy' : 'Release what no longer serves you under tonight\'s light'}
              </span>
            </div>
            <button onClick={() => setShowMoonRitual(false)} style={{ fontSize: 18, color: 'var(--c-text-secondary)', padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          {moonRitualLoading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div className="spinner" style={{ width: 36, height: 36, border: `3px solid ${T.gold}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14, color: 'var(--c-text-secondary)', marginTop: 12 }}>Preparing your ritual...</span>
            </div>
          ) : moonRitual ? (
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--c-heading)', fontWeight: 400, margin: '0 0 8px' }}>{moonRitual.title}</h3>
              <span style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginBottom: 16, display: 'block' }}>
                {moonData?.phaseName} in {moonData?.sign} · {moonData?.illumination}% illumination
              </span>
              <p style={{ fontSize: 15, color: 'var(--c-text)', lineHeight: '24px', margin: '0 0 20px' }}>{moonRitual.opening}</p>
              <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 12, display: 'block' }}>
                  {moonData?.phaseName === 'New Moon' ? 'INTENTION PROMPTS' : 'REFLECTION PROMPTS'}
                </span>
                {moonRitual.prompts?.map((p, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'var(--c-heading)', lineHeight: '22px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: '0 0 8px' }}>{i + 1}. {p}</p>
                ))}
              </div>
              <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', border: `1px solid ${'var(--c-border)'}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 8, display: 'block' }}>AFFIRMATION</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--c-heading)', lineHeight: '24px', fontStyle: 'italic', margin: 0 }}>"{moonRitual.affirmation}"</p>
              </div>
              <div style={{ backgroundColor: 'rgba(155,142,196,0.1)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: '#9B8EC4', marginBottom: 8, display: 'block' }}>CLOSING RITUAL</span>
                <p style={{ fontSize: 14, color: 'var(--c-text)', lineHeight: '22px', margin: 0 }}>{moonRitual.closingRitual}</p>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 8, display: 'block' }}>
                {moonData?.phaseName === 'New Moon' ? 'MY INTENTION' : 'MY REFLECTION'}
              </span>
              <textarea
                style={{
                  backgroundColor: 'var(--c-input-bg)', borderRadius: 16, padding: 16, fontSize: 15,
                  color: 'var(--c-text)', border: `1px solid ${'var(--c-input-border)'}`, minHeight: 100,
                  lineHeight: '24px', fontFamily: 'var(--font-sans)', fontWeight: 300, width: '100%',
                  boxSizing: 'border-box', resize: 'vertical',
                }}
                placeholder={moonData?.phaseName === 'New Moon' ? 'I am calling in...' : 'I am releasing...'}
                value={ritualIntention}
                onChange={(e) => setRitualIntention(e.target.value)}
                readOnly={ritualSaved}
              />
              {ritualSaved ? (
                <div style={{ backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 14, padding: 16, textAlign: 'center', marginTop: 20 }}>
                  <span style={{ fontSize: 15, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-success)' }}>Intention Saved</span>
                </div>
              ) : (
                <button onClick={saveMoonIntention} disabled={!ritualIntention.trim()} style={{
                  backgroundColor: 'var(--c-bg)', borderRadius: 14, padding: 16, width: '100%', textAlign: 'center', marginTop: 20, border: 'none',
                  cursor: ritualIntention.trim() ? 'pointer' : 'default', opacity: ritualIntention.trim() ? 1 : 0.5,
                }}>
                  <span style={{ fontSize: 15, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-heading)' }}>
                    {moonData?.phaseName === 'New Moon' ? 'Set Intention' : 'Save Reflection'}
                  </span>
                </button>
              )}
              <div style={{ height: 40 }} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-text-secondary)', textAlign: 'center' }}>Unable to generate your ritual. Try again later.</p>
            </div>
          )}
        </div>
      )}

      {/* ── XP FLOAT ANIMATION ── */}
      {xpGainText && (
        <div style={{
          position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)',
          backgroundColor: 'rgba(200,168,75,0.18)', borderRadius: 100,
          padding: '6px 16px', zIndex: 999, pointerEvents: 'none',
          animation: 'xpFloat 1.2s ease-out forwards',
        }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: T.gold }}>{xpGainText}</span>
        </div>
      )}

      {/* Refresh button (replaces pull-to-refresh) */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100,
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: 'rgba(200,168,75,0.15)',
          border: '1px solid rgba(200,168,75,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', opacity: refreshing ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: 16, color: T.gold, animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes xpFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
        }
        .scroll-container::-webkit-scrollbar { display: none; }
        .scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
