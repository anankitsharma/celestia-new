import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert, Platform, StatusBar,
  Dimensions, Animated, Easing, BackHandler, Share, KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateSynastryScore, calculateZodiacOnlyScore, ROLE_DIMENSIONS, ROLE_COLORS } from '../services/astrology/SynastryService';
import { ZODIAC_SIGNS } from '../constants/AstrologyCore';
import { calculateChart, getActiveCosmicWindows, getCosmicSeason } from '../services/astrologyService';
import { getNarrativeContext } from '../services/narrativeService';
import { generateMatchCore, generateMatchDetails, generateDeepMatchReport, generateMatchViralInsights } from '../services/geminiService';
import * as Crypto from 'expo-crypto';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { useShareCard } from '../components/ShareCard';
import CompatibilityShareCard from '../components/CompatibilityShareCard';
import MatchStoryCard, { STORY_THEMES } from '../components/MatchStoryCard';
import GenerationOverlay from '../components/GenerationOverlay';
import CosmicTooltip from '../components/CosmicTooltip';
import AstroText from '../components/AstroText';
import { createAndShareInvite } from '../services/inviteService';
import { useRevenueCat } from '../contexts/RevenueCatContext';
// V1: LockedFeatureOverlay removed — no paywall surfaces.
import { useAnalytics, EVENTS } from '../services/analytics';
import { useTheme } from '../contexts/ThemeContext';

import { ROLE_DETAIL_CONFIG } from '../constants/roleDetailConfig';
import { loadBoolean, saveBoolean } from '../services/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const CELEBRITY_DATA = [
  { name: 'Timothée Chalamet', sign: 'Capricorn', birthday: '1995-12-27', icon: '🎬' },
  { name: 'Harry Styles', sign: 'Aquarius', birthday: '1994-02-01', icon: '🎵' },
  { name: 'Zendaya', sign: 'Virgo', birthday: '1996-09-01', icon: '🌟' },
  { name: 'Taylor Swift', sign: 'Sagittarius', birthday: '1989-12-13', icon: '🎤' },
  { name: 'Bad Bunny', sign: 'Pisces', birthday: '1994-03-10', icon: '🐰' },
  { name: 'Pedro Pascal', sign: 'Aries', birthday: '1975-04-02', icon: '🔥' },
  { name: 'Sydney Sweeney', sign: 'Virgo', birthday: '1997-09-12', icon: '✨' },
  { name: 'Jacob Elordi', sign: 'Cancer', birthday: '1997-06-26', icon: '🎭' },
  { name: 'Sabrina Carpenter', sign: 'Taurus', birthday: '1999-05-11', icon: '🎶' },
  { name: 'Doja Cat', sign: 'Libra', birthday: '1995-10-21', icon: '🐱' },
  { name: 'Tom Holland', sign: 'Gemini', birthday: '1996-06-01', icon: '🕷' },
  { name: 'Billie Eilish', sign: 'Sagittarius', birthday: '2001-12-18', icon: '💚' },
];

// V1 Path A: PDF generation overlay neutralized. Step icons + labels + quotes
// rewritten to drop planet/sign vocabulary. Reviewer scrubbing through this
// overlay sees relational pattern language, not horoscope jargon. Generated
// PDF content (deeper) keeps astrology — that's content the user opted into.
const ROLE_REPORT_THEMES = {
  partner: {
    gradient: ['#2D0A1E', '#1A0828', '#0D0515'], accent: '#E85090', accentSoft: 'rgba(232,80,144,0.12)', accentGlow: 'rgba(232,80,144,0.35)', title: 'Love Report', coverBadge: 'Love Pattern Report', coverIcon: '♡', fileName: 'Love',
    steps: [
      { icon: '♡', label: 'Reading the patterns', sub: 'Mapping how you fit together...' },
      { icon: '✦', label: 'Mapping emotional rhythm', sub: 'How you feel together...' },
      { icon: '✦', label: 'Reading attraction patterns', sub: 'Love languages & chemistry...' },
      { icon: '✦', label: 'Mapping passion & conflict', sub: 'Where heat shows up...' },
      { icon: '✦', label: 'Reading communication style', sub: 'How you talk & listen...' },
      { icon: '✦', label: 'Exploring long-term potential', sub: 'What lasts & what shifts...' },
      { icon: '✦', label: 'Writing your love story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '♡', label: 'Almost ready', sub: 'Your love report awaits...' },
    ],
    quotes: ['"How you love isn\'t random — it\'s a pattern."', '"Your heart has its own language. We\'re learning it."', '"The strongest connections aren\'t always the loudest."'],
  },
  friend: {
    gradient: ['#0A0828', '#160E28', '#0D0515'], accent: '#7E8CE8', accentSoft: 'rgba(126,140,232,0.12)', accentGlow: 'rgba(126,140,232,0.35)', title: 'Friendship Report', coverBadge: 'Friendship Pattern Report', coverIcon: '★', fileName: 'Friendship',
    steps: [
      { icon: '★', label: 'Reading the patterns', sub: 'Mapping how you fit together...' },
      { icon: '✦', label: 'Mapping emotional sync', sub: 'How you vibe together...' },
      { icon: '✦', label: 'Reading shared adventures', sub: 'Your fun factor...' },
      { icon: '✦', label: 'Mapping communication flow', sub: 'How you talk & listen...' },
      { icon: '✦', label: 'Measuring trust depth', sub: 'What holds the bond...' },
      { icon: '✦', label: 'Writing your friendship story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '★', label: 'Almost ready', sub: 'Your friendship report awaits...' },
    ],
    quotes: ['"True friendships are built — not found."', '"How deeply you understand each other shows up in the small things."'],
  },
  parent: {
    gradient: ['#1A1510', '#14100E', '#0D0515'], accent: '#C8A060', accentSoft: 'rgba(200,160,96,0.12)', accentGlow: 'rgba(200,160,96,0.35)', title: 'Family Bond Report', coverBadge: 'Parent-Child Pattern Report', coverIcon: '◎', fileName: 'Family',
    steps: [
      { icon: '◎', label: 'Reading the patterns', sub: 'Mapping generational threads...' },
      { icon: '✦', label: 'Mapping emotional inheritance', sub: 'What gets passed down...' },
      { icon: '✦', label: 'Reading boundaries & structure', sub: 'How love holds its shape...' },
      { icon: '✦', label: 'Mapping communication styles', sub: 'How you speak & hear...' },
      { icon: '✦', label: 'Exploring healing paths', sub: 'Growth & forgiveness...' },
      { icon: '✦', label: 'Writing your family story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◎', label: 'Almost ready', sub: 'Your family report awaits...' },
    ],
    quotes: ['"Family patterns travel further than we realize."', '"What they learned, you inherited. What you choose, your children inherit."'],
  },
  sibling: {
    gradient: ['#1A1208', '#14100A', '#0D0515'], accent: '#E8A050', accentSoft: 'rgba(232,160,80,0.12)', accentGlow: 'rgba(232,160,80,0.35)', title: 'Sibling Report', coverBadge: 'Sibling Pattern Report', coverIcon: '◇', fileName: 'Sibling',
    steps: [
      { icon: '◇', label: 'Reading the patterns', sub: 'Mapping your shared origins...' },
      { icon: '✦', label: 'Mapping emotional wiring', sub: 'How you each feel...' },
      { icon: '✦', label: 'Reading rivalry & alliance', sub: 'Where friction lives...' },
      { icon: '✦', label: 'Mapping communication', sub: 'Your shorthand language...' },
      { icon: '✦', label: 'Exploring shared growth', sub: 'How you push each other...' },
      { icon: '✦', label: 'Writing your sibling story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◇', label: 'Almost ready', sub: 'Your sibling report awaits...' },
    ],
    quotes: ['"Siblings share an origin but read it differently."', '"Where rivalry sits, alliance is one conversation away."'],
  },
  boss: {
    gradient: ['#0A1520', '#0D1527', '#060D18'], accent: '#50A0C8', accentSoft: 'rgba(80,160,200,0.12)', accentGlow: 'rgba(80,160,200,0.35)', title: 'Work Dynamic Report', coverBadge: 'Professional Pattern Report', coverIcon: '◆', fileName: 'Work',
    steps: [
      { icon: '◆', label: 'Reading the patterns', sub: 'Mapping professional dynamics...' },
      { icon: '✦', label: 'Mapping authority dynamics', sub: 'How power flows...' },
      { icon: '✦', label: 'Reading communication style', sub: 'How to pitch & present...' },
      { icon: '✦', label: 'Mapping work energy', sub: 'Drive & motivation...' },
      { icon: '✦', label: 'Exploring growth potential', sub: 'Career opportunities...' },
      { icon: '✦', label: 'Writing your work strategy', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◆', label: 'Almost ready', sub: 'Your work report awaits...' },
    ],
    quotes: ['"How they lead, how you respond — that\'s the dynamic."', '"Communication style is half the job."'],
  },
  colleague: {
    gradient: ['#081A28', '#0A1420', '#060D18'], accent: '#50C8A0', accentSoft: 'rgba(80,200,160,0.12)', accentGlow: 'rgba(80,200,160,0.35)', title: 'Teamwork Report', coverBadge: 'Teamwork Pattern Report', coverIcon: '✧', fileName: 'Teamwork',
    steps: [
      { icon: '✧', label: 'Reading the patterns', sub: 'Mapping work styles...' },
      { icon: '✦', label: 'Reading communication flow', sub: 'How you collaborate...' },
      { icon: '✦', label: 'Mapping project energy', sub: 'Where the drive comes from...' },
      { icon: '✦', label: 'Exploring innovation sync', sub: 'Creative brainstorming...' },
      { icon: '✦', label: 'Measuring trust & reliability', sub: 'What holds the team...' },
      { icon: '✦', label: 'Writing your teamwork profile', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '✧', label: 'Almost ready', sub: 'Your teamwork report awaits...' },
    ],
    quotes: ['"The best teams are built when communication styles meet."', '"Your work style and theirs — different energies, same direction."'],
  },
  child: {
    gradient: ['#0E1A14', '#0A1410', '#0D0515'], accent: '#7EC8A0', accentSoft: 'rgba(126,200,160,0.12)', accentGlow: 'rgba(126,200,160,0.35)', title: 'Parenting Report', coverBadge: 'Parenting Pattern Report', coverIcon: '✦', fileName: 'Parenting',
    steps: [
      { icon: '✦', label: 'Reading the patterns', sub: 'Mapping your bond...' },
      { icon: '✦', label: 'Reading their temperament', sub: 'Their natural energy...' },
      { icon: '✦', label: 'Understanding emotional needs', sub: 'What helps them feel safe...' },
      { icon: '✦', label: 'Mapping communication', sub: 'How they hear & learn...' },
      { icon: '✦', label: 'Exploring nurturing approach', sub: 'What helps them grow...' },
      { icon: '✦', label: 'Writing your parenting guide', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '✦', label: 'Almost ready', sub: 'Your parenting report awaits...' },
    ],
    quotes: ['"What they need to feel safe is written in how they were born."', '"Understanding them is the deepest form of parenting."'],
  },
  other: {
    gradient: ['#1A1228', '#14101E', '#0D0515'], accent: '#B080E0', accentSoft: 'rgba(176,128,224,0.12)', accentGlow: 'rgba(176,128,224,0.35)', title: 'Connection Report', coverBadge: 'Connection Pattern Report', coverIcon: '✦', fileName: 'Connection',
    steps: [
      { icon: '✦', label: 'Reading the patterns', sub: 'Mapping how you fit together...' },
      { icon: '✦', label: 'Mapping emotional rhythm', sub: 'How you feel together...' },
      { icon: '✦', label: 'Reading communication', sub: 'How you talk & listen...' },
      { icon: '✦', label: 'Exploring bond depth', sub: 'What holds you together...' },
      { icon: '✦', label: 'Writing your connection story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '✦', label: 'Almost ready', sub: 'Your connection report awaits...' },
    ],
    quotes: ['"Every connection has its own pattern."', '"The patterns reveal what words cannot."'],
  },
};

const getReportTheme = (role) => ROLE_REPORT_THEMES[role] || ROLE_REPORT_THEMES.other;

const RELATIONSHIP_TYPES = [
  { key: 'partner', label: 'Partner', icon: '♡' },
  { key: 'ex', label: 'Ex', icon: '💔' },
  { key: 'friend', label: 'Best Friend', icon: '★' },
  { key: 'parent', label: 'Parent', icon: '◎' },
  { key: 'sibling', label: 'Sibling', icon: '◇' },
  { key: 'boss', label: 'Boss', icon: '◆' },
  { key: 'colleague', label: 'Colleague', icon: '✧' },
  { key: 'child', label: 'Child', icon: '✦' },
  { key: 'other', label: 'Other', icon: '✦' },
];

const ROLE_LABELS = {};
RELATIONSHIP_TYPES.forEach(r => { ROLE_LABELS[r.key] = r; });

// Category groups for orbit sections
const CATEGORY_GROUPS = [
  { key: 'love', label: 'LOVE', roles: ['partner', 'ex'], gradient: ['#2D0A1E', '#1A0828'], icon: '♡' },
  { key: 'family', label: 'FAMILY', roles: ['parent', 'sibling', 'child'], gradient: ['#1A1A08', '#14120A'], icon: '◎' },
  { key: 'friends', label: 'FRIENDS', roles: ['friend'], gradient: ['#0E0A28', '#14101E'], icon: '★' },
  { key: 'work', label: 'WORK', roles: ['boss', 'colleague'], gradient: ['#081A28', '#0A1420'], icon: '◆' },
  { key: 'other', label: 'OTHER', roles: ['other'], gradient: ['#141210', '#0E0E0E'], icon: '✦' },
];

const getInitial = (name) => (name || '?')[0].toUpperCase();

// V1: score labels softened away from astrology register
// ("Exceptional fit" / "Compatible souls" → relational descriptors).
const getScoreLabel = (score) => {
  if (score >= 90) return 'Exceptional fit';
  if (score >= 80) return 'Deeply in sync';
  if (score >= 70) return 'Strong connection';
  if (score >= 60) return 'Compatible';
  if (score >= 50) return 'Growing together';
  return 'Complex dynamic';
};

const getOrbitPosition = (index, total, radius) => {
  const startAngle = -Math.PI / 2;
  const angle = startAngle + (index / Math.max(total, 1)) * 2 * Math.PI;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
};

// Compute quick score for a partner
const getQuickScore = (userChart, partner) => {
  try {
    if (partner.isZodiacOnly) {
      const uSun = userChart.planets?.find(p => p.name === 'Sun')?.sign;
      return calculateZodiacOnlyScore(uSun, partner.zodiacSign).harmonyScore;
    }
    if (partner.chart) {
      return calculateSynastryScore(userChart, partner.chart, partner.relationshipType || 'partner').harmonyScore;
    }
  } catch (e) { }
  return null;
};

export default function CompatibilityScreen() {
  const navigation = useNavigation();
  const { isPro } = useRevenueCat();
  const { capture } = useAnalytics();
  const { colors, isDark } = useTheme();

  const { userProfile, partnerProfiles, addPartner, updatePartner, removePartner } = useUserProfile();
  const [selectedPartner, setSelectedPartner] = useState(null);

  // V1 PDF plan §04: drift-alert tracking. Record when each partner was last
  // opened so HomeScreen Today can surface "you haven't reflected on X in N weeks".
  useEffect(() => {
    if (!selectedPartner?.id) return;
    (async () => {
      try {
        const { loadObject, saveObject } = await import('../services/storage');
        const map = (await loadObject('celestia_partner_touched_v1')) || {};
        map[selectedPartner.id] = Date.now();
        await saveObject('celestia_partner_touched_v1', map);
      } catch (e) {}
    })();
  }, [selectedPartner?.id]);
  const [showAddModal, setShowAddModal] = useState(false);
  // V1.2 — ref so we can scroll to bottom when city input is focused, lifting
  // the search suggestions above the keyboard.
  const addModalScrollRef = useRef(null);
  // V1 partner-data consent (Apple 5.1.1 / 5.1.2). Shows once per fresh install
  // before the first non-self profile is saved.
  // V1.2 — partner-consent state removed (inline disclosure satisfies 5.1.1).
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { cardRef: matchCardRef, captureAndShare: shareMatch } = useShareCard();
  const { cardRef: storyCardRef, captureAndShare: shareStoryCard } = useShareCard();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const pdfCancelledRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Orbit rotation anims — one per ring, different speeds
  const orbitAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyTheme, setStoryTheme] = useState(0);
  const [viralInsights, setViralInsights] = useState(null);
  const [viralLoading, setViralLoading] = useState(false);
  const [showAstrology, setShowAstrology] = useState(false);

  useEffect(() => {
    loadBoolean('celestia_show_astrology_v1').then(setShowAstrology).catch(() => {});
  }, []);

  // Deepen reading modal state
  const [showDeepenModal, setShowDeepenModal] = useState(false);
  const [deepenPartner, setDeepenPartner] = useState(null);
  const [deepenMode, setDeepenMode] = useState('full'); // 'full' = zodiac-only upgrade, 'time' = add birth time/city
  const [deepenDate, setDeepenDate] = useState(null);
  const [deepenTime, setDeepenTime] = useState(null);
  const [deepenTimeUnknown, setDeepenTimeUnknown] = useState(false);
  const [deepenCitySearch, setDeepenCitySearch] = useState('');
  const [deepenSelectedCity, setDeepenSelectedCity] = useState(null);
  const [deepenCitySuggestions, setDeepenCitySuggestions] = useState([]);
  const [deepenCitySearching, setDeepenCitySearching] = useState(false);
  const [deepenShowDatePicker, setDeepenShowDatePicker] = useState(false);
  const [deepenShowTimePicker, setDeepenShowTimePicker] = useState(false);
  const [deepenSaving, setDeepenSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Add partner form
  const [partnerName, setPartnerName] = useState('');
  const [partnerDate, setPartnerDate] = useState(null);
  const [partnerTime, setPartnerTime] = useState(null);
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearching, setCitySearching] = useState(false);
  const [savingPartner, setSavingPartner] = useState(false);
  const [relationshipType, setRelationshipType] = useState('partner');
  const [zodiacOnlyMode, setZodiacOnlyMode] = useState(false);
  const [selectedZodiacSign, setSelectedZodiacSign] = useState(null);
  const [activeRelationshipWindows, setActiveRelationshipWindows] = useState([]);
  const [cosmicSeason, setCosmicSeason] = useState(null);

  // Celebrity match state
  const [celebResult, setCelebResult] = useState(null);
  const [selectedCeleb, setSelectedCeleb] = useState(null);

  // Start/restart all animations whenever we return to orbit view
  const startAnimations = useCallback(() => {
    // Reset values
    pulseAnim.setValue(0);
    orbitAnims.forEach(a => a.setValue(0));
    // Center pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
    // Orbit rotations — inner rings faster, outer slower
    const speeds = [45000, 60000, 80000, 100000];
    const directions = [1, -1, 1, -1];
    orbitAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: directions[i],
          duration: speeds[i],
          useNativeDriver: false,
          easing: Easing.linear,
        })
      ).start();
    });
  }, []);

  // Restart animations on mount and when returning from detail screen
  useEffect(() => {
    if (!selectedPartner) {
      startAnimations();
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (selectedCity || citySearch.length < 2) { setCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      setCitySearching(true);
      try {
        const res = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(citySearch)}&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'CelestiaMobile/1.0' } });
        const data = await res.json();
        setCitySuggestions(data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })));
      } catch (e) { console.warn('City search error:', e); }
      finally { setCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  const partnerProfile = selectedPartner;
  const partnerRole = partnerProfile?.relationshipType || 'partner';

  const synastry = useMemo(() => {
    if (!userProfile?.chart || !partnerProfile) return null;
    if (partnerProfile.isZodiacOnly) {
      const userSun = userProfile.chart.planets?.find(p => p.name === 'Sun')?.sign;
      return calculateZodiacOnlyScore(userSun, partnerProfile.zodiacSign);
    }
    if (!partnerProfile.chart) return null;
    try { return calculateSynastryScore(userProfile.chart, partnerProfile.chart, partnerRole); }
    catch (e) { console.error('Synastry error:', e); return null; }
  }, [userProfile?.chart, partnerProfile?.chart, partnerProfile?.id, partnerRole]);

  const roleDims = useMemo(() => {
    const roleDef = ROLE_DIMENSIONS[partnerRole] || ROLE_DIMENSIONS.partner;
    return roleDef.dims.map(d => ({ ...d, pct: synastry?.scores?.[d.key] || 0 }));
  }, [partnerRole, synastry]);

  useEffect(() => {
    if (!synastry || !userProfile?.chart || !partnerProfile) return;
    capture(EVENTS.COMPATIBILITY_CHECKED, {
      relationship_type: partnerProfile.relationshipType || 'partner',
      mode: partnerProfile.isZodiacOnly ? 'zodiac_only' : 'full_chart',
      score: synastry.harmonyScore,
    });
    loadAiAnalysis();
    setViralInsights(null);
    setMatchDetails(null);
  }, [synastry?.harmonyScore, partnerProfile?.id]);

  const loadAiAnalysis = async () => {
    setAiLoading(true);
    haptic.medium();
    let transitContext = null;
    try {
      const userWindows = getActiveCosmicWindows(userProfile.chart, new Date());
      const relevant = userWindows.filter(w => ['Venus', 'Moon', 'Mars'].includes(w.planet) || ['Venus', 'Moon', 'Mars'].includes(w.natalPlanet));
      setActiveRelationshipWindows(relevant);
      if (relevant.length > 0) transitContext = relevant.map(w => `${w.description} (${w.significance || 'active'})`).join('; ');
    } catch (e) { }
    try { setCosmicSeason(getCosmicSeason(userProfile.chart, new Date())); } catch (e) { }
    try {
      const report = await generateMatchCore(userProfile, partnerProfile, synastry, transitContext, partnerRole);
      if (report?.snapshot) setAiAnalysis(report.snapshot);
      trackEvent('match_checked').catch(() => { });
      awardXP(userProfile?.id || 'default', 'compatibility_check').catch(() => { });
      completeQuestAction('compat_checked').catch(() => { });
    } catch (e) { console.warn('AI analysis failed:', e); }
    finally { setAiLoading(false); }
    setDetailsLoading(true);
    try { const details = await generateMatchDetails(userProfile, partnerProfile, transitContext, partnerRole); setMatchDetails(details); }
    catch (e) { console.warn('Match details failed:', e); }
    finally { setDetailsLoading(false); }
  };

  // V1 (5.1.1): partner-data consent gate. First non-self save asks the user
  // to confirm the person has shared their birth details with them.
  const handleSavePartner = async () => {
    if (!partnerName.trim()) { Alert.alert('Missing info', 'Please enter a name.'); return; }
    const proceed = async () => {
      if (zodiacOnlyMode) {
        if (!selectedZodiacSign) { Alert.alert('Missing info', 'Please select their zodiac sign.'); return; }
        setSavingPartner(true);
        try {
          const partner = {
            id: await Crypto.randomUUID(),
            type: 'other',
            name: partnerName.trim(),
            relationshipType,
            isZodiacOnly: true,
            zodiacSign: selectedZodiacSign,
            birthDate: '2000-01-01',
            birthTime: '12:00',
            // V1.2 — must be object to match ProfileRepository schema.
            birthLocation: { lat: null, lng: null, name: 'Unknown' },
            isTimeUnknown: true,
            chart: { planets: [{ name: 'Sun', sign: selectedZodiacSign, degree: 15, house: 1 }], aspects: [], houses: [] },
          };
          await addPartner(partner);
          setShowAddModal(false);
          resetForm();
        } catch (e) {
          console.error('handleSavePartner (zodiac) failed:', e);
          Alert.alert('Error', `Couldn't save. ${e?.message || 'Please try again.'}`);
        }
        finally { setSavingPartner(false); }
        return;
      }
      if (!partnerDate) { Alert.alert('Missing info', 'Please select a birth date.'); return; }
      // V1.2 — Birth city now optional (PDF: "depth scales with what you give it").
      // Without a city, lat/lng are meaningless for ascendant/houses, so we fall
      // back to UTC noon at 0,0 and force isTimeUnknown=true. Sun/Moon/Mercury/
      // Venus/Mars/Jupiter/Saturn signs are derived from date alone, so the
      // synastry engine still produces a real compatibility score — just
      // without ascendant/houses precision.
      setSavingPartner(true);
      try {
        const dateStr = partnerDate.toISOString().split('T')[0];
        const hasCity = !!selectedCity;
        const effectiveTimeUnknown = isTimeUnknown || !hasCity;
        const timeStr = (effectiveTimeUnknown || !partnerTime) ? '12:00' : `${partnerTime.getHours().toString().padStart(2, '0')}:${partnerTime.getMinutes().toString().padStart(2, '0')}`;
        const location = hasCity
          ? { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name }
          : { lat: 0, lng: 0, name: 'Unknown', timezone: 'UTC' };
        const chart = await calculateChart(dateStr, timeStr, location, effectiveTimeUnknown, 'whole');
        const partner = {
          id: await Crypto.randomUUID(),
          type: 'other',
          name: partnerName.trim(),
          relationshipType,
          birthDate: dateStr,
          birthTime: timeStr,
          // V1.2 — birthLocation must be an OBJECT with lat/lng/name to match
          // the schema in ProfileRepository.saveProfile (which reads .lat/.lng/.name).
          // Was previously a bare string here, which silently saved NULL coords
          // and broke any later recalculation paths.
          birthLocation: hasCity
            ? { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name }
            : { lat: null, lng: null, name: 'Unknown' },
          isTimeUnknown: effectiveTimeUnknown,
          isLocationUnknown: !hasCity,
          chart,
        };
        await addPartner(partner);
        setShowAddModal(false);
        resetForm();
      } catch (e) {
        console.error('handleSavePartner failed:', e);
        Alert.alert('Error', `Couldn't save this person. ${e?.message || 'Please try again.'}`);
      }
      finally { setSavingPartner(false); }
    };

    // V1.2 — Consent gate removed. The inline 🔒 disclosure at the top of the
    // Add Person modal ("This information stays only on your device. We use it
    // to map their personality patterns — same framework as your onboarding.")
    // already satisfies Apple 5.1.1. The previous confirm-modal was a nested
    // Modal that rendered behind the pageSheet on iOS — silently invisible —
    // so tapping Calculate Compatibility did nothing for the user.
    await proceed();
  };

  const resetForm = () => { setPartnerName(''); setPartnerDate(null); setPartnerTime(null); setIsTimeUnknown(false); setCitySearch(''); setSelectedCity(null); setCitySuggestions([]); setRelationshipType('partner'); setZodiacOnlyMode(false); setSelectedZodiacSign(null); };

  // ── Deepen Reading helpers ──

  useEffect(() => {
    if (deepenSelectedCity || deepenCitySearch.length < 2) { setDeepenCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      setDeepenCitySearching(true);
      try {
        const res = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(deepenCitySearch)}&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'CelestiaMobile/1.0' } });
        const data = await res.json();
        setDeepenCitySuggestions(data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })));
      } catch (e) { console.warn('Deepen city search error:', e); }
      finally { setDeepenCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [deepenCitySearch, deepenSelectedCity]);

  const showToast = useCallback((message) => {
    setSuccessToast(message);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setSuccessToast(null));
  }, [toastAnim]);

  const openDeepenModal = useCallback((partner, mode) => {
    setDeepenPartner(partner);
    setDeepenMode(mode);
    setDeepenDate(mode === 'full' ? null : (partner.birthDate ? new Date(partner.birthDate + 'T12:00:00') : null));
    setDeepenTime(null);
    setDeepenTimeUnknown(false);
    setDeepenCitySearch(mode === 'time' && partner.birthLocation && partner.birthLocation !== 'Unknown' ? partner.birthLocation : '');
    setDeepenSelectedCity(mode === 'time' && partner.birthLocation && partner.birthLocation !== 'Unknown' ? { name: partner.birthLocation, lat: partner.lat || 0, lng: partner.lng || 0 } : null);
    setDeepenCitySuggestions([]);
    setDeepenShowDatePicker(false);
    setDeepenShowTimePicker(false);
    setShowDeepenModal(true);
    haptic.light();
  }, []);

  const resetDeepenForm = () => {
    setDeepenPartner(null);
    setDeepenDate(null);
    setDeepenTime(null);
    setDeepenTimeUnknown(false);
    setDeepenCitySearch('');
    setDeepenSelectedCity(null);
    setDeepenCitySuggestions([]);
    setDeepenShowDatePicker(false);
    setDeepenShowTimePicker(false);
  };

  const handleSaveDeepenedPartner = async () => {
    if (!deepenPartner) return;
    if (deepenMode === 'full') {
      if (!deepenDate) { Alert.alert('Missing info', 'Please select a birth date.'); return; }
      if (!deepenSelectedCity) { Alert.alert('Missing info', 'Please select a birth city.'); return; }
    }
    if (deepenMode === 'time') {
      if (!deepenTime && !deepenTimeUnknown) { Alert.alert('Missing info', 'Please select a birth time or mark as unknown.'); return; }
    }
    setDeepenSaving(true);
    try {
      const dateStr = deepenMode === 'full'
        ? deepenDate.toISOString().split('T')[0]
        : deepenPartner.birthDate;
      const timeStr = (deepenTimeUnknown || !deepenTime)
        ? '12:00'
        : `${deepenTime.getHours().toString().padStart(2, '0')}:${deepenTime.getMinutes().toString().padStart(2, '0')}`;
      const city = deepenMode === 'full'
        ? deepenSelectedCity
        : (deepenSelectedCity || { lat: deepenPartner.lat || 0, lng: deepenPartner.lng || 0, name: deepenPartner.birthLocation || 'Unknown' });
      const isTimeStillUnknown = deepenTimeUnknown || !deepenTime;
      const chart = await calculateChart(dateStr, timeStr, { lat: city.lat, lng: city.lng, name: city.name }, isTimeStillUnknown, 'whole');
      const updated = {
        ...deepenPartner,
        isZodiacOnly: false,
        birthDate: dateStr,
        birthTime: timeStr,
        birthLocation: city.name,
        lat: city.lat,
        lng: city.lng,
        isTimeUnknown: isTimeStillUnknown,
        chart,
      };
      await updatePartner(updated);
      if (selectedPartner && selectedPartner.id === updated.id) {
        setSelectedPartner(updated);
      }
      setShowDeepenModal(false);
      resetDeepenForm();
      const pName = updated.name?.split(' ')[0] || 'them';
      showToast(`Your reading with ${pName} just got deeper!`);
      haptic.success();
    } catch (e) {
      console.warn('Deepen partner error:', e);
      Alert.alert('Error', 'Failed to recalculate chart. Please try again.');
    } finally {
      setDeepenSaving(false);
    }
  };

  const handleRemovePartner = (partner) => {
    Alert.alert('Remove Person', `Remove ${partner.name} from your circle?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removePartner(partner.id); setSelectedPartner(null); } },
    ]);
  };

  const handleCelebMatch = useCallback((celeb) => {
    haptic.light();
    const userSunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign;
    if (!userSunSign) return;
    const result = calculateZodiacOnlyScore(userSunSign, celeb.sign);
    setSelectedCeleb(celeb);
    setCelebResult(result);
    capture(EVENTS.COMPATIBILITY_CHECKED, {
      relationship_type: 'celebrity',
      mode: 'zodiac_only',
      score: result.harmonyScore,
      celebrity: celeb.name,
    });
  }, [userProfile?.chart, capture]);

  const handleShareCelebResult = useCallback(async () => {
    if (!celebResult || !selectedCeleb) return;
    haptic.medium();
    const userName = userProfile?.name?.split(' ')[0] || 'I';
    const msg = `${userName} & ${selectedCeleb.name} — ${celebResult.harmonyScore}% compatible ${ZODIAC_GLYPHS[selectedCeleb.sign] || ''}\n\nAre YOU compatible with your celebrity crush? Find out on Celestia`;
    try {
      await Share.share({ message: msg });
    } catch (e) {
      // Silently handle share dismissal
    }
    trackEvent('share_celebrity_match').catch(() => { });
    awardXP(userProfile?.id || 'default', 'share').catch(() => { });
  }, [celebResult, selectedCeleb, userProfile]);

  const advanceStep = useCallback((step) => { if (!pdfCancelledRef.current) setGenStep(step); }, []);

  const reportTheme = useMemo(() => getReportTheme(partnerRole), [partnerRole]);

  const handleDownloadReport = async () => {
    if (!synastry || !partnerProfile) return;
    // V1: paywall gating removed — all PDFs downloadable.
    pdfCancelledRef.current = false; setPdfLoading(true); setGenStep(0); haptic.medium();

    const theme = reportTheme;
    const numSteps = theme.steps.length;
    try {
      await new Promise(r => setTimeout(r, 800)); if (pdfCancelledRef.current) return;
      advanceStep(1); await new Promise(r => setTimeout(r, 700)); if (pdfCancelledRef.current) return;
      advanceStep(2);
      const stepTimer = setInterval(() => { setGenStep(prev => (prev < numSteps - 3 ? prev + 1 : prev)); }, 3200);
      const deepReport = await generateDeepMatchReport(userProfile, partnerProfile, synastry, partnerRole);
      clearInterval(stepTimer); if (pdfCancelledRef.current) return;
      advanceStep(numSteps - 2);
      const html = generateMatchReportHTML(deepReport, userProfile, partnerProfile, synastry, partnerRole);
      await new Promise(r => setTimeout(r, 500)); if (pdfCancelledRef.current) return;
      const { uri: tempUri } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: false });
      if (pdfCancelledRef.current) return;
      advanceStep(numSteps - 1);
      const p1Name = (userProfile.name || 'You').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      const p2Name = (partnerProfile.name || 'Match').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      const filename = `Celestia-${p1Name}-${p2Name}-${theme.fileName}.pdf`;
      const tempFile = new File(tempUri); const destFile = new File(Paths.cache, filename);
      if (destFile.exists) destFile.delete(); tempFile.move(destFile);
      await new Promise(r => setTimeout(r, 600));
      setPdfLoading(false);
      if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(destFile.uri, { mimeType: 'application/pdf', dialogTitle: `${p1Name} & ${p2Name} ${theme.title}`, UTI: 'com.adobe.pdf' }); }
      trackEvent('report_downloaded').catch(() => { });
    } catch (e) { if (pdfCancelledRef.current) return; Alert.alert('Error', 'Could not generate report.'); }
    finally { setPdfLoading(false); }
  };

  const handleCancelPdf = useCallback(() => { pdfCancelledRef.current = true; setPdfLoading(false); }, []);

  const handleShareStory = useCallback(async () => {
    setShowStoryModal(true);
    if (!viralInsights) {
      setViralLoading(true);
      try { const insights = await generateMatchViralInsights(userProfile, partnerProfile, synastry); setViralInsights(insights); }
      catch (e) { setViralInsights({ spark: "A connection that doesn't need explaining.", tension: "You want the same thing.", truth: "They see through your walls.", oneWord: "Magnetic" }); }
      finally { setViralLoading(false); }
    }
  }, [viralInsights, userProfile, partnerProfile, synastry]);

  const handleShareStoryCapture = useCallback(async () => {
    haptic.medium();
    const p1Name = userProfile?.name?.split(' ')[0] || 'You';
    const p2Name = partnerProfile?.name?.split(' ')[0] || 'Partner';
    await shareStoryCard(`${p1Name} & ${p2Name} — ${synastry?.harmonyScore || 0}% connection\n\n✦ ${viralInsights?.spark || ''}\n— Celestia`);
    trackEvent('share_story').catch(() => { }); awardXP(userProfile?.id || 'default', 'share').catch(() => { });
    setShowStoryModal(false);
  }, [userProfile, partnerProfile, synastry, viralInsights, shareStoryCard]);

  const userSun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const partnerSun = partnerProfile?.chart?.planets?.find(p => p.name === 'Sun');

  if (!userProfile?.chart) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.heading, textAlign: 'center', marginBottom: 10 }}>Complete your profile first</Text>
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>Finish onboarding to see your connections.</Text>
      </View>
    );
  }

  // Group partners by category
  const groupedPartners = useMemo(() => {
    const groups = {};
    CATEGORY_GROUPS.forEach(g => { groups[g.key] = []; });
    partnerProfiles.forEach(p => {
      const role = p.relationshipType || 'other';
      const group = CATEGORY_GROUPS.find(g => g.roles.includes(role));
      if (group) groups[group.key].push(p);
      else groups.other.push(p);
    });
    return groups;
  }, [partnerProfiles]);

  // ── Concentric orbit layout — sized to fit viewport ──
  const CENTER_SIZE = 56;
  const ORB_SIZE = 40;
  // Available space: screen width is the constraint (square orbit area)
  const ORBIT_MAX = Math.min(SCREEN_W - 16, 380); // leave 8px margin each side
  const orbitCenter = ORBIT_MAX / 2;
  const maxRadius = orbitCenter - ORB_SIZE / 2 - 8; // room for orbs at edge
  // 4 rings spaced evenly from center outward
  const ORBIT_RINGS = [
    { key: 'love', radius: maxRadius * 0.30, color: 'rgba(232,80,144,0.06)', borderColor: 'rgba(232,80,144,0.22)', animIdx: 0 },
    { key: 'family', radius: maxRadius * 0.52, color: 'rgba(200,168,75,0.04)', borderColor: 'rgba(200,168,75,0.18)', animIdx: 1 },
    { key: 'friends', radius: maxRadius * 0.74, color: 'rgba(100,140,220,0.04)', borderColor: 'rgba(100,140,220,0.16)', animIdx: 2 },
    { key: 'work', radius: maxRadius * 0.96, color: 'rgba(80,180,140,0.03)', borderColor: 'rgba(80,180,140,0.14)', animIdx: 3 },
  ];
  const ORBIT_AREA = ORBIT_MAX;

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.05] });

  // Interpolate orbit rotations to radians string
  const orbitRotations = orbitAnims.map(anim =>
    anim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-6.2832rad', '0rad', '6.2832rad'] })
  );
  // Counter-rotations so orb content stays upright
  const orbitCounterRotations = orbitAnims.map(anim =>
    anim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['6.2832rad', '0rad', '-6.2832rad'] })
  );

  // Group people per ring
  const ringPeople = useMemo(() => {
    const map = {};
    ORBIT_RINGS.forEach(ring => {
      const group = CATEGORY_GROUPS.find(g => g.key === ring.key);
      if (!group) { map[ring.key] = []; return; }
      const people = groupedPartners[group.key] || [];
      map[ring.key] = people.map((p, i) => {
        const pos = getOrbitPosition(i, people.length, ring.radius);
        return { ...p, _posX: pos.x, _posY: pos.y };
      });
    });
    // "Other" people go on the outermost ring
    const otherPeople = groupedPartners.other || [];
    const outerRing = ORBIT_RINGS[ORBIT_RINGS.length - 1];
    const workCount = (groupedPartners.work || []).length;
    otherPeople.forEach((p, i) => {
      const total = workCount + otherPeople.length;
      const pos = getOrbitPosition(workCount + i, total, outerRing.radius);
      map[outerRing.key].push({ ...p, _posX: pos.x, _posY: pos.y });
    });
    return map;
  }, [groupedPartners]);

  const showDetailScreen = selectedPartner != null;

  // Intercept back gesture/button when detail screen is open
  useEffect(() => {
    if (!showDetailScreen) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedPartner(null);
      return true;
    });
    const unsubscribe = navigation.getParent()?.addListener('beforeRemove', (e) => {
      e.preventDefault();
      setSelectedPartner(null);
    });
    return () => {
      backHandler.remove();
      unsubscribe?.();
    };
  }, [showDetailScreen, navigation]);

  // Category legend counts
  const legendItems = useMemo(() => {
    return CATEGORY_GROUPS.map(g => ({
      ...g,
      count: (groupedPartners[g.key] || []).length,
    })).filter(g => g.count > 0 || g.key === 'love');
  }, [groupedPartners]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ─── MAIN CIRCLE VIEW ─── */}
      {!showDetailScreen && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* Hero — V1.2 Light Liquid Glass: mauve-clay signal wash, ink type. */}
          <LinearGradient colors={['#F4ECE5', '#F0E4DC', '#ECDCD3']} style={styles.hero}>
            <Text style={styles.title}>Compatibility</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
              <Text style={styles.sub}>
                {partnerProfiles.length === 0 ? 'Check anyone — a crush, a friend, or a celebrity' : `${partnerProfiles.length} ${partnerProfiles.length === 1 ? 'person' : 'people'} in your circle`}
              </Text>
              {/* V1.2 — Synastry tooltip removed. Default users don't need a
                  "?" inviting them to learn astrology vocabulary. The subtitle
                  carries the meaning. */}
            </View>
            <TouchableOpacity style={styles.heroAddBtn} activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Add someone"
              onPress={() => {
                // V1: 3-partner free limit removed — all users unlimited adds.
                setShowAddModal(true);
              }}>
              <Text style={styles.heroAddBtnText}>+ Add Someone</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ─── EMPTY-STATE PLACEHOLDER GRID ─── */}
          {partnerProfiles.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 }}
              accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cardAlt, opacity: 0.5 }} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cardAlt, opacity: 0.3 }} />
                ))}
              </View>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.heading, textAlign: 'center', marginBottom: 4 }}>
                Your circle starts here
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                Add the people in your life — partners, friends, family, colleagues — to see how you connect.
              </Text>
            </View>
          )}

          {/* ─── PROMINENT FIRST-ADD CTA — only when empty ─── */}
          {partnerProfiles.length === 0 && (
            <View style={{ paddingHorizontal: 20, marginTop: 14, marginBottom: 18 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add someone — partner, friend, parent, sibling, or anyone in your life"
                onPress={() => { haptic.medium(); setRelationshipType('partner'); setShowAddModal(true); }}>
                <LinearGradient
                  colors={['#E2C46A', '#C8A84B', '#A07820']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 16, paddingHorizontal: 24, borderRadius: 28, alignItems: 'center', shadowColor: T.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16 }}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy, letterSpacing: 0.3 }}>+  Add Someone</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: 8, opacity: 0.7 }}>
                Partner, friend, parent, sibling — anyone in your life.
              </Text>
            </View>
          )}

          {/* V1.2 — QUICK-ADD BY TYPE legend removed. It was a 6-button
              relationship-type quick-add that duplicated the prominent CTA
              above. Hero "+ Add Someone" + the gradient CTA already cover
              the empty-state add path. Reviewers should see one clear way to
              start, not three. */}

          {/* ─── YOUR CONNECTIONS (directly below hero when partners exist) ─── */}
          {partnerProfiles.length > 0 && (
            <View style={styles.peopleListSection}>
              <Text style={[styles.peopleListLabel, { color: colors.textSecondary }]}>YOUR CONNECTIONS</Text>
              {partnerProfiles.map(p => {
                const role = p.relationshipType || 'other';
                const roleColor = ROLE_COLORS[role] || ROLE_COLORS.other;
                const score = getQuickScore(userProfile.chart, p);
                const pSun = p.chart?.planets?.find(pl => pl.name === 'Sun');
                const roleInfo = ROLE_LABELS[role];
                const canDeepen = p.isZodiacOnly;
                const canAddTime = !p.isZodiacOnly && p.isTimeUnknown;
                return (
                  <View key={p.id}>
                    <TouchableOpacity style={[styles.personRow, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${p.name}. ${roleInfo?.label || 'Connection'}.${showAstrology && pSun?.sign ? ` ${pSun.sign}.` : ''}${score != null ? ` Compatibility ${score} percent.` : ''}`}
                      onPress={() => { haptic.light(); setSelectedPartner(p); }}>
                      <LinearGradient colors={roleColor.bg} style={styles.personRowOrb}>
                        <Text style={styles.personRowOrbText}>{getInitial(p.name)}</Text>
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.personRowName, { color: colors.heading }]}>{p.name}</Text>
                        <Text style={[styles.personRowSub, { color: colors.textSecondary }]}>
                          {roleInfo?.icon} {roleInfo?.label}
                          {showAstrology && pSun?.sign ? ` · ${ZODIAC_GLYPHS[pSun.sign] || '✦'} ${pSun.sign}` : ''}
                          {canDeepen ? ' · Add birthday for more' : ''}
                        </Text>
                      </View>
                      {score != null && (
                        <View style={styles.personRowScoreBadge}>
                          <Text style={styles.personRowScoreText}>{score}%</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 14, color: colors.textSecondary }}>›</Text>
                    </TouchableOpacity>
                    {canDeepen && (
                      <TouchableOpacity style={styles.deepenBtn} activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Deepen reading for ${p.name}`}
                        onPress={() => openDeepenModal(p, 'full')}>
                        <Text style={styles.deepenBtnIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">↑</Text>
                        <Text style={styles.deepenBtnText}>Deepen Reading</Text>
                        <Text style={styles.deepenBtnArrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">↗</Text>
                      </TouchableOpacity>
                    )}
                    {canAddTime && (
                      <TouchableOpacity style={styles.addTimeBtn} activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Add birth time for ${p.name}`}
                        onPress={() => openDeepenModal(p, 'time')}>
                        <Text style={styles.addTimeBtnIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">◷</Text>
                        <Text style={styles.addTimeBtnText}>Add Birth Time</Text>
                        <Text style={styles.deepenBtnArrow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ─── CELEBRITY MATCH — opt-in only (zodiac-coded surface) ─── */}
          {showAstrology && (
          <View style={styles.celebSection}>
            <View style={styles.celebHeader}>
              <Text style={styles.celebLabel}>CELEBRITY MATCH</Text>
              <Text style={[styles.celebSub, { color: colors.heading }]}>Are you compatible with your crush?</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.celebScroll}>
              {CELEBRITY_DATA.map((celeb) => {
                const isSelected = selectedCeleb?.name === celeb.name;
                return (
                  <TouchableOpacity
                    key={celeb.name}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Check compatibility with ${celeb.name}, ${celeb.sign}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => handleCelebMatch(celeb)}
                    style={[styles.celebChip, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && styles.celebChipActive]}
                  >
                    <Text style={styles.celebChipIcon}>{celeb.icon}</Text>
                    <View style={{ flexShrink: 1 }}>
                      <Text style={[styles.celebChipName, { color: colors.heading }, isSelected && styles.celebChipNameActive]} numberOfLines={1}>{celeb.name}</Text>
                      <Text style={[styles.celebChipSign, isSelected && styles.celebChipSignActive]}>{ZODIAC_GLYPHS[celeb.sign]} {celeb.sign}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Celebrity result inline */}
            {celebResult && selectedCeleb && (
              <View style={[styles.celebResultCard, { backgroundColor: colors.card }]}>
                <View style={styles.celebResultTop}>
                  <View style={styles.celebResultNames}>
                    <Text style={[styles.celebResultYou, { color: colors.heading }]}>{userProfile?.name?.split(' ')[0] || 'You'}</Text>
                    <Text style={styles.celebResultAmp}>&</Text>
                    <Text style={[styles.celebResultThem, { color: colors.heading }]}>{selectedCeleb.name}</Text>
                  </View>
                  <View style={styles.celebResultScoreBadge}>
                    <Text style={styles.celebResultScore}>{celebResult.harmonyScore}%</Text>
                  </View>
                </View>
                <Text style={styles.celebResultVerdict}>{getScoreLabel(celebResult.harmonyScore)}</Text>
                <View style={styles.celebResultSignsRow}>
                  <Text style={styles.celebResultSignText}>{ZODIAC_GLYPHS[userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign] || ''} {userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || ''}</Text>
                  <Text style={styles.celebResultX}>{'\u2727'}</Text>
                  <Text style={styles.celebResultSignText}>{ZODIAC_GLYPHS[selectedCeleb.sign]} {selectedCeleb.sign}</Text>
                </View>
                {celebResult.scores && Object.keys(celebResult.scores).length > 0 && (
                  <View style={styles.celebResultDims}>
                    {Object.entries(celebResult.scores).slice(0, 4).map(([key, val]) => (
                      <View key={key} style={styles.celebResultDimRow}>
                        <Text style={styles.celebResultDimLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                        <View style={styles.celebResultDimTrack}>
                          <View style={[styles.celebResultDimFill, { width: `${val}%` }]} />
                        </View>
                        <Text style={styles.celebResultDimPct}>{val}%</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity style={styles.celebShareBtn} activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Share celebrity match"
                  onPress={handleShareCelebResult}>
                  <Text style={styles.celebShareText}>Share {'\u2197'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          )}

          {/* V1.2 — Footer "Add person" card removed. It was a third entry
              point to add someone (after the hero + Add Someone button), and
              once a user has connections, they don't need a permanent footer
              CTA telling them to add more. The hero button stays as the one
              way in. */}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ─── DETAIL SCREEN (role-specific) ─── */}
      {showDetailScreen && synastry && (() => {
        const rc = ROLE_DETAIL_CONFIG[partnerRole] || ROLE_DETAIL_CONFIG.other;
        const lbl = rc.labels;
        const p1Name = userProfile.name?.split(' ')[0];
        const p2Name = partnerProfile?.name?.split(' ')[0];

        // Section renderers keyed by config sectionOrder
        const renderSection = (sKey, idx) => {
          switch (sKey) {
            case 'aiAnalysis':
              if (aiLoading) return <View key={idx} style={{ alignItems: 'center', paddingVertical: 16 }}><ActivityIndicator size="small" color={T.gold} /><Text style={{ fontSize: 11, color: T.stone, marginTop: 6 }}>Reading the patterns...</Text></View>;
              if (!aiAnalysis) return null;
              return (
                <View key={idx} style={[styles.ddAiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.ddSectionLbl, { color: colors.textSecondary }]}>{lbl.aiAnalysis}</Text>
                  <AstroText style={[styles.ddAiText, { color: colors.text }]} text={aiAnalysis} />
                  {synastry.discepoloAnalysis?.isDestinySign && <View style={styles.destinyBadge}><Text style={styles.destinyBadgeText}>✦ DESTINY SIGN MATCH</Text></View>}
                </View>
              );

            case 'dimensions':
              return (
                <View key={idx}>
                  <Text style={[styles.ddSectionLbl, { color: colors.textSecondary }]}>{lbl.dimensions}</Text>
                  <View style={[styles.ddDimCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {roleDims.map((d, i) => (
                      <View key={i} style={styles.dimRow}>
                        <View style={styles.dimTop}><Text style={styles.dimIcon}>{d.icon}</Text><Text style={styles.dimLabel}>{d.label}</Text><Text style={styles.dimPct}>{d.pct}%</Text></View>
                        <View style={styles.dimTrack}><View style={[styles.dimFill, { width: `${d.pct}%`, backgroundColor: d.color }]} /></View>
                      </View>
                    ))}
                  </View>
                </View>
              );

            case 'relationshipSeason':
              // V1: gated — exposes "Mars in your Sun sign" planet+sign content.
              if (!showAstrology) return null;
              if (!cosmicSeason) return null;
              return <View key={idx} style={styles.ddSeasonCard}><Text style={styles.ddSectionLbl}>YOUR RELATIONSHIP SEASON</Text><Text style={styles.ddSeasonText}>{cosmicSeason.planet} in your {cosmicSeason.natalTarget} sign shapes how you connect right now · {cosmicSeason.progress}% through</Text></View>;

            case 'activeWindows':
              // V1: gated — renders Venus/Mars/Moon planet glyphs + descriptions.
              if (!showAstrology) return null;
              if (!activeRelationshipWindows.length) return null;
              return (
                <View key={idx} style={styles.ddActiveCard}>
                  <Text style={styles.ddSectionLbl}>WHAT'S ACTIVE BETWEEN YOU</Text>
                  {activeRelationshipWindows.slice(0, 3).map((w, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 14 }}>{w.planet === 'Venus' ? '♀' : w.planet === 'Mars' ? '♂' : w.planet === 'Moon' ? '☽' : '★'}</Text>
                      <Text style={{ flex: 1, fontSize: 13, color: T.ink, fontFamily: FONTS.sans, lineHeight: 18 }}>{w.description}</Text>
                    </View>
                  ))}
                </View>
              );

            case 'areas':
              if (detailsLoading) return <View key={idx} style={{ alignItems: 'center', paddingVertical: 16 }}><ActivityIndicator size="small" color={T.gold} /><Text style={{ fontSize: 12, color: T.stone, marginTop: 6 }}>Analyzing your connection...</Text></View>;
              // V1: paywall teaser block + "$9.99 / Subscribe" alert removed.
              // isPro stub returns true so this branch never ran, but strings shipped in bundle.
              if (!matchDetails?.areas) return null;

              return (
                <View key={idx}>
                  <Text style={styles.ddSectionLbl}>{lbl.areas}</Text>
                  {Object.entries(matchDetails.areas).map(([key, area], i) => {
                    const dim = roleDims.find(d => d.key === key);
                    return (
                      <View key={i} style={[styles.ddAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.ddAreaHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{dim && <Text style={{ fontSize: 14, color: dim.color }}>{dim.icon}</Text>}<Text style={[styles.ddAreaName, { color: colors.heading }]}>{dim?.label || key.charAt(0).toUpperCase() + key.slice(1)}</Text></View>
                          <Text style={styles.ddAreaScore}>{area.score}%</Text>
                        </View>
                        <View style={[styles.dimTrack, { marginBottom: 10 }]}><View style={[styles.dimFill, { width: `${area.score}%`, backgroundColor: dim?.color || T.gold }]} /></View>
                        <AstroText text={area.strength} style={styles.ddAreaStrength} />
                        {area.tension && <AstroText text={area.tension} style={styles.ddAreaTension} />}
                        {area.analysis && <AstroText text={area.analysis} style={styles.ddAreaAnalysis} />}
                        {area.reflection && <AstroText text={area.reflection} style={styles.ddAreaReflection} />}
                      </View>
                    );
                  })}
                </View>
              );

            case 'sharedValues':
              if (!matchDetails?.sharedValues?.length) return null;
              return <View key={idx}><Text style={styles.ddSectionLbl}>{lbl.sharedValues}</Text><View style={styles.ddChipsWrap}>{matchDetails.sharedValues.map((v, i) => <View key={i} style={styles.ddValueChip}><Text style={styles.ddValueText}>{v}</Text></View>)}</View></View>;

            case 'keyConnections':
              // V1: gated — synastry links contain raw aspects ("Venus trine Mars").
              if (!showAstrology) return null;
              if (!synastry.links?.length) return null;
              return <View key={idx}><Text style={styles.ddSectionLbl}>{lbl.keyConnections}</Text><View style={styles.ddChipsWrap}>{synastry.links.slice(0, 6).map((link, i) => <View key={i} style={[styles.ddLinkChip, link.isFriction && styles.ddLinkChipHard]}><Text style={[styles.ddLinkText, link.isFriction && styles.ddLinkTextHard]}>{link.label} {link.description}</Text></View>)}</View></View>;

            case 'actionRow':
              return (
                <View key={idx}>
                  {/* Zodiac-only upgrade CTA */}
                  {partnerProfile?.isZodiacOnly && (
                    <TouchableOpacity style={styles.upgradeDepthCard} activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Deepen reading. Add ${p2Name}'s birthday for a deeper pattern reading.`}
                      onPress={() => openDeepenModal(partnerProfile, 'full')}>
                      <Text style={styles.upgradeDepthIcon}>↑</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.upgradeDepthTitle}>Deepen Reading</Text>
                        <Text style={styles.upgradeDepthSub}>Add {p2Name}'s birthday for a deeper pattern reading</Text>
                      </View>
                      <Text style={styles.upgradeDepthArrow}>↗</Text>
                    </TouchableOpacity>
                  )}

                  {/* Add birth time nudge for birthday-only partners */}
                  {!partnerProfile?.isZodiacOnly && partnerProfile?.isTimeUnknown && (
                    <TouchableOpacity style={styles.addTimeNudgeCard} activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Add birth time for ${p2Name}`}
                      onPress={() => openDeepenModal(partnerProfile, 'time')}>
                      <Text style={styles.addTimeNudgeIcon}>◷</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addTimeNudgeTitle}>Add Birth Time</Text>
                        <Text style={styles.addTimeNudgeSub}>Know {p2Name}'s birth time? Unlock a more accurate read on their emotional and communication patterns.</Text>
                      </View>
                      <Text style={styles.upgradeDepthArrow}>↗</Text>
                    </TouchableOpacity>
                  )}

                  {/* Ask Celestia bridge */}
                  <TouchableOpacity style={styles.askCelestiaBtn} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask Celestia why you and ${p2Name} click`}
                    onPress={() => {
                      haptic.light();
                      const question = `Tell me more about my compatibility with ${p2Name}. What are the biggest strengths and challenges in this relationship?`;
                      navigation.navigate('Ask', { initialMessage: question });
                    }}>
                    <Text style={styles.askCelestiaBtnIcon}>✦</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.askCelestiaBtnText}>Ask Celestia why you two click</Text>
                      <Text style={styles.askCelestiaBtnSub}>Get personalized insight about your strengths & challenges</Text>
                    </View>
                    <Text style={styles.askCelestiaBtnArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>

                  {/* Bridge to Reports \u2014 gated. Reports content is full astro PDFs. */}
                  {showAstrology && (
                  <TouchableOpacity style={styles.reportsBtn} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="See your full compatibility story in reports"
                    onPress={() => {
                      haptic.light();
                      navigation.navigate('Reports');
                    }}>
                    <Text style={styles.reportsBtnIcon}>{'\u2727'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reportsBtnText}>See your full compatibility story</Text>
                      <Text style={styles.reportsBtnSub}>Deep-dive into love, communication & long-term potential</Text>
                    </View>
                    <Text style={styles.reportsBtnArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>
                  )}

                  <View style={styles.ddActionRow}>
                    <TouchableOpacity style={styles.ddActionBtn} activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Share to story"
                      onPress={handleShareStory}><Text style={styles.ddActionBtnText}>Share ↗</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.ddActionBtn} activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Send a compatibility invite"
                      onPress={async () => {
                      haptic.medium();
                      await createAndShareInvite({ inviterName: userProfile?.name || 'Someone', inviterId: userProfile?.id, partnerName: partnerProfile?.name || 'Partner', score: synastry.harmonyScore, verdict: rc.getScoreLabel(synastry.harmonyScore) });
                      trackEvent('share'); awardXP(userProfile?.id, 'share');
                    }}><Text style={styles.ddActionBtnText}>Check Our Compatibility ✉️</Text></TouchableOpacity>
                  </View>
                </View>
              );

            case 'pdfDownload':
              const theme = reportTheme;
              return (
                <View key={idx}>
                  <TouchableOpacity style={styles.ddDownload} activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Generate PDF report"
                    accessibilityState={{ disabled: !!pdfLoading, busy: !!pdfLoading }}
                    onPress={handleDownloadReport} disabled={pdfLoading}>
                    <LinearGradient colors={theme.gradient} style={styles.ddDownloadGrad}>
                      <View style={[styles.ddDownloadGlow, { backgroundColor: theme.accentSoft }]} />
                      <Text style={{ fontSize: 22, marginBottom: 6 }}>{theme.coverIcon}</Text>
                      <Text style={styles.ddDownloadTitle}>{lbl.pdfTitle}</Text>
                      <Text style={styles.ddDownloadSub}>{lbl.pdfSub}</Text>
                      <View style={[styles.ddDownloadCta, { backgroundColor: theme.accentSoft, borderColor: theme.accentGlow }]}>
                        <Text style={{ fontSize: 13, fontFamily: FONTS.sansSemiBold, color: theme.accent }}>Generate PDF ↓</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRemovePartner(partnerProfile)} style={styles.ddDeleteBtn} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${p2Name} from your connections`}>
                    <Text style={styles.ddDeleteBtnText}>Remove {p2Name} from Circle</Text>
                  </TouchableOpacity>
                </View>
              );

            // ── ROLE-SPECIFIC UNIQUE SECTIONS ──

            case 'loveLanguages':
              if (!matchDetails?.loveLanguages) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.ddSectionLbl, { color: colors.textSecondary }]}>LOVE LANGUAGES</Text>
                  <View style={styles.uniqueTwoCol}>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>♡</Text><Text style={styles.uniqueColLabel}>{p1Name}</Text><Text style={styles.uniqueColText}>{matchDetails.loveLanguages.user}</Text></View>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>♡</Text><Text style={styles.uniqueColLabel}>{p2Name}</Text><Text style={styles.uniqueColText}>{matchDetails.loveLanguages.partner}</Text></View>
                  </View>
                </View>
              );

            case 'conflictStyle':
              if (!matchDetails?.conflictStyle) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { borderLeftWidth: 3, borderLeftColor: '#E86050' }]}>
                  <Text style={styles.ddSectionLbl}>CONFLICT & RESOLUTION</Text>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#E86050' }]}>△</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>TRIGGERS</Text><Text style={styles.uniqueRowText}>{matchDetails.conflictStyle.triggers}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>RESOLUTION</Text><Text style={styles.uniqueRowText}>{matchDetails.conflictStyle.resolution}</Text></View></View>
                </View>
              );

            case 'friendshipDynamic':
              if (!matchDetails?.friendshipDynamic) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>YOUR FRIENDSHIP VIBE</Text>
                  <Text style={styles.uniqueBodyText}>{matchDetails.friendshipDynamic.vibeDescription}</Text>
                  <View style={styles.uniqueHighlight}><Text style={styles.uniqueHighlightLabel}>BEST TOGETHER</Text><Text style={styles.uniqueHighlightText}>{matchDetails.friendshipDynamic.bestActivity}</Text></View>
                </View>
              );

            case 'adventureCompat':
              if (!matchDetails?.adventureCompat) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>ADVENTURE COMPATIBILITY</Text>
                  <View style={styles.uniqueTwoCol}>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>✈</Text><Text style={styles.uniqueColLabel}>Ideal Trip</Text><Text style={styles.uniqueColText}>{matchDetails.adventureCompat.idealTrip}</Text></View>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>◇</Text><Text style={styles.uniqueColLabel}>Shared Energy</Text><Text style={styles.uniqueColText}>{matchDetails.adventureCompat.sharedEnergy}</Text></View>
                  </View>
                </View>
              );

            case 'generationalPattern':
              if (!matchDetails?.generationalPattern) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { borderLeftWidth: 3, borderLeftColor: '#A080C0' }]}>
                  <Text style={styles.ddSectionLbl}>GENERATIONAL PATTERN</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>❖</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THE PATTERN</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.pattern}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◎</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>ORIGIN</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.origin}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>HEALING</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.healing}</Text></View></View>
                </View>
              );

            case 'communicationGuide':
              if (!matchDetails?.communicationGuide) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>COMMUNICATION GUIDE</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◆</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationGuide.theirStyle}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◇</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>YOUR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationGuide.yourStyle}</Text></View></View>
                  <View style={styles.uniqueHighlight}><Text style={styles.uniqueHighlightLabel}>BRIDGE TIP</Text><Text style={styles.uniqueHighlightText}>{matchDetails.communicationGuide.bridgeTip}</Text></View>
                </View>
              );

            case 'healingPath':
              if (!matchDetails?.healingPath) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { backgroundColor: '#F8F5F0' }]}>
                  <Text style={styles.ddSectionLbl}>HEALING PATH</Text>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#A06050' }]}>◇</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#A06050' }]}>THE WOUND</Text><Text style={styles.uniqueRowText}>{matchDetails.healingPath.wound}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>APPROACH</Text><Text style={styles.uniqueRowText}>{matchDetails.healingPath.approach}</Text></View></View>
                  <View style={styles.uniqueAffirmation}><Text style={styles.uniqueAffirmationText}>"{matchDetails.healingPath.affirmation}"</Text></View>
                </View>
              );

            case 'siblingDynamic':
              if (!matchDetails?.siblingDynamic) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>SIBLING DYNAMIC</Text>
                  <Text style={styles.uniqueDynamicLabel}>{matchDetails.siblingDynamic.dynamicLabel}</Text>
                  <View style={styles.uniqueBarRow}><Text style={styles.uniqueBarLabel}>Rivalry</Text><View style={styles.dimTrack}><View style={[styles.dimFill, { width: `${matchDetails.siblingDynamic.rivalryScore}%`, backgroundColor: '#E86050' }]} /></View><Text style={styles.uniqueBarPct}>{matchDetails.siblingDynamic.rivalryScore}%</Text></View>
                  <View style={styles.uniqueBarRow}><Text style={styles.uniqueBarLabel}>Alliance</Text><View style={styles.dimTrack}><View style={[styles.dimFill, { width: `${matchDetails.siblingDynamic.allianceScore}%`, backgroundColor: '#4A8060' }]} /></View><Text style={styles.uniqueBarPct}>{matchDetails.siblingDynamic.allianceScore}%</Text></View>
                  <Text style={styles.uniqueBodyText}>{matchDetails.siblingDynamic.insight}</Text>
                </View>
              );

            case 'communicationPlaybook':
              if (!matchDetails?.communicationPlaybook) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>COMMUNICATION PLAYBOOK</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◆</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationPlaybook.theirStyle}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>→</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>BEST APPROACH</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationPlaybook.bestApproach}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#E86050' }]}>✕</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#E86050' }]}>AVOID</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationPlaybook.avoid}</Text></View></View>
                </View>
              );

            case 'careerStrategy':
              if (!matchDetails?.careerStrategy) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { borderLeftWidth: 3, borderLeftColor: T.gold }]}>
                  <Text style={styles.ddSectionLbl}>CAREER STRATEGY</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>↑</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>LEVERAGE</Text><Text style={styles.uniqueRowText}>{matchDetails.careerStrategy.leverage}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◎</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>TIMING</Text><Text style={styles.uniqueRowText}>{matchDetails.careerStrategy.timing}</Text></View></View>
                  <View style={styles.uniqueHighlight}><Text style={styles.uniqueHighlightLabel}>GROWTH TIP</Text><Text style={styles.uniqueHighlightText}>{matchDetails.careerStrategy.growthTip}</Text></View>
                </View>
              );

            case 'teamworkProfile':
              if (!matchDetails?.teamworkProfile) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>TEAMWORK PROFILE</Text>
                  <View style={styles.uniqueTwoCol}>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColLabel}>{p1Name}'s Role</Text><Text style={styles.uniqueColText}>{matchDetails.teamworkProfile.yourRole}</Text></View>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColLabel}>{p2Name}'s Role</Text><Text style={styles.uniqueColText}>{matchDetails.teamworkProfile.theirRole}</Text></View>
                  </View>
                  <View style={styles.uniqueHighlight}><Text style={styles.uniqueHighlightLabel}>BEST COLLAB STYLE</Text><Text style={styles.uniqueHighlightText}>{matchDetails.teamworkProfile.bestCollabStyle}</Text></View>
                  <View style={[styles.uniqueHighlight, { backgroundColor: 'rgba(232,96,80,0.06)', borderColor: 'rgba(232,96,80,0.15)' }]}><Text style={[styles.uniqueHighlightLabel, { color: '#E86050' }]}>WATCH FOR</Text><Text style={styles.uniqueHighlightText}>{matchDetails.teamworkProfile.watchFor}</Text></View>
                </View>
              );

            case 'parentingGuide':
              if (!matchDetails?.parentingGuide) return null;
              return (
                <View key={idx} style={[styles.uniqueCard, { borderLeftWidth: 3, borderLeftColor: '#4A8060' }]}>
                  <Text style={styles.ddSectionLbl}>PARENTING GUIDE</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◎</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR NEEDS</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.theirNeeds}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>YOUR STRENGTH</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.yourStrength}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: T.gold }]}>→</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: T.gold }]}>GROWTH EDGE</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.growthEdge}</Text></View></View>
                </View>
              );

            case 'childNature':
              if (!matchDetails?.childNature) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>THEIR NATURE</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>✦</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>TEMPERAMENT</Text><Text style={styles.uniqueRowText}>{matchDetails.childNature.coreTemperament}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◎</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>EMOTIONAL NEED</Text><Text style={styles.uniqueRowText}>{matchDetails.childNature.emotionalNeed}</Text></View></View>
                  <View style={styles.uniqueHighlight}><Text style={styles.uniqueHighlightLabel}>BEST MOTIVATOR</Text><Text style={styles.uniqueHighlightText}>{matchDetails.childNature.bestMotivator}</Text></View>
                </View>
              );

            default: return null;
          }
        };

        return (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Detail hero */}
              <LinearGradient colors={rc.heroGradient} style={styles.ddHero}>
                {/* V1.2 — Visible back button on light hero. Standard iOS pattern:
                    chevron + previous-screen label. Returns user to the
                    connections list where they can pick another or add new. */}
                <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.ddBack}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  accessibilityRole="button"
                  accessibilityLabel="Back to your connections">
                  <Text style={styles.ddBackChevron} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">‹</Text>
                  <Text style={styles.ddBackLabel}>Connections</Text>
                </TouchableOpacity>
                <View style={styles.ddPair}>
                  <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(userProfile.name)}</Text></LinearGradient>
                  <View style={styles.ddConnector}><View style={styles.ddLine} /><View style={styles.ddHeart}><Text style={{ fontSize: 14 }}>{ROLE_LABELS[partnerRole]?.icon || '♡'}</Text></View><View style={styles.ddLine} /></View>
                  <LinearGradient colors={(ROLE_COLORS[partnerRole] || ROLE_COLORS.other).bg} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(partnerProfile?.name)}</Text></LinearGradient>
                </View>
                <Text style={styles.ddTitle}>{p1Name} & {p2Name}</Text>
                <Text style={styles.ddSub}>
                  {ROLE_LABELS[partnerRole]?.label}
                  {showAstrology && partnerSun?.sign ? ` · ${ZODIAC_GLYPHS[partnerSun.sign] || '✦'} ${partnerSun.sign}` : ''}
                </Text>
                <View style={styles.ddScoreWrap}
                  accessibilityRole="progressbar"
                  accessibilityLabel={`Compatibility score ${synastry.harmonyScore} out of 100`}
                  accessibilityValue={{ now: synastry.harmonyScore, min: 0, max: 100 }}>
                  <Svg width={80} height={80}>
                    <Circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                    <Circle cx={40} cy={40} r={34} fill="none" stroke={T.gold} strokeWidth={5}
                      strokeDasharray={`${(synastry.harmonyScore / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      strokeLinecap="round" transform="rotate(-90 40 40)" />
                  </Svg>
                  <Text style={styles.ddScoreNum}>{synastry.harmonyScore}</Text>
                </View>
                <Text style={styles.ddVerdict}>"{rc.getScoreLabel(synastry.harmonyScore)}"</Text>
                <View style={styles.ddChips}>
                  {roleDims.map((d, i) => (
                    <View key={i} style={[styles.ddChip, { borderColor: d.color + '40' }]}>
                      <Text style={{ fontSize: 10, color: d.color }}>{d.icon}</Text>
                      <Text style={styles.ddChipLabel}>{d.label}</Text>
                      <Text style={[styles.ddChipVal, { color: d.color }]}>{d.pct}%</Text>
                    </View>
                  ))}
                </View>
                {/* Quick share from detail hero */}
                <TouchableOpacity style={styles.ddShareBtn} activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Share compatibility result"
                  onPress={async () => {
                    haptic.light();
                    try {
                      await Share.share({
                        message: `${p1Name} & ${p2Name} — ${synastry.harmonyScore}% compatibility on Celestia! Check yours: celestia.app`,
                      });
                      trackEvent('share').catch(() => {});
                    } catch (e) {}
                  }}>
                  <Text style={styles.ddShareBtnText}>Share Result ↗</Text>
                </TouchableOpacity>
              </LinearGradient>

              <View style={[styles.ddBody, { backgroundColor: colors.bg }]}>
                {rc.sectionOrder.map((sKey, idx) => renderSection(sKey, idx))}
                <View style={{ height: 40 }} />
              </View>
            </ScrollView>
          </View>
        );
      })()}

      {/* Share cards offscreen */}
      {synastry && partnerProfile && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <CompatibilityShareCard innerRef={matchCardRef}
            user={{ name: userProfile.name?.split(' ')[0], sign: userSun?.sign, initial: getInitial(userProfile.name) }}
            partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign, initial: getInitial(partnerProfile?.name) }}
            score={synastry.harmonyScore} verdict={getScoreLabel(synastry.harmonyScore)} />
          <MatchStoryCard innerRef={storyCardRef}
            user={{ name: userProfile.name?.split(' ')[0], sign: userSun?.sign }}
            partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign }}
            score={synastry.harmonyScore} verdict={getScoreLabel(synastry.harmonyScore)}
            insights={viralInsights} themeIndex={storyTheme} />
        </View>
      )}

      {/* Story Modal */}
      <Modal visible={showStoryModal} transparent animationType="fade">
        <View style={styles.storyOverlay}>
          <View style={styles.storyTopBar}>
            <TouchableOpacity onPress={() => setShowStoryModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close share modal"><Text style={styles.storyCloseText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text></TouchableOpacity>
            <Text style={styles.storyModalTitle}>Share Your Match</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.storyPreview}>
            <View style={styles.storyCardWrap}>
              <MatchStoryCard user={{ name: userProfile?.name?.split(' ')[0], sign: userSun?.sign }}
                partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign }}
                score={synastry?.harmonyScore || 0} verdict={getScoreLabel(synastry?.harmonyScore || 0)}
                insights={viralInsights} themeIndex={storyTheme} />
              {viralLoading && <View style={styles.storyLoadingOverlay}><ActivityIndicator size="small" color="white" /><Text style={styles.storyLoadingText}>Reading patterns...</Text></View>}
            </View>
          </View>
          <View style={styles.storyThemeSection}>
            <Text style={styles.storyThemeLabel}>STYLE</Text>
            <View style={styles.storyThemeRow}>
              {STORY_THEMES.map((theme, i) => (
                <TouchableOpacity key={i}
                  accessibilityRole="radio"
                  accessibilityLabel={`Theme ${theme.name}`}
                  accessibilityState={{ selected: storyTheme === i }}
                  onPress={() => setStoryTheme(i)} style={[styles.storyThemeOption, storyTheme === i && styles.storyThemeOptionOn]}>
                  <View style={[styles.storyThemeSwatch, { backgroundColor: theme.dot }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
                  <Text style={[styles.storyThemeName, storyTheme === i && { color: 'white' }]}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.storyShareBtn} activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share match"
            accessibilityState={{ disabled: !!viralLoading, busy: !!viralLoading }}
            onPress={handleShareStoryCapture} disabled={viralLoading}>
            <LinearGradient colors={[STORY_THEMES[storyTheme].dot, STORY_THEMES[storyTheme].dot + '60']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.storyShareGrad}>
              <Text style={styles.storyShareText}>Share</Text>
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>↗</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      <GenerationOverlay visible={pdfLoading} currentStep={genStep} totalSteps={reportTheme.steps.length} onCancel={handleCancelPdf} theme={reportTheme} />

      {/* ─── ADD PARTNER MODAL ─── */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={[styles.modal, { backgroundColor: colors.modalBg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]}>Add Person</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close add person form"><Text style={[styles.modalClose, { color: colors.textSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text></TouchableOpacity>
          </View>
          {/* V1.2 — keyboard handling: keyboardShouldPersistTaps lets the user
              tap a suggestion without first dismissing the keyboard;
              automaticallyAdjustKeyboardInsets (iOS 14+) makes the scroll
              view inset content above the keyboard automatically. */}
          <ScrollView
            ref={addModalScrollRef}
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={{ paddingBottom: 60 }}>
            {/* V1.2 — Privacy disclosure for partner data (Apple 5.1.1).
                Mirrors the AI chat consent's "stays on your device" promise. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 18, backgroundColor: 'rgba(92,36,52,0.05)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(92,36,52,0.12)' }}>
              <Text style={{ fontSize: 14 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">🔒</Text>
              <Text style={{ flex: 1, fontSize: 11.5, color: colors.text, lineHeight: 16, fontFamily: FONTS.sans }}>
                This information stays only on your device. We use it to map their personality patterns — same framework as your own onboarding.
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>THEIR NAME</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }]} placeholder="Full name" placeholderTextColor={colors.inputPlaceholder} value={partnerName} onChangeText={setPartnerName} />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>RELATIONSHIP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {RELATIONSHIP_TYPES.map((rt) => (
                <TouchableOpacity key={rt.key} style={[styles.relTypePill, { backgroundColor: colors.card, borderColor: colors.border }, relationshipType === rt.key && styles.relTypePillActive]}
                  accessibilityRole="radio"
                  accessibilityLabel={rt.label}
                  accessibilityState={{ selected: relationshipType === rt.key }}
                  onPress={() => setRelationshipType(rt.key)}>
                  <Text style={[styles.relTypePillText, { color: colors.textSecondary }, relationshipType === rt.key && styles.relTypePillTextActive]}>{rt.icon} {rt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* V1: zodiac-only path gated behind showAstrology. Default users
                use birth-data path only — keeps "zodiac sign" wording off the
                default add flow. Opt-in users can still add by sign. */}
            {showAstrology && (
              <TouchableOpacity style={styles.zodiacToggle}
                accessibilityRole="checkbox"
                accessibilityLabel="I only know their sign — simplified compatibility"
                accessibilityState={{ checked: zodiacOnlyMode }}
                onPress={() => setZodiacOnlyMode(!zodiacOnlyMode)}>
                <View style={[styles.check, zodiacOnlyMode && styles.checkOn]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{zodiacOnlyMode && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkLabel}>I only know their sign</Text>
                  <Text style={{ fontSize: 11, color: T.stone, marginTop: 2 }}>Simplified compatibility — no birthday needed</Text>
                </View>
              </TouchableOpacity>
            )}

            {showAstrology && zodiacOnlyMode && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>THEIR SIGN</Text>
                <View style={styles.zodiacGrid}>
                  {(ZODIAC_SIGNS || ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']).map((sign) => (
                    <TouchableOpacity key={sign} style={[styles.zodiacChip, selectedZodiacSign === sign && styles.zodiacChipActive]}
                      accessibilityRole="radio"
                      accessibilityLabel={sign}
                      accessibilityState={{ selected: selectedZodiacSign === sign }}
                      onPress={() => setSelectedZodiacSign(sign)}>
                      <Text style={[styles.zodiacChipText, selectedZodiacSign === sign && styles.zodiacChipTextActive]}>{sign}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!zodiacOnlyMode && (
              <>
                <Text style={styles.fieldLabel}>BIRTH DATE</Text>
                <TouchableOpacity style={styles.input}
                  accessibilityRole="button"
                  accessibilityLabel={partnerDate ? `Birth date ${partnerDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Tap to ${showDatePicker ? 'collapse picker' : 'change'}.` : 'Select birth date'}
                  onPress={() => { setShowTimePicker(false); setShowDatePicker(s => !s); }}>
                  <Text style={{ color: partnerDate ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{partnerDate ? partnerDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}</Text>
                </TouchableOpacity>
                <Text style={styles.fieldHint}>The only field we really need.</Text>
                {/* V1.2 — Inline iOS picker with Done button. Tap field to expand,
                    spin wheels (commits via onChange), tap Done to collapse. */}
                {showDatePicker && (
                  <View style={styles.inlinePickerBox}>
                    <DateTimePicker
                      value={partnerDate || new Date(2000, 0, 1)}
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      onChange={(e, d) => { if (d) setPartnerDate(d); }}
                      themeVariant="light"
                      style={{ height: 200 }}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneBtn}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Done"
                      onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={styles.fieldLabel}>BIRTH TIME <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: T.stone, letterSpacing: 0 }}>(optional)</Text></Text>
                <TouchableOpacity style={[styles.input, isTimeUnknown && { opacity: 0.4 }]}
                  accessibilityRole="button"
                  accessibilityLabel={isTimeUnknown ? 'Birth time unknown' : (partnerTime ? `Birth time ${partnerTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. Tap to ${showTimePicker ? 'collapse picker' : 'change'}.` : 'Select birth time')}
                  accessibilityState={{ disabled: !!isTimeUnknown }}
                  onPress={() => {
                    if (isTimeUnknown) return;
                    setShowDatePicker(false);
                    setShowTimePicker(s => !s);
                  }}>
                  <Text style={{ color: (isTimeUnknown || partnerTime) ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{isTimeUnknown ? 'Unknown' : (partnerTime ? partnerTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Select time')}</Text>
                </TouchableOpacity>
                <Text style={styles.fieldHint}>Adds nuance to their emotional rhythm — skip if unknown.</Text>
                {showTimePicker && (
                  <View style={styles.inlinePickerBox}>
                    <DateTimePicker
                      value={partnerTime || new Date(2000, 0, 1, 12, 0)}
                      mode="time"
                      display="spinner"
                      onChange={(e, t) => { if (t) setPartnerTime(t); }}
                      themeVariant="light"
                      style={{ height: 180 }}
                    />
                    <TouchableOpacity
                      style={styles.pickerDoneBtn}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Done"
                      onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.pickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <TouchableOpacity style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityLabel="I don't know the exact birth time"
                  accessibilityState={{ checked: isTimeUnknown }}
                  onPress={() => setIsTimeUnknown(!isTimeUnknown)}>
                  <View style={[styles.check, isTimeUnknown && styles.checkOn]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{isTimeUnknown && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}</View>
                  <Text style={styles.checkLabel}>I don't know the exact birth time</Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>BIRTH CITY <Text style={{ fontFamily: FONTS.sans, fontSize: 9, color: T.stone, letterSpacing: 0 }}>(optional)</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Search city..."
                  placeholderTextColor={T.stone}
                  value={selectedCity ? selectedCity.name : citySearch}
                  onChangeText={(t) => { setSelectedCity(null); setCitySearch(t); }}
                  onFocus={() => {
                    // V1.2 — Lift the city input + suggestions above the keyboard.
                    // Wait for the keyboard to start animating in, then scroll the
                    // form to its end so input + suggestions are visible.
                    setTimeout(() => addModalScrollRef.current?.scrollToEnd({ animated: true }), 250);
                  }}
                />
                <Text style={styles.fieldHint}>Used once to refine the reading. We don't track location.</Text>
                {citySearching && <View style={[styles.suggestions, { padding: 12, alignItems: 'center' }]}><ActivityIndicator size="small" color={T.gold} /></View>}
                {!citySearching && citySuggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    {citySuggestions.map((c, i) => (
                      <TouchableOpacity key={i} style={styles.suggestion}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${c.name}`}
                        onPress={() => { setSelectedCity(c); setCitySearch(c.name); setCitySuggestions([]); }}>
                        <Text style={{ color: T.navy, fontSize: 14 }} numberOfLines={2}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {zodiacOnlyMode && <View style={styles.zodiacOnlyBadge}><Text style={styles.zodiacOnlyBadgeText}>☉ Sun Sign Analysis — simplified compatibility</Text></View>}

            {/* V1.2 — Inline validation hint when save is disabled. Communicates
                exactly what's still missing rather than relying on a greyed
                button + a post-tap Alert. */}
            {(() => {
              const missing = [];
              if (!partnerName.trim()) missing.push('a name');
              if (zodiacOnlyMode) {
                if (!selectedZodiacSign) missing.push('their sign');
              } else {
                if (!partnerDate) missing.push('their birth date');
              }
              if (missing.length === 0) return null;
              const text = `Add ${missing.join(' and ')} to continue.`;
              return (
                <Text style={{ fontSize: 12, color: T.stone, fontStyle: 'italic', textAlign: 'center', marginBottom: 10, marginTop: 18, fontFamily: FONTS.sans }}>
                  {text}
                </Text>
              );
            })()}

            <TouchableOpacity style={[styles.saveBtn, (!partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !partnerDate)) && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel="Calculate compatibility"
              accessibilityState={{ disabled: !!savingPartner || !partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !partnerDate), busy: !!savingPartner }}
              onPress={handleSavePartner} disabled={savingPartner || !partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !partnerDate)}>
              {savingPartner ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Calculate Compatibility</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── DEEPEN READING MODAL ─── */}
      <Modal visible={showDeepenModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.modalBg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]}>{deepenMode === 'full' ? 'Deepen Reading' : 'Add Birth Time'}</Text>
            <TouchableOpacity onPress={() => { setShowDeepenModal(false); resetDeepenForm(); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"><Text style={[styles.modalClose, { color: colors.textSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Pre-filled name (read-only display) */}
            <View style={styles.deepenNameRow}>
              <Text style={styles.deepenNameLabel}>{deepenPartner?.name || ''}</Text>
              <View style={styles.deepenSignBadge}>
                <Text style={styles.deepenSignBadgeText}>
                  {ZODIAC_GLYPHS[deepenPartner?.zodiacSign || deepenPartner?.chart?.planets?.find(pl => pl.name === 'Sun')?.sign] || '✦'}{' '}
                  {deepenPartner?.zodiacSign || deepenPartner?.chart?.planets?.find(pl => pl.name === 'Sun')?.sign || ''}
                </Text>
              </View>
            </View>

            {deepenMode === 'full' && (
              <View style={styles.deepenInfoBanner}>
                <Text style={styles.deepenInfoText}>Adding birthday and location unlocks a deeper pattern reading — emotional dynamics, communication patterns, and long-term potential.</Text>
              </View>
            )}
            {deepenMode === 'time' && (
              <View style={styles.deepenInfoBanner}>
                <Text style={styles.deepenInfoText}>Adding birth time unlocks a more accurate read on their emotional rhythms, what they need to feel safe, and how they show up in close moments.</Text>
              </View>
            )}

            {/* Birthday (only in 'full' mode) */}
            {deepenMode === 'full' && (
              <>
                <Text style={styles.fieldLabel}>BIRTH DATE</Text>
                <TouchableOpacity style={styles.input}
                  accessibilityRole="button"
                  accessibilityLabel={deepenDate ? `Birth date ${deepenDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'Select birth date'}
                  onPress={() => setDeepenShowDatePicker(true)}>
                  <Text style={{ color: deepenDate ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{deepenDate ? deepenDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}</Text>
                </TouchableOpacity>
                {deepenShowDatePicker && <DateTimePicker value={deepenDate || new Date(2000, 0, 1)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={new Date()} onChange={(e, d) => { setDeepenShowDatePicker(Platform.OS === 'ios'); if (d) setDeepenDate(d); }} />}
              </>
            )}

            {/* Birth time (both modes) */}
            <Text style={styles.fieldLabel}>BIRTH TIME</Text>
            <TouchableOpacity style={[styles.input, deepenTimeUnknown && { opacity: 0.4 }]}
              accessibilityRole="button"
              accessibilityLabel={deepenTimeUnknown ? 'Birth time unknown' : (deepenTime ? `Birth time ${deepenTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Select birth time')}
              accessibilityState={{ disabled: !!deepenTimeUnknown }}
              onPress={() => !deepenTimeUnknown && setDeepenShowTimePicker(true)}>
              <Text style={{ color: (deepenTimeUnknown || deepenTime) ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{deepenTimeUnknown ? 'Unknown' : (deepenTime ? deepenTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Select time')}</Text>
            </TouchableOpacity>
            {deepenShowTimePicker && <DateTimePicker value={deepenTime || new Date(2000, 0, 1, 12, 0)} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { setDeepenShowTimePicker(Platform.OS === 'ios'); if (t) setDeepenTime(t); }} />}
            <TouchableOpacity style={styles.checkRow}
              accessibilityRole="checkbox"
              accessibilityLabel="I don't know the exact birth time"
              accessibilityState={{ checked: deepenTimeUnknown }}
              onPress={() => setDeepenTimeUnknown(!deepenTimeUnknown)}>
              <View style={[styles.check, deepenTimeUnknown && styles.checkOn]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{deepenTimeUnknown && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}</View>
              <Text style={styles.checkLabel}>I don't know the exact birth time</Text>
            </TouchableOpacity>

            {/* Birth city (both modes, but pre-filled for 'time' if already set) */}
            {(deepenMode === 'full' || !deepenSelectedCity) && (
              <>
                <Text style={styles.fieldLabel}>BIRTH CITY</Text>
                <TextInput style={styles.input} placeholder="Search city..." placeholderTextColor={T.stone} value={deepenSelectedCity ? deepenSelectedCity.name : deepenCitySearch} onChangeText={(t) => { setDeepenSelectedCity(null); setDeepenCitySearch(t); }} />
                {deepenCitySearching && <View style={[styles.suggestions, { padding: 12, alignItems: 'center' }]}><ActivityIndicator size="small" color={T.gold} /></View>}
                {!deepenCitySearching && deepenCitySuggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    {deepenCitySuggestions.map((c, i) => (
                      <TouchableOpacity key={i} style={styles.suggestion}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${c.name}`}
                        onPress={() => { setDeepenSelectedCity(c); setDeepenCitySearch(c.name); setDeepenCitySuggestions([]); }}>
                        <Text style={{ color: T.navy, fontSize: 14 }} numberOfLines={2}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, styles.deepenSaveBtn,
                (deepenMode === 'full' ? (!deepenDate || !deepenSelectedCity) : (!deepenTime && !deepenTimeUnknown)) && { opacity: 0.5 }
              ]}
              accessibilityRole="button"
              accessibilityLabel={deepenMode === 'full' ? 'Deepen compatibility' : 'Update reading'}
              accessibilityState={{ disabled: !!deepenSaving || (deepenMode === 'full' ? (!deepenDate || !deepenSelectedCity) : (!deepenTime && !deepenTimeUnknown)), busy: !!deepenSaving }}
              onPress={handleSaveDeepenedPartner}
              disabled={deepenSaving || (deepenMode === 'full' ? (!deepenDate || !deepenSelectedCity) : (!deepenTime && !deepenTimeUnknown))}>
              {deepenSaving
                ? <ActivityIndicator color="white" />
                : <Text style={styles.saveBtnText}>{deepenMode === 'full' ? 'Deepen Compatibility' : 'Update Reading'}</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* ─── SUCCESS TOAST ─── */}
      {successToast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastIcon}>✦</Text>
            <Text style={styles.toastText}>{successToast}</Text>
          </View>
        </Animated.View>
      )}

      {/* V1.2 — Partner-consent confirm modal removed. It rendered behind the
          pageSheet Add Person modal on iOS (modal-on-modal layering bug),
          making the Calculate Compatibility button silently do nothing.
          The inline 🔒 disclosure at the top of the Add Person modal
          ("This information stays only on your device") satisfies Apple 5.1.1. */}
    </View>
  );
}

// ── PDF HTML (kept as-is) ──
const esc = (str) => { if (!str) return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
const nl2p = (text, cls = 'body') => (text || '').split(/\n\n+/).filter(Boolean).map(p => `<p class="${cls}">${esc(p)}</p>`).join('');

const generateMatchReportHTML = (report, user, partner, synastry, role = 'partner') => {
  const p1Name = user?.name?.split(' ')[0] || 'You';
  const p2Name = partner?.name?.split(' ')[0] || 'Partner';
  const p1Sun = user?.chart?.planets?.find(p => p.name === 'Sun');
  const p1Moon = user?.chart?.planets?.find(p => p.name === 'Moon');
  const p2Sun = partner?.chart?.planets?.find(p => p.name === 'Sun');
  const p2Moon = partner?.chart?.planets?.find(p => p.name === 'Moon');
  const score = synastry?.harmonyScore || 0;
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  // V1: zodiac glyph ring removed from PDF cover. Replaced with neutral sparkle ring.
  const ZR = '✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧';
  const theme = getReportTheme(role);
  // V1 Path A: planet glyphs (♀ ♂ ♃ ♄ ☉ ☽ ☿ ♅) replaced with neutral relational
  // glyphs in `uniqueIcon` and `child.icon`. Same on partner detail surface.
  const cfg = { partner: { scoreLabels: ['Emotional', 'Attraction', 'Communication', 'Stability'], scoreKeys: ['emotional', 'attraction', 'communication', 'stability'], icon: '♡', connectionSub: 'What draws you together', emotionalSub: 'How you connect emotionally', uniqueIcon: '♡', adviceLabel: 'RELATIONSHIP ADVICE' }, friend: { scoreLabels: ['Trust', 'Fun & Energy', 'Communication', 'Growth'], scoreKeys: ['trust', 'fun', 'communication', 'growth'], icon: '★', connectionSub: 'Why this friendship matters', emotionalSub: 'Your friendship energy', uniqueIcon: '★', adviceLabel: 'FRIENDSHIP ADVICE' }, parent: { scoreLabels: ['Understanding', 'Support', 'Communication', 'Boundaries'], scoreKeys: ['understanding', 'support', 'communication', 'boundaries'], icon: '◎', connectionSub: 'How you fit together', emotionalSub: 'Emotional inheritance', uniqueIcon: '◎', adviceLabel: 'RELATIONSHIP ADVICE' }, sibling: { scoreLabels: ['Bond', 'Communication', 'Shared Growth', 'Support'], scoreKeys: ['bond', 'communication', 'sharedGrowth', 'support'], icon: '◇', connectionSub: 'Your shared origin', emotionalSub: 'How you relate', uniqueIcon: '◇', adviceLabel: 'SIBLING ADVICE' }, boss: { scoreLabels: ['Respect', 'Work Sync', 'Communication', 'Growth'], scoreKeys: ['respect', 'workSync', 'communication', 'growth'], icon: '◆', connectionSub: 'Professional alignment', emotionalSub: 'Work styles', uniqueIcon: '◆', adviceLabel: 'CAREER STRATEGIES' }, colleague: { scoreLabels: ['Work Sync', 'Communication', 'Innovation', 'Trust'], scoreKeys: ['workSync', 'communication', 'innovation', 'trust'], icon: '✧', connectionSub: 'Why you collaborate', emotionalSub: 'Work energies', uniqueIcon: '✧', adviceLabel: 'COLLABORATION TIPS' }, child: { scoreLabels: ['Nurturing', 'Communication', 'Understanding', 'Guidance'], scoreKeys: ['nurturing', 'communication', 'understanding', 'guidance'], icon: '✦', connectionSub: 'How you bond', emotionalSub: 'Your nurturing bond', uniqueIcon: '✦', adviceLabel: 'PARENTING WISDOM' }, other: { scoreLabels: ['Emotional', 'Communication', 'Connection', 'Stability'], scoreKeys: ['emotional', 'communication', 'attraction', 'stability'], icon: '✦', connectionSub: 'What connects you', emotionalSub: 'How you relate', uniqueIcon: '✦', adviceLabel: 'ADVICE' } }[role] || { scoreLabels: ['Emotional', 'Communication', 'Connection', 'Stability'], scoreKeys: ['emotional', 'communication', 'attraction', 'stability'], icon: '✦', connectionSub: 'What connects you', emotionalSub: 'How you relate', uniqueIcon: '✦', adviceLabel: 'ADVICE' };
  const barColors = ['#E85090', '#E86050', '#50A0C8', '#C49A2A'];
  const scoreBars = cfg.scoreKeys.map((k, i) => ({ label: cfg.scoreLabels[i], pct: synastry?.scores?.[k] || 0, color: barColors[i] }));
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page{margin:0;size:letter}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;background:#FAF8F3;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page-break{page-break-before:always}
.cover{width:100%;height:100vh;background:#0B0E1A;page-break-after:always;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px}
.cover-border{position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:0.5px solid rgba(196,154,42,0.3)}
.cover-inner{position:relative;z-index:2;text-align:center;width:100%}
.cover-brand{font-size:10px;font-weight:700;color:#C49A2A;letter-spacing:6px;text-transform:uppercase;font-family:Helvetica,sans-serif;margin-bottom:16px}
.cover-rule{width:100px;height:0.5px;background:#C49A2A;margin:0 auto 20px}.cover-badge{display:inline-block;border:0.5px solid rgba(196,154,42,0.4);border-radius:2px;padding:4px 16px;font-size:8px;color:#F5E6A8;letter-spacing:3.5px;text-transform:uppercase;font-family:Helvetica,sans-serif;margin-bottom:24px}
.cover-zodiac{font-size:7px;color:rgba(196,154,42,0.25);letter-spacing:6px;margin-bottom:20px}
.cover-names{font-size:36px;font-weight:700;color:#FAF8F3;letter-spacing:1px;margin-bottom:6px;line-height:1.3}.cover-amp{color:#C49A2A;font-style:italic}
.cover-signs{font-size:13px;color:rgba(250,248,243,0.5);letter-spacing:1.5px;margin-bottom:18px;font-family:Helvetica,sans-serif}
.cover-divider{display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:16px}.cover-line{width:70px;height:0.5px;background:rgba(196,154,42,0.5)}.cover-star{font-size:10px;color:rgba(196,154,42,0.6)}
.cover-headline{font-size:13.5px;font-style:italic;color:#C49A2A;line-height:1.8;max-width:360px;margin:0 auto 20px}
.cover-score{font-size:52px;font-weight:700;color:#FAF8F3;margin-bottom:4px}.cover-score-label{font-size:9px;color:rgba(196,154,42,0.7);letter-spacing:3px;text-transform:uppercase;font-family:Helvetica,sans-serif;margin-bottom:20px}
.cover-pills{display:flex;gap:12px;justify-content:center;margin-bottom:20px}.cover-pill{border:0.5px solid rgba(196,154,42,0.35);border-radius:3px;padding:6px 14px;text-align:center;background:rgba(196,154,42,0.04)}.cover-pill-sign{font-size:11px;font-weight:700;color:#FAF8F3;margin-bottom:2px}.cover-pill-role{font-size:6.5px;color:rgba(196,154,42,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:700;font-family:Helvetica,sans-serif}
.cover-foot{position:absolute;bottom:40px;left:0;right:0;text-align:center;z-index:2}.cover-foot-text{font-size:7px;color:rgba(196,154,42,0.3);letter-spacing:2px;font-family:Helvetica,sans-serif}.cover-foot-date{font-size:6.5px;color:rgba(250,248,243,0.2);letter-spacing:1px;margin-top:3px;font-family:Helvetica,sans-serif}
.ph{background:#0D1527;padding:13px 45px;display:flex;justify-content:space-between;align-items:center;font-family:Helvetica,sans-serif;margin-bottom:24px}.ph-left{font-size:8px;font-weight:700;color:#C49A2A;letter-spacing:3px;text-transform:uppercase}.ph-right{font-size:7px;color:#F5E6A8;letter-spacing:1.2px}
.pf{font-family:Helvetica,sans-serif;font-size:7px;color:#9C9590;letter-spacing:0.5px;text-align:center;padding:12px 45px;border-top:1px solid #E0DAD3;margin-top:auto}.pc{padding:0 45px 20px}
.sl{font-size:9px;font-weight:700;color:#C49A2A;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:6px;margin-top:4px;font-family:Helvetica,sans-serif}.sr{border-bottom:1px solid #C49A2A;opacity:0.35;margin-bottom:16px}
.body{font-size:10.5px;color:#1A1614;line-height:1.85;margin-bottom:10px;text-align:justify}.ornament{color:#C49A2A;text-align:center;letter-spacing:10px;font-size:14px;margin:22px 0;opacity:0.7}
.sbar-row{margin-bottom:10px}.sbar-top{display:flex;justify-content:space-between;margin-bottom:3px}.sbar-name{font-size:9px;color:#5C5650;font-family:Helvetica,sans-serif}.sbar-pct{font-size:9px;color:#C49A2A;font-weight:600;font-family:Helvetica,sans-serif}.sbar-track{height:6px;background:#EDEBE8;border-radius:3px;overflow:hidden}.sbar-fill{height:100%;border-radius:3px}
.section-band{background:#0D1527;margin:0 -45px;padding:14px 45px;display:flex;align-items:center;gap:14px;page-break-inside:avoid;page-break-after:avoid}.section-icon{font-size:18px;color:#C49A2A;min-width:24px;text-align:center}.section-title{font-size:15px;font-weight:700;color:#FAF8F3;margin-bottom:2px}.section-sub{font-size:9px;color:#F5E6A8;font-family:Helvetica,sans-serif;letter-spacing:0.5px}.section-content{padding:16px 0 8px}
.callout{border-radius:5px;padding:12px 14px;margin:10px 0 12px;display:flex;gap:10px;align-items:flex-start;page-break-inside:avoid}.callout-icon{font-size:14px;color:#C49A2A;min-width:18px;text-align:center;margin-top:1px}.callout-label{font-size:7.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;display:block;font-family:Helvetica,sans-serif}.callout-text{font-size:10px;color:#1A1614;line-height:1.65}
.gold-callout{background:#FDF8ED;border-left:3px solid #C49A2A}.gold-label{color:#C49A2A}.pink-callout{background:#FDF0F4;border-left:3px solid #E85090}.pink-label{color:#E85090}.blue-callout{background:#F0F6FA;border-left:3px solid #50A0C8}.blue-label{color:#50A0C8}.red-callout{background:#FDF2F0;border-left:3px solid #E86050}.red-label{color:#E86050}
.growth-row{display:flex;gap:12px;margin-bottom:12px}.growth-card{flex:1;background:#FFF;border:1px solid #E0DAD3;border-radius:5px;padding:14px;page-break-inside:avoid}.growth-title{font-size:10px;font-weight:700;color:#0D1527;margin-bottom:6px}.growth-text{font-size:9.5px;color:#5C5650;line-height:1.65}
.closing{background:#0D1527;width:100%;height:100vh;padding:0;page-break-before:always;display:flex;flex-direction:column;position:relative}.closing-content{padding:0 45px;flex:1;position:relative;z-index:1}.closing-body{font-size:10.5px;color:#E8E4DF;line-height:1.9;margin-bottom:14px;text-align:justify}.closing-verdict{border:1px solid rgba(196,154,42,0.6);border-radius:6px;padding:22px 30px;margin:0 auto 36px;max-width:400px;text-align:center}.closing-verdict-text{font-size:18px;font-weight:700;color:#C49A2A;letter-spacing:3px}.closing-brand{text-align:center;padding:24px 45px 32px;border-top:1px solid rgba(196,154,42,0.2);position:relative;z-index:1}.closing-brand-name{font-size:18px;font-weight:700;color:#C49A2A;letter-spacing:4px;margin-bottom:6px}.closing-tagline{font-size:10px;color:#F5E6A8;font-style:italic;margin-bottom:18px}.closing-disclaimer{font-size:7.5px;color:#4A4035;line-height:1.7;text-align:center;font-family:Helvetica,sans-serif}
.advice-item{display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;page-break-inside:avoid}.advice-num{font-size:10px;font-weight:700;color:#C49A2A;min-width:18px;font-family:Helvetica,sans-serif}.advice-text{font-size:10.5px;color:#1A1614;line-height:1.7}
</style></head><body>
<div class="cover"><div class="cover-border"></div><div class="cover-inner"><div class="cover-brand">CELESTIA</div><div class="cover-rule"></div><div class="cover-badge">${esc(theme.coverBadge)}</div><div class="cover-zodiac">${ZR}</div><div class="cover-names">${esc(p1Name)} <span class="cover-amp">&</span> ${esc(p2Name)}</div><div class="cover-signs">${p1Sun?.sign || '—'} ${cfg.icon} ${p2Sun?.sign || '—'}</div><div class="cover-divider"><div class="cover-line"></div><div class="cover-star">${cfg.icon}</div><div class="cover-line"></div></div><div class="cover-headline">"${esc(report.headline || '')}"</div><div class="cover-score">${score}%</div><div class="cover-score-label">COMPATIBILITY SCORE</div><div class="cover-pills"><div class="cover-pill"><div class="cover-pill-sign">${esc(p1Name)}</div><div class="cover-pill-role">☉ ${p1Sun?.sign || '—'} · ☽ ${p1Moon?.sign || '—'}</div></div><div class="cover-pill"><div class="cover-pill-sign">${esc(p2Name)}</div><div class="cover-pill-role">☉ ${p2Sun?.sign || '—'} · ☽ ${p2Moon?.sign || '—'}</div></div></div></div><div class="cover-foot"><div class="cover-foot-text">YOUR PATTERNS, YOUR STORY</div><div class="cover-foot-date">${esc(genDate)}</div></div></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · OVERVIEW</span></div><div class="pc"><div class="sl">${esc(theme.title.toUpperCase())} OVERVIEW</div><div class="sr"></div><p class="body" style="font-style:italic;color:#C49A2A;font-size:12px;margin-bottom:16px">"${esc(report.tagline || '')}"</p>${nl2p(report.overview)}<div class="ornament">· · ·</div><div class="sl">SCORE BREAKDOWN</div><div class="sr"></div>${scoreBars.map(b => `<div class="sbar-row"><div class="sbar-top"><span class="sbar-name">${b.label}</span><span class="sbar-pct">${b.pct}%</span></div><div class="sbar-track"><div class="sbar-fill" style="width:${b.pct}%;background:${b.color}"></div></div></div>`).join('')}</div><div class="pf">Celestia · ${esc(theme.title)} · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DEEP DIVE</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px"><span class="section-icon">${cfg.icon}</span><div><div class="section-title">${esc(report.soulConnection?.title || 'How You Connect')}</div><div class="section-sub">${cfg.connectionSub}</div></div></div><div class="section-content">${nl2p(report.soulConnection?.description)}</div><div class="ornament">· · ·</div><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228"><span class="section-icon">☽</span><div><div class="section-title">${esc(report.emotionalDynamic?.title || 'Emotional Dynamic')}</div><div class="section-sub">${cfg.emotionalSub}</div></div></div><div class="section-content"><div class="callout pink-callout"><div class="callout-icon">☽</div><div><div class="callout-label pink-label">${esc(report.emotionalDynamic?.section1Label || p1Name.toUpperCase())}</div><p class="callout-text">${esc(report.emotionalDynamic?.section1 || report.emotionalDynamic?.howYouLove || '')}</p></div></div><div class="callout blue-callout"><div class="callout-icon">☽</div><div><div class="callout-label blue-label">${esc(report.emotionalDynamic?.section2Label || p2Name.toUpperCase())}</div><p class="callout-text">${esc(report.emotionalDynamic?.section2 || report.emotionalDynamic?.howTheyLove || '')}</p></div></div><div class="callout gold-callout"><div class="callout-icon">${cfg.icon}</div><div><div class="callout-label gold-label">TOGETHER</div><p class="callout-text">${esc(report.emotionalDynamic?.together)}</p></div></div></div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DYNAMICS</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#0D2535"><span class="section-icon">☿</span><div><div class="section-title">${esc(report.communicationStyle?.title || 'Communication')}</div><div class="section-sub">How you connect mentally</div></div></div><div class="section-content">${nl2p(report.communicationStyle?.dynamic)}<div class="callout gold-callout"><div class="callout-icon">✦</div><div><div class="callout-label gold-label">PRO TIP</div><p class="callout-text">${esc(report.communicationStyle?.tip)}</p></div></div></div><div class="ornament">· · ·</div><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#2A1008"><span class="section-icon">${cfg.uniqueIcon}</span><div><div class="section-title">${esc(report.uniqueSection?.title || report.attraction?.title || 'Connection')}</div><div class="section-sub">The dynamic between you</div></div></div><div class="section-content"><div class="callout red-callout"><div class="callout-icon">${cfg.uniqueIcon}</div><div><div class="callout-label red-label">THE SPARK</div><p class="callout-text">${esc(report.uniqueSection?.spark || report.attraction?.spark || '')}</p></div></div><div class="callout gold-callout"><div class="callout-icon">△</div><div><div class="callout-label gold-label">THE TENSION</div><p class="callout-text">${esc(report.uniqueSection?.tension || report.attraction?.tension || '')}</p></div></div></div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · GROWTH</span></div><div class="pc"><div class="sl">GROWTH AREAS</div><div class="sr"></div><div class="growth-row">${(report.growthAreas || []).map(g => `<div class="growth-card"><div class="growth-title">${esc(g.title)}</div><div class="growth-text">${esc(g.insight)}</div></div>`).join('')}</div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · FUTURE</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228"><span class="section-icon">♄</span><div><div class="section-title">Long-Term Outlook</div><div class="section-sub">Where this is heading</div></div></div><div class="section-content">${nl2p(report.longTerm?.forecast)}<div class="callout gold-callout"><div class="callout-icon">✦</div><div><div class="callout-label gold-label">THE VERDICT</div><p class="callout-text" style="font-weight:700">${esc(report.longTerm?.verdict)}</p></div></div></div><div class="ornament">· · ·</div><div class="sl">${cfg.adviceLabel}</div><div class="sr"></div>${(report.advice || []).map((a, i) => `<div class="advice-item"><span class="advice-num">${i + 1}.</span><span class="advice-text">${esc(a)}</span></div>`).join('')}</div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="closing"><div class="ph" style="background:rgba(255,255,255,0.04)"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · YOUR JOURNEY</span></div><div class="closing-content"><div style="margin-bottom:32px">${nl2p(report.closingMessage, 'closing-body')}</div><div style="color:#C49A2A;text-align:center;letter-spacing:12px;font-size:12px;margin:26px 0;opacity:0.6">· · ·</div><div class="closing-verdict"><div class="closing-verdict-text">${esc(report.cosmicVerdict || '')}</div></div></div><div class="closing-brand"><div class="closing-brand-name">CELESTIA</div><div class="closing-tagline">Your patterns, your story</div><div class="closing-disclaimer">Generated using astronomical calculations and AI.<br/>For entertainment and self-reflection. ${esc(genDate)}</div></div></div>
</body></html>`;
};

const styles = StyleSheet.create({
  // Hero (compact) — V1.2 Light Liquid Glass
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 28, alignItems: 'center' },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: T.ink, marginBottom: 4, textAlign: 'center', letterSpacing: -0.4 },
  sub: { fontSize: 12, fontFamily: FONTS.sans, color: T.inkDim, textAlign: 'center' },
  // HIG: 44pt minimum touch target. paddingVertical 12 + 12pt text → ≥44pt visual.
  heroAddBtn: { backgroundColor: T.surface, borderWidth: 1, borderColor: 'rgba(92,36,52,0.18)', borderRadius: 100, paddingVertical: 12, paddingHorizontal: 24, marginTop: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  heroAddBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.clay, letterSpacing: 0.2 },

  // Concentric orbit system
  orbitSystemWrap: { alignItems: 'center', paddingVertical: 10 },
  orbitSystem: { position: 'relative' },
  orbitRingTrack: { position: 'absolute', borderWidth: 1.2 },
  orbitRingLayer: { position: 'absolute', zIndex: 5 },
  centerOrbWrap: { position: 'absolute', zIndex: 20 },
  centerPulse: { position: 'absolute', backgroundColor: 'rgba(200,168,75,0.2)' },
  centerOrb: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', shadowColor: '#C8A84B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  centerOrbText: { fontFamily: FONTS.serif, fontSize: 20, color: 'white' },
  centerOrbSign: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: -2 },

  // Orbit orbs (people)
  orbitOrb: { position: 'absolute', alignItems: 'center', zIndex: 5 },
  orbitOrbInner: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 4 },
  orbitOrbInitial: { fontFamily: FONTS.serif, fontSize: 15, color: 'white' },
  orbitOrbGlyph: { fontSize: 7, color: 'rgba(255,255,255,0.5)', marginTop: -1 },
  orbitOrbScore: { backgroundColor: T.navy, borderRadius: 7, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', marginTop: -2 },
  orbitOrbScoreText: { fontSize: 7, fontFamily: FONTS.sansSemiBold, color: T.gold },
  orbitOrbName: { fontSize: 9, color: T.navy, fontFamily: FONTS.sansMedium, marginTop: 1, textAlign: 'center', width: 50 },
  orbitAddBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(200,168,75,0.3)', alignItems: 'center', justifyContent: 'center' },

  // Legend (pinned to bottom)
  legendWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 8, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'white', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { fontSize: 9, fontFamily: FONTS.sansMedium, color: T.stone },
  legendCount: { fontSize: 9, fontFamily: FONTS.sansSemiBold, color: T.navy },
  legendAdd: { fontSize: 11, color: T.gold, marginLeft: 1 },

  // People list
  peopleListSection: { paddingHorizontal: 20, marginBottom: 10, marginTop: 14 },
  peopleListLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  personRowOrb: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  personRowOrbText: { fontFamily: FONTS.serif, fontSize: 15, color: 'white' },
  personRowName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 1 },
  personRowSub: { fontSize: 11, color: T.stone },
  personRowScoreBadge: { backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 20, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(200,168,75,0.3)' },
  personRowScoreText: { fontSize: 15, fontFamily: FONTS.serif, color: T.gold },

  // Add card
  addCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: 'white', borderRadius: 17, padding: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D4CFC4', flexDirection: 'row', alignItems: 'center', gap: 13 },
  addCardIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(200,168,75,0.3)', alignItems: 'center', justifyContent: 'center' },
  addCardTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 2 },
  addCardSub: { fontSize: 11.5, color: T.stone },

  // Detail screen
  ddHero: { paddingTop: Platform.OS === 'ios' ? 110 : (StatusBar.currentHeight || 48) + 60, paddingBottom: 28, paddingHorizontal: 22, alignItems: 'center' },
  // V1.2 — Light Liquid Glass back button: pill with chevron + "Connections" label.
  // Surface white over the cream hero, soft shadow, ink text — readable + tappable.
  ddBack: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 48) + 8, left: 14, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 7, paddingLeft: 8, paddingRight: 14, borderRadius: 100, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hairline, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  ddBackChevron: { fontSize: 18, color: T.clay, fontFamily: FONTS.sansSemiBold, marginRight: 2, lineHeight: 22 },
  ddBackLabel: { fontSize: 13, color: T.clay, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.2 },
  ddPair: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  // V1.2 — Light Liquid Glass: orb borders use white-on-light for soft inset.
  ddOrb: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
  ddOrbText: { fontFamily: FONTS.serif, fontSize: 19, color: 'white' },
  ddConnector: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  ddLine: { width: 24, height: 1, backgroundColor: 'rgba(92,36,52,0.25)' },
  ddHeart: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.hairline },
  // Hero text colors flipped for light hero gradient.
  ddTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.ink, marginBottom: 2, textAlign: 'center', letterSpacing: -0.3 },
  ddSub: { fontSize: 12, color: T.inkDim, marginBottom: 12 },
  ddScoreWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  ddScoreNum: { position: 'absolute', fontFamily: FONTS.serif, fontSize: 26, color: T.ink },
  ddVerdict: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 13, color: T.inkDim, fontStyle: 'italic', marginBottom: 12 },
  ddChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  ddChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hairline, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10 },
  ddChipLabel: { fontSize: 10, color: T.inkDim },
  ddChipVal: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.ink },
  ddShareBtn: { marginTop: 14, backgroundColor: T.surface, borderWidth: 1, borderColor: 'rgba(92,36,52,0.20)', borderRadius: 100, paddingVertical: 9, paddingHorizontal: 22, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  ddShareBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.clay, letterSpacing: 0.2 },
  ddBody: { padding: 20 },
  ddSectionLbl: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.inkDim, marginBottom: 10, marginTop: 4 },
  ddAiCard: { backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: T.hairline },
  ddAiText: { fontSize: 13, color: T.ink, lineHeight: 21 },
  destinyBadge: { backgroundColor: 'rgba(92,36,52,0.08)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(92,36,52,0.22)', marginTop: 6 },
  destinyBadgeText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.clay, letterSpacing: 1.5 },
  ddDimCard: { backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: T.hairline, gap: 10 },
  dimRow: { gap: 4 },
  dimTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dimIcon: { fontSize: 12, width: 18 },
  dimLabel: { fontSize: 12, color: T.ink, fontFamily: FONTS.sansMedium, flex: 1 },
  dimPct: { fontSize: 12, color: T.clay, fontFamily: FONTS.sansSemiBold },
  dimTrack: { flex: 1, height: 5, backgroundColor: 'rgba(42,36,24,0.06)', borderRadius: 3, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 3 },
  ddSeasonCard: { backgroundColor: 'rgba(92,36,52,0.05)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(92,36,52,0.14)' },
  ddSeasonText: { fontSize: 12, color: T.ink, fontFamily: FONTS.sans, lineHeight: 18 },
  ddActiveCard: { backgroundColor: T.warm, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: T.hairline },
  ddAreaCard: { backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.hairline },
  ddAreaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ddAreaName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.ink },
  ddAreaScore: { fontSize: 14, fontFamily: FONTS.serif, color: T.clay },
  ddAreaStrength: { fontSize: 12.5, color: '#4A8060', lineHeight: 19, marginBottom: 4 },
  ddAreaTension: { fontSize: 12.5, color: '#A06050', lineHeight: 19, marginBottom: 4 },
  ddAreaAnalysis: { fontSize: 12.5, color: T.ink, lineHeight: 19, marginBottom: 4 },
  ddAreaReflection: { fontSize: 12, color: T.inkDim, fontStyle: 'italic', marginTop: 4 },
  ddChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  ddValueChip: { backgroundColor: 'rgba(92,36,52,0.07)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(92,36,52,0.20)' },
  ddValueText: { fontSize: 11, color: T.clay, fontFamily: FONTS.sansMedium },
  ddLinkChip: { backgroundColor: 'rgba(126,200,160,0.12)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(126,200,160,0.3)' },
  ddLinkChipHard: { backgroundColor: 'rgba(232,120,120,0.1)', borderColor: 'rgba(232,120,120,0.3)' },
  ddLinkText: { fontSize: 11, color: '#5C7E66', fontFamily: FONTS.sansMedium },
  ddLinkTextHard: { color: '#A85050' },
  ddActionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ddActionBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(92,36,52,0.22)', paddingVertical: 12, alignItems: 'center', backgroundColor: T.surface },
  ddActionBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.clay, letterSpacing: 0.2 },
  // PDF download card stays as a richer surface but uses clay tones now.
  ddDownload: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 18 },
  ddDownloadGrad: { padding: 20, position: 'relative', overflow: 'hidden' },
  ddDownloadGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(92,36,52,0.08)', right: -40, top: -40 },
  ddDownloadTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.cream, marginBottom: 6 },
  ddDownloadSub: { fontSize: 12, color: 'rgba(250,248,242,0.7)', lineHeight: 18, marginBottom: 14 },
  ddDownloadCta: { backgroundColor: 'rgba(250,248,242,0.16)', borderWidth: 1, borderColor: 'rgba(250,248,242,0.28)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: T.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: T.hairline },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.ink, letterSpacing: -0.3 },
  modalClose: { fontSize: 18, color: T.inkDim, padding: 4 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8, marginTop: 16 },
  fieldHint: { fontSize: 11, color: T.stone, marginTop: 6, paddingHorizontal: 2, lineHeight: 15, fontFamily: FONTS.sans, fontStyle: 'italic' },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, color: T.ink, borderWidth: 1, borderColor: '#EDE6D8', fontFamily: FONTS.sansLight },
  // V1.2 — Inline iOS date/time picker. Tap field to expand spinner with Done button.
  // Avoids modal-in-modal issues (Add Person modal already wraps the form in a Modal).
  inlinePickerBox: { backgroundColor: 'rgba(92,36,52,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(92,36,52,0.10)', marginTop: 10, paddingVertical: 8, alignItems: 'center' },
  pickerDoneBtn: { backgroundColor: '#5C2434', borderRadius: 100, paddingVertical: 9, paddingHorizontal: 28, marginTop: 4, marginBottom: 4 },
  pickerDoneText: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: '#FAF8F2', letterSpacing: 0.3 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4CFC4', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: T.clay, borderColor: T.clay },
  checkLabel: { fontSize: 13, color: T.stone },
  suggestions: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#EDE6D8', marginTop: 4, overflow: 'hidden' },
  suggestion: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#F5EEE4' },
  saveBtn: { backgroundColor: T.clay, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  saveBtnText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream, letterSpacing: 0.3 },
  relTypePill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, backgroundColor: 'white', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  relTypePillActive: { backgroundColor: T.navy, borderColor: T.navy },
  relTypePillText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.stone },
  relTypePillTextActive: { color: T.cream },
  zodiacToggle: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, paddingVertical: 8 },
  zodiacGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zodiacChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.03)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  zodiacChipActive: { backgroundColor: 'rgba(200,168,75,0.12)', borderColor: T.gold },
  zodiacChipText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.stone },
  zodiacChipTextActive: { color: T.navy },
  zodiacOnlyBadge: { backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 },
  zodiacOnlyBadgeText: { fontSize: 11, color: T.stone, lineHeight: 17 },

  // Story modal
  storyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  storyTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44 },
  storyCloseText: { color: 'rgba(255,255,255,0.6)', fontSize: 18 },
  storyModalTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: 'rgba(255,255,255,0.5)' },
  storyPreview: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  storyCardWrap: { borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 40, transform: [{ scale: 0.82 }] },
  storyLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  storyLoadingText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  storyThemeSection: { alignItems: 'center', marginBottom: 16 },
  storyThemeLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.5, color: 'rgba(255,255,255,0.25)', marginBottom: 10 },
  storyThemeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyThemeOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  storyThemeOptionOn: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)' },
  storyThemeSwatch: { width: 10, height: 10, borderRadius: 5 },
  storyThemeName: { fontSize: 12, fontFamily: FONTS.sansMedium, color: 'rgba(255,255,255,0.35)' },
  storyShareBtn: { borderRadius: 100, overflow: 'hidden', width: '75%' },
  storyShareGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  storyShareText: { fontSize: 16, fontFamily: FONTS.sansSemiBold, color: 'white' },

  // Unique role-specific detail sections
  uniqueCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  uniqueTwoCol: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  uniqueColCard: { flex: 1, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: 10, alignItems: 'center', gap: 4 },
  uniqueColIcon: { fontSize: 16, marginBottom: 2 },
  uniqueColLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: T.stone, textTransform: 'uppercase' },
  uniqueColText: { fontSize: 12, color: T.ink, textAlign: 'center', lineHeight: 18 },
  uniqueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  uniqueRowIcon: { fontSize: 14, width: 20, textAlign: 'center', marginTop: 1 },
  uniqueRowLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 2 },
  uniqueRowText: { fontSize: 12.5, color: T.ink, lineHeight: 19 },
  uniqueHighlight: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(200,168,75,0.12)', marginTop: 6 },
  uniqueHighlightLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 3 },
  uniqueHighlightText: { fontSize: 12.5, color: T.ink, lineHeight: 19 },
  uniqueAffirmation: { backgroundColor: 'rgba(74,128,96,0.06)', borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(74,128,96,0.12)' },
  uniqueAffirmationText: { fontSize: 13, color: '#4A8060', fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  uniqueDynamicLabel: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 10 },
  uniqueBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  uniqueBarLabel: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.stone, width: 55 },
  uniqueBarPct: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.ink, width: 32, textAlign: 'right' },
  uniqueBodyText: { fontSize: 12.5, color: T.ink, lineHeight: 19, marginBottom: 6 },
  ddDeleteBtn: { alignSelf: 'center', marginTop: 16, marginBottom: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(220,80,80,0.25)', backgroundColor: 'rgba(220,80,80,0.06)' },
  ddDeleteBtnText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: '#DC5050' },
  // Blurred premium sections
  blurredSection: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0E8DA', overflow: 'hidden' },
  blurredHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  blurredTitle: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy },
  blurredSub: { fontSize: 11, color: T.stone, marginTop: 1 },
  blurredContent: { opacity: 0.15 },
  blurredText: { fontSize: 12, color: T.stone, lineHeight: 18 },
  unlockDeepBtn: { marginTop: 8, marginBottom: 8, borderRadius: 14, overflow: 'hidden' },
  unlockDeepGrad: { paddingVertical: 14, alignItems: 'center' },
  unlockDeepText: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: 'white' },
  // Zodiac-only upgrade
  upgradeDepthCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)', borderRadius: 14, padding: 14, marginBottom: 10 },
  upgradeDepthIcon: { fontSize: 18, color: T.gold, width: 28, textAlign: 'center' },
  upgradeDepthTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.navy },
  upgradeDepthSub: { fontSize: 11, color: T.stone, marginTop: 1 },
  upgradeDepthArrow: { fontSize: 16, color: T.gold },
  // Ask Celestia bridge
  askCelestiaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.surface, borderWidth: 1, borderColor: 'rgba(92,36,52,0.18)', borderRadius: 14, padding: 14, marginBottom: 10 },
  askCelestiaBtnIcon: { fontSize: 18, color: T.clay, width: 28, textAlign: 'center' },
  askCelestiaBtnText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.ink },
  askCelestiaBtnSub: { fontSize: 11, fontFamily: FONTS.sans, color: T.inkDim, marginTop: 2 },
  askCelestiaBtnArrow: { fontSize: 16, color: T.clay },
  // Bridge to Reports
  reportsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(14,14,34,0.06)', borderWidth: 1, borderColor: 'rgba(14,14,34,0.10)', borderRadius: 14, padding: 14, marginBottom: 10 },
  reportsBtnIcon: { fontSize: 18, color: T.gold, width: 28, textAlign: 'center' },
  reportsBtnText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy },
  reportsBtnSub: { fontSize: 11, fontFamily: FONTS.sans, color: T.stone, marginTop: 2 },
  reportsBtnArrow: { fontSize: 16, color: T.stone },

  // Celebrity Match
  celebSection: { paddingTop: 8, paddingBottom: 4, marginBottom: 10 },
  celebHeader: { paddingHorizontal: 20, marginBottom: 12 },
  celebLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 4 },
  celebSub: { fontSize: 13, fontFamily: FONTS.serif, color: T.navy },
  celebScroll: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  celebChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', minWidth: 140 },
  celebChipActive: { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: T.gold },
  celebChipIcon: { fontSize: 20 },
  celebChipName: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 1 },
  celebChipNameActive: { color: T.navy },
  celebChipSign: { fontSize: 11, color: T.stone },
  celebChipSignActive: { color: T.gold },
  celebResultCard: { marginHorizontal: 20, marginTop: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', shadowColor: '#C8A84B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  celebResultTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  celebResultNames: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flex: 1, flexWrap: 'wrap' },
  celebResultYou: { fontSize: 15, fontFamily: FONTS.serif, color: T.navy },
  celebResultAmp: { fontSize: 14, fontFamily: FONTS.serif, color: T.gold },
  celebResultThem: { fontSize: 15, fontFamily: FONTS.serif, color: T.navy },
  celebResultScoreBadge: { backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)' },
  celebResultScore: { fontSize: 18, fontFamily: FONTS.serif, color: T.gold },
  celebResultVerdict: { fontSize: 13, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.stone, marginBottom: 10 },
  celebResultSignsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  celebResultSignText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },
  celebResultX: { fontSize: 10, color: T.gold },
  celebResultDims: { gap: 6, marginBottom: 12 },
  celebResultDimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  celebResultDimLabel: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.stone, width: 90 },
  celebResultDimTrack: { flex: 1, height: 5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  celebResultDimFill: { height: '100%', borderRadius: 3, backgroundColor: T.gold },
  celebResultDimPct: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.gold, width: 32, textAlign: 'right' },
  celebShareBtn: { alignSelf: 'flex-end', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(200,168,75,0.3)', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(200,168,75,0.06)' },
  celebShareText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },

  // Deepen Reading button (on partner cards in YOUR CONNECTIONS)
  deepenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -4, marginLeft: 62, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)', alignSelf: 'flex-start' },
  deepenBtnIcon: { fontSize: 12, color: T.gold },
  deepenBtnText: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.gold },
  deepenBtnArrow: { fontSize: 11, color: T.gold, marginLeft: 2 },

  // Add Birth Time button (on partner cards in YOUR CONNECTIONS)
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -4, marginLeft: 62, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(14,14,34,0.04)', borderWidth: 1, borderColor: 'rgba(14,14,34,0.08)', alignSelf: 'flex-start' },
  addTimeBtnIcon: { fontSize: 12, color: T.stone },
  addTimeBtnText: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.stone },

  // Add Birth Time nudge card (in detail view)
  addTimeNudgeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.hairline, borderRadius: 14, padding: 14, marginBottom: 10 },
  addTimeNudgeIcon: { fontSize: 18, color: T.clay, width: 28, textAlign: 'center' },
  addTimeNudgeTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.ink },
  addTimeNudgeSub: { fontSize: 11, color: T.inkDim, marginTop: 1, lineHeight: 16 },

  // Deepen modal extras
  deepenNameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  deepenNameLabel: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, flex: 1 },
  deepenSignBadge: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)' },
  deepenSignBadgeText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },
  deepenInfoBanner: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(200,168,75,0.12)' },
  deepenInfoText: { fontSize: 12, color: T.ink, lineHeight: 18 },
  deepenSaveBtn: { backgroundColor: T.gold },

  // Success toast
  toastContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 80 : (StatusBar.currentHeight || 48) + 20, left: 20, right: 20, alignItems: 'center', zIndex: 999 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.navy, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  toastIcon: { fontSize: 14, color: T.gold },
  toastText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.cream, flex: 1 },
});
