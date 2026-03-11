import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateSynastryScore } from '../services/astrology/SynastryService';
import { calculateChart } from '../services/astrologyService';
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

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const MATCH_THEME = {
  gradient: ['#2D0A1E', '#1A0828', '#0D0515'],
  accent: '#E85090',
  accentSoft: 'rgba(232,80,144,0.12)',
  accentGlow: 'rgba(232,80,144,0.35)',
  title: 'Compatibility Report',
  steps: [
    { icon: '♡', label: 'Reading both charts', sub: 'Mapping your cosmic blueprints...' },
    { icon: '☽', label: 'Comparing Moon signs', sub: 'How you feel together...' },
    { icon: '♀', label: 'Analyzing Venus chemistry', sub: 'Love languages & attraction...' },
    { icon: '♂', label: 'Checking Mars dynamics', sub: 'Passion, desire & conflict...' },
    { icon: '☿', label: 'Mapping communication styles', sub: 'Mercury connections...' },
    { icon: '♄', label: 'Exploring long-term potential', sub: 'Saturn bonds & commitment...' },
    { icon: '✦', label: 'Writing your love story', sub: 'Weaving it all together...' },
    { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
    { icon: '♡', label: 'Almost ready', sub: 'Your compatibility report awaits...' },
  ],
  quotes: [
    '"Your charts don\'t just overlap — they have a conversation."',
    '"Venus shows how you love. Their Venus shows how they need to be loved."',
    '"The Moon knows what your heart needs before you do."',
    '"Some connections are written in the stars. Others are written in Saturn."',
    '"Synastry isn\'t just compatibility — it\'s the story of two souls meeting."',
    '"The best relationships aren\'t perfect — they\'re cosmically balanced."',
  ],
};

const getInitial = (name) => (name || '?')[0].toUpperCase();

const getScoreLabel = (score) => {
  if (score >= 90) return 'Written in the stars';
  if (score >= 80) return 'Deeply harmonious';
  if (score >= 70) return 'Strong connection';
  if (score >= 60) return 'Compatible souls';
  if (score >= 50) return 'Growing together';
  return 'Complex dynamic';
};

export default function CompatibilityScreen() {
  const { userProfile, partnerProfiles, addPartner, removePartner } = useUserProfile();
  const [selectedPartnerIdx, setSelectedPartnerIdx] = useState(0);
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

  // Story card share state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [storyTheme, setStoryTheme] = useState(0);
  const [viralInsights, setViralInsights] = useState(null);
  const [viralLoading, setViralLoading] = useState(false);

  // Add partner form state
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

  // Nominatim city search with 600ms debounce
  useEffect(() => {
    if (selectedCity || citySearch.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCitySearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(citySearch)}&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'CelestiaMobile/1.0' } }
        );
        const data = await res.json();
        setCitySuggestions(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        })));
      } catch (e) {
        console.warn('City search error:', e);
      } finally {
        setCitySearching(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  const partnerProfile = partnerProfiles[selectedPartnerIdx] || null;

  const synastry = useMemo(() => {
    if (!userProfile?.chart || !partnerProfile?.chart) return null;
    try {
      return calculateSynastryScore(userProfile.chart, partnerProfile.chart);
    } catch (e) {
      console.error('Synastry error:', e);
      return null;
    }
  }, [userProfile?.chart, partnerProfile?.chart]);

  useEffect(() => {
    if (!synastry || !userProfile?.chart || !partnerProfile?.chart) return;
    loadAiAnalysis();
    setViralInsights(null); // Reset viral insights for new partner
  }, [synastry?.harmonyScore, partnerProfile?.id]);

  const loadAiAnalysis = async () => {
    setAiLoading(true);
    haptic.medium();
    try {
      const report = await generateMatchCore(userProfile, partnerProfile, synastry);
      if (report?.snapshot) setAiAnalysis(report.snapshot);
      // Track compatibility check
      const profileId = userProfile?.id || 'default';
      trackEvent('match_checked').catch(() => {});
      awardXP(profileId, 'compatibility_check').catch(() => {});
      completeQuestAction('compat_checked').catch(() => {});
    } catch (e) {
      console.warn('AI analysis failed:', e);
    } finally {
      setAiLoading(false);
    }
    // Also load detailed match analysis
    setDetailsLoading(true);
    try {
      const details = await generateMatchDetails(userProfile, partnerProfile);
      setMatchDetails(details);
    } catch (e) {
      console.warn('Match details failed:', e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCitySearch = (text) => {
    setSelectedCity(null);
    setCitySearch(text);
  };

  const handleSavePartner = async () => {
    if (!partnerName.trim()) { Alert.alert('Missing info', 'Please enter a name.'); return; }
    if (!partnerDate) { Alert.alert('Missing info', 'Please select a birth date.'); return; }
    if (!selectedCity) { Alert.alert('Missing info', 'Please select a birth city.'); return; }
    setSavingPartner(true);
    try {
      const dateStr = partnerDate.toISOString().split('T')[0];
      const timeStr = (isTimeUnknown || !partnerTime) ? '12:00' : `${partnerTime.getHours().toString().padStart(2,'0')}:${partnerTime.getMinutes().toString().padStart(2,'0')}`;
      const chart = await calculateChart(dateStr, timeStr, { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name }, isTimeUnknown, 'whole');
      const partner = {
        id: await Crypto.randomUUID(),
        type: 'other',
        name: partnerName.trim(),
        birthDate: dateStr,
        birthTime: timeStr,
        birthLocation: selectedCity.name,
        isTimeUnknown,
        chart,
      };
      await addPartner(partner);
      setSelectedPartnerIdx(partnerProfiles.length); // select new partner
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error('Save partner error:', e);
      Alert.alert('Error', 'Failed to calculate chart. Please try again.');
    } finally {
      setSavingPartner(false);
    }
  };

  const resetForm = () => {
    setPartnerName('');
    setPartnerDate(null);
    setPartnerTime(null);
    setIsTimeUnknown(false);
    setCitySearch('');
    setSelectedCity(null);
    setCitySuggestions([]);
  };

  const handleRemovePartner = (partner) => {
    Alert.alert('Remove Partner', `Remove ${partner.name} from your matches?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removePartner(partner.id); setSelectedPartnerIdx(0); } },
    ]);
  };

  const advanceStep = useCallback((step) => {
    if (!pdfCancelledRef.current) setGenStep(step);
  }, []);

  const handleDownloadReport = async () => {
    if (!synastry || !partnerProfile) return;
    pdfCancelledRef.current = false;
    setPdfLoading(true);
    setGenStep(0);
    haptic.medium();
    const numSteps = MATCH_THEME.steps.length;
    try {
      // Step 0-1: Initial reading
      await new Promise(r => setTimeout(r, 800));
      if (pdfCancelledRef.current) return;
      advanceStep(1);
      await new Promise(r => setTimeout(r, 700));
      if (pdfCancelledRef.current) return;

      // Steps 2-6: Auto-advance during AI generation
      advanceStep(2);
      const stepTimer = setInterval(() => {
        setGenStep(prev => (prev < numSteps - 3 ? prev + 1 : prev));
      }, 3200);

      const deepReport = await generateDeepMatchReport(userProfile, partnerProfile, synastry);
      clearInterval(stepTimer);
      if (pdfCancelledRef.current) return;

      // Designing PDF
      advanceStep(numSteps - 2);
      const html = generateMatchReportHTML(deepReport, userProfile, partnerProfile, synastry);
      await new Promise(r => setTimeout(r, 500));
      if (pdfCancelledRef.current) return;

      const { uri: tempUri } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: false });
      if (pdfCancelledRef.current) return;

      // Preparing download
      advanceStep(numSteps - 1);
      const p1Name = (userProfile.name || 'You').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      const p2Name = (partnerProfile.name || 'Match').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
      const filename = `Celestia-${p1Name}-${p2Name}-Compatibility.pdf`;
      const tempFile = new File(tempUri);
      const destFile = new File(Paths.cache, filename);
      if (destFile.exists) destFile.delete();
      tempFile.move(destFile);
      await new Promise(r => setTimeout(r, 600));

      setPdfLoading(false);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destFile.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${p1Name} & ${p2Name} Compatibility Report`,
          UTI: 'com.adobe.pdf',
        });
      }
      trackEvent('report_downloaded').catch(() => {});
    } catch (e) {
      if (pdfCancelledRef.current) return;
      console.error('Match PDF error:', e);
      Alert.alert('Error', 'Could not generate report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCancelPdf = useCallback(() => {
    pdfCancelledRef.current = true;
    setPdfLoading(false);
  }, []);

  const handleShareStory = useCallback(async () => {
    setShowStoryModal(true);
    if (!viralInsights) {
      setViralLoading(true);
      try {
        const insights = await generateMatchViralInsights(userProfile, partnerProfile, synastry);
        setViralInsights(insights);
      } catch (e) {
        console.warn('Viral insights failed:', e);
        setViralInsights({
          spark: "An attraction that doesn't need explaining. You both just know.",
          tension: "You want the same thing but refuse to say it first.",
          truth: "They see through your walls. That's exactly why it scares you.",
          oneWord: "Magnetic",
        });
      } finally {
        setViralLoading(false);
      }
    }
  }, [viralInsights, userProfile, partnerProfile, synastry]);

  const handleShareStoryCapture = useCallback(async () => {
    haptic.medium();
    const p1Name = userProfile?.name?.split(' ')[0] || 'You';
    const p2Name = partnerProfile?.name?.split(' ')[0] || 'Partner';
    await shareStoryCard(
      `${p1Name} & ${p2Name} — ${synastry?.harmonyScore || 0}% cosmic compatibility\n\n✦ ${viralInsights?.spark || ''}\n◆ ${viralInsights?.tension || ''}\n✧ ${viralInsights?.truth || ''}\n\n— Celestia`
    );
    trackEvent('share_story').catch(() => {});
    awardXP(userProfile?.id || 'default', 'share').catch(() => {});
    setShowStoryModal(false);
  }, [userProfile, partnerProfile, synastry, viralInsights, shareStoryCard]);

  const userSun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const partnerSun = partnerProfile?.chart?.planets?.find(p => p.name === 'Sun');

  const scoreDimensions = synastry ? [
    { name: 'Emotional', pct: synastry.scores.emotional, color: '#E85090' },
    { name: 'Communication', pct: synastry.scores.communication, color: '#50A0C8' },
    { name: 'Attraction', pct: synastry.scores.attraction, color: '#E86050' },
    { name: 'Stability', pct: synastry.scores.stability, color: T.gold },
  ] : [];

  // No profile yet
  if (!userProfile?.chart) {
    return (
      <View style={{ flex: 1, backgroundColor: T.cream, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: T.navy, textAlign: 'center', marginBottom: 10 }}>Complete your profile first</Text>
        <Text style={{ fontFamily: FONTS.sansLight, fontSize: 14, color: T.stone, textAlign: 'center' }}>Finish onboarding to unlock cosmic compatibility.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#0E0E22', '#1E1228', '#14101E']} locations={[0, 0.5, 1]} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title}>Compatibility</Text>
            <CosmicTooltip id="synastry" size={16} light />
          </View>
          <Text style={styles.sub}>Cosmic connection analysis</Text>

          {/* Pair display */}
          <View style={styles.pairDisplay}>
            <View style={styles.pairPerson}>
              <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.pairOrb}>
                <Text style={styles.pairOrbText}>{getInitial(userProfile.name)}</Text>
              </LinearGradient>
              <Text style={styles.pairName}>{userProfile.name?.split(' ')[0] || 'You'}</Text>
              <Text style={styles.pairSign}>{ZODIAC_GLYPHS[userSun?.sign] || '✦'} {userSun?.sign || '—'}</Text>
            </View>

            <View style={styles.pairConnector}>
              <View style={styles.pairLine} />
              <LinearGradient colors={['#E85090', '#C82870']} style={styles.pairHeart}>
                <Text style={{ fontSize: 16 }}>♥</Text>
              </LinearGradient>
              <View style={styles.pairLine} />
            </View>

            <View style={styles.pairPerson}>
              {partnerProfile ? (
                <>
                  <LinearGradient colors={['#6050C8', '#3A2890']} style={styles.pairOrb}>
                    <Text style={styles.pairOrbText}>{getInitial(partnerProfile.name)}</Text>
                  </LinearGradient>
                  <Text style={styles.pairName}>{partnerProfile.name?.split(' ')[0]}</Text>
                  <Text style={styles.pairSign}>{ZODIAC_GLYPHS[partnerSun?.sign] || '✦'} {partnerSun?.sign || '—'}</Text>
                </>
              ) : (
                <>
                  <TouchableOpacity style={[styles.pairOrb, styles.pairOrbEmpty]} onPress={() => setShowAddModal(true)}>
                    <Text style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.pairName}>Add person</Text>
                  <Text style={styles.pairSign}>Tap to add</Text>
                </>
              )}
            </View>
          </View>

          {/* Score belt */}
          {synastry ? (
            <>
            <View style={styles.scoreBelt}>
              <View style={styles.scoreMain}>
                <View style={styles.scoreRingWrap}>
                  <Svg width={64} height={64}>
                    <Circle cx={32} cy={32} r={28} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
                    <Circle cx={32} cy={32} r={28} fill="none" stroke={T.gold} strokeWidth={4}
                      strokeDasharray={`${(synastry.harmonyScore / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
                      strokeLinecap="round" transform="rotate(-90 32 32)" />
                  </Svg>
                  <Text style={styles.scoreNum}>{synastry.harmonyScore}</Text>
                </View>
                <Text style={styles.scoreLbl}>OVERALL</Text>
                <Text style={styles.scoreVerdict}>"{getScoreLabel(synastry.harmonyScore)}"</Text>
              </View>
              <View style={styles.scoreBars}>
                {scoreDimensions.map((b, i) => (
                  <View key={i} style={styles.sbarRow}>
                    <View style={styles.sbarTop}>
                      <Text style={styles.sbarName}>{b.name}</Text>
                      <Text style={styles.sbarPct}>{b.pct}%</Text>
                    </View>
                    <View style={styles.sbarTrack}>
                      <View style={[styles.sbarFill, { width: `${b.pct}%`, backgroundColor: b.color }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.shareStoryBtn} activeOpacity={0.7} onPress={handleShareStory}>
              <LinearGradient colors={['rgba(176,136,240,0.25)', 'rgba(232,80,144,0.20)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareStoryGrad}>
                <Text style={styles.shareStoryIcon}>↗</Text>
                <Text style={styles.shareStoryText}>Share to Stories</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.inviteBtn}
              activeOpacity={0.7}
              onPress={async () => {
                haptic('medium');
                await createAndShareInvite({
                  inviterName: userProfile?.name || 'Someone',
                  inviterId: userProfile?.id,
                  partnerName: partnerProfile?.name || 'Partner',
                  partnerBirthData: partnerProfile?.chart ? {
                    date: partnerProfile.birthDate,
                    time: partnerProfile.birthTime,
                    lat: partnerProfile.birthLat,
                    lng: partnerProfile.birthLng,
                  } : null,
                  score: synastry.harmonyScore,
                  verdict: getScoreLabel(synastry.harmonyScore),
                });
                trackEvent('share');
                awardXP(userProfile?.id, 'share');
              }}
            >
              <Text style={styles.inviteBtnText}>
                Invite {partnerProfile?.name?.split(' ')[0] || 'Partner'} to See Your Match ✉️
              </Text>
            </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noPartnerHint}>
              <Text style={{ color: 'rgba(250,248,242,0.45)', fontSize: 13, textAlign: 'center' }}>
                Add a partner below to see your cosmic compatibility score
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Body */}
        <View style={styles.body}>
          {/* AI Analysis */}
          {synastry && (
            <View style={styles.sumCard}>
              <LinearGradient colors={['#1A1228', '#14101E']} style={styles.sumHd}>
                <Text style={styles.sumLbl}>AI ANALYSIS</Text>
                <Text style={styles.sumTitle}>
                  {userSun?.sign && partnerSun?.sign
                    ? `${userSun.sign} & ${partnerSun.sign}`
                    : 'Cosmic Connection'}
                </Text>
              </LinearGradient>
              <View style={styles.sumBody}>
                {aiLoading ? (
                  <ActivityIndicator size="small" color={T.gold} style={{ marginVertical: 12 }} />
                ) : (
                  <AstroText style={styles.sumTxt}
                    text={aiAnalysis || `Your charts reveal a ${synastry.discepoloAnalysis.category.toLowerCase()} connection. ${synastry.discepoloAnalysis.isDestinySign ? 'You share the same Sun sign modality — a powerful destiny bond.' : ''} The synastry reveals ${synastry.interAspects.length} inter-aspects worth exploring.`}
                  />
                )}
                {synastry.discepoloAnalysis.isDestinySign && (
                  <View style={styles.destinyBadge}>
                    <Text style={styles.destinyBadgeText}>✦ DESTINY SIGN MATCH</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Detailed Match Areas */}
          {matchDetails?.areas && (
            <>
              <Text style={styles.dimLbl}>RELATIONSHIP AREAS</Text>
              {Object.entries(matchDetails.areas).map(([key, area], i) => (
                <View key={i} style={styles.areaCard}>
                  <View style={styles.areaHeader}>
                    <Text style={styles.areaName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                    <Text style={styles.areaScore}>{area.score}%</Text>
                  </View>
                  <View style={[styles.sbarTrack, { marginBottom: 8 }]}>
                    <View style={[styles.sbarFill, { width: `${area.score}%`, backgroundColor: area.score >= 70 ? '#7EC8A0' : area.score >= 50 ? T.gold : '#E87878' }]} />
                  </View>
                  <AstroText text={area.strength} style={styles.areaStrength} />
                  {area.tension && (
                    <AstroText text={area.tension} style={styles.areaTension} />
                  )}
                  {area.reflection && (
                    <AstroText text={area.reflection} style={styles.areaReflection} />
                  )}
                </View>
              ))}
            </>
          )}
          {detailsLoading && synastry && (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <ActivityIndicator size="small" color={T.gold} />
              <Text style={{ fontSize: 12, color: T.stone, marginTop: 6 }}>Analyzing your connection...</Text>
            </View>
          )}

          {/* Shared Values */}
          {matchDetails?.sharedValues && matchDetails.sharedValues.length > 0 && (
            <>
              <Text style={styles.dimLbl}>SHARED VALUES</Text>
              <View style={styles.linksWrap}>
                {matchDetails.sharedValues.map((v, i) => (
                  <View key={i} style={[styles.linkChip, { backgroundColor: 'rgba(200,168,75,0.1)', borderColor: 'rgba(200,168,75,0.3)' }]}>
                    <Text style={[styles.linkChipText, { color: T.gold }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Aspect Links */}
          {synastry && synastry.links.length > 0 && (
            <>
              <Text style={styles.dimLbl}>KEY CONNECTIONS</Text>
              <View style={styles.linksWrap}>
                {synastry.links.slice(0, 6).map((link, i) => (
                  <View key={i} style={[styles.linkChip, link.isFriction && styles.linkChipHard]}>
                    <Text style={[styles.linkChipText, link.isFriction && styles.linkChipTextHard]}>
                      {link.label} {link.description}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Partner selector */}
          {partnerProfiles.length > 0 && (
            <>
              <Text style={[styles.dimLbl, { marginTop: 8 }]}>YOUR MATCHES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {partnerProfiles.map((p, i) => (
                  <TouchableOpacity key={p.id} onPress={() => setSelectedPartnerIdx(i)}
                    style={[styles.partnerChip, selectedPartnerIdx === i && styles.partnerChipOn]}>
                    <View style={[styles.partnerChipOrb, { backgroundColor: selectedPartnerIdx === i ? T.navy : '#EDE6D8' }]}>
                      <Text style={{ fontSize: 13, color: selectedPartnerIdx === i ? T.gold : T.stone }}>{getInitial(p.name)}</Text>
                    </View>
                    <Text style={[styles.partnerChipName, selectedPartnerIdx === i && { color: T.navy }]}>{p.name?.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Download full report */}
          {synastry && (
            <TouchableOpacity style={styles.downloadCard} activeOpacity={0.8} onPress={handleDownloadReport} disabled={pdfLoading}>
              <LinearGradient colors={['#1A0828', '#2D0A1E', '#0D0515']} style={styles.downloadGrad}>
                <View style={styles.downloadGlow} />
                <View style={styles.downloadTop}>
                  <View style={styles.downloadIconWrap}>
                    <Text style={styles.downloadIcon}>♡</Text>
                  </View>
                  <View style={styles.downloadBadge}>
                    <Text style={styles.downloadBadgeText}>PDF</Text>
                  </View>
                </View>
                <Text style={styles.downloadTitle}>Download Full Report</Text>
                <Text style={styles.downloadSub}>Get a detailed compatibility analysis with love languages, conflict styles, and long-term forecast</Text>
                <View style={styles.downloadCta}>
                  <Text style={styles.downloadCtaText}>Generate Report ↓</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Add partner */}
          <TouchableOpacity style={styles.addPartner} activeOpacity={0.7} onPress={() => setShowAddModal(true)}>
            <View style={styles.addPartnerIcon}><Text style={{ fontSize: 18 }}>+</Text></View>
            <View>
              <Text style={styles.addPartnerTitle}>Compare with someone else</Text>
              <Text style={styles.addPartnerSub}>Enter their birth details</Text>
            </View>
          </TouchableOpacity>

          {/* Remove partner option */}
          {partnerProfile && (
            <TouchableOpacity onPress={() => handleRemovePartner(partnerProfile)} style={{ alignSelf: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: T.stone }}>Remove {partnerProfile.name?.split(' ')[0]}</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Offscreen share cards for capture */}
      {synastry && (
        <View style={{ position: 'absolute', left: -9999 }}>
          <CompatibilityShareCard
            innerRef={matchCardRef}
            user={{ name: userProfile.name?.split(' ')[0], sign: userSun?.sign, initial: (userProfile.name || '?')[0].toUpperCase() }}
            partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign, initial: (partnerProfile?.name || '?')[0].toUpperCase() }}
            score={synastry.harmonyScore}
            verdict={getScoreLabel(synastry.harmonyScore)}
          />
          <MatchStoryCard
            innerRef={storyCardRef}
            user={{ name: userProfile.name?.split(' ')[0], sign: userSun?.sign }}
            partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign }}
            score={synastry.harmonyScore}
            verdict={getScoreLabel(synastry.harmonyScore)}
            insights={viralInsights}
            themeIndex={storyTheme}
          />
        </View>
      )}

      {/* Story Card Share Modal */}
      <Modal visible={showStoryModal} transparent animationType="fade">
        <View style={styles.storyOverlay}>
          {/* Top bar */}
          <View style={styles.storyTopBar}>
            <TouchableOpacity onPress={() => setShowStoryModal(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.storyCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.storyModalTitle}>Share Your Match</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Card preview */}
          <View style={styles.storyPreview}>
            <View style={styles.storyCardWrap}>
              <MatchStoryCard
                user={{ name: userProfile?.name?.split(' ')[0], sign: userSun?.sign }}
                partner={{ name: partnerProfile?.name?.split(' ')[0], sign: partnerSun?.sign }}
                score={synastry?.harmonyScore || 0}
                verdict={getScoreLabel(synastry?.harmonyScore || 0)}
                insights={viralInsights}
                themeIndex={storyTheme}
              />
              {viralLoading && (
                <View style={styles.storyLoadingOverlay}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.storyLoadingText}>Reading your charts...</Text>
                </View>
              )}
            </View>
          </View>

          {/* Theme selector with labels */}
          <View style={styles.storyThemeSection}>
            <Text style={styles.storyThemeLabel}>STYLE</Text>
            <View style={styles.storyThemeRow}>
              {STORY_THEMES.map((theme, i) => (
                <TouchableOpacity key={i} onPress={() => setStoryTheme(i)} activeOpacity={0.7}
                  style={[styles.storyThemeOption, storyTheme === i && styles.storyThemeOptionOn]}>
                  <View style={[styles.storyThemeSwatch, { backgroundColor: theme.dot }]} />
                  <Text style={[styles.storyThemeName, storyTheme === i && { color: 'white' }]}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Share button */}
          <TouchableOpacity style={styles.storyShareBtn} activeOpacity={0.8}
            onPress={handleShareStoryCapture} disabled={viralLoading}>
            <LinearGradient colors={[STORY_THEMES[storyTheme].dot, STORY_THEMES[storyTheme].dot + '60']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.storyShareGrad}>
              <Text style={styles.storyShareText}>Share</Text>
              <Text style={styles.storyShareArrow}>↗</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Cinematic PDF Generation Overlay */}
      <GenerationOverlay
        visible={pdfLoading}
        currentStep={genStep}
        totalSteps={MATCH_THEME.steps.length}
        onCancel={handleCancelPdf}
        theme={MATCH_THEME}
      />

      {/* Add Partner Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Person</Text>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>THEIR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={T.stone}
              value={partnerName}
              onChangeText={setPartnerName}
            />

            <Text style={styles.fieldLabel}>BIRTH DATE</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: partnerDate ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>
                {partnerDate
                  ? partnerDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={partnerDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setPartnerDate(d); }}
              />
            )}

            <Text style={styles.fieldLabel}>BIRTH TIME</Text>
            <TouchableOpacity style={[styles.input, isTimeUnknown && { opacity: 0.4 }]}
              onPress={() => !isTimeUnknown && setShowTimePicker(true)}>
              <Text style={{ color: (isTimeUnknown || partnerTime) ? T.navy : T.stone, fontFamily: FONTS.sansMedium }}>
                {isTimeUnknown ? 'Unknown' : (partnerTime
                  ? partnerTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : 'Select time')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={partnerTime || new Date(2000, 0, 1, 12, 0)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setPartnerTime(t); }}
              />
            )}
            <TouchableOpacity style={styles.checkRow} onPress={() => setIsTimeUnknown(!isTimeUnknown)}>
              <View style={[styles.check, isTimeUnknown && styles.checkOn]}>
                {isTimeUnknown && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>I don't know the exact birth time</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>BIRTH CITY</Text>
            <TextInput
              style={styles.input}
              placeholder="Search city..."
              placeholderTextColor={T.stone}
              value={selectedCity ? selectedCity.name : citySearch}
              onChangeText={(t) => { setSelectedCity(null); handleCitySearch(t); }}
            />
            {citySearching && (
              <View style={[styles.suggestions, { padding: 12, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={T.gold} />
              </View>
            )}
            {!citySearching && citySuggestions.length > 0 && (
              <View style={styles.suggestions}>
                {citySuggestions.map((c, i) => (
                  <TouchableOpacity key={i} style={styles.suggestion}
                    onPress={() => { setSelectedCity(c); setCitySearch(c.name); setCitySuggestions([]); }}>
                    <Text style={{ color: T.navy, fontSize: 14 }} numberOfLines={2}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, (!partnerName.trim() || !selectedCity) && { opacity: 0.5 }]}
              onPress={handleSavePartner}
              disabled={savingPartner || !partnerName.trim() || !selectedCity}
            >
              {savingPartner
                ? <ActivityIndicator color="white" />
                : <Text style={styles.saveBtnText}>Calculate Compatibility</Text>
              }
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ── HTML generator for compatibility PDF ─────────────────────────────────────
const esc = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const nl2p = (text, cls = 'body') => (text || '').split(/\n\n+/).filter(Boolean).map(p => `<p class="${cls}">${esc(p)}</p>`).join('');

const generateMatchReportHTML = (report, user, partner, synastry) => {
  const p1Name = user?.name?.split(' ')[0] || 'You';
  const p2Name = partner?.name?.split(' ')[0] || 'Partner';
  const p1Sun = user?.chart?.planets?.find(p => p.name === 'Sun');
  const p1Moon = user?.chart?.planets?.find(p => p.name === 'Moon');
  const p1Rising = user?.chart?.planets?.find(p => p.name === 'Ascendant');
  const p2Sun = partner?.chart?.planets?.find(p => p.name === 'Sun');
  const p2Moon = partner?.chart?.planets?.find(p => p.name === 'Moon');
  const p2Rising = partner?.chart?.planets?.find(p => p.name === 'Ascendant');
  const score = synastry?.harmonyScore || 0;
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const ZODIAC_RING = '♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓';
  const AREA_COLORS = { emotional: '#7D2645', communication: '#1A3A6E', attraction: '#9A3030', stability: '#5C4A15' };

  const scoreBars = [
    { label: 'Emotional', pct: synastry?.scores?.emotional || 0, color: '#E85090' },
    { label: 'Communication', pct: synastry?.scores?.communication || 0, color: '#50A0C8' },
    { label: 'Attraction', pct: synastry?.scores?.attraction || 0, color: '#E86050' },
    { label: 'Stability', pct: synastry?.scores?.stability || 0, color: '#C49A2A' },
  ];

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page { margin: 0; size: letter; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; background: #FAF8F3; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page-break { page-break-before: always; }

/* Cover */
.cover { width: 100%; height: 100vh; background: #0B0E1A; page-break-after: always; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 40px; }
.cover-border { position: absolute; top: 30px; left: 30px; right: 30px; bottom: 30px; border: 0.5px solid rgba(196,154,42,0.3); }
.cover-inner { position: relative; z-index: 2; text-align: center; width: 100%; }
.cover-brand { font-size: 10px; font-weight: 700; color: #C49A2A; letter-spacing: 6px; text-transform: uppercase; font-family: Helvetica, sans-serif; margin-bottom: 16px; }
.cover-rule { width: 100px; height: 0.5px; background: #C49A2A; margin: 0 auto 20px; }
.cover-badge { display: inline-block; border: 0.5px solid rgba(196,154,42,0.4); border-radius: 2px; padding: 4px 16px; font-size: 8px; color: #F5E6A8; letter-spacing: 3.5px; text-transform: uppercase; font-family: Helvetica, sans-serif; margin-bottom: 24px; }
.cover-zodiac { font-size: 7px; color: rgba(196,154,42,0.25); letter-spacing: 6px; margin-bottom: 20px; }
.cover-names { font-size: 36px; font-weight: 700; color: #FAF8F3; letter-spacing: 1px; margin-bottom: 6px; line-height: 1.3; }
.cover-amp { color: #C49A2A; font-style: italic; }
.cover-signs { font-size: 13px; color: rgba(250,248,243,0.5); letter-spacing: 1.5px; margin-bottom: 18px; font-family: Helvetica, sans-serif; }
.cover-divider { display: flex; align-items: center; gap: 8px; justify-content: center; margin-bottom: 16px; }
.cover-line { width: 70px; height: 0.5px; background: rgba(196,154,42,0.5); }
.cover-star { font-size: 10px; color: rgba(196,154,42,0.6); }
.cover-headline { font-size: 13.5px; font-style: italic; color: #C49A2A; line-height: 1.8; max-width: 360px; margin: 0 auto 20px; }
.cover-score { font-size: 52px; font-weight: 700; color: #FAF8F3; margin-bottom: 4px; }
.cover-score-label { font-size: 9px; color: rgba(196,154,42,0.7); letter-spacing: 3px; text-transform: uppercase; font-family: Helvetica, sans-serif; margin-bottom: 20px; }
.cover-pills { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.cover-pill { border: 0.5px solid rgba(196,154,42,0.35); border-radius: 3px; padding: 6px 14px; text-align: center; background: rgba(196,154,42,0.04); }
.cover-pill-sign { font-size: 11px; font-weight: 700; color: #FAF8F3; margin-bottom: 2px; }
.cover-pill-role { font-size: 6.5px; color: rgba(196,154,42,0.7); letter-spacing: 2px; text-transform: uppercase; font-weight: 700; font-family: Helvetica, sans-serif; }
.cover-foot { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; z-index: 2; }
.cover-foot-text { font-size: 7px; color: rgba(196,154,42,0.3); letter-spacing: 2px; font-family: Helvetica, sans-serif; }
.cover-foot-date { font-size: 6.5px; color: rgba(250,248,243,0.2); letter-spacing: 1px; margin-top: 3px; font-family: Helvetica, sans-serif; }

/* Page header/footer */
.ph { background: #0D1527; padding: 13px 45px; display: flex; justify-content: space-between; align-items: center; font-family: Helvetica, sans-serif; margin-bottom: 24px; }
.ph-left { font-size: 8px; font-weight: 700; color: #C49A2A; letter-spacing: 3px; text-transform: uppercase; }
.ph-right { font-size: 7px; color: #F5E6A8; letter-spacing: 1.2px; }
.pf { font-family: Helvetica, sans-serif; font-size: 7px; color: #9C9590; letter-spacing: 0.5px; text-align: center; padding: 12px 45px; border-top: 1px solid #E0DAD3; margin-top: auto; }
.pc { padding: 0 45px 20px; }

/* Section labels */
.sl { font-size: 9px; font-weight: 700; color: #C49A2A; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 6px; margin-top: 4px; font-family: Helvetica, sans-serif; }
.sr { border-bottom: 1px solid #C49A2A; opacity: 0.35; margin-bottom: 16px; }

/* Body text */
.body { font-size: 10.5px; color: #1A1614; line-height: 1.85; margin-bottom: 10px; text-align: justify; }
.ornament { color: #C49A2A; text-align: center; letter-spacing: 10px; font-size: 14px; margin: 22px 0; opacity: 0.7; }

/* Score bars */
.sbar-row { margin-bottom: 10px; }
.sbar-top { display: flex; justify-content: space-between; margin-bottom: 3px; }
.sbar-name { font-size: 9px; color: #5C5650; font-family: Helvetica, sans-serif; }
.sbar-pct { font-size: 9px; color: #C49A2A; font-weight: 600; font-family: Helvetica, sans-serif; }
.sbar-track { height: 6px; background: #EDEBE8; border-radius: 3px; overflow: hidden; }
.sbar-fill { height: 100%; border-radius: 3px; }

/* Section band */
.section-band { background: #0D1527; margin: 0 -45px; padding: 14px 45px; display: flex; align-items: center; gap: 14px; page-break-inside: avoid; page-break-after: avoid; }
.section-icon { font-size: 18px; color: #C49A2A; min-width: 24px; text-align: center; }
.section-title { font-size: 15px; font-weight: 700; color: #FAF8F3; margin-bottom: 2px; }
.section-sub { font-size: 9px; color: #F5E6A8; font-family: Helvetica, sans-serif; letter-spacing: 0.5px; }
.section-content { padding: 16px 0 8px; }

/* Callout boxes */
.callout { border-radius: 5px; padding: 12px 14px; margin: 10px 0 12px; display: flex; gap: 10px; align-items: flex-start; page-break-inside: avoid; }
.callout-icon { font-size: 14px; color: #C49A2A; min-width: 18px; text-align: center; margin-top: 1px; }
.callout-label { font-size: 7.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; display: block; font-family: Helvetica, sans-serif; }
.callout-text { font-size: 10px; color: #1A1614; line-height: 1.65; }
.gold-callout { background: #FDF8ED; border-left: 3px solid #C49A2A; }
.gold-label { color: #C49A2A; }
.pink-callout { background: #FDF0F4; border-left: 3px solid #E85090; }
.pink-label { color: #E85090; }
.blue-callout { background: #F0F6FA; border-left: 3px solid #50A0C8; }
.blue-label { color: #50A0C8; }
.red-callout { background: #FDF2F0; border-left: 3px solid #E86050; }
.red-label { color: #E86050; }

/* Advice list */
.advice-item { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; page-break-inside: avoid; }
.advice-num { font-size: 10px; font-weight: 700; color: #C49A2A; min-width: 18px; font-family: Helvetica, sans-serif; }
.advice-text { font-size: 10.5px; color: #1A1614; line-height: 1.7; }

/* Growth cards */
.growth-row { display: flex; gap: 12px; margin-bottom: 12px; }
.growth-card { flex: 1; background: #FFFFFF; border: 1px solid #E0DAD3; border-radius: 5px; padding: 14px; page-break-inside: avoid; }
.growth-title { font-size: 10px; font-weight: 700; color: #0D1527; margin-bottom: 6px; }
.growth-text { font-size: 9.5px; color: #5C5650; line-height: 1.65; }

/* Closing */
.closing { background: #0D1527; width: 100%; height: 100vh; padding: 0; page-break-before: always; display: flex; flex-direction: column; position: relative; }
.closing-content { padding: 0 45px; flex: 1; position: relative; z-index: 1; }
.closing-body { font-size: 10.5px; color: #E8E4DF; line-height: 1.9; margin-bottom: 14px; text-align: justify; }
.closing-verdict { border: 1px solid rgba(196,154,42,0.6); border-radius: 6px; padding: 22px 30px; margin: 0 auto 36px; max-width: 400px; text-align: center; }
.closing-verdict-text { font-size: 18px; font-weight: 700; color: #C49A2A; letter-spacing: 3px; }
.closing-brand { text-align: center; padding: 24px 45px 32px; border-top: 1px solid rgba(196,154,42,0.2); position: relative; z-index: 1; }
.closing-brand-name { font-size: 18px; font-weight: 700; color: #C49A2A; letter-spacing: 4px; margin-bottom: 6px; }
.closing-tagline { font-size: 10px; color: #F5E6A8; font-style: italic; margin-bottom: 18px; }
.closing-disclaimer { font-size: 7.5px; color: #4A4035; line-height: 1.7; text-align: center; font-family: Helvetica, sans-serif; }
</style></head><body>

<!-- COVER -->
<div class="cover">
  <div class="cover-border"></div>
  <div class="cover-inner">
    <div class="cover-brand">CELESTIA</div>
    <div class="cover-rule"></div>
    <div class="cover-badge">Compatibility Report</div>
    <div class="cover-zodiac">${ZODIAC_RING}</div>
    <div class="cover-names">${esc(p1Name)} <span class="cover-amp">&</span> ${esc(p2Name)}</div>
    <div class="cover-signs">${p1Sun?.sign || '—'} ♡ ${p2Sun?.sign || '—'}</div>
    <div class="cover-divider"><div class="cover-line"></div><div class="cover-star">♡</div><div class="cover-line"></div></div>
    <div class="cover-headline">"${esc(report.headline || '')}"</div>
    <div class="cover-score">${score}%</div>
    <div class="cover-score-label">COMPATIBILITY SCORE</div>
    <div class="cover-pills">
      <div class="cover-pill"><div class="cover-pill-sign">${esc(p1Name)}</div><div class="cover-pill-role">☉ ${p1Sun?.sign || '—'} · ☽ ${p1Moon?.sign || '—'}</div></div>
      <div class="cover-pill"><div class="cover-pill-sign">${esc(p2Name)}</div><div class="cover-pill-role">☉ ${p2Sun?.sign || '—'} · ☽ ${p2Moon?.sign || '—'}</div></div>
    </div>
  </div>
  <div class="cover-foot">
    <div class="cover-foot-text">YOUR STARS, YOUR STORY</div>
    <div class="cover-foot-date">${esc(genDate)}</div>
  </div>
</div>

<!-- OVERVIEW PAGE -->
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · OVERVIEW</span></div>
<div class="pc">
  <div class="sl">YOUR COMPATIBILITY OVERVIEW</div>
  <div class="sr"></div>
  <p class="body" style="font-style:italic;color:#C49A2A;font-size:12px;margin-bottom:16px">"${esc(report.tagline || '')}"</p>
  ${nl2p(report.overview)}
  <div class="ornament">· · ·</div>
  <div class="sl">SCORE BREAKDOWN</div>
  <div class="sr"></div>
  ${scoreBars.map(b => `<div class="sbar-row"><div class="sbar-top"><span class="sbar-name">${b.label}</span><span class="sbar-pct">${b.pct}%</span></div><div class="sbar-track"><div class="sbar-fill" style="width:${b.pct}%;background:${b.color}"></div></div></div>`).join('')}
</div>
<div class="pf">Celestia · Compatibility Report · ${esc(p1Name)} & ${esc(p2Name)}</div>

<!-- SOUL CONNECTION & EMOTIONAL -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DEEP DIVE</span></div>
<div class="pc">
  <div class="section-band" style="margin:0 -45px;padding:14px 45px">
    <span class="section-icon">♡</span>
    <div><div class="section-title">${esc(report.soulConnection?.title || 'Soul Connection')}</div><div class="section-sub">What draws you together</div></div>
  </div>
  <div class="section-content">
    ${nl2p(report.soulConnection?.description)}
  </div>
  <div class="ornament">· · ·</div>
  <div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228">
    <span class="section-icon">☽</span>
    <div><div class="section-title">${esc(report.emotionalDynamic?.title || 'Emotional Dynamic')}</div><div class="section-sub">How you love</div></div>
  </div>
  <div class="section-content">
    <div class="callout pink-callout">
      <div class="callout-icon">☽</div>
      <div><div class="callout-label pink-label">${esc(p1Name.toUpperCase())}'S HEART</div><p class="callout-text">${esc(report.emotionalDynamic?.howYouLove)}</p></div>
    </div>
    <div class="callout blue-callout">
      <div class="callout-icon">☽</div>
      <div><div class="callout-label blue-label">${esc(p2Name.toUpperCase())}'S HEART</div><p class="callout-text">${esc(report.emotionalDynamic?.howTheyLove)}</p></div>
    </div>
    <div class="callout gold-callout">
      <div class="callout-icon">♡</div>
      <div><div class="callout-label gold-label">TOGETHER</div><p class="callout-text">${esc(report.emotionalDynamic?.together)}</p></div>
    </div>
  </div>
</div>
<div class="pf">Celestia · Compatibility Report · ${esc(p1Name)} & ${esc(p2Name)}</div>

<!-- COMMUNICATION & ATTRACTION -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · DYNAMICS</span></div>
<div class="pc">
  <div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#0D2535">
    <span class="section-icon">☿</span>
    <div><div class="section-title">${esc(report.communicationStyle?.title || 'Communication')}</div><div class="section-sub">How you connect mentally</div></div>
  </div>
  <div class="section-content">
    ${nl2p(report.communicationStyle?.dynamic)}
    <div class="callout gold-callout">
      <div class="callout-icon">✦</div>
      <div><div class="callout-label gold-label">PRO TIP</div><p class="callout-text">${esc(report.communicationStyle?.tip)}</p></div>
    </div>
  </div>
  <div class="ornament">· · ·</div>
  <div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#2A1008">
    <span class="section-icon">♀</span>
    <div><div class="section-title">${esc(report.attraction?.title || 'Attraction')}</div><div class="section-sub">The magnetic pull between you</div></div>
  </div>
  <div class="section-content">
    <div class="callout red-callout">
      <div class="callout-icon">♂</div>
      <div><div class="callout-label red-label">THE SPARK</div><p class="callout-text">${esc(report.attraction?.spark)}</p></div>
    </div>
    <div class="callout gold-callout">
      <div class="callout-icon">△</div>
      <div><div class="callout-label gold-label">THE TENSION</div><p class="callout-text">${esc(report.attraction?.tension)}</p></div>
    </div>
  </div>
</div>
<div class="pf">Celestia · Compatibility Report · ${esc(p1Name)} & ${esc(p2Name)}</div>

<!-- GROWTH, LOVE LANGUAGES, CONFLICT -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · GROWTH</span></div>
<div class="pc">
  <div class="sl">GROWTH AREAS</div>
  <div class="sr"></div>
  <div class="growth-row">
    ${(report.growthAreas || []).map(g => `<div class="growth-card"><div class="growth-title">${esc(g.title)}</div><div class="growth-text">${esc(g.insight)}</div></div>`).join('')}
  </div>
  <div class="ornament">· · ·</div>
  <div class="sl">LOVE LANGUAGES</div>
  <div class="sr"></div>
  <div class="callout pink-callout">
    <div class="callout-icon">♀</div>
    <div><div class="callout-label pink-label">${esc(p1Name.toUpperCase())}</div><p class="callout-text">${esc(report.loveLanguages?.user)}</p></div>
  </div>
  <div class="callout blue-callout">
    <div class="callout-icon">♀</div>
    <div><div class="callout-label blue-label">${esc(p2Name.toUpperCase())}</div><p class="callout-text">${esc(report.loveLanguages?.partner)}</p></div>
  </div>
  <div class="ornament">· · ·</div>
  <div class="sl">CONFLICT STYLE</div>
  <div class="sr"></div>
  <div class="callout red-callout">
    <div class="callout-icon">♂</div>
    <div><div class="callout-label red-label">TRIGGERS</div><p class="callout-text">${esc(report.conflictStyle?.triggers)}</p></div>
  </div>
  <div class="callout gold-callout">
    <div class="callout-icon">✦</div>
    <div><div class="callout-label gold-label">RESOLUTION</div><p class="callout-text">${esc(report.conflictStyle?.resolution)}</p></div>
  </div>
</div>
<div class="pf">Celestia · Compatibility Report · ${esc(p1Name)} & ${esc(p2Name)}</div>

<!-- LONG TERM & ADVICE -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · FUTURE</span></div>
<div class="pc">
  <div class="section-band" style="margin:0 -45px;padding:14px 45px;background:#1A1228">
    <span class="section-icon">♄</span>
    <div><div class="section-title">Long-Term Potential</div><div class="section-sub">Where this is heading</div></div>
  </div>
  <div class="section-content">
    ${nl2p(report.longTerm?.forecast)}
    <div class="callout gold-callout">
      <div class="callout-icon">✦</div>
      <div><div class="callout-label gold-label">THE VERDICT</div><p class="callout-text" style="font-weight:700">${esc(report.longTerm?.verdict)}</p></div>
    </div>
  </div>
  <div class="ornament">· · ·</div>
  <div class="sl">RELATIONSHIP ADVICE</div>
  <div class="sr"></div>
  ${(report.advice || []).map((a, i) => `<div class="advice-item"><span class="advice-num">${i + 1}.</span><span class="advice-text">${esc(a)}</span></div>`).join('')}
</div>
<div class="pf">Celestia · Compatibility Report · ${esc(p1Name)} & ${esc(p2Name)}</div>

<!-- CLOSING -->
<div class="closing">
  <div class="ph" style="background:rgba(255,255,255,0.04)"><span class="ph-left">CELESTIA</span><span class="ph-right">${esc(p1Name.toUpperCase())} & ${esc(p2Name.toUpperCase())} · YOUR COSMIC JOURNEY</span></div>
  <div class="closing-content">
    <div style="margin-bottom:32px">
      ${nl2p(report.closingMessage, 'closing-body')}
    </div>
    <div style="color:#C49A2A;text-align:center;letter-spacing:12px;font-size:12px;margin:26px 0;opacity:0.6">· · ·</div>
    <div class="closing-verdict">
      <div class="closing-verdict-text">${esc(report.cosmicVerdict || '')}</div>
    </div>
  </div>
  <div class="closing-brand">
    <div class="closing-brand-name">CELESTIA</div>
    <div class="closing-tagline">Your stars, your story</div>
    <div class="closing-disclaimer">This report was generated using astronomical calculations and AI interpretation.<br/>For entertainment and self-reflection purposes. ${esc(genDate)}</div>
  </div>
</div>

</body></html>`;
};

const styles = StyleSheet.create({
  hero: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 26, overflow: 'hidden', position: 'relative', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(200,168,75,0.08)', left: -60, top: -60 },
  title: { fontFamily: FONTS.serif, fontSize: 30, color: T.cream, marginBottom: 3 },
  sub: { fontSize: 12.5, color: 'rgba(250,248,242,0.4)' },
  pairDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingBottom: 4 },
  pairPerson: { alignItems: 'center', gap: 7 },
  pairOrb: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 18, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.14)' },
  pairOrbEmpty: { backgroundColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' },
  pairOrbText: { fontFamily: FONTS.serif, fontSize: 25, color: 'white' },
  pairName: { fontSize: 12, fontFamily: FONTS.sansMedium, color: 'rgba(250,248,242,0.68)' },
  pairSign: { fontSize: 11, color: 'rgba(250,248,242,0.38)' },
  pairConnector: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -4 },
  pairLine: { width: 38, height: 1, backgroundColor: 'rgba(200,168,75,0.3)' },
  pairHeart: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#E85090', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18 },
  scoreBelt: { flexDirection: 'row', gap: 10, paddingTop: 16 },
  scoreMain: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, paddingHorizontal: 12, alignItems: 'center', gap: 5, minWidth: 92 },
  scoreRingWrap: { alignItems: 'center', justifyContent: 'center' },
  scoreNum: { position: 'absolute', fontFamily: FONTS.serif, fontSize: 22, color: 'white' },
  scoreLbl: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: 'rgba(250,248,242,0.38)', textAlign: 'center' },
  scoreVerdict: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 11, color: 'rgba(250,248,242,0.6)', textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },
  scoreBars: { flex: 1, justifyContent: 'center', gap: 8 },
  sbarRow: { gap: 3 },
  sbarTop: { flexDirection: 'row', justifyContent: 'space-between' },
  sbarName: { fontSize: 10, color: 'rgba(250,248,242,0.5)' },
  sbarPct: { fontSize: 10, color: 'rgba(200,168,75,0.8)', fontFamily: FONTS.sansMedium },
  sbarTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  sbarFill: { height: '100%', borderRadius: 3 },
  noPartnerHint: { paddingVertical: 20, alignItems: 'center' },
  body: { padding: 20, paddingTop: 20 },
  sumCard: { borderRadius: 18, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 18 },
  sumHd: { padding: 15, paddingHorizontal: 17, paddingBottom: 13 },
  sumLbl: { fontSize: 10, letterSpacing: 2, color: 'rgba(200,168,75,0.58)', marginBottom: 5 },
  sumTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.cream, lineHeight: 23 },
  sumBody: { backgroundColor: 'white', padding: 13, paddingHorizontal: 17, paddingBottom: 15 },
  sumTxt: { fontSize: 13, color: T.ink, lineHeight: 21, marginBottom: 8 },
  destinyBadge: { backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(200,168,75,0.3)' },
  destinyBadgeText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: T.gold, letterSpacing: 1.5 },
  dimLbl: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },
  linksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  linkChip: { backgroundColor: 'rgba(126,200,160,0.12)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(126,200,160,0.3)' },
  linkChipHard: { backgroundColor: 'rgba(232,120,120,0.1)', borderColor: 'rgba(232,120,120,0.3)' },
  linkChipText: { fontSize: 11, color: '#7EC8A0', fontFamily: FONTS.sansMedium },
  linkChipTextHard: { color: '#E87878' },
  partnerChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EDE6D8', borderRadius: 100, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8 },
  partnerChipOn: { backgroundColor: T.navy + '18', borderWidth: 1, borderColor: T.navy + '30' },
  partnerChipOrb: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  partnerChipName: { fontSize: 13, color: T.stone, fontFamily: FONTS.sansMedium },
  addPartner: { backgroundColor: 'white', borderRadius: 17, padding: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D4CFC4', flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  addPartnerIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(200,168,75,0.3)', alignItems: 'center', justifyContent: 'center' },
  addPartnerTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 2 },
  addPartnerSub: { fontSize: 11.5, color: T.stone },
  // Modal
  modal: { flex: 1, backgroundColor: T.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
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
  // Area cards
  areaCard: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border },
  areaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  areaName: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy },
  areaScore: { fontSize: 14, fontFamily: FONTS.serif, color: T.gold },
  areaStrength: { fontSize: 12.5, color: '#4A8060', lineHeight: 19, marginBottom: 4 },
  areaTension: { fontSize: 12.5, color: '#A06050', lineHeight: 19, marginBottom: 4 },
  areaReflection: { fontSize: 12, color: T.stone, fontStyle: 'italic', marginTop: 4 },
  // Share to stories button
  shareStoryBtn: { alignSelf: 'center', borderRadius: 100, overflow: 'hidden', marginTop: 14 },
  shareStoryGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 22 },
  shareStoryIcon: { fontSize: 14, color: 'white', fontWeight: '600' },
  shareStoryText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: 'white' },
  inviteBtn: { alignSelf: 'center', marginTop: 10, borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 22 },
  inviteBtnText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  // Story modal
  storyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  storyTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44 },
  storyCloseText: { color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: '300' },
  storyModalTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  storyPreview: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  storyCardWrap: { borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.6, shadowRadius: 40, transform: [{ scale: 0.82 }] },
  storyLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 10 },
  storyLoadingText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: FONTS.sansMedium },
  storyThemeSection: { alignItems: 'center', marginBottom: 16 },
  storyThemeLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.5, color: 'rgba(255,255,255,0.25)', marginBottom: 10 },
  storyThemeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storyThemeOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  storyThemeOptionOn: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)' },
  storyThemeSwatch: { width: 10, height: 10, borderRadius: 5 },
  storyThemeName: { fontSize: 12, fontFamily: FONTS.sansMedium, color: 'rgba(255,255,255,0.35)' },
  storyShareBtn: { borderRadius: 100, overflow: 'hidden', width: '75%' },
  storyShareGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  storyShareText: { fontSize: 16, fontFamily: FONTS.sansSemiBold, color: 'white', letterSpacing: 0.5 },
  storyShareArrow: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '300' },
  // Download report card
  downloadCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, shadowColor: '#2D0A1E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 20 },
  downloadGrad: { padding: 20, position: 'relative', overflow: 'hidden' },
  downloadGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(232,80,144,0.1)', right: -40, top: -40 },
  downloadTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  downloadIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(232,80,144,0.15)', borderWidth: 1, borderColor: 'rgba(232,80,144,0.3)', alignItems: 'center', justifyContent: 'center' },
  downloadIcon: { fontSize: 20, color: '#E85090' },
  downloadBadge: { backgroundColor: 'rgba(232,80,144,0.15)', borderWidth: 1, borderColor: 'rgba(232,80,144,0.3)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  downloadBadgeText: { fontSize: 9, fontFamily: FONTS.sansSemiBold, color: '#E85090', letterSpacing: 1.5 },
  downloadTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.cream, marginBottom: 6 },
  downloadSub: { fontSize: 12.5, color: 'rgba(250,248,242,0.5)', lineHeight: 18, marginBottom: 16 },
  downloadCta: { backgroundColor: 'rgba(232,80,144,0.2)', borderWidth: 1, borderColor: 'rgba(232,80,144,0.35)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  downloadCtaText: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: '#E85090' },
});
