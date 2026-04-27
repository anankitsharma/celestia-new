import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';

const { width } = Dimensions.get('window');

// V1.2 — Light Liquid Glass splash. Pure typographic treatment per
// `plan/Narrative-ASO/90-Second-Walkthrough.md` Frame A: cream canvas,
// serif wordmark, no orbital rings, no sun glyph, no mystical iconography.
// First impression a reviewer gets — must read as editorial / Apple Books,
// not as a saturated-category astrology app.
export default function SplashScreen({ navigation }) {
  const { userProfile, isLoading } = useUserProfile();
  const fadeUp = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!isLoading && userProfile?.chart) {
      navigation.replace('Main');
    }
  }, [isLoading, userProfile]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeUp, { toValue: 1, duration: 900, delay: 200, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 900, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={['#FBF5EA', '#F7F0E2', '#F4ECDB']}
      locations={[0, 0.5, 1]}
      style={styles.container}>

      <Animated.View style={[styles.center, { opacity: fadeUp, transform: [{ translateY: slideUp }] }]}>
        <Text style={styles.wordmark} accessibilityRole="header">CELESTIA</Text>
        <View style={styles.hairline} />
        <Text style={styles.tagline}>Understand the patterns shaping{'\n'}the people you love.</Text>
      </Animated.View>

      <Animated.View style={[styles.btnWrap, { opacity: fadeUp, transform: [{ translateY: slideUp }] }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Begin. See your patterns."
          onPress={() => navigation.navigate('OnboardingFlow')}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Begin</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '32%',
    paddingBottom: '14%',
    paddingHorizontal: 32,
  },
  center: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FONTS.serif,
    fontSize: 44,
    letterSpacing: 8,
    color: T.ink,
    textAlign: 'center',
    marginBottom: 18,
  },
  hairline: {
    width: 36,
    height: 1,
    backgroundColor: 'rgba(92,36,52,0.35)',
    marginBottom: 18,
  },
  tagline: {
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: T.inkDim,
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  btnWrap: {
    alignItems: 'center',
    width: '100%',
  },
  cta: {
    width: 292,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.clay,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 15,
    color: T.cream,
    letterSpacing: 0.4,
  },
});
