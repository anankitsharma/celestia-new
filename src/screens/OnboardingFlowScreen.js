import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  TextInput, Platform, ActivityIndicator, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import ChartWheel from '../components/ChartWheel';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateChart, getTransitPlanets, getMoonDataForDate } from '../services/astrologyService';
import * as Crypto from 'expo-crypto';
import { useAnalytics, EVENTS, buildUserProperties } from '../services/analytics';
import { getNotificationSettings, saveNotificationSettings } from '../services/notificationService';

const { width, height } = Dimensions.get('window');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TOTAL_STEPS = 14;

// ── Sign Insights (screen 9 & 10) ──────────────────────────
const SUN_TAGLINES = {
  Aries: 'A fire that never asks permission to burn.',
  Taurus: 'You love deeply — and hold on with everything you have.',
  Gemini: 'Your mind never stops. Neither does your restlessness.',
  Cancer: 'You feel everything. And you remember all of it.',
  Leo: 'You were born to be seen — and terrified of being truly known.',
  Virgo: 'You notice what no one else does. Including your own cracks.',
  Libra: 'You keep the peace — even when it costs you yours.',
  Scorpio: "You've already survived what would break most people.",
  Sagittarius: "Freedom isn't a want for you. It's oxygen.",
  Capricorn: 'You carry more than anyone knows. And you never complain.',
  Aquarius: 'You think different — and feel deeper than you let on.',
  Pisces: "You absorb the world's pain and call it your own.",
};

// One-line "core question" by Sun sign — surfaced mid-onboarding as a
// reciprocity teaser before the full chart reveal lands. Sign-archetype
// lookup (no Gemini call) so it's instant.
const SUN_CORE_QUESTIONS = {
  Aries: 'What am I willing to fight for?',
  Taurus: 'What actually feels mine?',
  Gemini: 'Which voice in me is loudest right now?',
  Cancer: 'Who do I let in close?',
  Leo: 'Where am I most fully myself?',
  Virgo: 'What needs my attention, really?',
  Libra: 'What balance am I avoiding?',
  Scorpio: 'What am I ready to release?',
  Sagittarius: 'What am I outgrowing?',
  Capricorn: 'What am I actually building toward?',
  Aquarius: 'Which belief is mine, and which is borrowed?',
  Pisces: 'What feeling am I afraid to feel?',
};

// Goal-back text by motivation key — used at step 14 hard-close to echo
// the user's stated intent right before plan selection (commitment primer).
const MOTIVATION_GOAL_TEXT = {
  self: 'understand yourself better',
  change: 'navigate something big',
  love: 'find clarity in a relationship',
  curious: 'explore what\'s possible',
};

const MOON_TAGLINES = {
  Aries: 'Your emotional need: to feel alive.',
  Taurus: 'Your emotional need: safety and sensory peace.',
  Gemini: 'Your emotional need: to be heard and stimulated.',
  Cancer: 'Your emotional need: to nurture and be nurtured.',
  Leo: 'Your emotional need: to be adored for who you really are.',
  Virgo: 'Your emotional need: to feel useful and in control.',
  Libra: 'Your emotional need: harmony — even at your own expense.',
  Scorpio: 'Your emotional need: intensity and total honesty.',
  Sagittarius: 'Your emotional need: expansion and meaning.',
  Capricorn: 'Your emotional need: respect and quiet stability.',
  Aquarius: 'Your emotional need: freedom to be exactly yourself.',
  Pisces: 'Your emotional need: to dissolve the boundary between you and everything.',
};

const RISING_TAGLINES = {
  Aries: 'The world sees: someone fearless.',
  Taurus: 'The world sees: someone grounded and magnetic.',
  Gemini: 'The world sees: someone quick, charming, hard to pin down.',
  Cancer: 'The world sees: someone warm — and guarded.',
  Leo: 'The world sees: someone radiant who commands the room.',
  Virgo: 'The world sees: someone composed and impossibly put-together.',
  Libra: 'The world sees: grace. Diplomacy. Beauty.',
  Scorpio: 'The world sees: someone intense they can\'t quite read.',
  Sagittarius: 'The world sees: someone adventurous and uncontainable.',
  Capricorn: 'The world sees: ambition wearing a poker face.',
  Aquarius: 'The world sees: someone who doesn\'t quite fit — on purpose.',
  Pisces: 'The world sees: someone dreamy and slightly otherworldly.',
};

const ELEMENT_LABELS = { fire: '🔥 Fire', earth: '🌿 Earth', air: '💨 Air', water: '🌊 Water' };

// ── Small Components ──────────────────────────────────────
const ProgressBar = ({ step, colors }) => (
  <View style={s.progWrap}>
    <View style={[s.progTrack, colors && { backgroundColor: colors.divider }]}>
      <Animated.View style={[s.progFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
    </View>
  </View>
);

const OptionCard = ({ text, sub, selected, onPress, icon, colors }) => {
  const c = colors || {};
  return (
    <TouchableOpacity
      style={[s.optCard, { backgroundColor: c.card || T.white, borderColor: c.border || T.border }, selected && { borderColor: T.gold, borderWidth: 1.5 }]}
      onPress={onPress} activeOpacity={0.7}
    >
      {icon && <Text style={s.optIcon}>{icon}</Text>}
      <View style={{ flex: 1 }}>
        <Text style={[s.optText, { color: c.text || T.ink }, selected && { color: c.heading || T.navy }]}>{text}</Text>
        {sub && <Text style={[s.optSub, { color: c.textSecondary || T.stone }, selected && { color: c.text || T.ink }]}>{sub}</Text>}
      </View>
      <View style={[s.optRadio, { borderColor: c.border || T.border }, selected && { borderColor: T.gold, backgroundColor: c.card || T.white }]}>
        {selected && <View style={s.optRadioDot} />}
      </View>
    </TouchableOpacity>
  );
};

const GoldButton = ({ text, onPress, disabled, loading, sub, colors: c }) => (
  <View style={s.goldBtnWrap}>
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled || loading} style={s.goldBtnTouch}>
      <LinearGradient
        colors={disabled ? ['#D0C4A8', '#B8AC90'] : ['#E2C46A', '#C8A84B', '#A07820']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[s.goldBtn, disabled && { opacity: 0.6 }]}
      >
        {loading ? <ActivityIndicator color={T.navy} /> : <Text style={s.goldBtnText}>{text}</Text>}
      </LinearGradient>
    </TouchableOpacity>
    {sub && <Text style={[s.goldBtnSub, c && { color: c.textSecondary }]}>{sub}</Text>}
  </View>
);

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function OnboardingFlowScreen({ navigation }) {
  const { setUserProfile } = useUserProfile();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const { capture, identify } = useAnalytics();
  const [step, setStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Emotional selections
  const [motivation, setMotivation] = useState(null);
  const [painPoint, setPainPoint] = useState(null);
  const [depth, setDepth] = useState(null);

  // Birth data
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState(null);
  const [birthTime, setBirthTime] = useState(null);
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearching, setCitySearching] = useState(false);

  // Chart data
  const [chart, setChart] = useState(null);
  const [calcPhase, setCalcPhase] = useState(0);
  const [todayTransits, setTodayTransits] = useState([]);
  const [moonData, setMoonData] = useState(null);

  // Paywall
  const [selectedPlan, setSelectedPlan] = useState('annual');

  // Daily anchor — when user typically wakes / first checks phone.
  // Drives the morning-briefing notification time so it lands on their actual routine.
  // Null = unset; numeric value = hour (24h). 'varies' = non-fixed schedule (use default).
  const [wakeHour, setWakeHour] = useState(null);

  // Fire onboarding_started once on mount
  useEffect(() => { capture(EVENTS.ONBOARDING_STARTED); }, []);

  // ── Transition animation ─────────────────────────
  const advance = (nextStep) => {
    const target = nextStep || step + 1;
    // Only fire step-completed when moving forward (not on back). Required for
    // per-step funnel measurement of where the 14-step onboarding loses users.
    if (target > step) {
      capture(EVENTS.ONBOARDING_STEP_COMPLETED, { from_step: step, to_step: target });
    }
    Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }).start(() => {
      setStep(target);
      slideAnim.setValue(20);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }).start();
    });
  };

  const selectAndAdvance = (setter, value) => {
    setter(value);
    setTimeout(() => advance(), 500);
  };

  // ── City search debounce ─────────────────────────
  useEffect(() => {
    if (selectedCity || citySearch.length < 2) { setCitySuggestions([]); return; }
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
      } catch (e) { console.warn('City search error:', e); }
      finally { setCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  // ── Chart calculation (step 8) ───────────────────
  useEffect(() => {
    if (step !== 8) return;
    const phases = ['Locating your planets...', 'Calculating house cusps...', 'Mapping natal aspects...', 'Reading your chart patterns...'];
    let i = 0;
    setCalcPhase(0);
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) setCalcPhase(i);
    }, 900);

    // Calculate chart
    const run = async () => {
      try {
        const dateStr = `${birthDate.getFullYear()}-${(birthDate.getMonth() + 1).toString().padStart(2, '0')}-${birthDate.getDate().toString().padStart(2, '0')}`;
        const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`;
        const loc = { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng };
        const c = calculateChart(dateStr, timeStr, loc, isTimeUnknown, 'Placidus');
        setChart(c);
        const transits = getTransitPlanets();
        setTodayTransits(transits);
        const moon = getMoonDataForDate(new Date());
        setMoonData(moon);
      } catch (e) { console.error('Chart calc error:', e); }
    };
    run();

    // Auto-advance after dramatic pause
    const timeout = setTimeout(() => {
      clearInterval(interval);
      advance(9);
    }, 4200);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);

  // ── Save & finish ────────────────────────────────
  const finishOnboarding = async () => {
    try {
      const dateStr = `${birthDate.getFullYear()}-${(birthDate.getMonth() + 1).toString().padStart(2, '0')}-${birthDate.getDate().toString().padStart(2, '0')}`;
      const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`;
      const profile = {
        id: Crypto.randomUUID(),
        name: firstName.trim(),
        gender: 'unknown',
        birthDate: dateStr,
        birthTime: timeStr,
        birthLocation: { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng },
        isTimeUnknown,
        chart,
        type: 'self',
        motivation,
        painPoint,
        depth,
      };
      await setUserProfile(profile);
      // Persist persona preferences for AI tone across the app
      try {
        const { saveObject } = require('../services/storage');
        await saveObject('celestia_persona_prefs', { motivation, painPoint, depth });
      } catch (e) {}
      const userProps = await buildUserProperties(profile.id).catch(() => ({}));
      identify(profile.id, {
        ...userProps,
        sun_sign: chart?.sun?.sign,
        motivation,
        pain_point: painPoint,
      });
      capture(EVENTS.ONBOARDING_COMPLETED, { sun_sign: chart?.sun?.sign, motivation, pain_point: painPoint });
      if (user) {
        navigation.replace('Main');
      } else {
        navigation.replace('Auth', { mode: 'onboarding' });
      }
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // ── Derived data ─────────────────────────────────
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const dominantElement = chart?.elements ? Object.entries(chart.elements).sort((a, b) => b[1] - a[1])[0] : null;
  const retroCount = chart?.planets?.filter(p => p.isRetrograde).length || 0;
  const transitAspectCount = todayTransits.length;

  // ══════════════════════════════════════════════════
  // SCREEN RENDERERS
  // ══════════════════════════════════════════════════

  // ── 1. HOOK ──────────────────────────────────────
  const renderHook = () => (
    <View style={s.center}>
      <View style={s.hookGlow} />
      <Text style={s.hookPre}>✦</Text>
      <Text style={[s.hookH1, { color: colors.heading }]}>The stars remember{'\n'}when you were born</Text>
      <Text style={[s.hookSub, { color: colors.textSecondary }]}>Your birth chart is a fingerprint.{'\n'}No two are alike. Let's read yours.</Text>
      <View style={{ height: 40, width: '100%' }} />
      <View style={{ width: '100%', paddingHorizontal: 8 }}>
        <GoldButton text="Show Me ✦" onPress={() => advance()} />
      </View>
      <Text style={[s.hookDisclaimer, { color: colors.textSecondary }]}>2 minutes · completely free</Text>
    </View>
  );

  // ── 2. MOTIVATION ────────────────────────────────
  const renderMotivation = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>ABOUT YOU</Text>
      <Text style={[s.h1, { color: colors.heading }]}>What brought you{'\n'}here tonight?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>No wrong answers. Just honesty.</Text>
      <View style={s.optWrap}>
        <OptionCard text="I want to understand myself better" icon="🪞" selected={motivation === 'self'} onPress={() => selectAndAdvance(setMotivation, 'self')} colors={colors} />
        <OptionCard text="I'm going through something big" icon="🌊" selected={motivation === 'change'} onPress={() => selectAndAdvance(setMotivation, 'change')} colors={colors} />
        <OptionCard text="I need clarity on a relationship" icon="💫" selected={motivation === 'love'} onPress={() => selectAndAdvance(setMotivation, 'love')} colors={colors} />
        <OptionCard text="I'm curious — show me what you've got" icon="✨" selected={motivation === 'curious'} onPress={() => selectAndAdvance(setMotivation, 'curious')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 3. PAIN POINT ────────────────────────────────
  const renderPain = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>GOING DEEPER</Text>
      <Text style={[s.h1, { color: colors.heading }]}>What feels most{'\n'}uncertain right now?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Your chart might explain why.</Text>
      <View style={s.optWrap}>
        <OptionCard text="My love life" icon="♡" selected={painPoint === 'love'} onPress={() => selectAndAdvance(setPainPoint, 'love')} colors={colors} />
        <OptionCard text="My career and purpose" icon="◆" selected={painPoint === 'career'} onPress={() => selectAndAdvance(setPainPoint, 'career')} colors={colors} />
        <OptionCard text="My sense of self" icon="☽" selected={painPoint === 'self'} onPress={() => selectAndAdvance(setPainPoint, 'self')} colors={colors} />
        <OptionCard text="Everything, honestly" icon="∞" selected={painPoint === 'all'} onPress={() => selectAndAdvance(setPainPoint, 'all')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 4. EMOTIONAL DEPTH ───────────────────────────
  const renderDepth = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>ONE MORE THING</Text>
      <Text style={[s.h1, { color: colors.heading }]}>How often do you feel{'\n'}like no one really{'\n'}<Text style={s.h1em}>gets</Text> you?</Text>
      <View style={s.optWrap}>
        <OptionCard text="All the time" selected={depth === 'always'} onPress={() => selectAndAdvance(setDepth, 'always')} colors={colors} />
        <OptionCard text="More than I'd like to admit" selected={depth === 'often'} onPress={() => selectAndAdvance(setDepth, 'often')} colors={colors} />
        <OptionCard text="Sometimes" selected={depth === 'sometimes'} onPress={() => selectAndAdvance(setDepth, 'sometimes')} colors={colors} />
        <OptionCard text="I just want more self-awareness" selected={depth === 'aware'} onPress={() => selectAndAdvance(setDepth, 'aware')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 5. BIRTH DATE + NAME ─────────────────────────
  const renderBirthDate = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.phaseLabel}>YOUR CHART</Text>
      <Text style={[s.h1, { color: colors.heading }]}>When did your{'\n'}story begin?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Your birth moment is unique to you.{'\n'}No two charts are alike.</Text>

      <View style={s.fieldWrap}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>FIRST NAME</Text>
        <TextInput
          style={[s.field, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }, firstName.length > 0 && { borderColor: colors.gold }]}
          placeholder="What should we call you?"
          placeholderTextColor={colors.inputPlaceholder}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <View style={s.fieldWrap}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>BIRTH DATE</Text>
        <TouchableOpacity style={[s.field, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, birthDate && { borderColor: colors.gold }]} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: birthDate ? colors.heading : colors.inputPlaceholder, fontFamily: FONTS.sans, fontSize: 16 }}>
            {birthDate ? birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select your birth date'}
          </Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          themeVariant="light"
          onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setBirthDate(d); }}
        />
      )}

      <View style={{ height: 24 }} />
      <GoldButton text="Continue" onPress={() => advance()} disabled={!firstName.trim() || !birthDate} />
    </ScrollView>
  );

  // ── 6. BIRTH TIME ────────────────────────────────
  const renderBirthTime = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>PRECISION</Text>
      <Text style={[s.h1, { color: colors.heading }]}>Do you know what time{'\n'}you were born?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>This determines your Rising sign —{'\n'}the mask you show the world.</Text>

      <View style={s.optWrap}>
        <OptionCard
          text="Yes, I know my birth time"
          sub={birthTime ? `Selected: ${birthTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Tap to select time'}
          icon="🕐"
          selected={!isTimeUnknown && birthTime !== null}
          onPress={() => { setIsTimeUnknown(false); setShowTimePicker(true); }}
          colors={colors}
                 />
        <OptionCard
          text="I'm not sure"
          sub="We'll use a noon chart — still powerful"
          icon="🤷‍♀️"
          selected={isTimeUnknown}
          onPress={() => { setIsTimeUnknown(true); setBirthTime(null); setTimeout(() => advance(), 500); }}
          colors={colors}
                 />
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={birthTime || new Date(2000, 0, 1, 12, 0)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="light"
          onChange={(e, t) => { setShowTimePicker(Platform.OS === 'ios'); if (t) setBirthTime(t); }}
        />
      )}

      {(birthTime || isTimeUnknown) && !showTimePicker && (
        <View style={{ marginTop: 20 }}>
          <GoldButton text="Continue" onPress={() => advance()} />
        </View>
      )}
    </ScrollView>
  );

  // ── 7. BIRTH PLACE ───────────────────────────────
  const renderBirthPlace = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.phaseLabel}>LOCATION</Text>
      <Text style={[s.h1, { color: colors.heading }]}>Where did you first{'\n'}see the sky?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Your birthplace completes your chart.</Text>

      <View style={s.fieldWrap}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>BIRTH CITY</Text>
        <TextInput
          style={[s.field, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }, selectedCity && { borderColor: colors.gold }]}
          placeholder="Search any city..."
          placeholderTextColor={colors.inputPlaceholder}
          value={selectedCity ? selectedCity.name.split(',')[0] : citySearch}
          onChangeText={(t) => { setSelectedCity(null); setCitySearch(t); }}
          autoCapitalize="words"
        />
      </View>

      {citySearching && (
        <View style={s.suggestWrap}><ActivityIndicator size="small" color={T.gold} /></View>
      )}
      {!citySearching && citySuggestions.length > 0 && (
        <View style={[s.suggestList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {citySuggestions.map((c, i) => (
            <TouchableOpacity key={i} style={[s.suggestItem, { borderBottomColor: colors.divider }]}
              onPress={() => { setSelectedCity(c); setCitySearch(''); setCitySuggestions([]); }}>
              <Text style={[s.suggestText, { color: colors.text }]} numberOfLines={2}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedCity && (
        <View style={[s.selectedCityBadge, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={[s.selectedCityText, { color: colors.gold }]}>📍 {selectedCity.name.split(',').slice(0, 2).join(',')}</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
      <GoldButton text="Cast My Chart ✦" onPress={() => advance()} disabled={!selectedCity} />
    </ScrollView>
  );

  // ── 8. CALCULATING ───────────────────────────────
  const calcPhases = ['Locating your planets...', 'Calculating house cusps...', 'Mapping natal aspects...', 'Reading your chart patterns...'];
  const renderCalculating = () => (
    <View style={s.center}>
      <View style={s.calcGlow} />
      <View style={s.calcOrbWrap}>
        <LinearGradient colors={['#EDD060', '#C8A84B', '#8C6C18']} style={s.calcOrb} />
      </View>
      <Text style={[s.calcTitle, { color: colors.heading }]}>Casting your chart</Text>
      <Text style={[s.calcPhase, { color: colors.textSecondary }]}>{calcPhases[calcPhase] || calcPhases[0]}</Text>
      <View style={s.calcDots}>
        {calcPhases.map((_, i) => (
          <View key={i} style={[s.calcDot, { backgroundColor: colors.border }, i <= calcPhase && s.calcDotOn]} />
        ))}
      </View>
    </View>
  );

  // ── 9. FIRST HIT (Sun Sign) ──────────────────────
  const renderFirstHit = () => (
    <View style={s.center}>
      <View style={s.hitGlow} />
      <Text style={s.hitPre}>Your Sun is in</Text>
      <Text style={[s.hitSign, { color: colors.heading }]}>{sun?.sign || '—'}</Text>
      <Text style={[s.hitTagline, { color: colors.text }]}>{SUN_TAGLINES[sun?.sign] || ''}</Text>
      <View style={s.hitDivider} />
      <Text style={[s.hitWhisper, { color: colors.textSecondary }]}>
        {depth === 'always' || depth === 'often'
          ? "That feeling of being misunderstood?\nYour chart explains exactly why."
          : "There's so much more beneath the surface.\nLet's go deeper."}
      </Text>
      {/* Core-question teaser — reciprocity primer before the full reveal lands */}
      {sun?.sign && SUN_CORE_QUESTIONS[sun.sign] && (
        <View style={s.coreQuestionCard}>
          <Text style={s.coreQuestionKicker}>YOUR CORE QUESTION</Text>
          <Text style={[s.coreQuestionText, { color: colors.heading }]}>
            "{SUN_CORE_QUESTIONS[sun.sign]}"
          </Text>
          <Text style={[s.coreQuestionFooter, { color: colors.textSecondary }]}>
            Most {sun.sign}s spend years on this one.
          </Text>
        </View>
      )}
      <View style={{ height: 32, width: '100%' }} />
      <View style={{ width: '100%', paddingHorizontal: 8 }}>
        <GoldButton text="Show Me Everything" onPress={() => advance()} />
      </View>
    </View>
  );

  // ── 10. THE BIG REVEAL ⭐ ────────────────────────
  const renderBigReveal = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 40 }]} showsVerticalScrollIndicator={false}>
      <Text style={s.revealPre}>✦ YOUR COSMIC BLUEPRINT ✦</Text>
      <Text style={[s.revealName, { color: colors.heading }]}>{firstName}</Text>

      {/* Chart wheel */}
      <View style={[s.revealWheelWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <ChartWheel size={276} planets={chart?.planets} aspects={chart?.aspects} lightMode={!isDark} />
      </View>

      {/* Big 3 */}
      <View style={s.revealBig3}>
        <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.revealB3Label}>☉ SUN</Text>
          <Text style={[s.revealB3Sign, { color: colors.heading }]}>{sun?.sign || '—'}</Text>
          <Text style={[s.revealB3Desc, { color: colors.textSecondary }]}>{SUN_TAGLINES[sun?.sign] || ''}</Text>
        </View>
        <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.revealB3Label}>☽ MOON</Text>
          <Text style={[s.revealB3Sign, { color: colors.heading }]}>{moon?.sign || '—'}</Text>
          <Text style={[s.revealB3Desc, { color: colors.textSecondary }]}>{MOON_TAGLINES[moon?.sign] || ''}</Text>
        </View>
        {rising && (
          <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={s.revealB3Label}>↑ RISING</Text>
            <Text style={[s.revealB3Sign, { color: colors.heading }]}>{rising?.sign || '—'}</Text>
            <Text style={[s.revealB3Desc, { color: colors.textSecondary }]}>{RISING_TAGLINES[rising?.sign] || ''}</Text>
          </View>
        )}
      </View>

      {/* Stats strip */}
      <View style={[s.revealStats, { backgroundColor: colors.cardAlt }]}>
        {dominantElement && (
          <View style={s.revealStat}>
            <Text style={s.revealStatVal}>{ELEMENT_LABELS[dominantElement[0]] || dominantElement[0]}</Text>
            <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Dominant</Text>
          </View>
        )}
        <View style={s.revealStat}>
          <Text style={s.revealStatVal}>{chart?.aspects?.length || 0}</Text>
          <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Aspects</Text>
        </View>
        {retroCount > 0 && (
          <View style={s.revealStat}>
            <Text style={s.revealStatVal}>{retroCount} ℞</Text>
            <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Retrograde</Text>
          </View>
        )}
      </View>

      {/* Personalized insight */}
      <View style={[s.revealInsight, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[s.revealInsightText, { color: colors.text }]}>
          {motivation === 'love' || painPoint === 'love'
            ? `With your Moon in ${moon?.sign || 'your sign'}, you love with your whole body. Your chart reveals deep patterns in how you connect — and why some connections leave you empty.`
            : motivation === 'change'
            ? `Your chart shows a soul built for transformation. With ${sun?.sign || 'your Sun'} energy and a ${moon?.sign || ''} Moon, you don't just survive change — you were made for it.`
            : painPoint === 'career'
            ? `Your Midheaven and 10th house reveal a professional path that most people wouldn't guess. Your chart suggests your real purpose is still unfolding.`
            : `A ${sun?.sign || ''} Sun with a ${moon?.sign || ''} Moon is rare. You process the world differently than almost everyone around you — and your chart shows exactly why.`
          }
        </Text>
      </View>

      <View style={{ height: 24 }} />
      <GoldButton text="This Is Just The Beginning" onPress={() => advance()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── 11. DAILY HOOK ───────────────────────────────
  const renderDailyHook = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>RIGHT NOW</Text>
      <Text style={[s.h1, { color: colors.heading }]}>Today in{'\n'}<Text style={s.h1em}>{firstName}'s</Text> sky</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Your chart is alive. It changes every day.</Text>

      <View style={[s.dailyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={s.dailyCardLabel}>MOON</Text>
        <Text style={[s.dailyCardTitle, { color: colors.heading }]}>Moon in {moonData?.sign || 'transit'}</Text>
        <Text style={[s.dailyCardDesc, { color: colors.textSecondary }]}>
          {moonData?.phaseName || 'Current phase'} · {moonData?.illumination?.toFixed(0) || '--'}% illuminated
        </Text>
      </View>

      <View style={[s.dailyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={s.dailyCardLabel}>ACTIVE TRANSITS</Text>
        <Text style={[s.dailyCardTitle, { color: colors.heading }]}>{transitAspectCount} planets in motion</Text>
        <Text style={[s.dailyCardDesc, { color: colors.textSecondary }]}>
          These transit planets are forming aspects to your natal chart right now — shaping your day.
        </Text>
      </View>

      <View style={[s.dailyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={s.dailyCardLabel}>TOMORROW</Text>
        <Text style={[s.dailyCardTitle, { color: colors.heading }]}>Your forecast updates daily</Text>
        <Text style={[s.dailyCardDesc, { color: colors.textSecondary }]}>
          AI-powered readings from your real transits. Not sun-sign garbage. Your chart. Your sky. Every morning.
        </Text>
      </View>

      {/* Wake-time anchor — drives when the morning briefing fires.
          Anchoring to an existing routine is the most reliable B=MAP prompt strategy. */}
      <View style={[s.dailyCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <Text style={s.dailyCardLabel}>WAKE TIME</Text>
        <Text style={[s.dailyCardTitle, { color: colors.heading }]}>When do you usually wake up?</Text>
        <Text style={[s.dailyCardDesc, { color: colors.textSecondary, marginBottom: 14 }]}>
          We'll send your morning briefing right after — so it lands on your routine, not ours.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[
            { label: '6 AM', value: 6 },
            { label: '7 AM', value: 7 },
            { label: '8 AM', value: 8 },
            { label: '9 AM', value: 9 },
            { label: 'Later', value: 10 },
            { label: 'Varies', value: 'varies' },
          ].map(opt => {
            const selected = wakeHour === opt.value;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() => setWakeHour(opt.value)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: selected ? T.gold : colors.border,
                  backgroundColor: selected ? 'rgba(200,168,75,0.12)' : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 13,
                  fontFamily: selected ? FONTS.sansSemiBold : FONTS.sans,
                  color: selected ? T.gold : colors.textSecondary,
                }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 24 }} />
      <GoldButton text="Continue" onPress={async () => {
        // Persist the chosen wake-time as the morning-briefing schedule.
        // 'varies' or null → keep the 7:30am default.
        try {
          if (typeof wakeHour === 'number') {
            const settings = await getNotificationSettings();
            await saveNotificationSettings({ ...settings, morningTime: wakeHour, morningMinute: 5 });
          }
        } catch {}
        advance();
      }} />
      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ── 12. SOFT PAYWALL ─────────────────────────────
  const renderSoftPaywall = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 60 }]} showsVerticalScrollIndicator={false}>
      <Text style={s.paywallPre}>✦</Text>
      <Text style={[s.paywallH1, { color: colors.heading }]}>Your chart is cast.{'\n'}Your journey starts now.</Text>
      <Text style={[s.paywallSub, { color: colors.textSecondary }]}>Everything below is included — free for 7 days.</Text>

      <View style={s.benefitList}>
        {[
          { icon: '☉', title: 'Daily AI readings', desc: 'From your real transits — not your sun sign' },
          { icon: '♡', title: 'Relationship synastry', desc: 'Real compatibility, chart-to-chart' },
          { icon: '⚡', title: 'Transit alerts', desc: 'Know when planets hit your chart' },
          { icon: '💬', title: 'AI astrologer', desc: 'Unlimited conversations about your chart' },
          { icon: '📊', title: 'Deep reports', desc: 'Love, career, lunar, purpose — all yours' },
        ].map((b, i) => (
          <View key={i} style={s.benefitRow}>
            <View style={[s.benefitIcon, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}><Text style={{ fontSize: 18 }}>{b.icon}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={[s.benefitTitle, { color: colors.heading }]}>{b.title}</Text>
              <Text style={[s.benefitDesc, { color: colors.textSecondary }]}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <GoldButton text="Start My Free Trial" onPress={() => advance()} sub="No charge today · Cancel anytime" />
      <TouchableOpacity onPress={() => advance()} style={{ marginTop: 16, alignSelf: 'center' }}>
        <Text style={[s.paywallSkip, { color: colors.textSecondary }]}>Maybe later</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── 13. REASSURANCE ──────────────────────────────
  const renderReassurance = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 60 }]} showsVerticalScrollIndicator={false}>
      <Text style={[s.paywallH1, { color: colors.heading }]}>Join thousands who{'\n'}stopped settling for{'\n'}generic horoscopes</Text>

      {/* Testimonials */}
      <View style={s.testimonials}>
        {[
          { text: '"I screenshot my chart reading and sent it to everyone. It was THAT accurate."', name: 'Mia, 24' },
          { text: '"Other apps just tell me I\'m a Libra. This one actually knows my whole chart."', name: 'Jade, 29' },
          { text: '"I\'ve never felt so seen by an app. The daily transit readings are addictive."', name: 'Sara, 22' },
        ].map((t, i) => (
          <View key={i} style={[s.testimonial, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.testimonialText, { color: colors.text }]}>{t.text}</Text>
            <Text style={s.testimonialName}>— {t.name}</Text>
          </View>
        ))}
      </View>

      <View style={[s.freeCallout, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={s.freeCalloutTitle}>Try everything free for 7 days</Text>
        <Text style={[s.freeCalloutDesc, { color: colors.textSecondary }]}>If it doesn't change how you see yourself,{'\n'}cancel before the trial ends. No charge.</Text>
      </View>

      <GoldButton text="Try Free for 7 Days" onPress={() => advance()} />
      <TouchableOpacity onPress={() => advance()} style={{ marginTop: 16, alignSelf: 'center' }}>
        <Text style={[s.paywallSkip, { color: colors.textSecondary }]}>See pricing first</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── 14. HARD CLOSE ───────────────────────────────
  const renderHardClose = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 50 }]} showsVerticalScrollIndicator={false}>
      <Text style={[s.paywallH1, { color: colors.heading }]}>Choose your plan</Text>
      <Text style={[s.paywallSub, { color: colors.textSecondary }]}>{firstName}'s chart is waiting</Text>

      {/* Goal-back — echoes the motivation captured at step 2 right before
          plan selection. Commitment-consistency primer (Cialdini). */}
      {motivation && MOTIVATION_GOAL_TEXT[motivation] && (
        <View style={[s.goalBackCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={s.goalBackKicker}>YOUR INTENT</Text>
          <Text style={[s.goalBackBody, { color: colors.text }]}>
            You came here to {MOTIVATION_GOAL_TEXT[motivation]}.{'\n'}Pro is what gets you there.
          </Text>
        </View>
      )}

      {/* Annual plan */}
      <TouchableOpacity
        style={[s.planCard, { backgroundColor: colors.card, borderColor: colors.border }, selectedPlan === 'annual' && { borderColor: T.gold, borderWidth: 1.5 }]}
        onPress={() => setSelectedPlan('annual')} activeOpacity={0.8}
      >
        <View style={s.planBadge}><Text style={s.planBadgeText}>BEST VALUE</Text></View>
        <View style={s.planHeader}>
          <View style={[s.planRadio, { borderColor: colors.border }, selectedPlan === 'annual' && s.planRadioOn]}>
            {selectedPlan === 'annual' && <View style={s.planRadioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, { color: colors.heading }]}>Annual</Text>
            <Text style={[s.planPrice, { color: colors.heading }]}>$49.99<Text style={[s.planPer, { color: colors.textSecondary }]}>/year</Text></Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.planSave}>Save 40%</Text>
            <Text style={[s.planMonthly, { color: colors.text }]}>$4.17/mo</Text>
            <Text style={[s.planWas, { color: colors.textSecondary }]}>$83.88 value</Text>
          </View>
        </View>
        <View style={[s.planTrialBadge, { backgroundColor: colors.cardAlt }]}>
          <Text style={s.planTrialText}>✦ FREE for 7 days — cancel anytime</Text>
        </View>
      </TouchableOpacity>

      {/* Monthly plan */}
      <TouchableOpacity
        style={[s.planCard, { backgroundColor: colors.card, borderColor: colors.border }, selectedPlan === 'monthly' && { borderColor: T.gold, borderWidth: 1.5 }]}
        onPress={() => setSelectedPlan('monthly')} activeOpacity={0.8}
      >
        <View style={s.planHeader}>
          <View style={[s.planRadio, { borderColor: colors.border }, selectedPlan === 'monthly' && s.planRadioOn]}>
            {selectedPlan === 'monthly' && <View style={s.planRadioDot} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, { color: colors.heading }]}>Monthly</Text>
            <Text style={[s.planPrice, { color: colors.heading }]}>$6.99<Text style={[s.planPer, { color: colors.textSecondary }]}>/month</Text></Text>
          </View>
        </View>
        <View style={[s.planTrialBadge, { backgroundColor: colors.cardAlt }]}>
          <Text style={s.planTrialText}>✦ FREE for 3 days — cancel anytime</Text>
        </View>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
      <GoldButton
        text="Start My Free Trial"
        onPress={finishOnboarding}
        sub={selectedPlan === 'annual' ? "FREE for 7 days · You won't be charged" : "FREE for 3 days · You won't be charged"}
      />

      <TouchableOpacity onPress={finishOnboarding} style={{ marginTop: 18, alignSelf: 'center' }}>
        <Text style={[s.paywallSkip, { color: colors.textSecondary }]}>Continue with limited access</Text>
      </TouchableOpacity>

      <Text style={[s.paywallLegal, { color: colors.textSecondary }]}>
        {selectedPlan === 'annual'
          ? 'Free 7-day trial. Then $49.99/year. Cancel anytime in Settings.'
          : 'Free 3-day trial. Then $6.99/month. Cancel anytime in Settings.'}
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── STEP ROUTER ──────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1: return renderHook();
      case 2: return renderMotivation();
      case 3: return renderPain();
      case 4: return renderDepth();
      case 5: return renderBirthDate();
      case 6: return renderBirthTime();
      case 7: return renderBirthPlace();
      case 8: return renderCalculating();
      case 9: return renderFirstHit();
      case 10: return renderBigReveal();
      case 11: return renderDailyHook();
      case 12: return renderSoftPaywall();
      case 13: return renderReassurance();
      case 14: return renderHardClose();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  const showProgress = step >= 2 && step <= 11;
  const showBack = step >= 2 && step <= 11;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      {(showProgress || showBack) && (
        <View style={s.header}>
          {showBack ? (
            <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { if (step > 1) advance(step - 1); }}>
              <Text style={[s.backText, { color: colors.heading }]}>‹</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
          {showProgress && <ProgressBar step={step} colors={colors} />}
          <View style={{ width: 40 }} />
        </View>
      )}

      {/* Content */}
      <Animated.View style={[s.content, { transform: [{ translateY: slideAnim }] }]}>
        {renderStep()}
      </Animated.View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.cream },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 58 : 40, paddingHorizontal: 18, gap: 10, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: T.ink, marginTop: -2, fontFamily: FONTS.sans },

  // Progress
  progWrap: { flex: 1 },
  progTrack: { height: 4, borderRadius: 2, backgroundColor: T.warm, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: T.gold, borderRadius: 2 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 26, paddingTop: 20, paddingBottom: 30 },

  // Center layout
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  // Typography
  phaseLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 3, color: T.gold, marginBottom: 14 },
  h1: { fontFamily: FONTS.serif, fontSize: 30, color: T.navy, lineHeight: 40, marginBottom: 10 },
  h1em: { fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic' },
  sub: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.stone, lineHeight: 22, marginBottom: 24 },

  // Hook (screen 1)
  hookGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(200,168,75,0.06)' },
  hookPre: { fontSize: 32, color: T.gold, marginBottom: 20, opacity: 0.6 },
  hookH1: { fontFamily: FONTS.serif, fontSize: 34, color: T.navy, textAlign: 'center', lineHeight: 46, marginBottom: 14 },
  hookSub: { fontSize: 15, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  hookDisclaimer: { fontSize: 11, color: T.stone, marginTop: 16, opacity: 0.5 },

  // Option cards
  optWrap: { gap: 10 },
  optCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, paddingHorizontal: 18, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  optCardOn: { backgroundColor: T.white, borderColor: T.gold, borderWidth: 1.5 },
  optIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  optText: { fontSize: 15, fontFamily: FONTS.sansMedium, color: T.ink, lineHeight: 21 },
  optTextOn: { color: T.navy },
  optSub: { fontSize: 12, color: T.stone, marginTop: 2, lineHeight: 17 },
  optRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  optRadioOn: { borderColor: T.gold, backgroundColor: T.white },
  optRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.gold },

  // Gold button
  goldBtnWrap: { alignItems: 'center', gap: 10, width: '100%' },
  goldBtnTouch: { width: '100%' },
  goldBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, shadowColor: T.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16 },
  goldBtnText: { fontFamily: FONTS.sansSemiBold, fontSize: 16, color: T.navy, letterSpacing: 0.3 },
  goldBtnSub: { fontSize: 12, color: T.stone, textAlign: 'center' },

  // Fields
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, marginBottom: 8 },
  field: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, fontFamily: FONTS.sans, color: T.navy },
  fieldFilled: { borderColor: T.gold, backgroundColor: T.white },

  // City suggestions
  suggestWrap: { padding: 14, alignItems: 'center' },
  suggestList: { backgroundColor: T.white, borderRadius: 14, overflow: 'hidden', marginTop: 4, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  suggestItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: T.warm },
  suggestText: { fontSize: 14, color: T.ink },
  selectedCityBadge: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: T.border },
  selectedCityText: { fontSize: 13, color: T.gold },

  // Calculating (screen 8)
  calcGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(200,168,75,0.06)' },
  calcOrbWrap: { marginBottom: 40 },
  calcOrb: { width: 80, height: 80, borderRadius: 40, shadowColor: T.gold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 30 },
  calcTitle: { fontFamily: FONTS.serif, fontSize: 26, color: T.navy, marginBottom: 14 },
  calcPhase: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', marginBottom: 20, minHeight: 20 },
  calcDots: { flexDirection: 'row', gap: 8 },
  calcDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.border },
  calcDotOn: { backgroundColor: T.gold },

  // First Hit (screen 9)
  hitGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(200,168,75,0.08)' },
  hitPre: { fontSize: 13, fontFamily: FONTS.sansSemiBold, letterSpacing: 3, color: T.gold, marginBottom: 8 },
  hitSign: { fontFamily: FONTS.serif, fontSize: 52, color: T.navy, marginBottom: 14 },
  hitTagline: { fontSize: 17, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.ink, textAlign: 'center', lineHeight: 26, paddingHorizontal: 16, marginBottom: 24 },
  hitDivider: { width: 40, height: 1, backgroundColor: T.gold, marginBottom: 24, opacity: 0.4 },
  hitWhisper: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', lineHeight: 22 },
  coreQuestionCard: { marginTop: 28, paddingTop: 22, paddingBottom: 18, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: 'rgba(200,168,75,0.25)', borderBottomWidth: 1, borderBottomColor: 'rgba(200,168,75,0.25)', alignItems: 'center', maxWidth: 360 },
  coreQuestionKicker: { fontSize: 9, letterSpacing: 2, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 10 },
  coreQuestionText: { fontSize: 19, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', textAlign: 'center', lineHeight: 26, marginBottom: 8 },
  coreQuestionFooter: { fontSize: 11, fontFamily: FONTS.sans, textAlign: 'center' },
  goalBackCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: T.gold, padding: 16, marginBottom: 18, marginTop: 4 },
  goalBackKicker: { fontSize: 9, letterSpacing: 1.6, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 6 },
  goalBackBody: { fontSize: 14, fontFamily: FONTS.serif, lineHeight: 21 },

  // Big Reveal (screen 10)
  revealPre: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 4, color: T.gold, textAlign: 'center', marginBottom: 8 },
  revealName: { fontFamily: FONTS.serif, fontSize: 38, color: T.navy, textAlign: 'center', marginBottom: 20 },
  revealWheelWrap: { alignItems: 'center', alignSelf: 'center', marginBottom: 24, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: T.border, backgroundColor: T.white },
  revealBig3: { gap: 12, marginBottom: 20 },
  revealB3Card: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  revealB3Label: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 4 },
  revealB3Sign: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy, marginBottom: 4 },
  revealB3Desc: { fontSize: 13, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.stone, lineHeight: 20 },
  revealStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: T.warm, borderRadius: 14, padding: 16, marginBottom: 16 },
  revealStat: { alignItems: 'center', gap: 4 },
  revealStatVal: { fontSize: 16, fontFamily: FONTS.sansSemiBold, color: T.gold },
  revealStatLabel: { fontSize: 10, color: T.stone, letterSpacing: 1 },
  revealInsight: { backgroundColor: T.warm, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 18 },
  revealInsightText: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.ink, lineHeight: 23, textAlign: 'center' },

  // Daily Hook (screen 11)
  dailyCard: { backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  dailyCardLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 6 },
  dailyCardTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, marginBottom: 4 },
  dailyCardDesc: { fontSize: 13, fontFamily: FONTS.sansLight, color: T.stone, lineHeight: 20 },

  // Paywall shared
  paywallPre: { fontSize: 28, color: T.gold, textAlign: 'center', marginBottom: 14, opacity: 0.5 },
  paywallH1: { fontFamily: FONTS.serif, fontSize: 28, color: T.navy, lineHeight: 38, textAlign: 'center', marginBottom: 10 },
  paywallSub: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', marginBottom: 24 },
  paywallSkip: { fontSize: 13, color: T.stone, textDecorationLine: 'underline' },
  paywallLegal: { fontSize: 10, color: T.stone, opacity: 0.5, textAlign: 'center', marginTop: 20, lineHeight: 16, paddingHorizontal: 20 },

  // Benefits (screen 12)
  benefitList: { gap: 14, marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.warm, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 15, fontFamily: FONTS.sansMedium, color: T.navy, marginBottom: 1 },
  benefitDesc: { fontSize: 12, color: T.stone },

  // Testimonials (screen 13)
  testimonials: { gap: 12, marginBottom: 20 },
  testimonial: { backgroundColor: T.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  testimonialText: { fontSize: 14, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.ink, lineHeight: 22, marginBottom: 6 },
  testimonialName: { fontSize: 12, color: T.gold },
  freeCallout: { backgroundColor: T.warm, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 18, marginBottom: 24, alignItems: 'center' },
  freeCalloutTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.gold, marginBottom: 4 },
  freeCalloutDesc: { fontSize: 13, color: T.stone, textAlign: 'center', lineHeight: 20 },

  // Plans (screen 14)
  planCard: { borderWidth: 1, borderColor: T.border, borderRadius: 18, padding: 18, marginBottom: 12, overflow: 'hidden', backgroundColor: T.white, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  planCardOn: { borderColor: T.gold, borderWidth: 1.5, backgroundColor: T.white },
  planBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: T.gold, borderBottomLeftRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
  planBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: T.navy },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  planRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  planRadioOn: { borderColor: T.gold },
  planRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: T.gold },
  planName: { fontSize: 16, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 2 },
  planPrice: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy },
  planPer: { fontSize: 13, fontFamily: FONTS.sansLight, color: T.stone },
  planSave: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: '#2E8B57', marginBottom: 2 },
  planMonthly: { fontSize: 12, color: T.ink },
  planWas: { fontSize: 10, color: T.stone, textDecorationLine: 'line-through', marginTop: 1 },
  planTrialBadge: { marginTop: 12, backgroundColor: T.warm, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, alignSelf: 'flex-start' },
  planTrialText: { fontSize: 11, color: T.gold, fontFamily: FONTS.sansMedium },
});
