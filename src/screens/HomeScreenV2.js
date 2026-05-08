// Celestia HomeScreen V2 — Today as a Tinder-style swipe deck.
//
// Swipe pattern modeled on the flick-main reference:
//   - Stacked cards (current on top with lifted shadow, next peeks behind
//     at scale 0.96, opacity 0.6 — gives the 3D layered feel)
//   - Pan gesture (translation + rotation tied to drag)
//   - Past threshold (or velocity) → card flies off + advance to next
//   - Spring back if not past threshold
//   - Tap (composed with pan via Race) → opens detail modal
//
// Slot lineup (per plan/redesign-home/05-today-concept.md):
//   1. ANCHOR    — daily quote-class headline
//   2. SPOTLIGHT — top life area
//   3. SKY       — top transit
//   4. REFLECT   — time-of-day prompt → AI chat
//   5. CLOSING   — soft floor + farewell

import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Platform, StatusBar, Dimensions, AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { fetchExtendedForecast } from '../services/geminiService';
import {
  getTransitPlanets, calculateTransitSignificance, getMoonDataForDate,
  isMercuryRetrograde, getCosmicSeason,
} from '../services/astrologyService';
import { loadString, StorageKeys } from '../services/storage';
import { scheduleAllNotifications } from '../services/notificationService';
import { haptic } from '../services/hapticService';
import { getStreakData, getStreakEmoji } from '../services/streakService';
import { useAnalytics, EVENTS } from '../services/analytics';
import CelestiaMotif from '../components/CelestiaMotif';

// Map each slot key to its motif kind in CelestiaMotif's library.
const SLOT_MOTIF = {
  anchor:   'today',
  love:     'love',
  career:   'career',
  vitality: 'vitality',
  growth:   'growth',
  social:   'social',
  circle:   'circle',
  sky:      'sky',
  reflect:  'reflect',
  journal:  'journal',
  trigger:  'trigger',
  closing:  'closing',
  // 'report' uses a planetary glyph (varies per pick) rendered as text in
  // the motif badge — no entry here, see render code.
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Card geometry — Stitch designer spec: 90% width, aspect 4/5
const CARD_WIDTH = SCREEN_W * 0.90;
const CARD_ASPECT = 4 / 5;
const CARD_HEIGHT = Math.min(CARD_WIDTH / CARD_ASPECT, SCREEN_H * 0.65);

// ── Swipe physics — exact match to flick-main constants ──────
// references/flick-main/app-code/constants/animations.ts
const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 450;
const ROTATION_FACTOR = 15;
const CARD_FLY_MULTIPLIER = 1.5;
const FLY_DISTANCE = SCREEN_W * CARD_FLY_MULTIPLIER;
const SPRING_GENTLE = { damping: 12, stiffness: 120 };  // springs.gentle
const SPRING_FLY = { damping: 20, stiffness: 200 };     // fly-off custom

// ── Time-of-day mode ──────────────────────────────────────────
const getTimeMode = () => {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'afternoon';
  if (h >= 17 && h < 23) return 'evening';
  return 'latenight';
};

// ── Per-card gradients ────────────────────────────────────────
// Per-slot gradients. Stitch designer's frames: cream-dominant cards with
// just a subtle accent wash at the top — the slot's mood reads as a quiet
// hint, not a saturated background.
const SLOT_GRADIENTS_LIGHT = {
  anchor:   ['#FFEFD9', '#FBF5EE', '#FAF6EE'],   // peach hint → cream
  love:     ['#FBE5DD', '#FBF1EC', '#FAF6EE'],   // rose-pink hint
  career:   ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue hint
  vitality: ['#E5F0DC', '#F4F8EE', '#FAF6EE'],   // sage hint
  growth:   ['#FBE3B5', '#FAF1DC', '#FAF6EE'],   // amber hint
  social:   ['#EDE0F0', '#F8F2FA', '#FAF6EE'],   // violet hint
  circle:   ['#FBE0E8', '#FBEEF1', '#FAF6EE'],   // soft rose-mauve (relational)
  sky:      ['#E0E8F2', '#F2F4F8', '#FAF6EE'],   // cool blue hint
  reflect:  ['#F0E4E8', '#F8F0F2', '#FAF6EE'],   // mauve hint
  journal:  ['#EDE6D8', '#F4EEDF', '#FAF6EE'],   // ivory paper hint
  trigger:  ['#EDE2F5', '#F8F0FA', '#FAF6EE'],   // lavender (Mercury Rx)
  report:   ['#F5E1B8', '#F8EED6', '#FAF6EE'],   // warm gold parchment (deeper read)
  closing:  ['#FBE9CD', '#FAF3E2', '#FAF6EE'],   // dusk amber
};
const SLOT_GRADIENTS_DARK = {
  anchor:   ['#7A2840', '#3A1A28', '#1F0F18'],
  love:     ['#7A2A40', '#5A2840', '#1F0F18'],
  career:   ['#2A2A40', '#3A1A28', '#1F0F18'],
  vitality: ['#2A3828', '#3A1A28', '#1F0F18'],
  growth:   ['#3A2818', '#3A1A28', '#1F0F18'],
  social:   ['#3A2840', '#3A1A28', '#1F0F18'],
  circle:   ['#5A283A', '#3A1A28', '#1F0F18'],
  sky:      ['#3A2A48', '#3A1A28', '#1F0F18'],
  reflect:  ['#5A2840', '#3A1A28', '#1F0F18'],
  journal:  ['#48342A', '#3A1A28', '#1F0F18'],
  trigger:  ['#5C3818', '#3A1A28', '#1F0F18'],
  report:   ['#3A2818', '#3A1A28', '#1F0F18'],   // warm burgundy/gold
  closing:  ['#3A1A28', '#1F0F18', '#100610'],
};

const PAGE_BG_LIGHT = '#FCF9F8';   // warm paper-cream — Stitch designer's surface
const PAGE_BG_DARK  = '#15101A';

// CTA gradient — exact stops from designer's HTML
// (linear-gradient(135deg, #fed9b8 0%, #e9ddff 100%)). Dark text reads.
const CTA_GRADIENT = ['#FED9B8', '#E9DDFF'];
const CTA_TEXT = '#1B1C1C';

const REFLECT_PROMPTS = {
  morning:   { icon: '☼', label: 'MORNING',   q: 'What do you want today to be about?' },
  afternoon: { icon: '✦', label: 'AFTERNOON', q: "What's actually on your mind?" },
  evening:   { icon: '☾', label: 'EVENING',   q: 'How did today actually feel?' },
  latenight: { icon: '✧', label: 'TONIGHT',   q: 'Sit with this one for a minute.' },
};

// Time-of-day-aware feeling chips on the Reflect card. Tap a chip → opens
// AskAI with a prompt seeded from the chosen feeling.
const REFLECT_CHIPS = {
  morning:   ['Hopeful', 'Tired', 'Focused'],
  afternoon: ['Distracted', 'Inspired', 'Stuck'],
  evening:   ['Overwhelmed', 'Inspired', 'Anxious'],
  latenight: ['Restless', 'Reflective', 'Lonely'],
};

// Time-of-day-aware Journal card content. Tap CTA → opens Journal screen
// with the prompt seeded as the day's mantra.
const JOURNAL_PROMPTS = {
  morning:   { headline: 'What do you want to remember today?', meta: 'A few sentences before the day pulls you in.' },
  afternoon: { headline: 'Notice something worth keeping.',     meta: 'A line is enough — the act is the point.' },
  evening:   { headline: "What's worth writing down?",          meta: "Today's already a story. Save the chapter." },
  latenight: { headline: 'Capture today before it fades.',      meta: "Tomorrow you'll forget how this felt. Write it now." },
};

// Aspect-type → context tags shown below the Sky card's data widgets.
const SKY_CONTEXT_TAGS = {
  Conjunction: ['Merging', 'Activation', 'Focus'],
  Trine:       ['Flow', 'Harmony', 'Ease'],
  Sextile:     ['Opportunity', 'Growth', 'Lightness'],
  Square:      ['Mental Energy', 'Communication', 'Friction'],
  Opposition:  ['Balance', 'Tension', 'Mirroring'],
};

const LIFE_AREA_META = {
  love:     { tag: 'LOVE',      icon: '♡' },
  career:   { tag: 'CAREER',    icon: '◆' },
  vitality: { tag: 'VITALITY',  icon: '✦' },
  growth:   { tag: 'GROWTH',    icon: '◎' },
  social:   { tag: 'SOCIAL',    icon: '✧' },
};

const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SHORT_MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const LONG_MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const LONG_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// Returns Monday of the ISO-week containing `date`.
const weekStartMonday = (date) => {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};

const formatDateHeader = (date = new Date(), period = 'today') => {
  if (period === 'weekly') {
    const ws = weekStartMonday(date);
    return `WEEK OF ${SHORT_MONTHS[ws.getMonth()]} ${ws.getDate()}`;
  }
  if (period === 'monthly') {
    return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${SHORT_DAYS[date.getDay()]} · ${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
};

// Long, magazine-style date for the anchor card header.
//   today: "SUNDAY, OCTOBER 20"
//   week:  "MAY 5 – MAY 11"
//   month: "MAY 2026"
const dateLabelLong = (date = new Date(), period = 'today') => {
  if (period === 'weekly') {
    const ws = weekStartMonday(date);
    const we = new Date(ws);
    we.setDate(ws.getDate() + 6);
    return `${SHORT_MONTHS[ws.getMonth()]} ${ws.getDate()} – ${SHORT_MONTHS[we.getMonth()]} ${we.getDate()}`;
  }
  if (period === 'monthly') {
    return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${LONG_DAYS[date.getDay()]}, ${LONG_MONTHS[date.getMonth()]} ${date.getDate()}`;
};

const truncate = (str, n) => {
  if (!str) return '';
  return str.length <= n ? str : str.slice(0, n - 1).trim() + '…';
};

const pickTopLifeArea = (lifeAreas) => {
  if (!lifeAreas) return null;
  const order = ['love', 'career', 'vitality', 'growth', 'social'];
  let best = null;
  for (const key of order) {
    const area = lifeAreas[key];
    if (!area) continue;
    const intensity = area.intensity || 3;
    if (!best || intensity > best.intensity) best = { key, ...area, intensity };
  }
  return best;
};

const pickTopTransit = (chart, today) => {
  try {
    const sig = calculateTransitSignificance(chart, today);
    if (Array.isArray(sig) && sig.length > 0) return sig[0];
  } catch (e) {}
  return null;
};

// ── Phase 5 — Trigger card picker ─────────────────────────────
// Priority order (highest first, only ONE fires per day):
//   1. Birthday week (within 7 days before, 3 days after)
//   2. Mercury Retrograde active
//   3. Full / New Moon today
//   4. Sunday → week reflection
//   5. Monday → week ahead
//   6. 1st-3rd of month → monthly recap
// Returns { kind, kicker, headline, meta, ctaLabel, ctaTarget } or null.
const pickTrigger = (profile, today, moonData, mercuryRx) => {
  if (profile?.birthDate) {
    try {
      const birth = new Date(profile.birthDate);
      const thisYearBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      const diffDays = Math.round((thisYearBday - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= -3 && diffDays <= 7) {
        return {
          kind: 'birthday',
          kicker: '✦  SOLAR RETURN',
          headline: diffDays > 0 ? 'Your year ahead is forming.' : "Welcome to your year.",
          meta: diffDays > 0
            ? `${diffDays} day${diffDays === 1 ? '' : 's'} until your birthday.`
            : 'Your new chapter has begun.',
          ctaLabel: 'See year ahead  →',
          ctaTarget: 'Reports',
        };
      }
    } catch (e) {}
  }

  if (mercuryRx) {
    return {
      kind: 'mercury-rx',
      kicker: '☿  MERCURY RX',
      headline: 'Mercury is retrograde.',
      meta: 'Slow down on tech, contracts, and unsent texts. Re- words come naturally now.',
      ctaLabel: 'See full sky  →',
      ctaTarget: 'TodaysSky',
    };
  }

  if (moonData?.phaseName === 'Full Moon' || moonData?.phaseName === 'New Moon') {
    const isFull = moonData.phaseName === 'Full Moon';
    return {
      kind: 'lunar',
      kicker: `${isFull ? '🌕' : '🌑'}  ${isFull ? 'FULL' : 'NEW'} MOON`,
      headline: `${moonData.phaseName} in ${moonData.sign || 'the sky'}.`,
      meta: isFull
        ? 'Release. Endings can be gifts.'
        : 'Plant a seed. What do you want to grow?',
      ctaLabel: 'See full sky  →',
      ctaTarget: 'TodaysSky',
    };
  }

  const dow = today.getDay();
  if (dow === 0) {
    return {
      kind: 'sunday-recap',
      kicker: 'SUNDAY',
      headline: 'How was your week?',
      meta: 'A few minutes of reflection lands harder than the news ticker.',
      ctaLabel: 'Reflect  →',
      ctaTarget: 'Journal',
    };
  }
  if (dow === 1) {
    return {
      kind: 'monday-week',
      kicker: 'MONDAY',
      headline: 'The week ahead.',
      meta: 'Pacing matters more than productivity right now.',
      ctaLabel: 'See your week  →',
      ctaTarget: 'Reports',
    };
  }

  const dom = today.getDate();
  if (dom >= 1 && dom <= 3) {
    return {
      kind: 'monthly-recap',
      kicker: '✦  THIS MONTH',
      headline: 'A new chapter.',
      meta: "See last month's patterns and what's coming next.",
      ctaLabel: 'See month ahead  →',
      ctaTarget: 'Reports',
    };
  }

  return null;
};

// ── Phase 6 — Report card picker ─────────────────────────────
// Picks a contextual report based on the loudest signal in today's chart.
// Returns { type, name, tag, glyph, headline, meta } or a default. Designed
// to feel like guidance ("here's what's worth digging into") rather than a
// promo unit.
const pickReport = (profile, today, transitSignificance, topArea, period) => {
  // Birthday window — Solar Return is the strongest pitch in the next month.
  if (profile?.birthDate) {
    try {
      const birth = new Date(profile.birthDate);
      const thisYearBday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      const diff = Math.round((thisYearBday - today) / (1000 * 60 * 60 * 24));
      if (diff >= -7 && diff <= 30) {
        return {
          type: 'solar_return',
          name: 'Solar Return',
          tag: 'SOLAR RETURN',
          glyph: '☉',
          headline: diff > 0 ? 'Your year ahead is forming.' : 'Your year is underway.',
          meta: 'A complete reading from birthday to birthday — every chapter mapped.',
        };
      }
    } catch (e) {}
  }

  // Top life-area = love
  if (topArea?.key === 'love') {
    return {
      type: 'love',
      name: 'Love Report',
      tag: 'LOVE REPORT',
      glyph: '♀',
      headline: period === 'today' ? "Today's love signal deserves a closer look."
        : period === 'weekly' ? "Your love story this week deserves a closer look."
        : "Your love story this month deserves a closer look.",
      meta: 'Venus, attachment style, and why you love the way you do.',
    };
  }

  // Top life-area = career
  if (topArea?.key === 'career') {
    return {
      type: 'career',
      name: 'Career Map',
      tag: 'CAREER MAP',
      glyph: '♄',
      headline: period === 'today' ? 'Career energy is loud today — read the map.'
        : period === 'weekly' ? 'A focused week for work — see the bigger arc.'
        : 'Your professional roadmap, decoded.',
      meta: 'Midheaven, Saturn, and your professional destiny.',
    };
  }

  // High transit significance — the sky is doing real work on this chart.
  if ((transitSignificance || 0) >= 60) {
    return {
      type: 'transit',
      name: 'Transit Report',
      tag: 'TRANSIT REPORT',
      glyph: '☿',
      headline: 'The sky is loud on your chart right now.',
      meta: 'Current planetary weather, hitting your placements.',
    };
  }

  // First 3 days of the month — Year-Ahead frames the next 12 months well.
  if (today.getDate() <= 3) {
    return {
      type: 'yearly',
      name: 'Year Ahead',
      tag: 'YEAR AHEAD',
      glyph: '♃',
      headline: 'A new month has shape — see the year that holds it.',
      meta: 'Month-by-month roadmap for the year.',
    };
  }

  // Default — Lunar Guide ties to the moon already shown elsewhere in the deck.
  return {
    type: 'lunar',
    name: 'Lunar Guide',
    tag: 'LUNAR GUIDE',
    glyph: '☽',
    headline: 'The moon writes its own rituals on you.',
    meta: 'Moon practices aligned to your natal chart.',
  };
};

// ──────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────
export default function HomeScreenV2({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile, partnerProfiles } = useUserProfile();
  const { capture } = useAnalytics();
  // 'today' | 'weekly' | 'monthly' — drives forecast scope, slot filtering,
  // and header labels. Values match what fetchExtendedForecast expects so the
  // AI generates the right period-shaped content (4-paragraph weekly arc /
  // monthly roadmap vs daily quad). Wrong strings silently fall through to
  // the daily branch, which is the bug the user spotted.
  const [period, setPeriod] = useState('today');
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakInfo, setStreakInfo] = useState(null);
  const [moonData, setMoonData] = useState(null);
  const [topTransit, setTopTransit] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Detail navigation — pushes to a dedicated stack screen per slot.
  // period is passed so detail-screen labels ("TODAY" / "THIS WEEK" / "THIS
  // MONTH", date strings, CTA copy) match what the user just tapped.
  const openDetail = (card) => {
    if (!card) return;
    haptic.medium();
    if (card.slot === 'anchor') {
      navigation.navigate('TodayReadingDetail', { forecast, period });
    } else if (LIFE_AREA_META[card.slot]) {
      navigation.navigate('LifeAreaDetail', { areaKey: card.slot, areaData: card.area, forecast, period });
    } else if (card.slot === 'sky') {
      navigation.navigate('TodaysSky');
    }
  };
  const [savedSlots, setSavedSlots] = useState({});

  const timeMode = useMemo(() => getTimeMode(), []);
  const firstName = (userProfile?.name || '').split(' ')[0] || 'You';
  // `today` is held in state so a date rollover (user keeps app open across
  // midnight, or backgrounds it overnight and reopens) can trigger refetches.
  // The AppState 'active' listener below replaces `today` when the ISO date
  // has changed.
  const [today, setToday] = useState(() => new Date());
  const dateKey = today.toISOString().split('T')[0];
  const dateLabel = useMemo(() => formatDateHeader(today, period), [today, period]);

  const pageBg = isDark ? PAGE_BG_DARK : PAGE_BG_LIGHT;
  const inkFg = isDark ? T.cream : '#1A1410';
  const inkMuted = isDark ? 'rgba(250,248,242,0.55)' : '#5C4E50';
  const inkSoft = isDark ? 'rgba(250,248,242,0.35)' : '#9B8E8F';

  // ── Forecast fetch (cache handled inside fetchExtendedForecast) ──
  // The API keys 'weekly' by ISO-week label, 'monthly' by YYYY-MM, 'today' by
  // forecast date — so we don't need to manage a separate outer cache here.
  useEffect(() => {
    if (!userProfile?.chart) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setForecast(null);
    (async () => {
      try {
        const dateISO = today.toISOString().split('T')[0];
        const transits = getTransitPlanets(today);
        const planetaryData = {
          dateLabel: dateISO,
          transits: transits.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
        };
        const sig = calculateTransitSignificance(userProfile.chart, today);

        // Briefing-mode rotation — daily reads cycle through standard / pattern
        // / partner / archetype every 7 days. Defeats finite-variability decay
        // (the AI tone shifts even when the chart context is similar). Weekly
        // and monthly stay 'standard' (V1 parity).
        let briefingMode = 'standard';
        if (period === 'today') {
          try {
            const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
            if (firstUse) {
              const start = new Date(firstUse + 'T00:00:00');
              const todayMid = new Date(today); todayMid.setHours(0, 0, 0, 0);
              const days = Math.max(0, Math.floor((todayMid - start) / 86400000));
              const weeks = Math.floor(days / 7);
              briefingMode = ['standard', 'pattern', 'partner', 'archetype'][weeks % 4];
              // Skip 'partner' framing for users with no Circle entries —
              // would force a relational lens on a relationally-empty chart.
              if (briefingMode === 'partner' && (!partnerProfiles || partnerProfiles.length === 0)) {
                briefingMode = 'standard';
              }
            }
          } catch (e) {}
        }

        const data = await fetchExtendedForecast(userProfile, period, planetaryData, sig, null, briefingMode);
        if (!cancelled) {
          setForecast(data); setLoading(false);
          try { capture(EVENTS.DAILY_BRIEFING_VIEWED, { has_navigator: !!data?.navigatorHeadline, source: 'v2', period, briefing_mode: briefingMode }); } catch (e) {}

          // Re-schedule push notifications with the latest forecast so the
          // morning push reflects today's actual reading. Only fires on the
          // 'today' period — weekly/monthly forecasts don't drive notifications.
          if (period === 'today') {
            try {
              const moon = (() => { try { return getMoonDataForDate(today); } catch (e) { return null; } })();
              const streak = await getStreakData(userProfile.id).catch(() => null);
              scheduleAllNotifications(userProfile, data, streak, moon, null, null).catch(() => {});
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('[V2] forecast fetch failed', e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userProfile, period, dateKey, partnerProfiles]);

  const [mercuryRx, setMercuryRx] = useState(false);
  const [cosmicSeason, setCosmicSeason] = useState(null);
  useEffect(() => {
    if (!userProfile?.id) return;
    getStreakData(userProfile.id).then(setStreakInfo).catch(() => {});
    try { setMoonData(getMoonDataForDate(today)); } catch (e) {}
    if (userProfile?.chart) setTopTransit(pickTopTransit(userProfile.chart, today));
    try { setMercuryRx(!!isMercuryRetrograde(today)); } catch (e) {}
    if (userProfile?.chart) {
      try { setCosmicSeason(getCosmicSeason(userProfile.chart, today)); } catch (e) {}
    }
  }, [userProfile, dateKey]);

  // App-foreground date rollover refresh. When the user reopens the app on
  // a new calendar day, replace `today` with a fresh Date — which bumps
  // dateKey and re-runs both effects above (forecast + moon/transit/Rx).
  // fetchExtendedForecast's internal cache returns warm data when valid;
  // this only re-fetches when the cache key has changed.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      const fresh = new Date();
      const freshISO = fresh.toISOString().split('T')[0];
      if (freshISO !== dateKey) setToday(fresh);
    });
    return () => sub.remove();
  }, [dateKey]);

  const cards = useMemo(() => {
    const list = [];
    list.push({ slot: 'anchor', key: 'anchor' });

    // 5 individual life-area cards, in priority order. Skip if AI returned no
    // data for that area (rare; usually all 5 present).
    const AREA_ORDER = ['love', 'career', 'vitality', 'growth', 'social'];
    for (const key of AREA_ORDER) {
      const area = forecast?.lifeAreas?.[key];
      if (area) list.push({ slot: key, key: `area-${key}`, area: { key, ...area } });
    }

    // Circle — only renders when user has 1+ partner profiles. Sits between
    // the relational life areas (Social) and the cosmic widget (Sky).
    if (Array.isArray(partnerProfiles) && partnerProfiles.length > 0) {
      list.push({ slot: 'circle', key: 'circle', partners: partnerProfiles });
    }

    // Sky / Reflect / Journal are time-of-day-shaped — they only make sense
    // in the daily deck. Week and Month views drop them.
    if (period === 'today') {
      if (topTransit || moonData) list.push({ slot: 'sky', key: 'sky' });
      list.push({ slot: 'reflect', key: 'reflect' });
      list.push({ slot: 'journal', key: 'journal' });
    }

    const trig = pickTrigger(userProfile, today, moonData, mercuryRx);
    if (trig) list.push({ slot: 'trigger', key: `trigger-${trig.kind}`, trigger: trig });

    // Report card — last "active" card before closing. Picks contextually
    // based on top life-area, transit significance, birthday window, etc.
    const topArea = pickTopLifeArea(forecast?.lifeAreas);
    let transitSig = 0;
    if (userProfile?.chart) {
      try {
        const sig = calculateTransitSignificance(userProfile.chart, today);
        transitSig = typeof sig === 'number' ? sig : (Array.isArray(sig) ? sig.length * 10 : 0);
      } catch (e) {}
    }
    const report = pickReport(userProfile, today, transitSig, topArea, period);
    if (report) list.push({ slot: 'report', key: `report-${report.type}`, report });

    list.push({ slot: 'closing', key: 'closing' });
    return list;
  }, [forecast, topTransit, moonData, mercuryRx, userProfile, partnerProfiles, period]);

  // Clamp currentIndex when cards array changes (e.g. forecast loads)
  useEffect(() => {
    if (currentIndex >= cards.length) setCurrentIndex(Math.max(0, cards.length - 1));
  }, [cards.length, currentIndex]);

  // ── Advance / rewind via JS thread (called from gesture worklet) ──
  const handleAdvance = useCallback(() => {
    haptic.selection();
    setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  }, [cards.length]);

  const handleRewind = useCallback(() => {
    haptic.selection();
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToCard = (idx) => {
    haptic.selection();
    setCurrentIndex(idx);
  };

  const onPeriodChange = (p) => {
    if (p === period) return;
    haptic.light();
    setPeriod(p);
    setCurrentIndex(0);
  };

  const toggleSave = (slot) => {
    haptic.light();
    setSavedSlots((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1] || null;
  const canAdvance = currentIndex < cards.length - 1;
  const canRewind = currentIndex > 0;

  const isSaved = currentCard ? !!savedSlots[currentCard.slot] : false;
  const slotShareable = currentCard && currentCard.slot !== 'closing';
  const hasDetail = currentCard && (
    currentCard.slot === 'anchor' ||
    currentCard.slot === 'sky' ||
    !!LIFE_AREA_META[currentCard.slot]   // any of love/career/vitality/growth/social
  );
  const isReflect = currentCard?.slot === 'reflect';
  const isClosing = currentCard?.slot === 'closing';
  const isTrigger = currentCard?.slot === 'trigger';
  const isJournal = currentCard?.slot === 'journal';
  const isCircle  = currentCard?.slot === 'circle';
  const isReport  = currentCard?.slot === 'report';

  // Single source of truth for "primary action" on a card. Used for both tap
  // (anywhere on the card body) and the bottom CTA pill — so journal/reflect/
  // circle/trigger/closing all open from a tap, not just from the CTA.
  const handlePrimaryAction = () => {
    if (!currentCard) return;
    if (hasDetail) {
      openDetail(currentCard);
    } else if (isReflect) {
      haptic.light();
      const p = REFLECT_PROMPTS[timeMode] || REFLECT_PROMPTS.evening;
      navigation.navigate('AskAI', { seedPrompt: p.q });
    } else if (isJournal) {
      haptic.light();
      navigation.navigate('Journal', { mantra: forecast?.mantra });
    } else if (isCircle) {
      haptic.light();
      navigation.navigate('Circle');
    } else if (isTrigger) {
      const target = currentCard.trigger?.ctaTarget || 'AskAI';
      haptic.light();
      navigation.navigate(target);
    } else if (isReport) {
      haptic.light();
      navigation.navigate('Reports');
    } else if (isClosing) {
      haptic.light();
      navigation.navigate('AskAI');
    }
  };

  const onShare = async () => {
    if (!currentCard) return;
    haptic.light();
    let message = '— Celestia';
    const slot = currentCard.slot;
    if (slot === 'anchor') {
      const h = forecast?.navigatorHeadline || '';
      const s = forecast?.navigatorSummary || '';
      message = `${h}${s ? `\n\n${s}` : ''}\n\n— Celestia`;
    } else if (LIFE_AREA_META[slot] && currentCard.area) {
      const a = currentCard.area;
      message = `${a.headline || a.energy || ''}\n\n${a.planetaryReason || ''}\n\n— Celestia`;
    } else if (slot === 'sky') {
      const t = topTransit;
      const tHead = t ? `${t.transitPlanet || ''} ${t.aspectType || ''} ${t.natalPlanet || ''}`.trim() : 'Today\'s sky';
      message = `${tHead}\n\n— Celestia`;
    } else if (slot === 'reflect') {
      const p = REFLECT_PROMPTS[timeMode] || REFLECT_PROMPTS.evening;
      message = `${p.q}\n\n— Celestia`;
    }
    try { await Share.share({ message }); } catch (e) {}
  };

  // ── Empty / loading ─────────────────────────────────────────
  if (!userProfile?.chart) {
    return (
      <View style={[styles.fillCenter, { backgroundColor: pageBg }]}>
        <Text style={[styles.emptyTitle, { color: inkFg }]}>Set up your chart to see Today</Text>
        <TouchableOpacity style={[styles.emptyCta, { backgroundColor: T.clay }]} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.emptyCtaText}>Open Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading && !forecast) {
    return (
      <View style={[styles.fillCenter, { backgroundColor: pageBg }]}>
        <Text style={[styles.kicker, { color: inkSoft, marginBottom: 18 }]}>TODAY</Text>
        <ActivityIndicator color={isDark ? T.gold : T.clay} size="large" />
        <Text style={[styles.loadingText, { color: inkMuted }]}>Reading the sky for {firstName}…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: pageBg }]}>

      {/* TOP CHROME */}
      <View style={styles.topChrome}>
        <View style={styles.dotsRow}>
          {cards.map((_, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.6}
              onPress={() => goToCard(i)}
              hitSlop={{ top: 14, bottom: 14, left: 4, right: 4 }}>
              <View style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex
                    ? (isDark ? T.cream : T.clayDeep)
                    : (isDark ? 'rgba(250,248,242,0.20)' : 'rgba(26,20,16,0.16)'),
                  width: i === currentIndex ? 22 : 14,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.avatarRow}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Profile')}>
          {streakInfo?.current_streak > 0 && (
            <Text style={[styles.streakText, { color: inkMuted }]}>
              {getStreakEmoji(streakInfo.current_streak)} {streakInfo.current_streak}
            </Text>
          )}
          <View style={[
            styles.avatar,
            {
              borderColor: isDark ? 'rgba(250,248,242,0.18)' : 'rgba(26,20,16,0.16)',
              backgroundColor: isDark ? 'rgba(250,248,242,0.06)' : '#FFFFFF',
            },
          ]}>
            <Text style={[styles.avatarText, { color: inkFg }]}>
              {firstName[0]?.toUpperCase() || '✦'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Period toggle — Today / Week / Month segmented pill */}
      <View style={styles.periodRow}>
        <View style={[
          styles.periodSegment,
          {
            backgroundColor: isDark ? 'rgba(250,248,242,0.06)' : 'rgba(26,20,16,0.04)',
            borderColor: isDark ? 'rgba(250,248,242,0.10)' : 'rgba(26,20,16,0.06)',
          },
        ]}>
          {[
            { key: 'today',   label: 'Today' },
            { key: 'weekly',  label: 'Week' },
            { key: 'monthly', label: 'Month' },
          ].map((opt) => {
            const active = period === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.85}
                onPress={() => onPeriodChange(opt.key)}
                style={[
                  styles.periodPill,
                  active && {
                    backgroundColor: isDark ? T.cream : T.clayDeep,
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.25 : 0.12,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 3,
                  },
                ]}>
                <Text style={[
                  styles.periodLabel,
                  { color: active
                      ? (isDark ? T.clayDeep : T.cream)
                      : (isDark ? 'rgba(250,248,242,0.55)' : 'rgba(26,20,16,0.55)') },
                ]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={[styles.dateLabel, { color: inkSoft }]}>{dateLabel}</Text>

      {/* CARD DECK — Tinder-style stack. Peek card sits behind active at
          slightly smaller scale + full opacity. Hidden under active until
          the swipe reveals it (as the active card flies off). */}
      <View style={styles.deckArea}>
        <View style={styles.cardStack}>
        {/* NEXT card behind — full opacity, slightly smaller, no shadow.
            Becomes the new active position when current swipes off. */}
        {nextCard && (
          <View pointerEvents="none" style={[styles.cardAbsolute, styles.cardBehind]}>
            <CardSlot
              cardData={nextCard}
              slot={nextCard.slot}
              isDark={isDark}
              forecast={forecast}
              topTransit={topTransit}
              moonData={moonData}
              timeMode={timeMode}
              period={period}
              cosmicSeason={cosmicSeason}
              isPeek={true}
            />
          </View>
        )}

        {/* CURRENT — draggable */}
        {currentCard && (
          <SwipeableCard
            key={currentCard.key}
            cardData={currentCard}
            slot={currentCard.slot}
            isDark={isDark}
            canAdvance={canAdvance}
            canRewind={canRewind}
            onAdvance={handleAdvance}
            onRewind={handleRewind}
            onTap={handlePrimaryAction}
            forecast={forecast}
            topTransit={topTransit}
            moonData={moonData}
            timeMode={timeMode}
            period={period}
            cosmicSeason={cosmicSeason}
            navigation={navigation}
          />
        )}
        </View>
      </View>

      {/* BOTTOM ACTION ROW */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.chipSmall,
            {
              backgroundColor: isSaved ? T.clay : (isDark ? '#241620' : '#FFFFFF'),
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.35 : 0.10,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => currentCard && toggleSave(currentCard.slot)}>
          <Text style={[styles.chipIcon, { color: isSaved ? T.cream : T.clay }]}>♡</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chipLargeShadow]}
          activeOpacity={0.85}
          onPress={handlePrimaryAction}>
          <LinearGradient
            colors={CTA_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chipLargeGradient}>
            <Text style={[styles.chipLargeText, { color: CTA_TEXT }]}>
              {hasDetail
                ? 'Go deeper  →'
                : isReflect
                  ? 'Open chat  →'
                  : isJournal
                    ? 'Open journal  →'
                    : isCircle
                      ? 'See your circle  →'
                      : isReport
                        ? 'See the report  →'
                        : isTrigger
                          ? (currentCard.trigger?.ctaLabel || 'Open  →')
                          : 'Ask Celestia  →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.chipSmall,
            {
              backgroundColor: isDark ? '#241620' : '#FFFFFF',
              shadowColor: '#000',
              shadowOpacity: isDark ? 0.35 : 0.10,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
              opacity: slotShareable ? 1 : 0.4,
            },
          ]}
          activeOpacity={0.8}
          disabled={!slotShareable}
          onPress={onShare}>
          <Text style={[styles.chipIcon, { color: T.clay }]}>↗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// SWIPEABLE CARD — pan + tap, with reanimated physics
// ──────────────────────────────────────────────────────────────
function SwipeableCard({
  cardData, slot, isDark, canAdvance, canRewind,
  onAdvance, onRewind, onTap,
  forecast, topTransit, moonData, timeMode, period, cosmicSeason, navigation,
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  const reset = () => {
    'worklet';
    tx.value = withSpring(0, SPRING_GENTLE);
    ty.value = withSpring(0, SPRING_GENTLE);
    rot.value = withSpring(0, SPRING_GENTLE);
  };

  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => {
      'worklet';
      runOnJS(onTap)();
    });

  // Pan params mirror references/flick-main SwipeCard.tsx exactly:
  //   ty.value = translationY * 0.3        (vertical drag is 30% of finger)
  //   rotation = (translationX / 120) * 15 (max 15° in flick; was 12° in mine)
  //   onEnd:   threshold OR velocity → fly off at ±30° with damping 20, stiffness 200
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      tx.value = e.translationX;
      ty.value = e.translationY * 0.3;
      rot.value = (e.translationX / SWIPE_THRESHOLD) * ROTATION_FACTOR;
    })
    .onEnd((e) => {
      'worklet';
      const wantNext = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const wantPrev = e.translationX >  SWIPE_THRESHOLD || e.velocityX >  VELOCITY_THRESHOLD;

      if (wantNext && canAdvance) {
        // Use withTiming for a predictable fly-off duration, then advance
        // state on completion so the old card actually leaves the screen
        // before the new card mounts. (Previously runOnJS fired immediately,
        // unmounting the old card mid-flight = jagged feel.)
        rot.value = withTiming(-22, { duration: 220 });
        tx.value = withTiming(-FLY_DISTANCE, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onAdvance)();
        });
      } else if (wantPrev && canRewind) {
        rot.value = withTiming(22, { duration: 220 });
        tx.value = withTiming(FLY_DISTANCE, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onRewind)();
        });
      } else {
        reset();
      }
    });

  const composedGesture = Gesture.Race(tapGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[styles.cardAbsolute, animatedStyle]}>
        <CardSlot
          cardData={cardData}
          slot={slot}
          isDark={isDark}
          forecast={forecast}
          topTransit={topTransit}
          moonData={moonData}
          timeMode={timeMode}
          period={period}
          cosmicSeason={cosmicSeason}
          navigation={navigation}
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ──────────────────────────────────────────────────────────────
// CARD SLOT — pure visual content of one card
// ──────────────────────────────────────────────────────────────
function CardSlot({ cardData, slot, isDark, forecast, topTransit, moonData, timeMode, period = 'today', cosmicSeason, navigation, partnerProfiles, isPeek }) {
  // Navigation helper used by tappable elements inside the card body
  // (e.g., feeling chips on the Reflect card).
  const navigationFromCard = (route, params) => {
    if (navigation?.navigate) navigation.navigate(route, params);
  };
  const gradient = isDark ? SLOT_GRADIENTS_DARK[slot] : SLOT_GRADIENTS_LIGHT[slot];
  const cardFg = isDark ? T.cream : '#1A1410';
  const cardFgMuted = isDark ? 'rgba(250,248,242,0.7)' : 'rgba(26,20,16,0.65)';
  const cardFgSoft = isDark ? 'rgba(250,248,242,0.45)' : 'rgba(26,20,16,0.42)';

  let tag = { icon: '', label: '' };
  let headline = '';
  let meta = '';
  let extras = null;  // optional JSX block (e.g. data widgets) — overrides meta when present

  switch (slot) {
    case 'anchor': {
      const anchorTag = period === 'weekly' ? 'THIS WEEK' : period === 'monthly' ? 'THIS MONTH' : 'TODAY';
      tag = { icon: '✦', label: anchorTag };
      const fallback = period === 'weekly' ? "This week's reading is brewing." : period === 'monthly' ? "This month's reading is brewing." : "Today's reading is brewing.";
      headline = forecast?.navigatorHeadline || fallback;
      meta = forecast?.navigatorSummary ? truncate(forecast.navigatorSummary, 90) : '';
      break;
    }
    case 'love':
    case 'career':
    case 'vitality':
    case 'growth':
    case 'social': {
      const area = cardData?.area;
      const m = LIFE_AREA_META[slot] || { tag: 'TODAY', icon: '✦' };
      tag = { icon: m.icon, label: m.tag };
      headline = area?.headline || area?.energy || `Today in ${m.tag.toLowerCase()}`;
      meta = area?.planetaryReason ? truncate(area.planetaryReason, 80) : '';
      break;
    }
    case 'sky': {
      tag = { icon: '☽', label: "TODAY'S SKY" };
      const moonPhase = moonData?.phaseName || 'Moon';
      const moonSign = moonData?.sign || '—';
      const moonIllum = moonData?.illumination != null ? `${moonData.illumination.toFixed(0)}%` : null;
      headline = topTransit
        ? `${topTransit.transitPlanet || ''} ${topTransit.aspectType || ''} ${topTransit.natalPlanet || ''}`.trim()
        : `${moonPhase} in ${moonSign}`;
      meta = '';
      extras = (
        <View>
          <View style={cardSlotStyles.dataRow}>
            <View style={[
              cardSlotStyles.dataCell,
              { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : 'rgba(255,255,255,0.55)',
                borderColor: isDark ? 'rgba(250,248,242,0.10)' : 'rgba(26,20,16,0.06)' },
            ]}>
              <Text style={[cardSlotStyles.dataLabel, { color: cardFgSoft }]}>MOON</Text>
              <Text style={[cardSlotStyles.dataValue, { color: cardFg }]} numberOfLines={1}>{moonPhase}</Text>
              <Text style={[cardSlotStyles.dataDetail, { color: cardFgMuted }]} numberOfLines={2}>
                in {moonSign}{moonIllum ? ` · ${moonIllum}` : ''}
              </Text>
            </View>
            {topTransit ? (
              <View style={[
                cardSlotStyles.dataCell,
                { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : 'rgba(255,255,255,0.55)',
                  borderColor: isDark ? 'rgba(250,248,242,0.10)' : 'rgba(26,20,16,0.06)' },
              ]}>
                <Text style={[cardSlotStyles.dataLabel, { color: cardFgSoft }]}>TRANSIT</Text>
                <Text style={[cardSlotStyles.dataValue, { color: cardFg }]} numberOfLines={1}>{topTransit.transitPlanet}</Text>
                <Text style={[cardSlotStyles.dataDetail, { color: cardFgMuted }]} numberOfLines={2}>
                  {topTransit.aspectType} {topTransit.natalPlanet}
                </Text>
              </View>
            ) : (
              <View style={[
                cardSlotStyles.dataCell,
                { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : 'rgba(255,255,255,0.55)',
                  borderColor: isDark ? 'rgba(250,248,242,0.10)' : 'rgba(26,20,16,0.06)' },
              ]}>
                <Text style={[cardSlotStyles.dataLabel, { color: cardFgSoft }]}>SKY</Text>
                <Text style={[cardSlotStyles.dataValue, { color: cardFg }]} numberOfLines={1}>Quiet</Text>
                <Text style={[cardSlotStyles.dataDetail, { color: cardFgMuted }]} numberOfLines={2}>no major aspects</Text>
              </View>
            )}
          </View>
          {/* Context tags row — sibling of dataRow, not child (was rendering
              to the right of the cells when nested in a flex row). */}
          {topTransit && SKY_CONTEXT_TAGS[topTransit.aspectType] && (
            <View style={cardSlotStyles.tagRow}>
              {SKY_CONTEXT_TAGS[topTransit.aspectType].map((label, i) => (
                <View key={i} style={[
                  cardSlotStyles.contextTag,
                  { backgroundColor: isDark ? 'rgba(250,248,242,0.06)' : 'rgba(255,255,255,0.55)',
                    borderColor: isDark ? 'rgba(250,248,242,0.10)' : 'rgba(26,20,16,0.08)' },
                ]}>
                  <Text style={[cardSlotStyles.contextTagText, { color: cardFgMuted }]}>{label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
      break;
    }
    case 'reflect': {
      const p = REFLECT_PROMPTS[timeMode] || REFLECT_PROMPTS.evening;
      tag = { icon: p.icon, label: p.label };
      headline = p.q;
      meta = "Talk to Celestia. Today's chart is loaded.";
      // Feeling chips below the prompt — tap to seed chat
      const chips = REFLECT_CHIPS[timeMode] || REFLECT_CHIPS.evening;
      extras = (
        <View style={cardSlotStyles.feelingRow}>
          {chips.map((feeling, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation?.();
                haptic.light();
                navigationFromCard?.('AskAI', { seedPrompt: `I'm feeling ${feeling.toLowerCase()}. What does my chart say?` });
              }}
              style={[
                cardSlotStyles.feelingChip,
                { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : 'rgba(255,255,255,0.7)',
                  borderColor: isDark ? 'rgba(250,248,242,0.14)' : 'rgba(26,20,16,0.08)' },
              ]}>
              <Text style={[cardSlotStyles.feelingChipText, { color: cardFg }]}>{feeling}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
      break;
    }
    case 'journal': {
      const p = JOURNAL_PROMPTS[timeMode] || JOURNAL_PROMPTS.evening;
      tag = { icon: '✎', label: 'JOURNAL' };
      headline = p.headline;
      meta = p.meta;
      break;
    }
    case 'circle': {
      tag = { icon: '◯', label: 'CIRCLE' };
      // Pick the first partner as today's relational focus (could be ranked
      // by synastry score later).
      const partners = Array.isArray(cardData?.partners) ? cardData.partners : [];
      const top = partners[0];
      const partnerName = top?.name?.split(' ')[0] || '';
      const partnerSign = top?.sun_sign || top?.zodiac_sign || '';
      headline = partnerName
        ? `Today, lean toward ${partnerName}.`
        : "Today's connections want directness.";
      meta = partnerName && partnerSign
        ? `${partnerName} · ${partnerSign} · ${partners.length === 1 ? '1 person in your circle' : `${partners.length} people in your circle`}`
        : `${partners.length} ${partners.length === 1 ? 'person' : 'people'} in your circle`;
      break;
    }
    case 'trigger': {
      const t = cardData?.trigger;
      // Trigger kickers have format "icon  LABEL" (already concatenated). Split.
      const raw = t?.kicker || '';
      const parts = raw.split(/\s{2,}/);
      tag = parts.length === 2
        ? { icon: parts[0], label: parts[1] }
        : { icon: '✦', label: raw };
      headline = t?.headline || '';
      meta = t?.meta || '';
      break;
    }
    case 'report': {
      const r = cardData?.report;
      tag = { icon: r?.glyph || '✦', label: r?.tag || 'REPORT' };
      headline = r?.headline || 'A deeper reading is ready.';
      meta = r?.meta || '';
      break;
    }
    case 'closing': {
      if (period === 'weekly') {
        tag = { icon: '✦', label: "THAT'S THE WEEK" };
        headline = "You've seen the week.";
        meta = "Come back daily for the day-by-day. The week's shape stays the same.";
      } else if (period === 'monthly') {
        tag = { icon: '✦', label: "THAT'S THE MONTH" };
        headline = "You've seen the month.";
        meta = "A new chapter forms each cycle. Use this as your map.";
      } else {
        tag = { icon: '✦', label: "THAT'S TODAY" };
        headline = timeMode === 'latenight'
          ? "Sleep well, you."
          : "You're caught up.";
        meta = timeMode === 'latenight'
          ? 'The sky has your back tonight. The next one shifts at 6am.'
          : timeMode === 'evening'
            ? 'Tomorrow shifts at 6am. Tonight is yours.'
            : 'Use today slowly. The reading still applies at 9pm.';
      }
      break;
    }
    default: break;
  }

  return (
    <View style={[
      cardSlotStyles.cardLifted,
      // Light mode override — softer, lighter shadow (flick SwipeCard.tsx:143).
      // Dark mode uses the strong default shadow defined in cardSlotStyles.cardLifted.
      !isDark && {
        shadowColor: 'rgba(44,47,49,0.5)',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
      },
      // Peek card has no shadow — prevents double-shadow stacking with the
      // active card on top of it.
      isPeek && { shadowOpacity: 0, elevation: 0 },
    ]}>
      <LinearGradient
        colors={gradient}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={cardSlotStyles.cardGradient}>

        {/* Top sheen */}
        <LinearGradient
          colors={isDark
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.0)']
            : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']}
          locations={[0, 0.4]}
          style={cardSlotStyles.sheen}
          pointerEvents="none"
        />

        {/* Content — anchor & sky use magazine-cover layout (left-aligned,
            motif top-left, date top-right). Other slots use centered layout. */}
        {(slot === 'anchor' || slot === 'sky') ? (
          <View style={cardSlotStyles.anchorContent}>
            {/* Header row: motif+tag (left) | date (right) */}
            <View style={cardSlotStyles.anchorHeader}>
              <View style={cardSlotStyles.anchorHeaderLeft}>
                {!!SLOT_MOTIF[slot] && (
                  <View style={[
                    cardSlotStyles.motifBadge,
                    {
                      backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(250,248,242,0.15)' : '#FED9B8',
                    },
                  ]}>
                    <CelestiaMotif kind={SLOT_MOTIF[slot]} size={44} color={cardFg} />
                  </View>
                )}
                {!!tag.label && (
                  <View style={[
                    cardSlotStyles.tagPillAnchor,
                    {
                      backgroundColor: isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)',
                      borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8',
                    },
                  ]}>
                    <Text style={[cardSlotStyles.tagLabel, { color: cardFg }]}>{tag.label}</Text>
                  </View>
                )}
              </View>
              {slot === 'anchor' && (
                <Text style={[cardSlotStyles.dateLabelInline, { color: cardFgMuted }]}>
                  {dateLabelLong(new Date(), period)}
                </Text>
              )}
            </View>

            {/* Body — left-aligned headline + meta + extras */}
            <View style={cardSlotStyles.anchorBody}>
              <Text
                style={[cardSlotStyles.headlineLeft, { color: cardFg }]}
                numberOfLines={3}
                ellipsizeMode="tail">
                {headline}
              </Text>
              {!!meta && (
                <Text
                  style={[cardSlotStyles.metaLeft, { color: cardFgMuted }]}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {meta}
                </Text>
              )}
              {/* Cosmic season chip — only on anchor card. Surfaces the user's
                  ongoing transit phase (e.g. "Saturn in Pisces · 73%"). */}
              {slot === 'anchor' && cosmicSeason && (
                <View style={[
                  cardSlotStyles.seasonChip,
                  {
                    backgroundColor: isDark ? 'rgba(254,217,184,0.16)' : 'rgba(254,217,184,0.45)',
                    borderColor: isDark ? 'rgba(254,217,184,0.30)' : '#FED9B8',
                  },
                ]}>
                  <Text style={[cardSlotStyles.seasonLabel, { color: cardFgMuted }]}>YOUR SEASON</Text>
                  <Text style={[cardSlotStyles.seasonValue, { color: cardFg }]} numberOfLines={1}>
                    {cosmicSeason.planet} in {cosmicSeason.natalTarget}
                    {typeof cosmicSeason.progress === 'number' ? ` · ${cosmicSeason.progress}%` : ''}
                  </Text>
                </View>
              )}
              {extras}
            </View>
          </View>
        ) : (
          <View style={cardSlotStyles.contentInner}>
            {/* Motif badge — fine-line SVG icon stamp above the tag pill.
                The 'report' slot doesn't have a CelestiaMotif kind because the
                glyph varies per pick; fall back to rendering the planetary
                glyph (♀ ♄ ☽ ♃ ☉ ☿ etc) as text. */}
            {(SLOT_MOTIF[slot] || slot === 'report') && (
              <View style={[
                cardSlotStyles.motifBadge,
                {
                  backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(250,248,242,0.15)' : 'rgba(26,20,16,0.08)',
                },
              ]}>
                {SLOT_MOTIF[slot] ? (
                  <CelestiaMotif kind={SLOT_MOTIF[slot]} size={44} color={cardFg} />
                ) : (
                  <Text style={[cardSlotStyles.reportGlyph, { color: cardFg }]}>
                    {cardData?.report?.glyph || '✦'}
                  </Text>
                )}
              </View>
            )}
            {!!tag.label && (
              <View style={[
                cardSlotStyles.tagPill,
                {
                  backgroundColor: isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)',
                  borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8',
                },
              ]}>
                <Text style={[cardSlotStyles.tagLabel, { color: cardFg }]}>{tag.label}</Text>
              </View>
            )}
            <Text
              style={[cardSlotStyles.headline, { color: cardFg }]}
              numberOfLines={3}
              ellipsizeMode="tail">
              {headline}
            </Text>
            {!!meta && (
              <Text
                style={[cardSlotStyles.meta, { color: cardFgMuted }]}
                numberOfLines={2}
                ellipsizeMode="tail">
                {meta}
              </Text>
            )}
            {extras}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}


// ──────────────────────────────────────────────────────────────
// STYLES — page level
// ──────────────────────────────────────────────────────────────
const TOP_PAD = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 48) + 14;
const TAB_BAR_PAD = 110;

const styles = StyleSheet.create({
  page: { flex: 1 },

  fillCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontFamily: FONTS.editorial, fontSize: 22, textAlign: 'center', marginBottom: 16 },
  emptyCta: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 100 },
  emptyCtaText: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: '#FAF8F2' },
  loadingText: { fontFamily: FONTS.sans, fontSize: 13, marginTop: 14 },

  topChrome: {
    paddingTop: TOP_PAD,
    paddingHorizontal: 22,
    alignItems: 'center',
    position: 'relative',
    minHeight: 48,
    justifyContent: 'center',
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { height: 4, borderRadius: 2 },
  // Avatar floats absolute right so the dots can sit naturally centered
  // in the row without competing for space.
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', right: 22, top: TOP_PAD },
  streakText: { fontFamily: FONTS.sansSemiBold, fontSize: 12, letterSpacing: 0.3 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FONTS.editorial, fontSize: 16 },
  // Period toggle (Today / Week / Month) — segmented pill, centered.
  periodRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  periodSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  periodPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
  },
  periodLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  dateLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2.4,
    paddingHorizontal: 28, marginTop: 12,
    textAlign: 'center',
  },
  kicker: { fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 3 },

  // deck area — outer flex centers the inner cardStack
  deckArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  // cardStack — fixed-size container that holds peek + active cards.
  // Both children use cardAbsolute (top:0,left:0,...) to absolutely fill
  // this stack, so they overlap perfectly regardless of transforms.
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardAbsolute: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  // Behind card — full opacity, slightly smaller. Hidden under the active
  // card when both are at the same position; revealed as active flies off.
  cardBehind: {
    transform: [{ scale: 0.96 }],
  },

  // bottom action chips
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: TAB_BAR_PAD + 18,
  },
  chipSmall: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  chipIcon: { fontSize: 24 },
  // Outer shadow wrapper for the gradient pill
  chipLargeShadow: {
    borderRadius: 100,
    shadowColor: '#5C2434',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  // Gradient inner — the actual visible pill
  chipLargeGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 100,
    minWidth: 170,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLargeText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

// ──────────────────────────────────────────────────────────────
// STYLES — card
// ──────────────────────────────────────────────────────────────
const cardSlotStyles = StyleSheet.create({
  // Lifted card — Stitch designer spec, tuned for clean swipe transitions.
  // backgroundColor matches the page-cream so any sub-pixel edge artifact
  // during transform animations blends with the page (instead of flashing
  // a hard white "frame" around the card, which the user sees as boxing).
  cardLifted: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#FCF9F8',  // page bg — invisible at edges
    shadowColor: '#645787',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    paddingVertical: 32,
    paddingHorizontal: 32,
  },
  // Outer 1px white-ish border — gives the glass panel its edge
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
  },
  // Inner decorative border — barely visible, kept subtle so it doesn't
  // read as a "padding outline" during swipe transitions.
  innerBorder: {
    position: 'absolute',
    top: 8, left: 8, right: 8, bottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    opacity: 0.18,
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  contentInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 6,
  },
  // Anchor card uses magazine-cover layout (left-aligned content + top-right date)
  anchorContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  anchorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  anchorHeaderLeft: {
    alignItems: 'flex-start',
    gap: 12,
  },
  anchorBody: {
    paddingTop: 8,
  },
  dateLabelInline: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    marginTop: 12,
  },
  tagPillAnchor: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 100,
    borderWidth: 1,
  },
  headlineLeft: {
    fontFamily: FONTS.editorialMedium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'left',
    marginBottom: 12,
  },
  metaLeft: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
    maxWidth: '92%',
  },
  // Cosmic season chip on the anchor card — small pill below meta.
  seasonChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    marginTop: 12,
    maxWidth: '92%',
  },
  seasonLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  seasonValue: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    flexShrink: 1,
  },
  // Motif badge — circular icon stamp above the tag pill (Stitch-inspired).
  // Bumped to 84×84 with a 44px glyph so the slot identity reads at a glance.
  motifBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  motifGlyph: {
    fontSize: 38,
    lineHeight: 40,
  },
  reportGlyph: {
    fontFamily: FONTS.editorial,
    fontSize: 44,
    lineHeight: 48,
    textAlign: 'center',
  },
  // Tag pill — uppercase label in a soft-tinted chip (icon now lives in motif above)
  tagPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: 18,
  },
  tagLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  // Legacy kicker (kept for fallback if needed)
  kicker: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 3,
    marginBottom: 22,
  },
  headline: {
    fontFamily: FONTS.editorialMedium,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 14,
  },
  meta: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  // Sky context tags (chip row below data widgets) — tightened to fit
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  contextTag: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 100,
    borderWidth: 1,
  },
  contextTagText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  // Reflect card feeling chips
  feelingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  feelingChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
  },
  feelingChipText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
  },
  // Data widget row — side-by-side cells for Sky card (vertical stack
  // overflows the 4/5 card height when combined with headline + chips).
  dataRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 14,
  },
  dataCell: {
    flex: 1,
    minWidth: 0,        // critical: lets the cell shrink below its content's natural width
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  dataLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  dataValue: {
    fontFamily: FONTS.editorialMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  dataDetail: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  brand: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginTop: 12,
  },
});

