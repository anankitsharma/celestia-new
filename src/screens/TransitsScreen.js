import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getTransitPlanets, getUpcomingEvents, isMercuryRetrograde } from '../services/astrologyService';
import { generateTransitInsight, generateMercuryRxInsight } from '../services/geminiService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { haptic } from '../services/hapticService';
import AstroText from '../components/AstroText';
import CosmicTooltip from '../components/CosmicTooltip';
import { useShareCard } from '../components/ShareCard';
import TransitShareCard from '../components/TransitShareCard';

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
  const { userProfile } = useUserProfile();
  const [expanded, setExpanded] = useState(0);
  const [transits, setTransits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState({}); // keyed by transit index
  const [aiLoading, setAiLoading] = useState({}); // keyed by transit index
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [shareTransitData, setShareTransitData] = useState(null);
  const [mercuryRxData, setMercuryRxData] = useState(null); // { sign, degree, isRetrograde }
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
    } catch {}

    trackEvent('sky_tab_open').catch(() => {});
    completeQuestAction('transits_checked').catch(() => {});
  }, [userProfile]);

  // Auto-scroll to Mercury Rx section when navigated from Home Rx banner
  useEffect(() => {
    if (route?.params?.highlightMercuryRx && mercuryRxData && rxScrollRef.current) {
      setTimeout(() => {
        rxScrollRef.current.measureLayout?.(undefined, () => {}, () => {});
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
    if (newIdx >= 0 && transits[newIdx]) {
      fetchAiInsight(transits[newIdx], newIdx);
    }
  }, [expanded, transits, fetchAiInsight]);

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
        ).then(result => setAiInsights(prev => ({ ...prev, 0: result }))).catch(() => {});
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
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#0E0E22', '#161230', '#101420']} locations={[0, 0.5, 1]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>Today's Sky</Text>
            <CosmicTooltip id="transit" size={16} color="rgba(250,248,242,0.4)" />
          </View>
          <Text style={styles.sub}>
            {loading
              ? 'Calculating transits…'
              : mercuryRxData
                ? `☿ Mercury Retrograde · ${transits.length} transit${transits.length !== 1 ? 's' : ''} active`
                : `${transits.length} active transit${transits.length !== 1 ? 's' : ''} affecting your chart`
            }
          </Text>
          {!loading && transits.length > 0 && (
            <View style={styles.skyStrip}>
              <View style={styles.skyStripItem}>
                <Text style={styles.skyStripGlyph}>{transits[0]?.icons?.[0] || '★'}</Text>
                <Text style={styles.skyStripLabel}>{transits[0]?.transitPlanet} in {transits[0]?.transitSign}</Text>
              </View>
              <View style={styles.skyStripDot} />
              <Text style={styles.skyStripAspect}>{transits[0]?.aspectType}</Text>
              <View style={styles.skyStripDot} />
              <View style={styles.skyStripItem}>
                <Text style={styles.skyStripGlyph}>{transits[0]?.icons?.[1] || '★'}</Text>
                <Text style={styles.skyStripLabel}>Natal {transits[0]?.natalPlanet}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* ── MERCURY RETROGRADE SECTION ── */}
        {mercuryRxData && (
          <View ref={rxScrollRef} style={styles.rxSection}>
            <LinearGradient colors={['#2A1408', '#1A0A04', '#0E0E22']} style={styles.rxGradient}>
              <View style={styles.rxHeader}>
                <Text style={styles.rxGlyph}>☿</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rxTitle}>Mercury Retrograde</Text>
                  <Text style={styles.rxPos}>
                    Mercury {mercuryRxData.sign} {mercuryRxData.degree.toFixed(0)}° ℞
                  </Text>
                </View>
                <View style={styles.rxActiveBadge}>
                  <Text style={styles.rxActiveBadgeText}>ACTIVE</Text>
                </View>
              </View>

              {rxInsightLoading ? (
                <View style={styles.rxLoadingRow}>
                  <ActivityIndicator size="small" color="#E8A040" />
                  <Text style={styles.rxLoadingText}>Reading your chart...</Text>
                </View>
              ) : rxInsight ? (
                <>
                  <Text style={styles.rxHeadline}>{rxInsight.headline}</Text>
                  <Text style={styles.rxExplainer}>{rxInsight.explanation}</Text>

                  <View style={styles.rxTipsGrid}>
                    {(rxInsight.tips || []).map((tip, idx) => (
                      <View key={idx} style={styles.rxTip}>
                        <Text style={styles.rxTipIcon}>{tip.icon || '✦'}</Text>
                        <Text style={styles.rxTipText}>{tip.text}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.rxAffect}>
                    <Text style={styles.rxAffectLabel}>HOW IT AFFECTS YOUR CHART</Text>
                    <Text style={styles.rxAffectText}>{rxInsight.chartImpact}</Text>
                  </View>

                  {rxInsight.hiddenGift && (
                    <View style={styles.rxGiftBox}>
                      <Text style={styles.rxGiftLabel}>THE HIDDEN GIFT</Text>
                      <Text style={styles.rxGiftText}>✧ {rxInsight.hiddenGift}</Text>
                    </View>
                  )}

                  {rxInsight.ritual && (
                    <View style={styles.rxRitualBox}>
                      <Text style={styles.rxRitualLabel}>RITUAL</Text>
                      <Text style={styles.rxRitualText}>✧ {rxInsight.ritual}</Text>
                    </View>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.rxExplainer}>
                    Mercury appears to move backward through {mercuryRxData.sign}, disrupting communication, technology, and travel. This is a natural cycle for review and reflection — not a time to panic.
                  </Text>
                  <View style={styles.rxAffect}>
                    <Text style={styles.rxAffectLabel}>HOW IT AFFECTS YOUR CHART</Text>
                    <Text style={styles.rxAffectText}>
                      Mercury retrograde in {mercuryRxData.sign} activates the areas of your chart ruled by {mercuryRxData.sign}. Look at your Mercury transits below — any Mercury aspects are amplified during this period.
                    </Text>
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.rxAskBtn} activeOpacity={0.7}
                onPress={() => navigation.navigate('AskAI', { initialMessage: `Mercury is retrograde in ${mercuryRxData.sign} right now. How does this affect my specific birth chart? What should I watch out for?` })}>
                <Text style={styles.rxAskBtnText}>Ask Celestia About Your Mercury ☽</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={T.gold} />
          </View>
        ) : transits.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 20, color: T.navy, textAlign: 'center', marginBottom: 8 }}>
              No strong transits today
            </Text>
            <Text style={{ fontFamily: FONTS.sansLight, fontSize: 13, color: T.stone, textAlign: 'center' }}>
              {userProfile?.chart ? 'The sky is quiet for your chart today.' : 'Complete onboarding to see your transits.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {transits.map((t, i) => (
              <View key={i} style={styles.tcard}>
                <TouchableOpacity style={styles.tcardHead} activeOpacity={0.7} onPress={() => handleExpand(i)}>
                  <View style={styles.ticons}>
                    {t.icons.map((ic, j) => (
                      <View key={j} style={[styles.ticon, j > 0 && { marginLeft: -9, backgroundColor: '#EDE6D4' }]}>
                        <Text style={{ fontSize: 16 }}>{ic}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taspect}>{t.aspect}</Text>
                    <Text style={styles.tplanets}>{t.planets}</Text>
                  </View>
                  <View style={[styles.torb, { borderColor: t.color + '60' }]}>
                    <Text style={[styles.torbText, { color: t.color }]}>{t.orb}</Text>
                  </View>
                  <CosmicTooltip id={t.aspectType?.toLowerCase()} size={14} />
                  <Text style={[styles.tchev, expanded === i && { transform: [{ rotate: '180deg' }] }]}>▾</Text>
                </TouchableOpacity>

                <View style={styles.tintensity}>
                  {[1,2,3,4,5].map(d => (
                    <View key={d} style={[styles.tidot, d <= t.intensity ? { backgroundColor: t.color } : styles.tidotOff]} />
                  ))}
                </View>

                {expanded === i && (
                  <View style={styles.tcardBody}>
                    {/* Natal context chip */}
                    {t.natalHouse && (
                      <View style={styles.tnatalChip}>
                        <Text style={styles.tnatalChipText}>
                          Activating House {t.natalHouse} · {t.natalSign} {t.natalPlanet}
                        </Text>
                      </View>
                    )}

                    <AstroText text={t.body} style={styles.tbodyTxt} />

                    {/* AI personalized insight */}
                    {aiLoading[i] && (
                      <View style={styles.taiLoadingRow}>
                        <ActivityIndicator size="small" color={T.gold} />
                        <Text style={styles.taiLoadingText}>Reading your chart...</Text>
                      </View>
                    )}
                    {aiInsights[i] && (
                      <View style={styles.taiSection}>
                        <Text style={styles.taiLabel}>PERSONALIZED FOR YOUR CHART</Text>
                        <AstroText text={aiInsights[i].personalMeaning} style={styles.taiText} />

                        {aiInsights[i].houseActivation && (
                          <View style={styles.taiHouseBox}>
                            <Text style={styles.taiHouseText}>✦ {aiInsights[i].houseActivation}</Text>
                          </View>
                        )}

                        <View style={styles.taiDoAvoid}>
                          <View style={[styles.taiDoAvoidCard, { borderLeftColor: '#7EC8A0' }]}>
                            <Text style={[styles.taiDoAvoidLabel, { color: '#7EC8A0' }]}>DO THIS</Text>
                            <Text style={styles.taiDoAvoidText}>{aiInsights[i].doThis}</Text>
                          </View>
                          <View style={[styles.taiDoAvoidCard, { borderLeftColor: '#E8A060' }]}>
                            <Text style={[styles.taiDoAvoidLabel, { color: '#E8A060' }]}>WATCH FOR</Text>
                            <Text style={styles.taiDoAvoidText}>{aiInsights[i].avoidThis}</Text>
                          </View>
                        </View>

                        {aiInsights[i]?.ritual && (
                          <View style={styles.taiRitualCard}>
                            <View style={styles.taiRitualHeader}>
                              <Text style={styles.taiRitualLabel}>RITUAL</Text>
                              {aiInsights[i].ritualDuration && (
                                <Text style={styles.taiRitualDuration}>{aiInsights[i].ritualDuration}</Text>
                              )}
                            </View>
                            <Text style={styles.taiRitualText}>✧ {aiInsights[i].ritual}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    <View style={styles.tbodyMeta}>
                      <Text style={styles.tbodyDur}>{t.duration}</Text>
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
                            trackEvent('share').catch(() => {});
                            awardXP(userProfile?.id || 'default', 'share').catch(() => {});
                          }, 100);
                        }}>
                          <Text style={styles.tbodyShareText}>Share ↗</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tbodyAi}
                          onPress={() => navigation.navigate('AskAI', { initialMessage: `Tell me about the transit ${t.aspect} happening right now. What does it mean for me?` })}>
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

        {/* ── UPCOMING EVENTS TIMELINE ── */}
        {upcomingEvents.length > 0 && (
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>Coming Up</Text>
            <Text style={styles.timelineSub}>Key cosmic events in the next 2 weeks</Text>
            <View style={styles.timeline}>
              {upcomingEvents.map((ev, i) => (
                <View key={i} style={styles.tlRow}>
                  <View style={styles.tlLeft}>
                    <Text style={styles.tlDate}>{ev.date}</Text>
                    <View style={styles.tlLine}>
                      <View style={[styles.tlDot, ev.type === 'lunation' && styles.tlDotLunation, ev.type === 'retrograde' && styles.tlDotRetro]} />
                      {i < upcomingEvents.length - 1 && <View style={styles.tlConnector} />}
                    </View>
                  </View>
                  <View style={styles.tlCard}>
                    <View style={styles.tlCardHeader}>
                      <Text style={styles.tlIcon}>{ev.icon}</Text>
                      <Text style={styles.tlCardTitle}>{ev.title}</Text>
                    </View>
                    <Text style={styles.tlCardDesc}>{ev.description}</Text>
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
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 32, position: 'relative', overflow: 'hidden', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(200,168,75,0.08)', left: -80, top: -40 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream, marginBottom: 5 },
  sub: { fontSize: 12.5, color: 'rgba(250,248,242,0.44)', marginBottom: 4 },
  skyStrip: { marginTop: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
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
  rxSection: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  rxGradient: { padding: 22 },
  rxHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  rxGlyph: { fontSize: 32, color: '#E8A040' },
  rxTitle: { fontFamily: FONTS.serifMedium, fontSize: 20, color: '#E8A040' },
  rxPos: { fontSize: 12, color: 'rgba(250,248,242,0.5)', marginTop: 2 },
  rxActiveBadge: { backgroundColor: 'rgba(232,120,40,0.15)', borderWidth: 1, borderColor: 'rgba(232,120,40,0.3)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 },
  rxActiveBadgeText: { fontSize: 9, fontFamily: FONTS.sansSemiBold, color: '#E8A040', letterSpacing: 1 },
  rxExplainer: { fontSize: 13, color: 'rgba(250,248,242,0.7)', lineHeight: 20, marginBottom: 18 },
  rxTipsGrid: { gap: 10, marginBottom: 18 },
  rxTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rxTipIcon: { fontSize: 14, marginTop: 1 },
  rxTipText: { flex: 1, fontSize: 12, color: 'rgba(250,248,242,0.6)', lineHeight: 18 },
  rxAffect: { backgroundColor: 'rgba(232,160,64,0.08)', borderWidth: 1, borderColor: 'rgba(232,160,64,0.15)', borderRadius: 14, padding: 14, marginBottom: 16 },
  rxAffectLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(232,160,64,0.6)', marginBottom: 8 },
  rxAffectText: { fontSize: 12, color: 'rgba(250,248,242,0.6)', lineHeight: 18 },
  rxAskBtn: { alignSelf: 'center', backgroundColor: 'rgba(232,160,64,0.15)', borderWidth: 1, borderColor: 'rgba(232,160,64,0.3)', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 20 },
  rxAskBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: '#E8A040' },
  rxLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  rxLoadingText: { fontSize: 12, color: 'rgba(250,248,242,0.5)' },
  rxHeadline: { fontFamily: FONTS.serifMedium, fontSize: 16, color: T.cream, marginBottom: 10, lineHeight: 22 },
  rxGiftBox: { backgroundColor: 'rgba(160,200,224,0.08)', borderWidth: 1, borderColor: 'rgba(160,200,224,0.15)', borderRadius: 14, padding: 14, marginBottom: 16 },
  rxGiftLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(160,200,224,0.6)', marginBottom: 8 },
  rxGiftText: { fontSize: 12, color: 'rgba(250,248,242,0.65)', lineHeight: 18 },
  rxRitualBox: { backgroundColor: 'rgba(176,136,240,0.08)', borderWidth: 1, borderColor: 'rgba(176,136,240,0.15)', borderRadius: 14, padding: 14, marginBottom: 16 },
  rxRitualLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(176,136,240,0.6)', marginBottom: 8 },
  rxRitualText: { fontSize: 12, color: 'rgba(250,248,242,0.65)', lineHeight: 18 },
});
