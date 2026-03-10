import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Share, Modal, TextInput, Alert, Dimensions, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { getMoonDataForDate, calculateCosmicEnergy, getTransitPlanets } from '../services/astrologyService';
import { fetchExtendedForecast, generateThemeAnalysis } from '../services/geminiService';
import { ForecastRepository } from '../services/database/rep_forecasts';
import { loadObject, saveObject } from '../services/storage';

const { width: SCREEN_W } = Dimensions.get('window');

const MOON_PHASE_ICONS = {
  'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓',
  'Waxing Gibbous': '🌔', 'Full Moon': '🌕', 'Waning Gibbous': '🌖',
  'Last Quarter': '🌗', 'Waning Crescent': '🌘',
};

const PERIOD_TABS = [
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const ENERGY_CONFIG = [
  { key: 'Love', icon: '♡', tag: 'LOVE', color: '#E85090', bgColor: 'rgba(232,80,144,0.08)' },
  { key: 'Career', icon: '◆', tag: 'CAREER', color: '#5090E8', bgColor: 'rgba(80,144,232,0.08)' },
  { key: 'Health', icon: '✦', tag: 'VITALITY', color: '#50C878', bgColor: 'rgba(80,200,120,0.08)' },
];

const ENERGY_LABELS = ['Quiet', 'Low', 'Gentle', 'Moderate', 'Warm', 'Steady', 'Balanced', 'Inspired', 'Elevated', 'Magnetic', 'Peak'];

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

const getDateForTab = (tab) => {
  const d = new Date();
  if (tab === 'yesterday') d.setDate(d.getDate() - 1);
  if (tab === 'tomorrow') d.setDate(d.getDate() + 1);
  return d;
};

export default function HomeScreen({ navigation }) {
  const { userProfile, isLoading: profileLoading } = useUserProfile();
  const [activeTab, setActiveTab] = useState('today');
  const [moonData, setMoonData] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [transitPlanets, setTransitPlanets] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [showFullReading, setShowFullReading] = useState(false);

  // Domain modal
  const [domainModal, setDomainModal] = useState(null); // 'Love' | 'Career' | null
  const [domainData, setDomainData] = useState(null);
  const [domainLoading, setDomainLoading] = useState(false);

  // Energy detail modal
  const [energyModal, setEnergyModal] = useState(null); // { tag, icon, color, pct, val, key }

  // Journal
  const [showJournal, setShowJournal] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  const tabScrollRef = useRef(null);

  const today = new Date();
  const name = userProfile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  // Load base data on mount
  useEffect(() => {
    if (!userProfile?.chart) return;
    try { setMoonData(getMoonDataForDate(today)); } catch (e) { console.error(e); }
    try { setTransitPlanets(getTransitPlanets(today)); } catch (e) { console.error(e); }
    loadJournalEntry();
  }, [userProfile]);

  // Load forecast + energy whenever tab changes
  useEffect(() => {
    if (!userProfile?.chart) return;
    loadTabData(activeTab);
  }, [activeTab, userProfile]);

  const loadTabData = async (tab) => {
    // Energy scores
    const timeframe = ['yesterday', 'today', 'tomorrow'].includes(tab) ? tab : tab;
    try {
      const energy = calculateCosmicEnergy(userProfile.chart, getDateForTab(tab), timeframe);
      setEnergyData(energy);
    } catch (e) { console.error('Energy error:', e); }

    // Forecast
    setForecastLoading(true);
    setShowFullReading(false);
    try {
      const dateLabel = getDateForTab(tab).toISOString().split('T')[0];
      const planetaryData = {
        dateLabel,
        transits: transitPlanets.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
      };
      const data = await fetchExtendedForecast(userProfile, tab, planetaryData);
      setForecast(data);
    } catch (e) {
      console.error('Forecast error:', e);
    } finally {
      setForecastLoading(false);
    }
  };

  const loadJournalEntry = async () => {
    try {
      const entries = await loadObject(JOURNAL_KEY) || {};
      const dateStr = today.toISOString().split('T')[0];
      if (entries[dateStr]) { setJournalText(entries[dateStr]); setJournalSaved(true); }
    } catch (e) {}
  };

  const saveJournalEntry = async () => {
    if (!journalText.trim()) return;
    try {
      const entries = await loadObject(JOURNAL_KEY) || {};
      entries[today.toISOString().split('T')[0]] = journalText.trim();
      await saveObject(JOURNAL_KEY, entries);
      setJournalSaved(true);
      setShowJournal(false);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign || '';
    try {
      await Share.share({
        message: `${forecast?.header || 'Daily Cosmic Reading'}\n\n${forecast?.mantra ? `"${forecast.mantra}"\n\n` : ''}${forecast?.detailedHoroscope || ''}\n\n${forecast?.viralInsight ? `✦ ${forecast.viralInsight}\n\n` : ''}— Celestia ${sunSign ? `(${sunSign} Sun)` : ''}`,
      });
    } catch (e) {}
  };

  const openDomainModal = async (theme) => {
    setDomainModal(theme);
    setDomainData(null);
    setDomainLoading(true);
    try {
      const data = await generateThemeAnalysis(userProfile, theme, activeTab);
      setDomainData(data);
    } catch (e) {
      console.error('Domain analysis error:', e);
    } finally {
      setDomainLoading(false);
    }
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
  const isDaily = ['yesterday', 'today', 'tomorrow'].includes(activeTab);

  // Energy display — keys match LIFE_AREAS: 'Love', 'Career', 'Health'
  const energyDisplay = ENERGY_CONFIG.map(cfg => {
    const found = energyData?.find(e => e.id === cfg.key);
    const pct = found ? Math.round(found.value) : 65;
    const labelIdx = Math.min(10, Math.floor(pct / 10));
    return { ...cfg, pct, val: ENERGY_LABELS[labelIdx] };
  });

  // Planet strip
  const planetStrip = transitPlanets.slice(0, 6).map(p => ({
    glyph: PLANET_GLYPHS[p.name] || '★', name: p.name.toUpperCase(),
    pos: `${p.sign} ${p.degree.toFixed(0)}°${p.isRetrograde ? ' ℞' : ''}`
  }));

  // Split horoscope into paragraphs for structured display
  const horoscopeText = forecast?.detailedHoroscope || '';
  const paragraphs = horoscopeText.split('\n\n').filter(p => p.trim());
  const actionItems = forecast?.actionItems || [];

  // Period-specific labels for paragraphs
  const PARA_LABELS_DAILY = ['COSMIC CLIMATE', 'PERSONAL IMPACT', 'THE CHALLENGE', 'THE GUIDANCE'];
  const PARA_LABELS_WEEKLY = ['THE WEEKLY ARC', 'EARLY WEEK', 'MID-WEEK SHIFT', 'THE WEEKEND'];
  const PARA_LABELS_MONTHLY = ['THE THEME', 'FIRST HALF', 'SECOND HALF', 'POWER DATES'];
  const PARA_LABELS_YEARLY = ['ANNUAL THEME', 'Q1: INITIATION', 'MID-YEAR GROWTH', 'Q4: HARVEST', 'SOUL LESSON'];

  const getParaLabels = () => {
    if (isDaily) return PARA_LABELS_DAILY;
    if (activeTab === 'weekly') return PARA_LABELS_WEEKLY;
    if (activeTab === 'monthly') return PARA_LABELS_MONTHLY;
    if (activeTab === 'yearly') return PARA_LABELS_YEARLY;
    return [];
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={true}>
        {/* ── HERO ── */}
        <LinearGradient colors={['#0E0E22', '#1A1535', '#0F1628']} locations={[0, 0.5, 1]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <Text style={styles.greeting}>{getTimeOfDay()}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.heroName}>{firstName}</Text>
            <TouchableOpacity style={styles.avatar} activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
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
          </View>
        </LinearGradient>

        {/* ── PERIOD TABS ── */}
        <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabStrip} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
          {PERIOD_TABS.map((tab) => (
            <TouchableOpacity key={tab.key}
              style={[styles.periodTab, activeTab === tab.key && styles.periodTabOn]}
              onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
              <Text style={[styles.periodTabText, activeTab === tab.key && styles.periodTabTextOn]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* ── FORECAST HERO CARD ── */}
          <View style={styles.dailyCard}>
            <LinearGradient colors={['#171428', '#14122A', '#0F1220']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dailyHd}>
              <Text style={styles.dailyDate}>{formatDateHeader(getDateForTab(activeTab))}</Text>
              {forecastLoading ? (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={T.gold} />
                  <Text style={{ fontSize: 11, color: 'rgba(250,248,242,0.35)', marginTop: 6 }}>Reading the stars…</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.dailyHeadline}>{forecast?.header || 'Your Cosmic Reading'}</Text>
                  {/* Power + Lucky chips */}
                  <View style={styles.tchips}>
                    {forecast?.powerCosmic && (
                      <View style={styles.tchip}><Text style={styles.tchipText}>✦ {forecast.powerCosmic}</Text></View>
                    )}
                    {forecast?.luckyStats && (
                      <View style={styles.tchip}><Text style={styles.tchipText}>Lucky #{forecast.luckyStats.number}</Text></View>
                    )}
                    <View style={styles.tchip}><Text style={styles.tchipText}>☽ {moonSign}</Text></View>
                  </View>
                </>
              )}
            </LinearGradient>

            {/* Body */}
            <View style={styles.dailyBody}>
              {!forecastLoading && forecast && (
                <>
                  {/* Mantra */}
                  {forecast.mantra && (
                    <View style={styles.mantraBox}>
                      <Text style={styles.mantraText}>"{forecast.mantra}"</Text>
                    </View>
                  )}

                  {/* Structured paragraphs */}
                  {!showFullReading ? (
                    <Text style={styles.dailyTxt} numberOfLines={4}>
                      {paragraphs[0] || 'The cosmos aligns beautifully today.'}
                    </Text>
                  ) : (
                    <View>
                      {paragraphs.map((p, i) => (
                        <View key={i} style={styles.paraBlock}>
                          {getParaLabels()[i] && (
                            <Text style={styles.paraLabel}>{getParaLabels()[i]}</Text>
                          )}
                          <Text style={styles.dailyTxt}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Items (expanded) */}
                  {showFullReading && actionItems.length > 0 && (
                    <View style={styles.actionBox}>
                      <Text style={styles.actionLabel}>POWER MOVES</Text>
                      {actionItems.map((item, i) => (
                        <View key={i} style={styles.actionRow}>
                          <Text style={styles.actionArrow}>→</Text>
                          <Text style={styles.actionItem}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Viral Insight (expanded) */}
                  {showFullReading && forecast.viralInsight && (
                    <View style={styles.viralBox}>
                      <Text style={styles.viralText}>✦ {forecast.viralInsight}</Text>
                    </View>
                  )}

                  {/* Buttons */}
                  <View style={styles.dailyActs}>
                    <TouchableOpacity style={styles.btnOutline} activeOpacity={0.7} onPress={handleShare}>
                      <Text style={styles.btnOutlineText}>Share ↗</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnFill} activeOpacity={0.85}
                      onPress={() => setShowFullReading(!showFullReading)}>
                      <Text style={styles.btnFillText}>{showFullReading ? 'Show Less ↑' : 'Read Full →'}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── ENERGY GRID ── */}
          <View style={styles.egrid}>
            {energyDisplay.map((e, i) => (
              <TouchableOpacity key={i} style={[styles.ecard, { backgroundColor: e.bgColor }]}
                activeOpacity={0.7}
                onPress={() => setEnergyModal(e)}>
                <Text style={[styles.ecardIcon, { color: e.color }]}>{e.icon}</Text>
                <Text style={styles.ecardTag}>{e.tag}</Text>
                <View style={styles.ecardBarBg}>
                  <View style={[styles.ecardBarFill, { width: `${e.pct}%`, backgroundColor: e.color }]} />
                </View>
                <Text style={styles.ecardVal}>{e.val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── LOVE & CAREER CARDS ── */}
          <View style={styles.domainRow}>
            <TouchableOpacity style={[styles.domainCard, { borderLeftColor: '#E85090' }]}
              activeOpacity={0.7} onPress={() => openDomainModal('Love')}>
              <Text style={styles.domainIcon}>♡</Text>
              <Text style={styles.domainName}>Love & Connection</Text>
              <Text style={styles.domainVibe}>{forecast?.loveVibe || 'Tap to reveal'}</Text>
              <Text style={styles.domainCta}>Deep Dive →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.domainCard, { borderLeftColor: '#5090E8' }]}
              activeOpacity={0.7} onPress={() => openDomainModal('Career')}>
              <Text style={styles.domainIcon}>◆</Text>
              <Text style={styles.domainName}>Career & Ambition</Text>
              <Text style={styles.domainVibe}>{forecast?.careerVibe || 'Tap to reveal'}</Text>
              <Text style={styles.domainCta}>Deep Dive →</Text>
            </TouchableOpacity>
          </View>

          {/* ── SKY NOW STRIP ── */}
          <Text style={styles.sectionLabel}>SKY NOW</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pstrip}
            contentContainerStyle={{ paddingRight: 20 }}>
            {planetStrip.map((p, i) => (
              <TouchableOpacity key={i} style={styles.pchip} activeOpacity={0.7}
                onPress={() => navigation.navigate('Sky')}>
                <Text style={styles.pchipGlyph}>{p.glyph}</Text>
                <View>
                  <Text style={styles.pchipName}>{p.name}</Text>
                  <Text style={styles.pchipPos}>{p.pos}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── LUCKY STATS ── */}
          {forecast?.luckyStats && (
            <View style={styles.luckyRow}>
              <View style={styles.luckyStat}>
                <Text style={styles.luckyLabel}>LUCKY NUMBER</Text>
                <Text style={styles.luckyNum}>{forecast.luckyStats.number}</Text>
              </View>
              <View style={[styles.luckyDivider]} />
              <View style={styles.luckyStat}>
                <Text style={styles.luckyLabel}>POWER COLOR</Text>
                <Text style={styles.luckyVal}>{forecast.luckyStats.color}</Text>
              </View>
              {forecast.powerCosmic && (
                <>
                  <View style={styles.luckyDivider} />
                  <View style={styles.luckyStat}>
                    <Text style={styles.luckyLabel}>INTENSITY</Text>
                    <Text style={styles.luckyVal}>{forecast.powerCosmic}</Text>
                  </View>
                </>
              )}
            </View>
          )}

          {/* ── COSMIC JOURNAL ── */}
          {isDaily && (
            <View style={styles.journalCard}>
              <View style={styles.jcardHeader}>
                <Text style={styles.jcardTitle}>COSMIC JOURNAL</Text>
                <View style={[styles.jcardBadge, journalSaved && { backgroundColor: '#D8F0D0' }]}>
                  <Text style={styles.jcardBadgeText}>{journalSaved ? 'Saved' : 'Today'}</Text>
                </View>
              </View>
              <Text style={styles.jcardPrompt}>
                {forecast?.mantra
                  ? `"${forecast.mantra}"`
                  : '"What is the universe trying to teach you right now?"'}
              </Text>
              <TouchableOpacity style={styles.jcardBtn} activeOpacity={0.7}
                onPress={() => setShowJournal(true)}>
                <Text style={styles.jcardBtnText}>{journalSaved ? '📖 View Entry' : '✍ Write Today\'s Entry'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── QUICK ACTIONS ── */}
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('Chart')}>
              <Text style={styles.quickIcon}>✦</Text>
              <Text style={styles.quickLabel}>Explore Chart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('AskAI')}>
              <Text style={styles.quickIcon}>✧</Text>
              <Text style={styles.quickLabel}>Ask Celestia</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}
              onPress={() => navigation.navigate('Match')}>
              <Text style={styles.quickIcon}>♡</Text>
              <Text style={styles.quickLabel}>Compatibility</Text>
            </TouchableOpacity>
          </View>

          {/* ── PROMO ── */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('Reports')}>
            <LinearGradient colors={['#1A1530', '#14112A', '#101320']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
              <Text style={styles.promoLbl}>REPORTS</Text>
              <Text style={styles.promoTitle}>Deep Chart Analysis</Text>
              <Text style={styles.promoSub}>Love, Career, Purpose — written for your exact chart</Text>
              <View style={styles.promoCta}><Text style={styles.promoCtaText}>Explore Reports →</Text></View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* ── ENERGY DETAIL MODAL ── */}
      <Modal visible={!!energyModal} animationType="fade" transparent>
        <TouchableOpacity style={styles.energyOverlay} activeOpacity={1} onPress={() => setEnergyModal(null)}>
          <View style={styles.energySheet}>
            {energyModal && (
              <>
                <View style={styles.energySheetHeader}>
                  <Text style={[styles.energySheetIcon, { color: energyModal.color }]}>{energyModal.icon}</Text>
                  <Text style={styles.energySheetTitle}>{energyModal.tag}</Text>
                  <TouchableOpacity onPress={() => setEnergyModal(null)}>
                    <Text style={{ fontSize: 16, color: T.stone, padding: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.energySheetBarWrap}>
                  <View style={styles.energySheetBarBg}>
                    <View style={[styles.energySheetBarFill, { width: `${energyModal.pct}%`, backgroundColor: energyModal.color }]} />
                  </View>
                  <Text style={[styles.energySheetLevel, { color: energyModal.color }]}>{energyModal.val}</Text>
                </View>
                <Text style={styles.energySheetPeriod}>
                  {activeTab === 'yesterday' ? "Yesterday's" : activeTab === 'today' ? "Today's" : activeTab === 'tomorrow' ? "Tomorrow's" : activeTab === 'weekly' ? 'This Week\'s' : activeTab === 'monthly' ? 'This Month\'s' : 'This Year\'s'} cosmic energy for {energyModal.tag.toLowerCase()}
                </Text>
                <Text style={styles.energySheetDesc}>
                  {energyModal.key === 'Love'
                    ? energyModal.pct >= 70 ? 'Venus and the Moon amplify your emotional magnetism right now. Connections deepen easily — lean into vulnerability and authentic expression.'
                      : energyModal.pct >= 40 ? 'Relationship energy is steady. Focus on small, meaningful gestures rather than grand romantic moves. Existing bonds benefit from honest communication.'
                      : 'Emotional currents are subdued. This is a reflective phase — use it to understand your own needs before seeking connection with others.'
                    : energyModal.key === 'Career'
                    ? energyModal.pct >= 70 ? 'Saturn and the Sun align in your favor. Professional momentum is strong — take initiative, pitch ideas, and step into leadership roles confidently.'
                      : energyModal.pct >= 40 ? 'Career energy is moderate. Steady progress is possible but avoid forcing outcomes. Focus on refining your work and building relationships with allies.'
                      : 'Professional energy is in a quieter phase. Use this time for planning, skill-building, and reassessing your long-term goals rather than pushing for immediate results.'
                    : energyModal.pct >= 70 ? 'Mars and the Sun boost your physical vitality. Your body responds well to activity — prioritize movement, fresh air, and nourishing food.'
                      : energyModal.pct >= 40 ? 'Vitality is balanced. Maintain your routines and listen to your body\'s signals. Gentle exercise and consistent sleep patterns will keep you centered.'
                      : 'Your physical energy is in a restorative phase. Honor the need for rest, gentle stretching, and extra hydration. Recovery now fuels future strength.'}
                </Text>
                {(energyModal.key === 'Love' || energyModal.key === 'Career') && (
                  <TouchableOpacity style={[styles.energySheetBtn, { backgroundColor: energyModal.color + '18', borderColor: energyModal.color + '30' }]}
                    activeOpacity={0.7} onPress={() => { setEnergyModal(null); setTimeout(() => openDomainModal(energyModal.key), 300); }}>
                    <Text style={[styles.energySheetBtnText, { color: energyModal.color }]}>Full {energyModal.tag.charAt(0) + energyModal.tag.slice(1).toLowerCase()} Reading →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── DOMAIN DEEP DIVE MODAL ── */}
      <Modal visible={!!domainModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: T.cream }}>
          <LinearGradient
            colors={domainModal === 'Love' ? ['#3A0A2A', '#1A0A2E'] : ['#0A1A3A', '#0E0E22']}
            style={styles.domModalHero}>
            <View style={styles.domModalHeader}>
              <TouchableOpacity onPress={() => setDomainModal(null)}>
                <Text style={{ fontSize: 18, color: 'rgba(250,248,242,0.6)', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.domModalIcon}>{domainModal === 'Love' ? '♡' : '◆'}</Text>
            <Text style={styles.domModalTitle}>
              {domainModal === 'Love' ? 'Love & Connection' : 'Career & Ambition'}
            </Text>
            {domainData?.vibe && <Text style={styles.domModalVibe}>{domainData.vibe}</Text>}
          </LinearGradient>

          {domainLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={T.gold} />
              <Text style={{ fontSize: 13, color: T.stone, marginTop: 12 }}>Consulting the cosmos...</Text>
            </View>
          ) : domainData ? (
            <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
              {/* Headline */}
              <Text style={styles.domHeadline}>{domainData.headline}</Text>

              {/* Analysis paragraphs */}
              {domainData.analysis?.split('\n\n').filter(Boolean).map((p, i) => (
                <Text key={i} style={styles.domPara}>{p}</Text>
              ))}

              {/* Action */}
              {domainData.action && (
                <View style={styles.domActionBox}>
                  <Text style={styles.domActionLabel}>YOUR MOVE</Text>
                  <Text style={styles.domActionText}>{domainData.action}</Text>
                </View>
              )}

              {/* Timing */}
              {domainData.timing && (
                <View style={styles.domTimingBox}>
                  <Text style={styles.domTimingLabel}>TIMING</Text>
                  <Text style={styles.domTimingText}>{domainData.timing}</Text>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      {/* ── JOURNAL MODAL ── */}
      <Modal visible={showJournal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.journalModal}>
          <View style={styles.journalModalHeader}>
            <Text style={styles.journalModalTitle}>Cosmic Journal</Text>
            <TouchableOpacity onPress={() => setShowJournal(false)}>
              <Text style={{ fontSize: 18, color: T.stone, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.journalModalBody}>
            <Text style={styles.journalDateLabel}>{formatDateHeader()}</Text>
            <Text style={styles.journalPromptLabel}>
              {forecast?.mantra ? `"${forecast.mantra}"` : '"What is the universe trying to teach you?"'}
            </Text>
            <TextInput style={styles.journalInput} multiline placeholder="Let your thoughts flow..."
              placeholderTextColor="#B0A898" value={journalText} onChangeText={setJournalText}
              textAlignVertical="top" />
            <TouchableOpacity style={[styles.journalSaveBtn, !journalText.trim() && { opacity: 0.5 }]}
              onPress={saveJournalEntry} disabled={!journalText.trim()}>
              <Text style={styles.journalSaveBtnText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(200,168,75,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 20, color: T.gold },
  moonStrip: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  moonText: { fontSize: 12, color: 'rgba(250,248,242,0.5)', flex: 1 },

  // Period tabs
  tabStrip: { flexGrow: 0, marginBottom: 12, marginTop: 14 },
  periodTab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, backgroundColor: 'white', borderWidth: 1, borderColor: T.border },
  periodTabOn: { backgroundColor: T.navy, borderColor: T.navy },
  periodTabText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.stone },
  periodTabTextOn: { color: T.cream },

  content: { paddingHorizontal: 20, paddingTop: 0 },

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
  viralBox: { backgroundColor: T.navy, borderRadius: 12, padding: 14, marginBottom: 12, alignItems: 'center' },
  viralText: { fontSize: 13, color: T.cream, fontFamily: FONTS.sansMedium, textAlign: 'center', lineHeight: 20 },
  dailyActs: { flexDirection: 'row', gap: 9, marginTop: 4 },
  btnOutline: { flex: 1, height: 40, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: '#6B6050' },
  btnFill: { flex: 1, height: 40, backgroundColor: T.navy, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFillText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.cream },

  // Energy grid
  egrid: { flexDirection: 'row', gap: 9, marginBottom: 15 },
  ecard: { flex: 1, borderRadius: 17, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  ecardIcon: { fontSize: 20, marginBottom: 6 },
  ecardTag: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: T.stone, marginBottom: 6 },
  ecardBarBg: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 6, overflow: 'hidden' },
  ecardBarFill: { height: '100%', borderRadius: 2 },
  ecardVal: { fontFamily: FONTS.serif, fontSize: 12.5, color: T.navy },

  // Domain cards
  domainRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  domainCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8 },
  domainIcon: { fontSize: 20, marginBottom: 6 },
  domainName: { fontSize: 12, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 4 },
  domainVibe: { fontSize: 11, color: T.stone, marginBottom: 8, lineHeight: 16 },
  domainCta: { fontSize: 11, color: T.gold, fontFamily: FONTS.sansMedium },

  // Section label
  sectionLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },

  // Planet strip
  pstrip: { marginBottom: 15 },
  pchip: { backgroundColor: 'white', borderRadius: 13, paddingVertical: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: T.border, marginRight: 7 },
  pchipGlyph: { fontSize: 18 },
  pchipName: { fontSize: 9.5, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.7, color: T.stone },
  pchipPos: { fontFamily: FONTS.serif, fontSize: 13.5, color: T.navy },

  // Lucky stats
  luckyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
  luckyStat: { flex: 1, alignItems: 'center' },
  luckyDivider: { width: 1, height: 28, backgroundColor: '#EDE6D8' },
  luckyLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, color: T.stone, marginBottom: 4 },
  luckyNum: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  luckyVal: { fontFamily: FONTS.serif, fontSize: 13, color: T.navy, textAlign: 'center' },

  // Journal
  journalCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, paddingHorizontal: 18, marginBottom: 15, borderWidth: 1, borderColor: T.border },
  jcardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  jcardTitle: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone },
  jcardBadge: { backgroundColor: '#F0E8D6', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  jcardBadgeText: { fontSize: 10, color: '#6B6050' },
  jcardPrompt: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.navy, lineHeight: 22, marginBottom: 12, fontStyle: 'italic' },
  jcardBtn: { height: 36, backgroundColor: T.warm, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  jcardBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },

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
  domModalHero: { paddingTop: 56, paddingHorizontal: 22, paddingBottom: 28, alignItems: 'center' },
  domModalHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10 },
  domModalIcon: { fontSize: 40, color: 'rgba(250,248,242,0.3)', marginBottom: 8 },
  domModalTitle: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, marginBottom: 4 },
  domModalVibe: { fontSize: 13, color: 'rgba(250,248,242,0.5)', fontStyle: 'italic' },
  domHeadline: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 16, lineHeight: 28 },
  domPara: { fontSize: 14, color: T.ink, lineHeight: 23, marginBottom: 14 },
  domActionBox: { backgroundColor: T.warm, borderRadius: 14, padding: 16, marginBottom: 12 },
  domActionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 6 },
  domActionText: { fontSize: 14, color: T.ink, lineHeight: 22 },
  domTimingBox: { backgroundColor: T.navy, borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center' },
  domTimingLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: 'rgba(200,168,75,0.6)', marginBottom: 6 },
  domTimingText: { fontSize: 14, color: T.cream, lineHeight: 22, textAlign: 'center' },

  // Energy detail modal
  energyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  energySheet: { backgroundColor: T.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 36 },
  energySheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  energySheetIcon: { fontSize: 24 },
  energySheetTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, flex: 1 },
  energySheetBarWrap: { marginBottom: 14 },
  energySheetBarBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 6 },
  energySheetBarFill: { height: '100%', borderRadius: 3 },
  energySheetLevel: { fontSize: 13, fontFamily: FONTS.sansSemiBold },
  energySheetPeriod: { fontSize: 11, color: T.stone, marginBottom: 10 },
  energySheetDesc: { fontSize: 14, color: T.ink, lineHeight: 22, marginBottom: 16 },
  energySheetBtn: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  energySheetBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold },

  // Journal modal
  journalModal: { flex: 1, backgroundColor: T.cream },
  journalModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  journalModalTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy },
  journalModalBody: { flex: 1, padding: 20 },
  journalDateLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 },
  journalPromptLabel: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.navy, fontStyle: 'italic', lineHeight: 22, marginBottom: 16 },
  journalInput: { backgroundColor: 'white', borderRadius: 16, padding: 16, fontSize: 15, color: T.ink, borderWidth: 1, borderColor: '#EDE6D8', minHeight: 200, lineHeight: 24, fontFamily: FONTS.sansLight },
  journalSaveBtn: { backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  journalSaveBtnText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream },
});
