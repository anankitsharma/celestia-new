import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, Modal, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { loadObject, saveObject, StorageKeys } from '../services/storage';

const ZODIAC_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
};

const SIGN_RULERS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun',
  Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune'
};

const VOICE_OPTIONS = ['Poetic', 'Psychological', 'Direct', 'Spiritual'];
const DEPTH_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen({ navigation }) {
  const { userProfile, setUserProfile } = useUserProfile();
  const [settings, setSettings] = useState({ voice: 'Poetic', depth: 'Intermediate' });
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showDepthPicker, setShowDepthPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await loadObject(StorageKeys.SETTINGS);
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    } catch (e) { console.error('Settings load error:', e); }
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveObject(StorageKeys.SETTINGS, updated);
  };

  const chart = userProfile?.chart;
  const name = userProfile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');

  const signGlyph = sun?.sign ? (ZODIAC_SYMBOLS[sun.sign] || '♓') : '✦';

  const astroChips = useMemo(() => {
    if (!chart) return [];
    const chips = [];
    if (chart.elements) {
      const el = Object.entries(chart.elements).sort(([, a], [, b]) => b - a)[0];
      if (el) chips.push(`${el[0].charAt(0).toUpperCase() + el[0].slice(1)} Dominant`);
    }
    if (chart.modalities) {
      const mod = Object.entries(chart.modalities).sort(([, a], [, b]) => b - a)[0];
      if (mod) chips.push(mod[0].charAt(0).toUpperCase() + mod[0].slice(1));
    }
    if (rising?.sign) {
      const ruler = SIGN_RULERS[rising.sign];
      if (ruler) chips.push(`${ruler} Ruled`);
    }
    return chips;
  }, [chart]);

  const astroMain = [
    sun && `${sun.sign} Sun`,
    moon && `${moon.sign} Moon`,
    rising && `${rising.sign} Rising`
  ].filter(Boolean).join(' · ');

  const signBadges = [
    sun && `${ZODIAC_SYMBOLS[sun.sign] || '☉'} ${sun.sign}`,
    moon && `☽ ${moon.sign}`,
    rising && `↑ ${rising.sign}`
  ].filter(Boolean);

  const birthInfo = userProfile ? [
    userProfile.birthDate && new Date(userProfile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    userProfile.birthTime && !userProfile.isTimeUnknown ? userProfile.birthTime : null,
    userProfile.birthLocation?.name
  ].filter(Boolean).join(' · ') : '';

  const handleShareChart = async () => {
    const chartInfo = [
      astroMain,
      ...astroChips,
      birthInfo ? `Born: ${birthInfo}` : '',
    ].filter(Boolean).join('\n');

    try {
      await Share.share({
        message: `My Celestial Identity\n\n${chartInfo}\n\n— Generated with Celestia`,
      });
    } catch (e) { console.error('Share error:', e); }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear your birth data and return to onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await setUserProfile(null);
            navigation.reset({ index: 0, routes: [{ name: 'OnboardingFlow' }] });
          }
        }
      ]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Help & Support',
      'Celestia uses NASA-backed astronomy-engine for precise calculations and Google Gemini AI for personalized readings.\n\nAll birth chart data is stored locally on your device.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy',
      'Your data stays on your device. Birth chart calculations are done locally. AI readings use encrypted connections. No personal data is sold or shared.',
      [{ text: 'OK' }]
    );
  };

  const SETTINGS_LIST = [
    { icon: '✨', bg: '#FFF2E4', label: 'Reading Voice', val: settings.voice, onPress: () => setShowVoicePicker(true) },
    { icon: '📊', bg: '#EAF0F8', label: 'Depth Level', val: settings.depth, onPress: () => setShowDepthPicker(true) },
    { icon: '🌐', bg: '#F0F8F0', label: 'Time Zone', val: 'Auto', onPress: () => Alert.alert('Time Zone', 'Timezone is automatically detected from your device settings.') },
  ];

  const SETTINGS2_LIST = [
    { icon: '🔒', bg: '#F8F0F0', label: 'Privacy', onPress: handlePrivacy },
    { icon: '❓', bg: '#FFF8E8', label: 'Help & Support', onPress: handleHelp },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={['#0E0E22', '#2A1A6E', '#0C2040']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.hero}>
          <View style={styles.heroGlyph}><Text style={{ fontFamily: FONTS.serif, fontSize: 128, color: 'rgba(200,168,75,0.04)' }}>{signGlyph}</Text></View>
          <TouchableOpacity activeOpacity={0.8}>
            <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.avatar}>
              <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() || '✦'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.heroName}>{name}</Text>
          {birthInfo ? <Text style={styles.heroBirth}>{birthInfo}</Text> : null}
          <View style={styles.signsRow}>
            {signBadges.map((s, i) => (
              <View key={i} style={styles.signBadge}><Text style={styles.signBadgeText}>{s}</Text></View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats */}
          <View style={styles.pstats}>
            <View style={styles.pstat}>
              <Text style={styles.pstatNum}>{chart?.aspects?.length || 0}</Text>
              <Text style={styles.pstatLbl}>Aspects</Text>
              <View style={styles.pstatTags}>
                <View style={styles.miniTag}><Text style={styles.miniTagText}>Natal Chart</Text></View>
              </View>
            </View>
            <View style={styles.pstat}>
              <Text style={styles.pstatNum}>{chart?.planets?.length || 0}</Text>
              <Text style={styles.pstatLbl}>Placements</Text>
              <View style={styles.pstatTags}>
                <View style={styles.miniTag}><Text style={styles.miniTagText}>Whole Sign</Text></View>
              </View>
            </View>
          </View>

          {/* Astro ID Card */}
          <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.astroCard}>
            <Text style={styles.astroLbl}>YOUR CELESTIAL IDENTITY</Text>
            <Text style={styles.astroMain}>{astroMain || 'Complete onboarding to reveal'}</Text>
            {astroChips.length > 0 && (
              <View style={styles.astroRow}>
                {astroChips.map((c, i) => (
                  <View key={i} style={styles.astroChip}><Text style={styles.astroChipText}>{c}</Text></View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.astroShare} onPress={handleShareChart}>
              <Text style={styles.astroShareText}>Share My Chart ↗</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Settings */}
          <Text style={styles.secLbl}>PREFERENCES</Text>
          <View style={styles.settingsCard}>
            {SETTINGS_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, i === SETTINGS_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7} onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={styles.prowLabel}>{s.label}</Text>
                {s.val ? <Text style={styles.prowVal}>{s.val}</Text> : null}
                <Text style={styles.prowArr}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.secLbl}>GENERAL</Text>
          <View style={styles.settingsCard}>
            {SETTINGS2_LIST.map((s, i) => (
              <TouchableOpacity key={i} style={[styles.prow, i === SETTINGS2_LIST.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7} onPress={s.onPress}>
                <View style={[styles.prowIcon, { backgroundColor: s.bg }]}><Text style={{ fontSize: 16 }}>{s.icon}</Text></View>
                <Text style={styles.prowLabel}>{s.label}</Text>
                <Text style={styles.prowArr}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.signOut} activeOpacity={0.7} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Reset Profile</Text>
          </TouchableOpacity>

          {/* Dev Tools — hidden in production */}
          {__DEV__ && (
            <>
              <Text style={[styles.secLbl, { marginTop: 8, color: T.gold }]}>DEVELOPMENT</Text>
              <View style={styles.devCard}>
                <TouchableOpacity
                  style={styles.devRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('OnboardingFlow')}
                >
                  <View style={styles.devIcon}>
                    <Text style={{ fontSize: 14, color: T.gold }}>✦</Text>
                  </View>
                  <Text style={styles.devLabel}>Show Onboarding</Text>
                  <Text style={[styles.prowArr, { color: 'rgba(200,168,75,0.5)' }]}>›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Voice Picker Modal */}
      <Modal visible={showVoicePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowVoicePicker(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Reading Voice</Text>
            <Text style={styles.pickerSub}>Choose how Celestia speaks to you</Text>
            {VOICE_OPTIONS.map((v, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.voice === v && styles.pickerOptionOn]}
                onPress={() => { updateSetting('voice', v); setShowVoicePicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.voice === v && styles.pickerOptionTextOn]}>{v}</Text>
                {settings.voice === v && <Text style={{ color: T.gold }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Depth Picker Modal */}
      <Modal visible={showDepthPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDepthPicker(false)}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Depth Level</Text>
            <Text style={styles.pickerSub}>Adjust the complexity of your readings</Text>
            {DEPTH_OPTIONS.map((d, i) => (
              <TouchableOpacity key={i} style={[styles.pickerOption, settings.depth === d && styles.pickerOptionOn]}
                onPress={() => { updateSetting('depth', d); setShowDepthPicker(false); }}>
                <Text style={[styles.pickerOptionText, settings.depth === d && styles.pickerOptionTextOn]}>{d}</Text>
                {settings.depth === d && <Text style={{ color: T.gold }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 64, paddingHorizontal: 22, paddingBottom: 25, position: 'relative', overflow: 'hidden' },
  heroGlyph: { position: 'absolute', right: 8, bottom: -22 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 18, marginBottom: 13, borderWidth: 3, borderColor: 'rgba(255,255,255,0.14)' },
  avatarText: { fontFamily: FONTS.serif, fontSize: 30, color: 'white' },
  heroName: { fontFamily: FONTS.serif, fontSize: 28, color: 'white', marginBottom: 4 },
  heroBirth: { fontSize: 11, color: 'rgba(250,248,242,0.4)', marginBottom: 9 },
  signsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  signBadge: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11 },
  signBadgeText: { fontSize: 11, color: 'rgba(250,248,242,0.58)' },
  body: { paddingHorizontal: 19, paddingTop: 18 },
  pstats: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  pstat: { flex: 1, backgroundColor: 'white', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: T.border },
  pstatNum: { fontFamily: FONTS.serif, fontSize: 32, color: T.navy, lineHeight: 32 },
  pstatLbl: { fontSize: 11, color: T.stone, marginTop: 3 },
  pstatTags: { flexDirection: 'row', gap: 5, marginTop: 7, flexWrap: 'wrap' },
  miniTag: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 },
  miniTagText: { fontSize: 10, color: '#6B6050' },
  astroCard: { borderRadius: 16, padding: 18, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)', overflow: 'hidden' },
  astroLbl: { fontSize: 10, letterSpacing: 2, color: 'rgba(200,168,75,0.55)', marginBottom: 8 },
  astroMain: { fontFamily: FONTS.serif, fontSize: 20, color: 'white', marginBottom: 10 },
  astroRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  astroChip: { backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  astroChipText: { fontSize: 11, color: 'rgba(250,248,242,0.7)' },
  astroShare: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' },
  astroShareText: { fontSize: 12, color: 'rgba(250,248,242,0.6)' },
  secLbl: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 9 },
  settingsCard: { backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginBottom: 18 },
  prow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F5F0E6' },
  prowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  prowLabel: { fontSize: 14, color: T.navy, flex: 1 },
  prowVal: { fontSize: 13, color: T.stone },
  prowArr: { fontSize: 16, color: '#D0C8B4', marginLeft: 5 },
  signOut: { alignItems: 'center', paddingVertical: 16 },
  signOutText: { fontSize: 14, color: '#D44', fontFamily: FONTS.sansMedium },
  // Picker Modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  pickerCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 },
  pickerTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 4 },
  pickerSub: { fontSize: 13, color: T.stone, marginBottom: 16 },
  pickerOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F0E6' },
  pickerOptionOn: { borderBottomColor: 'rgba(200,168,75,0.2)' },
  pickerOptionText: { fontSize: 16, color: T.ink },
  pickerOptionTextOn: { color: T.navy, fontFamily: FONTS.sansSemiBold },
  // Dev section
  devCard: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 17, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)', overflow: 'hidden', marginBottom: 18 },
  devRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  devIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(200,168,75,0.12)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  devLabel: { fontSize: 14, color: T.navy, flex: 1, fontFamily: FONTS.sansMedium },
});
