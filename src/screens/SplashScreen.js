import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import Stars from '../components/Stars';
import { useUserProfile } from '../contexts/UserProfileContext';

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
    <LinearGradient colors={['#1A0A55', '#0E0E22', '#07070F']} locations={[0, 0.45, 1]} style={styles.container}>
      <Stars count={34} />

      {/* Glow halo */}
      <View style={styles.halo} />

      {/* Orb system */}
      <Animated.View style={[styles.orbSystem, { transform: [{ translateY: float }] }]}>
        {/* Ring 3 - outermost */}
        <Animated.View style={[styles.ring, styles.ring3, { transform: [{ rotate: spin }] }]}>
          <View style={styles.ringDot} />
        </Animated.View>
        {/* Ring 2 */}
        <Animated.View style={[styles.ring, styles.ring2, { transform: [{ rotate: spinCCW }] }]} />
        {/* Ring 1 */}
        <Animated.View style={[styles.ring, styles.ring1, { transform: [{ rotate: spin }] }]}>
          <View style={styles.ringDot} />
        </Animated.View>
        {/* Sun */}
        <LinearGradient
          colors={['#EDD060', '#C8A84B', '#8C6C18', '#4A3808']}
          locations={[0, 0.38, 0.72, 1]}
          style={styles.sun}
        />
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
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('OnboardingFlow')}>
          <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
            <Text style={styles.ctaText}>Begin Your Journey ✦</Text>
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
  halo: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    top: '10%',
    alignSelf: 'center',
    backgroundColor: 'rgba(200,168,75,0.06)',
  },
  orbSystem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    marginBottom: 46,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 0.8,
    borderColor: 'transparent',
  },
  ring1: {
    width: 160,
    height: 160,
    borderColor: 'rgba(200,168,75,0.22)',
  },
  ring2: {
    width: 204,
    height: 204,
    borderWidth: 0.5,
    borderColor: 'rgba(200,168,75,0.12)',
  },
  ring3: {
    width: 252,
    height: 252,
    borderWidth: 0.4,
    borderColor: 'rgba(200,168,75,0.07)',
  },
  ringDot: {
    position: 'absolute',
    top: -3.5,
    left: '50%',
    marginLeft: -3.5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: T.gold,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  sun: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
  },
  wordmark: {
    fontFamily: FONTS.serif,
    fontSize: 46,
    letterSpacing: 10,
    color: T.cream,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 11,
    fontFamily: FONTS.sansLight,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(250,248,242,0.36)',
    marginBottom: 56,
  },
  btnWrap: {
    alignItems: 'center',
    gap: 16,
  },
  cta: {
    width: 292,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 26,
  },
  ctaText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 16,
    color: T.navy,
    letterSpacing: 0.3,
  },
  loginText: {
    fontSize: 13,
    color: 'rgba(250,248,242,0.38)',
  },
  loginLink: {
    color: 'rgba(200,168,75,0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200,168,75,0.3)',
  },
});
