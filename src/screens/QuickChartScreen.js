import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Platform, StatusBar, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { calculateChart } from '../services/astrologyService';
import { haptic } from '../services/hapticService';
import * as Crypto from 'expo-crypto';
import { SIGN_ELEMENTS } from '../constants/AstrologyCore';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const PLANET_GLYPHS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', 'North Node': '☊', Ascendant: 'ASC', Midheaven: 'MC' };

const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

const ELEMENT_COLORS = {
  Fire: '#E6A8A1',
  Earth: '#A3C4A5',
  Air: '#F2C6A0',
  Water: '#A3C4DF',
};

const BIG_THREE = ['Sun', 'Moon', 'Ascendant'];

export default function QuickChartScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { addPartner } = useUserProfile();

  // Form state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [birthTime, setBirthTime] = useState(null);
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearching, setCitySearching] = useState(false);

  // Result state
  const [calculating, setCalculating] = useState(false);
  const [chartResult, setChartResult] = useState(null);
  const [birthDetails, setBirthDetails] = useState(null);

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

  const handleCitySearch = (text) => {
    setSelectedCity(null);
    setCitySearch(text);
  };

  const handleCalculate = async () => {
    if (!name.trim()) { Alert.alert('Missing info', 'Please enter a name.'); return; }
    if (!birthDate) { Alert.alert('Missing info', 'Please select a birth date.'); return; }
    if (!selectedCity) { Alert.alert('Missing info', 'Please select a birth city.'); return; }

    setCalculating(true);
    haptic.medium();
    try {
      const dateStr = birthDate.toISOString().split('T')[0];
      const timeStr = (isTimeUnknown || !birthTime)
        ? '12:00'
        : `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`;

      const chart = await calculateChart(
        dateStr,
        timeStr,
        { lat: selectedCity.lat, lng: selectedCity.lng, name: selectedCity.name },
        isTimeUnknown,
        'whole'
      );

      setChartResult(chart);
      setBirthDetails({
        name: name.trim(),
        dateStr,
        timeStr,
        cityName: selectedCity.name,
        isTimeUnknown,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
      });
    } catch (e) {
      console.error('Chart calculation error:', e);
      Alert.alert('Error', 'Failed to calculate chart. Please check the details and try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleCheckCompatibility = async () => {
    if (!chartResult || !birthDetails) return;
    haptic.medium();
    try {
      const partner = {
        id: await Crypto.randomUUID(),
        type: 'other',
        name: birthDetails.name,
        birthDate: birthDetails.dateStr,
        birthTime: birthDetails.timeStr,
        birthLocation: birthDetails.cityName,
        isTimeUnknown: birthDetails.isTimeUnknown,
        chart: chartResult,
      };
      await addPartner(partner);
      navigation.navigate('Main', { screen: 'Circle' });
    } catch (e) {
      console.error('Save partner error:', e);
      Alert.alert('Error', 'Failed to save partner. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!chartResult || !birthDetails) return;
    haptic.light();
    const bigThree = BIG_THREE.map(n => chartResult.planets?.find(p => p.name === n)).filter(Boolean);
    const bigThreeText = bigThree.map(p => `${p.name}: ${ZODIAC_GLYPHS[p.sign] || ''} ${p.sign}`).join('\n');

    const allPlanets = (chartResult.planets || [])
      .filter(p => !BIG_THREE.includes(p.name))
      .map(p => `${PLANET_GLYPHS[p.name] || ''} ${p.name} in ${p.sign}`)
      .join('\n');

    const message = `${birthDetails.name}'s Birth Chart\n\nBig Three:\n${bigThreeText}\n\nPlacements:\n${allPlanets}\n\nCalculated with Celestia`;

    try {
      await Share.share({ message });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const resetForm = () => {
    setName('');
    setBirthDate(null);
    setBirthTime(null);
    setIsTimeUnknown(false);
    setCitySearch('');
    setSelectedCity(null);
    setCitySuggestions([]);
    setChartResult(null);
    setBirthDetails(null);
  };

  const getPlanetDegreeText = (p) => {
    const deg = Math.floor(p.degree);
    const min = Math.floor((p.degree - deg) * 60);
    return `${deg}°${min.toString().padStart(2, '0')}'`;
  };

  const getElementColor = (sign) => {
    const element = SIGN_ELEMENTS[sign];
    return ELEMENT_COLORS[element] || T.border;
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── HERO ── */}
        <LinearGradient colors={[T.navy, T.navyMid, T.navyLt]} style={styles.hero}>
          <View style={{ height: Platform.OS === 'ios' ? 56 : 40 }} />
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.backBtn}>{'←'}</Text>
            </TouchableOpacity>
            {chartResult && (
              <TouchableOpacity onPress={resetForm}>
                <Text style={styles.resetBtn}>New Lookup</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.heroTitle}>Quick Chart</Text>
          <Text style={styles.heroSubtitle}>Look up anyone's birth chart instantly</Text>
          <View style={{ height: 24 }} />
        </LinearGradient>

        {/* ── FORM ── */}
        {!chartResult && (
          <View style={styles.formSection}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }]}
              placeholder="Enter name..."
              placeholderTextColor={colors.inputPlaceholder}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BIRTH DATE</Text>
            <TouchableOpacity style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]} onPress={() => setShowDatePicker(true)}>
              <Text style={{ color: birthDate ? colors.heading : colors.inputPlaceholder, fontFamily: FONTS.sansMedium }}>
                {birthDate
                  ? birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : 'Select date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setBirthDate(d); }}
              />
            )}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BIRTH TIME</Text>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, isTimeUnknown && { opacity: 0.4 }]}
              onPress={() => !isTimeUnknown && setShowTimePicker(true)}
            >
              <Text style={{ color: (isTimeUnknown || birthTime) ? colors.heading : colors.inputPlaceholder, fontFamily: FONTS.sansMedium }}>
                {isTimeUnknown ? 'Unknown' : (birthTime
                  ? birthTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : 'Select time')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={birthTime || new Date(2000, 0, 1, 12, 0)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setBirthTime(t); }}
              />
            )}
            <TouchableOpacity style={styles.checkRow} onPress={() => setIsTimeUnknown(!isTimeUnknown)}>
              <View style={[styles.check, { borderColor: colors.border }, isTimeUnknown && styles.checkOn]}>
                {isTimeUnknown && <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>}
              </View>
              <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>I don't know the exact birth time</Text>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>BIRTH CITY</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }]}
              placeholder="Search city..."
              placeholderTextColor={colors.inputPlaceholder}
              value={selectedCity ? selectedCity.name : citySearch}
              onChangeText={(t) => { setSelectedCity(null); handleCitySearch(t); }}
            />
            {citySearching && (
              <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.inputBorder, padding: 12, alignItems: 'center' }]}>
                <ActivityIndicator size="small" color={T.gold} />
              </View>
            )}
            {!citySearching && citySuggestions.length > 0 && (
              <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.inputBorder }]}>
                {citySuggestions.map((c, i) => (
                  <TouchableOpacity key={i} style={[styles.suggestion, { borderBottomColor: colors.divider }]}
                    onPress={() => { setSelectedCity(c); setCitySearch(c.name); setCitySuggestions([]); }}>
                    <Text style={{ color: colors.heading, fontSize: 14 }} numberOfLines={2}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.calculateBtn, (!name.trim() || !selectedCity) && { opacity: 0.5 }]}
              onPress={handleCalculate}
              disabled={calculating || !name.trim() || !selectedCity}
            >
              {calculating
                ? <ActivityIndicator color="white" />
                : <Text style={styles.calculateBtnText}>Calculate Chart</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── RESULTS ── */}
        {chartResult && birthDetails && (
          <View style={styles.resultsSection}>

            {/* Name + Birth Details */}
            <View style={styles.resultHeader}>
              <Text style={[styles.resultName, { color: colors.heading }]}>{birthDetails.name}</Text>
              <Text style={[styles.resultDetails, { color: colors.textSecondary }]}>
                {birthDate?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {birthDetails.isTimeUnknown ? '' : ` at ${birthDetails.timeStr}`}
              </Text>
              <Text style={[styles.resultLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                {birthDetails.cityName?.split(',').slice(0, 2).join(',')}
              </Text>
            </View>

            {/* Big Three Cards */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>The Big Three</Text>
            <View style={styles.bigThreeRow}>
              {BIG_THREE.map(planetName => {
                const planet = chartResult.planets?.find(p => p.name === planetName);
                if (!planet) return null;
                const label = planetName === 'Ascendant' ? 'Rising' : planetName;
                const elementColor = getElementColor(planet.sign);
                return (
                  <View key={planetName} style={[styles.bigThreeCard, { backgroundColor: colors.card, borderColor: elementColor }]}>
                    <Text style={styles.bigThreeGlyph}>{PLANET_GLYPHS[planetName]}</Text>
                    <Text style={[styles.bigThreeLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.bigThreeSign, { color: colors.heading }]}>{ZODIAC_GLYPHS[planet.sign]} {planet.sign}</Text>
                    <Text style={[styles.bigThreeDegree, { color: colors.textSecondary }]}>{getPlanetDegreeText(planet)}</Text>
                  </View>
                );
              })}
            </View>

            {/* All Placements */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>All Placements</Text>
            <View style={[styles.placementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(chartResult.planets || [])
                .filter(p => !BIG_THREE.includes(p.name))
                .map((planet, idx) => {
                  const elementColor = getElementColor(planet.sign);
                  return (
                    <View key={planet.name} style={[styles.placementRow, idx > 0 && [styles.placementBorder, { borderTopColor: colors.divider }]]}>
                      <View style={styles.placementLeft}>
                        <Text style={styles.placementGlyph}>{PLANET_GLYPHS[planet.name] || ''}</Text>
                        <Text style={[styles.placementName, { color: colors.heading }]}>{planet.name}</Text>
                      </View>
                      <View style={styles.placementRight}>
                        <View style={[styles.elementDot, { backgroundColor: elementColor }]} />
                        <Text style={[styles.placementSign, { color: colors.text }]}>{ZODIAC_GLYPHS[planet.sign]} {planet.sign}</Text>
                        <Text style={[styles.placementDegree, { color: colors.textSecondary }]}>{getPlanetDegreeText(planet)}</Text>
                        {planet.isRetrograde && <Text style={styles.retroBadge}>R</Text>}
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.compatibilityBtn} onPress={handleCheckCompatibility}>
                <Text style={styles.compatibilityBtnText}>Check Compatibility</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleShare}>
                <Text style={[styles.shareBtnText, { color: colors.heading }]}>Share</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.cream },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Hero
  hero: { paddingHorizontal: 24, paddingBottom: 4 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn: { fontSize: 22, color: T.cream },
  resetBtn: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.goldLt },
  heroTitle: { fontSize: 28, fontFamily: FONTS.serifSemiBold, color: T.cream, marginBottom: 6 },
  heroSubtitle: { fontSize: 14, fontFamily: FONTS.sans, color: 'rgba(255,255,255,0.6)' },

  // Form
  formSection: { padding: 20 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'white', borderRadius: 12, padding: 14, fontSize: 15, color: T.navy, borderWidth: 1, borderColor: '#EDE6D8', fontFamily: FONTS.sansLight },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  check: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4CFC4', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: T.navy, borderColor: T.navy },
  checkLabel: { fontSize: 13, color: T.stone },
  suggestions: { backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#EDE6D8', marginTop: 4, overflow: 'hidden' },
  suggestion: { padding: 13, borderBottomWidth: 1, borderBottomColor: '#F5EEE4' },
  calculateBtn: { backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  calculateBtnText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: T.cream },

  // Results
  resultsSection: { padding: 20 },
  resultHeader: { alignItems: 'center', marginBottom: 24 },
  resultName: { fontSize: 26, fontFamily: FONTS.serifSemiBold, color: T.navy, marginBottom: 4 },
  resultDetails: { fontSize: 14, fontFamily: FONTS.sans, color: T.stone, marginBottom: 2 },
  resultLocation: { fontSize: 13, fontFamily: FONTS.sansLight, color: T.stone },

  sectionTitle: { fontSize: 11, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.stone, marginBottom: 12, marginTop: 8 },

  // Big Three
  bigThreeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  bigThreeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bigThreeGlyph: { fontSize: 28, color: T.gold, marginBottom: 6 },
  bigThreeLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1, color: T.stone, marginBottom: 6, textTransform: 'uppercase' },
  bigThreeSign: { fontSize: 15, fontFamily: FONTS.serifMedium, color: T.navy, marginBottom: 2 },
  bigThreeDegree: { fontSize: 11, fontFamily: FONTS.sansLight, color: T.stone },

  // Placements
  placementsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  placementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  placementBorder: { borderTopWidth: 1, borderTopColor: '#F5EEE4' },
  placementLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  placementGlyph: { fontSize: 18, color: T.gold, width: 24, textAlign: 'center' },
  placementName: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy },
  placementRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  elementDot: { width: 8, height: 8, borderRadius: 4 },
  placementSign: { fontSize: 14, fontFamily: FONTS.sans, color: T.ink },
  placementDegree: { fontSize: 12, fontFamily: FONTS.sansLight, color: T.stone, minWidth: 42, textAlign: 'right' },
  retroBadge: { fontSize: 10, fontFamily: FONTS.sansSemiBold, color: '#C47A5A', backgroundColor: 'rgba(196,122,90,0.12)', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, overflow: 'hidden', marginLeft: 2 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12 },
  compatibilityBtn: { flex: 1, backgroundColor: T.navy, borderRadius: 14, padding: 16, alignItems: 'center' },
  compatibilityBtnText: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.cream },
  shareBtn: { backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: T.border, paddingHorizontal: 24 },
  shareBtnText: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy },
});
