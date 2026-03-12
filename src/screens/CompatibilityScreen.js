import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert, Platform, StatusBar,
  Dimensions, Animated, Easing, BackHandler
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
import { ROLE_DETAIL_CONFIG } from '../constants/roleDetailConfig';

const { width: SCREEN_W } = Dimensions.get('window');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const ROLE_REPORT_THEMES = {
  partner: {
    gradient: ['#2D0A1E', '#1A0828', '#0D0515'], accent: '#E85090', accentSoft: 'rgba(232,80,144,0.12)', accentGlow: 'rgba(232,80,144,0.35)', title: 'Love Report', coverBadge: 'Love Compatibility Report', coverIcon: '♡', fileName: 'Love',
    steps: [
      { icon: '♡', label: 'Reading both charts', sub: 'Mapping your cosmic blueprints...' },
      { icon: '☽', label: 'Comparing Moon signs', sub: 'How you feel together...' },
      { icon: '♀', label: 'Analyzing Venus chemistry', sub: 'Love languages & attraction...' },
      { icon: '♂', label: 'Checking Mars dynamics', sub: 'Passion, desire & conflict...' },
      { icon: '☿', label: 'Mapping communication styles', sub: 'Mercury connections...' },
      { icon: '♄', label: 'Exploring long-term potential', sub: 'Saturn bonds & commitment...' },
      { icon: '✦', label: 'Writing your love story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '♡', label: 'Almost ready', sub: 'Your love report awaits...' },
    ],
    quotes: ['"Venus shows how you love. Their Venus shows how they need to be loved."', '"The Moon knows what your heart needs before you do."', '"Some connections are written in the stars. Others are written in Saturn."'],
  },
  friend: {
    gradient: ['#0A0828', '#160E28', '#0D0515'], accent: '#7E8CE8', accentSoft: 'rgba(126,140,232,0.12)', accentGlow: 'rgba(126,140,232,0.35)', title: 'Friendship Report', coverBadge: 'Friendship Compatibility Report', coverIcon: '★', fileName: 'Friendship',
    steps: [
      { icon: '★', label: 'Reading both charts', sub: 'Mapping your cosmic blueprints...' },
      { icon: '☽', label: 'Comparing emotional styles', sub: 'How you vibe together...' },
      { icon: '♃', label: 'Analyzing shared adventures', sub: 'Your fun factor...' },
      { icon: '☿', label: 'Mapping communication flow', sub: 'How you talk & listen...' },
      { icon: '♄', label: 'Measuring trust depth', sub: 'Saturn bonds & loyalty...' },
      { icon: '✦', label: 'Writing your friendship story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '★', label: 'Almost ready', sub: 'Your friendship report awaits...' },
    ],
    quotes: ['"True friendships are written in Jupiter — generous, expansive, and built to last."', '"Your Mercury signs reveal how deeply you truly understand each other."'],
  },
  parent: {
    gradient: ['#1A1510', '#14100E', '#0D0515'], accent: '#C8A060', accentSoft: 'rgba(200,160,96,0.12)', accentGlow: 'rgba(200,160,96,0.35)', title: 'Family Bond Report', coverBadge: 'Parent-Child Bond Report', coverIcon: '◎', fileName: 'Family',
    steps: [
      { icon: '◎', label: 'Reading both charts', sub: 'Mapping generational patterns...' },
      { icon: '☽', label: 'Comparing Moon signs', sub: 'Emotional inheritance...' },
      { icon: '♄', label: 'Analyzing Saturn bonds', sub: 'Boundaries & structure...' },
      { icon: '☿', label: 'Mapping communication styles', sub: 'How you speak & hear...' },
      { icon: '♆', label: 'Exploring healing paths', sub: 'Growth & forgiveness...' },
      { icon: '✦', label: 'Writing your family story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◎', label: 'Almost ready', sub: 'Your family report awaits...' },
    ],
    quotes: ['"Saturn connects the generations — what they learned, you inherited."', '"The Moon carries your family\'s emotional DNA."'],
  },
  sibling: {
    gradient: ['#1A1208', '#14100A', '#0D0515'], accent: '#E8A050', accentSoft: 'rgba(232,160,80,0.12)', accentGlow: 'rgba(232,160,80,0.35)', title: 'Sibling Report', coverBadge: 'Sibling Bond Report', coverIcon: '◇', fileName: 'Sibling',
    steps: [
      { icon: '◇', label: 'Reading both charts', sub: 'Mapping your shared origins...' },
      { icon: '☽', label: 'Comparing emotional wiring', sub: 'How you feel vs. how they feel...' },
      { icon: '♂', label: 'Analyzing rivalry & alliance', sub: 'Mars dynamics...' },
      { icon: '☿', label: 'Mapping communication', sub: 'Your shorthand language...' },
      { icon: '♃', label: 'Exploring shared growth', sub: 'Jupiter bonds...' },
      { icon: '✦', label: 'Writing your sibling story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◇', label: 'Almost ready', sub: 'Your sibling report awaits...' },
    ],
    quotes: ['"Siblings share a sky but read it differently."', '"Mars between siblings shows where rivalry becomes alliance."'],
  },
  boss: {
    gradient: ['#0A1520', '#0D1527', '#060D18'], accent: '#50A0C8', accentSoft: 'rgba(80,160,200,0.12)', accentGlow: 'rgba(80,160,200,0.35)', title: 'Work Dynamic Report', coverBadge: 'Professional Dynamic Report', coverIcon: '◆', fileName: 'Work',
    steps: [
      { icon: '◆', label: 'Reading both charts', sub: 'Mapping professional blueprints...' },
      { icon: '♄', label: 'Analyzing authority dynamics', sub: 'Saturn & power structures...' },
      { icon: '☿', label: 'Mapping communication style', sub: 'How to pitch & present...' },
      { icon: '♂', label: 'Checking work energy', sub: 'Mars drive & motivation...' },
      { icon: '♃', label: 'Exploring growth potential', sub: 'Career opportunities...' },
      { icon: '✦', label: 'Writing your work strategy', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '◆', label: 'Almost ready', sub: 'Your work report awaits...' },
    ],
    quotes: ['"Saturn shows how they lead. Your Mars shows how you respond to authority."', '"Mercury alignment reveals your communication sweet spot."'],
  },
  colleague: {
    gradient: ['#081A28', '#0A1420', '#060D18'], accent: '#50C8A0', accentSoft: 'rgba(80,200,160,0.12)', accentGlow: 'rgba(80,200,160,0.35)', title: 'Teamwork Report', coverBadge: 'Teamwork Compatibility Report', coverIcon: '✧', fileName: 'Teamwork',
    steps: [
      { icon: '✧', label: 'Reading both charts', sub: 'Mapping work styles...' },
      { icon: '☿', label: 'Analyzing communication', sub: 'How you collaborate...' },
      { icon: '♂', label: 'Checking project energy', sub: 'Mars work drive...' },
      { icon: '♅', label: 'Exploring innovation sync', sub: 'Creative brainstorming...' },
      { icon: '♄', label: 'Measuring trust & reliability', sub: 'Saturn bonds...' },
      { icon: '✦', label: 'Writing your teamwork profile', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '✧', label: 'Almost ready', sub: 'Your teamwork report awaits...' },
    ],
    quotes: ['"The best teams are built when Mercury signs understand each other."', '"Mars shows your work style — theirs shows what drives them."'],
  },
  child: {
    gradient: ['#0E1A14', '#0A1410', '#0D0515'], accent: '#7EC8A0', accentSoft: 'rgba(126,200,160,0.12)', accentGlow: 'rgba(126,200,160,0.35)', title: 'Parenting Report', coverBadge: 'Parenting Compatibility Report', coverIcon: '☽', fileName: 'Parenting',
    steps: [
      { icon: '☽', label: 'Reading both charts', sub: 'Mapping your bond...' },
      { icon: '☉', label: 'Analyzing their temperament', sub: 'Sun sign nature...' },
      { icon: '☽', label: 'Understanding emotional needs', sub: 'Moon sign feelings...' },
      { icon: '☿', label: 'Mapping communication', sub: 'How they hear & learn...' },
      { icon: '♃', label: 'Exploring nurturing approach', sub: 'What helps them grow...' },
      { icon: '✦', label: 'Writing your parenting guide', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '☽', label: 'Almost ready', sub: 'Your parenting report awaits...' },
    ],
    quotes: ['"Their Moon sign tells you what they need to feel safe."', '"Understanding their chart is the deepest form of parenting."'],
  },
  other: {
    gradient: ['#1A1228', '#14101E', '#0D0515'], accent: '#B080E0', accentSoft: 'rgba(176,128,224,0.12)', accentGlow: 'rgba(176,128,224,0.35)', title: 'Connection Report', coverBadge: 'Compatibility Report', coverIcon: '✦', fileName: 'Connection',
    steps: [
      { icon: '✦', label: 'Reading both charts', sub: 'Mapping your cosmic blueprints...' },
      { icon: '☽', label: 'Comparing Moon signs', sub: 'How you feel together...' },
      { icon: '☿', label: 'Mapping communication', sub: 'Mercury connections...' },
      { icon: '♄', label: 'Exploring bond depth', sub: 'Saturn connections...' },
      { icon: '✦', label: 'Writing your connection story', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '✦', label: 'Almost ready', sub: 'Your connection report awaits...' },
    ],
    quotes: ['"Every connection carries a cosmic signature."', '"The stars reveal what words cannot."'],
  },
};

const getReportTheme = (role) => ROLE_REPORT_THEMES[role] || ROLE_REPORT_THEMES.other;

const RELATIONSHIP_TYPES = [
  { key: 'partner', label: 'Partner', icon: '♡' },
  { key: 'friend', label: 'Best Friend', icon: '★' },
  { key: 'parent', label: 'Parent', icon: '◎' },
  { key: 'sibling', label: 'Sibling', icon: '◇' },
  { key: 'boss', label: 'Boss', icon: '◆' },
  { key: 'colleague', label: 'Colleague', icon: '✧' },
  { key: 'child', label: 'Child', icon: '☽' },
  { key: 'other', label: 'Other', icon: '✦' },
];

const ROLE_LABELS = {};
RELATIONSHIP_TYPES.forEach(r => { ROLE_LABELS[r.key] = r; });

// Category groups for orbit sections
const CATEGORY_GROUPS = [
  { key: 'love', label: 'LOVE', roles: ['partner'], gradient: ['#2D0A1E', '#1A0828'], icon: '♡' },
  { key: 'family', label: 'FAMILY', roles: ['parent', 'sibling', 'child'], gradient: ['#1A1A08', '#14120A'], icon: '◎' },
  { key: 'friends', label: 'FRIENDS', roles: ['friend'], gradient: ['#0E0A28', '#14101E'], icon: '★' },
  { key: 'work', label: 'WORK', roles: ['boss', 'colleague'], gradient: ['#081A28', '#0A1420'], icon: '◆' },
  { key: 'other', label: 'OTHER', roles: ['other'], gradient: ['#141210', '#0E0E0E'], icon: '✦' },
];

const getInitial = (name) => (name || '?')[0].toUpperCase();

const getScoreLabel = (score) => {
  if (score >= 90) return 'Written in the stars';
  if (score >= 80) return 'Deeply harmonious';
  if (score >= 70) return 'Strong connection';
  if (score >= 60) return 'Compatible souls';
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
  } catch (e) {}
  return null;
};

export default function CompatibilityScreen() {
  const navigation = useNavigation();
  const { userProfile, partnerProfiles, addPartner, removePartner } = useUserProfile();
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
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
    } catch (e) {}
    try { setCosmicSeason(getCosmicSeason(userProfile.chart, new Date())); } catch (e) {}
    try {
      const report = await generateMatchCore(userProfile, partnerProfile, synastry, transitContext, partnerRole);
      if (report?.snapshot) setAiAnalysis(report.snapshot);
      trackEvent('match_checked').catch(() => {});
      awardXP(userProfile?.id || 'default', 'compatibility_check').catch(() => {});
      completeQuestAction('compat_checked').catch(() => {});
    } catch (e) { console.warn('AI analysis failed:', e); }
    finally { setAiLoading(false); }
    setDetailsLoading(true);
    try { const details = await generateMatchDetails(userProfile, partnerProfile, transitContext, partnerRole); setMatchDetails(details); }
    catch (e) { console.warn('Match details failed:', e); }
    finally { setDetailsLoading(false); }
  };

  const handleSavePartner = async () => {
    if (!partnerName.trim()) { Alert.alert('Missing info', 'Please enter a name.'); return; }
    if (zodiacOnlyMode) {
      if (!selectedZodiacSign) { Alert.alert('Missing info', 'Please select their zodiac sign.'); return; }
      setSavingPartner(true);
      try {
        const partner = { id: await Crypto.randomUUID(), type: 'other', name: partnerName.trim(), relationshipType, isZodiacOnly: true, zodiacSign: selectedZodiacSign, birthDate: '2000-01-01', birthTime: '12:00', birthLocation: 'Unknown', isTimeUnknown: true, chart: { planets: [{ name: 'Sun', sign: selectedZodiacSign, degree: 15, house: 1 }], aspects: [], houses: [] } };
        await addPartner(partner);
        setShowAddModal(false);
        resetForm();
      } catch (e) { Alert.alert('Error', 'Failed to save.'); }
      finally { setSavingPartner(false); }
      return;
    }
    if (!partnerDate) { Alert.alert('Missing info', 'Please select a birth date.'); return; }
    if (!selectedCity) { Alert.alert('Missing info', 'Please select a birth city.'); return; }
    setSavingPartner(true);
    try {
      const dateStr = partnerDate.toISOString().split('T')[0];
      const timeStr = (isTimeUnknown || !partnerTime) ? '12:00' : `${partnerTime.getHours().toString().padStart(2,'0')}:${partnerTime.getMinutes().toString().padStart(2,'0')}`;
      const chart = await calculateChart(dateStr, timeStr, { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name }, isTimeUnknown, 'whole');
      const partner = { id: await Crypto.randomUUID(), type: 'other', name: partnerName.trim(), relationshipType, birthDate: dateStr, birthTime: timeStr, birthLocation: selectedCity.name, isTimeUnknown, chart };
      await addPartner(partner);
      setShowAddModal(false);
      resetForm();
    } catch (e) { Alert.alert('Error', 'Failed to calculate chart.'); }
    finally { setSavingPartner(false); }
  };

  const resetForm = () => { setPartnerName(''); setPartnerDate(null); setPartnerTime(null); setIsTimeUnknown(false); setCitySearch(''); setSelectedCity(null); setCitySuggestions([]); setRelationshipType('partner'); setZodiacOnlyMode(false); setSelectedZodiacSign(null); };

  const handleRemovePartner = (partner) => {
    Alert.alert('Remove Person', `Remove ${partner.name} from your circle?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removePartner(partner.id); setSelectedPartner(null); } },
    ]);
  };

  const advanceStep = useCallback((step) => { if (!pdfCancelledRef.current) setGenStep(step); }, []);

  const reportTheme = useMemo(() => getReportTheme(partnerRole), [partnerRole]);

  const handleDownloadReport = async () => {
    if (!synastry || !partnerProfile) return;
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
      trackEvent('report_downloaded').catch(() => {});
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
    await shareStoryCard(`${p1Name} & ${p2Name} — ${synastry?.harmonyScore || 0}% cosmic compatibility\n\n✦ ${viralInsights?.spark || ''}\n— Celestia`);
    trackEvent('share_story').catch(() => {}); awardXP(userProfile?.id || 'default', 'share').catch(() => {});
    setShowStoryModal(false);
  }, [userProfile, partnerProfile, synastry, viralInsights, shareStoryCard]);

  const userSun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const partnerSun = partnerProfile?.chart?.planets?.find(p => p.name === 'Sun');

  if (!userProfile?.chart) {
    return (
      <View style={{ flex: 1, backgroundColor: T.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: T.navy, textAlign: 'center', marginBottom: 10 }}>Complete your profile first</Text>
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 14, color: T.stone, textAlign: 'center' }}>Finish onboarding to unlock cosmic compatibility.</Text>
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
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      {/* ─── MAIN CIRCLE VIEW ─── */}
      {!showDetailScreen && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Compact hero header (sticky) */}
          <LinearGradient colors={['#0E0E22', '#1A1228', '#14101E']} style={styles.hero}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.title}>Your Circle</Text>
                  <CosmicTooltip id="synastry" size={16} light />
                </View>
                <Text style={styles.sub}>
                  {partnerProfiles.length === 0 ? 'Add people to your cosmic orbit' : `${partnerProfiles.length} ${partnerProfiles.length === 1 ? 'soul' : 'souls'} in your orbit`}
                </Text>
              </View>
              <TouchableOpacity style={styles.heroAddBtn} activeOpacity={0.7} onPress={() => setShowAddModal(true)}>
                <Text style={{ fontSize: 18, color: T.gold }}>+</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ─── CONCENTRIC ORBIT SYSTEM ─── */}
          <View style={styles.orbitSystemWrap}>
            <View style={[styles.orbitSystem, { width: ORBIT_AREA, height: ORBIT_AREA }]}>

              {/* Orbit ring tracks (visual only) */}
              {ORBIT_RINGS.map(ring => (
                <View key={ring.key + '_track'} pointerEvents="none"
                  style={[styles.orbitRingTrack, {
                    width: ring.radius * 2, height: ring.radius * 2,
                    borderRadius: ring.radius,
                    left: orbitCenter - ring.radius, top: orbitCenter - ring.radius,
                    borderColor: ring.borderColor,
                    backgroundColor: ring.color,
                  }]}
                />
              ))}

              {/* Center orb (YOU) */}
              <View style={[styles.centerOrbWrap, {
                left: orbitCenter - CENTER_SIZE / 2,
                top: orbitCenter - CENTER_SIZE / 2,
              }]}>
                <Animated.View style={[styles.centerPulse, {
                  width: CENTER_SIZE + 20, height: CENTER_SIZE + 20, borderRadius: (CENTER_SIZE + 20) / 2,
                  left: -10, top: -10,
                  transform: [{ scale: pulseScale }], opacity: pulseOpacity,
                }]} />
                <LinearGradient colors={['#E2C46A', '#8C6C18']} style={[styles.centerOrb, { width: CENTER_SIZE, height: CENTER_SIZE, borderRadius: CENTER_SIZE / 2 }]}>
                  <Text style={styles.centerOrbText}>{getInitial(userProfile.name)}</Text>
                  <Text style={styles.centerOrbSign}>{ZODIAC_GLYPHS[userSun?.sign] || '✦'}</Text>
                </LinearGradient>
              </View>

              {/* Rotating ring layers (people only) */}
              {ORBIT_RINGS.map((ring) => {
                const people = ringPeople[ring.key] || [];
                if (people.length === 0) return null;
                const ringSize = ring.radius * 2 + ORB_SIZE + 16;
                return (
                  <Animated.View key={ring.key + '_orbs'} pointerEvents="box-none" style={[styles.orbitRingLayer, {
                    width: ringSize, height: ringSize,
                    left: orbitCenter - ringSize / 2,
                    top: orbitCenter - ringSize / 2,
                    transform: [{ rotate: orbitRotations[ring.animIdx] }],
                  }]}>
                    {people.map((p) => {
                      const role = p.relationshipType || 'other';
                      const roleColor = ROLE_COLORS[role] || ROLE_COLORS.other;
                      const score = getQuickScore(userProfile.chart, p);
                      const pSun = p.chart?.planets?.find(pl => pl.name === 'Sun');
                      return (
                        <TouchableOpacity
                          key={p.id} activeOpacity={0.7}
                          onPress={() => { haptic.light(); setSelectedPartner(p); }}
                          style={[styles.orbitOrb, {
                            left: ringSize / 2 + p._posX - ORB_SIZE / 2,
                            top: ringSize / 2 + p._posY - ORB_SIZE / 2,
                          }]}
                        >
                          <Animated.View style={{ alignItems: 'center', transform: [{ rotate: orbitCounterRotations[ring.animIdx] }] }}>
                            <LinearGradient colors={roleColor.bg} style={[styles.orbitOrbInner, { width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_SIZE / 2 }]}>
                              <Text style={styles.orbitOrbInitial}>{getInitial(p.name)}</Text>
                              <Text style={styles.orbitOrbGlyph}>{ZODIAC_GLYPHS[pSun?.sign] || ''}</Text>
                            </LinearGradient>
                            {score != null && (
                              <View style={styles.orbitOrbScore}>
                                <Text style={styles.orbitOrbScoreText}>{score}%</Text>
                              </View>
                            )}
                            <Text style={styles.orbitOrbName} numberOfLines={1}>{p.name?.split(' ')[0]}</Text>
                          </Animated.View>
                        </TouchableOpacity>
                      );
                    })}
                  </Animated.View>
                );
              })}

              {/* Static "+" add buttons — one per ring, spread at different angles */}
              {ORBIT_RINGS.map((ring, idx) => {
                const group = CATEGORY_GROUPS.find(g => g.key === ring.key);
                const angles = [Math.PI / 2, Math.PI, -Math.PI / 2, 0];
                const angle = angles[idx % 4];
                const addX = Math.cos(angle) * ring.radius;
                const addY = Math.sin(angle) * ring.radius;
                return (
                  <TouchableOpacity
                    key={ring.key + '_add'}
                    activeOpacity={0.7}
                    onPress={() => {
                      haptic.light();
                      setRelationshipType(group?.roles[0] || 'other');
                      setShowAddModal(true);
                    }}
                    style={[styles.orbitAddBtn, {
                      position: 'absolute',
                      left: orbitCenter + addX - 16,
                      top: orbitCenter + addY - 16,
                      zIndex: 30,
                    }]}
                  >
                    <Text style={{ fontSize: 16, color: T.gold }}>+</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── ORBIT LEGEND ─── */}
          <View style={styles.legendWrap}>
            {legendItems.map(item => (
              <TouchableOpacity key={item.key} style={styles.legendItem} activeOpacity={0.7}
                onPress={() => { haptic.light(); setRelationshipType(item.roles[0]); setShowAddModal(true); }}>
                <View style={[styles.legendDot, { backgroundColor: ORBIT_RINGS.find(r => r.key === item.key)?.borderColor || 'rgba(200,168,75,0.3)' }]} />
                <Text style={styles.legendLabel}>{item.icon} {item.label}</Text>
                <Text style={styles.legendCount}>{item.count}</Text>
                <Text style={styles.legendAdd}>+</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── YOUR CONNECTIONS (scrollable below orbit) ─── */}
          {partnerProfiles.length > 0 && (
            <View style={styles.peopleListSection}>
              <Text style={styles.peopleListLabel}>YOUR CONNECTIONS</Text>
              {partnerProfiles.map(p => {
                const role = p.relationshipType || 'other';
                const roleColor = ROLE_COLORS[role] || ROLE_COLORS.other;
                const score = getQuickScore(userProfile.chart, p);
                const pSun = p.chart?.planets?.find(pl => pl.name === 'Sun');
                const roleInfo = ROLE_LABELS[role];
                return (
                  <TouchableOpacity key={p.id} style={styles.personRow} activeOpacity={0.7}
                    onPress={() => { haptic.light(); setSelectedPartner(p); }}>
                    <LinearGradient colors={roleColor.bg} style={styles.personRowOrb}>
                      <Text style={styles.personRowOrbText}>{getInitial(p.name)}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personRowName}>{p.name}</Text>
                      <Text style={styles.personRowSub}>{roleInfo?.icon} {roleInfo?.label} · {ZODIAC_GLYPHS[pSun?.sign] || '✦'} {pSun?.sign || 'Unknown'}</Text>
                    </View>
                    {score != null && (
                      <View style={styles.personRowScoreBadge}>
                        <Text style={styles.personRowScoreText}>{score}%</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 14, color: T.stone }}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Add person card */}
          <TouchableOpacity style={styles.addCard} activeOpacity={0.7} onPress={() => setShowAddModal(true)}>
            <View style={styles.addCardIcon}><Text style={{ fontSize: 18 }}>+</Text></View>
            <View>
              <Text style={styles.addCardTitle}>Add someone to your circle</Text>
              <Text style={styles.addCardSub}>Birth details or just their zodiac sign</Text>
            </View>
          </TouchableOpacity>

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
              if (aiLoading) return <View key={idx} style={{ alignItems: 'center', paddingVertical: 16 }}><ActivityIndicator size="small" color={T.gold} /><Text style={{ fontSize: 11, color: T.stone, marginTop: 6 }}>Reading your charts...</Text></View>;
              if (!aiAnalysis) return null;
              return (
                <View key={idx} style={styles.ddAiCard}>
                  <Text style={styles.ddSectionLbl}>{lbl.aiAnalysis}</Text>
                  <AstroText style={styles.ddAiText} text={aiAnalysis} />
                  {synastry.discepoloAnalysis?.isDestinySign && <View style={styles.destinyBadge}><Text style={styles.destinyBadgeText}>✦ DESTINY SIGN MATCH</Text></View>}
                </View>
              );

            case 'dimensions':
              return (
                <View key={idx}>
                  <Text style={styles.ddSectionLbl}>{lbl.dimensions}</Text>
                  <View style={styles.ddDimCard}>
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
              if (!cosmicSeason) return null;
              return <View key={idx} style={styles.ddSeasonCard}><Text style={styles.ddSectionLbl}>YOUR RELATIONSHIP SEASON</Text><Text style={styles.ddSeasonText}>{cosmicSeason.planet} in your {cosmicSeason.natalTarget} sign shapes how you connect right now · {cosmicSeason.progress}% through</Text></View>;

            case 'activeWindows':
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
              if (!matchDetails?.areas) return null;
              return (
                <View key={idx}>
                  <Text style={styles.ddSectionLbl}>{lbl.areas}</Text>
                  {Object.entries(matchDetails.areas).map(([key, area], i) => {
                    const dim = roleDims.find(d => d.key === key);
                    return (
                      <View key={i} style={styles.ddAreaCard}>
                        <View style={styles.ddAreaHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>{dim && <Text style={{ fontSize: 14, color: dim.color }}>{dim.icon}</Text>}<Text style={styles.ddAreaName}>{dim?.label || key.charAt(0).toUpperCase() + key.slice(1)}</Text></View>
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
              if (!synastry.links?.length) return null;
              return <View key={idx}><Text style={styles.ddSectionLbl}>{lbl.keyConnections}</Text><View style={styles.ddChipsWrap}>{synastry.links.slice(0, 6).map((link, i) => <View key={i} style={[styles.ddLinkChip, link.isFriction && styles.ddLinkChipHard]}><Text style={[styles.ddLinkText, link.isFriction && styles.ddLinkTextHard]}>{link.label} {link.description}</Text></View>)}</View></View>;

            case 'actionRow':
              return (
                <View key={idx} style={styles.ddActionRow}>
                  <TouchableOpacity style={styles.ddActionBtn} activeOpacity={0.7} onPress={handleShareStory}><Text style={styles.ddActionBtnText}>Share ↗</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.ddActionBtn} activeOpacity={0.7} onPress={async () => {
                    haptic('medium');
                    await createAndShareInvite({ inviterName: userProfile?.name || 'Someone', inviterId: userProfile?.id, partnerName: partnerProfile?.name || 'Partner', score: synastry.harmonyScore, verdict: rc.getScoreLabel(synastry.harmonyScore) });
                    trackEvent('share'); awardXP(userProfile?.id, 'share');
                  }}><Text style={styles.ddActionBtnText}>Invite ✉️</Text></TouchableOpacity>
                </View>
              );

            case 'pdfDownload':
              const theme = reportTheme;
              return (
                <View key={idx}>
                  <TouchableOpacity style={styles.ddDownload} activeOpacity={0.8} onPress={handleDownloadReport} disabled={pdfLoading}>
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
                  <TouchableOpacity onPress={() => handleRemovePartner(partnerProfile)} style={styles.ddDeleteBtn} activeOpacity={0.7}>
                    <Text style={styles.ddDeleteBtnText}>Remove {p2Name} from Circle</Text>
                  </TouchableOpacity>
                </View>
              );

            // ── ROLE-SPECIFIC UNIQUE SECTIONS ──

            case 'loveLanguages':
              if (!matchDetails?.loveLanguages) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>LOVE LANGUAGES</Text>
                  <View style={styles.uniqueTwoCol}>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>♀</Text><Text style={styles.uniqueColLabel}>{p1Name}</Text><Text style={styles.uniqueColText}>{matchDetails.loveLanguages.user}</Text></View>
                    <View style={styles.uniqueColCard}><Text style={styles.uniqueColIcon}>♀</Text><Text style={styles.uniqueColLabel}>{p2Name}</Text><Text style={styles.uniqueColText}>{matchDetails.loveLanguages.partner}</Text></View>
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
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>♄</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THE PATTERN</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.pattern}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>◎</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>ORIGIN</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.origin}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>HEALING</Text><Text style={styles.uniqueRowText}>{matchDetails.generationalPattern.healing}</Text></View></View>
                </View>
              );

            case 'communicationGuide':
              if (!matchDetails?.communicationGuide) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>COMMUNICATION GUIDE</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☿</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationGuide.theirStyle}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☿</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>YOUR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationGuide.yourStyle}</Text></View></View>
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
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☿</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR STYLE</Text><Text style={styles.uniqueRowText}>{matchDetails.communicationPlaybook.theirStyle}</Text></View></View>
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
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☽</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>THEIR NEEDS</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.theirNeeds}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: '#4A8060' }]}>✦</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: '#4A8060' }]}>YOUR STRENGTH</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.yourStrength}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={[styles.uniqueRowIcon, { color: T.gold }]}>→</Text><View style={{ flex: 1 }}><Text style={[styles.uniqueRowLabel, { color: T.gold }]}>GROWTH EDGE</Text><Text style={styles.uniqueRowText}>{matchDetails.parentingGuide.growthEdge}</Text></View></View>
                </View>
              );

            case 'childNature':
              if (!matchDetails?.childNature) return null;
              return (
                <View key={idx} style={styles.uniqueCard}>
                  <Text style={styles.ddSectionLbl}>THEIR NATURE</Text>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☉</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>TEMPERAMENT</Text><Text style={styles.uniqueRowText}>{matchDetails.childNature.coreTemperament}</Text></View></View>
                  <View style={styles.uniqueRow}><Text style={styles.uniqueRowIcon}>☽</Text><View style={{ flex: 1 }}><Text style={styles.uniqueRowLabel}>EMOTIONAL NEED</Text><Text style={styles.uniqueRowText}>{matchDetails.childNature.emotionalNeed}</Text></View></View>
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
                <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.ddBack}>
                  <Text style={{ fontSize: 16, color: 'rgba(250,248,242,0.7)' }}>‹</Text>
                </TouchableOpacity>
                <View style={styles.ddPair}>
                  <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(userProfile.name)}</Text></LinearGradient>
                  <View style={styles.ddConnector}><View style={styles.ddLine} /><View style={styles.ddHeart}><Text style={{ fontSize: 14 }}>{ROLE_LABELS[partnerRole]?.icon || '♡'}</Text></View><View style={styles.ddLine} /></View>
                  <LinearGradient colors={(ROLE_COLORS[partnerRole] || ROLE_COLORS.other).bg} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(partnerProfile?.name)}</Text></LinearGradient>
                </View>
                <Text style={styles.ddTitle}>{p1Name} & {p2Name}</Text>
                <Text style={styles.ddSub}>{ROLE_LABELS[partnerRole]?.label} · {ZODIAC_GLYPHS[partnerSun?.sign] || '✦'} {partnerSun?.sign || '—'}</Text>
                <View style={styles.ddScoreWrap}>
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
              </LinearGradient>

              <View style={styles.ddBody}>
                {rc.sectionOrder.map((sKey, idx) => renderSection(sKey, idx))}
                <View style={{ height: 40 }} />
              </View>
            </ScrollView>
          </View>
        );
      })()}
      )}

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
            <TouchableOpacity onPress={() => setShowStoryModal(false)}><Text style={styles.storyCloseText}>✕</Text></TouchableOpacity>
            <Text style={styles.storyModalTitle}>Share Your Match</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.storyPreview}>
            <View style={styles.storyCardWrap}>
              <MatchStoryCard user={{ name: userProfile?.name?.split(' ')[0], sign: userSun?.sign }}
                partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign }}
                score={synastry?.harmonyScore || 0} verdict={getScoreLabel(synastry?.harmonyScore || 0)}
                insights={viralInsights} themeIndex={storyTheme} />
              {viralLoading && <View style={styles.storyLoadingOverlay}><ActivityIndicator size="small" color="white" /><Text style={styles.storyLoadingText}>Reading charts...</Text></View>}
            </View>
          </View>
          <View style={styles.storyThemeSection}>
            <Text style={styles.storyThemeLabel}>STYLE</Text>
            <View style={styles.storyThemeRow}>
              {STORY_THEMES.map((theme, i) => (
                <TouchableOpacity key={i} onPress={() => setStoryTheme(i)} style={[styles.storyThemeOption, storyTheme === i && styles.storyThemeOptionOn]}>
                  <View style={[styles.storyThemeSwatch, { backgroundColor: theme.dot }]} />
                  <Text style={[styles.storyThemeName, storyTheme === i && { color: 'white' }]}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.storyShareBtn} activeOpacity={0.8} onPress={handleShareStoryCapture} disabled={viralLoading}>
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
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Person</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>THEIR NAME</Text>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={T.stone} value={partnerName} onChangeText={setPartnerName} />

            <Text style={styles.fieldLabel}>RELATIONSHIP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {RELATIONSHIP_TYPES.map((rt) => (
                <TouchableOpacity key={rt.key} style={[styles.relTypePill, relationshipType === rt.key && styles.relTypePillActive]} onPress={() => setRelationshipType(rt.key)}>
                  <Text style={[styles.relTypePillText, relationshipType === rt.key && styles.relTypePillTextActive]}>{rt.icon} {rt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.zodiacToggle} onPress={() => setZodiacOnlyMode(!zodiacOnlyMode)}>
              <View style={[styles.check, zodiacOnlyMode && styles.checkOn]}>{zodiacOnlyMode && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkLabel}>I only know their zodiac sign</Text>
                <Text style={{ fontSize: 11, color: T.stone, marginTop: 2 }}>Sun sign compatibility (simplified)</Text>
              </View>
            </TouchableOpacity>

            {zodiacOnlyMode && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>THEIR ZODIAC SIGN</Text>
                <View style={styles.zodiacGrid}>
                  {(ZODIAC_SIGNS || ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']).map((sign) => (
                    <TouchableOpacity key={sign} style={[styles.zodiacChip, selectedZodiacSign === sign && styles.zodiacChipActive]} onPress={() => setSelectedZodiacSign(sign)}>
                      <Text style={[styles.zodiacChipText, selectedZodiacSign === sign && styles.zodiacChipTextActive]}>{sign}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!zodiacOnlyMode && (
              <>
                <Text style={styles.fieldLabel}>BIRTH DATE</Text>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text style={{ color: partnerDate ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{partnerDate ? partnerDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select date'}</Text>
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={partnerDate || new Date(2000, 0, 1)} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={new Date()} onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setPartnerDate(d); }} />}

                <Text style={styles.fieldLabel}>BIRTH TIME</Text>
                <TouchableOpacity style={[styles.input, isTimeUnknown && { opacity: 0.4 }]} onPress={() => !isTimeUnknown && setShowTimePicker(true)}>
                  <Text style={{ color: (isTimeUnknown || partnerTime) ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>{isTimeUnknown ? 'Unknown' : (partnerTime ? partnerTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Select time')}</Text>
                </TouchableOpacity>
                {showTimePicker && <DateTimePicker value={partnerTime || new Date(2000, 0, 1, 12, 0)} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setPartnerTime(t); }} />}
                <TouchableOpacity style={styles.checkRow} onPress={() => setIsTimeUnknown(!isTimeUnknown)}>
                  <View style={[styles.check, isTimeUnknown && styles.checkOn]}>{isTimeUnknown && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}</View>
                  <Text style={styles.checkLabel}>I don't know the exact birth time</Text>
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>BIRTH CITY</Text>
                <TextInput style={styles.input} placeholder="Search city..." placeholderTextColor={T.stone} value={selectedCity ? selectedCity.name : citySearch} onChangeText={(t) => { setSelectedCity(null); setCitySearch(t); }} />
                {citySearching && <View style={[styles.suggestions, { padding: 12, alignItems: 'center' }]}><ActivityIndicator size="small" color={T.gold} /></View>}
                {!citySearching && citySuggestions.length > 0 && (
                  <View style={styles.suggestions}>
                    {citySuggestions.map((c, i) => (
                      <TouchableOpacity key={i} style={styles.suggestion} onPress={() => { setSelectedCity(c); setCitySearch(c.name); setCitySuggestions([]); }}>
                        <Text style={{ color: T.navy, fontSize: 14 }} numberOfLines={2}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {zodiacOnlyMode && <View style={styles.zodiacOnlyBadge}><Text style={styles.zodiacOnlyBadgeText}>☉ Sun Sign Analysis — simplified compatibility</Text></View>}

            <TouchableOpacity style={[styles.saveBtn, (!partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !selectedCity)) && { opacity: 0.5 }]}
              onPress={handleSavePartner} disabled={savingPartner || !partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !selectedCity)}>
              {savingPartner ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Calculate Compatibility</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
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
  const ZR = '♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓';
  const theme = getReportTheme(role);
  const cfg = { partner: { scoreLabels: ['Emotional', 'Attraction', 'Communication', 'Stability'], scoreKeys: ['emotional', 'attraction', 'communication', 'stability'], icon: '♡', connectionSub: 'What draws you together', emotionalSub: 'How you connect emotionally', uniqueIcon: '♀', adviceLabel: 'RELATIONSHIP ADVICE' }, friend: { scoreLabels: ['Trust', 'Fun & Energy', 'Communication', 'Growth'], scoreKeys: ['trust', 'fun', 'communication', 'growth'], icon: '★', connectionSub: 'Why this friendship matters', emotionalSub: 'Your friendship energy', uniqueIcon: '♃', adviceLabel: 'FRIENDSHIP ADVICE' }, parent: { scoreLabels: ['Understanding', 'Support', 'Communication', 'Boundaries'], scoreKeys: ['understanding', 'support', 'communication', 'boundaries'], icon: '◎', connectionSub: 'The ancestral bond', emotionalSub: 'Emotional inheritance', uniqueIcon: '♄', adviceLabel: 'RELATIONSHIP ADVICE' }, sibling: { scoreLabels: ['Bond', 'Communication', 'Shared Growth', 'Support'], scoreKeys: ['bond', 'communication', 'sharedGrowth', 'support'], icon: '◇', connectionSub: 'Your shared origin', emotionalSub: 'How you relate', uniqueIcon: '♂', adviceLabel: 'SIBLING ADVICE' }, boss: { scoreLabels: ['Respect', 'Work Sync', 'Communication', 'Growth'], scoreKeys: ['respect', 'workSync', 'communication', 'growth'], icon: '◆', connectionSub: 'Professional alignment', emotionalSub: 'Work styles', uniqueIcon: '♄', adviceLabel: 'CAREER STRATEGIES' }, colleague: { scoreLabels: ['Work Sync', 'Communication', 'Innovation', 'Trust'], scoreKeys: ['workSync', 'communication', 'innovation', 'trust'], icon: '✧', connectionSub: 'Why you collaborate', emotionalSub: 'Work energies', uniqueIcon: '♅', adviceLabel: 'COLLABORATION TIPS' }, child: { scoreLabels: ['Nurturing', 'Communication', 'Understanding', 'Guidance'], scoreKeys: ['nurturing', 'communication', 'understanding', 'guidance'], icon: '☽', connectionSub: 'The soul contract', emotionalSub: 'Your nurturing bond', uniqueIcon: '☉', adviceLabel: 'PARENTING WISDOM' }, other: { scoreLabels: ['Emotional', 'Communication', 'Connection', 'Stability'], scoreKeys: ['emotional', 'communication', 'attraction', 'stability'], icon: '✦', connectionSub: 'What connects you', emotionalSub: 'How you relate', uniqueIcon: '✦', adviceLabel: 'ADVICE' } }[role] || { scoreLabels: ['Emotional', 'Communication', 'Connection', 'Stability'], scoreKeys: ['emotional', 'communication', 'attraction', 'stability'], icon: '✦', connectionSub: 'What connects you', emotionalSub: 'How you relate', uniqueIcon: '✦', adviceLabel: 'ADVICE' };
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
<div class="cover"><div class="cover-border"></div><div class="cover-inner"><div class="cover-brand">CELESTIA</div><div class="cover-rule"></div><div class="cover-badge">${esc(theme.coverBadge)}</div><div class="cover-zodiac">${ZR}</div><div class="cover-names">${esc(p1Name)} <span class="cover-amp">&</span> ${esc(p2Name)}</div><div class="cover-signs">${p1Sun?.sign||'—'} ${cfg.icon} ${p2Sun?.sign||'—'}</div><div class="cover-divider"><div class="cover-line"></div><div class="cover-star">${cfg.icon}</div><div class="cover-line"></div></div><div class="cover-headline">"${esc(report.headline||'')}"</div><div class="cover-score">${score}%</div><div class="cover-score-label">COMPATIBILITY SCORE</div><div class="cover-pills"><div class="cover-pill"><div class="cover-pill-sign">${esc(p1Name)}</div><div class="cover-pill-role">☉ ${p1Sun?.sign||'—'} · ☽ ${p1Moon?.sign||'—'}</div></div><div class="cover-pill"><div class="cover-pill-sign">${esc(p2Name)}</div><div class="cover-pill-role">☉ ${p2Sun?.sign||'—'} · ☽ ${p2Moon?.sign||'—'}</div></div></div></div><div class="cover-foot"><div class="cover-foot-text">YOUR STARS, YOUR STORY</div><div class="cover-foot-date">${esc(genDate)}</div></div></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · OVERVIEW</span></div><div class="pc"><div class="sl">${esc(theme.title.toUpperCase())} OVERVIEW</div><div class="sr"></div><p class="body" style="font-style:italic;color:#C49A2A;font-size:12px;margin-bottom:16px">"${esc(report.tagline||'')}"</p>${nl2p(report.overview)}<div class="ornament">· · ·</div><div class="sl">SCORE BREAKDOWN</div><div class="sr"></div>${scoreBars.map(b=>`<div class="sbar-row"><div class="sbar-top"><span class="sbar-name">${b.label}</span><span class="sbar-pct">${b.pct}%</span></div><div class="sbar-track"><div class="sbar-fill" style="width:${b.pct}%;background:${b.color}"></div></div></div>`).join('')}</div><div class="pf">Celestia · ${esc(theme.title)} · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DEEP DIVE</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px"><span class="section-icon">${cfg.icon}</span><div><div class="section-title">${esc(report.soulConnection?.title||'Soul Connection')}</div><div class="section-sub">${cfg.connectionSub}</div></div></div><div class="section-content">${nl2p(report.soulConnection?.description)}</div><div class="ornament">· · ·</div><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228"><span class="section-icon">☽</span><div><div class="section-title">${esc(report.emotionalDynamic?.title||'Emotional Dynamic')}</div><div class="section-sub">${cfg.emotionalSub}</div></div></div><div class="section-content"><div class="callout pink-callout"><div class="callout-icon">☽</div><div><div class="callout-label pink-label">${esc(report.emotionalDynamic?.section1Label||p1Name.toUpperCase())}</div><p class="callout-text">${esc(report.emotionalDynamic?.section1||report.emotionalDynamic?.howYouLove||'')}</p></div></div><div class="callout blue-callout"><div class="callout-icon">☽</div><div><div class="callout-label blue-label">${esc(report.emotionalDynamic?.section2Label||p2Name.toUpperCase())}</div><p class="callout-text">${esc(report.emotionalDynamic?.section2||report.emotionalDynamic?.howTheyLove||'')}</p></div></div><div class="callout gold-callout"><div class="callout-icon">${cfg.icon}</div><div><div class="callout-label gold-label">TOGETHER</div><p class="callout-text">${esc(report.emotionalDynamic?.together)}</p></div></div></div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DYNAMICS</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#0D2535"><span class="section-icon">☿</span><div><div class="section-title">${esc(report.communicationStyle?.title||'Communication')}</div><div class="section-sub">How you connect mentally</div></div></div><div class="section-content">${nl2p(report.communicationStyle?.dynamic)}<div class="callout gold-callout"><div class="callout-icon">✦</div><div><div class="callout-label gold-label">PRO TIP</div><p class="callout-text">${esc(report.communicationStyle?.tip)}</p></div></div></div><div class="ornament">· · ·</div><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#2A1008"><span class="section-icon">${cfg.uniqueIcon}</span><div><div class="section-title">${esc(report.uniqueSection?.title||report.attraction?.title||'Connection')}</div><div class="section-sub">The dynamic between you</div></div></div><div class="section-content"><div class="callout red-callout"><div class="callout-icon">${cfg.uniqueIcon}</div><div><div class="callout-label red-label">THE SPARK</div><p class="callout-text">${esc(report.uniqueSection?.spark||report.attraction?.spark||'')}</p></div></div><div class="callout gold-callout"><div class="callout-icon">△</div><div><div class="callout-label gold-label">THE TENSION</div><p class="callout-text">${esc(report.uniqueSection?.tension||report.attraction?.tension||'')}</p></div></div></div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · GROWTH</span></div><div class="pc"><div class="sl">GROWTH AREAS</div><div class="sr"></div><div class="growth-row">${(report.growthAreas||[]).map(g=>`<div class="growth-card"><div class="growth-title">${esc(g.title)}</div><div class="growth-text">${esc(g.insight)}</div></div>`).join('')}</div></div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="page-break"></div><div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · FUTURE</span></div><div class="pc"><div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228"><span class="section-icon">♄</span><div><div class="section-title">Long-Term Outlook</div><div class="section-sub">Where this is heading</div></div></div><div class="section-content">${nl2p(report.longTerm?.forecast)}<div class="callout gold-callout"><div class="callout-icon">✦</div><div><div class="callout-label gold-label">THE VERDICT</div><p class="callout-text" style="font-weight:700">${esc(report.longTerm?.verdict)}</p></div></div></div><div class="ornament">· · ·</div><div class="sl">${cfg.adviceLabel}</div><div class="sr"></div>${(report.advice||[]).map((a,i)=>`<div class="advice-item"><span class="advice-num">${i+1}.</span><span class="advice-text">${esc(a)}</span></div>`).join('')}</div><div class="pf">Celestia · ${esc(p1Name)} & ${esc(p2Name)}</div>
<div class="closing"><div class="ph" style="background:rgba(255,255,255,0.04)"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · YOUR JOURNEY</span></div><div class="closing-content"><div style="margin-bottom:32px">${nl2p(report.closingMessage,'closing-body')}</div><div style="color:#C49A2A;text-align:center;letter-spacing:12px;font-size:12px;margin:26px 0;opacity:0.6">· · ·</div><div class="closing-verdict"><div class="closing-verdict-text">${esc(report.cosmicVerdict||'')}</div></div></div><div class="closing-brand"><div class="closing-brand-name">CELESTIA</div><div class="closing-tagline">Your stars, your story</div><div class="closing-disclaimer">Generated using astronomical calculations and AI.<br/>For entertainment and self-reflection. ${esc(genDate)}</div></div></div>
</body></html>`;
};

const styles = StyleSheet.create({
  // Hero (compact)
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  title: { fontFamily: FONTS.serif, fontSize: 26, color: T.cream, marginBottom: 2 },
  sub: { fontSize: 12, fontFamily: FONTS.sans, color: 'rgba(250,248,242,0.45)' },
  heroAddBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', alignItems: 'center', justifyContent: 'center' },

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
  peopleListSection: { paddingHorizontal: 20, marginBottom: 10 },
  peopleListLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  personRowOrb: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  personRowOrbText: { fontFamily: FONTS.serif, fontSize: 15, color: 'white' },
  personRowName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 1 },
  personRowSub: { fontSize: 11, color: T.stone },
  personRowScoreBadge: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)' },
  personRowScoreText: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.gold },

  // Add card
  addCard: { marginHorizontal: 20, marginBottom: 10, backgroundColor: 'white', borderRadius: 17, padding: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D4CFC4', flexDirection: 'row', alignItems: 'center', gap: 13 },
  addCardIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(200,168,75,0.3)', alignItems: 'center', justifyContent: 'center' },
  addCardTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 2 },
  addCardSub: { fontSize: 11.5, color: T.stone },

  // Detail screen
  ddHero: { paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 48) + 12, paddingBottom: 22, paddingHorizontal: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: 'center' },
  ddBack: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 48) + 8, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  ddPair: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  ddOrb: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  ddOrbText: { fontFamily: FONTS.serif, fontSize: 19, color: 'white' },
  ddConnector: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  ddLine: { width: 24, height: 1, backgroundColor: 'rgba(200,168,75,0.3)' },
  ddHeart: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  ddTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.cream, marginBottom: 2, textAlign: 'center' },
  ddSub: { fontSize: 12, color: 'rgba(250,248,242,0.45)', marginBottom: 12 },
  ddScoreWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  ddScoreNum: { position: 'absolute', fontFamily: FONTS.serif, fontSize: 26, color: 'white' },
  ddVerdict: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 13, color: 'rgba(250,248,242,0.55)', fontStyle: 'italic', marginBottom: 12 },
  ddChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  ddChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 10 },
  ddChipLabel: { fontSize: 10, color: 'rgba(250,248,242,0.5)' },
  ddChipVal: { fontSize: 10, fontFamily: FONTS.sansSemiBold },
  ddBody: { padding: 20 },
  ddSectionLbl: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10, marginTop: 4 },
  ddAiCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ddAiText: { fontSize: 13, color: T.ink, lineHeight: 21 },
  destinyBadge: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', marginTop: 6 },
  destinyBadgeText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.gold, letterSpacing: 1.5 },
  ddDimCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', gap: 10 },
  dimRow: { gap: 4 },
  dimTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dimIcon: { fontSize: 12, width: 18 },
  dimLabel: { fontSize: 12, color: T.ink, fontFamily: FONTS.sansMedium, flex: 1 },
  dimPct: { fontSize: 12, color: T.gold, fontFamily: FONTS.sansSemiBold },
  dimTrack: { flex: 1, height: 5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 3 },
  ddSeasonCard: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(200,168,75,0.12)' },
  ddSeasonText: { fontSize: 12, color: T.ink, fontFamily: FONTS.sans, lineHeight: 18 },
  ddActiveCard: { backgroundColor: T.warm, borderRadius: 14, padding: 16, marginBottom: 14 },
  ddAreaCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  ddAreaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ddAreaName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy },
  ddAreaScore: { fontSize: 14, fontFamily: FONTS.serif, color: T.gold },
  ddAreaStrength: { fontSize: 12.5, color: '#4A8060', lineHeight: 19, marginBottom: 4 },
  ddAreaTension: { fontSize: 12.5, color: '#A06050', lineHeight: 19, marginBottom: 4 },
  ddAreaAnalysis: { fontSize: 12.5, color: T.ink, lineHeight: 19, marginBottom: 4 },
  ddAreaReflection: { fontSize: 12, color: T.stone, fontStyle: 'italic', marginTop: 4 },
  ddChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  ddValueChip: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)' },
  ddValueText: { fontSize: 11, color: T.gold, fontFamily: FONTS.sansMedium },
  ddLinkChip: { backgroundColor: 'rgba(126,200,160,0.12)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(126,200,160,0.3)' },
  ddLinkChipHard: { backgroundColor: 'rgba(232,120,120,0.1)', borderColor: 'rgba(232,120,120,0.3)' },
  ddLinkText: { fontSize: 11, color: '#7EC8A0', fontFamily: FONTS.sansMedium },
  ddLinkTextHard: { color: '#E87878' },
  ddActionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  ddActionBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(200,168,75,0.3)', paddingVertical: 12, alignItems: 'center' },
  ddActionBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  ddDownload: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#2D0A1E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 20 },
  ddDownloadGrad: { padding: 20, position: 'relative', overflow: 'hidden' },
  ddDownloadGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(232,80,144,0.1)', right: -40, top: -40 },
  ddDownloadTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.cream, marginBottom: 6 },
  ddDownloadSub: { fontSize: 12, color: 'rgba(250,248,242,0.5)', lineHeight: 18, marginBottom: 14 },
  ddDownloadCta: { backgroundColor: 'rgba(232,80,144,0.2)', borderWidth: 1, borderColor: 'rgba(232,80,144,0.35)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: T.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  modalClose: { fontSize: 18, color: T.stone, padding: 4 },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, color: T.navy, borderWidth: 1, borderColor: '#EDE6D8', fontFamily: FONTS.sansLight },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4CFC4', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: T.navy, borderColor: T.navy },
  checkLabel: { fontSize: 13, color: T.stone },
  suggestions: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#EDE6D8', marginTop: 4, overflow: 'hidden' },
  suggestion: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#F5EEE4' },
  saveBtn: { backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  saveBtnText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream },
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
});
