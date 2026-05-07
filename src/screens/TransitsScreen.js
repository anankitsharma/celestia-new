import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTransitPlanets, getUpcomingEvents, isMercuryRetrograde, getActiveCosmicWindows, getCosmicSeason } from '../services/astrologyService';
import { generateTransitInsight, generateMercuryRxInsight } from '../services/geminiService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { haptic } from '../services/hapticService';
import AstroText from '../components/AstroText';
import CosmicTooltip from '../components/CosmicTooltip';
import CelestiaMotif from '../components/CelestiaMotif';
import { useShareCard } from '../components/ShareCard';
import TransitShareCard from '../components/TransitShareCard';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import LockedFeatureOverlay from '../components/LockedFeatureOverlay';

const PLANET_GLYPHS = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇'
};

const ASPECT_TYPES = {
  Conjunction: { symbol: '☌', label: 'Conjunction', color: '#C8A84B' },
  Trine: { symbol: '△', label: 'Trine', color: '#7EC8A0' },
  Sextile: { symbol: '⚹', label: 'Sextile', color: '#A0C8E0' },
  Square: { symbol: '□', label: 'Square', color: '#E87878' },
  Opposition: { symbol: '☍', label: 'Opposition', color: '#E87878' },
};

const getIntensity = (orb, aspectType) => {
  const hard = ['Square', 'Opposition'].includes(aspectType);
  if (orb < 1) return 5;
  if (orb < 2) return 4;
  if (orb < 4) return 3;
  if (orb < 6) return 2;
  return 1;
};

export default function TransitsScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { isPro } = useRevenueCat();
  const { userProfile } = useUserProfile();
  const [expanded, setExpanded] = useState(0);
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState({}); // keyed by transit index
  const [aiLoading, setAiLoading] = useState({}); // keyed by transit index
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [shareTransitData, setShareTransitData] = useState(null);
  const [mercuryRxData, setMercuryRxData] = useState(null); // { sign, degree, isRetrograde }
  const [upcomingTransit, setUpcomingTransit] = useState(null);
  const [cosmicSeason, setCosmicSeason] = useState(null);
  const [rxInsight, setRxInsight] = useState(null);
  const [rxInsightLoading, setRxInsightLoading] = useState(false);
  const { cardRef: transitCardRef, captureAndShare: shareTransit } = useShareCard();
  const rxScrollRef = useRef(null);

  useEffect(() => {
    if (!userProfile?.chart) { setLoading(false); return; }
    buildTransits();
    try {
      const events = getUpcomingEvents(userProfile.chart, 14);
      setUpcomingEvents(events);
    } catch (e) { console.warn('Upcoming events error:', e); }

    // Detect Mercury Retrograde
    try {
      const today = new Date();
      if (isMercuryRetrograde(today)) {
        const planets = getTransitPlanets(today);
        const mercury = planets.find(p => p.name === 'Mercury');
        if (mercury) {
          setMercuryRxData(mercury);
          // Fetch personalized AI insight
          setRxInsightLoading(true);
          generateMercuryRxInsight(userProfile, mercury.sign, mercury.degree)
            .then(insight => { if (insight) setRxInsight(insight); })
            .catch(e => console.warn('Mercury Rx insight error:', e))
            .finally(() => setRxInsightLoading(false));
        }
      }
    } catch { }

    // Load cosmic season for narrative thread
    try {
      const season = getCosmicSeason(userProfile.chart, new Date());
      setCosmicSeason(season);
    } catch (e) { }

    // Find upcoming significant transit (next 7-14 days)
    try {
      const currentWindows = getActiveCosmicWindows(userProfile.chart, new Date());
      for (let d = 1; d <= 14; d++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + d);
        const futureWindows = getActiveCosmicWindows(userProfile.chart, futureDate);
        const newWindow = futureWindows.find(fw =>
          !currentWindows.some(cw => cw.planet === fw.planet && cw.natalPlanet === fw.natalPlanet)
        );
        if (newWindow) {
          const arrivalDate = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          setUpcomingTransit({ ...newWindow, arrivalDate, daysAway: d });
          break;
        }
      }
    } catch (e) { }

    trackEvent('sky_tab_open').catch(() => { });
    completeQuestAction('transits_checked').catch(() => { });
  }, [userProfile]);

  // Auto-scroll to Mercury Rx section when navigated from Home Rx banner
  useEffect(() => {
    if (route?.params?.highlightMercuryRx && mercuryRxData && rxScrollRef.current) {
      setTimeout(() => {
        rxScrollRef.current.measureLayout?.(undefined, () => { }, () => { });
      }, 500);
      navigation.setParams({ highlightMercuryRx: undefined });
    }
  }, [route?.params?.highlightMercuryRx, mercuryRxData]);

  const fetchAiInsight = useCallback(async (transit, index) => {
    if (aiInsights[index] || aiLoading[index]) return;
    setAiLoading(prev => ({ ...prev, [index]: true }));
    try {
      const natalP = userProfile?.chart?.planets?.find(p => p.name === transit.natalPlanet);
      const result = await generateTransitInsight(
        transit.transitPlanet, transit.transitSign,
        transit.natalPlanet, natalP?.sign || transit.natalSign,
        natalP?.house || null, transit.aspectType,
        transit.orbNum?.toFixed(1) || '3', userProfile?.id
      );
      setAiInsights(prev => ({ ...prev, [index]: result }));
    } catch (e) {
      console.error('Transit insight error:', e);
    } finally {
      setAiLoading(prev => ({ ...prev, [index]: false }));
    }
  }, [aiInsights, aiLoading, userProfile]);

  const handleExpand = useCallback((index) => {
    const newIdx = expanded === index ? -1 : index;
    setExpanded(newIdx);
    if (newIdx >= 0 && transits[newIdx] && isPro) {
      fetchAiInsight(transits[newIdx], newIdx);
    }
  }, [expanded, transits, fetchAiInsight, isPro]);

  const buildTransits = () => {
    try {
      const today = new Date();
      const skyPlanets = getTransitPlanets(today);
      const natalPlanets = userProfile.chart.planets || [];

      // Find aspects between transit planets and natal planets
      const found = [];
      const ASPECTS = [
        { type: 'Conjunction', angle: 0, orb: 8 },
        { type: 'Trine', angle: 120, orb: 7 },
        { type: 'Sextile', angle: 60, orb: 6 },
        { type: 'Square', angle: 90, orb: 7 },
        { type: 'Opposition', angle: 180, orb: 8 },
      ];

      skyPlanets.forEach(tp => {
        natalPlanets.forEach(np => {
          if (np.name === 'South Node') return;
          let diff = Math.abs(tp.absDegree - np.absDegree);
          if (diff > 180) diff = 360 - diff;

          for (const asp of ASPECTS) {
            const orb = Math.abs(diff - asp.angle);
            if (orb <= asp.orb) {
              const aspCfg = ASPECT_TYPES[asp.type];
              found.push({
                icons: [PLANET_GLYPHS[tp.name] || '★', PLANET_GLYPHS[np.name] || '★'],
                aspect: `${tp.name} ${asp.type.toLowerCase()} ${np.name === 'Ascendant' ? 'Rising' : np.name}`,
                planets: `${tp.sign} ${tp.degree.toFixed(0)}° → ${np.sign} ${np.degree.toFixed(0)}°`,
                orb: `${Math.floor(orb)}° ${Math.round((orb % 1) * 60).toString().padStart(2, '0')}'`,
                orbNum: orb,
                intensity: getIntensity(orb, asp.type),
                aspectType: asp.type,
                color: aspCfg.color,
                transitPlanet: tp.name,
                transitSign: tp.sign,
                natalPlanet: np.name,
                natalSign: np.sign,
                natalHouse: np.house,
                body: getTransitDescription(tp.name, np.name, asp.type),
                duration: getTransitDuration(tp.name),
              });
              break;
            }
          }
        });
      });

      // Sort by intensity (tightest orbs first)
      found.sort((a, b) => a.orbNum - b.orbNum);
      const top = found.slice(0, 8);
      setTransits(top);
      // Auto-fetch AI insight for first (expanded) transit
      if (top.length > 0) {
        const t = top[0];
        const natalP = userProfile?.chart?.planets?.find(p => p.name === t.natalPlanet);
        generateTransitInsight(
          t.transitPlanet, t.transitSign, t.natalPlanet, natalP?.sign || t.natalSign,
          natalP?.house || null, t.aspectType, t.orbNum?.toFixed(1) || '3', userProfile?.id
        ).then(result => setAiInsights(prev => ({ ...prev, 0: result }))).catch(() => { });
      }
    } catch (e) {
      console.error('Transit calculation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const getTransitDescription = (transit, natal, aspectType) => {
    const hard = ['Square', 'Opposition'].includes(aspectType);
    const descriptions = {
      'Moon': hard
        ? `Emotional friction with your natal ${natal}. Feelings are heightened — avoid reactive decisions and give yourself space to process.`
        : `Your intuition flows beautifully with your natal ${natal}. Trust your gut feelings and lean into emotional intelligence today.`,
      'Sun': hard
        ? `Your core identity feels challenged by your natal ${natal}. An opportunity to refine your sense of self through pressure.`
        : `Your essence harmonizes with your natal ${natal}, bringing clarity and confidence. Express your authentic self boldly.`,
      'Mercury': hard
        ? `Communication challenges with your natal ${natal}. Think carefully before speaking — miscommunications are possible.`
        : `Mental clarity and sharp thinking align with your natal ${natal}. Excellent time for important conversations and decisions.`,
      'Venus': hard
        ? `Relationship tension touches your natal ${natal}. Values may clash — use this as an opportunity to deepen understanding.`
        : `Love and beauty flow through your natal ${natal}. Social opportunities, aesthetic pleasures, and heart connections are favored.`,
      'Mars': hard
        ? `Assertive energy clashes with your natal ${natal}. Channel this dynamic tension into productive action, not conflict.`
        : `Motivated energy activates your natal ${natal}. Drive, passion, and the courage to act on your desires are amplified.`,
      'Jupiter': `Expansive Jupiter opens doors through your natal ${natal}. Growth, luck, and abundance are flowing — say yes to opportunities.`,
      'Saturn': hard
        ? `Saturn demands discipline from your natal ${natal}. Face responsibilities head-on — this builds lasting foundations.`
        : `Saturn's wisdom steadies your natal ${natal}. Hard work pays off and commitments made now carry lasting weight.`,
    };
    return descriptions[transit] || `${transit} ${aspectType.toLowerCase()} your natal ${natal} brings shifts and insights worth noting.`;
  };

  const getTransitDuration = (planet) => {
    const durations = {
      Moon: 'Active ~12 hours', Sun: 'Active ~3 days',
      Mercury: 'Active ~1 day', Venus: 'Active ~2 days',
      Mars: 'Active ~4 days', Jupiter: 'Active ~3 weeks',
      Saturn: 'Active ~5 weeks', Uranus: 'Active ~2 months',
      Neptune: 'Active ~3 months', Pluto: 'Active ~6 months',
    };
    return durations[planet] || 'Active several days';
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {(() => {
          // Hero gradient mirrors HomeScreenV2's sky card so the Today's Sky
          // detail screen visually continues from the card the user tapped:
          // cool-blue cream wash in light mode, burgundy ramp in dark.
          const heroColors = isDark
            ? ['#3A1A28', '#5A2840', '#1F0F18']
            : ['#E0E8F2', '#F2F4F8', '#FAF6EE'];
          const heroFg = isDark ? T.cream : '#1A1410';
          const heroFgMuted = isDark ? 'rgba(250,248,242,0.65)' : 'rgba(26,20,16,0.62)';
          const heroFgSoft = isDark ? 'rgba(250,248,242,0.45)' : 'rgba(26,20,16,0.45)';
          const heroFgWarm = isDark ? 'rgba(250,248,242,0.7)' : 'rgba(26,20,16,0.62)';
          const tooltipFg = isDark ? 'rgba(250,248,242,0.4)' : 'rgba(26,20,16,0.45)';
          const stripBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
          const stripBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,20,16,0.06)';
          const seasonBg = isDark ? 'rgba(200,168,75,0.1)' : 'rgba(254,217,184,0.5)';
          const iconBtnBg = isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF';
          const iconBtnBorder = isDark ? 'transparent' : 'rgba(26,20,16,0.06)';
          const motifBg = isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF';
          const motifBorder = isDark ? 'rgba(250,248,242,0.16)' : 'rgba(26,20,16,0.06)';
          const tagBg = isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)';
          const tagBorder = isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8';
          const today = new Date();
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
          const dateLabel = `${days[today.getDay()]} · ${months[today.getMonth()]} ${today.getDate()}`;
          return (
        <LinearGradient colors={heroColors} locations={[0, 0.55, 1]} style={styles.hero}>
          {isDark && <View style={styles.heroGlow} />}

          {/* Top bar — back + date + symmetry spacer */}
          <View style={styles.topBar}>
            {navigation.canGoBack() ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder, borderWidth: isDark ? 0 : 1 }]}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
                <Text style={[styles.iconBtnText, { color: heroFg }]}>‹</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 36 }} />}
            <Text style={[styles.heroDate, { color: heroFgSoft }]}>{dateLabel}</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Motif badge */}
          <View style={[styles.motifBadge, { backgroundColor: motifBg, borderColor: motifBorder }]}>
            <CelestiaMotif kind="sky" size={48} color={heroFg} />
          </View>

          {/* Tag pill */}
          <View style={[styles.tagPill, { backgroundColor: tagBg, borderColor: tagBorder }]}>
            <Text style={[styles.tagLabel, { color: heroFg }]}>TODAY'S SKY</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Text style={[styles.title, { color: heroFg }]}>Today's Sky</Text>
            <CosmicTooltip id="transit" size={16} color={tooltipFg} light={isDark} />
          </View>
          <Text style={[styles.sub, { color: heroFgMuted, textAlign: 'center' }]}>
            {loading
              ? 'Reading the sky…'
              : `${transits.length} chapter${transits.length !== 1 ? 's' : ''} unfolding in your sky`
            }
          </Text>
          {!loading && transits.length > 0 && (
            <View style={[styles.skyStrip, { backgroundColor: stripBg, borderColor: stripBorder }]}>
              <View style={styles.skyStripItem}>
                <Text style={[styles.skyStripGlyph, !isDark && { color: '#5C2434' }]}>{transits[0]?.icons?.[0] || '★'}</Text>
                <Text style={[styles.skyStripLabel, !isDark && { color: heroFg }]}>{transits[0]?.transitPlanet} in {transits[0]?.transitSign}</Text>
              </View>
              <View style={[styles.skyStripDot, !isDark && { backgroundColor: 'rgba(26,20,16,0.25)' }]} />
              <Text style={[styles.skyStripAspect, !isDark && { color: '#5C2434' }]}>{transits[0]?.aspectType}</Text>
              <View style={[styles.skyStripDot, !isDark && { backgroundColor: 'rgba(26,20,16,0.25)' }]} />
              <View style={styles.skyStripItem}>
                <Text style={[styles.skyStripGlyph, !isDark && { color: '#5C2434' }]}>{transits[0]?.icons?.[1] || '★'}</Text>
                <Text style={[styles.skyStripLabel, !isDark && { color: heroFg }]}>Natal {transits[0]?.natalPlanet}</Text>
              </View>
            </View>
          )}
          {cosmicSeason && (
            <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, marginTop: 10, backgroundColor: seasonBg, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: isDark ? 'transparent' : '#FED9B8' }}>
              <Text style={{ fontSize: 10, color: heroFg, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2 }}>YOUR SEASON</Text>
              <Text style={{ fontSize: 11, color: heroFgWarm, fontFamily: FONTS.sans }}>{cosmicSeason.planet} in {cosmicSeason.natalTarget} · {cosmicSeason.progress}%</Text>
            </View>
          )}
        </LinearGradient>
          );
        })()}

        {/* ── MERCURY RETROGRADE — compact notice ── */}
        {mercuryRxData && (
          <TouchableOpacity
            ref={rxScrollRef}
            style={[styles.rxCompact, { backgroundColor: isDark ? 'rgba(208,128,32,0.1)' : '#FFF8EE', borderColor: isDark ? 'rgba(208,128,32,0.2)' : 'rgba(232,160,64,0.2)' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Main', { screen: 'AskAI', params: { initialMessage: `Mercury is retrograde in ${mercuryRxData.sign} right now. How does this affect my specific birth chart? What should I watch out for?` } })}>
            <View style={styles.rxCompactLeft}>
              <Text style={styles.rxCompactGlyph}>☿</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.rxCompactTitle, { color: isDark ? '#E8A840' : '#8B6A28' }]}>Mercury Retrograde</Text>
                  <View style={styles.rxCompactBadge}>
                    <Text style={styles.rxCompactBadgeText}>℞</Text>
                  </View>
                </View>
                <Text style={[styles.rxCompactSub, { color: colors.textSecondary }]}>
                  {rxInsight?.headline || `Mercury in ${mercuryRxData.sign} ${mercuryRxData.degree.toFixed(0)}° — review & reflect period`}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: T.gold }}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={T.gold} />
          </View>
        ) : transits.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.heading, textAlign: 'center', marginBottom: 8 }}>
              No strong transits today
            </Text>
            <Text style={{ fontFamily: FONTS.sansLight, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
              {userProfile?.chart ? 'The sky is quiet for your chart today.' : 'Complete onboarding to see your transits.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {transits.map((t, i) => (
              <View key={i} style={[styles.tcard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.tcardHead} activeOpacity={0.7} onPress={() => handleExpand(i)}>
                  <View style={styles.ticons}>
                    {t.icons.map((ic, j) => (
                      <View key={j} style={[styles.ticon, { backgroundColor: colors.cardAlt }, j > 0 && { marginLeft: -9 }]}>
                        <Text style={{ fontSize: 16 }}>{ic}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taspect, { color: colors.heading }]}>{t.aspect}</Text>
                    <Text style={[styles.tplanets, { color: colors.textSecondary }]}>{t.planets}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.torb, { borderColor: t.color + '60' }]}>
                      <Text style={[styles.torbText, { color: t.color }]}>{t.orb}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: FONTS.sans, marginTop: 2 }}>
                      {parseFloat(t.orb) < 0.5 ? 'Exact now' : parseFloat(t.orb) < 2 ? 'Building \u00B7 peaks soon' : 'Separating \u00B7 integrating'}
                    </Text>
                  </View>
                  <CosmicTooltip id={t.aspectType?.toLowerCase()} size={14} />
                  <Text style={[styles.tchev, expanded === i && { transform: [{ rotate: '180deg' }] }]}>▾</Text>
                </TouchableOpacity>

                <View style={styles.tintensity}>
                  {[1, 2, 3, 4, 5].map(d => (
                    <View key={d} style={[styles.tidot, d <= t.intensity ? { backgroundColor: t.color } : { backgroundColor: isDark ? '#2A2740' : '#E8E0D0' }]} />
                  ))}
                </View>

                {expanded === i && (
                  <View style={[styles.tcardBody, { borderTopColor: colors.divider, backgroundColor: isDark ? colors.cardAlt : '#FDFAF6' }]}>
                    {/* Natal context chip */}
                    {t.natalHouse && (
                      <View style={[styles.tnatalChip, { backgroundColor: colors.cardAlt }]}>
                        <Text style={[styles.tnatalChipText, { color: colors.textSecondary }]}>
                          Activating House {t.natalHouse} · {t.natalSign} {t.natalPlanet}
                        </Text>
                      </View>
                    )}

                    <AstroText text={t.body} style={[styles.tbodyTxt, { color: colors.text }]} />

                    {/* AI personalized insight */}
                    {aiLoading[i] && (
                      <View style={styles.taiLoadingRow}>
                        <ActivityIndicator size="small" color={T.gold} />
                        <Text style={[styles.taiLoadingText, { color: colors.textSecondary }]}>Reading your chart...</Text>
                      </View>
                    )}
                    {!isPro ? (
                      <View style={{ marginTop: 10 }}>
                        <LockedFeatureOverlay
                          title="See How This Hits Your Chart"
                          description="Want to know exactly what this means for you? That's the deeper dive."
                          compact
                          onPress={() => navigation.navigate('Paywall', { source: 'transit_ai' })}
                        />
                      </View>
                    ) : (
                      aiInsights[i] && (
                        <View style={[styles.taiSection, { borderTopColor: colors.divider }]}>
                          <Text style={styles.taiLabel}>PERSONALIZED FOR YOUR CHART</Text>
                          <AstroText text={aiInsights[i].personalMeaning} style={[styles.taiText, { color: colors.text }]} />

                          {aiInsights[i].houseActivation && (
                            <View style={styles.taiHouseBox}>
                              <Text style={[styles.taiHouseText, { color: colors.text }]}>✦ {aiInsights[i].houseActivation}</Text>
                            </View>
                          )}

                          <View style={styles.taiDoAvoid}>
                            <View style={[styles.taiDoAvoidCard, { borderLeftColor: '#7EC8A0', backgroundColor: colors.card, borderColor: colors.border }]}>
                              <Text style={[styles.taiDoAvoidLabel, { color: '#7EC8A0' }]}>DO THIS</Text>
                              <Text style={[styles.taiDoAvoidText, { color: colors.text }]}>{aiInsights[i].doThis}</Text>
                            </View>
                            <View style={[styles.taiDoAvoidCard, { borderLeftColor: '#E8A060', backgroundColor: colors.card, borderColor: colors.border }]}>
                              <Text style={[styles.taiDoAvoidLabel, { color: '#E8A060' }]}>WATCH FOR</Text>
                              <Text style={[styles.taiDoAvoidText, { color: colors.text }]}>{aiInsights[i].avoidThis}</Text>
                            </View>
                          </View>

                          {aiInsights[i]?.ritual && (
                            <View style={styles.taiRitualCard}>
                              <View style={styles.taiRitualHeader}>
                                <Text style={styles.taiRitualLabel}>RITUAL</Text>
                                {aiInsights[i].ritualDuration && (
                                  <Text style={styles.taiRitualDuration}>{aiInsights[i].ritualDuration}</Text>
                                )}</View>
                              <Text style={[styles.taiRitualText, { color: colors.text }]}>✧ {aiInsights[i].ritual}</Text>
                            </View>
                          )}
                        </View>
                      )
                    )}

                    <View style={styles.tbodyMeta}>
                      <Text style={[styles.tbodyDur, { color: colors.textSecondary }]}>{t.duration}</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={styles.tbodyShare} onPress={async () => {
                          haptic.light();
                          const insight = aiInsights[i];
                          setShareTransitData({
                            aspect: t.aspect,
                            meaning: insight?.personalMeaning?.slice(0, 120),
                            ritual: insight?.ritual,
                            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
                          });
                          // Wait a tick for render, then capture
                          setTimeout(async () => {
                            await shareTransit(`${t.aspect} — ${t.body?.slice(0, 100) || ''}`);
                            trackEvent('share').catch(() => { });
                            awardXP(userProfile?.id || 'default', 'share').catch(() => { });
                          }, 100);
                        }}>
                          <Text style={styles.tbodyShareText}>Share ↗</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tbodyAi}
                          onPress={() => navigation.navigate('Main', { screen: 'AskAI', params: { initialMessage: `Tell me about the transit ${t.aspect} happening right now. What does it mean for me?` } })}>
                          <Text style={styles.tbodyAiText}>Ask Celestia ☽</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ── BUILDING TOWARD ── */}
        {upcomingTransit && (
          <View style={{ backgroundColor: colors.cardAlt, borderRadius: 14, padding: 16, marginTop: 12, marginHorizontal: 20, marginBottom: 14 }}>
            <Text style={{ fontSize: 9, letterSpacing: 2, color: '#C8A84B', fontFamily: FONTS.sansSemiBold, marginBottom: 8 }}>{'\u2605'} BUILDING TOWARD</Text>
            <Text style={{ fontSize: 15, color: colors.heading, fontFamily: FONTS.serif, marginBottom: 4 }}>
              {upcomingTransit.description}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: FONTS.sans }}>
              Arriving ~{upcomingTransit.arrivalDate} {'\u00B7'} {upcomingTransit.daysAway} days away
            </Text>
          </View>
        )}

        {/* ── UPCOMING EVENTS TIMELINE ── */}
        {upcomingEvents.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineTitle, { color: colors.heading }]}>Coming Up</Text>
            <Text style={[styles.timelineSub, { color: colors.textSecondary }]}>Key transits in the next 2 weeks</Text>
            <View style={styles.timeline}>
              {upcomingEvents.map((ev, i) => (
                <View key={i} style={styles.tlRow}>
                  <View style={styles.tlLeft}>
                    <Text style={[styles.tlDate, { color: colors.textSecondary }]}>{ev.date}</Text>
                    <View style={styles.tlLine}>
                      <View style={[styles.tlDot, ev.type === 'lunation' && styles.tlDotLunation, ev.type === 'retrograde' && styles.tlDotRetro]} />
                      {i < upcomingEvents.length - 1 && <View style={[styles.tlConnector, { backgroundColor: isDark ? '#2A2740' : '#E8E0D0' }]} />}
                    </View>
                  </View>
                  <View style={[styles.tlCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.tlCardHeader}>
                      <Text style={styles.tlIcon}>{ev.icon}</Text>
                      <Text style={[styles.tlCardTitle, { color: colors.heading }]}>{ev.title}</Text>
                    </View>
                    <Text style={[styles.tlCardDesc, { color: colors.textSecondary }]}>{ev.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Offscreen transit share card */}
      <View style={{ position: 'absolute', left: -9999 }}>
        <TransitShareCard
          innerRef={transitCardRef}
          aspect={shareTransitData?.aspect}
          meaning={shareTransitData?.meaning}
          ritual={shareTransitData?.ritual}
          date={shareTransitData?.date}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10, paddingHorizontal: 22, paddingBottom: 28, position: 'relative', overflow: 'hidden', alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(200,168,75,0.08)', left: -80, top: -40 },
  // Detail-screen header chrome (matches LifeAreaDetailScreen / TodayReadingDetailScreen)
  topBar: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 20, fontFamily: FONTS.editorial },
  heroDate: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 2.2 },
  motifBadge: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 14 },
  tagPill: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, marginBottom: 14 },
  tagLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 2.5 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream, marginBottom: 5, textAlign: 'center' },
  sub: { fontSize: 12.5, color: 'rgba(250,248,242,0.44)', marginBottom: 4 },
  skyStrip: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch' },
  skyStripItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skyStripGlyph: { fontSize: 16, color: T.gold },
  skyStripLabel: { fontSize: 11, color: 'rgba(250,248,242,0.6)', fontFamily: FONTS.sansMedium },
  skyStripDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(200,168,75,0.4)' },
  skyStripAspect: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, textTransform: 'uppercase' },
  list: { paddingHorizontal: 20, paddingTop: 14 },
  tcard: { backgroundColor: 'white', borderRadius: 18, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  tcardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, paddingHorizontal: 16 },
  ticons: { flexDirection: 'row' },
  ticon: { width: 36, height: 36, borderRadius: 18, backgroundColor: T.warm, alignItems: 'center', justifyContent: 'center' },
  taspect: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 2 },
  tplanets: { fontSize: 11, color: T.stone },
  torb: { borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  torbText: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansMedium },
  tchev: { fontSize: 12, color: '#C0B8A8', marginLeft: 4 },
  tintensity: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingBottom: 10 },
  tidot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.gold },
  tidotOff: { backgroundColor: '#E8E0D0' },
  tcardBody: { borderTopWidth: 1, borderTopColor: '#F5EEE4', padding: 15, paddingHorizontal: 16, backgroundColor: '#FDFAF6' },
  tbodyTxt: { fontSize: 13, lineHeight: 21, color: T.ink, marginBottom: 12 },
  tbodyMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tbodyDur: { fontSize: 11, color: T.stone },
  tbodyShare: { backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  tbodyShareText: { fontSize: 11, color: T.gold, fontFamily: FONTS.sansMedium },
  tbodyAi: { backgroundColor: T.navy, borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12 },
  tbodyAiText: { fontSize: 11, color: T.cream, fontFamily: FONTS.sansMedium },
  // Natal context chip
  tnatalChip: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', marginBottom: 10 },
  tnatalChipText: { fontSize: 10, fontFamily: FONTS.sansMedium, color: T.stone, letterSpacing: 0.3 },
  // AI insight section
  taiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  taiLoadingText: { fontSize: 11, color: T.stone },
  taiSection: { borderTopWidth: 1, borderTopColor: '#F0E8DA', paddingTop: 12, marginTop: 4, marginBottom: 12 },
  taiLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 8 },
  taiText: { fontSize: 13, color: T.ink, lineHeight: 21, marginBottom: 10 },
  taiHouseBox: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 10, padding: 10, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: T.gold },
  taiHouseText: { fontSize: 12.5, color: T.ink, lineHeight: 19 },
  taiDoAvoid: { gap: 8, marginBottom: 4 },
  taiDoAvoidCard: { backgroundColor: 'white', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderWidth: 1, borderColor: T.border },
  taiDoAvoidLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, marginBottom: 3 },
  taiDoAvoidText: { fontSize: 12.5, color: T.ink, lineHeight: 18 },
  taiRitualCard: { backgroundColor: 'rgba(160,128,224,0.08)', borderRadius: 10, padding: 10, borderLeftWidth: 3, borderLeftColor: '#A080E0', borderWidth: 1, borderColor: 'rgba(160,128,224,0.15)', marginTop: 8 },
  taiRitualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  taiRitualLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, color: '#A080E0' },
  taiRitualDuration: { fontSize: 9, color: '#A080E0', fontFamily: FONTS.sansMedium },
  taiRitualText: { fontSize: 12.5, color: T.ink, lineHeight: 18 },
  // Timeline
  timelineSection: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  timelineTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 4 },
  timelineSub: { fontSize: 12, color: T.stone, marginBottom: 16 },
  timeline: {},
  tlRow: { flexDirection: 'row', minHeight: 72 },
  tlLeft: { width: 60, alignItems: 'center', flexDirection: 'row' },
  tlDate: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.stone, width: 38, textAlign: 'right' },
  tlLine: { alignItems: 'center', marginLeft: 8, flex: 1 },
  tlDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.gold, marginTop: 4 },
  tlDotLunation: { backgroundColor: '#A080E0', width: 12, height: 12, borderRadius: 6 },
  tlDotRetro: { backgroundColor: '#E87878' },
  tlConnector: { width: 1.5, flex: 1, backgroundColor: '#E8E0D0', marginTop: 2 },
  tlCard: { flex: 1, backgroundColor: 'white', borderRadius: 14, padding: 12, marginLeft: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 },
  tlCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tlIcon: { fontSize: 16 },
  tlCardTitle: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.navy, flex: 1 },
  tlCardDesc: { fontSize: 12, color: T.stone, lineHeight: 18 },

  // Mercury Retrograde section
  // ── Mercury Rx compact card ──
  rxCompact: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#FFF8EE', borderWidth: 1, borderColor: 'rgba(232,160,64,0.2)', borderRadius: 14, overflow: 'hidden' },
  rxCompactLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  rxCompactGlyph: { fontSize: 22, color: '#D08020' },
  rxCompactTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: '#8B6A28' },
  rxCompactBadge: { backgroundColor: 'rgba(232,120,40,0.12)', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  rxCompactBadgeText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: '#D08020' },
  rxCompactSub: { fontSize: 12, color: T.stone, lineHeight: 17, marginTop: 2 },
  rxRitualLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(176,136,240,0.6)', marginBottom: 8 },
  rxRitualText: { fontSize: 12, color: 'rgba(250,248,242,0.65)', lineHeight: 18 },
});
