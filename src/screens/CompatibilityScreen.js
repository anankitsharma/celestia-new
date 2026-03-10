import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Alert, Platform, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateSynastryScore } from '../services/astrology/SynastryService';
import { calculateChart } from '../services/astrologyService';
import { generateMatchCore, generateMatchDetails } from '../services/geminiService';
import * as Crypto from 'expo-crypto';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
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
  }, [synastry?.harmonyScore, partnerProfile?.id]);

  const loadAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const report = await generateMatchCore(userProfile, partnerProfile, synastry);
      if (report?.snapshot) setAiAnalysis(report.snapshot);
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
      const chart = await calculateChart(dateStr, timeStr, { lat: selectedCity.lat, lon: selectedCity.lng, name: selectedCity.name }, isTimeUnknown, 'whole');
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
          <Text style={styles.title}>Compatibility</Text>
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
                  <Text style={styles.sumTxt}>
                    {aiAnalysis || `Your charts reveal a ${synastry.discepoloAnalysis.category.toLowerCase()} connection. ${synastry.discepoloAnalysis.isDestinySign ? 'You share the same Sun sign modality — a powerful destiny bond.' : ''} The synastry reveals ${synastry.interAspects.length} inter-aspects worth exploring.`}
                  </Text>
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
                  <Text style={styles.areaStrength}>{area.strength}</Text>
                  {area.tension && (
                    <Text style={styles.areaTension}>{area.tension}</Text>
                  )}
                  {area.reflection && (
                    <Text style={styles.areaReflection}>{area.reflection}</Text>
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
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
});
