import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import CelestialSigil from '../components/CelestialSigil';
import { useUserProfile } from '../contexts/UserProfileContext';
import { fetchExtendedForecast } from '../services/geminiService';
import { getTransitPlanets } from '../services/astrologyService';
import { loadString, StorageKeys } from '../services/storage';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { userProfile, isLoading } = useUserProfile();
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationCCW = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const fadeUp = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isLoading && userProfile?.chart) {
      // Pre-warm today's forecast cache so HomeScreen renders without a
      // visible spinner. Fire-and-forget: ForecastRepository handles the
      // store. If HomeScreen mounts before this completes, it hits the
      // cache as soon as this resolves; if it beats us, no harm done.
      (async () => {
        try {
          const today = new Date();
          const transits = getTransitPlanets(today);
          let briefingMode = 'standard';
          try {
            const firstUse = await loadString(StorageKeys.FIRST_USE_DATE);
            if (firstUse) {
              const start = new Date(firstUse + 'T00:00:00');
              const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0);
              const days = Math.max(0, Math.floor((todayMid - start) / 86400000));
              const weeks = Math.floor(days / 7);
              const modes = ['standard', 'pattern', 'partner', 'archetype'];
              briefingMode = modes[weeks % 4];
              // Don't speculate 'partner' mode — HomeScreen will downgrade it
              // if the user has no Circle entries, causing a cache miss.
              if (briefingMode === 'partner') briefingMode = 'standard';
            }
          } catch {}
          const planetaryData = {
            dateLabel: today.toISOString().split('T')[0],
            transits: transits.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}°`).join(', '),
          };
          fetchExtendedForecast(userProfile, 'today', planetaryData, 0, null, briefingMode).catch(() => {});
        } catch {}
      })();
      navigation.replace('Main');
    }
  }, [isLoading, userProfile]);

  useEffect(() => {
    // Orbit animations
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(rotationCCW, { toValue: -1, duration: 24000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Float
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -9, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    // Fade in
    Animated.parallel([
      Animated.timing(fadeUp, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 900, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinCCW = rotationCCW.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <LinearGradient colors={['#FBDFC6', '#FAEEDD', '#FAF6EE']} locations={[0, 0.55, 1]} style={styles.container}>
      {/* Soft white sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
        locations={[0, 0.5]}
        style={styles.sheen}
        pointerEvents="none"
      />

      {/* Soft brass halo */}
      <View style={styles.halo} />

      {/* Orb system — rotating brass rings + central CelestialSigil */}
      <Animated.View style={[styles.orbSystem, { transform: [{ translateY: float }] }]}>
        {/* Ring 3 - outermost (slow CW) */}
        <Animated.View style={[styles.ring, styles.ring3, { transform: [{ rotate: spin }] }]}>
          <View style={styles.ringDot} />
        </Animated.View>
        {/* Ring 2 - middle (CCW) */}
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ rotate: spinCCW }] }]} />
        {/* Ring 1 - innermost (CW) */}
        <Animated.View style={[styles.ring, styles.ring1, { transform: [{ rotate: spin }] }]}>
          <View style={styles.ringDot} />
        </Animated.View>

        {/* Central brand mark */}
        <View style={styles.sigilHolder}>
          <CelestialSigil size={140} color="#B89968" />
        </View>
      </Animated.View>

      {/* Wordmark */}
      <Animated.Text style={[styles.wordmark, { opacity: fadeUp, transform: [{ translateY: slideUp }] }]}>
        CELESTIA
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: fadeUp, transform: [{ translateY: slideUp }] }]}>
        NAVIGATE YOUR COSMOS
      </Animated.Text>

      {/* CTA */}
      <Animated.View style={[styles.btnWrap, { opacity: fadeUp, transform: [{ translateY: slideUp }] }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('OnboardingFlow')}
          style={styles.ctaShadow}>
          <LinearGradient colors={['#FED9B8', '#E9DDFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
            <Text style={styles.ctaText}>Begin Your Journey </Text>
            <Text style={styles.ctaGlyph}>✦</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.loginText}>
            Already exploring? <Text style={styles.loginLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
  },
  halo: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: '12%',
    alignSelf: 'center',
    backgroundColor: 'rgba(184,153,104,0.06)',
  },
  orbSystem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 252,
    height: 252,
    marginBottom: 46,
  },
  sigilHolder: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderColor: 'transparent',
  },
  ring1: {
    width: 168,
    height: 168,
    borderWidth: 0.8,
    borderColor: 'rgba(184,153,104,0.22)',
  },
  ring2: {
    width: 210,
    height: 210,
    borderWidth: 0.5,
    borderColor: 'rgba(184,153,104,0.14)',
  },
  ring3: {
    width: 252,
    height: 252,
    borderWidth: 0.4,
    borderColor: 'rgba(184,153,104,0.09)',
  },
  ringDot: {
    position: 'absolute',
    top: -3.5,
    left: '50%',
    marginLeft: -3.5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#B89968',
    shadowColor: '#B89968',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  wordmark: {
    fontFamily: FONTS.serif,
    fontSize: 46,
    letterSpacing: 10,
    color: '#1A1410',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 11,
    fontFamily: FONTS.sansLight,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(26,20,16,0.5)',
    marginBottom: 56,
  },
  btnWrap: {
    alignItems: 'center',
    gap: 16,
  },
  ctaShadow: {
    shadowColor: '#5C2434',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
  cta: {
    width: 292,
    height: 58,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 16,
    color: '#1A1410',
    letterSpacing: 0.3,
  },
  ctaGlyph: {
    fontSize: 16,
    color: '#B89968',
  },
  loginText: {
    fontSize: 13,
    color: 'rgba(26,20,16,0.5)',
  },
  loginLink: {
    color: T.clay,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(92,36,52,0.35)',
  },
});
