import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Platform, ActivityIndicator, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateChart } from '../services/astrologyService';
import { saveObject, StorageKeys } from '../services/storage';
import * as Crypto from 'expo-crypto';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

const formatDate = (date) => {
  const d = date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const formatTime = (date) => {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const toDateStr = (date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const toTimeStr = (date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

export default function OnboardingScreen({ navigation }) {
  const { setUserProfile } = useUserProfile();
  const { isDark, colors } = useTheme();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState(0);
  const [depth, setDepth] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 3 notification toggle state
  const [notifDaily, setNotifDaily] = useState(true);
  const [notifMoon, setNotifMoon] = useState(true);
  const [notifTransit, setNotifTransit] = useState(false);
  const [notifWeekly, setNotifWeekly] = useState(true);

  // Step 1 form state
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [birthTime, setBirthTime] = useState(null);
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [locationSearching, setLocationSearching] = useState(false);

  // Date/time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Nominatim city search with 600ms debounce
  useEffect(() => {
    if (selectedLocation || locationQuery.length < 2) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(locationQuery)}&limit=5&addressdetails=1`,
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
        setLocationSearching(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [locationQuery, selectedLocation]);

  const personas = [
    { icon: '🌙', bg: isDark ? 'rgba(155,142,196,0.15)' : '#F2ECF8', name: 'Poetic', desc: 'Lyrical, evocative. Rich in metaphor and imagery.', sample: 'The stars whisper through your Venus tonight \u2014 love isn\u2019t knocking, it\u2019s already inside.' },
    { icon: '🧠', bg: isDark ? 'rgba(123,167,196,0.15)' : '#EAF0F8', name: 'Psychological', desc: 'Therapeutic lens. Self-reflective depth.', sample: 'You\u2019re repeating a pattern your Venus set up years ago. Here\u2019s what\u2019s driving it.' },
    { icon: '⚡', bg: isDark ? 'rgba(193,127,89,0.15)' : '#FFF2E4', name: 'Direct', desc: 'Clear and actionable. No mystical fluff.', sample: 'Your Venus says you love by fixing people. Stop picking projects.' },
    { icon: '✨', bg: isDark ? 'rgba(200,168,75,0.15)' : '#F8F8E8', name: 'Spiritual', desc: 'Soul-focused. Karmic growth & purpose.', sample: 'Your soul chose this Venus placement to learn unconditional love.' },
  ];

  const handleLocationSearch = (text) => {
    setSelectedLocation(null);
    setLocationQuery(text);
  };

  const selectCity = (city) => {
    setSelectedLocation(city);
    setLocationQuery(city.name);
    setCitySuggestions([]);
  };

  const handleContinue = async () => {
    if (step === 1) {
      if (!name.trim()) { Alert.alert('Name required', 'Please enter your name.'); return; }
      if (!birthDate) { Alert.alert('Date required', 'Please select your birth date.'); return; }
      if (!selectedLocation) { Alert.alert('Location required', 'Please select a city from the suggestions.'); return; }
      setStep(2);
    } else if (step === 2) {
      // Persist persona & depth selections so AI prompts can use them
      const depthLabels = ['Beginner', 'Intermediate', 'Advanced'];
      await saveObject(StorageKeys.SETTINGS, {
        voice: personas[persona]?.name || 'Poetic',
        depth: depthLabels[depth] || 'Intermediate',
      });
      setStep(3);
    } else {
      // Final step: save notification prefs, profile & calculate chart
      if (!selectedLocation) { Alert.alert('Error', 'Birth location is required.'); return; }
      setSaving(true);
      try {
        // Save notification preferences from toggles
        await saveObject(StorageKeys.NOTIFICATION_SETTINGS, {
          cosmic_morning: notifDaily,
          cosmic_milestones: notifMoon,
          transit_alerts: notifTransit,
          weekly_digest: notifWeekly,
          evening_reflection: true,
          streak_guardian: true,
        });
        const dateStr = toDateStr(birthDate);
        const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : toTimeStr(birthTime);
        const location = { name: selectedLocation.name, lat: selectedLocation.lat, lng: selectedLocation.lng };

        const chart = calculateChart(dateStr, timeStr, location, isTimeUnknown, 'Placidus');

        const profile = {
          id: Crypto.randomUUID(),
          name: name.trim(),
          gender: 'unknown',
          birthDate: dateStr,
          birthTime: timeStr,
          birthLocation: location,
          isTimeUnknown,
          chart,
          type: 'self',
        };

        await setUserProfile(profile);
        navigation.navigate('Welcome');
      } catch (e) {
        console.error('Failed to save profile:', e);
        Alert.alert('Error', 'Failed to calculate chart. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.heading }]}>‹</Text>
        </TouchableOpacity>
        <View style={[styles.progTrack, { backgroundColor: colors.divider }]}>
          <View style={[styles.progFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>{step} of 3</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>Tell us when you{'\n'}<Text style={[styles.h1em, { color: isDark ? colors.gold : '#7A5E14' }]}>entered the world</Text></Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>Your exact birth details allow us to cast a precise natal chart — the celestial blueprint of your entire life.</Text>

            <View style={styles.fgroup}>
              <Text style={[styles.flabel, { color: colors.textSecondary }]}>YOUR NAME</Text>
              <View style={[styles.finput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, name.length > 0 && { borderColor: 'rgba(200,168,75,0.45)', backgroundColor: isDark ? colors.cardElevated : '#FFFEF7' }]}>
                <TextInput
                  style={[styles.finputText, { color: colors.heading }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.frow}>
              <View style={[styles.fgroup, { flex: 1 }]}>
                <Text style={[styles.flabel, { color: colors.textSecondary }]}>DATE OF BIRTH</Text>
                <TouchableOpacity style={[styles.finput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, birthDate && { borderColor: 'rgba(200,168,75,0.45)', backgroundColor: isDark ? colors.cardElevated : '#FFFEF7' }]} onPress={() => setShowDatePicker(true)}>
                  <Text style={birthDate ? [styles.finputVal, { color: colors.heading }] : [styles.finputPh, { color: colors.inputPlaceholder }]}>
                    {birthDate ? formatDate(birthDate) : 'Select date'}
                  </Text>
                  <Text style={styles.finputIc}>📅</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: 11 }} />
              <View style={[styles.fgroup, { flex: 1 }]}>
                <Text style={[styles.flabel, { color: colors.textSecondary }]}>BIRTH TIME</Text>
                <TouchableOpacity
                  style={[styles.finput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, (!isTimeUnknown && birthTime) && { borderColor: 'rgba(200,168,75,0.45)', backgroundColor: isDark ? colors.cardElevated : '#FFFEF7' }]}
                  onPress={() => !isTimeUnknown && setShowTimePicker(true)}
                >
                  <Text style={(isTimeUnknown || birthTime) ? [styles.finputVal, { color: colors.heading }] : [styles.finputPh, { color: colors.inputPlaceholder }]}>
                    {isTimeUnknown ? 'Unknown' : (birthTime ? formatTime(birthTime) : 'Select time')}
                  </Text>
                  <Text style={styles.finputIc}>⏰</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.unknownRow} onPress={() => setIsTimeUnknown(!isTimeUnknown)}>
              <View style={[styles.checkbox, { backgroundColor: colors.card, borderColor: colors.border }, isTimeUnknown && styles.checkboxOn]}>
                {isTimeUnknown && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.unknownText, { color: colors.textSecondary }]}>I don't know my exact birth time</Text>
            </TouchableOpacity>

            <View style={styles.fgroup}>
              <Text style={[styles.flabel, { color: colors.textSecondary }]}>CITY OF BIRTH</Text>
              <View style={[styles.finput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, selectedLocation && { borderColor: 'rgba(200,168,75,0.45)', backgroundColor: isDark ? colors.cardElevated : '#FFFEF7' }]}>
                <TextInput
                  style={[styles.finputText, { color: colors.heading }]}
                  value={locationQuery}
                  onChangeText={handleLocationSearch}
                  placeholder="Search birthplace..."
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="words"
                />
                <Text style={styles.finputIc}>⌕</Text>
              </View>
              {locationSearching && (
                <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }, { padding: 12, alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={T.gold} />
                </View>
              )}
              {!locationSearching && citySuggestions.length > 0 && (
                <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {citySuggestions.map((city, i) => (
                    <TouchableOpacity key={i} style={[styles.suggestion, { borderBottomColor: colors.divider }]} onPress={() => selectCity(city)}>
                      <Text style={[styles.suggestionText, { color: colors.heading }]} numberOfLines={2}>{city.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.hint, { backgroundColor: isDark ? 'rgba(200,168,75,0.08)' : '#FFFAEF', borderColor: 'rgba(200,168,75,0.2)' }]}>
              <Text style={styles.hintIc}>🕐</Text>
              <Text style={[styles.hintTxt, { color: isDark ? colors.gold : '#7A5E14' }]}>Birth time determines your Rising sign and house placements. If unknown, we'll calculate a noon chart and note reduced accuracy.</Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(e, date) => { setShowDatePicker(false); if (date) setBirthDate(date); }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={birthTime || new Date(2000, 0, 1, 12, 0)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, date) => { setShowTimePicker(false); if (date) setBirthTime(date); }}
              />
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>How should your{'\n'}<Text style={[styles.h1em, { color: isDark ? colors.gold : '#7A5E14' }]}>stars speak?</Text></Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>Choose the voice that resonates with you. You can always change this later in settings.</Text>

            <View style={styles.pgrid}>
              {personas.map((p, i) => (
                <TouchableOpacity key={i} style={[styles.pcard, { backgroundColor: colors.card, borderColor: colors.border }, persona === i && { borderColor: T.gold, backgroundColor: isDark ? colors.cardElevated : '#FFFDF6', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14 }]} onPress={() => setPersona(i)} activeOpacity={0.8}>
                  <View style={styles.pcardTop}>
                    <View style={[styles.pcardIcon, { backgroundColor: p.bg }]}>
                      <Text style={{ fontSize: 20 }}>{p.icon}</Text>
                    </View>
                    {persona === i && (
                      <View style={styles.pcardCheck}><Text style={styles.pcardCheckText}>✓</Text></View>
                    )}
                  </View>
                  <Text style={[styles.pcardName, { color: colors.heading }]}>{p.name}</Text>
                  <Text style={[styles.pcardDesc, { color: colors.textSecondary }]}>{p.desc}</Text>
                  {persona === i && (
                    <Text style={[styles.pcardSample, { color: colors.textMuted }]}>{`"${p.sample}"`}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.dtoggle, { backgroundColor: isDark ? colors.cardAlt : '#EDE6D8' }]}>
              {['Beginner', 'Intermediate', 'Advanced'].map((d, i) => (
                <TouchableOpacity key={i} style={[styles.dbtn, depth === i && [styles.dbtnOn, { backgroundColor: colors.card }]]} onPress={() => setDepth(i)}>
                  <Text style={[styles.dbtnText, { color: colors.textSecondary }, depth === i && { color: colors.heading, fontFamily: FONTS.sansSemiBold }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>Stay aligned with{'\n'}<Text style={[styles.h1em, { color: isDark ? colors.gold : '#7A5E14' }]}>the cosmos</Text></Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>We'll send gentle reminders — daily horoscopes, transit alerts, and lunar phase updates. Never spammy, always meaningful.</Text>

            {[
              { icon: '☀️', title: 'Daily Horoscope', desc: 'Your personalized morning reading', on: notifDaily, toggle: setNotifDaily },
              { icon: '🌙', title: 'Moon Phases', desc: 'New & full moon rituals', on: notifMoon, toggle: setNotifMoon },
              { icon: '⚡', title: 'Transit Alerts', desc: 'When planets hit your chart', on: notifTransit, toggle: setNotifTransit },
              { icon: '💫', title: 'Weekly Forecast', desc: 'Sunday evening preview', on: notifWeekly, toggle: setNotifWeekly },
            ].map((item, i) => (
              <TouchableOpacity key={i} style={[styles.notifRow, { borderBottomColor: colors.divider }]} activeOpacity={0.7} onPress={() => item.toggle(!item.on)}>
                <View style={[styles.notifIcon, { backgroundColor: isDark ? (i % 2 === 0 ? 'rgba(155,142,196,0.15)' : 'rgba(193,127,89,0.15)') : (i % 2 === 0 ? '#F2ECF8' : '#FFF2E4') }]}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, { color: colors.heading }]}>{item.title}</Text>
                  <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
                <View style={[styles.toggleTrack, { backgroundColor: isDark ? colors.cardAlt : '#E0D8C8' }, item.on && styles.toggleOn]}>
                  <View style={[styles.toggleKnob, item.on && styles.toggleKnobOn]} />
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <TouchableOpacity style={[styles.pbtn, saving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={handleContinue} disabled={saving}>
        {saving
          ? <ActivityIndicator color={T.cream} />
          : <Text style={styles.pbtnText}>{step === 3 ? 'Begin Exploring ✦' : 'Continue →'}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.cream, paddingHorizontal: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 66, marginBottom: 30 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'white', borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  backText: { fontSize: 20, color: T.navy, marginTop: -2 },
  progTrack: { flex: 1, height: 3, backgroundColor: '#E8E0D0', borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: T.gold, borderRadius: 2 },
  stepText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.stone },
  scroll: { flex: 1 },
  h1: { fontFamily: FONTS.serif, fontSize: 31, color: T.navy, lineHeight: 38, marginBottom: 10 },
  h1em: { fontFamily: FONTS.serifItalic, color: '#7A5E14' },
  body: { fontSize: 13.5, fontFamily: FONTS.sansLight, color: T.stone, lineHeight: 22, marginBottom: 26 },
  fgroup: { marginBottom: 13 },
  flabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.8, color: T.stone, marginBottom: 7 },
  finput: {
    height: 54, backgroundColor: 'white',
    borderWidth: 1.5, borderColor: T.border, borderRadius: 15,
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  finputFilled: { borderColor: 'rgba(200,168,75,0.45)', backgroundColor: '#FFFEF7' },
  finputText: { flex: 1, fontSize: 15, color: T.navy, fontFamily: FONTS.sans },
  finputVal: { fontSize: 15, color: T.navy, fontFamily: FONTS.sans },
  finputPh: { fontSize: 15, color: '#C4B8A4', fontFamily: FONTS.sans },
  finputIc: { fontSize: 14 },
  frow: { flexDirection: 'row', marginBottom: 0 },
  unknownRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 13, marginTop: 6 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: T.border,
    backgroundColor: 'white', alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: T.gold, borderColor: T.gold },
  checkmark: { color: 'white', fontSize: 11, fontWeight: '700' },
  unknownText: { fontSize: 12.5, color: T.stone, fontFamily: FONTS.sans },
  suggestions: {
    backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 12,
    marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  suggestion: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5EEE4' },
  suggestionText: { fontSize: 14, color: T.navy, fontFamily: FONTS.sans },
  hint: {
    backgroundColor: '#FFFAEF', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)',
    borderRadius: 13, padding: 13, paddingHorizontal: 15,
    flexDirection: 'row', gap: 10, marginBottom: 22,
  },
  hintIc: { fontSize: 15 },
  hintTxt: { fontSize: 12, color: '#7A5E14', lineHeight: 18.6, flex: 1 },
  pbtn: {
    height: 56, backgroundColor: T.navy, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center', marginBottom: 34,
    shadowColor: T.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 18,
  },
  pbtnText: { fontFamily: FONTS.sansMedium, fontSize: 15, color: T.cream },
  pgrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 18 },
  pcard: {
    width: '48%', backgroundColor: 'white', borderWidth: 1.5, borderColor: T.border,
    borderRadius: 18, padding: 16, paddingHorizontal: 14,
  },
  pcardOn: { borderColor: T.gold, backgroundColor: '#FFFDF6', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14 },
  pcardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  pcardIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pcardCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center' },
  pcardCheckText: { color: 'white', fontSize: 11, fontWeight: '700' },
  pcardName: { fontSize: 13.5, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 4 },
  pcardDesc: { fontSize: 11, color: T.stone, lineHeight: 16 },
  pcardSample: { fontSize: 11, fontStyle: 'italic', color: 'rgba(151,144,127,0.72)', lineHeight: 15, marginTop: 6 },
  dtoggle: { backgroundColor: '#EDE6D8', borderRadius: 13, padding: 4, flexDirection: 'row', marginBottom: 20 },
  dbtn: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dbtnOn: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.09, shadowRadius: 5 },
  dbtnText: { fontSize: 13, color: T.stone, fontFamily: FONTS.sans },
  dbtnTextOn: { color: T.navy, fontFamily: FONTS.sansSemiBold },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0E8DA' },
  notifIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 2 },
  notifDesc: { fontSize: 12, color: T.stone },
  toggleTrack: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E0D8C8', justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: T.gold },
  toggleKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 4 },
  toggleKnobOn: { transform: [{ translateX: 22 }] },
});
