import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  TextInput, Platform, ActivityIndicator, Dimensions, ScrollView,
  PanResponder, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';

const AnimatedSvgCircle = Animated.createAnimatedComponent(SvgCircle);
import { T, FONTS } from '../constants/theme';
import { AUTH_ENABLED } from '../constants/featureFlags';
import { useTheme } from '../contexts/ThemeContext';
import ChartWheel from '../components/ChartWheel';
import CelestiaMotif from '../components/CelestiaMotif';
import CelestialSigil from '../components/CelestialSigil';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { calculateChart, getTransitPlanets, getMoonDataForDate } from '../services/astrologyService';
import * as Crypto from 'expo-crypto';
import { useAnalytics, EVENTS, buildUserProperties } from '../services/analytics';
import { getNotificationSettings, saveNotificationSettings, applyNotificationBundle } from '../services/notificationService';
import { haptic } from '../services/hapticService';

const { width, height } = Dimensions.get('window');
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TOTAL_STEPS = 14;

// ── Design system constants ──────────────────────────────
// Source of truth for new styles. Legacy values will be migrated incrementally
// — don't refactor working styles unless they're visibly off the scale.
//
// SPACING — linear scale, use only these values for padding/gap/margin.
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
// TYPE — body sizes constrained to {12, 13, 14, 16}. Heading sizes free per
// modular scale. Don't introduce 13.5, 15, 17, etc.
const TZ = { caption: 12, label: 13, body: 14, lead: 16 };
// LINE — line-height multipliers. tight for headings, normal for body,
// relaxed for long-form blocks.
const LH = { tight: 1.2, normal: 1.45, relaxed: 1.6 };
// SHADOW — three elevations. Don't invent intermediate values.
const SHADOW = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6 },
};
// GOLD-USAGE RULES — gold (T.gold) is reserved for:
//   1. Phase labels (small uppercase letter-spaced)
//   2. GoldButton (the gold-gradient button only — paywall/transactional)
//   3. Selected-state borders + radio dots (option cards, planet cards)
//   4. Plan badges ("BEST VALUE")
//   5. Semantic affirmatives (✓ checkmarks in solution bridge, NAVIGATE TOWARD)
// Everywhere else, use T.stone for muted text and T.heading for emphasis.
// If you find yourself reaching for gold outside these slots, you're
// flattening the hierarchy.

// Pain points — multi-select per Adam Lyttle's questionnaire pattern.
// Replaces the previous single-select pain + depth screens. The `solution`
// field powers the bridge screen (renderSolutionBridge) where each
// selected pain is mirrored back alongside our fix.
const PAIN_OPTIONS = [
  { id: 'generic',       label: "Generic horoscopes that don't apply",        icon: '◌',  solution: "Daily readings from your actual placements — not your sun sign." },
  { id: 'self',          label: 'Confusion about who I really am',            icon: '☽',  solution: "Chart-grounded statements that make you nod, not roll your eyes." },
  { id: 'love',          label: 'Doubts about a relationship',                icon: '♡',  solution: "Real chart-to-chart synastry — not zodiac matching." },
  { id: 'career',        label: 'A career or purpose decision',               icon: '△',  solution: "Your Midheaven, 10th house, and current transits — read together." },
  { id: 'misunderstood', label: 'Feeling misunderstood by people around me',  icon: '◐',  solution: "Language for why you process the world differently from most." },
  { id: 'transition',    label: "A big transition I'm in the middle of",      icon: '≋',  solution: "Transit alerts when planets activate the part of your chart that's shifting." },
];

// Notification bundles surfaced on the new commitment-arc screen. Maps to
// BUNDLE_PRESETS in notificationService.js. Default = 'balanced'.
const NOTIF_BUNDLES = [
  {
    id: 'minimal',
    title: 'Just the morning.',
    desc: 'One reading at sunrise. Nothing else.',
    cadence: '1/day',
  },
  {
    id: 'balanced',
    title: 'Morning + a moment to reflect.',
    desc: 'A reading to start. A prompt to close.',
    cadence: '2/day',
  },
  {
    id: 'everything',
    title: 'Everything cosmic.',
    desc: 'Transits, retrogrades, lunations — the whole sky.',
    cadence: '5/wk',
  },
];

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

// One-word quality per sign per axis — used to compose the synthesis
// card's three-attribute portrait line on step 10.
//   Sun = how you DRIVE          (core motivation / will)
//   Moon = how you FEEL          (emotional landscape / need)
//   Rising = how you SHOW UP     (mask / first impression)
const SUN_QUALITY = {
  Aries: 'drive',       Taurus: 'patience',    Gemini: 'curiosity',
  Cancer: 'care',       Leo: 'heart',          Virgo: 'precision',
  Libra: 'grace',       Scorpio: 'depth',      Sagittarius: 'vision',
  Capricorn: 'rigor',   Aquarius: 'invention', Pisces: 'empathy',
};
const MOON_QUALITY = {
  Aries: 'fire',        Taurus: 'roots',       Gemini: 'restlessness',
  Cancer: 'tenderness', Leo: 'pride',          Virgo: 'order',
  Libra: 'harmony',     Scorpio: 'intensity',  Sagittarius: 'wonder',
  Capricorn: 'reserve', Aquarius: 'distance',  Pisces: 'flow',
};
const RISING_QUALITY = {
  Aries: 'edge',        Taurus: 'calm',        Gemini: 'wit',
  Cancer: 'softness',   Leo: 'warmth',         Virgo: 'composure',
  Libra: 'charm',       Scorpio: 'mystery',    Sagittarius: 'openness',
  Capricorn: 'gravity', Aquarius: 'remove',    Pisces: 'gentleness',
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

const OptionCard = ({ text, sub, selected, onPress, icon, colors, compact }) => {
  const c = colors || {};
  return (
    <TouchableOpacity
      style={[
        s.optCard,
        compact && s.optCardCompact,
        { backgroundColor: c.card || T.white, borderColor: c.border || T.border },
        selected && { borderColor: T.gold, borderWidth: 1.5 },
      ]}
      onPress={onPress} activeOpacity={0.7}
      accessibilityRole="radio"
      accessibilityLabel={sub ? `${text}. ${sub}` : text}
      accessibilityState={{ selected: !!selected }}
    >
      {icon && (
        <Text
          style={[s.optIcon, compact && s.optIconCompact]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">{icon}</Text>
      )}
      <View style={{ flex: 1 }}>
        <Text style={[s.optText, compact && s.optTextCompact, { color: c.text || T.ink }, selected && { color: c.heading || T.navy }]}>{text}</Text>
        {sub && <Text style={[s.optSub, { color: c.textSecondary || T.stone }, selected && { color: c.text || T.ink }]}>{sub}</Text>}
      </View>
      <View style={[s.optRadio, compact && s.optRadioCompact, { borderColor: c.border || T.border }, selected && { borderColor: T.gold, backgroundColor: c.card || T.white }]}>
        {selected && <View style={[s.optRadioDot, compact && s.optRadioDotCompact]} />}
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
        colors={disabled ? ['#D0C4A8', '#B8AC90'] : ['#D4A853', '#E9C176', '#FFD89C']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={[s.goldBtn, disabled && { opacity: 0.6 }]}
      >
        {loading ? <ActivityIndicator color={T.navy} /> : <Text style={s.goldBtnText}>{text}</Text>}
      </LinearGradient>
    </TouchableOpacity>
    {sub && <Text style={[s.goldBtnSub, c && { color: c.textSecondary }]}>{sub}</Text>}
  </View>
);

// Ceremonial CTA — clay solid, no gradient. Used on the *moments* of the
// flow (Hook, Active Reveal, Preview, Wake-anchor) so the gold gradient
// stays reserved for transactional commitments (paywall, plan select).
// Matches iOS-version's two-tier hierarchy.
// HomeStyleCta — peach→lavender gradient pill matching HomeScreenV2's
// chipLarge "Go deeper" button. Used as the primary CTA on onboarding
// screens that should hand off seamlessly to the Today tab's button
// language. Disabled state mutes the gradient + reduces opacity.
const HomeStyleCta = ({ text, onPress, disabled }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    disabled={!!disabled}
    style={[s.hookCtaShadow, disabled && { shadowOpacity: 0.10 }]}
    accessibilityRole="button"
    accessibilityLabel={text}
    accessibilityState={{ disabled: !!disabled }}>
    <LinearGradient
      colors={disabled ? ['#E8E1D8', '#DDD8E5'] : ['#FED9B8', '#E9DDFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[s.hookCtaGradient, disabled && { opacity: 0.7 }]}>
      <Text style={[s.hookCtaText, disabled && { color: 'rgba(27,28,28,0.45)' }]}>{text}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

const HeroCta = ({ text, onPress, sub, disabled }) => (
  <View style={{ alignItems: 'center', gap: 10, width: '100%' }}>
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!!disabled}
      style={[s.heroCta, disabled && { opacity: 0.5 }]}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: !!disabled }}>
      <Text style={s.heroCtaText}>{text}</Text>
    </TouchableOpacity>
    {sub && <Text style={s.heroCtaSub}>{sub}</Text>}
  </View>
);

// Tiny outline lock used on the locked reveal cards. Two stacked Views —
// hairline shackle (rounded top, no bottom border) above a hairline body.
// Stroke matches the brass accent.
const LockGlyph = ({ color = '#B89968', size = 14 }) => {
  const stroke = 1;
  const shackleW = size * 0.6;
  const shackleH = size * 0.45;
  const bodyW = size * 0.85;
  const bodyH = size * 0.6;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{
        width: shackleW,
        height: shackleH,
        borderTopLeftRadius: shackleW,
        borderTopRightRadius: shackleW,
        borderWidth: stroke,
        borderBottomWidth: 0,
        borderColor: color,
        marginBottom: -stroke,
      }} />
      <View style={{
        width: bodyW,
        height: bodyH,
        borderWidth: stroke,
        borderColor: color,
      }} />
    </View>
  );
};

// Custom time wheel — pure-RN snap-scroll picker that bypasses the
// native iOS DateTimePicker, which is unreliable across iOS versions
// when the app's userInterfaceStyle is overridden (the parent UIView
// trait collection wins over themeVariant + textColor on spinner mode,
// per Expo issue #5897 and datetimepicker issue #308). Three columns:
// hour 1-12, minute in 5-minute steps, AM/PM. Snap-to-row scroll with
// momentum. Center band visually highlighted with hairline + gold.
const WHEEL_ROW_HEIGHT = 40;
const WHEEL_VISIBLE_ROWS = 5; // 2 above + selected + 2 below

const TimeWheel = ({ values, selectedValue, onValueChange, formatter }) => {
  const scrollRef = useRef(null);
  const lastReportedRef = useRef(selectedValue);
  const selectedIndex = values.indexOf(selectedValue);

  // Initial scroll into position when the column mounts
  useEffect(() => {
    if (selectedIndex >= 0 && scrollRef.current) {
      // Defer so layout has settled
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: selectedIndex * WHEEL_ROW_HEIGHT, animated: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snap-and-report — runs on both momentum-end (fast flick) and
  // drag-end (slow drag without momentum). Deduped via lastReportedRef
  // so parent doesn't get duplicate updates from both events.
  const snapToOffset = (offsetY) => {
    const idx = Math.round(offsetY / WHEEL_ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const next = values[clamped];
    if (next !== lastReportedRef.current) {
      lastReportedRef.current = next;
      try { haptic.light(); } catch {}
      onValueChange(next);
    }
    // Force-snap the visual position in case snapToInterval's snap
    // didn't quite land on a whole row (rare but observed on iOS 17).
    const targetY = clamped * WHEEL_ROW_HEIGHT;
    if (Math.abs(offsetY - targetY) > 1 && scrollRef.current) {
      scrollRef.current.scrollTo({ y: targetY, animated: true });
    }
  };

  return (
    <View style={{ flex: 1, height: WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        // Android-specific — without this, the parent ScrollView (the
        // wake-anchor screen wrapper) captures the gesture and the inner
        // wheel never scrolls. iOS ignores this prop (no-op).
        nestedScrollEnabled
        // Also Android — keep all rows mounted so snap math doesn't break
        // when a row scrolls out of the visible window.
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingVertical: WHEEL_ROW_HEIGHT * 2 }}
        onMomentumScrollEnd={(e) => snapToOffset(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => snapToOffset(e.nativeEvent.contentOffset.y)}
      >
        {values.map((val, i) => {
          const isSelected = val === selectedValue;
          return (
            <View key={`${val}-${i}`} style={{ height: WHEEL_ROW_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontFamily: FONTS.serif,
                fontSize: isSelected ? 26 : 19,
                color: isSelected ? '#3A1A28' : 'rgba(58,26,40,0.32)',
                lineHeight: WHEEL_ROW_HEIGHT - 6,
              }}>
                {formatter ? formatter(val) : val}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// Mock cards for the Tinder swipe stack on step 10. Each card is a
// faithful mock of the real HomeScreenV2 card the user will see daily.
// Matches V2's gradients, motif badges, editorial fonts, magazine vs
// centered layout, and card chrome (90% × 4/5, lavender shadow, rounded 32).
//
// Slot gradients (cream-dominant, V2 palette):
const V2_SLOT_GRADIENTS = {
  anchor:  ['#FFEFD9', '#FBF5EE', '#FAF6EE'],   // peach
  love:    ['#FBE5DD', '#FBF1EC', '#FAF6EE'],   // rose-pink
  career:  ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue
  growth:  ['#FBE3B5', '#FAF1DC', '#FAF6EE'],   // amber
  sky:     ['#E0E8F2', '#F2F4F8', '#FAF6EE'],   // cool blue
  reflect: ['#F0E4E8', '#F8F0F2', '#FAF6EE'],   // mauve
};

// Long magazine-style date for the anchor card header.
const v2DateLabel = (date = new Date()) => {
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

// Common card chrome — gradient + sheen + outer container styled to match
// HomeScreenV2's cardLifted + cardGradient + sheen.
const V2CardChrome = ({ slot, children }) => (
  <View style={s.v2CardLifted}>
    <LinearGradient
      colors={V2_SLOT_GRADIENTS[slot] || V2_SLOT_GRADIENTS.anchor}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={s.v2CardGradient}>
      {/* Top sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']}
        locations={[0, 0.4]}
        style={s.v2Sheen}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  </View>
);

// Compact variant for the hook-screen swipe stack — same gradient/sheen
// language as V2CardChrome, smaller paddings + radius to fit a 360×300
// frame instead of the full 90% × 4/5 V2 card.
const V2CardChromeSm = ({ slot, children }) => (
  <View style={s.v2CardLiftedSm}>
    <LinearGradient
      colors={V2_SLOT_GRADIENTS[slot] || V2_SLOT_GRADIENTS.anchor}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={s.v2CardGradientSm}>
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']}
        locations={[0, 0.4]}
        style={s.v2SheenSm}
        pointerEvents="none"
      />
      {children}
    </LinearGradient>
  </View>
);

// 1. Anchor mock — magazine layout (motif top-left + tag pill + date top-right
//    + left-aligned headline + meta + season chip). Mirrors V2 'anchor' slot.
const renderHomeAnchorMockV2 = ({ firstName, sunSign, moonSign, painPoints }) => {
  const headline = painPoints?.includes('love')
    ? 'A relationship pattern is asking to be named.'
    : painPoints?.includes('career')
    ? "A door is opening you didn't know existed."
    : painPoints?.includes('transition')
    ? "The thing you're building has a shape now."
    : `Today, the ${moonSign || 'Moon'} meets your ${sunSign || 'core'} — softly.`;
  const meta = `A reading shaped by your placements, ${firstName || 'you'}. Not a generic horoscope.`;

  return (
    <V2CardChrome slot="anchor">
      <View style={s.v2AnchorContent}>
        <View style={s.v2AnchorHeader}>
          <View style={s.v2AnchorHeaderLeft}>
            <View style={s.v2MotifBadge}>
              <CelestiaMotif kind="today" size={44} color="#1A1410" />
            </View>
            <View style={s.v2TagPillAnchor}>
              <Text style={s.v2TagLabel}>TODAY</Text>
            </View>
          </View>
          <Text style={s.v2DateInline}>{v2DateLabel()}</Text>
        </View>

        <View style={s.v2AnchorBody}>
          <Text style={s.v2HeadlineLeft} numberOfLines={3}>{headline}</Text>
          <Text style={s.v2MetaLeft} numberOfLines={2}>{meta}</Text>
          <View style={s.v2SeasonChip}>
            <Text style={s.v2SeasonLabel}>YOUR SEASON</Text>
            <Text style={s.v2SeasonValue} numberOfLines={1}>
              Saturn in {sunSign || 'Pisces'} · 73%
            </Text>
          </View>
        </View>
      </View>
    </V2CardChrome>
  );
};

// 2. Spotlight mock — life area in centered layout. Picks love or career
//    based on user's painPoints, falls back to growth.
const renderHomeSpotlightMockV2 = ({ painPoints }) => {
  const area = painPoints?.includes('love')
    ? { slot: 'love', motif: 'love', tag: 'LOVE', headline: 'Today, the version of you who feels deeply is the gift.', meta: 'Venus is forming a soft trine to your natal Moon — your defenses are quieter than usual.' }
    : painPoints?.includes('career')
    ? { slot: 'career', motif: 'career', tag: 'CAREER', headline: "You don't need permission. You need a sentence.", meta: 'Mercury direct in a fire sign — your words land sharper than you think today.' }
    : { slot: 'growth', motif: 'growth', tag: 'GROWTH', headline: 'The thing you are tired of is the thing about to change.', meta: 'Saturn is making slow contact with your core — small, patient work compounds now.' };

  return (
    <V2CardChrome slot={area.slot}>
      <View style={s.v2ContentInner}>
        <View style={s.v2MotifBadge}>
          <CelestiaMotif kind={area.motif} size={44} color="#1A1410" />
        </View>
        <View style={s.v2TagPill}>
          <Text style={s.v2TagLabel}>{area.tag}</Text>
        </View>
        <Text style={s.v2Headline} numberOfLines={3}>{area.headline}</Text>
        <Text style={s.v2Meta} numberOfLines={3}>{area.meta}</Text>
      </View>
    </V2CardChrome>
  );
};

// 3. Sky mock — magazine layout with data widgets (MOON / TRANSIT cells)
//    + context tag chips below. Mirrors V2 'sky' slot exactly.
const renderHomeSkyMockV2 = ({ moonSign, moonPhase, sunSign }) => {
  const phase = moonPhase || 'Waxing Gibbous';
  const sign = moonSign || 'Cancer';
  const headline = `${phase} in ${sign}`;
  const tags = ['Flow', 'Harmony', 'Ease'];

  return (
    <V2CardChrome slot="sky">
      <View style={s.v2AnchorContent}>
        <View style={s.v2AnchorHeader}>
          <View style={s.v2AnchorHeaderLeft}>
            <View style={s.v2MotifBadge}>
              <CelestiaMotif kind="sky" size={44} color="#1A1410" />
            </View>
            <View style={s.v2TagPillAnchor}>
              <Text style={s.v2TagLabel}>TODAY'S SKY</Text>
            </View>
          </View>
        </View>

        <View style={s.v2AnchorBody}>
          <Text style={s.v2HeadlineLeft} numberOfLines={2}>{headline}</Text>

          <View style={s.v2DataRow}>
            <View style={s.v2DataCell}>
              <Text style={s.v2DataLabel}>MOON</Text>
              <Text style={s.v2DataValue} numberOfLines={1}>{phase}</Text>
              <Text style={s.v2DataDetail} numberOfLines={2}>in {sign} · 67%</Text>
            </View>
            <View style={s.v2DataCell}>
              <Text style={s.v2DataLabel}>TRANSIT</Text>
              <Text style={s.v2DataValue} numberOfLines={1}>Venus</Text>
              <Text style={s.v2DataDetail} numberOfLines={2}>trine your {sunSign || 'Sun'}</Text>
            </View>
          </View>

          <View style={s.v2TagRow}>
            {tags.map((label, i) => (
              <View key={i} style={s.v2ContextTag}>
                <Text style={s.v2ContextTagText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </V2CardChrome>
  );
};

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function OnboardingFlowScreen({ navigation, route }) {
  const { setUserProfile } = useUserProfile();
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const { capture, identify } = useAnalytics();
  // Debug-jump support — accepts route.params.startStep so the dev panel
  // can land directly on a specific step (e.g., 14 for paywall preview).
  // In real onboarding flow, route.params is undefined → starts at 1.
  const [step, setStep] = useState(() => {
    const s = route?.params?.startStep;
    return typeof s === 'number' && s >= 1 && s <= TOTAL_STEPS ? s : 1;
  });
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Active-reveal animation refs (step 9 — tap-to-reveal Sun/Moon/Rising).
  // Per the questionnaire-skill pattern, the reveal must be earned via
  // user action, not auto-played. Each tap fires haptic + spring animation.
  const sunReveal = useRef(new Animated.Value(0)).current;
  const moonReveal = useRef(new Animated.Value(0)).current;
  const risingReveal = useRef(new Animated.Value(0)).current;
  const finaleReveal = useRef(new Animated.Value(0)).current;
  const [revealedPlanets, setRevealedPlanets] = useState([]);

  // Emotional selections.
  // painPoints is multi-select (array of ids from PAIN_OPTIONS). Replaces
  // the single-select painPoint + depth screens per the questionnaire-skill
  // pattern. We derive legacy painPoint + depth at finishOnboarding time
  // so downstream AI tone code keeps working without changes.
  const [motivation, setMotivation] = useState(null);
  const [painPoints, setPainPoints] = useState([]);

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

  // ── Calculating-screen animations (step 8) ─────────
  // Phase fade: text crossfades on swap (300ms out → swap → 300ms in).
  // Title pulse: subtle 1.0 → 1.02 scale loop, signals "alive."
  // Ring sweep: hairline gold circle that draws around 360° as phases
  // fire — the editorial "graphic" the skill asks for, in our voice.
  const calcPhaseFade = useRef(new Animated.Value(1)).current;
  const calcTitlePulse = useRef(new Animated.Value(0)).current;
  const calcRingSweep = useRef(new Animated.Value(0)).current;

  // Paywall CTA pulse — subtle breathing 1.0 → 1.02 → 1.0 loop on the
  // gold gradient button. Documented 12–18% conversion lift on subscription
  // paywalls (RevenueCat). Ties attention without demanding it.
  const paywallCtaPulse = useRef(new Animated.Value(0)).current;

  // Paywall
  const [selectedPlan, setSelectedPlan] = useState('annual');

  // Daily anchor — when user typically wakes / first checks phone.
  // Drives the morning-briefing notification time so it lands on their actual routine.
  // Null = unset; numeric value = hour (24h). 'varies' = non-fixed schedule (use default).
  // Default 7:00 AM — US adult average is ~6:45, but 7:00 leans intentional
  // and reads as "ritual," not "rushed alarm." Picker is hidden on arrival
  // and only opens when the user taps the time card — keeps the screen
  // calm rather than confronting them with iOS chrome immediately.
  const [wakeTime, setWakeTime] = useState(() => {
    const d = new Date();
    d.setHours(7, 0, 0, 0);
    return d;
  });
  const [showWakePicker, setShowWakePicker] = useState(false);

  // ── Hook screen swipe-stack state ────────────────
  // Three generic cards on screen 1 demonstrating the breadth of the
  // app (chat / tomorrow's reading / a placement). Auto-tease + manual
  // swipe, same mechanic as the personalized stack on screen 11. Cards
  // reset to 0 if the user goes back, so they always re-tease on entry.
  const [hookCardIndex, setHookCardIndex] = useState(0);
  const hookSwipeAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const hookUserInteractedRef = useRef(false);
  const hookAutoTimerRef = useRef(null);
  const hookTeaseTimerRef = useRef(null);

  // Notification bundle — three calibrated cadences the user picks from at step 12.
  // Default 'balanced' so a fast-tapper still ends up with a sane setup.
  // Per-channel notification toggles. 3 ON by default (the daily
  // essentials + transit alerts, our highest-engagement event push);
  // user can opt into the rest. Mirrors NotificationSettingsScreen's
  // structure so the in-app settings screen feels familiar after onboarding.
  const [notifChannels, setNotifChannels] = useState({
    cosmic_morning: true,
    evening_reflection: true,
    transit_alerts: true,
    weekly_digest: false,
    streak_guardian: false,
    cosmic_milestones: false,
  });

  // Active card index in the preview carousel (step 10) — drives the dots.
  const [previewIndex, setPreviewIndex] = useState(0);

  // Legacy fields derived from painPoints — kept so downstream AI tone code
  // (geminiService, persona prefs, the existing reveal copy below) continues
  // to work without changes. painPoint = first selected (or 'all' if 4+).
  // depth = 'often' when the user flagged feeling misunderstood, else 'aware'.
  const painPoint = painPoints.length >= 4 ? 'all' : (painPoints[0] || null);
  const depth = painPoints.includes('misunderstood') ? 'often' : 'aware';

  // Fire onboarding_started once on mount
  useEffect(() => { capture(EVENTS.ONBOARDING_STARTED); }, []);

  // Reveal-screen arrival (step 9). Per-card success haptics fire on each
  // tap; this entrance haptic just marks the screen change.
  useEffect(() => {
    if (step === 9) {
      try { haptic.light(); } catch {}
    }
  }, [step]);

  // Reveal a single planet card. Once all three are revealed, spring the
  // finale (stats strip + insight + CTA) in after a 350ms beat.
  const revealPlanet = (planet, anim) => {
    if (revealedPlanets.includes(planet)) return;
    try { haptic.success(); } catch {}
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }).start();
    setRevealedPlanets(prev => {
      const next = [...prev, planet];
      if (next.length === 3) {
        setTimeout(() => {
          Animated.timing(finaleReveal, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        }, 350);
      }
      return next;
    });
  };

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

    // Reset animations on entry
    calcPhaseFade.setValue(1);
    calcRingSweep.setValue(0);
    setCalcPhase(0);

    // Title pulse — subtle scale loop, runs the whole time the screen is up
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(calcTitlePulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(calcTitlePulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // Ring sweep — quarter sweep per phase, total ~2.4s for 4 phases
    Animated.timing(calcRingSweep, {
      toValue: phases.length,
      duration: phases.length * 600,
      useNativeDriver: false, // strokeDashoffset isn't native-driver compatible
    }).start();

    // Phase advance with text crossfade — fade out → swap → fade in
    let i = 0;
    const advancePhase = (next) => {
      Animated.timing(calcPhaseFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setCalcPhase(next);
        Animated.timing(calcPhaseFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    };

    const interval = setInterval(() => {
      i++;
      if (i < phases.length) advancePhase(i);
    }, 600);

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

    // Auto-advance after dramatic pause — matches ring sweep duration
    // (4 × 600ms = 2400ms) plus a small 600ms post-completion beat.
    const timeout = setTimeout(() => {
      clearInterval(interval);
      advance(9);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      pulseLoop.stop();
    };
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
        painPoints,         // canonical multi-select array
        painPoint,          // legacy single value derived from painPoints (back-compat)
        depth,              // legacy field derived from painPoints (back-compat)
      };
      await setUserProfile(profile);
      // Persist persona preferences for AI tone across the app
      try {
        const { saveObject } = require('../services/storage');
        await saveObject('celestia_persona_prefs', { motivation, painPoints, painPoint, depth });
      } catch (e) {}
      const userProps = await buildUserProperties(profile.id).catch(() => ({}));
      identify(profile.id, {
        ...userProps,
        sun_sign: chart?.sun?.sign,
        motivation,
        pain_points: painPoints,
        pain_point: painPoint,
      });
      capture(EVENTS.ONBOARDING_COMPLETED, {
        sun_sign: chart?.sun?.sign,
        motivation,
        pain_points: painPoints,
        pain_point: painPoint,
      });
      // Sign-in is temporarily disabled (Google Sign-In suspended). The profile
      // is already saved locally above, so go straight into the app. When auth
      // is re-enabled (AUTH_ENABLED), unauthenticated users are routed to Auth.
      if (user || !AUTH_ENABLED) {
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
  // Cream gradient + hairline mirrors the iOS-version Splash → Hook
  // continuity. Ceremonial CTA in clay (HeroCta) — the gold gradient
  // is reserved for paywall/transactional moments.
  // ── 1. HOOK — H1 + chat-demo card + CTA ──────────
  // Skill compliance: bold transformation outcome ("Ask your chart
  // anything") + a device preview (the chat bubbles below) showing the
  // wedge in action. Demo question + answer are the actual chat copy
  // Mia would type and the chart would respond — relationship pain is
  // her dominant trigger per the persona doc, the answer uses real
  // astrological language to telegraph specificity.
  const renderHook = () => (
    <View style={[s.hookScreen, { backgroundColor: '#FCF9F8' }]}>
      <Text style={s.hookKicker}>CELESTIA</Text>

      <Text style={[s.hookH1, { color: colors.heading }]}>Ask your chart{'\n'}anything.</Text>
      <Text style={[s.hookSub, { color: colors.textSecondary }]}>
        Real birth chart, real answers{'\n'}— not just sunshine.
      </Text>

      {/* Authority chip — NASA-grade math is our defensible credential
          (astronomy-engine uses VSOP/ELP ephemerides, same family as
          JPL DE). Same conversion lift Co-Star gets from "Powered by
          NASA" but placed between sub and cards as a credibility bridge. */}
      <View style={[s.hookAuthorityChip, { borderColor: T.brass, backgroundColor: 'rgba(184,153,104,0.08)' }]}>
        <Text style={[s.hookAuthorityGlyph, { color: T.brass }]}>❖</Text>
        <Text style={[s.hookAuthorityText, { color: T.navy }]}>NASA-GRADE EPHEMERIS DATA</Text>
      </View>

      {/* Swipe stack — three generic preview cards demonstrating the
          breadth of the app. Auto-tease + manual swipe. After the third
          card is swiped the area shows a quiet "this is yours" footer
          since the CTA is always visible below. */}
      <View style={[s.hookStackArea, { width: HOOK_CARD_WIDTH, height: HOOK_CARD_HEIGHT }]}>
        {(() => {
          const HOOK_CARDS = [
            { id: 'chat',     kind: 'chat' },
            { id: 'match',    kind: 'match' },
            { id: 'today',    kind: 'today' },
            { id: 'chart',    kind: 'chart' },
          ];

          if (hookCardIndex >= HOOK_CARDS.length) {
            return (
              <View style={{ width: HOOK_CARD_WIDTH, height: HOOK_CARD_HEIGHT }}>
                <V2CardChromeSm slot="anchor">
                  <View style={[s.hookCardBody, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
                    <Text style={s.hookStackEmptyKicker}>YOURS, EVERY MORNING</Text>
                    <Text style={s.hookStackEmptyText}>
                      All written from your{'\n'}real birth chart.
                    </Text>
                  </View>
                </V2CardChromeSm>
              </View>
            );
          }

          const renderCardContent = (kind) => {
            if (kind === 'chat') {
              return (
                <V2CardChromeSm slot="reflect">
                  <View style={s.hookCardBody}>
                    <View style={s.hookTagPill}><Text style={s.v2TagLabel}>ASK YOUR CHART</Text></View>
                    <View style={{ height: 12 }} />
                    <View style={s.hookBubbleRowRight}>
                      <View style={s.hookBubbleUser}>
                        <Text style={s.hookBubbleUserText}>
                          why do i keep falling for the same kind of guy?
                        </Text>
                      </View>
                    </View>
                    <View style={s.hookBubbleRowLeft}>
                      <View style={s.hookBubbleChart}>
                        <Text style={s.hookBubbleChartText} numberOfLines={4}>
                          Your Venus in Pisces mistakes intensity for chemistry. Mars in your 7th picks the unavailable one.
                        </Text>
                      </View>
                    </View>
                  </View>
                </V2CardChromeSm>
              );
            }
            if (kind === 'match') {
              return (
                <V2CardChromeSm slot="love">
                  <View style={s.hookCardBody}>
                    <View style={s.hookTagPill}><Text style={s.v2TagLabel}>COMPATIBILITY</Text></View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <View style={s.hookMatchRow}>
                        <View style={s.hookMatchPerson}>
                          <View style={s.hookMatchAvatar}>
                            <Text style={s.hookMatchInitial}>M</Text>
                          </View>
                          <Text style={s.hookMatchName}>Mia</Text>
                          <Text style={s.hookMatchSign}>♍ VIRGO</Text>
                        </View>
                        <View style={s.hookMatchScoreWrap}>
                          <Text style={s.hookMatchScore}>82</Text>
                          <Text style={s.hookMatchScorePct}>SYNASTRY</Text>
                        </View>
                        <View style={s.hookMatchPerson}>
                          <View style={s.hookMatchAvatar}>
                            <Text style={s.hookMatchInitial}>A</Text>
                          </View>
                          <Text style={s.hookMatchName}>Alex</Text>
                          <Text style={s.hookMatchSign}>♏ SCORPIO</Text>
                        </View>
                      </View>
                      <Text style={s.hookMatchInsight} numberOfLines={3}>
                        Magnetic but volatile. His Mars hits your Venus square — that's the chemistry, and the trap.
                      </Text>
                    </View>
                  </View>
                </V2CardChromeSm>
              );
            }
            if (kind === 'today') {
              return (
                <V2CardChromeSm slot="anchor">
                  <View style={s.hookCardBody}>
                    <View style={s.hookCardHeaderRow}>
                      <View style={s.hookTagPill}><Text style={s.v2TagLabel}>TODAY</Text></View>
                      <Text style={s.hookCardDate}>{v2DateLabel().split(', ')[1]}</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={s.hookTodayHeadline} numberOfLines={3}>
                        Today asks you to pause before reacting.
                      </Text>
                      <Text style={s.hookTodayBody} numberOfLines={3}>
                        Mercury squares your Moon. The text he sent isn't what it looks like — sleep on it.
                      </Text>
                      <Text style={s.hookTodayAttr}>
                        From your Virgo Sun · Scorpio Moon
                      </Text>
                    </View>
                  </View>
                </V2CardChromeSm>
              );
            }
            // chart
            return (
              <V2CardChromeSm slot="sky">
                <View style={s.hookCardBody}>
                  <View style={s.hookTagPill}><Text style={s.v2TagLabel}>YOUR CHART</Text></View>
                  <View style={s.hookPlacementBlock}>
                    <Text style={s.hookPlacementGlyph}>♀</Text>
                    <Text style={s.hookPlacementSign}>Venus in Pisces</Text>
                    <Text style={s.hookPlacementDegree}>2° 14'</Text>
                    <Text style={s.hookPlacementBody}>
                      You love through the merge — boundaries blur. The gift and the trap.
                    </Text>
                  </View>
                </View>
              </V2CardChromeSm>
            );
          };

          // Stack: render up to two background cards (next + after) plus
          // the active top card with PanResponder + transform.
          return (
            <>
              {HOOK_CARDS.slice(hookCardIndex + 1, hookCardIndex + 3).reverse().map((card, idx) => {
                const offset = HOOK_CARDS.slice(hookCardIndex + 1).indexOf(card) + 1;
                return (
                  <View
                    key={card.id}
                    style={[
                      s.hookGhostCard,
                      {
                        width: HOOK_CARD_WIDTH,
                        height: HOOK_CARD_HEIGHT,
                        position: 'absolute',
                        top: offset * 8,
                        opacity: 0.55 - offset * 0.18,
                        transform: [{ scale: 1 - offset * 0.04 }],
                      },
                    ]}
                  />
                );
              })}

              <Animated.View
                {...hookStackPanResponder.panHandlers}
                style={[
                  s.hookCardWrap,
                  {
                    width: HOOK_CARD_WIDTH,
                    height: HOOK_CARD_HEIGHT,
                    transform: [
                      { translateX: hookSwipeAnim.x },
                      { translateY: hookSwipeAnim.y },
                      {
                        rotate: hookSwipeAnim.x.interpolate({
                          inputRange: [-width, 0, width],
                          outputRange: ['-8deg', '0deg', '8deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {renderCardContent(HOOK_CARDS[hookCardIndex].kind)}
              </Animated.View>
            </>
          );
        })()}
      </View>

      {/* Hook CTA — matches HomeScreenV2's chipLarge "Go deeper" button. */}
      <HomeStyleCta text="Get Started  →" onPress={() => advance()} />
      <Text style={[s.hookDisclaimer, { color: colors.textSecondary }]}>
        2 minutes · free · no email
      </Text>
    </View>
  );

  // ── 2. MOTIVATION ────────────────────────────────
  // Time-aware framing: "tonight" feels intimate for Mia at 10:30pm,
  // but "today" reads naturally at 11am. One word swap gives us
  // personalization at the cost of one extra Date check.
  const renderMotivation = () => {
    const hour = new Date().getHours();
    const timeWord = (hour >= 17 || hour < 5) ? 'tonight' : 'today';
    return (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={s.phaseLabel}>ABOUT YOU</Text>
      <Text style={[s.h1, { color: colors.heading }]}>What brought you{'\n'}here {timeWord}?</Text>
      <Text style={[s.sub, { color: colors.textSecondary }]}>No wrong answers. Just honesty.</Text>
      <View style={s.optWrap}>
        <OptionCard text="I want to understand myself better" icon="🪞" selected={motivation === 'self'} onPress={() => selectAndAdvance(setMotivation, 'self')} colors={colors} />
        <OptionCard text="I'm going through something big" icon="🌊" selected={motivation === 'change'} onPress={() => selectAndAdvance(setMotivation, 'change')} colors={colors} />
        <OptionCard text="I need clarity on a relationship" icon="💫" selected={motivation === 'love'} onPress={() => selectAndAdvance(setMotivation, 'love')} colors={colors} />
        <OptionCard text="I'm curious — show me what you've got" icon="✨" selected={motivation === 'curious'} onPress={() => selectAndAdvance(setMotivation, 'curious')} colors={colors} />
      </View>
    </ScrollView>
    );
  };

  // ── 3. PAIN POINTS (MULTI-SELECT) ────────────────
  // Adam Lyttle's questionnaire pattern: multi-select gives more signal per
  // screen than two single-selects, and the picks feed the solution-bridge
  // screen at step 4. Continue stays disabled until ≥1 selected.
  const togglePain = (id) => {
    try { haptic.light(); } catch {}
    setPainPoints(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const renderPain = () => (
    <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingBottom: 28 }]} showsVerticalScrollIndicator={false}>
      <Text style={[s.phaseLabel, { marginBottom: 10 }]}>GOING DEEPER</Text>
      <Text style={[s.h1, { color: colors.heading, marginBottom: 10 }]}>What's hardest{'\n'}right now?</Text>
      <Text style={[s.sub, { color: colors.textSecondary, marginBottom: 18 }]}>Pick as many as fit. Honesty serves you here.</Text>
      <View style={[s.optWrapCompact, { gap: 10, marginBottom: 22 }]}>
        {PAIN_OPTIONS.map(opt => (
          <OptionCard
            key={opt.id}
            text={opt.label}
            icon={opt.icon}
            selected={painPoints.includes(opt.id)}
            onPress={() => togglePain(opt.id)}
            colors={colors}
            compact
          />
        ))}
      </View>
      <View style={{ alignItems: 'center' }}>
        <HomeStyleCta
          text="Continue  →"
          disabled={painPoints.length === 0}
          onPress={() => advance()}
        />
      </View>
    </ScrollView>
  );

  // ── 4. PERSONALIZED SOLUTION BRIDGE ──────────────
  // Mirrors back the user's selected pains alongside Celestia's specific
  // fix. Strongest commitment-consistency move in the questionnaire-skill
  // playbook — "you told us X, here's how we do Y."
  const renderSolutionBridge = () => {
    const selected = PAIN_OPTIONS.filter(o => painPoints.includes(o.id));
    return (
      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingBottom: 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={[s.phaseLabel, { marginBottom: 10 }]}>WE HEARD YOU</Text>
        <Text style={[s.h1, { color: colors.heading, marginBottom: 8 }]}>Here's what{'\n'}we'll do.</Text>
        <Text style={[s.sub, { color: colors.textSecondary, marginBottom: 14 }]}>
          Specific fixes from your real chart.
        </Text>

        <View style={s.bridgeListCompact}>
          {selected.map(opt => (
            <View key={opt.id} style={[s.bridgeRowCompact, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <View style={s.bridgePainRowCompact}>
                <Text style={s.bridgeXMarkCompact}>✗</Text>
                <Text style={[s.bridgePainTextCompact, { color: colors.textSecondary }]} numberOfLines={1}>{opt.label}</Text>
              </View>
              <View style={s.bridgeSolutionRowCompact}>
                <Text style={s.bridgeCheckMarkCompact}>✓</Text>
                <Text style={[s.bridgeSolutionTextCompact, { color: colors.heading }]} numberOfLines={2}>{opt.solution}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
        <View style={{ alignItems: 'center' }}>
          <HomeStyleCta text="Show Me My Chart  →" onPress={() => advance()} />
        </View>
      </ScrollView>
    );
  };

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
      <View style={{ alignItems: 'center' }}>
        <HomeStyleCta text="Continue  →" onPress={() => advance()} disabled={!firstName.trim() || !birthDate} />
      </View>
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
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <HomeStyleCta text="Continue  →" onPress={() => advance()} />
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

      {selectedCity && selectedCity.name !== 'Approximate' && (
        <View style={[s.selectedCityBadge, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={[s.selectedCityText, { color: colors.gold }]}>📍 {selectedCity.name.split(',').slice(0, 2).join(',')}</Text>
        </View>
      )}

      <View style={{ height: 24 }} />
      <View style={{ alignItems: 'center' }}>
        <HomeStyleCta
          text="Cast My Chart  →"
          onPress={() => advance()}
          disabled={!selectedCity || selectedCity.name === 'Approximate'}
        />
      </View>
      {/* Skip-with-fallback per design audit recommendation. Approximate
          location still produces a usable profile (precision is reduced) and
          keeps the flow non-extractive. */}
      <TouchableOpacity
        onPress={() => { setSelectedCity({ name: 'Approximate', lat: 0, lng: 0 }); setTimeout(() => advance(), 200); }}
        style={{ marginTop: 14, alignSelf: 'center', padding: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Skip city. Use approximate location.">
        <Text style={{ fontSize: 13, color: colors.textSecondary, textDecorationLine: 'underline' }}>
          Skip for now
        </Text>
      </TouchableOpacity>
      <View style={{ height: 16 }} />
    </ScrollView>
  );

  // ── 8. CALCULATING ───────────────────────────────
  // Stripped of the mystical orb + radial halo per design audit. Reads as
  // "calculating your data" — restrained Liquid Glass, not horoscope app.
  const calcPhases = ['Locating your planets...', 'Calculating house cusps...', 'Mapping natal aspects...', 'Reading your chart patterns...'];

  // Ring geometry: hairline gold circle, ~88pt diameter, drawn via
  // strokeDasharray + animated strokeDashoffset to sweep around 360°
  // as phases progress. Editorial — no orbs, no swirls.
  const RING_SIZE = 96;
  const RING_STROKE = 1.25;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const renderCalculating = () => (
    <View style={[s.calcScreen, { backgroundColor: '#FCF9F8' }]}>
      <View style={s.hookHairline} />

      <Animated.Text
        style={[
          s.calcTitle,
          {
            color: colors.heading,
            transform: [{
              scale: calcTitlePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }),
            }],
          },
        ]}>
        Casting your chart
      </Animated.Text>

      {/* Hairline progress ring — sweeps quarter per phase. Small dot
          at the leading edge marks the current sweep position. */}
      <View style={s.calcRingWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          {/* Background track — faint hairline */}
          <SvgCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="rgba(58,26,40,0.14)"
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {/* Animated sweep — gold hairline. Rotated -90° via group origin
              so the sweep starts at 12 o'clock. */}
          <AnimatedSvgCircle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={T.gold}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={calcRingSweep.interpolate({
              inputRange: [0, calcPhases.length],
              outputRange: [RING_CIRCUMFERENCE, 0],
            })}
            originX={RING_SIZE / 2}
            originY={RING_SIZE / 2}
            rotation={-90}
          />
        </Svg>
      </View>

      <Animated.Text
        style={[
          s.calcPhase,
          { color: colors.textSecondary, opacity: calcPhaseFade },
        ]}>
        {calcPhases[calcPhase] || calcPhases[0]}
      </Animated.Text>

      <View style={s.calcDots}>
        {calcPhases.map((_, i) => (
          <View key={i} style={[s.calcDot, { backgroundColor: colors.border }, i <= calcPhase && s.calcDotOn]} />
        ))}
      </View>
    </View>
  );

  // ── 9. ACTIVE REVEAL — TAP TO UNLOCK ─────────────
  // The questionnaire-skill says the user must DO something, not watch.
  // Three locked planet cards (Sun / Moon / Rising) — each tap reveals
  // the sign + tagline with haptic + spring animation. Once all three are
  // revealed, the finale (stats + personalized insight + CTA) springs in.
  // ── 9a. BIG 3 REVEAL — Stitch editorial style ──
  // Vertical stack with a thin connecting line. Locked card is just a
  // hairline outline + caps Playfair "REVEAL SUN" label and a small lock
  // glyph. Revealed card is a horizontal mini-row: hairline circle with
  // planet glyph, "MOON SIGN" kicker + Playfair sign, vertical hairline
  // divider, italic degree marker (e.g. "2° 14'"). Sharp corners,
  // hairlines only, no shadows or fills. Reads like a printed natal-chart
  // entry. CTA at the bottom is an outlined ceremonial button —
  // "READ SYNTHESIS" — disabled until all three are revealed.
  const renderBig3Reveal = () => {
    const allRevealed = revealedPlanets.length === 3;
    const planets = [
      { id: 'sun',    glyph: '☉', label: 'SUN',    data: sun,    anim: sunReveal },
      { id: 'moon',   glyph: '☽', label: 'MOON',   data: moon,   anim: moonReveal },
      { id: 'rising', glyph: '↑', label: 'RISING', data: rising, anim: risingReveal },
    ].filter(p => p.data || p.id === 'rising');

    const formatDegree = (deg) => {
      if (typeof deg !== 'number') return '';
      const d = Math.floor(deg);
      const m = Math.floor((deg - d) * 60);
      return `${d}° ${m}'`;
    };

    // One-button flow: tap once → all 3 reveal in staggered sequence.
    // Each call to revealPlanet fires its own haptic + spring animation,
    // so the cascade still feels alive and discrete.
    const revealAllBig3 = () => {
      planets.forEach((p, i) => {
        setTimeout(() => revealPlanet(p.id, p.anim), i * 220);
      });
    };

    return (
      <View style={[s.editorialScreen, { backgroundColor: '#FCF9F8' }]}>

        {/* Kicker block — caps Inter + tiny hairline rule */}
        <View style={s.editorialKickerWrap}>
          <Text style={[s.editorialKicker, { color: colors.textSecondary }]}>YOUR CORE</Text>
          <View style={[s.editorialKickerRule, { borderBottomColor: T.navy }]} />
        </View>

        {/* Reveal cluster with thin connecting line behind the cards */}
        <View style={s.revealCluster}>
          <View style={[s.revealConnector, { backgroundColor: T.navy }]} />

          {planets.map(p => {
            const revealed = revealedPlanets.includes(p.id);
            const sign = p.data?.sign;
            const deg = formatDegree(p.data?.degree);

            if (!revealed) {
              // Static locked card — no longer individually tappable.
              // Single button below reveals all three in sequence.
              return (
                <View
                  key={p.id}
                  style={[s.editorialLocked, { backgroundColor: colors.card, borderColor: T.navy }]}
                  accessible
                  accessibilityLabel={`${p.label} — locked, will reveal on tap below`}
                >
                  <LockGlyph color={T.brass} />
                  <Text style={[s.editorialLockLabel, { color: T.navy }]}>
                    {p.label}
                  </Text>
                </View>
              );
            }

            return (
              <Animated.View
                key={p.id}
                style={[
                  s.editorialRevealed,
                  {
                    backgroundColor: colors.card,
                    borderColor: T.navy,
                    opacity: p.anim,
                    transform: [{ translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
                  },
                ]}
                accessible
                accessibilityLabel={`${p.label} sign: ${sign || ''} ${deg}`}
              >
                <View style={s.editorialRevealedLeft}>
                  <View style={[s.editorialPlanetCircle, { borderColor: T.navy, backgroundColor: '#FCF9F8' }]}>
                    <Text style={[s.editorialPlanetGlyph, { color: T.navy }]}>{p.glyph}</Text>
                  </View>
                  <View>
                    <Text style={[s.editorialRevealedKicker, { color: colors.textSecondary }]}>
                      {p.label} SIGN
                    </Text>
                    <Text style={[s.editorialRevealedSign, { color: T.navy }]}>{sign || '—'}</Text>
                  </View>
                </View>
                {deg ? (
                  <View style={[s.editorialDegreeWrap, { borderLeftColor: T.navy }]}>
                    <Text style={[s.editorialDegree, { color: colors.textSecondary }]}>{deg}</Text>
                  </View>
                ) : null}
              </Animated.View>
            );
          })}
        </View>

        {/* One button — morphs label based on reveal state.
            "Reveal My Big 3" → reveals all → button becomes "Read Synthesis" */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => allRevealed ? advance() : revealAllBig3()}
          accessibilityRole="button"
          accessibilityLabel={allRevealed ? 'Read synthesis' : 'Reveal my Big 3'}
          style={[s.editorialCta, { borderColor: T.navy }]}
        >
          <Text style={[s.editorialCtaLabel, { color: T.navy }]}>
            {allRevealed ? 'READ SYNTHESIS' : 'REVEAL MY BIG 3'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ── 9b. BLUEPRINT SYNTHESIS — meaning of the big 3 ──
  // "Mia's trading card" — designed to be screenshot-worthy. Six elements:
  // small sigil + Playfair headline (3-beat sign rhythm) + V2-chrome
  // synthesis card with 3-attribute portrait + 3 trait chips (Sun/Moon/
  // Rising taglines) + V2-chrome core question card + HomeStyleCta. Per
  // persona, Mia's hooked behavior is "I screenshot my chart reading and
  // sent it to everyone" — this screen is the screenshot.
  const renderBlueprintSynthesis = () => {
    const sunSign = sun?.sign;
    const moonSign = moon?.sign;
    const risingSign = rising?.sign;

    const headline = sunSign && moonSign && risingSign
      ? `${sunSign} steers.\n${moonSign} feels.\n${risingSign} shows.`
      : 'Three forces.\nOne chart.\nYou.';

    const synthesisLine = sunSign && moonSign && risingSign
      ? `${sunSign}'s ${SUN_QUALITY[sunSign] || 'core'}, ${moonSign}'s ${MOON_QUALITY[moonSign] || 'depth'}, ${risingSign}'s ${RISING_QUALITY[risingSign] || 'face'}.`
      : 'A combination most charts don\'t share.';

    return (
      <View style={[s.scroll, { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 }]}>
        <Text style={s.synthKicker}>YOUR BLUEPRINT</Text>

        <Text style={[s.synthHeadline, { color: T.navy }]}>{headline}</Text>

        {/* Synthesis card — peach V2 chrome */}
        <View style={s.synthCardWrap}>
          <V2CardChromeSm slot="anchor">
            <View style={s.synthCardInner}>
              <Text style={s.synthCardKicker}>THE SYNTHESIS</Text>
              <Text style={s.synthCardLine}>{synthesisLine}</Text>
            </View>
          </V2CardChromeSm>
        </View>

        {/* Three trait chips — Sun, Moon, Rising taglines */}
        {sunSign && moonSign && (
          <View style={s.synthTraitsRow}>
            <View style={[s.synthTraitChip, { backgroundColor: '#FFFFFF', borderColor: 'rgba(135,114,112,0.10)' }]}>
              <Text style={[s.synthTraitGlyph, { color: T.brass }]}>☉</Text>
              <Text style={[s.synthTraitText, { color: T.navy }]} numberOfLines={2}>
                {SUN_TAGLINES[sunSign] || 'Your sun'}
              </Text>
            </View>
            <View style={[s.synthTraitChip, { backgroundColor: '#FFFFFF', borderColor: 'rgba(135,114,112,0.10)' }]}>
              <Text style={[s.synthTraitGlyph, { color: T.brass }]}>☽</Text>
              <Text style={[s.synthTraitText, { color: T.navy }]} numberOfLines={2}>
                {MOON_TAGLINES[moonSign] || 'Your moon'}
              </Text>
            </View>
            {risingSign && (
              <View style={[s.synthTraitChip, { backgroundColor: '#FFFFFF', borderColor: 'rgba(135,114,112,0.10)' }]}>
                <Text style={[s.synthTraitGlyph, { color: T.brass }]}>↑</Text>
                <Text style={[s.synthTraitText, { color: T.navy }]} numberOfLines={2}>
                  {RISING_TAGLINES[risingSign] || 'Your rising'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Core question card — love V2 chrome */}
        {sunSign && SUN_CORE_QUESTIONS[sunSign] && (
          <View style={s.synthCoreQWrap}>
            <V2CardChromeSm slot="love">
              <View style={s.synthCardInner}>
                <Text style={s.synthCoreQKicker}>YOUR CORE QUESTION</Text>
                <Text style={s.synthCoreQText}>
                  "{SUN_CORE_QUESTIONS[sunSign]}"
                </Text>
                <Text style={s.synthCoreQFooter}>
                  Most {sunSign}s spend years on this one.
                </Text>
              </View>
            </V2CardChromeSm>
          </View>
        )}

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <HomeStyleCta text="This Is Just The Beginning  →" onPress={() => advance()} />
        </View>
      </View>
    );
  };

  // ── 10. PREVIEW — TINDER SWIPE STACK ─────────────
  // Three mock cards stacked Tinder-style. Each card is a faithful mock
  // of a real HomeScreenV2 card (anchor / life-area spotlight / sky),
  // populated with the user's sun, moon, rising, and painPoints. The user
  // physically *handles* what they're about to commit to.
  // Geometry matches V2: 90% width × 4/5 aspect.
  const STACK_CARD_WIDTH = width * 0.88;
  // Shrink card height — was ~442 on 16 Pro (4:5 of 90% width) which
  // pushed the stats strip + CTA off-screen. Now caps at 42% of viewport
  // height, which scales gracefully from SE (667) to Pro Max (932).
  const STACK_CARD_HEIGHT = Math.min(STACK_CARD_WIDTH / 1.0, height * 0.42);
  const SWIPE_THRESHOLD = width * 0.22;
  const swipeAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Auto-swipe demo state — teaches the gesture by showing the user what
  // a swipe looks like. Once the user touches the stack themselves, we
  // permanently switch to manual mode (their hands now know the move).
  const userInteractedRef = useRef(false);
  const autoSwipeTimerRef = useRef(null);
  const teaseTimerRef = useRef(null);

  const clearAutoTimers = () => {
    if (autoSwipeTimerRef.current) { clearTimeout(autoSwipeTimerRef.current); autoSwipeTimerRef.current = null; }
    if (teaseTimerRef.current) { clearTimeout(teaseTimerRef.current); teaseTimerRef.current = null; }
  };

  const stackPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // First touch on the stack — switch to manual mode. Stops any
        // pending auto-swipe / tease so the user's gesture takes over.
        userInteractedRef.current = true;
        clearAutoTimers();
        // Snap to current value to halt any in-flight tease animation
        swipeAnim.stopAnimation();
        return true;
      },
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => swipeAnim.setValue({ x: g.dx, y: g.dy * 0.4 }),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > SWIPE_THRESHOLD) {
          const direction = g.dx > 0 ? 1 : -1;
          Animated.timing(swipeAnim, {
            toValue: { x: direction * width * 1.4, y: g.dy },
            duration: 240,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return;
            try { haptic.light(); } catch {}
            setPreviewIndex(prev => prev + 1);
            swipeAnim.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(swipeAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Auto-fly the current top card off-screen left. Same animation a
  // manual swipe produces, so the user learns by watching.
  const autoFlyCurrentCard = () => {
    if (userInteractedRef.current) return;
    Animated.timing(swipeAnim, {
      toValue: { x: -width * 1.4, y: 0 },
      duration: 320,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return; // user interrupted — let manual gesture take over
      try { haptic.light(); } catch {}
      setPreviewIndex(prev => prev + 1);
      swipeAnim.setValue({ x: 0, y: 0 });
    });
  };

  // Mount-time tease for the first card only — small wobble at ~0.8s
  // that telegraphs "this is swipeable" before the auto-cycle kicks in.
  const runFirstCardTease = () => {
    if (userInteractedRef.current) return;
    Animated.sequence([
      Animated.timing(swipeAnim, { toValue: { x: 32, y: 0 }, duration: 350, useNativeDriver: true }),
      Animated.timing(swipeAnim, { toValue: { x: -22, y: 0 }, duration: 350, useNativeDriver: true }),
      Animated.timing(swipeAnim, { toValue: { x: 0, y: 0 }, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  // Schedule auto-swipe + tease whenever step 10 is active and there's
  // still a card on top. Cleans up on step change / unmount / interaction.
  useEffect(() => {
    clearAutoTimers();
    if (step !== 11) return;
    if (userInteractedRef.current) return;
    if (previewIndex >= 3) return; // all swiped — CTA shown

    // Tease only on the very first card. Subsequent cards just auto-cycle.
    if (previewIndex === 0) {
      teaseTimerRef.current = setTimeout(runFirstCardTease, 800);
    }
    // Auto-fly after a beat — long enough for the user to read, short
    // enough that the cycle keeps moving. First card waits longer
    // because the tease is animating.
    const flyDelay = previewIndex === 0 ? 3200 : 2400;
    autoSwipeTimerRef.current = setTimeout(autoFlyCurrentCard, flyDelay);

    return clearAutoTimers;
  }, [step, previewIndex]);

  // ── Hook screen swipe-stack mechanics ────────────
  // Mirror of the screen-11 stack with smaller dimensions, generic
  // hardcoded cards (no personalized chart data yet on screen 1), and
  // a soft "stop after last card" behavior — the user can keep tapping
  // the CTA whenever they want.
  const HOOK_CARD_WIDTH = Math.min(width - 48, 360);
  // Responsive card height — grows on Pro/Pro Max to fill viewport
  // (matches home tab's ~4:5 card aspect), holds at 280 on smaller
  // phones (SE) so total content stays within viewport. Sweet spot at
  // 45% of viewport height.
  const HOOK_CARD_HEIGHT = Math.max(280, Math.min(400, height * 0.45));
  const HOOK_SWIPE_THRESHOLD = width * 0.18;

  const clearHookAutoTimers = () => {
    if (hookAutoTimerRef.current) { clearTimeout(hookAutoTimerRef.current); hookAutoTimerRef.current = null; }
    if (hookTeaseTimerRef.current) { clearTimeout(hookTeaseTimerRef.current); hookTeaseTimerRef.current = null; }
  };

  const hookStackPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        hookUserInteractedRef.current = true;
        clearHookAutoTimers();
        hookSwipeAnim.stopAnimation();
        return true;
      },
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => hookSwipeAnim.setValue({ x: g.dx, y: g.dy * 0.4 }),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > HOOK_SWIPE_THRESHOLD) {
          const direction = g.dx > 0 ? 1 : -1;
          Animated.timing(hookSwipeAnim, {
            toValue: { x: direction * width * 1.4, y: g.dy },
            duration: 220,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished) return;
            try { haptic.light(); } catch {}
            setHookCardIndex(prev => prev + 1);
            hookSwipeAnim.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(hookSwipeAnim, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 80,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const autoFlyHookCard = () => {
    if (hookUserInteractedRef.current) return;
    Animated.timing(hookSwipeAnim, {
      toValue: { x: -width * 1.4, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      try { haptic.light(); } catch {}
      setHookCardIndex(prev => prev + 1);
      hookSwipeAnim.setValue({ x: 0, y: 0 });
    });
  };

  const runHookFirstCardTease = () => {
    if (hookUserInteractedRef.current) return;
    Animated.sequence([
      Animated.timing(hookSwipeAnim, { toValue: { x: 28, y: 0 }, duration: 320, useNativeDriver: true }),
      Animated.timing(hookSwipeAnim, { toValue: { x: -18, y: 0 }, duration: 320, useNativeDriver: true }),
      Animated.timing(hookSwipeAnim, { toValue: { x: 0, y: 0 }, duration: 260, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    clearHookAutoTimers();
    if (step !== 1) return;
    if (hookUserInteractedRef.current) return;
    if (hookCardIndex >= 4) return;

    if (hookCardIndex === 0) {
      hookTeaseTimerRef.current = setTimeout(runHookFirstCardTease, 700);
    }
    const flyDelay = hookCardIndex === 0 ? 3000 : 2400;
    hookAutoTimerRef.current = setTimeout(autoFlyHookCard, flyDelay);

    return clearHookAutoTimers;
  }, [step, hookCardIndex]);

  // Paywall CTA breathing pulse — runs the whole time step 14 is up
  useEffect(() => {
    if (step !== 14) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(paywallCtaPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(paywallCtaPulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [step]);

  const renderPreview = () => {
    const sunSign = sun?.sign;
    const moonSign = moon?.sign;
    // Best-effort moon phase + glyph using moonData if available
    const moonPhase = moonData?.phaseName || 'Waxing Gibbous';
    const moonIcon = moonData?.phaseIcon || '🌖';

    const mockCtx = { firstName, sunSign, moonSign, moonIcon, moonPhase, painPoints };

    const cards = [
      { type: 'anchor',    render: renderHomeAnchorMockV2 },
      { type: 'spotlight', render: renderHomeSpotlightMockV2 },
      { type: 'sky',       render: renderHomeSkyMockV2 },
    ];

    const allSwiped = previewIndex >= cards.length;
    const stackVisible = cards.slice(previewIndex, previewIndex + 3);

    // Top-card animated transforms — translate + rotation tied to gesture x.
    const rotate = swipeAnim.x.interpolate({
      inputRange: [-width, 0, width],
      outputRange: ['-12deg', '0deg', '12deg'],
    });
    const topCardOpacity = swipeAnim.x.interpolate({
      inputRange: [-width, 0, width],
      outputRange: [0.6, 1, 0.6],
    });

    return (
      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingHorizontal: 0, paddingTop: 16, paddingBottom: 16 }]} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 26 }}>
          <Text style={[s.phaseLabel, { marginBottom: 8 }]}>YOUR WEEK</Text>
          <Text style={[s.h1, { color: colors.heading, marginBottom: 6, fontSize: 28, lineHeight: 34 }]}>This is what you'll{'\n'}see, {firstName || 'you'}.</Text>
          <Text style={[s.sub, { color: colors.textSecondary, marginBottom: 12 }]}>
            {allSwiped ? 'You\'ve seen it. Ready to set it up?' : 'Swipe through to peek at your week.'}
          </Text>
        </View>

        {/* Stack area — matches HomeScreenV2's deckArea */}
        <View style={[s.stackArea, { height: STACK_CARD_HEIGHT + 8, width: '100%', marginTop: 0, marginBottom: 0 }]}>
          <View style={{ width: STACK_CARD_WIDTH, height: STACK_CARD_HEIGHT, alignSelf: 'center' }}>
          {stackVisible.length === 0 ? (
            // After all swiped — empty state with reassurance
            <View style={s.stackEmpty}>
              <Text style={[s.stackEmptyGlyph, { color: T.gold }]}>✦</Text>
              <Text style={[s.stackEmptyText, { color: colors.textSecondary }]}>
                Every morning, three cards like these.{'\n'}From your real chart. Not generic.
              </Text>
            </View>
          ) : (
            // Render in reverse so the topmost card is rendered last (on top)
            stackVisible.slice().reverse().map((card, reverseI) => {
              const positionInStack = stackVisible.length - 1 - reverseI; // 0 = top
              const isTop = positionInStack === 0;
              const Mock = card.render;

              const baseStyle = [
                s.stackCard,
                {
                  zIndex: 100 - positionInStack,
                },
              ];

              if (isTop) {
                return (
                  <Animated.View
                    key={`top-${previewIndex}`}
                    {...stackPanResponder.panHandlers}
                    style={[
                      baseStyle,
                      {
                        transform: [
                          { translateX: swipeAnim.x },
                          { translateY: swipeAnim.y },
                          { rotate },
                        ],
                        opacity: topCardOpacity,
                      },
                    ]}
                  >
                    {Mock(mockCtx, colors)}
                  </Animated.View>
                );
              }

              // Background ghosts — scaled + offset down + dimmed
              return (
                <View
                  key={`ghost-${previewIndex + positionInStack}`}
                  pointerEvents="none"
                  style={[
                    baseStyle,
                    {
                      transform: [
                        { scale: 1 - positionInStack * 0.04 },
                        { translateY: positionInStack * 10 },
                      ],
                      opacity: 1 - positionInStack * 0.18,
                    },
                  ]}>
                  {Mock(mockCtx, colors)}
                </View>
              );
            })
          )}
          </View>
        </View>

        {/* Stack progress dots */}
        <View style={s.previewDots}>
          {cards.map((_, i) => (
            <View
              key={i}
              style={[
                s.previewDot,
                { backgroundColor: i < previewIndex ? T.gold : (i === previewIndex && !allSwiped ? T.gold : colors.border) },
                i < previewIndex && { opacity: 0.5 },
              ]}
            />
          ))}
        </View>

        <View style={{ paddingHorizontal: 26, marginTop: 14, alignItems: 'center' }}>
          <HomeStyleCta
            text="Set My Morning  →"
            onPress={() => advance()}
          />
        </View>
      </ScrollView>
    );
  };

  // ── 12. WAKE-TIME ANCHOR ─────────────────────────
  // Highest-ROI question we ask: when does the morning push fire? Framed
  // not as a setting ("pick a time") but as a daily ritual the user
  // commits to ("when should tomorrow find you?"). Per Fogg, anchoring to
  // an existing morning moment (coffee, bus, in bed) is the most reliable
  // B=MAP prompt strategy. Inline native time picker — same chrome as
  // birth-time on screen 6 — defaults to 7:00 AM.
  const renderWakeAnchor = () => (
    <ScrollView
      style={[s.scroll, { backgroundColor: '#FCF9F8' }]}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      // Android — required so the inner TimeWheel ScrollViews can take
      // over the gesture instead of the outer scroll capturing it.
      nestedScrollEnabled
    >
      <Text style={s.phaseLabel}>YOUR MORNING</Text>
      <Text style={[s.h1, { color: T.navy }]}>When's your{'\n'}morning moment?</Text>
      <Text style={[s.sub, { color: 'rgba(58,26,40,0.65)' }]}>
        Your reading will be{'\n'}waiting there.
      </Text>

      {/* Editorial time card — one-way open. Once tapped, picker stays
          visible. Tapping the card after that does nothing (no toggle to
          close), so users can't mistake the card for the confirm action.
          Only the "Set My Morning" button below confirms and advances. */}
      <TouchableOpacity
        activeOpacity={showWakePicker ? 1 : 0.75}
        disabled={showWakePicker}
        onPress={() => {
          if (showWakePicker) return;
          try { haptic.light(); } catch {}
          setShowWakePicker(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Wake time ${wakeTime.getHours()}:${String(wakeTime.getMinutes()).padStart(2, '0')}. ${showWakePicker ? 'Scroll the picker below to adjust.' : 'Tap to adjust.'}`}
        accessibilityState={{ expanded: showWakePicker }}
        style={[s.wakeTimeCard, { borderColor: showWakePicker ? T.navy : 'rgba(58,26,40,0.16)', backgroundColor: '#FFFFFF' }]}
      >
        <Text style={[s.wakeTimeDisplay, { color: T.navy }]}>
          {(() => {
            const h = wakeTime.getHours();
            const m = wakeTime.getMinutes();
            const ampm = h < 12 ? 'AM' : 'PM';
            const h12 = h % 12 === 0 ? 12 : h % 12;
            return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
          })()}
        </Text>
        <Text style={[s.wakeTimeChangeHint, { color: showWakePicker ? T.brass : 'rgba(58,26,40,0.55)' }]}>
          {showWakePicker ? '↓  SCROLL TO ADJUST' : 'TAP TO ADJUST'}
        </Text>
      </TouchableOpacity>

      {showWakePicker && (() => {
        // Custom RN time wheel — three columns, theme-locked to light
        // regardless of system preference. Bypasses native picker theming
        // bugs entirely.
        const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
        const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
        const AMPM = ['AM', 'PM'];
        const h24 = wakeTime.getHours();
        const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
        const minute = wakeTime.getMinutes();
        const ampm = h24 >= 12 ? 'PM' : 'AM';

        const updateTime = (h12, mins, ap) => {
          const newH24 = ap === 'PM'
            ? (h12 === 12 ? 12 : h12 + 12)
            : (h12 === 12 ? 0 : h12);
          const next = new Date(wakeTime);
          next.setHours(newH24, mins, 0, 0);
          setWakeTime(next);
        };

        return (
          <View style={[s.wakePickerWrap, { backgroundColor: '#FFFFFF', borderColor: 'rgba(58,26,40,0.12)' }]}>
            {/* Center selection band — hairline gold marks the locked row */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: '50%',
                left: 14,
                right: 14,
                height: WHEEL_ROW_HEIGHT,
                marginTop: -WHEEL_ROW_HEIGHT / 2,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderColor: 'rgba(184,153,104,0.45)',
              }}
            />
            <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
              <TimeWheel
                values={HOURS}
                selectedValue={hour12}
                onValueChange={(h) => updateTime(h, minute, ampm)}
              />
              {/* Colon separator — fixed column, not absolute-positioned.
                  paddingTop pushes the colon to align with the selection
                  band (2 rows above + half-row inside). */}
              <View pointerEvents="none" style={{ width: 12, height: WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS, alignItems: 'center', paddingTop: WHEEL_ROW_HEIGHT * 2 }}>
                <Text style={{
                  fontFamily: FONTS.serif,
                  fontSize: 26,
                  color: '#3A1A28',
                  lineHeight: WHEEL_ROW_HEIGHT,
                  height: WHEEL_ROW_HEIGHT,
                  textAlign: 'center',
                }}>:</Text>
              </View>
              <TimeWheel
                values={MINUTES}
                selectedValue={minute}
                onValueChange={(m) => updateTime(hour12, m, ampm)}
                formatter={(m) => String(m).padStart(2, '0')}
              />
              <TimeWheel
                values={AMPM}
                selectedValue={ampm}
                onValueChange={(a) => updateTime(hour12, minute, a)}
              />
            </View>
          </View>
        );
      })()}

      <Text style={[s.wakePromise, { color: 'rgba(58,26,40,0.55)' }]}>
        We'll never wake you up. Promise.
      </Text>

      <View style={{ height: 20 }} />
      <View style={{ alignItems: 'center' }}>
      <HomeStyleCta
        text="Set My Morning  →"
        onPress={async () => {
          const hour = wakeTime.getHours();
          const minute = wakeTime.getMinutes();
          try {
            const settings = await getNotificationSettings();
            await saveNotificationSettings({ ...settings, morningTime: hour, morningMinute: minute });
          } catch (err) {
            // Don't swallow silently — log so we can see in dev/prod telemetry
            // if saves are failing. The advance() still fires so the user
            // isn't stuck, but we surface the failure.
            console.error('[wake-time] failed to save morningTime', err);
          }
          capture(EVENTS.ONBOARDING_WAKE_TIME_SET, {
            wake_hour: hour,
            wake_minute: minute,
            is_default: hour === 7 && minute === 0,
          });
          advance();
        }}
      />
      </View>
      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ── 13. NOTIFICATION CHANNELS ─────────────────────
  // Per-channel toggles in one flat card. 3 ON by default (daily
  // essentials + transit alerts); user opts into the rest. The Morning
  // briefing desc reflects the actual wake time picked on screen 12 —
  // not a hardcoded 7:30 AM — so the user sees their own ritual.
  const formatWakeShort = (date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const toggleChannel = (key) => {
    try { haptic.light(); } catch {}
    setNotifChannels(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNotifBundle = () => {
    const wakeLabel = formatWakeShort(wakeTime);
    const NOTIF_CHANNELS = [
      { key: 'cosmic_morning',     icon: '☉', label: 'Morning briefing',  desc: `Your reading at ${wakeLabel}` },
      { key: 'evening_reflection', icon: '☽', label: 'Evening reflection', desc: 'A close-of-day prompt at 8:30 PM' },
      { key: 'transit_alerts',     icon: '⚡', label: 'Transit alerts',    desc: 'When planets hit your chart' },
      { key: 'weekly_digest',      icon: '◔', label: 'Weekly digest',     desc: 'A Sunday recap of the week ahead' },
      { key: 'streak_guardian',    icon: '◌', label: 'Streak guardian',   desc: "When your streak is about to break" },
      { key: 'cosmic_milestones',  icon: '✦', label: 'Milestones',        desc: 'When you earn a cosmic badge' },
    ];

    return (
      <View style={[s.scroll, { backgroundColor: '#FCF9F8', paddingHorizontal: 26, paddingTop: 20, paddingBottom: 20 }]}>
        <Text style={[s.phaseLabel, { marginBottom: 8 }]}>YOUR NOTIFICATIONS</Text>
        <Text style={[s.h1, { color: T.navy, marginBottom: 6, fontSize: 28, lineHeight: 34 }]}>
          What would you{'\n'}like to hear?
        </Text>
        <Text style={[s.sub, { color: 'rgba(58,26,40,0.65)', marginBottom: 14 }]}>
          A few essentials are on. Pick more if you'd like.
        </Text>

        <View style={[s.notifSectionList, { borderColor: 'rgba(58,26,40,0.10)' }]}>
          {NOTIF_CHANNELS.map((item, idx) => {
            const isOn = !!notifChannels[item.key];
            const isLast = idx === NOTIF_CHANNELS.length - 1;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                onPress={() => toggleChannel(item.key)}
                accessibilityRole="switch"
                accessibilityLabel={`${item.label}. ${item.desc}`}
                accessibilityState={{ checked: isOn }}
                style={[
                  s.notifChannelRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(58,26,40,0.08)' },
                ]}
              >
                <Text style={[s.notifChannelIcon, { color: isOn ? T.brass : 'rgba(58,26,40,0.35)' }]}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.notifChannelLabel, { color: T.navy }]}>{item.label}</Text>
                  <Text style={[s.notifChannelDesc, { color: 'rgba(58,26,40,0.55)' }]} numberOfLines={1}>{item.desc}</Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => toggleChannel(item.key)}
                  trackColor={{ false: '#E0D8CC', true: 'rgba(200,168,75,0.45)' }}
                  thumbColor={isOn ? T.gold : '#F0ECE4'}
                  ios_backgroundColor="#E0D8CC"
                  accessibilityRole="switch"
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center' }}>
        <HomeStyleCta
          text="Continue  →"
          onPress={async () => {
            try {
              const settings = await getNotificationSettings();
              await saveNotificationSettings({
                ...settings,
                ...notifChannels,
                notificationBundle: 'custom',
              });
            } catch (err) {
              console.error('[notif-channels] failed to save', err);
            }
            const enabledCount = Object.values(notifChannels).filter(Boolean).length;
            capture(EVENTS.ONBOARDING_NOTIF_BUNDLE_PICKED, {
              bundle: 'custom',
              channels_enabled_count: enabledCount,
              ...notifChannels,
            });
            advance();
          }}
        />
        </View>
      </View>
    );
  };

  // ── 13. PAYWALL (CONSOLIDATED) ───────────────────
  // Replaces the previous 3-screen stack (soft / reassurance / hard close)
  // with one focused screen: header → goal-back → personalized benefits
  // (referencing the user's actual Sun & Moon by name) → one testimonial
  // inline → plan select → CTA.
  // ── 14. PAYWALL — Stitch "Liquid Glass" editorial layout ──
  // Pixel-accurate to plan/design/stitch_celestia_onboarding_design_brief (1).
  // Uses Stitch's exact colors: primary #2a0002 (deep burgundy), secondary
  // #775a19 (dark amber, BEST VALUE tag), surface #fbf9f8 (page bg),
  // surface-container-high #eae8e7 (sparkle circle), card bg #F5F2EE,
  // outline #877270 at /10 and /20 opacity for hairlines, on-surface
  // #1b1c1c (benefit text), on-surface-variant #544341 (muted body).
  const renderPaywall = () => {
    const isAnnual = selectedPlan === 'annual';
    const sunName = sun?.sign;
    const moonName = moon?.sign;

    // Three benefits, each echoing a specific moment Mia just lived
    // through during onboarding (commitment-consistency primer):
    //   #1 Daily — echoes the Big 3 reveal (step 9) + Today card preview (step 11)
    //   #2 Chat  — echoes the Hook (step 1) + Chat preview (step 11)
    //   #3 Synastry — echoes the Match preview (step 11) + relationship pains (step 3)
    // Personalization on #1 (Sun + Moon glyphs) drives 1.5–2× conversion
    // lift per the questionnaire skill.
    const benefits = [
      {
        icon: '✨',
        text: sunName && moonName
          ? `Daily readings for your ${sunName} ☉ ${moonName} ☽`
          : 'Daily readings from your real chart',
      },
      { icon: '💬', text: 'Ask your chart anything, anytime' },
      { icon: '♡', text: 'See why some people fit' },
    ];

    return (
      <View style={[s.paywallContainer, { backgroundColor: '#FBF9F8' }]}>
        {/* Liquid Glass background orbs */}
        <LinearGradient
          colors={['rgba(255,222,165,0.30)', 'rgba(255,222,165,0)']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.4, y: 0.5 }}
          style={s.paywallOrbTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(149,71,66,0.10)', 'rgba(149,71,66,0)']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0.6, y: 0.5 }}
          style={s.paywallOrbBottom}
          pointerEvents="none"
        />

        {/* Header — animated brand sigil (rotating + pulsing) replaces
            the static sparkle emoji. Self-contained SVG, brass color,
            scaled to fit the header slot. */}
        <View style={s.paywallHeaderStitch}>
          <View style={s.paywallSigilWrap}>
            <CelestialSigil size={72} color="#D4A853" />
          </View>
          <Text style={s.paywallH1Stitch}>
            Everything in your chart,{'\n'}unlocked.
          </Text>
        </View>

        {/* Benefits */}
        <View style={s.paywallBenefitsStitch}>
          {benefits.map((b, i) => (
            <View key={i} style={s.paywallBenefitChip}>
              <Text style={s.paywallBenefitIcon}>{b.icon}</Text>
              <Text style={s.paywallBenefitTextStitch} numberOfLines={2}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan cards */}
        <View style={s.paywallPlansStitch}>
          {/* Annual Pro */}
          <View style={{ position: 'relative' }}>
            {isAnnual && (
              <View style={s.paywallBestFloatTag}>
                <Text style={s.paywallBestFloatText}>BEST VALUE</Text>
              </View>
            )}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setSelectedPlan('annual')}
              style={[
                s.paywallPlanCardStitch,
                {
                  borderColor: isAnnual ? '#D4A853' : 'rgba(135,114,112,0.10)',
                  borderWidth: isAnnual ? 2 : 1,
                  shadowOpacity: isAnnual ? 0.05 : 0.02,
                  shadowRadius: isAnnual ? 12 : 4,
                  shadowOffset: { width: 0, height: isAnnual ? 4 : 2 },
                },
              ]}
            >
              {/* Glass gleam overlay — top-left to transparent */}
              <LinearGradient
                colors={['rgba(255,255,255,0.40)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.paywallGlassGleam}
                pointerEvents="none"
              />
              <View style={s.paywallPlanCardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.paywallPlanCardTitle}>Annual Pro</Text>
                  <Text style={s.paywallPlanCardSub}>$49.99 billed yearly</Text>
                  {isAnnual && (
                    <Text style={[s.paywallPlanTrialNote, { color: '#775a19' }]}>✦ 7 days free</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.paywallPlanCardPrice}>$4.17</Text>
                  <Text style={s.paywallPlanCardPer}>/ mo</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Monthly Pro */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setSelectedPlan('monthly')}
            style={[
              s.paywallPlanCardStitch,
              {
                borderColor: !isAnnual ? '#D4A853' : 'rgba(135,114,112,0.10)',
                borderWidth: !isAnnual ? 2 : 1,
                opacity: !isAnnual ? 1 : 0.8,
                shadowOpacity: !isAnnual ? 0.05 : 0.02,
                shadowRadius: !isAnnual ? 12 : 4,
                shadowOffset: { width: 0, height: !isAnnual ? 4 : 2 },
              },
            ]}
          >
            <View style={[s.paywallPlanCardRow, { alignItems: 'center' }]}>
              <Text style={[s.paywallPlanCardTitle, { color: '#1b1c1c', marginBottom: 0 }]}>Monthly Pro</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={[s.paywallPlanCardTitle, { color: '#1b1c1c', marginBottom: 0 }]}>$6.99</Text>
                <Text style={s.paywallPlanCardPer}>/ mo</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer — CTA first (action-led), then trial timeline as
            "what happens after you tap" supporting evidence. Sits
            directly under the plans without a flex spacer so the
            CTA stays visually adjacent to the plan select. */}
        <View style={[s.paywallFooterStitch, { marginTop: 18 }]}>
          {/* Pulsing gold gradient CTA — bright polished-gold cascade.
              Dark text on light gold is the premium-luxury contrast
              pattern (Rolex/Cartier). Pulse animation drives 12-18%
              conversion lift per RevenueCat. */}
          <Animated.View style={{
            transform: [{
              scale: paywallCtaPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }),
            }],
          }}>
            <TouchableOpacity activeOpacity={0.85} onPress={finishOnboarding} style={s.paywallCtaPillWrap}>
              <LinearGradient
                colors={['#D4A853', '#E9C176', '#FFD89C']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={s.paywallCtaPill}
              >
                <Text style={s.paywallCtaPillText}>START MY FREE TRIAL</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Trust line — removes the biggest objection ("when am I charged?") */}
          <Text style={s.paywallTrustLine}>NO PAYMENT NOW · CANCEL ANY TIME</Text>

          {/* Soft skip — explicit option to continue with the free tier.
              The app already gates premium features behind isPro checks,
              so users can genuinely keep using a limited version. */}
          <TouchableOpacity onPress={finishOnboarding} style={{ alignSelf: 'center' }}>
            <Text style={s.paywallLimitedLink}>Continue with limited access</Text>
          </TouchableOpacity>

          {/* Legal footer — App Store requires Restore Purchases + Terms + Privacy. */}
          <View style={s.paywallLegalRow}>
            <TouchableOpacity onPress={finishOnboarding}>
              <Text style={s.paywallLegalLink}>Restore</Text>
            </TouchableOpacity>
            <Text style={s.paywallLegalDot}>·</Text>
            <TouchableOpacity onPress={finishOnboarding}>
              <Text style={s.paywallLegalLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={s.paywallLegalDot}>·</Text>
            <TouchableOpacity onPress={finishOnboarding}>
              <Text style={s.paywallLegalLink}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ── STEP ROUTER ──────────────────────────────────
  // 13-screen flow per plan/onboarding_new (questionnaire-skill pass + Flick "prove" preview).
  //   1  Hook
  //   2  Motivation (single-select, 4 opts)
  //   3  Pain points (multi-select, 6 opts)
  //   4  Personalized solution bridge
  //   5  Birth date + name
  //   6  Birth time
  //   7  Birth place
  //   8  Calculating (theatre)
  //   9  Active reveal (tap-to-unlock Sun/Moon/Rising)
  //   10 Preview carousel (4 swipeable mock cards)   ← NEW Flick prove pattern
  //   11 Wake-time anchor
  //   12 Notification bundle
  //   13 Paywall (consolidated)
  const renderStep = () => {
    switch (step) {
      case 1:  return renderHook();
      case 2:  return renderMotivation();
      case 3:  return renderPain();
      case 4:  return renderSolutionBridge();
      case 5:  return renderBirthDate();
      case 6:  return renderBirthTime();
      case 7:  return renderBirthPlace();
      case 8:  return renderCalculating();
      case 9:  return renderBig3Reveal();
      case 10: return renderBlueprintSynthesis();
      case 11: return renderPreview();
      case 12: return renderWakeAnchor();
      case 13: return renderNotifBundle();
      case 14: return renderPaywall();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  const showProgress = step >= 2 && step <= 13;
  const showBack = step >= 2 && step <= 13;

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
  scroll: { flex: 1, backgroundColor: '#FCF9F8' },
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
  // Hook layout — every gap intentional, no flex spacers.
  // Tuned for iPhone 16 Pro (~771 usable) AND Android (status bar ~24-26).
  hookScreen: { flex: 1, paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 36 : 32, paddingBottom: 32, alignItems: 'center', justifyContent: 'flex-start' },
  hookKicker: { fontSize: 11, fontFamily: FONTS.sansSemiBold, letterSpacing: 4, color: T.gold, textAlign: 'center', marginBottom: 10 },
  hookH1: { fontFamily: FONTS.serif, fontSize: 34, color: T.navy, textAlign: 'center', lineHeight: 40, marginBottom: 14, marginTop: 0 },
  hookSub: { fontSize: 14, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.stone, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  hookAuthorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 22,
  },
  hookAuthorityGlyph: { fontSize: 11, lineHeight: 13 },
  hookAuthorityText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.8 },
  hookDisclaimer: { fontSize: 11, color: T.stone, marginTop: 8, opacity: 0.55, fontFamily: FONTS.sans, letterSpacing: 0.4 },

  // Hook CTA — exact match to HomeScreenV2's chipLarge "Go deeper"
  // pattern: peach→lavender gradient with burgundy-tinted shadow. Mia
  // sees the same button shape, color, and lift on her first onboarding
  // screen as she will on the Today tab post-onboarding.
  hookCtaShadow: {
    borderRadius: 100,
    shadowColor: '#5C2434',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  hookCtaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 100,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hookCtaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14,
    color: '#1B1C1C',
    letterSpacing: 0.5,
  },

  // Hook swipe stack — outer area + V2-chrome wrapper + ghost background cards
  hookStackArea: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  hookCardWrap: { borderRadius: 24 },
  hookGhostCard: {
    borderRadius: 24,
    backgroundColor: '#FCF9F8',
    shadowColor: '#645787',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },

  // V2-Sm chrome — compact version of v2CardLifted/Gradient/Sheen for ~360×320
  v2CardLiftedSm: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#FCF9F8',
    shadowColor: '#645787',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
  },
  v2CardGradientSm: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  v2SheenSm: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Hook card — shared body, header row, tag pill, date
  hookCardBody: { flex: 1 },
  hookCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hookCardDate: { fontFamily: FONTS.sansSemiBold, fontSize: 9, letterSpacing: 1.4, color: 'rgba(26,20,16,0.55)' },
  hookTagPill: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(26,20,16,0.12)',
  },

  // CHAT card
  hookBubbleRowRight: { alignItems: 'flex-end', marginBottom: 10 },
  hookBubbleRowLeft: { alignItems: 'flex-start' },
  hookBubbleUser: {
    maxWidth: '88%',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  hookBubbleUserText: { fontSize: 13, fontFamily: FONTS.sans, lineHeight: 18, color: '#1A1410' },
  hookBubbleChart: {
    maxWidth: '92%',
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(26,20,16,0.08)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 14,
  },
  hookBubbleChartText: { fontSize: 13.5, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', lineHeight: 19, color: '#1A1410' },

  // COMPATIBILITY card
  hookMatchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4, paddingHorizontal: 4 },
  hookMatchPerson: { alignItems: 'center', gap: 6, flex: 1 },
  hookMatchAvatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1, borderColor: 'rgba(26,20,16,0.12)',
  },
  hookMatchInitial: { fontFamily: FONTS.serif, fontSize: 24, lineHeight: 28, color: '#1A1410' },
  hookMatchName: { fontFamily: FONTS.serif, fontSize: 15, color: '#1A1410' },
  hookMatchSign: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.4, color: 'rgba(26,20,16,0.65)' },
  hookMatchScoreWrap: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  hookMatchScore: { fontFamily: FONTS.serif, fontSize: 42, lineHeight: 48, letterSpacing: -1.5, color: '#1A1410' },
  hookMatchScorePct: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.6, color: 'rgba(26,20,16,0.65)' },
  hookMatchInsight: {
    fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic',
    fontSize: 13.5, lineHeight: 19, textAlign: 'center',
    color: 'rgba(26,20,16,0.78)', paddingHorizontal: 6, marginTop: 16,
  },

  // TODAY card
  hookTodayHeadline: {
    fontFamily: FONTS.editorialMedium || FONTS.editorial || FONTS.serifMedium || FONTS.serif,
    fontSize: 22, lineHeight: 28, letterSpacing: -0.2,
    color: '#1A1410', marginBottom: 10,
  },
  hookTodayBody: {
    fontFamily: FONTS.editorialItalic || FONTS.editorial || FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic', fontSize: 13.5, lineHeight: 19,
    color: 'rgba(26,20,16,0.65)', marginBottom: 12,
  },
  hookTodayAttr: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.4, color: 'rgba(26,20,16,0.55)' },

  // CHART card
  hookPlacementBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  hookPlacementGlyph: { fontSize: 48, color: '#1A1410', opacity: 0.85, marginBottom: 4 },
  hookPlacementSign: { fontFamily: FONTS.serif, fontSize: 24, color: '#1A1410' },
  hookPlacementDegree: { fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', fontSize: 13, color: 'rgba(26,20,16,0.55)', marginTop: -2 },
  hookPlacementBody: {
    fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic',
    fontSize: 13.5, lineHeight: 20, textAlign: 'center',
    color: 'rgba(26,20,16,0.65)', marginTop: 6,
  },

  // Empty state — matches V2 chrome
  hookStackEmptyKicker: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.4, color: 'rgba(26,20,16,0.65)' },
  hookStackEmptyText: { fontFamily: FONTS.serif, fontSize: 22, lineHeight: 30, textAlign: 'center', color: '#1A1410' },

  // Option cards
  optWrap: { gap: 10 },
  optWrapCompact: { gap: 7 },
  optCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.white, borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, paddingHorizontal: 18, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  optCardCompact: { padding: 11, paddingHorizontal: 14, gap: 11, borderRadius: 12 },
  optCardOn: { backgroundColor: T.white, borderColor: T.gold, borderWidth: 1.5 },
  optIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  optIconCompact: { fontSize: 18, width: 26 },
  optText: { fontSize: 15, fontFamily: FONTS.sansMedium, color: T.ink, lineHeight: 21 },
  optTextCompact: { fontSize: 14, lineHeight: 18 },
  optTextOn: { color: T.navy },
  optSub: { fontSize: 12, color: T.stone, marginTop: 2, lineHeight: 17 },
  optRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  optRadioCompact: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.25 },
  optRadioOn: { borderColor: T.gold, backgroundColor: T.white },
  optRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.gold },
  optRadioDotCompact: { width: 8, height: 8, borderRadius: 4 },

  // Hero CTA — T.clay solid pill, matches HomeScreenV2's primary action
  // color (saved chip filled state, empty CTA, save/share icon glyphs).
  // One burgundy across the entire app for visual continuity onboarding
  // → home. Lavender-tinted shadow matches the V2 card lift so the
  // button rhymes with the swipe stack.
  heroCta: {
    width: 292, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.clay,
    shadowColor: '#645787', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 5,
  },
  heroCtaText: {
    fontFamily: FONTS.sansSemiBold, fontSize: 15,
    color: T.cream, letterSpacing: 0.4,
  },
  heroCtaSub: { fontSize: 12, color: T.stone, textAlign: 'center' },

  // Hook hairline divider — graphic anchor above the headline.
  hookHairline: { width: 36, height: 1, backgroundColor: 'rgba(92,36,52,0.35)', marginBottom: 22 },

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
  calcScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  calcTitle: { fontFamily: FONTS.serif, fontSize: 26, color: T.navy, marginBottom: 28 },
  calcRingWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  calcPhase: { fontSize: 14, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', marginBottom: 20, minHeight: 20 },
  calcDots: { flexDirection: 'row', gap: 8 },
  calcDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.border },
  calcDotOn: { backgroundColor: T.gold },

  // First Hit (screen 9)
  hitGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: 'rgba(200,168,75,0.08)' },
  hitPre: { fontSize: 13, fontFamily: FONTS.sansSemiBold, letterSpacing: 3, color: T.gold, marginBottom: 8 },
  hitSign: { fontFamily: FONTS.serif, fontSize: 52, color: T.navy, marginBottom: 14 },
  hitTagline: { fontSize: 16, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.ink, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16, marginBottom: 24 },
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
  synthesisHeadline: { fontFamily: FONTS.serif, fontSize: 26, lineHeight: 34, textAlign: 'center', marginTop: 12, marginBottom: 18 },

  // ── Step 10 Synthesis — "Mia's trading card" layout ──────────────
  synthKicker: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.4, color: T.brass, textAlign: 'center', marginBottom: 12 },
  synthSigilWrap: { alignItems: 'center', marginBottom: 14 },
  synthHeadline: {
    fontFamily: FONTS.serif,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 18,
  },
  synthCardWrap: { height: 110, marginBottom: 14 },
  synthCardInner: { flex: 1, paddingHorizontal: 4, paddingVertical: 4 },
  synthCardKicker: {
    fontSize: 9, fontFamily: FONTS.sansSemiBold,
    letterSpacing: 2, color: 'rgba(26,20,16,0.55)',
    marginBottom: 8,
  },
  synthCardLine: {
    fontFamily: FONTS.serif, fontSize: 17, lineHeight: 23,
    color: '#1A1410', marginBottom: 8,
  },
  synthCardBody: {
    fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic',
    fontSize: 13, lineHeight: 18,
    color: 'rgba(26,20,16,0.72)',
  },

  synthTraitsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 14,
  },
  synthTraitChip: {
    flex: 1,
    paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  synthTraitGlyph: { fontSize: 18, lineHeight: 22 },
  synthTraitText: {
    fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic',
    fontSize: 11, lineHeight: 14, textAlign: 'center',
  },

  synthCoreQWrap: { height: 130, marginBottom: 6 },
  synthCoreQKicker: {
    fontSize: 9, fontFamily: FONTS.sansSemiBold,
    letterSpacing: 2, color: 'rgba(26,20,16,0.55)',
    marginBottom: 8, textAlign: 'center',
  },
  synthCoreQText: {
    fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic',
    fontSize: 17, lineHeight: 24, color: '#1A1410',
    textAlign: 'center', marginBottom: 8,
  },
  synthCoreQFooter: {
    fontSize: 11, fontFamily: FONTS.sans,
    color: 'rgba(26,20,16,0.55)', textAlign: 'center',
  },

  // ── Stitch-editorial style for step 9 (Big 3 reveal) ──
  editorialScreen: { flex: 1, paddingHorizontal: 32, paddingTop: 36, paddingBottom: 24, alignItems: 'center', justifyContent: 'flex-start' },
  editorialKickerWrap: { alignItems: 'center', marginBottom: 24 },
  editorialKicker: { fontSize: 12, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.4, marginBottom: 10 },
  editorialKickerRule: { width: 18, borderBottomWidth: StyleSheet.hairlineWidth, opacity: 0.4 },
  revealCluster: { width: '100%', alignItems: 'center', position: 'relative', paddingVertical: 4, marginBottom: 32 },
  revealConnector: { position: 'absolute', top: 16, bottom: 16, width: StyleSheet.hairlineWidth, alignSelf: 'center', opacity: 0.12 },
  editorialLocked: {
    width: '100%',
    maxWidth: 280,
    height: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
  },
  editorialLockLabel: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    letterSpacing: 2,
  },
  editorialRevealed: {
    width: '100%',
    maxWidth: 320,
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  editorialRevealedLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  editorialPlanetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorialPlanetGlyph: { fontSize: 20, lineHeight: 24, opacity: 0.85 },
  editorialRevealedKicker: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  editorialRevealedSign: { fontFamily: FONTS.serif, fontSize: 22, lineHeight: 26 },
  editorialDegreeWrap: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: 14,
    height: 28,
    justifyContent: 'center',
    opacity: 0.55,
  },
  editorialDegree: {
    fontSize: 13,
    fontFamily: FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
  },
  editorialCta: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
  },
  editorialCtaLabel: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    letterSpacing: 2.4,
  },
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

  // ── Preview carousel (screen 10) ──────────────
  previewDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  previewDot: { width: 6, height: 6, borderRadius: 3 },

  previewStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14, marginTop: 14 },
  previewStat: { flex: 1, alignItems: 'center', gap: 2 },
  previewStatNum: { fontFamily: FONTS.serif, fontSize: 24, color: T.navy },
  previewStatLabel: { fontSize: 10, letterSpacing: 0.6, textAlign: 'center' },
  previewStatDiv: { width: 1, height: 24 },

  // ── Notification-channel toggles (screen 13) ─────
  notifSectionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  notifChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  notifChannelIcon: { fontSize: 17, width: 20, textAlign: 'center' },
  notifChannelLabel: { fontSize: 14, fontFamily: FONTS.sansSemiBold, marginBottom: 1 },
  notifChannelDesc: { fontSize: 11.5, fontFamily: FONTS.sansLight, lineHeight: 15 },

  // ── Tinder swipe stack (screen 10) ──────────────
  stackArea: {
    width: '100%',
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackCard: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  stackEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  stackEmptyGlyph: { fontSize: 38, opacity: 0.7 },
  stackEmptyText: {
    fontSize: 14,
    fontFamily: FONTS.editorialItalic || FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── HomeScreenV2 mock card chrome ─────────────────
  // Matches cardSlotStyles.cardLifted + cardGradient + sheen.
  v2CardLifted: {
    flex: 1,
    borderRadius: 32,
    backgroundColor: '#FCF9F8',
    shadowColor: '#645787',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  v2CardGradient: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    paddingVertical: 22,
    paddingHorizontal: 22,
  },
  v2Sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Magazine layout (anchor + sky)
  v2AnchorContent: { flex: 1, justifyContent: 'space-between' },
  v2AnchorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  v2AnchorHeaderLeft: { alignItems: 'flex-start', gap: 8 },
  v2AnchorBody: { paddingTop: 4 },
  v2DateInline: {
    fontFamily: FONTS.sansSemiBold, fontSize: 9,
    letterSpacing: 1.4, color: 'rgba(26,20,16,0.65)', marginTop: 10,
  },
  v2HeadlineLeft: {
    fontFamily: FONTS.editorialMedium || FONTS.editorial || FONTS.serifMedium,
    fontSize: 21, lineHeight: 26, letterSpacing: -0.2,
    color: '#1A1410', textAlign: 'left', marginBottom: 8,
  },
  v2MetaLeft: {
    fontFamily: FONTS.sans, fontSize: 12, lineHeight: 17,
    color: 'rgba(26,20,16,0.65)', textAlign: 'left', maxWidth: '94%',
  },
  v2SeasonChip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 4, paddingHorizontal: 9, borderRadius: 100, borderWidth: 1,
    marginTop: 10, maxWidth: '94%',
    backgroundColor: 'rgba(254,217,184,0.45)', borderColor: '#FED9B8',
  },
  v2SeasonLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 8, letterSpacing: 1.2, color: 'rgba(26,20,16,0.65)' },
  v2SeasonValue: { fontFamily: FONTS.sansSemiBold, fontSize: 10, color: '#1A1410', flexShrink: 1 },

  // Centered layout (love/career/growth/reflect)
  v2ContentInner: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 12, paddingHorizontal: 4,
  },
  v2Headline: {
    fontFamily: FONTS.editorialMedium || FONTS.editorial || FONTS.serifMedium,
    fontSize: 19, lineHeight: 24, letterSpacing: -0.1,
    color: '#1A1410', textAlign: 'center', marginBottom: 10,
  },
  v2Meta: {
    fontFamily: FONTS.editorialItalic || FONTS.editorial || FONTS.serifItalic,
    fontSize: 12, lineHeight: 17, fontStyle: 'italic',
    color: 'rgba(26,20,16,0.65)', textAlign: 'center', maxWidth: 280,
  },

  // Motif badge — circular icon stamp (compact for onboarding preview)
  v2MotifBadge: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
    backgroundColor: '#FFFFFF', borderColor: '#FED9B8',
  },

  // Tag pill — uppercase chip (peachy V2 background)
  v2TagPill: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 100, borderWidth: 1,
    backgroundColor: 'rgba(254,217,184,0.5)', borderColor: '#FED9B8',
    marginBottom: 12,
  },
  v2TagPillAnchor: {
    paddingVertical: 5, paddingHorizontal: 11, borderRadius: 100, borderWidth: 1,
    backgroundColor: 'rgba(254,217,184,0.5)', borderColor: '#FED9B8',
  },
  v2TagLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 10, letterSpacing: 2.5, color: '#1A1410' },

  // Sky data widgets — side-by-side cells
  v2DataRow: { flexDirection: 'row', alignSelf: 'stretch', gap: 6, marginTop: 8 },
  v2DataCell: {
    flex: 1, padding: 8, borderRadius: 12, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.55)', borderColor: 'rgba(26,20,16,0.06)',
  },
  v2DataLabel: { fontSize: 8, letterSpacing: 1.2, fontFamily: FONTS.sansSemiBold, color: 'rgba(26,20,16,0.42)', marginBottom: 2 },
  v2DataValue: { fontFamily: FONTS.editorialMedium || FONTS.editorial || FONTS.serifMedium, fontSize: 13, color: '#1A1410', marginBottom: 1 },
  v2DataDetail: { fontFamily: FONTS.sans, fontSize: 10, color: 'rgba(26,20,16,0.65)', lineHeight: 13 },

  // Sky context tag chips
  v2TagRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 5, marginTop: 8 },
  v2ContextTag: {
    paddingVertical: 3, paddingHorizontal: 9, borderRadius: 100, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.55)', borderColor: 'rgba(26,20,16,0.08)',
  },
  v2ContextTagText: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 0.3, color: 'rgba(26,20,16,0.65)' },

  // Active reveal — locked planet cards (screen 9)
  lockedCardInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  lockedGlyph: { fontSize: 30, color: T.gold, opacity: 0.55 },
  lockedHint: { fontSize: 12, fontFamily: FONTS.sans, letterSpacing: 0.4, textAlign: 'center' },

  // Solution bridge (screen 4)
  bridgeList: { gap: 12, marginTop: 8 },
  bridgeRow: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  bridgePainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bridgeSolutionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingLeft: 0 },
  bridgeXMark: { fontSize: 14, color: '#B05050', fontFamily: FONTS.sansSemiBold, width: 16, marginTop: 2 },
  bridgeCheckMark: { fontSize: 14, color: T.gold, fontFamily: FONTS.sansSemiBold, width: 16, marginTop: 2 },
  bridgePainText: { flex: 1, fontSize: 13, fontFamily: FONTS.sans, lineHeight: 19, textDecorationLine: 'line-through', opacity: 0.7 },
  bridgeSolutionText: { flex: 1, fontSize: 14, fontFamily: FONTS.sansMedium, lineHeight: 21 },

  // Compact variant — fits 6 rows in one viewport (used on screen 4)
  bridgeListCompact: { gap: 14, marginTop: 4 },
  bridgeRowCompact: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 6 },
  bridgePainRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bridgeSolutionRowCompact: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bridgeXMarkCompact: { fontSize: 12, color: '#B05050', fontFamily: FONTS.sansSemiBold, width: 14, lineHeight: 16 },
  bridgeCheckMarkCompact: { fontSize: 12, color: T.gold, fontFamily: FONTS.sansSemiBold, width: 14, marginTop: 1, lineHeight: 16 },
  bridgePainTextCompact: { flex: 1, fontSize: 12, fontFamily: FONTS.sans, lineHeight: 16, textDecorationLine: 'line-through', opacity: 0.7 },
  bridgeSolutionTextCompact: { flex: 1, fontSize: 13, fontFamily: FONTS.sansMedium, lineHeight: 18 },

  // Wake-time anchor (screen 11)
  wakeTimeCard: { marginTop: 20, marginBottom: 12, paddingVertical: 22, paddingHorizontal: 24, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  wakeTimeDisplay: { fontFamily: FONTS.serif, fontSize: 42, lineHeight: 50, textAlign: 'center', letterSpacing: -0.5 },
  wakeTimeChangeHint: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2.4, marginTop: 10 },
  wakePickerWrap: { marginTop: 0, marginBottom: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 6, alignItems: 'stretch', justifyContent: 'center' },
  wakePicker: { width: '100%', height: 200 },
  wakePromise: { fontSize: 12, fontFamily: FONTS.sansLight, fontStyle: 'italic', color: T.stone, textAlign: 'center', marginTop: 6, marginBottom: 4 },

  // ── Paywall — Stitch "Liquid Glass" editorial (pixel-accurate) ─────
  paywallOrbTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  paywallOrbBottom: {
    position: 'absolute',
    bottom: -120,
    left: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
  },
  paywallHeaderStitch: { alignItems: 'center', marginBottom: 14 },
  paywallSigilWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  // Legacy sparkle styles — unused now (animated CelestialSigil replaced them)
  paywallSparkleCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  paywallSparkleIcon: { fontSize: 20, color: '#2a0002', fontWeight: '600' },
  paywallH1Stitch: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    textAlign: 'center',
    color: '#2a0002',
    marginBottom: 4,
  },
  paywallBodyStitch: {
    fontSize: 14,
    fontFamily: FONTS.sans,
    lineHeight: 20,
    textAlign: 'center',
    color: '#544341',
    maxWidth: 280,
    alignSelf: 'center',
  },

  paywallBenefitsStitch: { gap: 10, marginBottom: 16 },
  paywallBenefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(135,114,112,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  paywallBenefitIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  paywallBenefitTextStitch: { fontSize: 14, fontFamily: FONTS.sans, color: '#1b1c1c', flex: 1 },

  paywallPlansStitch: { gap: 10 },
  paywallPlanCardStitch: {
    backgroundColor: '#F5F2EE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    overflow: 'hidden',
  },
  paywallGlassGleam: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12,
  },
  paywallBestFloatTag: {
    position: 'absolute',
    top: -12,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    zIndex: 10,
    backgroundColor: '#775a19',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 3, elevation: 3,
  },
  paywallBestFloatText: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: '#FFFFFF' },
  paywallPlanCardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  paywallPlanCardTitle: { fontFamily: FONTS.serif, fontSize: 22, lineHeight: 26, color: '#2a0002', marginBottom: 2 },
  paywallPlanCardSub: { fontSize: 13, fontFamily: FONTS.sans, color: '#544341', lineHeight: 18 },
  paywallPlanCardPrice: { fontFamily: FONTS.serif, fontSize: 28, lineHeight: 32, color: '#2a0002' },
  paywallPlanCardPer: { fontSize: 13, fontFamily: FONTS.sans, color: '#544341', marginTop: 1 },

  paywallFooterStitch: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(135,114,112,0.10)',
    gap: 12,
  },
  paywallTimelineStitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  paywallTimelineConnector: {
    position: 'absolute',
    top: 6,
    left: 30, right: 30,
    height: 1,
    backgroundColor: 'rgba(135,114,112,0.20)',
  },
  paywallTimelineCol: { alignItems: 'center', backgroundColor: '#FBF9F8', paddingHorizontal: 8, gap: 8 },
  paywallTimelineDotStitch: { width: 12, height: 12, borderRadius: 6 },
  paywallTimelineLabelStitch: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2 },

  // Paywall CTA matches HomeStyleCta shape/shadow exactly — full pill,
  // burgundy-tinted lift — but keeps the gold gradient inside for the
  // "premium upgrade" signal. Best of both: visual unity with the rest
  // of the app + gold convention for paid moments.
  paywallCtaPillWrap: {
    width: '100%',
    borderRadius: 100,
    shadowColor: '#5C2434',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  paywallCtaPill: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallCtaPillText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14,
    color: '#2a0002',
    letterSpacing: 2.4,
  },
  paywallSkipStitch: { fontSize: 14, fontFamily: FONTS.sans, color: '#544341', textAlign: 'center' },

  // Trial sub-note shown on the selected annual card ("✦ 7 days free")
  paywallPlanTrialNote: {
    fontSize: 11,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 0.4,
    marginTop: 6,
  },

  // Trust + compliance footer stack (NO PAYMENT NOW + auto-renewal + legal)
  paywallTrustLine: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 1.6,
    color: 'rgba(58,26,40,0.7)',
    textAlign: 'center',
    marginTop: -4,
  },
  paywallFinePrint: {
    fontSize: 11,
    fontFamily: FONTS.sans,
    color: 'rgba(58,26,40,0.5)',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: -8,
    paddingHorizontal: 8,
  },
  paywallLimitedLink: {
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: 'rgba(58,26,40,0.65)',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: -4,
  },
  paywallLegalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -8,
  },
  paywallLegalLink: {
    fontSize: 11,
    fontFamily: FONTS.sans,
    color: 'rgba(58,26,40,0.55)',
    textDecorationLine: 'underline',
  },
  paywallLegalDot: { fontSize: 11, color: 'rgba(58,26,40,0.3)' },

  // ── Old paywall layout styles (compact one-screen, kept for reference)
  // Header + content stack from top, flex-spacer absorbs slack, footer
  // (timeline + CTA + trust) pins to bottom for thumb reach.
  paywallContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
  },

  // Zone 1: Header
  paywallHeader: { alignItems: 'center', marginBottom: 18 },
  paywallPre: { fontSize: 20, color: T.brass, textAlign: 'center', marginBottom: 6, opacity: 0.85 },
  paywallH1: { fontFamily: FONTS.serif, fontSize: 24, lineHeight: 30, textAlign: 'center', marginBottom: 12 },
  paywallSocialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
  },
  paywallSocialStars: { fontSize: 11, letterSpacing: 1.5 },
  paywallSocialText: { fontSize: 11, fontFamily: FONTS.sans, fontStyle: 'italic' },

  // Zone 2: Content
  paywallContent: { gap: 14 },
  paywallBenefits: { gap: 9, paddingHorizontal: 6 },
  paywallBenefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  paywallCheck: { fontSize: 14, fontFamily: FONTS.sansSemiBold, width: 16, lineHeight: 20 },
  paywallBenefitText: { fontSize: 14, fontFamily: FONTS.sansMedium, lineHeight: 20, flex: 1 },

  paywallPlans: { marginTop: 4 },
  paywallPlanRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  paywallPlanInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paywallBestTag: {
    position: 'absolute',
    top: -8,
    right: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  paywallBestText: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.6, color: '#FFFFFF' },
  paywallRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallRadioDot: { width: 10, height: 10, borderRadius: 5 },
  paywallPlanHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paywallPlanName: { fontSize: 14, fontFamily: FONTS.sansSemiBold },
  paywallPlanPrice: { fontSize: 16, fontFamily: FONTS.serif, fontWeight: '700' },
  paywallPlanSave: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.6, marginTop: 1 },
  paywallPlanSub: { fontSize: 11.5, fontFamily: FONTS.sansLight, marginTop: 2 },
  paywallPlanTrialBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  paywallPlanTrialText: { fontSize: 10.5, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.3 },

  // Zone 3: Footer (timeline + CTA + trust + links)
  paywallFooter: { alignItems: 'center' },
  paywallTimelineRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    position: 'relative',
  },
  paywallTimelineLine: {
    position: 'absolute',
    top: 5,
    left: '17%',
    right: '17%',
    height: StyleSheet.hairlineWidth,
  },
  paywallTimelineStep: { alignItems: 'center', flex: 1 },
  paywallTimelineDot: { width: 11, height: 11, borderRadius: 6, marginBottom: 6 },
  paywallTimelineDotOutline: {
    width: 11, height: 11, borderRadius: 6,
    borderWidth: 1.2, backgroundColor: '#FCF9F8',
    marginBottom: 6,
  },
  paywallTimelineDay: { fontSize: 11, fontFamily: FONTS.sansSemiBold, marginBottom: 1 },
  paywallTimelineDesc: { fontSize: 10, fontFamily: FONTS.sansLight },

  paywallTrust: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.2, marginTop: 10 },
  paywallTerms: { fontSize: 10.5, fontFamily: FONTS.sans, textAlign: 'center', marginTop: 4, paddingHorizontal: 8, lineHeight: 14 },
  paywallFooterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 8 },
  paywallFooterLink: { fontSize: 11, fontFamily: FONTS.sans, textDecorationLine: 'underline' },
  paywallFooterDivider: { fontSize: 11 },

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
