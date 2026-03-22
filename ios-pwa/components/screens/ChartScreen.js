'use client';
import React, { useState, useMemo, useEffect } from 'react';
import ChartWheel from '@/components/ChartWheel';
import { useUserProfile } from '@/lib/UserProfileContext';
import { T, HOUSE_THEMES, HOUSE_FRIENDLY, ZODIAC_SYMBOLS } from '@/lib/constants';
import { generatePlacementDeepDive, generateAspectDeepDive, generateHouseDeepDive } from '@/lib/geminiService';
import { getActiveCosmicWindows } from '@/lib/astrologyService';
import { useTheme } from '@/lib/ThemeContext';

const PLANET_GLYPHS = {
  Sun: '\u2609', Moon: '\u263d', Mercury: '\u263f', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
  Ascendant: '\u2191', Midheaven: '\u2191', 'North Node': '\u260a', 'South Node': '\u260b', Chiron: '\u26b7'
};

const ASPECT_COLORS = {
  Conjunction: '#C8A84B', Trine: '#7EC8A0', Sextile: '#A0C8E0',
  Square: '#E87878', Opposition: '#E87878'
};

const ASPECT_GLYPHS = {
  Conjunction: '\u260c', Trine: '\u25b3', Sextile: '\u26b9', Square: '\u25a1', Opposition: '\u260d'
};

const ASPECT_NATURE = {
  Conjunction: 'Fusion', Trine: 'Flow', Sextile: 'Boost',
  Square: 'Tension', Opposition: 'Tug of War'
};

// colors provided by useTheme() inside the component

const toRoman = (n) => {
  const nums = [1, 4, 5, 9, 10, 11, 12];
  const roms = ['I', 'IV', 'V', 'IX', 'X', 'XI', 'XII'];
  const idx = nums.indexOf(n);
  return idx !== -1 ? roms[idx] : String(n);
};

export default function ChartScreen({ onNavigate }) {
  const { colors, isDark } = useTheme();
  const isPro = false; // useRevenueCat removed
  const { userProfile, isLoading } = useUserProfile();

  const [tab, setTab] = useState(0);
  const [showFullList, setShowFullList] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const tabs = ['Planets', 'Aspects', 'Houses'];
  const [deepDive, setDeepDive] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [deepDiveType, setDeepDiveType] = useState('planet');

  const [unlockedPlanets, setUnlockedPlanets] = useState(['Sun', 'Moon', 'Ascendant', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'Chiron', 'Midheaven']);
  const [unlockProgress, setUnlockProgress] = useState(null);
  const [activeWindows, setActiveWindows] = useState([]);

  const chart = userProfile?.chart;

  const getTransitForPlanet = (planetName) => {
    return activeWindows.find(w =>
      w.natalPlanet === planetName ||
      (w.type === 'sign_transit' && w.targetSign &&
        userProfile?.chart?.planets?.find(p => p.name === planetName)?.sign === w.targetSign)
    );
  };

  useEffect(() => {
    try {
      const windows = getActiveCosmicWindows(userProfile?.chart, new Date());
      setActiveWindows(windows);
    } catch (e) { }
  }, []);

  const handlePlanetTap = async (planet) => {
    if (!planet.name || planet.name === 'South Node') return;
    setDeepDiveType('planet');
    setShowDeepDive(true);
    setDeepDiveLoading(true);
    setDeepDive(null);
    try {
      const p = chart?.planets?.find(pp => pp.name === planet.name);
      const transit = getTransitForPlanet(planet.name);
      const transitCtx = transit ? `${transit.planet} ${transit.aspect || 'transiting'} your natal ${planet.name} in ${p?.sign || planet.sign} (orb: ${transit.orb || '?'}\u00b0). ${transit.description || ''}` : null;
      const result = await generatePlacementDeepDive(
        planet.name, p?.sign || planet.sign, p?.house || 1, userProfile?.id, transitCtx
      );
      setDeepDive({ ...result, planetName: planet.name, sign: p?.sign, house: p?.house });
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
      const houseNum = parseInt(house.number);
      const planetsInHouse = (chart?.planets || []).filter(p => p.house === houseNum);
      const result = await generateHouseDeepDive(
        houseNum, house.sign, planetsInHouse, userProfile?.id
      );
      setDeepDive({ ...result, houseNumber: house.number, sign: house.sign, theme: house.theme, planetsInHouse });
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
      .filter(p => p.name !== 'South Node')
      .map(p => ({
        icon: PLANET_GLYPHS[p.name] || '\u2605',
        planet: p.name === 'North Node' ? 'N. NODE' :
          p.name === 'Ascendant' ? 'RISING' :
            p.name === 'Midheaven' ? 'MIDHEAVEN' :
              p.name.toUpperCase(),
        sign: p.sign,
        deg: `${p.degree.toFixed(0)}\u00b0 ${Math.round((p.degree % 1) * 60).toString().padStart(2, '0')}'`,
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
      'Sun-Moon': { Square: 'Your mind and heart are in constant tension \u2014 that\'s where your growth lives.', Opposition: 'You\'re pulled between who you are and what you feel. That\'s not a flaw \u2014 it\'s your depth.', Conjunction: 'Your identity and emotions are fused. You feel everything as deeply personal.', Trine: 'Your head and heart agree more than most. You trust yourself naturally.' },
      'Venus-Mars': { Conjunction: 'You love intensely and can\'t do halfway. Passion is your default.', Square: 'What you want and what you attract don\'t always match \u2014 and that tension is magnetic.', Opposition: 'You\'re drawn to people who challenge you. Easy love bores you.', Trine: 'Desire and affection flow together naturally. You know what you want in love.' },
      'Moon-Saturn': { Square: 'You never feel like enough, even when you are. That\'s Saturn testing your Moon.', Conjunction: 'Emotions meet discipline. You carry a heaviness others don\'t see.', Opposition: 'You oscillate between needing comfort and pushing it away.' },
      'Sun-Saturn': { Square: 'You hold yourself to impossible standards. The world respects you for it \u2014 but it costs you.', Conjunction: 'Discipline is woven into your identity. You were born old.', Opposition: 'Authority figures trigger something deep. You\'re learning to be your own.' },
      'Venus-Saturn': { Square: 'Love feels hard-won for you. You don\'t trust easily \u2014 and that\'s protective, not broken.', Conjunction: 'You take love seriously. Casual doesn\'t exist in your vocabulary.' },
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
      <div style={{ display: 'flex', flex: 1, backgroundColor: 'var(--c-bg)', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!chart) {
    return (
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: 'var(--c-bg)', alignItems: 'center', justifyContent: 'center', paddingLeft: 40, paddingRight: 40, height: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', textAlign: 'center', marginBottom: 10 }}>No Chart Yet</h2>
        <p style={{ fontFamily: 'var(--font-sans)', fontWeight: 300, fontSize: 14, color: 'var(--c-text-secondary)', textAlign: 'center' }}>Complete onboarding to generate your birth chart.</p>
      </div>
    );
  }

  const sun = chart.planets?.find(p => p.name === 'Sun');
  const moon = chart.planets?.find(p => p.name === 'Moon');
  const rising = chart.planets?.find(p => p.name === 'Ascendant');

  const shareChart = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: `My cosmic identity: ${sun?.sign} Sun \u00b7 ${moon?.sign} Moon \u00b7 ${rising?.sign} Rising\n\n\u2014 Celestia \u2726 celestia.app`,
        });
      } catch (e) { }
    }
  };

  const sharePlacement = async () => {
    if (!deepDive || !navigator.share) return;
    const quote = deepDive.share_quote || deepDive.hook;
    try {
      await navigator.share({
        text: `My ${deepDive.planetName} is in ${deepDive.sign} \u2014 ${quote}\n\n\u2014 Celestia \u2726 celestia.app`,
      });
    } catch (e) { }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--c-bg)', height: '100%' }}>
      <div className="scroll-container" style={{ flex: 1, overflow: 'auto', paddingBottom: 110 }}>
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.title}>Birth Chart</h1>
          <p style={styles.heroSub}>
            {sun ? `${sun.sign} Sun` : ''}
            {moon ? ` \u00b7 ${moon.sign} Moon` : ''}
            {rising ? ` \u00b7 ${rising.sign} Rising` : ''}
          </p>

          {/* Big 3 row */}
          {(sun || moon || rising) && (
            <div style={styles.big3Row}>
              {sun && <div style={styles.big3Item}>
                <span style={styles.big3Glyph}>{'\u2609'}</span>
                <span style={styles.big3Sign}>{sun.sign}</span>
                <span style={styles.big3Label}>SUN</span>
              </div>}
              {moon && <div style={{ ...styles.big3Item, ...styles.big3Divider }}>
                <span style={styles.big3Glyph}>{'\u263d'}</span>
                <span style={styles.big3Sign}>{moon.sign}</span>
                <span style={styles.big3Label}>MOON</span>
              </div>}
              {rising && <div style={styles.big3Item}>
                <span style={styles.big3Glyph}>{'\u2191'}</span>
                <span style={styles.big3Sign}>{rising.sign}</span>
                <span style={styles.big3Label}>RISING</span>
              </div>}
            </div>
          )}

          {/* Share My Chart */}
          <button style={styles.shareChartBtn} onClick={shareChart}>
            <span style={styles.shareChartText}>Share My Chart</span>
          </button>

          {/* Chart Wheel */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <ChartWheel size={280} planets={chart.planets} aspects={chart.aspects} />
          </div>
        </div>

        {/* Floating tab pill */}
        <div style={styles.chartTabWrap}>
          <div style={styles.chartTabBar}>
            {tabs.filter((t) => {
              if (t === 'Aspects' && !detailedMode) return false;
              return true;
            }).map((t) => (
              <button
                key={t}
                style={{ ...styles.chartTab, ...(tabs.indexOf(t) === tab ? styles.chartTabOn : {}) }}
                onClick={() => setTab(tabs.indexOf(t))}
              >
                <span style={{ ...styles.chartTabText, ...(tabs.indexOf(t) === tab ? styles.chartTabTextOn : {}) }}>{t}</span>
              </button>
            ))}
            {/* Depth toggle */}
            <button
              style={{ ...styles.depthToggle, ...(detailedMode ? styles.depthToggleActive : {}), marginLeft: 'auto' }}
              onClick={() => setDetailedMode(prev => !prev)}
            >
              <span style={{ ...styles.depthToggleText, ...(detailedMode ? styles.depthToggleTextActive : {}) }}>
                {detailedMode ? '\u2699\ufe0f' : '\u2726'}
              </span>
            </button>
          </div>
        </div>

        {/* Guide header */}
        {tab === 0 && (
          <p style={styles.guideHeader}>Your birth chart reveals patterns, not fate.</p>
        )}

        {/* At-a-Glance: Top Patterns + Element Balance (default collapsed) */}
        {tab === 0 && !showFullList && (
          <div style={styles.atGlanceSection}>
            {/* Top Patterns */}
            {topPatterns.length > 0 && (
              <div style={styles.atGlanceBlock}>
                <p style={styles.atGlanceTitle}>WHY YOU DO THAT THING</p>
                {topPatterns.map((p, i) => (
                  <div key={i} style={styles.patternCard}>
                    <div style={styles.patternHeader}>
                      <div style={{ ...styles.patternDot, backgroundColor: p.color }} />
                      <span style={styles.patternLabel}>{p.label}</span>
                      <span style={{ ...styles.patternType, color: p.color }}>{p.type}</span>
                    </div>
                    <p style={styles.patternText}>{p.text}</p>
                    <button
                      style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                      onClick={() => onNavigate?.('AskAI', { initialMessage: `Tell me more about my ${p.label} aspect. ${p.text} How does this play out in my daily life and relationships?` })}
                    >
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold }}>{'Ask Celestia about this \u2192'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Element & Modality Balance */}
            {chartBalance && (
              <div style={styles.atGlanceBlock}>
                <p style={styles.atGlanceTitle}>YOUR ELEMENTAL BALANCE</p>
                <div style={styles.balanceRow}>
                  {Object.entries(chartBalance.elements).map(([el, count]) => {
                    const icons = { Fire: '\ud83d\udd25', Earth: '\ud83c\udf3f', Air: '\ud83d\udca8', Water: '\ud83c\udf0a' };
                    const pct = Math.round((count / chartBalance.total) * 100);
                    return (
                      <div key={el} style={styles.balanceItem}>
                        <span style={styles.balanceIcon}>{icons[el]}</span>
                        <div style={styles.balanceBarTrack}>
                          <div style={{ ...styles.balanceBarFill, height: `${pct}%` }} />
                        </div>
                        <span style={styles.balanceLabel}>{el}</span>
                        <span style={styles.balancePct}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <p style={styles.balanceSummary}>
                  {chartBalance.topElement[0]}{' dominant \u00b7 '}{chartBalance.topModality[0]}{' energy'}
                </p>
              </div>
            )}

            <button style={styles.showFullBtn} onClick={() => setShowFullList(true)}>
              <span style={styles.showFullBtnText}>{'See All Placements \u2192'}</span>
            </button>
          </div>
        )}

        {/* Toggle back to at-a-glance */}
        {tab === 0 && showFullList && (
          <button style={styles.atGlanceToggle} onClick={() => setShowFullList(false)}>
            <span style={styles.atGlanceToggleText}>{'\u2190 Back to At-a-Glance'}</span>
          </button>
        )}

        <div style={styles.list}>
          {/* Planet placements */}
          {tab === 0 && showFullList && planetPlacements.map((p, i) => (
            <button key={i} style={styles.plrow} onClick={() => handlePlanetTap(p)}>
              <div style={styles.plrowIcon}>
                <span style={{ fontSize: 18 }}>{p.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={styles.plrowPlanet}>
                  {p.planet}{p.isRetrograde ? ' \u211e' : ''}
                </span>
                <span style={styles.plrowSign}>{p.sign}</span>
                {detailedMode && p.isRetrograde && (
                  <div style={styles.retroBadge}>
                    <span style={styles.retroBadgeText}>RETROGRADE</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {detailedMode && <span style={styles.plrowDeg}>{p.deg}</span>}
                <span style={styles.plrowHouse}>{p.house}</span>
                {getTransitForPlanet(p.name) && (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.gold }} />
                    <span style={{ fontSize: 7, fontFamily: 'var(--font-sans)', fontWeight: 600, color: T.gold, letterSpacing: 1 }}>LIVE</span>
                  </div>
                )}
              </div>
              <span style={styles.plrowArrow}>{'\u203a'}</span>
            </button>
          ))}

          {/* Aspects */}
          {tab === 1 && aspectList.map((a, i) => (
            <button key={i} style={styles.plrow} onClick={() => handleAspectTap(a)}>
              <div style={{ ...styles.plrowIcon, backgroundColor: a.color + '20' }}>
                <span style={{ fontSize: 16, color: a.color }}>{ASPECT_GLYPHS[a.type] || '\u2b21'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={styles.plrowPlanet}>{a.planet1}{' \u2014 '}{a.planet2}</span>
                {detailedMode ? (
                  <span style={{ ...styles.plrowSign, fontSize: 14 }}>{a.type}{' \u00b7 '}{ASPECT_NATURE[a.type]}</span>
                ) : (
                  <span style={{ ...styles.plrowSign, fontSize: 14 }}>{ASPECT_NATURE[a.type] || a.type}</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {detailedMode && <span style={{ fontSize: 11, color: 'var(--c-text-secondary)' }}>{'orb '}{a.orb}{'\u00b0'}</span>}
                {detailedMode && <span style={{ fontSize: 9, color: a.color, marginTop: 2 }}>{a.type}</span>}
              </div>
              <span style={styles.plrowArrow}>{'\u203a'}</span>
            </button>
          ))}

          {/* Houses */}
          {tab === 2 && houseList.map((h, i) => {
            const friendly = HOUSE_FRIENDLY[parseInt(h.number)];
            const planetsHere = (chart?.planets || []).filter(p => p.house === parseInt(h.number));
            return (
              <button key={i} style={styles.plrow} onClick={() => handleHouseTap(h)}>
                <div style={{ ...styles.plrowIcon, backgroundColor: planetsHere.length > 0 ? 'var(--c-bg)' : 'var(--c-card-bg-alpha)' }}>
                  <span style={{ fontSize: 16 }}>{friendly?.emoji || toRoman(parseInt(h.number))}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={styles.plrowPlanet}>{friendly?.name?.toUpperCase() || `HOUSE ${h.number}`}</span>
                  <span style={{ ...styles.plrowSign, fontSize: 13 }}>{h.sign}{' \u00b7 '}{h.theme}</span>
                  {detailedMode && h.degree && (
                    <span style={{ fontSize: 10, color: 'var(--c-text-secondary)', marginTop: 1, display: 'block' }}>Cusp: {h.degree}\u00b0 {h.sign}</span>
                  )}
                  {planetsHere.length > 0 && (
                    <span style={{ fontSize: 10, color: T.gold, marginTop: 2, display: 'block' }}>
                      {planetsHere.map(p => `${PLANET_GLYPHS[p.name] || '\u2605'} ${p.name}`).join(' \u00b7 ')}
                    </span>
                  )}
                </div>
                <span style={styles.plrowArrow}>{'\u203a'}</span>
              </button>
            );
          })}
        </div>
        <div style={{ height: 20 }} />
      </div>

      {/* Deep Dive Modal */}
      {showDeepDive && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.ddHeader}>
              <h2 style={styles.ddTitle}>
                {deepDiveType === 'planet' && (
                  `${deepDive?.planetName || 'Planet'} ${deepDive?.sign ? `in ${deepDive.sign}` : ''}`
                )}
                {deepDiveType === 'aspect' && (
                  `${deepDive?.planet1 || ''} ${deepDive?.aspectType || ''} ${deepDive?.planet2 || ''}`
                )}
                {deepDiveType === 'house' && (
                  `House ${deepDive?.houseNumber || ''} \u00b7 ${deepDive?.sign || ''}`
                )}
              </h2>
              <button onClick={() => setShowDeepDive(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <span style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}>{'\u2715'}</span>
              </button>
            </div>

            {/* Locked planet view */}
            {deepDive?.locked ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: 40, paddingRight: 40 }}>
                <span style={{ fontSize: 48, marginBottom: 16 }}>{'\ud83d\udd12'}</span>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', textAlign: 'center', marginBottom: 4 }}>
                  {deepDive.planetName} in {deepDive.sign}
                </h3>
                {deepDive.house && (
                  <p style={{ fontSize: 12, color: 'var(--c-gold)', textAlign: 'center', marginBottom: 14, margin: '0 0 14px 0' }}>{deepDive.house}</p>
                )}
                <p style={{ fontSize: 14, color: 'var(--c-text)', textAlign: 'center', lineHeight: '22px', marginBottom: 16, paddingLeft: 10, paddingRight: 10 }}>
                  {deepDive.hook}
                </p>
                <div style={{ backgroundColor: 'rgba(193,127,89,0.06)', borderLeft: '3px solid #C17F59', borderRadius: 12, padding: 14, width: '100%', marginBottom: 16 }}>
                  <p style={{ fontSize: 12.5, color: 'var(--c-text-secondary)', lineHeight: '20px', fontStyle: 'italic', margin: 0 }}>
                    {deepDive.teaser || 'The full deep dive reveals patterns, blind spots, and the insight that makes you say "how does it know?"'}
                  </p>
                </div>
                <button
                  style={{ backgroundColor: 'var(--c-bg)', borderRadius: 100, paddingTop: 12, paddingBottom: 12, paddingLeft: 28, paddingRight: 28, marginBottom: 10, width: '100%', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => setShowDeepDive(false)}
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--c-heading)' }}>{'See All Your Placements Now \u2192'}</span>
                </button>
                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', textAlign: 'center' }}>
                  or come back {deepDive.unlockDay === 1 ? 'tomorrow' : `in ${deepDive.unlockDay} days`} to unlock for free
                </p>
              </div>
            ) : deepDiveLoading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={styles.spinner} />
                <p style={{ fontSize: 14, color: 'var(--c-text-secondary)', marginTop: 12 }}>
                  {deepDiveType === 'planet' ? 'Reading your placement...' :
                    deepDiveType === 'aspect' ? 'Interpreting the aspect...' :
                      'Exploring this house...'}
                </p>
              </div>
            ) : deepDive ? (
              <div className="scroll-container" style={{ flex: 1, padding: 20, overflow: 'auto' }}>

                {/* PLANET DEEP DIVE */}
                {deepDiveType === 'planet' && (
                  <>
                    {deepDive.house && (
                      <p style={styles.ddHouseLabel}>HOUSE {toRoman(deepDive.house)}</p>
                    )}
                    <p style={styles.ddHook}>{deepDive.hook}</p>
                    {deepDive.definition && (
                      <div style={styles.ddDefBox}>
                        <p style={styles.ddDefText}>{deepDive.definition}</p>
                      </div>
                    )}
                    {deepDive.traits && deepDive.traits.length > 0 && (
                      <div style={styles.ddTraits}>
                        <p style={styles.ddTraitsLabel}>KEY TRAITS</p>
                        {deepDive.traits.map((t, i) => (
                          <p key={i} style={styles.ddTrait}>{'\u2022 '}{t}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ASPECT DEEP DIVE */}
                {deepDiveType === 'aspect' && (
                  <>
                    <div style={{ ...styles.ddAspectBadge, backgroundColor: (deepDive.color || T.gold) + '15', borderColor: (deepDive.color || T.gold) + '30' }}>
                      <span style={{ ...styles.ddAspectBadgeText, color: deepDive.color || T.gold }}>
                        {ASPECT_GLYPHS[deepDive.aspectType] || '\u2b21'}{' '}{ASPECT_NATURE[deepDive.aspectType] || deepDive.aspectType}{' \u00b7 orb '}{deepDive.orb}{'\u00b0'}
                      </span>
                    </div>
                    <p style={styles.ddHook}>{deepDive.hook}</p>

                    {deepDive.dynamic && (
                      <div style={styles.ddDefBox}>
                        <p style={styles.ddSectionLabel}>THE DYNAMIC</p>
                        <p style={styles.ddDefText}>{deepDive.dynamic}</p>
                      </div>
                    )}

                    <div style={styles.ddAspectGrid}>
                      {deepDive.strength && (
                        <div style={{ ...styles.ddAspectCard, borderLeftColor: '#7EC8A0' }}>
                          <p style={{ ...styles.ddSectionLabel, color: '#7EC8A0' }}>STRENGTH</p>
                          <p style={styles.ddDefText}>{deepDive.strength}</p>
                        </div>
                      )}
                      {deepDive.challenge && (
                        <div style={{ ...styles.ddAspectCard, borderLeftColor: '#E87878' }}>
                          <p style={{ ...styles.ddSectionLabel, color: '#E87878' }}>CHALLENGE</p>
                          <p style={styles.ddDefText}>{deepDive.challenge}</p>
                        </div>
                      )}
                    </div>

                    {deepDive.advice && (
                      <div style={styles.ddAdviceBox}>
                        <p style={styles.ddSectionLabel}>YOUR MOVE</p>
                        <p style={styles.ddAdviceText}>{deepDive.advice}</p>
                      </div>
                    )}
                  </>
                )}

                {/* HOUSE DEEP DIVE */}
                {deepDiveType === 'house' && (
                  <>
                    {deepDive.theme && (
                      <p style={styles.ddHouseLabel}>{deepDive.theme.toUpperCase()}</p>
                    )}
                    <p style={styles.ddHook}>{deepDive.hook}</p>

                    {deepDive.meaning && (
                      <div style={styles.ddDefBox}>
                        <p style={styles.ddSectionLabel}>WHAT THIS HOUSE GOVERNS</p>
                        <p style={styles.ddDefText}>{deepDive.meaning}</p>
                      </div>
                    )}

                    {deepDive.signInfluence && (
                      <div style={styles.ddDefBox}>
                        <p style={styles.ddSectionLabel}>{deepDive.sign?.toUpperCase()} INFLUENCE</p>
                        <p style={styles.ddDefText}>{deepDive.signInfluence}</p>
                      </div>
                    )}

                    {deepDive.planetsInHouse && deepDive.planetsInHouse.length > 0 && (
                      <div style={styles.ddHousePlanets}>
                        <p style={styles.ddSectionLabel}>PLANETS HERE</p>
                        <div style={styles.ddHousePlanetChips}>
                          {deepDive.planetsInHouse.map((p, i) => (
                            <div key={i} style={styles.ddHousePlanetChip}>
                              <span style={styles.ddHousePlanetGlyph}>{PLANET_GLYPHS[p.name] || '\u2605'}</span>
                              <span style={styles.ddHousePlanetName}>{p.name} in {p.sign}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {deepDive.planetsInfluence && (
                      <div style={styles.ddDefBox}>
                        <p style={styles.ddSectionLabel}>PLANETARY INFLUENCE</p>
                        <p style={styles.ddDefText}>{deepDive.planetsInfluence}</p>
                      </div>
                    )}

                    {deepDive.lifeLesson && (
                      <div style={styles.ddAdviceBox}>
                        <p style={styles.ddSectionLabel}>LIFE LESSON</p>
                        <p style={styles.ddAdviceText}>{deepDive.lifeLesson}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Bridge to Chat + Circle + Reports */}
                {deepDive && !deepDive.locked && (
                  <div style={styles.ddBridgeStack}>
                    <button style={styles.ddAskBtn} onClick={() => {
                      const q = deepDiveType === 'planet'
                        ? `Tell me more about my ${deepDive.planetName} in ${deepDive.sign}. What does it mean for my daily life?`
                        : deepDiveType === 'aspect'
                        ? `What does ${deepDive.planet1} ${deepDive.aspectType} ${deepDive.planet2} mean in my chart?`
                        : `Tell me about my ${deepDive.houseNumber ? 'House ' + deepDive.houseNumber : 'chart'} and what it means for me.`;
                      setShowDeepDive(false);
                      setTimeout(() => onNavigate?.('AskAI', { initialMessage: q }), 300);
                    }}>
                      <span style={styles.ddAskBtnIcon}>{'\u263d'}</span>
                      <span style={styles.ddAskBtnText}>Ask Celestia about this</span>
                      <span style={styles.ddBridgeArrow}>{'\u2192'}</span>
                    </button>

                    <button style={styles.ddBridgeBtn} onClick={() => {
                      setShowDeepDive(false);
                      setTimeout(() => onNavigate?.('Circle'), 300);
                    }}>
                      <span style={styles.ddBridgeBtnIcon}>{'\u2661'}</span>
                      <span style={styles.ddBridgeBtnText}>See how this affects your relationships</span>
                      <span style={styles.ddBridgeArrow}>{'\u2192'}</span>
                    </button>

                    <button style={styles.ddBridgeBtn} onClick={() => {
                      setShowDeepDive(false);
                      setTimeout(() => onNavigate?.('Reports'), 300);
                    }}>
                      <span style={styles.ddBridgeBtnIcon}>{'\u2727'}</span>
                      <span style={styles.ddBridgeBtnText}>Get your full {deepDive.planetName || (deepDive.planet1 ? deepDive.planet1 + '-' + deepDive.planet2 : 'house')} deep-dive report</span>
                      <span style={styles.ddBridgeArrow}>{'\u2192'}</span>
                    </button>
                  </div>
                )}

                {/* Share This */}
                {deepDiveType === 'planet' && deepDive && !deepDive.locked && (deepDive.share_quote || deepDive.hook) && (
                  <button style={styles.ddShareThisBtn} onClick={sharePlacement}>
                    <span style={styles.ddShareThisIcon}>{'\u2197'}</span>
                    <span style={styles.ddShareThisText}>Share This</span>
                  </button>
                )}

                {deepDive.share_quote && (
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0 }} onClick={sharePlacement}>
                    <div style={styles.ddQuoteCard}>
                      <p style={styles.ddQuote}>"{deepDive.share_quote}"</p>
                      <p style={styles.ddShareHint}>{'Tap to share \u2197'}</p>
                    </div>
                  </button>
                )}
                <div style={{ height: 40 }} />
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  hero: {
    paddingTop: 70,
    paddingBottom: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    background: 'linear-gradient(180deg, #0E0E22 0%, #1A1535 50%, #0F1628 100%)',
  },
  title: {
    fontFamily: 'var(--font-serif)',
    fontSize: 32,
    color: 'var(--c-heading)',
    textAlign: 'center',
    margin: 0,
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(250,248,242,0.45)',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  big3Row: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    paddingLeft: 22,
    paddingRight: 22,
    marginBottom: 14,
    justifyContent: 'center',
  },
  big3Item: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  big3Divider: {
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  big3Glyph: { fontSize: 22, color: T.gold, marginBottom: 4 },
  big3Sign: { fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-heading)' },
  big3Label: { fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.2, color: 'var(--c-text-muted)', marginTop: 2 },
  shareChartBtn: {
    backgroundColor: 'rgba(200,168,75,0.15)',
    border: '1px solid rgba(200,168,75,0.3)',
    borderRadius: 100,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 8,
    cursor: 'pointer',
  },
  shareChartText: { fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold },
  // Floating tab pill
  chartTabWrap: { marginTop: -24, paddingLeft: 20, paddingRight: 20, marginBottom: 16, zIndex: 10, position: 'relative' },
  chartTabBar: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 100,
    padding: 4,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    backgroundColor: 'var(--c-card-bg-alpha)',
    border: '1px solid var(--c-card-border-alpha)',
  },
  chartTab: {
    flex: 1,
    paddingTop: 11,
    paddingBottom: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  chartTabOn: { backgroundColor: 'var(--c-bg)' },
  chartTabText: { fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-text-secondary)' },
  chartTabTextOn: { color: 'var(--c-heading)', fontWeight: 600 },
  depthToggle: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 100,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 12,
    paddingRight: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  depthToggleActive: { backgroundColor: 'rgba(200,168,75,0.15)', borderColor: 'rgba(200,168,75,0.3)' },
  depthToggleText: { fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'rgba(250,248,242,0.48)' },
  depthToggleTextActive: { color: T.gold },
  guideHeader: {
    fontSize: 12,
    fontFamily: 'var(--font-serif)',
    fontStyle: 'italic',
    color: 'var(--c-text-secondary)',
    textAlign: 'center',
    paddingLeft: 40,
    paddingRight: 40,
    marginTop: 14,
    marginBottom: 2,
  },
  // At-a-Glance
  atGlanceSection: { paddingLeft: 20, paddingRight: 20, paddingTop: 12 },
  atGlanceBlock: { marginBottom: 16 },
  atGlanceTitle: { fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: T.gold, marginBottom: 10, margin: '0 0 10px 0' },
  patternCard: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    border: '1px solid var(--c-card-border-alpha)',
  },
  patternHeader: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  patternDot: { width: 8, height: 8, borderRadius: 4 },
  patternLabel: { fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-heading)', letterSpacing: 0.5 },
  patternType: { fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' },
  patternText: { fontSize: 13, fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--c-text)', lineHeight: '20px', margin: 0 },
  // Balance
  balanceRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  balanceItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 60 },
  balanceIcon: { fontSize: 16, marginBottom: 4 },
  balanceBarTrack: { width: 20, height: 48, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 10, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', marginBottom: 4 },
  balanceBarFill: { width: '100%', backgroundColor: T.gold, borderRadius: 10 },
  balanceLabel: { fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--c-text-secondary)', letterSpacing: 0.5 },
  balancePct: { fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-heading)' },
  balanceSummary: { fontSize: 11, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-text-secondary)', textAlign: 'center', margin: 0 },
  showFullBtn: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    width: '100%',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    border: 'none',
    cursor: 'pointer',
  },
  showFullBtnText: { fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-heading)' },
  atGlanceToggle: { paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, background: 'none', border: 'none', cursor: 'pointer' },
  atGlanceToggleText: { fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold },
  list: { paddingLeft: 20, paddingRight: 20, paddingTop: 6 },
  plrow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingTop: 12,
    paddingBottom: 12,
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--c-card-border-alpha)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  plrowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'var(--c-card-bg-alpha)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  plrowPlanet: { fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1, color: 'var(--c-text-secondary)', marginBottom: 2, display: 'block' },
  plrowSign: { fontFamily: 'var(--font-serif)', fontSize: 17.5, color: 'var(--c-heading)', display: 'block' },
  plrowDeg: { fontSize: 11, color: 'var(--c-text-secondary)', marginBottom: 2 },
  plrowHouse: { fontSize: 10, color: 'var(--c-text-muted)' },
  plrowArrow: { fontSize: 16, color: 'rgba(250,248,242,0.2)', marginLeft: 4 },
  retroBadge: { backgroundColor: 'rgba(232,120,120,0.12)', borderRadius: 4, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, display: 'inline-block', marginTop: 3 },
  retroBadgeText: { fontSize: 8, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1, color: '#E87878' },
  // Modal overlay
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'var(--c-bg)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 500,
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  ddHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottom: '1px solid var(--c-card-border-alpha)',
  },
  ddTitle: { fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', margin: 0 },
  ddHouseLabel: { fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 8, margin: '0 0 8px 0' },
  ddHook: { fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', lineHeight: '28px', marginBottom: 16, margin: '0 0 16px 0' },
  ddDefBox: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    border: '1px solid var(--c-card-border-alpha)',
  },
  ddDefText: { fontSize: 14, color: 'var(--c-text)', lineHeight: '22px', margin: 0 },
  ddTraits: { marginBottom: 16 },
  ddTraitsLabel: { fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 10, margin: '0 0 10px 0' },
  ddTrait: { fontSize: 14, color: 'var(--c-text)', lineHeight: '24px', marginBottom: 4, margin: '0 0 4px 0' },
  ddSectionLabel: { fontSize: 9, fontFamily: 'var(--font-sans)', fontWeight: 600, letterSpacing: 1.5, color: T.gold, marginBottom: 6, margin: '0 0 6px 0' },
  ddQuoteCard: {
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
    background: 'linear-gradient(135deg, #0E0E22, #1A1060)',
  },
  ddQuote: { fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--c-heading)', textAlign: 'center', lineHeight: '24px', fontStyle: 'italic', margin: 0 },
  ddShareHint: { fontSize: 10, color: 'rgba(200,168,75,0.5)', marginTop: 8, margin: '8px 0 0 0' },
  // Aspect deep dive
  ddAspectBadge: { display: 'inline-flex', borderRadius: 100, paddingTop: 5, paddingBottom: 5, paddingLeft: 14, paddingRight: 14, border: '1px solid', marginBottom: 14 },
  ddAspectBadgeText: { fontSize: 12, fontFamily: 'var(--font-sans)', fontWeight: 500 },
  ddAspectGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 },
  ddAspectCard: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 14,
    padding: 14,
    borderLeft: '3px solid',
    border: '1px solid var(--c-card-border-alpha)',
    borderLeftWidth: 3,
  },
  ddAdviceBox: { backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 14, padding: 14, marginBottom: 12 },
  ddAdviceText: { fontSize: 14, color: 'var(--c-text)', lineHeight: '22px', fontFamily: 'var(--font-sans)', fontWeight: 500, margin: 0 },
  // House deep dive
  ddHousePlanets: { marginBottom: 12 },
  ddHousePlanetChips: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  ddHousePlanetChip: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 100,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    border: '1px solid var(--c-card-border-alpha)',
  },
  ddHousePlanetGlyph: { fontSize: 16 },
  ddHousePlanetName: { fontSize: 12, color: 'var(--c-heading)', fontFamily: 'var(--font-sans)', fontWeight: 500 },
  // Bridge stack
  ddBridgeStack: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  ddAskBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'var(--c-bg)',
    borderRadius: 12,
    padding: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  ddAskBtnIcon: { fontSize: 16, color: T.gold },
  ddAskBtnText: { flex: 1, fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-heading)' },
  ddBridgeBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 12,
    padding: 12,
    border: '1px solid var(--c-card-border-alpha)',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  ddBridgeBtnIcon: { fontSize: 16, color: T.gold },
  ddBridgeBtnText: { flex: 1, fontSize: 13, fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--c-heading)' },
  ddBridgeArrow: { fontSize: 16, color: 'var(--c-text-secondary)' },
  // Share This
  ddShareThisBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(200,168,75,0.12)',
    border: '1px solid rgba(200,168,75,0.3)',
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 20,
    marginTop: 16,
    cursor: 'pointer',
    width: '100%',
  },
  ddShareThisIcon: { fontSize: 15, color: T.gold },
  ddShareThisText: { fontSize: 14, fontFamily: 'var(--font-sans)', fontWeight: 500, color: T.gold },
  // Spinner
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid rgba(200,168,75,0.2)`,
    borderTopColor: T.gold,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
