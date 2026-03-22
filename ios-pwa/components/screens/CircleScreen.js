'use client';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';
import { calculateSynastryScore, calculateZodiacOnlyScore, ROLE_DIMENSIONS, ROLE_COLORS } from '@/lib/astrology/SynastryService';
import { ZODIAC_SIGNS, ZODIAC_SYMBOLS, T } from '@/lib/constants';
import { calculateChart, getActiveCosmicWindows, getCosmicSeason } from '@/lib/astrologyService';
import { getNarrativeContext } from '@/lib/narrativeService';
import { generateMatchCore, generateMatchDetails, generateMatchViralInsights } from '@/lib/geminiService';

const SCREEN_W = typeof window !== 'undefined' ? Math.min(window.innerWidth, 430) : 393;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const ZODIAC_GLYPHS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264a', Cancer: '\u264b',
  Leo: '\u264c', Virgo: '\u264d', Libra: '\u264e', Scorpio: '\u264f',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

const CELEBRITY_DATA = [
  { name: 'Timothee Chalamet', sign: 'Capricorn', birthday: '1995-12-27', icon: '\ud83c\udfac' },
  { name: 'Harry Styles', sign: 'Aquarius', birthday: '1994-02-01', icon: '\ud83c\udfb5' },
  { name: 'Zendaya', sign: 'Virgo', birthday: '1996-09-01', icon: '\ud83c\udf1f' },
  { name: 'Taylor Swift', sign: 'Sagittarius', birthday: '1989-12-13', icon: '\ud83c\udfa4' },
  { name: 'Bad Bunny', sign: 'Pisces', birthday: '1994-03-10', icon: '\ud83d\udc30' },
  { name: 'Pedro Pascal', sign: 'Aries', birthday: '1975-04-02', icon: '\ud83d\udd25' },
  { name: 'Sydney Sweeney', sign: 'Virgo', birthday: '1997-09-12', icon: '\u2728' },
  { name: 'Jacob Elordi', sign: 'Cancer', birthday: '1997-06-26', icon: '\ud83c\udfad' },
  { name: 'Sabrina Carpenter', sign: 'Taurus', birthday: '1999-05-11', icon: '\ud83c\udfb6' },
  { name: 'Doja Cat', sign: 'Libra', birthday: '1995-10-21', icon: '\ud83d\udc31' },
  { name: 'Tom Holland', sign: 'Gemini', birthday: '1996-06-01', icon: '\ud83d\udd77' },
  { name: 'Billie Eilish', sign: 'Sagittarius', birthday: '2001-12-18', icon: '\ud83d\udc9a' },
];

const RELATIONSHIP_TYPES = [
  { key: 'partner', label: 'Partner', icon: '\u2661' },
  { key: 'ex', label: 'Ex', icon: '\ud83d\udc94' },
  { key: 'friend', label: 'Best Friend', icon: '\u2605' },
  { key: 'parent', label: 'Parent', icon: '\u25ce' },
  { key: 'sibling', label: 'Sibling', icon: '\u25c7' },
  { key: 'boss', label: 'Boss', icon: '\u25c6' },
  { key: 'colleague', label: 'Colleague', icon: '\u2727' },
  { key: 'child', label: 'Child', icon: '\u263d' },
  { key: 'other', label: 'Other', icon: '\u2726' },
];

const ROLE_LABELS = {};
RELATIONSHIP_TYPES.forEach(r => { ROLE_LABELS[r.key] = r; });

const CATEGORY_GROUPS = [
  { key: 'love', label: 'LOVE', roles: ['partner', 'ex'], gradient: ['#2D0A1E', '#1A0828'], icon: '\u2661' },
  { key: 'family', label: 'FAMILY', roles: ['parent', 'sibling', 'child'], gradient: ['#1A1A08', '#14120A'], icon: '\u25ce' },
  { key: 'friends', label: 'FRIENDS', roles: ['friend'], gradient: ['#0E0A28', '#14101E'], icon: '\u2605' },
  { key: 'work', label: 'WORK', roles: ['boss', 'colleague'], gradient: ['#081A28', '#0A1420'], icon: '\u25c6' },
  { key: 'other', label: 'OTHER', roles: ['other'], gradient: ['#141210', '#0E0E0E'], icon: '\u2726' },
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

const getQuickScore = (chart, partner) => {
  try {
    if (partner.isZodiacOnly) {
      const uSun = chart?.planets?.find(p => p.name === 'Sun')?.sign;
      return calculateZodiacOnlyScore(uSun, partner.zodiacSign).harmonyScore;
    }
    if (partner.chart) {
      return calculateSynastryScore(chart, partner.chart, partner.relationshipType || 'partner').harmonyScore;
    }
  } catch (e) { }
  return null;
};

// ── Role detail config (inlined) ──
const getPartnerScoreLabel = (s) => { if (s >= 90) return 'Written in the stars'; if (s >= 80) return 'Deeply harmonious'; if (s >= 70) return 'Strong connection'; if (s >= 60) return 'Compatible souls'; if (s >= 50) return 'Growing together'; return 'Complex dynamic'; };
const getFriendScoreLabel = (s) => { if (s >= 90) return 'Cosmic best friends'; if (s >= 80) return 'Soul-level bond'; if (s >= 70) return 'Solid crew'; if (s >= 60) return 'Good vibes'; if (s >= 50) return 'Growing bond'; return 'Learning curve'; };
const getParentScoreLabel = (s) => { if (s >= 90) return 'Deep roots'; if (s >= 80) return 'Strong foundation'; if (s >= 70) return 'Growing closer'; if (s >= 60) return 'Building bridges'; if (s >= 50) return 'Working through it'; return 'Learning each other'; };
const getSiblingScoreLabel = (s) => { if (s >= 90) return 'Cosmic twins'; if (s >= 80) return 'Built-in allies'; if (s >= 70) return 'Balanced bond'; if (s >= 60) return 'Complementary forces'; if (s >= 50) return 'Finding your rhythm'; return 'Different planets'; };
const getBossScoreLabel = (s) => { if (s >= 90) return 'Career catalyst'; if (s >= 80) return 'Strong alignment'; if (s >= 70) return 'Solid dynamic'; if (s >= 60) return 'Workable flow'; if (s >= 50) return 'Room to navigate'; return 'Strategic approach needed'; };
const getColleagueScoreLabel = (s) => { if (s >= 90) return 'Dream team'; if (s >= 80) return 'Strong synergy'; if (s >= 70) return 'Good collaboration'; if (s >= 60) return 'Productive dynamic'; if (s >= 50) return 'Finding flow'; return 'Different approaches'; };
const getChildScoreLabel = (s) => { if (s >= 90) return 'Heart connection'; if (s >= 80) return 'Beautiful bond'; if (s >= 70) return 'Growing together'; if (s >= 60) return 'Learning their language'; if (s >= 50) return 'Building understanding'; return 'Different frequencies'; };

const ROLE_DETAIL_CONFIG = {
  partner: { heroGradient: ['#0E0E22', '#1E1228', '#14101E'], getScoreLabel: getPartnerScoreLabel, sectionOrder: ['aiAnalysis','dimensions','loveLanguages','relationshipSeason','activeWindows','areas','conflictStyle','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'YOUR LOVE STORY', dimensions: 'CHEMISTRY BREAKDOWN', areas: 'RELATIONSHIP DYNAMICS', sharedValues: 'SHARED VALUES', keyConnections: 'PLANETARY BONDS' } },
  ex: { heroGradient: ['#0E0E22', '#1E1228', '#14101E'], getScoreLabel: getPartnerScoreLabel, sectionOrder: ['aiAnalysis','dimensions','loveLanguages','areas','conflictStyle','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'YOUR LOVE STORY', dimensions: 'CHEMISTRY BREAKDOWN', areas: 'RELATIONSHIP DYNAMICS', sharedValues: 'SHARED VALUES', keyConnections: 'PLANETARY BONDS' } },
  friend: { heroGradient: ['#0E0E22', '#160E28', '#0E1628'], getScoreLabel: getFriendScoreLabel, sectionOrder: ['aiAnalysis','dimensions','friendshipDynamic','relationshipSeason','activeWindows','areas','adventureCompat','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'YOUR FRIENDSHIP VIBE', dimensions: 'FRIENDSHIP BLUEPRINT', areas: 'HOW YOU CONNECT', sharedValues: 'WHAT BONDS YOU', keyConnections: 'KEY CONNECTIONS' } },
  parent: { heroGradient: ['#0E0E22', '#1A1510', '#14101E'], getScoreLabel: getParentScoreLabel, sectionOrder: ['aiAnalysis','dimensions','generationalPattern','communicationGuide','areas','healingPath','keyConnections','actionRow'], labels: { aiAnalysis: 'UNDERSTANDING YOUR BOND', dimensions: 'CONNECTION BLUEPRINT', areas: 'RELATIONSHIP DYNAMICS', sharedValues: 'COMMON GROUND', keyConnections: 'PLANETARY LINKS' } },
  sibling: { heroGradient: ['#0E0E22', '#1A1208', '#14101E'], getScoreLabel: getSiblingScoreLabel, sectionOrder: ['aiAnalysis','dimensions','siblingDynamic','areas','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'YOUR SIBLING STORY', dimensions: 'SIBLING BLUEPRINT', areas: 'HOW YOU RELATE', sharedValues: 'COMMON GROUND', keyConnections: 'PLANETARY LINKS' } },
  boss: { heroGradient: ['#0E0E22', '#0A1520', '#0E1628'], getScoreLabel: getBossScoreLabel, sectionOrder: ['aiAnalysis','dimensions','communicationPlaybook','areas','careerStrategy','keyConnections','actionRow'], labels: { aiAnalysis: 'WORKING DYNAMIC', dimensions: 'PROFESSIONAL ALIGNMENT', areas: 'WORK COMPATIBILITY', sharedValues: 'SHARED WORK VALUES', keyConnections: 'PROFESSIONAL LINKS' } },
  colleague: { heroGradient: ['#0E0E22', '#0A1520', '#0E1628'], getScoreLabel: getColleagueScoreLabel, sectionOrder: ['aiAnalysis','dimensions','teamworkProfile','areas','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'COLLABORATION PROFILE', dimensions: 'TEAMWORK BLUEPRINT', areas: 'WORK SYNERGY', sharedValues: 'SHARED WORK VALUES', keyConnections: 'PROFESSIONAL LINKS' } },
  child: { heroGradient: ['#0E0E22', '#0E1A14', '#14101E'], getScoreLabel: getChildScoreLabel, sectionOrder: ['aiAnalysis','dimensions','parentingGuide','childNature','areas','keyConnections','actionRow'], labels: { aiAnalysis: 'YOUR PARENTING BOND', dimensions: 'NURTURING BLUEPRINT', areas: 'CONNECTION AREAS', sharedValues: 'SHARED VALUES', keyConnections: 'PLANETARY LINKS' } },
  other: { heroGradient: ['#0E0E22', '#1A1228', '#14101E'], getScoreLabel: getPartnerScoreLabel, sectionOrder: ['aiAnalysis','dimensions','areas','sharedValues','keyConnections','actionRow'], labels: { aiAnalysis: 'AI ANALYSIS', dimensions: 'COMPATIBILITY DIMENSIONS', areas: 'RELATIONSHIP AREAS', sharedValues: 'SHARED VALUES', keyConnections: 'KEY CONNECTIONS' } },
};

// ── Orbit ring config ──
const ORBIT_MAX = Math.min(SCREEN_W - 16, 380);
const orbitCenter = ORBIT_MAX / 2;
const maxRadius = orbitCenter - 20 - 8;
const CENTER_SIZE = 56;
const ORB_SIZE = 40;
const ORBIT_RINGS = [
  { key: 'love', radius: maxRadius * 0.30, color: 'rgba(232,80,144,0.06)', borderColor: 'rgba(232,80,144,0.22)', animIdx: 0 },
  { key: 'family', radius: maxRadius * 0.52, color: 'rgba(200,168,75,0.04)', borderColor: 'rgba(200,168,75,0.18)', animIdx: 1 },
  { key: 'friends', radius: maxRadius * 0.74, color: 'rgba(100,140,220,0.04)', borderColor: 'rgba(100,140,220,0.16)', animIdx: 2 },
  { key: 'work', radius: maxRadius * 0.96, color: 'rgba(80,180,140,0.03)', borderColor: 'rgba(80,180,140,0.14)', animIdx: 3 },
];

export default function CircleScreen() {
  const { profile, chart, partners, addPartner, removePartner } = useUserProfile();
  const isPro = false;

  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [viralInsights, setViralInsights] = useState(null);
  const [viralLoading, setViralLoading] = useState(false);

  // Deepen reading modal state
  const [showDeepenModal, setShowDeepenModal] = useState(false);
  const [deepenPartner, setDeepenPartner] = useState(null);
  const [deepenMode, setDeepenMode] = useState('full');
  const [deepenDate, setDeepenDate] = useState('');
  const [deepenTime, setDeepenTime] = useState('');
  const [deepenTimeUnknown, setDeepenTimeUnknown] = useState(false);
  const [deepenCitySearch, setDeepenCitySearch] = useState('');
  const [deepenSelectedCity, setDeepenSelectedCity] = useState(null);
  const [deepenCitySuggestions, setDeepenCitySuggestions] = useState([]);
  const [deepenCitySearching, setDeepenCitySearching] = useState(false);
  const [deepenSaving, setDeepenSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  // Add partner form
  const [partnerName, setPartnerName] = useState('');
  const [partnerDate, setPartnerDate] = useState('');
  const [partnerTime, setPartnerTime] = useState('');
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
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

  // Orbit rotation via CSS
  const [orbitAngles, setOrbitAngles] = useState([0, 0, 0, 0]);
  const animRef = useRef(null);

  useEffect(() => {
    if (selectedPartner) return;
    const speeds = [0.008, -0.006, 0.005, -0.004]; // deg per ms frame
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setOrbitAngles(prev => prev.map((a, i) => a + speeds[i] * dt));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [selectedPartner]);

  // City search
  useEffect(() => {
    if (selectedCity || citySearch.length < 2) { setCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      setCitySearching(true);
      try {
        const res = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(citySearch)}&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'CelestiaPWA/1.0' } });
        const data = await res.json();
        setCitySuggestions(data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })));
      } catch (e) { console.warn('City search error:', e); }
      finally { setCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  // Deepen city search
  useEffect(() => {
    if (deepenSelectedCity || deepenCitySearch.length < 2) { setDeepenCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      setDeepenCitySearching(true);
      try {
        const res = await fetch(`${NOMINATIM_URL}?format=json&q=${encodeURIComponent(deepenCitySearch)}&limit=5&addressdetails=1`, { headers: { 'User-Agent': 'CelestiaPWA/1.0' } });
        const data = await res.json();
        setDeepenCitySuggestions(data.map(item => ({ name: item.display_name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })));
      } catch (e) { console.warn('Deepen city search error:', e); }
      finally { setDeepenCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [deepenCitySearch, deepenSelectedCity]);

  const partnerProfile = selectedPartner;
  const partnerRole = partnerProfile?.relationshipType || 'partner';
  const partnerProfiles = partners || [];

  const userProfile = useMemo(() => {
    if (!profile) return null;
    return { ...profile, chart };
  }, [profile, chart]);

  const synastry = useMemo(() => {
    if (!chart || !partnerProfile) return null;
    if (partnerProfile.isZodiacOnly) {
      const userSun = chart.planets?.find(p => p.name === 'Sun')?.sign;
      return calculateZodiacOnlyScore(userSun, partnerProfile.zodiacSign);
    }
    if (!partnerProfile.chart) return null;
    try { return calculateSynastryScore(chart, partnerProfile.chart, partnerRole); }
    catch (e) { console.error('Synastry error:', e); return null; }
  }, [chart, partnerProfile?.chart, partnerProfile?.id, partnerRole]);

  const roleDims = useMemo(() => {
    const roleDef = ROLE_DIMENSIONS[partnerRole] || ROLE_DIMENSIONS.partner;
    if (!roleDef) return [];
    return (roleDef.dims || []).map(d => ({ ...d, pct: synastry?.scores?.[d.key] || 0 }));
  }, [partnerRole, synastry]);

  useEffect(() => {
    if (!synastry || !chart || !partnerProfile) return;
    loadAiAnalysis();
    setViralInsights(null);
    setMatchDetails(null);
  }, [synastry?.harmonyScore, partnerProfile?.id]);

  const loadAiAnalysis = async () => {
    setAiLoading(true);
    let transitContext = null;
    try {
      const userWindows = getActiveCosmicWindows(chart, new Date());
      const relevant = userWindows.filter(w => ['Venus', 'Moon', 'Mars'].includes(w.planet) || ['Venus', 'Moon', 'Mars'].includes(w.natalPlanet));
      setActiveRelationshipWindows(relevant);
      if (relevant.length > 0) transitContext = relevant.map(w => `${w.description} (${w.significance || 'active'})`).join('; ');
    } catch (e) { }
    try { setCosmicSeason(getCosmicSeason(chart, new Date())); } catch (e) { }
    try {
      const report = await generateMatchCore(userProfile, partnerProfile, synastry, transitContext, partnerRole);
      if (report?.snapshot) setAiAnalysis(report.snapshot);
    } catch (e) { console.warn('AI analysis failed:', e); }
    finally { setAiLoading(false); }
    setDetailsLoading(true);
    try { const details = await generateMatchDetails(userProfile, partnerProfile, transitContext, partnerRole); setMatchDetails(details); }
    catch (e) { console.warn('Match details failed:', e); }
    finally { setDetailsLoading(false); }
  };

  const handleSavePartner = async () => {
    if (!partnerName.trim()) { window.alert('Please enter a name.'); return; }
    if (zodiacOnlyMode) {
      if (!selectedZodiacSign) { window.alert('Please select their zodiac sign.'); return; }
      setSavingPartner(true);
      try {
        const partner = { id: crypto.randomUUID(), type: 'other', name: partnerName.trim(), relationshipType, isZodiacOnly: true, zodiacSign: selectedZodiacSign, birthDate: '2000-01-01', birthTime: '12:00', birthLocation: 'Unknown', isTimeUnknown: true, chart: { planets: [{ name: 'Sun', sign: selectedZodiacSign, degree: 15, house: 1 }], aspects: [], houses: [] } };
        await addPartner(partner);
        setShowAddModal(false);
        resetForm();
      } catch (e) { window.alert('Failed to save.'); }
      finally { setSavingPartner(false); }
      return;
    }
    if (!partnerDate) { window.alert('Please select a birth date.'); return; }
    if (!selectedCity) { window.alert('Please select a birth city.'); return; }
    setSavingPartner(true);
    try {
      const dateStr = partnerDate;
      const timeStr = (isTimeUnknown || !partnerTime) ? '12:00' : partnerTime;
      const c = calculateChart(dateStr, timeStr, { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name }, isTimeUnknown, 'whole');
      const partner = { id: crypto.randomUUID(), type: 'other', name: partnerName.trim(), relationshipType, birthDate: dateStr, birthTime: timeStr, birthLocation: selectedCity.name, isTimeUnknown, chart: c };
      await addPartner(partner);
      setShowAddModal(false);
      resetForm();
    } catch (e) { window.alert('Failed to calculate chart.'); }
    finally { setSavingPartner(false); }
  };

  const resetForm = () => { setPartnerName(''); setPartnerDate(''); setPartnerTime(''); setIsTimeUnknown(false); setCitySearch(''); setSelectedCity(null); setCitySuggestions([]); setRelationshipType('partner'); setZodiacOnlyMode(false); setSelectedZodiacSign(null); };

  const showToast = useCallback((message) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3000);
  }, []);

  const openDeepenModal = useCallback((partner, mode) => {
    setDeepenPartner(partner);
    setDeepenMode(mode);
    setDeepenDate(mode === 'full' ? '' : (partner.birthDate || ''));
    setDeepenTime('');
    setDeepenTimeUnknown(false);
    setDeepenCitySearch(mode === 'time' && partner.birthLocation && partner.birthLocation !== 'Unknown' ? partner.birthLocation : '');
    setDeepenSelectedCity(mode === 'time' && partner.birthLocation && partner.birthLocation !== 'Unknown' ? { name: partner.birthLocation, lat: partner.lat || 0, lng: partner.lng || 0 } : null);
    setDeepenCitySuggestions([]);
    setShowDeepenModal(true);
  }, []);

  const resetDeepenForm = () => {
    setDeepenPartner(null); setDeepenDate(''); setDeepenTime(''); setDeepenTimeUnknown(false);
    setDeepenCitySearch(''); setDeepenSelectedCity(null); setDeepenCitySuggestions([]);
  };

  const handleSaveDeepenedPartner = async () => {
    if (!deepenPartner) return;
    if (deepenMode === 'full') {
      if (!deepenDate) { window.alert('Please select a birth date.'); return; }
      if (!deepenSelectedCity) { window.alert('Please select a birth city.'); return; }
    }
    if (deepenMode === 'time') {
      if (!deepenTime && !deepenTimeUnknown) { window.alert('Please select a birth time or mark as unknown.'); return; }
    }
    setDeepenSaving(true);
    try {
      const dateStr = deepenMode === 'full' ? deepenDate : deepenPartner.birthDate;
      const timeStr = (deepenTimeUnknown || !deepenTime) ? '12:00' : deepenTime;
      const city = deepenMode === 'full' ? deepenSelectedCity : (deepenSelectedCity || { lat: deepenPartner.lat || 0, lng: deepenPartner.lng || 0, name: deepenPartner.birthLocation || 'Unknown' });
      const isTimeStillUnknown = deepenTimeUnknown || !deepenTime;
      const newChart = calculateChart(dateStr, timeStr, { lat: city.lat, lng: city.lng, name: city.name }, isTimeStillUnknown, 'whole');
      const updated = { ...deepenPartner, isZodiacOnly: false, birthDate: dateStr, birthTime: timeStr, birthLocation: city.name, lat: city.lat, lng: city.lng, isTimeUnknown: isTimeStillUnknown, chart: newChart };
      // Note: PWA context doesn't have updatePartner, so remove + re-add
      await removePartner(deepenPartner.id);
      await addPartner(updated);
      if (selectedPartner && selectedPartner.id === updated.id) {
        setSelectedPartner(updated);
      }
      setShowDeepenModal(false);
      resetDeepenForm();
      showToast(`Your reading with ${updated.name?.split(' ')[0] || 'them'} just got deeper!`);
    } catch (e) {
      console.warn('Deepen partner error:', e);
      window.alert('Failed to recalculate chart. Please try again.');
    } finally { setDeepenSaving(false); }
  };

  const handleRemovePartner = (partner) => {
    if (window.confirm(`Remove ${partner.name} from your circle?`)) {
      removePartner(partner.id);
      setSelectedPartner(null);
    }
  };

  const handleCelebMatch = useCallback((celeb) => {
    const userSunSign = chart?.planets?.find(p => p.name === 'Sun')?.sign;
    if (!userSunSign) return;
    const result = calculateZodiacOnlyScore(userSunSign, celeb.sign);
    setSelectedCeleb(celeb);
    setCelebResult(result);
  }, [chart]);

  const handleShareCelebResult = useCallback(async () => {
    if (!celebResult || !selectedCeleb) return;
    const userName = profile?.name?.split(' ')[0] || 'I';
    const msg = `${userName} & ${selectedCeleb.name} -- ${celebResult.harmonyScore}% compatible ${ZODIAC_GLYPHS[selectedCeleb.sign] || ''}\n\nFind out on Celestia`;
    try { await navigator.share({ text: msg }); } catch (e) { }
  }, [celebResult, selectedCeleb, profile]);

  const handleShareStory = useCallback(async () => {
    if (!viralInsights) {
      setViralLoading(true);
      try { const insights = await generateMatchViralInsights(userProfile, partnerProfile, synastry); setViralInsights(insights); }
      catch (e) { setViralInsights({ spark: "A connection that doesn't need explaining.", tension: "You want the same thing.", truth: "They see through your walls.", oneWord: "Magnetic" }); }
      finally { setViralLoading(false); }
    }
    setShowStoryModal(true);
  }, [viralInsights, userProfile, partnerProfile, synastry]);

  const userSun = chart?.planets?.find(p => p.name === 'Sun');
  const partnerSun = partnerProfile?.chart?.planets?.find(p => p.name === 'Sun');

  if (!chart) {
    return (
      <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 40, paddingRight: 40, minHeight: '100vh' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', textAlign: 'center', marginBottom: 10 }}>Complete your profile first</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--c-text-secondary)', textAlign: 'center' }}>Finish onboarding to unlock cosmic compatibility.</p>
      </div>
    );
  }

  // Group partners by category
  const groupedPartners = {};
  CATEGORY_GROUPS.forEach(g => { groupedPartners[g.key] = []; });
  partnerProfiles.forEach(p => {
    const role = p.relationshipType || 'other';
    const group = CATEGORY_GROUPS.find(g => g.roles.includes(role));
    if (group) groupedPartners[group.key].push(p);
    else groupedPartners.other.push(p);
  });

  // Ring people
  const ringPeople = {};
  ORBIT_RINGS.forEach(ring => {
    const group = CATEGORY_GROUPS.find(g => g.key === ring.key);
    if (!group) { ringPeople[ring.key] = []; return; }
    const people = groupedPartners[group.key] || [];
    ringPeople[ring.key] = people.map((p, i) => {
      const pos = getOrbitPosition(i, people.length, ring.radius);
      return { ...p, _posX: pos.x, _posY: pos.y };
    });
  });
  const otherPeople = groupedPartners.other || [];
  const outerRing = ORBIT_RINGS[ORBIT_RINGS.length - 1];
  const workCount = (groupedPartners.work || []).length;
  otherPeople.forEach((p, i) => {
    const total = workCount + otherPeople.length;
    const pos = getOrbitPosition(workCount + i, total, outerRing.radius);
    ringPeople[outerRing.key].push({ ...p, _posX: pos.x, _posY: pos.y });
  });

  const showDetailScreen = selectedPartner != null;
  const legendItems = CATEGORY_GROUPS.map(g => ({ ...g, count: (groupedPartners[g.key] || []).length })).filter(g => g.count > 0 || g.key === 'love');

  // ── DETAIL SCREEN ──
  if (showDetailScreen && synastry) {
    const rc = ROLE_DETAIL_CONFIG[partnerRole] || ROLE_DETAIL_CONFIG.other;
    const lbl = rc.labels;
    const p1Name = profile?.name?.split(' ')[0] || 'You';
    const p2Name = partnerProfile?.name?.split(' ')[0] || 'Partner';
    const heroGrad = `linear-gradient(135deg, ${rc.heroGradient.join(', ')})`;

    const renderSection = (sKey, idx) => {
      switch (sKey) {
        case 'aiAnalysis':
          if (aiLoading) return <div key={idx} style={{ textAlign: 'center', padding: '16px 0' }}><div className="spinner" /><p style={{ fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 6 }}>Reading your charts...</p></div>;
          if (!aiAnalysis) return null;
          return (
            <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{lbl.aiAnalysis}</p>
              <p style={{ fontSize: 13.5, color: 'var(--c-heading)', lineHeight: 1.65 }}>{aiAnalysis}</p>
            </div>
          );
        case 'dimensions':
          return (
            <div key={idx}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{lbl.dimensions}</p>
              <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}>
                {roleDims.map((d, i) => (
                  <div key={i} style={{ marginBottom: i < roleDims.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--c-heading)' }}>{d.icon} {d.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: d.color }}>{d.pct}%</span>
                    </div>
                    <div style={{ height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${d.pct}%`, backgroundColor: d.color, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'areas':
          if (detailsLoading) return <div key={idx} style={{ textAlign: 'center', padding: '16px 0' }}><div className="spinner" /><p style={{ fontSize: 12, color: 'var(--c-text-secondary)', marginTop: 6 }}>Analyzing your connection...</p></div>;
          if (!matchDetails?.areas) return null;
          return (
            <div key={idx}>
              <p style={{ fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{lbl.areas}</p>
              {Object.entries(matchDetails.areas).map(([key, area], i) => {
                const dim = roleDims.find(d => d.key === key);
                return (
                  <div key={i} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 8, border: '1px solid var(--c-card-border-alpha)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: 'var(--c-heading)', fontFamily: 'var(--font-serif)' }}>{dim?.icon || ''} {dim?.label || key}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.gold }}>{area.score}%</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${area.score}%`, backgroundColor: dim?.color || T.gold, borderRadius: 2 }} />
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(250,248,242,0.7)', lineHeight: 1.6, marginBottom: 4 }}>{area.strength}</p>
                    {area.tension && <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>{area.tension}</p>}
                  </div>
                );
              })}
            </div>
          );
        case 'sharedValues':
          if (!matchDetails?.sharedValues?.length) return null;
          return <div key={idx}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{lbl.sharedValues}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{matchDetails.sharedValues.map((v, i) => <span key={i} style={{ backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, padding: '6px 12px', fontSize: 12, color: T.gold, border: '1px solid rgba(200,168,75,0.2)' }}>{v}</span>)}</div></div>;
        case 'keyConnections':
          if (!synastry.links?.length) return null;
          return <div key={idx}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{lbl.keyConnections}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{synastry.links.slice(0, 6).map((link, i) => <span key={i} style={{ backgroundColor: link.isFriction ? 'rgba(232,120,120,0.1)' : 'rgba(200,168,75,0.08)', borderRadius: 100, padding: '6px 12px', fontSize: 12, color: link.isFriction ? '#E87878' : T.gold, border: `1px solid ${link.isFriction ? 'rgba(232,120,120,0.2)' : 'rgba(200,168,75,0.2)'}` }}>{link.label} {link.description}</span>)}</div></div>;
        case 'loveLanguages':
          if (!matchDetails?.loveLanguages) return null;
          return (
            <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>LOVE LANGUAGES</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10, textAlign: 'center' }}><p style={{ fontSize: 14, marginBottom: 4 }}>{'\u2640'}</p><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{p1Name}</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.loveLanguages.user}</p></div>
                <div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10, textAlign: 'center' }}><p style={{ fontSize: 14, marginBottom: 4 }}>{'\u2640'}</p><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{p2Name}</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.loveLanguages.partner}</p></div>
              </div>
            </div>
          );
        case 'conflictStyle':
          if (!matchDetails?.conflictStyle) return null;
          return (
            <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, borderLeft: '3px solid #E86050', border: '1px solid var(--c-card-border-alpha)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>CONFLICT & RESOLUTION</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, color: '#E86050', width: 20, textAlign: 'center' }}>{'\u25b3'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2, textTransform: 'uppercase' }}>TRIGGERS</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.conflictStyle.triggers}</p></div></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, color: '#4A8060', width: 20, textAlign: 'center' }}>{'\u2726'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#4A8060', marginBottom: 2, textTransform: 'uppercase' }}>RESOLUTION</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.conflictStyle.resolution}</p></div></div>
            </div>
          );
        case 'friendshipDynamic':
          if (!matchDetails?.friendshipDynamic) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>YOUR FRIENDSHIP VIBE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5, marginBottom: 8 }}>{matchDetails.friendshipDynamic.vibeDescription}</p><div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(200,168,75,0.12)' }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 3 }}>BEST TOGETHER</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.friendshipDynamic.bestActivity}</p></div></div>;
        case 'generationalPattern':
          if (!matchDetails?.generationalPattern) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, borderLeft: '3px solid #A080C0', border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>GENERATIONAL PATTERN</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u2644'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2, textTransform: 'uppercase' }}>THE PATTERN</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.generationalPattern.pattern}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u25ce'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2, textTransform: 'uppercase' }}>ORIGIN</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.generationalPattern.origin}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, color: '#4A8060', width: 20, textAlign: 'center' }}>{'\u2726'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#4A8060', marginBottom: 2, textTransform: 'uppercase' }}>HEALING</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.generationalPattern.healing}</p></div></div></div>;
        case 'communicationGuide':
          if (!matchDetails?.communicationGuide) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>COMMUNICATION GUIDE</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u263f'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>THEIR STYLE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationGuide.theirStyle}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u263f'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>YOUR STYLE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationGuide.yourStyle}</p></div></div><div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(200,168,75,0.12)', marginTop: 6 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 3 }}>BRIDGE TIP</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationGuide.bridgeTip}</p></div></div>;
        case 'communicationPlaybook':
          if (!matchDetails?.communicationPlaybook) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>COMMUNICATION PLAYBOOK</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u263f'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>THEIR STYLE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationPlaybook.theirStyle}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, color: '#4A8060', width: 20, textAlign: 'center' }}>{'\u2192'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#4A8060', marginBottom: 2 }}>BEST APPROACH</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationPlaybook.bestApproach}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, color: '#E86050', width: 20, textAlign: 'center' }}>{'\u2715'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#E86050', marginBottom: 2 }}>AVOID</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.communicationPlaybook.avoid}</p></div></div></div>;
        case 'siblingDynamic':
          if (!matchDetails?.siblingDynamic) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>SIBLING DYNAMIC</p><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-heading)', marginBottom: 10 }}>{matchDetails.siblingDynamic.dynamicLabel}</p><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-secondary)', width: 55 }}>Rivalry</span><div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${matchDetails.siblingDynamic.rivalryScore}%`, backgroundColor: '#E86050', borderRadius: 3 }} /></div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-heading)', width: 32, textAlign: 'right' }}>{matchDetails.siblingDynamic.rivalryScore}%</span></div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-secondary)', width: 55 }}>Alliance</span><div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${matchDetails.siblingDynamic.allianceScore}%`, backgroundColor: '#4A8060', borderRadius: 3 }} /></div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-heading)', width: 32, textAlign: 'right' }}>{matchDetails.siblingDynamic.allianceScore}%</span></div><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.siblingDynamic.insight}</p></div>;
        case 'careerStrategy':
          if (!matchDetails?.careerStrategy) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, borderLeft: `3px solid ${T.gold}`, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>CAREER STRATEGY</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u2191'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>LEVERAGE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.careerStrategy.leverage}</p></div></div><div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(200,168,75,0.12)', marginTop: 6 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 3 }}>GROWTH TIP</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.careerStrategy.growthTip}</p></div></div>;
        case 'teamworkProfile':
          if (!matchDetails?.teamworkProfile) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>TEAMWORK PROFILE</p><div style={{ display: 'flex', gap: 10, marginBottom: 8 }}><div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10 }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{p1Name}'s Role</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.teamworkProfile.yourRole}</p></div><div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10 }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>{p2Name}'s Role</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.teamworkProfile.theirRole}</p></div></div><div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, border: '1px solid rgba(200,168,75,0.12)' }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 3 }}>BEST COLLAB STYLE</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.teamworkProfile.bestCollabStyle}</p></div></div>;
        case 'parentingGuide':
          if (!matchDetails?.parentingGuide) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, borderLeft: '3px solid #4A8060', border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>PARENTING GUIDE</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u263d'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>THEIR NEEDS</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.parentingGuide.theirNeeds}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, color: '#4A8060', width: 20, textAlign: 'center' }}>{'\u2726'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#4A8060', marginBottom: 2 }}>YOUR STRENGTH</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.parentingGuide.yourStrength}</p></div></div></div>;
        case 'childNature':
          if (!matchDetails?.childNature) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>THEIR NATURE</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u2609'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>TEMPERAMENT</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.childNature.coreTemperament}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{'\u263d'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 2 }}>EMOTIONAL NEED</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.childNature.emotionalNeed}</p></div></div></div>;
        case 'healingPath':
          if (!matchDetails?.healingPath) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>HEALING PATH</p><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 14, color: '#A06050', width: 20, textAlign: 'center' }}>{'\u25c7'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#A06050', marginBottom: 2 }}>THE WOUND</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.healingPath.wound}</p></div></div><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><span style={{ fontSize: 14, color: '#4A8060', width: 20, textAlign: 'center' }}>{'\u2726'}</span><div style={{ flex: 1 }}><p style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: '#4A8060', marginBottom: 2 }}>APPROACH</p><p style={{ fontSize: 12.5, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.healingPath.approach}</p></div></div>{matchDetails.healingPath.affirmation && <div style={{ backgroundColor: 'rgba(74,128,96,0.06)', borderRadius: 10, padding: 12, marginTop: 8, textAlign: 'center', border: '1px solid rgba(74,128,96,0.12)' }}><p style={{ fontSize: 13, color: '#4A8060', fontStyle: 'italic', lineHeight: 1.5 }}>"{matchDetails.healingPath.affirmation}"</p></div>}</div>;
        case 'adventureCompat':
          if (!matchDetails?.adventureCompat) return null;
          return <div key={idx} style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12, border: '1px solid var(--c-card-border-alpha)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>ADVENTURE COMPATIBILITY</p><div style={{ display: 'flex', gap: 10 }}><div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10, textAlign: 'center' }}><p style={{ fontSize: 16, marginBottom: 2 }}>{'\u2708'}</p><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Ideal Trip</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.adventureCompat.idealTrip}</p></div><div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, padding: 10, textAlign: 'center' }}><p style={{ fontSize: 16, marginBottom: 2 }}>{'\u25c7'}</p><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Shared Energy</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{matchDetails.adventureCompat.sharedEnergy}</p></div></div></div>;
        case 'actionRow':
          return (
            <div key={idx}>
              {partnerProfile?.isZodiacOnly && (
                <button onClick={() => openDeepenModal(partnerProfile, 'full')} style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(200,168,75,0.06)', border: '1px solid rgba(200,168,75,0.15)', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%', cursor: 'pointer' }}>
                  <span style={{ fontSize: 18, color: T.gold, width: 28, textAlign: 'center' }}>{'\u2191'}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}><p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-heading)' }}>Deepen Reading</p><p style={{ fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 1 }}>Add {p2Name}'s birthday for a full chart reading</p></div>
                  <span style={{ fontSize: 16, color: T.gold }}>{'\u2197'}</span>
                </button>
              )}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={async () => { try { await navigator.share({ text: `${p1Name} & ${p2Name} -- ${synastry.harmonyScore}% compatibility on Celestia!` }); } catch(e){} }} style={{ flex: 1, borderRadius: 12, border: '1.5px solid rgba(200,168,75,0.3)', padding: '12px 0', textAlign: 'center', backgroundColor: 'transparent', cursor: 'pointer' }}><span style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>Share {'\u2197'}</span></button>
              </div>
              <button onClick={() => handleRemovePartner(partnerProfile)} style={{ alignSelf: 'center', display: 'block', margin: '16px auto 8px', padding: '12px 24px', borderRadius: 12, border: '1.5px solid rgba(220,80,80,0.25)', backgroundColor: 'rgba(220,80,80,0.06)', cursor: 'pointer' }}><span style={{ fontSize: 13, fontWeight: 500, color: '#DC5050' }}>Remove {p2Name} from Circle</span></button>
            </div>
          );
        case 'relationshipSeason':
          if (!cosmicSeason) return null;
          return <div key={idx} style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid rgba(200,168,75,0.12)' }}><p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>YOUR RELATIONSHIP SEASON</p><p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.6 }}>{cosmicSeason.planet} in your {cosmicSeason.natalTarget} sign shapes how you connect right now</p></div>;
        case 'activeWindows':
          if (!activeRelationshipWindows.length) return null;
          return (
            <div key={idx} style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 12, marginBottom: 12, border: '1px solid rgba(200,168,75,0.12)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>WHAT'S ACTIVE BETWEEN YOU</p>
              {activeRelationshipWindows.slice(0, 3).map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>{w.planet === 'Venus' ? '\u2640' : w.planet === 'Mars' ? '\u2642' : w.planet === 'Moon' ? '\u263d' : '\u2605'}</span>
                  <p style={{ flex: 1, fontSize: 13, color: 'var(--c-heading)', lineHeight: 1.4 }}>{w.description}</p>
                </div>
              ))}
            </div>
          );
        default: return null;
      }
    };

    return (
      <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', minHeight: '100vh' }}>
        <div className="scroll-container" style={{ paddingBottom: 110 }}>
          {/* Detail hero */}
          <div style={{ background: heroGrad, paddingTop: 70, paddingBottom: 24, paddingLeft: 22, paddingRight: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
            <button onClick={() => setSelectedPartner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}><span style={{ fontSize: 16, color: 'rgba(250,248,242,0.7)' }}>{'\u2039'} Back</span></button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, #E2C46A, #8C6C18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'white' }}>{getInitial(profile?.name)}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 24, height: 1, backgroundColor: 'rgba(200,168,75,0.3)' }} /><span style={{ fontSize: 14 }}>{ROLE_LABELS[partnerRole]?.icon || '\u2661'}</span><div style={{ width: 24, height: 1, backgroundColor: 'rgba(200,168,75,0.3)' }} /></div>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: `linear-gradient(135deg, ${(ROLE_COLORS[partnerRole] || ROLE_COLORS.other).bg.join(', ')})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'white' }}>{getInitial(partnerProfile?.name)}</span></div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', textAlign: 'center', marginBottom: 4 }}>{p1Name} & {p2Name}</h2>
            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', textAlign: 'center', marginBottom: 12 }}>{ROLE_LABELS[partnerRole]?.label} {'\u00b7'} {ZODIAC_GLYPHS[partnerSun?.sign] || '\u2726'} {partnerSun?.sign || '\u2014'}</p>
            {/* Score ring (SVG) */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
              <svg width={80} height={80}>
                <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                <circle cx={40} cy={40} r={34} fill="none" stroke={T.gold} strokeWidth={5}
                  strokeDasharray={`${(synastry.harmonyScore / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                  strokeLinecap="round" transform="rotate(-90 40 40)" />
              </svg>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)' }}>{synastry.harmonyScore}</span>
            </div>
            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--c-text-secondary)', textAlign: 'center', marginBottom: 8 }}>"{rc.getScoreLabel(synastry.harmonyScore)}"</p>
            {/* Dimension chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {roleDims.map((d, i) => (
                <div key={i} style={{ borderRadius: 100, border: `1px solid ${d.color}40`, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: d.color }}>{d.icon}</span>
                  <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>{d.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: d.color }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px 20px', backgroundColor: 'var(--c-bg)' }}>
            {rc.sectionOrder.map((sKey, idx) => renderSection(sKey, idx))}
            <div style={{ height: 40 }} />
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN CIRCLE VIEW ──
  return (
    <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', minHeight: '100vh' }}>
      <div className="scroll-container" style={{ paddingBottom: 110 }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0E0E22, #1A1228, #14101E)', paddingTop: 70, paddingBottom: 20, paddingLeft: 22, paddingRight: 22, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'var(--c-heading)', marginBottom: 6 }}>Compatibility</h1>
          <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 12 }}>
            {partnerProfiles.length === 0 ? 'Check anyone -- a crush, a friend, or a celebrity' : `${partnerProfiles.length} ${partnerProfiles.length === 1 ? 'person' : 'people'} in your circle`}
          </p>
          <button onClick={() => setShowAddModal(true)} style={{ background: 'rgba(200,168,75,0.12)', border: '1px solid rgba(200,168,75,0.3)', borderRadius: 100, padding: '10px 24px', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.gold }}>+ Add Someone</span>
          </button>
        </div>

        {/* Orbit visualization (empty state) */}
        {partnerProfiles.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, paddingBottom: 8 }}>
            <div style={{ width: ORBIT_MAX, height: ORBIT_MAX, position: 'relative' }}>
              {/* Orbit ring tracks */}
              {ORBIT_RINGS.map(ring => (
                <div key={ring.key + '_track'} style={{ position: 'absolute', width: ring.radius * 2, height: ring.radius * 2, borderRadius: '50%', left: orbitCenter - ring.radius, top: orbitCenter - ring.radius, border: `1px dashed ${ring.borderColor}`, backgroundColor: ring.color, pointerEvents: 'none' }} />
              ))}
              {/* Center orb */}
              <div style={{ position: 'absolute', left: orbitCenter - CENTER_SIZE / 2, top: orbitCenter - CENTER_SIZE / 2, width: CENTER_SIZE, height: CENTER_SIZE }}>
                <div style={{ width: CENTER_SIZE + 20, height: CENTER_SIZE + 20, borderRadius: '50%', position: 'absolute', left: -10, top: -10, backgroundColor: 'rgba(200,168,75,0.1)', animation: 'pulse 4s ease-in-out infinite' }} />
                <div style={{ width: CENTER_SIZE, height: CENTER_SIZE, borderRadius: '50%', background: 'linear-gradient(135deg, #E2C46A, #8C6C18)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'white' }}>{getInitial(profile?.name)}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{ZODIAC_GLYPHS[userSun?.sign] || '\u2726'}</span>
                </div>
              </div>
              {/* Add buttons on each ring */}
              {ORBIT_RINGS.map((ring, idx) => {
                const angles = [Math.PI / 2, Math.PI, -Math.PI / 2, 0];
                const angle = angles[idx % 4];
                const addX = Math.cos(angle) * ring.radius;
                const addY = Math.sin(angle) * ring.radius;
                return (
                  <button key={ring.key + '_add'} onClick={() => { const group = CATEGORY_GROUPS.find(g => g.key === ring.key); setRelationshipType(group?.roles[0] || 'other'); setShowAddModal(true); }}
                    style={{ position: 'absolute', left: orbitCenter + addX - 16, top: orbitCenter + addY - 16, width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(200,168,75,0.08)', border: '1px dashed rgba(200,168,75,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 30 }}>
                    <span style={{ fontSize: 16, color: T.gold }}>+</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Orbit legend (empty state) */}
        {partnerProfiles.length === 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 20px', marginBottom: 16 }}>
            {legendItems.map(item => (
              <button key={item.key} onClick={() => { setRelationshipType(item.roles[0]); setShowAddModal(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', flex: 1, minWidth: 120 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ORBIT_RINGS.find(r => r.key === item.key)?.borderColor || 'rgba(200,168,75,0.3)' }} />
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>{item.icon} {item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-heading)', marginLeft: 'auto' }}>{item.count}</span>
                <span style={{ fontSize: 12, color: T.gold }}>+</span>
              </button>
            ))}
          </div>
        )}

        {/* Connections list (when partners exist) */}
        {partnerProfiles.length > 0 && (
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 10, textTransform: 'uppercase' }}>YOUR CONNECTIONS</p>
            {partnerProfiles.map(p => {
              const role = p.relationshipType || 'other';
              const roleColor = ROLE_COLORS[role] || ROLE_COLORS.other;
              const score = getQuickScore(chart, p);
              const pSun = p.chart?.planets?.find(pl => pl.name === 'Sun');
              const roleInfo = ROLE_LABELS[role];
              const canDeepen = p.isZodiacOnly;
              return (
                <div key={p.id}>
                  <button onClick={() => setSelectedPartner(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: 14, cursor: 'pointer', marginBottom: 8 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 21, background: `linear-gradient(135deg, ${roleColor.bg.join(', ')})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'white' }}>{getInitial(p.name)}</span>
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-heading)' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>{roleInfo?.icon} {roleInfo?.label} {'\u00b7'} {ZODIAC_GLYPHS[pSun?.sign] || '\u2726'} {pSun?.sign || 'Unknown'}{canDeepen ? ' \u00b7 Sign only' : ''}</p>
                    </div>
                    {score != null && (
                      <div style={{ backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 100, padding: '4px 10px', border: '1px solid rgba(200,168,75,0.2)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>{score}%</span>
                      </div>
                    )}
                    <span style={{ fontSize: 14, color: 'var(--c-text-secondary)' }}>{'\u203a'}</span>
                  </button>
                  {canDeepen && (
                    <button onClick={() => openDeepenModal(p, 'full')} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -4, marginLeft: 62, padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.18)', cursor: 'pointer' }}>
                      <span style={{ fontSize: 12, color: T.gold }}>{'\u2191'}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: T.gold }}>Deepen Reading</span>
                      <span style={{ fontSize: 11, color: T.gold, marginLeft: 2 }}>{'\u2197'}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Celebrity Match */}
        <div style={{ paddingTop: 8, paddingBottom: 4, marginBottom: 10 }}>
          <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>CELEBRITY MATCH</p>
            <p style={{ fontSize: 13, fontFamily: 'var(--font-serif)', color: 'var(--c-heading)' }}>Are you compatible with your crush?</p>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
            {CELEBRITY_DATA.map((celeb) => {
              const isSelected = selectedCeleb?.name === celeb.name;
              return (
                <button key={celeb.name} onClick={() => handleCelebMatch(celeb)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: isSelected ? 'rgba(200,168,75,0.1)' : 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '10px 14px', border: `1px solid ${isSelected ? T.gold : 'rgba(255,255,255,0.06)'}`, minWidth: 140, cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ fontSize: 20 }}>{celeb.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-heading)', whiteSpace: 'nowrap' }}>{celeb.name}</p>
                    <p style={{ fontSize: 11, color: isSelected ? T.gold : T.stone }}>{ZODIAC_GLYPHS[celeb.sign]} {celeb.sign}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Celebrity result */}
          {celebResult && selectedCeleb && (
            <div style={{ margin: '12px 20px 0', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 16, padding: 16, border: '1px solid rgba(200,168,75,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontFamily: 'var(--font-serif)', color: 'var(--c-heading)' }}>{profile?.name?.split(' ')[0] || 'You'}</span>
                  <span style={{ fontSize: 14, fontFamily: 'var(--font-serif)', color: T.gold }}>&</span>
                  <span style={{ fontSize: 15, fontFamily: 'var(--font-serif)', color: 'var(--c-heading)' }}>{selectedCeleb.name}</span>
                </div>
                <div style={{ backgroundColor: 'rgba(200,168,75,0.12)', borderRadius: 10, padding: '6px 12px', border: '1px solid rgba(200,168,75,0.3)' }}>
                  <span style={{ fontSize: 18, fontFamily: 'var(--font-serif)', color: T.gold }}>{celebResult.harmonyScore}%</span>
                </div>
              </div>
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--c-text-secondary)', marginBottom: 10 }}>{getScoreLabel(celebResult.harmonyScore)}</p>
              {celebResult.scores && Object.keys(celebResult.scores).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {Object.entries(celebResult.scores).slice(0, 4).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--c-text-secondary)', width: 90 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                      <div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${val}%`, borderRadius: 3, backgroundColor: T.gold }} /></div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.gold, width: 32, textAlign: 'right' }}>{val}%</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleShareCelebResult} style={{ float: 'right', borderRadius: 10, border: '1.5px solid rgba(200,168,75,0.3)', padding: '8px 16px', backgroundColor: 'rgba(200,168,75,0.06)', cursor: 'pointer' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.gold }}>Share {'\u2197'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Add person card */}
        <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '0 20px 16px', backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: 16, cursor: 'pointer', width: 'calc(100% - 40px)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>+</span></div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-heading)' }}>Check compatibility with someone</p>
            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>Enter their birthday or just their zodiac sign</p>
          </div>
        </button>
      </div>

      {/* ── ADD PARTNER MODAL ── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid var(--c-card-border-alpha)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)' }}>Add Person</h2>
            <button onClick={() => { setShowAddModal(false); resetForm(); }} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--c-text-secondary)', cursor: 'pointer' }}>{'\u2715'}</button>
          </div>
          <div className="scroll-container" style={{ flex: 1, padding: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>THEIR NAME</label>
            <input type="text" placeholder="Full name" value={partnerName} onChange={e => setPartnerName(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />

            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>RELATIONSHIP</label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
              {RELATIONSHIP_TYPES.map(rt => (
                <button key={rt.key} onClick={() => setRelationshipType(rt.key)}
                  style={{ padding: '8px 14px', borderRadius: 100, backgroundColor: relationshipType === rt.key ? T.navy : 'rgba(255,255,255,0.06)', border: `1px solid ${relationshipType === rt.key ? T.gold : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: relationshipType === rt.key ? T.gold : T.stone }}>{rt.icon} {rt.label}</span>
                </button>
              ))}
            </div>

            <button onClick={() => setZodiacOnlyMode(!zodiacOnlyMode)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, paddingTop: 8, paddingBottom: 8, background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${zodiacOnlyMode ? T.gold : 'rgba(255,255,255,0.15)'}`, backgroundColor: zodiacOnlyMode ? T.navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{zodiacOnlyMode && <span style={{ color: T.gold, fontSize: 10 }}>{'\u2713'}</span>}</div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>I only know their zodiac sign</p>
                <p style={{ fontSize: 11, color: 'rgba(151,144,127,0.6)', marginTop: 2 }}>Sun sign compatibility (simplified)</p>
              </div>
            </button>

            {zodiacOnlyMode && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 8, textTransform: 'uppercase' }}>THEIR ZODIAC SIGN</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(ZODIAC_SIGNS || ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']).map(sign => (
                    <button key={sign} onClick={() => setSelectedZodiacSign(sign)}
                      style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: selectedZodiacSign === sign ? 'rgba(200,168,75,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedZodiacSign === sign ? T.gold : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: selectedZodiacSign === sign ? T.gold : T.stone }}>{sign}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!zodiacOnlyMode && (
              <>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>BIRTH DATE</label>
                <input type="date" value={partnerDate} onChange={e => setPartnerDate(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />

                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>BIRTH TIME <span style={{ fontSize: 9, letterSpacing: 0, fontWeight: 400 }}>(if you know it)</span></label>
                <input type="time" value={isTimeUnknown ? '' : partnerTime} onChange={e => setPartnerTime(e.target.value)} disabled={isTimeUnknown} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', opacity: isTimeUnknown ? 0.4 : 1, boxSizing: 'border-box' }} />
                <button onClick={() => setIsTimeUnknown(!isTimeUnknown)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${isTimeUnknown ? T.gold : 'rgba(255,255,255,0.15)'}`, backgroundColor: isTimeUnknown ? T.navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isTimeUnknown && <span style={{ color: T.gold, fontSize: 10 }}>{'\u2713'}</span>}</div>
                  <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>I don't know the exact birth time</span>
                </button>

                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>BIRTH CITY</label>
                <input type="text" placeholder="Search city..." value={selectedCity ? selectedCity.name : citySearch} onChange={e => { setSelectedCity(null); setCitySearch(e.target.value); }} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                {citySearching && <div style={{ padding: 12, textAlign: 'center' }}><div className="spinner" /></div>}
                {!citySearching && citySuggestions.length > 0 && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginTop: 4, overflow: 'hidden' }}>
                    {citySuggestions.map((c, i) => (
                      <button key={i} onClick={() => { setSelectedCity(c); setCitySearch(c.name); setCitySuggestions([]); }} style={{ display: 'block', width: '100%', padding: 13, borderBottom: '1px solid var(--c-divider)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span style={{ color: 'var(--c-heading)', fontSize: 14 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {zodiacOnlyMode && <div style={{ backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 10, padding: 12, marginBottom: 16 }}><p style={{ fontSize: 11, color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>{'\u2609'} Sun Sign Analysis -- simplified compatibility</p></div>}

            <button onClick={handleSavePartner} disabled={savingPartner || !partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !selectedCity)}
              style={{ width: '100%', backgroundColor: 'var(--c-bg)', borderRadius: 14, padding: 16, textAlign: 'center', border: `1px solid ${T.gold}`, cursor: 'pointer', marginTop: 28, opacity: (!partnerName.trim() || (zodiacOnlyMode ? !selectedZodiacSign : !selectedCity)) ? 0.5 : 1 }}>
              {savingPartner ? <div className="spinner" /> : <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-heading)' }}>Calculate Compatibility</span>}
            </button>
            <div style={{ height: 40 }} />
          </div>
        </div>
      )}

      {/* ── DEEPEN READING MODAL ── */}
      {showDeepenModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: '1px solid var(--c-card-border-alpha)' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)' }}>{deepenMode === 'full' ? 'Deepen Reading' : 'Add Birth Time'}</h2>
            <button onClick={() => { setShowDeepenModal(false); resetDeepenForm(); }} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--c-text-secondary)', cursor: 'pointer' }}>{'\u2715'}</button>
          </div>
          <div className="scroll-container" style={{ flex: 1, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--c-card-border-alpha)' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', flex: 1 }}>{deepenPartner?.name || ''}</span>
              <div style={{ backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, padding: '4px 10px', border: '1px solid rgba(200,168,75,0.25)' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.gold }}>{ZODIAC_GLYPHS[deepenPartner?.zodiacSign || deepenPartner?.chart?.planets?.find(pl => pl.name === 'Sun')?.sign] || '\u2726'} {deepenPartner?.zodiacSign || deepenPartner?.chart?.planets?.find(pl => pl.name === 'Sun')?.sign || ''}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 12, padding: 14, marginBottom: 16, border: '1px solid rgba(200,168,75,0.12)' }}>
              <p style={{ fontSize: 12, color: 'var(--c-heading)', lineHeight: 1.5 }}>{deepenMode === 'full' ? 'Adding birthday and location will unlock a full chart reading with emotional dynamics, communication patterns, and long-term potential.' : 'Adding birth time unlocks accurate Moon sign, house placements, and rising sign for much deeper compatibility insights.'}</p>
            </div>

            {deepenMode === 'full' && (
              <>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>BIRTH DATE</label>
                <input type="date" value={deepenDate} onChange={e => setDeepenDate(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
              </>
            )}

            <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>BIRTH TIME</label>
            <input type="time" value={deepenTimeUnknown ? '' : deepenTime} onChange={e => setDeepenTime(e.target.value)} disabled={deepenTimeUnknown} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', opacity: deepenTimeUnknown ? 0.4 : 1, boxSizing: 'border-box' }} />
            <button onClick={() => setDeepenTimeUnknown(!deepenTimeUnknown)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, background: 'none', border: 'none', cursor: 'pointer' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${deepenTimeUnknown ? T.gold : 'rgba(255,255,255,0.15)'}`, backgroundColor: deepenTimeUnknown ? T.navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{deepenTimeUnknown && <span style={{ color: T.gold, fontSize: 10 }}>{'\u2713'}</span>}</div>
              <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>I don't know the exact birth time</span>
            </button>

            {(deepenMode === 'full' || !deepenSelectedCity) && (
              <>
                <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1.5, color: 'var(--c-text-secondary)', display: 'block', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>BIRTH CITY</label>
                <input type="text" placeholder="Search city..." value={deepenSelectedCity ? deepenSelectedCity.name : deepenCitySearch} onChange={e => { setDeepenSelectedCity(null); setDeepenCitySearch(e.target.value); }} style={{ width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, padding: 14, fontSize: 15, color: 'var(--c-heading)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
                {deepenCitySearching && <div style={{ padding: 12, textAlign: 'center' }}><div className="spinner" /></div>}
                {!deepenCitySearching && deepenCitySuggestions.length > 0 && (
                  <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', marginTop: 4, overflow: 'hidden' }}>
                    {deepenCitySuggestions.map((c, i) => (
                      <button key={i} onClick={() => { setDeepenSelectedCity(c); setDeepenCitySearch(c.name); setDeepenCitySuggestions([]); }} style={{ display: 'block', width: '100%', padding: 13, borderBottom: '1px solid var(--c-divider)', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span style={{ color: 'var(--c-heading)', fontSize: 14 }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <button onClick={handleSaveDeepenedPartner} disabled={deepenSaving || (deepenMode === 'full' ? (!deepenDate || !deepenSelectedCity) : (!deepenTime && !deepenTimeUnknown))}
              style={{ width: '100%', backgroundColor: T.gold, borderRadius: 14, padding: 16, textAlign: 'center', border: 'none', cursor: 'pointer', marginTop: 28, opacity: (deepenMode === 'full' ? (!deepenDate || !deepenSelectedCity) : (!deepenTime && !deepenTimeUnknown)) ? 0.5 : 1 }}>
              {deepenSaving ? <div className="spinner" /> : <span style={{ fontSize: 15, fontWeight: 600, color: T.navy }}>{deepenMode === 'full' ? 'Deepen Compatibility' : 'Update Reading'}</span>}
            </button>
            <div style={{ height: 40 }} />
          </div>
        </div>
      )}

      {/* ── SUCCESS TOAST ── */}
      {successToast && (
        <div style={{ position: 'fixed', top: 80, left: 20, right: 20, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--c-bg)', borderRadius: 14, padding: '12px 18px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', animation: 'fadeInDown 0.3s ease', pointerEvents: 'none' }}>
          <span style={{ fontSize: 14, color: T.gold }}>{'\u2726'}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-heading)', flex: 1 }}>{successToast}</span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.05; }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          width: 20px; height: 20px; border: 2px solid rgba(200,168,75,0.2);
          border-top-color: ${T.gold}; border-radius: 50%; animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
