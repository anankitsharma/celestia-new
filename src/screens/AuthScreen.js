import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  StatusBar, ActivityIndicator, Alert, Image, Dimensions, Animated, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ReAnimated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
} from 'react-native-reanimated';
import { T, FONTS } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { onSignIn } = useAuth();
  const isOnboarding = route.params?.mode === 'onboarding';
  const [loading, setLoading] = useState(false);

  // Orbit animation
  const rotation = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(14);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(24);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withTiming(1, { duration: 600 });
    titleOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    titleTranslateY.value = withDelay(250, withTiming(0, { duration: 500 }));
    cardOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    cardTranslateY.value = withDelay(450, withTiming(0, { duration: 500 }));
    footerOpacity.value = withDelay(650, withTiming(1, { duration: 400 }));
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
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
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Hero header — matches app hero pattern */}
      <LinearGradient
        colors={['#0E0E22', '#2A1A6E', '#0C2040']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={s.hero}
      >
        {/* Back / Skip */}
        <View style={s.topControls}>
          {isOnboarding ? (
            <TouchableOpacity onPress={() => navigation.replace('Main')} style={s.skipBtn} activeOpacity={0.7}>
              <Text style={s.skipText}>Skip for now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backText}>{'‹'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Floating orb */}
        <ReAnimated.View style={[s.orbArea, logoStyle]}>
          <Animated.View style={{ transform: [{ translateY: float }], alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[s.orbitRing, { transform: [{ rotate: spin }] }]}>
              <View style={s.orbitDot} />
            </Animated.View>
            <View style={s.innerRing} />
            <LinearGradient
              colors={['#EDD060', '#C8A84B', '#8C6C18']}
              locations={[0, 0.5, 1]}
              style={s.orb}
            >
              <Text style={s.orbSymbol}>{'☽'}</Text>
            </LinearGradient>
          </Animated.View>
        </ReAnimated.View>

        {/* Title in hero */}
        <ReAnimated.View style={[s.heroTextArea, titleStyle]}>
          <Text style={s.heroTitle}>Welcome to Celestia</Text>
          <Text style={s.heroSub}>
            {isOnboarding
              ? 'Sign in to sync your cosmic journey'
              : 'Sign in to continue your journey'}
          </Text>
        </ReAnimated.View>
      </LinearGradient>

      {/* Body — light cream background */}
      <View style={s.body}>

        {/* Benefits — above login */}
        <ReAnimated.View style={[s.benefitsArea, cardStyle]}>
          {[
            { icon: '☁', text: 'Back up your chart to the cloud' },
            { icon: '🔄', text: 'Sync across all your devices' },
            { icon: '✦', text: 'Unlock your full cosmic profile' },
          ].map((b, i) => (
            <View key={i} style={s.benefitRow}>
              <View style={s.benefitIcon}><Text style={{ fontSize: 14 }}>{b.icon}</Text></View>
              <Text style={[s.benefitText, { color: colors.text }]}>{b.text}</Text>
            </View>
          ))}
        </ReAnimated.View>

        {/* Sign-in card */}
        <ReAnimated.View style={[s.card, cardStyle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardDivider}>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[s.cardLabel, { color: colors.textSecondary }]}>CONTINUE WITH</Text>
            <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={s.googleBtn}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={T.ink} />
            ) : (
              <View style={s.btnContent}>
                <Image
                  source={require('../../assets/google_logo.png')}
                  style={s.googleIcon}
                />
                <Text style={s.googleText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Decorative dots */}
          <View style={s.dotsRow}>
            {[0.15, 0.3, 0.5, 0.8, 0.5, 0.3, 0.15].map((o, i) => (
              <View key={i} style={[s.dot, { opacity: o }]} />
            ))}
          </View>

          <Text style={[s.secureText, { color: colors.textSecondary }]}>
            {'🔒'}  Your data is encrypted and secure
          </Text>
        </ReAnimated.View>

        {/* Legal */}
        <ReAnimated.View style={[s.legalArea, footerStyle]}>
          <Text style={[s.legalText, { color: colors.textSecondary }]}>
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
  container: { flex: 1, backgroundColor: T.cream },

  // Hero — matches app hero pattern with rounded bottom
  hero: {
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },

  // Top controls
  topControls: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 24, color: T.cream, marginTop: -2 },
  skipBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
  skipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    fontFamily: FONTS.sansMedium,
  },

  // Orb
  orbArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  orbitRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 0.8,
    borderColor: 'rgba(200,168,75,0.22)',
  },
  orbitDot: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.gold,
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  innerRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 0.5,
    borderColor: 'rgba(200,168,75,0.1)',
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  orbSymbol: { fontSize: 24, color: T.navy },

  // Hero text
  heroTextArea: { alignItems: 'center', paddingHorizontal: 24 },
  heroTitle: {
    fontFamily: FONTS.serifSemiBold,
    fontSize: 26,
    color: T.cream,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(250,248,242,0.55)',
    textAlign: 'center',
    fontFamily: FONTS.sans,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    justifyContent: 'flex-start',
  },

  // Card
  card: {
    backgroundColor: T.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  cardDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: T.border,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: FONTS.sansSemiBold,
    color: T.stone,
    letterSpacing: 2.5,
    marginHorizontal: 12,
  },

  // Google button
  googleBtn: {
    width: '100%',
    backgroundColor: T.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: T.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleText: {
    fontSize: 15,
    fontFamily: FONTS.sansSemiBold,
    color: T.cream,
    letterSpacing: 0.2,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 18,
    marginBottom: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: T.gold,
  },
  secureText: {
    fontSize: 11,
    color: T.stone,
    fontFamily: FONTS.sans,
  },

  // Benefits
  benefitsArea: {
    marginBottom: 18,
    paddingHorizontal: 4,
    gap: 6,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(200,168,75,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.12)',
  },
  benefitText: {
    fontSize: 14,
    color: T.ink,
    fontFamily: FONTS.sansMedium,
  },

  // Legal
  legalArea: { marginTop: 16 },
  legalText: {
    fontSize: 11,
    color: T.stone,
    textAlign: 'center',
    lineHeight: 17,
    fontFamily: FONTS.sans,
  },
  legalLink: {
    color: T.gold,
  },
});
