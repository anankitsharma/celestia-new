import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  StatusBar, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { T, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CelestialSigil from '../components/CelestialSigil';

// AuthScreen — aligned to onboarding's editorial language.
// Cream paper bg (#FCF9F8), navy Playfair H1, animated CelestialSigil
// brand mark, peach→lavender HomeStyleCta-style Google button.
export default function AuthScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { onSignIn } = useAuth();
  const isOnboarding = route.params?.mode === 'onboarding';
  const [loading, setLoading] = useState(false);

  // Entrance animations — sequential reveal of sigil → title → card → footer
  const sigilOpacity = useSharedValue(0);
  const sigilScale = useSharedValue(0.85);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(14);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    sigilOpacity.value = withTiming(1, { duration: 600 });
    sigilScale.value = withTiming(1, { duration: 600 });
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(250, withTiming(0, { duration: 500 }));
    cardOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    cardTranslateY.value = withDelay(450, withTiming(0, { duration: 500 }));
    footerOpacity.value = withDelay(650, withTiming(1, { duration: 400 }));
  }, []);

  const sigilStyle = useAnimatedStyle(() => ({
    opacity: sigilOpacity.value,
    transform: [{ scale: sigilScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { signInWithGoogle } = require('../services/supabase/authService');
      const data = await signInWithGoogle();
      if (data?.session) {
        await onSignIn(data.session);
        if (isOnboarding) {
          navigation.replace('Main');
        } else {
          navigation.goBack();
        }
      }
    } catch (e) {
      if (e.code !== 'ASYNC_STORAGE_SET_ITEM_ERROR' && e.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Google Sign-in failed', e.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.container, { backgroundColor: '#FCF9F8' }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top controls — back/skip on cream bg */}
      <View style={s.topControls}>
        {isOnboarding ? (
          <TouchableOpacity
            onPress={() => navigation.replace('Main')}
            style={s.skipBtn}
            activeOpacity={0.7}>
            <Text style={s.skipText}>Skip for now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            activeOpacity={0.7}>
            <Text style={s.backText}>{'‹'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hero — animated sigil + Playfair title on cream */}
      <View style={s.hero}>
        <ReAnimated.View style={[s.sigilWrap, sigilStyle]}>
          <CelestialSigil size={72} color="#D4A853" />
        </ReAnimated.View>

        <ReAnimated.View style={[s.heroTextArea, titleStyle]}>
          <Text style={s.heroTitle}>Welcome to Celestia</Text>
          <Text style={s.heroSub}>
            {isOnboarding
              ? 'Sign in to sync your chart and history.'
              : 'Sign in to continue your journey.'}
          </Text>
        </ReAnimated.View>
      </View>

      {/* Body — flat layout, no card chrome */}
      <View style={s.body}>
        {/* Benefits */}
        <ReAnimated.View style={[s.benefitsArea, cardStyle]}>
          {[
            { glyph: '☁', text: 'Back up your chart to the cloud' },
            { glyph: '↻', text: 'Sync across all your devices' },
            { glyph: '✦', text: 'Unlock your full chart profile' },
          ].map((b, i) => (
            <View key={i} style={s.benefitRow}>
              <View style={s.benefitGlyphWrap}>
                <Text style={s.benefitGlyph}>{b.glyph}</Text>
              </View>
              <Text style={s.benefitText}>{b.text}</Text>
            </View>
          ))}
        </ReAnimated.View>

        {/* CONTINUE WITH divider */}
        <ReAnimated.View style={[s.divider, cardStyle]}>
          <View style={s.dividerLine} />
          <Text style={s.dividerLabel}>CONTINUE WITH</Text>
          <View style={s.dividerLine} />
        </ReAnimated.View>

        {/* Google button — peach→lavender HomeStyleCta-style pill */}
        <ReAnimated.View style={[{ alignSelf: 'center' }, cardStyle]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={[s.ctaShadow, loading && { shadowOpacity: 0.10 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: !!loading, busy: !!loading }}>
            <LinearGradient
              colors={loading ? ['#E8E1D8', '#DDD8E5'] : ['#FED9B8', '#E9DDFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.ctaGradient, loading && { opacity: 0.7 }]}>
              {loading ? (
                <ActivityIndicator color="#1B1C1C" />
              ) : (
                <View style={s.ctaInner}>
                  <Image
                    source={require('../../assets/google_logo.png')}
                    style={s.googleIcon}
                  />
                  <Text style={s.ctaText}>Continue with Google</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ReAnimated.View>

        <ReAnimated.View style={[s.secureRow, footerStyle]}>
          <Text style={s.secureText}>🔒  Your data is encrypted and secure</Text>
        </ReAnimated.View>

        {/* Legal */}
        <ReAnimated.View style={[s.legalArea, footerStyle]}>
          <Text style={s.legalText}>
            By continuing, you agree to our{' '}
            <Text style={s.legalLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={s.legalLink}>Privacy Policy</Text>
          </Text>
        </ReAnimated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  // Top controls (back/skip) on cream
  topControls: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 12,
    minHeight: 50,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(135,114,112,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { fontSize: 24, color: T.navy, marginTop: -2 },
  skipBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
  skipText: {
    fontSize: 13,
    color: 'rgba(58,26,40,0.55)',
    fontFamily: FONTS.sansMedium,
  },

  // Hero
  hero: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 24, marginBottom: 24 },
  sigilWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },

  heroTextArea: { alignItems: 'center', paddingHorizontal: 12 },
  heroTitle: {
    fontFamily: FONTS.serif,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: T.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    fontFamily: FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
    color: 'rgba(58,26,40,0.6)',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Benefits
  benefitsArea: { gap: 10, marginBottom: 24 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(135,114,112,0.10)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8,
    elevation: 1,
  },
  benefitGlyphWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(212,168,83,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,168,83,0.20)',
    marginRight: 12,
  },
  benefitGlyph: { fontSize: 16, color: T.brass },
  benefitText: {
    fontSize: 14,
    color: T.navy,
    fontFamily: FONTS.sansMedium,
    flex: 1,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(135,114,112,0.20)',
  },
  dividerLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
    color: 'rgba(58,26,40,0.55)',
    letterSpacing: 2.4,
    marginHorizontal: 12,
  },

  // CTA — peach→lavender HomeStyleCta-style pill
  ctaShadow: {
    borderRadius: 100,
    shadowColor: '#5C2434',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 260,
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  ctaText: {
    fontSize: 14,
    fontFamily: FONTS.sansSemiBold,
    color: '#1B1C1C',
    letterSpacing: 0.5,
  },

  // Secure caption
  secureRow: { alignItems: 'center', marginTop: 20 },
  secureText: {
    fontSize: 11,
    color: 'rgba(58,26,40,0.55)',
    fontFamily: FONTS.sans,
  },

  // Legal
  legalArea: { marginTop: 'auto', paddingTop: 24, paddingBottom: 16 },
  legalText: {
    fontSize: 11,
    color: 'rgba(58,26,40,0.55)',
    textAlign: 'center',
    lineHeight: 17,
    fontFamily: FONTS.sans,
  },
  legalLink: {
    color: T.brass,
    fontFamily: FONTS.sansSemiBold,
  },
});
