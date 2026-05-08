import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, ScrollView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import Stars from '../components/Stars';
import ChartWheel from '../components/ChartWheel';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAnalytics, EVENTS } from '../services/analytics';
import { haptic } from '../services/hapticService';
import { requestNotificationPermission, hasNotificationPermission, scheduleAllNotifications, getNotificationSettings } from '../services/notificationService';
import NotificationPermissionModal from '../components/NotificationPermissionModal';
import { saveBoolean, loadBoolean, saveString, StorageKeys } from '../services/storage';
import { getComboRarity } from '../services/cosmicIdentityService';

// Deeply specific placement statements — these feel personal, not generic
const MOON_HOUSE_INSIGHTS = {
  1: 'Your emotions are written all over your face. People feel your mood before you speak.',
  2: 'You find emotional safety in what you can touch, taste, and own. Comfort is your love language.',
  3: 'Your mind never stops processing feelings into words. You think your way through emotions.',
  4: 'Home isn\'t a place for you — it\'s a feeling. You carry it with you, or you feel lost.',
  5: 'You need to be adored. Not admired — adored. And you give that back tenfold.',
  6: 'You process emotions through routines and small acts of service. Chaos makes you unravel.',
  7: 'You only fully feel yourself when reflected in someone else\'s eyes.',
  8: 'Your emotional world is vast and private. You feel things others don\'t notice.',
  9: 'You heal by moving — new places, new ideas, new perspectives.',
  10: 'You hide your vulnerability behind competence. The world sees strength; you feel pressure.',
  11: 'You feel most yourself in a group of people who think differently.',
  12: 'Your emotional world is oceanic. You absorb everything — and most people have no idea.',
};

const VENUS_SIGN_INSIGHTS = {
  Aries: 'You chase who you want — and lose interest when the chase ends.',
  Taurus: 'You love slowly, deeply, and with your whole body. You don\'t do casual.',
  Gemini: 'You fall for minds before bodies. If they can\'t make you laugh, you\'re already gone.',
  Cancer: 'You love by taking care of people — and resent them when they don\'t notice.',
  Leo: 'You need grand love. Not quiet love. Not practical love. The kind that makes a scene.',
  Virgo: 'You show love through fixing things. You notice every detail — including every flaw.',
  Libra: 'You\'d rather be in the wrong relationship than no relationship at all.',
  Scorpio: 'You love like it\'s life or death. Because for you, it is.',
  Sagittarius: 'You need someone who makes you feel free, not someone who makes you feel safe.',
  Capricorn: 'You love in actions, not words. You\'d build someone a house before saying "I love you."',
  Aquarius: 'You need intellectual equals, not emotional dependents. Your love language is respect.',
  Pisces: 'You fall in love with people\'s potential — and then drown when they don\'t meet it.',
};

const SUN_MOON_COMBOS = {
  'Fire-Water': 'Your outer confidence hides an emotional depth that surprises everyone — including you.',
  'Fire-Fire': 'You burn bright, feel fast, and recover quickly. But you rarely let anyone see the ashes.',
  'Fire-Earth': 'Ambitious on the outside, quietly anxious on the inside. You hold yourself to impossible standards.',
  'Fire-Air': 'You live in your head and your heart at the same time — and they rarely agree.',
  'Earth-Water': 'You appear grounded, but inside you feel everything. You\'re the most emotional person no one suspects.',
  'Earth-Fire': 'Practical on the surface, restless underneath. You crave adventure but choose stability.',
  'Earth-Earth': 'You are the most reliable person in every room. That\'s both your gift and your prison.',
  'Earth-Air': 'You think more than you feel — and sometimes that worries you.',
  'Water-Fire': 'You feel everything deeply but react with intensity. People don\'t expect how strong you are.',
  'Water-Water': 'You absorb the emotional weather of every room you enter. Boundaries are your life lesson.',
  'Water-Earth': 'Your intuition is grounded in reality. You feel truth before you can explain it.',
  'Water-Air': 'You overthink your feelings and feel your thoughts. It\'s exhausting — and no one gets it.',
  'Air-Fire': 'Quick mind, big energy. You talk yourself into and out of things faster than anyone.',
  'Air-Water': 'You intellectualize your emotions because feeling them fully is terrifying.',
  'Air-Earth': 'You plan everything — including feelings. Spontaneity makes you uncomfortable.',
  'Air-Air': 'You live in ideas. Getting out of your head and into your body is the challenge.',
};

function getElement(sign) {
  const map = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  };
  return map[sign] || 'Fire';
}

export default function WelcomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile } = useUserProfile();
  const { capture } = useAnalytics();
  const chart = userProfile?.chart;
  const firstName = userProfile?.name?.split(' ')[0] || 'Stargazer';
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const venus = chart?.planets?.find(p => p.name === 'Venus');
  const big3 = [
    sun && `☉ ${sun.sign}`,
    moon && `☽ ${moon.sign}`,
    rising && `↑ ${rising.sign}`,
  ].filter(Boolean);

  // Generate 2 deeply specific reveal statements from their actual chart
  const revealStatements = useMemo(() => {
    const statements = [];
    // Statement 1: Moon + house = emotional core
    if (moon?.sign && moon?.house) {
      const houseInsight = MOON_HOUSE_INSIGHTS[moon.house] || MOON_HOUSE_INSIGHTS[8];
      statements.push({
        label: `☽ Moon in ${moon.sign}, ${moon.house}${moon.house === 1 ? 'st' : moon.house === 2 ? 'nd' : moon.house === 3 ? 'rd' : 'th'} house`,
        text: houseInsight,
      });
    }
    // Statement 2: Sun-Moon element combo = inner tension
    if (sun?.sign && moon?.sign) {
      const combo = `${getElement(sun.sign)}-${getElement(moon.sign)}`;
      const comboInsight = SUN_MOON_COMBOS[combo];
      if (comboInsight) {
        statements.push({
          label: `${sun.sign} Sun + ${moon.sign} Moon`,
          text: comboInsight,
        });
      }
    }
    // Statement 3 (fallback or bonus): Venus = how you love
    if (venus?.sign && statements.length < 2) {
      const venusInsight = VENUS_SIGN_INSIGHTS[venus.sign];
      if (venusInsight) {
        statements.push({
          label: `♀ Venus in ${venus.sign}`,
          text: venusInsight,
        });
      }
    }
    return statements.slice(0, 2);
  }, [chart]);

  const float = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.88)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const reveal1 = useRef(new Animated.Value(0)).current;
  const reveal2 = useRef(new Animated.Value(0)).current;
  const revealSlide1 = useRef(new Animated.Value(16)).current;
  const revealSlide2 = useRef(new Animated.Value(16)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  // Subtle gold-shimmer pulse on the wheel when CTA appears (celebration moment)
  const wheelShimmer = useRef(new Animated.Value(0)).current;

  // Permission modal state — shown once when user first chooses a CTA
  const [showNotifModal, setShowNotifModal] = useState(false);
  // Wake-time read back from notification settings — drives the "Tomorrow at X"
  // hero in the modal so the ask is concrete, not generic.
  const [wakeTime, setWakeTime] = useState({ hour: 7, minute: 0 });
  const pendingNavRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getNotificationSettings();
        setWakeTime({
          hour: typeof settings?.morningTime === 'number' ? settings.morningTime : 7,
          minute: typeof settings?.morningMinute === 'number' ? settings.morningMinute : 0,
        });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -9, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    // Sequence: chart -> big3 -> reveal 1 -> reveal 2 -> CTA
    Animated.parallel([
      Animated.spring(scaleIn, { toValue: 1, delay: 300, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, delay: 750, useNativeDriver: true }),
    ]).start();
    // Staggered reveal statements
    Animated.parallel([
      Animated.timing(reveal1, { toValue: 1, duration: 500, delay: 1400, useNativeDriver: true }),
      Animated.timing(revealSlide1, { toValue: 0, duration: 500, delay: 1400, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(reveal2, { toValue: 1, duration: 500, delay: 2000, useNativeDriver: true }),
      Animated.timing(revealSlide2, { toValue: 0, duration: 500, delay: 2000, useNativeDriver: true }),
    ]).start();
    Animated.timing(ctaFade, { toValue: 1, duration: 400, delay: 2600, useNativeDriver: true }).start(() => {
      // Celebration moment — subtle gold shimmer pulse over the wheel + soft haptic
      try { haptic.success(); } catch {}
      Animated.sequence([
        Animated.timing(wheelShimmer, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(wheelShimmer, { toValue: 0, duration: 1200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start();
      capture(EVENTS.POST_CHART_CTA_SHOWN, {
        has_first_reveal: !!revealStatements[0],
        first_reveal_label: revealStatements[0]?.label || null,
      });
    });

    // Analytics — fires once when the chart-reveal screen mounts
    capture(EVENTS.CHART_REVEALED, {
      sun_sign: sun?.sign || null,
      moon_sign: moon?.sign || null,
      rising_sign: rising?.sign || null,
      venus_sign: venus?.sign || null,
      has_birth_time: !userProfile?.isTimeUnknown,
    });

    // Persist the first reveal statement so the D1 morning push can reference
    // exactly what the user just learned. Closes the activation funnel.
    try {
      const first = revealStatements[0];
      if (first?.text) {
        saveString(StorageKeys.FIRST_REVEAL_STATEMENT, first.text);
      }
    } catch {}
  }, []);

  // The pre-filled chat question — picks up from the strongest reveal statement
  // the user just read. Stays in psychological frame (no astro jargon in the
  // visible string), but uses the actual chart-derived statement so it never
  // feels generic.
  const prefilledChatMessage = useMemo(() => {
    const stmt = revealStatements[0];
    if (!stmt) return "Tell me what's most surprising about my chart.";
    // Strip surrounding quotes if any, then wrap once cleanly
    const text = (stmt.text || '').trim().replace(/^["'""]|["'""]$/g, '');
    return `Tell me more about this — "${text}"`;
  }, [revealStatements]);

  // Handle a CTA tap: ask for notification permission once (peak motivation),
  // then navigate to the requested target.
  const handleCtaTap = async (target) => {
    haptic.light();
    capture(EVENTS.POST_CHART_CTA_TAPPED, { target });

    const navigateNow = async () => {
      if (target === 'chat') {
        navigation.replace('Main', {
          screen: 'AskAI',
          params: { prefilledMessage: prefilledChatMessage, source: 'post_chart' },
        });
      } else {
        navigation.replace('Main');
      }
    };

    try {
      const alreadyAsked = await loadBoolean(StorageKeys.NOTIFICATION_ASKED);
      const hasPerm = await hasNotificationPermission();
      if (!alreadyAsked && !hasPerm) {
        pendingNavRef.current = navigateNow;
        setShowNotifModal(true);
        return;
      }
    } catch {}

    navigateNow();
  };

  const handleNotifModalEnable = async () => {
    setShowNotifModal(false);
    try { await saveBoolean(StorageKeys.NOTIFICATION_ASKED, true); } catch {}
    try {
      const granted = await requestNotificationPermission('post_chart');
      if (granted) {
        scheduleAllNotifications(userProfile, null, null, null, null, null).catch(() => {});
      }
    } catch {}
    if (pendingNavRef.current) {
      const fn = pendingNavRef.current; pendingNavRef.current = null; fn();
    }
  };

  const handleNotifModalDismiss = async () => {
    setShowNotifModal(false);
    try { await saveBoolean(StorageKeys.NOTIFICATION_ASKED, true); } catch {}
    if (pendingNavRef.current) {
      const fn = pendingNavRef.current; pendingNavRef.current = null; fn();
    }
  };

  const revealAnims = [
    { opacity: reveal1, translateY: revealSlide1 },
    { opacity: reveal2, translateY: revealSlide2 },
  ];

  return (
    <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} locations={[0, 0.5, 1]} style={styles.container}>
      <Stars count={28} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.wheelWrap, { transform: [{ translateY: float }, { scale: scaleIn }], opacity: scaleIn }]}>
          <View style={styles.zodiacRing}>
            <ChartWheel size={200} planets={chart?.planets} aspects={chart?.aspects} />
            {/* Subtle gold-shimmer pulse — fires once when CTA appears (celebration) */}
            <Animated.View pointerEvents="none" style={[styles.shimmerHalo, { opacity: wheelShimmer }]} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeIn, alignItems: 'center' }}>
          <Text style={styles.name}>{firstName}</Text>
          <View style={styles.big3}>
            {(big3.length > 0 ? big3 : ['☉ —', '☽ —', '↑ —']).map((b, i) => (
              <View key={i} style={styles.b3pill}>
                <Text style={styles.b3text}>{b}</Text>
              </View>
            ))}
          </View>

          {/* Cosmic-identity share — unity framing.
              Names the user's combo as "rare" via real combo-rarity lookup.
              Made for the questioners, not the believers. */}
          {(() => {
            const combo = chart ? getComboRarity(chart) : null;
            if (!combo) return null;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                onPress={async () => {
                  try { haptic.light(); } catch {}
                  capture(EVENTS.SHARE_INITIATED, { source: 'cosmic_identity', rarity: combo.label });
                  try {
                    const sunSign = sun?.sign || '?';
                    const moonSign = moon?.sign || '?';
                    const risingSign = rising?.sign || '?';
                    await Share.share({
                      message: `${sunSign} Sun · ${moonSign} Moon · ${risingSign} Rising\n\nA ${combo.label.toLowerCase()} combination — ${combo.text}.\nFor the questioners, not the believers.\n\n— Celestia ✦`,
                    });
                  } catch {}
                }}
                style={styles.cosmicIdShareBtn}
              >
                <Text style={styles.cosmicIdShareText}>
                  ↗  {combo.label} · Share
                </Text>
              </TouchableOpacity>
            );
          })()}
        </Animated.View>

        {/* Personality Reveal Statements — the "this app knows me" moment.
            Share affordance per CA-B4 — these statements are Celestia's
            equivalent of The Pattern's quotable personality portrait. */}
        {revealStatements.map((stmt, i) => (
          <Animated.View
            key={i}
            style={[styles.revealCard, {
              opacity: revealAnims[i]?.opacity || reveal1,
              transform: [{ translateY: revealAnims[i]?.translateY || revealSlide1 }],
            }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.revealLabel}>{stmt.label}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                onPress={async () => {
                  try { haptic.light(); } catch {}
                  capture(EVENTS.SHARE_INITIATED, {
                    source: i === 0 ? 'first_reveal' : 'reveal',
                    label: stmt.label,
                    reveal_index: i,
                  });
                  try {
                    await Share.share({ message: `"${stmt.text}"\n\n— Celestia ✦` });
                  } catch {}
                }}
                style={{ marginLeft: 'auto', padding: 4 }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(200,168,75,0.85)' }}>↗</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.revealText}>{stmt.text}</Text>
          </Animated.View>
        ))}

        <Animated.View style={{ opacity: ctaFade, alignItems: 'center', width: '100%' }}>
          <Text style={styles.desc}>
            Surprised? There's a lot more in here. Ask Celestia anything.
          </Text>
          <TouchableOpacity activeOpacity={0.85} onPress={() => handleCtaTap('chat')}>
            <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldBtn}>
              <Text style={styles.goldBtnText}>Ask Celestia about this →</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={() => handleCtaTap('dashboard')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Or continue to your dashboard</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 50 }} />
      </ScrollView>

      <NotificationPermissionModal
        visible={showNotifModal}
        onEnable={handleNotifModalEnable}
        onDismiss={handleNotifModalDismiss}
        wakeTime={wakeTime}
        firstRevealStatement={revealStatements[0]?.text || ''}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 36 },
  wheelWrap: { marginBottom: 20 },
  zodiacRing: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: FONTS.serif, fontSize: 33, color: T.cream, marginBottom: 12, textAlign: 'center' },
  big3: { flexDirection: 'row', gap: 7, marginBottom: 20 },
  b3pill: {
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)',
    borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14,
  },
  b3text: { fontSize: 12, color: 'rgba(250,248,242,0.72)' },

  cosmicIdShareBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', backgroundColor: 'rgba(200,168,75,0.05)' },
  cosmicIdShareText: { fontSize: 11, letterSpacing: 1.4, fontFamily: FONTS.sansSemiBold, color: T.gold },

  // Reveal cards — the "wow moment"
  revealCard: {
    width: '100%',
    backgroundColor: 'rgba(200,168,75,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  revealLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
    letterSpacing: 1.5,
    color: T.gold,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  revealText: {
    fontSize: 14,
    fontFamily: FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
    color: 'rgba(250,248,242,0.75)',
    lineHeight: 22,
  },

  desc: {
    fontSize: 13, fontFamily: FONTS.sansLight, color: 'rgba(250,248,242,0.35)',
    textAlign: 'center', lineHeight: 21.5, paddingHorizontal: 8, marginBottom: 24,
  },
  goldBtn: {
    width: '100%', minWidth: 320, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.gold, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.35, shadowRadius: 26,
  },
  goldBtnText: { fontFamily: FONTS.sansMedium, fontSize: 15, color: T.navy },
  secondaryBtn: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 16 },
  secondaryBtnText: {
    fontFamily: FONTS.sansLight,
    fontSize: 13,
    color: 'rgba(250,248,242,0.45)',
    textAlign: 'center',
  },
  shimmerHalo: {
    position: 'absolute',
    top: -10, left: -10, right: -10, bottom: -10,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(200,168,75,0.55)',
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
});
