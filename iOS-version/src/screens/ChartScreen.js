import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Platform, StatusBar, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import ChartWheel from '../components/ChartWheel';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useNavigation } from '@react-navigation/native';

import { HOUSE_THEMES, HOUSE_FRIENDLY, ZODIAC_SYMBOLS } from '../constants/AstrologyCore';
import { generatePlacementDeepDive, generateAspectDeepDive, generateHouseDeepDive } from '../services/geminiService';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { useAnalytics, EVENTS } from '../services/analytics';
import { getUnlockedPlanets, getUnlockProgress, getUnlockDayForPlanet, UNLOCK_NARRATIVES } from '../services/unlockService';
import { getActiveCosmicWindows } from '../services/astrologyService';
import CosmicTooltip from '../components/CosmicTooltip';
import AstroText from '../components/AstroText';
import { useShareCard } from '../components/ShareCard';
import BigThreeShareCard from '../components/BigThreeShareCard';
import { getCosmicArchetype, getComboRarity } from '../services/cosmicIdentityService';
import { useTheme } from '../contexts/ThemeContext';

const PLANET_GLYPHS = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
  Ascendant: '↑', Midheaven: '↑', 'North Node': '☊', 'South Node': '☋', Chiron: '⚷'
};

const ASPECT_COLORS = {
  Conjunction: '#C8A84B', Trine: '#7EC8A0', Sextile: '#A0C8E0',
  Square: '#E87878', Opposition: '#E87878'
};

const ASPECT_GLYPHS = {
  Conjunction: '☌', Trine: '△', Sextile: '⚹', Square: '□', Opposition: '☍'
};

const ASPECT_NATURE = {
  Conjunction: 'Fusion', Trine: 'Flow', Sextile: 'Boost',
  Square: 'Tension', Opposition: 'Tug of War'
};

export default function ChartScreen() {
  const navigation = useNavigation();
  const { isPro } = useRevenueCat();
  const { userProfile, isLoading } = useUserProfile();
  const { capture } = useAnalytics();
  const { colors, isDark } = useTheme();

  const [tab, setTab] = useState(0);
  const [showFullList, setShowFullList] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const tabs = ['Planets', 'Aspects', 'Houses'];
  const [deepDive, setDeepDive] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [deepDiveType, setDeepDiveType] = useState('planet'); // 'planet' | 'aspect' | 'house'

  // Drip-feed unlock state — initialize with free planets to prevent flash-lock on first render
  const [unlockedPlanets, setUnlockedPlanets] = useState(['Sun', 'Moon', 'Ascendant']);
  const [unlockProgress, setUnlockProgress] = useState(null);
  const [activeWindows, setActiveWindows] = useState([]);

  // Share cards
  const { cardRef: bigThreeRef, captureAndShare: shareBigThree } = useShareCard();
  const { cardRef: quoteRef, captureAndShare: shareQuote } = useShareCard();

  const chart = userProfile?.chart;
  const archetype = useMemo(() => chart ? getCosmicArchetype(chart) : null, [chart]);
  const comboRarity = useMemo(() => chart ? getComboRarity(chart) : null, [chart]);

  // Check if a natal planet is currently activated by a transit
  const getTransitForPlanet = (planetName) => {
    return activeWindows.find(w =>
      w.natalPlanet === planetName ||
      (w.type === 'sign_transit' && w.targetSign &&
        userProfile?.chart?.planets?.find(p => p.name === planetName)?.sign === w.targetSign)
    );
  };

  // Load unlock state
  useEffect(() => {
    (async () => {
      const unlocked = await getUnlockedPlanets();
      setUnlockedPlanets(unlocked);
      const progress = await getUnlockProgress();
      setUnlockProgress(progress);
    })();
    // Load active transit windows
    try {
      const windows = getActiveCosmicWindows(userProfile?.chart, new Date());
      setActiveWindows(windows);
    } catch (e) { }
  }, []);

  const handlePlanetTap = async (planet) => {
    if (!planet.name || planet.name === 'South Node') return;
    // Check if deep dive is locked (drip-feed) — planet is VISIBLE, deep analysis is gated
    if (!isPro && !unlockedPlanets.includes(planet.name)) {
      const unlockDay = getUnlockDayForPlanet(planet.name);
      const narrative = UNLOCK_NARRATIVES[planet.name] || 'A new chapter of your story awaits';
      haptic.light();
      setDeepDiveType('planet');
      setShowDeepDive(true);
      setDeepDiveLoading(false);
      setDeepDive({
        locked: true,
        planetName: planet.name,
        sign: planet.sign,
        house: planet.house ? `House ${planet.house}` : '',
        unlockDay,
        hook: `Your ${planet.name} is in ${planet.sign}${planet.house ? ` (${planet.house}${planet.house === 1 ? 'st' : planet.house === 2 ? 'nd' : planet.house === 3 ? 'rd' : 'th'} house)` : ''}. ${narrative}.`,
        teaser: `The full deep dive into what ${planet.name} in ${planet.sign} means for your life — your patterns, your blind spots, and the insight that will make you say "how does it know?" — unlocks ${unlockDay === 1 ? 'tomorrow' : `in ${unlockDay} days`}.`,
      });
      return;
    }
    setDeepDiveType('planet');
    setShowDeepDive(true);
    setDeepDiveLoading(true);
    setDeepDive(null);
    try {
      const p = chart?.planets?.find(pp => pp.name === planet.name);
      const transit = getTransitForPlanet(planet.name);
      const transitCtx = transit ? `${transit.planet} ${transit.aspect || 'transiting'} your natal ${planet.name} in ${p?.sign || planet.sign} (orb: ${transit.orb || '?'}°). ${transit.description || ''}` : null;
      const result = await generatePlacementDeepDive(
        planet.name, p?.sign || planet.sign, p?.house || 1, userProfile?.id, transitCtx
      );
      setDeepDive({ ...result, planetName: planet.name, sign: p?.sign, house: p?.house });
      haptic.light();
      capture(EVENTS.CHART_DEEP_DIVE, { type: 'planet', planet: planet.name, sign: p?.sign });
      trackEvent('deep_dive', { planet: planet.name }).catch(() => { });
      awardXP(userProfile?.id || 'default', 'deep_dive').catch(() => { });
      completeQuestAction('deep_dive_done').catch(() => { });
    } catch (e) {
      console.error('Deep dive error:', e);
      setDeepDive({ hook: 'Unable to load insight right now.', planetName: planet.name });
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const handleAspectTap = async (aspect) => {
    setDeepDiveType('aspect');
    setShowDeepDive(true);
    setDeepDiveLoading(true);
    setDeepDive(null);
    try {
      const result = await generateAspectDeepDive(
        aspect.planet1, aspect.planet2, aspect.type, aspect.orb, userProfile?.id
      );
      setDeepDive({ ...result, planet1: aspect.planet1, planet2: aspect.planet2, aspectType: aspect.type, orb: aspect.orb, color: aspect.color });
      haptic.light();
      capture(EVENTS.CHART_DEEP_DIVE, { type: 'aspect', planet: aspect.planet1, planet2: aspect.planet2, aspect_type: aspect.type });
      trackEvent('deep_dive', { planet: aspect.planet1 }).catch(() => { });
      awardXP(userProfile?.id || 'default', 'deep_dive').catch(() => { });
      completeQuestAction('deep_dive_done').catch(() => { });
    } catch (e) {
      console.error('Aspect deep dive error:', e);
      setDeepDive({ hook: 'Unable to load insight right now.', planet1: aspect.planet1, planet2: aspect.planet2, aspectType: aspect.type });
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const handleHouseTap = async (house) => {
    setDeepDiveType('house');
    setShowDeepDive(true);
    setDeepDiveLoading(true);
    setDeepDive(null);
    try {
      // Find planets in this house
      const houseNum = parseInt(house.number);
      const planetsInHouse = (chart?.planets || []).filter(p => p.house === houseNum);
      const result = await generateHouseDeepDive(
        houseNum, house.sign, planetsInHouse, userProfile?.id
      );
      setDeepDive({ ...result, houseNumber: house.number, sign: house.sign, theme: house.theme, planetsInHouse });
      haptic.light();
      capture(EVENTS.CHART_DEEP_DIVE, { type: 'house', house: house.number, sign: house.sign });
      trackEvent('deep_dive', { planet: `House_${house.number}` }).catch(() => { });
      awardXP(userProfile?.id || 'default', 'deep_dive').catch(() => { });
      completeQuestAction('deep_dive_done').catch(() => { });
    } catch (e) {
      console.error('House deep dive error:', e);
      setDeepDive({ hook: 'Unable to load insight right now.', houseNumber: house.number, sign: house.sign });
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const planetPlacements = useMemo(() => {
    if (!chart?.planets) return [];
    return chart.planets
      .filter(p => p.name !== 'South Node') // skip duplicates
      .map(p => ({
        icon: PLANET_GLYPHS[p.name] || '★',
        planet: p.name === 'North Node' ? 'N. NODE' :
          p.name === 'Ascendant' ? 'RISING' :
            p.name === 'Midheaven' ? 'MIDHEAVEN' :
              p.name.toUpperCase(),
        sign: p.sign,
        deg: `${p.degree.toFixed(0)}° ${Math.round((p.degree % 1) * 60).toString().padStart(2, '0')}'`,
        house: p.house ? (HOUSE_FRIENDLY[p.house]?.name || `House ${toRoman(p.house)}`) : '',
        houseNum: p.house,
        isRetrograde: p.isRetrograde,
        name: p.name,
      }));
  }, [chart]);

  const aspectList = useMemo(() => {
    if (!chart?.aspects) return [];
    return chart.aspects.slice(0, 20).map(a => ({
      planet1: a.planet1,
      planet2: a.planet2,
      type: a.type,
      orb: a.orb?.toFixed(1),
      color: ASPECT_COLORS[a.type] || T.stone,
    }));
  }, [chart]);

  const houseList = useMemo(() => {
    if (!chart?.houses) return [];
    return Object.entries(chart.houses).slice(0, 12).map(([num, h]) => ({
      number: num,
      sign: h.sign,
      degree: h.degree?.toFixed(0),
      theme: HOUSE_THEMES[parseInt(num)] || '',
    }));
  }, [chart]);

  // At-a-glance: Top 3 defining patterns from aspects
  const topPatterns = useMemo(() => {
    if (!chart?.aspects || !chart?.planets) return [];
    const PATTERN_LABELS = {
      'Sun-Moon': { Square: 'Your mind and heart are in constant tension — that\'s where your growth lives.', Opposition: 'You\'re pulled between who you are and what you feel. That\'s not a flaw — it\'s your depth.', Conjunction: 'Your identity and emotions are fused. You feel everything as deeply personal.', Trine: 'Your head and heart agree more than most. You trust yourself naturally.' },
      'Venus-Mars': { Conjunction: 'You love intensely and can\'t do halfway. Passion is your default.', Square: 'What you want and what you attract don\'t always match — and that tension is magnetic.', Opposition: 'You\'re drawn to people who challenge you. Easy love bores you.', Trine: 'Desire and affection flow together naturally. You know what you want in love.' },
      'Moon-Saturn': { Square: 'You never feel like enough, even when you are. That\'s Saturn testing your Moon.', Conjunction: 'Emotions meet discipline. You carry a heaviness others don\'t see.', Opposition: 'You oscillate between needing comfort and pushing it away.' },
      'Sun-Saturn': { Square: 'You hold yourself to impossible standards. The world respects you for it — but it costs you.', Conjunction: 'Discipline is woven into your identity. You were born old.', Opposition: 'Authority figures trigger something deep. You\'re learning to be your own.' },
      'Venus-Saturn': { Square: 'Love feels hard-won for you. You don\'t trust easily — and that\'s protective, not broken.', Conjunction: 'You take love seriously. Casual doesn\'t exist in your vocabulary.' },
      'Moon-Pluto': { Square: 'Your emotions are volcanic. You feel everything at maximum intensity.', Conjunction: 'You transform through emotional crisis. Every ending makes you stronger.', Opposition: 'Power dynamics in relationships are your core lesson.' },
      'Sun-Pluto': { Square: 'You\'re compelled to dig beneath surfaces. Superficial living isn\'t an option for you.', Conjunction: 'You radiate intensity. People are drawn to you and intimidated by you simultaneously.' },
    };
    const patterns = [];
    for (const a of chart.aspects) {
      const key1 = `${a.planet1}-${a.planet2}`;
      const key2 = `${a.planet2}-${a.planet1}`;
      const match = PATTERN_LABELS[key1]?.[a.type] || PATTERN_LABELS[key2]?.[a.type];
      if (match) {
        patterns.push({
          label: `${a.planet1} ${ASPECT_GLYPHS[a.type] || ''} ${a.planet2}`,
          type: a.type,
          text: match,
          color: ASPECT_COLORS[a.type] || T.stone,
        });
      }
      if (patterns.length >= 3) break;
    }
    return patterns;
  }, [chart]);

  // Element & modality balance
  const chartBalance = useMemo(() => {
    if (!chart?.planets) return null;
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    const modalities = { Cardinal: 0, Fixed: 0, Mutable: 0 };
    const ELEMENT_MAP = { Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire', Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth', Gemini: 'Air', Libra: 'Air', Aquarius: 'Air', Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water' };
    const MODALITY_MAP = { Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal', Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed', Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable' };
    const personal = chart.planets.filter(p => ['Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars'].includes(p.name));
    for (const p of personal) {
      if (p.sign && ELEMENT_MAP[p.sign]) elements[ELEMENT_MAP[p.sign]]++;
      if (p.sign && MODALITY_MAP[p.sign]) modalities[MODALITY_MAP[p.sign]]++;
    }
    const total = personal.length || 1;
    const topEl = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
    const topMod = Object.entries(modalities).sort((a, b) => b[1] - a[1])[0];
    return { elements, modalities, total, topElement: topEl, topModality: topMod };
  }, [chart]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!chart) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.heading, textAlign: 'center', marginBottom: 10 }}>No Chart Yet</Text>
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>Complete onboarding to generate your birth chart.</Text>
      </View>
    );
  }

  const sun = chart.planets?.find(p => p.name === 'Sun');
  const moon = chart.planets?.find(p => p.name === 'Moon');
  const rising = chart.planets?.find(p => p.name === 'Ascendant');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <LinearGradient colors={['#F4EFE3', '#F0EAD8', '#ECE3CB']} locations={[0, 0.5, 1]} style={styles.hero}>
          {/* Centered title + subtitle */}
          <Text style={styles.title}>Birth Chart</Text>
          <Text style={styles.heroSub}>
            {sun ? `${sun.sign} Sun` : ''}
            {moon ? ` · ${moon.sign} Moon` : ''}
            {rising ? ` · ${rising.sign} Rising` : ''}
          </Text>

          {/* Big 3 — centered row with dividers */}
          {(sun || moon || rising) && (
            <View style={styles.big3Row}>
              {sun && <View style={styles.big3Item}>
                <Text style={styles.big3Glyph}>☉</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.big3Sign}>{sun.sign}</Text>
                  <CosmicTooltip id="sun_sign" size={12} />
                </View>
                <Text style={styles.big3Label}>SUN</Text>
              </View>}
              {moon && <View style={[styles.big3Item, styles.big3Divider]}>
                <Text style={styles.big3Glyph}>☽</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.big3Sign}>{moon.sign}</Text>
                  <CosmicTooltip id="moon_sign" size={12} />
                </View>
                <Text style={styles.big3Label}>MOON</Text>
              </View>}
              {rising && <View style={styles.big3Item}>
                <Text style={styles.big3Glyph}>↑</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Text style={styles.big3Sign}>{rising.sign}</Text>
                  <CosmicTooltip id="rising_sign" size={12} />
                </View>
                <Text style={styles.big3Label}>RISING</Text>
              </View>}
            </View>
          )}

          {/* Share My Chart */}
          <TouchableOpacity style={styles.shareChartBtn} activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Share my chart"
            onPress={async () => {
            haptic.light();
            await shareBigThree(`My cosmic identity: ${sun?.sign} Sun · ${moon?.sign} Moon · ${rising?.sign} Rising`);
            trackEvent('share');
            awardXP(userProfile?.id, 'share');
          }}>
            <Text style={styles.shareChartText}>Share My Chart</Text>
          </TouchableOpacity>

          {/* Chart Wheel — inside dark hero */}
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <ChartWheel size={280} planets={chart.planets} aspects={chart.aspects} />
          </View>
        </LinearGradient>

        {/* Floating tab pill — overlaps hero bottom edge */}
        <View style={styles.chartTabWrap}>
          <View style={[styles.chartTabBar, { backgroundColor: isDark ? colors.card : colors.bg, borderColor: isDark ? colors.border : 'rgba(0,0,0,0.04)' }]}>
            {tabs.filter((t) => {
              if (t === 'Aspects' && !detailedMode) return false;
              return true;
            }).map((t) => (
              <TouchableOpacity key={t} style={[styles.chartTab, tabs.indexOf(t) === tab && styles.chartTabOn]}
                accessibilityRole="tab"
                accessibilityLabel={t}
                accessibilityState={{ selected: tabs.indexOf(t) === tab }}
                onPress={() => setTab(tabs.indexOf(t))}>
                <Text style={[styles.chartTabText, { color: colors.textSecondary }, tabs.indexOf(t) === tab && styles.chartTabTextOn]}>{t}</Text>
              </TouchableOpacity>
            ))}
            {/* Depth toggle */}
            <TouchableOpacity
              style={[styles.depthToggle, detailedMode && styles.depthToggleActive, { marginLeft: 'auto' }]}
              activeOpacity={0.7}
              accessibilityRole="switch"
              accessibilityLabel="Detailed mode"
              accessibilityState={{ checked: !!detailedMode }}
              onPress={() => { haptic.light(); setDetailedMode(prev => !prev); }}>
              <Text style={[styles.depthToggleText, detailedMode && styles.depthToggleTextActive]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {detailedMode ? '⚙️' : '✦'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guide header */}
        {tab === 0 && (
          <Text style={[styles.guideHeader, { color: colors.textSecondary }]}>Your birth chart reveals patterns, not fate.</Text>
        )}

        {/* At-a-Glance: Top Patterns + Element Balance (default collapsed) */}
        {tab === 0 && !showFullList && (
          <View style={styles.atGlanceSection}>
            {/* Top Patterns */}
            {topPatterns.length > 0 && (
              <View style={styles.atGlanceBlock}>
                <Text style={styles.atGlanceTitle}>WHY YOU DO THAT THING</Text>
                {topPatterns.map((p, i) => (
                  <View key={i} style={[styles.patternCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.patternHeader}>
                      <View style={[styles.patternDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.patternLabel, { color: colors.heading }]}>{p.label}</Text>
                      <Text style={[styles.patternType, { color: p.color }]}>{p.type}</Text>
                    </View>
                    <Text style={[styles.patternText, { color: colors.text }]}>{p.text}</Text>
                    {/* Bridge: pattern → Chat */}
                    <TouchableOpacity
                      style={{ marginTop: 8, alignSelf: 'flex-start' }}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('Ask', { initialMessage: `Tell me more about my ${p.label} aspect. ${p.text} How does this play out in my daily life and relationships?` })}>
                      <Text style={{ fontSize: 11, fontFamily: FONTS.sansMedium, color: T.gold }}>Ask Celestia about this →</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Element & Modality Balance */}
            {chartBalance && (
              <View style={styles.atGlanceBlock}>
                <Text style={styles.atGlanceTitle}>YOUR ELEMENTAL BALANCE</Text>
                <View style={styles.balanceRow}>
                  {Object.entries(chartBalance.elements).map(([el, count]) => {
                    const icons = { Fire: '🔥', Earth: '🌿', Air: '💨', Water: '🌊' };
                    const pct = Math.round((count / chartBalance.total) * 100);
                    return (
                      <View key={el} style={styles.balanceItem}>
                        <Text style={styles.balanceIcon}>{icons[el]}</Text>
                        <View style={[styles.balanceBarTrack, { backgroundColor: isDark ? colors.cardAlt : '#F0E8DA' }]}>
                          <View style={[styles.balanceBarFill, { height: `${pct}%` }]} />
                        </View>
                        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{el}</Text>
                        <Text style={[styles.balancePct, { color: colors.heading }]}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.balanceSummary}>
                  {chartBalance.topElement[0]} dominant · {chartBalance.topModality[0]} energy
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.showFullBtn, { backgroundColor: colors.cardAlt }]} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="See all placements"
              onPress={() => setShowFullList(true)}>
              <Text style={[styles.showFullBtnText, { color: colors.heading }]}>See All Placements →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Toggle back to at-a-glance */}
        {tab === 0 && showFullList && (
          <TouchableOpacity style={styles.atGlanceToggle} activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to at-a-glance view"
            onPress={() => setShowFullList(false)}>
            <Text style={styles.atGlanceToggleText}>← Back to At-a-Glance</Text>
          </TouchableOpacity>
        )}

        {/* Unlock progress bar removed — breaks chart immersion */}

        <View style={styles.list}>
          {/* ALL planets visible — Mia sees her entire chart. Deep dive is what's gated, not the list. */}
          {tab === 0 && showFullList && planetPlacements.map((p, i) => {
            const deepDiveLocked = !isPro && !unlockedPlanets.includes(p.name);

            return (
              <TouchableOpacity key={i} style={[styles.plrow, { borderBottomColor: colors.divider }]} activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${p.planet}${p.isRetrograde ? ' retrograde' : ''} in ${p.sign}, ${p.house}`}
                onPress={() => handlePlanetTap(p)}>
                <View style={[styles.plrowIcon, { backgroundColor: isDark ? colors.cardAlt : T.warm }]}>
                  <Text style={{ fontSize: 18 }}>{p.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.plrowPlanet, { color: colors.textSecondary }]}>
                    {p.planet}{p.isRetrograde ? ' ℞' : ''}
                  </Text>
                  <Text style={[styles.plrowSign, { color: colors.heading }]}>{p.sign}</Text>
                  {detailedMode && p.isRetrograde && (
                    <View style={styles.retroBadge}>
                      <Text style={styles.retroBadgeText}>RETROGRADE</Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {detailedMode && <Text style={[styles.plrowDeg, { color: colors.textSecondary }]}>{p.deg}</Text>}
                  <Text style={[styles.plrowHouse, { color: colors.textMuted }]}>{p.house}</Text>
                  {getTransitForPlanet(p.name) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.gold }} />
                      <Text style={{ fontSize: 7, fontFamily: FONTS.sansSemiBold, color: T.gold, letterSpacing: 1 }}>LIVE</Text>
                    </View>
                  )}
                </View>
                <CosmicTooltip id={p.name === 'Ascendant' ? 'rising_sign' : p.name === 'North Node' ? 'north_node' : p.name === 'South Node' ? 'south_node' : p.name.toLowerCase()} size={14} />
                <Text style={styles.plrowArrow}>›</Text>
              </TouchableOpacity>
            );
          })}

          {tab === 1 && aspectList.map((a, i) => (
            <TouchableOpacity key={i} style={[styles.plrow, { borderBottomColor: colors.divider }]} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${a.planet1} ${a.type} ${a.planet2}`}
              onPress={() => handleAspectTap(a)}>
              <View style={[styles.plrowIcon, { backgroundColor: a.color + '20' }]}>
                <Text style={{ fontSize: 16, color: a.color }}>{ASPECT_GLYPHS[a.type] || '⬡'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.plrowPlanet, { color: colors.textSecondary }]}>{a.planet1} — {a.planet2}</Text>
                {detailedMode ? (
                  <Text style={[styles.plrowSign, { fontSize: 14 }]}>{a.type} · {ASPECT_NATURE[a.type]}</Text>
                ) : (
                  <Text style={[styles.plrowSign, { fontSize: 14 }]}>{ASPECT_NATURE[a.type] || a.type}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {detailedMode && <Text style={{ fontSize: 11, color: colors.textSecondary }}>orb {a.orb}°</Text>}
                {detailedMode && <Text style={{ fontSize: 9, color: a.color, marginTop: 2 }}>{a.type}</Text>}
              </View>
              <CosmicTooltip id={a.type.toLowerCase()} size={14} />
              <Text style={styles.plrowArrow}>›</Text>
            </TouchableOpacity>
          ))}

          {tab === 2 && houseList.map((h, i) => {
            const friendly = HOUSE_FRIENDLY[parseInt(h.number)];
            const planetsHere = (chart?.planets || []).filter(p => p.house === parseInt(h.number));
            return (
              <TouchableOpacity key={i} style={[styles.plrow, { borderBottomColor: colors.divider }]} activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${friendly?.name || `House ${h.number}`}, ${h.sign}, ${h.theme}`}
                onPress={() => handleHouseTap(h)}>
                <View style={[styles.plrowIcon, { backgroundColor: planetsHere.length > 0 ? colors.navy : (isDark ? colors.cardAlt : T.warm) }]}>
                  <Text style={{ fontSize: 16 }}>{friendly?.emoji || toRoman(parseInt(h.number))}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.plrowPlanet, { color: colors.textSecondary }]}>{friendly?.name?.toUpperCase() || `HOUSE ${h.number}`}</Text>
                  <Text style={[styles.plrowSign, { fontSize: 13, color: colors.heading }]}>{h.sign} · {h.theme}</Text>
                  {detailedMode && h.degree && (
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>Cusp: {h.degree}° {h.sign}</Text>
                  )}
                  {planetsHere.length > 0 && (
                    <Text style={{ fontSize: 10, color: T.gold, marginTop: 2 }}>
                      {planetsHere.map(p => `${PLANET_GLYPHS[p.name] || '★'} ${p.name}`).join(' · ')}
                    </Text>
                  )}
                </View>
                <CosmicTooltip id={`house_${h.number}`} size={14} />
                <Text style={styles.plrowArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Deep Dive Modal — Planet / Aspect / House */}
      <Modal visible={showDeepDive} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.modalBg }}>
          <View style={[styles.ddHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.ddTitle, { color: colors.heading }]}>
              {deepDiveType === 'planet' && (
                `${deepDive?.planetName || 'Planet'} ${deepDive?.sign ? `in ${deepDive.sign}` : ''}`
              )}
              {deepDiveType === 'aspect' && (
                `${deepDive?.planet1 || ''} ${deepDive?.aspectType || ''} ${deepDive?.planet2 || ''}`
              )}
              {deepDiveType === 'house' && (
                `House ${deepDive?.houseNumber || ''} · ${deepDive?.sign || ''}`
              )}
            </Text>
            <TouchableOpacity onPress={() => setShowDeepDive(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close deep dive">
              <Text style={{ fontSize: 18, color: colors.textSecondary, padding: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Locked planet view */}
          {deepDive?.locked ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
              <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.heading, textAlign: 'center', marginBottom: 4 }}>
                {deepDive.planetName} in {deepDive.sign}
              </Text>
              {deepDive.house ? (
                <Text style={{ fontSize: 12, color: colors.gold, textAlign: 'center', marginBottom: 14 }}>{deepDive.house}</Text>
              ) : null}
              <Text style={{ fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 22, marginBottom: 16, paddingHorizontal: 10 }}>
                {deepDive.hook}
              </Text>
              {/* Teaser — what they'll get when unlocked */}
              <View style={{ backgroundColor: 'rgba(193,127,89,0.06)', borderLeftWidth: 3, borderLeftColor: '#C17F59', borderRadius: 12, padding: 14, width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 12.5, color: T.stone, lineHeight: 20, fontStyle: 'italic' }}>
                  {deepDive.teaser || `The full deep dive reveals patterns, blind spots, and the insight that makes you say "how does it know?"` }
                </Text>
              </View>
              {/* Unlock options */}
              <TouchableOpacity
                style={{ backgroundColor: colors.navy, borderRadius: 100, paddingVertical: 12, paddingHorizontal: 28, marginBottom: 10, width: '100%', alignItems: 'center' }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="See all your placements"
                onPress={() => { setShowDeepDive(false); /* V1: no paywall — just dismiss */ }}>
                <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: T.cream }}>See All Your Placements Now →</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
                or come back {deepDive.unlockDay === 1 ? 'tomorrow' : `in ${deepDive.unlockDay} days`} to unlock for free
              </Text>
              {unlockProgress && (
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <View style={[styles.unlockBarTrack, { width: 200 }]}>
                    <View style={[styles.unlockBarFill, { width: `${unlockProgress.percentage}%` }]} />
                  </View>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>{unlockProgress.unlocked}/{unlockProgress.total} deep dives unlocked</Text>
                </View>
              )}
            </View>
          ) : deepDiveLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12 }}>
                {deepDiveType === 'planet' ? 'Reading your placement...' :
                  deepDiveType === 'aspect' ? 'Interpreting the aspect...' :
                    'Exploring this house...'}
              </Text>
            </View>
          ) : deepDive ? (
            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>

              {/* ── PLANET DEEP DIVE ── */}
              {deepDiveType === 'planet' && (
                <>
                  {deepDive.house && (
                    <Text style={styles.ddHouseLabel}>HOUSE {toRoman(deepDive.house)}</Text>
                  )}
                  <AstroText text={deepDive.hook} style={[styles.ddHook, { color: colors.heading }]} />
                  {deepDive.definition && (
                    <View style={[styles.ddDefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <AstroText text={deepDive.definition} style={[styles.ddDefText, { color: colors.text }]} />
                    </View>
                  )}
                  {deepDive.traits && deepDive.traits.length > 0 && (
                    <View style={styles.ddTraits}>
                      <Text style={[styles.ddTraitsLabel, { color: colors.textSecondary }]}>KEY TRAITS</Text>
                      {deepDive.traits.map((t, i) => (
                        <Text key={i} style={[styles.ddTrait, { color: colors.text }]}>• {t}</Text>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* ── ASPECT DEEP DIVE ── */}
              {deepDiveType === 'aspect' && (
                <>
                  {/* Aspect nature badge */}
                  <View style={[styles.ddAspectBadge, { backgroundColor: (deepDive.color || T.gold) + '15', borderColor: (deepDive.color || T.gold) + '30' }]}>
                    <Text style={[styles.ddAspectBadgeText, { color: deepDive.color || T.gold }]}>
                      {ASPECT_GLYPHS[deepDive.aspectType] || '⬡'} {ASPECT_NATURE[deepDive.aspectType] || deepDive.aspectType} · orb {deepDive.orb}°
                    </Text>
                  </View>
                  <AstroText text={deepDive.hook} style={[styles.ddHook, { color: colors.heading }]} />

                  {deepDive.dynamic && (
                    <View style={[styles.ddDefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={styles.ddSectionLabel}>THE DYNAMIC</Text>
                      <AstroText text={deepDive.dynamic} style={[styles.ddDefText, { color: colors.text }]} />
                    </View>
                  )}

                  <View style={styles.ddAspectGrid}>
                    {deepDive.strength && (
                      <View style={[styles.ddAspectCard, { borderLeftColor: '#7EC8A0', backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.ddSectionLabel, { color: '#7EC8A0' }]}>STRENGTH</Text>
                        <AstroText text={deepDive.strength} style={[styles.ddDefText, { color: colors.text }]} />
                      </View>
                    )}
                    {deepDive.challenge && (
                      <View style={[styles.ddAspectCard, { borderLeftColor: '#E87878', backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.ddSectionLabel, { color: '#E87878' }]}>CHALLENGE</Text>
                        <AstroText text={deepDive.challenge} style={[styles.ddDefText, { color: colors.text }]} />
                      </View>
                    )}
                  </View>

                  {deepDive.advice && (
                    <View style={[styles.ddAdviceBox, { backgroundColor: colors.cardAlt }]}>
                      <Text style={styles.ddSectionLabel}>YOUR MOVE</Text>
                      <AstroText text={deepDive.advice} style={[styles.ddAdviceText, { color: colors.text }]} />
                    </View>
                  )}
                </>
              )}

              {/* ── HOUSE DEEP DIVE ── */}
              {deepDiveType === 'house' && (
                <>
                  {deepDive.theme && (
                    <Text style={styles.ddHouseLabel}>{deepDive.theme.toUpperCase()}</Text>
                  )}
                  <Text style={[styles.ddHook, { color: colors.heading }]}>{deepDive.hook}</Text>

                  {deepDive.meaning && (
                    <View style={[styles.ddDefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={styles.ddSectionLabel}>WHAT THIS HOUSE GOVERNS</Text>
                      <Text style={[styles.ddDefText, { color: colors.text }]}>{deepDive.meaning}</Text>
                    </View>
                  )}

                  {deepDive.signInfluence && (
                    <View style={[styles.ddDefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={styles.ddSectionLabel}>{deepDive.sign?.toUpperCase()} INFLUENCE</Text>
                      <Text style={[styles.ddDefText, { color: colors.text }]}>{deepDive.signInfluence}</Text>
                    </View>
                  )}

                  {/* Planets in house */}
                  {deepDive.planetsInHouse && deepDive.planetsInHouse.length > 0 && (
                    <View style={styles.ddHousePlanets}>
                      <Text style={styles.ddSectionLabel}>PLANETS HERE</Text>
                      <View style={styles.ddHousePlanetChips}>
                        {deepDive.planetsInHouse.map((p, i) => (
                          <View key={i} style={[styles.ddHousePlanetChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={styles.ddHousePlanetGlyph}>{PLANET_GLYPHS[p.name] || '★'}</Text>
                            <Text style={[styles.ddHousePlanetName, { color: colors.heading }]}>{p.name} in {p.sign}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {deepDive.planetsInfluence && (
                    <View style={[styles.ddDefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={styles.ddSectionLabel}>PLANETARY INFLUENCE</Text>
                      <Text style={[styles.ddDefText, { color: colors.text }]}>{deepDive.planetsInfluence}</Text>
                    </View>
                  )}

                  {deepDive.lifeLesson && (
                    <View style={[styles.ddAdviceBox, { backgroundColor: colors.cardAlt }]}>
                      <Text style={styles.ddSectionLabel}>LIFE LESSON</Text>
                      <Text style={[styles.ddAdviceText, { color: colors.text }]}>{deepDive.lifeLesson}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Shared: Quote card — tap to share */}
              {/* Bridge to Chat */}
              {deepDive && !deepDive.locked && (
                <View style={styles.ddBridgeStack}>
                  <TouchableOpacity style={styles.ddAskBtn} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Ask Celestia about this"
                    onPress={() => {
                      const q = deepDiveType === 'planet'
                        ? `Tell me more about my ${deepDive.planetName} in ${deepDive.sign}. What does it mean for my daily life?`
                        : deepDiveType === 'aspect'
                        ? `What does ${deepDive.planet1} ${deepDive.aspectType} ${deepDive.planet2} mean in my chart?`
                        : `Tell me about my ${deepDive.houseNumber ? 'House ' + deepDive.houseNumber : 'chart'} and what it means for me.`;
                      setShowDeepDive(false);
                      setTimeout(() => navigation.navigate('Ask', { initialMessage: q }), 300);
                    }}>
                    <Text style={styles.ddAskBtnIcon}>☽</Text>
                    <Text style={styles.ddAskBtnText}>Ask Celestia about this</Text>
                    <Text style={styles.ddBridgeArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>

                  {/* Bridge to Circle/Compatibility */}
                  <TouchableOpacity style={[styles.ddBridgeBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="See how this affects your relationships"
                    onPress={() => {
                      setShowDeepDive(false);
                      setTimeout(() => navigation.navigate('MainTabs', { screen: 'Connections' }), 300);
                    }}>
                    <Text style={styles.ddBridgeBtnIcon}>{'\u2661'}</Text>
                    <Text style={[styles.ddBridgeBtnText, { color: colors.heading }]}>See how this affects your relationships</Text>
                    <Text style={styles.ddBridgeArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>

                  {/* Bridge to Reports */}
                  <TouchableOpacity style={[styles.ddBridgeBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]} activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Open the deep-dive report"
                    onPress={() => {
                      setShowDeepDive(false);
                      setTimeout(() => navigation.navigate('MainTabs', { screen: 'Reports' }), 300);
                    }}>
                    <Text style={styles.ddBridgeBtnIcon}>{'\u2727'}</Text>
                    <Text style={[styles.ddBridgeBtnText, { color: colors.heading }]}>Get your full {deepDive.planetName || (deepDive.planet1 ? deepDive.planet1 + '-' + deepDive.planet2 : 'house')} deep-dive report</Text>
                    <Text style={styles.ddBridgeArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Share This — planet placement text share */}
              {deepDiveType === 'planet' && deepDive && !deepDive.locked && (deepDive.share_quote || deepDive.hook) && (
                <TouchableOpacity
                  style={styles.ddShareThisBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Share this placement"
                  onPress={async () => {
                    haptic.light();
                    const quote = deepDive.share_quote || deepDive.hook;
                    const message = `My ${deepDive.planetName} is in ${deepDive.sign} \u2014 ${quote}\n\n\u2014 Celestia \u2726 celestia.app`;
                    try {
                      await Share.share({ message });
                      trackEvent('share').catch(() => {});
                      awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                      capture(EVENTS.CHART_DEEP_DIVE, { action: 'share_placement', planet: deepDive.planetName, sign: deepDive.sign });
                    } catch (e) {
                      // User cancelled or share failed
                    }
                  }}
                >
                  <Text style={styles.ddShareThisIcon}>{'\u2197'}</Text>
                  <Text style={styles.ddShareThisText}>Share This</Text>
                </TouchableOpacity>
              )}

              {deepDive.share_quote && (
                <TouchableOpacity activeOpacity={0.8} onPress={async () => {
                  haptic.light();
                  await shareQuote(deepDive.share_quote);
                  trackEvent('share');
                  awardXP(userProfile?.id, 'share');
                }}>
                  <View ref={quoteRef} collapsable={false}>
                    <LinearGradient colors={['#3A1A28', '#5A2840']} style={styles.ddQuoteCard}>
                      <Text style={styles.ddQuote}>"{deepDive.share_quote}"</Text>
                      <Text style={styles.ddShareHint}>Tap to share ↗</Text>
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* Offscreen share card for Big Three capture */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <BigThreeShareCard
          innerRef={bigThreeRef}
          name={userProfile?.name}
          sun={sun?.sign}
          moon={moon?.sign}
          rising={rising?.sign}
          archetype={archetype}
          comboRarity={comboRarity}
          elementCounts={archetype?.elementCounts}
        />
      </View>
    </View>
  );
}

const toRoman = (n) => {
  const nums = [1, 4, 5, 9, 10, 11, 12];
  const roms = ['I', 'IV', 'V', 'IX', 'X', 'XI', 'XII'];
  const idx = nums.indexOf(n);
  return idx !== -1 ? roms[idx] : String(n);
};

const styles = StyleSheet.create({
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingBottom: 40, alignItems: 'center', position: 'relative' },
  title: { fontFamily: FONTS.serif, fontSize: 32, color: T.ink, textAlign: 'center', letterSpacing: -0.4 },
  heroSub: { fontSize: 12, color: T.inkDim, marginTop: 4, textAlign: 'center', marginBottom: 16, fontFamily: FONTS.sans },
  housePill: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14 },
  housePillText: { fontSize: 11, color: 'rgba(250,248,242,0.48)' },
  depthToggle: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  depthToggleActive: { backgroundColor: 'rgba(200,168,75,0.15)', borderColor: 'rgba(200,168,75,0.3)' },
  depthToggleText: { fontSize: 10, fontFamily: FONTS.sansMedium, color: 'rgba(250,248,242,0.48)' },
  depthToggleTextActive: { color: T.gold },
  retroBadge: { backgroundColor: 'rgba(232,120,120,0.12)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 3 },
  retroBadgeText: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: '#E87878' },
  big3Row: { flexDirection: 'row', width: '100%', paddingHorizontal: 22, marginBottom: 14, justifyContent: 'center' },
  big3Item: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  big3Divider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.hairline },
  big3Glyph: { fontSize: 22, color: T.clay, marginBottom: 4 },
  big3Sign: { fontFamily: FONTS.serif, fontSize: 15, color: T.ink },
  big3Label: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, color: T.inkDim, marginTop: 2 },
  // Floating tab pill (same as HomeScreen)
  chartTabWrap: { marginTop: -24, paddingHorizontal: 20, marginBottom: 16, zIndex: 10 },
  chartTabBar: { flexDirection: 'row', borderRadius: 100, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6, borderWidth: 1 },
  chartTab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 100 },
  chartTabOn: { backgroundColor: T.navy },
  chartTabText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.stone },
  chartTabTextOn: { color: T.cream, fontFamily: FONTS.sansSemiBold },
  list: { paddingHorizontal: 20, paddingTop: 6 },
  plrow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E8DA' },
  plrowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.warm, alignItems: 'center', justifyContent: 'center' },
  plrowPlanet: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: T.stone, marginBottom: 2 },
  plrowSign: { fontFamily: FONTS.serif, fontSize: 17.5, color: T.navy },
  plrowDeg: { fontSize: 11, color: T.stone, marginBottom: 2 },
  plrowHouse: { fontSize: 10, color: '#C0B8A8' },
  plrowArrow: { fontSize: 16, color: '#D8D0C0', marginLeft: 4 },
  // Deep Dive Modal
  ddHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  ddTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  ddHouseLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 },
  ddHook: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, lineHeight: 28, marginBottom: 16 },
  ddDefBox: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  ddDefText: { fontSize: 14, color: T.ink, lineHeight: 22 },
  ddTraits: { marginBottom: 16 },
  ddTraitsLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 10 },
  ddTrait: { fontSize: 14, color: T.ink, lineHeight: 24, marginBottom: 4 },
  ddQuoteCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginTop: 8 },
  ddQuote: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.cream, textAlign: 'center', lineHeight: 24, fontStyle: 'italic' },
  ddSectionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 6 },
  // Aspect deep dive
  ddAspectBadge: { alignSelf: 'flex-start', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14, borderWidth: 1, marginBottom: 14 },
  ddAspectBadgeText: { fontSize: 12, fontFamily: FONTS.sansMedium },
  ddAspectGrid: { gap: 10, marginBottom: 12 },
  ddAspectCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: T.border },
  ddAdviceBox: { backgroundColor: T.warm, borderRadius: 14, padding: 14, marginBottom: 12 },
  ddAdviceText: { fontSize: 14, color: T.ink, lineHeight: 22, fontFamily: FONTS.sansMedium },
  // House deep dive
  ddHousePlanets: { marginBottom: 12 },
  ddHousePlanetChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  ddHousePlanetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'white', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: T.border },
  ddHousePlanetGlyph: { fontSize: 16 },
  ddHousePlanetName: { fontSize: 12, color: T.navy, fontFamily: FONTS.sansMedium },
  // Drip-feed unlock
  plrowLocked: { opacity: 0.7 },
  plrowLockedHint: { fontSize: 12, color: T.gold, fontFamily: FONTS.sansMedium },
  unlockBar: { paddingHorizontal: 20, paddingTop: 12 },
  unlockBarInner: { backgroundColor: T.warm, borderRadius: 12, padding: 14 },
  unlockBarTrack: { height: 6, backgroundColor: '#E8E2D8', borderRadius: 3, overflow: 'hidden' },
  unlockBarFill: { height: '100%', backgroundColor: T.gold, borderRadius: 3 },
  unlockBarText: { fontSize: 11, color: T.stone, marginTop: 8, textAlign: 'center' },
  // Share My Chart
  shareChartBtn: { backgroundColor: T.surface, borderWidth: 1, borderColor: 'rgba(92,36,52,0.18)', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 22, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  shareChartText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.clay, letterSpacing: 0.2 },
  ddShareHint: { fontSize: 10, color: 'rgba(200,168,75,0.5)', marginTop: 8 },
  // Guide header
  guideHeader: { fontSize: 12, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.stone, textAlign: 'center', paddingHorizontal: 40, marginTop: 14, marginBottom: 2 },
  // At-a-Glance
  atGlanceSection: { paddingHorizontal: 20, paddingTop: 12 },
  atGlanceBlock: { marginBottom: 16 },
  atGlanceTitle: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 10 },
  patternCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F0E8DA' },
  patternHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  patternDot: { width: 8, height: 8, borderRadius: 4 },
  patternLabel: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.navy, letterSpacing: 0.5 },
  patternType: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, textTransform: 'uppercase' },
  patternText: { fontSize: 13, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.ink, lineHeight: 20 },
  // Balance
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  balanceItem: { alignItems: 'center', width: 60 },
  balanceIcon: { fontSize: 16, marginBottom: 4 },
  balanceBarTrack: { width: 20, height: 48, backgroundColor: '#F0E8DA', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end', marginBottom: 4 },
  balanceBarFill: { width: '100%', backgroundColor: T.gold, borderRadius: 10 },
  balanceLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, color: T.stone, letterSpacing: 0.5 },
  balancePct: { fontSize: 10, fontFamily: FONTS.sansMedium, color: T.navy },
  balanceSummary: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.stone, textAlign: 'center' },
  showFullBtn: { backgroundColor: T.warm, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  showFullBtnText: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy },
  atGlanceToggle: { paddingHorizontal: 20, paddingVertical: 10 },
  atGlanceToggleText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },
  // Deep dive bridge stack
  ddBridgeStack: { gap: 8, marginTop: 12 },
  ddAskBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.navy, borderRadius: 12, padding: 12 },
  ddAskBtnIcon: { fontSize: 16, color: T.gold },
  ddAskBtnText: { flex: 1, fontSize: 13, fontFamily: FONTS.sansMedium, color: T.cream },
  ddBridgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.warm, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E8E2D8' },
  ddBridgeBtnIcon: { fontSize: 16, color: T.gold },
  ddBridgeBtnText: { flex: 1, fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy },
  ddBridgeArrow: { fontSize: 16, color: T.stone },
  // Share This button
  ddShareThisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16 },
  ddShareThisIcon: { fontSize: 15, color: T.gold },
  ddShareThisText: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.gold },
});
