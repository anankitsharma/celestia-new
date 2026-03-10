import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import Stars from '../components/Stars';
import ChartWheel from '../components/ChartWheel';
import { useUserProfile } from '../contexts/UserProfileContext';

export default function WelcomeScreen({ navigation }) {
  const { userProfile } = useUserProfile();
  const chart = userProfile?.chart;
  const firstName = userProfile?.name?.split(' ')[0] || 'Stargazer';
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const big3 = [
    sun && `☉ ${sun.sign}`,
    moon && `☽ ${moon.sign}`,
    rising && `↑ ${rising.sign}`,
  ].filter(Boolean);

  const float = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.88)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -9, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.parallel([
      Animated.spring(scaleIn, { toValue: 1, delay: 300, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, delay: 750, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0E0E22', '#1A1060', '#0C1E3C']} locations={[0, 0.5, 1]} style={styles.container}>
      <Stars count={28} />

      <Animated.View style={[styles.wheelWrap, { transform: [{ translateY: float }, { scale: scaleIn }], opacity: scaleIn }]}>
        <View style={styles.zodiacRing}>
          <ChartWheel size={232} planets={chart?.planets} aspects={chart?.aspects} />
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
        <Text style={styles.desc}>
          Your natal chart has been cast.{sun ? ` The ${sun.sign} Sun` : ' The stars at the moment of your birth'} tells a unique cosmic story — your guide to understanding yourself and the world around you.
        </Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.replace('Main')}>
          <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.goldBtn}>
            <Text style={styles.goldBtnText}>Explore Your Chart →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: 24, paddingBottom: 36 },
  wheelWrap: { marginBottom: 30 },
  zodiacRing: {
    width: 232, height: 232, borderRadius: 116,
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: FONTS.serif, fontSize: 33, color: T.cream, marginBottom: 12, textAlign: 'center' },
  big3: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  b3pill: {
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)',
    borderRadius: 100, paddingVertical: 5, paddingHorizontal: 14,
  },
  b3text: { fontSize: 12, color: 'rgba(250,248,242,0.72)' },
  desc: {
    fontSize: 13, fontFamily: FONTS.sansLight, color: 'rgba(250,248,242,0.4)',
    textAlign: 'center', lineHeight: 21.5, paddingHorizontal: 8, marginBottom: 32,
  },
  goldBtn: {
    width: '100%', minWidth: 320, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.gold, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.35, shadowRadius: 26,
  },
  goldBtnText: { fontFamily: FONTS.sansMedium, fontSize: 15, color: T.navy },
});
