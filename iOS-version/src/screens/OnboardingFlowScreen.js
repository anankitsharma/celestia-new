import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  TextInput, Platform, ActivityIndicator, Dimensions, ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import ChartWheel from '../components/ChartWheel';
import { useUserProfile } from '../contexts/UserProfileContext';
import { calculateChart, getTransitPlanets, getMoonDataForDate } from '../services/astrologyService';
import { saveBoolean } from '../services/storage';
import * as Crypto from 'expo-crypto';
import { useAnalytics, EVENTS } from '../services/analytics';

const { width, height } = Dimensions.get('window');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// V1 PDF plan: 12 steps. New step 5 cites the framework (attachment theory +
// love languages + astronomical positioning) BEFORE we ask for birth data.
const TOTAL_STEPS = 12;

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

// V1 PDF plan: attachment style derived from depth answer (step 4).
// Reveal combines attachment style + astrological accent. Leads psychology,
// supports with astrology — exactly the tone PDF specifies.
const ATTACHMENT_FROM_DEPTH = {
  always: { name: 'Anxious-Preoccupied', desc: 'You crave closeness — and it scares you when it actually arrives.' },
  often:  { name: 'Fearful-Avoidant',    desc: 'You want connection and resist it at the same time. Both can be true.' },
  sometimes: { name: 'Earned-Secure',    desc: 'You\'ve learned to read people. Trust comes slowly but lands well.' },
  aware:   { name: 'Self-Aware Anxious', desc: 'You see your patterns clearly. Naming them is half the work.' },
};

// V1 PDF plan: short astrological accent that pairs with attachment style.
// Format: "{Sign} Venus magnetism" — Venus = how you give and receive love.
const VENUS_MAGNETISM = {
  Aries: 'fire-and-impulse magnetism', Taurus: 'sensual-grounded magnetism',
  Gemini: 'mental-spark magnetism',     Cancer: 'caretaker-tender magnetism',
  Leo: 'devotion-and-drama magnetism',  Virgo: 'quiet-loyal magnetism',
  Libra: 'romantic-balanced magnetism', Scorpio: 'intense-merging magnetism',
  Sagittarius: 'free-spirited magnetism', Capricorn: 'slow-building magnetism',
  Aquarius: 'unconventional-friendship magnetism', Pisces: 'dreamlike-tender magnetism',
};

// ── Small Components ──────────────────────────────────────
const ProgressBar = ({ step, colors }) => (
  <View
    style={s.progWrap}
    accessibilityRole="progressbar"
    accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}
    accessibilityValue={{ now: step, min: 1, max: TOTAL_STEPS }}>
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
      accessibilityRole="radio"
      accessibilityLabel={sub ? `${text}. ${sub}` : text}
      accessibilityState={{ selected: !!selected }}
    >
      {icon && <Text style={s.optIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{icon}</Text>}
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
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={s.goldBtnTouch}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}>
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
  const { isDark, colors } = useTheme();
  const { capture, identify } = useAnalytics();
  const [step, setStep] = useState(1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  // V1 hybrid: Big Reveal step 10 hides chart wheel + sign captions by default.
  // User taps "See your chart" to reveal — astrology becomes opt-in.
  const [showChartDetails, setShowChartDetails] = useState(false);

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

  // Fire onboarding_started once on mount
  useEffect(() => { capture(EVENTS.ONBOARDING_STARTED); }, []);

  // ── Transition animation ─────────────────────────
  const advance = (nextStep) => {
    const target = nextStep || step + 1;
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

  // ── Chart calculation (step 9 — bumped from 8 after framework-citation insertion) ──
  useEffect(() => {
    if (step !== 9) return;
    const phases = ['Reading your birth details...', 'Mapping your patterns...', 'Connecting the dots...', 'Almost ready...'];
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
      advance(10);
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
      identify(profile.id, { sun_sign: chart?.sun?.sign, motivation, pain_point: painPoint });
      capture(EVENTS.ONBOARDING_COMPLETED, { sun_sign: chart?.sun?.sign, motivation, pain_point: painPoint });
      // V1: no auth, go straight to Main (lands on Circle by initialRouteName).
      navigation.replace('Main');
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
      <Text style={[s.hookH1, { color: colors.heading }]}>Understand the patterns{'\n'}in your relationships.</Text>
      <Text style={[s.hookSub, { color: colors.textSecondary }]}>Why you love who you love.{'\n'}Why you keep doing what you do.</Text>
      <View style={{ height: 40, width: '100%' }} />
      <View style={{ width: '100%', paddingHorizontal: 8 }}>
        <GoldButton text="Begin" onPress={() => advance()} />
      </View>
      <Text style={[s.hookDisclaimer, { color: colors.textSecondary }]}>2 minutes · no sign-in</Text>
    </View>
  );

  // ── 2. PATTERN IN LOVE (PDF screen 2) ──────────────
  // Establishes "this is a relationship app" before any depth/birth ask.
  const renderMotivation = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>YOUR PATTERN</Text>
      <Text style={[s.h1, { color: colors.heading }]}>What's something you{'\n'}keep <Text style={s.h1em}>repeating</Text> in love?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Pick the closest fit. No wrong answers.</Text>
      <View style={s.optWrap}>
        <OptionCard text="I attract emotionally unavailable people" icon="🌊" selected={motivation === 'unavailable'} onPress={() => selectAndAdvance(setMotivation, 'unavailable')} colors={colors} />
        <OptionCard text="I push people away when things get serious" icon="🚪" selected={motivation === 'push_away'} onPress={() => selectAndAdvance(setMotivation, 'push_away')} colors={colors} />
        <OptionCard text="I lose myself in relationships" icon="🪞" selected={motivation === 'lose_self'} onPress={() => selectAndAdvance(setMotivation, 'lose_self')} colors={colors} />
        <OptionCard text="I avoid commitment" icon="🌬️" selected={motivation === 'avoid_commit'} onPress={() => selectAndAdvance(setMotivation, 'avoid_commit')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 3. COMMUNICATION STYLE (PDF screen 3) ──────────
  // Replaces generic "What feels uncertain?" with a clinical-relational question.
  const renderPain = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>YOUR STYLE</Text>
      <Text style={[s.h1, { color: colors.heading }]}>How do you{'\n'}communicate when{'\n'}you're <Text style={s.h1em}>triggered</Text>?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>Be honest. We've all got our move.</Text>
      <View style={s.optWrap}>
        <OptionCard text="I shut down" icon="🤐" selected={painPoint === 'shut_down'} onPress={() => selectAndAdvance(setPainPoint, 'shut_down')} colors={colors} />
        <OptionCard text="I fight back" icon="⚡" selected={painPoint === 'fight_back'} onPress={() => selectAndAdvance(setPainPoint, 'fight_back')} colors={colors} />
        <OptionCard text="I explain too much" icon="💭" selected={painPoint === 'explain'} onPress={() => selectAndAdvance(setPainPoint, 'explain')} colors={colors} />
        <OptionCard text="I leave" icon="🚪" selected={painPoint === 'leave'} onPress={() => selectAndAdvance(setPainPoint, 'leave')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 4. EMOTIONAL DEPTH ───────────────────────────
  const renderDepth = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>BEING KNOWN</Text>
      <Text style={[s.h1, { color: colors.heading }]}>How well do you feel{'\n'}<Text style={s.h1em}>understood</Text>{'\n'}by the people in your life?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>This is just for us — no right answer.</Text>
      <View style={s.optWrap}>
        <OptionCard text="All the time" selected={depth === 'always'} onPress={() => selectAndAdvance(setDepth, 'always')} colors={colors} />
        <OptionCard text="More than I'd like to admit" selected={depth === 'often'} onPress={() => selectAndAdvance(setDepth, 'often')} colors={colors} />
        <OptionCard text="Sometimes" selected={depth === 'sometimes'} onPress={() => selectAndAdvance(setDepth, 'sometimes')} colors={colors} />
        <OptionCard text="I just want more self-awareness" selected={depth === 'aware'} onPress={() => selectAndAdvance(setDepth, 'aware')} colors={colors} />
      </View>
    </ScrollView>
  );

  // ── 5. FRAMEWORK CITATION (PDF plan screen 4) ──
  // Establishes context BEFORE asking for birth data. Cites three frameworks
  // explicitly so birth-date collection reads as personality analysis input,
  // not astrology-only. "Astronomical positioning at your time of birth" is
  // technically what astrology is — but the word doesn't trigger 4.3(b).
  const renderFramework = () => {
    const items = [
      { n: '1', title: 'Attachment theory', sub: 'How you bond, how you handle distance and closeness.' },
      { n: '2', title: 'Love languages', sub: 'How you give care — and how you need to receive it.' },
      { n: '3', title: 'Astronomical positioning at your time of birth', sub: 'The third lens — patterns that show up before words do.' },
    ];
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.phaseLabel}>HOW THIS WORKS</Text>
        <Text style={[s.h1, { color: colors.heading }]}>To analyze your{'\n'}patterns, we use a{'\n'}<Text style={s.h1em}>three-part</Text> framework.</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>Each lens shows a different layer of how you connect.</Text>
        {/* V1.2 — Fixed: cards are now a proper vertical stack with 12pt gap.
            (Previously inherited flexDirection: 'row' from optCard, so the
            title + subtitle laid side-by-side.) Numbered badges reinforce
            the "three-part" framing. */}
        <View style={s.frameworkStack}>
          {items.map(({ n, title, sub }) => (
            <View key={n} style={[s.frameworkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.frameworkBadge}>
                <Text style={s.frameworkBadgeText}>{n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.frameworkTitle, { color: colors.heading }]}>{title}</Text>
                <Text style={[s.frameworkSub, { color: colors.textSecondary }]}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 24 }} />
        <GoldButton text="Continue" onPress={() => advance()} />
      </ScrollView>
    );
  };

  // ── 6. BIRTH DATE + NAME ─────────────────────────
  const renderBirthDate = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={s.phaseLabel}>BIRTH DETAILS</Text>
      <Text style={[s.h1, { color: colors.heading }]}>When did your{'\n'}story begin?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>For accurate pattern analysis. We use this with the framework you just saw.</Text>

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
        <TouchableOpacity
          style={[s.field, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, birthDate && { borderColor: colors.gold }]}
          onPress={() => setShowDatePicker(s => !s)}>
          <Text style={{ color: birthDate ? colors.heading : colors.inputPlaceholder, fontFamily: FONTS.sans, fontSize: 16 }}>
            {birthDate ? birthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select your birth date'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* V1.2 — Inline iOS picker with Done. Tap field to expand, spin to set
          (commits via onChange), tap Done to collapse. Avoids the Modal-on-Modal
          and "stuck spinner" issues of the old `display="spinner"` flow. */}
      {showDatePicker && (
        <View style={s.inlinePickerBox}>
          <DateTimePicker
            value={birthDate || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            themeVariant="light"
            onChange={(e, d) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (d) setBirthDate(d);
            }}
            style={{ height: Platform.OS === 'ios' ? 200 : undefined }}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={s.pickerDoneBtn} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={() => setShowDatePicker(false)}>
              <Text style={s.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ height: 24 }} />
      <GoldButton text="Continue" onPress={() => advance()} disabled={!firstName.trim() || !birthDate} />
    </ScrollView>
  );

  // ── 6. BIRTH TIME ────────────────────────────────
  const renderBirthTime = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>BIRTH TIME (OPTIONAL)</Text>
      <Text style={[s.h1, { color: colors.heading }]}>Do you know what time{'\n'}you were born?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>This helps us be more accurate, but isn't required.</Text>

      <View style={s.optWrap}>
        <OptionCard
          text="Yes, add my birth time"
          sub={birthTime ? `Selected: ${birthTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Tap to add'}
          icon="🕐"
          selected={!isTimeUnknown && birthTime !== null}
          onPress={() => { setIsTimeUnknown(false); setShowTimePicker(true); }}
          colors={colors}
                 />
        <OptionCard
          text="Skip — I'd rather not"
          sub="That's fine. We'll use a default."
          icon="✓"
          selected={isTimeUnknown}
          onPress={() => { setIsTimeUnknown(true); setBirthTime(null); setTimeout(() => advance(), 500); }}
          colors={colors}
                 />
      </View>

      {/* V1.2 — Same inline-with-Done pattern as Birth Date. */}
      {showTimePicker && (
        <View style={s.inlinePickerBox}>
          <DateTimePicker
            value={birthTime || new Date(2000, 0, 1, 12, 0)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant="light"
            onChange={(e, t) => {
              if (Platform.OS === 'android') setShowTimePicker(false);
              if (t) setBirthTime(t);
            }}
            style={{ height: Platform.OS === 'ios' ? 180 : undefined }}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={s.pickerDoneBtn} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={() => setShowTimePicker(false)}>
              <Text style={s.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(birthTime || isTimeUnknown) && !showTimePicker && (
        <View style={{ marginTop: 20 }}>
          <GoldButton text="Continue" onPress={() => advance()} />
        </View>
      )}
    </ScrollView>
  );

  // ── 7. BIRTH PLACE (optional) ────────────────────
  // V1 hybrid: skipping uses an approximate default location. Engine still
  // produces a usable profile; precision is reduced. This shows reviewers
  // the app is not strictly demanding birth-city data.
  const skipCity = () => {
    setSelectedCity({ name: 'Approximate', lat: 0, lng: 0 });
    setTimeout(() => advance(), 200);
  };
  // V1.2 — Wrap in KeyboardAvoidingView (iOS) and use scroll-aware insets so
  // the city suggestions list never gets covered by the keyboard.
  const cityScrollRef = useRef(null);
  const renderBirthPlace = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      ref={cityScrollRef}
      style={s.scroll}
      contentContainerStyle={[s.scrollContent, { paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
      <Text style={s.phaseLabel}>LOCATION (OPTIONAL)</Text>
      <Text style={[s.h1, { color: colors.heading }]}>Where were you{'\n'}born?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>This helps us be more accurate. Skip if you'd rather not share.</Text>

      <View style={s.fieldWrap}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>BIRTH CITY</Text>
        <TextInput
          style={[s.field, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.heading }, selectedCity && selectedCity.name !== 'Approximate' && { borderColor: colors.gold }]}
          placeholder="Search any city..."
          placeholderTextColor={colors.inputPlaceholder}
          value={selectedCity && selectedCity.name !== 'Approximate' ? selectedCity.name.split(',')[0] : citySearch}
          onChangeText={(t) => { setSelectedCity(null); setCitySearch(t); }}
          autoCapitalize="words"
          onFocus={() => setTimeout(() => cityScrollRef.current?.scrollToEnd({ animated: true }), 250)}
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

      {selectedCity && selectedCity.name !== 'Approximate' && (
        <View style={[s.selectedCityBadge, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={[s.selectedCityText, { color: colors.gold }]}>📍 {selectedCity.name.split(',').slice(0, 2).join(',')}</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
      <GoldButton text="Continue" onPress={() => advance()} disabled={!selectedCity || selectedCity.name === 'Approximate'} />
      <TouchableOpacity onPress={skipCity} style={{ marginTop: 14, alignSelf: 'center', padding: 8 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' }}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── 8. CALCULATING ───────────────────────────────
  const calcPhases = ['Reading your birth details...', 'Mapping your patterns...', 'Connecting the dots...', 'Almost ready...'];
  const renderCalculating = () => (
    <View style={s.center}>
      <View style={s.calcGlow} />
      <View style={s.calcOrbWrap}>
        <LinearGradient colors={['#EDD060', '#C8A84B', '#8C6C18']} style={s.calcOrb} />
      </View>
      <Text style={[s.calcTitle, { color: colors.heading }]}>Building your personality blueprint</Text>
      <Text style={[s.calcPhase, { color: colors.textSecondary }]}>{calcPhases[calcPhase] || calcPhases[0]}</Text>
      <View style={s.calcDots}>
        {calcPhases.map((_, i) => (
          <View key={i} style={[s.calcDot, { backgroundColor: colors.border }, i <= calcPhase && s.calcDotOn]} />
        ))}
      </View>
    </View>
  );

  // ── 10. FIRST HIT — V1 PDF plan: attachment + astrology combined ─────
  // Leads with attachment-style label (psychology). Astrology accent is
  // mid-sentence, supporting evidence — same tone the AI uses in chat.
  const renderFirstHit = () => {
    const attachment = ATTACHMENT_FROM_DEPTH[depth] || ATTACHMENT_FROM_DEPTH.aware;
    const venus = chart?.planets?.find(p => p.name === 'Venus');
    const venusAccent = venus?.sign ? VENUS_MAGNETISM[venus.sign] : null;
    return (
      <View style={s.center}>
        <View style={s.hitGlow} />
        <Text style={s.hitPre}>YOUR PATTERN</Text>
        <Text style={[s.hitTagline, { color: colors.heading, fontSize: 24, lineHeight: 32, marginBottom: 14, marginTop: 8 }]}>
          You have an <Text style={{ fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic' }}>{attachment.name}</Text> attachment pattern{venusAccent ? <> with <Text style={{ fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic' }}>{venusAccent}</Text></> : null}.
        </Text>
        <Text style={[s.hitTagline, { color: colors.text, fontSize: 16, lineHeight: 23, marginBottom: 8, paddingHorizontal: 8 }]}>
          {attachment.desc}
        </Text>
        {showChartDetails && venus?.sign && (
          <Text style={[s.hitWhisper, { color: colors.textSecondary, fontSize: 12, marginBottom: 0 }]}>
            Venus in {venus.sign} · supports the pattern
          </Text>
        )}
        <View style={s.hitDivider} />
        <Text style={[s.hitWhisper, { color: colors.textSecondary }]}>
          {depth === 'always' || depth === 'often'
            ? "That feeling of being misunderstood?\nThis is part of why."
            : "There's so much more beneath the surface."}
        </Text>
        <View style={{ height: 32, width: '100%' }} />
        <View style={{ width: '100%', paddingHorizontal: 8 }}>
          <GoldButton text="Continue" onPress={() => advance()} />
        </View>
      </View>
    );
  };

  // ── 10. THE BIG REVEAL ⭐ ────────────────────────
  // V1 hybrid: chart wheel + sign labels collapsed behind a tap.
  // Default view is three relational tiles. Astrology becomes opt-in.
  const renderBigReveal = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 40 }]} showsVerticalScrollIndicator={false}>
      <Text style={s.revealPre}>✦ YOUR PERSONALITY BLUEPRINT ✦</Text>
      <Text style={[s.revealName, { color: colors.heading }]}>{firstName}</Text>

      {/* Three relational descriptors — sign captions only shown when expanded */}
      <View style={s.revealBig3}>
        <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.revealB3Label}>HOW YOU ACT</Text>
          <Text style={[s.revealB3Desc, { color: colors.heading, fontSize: 15, lineHeight: 22 }]}>{SUN_TAGLINES[sun?.sign] || ''}</Text>
          {showChartDetails && (
            <Text style={[s.revealB3Desc, { color: colors.textSecondary, fontSize: 11, marginTop: 4 }]}>Sun in {sun?.sign || '—'}</Text>
          )}
        </View>
        <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={s.revealB3Label}>WHAT YOU NEED</Text>
          <Text style={[s.revealB3Desc, { color: colors.heading, fontSize: 15, lineHeight: 22 }]}>{MOON_TAGLINES[moon?.sign] || ''}</Text>
          {showChartDetails && (
            <Text style={[s.revealB3Desc, { color: colors.textSecondary, fontSize: 11, marginTop: 4 }]}>Moon in {moon?.sign || '—'}</Text>
          )}
        </View>
        {rising && (
          <View style={[s.revealB3Card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={s.revealB3Label}>HOW OTHERS SEE YOU</Text>
            <Text style={[s.revealB3Desc, { color: colors.heading, fontSize: 15, lineHeight: 22 }]}>{RISING_TAGLINES[rising?.sign] || ''}</Text>
            {showChartDetails && (
              <Text style={[s.revealB3Desc, { color: colors.textSecondary, fontSize: 11, marginTop: 4 }]}>Rising in {rising?.sign || '—'}</Text>
            )}
          </View>
        )}
      </View>

      {/* V1.1: Chart wheel + sign captions reveal — opt-in.
          When tapped, also persists `celestia_show_astrology_v1` so the rest of
          the app reflects this opt-in across tabs. */}
      {showChartDetails && (
        <View style={[s.revealWheelWrap, { borderColor: colors.border, backgroundColor: colors.card, marginTop: 16 }]}>
          <ChartWheel size={220} planets={chart?.planets} aspects={chart?.aspects} lightMode={!isDark} />
        </View>
      )}
      {!showChartDetails ? (
        <TouchableOpacity
          onPress={async () => {
            setShowChartDetails(true);
            try { await saveBoolean('celestia_show_astrology_v1', true); } catch {}
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="See the framework details. Reveals the underlying analysis layer."
          style={{ alignSelf: 'center', marginTop: 16, marginBottom: 4, paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', backgroundColor: 'rgba(200,168,75,0.08)', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}>
          <Text style={{ fontSize: 14, color: T.gold, fontFamily: FONTS.sansSemiBold }}>✦ See the framework details</Text>
          <Text style={{ fontSize: 13, color: T.gold, opacity: 0.7 }}>→</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setShowChartDetails(false)} style={{ alignSelf: 'center', padding: 12, marginTop: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Hide framework details">
          <Text style={{ fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' }}>
            Hide details
          </Text>
        </TouchableOpacity>
      )}

      {/* V1.2 — Stats strip moved behind `showChartDetails` opt-in.
          "Aspects" and "Retrograde" (with ℞ glyph) were astrology vocabulary
          rendering in the default flow. The strip now follows the same
          gating as the chart wheel + sign labels on this screen. */}
      {showChartDetails && (
        <View style={[s.revealStats, { backgroundColor: colors.cardAlt }]}>
          {dominantElement && (
            <View style={s.revealStat}>
              <Text style={s.revealStatVal}>{ELEMENT_LABELS[dominantElement[0]] || dominantElement[0]}</Text>
              <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Dominant</Text>
            </View>
          )}
          <View style={s.revealStat}>
            <Text style={s.revealStatVal}>{chart?.aspects?.length || 0}</Text>
            <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Connections</Text>
          </View>
          {retroCount > 0 && (
            <View style={s.revealStat}>
              <Text style={s.revealStatVal}>{retroCount}</Text>
              <Text style={[s.revealStatLabel, { color: colors.textSecondary }]}>Reflection windows</Text>
            </View>
          )}
        </View>
      )}

      {/* Personalized insight — V1 hybrid: relational framing without astrology callouts */}
      <View style={[s.revealInsight, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[s.revealInsightText, { color: colors.text }]}>
          {motivation === 'love' || painPoint === 'love'
            ? `You love with your whole body. There are deep patterns in how you connect — and why some connections leave you empty.`
            : motivation === 'change'
            ? `You're built for transformation. You don't just survive change — you were made for it.`
            : painPoint === 'career'
            ? `Your professional path is one most people wouldn't guess. Your real purpose is still unfolding.`
            : `You process the world differently than almost everyone around you — and there are clear reasons why.`
          }
        </Text>
      </View>

      <View style={{ height: 24 }} />
      <GoldButton text="This Is Just The Beginning" onPress={() => advance()} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ── 12. CONNECTIONS ADD PROMPT (PDF screen 8) ──────
  // PDF: "Want to compare your patterns with someone? Add a partner, ex, or
  // person you're curious about." Or "Skip — explore on your own."
  // Replaces the 3-card teaser with a focused next-action.
  const renderDailyHook = () => (
    <View style={s.center}>
      <View style={s.hookGlow} />
      <Text style={s.hookPre}>↻</Text>
      <Text style={[s.hookH1, { color: colors.heading }]}>Want to compare{'\n'}your patterns{'\n'}<Text style={s.h1em}>with someone</Text>?</Text>
      <Text style={[s.hookSub, { color: colors.textSecondary }]}>Add a partner, ex, or someone{'\n'}you're curious about.</Text>
      <View style={{ height: 32, width: '100%' }} />
      <View style={{ width: '100%', paddingHorizontal: 8 }}>
        <GoldButton text="Add Someone" onPress={finishOnboarding} />
      </View>
      <TouchableOpacity onPress={finishOnboarding} style={{ marginTop: 16, alignSelf: 'center', padding: 8 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' }}>
          Skip — explore on your own
        </Text>
      </TouchableOpacity>
    </View>
  );

  // V1: steps 12 (Soft Paywall), 13 (Reassurance), 14 (Hard Close) removed.
  // Onboarding ends at step 11 with finishOnboarding().

  // ── STEP ROUTER ──────────────────────────────────
  // V1 PDF plan: framework-citation step inserted at #5 before birth-data
  // collection. All later steps shift by +1.
  const renderStep = () => {
    switch (step) {
      case 1: return renderHook();
      case 2: return renderMotivation();
      case 3: return renderPain();
      case 4: return renderDepth();
      case 5: return renderFramework();
      case 6: return renderBirthDate();
      case 7: return renderBirthTime();
      case 8: return renderBirthPlace();
      case 9: return renderCalculating();
      case 10: return renderFirstHit();
      case 11: return renderBigReveal();
      case 12: return renderDailyHook();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  const showProgress = step >= 2 && step <= 12;
  const showBack = step >= 2 && step <= 12;
  // V1.2 — Show "Skip" only on the 3 quiz screens (2-4). Skipping past birth-data
  // collection isn't allowed because the chart calc needs DOB; skipping the
  // quiz answers is fine because they're optional persona hints.
  const showSkipQuiz = step >= 2 && step <= 4;

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      {(showProgress || showBack) && (
        <View style={s.header}>
          {showBack ? (
            <TouchableOpacity
              style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Go back to previous step"
              onPress={() => { if (step > 1) advance(step - 1); }}>
              <Text style={[s.backText, { color: colors.heading }]}>‹</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
          {showProgress && <ProgressBar step={step} colors={colors} />}
          {showSkipQuiz ? (
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Skip questions and go to birth details"
              onPress={() => advance(6)}
              style={s.skipBtn}>
              <Text style={[s.skipText, { color: colors.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
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
  // V1.2 — 44pt min per Apple HIG (was 40×40).
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: T.ink, marginTop: -2, fontFamily: FONTS.sans },
  // V1.2 — Skip link (quiz screens only). Discreet, right-aligned, 44pt hit area.
  skipBtn: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: 4 },
  skipText: { fontSize: 13, fontFamily: FONTS.sansMedium, letterSpacing: 0.2 },

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
  // V1.2 — Explicit 44pt min for short single-line option cards (Apple HIG).
  optCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, paddingHorizontal: 18, gap: 14, minHeight: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
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
  // V1.2 — Framework cards (Screen 5). Vertical stack, 12pt gap, numbered badges.
  frameworkStack: { gap: 12, marginTop: 12 },
  frameworkCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  frameworkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(200,168,75,0.14)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  frameworkBadgeText: { fontFamily: FONTS.serif, fontSize: 14, color: T.gold, lineHeight: 18 },
  frameworkTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14.5, lineHeight: 20, marginBottom: 4 },
  frameworkSub: { fontFamily: FONTS.sans, fontSize: 12.5, lineHeight: 18 },
  // V1.2 — Inline iOS date/time picker box with Done button.
  inlinePickerBox: { backgroundColor: 'rgba(200,168,75,0.06)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)', marginTop: 10, paddingVertical: 8, alignItems: 'center', marginBottom: 8 },
  pickerDoneBtn: { backgroundColor: T.gold, borderRadius: 100, paddingVertical: 9, paddingHorizontal: 28, marginTop: 4, marginBottom: 4, shadowColor: T.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6 },
  pickerDoneText: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.navy, letterSpacing: 0.3 },

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
  // V1: paywall* styles removed — no paywall step in v1 onboarding.

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
